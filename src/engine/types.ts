// All game types. This file knows nothing about the user interface.

// ---------------------------------------------------------------- language

/**
 * A piece of player-visible text in every supported language.
 *
 * Game content stores text this way rather than through translation keys, so
 * that the wording sits right next to the number it describes. When you tune a
 * card's damage you see its description in both languages at the same time,
 * which is the only reliable way to keep them in sync.
 */
export type Text = { hu: string; en: string }

export type Lang = 'hu' | 'en'

// ---------------------------------------------------------------- grid

export type Coord = { x: number; y: number }

/**
 * Terrain kinds.
 *  - floor:  open, walkable
 *  - wall:   not walkable, blocks line of sight
 *  - chasm:  not walkable, but you can see and shoot across it
 *  - pillar: not walkable, blocks line of sight — the Runesmith can raise one
 *  - ash:    walkable, but entering costs 2 movement
 */
export type TerrainKind = 'floor' | 'wall' | 'chasm' | 'pillar' | 'ash'

export type BattleMap = {
  width: number
  height: number
  /** Flat array, index = y * width + x */
  tiles: TerrainKind[]
}

// ---------------------------------------------------------------- statuses

/**
 * Status effects. What the number means:
 *  - shield:   armour. Reduces every incoming hit by this much, then drops by 1.
 *              Not tied to time, so it can never be applied "too late" — but it
 *              is capped (see SHIELD_MAX) so it cannot grow into a wall.
 *  - anchor:   rounds during which the unit cannot move
 *  - runeMark: rounds during which heroes' melee attacks deal +2 to it
 *  - prone:    rounds during which it cannot move and takes +1 damage
 *  - blind:    rounds during which its attacks deal no damage
 *  - weakened: rounds during which its attacks deal 1 less
 */
export type StatusKind = 'shield' | 'anchor' | 'runeMark' | 'prone' | 'blind' | 'weakened'

export type Statuses = Partial<Record<StatusKind, number>>

// ---------------------------------------------------------------- units

export type Side = 'hero' | 'enemy'

/**
 * The four. The first two are the game's original pair and the party for one or
 * two players; the Cantor and the Surveyor come out when three or four people
 * are playing, because a healer and an artillery piece only make sense with
 * somebody standing in front of them.
 */
export type HeroClassId = 'runesmith' | 'echoreader' | 'cantor' | 'surveyor'

type UnitBase = {
  id: string
  /** Display name in every language — the log embeds these directly. */
  name: Text
  pos: Coord
  hp: number
  maxHp: number
  statuses: Statuses
  alive: boolean
}

export type Hero = UnitBase & {
  side: 'hero'
  heroClass: HeroClassId
  /** Which player controls this hero — shown large so hotseat stays clear. */
  /**
   * Which seat at the table runs this hero, from one. Two for most of the game's
   * life; up to four once more than two people are playing.
   */
  playerSlot: 1 | 2 | 3 | 4
  hand: string[]
  discard: string[]
  lost: string[]
  /** The two cards chosen for this round. */
  selected: string[]
  /** Which of the two cards provides the initiative. */
  initiativeCard: string | null
  /** Resting this round instead of playing cards. */
  resting: boolean
  exhausted: boolean
}

export type Enemy = UnitBase & {
  side: 'enemy'
  enemyType: string
  /** Shuffled and cycled, so the same intent does not repeat three times over. */
  intentDeck: string[]
  intentIndex: number
  intent: string | null
}

export type Unit = Hero | Enemy

// ---------------------------------------------------------------- effects

export type StatusApplication = { kind: StatusKind; rounds: number }

/**
 * A single effect.
 *
 * Every effect needs at most one *kind* of choice from the player (a unit, a
 * tile or a card). That constraint is what keeps the interface manageable.
 */
