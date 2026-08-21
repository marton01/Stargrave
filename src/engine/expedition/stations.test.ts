// Does the right person in the right place actually matter?
//
// The rules say a crew member is "considerably more effective" on the station that
// matches their speciality, and for most stations that was simply not true. The
// strength calculation did give the matching speciality twice the weight — but the
// station formulas divided by three and four, so with one person the difference
// vanished: a navigator in the Sanctum produced exactly what a medic did, and the
// Lab did not look at the speciality at all.
//
// This test walks every station and insists on the promise, which is the only way
// it stays true the next time a formula is tuned.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import {
  archiveOutput,
  armouryOutput,
  bridgeOutput,
  forgeOutput,
  labOutput,
  medbayOutput,
  sanctumOutput,
  sensorOutput,
  startExpedition,
  stationStrength,
} from './expedition'
import { STATIONS, STATION_ORDER } from '../../content/ship'
import type { CrewSpeciality } from '../../content/crew'
import type { StationId } from '../../content/ship'
import type { ExpeditionState } from './types'

/** Output of a station, whatever shape it takes. */
const OUTPUT: Record<StationId, (s: ExpeditionState) => number> = {
  bridge: bridgeOutput,
  lab: labOutput,
  archive: archiveOutput,
  sensors: sensorOutput,
  forge: forgeOutput,
  armoury: armouryOutput,
  medbay: medbayOutput,
  sanctum: sanctumOutput,
}

/**
 * A ship with exactly one crew member on one station, of the speciality asked
 * for, and enough power everywhere for the station to run.
 */
function staffed(station: StationId, speciality: CrewSpeciality): ExpeditionState {
  const s = startExpedition(1, 'medium', newArchive())
  for (const member of s.crew) member.station = null
  // No traits, or the comparison would be measuring luck.
  const worker = s.crew[0]!
  worker.speciality = speciality
  worker.traits = []
  worker.station = station
  for (const id of Object.keys(s.power) as (keyof typeof s.power)[]) s.power[id] = 1
  return s
}

/** A speciality that is not the one this station wants. */
function mismatchFor(station: StationId): CrewSpeciality {
  const wanted = STATIONS[station].speciality
  const options: CrewSpeciality[] = ['engineer', 'scientist', 'guard', 'medic', 'navigator']
  return options.find((o) => o !== wanted)!
}

describe('the right speciality in the right place', () => {
  it('counts double in the strength of every station', () => {
    for (const station of STATION_ORDER) {
      const matched = staffed(station, STATIONS[station].speciality)
      const other = staffed(station, mismatchFor(station))
      expect(stationStrength(matched, station), station).toBeGreaterThan(
        stationStrength(other, station),
      )
    }
  })

  it('produces more than a body from another speciality', () => {
    const excused: StationId[] = [
      // The Sensors reveal what the power says and take no skill: one pair of
      // hands is one pair of hands. Documented rather than pretended otherwise.
      'sensors',
    ]

    for (const station of STATION_ORDER) {
      if (excused.includes(station)) continue
      const wanted = STATIONS[station].speciality
      const matched = OUTPUT[station](staffed(station, wanted))
      const other = OUTPUT[station](staffed(station, mismatchFor(station)))
      expect(
        matched,
        `${station}: a ${wanted} produces ${matched}, a ${mismatchFor(station)} produces ${other}`,
      ).toBeGreaterThan(other)
    }
  })

  it('gives every station something for a second pair of hands', () => {
    for (const station of STATION_ORDER) {
      if (STATIONS[station].slots < 2 || station === 'sensors') continue
      const one = staffed(station, STATIONS[station].speciality)
      const two = staffed(station, STATIONS[station].speciality)
      const helper = two.crew[1]!
      helper.speciality = STATIONS[station].speciality
      helper.traits = []
      helper.station = station
      expect(OUTPUT[station](two), `${station}: two ${STATIONS[station].speciality}s`).toBeGreaterThan(
        OUTPUT[station](one),
      )
    }
  })
})

describe('what the numbers actually are', () => {
  // Pinned so a later tuning pass has to notice it is changing the balance the
  // game was played at, not just the shape of a formula.
  it('gives a matching specialist at one power the values the game was tuned for', () => {
    expect(labOutput(staffed('lab', 'scientist'))).toBe(2)
    expect(forgeOutput(staffed('forge', 'engineer'))).toBe(2)
    expect(medbayOutput(staffed('medbay', 'medic'))).toBe(2)
    expect(sanctumOutput(staffed('sanctum', 'medic'))).toBe(2)
    expect(bridgeOutput(staffed('bridge', 'navigator'))).toBe(1)
  })

  it('gives a mismatched body less of everything', () => {
    expect(labOutput(staffed('lab', 'medic'))).toBe(1)
    expect(forgeOutput(staffed('forge', 'medic'))).toBe(1)
    expect(medbayOutput(staffed('medbay', 'navigator'))).toBe(1)
    expect(sanctumOutput(staffed('sanctum', 'navigator'))).toBe(1)
    // And on the Bridge, nothing at all: only a navigator saves fuel.
    expect(bridgeOutput(staffed('bridge', 'medic'))).toBe(0)
  })
})
