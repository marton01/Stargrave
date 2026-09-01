// Procedural battlefield generation from a room kit.
//
// The goal is not a pretty maze but tactically interesting ground: there should
// be cover, there should be a way around, and there should be a tile worth
// fighting over.

import {
  allTiles,
  distance,
  fullyConnected,
  sameTile,
  setTerrain,
  terrainAt,
  tileKey,
  walkable,
  wouldDisconnect,
} from './grid'
import type { Rng } from './rng'
import type { Collapsing, Coord, BattleMap, Objective } from './types'

export const MAP_WIDTH = 10
export const MAP_HEIGHT = 10

export type GeneratedMap = {
  map: BattleMap
  heroSpawns: Coord[]
  enemySpawns: Coord[]
}

type Room = { x: number; y: number; w: number; h: number }

function roomCentre(r: Room): Coord {
  return { x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) }
}

function roomTiles(r: Room): Coord[] {
  const out: Coord[] = []
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) out.push({ x, y })
  }
  return out
}

/**
 * @param partySize how many heroes need somewhere to stand. Two for most of the
 * game's life; up to four once more than two people are playing. The spawns come
 * out of one room so the party starts together — that is what the Bond is for —
 * and they are always distinct tiles, because two heroes on one tile is a state
 * nothing else in the engine expects.
 */
export function generateMap(rng: Rng, enemyCount: number, partySize = 2): GeneratedMap {
  const map: BattleMap = {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tiles: new Array<BattleMap['tiles'][number]>(MAP_WIDTH * MAP_HEIGHT).fill('wall'),
  }

  // One room per quadrant. That guarantees they are spread out and leaves space
  // for the corridors.
  const quadrants: Room[] = [
    { x: 0, y: 0, w: 5, h: 5 },
    { x: 5, y: 0, w: 5, h: 5 },
    { x: 0, y: 5, w: 5, h: 5 },
    { x: 5, y: 5, w: 5, h: 5 },
  ]

  const rooms: Room[] = quadrants.map((q) => {
    const w = rng.between(3, 4)
    const h = rng.between(3, 4)
    return {
      x: q.x + rng.between(0, q.w - w),
      y: q.y + rng.between(0, q.h - h),
      w,
      h,
    }
  })

  for (const r of rooms) {
    for (const c of roomTiles(r)) setTerrain(map, c, 'floor')
  }

  // Corridors: carve an L shape between adjacent room centres.
  const carve = (a: Coord, b: Coord) => {
    let { x, y } = a
    while (x !== b.x) {
      x += Math.sign(b.x - x)
      setTerrain(map, { x, y }, 'floor')
    }
    while (y !== b.y) {
      y += Math.sign(b.y - y)
      setTerrain(map, { x, y }, 'floor')
    }
  }

  const centres = rooms.map(roomCentre)
  carve(centres[0]!, centres[1]!)
  carve(centres[1]!, centres[3]!)
  carve(centres[3]!, centres[2]!)
  carve(centres[2]!, centres[0]!)

  // Heroes start in a randomly chosen room, enemies in the others.
  const heroRoomIndex = rng.int(rooms.length)
  const heroRoom = rooms[heroRoomIndex]!
  const heroCentre = roomCentre(heroRoom)

  const wanted = Math.max(1, partySize)
  const inRoom = roomTiles(heroRoom)
    .filter((c) => walkable(map, c))
    .sort((a, b) => distance(a, heroCentre) - distance(b, heroCentre))
  // A room this small is possible in principle; spilling into the nearest
  // walkable ground outside it beats stacking two heroes on one tile.
  const spillover = allTiles(map)
    .filter((c) => walkable(map, c) && !inRoom.some((h) => sameTile(h, c)))
    .sort((a, b) => distance(a, heroCentre) - distance(b, heroCentre))
  const heroSpawns = [...inRoom, ...spillover].slice(0, wanted)

  const enemyCandidates = rooms
    .filter((_, i) => i !== heroRoomIndex)
    .flatMap((r) => rng.shuffle(roomTiles(r).filter((c) => walkable(map, c))))
    // Do not let them spawn right on top of the heroes.
    .filter((c) => heroSpawns.every((h) => distance(c, h) >= 3))

  const enemySpawns: Coord[] = []
  for (const c of rng.shuffle(enemyCandidates)) {
    if (enemySpawns.length >= enemyCount) break
    if (enemySpawns.some((e) => sameTile(e, c))) continue
    enemySpawns.push(c)
  }

  // Terrain scattering. After every obstacle we check that the map has not been
  // cut in two — if it has, we undo it. An unsolvable map is worse than a plain
  // one.
  const protectedTiles = new Set([...heroSpawns, ...enemySpawns].map(tileKey))
  const scatterable = allTiles(map).filter(
    (c) => terrainAt(map, c) === 'floor' && !protectedTiles.has(tileKey(c)),
  )

  const obstacles: { kind: 'chasm' | 'pillar' | 'ash'; chance: number }[] = [
    { kind: 'ash', chance: 0.12 },
    { kind: 'pillar', chance: 0.06 },
    { kind: 'chasm', chance: 0.05 },
  ]

  for (const c of rng.shuffle(scatterable)) {
    const roll = rng.next()
    let sum = 0
    for (const o of obstacles) {
      sum += o.chance
      if (roll < sum) {
        const original = terrainAt(map, c)
        setTerrain(map, c, o.kind)
        // Ash stays walkable, so it can never cut anything off.
        if (o.kind !== 'ash' && !fullyConnected(map, heroSpawns[0]!)) {
          setTerrain(map, c, original)
        }
        break
      }
    }
  }

  return { map, heroSpawns, enemySpawns }
}

