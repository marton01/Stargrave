// Balance report.
//
// NOT part of the normal test run — it is slow, and it does not answer a
// yes/no question but produces numbers. Run it with:
//
//     npm run balance
//
// IMPORTANT LIMIT ON INTERPRETATION: the bot plays worse than a human. It picks
// its two cards at random and never plans a combo. So these numbers do NOT tell
// you whether the game is easy for a person — they tell you
//
//   * whether the enemies can be killed at all (if the bot barely kills
//     anything, that is a systems bug: defence has run away somewhere),
//   * how long the heroes last (if the bot survives 30+ rounds, enemy damage is
//     too low),
//   * and which way a change moved those figures.
//
// Only human playtesting can tell you the actual difficulty.

import { describe, expect, it } from 'vitest'
import { activeUnit, canRest, mustRest, startBattle, step, type Action } from './battle'
import { enemies, livingEnemies, livingHeroes } from './state'
import { card } from '../content/cards'
import { createRng, type Rng } from './rng'
import { distance, fromTileKey } from './grid'
import type { BattleState } from './types'

// Only needed here, so declared locally — this keeps `process` out of the
// browser code's type surface.
declare const process: { env: Record<string, string | undefined> }

const ENABLED = process.env.BALANCE === '1'
const BATTLES = 200

/** How much damage does a card half carry? The bot uses this to pick a half. */
function halfPower(cardId: string, half: 'top' | 'bottom'): number {
  const h = half === 'top' ? card(cardId).top : card(cardId).bottom
  return h.effects.reduce((sum, e) => {
    if (e.k === 'attack') return sum + e.power * (e.targets ?? 1)
    if (e.k === 'areaAtPoint' || e.k === 'areaAroundSelf') return sum + e.power * 2
    return sum
  }, 0)
}

/** How far does a card's top half reach? The bot uses this to decide whether to move first. */
function topReach(cardId: string): number {
  return card(cardId).top.effects.reduce((max, e) => {
    if (e.k === 'attack') return Math.max(max, e.range)
    if (e.k === 'areaAtPoint') return Math.max(max, e.range + e.radius)
    if (e.k === 'areaAroundSelf') return Math.max(max, e.radius)
    return max
  }, 0)
}

/**
 * Half-clever bot: WHICH TWO CARDS to play is decided at random — that is the
 * real human decision, and we do not want a weak heuristic to spoil the
 * measurement. What it does do well: it moves towards the enemy, targets the
 * weakest reachable enemy, and moves before striking when its attack cannot
 * reach. Without those three the numbers measure the bot's blindness, not the
 * game.
 */
