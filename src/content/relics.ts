// Relics: named things you carry out of the ruins.
//
// Before this, a relic was a number. An exploration mission said "collect 2" and
// what came home was `carried: 2` — no name, no effect, nothing to decide
// afterwards. Two expeditions ran the same way because nothing they picked up
// changed how the third week felt.
//
// A relic now has a name, one effect, and usually a price for carrying it. The
// price is the design: a relic does nothing sitting in the hold, and its effect
// only reaches the ship while one of the two heroes wears it ATTUNED. There are
// more relics than attunement slots on purpose — the interesting question is not
// "did you find one" but "which one of you wears which, this week".
//
// Everything here is data. The engine reads `effect`; the interface reads the
// words. See `relicEffect` in the expedition engine for how the fields are
// summed, and `HERO_PERKS` for the perks that widen the slots.

import type { HeroClassId, Text } from '../engine/types'
import type { ResourceId } from './ship'

/**
 * What a relic does while it is attuned.
 *
 * Deliberately the same shape as a module's effect wherever it can be, so the
 * weekly turn sums modules and attuned relics through one code path and neither
 * can quietly stop working.
 */
export type RelicEffect = {
  /** Flux the landing party starts with. */
  flux?: number
  /** Hull risk absorbed in encounters. */
  wards?: number
  /** Extra columns of star map revealed each week. */
  sensorRange?: number
  /** Where morale is heading. */
  moraleTarget?: number
  /** A flat weekly gain, like a module's. */
  weekly?: { id: ResourceId; amount: number }
  /** Extra maximum hit points for the hero wearing it. */
  heroHp?: number
  /** Bond range in tiles, replacing the usual two. */
  bondRange?: number
  /** Attention gained (or, negative, shed) every week while worn. */
  attention?: number
  /** Extra Information from the Lab. */
  research?: number
  /** Extra hull from the Forge. */
  repair?: number
}

export type Relic = {
  id: string
  name: Text
  /** What it is, in the fiction. */
  description: Text
  /** What it does, in one line of plain numbers. */
  effect: RelicEffect
  /**
   * The cost of wearing it, in words. Present exactly when the effect has a
   * negative field — a relic whose drawback is not written down is a trap.
   */
  whisper?: Text
  /** Credits it fetches at a trading post. Also what it is worth as loot. */
  value: number
  /**
   * Only one of the two can wear this one, and it is always the same one.
   *
   * Not a balance lever: it is character. The Runesmith's relics are things you
   * hold and strike with; the Echo-reader's are things you listen to. A couple
   * of each are locked so that each player has something the other cannot take.
   */
  bearer?: HeroClassId
}