// ---------------------------------------------------------------- mission features
//
// Relics, an extraction tile and collapsing floor. These are what turn the same
// battlefield into an exploration mission rather than a fight, so they are
// generated separately from the map itself.


export type MissionFeatures = {
  relics: Coord[]
  exit: Coord | null
  collapsing: Collapsing[]
}

export function generateMissionFeatures(
  rng: Rng,
  map: BattleMap,
  heroSpawns: readonly Coord[],
  enemySpawns: readonly Coord[],
  objective: Objective,
): MissionFeatures {
  const taken = new Set([...heroSpawns, ...enemySpawns].map(tileKey))
  const free = allTiles(map).filter((c) => walkable(map, c) && !taken.has(tileKey(c)))
  const home = heroSpawns[0] ?? { x: 0, y: 0 }

  // The exit sits far from where the party lands — otherwise "reach the exit"
  // would be solved on the first turn.
  const far = [...free].sort((a, b) => distance(b, home) - distance(a, home))
  const needsExit =
    objective.k === 'reachExit' || objective.k === 'collect' || objective.k === 'hold'
  const exit = needsExit ? (far[0] ?? null) : null
  if (exit) taken.add(tileKey(exit))

  const relics: Coord[] = []
  if (objective.k === 'collect') {
    // Spread the relics out: pick from the far half so the party has to travel.
    const candidates = rng.shuffle(free.filter((c) => !taken.has(tileKey(c)) && distance(c, home) >= 3))
    for (const c of candidates) {
      if (relics.length >= objective.count) break
      if (relics.some((r) => distance(r, c) < 2)) continue
      relics.push(c)
      taken.add(tileKey(c))
    }
    // If the map is cramped, fall back to any free tile so the mission stays winnable.
    for (const c of candidates) {
      if (relics.length >= objective.count) break
      if (taken.has(tileKey(c))) continue
      relics.push(c)
      taken.add(tileKey(c))
    }
  }

  // Collapsing floor only on exploration-flavoured objectives, and never on a
  // relic, the exit or a spawn — a mission must not become unwinnable.
  //
  // Nor may the holes cut the map apart, and they have to be judged *together*:
  // a hole is permanent, so by the end of a long mission every scheduled tile is
  // a hole at the same time. Each accepted tile is therefore held open as a chasm
  // while the next one is judged, and the ground is put back afterwards — the
  // floor still has to be floor when the battle starts.
  const collapsing: Collapsing[] = []
  if (objective.k === 'reachExit' || objective.k === 'collect') {
    const candidates = rng.shuffle(allTiles(map).filter((c) => walkable(map, c) && !taken.has(tileKey(c))))
    const count = Math.min(6, Math.max(3, Math.floor(candidates.length / 8)))
    const held: { pos: Coord; was: BattleMap['tiles'][number] }[] = []
    for (const c of candidates) {
      if (collapsing.length >= count) break
      if (wouldDisconnect(map, c, 'chasm', home)) continue
      held.push({ pos: c, was: terrainAt(map, c) })
      setTerrain(map, c, 'chasm')
      collapsing.push({ pos: c, roundsLeft: rng.between(3, 7) })
    }
    for (const h of held) setTerrain(map, h.pos, h.was)
  }

  return { relics, exit, collapsing }
}
