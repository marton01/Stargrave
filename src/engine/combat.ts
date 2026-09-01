// Damage, knockback, traps — the "physics" of combat.
//
// Every point of damage in the game goes through one function. That matters:
// combos, Shield and status effects all meet in a single place, so none of them
// can be quietly forgotten.

import { applyStatus, hasStatus, heroes, isHero, log } from './state'
import { distance, onMap, sameTile, unitAt, walkable } from './grid'
import type { BattleState, Unit } from './types'

export type DamageOptions = {
  /** A melee hit? Rune Mark only grants its bonus for these. */
  melee?: boolean
  /** An area effect? Anchor grants extra damage only for these. */
  area?: boolean
}

/**
 * Are the two heroes close enough to hit harder? The Bond: 2 tiles by default.
 *
 * Exported because the interface has to be able to say so. A rule that adds a
 * point of damage and is written down only in the help is a rule players meet as
 * a surprise in the log — which is exactly what happened.
 *
 * The range comes off the state, because the expedition can widen it: the
 * Echo-reader's Tether perk and the Binding cord both mean "we do not have to
 * see each other any more".
 */
/**
 * Has another hero already struck this target this round?
 *
 * The record is cleared at the start of every round, so concentrating is a thing
 * you do together *now* rather than a mark that accumulates. Only heroes count:
 * an enemy hitting its own ally is not teamwork.
 */
export function focusedOn(s: BattleState, attacker: Unit | null, target: Unit): boolean {
  if (!isHero(attacker) || target.side !== 'enemy') return false
  const already = s.struck?.[target.id] ?? []
  return already.some((id) => id !== attacker.id)
}

export function bondActive(s: BattleState, unit: Unit | null): boolean {
  if (!isHero(unit)) return false
  // Any living ally close enough, not one nominated partner: with three or four
  // on the board the Bond is about not fighting alone, and asking which one it
  // was would be a rule nobody could see on the grid.
  const range = s.bondRange || 2
  return heroes(s).some(
    (other) => other.id !== unit.id && other.alive && distance(unit.pos, other.pos) <= range,
  )
}

/**
 * How much would this attack deal? Kept separate so the interface can show it
 * to the player in advance — the "visible intent" principle cuts both ways.
 */
export function predictDamage(
  s: BattleState,
  attacker: Unit | null,
  target: Unit,
  basePower: number,
  options: DamageOptions = {},
): number {
  let power = basePower

  if (attacker) {
    // The attacker's own statuses.
    if (hasStatus(attacker, 'blind')) return 0
    if (hasStatus(attacker, 'weakened')) power -= 1

    // Bond: when the heroes work close together they hit harder.
    if (bondActive(s, attacker)) power += 1

    // Focused fire: somebody else has already hit this one this round, so the
    // second hand knows where the crack is. With four heroes this is the rule
    // that makes "leave the sentinel to me" worth saying out loud — and it is
    // shown on the target before the blow lands, like everything else.
    if (focusedOn(s, attacker, target)) power += 1
  }

  // The target's statuses.
  if (options.melee && attacker?.side === 'hero' && hasStatus(target, 'runeMark')) power += 2
  if (options.area && hasStatus(target, 'anchor')) power += 1
  if (hasStatus(target, 'prone')) power += 1

  if (power <= 0) return 0

  // Shield reduces the hit (and wears down in the process).
  const shield = target.statuses.shield ?? 0
  return Math.max(0, power - shield)
}

