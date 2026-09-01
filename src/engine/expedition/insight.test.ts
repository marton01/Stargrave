// What only one player can see.
//
// This exists to answer the question a co-operative game most often fails: if
// you replaced one player with an automaton, would the evening change? While
// every screen showed every player the same facts, the honest answer was no —
// the table's best strategist could work out all four seats and everybody else
// became a pair of hands.
//
// So the things that have to hold are about coverage and about action:
//
//   **Everybody has something.** A hero with nothing to read is a hero nobody
//   needs to ask, which is the seat that quietly stops mattering.
//
//   **It is worth saying out loud.** A reading has to move when the ship's
//   situation moves; a line that says the same thing on a healthy ship and a
//   dying one is decoration.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import { HERO_ORDER, expeditionStep, startExpedition } from './expedition'
import { privateReading, readingHeading } from './insight'
import { defaultDials } from '../../content/difficulty'
import type { ExpeditionState } from './types'

function ship(): ExpeditionState {
  return startExpedition(1234, 'medium', newArchive(), defaultDials(), HERO_ORDER)
}

describe('every seat knows something', () => {
  it('gives all four of them something only they can see', () => {
    const s = ship()
    for (const hero of HERO_ORDER) {
      const readings = privateReading(s, hero)
      expect(readings.length, `${hero} has nothing to tell the table`).toBeGreaterThan(0)
      for (const reading of readings) {
        expect(reading.text.hu.length, hero).toBeGreaterThan(8)
        expect(reading.text.en.length, hero).toBeGreaterThan(8)
      }
      expect(readingHeading(hero).hu.length).toBeGreaterThan(4)
    }
  })

  it('says different things on a healthy ship and a failing one', () => {
    const well = ship()
    well.resources.hull = 20
    well.resources.fuel = 30
    well.attention = 0
    for (const member of well.crew) member.loyalty = 9

    const badly = ship()
    badly.resources.hull = 4
    badly.resources.fuel = 1
    badly.attention = 6
    for (const member of badly.crew) member.loyalty = 2

    for (const hero of HERO_ORDER) {
      const a = JSON.stringify(privateReading(well, hero))
      const b = JSON.stringify(privateReading(badly, hero))
      expect(a, `${hero} reads the same on a healthy ship and a dying one`).not.toBe(b)
    }
  })

  it('is the only place the departure date is written', () => {
    // The crew list shows everybody a band. The date somebody has set on
    // themselves is the Rite-caller's to say — that is the reading the table
    // cannot get any other way, and the reason they have to ask her.
    let s = ship()
    s.resources.morale = 1
    s.power.lifeSupport = 0
    for (const member of s.crew) member.loyalty = 0
    s.dials.aboard = 1
    s = expeditionStep(s, { k: 'advanceWeek' })
    if (!s.debts.some((d) => d.kind === 'leaving')) return

    const hers = JSON.stringify(privateReading(s, 'cantor'))
    expect(hers).toMatch(/hét múlva lelép|walks in/)
    for (const other of ['runesmith', 'echoreader', 'surveyor'] as const) {
      expect(JSON.stringify(privateReading(s, other))).not.toMatch(/hét múlva lelép|walks in/)
    }
  })

  it('is a pure reading of the shared state, never a second copy of it', () => {
    // The room runs in lockstep on one seed. A private FACT would break it; only
    // who is shown a fact may be private.
    const s = ship()
    const before = JSON.stringify(s)
    for (const hero of HERO_ORDER) privateReading(s, hero)
    expect(JSON.stringify(s)).toBe(before)
  })
})
