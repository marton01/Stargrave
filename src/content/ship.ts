// The ship: power systems, stations, modules and resources.
//
// BALANCE: every number the weekly turn uses lives here. Reactor output, station
// output, module effects, weekly consumption — all of it is data, so tuning the
// strategic layer never means touching the reducer.

import type { Text } from '../engine/types'
import type { CrewSpeciality } from './crew'

// ---------------------------------------------------------------- resources

export type ResourceId = 'fuel' | 'food' | 'hull' | 'morale' | 'information' | 'credits'

export type ResourceGroup = 'physical' | 'human' | 'abstract'

export type ResourceDef = {
  id: ResourceId
  name: Text
  group: ResourceGroup
  /** Who spends it. Shared decisions are where the negotiation lives. */
  domain: 'engineering' | 'research' | 'shared'
  max: number
  start: number
  /** Reaching zero ends the expedition. */
  fatalAtZero: boolean
  icon: string
}

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  fuel: {
    id: 'fuel',
    name: { hu: 'Üzemanyag', en: 'Fuel' },
    group: 'physical',
    domain: 'shared',
    max: 40,
    start: 20,
    fatalAtZero: false,
    icon: '⛁',
  },
  food: {
    id: 'food',
    name: { hu: 'Élelem', en: 'Food' },
    group: 'physical',
    domain: 'shared',
    max: 60,
    start: 36,
    fatalAtZero: false,
    icon: '◍',
  },
  hull: {
    id: 'hull',
    name: { hu: 'Hajótest', en: 'Hull' },
    group: 'physical',
    domain: 'engineering',
    max: 20,
    start: 20,
    fatalAtZero: true,
    icon: '⬢',
  },
  morale: {
    id: 'morale',
    name: { hu: 'Morál', en: 'Morale' },
    group: 'human',
    domain: 'shared',
    max: 12,
    start: 8,
    fatalAtZero: true,
    icon: '☾',
  },
  information: {
    id: 'information',
    name: { hu: 'Információ', en: 'Information' },
    group: 'abstract',
    domain: 'research',
    max: 60,
    start: 4,
    fatalAtZero: false,
    icon: '◈',
  },
  credits: {
    id: 'credits',
    name: { hu: 'Kredit', en: 'Credits' },
    group: 'abstract',
    domain: 'shared',
    max: 99,
    start: 12,
    fatalAtZero: false,
    icon: '✧',
  },
}

export const RESOURCE_ORDER: ResourceId[] = [
  'fuel',
  'food',
  'hull',
  'morale',
  'information',
  'credits',
]

// ------------------------------------------------------------ power systems

export type SystemId =
  | 'lifeSupport'
  | 'engines'
  | 'shields'
  | 'lab'
  | 'forge'
  | 'sensors'
  | 'runeCore'

export type SystemDef = {
  id: SystemId
  name: Text
  description: Text
  max: number
  icon: string
  /**
   * Whose console this system sits on.
   *
   * The two players share one reactor, and that is the best argument in the game
   * — but "shared" meant nobody owned anything, and with nothing owned there was
   * nothing to argue FROM. Engineering is the Runesmith's side of the ship,
   * research is the Echo-reader's, and what is marked shared is genuinely a joint
   * call. The interface can filter by this, so each player has a screen that is
   * theirs.
   */
  domain: 'engineering' | 'research' | 'shared'
}

/**
 * Seven systems, eight units of reactor output. It is never enough, and what it
 * should go to changes every week — which is the whole point. This is the
 * strongest cooperative element in the game: one pool, two people.
 */
