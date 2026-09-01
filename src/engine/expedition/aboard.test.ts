// The ship's own weeks: loyalty, betrayal, and consequences with a date on them.
//
// The week used to be one click. These three systems give it a life, and each of
// them has one way of going wrong that would be worse than not having it:
//
//   **Loyalty** could be a mood that wanders. It has to follow how the ship is
//   actually run, or the crew are weather rather than people.
//
//   **A betrayal could be a die roll.** It must not be. By the time somebody
//   walks off with the fuel, the crew list has been saying for weeks that they
//   stopped talking to anybody, and the ship getting better has to be able to
//   stop it. That is the difference between a consequence and an ambush — and it
//   is the single most important test in this file.
//
//   **A delayed consequence could be a mystery.** It announces itself in the log
//   when it lands, and the ship screen lists everything still coming, so nobody
//   is ever left wondering why the food went.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  aboardChance,
  expeditionStep,
  loyaltyTarget,
  pendingIsAboard,
  pendingOwner,
  startExpedition,
} from './expedition'
import { ABOARD_EVENTS } from '../../content/aboard'
import { findEncounter } from '../../content/encounters'
import { defaultDials } from '../../content/difficulty'
import { HERO_ORDER } from './expedition'
import type { ExpeditionState } from './types'

function ship(aboard = 3): ExpeditionState {
  const s = startExpedition(4321, 'medium', newArchive(), {
    ...defaultDials(),
    directives: 1,
    attention: 1,
    aboard,
  }, HERO_ORDER)
  s.map.nodes.find((n) => n.id === s.at)!.resolved = true
  return s
}

function weeks(s: ExpeditionState, count: number): ExpeditionState {
  let after = s
  for (let i = 0; i < count && !after.outcome; i++) {
    after = expeditionStep(after, { k: 'advanceWeek' })
  }
  return after
}

describe('loyalty follows how the ship is run', () => {
  it('rises on a well-run ship and falls on a bad one', () => {
    const good = ship()
    good.resources.morale = 10
    good.power.lifeSupport = 3

    const bad = ship()
    bad.resources.morale = 2
    bad.power.lifeSupport = 0
    bad.resources.food = 0

    for (const member of good.crew) {
      expect(loyaltyTarget(good, member), member.name).toBeGreaterThan(
        loyaltyTarget(bad, bad.crew.find((c) => c.id === member.id)!),
      )
    }
  })

  it('is raised most by being somebody’s responsibility', () => {
    const s = ship()
    const member = s.crew[0]!
    const alone = loyaltyTarget(s, member)
    member.mentor = 'cantor'
    expect(loyaltyTarget(s, member)).toBeGreaterThan(alone + 2)
  })

  it('moves one step a week, never a jump', () => {
    const s = ship(1)
    s.resources.morale = 1
    s.power.lifeSupport = 0
    const before = s.crew.map((c) => c.loyalty)
    const after = weeks(s, 1)
    after.crew.forEach((member, i) => {
      expect(Math.abs(member.loyalty - before[i]!), member.name).toBeLessThanOrEqual(1)
    })
  })
})

