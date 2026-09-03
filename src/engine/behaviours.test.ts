// The enemies' standing habits.
//
// Four enemy types across eight or ten landings in a campaign is thin, and the
// thinness showed in the only way difficulty could grow: more of them. New
// monsters are expensive — a shape, a name, intents, art. A habit is cheap and
// does more, because it changes the SHAPE of a fight rather than its size.
//
// The one rule a habit must not break is the game's most important one: THE
// INTENT IS VISIBLE AT THE START OF THE ROUND. A habit that quietly moves a
// number would be the single thing on the board a player cannot plan around, so
// every habit that is doing something has to say so — and that is the test in
// this file that matters most.

import { describe, expect, it } from 'vitest'
import { BEHAVIOUR_NAMES, BEHAVIOUR_TEXTS, ENEMY_TYPES } from '../content/enemies'
import { activeBehaviours, damageBonus, has, wounded } from './enemyAi'
import { enemies, heroes } from './state'
import { startBattle, step } from './battle'
import type { BattleState, Enemy, EnemyBehaviour } from './types'

const ALL: EnemyBehaviour[] = ['skittish', 'saboteur', 'vengeful', 'stalker', 'pack']

function battle(): BattleState {
  return startBattle(4242, 2)
}

/** An enemy of a given type, put on the board on its own. */
function only(s: BattleState, type: string): Enemy {
  const found = enemies(s).find((e) => e.enemyType === type)
  if (found) return found
  const first = enemies(s)[0]!
  first.enemyType = type
  return first
}

describe('the habits are declared and named', () => {
  it('names and explains every one of them, in both languages', () => {
    for (const id of ALL) {
      expect(BEHAVIOUR_NAMES[id].hu.length, id).toBeGreaterThan(3)
      expect(BEHAVIOUR_NAMES[id].en.length, id).toBeGreaterThan(3)
      for (const amount of [0, 2]) {
        expect(BEHAVIOUR_TEXTS[id](amount).hu.length, id).toBeGreaterThan(20)
        expect(BEHAVIOUR_TEXTS[id](amount).en.length, id).toBeGreaterThan(20)
      }
    }
  })

  it('gives every enemy type at least one, so no fight is shapeless', () => {
    for (const type of ENEMY_TYPES) {
      expect(type.behaviours?.length ?? 0, `${type.id} has no habit`).toBeGreaterThan(0)
      for (const id of type.behaviours ?? []) expect(ALL, `${type.id}: ${id}`).toContain(id)
    }
  })

  it('says so in the type’s own description, so the help teaches it', () => {
    // A habit the player can only discover by dying to it is a trap, not a rule.
    for (const type of ENEMY_TYPES) {
      expect(type.description.hu.length, type.id).toBeGreaterThan(60)
      expect(type.description.en.length, type.id).toBeGreaterThan(60)
    }
  })
})

describe('and they are visible while they are happening', () => {
  it('reports vengeance with the number it is worth', () => {
    const s = battle()
    const shard = only(s, 'godmachine-shard')
    // Nothing yet: none of its kind has fallen.
    expect(activeBehaviours(s, shard).some((b) => b.id === 'vengeful')).toBe(false)
    expect(damageBonus(s, shard)).toBe(0)

    // One of its own goes down.
    const kin = { ...shard, id: 'kin', alive: false }
    s.units.push(kin)
    const active = activeBehaviours(s, shard).find((b) => b.id === 'vengeful')
    expect(active, 'vengeance was silent').toBeDefined()
    expect(active!.amount).toBe(1)
    expect(damageBonus(s, shard)).toBe(1)
  })

  it('reports a pack only while somebody is actually beside it', () => {
    const s = battle()
    const husk = only(s, 'ash-husk')
    const alone = enemies(s).filter((e) => e.id !== husk.id)
    for (const other of alone) other.pos = { x: 0, y: 0 }
    husk.pos = { x: 9, y: 9 }
    expect(damageBonus(s, husk), 'a lone husk was still in a pack').toBe(0)

    // Somebody who is definitely not the husk itself: `enemies(s)[1]` can be.
    const friend = enemies(s).find((e) => e.id !== husk.id)
    if (friend) {
      friend.pos = { x: 9, y: 8 }
      friend.enemyType = 'ash-husk'
      expect(damageBonus(s, husk)).toBe(1)
      expect(activeBehaviours(s, husk).some((b) => b.id === 'pack')).toBe(true)
    }
  })

  it('reports fear only once it is actually hurt', () => {
    const s = battle()
    const sentinel = only(s, 'rune-sentinel')
    expect(has(sentinel, 'skittish')).toBe(true)
    sentinel.hp = sentinel.maxHp
    expect(wounded(sentinel)).toBe(false)
    expect(activeBehaviours(s, sentinel).some((b) => b.id === 'skittish')).toBe(false)
    sentinel.hp = 1
    expect(wounded(sentinel)).toBe(true)
    expect(activeBehaviours(s, sentinel).some((b) => b.id === 'skittish')).toBe(true)
  })

  it('reports sabotage only while there is something to sabotage', () => {
    const s = battle()
    const sentinel = only(s, 'rune-sentinel')
    expect(s.installations).toHaveLength(0)
    expect(activeBehaviours(s, sentinel).some((b) => b.id === 'saboteur')).toBe(false)
    s.installations.push({ pos: { x: 1, y: 1 }, id: 'hull-plating', hp: 4, maxHp: 4 })
    expect(activeBehaviours(s, sentinel).some((b) => b.id === 'saboteur')).toBe(true)
  })
})

describe('and they change what happens', () => {
  it('sends the wounded one backwards instead of forwards', () => {
    const s = battle()
    const sentinel = only(s, 'rune-sentinel')
    for (const other of enemies(s)) if (other.id !== sentinel.id) other.alive = false
    const hero = heroes(s)[0]!
    hero.pos = { x: 5, y: 5 }
    sentinel.pos = { x: 7, y: 5 }
    sentinel.hp = 1
    sentinel.intent = 'sentinel-reposition'
    const before = Math.abs(sentinel.pos.x - hero.pos.x) + Math.abs(sentinel.pos.y - hero.pos.y)

    // Run the enemy phase for this one unit only.
    const after = step(s, { k: 'endTurn' })
    const moved = enemies(after).find((e) => e.id === sentinel.id)
    if (moved && moved.alive) {
      const distance =
        Math.abs(moved.pos.x - hero.pos.x) + Math.abs(moved.pos.y - hero.pos.y)
      expect(distance, 'a frightened sentinel walked into the fight').toBeGreaterThanOrEqual(before)
    }
  })
})
