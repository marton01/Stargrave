// What the ship does while the landing is happening.
//
// Everything in this game is sequential. Somebody takes a turn, everybody else
// watches, then the next one. That is fine for a board game round the table and
// it is the reason one strong player can plan for all four seats: there is always
// time to think for somebody else.
//
// This is the one place where two groups of players are doing different things
// in the same minute. Not everybody has to go down. Whoever stays aboard runs
// the ship during the fight: one action a round, paid out of the hold, felt on
// the grid. The party down there is smaller for it — that is the trade, and it
// is a real one.
//
// The first action on the list is the heart's own. Understanding costs
// attention, a landing is loud, and the people who stayed upstairs can spend the
// fight keeping the ship quiet. Somebody has to, and it cannot be anybody who is
// busy being shot at.

import type { ResourceId } from './ship'
import type { Text } from '../engine/types'

export type SupportKind =
  /** Shed attention while the noise is being made. */
  | 'dampen'
  /** Push the rune core: Flux to the party. */
  | 'power'
  /** Rune-mark the enemy standing closest to the party. */
  | 'mark'
  /** Patch up whoever is worst off. */
  | 'mend'

export type SupportDef = {
  kind: SupportKind
  name: Text
  /** What it does, in one line. */
  text: Text
  cost: { id: ResourceId; amount: number }
}

export const SUPPORT_DEFS: SupportDef[] = [
  {
    kind: 'dampen',
    name: { hu: 'Csendesítés', en: 'Dampen' },
    text: {
      hu: 'Amíg odalent zajt csaptok, itt fent tompítjuk. −1 zaj.',
      en: 'While you make the noise down there, we take it out of the air up here. −1 attention.',
    },
    cost: { id: 'information', amount: 4 },
  },
  {
    kind: 'power',
    name: { hu: 'Energiaátkötés', en: 'Reroute' },
    text: {
      hu: 'A Rúnamagot átkötjük a partraszálló csapatra. +3 Töltet.',
      en: 'The rune core is rerouted to the landing party. +3 Flux.',
    },
    cost: { id: 'fuel', amount: 3 },
  },
  {
    kind: 'mark',
    name: { hu: 'Érzékelő-söprés', en: 'Sensor sweep' },
    text: {
      hu: 'Bemérjük, ami a csapathoz legközelebb áll. Rúnajel kerül rá.',
      en: 'We range whatever stands closest to the party. It takes a Rune Mark.',
    },
    cost: { id: 'information', amount: 3 },
  },
  {
    kind: 'mend',
    name: { hu: 'Gyógyító készenlét', en: 'Medbay standing by' },
    text: {
      hu: 'A Gyógyítóból megy le, amit lehet. A legrosszabbul álló hős 3 életerőt kap.',
      en: 'Whatever the Medbay can send goes down. The hero worst off gets 3 hit points.',
    },
    cost: { id: 'fuel', amount: 4 },
  },
]

export function supportDef(kind: SupportKind): SupportDef {
  const found = SUPPORT_DEFS.find((s) => s.kind === kind)
  if (!found) throw new Error(`No such support action: ${kind}`)
  return found
}

/** At least this many heroes always go down. A landing needs a landing party. */
export const MIN_LANDING_PARTY = 2
