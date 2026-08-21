// Puzzle types.
//
// Nine kinds, all generated and all verifiable by machine. Two rules hold for
// every one of them:
//
//  1. LANGUAGE INDEPENDENCE. Every puzzle is solvable from symbols, geometry,
//     numbers and spatial relations. No wordplay, no anagrams, no letter
//     counting — nothing where knowing a Hungarian or English word helps. The
//     answer is always a click or a placement, never typing.
//  2. NO GUESSING. Where a puzzle could in principle be ambiguous (the
//     deduction ones), the generator brute-forces uniqueness and regenerates
//     until the solution is the only one consistent with the clues.
//
// Everything here must stay JSON-serialisable: puzzle state goes into the save
// file, so no functions and no class instances.

export type PuzzleKind =
  // deduction
  | 'runeDecode'
  | 'balanceScales'
  | 'glyphs'
  | 'safeGround'
  // routing and space
  | 'powerRouting'
  | 'refraction'
  | 'starChart'
  // state space
  | 'resonance'
  | 'gravityCores'

export const PUZZLE_KINDS: PuzzleKind[] = [
  'runeDecode',
  'balanceScales',
  'glyphs',
  'safeGround',
  'powerRouting',
  'refraction',
  'starChart',
  'resonance',
  'gravityCores',
]

/**
 * What solving this puzzle is worth. Each kind has its own reward domain on
 * purpose, so no two puzzles are interchangeable — see the design document.
 */
export type PuzzleRewardKind =
  | 'relics'
  | 'information'
  | 'power'
  | 'module'
  | 'starmapNode'
  | 'understanding'
  | 'fuel'

export const PUZZLE_REWARD: Record<PuzzleKind, PuzzleRewardKind> = {
  runeDecode: 'relics',
  balanceScales: 'information',
  glyphs: 'understanding',
  safeGround: 'relics',
  powerRouting: 'power',
  refraction: 'module',
  starChart: 'starmapNode',
  resonance: 'module',
  gravityCores: 'power',
}

// ---------------------------------------------------------------- deduction

export type RuneDecodeState = {
  /** How many distinct rune symbols are in play. */
  symbols: number
  length: number
  secret: number[]
  /** The guess the players are assembling. */
  draft: number[]
  guesses: { guess: number[]; exact: number; partial: number }[]
  maxAttempts: number
}

export type BalanceScalesState = {
  count: number
  /** Hidden, distinct weights. */
  weights: number[]
  left: number[]
  right: number[]
  weighings: { left: number[]; right: number[]; result: -1 | 0 | 1 }[]
  maxWeighings: number
  /** The ascending order the players are assembling. */
  order: number[]
  submitted: boolean
  correct: boolean
}

export type GlyphsState = {
  /** How many stroke features a glyph can carry. */
  features: number
  /** How many concept icons exist. Always equal to `features`. */
  concepts: number
  /** feature index -> concept index. Hidden; a permutation. */
  mapping: number[]
  /** Worked examples: a bitmask of features and the concepts it translates to. */
  examples: { mask: number; concepts: number[] }[]
  /** The glyph to translate. */
  query: number
  answer: number[]
  submitted: boolean
  correct: boolean
}

export type SafeGroundState = {
  w: number
  h: number
  /** Hidden truth: which tiles give way. */
  unstable: boolean[]
  /** Player's marks. */
  marked: boolean[]
  /** Clue per tile: unstable neighbours, or -1 where the tile is itself unstable. */
  clues: number[]
  submitted: boolean
  correct: boolean
}

// ---------------------------------------------------------- routing / space

export type PowerRoutingState = {
  w: number
  h: number
  /** Connection mask per tile in its CURRENT rotation: bit 0=N, 1=E, 2=S, 3=W. */
  masks: number[]
  /** Tiles with no conduit at all. */
  empty: boolean[]
  source: number
  targets: number[]
  rotations: number
  /**
   * The rotations the generator derived from its spanning tree. Kept so tests
   * can prove the board is solvable and so a hint can nudge one tile. Nothing
   * is hidden in this puzzle anyway — the conduits are all in plain sight.
   */
  solvedMasks: number[]
}

export type RefractionState = {
  w: number
  h: number
  emitter: number
  /** Direction the beam leaves the emitter: 0=N, 1=E, 2=S, 3=W. */
  emitterDir: number
  /** Mirror per tile: 0 = none, 1 = '/', 2 = '\\'. */
  mirrors: number[]
  blockers: number[]
  targets: number[]
  rotations: number
}

export type StarChartState = {
  size: number
  /** Edge codes at rotation 0, clockwise from north. */
  fragments: number[][]
  /** cell index -> fragment index, or null. */
  placement: (number | null)[]
  /** fragment index -> current rotation, 0..3. */
  rotation: number[]
}

// ---------------------------------------------------------------- state space

export type ResonanceState = {
  w: number
  h: number
  /** Dial values, 0..modulus-1. */
  values: number[]
  modulus: number
  taps: number
}

export type GravityCoresState = {
  w: number
  h: number
  walls: boolean[]
  cores: number[]
  goals: number[]
  hero: number
  moves: number
  /** Serialised earlier states, for undo. */
  history: string[]
}

// ---------------------------------------------------------------- union

export type Puzzle =
  | { k: 'runeDecode'; s: RuneDecodeState }
  | { k: 'balanceScales'; s: BalanceScalesState }
  | { k: 'glyphs'; s: GlyphsState }
  | { k: 'safeGround'; s: SafeGroundState }
  | { k: 'powerRouting'; s: PowerRoutingState }
  | { k: 'refraction'; s: RefractionState }
  | { k: 'starChart'; s: StarChartState }
  | { k: 'resonance'; s: ResonanceState }
  | { k: 'gravityCores'; s: GravityCoresState }

/**
 * Every move any puzzle accepts, in one flat union. Each module ignores the
 * moves that are not its own, which keeps the dispatch trivial.
 */
export type PuzzleMove =
  | { k: 'runeSetSlot'; slot: number; symbol: number }
  | { k: 'runeSubmit' }
  | { k: 'scaleTogglePan'; relic: number; pan: 'left' | 'right' }
  | { k: 'scaleWeigh' }
  | { k: 'scaleClearPans' }
  | { k: 'scaleOrderPush'; relic: number }
  | { k: 'scaleOrderClear' }
  | { k: 'scaleSubmit' }
  | { k: 'glyphToggle'; concept: number }
  | { k: 'glyphSubmit' }
  | { k: 'groundToggle'; index: number }
  | { k: 'groundSubmit' }
  | { k: 'routeRotate'; index: number }
  | { k: 'refractRotate'; index: number }
  | { k: 'chartPlace'; fragment: number; cell: number }
  | { k: 'chartLift'; cell: number }
  | { k: 'chartRotate'; fragment: number }
  | { k: 'resonanceTap'; index: number }
  | { k: 'coreStep'; dir: number }
  | { k: 'coreUndo' }

export type PuzzleStatus = 'open' | 'solved' | 'failed'

/** Directions used by the grid puzzles: 0=N, 1=E, 2=S, 3=W. */
export const DIRS: { dx: number; dy: number }[] = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
]

export function idx(w: number, x: number, y: number): number {
  return y * w + x
}

export function xy(w: number, index: number): { x: number; y: number } {
  return { x: index % w, y: Math.floor(index / w) }
}
