// The round logic of a battle: phases, initiative and the reducer.
//
// One entry point: step(state, action) -> new state.
// The previous state is never mutated; we clone and work on the clone. That
// plays well with React and makes debugging simple.
//
// The same engine serves combat and exploration missions. What differs is the
// OBJECTIVE — see checkOutcome. Nothing else in here cares which kind it is.

import { clone, livingEnemies, livingHeroes, heroes, log, tickStatuses, unitById } from './state'
import { buildEncounter, enemyType, intentOf } from '../content/enemies'
import { card, cardsOfClass } from '../content/cards'
import { MODULES } from '../content/ship'
import type { ModuleId } from '../content/ship'
import { createRng } from './rng'
import { afterMove, dealDamage, heal } from './combat'
import { enemyTurn } from './enemyAi'
import {
  allTiles,
  distance,
  fromTileKey,
  neighbours,
  onMap,
  sameTile,
  setTerrain,
  terrainAt,
  tileKey,
  unitAt,
  walkable,
} from './grid'
import { generateMap, generateMissionFeatures } from './mapgen'
import { HERO_CLASSES } from '../content/heroes'
import { resolveEffects } from './effects'
import type {
  BattleState,
  Collapsing,
  Coord,
  Enemy,
  Hero,
  HeroClassId,
  MissionKind,
  Installation,
  Objective,
  TerrainKind,
  Unit,
} from './types'

/** The landing party's default starting Flux, when no ship supplies one. */
export const STARTING_FLUX = 5

/** How much a hero heals when resting. */
export const REST_HEAL = 2

/** How many cards a hero plays each round. */
export const CARDS_PER_ROUND = 2

/** Damage taken when the floor gives way under you. */
export const COLLAPSE_DAMAGE = 3

/** Hero state that travels between missions, so wounds and losses persist. */
export type CarriedHero = {
  heroClass: HeroClassId
  hp: number
  hand: string[]
  discard: string[]
  lost: string[]
}

/** How the expedition (or the standalone screen) asks for a battle. */
export type BattleSetup = {
  seed: number
  difficulty: number
  objective: Objective
  missionKind: MissionKind
  /** Flux the ship's rune core supplied for this mission. */
  flux?: number
  /**
   * The ship's modules to stand on the board, for a boarding action. Empty or
   * absent everywhere else — a landing on a planet has no ship to wreck.
   */
  installations?: string[]
  /** Hard round limit; the mission fails when it runs out. */
  roundLimit?: number | null
  /** Hero state carried in from the expedition. */
  heroes?: CarriedHero[]
  /** Scale the enemy count — exploration missions field far fewer. */
  enemyScale?: number
  /**
   * Maximum hit points per hero, when the expedition has raised them.
   *
   * A hero's maximum used to be a constant of their class. Perks and worn relics
   * can both add to it now, and that has to reach the grid or the strategic
   * layer is promising something the battle does not honour.
   */
  heroMaxHp?: Partial<Record<HeroClassId, number>>
  /**
   * How close the two of them have to be for the Bond, in tiles. Two by default;
   * a perk and a relic can widen it.
   */
  bondRange?: number
}

export type Action =
  // card selection phase
  | { k: 'selectCard'; heroId: string; cardId: string }
  | { k: 'setInitiativeCard'; heroId: string; cardId: string }
  | { k: 'rest'; heroId: string; loseCard: string }
  | { k: 'confirmSelection'; heroId: string }
  // resolution phase
  | { k: 'assignTopCard'; cardId: string }
  | { k: 'playHalf'; half: 'top' | 'bottom' }
  | { k: 'choose'; value: string }
  | { k: 'skipHalf'; half: 'top' | 'bottom' }
  | { k: 'endTurn' }
  | { k: 'advanceEnemy' }
  /**
   * Change the ground under a tile.
   *
   * Not a game move: a repair tool, reached from the "stuck?" panel, for the
   * board that generation got wrong. It is an ordinary battle action on purpose,
   * so the undo history covers it like everything else — a slip of the hand while
   * fixing a map should not be its own new kind of accident.
   */
  | { k: 'editTerrain'; tile: string; kind: TerrainKind }