export const SYSTEMS: Record<SystemId, SystemDef> = {
  lifeSupport: {
    id: 'lifeSupport',
    name: { hu: 'Életfenntartás', en: 'Life support' },
    description: {
      hu: 'Kötelező minimum a legénységszám szerint. Ha kevés, romlik a morál és fogy a legénység.',
      en: 'A mandatory minimum by crew size. Too little and morale decays and people are lost.',
    },
    max: 4,
    icon: '❋',
    domain: 'shared',
  },
  engines: {
    id: 'engines',
    name: { hu: 'Hajtómű', en: 'Engines' },
    description: {
      hu: 'Utazási sebesség és étvágy: hány hét egy ugrás, és hetente mennyi üzemanyagba kerül.',
      en: 'Travel speed and thirst: how many weeks a jump takes, and what it burns a week.',
    },
    max: 3,
    icon: '➤',
    domain: 'shared',
  },
  shields: {
    id: 'shields',
    name: { hu: 'Pajzs', en: 'Shields' },
    description: {
      hu: 'Védelem találkozásokon. Kockázatos döntéseknél ez dönti el, mennyit visz el a hajótestből.',
      en: 'Protection in encounters. On risky choices it decides how much the hull pays.',
    },
    max: 3,
    icon: '◇',
    domain: 'engineering',
  },
  lab: {
    id: 'lab',
    name: { hu: 'Labor', en: 'Lab' },
    description: {
      hu: 'Információ-termelés és kutatási sebesség.',
      en: 'Information output and research speed.',
    },
    max: 3,
    icon: '◈',
    domain: 'research',
  },
  forge: {
    id: 'forge',
    name: { hu: 'Kohó', en: 'Forge' },
    description: {
      hu: 'Hajótest-javítás és gyártás. Ez a Rúnaszövő dolga.',
      en: 'Hull repair and fabrication. The Runesmith’s domain.',
    },
    max: 3,
    icon: '⚒',
    domain: 'engineering',
  },
  sensors: {
    id: 'sensors',
    name: { hu: 'Érzékelők', en: 'Sensors' },
    description: {
      hu: 'Mennyit látsz előre a csillagtérképen. A felderítés maga is befektetés.',
      en: 'How far ahead you can see on the star map. Scouting is itself an investment.',
    },
    max: 3,
    icon: '◉',
    domain: 'research',
  },
  runeCore: {
    id: 'runeCore',
    name: { hu: 'Rúnamag', en: 'Rune core' },
    description: {
      hu: 'Ebből lesz a partraszálló csapat Töltete. Amit ide adtál, azzal fognak harcolni.',
      en: 'This becomes the landing party’s Flux. Whatever you give it is what they fight with.',
    },
    max: 5,
    icon: '⟐',
    domain: 'engineering',
  },
}

export const SYSTEM_ORDER: SystemId[] = [
  'lifeSupport',
  'engines',
  'shields',
  'lab',
  'forge',
  'sensors',
  'runeCore',
]

export const BASE_REACTOR_OUTPUT = 8

/**
 * Life support needs one unit for every four crew, rounded up.
 *
 * BALANCE (after the first full playthrough): this used to be one per three,
 * which meant the opening allocation was already short and the ship bled morale
 * and people from week one — a spiral the players had no chance to steer out of
 * before they understood the systems. One per four means the default posting is
 * sound, and going short is a choice rather than an ambush.
 */
export function lifeSupportNeeded(crewCount: number): number {
  return Math.max(1, Math.ceil(crewCount / 4))
}

// ---------------------------------------------------------------- stations

export type StationId =
  | 'bridge'
  | 'lab'
  | 'archive'
  | 'sensors'
  | 'forge'
  | 'armoury'
  | 'medbay'
  | 'sanctum'

export type StationDef = {
  id: StationId
  name: Text
  effect: Text
  /** Whose call it is what happens here. */
  domain: 'engineering' | 'research' | 'shared'
  /** Which system has to be powered for the station to work. */
  needs: SystemId
  /** Which speciality is at home here. */
  speciality: CrewSpeciality
  /** How many crew can stand on it. */
  slots: number
}

