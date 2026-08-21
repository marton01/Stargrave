// Puzzle generator guarantees.
//
// Two promises to keep, and both are easy to break by accident:
//  1. every generated puzzle is solvable,
//  2. no puzzle starts already solved (that is not a puzzle, that is a door).
//
// For the scramble-generated ones we verify solvability by actually replaying a
// solution. For the deduction ones the generator itself brute-forces uniqueness,
// so here we only check the shape and that a correct submission is accepted.

import { describe, expect, it } from 'vitest'
import { applyPuzzleMove, generatePuzzle, puzzleStatus, PUZZLE_KINDS } from './index'
import { edgeAt, poweredTiles, rotateMask, scoreGuess, traceBeam } from './index'
import type { Puzzle, PuzzleKind } from './types'

const SEEDS = Array.from({ length: 30 }, (_, i) => 5000 + i * 37)
const DIFFICULTIES = [1, 2, 3]

function each(fn: (kind: PuzzleKind, seed: number, difficulty: number, p: Puzzle) => void) {
  for (const kind of PUZZLE_KINDS) {
    for (const difficulty of DIFFICULTIES) {
      for (const seed of SEEDS) {
        fn(kind, seed, difficulty, generatePuzzle(kind, seed, difficulty))
      }
    }
  }
}

describe('puzzle generation', () => {
  it('never hands back a puzzle that is already solved', () => {
    each((kind, seed, difficulty, p) => {
      // Deduction puzzles need a submission, so "open" is their only sane start.
      expect(puzzleStatus(p), `${kind} seed ${seed} d${difficulty}`).toBe('open')
    })
  })

  it('produces well formed state', () => {
    each((kind, seed, difficulty, p) => {
      const where = `${kind} seed ${seed} d${difficulty}`
      switch (p.k) {
        case 'runeDecode':
          expect(p.s.secret.length, where).toBe(p.s.length)
          expect(p.s.maxAttempts, where).toBeGreaterThan(3)
          break
        case 'balanceScales':
          expect(new Set(p.s.weights).size, where).toBe(p.s.count)
          expect(p.s.maxWeighings, where).toBeGreaterThan(2)
          break
        case 'glyphs':
          expect(p.s.examples.length, where).toBeGreaterThan(0)
          expect(p.s.query, where).toBeGreaterThan(0)
          break
        case 'safeGround':
          expect(p.s.unstable.filter(Boolean).length, where).toBeGreaterThan(0)
          expect(p.s.clues.length, where).toBe(p.s.w * p.s.h)
          break
        case 'powerRouting':
          expect(p.s.targets.length, where).toBeGreaterThan(0)
          expect(p.s.empty[p.s.source], where).toBe(false)
          break
        case 'refraction':
          expect(p.s.targets.length, where).toBeGreaterThan(0)
          break
        case 'starChart':
          expect(p.s.fragments.length, where).toBe(p.s.size * p.s.size)
          break
        case 'resonance':
          expect(p.s.values.some((v) => v !== 0), where).toBe(true)
          break
        case 'gravityCores':
          expect(p.s.cores.length, where).toBe(p.s.goals.length)
          expect(p.s.walls[p.s.hero], where).toBe(false)
          break
      }
    })
  })
})

