// Star map generation.
//
// Columns of systems with forward links, like FTL's sector map. You always
// choose which way to go, so route selection is a real strategic decision — but
// the map is generated, so no two expeditions run the same road.
//
// Every node's content is decided HERE, at generation time, from the seed. That
// keeps the weekly turn free of hidden randomness and makes a whole expedition
// reproducible from its seed.

import { createRng, type Rng } from '../rng'
import { encountersFor } from '../../content/encounters'
import { generateCrewMember } from '../../content/crew'
import { MODULE_ORDER } from '../../content/ship'
import { STARTING_PUZZLE_KINDS } from '../puzzles/index'
import type { EncounterTag } from '../../content/encounters'
import type { ModuleId, ResourceId } from '../../content/ship'
import type { PuzzleKind } from '../puzzles/types'
import type { Objective, Text } from '../types'
import type {
  ExpeditionLength,
  MapNode,
  MarketOffer,
  MissionSpec,
  NodeEvent,
  NodeKind,
  Reward,
  StarMap,
} from './types'

/** How long the road is, and how many weeks the Gate allows. */
export const LENGTHS: Record<ExpeditionLength, { columns: number; weeks: number }> = {
  short: { columns: 8, weeks: 20 },
  medium: { columns: 10, weeks: 28 },
  long: { columns: 13, weeks: 40 },
}

// Invented system names. No real language, so the map never needs translating.
const NAME_HEAD = [
  'Orva', 'Thar', 'Sel', 'Kelun', 'Vesk', 'Ammo', 'Ilder', 'Brann', 'Que', 'Nyr',
  'Sedd', 'Halo', 'Ostre', 'Marn', 'Zeth', 'Cor', 'Uvel', 'Pallo', 'Rhen', 'Ythe',
]
const NAME_TAIL = ['', 'th', 'is', 'or', 'an', 'ex', 'ai', 'un', 'el', 'os']
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function systemName(rng: Rng): string {
  const base = `${rng.pick(NAME_HEAD)}${rng.pick(NAME_TAIL)}`
  const roll = rng.next()
  if (roll < 0.4) return `${base} ${rng.pick(NUMERALS)}`
  if (roll < 0.6) return `${base}-${rng.between(2, 99)}`
  return base
}

export const KIND_TAGS: Record<NodeKind, EncounterTag[]> = {
  empty: ['drift'],
  ruins: ['ruins'],
  station: ['station', 'trade'],
  anomaly: ['anomaly'],
  world: ['world'],
  trade: ['trade', 'station'],
  distress: ['distress'],
  heart: ['ruins'],
}

/**
 * What kinds turn up at a given depth. The far end of the map is emptier and
 * more dangerous: fewer stations, more ruins and anomalies.
 */
function kindFor(rng: Rng, column: number, columns: number): NodeKind {
  const depth = column / Math.max(1, columns - 1)
  const table: { kind: NodeKind; weight: number }[] = [
    { kind: 'ruins', weight: 18 + depth * 14 },
    { kind: 'anomaly', weight: 12 + depth * 10 },
    { kind: 'world', weight: 14 - depth * 6 },
    { kind: 'station', weight: 12 - depth * 6 },
    { kind: 'trade', weight: 10 - depth * 5 },
    { kind: 'distress', weight: 9 },
    { kind: 'empty', weight: 8 + depth * 4 },
  ]
  const total = table.reduce((sum, t) => sum + Math.max(1, t.weight), 0)
  let roll = rng.next() * total
  for (const t of table) {
    roll -= Math.max(1, t.weight)
    if (roll <= 0) return t.kind
  }
  return 'empty'
}

// ---------------------------------------------------------------- missions

const OBJECTIVE_BRIEFINGS: Record<Objective['k'], Text> = {
  eliminate: {
    hu: 'Nem lehet mellette elmenni. Ki kell tisztítani a helyszínt.',
    en: 'There is no getting past it. The site has to be cleared.',
  },
  reachExit: {
    hu: 'Nem kell megküzdeni velük. El kell jutni a kijelölt pontra, mielőtt beszakad a padló.',
    en: 'You do not have to fight them. You have to reach the marked point before the floor gives way.',
  },
  collect: {
    hu: 'Össze kell szedni az ereklyéket, aztán ki a kimenekítési ponton. Amit ott hagytok, az odalent marad.',
    en: 'Collect the relics, then out through the extraction point. What you leave behind stays down there.',
  },
  survive: {
    hu: 'Csak ki kell tartani. Nem fogynak el — csak az idő fogy.',
    en: 'You only have to hold out. They will not run out — only the clock will.',
  },
  hold: {
    hu: 'A jelölt pontot kell megtartani a kijelölt körig. Nem elég odaérni: ott is kell lenni a végén.',
    en: 'Hold the marked point until the named round. Reaching it is not enough — you have to be on it at the end.',
  },
}

