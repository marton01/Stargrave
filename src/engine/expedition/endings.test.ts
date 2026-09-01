// How an expedition can end, and what opens which door.
//
// The endgame used to be one number. Five endings read off the understanding
// total, in the same place, in the same order, every single run — so the last
// five minutes of a twenty-eight week expedition were the least interesting part
// of it, and the answer to "when does this game end?" was "when the clock stops".
//
// Four of the ten are earned instead: turning back for the Gate while you still
// can, arriving with the crew whole, having silenced what came hunting, carrying
// enough of the dead galaxy home in your hands. This file holds each of those
// conditions to being both NECESSARY and SUFFICIENT — the failure that matters is
// an ending that is listed in the Archive and cannot actually be reached.

import { describe, expect, it } from 'vitest'
import { EARNED_ENDINGS, ENDING_TEXTS, ENDING_TITLES, newArchive } from './archive'
import {
  availableEndings,
  canGoHome,
  expeditionStep,
  homewardFuel,
  startExpedition,
} from './expedition'
import type { EndingId, ExpeditionState } from './types'

/** An expedition standing at the Stargrave with `understanding` understood. */
function atTheHeart(understanding: number): ExpeditionState {
  const s = startExpedition(2024, 'medium', newArchive())
  s.understanding = understanding
  s.at = s.map.heartId
  s.screen = 'heart'
  return s
}

const ALL: EndingId[] = [
  'flee',
  'blindRuin',
  'witness',
  'intervene',
  'communion',
  'theAnswer',
  'homecoming',
  'custodian',
  'silence',
  'inheritance',
]

describe('every ending is a real ending', () => {
  it('has a title and a text in both languages', () => {
    for (const id of ALL) {
      expect(ENDING_TITLES[id].hu.length, `${id}: no Hungarian title`).toBeGreaterThan(3)
      expect(ENDING_TITLES[id].en.length, `${id}: no English title`).toBeGreaterThan(3)
      expect(ENDING_TEXTS[id].hu.length, `${id}: no Hungarian text`).toBeGreaterThan(80)
      expect(ENDING_TEXTS[id].en.length, `${id}: no English text`).toBeGreaterThan(80)
    }
  })

  it('is worth something to the Archive', () => {
    // Reached through the engine rather than by reading the table, so the two
    // cannot drift apart.
    for (const id of ALL) {
      const s = atTheHeart(20)
      s.flags.push('last-question', 'herald-silenced')
      s.relics = ['ash-reliquary', 'binding-cord', 'seed-vault']
      const after =
        id === 'homecoming'
          ? expeditionStep(homeward(), { k: 'chooseEnding', endingId: id })
          : expeditionStep(s, { k: 'chooseEnding', endingId: id })
      expect(after.outcome, `${id}: not reachable`).toEqual({
        k: 'ending',
        id,
        understanding: after.understanding,
      })
      expect(after.archiveEarned, `${id}: banks nothing`).toBeGreaterThan(0)
    }
  })
})

describe('the five read off understanding', () => {
  it('opens them one tier at a time', () => {
    expect(availableEndings(atTheHeart(0))).toEqual(['flee', 'blindRuin'])
    expect(availableEndings(atTheHeart(3))).toContain('witness')
    expect(availableEndings(atTheHeart(3))).not.toContain('intervene')
    expect(availableEndings(atTheHeart(8))).toContain('intervene')
    expect(availableEndings(atTheHeart(14))).toContain('communion')
  })

  it('keeps the last question behind the Archive as well as the understanding', () => {
    expect(availableEndings(atTheHeart(20))).not.toContain('theAnswer')
    const bought = atTheHeart(20)
    bought.flags.push('last-question')
    expect(availableEndings(bought)).toContain('theAnswer')
  })
})

