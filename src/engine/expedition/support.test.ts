// The ship, while the fight is happening.
//
// Everything else in this game is sequential, which is exactly why one strong
// player can plan for all four seats: there is always time to think for somebody
// else. This is the one place two groups of players act in the same minute.
//
// What has to hold:
//
//   **Staying behind is a trade, not sitting out.** The party on the ground is
//   genuinely smaller, and the ship genuinely acts.
//
//   **Somebody always lands.** A landing with nobody on it is not a landing.
//
//   **Once a round.** The ship's action must not become a second hand of cards
//   played by whoever is not busy.
//
//   **Whoever stayed still exists afterwards.** The mission result only knows
//   about the heroes who went down; assigning it wholesale would delete the
//   others from the expedition.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  HERO_ORDER,
  expeditionStep,
  landingHeroes,
  startExpedition,
  supportAvailable,
} from './expedition'
import { MIN_LANDING_PARTY } from '../../content/support'
import { defaultDials } from '../../content/difficulty'
import { isHero } from '../state'
import type { ExpeditionState } from './types'

function ship(): ExpeditionState {
  const s = startExpedition(
    606,
    'medium',
    newArchive(),
    { ...defaultDials(), directives: 1, attention: 1, aboard: 1 },
    HERO_ORDER,
  )
  s.map.nodes.find((n) => n.id === s.at)!.resolved = true
  return s
}

/** Put a landing on the board with whoever is not staying aboard. */
function land(s: ExpeditionState): ExpeditionState {
  const node = s.map.nodes.find((n) => n.event.k === 'mission' && !n.resolved)
  if (!node) return s
  const at = { ...s, at: node.id }
  return expeditionStep(at, { k: 'engageNode' })
}

describe('not everybody goes down', () => {
  it('leaves somebody aboard, and takes them off the landing party', () => {
    const s = expeditionStep(ship(), { k: 'toggleAshore', hero: 'surveyor' })
    expect(s.ashore).toContain('surveyor')
    expect(landingHeroes(s)).not.toContain('surveyor')
    expect(s.log.some((e) => e.event.k === 'stayedAboard')).toBe(true)
  })

  it('never lets the ground be left empty', () => {
    let s = ship()
    for (const hero of HERO_ORDER) s = expeditionStep(s, { k: 'toggleAshore', hero })
    expect(landingHeroes(s).length).toBeGreaterThanOrEqual(MIN_LANDING_PARTY)
  })

  it('puts a genuinely smaller party on the board', () => {
    const full = land(ship())
    const short = land(expeditionStep(ship(), { k: 'toggleAshore', hero: 'surveyor' }))
    if (full.activeMission?.k !== 'battle' || short.activeMission?.k !== 'battle') return
    const count = (s: ExpeditionState) =>
      s.activeMission?.k === 'battle'
        ? s.activeMission.battle.units.filter((u) => isHero(u)).length
        : 0
    expect(count(short)).toBe(count(full) - 1)
  })
})

describe('and the ship acts while they are down there', () => {
  it('spends the hold and is felt on the grid, once a round', () => {
    let s = land(expeditionStep(ship(), { k: 'toggleAshore', hero: 'surveyor' }))
    if (s.activeMission?.k !== 'battle') return
    s.resources.fuel = 20
    const fuel = s.resources.fuel
    const flux = s.activeMission.battle.flux

    expect(supportAvailable(s)).toBe(true)
    s = expeditionStep(s, { k: 'shipSupport', hero: 'surveyor', kind: 'power' })
    expect(s.activeMission?.k === 'battle' && s.activeMission.battle.flux).toBe(flux + 3)
    expect(s.resources.fuel).toBe(fuel - 3)

    // Once. It must not become a second hand of cards.
    expect(supportAvailable(s)).toBe(false)
    const again = expeditionStep(s, { k: 'shipSupport', hero: 'surveyor', kind: 'power' })
    expect(again.resources.fuel).toBe(fuel - 3)
  })

  it('is refused to a hero who went down', () => {
    let s = land(expeditionStep(ship(), { k: 'toggleAshore', hero: 'surveyor' }))
    if (s.activeMission?.k !== 'battle') return
    s.resources.fuel = 20
    const fuel = s.resources.fuel
    const after = expeditionStep(s, { k: 'shipSupport', hero: 'runesmith', kind: 'power' })
    expect(after.resources.fuel).toBe(fuel)
  })

  it('can spend the fight keeping the ship quiet', () => {
    // The heart's own action: a landing is loud, understanding is loud, and the
    // people upstairs are the only ones free to take it back out of the air.
    let s = land(expeditionStep(ship(), { k: 'toggleAshore', hero: 'surveyor' }))
    if (s.activeMission?.k !== 'battle') return
    s.attention = 5
    s.resources.information = 20
    const after = expeditionStep(s, { k: 'shipSupport', hero: 'surveyor', kind: 'dampen' })
    expect(after.attention).toBe(4)
  })
})

describe('whoever stayed is still there afterwards', () => {
  it('does not delete them when the landing is settled', () => {
    let s = land(expeditionStep(ship(), { k: 'toggleAshore', hero: 'surveyor' }))
    if (s.activeMission?.k !== 'battle') return
    s.activeMission.battle.outcome = 'victory'
    const after = expeditionStep(s, { k: 'missionFinish' })
    expect(
      after.heroes.map((h) => h.heroClass),
      'the hero who stayed aboard was deleted by the result',
    ).toContain('surveyor')
    expect(after.heroes).toHaveLength(4)
  })
})
