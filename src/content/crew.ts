// Crew: specialities, traits and name generation.
//
// The names are invented rather than drawn from any real language, so they read
// the same in Hungarian and English and never need translating. Everything the
// player reads *about* a crew member is bilingual.

import type { Rng } from '../engine/rng'
import type { HeroClassId, Text } from '../engine/types'

export type CrewSpeciality = 'engineer' | 'scientist' | 'guard' | 'medic' | 'navigator'

export type CrewTraitId =
  | 'brave'
  | 'sceptical'
  | 'alienBorn'
  | 'veteran'
  | 'young'
  | 'devout'
  | 'restless'
  | 'meticulous'

export const SPECIALITY_NAMES: Record<CrewSpeciality, Text> = {
  engineer: { hu: 'mérnök', en: 'engineer' },
  scientist: { hu: 'tudós', en: 'scientist' },
  guard: { hu: 'őr', en: 'guard' },
  medic: { hu: 'gyógyító', en: 'medic' },
  navigator: { hu: 'navigátor', en: 'navigator' },
}

export type CrewTrait = {
  id: CrewTraitId
  name: Text
  description: Text
  /** Weekly morale contribution while this member is aboard. */
  morale?: number
  /** Extra Information per week while assigned to the Lab. */
  research?: number
  /**
   * Extra output on the station their speciality is at home on — and only there.
   *
   * Only there, because otherwise this is a general competence bonus that makes a
   * veteran engineer a better scientist than a scientist. Every trait carrying
   * this field says so in its own description.
   */
  station?: number
  /** Bonus when the ship works on alien technology. */
  alienTech?: number
}

export const CREW_TRAITS: Record<CrewTraitId, CrewTrait> = {
  brave: {
    id: 'brave',
    name: { hu: 'bátor', en: 'brave' },
    description: {
      hu: 'Nem inog meg. A hajó morálja jobban áll, amíg fedélzeten van.',
      en: 'Does not waver. Ship morale holds better while they are aboard.',
    },
    morale: 1,
  },
  sceptical: {
    id: 'sceptical',
    name: { hu: 'kétkedő', en: 'sceptical' },
    description: {
      hu: 'Mindent kétszer ellenőriz. Több Információ, kevesebb morál.',
      en: 'Checks everything twice. More Information, less morale.',
    },
    morale: -1,
    research: 1,
  },
  alienBorn: {
    id: 'alienBorn',
    name: { hu: 'idegen származású', en: 'of alien descent' },
    description: {
      hu: 'Ismerős neki, ami mindenki másnak érthetetlen. Bónusz az idegen technológiához.',
      en: 'Familiar with what everyone else finds unreadable. Bonus with alien technology.',
    },
    alienTech: 1,
  },
  veteran: {
    id: 'veteran',
    name: { hu: 'veterán', en: 'veteran' },
    description: {
      hu: 'Már volt a Kapun túl. A saját állomásán érezhetően hatékonyabb.',
      en: 'Has been beyond the Gate before. Noticeably more effective on their own station.',
    },
    station: 1,
  },
  young: {
    id: 'young',
    name: { hu: 'fiatal', en: 'young' },
    description: {
      hu:
        'Először látja a csillagokat innen. Lelkes, de még tanul: a saját szakmája állomásán ' +
        'egyelőre kevesebbet ér.',
      en:
        'Seeing the stars from here for the first time. Eager, but still learning: worth less for ' +
        'now on the station of their own speciality.',
    },
    morale: 1,
    station: -1,
  },
  devout: {
    id: 'devout',
    name: { hu: 'hitvalló', en: 'devout' },
    description: {
      hu: 'A Szentélyben tartja a hajót együtt. Erős morál, de nehezen fogadja az idegen technológiát.',
      en: 'Holds the ship together in the Sanctum. Strong morale, uneasy with alien technology.',
    },
    morale: 2,
    alienTech: -1,
  },
  restless: {
    id: 'restless',
    name: { hu: 'nyugtalan', en: 'restless' },
    description: {
      hu:
        'Nem tud egy helyben maradni. A saját szakmája állomásán gyorsabb munka, de a hajó ' +
        'morálja romlik tőle.',
      en:
        'Cannot sit still. Faster work on the station of their own speciality, and worse ship ' +
        'morale for it.',
    },
    morale: -1,
    station: 1,
  },
  meticulous: {
    id: 'meticulous',
    name: { hu: 'pedáns', en: 'meticulous' },
    description: {
      hu: 'Lassan, de hibátlanul dolgozik. Több Információ.',
      en: 'Works slowly and without error. More Information.',
    },
    research: 1,
  },
}

/**
 * What two people are to each other.
 *
 * `trust` is two people who have worked together before and get more done for
 * it; `friction` is two people who cannot be in the same room without it
 * costing something. Both are symmetric: the pair is stored on both of them so
 * that neither list is a half-truth.
 */
export type CrewBondKind = 'trust' | 'friction'

export type CrewBond = { with: string; kind: CrewBondKind }

export const BOND_NAMES: Record<CrewBondKind, Text> = {
  trust: { hu: 'jól dolgoznak együtt', en: 'work well together' },
  friction: { hu: 'nem bírják egymást', en: 'cannot stand each other' },
}