describe('puzzles are solvable', () => {
  it('rune decode: submitting the secret wins', () => {
    for (const seed of SEEDS) {
      let p = generatePuzzle('runeDecode', seed, 2)
      if (p.k !== 'runeDecode') throw new Error('kind')
      const secret = [...p.s.secret]
      secret.forEach((symbol, slot) => {
        p = applyPuzzleMove(p, { k: 'runeSetSlot', slot, symbol })
      })
      p = applyPuzzleMove(p, { k: 'runeSubmit' })
      expect(puzzleStatus(p), `seed ${seed}`).toBe('solved')
    }
  })

  it('rune decode scoring never exceeds the length', () => {
    for (const seed of SEEDS) {
      const p = generatePuzzle('runeDecode', seed, 3)
      if (p.k !== 'runeDecode') throw new Error('kind')
      const { exact, partial } = scoreGuess(p.s.secret, p.s.secret)
      expect(exact).toBe(p.s.length)
      expect(partial).toBe(0)
    }
  })

  it('balance scales: submitting the true order wins', () => {
    for (const seed of SEEDS) {
      let p = generatePuzzle('balanceScales', seed, 2)
      if (p.k !== 'balanceScales') throw new Error('kind')
      const order = p.s.weights
        .map((weight, relic) => ({ weight, relic }))
        .sort((a, b) => a.weight - b.weight)
        .map((x) => x.relic)
      for (const relic of order) p = applyPuzzleMove(p, { k: 'scaleOrderPush', relic })
      p = applyPuzzleMove(p, { k: 'scaleSubmit' })
      expect(puzzleStatus(p), `seed ${seed}`).toBe('solved')
    }
  })

  it('glyphs: the examples pin the mapping down to exactly one', () => {
    for (const seed of SEEDS) {
      let p = generatePuzzle('glyphs', seed, 2)
      if (p.k !== 'glyphs') throw new Error('kind')
      const expected: number[] = []
      for (let f = 0; f < p.s.features; f++) {
        if (p.s.query & (1 << f)) expected.push(p.s.mapping[f]!)
      }
      for (const concept of expected) p = applyPuzzleMove(p, { k: 'glyphToggle', concept })
      p = applyPuzzleMove(p, { k: 'glyphSubmit' })
      expect(puzzleStatus(p), `seed ${seed}`).toBe('solved')
    }
  })

  it('safe ground: marking the unstable tiles wins', () => {
    for (const seed of SEEDS) {
      let p = generatePuzzle('safeGround', seed, 2)
      if (p.k !== 'safeGround') throw new Error('kind')
      p.s.unstable.forEach((bad, index) => {
        if (bad) p = applyPuzzleMove(p, { k: 'groundToggle', index })
      })
      p = applyPuzzleMove(p, { k: 'groundSubmit' })
      expect(puzzleStatus(p), `seed ${seed}`).toBe('solved')
    }
  })

  it('power routing: restoring the derived rotations lights every terminal', () => {
    for (const seed of SEEDS) {
      const p = generatePuzzle('powerRouting', seed, 2)
      if (p.k !== 'powerRouting') throw new Error('kind')
      // Every board is scrambled from a spanning tree, so putting the tiles
      // back into the derived rotations must connect the reactor to all of them.
      const solved = { ...p.s, masks: [...p.s.solvedMasks] }
      const lit = poweredTiles(solved)
      for (const target of p.s.targets) {
        expect(lit.has(target), `seed ${seed}: terminal ${target} unreachable`).toBe(true)
      }
      // And every current mask has to be a rotation of its solved mask, or the
      // player could never get there by turning tiles.
      p.s.masks.forEach((mask, i) => {
        if (p.s.empty[i]) return
        const rotations = [0, 1, 2, 3].map((t) => rotateMask(p.s.solvedMasks[i]!, t))
        expect(rotations, `seed ${seed}: tile ${i} is not a rotation`).toContain(mask)
      })
    }
  })

  it('refraction: restoring the derived mirror set lights every focus', () => {
    for (const seed of SEEDS.slice(0, 15)) {
      const p = generatePuzzle('refraction', seed, 2)
      if (p.k !== 'refraction') throw new Error('kind')
      // Try all mirror orientation combinations for small mirror counts.
      const mirrorIndexes = p.s.mirrors.map((m, i) => (m !== 0 ? i : -1)).filter((i) => i >= 0)
      expect(mirrorIndexes.length, `seed ${seed}`).toBeLessThanOrEqual(6)
      let solvable = false
      for (let combo = 0; combo < 1 << mirrorIndexes.length; combo++) {
        const mirrors = [...p.s.mirrors]
        mirrorIndexes.forEach((index, bit) => {
          mirrors[index] = combo & (1 << bit) ? 2 : 1
        })
        const hit = new Set(traceBeam({ ...p.s, mirrors }))
        if (p.s.targets.every((t) => hit.has(t))) {
          solvable = true
          break
        }
      }
      expect(solvable, `seed ${seed}: no mirror arrangement lights every focus`).toBe(true)
    }
  })

  it('star chart: some placement satisfies every seam', () => {
    for (const seed of SEEDS.slice(0, 15)) {
      const p = generatePuzzle('starChart', seed, 1)
      if (p.k !== 'starChart') throw new Error('kind')
      const size = p.s.size
      const cells = size * size
      const placement: (number | null)[] = Array.from({ length: cells }, () => null)
      const rotation = [...p.s.rotation]
      const used = new Set<number>()

      const fits = (cell: number, fragment: number, rot: number): boolean => {
        const x = cell % size
        const y = Math.floor(cell / size)
        if (x > 0) {
          const left = placement[cell - 1]
          if (left !== null) {
            if (
              edgeAt(p.s.fragments[left]!, rotation[left]!, 1) !==
              edgeAt(p.s.fragments[fragment]!, rot, 3)
            ) {
              return false
            }
          }
        }
        if (y > 0) {
          const above = placement[cell - size]
          if (above !== null) {
            if (
              edgeAt(p.s.fragments[above]!, rotation[above]!, 2) !==
              edgeAt(p.s.fragments[fragment]!, rot, 0)
            ) {
              return false
            }
          }
        }
        return true
      }

      const solve = (cell: number): boolean => {
        if (cell === cells) return true
        for (let fragment = 0; fragment < cells; fragment++) {
          if (used.has(fragment)) continue
          for (let rot = 0; rot < 4; rot++) {
            if (!fits(cell, fragment, rot)) continue
            placement[cell] = fragment
            rotation[fragment] = rot
            used.add(fragment)
            if (solve(cell + 1)) return true
            used.delete(fragment)
            placement[cell] = null
          }
        }
        return false
      }

      expect(solve(0), `seed ${seed}: no valid arrangement exists`).toBe(true)
    }
  })

  it('resonance: the scramble can always be untapped', () => {
    for (const seed of SEEDS.slice(0, 15)) {
      let p = generatePuzzle('resonance', seed, 2)
      if (p.k !== 'resonance') throw new Error('kind')
      const { w, h, modulus } = p.s
      // Chase the lights: fix rows top-down, then check the last row is clear.
      // For a solvable board this reduces to zero for at least one seed row set,
      // so we brute-force the first row (small boards keep this cheap).
      let solved = false
      for (let firstRow = 0; firstRow < modulus ** w && !solved; firstRow++) {
        let candidate = generatePuzzle('resonance', seed, 2)
        if (candidate.k !== 'resonance') throw new Error('kind')
        let digits = firstRow
        for (let x = 0; x < w; x++) {
          const taps = digits % modulus
          digits = Math.floor(digits / modulus)
          for (let t = 0; t < taps; t++) {
            candidate = applyPuzzleMove(candidate, { k: 'resonanceTap', index: x })
          }
        }
        for (let y = 1; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (candidate.k !== 'resonance') throw new Error('kind')
            const above = candidate.s.values[(y - 1) * w + x]!
            const taps = (modulus - above) % modulus
            for (let t = 0; t < taps; t++) {
              candidate = applyPuzzleMove(candidate, { k: 'resonanceTap', index: y * w + x })
            }
          }
        }
        if (puzzleStatus(candidate) === 'solved') {
          solved = true
          p = candidate
        }
      }
      expect(solved, `seed ${seed}: the dials cannot be cleared`).toBe(true)
      expect(puzzleStatus(p)).toBe('solved')
    }
  })

  it('gravity cores: a breadth-first search finds a solution', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const p = generatePuzzle('gravityCores', seed, 1)
      if (p.k !== 'gravityCores') throw new Error('kind')

      const key = (hero: number, cores: readonly number[]) =>
        `${hero}|${[...cores].sort((a, b) => a - b).join(',')}`
      const start = { k: 'gravityCores' as const, s: { ...p.s, history: [] } }
      const seen = new Set([key(start.s.hero, start.s.cores)])
      let frontier: Puzzle[] = [start]
      let found = puzzleStatus(start) === 'solved'
      let depth = 0

      while (frontier.length > 0 && !found && depth < 30) {
        const next: Puzzle[] = []
        for (const node of frontier) {
          for (const dir of [0, 1, 2, 3]) {
            const moved = applyPuzzleMove(node, { k: 'coreStep', dir })
            if (moved.k !== 'gravityCores') continue
            const id = key(moved.s.hero, moved.s.cores)
            if (seen.has(id)) continue
            seen.add(id)
            if (puzzleStatus(moved) === 'solved') {
              found = true
              break
            }
            next.push({ k: 'gravityCores', s: { ...moved.s, history: [] } })
          }
          if (found) break
        }
        frontier = next
        depth += 1
      }

      expect(found, `seed ${seed}: the cores cannot be pushed home`).toBe(true)
    }
  })
})
