// Hero advancement: the one part of the ship that is not shared.
//
// Everything else in this game is a joint decision — one reactor, one hold, one
// route. That is the point of it, and it is also why after five expeditions the
// two players had nothing that was *theirs*. The Runesmith and the Echo-reader
// were two card decks with different colours.
//
// A perk track fixes that at the cheapest possible price: each hero earns their
// own marks, spends them on their own list, and the other player cannot spend
// them. The two lists are deliberately not mirror images. The Runesmith's marks
// buy toughness, ground and the ship's structure; the Echo-reader's buy sight,
// memory and understanding. What they earn marks FOR is different too — see
// `heroXpFor` in the expedition engine: he is paid for bringing the ship home
// intact, she is paid for working things out.
//
// The engine reads `effect`; nothing else knows these exist.

import type { HeroClassId, Text } from '../engine/types'
import type { ResourceId } from './ship'

export type PerkEffect = {
  /** Extra maximum hit points, for this hero only. */
  heroHp?: number
  /** Flux the landing party starts with. */
  flux?: number
  /** Hull risk absorbed in encounters. */
  wards?: number
  /** Extra columns revealed each week. */
  sensorRange?: number
  /** Extra Information from the Lab. */
  research?: number
  /** Extra hull from the Forge. */
  repair?: number
  /** Bond range in tiles, replacing the usual two. */
  bondRange?: number
  /** Relics this hero may wear at once, above the first. */
  attunements?: number
  /** Attention shed every week. */
  attention?: number
  /** Where morale is heading, every week. */
  moraleTarget?: number
  /** A card added to this hero's deck for good. */
  card?: string
  /** Cards taken back from the lost pile after every landing. */
  recoverLost?: number
  /** Crew this hero may take under their wing, above the base three. */
  mentees?: number
  /**
   * A flat weekly gain, exactly like a module's or a relic's.
   *
   * The same shape on purpose: the weekly turn sums all three through one code
   * path, so none of them can quietly stop paying out.
   */
  weekly?: { id: ResourceId; amount: number }
  /** Where every crew member's loyalty is heading. */
  loyaltyTarget?: number
  /** Weeks cut from a long jump. See `travelWeeks` for what counts as long. */
  travelCut?: number
  /** Extra experience a week for the crew this hero mentors. */
  crewXp?: number
  /** Shield every hero starts a landing with. */
  startShield?: number
}

export type HeroPerk = {
  id: string
  heroClass: HeroClassId
  name: Text
  description: Text
  /** Marks it costs. */
  cost: number
  /** Perks that must be bought first. */
  requires: string[]
  effect: PerkEffect
}

/** What the two currencies are called, because they are not the same thing. */
export const MARK_NAMES: Record<HeroClassId, Text> = {
  runesmith: { hu: 'szövőjegy', en: 'forge mark' },
  echoreader: { hu: 'visszhangjegy', en: 'echo mark' },
  cantor: { hu: 'rítusjegy', en: 'note' },
  surveyor: { hu: 'csillagjegy', en: 'survey mark' },
}

/** How the two of them earn marks, in one line each, for the interface. */
export const MARK_SOURCES: Record<HeroClassId, Text> = {
  runesmith: {
    hu:
      'Minden megnyert partraszállásért 1. Egy hajóra törésért, amiben egyetlen modul sem ' +
      'pusztult el, +2 — a hajó épsége az ő számlája.',
    en:
      'One for every landing won. Two more for a boarding action in which not one module was ' +
      'destroyed — the ship’s integrity is on his account.',
  },
  echoreader: {
    hu:
      'Minden megnyert partraszállásért 1. Minden megfejtett szerkezetért +2 — a megfejtés az ő ' +
      'számlája.',
    en:
      'One for every landing won. Two more for every mechanism solved — understanding is on her ' +
      'account.',
  },
  cantor: {
    hu:
      'Minden megnyert partraszállásért 1. Minden olyanért, amiből mindenki a saját lábán jött ' +
      'vissza, +2 — a legénység épsége az ő számlája.',
    en:
      'One for every landing won. Two more for every one that everybody walked away from on their ' +
      'own feet — the party coming back whole is on her account.',
  },
  surveyor: {
    hu:
      'Minden megnyert partraszállásért 1. Minden héten, amikor az Érzékelők felfedtek valamit ' +
      'előre, +1 — az előrelátás az ő számlája.',
    en:
      'One for every landing won. One more for every week the Sensors revealed something ahead — ' +
      'seeing the road first is on his account.',
  },
}

