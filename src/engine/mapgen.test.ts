// The one property a battlefield must never lose: you can get everywhere.
//
// A cut-in-two map is not a hard mission, it is an unfinishable one. The party
// cannot reach the last enemy, or the exit, and nothing ends the battle except
// running out of cards — so the mission is lost round by round with casualties,
// and the only way out of it is calling off the whole expedition.
//
// Three things can make a hole in the ground, and each is tested here: the
// obstacles the generator scatters, the floor it schedules to collapse, and the
// rune pillar a player raises mid-battle.

import { describe, expect, it } from 'vitest'
import {
  allTiles,
  distance,
  fullyConnected,
  reachableTiles,
  setTerrain,
  terrainAt,
  tileKey,
  walkable,
  wouldDisconnect,
} from './grid'
import { generateMap, generateMissionFeatures, MAP_HEIGHT, MAP_WIDTH } from './mapgen'
import { createRng } from './rng'
import type { BattleMap, Objective } from './types'

const SEEDS = 400

describe('generated battlefields', () => {
  it('are fully connected', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rng = createRng(seed)
      const { map, heroSpawns } = generateMap(rng, 4)
      expect(fullyConnected(map, heroSpawns[0]!), `seed ${seed}`).toBe(true)
    }
  })

  it('stay connected once every scheduled floor has given way', () => {
    // The holes appear one after another over a mission, but they never heal, so
    // late in a long mission all of them are open at once. That is the state the
    // generator has to survive, not each hole on its own.
    const objectives: Objective[] = [{ k: 'reachExit' }, { k: 'collect', count: 3 }]
    for (let seed = 1; seed <= SEEDS; seed++) {
      for (const objective of objectives) {
        const rng = createRng(seed)
        const { map, heroSpawns, enemySpawns } = generateMap(rng, 4)
        const { collapsing, relics, exit } = generateMissionFeatures(
          rng,
          map,
          heroSpawns,
          enemySpawns,
          objective,
        )
        for (const tile of collapsing) setTerrain(map, tile.pos, 'chasm')

        const where = `seed ${seed}, ${objective.k}, ${collapsing.length} holes`
        expect(fullyConnected(map, heroSpawns[0]!), where).toBe(true)
        // And the things the mission is about are still standing on ground.
        for (const relic of relics) expect(walkable(map, relic), `${where}: relic`).toBe(true)
        if (exit) expect(walkable(map, exit), `${where}: exit`).toBe(true)
      }
    }
  })
})

describe('what a unit can actually walk', () => {
  // The check above asks whether the tiles are connected. This one asks the
  // movement code itself, which has one more rule: you cannot cut diagonally
  // between two blocking tiles. A board where the only link is such a corner
  // passes a naive connectivity check and is impassable on the screen — an enemy
  // you can see and never reach. That was a real bug; this is the guard.
  it('can reach every enemy, by the rules movement uses', () => {
    const objectives: Objective[] = [{ k: 'eliminate' }, { k: 'collect', count: 3 }, { k: 'reachExit' }]
    for (let seed = 1; seed <= SEEDS; seed++) {
      for (const objective of objectives) {
        const rng = createRng(seed)
        const { map, heroSpawns, enemySpawns } = generateMap(rng, 4)
        const { collapsing, relics, exit } = generateMissionFeatures(
          rng,
          map,
          heroSpawns,
          enemySpawns,
          objective,
        )
        // The worst moment of the mission: every hole open at once.
        for (const tile of collapsing) setTerrain(map, tile.pos, 'chasm')

        // No units on the board, so the only thing stopping movement is terrain.
        const reach = reachableTiles(map, [], heroSpawns[0]!, 9999)
        const where = `seed ${seed}, ${objective.k}`

        for (const spawn of enemySpawns) {
          expect(reach.has(tileKey(spawn)), `${where}: enemy at ${tileKey(spawn)} unreachable`).toBe(true)
        }
        for (const relic of relics) {
          expect(reach.has(tileKey(relic)), `${where}: relic at ${tileKey(relic)} unreachable`).toBe(true)
        }
        if (exit) {
          expect(reach.has(tileKey(exit)), `${where}: exit at ${tileKey(exit)} unreachable`).toBe(true)
        }
        // And nothing at all is walled off, not just the things that matter.
        const walkableTiles = allTiles(map).filter((c) => walkable(map, c))
        expect(reach.size, `${where}: ${walkableTiles.length - reach.size} tiles cut off`).toBe(
          walkableTiles.length,
        )
      }
    }
  })
})

describe('wouldDisconnect', () => {
  /** A map that is two rooms joined by a single one-tile corridor. */
  function pinchedMap(): BattleMap {
    const map: BattleMap = {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tiles: new Array<BattleMap['tiles'][number]>(MAP_WIDTH * MAP_HEIGHT).fill('wall'),
    }
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        setTerrain(map, { x, y }, 'floor')
        setTerrain(map, { x: x + 6, y }, 'floor')
      }
    }
    // The only way across, at x = 3..5 on one row.
    for (let x = 3; x <= 5; x++) setTerrain(map, { x, y: 1 }, 'floor')
    return map
  }

  it('sees the pillar that would seal a corridor', () => {
    const map = pinchedMap()
    const from = { x: 0, y: 1 }
    expect(fullyConnected(map, from)).toBe(true)
    expect(wouldDisconnect(map, { x: 4, y: 1 }, 'pillar', from)).toBe(true)
    // And it leaves the map exactly as it found it.
    expect(terrainAt(map, { x: 4, y: 1 })).toBe('floor')
    expect(fullyConnected(map, from)).toBe(true)
  })

  it('allows an obstacle that only narrows the way', () => {
    const map = pinchedMap()
    const from = { x: 0, y: 1 }
    // A corner of a room: there is always a way around it.
    expect(wouldDisconnect(map, { x: 0, y: 0 }, 'pillar', from)).toBe(false)
  })

  it('never reports a walkable kind as cutting anything off', () => {
    const map = pinchedMap()
    const from = { x: 0, y: 1 }
    for (const c of allTiles(map).filter((c) => walkable(map, c))) {
      expect(wouldDisconnect(map, c, 'ash', from), tileKey(c)).toBe(false)
    }
  })
})

describe('room for the whole party', () => {
  // Two heroes was a constant of the map generator until more than two people
  // could play. Everyone needs their own tile: two units on one tile is a state
  // nothing else in the engine expects, and it would show up as a hero who
  // cannot be clicked.
  it('gives every hero a tile of their own, for parties of two to four', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const partySize of [2, 3, 4]) {
        const { map, heroSpawns } = generateMap(createRng(seed), 6, partySize)
        expect(heroSpawns, `seed ${seed}, party ${partySize}`).toHaveLength(partySize)
        const distinct = new Set(heroSpawns.map((c) => `${c.x},${c.y}`))
        expect(distinct.size, `seed ${seed}: two heroes on one tile`).toBe(partySize)
        for (const spawn of heroSpawns) {
          expect(walkable(map, spawn), `seed ${seed}: a hero spawned in a wall`).toBe(true)
        }
      }
    }
  })

  it('keeps the party together, so the Bond is reachable from the start', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { heroSpawns } = generateMap(createRng(seed), 6, 4)
      const home = heroSpawns[0]!
      for (const spawn of heroSpawns) {
        // Not necessarily adjacent, but on the same ground rather than scattered
        // across the map: landing a hero alone in a far corner is a punishment
        // the mission never chose to hand out.
        expect(distance(home, spawn), `seed ${seed}`).toBeLessThanOrEqual(6)
      }
    }
  })
})
