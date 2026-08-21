// Difficulty, as a set of small dials rather than one word.
//
// "Normal" and "hard" are not useful to somebody who finds the fights punishing
// but the countdown fine. So each pressure the game applies has its own dial,
// five steps, three being the game as designed. Turning one down is not cheating
// — it is saying which part of the game you came for.
//
// The numbers and the words live together here on purpose. A dial whose label
// says "fewer enemies" and whose multiplier says otherwise is worse than no dial
// at all, and keeping them in one literal is the cheapest way to stop that.
//
// The engine reads `value`; the interface reads `text`. Nothing else knows.

import type { Text } from '../engine/types'

export type DialId =
  | 'enemyCount'
  | 'enemyStrength'
  | 'flux'
  | 'encounterRisk'
  | 'upkeep'
  | 'puzzleTries'
  | 'gateTime'
  | 'boardingStakes'

/** When a change starts to matter. Honest, because some cannot apply at once. */
export type DialScope = 'nextLanding' | 'nextWeek' | 'nextExpedition'

export type DialLevel = {
  /** What the engine multiplies or offsets by. */
  value: number
  /** What that means in play, in one sentence. */
  text: Text
}

export type DialDef = {
  id: DialId
  name: Text
  /** What this dial is about, one line. */
  about: Text
  scope: DialScope
  /** Five steps, from gentlest to harshest. The third is the game as designed. */
  levels: [DialLevel, DialLevel, DialLevel, DialLevel, DialLevel]
}

/** The level everything starts at: the game as it was designed. */
export const DEFAULT_LEVEL = 3

