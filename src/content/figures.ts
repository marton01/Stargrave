// People who come back.
//
// Every encounter in this game used to be a stranger. You answered it, it paid
// out or it cost you, and it never existed again — so the galaxy beyond the Gate
// had situations in it but no people, and nothing you did to anybody was ever
// remembered by anybody.
//
// A figure is somebody who turns up two or three times in one expedition and
// knows how you treated them last time. That is the whole design, and it buys
// three things nothing else here buys:
//
//   **A decision that is about a person.** "Do we pay him" is a different
//   question from "do we pay", and the table argues about it differently.
//
//   **Consequence with a face on it.** The Herald is a consequence; it has no
//   name. Vas Ordrec turning up in week fourteen because of what you said in
//   week five is the same mechanism with somebody standing in it.
//
//   **A story to tell afterwards.** "We should have paid the scavenger" is a
//   sentence a group says to each other for years. "We should have taken the
//   +8 credits" is not.
//
// HOW IT WORKS
//
// The first scene is on the map like any other encounter. Answering it sets your
// STANDING with that person and schedules their return as a dated debt — the
// same machinery as every other delayed consequence, so it announces itself in
// the log and sits on the ship screen before it lands. When the week comes, the
// engine picks the warm scene or the cold one by the standing you have earned.
// Nobody is ever surprised by who walks in; they can be surprised by how it goes.

import { registerEncounters } from './encounters'
import type { Encounter } from './encounters'
import type { Text } from '../engine/types'

export type FigureDef = {
  id: string
  name: Text
  /** One line for the ship screen: who this is and where you left it. */
  who: Text
  /**
   * Which scene comes next, by stage.
   *
   * `warm` runs at standing 0 or better, `cold` below it. Stage 0 is the first
   * meeting and lives on the map; this list starts at the return.
   */
  scenes: { warm: string; cold: string }[]
  /** Weeks before they catch up with you. */
  returnsIn: number
}

export const FIGURE_DEFS: FigureDef[] = [
  {
    id: 'ordrec',
    name: { hu: 'Vas Ordrec', en: 'Vas Ordrec' },
    who: {
      hu: 'Roncsoló kapitány. Azt viszi el, amit ti hagytatok ott.',
      en: 'A scavenger captain. He takes what you leave behind.',
    },
    scenes: [
      { warm: 'ordrec-2-warm', cold: 'ordrec-2-cold' },
      { warm: 'ordrec-3-warm', cold: 'ordrec-3-cold' },
    ],
    returnsIn: 4,
  },
  {
    id: 'marnov',
    name: { hu: 'Ilse Marnov', en: 'Ilse Marnov' },
    who: {
      hu: 'Kiugrott archívumi írnok. Tud valamit, amit odahaza nem írtak le.',
      en: 'A runaway Archive clerk. She knows something nobody wrote down at home.',
    },
    scenes: [
      { warm: 'marnov-2-warm', cold: 'marnov-2-cold' },
      { warm: 'marnov-3-warm', cold: 'marnov-3-cold' },
    ],
    returnsIn: 5,
  },
  {
    id: 'envoy',
    name: { hu: 'A Kórus követe', en: 'The Choir’s envoy' },
    who: {
      hu: 'Nem ember. Beszél, és megjegyzi, amit mondtok neki.',
      en: 'Not a person. It speaks, and it remembers what you say to it.',
    },
    scenes: [
      { warm: 'envoy-2-warm', cold: 'envoy-2-cold' },
      { warm: 'envoy-3-warm', cold: 'envoy-3-cold' },
    ],
    returnsIn: 6,
  },
]

const INDEX = new Map(FIGURE_DEFS.map((f) => [f.id, f]))

export function figureDef(id: string): FigureDef | undefined {
  return INDEX.get(id)
}

/** Standing at or above this is warm. */
export const FIGURE_WARM_AT = 0

// ---------------------------------------------------------------- the scenes
//
// The first scene of each is tagged for the map. The returns are `chained`, so
// they never turn up on their own — the debt that schedules them is the only way
// in.