export type Effect =
  /** Single-target attack. */
  | {
      k: 'attack'
      power: number
      range: number
      /** How many separate targets may be chosen (default 1). */
      targets?: number
      knockback?: number
      /** Status applied to the target on hit. */
      status?: StatusApplication
    }
  /** Area effect centred on a chosen tile. */
  | {
      k: 'areaAtPoint'
      power: number
      range: number
      radius: number
      status?: StatusApplication
    }
  /** Area effect centred on the acting hero. */
  | { k: 'areaAroundSelf'; power: number; radius: number; status?: StatusApplication }
  | { k: 'move'; distance: number }
  | { k: 'shield'; power: number; alsoPartner?: boolean }
  | { k: 'heal'; power: number; alsoPartner?: boolean }
  /** Apply a status to an enemy in range without dealing damage. */
  | { k: 'status'; status: StatusKind; rounds: number; range: number }
  | { k: 'flux'; power: number }
  /** Raise a rune pillar on an adjacent empty tile. */
  | { k: 'pillar' }
  /** Place a trap on an adjacent empty tile. */
  | { k: 'trap'; power: number }
  /** Take a card back from the discard pile into your hand. */
  | { k: 'recoverCard' }
  /** Replay the top half of a discarded card. */
  | { k: 'echo' }

// ---------------------------------------------------------------- cards

export type CardHalf = {
  text: Text
  /** Flux cost, if any. */
  flux?: number
  effects: Effect[]
  /** Playing this half loses the card permanently. */
  lostOnUse?: boolean
}

/** Trial symbols — for the non-combat situations of the strategic layer. */
export type TrialSymbol = 'force' | 'insight'

export type Card = {
  id: string
  name: Text
  heroClass: HeroClassId
  initiative: number
  top: CardHalf
  bottom: CardHalf
  symbols: TrialSymbol[]
  /**
   * Not part of the starting deck.
   *
   * An advancement card only enters a deck when the hero buys the perk that
   * grants it (see content/advance.ts). `cardsOfClass` therefore has to leave
   * these out, or everybody would start with them.
   */
  advanced?: boolean
}

// ---------------------------------------------------------------- enemies

export type EnemyStep =
  | { k: 'move'; distance: number }
  | { k: 'attack'; power: number; range: number; knockback?: number }
  | { k: 'areaAroundSelf'; power: number; radius: number }
  | { k: 'shieldAllies'; power: number; radius: number }
  | { k: 'drainFlux'; power: number }
  | { k: 'statusOnHero'; status: StatusKind; rounds: number; range: number }

export type Intent = {
  id: string
  text: Text
  initiative: number
  steps: EnemyStep[]
}

export type EnemyType = {
  id: string
  name: Text
  description: Text
  hp: number
  /** Which silhouette to draw. */
  shape: 'husk' | 'sentinel' | 'wraith' | 'shard'
  intents: Intent[]
}

// ---------------------------------------------------------------- log
//
// The log stores STRUCTURED events, never finished prose. That is what makes
// switching language mid-battle work: the interface renders every past line
// again in the new language. The engine must not know about wording.

