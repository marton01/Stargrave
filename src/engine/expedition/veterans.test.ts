// The crew survive the expedition.
//
// This was the meta-layer's missing half. A run spends twenty weeks giving six
// people names, ranks, traits, somebody to look after them and a place on the
// ship — the epilogue reads out what became of each of them — and then they were
// gone, and the next expedition began with the same six strangers. The Archive
// counted points; it did not remember anybody.
//
// Three things have to hold, and the third is what gives the first two weight:
//
//   **They come back as themselves**: rank and traits intact.
//
//   **They come back stripped of the old ship**: no posting, no mentor, no
//   pairings, loyalty starting over. Those were facts about a voyage that ended.
//
//   **A lost ship takes them with it.** The roster IS the people aboard, so
//   losing the run empties it. Bringing them home has to be able to fail or it
//   is not an achievement.

import { describe, expect, it } from 'vitest'
import { VETERANS_KEPT, bankExpedition, newArchive, survivors } from './archive'
import { defaultDials } from '../../content/difficulty'
import { crewRank } from '../../content/crew'
import { startExpedition } from './expedition'
import type { ArchiveState, ExpeditionState } from './types'

function finished(outcome: ExpeditionState['outcome']): ExpeditionState {
  const s = startExpedition(4242, 'short', newArchive(), defaultDials())
  // Somebody who earned something worth carrying, and somebody who did not come back.
  s.crew[0]!.xp = 30
  s.crew[0]!.station = 'forge'
  s.crew[0]!.mentor = 'runesmith'
  s.crew[0]!.loyalty = 2
  s.crew[0]!.bonds = [{ with: s.crew[1]!.id, kind: 'trust' }]
  s.crew[1]!.alive = false
  s.outcome = outcome
  return s
}

const ending: ExpeditionState['outcome'] = { k: 'ending', id: 'witness', understanding: 6 }

describe('the ones who came home', () => {
  it('are kept with their rank and their traits', () => {
    const run = finished(ending)
    const after = bankExpedition(newArchive(), run)
    const veteran = after.veterans.find((c) => c.name === run.crew[0]!.name)
    expect(veteran, 'the mastered engineer did not come home').toBeDefined()
    expect(crewRank(veteran!)).toBe(crewRank(run.crew[0]!))
    expect(veteran!.traits).toEqual(run.crew[0]!.traits)
  })

  it('leave the old ship behind', () => {
    const kept = survivors(finished(ending))
    for (const member of kept) {
      expect(member.station, 'a posting on a ship they have left').toBeNull()
      expect(member.mentor).toBeNull()
      expect(member.bonds).toHaveLength(0)
      expect(member.weeksAboard).toBe(0)
      expect(member.loyalty, 'loyalty measured a voyage that is over').toBe(7)
    }
  })

  it('does not bring back the dead', () => {
    const run = finished(ending)
    const after = bankExpedition(newArchive(), run)
    expect(after.veterans.map((c) => c.name)).not.toContain(run.crew[1]!.name)
  })

  it('is capped, so a new expedition can still meet somebody new', () => {
    const run = finished(ending)
    expect(survivors(run).length).toBeLessThanOrEqual(VETERANS_KEPT)
  })
})

describe('and what happens to them otherwise', () => {
  it('empties the roster when the ship is lost', () => {
    const before: ArchiveState = { ...newArchive(), veterans: survivors(finished(ending)) }
    expect(before.veterans.length).toBeGreaterThan(0)
    for (const reason of ['hull', 'morale', 'gateClosed'] as const) {
      const after = bankExpedition(before, finished({ k: 'lost', reason }))
      expect(after.veterans, reason).toHaveLength(0)
    }
  })

  it('leaves the roster alone when the run is merely called off', () => {
    // Not something that happens in the fiction: it is a player putting the game
    // down. It must not kill anybody.
    const before: ArchiveState = { ...newArchive(), veterans: survivors(finished(ending)) }
    const after = bankExpedition(before, finished({ k: 'lost', reason: 'abandoned' }))
    expect(after.veterans).toEqual(before.veterans)
  })

  it('brings them home from turning back through the Gate', () => {
    const after = bankExpedition(
      newArchive(),
      finished({ k: 'ending', id: 'homecoming', understanding: 2 }),
    )
    expect(after.veterans.length).toBeGreaterThan(0)
  })
})

describe('and the next expedition', () => {
  it('sets out with them, by name', () => {
    const first = bankExpedition(newArchive(), finished(ending))
    const next = startExpedition(999, 'short', first, defaultDials())
    const names = next.crew.map((c) => c.name)
    for (const veteran of first.veterans) {
      expect(names, `${veteran.name} was left at home`).toContain(veteran.name)
    }
  })

  it('still has one of every speciality, filling the gaps with new hands', () => {
    const first = bankExpedition(newArchive(), finished(ending))
    const next = startExpedition(999, 'short', first, defaultDials())
    for (const speciality of ['engineer', 'scientist', 'guard', 'medic', 'navigator'] as const) {
      expect(next.crew.map((c) => c.speciality), speciality).toContain(speciality)
    }
    expect(next.crew).toHaveLength(6)
  })

  it('gives everybody an id this run can use', () => {
    // Everything else — postings, mentors, debts, pairings — points at people by
    // id, so a veteran arriving with last run's id would be a ghost.
    const first = bankExpedition(newArchive(), finished(ending))
    const next = startExpedition(999, 'short', first, defaultDials())
    const ids = next.crew.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const member of next.crew) expect(member.id).toMatch(/^crew-\d$/)
  })

  it('sets out with strangers when nobody came home', () => {
    const next = startExpedition(999, 'short', newArchive(), defaultDials())
    expect(next.crew).toHaveLength(6)
    expect(next.crew.every((c) => c.alive)).toBe(true)
  })
})
