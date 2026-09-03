// Turning engine data into player-visible text.
//
// The engine only ever stores structured events and prompts, so switching
// language rewrites the whole battle log — including lines written many rounds
// ago. That is the entire reason the log is not plain strings.

import { STATUS_NAMES } from '../content/statuses'
import { pick, ui } from './ui'
import type { Lang, LogEvent, PendingPrompt, SiteEventKind } from '../engine/types'

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
        ? 'A Rúnajel visszaadta az energiát: +1 Töltet.'
        : 'The Rune Mark returned its energy: +1 Flux.'

    case 'trapTriggered':
      return hu
        ? `${pick(event.unit, lang)} csapdára lépett!`
        : `${pick(event.unit, lang)} stepped on a trap!`

    case 'trapPlaced':
      return hu
        ? `Csapda felállítva (${event.power} sebzés).`
        : `Trap set (${event.power} damage).`

    case 'installationHit':
      return hu
        ? `${pick(event.module, lang)}: rongálják. Még ${event.hp} életereje van.`
        : `${pick(event.module, lang)}: they are tearing it apart. ${event.hp} hit points left.`

    case 'installationLost':
      return hu
        ? `${pick(event.module, lang)} elpusztult. Az expedíció hátralévő részében nincs meg.`
        : `${pick(event.module, lang)} is destroyed. It is gone for the rest of the expedition.`

    case 'terrainEdited':
      return hu
        ? 'A terepet kézzel módosítottuk. (Javítás, nem lépés.)'
        : 'The ground was edited by hand. (A repair, not a move.)'

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
        ? `+${event.amount} Töltet (közös készlet: ${event.total}).`
        : `+${event.amount} Flux (shared pool: ${event.total}).`

    case 'fluxSpent':
      return hu
        ? `${pick(event.card, lang)}: −${event.amount} Töltet (marad ${event.remaining}).`
        : `${pick(event.card, lang)}: -${event.amount} Flux (${event.remaining} left).`

    case 'fluxDrained':
      return hu
        ? `${pick(event.unit, lang)} elszívott ${event.amount} Töltetet.`
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

    // The crew, on the ground. Every line names the person on purpose: what is
    // down there is somebody off the ship's list.
    case 'followerJoins':
      return hu
        ? `${pick(event.unit, lang)} lejött ${pick(event.mentor, lang)} mellett.`
        : `${pick(event.unit, lang)} came down at ${pick(event.mentor, lang)}’s side.`

    case 'followerGuards':
      return hu
        ? `${pick(event.unit, lang)} ${pick(event.target, lang)} elé állt: Vért 1.`
        : `${pick(event.unit, lang)} stepped in front of ${pick(event.target, lang)}: Shield 1.`

    case 'followerMoves':
      return hu
        ? `${pick(event.unit, lang)} odébb ment, de nem ért oda.`
        : `${pick(event.unit, lang)} moved up, but did not get there.`

    case 'followerHolds':
      return hu
        ? `${pick(event.unit, lang)} tartja a helyét.`
        : `${pick(event.unit, lang)} holds their ground.`

    case 'followerWaits':
      return hu
        ? `${pick(event.unit, lang)} nem talált senkit.`
        : `${pick(event.unit, lang)} found nobody.`

    case 'followerHeld':
      return hu
        ? `${pick(event.unit, lang)} a földön van, nem tud mit tenni.`
        : `${pick(event.unit, lang)} is on the ground and can do nothing.`

    case 'followerOrdered':
      return hu
        ? `${pick(event.unit, lang)} parancsa: ${pick(event.order, lang)}.`
        : `${pick(event.unit, lang)}’s order: ${pick(event.order, lang)}.`

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
        ? `Mind a ${event.count} hős a kimenekítési ponton van. A csapat elhagyja a helyszínt.`
        : `All ${event.count} heroes are at the extraction point. The party is out.`

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

    case 'siteComing':
      return hu
        ? `A helyszín mozdul: ${siteName(event.kind, lang)} — a következő kör végén.`
        : `The site is moving: ${siteName(event.kind, lang)} — at the end of the next round.`

    case 'siteFired':
      return hu
        ? `${siteName(event.kind, lang)}.`
        : `${siteName(event.kind, lang)}.`

    case 'focused':
      return hu
        ? `Összehangolva: ${pick(event.target, lang)} a második találatból többet kap.`
        : `Focused: ${pick(event.target, lang)} takes more from the second hit.`

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

/** What the site is about to do, in one phrase. */
export function siteName(kind: SiteEventKind, lang: Lang): string {
  const hu = lang === 'hu'
  switch (kind) {
    case 'surge':
      return hu ? 'rúnalöket (+2 Töltet)' : 'a rune surge (+2 Flux)'
    case 'ashfall':
      return hu ? 'hamuhullás (a padló egy része lassít)' : 'ashfall (part of the floor slows you)'
    case 'reinforcement':
      return hu ? 'valami átjön a túloldalról' : 'something comes through'
    case 'collapse':
      return hu ? 'beszakad a padló egy része' : 'part of the floor gives way'
  }
}
