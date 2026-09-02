// Enemy types and their intents.
//
// Every enemy has a small set of intents. We shuffle it at the start of the
// battle and cycle through it, so the same intent does not repeat three times
// in a row while the player still cannot predict it exactly.
//
// THE INTENT IS VISIBLE AT THE START OF THE ROUND. That is the single most
// important rule in the game: planning is only planning if you know what is
// coming.

import type { EnemyType } from '../engine/types'
import type { Rng } from '../engine/rng'

export const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'ash-husk',
    name: { hu: 'Hamvadó váz', en: 'Ash Husk' },
    description: {
      hu: 'Közelharci horda. Egyedül nem félelmetes, négyesben az.',
      en: 'A melee swarm. Not frightening alone; four of them are.',
    },
    hp: 4,
    shape: 'husk',
    intents: [
      {
        id: 'husk-charge',
        text: { hu: 'Mozgás 4, Támadás 1', en: 'Move 4, Attack 1' },
        initiative: 20,
        steps: [
          { k: 'move', distance: 4 },
          { k: 'attack', power: 1, range: 1 },
        ],
      },
      {
        id: 'husk-press',
        text: { hu: 'Mozgás 3, Támadás 2', en: 'Move 3, Attack 2' },
        initiative: 30,
        steps: [
          { k: 'move', distance: 3 },
          { k: 'attack', power: 2, range: 1 },
        ],
      },
      {
        id: 'husk-wait',
        text: { hu: 'Mozgás 1, Támadás 3', en: 'Move 1, Attack 3' },
        initiative: 55,
        steps: [
          { k: 'move', distance: 1 },
          { k: 'attack', power: 3, range: 1 },
        ],
      },
    ],
  },

  {
    id: 'rune-sentinel',
    name: { hu: 'Rúnaőrző', en: 'Rune Sentinel' },
    description: {
      hu: 'Távolról lő, és pajzsot ad a társainak. Először őt kell elhallgattatni.',
      en: 'Shoots from a distance and shields its allies. Silence it first.',
    },
    hp: 7,
    shape: 'sentinel',
    intents: [
      {
        id: 'sentinel-shoot',
        text: { hu: 'Támadás 2, hatótáv 3', en: 'Attack 2, range 3' },
        initiative: 40,
        steps: [{ k: 'attack', power: 2, range: 3 }],
      },
      {
        // BALANCE (after the first playtest): this used to be Shield 2, and two
        // sentinels shielding each other built an impassable wall. At Shield 1
        // the sentinel is still the priority target but can be worn down.
        id: 'sentinel-shield',
        text: {
          hu: 'Vért 1 minden szövetségesnek 2 mezőn belül',
          en: 'Shield 1 to every ally within 2 tiles',
        },
        initiative: 25,
        steps: [{ k: 'shieldAllies', power: 1, radius: 2 }],
      },
      {
        id: 'sentinel-reposition',
        text: { hu: 'Mozgás 2, Támadás 2 (hatótáv 3)', en: 'Move 2, Attack 2 (range 3)' },
        initiative: 55,
        steps: [
          { k: 'move', distance: 2 },
          { k: 'attack', power: 2, range: 3 },
        ],
      },
    ],
  },

  {
    id: 'choir-wraith',
    name: { hu: 'Kórus-fantom', en: 'Choir Wraith' },
    description: {
      hu: 'Gyors, és elszívja a Töltetet. Ha hagyod élni, kifogytok az erőből.',
      en: 'Fast, and it drains Flux. Let it live and you will run out of power.',
    },
    hp: 5,
    shape: 'wraith',
    intents: [
      {
        id: 'wraith-strike',
        text: {
          hu: 'Mozgás 4, Támadás 2, elszív 1 Töltetet',
          en: 'Move 4, Attack 2, drains 1 Flux',
        },
        initiative: 15,
        steps: [
          { k: 'move', distance: 4 },
          { k: 'attack', power: 2, range: 1 },
          { k: 'drainFlux', power: 1 },
        ],
      },
      {
        id: 'wraith-glide',
        text: { hu: 'Mozgás 4, Támadás 1', en: 'Move 4, Attack 1' },
        initiative: 45,
        steps: [
          { k: 'move', distance: 4 },
          { k: 'attack', power: 1, range: 1 },
        ],
      },
      {
        id: 'wraith-curse',
        text: {
          hu: 'Gyengítés (hatótáv 3), Mozgás 2, Támadás 2',
          en: 'Weaken (range 3), Move 2, Attack 2',
        },
        initiative: 35,
        steps: [
          { k: 'statusOnHero', status: 'weakened', rounds: 2, range: 3 },
          { k: 'move', distance: 2 },
          { k: 'attack', power: 2, range: 1 },
        ],
      },
    ],
  },

  {
    id: 'godmachine-shard',
    name: { hu: 'Istengép-töredék', en: 'Godmachine Shard' },
    description: {
      hu: 'Lassú, de hatalmas. Ne álljatok mellé egyszerre mindketten.',
      en: 'Slow, but enormous. Do not both stand next to it at once.',
    },
    hp: 12,
    shape: 'shard',
    intents: [
      {
        id: 'shard-crush',
        text: {
          hu: 'Támadás 3 minden szomszédosra',
          en: 'Attack 3 against everyone adjacent',
        },
        initiative: 70,
        steps: [{ k: 'areaAroundSelf', power: 3, radius: 1 }],
      },
      {
        id: 'shard-step',
        text: { hu: 'Mozgás 2, Támadás 3', en: 'Move 2, Attack 3' },
        initiative: 60,
        steps: [
          { k: 'move', distance: 2 },
          { k: 'attack', power: 3, range: 1 },
        ],
      },
      {
        id: 'shard-beam',
        text: {
          hu: 'Támadás 3, hatótáv 2, Hátralökés 1',
          en: 'Attack 3, range 2, Knockback 1',
        },
        initiative: 65,
        steps: [{ k: 'attack', power: 3, range: 2, knockback: 1 }],
      },
    ],
  },
]

const TYPE_INDEX = new Map(ENEMY_TYPES.map((t) => [t.id, t]))

export function enemyType(id: string): EnemyType {
  const t = TYPE_INDEX.get(id)
  if (!t) throw new Error(`No such enemy type: ${id}`)
  return t
}

export function intentOf(typeId: string, intentId: string) {
  const type = enemyType(typeId)
  const intent = type.intents.find((i) => i.id === intentId)
  if (!intent) throw new Error(`No such intent: ${typeId}/${intentId}`)
  return intent
}

/**
 * Encounter composition.
 *
 * BALANCE: head count is the strongest difficulty lever. The two heroes have 20
 * hit points between them, so four enemies is already real pressure. If it
 * feels too easy, raise the numbers here first.
 *
 *   Easy:   3 enemies  (2 husks + 1 sentinel)
 *   Normal: 4 enemies  (2 husks + 1 sentinel + 1 wraith)
 *   Hard:   5 enemies  (3 husks + 1 sentinel + 1 godmachine shard)
 *
 * IMPORTANT: never put two Rune Sentinels in one battle. They shield each other
 * and turn the fight into a war of attrition — the difficulty should come from
 * the shard, not from stacked defence.
 */
export function buildEncounter(rng: Rng, difficulty: number): string[] {
  const out: string[] = []

  const huskCount = difficulty >= 3 ? 3 : 2
  for (let i = 0; i < huskCount; i++) out.push('ash-husk')

  out.push('rune-sentinel')

  if (difficulty === 2) out.push('choir-wraith')
  if (difficulty >= 3) out.push('godmachine-shard')

  return rng.shuffle(out)
}
