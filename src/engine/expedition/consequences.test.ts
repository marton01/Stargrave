// Consequences: that a decision leaves a mark, and that the mark is answered.
//
// The rule these tests exist to hold is a content rule, not a code one: a
// situation must not promise a consequence it never delivers. "It sets off
// somewhere, and its heading is not random" is a fine line to read once and a
// broken promise if nothing ever comes of it.
//
// So the first test walks the whole encounter set and insists that every flag or
// mark a decision writes is read by something. It is the kind of thing that is
// true on the day it is written and quietly false four encounters later, which is
// exactly what a test is for.

import { describe, expect, it } from 'vitest'
import { ENCOUNTERS, CARRIED_ENCOUNTERS, encountersFor } from '../../content/encounters'
import { availableEndings, expeditionStep, startExpedition } from './expedition'
import {
  bankExpedition,
  canUnlock,
  DEEP_MARKS,
  ENDINGS_BEFORE_LAST,
  newArchive,
} from './archive'
import type { Encounter } from '../../content/encounters'
import type { ArchiveState, ExpeditionState } from './types'

const ALL: Encounter[] = [...ENCOUNTERS, ...CARRIED_ENCOUNTERS]

/** Ids written by a decision, and ids read by something. */
function ledger() {
  const setFlags = new Set<string>()
  const setMarks = new Set<string>()
  const readFlags = new Set<string>()
  const readMarks = new Set<string>()
  const chainTargets = new Set<string>()

  for (const e of ALL) {
    if (e.requiresFlag) readFlags.add(e.requiresFlag)
    if (e.requiresMark) readMarks.add(e.requiresMark)
    for (const choice of e.choices) {
      const need = choice.requires
      if (need?.k === 'flag' || need?.k === 'noFlag') readFlags.add(need.id)
      if (need?.k === 'mark') readMarks.add(need.id)
      for (const effect of choice.effects) {
        if (effect.k === 'flag') setFlags.add(effect.id)
        if (effect.k === 'mark') setMarks.add(effect.id)
        if (effect.k === 'then') chainTargets.add(effect.encounterId)
      }
    }
  }
  return { setFlags, setMarks, readFlags, readMarks, chainTargets }
}

describe('encounter consequences', () => {
  it('answers every flag a decision writes', () => {
    const { setFlags, readFlags } = ledger()
    const unanswered = [...setFlags].filter((id) => !readFlags.has(id))
    expect(unanswered, `flags nothing ever asks about: ${unanswered.join(', ')}`).toEqual([])
  })

  it('answers every mark a decision leaves for a later run', () => {
    const { setMarks, readMarks } = ledger()
    // A mark is answered either by an encounter that asks for it, or by being one
    // of the ends of a thread that the closing arc reads. Nothing else counts.
    const unanswered = [...setMarks].filter(
      (id) => !readMarks.has(id) && !DEEP_MARKS.includes(id as (typeof DEEP_MARKS)[number]),
    )
    expect(unanswered, `marks nothing ever asks about: ${unanswered.join(', ')}`).toEqual([])
  })

  it('chains only to encounters that exist, and only to chained ones', () => {
    const { chainTargets } = ledger()
    for (const id of chainTargets) {
      const target = ALL.find((e) => e.id === id)
      expect(target, `no such encounter: ${id}`).toBeDefined()
      // A scene reached through a chain must not also turn up on its own, or the
      // second half of a situation could arrive without the first.
      expect(target?.chained, `${id} is a chain target but not marked chained`).toBe(true)
    }
  })

  it('keeps chained scenes out of the random pool', () => {
    const chained = ALL.filter((e) => e.chained).map((e) => e.id)
    const pool = encountersFor(
      ['drift', 'station', 'world', 'anomaly', 'ruins', 'distress', 'trade'],
      [],
      true,
      [],
      [],
    ).map((e) => e.id)
    for (const id of chained) expect(pool).not.toContain(id)
  })

  it('keeps a follow-up out of the pool until its flag is set', () => {
    const tags = ['ruins', 'anomaly', 'drift'] as const
    const without = encountersFor(tags, [], true, [], []).map((e) => e.id)
    expect(without).not.toContain('wraith-returns')

    const with_ = encountersFor(tags, [], true, ['wraith-freed'], []).map((e) => e.id)
    expect(with_).toContain('wraith-returns')
  })

  it('keeps a carried encounter out of the pool until an earlier run marked it', () => {
    const tags = ['ruins', 'anomaly', 'drift'] as const
    expect(encountersFor(tags, [], true, [], []).map((e) => e.id)).not.toContain('guide-again')
    expect(
      encountersFor(tags, [], true, [], ['refused-the-guide']).map((e) => e.id),
    ).toContain('guide-again')
  })
})

// ------------------------------------------------------------------ the run

/** An expedition with the encounter of our choosing on the table. */
function withEncounter(archive: ArchiveState, id: string): ExpeditionState {
  const s = startExpedition(1234, 'medium', archive)
  s.pendingEncounter = { id, chosen: null, payment: [], resolvedText: null }
  s.screen = 'encounter'
  return s
}

