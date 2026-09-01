// The heart of the game.
//
//     We want to know what became of them — and every step closer makes us
//     easier to hear.
//
// Nine of the ten endings are gated on understanding, so understanding was
// always what the run was ABOUT. It was also the one thing that cost nothing:
// the Herald woke because you travelled fast and shot things, not because you
// were reading its grave. That had the tension backwards.
//
// Three things have to hold, and if any of them breaks the heart stops being one:
//
//   **Every source of understanding is heard.** Research, mechanisms, rune
//   lines, encounters, the rim of the Stargrave. A single path that grants it
//   for free is a hole the whole game leaks through.
//
//   **Staying quiet is not a strategy.** With low understanding only two endings
//   are reachable, so the question is never "should we be loud" but "how loud,
//   and when do we stop".
//
//   **The dial still switches it off.** Whoever does not want a Herald must be
//   able to turn the price off with it.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  HERO_ORDER,
  availableEndings,
  endingProspects,
  expeditionStep,
  startExpedition,
} from './expedition'
import { defaultDials } from '../../content/difficulty'
import type { ExpeditionState } from './types'

function ship(attention = 3): ExpeditionState {
  const s = startExpedition(
    31337,
    'medium',
    newArchive(),
    { ...defaultDials(), directives: 1, aboard: 1, attention },
    HERO_ORDER,
  )
  s.map.nodes.find((n) => n.id === s.at)!.resolved = true
  return s
}

/** Grant understanding through the ordinary encounter path. */
function learn(s: ExpeditionState, amount: number): ExpeditionState {
  const next = structuredClone(s)
  next.pendingEncounter = null
  next.debts.push({
    at: next.week,
    subject: null,
    note: { hu: 'tanultunk', en: 'we learned' },
    effects: [{ k: 'understanding', amount }],
  })
  return expeditionStep(next, { k: 'advanceWeek' })
}

describe('understanding is heard', () => {
  it('costs attention wherever it comes from', () => {
    const before = ship()
    const after = learn(before, 4)
    expect(after.understanding).toBeGreaterThan(before.understanding)
    expect(after.attention, 'learning was free').toBeGreaterThan(before.attention)
  })

  it('costs more the more of it you take', () => {
    const small = learn(ship(), 2)
    const large = learn(ship(), 8)
    expect(large.attention).toBeGreaterThan(small.attention)
  })

  it('is silent on the dial that switches the Herald off', () => {
    // The whole system has always been optional. The price has to be optional
    // with it, or turning the Herald off would leave a tax with nothing behind it.
    const quiet = ship(1)
    const after = learn(quiet, 8)
    expect(after.understanding).toBeGreaterThan(quiet.understanding)
    expect(after.attention).toBe(quiet.attention)
  })

  it('never charges for losing it', () => {
    const s = ship()
    s.understanding = 6
    const after = learn(s, -2)
    expect(after.understanding).toBe(4)
    expect(after.attention).toBeLessThanOrEqual(s.attention)
  })
})

describe('and staying quiet is not a strategy', () => {
  it('leaves exactly two ways to end a run that understood nothing', () => {
    const s = ship()
    s.understanding = 0
    expect(availableEndings(s).sort()).toEqual(['blindRuin', 'flee'])
  })

  it('says what every closed ending is waiting for', () => {
    const s = ship()
    s.understanding = 0
    const shut = endingProspects(s).filter((p) => !p.open)
    expect(shut.length).toBeGreaterThan(4)
    for (const prospect of shut) {
      expect(prospect.needs, `${prospect.id} is shut and says nothing`).not.toBeNull()
      expect(prospect.needs!.hu.length).toBeGreaterThan(4)
      expect(prospect.needs!.en.length).toBeGreaterThan(4)
    }
  })

  it('opens more of them as the understanding deepens', () => {
    const shallow = ship()
    shallow.understanding = 2
    const deep = ship()
    deep.understanding = 14
    expect(endingProspects(deep).filter((p) => p.open).length).toBeGreaterThan(
      endingProspects(shallow).filter((p) => p.open).length,
    )
  })
})
