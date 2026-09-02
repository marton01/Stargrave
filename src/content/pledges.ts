// What one of you promises the others.
//
// The list of things that make a game social has "bargaining, threats, promises,
// bluffing" on it, and three of those four have no honest place in a
// co-operative game: there is nobody to threaten and nothing to bluff about. The
// promise is the one that survives the translation, and it survives it whole.
//
// A pledge is one player standing up and saying "give me four weeks and I will
// have the hull back at full" — out loud, in front of the table, with a date on
// it. The game writes it down and checks it. That is all.
//
// WHY IT IS WORTH A SYSTEM
//
//   **It creates the conversation rather than scripting it.** Nothing forces
//   anybody to pledge. What the rules do is make the words binding, which is
//   what turns "I'll sort it out" into a thing worth saying and worth arguing
//   about.
//
//   **It is the only place a player commits to a FUTURE.** Every other decision
//   in this game is answered now. A pledge is answered in four weeks, by
//   somebody who has to live with having said it.
//
//   **Keeping it pays the person, not the ship.** The marks go to the hero who
//   made it. Being the one who says a thing and then does it is a role, and it
//   is a role a quiet player can take without out-arguing anybody.
//
// The first one on the list is the heart's own pledge: going quiet. Understanding
// costs attention now, so "we stop learning for four weeks" is a real, painful,
// checkable promise about the thing the whole game is about.

import type { Text } from '../engine/types'

export type PledgeKind =
  /** Gain no attention at all for the term. */
  | 'quiet'
  /** Reach this much understanding by the deadline. */
  | 'learn'
  /** Hull at least this high at the deadline. */
  | 'hull'
  /** Food at least this high at the deadline. */
  | 'stores'
  /** Nobody dies during the term. */
  | 'nobodyFalls'
  /** Win this many landings during the term. */
  | 'landings'

export type PledgeDef = {
  kind: PledgeKind
  name: Text
  /** What is being promised, with the number in it. */
  ask: (target: number) => Text
  /** The line the player is saying out loud. */
  said: Text
  /** Weeks the pledge runs for. */
  weeks: number
  /**
   * How hard it is, roughly, from 1 to 3. Marks earned scale with it — a promise
   * that costs nothing to keep should not pay like one that does.
   */
  weight: 1 | 2 | 3
}

export const PLEDGE_DEFS: PledgeDef[] = [
  {
    kind: 'quiet',
    name: { hu: 'Csend', en: 'Quiet' },
    ask: (n) => ({
      hu: `${n} héten át nem csapunk zajt: a zaj nem nőhet.`,
      en: `${n} weeks without a sound: attention must not rise.`,
    }),
    said: {
      hu: '„Négy hétig nem nyúlunk semmihez, ami hallatszik. Utána újra megnézzük.”',
      en: '“Four weeks and we touch nothing that can be heard. Then we look again.”',
    },
    weeks: 4,
    weight: 3,
  },
  {
    kind: 'learn',
    name: { hu: 'Megfejtés', en: 'Reading' },
    ask: (n) => ({
      hu: `A határidőre legyen meg ${n} megfejtés.`,
      en: `Reach ${n} understanding by the deadline.`,
    }),
    said: {
      hu: '„Adjatok öt hetet, és megmondom, mi történt itt. Vállalom a zaját is.”',
      en: '“Give me five weeks and I will tell you what happened here. The noise is on me.”',
    },
    weeks: 5,
    weight: 2,
  },
  {
    kind: 'hull',
    name: { hu: 'A hajótest', en: 'The hull' },
    ask: (n) => ({
      hu: `A határidőre legyen legalább ${n} hajótest.`,
      en: `At least ${n} hull by the deadline.`,
    }),
    said: {
      hu: '„A hajótestet bízzátok rám. Négy hét, és nem lesz min aggódni.”',
      en: '“Leave the hull to me. Four weeks and there is nothing to worry about.”',
    },
    weeks: 4,
    weight: 1,
  },
  {
    kind: 'stores',
    name: { hu: 'A raktár', en: 'The stores' },
    ask: (n) => ({
      hu: `A határidőre legyen legalább ${n} élelem.`,
      en: `At least ${n} food by the deadline.`,
    }),
    said: {
      hu: '„Senki nem fog éhezni. Ezt én vállalom.”',
      en: '“Nobody is going hungry. That one is mine.”',
    },
    weeks: 4,
    weight: 1,
  },
  {
    kind: 'nobodyFalls',
    name: { hu: 'Mindenki visszajön', en: 'Everybody comes back' },
    ask: (n) => ({
      hu: `${n} héten át senkit nem veszítünk el a legénységből.`,
      en: `${n} weeks without losing anybody from the crew.`,
    }),
    said: {
      hu: '„Amíg én mondom meg, ki megy le, addig mindenki vissza is jön.”',
      en: '“While I say who goes down, everybody comes back up.”',
    },
    weeks: 5,
    weight: 3,
  },
  {
    kind: 'landings',
    name: { hu: 'A talaj', en: 'The ground' },
    ask: (n) => ({
      hu: `${n} partraszállást nyerünk meg a határidőig.`,
      en: `Win ${n} landings before the deadline.`,
    }),
    said: {
      hu: '„Nem kerülgetjük őket tovább. Kettőt leviszünk, és kész.”',
      en: '“We stop going round them. Two of them, done.”',
    },
    weeks: 5,
    weight: 2,
  },
]

export function pledgeDef(kind: PledgeKind): PledgeDef {
  const found = PLEDGE_DEFS.find((p) => p.kind === kind)
  if (!found) throw new Error(`No such pledge: ${kind}`)
  return found
}