/** Crew a hero may take under their wing before any perk. */
export const BASE_MENTEES = 3

export const HERO_PERKS: HeroPerk[] = [
  // ============================================================== RUNESMITH
  {
    id: 'smith-ironback',
    heroClass: 'runesmith',
    name: { hu: 'Vasderék', en: 'Ironback' },
    description: {
      hu: 'Megtanulja, hol állja meg, és hol lép el. +3 maximális életerő.',
      en: 'He learns where to hold and where to step aside. +3 maximum hit points.',
    },
    cost: 2,
    requires: [],
    effect: { heroHp: 3 },
  },
  {
    id: 'smith-wardlines',
    heroClass: 'runesmith',
    name: { hu: 'Zsilipvonalak', en: 'Wardlines' },
    description: {
      hu:
        'A hajó zsilipjeit is elkezdi rúnázni, nem csak a csatatereket. A találkozások 1-gyel ' +
        'kevesebb hajótestet visznek, és a Kohó hetente +1 hajótestet javít.',
      en:
        'He starts cutting runes into the ship’s airlocks, not only into battlefields. Encounters ' +
        'cost 1 less hull, and the Forge repairs 1 more a week.',
    },
    cost: 3,
    requires: ['smith-ironback'],
    effect: { wards: 1, repair: 1 },
  },
  {
    id: 'smith-rampart',
    heroClass: 'runesmith',
    name: { hu: 'Sáncvonal', en: 'Rampart' },
    description: {
      hu: 'Új lap a pakliba, véglegesen: Sáncvonal. Vért mindkettőnek, és utána egy oszlop.',
      en: 'A new card in the deck for good: Rampart. Shield for both, then a pillar.',
    },
    cost: 4,
    requires: ['smith-wardlines'],
    effect: { card: 'rs-rampart' },
  },
  {
    id: 'smith-relicbearer',
    heroClass: 'runesmith',
    name: { hu: 'Ereklyehordozó', en: 'Relic bearer' },
    description: {
      hu: 'Elbír kettőt. Két ereklyét hordhat egyszerre ráhangolva.',
      en: 'He can carry two. Two relics attuned at once.',
    },
    cost: 3,
    requires: [],
    effect: { attunements: 1 },
  },
  {
    id: 'smith-quiet-forge',
    heroClass: 'runesmith',
    name: { hu: 'Csendes kohó', en: 'The quiet forge' },
    description: {
      hu:
        'Hidegen dolgozik, szikra nélkül. Hetente 1 zajjal kevesebb — a Hírnök lassabban ' +
        'talál rá a hajóra.',
      en:
        'He works cold, without sparks. One less attention a week — the Herald takes longer to ' +
        'find the ship.',
    },
    cost: 3,
    requires: [],
    effect: { attention: -1 },
  },

  // ============================================================ ECHO-READER
  {
    id: 'reader-longsight',
    heroClass: 'echoreader',
    name: { hu: 'Messzelátás', en: 'Longsight' },
    description: {
      hu:
        'Egy oszloppal többet fejt fel a csillagtérképből minden héten — amíg az Érzékelő ' +
        'állomáson áll valaki és van rajta energia.',
      en:
        'She reads one more column of the star map every week — while somebody is standing on the ' +
        'Sensors station and it has power.',
    },
    cost: 2,
    requires: [],
    effect: { sensorRange: 1 },
  },
  {
    id: 'reader-archivist',
    heroClass: 'echoreader',
    name: { hu: 'Levéltáros', en: 'Archivist' },
    description: {
      hu: 'A Labor hetente +1 információt ad, mert tudja, mit érdemes megnézni.',
      en: 'The Lab yields 1 more Information a week, because she knows what is worth looking at.',
    },
    cost: 3,
    requires: ['reader-longsight'],
    effect: { research: 1 },
  },
  {
    id: 'reader-remembrance',
    heroClass: 'echoreader',
    name: { hu: 'Emlékezés', en: 'Remembrance' },
    description: {
      hu:
        'Amit elveszített, azt vissza tudja hívni. Minden partraszállás után egy véglegesen ' +
        'elvesztett lap visszakerül a pakliba.',
      en:
        'What she lost she can call back. After every landing one permanently lost card returns ' +
        'to the deck.',
    },
    cost: 4,
    requires: ['reader-archivist'],
    effect: { recoverLost: 1 },
  },
  {
    id: 'reader-tether',
    heroClass: 'echoreader',
    name: { hu: 'Fonál', en: 'Tether' },
    description: {
      hu:
        'Nem kell látnia, hogy tudja, hol van a legközelebbi társa. A Kötelék 3 mezőn belül is működik ' +
        '(a szokásos 2 helyett).',
      en:
        'She does not need to see him to know where he is. The Bond holds at 3 tiles instead of 2.',
    },
    cost: 3,
    requires: [],
    effect: { bondRange: 3 },
  },
  {
    id: 'reader-still-note',
    heroClass: 'echoreader',
    name: { hu: 'Álló hang', en: 'The still note' },
    description: {
      hu: 'Új lap a pakliba, véglegesen: Álló hang. Területjelölés, majd visszahívott lap.',
      en: 'A new card in the deck for good: The still note. Area marking, then a card called back.',
    },
    cost: 4,
    requires: ['reader-tether'],
    effect: { card: 'er-still-note' },
  },
  {
    id: 'reader-relicbearer',
    heroClass: 'echoreader',
    name: { hu: 'Ereklyeolvasó', en: 'Relic reader' },
    description: {
      hu: 'Két ereklyét hallgat egyszerre. Két ráhangolt ereklye.',
      en: 'She listens to two at once. Two relics attuned.',
    },
    cost: 3,
    requires: [],
    effect: { attunements: 1 },
  },

  // ================================================================= CANTOR
  {
    id: 'cantor-deep-breath',
    heroClass: 'cantor',
    name: { hu: 'Mély levegő', en: 'Deep Breath' },
    description: {
      hu: 'Több hang fér bele. +3 maximális életerő.',
      en: 'More voice fits in. +3 maximum hit points.',
    },
    cost: 2,
    requires: [],
    effect: { heroHp: 3 },
  },
  {
    id: 'cantor-ward-song',
    heroClass: 'cantor',
    name: { hu: 'Óvó ének', en: 'Warding Song' },
    description: {
      hu: 'Amit énekel, az a hajón is tart. A találkozások 1-gyel kevesebb hajótestet visznek.',
      en: 'What she sings holds on the ship too. Encounters cost 1 less hull.',
    },
    cost: 3,
    requires: ['cantor-deep-breath'],
    effect: { wards: 1 },
  },
  {
    id: 'cantor-sanctuary',
    heroClass: 'cantor',
    name: { hu: 'Menedék', en: 'Sanctuary' },
    description: {
      hu: 'A Szentély hangja megváltozik: +1 a morál-célhoz, minden héten.',
      en: 'The Sanctum sounds different: +1 to the morale target, every week.',
    },
    cost: 4,
    requires: ['cantor-ward-song'],
    effect: { moraleTarget: 1 },
  },
  {
    id: 'cantor-teacher',
    heroClass: 'cantor',
    name: { hu: 'Tanítómester', en: 'Teacher' },
    description: {
      hu: 'Négy embert tud a szárnyai alá venni három helyett.',
      en: 'She can take four people under her wing instead of three.',
    },
    cost: 3,
    requires: [],
    effect: { mentees: 1 },
  },
  {
    id: 'cantor-relicbearer',
    heroClass: 'cantor',
    name: { hu: 'Ereklyeőrző', en: 'Relic keeper' },
    description: {
      hu: 'Két ereklyét hordhat egyszerre ráhangolva.',
      en: 'Two relics attuned at once.',
    },
    cost: 3,
    requires: [],
    effect: { attunements: 1 },
  },

  // =============================================================== SURVEYOR
  {
    id: 'surveyor-longsight',
    heroClass: 'surveyor',
    name: { hu: 'Távmérés', en: 'Rangefinding' },
    description: {
      hu:
        'Egy oszloppal többet fed fel a csillagtérképből hetente — amíg az Érzékelő állomás megy.',
      en: 'One more column of star map a week — while the Sensors station is running.',
    },
    cost: 2,
    requires: [],
    effect: { sensorRange: 1 },
  },
  {
    id: 'surveyor-braced',
    heroClass: 'surveyor',
    name: { hu: 'Kitámasztás', en: 'Braced' },
    description: {
      hu: 'Megtanul úgy állni, hogy ne dőljön föl. +2 maximális életerő.',
      en: 'He learns to stand so that he does not go over. +2 maximum hit points.',
    },
    cost: 2,
    requires: [],
    effect: { heroHp: 2 },
  },
  {
    id: 'surveyor-charges',
    heroClass: 'surveyor',
    name: { hu: 'Töltetek', en: 'Charges' },
    description: {
      hu: 'A partraszálló csapat +1 Töltettel indul: az ő lövései abból mennek.',
      en: 'The landing party starts with 1 more Flux: his shots come out of it.',
    },
    cost: 3,
    requires: ['surveyor-braced'],
    effect: { flux: 1 },
  },
  {
    id: 'surveyor-quiet-optics',
    heroClass: 'surveyor',
    name: { hu: 'Csendes optika', en: 'Quiet Optics' },
    description: {
      hu: 'Nézni lehet feltűnés nélkül is. Hetente 1 zajjal kevesebb.',
      en: 'Looking can be done without being noticed. One less attention a week.',
    },
    cost: 3,
    requires: ['surveyor-longsight'],
    effect: { attention: -1 },
  },
  {
    id: 'surveyor-relicbearer',
    heroClass: 'surveyor',
    name: { hu: 'Ereklyemérő', en: 'Relic gauger' },
    description: {
      hu: 'Két ereklyét hordhat egyszerre ráhangolva.',
      en: 'Two relics attuned at once.',
    },
    cost: 3,
    requires: [],
    effect: { attunements: 1 },
  },

  // ============================================== what carries over to the road
  //
  // Everything above this line is felt on the grid or on one station. These are
  // the perks that pay while nothing is happening — on a jump, in the galley, at
  // the crew list. Two reasons they exist:
  //
  // A hero used to stop being a hero the moment a landing ended. What you spent
  // your marks on decided how the next fight went and nothing else, so between
  // fights the four of you were interchangeable.
  //
  // And they are how the SHIP gets better without a shop. A module is bought with
  // credits and belongs to everybody; these are bought with one person's marks
  // and belong to them — the food on the table came from her, the fuel in the
  // tank from him, and everybody knows it.
  {
    id: 'smith-scrapwright',
    heroClass: 'runesmith',
    name: { hu: 'Roncsmester', en: 'Scrapwright' },
    description: {
      hu:
        'Amit egy partraszállás hátrahagy, azt szétszedi és elviszi. Hetente +3 kredit, ' +
        'akkor is, ha egész héten nem történik semmi.',
      en:
        'What a landing leaves behind, he takes apart and carries off. +3 credits a week, ' +
        'including the weeks when nothing happens.',
    },
    cost: 2,
    requires: [],
    effect: { weekly: { id: 'credits', amount: 3 } },
  },
  {
    id: 'smith-ship-runes',
    heroClass: 'runesmith',
    name: { hu: 'Hajórúnák', en: 'Ship runes' },
    description: {
      hu:
        'A hajótestbe is szövi, nemcsak a páncélba. Hetente +1 hajótest — magától, munka nélkül, ' +
        'a Kohón felül.',
      en:
        'He weaves them into the hull as well as the plate. +1 hull a week, on its own, on top of ' +
        'whatever the Forge does.',
    },
    cost: 3,
    requires: [],
    effect: { weekly: { id: 'hull', amount: 1 } },
  },
  {
    id: 'smith-field-forge',
    heroClass: 'runesmith',
    name: { hu: 'Tábori kohó', en: 'Field forge' },
    description: {
      hu:
        'Leszállás előtt végigmegy a páncélokon. Minden hős 1 Vérttel kezdi a partraszállást — ' +
        'ő is, a többiek is.',
      en:
        'He goes over the plating before the drop. Every hero starts a landing with 1 Shield — ' +
        'him and everybody else.',
    },
    cost: 4,
    requires: ['smith-wardlines'],
    effect: { startShield: 1 },
  },
  {
    id: 'reader-borrowed-hour',
    heroClass: 'echoreader',
    name: { hu: 'Kölcsönvett óra', en: 'Borrowed hour' },
    description: {
      hu:
        'Megnézi, ki járt itt előttetek, és utánamegy a nyomnak. Minden legalább 3 hetes ugrás ' +
        'egy héttel rövidebb.',
      en:
        'She looks at who came this way before you and follows the line they left. Every jump of ' +
        '3 weeks or more is one week shorter.',
    },
    cost: 4,
    requires: ['reader-longsight'],
    effect: { travelCut: 1 },
  },
  {
    id: 'reader-margin-notes',
    heroClass: 'echoreader',
    name: { hu: 'Széljegyzetek', en: 'Marginalia' },
    description: {
      hu: 'Amit út közben leír, azt otthon el tudják olvasni. Hetente +2 információ.',
      en: 'What she writes down on the way can be read at home. +2 information a week.',
    },
    cost: 2,
    requires: [],
    effect: { weekly: { id: 'information', amount: 2 } },
  },
  {
    id: 'cantor-oathkeeper',
    heroClass: 'cantor',
    name: { hu: 'Fogadalomtartó', en: 'Oathkeeper' },
    description: {
      hu:
        'Nem beszédet tart, hanem megjegyzi, ki mit mondott, és számon is kéri. A legénység ' +
        'hűsége mindenkinél 1-gyel feljebb tart.',
      en:
        'She makes no speeches; she remembers what everybody said and holds them to it. Every ' +
        'crew member’s loyalty heads 1 higher.',
    },
    cost: 4,
    requires: ['cantor-deep-breath'],
    effect: { loyaltyTarget: 1 },
  },
  {
    id: 'cantor-galley',
    heroClass: 'cantor',
    name: { hu: 'Konyhaügyelet', en: 'Galley watch' },
    description: {
      hu:
        'Ő méri ki az adagokat, és ő az, aki miatt marad. Hetente +2 élelem.',
      en: 'She measures out the rations, and she is the reason there are any left. +2 food a week.',
    },
    cost: 2,
    requires: [],
    effect: { weekly: { id: 'food', amount: 2 } },
  },
  {
    id: 'cantor-choirline',
    heroClass: 'cantor',
    name: { hu: 'Kórusvonal', en: 'Choir line' },
    description: {
      hu: 'Új lap a paklijába: Kórusvonal — vért mindenkinek egy vonal mentén.',
      en: 'A new card in her deck: Choir line — shields down a line of allies.',
    },
    cost: 3,
    requires: ['cantor-ward-song'],
    effect: { card: 'ct-choirline' },
  },
  {
    id: 'surveyor-thrift-plot',
    heroClass: 'surveyor',
    name: { hu: 'Takarékos pálya', en: 'Thrift plot' },
    description: {
      hu:
        'Nem a rövidebb utat számolja ki, hanem az olcsóbbat. Hetente +2 üzemanyag.',
      en: 'He does not plot the shorter course but the cheaper one. +2 fuel a week.',
    },
    cost: 2,
    requires: [],
    effect: { weekly: { id: 'fuel', amount: 2 } },
  },
  {
    id: 'surveyor-instrument-drill',
    heroClass: 'surveyor',
    name: { hu: 'Műszeres kiképzés', en: 'Instrument drill' },
    description: {
      hu:
        'Akit a szárnyai alá vett, azt leülteti a műszerek mellé. A tanítványai hetente ' +
        '1-gyel több tapasztalatot szereznek.',
      en:
        'Whoever he has taken under his wing gets sat down at the instruments. His mentees earn ' +
        '1 more experience a week.',
    },
    cost: 3,
    requires: [],
    effect: { crewXp: 1 },
  },
  {
    id: 'surveyor-ranging-shot',
    heroClass: 'surveyor',
    name: { hu: 'Belövés', en: 'Ranging shot' },
    description: {
      hu: 'Új lap a paklijába: Belövés — messziről bemér, és a második találat már fáj.',
      en: 'A new card in his deck: Ranging shot — mark from far off, and the second hit lands hard.',
    },
    cost: 3,
    requires: ['surveyor-longsight'],
    effect: { card: 'sv-ranging-shot' },
  },
]

const PERK_INDEX = new Map(HERO_PERKS.map((p) => [p.id, p]))

export function heroPerk(id: string): HeroPerk {
  const found = PERK_INDEX.get(id)
  if (!found) throw new Error(`No such hero perk: ${id}`)
  return found
}

export function perksOf(heroClass: HeroClassId): HeroPerk[] {
  return HERO_PERKS.filter((p) => p.heroClass === heroClass)
}

/** Which of this hero's perks can be bought right now, prerequisites aside. */
export function perkAvailable(perk: HeroPerk, bought: readonly string[]): boolean {
  return !bought.includes(perk.id) && perk.requires.every((r) => bought.includes(r))
}