describe('a decision through the engine', () => {
  it('is only taken on confirmation, and can be taken back before it', () => {
    let s = withEncounter(newArchive(), 'wounded-wraith')
    const moraleBefore = s.resources.morale

    s = expeditionStep(s, { k: 'encounterChoose', index: 0 })
    expect(s.pendingEncounter?.chosen).toBe(0)
    // Nothing has happened yet: picking is not taking.
    expect(s.resources.morale).toBe(moraleBefore)
    expect(s.flags).not.toContain('wraith-freed')

    s = expeditionStep(s, { k: 'encounterCancel' })
    expect(s.pendingEncounter?.chosen).toBeNull()
    expect(s.flags).not.toContain('wraith-freed')

    s = expeditionStep(s, { k: 'encounterChoose', index: 0 })
    s = expeditionStep(s, { k: 'encounterConfirm' })
    expect(s.flags).toContain('wraith-freed')
    expect(s.resources.morale).toBeGreaterThan(moraleBefore)
  })

  it('opens the next scene when the result is closed, not before', () => {
    let s = withEncounter(newArchive(), 'wraith-returns')
    s = expeditionStep(s, { k: 'encounterChoose', index: 0 })
    s = expeditionStep(s, { k: 'encounterConfirm' })

    // The result of this scene is on screen; the next one is waiting behind it.
    expect(s.pendingEncounter?.id).toBe('wraith-returns')
    expect(s.pendingEncounter?.then).toBe('wraith-deep')

    s = expeditionStep(s, { k: 'encounterClose' })
    expect(s.pendingEncounter?.id).toBe('wraith-deep')
    expect(s.screen).toBe('encounter')
  })

  it('carries a mark into the Archive and back out into the next run', () => {
    let s = withEncounter(newArchive(), 'wraith-returns')
    s = expeditionStep(s, { k: 'encounterChoose', index: 1 })
    s = expeditionStep(s, { k: 'encounterConfirm' })
    expect(s.marks).toContain('refused-the-guide')

    const archive = bankExpedition(newArchive(), s)
    expect(archive.marks).toContain('refused-the-guide')

    const next = startExpedition(99, 'medium', archive)
    expect(next.marks).toContain('refused-the-guide')
    // And the flags of the finished run do not come along.
    expect(next.flags).not.toContain('wraith-freed')
  })

  it('moves the Darkening for good, and keeps the reactor honest', () => {
    let s = withEncounter(newArchive(), 'wraith-chorus')
    // "We keep it": Darkening +1 and a boarding fight.
    s = expeditionStep(s, { k: 'encounterChoose', index: 1 })
    s = expeditionStep(s, { k: 'encounterConfirm' })
    expect(s.darkeningShift).toBe(1)
    expect(s.darkening).toBeGreaterThanOrEqual(1)

    // The shift survives the recalculation that happens every week, and the
    // power allocation never exceeds what the reactor now gives.
    const before = s.darkening
    s.activeMission = null
    s.pendingEncounter = null
    s = expeditionStep(s, { k: 'advanceWeek' })
    expect(s.darkening).toBeGreaterThanOrEqual(before)
    const used = Object.values(s.power).reduce((a, b) => a + b, 0)
    expect(used).toBeLessThanOrEqual(s.reactorOutput)
  })
})

describe('the closing arc', () => {
  it('is not for sale until every ending is seen and threads were followed', () => {
    const archive = { ...newArchive(), points: 100 }
    expect(canUnlock(archive, 'last-question')).toBe(false)

    // Five endings, but nothing followed through: not enough.
    const seenAll = { ...archive, endingsSeen: [...ENDINGS_BEFORE_LAST] }
    expect(canUnlock(seenAll, 'last-question')).toBe(false)

    // One thread: still not enough.
    const oneThread = { ...seenAll, marks: [DEEP_MARKS[0]] }
    expect(canUnlock(oneThread, 'last-question')).toBe(false)

    const twoThreads = { ...seenAll, marks: [DEEP_MARKS[0], DEEP_MARKS[1]] }
    expect(canUnlock(twoThreads, 'last-question')).toBe(true)
  })

  it('needs the question bought and the understanding to answer it', () => {
    const plain = startExpedition(7, 'medium', newArchive())
    plain.understanding = 100
    expect(availableEndings(plain)).not.toContain('theAnswer')

    const bought = {
      ...newArchive(),
      unlocked: ['last-question' as const],
      endingsSeen: [...ENDINGS_BEFORE_LAST],
    }
    const s = startExpedition(7, 'medium', bought)
    expect(s.flags).toContain('last-question')

    s.understanding = 0
    expect(availableEndings(s)).not.toContain('theAnswer')
    s.understanding = 100
    expect(availableEndings(s)).toContain('theAnswer')
  })

  it('marks the Archive finished once the answer is given', () => {
    const archive = {
      ...newArchive(),
      unlocked: ['last-question' as const],
      endingsSeen: [...ENDINGS_BEFORE_LAST],
    }
    const s = startExpedition(7, 'medium', archive)
    s.understanding = 100
    const ended = expeditionStep(s, { k: 'chooseEnding', endingId: 'theAnswer' })
    expect(ended.outcome).toEqual({ k: 'ending', id: 'theAnswer', understanding: 100 })

    const banked = bankExpedition(archive, ended)
    expect(banked.completed).toBe(true)
    expect(banked.endingsSeen).toContain('theAnswer')
  })
})
