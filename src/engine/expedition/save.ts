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
import type { ArchiveState, ExpeditionState, GameState } from './types'

export const SAVE_VERSION = 1
const STORAGE_KEY = 'stargrave.save'

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

  return { archive, expedition }
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

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do about it.
  }
}

/** A filename with the week in it, so a folder of exports sorts sensibly. */
export function saveFileName(state: GameState): string {
  const week = state.expedition ? String(state.expedition.week).padStart(2, '0') : 'archive'
  return `stargrave-week-${week}.json`
}
