// Seeded random number generator.
//
// Why not Math.random? Because then a battle that looks buggy or unfair cannot
// be reproduced. This way every battle has a seed, and the same seed always
// produces the same battle — invaluable for balancing and bug hunting.

export type Rng = {
  /** [0,1) */
  next: () => number
  /** [0, max) integer */
  int: (max: number) => number
  /** [min, max] integer, both inclusive */
  between: (min: number, max: number) => number
  /** A new shuffled array. The original is left alone. */
  shuffle: <T>(items: readonly T[]) => T[]
  /** Pick one element. undefined for an empty array. */
  pick: <T>(items: readonly T[]) => T | undefined
}

/** mulberry32 — small, fast, and more than good enough for a game. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (max: number) => Math.floor(next() * max)

  return {
    next,
    int,
    between: (min, max) => min + int(max - min + 1),
    shuffle: <T,>(items: readonly T[]): T[] => {
      const out = [...items]
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1)
        const tmp = out[i]!
        out[i] = out[j]!
        out[j] = tmp
      }
      return out
    },
    pick: <T,>(items: readonly T[]): T | undefined =>
      items.length === 0 ? undefined : items[int(items.length)],
  }
}

/** A random seed, for when the player does not supply one. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}
