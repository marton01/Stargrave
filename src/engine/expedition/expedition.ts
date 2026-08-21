// The expedition: the weekly turn and everything that hangs off it.
//
// One entry point, like the battle engine: expeditionStep(state, action).
// The previous state is never mutated.
//
// The shape of a week is deliberate. Power allocation and crew placement are a
// STANDING CONFIGURATION, not a chore you redo every week — you set them and
// then only adjust when something changes. That is what keeps a quiet week under
// way down to one click while arriving in a system stays a dense run of
// decisions. Without that distinction a ship-command game turns into filling in
// a spreadsheet.

import { clone } from '../state'
import { createRng } from '../rng'
import { CREW_TRAITS, generateCrewMember, traitBonus } from '../../content/crew'
import type { CrewMember, CrewTraitId } from '../../content/crew'
import {
  BASE_REACTOR_OUTPUT,
  MODULES,
  RESOURCES,
  RESOURCE_ORDER,
  STATIONS,
  STATION_ORDER,
  SYSTEM_ORDER,
  lifeSupportNeeded,
} from '../../content/ship'
import type { ModuleId, ResourceId, StationId, SystemId } from '../../content/ship'
import { encounter, encountersFor } from '../../content/encounters'
import { dialValue, normaliseDials } from '../../content/difficulty'
import type { DialId } from '../../content/difficulty'
import type { EncounterChoice, EncounterEffect } from '../../content/encounters'
import { availableProjects, researchProject, understandingTier } from '../../content/research'
import { card, cardsOfClass } from '../../content/cards'
import { generatePuzzle, puzzleStatus, applyPuzzleMove, STARTING_PUZZLE_KINDS } from '../puzzles/index'
import type { PuzzleKind, PuzzleMove } from '../puzzles/types'
import { missionResult, startMission, step as battleStep } from '../battle'
import type { Action as BattleAction, CarriedHero } from '../battle'
import { KIND_TAGS, LENGTHS, generateStarMap, mapNode, revealAhead } from './starmap'
import type {
  ArchiveState,
  EndingId,
  ExpeditionEvent,
  ExpeditionLength,
  ExpeditionState,
  MapNode,
  MissionSpec,
  Reward,
  Screen,
} from './types'
import type { HeroClassId, Objective, Text, TrialSymbol } from '../types'

// ---------------------------------------------------------------- actions

export type ExpeditionAction =
  | { k: 'setPower'; system: SystemId; value: number }
  | { k: 'assignCrew'; crewId: string; station: StationId | null }
  | { k: 'startResearch'; projectId: string }
  | { k: 'setCourse'; nodeId: string }
  | { k: 'advanceWeek' }
  | { k: 'openScreen'; screen: Screen }
  | { k: 'engageNode' }
  | { k: 'encounterChoose'; index: number }
  | { k: 'encounterPayCard'; heroClass: HeroClassId; cardId: string }
  | { k: 'encounterCancel' }
  | { k: 'encounterConfirm' }
  | { k: 'encounterClose' }
  | { k: 'battleAction'; action: BattleAction }
  | { k: 'puzzleMove'; move: PuzzleMove }
  | { k: 'missionFinish' }
  /** Same battlefield, from the beginning. */
  | { k: 'restartBattle' }
  /** A different battlefield, same brief. */
  | { k: 'rerollBattle' }
  /** Leave, as if the landing had not happened. */
  | { k: 'withdrawBeforeLanding' }
  /**
   * Decide the landing without playing it.
   *
   * Three shapes of the same escape hatch: take the win with everything it pays,
   * take the loss with everything it costs, or walk away from a landing that is
   * neither — nothing gained, nothing paid, the node counted as done.
   */
  | { k: 'settleBattle'; as: 'victory' | 'defeat' | 'skip' }
  /** Move one difficulty dial. See content/difficulty.ts. */
  | { k: 'dialSet'; dial: DialId; level: number }
  | { k: 'marketBuy'; index: number }
  | { k: 'chooseEnding'; endingId: EndingId }
  | { k: 'abandon' }

// ---------------------------------------------------------------- helpers

function log(s: ExpeditionState, event: ExpeditionEvent): void {
  s.log.push({ week: s.week, event })
  if (s.log.length > 400) s.log.splice(0, s.log.length - 400)
}

function rngFor(s: ExpeditionState) {
  s.rngStep += 1
  return createRng(s.seed * 6151 + s.rngStep)
}

export function livingCrew(s: ExpeditionState): CrewMember[] {
  return s.crew.filter((c) => c.alive)
}

export function moduleTotal(
  s: ExpeditionState,
  field: 'reactor' | 'flux' | 'sensorRange' | 'wards',
): number {
  return s.modules.reduce((sum, id) => sum + (MODULES[id][field] ?? 0), 0)
}

export function resourceMax(s: ExpeditionState, id: ResourceId): number {
  const bonus = s.modules.reduce(
    (sum, m) => sum + (MODULES[m].resourceMax?.id === id ? MODULES[m].resourceMax!.amount : 0),
    0,
  )
  return RESOURCES[id].max + bonus
}

function gain(s: ExpeditionState, id: ResourceId, amount: number): void {
  if (amount === 0) return
  const before = s.resources[id]
  const max = resourceMax(s, id)
  s.resources[id] = Math.max(0, Math.min(max, before + amount))
  const delta = s.resources[id] - before
  if (delta > 0) log(s, { k: 'resourceGain', id, amount: delta })
  else if (delta < 0) log(s, { k: 'resourceLoss', id, amount: -delta })
  // A gain the hold could not take is the one thing storage capacity is for, and
  // silently dropping it is why nobody could tell whether capacity mattered.
  const lost = amount - delta
  if (amount > 0 && lost > 0) log(s, { k: 'storageFull', id, lost, max })
}

/** How much reactor output is actually available, after the Darkening bites. */
export function reactorOutput(s: ExpeditionState): number {
  return Math.max(3, BASE_REACTOR_OUTPUT + moduleTotal(s, 'reactor') - s.darkening)
}

export function powerUsed(s: ExpeditionState): number {
  return SYSTEM_ORDER.reduce((sum, id) => sum + s.power[id], 0)
}

export function crewAt(s: ExpeditionState, station: StationId): CrewMember[] {
  return livingCrew(s).filter((c) => c.station === station)
}

/** Is a station actually doing anything? It needs both power and hands. */
export function stationActive(s: ExpeditionState, station: StationId): boolean {
  const def = STATIONS[station]
  return s.power[def.needs] > 0 && crewAt(s, station).length > 0
}

/**
 * How well staffed, counting speciality match and traits.
 *
 * One point for a body, two for the right speciality, plus whatever the traits
 * are worth. Every station's output reads this at a granularity where those two
 * are different — that had to be fixed once: with divisors of three and four, one
 * navigator in the Sanctum was worth exactly one medic, which is not what the
 * rules promise.
 */
export function stationStrength(s: ExpeditionState, station: StationId): number {
  const def = STATIONS[station]
  const crew = crewAt(s, station)
  return crew.reduce((sum, c) => {
    const match = c.speciality === def.speciality ? 2 : 1
    const traits = c.traits.reduce((n, t) => n + (CREW_TRAITS[t].station ?? 0), 0)
    return sum + Math.max(1, match + traits)
  }, 0)
}

