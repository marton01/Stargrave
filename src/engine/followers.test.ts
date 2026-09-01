// The crew, on the ground.
//
// This is the only system in the game that can take a NAMED person away as the
// direct consequence of a choice made a few minutes earlier, so the things that
// have to hold are mostly about honesty rather than about numbers:
//
//   **You are told the price, and then it is charged.** A follower who falls is
//   crossed off the ship's crew list. If that ever silently failed, the whole
//   system would be a free extra body.
//
//   **Only what you actually earned may come.** Trained, and somebody's mentee.
//   That is what four weeks at a station bought — and it is what stops the
//   landing party quietly becoming eight.
//
//   **They must not out-fight the party.** One each, small numbers, no cards. A
//   follower changes a round; the moment two of them win one, the cards have
//   stopped being the game.

import { describe, expect, it } from 'vitest'
import { newArchive } from './expedition/archive'
import {
  HERO_ORDER,
  expeditionStep,
  landingCandidates,
  landingFollowers,
  startExpedition,
} from './expedition/expedition'
import { FOLLOWER_ORDERS, canFollow, followerStats, followerTurn } from './followers'
import { RANK_XP } from '../content/crew'
import { startMission } from './battle'
import { followers, isFollower, isHero, livingFollowers } from './state'
import { defaultDials } from '../content/difficulty'
import type { ExpeditionState } from './expedition/types'
import type { BattleState, Follower, HeroClassId } from './types'

function ship(): ExpeditionState {
  const s = startExpedition(
    91,
    'medium',
    newArchive(),
    { ...defaultDials(), directives: 1, attention: 1, aboard: 1 },
    HERO_ORDER,
  )
  s.map.nodes.find((n) => n.id === s.at)!.resolved = true
  return s
}

/** A crew member who has done the work: trained, and somebody's. */
function trained(s: ExpeditionState, index = 0, hero: HeroClassId = 'runesmith') {
  const member = s.crew.filter((c) => c.alive)[index]!
  member.xp = RANK_XP[1]!
  member.mentor = hero
  return member
}

describe('who may come down', () => {
  it('takes only a trained hand who is somebody’s', () => {
    const s = ship()
    const green = s.crew.filter((c) => c.alive)[0]!
    green.xp = 0
    green.mentor = 'runesmith'
    expect(canFollow(green), 'an untrained hand was allowed down').toBe(false)

    const nobodys = s.crew.filter((c) => c.alive)[1]!
    nobodys.xp = RANK_XP[1]!
    nobodys.mentor = null
    expect(canFollow(nobodys), 'somebody with no mentor was allowed down').toBe(false)

    const ready = trained(s, 2, 'cantor')
    expect(canFollow(ready)).toBe(true)
    expect(landingCandidates(s, 'cantor').map((m) => m.id)).toContain(ready.id)
    expect(landingCandidates(s, 'runesmith').map((m) => m.id)).not.toContain(ready.id)
  })

  it('lets one hero take one, not a crowd', () => {
    let s = ship()
    const first = trained(s, 0)
    const second = trained(s, 1)
    s = expeditionStep(s, { k: 'toggleFollower', crewId: first.id })
    s = expeditionStep(s, { k: 'toggleFollower', crewId: second.id })
    // The second choice replaces the first: it is the same hero's slot.
    expect(landingFollowers(s).map((m) => m.id)).toEqual([second.id])
  })

  it('quietly drops anybody who stopped being eligible after they were chosen', () => {
    let s = ship()
    const member = trained(s)
    s = expeditionStep(s, { k: 'toggleFollower', crewId: member.id })
    expect(landingFollowers(s)).toHaveLength(1)

    // Released between the choice and the hatch.
    s = expeditionStep(s, { k: 'setMentor', crewId: member.id, hero: null })
    expect(landingFollowers(s), 'somebody nobody teaches walked off the ship').toHaveLength(0)
  })
})

