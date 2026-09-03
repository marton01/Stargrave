// The enemy's turn.
//
// There is no clever artificial intelligence here, and that is deliberate. The
// rule is simple and public: attack the nearest hero, break ties towards the
// more wounded one. That way the player can work out what will happen — and
// planning is only planning when the outcome is predictable.

import { applyStatus, hasStatus, livingEnemies, livingHeroes, log } from './state'
import { afterMove, dealDamage, grantShield, knockback } from './combat'
import { bestTileTowards, distance, hasLineOfSight, sameTile } from './grid'
import { enemyType, intentOf } from '../content/enemies'
import type { BattleState, Coord, Enemy, EnemyBehaviour, EnemyStep, Hero } from './types'

/**
 * The tile directly opposite `from`, seen from `at`.
 *
 * Backing away has to be measured from somebody: a flat "go anywhere else" walks
 * into a corner and dies there, which reads as a bug rather than as fear.
 */
function mirror(at: Coord, from: Coord): Coord {
  return { x: at.x + (at.x - from.x) * 4, y: at.y + (at.y - from.y) * 4 }
}

/** Does this enemy have that habit? */
export function has(e: Enemy, behaviour: EnemyBehaviour): boolean {
  return enemyType(e.enemyType).behaviours?.includes(behaviour) ?? false
}

/** Is it hurt enough to want out? Half its hit points, rounded down. */
export function wounded(e: Enemy): boolean {
  return e.hp * 2 <= e.maxHp
}

/**
 * How much harder it hits right now, and why.
 *
 * Kept as one function because the interface has to say it. The game's most
 * important rule is that the intent is visible at the start of the round, and a
 * habit that quietly added damage would be the one thing on the board a player
 * could not plan around.
 */
export function damageBonus(s: BattleState, e: Enemy): number {
  let bonus = 0
  // One for every one of its own kind already down. A pair of these turns the
  // order you kill things in into a real decision.
  if (has(e, 'vengeful')) {
    bonus += s.units.filter(
      (u) => u.side === 'enemy' && !u.alive && u.enemyType === e.enemyType,
    ).length
  }
  // Braver with somebody beside it.
  if (has(e, 'pack')) {
    const beside = livingEnemies(s).some((a) => a.id !== e.id && distance(a.pos, e.pos) <= 1)
    if (beside) bonus += 1
  }
  return bonus
}

/**
 * Who does it attack? The nearest hero, the more wounded one on a tie.
 *
 * Two habits change the answer, and both change the shape of a fight rather
 * than its difficulty: a `stalker` walks past the wall to reach whoever is
 * standing at the back, and a `saboteur` is not interested in the heroes at all
 * while there is a module of the ship still standing.
 */
function pickTarget(s: BattleState, e: Enemy): Hero | undefined {
  const candidates = livingHeroes(s)
  if (candidates.length === 0) return undefined
  const far = has(e, 'stalker')
  return [...candidates].sort((a, b) => {
    const da = distance(e.pos, a.pos)
    const db = distance(e.pos, b.pos)
    if (da !== db) return far ? db - da : da - db
    if (a.hp !== b.hp) return a.hp - b.hp
    return a.id.localeCompare(b.id)
  })[0]
}

/** Where a saboteur would rather be: at the nearest module still standing. */
function pickInstallation(s: BattleState, e: Enemy): Coord | null {
  const standing = s.installations.filter((i) => i.hp > 0)
  if (standing.length === 0) return null
  return (
    [...standing].sort((a, b) => distance(e.pos, a.pos) - distance(e.pos, b.pos))[0]?.pos ?? null
  )
}

/**
 * What range is it trying to reach? Taken from the first attack that follows the
 * movement — so a ranged enemy does not walk pointlessly into melee.
 */
function desiredRange(steps: readonly EnemyStep[], moveIndex: number): number {
  for (let i = moveIndex + 1; i < steps.length; i++) {
    const step = steps[i]!
    if (step.k === 'attack') return step.range
    if (step.k === 'areaAroundSelf') return 1
  }
  return 1
}