function botAction(s: BattleState, rng: Rng): Action | null {
  if (s.phase === 'over') return null

  if (s.phase === 'cardSelection') {
    const heroId = s.selectingHero
    if (!heroId) return null
    const hero = livingHeroes(s).find((h) => h.id === heroId)
    if (!hero) return null
    if (hero.resting) return { k: 'confirmSelection', heroId }
    if (mustRest(hero)) {
      if (!canRest(hero)) return null
      return { k: 'rest', heroId, loseCard: rng.pick(hero.discard)! }
    }
    if (hero.selected.length < 2) {
      const cardId = rng.pick(hero.hand.filter((id) => !hero.selected.includes(id)))
      return cardId ? { k: 'selectCard', heroId, cardId } : null
    }
    return { k: 'confirmSelection', heroId }
  }

  const unit = activeUnit(s)
  if (!unit) return null
  if (unit.side === 'enemy') return { k: 'advanceEnemy' }

  const turn = s.heroTurn
  if (!turn) return null

  if (s.pending) {
    if (s.pending.kind === 'unit') {
      // Focus fire on the weakest reachable enemy.
      const sorted = [...s.pending.options].sort((a, b) => {
        const ua = s.units.find((x) => x.id === a)
        const ub = s.units.find((x) => x.id === b)
        return (ua?.hp ?? 99) - (ub?.hp ?? 99)
      })
      return { k: 'choose', value: sorted[0]! }
    }

    if (s.pending.kind === 'tile') {
      const effect = turn.active?.effects[turn.active.index]
      const enemyPositions = livingEnemies(s).map((e) => e.pos)

      // For movement, head towards the enemy. Without this the bot wanders off,
      // melee cards find no target, and the measurement is meaningless.
      if (effect?.k === 'move' && enemyPositions.length > 0) {
        const best = [...s.pending.options].sort((a, b) => {
          const da = Math.min(...enemyPositions.map((p) => distance(fromTileKey(a), p)))
          const db = Math.min(...enemyPositions.map((p) => distance(fromTileKey(b), p)))
          return da - db
        })
        return { k: 'choose', value: best[0]! }
      }

      // For area effects, aim where the most enemies stand.
      if (effect?.k === 'areaAtPoint') {
        const count = (key: string) =>
          enemyPositions.filter((p) => distance(fromTileKey(key), p) <= effect.radius).length
        const best = [...s.pending.options].sort((a, b) => count(b) - count(a))
        return { k: 'choose', value: best[0]! }
      }
    }

    const value = rng.pick(s.pending.options)
    return value ? { k: 'choose', value } : null
  }

  if (!turn.topCard) {
    const hero = livingHeroes(s).find((h) => h.id === turn.heroId)
    if (!hero) return null
    // Give the top half to whichever card hits harder — a human does the same,
    // and without it the measurement reflects the bot rather than the game.
    const sorted = [...hero.selected].sort((a, b) => halfPower(b, 'top') - halfPower(a, 'top'))
    const cardId = sorted[0] ?? rng.pick(hero.selected)
    return cardId ? { k: 'assignTopCard', cardId } : null
  }

  // Order matters: if the top half wants to strike but nothing is in range, run
  // the bottom half (movement) first.
  const hero = livingHeroes(s).find((h) => h.id === turn.heroId)
  let order: ('top' | 'bottom')[] = ['top', 'bottom']
  if (hero && !turn.topDone && !turn.bottomDone && turn.topCard) {
    const reach = topReach(turn.topCard)
    const inRange = livingEnemies(s).some((e) => distance(hero.pos, e.pos) <= reach)
    if (halfPower(turn.topCard, 'top') > 0 && !inRange) order = ['bottom', 'top']
  }

  for (const half of order) {
    if (half === 'top' ? turn.topDone : turn.bottomDone) continue
    const cardId = half === 'top' ? turn.topCard : turn.bottomCard
    if (!cardId) return { k: 'skipHalf', half }
    const cost = (half === 'top' ? card(cardId).top : card(cardId).bottom).flux ?? 0
    return cost > s.flux ? { k: 'skipHalf', half } : { k: 'playHalf', half }
  }

  return { k: 'endTurn' }
}

function oneBattle(seed: number, difficulty: number) {
  let s = startBattle(seed, difficulty)
  const enemyCount = enemies(s).length
  const rng = createRng(seed * 31 + 7)
  let moves = 0

  while (s.phase !== 'over' && moves < 8000) {
    const action = botAction(s, rng)
    if (!action) break
    const next = step(s, action)
    if (next === s) break
    s = next
    moves += 1
  }

  const exhausted =
    livingHeroes(s).length === 0 && s.units.some((u) => u.side === 'hero' && u.exhausted)

  return {
    round: s.round,
    won: s.outcome === 'victory',
    lostToExhaustion: s.outcome === 'defeat' && exhausted,
    enemiesKilled: enemyCount - livingEnemies(s).length,
    enemyCount,
    cardsLost: s.units.reduce((n, u) => n + (u.side === 'hero' ? u.lost.length : 0), 0),
  }
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!

describe.skipIf(!ENABLED)('balance report', () => {
  for (const [difficulty, label] of [
    [1, 'Easy'],
    [2, 'Normal'],
    [3, 'Hard'],
  ] as const) {
    it(`${label}`, { timeout: 180_000 }, () => {
      const results = Array.from({ length: BATTLES }, (_, i) => oneBattle(1000 + i, difficulty))

      const wins = results.filter((r) => r.won).length
      const exhaustion = results.filter((r) => r.lostToExhaustion).length
      const killRate = mean(results.map((r) => r.enemiesKilled / r.enemyCount))

      // eslint-disable-next-line no-console
      console.log(
        [
          ``,
          `  ${label} (${results[0]!.enemyCount} enemies, ${BATTLES} battles)`,
          `    victory              ${((wins / BATTLES) * 100).toFixed(0)}%`,
          `    lost to exhaustion   ${((exhaustion / BATTLES) * 100).toFixed(0)}%`,
          `    enemies killed       ${(killRate * 100).toFixed(0)}%`,
          `    rounds (mean/median) ${mean(results.map((r) => r.round)).toFixed(1)} / ${median(results.map((r) => r.round))}`,
          `    cards lost (mean)    ${mean(results.map((r) => r.cardsLost)).toFixed(1)}`,
          ``,
        ].join('\n'),
      )

      // Not a strict threshold but a systems-bug guard: if the bot can barely
      // kill anything, defence has run away somewhere — that is a bug, not
      // balance.
      expect(killRate, `${label}: the bot can barely kill anything`).toBeGreaterThan(0.25)
    })
  }
})