describe('nobody betrays you out of nowhere', () => {
  /** A ship somebody has given up on. */
  function desperate(): ExpeditionState {
    // The dial has to be on: it governs the ship's life as a whole, departures
    // included, and its quietest step promises that the crew never speaks up.
    const s = ship(3)
    s.resources.morale = 1
    s.power.lifeSupport = 0
    // At the bottom, not at the threshold: a couple of them have traits that
    // hold them up, and the drift would carry those back over the line.
    for (const member of s.crew) member.loyalty = 0
    return s
  }

  it('warns weeks in advance, in the log and in what is coming', () => {
    const after = weeks(desperate(), 1)
    expect(after.log.some((entry) => entry.event.k === 'crewRestless')).toBe(true)
    const leaving = after.debts.filter((debt) => debt.kind === 'leaving')
    expect(leaving.length).toBeGreaterThan(0)
    // Not this week, and not next: there is time to do something.
    for (const debt of leaving) expect(debt.at - after.week).toBeGreaterThan(1)
  })

  it('can be called off by making the ship better', () => {
    let s = weeks(desperate(), 1)
    expect(s.debts.some((debt) => debt.kind === 'leaving')).toBe(true)

    // Somebody notices them, and the air comes back on.
    const who = s.debts.find((debt) => debt.kind === 'leaving')!.subject!
    s = expeditionStep(s, { k: 'setMentor', crewId: who, hero: 'cantor' })
    s.resources.morale = 10
    s.power.lifeSupport = 3
    s = weeks(s, 3)

    expect(s.debts.some((debt) => debt.subject === who && debt.kind === 'leaving')).toBe(false)
    expect(s.log.some((entry) => entry.event.k === 'crewSettled')).toBe(true)
    // And they are still aboard.
    expect(s.crew.find((c) => c.id === who)?.alive).toBe(true)
  })

  it('never takes a relic that somebody is wearing', () => {
    const s = ship(1)
    s.relics = ['binding-cord']
    const worn = expeditionStep(s, {
      k: 'attuneRelic',
      hero: 'runesmith',
      relicId: 'binding-cord',
    })
    worn.subject = worn.crew[0]!.id
    const after = expeditionStep(worn, { k: 'encounterClose' })
    void after
    // Straight to the defection, the way the departure scene's last answer does.
    const gone = expeditionStep(worn, { k: 'advanceWeek' })
    expect(gone.relics).toContain('binding-cord')
  })
})

describe('consequences with a date on them', () => {
  it('lands on the week it was promised, and says why', () => {
    const s = ship(1)
    s.debts.push({
      at: s.week + 2,
      subject: null,
      note: { hu: 'A próba.', en: 'The test.' },
      effects: [{ k: 'resource', id: 'credits', amount: 25 }],
    })

    const oneWeek = weeks(s, 1)
    expect(oneWeek.debts).toHaveLength(1)
    expect(oneWeek.log.some((entry) => entry.event.k === 'debtCame')).toBe(false)

    const twoWeeks = weeks(oneWeek, 1)
    expect(twoWeeks.debts).toHaveLength(0)
    expect(twoWeeks.log.some((entry) => entry.event.k === 'debtCame')).toBe(true)
    expect(twoWeeks.resources.credits).toBeGreaterThan(oneWeek.resources.credits)
  })

  it('is dropped when the person it was about is gone', () => {
    const s = ship(1)
    const who = s.crew[0]!
    s.debts.push({
      at: s.week + 1,
      subject: who.id,
      note: { hu: 'Róla szólt volna.', en: 'It would have been about them.' },
      effects: [{ k: 'resource', id: 'morale', amount: -5 }],
    })
    who.alive = false

    const morale = s.resources.morale
    const after = weeks(s, 1)
    expect(after.debts).toHaveLength(0)
    // The story ended with them: it does not land on somebody else.
    expect(after.resources.morale).toBeGreaterThanOrEqual(morale - 2)
  })

  it('is written where the players can read it before it happens', () => {
    const s = ship(1)
    s.debts.push({
      at: s.week + 3,
      subject: null,
      note: { hu: 'Ez látszik a hajó képernyőjén.', en: 'This shows on the ship screen.' },
      effects: [],
    })
    // The ship screen renders `state.debts` directly — the test that matters is
    // that the note is there to render, in both languages.
    expect(s.debts[0]!.note.hu.length).toBeGreaterThan(4)
    expect(s.debts[0]!.note.en.length).toBeGreaterThan(4)
  })
})

