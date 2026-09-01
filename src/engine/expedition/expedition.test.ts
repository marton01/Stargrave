// Expedition smoke test.
//
// A bot plays whole expeditions end to end with legal actions only. This is not
// about balance — it is about the two failure modes that would be invisible until
// week twenty:
//
//   1. a state the game cannot get out of (nothing legal left to do),
//   2. an invariant quietly breaking (resources out of bounds, power over the
//      reactor, hero cards duplicating or vanishing).
//
// The bot also has to reach the Heart sometimes, otherwise the whole endgame
// would be unreachable and no test would notice.

import { describe, expect, it } from 'vitest'
import { isHero } from '../state'
import {
  canAdvanceWeek,
  expeditionStep,
  livingCrew,
  missionSettled,
  nodeEngageable,
  powerUsed,
  startExpedition,
  availableEndings,
  choiceAffordable,
  choiceAvailable,
  payableCards,
} from './expedition'
import type { ExpeditionAction } from './expedition'
import { bankExpedition, newArchive, purchaseUnlock } from './archive'
import { mapNode } from './starmap'
import { parseSave, serialiseSave } from './save'
import { activeUnit, canRest, mustRest } from '../battle'
import { card, cardsOfClass } from '../../content/cards'
import { encounter } from '../../content/encounters'
import { RESOURCES, RESOURCE_ORDER } from '../../content/ship'
import { applyPuzzleMove, puzzleStatus } from '../puzzles/index'
import type { Puzzle } from '../puzzles/types'
import { createRng, type Rng } from '../rng'
import type { ExpeditionLength, ExpeditionState } from './types'

