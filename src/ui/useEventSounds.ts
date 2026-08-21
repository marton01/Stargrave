// Sound driven by the log, not by the click.
//
// The log already is the honest record of what happened — every hit, every lost
// crew member, every solved puzzle passes through it. So the sound layer reads
// the same events instead of being sprinkled through the interface, which means
// it can never claim something the log does not.
//
// If no audio files are present this hook does nothing at all: see `assets.ts`.

import { useEffect, useRef } from 'react'
import { playSfx, type SfxName } from './assets'
import type { ExpeditionState } from '../engine/expedition/types'
import type { ExpeditionEvent } from '../engine/expedition/types'
import type { LogEvent } from '../engine/types'

function battleSound(event: LogEvent): SfxName | null {
  switch (event.k) {
    case 'damage':
    case 'trapTriggered':
    case 'floorGaveWay':
      return 'hit'
    case 'shieldAbsorbed':
    case 'shieldGained':
      return 'shielded'
    case 'defeated':
    case 'exhausted':
      return 'defeated'
    case 'healed':
      return 'heal'
    case 'rested':
      return 'rest'
    case 'relicPicked':
    case 'relicsComplete':
    case 'exitReached':
      return 'relic'
    case 'victory':
      return 'missionWon'
    case 'defeat':
      return 'missionLost'
    default:
      return null
  }
}

function expeditionSound(event: ExpeditionEvent): SfxName | null {
  switch (event.k) {
    case 'weekPassed':
      return 'week'
    case 'researchDone':
    case 'moduleInstalled':
    case 'understandingGained':
      return 'research'
    case 'puzzleSolved':
      return 'puzzleSolved'
    case 'missionWon':
      return 'missionWon'
    case 'missionLost':
    case 'puzzleFailed':
    case 'crewLost':
    case 'moraleCollapse':
      return 'missionLost'
    case 'reachedHeart':
      return 'ending'
    default:
      return null
  }
}

/** Play a sound for whatever has just been written to either log. */
export function useEventSounds(expedition: ExpeditionState | null): void {
  const mission = expedition?.activeMission
  const battleLog = mission?.k === 'battle' ? mission.battle.log : null
  const expeditionLog = expedition?.log ?? null
  const seen = useRef({ battle: 0, expedition: 0 })

  useEffect(() => {
    // A log can get shorter two ways: a fresh mission starts a fresh one, or a
    // move was taken back. Neither is a reason to make a noise — what is left
    // has either already been heard or never happened — so the mark moves to
    // where the log now ends and nothing is played.
    const length = battleLog?.length ?? 0
    if (length < seen.current.battle) {
      seen.current.battle = length
      return
    }
    if (!battleLog || length === seen.current.battle) return
    const fresh = battleLog.slice(seen.current.battle)
    seen.current.battle = length
    // One sound per kind per burst: a fireball that hits three enemies is one
    // sound, not three overlapping copies of the same file.
    const sounds = new Set<SfxName>()
    for (const entry of fresh) {
      const sound = battleSound(entry.event)
      if (sound) sounds.add(sound)
    }
    for (const sound of sounds) playSfx(sound)
  }, [battleLog])

  useEffect(() => {
    const length = expeditionLog?.length ?? 0
    if (length < seen.current.expedition) {
      seen.current.expedition = length
      return
    }
    if (!expeditionLog || length === seen.current.expedition) return
    const fresh = expeditionLog.slice(seen.current.expedition)
    seen.current.expedition = length
    const sounds = new Set<SfxName>()
    for (const entry of fresh) {
      const sound = expeditionSound(entry.event)
      if (sound) sounds.add(sound)
    }
    for (const sound of sounds) playSfx(sound)
  }, [expeditionLog])
}