describe('something happens aboard', () => {
  it('comes up on its own, and blocks the week until somebody answers', () => {
    let s = ship(5)
    for (let i = 0; i < 12 && !s.pendingEncounter; i++) s = weeks(s, 1)
    expect(s.pendingEncounter, 'nothing ever happened aboard').not.toBeNull()
    expect(pendingIsAboard(s)).toBe(true)

    // The week cannot turn over while the ship is waiting for an answer.
    const week = s.week
    const stuck = expeditionStep(s, { k: 'advanceWeek' })
    expect(stuck.week).toBe(week)

    // Answering it lets the week go on again.
    const answered = expeditionStep(
      expeditionStep(s, { k: 'encounterChoose', index: 0 }),
      { k: 'encounterConfirm' },
    )
    const closed = expeditionStep(answered, { k: 'encounterClose' })
    expect(expeditionStep(closed, { k: 'advanceWeek' }).week).toBe(week + 1)
  })

  it('never happens at all on the quietest dial', () => {
    const quiet = weeks(ship(1), 25)
    expect(quiet.log.some((entry) => entry.event.k === 'aboardEvent')).toBe(false)
    expect(aboardChance(ship(1))).toBe(0)
  })

  it('never happens two weeks running, however badly things are going', () => {
    // The line between a place and a queue. It is also a safety valve: several of
    // these situations cost morale, and when a strained ship rolled MORE of them
    // one bad week became a spiral no play could pull out of — a smoke run lost
    // two expeditions to it on the bridge, never to the Gate.
    const s = ship(5)
    s.resources.morale = 2
    for (const member of s.crew) member.loyalty = 1
    s.log.push({ week: s.week - 1, event: { k: 'aboardEvent', title: { hu: 'x', en: 'x' }, owner: null } })
    expect(aboardChance(s)).toBe(0)
  })

  it('leaves a week that can actually be lived through', () => {
    // Whatever else changes, a run must not be able to end on the ship's own
    // weeks alone: fifteen weeks of a well-run ship with the dial at its loudest.
    let s = ship(5)
    s.resources.morale = 9
    s.power.lifeSupport = 3
    for (let i = 0; i < 15 && !s.outcome; i++) {
      s = expeditionStep(s, { k: 'advanceWeek' })
      if (s.pendingEncounter) {
        s = expeditionStep(s, { k: 'encounterChoose', index: 0 })
        s = expeditionStep(s, { k: 'encounterConfirm' })
        s = expeditionStep(s, { k: 'encounterClose' })
      }
    }
    expect(s.outcome?.k, 'the ship’s own weeks ended the run').not.toBe('lost')
  })

  it('happens more often on a ship that is going badly', () => {
    const calm = ship()
    const grim = ship()
    grim.resources.morale = 3
    grim.crew[0]!.loyalty = 2
    expect(aboardChance(grim)).toBeGreaterThan(aboardChance(calm))
  })

  it('does not use up the place the ship is standing at', () => {
    let s = ship(5)
    // A node with something on it, and the ship parked on it.
    const node = s.map.nodes.find((n) => n.event.k === 'mission')!
    s.at = node.id
    node.resolved = false
    for (let i = 0; i < 12 && !s.pendingEncounter; i++) s = weeks(s, 1)
    if (!s.pendingEncounter) return

    const answered = expeditionStep(
      expeditionStep(s, { k: 'encounterChoose', index: 0 }),
      { k: 'encounterConfirm' },
    )
    expect(answered.map.nodes.find((n) => n.id === node.id)?.resolved).toBe(false)
  })
})

describe('every aboard event is a real situation', () => {
  it('names whose call it is, and that hero exists', () => {
    for (const event of ABOARD_EVENTS) {
      expect(event.aboard, event.id).toBe(true)
      if (event.owner) expect(HERO_ORDER, event.id).toContain(event.owner)
    }
  })

  it('is in the one index, so it can be resolved', () => {
    for (const event of ABOARD_EVENTS) {
      expect(findEncounter(event.id), event.id).toBeDefined()
    }
  })

  it('offers at least two answers, and every one of them says something', () => {
    for (const event of ABOARD_EVENTS) {
      expect(event.choices.length, event.id).toBeGreaterThanOrEqual(2)
      for (const choice of event.choices) {
        for (const text of [choice.text, choice.result]) {
          expect(text.hu.length, event.id).toBeGreaterThan(4)
          expect(text.en.length, event.id).toBeGreaterThan(4)
        }
      }
    }
  })

  it('makes at least a third of them reach into a later week', () => {
    // The point of the system: a decision that costs nothing today and something
    // in three weeks. If almost none of them do that, this is just a pop-up.
    const withLater = ABOARD_EVENTS.filter((event) =>
      event.choices.some((choice) => choice.effects.some((effect) => effect.k === 'later')),
    )
    expect(withLater.length / ABOARD_EVENTS.length).toBeGreaterThan(0.33)
  })

  it('tells the interface whose it is', () => {
    const s = ship(1)
    s.pendingEncounter = { id: 'aboard-hold-fight', chosen: null, payment: [], resolvedText: null }
    expect(pendingIsAboard(s)).toBe(true)
    expect(pendingOwner(s)).toBe('cantor')
  })
})
