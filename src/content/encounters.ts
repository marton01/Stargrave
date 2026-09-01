// Encounters: the narrative engine of the expedition.
//
// These are where the stories come from. Each one is a situation, a handful of
// choices with real costs, and consequences that last for the rest of the run.
//
// A note on the card costs. Some choices are paid with CARDS from the heroes'
// decks — permanently lost, chosen by the players. That is deliberate: the
// non-combat layer spends the same resource as the combat layer, so a decision
// on the bridge is felt on the next landing. No new system to learn, and it
// genuinely hurts.
//
// Everything here is data, and everything the player reads is bilingual.

import type { HeroClassId, Text, TrialSymbol } from '../engine/types'
import type { ModuleId, ResourceId } from './ship'
import type { CrewTraitId } from './crew'
import type { PuzzleKind } from '../engine/puzzles/types'

export type EncounterTag =
  | 'drift'
  | 'station'
  | 'world'
  | 'anomaly'
  | 'ruins'
  | 'distress'
  | 'trade'

export type EncounterCost =
  | { k: 'resource'; id: ResourceId; amount: number }
  | { k: 'weeks'; amount: number }
  /** Lose cards carrying this symbol. The players choose which. */
  | { k: 'cards'; symbol: TrialSymbol; count: number }

export type EncounterEffect =
  | { k: 'resource'; id: ResourceId; amount: number }
  | { k: 'understanding'; amount: number }
  | { k: 'module'; id: ModuleId }
  | { k: 'crewJoin'; count: number }
  | { k: 'crewLost'; count: number }
  | { k: 'archive'; amount: number }
  | { k: 'revealMap'; columns: number }
  /** Hull damage, reduced by shield power and boarding wards. */
  | { k: 'hullRisk'; amount: number }
  /** A named relic, or one drawn from what the run has not found yet. */
  | { k: 'relic'; id?: string }
  /**
   * Louder, or quieter. Positive is scaled by the difficulty dial (and does
   * nothing at all when the Herald is switched off); negative always applies —
   * shedding attention is a favour and favours are not scaled away.
   */
  | { k: 'attention'; amount: number }
  /** Advancement marks. Without a hero, both of them. */
  | { k: 'heroXp'; amount: number; who?: HeroClassId }
  | { k: 'startMission'; flavour: 'boarding' | 'ruins' | 'explore' }
  | { k: 'startPuzzle'; kind?: PuzzleKind }
  /** Remember this for the rest of the expedition. */
  | { k: 'flag'; id: string }
  /** Remember this for good: it goes into the Archive and comes back next run. */
  | { k: 'mark'; id: string }
  /**
   * Move the Gate. Negative takes weeks away — the heaviest thing a decision can
   * do, because the countdown is the whole pressure of the game.
   */
  | { k: 'gateWeeks'; amount: number }
  /** Push the Darkening on or back a level. */
  | { k: 'darkening'; amount: number }
  /**
   * The situation is not over: this encounter follows it, once the result has
   * been read. A scene, in other words — and because it is an ordinary
   * encounter, it can have its own costs, requirements and further scenes.
   */
  | { k: 'then'; encounterId: string }

export type ChoiceRequirement =
  | { k: 'shieldsAtLeast'; value: number }
  | { k: 'moduleInstalled'; id: ModuleId }
  | { k: 'understandingAtLeast'; value: number }
  | { k: 'crewWithTrait'; trait: CrewTraitId }
  | { k: 'resourceAtLeast'; id: ResourceId; value: number }
  /** Something this expedition did. */
  | { k: 'flag'; id: string }
  | { k: 'noFlag'; id: string }
  /** Something an earlier expedition did. */
  | { k: 'mark'; id: string }
  /** At least this many relics aboard. */
  | { k: 'relicsAtLeast'; value: number }
  /** This much attention on the ship — the loud options open late. */
  | { k: 'attentionAtLeast'; value: number }

export type EncounterChoice = {
  text: Text
  costs: EncounterCost[]
  effects: EncounterEffect[]
  /** Shown once the choice has been taken. */
  result: Text
  requires?: ChoiceRequirement
}

export type Encounter = {
  id: string
  title: Text
  text: Text
  tags: EncounterTag[]
  weight: number
  /** Never repeats within one expedition. */
  once?: boolean
  /** Only appears once the Archive has opened it up. */
  archiveGated?: boolean
  /**
   * Never turns up on its own: it is a later scene of another encounter, reached
   * through a `then` effect. Keeping scenes as ordinary encounters means they
   * get costs, requirements and further scenes for free.
   */
  chained?: boolean
  /** Only appears if the expedition has this flag. */
  requiresFlag?: string
  /** Only appears if an earlier expedition left this mark. */
  requiresMark?: string
  choices: EncounterChoice[]
}

const walkAway: EncounterChoice = {
  text: { hu: 'Továbbmegyünk.', en: 'We move on.' },
  costs: [],
  effects: [],
  result: {
    hu: 'A hajó fordul, és a dolog a hátsó képernyőkön marad.',
    en: 'The ship turns, and the thing stays on the rear screens.',
  },
}