/** One legal action, chosen the way a hurried but not stupid player would. */
function nextAction(s: ExpeditionState, rng: Rng): ExpeditionAction | null {
  // A mission in progress takes priority over everything.
  const mission = s.activeMission
  if (mission) {
    if (missionSettled(s)) return { k: 'missionFinish' }

    if (mission.k === 'puzzle') {
      // Solve the ones we can solve cheaply from the state; let the rest fail,
      // which exercises the failure path too.
      const p = mission.puzzle
      if (p.k === 'runeDecode') {
        const slot = p.s.draft.findIndex((v, i) => v !== p.s.secret[i])
        if (slot >= 0) {
          return { k: 'puzzleMove', move: { k: 'runeSetSlot', slot, symbol: p.s.secret[slot]! } }
        }
        return { k: 'puzzleMove', move: { k: 'runeSubmit' } }
      }
      if (p.k === 'safeGround') {
        const index = p.s.unstable.findIndex((bad, i) => bad && !p.s.marked[i])
        if (index >= 0) return { k: 'puzzleMove', move: { k: 'groundToggle', index } }
        return { k: 'puzzleMove', move: { k: 'groundSubmit' } }
      }
      if (p.k === 'glyphs') {
        const wanted: number[] = []
        for (let f = 0; f < p.s.features; f++) {
          if (p.s.query & (1 << f)) wanted.push(p.s.mapping[f]!)
        }
        const missing = wanted.find((c) => !p.s.answer.includes(c))
        if (missing !== undefined) {
          return { k: 'puzzleMove', move: { k: 'glyphToggle', concept: missing } }
        }
        return { k: 'puzzleMove', move: { k: 'glyphSubmit' } }
      }
      if (p.k === 'balanceScales') {
        const order = p.s.weights
          .map((weight, relic) => ({ weight, relic }))
          .sort((a, b) => a.weight - b.weight)
          .map((x) => x.relic)
        const next = order.find((r) => !p.s.order.includes(r))
        if (next !== undefined) return { k: 'puzzleMove', move: { k: 'scaleOrderPush', relic: next } }
        return { k: 'puzzleMove', move: { k: 'scaleSubmit' } }
      }
      // Anything else: give up and take the morale hit.
      return { k: 'missionFinish' }
    }

    // A rune line. The bot can see the secret order, which is the one thing no
    // player can — it is here to prove the activity runs to an end, not to
    // prove it is solvable. That is what runeline.test.ts is for.
    if (mission.k === 'task') {
      const next = mission.task.order[mission.task.done.length]
      if (next === undefined) return { k: 'missionFinish' }
      return { k: 'taskPress', rune: next }
    }

    // A battle. Same shape as the battle test's bot.
    const b = mission.battle
    if (b.phase === 'cardSelection') {
      const heroId = b.selectingHero
      if (!heroId) return { k: 'missionFinish' }
      const hero = b.units.find((u) => u.id === heroId)
      if (!isHero(hero)) return { k: 'missionFinish' }
      if (hero.resting) return { k: 'battleAction', action: { k: 'confirmSelection', heroId } }
      if (mustRest(hero)) {
        if (!canRest(hero)) return { k: 'missionFinish' }
        const loseCard = rng.pick(hero.discard)!
        return { k: 'battleAction', action: { k: 'rest', heroId, loseCard } }
      }
      if (hero.selected.length < 2) {
        const cardId = rng.pick(hero.hand.filter((c) => !hero.selected.includes(c)))
        if (!cardId) return { k: 'missionFinish' }
        return { k: 'battleAction', action: { k: 'selectCard', heroId, cardId } }
      }
      return { k: 'battleAction', action: { k: 'confirmSelection', heroId } }
    }

    const unit = activeUnit(b)
    if (!unit) return { k: 'missionFinish' }
    if (unit.side === 'enemy') return { k: 'battleAction', action: { k: 'advanceEnemy' } }

    const turn = b.heroTurn
    if (!turn) return { k: 'missionFinish' }
    if (b.pending) {
      const value = rng.pick(b.pending.options)
      if (!value) return { k: 'missionFinish' }
      return { k: 'battleAction', action: { k: 'choose', value } }
    }
    if (!turn.topCard) {
      const hero = b.units.find((u) => u.id === turn.heroId)
      if (!isHero(hero)) return { k: 'missionFinish' }
      const cardId = rng.pick(hero.selected)
      if (!cardId) return { k: 'missionFinish' }
      return { k: 'battleAction', action: { k: 'assignTopCard', cardId } }
    }
    for (const half of ['top', 'bottom'] as const) {
      if (half === 'top' ? turn.topDone : turn.bottomDone) continue
      const cardId = half === 'top' ? turn.topCard : turn.bottomCard
      if (!cardId) return { k: 'battleAction', action: { k: 'skipHalf', half } }
      const cost = (half === 'top' ? card(cardId).top : card(cardId).bottom).flux ?? 0
      return cost > b.flux
        ? { k: 'battleAction', action: { k: 'skipHalf', half } }
        : { k: 'battleAction', action: { k: 'playHalf', half } }
    }
    return { k: 'battleAction', action: { k: 'endTurn' } }
  }

  // An encounter waiting for a decision.
  const pending = s.pendingEncounter
  if (pending) {
    if (pending.resolvedText) return { k: 'encounterClose' }
    const def = encounter(pending.id)
    if (pending.chosen === null) {
      const options = def.choices
        .map((choice, index) => ({ choice, index }))
        .filter(({ choice }) => choiceAvailable(s, choice) && choiceAffordable(s, choice))
      const pick = rng.pick(options)
      // Every encounter must always leave at least one takeable choice.
      if (!pick) return { k: 'encounterClose' }
      return { k: 'encounterChoose', index: pick.index }
    }
    const choice = def.choices[pending.chosen]!
    const cost = choice.costs.find((c) => c.k === 'cards')
    if (cost && cost.k === 'cards' && pending.payment.length < cost.count) {
      const candidates = payableCards(s, cost.symbol).filter(
        (c) => !pending.payment.includes(`${c.heroClass}:${c.cardId}`),
      )
      const pick = rng.pick(candidates)
      if (!pick) return { k: 'encounterClose' }
      return { k: 'encounterPayCard', heroClass: pick.heroClass, cardId: pick.cardId }
    }
    return { k: 'encounterConfirm' }
  }

  // The Heart: take the best ending on offer.
  if (s.screen === 'heart' || s.at === s.map.heartId) {
    const endings = availableEndings(s)
    return { k: 'chooseEnding', endingId: endings[endings.length - 1]! }
  }

  if (s.screen === 'market') {
    const node = mapNode(s.map, s.at)
    if (node.event.k === 'market') {
      const index = node.event.offers.findIndex((o) => !o.bought && o.price <= s.resources.credits)
      if (index >= 0) return { k: 'marketBuy', index }
    }
    return { k: 'openScreen', screen: 'starmap' }
  }

  if (nodeEngageable(s)) return { k: 'engageNode' }

  if (!s.travel) {
    const here = mapNode(s.map, s.at)
    const target = rng.pick(here.links)
    if (target) return { k: 'setCourse', nodeId: target }
    // No way forward at all should be impossible; fail loudly rather than hang.
    return null
  }

  if (canAdvanceWeek(s)) return { k: 'advanceWeek' }
  return null
}