/**
 * What ending the week would do to the resources, if nothing else changes.
 *
 * Deliberately not a second copy of the weekly rules: it runs the week on a copy
 * of the state and looks at the difference. A hand-written projection would be a
 * second implementation of food, fuel, stations, modules and morale drift — and
 * the day one of them changed, the header would start lying.
 *
 * `expeditionStep` already works on a clone and never touches the state it is
 * given, so this costs one copy and cannot leak. And because every random draw
 * comes from the state's own seed and step counter, the copy draws exactly what
 * the real week will draw: the projection is not an estimate.
 *
 * Returns null while the week cannot be ended anyway — mid-battle, mid-encounter.
 */
export function projectWeek(s: ExpeditionState): Partial<Record<ResourceId, number>> | null {
  if (!canAdvanceWeek(s)) return null
  const after = expeditionStep(s, { k: 'advanceWeek' })
  const out: Partial<Record<ResourceId, number>> = {}
  for (const id of RESOURCE_ORDER) {
    const delta = after.resources[id] - s.resources[id]
    if (delta !== 0) out[id] = delta
  }
  return out
}

// ------------------------------------------------------- what a point buys
//
// Every one of these is the number the weekly turn actually uses, exported so
// the ship screen can show it. Before this, the formulas lived inside the
// functions that applied them and the interface showed only how many pips were
// lit — so "does a fourth point do anything?" was unanswerable without reading
// the source. Two of them turned out to be: no.

/** Information the Lab produces in a week. Scales with power. */
export function labOutput(s: ExpeditionState): number {
  if (!stationActive(s, 'lab')) return 0
  return (
    s.power.lab +
    Math.floor(stationStrength(s, 'lab') / 2) +
    Math.max(0, traitBonus(crewAt(s, 'lab'), 'research'))
  )
}

/**
 * Hull the Forge repairs in a week.
 *
 * BALANCE: the power given to the Forge used to do nothing at all beyond
 * switching it on — the repair came from the crew alone. It counts now, at half
 * a point of hull per point of power, the same rate the crew is worth.
 */
export function forgeOutput(s: ExpeditionState): number {
  if (!stationActive(s, 'forge')) return 0
  return 1 + Math.floor(s.power.forge / 2) + Math.floor(stationStrength(s, 'forge') / 2)
}

/** Columns of star map the Sensors reveal each week. */
export function sensorOutput(s: ExpeditionState): number {
  if (!stationActive(s, 'sensors')) return 0
  return s.power.sensors + moduleTotal(s, 'sensorRange')
}

/**
 * Hit points the Medbay gives each hero between landings.
 *
 * BALANCE: a flat 2 before, so a second medic was worth nothing. Now the crew
 * counts, which is what the station is for.
 */
export function medbayOutput(s: ExpeditionState): number {
  if (!stationActive(s, 'medbay')) return 0
  return 1 + Math.floor(stationStrength(s, 'medbay') / 2)
}

/**
 * Weeks of research the Archive skips ahead.
 *
 * BALANCE: flat one week before. A second, well-matched scientist now buys a
 * second week — the one place where doubling up on a station is dramatic.
 */
export function archiveOutput(s: ExpeditionState): number {
  if (!stationActive(s, 'archive')) return 0
  // One slot only, so the step has to be reachable by one person: a matching
  // scientist gets the extra week the station is described as giving, and anybody
  // else just keeps the lights on.
  return stationStrength(s, 'archive') >= 2 ? 2 : 1
}

/** Fuel the Bridge saves on every week under way. */
export function bridgeOutput(s: ExpeditionState): number {
  if (!stationActive(s, 'bridge')) return 0
  // Nobody but a navigator saves fuel here: a body in the chair keeps the station
  // "running" and trims nothing.
  return Math.floor(stationStrength(s, 'bridge') / 2)
}

/** Morale the Sanctum holds the ship at, above the baseline. */
export function sanctumOutput(s: ExpeditionState): number {
  if (!stationActive(s, 'sanctum')) return 0
  return 1 + Math.floor(stationStrength(s, 'sanctum') / 2)
}

/** Flux the Armoury adds to the landing party. */
export function armouryOutput(s: ExpeditionState): number {
  if (!stationActive(s, 'armoury') || s.power.runeCore <= 0) return 0
  // Same shape as the Archive: one slot, so the step is the speciality itself.
  return stationStrength(s, 'armoury') >= 2 ? 2 : 1
}

/** What the installed modules produce of a resource every week, by themselves. */
export function weeklyFromModules(s: ExpeditionState, id: ResourceId): number {
  return s.modules.reduce((sum, m) => {
    const weekly = MODULES[m].weekly
    return sum + (weekly && weekly.id === id ? weekly.amount : 0)
  }, 0)
}

/** Weeks a journey of `base` weeks takes at the current engine power. */
export function travelWeeks(s: ExpeditionState, base: number): number {
  return Math.max(1, base - Math.max(0, s.power.engines - 1))
}

/**
 * Fuel burned for each week under way.
 *
 * The Engines have always been described as setting both how long a jump takes
 * *and* what it costs, and only the first half was true: fuel came from the
 * Bridge alone, so power on the engines was free speed. It is a trade now —
 * every point above the second burns another unit a week.
 *
 * Which makes the interesting number the *total*, not the rate. On a three-week
 * road: 2 power is two weeks at 2 (four fuel), 3 power is one week at 3 (three
 * fuel), and 4 power is that same one week at 4 — the same speed for more fuel.
 * So there is a right amount of engine for a given journey, and hoarding power
 * there is visibly wasteful rather than quietly optimal.
 */
export function travelFuel(s: ExpeditionState): number {
  const thirst = 2 + Math.max(0, s.power.engines - 2)
  // Gross: what the engines ask for, before anything the ship makes itself. The
  // floor of one is the ship simply running — see `weeklyFuel` for the balance.
  return Math.max(1, Math.round((thirst - bridgeOutput(s)) * dialValue(s.dials, 'upkeep')))
}

/**
 * The fuel a week actually moves — and it is never positive.
 *
 * Two rules meet here. The engines always ask for at least one unit while under
 * way, and the Fuel synthesiser gives some back; with a good engine setting and
 * navigators on the Bridge the two can cancel exactly, which is the point of
 * researching it — travel for nothing.
 *
 * But the tank never *fills* on its own. A synthesiser that accumulated while
 * the ship stood still would quietly remove fuel from the game: the resource
 * exists to make routes cost something. So it offsets consumption and stops
 * there. Fuel still comes from markets, encounters and mission rewards — those
 * are gains you went and got, not a number ticking up in the background.
 */
export function weeklyFuel(s: ExpeditionState): number {
  const burn = s.travel ? travelFuel(s) : 0
  const made = weeklyFromModules(s, 'fuel')
  return Math.min(0, made - burn)
}

/** Hull risk the shields and wards absorb from an encounter. */
export function shieldMitigation(s: ExpeditionState): number {
  return s.power.shields + moduleTotal(s, 'wards')
}

