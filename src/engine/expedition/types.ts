// The strategic layer: the ship, the weeks, the star map.
//
// This is the spine of the game. The tactical grid is what happens when you land
// somewhere; everything that decides WHERE you land, WITH WHAT, and WHY lives
// here.
//
// Like the battle state, all of it stays JSON-serialisable: the whole expedition
// goes into one save file.

import type { CrewMember } from '../../content/crew'
import type { ModuleId, ResourceId, StationId, SystemId } from '../../content/ship'
import type { EncounterEffect, EncounterTag } from '../../content/encounters'
import type { PuzzleKind, Puzzle } from '../puzzles/types'
import type { RuneLineTask } from '../task/runeline'
import type { BattleState, HeroClassId, MissionKind, Objective, Text, TrialSymbol } from '../types'
import type { CarriedHero } from '../battle'
import type { DialId, Dials } from '../../content/difficulty'
import type { DirectiveKind } from '../../content/directives'
import type { RoomState } from '../session/room'

// ---------------------------------------------------------------- rewards

export type Reward =
  | { k: 'resource'; id: ResourceId; amount: number }
  | { k: 'understanding'; amount: number }
  | { k: 'module'; id: ModuleId }
  | { k: 'archive'; amount: number }
  | { k: 'revealMap'; columns: number }
  | { k: 'unlockPuzzle'; kind: PuzzleKind }
  | { k: 'crewJoin'; count: number }
  /** A named relic. Without an id, one is drawn from what this run has not seen. */
  | { k: 'relic'; id?: string }
  /** Advancement marks. Without a hero, both of them get it. */
  | { k: 'heroXp'; amount: number; who?: HeroClassId }

// ---------------------------------------------------------------- missions

export type MissionSpec = {
  kind: MissionKind
  objective: Objective
  difficulty: number
  /** Multiplier on the encounter roster: exploration runs field far fewer. */
  enemyScale: number
  roundLimit: number | null
  rewards: Reward[]
  /**
   * Is the fight aboard the ship itself?
   *
   * A landing that goes wrong costs a week, morale and often a crew member — but
   * not hull, because the hull is in orbit and the fight is not. When they are
   * already aboard that reasoning stops: losing there means they were loose in
   * the ship, and the ship shows it.
   */
  aboard?: boolean
  /**
   * Is this the Herald?
   *
   * It is a boarding action like any other, and everything about how it is built
   * follows from `aboard`. The flag exists so that finishing it can be told
   * apart: winning silences the thing for the rest of the run, losing sends it
   * back down the corridor to try again.
   */
  herald?: boolean
  /** Shown before launch, so the players can allocate power first. */
  briefing: Text
}

export type ActiveMission =
  | { k: 'battle'; nodeId: string; spec: MissionSpec; battle: BattleState }
  /**
   * A split task: the rune line. See engine/task/runeline.ts.
   *
   * Its own kind rather than another puzzle, because it is the only activity in
   * the game where the screens differ: what each player can see and press
   * depends on which seat they are in.
   */
  | {
      k: 'task'
      nodeId: string
      task: RuneLineTask
      rewards: Reward[]
      briefing: Text
    }
  | {
      k: 'puzzle'
      nodeId: string
      kind: PuzzleKind
      difficulty: number
      rewards: Reward[]
      puzzle: Puzzle
      briefing: Text
    }

// ---------------------------------------------------------------- star map

export type NodeKind =
  | 'empty'
  | 'ruins'
  | 'station'
  | 'anomaly'
  | 'world'
  | 'trade'
  | 'distress'
  | 'heart'

export type MarketOffer = {
  /** What is on the table. */
  item:
    | { k: 'resource'; id: ResourceId; amount: number }
    | { k: 'module'; id: ModuleId }
    | { k: 'crew'; member: CrewMember }
    | { k: 'relic'; id: string }
  price: number
  bought: boolean
}

export type NodeEvent =
  | { k: 'none' }
  | { k: 'encounter'; encounterId: string }
  | { k: 'mission'; spec: MissionSpec }
  | { k: 'puzzle'; kind: PuzzleKind | null; difficulty: number; rewards: Reward[]; briefing: Text }
  | { k: 'market'; offers: MarketOffer[] }
  | { k: 'task'; difficulty: number; rewards: Reward[]; briefing: Text }
  | { k: 'heart' }