describe('the ones you earn', () => {
  it('lists every one of them with a condition, in the Archive', () => {
    for (const entry of EARNED_ENDINGS) {
      expect(entry.condition.hu.length, entry.id).toBeGreaterThan(10)
      expect(entry.condition.en.length, entry.id).toBeGreaterThan(10)
    }
    // And the list is the same set the engine can actually offer.
    expect(EARNED_ENDINGS.map((e) => e.id).sort()).toEqual(
      ['custodian', 'homecoming', 'inheritance', 'silence'].sort(),
    )
  })

  it('opens the watch only for a ship that arrived whole', () => {
    const whole = atTheHeart(9)
    expect(whole.crew.filter((c) => c.alive).length).toBeGreaterThanOrEqual(5)
    expect(availableEndings(whole)).toContain('custodian')

    // Morale spent, and the offer closes.
    const tired = atTheHeart(9)
    tired.resources.morale = 5
    expect(availableEndings(tired)).not.toContain('custodian')

    // A crew half gone, and it closes too.
    const thinned = atTheHeart(9)
    for (const member of thinned.crew.slice(0, 3)) member.alive = false
    expect(availableEndings(thinned)).not.toContain('custodian')

    // And understanding alone is not enough for it either.
    const clever = atTheHeart(4)
    expect(availableEndings(clever)).not.toContain('custodian')
  })

  it('opens the silence only for a run that stopped the Herald', () => {
    const met = atTheHeart(4)
    expect(availableEndings(met)).not.toContain('silence')
    met.flags.push('herald-silenced')
    expect(availableEndings(met)).toContain('silence')
  })

  it('opens the inheritance only with three relics in hand', () => {
    const two = atTheHeart(4)
    two.relics = ['ash-reliquary', 'binding-cord']
    expect(availableEndings(two)).not.toContain('inheritance')
    two.relics.push('seed-vault')
    expect(availableEndings(two)).toContain('inheritance')
  })

  it('never offers turning back at the Stargrave itself', () => {
    const there = atTheHeart(20)
    expect(availableEndings(there)).not.toContain('homecoming')
    expect(canGoHome(there)).toBe(false)
  })
})

/** An expedition on the road, four columns in, with fuel in the tank. */
function homeward(): ExpeditionState {
  const s = startExpedition(4242, 'medium', newArchive())
  const deep = s.map.nodes.find((n) => n.column === 4)!
  s.at = deep.id
  s.resources.fuel = 30
  s.screen = 'starmap'
  return s
}

describe('turning back for the Gate', () => {
  it('costs fuel by the column, and more the deeper you are', () => {
    const near = startExpedition(4242, 'medium', newArchive())
    expect(homewardFuel(homeward())).toBeGreaterThan(homewardFuel(near))
  })

  it('is not an option without the fuel for it', () => {
    const dry = homeward()
    dry.resources.fuel = homewardFuel(dry) - 1
    expect(canGoHome(dry)).toBe(false)
    const after = expeditionStep(dry, { k: 'chooseEnding', endingId: 'homecoming' })
    expect(after.outcome).toBeNull()
  })

  it('is not an option in the middle of something', () => {
    const travelling = homeward()
    travelling.travel = { to: travelling.map.nodes[1]!.id, weeksLeft: 2 }
    expect(canGoHome(travelling)).toBe(false)
  })

  it('spends the fuel and ends the expedition as an ending, not a loss', () => {
    const s = homeward()
    const fuel = s.resources.fuel
    const after = expeditionStep(s, { k: 'chooseEnding', endingId: 'homecoming' })
    expect(after.outcome?.k).toBe('ending')
    expect(after.resources.fuel).toBe(fuel - homewardFuel(s))
    expect(after.screen).toBe('over')
  })

  it('banks more for a ship that carries something home', () => {
    const empty = expeditionStep(homeward(), { k: 'chooseEnding', endingId: 'homecoming' })
    const laden = homeward()
    laden.relics = ['ash-reliquary', 'binding-cord', 'seed-vault']
    const full = expeditionStep(laden, { k: 'chooseEnding', endingId: 'homecoming' })
    expect(full.archiveEarned).toBeGreaterThan(empty.archiveEarned)
  })
})

describe('reading the rim', () => {
  it('can be done once, and can move a run up a tier at the last moment', () => {
    const s = atTheHeart(12)
    // Twelve is short of the third tier by two, which is exactly what the
    // reading is worth. Before it, Communion is not on the table.
    expect(availableEndings(s)).not.toContain('communion')

    const opened = expeditionStep(s, { k: 'readHeart' })
    expect(opened.heartRead).toBe(true)
    expect(opened.activeMission?.k).toBe('puzzle')

    // A second attempt is refused: the same mechanism, not a fresh one.
    const again = expeditionStep(opened, { k: 'readHeart' })
    expect(again.activeMission).toEqual(opened.activeMission)
  })

  it('cannot be read anywhere but at the Stargrave', () => {
    const s = homeward()
    const after = expeditionStep(s, { k: 'readHeart' })
    expect(after.heartRead).toBe(false)
    expect(after.activeMission).toBeNull()
  })
})
