// Relics: named things, and the rule that they only work when worn.
//
// The design of this is one sentence: a relic in the hold does nothing. That is
// what makes finding a fourth one a decision instead of a number going up, and it
// is the first thing that would rot — a bonus that quietly applies from the hold
// looks identical to a bonus that applies from a hero's neck until somebody
// tries to take it off.
//
// So: every effect field must be honoured while worn, none of them while stowed,
// and the two consoles must not be able to take things off each other.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  HERO_ORDER,
  attunedRelics,
  bondRange,
  expeditionStep,
  forgeOutput,
  heroMaxHp,
  labOutput,
  missionFlux,
  moraleTarget,
  sensorOutput,
  shieldMitigation,
  startExpedition,
  weeklyAttention,
  weeklyFromModules,
} from './expedition'
import { RELICS, relic, relicHasWhisper } from '../../content/relics'
import { startMission } from '../battle'
import type { ExpeditionState, MissionSpec } from './types'

function ship(relics: string[] = []): ExpeditionState {
  // The whole table, so a relic bound to any of the four can be tried on.
  const s = startExpedition(77, 'medium', newArchive(), undefined, HERO_ORDER)
  s.directives = []
  s.dials.directives = 1
  s.relics = [...relics]
  // Everything running, so a relic that adds to a station's output can be seen.
  for (const id of Object.keys(s.power) as (keyof typeof s.power)[]) s.power[id] = 1
  const stations = ['sensors', 'lab', 'forge', 'bridge', 'medbay', 'sanctum'] as const
  s.crew.forEach((member, i) => {
    member.station = stations[i % stations.length]!
  })
  s.travel = { to: s.map.nodes[1]!.id, weeksLeft: 2 }
  return s
}

/** Everything about the ship a relic could touch. */
function probe(s: ExpeditionState): string {
  return [
    heroMaxHp(s, 'runesmith'),
    heroMaxHp(s, 'echoreader'),
    missionFlux(s),
    shieldMitigation(s),
    sensorOutput(s),
    labOutput(s),
    forgeOutput(s),
    moraleTarget(s),
    bondRange(s),
    weeklyAttention(s),
    weeklyFromModules(s, 'food'),
    weeklyFromModules(s, 'information'),
  ].join('|')
}

describe('a relic only works when somebody is wearing it', () => {
  it('does nothing at all while it sits in the hold', () => {
    for (const def of RELICS) {
      const empty = ship()
      const held = ship([def.id])
      expect(probe(held), `${def.id} works from the hold`).toBe(probe(empty))
    }
  })

  it('changes something measurable the moment it is worn', () => {
    for (const def of RELICS) {
      const s = ship([def.id])
      const hero = def.bearer ?? 'runesmith'
      const before = probe(s)
      const after = expeditionStep(s, { k: 'attuneRelic', hero, relicId: def.id })
      expect(after.heroRecords[hero].attuned, `${def.id}: not worn`).toContain(def.id)
      expect(probe(after), `${def.id} (${def.name.en}) changed nothing`).not.toBe(before)
    }
  })

  it('stops working again when it is taken off', () => {
    for (const def of RELICS) {
      const hero = def.bearer ?? 'echoreader'
      const bare = ship([def.id])
      const worn = expeditionStep(bare, { k: 'attuneRelic', hero, relicId: def.id })
      const stowed = expeditionStep(worn, { k: 'stowRelic', hero, relicId: def.id })
      expect(probe(stowed), `${def.id} still works after being stowed`).toBe(probe(bare))
    }
  })

  it('says out loud what it costs, whenever it costs something', () => {
    for (const def of RELICS) {
      if (!relicHasWhisper(def)) continue
      expect(def.whisper, `${def.id}: a drawback with nothing written about it`).toBeTruthy()
      expect(def.whisper!.hu.length).toBeGreaterThan(0)
      expect(def.whisper!.en.length).toBeGreaterThan(0)
    }
  })
})

