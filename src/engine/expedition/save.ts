// Saving and loading.
//
// Automatic saving after every week and every mission, one running expedition,
// no reloading. The weight of decisions is preserved, but you never lose the
// work if you have to stop for the night.
//
// The save also has to be EXPORTABLE to a file. Cleared browser data must not be
// able to take away a twenty-eight week expedition — that would be the one bug
// in the whole game that could not be forgiven.

import type { Unit } from '../types'
import { newArchive, ARCHIVE_VERSION } from './archive'
import { blankHeroRecords } from './expedition'
import { normaliseDials } from '../../content/difficulty'
import type { Dials } from '../../content/difficulty'
import type { ArchiveState, ExpeditionState, GameState } from './types'
import type { PlayerIdentity, RoomState } from '../session/room'
import { ROOM_NAME_MAX, newPlayerKey } from '../session/room'

export const SAVE_VERSION = 1
const STORAGE_KEY = 'stargrave.save'

/**
 * The difficulty preset, kept apart from the save.
 *
 * On purpose: the terms you like to play under are a property of you, not of a
 * particular expedition, so they survive a run ending and are offered to the
 * next one. `clearSave` takes this too — "delete everything" means everything.
 */
const DIALS_KEY = 'stargrave.dials'

export type SaveFile = {
  version: number
  savedAt: string
  archive: ArchiveState
  expedition: ExpeditionState | null
  /** The table this was played at, if it had one. Absent in older saves. */
  room?: RoomState | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * A save from a future or unknown version is not worth guessing at. We keep the
 * Archive when we can — that is the part a player would miss — and drop the
 * running expedition rather than resume something we cannot read.
 */
export function parseSave(raw: string): GameState | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(parsed)) return null

  const version = typeof parsed.version === 'number' ? parsed.version : 0
  const archive = isRecord(parsed.archive) ? (parsed.archive as unknown as ArchiveState) : null
  const expedition = isRecord(parsed.expedition)
    ? (parsed.expedition as unknown as ExpeditionState)
    : null

  if (!archive || typeof archive.points !== 'number' || !Array.isArray(archive.unlocked)) {
    return null
  }

  if (version !== SAVE_VERSION) {
    // Keep what we understand, discard what we do not.
    return {
      archive: { ...newArchive(), ...archive, version: ARCHIVE_VERSION },
      expedition: null,
      room: null,
    }
  }

  // A save written before a field existed is not a broken save; it is an older
  // one. Filling the gaps in beats dropping a twenty-eight week expedition over
  // a missing empty list.
  return {
    archive: { ...newArchive(), ...archive },
    expedition: expedition ? migrate(expedition) : null,
    // A save from before rooms existed was a game at one keyboard, and it still
    // is: no code, no seats, nothing to rejoin.
    room: (parsed.room as RoomState | undefined) ?? null,
  }
}

/**
 * Fill in whatever a save written before a field existed is missing.
 *
 * An older save is not a broken save. Filling the gaps in beats dropping a
 * twenty-eight week expedition over a missing empty list — and every one of
 * these was, at some point, a real save on somebody's machine.
 */