export type MapNode = {
  id: string
  /** Invented designation — language neutral, so it never needs translating. */
  name: string
  kind: NodeKind
  column: number
  row: number
  /** Node ids one jump forward. */
  links: string[]
  /** Weeks of travel to each linked node, same order as `links`. */
  linkWeeks: number[]
  visited: boolean
  /** Has the kind been revealed by the sensors? */
  known: boolean
  event: NodeEvent
  /** Cleared: the event has been used up. */
  resolved: boolean
  tags: EncounterTag[]
}

export type StarMap = {
  columns: number
  nodes: MapNode[]
  /** Where the Gate dropped the expedition. */
  entryId: string
  heartId: string
}

// ---------------------------------------------------------------- log

export type ExpeditionEvent =
  | { k: 'expeditionStart'; weeks: number }
  | { k: 'weekPassed'; week: number; gateLeft: number }
  | { k: 'darkeningRose'; level: number }
  | { k: 'darkeningEased'; level: number }
  | { k: 'gateShifted'; amount: number; left: number }
  | { k: 'resourceGain'; id: ResourceId; amount: number }
  | { k: 'resourceLoss'; id: ResourceId; amount: number }
  | { k: 'lifeSupportStrained' }
  | { k: 'starving' }
  | { k: 'moraleCollapse' }
  | { k: 'crewLost'; name: string }
  | { k: 'crewJoined'; name: string }
  | { k: 'stationRan'; station: StationId }
  | { k: 'researchStarted'; project: Text }
  | { k: 'researchDone'; project: Text }
  | { k: 'moduleInstalled'; module: Text }
  | { k: 'courseSet'; node: string; weeks: number }
  | { k: 'arrived'; node: string }
  | { k: 'noFuel' }
  /** The engines have no power at all, so the jump is not happening this week. */
  | { k: 'enginesCold' }
  | { k: 'missionLaunched'; briefing: Text }
  | { k: 'missionWon' }
  | { k: 'missionLost' }
  | { k: 'missionRestarted' }
  | { k: 'missionRerolled' }
  | { k: 'missionWithdrawn' }
  | { k: 'missionSkipped' }
  | { k: 'missionForcedWin' }
  | { k: 'missionForcedLoss' }
  | { k: 'boardingDamage' }
  | { k: 'moduleLost'; module: Text }
  | { k: 'dialSet'; dial: DialId; level: number }
  | { k: 'storageFull'; id: ResourceId; lost: number; max: number }
  | { k: 'puzzleSolved' }
  | { k: 'puzzleFailed' }
  | { k: 'taskSolved' }
  | { k: 'taskFailed' }
  | { k: 'encounterChoice'; result: Text }
  | { k: 'cardsSacrificed'; count: number; symbol: TrialSymbol }
  | { k: 'understandingGained'; amount: number; total: number }
  | { k: 'mapRevealed'; columns: number }
  | { k: 'bought'; label: Text; price: number }
  | { k: 'gateClosing'; weeksLeft: number }
  | { k: 'reachedHeart' }
  // ------------------------------------------------- attention and the Herald
  | { k: 'attentionRose'; amount: number; total: number }
  | { k: 'attentionFell'; amount: number; total: number }
  | { k: 'heraldWoke' }
  | { k: 'heraldMoved'; columnsAway: number }
  | { k: 'heraldCaught' }
  | { k: 'heraldSilenced' }
  | { k: 'heraldRepelled' }
  // ---------------------------------------------------------------- relics
  | { k: 'relicFound'; relic: Text }
  | { k: 'relicAttuned'; relic: Text; hero: HeroClassId }
  | { k: 'relicStowed'; relic: Text }
  | { k: 'relicSold'; relic: Text; price: number }
  // ------------------------------------------------------------ advancement
  | { k: 'heroMarks'; hero: HeroClassId; amount: number; reason: Text }
  | { k: 'perkBought'; hero: HeroClassId; perk: Text }
  | { k: 'crewPromoted'; name: string; rank: number }
  | { k: 'crewLearned'; name: string; trait: Text }
  | { k: 'mentorTaken'; name: string; hero: HeroClassId }
  // ------------------------------------------------------------- directives
  | { k: 'directiveIssued'; label: Text; weeks: number }
  | { k: 'directiveDone'; label: Text }
  | { k: 'directiveFailed'; label: Text }
  /** The Heart, read before anything is decided there. */
  | { k: 'heartRead' }
  // -------------------------------------------------- the ship's own weeks
  | { k: 'aboardEvent'; title: Text; owner: HeroClassId | null }
  | { k: 'debtCame'; note: Text }
  | { k: 'loyaltyShift'; name: string; amount: number; band: Text }
  | { k: 'crewRestless'; name: string; weeks: number }
  | { k: 'crewSettled'; name: string }
  | { k: 'crewDefected'; name: string; took: Text }
  | { k: 'proposalMade'; by: number; what: Text }
  | { k: 'proposalCarried'; what: Text }
  | { k: 'proposalDropped' }
  | { k: 'watchSet'; hero: HeroClassId; duty: Text }
  | { k: 'watchDone'; hero: HeroClassId; duty: Text }

