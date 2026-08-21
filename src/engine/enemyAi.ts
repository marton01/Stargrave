// The enemy's turn.
//
// There is no clever artificial intelligence here, and that is deliberate. The
// rule is simple and public: attack the nearest hero, break ties towards the
// more wounded one. That way the player can work out what will happen — and
// planning is only planning when the outcome is predictable.

import { applyStatus, hasStatus, livingEnemies, livingHeroes, log } from './state'
import { afterMove, dealDamage, grantShield, knockback } from './combat'
import { bestTileTowards, distance, hasLineOfSight, sameTile } from './grid'
import { intentOf } from '../content/enemies'
import type { BattleState, Enemy, EnemyStep, Hero } from './types'

/** Who does it attack? The nearest hero, the more wounded one on a tie. */
function pickTarget(s: BattleState, e: Enemy): Hero | undefined {
  const candidates = livingHeroes(s)
  if (candidates.length === 0) return undefined
  return [...candidates].sort((a, b) => {
    const da = distance(e.pos, a.pos)
    const db = distance(e.pos, b.pos)
    if (da !== db) return da - db
    if (a.hp !== b.hp) return a.hp - b.hp
    return a.id.localeCompare(b.id)
  })[0]
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
        const to = bestTileTowards(
          s.map,
          s.units,
          e.pos,
          step.distance,
          target.pos,
          desiredRange(intent.steps, i),
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
        dealDamage(s, e, target, step.power, { melee: step.range <= 1 })
        if (target.alive && step.knockback) knockback(s, e, target, step.knockback)
        break
      }

      case 'areaAroundSelf': {
        const targets = livingHeroes(s).filter((h) => distance(e.pos, h.pos) <= step.radius)
        if (targets.length === 0) {
          log(s, { k: 'areaHitNothing' })
          break
        }
        for (const target of targets) dealDamage(s, e, target, step.power, { area: true })
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
