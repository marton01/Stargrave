// What losing costs.
//
// Written after a player used the "give it up at full cost" button and got two
// points of morale and nothing else — gentler than actually losing the fight,
// which is the one thing that button must not be. The tests below pin down what a
// defeat takes, and separately answer the question that came with it: can the
// hull be damaged at all?
//
// It can, from two places, and only two: a risky answer in an encounter, and a
// boarding action lost aboard the ship. A landing that goes wrong on a planet
// does not scratch the hull, because the hull is in orbit — that is deliberate,
// and it is why the boarding case had to be added separately.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import { expeditionStep, startExpedition } from './expedition'
import { startMission } from '../battle'
import type { ExpeditionState, MissionSpec } from './types'

const SPEC: MissionSpec = {
  kind: 'combat',
  objective: { k: 'eliminate' },
  difficulty: 2,
  enemyScale: 1,
  roundLimit: null,
  rewards: [{ k: 'resource', id: 'credits', amount: 6 }],
  briefing: { hu: 'x', en: 'x' },
}

/** An expedition standing in a battle built from `spec`. */
function inBattle(spec: MissionSpec = SPEC): ExpeditionState {
  const s = startExpedition(4242, 'medium', newArchive())
  s.activeMission = {
    k: 'battle',
    nodeId: s.at,
    spec,
    battle: startMission({
      seed: 7,
      difficulty: spec.difficulty,
      objective: spec.objective,
      missionKind: spec.kind,
      flux: 5,
      roundLimit: spec.roundLimit,
      heroes: s.heroes,
      enemyScale: spec.enemyScale,
    }),
  }
  s.screen = 'mission'
  return s
}

describe('giving a landing up at full cost', () => {
  it('takes the week, the morale, the party and a crew member', () => {
    const before = inBattle()
    const crewBefore = before.crew.filter((c) => c.alive).length
    const moraleBefore = before.resources.morale
    const weekBefore = before.week

    const after = expeditionStep(before, { k: 'settleBattle', as: 'defeat' })

    expect(after.week, 'a week goes').toBe(weekBefore + 1)
    expect(after.resources.morale, 'morale falls').toBe(moraleBefore - 2)
    expect(after.crew.filter((c) => c.alive).length, 'a crew member dies').toBe(crewBefore - 1)
    // The party comes home at one hit point each: they fell.
    for (const hero of after.heroes) expect(hero.hp, hero.heroClass).toBe(1)
  })

  it('is never gentler than winning it', () => {
    const lost = expeditionStep(inBattle(), { k: 'settleBattle', as: 'defeat' })
    const won = expeditionStep(inBattle(), { k: 'settleBattle', as: 'victory' })
    expect(lost.resources.morale).toBeLessThan(won.resources.morale)
    expect(lost.crew.filter((c) => c.alive).length).toBeLessThan(
      won.crew.filter((c) => c.alive).length,
    )
  })

  it('costs nothing at all when the landing is skipped instead', () => {
    const before = inBattle()
    const after = expeditionStep(before, { k: 'settleBattle', as: 'skip' })
    expect(after.resources.morale).toBe(before.resources.morale)
    expect(after.week).toBe(before.week)
    expect(after.crew.filter((c) => c.alive).length).toBe(before.crew.filter((c) => c.alive).length)
  })
})

describe('the hull', () => {
  it('is not touched by a landing lost on the ground', () => {
    const before = inBattle()
    const after = expeditionStep(before, { k: 'settleBattle', as: 'defeat' })
    expect(after.resources.hull).toBe(before.resources.hull)
  })

  it('is damaged by a boarding action lost aboard', () => {
    const before = inBattle({ ...SPEC, aboard: true })
    before.power.shields = 0
    const after = expeditionStep(before, { k: 'settleBattle', as: 'defeat' })
    expect(after.resources.hull).toBeLessThan(before.resources.hull)
  })

  it('is protected by shields, even then', () => {
    const bare = inBattle({ ...SPEC, aboard: true })
    bare.power.shields = 0
    const shielded = inBattle({ ...SPEC, aboard: true })
    shielded.power.shields = 3

    const bareAfter = expeditionStep(bare, { k: 'settleBattle', as: 'defeat' })
    const shieldedAfter = expeditionStep(shielded, { k: 'settleBattle', as: 'defeat' })
    expect(shieldedAfter.resources.hull).toBeGreaterThan(bareAfter.resources.hull)
  })
})
