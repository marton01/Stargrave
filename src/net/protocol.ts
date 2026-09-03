// What travels between the players, and in what order.
//
// The whole networking design rests on one property of this game: the expedition
// engine is a pure function of (state, action), and every random draw comes from
// a seed and a counter that live inside the state. So four machines that apply
// the same actions in the same order hold bitwise identical galaxies, and the
// network never has to carry a game state at all — only the actions.
//
// That is why this file is the interesting half of the networking and the PeerJS
// adapter next door is dull plumbing: ordering, deduplication and catching up
// are the parts that can go wrong, and they are all pure functions here, with
// tests. The socket is just a pipe.
//
// The host is not an authority on the RULES — everybody runs the same engine, so
// there is nothing to cheat with — it is an authority on the ORDER. Somebody has
// to decide whether Anna's move or Bea's move was first, and doing that in one
// place is the entire reason the host exists.

import type { ExpeditionAction } from '../engine/expedition/expedition'
import type { ExpeditionState } from '../engine/expedition/types'
import type { RoomState } from '../engine/session/room'
import type { HeroClassId } from '../engine/types'

/** Everything a player can send. Small on purpose: actions, not states. */
export type NetMessage =
  /** Guest → host, on connecting: this is who I am. */
  | { k: 'hello'; tag: string; name: string }
  /** Host → one guest: the room and the run, as they stand. */
  | {
      k: 'snapshot'
      room: RoomState
      expedition: ExpeditionState | null
      /** How many actions the host has already applied. */
      step: number
    }
  /** Host → all: the seating changed. */
  | { k: 'room'; room: RoomState }
  /** Guest → host: I would like to do this. */
  | { k: 'intent'; action: ExpeditionAction }
  /**
   * Host → all: this room is finished, go home.
   *
   * The one thing whoever opened a room could not do was close it. Everybody
   * could walk out of it, and the room stayed standing in a dozen browsers with
   * no way to say "that evening is over" — so the list of rooms only ever grew,
   * and a code you had given out stayed live for anybody who kept it.
   *
   * It is a courtesy, not a lock: a guest who kept their copy could open the
   * same code again. What it does is end the session for everybody in it and
   * take the room off their lists, which is what closing a room means at a
   * table.
   */
  | { k: 'closed' }
  /** Guest → host: call this run something. The host owns the room state. */
  | { k: 'rename'; name: string }
  /** Host → all: this action, at this position in the order. */
  | { k: 'action'; step: number; action: ExpeditionAction }
  /**
   * Guest → host: my name changed.
   *
   * A name is not an address. It used to be part of the connection's identity,
   * which meant every keystroke in the lobby's name box tore the peer down and
   * built a new one — see `useRoomNetwork`.
   */
  | { k: 'rename'; name: string }
  /** Guest → host: seat me (in this chair, or any free one). */
  | { k: 'sit'; slot?: number }
  /** Guest → host, or host about anybody: empty this chair. */
  | { k: 'stand'; slot: number }
  /** Guest → host: I would like to play this one. */
  | { k: 'pick'; slot: number; heroClass: HeroClassId }
  /** Host → all: the expedition has begun. Carries the whole opening state. */
  | { k: 'begin'; expedition: ExpeditionState }
  /** Either way: still here. */
  | { k: 'ping' }

/**
 * How far along this machine is, and what has arrived early.
 *
 * `step` counts actions applied, so it is also the number of the next one
 * expected. Anything that arrives ahead of its turn waits in `held` rather than
 * being applied out of order — over one connection that should never happen, but
 * "should never happen" is exactly the sort of thing that ends up as a galaxy
 * that quietly differs on one machine.
 */
export type Lockstep = {
  step: number
  held: Record<number, ExpeditionAction>
}

export function newLockstep(step = 0): Lockstep {
  return { step, held: {} }
}

/**
 * Take in a numbered action and hand back whatever can now be applied, in order.
 *
 * Three cases, and all three happen in practice:
 *  - the next one: apply it, and anything held that follows on from it;
 *  - one we have already applied: a duplicate, dropped;
 *  - one from the future: held until the gap fills.
 */
export function accept(
  ls: Lockstep,
  step: number,
  action: ExpeditionAction,
): { next: Lockstep; ready: ExpeditionAction[] } {
  if (step < ls.step) return { next: ls, ready: [] }

  const held = { ...ls.held, [step]: action }
  const ready: ExpeditionAction[] = []
  let at = ls.step
  while (held[at]) {
    ready.push(held[at]!)
    delete held[at]
    at += 1
  }
  return { next: { step: at, held }, ready }
}

/** Everything the host has to send a machine that is `from` steps behind. */
export function catchUpFrom(log: ExpeditionAction[], from: number): NetMessage[] {
  return log.slice(from).map((action, i) => ({ k: 'action', step: from + i, action }))
}

/**
 * The peer id a room code opens.
 *
 * Deriving it from the code rather than inventing one is what lets ANY player
 * re-host a game: whoever opens the code first and finds nobody there takes the
 * id, and the others find them. A host who goes to bed does not take the room
 * with them.
 */
export function peerIdFor(code: string): string {
  return `stargrave-${code.toLowerCase()}`
}

/** Is this message one only the host should act on? */
export function isForHost(message: NetMessage): boolean {
  return (
    message.k === 'hello' ||
    message.k === 'rename' ||
    message.k === 'intent' ||
    message.k === 'sit' ||
    message.k === 'stand' ||
    message.k === 'pick'
  )
}
