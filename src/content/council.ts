// The crew's council: the week the ship asks YOU for something.
//
// Loyalty and morale were facts about the crew that only ever came back to the
// players as numbers on a panel and, at the very bottom, as somebody walking off
// with the fuel. Between "fine" and "betrayal" there was nothing — no moment
// where the people on this ship said anything out loud.
//
// A council is that moment. Every so often the crew put something to the four of
// you, and the number of them behind it is decided by their loyalty. You can
// grant it, which costs the expedition something real, or refuse it, which costs
// you the crew a little more.
//
// Two things make it a system rather than a pop-up:
//
//   **The vote is a fact, not a mood.** How many are behind the motion is read
//   off the crew list — the same numbers the players have been watching drift
//   for weeks. A ship run well gets small motions it can afford; a ship run
//   badly gets the whole crew at the door.
//
//   **Refusing is allowed and is not free.** There is no correct answer. Turning
//   them down is often right, and it moves the loyalty that decides the next one
//   — which is how a run of refusals ends at `checkRestlessness`.
//
// Mechanically these ARE encounters, so they inherit the whole pipeline: the
// account of what a choice costs, the two-step confirmation, the seat that
// answers for it, and the rule that the week cannot end until it is answered.

import { registerEncounters } from './encounters'
import type { Encounter } from './encounters'
import type { Text } from '../engine/types'

/** How often the crew can put something to the table, in weeks. */
export const COUNCIL_INTERVAL = 6

/**
 * Below this, somebody is behind the motion.
 *
 * Seven is "steady" — the band where a person has nothing they need to say. The
 * moment somebody drops out of it they are counted, which means the tally is
 * exactly the thing the players have been watching on the crew screen.
 */
export const COUNCIL_SUPPORT_BELOW = 7

/** The share of the crew it takes for anybody to call a council at all. */
export const COUNCIL_QUORUM = 0.4

