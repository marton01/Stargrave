// Binding the pipe to the game.
//
// Everything here is plumbing between three things that already work on their
// own: the pure ordering logic in protocol.ts, the PeerJS adapter in peer.ts, and
// a game engine that is a pure function of (state, action).
//
// The one rule that keeps four machines identical: **a guest never applies its
// own action.** It sends an intent and waits for the host to echo it back with a
// number on it. The wait is a few tens of milliseconds, and in exchange there is
// exactly one order of events in the world rather than four hopeful ones.

import { useCallback, useEffect, useRef, useState } from 'react'
import { openRoom } from './peer'
import type { NetStatus, Transport } from './peer'
import { accept, newLockstep } from './protocol'
import type { NetMessage } from './protocol'
import { claimSeat, keyTag, pickHero, releaseSeat, seatByTag } from '../engine/session/room'
import type { PlayerIdentity, RoomState } from '../engine/session/room'
import type { ExpeditionAction } from '../engine/expedition/expedition'
import type { ExpeditionState } from '../engine/expedition/types'
import type { HeroClassId } from '../engine/types'

export type RoomNetwork = {
  status: NetStatus
  /** Am I the one putting actions in order? */
  isHost: boolean
  /** Take an action: applied here and sent on, or sent on and waited for. */
  dispatch: (action: ExpeditionAction) => void
  /** Sit down / stand up. Guests ask the host; the host just does it. */
  sit: (slot?: number) => void
  stand: (slot: number) => void
  /** Play a different hero. Guests ask; the host does it. */
  pick: (slot: number, heroClass: HeroClassId) => void
  /** Hand everybody the opening state. Host only. */
  begin: (expedition: ExpeditionState) => void
}

