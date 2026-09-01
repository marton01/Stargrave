// Status effect vocabulary. Content rather than interface: these are game
// terms, so they live next to the rules that use them.

import type { StatusKind, Text } from '../engine/types'

export const STATUS_NAMES: Record<StatusKind, Text> = {
  shield: { hu: 'Vért', en: 'Shield' },
  anchor: { hu: 'Horgony', en: 'Anchor' },
  runeMark: { hu: 'Rúnajel', en: 'Rune Mark' },
  prone: { hu: 'Ledöntött', en: 'Prone' },
  blind: { hu: 'Elvakított', en: 'Blinded' },
  weakened: { hu: 'Gyengített', en: 'Weakened' },
}

export const STATUS_DESCRIPTIONS: Record<StatusKind, Text> = {
  shield: {
    hu:
      'Páncél. Minden találat sebzését ennyivel csökkenti, aztán 1-gyel fogy. Nem időhöz ' +
      'kötött, tehát nem lehet elkésni vele — de legfeljebb 3-ig gyűlhet.',
    en:
      'Armour. Reduces every incoming hit by this much, then drops by 1. Not tied to time, ' +
      'so it can never be applied too late — but it stacks only up to 3.',
  },
  anchor: {
    hu:
      'A megjelölt nem tud elmozdulni, és a területhatások +1-et sebeznek rá. ' +
      'A Rúnaszövő rakja fel.',
    en:
      'The marked unit cannot move, and area effects deal +1 damage to it. ' +
      'Applied by the Runesmith.',
  },
  runeMark: {
    hu:
      'A megjelöltre a hősök közelharci támadása +2-t sebez, és ha megjelölve hal meg, ' +
      '+1 Fluxus jár. A Múltidéző rakja fel.',
    en:
      "Heroes' melee attacks deal +2 to the marked unit, and if it dies while marked you " +
      'gain +1 Flux. Applied by the Echo-reader.',
  },
  prone: {
    hu: 'Nem mozdul a következő körében, és +1 sebzést kap minden találatból.',
    en: 'Cannot move on its next turn, and takes +1 damage from every hit.',
  },
  blind: {
    hu: 'A támadása egyáltalán nem sebez.',
    en: 'Its attacks deal no damage at all.',
  },
  weakened: {
    hu: 'A támadása 1-gyel kevesebbet sebez.',
    en: 'Its attacks deal 1 less damage.',
  },
}
