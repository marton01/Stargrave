// Two rules that make a fight louder: the site acts, and the party can focus.
//
// The tactical layer had exactly one source of pressure — the enemies — and they
// announce everything a round ahead, which is right but predictable. These are
// the two additions, and each one is defended here against the way it would
// quietly stop working.
//
// The SITE takes a turn of its own on a schedule fixed at generation. The thing
// that matters is the warning: an event nobody saw coming is not tension, it is
// an annoyance, so every event must be announced a round before it fires.
//
// FOCUSED FIRE gives the second hero to hit a target in one round an extra
// point. It only means anything if it resets — a mark that accumulated over a
// long fight would just be "attack the same thing forever" — and if the grid
// shows it before the blow lands, like every other modifier.

import { describe, expect, it } from 'vitest'
import { startMission, step } from './battle'
import { dealDamage, focusedOn, predictDamage } from './combat'
import { heroes, livingEnemies } from './state'
import type { BattleState } from './types'

function battle(seed = 4, difficulty = 2): BattleState {
  return startMission({
    seed,
    difficulty,
    objective: { k: 'eliminate' },
    missionKind: 'combat',
    flux: 5,
    roundLimit: null,
    enemyScale: 1,
  })
}

/** End the round the blunt way: the same path `endRound` takes. */
function endRound(s: BattleState): BattleState {
  let out = s
  for (let guard = 0; guard < 300 && out.round === s.round && out.phase !== 'over'; guard++) {
    if (out.phase === 'cardSelection') {
      const hero = heroes(out).find((h) => h.id === out.selectingHero)
      if (!hero) break
      if (hero.selected.length < 2 && hero.hand.length >= 2) {
        const next = hero.hand.find((c) => !hero.selected.includes(c))!
        out = step(out, { k: 'selectCard', heroId: hero.id, cardId: next })
        continue
      }
      out = step(out, { k: 'confirmSelection', heroId: hero.id })
      continue
    }
    const turn = out.heroTurn
    if (turn && !turn.topCard) {
      const hero = heroes(out).find((h) => h.id === turn.heroId)
      if (hero) {
        out = step(out, { k: 'assignTopCard', cardId: hero.selected[0]! })
        continue
      }
    }
    if (turn && !turn.topDone) {
      out = step(out, { k: 'skipHalf', half: 'top' })
      continue
    }
    if (turn && !turn.bottomDone) {
      out = step(out, { k: 'skipHalf', half: 'bottom' })
      continue
    }
    if (out.heroTurn) {
      out = step(out, { k: 'endTurn' })
      continue
    }
    out = step(out, { k: 'advanceEnemy' })
  }
  return out
}