/** Life support the crew needs, and what it has. */
export function lifeSupportStatus(s: ExpeditionState): { has: number; needs: number } {
  return { has: s.power.lifeSupport, needs: lifeSupportNeeded(livingCrew(s).length) }
}

/** Flux the rune core will hand the landing party. */
export function missionFlux(s: ExpeditionState): number {
  return Math.max(
    1,
    s.power.runeCore + armouryOutput(s) + moduleTotal(s, 'flux') + dialValue(s.dials, 'flux'),
  )
}

export function understandingTierOf(s: ExpeditionState) {
  return understandingTier(s.understanding)
}

function killCrew(s: ExpeditionState, count = 1): void {
  for (let i = 0; i < count; i++) {
    const alive = livingCrew(s)
    if (alive.length <= 1) return
    const victim = rngFor(s).pick(alive)
    if (!victim) return
    victim.alive = false
    victim.station = null
    log(s, { k: 'crewLost', name: victim.name })
  }
}

function joinCrew(s: ExpeditionState, count = 1): void {
  for (let i = 0; i < count; i++) {
    const member = generateCrewMember(rngFor(s), `crew-w${s.week}-${i}-${s.rngStep}`)
    s.crew.push(member)
    log(s, { k: 'crewJoined', name: member.name })
  }
}

function hasTrait(s: ExpeditionState, trait: CrewTraitId): boolean {
  return livingCrew(s).some((c) => c.traits.includes(trait))
}

// ---------------------------------------------------------------- start

export function startExpedition(
  seed: number,
  length: ExpeditionLength,
  archive: ArchiveState,
  /** The difficulty dials to run under. Defaults to the game as designed. */
  startDials?: unknown,
): ExpeditionState {
  const rng = createRng(seed)
  const puzzleKinds = puzzleKindsFrom(archive)
  const archiveOpen = archive.unlocked.includes('encounters-deep')

  const resources = {} as Record<ResourceId, number>
  for (const id of RESOURCE_ORDER) resources[id] = RESOURCES[id].start

  const power = {} as Record<SystemId, number>
  for (const id of SYSTEM_ORDER) power[id] = 0
  // A sane opening allocation, so week one is not a blank sheet.
  power.lifeSupport = 2
  power.engines = 2
  power.lab = 1
  power.forge = 1
  power.runeCore = 2

  const crew = [
    generateCrewMember(rng, 'crew-0', 'engineer'),
    generateCrewMember(rng, 'crew-1', 'scientist'),
    generateCrewMember(rng, 'crew-2', 'guard'),
    generateCrewMember(rng, 'crew-3', 'medic'),
    generateCrewMember(rng, 'crew-4', 'navigator'),
    generateCrewMember(rng, 'crew-5'),
  ]
  // Sensible first postings: everybody where their speciality belongs.
  const defaults: [string, StationId][] = [
    ['crew-0', 'forge'],
    ['crew-1', 'lab'],
    ['crew-2', 'armoury'],
    ['crew-3', 'medbay'],
    ['crew-4', 'bridge'],
    ['crew-5', 'sanctum'],
  ]
  for (const [id, station] of defaults) {
    const member = crew.find((c) => c.id === id)
    if (member) member.station = station
  }

  const dials = normaliseDials(startDials)
  const gateWeeks = Math.max(
    8,
    Math.round(
      (LENGTHS[length].weeks + (archive.unlocked.includes('longer-gate') ? 4 : 0)) *
        dialValue(dials, 'gateTime'),
    ),
  )

  const heroes: CarriedHero[] = (['runesmith', 'echoreader'] as HeroClassId[]).map((heroClass) => ({
    heroClass,
    hp: heroClass === 'runesmith' ? 12 : 8,
    hand: cardsOfClass(heroClass).map((c) => c.id),
    discard: [],
    lost: [],
  }))

  const map = generateStarMap(seed, length, puzzleKinds, archiveOpen)

  const s: ExpeditionState = {
    seed,
    rngStep: 0,
    length,
    dials,
    week: 0,
    gateTotal: gateWeeks,
    gateWeeksLeft: gateWeeks,
    darkening: 0,
    darkeningShift: 0,
    resources,
    reactorOutput: BASE_REACTOR_OUTPUT,
    power,
    crew,
    modules: archive.unlocked.includes('module-cache') ? ['reinforcedHull'] : [],
    research: { completed: [], active: null },
    understanding: 0,
    puzzleKinds,
    heroes,
    map,
    at: map.entryId,
    travel: null,
    activeMission: null,
    pendingEncounter: null,
    usedEncounters: [],
    // The deeper encounters are an Archive unlock; carried as a flag so that
    // runtime choices can ask about it without reaching for the Archive.
    flags: [
      ...(archive.unlocked.includes('encounters-deep') ? ['deeper-layers'] : []),
      ...(archive.unlocked.includes('last-question') ? ['last-question'] : []),
    ],
    // The long memory comes along, so a decision from an earlier run can be
    // answered in this one.
    marks: [...archive.marks],
    screen: 'ship',
    log: [],
    outcome: null,
    archiveEarned: 0,
  }

  s.reactorOutput = reactorOutput(s)
  log(s, { k: 'expeditionStart', weeks: gateWeeks })
  revealAhead(s.map, s.at, 1)
  return s
}

export function puzzleKindsFrom(archive: ArchiveState): PuzzleKind[] {
  const extra: PuzzleKind[] = []
  const map: Record<string, PuzzleKind> = {
    'puzzle-balanceScales': 'balanceScales',
    'puzzle-safeGround': 'safeGround',
    'puzzle-gravityCores': 'gravityCores',
    'puzzle-starChart': 'starChart',
    'puzzle-refraction': 'refraction',
    'puzzle-glyphs': 'glyphs',
  }
  for (const id of archive.unlocked) {
    const kind = map[id]
    if (kind) extra.push(kind)
  }
  return [...STARTING_PUZZLE_KINDS, ...extra]
}

// ---------------------------------------------------------------- the week

function runStations(s: ExpeditionState): void {
  // Lab: Information.
  const information = labOutput(s)
  if (information > 0) {
    gain(s, 'information', information)
    log(s, { k: 'stationRan', station: 'lab' })
  }

  // Forge: hull repair.
  const repair = forgeOutput(s)
  if (repair > 0) {
    gain(s, 'hull', repair)
    log(s, { k: 'stationRan', station: 'forge' })
  }

  // Sensors: reveal the road ahead.
  const columns = sensorOutput(s)
  if (columns > 0) {
    const revealed = revealAhead(s.map, s.at, columns)
    if (revealed > 0) log(s, { k: 'mapRevealed', columns })
  }

  // Medbay: patch the heroes up between landings.
  const healing = medbayOutput(s)
  if (healing > 0) {
    for (const hero of s.heroes) {
      const max = hero.heroClass === 'runesmith' ? 12 : 8
      hero.hp = Math.min(max, hero.hp + healing)
    }
    log(s, { k: 'stationRan', station: 'medbay' })
  }

  // Archive: weeks of research skipped.
  if (s.research.active) {
    const weeks = archiveOutput(s)
    if (weeks > 0) {
      s.research.active.weeksLeft -= weeks
      log(s, { k: 'stationRan', station: 'archive' })
    }
  }
}

