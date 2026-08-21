// Research projects: two branches, one pool of Information.
//
// The dilemma is deliberately sharp. The TECHNOLOGY branch makes the ship
// stronger. The UNDERSTANDING branch makes it no stronger at all — but it is the
// only thing that decides what you can actually do when you reach the Heart.
// The purely optimising route is not the winning route, and the player has to
// work that out for themselves.

import type { Text } from '../engine/types'
import type { ModuleId } from './ship'
import type { PuzzleKind } from '../engine/puzzles/types'

export type ResearchBranch = 'technology' | 'understanding'

export type ResearchEffect =
  | { k: 'module'; id: ModuleId }
  | { k: 'understanding'; amount: number }
  | { k: 'reactor'; amount: number }
  | { k: 'unlockPuzzle'; kind: PuzzleKind }
  | { k: 'heroCard'; cardId: string }

export type ResearchProject = {
  id: string
  branch: ResearchBranch
  name: Text
  description: Text
  /** Information spent up front. */
  cost: number
  /** Weeks in the Lab. The Archive station shaves one off. */
  weeks: number
  /** Projects that must be finished first. */
  requires: string[]
  effects: ResearchEffect[]
}

export const RESEARCH_PROJECTS: ResearchProject[] = [
  // ------------------------------------------------------------- technology
  {
    id: 'tech-hull-lattice',
    branch: 'technology',
    name: { hu: 'Rácsos merevítés', en: 'Hull lattice' },
    description: {
      hu: 'A hajótest szerkezetének átgondolása. A hajótest felső határa 20 → 26.',
      en: 'Rethinking the ship’s frame. Hull capacity 20 → 26.',
    },
    cost: 6,
    weeks: 2,
    requires: [],
    effects: [{ k: 'module', id: 'reinforcedHull' }],
  },
  {
    id: 'tech-fuel-synthesis',
    branch: 'technology',
    name: { hu: 'Üzemanyag-szintézis', en: 'Fuel synthesis' },
    description: {
      hu:
        'Üzemanyagot vonni ki a csillagközi porból. Hetente 1 egységet kiegyenlít út közben — ' +
        'jó hajtómű-beállítással és navigátorokkal a Hídon az utazás ingyenessé tehető. ' +
        'A tartályt nem tölti: állva nem termel.',
      en:
        'Drawing fuel out of interstellar dust. Offsets 1 unit for every week under way — with the ' +
        'right engine setting and navigators on the Bridge, travel can be made free. It does not ' +
        'fill the tank: standing still it makes nothing.',
    },
    // Priced up when it became "travel for nothing" rather than "+1 a week".
    cost: 14,
    weeks: 3,
    requires: [],
    effects: [{ k: 'module', id: 'fuelSynthesiser' }],
  },
  {
    id: 'tech-hydroponics',
    branch: 'technology',
    name: { hu: 'Hidropónia', en: 'Hydroponics' },
    description: {
      hu: 'Élelmet termelni a fedélzeten. Hetente +2 élelem, és a felső határ 60 → 70.',
      en: 'Growing food aboard. +2 food a week, and capacity 60 → 70.',
    },
    cost: 7,
    weeks: 2,
    requires: [],
    effects: [{ k: 'module', id: 'hydroponics' }],
  },
  {
    id: 'tech-rune-amplifier',
    branch: 'technology',
    name: { hu: 'Rúnaerősítő', en: 'Rune amplifier' },
    description: {
      hu: 'A rúnamag energiáját sűríteni. A partraszálló csapat +2 Fluxussal indul.',
      en: 'Concentrating the rune core’s output. The landing party starts with +2 Flux.',
    },
    cost: 10,
    weeks: 3,
    requires: [],
    effects: [{ k: 'module', id: 'runeAmplifier' }],
  },
  {
    id: 'tech-deep-sensors',
    branch: 'technology',
    name: { hu: 'Mélyérzékelők', en: 'Deep sensors' },
    description: {
      hu: 'Egy oszloppal messzebb látni a csillagtérképen.',
      en: 'Seeing one column further on the star map.',
    },
    cost: 8,
    weeks: 2,
    requires: [],
    effects: [{ k: 'module', id: 'deepSensors' }],
  },
  {
    id: 'tech-reactor-tap',
    branch: 'technology',
    name: { hu: 'Reaktorcsapolás', en: 'Reactor tap' },
    description: {
      hu: 'Kockázatos beavatkozás a reaktorba. A kimenet +2 egység — ez a legerősebb fejlesztés a hajón.',
      en: 'A risky intervention in the reactor. Output +2 units — the strongest upgrade on the ship.',
    },
    cost: 16,
    weeks: 4,
    requires: ['tech-hull-lattice'],
    effects: [{ k: 'module', id: 'reactorTap' }],
  },
  {
    id: 'tech-boarding-wards',
    branch: 'technology',
    name: { hu: 'Átszálló-rúnák', en: 'Boarding wards' },
    description: {
      hu: 'Rúnákat véglegesíteni a zsilipekbe. A találkozások 2-vel kevesebb hajótestet visznek.',
      en: 'Setting runes permanently into the airlocks. Encounters cost 2 less hull.',
    },
    cost: 11,
    weeks: 3,
    requires: [],
    effects: [{ k: 'module', id: 'boardingWards' }],
  },
  {
    id: 'tech-echo-vault',
    branch: 'technology',
    name: { hu: 'Visszhang-kamra', en: 'Echo vault' },
    description: {
      hu: 'Tárolni, amit a Labor megfejtett. Hetente +1 információ, és a felső határ 60 → 80.',
      en: 'Storing what the Lab has decoded. +1 information a week, and capacity 60 → 80.',
    },
    cost: 9,
    weeks: 3,
    requires: [],
    effects: [{ k: 'module', id: 'echoVault' }],
  },

  // ----------------------------------------------------------- understanding
  {
    id: 'und-first-inscriptions',
    branch: 'understanding',
    name: { hu: 'Az első feliratok', en: 'The first inscriptions' },
    description: {
      hu: 'A jelrendszer alapszabályai. Ettől nem lesz erősebb a hajó — de olvasni kezdesz.',
      en: 'The basic rules of the sign system. It makes the ship no stronger — but you begin to read.',
    },
    cost: 5,
    weeks: 2,
    requires: [],
    effects: [
      { k: 'understanding', amount: 2 },
      { k: 'unlockPuzzle', kind: 'glyphs' },
    ],
  },
  {
    id: 'und-the-silence',
    branch: 'understanding',
    name: { hu: 'A csend természete', en: 'The nature of the silence' },
    description: {
      hu: 'Nem háború volt. Ez az első bizonyíték rá.',
      en: 'It was not a war. This is the first evidence of that.',
    },
    cost: 9,
    weeks: 3,
    requires: ['und-first-inscriptions'],
    effects: [{ k: 'understanding', amount: 3 }],
  },
  {
    id: 'und-godmachines',
    branch: 'understanding',
    name: { hu: 'Az isten-gépek célja', en: 'The purpose of the godmachines' },
    description: {
      hu: 'Nem fegyverek voltak. Valamit tartottak — és abbahagyták.',
      en: 'They were not weapons. They were holding something — and they stopped.',
    },
    cost: 13,
    weeks: 3,
    requires: ['und-the-silence'],
    effects: [
      { k: 'understanding', amount: 3 },
      { k: 'unlockPuzzle', kind: 'starChart' },
    ],
  },
  {
    id: 'und-the-choir',
    branch: 'understanding',
    name: { hu: 'A Kórus', en: 'The Choir' },
    description: {
      hu: 'A fantomok nem szellemek. Ők a maradék, ami a dalból megmaradt.',
      en: 'The wraiths are not ghosts. They are what is left of the song.',
    },
    cost: 15,
    weeks: 4,
    requires: ['und-godmachines'],
    effects: [
      { k: 'understanding', amount: 4 },
      { k: 'unlockPuzzle', kind: 'refraction' },
    ],
  },
  {
    id: 'und-what-finished-them',
    branch: 'understanding',
    name: { hu: 'Ami befejezte őket', en: 'What finished them' },
    description: {
      hu: 'A legmélyebb réteg. Ha ezt megérted, a Csillagsírban nem tehetetlen leszel.',
      en: 'The deepest layer. Understand this and you will not be helpless in the Stargrave.',
    },
    cost: 20,
    weeks: 4,
    requires: ['und-the-choir'],
    effects: [{ k: 'understanding', amount: 5 }],
  },
]

const PROJECT_INDEX = new Map(RESEARCH_PROJECTS.map((p) => [p.id, p]))

export function researchProject(id: string): ResearchProject {
  const p = PROJECT_INDEX.get(id)
  if (!p) throw new Error(`No such research project: ${id}`)
  return p
}

/** Which projects can be started right now? */
export function availableProjects(completed: readonly string[]): ResearchProject[] {
  return RESEARCH_PROJECTS.filter(
    (p) => !completed.includes(p.id) && p.requires.every((r) => completed.includes(r)),
  )
}

/**
 * Understanding tiers, and what each one lets you do in the Heart.
 * The whole endgame hangs off this number.
 */
export const UNDERSTANDING_TIERS = [
  { min: 0, tier: 0 },
  { min: 3, tier: 1 },
  { min: 8, tier: 2 },
  { min: 14, tier: 3 },
] as const

export function understandingTier(understanding: number): 0 | 1 | 2 | 3 {
  if (understanding >= 14) return 3
  if (understanding >= 8) return 2
  if (understanding >= 3) return 1
  return 0
}
