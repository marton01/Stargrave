// Modules on the board, in a boarding action.
//
// The briefing for a boarding action has always said "the modules stand on the
// grid — whatever is destroyed is gone for the rest of the expedition", and
// nothing behind it was true: there were no modules on any grid. This is that
// promise, and these are the tests that keep it.
//
// The rule is positional on purpose. Enemies do not choose to attack a module —
// the pathing chases heroes — but an enemy standing beside one at the end of a
// round tears at it. Defending is therefore about clearing the tile next to it,
// which is a thing two heroes can actually plan.

import { describe, expect, it } from 'vitest'
import { activeUnit, startMission, step } from './battle'
import { livingEnemies } from './state'
import type { BattleState } from './types'
import { newArchive } from './expedition/archive'
import { expeditionStep, startExpedition } from './expedition/expedition'
import type { ExpeditionState, MissionSpec } from './expedition/types'

/**
 * Play one whole round with the blandest legal moves there are: everyone picks
 * two cards, skips both halves and ends the turn, and the enemies act.
 *
 * The battle starts in the card selection phase, so simply dispatching
 * `advanceEnemy` does nothing — which is how the first version of these tests
 * managed to prove nothing at all.
 */
function playARound(start: BattleState): BattleState {
  let s = start
  const round = s.round
  for (let guard = 0; guard < 400 && s.round === round && s.phase !== 'over'; guard++) {
    if (s.phase === 'cardSelection') {
      const hero = s.units.find((u) => u.side === 'hero' && u.id === s.selectingHero)
      if (!hero || hero.side !== 'hero') break
      if (hero.hand.length < 2) {
        s = step(s, { k: 'rest', heroId: hero.id, loseCard: hero.discard[0]! })
        s = step(s, { k: 'confirmSelection', heroId: hero.id })
        continue
      }
      if (hero.selected.length < 2) {
        const next = hero.hand.find((c) => !hero.selected.includes(c))!
        s = step(s, { k: 'selectCard', heroId: hero.id, cardId: next })
        continue
      }
      s = step(s, { k: 'confirmSelection', heroId: hero.id })
      continue
    }

    const active = activeUnit(s)
    if (!active) break
    if (active.side === 'enemy') {
      s = step(s, { k: 'advanceEnemy' })
      continue
    }
    const turn = s.heroTurn
    if (turn && !turn.topCard) {
      const hero = s.units.find((u) => u.id === turn.heroId)
      if (hero && hero.side === 'hero') {
        s = step(s, { k: 'assignTopCard', cardId: hero.selected[0]! })
        continue
      }
    }
    if (turn && !turn.topDone) {
      s = step(s, { k: 'skipHalf', half: 'top' })
      continue
    }
    if (turn && !turn.bottomDone) {
      s = step(s, { k: 'skipHalf', half: 'bottom' })
      continue
    }
    s = step(s, { k: 'endTurn' })
  }
  return s
}

function boardingBattle(modules: string[]): BattleState {
  return startMission({
    seed: 11,
    difficulty: 2,
    objective: { k: 'eliminate' },
    missionKind: 'combat',
    flux: 5,
    roundLimit: null,
    enemyScale: 1,
    installations: modules,
  })
}

describe('modules on the board', () => {
  it('are placed away from where the party lands', () => {
    const s = boardingBattle(['reinforcedHull', 'fuelSynthesiser'])
    expect(s.installations).toHaveLength(2)
    for (const installation of s.installations) {
      expect(s.units.some((u) => u.side === 'hero' && u.pos.x === installation.pos.x && u.pos.y === installation.pos.y)).toBe(false)
    }
  })

  it('are not placed at all when nothing is at stake', () => {
    expect(boardingBattle([]).installations).toHaveLength(0)
  })

  it('lose a point for every enemy standing beside them, at the end of a round', () => {
    const s = boardingBattle(['reinforcedHull'])
    const target = s.installations[0]!
    // Two enemies right next to it, and the round wrapped up.
    const [first, second] = livingEnemies(s)
    first!.pos = { x: target.pos.x + 1, y: target.pos.y }
    second!.pos = { x: target.pos.x, y: target.pos.y + 1 }
    const before = target.hp

    const after = playARound(s)
    expect(after.installations[0]?.hp ?? 0).toBeLessThan(before)
  })

  it('is destroyed when it runs out, and then it is simply gone', () => {
    const s = boardingBattle(['reinforcedHull'])
    s.installations[0]!.hp = 1
    const target = s.installations[0]!
    livingEnemies(s)[0]!.pos = { x: target.pos.x + 1, y: target.pos.y }

    const after = playARound(s)
    expect(after.installations).toHaveLength(0)
    expect(after.log.some((entry) => entry.event.k === 'installationLost')).toBe(true)
  })
})

describe('what the expedition loses', () => {
  const SPEC: MissionSpec = {
    kind: 'combat',
    objective: { k: 'eliminate' },
    difficulty: 2,
    enemyScale: 1,
    roundLimit: null,
    rewards: [],
    aboard: true,
    briefing: { hu: 'x', en: 'x' },
  }

  function withBoarding(modules: string[]): ExpeditionState {
    const s = startExpedition(99, 'medium', newArchive())
    s.modules = modules as ExpeditionState['modules']
    const battle = boardingBattle(modules)
    // Wreck the first one outright, as a fight would have.
    battle.installations = battle.installations.slice(1)
    s.activeMission = { k: 'battle', nodeId: s.at, spec: SPEC, battle }
    s.screen = 'mission'
    return s
  }

  it('removes a destroyed module for the rest of the run, win or lose', () => {
    for (const outcome of ['victory', 'defeat'] as const) {
      const before = withBoarding(['reinforcedHull', 'fuelSynthesiser'])
      const after = expeditionStep(before, { k: 'settleBattle', as: outcome })
      expect(after.modules, outcome).not.toContain('reinforcedHull')
      expect(after.modules, outcome).toContain('fuelSynthesiser')
      expect(after.log.some((e) => e.event.k === 'moduleLost'), outcome).toBe(true)
    }
  })

  it('keeps everything that was still standing', () => {
    const before = startExpedition(99, 'medium', newArchive())
    before.modules = ['reinforcedHull']
    before.activeMission = {
      k: 'battle',
      nodeId: before.at,
      spec: SPEC,
      battle: boardingBattle(['reinforcedHull']),
    }
    const after = expeditionStep(before, { k: 'settleBattle', as: 'victory' })
    expect(after.modules).toContain('reinforcedHull')
  })
})