function weeklyResources(s: ExpeditionState): void {
  // Food: everybody eats.
  const crewCount = livingCrew(s).length
  // BALANCE: this was crew/2, which emptied a full hold in seven weeks and made
  // starvation the default ending rather than a consequence of a bad route.
  const eaten = Math.max(1, Math.ceil((crewCount / 3) * dialValue(s.dials, 'upkeep')))
  if (s.resources.food < eaten) {
    s.resources.food = 0
    log(s, { k: 'starving' })
    gain(s, 'morale', -3)
    if (rngFor(s).next() < 0.3) killCrew(s, 1)
  } else {
    gain(s, 'food', -eaten)
  }

  // Fuel: the week's balance, which is a cost or nothing — never an increase.
  const fuelCost = -weeklyFuel(s)
  if (fuelCost > 0) {
    if (s.resources.fuel < fuelCost) {
      s.resources.fuel = 0
      log(s, { k: 'noFuel' })
      // Drifting: the jump stalls and the crew feels it.
      if (s.travel) s.travel.weeksLeft += 1
      gain(s, 'morale', -1)
    } else {
      gain(s, 'fuel', -fuelCost)
    }
  }

  // Modules that simply produce. Fuel is not among them: what a synthesiser makes
  // is already accounted for in `weeklyFuel`, where it can cancel a cost but not
  // become an income.
  for (const id of s.modules) {
    const weekly = MODULES[id].weekly
    if (weekly && weekly.id !== 'fuel') gain(s, weekly.id, weekly.amount)
  }

  // Life support.
  const needed = lifeSupportNeeded(crewCount)
  if (s.power.lifeSupport < needed) {
    log(s, { k: 'lifeSupportStrained' })
    gain(s, 'morale', -2)
    if (rngFor(s).next() < 0.15) killCrew(s, 1)
  }

  // Morale drifts towards a target set by conditions, rather than accumulating.
  //
  // BALANCE (after the first full playthrough): this used to add the crew's
  // trait total every week, which meant a roster that happened to be two points
  // negative bled morale to zero by week four with nothing the players could do
  // about it. Drifting towards a target is self-correcting: bad conditions pull
  // morale down to a floor and hold it there, and fixing the cause recovers it.
  // Sustained neglect still kills — the target itself can reach zero.
  const target = moraleTarget(s)
  const gap = target - s.resources.morale
  if (gap !== 0) gain(s, 'morale', Math.sign(gap) * (Math.abs(gap) >= 4 ? 2 : 1))
}

/** Where morale is heading, given how the ship is being run. */
export function moraleTarget(s: ExpeditionState): number {
  const crewCount = livingCrew(s).length
  let target = 7
  target += Math.max(-2, Math.min(2, traitBonus(livingCrew(s), 'morale')))
  target += sanctumOutput(s)
  if (s.power.lifeSupport < lifeSupportNeeded(crewCount)) target -= 3
  if (s.resources.food <= 0) target -= 3
  target -= s.darkening
  return Math.max(0, Math.min(resourceMax(s, 'morale'), target))
}

function advanceResearch(s: ExpeditionState): void {
  const active = s.research.active
  if (!active) return
  active.weeksLeft -= 1
  if (active.weeksLeft > 0) return

  const project = researchProject(active.id)
  s.research.completed.push(project.id)
  s.research.active = null
  log(s, { k: 'researchDone', project: project.name })

  for (const effect of project.effects) {
    switch (effect.k) {
      case 'module':
        if (!s.modules.includes(effect.id)) {
          s.modules.push(effect.id)
          log(s, { k: 'moduleInstalled', module: MODULES[effect.id].name })
        }
        break
      case 'understanding':
        s.understanding += effect.amount
        log(s, {
          k: 'understandingGained',
          amount: effect.amount,
          total: s.understanding,
        })
        break
      case 'reactor':
        // Handled through modules; kept for future projects.
        break
      case 'unlockPuzzle':
        if (!s.puzzleKinds.includes(effect.kind)) s.puzzleKinds.push(effect.kind)
        break
      case 'heroCard':
        for (const hero of s.heroes) {
          if (card(effect.cardId).heroClass === hero.heroClass) hero.hand.push(effect.cardId)
        }
        break
    }
  }
}

function updateDarkening(s: ExpeditionState): void {
  const spent = 1 - s.gateWeeksLeft / Math.max(1, s.gateTotal)
  const level = Math.max(0, Math.min(3, Math.floor(spent * 4) + s.darkeningShift))
  if (level !== s.darkening) {
    const rising = level > s.darkening
    s.darkening = level
    log(s, rising ? { k: 'darkeningRose', level } : { k: 'darkeningEased', level })
  }
  s.reactorOutput = reactorOutput(s)
  // Trim any allocation that no longer fits the shrunken reactor.
  let over = powerUsed(s) - s.reactorOutput
  for (const id of [...SYSTEM_ORDER].reverse()) {
    while (over > 0 && s.power[id] > 0) {
      s.power[id] -= 1
      over -= 1
    }
  }
}

function checkLoss(s: ExpeditionState): boolean {
  if (s.outcome) return true
  if (s.resources.hull <= 0) {
    s.outcome = { k: 'lost', reason: 'hull' }
    s.screen = 'over'
    return true
  }
  if (s.resources.morale <= 0) {
    s.outcome = { k: 'lost', reason: 'morale' }
    s.screen = 'over'
    return true
  }
  if (s.gateWeeksLeft <= 0 && s.at !== s.map.heartId) {
    s.outcome = { k: 'lost', reason: 'gateClosed' }
    s.screen = 'over'
    return true
  }
  return false
}

function arrive(s: ExpeditionState, nodeId: string): void {
  s.at = nodeId
  s.travel = null
  const node = mapNode(s.map, nodeId)
  node.visited = true
  node.known = true
  log(s, { k: 'arrived', node: node.name })
  revealAhead(s.map, nodeId, 1)

  if (node.event.k === 'heart') {
    log(s, { k: 'reachedHeart' })
    s.screen = 'heart'
    return
  }

  // Narrative beats open by themselves; landings wait, so the players can put
  // power into the rune core first.
  if (node.event.k === 'encounter' && !node.resolved) {
    openEncounter(s, encounterAtNode(s, node, node.event.encounterId))
    return
  }
  if (node.event.k === 'market' && !node.resolved) {
    // The offers themselves remember what has been bought, so the node counts as
    // settled the moment we dock. Otherwise it would keep asking to be engaged.
    node.resolved = true
    s.screen = 'market'
    return
  }
  if (node.event.k === 'none') node.resolved = true
  s.screen = 'starmap'
}

function advanceWeek(s: ExpeditionState): void {
  if (s.activeMission || s.pendingEncounter || s.outcome) return

  s.week += 1
  s.gateWeeksLeft -= 1
  updateDarkening(s)
  log(s, { k: 'weekPassed', week: s.week, gateLeft: s.gateWeeksLeft })
  if (s.gateWeeksLeft <= 5) log(s, { k: 'gateClosing', weeksLeft: s.gateWeeksLeft })

  for (const member of livingCrew(s)) member.weeksAboard += 1

  weeklyResources(s)
  runStations(s)
  advanceResearch(s)

  if (s.travel) {
    s.travel.weeksLeft -= 1
    if (s.travel.weeksLeft <= 0) {
      arrive(s, s.travel.to)
    }
  }

  checkLoss(s)
}

