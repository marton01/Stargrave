// Attention, and the thing it wakes.
//
// This is the only pressure in the game the players create themselves, and that
// is the whole reason it exists: the Gate's countdown is identical every run, so
// once you know it you stop feeling it. A number you write yourself with every
// loud decision cannot go stale in the same way.
//
// Which puts two obligations on the code, and they are what this file defends.
//
// One: quiet play must actually work. If attention creeps up on its own then the
// Herald is not a consequence, it is a timer with extra steps — and the choice to
// play carefully was never real.
//
// Two: it must be beatable and losing to it must be worse than not. Driving it
// off has to cost something and leave it coming back stronger, or the cheapest
// answer to the whole mechanic is to lose to it on purpose and carry on.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  HERALD_WAKES_AT,
  expeditionStep,
  heraldDistance,
  startExpedition,
  weeklyAttention,
} from './expedition'
import { startMission } from '../battle'
import { defaultDials } from '../../content/difficulty'
import type { ExpeditionState, MissionSpec } from './types'

function ship(): ExpeditionState {
  // Orders and the ship's own weeks would both pull the numbers around, and an
  // aboard event blocks the week outright — this file is about the Herald.
  const s = startExpedition(101, 'medium', newArchive(), {
    ...defaultDials(),
    directives: 1,
    aboard: 1,
  })
  s.directives = []
  return s
}

/** Sit still at a settled node for `weeks` weeks and do nothing loud. */
function quietWeeks(s: ExpeditionState, weeks: number): ExpeditionState {
  let after = s
  const node = after.map.nodes.find((n) => n.id === after.at)!
  node.resolved = true
  for (let i = 0; i < weeks; i++) after = expeditionStep(after, { k: 'advanceWeek' })
  return after
}

/**
 * Weeks under way with the engines wide open: one point of attention each.
 *
 * The long leg is deliberate — the ship never arrives, so nothing but the noise
 * and the Herald happens in these weeks.
 */
function loudWeeks(s: ExpeditionState, weeks: number): ExpeditionState {
  let after: ExpeditionState = { ...s, power: { ...s.power, engines: 3 } }
  after.travel = { to: after.map.nodes[1]!.id, weeksLeft: 40 }
  for (let i = 0; i < weeks && !after.activeMission; i++) {
    after = expeditionStep(after, { k: 'advanceWeek' })
  }
  return after
}

describe('playing quietly', () => {
  it('never wakes anything, over a whole expedition of standing still', () => {
    const after = quietWeeks(ship(), 20)
    expect(after.attention).toBe(0)
    expect(after.herald).toBeNull()
  })

  it('costs a point a week to run the engines hot', () => {
    const s = ship()
    s.power.engines = 3
    s.travel = { to: s.map.nodes[1]!.id, weeksLeft: 9 }
    expect(weeklyAttention(s)).toBe(1)

    const cruising = ship()
    cruising.power.engines = 2
    cruising.travel = { to: cruising.map.nodes[1]!.id, weeksLeft: 9 }
    expect(weeklyAttention(cruising)).toBe(0)
  })

  it('is quieted by the shroud, and by a relic that swallows sound', () => {
    const loud = ship()
    loud.power.engines = 3
    loud.travel = { to: loud.map.nodes[1]!.id, weeksLeft: 9 }

    const shrouded: ExpeditionState = { ...loud, modules: ['silenceShroud'] }
    expect(weeklyAttention(shrouded)).toBeLessThan(weeklyAttention(loud))

    const lantern = { ...loud, relics: ['lantern-of-still-air'] }
    const worn = expeditionStep(lantern, {
      k: 'attuneRelic',
      hero: 'runesmith',
      relicId: 'lantern-of-still-air',
    })
    expect(weeklyAttention(worn)).toBeLessThan(weeklyAttention(loud))
  })

  it('sheds a point on a week spent sitting still at a settled node', () => {
    const s = ship()
    s.attention = 5
    const after = quietWeeks(s, 1)
    expect(after.attention).toBe(4)
  })
})

// -------------------------------------------------------------- playing loud

const LANDING: MissionSpec = {
  kind: 'combat',
  objective: { k: 'eliminate' },
  difficulty: 1,
  enemyScale: 1,
  roundLimit: null,
  rewards: [],
  briefing: { hu: 'x', en: 'x' },
}

function inBattle(s: ExpeditionState, spec: MissionSpec): ExpeditionState {
  return {
    ...s,
    screen: 'mission',
    activeMission: {
      k: 'battle',
      nodeId: s.at,
      spec,
      battle: startMission({
        seed: 9,
        difficulty: spec.difficulty,
        objective: spec.objective,
        missionKind: spec.kind,
        flux: 5,
        roundLimit: spec.roundLimit,
        heroes: s.heroes,
        enemyScale: spec.enemyScale,
      }),
    },
  }
}

