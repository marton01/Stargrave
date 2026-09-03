// The room code, and the seats it opens.
//
// The code has one job that everything else depends on: two people who have
// never exchanged a byte have to be able to build the same galaxy from it. The
// engine is deterministic, so that reduces to "the code carries the seed, the
// length and the party size, and survives being read down a phone".
//
// So these tests are mostly about typos. A code that silently decodes to a
// DIFFERENT valid setup is the worst possible failure here: two players would
// each be looking at a perfectly working game and wondering why the other one
// describes a different map.

import { describe, expect, it } from 'vitest'
import {
  SEED_BITS,
  claimSeat,
  controls,
  freeHeroes,
  pickHero,
  formatRoomCode,
  freeSeats,
  keyTag,
  newPlayerKey,
  newRoom,
  normaliseRoomCode,
  parseRoomCode,
  releaseSeat,
  roomCode,
  roomIsSeated,
  seatsAllowed,
  seatNames,
  seatsOf,
} from './room'
import { HERO_ORDER, partyForSeats } from '../expedition/expedition'
import type { PlayerIdentity, RoomSetup } from './room'
import type { ExpeditionLength } from '../expedition/types'

const LENGTHS: ExpeditionLength[] = ['short', 'medium', 'long']

function person(name: string): PlayerIdentity {
  return { key: newPlayerKey(), name }
}

describe('the room code', () => {
  it('is eight characters, and always the same eight for a setup', () => {
    const setup: RoomSetup = { seed: 1234567, length: 'medium', players: 3 }
    expect(roomCode(setup)).toHaveLength(8)
    expect(roomCode(setup)).toBe(roomCode({ ...setup }))
  })

  it('carries the seed, the length and the party size, and gives them all back', () => {
    for (let i = 0; i < 400; i++) {
      const setup: RoomSetup = {
        seed: (i * 2654435761) & SEED_BITS,
        length: LENGTHS[i % 3]!,
        players: (i % 4) + 1,
      }
      const parsed = parseRoomCode(roomCode(setup))
      expect(parsed, `setup ${i}`).toEqual(setup)
    }
  })

  it('forgives everything a person can get wrong reading it aloud', () => {
    const code = roomCode({ seed: 99999, length: 'long', players: 2 })
    const shown = formatRoomCode(code)
    for (const typed of [shown, shown.toLowerCase(), ` ${shown} `, code, code.toLowerCase()]) {
      expect(parseRoomCode(typed), typed).toEqual({ seed: 99999, length: 'long', players: 2 })
    }
  })

  it('never contains a character that can be misheard', () => {
    // No I, L, O or U: they are read back as 1, 1, 0 and V.
    for (let seed = 0; seed < 300; seed++) {
      expect(roomCode({ seed, length: 'medium', players: 2 })).not.toMatch(/[ILOU]/)
    }
  })

  it('reads I, L, O and U back as the characters they look like', () => {
    expect(normaliseRoomCode('il0u')).toBe('110V')
  })

  it('refuses a code with a typo in it rather than opening another galaxy', () => {
    const code = roomCode({ seed: 8675309, length: 'short', players: 4 })
    let caught = 0
    let missed = 0
    for (let i = 0; i < code.length; i++) {
      for (const digit of '0123456789ABCDEFGHJKMNPQRSTVWXYZ') {
        if (digit === code[i]) continue
        const typo = code.slice(0, i) + digit + code.slice(i + 1)
        const parsed = parseRoomCode(typo)
        if (parsed === null) caught += 1
        else missed += 1
      }
    }
    // One wrong character out of eight: the checksum has to catch the great
    // majority, and every one it misses is somebody staring at the wrong map.
    expect(caught / (caught + missed)).toBeGreaterThan(0.9)
  })

  it('is not a code at all when it is the wrong length or nonsense', () => {
    for (const bad of ['', 'ABC', 'ABCDEFGHI', '????????']) {
      expect(parseRoomCode(bad), bad).toBeNull()
    }
  })
})