function migrate(expedition: ExpeditionState): ExpeditionState {
  const crew = (expedition.crew ?? []).map((member) => ({
    ...member,
    xp: member.xp ?? 0,
    mentor: member.mentor ?? null,
    // Somebody from before loyalty existed has been getting on with it: start
    // them where a new hire starts rather than at nought.
    loyalty: member.loyalty ?? 7,
    // A crew saved before anybody got on or fell out with anybody.
    bonds: member.bonds ?? [],
  }))
  return {
    ...expedition,
    flags: expedition.flags ?? [],
    marks: expedition.marks ?? [],
    // Without a number here the level becomes NaN on the first week.
    darkeningShift: expedition.darkeningShift ?? 0,
    dials: normaliseDials(expedition.dials),
    heroRecords: { ...blankHeroRecords(), ...(expedition.heroRecords ?? {}) },
    relics: expedition.relics ?? [],
    attention: expedition.attention ?? 0,
    herald: expedition.herald ?? null,
    directives: expedition.directives ?? [],
    directiveCount: expedition.directiveCount ?? 0,
    tally: expedition.tally ?? {
      landingsWon: 0,
      puzzlesSolved: 0,
      researchDone: 0,
      heraldsFaced: 0,
      relicsFound: 0,
    },
    heartRead: expedition.heartRead ?? false,
    watch: expedition.watch ?? {},
    watchFlux: expedition.watchFlux ?? 0,
    proposal: expedition.proposal ?? null,
    subject: expedition.subject ?? null,
    debts: expedition.debts ?? [],
    landingParty: expedition.landingParty ?? [],
    lastCouncil: expedition.lastCouncil ?? 0,
    figures: expedition.figures ?? {},
    pledge: expedition.pledge ?? null,
    tutorial: expedition.tutorial ?? false,
    ashore: expedition.ashore ?? [],
    supportRound: expedition.supportRound ?? -1,
    crew,
    activeMission:
      expedition.activeMission?.k === 'battle'
        ? {
            ...expedition.activeMission,
            // The Bond used to be a constant of the rules rather than a number on
            // the state, so a battle saved before that has none.
            battle: {
              ...expedition.activeMission.battle,
              bondRange: expedition.activeMission.battle.bondRange ?? 2,
              installations: expedition.activeMission.battle.installations ?? [],
              // A battle saved before the site took turns simply has none left.
              site: expedition.activeMission.battle.site ?? [],
              struck: expedition.activeMission.battle.struck ?? {},
              // Units saved before the crew came down with the party have no
              // `kind`. Everything on the hero side back then was a hero.
              // The cast is the honest shape of a migration: what came off disk
              // is whatever an older version wrote, and this line is where it
              // becomes a Unit again.
              units: (expedition.activeMission.battle.units ?? []).map((u: Unit) =>
                u.side === 'hero' && (u as { kind?: string }).kind === undefined
                  ? ({ ...u, kind: 'hero' } as Unit)
                  : u,
              ),
            },
          }
        : expedition.activeMission,
  }
}

export function serialiseSave(state: GameState): string {
  const file: SaveFile = {
    version: SAVE_VERSION,
    // Stamped for the player's benefit only; nothing reads it back.
    savedAt: new Date().toISOString(),
    archive: state.archive,
    expedition: state.expedition,
    room: state.room,
  }
  return JSON.stringify(file, null, 2)
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialiseSave(state))
  } catch {
    // Private browsing, a full quota, a blocked origin — none of them are worth
    // interrupting a game over. The export button is the real safety net.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parseSave(raw)
  } catch {
    return null
  }
}

export function saveDialPreset(dials: Dials): void {
  try {
    localStorage.setItem(DIALS_KEY, JSON.stringify(dials))
  } catch {
    // Same as the save: not worth interrupting a game over.
  }
}

/** The stored preset, or null when there is none. */
export function loadDialPreset(): Dials | null {
  try {
    const raw = localStorage.getItem(DIALS_KEY)
    if (!raw) return null
    return normaliseDials(JSON.parse(raw))
  } catch {
    return null
  }
}

export function clearSave(): void {
  try {
    for (const room of listRooms()) localStorage.removeItem(ROOM_PREFIX + room.code)
    localStorage.removeItem(ROOM_INDEX)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(DIALS_KEY)
    // The player key goes too. It is the one thing that cannot be recovered from
    // the other players, which is exactly why the wipe dialog warns about it.
    localStorage.removeItem(PLAYER_KEY)
  } catch {
    // Nothing to do about it.
  }
}

/** A filename with the week in it, so a folder of exports sorts sensibly. */
export function saveFileName(state: GameState): string {
  const week = state.expedition ? String(state.expedition.week).padStart(2, '0') : 'archive'
  return `stargrave-week-${week}.json`
}

// ------------------------------------------------------------------- rooms
//
// A room code is a filing name as well as an address. Everybody at the table
// keeps their own copy of the game under it, which is what makes "we will finish
// this on Thursday" possible without a server holding anything: on Thursday
// whoever opens the code first is the host, and they seed the room from their own
// copy. The others rejoin and are sent it.

const PLAYER_KEY = 'stargrave.player'
const ROOM_PREFIX = 'stargrave.room.'
const ROOM_INDEX = 'stargrave.rooms'

/** A room in the list of rooms this browser knows about. */
export type RoomRecord = {
  code: string
  mode: string
  players: number
  /** What the table calls it. Empty means the code stands in. */
  name: string
  /** Week the local copy reached, for the "carry on" list. */
  week: number
  savedAt: string
  /** Is there a run in progress in it, or is it only a room? */
  started: boolean
}

/**
 * Who this browser is.
 *
 * Made once and kept for good, across every room. It is what puts somebody back
 * in their own chair, so it is also shown in the lobby with a copy button: a
 * browser can be wiped, and the only thing that cannot be recovered from the
 * others is this.
 */
