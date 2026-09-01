// The rune line: a puzzle that only exists because everybody has their own screen.
//
// Every other puzzle in this game is solvable by one person looking at one
// screen, which was the right shape while the whole table shared a monitor. Once
// three or four people are each on their own machine, the interesting design
// space is the opposite one: **nobody can see enough to solve it alone.**
//
// So: a line of runes has to be pressed in a hidden order. The order is pinned
// down by clues, and the clues are DEALT OUT — you can see yours and nobody
// else's. Each rune belongs to one seat, and only that seat can press it. The
// answer is therefore not on anybody's screen; it is in the conversation.
//
// Two properties this file guarantees, and both are tested:
//
//  - **Exactly one order satisfies the clues.** No guessing, ever — the same
//    promise the other nine puzzles make. With six runes there are only 720
//    orders, so this is checked by brute force at generation time rather than
//    argued about.
//  - **Every seat matters.** The clues are dealt round-robin and each seat owns
//    runes, so no player can be left with nothing to say or nothing to press.

import type { Rng } from '../rng'
import type { Text } from '../types'

/** One fact about the order, true of the secret and shown to exactly one seat. */
export type Clue =
  /** `a` comes before `b`, not necessarily right before. */
  | { k: 'before'; a: number; b: number }
  /** `rune` is pressed `at`-th (counting from one). */
  | { k: 'position'; rune: number; at: number }
  /** `rune` is definitely not `at`-th. */
  | { k: 'notAt'; rune: number; at: number }
  /** `a` and `b` are pressed one immediately after the other, either way round. */
  | { k: 'adjacent'; a: number; b: number }
  /** Whoever the `at`-th rune belongs to is this seat. */
  | { k: 'ownerAt'; seat: number; at: number }

export type RuneLineTask = {
  /** How many runes are in the line. Rune ids are 0..count-1. */
  count: number
  /** The secret: rune ids in the order they must be pressed. */
  order: number[]
  /** Which seat each rune belongs to, indexed by rune id. Seats count from one. */
  owner: number[]
  /** How many seats the task was dealt for. */
  seats: number
  /** Clues, each with the seat that can see it. */
  clues: { seat: number; clue: Clue }[]
  /** Runes pressed correctly so far, in order. */
  done: number[]
  strikes: number
  maxStrikes: number
}

export type TaskStatus = 'open' | 'solved' | 'failed'

export function taskStatus(task: RuneLineTask): TaskStatus {
  if (task.done.length >= task.count) return 'solved'
  if (task.strikes >= task.maxStrikes) return 'failed'
  return 'open'
}

/** Which rune the line is waiting for. Only the engine knows; never shown. */
export function expected(task: RuneLineTask): number | null {
  return task.order[task.done.length] ?? null
}

/**
 * Press a rune.
 *
 * Out of order is a strike rather than a reset: restarting the line every time
 * would punish the group for the one thing the design is asking them to do,
 * which is guess out loud and be corrected.
 */
export function press(task: RuneLineTask, rune: number): RuneLineTask {
  if (taskStatus(task) !== 'open') return task
  if (rune < 0 || rune >= task.count) return task
  if (task.done.includes(rune)) return task
  if (expected(task) === rune) return { ...task, done: [...task.done, rune] }
  return { ...task, strikes: task.strikes + 1 }
}

// ---------------------------------------------------------------- the clues

function satisfies(order: number[], clue: Clue, owner: number[]): boolean {
  const at = (rune: number) => order.indexOf(rune)
  switch (clue.k) {
    case 'before':
      return at(clue.a) < at(clue.b)
    case 'position':
      return at(clue.rune) === clue.at - 1
    case 'notAt':
      return at(clue.rune) !== clue.at - 1
    case 'adjacent':
      return Math.abs(at(clue.a) - at(clue.b)) === 1
    case 'ownerAt':
      return owner[order[clue.at - 1]!] === clue.seat
  }
}

/** Every order that fits all of these. Brute force: six runes is 720 orders. */
export function solutions(
  count: number,
  owner: number[],
  clues: readonly Clue[],
  stopAt = 2,
): number[][] {
  const found: number[][] = []
  const ids = Array.from({ length: count }, (_, i) => i)

  const walk = (chosen: number[], left: number[]) => {
    if (found.length >= stopAt) return
    if (left.length === 0) {
      if (clues.every((clue) => satisfies(chosen, clue, owner))) found.push([...chosen])
      return
    }
    for (let i = 0; i < left.length; i++) {
      const next = left[i]!
      walk([...chosen, next], [...left.slice(0, i), ...left.slice(i + 1)])
      if (found.length >= stopAt) return
    }
  }

  walk([], ids)
  return found
}