export type ExpeditionLogEntry = { week: number; event: ExpeditionEvent }

// ---------------------------------------------------------------- outcome

export type EndingId =
  /** Understanding 0: you leave, or smash what you found. */
  | 'flee'
  | 'blindRuin'
  /** Understanding 1: you learn what happened and carry it home. */
  | 'witness'
  /** Understanding 2: you see what is still happening, and act. */
  | 'intervene'
  /** Understanding 3: the deepest one. */
  | 'communion'
  /**
   * The end of the whole game, not of one expedition.
   *
   * Not reachable on a first run by design: it needs the Archive to have seen
   * every other ending, the last unlock bought, and this run to have understood
   * enough. Five expeditions know five things; this one asks what they add up to.
   */
  | 'theAnswer'
  /**
   * The four that are not about understanding at all.
   *
   * These are the endings you EARN rather than read your way into, and each one
   * asks for something the run did: turning for the Gate while you still can,
   * arriving with the crew whole, having silenced the thing that hunted you,
   * carrying enough of the dead galaxy home in your hands. They exist because
   * "how much did you understand" was the only question the endgame asked, and
   * a game whose ending is one number is a game you play once.
   */
  | 'homecoming'
  | 'custodian'
  | 'silence'
  | 'inheritance'

export type LossReason = 'hull' | 'morale' | 'gateClosed' | 'abandoned'

export type ExpeditionOutcome =
  | { k: 'ending'; id: EndingId; understanding: number }
  | { k: 'lost'; reason: LossReason }

// ---------------------------------------------------------------- screens

export type Screen =
  | 'ship'
  | 'starmap'
  | 'crew'
  | 'research'
  | 'market'
  | 'encounter'
  | 'mission'
  /** The two consoles: one per player. Marks, perks, relics, people, orders. */
  | 'consoles'
  | 'heart'
  /** The Gate, from the inside. The one screen where you can choose to go home. */
  | 'gate'
  | 'over'

/** A choice the players have taken but not yet paid for with cards. */
export type PendingEncounter = {
  id: string
  /**
   * The choice being *considered*, not yet taken.
   *
   * Picking a choice no longer commits to it: it opens the full account of what
   * it costs and what it does, and only a confirmation resolves it. Reading what
   * an option means must never be the same act as taking it.
   */
  chosen: number | null
  /** Cards picked so far, as "heroClass:cardId". */
  payment: string[]
  /** Once resolved, the result text to show. */
  resolvedText: Text | null
  /** The next scene of this situation, opened when this one is closed. */
  then?: string | null
}

// ---------------------------------------------------------------- state

export type ExpeditionLength = 'short' | 'medium' | 'long'

// ------------------------------------------------------- what belongs to whom

/**
 * One hero's private record: what they have earned and what they wear.
 *
 * Deliberately NOT part of `CarriedHero`, which is the battle engine's idea of a
 * hero and is rebuilt from the units every time a mission ends. Anything stored
 * there would be silently dropped by `missionResult`. This lives on the
 * expedition, and the battle is handed only the numbers it needs.
 */
export type HeroRecord = {
  /** Advancement marks earned and not yet spent. See content/advance.ts. */
  marks: number
  /** Marks earned over the whole run, so the console can show a history. */
  marksEarned: number
  /** Perk ids bought, in the order they were bought. */
  perks: string[]
  /** Relic ids worn attuned. Length is capped by perks — see `attunementSlots`. */
  attuned: string[]
}

/**
 * A dated request from home. See content/directives.ts for the kinds.
 *
 * `startedAt` is what progress is measured from: an order to win two landings
 * means two more, not two counting the one from last month. Without that a new
 * order could arrive already complete, which reads as a bug even when the maths
 * is right.
 */
