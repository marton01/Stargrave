// The walk through the game.
//
// This exists because the game's biggest missing piece was its first ten
// minutes: nineteen help tabs, eight stations, seven reactor lines, four heroes
// and fifty-four cards, and nothing that said where to start.
//
// What the tests hold is the two promises the walk makes:
//
//   **It covers the game, not a corner of it.** Every screen a player navigates
//   to has a step about it, and every system that can end a run gets named. A
//   walk that stops after the ship screen is worse than none, because it implies
//   the rest does not matter.
//
//   **It is readable in both languages, in whole sentences.** A tutorial with a
//   missing string is a blank panel with no way out of it.

import { describe, expect, it } from 'vitest'
import { GUIDE_STEPS, guideStep } from './guide'
import type { Screen } from '../engine/expedition/types'

/** The screens the navigation offers, which are the ones a walk has to cover. */
const NAV_SCREENS: Screen[] = ['ship', 'starmap', 'research', 'consoles']

describe('the walk covers the game', () => {
  it('has a step for every screen the navigation offers', () => {
    const covered = new Set(GUIDE_STEPS.map((s) => s.screen).filter(Boolean))
    for (const screen of NAV_SCREENS) {
      expect(covered, `nothing explains the ${screen} screen`).toContain(screen)
    }
  })

  it('names the systems that can end a run', () => {
    // Somebody who has met the ship but not the Gate, the Herald or the crew's
    // own life will be surprised by whichever kills them first.
    const all = GUIDE_STEPS.map((s) => `${s.title.hu} ${s.text.hu}`).join(' ').toLowerCase()
    for (const word of ['kapu', 'hírnök', 'zaj', 'megfejtés', 'legénység', 'morál']) {
      expect(all, `the walk never mentions "${word}"`).toContain(word)
    }
  })

  it('says how to stop, because that was the thing nobody could find', () => {
    const all = GUIDE_STEPS.map((s) => s.text.hu).join(' ')
    expect(all).toContain('Félbehagy')
  })

  it('points only at screens that exist', () => {
    const screens: Screen[] = [
      'ship',
      'starmap',
      'crew',
      'research',
      'market',
      'encounter',
      'mission',
      'consoles',
      'heart',
      'gate',
      'over',
    ]
    for (const step of GUIDE_STEPS) {
      if (step.screen === null) continue
      expect(screens, `${step.id} points at ${step.screen}`).toContain(step.screen)
    }
  })
})

describe('and is readable', () => {
  it('says something in both languages on every step', () => {
    for (const step of GUIDE_STEPS) {
      for (const field of [step.title, step.text]) {
        expect(field.hu.length, `${step.id} hu`).toBeGreaterThan(8)
        expect(field.en.length, `${step.id} en`).toBeGreaterThan(8)
      }
    }
  })

  it('gives every step its own id', () => {
    const ids = GUIDE_STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ends rather than running off the end', () => {
    expect(guideStep(GUIDE_STEPS.length)).toBeNull()
    expect(guideStep(-1)).toBeNull()
    expect(guideStep(0)).not.toBeNull()
  })

  it('is short enough that somebody finishes it', () => {
    // A walk nobody finishes teaches nothing. Twelve steps is about a cup of tea.
    expect(GUIDE_STEPS.length).toBeLessThanOrEqual(15)
    expect(GUIDE_STEPS.length).toBeGreaterThanOrEqual(8)
  })
})
