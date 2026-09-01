// What the Darkening actually does to you.
//
// It used to be a level: a number that quietly shrank the reactor and quietly
// made everything below stronger. Both of those are real and neither is
// something a player can point at. A run's most important pressure was the only
// system in the game with no face on it — you never got to say "remember when
// the second level hit and the lights went".
//
// Each step now arrives as a NAMED thing that happens once, in the log, with a
// line the table reads out. The numbers behind it have not changed: this is the
// same pressure, said out loud.

import type { Text } from '../engine/types'

export type DarkeningStep = {
  level: number
  name: Text
  /** What it is like, in one or two sentences. */
  text: Text
}

export const DARKENING_STEPS: DarkeningStep[] = [
  {
    level: 1,
    name: { hu: 'A hosszú árnyék', en: 'The long shadow' },
    text: {
      hu:
        'A reaktor ugyanazt a kart kapja, és kevesebbet ad vissza. Senki nem tudja megmondani, ' +
        'hol vész el. A műszerek szerint nincs is veszteség.',
      en:
        'The reactor takes the same lever and gives back less. Nobody can say where it goes. ' +
        'According to the instruments there is no loss.',
    },
  },
  {
    level: 2,
    name: { hu: 'A hidegebb oldal', en: 'The colder side' },
    text: {
      hu:
        'Ami odalent áll, az nem lett több — csak nehezebb ledönteni. A legénység ' +
        'meleg ruhában alszik, és nem attól hideg.',
      en:
        'What stands below has not multiplied — it has only got harder to put down. The crew sleep ' +
        'in their coats, and it is not the cold that is doing it.',
    },
  },
  {
    level: 3,
    name: { hu: 'A csend a Kapu mögött', en: 'The silence behind the Gate' },
    text: {
      hu:
        'A Kapu felől már nem jön semmi. Nem elzárták: egyszerűen nincs mit hallani. ' +
        'Innentől amit visztek, azt ti visszitek.',
      en:
        'Nothing comes from the Gate any more. It has not been closed: there is simply nothing to ' +
        'hear. From here, whatever you carry, you carry.',
    },
  },
]

export function darkeningStep(level: number): DarkeningStep | undefined {
  return DARKENING_STEPS.find((step) => step.level === level)
}
