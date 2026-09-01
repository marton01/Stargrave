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


  // ================================================================== CANTOR
  //
  // The support. Every other class solves a problem by removing an enemy; she
  // solves it by keeping somebody standing. Which is why she only exists once
  // there are three or four heroes on the board: with two, a healer is half the
  // party and the fight becomes a stalemate.
  //
  // BALANCE: her attacks are deliberately mediocre — 2 at range 2 is the ceiling
  // for a non-lost half. What she has instead is the only reliable healing on the
  // grid, and the only card in the game that hands out Flux.

  {
    id: 'ct-steady-note',
    name: { hu: 'Nyugtató hang', en: 'Steady Note' },
    heroClass: 'cantor',
    initiative: 40,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Gyógyíts 2-t magadon és a legközelebbi társadon',
        en: 'Heal 2 on yourself and your nearest ally',
      },
      effects: [{ k: 'heal', power: 2, alsoPartner: true }],
    },
    bottom: {
      text: { hu: 'Mozgás 3', en: 'Move 3' },
      effects: [{ k: 'move', distance: 3 }],
    },
  },

  {
    id: 'ct-litany',
    name: { hu: 'Litánia', en: 'Litany' },
    heroClass: 'cantor',
    initiative: 55,
    symbols: ['insight'],
    top: {
      text: { hu: 'Támadás 2, hatótáv 2', en: 'Attack 2, range 2' },
      effects: [{ k: 'attack', power: 2, range: 2 }],
    },
    bottom: {
      text: {
        hu: 'Vért 1 magadra és a legközelebbi társadra',
        en: 'Shield 1 to yourself and your nearest ally',
      },
      effects: [{ k: 'shield', power: 1, alsoPartner: true }],
    },
  },

  {
    id: 'ct-hold-the-line',
    name: { hu: 'Tartsd a sort', en: 'Hold the Line' },
    heroClass: 'cantor',
    initiative: 25,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Vért 2 magadra és a legközelebbi társadra',
        en: 'Shield 2 to yourself and your nearest ally',
      },
      effects: [{ k: 'shield', power: 2, alsoPartner: true }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'ct-open-throat',
    name: { hu: 'Nyitott torok', en: 'Open Throat' },
    heroClass: 'cantor',
    initiative: 60,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Gyógyíts 3-at magadon és a legközelebbi társadon',
        en: 'Heal 3 on yourself and your nearest ally',
      },
      flux: 1,
      effects: [{ k: 'heal', power: 3, alsoPartner: true }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'ct-hymn-of-iron',
    name: { hu: 'Vas-himnusz', en: 'Hymn of Iron' },
    heroClass: 'cantor',
    initiative: 35,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 3, hatótáv 1', en: 'Attack 3, range 1' },
      effects: [{ k: 'attack', power: 3, range: 1 }],
    },
    bottom: {
      text: { hu: 'Vért 2 magadra', en: 'Shield 2 to yourself' },
      effects: [{ k: 'shield', power: 2 }],
    },
  },

  {
    id: 'ct-breath',
    name: { hu: 'Lélegzet', en: 'Breath' },
    heroClass: 'cantor',
    initiative: 20,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Gyógyíts 1-et magadon és a legközelebbi társadon',
        en: 'Heal 1 on yourself and your nearest ally',
      },
      effects: [{ k: 'heal', power: 1, alsoPartner: true }],
    },
    bottom: {
      text: {
        hu: 'Vegyél vissza egy lapot az eldobottak közül',
        en: 'Take a card back from your discard pile',
      },
      effects: [{ k: 'recoverCard' }],
    },
  },

  {
    id: 'ct-choir-call',
    name: { hu: 'Kórushívás', en: 'Choir Call' },
    heroClass: 'cantor',
    initiative: 50,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Területsebzés 1 magad körül, sugár 2. A találtak megvakulnak.',
        en: 'Area attack 1 around yourself, radius 2. Everything hit is blinded.',
      },
      effects: [
        { k: 'areaAroundSelf', power: 1, radius: 2, status: { kind: 'blind', rounds: 1 } },
      ],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'ct-marching-song',
    name: { hu: 'Menetdal', en: 'Marching Song' },
    heroClass: 'cantor',
    initiative: 70,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 2, hatótáv 2', en: 'Attack 2, range 2' },
      effects: [{ k: 'attack', power: 2, range: 2 }],
    },
    bottom: {
      text: { hu: 'Mozgás 4', en: 'Move 4' },
      effects: [{ k: 'move', distance: 4 }],
    },
  },

  {
    id: 'ct-flux-hymn',
    name: { hu: 'Fluxus-ének', en: 'Flux Hymn' },
    heroClass: 'cantor',
    initiative: 45,
    symbols: ['insight'],
    top: {
      text: { hu: 'A csapat 2 Fluxust kap', en: 'The party gains 2 Flux' },
      effects: [{ k: 'flux', power: 2 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'ct-shield-of-voices',
    name: { hu: 'Hangpajzs', en: 'Shield of Voices' },
    heroClass: 'cantor',
    initiative: 30,
    symbols: ['force', 'insight'],
    top: {
      text: {
        hu: 'Vért 3 magadra és a legközelebbi társadra',
        en: 'Shield 3 to yourself and your nearest ally',
      },
      flux: 1,
      effects: [{ k: 'shield', power: 3, alsoPartner: true }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'ct-rebuke',
    name: { hu: 'Dorgálás', en: 'Rebuke' },
    heroClass: 'cantor',
    initiative: 65,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Támadás 2, hatótáv 2. A cél legyengül.',
        en: 'Attack 2, range 2. The target is weakened.',
      },
      effects: [
        { k: 'attack', power: 2, range: 2, status: { kind: 'weakened', rounds: 2 } },
      ],
    },
    bottom: {
      text: { hu: 'Mozgás 3', en: 'Move 3' },
      effects: [{ k: 'move', distance: 3 }],
    },
  },

  {
    id: 'ct-name-the-fallen',
    name: { hu: 'A nevek felolvasása', en: 'Naming the Fallen' },
    heroClass: 'cantor',
    initiative: 15,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Gyógyíts 4-et és adj Vért 2-t magadnak és a legközelebbi társadnak. A lap elvész.',
        en: 'Heal 4 and Shield 2 to yourself and your nearest ally. The card is lost.',
      },
      lostOnUse: true,
      effects: [
        { k: 'heal', power: 4, alsoPartner: true },
        { k: 'shield', power: 2, alsoPartner: true },
      ],
    },
    bottom: {
      text: { hu: 'Mozgás 1', en: 'Move 1' },
      effects: [{ k: 'move', distance: 1 }],
    },
  },

  {
    id: 'ct-last-verse',
    name: { hu: 'Utolsó versszak', en: 'Last Verse' },
    heroClass: 'cantor',
    initiative: 80,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Gyógyíts 5-öt magadon és a legközelebbi társadon. A lap elvész.',
        en: 'Heal 5 on yourself and your nearest ally. The card is lost.',
      },
      lostOnUse: true,
      effects: [{ k: 'heal', power: 5, alsoPartner: true }],
    },
    bottom: {
      text: {
        hu: 'Területsebzés 2 magad körül, sugár 1',
        en: 'Area attack 2 around yourself, radius 1',
      },
      effects: [{ k: 'areaAroundSelf', power: 2, radius: 1 }],
    },
  },

  // ================================================================ SURVEYOR
  //
  // The artillery. Everything he does is at a distance, and everything is slow:
  // his initiative numbers are the highest in the game, so he acts after the
  // enemies have committed to something. He is the reason a party of four wants
  // somebody standing in front.
  //
  // BALANCE: range 4-6 with almost no defence at all — 8 hit points and a single
  // Shield half in the whole deck. Anything that reaches him kills him.

  {
    id: 'sv-quick-sight',
    name: { hu: 'Gyors szemmérték', en: 'Quick Sight' },
    heroClass: 'surveyor',
    initiative: 15,
    symbols: ['insight'],
    top: {
      text: { hu: 'Támadás 2, hatótáv 4', en: 'Attack 2, range 4' },
      effects: [{ k: 'attack', power: 2, range: 4 }],
    },
    bottom: {
      text: { hu: 'Mozgás 4', en: 'Move 4' },
      effects: [{ k: 'move', distance: 4 }],
    },
  },

  {
    id: 'sv-star-fix',
    name: { hu: 'Csillagpont', en: 'Star Fix' },
    heroClass: 'surveyor',
    initiative: 20,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Egy ellenfél 5 mezőn belül Horgony alá kerül',
        en: 'An enemy within 5 tiles is Anchored',
      },
      effects: [{ k: 'status', status: 'anchor', rounds: 2, range: 5 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2, majd Vért 1 magadra', en: 'Move 2, then Shield 1 to yourself' },
      effects: [
        { k: 'move', distance: 2 },
        { k: 'shield', power: 1 },
      ],
    },
  },

  {
    id: 'sv-fall-back',
    name: { hu: 'Hátralépés', en: 'Fall Back' },
    heroClass: 'surveyor',
    initiative: 25,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Támadás 2, hatótáv 3, hátralökés 1',
        en: 'Attack 2, range 3, knockback 1',
      },
      effects: [{ k: 'attack', power: 2, range: 3, knockback: 1 }],
    },
    bottom: {
      text: { hu: 'Mozgás 4', en: 'Move 4' },
      effects: [{ k: 'move', distance: 4 }],
    },
  },

  {
    id: 'sv-range-mark',
    name: { hu: 'Bemérés', en: 'Ranging Mark' },
    heroClass: 'surveyor',
    initiative: 30,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Egy ellenfél 5 mezőn belül Rúnajel alá kerül',
        en: 'An enemy within 5 tiles is Rune Marked',
      },
      effects: [{ k: 'status', status: 'runeMark', rounds: 3, range: 5 }],
    },
    bottom: {
      text: { hu: 'Mozgás 3', en: 'Move 3' },
      effects: [{ k: 'move', distance: 3 }],
    },
  },

  {
    id: 'sv-spotter',
    name: { hu: 'Megfigyelő', en: 'Spotter' },
    heroClass: 'surveyor',
    initiative: 35,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Egy ellenfél 5 mezőn belül megvakul',
        en: 'An enemy within 5 tiles is blinded',
      },
      effects: [{ k: 'status', status: 'blind', rounds: 2, range: 5 }],
    },
    bottom: {
      text: { hu: 'Mozgás 3', en: 'Move 3' },
      effects: [{ k: 'move', distance: 3 }],
    },
  },

  {
    id: 'sv-set-the-legs',
    name: { hu: 'Állványozás', en: 'Setting the Legs' },
    heroClass: 'surveyor',
    initiative: 45,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 3, hatótáv 4', en: 'Attack 3, range 4' },
      effects: [{ k: 'attack', power: 3, range: 4 }],
    },
    bottom: {
      text: { hu: 'Vért 1 magadra', en: 'Shield 1 to yourself' },
      effects: [{ k: 'shield', power: 1 }],
    },
  },

  {
    id: 'sv-plumb-line',
    name: { hu: 'Függőón', en: 'Plumb Line' },
    heroClass: 'surveyor',
    initiative: 50,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Támadás 3, hatótáv 3. A cél földre kerül.',
        en: 'Attack 3, range 3. The target is knocked prone.',
      },
      effects: [{ k: 'attack', power: 3, range: 3, status: { kind: 'prone', rounds: 1 } }],
    },
    bottom: {
      text: { hu: 'Mozgás 3', en: 'Move 3' },
      effects: [{ k: 'move', distance: 3 }],
    },
  },

  {
    id: 'sv-triangulate',
    name: { hu: 'Háromszögelés', en: 'Triangulation' },
    heroClass: 'surveyor',
    initiative: 55,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Támadás 2, hatótáv 5, két külön célpontra',
        en: 'Attack 2, range 5, on two separate targets',
      },
      effects: [{ k: 'attack', power: 2, range: 5, targets: 2 }],
    },
    bottom: {
      text: { hu: 'Mozgás 1', en: 'Move 1' },
      effects: [{ k: 'move', distance: 1 }],
    },
  },

  {
    id: 'sv-scatter-shot',
    name: { hu: 'Szórás', en: 'Scatter Shot' },
    heroClass: 'surveyor',
    initiative: 60,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Területsebzés 2 egy 4 mezőn belüli pontra, sugár 1',
        en: 'Area attack 2 at a point within 4 tiles, radius 1',
      },
      effects: [{ k: 'areaAtPoint', power: 2, range: 4, radius: 1 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'sv-shell',
    name: { hu: 'Gránát', en: 'Shell' },
    heroClass: 'surveyor',
    initiative: 70,
    symbols: ['force'],
    top: {
      text: {
        hu: 'Területsebzés 3 egy 5 mezőn belüli pontra, sugár 1',
        en: 'Area attack 3 at a point within 5 tiles, radius 1',
      },
      flux: 1,
      effects: [{ k: 'areaAtPoint', power: 3, range: 5, radius: 1 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'sv-long-shot',
    name: { hu: 'Hosszú lövés', en: 'Long Shot' },
    heroClass: 'surveyor',
    initiative: 75,
    symbols: ['force', 'insight'],
    top: {
      text: { hu: 'Támadás 4, hatótáv 5', en: 'Attack 4, range 5' },
      flux: 1,
      effects: [{ k: 'attack', power: 4, range: 5 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
    },
  },

  {
    id: 'sv-steady-hand',
    name: { hu: 'Biztos kéz', en: 'Steady Hand' },
    heroClass: 'surveyor',
    initiative: 80,
    symbols: ['force'],
    top: {
      text: { hu: 'Támadás 5, hatótáv 4. A lap elvész.', en: 'Attack 5, range 4. The card is lost.' },
      lostOnUse: true,
      effects: [{ k: 'attack', power: 5, range: 4 }],
    },
    bottom: {
      text: { hu: 'Mozgás 1', en: 'Move 1' },
      effects: [{ k: 'move', distance: 1 }],
    },
  },

  {
    id: 'sv-final-measure',
    name: { hu: 'Utolsó mérés', en: 'The Last Measure' },
    heroClass: 'surveyor',
    initiative: 10,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Területsebzés 3 egy 6 mezőn belüli pontra, sugár 2. A lap elvész.',
        en: 'Area attack 3 at a point within 6 tiles, radius 2. The card is lost.',
      },
      flux: 1,
      lostOnUse: true,
      effects: [{ k: 'areaAtPoint', power: 3, range: 6, radius: 2 }],
    },
    bottom: {
      text: { hu: 'Mozgás 2', en: 'Move 2' },
      effects: [{ k: 'move', distance: 2 }],
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

  {
    id: 'ct-choirline',
    name: { hu: 'Kórusvonal', en: 'Choir line' },
    heroClass: 'cantor',
    advanced: true,
    // Late: what she does here is worth waiting a round for, and she is not the
    // one who should be opening a fight.
    initiative: 62,
    symbols: ['insight'],
    top: {
      text: {
        hu: 'Gyógyítás 2 magadra és a párodra, majd Vért 2 mindenkire 2 mezőn belül.',
        en: 'Heal 2 to yourself and your partner, then Shield 2 to everyone within 2 tiles.',
      },
      flux: 2,
      effects: [
        { k: 'heal', power: 2, alsoPartner: true },
        { k: 'areaAroundSelf', power: 0, radius: 2, status: { kind: 'shield', rounds: 2 } },
      ],
    },
    bottom: {
      text: { hu: 'Mozgás 2, Vért 1 magadra', en: 'Move 2, Shield 1 to yourself' },
      effects: [{ k: 'move', distance: 2 }, { k: 'shield', power: 1 }],
    },
  },

  {
    id: 'sv-ranging-shot',
    name: { hu: 'Belövés', en: 'Ranging shot' },
    heroClass: 'surveyor',
    advanced: true,
    // The highest number in the game: he fires last, and he fires furthest.
    initiative: 88,
    symbols: ['insight'],
    top: {
      text: {
        hu:
          'Támadás 4, hatótáv 7. Ha a cél már Rúnajel alatt van, a sebzés 7 — különben ' +
          'Rúnajel alá kerül.',
        en:
          'Attack 4, range 7. If the target is already Rune Marked the damage is 7 — otherwise ' +
          'it becomes Rune Marked.',
      },
      flux: 1,
      effects: [{ k: 'attack', power: 4, range: 7, status: { kind: 'runeMark', rounds: 2 } }],
    },
    bottom: {
      text: { hu: 'Mozgás 1, majd Rúnajel egy ellenségre 5 mezőn belül', en: 'Move 1, then Rune Mark an enemy within 5' },
      effects: [
        { k: 'move', distance: 1 },
        { k: 'status', status: 'runeMark', rounds: 2, range: 5 },
      ],
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
