// The crew, on the ground.
//
// A mentee used to be a number on a station: the mentoring perk paid in loyalty
// and experience and nothing else, and the person you had spent four weeks
// teaching was never once in the same room as you when it mattered.
//
// A follower is that person, on the board. They are deliberately NOT a second
// hero:
//
//   - No hand, no cards, no Flux. They do one thing, and it is the thing they
//     were told to do.
//   - They act on the turn AFTER their mentor, always. What they do is what they
//     saw you do, one beat late, which is what being taught looks like.
//   - Only a trained hand can go down at all. That is what rank is for, and it
//     turns the crew screen into a decision with a consequence at the far end.
//
// The price is the point. A follower that dies is dead: a name comes off the
// ship's list, not a counter. Nothing else in the game can take a person away
// from you as a direct result of a choice you made three minutes earlier.

import { bestTileTowards, distance, hasLineOfSight, sameTile } from './grid'
import { dealDamage, grantShield } from './combat'
import { hasStatus, isHero, livingEnemies, log } from './state'
import type { BattleState, Follower, FollowerOrder, Text, Unit } from './types'
import type { CrewMember } from '../content/crew'
import { crewRank } from '../content/crew'

/** The lowest rank that may be taken down. */
export const FOLLOWER_MIN_RANK = 2

/** Can this crew member be taken on a landing at all? */
export function canFollow(member: CrewMember): boolean {
  return member.alive && member.mentor !== null && crewRank(member) >= FOLLOWER_MIN_RANK
}

/**
 * What a crew member is worth on the ground.
 *
 * Small numbers on purpose. A follower has to be able to change a round without
 * being able to win one — the moment two mentees out-fight the party, the cards
 * stop being the game.
 */
export function followerStats(member: CrewMember): { hp: number; attack: number; speed: number } {
  const rank = crewRank(member)
  return {
    // Below the frailest of the four at every rank. A master hand is worth
    // taking and is still not a fifth hero: seven hit points against the
    // Pastcaller's eight.
    hp: 1 + rank * 2,
    attack: rank >= 3 ? 2 : 1,
    speed: member.traits.includes('young') ? 4 : 3,
  }
}

/** Their turn: one order, carried out. */
export function followerTurn(s: BattleState, f: Follower): void {
  if (!f.alive) return

  if (hasStatus(f, 'prone')) {
    log(s, { k: 'followerHeld', unit: f.name })
    return
  }

  switch (f.order) {
    case 'guard':
      guard(s, f)
      break
    case 'strike':
      strike(s, f)
      break
    case 'hold':
      hold(s, f)
      break
  }
}

/**
 * Get to their mentor and stand in front of them.
 *
 * The Shield only lands when they are actually beside them, which is the whole
 * order: a follower on guard duty is spending their turn on the walk.
 */
function guard(s: BattleState, f: Follower): void {
  const mentor = s.units.find((u) => isHero(u) && u.heroClass === f.mentor && u.alive)
  if (!mentor) {
    // Nobody to guard. They do not stand there uselessly.
    strike(s, f)
    return
  }

  moveTowards(s, f, mentor, 1)
  if (distance(f.pos, mentor.pos) <= 1) {
    grantShield(s, mentor, 1)
    log(s, { k: 'followerGuards', unit: f.name, target: mentor.name })
  } else {
    log(s, { k: 'followerMoves', unit: f.name })
  }
}

/** Go at the nearest enemy and hit it. */
function strike(s: BattleState, f: Follower): void {
  const target = nearestEnemy(s, f)
  if (!target) {
    log(s, { k: 'followerWaits', unit: f.name })
    return
  }

  moveTowards(s, f, target, 1)
  if (distance(f.pos, target.pos) <= 1) {
    dealDamage(s, f, target, f.attack, { melee: true })
  } else {
    log(s, { k: 'followerMoves', unit: f.name })
  }
}

/** Stand still. Anything that comes within reach gets hit. */
function hold(s: BattleState, f: Follower): void {
  const adjacent = livingEnemies(s)
    .filter((e) => distance(f.pos, e.pos) <= 1)
    .sort((a, b) => a.hp - b.hp)[0]
  if (adjacent) {
    dealDamage(s, f, adjacent, f.attack, { melee: true })
    return
  }
  log(s, { k: 'followerHolds', unit: f.name })
}

function nearestEnemy(s: BattleState, f: Follower): Unit | undefined {
  return livingEnemies(s)
    .slice()
    .sort((a, b) => {
      const da = distance(f.pos, a.pos)
      const db = distance(f.pos, b.pos)
      if (da !== db) return da - db
      // A tie goes to the one closest to falling: a follower's one point of
      // damage is worth most where it finishes something.
      return a.hp - b.hp
    })[0]
}

function moveTowards(s: BattleState, f: Follower, target: Unit, desiredRange: number): void {
  if (hasStatus(f, 'anchor')) {
    log(s, { k: 'anchoredInPlace', unit: f.name })
    return
  }
  const to = bestTileTowards(s.map, s.units, f.pos, f.speed, target.pos, desiredRange)
  if (!sameTile(to, f.pos)) f.pos = to
}

/** For the interface: can this follower reach anything worth doing right now? */
export function followerHasLine(s: BattleState, f: Follower): boolean {
  const target = nearestEnemy(s, f)
  return target !== undefined && hasLineOfSight(s.map, f.pos, target.pos)
}

export const FOLLOWER_ORDERS: FollowerOrder[] = ['guard', 'strike', 'hold']

/** What each order is called, for the log and the buttons. */
export const FOLLOWER_ORDER_NAMES: Record<FollowerOrder, Text> = {
  guard: { hu: 'Fedezzen', en: 'Guard' },
  strike: { hu: 'Támadjon', en: 'Strike' },
  hold: { hu: 'Maradjon a helyén', en: 'Hold' },
}

/** One line each, so a player picking an order knows what they are buying. */
export const FOLLOWER_ORDER_HINTS: Record<FollowerOrder, Text> = {
  guard: {
    hu: 'Odamegy hozzád, és amíg melletted áll, minden körben Vért 1-et ad neked.',
    en: 'Goes to you, and while they stand beside you they give you Shield 1 each round.',
  },
  strike: {
    hu: 'A legközelebbi ellenségre megy, és megüti. Ő is kaphat érte.',
    en: 'Goes at the nearest enemy and hits it. They can be hit for it too.',
  },
  hold: {
    hu: 'Nem mozdul. Amit elér, azt megüti — így marad a legnagyobb eséllyel életben.',
    en: 'Does not move. Hits whatever comes into reach — the likeliest way to keep them alive.',
  },
}
