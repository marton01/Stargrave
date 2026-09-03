// Can every trait ever do anything for the person holding it?
//
// A trait that cannot matter is worse than no trait: it reads on the crew list
// as a difference between two people that is not there. Two ways that happened
// here, and both were live in a shipped build:
//
//   **A channel nothing consumed.** `alienTech` was declared, two traits set it,
//   and no line of the engine ever read it. So "of alien descent" did literally
//   nothing, and "devout" — whose written cost was an alienTech penalty — was a
//   free +2 morale, the best trait in the game with no drawback at all.
//
//   **A channel only one speciality can reach.** `research` reaches the ship
//   through the Lab, so a *meticulous guard* carried a line of description that
//   could never fire, and a *sceptical guard* carried one that was purely a
//   penalty.
//
// These tests are the guard rail for both: every trait must move something, and
// nothing may be dealt to somebody it cannot move anything for.

import { describe, expect, it } from 'vitest'
import {
  CREW_TRAITS,
  TRAIT_SPECIALITIES,
  generateCrewMember,
  traitFits,
} from './crew'
import { createRng } from '../engine/rng'
import type { CrewSpeciality, CrewTrait, CrewTraitId } from './crew'

const TRAIT_IDS = Object.keys(CREW_TRAITS) as CrewTraitId[]
const SPECIALITIES: CrewSpeciality[] = ['engineer', 'scientist', 'guard', 'medic', 'navigator']

/** Every way a trait is allowed to reach the game. */
const CHANNELS: (keyof CrewTrait)[] = ['station', 'morale', 'loyalty', 'learn', 'research', 'anywhere']

describe('every trait reaches the game somehow', () => {
  it('moves at least one thing', () => {
    for (const id of TRAIT_IDS) {
      const trait = CREW_TRAITS[id]
      const moves = CHANNELS.filter((field) => trait[field])
      expect(moves.length, `${id} does nothing at all`).toBeGreaterThan(0)
    }
  })

  it('declares no channel the engine does not read', () => {
    // `alienTech` sat here for months doing nothing. Anything added to a trait
    // has to be consumed somewhere, and this list is where that is promised.
    for (const id of TRAIT_IDS) {
      for (const field of Object.keys(CREW_TRAITS[id]) as (keyof CrewTrait)[]) {
        if (field === 'id' || field === 'name' || field === 'description' || field === 'alone') {
          continue
        }
        expect(CHANNELS, `${id} declares ${String(field)}, which nothing reads`).toContain(field)
      }
    }
  })
})

describe('and reaches it for whoever is given it', () => {
  it('is never dealt to somebody it cannot matter for', () => {
    for (const id of TRAIT_IDS) {
      const only = TRAIT_SPECIALITIES[id]
      for (const speciality of SPECIALITIES) {
        if (!traitFits(id, [], speciality)) continue
        // It fits, so it must be able to do something for this speciality: either
        // through a channel everybody has, or because this is one of the
        // specialities the trait is restricted to.
        const universal = (['station', 'morale', 'loyalty', 'learn', 'anywhere'] as const).some(
          (field) => CREW_TRAITS[id][field],
        )
        expect(
          universal || (only?.includes(speciality) ?? false),
          `${id} on a ${speciality} can never do anything`,
        ).toBe(true)
      }
    }
  })

  it('holds for a thousand dealt crew members', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const member = generateCrewMember(createRng(seed), `c${seed}`)
      for (const id of member.traits) {
        const only = TRAIT_SPECIALITIES[id]
        if (only) {
          expect(only, `${id} dealt to a ${member.speciality}`).toContain(member.speciality)
        }
      }
    }
  })

  it('still gives a scientist the trait that is theirs alone', () => {
    // The restriction must not become a ban: the sceptic has to turn up.
    let seen = 0
    for (let seed = 1; seed <= 400; seed++) {
      const member = generateCrewMember(createRng(seed), `c${seed}`, 'scientist')
      if (member.traits.includes('sceptical')) seen += 1
    }
    expect(seen, 'the sceptic never appears on a scientist').toBeGreaterThan(10)
  })
})
