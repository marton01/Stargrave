// Turning engine data into player-visible text.
//
// The engine only ever stores structured events and prompts, so switching
// language rewrites the whole battle log — including lines written many rounds
// ago. That is the entire reason the log is not plain strings.

import { STATUS_NAMES } from '../content/statuses'
import { pick, ui } from './ui'
import type { Lang, LogEvent, PendingPrompt } from '../engine/types'

export function describePrompt(prompt: PendingPrompt, lang: Lang): string {
  const t = ui(lang)
  switch (prompt.k) {
    case 'pickAttackTarget':
      return t.promptAttackTarget(prompt.power, prompt.range)
    case 'pickAreaCentre':
      return t.promptAreaCentre(prompt.power, prompt.radius)
    case 'pickMoveDestination':
      return t.promptMoveDestination(prompt.distance)
    case 'pickStatusTarget':
      return t.promptStatusTarget(prompt.range)
    case 'pickPillarTile':
      return t.promptPillarTile
    case 'pickTrapTile':
      return t.promptTrapTile
    case 'pickCardToRecover':
      return t.promptRecoverCard
    case 'pickCardToEcho':
      return t.promptEchoCard
  }
}

export function describeLogEvent(event: LogEvent, lang: Lang): string {
  const hu = lang === 'hu'

  switch (event.k) {
    case 'battleStart':
      return hu
        ? 'A partraszálló csapat leért. Az ereklye valahol itt van.'
        : 'The landing party is down. The relic is somewhere here.'

    case 'damage': {
      const attacker = event.attacker ? pick(event.attacker, lang) : hu ? 'Valami' : 'Something'
      const target = pick(event.target, lang)
      return hu
        ? `${attacker} → ${target}: ${event.amount} sebzés.`
        : `${attacker} → ${target}: ${event.amount} damage.`
    }

    case 'shieldAbsorbed':
      return hu
        ? `${pick(event.target, lang)}: a Vért felfogta a találatot.`
        : `${pick(event.target, lang)}: Shield absorbed the hit.`

    case 'defeated':
      return hu ? `${pick(event.unit, lang)} elesett.` : `${pick(event.unit, lang)} has fallen.`

    case 'runeMarkReward':
      return hu
        ? 'A Rúnajel visszaadta az energiát: +1 Fluxus.'
        : 'The Rune Mark returned its energy: +1 Flux.'

    case 'trapTriggered':
      return hu
        ? `${pick(event.unit, lang)} csapdára lépett!`
        : `${pick(event.unit, lang)} stepped on a trap!`

    case 'trapPlaced':
      return hu
        ? `Csapda felállítva (${event.power} sebzés).`
        : `Trap set (${event.power} damage).`

    case 'pillarRaised':
      return hu
        ? 'Rúnaoszlop emelkedett ki a padlóból.'
        : 'A rune pillar rose out of the floor.'

    case 'shieldGained':
      return hu
        ? `${pick(event.unit, lang)}: Vért +${event.amount}.`
        : `${pick(event.unit, lang)}: Shield +${event.amount}.`

    case 'healed':
      return hu
        ? `${pick(event.unit, lang)}: +${event.amount} életerő.`
        : `${pick(event.unit, lang)}: +${event.amount} hit points.`

    case 'statusApplied':
      return `${pick(event.unit, lang)}: ${pick(STATUS_NAMES[event.status], lang)}.`

    case 'fluxGained':
      return hu
        ? `+${event.amount} Fluxus (közös készlet: ${event.total}).`
        : `+${event.amount} Flux (shared pool: ${event.total}).`

    case 'fluxSpent':
      return hu
        ? `${pick(event.card, lang)}: -${event.amount} Fluxus (marad ${event.remaining}).`
        : `${pick(event.card, lang)}: -${event.amount} Flux (${event.remaining} left).`

    case 'fluxDrained':
      return hu
        ? `${pick(event.unit, lang)} elszívott ${event.amount} Fluxust.`
        : `${pick(event.unit, lang)} drained ${event.amount} Flux.`

    case 'cardRecovered':
      return hu
        ? `${pick(event.unit, lang)} visszavette: ${pick(event.card, lang)}.`
        : `${pick(event.unit, lang)} took back: ${pick(event.card, lang)}.`

    case 'echoReplay':
      return hu
        ? `Visszhang: ${pick(event.card, lang)} felső fele újra lefut.`
        : `Echo: the top half of ${pick(event.card, lang)} runs again.`

    case 'noValidTarget':
      return hu
        ? 'Nincs érvényes cél — a hatás elmarad.'
        : 'No valid target — the effect is lost.'

    case 'areaHitNothing':
      return hu ? 'A területhatás senkit nem érte el.' : 'The area effect reached nobody.'

    case 'nobodyInRange':
      return hu
        ? `${pick(event.unit, lang)} nem ér el senkit.`
        : `${pick(event.unit, lang)} cannot reach anyone.`

    case 'cannotMove':
      return hu
        ? `${pick(event.unit, lang)} nem tud elmozdulni.`
        : `${pick(event.unit, lang)} cannot move.`

    case 'anchoredInPlace':
      return hu
        ? `${pick(event.unit, lang)} a Horgony miatt nem tud elmozdulni.`
        : `${pick(event.unit, lang)} cannot move because of Anchor.`

    case 'proneNoMove':
      return hu
        ? `${pick(event.unit, lang)} ledöntve, nem mozdul.`
        : `${pick(event.unit, lang)} is prone and does not move.`

    case 'enemyIntent':
      return `${pick(event.unit, lang)}: ${pick(event.intent, lang)}`

    case 'rested':
      return hu
        ? `${pick(event.unit, lang)} pihen. Véglegesen elveszett: ${pick(event.lostCard, lang)}.`
        : `${pick(event.unit, lang)} rests. Lost forever: ${pick(event.lostCard, lang)}.`

    case 'restSkipsTurn':
      return hu
        ? `${pick(event.unit, lang)} pihen, kihagyja a kört.`
        : `${pick(event.unit, lang)} is resting and skips the turn.`

    case 'exhausted':
      return hu
        ? `${pick(event.unit, lang)} kifáradt, és ki kellett vinni a csatából.`
        : `${pick(event.unit, lang)} is exhausted and had to be carried out.`

    case 'relicPicked':
      return hu
        ? `${pick(event.unit, lang)} felvett egy ereklyét.${event.remaining > 0 ? ` Még ${event.remaining} kell.` : ''}`
        : `${pick(event.unit, lang)} picked up a relic.${event.remaining > 0 ? ` ${event.remaining} to go.` : ''}`

    case 'relicsComplete':
      return hu
        ? 'Minden ereklye megvan. Vissza a kimenekítési ponthoz!'
        : 'Every relic is in hand. Back to the extraction point!'

    case 'exitReached':
      return hu
        ? `${pick(event.unit, lang)} kiért. A csapat elhagyja a helyszínt.`
        : `${pick(event.unit, lang)} reached the extraction point. The party is out.`

    case 'floorGaveWay':
      return hu
        ? 'A padló beszakadt — ott már nincs átjárás.'
        : 'The floor gave way — there is no crossing there now.'

    case 'floorAboutToGive':
      return hu
        ? 'Recseg a padló. A következő kör végén beszakad.'
        : 'The floor is groaning. It gives way at the end of the next round.'

    case 'reinforcements':
      return hu
        ? `Erősítés érkezett: ${event.count}.`
        : `Reinforcements arrived: ${event.count}.`

    case 'heldGround':
      return hu ? 'Megtartottátok a pontot.' : 'You held the ground.'

    case 'lostGround':
      return hu ? 'A pont nem a tiétek maradt.' : 'The ground was not yours in the end.'

    case 'outOfTime':
      return hu ? 'Kifutottatok az időből.' : 'You ran out of time.'

    case 'victory':
      return hu
        ? 'Minden ellenség elesett. A helyszín a tiétek.'
        : 'Every enemy has fallen. The site is yours.'

    case 'defeat':
      return hu
        ? 'A csapatot fel kellett húzni a hajóra. A küldetés meghiúsult.'
        : 'The party had to be pulled back to the ship. The mission failed.'
  }
}
