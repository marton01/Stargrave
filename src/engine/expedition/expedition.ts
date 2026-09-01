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
import {
  CREW_TRAITS,
  LEARNABLE_TRAITS,
  LOYALTY_BREAKS,
  LOYALTY_RECOVERS,
  crewRank,
  loyaltyBand,
  generateCrewMember,
  rankBonus,
  traitBonus,
} from '../../content/crew'
import type { CrewMember, CrewTraitId } from '../../content/crew'
import { BASE_MENTEES, heroPerk, perkAvailable, perksOf } from '../../content/advance'
import type { PerkEffect } from '../../content/advance'
import { RELICS, relic, relicFits } from '../../content/relics'
import type { RelicEffect } from '../../content/relics'
import { DIRECTIVE_DEFS, directiveDef } from '../../content/directives'
import type { DirectiveContext, DirectiveKind } from '../../content/directives'
import { HERO_CLASSES } from '../../content/heroes'
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
import { encounter, encountersFor, findEncounter } from '../../content/encounters'
import type { Encounter } from '../../content/encounters'
import { ABOARD_EVENTS } from '../../content/aboard'
import { dialValue, normaliseDials } from '../../content/difficulty'
import type { DialId } from '../../content/difficulty'
import type { ChoiceRequirement, EncounterChoice, EncounterEffect } from '../../content/encounters'
import { availableProjects, researchProject, understandingTier } from '../../content/research'
import { watchDuty } from '../../content/watch'
import { card, cardsOfClass } from '../../content/cards'
import { generatePuzzle, puzzleStatus, applyPuzzleMove, STARTING_PUZZLE_KINDS } from '../puzzles/index'
import { generateRuneLine, press, taskStatus } from '../task/runeline'
import type { PuzzleKind, PuzzleMove } from '../puzzles/types'
import { missionResult, startMission, step as battleStep } from '../battle'
import type { Action as BattleAction, CarriedHero } from '../battle'
import { KIND_TAGS, LENGTHS, generateStarMap, mapNode, revealAhead } from './starmap'
import type {
  ArchiveState,
  Debt,
  Directive,
  ProposedAction,
  EndingId,
  ExpeditionEvent,
  ExpeditionLength,
  ExpeditionState,
  HeroRecord,
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
  /**
   * Press one rune of a split task.
   *
   * Which runes a player may press depends on their seat — see
   * engine/session/permissions.ts. At one keyboard that is everybody's.
   */
  | { k: 'taskPress'; rune: number }
  /** Set this hero's duty for the week. Theirs alone — see content/watch.ts. */
  | { k: 'setWatch'; hero: HeroClassId; duty: string }
  /**
   * Ask the table for something irreversible, and agree to somebody else's ask.
   *
   * Used only when more than one person is playing on more than one machine. See
   * `needsSeconding` for why, and for the short list of what goes through it.
   */
  | { k: 'propose'; action: ProposedAction; by: number }
  | { k: 'second'; by: number }
  | { k: 'dropProposal' }
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
  /**
   * One player's own decisions. Each of these belongs to exactly one of the two,
   * and the other cannot take it: buying a perk with marks the other did not
   * earn, putting on a relic, taking a crew member under your wing.
   */
  | { k: 'buyPerk'; hero: HeroClassId; perkId: string }
  | { k: 'attuneRelic'; hero: HeroClassId; relicId: string }
  | { k: 'stowRelic'; hero: HeroClassId; relicId: string }
  | { k: 'setMentor'; crewId: string; hero: HeroClassId | null }
  /** Sell a relic at a trading post. */
  | { k: 'sellRelic'; relicId: string }
  /** Read the Heart before deciding anything there. Once only. */
  | { k: 'readHeart' }
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

// ------------------------------------------------ modules, relics and perks
//
// Three sources of the same kinds of bonus, and they all have to be summed in
// one place. When modules were the only source, `moduleTotal` was enough; with
// relics on the heroes and perks under them, three separate additions in three
// separate functions is exactly how a bonus quietly stops working. Everything
// that asks "how much flux / how many wards / how far do the sensors see" goes
// through `shipBonus` now.

/** Fields a module, a relic and a perk can all contribute to. */
type BonusField =
  | 'flux'
  | 'wards'
  | 'sensorRange'
  | 'attention'
  | 'attunements'
  | 'research'
  | 'repair'
  | 'moraleTarget'
  | 'bondRange'

/** The relics actually being worn — the only ones that do anything. */
export function attunedRelics(s: ExpeditionState): string[] {
  return party(s).flatMap((hero) => s.heroRecords[hero].attuned)
}

function relicEffects(s: ExpeditionState): RelicEffect[] {
  return attunedRelics(s).map((id) => relic(id).effect)
}

function perkEffects(s: ExpeditionState, hero?: HeroClassId): PerkEffect[] {
  const heroes = hero ? [hero] : party(s)
  return heroes.flatMap((h) => s.heroRecords[h].perks.map((id) => heroPerk(id).effect))
}

/**
 * Everything the ship has that adds to `field`: modules, worn relics, and both
 * heroes' perks.
 *
 * `bondRange` is the one exception, because it is a distance rather than a sum —
 * see `bondRange()`.
 */
export function shipBonus(s: ExpeditionState, field: BonusField): number {
  let total = 0
  for (const id of s.modules) total += numberField(MODULES[id], field)
  for (const effect of relicEffects(s)) total += numberField(effect, field)
  for (const effect of perkEffects(s)) total += numberField(effect, field)
  return total
}

/**
 * One numeric field of a module, relic or perk effect, or zero.
 *
 * The three shapes overlap but are not identical — a perk has no `moraleTarget`,
 * a relic has no `attunements` — and this is what lets one summing function read
 * all three without either a cast that hides a typo or three near-identical
 * loops.
 */
function numberField(source: object, field: string): number {
  const value = (source as Record<string, unknown>)[field]
  return typeof value === 'number' ? value : 0
}

/**
 * Every hero class there is, in a fixed order, so nothing depends on object key
 * order. This is the catalogue — for who is actually on a given expedition, ask
 * `party`.
 */
export const HERO_ORDER: HeroClassId[] = ['runesmith', 'echoreader', 'cantor', 'surveyor']

/**
 * The heroes on this expedition, in seat order.
 *
 * Read off `s.heroes`, which is the record of the party the ship actually
 * carries. Everything that used to say "both of them" says this instead: with
 * two people at one keyboard it is the same two classes it always was, and with
 * three or four players it is however many landed.
 */
export function party(s: ExpeditionState): HeroClassId[] {
  return s.heroes.map((h) => h.heroClass)
}

/** How many relics this hero may wear at once. */
export function attunementSlots(s: ExpeditionState, hero: HeroClassId): number {
  let slots = 1
  for (const id of s.modules) slots += MODULES[id].attunements ?? 0
  for (const effect of perkEffects(s, hero)) slots += effect.attunements ?? 0
  return slots
}

/**
 * This hero's maximum hit points.
 *
 * The two class values used to be written out as `heroClass === 'runesmith' ? 12
 * : 8` in three places, which is fine until a perk can change one of them. Now
 * there is one answer, and the Medbay, the battle and the console all ask it.
 */
export function heroMaxHp(s: ExpeditionState, hero: HeroClassId): number {
  let hp = HERO_CLASSES[hero].hp
  for (const effect of perkEffects(s, hero)) hp += effect.heroHp ?? 0
  for (const id of s.heroRecords[hero].attuned) hp += relic(id).effect.heroHp ?? 0
  return hp
}

/** Bond range in tiles: the widest thing anybody is wearing or has learned. */
export function bondRange(s: ExpeditionState): number {
  let range = 2
  for (const effect of relicEffects(s)) range = Math.max(range, effect.bondRange ?? 0)
  for (const effect of perkEffects(s)) range = Math.max(range, effect.bondRange ?? 0)
  return range
}

/** Crew this hero may have under their wing. */
export function mentorLimit(s: ExpeditionState, hero: HeroClassId): number {
  let limit = BASE_MENTEES
  for (const effect of perkEffects(s, hero)) limit += effect.mentees ?? 0
  return limit
}

export function menteesOf(s: ExpeditionState, hero: HeroClassId): CrewMember[] {
  return livingCrew(s).filter((c) => c.mentor === hero)
}

/** A blank private record, for a new expedition or an older save. */
export function newHeroRecord(): HeroRecord {
  return { marks: 0, marksEarned: 0, perks: [], attuned: [] }
}

/**
 * One record per class, whether or not that class is on this expedition.
 *
 * Keyed by every class rather than by the party, because the party can be two of
 * four and a lookup for somebody who is not aboard should give an empty record
 * rather than undefined.
 */
export function blankHeroRecords(): Record<HeroClassId, HeroRecord> {
  return Object.fromEntries(HERO_ORDER.map((id) => [id, newHeroRecord()])) as Record<
    HeroClassId,
    HeroRecord
  >
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
  return crewAt(s, station).reduce((sum, c) => sum + crewStrengthAt(c, station), 0)
}

/**
 * What one person is worth on one station.
 *
 * Two for the right speciality, one for anybody else, plus the rank, plus the
 * station traits — and the traits ONLY where the speciality is at home.
 *
 * That last clause is the whole point of this function existing separately, and
 * it was the bug a tester found by building a spreadsheet of every speciality on
 * every station: the traits were being added everywhere, so a veteran engineer
 * outproduced a scientist in the Lab, a *restless* engineer raised the morale
 * target in the Sanctum, and two navigators on the same station gave different
 * numbers for no reason the interface ever showed. Every trait that touches a
 * station says "on their own station" now, and this is where that is true.
 */
export function crewStrengthAt(c: CrewMember, station: StationId): number {
  const home = c.speciality === STATIONS[station].speciality
  const traits = home
    ? c.traits.reduce((n, t) => n + (CREW_TRAITS[t].station ?? 0), 0)
    : 0
  // Time served counts anywhere: a rank is the only way a body that is not a
  // specialist ever becomes good at a station — see content/crew.ts.
  return Math.max(1, (home ? 2 : 1) + traits + rankBonus(c))
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
    Math.max(0, traitBonus(crewAt(s, 'lab'), 'research')) +
    shipBonus(s, 'research')
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
  return (
    1 +
    Math.floor(s.power.forge / 2) +
    Math.floor(stationStrength(s, 'forge') / 2) +
    shipBonus(s, 'repair')
  )
}

/**
 * Columns of star map the Sensors reveal each week.
 *
 * The one station where the speciality used to make no difference at all: the
 * columns came from the power, and the person only switched it on. It was
 * documented as an exception, and it was still the odd column out in a table a
 * tester filled in by hand — every other station rewards the right hands. A
 * navigator reading the returns gets one column more, on the same one-slot
 * pattern as the Archive and the Armoury.
 */
export function sensorOutput(s: ExpeditionState): number {
  if (!stationActive(s, 'sensors')) return 0
  const navigator = stationStrength(s, 'sensors') >= 2 ? 1 : 0
  return s.power.sensors + navigator + shipBonus(s, 'sensorRange')
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

/**
 * What stands on the ship and simply produces, every week, of one resource.
 *
 * Modules and worn relics both, because a relic that grows food is a module made
 * of stone: the same promise, and it has to be honoured through the same code
 * path or one of the two will quietly stop paying out.
 */
export function weeklyFromModules(s: ExpeditionState, id: ResourceId): number {
  const fromModules = s.modules.reduce((sum, m) => {
    const weekly = MODULES[m].weekly
    return sum + (weekly && weekly.id === id ? weekly.amount : 0)
  }, 0)
  const fromRelics = attunedRelics(s).reduce((sum, r) => {
    const weekly = relic(r).effect.weekly
    return sum + (weekly && weekly.id === id ? weekly.amount : 0)
  }, 0)
  return fromModules + fromRelics
}

/** Weeks a journey of `base` weeks takes at the current engine power. */
export function travelWeeks(s: ExpeditionState, base: number): number {
  return Math.max(1, base - Math.max(0, s.power.engines - 1))
}

/**
 * Can the ship set a course at all?
 *
 * The first point of engine power buys exactly this, and it had to buy
 * something: the second point is the first one that cuts a week and the third is
 * the first one that costs fuel, so a single point used to do nothing whatsoever
 * — the ship travelled at the same speed for the same fuel with the engines
 * completely unpowered. A tester noticed the fuel figure was identical at one and
 * at two and went looking for the difference; there wasn't one.
 *
 * Now nothing moves on a cold reactor line. Which also means the Darkening can
 * take the ship's legs away by shrinking the reactor, and that is a consequence
 * worth having rather than a rule to hide.
 */
export function canSetCourse(s: ExpeditionState): boolean {
  return s.power.engines > 0
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
  return s.power.shields + shipBonus(s, 'wards')
}

/** Life support the crew needs, and what it has. */
export function lifeSupportStatus(s: ExpeditionState): { has: number; needs: number } {
  return { has: s.power.lifeSupport, needs: lifeSupportNeeded(livingCrew(s).length) }
}

/** Flux the rune core will hand the landing party. */
export function missionFlux(s: ExpeditionState): number {
  return Math.max(
    1,
    s.power.runeCore +
      armouryOutput(s) +
      shipBonus(s, 'flux') +
      (s.watchFlux ?? 0) +
      dialValue(s.dials, 'flux'),
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

// ---------------------------------------------------- marks and advancement

/**
 * Give one of the two players advancement marks, with the reason attached.
 *
 * The reason is not decoration. Two currencies earned in the same way are one
 * currency with two names, so the log has to say what each side was paid for —
 * it is how the players learn that he is paid for the ship coming home whole and
 * she is paid for working things out.
 */
function grantMarks(s: ExpeditionState, hero: HeroClassId, amount: number, reason: Text): void {
  if (amount <= 0) return
  // Nobody is paid for a run they were not on. Three of the four sources are
  // written for one class in particular, and with a party of two the other two
  // classes are at home — their records must stay empty rather than quietly
  // filling up with marks no console can ever spend.
  if (!party(s).includes(hero)) return
  const record = s.heroRecords[hero]
  record.marks += amount
  record.marksEarned += amount
  log(s, { k: 'heroMarks', hero, amount, reason })
}

const MARK_REASONS = {
  landing: { hu: 'megnyert partraszállás', en: 'a landing won' },
  intact: { hu: 'egyetlen modul sem pusztult el', en: 'not one module lost' },
  mechanism: { hu: 'megfejtett szerkezet', en: 'a mechanism solved' },
  herald: { hu: 'a Hírnök elhallgatott', en: 'the Herald silenced' },
  directive: { hu: 'teljesített parancs', en: 'an order carried out' },
  mentees: { hu: 'a tanítványok munkája', en: 'the work of your mentees' },
  unhurt: { hu: 'mindenki a saját lábán jött vissza', en: 'everybody walked back' },
  scouted: { hu: 'felderített út', en: 'the road scouted' },
} satisfies Record<string, Text>

function buyPerk(s: ExpeditionState, hero: HeroClassId, perkId: string): void {
  const record = s.heroRecords[hero]
  const perk = perksOf(hero).find((p) => p.id === perkId)
  if (!perk || !perkAvailable(perk, record.perks)) return
  if (record.marks < perk.cost) return
  record.marks -= perk.cost
  record.perks.push(perk.id)
  log(s, { k: 'perkBought', hero, perk: perk.name })
  // A perk that hands over a card puts it into that hero's deck at once, the
  // same way a research project does.
  if (perk.effect.card) {
    const carried = s.heroes.find((h) => h.heroClass === hero)
    if (carried && !carried.hand.includes(perk.effect.card)) carried.hand.push(perk.effect.card)
  }
}

// ---------------------------------------------------------------- relics

/** Draw a relic this run has not seen yet. Deterministic, like everything else. */
function drawRelic(s: ExpeditionState): string | null {
  const held = new Set(s.relics)
  const pool = RELICS.filter((r) => !held.has(r.id)).map((r) => r.id)
  if (pool.length === 0) return null
  return rngFor(s).pick(pool) ?? null
}

function findRelic(s: ExpeditionState, id?: string): void {
  const chosen = id && !s.relics.includes(id) ? id : drawRelic(s)
  if (!chosen) {
    // Everything is already aboard. Pay for the find rather than drop it.
    gain(s, 'credits', 8)
    return
  }
  s.relics.push(chosen)
  s.tally.relicsFound += 1
  log(s, { k: 'relicFound', relic: relic(chosen).name })
}

function attuneRelic(s: ExpeditionState, hero: HeroClassId, relicId: string): void {
  if (!s.relics.includes(relicId)) return
  if (!relicFits(relicId, hero)) return
  const record = s.heroRecords[hero]
  if (record.attuned.includes(relicId)) return
  // Worn by somebody else? Then it is not free to take: they have to put it down
  // first. One console must never be able to take things off another.
  for (const other of party(s)) {
    if (s.heroRecords[other].attuned.includes(relicId)) return
  }
  if (record.attuned.length >= attunementSlots(s, hero)) return
  record.attuned.push(relicId)
  log(s, { k: 'relicAttuned', relic: relic(relicId).name, hero })
}

function stowRelic(s: ExpeditionState, hero: HeroClassId, relicId: string): void {
  const record = s.heroRecords[hero]
  if (!record.attuned.includes(relicId)) return
  record.attuned = record.attuned.filter((id) => id !== relicId)
  log(s, { k: 'relicStowed', relic: relic(relicId).name })
}

function sellRelic(s: ExpeditionState, relicId: string): void {
  if (s.screen !== 'market') return
  if (!s.relics.includes(relicId)) return
  // Only what nobody is wearing.
  for (const hero of party(s)) {
    if (s.heroRecords[hero].attuned.includes(relicId)) return
  }
  const def = relic(relicId)
  s.relics = s.relics.filter((id) => id !== relicId)
  gain(s, 'credits', def.value)
  log(s, { k: 'relicSold', relic: def.name, price: def.value })
}

// -------------------------------------------------------- attention, Herald
//
// The one pressure in this game the players make themselves.
//
// The Gate's countdown is the same every run, and once you know it you stop
// feeling it. Attention is not: it is a number the expedition writes with its
// own hands. Fight, force mechanisms, run the engines hot, and something starts
// walking up the corridor towards you. Go quietly and it never wakes.
//
// It is deliberately not a hidden meter. It is on the top bar from the first
// point, because a threat you cannot see coming is not tension but a trap.

/** Attention at which the Herald sets out. */
export const HERALD_WAKES_AT = 8

/** What a week does to the attention, before anything the ship goes and does. */
export function weeklyAttention(s: ExpeditionState): number {
  const scale = dialValue(s.dials, 'attention')
  if (scale <= 0) return 0
  let loud = 0
  // Engines above cruise are the loudest thing the ship does by itself.
  if (s.travel && s.power.engines >= 3) loud += 1
  const quiet = shipBonus(s, 'attention')
  // A week spent sitting still at a settled node is how you cool off.
  const resting = !s.travel && mapNode(s.map, s.at).resolved ? -1 : 0
  return Math.round(loud * scale) + quiet + resting
}

function changeAttention(s: ExpeditionState, amount: number): void {
  if (amount === 0) return
  const before = s.attention
  s.attention = Math.max(0, Math.min(20, before + amount))
  const delta = s.attention - before
  if (delta > 0) log(s, { k: 'attentionRose', amount: delta, total: s.attention })
  else if (delta < 0) log(s, { k: 'attentionFell', amount: -delta, total: s.attention })
}

/** Something loud just happened. Scaled by the dial, and off at level one. */
function raiseAttention(s: ExpeditionState, amount: number): void {
  const scale = dialValue(s.dials, 'attention')
  if (scale <= 0) return
  changeAttention(s, Math.max(1, Math.round(amount * scale)))
}

/** Where the ship is, in columns from the Gate. Under way, where it is heading. */
export function shipColumn(s: ExpeditionState): number {
  return mapNode(s.map, s.travel ? s.travel.to : s.at).column
}

/** Columns between the Herald and the ship, or null while it sleeps. */
export function heraldDistance(s: ExpeditionState): number | null {
  if (!s.herald) return null
  return Math.abs(s.herald.column - shipColumn(s))
}

/**
 * Wake it, move it, and let it catch the ship if it can.
 *
 * It moves along columns rather than along the roads, because it is not using
 * the roads: it comes up the corridor. That also makes it readable — "two
 * columns away" is something a player can act on — and it means running deeper
 * does not shake it off, which is the point of the whole thing.
 */
function runHerald(s: ExpeditionState): void {
  if (dialValue(s.dials, 'attention') <= 0) return
  if (s.flags.includes('herald-silenced')) return

  if (!s.herald) {
    if (s.attention < HERALD_WAKES_AT) return
    // It sets out from ahead, deeper in, three columns off — far enough that the
    // first sighting is a warning rather than an ambush.
    s.herald = { column: Math.min(s.map.columns - 1, shipColumn(s) + 3), hunts: 0 }
    log(s, { k: 'heraldWoke' })
    return
  }

  const target = shipColumn(s)
  const steps = s.attention >= HERALD_WAKES_AT + 4 ? 2 : 1
  for (let i = 0; i < steps && s.herald.column !== target; i++) {
    s.herald.column += Math.sign(target - s.herald.column)
  }
  const away = Math.abs(s.herald.column - target)
  log(s, { k: 'heraldMoved', columnsAway: away })
  if (away === 0) heraldCatches(s)
}

/** The fight it came for. A boarding action, and the hardest one in the game. */
function heraldCatches(s: ExpeditionState): void {
  if (s.activeMission) return
  const hunts = s.herald?.hunts ?? 0
  s.tally.heraldsFaced += 1
  log(s, { k: 'heraldCaught' })
  launchMission(s, {
    kind: 'combat',
    objective: { k: 'eliminate' },
    // Knowing what it is takes a level off. That is what the research buys.
    difficulty: Math.max(1, Math.min(3, 3 + hunts - (s.flags.includes('knows-herald') ? 1 : 0))),
    enemyScale: 1.2 + hunts * 0.2,
    roundLimit: null,
    aboard: true,
    herald: true,
    rewards: [
      { k: 'understanding', amount: 3 },
      { k: 'archive', amount: 4 },
      { k: 'resource', id: 'credits', amount: 20 },
      { k: 'relic' },
    ],
    briefing: {
      hu:
        'A Hírnök a zsilipnél van. Nem tárgyal és nem kerülhető ki: azért jött, mert hallotta, ' +
        'hogy itt vagytok. Ha megállítjátok, elhallgat — és a Csillagsír nem küld másikat.',
      en:
        'The Herald is at the airlock. It does not negotiate and cannot be avoided: it came ' +
        'because it heard you. Stop it and it falls silent — and the Stargrave sends no other.',
    },
  })
}

// ---------------------------------------------------------------- directives

export function directiveLabel(d: Directive): Text {
  const def = directiveDef(d.kind)
  const ask = def.ask(d.target)
  return { hu: `${def.name.hu}: ${ask.hu}`, en: `${def.name.en}: ${ask.en}` }
}

/** Which kinds are judged only when the deadline arrives, not before. */
const AT_DEADLINE: DirectiveKind[] = ['morale', 'stock']

export function directiveAtDeadline(kind: DirectiveKind): boolean {
  return AT_DEADLINE.includes(kind)
}

/** How far along an order is, in the units it asks for. */
export function directiveProgress(s: ExpeditionState, d: Directive): number {
  switch (d.kind) {
    case 'clearSites':
      return s.tally.landingsWon - d.startedAt
    case 'solve':
      return s.tally.puzzlesSolved - d.startedAt
    case 'research':
      return s.tally.researchDone - d.startedAt
    case 'relics':
      return s.relics.length
    case 'understand':
      return s.understanding
    case 'depth':
      return shipColumn(s)
    case 'morale':
      return s.resources.morale
    case 'stock':
      return s.resources.food
  }
}

/** What the running count stood at when the order was issued. */
function directiveStart(s: ExpeditionState, kind: DirectiveKind): number {
  switch (kind) {
    case 'clearSites':
      return s.tally.landingsWon
    case 'solve':
      return s.tally.puzzlesSolved
    case 'research':
      return s.tally.researchDone
    default:
      return 0
  }
}

function directiveContext(s: ExpeditionState): DirectiveContext {
  const column = shipColumn(s)
  return {
    week: s.week,
    depth: column / Math.max(1, s.map.columns - 1),
    columns: s.map.columns,
    column,
    relics: s.relics.length,
    understanding: s.understanding,
    puzzleKinds: s.puzzleKinds.length,
  }
}

function directiveReward(kind: DirectiveKind, target: number): Reward[] {
  const base: Reward[] = [
    { k: 'archive', amount: 2 },
    { k: 'heroXp', amount: 2 },
  ]
  switch (kind) {
    case 'understand':
      return [...base, { k: 'resource', id: 'information', amount: 8 }]
    case 'relics':
      return [...base, { k: 'resource', id: 'credits', amount: 8 + target * 4 }]
    case 'depth':
      return [...base, { k: 'resource', id: 'fuel', amount: 8 }]
    case 'morale':
      return [...base, { k: 'resource', id: 'credits', amount: 12 }]
    case 'stock':
      return [...base, { k: 'resource', id: 'food', amount: 10 }]
    case 'solve':
      return [
        ...base,
        { k: 'understanding', amount: 1 },
        { k: 'resource', id: 'information', amount: 6 },
      ]
    case 'research':
      return [...base, { k: 'resource', id: 'information', amount: 10 }]
    case 'clearSites':
      return [...base, { k: 'resource', id: 'credits', amount: 14 }]
  }
}

/**
 * Top the live orders up to what the dial asks for.
 *
 * Targets are always measured from where the run stands, so an order can never
 * arrive already satisfied — which reads as a bug even when the arithmetic is
 * right — and never asks for something out of reach in the weeks it allows.
 */
function issueDirectives(s: ExpeditionState): void {
  const wanted = Math.round(dialValue(s.dials, 'directives'))
  if (s.gateWeeksLeft <= 3) return

  const context = directiveContext(s)
  // Orders are dealt round the table, so everybody has one of their own.
  const seats = party(s)
  while (s.directives.filter((d) => d.state === 'open').length < wanted) {
    const live = s.directives.filter((d) => d.state === 'open').map((d) => d.kind)
    const pool = DIRECTIVE_DEFS.filter((def) => !live.includes(def.kind))
    const def = rngFor(s).pick(pool)
    if (!def) return

    // Every target is measured from where the run stands. An order that arrives
    // already satisfied reads as a bug even when the arithmetic is defensible,
    // and it pays out for nothing — including the "have this much at the
    // deadline" kinds, which have to ask for a little more than the ship has
    // rather than for what it is already sitting on.
    let target = def.target(context.depth)
    if (def.kind === 'relics') target = context.relics + target
    if (def.kind === 'understand') target = Math.max(target, context.understanding + 3)
    if (def.kind === 'depth') target = Math.min(s.map.columns - 1, context.column + 2)
    if (def.kind === 'morale') {
      target = Math.min(resourceMax(s, 'morale'), Math.max(target, s.resources.morale + 1))
    }
    if (def.kind === 'stock') {
      target = Math.min(resourceMax(s, 'food'), Math.max(target, s.resources.food + 6))
    }

    const owner: HeroClassId =
      def.owner === 'either' ? seats[s.directiveCount % seats.length]! : def.owner
    const directive: Directive = {
      id: `d${s.directiveCount}`,
      kind: def.kind,
      owner,
      target,
      startedAt: directiveStart(s, def.kind),
      due: s.week + Math.min(def.weeks(context.depth), Math.max(2, s.gateWeeksLeft - 1)),
      reward: directiveReward(def.kind, target),
      state: 'open',
    }
    s.directiveCount += 1
    s.directives.push(directive)
    log(s, {
      k: 'directiveIssued',
      label: directiveLabel(directive),
      weeks: directive.due - s.week,
    })
  }
}

/** Settle every order that has come good or come due. */
function checkDirectives(s: ExpeditionState): void {
  for (const d of s.directives) {
    if (d.state !== 'open') continue
    const met = directiveProgress(s, d) >= d.target
    const atDeadline = directiveAtDeadline(d.kind)

    if (met && !atDeadline) {
      d.state = 'done'
      log(s, { k: 'directiveDone', label: directiveLabel(d) })
      applyRewards(s, d.reward, d.owner)
      continue
    }
    if (s.week < d.due) continue
    if (met) {
      d.state = 'done'
      log(s, { k: 'directiveDone', label: directiveLabel(d) })
      applyRewards(s, d.reward, d.owner)
    } else {
      d.state = 'failed'
      log(s, { k: 'directiveFailed', label: directiveLabel(d) })
      // Home is disappointed, and the crew hears about it — except when the
      // order was ABOUT morale. Charging morale for failing to hold morale up is
      // a loop that closes on itself: the ship sags, the order fails, the ship
      // sags further, and nothing the players do can catch it. Home can be
      // disappointed without the crew being punished twice for the same thing.
      if (d.kind !== 'morale') gain(s, 'morale', -2)
    }
  }
}

// ------------------------------------------------------------- crew growth

/**
 * A week of work, for everybody who did any.
 *
 * Only crew on a station that actually ran: standing on an unpowered station is
 * not experience. Mentored crew learn twice as fast, which is the whole of what
 * mentoring buys them — the mentor is paid separately, out of what they do once
 * they are any good.
 */
function crewWorkWeek(s: ExpeditionState): void {
  for (const member of livingCrew(s)) {
    const station = member.station
    if (!station || !stationActive(s, station as StationId)) continue
    const before = crewRank(member)
    member.xp += member.mentor ? 2 : 1
    const after = crewRank(member)
    if (after === before) continue
    log(s, { k: 'crewPromoted', name: member.name, rank: after })
    // The master rank comes with something learned, so a long posting leaves a
    // mark on the person rather than only on a number.
    if (after === 3) {
      const options = LEARNABLE_TRAITS.filter((id) => !member.traits.includes(id))
      const learned = rngFor(s).pick(options)
      if (learned) {
        member.traits.push(learned)
        log(s, { k: 'crewLearned', name: member.name, trait: CREW_TRAITS[learned].name })
      }
    }
  }
}

function setMentor(s: ExpeditionState, crewId: string, hero: HeroClassId | null): void {
  const member = s.crew.find((c) => c.id === crewId)
  if (!member || !member.alive) return
  if (hero === null) {
    member.mentor = null
    return
  }
  if (member.mentor === hero) return
  // Already somebody's. The other console has to let them go first — one player
  // must never be able to take something off the other one's screen.
  if (member.mentor !== null) return
  if (menteesOf(s, hero).length >= mentorLimit(s, hero)) return
  member.mentor = hero
  log(s, { k: 'mentorTaken', name: member.name, hero })
}

/** Marks a mentor earns from the people they trained, when a landing is won. */
function menteeMarks(s: ExpeditionState): void {
  for (const hero of party(s)) {
    const trained = menteesOf(s, hero).filter((c) => crewRank(c) >= 2).length
    if (trained >= 2) grantMarks(s, hero, 1, MARK_REASONS.mentees)
  }
}

// -------------------------------------------------- the ship's own weeks
//
// The week used to be one click. Power and postings are a standing
// configuration, which is right — and it left "end the week" as the only thing
// four people did on a ship for weeks at a time. Everything that happened
// happened at a place on the map.
//
// Three things here give the week its own life, and they are one system:
//
//   loyalty  — the crew stop being stat blocks. It drifts towards what the ship
//              has actually been like to live on, and at the bottom of it people
//              leave and take things with them.
//   aboard   — situations that happen on the ship, each with ONE player who
//              answers for it while the others say what they think.
//   debts    — consequences with a date on them, so a decision can land three
//              weeks after it was made.
//
// The rule that ties them together: nothing here may ambush anybody. A betrayal
// is preceded by weeks of the crew list saying somebody stopped talking; a debt
// announces itself in the log when it lands and says which decision it came
// from. Consequence, never surprise.

/** Where somebody's loyalty is heading, given how the ship is being run. */
export function loyaltyTarget(s: ExpeditionState, member: CrewMember): number {
  let target = 5
  // The two things everybody aboard can feel.
  target += s.resources.morale >= 8 ? 2 : s.resources.morale >= 5 ? 1 : -2
  if (s.power.lifeSupport < lifeSupportNeeded(livingCrew(s).length)) target -= 2
  if (s.resources.food <= 0) target -= 3

  // Being somebody's responsibility is the single strongest thing on this list.
  // It is also the one the players choose, which is the point.
  if (member.mentor) target += 3
  // Work that was noticed. A rank is the ship saying "you are good at this".
  target += crewRank(member) - 1
  // Who they are.
  for (const trait of member.traits) {
    if (trait === 'devout' || trait === 'brave') target += 1
    if (trait === 'sceptical' || trait === 'restless') target -= 1
  }
  // Nobody is at ease this far out.
  target -= Math.floor(s.darkening / 2)

  return Math.max(0, Math.min(10, target))
}

/** One step a week towards it — never a jump, so it can always be caught. */
function driftLoyalty(s: ExpeditionState): void {
  for (const member of livingCrew(s)) {
    const target = loyaltyTarget(s, member)
    const gap = target - member.loyalty
    if (gap === 0) continue
    const before = loyaltyBand(member)
    member.loyalty = Math.max(0, Math.min(10, member.loyalty + Math.sign(gap)))
    const after = loyaltyBand(member)
    // Only worth a line when it crosses into a different band: a number moving
    // by one every week would drown the log.
    if (after.name.en !== before.name.en) {
      log(s, {
        k: 'loyaltyShift',
        name: member.name,
        amount: Math.sign(gap),
        band: after.name,
      })
    }
  }
}

/**
 * Somebody has had enough — and this is the WARNING, not the event.
 *
 * At the bottom of the loyalty scale a departure is scheduled a few weeks out,
 * and the crew list says so from that moment. If the ship gets better before it
 * lands, it is cancelled. A crew member walking off with the fuel must always be
 * the end of a story the players could read.
 */
function checkRestlessness(s: ExpeditionState): void {
  // The dial governs the ship's life as a whole. At nothing it promises that the
  // crew never speaks up — a departure creeping through anyway would make the
  // dial's own words a lie.
  if (dialValue(s.dials, 'aboard') <= 0) return
  for (const member of livingCrew(s)) {
    const leaving = s.debts.find((debt) => debt.subject === member.id && debt.kind === 'leaving')

    if (member.loyalty <= LOYALTY_BREAKS && !leaving) {
      // Four weeks, not three. Loyalty climbs one step a week, so a three-week
      // fuse could not actually be put out by the ship getting better — the
      // warning has to leave room for the thing it is warning about.
      const weeks = 4
      s.debts.push({
        at: s.week + weeks,
        subject: member.id,
        kind: 'leaving',
        note: {
          hu: `${member.name} elhatározta magát, és ma be is mondta.`,
          en: `${member.name} has made up their mind, and today they said so.`,
        },
        effects: [{ k: 'aboard', id: 'aboard-leaving' }],
      })
      log(s, { k: 'crewRestless', name: member.name, weeks })
      continue
    }

    // Thought better of it. Two ways out, and the second one is the interesting
    // one: somebody TOOK THEM ON. A mentee is a person somebody answers for, and
    // that is worth more here than any number — it is also the one thing a player
    // can do about it directly, on their own console, this week.
    if (leaving && (member.loyalty >= LOYALTY_RECOVERS || member.mentor !== null)) {
      s.debts = s.debts.filter((debt) => debt !== leaving)
      log(s, { k: 'crewSettled', name: member.name })
      // And being taken on is itself a reason to stay.
      if (member.mentor) member.loyalty = Math.max(member.loyalty, LOYALTY_RECOVERS)
    }
  }
}

/** They go, and they take what they counted as theirs. */
function defect(s: ExpeditionState): void {
  const member = s.crew.find((c) => c.id === s.subject && c.alive) ?? lowestLoyalty(s)
  if (!member) return

  // What goes with them: a relic if there is one nobody is wearing, otherwise
  // fuel and credits. Something you will notice, never something that ends the
  // run on its own.
  const worn = new Set(party(s).flatMap((hero) => s.heroRecords[hero].attuned))
  const loose = s.relics.find((id) => !worn.has(id))
  let took: Text
  if (loose) {
    s.relics = s.relics.filter((id) => id !== loose)
    took = relic(loose).name
  } else {
    const fuel = Math.min(s.resources.fuel, 6)
    const credits = Math.min(s.resources.credits, 10)
    gain(s, 'fuel', -fuel)
    gain(s, 'credits', -credits)
    took = {
      hu: `${fuel} üzemanyag és ${credits} kredit`,
      en: `${fuel} fuel and ${credits} credits`,
    }
  }

  member.alive = false
  member.station = null
  member.mentor = null
  s.debts = s.debts.filter((debt) => debt.subject !== member.id)
  gain(s, 'morale', -2)
  log(s, { k: 'crewDefected', name: member.name, took })
}

function lowestLoyalty(s: ExpeditionState): CrewMember | undefined {
  return livingCrew(s)
    .slice()
    .sort((a, b) => a.loyalty - b.loyalty)[0]
}

// ------------------------------------------------------------------- debts

/** Everything that comes due this week, in the order it was promised. */
function payDebts(s: ExpeditionState): void {
  const due = s.debts.filter((debt) => debt.at <= s.week)
  if (due.length === 0) return
  s.debts = s.debts.filter((debt) => debt.at > s.week)

  for (const debt of due) {
    // A debt about somebody who is no longer aboard is simply void: the story it
    // belonged to ended.
    if (debt.subject && !s.crew.some((c) => c.id === debt.subject && c.alive)) continue
    if (debt.subject) s.subject = debt.subject
    log(s, { k: 'debtCame', note: debt.note })
    applyEncounterEffects(s, debt.effects)
  }
}

// ---------------------------------------------------------- aboard events

/** Is this situation one that can come up on the ship right now? */
function aboardEligible(s: ExpeditionState, event: Encounter): boolean {
  if (event.once && s.usedEncounters.includes(event.id)) return false
  // Somebody has to be in the chair that answers for it.
  if (event.owner && !party(s).includes(event.owner)) return false
  if (event.requires && !requirementMet(s, event.requires)) return false
  // The departure scene is never rolled: it is scheduled by `checkRestlessness`.
  if (event.id === 'aboard-leaving') return false
  return true
}

/**
 * How likely something happens aboard this week.
 *
 * Not every week: a ship that produces a decision every single week becomes a
 * queue to work through rather than a place. Weeks where the ship is under strain
 * produce more, which is what makes a bad stretch feel like a bad stretch.
 */
export function aboardChance(s: ExpeditionState): number {
  const scale = dialValue(s.dials, 'aboard')
  if (scale <= 0) return 0

  // Never two weeks running. This is the line between a place and a queue: at
  // three weeks in four the ship stops being somewhere the crew live and turns
  // into a list of pop-ups to clear — and worse, a strained ship rolled MORE of
  // them, several of which cost morale, so one bad week became a spiral that no
  // play could pull out of. A smoke run lost the expedition to it twice. A quiet
  // week is part of the rhythm, not a gap in it.
  if (s.log.some((entry) => entry.week === s.week - 1 && entry.event.k === 'aboardEvent')) {
    return 0
  }

  let chance = 0.3
  // A ship under strain has more going on. The lean is small on purpose: it
  // tilts the dice, it does not take them over.
  if (s.resources.morale < 6) chance += 0.1
  if (livingCrew(s).some((c) => c.loyalty <= 3)) chance += 0.1
  if (s.travel) chance += 0.05
  return Math.min(0.6, chance * scale)
}

/** Roll for a situation on the ship, and open it if one comes up. */
function rollAboard(s: ExpeditionState): void {
  if (s.pendingEncounter || s.activeMission || s.outcome) return
  const chance = aboardChance(s)
  if (chance <= 0) return
  const rng = rngFor(s)
  if (rng.next() >= chance) return

  const pool = ABOARD_EVENTS.filter((event) => aboardEligible(s, event))
  if (pool.length === 0) return
  // Weighted, like the map's encounters, so the rarer scenes stay rare.
  const total = pool.reduce((sum, event) => sum + event.weight, 0)
  let roll = rng.next() * total
  let chosen = pool[pool.length - 1]!
  for (const event of pool) {
    roll -= event.weight
    if (roll <= 0) {
      chosen = event
      break
    }
  }
  openAboard(s, chosen.id)
}

/**
 * Open a situation on the ship.
 *
 * It goes through `pendingEncounter`, which is what gives it the whole existing
 * interface — the account of what a choice costs and gives, the two-step
 * confirmation, the card payments — and what stops the week from being ended
 * until somebody has answered.
 */
function openAboard(s: ExpeditionState, id: string): void {
  const event = findEncounter(id)
  if (!event) return
  // Whoever it is about. Named here so that `later` effects three weeks out can
  // still mean the same person.
  const subject = event.requires?.k === 'loyaltyAtMost' ? lowestLoyalty(s) : rngFor(s).pick(livingCrew(s))
  s.subject = subject?.id ?? null
  s.pendingEncounter = { id, chosen: null, payment: [], resolvedText: null }
  if (!s.usedEncounters.includes(id)) s.usedEncounters.push(id)
  s.screen = 'encounter'
  log(s, { k: 'aboardEvent', title: event.title, owner: event.owner ?? null })
}

/** Is the situation on screen one that happened on the ship? */
export function pendingIsAboard(s: ExpeditionState): boolean {
  const id = s.pendingEncounter?.id
  return id !== undefined && findEncounter(id)?.aboard === true
}

/** Whose call the situation on screen is, if it is anybody's in particular. */
export function pendingOwner(s: ExpeditionState): HeroClassId | null {
  const id = s.pendingEncounter?.id
  if (!id) return null
  return findEncounter(id)?.owner ?? null
}

// ---------------------------------------------------------------- start

/**
 * The party a run sets out with when nothing says otherwise.
 *
 * The original pair, and the party for one or two players. Three and four seats
 * bring the Cantor and the Surveyor — see `startExpedition`.
 */
export const DEFAULT_PARTY: HeroClassId[] = ['runesmith', 'echoreader']

/** Who lands, for a table of this many people. */
export function partyForSeats(seats: number): HeroClassId[] {
  return HERO_ORDER.slice(0, Math.max(2, Math.min(4, seats)))
}

export function startExpedition(
  seed: number,
  length: ExpeditionLength,
  archive: ArchiveState,
  /** The difficulty dials to run under. Defaults to the game as designed. */
  startDials?: unknown,
  /** Which classes land. Two by default — see `partyForSeats`. */
  withParty: HeroClassId[] = DEFAULT_PARTY,
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

  const heroes: CarriedHero[] = withParty.map((heroClass) => ({
    heroClass,
    hp: HERO_CLASSES[heroClass].hp,
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
    heroRecords: blankHeroRecords(),
    relics: [],
    attention: 0,
    herald: null,
    directives: [],
    directiveCount: 0,
    tally: {
      landingsWon: 0,
      puzzlesSolved: 0,
      researchDone: 0,
      heraldsFaced: 0,
      relicsFound: 0,
    },
    heartRead: false,
    watch: {},
    watchFlux: 0,
    proposal: null,
    map,
    at: map.entryId,
    travel: null,
    activeMission: null,
    pendingEncounter: null,
    usedEncounters: [],
    subject: null,
    debts: [],
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
  // The first orders are waiting when the ship comes through the Gate: week one
  // should already have a direction in it.
  issueDirectives(s)
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
    if (revealed > 0) {
      log(s, { k: 'mapRevealed', columns })
      // Seeing the road first is the Surveyor's account.
      grantMarks(s, 'surveyor', 1, MARK_REASONS.scouted)
    }
  }

  // Medbay: patch the heroes up between landings.
  const healing = medbayOutput(s)
  if (healing > 0) {
    for (const hero of s.heroes) {
      hero.hp = Math.min(heroMaxHp(s, hero.heroClass), hero.hp + healing)
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

/**
 * Everybody's own week.
 *
 * Applied after the stations, so a duty is what this person did on top of the
 * ship's ordinary running — and cleared afterwards, because the point is that it
 * is asked again next week. A seat that set nothing simply did nothing: no
 * penalty, because a player who was away should cost the table a bonus rather
 * than a punishment.
 */
function runWatches(s: ExpeditionState): void {
  for (const hero of party(s)) {
    const id = s.watch?.[hero]
    if (!id) continue
    const duty = watchDuty(id)
    if (!duty || duty.heroClass !== hero) continue
    const e = duty.effect

    if (e.hull) gain(s, 'hull', e.hull)
    if (e.information) gain(s, 'information', e.information)
    if (e.morale) gain(s, 'morale', e.morale)
    if (e.fuel) gain(s, 'fuel', e.fuel)
    if (e.understanding) {
      s.understanding += e.understanding
      log(s, { k: 'understandingGained', amount: e.understanding, total: s.understanding })
    }
    if (e.reveal) {
      // Beyond the FARTHEST thing already known, not a fixed distance from the
      // ship. "One more column ahead" has to mean one more than you can see —
      // measured from the ship it reveals what the Sensors just revealed, and a
      // duty that quietly does nothing on a well-run ship is the exact bug this
      // codebase keeps finding.
      const here = mapNode(s.map, s.at).column
      const seen = s.map.nodes.filter((n) => n.known).reduce((max, n) => Math.max(max, n.column), here)
      const revealed = revealAhead(s.map, s.at, seen - here + e.reveal)
      if (revealed > 0) log(s, { k: 'mapRevealed', columns: e.reveal })
    }
    if (e.flux) s.watchFlux += e.flux
    if (e.mend) {
      for (const carried of s.heroes) {
        carried.hp = Math.min(heroMaxHp(s, carried.heroClass), carried.hp + e.mend)
      }
    }
    if (e.teach) {
      for (const member of menteesOf(s, hero)) member.xp += e.teach
    }
    if (e.attention) changeAttention(s, e.attention)

    log(s, { k: 'watchDone', hero, duty: duty.name })
  }
  // Asked again next week: that is the whole point of it.
  s.watch = {}
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
  target += shipBonus(s, 'moraleTarget')
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
  s.tally.researchDone += 1
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
      case 'flag':
        if (!s.flags.includes(effect.id)) s.flags.push(effect.id)
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

  // What earlier weeks promised comes due before anything else this week does.
  payDebts(s)

  weeklyResources(s)
  runStations(s)
  runWatches(s)
  crewWorkWeek(s)
  driftLoyalty(s)
  checkRestlessness(s)
  advanceResearch(s)

  // What the week did to how loud the expedition is, and what that woke.
  changeAttention(s, weeklyAttention(s))
  runHerald(s)

  if (s.travel) {
    // No power on the engines, no progress. The week still passes, which is what
    // makes leaving them cold expensive rather than free.
    if (!canSetCourse(s)) {
      log(s, { k: 'enginesCold' })
      gain(s, 'morale', -1)
    } else {
      s.travel.weeksLeft -= 1
      if (s.travel.weeksLeft <= 0) {
        arrive(s, s.travel.to)
      }
    }
  }

  // Orders are settled after the travel, so an order to be somewhere by a week
  // is judged on where the ship ended the week rather than where it started.
  checkDirectives(s)
  issueDirectives(s)

  // And last: whatever the ship itself wants to say this week. It goes through
  // `pendingEncounter`, so the next week cannot be ended until somebody answers.
  rollAboard(s)

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
  return choice.requires === undefined || requirementMet(s, choice.requires)
}

/**
 * Does the ship meet one requirement?
 *
 * Split out from `choiceAvailable` because a whole SITUATION can have one too:
 * the scene about somebody who will not come out of their cabin only exists
 * while somebody is at the end of their tether. See `Encounter.requires`.
 */
export function requirementMet(s: ExpeditionState, need: ChoiceRequirement): boolean {
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
    case 'relicsAtLeast':
      return s.relics.length >= need.value
    case 'attentionAtLeast':
      return s.attention >= need.value
    case 'loyaltyAtMost':
      return livingCrew(s).some((member) => member.loyalty <= need.value)
    case 'subjectIsMentee': {
      const subject = s.crew.find((c) => c.id === s.subject)
      return subject?.mentor != null
    }
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
  const mitigated = Math.max(0, scaled - s.power.shields - shipBonus(s, 'wards'))
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

      case 'relic':
        findRelic(s, effect.id)
        break

      case 'loyalty': {
        const who =
          effect.who === 'all'
            ? livingCrew(s)
            : effect.who === 'lowest'
              ? [lowestLoyalty(s)].filter((m): m is CrewMember => m !== undefined)
              : [s.crew.find((c) => c.id === s.subject && c.alive)].filter(
                  (m): m is CrewMember => m !== undefined,
                )
        for (const member of who) {
          const before = loyaltyBand(member)
          member.loyalty = Math.max(0, Math.min(10, member.loyalty + effect.amount))
          const after = loyaltyBand(member)
          if (after.name.en !== before.name.en) {
            log(s, {
              k: 'loyaltyShift',
              name: member.name,
              amount: effect.amount,
              band: after.name,
            })
          }
        }
        break
      }

      case 'later': {
        const debt: Debt = {
          at: s.week + Math.max(1, effect.weeks),
          subject: s.subject,
          note: effect.note,
          effects: effect.effects,
        }
        s.debts.push(debt)
        break
      }

      case 'defect':
        defect(s)
        break

      case 'aboard':
        openAboard(s, effect.id)
        break

      case 'attention':
        if (effect.amount >= 0) raiseAttention(s, effect.amount)
        else changeAttention(s, effect.amount)
        break

      case 'heroXp':
        if (effect.who) grantMarks(s, effect.who, effect.amount, MARK_REASONS.landing)
        else for (const hero of party(s)) grantMarks(s, hero, effect.amount, MARK_REASONS.landing)
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

      case 'startTask':
        launchTask(s, effect.difficulty ?? Math.max(1, 1 + s.darkening), [
          { k: 'archive', amount: 2 },
          { k: 'resource', id: 'information', amount: 6 },
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
  const def = findEncounter(pending.id)
  const choice = def?.choices[pending.chosen]
  if (!def || !choice) return

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

  // A situation that happened ON THE SHIP has nothing to do with the place the
  // ship is standing at: marking the node used up would quietly eat whatever was
  // waiting there.
  if (!def.aboard) {
    const node = mapNode(s.map, s.at)
    node.resolved = true
  }

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
    // What the two of them have earned and are wearing reaches the grid here:
    // maximum hit points and the Bond's range are both theirs, not the class's.
    heroMaxHp: Object.fromEntries(party(s).map((hero) => [hero, heroMaxHp(s, hero)])),
    bondRange: bondRange(s),
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
  // Whatever the Runesmith burned into the weapons went down with them.
  s.watchFlux = 0
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

/**
 * Pay out a list of rewards.
 *
 * `owner` is who gets the advancement marks when a reward does not name a hero —
 * an order carried out pays the console it sat on. Without an owner, marks go to
 * both, which is what a landing does.
 */
/**
 * Open a split task: the rune line.
 *
 * `seats` comes from the party, because the task is dealt per seat and a task
 * dealt for four when two people are playing would hand half the clues to
 * nobody. In a solo or one-keyboard game every panel is the same person's, and
 * the puzzle is simply a logic puzzle with the clues laid out in groups.
 */
function launchTask(
  s: ExpeditionState,
  difficulty: number,
  rewards: Reward[],
  briefing?: Text,
): void {
  const seed = s.seed * 8191 + s.week * 29 + s.rngStep
  s.rngStep += 1
  s.activeMission = {
    k: 'task',
    nodeId: s.at,
    task: generateRuneLine(createRng(seed), {
      seats: Math.max(1, party(s).length),
      difficulty,
    }),
    rewards,
    briefing: briefing ?? {
      hu:
        'Egy zárósor, hat rúnával, és egyetlen helyes sorrenddel. A leírása szét van szórva: ' +
        'mindenki más darabját látja, és mindenki csak a saját rúnáit tudja megnyomni. ' +
        'Beszéljetek.',
      en:
        'A closing line of runes with exactly one right order. Its description is scattered: each ' +
        'of you sees a different part, and each of you can only press your own runes. Talk.',
    },
  }
  s.screen = 'mission'
  log(s, { k: 'missionLaunched', briefing: s.activeMission.briefing })
}

function applyRewards(
  s: ExpeditionState,
  rewards: readonly Reward[],
  owner?: HeroClassId,
): void {
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
      case 'relic':
        findRelic(s, reward.id)
        break
      case 'heroXp': {
        const who = reward.who ?? owner
        const reason = owner ? MARK_REASONS.directive : MARK_REASONS.landing
        if (who) grantMarks(s, who, reward.amount, reason)
        else for (const hero of party(s)) grantMarks(s, hero, reward.amount, reason)
        break
      }
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

/**
 * The Echo-reader's Remembrance perk, honoured between landings.
 *
 * Lost cards are the attrition the whole game is built on, so this is the only
 * thing in the game that undoes them — one at a time, and only for her.
 */
function recoverLostCards(s: ExpeditionState): void {
  for (const hero of s.heroes) {
    let slots = 0
    for (const id of s.heroRecords[hero.heroClass].perks) slots += heroPerk(id).effect.recoverLost ?? 0
    for (let i = 0; i < slots; i++) {
      const back = hero.lost.shift()
      if (!back) break
      hero.hand.push(back)
    }
  }
}

/** It came, and it did not leave. Nothing sends another. */
function heraldSilenced(s: ExpeditionState): void {
  s.herald = null
  if (!s.flags.includes('herald-silenced')) s.flags.push('herald-silenced')
  // The mark outlives the expedition: a later run can be asked about this.
  if (!s.marks.includes('silenced-the-herald')) s.marks.push('silenced-the-herald')
  changeAttention(s, -s.attention)
  for (const hero of party(s)) grantMarks(s, hero, 3, MARK_REASONS.herald)
  log(s, { k: 'heraldSilenced' })
}

/**
 * It was driven off, not stopped.
 *
 * It falls back down the corridor and comes again — harder, because `hunts` goes
 * up. That is what stops losing to it on purpose from being the cheap way out of
 * the mechanic.
 */
function heraldRepelled(s: ExpeditionState): void {
  if (!s.herald) return
  s.herald = {
    column: Math.min(s.map.columns - 1, shipColumn(s) + 3),
    hunts: s.herald.hunts + 1,
  }
  changeAttention(s, -4)
  log(s, { k: 'heraldRepelled' })
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
      s.tally.landingsWon += 1
      applyRewards(s, mission.spec.rewards)
      // What they carried out of an exploration site is not a number any more:
      // every relic brought home is a named thing with an effect. See relics.ts.
      for (let i = 0; i < result.relicsCollected; i++) findRelic(s)
      // Marks. Both of them for the landing; and the Runesmith again if the ship
      // came out of a boarding action with everything still standing, which is
      // the thing he is actually being paid for.
      for (const hero of party(s)) grantMarks(s, hero, 1, MARK_REASONS.landing)
      if (mission.spec.aboard && result.modulesLost.length === 0) {
        grantMarks(s, 'runesmith', 2, MARK_REASONS.intact)
      }
      // And the Cantor for the thing she is actually there for: nobody fell.
      if (result.casualties === 0) grantMarks(s, 'cantor', 2, MARK_REASONS.unhurt)
      menteeMarks(s)
      // A fight is loud. A fight aboard the ship is louder.
      raiseAttention(s, mission.spec.aboard ? 2 : 1)
      if (mission.spec.herald) heraldSilenced(s)
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
      if (mission.spec.herald) heraldRepelled(s)
      node.resolved = true
    }
  } else if (mission.k === 'task') {
    const status = taskStatus(mission.task)
    if (status === 'solved') {
      log(s, { k: 'taskSolved' })
      s.tally.puzzlesSolved += 1
      applyRewards(s, mission.rewards)
      // Reading a mechanism is her craft whatever shape it takes.
      grantMarks(s, 'echoreader', 2, MARK_REASONS.mechanism)
    } else {
      log(s, { k: 'taskFailed' })
      // The same as a mechanism that would not open, not double it. It was two,
      // and with orders and the ship's own weeks also charging morale, three
      // penalties in one week outran the drift that is supposed to make morale
      // recoverable — a smoke run fell from eleven to nothing in three weeks.
      gain(s, 'morale', -1)
      // Forcing a lock is the loudest thing you can do standing still.
      raiseAttention(s, 1)
    }
    node.resolved = true
  } else {
    const status = puzzleStatus(mission.puzzle)
    if (status === 'solved') {
      log(s, { k: 'puzzleSolved' })
      s.tally.puzzlesSolved += 1
      applyRewards(s, mission.rewards)
      // Reading a mechanism is her craft, and this is where she is paid for it.
      grantMarks(s, 'echoreader', 2, MARK_REASONS.mechanism)
    } else {
      log(s, { k: 'puzzleFailed' })
      gain(s, 'morale', -1)
      // Forcing something that would not open is exactly the kind of noise the
      // Stargrave notices.
      raiseAttention(s, 1)
    }
    node.resolved = true
  }

  recoverDecks(s)
  recoverLostCards(s)
  checkDirectives(s)
  s.activeMission = null
  updateDarkening(s)
  // Back where the mission was launched from. The Heart is its own screen, and a
  // mechanism read there must not drop the players onto the star map.
  s.screen = s.pendingEncounter
    ? 'encounter'
    : s.at === s.map.heartId
      ? 'heart'
      : 'starmap'
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
    case 'task':
      launchTask(s, node.event.difficulty, node.event.rewards, node.event.briefing)
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

// ------------------------------------------------------- table decisions
//
// Six actions in this game cannot be taken back and land on everybody: calling a
// landing won or lost without playing it, redealing the ground, backing out of a
// landing, choosing how the story ends, and stopping the expedition.
//
// At one keyboard each of them asks twice, because there is one mouse and one
// person holding it. Over a network that stops being enough: the same two clicks
// from any one seat would end the evening for three other people who were in the
// middle of a sentence. So online they are PROPOSED, and somebody else has to
// agree — the same principle, carried across the table.
//
// Everything else stays open to everybody on purpose. This is a co-operative
// game; the argument about where to go is supposed to happen out loud, and a
// game that made every shared decision a vote would be a committee.

/** Does this action need a second pair of hands, when there is more than one? */
export function needsSeconding(action: ExpeditionAction): action is ProposedAction {
  switch (action.k) {
    case 'settleBattle':
    case 'restartBattle':
    case 'rerollBattle':
    case 'withdrawBeforeLanding':
    case 'chooseEnding':
    case 'abandon':
      return true
    default:
      return false
  }
}

/** How many seats have to want it: the asker, and one more. */
export const SECONDS_NEEDED = 1

/** Is the proposal on the table carried? */
export function proposalCarried(s: ExpeditionState): boolean {
  const proposal = s.proposal
  return proposal !== null && proposal.seconds.length >= SECONDS_NEEDED
}

/** What is being asked for, in words, so the log and the banner agree. */
export function proposalLabel(action: ProposedAction): Text {
  switch (action.k) {
    case 'settleBattle':
      return action.as === 'victory'
        ? { hu: 'a partraszállás sikeresnek elszámolása', en: 'booking the landing as a success' }
        : action.as === 'defeat'
          ? { hu: 'a partraszállás feladása teljes veszteséggel', en: 'giving the landing up at full cost' }
          : { hu: 'a partraszállás kihagyása', en: 'skipping the landing' }
    case 'restartBattle':
      return { hu: 'a csata újrakezdése ugyanezen a pályán', en: 'restarting the battle on the same ground' }
    case 'rerollBattle':
      return { hu: 'új pálya ugyanerre a feladatra', en: 'a different battlefield for the same task' }
    case 'withdrawBeforeLanding':
      return { hu: 'visszalépés a partraszállás előttre', en: 'pulling back to before the landing' }
    case 'chooseEnding':
      return { hu: 'az expedíció befejezése ezzel a végkifejlettel', en: 'ending the expedition this way' }
    case 'abandon':
      return { hu: 'az expedíció leállítása', en: 'calling the expedition off' }
  }
}

/** Do the thing that was agreed. Only the kinds the type allows can get here. */
function performProposal(s: ExpeditionState, action: ProposedAction): void {
  switch (action.k) {
    case 'settleBattle':
      settleBattle(s, action.as)
      return
    case 'restartBattle':
      rebuildBattle(s, false)
      return
    case 'rerollBattle':
      rebuildBattle(s, true)
      return
    case 'withdrawBeforeLanding':
      withdrawBeforeLanding(s)
      return
    case 'chooseEnding':
      chooseEnding(s, action.endingId)
      return
    case 'abandon':
      s.outcome = { k: 'lost', reason: 'abandoned' }
      s.screen = 'over'
      return
  }
}

// ---------------------------------------------------------------- endings

/**
 * What can be chosen at the Stargrave, given this run.
 *
 * Five of these are read off one number, and that was the whole endgame: how
 * much did you understand. It made every run's last five minutes the same
 * conversation. The four that follow are earned instead — by arriving with the
 * crew whole, by having silenced the thing that hunted you, by carrying enough
 * of the dead galaxy home in your hands. A run can now reach the Heart with a
 * choice nobody expected, which is the only thing that makes the ending worth
 * arriving at twice.
 *
 * Turning back for the Gate is not here: that is not something you choose at the
 * Stargrave. See `canGoHome`.
 */
export function availableEndings(s: ExpeditionState): EndingId[] {
  const tier = understandingTier(s.understanding)
  const out: EndingId[] = ['flee', 'blindRuin']
  if (tier >= 1) out.push('witness')
  if (tier >= 2) out.push('intervene')
  if (tier >= 3) out.push('communion')

  // Arrived with the ship still a ship: five people alive and a crew that will
  // still take an order. Understanding alone never asked for that.
  if (tier >= 2 && livingCrew(s).length >= 5 && s.resources.morale >= 8) out.push('custodian')
  // You met what the Stargrave sent, and it did not go home either.
  if (tier >= 1 && s.flags.includes('herald-silenced')) out.push('silence')
  // Three relics in the hold: enough to leave something behind rather than
  // carry it all away.
  if (tier >= 1 && s.relics.length >= 3) out.push('inheritance')

  // The closing one needs both halves: the Archive must have bought the question
  // (carried in as a flag at launch) and this run must have understood enough to
  // answer it.
  if (tier >= 3 && s.flags.includes('last-question')) out.push('theAnswer')
  return out
}

/**
 * Fuel to turn the ship round and burn for the Gate from where it stands.
 *
 * Two units a column, because the road home is the road you came by. It is
 * deliberately affordable early and expensive deep in: the decision this exists
 * for is "we are four columns in with eleven weeks left — do we still get to
 * choose?", and the answer has to be able to be no.
 */
export function homewardFuel(s: ExpeditionState): number {
  return Math.max(2, shipColumn(s) * 2)
}

/**
 * May the expedition go home right now?
 *
 * This is the answer to the question the game could not answer before: when does
 * it end? It ends when you say so. Turning back is an ENDING and not a loss —
 * you keep what you learned, you bank it, and the Archive counts the run. A ship
 * that instead runs the clock to zero on the far side of the map loses
 * everything the hard way, and now that is a choice somebody made rather than a
 * rule that ambushed them.
 */
export function canGoHome(s: ExpeditionState): boolean {
  if (s.outcome || s.activeMission || s.pendingEncounter || s.travel) return false
  if (s.at === s.map.heartId) return false
  return s.resources.fuel >= homewardFuel(s)
}

const ENDING_ARCHIVE: Record<EndingId, number> = {
  flee: 2,
  blindRuin: 1,
  witness: 5,
  intervene: 9,
  communion: 14,
  theAnswer: 20,
  // Going home early banks less than standing at the Heart — but it banks, and
  // that is the point: it is never the wrong move, only the smaller one.
  homecoming: 3,
  silence: 8,
  inheritance: 10,
  custodian: 11,
}

function chooseEnding(s: ExpeditionState, id: EndingId): void {
  // Turning back is judged where the ship is, not at the Stargrave.
  if (id === 'homecoming') {
    if (!canGoHome(s)) return
    gain(s, 'fuel', -homewardFuel(s))
    // A relic carried home is worth something to the Archive even when nothing
    // else was understood: it is the one ending that pays for what you hold.
    s.archiveEarned += ENDING_ARCHIVE.homecoming + s.relics.length
    s.outcome = { k: 'ending', id, understanding: s.understanding }
    s.screen = 'over'
    return
  }
  if (!availableEndings(s).includes(id)) return
  s.archiveEarned += ENDING_ARCHIVE[id]
  s.outcome = { k: 'ending', id, understanding: s.understanding }
  s.screen = 'over'
}

/**
 * The Heart, read before anything is decided there.
 *
 * One mechanism, at the hardest setting, and the reward is two points of
 * understanding — which can be the two points that open a different ending while
 * the players are already standing in front of the list. Once only, and failing
 * it costs morale: the last screen of an expedition should be able to go wrong.
 */
function readHeart(s: ExpeditionState): void {
  if (s.heartRead || s.activeMission || s.at !== s.map.heartId) return
  s.heartRead = true
  log(s, { k: 'heartRead' })
  launchPuzzle(s, null, 3, [
    { k: 'understanding', amount: 2 },
    { k: 'archive', amount: 2 },
  ], {
    hu:
      'A Csillagsír pereme. Nem támad, nem szól, és nem zárva van — csak írva. Le lehet ülni ' +
      'elé, egyszer, mielőtt bármit eldöntetek.',
    en:
      'The rim of the Stargrave. It does not attack, it does not speak, and it is not locked — ' +
      'only written. You can sit down in front of it, once, before you decide anything.',
  })
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
  } else if (item.k === 'relic') {
    log(s, { k: 'bought', label: relic(item.id).name, price: offer.price })
    findRelic(s, item.id)
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
      if (!canSetCourse(s)) break
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
      // The Gate screen is the one that offers to end the run, so it is only
      // reachable when turning back is actually possible.
      if (action.screen === 'gate' && !canGoHome(s)) break
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

    case 'taskPress': {
      const mission = s.activeMission
      if (!mission || mission.k !== 'task') break
      mission.task = press(mission.task, action.rune)
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

    // ------------------------------------------------- one player's own moves
    case 'buyPerk':
      buyPerk(s, action.hero, action.perkId)
      break

    case 'attuneRelic':
      attuneRelic(s, action.hero, action.relicId)
      break

    case 'stowRelic':
      stowRelic(s, action.hero, action.relicId)
      break

    case 'setMentor':
      setMentor(s, action.crewId, action.hero)
      break

    case 'sellRelic':
      sellRelic(s, action.relicId)
      break

    case 'readHeart':
      readHeart(s)
      break

    case 'propose': {
      // One at a time: a second ask replaces the first, so the table is never
      // looking at two irreversible questions at once.
      s.proposal = { action: action.action, by: action.by, seconds: [] }
      log(s, { k: 'proposalMade', by: action.by, what: proposalLabel(action.action) })
      break
    }

    case 'second': {
      const proposal = s.proposal
      if (!proposal) break
      // Not your own: the whole point is a second pair of hands.
      if (action.by === proposal.by) break
      if (proposal.seconds.includes(action.by)) break
      proposal.seconds = [...proposal.seconds, action.by]
      if (proposal.seconds.length >= SECONDS_NEEDED) {
        const agreed = proposal.action
        s.proposal = null
        log(s, { k: 'proposalCarried', what: proposalLabel(agreed) })
        performProposal(s, agreed)
      }
      break
    }

    case 'dropProposal':
      if (s.proposal) log(s, { k: 'proposalDropped' })
      s.proposal = null
      break

    case 'setWatch': {
      const duty = watchDuty(action.duty)
      if (!duty || duty.heroClass !== action.hero) break
      if (!party(s).includes(action.hero)) break
      // Setting it again swaps it; setting the same one again puts it down.
      if (s.watch[action.hero] === action.duty) {
        delete s.watch[action.hero]
        break
      }
      s.watch[action.hero] = action.duty
      log(s, { k: 'watchSet', hero: action.hero, duty: duty.name })
      break
    }

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
  if (mission.k === 'task') return taskStatus(mission.task) !== 'open'
  return puzzleStatus(mission.puzzle) !== 'open'
}
