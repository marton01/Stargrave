// Directives: what home asks for, week by week.
//
// The middle of an expedition used to have no shape. The Gate's countdown is a
// wall at the far end, and between week four and week twenty the only thing
// pulling the ship anywhere was curiosity. That is why a run started to feel the
// same as the last one: nothing was ASKING for anything in particular.
//
// A directive is a small, dated request with a reward and a penalty. Two are
// live at a time, and each one belongs to ONE of the two players — it is on their
// console, in their column, and it is their job to say "we have to go left, I
// have four weeks to see three mechanisms". That is the co-operative half: two
// people with different lists who share one route.
//
// The engine measures progress from the state itself (see `directiveProgress`),
// so no directive can be satisfied by anything except the thing it names.

import type { HeroClassId, Text } from '../engine/types'

export type DirectiveKind =
  /** Win N landings. */
  | 'clearSites'
  /** Solve N mechanisms. */
  | 'solve'
  /** Hold N relics, attuned or in the hold. */
  | 'relics'
  /** Reach this much understanding. */
  | 'understand'
  /** Finish N research projects. */
  | 'research'
  /** Be this deep into the map — column index, counted from the Gate. */
  | 'depth'
  /** Have at least this much morale when the deadline comes. */
  | 'morale'
  /** Have at least this much of a resource banked when the deadline comes. */
  | 'stock'
  /** Have N crew trained or better. */
  | 'crewRank'
  /** Have N crew steady or better when the deadline comes. */
  | 'steady'
  /** Have N systems charted on the star map. */
  | 'charted'
  /** Have set foot in N different systems. */
  | 'surveyed'

export type DirectiveDef = {
  kind: DirectiveKind
  /** Which hero this kind of order is naturally addressed to. */
  owner: HeroClassId | 'either'
  name: Text
  /** What it asks for, with the number filled in. */
  ask: (target: number) => Text
  /** Why home wants it — one line, so an order is never just a number. */
  reason: Text
  /** Weeks allowed, and what to ask for, by how far the run has come. */
  target: (depth: number) => number
  weeks: (depth: number) => number
  /**
   * Only offered when this holds. Keeps an order from being impossible: nobody
   * can be asked for three relics before relics exist in the run.
   */
  when?: (context: DirectiveContext) => boolean
}

/** What the generator knows about the run when it picks an order. */
export type DirectiveContext = {
  week: number
  /** Columns travelled, over the whole road: 0 at the Gate, 1 at the Stargrave. */
  depth: number
  columns: number
  column: number
  relics: number
  understanding: number
  puzzleKinds: number
  /** Living crew, and how many of them are trained or better / steady or better. */
  crew: number
  trained: number
  steady: number
  /** Systems on the map, and how many are charted / have been stood in. */
  systems: number
  charted: number
  visited: number
}