// ---------------------------------------------------------------- encounters

/**
 * Which encounter actually happens here.
 *
 * The star map is generated once, at launch, so a node's encounter is chosen
 * before the expedition has done anything worth answering. That is fine for the
 * ordinary ones — but a *consequence* must not depend on the map having guessed
 * that it would be needed.
 *
 * So at the moment of arrival, a follow-up whose condition the expedition now
 * meets takes precedence over whatever was rolled. Deterministically, and
 * first-come: what you set in motion will find you, at the next place it fits.
 */
function encounterAtNode(s: ExpeditionState, node: MapNode, rolled: string): string {
  const followUp = encountersFor(
    KIND_TAGS[node.kind],
    s.usedEncounters,
    s.flags.includes('deeper-layers'),
    s.flags,
    s.marks,
  ).find((e) => (e.requiresFlag !== undefined || e.requiresMark !== undefined))
  return followUp?.id ?? rolled
}

function openEncounter(s: ExpeditionState, id: string): void {
  s.pendingEncounter = { id, chosen: null, payment: [], resolvedText: null }
  if (!s.usedEncounters.includes(id)) s.usedEncounters.push(id)
  s.screen = 'encounter'
}

export function choiceAvailable(s: ExpeditionState, choice: EncounterChoice): boolean {
  const need = choice.requires
  if (!need) return true
  switch (need.k) {
    case 'shieldsAtLeast':
      return s.power.shields >= need.value
    case 'moduleInstalled':
      return s.modules.includes(need.id)
    case 'understandingAtLeast':
      return s.understanding >= need.value
    case 'crewWithTrait':
      return hasTrait(s, need.trait)
    case 'resourceAtLeast':
      return s.resources[need.id] >= need.value
    case 'flag':
      return s.flags.includes(need.id)
    case 'noFlag':
      return !s.flags.includes(need.id)
    case 'mark':
      return s.marks.includes(need.id)
  }
}

/** Cards a hero could hand over for a trial with this symbol. */
export function payableCards(s: ExpeditionState, symbol: TrialSymbol): { heroClass: HeroClassId; cardId: string }[] {
  const out: { heroClass: HeroClassId; cardId: string }[] = []
  for (const hero of s.heroes) {
    for (const cardId of [...hero.hand, ...hero.discard]) {
      if (card(cardId).symbols.includes(symbol)) out.push({ heroClass: hero.heroClass, cardId })
    }
  }
  return out
}

function cardCostOf(choice: EncounterChoice): { symbol: TrialSymbol; count: number } | null {
  const cost = choice.costs.find((c) => c.k === 'cards')
  return cost && cost.k === 'cards' ? { symbol: cost.symbol, count: cost.count } : null
}

/** Does the ship have enough to take this choice at all? */
export function choiceAffordable(s: ExpeditionState, choice: EncounterChoice): boolean {
  for (const cost of choice.costs) {
    if (cost.k === 'resource' && s.resources[cost.id] < cost.amount) return false
    if (cost.k === 'weeks' && s.gateWeeksLeft <= cost.amount) return false
    if (cost.k === 'cards' && payableCards(s, cost.symbol).length < cost.count) return false
  }
  return true
}

function applyHullRisk(s: ExpeditionState, amount: number): void {
  const scaled = Math.round(amount * dialValue(s.dials, 'encounterRisk'))
  const mitigated = Math.max(0, scaled - s.power.shields - moduleTotal(s, 'wards'))
  if (mitigated > 0) gain(s, 'hull', -mitigated)
}

function applyEncounterEffects(s: ExpeditionState, effects: readonly EncounterEffect[]): void {
  for (const effect of effects) {
    switch (effect.k) {
      case 'resource':
        gain(s, effect.id, effect.amount)
        break
      case 'understanding':
        s.understanding += effect.amount
        log(s, { k: 'understandingGained', amount: effect.amount, total: s.understanding })
        break
      case 'module':
        if (!s.modules.includes(effect.id)) {
          s.modules.push(effect.id)
          log(s, { k: 'moduleInstalled', module: MODULES[effect.id].name })
        }
        break
      case 'crewJoin':
        joinCrew(s, effect.count)
        break
      case 'crewLost':
        killCrew(s, effect.count)
        break
      case 'archive':
        s.archiveEarned += effect.amount
        break
      case 'revealMap': {
        const revealed = revealAhead(s.map, s.at, effect.columns)
        if (revealed > 0) log(s, { k: 'mapRevealed', columns: effect.columns })
        break
      }
      case 'hullRisk':
        applyHullRisk(s, effect.amount)
        break
      case 'startMission':
        launchMission(s, missionFromFlavour(s, effect.flavour))
        break
      case 'startPuzzle':
        launchPuzzle(s, effect.kind ?? null, Math.max(1, 1 + s.darkening), [
          { k: 'archive', amount: 1 },
          { k: 'resource', id: 'information', amount: 5 },
        ])
        break

      case 'flag':
        if (!s.flags.includes(effect.id)) s.flags.push(effect.id)
        break

      case 'mark':
        if (!s.marks.includes(effect.id)) s.marks.push(effect.id)
        break

      case 'gateWeeks': {
        // Weeks given or taken. The counter is the whole pressure of the run, so
        // this is the heaviest number a decision can move.
        s.gateWeeksLeft = Math.max(0, s.gateWeeksLeft + effect.amount)
        s.gateTotal = Math.max(s.gateTotal, s.week + s.gateWeeksLeft)
        log(s, { k: 'gateShifted', amount: effect.amount, left: s.gateWeeksLeft })
        updateDarkening(s)
        break
      }

      case 'darkening':
        // Through the shift, so it survives the next recalculation — and through
        // `updateDarkening`, so the reactor and the power allocation follow.
        s.darkeningShift += effect.amount
        updateDarkening(s)
        break

      case 'then':
        // Not applied here: the next scene waits until the result of this one has
        // been read. See `resolveEncounter`.
        break
    }
  }
}

function resolveEncounter(s: ExpeditionState): void {
  const pending = s.pendingEncounter
  if (!pending || pending.chosen === null) return
  const def = encounter(pending.id)
  const choice = def.choices[pending.chosen]
  if (!choice) return

  // Pay up.
  for (const cost of choice.costs) {
    if (cost.k === 'resource') gain(s, cost.id, -cost.amount)
    if (cost.k === 'weeks') {
      for (let i = 0; i < cost.amount; i++) {
        s.week += 1
        s.gateWeeksLeft -= 1
      }
      updateDarkening(s)
    }
    if (cost.k === 'cards') {
      for (const token of pending.payment) {
        const [heroClass, cardId] = token.split(':') as [HeroClassId, string]
        const hero = s.heroes.find((h) => h.heroClass === heroClass)
        if (!hero) continue
        hero.hand = hero.hand.filter((c) => c !== cardId)
        hero.discard = hero.discard.filter((c) => c !== cardId)
        if (!hero.lost.includes(cardId)) hero.lost.push(cardId)
      }
      log(s, { k: 'cardsSacrificed', count: cost.count, symbol: cost.symbol })
    }
  }

  applyEncounterEffects(s, choice.effects)
  log(s, { k: 'encounterChoice', result: choice.result })

  const node = mapNode(s.map, s.at)
  node.resolved = true

  pending.resolvedText = choice.result
  // A situation that continues: remembered here, opened when the player closes
  // this scene, so the words of one are never on screen with the choices of the
  // next.
  const next = choice.effects.find((e) => e.k === 'then')
  pending.then = next && next.k === 'then' ? next.encounterId : null
  // A mission or puzzle started by the encounter takes the screen; otherwise we
  // stay on the encounter so the result can be read.
  if (s.activeMission) {
    s.pendingEncounter = null
    s.screen = 'mission'
  }
  checkLoss(s)
}