// ------------------------------------------------------------ randomness

/**
 * Deterministic randomness from the state. Every call advances the counter, so
 * the same seed plus the same sequence of actions gives the same battle.
 */
function rngFor(s: BattleState) {
  s.rngStep += 1
  return createRng(s.seed * 7919 + s.rngStep)
}

// ------------------------------------------------------------ starting a battle

/** Convenience for the standalone battle screen and the tests. */
export function startBattle(seed: number, difficulty = 2): BattleState {
  return startMission({
    seed,
    difficulty,
    objective: { k: 'eliminate' },
    missionKind: 'combat',
  })
}

export function startMission(setup: BattleSetup): BattleState {
  const setupRng = createRng(setup.seed)
  const roster = buildEncounter(setupRng, setup.difficulty)
  const scale = setup.enemyScale ?? 1
  const typeIds = roster.slice(0, Math.max(0, Math.round(roster.length * scale)))

  const { map, heroSpawns, enemySpawns } = generateMap(setupRng, Math.max(typeIds.length, 1))
  const features = generateMissionFeatures(setupRng, map, heroSpawns, enemySpawns, setup.objective)

  // Modules go on floor tiles away from where the party lands: far enough that
  // they can actually be lost, close enough that defending them is a choice
  // rather than a sprint.
  const installations: Installation[] = []
  const moduleIds = setup.installations ?? []
  if (moduleIds.length > 0) {
    const home = heroSpawns[0] ?? { x: 0, y: 0 }
    const spots = setupRng
      .shuffle(
        allTiles(map).filter(
          (c) =>
            walkable(map, c) &&
            distance(c, home) >= 3 &&
            !enemySpawns.some((e) => sameTile(e, c)) &&
            !features.relics.some((r) => sameTile(r, c)) &&
            !(features.exit && sameTile(features.exit, c)),
        ),
      )
      .slice(0, moduleIds.length)
    for (let i = 0; i < spots.length; i++) {
      installations.push({ pos: spots[i]!, id: moduleIds[i]!, hp: 4, maxHp: 4 })
    }
  }

  const slots: { heroClass: HeroClassId; playerSlot: 1 | 2 }[] = [
    { heroClass: 'runesmith', playerSlot: 1 },
    { heroClass: 'echoreader', playerSlot: 2 },
  ]

  const heroUnits: Hero[] = slots.map((slot, i) => {
    const cls = HERO_CLASSES[slot.heroClass]
    const carried = setup.heroes?.find((h) => h.heroClass === slot.heroClass)
    const maxHp = setup.heroMaxHp?.[slot.heroClass] ?? cls.hp
    return {
      id: `hero-${slot.heroClass}`,
      side: 'hero',
      name: cls.name,
      heroClass: slot.heroClass,
      playerSlot: slot.playerSlot,
      pos: heroSpawns[i] ?? heroSpawns[0] ?? { x: 0, y: 0 },
      hp: carried ? Math.max(1, Math.min(maxHp, carried.hp)) : maxHp,
      maxHp,
      statuses: {},
      alive: true,
      hand: carried ? [...carried.hand] : cardsOfClass(slot.heroClass).map((c) => c.id),
      discard: carried ? [...carried.discard] : [],
      lost: carried ? [...carried.lost] : [],
      selected: [],
      initiativeCard: null,
      resting: false,
      exhausted: false,
    }
  })

  const enemyUnits: Enemy[] = enemySpawns.slice(0, typeIds.length).map((pos, i) => {
    const typeId = typeIds[i]!
    const type = enemyType(typeId)
    return {
      id: `enemy-${i}`,
      side: 'enemy',
      name: type.name,
      enemyType: typeId,
      pos,
      hp: type.hp,
      maxHp: type.hp,
      statuses: {},
      alive: true,
      intentDeck: setupRng.shuffle(type.intents.map((intent) => intent.id)),
      intentIndex: -1,
      intent: null,
    }
  })

  const s: BattleState = {
    seed: setup.seed,
    rngStep: 0,
    round: 0,
    phase: 'cardSelection',
    map,
    units: [...heroUnits, ...enemyUnits],
    flux: setup.flux ?? STARTING_FLUX,
    traps: [],
    order: [],
    orderIndex: 0,
    selectingHero: null,
    heroTurn: null,
    pending: null,
    objective: setup.objective,
    missionKind: setup.missionKind,
    relics: features.relics,
    carried: 0,
    exit: features.exit,
    collapsing: features.collapsing,
    bondRange: setup.bondRange ?? 2,
    installations,
    setupInstallations: moduleIds,
    roundLimit: setup.roundLimit ?? null,
    log: [],
    outcome: null,
  }

  log(s, { k: 'battleStart' })
  beginRound(s)
  return s
}

