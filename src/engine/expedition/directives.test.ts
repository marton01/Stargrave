// Orders from home: the shape of the middle of an expedition.
//
// These exist because weeks four to twenty had nothing pulling the ship anywhere
// in particular, and a run with no direction feels the same as the last one. An
// order is small and dated and belongs to ONE of the two players, which is the
// co-operative half of it: two people with different lists sharing one route.
//
// Two things must hold or an order is worse than nothing.
//
// It must never arrive already satisfied. "Win two landings" counting the two
// from last month reads as a bug even when the arithmetic is defensible, and it
// hands out a reward for nothing.
//
// And it must be answerable in the weeks it allows. An order that cannot be met
// is not pressure, it is a morale tax with a countdown on it.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import { directiveProgress, expeditionStep, startExpedition } from './expedition'
import { DIRECTIVE_DEFS } from '../../content/directives'
import { HERO_ORDER } from './expedition'
import { defaultDials } from '../../content/difficulty'
import type { ExpeditionState } from './types'

function ship(directives = 3): ExpeditionState {
  // The dials have to be in place before the expedition starts: the first orders
  // are issued at the Gate, so setting the dial afterwards would be too late.
  // The Herald is switched off — it would add noise to numbers this file measures.
  return startExpedition(555, 'medium', newArchive(), {
    ...defaultDials(),
    directives,
    attention: 1,
    aboard: 1,
  })
}

/** Weeks at a settled node, so nothing else happens while the clock runs. */
function weeks(s: ExpeditionState, count: number): ExpeditionState {
  let after = s
  after.map.nodes.find((n) => n.id === after.at)!.resolved = true
  for (let i = 0; i < count && !after.outcome; i++) {
    after = expeditionStep(after, { k: 'advanceWeek' })
  }
  return after
}

