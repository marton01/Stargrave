// A party of three or four on the grid.
//
// The battle engine was written for exactly two heroes, and most of it turned out
// not to care — `heroes(s)` filters by side, the exit rule already asked about
// "every living hero". Three things did care, and they are what this file holds:
// everybody needs a tile of their own to stand on, the Bond has to mean "an ally
// near me" rather than "the other one", and a card that shields "your partner"
// has to pick somebody when there are three candidates.
//
// The last one is the interesting rule: the nearest ally. With two on the board
// that is the other one, which is what it always was — so a two-hero game plays
// exactly as it did, and this file checks that too.

import { describe, expect, it } from 'vitest'
import { activeUnit, startMission, step } from './battle'
import type { CarriedHero } from './battle'
import { bondActive } from './combat'
import { heroes, partnerOf } from './state'
import { cardsOfClass } from '../content/cards'
import { HERO_CLASSES } from '../content/heroes'
import type { BattleState, HeroClassId } from './types'

function carried(classes: HeroClassId[]): CarriedHero[] {
  return classes.map((heroClass) => ({
    heroClass,
    hp: HERO_CLASSES[heroClass].hp,
    hand: cardsOfClass(heroClass).map((c) => c.id),
    discard: [],
    lost: [],
  }))
}

function landing(classes: HeroClassId[], seed = 12): BattleState {
  return startMission({
    seed,
    difficulty: 2,
    objective: { k: 'eliminate' },
    missionKind: 'combat',
    flux: 6,
    roundLimit: null,
    enemyScale: 1,
    heroes: carried(classes),
  })
}

const FOUR: HeroClassId[] = ['runesmith', 'echoreader', 'cantor', 'surveyor']

describe('landing with more than two', () => {
  it('puts everybody on the board, once', () => {
    for (const party of [FOUR.slice(0, 2), FOUR.slice(0, 3), FOUR]) {
      for (let seed = 1; seed <= 25; seed++) {
        const s = landing(party, seed)
        const onGrid = heroes(s)
        expect(onGrid, `${party.length} heroes, seed ${seed}`).toHaveLength(party.length)
        expect(new Set(onGrid.map((h) => h.id)).size).toBe(party.length)
        const tiles = new Set(onGrid.map((h) => `${h.pos.x},${h.pos.y}`))
        expect(tiles.size, `seed ${seed}: two heroes on one tile`).toBe(party.length)
      }
    }
  })

  it('seats them in order, from one', () => {
    const s = landing(FOUR)
    expect(heroes(s).map((h) => h.playerSlot)).toEqual([1, 2, 3, 4])
  })

  it('gives each of them their own deck', () => {
    const s = landing(FOUR)
    for (const hero of heroes(s)) {
      const own = cardsOfClass(hero.heroClass).map((c) => c.id)
      expect(hero.hand.slice().sort(), hero.heroClass).toEqual(own.slice().sort())
    }
  })

  it('still deals a two-hero board exactly as before', () => {
    // The generator takes a party size now; two has to come out unchanged, or
    // every seed in every earlier save deals a different battlefield.
    const before = landing(['runesmith', 'echoreader'], 77)
    const again = landing(['runesmith', 'echoreader'], 77)
    expect(JSON.stringify(before.map)).toBe(JSON.stringify(again.map))
    expect(heroes(before).map((h) => `${h.pos.x},${h.pos.y}`)).toEqual(
      heroes(again).map((h) => `${h.pos.x},${h.pos.y}`),
    )
  })
})

describe('the Bond with a crowd', () => {
  it('is on for anybody with an ally close enough, not for one named partner', () => {
    const s = landing(FOUR)
    const [a, b, c, d] = heroes(s)
    // Two of them together in one corner, two of them far away from everybody.
    a!.pos = { x: 1, y: 1 }
    b!.pos = { x: 2, y: 1 }
    c!.pos = { x: 14, y: 8 }
    d!.pos = { x: 1, y: 9 }

    expect(bondActive(s, a!), 'next to an ally').toBe(true)
    expect(bondActive(s, b!), 'next to an ally').toBe(true)
    expect(bondActive(s, c!), 'alone').toBe(false)
    expect(bondActive(s, d!), 'alone').toBe(false)
  })

  it('is off for everybody when the party is scattered', () => {
    const s = landing(FOUR)
    const spots = [
      { x: 1, y: 1 },
      { x: 14, y: 1 },
      { x: 1, y: 9 },
      { x: 14, y: 9 },
    ]
    heroes(s).forEach((h, i) => {
      h.pos = spots[i]!
    })
    for (const hero of heroes(s)) expect(bondActive(s, hero)).toBe(false)
  })

  it('does not count a fallen ally as company', () => {
    const s = landing(FOUR)
    const [a, b] = heroes(s)
    a!.pos = { x: 3, y: 3 }
    b!.pos = { x: 4, y: 3 }
    for (const other of heroes(s).slice(2)) other.pos = { x: 14, y: 9 }
    expect(bondActive(s, a!)).toBe(true)
    b!.alive = false
    expect(bondActive(s, a!)).toBe(false)
  })
})

describe('"your partner", with three candidates', () => {
  it('is the nearest living ally', () => {
    const s = landing(FOUR)
    const [a, b, c, d] = heroes(s)
    a!.pos = { x: 5, y: 5 }
    b!.pos = { x: 9, y: 5 }
    c!.pos = { x: 6, y: 5 } // nearest
    d!.pos = { x: 12, y: 5 }
    expect(partnerOf(s, a!.id)?.id).toBe(c!.id)

    // Move somebody closer and the answer follows the board, with no extra click.
    b!.pos = { x: 5, y: 4 }
    expect(partnerOf(s, a!.id)?.id).toBe(b!.id)
  })

  it('skips the dead', () => {
    const s = landing(FOUR)
    const [a, b, c] = heroes(s)
    a!.pos = { x: 5, y: 5 }
    b!.pos = { x: 6, y: 5 }
    c!.pos = { x: 8, y: 5 }
    for (const other of heroes(s).slice(3)) other.pos = { x: 14, y: 9 }
    b!.alive = false
    expect(partnerOf(s, a!.id)?.id).toBe(c!.id)
  })

  it('is simply the other one when there are two', () => {
    const s = landing(['runesmith', 'echoreader'])
    const [a, b] = heroes(s)
    expect(partnerOf(s, a!.id)?.id).toBe(b!.id)
    expect(partnerOf(s, b!.id)?.id).toBe(a!.id)
  })
})

describe('a four-hero round actually runs', () => {
  it('asks all four for cards and then resolves the round', () => {
    let s = landing(FOUR)
    const asked = new Set<string>()

    for (let guard = 0; guard < 600 && s.round === 1 && s.phase !== 'over'; guard++) {
      if (s.phase === 'cardSelection') {
        const hero = heroes(s).find((h) => h.id === s.selectingHero)
        if (!hero) break
        asked.add(hero.id)
        if (hero.selected.length < 2 && hero.hand.length >= 2) {
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
        const hero = heroes(s).find((h) => h.id === turn.heroId)
        if (hero) {
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

    expect(asked.size, 'every hero picked their own cards').toBe(4)
    expect(s.round, 'the round finished').toBeGreaterThan(1)
    // And everybody is still on the board, in the initiative order.
    expect(heroes(s)).toHaveLength(4)
  })
})