// ------------------------------------------------------------ round start

function drawIntent(s: BattleState, e: Enemy): void {
  e.intentIndex += 1
  if (e.intentIndex >= e.intentDeck.length) {
    e.intentDeck = rngFor(s).shuffle(e.intentDeck)
    e.intentIndex = 0
  }
  e.intent = e.intentDeck[e.intentIndex] ?? null
}

/**
 * Survive objectives keep feeding in reinforcements — otherwise "hold out for
 * six rounds" would end the moment the first wave died.
 */
function spawnReinforcement(s: BattleState): void {
  if (s.objective.k !== 'survive') return
  if (s.round < 2 || s.round % 2 !== 0) return

  const heroPositions = livingHeroes(s).map((h) => h.pos)
  if (heroPositions.length === 0) return

  const far = (c: Coord) => Math.min(...heroPositions.map((p) => distance(c, p)))
  const pos = allTiles(s.map)
    .filter((c) => walkable(s.map, c) && !unitAt(s.units, c))
    .filter((c) => !s.traps.some((t) => sameTile(t.pos, c)))
    .sort((a, b) => far(b) - far(a))[0]
  if (!pos) return

  const rng = rngFor(s)
  const typeId = rng.next() < 0.75 ? 'ash-husk' : 'choir-wraith'
  const type = enemyType(typeId)
  s.units.push({
    id: `enemy-r${s.round}`,
    side: 'enemy',
    name: type.name,
    enemyType: typeId,
    pos,
    hp: type.hp,
    maxHp: type.hp,
    statuses: {},
    alive: true,
    intentDeck: rng.shuffle(type.intents.map((i) => i.id)),
    intentIndex: -1,
    intent: null,
  })
  log(s, { k: 'reinforcements', count: 1 })
}

function beginRound(s: BattleState): void {
  s.round += 1
  s.phase = 'cardSelection'
  s.order = []
  s.orderIndex = 0
  s.heroTurn = null
  s.pending = null

  spawnReinforcement(s)

  // Enemies reveal their intent BEFORE the heroes choose cards.
  for (const e of livingEnemies(s)) drawIntent(s, e)

  for (const h of heroes(s)) {
    h.selected = []
    h.initiativeCard = null
    h.resting = false
    if (!h.alive) continue
    // Fatigue: a hero who can neither play two cards nor rest is out.
    if (h.hand.length < CARDS_PER_ROUND && h.discard.length === 0) {
      h.exhausted = true
      h.alive = false
      log(s, { k: 'exhausted', unit: h.name })
    }
  }

  // Warn the players a round before the floor goes.
  if (s.collapsing.some((c) => c.roundsLeft === 1)) {
    log(s, { k: 'floorAboutToGive', rounds: 1 })
  }

  if (checkOutcome(s)) return

  s.selectingHero = livingHeroes(s)[0]?.id ?? null
}

// ------------------------------------------------------------ initiative

function initiativeOf(u: Unit): number {
  if (u.side === 'hero') {
    if (u.resting || !u.initiativeCard) return 99
    return card(u.initiativeCard).initiative
  }
  if (!u.intent) return 99
  return intentOf(u.enemyType, u.intent).initiative
}

function buildOrder(s: BattleState): void {
  s.order = s.units
    .filter((u) => u.alive)
    .slice()
    .sort((a, b) => {
      const ia = initiativeOf(a)
      const ib = initiativeOf(b)
      if (ia !== ib) return ia - ib
      // On a tie the hero goes first — deciding in the player's favour is right.
      if (a.side !== b.side) return a.side === 'hero' ? -1 : 1
      return a.id.localeCompare(b.id)
    })
    .map((u) => u.id)
  s.orderIndex = 0
  s.phase = 'resolution'
  advanceOrder(s)
}