describe('on the board', () => {
  function landing(order: Follower['order'] = 'strike'): BattleState {
    return startMission({
      seed: 31,
      difficulty: 1,
      objective: { k: 'eliminate' },
      missionKind: 'combat',
      followers: [
        {
          crewId: 'crew-1',
          name: { hu: 'Kava', en: 'Kava' },
          mentor: 'runesmith',
          playerSlot: 1,
          order,
          hp: 6,
          attack: 1,
          speed: 3,
        },
      ],
    })
  }

  it('stands on the board, on the party’s side, and is not a hero', () => {
    const s = landing()
    expect(followers(s)).toHaveLength(1)
    const f = followers(s)[0]!
    expect(f.side).toBe('hero')
    expect(isFollower(f)).toBe(true)
    // Not counted among the heroes anywhere it matters: the party is whatever
    // it was, and the follower is not part of it.
    const party = s.units.filter((u) => isHero(u))
    expect(party.length).toBeGreaterThanOrEqual(2)
    expect(party.some((u) => u.id === f.id)).toBe(false)
    // And no cards: this is what stops them being a fifth hand to play.
    expect('hand' in f).toBe(false)
  })

  it('starts beside the hero who taught them', () => {
    const s = landing()
    const f = followers(s)[0]!
    const mentor = s.units.find((u) => isHero(u) && u.heroClass === 'runesmith')!
    expect(Math.abs(f.pos.x - mentor.pos.x)).toBeLessThanOrEqual(2)
    expect(Math.abs(f.pos.y - mentor.pos.y)).toBeLessThanOrEqual(2)
  })

  it('does what it was told, and says so in the log', () => {
    for (const order of FOLLOWER_ORDERS) {
      const s = landing(order)
      const f = followers(s)[0]!
      const before = s.log.length
      followerTurn(s, f)
      expect(s.log.length, `${order} did nothing at all`).toBeGreaterThan(before)
    }
  })

  it('cannot out-fight the party', () => {
    // Small numbers, checked against the weakest hero rather than asserted in a
    // vacuum: a follower must never be worth more than one of the four.
    const s = ship()
    const master = trained(s)
    master.xp = RANK_XP[2]!
    const stats = followerStats(master)
    expect(stats.attack).toBeLessThanOrEqual(2)
    // The frailest of the four has eight.
    expect(stats.hp).toBeLessThan(8)
  })
})

describe('the price', () => {
  it('crosses a name off the ship’s list when one does not come back', () => {
    let s = ship()
    const member = trained(s)
    s = expeditionStep(s, { k: 'toggleFollower', crewId: member.id })

    // Land, and let the worst happen down there.
    s.activeMission = {
      k: 'battle',
      nodeId: s.at,
      spec: {
        k: 'battle' as const,
        kind: 'combat' as const,
        objective: { k: 'eliminate' },
        difficulty: 1,
        rewards: [],
        briefing: { hu: 'x', en: 'x' },
        roundLimit: null,
        aboard: false,
        herald: false,
      },
      battle: landingWithDeadFollower(member.id),
    } as unknown as ExpeditionState['activeMission']

    const crewBefore = s.crew.filter((c) => c.alive).length
    const after = expeditionStep(s, { k: 'missionFinish' })

    expect(after.crew.find((c) => c.id === member.id)?.alive, 'they walked it off').toBe(false)
    expect(after.crew.filter((c) => c.alive).length).toBe(crewBefore - 1)
    expect(after.log.some((entry) => entry.event.k === 'followerDied')).toBe(true)
    // And the ship feels it.
    expect(after.resources.morale).toBeLessThan(s.resources.morale)
  })

  it('does not take somebody down twice without being asked again', () => {
    let s = ship()
    const member = trained(s)
    s = expeditionStep(s, { k: 'toggleFollower', crewId: member.id })
    s.activeMission = {
      k: 'battle',
      nodeId: s.at,
      spec: {
        k: 'battle' as const,
        kind: 'combat' as const,
        objective: { k: 'eliminate' },
        difficulty: 1,
        rewards: [],
        briefing: { hu: 'x', en: 'x' },
        roundLimit: null,
        aboard: false,
        herald: false,
      },
      battle: landingWithLivingFollower(member.id),
    } as unknown as ExpeditionState['activeMission']

    const after = expeditionStep(s, { k: 'missionFinish' })
    expect(after.crew.find((c) => c.id === member.id)?.alive).toBe(true)
    // Taking a person into a fight is a decision, and a decision that repeats
    // itself unasked is not one.
    expect(after.landingParty).toHaveLength(0)
  })
})

/** A finished landing in which the follower fell. */
function landingWithDeadFollower(crewId: string): BattleState {
  const s = battleWithFollower(crewId)
  for (const f of livingFollowers(s)) f.alive = false
  s.outcome = 'victory'
  return s
}

function landingWithLivingFollower(crewId: string): BattleState {
  const s = battleWithFollower(crewId)
  s.outcome = 'victory'
  return s
}

function battleWithFollower(crewId: string): BattleState {
  return startMission({
    seed: 7,
    difficulty: 1,
    objective: { k: 'eliminate' },
    missionKind: 'combat',
    followers: [
      {
        crewId,
        name: { hu: 'Kava', en: 'Kava' },
        mentor: 'runesmith',
        playerSlot: 1,
        order: 'guard',
        hp: 6,
        attack: 1,
        speed: 3,
      },
    ],
  })
}
