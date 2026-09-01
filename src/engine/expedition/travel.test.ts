// Engine power: speed against thirst.
//
// The Engines were described as setting both how long a jump takes and what it
// costs in fuel, and only the first was implemented — so power on the engines was
// free speed, and there was no reason not to pour it in. These tests pin the
// trade down, including the part that makes it a decision rather than a slider:
// there is a right amount of engine for a given journey, and more than that is
// the same speed for more fuel.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  canSetCourse,
  expeditionStep,
  startExpedition,
  travelFuel,
  travelWeeks,
} from './expedition'
import type { ExpeditionState } from './types'

function ship(enginePower: number, bridgeCrew = false): ExpeditionState {
  const s = startExpedition(1, 'medium', newArchive())
  s.power.engines = enginePower
  if (!bridgeCrew) {
    // The default postings put a navigator on the Bridge, which trims a unit off
    // every week; most of these cases are about the engines alone.
    for (const member of s.crew) if (member.station === 'bridge') member.station = null
  }
  return s
}

/** Total fuel for a journey: weeks under way times the burn each week. */
function totalFuel(s: ExpeditionState, base: number): number {
  return travelWeeks(s, base) * travelFuel(s)
}

describe('engine power', () => {
  it('cuts a week off for every point above the first', () => {
    expect(travelWeeks(ship(0), 3)).toBe(3)
    expect(travelWeeks(ship(1), 3)).toBe(3)
    expect(travelWeeks(ship(2), 3)).toBe(2)
    expect(travelWeeks(ship(3), 3)).toBe(1)
    // And never below one week, however much power is on it.
    expect(travelWeeks(ship(5), 3)).toBe(1)
  })

  it('burns a unit more for every point above the second', () => {
    expect(travelFuel(ship(0))).toBe(2)
    expect(travelFuel(ship(2))).toBe(2)
    expect(travelFuel(ship(3))).toBe(3)
    expect(travelFuel(ship(4))).toBe(4)
  })

  it('has a right amount for a journey, and a wasteful one', () => {
    const three = [0, 1, 2, 3, 4, 5].map((power) => totalFuel(ship(power), 3))
    // 3 power is the cheapest way across a three-week road...
    expect(Math.min(...three)).toBe(three[3])
    // ...and 4 buys nothing: the same single week, one more fuel a week.
    expect(travelWeeks(ship(4), 3)).toBe(travelWeeks(ship(3), 3))
    expect(three[4]).toBeGreaterThan(three[3]!)
  })

  it('is trimmed by the Bridge, every week of the way', () => {
    const withoutBridge = travelFuel(ship(4))
    const withBridge = travelFuel(ship(4, true))
    expect(withBridge).toBe(withoutBridge - 1)
  })

  it('never burns less than one unit a week', () => {
    const s = ship(0, true)
    s.dials.upkeep = 1 // the gentlest upkeep dial
    expect(travelFuel(s)).toBeGreaterThanOrEqual(1)
  })
})

describe("the week's fuel balance", () => {
  /** What a week actually does to the tank, module offset included. */
  function weekFuelChange(s: ExpeditionState, travelling: boolean): number {
    s.travel = travelling ? { to: s.map.nodes[1]!.id, weeksLeft: 3 } : null
    s.resources.fuel = 30
    const after = expeditionStep(s, { k: 'advanceWeek' })
    return after.resources.fuel - 30
  }

  it('costs fuel to travel, without the synthesiser', () => {
    expect(weekFuelChange(ship(1, true), true)).toBeLessThan(0)
  })

  it('can be brought to exactly zero with the synthesiser', () => {
    // One unit of thirst at engine power 1 with the Bridge manned, and the
    // synthesiser offsets exactly one: travel for nothing, which is what the
    // research is for.
    const s = ship(1, true)
    s.modules.push('fuelSynthesiser')
    expect(travelFuel(s)).toBe(1)
    expect(weekFuelChange(s, true)).toBe(0)
  })

  it('never lets the tank grow on its own — not travelling, not standing still', () => {
    for (const engines of [0, 1, 2, 3, 4]) {
      for (const upkeep of [1, 2, 3, 4, 5]) {
        for (const travelling of [true, false]) {
          const s = ship(engines, true)
          s.modules.push('fuelSynthesiser')
          s.dials.upkeep = upkeep
          const change = weekFuelChange(s, travelling)
          expect(
            change,
            `engines ${engines}, upkeep ${upkeep}, ${travelling ? 'under way' : 'standing still'}`,
          ).toBeLessThanOrEqual(0)
        }
      }
    }
  })

  it('leaves the other producing modules alone', () => {
    // Only fuel is treated as an offset; hydroponics still fills the hold.
    const s = ship(1, true)
    s.modules.push('hydroponics')
    s.resources.food = 10
    const after = expeditionStep(s, { k: 'advanceWeek' })
    expect(after.resources.food).toBeGreaterThan(10 - 3)
  })
})

describe('cold engines', () => {
  // The first point of engine power used to buy nothing at all: the same speed
  // and the same fuel as no power whatsoever. A tester compared one and two,
  // found the fuel identical, and went looking for the difference. Now the first
  // point is the difference between a ship and a wreck with lights on.
  it('cannot set a course', () => {
    const s = ship(0)
    expect(canSetCourse(s)).toBe(false)
    const after = expeditionStep(s, { k: 'setCourse', nodeId: s.map.nodes[1]!.id })
    expect(after.travel).toBeNull()
  })

  it('can set a course on a single point', () => {
    const s = ship(1)
    expect(canSetCourse(s)).toBe(true)
    const after = expeditionStep(s, { k: 'setCourse', nodeId: s.map.nodes[1]!.id })
    expect(after.travel).not.toBeNull()
  })

  it('stalls a jump already under way, and the week still passes', () => {
    const s = ship(1)
    const under = expeditionStep(s, { k: 'setCourse', nodeId: s.map.nodes[1]!.id })
    const weeksLeft = under.travel!.weeksLeft
    const cold = expeditionStep(under, { k: 'setPower', system: 'engines', value: 0 })
    const after = expeditionStep(cold, { k: 'advanceWeek' })
    expect(after.travel!.weeksLeft, 'no headway').toBe(weeksLeft)
    expect(after.week, 'the week goes anyway').toBe(under.week + 1)
    expect(after.log.some((e) => e.event.k === 'enginesCold')).toBe(true)
  })
})