export const COUNCIL_MOTIONS: Encounter[] = [
  {
    id: 'council-rest-week',
    aboard: true,
    owner: 'cantor',
    title: { hu: 'Kérés: egy hét pihenő', en: 'Motion: a week off' },
    text: {
      hu:
        'Nem lázadás. Egy név a listán, aztán még egy, és a végén az egész menza áll ott. ' +
        'Egy hetet kérnek: nincs állomás, nincs műszak, csak alvás és a saját dolgaik. ' +
        '„Utána megyünk, ahova akartok.”',
      en:
        'It is not a mutiny. One name on a list, then another, and in the end the whole mess is ' +
        'standing there. They want one week: no stations, no shifts, sleep and their own things. ' +
        '“After that we go wherever you want.”',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Megkapják a hetet.', en: 'They get the week.' },
        costs: [],
        result: {
          hu:
            'Egy héten át semmi nem termel semmit, és a hajó mégis jobb hely lesz tőle. ' +
            'A folyosón megint beszélgetnek.',
          en:
            'For a week nothing produces anything, and the ship is a better place for it. ' +
            'There is talking in the corridor again.',
        },
        effects: [
          { k: 'resource', id: 'information', amount: -6 },
          { k: 'resource', id: 'morale', amount: 3 },
          { k: 'loyalty', amount: 2, who: 'all' },
        ],
      },
      {
        text: { hu: 'Nem. A Kapu számol.', en: 'No. The Gate is counting.' },
        costs: [],
        result: {
          hu:
            'Nem vitatkoznak. Szétszélednek, és mindenki visszamegy a helyére. ' +
            'Ez a rossz jel benne.',
          en:
            'They do not argue. They break up and everybody goes back to their post. ' +
            'That is the bad part of it.',
        },
        effects: [
          { k: 'resource', id: 'morale', amount: -1 },
          { k: 'loyalty', amount: -1, who: 'all' },
        ],
      },
    ],
  },
  {
    id: 'council-full-rations',
    aboard: true,
    owner: 'runesmith',
    title: { hu: 'Kérés: teljes fejadag', en: 'Motion: full rations' },
    text: {
      hu:
        'A raktár nyitva van, a fejadag mégis fél. Azt kérik, hogy egy hónapig egyenek rendesen. ' +
        '„Nem azért jöttünk ide, hogy számoljuk a konzervet.”',
      en:
        'The hold is open and the ration is still half. They want to eat properly for a month. ' +
        '“We did not come out here to count tins.”',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Egyenek.', en: 'Let them eat.' },
        costs: [],
        result: {
          hu: 'A menza hangos lesz. Az élelem gyorsabban fogy, és senki nem bánja.',
          en: 'The mess gets loud. The food goes faster, and nobody minds.',
        },
        effects: [
          { k: 'resource', id: 'food', amount: -8 },
          { k: 'resource', id: 'morale', amount: 2 },
          { k: 'loyalty', amount: 1, who: 'all' },
        ],
      },
      {
        text: { hu: 'Marad a fél adag.', en: 'The half ration stands.' },
        costs: [],
        result: {
          hu: 'A raktárkulcs a Rúnaszövőnél marad, és ezt mindenki megjegyzi.',
          en: 'The key to the hold stays with the Runeweaver, and everybody makes a note of it.',
        },
        effects: [{ k: 'loyalty', amount: -1, who: 'all' }],
      },
    ],
  },
  {
    id: 'council-name-the-dead',
    aboard: true,
    owner: 'cantor',
    title: { hu: 'Kérés: mondjuk ki a neveket', en: 'Motion: say the names' },
    text: {
      hu:
        'Akiket eddig elvesztettünk, azoknak nem volt semmi. Se szertartás, se egy perc csend. ' +
        'Azt kérik, hogy legyen — egyszer, rendesen, mindenki előtt.',
      en:
        'Those lost so far got nothing. No rite, not a minute of silence. They want one — once, ' +
        'properly, in front of everybody.',
    },
    tags: ['drift'],
    weight: 1,
    requires: { k: 'attentionAtLeast', value: 1 },
    choices: [
      {
        text: { hu: 'Megtartjuk.', en: 'We hold it.' },
        costs: [],
        result: {
          hu:
            'Egy órán át áll a hajó. Nevek, egyenként. Utána sokkal könnyebb megkérni bárkit ' +
            'bármire — és odalent valami meghallotta.',
          en:
            'For an hour the ship stands still. Names, one at a time. Afterwards it is far easier ' +
            'to ask anybody for anything — and something below heard it.',
        },
        effects: [
          { k: 'resource', id: 'morale', amount: 2 },
          { k: 'loyalty', amount: 2, who: 'all' },
          { k: 'attention', amount: 1 },
        ],
      },
      {
        text: { hu: 'Nincs rá idő.', en: 'There is no time.' },
        costs: [],
        result: {
          hu: 'Igazuk van, és ez a rosszabb. Nem mondanak semmit.',
          en: 'They are right, and that is the worse part. They say nothing.',
        },
        effects: [{ k: 'loyalty', amount: -1, who: 'all' }],
      },
    ],
  },
  {
    id: 'council-no-more-boarding',
    aboard: true,
    owner: 'surveyor',
    title: { hu: 'Kérés: ne a hajón harcoljunk', en: 'Motion: not on the ship' },
    text: {
      hu:
        'Ami a folyosókon történt, azt nem lehet elfelejteni. Azt kérik, hogy a következő ' +
        'ilyet ne engedjük ide be — bármibe kerül.',
      en:
        'What happened in the corridors cannot be unremembered. They want the next one kept ' +
        'outside — whatever it costs.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Megígérjük, és fizetünk érte.', en: 'We promise, and we pay for it.' },
        costs: [],
        result: {
          hu:
            'A Rúnaszövő végigmegy a zsilipeken, és beleköt mindenbe, ami tart. Drága hét volt, ' +
            'és a hajó azóta csendesebb.',
          en:
            'The Runeweaver walks the airlocks and binds everything that holds. An expensive week, ' +
            'and the ship has been quieter since.',
        },
        effects: [
          { k: 'resource', id: 'credits', amount: -20 },
          { k: 'loyalty', amount: 2, who: 'all' },
          { k: 'resource', id: 'hull', amount: 4 },
        ],
      },
      {
        text: {
          hu: 'Nem ígérünk semmit, amit nem tudunk megtartani.',
          en: 'We promise nothing we cannot keep.',
        },
        costs: [],
        result: {
          hu: 'Ezt tiszteletben tartják. És pontosan tudják, mit jelent.',
          en: 'They respect that. And they know exactly what it means.',
        },
        effects: [{ k: 'loyalty', amount: -1, who: 'all' }],
      },
    ],
  },
  {
    id: 'council-turn-back',
    aboard: true,
    owner: 'echoreader',
    title: { hu: 'Kérés: forduljunk vissza', en: 'Motion: turn back' },
    text: {
      hu:
        'Most először mondja ki valaki hangosan. Nem dühösen — fáradtan. ' +
        '„Amit eddig összeszedtünk, az elég. Vigyük haza, amíg van mit.”',
      en:
        'For the first time somebody says it out loud. Not angry — tired. ' +
        '“What we have is enough. Let us take it home while there is something to take.”',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: {
          hu: 'Megmondjuk nekik, meddig megyünk még.',
          en: 'We tell them how much further we go.',
        },
        costs: [],
        result: {
          hu:
            'Egy szám. Egy dátum. Nem az, amit hallani akartak, de valami, amihez tartani ' +
            'lehet magukat — és ettől megnyugszanak.',
          en:
            'A number. A date. Not what they wanted to hear, but something to hold on to — and ' +
            'that settles them.',
        },
        effects: [
          { k: 'resource', id: 'morale', amount: 1 },
          { k: 'loyalty', amount: 1, who: 'all' },
          { k: 'gateWeeks', amount: -1 },
        ],
      },
      {
        text: { hu: 'Nem beszélünk erről.', en: 'We are not discussing this.' },
        costs: [],
        result: {
          hu:
            'A kérdés nem szűnik meg attól, hogy nem válaszoltok rá. Csak lekerül a folyosóról ' +
            'a kabinokba.',
          en:
            'The question does not go away because you did not answer it. It just moves off the ' +
            'corridor and into the cabins.',
        },
        effects: [
          { k: 'resource', id: 'morale', amount: -1 },
          { k: 'loyalty', amount: -2, who: 'all' },
        ],
      },
    ],
  },
  {
    id: 'council-one-of-ours',
    aboard: true,
    title: { hu: 'Kérés: valaki menjen le velünk', en: 'Motion: one of you comes down' },
    text: {
      hu:
        'Nem a harcot kifogásolják. Azt, hogy a négy hős lemegy, ők meg fent várják a listát. ' +
        'Azt kérik, hogy a következő partraszállásra vigyetek le közülük valakit.',
      en:
        'It is not the fighting they object to. It is that the four of you go down and they wait ' +
        'up here for the list. They want one of their own taken on the next landing.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Lemegy valaki közületek.', en: 'One of you comes down.' },
        costs: [],
        result: {
          hu:
            'Ettől kezdve nem „a csapat” megy le, hanem mi. A különbség kicsi, és mindenki ' +
            'érzi.',
          en:
            'From now on it is not “the party” that goes down, it is us. The difference is small, ' +
            'and everybody feels it.',
        },
        effects: [
          { k: 'loyalty', amount: 2, who: 'all' },
          { k: 'resource', id: 'morale', amount: 1 },
        ],
      },
      {
        text: { hu: 'A partraszállás a mi dolgunk.', en: 'The landings are ours.' },
        costs: [],
        result: {
          hu: 'Ez is egy válasz. Nem az, amit vártak.',
          en: 'That is an answer too. Not the one they were waiting for.',
        },
        effects: [{ k: 'loyalty', amount: -1, who: 'all' }],
      },
    ],
  },
]

/** What the vote is called on the panel, given how many are behind it. */
export function councilTally(supporters: number, total: number): Text {
  return {
    hu: `A ${total} főből ${supporters}.`,
    en: `${supporters} of ${total}.`,
  }
}

registerEncounters(COUNCIL_MOTIONS)
