// Traits that cannot describe the same person.
//
// Nothing used to stop these from being dealt together, so the crew list could
// offer you somebody who was "young, veteran" — seeing the stars for the first
// time, having been beyond the Gate before. Read as a character that is
// nonsense; read as numbers it is worse, because three of the forbidden pairs
// cancel each other exactly, and the trait line was then decoration on a person
// with no traits at all.
//
// Two paths add a trait, and both have to obey the table: the generator that
// deals a new crew member, and the promotion that teaches one to a master.

import { describe, expect, it } from 'vitest'
import {
  CREW_TRAITS,
  LEARNABLE_TRAITS,
  TRAIT_CONFLICTS,
  generateCrewMember,
  traitFits,
  traitsConflict,
} from './crew'
import { createRng } from '../engine/rng'
import type { CrewTraitId } from './crew'

const TRAIT_IDS = Object.keys(CREW_TRAITS) as CrewTraitId[]

describe('the table itself', () => {
  it('names only traits that exist', () => {
    for (const [a, b] of TRAIT_CONFLICTS) {
      expect(TRAIT_IDS, a).toContain(a)
      expect(TRAIT_IDS, b).toContain(b)
    }
  })

  it('reads the same in both directions', () => {
    for (const [a, b] of TRAIT_CONFLICTS) {
      expect(traitsConflict(a, b)).toBe(true)
      expect(traitsConflict(b, a)).toBe(true)
    }
  })

  it('never puts a trait against itself, and leaves most pairs alone', () => {
    for (const trait of TRAIT_IDS) expect(traitsConflict(trait, trait)).toBe(false)
    // Over-constrain this and a two-trait crew member stops happening. A brave
    // pedant is a person; a restless veteran is a person.
    const pairs = (TRAIT_IDS.length * (TRAIT_IDS.length - 1)) / 2
    expect(TRAIT_CONFLICTS.length / pairs).toBeLessThan(0.25)
  })

  it('forbids the three pairs whose numbers cancel out', () => {
    // These are the ones that made the trait line a lie rather than merely odd.
    expect(traitsConflict('young', 'veteran')).toBe(true)
    expect(traitsConflict('young', 'restless')).toBe(true)
    expect(traitsConflict('devout', 'alienBorn')).toBe(true)
  })
})

describe('nobody is dealt a contradiction', () => {
  it('holds across a thousand crew members', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const member = generateCrewMember(createRng(seed), `c${seed}`)
      expect(member.traits.length).toBeGreaterThan(0)
      expect(new Set(member.traits).size, 'a trait twice').toBe(member.traits.length)
      for (const a of member.traits) {
        for (const b of member.traits) {
          if (a !== b) {
            expect(traitsConflict(a, b), `${member.traits.join(' + ')}`).toBe(false)
          }
        }
      }
    }
  })

  it('still deals two traits often enough to be worth having', () => {
    let two = 0
    for (let seed = 1; seed <= 1000; seed++) {
      if (generateCrewMember(createRng(seed), `c${seed}`).traits.length === 2) two += 1
    }
    // The generator asks for two about 35% of the time; the table must not eat
    // that. A pass that dropped the second trait whenever it clashed would show
    // up here as a number far below thirty.
    expect(two).toBeGreaterThan(250)
  })
})

describe('and nobody learns one either', () => {
  it('offers a master only traits that fit what they already are', () => {
    for (const had of TRAIT_IDS) {
      const options = LEARNABLE_TRAITS.filter((id) => traitFits(id, [had]))
      for (const option of options) {
        expect(traitsConflict(had, option), `${had} + ${option}`).toBe(false)
        expect(option, 'offered what they already have').not.toBe(had)
      }
    }
  })

  it('always leaves a master something to learn', () => {
    // A promotion that can teach nothing is a reward that silently does not
    // arrive. Whatever one or two traits somebody has, something must remain.
    for (const a of TRAIT_IDS) {
      expect(LEARNABLE_TRAITS.filter((id) => traitFits(id, [a])).length, a).toBeGreaterThan(0)
    }
    for (const [a, b] of [
      ['brave', 'meticulous'],
      ['veteran', 'restless'],
      ['devout', 'brave'],
    ] as [CrewTraitId, CrewTraitId][]) {
      expect(
        LEARNABLE_TRAITS.filter((id) => traitFits(id, [a, b])).length,
        `${a} + ${b}`,
      ).toBeGreaterThan(0)
    }
  })
})
