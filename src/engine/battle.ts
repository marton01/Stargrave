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
import { createRng } from './rng'
import { afterMove, dealDamage, heal } from './combat'
import { enemyTurn } from './enemyAi'
import { allTiles, distance, neighbours, sameTile, setTerrain, tileKey, unitAt, walkable } from './grid'
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
  Objective,
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
  /** Hard round limit; the mission fails when it runs out. */
  roundLimit?: number | null
  /** Hero state carried in from the expedition. */
  heroes?: CarriedHero[]
  /** Scale the enemy count — exploration missions field far fewer. */
  enemyScale?: number
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

  const slots: { heroClass: HeroClassId; playerSlot: 1 | 2 }[] = [
    { heroClass: 'runesmith', playerSlot: 1 },
    { heroClass: 'echoreader', playerSlot: 2 },
  ]

  const heroUnits: Hero[] = slots.map((slot, i) => {
    const cls = HERO_CLASSES[slot.heroClass]
    const carried = setup.heroes?.find((h) => h.heroClass === slot.heroClass)
    return {
      id: `hero-${slot.heroClass}`,
      side: 'hero',
      name: cls.name,
      heroClass: slot.heroClass,
      playerSlot: slot.playerSlot,
      pos: heroSpawns[i] ?? heroSpawns[0] ?? { x: 0, y: 0 },
      hp: carried ? Math.max(1, Math.min(cls.hp, carried.hp)) : cls.hp,
      maxHp: cls.hp,
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

function endRound(s: BattleState): void {
  for (const u of s.units) {
    if (u.alive) tickStatuses(u)
  }
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

  const heroOnExit = () =>
    s.exit !== null ? livingHeroes(s).find((h) => sameTile(h.pos, s.exit!)) : undefined

  switch (s.objective.k) {
    case 'eliminate':
      if (livingEnemies(s).length === 0) {
        finish(s, 'victory')
        return true
      }
      break

    case 'reachExit': {
      const who = heroOnExit()
      if (who) {
        log(s, { k: 'exitReached', unit: who.name })
        finish(s, 'victory')
        return true
      }
      break
    }

    case 'collect': {
      if (s.carried < s.objective.count) break
      const who = heroOnExit()
      if (who) {
        log(s, { k: 'exitReached', unit: who.name })
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
