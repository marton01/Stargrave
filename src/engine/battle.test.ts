// Smoke test: play many battles to the end with random but always legal moves.
//
// This does not measure balance; it checks that the engine neither crashes nor
// deadlocks. In a turn-based game a deadlock is the most treacherous kind of
// bug, because it only shows up on round twenty.

import { describe, expect, it } from 'vitest'
import { activeUnit, canRest, mustRest, startBattle, step, type Action } from './battle'
import { livingHeroes, SHIELD_MAX } from './state'
import { resolveEffects } from './effects'
import { card, cardsOfClass } from '../content/cards'
import { createRng, type Rng } from './rng'
import { distance, tileKey, neighbours, walkable, allTiles } from './grid'
import { generateMap } from './mapgen'
import type { BattleState, Hero } from './types'

/** Pick the next legal move at random. */
function randomAction(s: BattleState, rng: Rng): Action | null {
  if (s.phase === 'over') return null

  if (s.phase === 'cardSelection') {
    const heroId = s.selectingHero
    if (!heroId) return null
    const hero = livingHeroes(s).find((h) => h.id === heroId)
    if (!hero) return null

    if (hero.resting) return { k: 'confirmSelection', heroId }

    if (mustRest(hero)) {
      if (!canRest(hero)) return null // should already be exhausted by now
      return { k: 'rest', heroId, loseCard: rng.pick(hero.discard)! }
    }

    if (hero.selected.length < 2) {
      const cardId = rng.pick(hero.hand.filter((id) => !hero.selected.includes(id)))
      return cardId ? { k: 'selectCard', heroId, cardId } : null
    }

    return { k: 'confirmSelection', heroId }
  }

  // resolution
  const unit = activeUnit(s)
  if (!unit) return null
  if (unit.side === 'enemy') return { k: 'advanceEnemy' }

  const turn = s.heroTurn
  if (!turn) return null

  if (s.pending) {
    const value = rng.pick(s.pending.options)
    return value ? { k: 'choose', value } : null
  }

  if (!turn.topCard) {
    const hero = livingHeroes(s).find((h) => h.id === turn.heroId)
    const cardId = hero ? rng.pick(hero.selected) : undefined
    return cardId ? { k: 'assignTopCard', cardId } : null
  }

  for (const half of ['top', 'bottom'] as const) {
    if (half === 'top' ? turn.topDone : turn.bottomDone) continue
    const cardId = half === 'top' ? turn.topCard : turn.bottomCard
    if (!cardId) return { k: 'skipHalf', half }
    const cost = (half === 'top' ? card(cardId).top : card(cardId).bottom).flux ?? 0
    return cost > s.flux ? { k: 'skipHalf', half } : { k: 'playHalf', half }
  }

  return { k: 'endTurn' }
}

function playThrough(seed: number, difficulty = 2) {
  let s = startBattle(seed, difficulty)
  const rng = createRng(seed + 1)
  let moves = 0

  while (s.phase !== 'over' && moves < 5000) {
    const action = randomAction(s, rng)
    if (!action) break
    const next = step(s, action)
    // If an action changes nothing we would loop forever.
    if (next === s) break
    s = next
    moves += 1

    // The interface offers ONLY grid clicks while a choice is pending, and it
    // only accepts them while a card half is actually resolving. If those two
    // ever come apart the player is stuck clicking a grid that ignores them —
    // which is exactly what a browser run turned up.
    if (s.pending && !s.heroTurn?.active) {
      throw new Error(
        `seed ${seed}: pending choice with no active half after ${action.k} ` +
          `(round ${s.round}, phase ${s.phase}, move ${moves})`,
      )
    }
  }

  return { s, moves }
}

