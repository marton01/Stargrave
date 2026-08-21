// Marks: the runes, concept icons and relic sigils the puzzles are built from.
//
// Every one of them is a SHAPE, never a letter. That is what keeps the puzzles
// language independent: a player who reads neither Hungarian nor English can
// still solve all nine, and a translator never has to touch them.

const RUNE_PATHS = [
  'M8,3 L8,21 M3,8 L13,8',
  'M4,20 L12,4 L20,20 Z',
  'M4,12 A8,8 0 1,1 20,12 A8,8 0 1,1 4,12',
  'M5,5 L19,19 M19,5 L5,19',
  'M12,3 L20,12 L12,21 L4,12 Z',
  'M5,19 L12,5 L19,19 M8,14 L16,14',
  'M6,6 L18,6 L18,18 L6,18 Z M12,6 L12,18',
  'M12,4 L12,20 M6,9 L12,4 L18,9',
]

const RUNE_COLORS = [
  'var(--rune)',
  'var(--echo)',
  '#b47fc6',
  '#7f9bc4',
  '#9fbb6a',
  '#d08a55',
  '#c8737f',
  '#79c7a8',
]

/** One rune symbol. `index` wraps, so any palette size works. */
export function Rune({ index, size = 24 }: { index: number; size?: number }) {
  const i = ((index % RUNE_PATHS.length) + RUNE_PATHS.length) % RUNE_PATHS.length
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="mark">
      <path
        d={RUNE_PATHS[i]}
        fill="none"
        stroke={RUNE_COLORS[i]}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  )
}

// Concept icons for the glyph puzzle. Deliberately abstract: a circle, a wave, a
// spike, a nest, a gate. They stand for ideas the dead civilisation wrote about,
// and none of them is a word.
const CONCEPT_PATHS = [
  'M12,4 A8,8 0 1,1 11.9,4 M12,9 A3,3 0 1,1 11.9,9',
  'M3,15 Q7,8 11,15 T19,15',
  'M12,3 L15,11 L21,12 L15,13 L12,21 L9,13 L3,12 L9,11 Z',
  'M5,19 L12,7 L19,19 M9,19 L12,13 L15,19',
  'M6,20 L6,8 A6,6 0 0,1 18,8 L18,20',
  'M4,12 L20,12 M12,4 L12,20 M7,7 L17,17 M17,7 L7,17',
]

const CONCEPT_COLORS = ['var(--rune)', 'var(--echo)', '#b47fc6', '#9fbb6a', '#d08a55', '#7f9bc4']

export function Concept({ index, size = 26 }: { index: number; size?: number }) {
  const i = ((index % CONCEPT_PATHS.length) + CONCEPT_PATHS.length) % CONCEPT_PATHS.length
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="mark">
      <path
        d={CONCEPT_PATHS[i]}
        fill="none"
        stroke={CONCEPT_COLORS[i]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Stroke features for a glyph. A glyph is a base ring plus up to five marks;
// each mark maps to one concept, and working out which is the puzzle.
const FEATURE_PATHS = [
  'M12,2 L12,7',
  'M22,12 L17,12',
  'M12,22 L12,17',
  'M2,12 L7,12',
  'M5,5 L8.5,8.5',
]

export function Glyph({ mask, size = 44 }: { mask: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="glyph">
      <circle cx={12} cy={12} r={6.5} fill="none" stroke="var(--text-soft)" strokeWidth={1.6} />
      {FEATURE_PATHS.map((path, i) =>
        mask & (1 << i) ? (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="var(--rune)"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        ) : null,
      )}
    </svg>
  )
}

// Relic sigils for the balance scales. Distinct at a glance, and never a number:
// the puzzle is about comparison, not arithmetic.
const RELIC_PATHS = [
  'M12,3 L21,12 L12,21 L3,12 Z',
  'M4,6 L20,6 L20,18 L4,18 Z',
  'M12,3 A9,9 0 1,1 11.9,3',
  'M12,3 L21,20 L3,20 Z',
  'M12,3 L18,7 L18,17 L12,21 L6,17 L6,7 Z',
  'M6,4 L18,4 L14,20 L10,20 Z',
]

const RELIC_COLORS = [
  'var(--rune)',
  'var(--echo)',
  '#b47fc6',
  '#9fbb6a',
  '#d08a55',
  '#c8737f',
]

export function Relic({ index, size = 26 }: { index: number; size?: number }) {
  const i = ((index % RELIC_PATHS.length) + RELIC_PATHS.length) % RELIC_PATHS.length
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="mark">
      <path d={RELIC_PATHS[i]} fill="none" stroke={RELIC_COLORS[i]} strokeWidth={2} />
    </svg>
  )
}

/** Edge codes for the star chart, drawn as coloured notches. */
export const EDGE_COLORS = [
  'transparent',
  'var(--rune)',
  'var(--echo)',
  '#b47fc6',
  '#9fbb6a',
]