describe('what home asks for', () => {
  it('has orders waiting when the ship comes through the Gate', () => {
    const s = ship()
    expect(s.directives.filter((d) => d.state === 'open')).toHaveLength(2)
  })

  it('puts one on each console', () => {
    const s = ship()
    const owners = s.directives.map((d) => d.owner)
    expect(new Set(owners).size).toBe(2)
  })

  it('never issues one that is already satisfied', () => {
    // Twenty different runs, all of them mid-expedition with things already done.
    for (let seed = 1; seed <= 20; seed++) {
      const s = startExpedition(seed * 13, 'medium', newArchive())
      s.dials.attention = 1
      s.directives = []
      s.understanding = 9
      s.relics = ['ash-reliquary', 'binding-cord']
      s.tally = { ...s.tally, landingsWon: 4, puzzlesSolved: 3, researchDone: 2 }
      const issued = expeditionStep(s, { k: 'advanceWeek' })
      for (const d of issued.directives) {
        expect(
          directiveProgress(issued, d),
          `${d.kind} was issued at ${directiveProgress(issued, d)}/${d.target}`,
        ).toBeLessThan(d.target)
      }
    }
  })

  it('tops itself up to whatever the dial asks for, and stops at none', () => {
    expect(ship(1).directives.filter((d) => d.state === 'open')).toHaveLength(0)
    expect(ship(2).directives.filter((d) => d.state === 'open')).toHaveLength(1)
    expect(ship(5).directives.filter((d) => d.state === 'open')).toHaveLength(4)
  })

  it('never asks for two of the same thing at once', () => {
    const s = ship(5)
    const kinds = s.directives.filter((d) => d.state === 'open').map((d) => d.kind)
    expect(new Set(kinds).size).toBe(kinds.length)
  })

  it('gives every kind of order a deadline it could be met in', () => {
    for (const def of DIRECTIVE_DEFS) {
      expect(def.weeks(0), def.kind).toBeGreaterThanOrEqual(4)
      expect(def.target(0), def.kind).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('whose list it is', () => {
  it('gives every hero orders of their own', () => {
    // There was a stretch where only the Runeweaver and the Pastcaller owned any,
    // and the two seats that arrive with the third and fourth player had cards,
    // perks and duties but nothing home ever asked THEM for. An order is the one
    // thing that says out loud "this is your column, this is your week".
    for (const hero of HERO_ORDER) {
      expect(
        DIRECTIVE_DEFS.filter((def) => def.owner === hero).length,
        `${hero} has no orders of their own`,
      ).toBeGreaterThanOrEqual(2)
    }
  })

  it('never addresses an order to a chair nobody is sitting in', () => {
    // A two-player run has no Rite-caller. An order on her console would sit
    // there and fail on its own, and there is no worse kind of pressure than one
    // nobody can answer.
    for (let seed = 1; seed <= 25; seed++) {
      const s = startExpedition(seed * 7, 'medium', newArchive(), undefined, [
        'runesmith',
        'echoreader',
      ])
      s.dials.attention = 1
      s.dials.aboard = 1
      s.dials.directives = 5
      const issued = expeditionStep(s, { k: 'advanceWeek' })
      for (const d of issued.directives) {
        expect(['runesmith', 'echoreader'], `${d.kind} went to ${d.owner}`).toContain(d.owner)
      }
    }
  })
})

describe('carrying one out', () => {
  it('pays the console it sat on, and not the other one', () => {
    const s = ship()
    // Rewrite the live orders as one plain "reach this much understanding".
    const d = s.directives[0]!
    s.directives = [{ ...d, kind: 'understand', target: 5, startedAt: 0, due: s.week + 6 }]
    s.understanding = 6
    const owner = d.owner
    const other = owner === 'runesmith' ? 'echoreader' : 'runesmith'
    s.dials.directives = 1 // no replacements, so the counts stay readable

    const after = weeks(s, 1)
    expect(after.directives[0]!.state).toBe('done')
    expect(after.heroRecords[owner].marks).toBeGreaterThan(0)
    expect(after.heroRecords[other].marks).toBe(0)
  })

  it('pays only once, however many weeks pass afterwards', () => {
    const s = ship()
    const d = s.directives[0]!
    s.directives = [{ ...d, kind: 'understand', target: 5, startedAt: 0, due: s.week + 6 }]
    s.understanding = 6
    s.dials.directives = 1

    const once = weeks(s, 1)
    const marks = once.heroRecords[d.owner].marks
    const later = weeks(once, 3)
    expect(later.heroRecords[d.owner].marks).toBe(marks)
  })

  it('measures progress from where the run stood when the order came', () => {
    const s = ship()
    const d = s.directives[0]!
    s.tally = { ...s.tally, landingsWon: 5 }
    s.directives = [
      { ...d, kind: 'clearSites', target: 2, startedAt: 5, due: s.week + 6, state: 'open' },
    ]
    // Five landings already won, and the order still wants two more.
    expect(directiveProgress(s, s.directives[0]!)).toBe(0)
  })
})

describe('missing one', () => {
  it('costs morale when the deadline passes', () => {
    const s = ship()
    const d = s.directives[0]!
    s.directives = [{ ...d, kind: 'understand', target: 99, startedAt: 0, due: s.week + 1 }]
    s.dials.directives = 1
    const morale = s.resources.morale

    const after = weeks(s, 1)
    expect(after.directives[0]!.state).toBe('failed')
    expect(after.resources.morale).toBeLessThan(morale)
  })

  it('does not take morale for failing an order about morale', () => {
    // The loop that closes on itself: the ship sags, so the order to keep spirits
    // up fails, so the ship sags further, and nothing the players do can catch
    // it. A smoke run went from eleven morale to none in three weeks down this
    // exact path. Home can be disappointed without the crew paying twice.
    const s = ship()
    const d = s.directives[0]!
    s.directives = [{ ...d, kind: 'morale', target: 99, startedAt: 0, due: s.week + 1 }]
    s.dials.directives = 1
    s.dials.aboard = 1
    s.dials.attention = 1

    const after = weeks(s, 1)
    expect(after.directives[0]!.state).toBe('failed')
    // It is still in the log — the players are told it was missed.
    expect(after.log.some((entry) => entry.event.k === 'directiveFailed')).toBe(true)
    // Whatever else the week did, no morale was charged FOR the failure: the only
    // way to state that cleanly is that the week is no worse than a week with the
    // same order still open.
    const open = weeks(
      { ...s, directives: [{ ...s.directives[0]!, due: s.week + 9 }] } as typeof s,
      1,
    )
    expect(after.resources.morale).toBe(open.resources.morale)
  })

  it('judges the "have this much at the deadline" kinds only at the deadline', () => {
    const s = ship()
    const d = s.directives[0]!
    s.directives = [{ ...d, kind: 'morale', target: 8, startedAt: 0, due: s.week + 3 }]
    s.dials.directives = 1
    // Morale is already at eight, and the order is still open: it is about where
    // things stand when the week comes, not about touching the number once.
    const early = weeks(s, 1)
    expect(early.directives[0]!.state).toBe('open')
  })
})
