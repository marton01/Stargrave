// Hero advancement: marks, and what they buy.
//
// Two rules are being defended here, and they are the ones a perk track fails at
// if nobody is watching.
//
// The first is that the two currencies are actually different. If both heroes are
// paid for the same things then there is one currency with two names, and the
// "personal" track is decoration. So: he is paid for the ship coming out of a
// boarding action whole, she is paid for reading mechanisms, and the test says so
// in those terms.
//
// The second is that no perk is a lie. Every field a PerkEffect can carry has to
// be read by something in the engine — the same problem as the modules that did
// nothing and the crew headcount that did nothing. The last test in this file
// buys every perk in the game one at a time and insists that the ship measurably
// changes.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  attunementSlots,
  bondRange,
  expeditionStep,
  forgeOutput,
  heroMaxHp,
  labOutput,
  loyaltyTarget,
  mentorLimit,
  sensorOutput,
  shipBonus,
  startExpedition,
  travelWeeks,
  weeklyAttention,
  weeklyFromModules,
} from './expedition'
import { HERO_PERKS, perksOf } from '../../content/advance'
import { HERO_ORDER, moraleTarget } from './expedition'
import { startMission } from '../battle'
import { generatePuzzle } from '../puzzles/index'
import type { Puzzle } from '../puzzles/types'
import type { ExpeditionState, MissionSpec } from './types'
import type { HeroClassId } from '../types'

function ship(withParty?: HeroClassId[]): ExpeditionState {
  const s = startExpedition(31, 'medium', newArchive(), undefined, withParty)
  // The dials are the designed game; the orders are not what this file is about,
  // and an order coming good would pay marks and muddy every count below.
  s.directives = []
  s.dials.directives = 1
  return s
}

const LANDING: MissionSpec = {
  kind: 'combat',
  objective: { k: 'eliminate' },
  difficulty: 1,
  enemyScale: 1,
  roundLimit: null,
  rewards: [],
  briefing: { hu: 'x', en: 'x' },
}

/** Stand an expedition in a battle and hand it the outcome. */
function settled(
  spec: MissionSpec,
  as: 'victory' | 'defeat',
  modules: ExpeditionState['modules'] = [],
): ExpeditionState {
  const s = ship()
  s.modules = modules
  s.activeMission = {
    k: 'battle',
    nodeId: s.at,
    spec,
    battle: startMission({
      seed: 5,
      difficulty: spec.difficulty,
      objective: spec.objective,
      missionKind: spec.kind,
      flux: 5,
      roundLimit: spec.roundLimit,
      heroes: s.heroes,
      enemyScale: spec.enemyScale,
      installations: spec.aboard ? modules : [],
    }),
  }
  s.screen = 'mission'
  return expeditionStep(s, { k: 'settleBattle', as })
}

function marks(s: ExpeditionState, hero: HeroClassId): number {
  return s.heroRecords[hero].marks
}

describe('what each of them is paid for', () => {
  it('pays both of them for a landing won', () => {
    const after = settled(LANDING, 'victory')
    expect(marks(after, 'runesmith')).toBeGreaterThan(0)
    expect(marks(after, 'echoreader')).toBeGreaterThan(0)
  })

  it('pays the Runesmith more for a boarding action that cost no modules', () => {
    // Nothing is at stake on the board here, so nothing can be lost — which is
    // exactly the case the extra marks are for: the ship came through whole.
    const after = settled({ ...LANDING, aboard: true }, 'victory')
    expect(marks(after, 'runesmith')).toBeGreaterThan(marks(after, 'echoreader'))
  })

  it('pays neither of them for a landing lost', () => {
    const after = settled(LANDING, 'defeat')
    expect(marks(after, 'runesmith')).toBe(0)
    expect(marks(after, 'echoreader')).toBe(0)
  })

  it('pays only the Echo-reader for reading a mechanism', () => {
    const s = ship()
    s.activeMission = {
      k: 'puzzle',
      nodeId: s.at,
      kind: 'runeDecode',
      difficulty: 1,
      rewards: [],
      puzzle: solvedPuzzle(),
      briefing: { hu: 'x', en: 'x' },
    }
    const after = expeditionStep(s, { k: 'missionFinish' })
    expect(marks(after, 'echoreader')).toBeGreaterThan(0)
    expect(marks(after, 'runesmith')).toBe(0)
  })
})