/**
 * Move on through the initiative order. If a hero is next we set up their turn
 * and return (the interface asks for the decisions). If an enemy is next we stop
 * on it — the interface advances it with a button so the player can follow along.
 */
function advanceOrder(s: BattleState): void {
  while (s.orderIndex < s.order.length) {
    const id = s.order[s.orderIndex]!
    const u = unitById(s, id)

    if (!u || !u.alive) {
      s.orderIndex += 1
      continue
    }

    if (u.side === 'hero') {
      if (u.resting) {
        log(s, { k: 'restSkipsTurn', unit: u.name })
        s.orderIndex += 1
        continue
      }
      s.heroTurn = {
        heroId: id,
        topCard: null,
        bottomCard: null,
        topDone: false,
        bottomDone: false,
        active: null,
        choices: [],
        losing: [],
      }
      return
    }

    // An enemy: stop here.
    return
  }

  endRound(s)
}

// ------------------------------------------------------------ round end

/** Tick the collapsing floor. Anything standing on it is dumped aside. */
function collapseFloor(s: BattleState): void {
  const survivors: Collapsing[] = []
  for (const tile of s.collapsing) {
    tile.roundsLeft -= 1
    if (tile.roundsLeft > 0) {
      survivors.push(tile)
      continue
    }

    const standing = unitAt(s.units, tile.pos)
    if (standing) {
      // Find somewhere to dump them. If there is nowhere the floor holds one
      // more round, rather than trapping a unit inside a hole.
      const escape = neighbours(s.map, tile.pos).find(
        (c) => walkable(s.map, c) && !unitAt(s.units, c),
      )
      if (!escape) {
        tile.roundsLeft = 1
        survivors.push(tile)
        continue
      }
      dealDamage(s, null, standing, COLLAPSE_DAMAGE)
      if (standing.alive) {
        standing.pos = escape
        afterMove(s, standing)
      }
    }

    setTerrain(s.map, tile.pos, 'chasm')
    s.relics = s.relics.filter((r) => !sameTile(r, tile.pos))
    log(s, { k: 'floorGaveWay' })
  }
  s.collapsing = survivors
}

/** The module's name, tolerating an id the content no longer knows. */
function moduleName(id: string) {
  return MODULES[id as ModuleId]?.name ?? { hu: 'modul', en: 'module' }
}

/**
 * Enemies standing next to the ship's modules tear at them.
 *
 * Deliberately not an AI decision: the enemy pathing chases heroes, and teaching
 * it to weigh a module against a hero would make it either stupid or unreadable.
 * A positional rule is legible instead — if one of them is next to the reactor
 * tap at the end of the round, the reactor tap suffers, and everybody can see it
 * coming a round ahead.
 */
function wreckInstallations(s: BattleState): void {
  const left: Installation[] = []
  for (const installation of s.installations) {
    const hands = livingEnemies(s).filter((e) => distance(e.pos, installation.pos) <= 1).length
    if (hands === 0) {
      left.push(installation)
      continue
    }
    installation.hp -= hands
    if (installation.hp > 0) {
      left.push(installation)
      log(s, { k: 'installationHit', module: moduleName(installation.id), hp: installation.hp })
    } else {
      log(s, { k: 'installationLost', module: moduleName(installation.id) })
    }
  }
  s.installations = left
}

function endRound(s: BattleState): void {
  for (const u of s.units) {
    if (u.alive) tickStatuses(u)
  }
  wreckInstallations(s)
  for (const e of livingEnemies(s)) e.intent = null
  collapseFloor(s)

  // Timed objectives resolve at the end of the round they name.
  const objective = s.objective
  if (objective.k === 'survive' && s.round >= objective.rounds) {
    finish(s, 'victory')
    return
  }
  if (objective.k === 'hold' && s.round >= objective.rounds) {
    const held = s.exit !== null && livingHeroes(s).some((h) => sameTile(h.pos, s.exit!))
    log(s, held ? { k: 'heldGround' } : { k: 'lostGround' })
    finish(s, held ? 'victory' : 'defeat')
    return
  }
  if (s.roundLimit !== null && s.round >= s.roundLimit) {
    log(s, { k: 'outOfTime' })
    finish(s, 'defeat')
    return
  }

  if (checkOutcome(s)) return
  beginRound(s)
}