/** What a pair on the same station is worth, each. */
export const BOND_STRENGTH: Record<CrewBondKind, number> = { trust: 1, friction: -1 }

export type CrewMember = {
  id: string
  /** Invented name — deliberately language neutral. */
  name: string
  speciality: CrewSpeciality
  traits: CrewTraitId[]
  /** Which station they are standing on, if any. */
  station: string | null
  /**
   * Who this person works well with, and who they cannot work with at all.
   *
   * The crew screen used to be a table to fill in: every body was worth the same
   * everywhere, so posting them was arithmetic. A pair turns it into a puzzle
   * with a right answer that changes as people die and arrive.
   */
  bonds: CrewBond[]
  alive: boolean
  /** Weeks aboard. Purely for the crew list, but it makes losses land harder. */
  weeksAboard: number
  /**
   * Weeks of useful work done, which is what a rank is made of.
   *
   * A crew member used to be a fixed card: the same name and the same two traits
   * in week one and week twenty-eight. So there was no reason to keep anybody
   * anywhere — a body was a body, and a loss was a number. Work counts now, and
   * that makes a five-week veteran of the Lab a thing you do not want to move.
   */
  xp: number
  /**
   * How much this person still believes in the expedition. Nought to ten.
   *
   * Not a mood: a judgement. It drifts towards what the ship has actually been
   * like to live on — morale, whether the air holds, whether anybody noticed them
   * — and at the bottom of it people leave, and take things with them.
   *
   * The point of it is that a betrayal must never be a die roll. By the time
   * somebody walks off with the fuel, the crew list has been saying for three
   * weeks that they stopped talking to anybody. That is the difference between a
   * consequence and an ambush.
   */
  loyalty: number
  /**
   * The hero who took them under their wing, if either did.
   *
   * Mentoring is the smallest possible co-operative hook and the one that was
   * most obviously missing: the crew list belonged to nobody. A mentee learns
   * faster, and once they are any good their mentor earns marks for their work.
   */
  mentor: HeroClassId | null
}

/**
 * Ranks, from the work they have done. Derived rather than stored, so there is
 * exactly one definition of what a rank is.
 *
 * A station gives one point a week, two if the person is mentored. So trained is
 * eight weeks of work — or four under somebody's wing — and master is twenty, or
 * ten. Long enough that leaving somebody in place is a decision; short enough
 * that it happens inside one expedition.
 */
export const RANK_XP = [0, 8, 20] as const

export function crewRank(member: CrewMember): 1 | 2 | 3 {
  if (member.xp >= RANK_XP[2]) return 3
  if (member.xp >= RANK_XP[1]) return 2
  return 1
}

/** Work still needed for the next rank, or null at the top. */
export function xpToNextRank(member: CrewMember): number | null {
  const rank = crewRank(member)
  if (rank === 3) return null
  return RANK_XP[rank] - member.xp
}

export const RANK_NAMES: Record<1 | 2 | 3, Text> = {
  1: { hu: 'újonc', en: 'recruit' },
  2: { hu: 'képzett', en: 'trained' },
  3: { hu: 'mester', en: 'master' },
}

/**
 * Extra station strength a rank is worth.
 *
 * Two, and only at trained — the same weight as being the right specialist for
 * the station, so "eight weeks in the Lab" is worth as much as "trained as a
 * scientist". One point would have been invisible: most stations halve their
 * strength, so a single point disappears in the rounding, which is exactly how
 * the crew headcount used to do nothing at five stations.
 *
 * The master rank adds nothing here on purpose. Its reward is the trait the
 * person learns, which is a change to who they are rather than another number —
 * and some of those traits add station strength themselves.
 */
export function rankBonus(member: CrewMember): number {
  return crewRank(member) >= 2 ? 2 : 0
}

/** The traits a promotion may hand out: nothing that makes a person worse. */
export const LEARNABLE_TRAITS: CrewTraitId[] = [
  'brave',
  'veteran',
  'meticulous',
  'devout',
  'alienBorn',
]

// Invented syllables. Combined they give names that belong to no real language,
// which is exactly what we want for a dead galaxy — and it means the crew list
// never needs a translator.
const GIVEN_HEAD = ['Il', 'Ma', 'Ve', 'Ka', 'Ori', 'Sel', 'Tha', 'Nu', 'Ere', 'Jov', 'Ras', 'Ly']
const GIVEN_TAIL = ['va', 'ren', 'sa', 'dor', 'ka', 'mir', 'ne', 'lith', 'ta', 'quen', 'ro', 'sha']
const FAMILY_HEAD = ['Kern', 'Alcy', 'Vore', 'Sedd', 'Hala', 'Brann', 'Oste', 'Quill', 'Mard', 'Vesk']
const FAMILY_TAIL = ['', 'one', 'ir', 'a', 'en', 'is', 'ov', 'ath']

export function generateCrewName(rng: Rng): string {
  const given = `${rng.pick(GIVEN_HEAD)}${rng.pick(GIVEN_TAIL)}`
  const family = `${rng.pick(FAMILY_HEAD)}${rng.pick(FAMILY_TAIL)}`
  return `${given} ${family}`
}