/**
 * A rune-decode puzzle that has already been read correctly.
 *
 * Solving one properly from a test would be re-implementing the puzzle; what is
 * under test here is the payout, so the mechanism is handed over finished — with
 * the secret guessed exactly, which is what `puzzleStatus` calls solved.
 */
function solvedPuzzle(): Puzzle {
  const generated = generatePuzzle('runeDecode', 7, 1, 3)
  if (generated.k !== 'runeDecode') throw new Error('expected a rune decode')
  const secret = generated.s.secret
  return {
    k: 'runeDecode',
    s: {
      ...generated.s,
      guesses: [{ guess: [...secret], exact: secret.length, partial: 0 }],
    },
  }
}

describe('spending marks', () => {
  it('will not sell a perk there are no marks for', () => {
    const s = ship()
    const after = expeditionStep(s, { k: 'buyPerk', hero: 'runesmith', perkId: 'smith-ironback' })
    expect(after.heroRecords.runesmith.perks).toHaveLength(0)
  })

  it('will not sell the same perk twice', () => {
    const s = ship()
    s.heroRecords.runesmith.marks = 20
    const once = expeditionStep(s, { k: 'buyPerk', hero: 'runesmith', perkId: 'smith-ironback' })
    const twice = expeditionStep(once, { k: 'buyPerk', hero: 'runesmith', perkId: 'smith-ironback' })
    expect(twice.heroRecords.runesmith.perks).toEqual(['smith-ironback'])
    expect(twice.heroRecords.runesmith.marks).toBe(once.heroRecords.runesmith.marks)
  })

  it('holds the prerequisites', () => {
    const s = ship()
    s.heroRecords.runesmith.marks = 20
    // Rampart needs Wardlines, which needs Ironback.
    const after = expeditionStep(s, { k: 'buyPerk', hero: 'runesmith', perkId: 'smith-rampart' })
    expect(after.heroRecords.runesmith.perks).toHaveLength(0)
  })

  it('will not let one player spend the other one’s marks', () => {
    const s = ship()
    s.heroRecords.echoreader.marks = 20
    // His track, her purse: nothing happens.
    const after = expeditionStep(s, { k: 'buyPerk', hero: 'runesmith', perkId: 'smith-ironback' })
    expect(after.heroRecords.runesmith.perks).toHaveLength(0)
    expect(after.heroRecords.echoreader.marks).toBe(20)
  })

  it('refuses a perk from the other hero’s list outright', () => {
    const s = ship()
    s.heroRecords.runesmith.marks = 20
    const after = expeditionStep(s, { k: 'buyPerk', hero: 'runesmith', perkId: 'reader-longsight' })
    expect(after.heroRecords.runesmith.perks).toHaveLength(0)
  })

  it('puts the card a perk grants into that hero’s deck, and only theirs', () => {
    const s = ship()
    s.heroRecords.echoreader.marks = 40
    let after = s
    for (const id of ['reader-tether', 'reader-still-note']) {
      after = expeditionStep(after, { k: 'buyPerk', hero: 'echoreader', perkId: id })
    }
    const reader = after.heroes.find((h) => h.heroClass === 'echoreader')!
    const smith = after.heroes.find((h) => h.heroClass === 'runesmith')!
    expect(reader.hand).toContain('er-still-note')
    expect(smith.hand).not.toContain('er-still-note')
  })
})