describe('the seats', () => {
  const setup: RoomSetup = { seed: 4242, length: 'medium', players: 4 }

  it('deals one seat per hero, in a fixed order on every machine', () => {
    const host = person('Marci')
    const a = newRoom(setup, 'online', partyForSeats(4), host)
    const b = newRoom(setup, 'online', partyForSeats(4), person('Someone else'))
    expect(a.seats.map((s) => s.heroClass)).toEqual(b.seats.map((s) => s.heroClass))
    expect(a.seats.map((s) => s.slot)).toEqual([1, 2, 3, 4])
    expect(a.code).toBe(b.code)
  })

  it('sits the host down and leaves the rest free', () => {
    const room = newRoom(setup, 'online', partyForSeats(4), person('Marci'))
    expect(freeSeats(room)).toHaveLength(3)
    expect(roomIsSeated(room)).toBe(false)
  })

  it('gives a solo player every chair at once', () => {
    const room = newRoom({ ...setup, players: 1 }, 'solo', partyForSeats(1), person('Marci'))
    expect(freeSeats(room)).toHaveLength(0)
    expect(roomIsSeated(room)).toBe(true)
    expect(seatsAllowed('solo')).toEqual([1])
  })

  it('fills up as people arrive, and knows when the table is full', () => {
    let room = newRoom(setup, 'online', partyForSeats(4), person('Marci'))
    for (const name of ['Anna', 'Bea', 'Cili']) room = claimSeat(room, person(name))
    expect(roomIsSeated(room)).toBe(true)
    expect(room.seats.map((s) => s.name)).toEqual(['Marci', 'Anna', 'Bea', 'Cili'])

    // A fifth person finds nowhere to sit, and nothing breaks.
    const before = JSON.stringify(room)
    room = claimSeat(room, person('Dani'))
    expect(JSON.stringify(room)).toBe(before)
  })

  it('gives somebody their own seat back rather than a second one', () => {
    const guest = person('Anna')
    let room = newRoom(setup, 'online', partyForSeats(4), person('Marci'))
    room = claimSeat(room, guest)
    const again = claimSeat(room, guest)
    expect(seatsOf(again, keyTag(guest.key))).toHaveLength(1)
  })

  it('lets the host free a chair whose player lost their key', () => {
    const host = person('Marci')
    const lost = person('Anna')
    let room = newRoom(setup, 'online', partyForSeats(4), host)
    room = claimSeat(room, lost)
    expect(freeSeats(room)).toHaveLength(2)

    room = releaseSeat(room, keyTag(host.key), 2)
    expect(freeSeats(room)).toHaveLength(3)

    // And a guest cannot free somebody else's.
    const other = person('Bea')
    const attempt = releaseSeat(room, keyTag(other.key), 1)
    expect(attempt.seats[0]!.claimedBy).not.toBeNull()
  })

  it('lets a player give up their own seat', () => {
    const guest = person('Anna')
    let room = newRoom(setup, 'online', partyForSeats(4), person('Marci'))
    room = claimSeat(room, guest)
    room = releaseSeat(room, keyTag(guest.key), 2)
    expect(seatsOf(room, keyTag(guest.key))).toHaveLength(0)
  })
})

describe('who may move whom', () => {
  const setup: RoomSetup = { seed: 7, length: 'medium', players: 4 }

  it('gives an online player their own hero and nobody else’s', () => {
    const host = person('Marci')
    const guest = person('Anna')
    let room = newRoom(setup, 'online', partyForSeats(4), host)
    room = claimSeat(room, guest)

    expect(controls(room, keyTag(host.key), 'runesmith')).toBe(true)
    expect(controls(room, keyTag(host.key), 'echoreader')).toBe(false)
    expect(controls(room, keyTag(guest.key), 'echoreader')).toBe(true)
    expect(controls(room, keyTag(guest.key), 'cantor')).toBe(false)
  })

  it('gives whoever holds the mouse everything, at one keyboard', () => {
    const host = person('Marci')
    const room = newRoom(setup, 'local', partyForSeats(4), host)
    for (const hero of room.seats.map((s) => s.heroClass)) {
      expect(controls(room, keyTag(host.key), hero), hero).toBe(true)
      // Even a player key nobody has ever seen: there is only one keyboard.
      expect(controls(room, 'ffffffff', hero), hero).toBe(true)
    }
  })

  it('gives a game with no room at all to whoever is playing it', () => {
    expect(controls(null, 'ffffffff', 'runesmith')).toBe(true)
  })
})

