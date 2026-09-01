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
  /** Which silhouette to draw. See ui/shapes.tsx. */
  shape: 'smith' | 'reader' | 'cantor' | 'surveyor'
}

export const HERO_CLASSES: Record<HeroClassId, HeroClass> = {
  runesmith: {
    id: 'runesmith',
    name: { hu: 'Rúnaszövő', en: 'Runesmith' },
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
    name: { hu: 'Múltidéző', en: 'Echo-reader' },
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
  cantor: {
    id: 'cantor',
    name: { hu: 'Rítushívó', en: 'Cantor' },
    description: {
      hu:
        'A hangadó. Támogató: gyógyítás, vért, Fluxus a csapatnak. Nem ő öl meg semmit — ' +
        'ő tartja állva a többieket, és ő az egyetlen, aki a rácson vissza tud adni életerőt.',
      en:
        'The one who sets the note. A support: healing, shields, Flux for the party. She kills ' +
        'nothing — she keeps the others standing, and she is the only hit points on the grid.',
    },
    hp: 10,
    shape: 'cantor',
  },
  surveyor: {
    id: 'surveyor',
    name: { hu: 'Asztromanta', en: 'Surveyor' },
    description: {
      hu:
        'A távolságok embere. Tüzérség: nagy hatótáv, bemérés, területsebzés — de lassú ' +
        '(a legmagasabb kezdeményezés-számok) és törékeny. Aki eléri, az meg is öli.',
      en:
        'The man of distances. Artillery: long range, ranging marks, area fire — but slow (the ' +
        'highest initiative numbers in the game) and fragile. Whatever reaches him kills him.',
    },
    hp: 8,
    shape: 'surveyor',
  },
}
