// Stopping for the night, and carrying on next week.
//
// Everything needed for this was already in place — every game, solo included,
// is filed under its own code and the week is written down — and none of it was
// reachable. From inside a running expedition the only visible way out was
// "call off the expedition", which banks the run and ends it, so a group that
// simply wanted to stop for the evening had to choose between leaving the tab
// open and losing the run.
//
// What these tests hold:
//
//   **A stopped run comes back exactly as it was.** Same week, same heroes, same
//   crew, same hold. It is the same save either way, and that is the point.
//
//   **Every mode is kept**, not just online rooms. A solo player has no reason to
//   know what a room is.
//
//   **A run has a name**, because a list of eight-character codes answers "which
//   one of these is ours?" for nobody.

import { describe, expect, it, beforeEach } from 'vitest'
import { newArchive } from './archive'
import { expeditionStep, partyForSeats, startExpedition } from './expedition'
import { listRooms, loadRoomGame, saveRoomGame } from './save'
import { newRoom, renameRoom, roomLabel } from '../session/room'
import type { GameMode } from '../session/room'

import type { GameState } from './types'

/**
 * A localStorage that exists.
 *
 * These tests are about what survives being put away and taken out again, so the
 * store is the thing under test — but the suite runs in plain node, where there
 * is no browser to borrow one from. A dozen lines of map is cheaper and clearer
 * than a DOM environment for the whole project.
 */
const store = new Map<string, string>()
;(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, String(value)),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size
  },
}

function gameOf(mode: GameMode, name = ''): GameState {
  const setup = { seed: 4242, length: 'medium' as const, players: mode === 'solo' ? 1 : 3 }
  const room = newRoom(setup, mode, partyForSeats(setup.players), { key: 'ABCDEFGH', name: 'Marci' }, name)
  return {
    archive: newArchive(),
    room,
    expedition: startExpedition(setup.seed, 'medium', newArchive()),
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('stopping for the night', () => {
  it('brings the run back on the week it was left on, in every mode', () => {
    for (const mode of ['solo', 'local', 'online'] as GameMode[]) {
      localStorage.clear()
      let game = gameOf(mode)
      // Play a few weeks so "where we left off" is somewhere in particular.
      for (let i = 0; i < 3; i++) {
        game = { ...game, expedition: expeditionStep(game.expedition!, { k: 'advanceWeek' }) }
      }
      saveRoomGame(game)

      const back = loadRoomGame(game.room!.code)
      expect(back, mode).not.toBeNull()
      expect(back!.expedition?.week, mode).toBe(game.expedition!.week)
      expect(back!.room.mode, mode).toBe(mode)
      expect(back!.expedition?.crew.map((c) => c.name)).toEqual(
        game.expedition!.crew.map((c) => c.name),
      )
    }
  })

  it('lists a solo game too, not only rooms with other people in them', () => {
    saveRoomGame(gameOf('solo'))
    const rooms = listRooms()
    expect(rooms).toHaveLength(1)
    expect(rooms[0]!.mode).toBe('solo')
    expect(rooms[0]!.started, 'a run in progress is marked as one').toBe(true)
  })

  it('marks a room that has not set out yet as not started', () => {
    const game = gameOf('online')
    saveRoomGame({ ...game, expedition: null })
    expect(listRooms()[0]!.started).toBe(false)
  })
})

describe('what the table calls it', () => {
  it('keeps the name with the run', () => {
    const game = gameOf('local', 'Csütörtök esti')
    saveRoomGame(game)
    expect(loadRoomGame(game.room!.code)?.room.name).toBe('Csütörtök esti')
    expect(listRooms()[0]!.name).toBe('Csütörtök esti')
  })

  it('falls back to the code, so a run is never nameless on screen', () => {
    const game = gameOf('solo')
    expect(roomLabel(game.room!)).toContain('-')
    expect(roomLabel(renameRoom(game.room!, '  Hajnali  '))).toBe('Hajnali')
  })

  it('will not take a name longer than the list can show', () => {
    const long = 'x'.repeat(200)
    expect(renameRoom(gameOf('solo').room!, long).name.length).toBeLessThanOrEqual(40)
  })

  it('reads an index entry written before names existed', () => {
    // Somebody carries on next week with a save made last week.
    localStorage.setItem(
      'stargrave.rooms',
      JSON.stringify([{ code: 'ABCD1234', mode: 'online', players: 2, week: 5, savedAt: '' }]),
    )
    const rooms = listRooms()
    expect(rooms).toHaveLength(1)
    expect(rooms[0]!.name).toBe('')
    expect(rooms[0]!.started, 'an old entry was only ever written for a live run').toBe(true)
  })
})