export type Directive = {
  id: string
  kind: DirectiveKind
  /** Whose console it sits on. */
  owner: HeroClassId
  target: number
  /** The tally (or level) this order was issued against. */
  startedAt: number
  /** Week it must be done by. */
  due: number
  reward: Reward[]
  state: 'open' | 'done' | 'failed'
}

/**
 * Running counts the directives measure against.
 *
 * Kept as its own little ledger rather than derived from the log, because the
 * log is trimmed to the last four hundred entries and a long expedition would
 * quietly lose its early landings.
 */
/** Somebody has asked for something irreversible, and is waiting to be seconded. */
export type Proposal = {
  /** What would happen. Only the kinds `needsSeconding` allows get in here. */
  action: ProposedAction
  /** The seat that asked. */
  by: number
  /** Seats that have agreed since. One is enough. */
  seconds: number[]
}

/** The irreversible table decisions. Deliberately a short, closed list. */
export type ProposedAction =
  | { k: 'settleBattle'; as: 'victory' | 'defeat' | 'skip' }
  | { k: 'restartBattle' }
  | { k: 'rerollBattle' }
  | { k: 'withdrawBeforeLanding' }
  | { k: 'chooseEnding'; endingId: EndingId }
  | { k: 'abandon' }

/** A consequence that has not happened yet. */
export type Debt = {
  /** The week it comes due. */
  at: number
  /** Which crew member it is about, if any — see `subject`. */
  subject: string | null
  /**
   * What sort of debt this is, when something needs to find it again.
   *
   * Only the departure chain uses it: the ship getting better has to be able to
   * cancel a scheduled leaving, which means being able to look it up.
   */
  kind?: 'leaving'
  /** One line in the log when it lands, so it is never a mystery. */
  note: Text
  /** Applied through the same path as an encounter's effects. */
  effects: EncounterEffect[]
}

export type Tally = {
  landingsWon: number
  puzzlesSolved: number
  researchDone: number
  heraldsFaced: number
  relicsFound: number
}

/**
 * The thing that comes looking for you.
 *
 * It lives on a column rather than a node: it is not travelling the same roads
 * the ship is, it is coming up the corridor. `column` is where it is, and it
 * closes on the ship's column. `hunts` counts how many times it has been driven
 * off — each time it comes back harder, which is what stops "lose to it on
 * purpose" from being the cheap answer.
 */
export type Herald = {
  column: number
  hunts: number
}



