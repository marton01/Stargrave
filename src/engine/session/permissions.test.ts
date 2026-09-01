// Your hero is yours; the ship is everybody's.
//
// The failure this guards against is not cheating — it is a co-operative game
// and there is nothing to win by it. It is somebody else playing YOUR character:
// spending your marks, taking off your relic, or picking your cards while you are
// reading the enemy intents. That is the one thing that would make four players
// worse than two, so it is a rule rather than an etiquette.

import { describe, expect, it } from 'vitest'
import { claimSeat, keyTag, newPlayerKey, newRoom } from './room'
import type { PlayerIdentity } from './room'
import { mayAct } from './permissions'
import { newArchive } from '../expedition/archive'
import { partyForSeats, startExpedition } from '../expedition/expedition'
import { startMission } from '../battle'
import { generateRuneLine } from '../task/runeline'
import { createRng } from '../rng'
import type { ExpeditionState } from '../expedition/types'

function person(name: string): PlayerIdentity {
  return { key: newPlayerKey(), name }
}

const HOST = person('Marci')
const GUEST = person('Anna')
const STRANGER = person('Somebody')

/** A four-seat online room with the first two chairs taken. */
function table(mode: 'online' | 'local' = 'online') {
  let room = newRoom(
    { seed: 11, length: 'medium', players: 4 },
    mode,
    partyForSeats(4),
    HOST,
  )
  room = claimSeat(room, GUEST)
  return room
}

/** An expedition with the whole party, standing in a battle. */
function inBattle(): ExpeditionState {
  const s = startExpedition(11, 'medium', newArchive(), undefined, partyForSeats(4))
  s.activeMission = {
    k: 'battle',
    nodeId: s.at,
    spec: {
      kind: 'combat',
      objective: { k: 'eliminate' },
      difficulty: 1,
      enemyScale: 1,
      roundLimit: null,
      rewards: [],
      briefing: { hu: 'x', en: 'x' },
    },
    battle: startMission({
      seed: 3,
      difficulty: 1,
      objective: { k: 'eliminate' },
      missionKind: 'combat',
      flux: 5,
      roundLimit: null,
      heroes: s.heroes,
      enemyScale: 1,
    }),
  }
  s.screen = 'mission'
  return s
}

describe('the ship is everybody’s', () => {
  const room = table()
  const s = startExpedition(11, 'medium', newArchive(), undefined, partyForSeats(4))

  it('lets any seat run the ship, set a course and end the week', () => {
    for (const tag of [keyTag(HOST.key), keyTag(GUEST.key)]) {
      expect(mayAct(room, tag, s, { k: 'advanceWeek' })).toBe(true)
      expect(mayAct(room, tag, s, { k: 'setPower', system: 'engines', value: 2 })).toBe(true)
      expect(mayAct(room, tag, s, { k: 'setCourse', nodeId: s.map.nodes[1]!.id })).toBe(true)
      expect(mayAct(room, tag, s, { k: 'engageNode' })).toBe(true)
      expect(mayAct(room, tag, s, { k: 'encounterConfirm' })).toBe(true)
      expect(mayAct(room, tag, s, { k: 'assignCrew', crewId: 'crew-0', station: 'lab' })).toBe(true)
    }
  })
})

describe('your hero is yours', () => {
  const room = table()
  const host = keyTag(HOST.key)
  const guest = keyTag(GUEST.key)
  const s = startExpedition(11, 'medium', newArchive(), undefined, partyForSeats(4))

  it('keeps a console to the person sitting at it', () => {
    // Seat one is the Runesmith, seat two the Echo-reader.
    expect(mayAct(room, host, s, { k: 'buyPerk', hero: 'runesmith', perkId: 'x' })).toBe(true)
    expect(mayAct(room, host, s, { k: 'buyPerk', hero: 'echoreader', perkId: 'x' })).toBe(false)
    expect(mayAct(room, guest, s, { k: 'buyPerk', hero: 'echoreader', perkId: 'x' })).toBe(true)
  })

  it('will not let anybody take a relic off somebody else’s neck', () => {
    expect(
      mayAct(room, host, s, { k: 'stowRelic', hero: 'echoreader', relicId: 'binding-cord' }),
    ).toBe(false)
    expect(
      mayAct(room, guest, s, { k: 'stowRelic', hero: 'echoreader', relicId: 'binding-cord' }),
    ).toBe(true)
  })

  it('will not let anybody take somebody else’s mentee', () => {
    expect(mayAct(room, host, s, { k: 'setMentor', crewId: 'crew-0', hero: 'cantor' })).toBe(false)
  })

  it('gives an empty chair’s hero to nobody at all', () => {
    // Seats three and four are still free: nothing can be done with them until
    // somebody sits down, which is what stops a half-full table playing itself.
    for (const tag of [host, guest, keyTag(STRANGER.key)]) {
      expect(mayAct(room, tag, s, { k: 'buyPerk', hero: 'cantor', perkId: 'x' })).toBe(false)
    }
  })
})