export type LogEvent =
  | { k: 'battleStart' }
  | { k: 'damage'; attacker: Text | null; target: Text; amount: number }
  | { k: 'shieldAbsorbed'; target: Text }
  | { k: 'defeated'; unit: Text }
  | { k: 'runeMarkReward' }
  | { k: 'trapTriggered'; unit: Text }
  | { k: 'trapPlaced'; power: number }
  | { k: 'pillarRaised' }
  | { k: 'terrainEdited'; kind: TerrainKind }
  | { k: 'installationHit'; module: Text; hp: number }
  | { k: 'installationLost'; module: Text }
  | { k: 'shieldGained'; unit: Text; amount: number }
  | { k: 'healed'; unit: Text; amount: number }
  | { k: 'statusApplied'; unit: Text; status: StatusKind }
  | { k: 'fluxGained'; amount: number; total: number }
  | { k: 'fluxSpent'; card: Text; amount: number; remaining: number }
  | { k: 'fluxDrained'; unit: Text; amount: number }
  | { k: 'cardRecovered'; unit: Text; card: Text }
  | { k: 'echoReplay'; card: Text }
  | { k: 'noValidTarget' }
  | { k: 'areaHitNothing' }
  | { k: 'nobodyInRange'; unit: Text }
  | { k: 'cannotMove'; unit: Text }
  | { k: 'anchoredInPlace'; unit: Text }
  | { k: 'proneNoMove'; unit: Text }
  | { k: 'enemyIntent'; unit: Text; intent: Text }
  | { k: 'rested'; unit: Text; lostCard: Text }
  | { k: 'restSkipsTurn'; unit: Text }
  | { k: 'exhausted'; unit: Text }
  | { k: 'relicPicked'; unit: Text; remaining: number }
  | { k: 'relicsComplete' }
  | { k: 'exitReached'; count: number }
  | { k: 'floorGaveWay' }
  | { k: 'floorAboutToGive'; rounds: number }
  | { k: 'reinforcements'; count: number }
  /** The site is about to do something. Announced a round ahead. */
  | { k: 'siteComing'; kind: SiteEventKind }
  | { k: 'siteFired'; kind: SiteEventKind }
  /** Two heroes on one target in one round: the second hit lands harder. */
  | { k: 'focused'; target: Text }
  | { k: 'heldGround' }
  | { k: 'lostGround' }
  | { k: 'outOfTime' }
  | { k: 'victory' }
  | { k: 'defeat' }

export type LogEntry = { round: number; event: LogEvent }

// ---------------------------------------------------------------- battle

export type Phase =
  /** Enemies reveal their intent, then the heroes choose cards. */
  | 'cardSelection'
  /** Units act in initiative order. */
  | 'resolution'
  | 'over'

export type Trap = { pos: Coord; power: number }

/** What we are currently waiting for from the player. */
export type PendingChoice = {
  kind: 'unit' | 'tile' | 'card'
  /** What to ask — resolved to text by the interface. */
  prompt: PendingPrompt
  /** Unit ids, tile keys ("x,y") or card ids. */
  options: string[]
  /** How many choices this effect needs in total. */
  needed: number
}

export type PendingPrompt =
  | { k: 'pickAttackTarget'; power: number; range: number }
  | { k: 'pickAreaCentre'; power: number; radius: number }
  | { k: 'pickMoveDestination'; distance: number }
  | { k: 'pickStatusTarget'; range: number }
  | { k: 'pickPillarTile' }
  | { k: 'pickTrapTile' }
  | { k: 'pickCardToRecover' }
  | { k: 'pickCardToEcho' }

/** The card half currently being resolved. */
export type ActiveHalf = {
  cardId: string
  half: 'top' | 'bottom'
  /**
   * The effects still to run. Not an index into content but its own list,
   * because the Echo ability splices new effects in mid-resolution.
   */
  effects: Effect[]
  index: number
}

/** A hero's turn in progress. */
export type HeroTurn = {
  heroId: string
  /** Which card provides the top half, and which the bottom. */
  topCard: string | null
  bottomCard: string | null
  topDone: boolean
  bottomDone: boolean
  active: ActiveHalf | null
  /** Choices gathered so far for the current effect. */
  choices: string[]
  /** Cards that will be lost permanently at the end of the turn. */
  losing: string[]
}

