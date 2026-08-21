// The four deduction puzzles.
//
// These are the ones where ambiguity would be fatal — a puzzle you can only
// finish by guessing feels like a cheat. So every generator here brute-forces
// the solution space and regenerates until the answer is the ONLY one
// consistent with the clues shown.

import type { Rng } from '../rng'
import { DIRS, idx, xy } from './types'
import type {
  BalanceScalesState,
  GlyphsState,
  PuzzleMove,
  RuneDecodeState,
  SafeGroundState,
} from './types'

// =============================================================== rune decode
//
// Mastermind with runes. Deducible, quick, and it is the puzzle two people talk
// through most naturally: one tracks what is ruled out, the other proposes.

export function generateRuneDecode(rng: Rng, difficulty: number): RuneDecodeState {
  const length = difficulty >= 3 ? 5 : 4
  const symbols = Math.min(8, 5 + difficulty)
  const secret = Array.from({ length }, () => rng.int(symbols))
  return {
    symbols,
    length,
    secret,
    draft: Array.from({ length }, () => 0),
    guesses: [],
    maxAttempts: length + 5,
  }
}

/** Mastermind scoring: exact position matches, then colour-only matches. */
export function scoreGuess(secret: readonly number[], guess: readonly number[]) {
  let exact = 0
  const secretLeft: number[] = []
  const guessLeft: number[] = []
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) exact += 1
    else {
      secretLeft.push(secret[i]!)
      guessLeft.push(guess[i]!)
    }
  }
  let partial = 0
  for (const g of guessLeft) {
    const at = secretLeft.indexOf(g)
    if (at >= 0) {
      partial += 1
      secretLeft.splice(at, 1)
    }
  }
  return { exact, partial }
}

export function runeDecodeMove(s: RuneDecodeState, move: PuzzleMove): RuneDecodeState {
  if (move.k === 'runeSetSlot') {
    if (move.slot < 0 || move.slot >= s.length) return s
    const draft = [...s.draft]
    draft[move.slot] = ((move.symbol % s.symbols) + s.symbols) % s.symbols
    return { ...s, draft }
  }
  if (move.k === 'runeSubmit') {
    if (s.guesses.length >= s.maxAttempts) return s
    const { exact, partial } = scoreGuess(s.secret, s.draft)
    return { ...s, guesses: [...s.guesses, { guess: [...s.draft], exact, partial }] }
  }
  return s
}

export function runeDecodeStatus(s: RuneDecodeState) {
  const last = s.guesses[s.guesses.length - 1]
  if (last && last.exact === s.length) return 'solved' as const
  if (s.guesses.length >= s.maxAttempts) return 'failed' as const
  return 'open' as const
}

// ============================================================ balance scales
//
// Relics with hidden weights. You get a limited number of weighings, then you
// have to name the order. Pure comparison logic — no arithmetic needed, which
// is why it works in any language.

export function generateBalanceScales(rng: Rng, difficulty: number): BalanceScalesState {
  const count = difficulty >= 3 ? 6 : difficulty >= 2 ? 5 : 4
  // Distinct weights so the order is unambiguous. The values are never shown.
  const weights = rng.shuffle(Array.from({ length: count }, (_, i) => (i + 1) * 3 + rng.int(2)))
  return {
    count,
    weights,
    left: [],
    right: [],
    weighings: [],
    // Enough for a careful sort, not enough to weigh everything against
    // everything: ceil(n log2 n) rounded up a little.
    maxWeighings: Math.ceil(count * Math.log2(count)) + 1,
    order: [],
    submitted: false,
    correct: false,
  }
}

function panTotal(s: BalanceScalesState, pan: readonly number[]): number {
  return pan.reduce((sum, i) => sum + (s.weights[i] ?? 0), 0)
}