describe('battle engine', () => {
  it('every battle ends, without crashing or deadlocking', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { s, moves } = playThrough(seed)
      expect(s.phase, `seed ${seed}: did not end (${moves} moves, round ${s.round})`).toBe('over')
      expect(s.outcome, `seed ${seed}`).not.toBeNull()
      expect(moves, `seed ${seed}: suspiciously many moves`).toBeLessThan(5000)
    }
  })

  it('works at every difficulty', () => {
    for (const difficulty of [1, 2, 3]) {
      for (let seed = 100; seed < 110; seed++) {
        const { s } = playThrough(seed, difficulty)
        expect(s.phase, `difficulty ${difficulty}, seed ${seed}`).toBe('over')
      }
    }
  })

  it('the same seed produces the same battle', () => {
    const a = playThrough(4242)
    const b = playThrough(4242)
    expect(a.s.round).toBe(b.s.round)
    expect(a.s.outcome).toBe(b.s.outcome)
    expect(a.s.log.map((l) => JSON.stringify(l.event))).toEqual(
      b.s.log.map((l) => JSON.stringify(l.event)),
    )
  })

  it('hit points never go below zero, and the dead do not attack', () => {
    for (let seed = 200; seed < 220; seed++) {
      const { s } = playThrough(seed)
      for (const u of s.units) {
        expect(u.hp, `${u.name.en}`).toBeGreaterThanOrEqual(0)
        if (u.hp === 0) expect(u.alive).toBe(false)
      }
    }
  })

  it('cards are never duplicated and never vanish', () => {
    for (let seed = 300; seed < 315; seed++) {
      const { s } = playThrough(seed)
      for (const h of s.units) {
        if (h.side !== 'hero') continue
        const all = [...h.hand, ...h.discard, ...h.lost]
        const unique = new Set(all)
        const expected = cardsOfClass(h.heroClass).length
        expect(unique.size, `${h.name.en}: duplicated card`).toBe(all.length)
        expect(all.length, `${h.name.en}: card vanished`).toBe(expected)
      }
    }
  })

  it('Shield can never grow past the cap', () => {
    for (let seed = 400; seed < 425; seed++) {
      const { s } = playThrough(seed, 3)
      for (const u of s.units) {
        expect(u.statuses.shield ?? 0, `${u.name.en}: shield ran away`).toBeLessThanOrEqual(
          SHIELD_MAX,
        )
      }
    }
  })

  it('echoing an Echo cannot hang the resolver', () => {
    // Regression: Echo splices the replayed card's top half into the effect list.
    // Replaying an Echo therefore spliced in another echo on every pass and the
    // resolver never terminated — it froze the whole tab. Found by a browser
    // smoke run reporting "target crashed".
    const s = structuredClone(startBattle(777, 1))
    const hero = s.units.find(
      (u): u is Hero => u.side === 'hero' && u.heroClass === 'echoreader',
    )!
    hero.discard = ['er-echo']
    s.phase = 'resolution'
    s.heroTurn = {
      heroId: hero.id,
      topCard: 'er-echo',
      bottomCard: 'er-choir-shard',
      topDone: false,
      bottomDone: false,
      active: { cardId: 'er-echo', half: 'top', effects: [{ k: 'echo' }], index: 0 },
      choices: ['er-echo'],
      losing: [],
    }

    resolveEffects(s)

    expect(s.heroTurn.topDone, 'the half never finished resolving').toBe(true)
    expect(s.heroTurn.active).toBeNull()
  })

  it('a card that is lost on use can never sit in the discard pile', () => {
    // The other half of the same defence: if such a card could reach the
    // discard, Echo would have something recursive to point at again.
    for (const c of [...cardsOfClass('runesmith'), ...cardsOfClass('echoreader')]) {
      if (c.top.effects.some((e) => e.k === 'echo')) {
        expect(c.top.lostOnUse, `${c.id}: an echoing half must be lost on use`).toBe(true)
      }
    }
  })

  it('every card is described in both languages', () => {
    for (const c of [...cardsOfClass('runesmith'), ...cardsOfClass('echoreader')]) {
      for (const text of [c.name, c.top.text, c.bottom.text]) {
        expect(text.hu.length, `${c.id}: missing Hungarian text`).toBeGreaterThan(0)
        expect(text.en.length, `${c.id}: missing English text`).toBeGreaterThan(0)
      }
    }
  })
})

describe('map generation', () => {
  it('every walkable tile is reachable, and everyone has somewhere to stand', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const rng = createRng(seed)
      const { map, heroSpawns, enemySpawns } = generateMap(rng, 5)

      expect(heroSpawns.length, `seed ${seed}: not enough hero spawns`).toBe(2)
      expect(enemySpawns.length, `seed ${seed}: not enough enemy spawns`).toBeGreaterThanOrEqual(4)

      // The heroes should start together, but not on top of each other.
      expect(distance(heroSpawns[0]!, heroSpawns[1]!)).toBeLessThanOrEqual(3)

      // Connectivity: every walkable tile reachable from the hero spawn.
      const seen = new Set([tileKey(heroSpawns[0]!)])
      let frontier = [heroSpawns[0]!]
      while (frontier.length) {
        const next = []
        for (const c of frontier) {
          for (const n of neighbours(map, c)) {
            if (!walkable(map, n) || seen.has(tileKey(n))) continue
            seen.add(tileKey(n))
            next.push(n)
          }
        }
        frontier = next
      }
      const walkableCount = allTiles(map).filter((c) => walkable(map, c)).length
      expect(seen.size, `seed ${seed}: the map was cut in two`).toBe(walkableCount)

      for (const c of [...heroSpawns, ...enemySpawns]) {
        expect(walkable(map, c), `seed ${seed}: spawn tile is not walkable`).toBe(true)
      }
    }
  })
})
