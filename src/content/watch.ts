// The watch: one decision each, every week.
//
// The strategic layer had plenty of decisions and they were all the table's. A
// player could go four weeks without a single choice that was theirs alone —
// perks and relics are spent when you happen to have enough, and the route is
// argued about together. Somebody who is not driving the mouse could sit through
// a whole month of game time and never have to think.
//
// So each hero has a standing duty, set once a week from their own console. The
// three options are deliberately not "small, medium, large": one is safe, one
// costs something to be strong, and one is quiet — so the answer depends on what
// the week is for, which is what makes it worth asking every time.

import type { HeroClassId, Text } from '../engine/types'

export type WatchEffect = {
  hull?: number
  information?: number
  morale?: number
  fuel?: number
  understanding?: number
  /** Columns of star map revealed on the spot. */
  reveal?: number
  /** Flux added to the next landing party, once. */
  flux?: number
  /** Hit points restored to every hero. */
  mend?: number
  /** Weeks of work added to each of this hero's mentees. */
  teach?: number
  /** Attention shed (negative) or gained. */
  attention?: number
}

export type WatchDuty = {
  id: string
  heroClass: HeroClassId
  name: Text
  description: Text
  effect: WatchEffect
}

export const WATCH_DUTIES: WatchDuty[] = [
  // ----------------------------------------------------------- RUNESMITH
  {
    id: 'smith-patch',
    heroClass: 'runesmith',
    name: { hu: 'Foltozás', en: 'Patching' },
    description: {
      hu: 'A hét a lemezeké. +3 hajótest.',
      en: 'The week belongs to the plating. +3 hull.',
    },
    effect: { hull: 3 },
  },
  {
    id: 'smith-temper',
    heroClass: 'runesmith',
    name: { hu: 'Edzés', en: 'Tempering' },
    description: {
      hu:
        'Rúnákat éget a fegyverekbe, a hajótest anyagából. A következő partraszállás +2 ' +
        'Fluxussal indul — 1 hajótestbe kerül.',
      en:
        'He burns runes into the weapons, out of the hull’s own stock. The next landing starts ' +
        'with 2 more Flux — at the price of 1 hull.',
    },
    effect: { flux: 2, hull: -1 },
  },
  {
    id: 'smith-damp',
    heroClass: 'runesmith',
    name: { hu: 'Tompítás', en: 'Damping' },
    description: {
      hu: 'Hidegen dolgozik, és lefogja, ami zörög. 2 figyelemmel kevesebb.',
      en: 'He works cold and holds down whatever rattles. Two less attention.',
    },
    effect: { attention: -2 },
  },

  // --------------------------------------------------------- ECHO-READER
  {
    id: 'reader-study',
    heroClass: 'echoreader',
    name: { hu: 'Tanulmányozás', en: 'Study' },
    description: {
      hu: 'Végigolvassa, amit a Labor összeszedett. +4 információ.',
      en: 'She reads through everything the Lab gathered. +4 information.',
    },
    effect: { information: 4 },
  },
  {
    id: 'reader-listen',
    heroClass: 'echoreader',
    name: { hu: 'Hallgatózás', en: 'Listening' },
    description: {
      hu:
        'Kikapcsol mindent, és csak hallgat. +1 megértés — de amit hall, azt a legénység is ' +
        'megérzi: 1 morál.',
      en:
        'She switches everything off and only listens. +1 understanding — but the crew feels what ' +
        'she hears: 1 morale.',
    },
    effect: { understanding: 1, morale: -1 },
  },
  {
    id: 'reader-chart',
    heroClass: 'echoreader',
    name: { hu: 'Térképezés', en: 'Charting' },
    description: {
      hu: 'Kirakja, ami az érzékelőkből kijött. Egy oszloppal többet láttok előre.',
      en: 'She lays out what came off the sensors. One more column revealed ahead.',
    },
    effect: { reveal: 1 },
  },

  // --------------------------------------------------------------- CANTOR
  {
    id: 'cantor-tend',
    heroClass: 'cantor',
    name: { hu: 'Kötözés', en: 'Tending' },
    description: {
      hu: 'Végigmegy a csapaton. Minden hős +3 életerőt kap.',
      en: 'She goes round the party. Every hero recovers 3 hit points.',
    },
    effect: { mend: 3 },
  },
  {
    id: 'cantor-sing',
    heroClass: 'cantor',
    name: { hu: 'Éneklés', en: 'Singing' },
    description: {
      hu: 'Este a Szentélyben, mindenkinek. +2 morál.',
      en: 'Evenings in the Sanctum, for everybody. +2 morale.',
    },
    effect: { morale: 2 },
  },
  {
    id: 'cantor-teach',
    heroClass: 'cantor',
    name: { hu: 'Tanítás', en: 'Teaching' },
    description: {
      hu:
        'A tanítványaival tölti a hetet: mindegyikük +2 munkahetet szerez. A Szentélyben viszont ' +
        'nem ő van — 1 morál.',
      en:
        'She spends the week with her mentees: each of them gains 2 weeks of work. But she is not ' +
        'in the Sanctum that week — 1 morale.',
    },
    effect: { teach: 2, morale: -1 },
  },

  // ------------------------------------------------------------- SURVEYOR
  {
    id: 'surveyor-scan',
    heroClass: 'surveyor',
    name: { hu: 'Pásztázás', en: 'Sweeping' },
    description: {
      hu: 'Végigméri az előttünk lévő rendszereket. Két oszlop felfedve.',
      en: 'He measures out the systems ahead. Two columns revealed.',
    },
    effect: { reveal: 2 },
  },
  {
    id: 'surveyor-plot',
    heroClass: 'surveyor',
    name: { hu: 'Útvonalszámítás', en: 'Plotting' },
    description: {
      hu: 'Kiszámolja a takarékos ívet. +3 üzemanyag marad a tartályban.',
      en: 'He works out the frugal arc. 3 fuel stays in the tank.',
    },
    effect: { fuel: 3 },
  },
  {
    id: 'surveyor-spot',
    heroClass: 'surveyor',
    name: { hu: 'Figyelés', en: 'Watching' },
    description: {
      hu: 'Nem mér, csak néz — csendben. +2 információ és 1 figyelemmel kevesebb.',
      en: 'He does not measure, he just watches — quietly. +2 information and one less attention.',
    },
    effect: { information: 2, attention: -1 },
  },
]

export function dutiesOf(heroClass: HeroClassId): WatchDuty[] {
  return WATCH_DUTIES.filter((duty) => duty.heroClass === heroClass)
}

export function watchDuty(id: string): WatchDuty | undefined {
  return WATCH_DUTIES.find((duty) => duty.id === id)
}