export const ENCOUNTERS: Encounter[] = [
  {
    id: 'drifting-hulk',
    title: { hu: 'Sodródó hajó', en: 'A drifting hulk' },
    text: {
      hu: 'Egy hajó fordul lassan a semmiben, fény nélkül. A jelzései harminc éve ismétlődnek, és nem hozzánk beszélnek.',
      en: 'A ship turns slowly in the dark, unlit. Its beacons have been repeating for thirty years, and they are not speaking to us.',
    },
    tags: ['drift', 'station'],
    weight: 10,
    choices: [
      {
        text: { hu: 'Átszállunk.', en: 'We board it.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'hullRisk', amount: 3 },
          { k: 'resource', id: 'credits', amount: 8 },
          { k: 'resource', id: 'fuel', amount: 4 },
          { k: 'archive', amount: 1 },
        ],
        result: {
          hu: 'A raktér félig ép. Alkatrészt és üzemanyagot hoztok el, meg egy naplót, amit senki nem fejezett be.',
          en: 'Half the hold is intact. You bring back parts and fuel, and a log nobody finished.',
        },
      },
      {
        text: {
          hu: 'Először pajzsot fel, aztán át. (Pajzs 2+)',
          en: 'Shields up first, then across. (Shields 2+)',
        },
        requires: { k: 'shieldsAtLeast', value: 2 },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'resource', id: 'credits', amount: 8 },
          { k: 'resource', id: 'fuel', amount: 4 },
          { k: 'resource', id: 'information', amount: 3 },
          { k: 'archive', amount: 1 },
        ],
        result: {
          hu: 'A pajzs fogta fel, ami a zsilipben várt. Mindent elhoztok, és semmit nem hagytok ott.',
          en: 'The shields caught whatever was waiting in the airlock. You take everything and leave nothing behind.',
        },
      },
      {
        text: { hu: 'Csak a jelzést olvassuk le.', en: 'We only read the beacon.' },
        costs: [],
        effects: [{ k: 'resource', id: 'information', amount: 2 }],
        result: {
          hu: 'Nem segélykérés. Egy figyelmeztetés, és nem előre szól, hanem hátra.',
          en: 'Not a distress call. A warning — and it is not pointing forward but back.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'distress-call',
    title: { hu: 'Vészjelzés', en: 'A distress call' },
    text: {
      hu: 'Élő jel. Emberi hang, akadozva, egy rendszerből három hét kitérőre. Nem tudjuk, mióta szól.',
      en: 'A live signal. A human voice, breaking up, from a system three weeks off course. We do not know how long it has been calling.',
    },
    tags: ['distress', 'drift'],
    weight: 9,
    choices: [
      {
        text: { hu: 'Odamegyünk.', en: 'We go.' },
        costs: [
          { k: 'weeks', amount: 3 },
          { k: 'resource', id: 'fuel', amount: 3 },
        ],
        effects: [
          { k: 'crewJoin', count: 2 },
          { k: 'resource', id: 'morale', amount: 3 },
          { k: 'archive', amount: 1 },
        ],
        result: {
          hu: 'Ketten élnek. Nem kérdezik, hova tartunk — csak beszállnak és dolgozni kezdenek.',
          en: 'Two of them are alive. They do not ask where we are going — they come aboard and start working.',
        },
      },
      {
        text: {
          hu: 'Válaszolunk, de nem térünk el.',
          en: 'We answer, but we hold our course.',
        },
        costs: [],
        effects: [{ k: 'resource', id: 'morale', amount: -2 }],
        result: {
          hu: 'A hang megköszöni. Aztán elhallgat, és a hídon senki nem szól három napig.',
          en: 'The voice thanks us. Then it stops, and nobody on the bridge speaks for three days.',
        },
      },
      {
        text: { hu: 'Kikapcsoljuk a vevőt.', en: 'We shut the receiver off.' },
        costs: [],
        effects: [{ k: 'resource', id: 'morale', amount: -3 }],
        result: {
          hu: 'Csend. Ez a fajta csend nem üres.',
          en: 'Silence. This kind of silence is not empty.',
        },
      },
    ],
  },

  {
    id: 'alien-technology',
    title: { hu: 'Idegen technológia', en: 'Alien technology' },
    text: {
      hu: 'Egy szerkezet, ami még mindig működik. Nem tudjuk, mit tesz. Beilleszthető a hajó rendszerébe — de nem tudjuk, mit visz el érte.',
      en: 'A device that is still running. We do not know what it does. It would fit into the ship’s systems — but we do not know what it takes in return.',
    },
    tags: ['anomaly', 'ruins'],
    weight: 8,
    choices: [
      {
        text: { hu: 'Beépítjük vakon.', en: 'We install it blind.' },
        costs: [],
        effects: [
          { k: 'module', id: 'reactorTap' },
          { k: 'resource', id: 'morale', amount: -2 },
          { k: 'hullRisk', amount: 2 },
        ],
        result: {
          hu: 'A reaktor kimenete megnőtt. Valami közben halkan számol a falban, és nem tudjuk, mit.',
          en: 'Reactor output is up. Something in the wall is quietly counting, and we do not know what.',
        },
      },
      {
        text: {
          hu: 'Előbb a Labor elemzi. (Információ 6)',
          en: 'The Lab analyses it first. (6 Information)',
        },
        requires: { k: 'resourceAtLeast', id: 'information', value: 6 },
        costs: [
          { k: 'resource', id: 'information', amount: 6 },
          { k: 'weeks', amount: 1 },
        ],
        effects: [
          { k: 'module', id: 'runeAmplifier' },
          { k: 'understanding', amount: 2 },
        ],
        result: {
          hu: 'Nem reaktor. Erősítő — és most tudjuk, mit erősít. A rúnamag ettől kezdve többet ad.',
          en: 'Not a reactor. An amplifier — and now we know what it amplifies. The rune core gives more from here on.',
        },
      },
      {
        text: {
          hu: 'Az idegen származású legénységtag megnézi. (jellemvonás kell)',
          en: 'The crew member of alien descent takes a look. (trait required)',
        },
        requires: { k: 'crewWithTrait', trait: 'alienBorn' },
        costs: [],
        effects: [
          { k: 'module', id: 'echoVault' },
          { k: 'understanding', amount: 3 },
          { k: 'archive', amount: 2 },
        ],
        result: {
          hu: 'Egy pillantás elég neki. „Ez nem gép. Ez emlékezet." És megmutatja, hol nyílik.',
          en: '“This is not a machine. This is memory.” One look is enough, and they show us where it opens.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'refugees',
    title: { hu: 'Menekültek', en: 'Refugees' },
    text: {
      hu: 'Egy bolygó felszínén negyven ember áll a leszállópályán, csomagokkal. Nem tudják, hogy nincs hova menni.',
      en: 'Forty people stand on a landing strip with their bags. They do not know there is nowhere to go.',
    },
    tags: ['world'],
    weight: 8,
    choices: [
      {
        text: { hu: 'Felvesszük, akit lehet.', en: 'We take aboard who we can.' },
        costs: [{ k: 'resource', id: 'food', amount: 8 }],
        effects: [
          { k: 'crewJoin', count: 2 },
          { k: 'resource', id: 'morale', amount: 2 },
        ],
        result: {
          hu: 'Kettő közülük ért a hajóhoz. A többi marad, és ezt mindenki tudja a fedélzeten.',
          en: 'Two of them know ships. The rest stay, and everyone aboard knows it.',
        },
      },
      {
        text: {
          hu: 'Élelmet hagyunk nekik, de nem visszük őket.',
          en: 'We leave them food but not passage.',
        },
        costs: [{ k: 'resource', id: 'food', amount: 6 }],
        effects: [
          { k: 'resource', id: 'credits', amount: 6 },
          { k: 'resource', id: 'morale', amount: -1 },
        ],
        result: {
          hu: 'Amit adhattak, azt odaadták. Egy térképet is, amin egy hely be van körözve.',
          en: 'They gave what they could, including a chart with one place circled.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'trader-swarm',
    title: { hu: 'Kereskedő-raj', en: 'A trader swarm' },
    text: {
      hu: 'Húsz kicsi hajó, egymáshoz kötözve. Nem kérdezik, kik vagyunk. Csak azt, mit adunk.',
      en: 'Twenty small ships lashed together. They do not ask who we are. Only what we have.',
    },
    tags: ['trade', 'station'],
    weight: 10,
    choices: [
      {
        text: {
          hu: 'Információt adunk el. (6 Információ → 14 kredit)',
          en: 'We sell information. (6 Information → 14 credits)',
        },
        requires: { k: 'resourceAtLeast', id: 'information', value: 6 },
        costs: [{ k: 'resource', id: 'information', amount: 6 }],
        effects: [{ k: 'resource', id: 'credits', amount: 14 }],
        result: {
          hu: 'Nem kérdezik, honnan van. Ez az egyetlen jó dolog bennük.',
          en: 'They do not ask where it came from. That is the one good thing about them.',
        },
      },
      {
        text: {
          hu: 'Üzemanyagot vásárolunk. (10 kredit → 8 üzemanyag)',
          en: 'We buy fuel. (10 credits → 8 fuel)',
        },
        requires: { k: 'resourceAtLeast', id: 'credits', value: 10 },
        costs: [{ k: 'resource', id: 'credits', amount: 10 }],
        effects: [{ k: 'resource', id: 'fuel', amount: 8 }],
        result: {
          hu: 'Drága, és mindketten tudjuk, hogy nincs máshol.',
          en: 'Expensive, and both sides know there is nowhere else.',
        },
      },
      {
        text: {
          hu: 'Élelmet vásárolunk. (8 kredit → 12 élelem)',
          en: 'We buy food. (8 credits → 12 food)',
        },
        requires: { k: 'resourceAtLeast', id: 'credits', value: 8 },
        costs: [{ k: 'resource', id: 'credits', amount: 8 }],
        effects: [{ k: 'resource', id: 'food', amount: 12 }],
        result: {
          hu: 'Szárított, névtelen, és elég három hétre.',
          en: 'Dried, nameless, and enough for three weeks.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'ancient-signal',
    title: { hu: 'Ősi jelzés', en: 'An ancient signal' },
    text: {
      hu: 'Nem rádió. A rúnamag rezonál rá. Valami hív, és a hívás nem szavakból áll.',
      en: 'Not radio. The rune core resonates with it. Something is calling, and the call is not made of words.',
    },
    tags: ['anomaly', 'ruins'],
    weight: 9,
    choices: [
      {
        text: { hu: 'Lemegyünk és megfejtjük.', en: 'We go down and decipher it.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [{ k: 'startPuzzle' }],
        result: {
          hu: 'A szerkezet ott áll, ahol a jel ered. Csak ki kell nyitni.',
          en: 'The mechanism stands where the signal begins. It only has to be opened.',
        },
      },
      {
        text: {
          hu: 'Erővel törjük fel. (2 lap ⚒ szimbólummal)',
          en: 'We force it open. (2 cards with ⚒)',
        },
        costs: [{ k: 'cards', symbol: 'force', count: 2 }],
        effects: [
          { k: 'resource', id: 'credits', amount: 10 },
          { k: 'resource', id: 'information', amount: 3 },
        ],
        result: {
          hu: 'Kinyílt. Valami eltörött közben, és nem a szerkezetben.',
          en: 'It opened. Something broke doing it, and not in the mechanism.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'dead-garden',
    title: { hu: 'Halott kert', en: 'A dead garden' },
    text: {
      hu: 'Egy kilométeres kupola, és benne minden növény egyszerre halt meg, ugyanabban a pillanatban. Néhány mag még él.',
      en: 'A dome a kilometre across, and inside it every plant died at once, in the same instant. A few seeds are still alive.',
    },
    tags: ['world', 'ruins'],
    weight: 8,
    choices: [
      {
        text: { hu: 'Magot gyűjtünk.', en: 'We gather seed.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'resource', id: 'food', amount: 14 },
          { k: 'resource', id: 'morale', amount: 1 },
        ],
        result: {
          hu: 'Az egyik legénységtag elkezdett palántát nevelni a gépteremben. Senki nem szólt rá.',
          en: 'One of the crew has started raising seedlings in the engine room. Nobody has told them to stop.',
        },
      },
      {
        text: {
          hu: 'Megvizsgáljuk, mi ölte meg. (2 lap ◈ szimbólummal)',
          en: 'We study what killed it. (2 cards with ◈)',
        },
        costs: [{ k: 'cards', symbol: 'insight', count: 2 }],
        effects: [
          { k: 'understanding', amount: 3 },
          { k: 'resource', id: 'information', amount: 4 },
        ],
        result: {
          hu: 'Nem méreg, nem hideg, nem kór. Egyszerűen abbamaradt bennük valami, amit addig valaki tartott.',
          en: 'Not poison, not cold, not disease. Something in them simply stopped — something that until then had been held.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'silent-choir',
    title: { hu: 'A néma kórus', en: 'The silent choir' },
    text: {
      hu: 'Nyolc Kórus-fantom lebeg egy körben, mozdulatlanul, egymás felé fordulva. Nem támadnak. Énekelnek, csak nem hallható.',
      en: 'Eight Choir Wraiths hang in a circle, motionless, facing one another. They do not attack. They are singing; it simply cannot be heard.',
    },
    tags: ['anomaly'],
    weight: 7,
    choices: [
      {
        text: { hu: 'Hallgatjuk.', en: 'We listen.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'understanding', amount: 4 },
          { k: 'resource', id: 'morale', amount: -3 },
        ],
        result: {
          hu: 'Egy óra után mindenki lement a hídról. De most már tudjuk, mit hallottak, akik itt éltek.',
          en: 'After an hour everyone had left the bridge. But now we know what the people who lived here heard.',
        },
      },
      {
        text: { hu: 'Megzavarjuk a kört.', en: 'We break the circle.' },
        costs: [],
        effects: [{ k: 'startMission', flavour: 'boarding' }],
        result: {
          hu: 'Az ének megszakadt. Mind a nyolc egyszerre fordult felénk.',
          en: 'The song stopped. All eight turned towards us at once.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'gate-echo',
    title: { hu: 'A Kapu visszhangja', en: 'An echo of the Gate' },
    text: {
      hu: 'Egy második kapu, kisebb, és zárva. A rúnái ugyanazok, mint amin bejöttünk — csak a sorrend más.',
      en: 'A second gate, smaller, and shut. Its runes are the same as the one we came through — only the order differs.',
    },
    tags: ['ruins', 'anomaly'],
    weight: 7,
    once: true,
    choices: [
      {
        text: { hu: 'Megfejtjük a sorrendet.', en: 'We work out the order.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [{ k: 'startPuzzle', kind: 'runeDecode' }],
        result: {
          hu: 'Tizenkét rúna, és egy helyes sorrend. A hajó rezonál, ahogy közeledünk hozzá.',
          en: 'Twelve runes and one correct order. The ship resonates as we get closer to it.',
        },
      },
      {
        text: {
          hu: 'Összevetjük az otthoni Kapuval. (Megértés 3+)',
          en: 'We compare it with the Gate back home. (Understanding 3+)',
        },
        requires: { k: 'understandingAtLeast', value: 3 },
        costs: [],
        effects: [
          { k: 'understanding', amount: 3 },
          { k: 'revealMap', columns: 2 },
          { k: 'archive', amount: 2 },
        ],
        result: {
          hu: 'Nem kijárat. Bejárat — és nem mi nyitottuk ki elsőnek.',
          en: 'Not an exit. An entrance — and we were not the first to open it.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'scavenger-claim',
    title: { hu: 'Dúlók követelése', en: 'A scavenger claim' },
    text: {
      hu: 'Négy hajó áll az útban. Nem lőnek. Az egyik ad egy számot, és vár.',
      en: 'Four ships block the way. They do not fire. One of them sends a number and waits.',
    },
    tags: ['station', 'drift'],
    weight: 8,
    choices: [
      {
        text: { hu: 'Fizetünk. (12 kredit)', en: 'We pay. (12 credits)' },
        requires: { k: 'resourceAtLeast', id: 'credits', value: 12 },
        costs: [{ k: 'resource', id: 'credits', amount: 12 }],
        effects: [{ k: 'revealMap', columns: 1 }],
        result: {
          hu: 'Elállnak, és mellékesen elárulják, mi van előttünk. Ennyit legalább megért.',
          en: 'They move aside, and mention in passing what lies ahead. That much it was worth.',
        },
      },
      {
        text: { hu: 'Átmegyünk rajtuk.', en: 'We go through them.' },
        costs: [],
        effects: [{ k: 'startMission', flavour: 'boarding' }],
        result: {
          hu: 'A zsilipünkhöz jönnek. Ez már nem hajócsata, hanem folyosóharc.',
          en: 'They come to our airlock. This is no longer a ship fight but a corridor fight.',
        },
      },
      {
        text: {
          hu: 'Megmutatjuk a pajzsot. (Pajzs 3)',
          en: 'We show them the shields. (Shields 3)',
        },
        requires: { k: 'shieldsAtLeast', value: 3 },
        costs: [],
        effects: [
          { k: 'resource', id: 'morale', amount: 1 },
          { k: 'resource', id: 'credits', amount: 4 },
        ],
        result: {
          hu: 'Számolnak, és nem érdemes nekik. Az egyikük még hagy is valamit, mintegy bocsánatkérésül.',
          en: 'They do the arithmetic and it does not add up for them. One even leaves something behind, by way of apology.',
        },
      },
    ],
  },

  {
    id: 'crystal-forest',
    title: { hu: 'Kristályerdő', en: 'A crystal forest' },
    text: {
      hu: 'Nem növények. Nem is ásványok. Ötven méter magasak, és minden reggel máshol állnak.',
      en: 'Not plants. Not minerals either. Fifty metres tall, and every morning they stand somewhere else.',
    },
    tags: ['world', 'anomaly'],
    weight: 8,
    choices: [
      {
        text: { hu: 'Bemegyünk és felmérjük.', en: 'We go in and survey it.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [{ k: 'startMission', flavour: 'explore' }],
        result: {
          hu: 'A csapat leszáll. A talaj nem mindenhol tartja meg őket.',
          en: 'The party lands. The ground does not hold everywhere.',
        },
      },
      {
        text: { hu: 'Csak mintát veszünk a pereméről.', en: 'We only sample the edge.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'information', amount: 3 },
          { k: 'resource', id: 'credits', amount: 5 },
        ],
        result: {
          hu: 'A minta a laborban tovább nő. Ezt még senki nem meri jelenteni.',
          en: 'The sample keeps growing in the lab. Nobody has dared to write that up yet.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'the-watcher',
    title: { hu: 'A figyelő', en: 'The watcher' },
    text: {
      hu: 'Egy istengép-töredék áll a rom közepén, és forog velünk. Nem támad. Követ.',
      en: 'A godmachine shard stands at the centre of the ruin, turning to follow us. It does not attack. It watches.',
    },
    tags: ['ruins'],
    weight: 7,
    choices: [
      {
        text: { hu: 'Kikerüljük, és dolgozunk.', en: 'We work around it.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'startMission', flavour: 'explore' },
          { k: 'resource', id: 'morale', amount: -1 },
        ],
        result: {
          hu: 'A csapat lemegy, és egész idő alatt hátrafelé figyel.',
          en: 'The party goes down, and spends the whole time watching their backs.',
        },
      },
      {
        text: { hu: 'Kiütjük.', en: 'We put it down.' },
        costs: [],
        effects: [{ k: 'startMission', flavour: 'ruins' }],
        result: {
          hu: 'Egyet lépett előre. Csak egyet.',
          en: 'It took one step forward. Only one.',
        },
      },
      {
        text: {
          hu: 'Megkérdezzük. (Megértés 8+)',
          en: 'We ask it. (Understanding 8+)',
        },
        requires: { k: 'understandingAtLeast', value: 8 },
        costs: [],
        effects: [
          { k: 'understanding', amount: 4 },
          { k: 'archive', amount: 3 },
        ],
        result: {
          hu: 'Válaszol. Nem hanggal. És az, amit mond, nem rólunk szól, hanem arról, hogy mit hagytak itt őrizni.',
          en: 'It answers. Not with sound. And what it says is not about us, but about what it was left here to guard.',
        },
      },
    ],
  },

  {
    id: 'sealed-vault',
    title: { hu: 'Lezárt kamra', en: 'A sealed vault' },
    text: {
      hu: 'Nincs zsanér, nincs zár, nincs kilincs. Egy fal, ami tudja, hogy ott vagyunk.',
      en: 'No hinge, no lock, no handle. A wall that knows we are here.',
    },
    tags: ['ruins'],
    weight: 9,
    choices: [
      {
        text: { hu: 'Megfejtjük.', en: 'We solve it.' },
        costs: [],
        effects: [{ k: 'startPuzzle' }],
        result: {
          hu: 'A minta ott van a felszínen. Csak nem betűkből áll.',
          en: 'The pattern is right there on the surface. It is simply not made of letters.',
        },
      },
      {
        text: {
          hu: 'Erővel. (3 lap ⚒ szimbólummal)',
          en: 'By force. (3 cards with ⚒)',
        },
        costs: [{ k: 'cards', symbol: 'force', count: 3 }],
        effects: [
          { k: 'resource', id: 'credits', amount: 14 },
          { k: 'hullRisk', amount: 2 },
        ],
        result: {
          hu: 'Bejutottunk. A kamra tartalma megvan, de valami odabent nem tetszett neki.',
          en: 'We got in. The vault’s contents are ours, though something inside took it badly.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'wounded-wraith',
    title: { hu: 'Sebzett fantom', en: 'A wounded wraith' },
    text: {
      hu: 'Egy Kórus-fantom beszorult egy összeomlott folyosóba. Nem tud kijönni, és nem hal meg.',
      en: 'A Choir Wraith is caught in a collapsed corridor. It cannot get out, and it does not die.',
    },
    tags: ['ruins', 'anomaly'],
    weight: 6,
    choices: [
      {
        text: { hu: 'Kiengedjük.', en: 'We let it out.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'morale', amount: 2 },
          { k: 'understanding', amount: 1 },
          { k: 'flag', id: 'wraith-freed' },
        ],
        result: {
          hu:
            'Nem támad. Elindul valamerre, és az útvonala nem véletlen. Amerre megy, arra megyünk mi is.',
          en:
            'It does not attack. It sets off somewhere, and its heading is not random. Where it goes is ' +
            'where we are going too.',
        },
      },
      {
        text: { hu: 'Tanulmányozzuk, amíg ott van.', en: 'We study it while it is stuck.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'resource', id: 'information', amount: 6 },
          { k: 'understanding', amount: 2 },
          { k: 'resource', id: 'morale', amount: -2 },
          { k: 'flag', id: 'wraith-studied' },
        ],
        result: {
          hu:
            'Hat nap alatt megtudtuk, miből áll. A hetediken senki nem akart bemenni hozzá. ' +
            'A kórus, amiből énekelt, azóta egy hanggal kevesebb — és ezt valaki számon tartja.',
          en:
            'In six days we learned what it is made of. On the seventh nobody wanted to go in. ' +
            'The choir it sang in is one voice short now, and somebody is keeping count.',
        },
      },
      walkAway,
    ],
  },

  // --------------------------------------------------------- the wraith, later
  //
  // Two follow-ups to `wounded-wraith`, one per decision. Neither can turn up on
  // its own: each needs the flag its decision left behind, and the star map does
  // not have to have guessed it would be needed — see `encounterAtNode`.

  {
    id: 'wraith-returns',
    title: { hu: 'Ugyanaz a hang', en: 'The same voice' },
    text: {
      hu:
        'A fantom, amit kiengedtünk, ott áll az útban. Nem közeledik. Egy irányba fordul, aztán ' +
        'vissza ránk, és megvárja, hogy értsük.',
      en:
        'The wraith we let out is standing in the way. It does not approach. It turns towards one ' +
        'heading, then back to us, and waits for us to understand.',
    },
    tags: ['ruins', 'anomaly', 'drift'],
    weight: 8,
    once: true,
    requiresFlag: 'wraith-freed',
    choices: [
      {
        text: { hu: 'Megyünk utána.', en: 'We follow it.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'revealMap', columns: 2 },
          { k: 'then', encounterId: 'wraith-deep' },
        ],
        result: {
          hu:
            'Egy héten át vezet, és nem néz vissza egyszer sem. Aztán megáll egy hely előtt, ' +
            'ami nincs a térképeinken.',
          en:
            'It leads for a week and never once looks back. Then it stops in front of a place ' +
            'that is not on our charts.',
        },
      },
      {
        text: { hu: 'Köszönjük, de dolgunk van.', en: 'Our thanks, but we have work.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'morale', amount: -1 },
          { k: 'mark', id: 'refused-the-guide' },
        ],
        result: {
          hu:
            'Elfordul, és nem siet. A legénység egy része sokáig nézi utána, és nem mondja ki, ' +
            'amit gondol. Ezt valahol feljegyezték — nem mi.',
          en:
            'It turns away, unhurried. Part of the crew watches it go for a long time and does not ' +
            'say what they are thinking. This was written down somewhere. Not by us.',
        },
      },
    ],
  },

  {
    id: 'wraith-deep',
    title: { hu: 'Amit meg akart mutatni', en: 'What it wanted to show us' },
    text: {
      hu:
        'Nem rom, nem hajó. Egy kapu-forma, félig a kőben, és nem működik. A fantom nem megy be. ' +
        'Leül elé, ahogy egy kutya ül a csukott ajtó előtt.',
      en:
        'Not a ruin and not a ship. A gate-shape, half in the rock, and dead. The wraith does not ' +
        'go in. It sits down in front of it the way a dog sits at a shut door.',
    },
    tags: ['ruins', 'anomaly'],
    weight: 0,
    chained: true,
    choices: [
      {
        text: { hu: 'Kinyitjuk neki.', en: 'We open it for it.' },
        costs: [{ k: 'cards', symbol: 'force', count: 2 }],
        effects: [
          { k: 'understanding', amount: 3 },
          { k: 'gateWeeks', amount: 3 },
          { k: 'mark', id: 'opened-the-second-gate' },
        ],
        result: {
          hu:
            'Két rúnát törünk szét hozzá, és a forma felismeri őket. Nem megy át rajta semmi — ' +
            'de ami a mi Kapunkat tartja, az egy kicsit könnyebben tartja azóta. A fantom nem jön ' +
            'velünk tovább. Nem is kell.',
          en:
            'We break two runes to do it, and the shape recognises them. Nothing crosses — but ' +
            'whatever holds our own Gate holds it a little more easily from then on. The wraith does ' +
            'not come any further. It does not need to.',
        },
      },
      {
        text: { hu: 'Csak felmérjük, és megyünk.', en: 'We survey it and move on.' },
        costs: [],
        effects: [
          { k: 'understanding', amount: 1 },
          { k: 'resource', id: 'information', amount: 8 },
        ],
        result: {
          hu: 'Minden mérésünk megvan róla. A fantom ott marad ülve, és nem fordul utánunk.',
          en: 'Every measurement is ours. The wraith stays sitting there and does not turn after us.',
        },
      },
    ],
  },

  {
    id: 'wraith-chorus',
    title: { hu: 'A kórus számol', en: 'The choir keeps count' },
    text: {
      hu:
        'Három fantom áll a hajó előtt, egy vonalban. Nem támadnak. Ugyanazt a hangot ismétlik, ' +
        'amit hat napon át hallgattunk a mérőműszereken.',
      en:
        'Three wraiths stand in a line in front of the ship. They do not attack. They repeat the ' +
        'one voice we listened to for six days on the instruments.',
    },
    tags: ['ruins', 'anomaly', 'drift'],
    weight: 8,
    once: true,
    requiresFlag: 'wraith-studied',
    choices: [
      {
        text: { hu: 'Visszaadjuk a felvételeket.', en: 'We give the recordings back.' },
        costs: [{ k: 'resource', id: 'information', amount: 8 }],
        effects: [
          { k: 'resource', id: 'morale', amount: 2 },
          { k: 'mark', id: 'gave-the-voice-back' },
        ],
        result: {
          hu:
            'Kiírjuk, ami a mérésekből volt, és hagyjuk kint. Amikor visszanézünk, a vonal már ' +
            'nem áll ott. A hang viszont teljes.',
          en:
            'We write out what the instruments held and leave it outside. When we look again the ' +
            'line is gone. The voice, though, is whole.',
        },
      },
      {
        text: { hu: 'Nem adjuk. Álljunk készenlétbe.', en: 'We keep it. Stand ready.' },
        costs: [],
        effects: [
          { k: 'darkening', amount: 1 },
          { k: 'startMission', flavour: 'boarding' },
        ],
        result: {
          hu: 'A vonal nem szakad meg. Egyszerűen közelebb kerül, és már a fedélzeten van.',
          en: 'The line does not break. It simply gets closer, and then it is aboard.',
        },
      },
      {
        text: { hu: 'Cserét ajánlunk.', en: 'We offer a trade.' },
        costs: [{ k: 'cards', symbol: 'insight', count: 1 }],
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'resource', id: 'morale', amount: -1 },
        ],
        requires: { k: 'understandingAtLeast', value: 4 },
        result: {
          hu:
            'Egy rúnát adunk oda helyette — a magunkéból. Elfogadják, és a csere közben egy ' +
            'pillanatra érteni is engedik, mit vettünk el tőlük.',
          en:
            'We give a rune of our own instead. They accept, and for a moment in the exchange they ' +
            'let us understand what we took.',
        },
      },
    ],
  },

  {
    id: 'fuel-bloom',
    title: { hu: 'Üzemanyag-virágzás', en: 'A fuel bloom' },
    text: {
      hu: 'A gázköd egy szakaszában sűrűbb minden, mint kellene. Kimeríthető, de közel kell menni.',
      en: 'One stretch of the nebula is denser than it has any right to be. Harvestable, but you have to go close.',
    },
    tags: ['anomaly', 'drift'],
    weight: 9,
    choices: [
      {
        text: { hu: 'Bemerítünk.', en: 'We dip in.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'fuel', amount: 12 },
          { k: 'hullRisk', amount: 3 },
        ],
        result: {
          hu: 'A tankok tele. A külső burkolat kevésbé.',
          en: 'The tanks are full. The outer plating rather less so.',
        },
      },
      {
        text: {
          hu: 'Óvatosan, pajzs alatt. (Pajzs 2+)',
          en: 'Carefully, under shields. (Shields 2+)',
        },
        requires: { k: 'shieldsAtLeast', value: 2 },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [{ k: 'resource', id: 'fuel', amount: 10 }],
        result: {
          hu: 'Lassabb, és nem kerül semmibe. Néha ilyen egyszerű.',
          en: 'Slower, and it costs nothing. Sometimes it really is that simple.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'broken-sentinel',
    title: { hu: 'Törött őrszem', en: 'A broken sentinel' },
    text: {
      hu: 'Egy Rúnaőrző fekszik a padlón, kettétörve. A rúnái még izzanak. Nem mozdul.',
      en: 'A Rune Sentinel lies broken on the floor. Its runes still glow. It does not move.',
    },
    tags: ['ruins'],
    weight: 8,
    choices: [
      {
        text: { hu: 'Szétbontjuk alkatrészért.', en: 'We strip it for parts.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'credits', amount: 9 },
          { k: 'resource', id: 'hull', amount: 4 },
        ],
        result: {
          hu: 'A páncélzata jobb, mint a miénk. Most már a miénk.',
          en: 'Its plating is better than ours. Now it is ours.',
        },
      },
      {
        text: {
          hu: 'Megjavítjuk, és hagyjuk, hogy őrizzen. (2 lap ⚒)',
          en: 'We repair it and let it guard. (2 cards with ⚒)',
        },
        costs: [{ k: 'cards', symbol: 'force', count: 2 }],
        effects: [
          { k: 'module', id: 'boardingWards' },
          { k: 'understanding', amount: 1 },
        ],
        result: {
          hu: 'Feláll, és nem minket néz. A zsilipeinkbe azóta rúnák vannak égve.',
          en: 'It stands up, and it is not looking at us. There have been runes burned into our airlocks ever since.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'the-archivist',
    title: { hu: 'Az archivista', en: 'The archivist' },
    text: {
      hu: 'Egy állomás, egyetlen lakóval. Nem kereskedik. Cserél: tudást tudásért.',
      en: 'A station with a single occupant. They do not trade. They exchange: knowledge for knowledge.',
    },
    tags: ['station'],
    weight: 8,
    choices: [
      {
        text: {
          hu: 'Elmondjuk, mit láttunk. (8 Információ → megértés)',
          en: 'We tell them what we have seen. (8 Information → understanding)',
        },
        requires: { k: 'resourceAtLeast', id: 'information', value: 8 },
        costs: [{ k: 'resource', id: 'information', amount: 8 }],
        effects: [
          { k: 'understanding', amount: 4 },
          { k: 'archive', amount: 2 },
        ],
        result: {
          hu: 'Végighallgat, aztán elmondja, mit hallgatott el az előző expedíció.',
          en: 'They hear us out, then tell us what the previous expedition left unsaid.',
        },
      },
      {
        text: {
          hu: 'Eladjuk, amit tudunk. (10 Információ → 20 kredit)',
          en: 'We sell what we know. (10 Information → 20 credits)',
        },
        requires: { k: 'resourceAtLeast', id: 'information', value: 10 },
        costs: [{ k: 'resource', id: 'information', amount: 10 }],
        effects: [{ k: 'resource', id: 'credits', amount: 20 }],
        result: {
          hu: 'Fizet, és közben úgy néz ránk, mint aki tudja, mit adtunk el.',
          en: 'They pay, and look at us like someone who knows exactly what we sold.',
        },
      },
      {
        text: { hu: 'Kérdezzük a Csillagsírról.', en: 'We ask about the Stargrave.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'revealMap', columns: 3 },
        ],
        result: {
          hu: 'Elmondja, merre van. Aztán megkérdezi, biztosan oda akarunk-e menni.',
          en: 'They tell us the way. Then they ask whether we are sure we want to go.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'mutiny-whisper',
    title: { hu: 'Suttogás a fedélzeten', en: 'A whisper below decks' },
    text: {
      hu: 'Nem lázadás. Még nem. Csak egy kérdés, amit hangosan is kimondtak: minek megyünk tovább?',
      en: 'Not a mutiny. Not yet. Just a question somebody said out loud: why are we still going?',
    },
    tags: ['drift'],
    weight: 7,
    choices: [
      {
        text: {
          hu: 'Elmondjuk nekik, mit tudunk. (Megértés 3+)',
          en: 'We tell them what we know. (Understanding 3+)',
        },
        requires: { k: 'understandingAtLeast', value: 3 },
        costs: [],
        effects: [{ k: 'resource', id: 'morale', amount: 4 }],
        result: {
          hu: 'A hídon csend lett, de más csend. Mindenki visszament a helyére.',
          en: 'The bridge went quiet, but a different quiet. Everyone went back to their post.',
        },
      },
      {
        text: {
          hu: 'Extra fejadagot osztunk.',
          en: 'We hand out extra rations.',
        },
        requires: { k: 'resourceAtLeast', id: 'food', value: 8 },
        costs: [{ k: 'resource', id: 'food', amount: 8 }],
        effects: [{ k: 'resource', id: 'morale', amount: 3 }],
        result: {
          hu: 'Egy jó vacsora. Ez most elég volt.',
          en: 'One good dinner. That was enough for now.',
        },
      },
      {
        text: { hu: 'Nem foglalkozunk vele.', en: 'We let it pass.' },
        costs: [],
        effects: [{ k: 'resource', id: 'morale', amount: -2 }],
        result: {
          hu: 'A kérdés nem tűnt el. Csak lejjebb ment.',
          en: 'The question did not go away. It only went further down.',
        },
      },
    ],
  },

  {
    id: 'old-expedition',
    title: { hu: 'Egy korábbi expedíció', en: 'An earlier expedition' },
    text: {
      hu: 'Egy hajó, ami ugyanolyan, mint a miénk. Ugyanaz a típus, ugyanaz a jelölés. Csak régebbi.',
      en: 'A ship exactly like ours. Same class, same markings. Only older.',
    },
    tags: ['drift', 'ruins'],
    weight: 6,
    once: true,
    choices: [
      {
        text: { hu: 'Átmegyünk a naplóért.', en: 'We go across for the log.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'understanding', amount: 3 },
          { k: 'archive', amount: 3 },
          { k: 'resource', id: 'morale', amount: -2 },
        ],
        result: {
          hu: 'A napló utolsó bejegyzése a mi hetünkkel egyezik. Nem a dátum — a szám.',
          en: 'The last entry in the log matches our week. Not the date — the number.',
        },
      },
      {
        text: { hu: 'Kifosztjuk, és nem olvasunk semmit.', en: 'We strip it and read nothing.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'fuel', amount: 8 },
          { k: 'resource', id: 'food', amount: 10 },
          { k: 'resource', id: 'hull', amount: 4 },
        ],
        result: {
          hu: 'Praktikus döntés. Senki nem beszél róla utána.',
          en: 'A practical decision. Nobody talks about it afterwards.',
        },
      },
      {
        text: { hu: 'Hagyjuk békén.', en: 'We leave it be.' },
        costs: [],
        effects: [{ k: 'resource', id: 'morale', amount: 2 }],
        result: {
          hu: 'A legénység egy része szerint ez volt a helyes. A hajó lassan hátrafordul.',
          en: 'Part of the crew thinks that was right. The ship turns slowly away.',
        },
      },
    ],
  },

  {
    id: 'living-ship',
    title: { hu: 'A hajó megszólal', en: 'The ship speaks' },
    text: {
      hu: 'A rúnamag mintát ad ki, ami nem a mi kódunk. Aztán megismétli, lassabban, mintha várná, hogy értsük.',
      en: 'The rune core puts out a pattern that is not our code. Then it repeats it, slower, as if waiting to be understood.',
    },
    tags: ['drift', 'anomaly'],
    weight: 5,
    once: true,
    archiveGated: true,
    choices: [
      {
        text: { hu: 'Válaszolunk ugyanazon a nyelven.', en: 'We answer in the same language.' },
        costs: [{ k: 'cards', symbol: 'insight', count: 2 }],
        effects: [
          { k: 'understanding', amount: 5 },
          { k: 'archive', amount: 3 },
        ],
        result: {
          hu: 'Két hétig beszélgetünk. A végén az egyik legénységtag megkérdezi, hogy a hajó mindig itt volt-e.',
          en: 'We talk for two weeks. At the end one of the crew asks whether the ship was always here.',
        },
      },
      {
        text: { hu: 'Lekapcsoljuk a rúnamagot.', en: 'We shut the rune core down.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'morale', amount: -1 },
          { k: 'resource', id: 'information', amount: 4 },
        ],
        result: {
          hu: 'A minta megszűnt. A laborban megvan a felvétel, és senki nem hallgatja vissza.',
          en: 'The pattern stopped. The lab has the recording, and nobody plays it back.',
        },
      },
    ],
  },

  {
    id: 'children-of-ash',
    title: { hu: 'A hamu gyermekei', en: 'Children of the ash' },
    text: {
      hu: 'Egy telep, ami nem tudja, hogy a galaxis meghalt. Kilencven éve élnek itt, és tanítják egymást.',
      en: 'A settlement that does not know the galaxy is dead. They have lived here ninety years, teaching each other.',
    },
    tags: ['world'],
    weight: 8,
    choices: [
      {
        text: { hu: 'Elmondjuk nekik.', en: 'We tell them.' },
        costs: [],
        effects: [
          { k: 'crewJoin', count: 1 },
          { k: 'resource', id: 'morale', amount: -2 },
          { k: 'understanding', amount: 2 },
        ],
        result: {
          hu: 'Egy fiatal velünk jön. A többiek maradnak, és most már tudják.',
          en: 'One of the young ones comes with us. The rest stay, and now they know.',
        },
      },
      {
        text: { hu: 'Nem mondjuk el.', en: 'We do not tell them.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'food', amount: 10 },
          { k: 'resource', id: 'credits', amount: 6 },
        ],
        result: {
          hu: 'Vendégként fogadnak, és úgy is búcsúznak. Ez nehezebb volt, mint ahogy hangzik.',
          en: 'They receive us as guests, and see us off as guests. That was harder than it sounds.',
        },
      },
      {
        text: {
          hu: 'Tanítunk nekik valamit, ami hasznos.',
          en: 'We teach them something useful.',
        },
        costs: [{ k: 'weeks', amount: 2 }],
        effects: [
          { k: 'resource', id: 'morale', amount: 4 },
          { k: 'archive', amount: 2 },
          { k: 'crewJoin', count: 1 },
        ],
        result: {
          hu: 'Két hét, és van vízszűrőjük. Az egyik mérnökük velünk jön, mert most már tudja, mit nem tud.',
          en: 'Two weeks, and they have water filters. One of their engineers comes with us, because now they know what they do not know.',
        },
      },
    ],
  },

  {
    id: 'the-long-dark',
    title: { hu: 'A hosszú sötét', en: 'The long dark' },
    text: {
      hu: 'Négy csillagrendszer, és egyikben sincs semmi. Az érzékelők üresen jönnek vissza. Ez sem jó jel.',
      en: 'Four star systems, and nothing in any of them. The sensors come back empty. That is not a good sign either.',
    },
    tags: ['drift'],
    weight: 9,
    choices: [
      {
        text: {
          hu: 'Teljes energiát az érzékelőkre. (2 hét)',
          en: 'Full power to sensors. (2 weeks)',
        },
        costs: [{ k: 'weeks', amount: 2 }],
        effects: [
          { k: 'revealMap', columns: 3 },
          { k: 'resource', id: 'information', amount: 3 },
        ],
        result: {
          hu: 'Két hét pásztázás, és most már látjuk, hova érdemes menni. És hova nem.',
          en: 'Two weeks of scanning, and now we can see where it is worth going. And where it is not.',
        },
      },
      {
        text: { hu: 'Csak megyünk tovább.', en: 'We simply keep going.' },
        costs: [],
        effects: [{ k: 'resource', id: 'morale', amount: -1 }],
        result: {
          hu: 'Semmi nem történt. Két héten át. Ez viselte meg a legénységet a legjobban.',
          en: 'Nothing happened. For two weeks. That is what wore the crew down most.',
        },
      },
    ],
  },

  {
    id: 'rune-storm',
    title: { hu: 'Rúnavihar', en: 'A rune storm' },
    text: {
      hu: 'A tér maga izzik. Nem sugárzás — írás, ami túl gyorsan változik ahhoz, hogy elolvassuk.',
      en: 'Space itself is glowing. Not radiation — writing, changing too fast to read.',
    },
    tags: ['anomaly', 'drift'],
    weight: 8,
    choices: [
      {
        text: { hu: 'Átvágunk rajta.', en: 'We cut straight through.' },
        costs: [],
        effects: [
          { k: 'hullRisk', amount: 4 },
          { k: 'resource', id: 'information', amount: 5 },
        ],
        result: {
          hu: 'A burkolat felizzott, és a laborban most van ötezer sor olvashatatlan felvétel.',
          en: 'The plating glowed white, and the lab now has five thousand lines of unreadable recording.',
        },
      },
      {
        text: {
          hu: 'Megkerüljük. (2 hét, 3 üzemanyag)',
          en: 'We go around. (2 weeks, 3 fuel)',
        },
        costs: [
          { k: 'weeks', amount: 2 },
          { k: 'resource', id: 'fuel', amount: 3 },
        ],
        effects: [],
        result: {
          hu: 'Hosszabb, de a hajó egyben marad. Néha ez a jó válasz.',
          en: 'Longer, but the ship stays whole. Sometimes that is the right answer.',
        },
      },
      {
        text: {
          hu: 'Megállunk és felvesszük. (2 lap ◈)',
          en: 'We stop and record it. (2 cards with ◈)',
        },
        costs: [{ k: 'cards', symbol: 'insight', count: 2 }],
        effects: [
          { k: 'understanding', amount: 3 },
          { k: 'hullRisk', amount: 2 },
        ],
        result: {
          hu: 'Egy szakaszt sikerült lelassítani annyira, hogy olvasható legyen. Egy név van benne, és nem a miénk.',
          en: 'We slowed one stretch enough to read it. There is a name in it, and it is not ours.',
        },
      },
    ],
  },

  {
    id: 'the-first-door',
    title: { hu: 'Az első ajtó', en: 'The first door' },
    text: {
      hu: 'A rom nem rom. Ez egy bejárat, és a felirat rajta nem figyelmeztet, hanem üdvözöl. Valakit, aki nem jött el.',
      en: 'The ruin is not a ruin. It is an entrance, and the inscription does not warn. It welcomes. Someone who never came.',
    },
    tags: ['ruins'],
    weight: 6,
    once: true,
    choices: [
      {
        text: { hu: 'Elolvassuk a feliratot.', en: 'We read the inscription.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [{ k: 'startPuzzle', kind: 'glyphs' }],
        result: {
          hu: 'Nyolc jel, és mindegyik két dolgot jelent egyszerre.',
          en: 'Eight signs, and every one of them means two things at once.',
        },
      },
      {
        text: { hu: 'Bemegyünk.', en: 'We go in.' },
        costs: [],
        effects: [{ k: 'startMission', flavour: 'explore' }],
        result: {
          hu: 'Az ajtó kinyílik magától. Ez rosszabb, mintha zárva lett volna.',
          en: 'The door opens by itself. That is worse than if it had been locked.',
        },
      },
      walkAway,
    ],
  },

  {
    id: 'starless-vigil',
    title: { hu: 'Csillagtalan őrhely', en: 'A starless vigil' },
    text: {
      hu: 'Egy megfigyelőállomás, kifelé fordított műszerekkel. Nem a galaxist figyelte. Azt, ami kívül van.',
      en: 'An observation post with its instruments turned outwards. It was not watching the galaxy. It was watching what is outside it.',
    },
    tags: ['station', 'anomaly'],
    weight: 6,
    archiveGated: true,
    choices: [
      {
        text: {
          hu: 'Megnézzük, mit vett fel utoljára.',
          en: 'We look at what it recorded last.',
        },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'understanding', amount: 4 },
          { k: 'resource', id: 'morale', amount: -2 },
          { k: 'archive', amount: 2 },
        ],
        result: {
          hu: 'Az utolsó felvétel nyolc másodperc, és nincs benne semmi. Pontosan ez a lényeg.',
          en: 'The last recording is eight seconds long and contains nothing. That is precisely the point.',
        },
      },
      {
        text: {
          hu: 'A műszereket leszereljük. (Kohó kell)',
          en: 'We take the instruments. (Forge needed)',
        },
        requires: { k: 'moduleInstalled', id: 'deepSensors' },
        costs: [],
        effects: [
          { k: 'revealMap', columns: 4 },
          { k: 'resource', id: 'information', amount: 5 },
        ],
        result: {
          hu: 'A mi érzékelőink ehhez képest gyertyák. Most már messzebb látunk, mint terveztük.',
          en: 'Next to these our sensors are candles. We can see further now than we planned to.',
        },
      },
      walkAway,
    ],
  },
  // ------------------------------------------- the new systems, as situations
  //
  // A mechanic the narrative layer never mentions stays a number on a bar. These
  // four are the encounters that hand attention, relics and the Herald over to
  // the players as decisions rather than as readouts.

  {
    id: 'the-loud-vein',
    title: { hu: 'A zajos telér', en: 'The loud vein' },
    text: {
      hu:
        'Egy nyitott bányaakna, tele valamivel, ami még mindig ad energiát. Ki lehet szedni — ' +
        'de vágni kell hozzá, és a vágás hangja itt nem áll meg a szikla szélén. A műszerek ' +
        'szerint innen kifelé nagyon jól hallható lesz.',
      en:
        'An open shaft, full of something that still gives power. It can be cut out — but cutting ' +
        'it means noise, and noise here does not stop at the edge of the rock. The instruments say ' +
        'it will be very audible from outside.',
    },
    tags: ['ruins', 'world', 'anomaly'],
    weight: 11,
    choices: [
      {
        text: { hu: 'Vágjuk ki. Megéri.', en: 'Cut it out. It is worth it.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'credits', amount: 16 },
          { k: 'resource', id: 'fuel', amount: 8 },
          { k: 'attention', amount: 3 },
        ],
        result: {
          hu:
            'Négy nap vágás, tele tartály és egy raklap eladható anyag. A negyedik nap végén a ' +
            'műszerek egy visszhangot mérnek a mélyből, ami nem a mienk volt. Valami meghallott ' +
            'minket, és most már tudja, merre keressen.',
          en:
            'Four days of cutting, a full tank and a pallet of sellable material. At the end of the ' +
            'fourth day the instruments read an echo from the deep that was not ours. Something ' +
            'heard us, and now knows which way to look.',
        },
      },
      {
        text: {
          hu: 'Csak amit kézzel el tudunk vinni.',
          en: 'Only what we can carry by hand.',
        },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [{ k: 'resource', id: 'credits', amount: 5 }],
        result: {
          hu:
            'Egy hét kézi munka, egy hetedannyi zsákmány, és teljes csend. A legénység nem érti, ' +
            'miért így csináltuk. Egyszer majd megértik.',
          en:
            'A week of handwork, a seventh of the haul, and complete silence. The crew does not ' +
            'understand why we did it this way. One day they will.',
        },
      },
      {
        text: { hu: 'Hagyjuk ott.', en: 'Leave it.' },
        costs: [],
        effects: [{ k: 'attention', amount: -1 }],
        result: {
          hu:
            'Lezárjuk az aknát, ahogy találtuk, és a hajó lassan kifordul. Amit nem bántottunk ' +
            'meg, az nem szól utánunk.',
          en:
            'We seal the shaft as we found it and the ship turns slowly out. What we did not ' +
            'disturb does not call after us.',
        },
      },
    ],
  },

  {
    id: 'the-lantern-keeper',
    title: { hu: 'A lámpás őrzője', en: 'The lantern-keeper' },
    text: {
      hu:
        'Egy állomás, amit belülről zártak le, és a zsilipnél egy váz, aki nem próbált kijutni. ' +
        'A kezében egy tárgy, ami elveszi a hangot a környékéről — ezért nem hallotta meg semmi, ' +
        'ami idekint jár. Hetven éve tartja.',
      en:
        'A station sealed from the inside, and at the airlock a body that never tried to get out. ' +
        'In its hands is an object that takes the sound out of the space around it — which is why ' +
        'nothing out here ever heard it. It has been holding it for seventy years.',
    },
    tags: ['station', 'ruins', 'distress'],
    weight: 10,
    once: true,
    choices: [
      {
        text: {
          hu: 'Kivesszük a kezéből. Nekünk kell.',
          en: 'We take it out of its hands. We need it.',
        },
        costs: [{ k: 'resource', id: 'morale', amount: 1 }],
        effects: [{ k: 'relic', id: 'lantern-of-still-air' }],
        result: {
          hu:
            'Nehezebb, mint amilyennek látszik, és amíg viszed, nem hallod a saját lépteidet. ' +
            'A legénység egy része nem nézett oda. A napló azt írja: „átvéve”.',
          en:
            'It is heavier than it looks, and while you carry it you cannot hear your own steps. ' +
            'Some of the crew did not look. The log says: "taken over".',
        },
      },
      {
        text: {
          hu: 'Felírjuk, mi volt, és nem visszük el.',
          en: 'We write down what it was and leave it there.',
        },
        costs: [],
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'resource', id: 'information', amount: 6 },
        ],
        result: {
          hu:
            'Lemérjük, lerajzoljuk, megértjük, mit csinál — és a helyén hagyjuk, a kezében. ' +
            'A zsilipet ugyanúgy zárjuk vissza. Valaki hetven éve döntött úgy, hogy ez a tárgy ' +
            'itt marad; nem a mi dolgunk felülírni.',
          en:
            'We measure it, draw it, understand what it does — and leave it where it is, in its ' +
            'hands. We seal the airlock the same way. Somebody decided seventy years ago that this ' +
            'object stays here; it is not ours to overrule.',
        },
      },
    ],
  },

  {
    id: 'the-offering-floor',
    title: { hu: 'A felajánlás padlója', en: 'The offering floor' },
    text: {
      hu:
        'Egy kör alakú terem, a padlóján hetven tárgy, mindegyik pontosan a maga helyén. Van, ' +
        'ahol üres a hely — valakik vittek, valakik hoztak. A terem közepén egy üres kör, ' +
        'pontosan olyan méretű, mint amit a raktérben hoztunk.',
      en:
        'A circular chamber, seventy objects on the floor, every one exactly in its place. Some ' +
        'places are empty — some took, some brought. In the middle of the room is an empty circle, ' +
        'exactly the size of what is sitting in our hold.',
    },
    tags: ['ruins', 'anomaly'],
    weight: 10,
    once: true,
    choices: [
      {
        text: {
          hu: 'Hozzáteszünk egyet a mieinkből.',
          en: 'We add one of ours.',
        },
        requires: { k: 'relicsAtLeast', value: 2 },
        costs: [],
        effects: [
          { k: 'understanding', amount: 4 },
          { k: 'archive', amount: 2 },
          { k: 'attention', amount: -2 },
        ],
        result: {
          hu:
            'Leteszünk egyet a körbe, és a terem — nem válaszol, nem világít, nem történik semmi ' +
            'olyan, amit egy műszer mérni tudna. De attól a pillanattól kezdve minden jel, amit ' +
            'ebben a rendszerben olvasunk, egy fokkal egyszerűbb. Mintha bemutattak volna.',
          en:
            'We set one down in the circle, and the room — does not answer, does not light up, ' +
            'nothing happens that an instrument could measure. But from that moment every sign we ' +
            'read in this system is one degree simpler. As though we had been introduced.',
        },
      },
      {
        text: { hu: 'Elviszünk egyet.', en: 'We take one.' },
        costs: [],
        effects: [
          { k: 'relic' },
          { k: 'attention', amount: 2 },
          { k: 'resource', id: 'morale', amount: -1 },
        ],
        result: {
          hu:
            'Az egyik hely üres marad utánunk. Semmi nem tartott vissza, és pontosan ez a ' +
            'kellemetlen benne. A legénység egy hétig nem beszélt a teremről.',
          en:
            'One place stays empty behind us. Nothing stopped us, and that is exactly what is ' +
            'unpleasant about it. The crew did not talk about that room for a week.',
        },
      },
      {
        text: { hu: 'Végigmérjük, és nem nyúlunk semmihez.', en: 'We survey it and touch nothing.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'resource', id: 'information', amount: 10 },
          { k: 'understanding', amount: 1 },
        ],
        result: {
          hu:
            'Egy hét mérés: hetven tárgy, hetven felirat, és egy sorrend, ami nem véletlen. ' +
            'A Labor hónapokra elég munkát kapott.',
          en:
            'A week of measurement: seventy objects, seventy inscriptions, and an order that is ' +
            'not accidental. The Lab has months of work.',
        },
      },
    ],
  },

  {
    id: 'the-counters-wake',
    title: { hu: 'Amit a számláló hallott', en: 'What the counter heard' },
    text: {
      hu:
        'A műszerek egy hetven éves adást fognak, ami nem üzenet: egy lista. Számok, dátumok, ' +
        'irányok — és a legutolsó bejegyzés a mi hajónk, a mi hetünk, a mi zajszintünk. ' +
        'Valami vezeti, mennyi hangot adtunk le, mióta átjöttünk a Kapun.',
      en:
        'The instruments pick up a seventy-year-old transmission that is not a message but a ' +
        'list. Numbers, dates, headings — and the last entry is our ship, our week, our noise ' +
        'level. Something is keeping a record of how much sound we have made since the Gate.',
    },
    tags: ['drift', 'anomaly', 'station'],
    weight: 12,
    once: true,
    choices: [
      {
        text: {
          hu: 'Elhallgatunk. Két hét teljes rádiócsend.',
          en: 'We go quiet. Two weeks of full silence.',
        },
        costs: [{ k: 'weeks', amount: 2 }],
        effects: [{ k: 'attention', amount: -4 }],
        result: {
          hu:
            'Két hét sodródás, hideg hajtómű, kézi jelzések a fedélzeten. A lista a végén ' +
            'ugyanazt a bejegyzést ismétli, aztán abbahagyja. Nem tűntünk el belőle — csak már ' +
            'nem érdekes, amit írhat rólunk.',
          en:
            'Two weeks adrift, engines cold, hand signals on deck. At the end the list repeats the ' +
            'same entry and then stops. We have not disappeared from it — we are simply no longer ' +
            'worth writing about.',
        },
      },
      {
        text: {
          hu: 'Megfejtjük, mit számol.',
          en: 'We work out what it is counting.',
        },
        costs: [{ k: 'resource', id: 'information', amount: 8 }],
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'heroXp', amount: 2, who: 'echoreader' },
        ],
        result: {
          hu:
            'Nem fenyegetés és nem őrjárat: könyvelés. Valami hetven éve vezeti, mennyi zaj ' +
            'érkezik egy halott galaxisba, és minden bejegyzés után elindul megnézni. ' +
            'Ettől nem lett kevesebb a zajunk — de most már tudjuk, mikor fordul felénk.',
          en:
            'Not a threat and not a patrol: bookkeeping. For seventy years something has been ' +
            'recording how much noise arrives in a dead galaxy, and after every entry it sets out ' +
            'to look. That has not made us quieter — but now we know when it turns our way.',
        },
      },
      {
        text: {
          hu: 'Válaszolunk neki. Hangosan.',
          en: 'We answer it. Loudly.',
        },
        costs: [],
        effects: [
          { k: 'attention', amount: 4 },
          { k: 'understanding', amount: 1 },
          { k: 'resource', id: 'morale', amount: 1 },
        ],
        result: {
          hu:
            'Teljes teljesítményen kiadjuk a saját listánkat: kik vagyunk, honnan jöttünk, mit ' +
            'kerestünk. A legénység a hídon állva hallgatja, és utána valaki megjegyzi, hogy ez ' +
            'volt az első alkalom, hogy nem bujkáltunk. Az adás egy perc múlva megismétli a ' +
            'nevünket. Nem tudjuk, mit jelent, hogy megjegyezte.',
          en:
            'At full power we broadcast our own list: who we are, where we came from, what we were ' +
            'looking for. The crew listens standing on the bridge, and afterwards somebody remarks ' +
            'that this was the first time we were not hiding. A minute later the transmission ' +
            'repeats our name. We do not know what it means that it took it down.',
        },
      },
    ],
  },
]

// ------------------------------------------------- what an earlier run left
//
// Three encounters that only exist because a previous expedition did something.
// They are the reason marks exist: a decision that is remembered by the Archive
// is a decision that can be answered a run later, by a different crew, who only
// know it from the record.
//
// Every mark the content sets has one of these. A hook without a payoff is the
// thing being fixed here, so adding a mark without adding its answer would be
// repeating the mistake.

export const CARRIED_ENCOUNTERS: Encounter[] = [
  {
    id: 'guide-again',
    title: { hu: 'A vezető, másodszor', en: 'The guide, a second time' },
    text: {
      hu:
        'Az archívumban egy sor: egy expedíció nem ment el egy fantom után, mert dolga volt. ' +
        'Most ugyanaz a hang áll a hajó előtt, és nem fordul semerre. Csak áll.',
      en:
        'One line in the Archive: an expedition did not follow a wraith, because it had work. ' +
        'Now the same voice stands in front of the ship, and turns nowhere at all. It just stands.',
    },
    tags: ['ruins', 'anomaly', 'drift'],
    weight: 9,
    once: true,
    requiresMark: 'refused-the-guide',
    choices: [
      {
        text: { hu: 'Most megyünk. Ha még akarja.', en: 'We come now. If it still wants us to.' },
        costs: [{ k: 'weeks', amount: 2 }],
        effects: [
          { k: 'understanding', amount: 3 },
          { k: 'mark', id: 'followed-at-last' },
        ],
        result: {
          hu:
            'Két hét, és semmi jele, hogy örülne. A végén megáll egy hely előtt, amit már ' +
            'egyszer megmutatott volna — és ami azóta bezárult. Amit még lehet érteni belőle, ' +
            'azt megértjük.',
          en:
            'Two weeks, and no sign that it is glad. At the end it stops in front of a place it ' +
            'would have shown us once, and which has closed since. What can still be understood of ' +
            'it, we understand.',
        },
      },
      {
        text: { hu: 'Nem másodszor is.', en: 'Not a second time.' },
        costs: [],
        effects: [{ k: 'resource', id: 'morale', amount: -2 }],
        result: {
          hu:
            'Elmegyünk mellette. Nem követ. A napló szerint ez a második alkalom, és a legénység ' +
            'tudja, hogy olvassák majd.',
          en:
            'We pass it by. It does not follow. The log will say this was the second time, and the ' +
            'crew knows the log gets read.',
        },
      },
    ],
  },

  {
    id: 'second-gate-echo',
    title: { hu: 'A másik kapu', en: 'The other gate' },
    text: {
      hu:
        'Egy korábbi expedíció kinyitott valamit, ami nem a mi Kapunk volt. A műszerek most ' +
        'ugyanazt a formát mérik ki, csak nyitva — és a mi visszaszámlálónk lassabban fut, ' +
        'mióta beléptünk ebbe a rendszerbe.',
      en:
        'An earlier expedition opened something that was not our Gate. The instruments read the ' +
        'same shape now, only open — and our own countdown has been running slower since we ' +
        'entered this system.',
    },
    tags: ['anomaly', 'ruins', 'station'],
    weight: 9,
    once: true,
    requiresMark: 'opened-the-second-gate',
    choices: [
      {
        text: { hu: 'Beállunk a hatása alá, amíg lehet.', en: 'We hold inside its reach.' },
        costs: [{ k: 'resource', id: 'fuel', amount: 6 }],
        effects: [
          { k: 'gateWeeks', amount: 4 },
          { k: 'understanding', amount: 1 },
        ],
        result: {
          hu:
            'Egy hétig állunk egy helyben, üzemanyagot égetve, és a Kapu ezalatt nem közeledik ' +
            'a záráshoz. Amit egy másik csapat nyitott, azt most mi használjuk.',
          en:
            'We hold station for a week, burning fuel, and the Gate does not come any closer to ' +
            'closing. What another crew opened, we are the ones using.',
        },
      },
      {
        text: { hu: 'Megpróbáljuk lezárni.', en: 'We try to close it.' },
        costs: [{ k: 'cards', symbol: 'insight', count: 1 }],
        effects: [
          { k: 'understanding', amount: 3 },
          { k: 'darkening', amount: -1 },
          { k: 'mark', id: 'closed-the-second-gate' },
        ],
        requires: { k: 'understandingAtLeast', value: 6 },
        result: {
          hu:
            'Nem tudjuk, mit tart nyitva, de azt látjuk, mi tartja. Amikor elzárjuk, a Sötétedés ' +
            'egy szintet visszalép — és a hajón mindenki érzi, hogy valami abbahagyta a hívást.',
          en:
            'We do not know what holds it open, but we can see what holds it. When we shut it, the ' +
            'Darkening falls back a level — and everybody aboard feels something stop calling.',
        },
      },
      {
        text: { hu: 'Nem nyúlunk hozzá.', en: 'We leave it alone.' },
        costs: [],
        effects: [{ k: 'resource', id: 'information', amount: 4 }],
        result: {
          hu: 'Lemérünk mindent, amit lehet, és tovább megyünk. Nyitva marad.',
          en: 'We measure everything we can and move on. It stays open.',
        },
      },
    ],
  },

  {
    id: 'voice-returned',
    title: { hu: 'A visszaadott hang', en: 'The voice given back' },
    text: {
      hu:
        'Egy kórus áll a rendszer peremén, és nem közeledik. Egy hang teljes benne, és az a hang ' +
        'a mi archívumunkból került vissza. Nem támadnak. Várnak, hogy kérjünk valamit.',
      en:
        'A choir stands at the edge of the system and does not approach. One voice in it is whole, ' +
        'and that voice came back out of our own Archive. They do not attack. They wait for us to ' +
        'ask for something.',
    },
    tags: ['anomaly', 'ruins', 'world'],
    weight: 9,
    once: true,
    requiresMark: 'gave-the-voice-back',
    choices: [
      {
        text: { hu: 'Vezessenek a szívhez.', en: 'Let them lead us to the heart.' },
        costs: [],
        effects: [
          { k: 'revealMap', columns: 3 },
          { k: 'understanding', amount: 2 },
        ],
        result: {
          hu:
            'Nem beszélnek. Egyszerűen elmennek előttünk, és amerre elmennek, ott a térkép ' +
            'kinyílik. Három oszlopon nincs többé kérdőjel.',
          en:
            'They do not speak. They simply go ahead of us, and where they go the map opens. Three ' +
            'columns have no question marks left on them.',
        },
      },
      {
        text: { hu: 'Kérjük, hogy álljanak mellénk egyszer.', en: 'Ask them to stand with us once.' },
        costs: [],
        effects: [
          { k: 'module', id: 'boardingWards' },
          { k: 'resource', id: 'morale', amount: 2 },
        ],
        result: {
          hu:
            'Az egyik hang bejön a hajóra, és ott marad a rúnamagban. Nem lehet beszélni vele. ' +
            'Ami kívülről jön, az most nehezebben talál be.',
          en:
            'One of the voices comes aboard and stays in the rune core. There is no talking to it. ' +
            'What comes from outside has a harder time landing now.',
        },
      },
      {
        text: { hu: 'Semmit. Csak megköszönjük.', en: 'Nothing. We only thank them.' },
        costs: [],
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'mark', id: 'asked-for-nothing' },
        ],
        result: {
          hu:
            'Nem kérünk. A kórus egy ütemig hallgat, aztán szétnyílik, és utat hagy. Az Archívum ' +
            'ezt is feljegyzi, és a következő csapat érteni fogja, miért.',
          en:
            'We ask for nothing. The choir holds for a beat, then parts and leaves a way through. ' +
            'The Archive notes this too, and the next crew will understand why.',
        },
      },
    ],
  },
  {
    id: 'the-silence-after',
    title: { hu: 'A csend, ami utána lett', en: 'The silence afterwards' },
    text: {
      hu:
        'Az Archívumban egy sor, amit senki nem tudott hova tenni: egy expedíció megállított ' +
        'valamit, ami hetven éven át számolta a zajt. Azóta ebben a szektorban nem mértek semmit. ' +
        'Most a hajó egy üres pályaudvarra érkezik: jelzőfények, nyitott zsilipek, és senki. ' +
        'Nem elhagyatott — kiürült. Ami eddig idehívta őket, azt ti kapcsoltátok ki.',
      en:
        'One line in the Archive nobody could place: an expedition stopped something that had spent ' +
        'seventy years counting noise. Nothing has been measured in this sector since. Now the ship ' +
        'arrives at an empty terminus: beacons lit, airlocks open, and nobody. Not abandoned — ' +
        'emptied. Whatever used to call them here, you switched off.',
    },
    tags: ['station', 'drift', 'ruins'],
    weight: 9,
    once: true,
    requiresMark: 'silenced-the-herald',
    choices: [
      {
        text: {
          hu: 'Kifosztjuk. Nekik már nem kell.',
          en: 'We strip it. They have no use for it.',
        },
        costs: [],
        effects: [
          { k: 'resource', id: 'credits', amount: 22 },
          { k: 'resource', id: 'food', amount: 12 },
          { k: 'relic' },
          { k: 'resource', id: 'morale', amount: -2 },
        ],
        result: {
          hu:
            'Három nap alatt leszedünk mindent, ami mozdítható. A legénység végig csendben ' +
            'dolgozik, és a végén valaki azt kérdezi, hogy akkor most mi vagyunk-e azok, akik ' +
            'miatt ez a hely üres. Nincs rá jó válasz.',
          en:
            'In three days we take everything that moves. The crew works in silence, and at the end ' +
            'somebody asks whether we are the reason this place is empty. There is no good answer.',
        },
      },
      {
        text: {
          hu: 'Bekapcsoljuk a jelzőt, és otthagyjuk nyitva.',
          en: 'We light the beacon and leave it open.',
        },
        costs: [{ k: 'resource', id: 'fuel', amount: 6 }],
        effects: [
          { k: 'understanding', amount: 3 },
          { k: 'archive', amount: 3 },
          { k: 'mark', id: 'left-the-light-on' },
        ],
        result: {
          hu:
            'Feltöltjük a jelzőt a saját tartalékunkból, kitesszük a hívást minden irányba, és ' +
            'nyitva hagyjuk a zsilipeket. Ha most nincs, ami számolja a zajt, akkor ez a hely ' +
            'végre lehet az, aminek szánták: egy pont, ahol valaki megállhat. Nem tudjuk, ' +
            'jön-e majd bárki. A jelző negyven évig fog égni.',
          en:
            'We top the beacon up out of our own reserves, put the call out in every direction and ' +
            'leave the airlocks open. If there is nothing counting the noise any more, then this ' +
            'place can finally be what it was meant to be: a point where somebody can stop. We do ' +
            'not know whether anyone will come. The beacon will burn for forty years.',
        },
      },
    ],
  },

  {
    id: 'the-light-that-burned',
    title: { hu: 'Ami negyven évig ég', en: 'The light that burns forty years' },
    text: {
      hu:
        'Az Archívum szerint egy korábbi expedíció otthagyott egy égő jelzőt egy kiürült ' +
        'állomáson. A hajó most ugyanazt a hívást fogja — és nem üresen. Valaki válaszol a ' +
        'jelzőre: nem a Kapu túloldaláról, nem egy hetven éves adásból. Innen.',
      en:
        'The Archive says an earlier expedition left a beacon burning on an emptied station. The ' +
        'ship is picking up that same call now — and not into emptiness. Somebody is answering the ' +
        'beacon: not from beyond the Gate, not out of a seventy-year-old transmission. From here.',
    },
    tags: ['station', 'distress', 'drift'],
    weight: 10,
    once: true,
    requiresMark: 'left-the-light-on',
    choices: [
      {
        text: { hu: 'Odamegyünk.', en: 'We go to them.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'crewJoin', count: 2 },
          { k: 'understanding', amount: 3 },
          { k: 'resource', id: 'morale', amount: 3 },
          { k: 'archive', amount: 2 },
          { k: 'mark', id: 'asked-for-nothing' },
        ],
        result: {
          hu:
            'Kilencen vannak, három hajóroncsból összehordott levegőn, és nem hősök: ' +
            'túlélők, akik meghallottak egy jelzőt. Kettő közülük velünk jön. A többi marad, ' +
            'mert most már van hol maradni. Nem kértek semmit, és mi sem.',
          en:
            'There are nine of them, living on air scavenged from three wrecks, and they are not ' +
            'heroes: survivors who heard a beacon. Two of them come with us. The rest stay, because ' +
            'now there is somewhere to stay. They asked for nothing, and neither did we.',
        },
      },
      {
        text: {
          hu: 'Felírjuk a helyet, és megyünk tovább.',
          en: 'We log the position and move on.',
        },
        costs: [],
        effects: [
          { k: 'resource', id: 'information', amount: 6 },
          { k: 'resource', id: 'morale', amount: -2 },
        ],
        result: {
          hu:
            'Koordináta, időpont, jelerősség — minden bekerül a naplóba, és a hajó nem fordul ' +
            'oda. A Kapu nem vár. A legénység érti, és ez a rosszabb.',
          en:
            'Coordinates, time, signal strength — all of it goes into the log, and the ship does ' +
            'not turn. The Gate will not wait. The crew understands, and that is the worse part.',
        },
      },
    ],
  },
]

/** Which encounters can appear at a node with these tags? */
/** Everything, in one list: the ordinary pool and the carried-over answers. */
const ALL_ENCOUNTERS: Encounter[] = [...ENCOUNTERS, ...CARRIED_ENCOUNTERS]

/**
 * Every encounter by id — the carried ones included.
 *
 * This index used to be built from `ENCOUNTERS` alone, which meant that the
 * moment a carried encounter actually came up, resolving it threw "No such
 * encounter" and took the run with it. `encountersFor` has always offered them,
 * so the bug was one earned mark away the whole time; it surfaced the first time
 * a test run happened to give a voice back. See the test that now walks every id.
 */
const ENCOUNTER_INDEX = new Map(ALL_ENCOUNTERS.map((e) => [e.id, e]))

export function encounter(id: string): Encounter {
  const e = ENCOUNTER_INDEX.get(id)
  if (!e) throw new Error(`No such encounter: ${id}`)
  return e
}

export function encountersFor(
  tags: readonly EncounterTag[],
  used: readonly string[],
  archiveOpen: boolean,
  flags: readonly string[] = [],
  marks: readonly string[] = [],
): Encounter[] {
  return ALL_ENCOUNTERS.filter((e) => {
    if (e.chained) return false
    if (e.once && used.includes(e.id)) return false
    if (e.archiveGated && !archiveOpen) return false
    if (e.requiresFlag && !flags.includes(e.requiresFlag)) return false
    if (e.requiresMark && !marks.includes(e.requiresMark)) return false
    return e.tags.some((t) => tags.includes(t))
  })
}