/** One enemy's complete turn. */
export function enemyTurn(s: BattleState, e: Enemy): void {
  if (!e.alive || !e.intent) return

  const intent = intentOf(e.enemyType, e.intent)
  log(s, { k: 'enemyIntent', unit: e.name, intent: intent.text })

  for (let i = 0; i < intent.steps.length; i++) {
    if (!e.alive) return
    const step = intent.steps[i]!

    switch (step.k) {
      case 'move': {
        if (hasStatus(e, 'anchor')) {
          log(s, { k: 'anchoredInPlace', unit: e.name })
          break
        }
        if (hasStatus(e, 'prone')) {
          log(s, { k: 'proneNoMove', unit: e.name })
          break
        }
        const target = pickTarget(s, e)
        if (!target) break
        // A saboteur walks at the ship, not at the people defending it.
        const sabotage = has(e, 'saboteur') ? pickInstallation(s, e) : null
        // And something skittish, once it is hurt, walks the other way. It is
        // measured from the hero it is running from, so it backs off rather than
        // fleeing to a corner.
        const away = has(e, 'skittish') && wounded(e)
        const goal = sabotage ?? target.pos
        const to = bestTileTowards(
          s.map,
          s.units,
          e.pos,
          step.distance,
          away ? mirror(e.pos, target.pos) : goal,
          away ? 1 : desiredRange(intent.steps, i),
        )
        if (!sameTile(to, e.pos)) {
          e.pos = to
          afterMove(s, e)
        }
        break
      }

      case 'attack': {
        const inReach = livingHeroes(s).filter(
          (h) => distance(e.pos, h.pos) <= step.range && hasLineOfSight(s.map, e.pos, h.pos),
        )
        if (inReach.length === 0) {
          log(s, { k: 'nobodyInRange', unit: e.name })
          break
        }
        const target = inReach.sort((a, b) => a.hp - b.hp)[0]!
        dealDamage(s, e, target, step.power + damageBonus(s, e), { melee: step.range <= 1 })
        if (target.alive && step.knockback) knockback(s, e, target, step.knockback)
        break
      }

      case 'areaAroundSelf': {
        const targets = livingHeroes(s).filter((h) => distance(e.pos, h.pos) <= step.radius)
        if (targets.length === 0) {
          log(s, { k: 'areaHitNothing' })
          break
        }
        const area = step.power + damageBonus(s, e)
        for (const target of targets) dealDamage(s, e, target, area, { area: true })
        break
      }

      case 'shieldAllies': {
        const allies = livingEnemies(s).filter((a) => distance(e.pos, a.pos) <= step.radius)
        for (const ally of allies) grantShield(s, ally, step.power)
        break
      }

      case 'drainFlux': {
        const drained = Math.min(s.flux, step.power)
        s.flux -= drained
        if (drained > 0) log(s, { k: 'fluxDrained', unit: e.name, amount: drained })
        break
      }

      case 'statusOnHero': {
        const inReach = livingHeroes(s).filter(
          (h) => distance(e.pos, h.pos) <= step.range && hasLineOfSight(s.map, e.pos, h.pos),
        )
        const target = inReach.sort((a, b) => distance(e.pos, a.pos) - distance(e.pos, b.pos))[0]
        if (!target) break
        applyStatus(target, step.status, step.rounds)
        log(s, { k: 'statusApplied', unit: target.name, status: step.status })
        break
      }
    }
  }
}

/**
 * What this enemy is doing differently right now, in words.
 *
 * The game's most important rule is that the intent is visible at the start of
 * the round. A habit that changed a number without saying so would be the one
 * thing on the board nobody could plan around — so the sidebar reads this out
 * next to the enemy's own name, and it only lists what is true THIS round.
 */
export function activeBehaviours(s: BattleState, e: Enemy): { id: EnemyBehaviour; amount: number }[] {
  const out: { id: EnemyBehaviour; amount: number }[] = []
  if (has(e, 'skittish') && wounded(e)) out.push({ id: 'skittish', amount: 0 })
  if (has(e, 'saboteur') && s.installations.some((i) => i.hp > 0)) {
    out.push({ id: 'saboteur', amount: 0 })
  }
  if (has(e, 'stalker')) out.push({ id: 'stalker', amount: 0 })
  const fallen = s.units.filter(
    (u) => u.side === 'enemy' && !u.alive && u.enemyType === e.enemyType,
  ).length
  if (has(e, 'vengeful') && fallen > 0) out.push({ id: 'vengeful', amount: fallen })
  if (has(e, 'pack') && livingEnemies(s).some((a) => a.id !== e.id && distance(a.pos, e.pos) <= 1)) {
    out.push({ id: 'pack', amount: 1 })
  }
  return out
}
