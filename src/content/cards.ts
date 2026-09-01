// The ability cards of the two starting heroes.
//
// BALANCE: this file is deliberately nothing but data. The numbers (initiative,
// power, range, flux cost) can be rewritten freely without touching any logic,
// and TypeScript will complain if an effect name is mistyped.
//
// Rules of thumb:
//  - low initiative = acts earlier, so the effect should be slightly weaker
//  - a flux cost only where the effect is outstandingly strong
//  - a "lostOnUse" half: very strong, but only once per battle

import type { Card } from '../engine/types'

export const CARDS: Card[] = [
  // ============================================================ RUNESMITH

  {
    id: 'rs-hammer-arc',
    name: { hu: 'Kalapácsív', en: 'Hammer Arc' },
    heroClass: 'runesmith',
    initiative: 45,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Támadás 3, hatótáv 1. A cél Horgony alá kerül.',
        en: 'Attack 3, range 1. The target is Anchored.',
      },
      effects: [{ k: 'attack', power: 3, range: 1, status: { kind: 'anchor', rounds: 2 } }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'rs-iron-ward',
    name: { hu: 'Vasvért', en: 'Iron Ward' },
    heroClass: 'runesmith',
    initiative: 30,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 2, hatótáv 1', en: 'Attack 2, range 1' },
      effects: [{ k: 'attack', power: 2, range: 1 }],
    },
    bottom: {
      text: { hu: 'Vért 2 magadra és a párodra', en: 'Shield 2 to yourself and your partner' },
      effects: [{ k: 'shield', power: 2, alsoPartner: true }],
    },
  },

  {
    id: 'rs-rune-pillar',
    name: { hu: 'Rúnaoszlop', en: 'Rune Pillar' },
    heroClass: 'runesmith',
    initiative: 60,
    symbols: ['force', 'insight'],
    top: {
      text: {
        hu: 'Emelj rúnaoszlopot egy szomszédos üres mezőre. Blokkolja a mozgást és a látást.',
        en: 'Raise a rune pillar on an adjacent empty tile. It blocks movement and sight.',
      },
      effects: [{ k: 'pillar' }],
    },
    bottom: {
      text: { hu: 'Mozgás 1, Vért 1', en: 'Move 1, Shield 1' },
      effects: [
        { k: 'move', distance: 1 },
        { k: 'shield', power: 1 },
      ],
    },
  },

  {
    id: 'rs-earthquake',
    name: { hu: 'Földrengés', en: 'Earthquake' },
    heroClass: 'runesmith',
    initiative: 70,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Támadás 2 minden szomszédos ellenségre, és Ledöntés.',
        en: 'Attack 2 against every adjacent enemy, and Prone.',
      },
      flux: 2,
      effects: [
        { k: 'areaAroundSelf', power: 2, radius: 1, status: { kind: 'prone', rounds: 1 } },
      ],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'rs-shove',
    name: { hu: 'Lökés', en: 'Shove' },
    heroClass: 'runesmith',
    initiative: 20,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 1, hatótáv 1, Hátralökés 2', en: 'Attack 1, range 1, Knockback 2' },
      effects: [{ k: 'attack', power: 1, range: 1, knockback: 2 }],
    },
    bottom: {
      text: { hu: 'Mozgás 3', en: 'Move 3' },
      effects: [{ k: 'move', distance: 3 }],
    },
  },

  {
    id: 'rs-set-trap',
    name: { hu: 'Csapdaállítás', en: 'Set Trap' },
    heroClass: 'runesmith',
    initiative: 55,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Állíts csapdát egy szomszédos üres mezőre. Aki rálép, 3 sebzést kap.',
        en: 'Place a trap on an adjacent empty tile. Whoever steps on it takes 3 damage.',
      },
      effects: [{ k: 'trap', power: 3 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2, Vért 1', en: 'Move 2, Shield 1' },
      effects: [
        { k: 'move', distance: 2 },
        { k: 'shield', power: 1 },
      ],
    },
  },

  {
    id: 'rs-forge-wrath',
    name: { hu: 'Kohó dühe', en: 'Wrath of the Forge' },
    heroClass: 'runesmith',
    initiative: 40,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 4, hatótáv 1', en: 'Attack 4, range 1' },
      flux: 1,
      effects: [{ k: 'attack', power: 4, range: 1 }],
    },
    bottom: {
      text: { hu: 'Mozgás 1', en: 'Move 1' },
      effects: [{ k: 'move', distance: 1 }],
    },
  },

  {
    id: 'rs-endurance',
    name: { hu: 'Kitartás', en: 'Endurance' },
    heroClass: 'runesmith',
    initiative: 15,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 2, hatótáv 1', en: 'Attack 2, range 1' },
      effects: [{ k: 'attack', power: 2, range: 1 }],
    },
    bottom: {
      text: { hu: 'Gyógyítás 2 magadra', en: 'Heal 2 on yourself' },
      effects: [{ k: 'heal', power: 2 }],
    },
  },

  {
    id: 'rs-cast-anchor',
    name: { hu: 'Horgonyvetés', en: 'Cast Anchor' },
    heroClass: 'runesmith',
    initiative: 35,
    symbols: ['insight'],
    top: {
      text: {
        hu:
          'Horgony egy ellenségre 3 hatótávon belül. Nem tud elmozdulni, és a ' +
          'területhatások +1-et sebeznek rá.',
        en:
          'Anchor an enemy within range 3. It cannot move, and area effects deal +1 damage ' +
          'to it.',
      },
      effects: [{ k: 'status', status: 'anchor', rounds: 2, range: 3 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2, Vért 1', en: 'Move 2, Shield 1' },
      effects: [
        { k: 'move', distance: 2 },
        { k: 'shield', power: 1 },
      ],
    },
  },

  {
    id: 'rs-last-anvil',
    name: { hu: 'Utolsó üllő', en: 'Last Anvil' },
    heroClass: 'runesmith',
    initiative: 80,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 6, hatótáv 1, Ledöntés.', en: 'Attack 6, range 1, Prone.' },
      lostOnUse: true,
      effects: [{ k: 'attack', power: 6, range: 1, status: { kind: 'prone', rounds: 1 } }],
    },
    bottom: {
      text: { hu: 'Mozgás 4', en: 'Move 4' },
      effects: [{ k: 'move', distance: 4 }],
    },
  },

  {
    id: 'rs-ore-throw',
    name: { hu: 'Ércvetés', en: 'Ore Throw' },
    heroClass: 'runesmith',
    initiative: 50,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 2, hatótáv 3', en: 'Attack 2, range 3' },
      effects: [{ k: 'attack', power: 2, range: 3 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2, Vért 1', en: 'Move 2, Shield 1' },
      effects: [
        { k: 'move', distance: 2 },
        { k: 'shield', power: 1 },
      ],
    },
  },

  {
    id: 'rs-charging-cut',
    name: { hu: 'Rohamvágás', en: 'Charging Cut' },
    heroClass: 'runesmith',
    initiative: 25,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Támadás 2, hatótáv 1, két külön célpontra.',
        en: 'Attack 2, range 1, against two separate targets.',
      },
      effects: [{ k: 'attack', power: 2, range: 1, targets: 2 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'rs-stand-fast',
    name: { hu: 'Állóhely', en: 'Stand Fast' },
    heroClass: 'runesmith',
    initiative: 18,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Vért 3 magadra, majd Támadás 2 minden szomszédos ellenségre.',
        en: 'Shield 3 on yourself, then Attack 2 against every adjacent enemy.',
      },
      effects: [
        { k: 'shield', power: 3 },
        { k: 'areaAroundSelf', power: 2, radius: 1 },
      ],
    },
    bottom: {
      text: { hu: 'Gyógyítás 3 magadra', en: 'Heal 3 on yourself' },
      effects: [{ k: 'heal', power: 3 }],
    },
  },

  // =========================================================== ECHO-READER

  {
    id: 'er-rune-mark',
    name: { hu: 'Rúnajel', en: 'Rune Mark' },
    heroClass: 'echoreader',
    initiative: 25,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Rúnajel egy ellenségre 4 hatótávon belül. A párod közelharci támadása +2 rá.',
        en: "Rune Mark an enemy within range 4. Your partner's melee attacks deal +2 to it.",
      },
      effects: [{ k: 'status', status: 'runeMark', rounds: 2, range: 4 }],
    },
    bottom: {
      text: { hu: 'Mozgás 3', en: 'Move 3' },
      effects: [{ k: 'move', distance: 3 }],
    },
  },

  {
    id: 'er-ashing-wind',
    name: { hu: 'Hamvazó szél', en: 'Ashing Wind' },
    heroClass: 'echoreader',
    initiative: 50,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Válassz egy mezőt 3 hatótávon belül. Támadás 2 minden ellenségre a szomszédságában.',
        en: 'Choose a tile within range 3. Attack 2 against every enemy adjacent to it.',
      },
      effects: [{ k: 'areaAtPoint', power: 2, range: 3, radius: 1 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'er-echo',
    name: { hu: 'Visszhang', en: 'Echo' },
    heroClass: 'echoreader',
    initiative: 65,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Játszd újra egy elhasznált lapod felső felét.',
        en: 'Replay the top half of one of your discarded cards.',
      },
      flux: 2,
      lostOnUse: true,
      effects: [{ k: 'echo' }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'er-dimming',
    name: { hu: 'Elhomályosítás', en: 'Dimming' },
    heroClass: 'echoreader',
    initiative: 20,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Elvakítás egy ellenségre 4 hatótávon belül. A következő támadása nem sebez.',
        en: 'Blind an enemy within range 4. Its next attack deals no damage.',
      },
      effects: [{ k: 'status', status: 'blind', rounds: 1, range: 4 }],
    },
    bottom: {
      text: {
        hu: 'Mozgás 2, Vért 1 magadra és a párodra',
        en: 'Move 2, Shield 1 to yourself and your partner',
      },
      effects: [
        { k: 'move', distance: 2 },
        { k: 'shield', power: 1, alsoPartner: true },
      ],
    },
  },

  {
    id: 'er-choir-shard',
    name: { hu: 'Kórus-szilánk', en: 'Choir Shard' },
    heroClass: 'echoreader',
    initiative: 40,
    symbols: ['insight'],
    top: {
      text: { hu: 'Támadás 3, hatótáv 4', en: 'Attack 3, range 4' },
      effects: [{ k: 'attack', power: 3, range: 4 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'er-hex-ring',
    name: { hu: 'Rontásgyűrű', en: 'Hex Ring' },
    heroClass: 'echoreader',
    initiative: 60,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Támadás 2 minden ellenségre 2 hatótávon belül.',
        en: 'Attack 2 against every enemy within range 2.',
      },
      flux: 1,
      effects: [{ k: 'areaAroundSelf', power: 2, radius: 2 }],
    },
    bottom: {
      text: { hu: 'Mozgás 1', en: 'Move 1' },
      effects: [{ k: 'move', distance: 1 }],
    },
  },

  {
    id: 'er-flux-tap',
    name: { hu: 'Fluxus-csapolás', en: 'Flux Tap' },
    heroClass: 'echoreader',
    initiative: 30,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Támadás 1, hatótáv 3, majd +2 Fluxus a közös készletbe.',
        en: 'Attack 1, range 3, then +2 Flux into the shared pool.',
      },
      effects: [
        { k: 'attack', power: 1, range: 3 },
        { k: 'flux', power: 2 },
      ],
    },
    bottom: {
      text: { hu: 'Mozgás 3', en: 'Move 3' },
      effects: [{ k: 'move', distance: 3 }],
    },
  },

  {
    id: 'er-memory-shred',
    name: { hu: 'Emlékfoszlány', en: 'Memory Shred' },
    heroClass: 'echoreader',
    initiative: 35,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Támadás 2, hatótáv 3, és a cél Ledöntve.',
        en: 'Attack 2, range 3, and the target is Prone.',
      },
      effects: [{ k: 'attack', power: 2, range: 3, status: { kind: 'prone', rounds: 1 } }],
    },
    bottom: {
      text: {
        hu: 'Vegyél vissza egy lapot az elhasznált kupacodból a kezedbe.',
        en: 'Take one card from your discard pile back into your hand.',
      },
      effects: [{ k: 'recoverCard' }],
    },
  },

  {
    id: 'er-weakening-song',
    name: { hu: 'Gyengítő ének', en: 'Weakening Song' },
    heroClass: 'echoreader',
    initiative: 45,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Gyengítés minden ellenségre 3 hatótávon belül. A támadásaik -1-et sebeznek.',
        en: 'Weaken every enemy within range 3. Their attacks deal 1 less damage.',
      },
      effects: [
        { k: 'areaAroundSelf', power: 0, radius: 3, status: { kind: 'weakened', rounds: 2 } },
      ],
    },
    bottom: {
      text: {
        hu: 'Mozgás 2, Gyógyítás 1 magadra és a párodra',
        en: 'Move 2, Heal 1 on yourself and your partner',
      },
      effects: [
        { k: 'move', distance: 2 },
        { k: 'heal', power: 1, alsoPartner: true },
      ],
    },
  },

  {
    id: 'er-silent-command',
    name: { hu: 'Néma parancs', en: 'Silent Command' },
    heroClass: 'echoreader',
    initiative: 10,
    symbols: ['insight'],
    top: {
      text: { hu: 'Támadás 5, hatótáv 5', en: 'Attack 5, range 5' },
      lostOnUse: true,
      effects: [{ k: 'attack', power: 5, range: 5 }],
    },
    bottom: {
      text: { hu: 'Mozgás 5', en: 'Move 5' },
      effects: [{ k: 'move', distance: 5 }],
    },
  },

  {
    id: 'er-ash-veil',
    name: { hu: 'Hamuköd', en: 'Ash Veil' },
    heroClass: 'echoreader',
    initiative: 22,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Elvakítás minden ellenségre 2 hatótávon belül. A támadásaik nem sebeznek.',
        en: 'Blind every enemy within range 2. Their attacks deal no damage.',
      },
      flux: 1,
      effects: [
        { k: 'areaAroundSelf', power: 0, radius: 2, status: { kind: 'blind', rounds: 1 } },
      ],
    },
    bottom: {
      text: { hu: 'Mozgás 3', en: 'Move 3' },
      effects: [{ k: 'move', distance: 3 }],
    },
  },

  {
    id: 'er-soul-swap',
    name: { hu: 'Lélekcsere', en: 'Soul Swap' },
    heroClass: 'echoreader',
    initiative: 15,
    symbols: ['insight'],
    top: {
      text: { hu: 'Támadás 2, hatótáv 3, Hátralökés 2', en: 'Attack 2, range 3, Knockback 2' },
      effects: [{ k: 'attack', power: 2, range: 3, knockback: 2 }],
    },
    bottom: {
      text: { hu: 'Mozgás 4', en: 'Move 4' },
      effects: [{ k: 'move', distance: 4 }],
    },
  },

  {
    id: 'er-echo-choir',
    name: { hu: 'Visszhangkórus', en: 'Echo Choir' },
    heroClass: 'echoreader',
    initiative: 55,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Támadás 3, hatótáv 3, és a cél Rúnajel alá kerül.',
        en: 'Attack 3, range 3, and the target gets Rune Mark.',
      },
      effects: [{ k: 'attack', power: 3, range: 3, status: { kind: 'runeMark', rounds: 2 } }],
    },
    bottom: {
      text: {
        hu: 'Gyógyítás 2 magadra és a párodra',
        en: 'Heal 2 on yourself and your partner',
      },
      effects: [{ k: 'heal', power: 2, alsoPartner: true }],
    },
  },

  // ==================================================== ADVANCEMENT CARDS
  //
  // Not in either starting deck. Each one is bought with the hero's own marks
  // (content/advance.ts), which makes them the only cards in the game one player
  // owns and the other does not.

  {
    id: 'rs-rampart',
    name: { hu: 'Sáncvonal', en: 'Rampart' },
    heroClass: 'runesmith',
    advanced: true,
    initiative: 35,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Támadás 3, hatótáv 1, hátralökés 1',
        en: 'Attack 3, range 1, knockback 1',
      },
      effects: [{ k: 'attack', power: 3, range: 1, knockback: 1 }],
    },
    bottom: {
      text: {
        hu: 'Vért 2 magadra és a párodra, majd emelj rúnaoszlopot egy szomszédos mezőre',
        en: 'Shield 2 to yourself and your partner, then raise a rune pillar on an adjacent tile',
      },
      flux: 1,
      effects: [{ k: 'shield', power: 2, alsoPartner: true }, { k: 'pillar' }],
    },
  },

  {
    id: 'er-still-note',
    name: { hu: 'Álló hang', en: 'The Still Note' },
    heroClass: 'echoreader',
    advanced: true,
    initiative: 55,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Területsebzés 2, hatótáv 4, sugár 1. A találtak Rúnajel alá kerülnek.',
        en: 'Area attack 2, range 4, radius 1. Everything hit is Rune Marked.',
      },
      flux: 1,
      effects: [
        {
          k: 'areaAtPoint',
          power: 2,
          range: 4,
          radius: 1,
          status: { kind: 'runeMark', rounds: 2 },
        },
      ],
    },
    bottom: {
      text: {
        hu: 'Mozgás 3, majd vegyél vissza egy lapot az eldobottak közül',
        en: 'Move 3, then take a card back from your discard pile',
      },
      effects: [{ k: 'move', distance: 3 }, { k: 'recoverCard' }],
    },
  },
]

const CARD_INDEX = new Map(CARDS.map((c) => [c.id, c]))

export function card(id: string): Card {
  const c = CARD_INDEX.get(id)
  if (!c) throw new Error(`No such card: ${id}`)
  return c
}

/**
 * The starting deck of a class.
 *
 * Advancement cards are left out: they only reach a deck through the perk that
 * grants them (content/advance.ts), and a deck-building call must never hand one
 * out for free. `allCardsOfClass` is the one that still sees everything, for the
 * checks that have to cover every card ever written.
 */
export function cardsOfClass(heroClass: Card['heroClass']): Card[] {
  return CARDS.filter((c) => c.heroClass === heroClass && !c.advanced)
}

export function allCardsOfClass(heroClass: Card['heroClass']): Card[] {
  return CARDS.filter((c) => c.heroClass === heroClass)
}
