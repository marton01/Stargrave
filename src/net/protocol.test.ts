// Ordering, duplicates and catching up.
//
// The reason this is worth testing without a network at all: the failure it
// guards against is invisible. If one machine applies two actions in the wrong
// order, nothing crashes — both players carry on looking at a working game, and
// half an hour later one of them says "what do you mean the Herald is three
// columns away, it is right on top of us". Determinism is only worth having if
// the order is worth trusting.

import { describe, expect, it } from 'vitest'
import { accept, catchUpFrom, newLockstep, peerIdFor } from './protocol'
import { roomCode } from '../engine/session/room'
import type { ExpeditionAction } from '../engine/expedition/expedition'

const A: ExpeditionAction = { k: 'advanceWeek' }
const B: ExpeditionAction = { k: 'openScreen', screen: 'starmap' }
const C: ExpeditionAction = { k: 'engageNode' }

describe('keeping the order', () => {
  it('applies actions as they come, when they come in order', () => {
    let ls = newLockstep()
    const seen: ExpeditionAction[] = []
    for (const [step, action] of [A, B, C].entries()) {
      const out = accept(ls, step, action)
      ls = out.next
      seen.push(...out.ready)
    }
    expect(seen).toEqual([A, B, C])
    expect(ls.step).toBe(3)
  })

  it('holds one that arrives early, then releases the run in order', () => {
    let ls = newLockstep()
    // The third arrives first, then the second: nothing may be applied yet.
    let out = accept(ls, 2, C)
    ls = out.next
    expect(out.ready).toEqual([])
    out = accept(ls, 1, B)
    ls = out.next
    expect(out.ready).toEqual([])
    // And now the first, which unblocks all three at once and in order.
    out = accept(ls, 0, A)
    expect(out.ready).toEqual([A, B, C])
    expect(out.next.step).toBe(3)
    expect(out.next.held).toEqual({})
  })

  it('drops a duplicate rather than applying it twice', () => {
    let ls = newLockstep()
    ls = accept(ls, 0, A).next
    const again = accept(ls, 0, A)
    expect(again.ready).toEqual([])
    expect(again.next.step).toBe(1)
  })

  it('lets a machine that joined late be caught up from where it is', () => {
    const log = [A, B, C]
    const messages = catchUpFrom(log, 1)
    expect(messages).toEqual([
      { k: 'action', step: 1, action: B },
      { k: 'action', step: 2, action: C },
    ])

    // And feeding exactly those to a fresh lockstep at step 1 works.
    let ls = newLockstep(1)
    const seen: ExpeditionAction[] = []
    for (const message of messages) {
      if (message.k !== 'action') continue
      const out = accept(ls, message.step, message.action)
      ls = out.next
      seen.push(...out.ready)
    }
    expect(seen).toEqual([B, C])
  })

  it('sends nothing to a machine that is already up to date', () => {
    expect(catchUpFrom([A, B], 2)).toEqual([])
  })
})

describe('the address of a room', () => {
  it('is the same for everybody holding the code, so anybody can re-host', () => {
    const code = roomCode({ seed: 555, length: 'medium', players: 3 })
    expect(peerIdFor(code)).toBe(peerIdFor(code.toLowerCase()))
    expect(peerIdFor(code)).toContain(code.toLowerCase())
  })
})
