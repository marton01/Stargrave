// Rendering expedition log events into text.
//
// Same principle as the battle log: the engine only ever stores structured
// events, so switching language rewrites the whole record of the run — including
// the week-three lines you read in the other language.

import { dialDef } from '../content/difficulty'
import { RESOURCES, STATIONS } from '../content/ship'
import { RANK_NAMES } from '../content/crew'
import { HERO_CLASSES } from '../content/heroes'
import { pick } from './ui'
import type { HeroClassId, Lang } from '../engine/types'
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

    case 'moduleLost':
      return hu
        ? `${pick(event.module, lang)}: odalett. Az expedíció hátralévő részére nélküle megyünk.`
        : `${pick(event.module, lang)} is gone. The rest of the expedition goes without it.`

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

    case 'crewBond':
      return hu
        ? event.kind === 'trust'
          ? `${event.a} és ${event.b} hamar egymásra találtak. Egy állomáson többet végeznek.`
          : `${event.a} és ${event.b} első nap összekaptak. Egy állomáson kevesebbet végeznek.`
        : event.kind === 'trust'
          ? `${event.a} and ${event.b} took to each other at once. On one station they get more done.`
          : `${event.a} and ${event.b} fell out on the first day. On one station they get less done.`

    case 'stayedAboard':
      return hu
        ? `${pick(HERO_CLASSES[event.hero].name, lang)} fent marad a hajón a következő partraszállásra.`
        : `The ${pick(HERO_CLASSES[event.hero].name, lang)} stays aboard for the next landing.`

    case 'shipSupport':
      return hu
        ? `A hajóról: ${pick(event.what, lang)} — ${pick(HERO_CLASSES[event.hero].name, lang)}.`
        : `From the ship: ${pick(event.what, lang)} — the ${pick(HERO_CLASSES[event.hero].name, lang)}.`

    case 'pledgeMade':
      return hu
        ? `${pick(HERO_CLASSES[event.hero].name, lang)} szava rá: ${pick(event.label, lang)} (${event.weeks} hét).`
        : `The ${pick(HERO_CLASSES[event.hero].name, lang)} gives their word: ${pick(event.label, lang)} (${event.weeks} weeks).`

    case 'pledgeKept':
      return hu
        ? `${pick(HERO_CLASSES[event.hero].name, lang)} megtartotta: ${pick(event.label, lang)}`
        : `The ${pick(HERO_CLASSES[event.hero].name, lang)} kept it: ${pick(event.label, lang)}`

    case 'pledgeBroken':
      return hu
        ? `${pick(HERO_CLASSES[event.hero].name, lang)} nem tartotta meg: ${pick(event.label, lang)}`
        : `The ${pick(HERO_CLASSES[event.hero].name, lang)} did not keep it: ${pick(event.label, lang)}`

    case 'darkeningNamed':
      return `${pick(event.name, lang)} — ${pick(event.text, lang)}`

    case 'figureStanding':
      return hu
        ? `${pick(event.name, lang)} megjegyezte. (${event.standing >= 0 ? '+' : ''}${event.standing})`
        : `${pick(event.name, lang)} noted it. (${event.standing >= 0 ? '+' : ''}${event.standing})`

    case 'figureExpected':
      return hu
        ? `${pick(event.name, lang)} ${event.weeks} hét múlva utolér titeket.`
        : `${pick(event.name, lang)} catches up with you in ${event.weeks} weeks.`

    case 'councilCalled':
      return hu
        ? `A legénység szót kér: ${pick(event.title, lang)} — ${event.supporters} a ${event.of} főből.`
        : `The crew ask to be heard: ${pick(event.title, lang)} — ${event.supporters} of ${event.of}.`

    case 'crewFriction':
      return hu
        ? `${event.a} és ${event.b} egész héten egymás mellett dolgozott. Nem ment jól.`
        : `${event.a} and ${event.b} worked side by side all week. It did not go well.`

    case 'followerChosen':
      return hu
        ? `${event.name} lemegy a következő partraszállásra ${pick(HERO_CLASSES[event.hero].name, lang)} mellett.`
        : `${event.name} will come down on the next landing at ${pick(HERO_CLASSES[event.hero].name, lang)}’s side.`

    case 'followerDied':
      return hu
        ? `${event.name} nem jött vissza a partraszállásról. ${pick(HERO_CLASSES[event.hero].name, lang)} vitte le.`
        : `${event.name} did not come back from the landing. ${pick(HERO_CLASSES[event.hero].name, lang)} took them down.`

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

    case 'enginesCold':
      return hu
        ? 'A hajtómű energia nélkül áll. A hajó nem haladt semmit ezen a héten.'
        : 'The engines have no power. The ship made no headway at all this week.'

    case 'reachedHeart':
      return hu
        ? 'Ott vagyunk. A Csillagsír előttünk van, és nem úgy néz ki, ahogy vártuk.'
        : 'We are here. The Stargrave is in front of us, and it does not look the way we expected.'

    // ---------------------------------------------- attention and the Herald

    case 'attentionRose':
      return hu
        ? `Zajt csaptunk: figyelem +${event.amount} (${event.total}).`
        : `We made noise: attention +${event.amount} (${event.total}).`

    case 'attentionFell':
      return hu
        ? `Csendesebb hét: figyelem −${event.amount} (${event.total}).`
        : `A quieter week: attention −${event.amount} (${event.total}).`

    case 'heraldWoke':
      return hu
        ? 'Valami elindult a mélyből. A Hírnök felébredt, és tudja, merre vagyunk.'
        : 'Something set out from the deep. The Herald is awake, and it knows which way we are.'

    case 'heraldMoved':
      return event.columnsAway === 0
        ? hu
          ? 'A Hírnök beért minket.'
          : 'The Herald has caught up with us.'
        : hu
          ? `A Hírnök ${event.columnsAway} oszlopra van.`
          : `The Herald is ${event.columnsAway} columns away.`

    case 'heraldCaught':
      return hu
        ? 'A zsilipnél van. Nincs hova menni: itt kell megállítani.'
        : 'It is at the airlock. There is nowhere to go: it has to be stopped here.'

    case 'heraldSilenced':
      return hu
        ? 'A Hírnök elhallgatott. A Csillagsír nem küld másikat.'
        : 'The Herald has fallen silent. The Stargrave sends no other.'

    case 'heraldRepelled':
      return hu
        ? 'Kiszorítottuk a hajóból, de nem állítottuk meg. Vissza fog jönni, és erősebb lesz.'
        : 'We forced it out of the ship without stopping it. It will come back, and stronger.'

    // ---------------------------------------------------------------- relics

    case 'relicFound':
      return hu
        ? `Ereklye a fedélzeten: ${pick(event.relic, lang)}.`
        : `A relic aboard: ${pick(event.relic, lang)}.`

    case 'relicAttuned':
      return hu
        ? `${heroName(event.hero, lang)} ráhangolódott: ${pick(event.relic, lang)}.`
        : `${heroName(event.hero, lang)} attuned: ${pick(event.relic, lang)}.`

    case 'relicStowed':
      return hu
        ? `Elraktuk: ${pick(event.relic, lang)}. Innentől nem hat semmire.`
        : `Stowed: ${pick(event.relic, lang)}. It does nothing from here on.`

    case 'relicSold':
      return hu
        ? `Eladva: ${pick(event.relic, lang)} — ${event.price} kredit.`
        : `Sold: ${pick(event.relic, lang)} — ${event.price} credits.`

    // ----------------------------------------------------------- advancement

    case 'heroMarks':
      return hu
        ? `${heroName(event.hero, lang)}: +${event.amount} jegy (${pick(event.reason, lang)}).`
        : `${heroName(event.hero, lang)}: +${event.amount} marks (${pick(event.reason, lang)}).`

    case 'perkBought':
      return hu
        ? `${heroName(event.hero, lang)} megtanulta: ${pick(event.perk, lang)}.`
        : `${heroName(event.hero, lang)} learned: ${pick(event.perk, lang)}.`

    case 'crewPromoted':
      return hu
        ? `${event.name} előrelépett: ${pick(RANK_NAMES[event.rank as 1 | 2 | 3], lang)}.`
        : `${event.name} has moved up: ${pick(RANK_NAMES[event.rank as 1 | 2 | 3], lang)}.`

    case 'crewLearned':
      return hu
        ? `${event.name} új vonása: ${pick(event.trait, lang)}.`
        : `${event.name} has a new trait: ${pick(event.trait, lang)}.`

    case 'mentorTaken':
      return hu
        ? `${event.name} ${heroName(event.hero, lang)} tanítványa lett.`
        : `${event.name} is now ${heroName(event.hero, lang)}’s mentee.`

    // ------------------------------------------------------------ directives

    case 'directiveIssued':
      return hu
        ? `Parancs otthonról: ${pick(event.label, lang)} (${event.weeks} hét).`
        : `Orders from home: ${pick(event.label, lang)} (${event.weeks} weeks).`

    case 'directiveDone':
      return hu
        ? `Parancs teljesítve: ${pick(event.label, lang)}.`
        : `Order carried out: ${pick(event.label, lang)}.`

    case 'directiveFailed':
      return hu
        ? `Parancs elbukva: ${pick(event.label, lang)}. A legénység hallott róla.`
        : `Order failed: ${pick(event.label, lang)}. The crew has heard about it.`

    // ------------------------------------------------ the ship's own weeks

    case 'aboardEvent':
      return hu
        ? `Történt valami a hajón: ${pick(event.title, lang)}${
            event.owner ? ` — ${heroName(event.owner, lang)} dolga.` : '.'
          }`
        : `Something happened aboard: ${pick(event.title, lang)}${
            event.owner ? ` — ${heroName(event.owner, lang)}’s call.` : '.'
          }`

    case 'debtCame':
      return hu
        ? `Amit korábban eldöntöttünk, ma ideért: ${pick(event.note, lang)}`
        : `What we decided earlier arrived today: ${pick(event.note, lang)}`

    case 'loyaltyShift':
      return hu
        ? `${event.name}: ${pick(event.band, lang)}.`
        : `${event.name}: ${pick(event.band, lang)}.`

    case 'crewRestless':
      return hu
        ? `${event.name} nem beszél senkivel, és pakolni kezdett. ${event.weeks} hét, és lemarad valahol.`
        : `${event.name} is not speaking to anybody and has started packing. ${event.weeks} weeks, and they get off somewhere.`

    case 'crewSettled':
      return hu
        ? `${event.name} meggondolta magát. A zsák visszakerült a szekrénybe.`
        : `${event.name} has thought better of it. The bag went back in the locker.`

    case 'crewDefected':
      return hu
        ? `${event.name} lelépett, és elvitte: ${pick(event.took, lang)}.`
        : `${event.name} is gone, and took: ${pick(event.took, lang)}.`

    case 'proposalMade':
      return hu
        ? `A ${event.by}. szék kérdez: ${pick(event.what, lang)}. Valaki másnak rá kell bólintania.`
        : `Seat ${event.by} is asking: ${pick(event.what, lang)}. Somebody else has to agree.`

    case 'proposalCarried':
      return hu
        ? `Megegyeztetek: ${pick(event.what, lang)}.`
        : `Agreed: ${pick(event.what, lang)}.`

    case 'proposalDropped':
      return hu ? 'A kérdés visszavonva.' : 'The question was withdrawn.'

    case 'watchSet':
      return hu
        ? `${heroName(event.hero, lang)} kiadta a heti őrséget: ${pick(event.duty, lang)}.`
        : `${heroName(event.hero, lang)} set their duty for the week: ${pick(event.duty, lang)}.`

    case 'watchDone':
      return hu
        ? `${heroName(event.hero, lang)}: ${pick(event.duty, lang)} — kész.`
        : `${heroName(event.hero, lang)}: ${pick(event.duty, lang)} — done.`

    case 'taskSolved':
      return hu
        ? 'A zárósor kinyílt. Négy fej, négy fél leírás — és mégis megvolt.'
        : 'The closing line opened. Four heads, four half-descriptions — and it still came out.'

    case 'taskFailed':
      return hu
        ? 'A zárósor bezárult, és nem nyílik többet. A legénység hallotta, ahogy nem sikerül.'
        : 'The closing line shut, and it will not open again. The crew heard it fail.'

    case 'heartRead':
      return hu
        ? 'Leültünk a Csillagsír pereme elé, hogy elolvassuk, mielőtt bármit döntünk.'
        : 'We sat down in front of the rim of the Stargrave to read it before deciding anything.'
  }
}

/** The two of them, by name, because the log talks about them by name. */
function heroName(hero: HeroClassId, lang: Lang): string {
  return pick(HERO_CLASSES[hero].name, lang)
}
