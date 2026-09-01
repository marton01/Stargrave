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
  crewStrengthAt,
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
import { CREW_TRAITS } from '../../content/crew'
import type { CrewSpeciality, CrewTraitId } from '../../content/crew'
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
    // No exceptions any more. The Sensors used to be one: the columns came from
    // the power and the person only switched the instrument on, which made it the
    // odd column out in the posting table and one more thing to explain.
    for (const station of STATION_ORDER) {
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

// ---------------------------------------------------------------------------
// The tester's spreadsheet.
//
// Somebody sat down and filled in a table by hand — five specialities down the
// side, eight stations across the top — and the table said things like "the
// engineer gives 2 Information a week in the Lab and the scientist also gives 2",
// "the engineer raises the morale target by 2 in the Sanctum", and "two
// navigators on the same station give different numbers". Their note ended:
// "in short, this is complicated".
//
// It was one bug: the station traits were being added on EVERY station rather
// than on the one the person's speciality is at home on. So a veteran engineer
// was a better scientist than a scientist, and a *restless* engineer — whose
// whole thing is that morale suffers for it — was the best possible posting for
// the Sanctum.
//
// These two tests are that table, kept honest from now on.

describe('the whole speciality × station table', () => {
  const SPECIALITIES: CrewSpeciality[] = ['engineer', 'scientist', 'guard', 'medic', 'navigator']

  /** Every trait combination worth trying: none, each one alone, and a pair. */
  const TRAIT_SETS: CrewTraitId[][] = [
    [],
    ...(Object.keys(CREW_TRAITS) as CrewTraitId[]).map((id) => [id]),
    ['veteran', 'restless'],
    ['young', 'sceptical'],
  ]

  function staffedWith(
    station: StationId,
    speciality: CrewSpeciality,
    traits: CrewTraitId[],
  ): ExpeditionState {
    const s = staffed(station, speciality)
    s.crew[0]!.traits = traits
    return s
  }

  it('is always won by the speciality the station is for', () => {
    for (const station of STATION_ORDER) {
      const wanted = STATIONS[station].speciality
      const best = OUTPUT[station](staffedWith(station, wanted, []))

      for (const speciality of SPECIALITIES) {
        if (speciality === wanted) continue
        for (const traits of TRAIT_SETS) {
          const other = OUTPUT[station](staffedWith(station, speciality, traits))
          expect(
            other,
            `${station}: a ${speciality} with [${traits.join(', ')}] produces ${other}, ` +
              `the ${wanted} it is for produces ${best}`,
          ).toBeLessThanOrEqual(best)
        }
      }
    }
  })

  it('never lets a trait help somebody on a station that is not theirs', () => {
    for (const station of STATION_ORDER) {
      const wanted = STATIONS[station].speciality
      for (const speciality of SPECIALITIES) {
        if (speciality === wanted) continue
        const plain = crewStrengthAt(staffedWith(station, speciality, []).crew[0]!, station)
        for (const traits of TRAIT_SETS) {
          const withTraits = crewStrengthAt(
            staffedWith(station, speciality, traits).crew[0]!,
            station,
          )
          expect(
            withTraits,
            `${station}: [${traits.join(', ')}] changed a ${speciality}'s strength`,
          ).toBe(plain)
        }
      }
    }
  })

  it('does let a trait help on the station that is theirs', () => {
    // The other half of the rule: a veteran on their own station is worth more
    // than a plain specialist, or the trait says nothing at all.
    const plain = crewStrengthAt(staffedWith('lab', 'scientist', []).crew[0]!, 'lab')
    const veteran = crewStrengthAt(staffedWith('lab', 'scientist', ['veteran']).crew[0]!, 'lab')
    const green = crewStrengthAt(staffedWith('lab', 'scientist', ['young']).crew[0]!, 'lab')
    expect(veteran).toBeGreaterThan(plain)
    expect(green).toBeLessThan(plain)
  })
})