export const DIALS: DialDef[] = [
  {
    id: 'enemyCount',
    name: { hu: 'Ellenfelek száma', en: 'How many enemies' },
    about: {
      hu: 'Hány ellenfél áll a pályán egy partraszálláskor.',
      en: 'How many enemies stand on the board when you land.',
    },
    scope: 'nextLanding',
    levels: [
      {
        value: 0.5,
        text: {
          hu: 'Feleannyi. A pálya szinte üres — a küldetés a terepről és a célról szól, nem a harcról.',
          en: 'Half as many. The board is nearly empty — the mission is about the ground and the objective, not the fight.',
        },
      },
      {
        value: 0.75,
        text: {
          hu: 'Negyeddel kevesebb. Marad harc, de ritkán kerülsz körbe.',
          en: 'A quarter fewer. Still a fight, but you are rarely surrounded.',
        },
      },
      {
        value: 1,
        text: {
          hu: 'Ahogy tervezve van: a szám a küldetés nehézségéből és a Sötétedésből jön.',
          en: 'As designed: the number comes from the mission difficulty and the Darkening.',
        },
      },
      {
        value: 1.3,
        text: {
          hu: 'Harmadával több. A Kötés és a területsebzés komolyan számítani fog.',
          en: 'A third more. The Bond and area attacks start to matter a lot.',
        },
      },
      {
        value: 1.6,
        text: {
          hu: 'Másfélszer annyi. Két hőssel ez nyílt terepen nem tartható — fedezékből kell játszani.',
          en: 'Half again as many. Two heroes cannot hold open ground against this; you play from cover.',
        },
      },
    ],
  },
  {
    id: 'enemyStrength',
    name: { hu: 'Ellenfelek ereje', en: 'How strong they are' },
    about: {
      hu: 'Milyen nehézségi szinten állítja össze a játék az ellenfélkészletet.',
      en: 'What difficulty level the enemy roster is put together at.',
    },
    scope: 'nextLanding',
    levels: [
      {
        value: -2,
        text: {
          hu: 'Két szinttel lejjebb: főleg Hamvadó vázak, alig pajzs és területsebzés.',
          en: 'Two levels down: mostly Ash Husks, hardly any shields or area attacks.',
        },
      },
      {
        value: -1,
        text: {
          hu: 'Egy szinttel lejjebb: kevesebb Rúnaőrző és Istengép-töredék.',
          en: 'One level down: fewer Rune Sentinels and God-machine Shards.',
        },
      },
      {
        value: 0,
        text: {
          hu: 'Ahogy tervezve van: a térkép mélysége és a Sötétedés dönt.',
          en: 'As designed: map depth and the Darkening decide.',
        },
      },
      {
        value: 1,
        text: {
          hu: 'Egy szinttel feljebb: a nehezebb ellenfelek hamarabb megjelennek.',
          en: 'One level up: the harder enemies turn up sooner.',
        },
      },
      {
        value: 2,
        text: {
          hu: 'Két szinttel feljebb: már az első rendszerben az, ami máskor a galaxis szívében.',
          en: 'Two levels up: the first system holds what the heart of the galaxy usually does.',
        },
      },
    ],
  },
  {
    id: 'flux',
    name: { hu: 'Induló Fluxus', en: 'Starting Flux' },
    about: {
      hu: 'Mennyi Fluxussal indul a partraszálló csapat, a Rúnamagon felül.',
      en: 'How much Flux the landing party starts with, on top of the rune core.',
    },
    scope: 'nextLanding',
    levels: [
      {
        value: 3,
        text: {
          hu: '+3. Az árcédulás lapfeleket szinte szabadon használhatod.',
          en: '+3. You can play the halves with a price tag almost freely.',
        },
      },
      {
        value: 1,
        text: {
          hu: '+1. Eggyel több árcédulás lapfél játszható ki egy csatában.',
          en: '+1. One more half with a price tag per battle.',
        },
      },
      {
        value: 0,
        text: {
          hu: 'Ahogy tervezve van: amit a Rúnamagra adtál, az a Fluxus.',
          en: 'As designed: what you gave the rune core is what you get.',
        },
      },
      {
        value: -1,
        text: {
          hu: '−1. Minden árcédulás lapfél kiválasztása fájni fog.',
          en: '−1. Choosing any half with a price tag will hurt.',
        },
      },
      {
        value: -2,
        text: {
          hu: '−2. Szinte csak az ingyenes felekkel játszol, hacsak nem adsz sokat a Rúnamagra.',
          en: '−2. Nearly all free halves, unless you pour power into the rune core.',
        },
      },
    ],
  },
  {
    id: 'encounterRisk',
    name: { hu: 'Találkozások kockázata', en: 'Risk in encounters' },
    about: {
      hu: 'Mennyi hajótestet visz el egy kockázatos döntés a leírt helyzetekben.',
      en: 'How much hull a risky decision takes in the written situations.',
    },
    scope: 'nextWeek',
    levels: [
      { value: 0.5, text: { hu: 'Feleannyi. A bátor válasz ritkán kerül sokba.', en: 'Half. The bold answer rarely costs much.' } },
      { value: 0.75, text: { hu: 'Negyeddel kevesebb.', en: 'A quarter less.' } },
      {
        value: 1,
        text: {
          hu: 'Ahogy tervezve van: a pajzs és a vértek vonják le, a többit a hajótest fizeti.',
          en: 'As designed: shields and wards absorb it, the hull pays the rest.',
        },
      },
      { value: 1.5, text: { hu: 'Másfélszer annyi. A Pajzsra adott energia sokat ér.', en: 'Half again as much. Power in the shields is worth a lot.' } },
      {
        value: 2,
        text: {
          hu: 'Dupla. Egy elhamarkodott döntés hazafordulást jelenthet.',
          en: 'Double. One rash decision can mean turning for home.',
        },
      },
    ],
  },
  {
    id: 'upkeep',
    name: { hu: 'Fogyás', en: 'Upkeep' },
    about: {
      hu: 'Mennyi élelmet eszik a legénység, és mennyi üzemanyag megy el egy hét úton.',
      en: 'How much food the crew eats and how much fuel a week under way burns.',
    },
    scope: 'nextWeek',
    levels: [
      { value: 0.5, text: { hu: 'Feleannyi. Az élelem és az üzemanyag nem lesz kérdés.', en: 'Half. Food and fuel stop being a question.' } },
      { value: 0.75, text: { hu: 'Negyeddel kevesebb: kényelmesebb kitérők.', en: 'A quarter less: detours are more comfortable.' } },
      { value: 1, text: { hu: 'Ahogy tervezve van.', en: 'As designed.' } },
      { value: 1.25, text: { hu: 'Negyeddel több: minden kitérőt meg kell tervezni.', en: 'A quarter more: every detour has to be planned.' } },
      {
        value: 1.5,
        text: {
          hu: 'Másfélszer annyi. Egy hosszabb út éhezéssel járhat.',
          en: 'Half again as much. A longer road can mean going hungry.',
        },
      },
    ],
  },
  {
    id: 'puzzleTries',
    name: { hu: 'Feladvány-próbák', en: 'Puzzle attempts' },
    about: {
      hu: 'Hány próbálkozásod van egy feladványon, mielőtt otthagyod.',
      en: 'How many tries you get at a puzzle before you leave it.',
    },
    scope: 'nextLanding',
    levels: [
      { value: 4, text: { hu: '+4 próba. Ki lehet kísérletezni a megoldást.', en: '+4 tries. You can experiment your way to it.' } },
      { value: 2, text: { hu: '+2 próba. Egy elrontott tipp nem tragédia.', en: '+2 tries. One bad guess is not fatal.' } },
      { value: 0, text: { hu: 'Ahogy tervezve van: a feladvány nehézsége adja.', en: 'As designed: the puzzle’s difficulty decides.' } },
      { value: -1, text: { hu: '−1 próba. Végig kell gondolni, mielőtt beadod.', en: '−1 try. Think it through before you submit.' } },
      { value: -2, text: { hu: '−2 próba. Egy elrontott tipp gyakran a küldetés.', en: '−2 tries. One bad guess often is the mission.' } },
    ],
  },
  {
    id: 'boardingStakes',
    name: { hu: 'Hajóra törés tétje', en: 'Stakes when boarded' },
    about: {
      hu: 'Hány hajómodul áll a rácson, amikor a hajót támadják — az ellenség szétveri őket, és ami elpusztul, az az expedíció végéig hiányzik.',
      en: 'How many of the ship’s modules stand on the board when it is boarded — enemies tear at them, and whatever is destroyed is gone for the rest of the expedition.',
    },
    scope: 'nextLanding',
    levels: [
      {
        value: 0,
        text: {
          hu: 'Egy sem. A hajóra törés csak egy csata: a modulok nincsenek veszélyben.',
          en: 'None. A boarding action is just a battle: the modules are not at risk.',
        },
      },
      {
        value: 1,
        text: {
          hu: 'Egy modul. Meg lehet védeni, ha az ember odaér.',
          en: 'One module. Defensible, if you get there.',
        },
      },
      {
        value: 2,
        text: {
          hu: 'Ahogy tervezve van: két modul áll a rácson, és általában csak az egyiket lehet megvédeni.',
          en: 'As designed: two modules stand on the board, and usually only one of them can be held.',
        },
      },
      {
        value: 3,
        text: {
          hu: 'Három modul. Szét kell válni, és valamit fel kell adni.',
          en: 'Three modules. You have to split up and give something up.',
        },
      },
      {
        value: 4,
        text: {
          hu: 'Négy modul. Egy elrontott hajóra törés hetekre visszavet — a kutatásod egy része a rácson áll.',
          en: 'Four modules. One botched boarding sets you back weeks — part of your research is standing on that board.',
        },
      },
    ],
  },
  {
    id: 'gateTime',
    name: { hu: 'A Kapu ideje', en: 'The Gate’s time' },
    about: {
      hu: 'Hány hetet ad a Kapu egy expedícióra. Csak új expedíciónál él.',
      en: 'How many weeks the Gate gives an expedition. New expeditions only.',
    },
    scope: 'nextExpedition',
    levels: [
      { value: 1.5, text: { hu: 'Másfélszer annyi hét. Mindenre lesz idő.', en: 'Half again as many weeks. There is time for everything.' } },
      { value: 1.25, text: { hu: 'Negyeddel több hét.', en: 'A quarter more weeks.' } },
      { value: 1, text: { hu: 'Ahogy tervezve van: rövid 20, közepes 28, hosszú 40 hét.', en: 'As designed: short 20, medium 28, long 40 weeks.' } },
      { value: 0.85, text: { hu: 'Kevesebb hét: a kitérőkért fizetni kell.', en: 'Fewer weeks: detours have to be paid for.' } },
      {
        value: 0.7,
        text: {
          hu: 'Harmadával kevesebb hét. Célra tartó útvonal, kevés kitérő.',
          en: 'A third fewer weeks. A direct route and few detours.',
        },
      },
    ],
  },
]

