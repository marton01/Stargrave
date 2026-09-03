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
import { cooldownLeft, startCooldown } from './broker'
import { openRoom } from './peer'
import type { NetStatus, Transport } from './peer'
import { accept, newLockstep } from './protocol'
import type { NetMessage } from './protocol'
import {
  claimSeat,
  keyTag,
  pickHero,
  releaseSeat,
  renameSeat,
  seatByTag,
} from '../engine/session/room'
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
  /** Out of reconnection attempts: the line is not coming back on its own. */
  gaveUp: boolean
  /** Host only: end the room for everybody in it. */
  close: () => void
}

export function useRoomNetwork({
  room,
  active,
  identity,
  expedition,
  onApply,
  onRoom,
  onExpedition,
  onClosed,
}: {
  room: RoomState | null
  /**
   * Is this player actually at the table?
   *
   * A saved game restores its room, and an online room used to be dialled the
   * moment the page loaded — from the title screen, before anybody had asked for
   * anything. Whoever had once opened a room therefore reconnected to a dead
   * code on every single visit, for ever, and the console filled with websocket
   * failures before a single click. Anybody looking at that would conclude the
   * game was broken; it was the game phoning an empty room.
   *
   * So the line opens when somebody is at the table — the lobby or a running
   * expedition — and not while the archive is on screen.
   */
  active: boolean
  identity: PlayerIdentity
  expedition: ExpeditionState | null
  /** Apply an action locally. The same call the offline game makes. */
  onApply: (action: ExpeditionAction) => void
  onRoom: (room: RoomState) => void
  onExpedition: (expedition: ExpeditionState) => void
  /** The host closed the room: this session is over for everybody. */
  onClosed: () => void
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
  /**
   * Reconnection attempts before the game admits it cannot get through.
   *
   * Deliberately small. Every attempt that fails against a rate-limited address
   * refreshes the ban — the browser reports it as `Unexpected response code:
   * 429` on the websocket handshake — so trying harder is precisely the wrong
   * response to this failure. Three tries spans about seventeen seconds, which
   * still covers the ordinary case this exists for: a host reloading their page.
   */
  const MAX_ATTEMPTS = 3
  const transport = useRef<Transport | null>(null)
  const lockstep = useRef(newLockstep())
  /** Every action, in order. The host's copy is the one that counts. */
  const log = useRef<ExpeditionAction[]>([])
  /** Which connection belongs to which player, so intents can be checked. */
  const tags = useRef(new Map<string, string>())
  const names = useRef(new Map<string, string>())

  // Handlers read the live game through refs: they outlive any single render,
  // and a stale closure here would mean answering a join with last week's state.
  const latest = useRef({ room, expedition, identity })
  latest.current = { room, expedition, identity }

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
          case 'rename': {
            const tag = tags.current.get(from)
            names.current.set(from, message.name)
            if (!tag || !here.room) return
            const updated = renameSeat(here.room, tag, message.name)
            onRoom(updated)
            pipe.broadcast({ k: 'room', room: updated })
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
        case 'closed':
          onClosed()
          return
        default:
          return
      }
    },
    [onApply, onRoom, onExpedition, onClosed],
  )

  // Open and close the connection with the room.
  useEffect(() => {
    // Still serving a rate-limit cooldown. Dialling now would refresh the ban
    // rather than wait it out — see broker.ts.
    if (cooldownLeft() > 0) {
      transport.current?.close()
      transport.current = null
      setStatus({ k: 'lost', reason: 'cooldown' })
      return
    }
    if (!room || room.mode !== 'online' || !active) {
      transport.current?.close()
      transport.current = null
      setStatus({ k: 'off' })
      return
    }
    let live = true
    let retry = 0
    const onStatus = (next: NetStatus) => {
      setStatus(next)
      if (next.k !== 'lost' || !live || retry !== 0) return

      // Back off, and stop.
      //
      // This used to be a flat 2.5 seconds, for ever. When the signalling server
      // is simply not reachable — a blocked domain, a DNS filter, an ad-blocker,
      // a server having a bad hour — that is an infinite loop: a new peer, a new
      // websocket, a new failure, several times a minute, until the tab closes.
      // It fills the console with hundreds of identical errors, it buries the one
      // message that would tell you what is wrong, and against a free shared
      // service it is exactly the behaviour that gets an address rate-limited —
      // so the retry was making the problem worse for everybody in the house.
      //
      // Doubling, and then giving up, is both kinder and more honest: a line that
      // dropped comes back within a few seconds, and a line that was never there
      // stops pretending.
      if (attempt >= MAX_ATTEMPTS) {
        // Out of tries. Stop touching the broker for a while and say so: the
        // public one bans an address that keeps knocking, and a reload would
        // otherwise start the knocking over and keep the ban alive.
        startCooldown()
        return
      }
      const wait = Math.min(2500 * 2 ** attempt, 40000)
      retry = window.setTimeout(() => {
        if (live) setAttempt((n) => n + 1)
      }, wait)
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
    // The code is the address. NOTHING else may reopen the line — a name is not
    // an address, and putting `identity.name` in here meant the lobby's name box
    // destroyed and rebuilt the peer on every keystroke.
  }, [room?.code, room?.mode, active, identity.key, handle, attempt])

  /**
   * Tell the table when the name changes — without reconnecting.
   *
   * This is the other half of the fix above: the name still has to travel, it
   * just must not travel by way of a new WebRTC peer.
   */
  useEffect(() => {
    const pipe = transport.current
    const here = latest.current.room
    if (!pipe || !here || here.mode !== 'online') return
    if (pipe.role === 'host') {
      const updated = renameSeat(here, keyTag(identity.key), identity.name)
      onRoom(updated)
      pipe.broadcast({ k: 'room', room: updated })
      return
    }
    pipe.send('host', { k: 'rename', name: identity.name })
  }, [identity.name, identity.key, onRoom])

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
      // A GUEST sitting down before the line is up claims the chair in its own
      // browser alone, and the host's snapshot takes it away again a second
      // later — so nothing at all is the honest answer there.
      //
      // The person who opened the room is a different case entirely: their copy
      // IS the room. Making them wait for a websocket turned a network failure
      // into a locked door — no chair, no hero, no start, in their own game.
      // They may always act; the line only decides whether others can join.
      if (here.mode === 'online' && !pipe && here.hostKey !== keyTag(identity.key)) return
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
      if (here.mode === 'online' && !pipe && here.hostKey !== keyTag(identity.key)) return
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
      if (here.mode === 'online' && !pipe && here.hostKey !== keyTag(identity.key)) return
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

  /**
   * Tell everybody the room is finished, then hang up.
   *
   * Only the host can: they are the one holding the address, and once they let
   * go of it the room stops existing whatever anybody else does.
   */
  const close = useCallback(() => {
    transport.current?.broadcast({ k: 'closed' })
    // Give the message a moment to leave before the socket goes.
    setTimeout(() => {
      transport.current?.close()
      transport.current = null
    }, 150)
  }, [])

  return {
    status,
    isHost,
    dispatch,
    sit,
    stand,
    pick,
    begin,
    close,
    gaveUp: attempt >= MAX_ATTEMPTS,
  }
}