// ---------------------------------------------------------------- missions

function missionFromFlavour(
  s: ExpeditionState,
  flavour: 'boarding' | 'ruins' | 'explore',
): MissionSpec {
  const difficulty = Math.max(1, Math.min(3, 1 + s.darkening))
  if (flavour === 'explore') {
    const objective: Objective = { k: 'collect', count: 2 }
    return {
      kind: 'exploration',
      objective,
      difficulty,
      enemyScale: 0.4,
      roundLimit: 16,
      rewards: [
        { k: 'resource', id: 'information', amount: 4 },
        { k: 'archive', amount: 1 },
      ],
      briefing: {
        hu: 'Le kell menni, össze kell szedni, és ki kell jönni. A padló nem mindenhol tart.',
        en: 'Go down, gather, and get out. The floor does not hold everywhere.',
      },
    }
  }
  return {
    kind: 'combat',
    objective: { k: 'eliminate' },
    difficulty: flavour === 'ruins' ? Math.min(3, difficulty + 1) : difficulty,
    enemyScale: 1,
    roundLimit: null,
    rewards: [
      { k: 'resource', id: 'credits', amount: 6 },
      { k: 'archive', amount: 1 },
    ],
    aboard: flavour === 'boarding',
    briefing:
      flavour === 'boarding'
        ? {
            hu: 'Már a hajón vannak. A modulok a rácson állnak — ami elpusztul, az az expedíció végéig hiányzik.',
            en: 'They are already aboard. The modules stand on the grid — whatever is destroyed is gone for the rest of the expedition.',
          }
        : {
            hu: 'Nem lehet mellette elmenni. Ki kell tisztítani a helyszínt.',
            en: 'There is no getting past it. The site has to be cleared.',
          },
  }
}

/**
 * Build the battle for a spec at a given seed.
 *
 * Split out from `launchMission` because a landing can be built more than once:
 * the same seed rebuilds the same battlefield from the start, a fresh one deals a
 * different battlefield with the same brief. Both are escape hatches for a board
 * that cannot be finished — see `restartBattle` and `rerollBattle`.
 *
 * The heroes come from `s.heroes`, which is the record kept between missions and
 * is not written to while a battle is running. That is what makes a rebuild
 * honest: it restores exactly the party that landed, wounds and lost cards
 * included, not the one halfway through the fight.
 */
function buildBattle(s: ExpeditionState, spec: MissionSpec, seed: number) {
  // A boarding action puts some of the ship's own modules on the board. Which
  // ones is not a choice: what is installed is what is standing there.
  const atStake = spec.aboard ? Math.max(0, Math.round(dialValue(s.dials, 'boardingStakes'))) : 0
  return startMission({
    installations: s.modules.slice(0, atStake),
    seed,
    difficulty: Math.max(
      1,
      Math.min(3, spec.difficulty + (s.darkening >= 2 ? 1 : 0) + dialValue(s.dials, 'enemyStrength')),
    ),
    objective: spec.objective,
    missionKind: spec.kind,
    flux: missionFlux(s),
    roundLimit: spec.roundLimit,
    heroes: s.heroes,
    enemyScale: (spec.enemyScale ?? 1) * dialValue(s.dials, 'enemyCount'),
  })
}

function launchMission(s: ExpeditionState, spec: MissionSpec): void {
  const seed = s.seed * 977 + s.week * 31 + s.rngStep
  s.rngStep += 1
  s.activeMission = { k: 'battle', nodeId: s.at, spec, battle: buildBattle(s, spec, seed) }
  s.screen = 'mission'
  log(s, { k: 'missionLaunched', briefing: spec.briefing })
}

/**
 * The three ways out of a landing that cannot be finished.
 *
 * They exist because the failure they answer is not the player's fault: a
 * battlefield that generation got wrong, or a state the engine wedged itself
 * into. Making somebody burn out a party card by card because of that is worse
 * than any exploit the buttons open — and the exploit is small, because the brief
 * comes along unchanged: the objective, the difficulty and how many enemies of
 * what kind. Only the ground is redealt.
 */
function rebuildBattle(s: ExpeditionState, fresh: boolean): void {
  const mission = s.activeMission
  if (!mission || mission.k !== 'battle') return
  const seed = fresh ? s.seed * 977 + s.week * 31 + s.rngStep : mission.battle.seed
  if (fresh) s.rngStep += 1
  mission.battle = buildBattle(s, mission.spec, seed)
  s.screen = 'mission'
  log(s, fresh ? { k: 'missionRerolled' } : { k: 'missionRestarted' })
}

/**
 * Settle a landing without playing it out.
 *
 * A victory pays what the brief promised — and for a relic run it counts the
 * relics as carried, because "as if it had gone perfectly" is the whole point.
 * A defeat costs what a defeat costs: the week, the morale, the crew member.
 * Skipping does neither: the site is marked done and the party comes home.
 *
 * All three go through the ordinary mission finish, so nothing about rewards or
 * losses is written twice.
 */
function settleBattle(s: ExpeditionState, as: 'victory' | 'defeat' | 'skip'): void {
  const mission = s.activeMission
  if (!mission || mission.k !== 'battle') return

  if (as === 'skip') {
    const node = mapNode(s.map, mission.nodeId)
    node.resolved = true
    s.activeMission = null
    s.screen = 'starmap'
    log(s, { k: 'missionSkipped' })
    return
  }

  const battle = mission.battle
  if (as === 'victory' && battle.objective.k === 'collect') {
    battle.carried = battle.objective.count
  }
  if (as === 'defeat') {
    // The worst case, and it has to actually be the worst case. Marking the
    // battle lost while the party stands there unhurt cost a couple of morale and
    // nothing else — gentler than really losing, which is not what a button
    // labelled "at full cost" should do. The party falls: they come home at one
    // hit point each, and the ship pays for a casualty like it would have.
    for (const hero of battle.units) {
      if (hero.side === 'hero' && hero.alive) {
        hero.alive = false
        hero.hp = 0
      }
    }
  }
  battle.outcome = as
  battle.phase = 'over'
  battle.pending = null
  battle.heroTurn = null
  log(s, { k: as === 'victory' ? 'missionForcedWin' : 'missionForcedLoss' })
  finishMission(s)
}