export const STATIONS: Record<StationId, StationDef> = {
  bridge: {
    id: 'bridge',
    name: { hu: 'Híd', en: 'Bridge' },
    effect: {
      hu: 'Üzemanyag-hatékonyság: minden ugrás kevesebbet fogyaszt.',
      en: 'Fuel efficiency: every jump burns less.',
    },
    domain: 'shared',
    needs: 'engines',
    speciality: 'navigator',
    slots: 2,
  },
  lab: {
    id: 'lab',
    name: { hu: 'Labor', en: 'Lab' },
    effect: {
      hu: 'Információt termel minden héten.',
      en: 'Produces Information every week.',
    },
    domain: 'research',
    needs: 'lab',
    speciality: 'scientist',
    slots: 2,
  },
  archive: {
    id: 'archive',
    name: { hu: 'Archívum', en: 'Archive' },
    effect: {
      hu: 'A futó kutatás hetente egy extra héttel haladhat — ehhez tudós kell ide. Más szakma csak életben tartja az állomást.',
      en: 'The running research advances an extra week — that needs a scientist here. Anybody else merely keeps the station alive.',
    },
    domain: 'research',
    needs: 'lab',
    speciality: 'scientist',
    slots: 1,
  },
  sensors: {
    id: 'sensors',
    name: { hu: 'Érzékelő', en: 'Sensors' },
    effect: {
      hu:
        'Felfedi, mi van a következő rendszerekben. Navigátorral egy oszloppal többet — ' +
        'más szakma csak bekapcsolja a műszert.',
      en:
        'Reveals what lies in the next systems. With a navigator, one column more — anybody ' +
        'else merely switches the instrument on.',
    },
    domain: 'research',
    needs: 'sensors',
    speciality: 'navigator',
    slots: 1,
  },
  forge: {
    id: 'forge',
    name: { hu: 'Kohó', en: 'Forge' },
    effect: {
      hu: 'Hajótestet javít minden héten.',
      en: 'Repairs hull every week.',
    },
    domain: 'engineering',
    needs: 'forge',
    speciality: 'engineer',
    slots: 2,
  },
  armoury: {
    id: 'armoury',
    name: { hu: 'Fegyverzet', en: 'Armoury' },
    effect: {
      hu: 'A partraszálló csapat +1 Töltettel indul, ha a Rúnamag is kap energiát — ha őr áll rajta, +2.',
      en: 'The landing party starts with +1 Flux if the rune core has power — with a guard here, +2.',
    },
    domain: 'engineering',
    needs: 'shields',
    speciality: 'guard',
    slots: 1,
  },
  medbay: {
    id: 'medbay',
    name: { hu: 'Gyógyító', en: 'Medbay' },
    effect: {
      hu: 'A hősök életerőt kapnak vissza minden héten.',
      en: 'The heroes recover hit points every week.',
    },
    domain: 'shared',
    needs: 'lifeSupport',
    speciality: 'medic',
    slots: 1,
  },
  sanctum: {
    id: 'sanctum',
    name: { hu: 'Szentély', en: 'Sanctum' },
    effect: {
      hu: 'Morált állít helyre minden héten.',
      en: 'Restores morale every week.',
    },
    domain: 'shared',
    needs: 'lifeSupport',
    speciality: 'medic',
    slots: 1,
  },
}

export const STATION_ORDER: StationId[] = [
  'bridge',
  'lab',
  'archive',
  'sensors',
  'forge',
  'armoury',
  'medbay',
  'sanctum',
]

// ---------------------------------------------------------------- modules

export type ModuleId =
  | 'reinforcedHull'
  | 'fuelSynthesiser'
  | 'runeAmplifier'
  | 'deepSensors'
  | 'hydroponics'
  | 'echoVault'
  | 'reactorTap'
  | 'boardingWards'
  | 'silenceShroud'
  | 'relicCradle'

export type ModuleDef = {
  id: ModuleId
  name: Text
  description: Text
  /** Reactor output added while installed. */
  reactor?: number
  /** Extra maximum for a resource. */
  resourceMax?: { id: ResourceId; amount: number }
  /** Flat weekly gain. */
  weekly?: { id: ResourceId; amount: number }
  /** Extra Flux handed to every landing party. */
  flux?: number
  /** Extra columns of star map revealed. */
  sensorRange?: number
  /** Hull damage avoided in encounters. */
  wards?: number
  /** Attention gained (or, negative, shed) every week. See the Herald. */
  attention?: number
  /** Relics each hero may wear attuned, above the first. */
  attunements?: number
}

