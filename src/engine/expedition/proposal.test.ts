// The irreversible six, and why they need two people online.
//
// At one keyboard every one of these asks twice before it happens, because there
// is one mouse and one person holding it. Over a network that stops being a
// safeguard: the same two clicks from any one seat end the evening for three
// other people who were in the middle of a sentence.
//
// So online they are proposed, and somebody else agrees. What these tests defend
// is the short, closed list — everything else in this co-operative game stays
// open to everybody, and a version of this mechanism that crept over ordinary
// play would turn the game into a committee.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  expeditionStep,
  needsSeconding,
  proposalCarried,
  proposalLabel,
  startExpedition,
} from './expedition'
import { startMission } from '../battle'
import type { ExpeditionAction } from './expedition'
import type { ExpeditionState, ProposedAction } from './types'

const SPEC = {
  kind: 'combat' as const,
  objective: { k: 'eliminate' as const },
  difficulty: 1,
  enemyScale: 1,
  roundLimit: null,
  rewards: [],
  briefing: { hu: 'x', en: 'x' },
}

function inBattle(): ExpeditionState {
  const s = startExpedition(31, 'medium', newArchive())
  s.activeMission = {
    k: 'battle',
    nodeId: s.at,
    spec: SPEC,
    battle: startMission({
      seed: 4,
      difficulty: 1,
      objective: SPEC.objective,
      missionKind: 'combat',
      flux: 5,
      roundLimit: null,
      heroes: s.heroes,
      enemyScale: 1,
    }),
  }
  s.screen = 'mission'
  return s
}

const THE_SIX: ProposedAction[] = [
  { k: 'settleBattle', as: 'victory' },
  { k: 'settleBattle', as: 'defeat' },
  { k: 'settleBattle', as: 'skip' },
  { k: 'restartBattle' },
  { k: 'rerollBattle' },
  { k: 'withdrawBeforeLanding' },
  { k: 'chooseEnding', endingId: 'flee' },
  { k: 'abandon' },
]

describe('what needs agreeing to', () => {
  it('is exactly the ones that cannot be taken back', () => {
    for (const action of THE_SIX) expect(needsSeconding(action), action.k).toBe(true)
  })

  it('is nothing at all from ordinary play', () => {
    const ordinary: ExpeditionAction[] = [
      { k: 'advanceWeek' },
      { k: 'setPower', system: 'engines', value: 2 },
      { k: 'assignCrew', crewId: 'crew-0', station: 'lab' },
      { k: 'setCourse', nodeId: 'n1-0' },
      { k: 'engageNode' },
      { k: 'encounterConfirm' },
      { k: 'marketBuy', index: 0 },
      { k: 'buyPerk', hero: 'runesmith', perkId: 'smith-ironback' },
      { k: 'setWatch', hero: 'runesmith', duty: 'smith-patch' },
      { k: 'taskPress', rune: 0 },
      { k: 'dialSet', dial: 'flux', level: 3 },
      { k: 'openScreen', screen: 'starmap' },
    ]
    for (const action of ordinary) expect(needsSeconding(action), action.k).toBe(false)
  })

  it('says in words what is being asked for, in both languages', () => {
    for (const ask of THE_SIX) {
      const label = proposalLabel(ask)
      expect(label.hu.length, ask.k).toBeGreaterThan(8)
      expect(label.en.length, ask.k).toBeGreaterThan(8)
    }
  })
})

describe('asking, and being agreed with', () => {
  it('changes nothing on its own', () => {
    const s = inBattle()
    const asked = expeditionStep(s, {
      k: 'propose',
      action: { k: 'settleBattle', as: 'defeat' },
      by: 1,
    })
    expect(asked.proposal).not.toBeNull()
    expect(proposalCarried(asked)).toBe(false)
    // The battle is exactly where it was: nothing has been settled.
    expect(asked.activeMission?.k).toBe('battle')
    expect(asked.resources.morale).toBe(s.resources.morale)
  })

  it('cannot be agreed to by the seat that asked', () => {
    const asked = expeditionStep(inBattle(), {
      k: 'propose',
      action: { k: 'abandon' },
      by: 2,
    })
    const alone = expeditionStep(asked, { k: 'second', by: 2 })
    expect(alone.proposal?.seconds).toEqual([])
    expect(alone.outcome).toBeNull()
  })

  it('happens the moment somebody else agrees', () => {
    const asked = expeditionStep(inBattle(), {
      k: 'propose',
      action: { k: 'settleBattle', as: 'defeat' },
      by: 1,
    })
    const done = expeditionStep(asked, { k: 'second', by: 2 })
    expect(done.proposal).toBeNull()
    expect(done.activeMission).toBeNull()
    // A defeat costs what a defeat costs — see defeat.test.ts.
    expect(done.resources.morale).toBeLessThan(asked.resources.morale)
    expect(done.log.some((entry) => entry.event.k === 'proposalCarried')).toBe(true)
  })

  it('can be withdrawn, and then nothing happened at all', () => {
    const asked = expeditionStep(inBattle(), {
      k: 'propose',
      action: { k: 'abandon' },
      by: 1,
    })
    const dropped = expeditionStep(asked, { k: 'dropProposal' })
    expect(dropped.proposal).toBeNull()
    expect(dropped.outcome).toBeNull()
  })

  it('holds one question at a time, so the table is never asked two', () => {
    let s = expeditionStep(inBattle(), { k: 'propose', action: { k: 'abandon' }, by: 1 })
    s = expeditionStep(s, { k: 'propose', action: { k: 'rerollBattle' }, by: 2 })
    expect(s.proposal?.action.k).toBe('rerollBattle')
    expect(s.proposal?.by).toBe(2)
    expect(s.proposal?.seconds).toEqual([])
  })

  it('carries each of them through to the thing itself', () => {
    for (const ask of THE_SIX) {
      if (ask.k === 'chooseEnding') continue // not reachable from a battle
      const asked = expeditionStep(inBattle(), { k: 'propose', action: ask, by: 1 })
      const done = expeditionStep(asked, { k: 'second', by: 2 })
      expect(done.proposal, ask.k).toBeNull()
      const changed =
        done.outcome !== null ||
        done.activeMission === null ||
        JSON.stringify(done.activeMission) !== JSON.stringify(asked.activeMission)
      expect(changed, `${ask.k} was agreed to and did nothing`).toBe(true)
    }
  })
})