/** Back out to the star map, with the node left as it was found. */
function withdrawBeforeLanding(s: ExpeditionState): void {
  const mission = s.activeMission
  if (!mission || mission.k !== 'battle') return
  const node = mapNode(s.map, mission.nodeId)
  node.resolved = false
  s.activeMission = null
  s.pendingEncounter = null
  s.screen = 'starmap'
  log(s, { k: 'missionWithdrawn' })
}

function launchPuzzle(
  s: ExpeditionState,
  kind: PuzzleKind | null,
  difficulty: number,
  rewards: Reward[],
  briefing?: Text,
): void {
  const seed = s.seed * 4093 + s.week * 17 + s.rngStep
  s.rngStep += 1
  const chosen =
    kind && s.puzzleKinds.includes(kind)
      ? kind
      : (createRng(seed).pick(s.puzzleKinds) ?? 'runeDecode')
  s.activeMission = {
    k: 'puzzle',
    nodeId: s.at,
    kind: chosen,
    difficulty,
    rewards,
    puzzle: generatePuzzle(chosen, seed, difficulty, dialValue(s.dials, 'puzzleTries')),
    briefing:
      briefing ?? {
        hu: 'A szerkezet nem támad és nem nyitható erővel. Le kell ülni elé, és megérteni.',
        en: 'The mechanism does not attack and cannot be forced. You have to sit down and understand it.',
      },
  }
  s.screen = 'mission'
  log(s, { k: 'missionLaunched', briefing: s.activeMission.briefing })
}

function applyRewards(s: ExpeditionState, rewards: readonly Reward[]): void {
  for (const reward of rewards) {
    switch (reward.k) {
      case 'resource':
        gain(s, reward.id, reward.amount)
        break
      case 'understanding':
        s.understanding += reward.amount
        log(s, { k: 'understandingGained', amount: reward.amount, total: s.understanding })
        break
      case 'module':
        if (!s.modules.includes(reward.id)) {
          s.modules.push(reward.id)
          log(s, { k: 'moduleInstalled', module: MODULES[reward.id].name })
        }
        break
      case 'archive':
        s.archiveEarned += reward.amount
        break
      case 'revealMap': {
        const revealed = revealAhead(s.map, s.at, reward.columns)
        if (revealed > 0) log(s, { k: 'mapRevealed', columns: reward.columns })
        break
      }
      case 'unlockPuzzle':
        if (!s.puzzleKinds.includes(reward.kind)) s.puzzleKinds.push(reward.kind)
        break
      case 'crewJoin':
        joinCrew(s, reward.count)
        break
    }
  }
}

/**
 * Between missions the ship recovers the heroes' discard piles. Cards LOST stay
 * lost for the whole expedition — that is the attrition that matters, and it is
 * the one the players choose, one card at a time, every time they rest.
 */
function recoverDecks(s: ExpeditionState): void {
  for (const hero of s.heroes) {
    hero.hand = [...hero.hand, ...hero.discard]
    hero.discard = []
  }
}

function finishMission(s: ExpeditionState): void {
  const mission = s.activeMission
  if (!mission) return
  const node = mapNode(s.map, mission.nodeId)

  if (mission.k === 'battle') {
    const result = missionResult(mission.battle)
    s.heroes = result.heroes
    // Whatever they tore apart is gone, win or lose: the briefing promised that,
    // and it is the reason a boarding action is worth defending rather than just
    // surviving.
    for (const lost of result.modulesLost) {
      s.modules = s.modules.filter((id) => id !== lost)
      log(s, { k: 'moduleLost', module: MODULES[lost as ModuleId]?.name ?? { hu: 'modul', en: 'module' } })
    }
    if (result.outcome === 'victory') {
      log(s, { k: 'missionWon' })
      applyRewards(s, mission.spec.rewards)
      node.resolved = true
    } else {
      log(s, { k: 'missionLost' })
      // Withdrawal with losses: wounds, lost time, and often a dead crew member.
      s.week += 1
      s.gateWeeksLeft -= 1
      gain(s, 'morale', -2)
      if (result.casualties > 0) killCrew(s, 1)
      // A fight lost *aboard* costs the ship as well. Everywhere else the hull is
      // in orbit and cannot be scratched by a bad landing; here they were loose
      // in the corridors, and the difficulty dial for encounter risk applies
      // because this is the same kind of damage.
      if (mission.spec.aboard) {
        const damage = Math.max(1, Math.round(4 * dialValue(s.dials, 'encounterRisk')))
        applyHullRisk(s, damage)
        log(s, { k: 'boardingDamage' })
      }
      node.resolved = true
    }
  } else {
    const status = puzzleStatus(mission.puzzle)
    if (status === 'solved') {
      log(s, { k: 'puzzleSolved' })
      applyRewards(s, mission.rewards)
    } else {
      log(s, { k: 'puzzleFailed' })
      gain(s, 'morale', -1)
    }
    node.resolved = true
  }

  recoverDecks(s)
  s.activeMission = null
  updateDarkening(s)
  s.screen = s.pendingEncounter ? 'encounter' : 'starmap'
  checkLoss(s)
}

// ---------------------------------------------------------------- node engage

function engageNode(s: ExpeditionState): void {
  if (s.travel || s.activeMission || s.pendingEncounter) return
  const node = mapNode(s.map, s.at)
  if (node.resolved) return

  switch (node.event.k) {
    case 'mission':
      launchMission(s, node.event.spec)
      break
    case 'puzzle':
      launchPuzzle(s, node.event.kind, node.event.difficulty, node.event.rewards, node.event.briefing)
      break
    case 'encounter':
      openEncounter(s, node.event.encounterId)
      break
    case 'market':
      node.resolved = true
      s.screen = 'market'
      break
    case 'heart':
      s.screen = 'heart'
      break
    case 'none':
      node.resolved = true
      break
  }
}

// ---------------------------------------------------------------- endings

export function availableEndings(s: ExpeditionState): EndingId[] {
  const tier = understandingTier(s.understanding)
  const out: EndingId[] = ['flee', 'blindRuin']
  if (tier >= 1) out.push('witness')
  if (tier >= 2) out.push('intervene')
  if (tier >= 3) out.push('communion')
  // The closing one needs both halves: the Archive must have bought the question
  // (carried in as a flag at launch) and this run must have understood enough to
  // answer it.
  if (tier >= 3 && s.flags.includes('last-question')) out.push('theAnswer')
  return out
}

const ENDING_ARCHIVE: Record<EndingId, number> = {
  flee: 2,
  blindRuin: 1,
  witness: 5,
  intervene: 9,
  communion: 14,
  theAnswer: 20,
}

function chooseEnding(s: ExpeditionState, id: EndingId): void {
  if (!availableEndings(s).includes(id)) return
  s.archiveEarned += ENDING_ARCHIVE[id]
  s.outcome = { k: 'ending', id, understanding: s.understanding }
  s.screen = 'over'
}

// ---------------------------------------------------------------- market