describe('who may wear what', () => {
  it('refuses a relic that is not aboard', () => {
    const s = ship()
    const after = expeditionStep(s, { k: 'attuneRelic', hero: 'runesmith', relicId: 'choir-shard' })
    expect(after.heroRecords.runesmith.attuned).toHaveLength(0)
  })

  it('refuses a relic bound to the other hero', () => {
    // The Anvil fragment is his; she cannot put it on however she tries.
    const s = ship(['anvil-fragment'])
    const after = expeditionStep(s, {
      k: 'attuneRelic',
      hero: 'echoreader',
      relicId: 'anvil-fragment',
    })
    expect(after.heroRecords.echoreader.attuned).toHaveLength(0)
  })

  it('gives every hero at least one relic nobody else can take', () => {
    for (const hero of HERO_ORDER) {
      expect(RELICS.some((r) => r.bearer === hero), hero).toBe(true)
    }
  })

  it('will not take a relic off the other hero’s neck', () => {
    const s = ship(['binding-cord'])
    const worn = expeditionStep(s, {
      k: 'attuneRelic',
      hero: 'runesmith',
      relicId: 'binding-cord',
    })
    const stolen = expeditionStep(worn, {
      k: 'attuneRelic',
      hero: 'echoreader',
      relicId: 'binding-cord',
    })
    expect(stolen.heroRecords.runesmith.attuned).toEqual(['binding-cord'])
    expect(stolen.heroRecords.echoreader.attuned).toHaveLength(0)
  })

  it('holds the number of slots, and a perk widens it', () => {
    const two = ['binding-cord', 'ash-reliquary']
    const tight = ship(two)
    let after = tight
    for (const id of two) {
      after = expeditionStep(after, { k: 'attuneRelic', hero: 'runesmith', relicId: id })
    }
    expect(after.heroRecords.runesmith.attuned).toHaveLength(1)

    const wide = ship(two)
    wide.heroRecords.runesmith.perks = ['smith-relicbearer']
    let both = wide
    for (const id of two) {
      both = expeditionStep(both, { k: 'attuneRelic', hero: 'runesmith', relicId: id })
    }
    expect(both.heroRecords.runesmith.attuned).toHaveLength(2)
  })

  it('counts every relic worn by either of them as attuned', () => {
    const s = ship(['binding-cord', 'choir-shard'])
    let after = expeditionStep(s, { k: 'attuneRelic', hero: 'runesmith', relicId: 'binding-cord' })
    after = expeditionStep(after, { k: 'attuneRelic', hero: 'echoreader', relicId: 'choir-shard' })
    expect(attunedRelics(after)).toHaveLength(2)
  })
})

describe('where relics come from and go', () => {
  const EXPLORE: MissionSpec = {
    kind: 'exploration',
    objective: { k: 'collect', count: 2 },
    difficulty: 1,
    enemyScale: 0.4,
    roundLimit: 16,
    rewards: [],
    briefing: { hu: 'x', en: 'x' },
  }

  it('brings home one named relic for every relic carried out', () => {
    const s = ship()
    s.activeMission = {
      k: 'battle',
      nodeId: s.at,
      spec: EXPLORE,
      battle: startMission({
        seed: 3,
        difficulty: 1,
        objective: EXPLORE.objective,
        missionKind: 'exploration',
        flux: 5,
        roundLimit: 16,
        heroes: s.heroes,
        enemyScale: 0.4,
      }),
    }
    s.screen = 'mission'
    const after = expeditionStep(s, { k: 'settleBattle', as: 'victory' })
    expect(after.relics).toHaveLength(2)
    // Named, distinct things — not two copies of one.
    expect(new Set(after.relics).size).toBe(2)
    expect(after.tally.relicsFound).toBe(2)
  })

  it('sells one at a post, for what it is worth, and only when nobody wears it', () => {
    const s = ship(['ash-reliquary'])
    s.screen = 'market'
    const credits = s.resources.credits

    const worn = expeditionStep(s, { k: 'attuneRelic', hero: 'runesmith', relicId: 'ash-reliquary' })
    const refused = expeditionStep(worn, { k: 'sellRelic', relicId: 'ash-reliquary' })
    expect(refused.relics, 'sold off somebody’s neck').toContain('ash-reliquary')

    const stowed = expeditionStep(worn, {
      k: 'stowRelic',
      hero: 'runesmith',
      relicId: 'ash-reliquary',
    })
    const sold = expeditionStep(stowed, { k: 'sellRelic', relicId: 'ash-reliquary' })
    expect(sold.relics).not.toContain('ash-reliquary')
    expect(sold.resources.credits).toBe(credits + relic('ash-reliquary').value)
  })

  it('will not sell anything anywhere but a post', () => {
    const s = ship(['ash-reliquary'])
    s.screen = 'ship'
    const after = expeditionStep(s, { k: 'sellRelic', relicId: 'ash-reliquary' })
    expect(after.relics).toContain('ash-reliquary')
  })
})