function missionFor(rng: Rng, column: number, columns: number, darkeningHint: number): MissionSpec {
  const depth = column / Math.max(1, columns - 1)
  const difficulty = Math.min(3, 1 + Math.floor(depth * 2 + darkeningHint * 0.5))

  const roll = rng.next()
  let objective: Objective
  let kind: MissionSpec['kind'] = 'combat'
  let enemyScale = 1
  let roundLimit: number | null = null

  if (roll < 0.34) {
    objective = { k: 'eliminate' }
  } else if (roll < 0.55) {
    objective = { k: 'collect', count: rng.between(2, 3) }
    kind = 'exploration'
    enemyScale = 0.4
    roundLimit = 16
  } else if (roll < 0.72) {
    objective = { k: 'reachExit' }
    kind = 'exploration'
    enemyScale = 0.3
    roundLimit = 12
  } else if (roll < 0.87) {
    objective = { k: 'survive', rounds: rng.between(5, 7) }
  } else {
    objective = { k: 'hold', rounds: rng.between(5, 7) }
  }

  const rewards: Reward[] = [
    { k: 'resource', id: 'credits', amount: 4 + difficulty * 3 },
    { k: 'archive', amount: 1 },
  ]
  if (objective.k === 'collect') {
    rewards.push({ k: 'resource', id: 'information', amount: 2 + objective.count })
  }
  if (rng.next() < 0.3) rewards.push({ k: 'understanding', amount: 1 })
  if (rng.next() < 0.35) {
    const id: ResourceId = rng.next() < 0.5 ? 'fuel' : 'food'
    rewards.push({ k: 'resource', id, amount: 5 })
  }

  return {
    kind,
    objective,
    difficulty,
    enemyScale,
    roundLimit,
    rewards,
    briefing: OBJECTIVE_BRIEFINGS[objective.k],
  }
}

const PUZZLE_BRIEFING: Text = {
  hu: 'A szerkezet nem támad és nem nyitható erővel. Le kell ülni elé, és megérteni.',
  en: 'The mechanism does not attack and cannot be forced. You have to sit down in front of it and understand it.',
}

function puzzleEvent(rng: Rng, column: number, columns: number, kinds: readonly PuzzleKind[]): NodeEvent {
  const depth = column / Math.max(1, columns - 1)
  const difficulty = Math.min(3, 1 + Math.floor(depth * 2))
  const rewards: Reward[] = [{ k: 'archive', amount: 1 }]
  const roll = rng.next()
  if (roll < 0.3) rewards.push({ k: 'resource', id: 'information', amount: 4 + difficulty * 2 })
  else if (roll < 0.6) rewards.push({ k: 'resource', id: 'credits', amount: 8 + difficulty * 3 })
  else if (roll < 0.8) rewards.push({ k: 'understanding', amount: 2 })
  else rewards.push({ k: 'revealMap', columns: 2 })

  return {
    k: 'puzzle',
    kind: rng.pick(kinds) ?? 'runeDecode',
    difficulty,
    rewards,
    briefing: PUZZLE_BRIEFING,
  }
}

function marketEvent(rng: Rng, column: number, id: string): NodeEvent {
  const offers: MarketOffer[] = []
  const count = rng.between(2, 4)

  for (let i = 0; i < count; i++) {
    const roll = rng.next()
    if (roll < 0.5) {
      const pool: { id: ResourceId; amount: number; price: number }[] = [
        { id: 'fuel', amount: 8, price: 10 },
        { id: 'food', amount: 12, price: 8 },
        { id: 'hull', amount: 6, price: 12 },
        { id: 'information', amount: 5, price: 9 },
      ]
      const pick = rng.pick(pool)!
      offers.push({ item: { k: 'resource', ...pick }, price: pick.price, bought: false })
    } else if (roll < 0.75) {
      const moduleId = rng.pick(MODULE_ORDER) as ModuleId
      offers.push({ item: { k: 'module', id: moduleId }, price: 22 + column * 2, bought: false })
    } else {
      const member = generateCrewMember(rng, `${id}-hire-${i}`)
      offers.push({ item: { k: 'crew', member }, price: 10 + column, bought: false })
    }
  }

  return { k: 'market', offers }
}