describe('no perk is a lie', () => {
  /**
   * Everything about the ship a perk could plausibly touch, in one vector.
   *
   * If buying a perk changes nothing here, either the perk does nothing or the
   * engine is not reading a field it was given — which is the same bug from the
   * player's side.
   */
  function probe(s: ExpeditionState): string {
    return [
      ...HERO_ORDER.map((hero) => heroMaxHp(s, hero)),
      ...HERO_ORDER.map((hero) => attunementSlots(s, hero)),
      ...HERO_ORDER.map((hero) => mentorLimit(s, hero)),
      shipBonus(s, 'flux'),
      shipBonus(s, 'wards'),
      sensorOutput(s),
      labOutput(s),
      forgeOutput(s),
      moraleTarget(s),
      bondRange(s),
      weeklyAttention(s),
      // What the perks that pay on the road reach. A field nobody probes here is
      // a field a perk can quietly do nothing to.
      ...(['food', 'fuel', 'credits', 'information', 'hull', 'morale'] as const).map((id) =>
        weeklyFromModules(s, id),
      ),
      loyaltyTarget(s, s.crew[0]!),
      travelWeeks(s, 4),
      shipBonus(s, 'crewXp'),
      shipBonus(s, 'startShield'),
      s.heroes.map((h) => h.hand.length).join('/'),
    ].join('|')
  }

  /**
   * Perks whose effect cannot show up the moment they are bought, with the test
   * that does cover them. Named rather than silently skipped: an unexplained
   * exception here is how a dead perk would get in.
   */
  const excused: Record<string, string> = {
    // Only does anything at the end of a landing, with something in the lost
    // pile. See "the Echo-reader's Remembrance" below.
    'reader-remembrance': 'covered by the Remembrance test',
  }

  it('changes something measurable for every perk in the game', () => {
    for (const perk of HERO_PERKS) {
      if (excused[perk.id]) continue
      // The whole table, so the perk's owner is actually aboard.
      const s = ship(HERO_ORDER)
      // Every station manned and powered, so the outputs a perk adds to are
      // actually running and a change can be seen. This matters: a bonus to the
      // Sensors is worth exactly nothing while nobody is standing on them, which
      // is the rule — and the descriptions of the three things that add sensor
      // range say so.
      for (const id of Object.keys(s.power) as (keyof typeof s.power)[]) s.power[id] = 1
      const stations = ['sensors', 'lab', 'forge', 'bridge', 'medbay', 'sanctum'] as const
      s.crew.forEach((member, i) => {
        member.station = stations[i % stations.length]!
      })
      s.travel = { to: s.map.nodes[1]!.id, weeksLeft: 2 }
      const record = s.heroRecords[perk.heroClass]
      record.marks = 99
      record.perks = perk.requires.slice()

      const before = probe(s)
      const after = expeditionStep(s, { k: 'buyPerk', hero: perk.heroClass, perkId: perk.id })
      expect(after.heroRecords[perk.heroClass].perks, `${perk.id}: not bought`).toContain(perk.id)
      expect(probe(after), `${perk.id} (${perk.name.en}) changed nothing`).not.toBe(before)
    }
  })

  it('gives every hero something that pays between landings', () => {
    // A hero used to stop being a hero the moment a landing ended: marks bought
    // toughness and cards, so between fights the four of them were
    // interchangeable. Each of them now has at least one perk that is felt on a
    // week when nothing happens.
    const onTheRoad = (effect: (typeof HERO_PERKS)[number]['effect']) =>
      effect.weekly !== undefined ||
      effect.loyaltyTarget !== undefined ||
      effect.travelCut !== undefined ||
      effect.crewXp !== undefined ||
      effect.moraleTarget !== undefined ||
      effect.mentees !== undefined ||
      effect.sensorRange !== undefined
    for (const hero of HERO_ORDER) {
      expect(
        perksOf(hero).filter((p) => onTheRoad(p.effect)).length,
        `${hero} has nothing to buy that matters outside a fight`,
      ).toBeGreaterThanOrEqual(2)
    }
  })

  it('shortens a long jump and leaves a short one alone', () => {
    // The distances on the map ARE the game. A hero who could turn every hop
    // into a one-week hop would be paying nothing for it, so what she knows only
    // bites on a leg long enough to be worth knowing something about.
    const s = ship(HERO_ORDER)
    s.power.engines = 1
    const plain = [travelWeeks(s, 1), travelWeeks(s, 2), travelWeeks(s, 4)]
    s.heroRecords.echoreader.perks = ['reader-longsight', 'reader-borrowed-hour']
    expect(travelWeeks(s, 1)).toBe(plain[0])
    expect(travelWeeks(s, 2)).toBe(plain[1])
    expect(travelWeeks(s, 4)).toBe(plain[2]! - 1)
  })

  it('gives every hero something to spend marks on', () => {
    for (const hero of HERO_ORDER) {
      expect(perksOf(hero).length, hero).toBeGreaterThanOrEqual(5)
      // And a first purchase that needs nothing: a track whose every entry has a
      // prerequisite can never be started.
      expect(perksOf(hero).some((p) => p.requires.length === 0), hero).toBe(true)
    }
  })
})