describe('in a battle', () => {
  const room = table()
  const host = keyTag(HOST.key)
  const guest = keyTag(GUEST.key)

  it('lets each of them pick cards only for their own hero', () => {
    const s = inBattle()
    const smith = 'hero-runesmith'
    const reader = 'hero-echoreader'
    expect(
      mayAct(room, host, s, {
        k: 'battleAction',
        action: { k: 'selectCard', heroId: smith, cardId: 'rs-shove' },
      }),
    ).toBe(true)
    expect(
      mayAct(room, host, s, {
        k: 'battleAction',
        action: { k: 'selectCard', heroId: reader, cardId: 'er-echo' },
      }),
    ).toBe(false)
    expect(
      mayAct(room, guest, s, {
        k: 'battleAction',
        action: { k: 'selectCard', heroId: reader, cardId: 'er-echo' },
      }),
    ).toBe(true)
  })

  it('gives the unnamed moves to whoever the engine says is acting', () => {
    const s = inBattle()
    const mission = s.activeMission
    if (mission?.k !== 'battle') throw new Error('expected a battle')
    // During selection, the hero being asked owns "confirm" and everything else.
    mission.battle.selectingHero = 'hero-echoreader'
    expect(mayAct(room, guest, s, { k: 'battleAction', action: { k: 'endTurn' } })).toBe(true)
    expect(mayAct(room, host, s, { k: 'battleAction', action: { k: 'endTurn' } })).toBe(false)

    // And once the turns are being resolved, it follows the initiative order.
    mission.battle.phase = 'resolution'
    mission.battle.selectingHero = null
    mission.battle.heroTurn = {
      ...(mission.battle.heroTurn ?? ({} as never)),
      heroId: 'hero-runesmith',
    }
    expect(mayAct(room, host, s, { k: 'battleAction', action: { k: 'skipHalf', half: 'top' } })).toBe(
      true,
    )
    expect(
      mayAct(room, guest, s, { k: 'battleAction', action: { k: 'skipHalf', half: 'top' } }),
    ).toBe(false)
  })
})

describe('at one keyboard', () => {
  it('lets whoever holds the mouse do everything', () => {
    const room = table('local')
    const s = inBattle()
    const anybody = keyTag(STRANGER.key)
    expect(mayAct(room, anybody, s, { k: 'buyPerk', hero: 'cantor', perkId: 'x' })).toBe(true)
    expect(
      mayAct(room, anybody, s, {
        k: 'battleAction',
        action: { k: 'selectCard', heroId: 'hero-surveyor', cardId: 'sv-shell' },
      }),
    ).toBe(true)
  })

  it('lets a game with no room at all be played', () => {
    expect(mayAct(null, 'nobody', null, { k: 'advanceWeek' })).toBe(true)
  })
})

describe('a split task', () => {
  // The task is the one activity where the screens genuinely differ, so the
  // ownership rule is not a courtesy: pressing somebody else's rune from your
  // machine would let one person brute-force the line while the others watch.
  const room = table()
  const host = keyTag(HOST.key)
  const guest = keyTag(GUEST.key)

  function withTask(): ExpeditionState {
    const s = startExpedition(11, 'medium', newArchive(), undefined, partyForSeats(4))
    s.activeMission = {
      k: 'task',
      nodeId: s.at,
      task: generateRuneLine(createRng(5), { seats: 4, difficulty: 2 }),
      rewards: [],
      briefing: { hu: 'x', en: 'x' },
    }
    s.screen = 'mission'
    return s
  }

  it('lets each seat press only its own runes', () => {
    const s = withTask()
    const mission = s.activeMission
    if (mission?.k !== 'task') throw new Error('expected a task')

    for (let rune = 0; rune < mission.task.count; rune++) {
      const slot = mission.task.owner[rune]!
      // Seat one is the host, seat two the guest; three and four are empty.
      expect(mayAct(room, host, s, { k: 'taskPress', rune }), `rune ${rune}`).toBe(slot === 1)
      expect(mayAct(room, guest, s, { k: 'taskPress', rune }), `rune ${rune}`).toBe(slot === 2)
    }
  })

  it('gives every rune to somebody at one keyboard', () => {
    const local = table('local')
    const s = withTask()
    const mission = s.activeMission
    if (mission?.k !== 'task') throw new Error('expected a task')
    for (let rune = 0; rune < mission.task.count; rune++) {
      expect(mayAct(local, keyTag(STRANGER.key), s, { k: 'taskPress', rune })).toBe(true)
    }
  })
})
