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
import type { EncounterTag } from '../../content/encounters'
import type { PuzzleKind, Puzzle } from '../puzzles/types'
import type { BattleState, MissionKind, Objective, Text, TrialSymbol } from '../types'
import type { CarriedHero } from '../battle'
import type { DialId, Dials } from '../../content/difficulty'

// ---------------------------------------------------------------- rewards

export type Reward =
  | { k: 'resource'; id: ResourceId; amount: number }
  | { k: 'understanding'; amount: number }
  | { k: 'module'; id: ModuleId }
  | { k: 'archive'; amount: number }
  | { k: 'revealMap'; columns: number }
  | { k: 'unlockPuzzle'; kind: PuzzleKind }
  | { k: 'crewJoin'; count: number }

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
  /** Shown before launch, so the players can allocate power first. */
  briefing: Text
}

export type ActiveMission =
  | { k: 'battle'; nodeId: string; spec: MissionSpec; battle: BattleState }
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
  price: number
  bought: boolean
}

export type NodeEvent =
  | { k: 'none' }
  | { k: 'encounter'; encounterId: string }
  | { k: 'mission'; spec: MissionSpec }
  | { k: 'puzzle'; kind: PuzzleKind | null; difficulty: number; rewards: Reward[]; briefing: Text }
  | { k: 'market'; offers: MarketOffer[] }
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
  | { k: 'encounterChoice'; result: Text }
  | { k: 'cardsSacrificed'; count: number; symbol: TrialSymbol }
  | { k: 'understandingGained'; amount: number; total: number }
  | { k: 'mapRevealed'; columns: number }
  | { k: 'bought'; label: Text; price: number }
  | { k: 'gateClosing'; weeksLeft: number }
  | { k: 'reachedHeart' }

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
  | 'heart'
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

  map: StarMap
  at: string
  travel: { to: string; weeksLeft: number } | null

  activeMission: ActiveMission | null
  pendingEncounter: PendingEncounter | null
  /** Encounter ids already used, so `once` holds. */
  usedEncounters: string[]

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
}