export function balanceScalesMove(
  s: BalanceScalesState,
  move: PuzzleMove,
): BalanceScalesState {
  if (s.submitted) return s

  switch (move.k) {
    case 'scaleTogglePan': {
      const other = move.pan === 'left' ? 'right' : 'left'
      const mine = [...s[move.pan]]
      const theirs = s[other].filter((r) => r !== move.relic)
      const at = mine.indexOf(move.relic)
      if (at >= 0) mine.splice(at, 1)
      else mine.push(move.relic)
      return { ...s, [move.pan]: mine, [other]: theirs } as BalanceScalesState
    }

    case 'scaleClearPans':
      return { ...s, left: [], right: [] }

    case 'scaleWeigh': {
      if (s.weighings.length >= s.maxWeighings) return s
      if (s.left.length === 0 || s.right.length === 0) return s
      const l = panTotal(s, s.left)
      const r = panTotal(s, s.right)
      const result: -1 | 0 | 1 = l < r ? -1 : l > r ? 1 : 0
      return {
        ...s,
        weighings: [...s.weighings, { left: [...s.left], right: [...s.right], result }],
        left: [],
        right: [],
      }
    }

    case 'scaleOrderPush': {
      if (s.order.includes(move.relic)) return s
      return { ...s, order: [...s.order, move.relic] }
    }

    case 'scaleOrderClear':
      return { ...s, order: [] }

    case 'scaleSubmit': {
      if (s.order.length !== s.count) return s
      const correct = s.order.every((relic, i) => {
        if (i === 0) return true
        return (s.weights[s.order[i - 1]!] ?? 0) < (s.weights[relic] ?? 0)
      })
      return { ...s, submitted: true, correct }
    }

    default:
      return s
  }
}

export function balanceScalesStatus(s: BalanceScalesState) {
  if (!s.submitted) return 'open' as const
  return s.correct ? ('solved' as const) : ('failed' as const)
}

// ==================================================================== glyphs
//
// Deduce the composition rules of an alien sign system: which stroke means
// which concept. Worked examples are given as ICONS, and the answer is icon
// selection — so there is not a single word anywhere in the puzzle. The
// generator checks that the examples pin the mapping down completely.

const GLYPH_MAX_EXAMPLES = 6

function maskConcepts(mask: number, mapping: readonly number[]): number[] {
  const out: number[] = []
  for (let f = 0; f < mapping.length; f++) {
    if (mask & (1 << f)) out.push(mapping[f]!)
  }
  return out.sort((a, b) => a - b)
}

function sameSet(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((v, i) => v === sb[i])
}

function permutations(n: number): number[][] {
  const out: number[][] = []
  const build = (left: number[], acc: number[]) => {
    if (left.length === 0) {
      out.push([...acc])
      return
    }
    for (let i = 0; i < left.length; i++) {
      const next = [...left]
      const [v] = next.splice(i, 1)
      build(next, [...acc, v!])
    }
  }
  build(
    Array.from({ length: n }, (_, i) => i),
    [],
  )
  return out
}

/** How many feature→concept mappings are consistent with these examples? */
function consistentMappings(
  features: number,
  examples: readonly { mask: number; concepts: number[] }[],
): number {
  let count = 0
  for (const candidate of permutations(features)) {
    let ok = true
    for (const example of examples) {
      if (!sameSet(maskConcepts(example.mask, candidate), example.concepts)) {
        ok = false
        break
      }
    }
    if (ok) count += 1
  }
  return count
}

export function generateGlyphs(rng: Rng, difficulty: number): GlyphsState {
  const features = difficulty >= 3 ? 5 : 4
  const mapping = rng.shuffle(Array.from({ length: features }, (_, i) => i))

  // Build up examples until the mapping is the only one that fits. Starting
  // from pairs rather than single strokes is what makes it a deduction rather
  // than a lookup.
  const pool: number[] = []
  for (let mask = 1; mask < 1 << features; mask++) {
    const bits = mask.toString(2).split('1').length - 1
    if (bits >= 2 && bits <= Math.max(2, features - 2)) pool.push(mask)
  }

  let examples: { mask: number; concepts: number[] }[] = []
  for (const mask of rng.shuffle(pool)) {
    if (examples.length >= GLYPH_MAX_EXAMPLES) break
    examples.push({ mask, concepts: maskConcepts(mask, mapping) })
    if (consistentMappings(features, examples) === 1) break
  }

  // Fall back to single-stroke examples if pairs alone were not enough. A
  // solvable puzzle beats an elegant one.
  if (consistentMappings(features, examples) !== 1) {
    for (let f = 0; f < features; f++) {
      const mask = 1 << f
      if (!examples.some((e) => e.mask === mask)) {
        examples.push({ mask, concepts: maskConcepts(mask, mapping) })
      }
      if (consistentMappings(features, examples) === 1) break
    }
  }

  // The query must use at least two strokes, and must not be an example.
  const queries = pool.filter((m) => !examples.some((e) => e.mask === m))
  const query = rng.pick(queries.length > 0 ? queries : pool) ?? (1 | 2)

  examples = examples.slice(0, GLYPH_MAX_EXAMPLES)

  return {
    features,
    concepts: features,
    mapping,
    examples,
    query,
    answer: [],
    submitted: false,
    correct: false,
  }
}