export function loadPlayer(): PlayerIdentity | null {
  try {
    const raw = localStorage.getItem(PLAYER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PlayerIdentity>
    if (typeof parsed?.key !== 'string' || parsed.key.length < 8) return null
    return { key: parsed.key, name: typeof parsed.name === 'string' ? parsed.name : '' }
  } catch {
    return null
  }
}

export function savePlayer(player: PlayerIdentity): void {
  try {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
  } catch {
    // Same as the save: never worth interrupting a game over.
  }
}

/** This browser's identity, made on the spot if this is the first time. */
export function ensurePlayer(): PlayerIdentity {
  const found = loadPlayer()
  if (found) return found
  const made: PlayerIdentity = { key: newPlayerKey(), name: '' }
  savePlayer(made)
  return made
}

export function saveRoomGame(state: GameState): void {
  const room = state.room
  if (!room) return
  try {
    const file: SaveFile = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      // Not the archive: that is yours, not the table's.
      archive: newArchive(),
      expedition: state.expedition,
      room,
    }
    localStorage.setItem(ROOM_PREFIX + room.code, JSON.stringify(file))
    rememberRoom({
      code: room.code,
      mode: room.mode,
      players: room.seats.length,
      name: room.name ?? '',
      week: state.expedition?.week ?? 0,
      savedAt: file.savedAt,
      started: state.expedition !== null && !state.expedition.outcome,
    })
  } catch {
    // Nothing to do about it.
  }
}

/** What this browser has of a room: the expedition and the seating. */
export function loadRoomGame(
  code: string,
): { expedition: ExpeditionState | null; room: RoomState } | null {
  try {
    const raw = localStorage.getItem(ROOM_PREFIX + code)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SaveFile
    if (!parsed?.room) return null
    return {
      expedition: parsed.expedition ? migrate(parsed.expedition) : null,
      room: parsed.room ? { ...parsed.room, name: parsed.room.name ?? '' } : parsed.room,
    }
  } catch {
    return null
  }
}

/** An index entry from before names existed still has to list. */
function fillRoom(record: Partial<RoomRecord>): RoomRecord {
  return {
    code: String(record.code ?? ''),
    mode: String(record.mode ?? 'solo'),
    players: Number(record.players ?? 1),
    name: typeof record.name === 'string' ? record.name : '',
    week: Number(record.week ?? 0),
    savedAt: String(record.savedAt ?? ''),
    // Absent means it was written before this field existed; those entries were
    // only ever written for a game in progress.
    started: record.started ?? true,
  }
}

export function listRooms(): RoomRecord[] {
  try {
    const raw = localStorage.getItem(ROOM_INDEX)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<RoomRecord>[]
    return Array.isArray(parsed) ? parsed.map(fillRoom).filter((r) => r.code) : []
  } catch {
    return []
  }
}

function rememberRoom(record: RoomRecord): void {
  const rooms = listRooms().filter((r) => r.code !== record.code)
  rooms.unshift(record)
  try {
    localStorage.setItem(ROOM_INDEX, JSON.stringify(rooms.slice(0, 12)))
  } catch {
    // Nothing to do about it.
  }
}

/**
 * Rename a saved run from outside it.
 *
 * The lobby is where a table names its room — but a solo game never sees a
 * lobby, and the whole point of the name is to tell one saved run from another
 * on the title screen. So it is editable from the list as well, and that has to
 * reach both places the name lives: the index the list reads, and the saved room
 * itself, which is what comes back when you carry on.
 */
export function renameSavedRoom(code: string, name: string): void {
  const trimmed = name.trim().slice(0, ROOM_NAME_MAX)
  try {
    const raw = localStorage.getItem(ROOM_PREFIX + code)
    if (raw) {
      const file = JSON.parse(raw) as SaveFile
      if (file.room) {
        file.room = { ...file.room, name: trimmed }
        localStorage.setItem(ROOM_PREFIX + code, JSON.stringify(file))
      }
    }
    const rooms = listRooms().map((r) => (r.code === code ? { ...r, name: trimmed } : r))
    localStorage.setItem(ROOM_INDEX, JSON.stringify(rooms))
  } catch {
    // Nothing to do about it.
  }
}

export function forgetRoom(code: string): void {
  try {
    localStorage.removeItem(ROOM_PREFIX + code)
    localStorage.setItem(ROOM_INDEX, JSON.stringify(listRooms().filter((r) => r.code !== code)))
  } catch {
    // Nothing to do about it.
  }
}
