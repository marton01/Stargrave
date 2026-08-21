// The Archive: what survives an expedition.
//
// Every expedition — even a failed one — sends its data home through the Gate.
// The Archive is where it lands, and as it grows it unlocks CONTENT, not power.
// The world gets richer rather than easier, which is what keeps the twentieth run
// worth playing. A permanent damage bonus would flatten the game in four runs;
// a new puzzle type or a new stratum of the story never does.

import type { Text } from '../types'
import type { ArchiveState, ArchiveUnlockId, EndingId, ExpeditionState } from './types'

export const ARCHIVE_VERSION = 1

export type ArchiveUnlock = {
  id: ArchiveUnlockId
  cost: number
  name: Text
  description: Text
}

export const ARCHIVE_UNLOCKS: ArchiveUnlock[] = [
  {
    id: 'puzzle-balanceScales',
    cost: 4,
    name: { hu: 'Mérlegkamrák', en: 'Weighing chambers' },
    description: {
      hu: 'Új feladványtípus: Egyensúly-mérleg. Ereklyék relatív súlyát kell kikövetkeztetni.',
      en: 'New puzzle type: Balance scales. Deduce the relative weight of relics.',
    },
  },
  {
    id: 'puzzle-safeGround',
    cost: 5,
    name: { hu: 'Omló padlók', en: 'Failing floors' },
    description: {
      hu: 'Új feladványtípus: Biztos talaj. Szomszédsági jelzésekből kell kitalálni, hol lehet lépni.',
      en: 'New puzzle type: Safe ground. Work out where you can step from adjacency clues.',
    },
  },
  {
    id: 'puzzle-gravityCores',
    cost: 6,
    name: { hu: 'Gravitációs magok', en: 'Gravity cores' },
    description: {
      hu: 'Új feladványtípus: ősi magokat kell a helyükre tolni.',
      en: 'New puzzle type: push ancient cores into place.',
    },
  },
  {
    id: 'puzzle-glyphs',
    cost: 7,
    name: { hu: 'Jelfejtés', en: 'Glyph reading' },
    description: {
      hu: 'Új feladványtípus: az idegen jelrendszer kompozíciós szabályai. Ez nyitja a történet mélyebb rétegeit.',
      en: 'New puzzle type: the composition rules of the alien sign system. This opens the deeper strata of the story.',
    },
  },
  {
    id: 'puzzle-starChart',
    cost: 8,
    name: { hu: 'Csillagtérkép-töredékek', en: 'Star chart fragments' },
    description: {
      hu: 'Új feladványtípus: térképdarabokat kell összeilleszteni. A megfejtés új helyeket nyit a csillagtérképen.',
      en: 'New puzzle type: fit chart fragments together. Solving one opens new places on the star map.',
    },
  },
  {
    id: 'puzzle-refraction',
    cost: 9,
    name: { hu: 'Fénytörés', en: 'Refraction' },
    description: {
      hu: 'Új feladványtípus: rúnafényt kell tükrökkel célokra terelni.',
      en: 'New puzzle type: steer rune-light onto targets with mirrors.',
    },
  },
  {
    id: 'encounters-deep',
    cost: 10,
    name: { hu: 'A mélyebb rétegek', en: 'The deeper strata' },
    description: {
      hu: 'Olyan találkozások, amiket az első expedíciók nem élnek meg. A hajó beszélni kezd.',
      en: 'Encounters the first expeditions never live to see. The ship begins to speak.',
    },
  },
  {
    id: 'module-cache',
    cost: 6,
    name: { hu: 'Előkészített raktár', en: 'A prepared cache' },
    description: {
      hu: 'A következő expedíciók megerősített hajótesttel indulnak.',
      en: 'Later expeditions set out with a reinforced hull already fitted.',
    },
  },
  {
    id: 'longer-gate',
    cost: 12,
    name: { hu: 'Stabilizált Kapu', en: 'A stabilised Gate' },
    description: {
      hu: 'Négy héttel több minden expedícióra. Nem könnyebb — csak több idő a megértésre.',
      en: 'Four more weeks on every expedition. Not easier — just more time to understand.',
    },
  },
]

export function newArchive(): ArchiveState {
  return {
    version: ARCHIVE_VERSION,
    points: 0,
    unlocked: [],
    history: [],
    bestUnderstanding: 0,
    expeditionsRun: 0,
  }
}

export function unlockDef(id: ArchiveUnlockId): ArchiveUnlock {
  const found = ARCHIVE_UNLOCKS.find((u) => u.id === id)
  if (!found) throw new Error(`No such archive unlock: ${id}`)
  return found
}

/**
 * Bank what the expedition learned. Understanding is worth points even on a
 * failed run — that is the promise the Archive makes: nothing is wasted.
 */
export function bankExpedition(archive: ArchiveState, expedition: ExpeditionState): ArchiveState {
  const outcome = expedition.outcome
  const label = outcome
    ? outcome.k === 'ending'
      ? `ending:${outcome.id}`
      : `lost:${outcome.reason}`
    : 'abandoned'

  const understandingPoints = Math.floor(expedition.understanding / 2)

  return {
    ...archive,
    version: ARCHIVE_VERSION,
    points: archive.points + expedition.archiveEarned + understandingPoints,
    history: [
      ...archive.history,
      {
        week: expedition.week,
        understanding: expedition.understanding,
        outcome: label,
        seed: expedition.seed,
      },
    ].slice(-30),
    bestUnderstanding: Math.max(archive.bestUnderstanding, expedition.understanding),
    expeditionsRun: archive.expeditionsRun + 1,
  }
}