describe('choosing who to play', () => {
  const setup: RoomSetup = { seed: 9, length: 'medium', players: 4 }
  const host = person('Marci')
  const guest = person('Anna')

  function seated() {
    let room = newRoom(setup, 'online', partyForSeats(4), host)
    room = claimSeat(room, guest)
    return room
  }

  it('lets somebody take a class nobody is playing', () => {
    // A two-seat table leaves the Cantor and the Surveyor on the shelf.
    let small = newRoom({ ...setup, players: 2 }, 'online', partyForSeats(2), host)
    small = claimSeat(small, guest)
    expect(freeHeroes(small, HERO_ORDER)).toEqual(['cantor', 'surveyor'])

    const after = pickHero(small, keyTag(guest.key), 2, 'surveyor')
    expect(after.seats[1]!.heroClass).toBe('surveyor')
    expect(freeHeroes(after, HERO_ORDER)).toContain('echoreader')
  })

  it('exchanges with whoever holds the class at a full table', () => {
    const room = seated()
    // Seat one is the Runesmith, seat two the Echo-reader: they trade.
    const after = pickHero(room, keyTag(guest.key), 2, 'runesmith')
    expect(after.seats[1]!.heroClass).toBe('runesmith')
    expect(after.seats[0]!.heroClass).toBe('echoreader')
  })

  it('never lets two people end up on the same hero', () => {
    let room = seated()
    for (const [slot, hero] of [[1, 'cantor'], [2, 'cantor'], [4, 'runesmith'], [3, 'runesmith']] as const) {
      room = pickHero(room, keyTag(host.key), slot, hero)
      const classes = room.seats.map((s) => s.heroClass)
      expect(new Set(classes).size, `after ${slot}=${hero}`).toBe(classes.length)
    }
  })

  it('will not let somebody re-cast a chair that is not theirs', () => {
    const room = seated()
    const after = pickHero(room, keyTag(guest.key), 1, 'cantor')
    expect(after.seats[0]!.heroClass).toBe('runesmith')
  })

  it('lets the host sort out any chair, including an empty one', () => {
    const room = seated()
    // Seat three is the Cantor and seat four the Surveyor: the host trades them.
    const after = pickHero(room, keyTag(host.key), 3, 'surveyor')
    expect(after.seats[2]!.heroClass).toBe('surveyor')
    expect(after.seats[3]!.heroClass).toBe('cantor')
  })

  it('keeps every seat on a different hero, whatever is picked', () => {
    let room = seated()
    for (const [slot, hero] of [[1, 'cantor'], [2, 'surveyor'], [3, 'runesmith'], [4, 'echoreader']] as const) {
      room = pickHero(room, keyTag(host.key), slot, hero)
    }
    const classes = room.seats.map((s) => s.heroClass)
    expect(new Set(classes).size).toBe(classes.length)
  })
})

describe('who is in which chair', () => {
  const setup: RoomSetup = { seed: 909, length: 'medium', players: 4 }

  it('answers with the name a player gave themselves', () => {
    const room = newRoom(setup, 'online', partyForSeats(4), person('Marci'))
    expect(seatNames(room)[room.seats[0]!.heroClass]).toBe('Marci')
  })

  it('leaves a blank name out rather than passing an empty string on', () => {
    // The interface falls back to the hero's own name, and an empty string would
    // replace that with nothing at all.
    const room = newRoom(setup, 'online', partyForSeats(4), person('   '))
    expect(seatNames(room)[room.seats[0]!.heroClass]).toBeUndefined()
  })

  it('names only the chairs somebody is actually sitting in', () => {
    const room = newRoom(setup, 'online', partyForSeats(4), person('Marci'))
    expect(Object.keys(seatNames(room))).toHaveLength(1)
  })

  it('is empty for no room at all, rather than throwing', () => {
    expect(seatNames(null)).toEqual({})
  })
})
