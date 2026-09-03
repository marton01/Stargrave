// A run that counts nowhere.
//
// The whole value of a practice run is that pressing the wrong button costs
// nothing. That is one promise, and it is only worth making if it holds
// completely: not "no points" but nothing at all — no points, no ending
// recorded, no unlock progress, nothing added to the long memory that later runs
// read.
//
// It is enforced at the single door into the Archive rather than at each of the
// things it would otherwise touch, because a guard per system is a guard that
// gets forgotten the next time a system is added.

import { describe, expect, it } from 'vitest'
import { bankExpedition, newArchive } from './archive'
import { defaultDials } from '../../content/difficulty'
import { expeditionStep, startExpedition } from './expedition'
import type { ExpeditionState } from './types'

function run(tutorial: boolean): ExpeditionState {
  const s = startExpedition(4242, 'short', newArchive(), defaultDials(), undefined, tutorial)
  // Something worth banking: points earned, an ending reached, a mark laid down.
  s.archiveEarned = 12
  s.understanding = 16
  s.marks = ['followed-the-guide']
  s.outcome = { k: 'ending', id: 'communion', understanding: 16 }
  return s
}

describe('a practice run', () => {
  it('says it is one, on the state itself', () => {
    expect(run(true).tutorial).toBe(true)
    expect(run(false).tutorial).toBe(false)
  })

  it('leaves the Archive exactly as it was', () => {
    const before = newArchive()
    const after = bankExpedition(before, run(true))
    expect(after).toEqual(before)
  })

  it('records no points, no ending and no memory', () => {
    const after = bankExpedition(newArchive(), run(true))
    expect(after.points).toBe(0)
    expect(after.endingsSeen).toHaveLength(0)
    expect(after.marks).toHaveLength(0)
    expect(after.history).toHaveLength(0)
  })

  it('is the only thing that stops it — a real run banks all of that', () => {
    // The other half of the promise: the guard must not be quietly swallowing
    // real expeditions too.
    const after = bankExpedition(newArchive(), run(false))
    expect(after.points).toBeGreaterThan(0)
    expect(after.endingsSeen).toContain('communion')
    expect(after.marks).toContain('followed-the-guide')
    expect(after.history).toHaveLength(1)
  })

  it('plays the game as designed, not a softened version of it', () => {
    // Every system is on. The point of a practice run is to MEET them, not to be
    // protected from them — an earlier draft switched four of them off and would
    // have taught a group the wrong game.
    const s = startExpedition(4242, 'short', newArchive(), defaultDials(), undefined, true)
    for (const dial of ['attention', 'directives', 'aboard'] as const) {
      expect(s.dials[dial], dial).toBeGreaterThan(1)
    }
  })

  it('survives being played and put away', () => {
    let s = startExpedition(909, 'short', newArchive(), defaultDials(), undefined, true)
    s.map.nodes.find((n) => n.id === s.at)!.resolved = true
    for (let i = 0; i < 4 && !s.outcome; i++) {
      s = expeditionStep(s, { k: 'advanceWeek' })
      if (s.pendingEncounter) {
        s = expeditionStep(s, { k: 'encounterChoose', index: 0 })
        s = expeditionStep(s, { k: 'encounterConfirm' })
        s = expeditionStep(s, { k: 'encounterClose' })
      }
    }
    expect(s.tutorial, 'the flag was lost somewhere in a week').toBe(true)
    expect(bankExpedition(newArchive(), s)).toEqual(newArchive())
  })
})
