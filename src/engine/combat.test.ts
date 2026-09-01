// What a card's numbers actually do.
//
// Two questions a player asked after a real battle, and both deserve a test
// rather than an answer: does "range 4" mean any enemy within 4 tiles, and why
// did an "Attack 3" take four hit points off a full-health enemy?
//
// The second one was not a bug — it was the Bond, the rule that gives both heroes
// +1 while they stand within two tiles of each other. It was invisible in play,
// which is a different kind of bug, and it is fixed in the interface. Here it is
// pinned down in numbers so it stays honest.

import { describe, expect, it } from 'vitest'
import { bondActive, predictDamage } from './combat'
import { requirement } from './effects'
import { startBattle, startMission, step } from './battle'
import { distance, hasLineOfSight } from './grid'
import { heroes, isHero, livingEnemies } from './state'
import type { BattleState, Hero } from './types'

/** A battle with the two heroes placed exactly where we want them. */
function battleWith(heroGap: number): { s: BattleState; hero: Hero } {
  const s = startBattle(12345, 2)
  const [first, second] = heroes(s)
  first!.pos = { x: 0, y: 0 }
  second!.pos = { x: heroGap, y: 0 }
  return { s, hero: first! }
}

describe('range', () => {
  it('offers every enemy within range that can be seen, and no others', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = startBattle(seed, 2)
      const hero = heroes(s)[0]!
      for (const range of [1, 2, 4]) {
        const choice = requirement(s, hero, { k: 'attack', power: 3, range }, [])
        expect(choice?.kind).toBe('unit')
        const offered = new Set(choice!.options)

        for (const enemy of livingEnemies(s)) {
          const inRange = distance(hero.pos, enemy.pos) <= range
          const visible = hasLineOfSight(s.map, hero.pos, enemy.pos)
          expect(
            offered.has(enemy.id),
            `seed ${seed}, range ${range}: ${enemy.name.en} at distance ${distance(hero.pos, enemy.pos)}` +
              `${visible ? '' : ' (no line of sight)'}`,
          ).toBe(inRange && visible)
        }
      }
    }
  })

  it('asks for one target unless the card says otherwise', () => {
    const s = startBattle(7, 2)
    const hero = heroes(s)[0]!
    // Two enemies standing right next to the hero: no walls in the way, so the
    // only thing being tested is how many targets the card asks for.
    const [a, b] = livingEnemies(s)
    a!.pos = { x: hero.pos.x + 1, y: hero.pos.y }
    b!.pos = { x: hero.pos.x, y: hero.pos.y + 1 }

    expect(requirement(s, hero, { k: 'attack', power: 1, range: 1 }, [])?.needed).toBe(1)
    expect(requirement(s, hero, { k: 'attack', power: 1, range: 1, targets: 2 }, [])?.needed).toBe(2)
    // And it never asks for more than there are: only one enemy is two tiles out.
    b!.pos = { x: hero.pos.x, y: hero.pos.y + 6 }
    expect(requirement(s, hero, { k: 'attack', power: 1, range: 1, targets: 2 }, [])?.needed).toBe(1)
  })
})

describe('the Bond', () => {
  it('is on within two tiles and off beyond them', () => {
    for (const gap of [1, 2]) {
      const { s, hero } = battleWith(gap)
      expect(bondActive(s, hero), `gap ${gap}`).toBe(true)
    }
    for (const gap of [3, 5]) {
      const { s, hero } = battleWith(gap)
      expect(bondActive(s, hero), `gap ${gap}`).toBe(false)
    }
  })

  it('is why an Attack 3 takes off 4', () => {
    const close = battleWith(2)
    const target = livingEnemies(close.s)[0]!
    expect(predictDamage(close.s, close.hero, target, 3, { melee: false })).toBe(4)

    const apart = battleWith(4)
    const far = livingEnemies(apart.s)[0]!
    expect(predictDamage(apart.s, apart.hero, far, 3, { melee: false })).toBe(3)
  })

  it('does not apply to enemies, and dies with the partner', () => {
    const { s, hero } = battleWith(1)
    const enemy = livingEnemies(s)[0]!
    expect(bondActive(s, enemy)).toBe(false)

    heroes(s)[1]!.alive = false
    expect(bondActive(s, hero)).toBe(false)
  })
})

describe('the rest of the damage stack', () => {
  it('counts Shield down from whatever the hit would have been', () => {
    const { s, hero } = battleWith(9) // no Bond, so the numbers are plain
    const target = livingEnemies(s)[0]!
    target.statuses.shield = 2
    expect(predictDamage(s, hero, target, 3)).toBe(1)
    target.statuses.shield = 5
    expect(predictDamage(s, hero, target, 3)).toBe(0)
  })

  it('gives Rune Mark only to a hero in melee', () => {
    const { s, hero } = battleWith(9)
    const target = livingEnemies(s)[0]!
    target.statuses.runeMark = 2
    expect(predictDamage(s, hero, target, 2, { melee: true })).toBe(4)
    expect(predictDamage(s, hero, target, 2, { melee: false })).toBe(2)
  })

  it('lets a blinded attacker do nothing at all', () => {
    const { s, hero } = battleWith(1)
    hero.statuses.blind = 1
    expect(predictDamage(s, hero, livingEnemies(s)[0]!, 5)).toBe(0)
  })
})

describe('getting out', () => {
  /** A "reach the exit" landing, with an exit somewhere far from the party. */
  function exitMission(): BattleState {
    return startMission({
      seed: 5,
      difficulty: 1,
      objective: { k: 'reachExit' },
      missionKind: 'exploration',
      flux: 5,
      roundLimit: null,
      enemyScale: 0.3,
    })
  }

  it('needs the whole party at the extraction point, not one hero', () => {
    const s = exitMission()
    expect(s.exit).not.toBeNull()
    const exit = s.exit!
    const [first, second] = heroes(s)

    // One hero standing on it is not "getting out" — the other is still down there.
    first!.pos = { x: exit.x, y: exit.y }
    second!.pos = { x: (exit.x + 5) % 10, y: (exit.y + 5) % 10 }
    let after = step(s, { k: 'endTurn' })
    expect(after.outcome, 'one hero out should not end it').toBeNull()

    // Both at the point — on it and beside it, because two units cannot share a tile.
    const beside = { x: Math.max(0, Math.min(9, exit.x + 1)), y: exit.y }
    after = step({ ...after, units: after.units.map((u) =>
      isHero(u) ? { ...u, pos: u.id === first!.id ? exit : beside } : u) }, { k: 'endTurn' })
    expect(after.outcome, 'the party is out').toBe('victory')
  })

  it('counts a fallen hero out of it: whoever is left has to be there', () => {
    const s = exitMission()
    const exit = s.exit!
    const [first, second] = heroes(s)
    second!.alive = false
    first!.pos = { x: exit.x, y: exit.y }
    const after = step(s, { k: 'endTurn' })
    expect(after.outcome).toBe('victory')
  })
})