export function canUnlock(archive: ArchiveState, id: ArchiveUnlockId): boolean {
  if (archive.unlocked.includes(id)) return false
  return archive.points >= unlockDef(id).cost
}

export function purchaseUnlock(archive: ArchiveState, id: ArchiveUnlockId): ArchiveState {
  if (!canUnlock(archive, id)) return archive
  return {
    ...archive,
    points: archive.points - unlockDef(id).cost,
    unlocked: [...archive.unlocked, id],
  }
}

// ---------------------------------------------------------------- endings

export const ENDING_TITLES: Record<EndingId, Text> = {
  flee: { hu: 'Visszafordulás', en: 'Turning back' },
  blindRuin: { hu: 'Vak pusztítás', en: 'Blind ruin' },
  witness: { hu: 'A tanú', en: 'The witness' },
  intervene: { hu: 'A beavatkozás', en: 'The intervention' },
  communion: { hu: 'Együtthangzás', en: 'Communion' },
}

export const ENDING_TEXTS: Record<EndingId, Text> = {
  flee: {
    hu:
      'Ott álltok a Csillagsír peremén, és nem értitek, mit láttok. Ami odalent van, az nem gép és nem lény, ' +
      'és nem nézi, hogy ott vagytok. A hajó fordul, a Kapu még nyitva van, és hazaérsz — ' +
      'egy hajórakomány kérdéssel, amihez nincs nyelv.',
    en:
      'You stand at the rim of the Stargrave and do not understand what you are looking at. What is down there is ' +
      'neither machine nor creature, and it does not notice you are here. The ship turns, the Gate is still open, ' +
      'and you get home — with a hold full of questions you have no language for.',
  },
  blindRuin: {
    hu:
      'Nem értitek, ezért elpusztítjátok. A Csillagsír szíve elhallgat, és a galaxis egy szemvillanás alatt ' +
      'hidegebb lesz, mint volt. Hazaértek. Évekkel később valaki megfejti, mit szakítottatok el — ' +
      'és akkor már késő megkérdezni, kellett volna-e.',
    en:
      'You do not understand it, so you destroy it. The heart of the Stargrave falls silent, and in one blink the ' +
      'galaxy is colder than it was. You get home. Years later somebody works out what you severed — and by then ' +
      'it is too late to ask whether you should have.',
  },
  witness: {
    hu:
      'Most már tudjátok, mi történt. Nem háború volt, nem kór, nem hiba. Egy döntés — és nem a tiétek. ' +
      'Nem tudtok beleszólni, de le tudjátok írni, és a Kapun át haza tudjátok vinni. ' +
      'Az Archívum ettől kezdve nem üres.',
    en:
      'Now you know what happened. Not a war, not a plague, not an accident. A decision — and not yours. ' +
      'You cannot intervene, but you can write it down and carry it home through the Gate. ' +
      'From now on the Archive is not empty.',
  },
  intervene: {
    hu:
      'Nem az történt, hogy meghaltak. Az történik, hogy még mindig tartanak valamit, és elfogy az erejük. ' +
      'Ti tudjátok, hova kell állni, és mit kell megfogni. Nem menekülés és nem hősiesség — ' +
      'egyszerűen segítség, ott, ahol addig senki nem értette, hogy kérték.',
    en:
      'They did not die. They are still holding something, and their strength is running out. ' +
      'You know where to stand and what to take hold of. Not an escape and not heroism — ' +
      'simply help, in a place where nobody had understood that help was being asked for.',
  },
  communion: {
    hu:
      'A Kórus nem maradvány. Ének, és nem befejezetlen: csak nem volt kinek folytatnia. ' +
      'Most már értitek a nyelvét, a rúnáit, a hallgatását — és azt is, miért nem háború volt. ' +
      'Ketten belépnek a Szívbe, és a galaxis egy hangot ad ki, amit hetven éve senki nem hallott. ' +
      'Nem ti mentitek meg. Csak megtanultátok, hogy hogyan kérdezzenek meg.',
    en:
      'The Choir is not a remnant. It is a song, and not an unfinished one: there was simply nobody left to carry it on. ' +
      'Now you understand its language, its runes, its silence — and why it was never a war. ' +
      'Two of you step into the Heart, and the galaxy makes a sound nobody has heard in seventy years. ' +
      'You do not save it. You only learned how to be asked.',
  },
}

export const LOSS_TEXTS: Record<string, Text> = {
  hull: {
    hu: 'A hajótest megadta magát. Nem volt idő a mentőkabinokig — és nincs, aki jelentse.',
    en: 'The hull gave out. There was no time to reach the pods — and nobody left to file the report.',
  },
  morale: {
    hu: 'A legénység megtagadta a parancsot. Az expedíció nem ott ért véget, ahol a Kapu — hanem a hídon.',
    en: 'The crew refused orders. The expedition did not end at the Gate but on the bridge.',
  },
  gateClosed: {
    hu:
      'A Kapu bezárult. A hajó még megy, a legénység még él, és soha többé nem lát otthont. ' +
      'Amit felfedeztetek, még átment az utolsó pillanatban — az Archívum megkapta.',
    en:
      'The Gate has closed. The ship still runs, the crew is still alive, and none of them will see home again. ' +
      'What you discovered made it through at the last moment — the Archive has it.',
  },
  abandoned: {
    hu: 'Az expedíciót leállítottátok. Ami megvan, az megvan.',
    en: 'You called the expedition off. What you have, you keep.',
  },
}