function run(seed: number, length: ExpeditionLength = 'short') {
  const archive = newArchive()
  let s = startExpedition(seed, length, archive)
  const rng = createRng(seed + 991)
  let steps = 0
  let reachedHeart = false

  while (!s.outcome && steps < 30000) {
    const action = nextAction(s, rng)
    if (!action) break
    const next = expeditionStep(s, action)
    if (next === s) break
    s = next
    steps += 1
    if (s.at === s.map.heartId) reachedHeart = true

    // Invariants, checked every single step rather than at the end — that is how
    // you find out WHICH action broke them.
    for (const id of RESOURCE_ORDER) {
      const value = s.resources[id]
      if (value < 0 || Number.isNaN(value)) {
        throw new Error(`seed ${seed}: resource ${id} went to ${value} after ${action.k}`)
      }
    }
    if (powerUsed(s) > s.reactorOutput) {
      throw new Error(
        `seed ${seed}: power ${powerUsed(s)} exceeds reactor ${s.reactorOutput} after ${action.k}`,
      )
    }
  }

  return { s, steps, reachedHeart }
}

describe('expedition', () => {
  it('every expedition reaches an outcome without stalling', () => {
    for (let seed = 1; seed <= 24; seed++) {
      const { s, steps } = run(seed)
      expect(s.outcome, `seed ${seed}: no outcome after ${steps} steps, week ${s.week}`).not.toBeNull()
      expect(steps, `seed ${seed}: suspiciously many steps`).toBeLessThan(30000)
    }
  })

  it('works at every length', () => {
    for (const length of ['short', 'medium', 'long'] as const) {
      for (let seed = 100; seed < 106; seed++) {
        const { s } = run(seed, length)
        expect(s.outcome, `${length} seed ${seed}`).not.toBeNull()
      }
    }
  })

  it('the Heart is reachable, and reaching it gives an ending', () => {
    let heartRuns = 0
    let endings = 0
    for (let seed = 200; seed < 230; seed++) {
      const { s, reachedHeart } = run(seed)
      if (reachedHeart) heartRuns += 1
      if (s.outcome?.k === 'ending') endings += 1
    }
    expect(heartRuns, 'the bot never reached the Heart in 30 runs').toBeGreaterThan(0)
    expect(endings, 'reaching the Heart never produced an ending').toBeGreaterThan(0)
  })

  it('resources never exceed their ceiling', () => {
    for (let seed = 300; seed < 315; seed++) {
      const { s } = run(seed)
      for (const id of RESOURCE_ORDER) {
        // Modules can raise a ceiling, so we allow the generous bound.
        expect(s.resources[id], `seed ${seed}: ${id}`).toBeLessThanOrEqual(RESOURCES[id].max + 40)
      }
    }
  })

  it('hero card sets never duplicate or vanish', () => {
    for (let seed = 400; seed < 415; seed++) {
      const { s } = run(seed)
      for (const hero of s.heroes) {
        const all = [...hero.hand, ...hero.discard, ...hero.lost]
        expect(new Set(all).size, `seed ${seed} ${hero.heroClass}: duplicate card`).toBe(all.length)
        expect(all.length, `seed ${seed} ${hero.heroClass}: card vanished`).toBe(
          cardsOfClass(hero.heroClass).length,
        )
      }
    }
  })

  it('always keeps at least one crew member alive', () => {
    for (let seed = 500; seed < 515; seed++) {
      const { s } = run(seed)
      expect(livingCrew(s).length, `seed ${seed}`).toBeGreaterThan(0)
    }
  })

  it('every encounter always offers at least one takeable choice', () => {
    // A choice list where nothing is takeable would be a dead end. We check the
    // content directly rather than hoping the bot happens to walk into it.
    for (let seed = 600; seed < 612; seed++) {
      const s = startExpedition(seed, 'medium', newArchive())
      for (const node of s.map.nodes) {
        if (node.event.k !== 'encounter') continue
        const def = encounter(node.event.encounterId)
        const takeable = def.choices.filter(
          (choice) => choiceAvailable(s, choice) || choice.costs.length === 0,
        )
        expect(
          takeable.length,
          `${def.id}: nothing is takeable from a fresh ship`,
        ).toBeGreaterThan(0)
      }
    }
  })
})