const SPECIALITIES: CrewSpeciality[] = ['engineer', 'scientist', 'guard', 'medic', 'navigator']
const TRAIT_IDS = Object.keys(CREW_TRAITS) as CrewTraitId[]

export function generateCrewMember(rng: Rng, id: string, speciality?: CrewSpeciality): CrewMember {
  const traits = rng.shuffle(TRAIT_IDS).slice(0, rng.next() < 0.35 ? 2 : 1)
  return {
    id,
    name: generateCrewName(rng),
    speciality: speciality ?? rng.pick(SPECIALITIES) ?? 'engineer',
    traits,
    station: null,
    alive: true,
    weeksAboard: 0,
    xp: 0,
    mentor: null,
    loyalty: 7,
    bonds: [],
  }
}

/**
 * Tie a crew together: who gets on, and who does not.
 *
 * Symmetric, and written on both people. A one-sided grudge would be more
 * true to life and completely unreadable on a screen — the crew list has to be
 * able to say "these two" from either end of it.
 */
export function bindCrew(rng: Rng, crew: CrewMember[]): void {
  const pool = crew.filter((c) => c.alive)
  if (pool.length < 3) return
  const pairs = rng.shuffle(
    pool.flatMap((a, i) => pool.slice(i + 1).map((b) => [a, b] as const)),
  )
  // Two of each on a full crew: enough that a posting is a puzzle, few enough
  // that most people are simply people.
  const wanted = Math.max(1, Math.floor(pool.length / 3))
  let made = 0
  for (const [a, b] of pairs) {
    if (made >= wanted * 2) break
    if (a.bonds.some((x) => x.with === b.id) || b.bonds.some((x) => x.with === a.id)) continue
    const kind: CrewBondKind = made < wanted ? 'trust' : 'friction'
    a.bonds.push({ with: b.id, kind })
    b.bonds.push({ with: a.id, kind })
    made += 1
  }
}

/** What this person's pairings are worth at the station they are standing on. */
export function bondBonus(member: CrewMember, crew: readonly CrewMember[]): number {
  if (!member.station) return 0
  let total = 0
  for (const bond of member.bonds) {
    const other = crew.find((c) => c.id === bond.with)
    if (!other || !other.alive || other.station !== member.station) continue
    total += BOND_STRENGTH[bond.kind]
  }
  return total
}

/** Every pair currently standing on the same station, for the interface. */
export function activeBonds(
  crew: readonly CrewMember[],
): { a: CrewMember; b: CrewMember; kind: CrewBondKind }[] {
  const seen = new Set<string>()
  const out: { a: CrewMember; b: CrewMember; kind: CrewBondKind }[] = []
  for (const member of crew) {
    if (!member.alive || !member.station) continue
    for (const bond of member.bonds) {
      const other = crew.find((c) => c.id === bond.with)
      if (!other || !other.alive || other.station !== member.station) continue
      const key = [member.id, other.id].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ a: member, b: other, kind: bond.kind })
    }
  }
  return out
}

/** The starting complement: one of each speciality plus a spare hand. */
export function generateStartingCrew(rng: Rng): CrewMember[] {
  const roster = [...SPECIALITIES, rng.pick(SPECIALITIES) ?? 'engineer']
  return roster.map((speciality, i) => generateCrewMember(rng, `crew-${i}`, speciality))
}

/** Sum a numeric trait field over a set of crew members. */
export function traitBonus(
  crew: readonly CrewMember[],
  field: 'morale' | 'research' | 'station' | 'alienTech',
): number {
  return crew
    .filter((c) => c.alive)
    .reduce(
      (sum, c) => sum + c.traits.reduce((n, t) => n + (CREW_TRAITS[t][field] ?? 0), 0),
      0,
    )
}

// ---------------------------------------------------------------- loyalty

/** Where somebody's loyalty sits, in words, for the crew list. */
export const LOYALTY_BANDS: { min: number; name: Text; tone: 'good' | 'plain' | 'warn' | 'bad' }[] = [
  { min: 9, name: { hu: 'elkötelezett', en: 'committed' }, tone: 'good' },
  { min: 7, name: { hu: 'rendben van', en: 'steady' }, tone: 'plain' },
  { min: 5, name: { hu: 'fáradt', en: 'tired' }, tone: 'plain' },
  { min: 3, name: { hu: 'elhúzódott', en: 'withdrawn' }, tone: 'warn' },
  { min: 0, name: { hu: 'nem beszél senkivel', en: 'not speaking to anybody' }, tone: 'bad' },
]

export function loyaltyBand(member: CrewMember): (typeof LOYALTY_BANDS)[number] {
  return LOYALTY_BANDS.find((band) => member.loyalty >= band.min) ?? LOYALTY_BANDS[LOYALTY_BANDS.length - 1]!
}

/** At or below this, somebody starts thinking about leaving. */
export const LOYALTY_BREAKS = 2

/** Above this, they have thought better of it. */
export const LOYALTY_RECOVERS = 4
