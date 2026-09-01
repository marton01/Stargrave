// What one of you promises the others.
//
// Of the four social things the usual list asks for — bargaining, threats,
// promises, bluffing — three have no honest place in a co-operative game. The
// promise is the one that survives whole, and it only survives if the game
// actually holds somebody to it. So:
//
//   **It is binding.** A pledge that is never checked is flavour text.
//
//   **It pays the person, not the ship.** The marks go to whoever said it.
//   Being the one who says a thing and then does it is a role a quiet player can
//   take without out-arguing anybody.
//
//   **A promise not to do something fails the moment it is broken**, not three
//   weeks later. Being told at the deadline what everybody watched happen would
//   be worse than useless.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import { HERO_ORDER, expeditionStep, pledgeLabel, startExpedition } from './expedition'
import { PLEDGE_DEFS } from '../../content/pledges'
import { defaultDials } from '../../content/difficulty'
import type { ExpeditionState } from './types'

function ship(): ExpeditionState {
  const s = startExpedition(
    2211,
    'medium',
    newArchive(),
    { ...defaultDials(), directives: 1, attention: 1, aboard: 1 },
    HERO_ORDER,
  )
  s.map.nodes.find((n) => n.id === s.at)!.resolved = true
  return s
}

function weeks(s: ExpeditionState, count: number): ExpeditionState {
  let after = s
  for (let i = 0; i < count && !after.outcome; i++) {
    after = expeditionStep(after, { k: 'advanceWeek' })
    if (after.pendingEncounter) {
      after = expeditionStep(after, { k: 'encounterChoose', index: 0 })
      after = expeditionStep(after, { k: 'encounterConfirm' })
      after = expeditionStep(after, { k: 'encounterClose' })
    }
  }
  return after
}

describe('somebody gives their word', () => {
  it('writes it down with a date and says who said it', () => {
    const s = expeditionStep(ship(), { k: 'makePledge', hero: 'cantor', kind: 'stores' })
    expect(s.pledge?.by).toBe('cantor')
    expect(s.pledge?.due).toBeGreaterThan(s.week)
    expect(s.pledge?.state).toBe('open')
    expect(pledgeLabel(s.pledge!).hu.length).toBeGreaterThan(8)
    expect(s.log.some((e) => e.event.k === 'pledgeMade')).toBe(true)
  })

  it('allows only one at a time, for the whole table', () => {
    let s = expeditionStep(ship(), { k: 'makePledge', hero: 'cantor', kind: 'stores' })
    s = expeditionStep(s, { k: 'makePledge', hero: 'runesmith', kind: 'hull' })
    expect(s.pledge?.by, 'a second word was taken over the first').toBe('cantor')
  })

  it('pays the person who said it, and only when it is kept', () => {
    let s = ship()
    s = expeditionStep(s, { k: 'makePledge', hero: 'cantor', kind: 'stores' })
    const marksBefore = s.heroRecords.cantor.marks
    // Make it true with room to spare — the galley eats a couple a week — and
    // then let the deadline come.
    s.resources.food = s.pledge!.target + 14
    const after = weeks(s, PLEDGE_DEFS.find((d) => d.kind === 'stores')!.weeks + 1)
    expect(after.pledge?.state).toBe('kept')
    expect(after.heroRecords.cantor.marks).toBeGreaterThan(marksBefore)
    expect(after.log.some((e) => e.event.k === 'pledgeKept')).toBe(true)
  })

  it('costs the ship when it is not kept', () => {
    // Against a control rather than against the starting number: morale drifts
    // on its own every week, so "lower than it was" would measure the drift.
    const run = PLEDGE_DEFS.find((d) => d.kind === 'hull')!.weeks + 1
    const base = ship()
    base.resources.hull = 1
    const control = weeks(structuredClone(base), run)

    let s = structuredClone(base)
    s = expeditionStep(s, { k: 'makePledge', hero: 'runesmith', kind: 'hull' })
    const after = weeks(s, run)

    expect(after.pledge?.state).toBe('broken')
    expect(after.resources.morale).toBeLessThan(control.resources.morale)
    expect(after.log.some((e) => e.event.k === 'pledgeBroken')).toBe(true)
  })

  it('fails a promise NOT to do something the moment it is broken', () => {
    // Being told at the deadline what everybody watched happen is worse than
    // useless. Silence is the heart's own pledge: it is broken by learning.
    let s = ship()
    s.dials.attention = 3
    s = expeditionStep(s, { k: 'makePledge', hero: 'echoreader', kind: 'quiet' })
    const due = s.pledge!.due
    s.debts.push({
      at: s.week,
      subject: null,
      note: { hu: 'tanultunk', en: 'we learned' },
      effects: [{ k: 'understanding', amount: 4 }],
    })
    const after = expeditionStep(s, { k: 'advanceWeek' })
    expect(after.week).toBeLessThan(due)
    expect(after.pledge?.state, 'the broken silence went unnoticed').toBe('broken')
  })
})