export const MODULES: Record<ModuleId, ModuleDef> = {
  reinforcedHull: {
    id: 'reinforcedHull',
    name: { hu: 'Megerősített hajótest', en: 'Reinforced hull' },
    description: {
      hu: 'A hajótest felső határa +6.',
      en: 'Hull capacity +6.',
    },
    resourceMax: { id: 'hull', amount: 6 },
  },
  fuelSynthesiser: {
    id: 'fuelSynthesiser',
    name: { hu: 'Üzemanyag-szintetizáló', en: 'Fuel synthesiser' },
    description: {
      hu: 'Hetente 1 üzemanyagot kiegyenlít az út közben. A tartályt nem tölti: állva nem termel.',
      en: 'Offsets 1 fuel for every week under way. It does not fill the tank: standing still it makes nothing.',
    },
    weekly: { id: 'fuel', amount: 1 },
  },
  runeAmplifier: {
    id: 'runeAmplifier',
    name: { hu: 'Rúnaerősítő', en: 'Rune amplifier' },
    description: {
      hu: 'A partraszálló csapat +2 Töltettel indul.',
      en: 'The landing party starts with +2 Flux.',
    },
    flux: 2,
  },
  deepSensors: {
    id: 'deepSensors',
    name: { hu: 'Mélyérzékelők', en: 'Deep sensors' },
    description: {
      hu: 'Egy oszloppal többet látsz előre a csillagtérképen — amíg az Érzékelő állomás megy.',
      en: 'You see one more column ahead on the star map — while the Sensors station is running.',
    },
    sensorRange: 1,
  },
  hydroponics: {
    id: 'hydroponics',
    name: { hu: 'Hidropónia', en: 'Hydroponics' },
    description: {
      hu: 'Hetente +2 élelem, és a felső határ +10.',
      en: '+2 food every week, and capacity +10.',
    },
    weekly: { id: 'food', amount: 2 },
    resourceMax: { id: 'food', amount: 10 },
  },
  echoVault: {
    id: 'echoVault',
    name: { hu: 'Visszhang-kamra', en: 'Echo vault' },
    description: {
      hu: 'Hetente +1 Információ, és a felső határ +20.',
      en: '+1 Information every week, and capacity +20.',
    },
    weekly: { id: 'information', amount: 1 },
    resourceMax: { id: 'information', amount: 20 },
  },
  reactorTap: {
    id: 'reactorTap',
    name: { hu: 'Reaktorcsapolás', en: 'Reactor tap' },
    description: {
      hu: 'A reaktor kimenete +2 egység.',
      en: 'Reactor output +2 units.',
    },
    reactor: 2,
  },
  silenceShroud: {
    id: 'silenceShroud',
    name: { hu: 'Csendburok', en: 'Silence shroud' },
    description: {
      hu:
        'A hajó hangja kifelé elhal. Hetente 2 zajjal kevesebb — a Hírnök nehezebben talál rá.',
      en:
        'The ship’s noise dies on the way out. Two less attention a week — the Herald has more ' +
        'trouble finding you.',
    },
    attention: -2,
  },
  relicCradle: {
    id: 'relicCradle',
    name: { hu: 'Ereklyeágy', en: 'Relic cradle' },
    description: {
      hu: 'Tartó, ami elbírja, amit találtatok. Minden hős egy plusz ereklyét hordhat ráhangolva.',
      en: 'A mount that can hold what you found. Each hero may wear one more relic attuned.',
    },
    attunements: 1,
  },
  boardingWards: {
    id: 'boardingWards',
    name: { hu: 'Átszálló-rúnák', en: 'Boarding wards' },
    description: {
      hu: 'Találkozásokon 2-vel kevesebb hajótestet veszítesz.',
      en: 'Encounters cost 2 less hull.',
    },
    wards: 2,
  },
}

export const MODULE_ORDER: ModuleId[] = [
  'reinforcedHull',
  'fuelSynthesiser',
  'runeAmplifier',
  'deepSensors',
  'hydroponics',
  'echoVault',
  'reactorTap',
  'boardingWards',
  'silenceShroud',
  'relicCradle',
]
