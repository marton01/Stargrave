// What the current allocation actually buys, in words.
//
// The ship screen used to show only how many pips were lit. That is enough to
// see *that* a system has power and no help at all in deciding whether a fourth
// point is worth taking from somewhere else — the question the whole screen
// exists to ask.
//
// Every number here comes from the engine helper the weekly turn itself uses, so
// this can restate the rules but never invent them.

import {
  archiveOutput,
  armouryOutput,
  bridgeOutput,
  forgeOutput,
  labOutput,
  lifeSupportStatus,
  medbayOutput,
  missionFlux,
  sanctumOutput,
  sensorOutput,
  shieldMitigation,
  travelFuel,
  travelWeeks,
  weeklyFromModules,
} from '../engine/expedition/expedition'
import type { ExpeditionState } from '../engine/expedition/types'
import type { StationId, SystemId } from '../content/ship'
import type { Lang } from '../engine/types'

/** One line: what this system is doing right now. `warn` if it is not enough. */
export type PowerYield = { text: string; warn?: boolean }

export function describeSystemYield(
  s: ExpeditionState,
  system: SystemId,
  lang: Lang,
): PowerYield {
  const hu = lang === 'hu'
  switch (system) {
    case 'lifeSupport': {
      const { has, needs } = lifeSupportStatus(s)
      if (has < needs) {
        return {
          text: hu
            ? `${has} / ${needs} — kevés: morál −2 hetente, és a legénység is fogyhat`
            : `${has} of ${needs} — not enough: morale −2 a week, and the crew can start dying`,
          warn: true,
        }
      }
      return {
        text: hu
          ? `${has} / ${needs} — elég. Ennél több semmit nem ad; a fölösleg máshol kell.`
          : `${has} of ${needs} — enough. More does nothing here; the surplus is needed elsewhere.`,
      }
    }

    case 'engines': {
      const two = travelWeeks(s, 2)
      const three = travelWeeks(s, 3)
      const burn = travelFuel(s)
      const made = weeklyFromModules(s, 'fuel')
      const net = Math.max(0, burn - made)
      return {
        text: hu
          ? `Egy 2 hetes út ${two} hét, egy 3 hetes ${three} hét — és ${burn} üzemanyag megy el ` +
            `hetente útközben${made > 0 ? `, amiből a szintetizáló ${made}-et kiegyenlít: nettó ${net}` : ''}. ` +
            'Minden pont az első fölött egy hetet vág le, a második fölött viszont egy üzemanyagot ' +
            'hozzátesz: a lényeg a kettő szorzata.'
          : `A two-week road takes ${two}, a three-week road ${three} — and ${burn} fuel goes a week ` +
            `while under way${made > 0 ? `, of which the synthesiser offsets ${made}: ${net} net` : ''}. ` +
            'Every point above the first cuts a week; every point above the second adds a unit of ' +
            'fuel. What matters is the two multiplied.',
      }
    }

    case 'shields': {
      const value = shieldMitigation(s)
      return {
        text: hu
          ? `${value} hajótest-kockázatot fog fel a találkozásokon; néhány döntés pajzsszintet is kér.`
          : `Absorbs ${value} hull risk in encounters; some choices also ask for a shield level.`,
      }
    }

    case 'lab': {
      const value = labOutput(s)
      return value > 0
        ? {
            text: hu
              ? `+${value} információ hetente (1 alap + ${s.power.lab} energia + a labor legénysége)`
              : `+${value} information a week (1 base + ${s.power.lab} power + the lab crew)`,
          }
        : { text: hu ? 'Áll: energia és ember is kell hozzá.' : 'Idle: it needs power and hands.', warn: true }
    }

    case 'forge': {
      const value = forgeOutput(s)
      return value > 0
        ? {
            text: hu
              ? `+${value} hajótest hetente. Az energia és a legénység együtt számít, félpontonként.`
              : `+${value} hull a week. Power and crew count together, half a point each.`,
          }
        : { text: hu ? 'Áll: energia és ember is kell hozzá.' : 'Idle: it needs power and hands.', warn: true }
    }

    case 'sensors': {
      const value = sensorOutput(s)
      return value > 0
        ? {
            text: hu
              ? `${value} oszlopot fed fel előre a csillagtérképen, hetente.`
              : `Reveals ${value} columns ahead on the star map, every week.`,
          }
        : {
            text: hu
              ? 'Vakon utazol: a csomópontok kérdőjelek maradnak.'
              : 'You travel blind: the nodes stay question marks.',
          }
    }

    case 'runeCore': {
      const value = missionFlux(s)
      return {
        text: hu
          ? `${value} Fluxussal indul a partraszálló csapat — ebből fizetik a lapok árcédulás (◈) feleit.`
          : `The landing party starts with ${value} Flux — what the expensive card halves cost.`,
      }
    }
  }
}

/** What a station is producing right now, given its power and its people. */
export function describeStationYield(
  s: ExpeditionState,
  station: StationId,
  lang: Lang,
): string | null {
  const hu = lang === 'hu'
  switch (station) {
    case 'lab': {
      const v = labOutput(s)
      return v > 0 ? (hu ? `+${v} információ/hét` : `+${v} information a week`) : null
    }
    case 'forge': {
      const v = forgeOutput(s)
      return v > 0 ? (hu ? `+${v} hajótest/hét` : `+${v} hull a week`) : null
    }
    case 'medbay': {
      const v = medbayOutput(s)
      return v > 0 ? (hu ? `+${v} életerő hősönként/hét` : `+${v} hit points per hero a week`) : null
    }
    case 'archive': {
      const v = archiveOutput(s)
      return v > 0 ? (hu ? `${v} hét kutatás hetente` : `${v} weeks of research a week`) : null
    }
    case 'bridge': {
      const v = bridgeOutput(s)
      return v > 0 ? (hu ? `−${v} üzemanyag útközben` : `−${v} fuel while under way`) : null
    }
    case 'sanctum': {
      const v = sanctumOutput(s)
      // Named as a target on purpose: morale walks one step a week towards it, so
      // "+2" here is not "+2 morale this week".
      return v > 0
        ? hu
          ? `+${v} a morál-célhoz (a morál hetente 1 lépést tesz a cél felé)`
          : `+${v} to the morale target (morale moves one step a week towards it)`
        : null
    }
    case 'armoury': {
      const v = armouryOutput(s)
      return v > 0 ? (hu ? `+${v} Fluxus a csapatnak` : `+${v} Flux for the party`) : null
    }
    case 'sensors': {
      const v = sensorOutput(s)
      return v > 0 ? (hu ? `${v} oszlop felfedve/hét` : `${v} columns revealed a week`) : null
    }
  }
  return null
}
