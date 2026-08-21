// Grid operations: distance, adjacency, line of sight, reachable tiles.
//
// Square grid, movement in 8 directions, Chebyshev distance (a diagonal step
// counts as 1).

import type { Coord, Unit, BattleMap, TerrainKind } from './types'

export function tileKey(c: Coord): string {
  return `${c.x},${c.y}`
}

export function fromTileKey(key: string): Coord {
  const [x, y] = key.split(',')
  return { x: Number(x), y: Number(y) }
}

export function sameTile(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y
}

/** Chebyshev distance: a diagonal step counts as 1. */
export function distance(a: Coord, b: Coord): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}

export function onMap(map: BattleMap, c: Coord): boolean {
  return c.x >= 0 && c.y >= 0 && c.x < map.width && c.y < map.height
}

export function terrainAt(map: BattleMap, c: Coord): TerrainKind {
  if (!onMap(map, c)) return 'wall'
  return map.tiles[c.y * map.width + c.x]!
}

export function setTerrain(map: BattleMap, c: Coord, kind: TerrainKind): void {
  if (!onMap(map, c)) return
  map.tiles[c.y * map.width + c.x] = kind
}

/** Can a unit stand on this terrain (ignoring other units)? */
export function walkable(map: BattleMap, c: Coord): boolean {
  const t = terrainAt(map, c)
  return t === 'floor' || t === 'ash'
}

/**
 * Can every walkable tile still be reached from this one?
 *
 * Asked three times, for the same reason each time: a battlefield cut in two is
 * a mission nobody can finish. The generator asks it after dropping an obstacle,
 * the rune pillar asks it before offering a tile, and the collapsing floor asks
 * it before scheduling one. A pillar is permanent and a chasm does not heal, so
 * there is no undoing either of them from inside the battle: the party simply
 * runs out of cards and burns out one by one.
 */
export function fullyConnected(map: BattleMap, from: Coord): boolean {
  const seen = new Set<string>([tileKey(from)])
  let frontier = [from]
  while (frontier.length > 0) {
    const next: Coord[] = []
    for (const c of frontier) {
      for (const n of neighbours(map, c)) {
        if (!walkable(map, n)) continue
        // The same rule movement obeys, and the reason this check exists at all:
        // a corner that only touches diagonally between two walls looks like a
        // way through and is not one. Asking a looser question here was how a
        // sealed-off pocket could pass generation and then be unreachable on the
        // board — see `diagonalFits` and `reachableTiles`.
        if (!diagonalFits(map, c, n)) continue
        const key = tileKey(n)
        if (seen.has(key)) continue
        seen.add(key)
        next.push(n)
      }
    }
    frontier = next
  }
  return seen.size === allTiles(map).filter((c) => walkable(map, c)).length
}

/**
 * Would turning this tile into `kind` cut the map in two?
 *
 * The map is changed and changed back rather than copied: a battle map is a flat
 * array and the caller is asking about dozens of candidate tiles.
 */
export function wouldDisconnect(map: BattleMap, c: Coord, kind: TerrainKind, from: Coord): boolean {
  const original = terrainAt(map, c)
  setTerrain(map, c, kind)
  const connected = fullyConnected(map, from)
  setTerrain(map, c, original)
  return !connected
}

/** How much movement it costs to enter this tile. */
export function moveCost(map: BattleMap, c: Coord): number {
  return terrainAt(map, c) === 'ash' ? 2 : 1
}

/** Does this tile block line of sight (and therefore ranged attacks)? */
export function blocksSight(map: BattleMap, c: Coord): boolean {
  const t = terrainAt(map, c)
  return t === 'wall' || t === 'pillar'
}

/** The 8 adjacent tiles that are still on the map. */
export function neighbours(map: BattleMap, c: Coord): Coord[] {
  const out: Coord[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const p = { x: c.x + dx, y: c.y + dy }
      if (onMap(map, p)) out.push(p)
    }
  }
  return out
}

/**
 * Is there a clear line of sight between two tiles?
 *
 * Simple sampling along the segment between the two tile centres. Not
 * mathematically perfect, but it matches what the player's eye expects — and
 * being predictable matters more here than being elegant.
 */
export function hasLineOfSight(map: BattleMap, a: Coord, b: Coord): boolean {
  if (sameTile(a, b)) return true
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 3
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const p = { x: Math.round(a.x + (b.x - a.x) * t), y: Math.round(a.y + (b.y - a.y) * t) }
    if (sameTile(p, a) || sameTile(p, b)) continue
    if (blocksSight(map, p)) return false
  }
  return true
}

/**
 * You cannot cut diagonally between two blocking tiles.
 * This is the rule that makes diagonal movement feel fair.
 */
export function diagonalFits(map: BattleMap, from: Coord, to: Coord): boolean {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 0 || dy === 0) return true
  return walkable(map, { x: from.x + dx, y: from.y }) || walkable(map, { x: from.x, y: from.y + dy })
}

/**
 * Which tiles can this unit reach with the given movement?
 * Returns tile key -> cost, including the starting tile at cost 0.
 */
export function reachableTiles(
  map: BattleMap,
  units: readonly Unit[],
  from: Coord,
  movement: number,
): Map<string, number> {
  const occupied = new Set(units.filter((u) => u.alive).map((u) => tileKey(u.pos)))
  const cost = new Map<string, number>([[tileKey(from), 0]])
  // Plain Dijkstra: the tile count is tiny (10x10), no heap needed.
  let frontier: Coord[] = [from]

  while (frontier.length > 0) {
    const nextFrontier: Coord[] = []
    for (const c of frontier) {
      const soFar = cost.get(tileKey(c))!
      for (const n of neighbours(map, c)) {
        if (!walkable(map, n)) continue
        if (!diagonalFits(map, c, n)) continue
        const key = tileKey(n)
        if (occupied.has(key)) continue
        const candidate = soFar + moveCost(map, n)
        if (candidate > movement) continue
        const existing = cost.get(key)
        if (existing === undefined || candidate < existing) {
          cost.set(key, candidate)
          nextFrontier.push(n)
        }
      }
    }
    frontier = nextFrontier
  }

  return cost
}

/**
 * Enemy pathing: which reachable tile is the best place to attack from?
 * Prefers landing exactly at the desired range, then spending less movement.
 */
export function bestTileTowards(
  map: BattleMap,
  units: readonly Unit[],
  from: Coord,
  movement: number,
  target: Coord,
  desiredRange: number,
): Coord {
  const reachable = reachableTiles(map, units, from, movement)
  let best = from
  let bestScore = Number.POSITIVE_INFINITY

  for (const [key, cost] of reachable) {
    const c = fromTileKey(key)
    const dist = distance(c, target)
    const rangeMiss = Math.max(0, dist - desiredRange)
    const score = rangeMiss * 100 + (dist > desiredRange ? 0 : 1) * 10 + cost * 0.1
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }

  return best
}

/** Is the tile free (walkable terrain and no living unit on it)? */
export function tileFree(map: BattleMap, units: readonly Unit[], c: Coord): boolean {
  if (!walkable(map, c)) return false
  return !units.some((u) => u.alive && sameTile(u.pos, c))
}

/** Who is standing on this tile? */
export function unitAt(units: readonly Unit[], c: Coord): Unit | undefined {
  return units.find((u) => u.alive && sameTile(u.pos, c))
}

/** Every tile of the map, row by row. */
export function allTiles(map: BattleMap): Coord[] {
  const out: Coord[] = []
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) out.push({ x, y })
  }
  return out
}