export const DIRECTIVE_DEFS: DirectiveDef[] = [
  {
    kind: 'clearSites',
    owner: 'runesmith',
    name: { hu: 'Tisztítás', en: 'Clearance' },
    ask: (n) => ({
      hu: `Nyerjetek meg ${n} partraszállást.`,
      en: `Win ${n} landings.`,
    }),
    reason: {
      hu: 'Az otthoni tanács azt akarja tudni, hogy a Kapun túl lehet-e egyáltalán megállni valahol.',
      en: 'The council at home wants to know whether anything beyond the Gate can be held at all.',
    },
    target: (depth) => (depth < 0.5 ? 2 : 3),
    weeks: () => 8,
  },
  {
    kind: 'solve',
    owner: 'echoreader',
    name: { hu: 'Olvasás', en: 'Reading' },
    ask: (n) => ({
      hu: `Fejtsetek meg ${n} szerkezetet.`,
      en: `Solve ${n} mechanisms.`,
    }),
    reason: {
      hu: 'Minden megfejtett szerkezet egy sor a szótárban, amit odahaza írnak rólatok.',
      en: 'Every mechanism solved is one line in the dictionary they are writing about you at home.',
    },
    target: (depth) => (depth < 0.5 ? 1 : 2),
    weeks: () => 8,
  },
  {
    kind: 'relics',
    owner: 'either',
    name: { hu: 'Leletek', en: 'Finds' },
    ask: (n) => ({
      hu: `Legyen ${n} ereklye a hajón.`,
      en: `Have ${n} relics aboard.`,
    }),
    reason: {
      hu: 'Az Archívum tárgyakat akar, nem jelentéseket. Egy ereklyét meg lehet fogni.',
      en: 'The Archive wants objects, not reports. A relic can be held in the hand.',
    },
    target: (depth) => (depth < 0.4 ? 1 : depth < 0.7 ? 2 : 3),
    weeks: () => 9,
  },
  {
    kind: 'understand',
    owner: 'echoreader',
    name: { hu: 'Megértés', en: 'Understanding' },
    ask: (n) => ({
      hu: `Érjetek el ${n} megértést.`,
      en: `Reach ${n} understanding.`,
    }),
    reason: {
      hu: 'Nem a hajó érdekli őket. Az, hogy mit tudtok elmondani, amikor visszaértek.',
      en: 'They are not interested in the ship. They want to know what you can tell them when you return.',
    },
    target: (depth) => Math.max(3, Math.round(3 + depth * 9)),
    weeks: () => 10,
  },
  {
    kind: 'research',
    owner: 'echoreader',
    name: { hu: 'Kutatás', en: 'Research' },
    ask: (n) => ({
      hu: `Fejezzetek be ${n} kutatást.`,
      en: `Finish ${n} research projects.`,
    }),
    reason: {
      hu: 'A Labor eredményei átmennek a Kapun akkor is, ha a hajó nem.',
      en: 'The Lab’s results go through the Gate even if the ship does not.',
    },
    target: (depth) => (depth < 0.5 ? 1 : 2),
    weeks: () => 8,
  },
  {
    kind: 'depth',
    owner: 'runesmith',
    name: { hu: 'Előrenyomulás', en: 'Advance' },
    ask: (n) => ({
      hu: `Legyetek a ${n}. rendszer-oszlopban vagy azon túl.`,
      en: `Be in system column ${n} or beyond.`,
    }),
    reason: {
      hu: 'A Kapu nem tart örökké, és a Csillagsír nincs közelebb attól, hogy vártok.',
      en: 'The Gate will not hold forever, and the Stargrave gets no closer while you wait.',
    },
    target: () => 0, // filled in by the generator: it needs the map, not the depth
    weeks: () => 7,
  },
  {
    kind: 'morale',
    owner: 'either',
    name: { hu: 'Fedélzeti rend', en: 'Order aboard' },
    ask: (n) => ({
      hu: `A határidőkor legyen legalább ${n} morál.`,
      en: `Have at least ${n} morale when the deadline comes.`,
    }),
    reason: {
      hu: 'Két expedíció nem a hajótesten bukott el. Odahaza ezt olvassák.',
      en: 'Two expeditions were not lost to the hull. They have read the reports at home.',
    },
    target: () => 8,
    weeks: () => 6,
  },
  {
    kind: 'stock',
    owner: 'runesmith',
    name: { hu: 'Készletek', en: 'Stores' },
    ask: (n) => ({
      hu: `A határidőkor legyen legalább ${n} élelem a raktárban.`,
      en: `Have at least ${n} food in the hold when the deadline comes.`,
    }),
    reason: {
      hu: 'Aki éhesen fordul vissza, az nem fordul vissza.',
      en: 'A ship that turns back hungry does not turn back.',
    },
    target: () => 24,
    weeks: () => 6,
  },

  // ---------------------------------------------------------------------
  // The Rite-caller's and the Astromancer's own orders.
  //
  // For a while there were none, and it showed: the two seats that arrive with
  // the third and fourth player had cards, perks and duties of their own, but
  // nothing home ever asked THEM for. An order is the one piece of content that
  // says out loud "this is your column, this is your week" — and half the table
  // was reading somebody else's list.
  //
  // They ask for what those two are actually for. The Rite-caller is asked about
  // the people: who has been taught, who is still with you. The Astromancer is
  // asked about the road: what has been charted, and where you have actually
  // stood.
  {
    kind: 'crewRank',
    owner: 'cantor',
    name: { hu: 'Kiképzés', en: 'Training' },
    ask: (n) => ({
      hu: `Legyen ${n} képzett (vagy jobb) legénységi tag.`,
      en: `Have ${n} crew at trained rank or better.`,
    }),
    reason: {
      hu: 'Aki visszaér, az taníthat. Odahaza már a következő legénységet állítják össze.',
      en: 'Whoever comes back can teach. They are already assembling the next crew at home.',
    },
    target: (depth) => (depth < 0.5 ? 2 : 3),
    weeks: () => 9,
    when: (c) => c.trained < c.crew,
  },
  {
    kind: 'steady',
    owner: 'cantor',
    name: { hu: 'Együtt', en: 'Together' },
    ask: (n) => ({
      hu: `A határidőkor legyen ${n} ember, aki legalább „rendben van”.`,
      en: `Have ${n} of the crew at least steady when the deadline comes.`,
    }),
    reason: {
      hu: 'Nem a létszám érdekli őket. Az, hogy hányan beszélnek még egymással.',
      en: 'It is not the head count they want. It is how many of them are still speaking.',
    },
    target: () => 4,
    weeks: () => 6,
    when: (c) => c.steady < c.crew,
  },
  {
    kind: 'charted',
    owner: 'surveyor',
    name: { hu: 'Térképezés', en: 'Charting' },
    ask: (n) => ({
      hu: `Legyen ${n} ismert rendszer a csillagtérképen.`,
      en: `Have ${n} systems charted on the star map.`,
    }),
    reason: {
      hu: 'Egy térkép akkor is átmegy a Kapun, ha a hajó nem. Ez a legolcsóbb dolog, amit hazaküldhettek.',
      en: 'A chart goes through the Gate even if the ship does not. It is the cheapest thing you can send home.',
    },
    target: (depth) => (depth < 0.5 ? 3 : 4),
    weeks: () => 7,
    when: (c) => c.charted < c.systems,
  },
  {
    kind: 'surveyed',
    owner: 'surveyor',
    name: { hu: 'Bejárás', en: 'Survey' },
    ask: (n) => ({
      hu: `Álljatok meg ${n} különböző rendszerben.`,
      en: `Stand in ${n} different systems.`,
    }),
    reason: {
      hu: 'A távcső hazudik. Amit lentről néztetek meg, az egy sor a jelentésben, amit nem vitatnak.',
      en: 'The lens lies. What you looked at from the ground is the one line of the report nobody argues with.',
    },
    target: (depth) => (depth < 0.5 ? 2 : 3),
    weeks: () => 8,
    when: (c) => c.visited < c.systems,
  },
]

export function directiveDef(kind: DirectiveKind): DirectiveDef {
  const found = DIRECTIVE_DEFS.find((d) => d.kind === kind)
  if (!found) throw new Error(`No such directive kind: ${kind}`)
  return found
}
