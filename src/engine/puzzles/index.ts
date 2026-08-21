// The puzzle registry: one entry point for generating, moving and judging.
//
// The rest of the game never touches a specific puzzle module — it asks for a
// kind and gets back an opaque `Puzzle`. That is what lets the expedition layer
// treat all nine the same way.

import { createRng } from '../rng'
import {
  balanceScalesMove,
  balanceScalesStatus,
  generateBalanceScales,
  generateGlyphs,
  generateRuneDecode,
  generateSafeGround,
  glyphsMove,
  glyphsStatus,
  runeDecodeMove,
  runeDecodeStatus,
  safeGroundMove,
  safeGroundStatus,
} from './logic'
import {
  generatePowerRouting,
  generateRefraction,
  generateStarChart,
  powerRoutingMove,
  powerRoutingStatus,
  refractionMove,
  refractionStatus,
  starChartMove,
  starChartStatus,
} from './routing'
import {
  generateGravityCores,
  generateResonance,
  gravityCoresMove,
  gravityCoresStatus,
  resonanceMove,
  resonanceStatus,
} from './machines'
import { PUZZLE_KINDS } from './types'
import type { Puzzle, PuzzleKind, PuzzleMove, PuzzleStatus } from './types'

export * from './types'
export { edgeAt, poweredTiles, rotateMask, traceBeam, reflect } from './routing'
export { scoreGuess } from './logic'

/**
 * @param extraTries How many attempts the difficulty dial adds or removes. Only
 * two puzzle kinds have an attempt limit at all — the rest are settled by
 * deduction, not by guessing — so this quietly does nothing for the others.
 */
export function generatePuzzle(
  kind: PuzzleKind,
  seed: number,
  difficulty: number,
  extraTries = 0,
): Puzzle {
  const rng = createRng(seed)
  switch (kind) {
    case 'runeDecode':
      return { k: kind, s: generateRuneDecode(rng, difficulty, extraTries) }
    case 'balanceScales':
      return { k: kind, s: generateBalanceScales(rng, difficulty, extraTries) }
    case 'glyphs':
      return { k: kind, s: generateGlyphs(rng, difficulty) }
    case 'safeGround':
      return { k: kind, s: generateSafeGround(rng, difficulty) }
    case 'powerRouting':
      return { k: kind, s: generatePowerRouting(rng, difficulty) }
    case 'refraction':
      return { k: kind, s: generateRefraction(rng, difficulty) }
    case 'starChart':
      return { k: kind, s: generateStarChart(rng, difficulty) }
    case 'resonance':
      return { k: kind, s: generateResonance(rng, difficulty) }
    case 'gravityCores':
      return { k: kind, s: generateGravityCores(rng, difficulty) }
  }
}

export function applyPuzzleMove(p: Puzzle, move: PuzzleMove): Puzzle {
  if (puzzleStatus(p) !== 'open') return p
  switch (p.k) {
    case 'runeDecode':
      return { k: p.k, s: runeDecodeMove(p.s, move) }
    case 'balanceScales':
      return { k: p.k, s: balanceScalesMove(p.s, move) }
    case 'glyphs':
      return { k: p.k, s: glyphsMove(p.s, move) }
    case 'safeGround':
      return { k: p.k, s: safeGroundMove(p.s, move) }
    case 'powerRouting':
      return { k: p.k, s: powerRoutingMove(p.s, move) }
    case 'refraction':
      return { k: p.k, s: refractionMove(p.s, move) }
    case 'starChart':
      return { k: p.k, s: starChartMove(p.s, move) }
    case 'resonance':
      return { k: p.k, s: resonanceMove(p.s, move) }
    case 'gravityCores':
      return { k: p.k, s: gravityCoresMove(p.s, move) }
  }
}

export function puzzleStatus(p: Puzzle): PuzzleStatus {
  switch (p.k) {
    case 'runeDecode':
      return runeDecodeStatus(p.s)
    case 'balanceScales':
      return balanceScalesStatus(p.s)
    case 'glyphs':
      return glyphsStatus(p.s)
    case 'safeGround':
      return safeGroundStatus(p.s)
    case 'powerRouting':
      return powerRoutingStatus(p.s)
    case 'refraction':
      return refractionStatus(p.s)
    case 'starChart':
      return starChartStatus(p.s)
    case 'resonance':
      return resonanceStatus(p.s)
    case 'gravityCores':
      return gravityCoresStatus(p.s)
  }
}

/**
 * Which puzzle kinds the Archive has opened up.
 *
 * The first expedition only meets the three most immediately readable ones —
 * throwing all nine at a new player at once would be a wall. The rest arrive
 * through the Archive.
 */
export const STARTING_PUZZLE_KINDS: PuzzleKind[] = ['runeDecode', 'powerRouting', 'resonance']

export function pickPuzzleKind(seed: number, unlocked: readonly PuzzleKind[]): PuzzleKind {
  const pool = unlocked.length > 0 ? unlocked : STARTING_PUZZLE_KINDS
  return createRng(seed).pick(pool) ?? PUZZLE_KINDS[0]!
}