function finish(s: BattleState, outcome: 'victory' | 'defeat'): void {
  if (s.outcome) return
  s.outcome = outcome
  s.phase = 'over'
  s.pending = null
  s.heroTurn = null
  log(s, outcome === 'victory' ? { k: 'victory' } : { k: 'defeat' })
}

/**
 * Has the mission been decided? The objective is the only thing that differs
 * between a fight and an exploration run.
 */
function checkOutcome(s: BattleState): boolean {
  if (s.outcome) return true

  // Losing the whole party always ends it, whatever the objective.
  if (livingHeroes(s).length === 0) {
    finish(s, 'defeat')
    return true
  }

  /**
   * Is the whole party out?
   *
   * One hero standing on the extraction point used to end the mission and leave
   * the other one down there, which is not what "get out" means. The exit is a
   * single tile and two units cannot share it, so the rule is that every hero
   * still alive has to be ON it or NEXT to it: the party is at the extraction
   * point together, and whoever is left behind keeps the mission open.
   */
  const partyAtExit = () => {
    if (s.exit === null) return false
    return livingHeroes(s).every((h) => distance(h.pos, s.exit!) <= 1)
  }

  /** How many are there, for the objective read-out. */
  const atExitCount = () =>
    s.exit === null ? 0 : livingHeroes(s).filter((h) => distance(h.pos, s.exit!) <= 1).length

  switch (s.objective.k) {
    case 'eliminate':
      if (livingEnemies(s).length === 0) {
        finish(s, 'victory')
        return true
      }
      break

    case 'reachExit': {
      if (partyAtExit()) {
        log(s, { k: 'exitReached', count: atExitCount() })
        finish(s, 'victory')
        return true
      }
      break
    }

    case 'collect': {
      if (s.carried < s.objective.count) break
      if (partyAtExit()) {
        log(s, { k: 'exitReached', count: atExitCount() })
        finish(s, 'victory')
        return true
      }
      break
    }

    case 'survive':
    case 'hold':
      // Resolved at the end of the named round, in endRound.
      break
  }

  return false
}

// ------------------------------------------------------------ queries

/** The unit currently to act during the resolution phase. */
export function activeUnit(s: BattleState): Unit | undefined {
  if (s.phase !== 'resolution') return undefined
  const id = s.order[s.orderIndex]
  return id ? unitById(s, id) : undefined
}

/**
 * How many living heroes are at the extraction point, and how many there are.
 *
 * The same rule `checkOutcome` uses — on it or next to it — exported so the
 * objective read-out can say "1 / 2" instead of leaving the players to guess why
 * the mission has not ended.
 */
export function atExit(s: BattleState): { there: number; total: number } {
  const living = livingHeroes(s)
  if (s.exit === null) return { there: 0, total: living.length }
  return {
    there: living.filter((h) => distance(h.pos, s.exit!) <= 1).length,
    total: living.length,
  }
}

/** Must this hero rest? (Fewer cards in hand than they have to play.) */
export function mustRest(h: Hero): boolean {
  return h.hand.length < CARDS_PER_ROUND
}

/** Can this hero rest at all? (Is there anything to bring back?) */
export function canRest(h: Hero): boolean {
  return h.discard.length > 0
}

/** How the mission ended, in a form the expedition layer can apply. */
export type MissionResult = {
  outcome: 'victory' | 'defeat'
  rounds: number
  relicsCollected: number
  enemiesDefeated: number
  /** Did anybody fall or burn out? The ship pays for that. */
  casualties: number
  /**
   * Modules torn apart during a boarding action. Gone for the rest of the
   * expedition — the briefing said so.
   */
  modulesLost: string[]
  heroes: CarriedHero[]
}