export function useRoomNetwork({
  room,
  identity,
  expedition,
  onApply,
  onRoom,
  onExpedition,
}: {
  room: RoomState | null
  identity: PlayerIdentity
  expedition: ExpeditionState | null
  /** Apply an action locally. The same call the offline game makes. */
  onApply: (action: ExpeditionAction) => void
  onRoom: (room: RoomState) => void
  onExpedition: (expedition: ExpeditionState) => void
}): RoomNetwork {
  const [status, setStatus] = useState<NetStatus>({ k: 'off' })
  /**
   * Bumped to make the connection effect run again.
   *
   * Somebody's browser reloading — the host's especially — drops every other
   * player's line, and nothing used to pick it back up: three people sat looking
   * at "the connection dropped" while the game was perfectly alive on the fourth
   * machine. So a lost line retries, and because the peer id is the room code,
   * retrying finds whoever is hosting now, even if that is a different person.
   */
  const [attempt, setAttempt] = useState(0)
  const transport = useRef<Transport | null>(null)
  const lockstep = useRef(newLockstep())
  /** Every action, in order. The host's copy is the one that counts. */
  const log = useRef<ExpeditionAction[]>([])
  /** Which connection belongs to which player, so intents can be checked. */
  const tags = useRef(new Map<string, string>())
  const names = useRef(new Map<string, string>())

  // Handlers read the live game through refs: they outlive any single render,
  // and a stale closure here would mean answering a join with last week's state.
  const latest = useRef({ room, expedition })
  latest.current = { room, expedition }

  const isHost = transport.current?.role === 'host'

  const handle = useCallback(
    (message: NetMessage, from: string) => {
      const pipe = transport.current
      if (!pipe) return
      const here = latest.current

      // ---------------------------------------------------------- as host
      if (pipe.role === 'host') {
        switch (message.k) {
          case 'hello': {
            tags.current.set(from, message.tag)
            names.current.set(from, message.name)
            if (here.room) {
              pipe.send(from, {
                k: 'snapshot',
                room: here.room,
                expedition: here.expedition,
                step: log.current.length,
              })
            }
            return
          }
          case 'sit': {
            const tag = tags.current.get(from)
            const name = names.current.get(from) ?? ''
            if (!tag || !here.room) return
            const updated = seatByTag(here.room, tag, name, message.slot)
            onRoom(updated)
            pipe.broadcast({ k: 'room', room: updated })
            return
          }
          case 'stand': {
            const tag = tags.current.get(from)
            if (!tag || !here.room) return
            const updated = releaseSeat(here.room, tag, message.slot)
            onRoom(updated)
            pipe.broadcast({ k: 'room', room: updated })
            return
          }
          case 'pick': {
            const tag = tags.current.get(from)
            if (!tag || !here.room) return
            const updated = pickHero(here.room, tag, message.slot, message.heroClass)
            onRoom(updated)
            pipe.broadcast({ k: 'room', room: updated })
            return
          }
          case 'intent': {
            // The host is the sequencer: number it, tell everybody, apply it.
            const step = log.current.length
            log.current.push(message.action)
            pipe.broadcast({ k: 'action', step, action: message.action })
            onApply(message.action)
            return
          }
          default:
            return
        }
      }

      // --------------------------------------------------------- as guest
      switch (message.k) {
        case 'snapshot': {
          lockstep.current = newLockstep(message.step)
          onRoom(message.room)
          if (message.expedition) onExpedition(message.expedition)
          return
        }
        case 'room':
          onRoom(message.room)
          return
        case 'begin':
          lockstep.current = newLockstep(0)
          onExpedition(message.expedition)
          return
        case 'action': {
          const out = accept(lockstep.current, message.step, message.action)
          lockstep.current = out.next
          for (const action of out.ready) onApply(action)
          return
        }
        default:
          return
      }
    },
    [onApply, onRoom, onExpedition],
  )

  // Open and close the connection with the room.
  useEffect(() => {
    if (!room || room.mode !== 'online') {
      transport.current?.close()
      transport.current = null
      setStatus({ k: 'off' })
      return
    }
    let live = true
    let retry = 0
    const onStatus = (next: NetStatus) => {
      setStatus(next)
      // Wait a moment and try again, a handful of times. Long enough that a
      // reloading host has come back up, short enough that nobody wonders
      // whether the game is dead.
      if (next.k === 'lost' && live && retry === 0) {
        retry = window.setTimeout(() => {
          if (live) setAttempt((n) => n + 1)
        }, 2500)
      }
    }

    openRoom(room.code, {
      onMessage: handle,
      onStatus,
      onJoin: () => {},
    }).then((pipe) => {
      if (!live) {
        pipe.close()
        return
      }
      transport.current = pipe
      // A guest announces itself; the host answers with everything it has.
      if (pipe.role === 'guest') {
        pipe.broadcast({ k: 'hello', tag: keyTag(identity.key), name: identity.name })
      }
    })
    return () => {
      live = false
      if (retry) window.clearTimeout(retry)
      transport.current?.close()
      transport.current = null
    }
    // The code is the address: reopening on anything else would drop the room
    // every time a seat changed. `attempt` is the deliberate exception — it is
    // how a dropped line gets picked back up.
  }, [room?.code, room?.mode, identity.key, identity.name, handle, attempt])

  const dispatch = useCallback(
    (action: ExpeditionAction) => {
      const pipe = transport.current
      const online = latest.current.room?.mode === 'online'
      if (!online || !pipe) {
        onApply(action)
        return
      }
      if (pipe.role === 'host') {
        const step = log.current.length
        log.current.push(action)
        pipe.broadcast({ k: 'action', step, action })
        onApply(action)
        return
      }
      // A guest waits for the echo rather than guessing at the order.
      pipe.send('host', { k: 'intent', action })
    },
    [onApply],
  )

  const sit = useCallback(
    (slot?: number) => {
      const pipe = transport.current
      const here = latest.current.room
      if (!here) return
      // Sitting down in an online room before the connection is up would claim
      // the chair in this browser's copy alone, and the host's snapshot would
      // quietly take it away again a second later. Nothing at all is the honest
      // answer; the lobby disables the buttons until there is a line.
      if (here.mode === 'online' && !pipe) return
      if (!pipe || pipe.role === 'host') {
        const updated = claimSeat(here, identity, slot)
        onRoom(updated)
        pipe?.broadcast({ k: 'room', room: updated })
        return
      }
      pipe.send('host', { k: 'sit', slot })
    },
    [identity, onRoom],
  )

  const stand = useCallback(
    (slot: number) => {
      const pipe = transport.current
      const here = latest.current.room
      if (!here) return
      if (here.mode === 'online' && !pipe) return
      if (!pipe || pipe.role === 'host') {
        const updated = releaseSeat(here, keyTag(identity.key), slot)
        onRoom(updated)
        pipe?.broadcast({ k: 'room', room: updated })
        return
      }
      pipe.send('host', { k: 'stand', slot })
    },
    [identity, onRoom],
  )

  const pick = useCallback(
    (slot: number, heroClass: HeroClassId) => {
      const pipe = transport.current
      const here = latest.current.room
      if (!here) return
      if (here.mode === 'online' && !pipe) return
      if (!pipe || pipe.role === 'host') {
        const updated = pickHero(here, keyTag(identity.key), slot, heroClass)
        onRoom(updated)
        pipe?.broadcast({ k: 'room', room: updated })
        return
      }
      pipe.send('host', { k: 'pick', slot, heroClass })
    },
    [identity, onRoom],
  )

  const begin = useCallback(
    (opening: ExpeditionState) => {
      log.current = []
      lockstep.current = newLockstep(0)
      transport.current?.broadcast({ k: 'begin', expedition: opening })
    },
    [],
  )

  return { status, isHost, dispatch, sit, stand, pick, begin }
}