function marketBuy(s: ExpeditionState, index: number): void {
  const node = mapNode(s.map, s.at)
  if (node.event.k !== 'market') return
  const offer = node.event.offers[index]
  if (!offer || offer.bought) return
  if (s.resources.credits < offer.price) return

  gain(s, 'credits', -offer.price)
  offer.bought = true

  const item = offer.item
  if (item.k === 'resource') {
    gain(s, item.id, item.amount)
    log(s, { k: 'bought', label: RESOURCES[item.id].name, price: offer.price })
  } else if (item.k === 'module') {
    if (!s.modules.includes(item.id)) s.modules.push(item.id)
    log(s, { k: 'bought', label: MODULES[item.id].name, price: offer.price })
    log(s, { k: 'moduleInstalled', module: MODULES[item.id].name })
  } else {
    s.crew.push({ ...item.member, station: null, alive: true, weeksAboard: 0 })
    log(s, { k: 'crewJoined', name: item.member.name })
  }
}

// ---------------------------------------------------------------- reducer

export function expeditionStep(
  previous: ExpeditionState,
  action: ExpeditionAction,
): ExpeditionState {
  if (previous.outcome) return previous
  const s = clone(previous)

  switch (action.k) {
    case 'setPower': {
      if (s.activeMission) break
      const def = SYSTEM_ORDER.includes(action.system) ? action.system : null
      if (!def) break
      const desired = Math.max(0, Math.min(action.value, 9))
      const others = powerUsed(s) - s.power[action.system]
      s.power[action.system] = Math.max(0, Math.min(desired, s.reactorOutput - others))
      break
    }

    case 'assignCrew': {
      const member = s.crew.find((c) => c.id === action.crewId)
      if (!member || !member.alive) break
      if (action.station === null) {
        member.station = null
        break
      }
      if (!STATION_ORDER.includes(action.station)) break
      const def = STATIONS[action.station]
      const taken = crewAt(s, action.station).filter((c) => c.id !== member.id).length
      if (taken >= def.slots) break
      member.station = action.station
      break
    }

    case 'startResearch': {
      if (s.research.active) break
      const project = availableProjects(s.research.completed).find((p) => p.id === action.projectId)
      if (!project) break
      if (s.resources.information < project.cost) break
      gain(s, 'information', -project.cost)
      s.research.active = { id: project.id, weeksLeft: project.weeks }
      log(s, { k: 'researchStarted', project: project.name })
      break
    }

    case 'setCourse': {
      if (s.travel || s.activeMission || s.pendingEncounter) break
      const here = mapNode(s.map, s.at)
      const index = here.links.indexOf(action.nodeId)
      if (index < 0) break
      // Speed comes off the engines: more power, fewer weeks.
      const base = here.linkWeeks[index] ?? 2
      const weeks = travelWeeks(s, base)
      s.travel = { to: action.nodeId, weeksLeft: weeks }
      log(s, { k: 'courseSet', node: mapNode(s.map, action.nodeId).name, weeks })
      s.screen = 'starmap'
      break
    }

    case 'advanceWeek':
      advanceWeek(s)
      break

    case 'openScreen':
      if (s.activeMission && action.screen !== 'mission') break
      if (s.pendingEncounter && action.screen !== 'encounter') break
      s.screen = action.screen
      break

    case 'engageNode':
      engageNode(s)
      break

    case 'encounterChoose': {
      const pending = s.pendingEncounter
      if (!pending || pending.chosen !== null) break
      const def = encounter(pending.id)
      const choice = def.choices[action.index]
      if (!choice) break
      if (!choiceAvailable(s, choice) || !choiceAffordable(s, choice)) break
      // Only proposed. `encounterConfirm` is what takes it — see PendingEncounter.
      pending.chosen = action.index
      pending.payment = []
      break
    }

    case 'encounterCancel': {
      const pending = s.pendingEncounter
      if (!pending || pending.resolvedText) break
      pending.chosen = null
      pending.payment = []
      break
    }

    case 'encounterPayCard': {
      const pending = s.pendingEncounter
      if (!pending || pending.chosen === null || pending.resolvedText) break
      const def = encounter(pending.id)
      const choice = def.choices[pending.chosen]
      const cost = choice ? cardCostOf(choice) : null
      if (!cost) break
      const token = `${action.heroClass}:${action.cardId}`
      if (pending.payment.includes(token)) {
        pending.payment = pending.payment.filter((t) => t !== token)
        break
      }
      if (pending.payment.length >= cost.count) break
      if (!card(action.cardId).symbols.includes(cost.symbol)) break
      pending.payment.push(token)
      break
    }

    case 'encounterConfirm': {
      const pending = s.pendingEncounter
      if (!pending || pending.chosen === null || pending.resolvedText) break
      const def = encounter(pending.id)
      const choice = def.choices[pending.chosen]
      const cost = choice ? cardCostOf(choice) : null
      if (cost && pending.payment.length < cost.count) break
      resolveEncounter(s)
      break
    }

    case 'encounterClose': {
      const pending = s.pendingEncounter
      if (!pending || !pending.resolvedText) break
      const next = pending.then
      s.pendingEncounter = null
      if (next && !s.activeMission) {
        openEncounter(s, next)
        break
      }
      s.screen = s.activeMission ? 'mission' : 'starmap'
      break
    }

    case 'battleAction': {
      const mission = s.activeMission
      if (!mission || mission.k !== 'battle') break
      mission.battle = battleStep(mission.battle, action.action)
      break
    }

    case 'puzzleMove': {
      const mission = s.activeMission
      if (!mission || mission.k !== 'puzzle') break
      mission.puzzle = applyPuzzleMove(mission.puzzle, action.move)
      break
    }

    case 'missionFinish':
      finishMission(s)
      break

    case 'restartBattle':
      rebuildBattle(s, false)
      break

    case 'rerollBattle':
      rebuildBattle(s, true)
      break

    case 'withdrawBeforeLanding':
      withdrawBeforeLanding(s)
      break

    case 'settleBattle':
      settleBattle(s, action.as)
      break

    case 'dialSet': {
      const level = Math.max(1, Math.min(5, Math.round(action.level)))
      if (s.dials[action.dial] !== level) {
        s.dials[action.dial] = level
        log(s, { k: 'dialSet', dial: action.dial, level })
      }
      break
    }

    case 'marketBuy':
      marketBuy(s, action.index)
      break

    case 'chooseEnding':
      chooseEnding(s, action.endingId)
      break

    case 'abandon':
      s.outcome = { k: 'lost', reason: 'abandoned' }
      s.screen = 'over'
      break
  }

  s.reactorOutput = reactorOutput(s)
  checkLoss(s)
  return s
}

// ---------------------------------------------------------------- queries

/** Can the players end the week right now? */
export function canAdvanceWeek(s: ExpeditionState): boolean {
  return !s.activeMission && !s.pendingEncounter && !s.outcome && s.gateWeeksLeft > 0
}

/** Is the node the ship is sitting on still offering something? */
export function nodeEngageable(s: ExpeditionState): boolean {
  if (s.travel || s.activeMission || s.pendingEncounter) return false
  const node: MapNode = mapNode(s.map, s.at)
  if (node.event.k === 'none' || node.event.k === 'heart') return false
  return !node.resolved
}

/** Is the mission over and waiting to be wrapped up? */
export function missionSettled(s: ExpeditionState): boolean {
  const mission = s.activeMission
  if (!mission) return false
  if (mission.k === 'battle') return mission.battle.phase === 'over'
  return puzzleStatus(mission.puzzle) !== 'open'
}