export function missionResult(s: BattleState): MissionResult {
  // A turn interrupted by the mission ending still has its cards in hand and its
  // "lost on use" marks only in the turn record. Honour them here, or a card that
  // should be gone for good reappears in the discard pile.
  const losing = s.heroTurn?.losing ?? []
  return {
    outcome: s.outcome ?? 'defeat',
    rounds: s.round,
    relicsCollected: s.carried,
    enemiesDefeated: s.units.filter((u) => u.side === 'enemy' && !u.alive).length,
    casualties: heroes(s).filter((h) => !h.alive).length,
    // Whatever is no longer standing was destroyed: the list only shrinks.
    modulesLost: (s.setupInstallations ?? []).filter(
      (id) => !s.installations.some((i) => i.id === id),
    ),
    heroes: heroes(s).map((h) => ({
      heroClass: h.heroClass,
      // A hero who fell or burned out comes back at 1 hit point: the ship
      // patches them up, but the expedition still pays for it.
      hp: h.alive ? h.hp : 1,
      // The two selected cards are still sitting in the hand until the turn
      // wraps up, so a battle that ends mid-turn would otherwise hand the
      // expedition the same card twice — once in hand and once in the discard.
      hand: h.hand.filter((cardId) => !h.selected.includes(cardId)),
      // Cards still in play count as spent, not lost — recovering the discard
      // pile is what the ship's rest between landings is for. Anything the turn
      // already marked as lost stays lost.
      discard: [...h.discard, ...h.selected.filter((cardId) => !losing.includes(cardId))],
      lost: [...h.lost, ...h.selected.filter((cardId) => losing.includes(cardId))],
    })),
  }
}

// ------------------------------------------------------------ turn wrap-up

function finishHeroTurn(s: BattleState): void {
  const turn = s.heroTurn
  if (!turn) return
  const h = unitById(s, turn.heroId)
  if (h && h.side === 'hero') {
    for (const cardId of h.selected) {
      const index = h.hand.indexOf(cardId)
      if (index >= 0) h.hand.splice(index, 1)
      if (turn.losing.includes(cardId)) h.lost.push(cardId)
      else h.discard.push(cardId)
    }
    h.selected = []
  }
  s.heroTurn = null
  s.pending = null
  s.orderIndex += 1
  advanceOrder(s)
}

// ------------------------------------------------------------ reducer

