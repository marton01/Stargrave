// The effect resolver.
//
// The trick here is that resolution can be interrupted: when an effect needs a
// choice from the player (a target, a tile, a card) we fill in `pending` and
// return. The interface draws the options, the player picks, and we carry on
// from there. That way the rules engine knows nothing about the interface and
// is still fully interactive.

import { applyStatus, hasStatus, livingEnemies, log, partnerOf } from './state'
import { afterMove, dealDamage, grantShield, heal, knockback } from './combat'
import {
  allTiles,
  distance,
  fromTileKey,
  hasLineOfSight,
  neighbours,
  reachableTiles,
  sameTile,
  setTerrain,
  wouldDisconnect,
  terrainAt,
  tileKey,
  walkable,
} from './grid'
import { card } from '../content/cards'
import type { BattleState, Effect, Hero, PendingChoice } from './types'

/** What does this effect ask of the player? null when it asks nothing. */
function requirement(
  s: BattleState,
  h: Hero,
  effect: Effect,
  chosenSoFar: string[],
): PendingChoice | null {
  switch (effect.k) {
    case 'attack': {
      const options = livingEnemies(s)
        .filter((e) => distance(h.pos, e.pos) <= effect.range && hasLineOfSight(s.map, h.pos, e.pos))
        .map((e) => e.id)
        .filter((id) => !chosenSoFar.includes(id))
      // Never ask for more targets than actually exist.
      const needed = Math.min(effect.targets ?? 1, chosenSoFar.length + options.length)
      return {
        kind: 'unit',
        prompt: { k: 'pickAttackTarget', power: effect.power, range: effect.range },
        options,
        needed,
      }
    }

    case 'areaAtPoint': {
      const options = allTiles(s.map)
        .filter(
          (c) =>
            terrainAt(s.map, c) !== 'wall' &&
            distance(h.pos, c) <= effect.range &&
            hasLineOfSight(s.map, h.pos, c),
        )
        .map(tileKey)
      return {
        kind: 'tile',
        prompt: { k: 'pickAreaCentre', power: effect.power, radius: effect.radius },
        options,
        needed: 1,
      }
    }

    case 'move': {
      if (hasStatus(h, 'anchor') || hasStatus(h, 'prone')) return null
      const options = [...reachableTiles(s.map, s.units, h.pos, effect.distance).keys()]
      return {
        kind: 'tile',
        prompt: { k: 'pickMoveDestination', distance: effect.distance },
        options,
        needed: 1,
      }
    }

    case 'status': {
      const options = livingEnemies(s)
        .filter((e) => distance(h.pos, e.pos) <= effect.range && hasLineOfSight(s.map, h.pos, e.pos))
        .map((e) => e.id)
      return {
        kind: 'unit',
        prompt: { k: 'pickStatusTarget', range: effect.range },
        options,
        needed: 1,
      }
    }

    case 'pillar':
    case 'trap': {
      const options = neighbours(s.map, h.pos)
        .filter(
          (c) =>
            walkable(s.map, c) &&
            !s.units.some((u) => u.alive && sameTile(u.pos, c)) &&
            !s.traps.some((t) => sameTile(t.pos, c)) &&
            // A pillar is permanent and blocks movement, so the one thing it
            // must never do is seal a corridor and leave part of the map
            // unreachable — the corridors here are often one tile wide. Blocking
            // a way through is a fine tactic; cutting the map in two is a lost
            // mission for both sides. A trap is walkable, so it cannot.
            (effect.k !== 'pillar' || !wouldDisconnect(s.map, c, 'pillar', h.pos)),
        )
        .map(tileKey)
      return {
        kind: 'tile',
        prompt: effect.k === 'pillar' ? { k: 'pickPillarTile' } : { k: 'pickTrapTile' },
        options,
        needed: 1,
      }
    }

    case 'recoverCard':
      return {
        kind: 'card',
        prompt: { k: 'pickCardToRecover' },
        options: [...h.discard],
        needed: 1,
      }

    case 'echo':
      return {
        kind: 'card',
        prompt: { k: 'pickCardToEcho' },
        options: [...h.discard],
        needed: 1,
      }

    case 'areaAroundSelf':
    case 'shield':
    case 'heal':
    case 'flux':
      return null
  }
}

