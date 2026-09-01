// The rune line has to be solvable, and it has to need everybody.
//
// Two promises, and a puzzle that breaks either one is worse than no puzzle.
//
// "Solvable" means exactly one order fits the clues. The game's other nine
// puzzles say in the help that no guessing is required; this one is generated
// rather than hand-built, so the only way to keep that promise is to check it by
// brute force at generation time — which is cheap, because six runes is 720
// orders.
//
// "Needs everybody" means every seat holds clues and owns runes. A task where
// one player has nothing to say and nothing to press is a task that player is
// watching rather than playing, which is the exact failure this whole mechanic
// exists to fix.

import { describe, expect, it } from 'vitest'
import { createRng } from '../rng'
import {
  cluesFor,
  expected,
  generateRuneLine,
  press,
  runeName,
  runesOf,
  solutions,
  taskStatus,
} from './runeline'
import type { RuneLineTask } from './runeline'

function make(seed: number, seats = 3, difficulty = 2): RuneLineTask {
  return generateRuneLine(createRng(seed), { seats, difficulty })
}

describe('the answer is derivable', () => {
  it('has exactly one order that fits the clues, at every size and seat count', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const seats of [1, 2, 3, 4]) {
        for (const difficulty of [1, 2, 3]) {
          const task = make(seed, seats, difficulty)
          const all = solutions(
            task.count,
            task.owner,
            task.clues.map((entry) => entry.clue),
            5,
          )
          expect(all, `seed ${seed}, ${seats} seats, difficulty ${difficulty}`).toHaveLength(1)
          expect(all[0]).toEqual(task.order)
        }
      }
    }
  })

  it('carries almost nothing the other clues already imply', () => {
    // Two promises pull against each other here: the clue set should be tight,
    // and every seat must hold at least one clue. When the tight set is smaller
    // than the table, a few true-but-implied clues are dealt back out so nobody
    // sits there with an empty panel. That padding is bounded by the number of
    // seats — anything beyond it would be a generator quietly going slack.
    for (let seed = 1; seed <= 25; seed++) {
      for (const seats of [2, 3, 4]) {
        const task = make(seed, seats, 2)
        const clues = task.clues.map((entry) => entry.clue)
        let redundant = 0
        for (let i = 0; i < clues.length; i++) {
          const without = clues.filter((_, j) => j !== i)
          if (solutions(task.count, task.owner, without, 5).length === 1) redundant += 1
        }
        expect(redundant, `seed ${seed}, ${seats} seats`).toBeLessThanOrEqual(seats)
      }
    }
  })

  it('says every clue about the order it actually generated', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const task = make(seed)
      const fits = solutions(task.count, task.owner, task.clues.map((e) => e.clue), 2)
      expect(fits[0], `seed ${seed}`).toEqual(task.order)
    }
  })
})

describe('everybody has something to do', () => {
  it('gives every seat at least one rune of their own', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const seats of [2, 3, 4]) {
        const task = make(seed, seats, 3)
        for (let seat = 1; seat <= seats; seat++) {
          expect(runesOf(task, seat).length, `seed ${seed}, seat ${seat}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('gives every seat at least one clue nobody else can see', () => {
    // Including the small ones: a four-rune line needs few clues to be unique,
    // and a seat left holding none is a player waiting to be told what to press.
    for (let seed = 1; seed <= 40; seed++) {
      for (const seats of [2, 3, 4]) {
        for (const difficulty of [1, 2, 3]) {
          const task = make(seed, seats, difficulty)
          for (let seat = 1; seat <= seats; seat++) {
            expect(
              cluesFor(task, seat).length,
              `seed ${seed}, ${seats} seats, difficulty ${difficulty}, seat ${seat}`,
            ).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('shows each clue to exactly one seat', () => {
    const task = make(7, 4, 3)
    const seen = task.clues.map((entry) => entry.seat)
    expect(new Set(seen).size).toBeGreaterThan(1)
    // And the whole set is the union of what the four of them hold.
    const gathered = [1, 2, 3, 4].flatMap((seat) => cluesFor(task, seat))
    expect(gathered).toHaveLength(task.clues.length)
  })
})

describe('pressing the line', () => {
  it('lights a rune pressed in the right order', () => {
    const task = make(3)
    const first = expected(task)!
    const after = press(task, first)
    expect(after.done).toEqual([first])
    expect(after.strikes).toBe(0)
    expect(taskStatus(after)).toBe('open')
  })

  it('takes a strike for the wrong one, and does not reset the line', () => {
    const task = make(3)
    const wrong = task.order[task.count - 1]!
    const after = press(task, wrong)
    expect(after.strikes).toBe(1)
    expect(after.done).toEqual([])

    // The right one still works: a mistake costs a strike, not the progress.
    const recovered = press(after, expected(after)!)
    expect(recovered.done).toHaveLength(1)
  })

  it('is solved when the whole line is lit', () => {
    let task = make(5)
    for (const rune of task.order) task = press(task, rune)
    expect(taskStatus(task)).toBe('solved')
  })

  it('fails on the last strike, and then nothing more happens', () => {
    let task = make(5, 3, 1)
    const wrong = task.order[task.count - 1]!
    for (let i = 0; i < task.maxStrikes; i++) task = press(task, wrong)
    expect(taskStatus(task)).toBe('failed')

    const after = press(task, expected(task) ?? 0)
    expect(after).toEqual(task)
  })

  it('ignores a rune that is already lit, and one that does not exist', () => {
    const task = press(make(9), expected(make(9))!)
    expect(press(task, task.done[0]!)).toEqual(task)
    expect(press(task, 99)).toEqual(task)
    expect(press(task, -1)).toEqual(task)
  })
})

describe('reading it out loud', () => {
  it('names every rune in both languages', () => {
    for (let rune = 0; rune < 6; rune++) {
      expect(runeName(rune).hu.length).toBeGreaterThan(2)
      expect(runeName(rune).en.length).toBeGreaterThan(2)
    }
  })
})