describe('playing loud', () => {
  it('is heard: a landing won raises it, a boarding action raises it more', () => {
    const landing = expeditionStep(inBattle(ship(), LANDING), { k: 'settleBattle', as: 'victory' })
    const boarding = expeditionStep(inBattle(ship(), { ...LANDING, aboard: true }), {
      k: 'settleBattle',
      as: 'victory',
    })
    expect(landing.attention).toBeGreaterThan(0)
    expect(boarding.attention).toBeGreaterThan(landing.attention)
  })

  it('wakes the Herald once the ship is loud enough', () => {
    const s = ship()
    s.attention = HERALD_WAKES_AT - 1
    const after = loudWeeks(s, 1)
    expect(after.herald).not.toBeNull()
    // From ahead, and far enough off that the first sighting is a warning.
    expect(heraldDistance(after)).toBeGreaterThan(0)
  })

  it('closes on the ship a column at a time, wherever the ship goes', () => {
    let s = ship()
    s.attention = HERALD_WAKES_AT - 1
    s = loudWeeks(s, 1)
    const first = heraldDistance(s)!
    s = loudWeeks(s, 1)
    expect(heraldDistance(s)!).toBeLessThan(first)
  })

  it('catches the ship in the end, and that is a boarding action', () => {
    let s = ship()
    s.attention = HERALD_WAKES_AT - 1
    s = loudWeeks(s, 8)
    expect(s.activeMission?.k).toBe('battle')
    const mission = s.activeMission
    if (mission?.k !== 'battle') throw new Error('expected a battle')
    expect(mission.spec.herald).toBe(true)
    expect(mission.spec.aboard).toBe(true)
  })
})

// ------------------------------------------------------------- meeting it

/** Run weeks until the Herald has the ship, then hand over an outcome. */
function heraldFight(prepare?: (s: ExpeditionState) => void): ExpeditionState {
  const s = ship()
  s.attention = HERALD_WAKES_AT - 1
  prepare?.(s)
  const hunted = loudWeeks(s, 10)
  if (!hunted.activeMission) throw new Error('the Herald never arrived')
  return hunted
}

describe('meeting it', () => {
  it('silences it for good when it is stopped', () => {
    const won = expeditionStep(heraldFight(), { k: 'settleBattle', as: 'victory' })
    expect(won.herald).toBeNull()
    expect(won.flags).toContain('herald-silenced')
    // And it stays gone: nothing wakes another one.
    const later = quietWeeks({ ...won, attention: 20 }, 3)
    expect(later.herald).toBeNull()
  })

  it('banks the fact in the long memory, for a later expedition to be asked about', () => {
    const won = expeditionStep(heraldFight(), { k: 'settleBattle', as: 'victory' })
    expect(won.marks).toContain('silenced-the-herald')
  })

  it('pays both of them for it', () => {
    const won = expeditionStep(heraldFight(), { k: 'settleBattle', as: 'victory' })
    expect(won.heroRecords.runesmith.marks).toBeGreaterThan(1)
    expect(won.heroRecords.echoreader.marks).toBeGreaterThan(1)
  })

  it('comes back harder when it is only driven off', () => {
    const before = heraldFight()
    const hull = before.resources.hull
    const lost = expeditionStep(before, { k: 'settleBattle', as: 'defeat' })
    expect(lost.herald, 'it should still be out there').not.toBeNull()
    expect(lost.herald!.hunts).toBe(1)
    expect(lost.resources.hull, 'a fight lost aboard costs hull').toBeLessThan(hull)
    expect(lost.flags).not.toContain('herald-silenced')
  })

  it('is a harder fight the second time, and an easier one if you understood it', () => {
    const second = heraldFight()
    const repelled = expeditionStep(second, { k: 'settleBattle', as: 'defeat' })
    const again = loudWeeks(repelled, 10)
    const mission = again.activeMission
    if (mission?.k !== 'battle') throw new Error('expected a second visit')
    expect(mission.spec.enemyScale).toBeGreaterThan(1.2)

    const informed = heraldFight((s) => {
      s.flags.push('knows-herald')
    })
    const first = heraldFight()
    const a = informed.activeMission
    const b = first.activeMission
    if (a?.k !== 'battle' || b?.k !== 'battle') throw new Error('expected battles')
    expect(a.spec.difficulty).toBeLessThan(b.spec.difficulty)
  })
})

describe('the dial that switches it off', () => {
  it('means no attention and no Herald at all', () => {
    const s = ship()
    s.dials.attention = 1
    s.power.engines = 3
    s.travel = { to: s.map.nodes[1]!.id, weeksLeft: 9 }
    const after = expeditionStep(
      expeditionStep(inBattle(s, { ...LANDING, aboard: true }), {
        k: 'settleBattle',
        as: 'victory',
      }),
      { k: 'advanceWeek' },
    )
    expect(after.attention).toBe(0)
    expect(after.herald).toBeNull()
  })
})