/** Everything true about this order that could be said in one sentence. */
function candidateClues(order: number[], owner: number[], seats: number): Clue[] {
  const out: Clue[] = []
  const count = order.length
  const at = (rune: number) => order.indexOf(rune)

  for (let a = 0; a < count; a++) {
    for (let b = 0; b < count; b++) {
      if (a === b) continue
      if (at(a) < at(b)) out.push({ k: 'before', a, b })
      if (a < b && Math.abs(at(a) - at(b)) === 1) out.push({ k: 'adjacent', a, b })
    }
    out.push({ k: 'position', rune: a, at: at(a) + 1 })
    for (let slot = 1; slot <= count; slot++) {
      if (slot - 1 !== at(a)) out.push({ k: 'notAt', rune: a, at: slot })
    }
  }
  for (let slot = 1; slot <= count; slot++) {
    for (let seat = 1; seat <= seats; seat++) {
      if (owner[order[slot - 1]!] === seat) out.push({ k: 'ownerAt', seat, at: slot })
    }
  }
  return out
}

/**
 * Build a task that has exactly one answer.
 *
 * Add true clues until only one order survives, then take away every clue the
 * rest already implied. What is left is tight: nothing redundant to read out,
 * and nothing missing to guess at.
 */
export function generateRuneLine(
  rng: Rng,
  { seats, difficulty }: { seats: number; difficulty: number },
): RuneLineTask {
  const count = Math.max(4, Math.min(6, 3 + difficulty))
  const order = rng.shuffle(Array.from({ length: count }, (_, i) => i))

  // Runes are dealt round-robin from a shuffled list, so every seat owns at
  // least one and nobody is left with nothing to press.
  const owner: number[] = []
  const deal = rng.shuffle(Array.from({ length: count }, (_, i) => i))
  deal.forEach((rune, i) => {
    owner[rune] = (i % seats) + 1
  })

  const pool = rng.shuffle(candidateClues(order, owner, seats))
  const chosen: Clue[] = []
  for (const clue of pool) {
    if (solutions(count, owner, chosen).length <= 1) break
    chosen.push(clue)
  }
  // Anything the others already imply is noise on somebody's screen.
  const kept: Clue[] = []
  for (let i = 0; i < chosen.length; i++) {
    const without = [...kept, ...chosen.slice(i + 1)]
    if (solutions(count, owner, without).length > 1) kept.push(chosen[i]!)
  }

  // Everybody has to hold part of the answer, and a tight clue set can be
  // smaller than the table. A seat with nothing to read is a player waiting to be
  // told which button to press, which is the failure this whole mechanic exists
  // to fix — so redundant clues are put back until every seat has one. They are
  // still true, and a confirmation somebody can offer is worth having.
  const spare = rng.shuffle(chosen.filter((clue) => !kept.includes(clue)))
  const dealt = [...kept]
  while (dealt.length < seats && spare.length > 0) dealt.push(spare.pop()!)

  // Dealt round-robin: everybody holds part of the answer.
  const shuffledClues = rng.shuffle(dealt)
  const clues = shuffledClues.map((clue, i) => ({ seat: (i % seats) + 1, clue }))

  return {
    count,
    order,
    owner,
    seats,
    clues,
    done: [],
    strikes: 0,
    // Three at the easiest, two when it is deep: enough to be corrected, not
    // enough to work through the line by trial.
    maxStrikes: difficulty >= 3 ? 2 : 3,
  }
}

/** What one seat can see: their own clues, in a stable order. */
export function cluesFor(task: RuneLineTask, seat: number): Clue[] {
  return task.clues.filter((entry) => entry.seat === seat).map((entry) => entry.clue)
}

/** Runes this seat may press. */
export function runesOf(task: RuneLineTask, seat: number): number[] {
  return task.owner.map((_, rune) => rune).filter((rune) => task.owner[rune] === seat)
}

// ---------------------------------------------------------------- the words

/** Rune names, so a clue can be read out loud without pointing at a screen. */
export const RUNE_NAMES: Text[] = [
  { hu: 'Kapu', en: 'Gate' },
  { hu: 'Hamu', en: 'Ash' },
  { hu: 'Kórus', en: 'Choir' },
  { hu: 'Vas', en: 'Iron' },
  { hu: 'Csend', en: 'Silence' },
  { hu: 'Mag', en: 'Seed' },
]

export function runeName(rune: number): Text {
  return RUNE_NAMES[rune % RUNE_NAMES.length]!
}
