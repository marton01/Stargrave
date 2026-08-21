// Crew: specialities, traits and name generation.
//
// The names are invented rather than drawn from any real language, so they read
// the same in Hungarian and English and never need translating. Everything the
// player reads *about* a crew member is bilingual.

import type { Rng } from '../engine/rng'
import type { Text } from '../engine/types'

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
  /** Extra Information per week while assigned to the Lab or the Archive. */
  research?: number
  /** Extra output on their matching station. */
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
      hu: 'Először látja a csillagokat innen. Lelkes, de még tanul.',
      en: 'Seeing the stars from here for the first time. Eager, but still learning.',
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
      hu: 'Nem tud egy helyben maradni. Gyorsabb munka, romló morál.',
      en: 'Cannot sit still. Faster work, worse morale.',
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
}

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
