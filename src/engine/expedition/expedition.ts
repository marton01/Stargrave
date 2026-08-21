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
import type { ResourceId, StationId, SystemId } from '../../content/ship'
import { encounter } from '../../content/encounters'
import type { EncounterChoice, EncounterEffect } from '../../content/encounters'
import { availableProjects, researchProject, understandingTier } from '../../content/research'
import { card, cardsOfClass } from '../../content/cards'
import { generatePuzzle, puzzleStatus, applyPuzzleMove, STARTING_PUZZLE_KINDS } from '../puzzles/index'
import type { PuzzleKind, PuzzleMove } from '../puzzles/types'
import { missionResult, startMission, step as battleStep } from '../battle'
import type { Action as BattleAction, CarriedHero } from '../battle'
import { LENGTHS, generateStarMap, mapNode, revealAhead } from './starmap'
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
  | { k: 'encounterConfirm' }
  | { k: 'encounterClose' }
  | { k: 'battleAction'; action: BattleAction }
  | { k: 'puzzleMove'; move: PuzzleMove }
  | { k: 'missionFinish' }
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
  s.resources[id] = Math.max(0, Math.min(resourceMax(s, id), before + amount))
  const delta = s.resources[id] - before
  if (delta > 0) log(s, { k: 'resourceGain', id, amount: delta })
  else if (delta < 0) log(s, { k: 'resourceLoss', id, amount: -delta })
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

/** How well staffed, counting speciality match and traits. */
function stationStrength(s: ExpeditionState, station: StationId): number {
  const def = STATIONS[station]
  const crew = crewAt(s, station)
  return crew.reduce((sum, c) => {
    const match = c.speciality === def.speciality ? 2 : 1
    const traits = c.traits.reduce((n, t) => n + (CREW_TRAITS[t].station ?? 0), 0)
    return sum + Math.max(1, match + traits)
  }, 0)
}

/** Flux the rune core will hand the landing party. */
export function missionFlux(s: ExpeditionState): number {
  const armoury = stationActive(s, 'armoury') && s.power.runeCore > 0 ? 1 : 0
  return Math.max(1, s.power.runeCore + armoury + moduleTotal(s, 'flux'))
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

  const gateWeeks = LENGTHS[length].weeks + (archive.unlocked.includes('longer-gate') ? 4 : 0)

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
    week: 0,
    gateTotal: gateWeeks,
    gateWeeksLeft: gateWeeks,
    darkening: 0,
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
  if (stationActive(s, 'lab')) {
    const amount = 1 + s.power.lab + Math.max(0, traitBonus(crewAt(s, 'lab'), 'research'))
    gain(s, 'information', amount)
    log(s, { k: 'stationRan', station: 'lab' })
  }

  // Forge: hull repair.
  if (stationActive(s, 'forge')) {
    const amount = 1 + Math.floor(stationStrength(s, 'forge') / 2)
    gain(s, 'hull', amount)
    log(s, { k: 'stationRan', station: 'forge' })
  }

  // Sensors: reveal the road ahead.
  if (stationActive(s, 'sensors')) {
    const columns = s.power.sensors + moduleTotal(s, 'sensorRange')
    const revealed = revealAhead(s.map, s.at, columns)
    if (revealed > 0) log(s, { k: 'mapRevealed', columns })
  }

  // Medbay: patch the heroes up between landings.
  if (stationActive(s, 'medbay')) {
    for (const hero of s.heroes) {
      const max = hero.heroClass === 'runesmith' ? 12 : 8
      hero.hp = Math.min(max, hero.hp + 2)
    }
    log(s, { k: 'stationRan', station: 'medbay' })
  }

  // Archive: an extra week of research progress.
  if (stationActive(s, 'archive') && s.research.active) {
    s.research.active.weeksLeft -= 1
    log(s, { k: 'stationRan', station: 'archive' })
  }
}

function weeklyResources(s: ExpeditionState): void {
  // Food: everybody eats.
  const crewCount = livingCrew(s).length
  // BALANCE: this was crew/2, which emptied a full hold in seven weeks and made
  // starvation the default ending rather than a consequence of a bad route.
  const eaten = Math.max(1, Math.ceil(crewCount / 3))
  if (s.resources.food < eaten) {
    s.resources.food = 0
    log(s, { k: 'starving' })
    gain(s, 'morale', -3)
    if (rngFor(s).next() < 0.3) killCrew(s, 1)
  } else {
    gain(s, 'food', -eaten)
  }

  // Fuel: only while under way. The Bridge makes every jump cheaper.
  if (s.travel) {
    const discount = stationActive(s, 'bridge') ? 1 : 0
    const burn = Math.max(1, 2 - discount)
    if (s.resources.fuel < burn) {
      s.resources.fuel = 0
      log(s, { k: 'noFuel' })
      // Drifting: the jump stalls and the crew feels it.
      s.travel.weeksLeft += 1
      gain(s, 'morale', -1)
    } else {
      gain(s, 'fuel', -burn)
    }
  }

  // Modules that simply produce.
  for (const id of s.modules) {
    const weekly = MODULES[id].weekly
    if (weekly) gain(s, weekly.id, weekly.amount)
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
  if (stationActive(s, 'sanctum')) target += 2 + Math.floor(stationStrength(s, 'sanctum') / 3)
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
  const level = Math.max(0, Math.min(3, Math.floor(spent * 4)))
  if (level > s.darkening) {
    s.darkening = level
    log(s, { k: 'darkeningRose', level })
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
    openEncounter(s, node.event.encounterId)
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
  const mitigated = Math.max(0, amount - s.power.shields - moduleTotal(s, 'wards'))
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

function launchMission(s: ExpeditionState, spec: MissionSpec): void {
  const seed = s.seed * 977 + s.week * 31 + s.rngStep
  s.rngStep += 1
  const battle = startMission({
    seed,
    difficulty: Math.min(3, spec.difficulty + (s.darkening >= 2 ? 1 : 0)),
    objective: spec.objective,
    missionKind: spec.kind,
    flux: missionFlux(s),
    roundLimit: spec.roundLimit,
    heroes: s.heroes,
    enemyScale: spec.enemyScale,
  })
  s.activeMission = { k: 'battle', nodeId: s.at, spec, battle }
  s.screen = 'mission'
  log(s, { k: 'missionLaunched', briefing: spec.briefing })
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
    puzzle: generatePuzzle(chosen, seed, difficulty),
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
  return out
}

const ENDING_ARCHIVE: Record<EndingId, number> = {
  flee: 2,
  blindRuin: 1,
  witness: 5,
  intervene: 9,
  communion: 14,
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
      const weeks = Math.max(1, base - Math.max(0, s.power.engines - 1))
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
      pending.chosen = action.index
      // A card cost needs the players to pick which cards burn.
      if (!cardCostOf(choice)) resolveEncounter(s)
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
      s.pendingEncounter = null
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