/** Apply damage. Returns the hit points actually removed. */
export function dealDamage(
  s: BattleState,
  attacker: Unit | null,
  target: Unit,
  basePower: number,
  options: DamageOptions = {},
): number {
  if (!target.alive) return 0

  const damage = predictDamage(s, attacker, target, basePower, options)

  // Note who hit what, before the record is used to score the next blow. The
  // list is per round and is cleared when the round turns over.
  if (attacker && attacker.side === 'hero' && target.side === 'enemy' && basePower > 0) {
    if (focusedOn(s, attacker, target)) log(s, { k: 'focused', target: target.name })
    const struck = s.struck ?? (s.struck = {})
    const already = struck[target.id] ?? []
    if (!already.includes(attacker.id)) struck[target.id] = [...already, attacker.id]
  }

  // Shield wears down even when it absorbed the hit completely — that is the
  // "armour gets used up" feel, and it stops a Shield 2 from lasting forever.
  if (basePower > 0 && (target.statuses.shield ?? 0) > 0) {
    const left = (target.statuses.shield ?? 0) - 1
    if (left <= 0) delete target.statuses.shield
    else target.statuses.shield = left
  }

  if (damage <= 0) {
    if (basePower > 0) log(s, { k: 'shieldAbsorbed', target: target.name })
    return 0
  }

  target.hp = Math.max(0, target.hp - damage)
  log(s, {
    k: 'damage',
    attacker: attacker ? attacker.name : null,
    target: target.name,
    amount: damage,
  })

  if (target.hp === 0) {
    target.alive = false
    log(s, { k: 'defeated', unit: target.name })
    // Rune Mark's reward: a marked enemy dying to a hero returns flux.
    if (target.side === 'enemy' && attacker?.side === 'hero' && hasStatus(target, 'runeMark')) {
      s.flux += 1
      log(s, { k: 'runeMarkReward' })
    }
  }

  return damage
}

/** Knockback: push the target directly away from the attacker. */
export function knockback(s: BattleState, attacker: Unit, target: Unit, tiles: number): void {
  if (!target.alive || hasStatus(target, 'anchor')) return

  const dx = Math.sign(target.pos.x - attacker.pos.x)
  const dy = Math.sign(target.pos.y - attacker.pos.y)
  if (dx === 0 && dy === 0) return

  for (let i = 0; i < tiles; i++) {
    const next = { x: target.pos.x + dx, y: target.pos.y + dy }
    if (!onMap(s.map, next)) break
    if (!walkable(s.map, next)) break
    if (unitAt(s.units, next)) break
    target.pos = next
    afterMove(s, target)
    if (!target.alive) return
  }
}

/** Did the unit step onto a trap? Call this after every movement. */
export function checkTrap(s: BattleState, u: Unit): void {
  const index = s.traps.findIndex((t) => sameTile(t.pos, u.pos))
  if (index < 0) return
  const trap = s.traps[index]!
  s.traps.splice(index, 1)
  log(s, { k: 'trapTriggered', unit: u.name })
  dealDamage(s, null, u, trap.power)
}

/** Grant Shield. */
export function grantShield(s: BattleState, target: Unit, power: number): void {
  applyStatus(target, 'shield', power)
  log(s, { k: 'shieldGained', unit: target.name, amount: power })
}

/** Heal. Does not bring a fallen unit back. */
export function heal(s: BattleState, target: Unit, power: number): void {
  if (!target.alive) return
  const before = target.hp
  target.hp = Math.min(target.maxHp, target.hp + power)
  if (target.hp > before) log(s, { k: 'healed', unit: target.name, amount: target.hp - before })
}

/**
 * Everything that happens because a unit changed tile. Movement, knockback and
 * displacement all funnel through here so a pickup or a trap can never be
 * forgotten at one of the call sites.
 */
export function afterMove(s: BattleState, u: Unit): void {
  checkTrap(s, u)
  if (!u.alive || !isHero(u)) return

  const index = s.relics.findIndex((r) => sameTile(r, u.pos))
  if (index >= 0) {
    s.relics.splice(index, 1)
    s.carried += 1
    const needed = s.objective.k === 'collect' ? s.objective.count : 0
    log(s, { k: 'relicPicked', unit: u.name, remaining: Math.max(0, needed - s.carried) })
    if (needed > 0 && s.carried >= needed) log(s, { k: 'relicsComplete' })
  }
}