export type ExpeditionState = {
  seed: number
  rngStep: number
  length: ExpeditionLength
  /**
   * The difficulty dials, as chosen for this run. See content/difficulty.ts.
   *
   * They live in the expedition rather than in a settings object because a run
   * should keep the terms it was played under: a save from a gentler week must
   * not silently become harder because the dial moved afterwards.
   */
  dials: Dials
  week: number
  gateTotal: number
  gateWeeksLeft: number
  darkening: number
  /**
   * How far a decision has pushed the Darkening off its natural course.
   *
   * The level itself is a function of how much of the Gate's time is spent, so
   * writing to it directly never lasted: the next recalculation put it back.
   * A decision that makes the dark come sooner — or holds it off — moves this
   * instead, and it is added to the computed level for good.
   */
  darkeningShift: number

  resources: Record<ResourceId, number>
  /** Reactor output actually available this week. */
  reactorOutput: number
  power: Record<SystemId, number>

  crew: CrewMember[]
  modules: ModuleId[]

  research: {
    completed: string[]
    active: { id: string; weeksLeft: number } | null
  }
  understanding: number
  /** Puzzle kinds available this expedition. */
  puzzleKinds: PuzzleKind[]

  /** Hero wounds and card losses persist between missions. */
  heroes: CarriedHero[]
  /** What each of the two players has earned, bought and attuned. */
  heroRecords: Record<HeroClassId, HeroRecord>
  /** Relic ids aboard, attuned or not. See content/relics.ts. */
  relics: string[]

  /**
   * How loudly this expedition is playing, 0 upwards.
   *
   * Fighting, forcing mechanisms and running the engines hot all raise it;
   * quiet weeks bring it down. Past a threshold the Herald wakes — see `herald`.
   * This is the one pressure in the game the players create themselves, which is
   * why it is worth having: the Gate's clock is the same every run, and this is
   * not.
   */
  attention: number
  /** Absent until the attention wakes it, and gone for good once silenced. */
  herald: Herald | null

  /** Live and finished orders from home. */
  directives: Directive[]
  /** Next directive number, so ids stay unique and readable. */
  directiveCount: number
  tally: Tally

  /** Has the Heart already been read? It can only be read once. */
  heartRead: boolean

  /**
   * What each hero is doing with their week. See content/watch.ts.
   *
   * Set from that player's own console and cleared when the week turns over, so
   * it is a decision every seat makes every week rather than a setting somebody
   * fixes once in week one.
   */
  watch: Partial<Record<HeroClassId, string>>
  /** Flux a duty has promised the next landing party. Spent when they land. */
  watchFlux: number

  /**
   * A table decision waiting for somebody else to agree to it.
   *
   * Only used in an online room with more than one player in a chair. The
   * handful of actions that go through here are the ones that cannot be taken
   * back and affect everybody — calling a landing a loss, redealing the
   * battlefield, ending the expedition, choosing how the story ends. At one
   * keyboard they are a two-step confirmation because there is one mouse; over a
   * network the same principle needs a second pair of hands, or any one player
   * can end everybody's evening with two clicks.
   */
  proposal: Proposal | null

  map: StarMap
  at: string
  travel: { to: string; weeksLeft: number } | null

  activeMission: ActiveMission | null
  pendingEncounter: PendingEncounter | null
  /** Encounter ids already used, so `once` holds. */
  usedEncounters: string[]

  /**
   * Which crew member the situation on screen is about.
   *
   * Aboard events are about a PERSON — the one who will not come out of their
   * cabin, the one packing a bag — and the effects say "the subject". Held here
   * rather than inside the pending situation so that a `later` effect fired three
   * weeks afterwards can still mean the same person.
   */
  subject: string | null

  /**
   * Consequences with a date on them.
   *
   * The whole reason this exists: a decision that costs nothing today and
   * something in three weeks is a decision worth thinking about, and it is the
   * only way the game can remember a choice rather than leaving it to the
   * players to remember. Fired at the start of the week they name.
   */
  debts: Debt[]

  /**
   * What this expedition has done that something later can notice.
   *
   * Two lists, because they have two lifetimes. `flags` last until the
   * expedition ends: a creature let out of a wreck, a world warned, a name
   * given. `marks` outlive it — they are seeded from the Archive at launch and
   * banked back into it at the end, so a decision can be answered a run later.
   *
   * Both are plain string ids so that content can invent one without touching
   * the engine, and both are saved with everything else.
   */
  flags: string[]
  marks: string[]

  screen: Screen
  log: ExpeditionLogEntry[]
  outcome: ExpeditionOutcome | null
  /** Archive points banked so far this run. */
  archiveEarned: number
}

// ---------------------------------------------------------------- archive

export type ArchiveUnlockId =
  | 'puzzle-balanceScales'
  | 'puzzle-safeGround'
  | 'puzzle-gravityCores'
  | 'puzzle-starChart'
  | 'puzzle-refraction'
  | 'puzzle-glyphs'
  | 'encounters-deep'
  | 'module-cache'
  | 'longer-gate'
  /** The closing arc. Only offered once every other ending has been seen. */
  | 'last-question'

export type ArchiveState = {
  version: number
  points: number
  unlocked: ArchiveUnlockId[]
  /** The long memory: marks carried between expeditions (see ExpeditionState). */
  marks: string[]
  /** Set once the closing ending has been reached. The game has an end. */
  completed?: boolean
  /** Endings actually reached, so the Archive can show what is left to find. */
  endingsSeen: EndingId[]
  history: {
    week: number
    understanding: number
    outcome: string
    /**
     * The seed the run was generated from, so a run worth repeating can be
     * started again from the archive.
     *
     * Optional because archives saved before this existed have entries without
     * it, and an old archive is worth more than a tidy type.
     */
    seed?: number
  }[]
  bestUnderstanding: number
  expeditionsRun: number
}

export type GameState = {
  archive: ArchiveState
  expedition: ExpeditionState | null
  /**
   * The table this game is being played at, if it has one.
   *
   * Null for a game started before rooms existed, and for anything that never
   * needed a code. The Archive stays outside it on purpose: an archive belongs
   * to a PERSON, not to a table, so four players in one room each bank their own
   * — everybody was there, and everybody learned something.
   */
  room: RoomState | null
}
