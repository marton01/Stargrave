// Small helpers for reading and writing battle state.
// A separate file so that the effect resolver and the round logic do not have
// to import each other.

import { distance } from './grid'
import type { BattleState, Enemy, Follower, Hero, LogEvent, StatusKind, Unit } from './types'

export function clone<T>(x: T): T {
  return structuredClone(x)
}

/**
 * The upper bound on Shield.
 *
 * Without it the Rune Sentinels shielded each other without limit, and since
 * Shield reduces EVERY incoming hit, attacks of 2-3 power did literally
 * nothing. The cap keeps armour a worthwhile investment without letting it
 * grow into a wall.
 */
export const SHIELD_MAX = 3

/**
 * Is this unit one of the four?
 *
 * `u.side === 'hero'` answers a different question — "is this on the party's
 * side" — and since the crew started coming down with the party the two answers
 * differ. Every place that reaches for a hand, a card or a hero class wants this
 * one.
 */
export function isHero(u: Unit | null | undefined): u is Hero {
  return u !== null && u !== undefined && u.side === 'hero' && u.kind === 'hero'
}

export function isFollower(u: Unit | null | undefined): u is Follower {
  return u !== null && u !== undefined && u.side === 'hero' && u.kind === 'follower'
}

export function heroes(s: BattleState): Hero[] {
  return s.units.filter((u): u is Hero => u.side === 'hero' && u.kind === 'hero')
}

/** The crew brought down with the party. On the hero side, but not heroes. */
export function followers(s: BattleState): Follower[] {
  return s.units.filter((u): u is Follower => u.side === 'hero' && u.kind === 'follower')
}

export function livingFollowers(s: BattleState): Follower[] {
  return followers(s).filter((f) => f.alive)
}

export function livingHeroes(s: BattleState): Hero[] {
  return heroes(s).filter((h) => h.alive && !h.exhausted)
}

export function enemies(s: BattleState): Enemy[] {
  return s.units.filter((u): u is Enemy => u.side === 'enemy')
}

export function livingEnemies(s: BattleState): Enemy[] {
  return enemies(s).filter((e) => e.alive)
}

export function unitById(s: BattleState, id: string): Unit | undefined {
  return s.units.find((u) => u.id === id)
}

/**
 * The ally a card means by "your partner": the nearest living other hero.
 *
 * With two on the board this is simply the other one, which is what it always
 * was. With three or four it has to pick, and nearest is the only answer that
 * needs no extra click and reads the same way in the fiction — you shield the
 * one standing next to you. Ties break by the unit order, so it stays
 * deterministic.
 */
export function partnerOf(s: BattleState, heroId: string): Hero | undefined {
  const self = heroes(s).find((h) => h.id === heroId)
  const others = heroes(s).filter((h) => h.id !== heroId && h.alive)
  if (!self) return others[0]
  return others
    .slice()
    .sort((a, b) => distance(self.pos, a.pos) - distance(self.pos, b.pos))[0]
}

export function log(s: BattleState, event: LogEvent): void {
  s.log.push({ round: s.round, event })
  // Keep the log from growing without bound.
  if (s.log.length > 200) s.log.splice(0, s.log.length - 200)
}

export function applyStatus(u: Unit, kind: StatusKind, value: number): void {
  const current = u.statuses[kind] ?? 0
  // Shield accumulates, but only up to the cap. For everything else the longer
  // duration wins rather than the two adding together.
  u.statuses[kind] =
    kind === 'shield' ? Math.min(SHIELD_MAX, current + value) : Math.max(current, value)
}

export function hasStatus(u: Unit, kind: StatusKind): boolean {
  return (u.statuses[kind] ?? 0) > 0
}

/** End-of-round status countdown. Shield is not time based, so it is skipped. */
export function tickStatuses(u: Unit): void {
  for (const key of Object.keys(u.statuses) as StatusKind[]) {
    if (key === 'shield') continue
    const value = (u.statuses[key] ?? 0) - 1
    if (value <= 0) delete u.statuses[key]
    else u.statuses[key] = value
  }
}
