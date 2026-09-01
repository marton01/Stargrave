// The crew as people rather than counters.
//
// A crew member used to be a fixed card: the same name and the same two traits in
// week one and in week twenty-eight. So there was never a reason to keep anybody
// anywhere — a body was a body, moving people around cost nothing, and losing one
// was a number going down.
//
// Work counts now. Weeks on a running station make a rank, a rank makes the
// station better, and the master rank teaches the person something. On top of
// that each of the two players may take a few of them under their wing, which is
// the smallest possible piece of the crew list that belongs to somebody.
//
// The rule this file exists to keep: a rank must be worth having. If time served
// does not show up in what a station produces then the whole thing is a label.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  expeditionStep,
  labOutput,
  menteesOf,
  startExpedition,
  stationStrength,
} from './expedition'
import { startMission } from '../battle'
import { RANK_XP, crewRank } from '../../content/crew'
import { defaultDials } from '../../content/difficulty'
import type { ExpeditionState } from './types'

function ship(): ExpeditionState {
  const s = startExpedition(808, 'medium', newArchive(), {
    ...defaultDials(),
    // Orders and the Herald both move numbers this file is measuring.
    directives: 1,
    attention: 1,
  })
  s.map.nodes.find((n) => n.id === s.at)!.resolved = true
  return s
}

function weeks(s: ExpeditionState, count: number): ExpeditionState {
  let after = s
  for (let i = 0; i < count && !after.outcome; i++) {
    after = expeditionStep(after, { k: 'advanceWeek' })
  }
  return after
}

describe('a week of work', () => {
  it('counts for somebody on a running station', () => {
    const after = weeks(ship(), 3)
    const worker = after.crew.find((c) => c.station === 'lab')!
    expect(worker.xp).toBe(3)
  })

  it('counts for nothing while the station has no power', () => {
    const s = ship()
    s.power.lab = 0
    const after = weeks(s, 3)
    const idle = after.crew.find((c) => c.station === 'lab')!
    expect(idle.xp).toBe(0)
  })

  it('counts for nothing while nobody is posted anywhere', () => {
    const s = ship()
    for (const member of s.crew) member.station = null
    const after = weeks(s, 4)
    expect(after.crew.every((c) => c.xp === 0)).toBe(true)
  })

  it('counts double under a mentor', () => {
    const s = ship()
    const worker = s.crew.find((c) => c.station === 'lab')!
    worker.mentor = 'echoreader'
    const after = weeks(s, 3)
    expect(after.crew.find((c) => c.id === worker.id)!.xp).toBe(6)
  })
})

describe('what a rank is worth', () => {
  it('makes the station measurably better', () => {
    const green = ship()
    const trained = ship()
    for (const member of trained.crew) {
      if (member.station === 'lab') member.xp = RANK_XP[1]
    }
    expect(crewRank(trained.crew.find((c) => c.station === 'lab')!)).toBe(2)
    expect(stationStrength(trained, 'lab')).toBeGreaterThan(stationStrength(green, 'lab'))
    expect(labOutput(trained)).toBeGreaterThan(labOutput(green))
  })

  it('teaches the person something when they reach the top', () => {
    const s = ship()
    const worker = s.crew.find((c) => c.station === 'lab')!
    worker.xp = RANK_XP[2] - 1
    const traits = worker.traits.length
    const after = weeks(s, 1)
    const grown = after.crew.find((c) => c.id === worker.id)!
    expect(crewRank(grown)).toBe(3)
    expect(grown.traits.length).toBe(traits + 1)
  })

  it('is announced in the log, so a promotion is not silent', () => {
    const s = ship()
    const worker = s.crew.find((c) => c.station === 'lab')!
    worker.xp = RANK_XP[1] - 1
    const after = weeks(s, 1)
    expect(after.log.some((e) => e.event.k === 'crewPromoted')).toBe(true)
  })
})

describe('taking somebody under your wing', () => {
  it('belongs to one hero at a time', () => {
    const s = ship()
    const who = s.crew[0]!.id
    const his = expeditionStep(s, { k: 'setMentor', crewId: who, hero: 'runesmith' })
    expect(menteesOf(his, 'runesmith')).toHaveLength(1)
    expect(menteesOf(his, 'echoreader')).toHaveLength(0)

    // The other one cannot simply take them: they are already spoken for.
    const hers = expeditionStep(his, { k: 'setMentor', crewId: who, hero: 'echoreader' })
    expect(menteesOf(hers, 'echoreader')).toHaveLength(0)
    expect(menteesOf(hers, 'runesmith')).toHaveLength(1)
  })

  it('can be given up again', () => {
    const s = ship()
    const who = s.crew[0]!.id
    const taken = expeditionStep(s, { k: 'setMentor', crewId: who, hero: 'runesmith' })
    const freed = expeditionStep(taken, { k: 'setMentor', crewId: who, hero: null })
    expect(menteesOf(freed, 'runesmith')).toHaveLength(0)
  })

  it('has a limit', () => {
    let s = ship()
    for (const member of s.crew) {
      s = expeditionStep(s, { k: 'setMentor', crewId: member.id, hero: 'runesmith' })
    }
    expect(menteesOf(s, 'runesmith')).toHaveLength(3)
  })

  it('pays the mentor once two of them are any good', () => {
    const start = ship()
    const pair = start.crew.slice(0, 2).map((c) => c.id)
    // Set the experience before stepping: `expeditionStep` works on a copy, so
    // holding on to references from the state before it is a good way to write a
    // test that quietly tests nothing.
    for (const member of start.crew) if (pair.includes(member.id)) member.xp = RANK_XP[1]
    let s = start
    for (const id of pair) {
      s = expeditionStep(s, { k: 'setMentor', crewId: id, hero: 'echoreader' })
    }
    expect(menteesOf(s, 'echoreader')).toHaveLength(2)
    const before = s.heroRecords.echoreader.marks

    // A landing won: one mark each for it, plus one to her for their work.
    const landed = expeditionStep(
      {
        ...s,
        screen: 'mission',
        activeMission: {
          k: 'battle',
          nodeId: s.at,
          spec: {
            kind: 'combat',
            objective: { k: 'eliminate' },
            difficulty: 1,
            enemyScale: 1,
            roundLimit: null,
            rewards: [],
            briefing: { hu: 'x', en: 'x' },
          },
          battle: battleFor(s),
        },
      },
      { k: 'settleBattle', as: 'victory' },
    )
    expect(landed.heroRecords.echoreader.marks).toBe(before + 2)
    expect(landed.heroRecords.runesmith.marks).toBe(1)
  })
})

/** A throwaway battle, only ever settled rather than played. */
function battleFor(s: ExpeditionState) {
  return startMission({
    seed: 4,
    difficulty: 1,
    objective: { k: 'eliminate' },
    missionKind: 'combat',
    flux: 5,
    roundLimit: null,
    heroes: s.heroes,
    enemyScale: 1,
  })
}