export const RELICS: Relic[] = [
  {
    id: 'choir-shard',
    name: { hu: 'Kórus-szilánk', en: 'Choir shard' },
    description: {
      hu:
        'Egy tenyérnyi, élére állított üvegdarab, ami akkor is szól, ha nem fújja semmi. ' +
        'A Visszhang-olvasó a fülénél hordja.',
      en:
        'A palm-sized sliver of glass stood on its edge, sounding even when nothing moves it. ' +
        'The Echo-reader wears it at her ear.',
    },
    effect: { flux: 1, research: 1 },
    value: 18,
    bearer: 'echoreader',
  },
  {
    id: 'anvil-fragment',
    name: { hu: 'Üllőtöredék', en: 'Anvil fragment' },
    description: {
      hu:
        'Egy isten-gép talpazatának letört sarka. Nehéz, hideg, és nem lehet elrontani. ' +
        'A Rúnakovács a mellvértjébe kötözi.',
      en:
        'The broken corner of a godmachine’s plinth. Heavy, cold, and impossible to ruin. ' +
        'The Runesmith straps it into his breastplate.',
    },
    effect: { heroHp: 3, repair: 1 },
    value: 18,
    bearer: 'runesmith',
  },
  {
    id: 'lantern-of-still-air',
    name: { hu: 'Állócsend-lámpás', en: 'Lantern of still air' },
    description: {
      hu: 'Nem világít. Elveszi a hangot arról a helyről, ahol áll.',
      en: 'It gives no light. It takes the sound out of the place where it stands.',
    },
    effect: { attention: -2 },
    value: 24,
  },
  {
    id: 'watchers-eye',
    name: { hu: 'Az őrző szeme', en: 'The watcher’s eye' },
    description: {
      hu:
        'Egy lencse, ami mindig arra fordul, amerre még nem néztetek. Két oszloppal messzebbre ' +
        'lát — de csak amíg az Érzékelő állomás megy.',
      en:
        'A lens that always turns towards what you have not looked at yet. Two columns further — ' +
        'but only while the Sensors station is running.',
    },
    effect: { sensorRange: 2, attention: 1 },
    whisper: {
      hu: 'Amíg nézel vele, néznek is: hetente +1 figyelem.',
      en: 'While you look through it, you are looked at: +1 attention a week.',
    },
    value: 20,
  },
  {
    id: 'binding-cord',
    name: { hu: 'Kötőzsinór', en: 'Binding cord' },
    description: {
      hu:
        'Két fonat, ugyanabból a szálból. Aki a felét hordja, tudja, hol van a másik fél — ' +
        'akkor is, ha nem látja.',
      en:
        'Two braids from one thread. Whoever wears half of it knows where the other half is, ' +
        'even out of sight.',
    },
    effect: { bondRange: 4 },
    value: 26,
  },
  {
    id: 'ash-reliquary',
    name: { hu: 'Hamutartó szelence', en: 'Ash reliquary' },
    description: {
      hu: 'Valakinek a hamvai, feliratozva. A legénység tudja, kinek — és ettől könnyebb.',
      en: 'Somebody’s ashes, labelled. The crew knows whose — and it makes things easier.',
    },
    effect: { moraleTarget: 2 },
    value: 16,
  },
  {
    id: 'godmachine-tap',
    name: { hu: 'Isten-gép csapolás', en: 'Godmachine tap' },
    description: {
      hu: 'Egy hüvelykujj méretű szelep, ami még mindig ad valamit. Nem tudjátok, honnan.',
      en: 'A thumb-sized valve that still gives something. You do not know where from.',
    },
    effect: { flux: 2, moraleTarget: -1 },
    whisper: {
      hu: 'A legénység nem szeret vele egy fedélzeten lenni: −1 a morál-célhoz.',
      en: 'The crew does not like sharing a deck with it: −1 to the morale target.',
    },
    value: 28,
  },
  {
    id: 'silent-plate',
    name: { hu: 'Hallgató lemez', en: 'Silent plate' },
    description: {
      hu: 'Páncéllemez egy olyan hajóról, amit soha nem találtak meg. Ez a magyarázat rá.',
      en: 'Hull plate from a ship nobody ever found. This is the explanation.',
    },
    effect: { wards: 2, heroHp: 2 },
    value: 22,
    bearer: 'runesmith',
  },
  {
    id: 'seed-vault',
    name: { hu: 'Magtár-kapszula', en: 'Seed capsule' },
    description: {
      hu: 'Élő magok, hetvenéves alvásban. Ki lehet őket ébreszteni a hidropóniában.',
      en: 'Living seeds, seventy years asleep. They can be woken in the hydroponics.',
    },
    effect: { weekly: { id: 'food', amount: 3 } },
    value: 14,
  },
  {
    id: 'ledger-of-names',
    name: { hu: 'A nevek jegyzéke', en: 'The ledger of names' },
    description: {
      hu:
        'Egy lista mindenkiről, aki itt maradt. A Visszhang-olvasó fel tudja olvasni — ' +
        'és amit felolvas, azt érteni kezdi.',
      en:
        'A list of everyone who stayed. The Echo-reader can read it aloud — and what she reads ' +
        'aloud she begins to understand.',
    },
    effect: { research: 2, weekly: { id: 'information', amount: 1 } },
    value: 24,
    bearer: 'echoreader',
  },
  {
    id: 'hollow-bell',
    name: { hu: 'Üres harang', en: 'Hollow bell' },
    description: {
      hu:
        'Nincs nyelve, mégis megszólal, amikor valami közeledik. Nem kellemes, de hasznos.',
      en:
        'It has no clapper and rings anyway, whenever something approaches. Unpleasant, and useful.',
    },
    effect: { attention: -1, wards: 1 },
    value: 20,
  },
  {
    id: 'first-rune',
    name: { hu: 'Az első rúna', en: 'The first rune' },
    description: {
      hu:
        'Egyetlen jel, kőbe vágva, mielőtt a jelrendszer létezett volna. A Rúnakovács ' +
        'órákig nézi, és a keze utána biztosabb.',
      en:
        'One sign cut into stone before the sign system existed. The Runesmith looks at it for ' +
        'hours, and his hand is steadier afterwards.',
    },
    effect: { flux: 1, heroHp: 2, attention: 1 },
    whisper: {
      hu: 'Válaszol, amikor olvassák: hetente +1 figyelem.',
      en: 'It answers when it is read: +1 attention a week.',
    },
    value: 30,
    bearer: 'runesmith',
  },
  {
    id: 'tuning-fork',
    name: { hu: 'Hangolóvilla', en: 'Tuning fork' },
    description: {
      hu:
        'Két ág, ami hetven év után is ugyanazt a hangot adja. A Kántor ehhez hangolja a ' +
        'legénységet — és amíg szól, könnyebb bírni.',
      en:
        'Two prongs that still give the same note after seventy years. The Cantor tunes the crew ' +
        'to it — and while it sounds, things are easier to bear.',
    },
    effect: { moraleTarget: 1, heroHp: 2 },
    value: 20,
    bearer: 'cantor',
  },
  {
    id: 'measuring-chain',
    name: { hu: 'Mérőlánc', en: 'Measuring chain' },
    description: {
      hu:
        'Egy lánc, aminek minden szeme pontosan ugyanakkora, és ami mindig kifeszül a helyes ' +
        'irányba. A Csillagmérő ebből dolgozik.',
      en:
        'A chain whose every link is exactly the same length, and which always pulls taut in the ' +
        'right direction. The Surveyor works from it.',
    },
    effect: { sensorRange: 1, flux: 1 },
    value: 22,
    bearer: 'surveyor',
  },
]

const RELIC_INDEX = new Map(RELICS.map((r) => [r.id, r]))

export function relic(id: string): Relic {
  const found = RELIC_INDEX.get(id)
  if (!found) throw new Error(`No such relic: ${id}`)
  return found
}

export function isRelicId(id: string): boolean {
  return RELIC_INDEX.has(id)
}

/** Can this hero wear this relic at all? */
export function relicFits(id: string, heroClass: HeroClassId): boolean {
  const bearer = relic(id).bearer
  return bearer === undefined || bearer === heroClass
}

/** Every relic either has no downside, or says what it is. */
export function relicHasWhisper(r: Relic): boolean {
  const e = r.effect
  return (e.attention ?? 0) > 0 || (e.moraleTarget ?? 0) < 0
}
