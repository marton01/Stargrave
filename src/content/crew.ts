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

export type CrewMember = {
  id: string
  /** Invented name — deliberately language neutral. */
  name: string
  speciality: CrewSpeciality
  traits: CrewTraitId[]
  /** Which station they are standing on, if any. */
  station: string | null
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
  }
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