describe('archive and saving', () => {
  it('banking an expedition never loses points and records history', () => {
    const { s } = run(7)
    const archive = bankExpedition(newArchive(), s)
    expect(archive.expeditionsRun).toBe(1)
    expect(archive.history.length).toBe(1)
    expect(archive.points).toBeGreaterThanOrEqual(0)
    expect(archive.bestUnderstanding).toBe(s.understanding)
  })

  it('unlocks cost what they say and cannot be bought twice', () => {
    let archive = { ...newArchive(), points: 100 }
    const before = archive.points
    archive = purchaseUnlock(archive, 'puzzle-balanceScales')
    expect(archive.unlocked).toContain('puzzle-balanceScales')
    expect(archive.points).toBe(before - 4)
    const again = purchaseUnlock(archive, 'puzzle-balanceScales')
    expect(again.points).toBe(archive.points)
  })

  it('a save round-trips, and a broken one does not crash the game', () => {
    const { s } = run(11)
    const state = { archive: bankExpedition(newArchive(), s), expedition: s, room: null }
    const restored = parseSave(serialiseSave(state))
    expect(restored).not.toBeNull()
    expect(restored!.expedition?.week).toBe(s.week)
    expect(restored!.archive.points).toBe(state.archive.points)

    expect(parseSave('not json at all')).toBeNull()
    expect(parseSave('{"version":1}')).toBeNull()
    // A future version keeps the Archive and drops the run rather than guessing.
    const future = parseSave(
      JSON.stringify({ version: 99, archive: state.archive, expedition: s }),
    )
    expect(future?.expedition).toBeNull()
    expect(future?.archive.points).toBe(state.archive.points)
  })
})

describe('puzzle rewards flow through', () => {
  it('a solved expedition puzzle grants its reward', () => {
    // Walk the ship straight onto a puzzle node and finish it, so the reward
    // path is exercised even if the roaming bot never happens to solve one.
    let solvedSomewhere = false

    for (let seed = 4200; seed < 4260 && !solvedSomewhere; seed++) {
      let s = startExpedition(seed, 'short', newArchive())
      const node = s.map.nodes.find((n) => n.event.k === 'puzzle')
      if (!node) continue
      s = { ...s, at: node.id }
      s = expeditionStep(s, { k: 'engageNode' })

      const mission = s.activeMission
      if (mission?.k !== 'puzzle' || mission.puzzle.k !== 'runeDecode') continue

      const before = s.archiveEarned
      let puzzle: Puzzle = mission.puzzle
      mission.puzzle.s.secret.forEach((symbol, slot) => {
        puzzle = applyPuzzleMove(puzzle, { k: 'runeSetSlot', slot, symbol })
      })
      puzzle = applyPuzzleMove(puzzle, { k: 'runeSubmit' })
      expect(puzzleStatus(puzzle)).toBe('solved')

      s = { ...s, activeMission: { ...mission, puzzle } }
      s = expeditionStep(s, { k: 'missionFinish' })
      expect(s.archiveEarned).toBeGreaterThan(before)
      expect(s.activeMission).toBeNull()
      solvedSomewhere = true
    }

    expect(solvedSomewhere, 'no seed produced a rune-decode puzzle node').toBe(true)
  })
})
