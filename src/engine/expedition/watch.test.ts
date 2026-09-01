// One decision each, every week.
//
// The strategic layer was full of decisions and every one of them belonged to
// the table. A player who was not driving could sit through a month of game time
// without a choice that was theirs — the perks are spent when you happen to have
// the marks, and the route is argued out together.
//
// A duty is small on purpose. What it must be is (a) genuinely a choice — three
// options where the best one depends on the week rather than on arithmetic — and
// (b) genuinely yours, which is the part a test can hold on to.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  HERO_ORDER,
  expeditionStep,
  missionFlux,
  startExpedition,
} from './expedition'
import { WATCH_DUTIES, dutiesOf } from '../../content/watch'
import { defaultDials } from '../../content/difficulty'
import type { ExpeditionState } from './types'
import type { HeroClassId } from '../types'

function ship(): ExpeditionState {
  const s = startExpedition(606, 'medium', newArchive(), {
    ...defaultDials(),
    // Orders and the Herald both move the numbers this file measures.
    directives: 1,
    attention: 1,
    aboard: 1,
  }, HERO_ORDER)
  s.map.nodes.find((n) => n.id === s.at)!.resolved = true
  // Room to be repaired and room to be filled: a duty that tops up a resource
  // already at its ceiling does nothing, and would look like a broken duty.
  s.resources.hull -= 6
  s.resources.fuel -= 6
  s.resources.morale -= 2
  return s
}

/** The state after a week in which `hero` did `duty`. */
function afterDuty(hero: HeroClassId, duty: string): { before: ExpeditionState; after: ExpeditionState } {
  const before = expeditionStep(ship(), { k: 'setWatch', hero, duty })
  return { before, after: expeditionStep(before, { k: 'advanceWeek' }) }
}

describe('every duty in the game does something', () => {
  it('changes the ship in the way its own words promise', () => {
    for (const duty of WATCH_DUTIES) {
      const { before, after } = afterDuty(duty.heroClass, duty.id)
      const e = duty.effect
      const plain = expeditionStep(ship(), { k: 'advanceWeek' })

      if (e.hull) {
        expect(after.resources.hull - plain.resources.hull, duty.id).toBe(e.hull)
      }
      if (e.information) {
        expect(after.resources.information - plain.resources.information, duty.id).toBe(e.information)
      }
      if (e.fuel) {
        expect(after.resources.fuel - plain.resources.fuel, duty.id).toBe(e.fuel)
      }
      if (e.understanding) {
        expect(after.understanding - plain.understanding, duty.id).toBe(e.understanding)
      }
      if (e.morale) {
        expect(after.resources.morale - plain.resources.morale, duty.id).toBe(e.morale)
      }
      if (e.attention) {
        // Attention is floored at zero, so this only says it moved the right way.
        expect(after.attention, duty.id).toBeLessThanOrEqual(plain.attention)
      }
      if (e.reveal) {
        const known = (s: ExpeditionState) => s.map.nodes.filter((n) => n.known).length
        expect(known(after), duty.id).toBeGreaterThan(known(plain))
      }
      if (e.flux) {
        expect(missionFlux(after) - missionFlux(plain), duty.id).toBe(e.flux)
      }
      if (e.mend) {
        // Wounded first, or there is nothing to mend.
        const hurt = ship()
        for (const carried of hurt.heroes) carried.hp = 1
        const tended = expeditionStep(
          expeditionStep(hurt, { k: 'setWatch', hero: duty.heroClass, duty: duty.id }),
          { k: 'advanceWeek' },
        )
        const untended = expeditionStep(hurt, { k: 'advanceWeek' })
        expect(
          tended.heroes[0]!.hp - untended.heroes[0]!.hp,
          duty.id,
        ).toBe(e.mend)
      }
      if (e.teach) {
        const withMentees = ship()
        const mentee = withMentees.crew[0]!.id
        const taught = expeditionStep(
          expeditionStep(
            expeditionStep(withMentees, { k: 'setMentor', crewId: mentee, hero: duty.heroClass }),
            { k: 'setWatch', hero: duty.heroClass, duty: duty.id },
          ),
          { k: 'advanceWeek' },
        )
        const plainMentee = expeditionStep(
          expeditionStep(withMentees, { k: 'setMentor', crewId: mentee, hero: duty.heroClass }),
          { k: 'advanceWeek' },
        )
        const xp = (s: ExpeditionState) => s.crew.find((c) => c.id === mentee)!.xp
        expect(xp(taught) - xp(plainMentee), duty.id).toBe(e.teach)
      }

      // And it is recorded, so nobody has to take the game's word for it.
      expect(before.log.some((entry) => entry.event.k === 'watchSet'), duty.id).toBe(true)
      expect(after.log.some((entry) => entry.event.k === 'watchDone'), duty.id).toBe(true)
    }
  })

  it('gives every hero three of them, and they are genuinely different', () => {
    for (const hero of HERO_ORDER) {
      const duties = dutiesOf(hero)
      expect(duties.length, hero).toBe(3)
      // One of the three costs something: a list of three straight bonuses is a
      // list with one right answer, which is not a decision.
      const hasCost = duties.some((duty) =>
        Object.values(duty.effect).some((value) => typeof value === 'number' && value < 0),
      )
      expect(hasCost, `${hero}: nothing on this list costs anything`).toBe(true)
    }
  })
})

describe('whose week it is', () => {
  it('refuses a duty from somebody else’s list', () => {
    const s = ship()
    const after = expeditionStep(s, { k: 'setWatch', hero: 'runesmith', duty: 'cantor-sing' })
    expect(after.watch.runesmith).toBeUndefined()
  })

  it('refuses a duty for a hero who is not on this expedition', () => {
    const two = startExpedition(606, 'medium', newArchive())
    const after = expeditionStep(two, { k: 'setWatch', hero: 'cantor', duty: 'cantor-sing' })
    expect(after.watch.cantor).toBeUndefined()
  })

  it('swaps one duty for another, and puts it down when picked twice', () => {
    const s = ship()
    const once = expeditionStep(s, { k: 'setWatch', hero: 'cantor', duty: 'cantor-sing' })
    expect(once.watch.cantor).toBe('cantor-sing')

    const swapped = expeditionStep(once, { k: 'setWatch', hero: 'cantor', duty: 'cantor-tend' })
    expect(swapped.watch.cantor).toBe('cantor-tend')

    const dropped = expeditionStep(swapped, { k: 'setWatch', hero: 'cantor', duty: 'cantor-tend' })
    expect(dropped.watch.cantor).toBeUndefined()
  })

  it('asks again next week rather than standing until changed', () => {
    const { after } = afterDuty('cantor', 'cantor-sing')
    expect(after.watch).toEqual({})
  })

  it('costs nothing at all when nobody set one', () => {
    const quiet = expeditionStep(ship(), { k: 'advanceWeek' })
    expect(quiet.log.some((entry) => entry.event.k === 'watchDone')).toBe(false)
    expect(quiet.outcome).toBeNull()
  })
})
