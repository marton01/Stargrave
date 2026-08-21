// The two starting hero classes.
//
// BALANCE: hit points are set here. The Runesmith is deliberately far tougher —
// he stands in front. The Echo-reader is fragile but works from a distance, and
// she is the one who handles fatigue well.

import type { HeroClassId, Text } from '../engine/types'

export type HeroClass = {
  id: HeroClassId
  name: Text
  description: Text
  hp: number
  /** Which silhouette to draw. */
  shape: 'smith' | 'reader'
}

export const HERO_CLASSES: Record<HeroClassId, HeroClass> = {
  runesmith: {
    id: 'runesmith',
    name: { hu: 'Rúnakovács', en: 'Runesmith' },
    description: {
      hu:
        'A terepformáló. Közelharcos építő: vért, csapdák, rúnaoszlopok, hátralökés. ' +
        'Ő rendezi át a csatateret, és ő áll elöl.',
      en:
        'The ground-shaper. A melee builder: shields, traps, rune pillars, knockback. ' +
        'He rearranges the battlefield, and he stands in front.',
    },
    hp: 12,
    shape: 'smith',
  },
  echoreader: {
    id: 'echoreader',
    name: { hu: 'Visszhang-olvasó', en: 'Echo-reader' },
    description: {
      hu:
        'A mintaolvasó. Távolsági rontómágus, aki a saját elhasznált lapjaival játszik: ' +
        'jelölés, területhatás, gyengítés. Törékeny, de messze elér.',
      en:
        'The pattern-reader. A ranged hexer who plays with her own discard pile: marking, ' +
        'area effects, weakening. Fragile, but she reaches far.',
    },
    hp: 8,
    shape: 'reader',
  },
}
