// Saving and loading.
//
// Automatic saving after every week and every mission, one running expedition,
// no reloading. The weight of decisions is preserved, but you never lose the
// work if you have to stop for the night.
//
// The save also has to be EXPORTABLE to a file. Cleared browser data must not be
// able to take away a twenty-eight week expedition — that would be the one bug
// in the whole game that could not be forgiven.

import { newArchive, ARCHIVE_VERSION } from './archive'
import { normaliseDials } from '../../content/difficulty'
import type { Dials } from '../../content/difficulty'
import type { ArchiveState, ExpeditionState, GameState } from './types'

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
    return { archive: { ...newArchive(), ...archive, version: ARCHIVE_VERSION }, expedition: null }
  }

  // A save written before a field existed is not a broken save; it is an older
  // one. Filling the gaps in beats dropping a twenty-eight week expedition over
  // a missing empty list.
  return {
    archive: { ...newArchive(), ...archive },
    expedition: expedition
      ? {
          ...expedition,
          flags: expedition.flags ?? [],
          marks: expedition.marks ?? [],
          // Without a number here the level becomes NaN on the first week.
          darkeningShift: expedition.darkeningShift ?? 0,
          dials: normaliseDials(expedition.dials),
        }
      : null,
  }
}

export function serialiseSave(state: GameState): string {
  const file: SaveFile = {
    version: SAVE_VERSION,
    // Stamped for the player's benefit only; nothing reads it back.
    savedAt: new Date().toISOString(),
    archive: state.archive,
    expedition: state.expedition,
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
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(DIALS_KEY)
  } catch {
    // Nothing to do about it.
  }
}

/** A filename with the week in it, so a folder of exports sorts sensibly. */
export function saveFileName(state: GameState): string {
  const week = state.expedition ? String(state.expedition.week).padStart(2, '0') : 'archive'
  return `stargrave-week-${week}.json`
}