describe('the Echo-reader’s Remembrance', () => {
  it('brings one permanently lost card back after a landing', () => {
    const s = ship()
    s.heroRecords.echoreader.perks = ['reader-longsight', 'reader-archivist', 'reader-remembrance']
    const reader = s.heroes.find((h) => h.heroClass === 'echoreader')!
    reader.lost = ['er-echo', 'er-dimming']
    const smith = s.heroes.find((h) => h.heroClass === 'runesmith')!
    smith.lost = ['rs-shove']

    const after = settledFrom(s, LANDING, 'victory')
    const readerAfter = after.heroes.find((h) => h.heroClass === 'echoreader')!
    const smithAfter = after.heroes.find((h) => h.heroClass === 'runesmith')!
    expect(readerAfter.lost).toEqual(['er-dimming'])
    expect(readerAfter.hand).toContain('er-echo')
    // Nothing of his comes back: the perk is hers.
    expect(smithAfter.lost).toEqual(['rs-shove'])
  })
})

/** Same as `settled`, but from a state that has already been set up. */
function settledFrom(
  s: ExpeditionState,
  spec: MissionSpec,
  as: 'victory' | 'defeat',
): ExpeditionState {
  const staged: ExpeditionState = {
    ...s,
    screen: 'mission',
    activeMission: {
      k: 'battle',
      nodeId: s.at,
      spec,
      battle: startMission({
        seed: 5,
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
  return expeditionStep(staged, { k: 'settleBattle', as })
}

describe('four seats, four different accounts', () => {
  // The point of separate currencies is that they are earned differently. If
  // every class is paid for the same things then this is one currency with four
  // names, and the "your own track" idea is decoration.
  it('pays the Cantor for a party that all walked back', () => {
    const s = ship(HERO_ORDER)
    const after = settledFrom(s, LANDING, 'victory')
    // Nobody fell in a settled victory, which is exactly her condition.
    expect(marks(after, 'cantor')).toBeGreaterThan(marks(after, 'echoreader'))
  })

  it('pays the Surveyor for the week the Sensors read the road', () => {
    const s = ship(HERO_ORDER)
    // Somebody on the Sensors, and power for them.
    s.crew[0]!.station = 'sensors'
    s.power.sensors = 2
    const after = expeditionStep(s, { k: 'advanceWeek' })
    expect(marks(after, 'surveyor')).toBeGreaterThan(0)
    expect(marks(after, 'runesmith')).toBe(0)
  })

  it('pays nothing to a class that stayed at home', () => {
    // A party of two: the Cantor is not on this expedition, so the landing that
    // would have paid her pays her nothing.
    const s = ship()
    const after = settledFrom(s, LANDING, 'victory')
    expect(after.heroRecords.cantor.marks).toBe(0)
    expect(after.heroRecords.surveyor.marks).toBe(0)
    expect(marks(after, 'runesmith')).toBeGreaterThan(0)
  })
})