/** Run the effect with the choices the player made. */
function apply(s: BattleState, h: Hero, effect: Effect, choices: string[]): void {
  switch (effect.k) {
    case 'attack': {
      const melee = effect.range <= 1
      for (const id of choices) {
        const target = s.units.find((u) => u.id === id)
        if (!target || !target.alive) continue
        dealDamage(s, h, target, effect.power, { melee })
        if (target.alive && effect.status) {
          applyStatus(target, effect.status.kind, effect.status.rounds)
          log(s, { k: 'statusApplied', unit: target.name, status: effect.status.kind })
        }
        if (target.alive && effect.knockback) knockback(s, h, target, effect.knockback)
      }
      break
    }

    case 'areaAtPoint': {
      const centre = fromTileKey(choices[0]!)
      const targets = livingEnemies(s).filter((e) => distance(e.pos, centre) <= effect.radius)
      if (targets.length === 0) log(s, { k: 'areaHitNothing' })
      for (const target of targets) {
        dealDamage(s, h, target, effect.power, { area: true })
        if (target.alive && effect.status) {
          applyStatus(target, effect.status.kind, effect.status.rounds)
        }
      }
      break
    }

    case 'areaAroundSelf': {
      const targets = livingEnemies(s).filter((e) => distance(e.pos, h.pos) <= effect.radius)
      if (targets.length === 0) log(s, { k: 'areaHitNothing' })
      for (const target of targets) {
        if (effect.power > 0) dealDamage(s, h, target, effect.power, { area: true })
        if (target.alive && effect.status) {
          applyStatus(target, effect.status.kind, effect.status.rounds)
          log(s, { k: 'statusApplied', unit: target.name, status: effect.status.kind })
        }
      }
      break
    }

    case 'move': {
      // Under Anchor or Prone the requirement was null, so there is no choice —
      // in that case the hero simply does not move.
      const key = choices[0]
      if (!key) {
        log(s, { k: 'cannotMove', unit: h.name })
        break
      }
      const target = fromTileKey(key)
      if (!sameTile(target, h.pos)) {
        h.pos = target
        afterMove(s, h)
      }
      break
    }

    case 'shield': {
      grantShield(s, h, effect.power)
      if (effect.alsoPartner) {
        const partner = partnerOf(s, h.id)
        if (partner) grantShield(s, partner, effect.power)
      }
      break
    }

    case 'heal': {
      heal(s, h, effect.power)
      if (effect.alsoPartner) {
        const partner = partnerOf(s, h.id)
        if (partner) heal(s, partner, effect.power)
      }
      break
    }

    case 'status': {
      const target = s.units.find((u) => u.id === choices[0])
      if (target && target.alive) {
        applyStatus(target, effect.status, effect.rounds)
        log(s, { k: 'statusApplied', unit: target.name, status: effect.status })
      }
      break
    }

    case 'flux': {
      s.flux += effect.power
      log(s, { k: 'fluxGained', amount: effect.power, total: s.flux })
      break
    }

    case 'pillar': {
      setTerrain(s.map, fromTileKey(choices[0]!), 'pillar')
      log(s, { k: 'pillarRaised' })
      break
    }

    case 'trap': {
      s.traps.push({ pos: fromTileKey(choices[0]!), power: effect.power })
      log(s, { k: 'trapPlaced', power: effect.power })
      break
    }

    case 'recoverCard': {
      const cardId = choices[0]!
      const index = h.discard.indexOf(cardId)
      if (index >= 0) {
        h.discard.splice(index, 1)
        h.hand.push(cardId)
        log(s, { k: 'cardRecovered', unit: h.name, card: card(cardId).name })
      }
      break
    }

    case 'echo': {
      const cardId = choices[0]!
      const replayed = card(cardId)
      // Never echo an echo. Replaying a card whose top half is itself an Echo
      // splices another echo in on every pass, and the resolver would never
      // terminate — it hangs the whole tab. The card is meant to repeat a
      // *deed*, not itself.
      if (replayed.top.effects.some((e) => e.k === 'echo')) {
        log(s, { k: 'noValidTarget' })
        break
      }
      log(s, { k: 'echoReplay', card: replayed.name })
      // Splice the replayed effects in directly after the current one.
      if (s.heroTurn?.active) {
        const active = s.heroTurn.active
        active.effects.splice(active.index + 1, 0, ...replayed.top.effects)
      }
      break
    }
  }
}

/**
 * The resolution engine. Runs until the card half is finished or until it needs
 * a choice. Idempotent: with no active half it does nothing.
 */
export function resolveEffects(s: BattleState): void {
  const turn = s.heroTurn
  if (!turn || !turn.active) return
  const hero = s.units.find((u) => u.id === turn.heroId)
  if (!hero || hero.side !== 'hero') return

  s.pending = null

  let guard = 0
  while (turn.active && turn.active.index < turn.active.effects.length) {
    if (guard++ > 60) {
      // Defensive: no legitimate card half needs sixty steps. Stopping here
      // turns a hypothetical runaway into a visibly odd turn instead of a
      // frozen tab.
      turn.active = null
      break
    }
    const effect = turn.active.effects[turn.active.index]!
    const req = requirement(s, hero, effect, turn.choices)

    if (req === null) {
      apply(s, hero, effect, [])
      turn.active.index += 1
      turn.choices = []
      continue
    }

    if (req.options.length === 0 && turn.choices.length === 0) {
      log(s, { k: 'noValidTarget' })
      turn.active.index += 1
      turn.choices = []
      continue
    }

    if (turn.choices.length < req.needed && req.options.length > 0) {
      s.pending = req
      return
    }

    apply(s, hero, effect, turn.choices)
    turn.active.index += 1
    turn.choices = []
  }

  // The half has finished.
  if (turn.active) {
    if (turn.active.half === 'top') turn.topDone = true
    else turn.bottomDone = true
    turn.active = null
  }
  turn.choices = []
  s.pending = null
}