describe('the site takes a turn', () => {
  it('schedules its events at generation, from the seed', () => {
    const a = battle(77)
    const b = battle(77)
    expect(a.site).toEqual(b.site)
    expect(a.site.length).toBeGreaterThan(0)
    // Never in the first two rounds: the party gets to find its feet.
    for (const event of a.site) expect(event.at).toBeGreaterThanOrEqual(3)
  })

  it('spares exploration missions the reinforcements', () => {
    // Those runs are already against a clock; more enemies on top of it is a
    // wall rather than a decision.
    for (let seed = 1; seed <= 40; seed++) {
      const explore = startMission({
        seed,
        difficulty: 3,
        objective: { k: 'collect', count: 2 },
        missionKind: 'exploration',
        flux: 5,
        roundLimit: 16,
        enemyScale: 0.4,
      })
      expect(explore.site.every((event) => event.kind !== 'reinforcement'), `seed ${seed}`).toBe(true)
    }
  })

  it('announces what is coming a round before it happens', () => {
    let s = battle(5)
    s.site = [{ at: 2, kind: 'surge' }]
    // End of round one: nothing fires, but the warning goes out.
    s = endRound(s)
    expect(s.log.some((e) => e.event.k === 'siteComing')).toBe(true)
    expect(s.log.some((e) => e.event.k === 'siteFired')).toBe(false)
  })

  it('fires at the end of the round it names', () => {
    let s = battle(6)
    s.site = [{ at: 1, kind: 'surge' }]
    const flux = s.flux
    s = endRound(s)
    expect(s.log.some((e) => e.event.k === 'siteFired')).toBe(true)
    expect(s.flux).toBeGreaterThan(flux)
  })

  it('brings something through, at the far end of the room', () => {
    let s = battle(8)
    s.site = [{ at: 1, kind: 'reinforcement' }]
    const before = s.units.length
    s = endRound(s)
    expect(s.units.length).toBe(before + 1)

    const late = s.units[s.units.length - 1]!
    const nearest = Math.min(
      ...heroes(s).filter((h) => h.alive).map((h) => Math.max(
        Math.abs(h.pos.x - late.pos.x),
        Math.abs(h.pos.y - late.pos.y),
      )),
    )
    expect(nearest, 'it should not appear on top of the party').toBeGreaterThan(2)
  })

  it('never drops the floor out from under the way out, or under a relic', () => {
    // A hero can absolutely have the ground go under them — that is the whole
    // point of a collapsing floor, and the exploration missions have always
    // worked that way. What must never happen is the mission becoming
    // unfinishable because the exit or an objective fell into the dark.
    for (let seed = 1; seed <= 30; seed++) {
      let s = startMission({
        seed,
        difficulty: 2,
        objective: { k: 'collect', count: 2 },
        missionKind: 'exploration',
        flux: 5,
        roundLimit: 20,
        enemyScale: 0.4,
      })
      const before = s.collapsing.map((c) => `${c.pos.x},${c.pos.y}`)
      s.site = [{ at: 1, kind: 'collapse' }]
      s = endRound(s)

      for (const tile of s.collapsing) {
        const key = `${tile.pos.x},${tile.pos.y}`
        if (s.exit) expect(key, `seed ${seed}: the exit`).not.toBe(`${s.exit.x},${s.exit.y}`)
        for (const relic of s.relics) {
          expect(key, `seed ${seed}: a relic`).not.toBe(`${relic.x},${relic.y}`)
        }
      }
      // And it schedules new ground rather than counting the same tile twice.
      const after = s.collapsing.map((c) => `${c.pos.x},${c.pos.y}`)
      expect(new Set(after).size, `seed ${seed}`).toBe(after.length)
      expect(after.length, `seed ${seed}`).toBeGreaterThanOrEqual(before.length)
    }
  })
})

describe('focused fire', () => {
  it('adds nothing to the first hero to hit a target', () => {
    const s = battle(11)
    const [smith] = heroes(s)
    const target = livingEnemies(s)[0]!
    expect(focusedOn(s, smith!, target)).toBe(false)
    expect(predictDamage(s, smith!, target, 3)).toBe(predictDamage(s, smith!, target, 3))
  })

  it('adds one to the second hero to hit the same target in a round', () => {
    const s = battle(11)
    const [smith, reader] = heroes(s)
    const target = livingEnemies(s)[0]!
    // Out of Bond range of each other, so the only thing being measured is focus.
    smith!.pos = { x: 1, y: 1 }
    reader!.pos = { x: 13, y: 8 }

    const alone = predictDamage(s, reader!, target, 3)
    dealDamage(s, smith!, target, 3)
    const after = predictDamage(s, reader!, target, 3)
    expect(after).toBe(alone + 1)
    expect(focusedOn(s, reader!, target)).toBe(true)
  })

  it('does not reward one hero for hitting the same target twice', () => {
    const s = battle(11)
    const [smith] = heroes(s)
    const target = livingEnemies(s)[0]!
    const alone = predictDamage(s, smith!, target, 3)
    dealDamage(s, smith!, target, 3)
    expect(predictDamage(s, smith!, target, 3)).toBe(alone)
  })

  it('does not carry over into the next round', () => {
    let s = battle(12)
    const [smith] = heroes(s)
    const target = livingEnemies(s)[0]!
    dealDamage(s, smith!, target, 2)
    expect(Object.keys(s.struck).length).toBeGreaterThan(0)

    s = endRound(s)
    expect(s.struck).toEqual({})
  })

  it('is not something the enemies get', () => {
    const s = battle(13)
    const [smith] = heroes(s)
    const enemies = livingEnemies(s)
    dealDamage(s, enemies[0]!, smith!, 2)
    expect(focusedOn(s, enemies[1] ?? enemies[0]!, smith!)).toBe(false)
  })
})
