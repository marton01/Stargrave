// Rendering expedition log events into text.
//
// Same principle as the battle log: the engine only ever stores structured
// events, so switching language rewrites the whole record of the run — including
// the week-three lines you read in the other language.

import { dialDef } from '../content/difficulty'
import { RESOURCES, STATIONS } from '../content/ship'
import { pick } from './ui'
import type { Lang } from '../engine/types'
import type { ExpeditionEvent } from '../engine/expedition/types'

export function describeExpeditionEvent(event: ExpeditionEvent, lang: Lang): string {
  const hu = lang === 'hu'

  switch (event.k) {
    case 'expeditionStart':
      return hu
        ? `Átmentünk a Kapun. ${event.weeks} hét, aztán bezárul.`
        : `We are through the Gate. ${event.weeks} weeks, then it closes.`

    case 'darkeningEased':
      return hu
        ? `A Sötétedés visszalépett a ${event.level}. szintre. A reaktor többet ad, és odalent minden enged egy kicsit.`
        : `The Darkening has fallen back to level ${event.level}. The reactor gives more, and everything below eases a little.`

    case 'missionRestarted':
      return hu
        ? 'Újrakezdtük a partraszállást. Ugyanaz a helyszín, elölről.'
        : 'We started the landing again. The same ground, from the beginning.'

    case 'missionRerolled':
      return hu
        ? 'Új helyszínt kaptunk ugyanarra a feladatra — az előző nem volt bejárható.'
        : 'A different site for the same task — the last one could not be crossed.'

    case 'missionWithdrawn':
      return hu
        ? 'Visszaléptünk a partraszállás előttre. A helyszín érintetlen.'
        : 'We pulled back to before the landing. The site is untouched.'

    case 'storageFull':
      return hu
        ? `${pick(RESOURCES[event.id].name, lang)}: a tároló tele (${event.max}), ${event.lost} elveszett.`
        : `${pick(RESOURCES[event.id].name, lang)}: the hold is full (${event.max}), ${event.lost} lost.`

    case 'dialSet': {
      const dial = dialDef(event.dial)
      const level = dial.levels[event.level - 1]
      return hu
        ? `Nehézség — ${pick(dial.name, lang)}: ${pick(level!.text, lang)}`
        : `Difficulty — ${pick(dial.name, lang)}: ${pick(level!.text, lang)}`
    }

    case 'boardingDamage':
      return hu
        ? 'Végigmentek a hajón. A hajótest megsérült — a pajzs és a vértek annyit fogtak fel, amennyit tudtak.'
        : 'They went through the ship. The hull is damaged — shields and wards took what they could.'

    case 'missionSkipped':
      return hu
        ? 'A partraszállást kihagytuk. Se zsákmány, se veszteség — a helyszín lezárva.'
        : 'The landing was skipped. No spoils and no losses — the site is closed.'

    case 'missionForcedWin':
      return hu
        ? 'A partraszállást teljesítettként számoltuk el, harc nélkül.'
        : 'The landing was booked as completed, without the fight.'

    case 'missionForcedLoss':
      return hu
        ? 'A partraszállást feladtuk. Úgy fizetünk érte, mint egy vereségért.'
        : 'The landing was given up. It is paid for like a defeat.'

    case 'gateShifted':
      return hu
        ? event.amount >= 0
          ? `A Kapu tovább tart nyitva: ${event.amount} héttel. ${event.left} hét van még.`
          : `A Kapu hamarabb zárul: ${-event.amount} héttel. ${event.left} hét van még.`
        : event.amount >= 0
          ? `The Gate holds ${event.amount} weeks longer. ${event.left} weeks left.`
          : `The Gate closes ${-event.amount} weeks sooner. ${event.left} weeks left.`

    case 'weekPassed':
      return hu
        ? `${event.week}. hét. A Kapu ${event.gateLeft} hét múlva zárul.`
        : `Week ${event.week}. The Gate closes in ${event.gateLeft} weeks.`

    case 'darkeningRose':
      return hu
        ? `A Sötétedés a ${event.level}. szintre lépett. A reaktor kevesebbet ad, és odalent minden erősebb.`
        : `The Darkening has risen to level ${event.level}. The reactor gives less, and everything below is stronger.`

    case 'resourceGain':
      return `${pick(RESOURCES[event.id].name, lang)} +${event.amount}`

    case 'resourceLoss':
      return `${pick(RESOURCES[event.id].name, lang)} −${event.amount}`

    case 'lifeSupportStrained':
      return hu
        ? 'Az életfenntartás nem elég ennyi emberre. A levegő nehéz, és mindenki tudja.'
        : 'Life support cannot carry this many people. The air is heavy, and everybody knows it.'

    case 'starving':
      return hu
        ? 'Elfogyott az élelem. A fejadagot felezni kell, és ezt nem lehet sokáig.'
        : 'The food has run out. Rations are halved, and that cannot last.'

    case 'moraleCollapse':
      return hu ? 'A legénység nem dolgozik tovább.' : 'The crew has stopped working.'

    case 'crewLost':
      return hu ? `${event.name} nincs többé.` : `${event.name} is gone.`

    case 'crewJoined':
      return hu ? `${event.name} beszállt.` : `${event.name} has come aboard.`

    case 'stationRan':
      return hu
        ? `${pick(STATIONS[event.station].name, lang)}: elvégezte a heti munkát.`
        : `${pick(STATIONS[event.station].name, lang)}: this week's work is done.`

    case 'researchStarted':
      return hu
        ? `Kutatás indult: ${pick(event.project, lang)}`
        : `Research begun: ${pick(event.project, lang)}`

    case 'researchDone':
      return hu
        ? `Kutatás kész: ${pick(event.project, lang)}`
        : `Research complete: ${pick(event.project, lang)}`

    case 'moduleInstalled':
      return hu
        ? `Beépítve: ${pick(event.module, lang)}`
        : `Installed: ${pick(event.module, lang)}`

    case 'courseSet':
      return hu
        ? `Irány ${event.node}. Az út ${event.weeks} hét.`
        : `Course set for ${event.node}. The trip is ${event.weeks} weeks.`

    case 'arrived':
      return hu ? `Megérkeztünk: ${event.node}` : `Arrived: ${event.node}`

    case 'noFuel':
      return hu
        ? 'Nincs üzemanyag. A hajó sodródik, és az ugrás egy hetet késik.'
        : 'Out of fuel. The ship drifts, and the jump is a week late.'

    case 'missionLaunched':
      return pick(event.briefing, lang)

    case 'missionWon':
      return hu ? 'A küldetés sikerült.' : 'The mission succeeded.'

    case 'missionLost':
      return hu
        ? 'A csapatot fel kellett húzni. Sebek, elmaradt zsákmány, elvesztett hét.'
        : 'The party had to be pulled back. Wounds, lost loot, a lost week.'

    case 'puzzleSolved':
      return hu ? 'A szerkezet kinyílt.' : 'The mechanism has opened.'

    case 'puzzleFailed':
      return hu
        ? 'A szerkezet nem nyílt ki. Otthagytuk.'
        : 'The mechanism did not open. We left it.'

    case 'encounterChoice':
      return pick(event.result, lang)

    case 'cardsSacrificed':
      return hu
        ? `${event.count} lap véglegesen elveszett.`
        : `${event.count} cards are lost forever.`

    case 'understandingGained':
      return hu
        ? `Megértés +${event.amount} (összesen ${event.total}).`
        : `Understanding +${event.amount} (total ${event.total}).`

    case 'mapRevealed':
      return hu
        ? `Az érzékelők ${event.columns} oszlopot felfedtek előre.`
        : `The sensors revealed ${event.columns} columns ahead.`

    case 'bought':
      return hu
        ? `Vásárolva: ${pick(event.label, lang)} (${event.price} kredit).`
        : `Bought: ${pick(event.label, lang)} (${event.price} credits).`

    case 'gateClosing':
      return hu
        ? `A Kapu ${event.weeksLeft} hét múlva bezárul.`
        : `The Gate closes in ${event.weeksLeft} weeks.`

    case 'reachedHeart':
      return hu
        ? 'Ott vagyunk. A Csillagsír előttünk van, és nem úgy néz ki, ahogy vártuk.'
        : 'We are here. The Stargrave is in front of us, and it does not look the way we expected.'
  }
}