export function glyphsMove(s: GlyphsState, move: PuzzleMove): GlyphsState {
  if (s.submitted) return s
  if (move.k === 'glyphToggle') {
    const at = s.answer.indexOf(move.concept)
    const answer = at >= 0 ? s.answer.filter((c) => c !== move.concept) : [...s.answer, move.concept]
    return { ...s, answer }
  }
  if (move.k === 'glyphSubmit') {
    const expected = maskConcepts(s.query, s.mapping)
    return { ...s, submitted: true, correct: sameSet(s.answer, expected) }
  }
  return s
}

export function glyphsStatus(s: GlyphsState) {
  if (!s.submitted) return 'open' as const
  return s.correct ? ('solved' as const) : ('failed' as const)
}

// =============================================================== safe ground
//
// Which floor tiles are about to give way. Every stable tile shows how many of
// its eight neighbours are unstable; the generator verifies that exactly one
// arrangement fits, so it never comes down to a coin flip.

function neighbourIndexes(w: number, h: number, index: number): number[] {
  const { x, y } = xy(w, index)
  const out: number[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      out.push(idx(w, nx, ny))
    }
  }
  return out
}

function cluesFor(w: number, h: number, unstable: readonly boolean[]): number[] {
  return unstable.map((bad, index) =>
    bad ? -1 : neighbourIndexes(w, h, index).filter((n) => unstable[n]).length,
  )
}

/** Is this the only arrangement of `k` unstable tiles matching the clues? */
function uniqueArrangement(w: number, h: number, clues: readonly number[], k: number): boolean {
  const cells = w * h
  const chosen: number[] = []
  let solutions = 0

  const consistent = (set: Set<number>): boolean => {
    for (let i = 0; i < cells; i++) {
      const clue = clues[i]!
      if (clue < 0) {
        if (!set.has(i)) return false
        continue
      }
      if (set.has(i)) return false
      if (neighbourIndexes(w, h, i).filter((n) => set.has(n)).length !== clue) return false
    }
    return true
  }

  const walk = (start: number): void => {
    if (solutions > 1) return
    if (chosen.length === k) {
      if (consistent(new Set(chosen))) solutions += 1
      return
    }
    for (let i = start; i < cells; i++) {
      // Prune: a tile with a revealed clue can never be unstable.
      if (clues[i]! >= 0) continue
      chosen.push(i)
      walk(i + 1)
      chosen.pop()
      if (solutions > 1) return
    }
  }

  walk(0)
  return solutions === 1
}

export function generateSafeGround(rng: Rng, difficulty: number): SafeGroundState {
  const w = 5
  const h = 5
  const k = Math.min(7, 4 + difficulty)

  // The clue set marks the unstable tiles with -1, so the arrangement is
  // pinned down by construction; the uniqueness check guards against a
  // generator change quietly breaking that.
  for (let attempt = 0; attempt < 40; attempt++) {
    const cellIndexes = rng.shuffle(Array.from({ length: w * h }, (_, i) => i))
    const picked = cellIndexes.slice(0, k)
    const unstable = Array.from({ length: w * h }, (_, i) => picked.includes(i))
    const clues = cluesFor(w, h, unstable)
    if (!uniqueArrangement(w, h, clues, k)) continue
    return {
      w,
      h,
      unstable,
      marked: Array.from({ length: w * h }, () => false),
      clues,
      submitted: false,
      correct: false,
    }
  }

  // Practically unreachable, but never hand back a broken puzzle.
  const unstable = Array.from({ length: w * h }, (_, i) => i < k)
  return {
    w,
    h,
    unstable,
    marked: Array.from({ length: w * h }, () => false),
    clues: cluesFor(w, h, unstable),
    submitted: false,
    correct: false,
  }
}

export function safeGroundMove(s: SafeGroundState, move: PuzzleMove): SafeGroundState {
  if (s.submitted) return s
  if (move.k === 'groundToggle') {
    if (move.index < 0 || move.index >= s.marked.length) return s
    // A tile that shows a clue is known-stable; marking it is meaningless.
    if (s.clues[move.index]! >= 0) return s
    const marked = [...s.marked]
    marked[move.index] = !marked[move.index]
    return { ...s, marked }
  }
  if (move.k === 'groundSubmit') {
    const correct = s.marked.every((m, i) => m === s.unstable[i])
    return { ...s, submitted: true, correct }
  }
  return s
}

export function safeGroundStatus(s: SafeGroundState) {
  if (!s.submitted) return 'open' as const
  return s.correct ? ('solved' as const) : ('failed' as const)
}

/** Shared by the grid puzzles so their neighbour logic cannot drift apart. */
export const orthogonal = DIRS