export type Dials = Record<DialId, number>

export function defaultDials(): Dials {
  const out = {} as Dials
  for (const dial of DIALS) out[dial.id] = DEFAULT_LEVEL
  return out
}

export function dialDef(id: DialId): DialDef {
  const found = DIALS.find((d) => d.id === id)
  if (!found) throw new Error(`No such difficulty dial: ${id}`)
  return found
}

/** The number the engine works with, for the level currently chosen. */
export function dialValue(dials: Dials, id: DialId): number {
  const level = Math.max(1, Math.min(5, dials[id] ?? DEFAULT_LEVEL))
  return dialDef(id).levels[level - 1]!.value
}

/** Is anything set away from the designed game? */
export function dialsAreDefault(dials: Dials): boolean {
  return DIALS.every((d) => (dials[d.id] ?? DEFAULT_LEVEL) === DEFAULT_LEVEL)
}

/** Fill in anything a saved or older set is missing. */
export function normaliseDials(raw: unknown): Dials {
  const out = defaultDials()
  if (typeof raw !== 'object' || raw === null) return out
  for (const dial of DIALS) {
    const value = (raw as Record<string, unknown>)[dial.id]
    if (typeof value === 'number' && value >= 1 && value <= 5) out[dial.id] = Math.round(value)
  }
  return out
}