export function step(previous: BattleState, action: Action): BattleState {
  if (previous.phase === 'over') return previous
  const s = clone(previous)

  switch (action.k) {
    case 'selectCard': {
      if (s.phase !== 'cardSelection' || s.selectingHero !== action.heroId) break
      const h = unitById(s, action.heroId)
      if (!h || h.side !== 'hero' || h.resting) break
      if (!h.hand.includes(action.cardId)) break
      const index = h.selected.indexOf(action.cardId)
      if (index >= 0) {
        h.selected.splice(index, 1)
        if (h.initiativeCard === action.cardId) h.initiativeCard = null
      } else if (h.selected.length < CARDS_PER_ROUND) {
        h.selected.push(action.cardId)
        // Convenience: the first card automatically provides the initiative.
        if (h.initiativeCard === null) h.initiativeCard = action.cardId
      }
      break
    }

    case 'setInitiativeCard': {
      if (s.phase !== 'cardSelection' || s.selectingHero !== action.heroId) break
      const h = unitById(s, action.heroId)
      if (!h || h.side !== 'hero') break
      if (h.selected.includes(action.cardId)) h.initiativeCard = action.cardId
      break
    }

    case 'rest': {
      if (s.phase !== 'cardSelection' || s.selectingHero !== action.heroId) break
      const h = unitById(s, action.heroId)
      if (!h || h.side !== 'hero') break
      if (!h.discard.includes(action.loseCard)) break

      h.discard = h.discard.filter((id) => id !== action.loseCard)
      h.lost.push(action.loseCard)
      h.hand.push(...h.discard)
      h.discard = []
      h.selected = []
      h.initiativeCard = null
      h.resting = true
      heal(s, h, REST_HEAL)
      log(s, { k: 'rested', unit: h.name, lostCard: card(action.loseCard).name })
      break
    }

    case 'confirmSelection': {
      if (s.phase !== 'cardSelection' || s.selectingHero !== action.heroId) break
      const h = unitById(s, action.heroId)
      if (!h || h.side !== 'hero') break
      if (!h.resting && (h.selected.length !== CARDS_PER_ROUND || !h.initiativeCard)) break

      const waiting = livingHeroes(s)
      const index = waiting.findIndex((x) => x.id === action.heroId)
      const next = waiting
        .slice(index + 1)
        .find((x) => !x.resting && x.selected.length !== CARDS_PER_ROUND)
      if (next) {
        s.selectingHero = next.id
      } else {
        s.selectingHero = null
        buildOrder(s)
      }
      break
    }

    case 'assignTopCard': {
      const turn = s.heroTurn
      if (!turn || turn.active) break
      const h = unitById(s, turn.heroId)
      if (!h || h.side !== 'hero') break
      if (!h.selected.includes(action.cardId)) break
      if (turn.topDone || turn.bottomDone) break
      turn.topCard = action.cardId
      turn.bottomCard = h.selected.find((id) => id !== action.cardId) ?? null
      break
    }

    case 'playHalf': {
      const turn = s.heroTurn
      if (!turn || turn.active) break
      if (action.half === 'top' && turn.topDone) break
      if (action.half === 'bottom' && turn.bottomDone) break
      const cardId = action.half === 'top' ? turn.topCard : turn.bottomCard
      if (!cardId) break
      const half = action.half === 'top' ? card(cardId).top : card(cardId).bottom
      const cost = half.flux ?? 0
      if (cost > s.flux) break

      if (cost > 0) {
        s.flux -= cost
        log(s, { k: 'fluxSpent', card: card(cardId).name, amount: cost, remaining: s.flux })
      }
      if (half.lostOnUse && !turn.losing.includes(cardId)) turn.losing.push(cardId)

      turn.active = { cardId, half: action.half, effects: [...half.effects], index: 0 }
      turn.choices = []
      resolveEffects(s)
      break
    }

    case 'choose': {
      const turn = s.heroTurn
      if (!turn || !s.pending) break
      if (!s.pending.options.includes(action.value)) break
      turn.choices.push(action.value)
      resolveEffects(s)
      break
    }

    case 'skipHalf': {
      const turn = s.heroTurn
      if (!turn || turn.active) break
      if (action.half === 'top') turn.topDone = true
      else turn.bottomDone = true
      break
    }

    case 'endTurn': {
      const turn = s.heroTurn
      if (!turn || turn.active) break
      finishHeroTurn(s)
      break
    }

    case 'editTerrain': {
      const at = fromTileKey(action.tile)
      if (!onMap(s.map, at)) break
      // The one thing the tool must not do is create the problem it exists to
      // solve: burying a unit, a relic or the way out under something solid.
      const solid = action.kind !== 'floor' && action.kind !== 'ash'
      if (solid) {
        if (unitAt(s.units, at)) break
        if (s.relics.some((r) => sameTile(r, at))) break
        if (s.exit && sameTile(s.exit, at)) break
      }
      if (terrainAt(s.map, at) === action.kind) break
      setTerrain(s.map, at, action.kind)
      // A hole is a hole: a tile that becomes one stops being scheduled to.
      if (action.kind === 'chasm') s.collapsing = s.collapsing.filter((c) => !sameTile(c.pos, at))
      log(s, { k: 'terrainEdited', kind: action.kind })
      break
    }

    case 'advanceEnemy': {
      const u = activeUnit(s)
      if (!u || u.side !== 'enemy') break
      enemyTurn(s, u)
      s.orderIndex += 1
      if (!checkOutcome(s)) advanceOrder(s)
      break
    }
  }

  checkOutcome(s)
  return s
}

/** Tile keys the interface should mark as objective-relevant. */
export function objectiveTiles(s: BattleState): { relics: string[]; exit: string | null } {
  return {
    relics: s.relics.map(tileKey),
    exit: s.exit ? tileKey(s.exit) : null,
  }
}