export const FIGURE_ENCOUNTERS: Encounter[] = [
  // ============================================================== VAS ORDREC
  {
    id: 'ordrec-1',
    figure: { id: 'ordrec', stage: 0 },
    title: { hu: 'Vas Ordrec', en: 'Vas Ordrec' },
    text:
      {
        hu:
          'Egy vontatóhajó áll a roncsmező szélén, és nem menekül, amikor meglát titeket. ' +
          'A kapitány neve Vas Ordrec, és azt mondja, ez a mező az övé — nem jog szerint, ' +
          'hanem mert három éve itt van, és tudja, hol van a kábel a hamu alatt. ' +
          'Elmehettek. Vagy megegyezhettek vele.',
        en:
          'A tug sits on the edge of the wreck field and does not run when it sees you. The ' +
          'captain is called Vas Ordrec, and he says the field is his — not by right, but because ' +
          'he has been here three years and knows where the cable runs under the ash. ' +
          'You can leave. Or you can come to terms with him.',
      },
    tags: ['drift', 'ruins'],
    weight: 2,
    once: true,
    choices: [
      {
        text: { hu: 'Megegyezünk. Felezünk.', en: 'Terms. We split it.' },
        costs: [],
        result: {
          hu:
            'Fél napig együtt bontanak. A felét viszi, és a végén megmutat egy hajót, amit ' +
            'nem talált volna meg senki. Megjegyzi az arcotokat.',
          en:
            'For half a day they strip it together. He takes half, and at the end he shows you a ' +
            'hull nobody would have found. He notes your faces.',
        },
        effects: [
          { k: 'resource', id: 'credits', amount: 10 },
          { k: 'relic' },
          { k: 'standing', figure: 'ordrec', amount: 2 },
          { k: 'figureReturns', figure: 'ordrec' },
        ],
      },
      {
        text: { hu: 'A mező senkié. Elvisszük.', en: 'The field is nobody’s. We take it.' },
        costs: [],
        result: {
          hu:
            'Nem száll szembe négy rúnahordozóval. Áll a hídján, és néz, ahogy elvisztek ' +
            'mindent. Nem szól egy szót sem, és ez a rosszabb.',
          en:
            'He does not take on four rune-bearers. He stands on his bridge and watches you take ' +
            'all of it. He does not say a word, and that is the worse part.',
        },
        effects: [
          { k: 'resource', id: 'credits', amount: 26 },
          { k: 'standing', figure: 'ordrec', amount: -3 },
          { k: 'figureReturns', figure: 'ordrec' },
        ],
      },
      {
        text: { hu: 'Békén hagyjuk, és megyünk.', en: 'We leave him to it.' },
        costs: [],
        result: {
          hu: 'Int egyet a hídról. Nem sok, de valami.',
          en: 'He raises a hand from the bridge. Not much, but something.',
        },
        effects: [
          { k: 'standing', figure: 'ordrec', amount: 1 },
          { k: 'figureReturns', figure: 'ordrec' },
        ],
      },
    ],
  },
  {
    id: 'ordrec-2-warm',
    figure: { id: 'ordrec', stage: 1 },
    chained: true,
    title: { hu: 'Ordrec üzen', en: 'Ordrec calls' },
    text: {
      hu:
        'Nyílt csatornán szól, névvel, mintha ismerősök lennétek — és azok vagytok. ' +
        'Van egy adag üzemanyaga, amit nem tud eladni senkinek idekint, és van egy térképe ' +
        'a következő két oszlopról. Az árat nektek mondja, nem a piacnak.',
      en:
        'He calls on an open channel, by name, as if you were people he knows — and you are. ' +
        'He has fuel he cannot sell to anybody out here and a chart of the next two columns. ' +
        'He names your price, not the market’s.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Megvesszük mindkettőt.', en: 'We take both.' },
        costs: [{ k: 'resource', id: 'credits', amount: 12 }],
        result: {
          hu: 'Átadja, és hozzátesz egy nevet, akit érdemes megkeresni odakint.',
          en: 'He hands it over and adds the name of somebody worth finding out there.',
        },
        effects: [
          { k: 'resource', id: 'fuel', amount: 12 },
          { k: 'revealMap', columns: 2 },
          { k: 'standing', figure: 'ordrec', amount: 1 },
          { k: 'figureReturns', figure: 'ordrec' },
        ],
      },
      {
        text: { hu: 'Csak az üzemanyagot.', en: 'The fuel only.' },
        costs: [{ k: 'resource', id: 'credits', amount: 6 }],
        result: {
          hu: 'Rendben. A térképet összehajtja, és nem sértődik meg.',
          en: 'Fair enough. He folds the chart away and takes no offence.',
        },
        effects: [
          { k: 'resource', id: 'fuel', amount: 10 },
          { k: 'figureReturns', figure: 'ordrec' },
        ],
      },
    ],
  },
  {
    id: 'ordrec-2-cold',
    figure: { id: 'ordrec', stage: 1 },
    chained: true,
    title: { hu: 'Ordrec megvár', en: 'Ordrec is waiting' },
    text: {
      hu:
        'Két hajó áll az útban, nem egy. Nem támad — nem is kell neki. Csak annyit mond, ' +
        'hogy amit elvittetek, annak volt ára, és ő most beszedi. Vagy mentek egy kerülőt.',
      en:
        'Two hulls in the way, not one. He does not attack — he does not have to. He says only ' +
        'that what you took had a price, and he is collecting it now. Or you go the long way.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Fizetünk.', en: 'We pay.' },
        costs: [{ k: 'resource', id: 'credits', amount: 20 }],
        result: {
          hu: 'Elveszi, megszámolja, és félreáll. A számla nincs kiegyenlítve, csak halasztva.',
          en: 'He takes it, counts it, and stands aside. The account is not settled, only deferred.',
        },
        effects: [
          { k: 'standing', figure: 'ordrec', amount: 1 },
          { k: 'figureReturns', figure: 'ordrec' },
        ],
      },
      {
        text: { hu: 'Megyünk a kerülőt.', en: 'We go the long way.' },
        costs: [],
        result: {
          hu: 'Két hét, és a Kapu közben számol. Ordrec nem mozdul, amíg el nem tűntök.',
          en: 'Two weeks, and the Gate counts while you go. Ordrec does not move until you are gone.',
        },
        effects: [
          { k: 'gateWeeks', amount: -2 },
          { k: 'figureReturns', figure: 'ordrec' },
        ],
      },
      {
        text: { hu: 'Átmegyünk rajta.', en: 'We go through him.' },
        costs: [],
        result: {
          hu:
            'A vontató nem hadihajó. A hajótestetek mégis megérzi, és Ordrec neve után ' +
            'ettől kezdve egy másik szó jön.',
          en:
            'A tug is not a warship. Your hull feels it anyway, and after Ordrec’s name there is a ' +
            'different word from now on.',
        },
        effects: [
          { k: 'hullRisk', amount: 5 },
          { k: 'standing', figure: 'ordrec', amount: -3 },
          { k: 'figureReturns', figure: 'ordrec' },
        ],
      },
    ],
  },
  {
    id: 'ordrec-3-warm',
    figure: { id: 'ordrec', stage: 2 },
    chained: true,
    title: { hu: 'Ordrec utoljára', en: 'Ordrec, the last time' },
    text: {
      hu:
        'Nem üzletelni jött. Azt mondja, befelé megy valami, ami nagyobb, mint amit ő elbír, ' +
        'és ő most kifelé indul. Ami a raktárában van, azt nem viszi haza. Nektek adja.',
      en:
        'He has not come to trade. He says something is moving inward that is bigger than he can ' +
        'carry, and he is going out. What is in his hold is not going home with him. It is yours.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Elfogadjuk. És megköszönjük.', en: 'We take it. And we thank him.' },
        costs: [],
        result: {
          hu:
            'Három éve először mondja ki valaki a nevét úgy, hogy nem akar tőle semmit. ' +
            'A vontató elfordul, és a csatorna elhallgat.',
          en:
            'For the first time in three years somebody says his name without wanting anything. ' +
            'The tug turns away and the channel goes quiet.',
        },
        effects: [
          { k: 'resource', id: 'fuel', amount: 14 },
          { k: 'resource', id: 'food', amount: 12 },
          { k: 'relic' },
          { k: 'archive', amount: 2 },
        ],
      },
      {
        text: { hu: 'Menjen ő is haza. Kísérjük ki.', en: 'Let him go home. We see him out.' },
        costs: [{ k: 'weeks', amount: 1 }],
        result: {
          hu:
            'Egy hét az életetekből. Ordrec átmegy a Kapun, és otthon elmondja, kik voltatok. ' +
            'Az Archívum ezt jegyzi fel rólatok.',
          en:
            'A week of your lives. Ordrec goes through the Gate and tells them at home who you ' +
            'were. That is what the Archive writes down about you.',
        },
        effects: [
          { k: 'archive', amount: 5 },
          { k: 'resource', id: 'morale', amount: 3 },
        ],
      },
    ],
  },
  {
    id: 'ordrec-3-cold',
    figure: { id: 'ordrec', stage: 2 },
    chained: true,
    title: { hu: 'Ordrec bezárja a kört', en: 'Ordrec closes the circle' },
    text: {
      hu:
        'A vontató ott áll a következő rendszerben, ahova mentek. Nem az útban: mellette. ' +
        'És mire odaértek, mindent elvitt, ami mozdítható volt. Nem üzen semmit. ' +
        'Nem is kell.',
      en:
        'The tug is standing in the next system you were headed for. Not in the way: beside it. ' +
        'And by the time you arrive, everything that could be moved is gone. He sends no message. ' +
        'He does not need to.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Tudomásul vesszük.', en: 'We take note.' },
        costs: [],
        result: {
          hu: 'Négy hete még lehetett volna másképp. Ez is egy tanulság, csak drága.',
          en: 'Four weeks ago it could have gone another way. That is a lesson too, just a costly one.',
        },
        effects: [
          { k: 'resource', id: 'credits', amount: -15 },
          { k: 'resource', id: 'morale', amount: -2 },
        ],
      },
      {
        text: { hu: 'Utána megyünk.', en: 'We go after him.' },
        costs: [{ k: 'weeks', amount: 1 }],
        result: {
          hu:
            'Megtaláljátok, és nem védekezik. Visszakaptok mindent, és valamit, amit nem ' +
            'akartatok: azt, ahogy néz rátok.',
          en:
            'You find him, and he does not defend himself. You get everything back, and something ' +
            'you did not want: the way he looks at you.',
        },
        effects: [
          { k: 'resource', id: 'credits', amount: 20 },
          { k: 'resource', id: 'morale', amount: -3 },
          { k: 'attention', amount: 1 },
        ],
      },
    ],
  },

  // ============================================================= ILSE MARNOV
  {
    id: 'marnov-1',
    figure: { id: 'marnov', stage: 0 },
    title: { hu: 'Ilse Marnov', en: 'Ilse Marnov' },
    text: {
      hu:
        'Egy mentőkabin, egy ember, és egy doboz, amit nem enged el. Ilse Marnov, ' +
        'archívumi írnok — volt. Azt mondja, kiírt magának valamit, amit nem lett volna szabad, ' +
        'és most senki nem viszi haza. Fuvart kér, és cserébe felajánlja, amit tud.',
      en:
        'A lifepod, one person, and a case she will not let go of. Ilse Marnov, Archive clerk — ' +
        'formerly. She says she copied out something she should not have, and now nobody will take ' +
        'her home. She wants passage, and offers what she knows for it.',
    },
    tags: ['distress', 'drift'],
    weight: 2,
    once: true,
    choices: [
      {
        text: { hu: 'Felvesszük. A dobozt is.', en: 'She comes aboard. The case too.' },
        costs: [],
        result: {
          hu:
            'Beköltözik a Laborba, és három nap múlva már ő magyarázza a Múltidézőnek, ' +
            'mit néz rosszul. A doboz zárva marad.',
          en:
            'She moves into the Lab, and three days later she is telling the Pastcaller what she ' +
            'has been reading wrong. The case stays shut.',
        },
        effects: [
          { k: 'crewJoin', count: 1 },
          { k: 'resource', id: 'information', amount: 6 },
          { k: 'standing', figure: 'marnov', amount: 2 },
          { k: 'figureReturns', figure: 'marnov' },
        ],
      },
      {
        text: { hu: 'A dobozt kérjük. Őt nem.', en: 'The case, not the woman.' },
        costs: [],
        result: {
          hu:
            'Odaadja. Nem alkuszik, nem könyörög, csak odaadja, és visszaül a kabinba. ' +
            'A doboz többet ér, mint amennyit gondoltatok.',
          en:
            'She hands it over. No bargaining, no pleading; she hands it over and sits back down in ' +
            'the pod. The case is worth more than you thought.',
        },
        effects: [
          { k: 'understanding', amount: 1 },
          { k: 'resource', id: 'information', amount: 10 },
          { k: 'standing', figure: 'marnov', amount: -3 },
          { k: 'figureReturns', figure: 'marnov' },
        ],
      },
      {
        text: { hu: 'Nincs helyünk. Továbbmegyünk.', en: 'We have no room. We move on.' },
        costs: [],
        result: {
          hu: 'A kabin ott marad mögöttetek, és sokáig látszik a hátsó képen.',
          en: 'The pod stays behind you, and it is visible on the aft view for a long time.',
        },
        effects: [
          { k: 'resource', id: 'morale', amount: -2 },
          { k: 'standing', figure: 'marnov', amount: -1 },
          { k: 'figureReturns', figure: 'marnov' },
        ],
      },
    ],
  },
  {
    id: 'marnov-2-warm',
    figure: { id: 'marnov', stage: 1 },
    chained: true,
    title: { hu: 'Marnov kinyitja a dobozt', en: 'Marnov opens the case' },
    text: {
      hu:
        'Odaáll a hídra, és leteszi elétek. Azt mondja, addig nem nyitotta ki, amíg nem tudta, ' +
        'kiknek adja oda. Benne az van, amit az Archívum kivett a jelentésekből: hova mentek ' +
        'az előző expedíciók, és hol álltak meg.',
      en:
        'She comes up to the bridge and sets it down in front of you. She says she did not open it ' +
        'until she knew who she was giving it to. Inside is what the Archive took out of the ' +
        'reports: where the earlier expeditions went, and where they stopped.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Olvassuk el, együtt.', en: 'We read it, together.' },
        costs: [],
        result: {
          hu:
            'Fél éjszaka, négyen a híd padlóján. Amit megtudtok, azt onnantól nem lehet ' +
            'elfelejteni — és a térkép fele értelmet nyer.',
          en:
            'Half a night, four of you on the bridge floor. What you learn cannot be unlearned, and ' +
            'half the chart starts to make sense.',
        },
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'revealMap', columns: 2 },
          { k: 'standing', figure: 'marnov', amount: 1 },
          { k: 'figureReturns', figure: 'marnov' },
        ],
      },
      {
        text: { hu: 'Zárva marad. Nem a mi dolgunk.', en: 'It stays shut. Not our business.' },
        costs: [],
        result: {
          hu: 'Bólint, és elteszi. Nem bántódik meg. De többet nem hozza elő.',
          en: 'She nods and puts it away. She is not hurt. She just never brings it out again.',
        },
        effects: [{ k: 'figureReturns', figure: 'marnov' }],
      },
    ],
  },
  {
    id: 'marnov-2-cold',
    figure: { id: 'marnov', stage: 1 },
    chained: true,
    title: { hu: 'Marnov hangja a csatornán', en: 'Marnov on the channel' },
    text: {
      hu:
        'Él. Valaki felvette, és most egy állomásról beszél. Nem vádol semmivel. ' +
        'Csak annyit mond, hogy amit elvettetek tőle, azt rosszul olvassátok, és ő tudja, hogyan ' +
        'kell. Az árát is megmondja.',
      en:
        'She is alive. Somebody picked her up, and now she is speaking from a station. She accuses ' +
        'you of nothing. She says only that what you took from her you are reading wrong, and she ' +
        'knows how it is done. She names her price too.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Megfizetjük.', en: 'We pay it.' },
        costs: [{ k: 'resource', id: 'credits', amount: 24 }],
        result: {
          hu: 'Elmagyarázza, tisztán és keserűen. Utána bontja a vonalat.',
          en: 'She explains it, clearly and bitterly. Then she cuts the line.',
        },
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'standing', figure: 'marnov', amount: 2 },
          { k: 'figureReturns', figure: 'marnov' },
        ],
      },
      {
        text: { hu: 'Megoldjuk magunktól.', en: 'We will work it out ourselves.' },
        costs: [],
        result: {
          hu: '„Persze.” Ennyit mond, és ennyi is elég.',
          en: '“Of course.” That is all she says, and it is enough.',
        },
        effects: [
          { k: 'standing', figure: 'marnov', amount: -1 },
          { k: 'figureReturns', figure: 'marnov' },
        ],
      },
    ],
  },
  {
    id: 'marnov-3-warm',
    figure: { id: 'marnov', stage: 2 },
    chained: true,
    title: { hu: 'Marnov marad', en: 'Marnov stays' },
    text: {
      hu:
        'Amikor megkérdezitek, hogy hazaviszitek-e, nemet mond. Azt mondja, amit a Csillagsírban ' +
        'megtaláltok, azt valakinek le kell írnia úgy, ahogy volt — és odahaza nem fogják.',
      en:
        'When you ask whether you are taking her home, she says no. She says whatever you find at ' +
        'the Stargrave will have to be written down as it was — and at home it will not be.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Akkor te írod le.', en: 'Then you write it.' },
        costs: [],
        result: {
          hu:
            'A hátralévő úton mindent lejegyez. Bármi lesz a vége, lesz róla egy hiteles ' +
            'oldal — és az Archívum azt fogja olvasni.',
          en:
            'For the rest of the road she writes everything down. Whatever the end is, there will be ' +
            'one honest page about it — and that is the page the Archive will read.',
        },
        effects: [
          { k: 'archive', amount: 6 },
          { k: 'understanding', amount: 1 },
        ],
      },
    ],
  },
  {
    id: 'marnov-3-cold',
    figure: { id: 'marnov', stage: 2 },
    chained: true,
    title: { hu: 'Marnov jelentése', en: 'Marnov’s report' },
    text: {
      hu:
        'Az Archívum üzen a Kapun át, és a szöveg végén ott a neve. Leírta, mit tettetek vele. ' +
        'Nem hazudott semmiben, és pontosan ez a baj.',
      en:
        'The Archive sends word through the Gate, and her name is at the end of it. She has written ' +
        'down what you did to her. She lied about nothing, and that is exactly the problem.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Nincs mit hozzátenni.', en: 'There is nothing to add.' },
        costs: [],
        result: {
          hu: 'Nincs. A jelentés ott lesz, amikor hazaértek.',
          en: 'There is not. The report will be there when you get home.',
        },
        effects: [
          { k: 'archive', amount: -4 },
          { k: 'resource', id: 'morale', amount: -2 },
        ],
      },
      {
        text: { hu: 'Válaszolunk rá. Mindenre.', en: 'We answer it. All of it.' },
        costs: [{ k: 'resource', id: 'information', amount: 12 }],
        result: {
          hu:
            'Egy egész hét megy el azzal, hogy leírjátok a saját változatotokat. ' +
            'Nem törli el az övét, de mellé kerül.',
          en:
            'A whole week goes on writing down your own account. It does not erase hers, but it ' +
            'stands beside it.',
        },
        effects: [{ k: 'archive', amount: 1 }],
      },
    ],
  },

  // ======================================================= THE CHOIR’S ENVOY
  {
    id: 'envoy-1',
    figure: { id: 'envoy', stage: 0 },
    title: { hu: 'A Kórus követe', en: 'The Choir’s envoy' },
    text: {
      hu:
        'Egy alak áll a folyosó végén, ahol nem lehetne. Nem támad. Beszél — a saját ' +
        'hangotokon, egy fél másodperccel azután, hogy ti szólaltok meg. Kérdez valamit: ' +
        'hogy miért jöttetek.',
      en:
        'A figure stands at the end of a corridor where none could be. It does not attack. It ' +
        'speaks — in your own voices, half a second after you do. It asks a question: why you came.',
    },
    tags: ['anomaly', 'ruins'],
    weight: 2,
    once: true,
    choices: [
      {
        text: { hu: 'Megmondjuk az igazat.', en: 'We tell it the truth.' },
        costs: [],
        result: {
          hu:
            'Végighallgat. Aztán elismétli, pontosabban, mint ahogy ti mondtátok — és attól, ' +
            'ahogy elismétli, ti is jobban értitek.',
          en:
            'It hears you out. Then it says it back, more exactly than you said it — and hearing it ' +
            'said back, you understand it better yourselves.',
        },
        effects: [
          { k: 'understanding', amount: 1 },
          { k: 'attention', amount: 1 },
          { k: 'standing', figure: 'envoy', amount: 2 },
          { k: 'figureReturns', figure: 'envoy' },
        ],
      },
      {
        text: { hu: 'Nem válaszolunk.', en: 'We do not answer.' },
        costs: [],
        result: {
          hu: 'Vár. Sokáig. Aztán nincs ott. A folyosó hidegebb, mint volt.',
          en: 'It waits. For a long time. Then it is not there. The corridor is colder than it was.',
        },
        effects: [
          { k: 'standing', figure: 'envoy', amount: -1 },
          { k: 'figureReturns', figure: 'envoy' },
        ],
      },
      {
        text: { hu: 'Elhallgattatjuk.', en: 'We silence it.' },
        costs: [],
        result: {
          hu:
            'Szétesik, mint egy hang a vízben. Ami utána marad, azt el lehet vinni — ' +
            'és odalent valami feljegyzi, mit tettetek.',
          en:
            'It comes apart like a note in water. What is left can be carried off — and something ' +
            'below writes down what you did.',
        },
        effects: [
          { k: 'relic' },
          { k: 'attention', amount: 2 },
          { k: 'standing', figure: 'envoy', amount: -3 },
          { k: 'figureReturns', figure: 'envoy' },
        ],
      },
    ],
  },
  {
    id: 'envoy-2-warm',
    figure: { id: 'envoy', stage: 1 },
    chained: true,
    title: { hu: 'A követ visszatér', en: 'The envoy returns' },
    text: {
      hu:
        'Ugyanaz az alak, ugyanaz a hang, és most nem kérdez: mond. Egy nevet mond, ' +
        'egy irányt, és egy számot. A név a hajótok neve.',
      en:
        'The same figure, the same voice, and this time it does not ask: it tells. It says a name, ' +
        'a direction and a number. The name is your ship’s.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Meghallgatjuk végig.', en: 'We hear it out.' },
        costs: [],
        result: {
          hu:
            'Amit mond, arra a térkép fele válaszol. És amikor befejezi, halkabb lesz ' +
            'körülöttetek minden.',
          en:
            'What it says, half the chart answers to. And when it finishes, everything around you is ' +
            'quieter.',
        },
        effects: [
          { k: 'revealMap', columns: 3 },
          { k: 'attention', amount: -2 },
          { k: 'standing', figure: 'envoy', amount: 1 },
          { k: 'figureReturns', figure: 'envoy' },
        ],
      },
      {
        text: { hu: 'Kérdezünk vissza.', en: 'We ask it back.' },
        costs: [{ k: 'cards', symbol: 'insight', count: 1 }],
        result: {
          hu:
            'Elgondolkodik — ez a helyes szó rá. Aztán válaszol, és a válasz többe kerül, ' +
            'mint amennyit ér. Meg is éri.',
          en:
            'It thinks about it — that is the right word. Then it answers, and the answer costs more ' +
            'than it is worth. It is worth it.',
        },
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'standing', figure: 'envoy', amount: 2 },
          { k: 'figureReturns', figure: 'envoy' },
        ],
      },
    ],
  },
  {
    id: 'envoy-2-cold',
    figure: { id: 'envoy', stage: 1 },
    chained: true,
    title: { hu: 'A követ nem egyedül jön', en: 'The envoy does not come alone' },
    text: {
      hu:
        'Hárman állnak a folyosón, és mind a hárman a ti hangotokon beszélnek — de nem azt, ' +
        'amit ti mondtatok. Azt, amit gondoltatok.',
      en:
        'Three of them stand in the corridor, and all three speak in your voices — but not what you ' +
        'said. What you thought.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Végighallgatjuk.', en: 'We let them finish.' },
        costs: [],
        result: {
          hu: 'A legénység is hallja. Egy hétig nem néznek egymás szemébe.',
          en: 'The crew hear it too. For a week nobody meets anybody’s eye.',
        },
        effects: [
          { k: 'resource', id: 'morale', amount: -3 },
          { k: 'loyalty', amount: -1, who: 'all' },
          { k: 'standing', figure: 'envoy', amount: 1 },
          { k: 'figureReturns', figure: 'envoy' },
        ],
      },
      {
        text: { hu: 'Lezárjuk a folyosót.', en: 'We seal the corridor.' },
        costs: [{ k: 'resource', id: 'credits', amount: 10 }],
        result: {
          hu: 'A hangok bent maradnak. Hallani őket, de nem lehet érteni. Ez így jobb.',
          en: 'The voices stay in there. You can hear them and not make them out. It is better this way.',
        },
        effects: [
          { k: 'attention', amount: 1 },
          { k: 'figureReturns', figure: 'envoy' },
        ],
      },
    ],
  },
  {
    id: 'envoy-3-warm',
    figure: { id: 'envoy', stage: 2 },
    chained: true,
    title: { hu: 'A követ elkísér', en: 'The envoy comes with you' },
    text: {
      hu:
        'Nem kérdez és nem mond semmit. Egyszerűen ott van a hídon, ahányszor odanéztek, ' +
        'és amerre néz, arra könnyebb menni. Nem kér cserébe semmit — ez a nyugtalanító benne.',
      en:
        'It asks nothing and says nothing. It is simply on the bridge every time you look, and the ' +
        'way it looks is the easier way to go. It asks for nothing in return — that is the unsettling part.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Hagyjuk ott.', en: 'We let it stay.' },
        costs: [],
        result: {
          hu:
            'A Csillagsírig marad. Amit ott találtok, azt tőle már fél éve tudjátok — ' +
            'csak nem értettétek.',
          en:
            'It stays as far as the Stargrave. What you find there you have known from it for half a ' +
            'year — you just did not understand it.',
        },
        effects: [
          { k: 'understanding', amount: 3 },
          { k: 'attention', amount: -3 },
        ],
      },
      {
        text: { hu: 'Megkérjük, hogy menjen el.', en: 'We ask it to go.' },
        costs: [],
        result: {
          hu: 'Elmegy. Ez az egyetlen dolog, amit valaha kértetek tőle, és megtette.',
          en: 'It goes. It is the only thing you ever asked of it, and it did it.',
        },
        effects: [
          { k: 'resource', id: 'morale', amount: 2 },
          { k: 'archive', amount: 2 },
        ],
      },
    ],
  },
  {
    id: 'envoy-3-cold',
    figure: { id: 'envoy', stage: 2 },
    chained: true,
    title: { hu: 'A követ megelőz', en: 'The envoy gets there first' },
    text: {
      hu:
        'Ahova mentek, ott már ott volt. Amit kerestetek, azt már elvitte. És a helyén ' +
        'hagyott valamit, ami a ti hangotokon szól, és nem hallgat el.',
      en:
        'Wherever you go, it has been. Whatever you were looking for, it has taken. And in its place ' +
        'it has left something that speaks in your voices and does not stop.',
    },
    tags: ['drift'],
    weight: 1,
    choices: [
      {
        text: { hu: 'Elvisszük, ami maradt.', en: 'We take what is left.' },
        costs: [],
        result: {
          hu: 'A hang a raktárban is szól. Mindenki hallja, és senki nem mondja ki.',
          en: 'The voice sounds in the hold too. Everybody hears it and nobody says so.',
        },
        effects: [
          { k: 'attention', amount: 2 },
          { k: 'resource', id: 'morale', amount: -2 },
          { k: 'relic' },
        ],
      },
      {
        text: { hu: 'Otthagyjuk az egészet.', en: 'We leave the whole thing.' },
        costs: [],
        result: {
          hu: 'Ez volt a helyes döntés, és semmit nem kaptok érte. Így szokott lenni.',
          en: 'It was the right call and you get nothing for it. That is usually how it goes.',
        },
        effects: [{ k: 'attention', amount: -1 }],
      },
    ],
  },
]

registerEncounters(FIGURE_ENCOUNTERS)