export type BattleState = {
  seed: number
  /**
   * How many random draws we have made. Every random value derives from the
   * seed and this counter, so the state is serialisable and any battle can be
   * replayed exactly.
   */
  rngStep: number
  round: number
  phase: Phase
  map: BattleMap
  units: Unit[]
  flux: number
  traps: Trap[]
  /** Initiative order: unit ids. */
  order: string[]
  orderIndex: number
  /** Which hero is currently choosing cards. */
  selectingHero: string | null
  heroTurn: HeroTurn | null
  pending: PendingChoice | null
  log: LogEntry[]
  /** What actually has to happen for this mission to succeed. */
  objective: Objective
  missionKind: MissionKind
  /** Relics still lying on the ground, for collect objectives. */
  relics: Coord[]
  /** How many the party is carrying. */
  carried: number
  /** The extraction tile, when the objective needs one. */
  exit: Coord | null
  /** Tiles about to give way, for exploration pressure. */
  collapsing: Collapsing[]

  /**
   * What the site itself will do, and when. Fires at the end of the named round.
   *
   * Fixed at generation from the seed, so it is part of the battlefield rather
   * than a die roll mid-fight — and so the interface can say what is coming next
   * without knowing anything the engine does not.
   */
  site: SiteEvent[]

  /**
   * Which heroes have struck which enemy this round.
   *
   * Cleared every round. It exists for one rule — the second hero to hit a
   * target in a round hits harder — and it lives on the state rather than in a
   * closure so that a rewound battle rewinds it too.
   */
  struck: Record<string, string[]>

  /**
   * How close the two heroes have to be for the Bond, in tiles.
   *
   * Two, unless the expedition has widened it — the Echo-reader's Tether perk or
   * the Binding cord relic. It has to live on the battle state rather than being
   * looked up from the expedition, because the battle engine knows nothing about
   * the ship and must stay that way.
   */
  bondRange: number

  /**
   * The ship's own modules, standing on the board.
   *
   * Only in a boarding action, and only because the briefing promised it: "the
   * modules stand on the grid — whatever is destroyed is gone for the rest of the
   * expedition". It was a promise with nothing behind it until this existed.
   *
   * They are not units: they do not act, they cannot be healed, and nothing
   * targets them by choice. An enemy standing next to one at the end of a round
   * tears at it — so the threat is positional, and defending is a matter of not
   * letting them stand there.
   */
  installations: Installation[]
  /** What was placed at the start, so the result can say what is missing. */
  setupInstallations?: string[]
  /** Hard round limit; when it runs out the mission fails. */
  roundLimit: number | null
  outcome: 'victory' | 'defeat' | null
}

// ---------------------------------------------------------------- objectives
//
// A mission is not always "kill everything". The same tactical engine serves
// combat, exploration and puzzle approach runs; the objective is what makes the
// rhythm different.

export type Objective =
  /** Defeat every enemy. */
  | { k: 'eliminate' }
  /** Get any hero onto the exit tile. Enemies may be avoidable. */
  | { k: 'reachExit' }
  /** Pick up N relics, then leave through the exit. */
  | { k: 'collect'; count: number }
  /** Stay alive for N rounds. Reinforcements keep coming. */
  | { k: 'survive'; rounds: number }
  /** Hold the marked tile at the end of N rounds. */
  | { k: 'hold'; rounds: number }

export type MissionKind = 'combat' | 'exploration'

/** A tile that is about to give way. When it hits zero it becomes a chasm. */
/** One of the ship's modules, on the grid, with something left in it. */
export type Installation = {
  pos: Coord
  /** The module id from content/ship.ts — destroying it removes that module. */
  id: string
  hp: number
  maxHp: number
}

export type Collapsing = { pos: Coord; roundsLeft: number }

/**
 * Something the SITE does, on a clock of its own.
 *
 * The enemies show their intent a round ahead, and that visible pressure is what
 * makes a turn worth thinking about. The ground had no such thing: it was
 * scenery. A site event is the same idea applied to the place — announced one
 * round before it happens, so it is a problem to plan around rather than a
 * surprise to be annoyed by.
 */
export type SiteEventKind =
  /** The rune-work under the floor gives the party Flux. */
  | 'surge'
  /** Ash falls across a stretch of floor: still walkable, twice as slow. */
  | 'ashfall'
  /** Something else comes through: one more enemy, at the far edge. */
  | 'reinforcement'
  /** A patch of ceiling lets go. The floor there is on its way out. */
  | 'collapse'

export type SiteEvent = { at: number; kind: SiteEventKind }