function eventFor(
  rng: Rng,
  kind: NodeKind,
  column: number,
  columns: number,
  nodeId: string,
  puzzleKinds: readonly PuzzleKind[],
  archiveOpen: boolean,
  usedOnce: string[],
): NodeEvent {
  if (kind === 'heart') return { k: 'heart' }
  if (kind === 'empty') return { k: 'none' }
  if (kind === 'trade') return marketEvent(rng, column, nodeId)

  const tags = KIND_TAGS[kind]
  const roll = rng.next()

  if (kind === 'ruins') {
    if (roll < 0.45) return { k: 'mission', spec: missionFor(rng, column, columns, 0) }
    if (roll < 0.7) return puzzleEvent(rng, column, columns, puzzleKinds)
  } else if (kind === 'anomaly') {
    if (roll < 0.45) return puzzleEvent(rng, column, columns, puzzleKinds)
  } else if (kind === 'station') {
    if (roll < 0.4) return marketEvent(rng, column, nodeId)
  }

  const candidates = encountersFor(tags, usedOnce, archiveOpen)
  const chosen = rng.pick(candidates)
  if (!chosen) return { k: 'none' }
  if (chosen.once) usedOnce.push(chosen.id)
  return { k: 'encounter', encounterId: chosen.id }
}

// ---------------------------------------------------------------- generation

export function generateStarMap(
  seed: number,
  length: ExpeditionLength,
  puzzleKinds: readonly PuzzleKind[] = STARTING_PUZZLE_KINDS,
  archiveOpen = false,
): StarMap {
  const rng = createRng(seed * 31 + 17)
  const columns = LENGTHS[length].columns
  const nodes: MapNode[] = []
  const byColumn: MapNode[][] = []
  const usedOnce: string[] = []

  for (let column = 0; column < columns; column++) {
    const isFirst = column === 0
    const isLast = column === columns - 1
    const count = isFirst || isLast ? 1 : rng.between(2, 4)
    const columnNodes: MapNode[] = []

    for (let row = 0; row < count; row++) {
      const id = `n${column}-${row}`
      const kind: NodeKind = isLast ? 'heart' : isFirst ? 'empty' : kindFor(rng, column, columns)
      columnNodes.push({
        id,
        name: isLast ? 'Csillagsír / Stargrave' : systemName(rng),
        kind,
        column,
        row,
        links: [],
        linkWeeks: [],
        visited: isFirst,
        known: column <= 1,
        event: { k: 'none' },
        resolved: false,
        tags: KIND_TAGS[kind],
      })
    }

    byColumn.push(columnNodes)
    nodes.push(...columnNodes)
  }

  // Forward links. Every node gets at least one way on, and every node in the
  // next column gets at least one way in — otherwise part of the map would be
  // unreachable, which is just a worse map.
  for (let column = 0; column < columns - 1; column++) {
    const here = byColumn[column]!
    const next = byColumn[column + 1]!

    for (const node of here) {
      const wanted = next.length === 1 ? 1 : rng.between(1, Math.min(2, next.length))
      const sorted = [...next].sort(
        (a, b) => Math.abs(a.row - node.row) - Math.abs(b.row - node.row),
      )
      for (const target of sorted.slice(0, wanted)) {
        if (node.links.includes(target.id)) continue
        node.links.push(target.id)
        node.linkWeeks.push(rng.between(1, 3))
      }
    }

    // Anything unreachable gets an inbound link from the closest neighbour.
    for (const target of next) {
      if (here.some((n) => n.links.includes(target.id))) continue
      const from = [...here].sort(
        (a, b) => Math.abs(a.row - target.row) - Math.abs(b.row - target.row),
      )[0]!
      from.links.push(target.id)
      from.linkWeeks.push(rng.between(1, 3))
    }
  }

  // Now the content, once the shape is settled.
  for (const node of nodes) {
    node.event = eventFor(
      rng,
      node.kind,
      node.column,
      columns,
      node.id,
      puzzleKinds,
      archiveOpen,
      usedOnce,
    )
  }

  return {
    columns,
    nodes,
    entryId: byColumn[0]![0]!.id,
    heartId: byColumn[columns - 1]![0]!.id,
  }
}

export function mapNode(map: StarMap, id: string): MapNode {
  const node = map.nodes.find((n) => n.id === id)
  if (!node) throw new Error(`No such map node: ${id}`)
  return node
}

/** Reveal node kinds up to `columns` ahead of where the ship is. */
export function revealAhead(map: StarMap, fromId: string, columns: number): number {
  const from = mapNode(map, fromId)
  let revealed = 0
  for (const node of map.nodes) {
    if (node.known) continue
    if (node.column > from.column && node.column <= from.column + columns) {
      node.known = true
      revealed += 1
    }
  }
  return revealed
}
