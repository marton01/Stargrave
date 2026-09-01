// Silhouettes. Every unit is a recognisable figure — the point of the flat 2D
// style is that you can tell what something is at a glance, even small.
//
// All shapes are defined inside the 0..1 unit square so they scale to any size.
//
// WHY THEY LOOK THE WAY THEY DO
//
// These used to be single flat polygons: one triangle was a Husk, one pentagon
// was a hero. They read at a glance, which was the whole requirement, and they
// looked like placeholder geometry, which was the whole problem.
//
// Three things give them weight now, and none of them costs a downloaded file:
//
//   1. **The same geometry, painted twice.** Every figure paints its body with
//      the unit's colour and then paints the SAME path again with `fig-shade`, a
//      gradient from a light top-left to a dark bottom-right. An SVG gradient is
//      in object-bounding-box units by default, so one gradient gives every
//      shape its own volume without a single per-shape definition.
//   2. **A dark contour.** A thin near-black stroke separates a figure from the
//      floor it stands on, which is what makes it read as standing ON the board
//      rather than being painted INTO it.
//   3. **A ground shadow.** One ellipse under the feet. It is the cheapest depth
//      in computer graphics and the difference is not subtle.
//
// The four heroes are drawn to their names, because the name is what a player
// says out loud: the Runeweaver is broad and stands in front, the Pastcaller
// trails the echoes she is reading, the Rite-caller has her arms up and a ring
// over her head, the Astromancer sights along a raised staff inside an orbit.

type ShapeProps = { color: string }

/**
 * The shared paint. Every svg that draws a `Shape` has to render this once.
 *
 * Ids are global to the document, so these are deliberately prefixed and
 * deliberately identical everywhere: two copies of the same definition are
 * harmless, a missing one silently paints nothing.
 */
export function ShapeDefs() {
  return (
    <defs>
      <linearGradient id="fig-shade" x1="0.15" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.36" />
        <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.07" />
        <stop offset="0.68" stopColor="#000000" stopOpacity="0.16" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.46" />
      </linearGradient>
      {/* For the parts that are meant to glow rather than be lit: rune knots,
          haloes, orbit rings. Bright in the middle, gone by the edge. */}
      <radialGradient id="fig-glow">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.25" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

const OUTLINE = '#070a10'
const STROKE = 0.026

/**
 * A body: the colour, its volume, and its contour, from one path.
 *
 * Everything that is part of a figure's mass goes through here. Details that sit
 * ON the body (a visor, a knot, a halo) are drawn afterwards by the shape.
 */
function Body({ d, color }: { d: string; color: string }) {
  return (
    <>
      <path d={d} fill={color} stroke={OUTLINE} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d={d} fill="url(#fig-shade)" />
    </>
  )
}

/** What every figure stands on. Cheap depth, and it never lies about position. */
function GroundShadow() {
  return <ellipse cx="0.5" cy="0.935" rx="0.27" ry="0.055" fill="#000000" opacity="0.42" />
}

// ------------------------------------------------------------------- heroes

/**
 * The Runeweaver — Rúnaszövő. Broad, planted, front-heavy.
 *
 * Wide pauldrons and a low stance say "this one stands in front" before any
 * number does, and the woven knot on the chest is the two interlaced diamonds
 * that mark everything he builds on the board.
 */
export function SmithShape({ color }: ShapeProps) {
  return (
    <g>
      <GroundShadow />
      {/* legs and skirt, planted wide */}
      <Body d="M0.32,0.60 L0.68,0.60 L0.76,0.90 L0.24,0.90 Z" color={color} />
      {/* torso with the pauldrons rolled into the outline */}
      <Body
        d="M0.5,0.26 L0.72,0.32 Q0.84,0.36 0.82,0.46 L0.74,0.44 L0.71,0.63 L0.29,0.63 L0.26,0.44 L0.18,0.46 Q0.16,0.36 0.28,0.32 Z"
        color={color}
      />
      {/* helm */}
      <Body d="M0.5,0.09 Q0.63,0.10 0.63,0.22 L0.61,0.29 L0.39,0.29 L0.37,0.22 Q0.37,0.10 0.5,0.09 Z" color={color} />
      <rect x="0.385" y="0.185" width="0.23" height="0.055" rx="0.02" fill={OUTLINE} opacity="0.72" />
      {/* the weave: two interlaced diamonds, lit from inside */}
      <circle cx="0.5" cy="0.45" r="0.13" fill="url(#fig-glow)" opacity="0.5" />
      <path
        d="M0.5,0.36 L0.58,0.45 L0.5,0.54 L0.42,0.45 Z M0.42,0.41 L0.58,0.41 M0.42,0.49 L0.58,0.49"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="0.028"
        opacity="0.8"
      />
    </g>
  )
}

/**
 * The Pastcaller — Múltidéző. Slender, hooded, and never alone on her tile.
 *
 * The three arcs behind her are the point of the figure: she plays out of her
 * own discard pile, so what she has already spent is drawn standing behind her.
 */
export function ReaderShape({ color }: ShapeProps) {
  return (
    <g>
      <GroundShadow />
      {/* the echoes: what she has already spent, fading */}
      <g fill="none" stroke={color} strokeLinecap="round">
        <path d="M0.20,0.78 Q0.14,0.44 0.34,0.20" strokeWidth="0.035" opacity="0.5" />
        <path d="M0.13,0.80 Q0.05,0.42 0.28,0.13" strokeWidth="0.028" opacity="0.28" />
        <path d="M0.80,0.78 Q0.86,0.44 0.66,0.20" strokeWidth="0.03" opacity="0.34" />
      </g>
      {/* robe */}
      <Body d="M0.5,0.30 L0.66,0.44 L0.70,0.90 L0.30,0.90 L0.34,0.44 Z" color={color} />
      {/* cowl, drawn to a point */}
      <Body d="M0.5,0.07 Q0.68,0.18 0.66,0.42 L0.5,0.36 L0.34,0.42 Q0.32,0.18 0.5,0.07 Z" color={color} />
      {/* what is under the hood: not a face, a reading */}
      <ellipse cx="0.5" cy="0.28" rx="0.075" ry="0.06" fill={OUTLINE} opacity="0.85" />
      <circle cx="0.5" cy="0.275" r="0.026" fill={color} opacity="0.9" />
    </g>
  )
}

/**
 * The Rite-caller — Rítushívó. Arms up, a ring over her head.
 *
 * She is the only figure with nothing in her hands: she works by sounding, so
 * the shape has to be open. The halo is what marks her from across the board.
 */
export function CantorShape({ color }: ShapeProps) {
  return (
    <g>
      <GroundShadow />
      {/* the ring she calls through */}
      <circle cx="0.5" cy="0.13" r="0.145" fill="url(#fig-glow)" opacity="0.45" />
      <ellipse
        cx="0.5"
        cy="0.13"
        rx="0.15"
        ry="0.045"
        fill="none"
        stroke={color}
        strokeWidth="0.032"
        opacity="0.95"
      />
      {/* raised arms */}
      <g fill="none" stroke={color} strokeWidth="0.055" strokeLinecap="round">
        <path d="M0.34,0.52 Q0.24,0.36 0.30,0.24" />
        <path d="M0.66,0.52 Q0.76,0.36 0.70,0.24" />
      </g>
      {/* robe, opening like a bell */}
      <Body d="M0.5,0.28 L0.63,0.42 Q0.72,0.66 0.78,0.88 L0.22,0.88 Q0.28,0.66 0.37,0.42 Z" color={color} />
      {/* head */}
      <Body d="M0.5,0.19 Q0.585,0.20 0.585,0.29 Q0.585,0.375 0.5,0.385 Q0.415,0.375 0.415,0.29 Q0.415,0.20 0.5,0.19 Z" color={color} />
      {/* the sounding mark on the robe */}
      <path
        d="M0.44,0.60 Q0.5,0.55 0.56,0.60 M0.41,0.68 Q0.5,0.60 0.59,0.68"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="0.026"
        opacity="0.6"
      />
    </g>
  )
}

/**
 * The Astromancer — Asztromanta. One arm raised along a sighting staff.
 *
 * The tilted orbit ring is the tell: everything he does happens at a distance,
 * and the figure is built around the line he sights along rather than his body.
 */
export function SurveyorShape({ color }: ShapeProps) {
  return (
    <g>
      <GroundShadow />
      {/* the orbit he reads the ground from */}
      <ellipse
        cx="0.5"
        cy="0.45"
        rx="0.42"
        ry="0.17"
        fill="none"
        stroke={color}
        strokeWidth="0.028"
        opacity="0.4"
        transform="rotate(-24 0.5 0.45)"
      />
      {/* the staff, sighted high */}
      <path
        d="M0.30,0.90 L0.74,0.16"
        stroke={OUTLINE}
        strokeWidth="0.075"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M0.30,0.90 L0.74,0.16"
        stroke={color}
        strokeWidth="0.04"
        strokeLinecap="round"
      />
      <circle cx="0.755" cy="0.135" r="0.085" fill="url(#fig-glow)" opacity="0.8" />
      <circle cx="0.755" cy="0.135" r="0.038" fill={color} stroke={OUTLINE} strokeWidth="0.02" />
      {/* long coat, narrow: whatever reaches him kills him */}
      <Body d="M0.5,0.32 L0.62,0.44 L0.64,0.90 L0.36,0.90 L0.38,0.44 Z" color={color} />
      {/* raised arm along the staff */}
      <path
        d="M0.55,0.46 L0.66,0.30"
        fill="none"
        stroke={color}
        strokeWidth="0.055"
        strokeLinecap="round"
      />
      {/* head, turned up the line */}
      <Body d="M0.47,0.20 Q0.56,0.20 0.575,0.28 Q0.575,0.36 0.485,0.365 Q0.405,0.355 0.405,0.28 Q0.405,0.21 0.47,0.20 Z" color={color} />
    </g>
  )
}

// ------------------------------------------------------------------ enemies
//
// The enemies keep their old outlines — those were read correctly at a glance
// and there was never anything wrong with them but their flatness. They get the
// same body treatment and the same ground shadow, and nothing else changed.

export function HuskShape({ color }: ShapeProps) {
  return (
    <g>
      <GroundShadow />
      <Body d="M0.5,0.14 L0.80,0.86 L0.20,0.86 Z" color={color} />
      <path d="M0.42,0.62 L0.58,0.62" stroke={OUTLINE} strokeWidth="0.045" opacity="0.7" />
    </g>
  )
}

export function SentinelShape({ color }: ShapeProps) {
  return (
    <g>
      <GroundShadow />
      <Body
        d="M0.5,0.11 L0.84,0.27 L0.84,0.57 Q0.84,0.82 0.5,0.90 Q0.16,0.82 0.16,0.57 L0.16,0.27 Z"
        color={color}
      />
      <rect x="0.44" y="0.29" width="0.12" height="0.34" fill={OUTLINE} opacity="0.55" />
      <circle cx="0.5" cy="0.68" r="0.055" fill="url(#fig-glow)" opacity="0.6" />
    </g>
  )
}

export function WraithShape({ color }: ShapeProps) {
  return (
    <g>
      {/* no ground shadow: it does not stand on the floor */}
      <Body
        d="M0.5,0.09 Q0.82,0.33 0.78,0.59 Q0.74,0.86 0.5,0.91 Q0.26,0.86 0.22,0.59 Q0.18,0.33 0.5,0.09 Z"
        color={color}
      />
      <circle cx="0.5" cy="0.42" r="0.10" fill="url(#fig-glow)" opacity="0.55" />
      <circle cx="0.5" cy="0.42" r="0.055" fill={OUTLINE} opacity="0.8" />
    </g>
  )
}

export function ShardShape({ color }: ShapeProps) {
  return (
    <g>
      <GroundShadow />
      <Body
        d="M0.5,0.05 L0.92,0.27 L0.84,0.80 L0.5,0.96 L0.16,0.80 L0.08,0.27 Z"
        color={color}
      />
      <path d="M0.5,0.27 L0.68,0.41 L0.60,0.70 L0.40,0.70 L0.32,0.41 Z" fill={OUTLINE} opacity="0.5" />
      <circle cx="0.5" cy="0.48" r="0.09" fill="url(#fig-glow)" opacity="0.5" />
    </g>
  )
}

/**
 * A crew member on the ground.
 *
 * Deliberately the smallest thing on the board that is not a marker: a follower
 * has to read as a person and never as a hero. No emblem, no light of their own
 * — the ring of the hero who taught them is what says whose they are.
 */
export function MenteeShape({ color }: ShapeProps) {
  return (
    <g>
      <ellipse cx="0.5" cy="0.9" rx="0.19" ry="0.04" fill="#000000" opacity="0.42" />
      {/* a plain working coat */}
      <Body d="M0.5,0.40 L0.62,0.50 L0.64,0.88 L0.36,0.88 L0.38,0.50 Z" color={color} />
      {/* head, bare */}
      <Body d="M0.5,0.26 Q0.585,0.27 0.585,0.35 Q0.585,0.43 0.5,0.44 Q0.415,0.43 0.415,0.35 Q0.415,0.27 0.5,0.26 Z" color={color} />
    </g>
  )
}

const SHAPES = {
  mentee: MenteeShape,
  smith: SmithShape,
  reader: ReaderShape,
  cantor: CantorShape,
  surveyor: SurveyorShape,
  husk: HuskShape,
  sentinel: SentinelShape,
  wraith: WraithShape,
  shard: ShardShape,
} as const

export type ShapeKey = keyof typeof SHAPES

export function Shape({ shape, color }: { shape: ShapeKey; color: string }) {
  const Component = SHAPES[shape]
  return <Component color={color} />
}

/** A rune pillar on the grid. */
export function PillarShape() {
  return (
    <g>
      <ellipse cx="0.5" cy="0.87" rx="0.3" ry="0.06" fill="#000000" opacity="0.4" />
      <Body d="M0.24,0.14 L0.76,0.14 L0.72,0.86 L0.28,0.86 Z" color="#2f3a4c" />
      <circle cx="0.5" cy="0.46" r="0.16" fill="url(#fig-glow)" opacity="0.4" />
      <circle cx="0.5" cy="0.46" r="0.10" fill="var(--rune)" opacity="0.75" />
      <path
        d="M0.42,0.62 L0.58,0.62 M0.44,0.70 L0.56,0.70"
        stroke="var(--rune)"
        strokeWidth="0.022"
        opacity="0.5"
      />
    </g>
  )
}

// The three mission markers. They used to be drawn inline in the grid, which is
// why they were missing from the help: there was nothing to put there. Here they
// are components in the unit square like everything else, so the legend draws the
// same mark the board does.

/** A relic to be carried out. */
export function RelicShape() {
  return (
    <g>
      <circle cx="0.5" cy="0.5" r="0.26" fill="url(#fig-glow)" opacity="0.35" />
      <circle cx="0.5" cy="0.5" r="0.22" fill="none" stroke="var(--rune)" strokeWidth="0.04" />
      <polygon
        points="0.5,0.34 0.66,0.5 0.5,0.66 0.34,0.5"
        fill="var(--rune)"
        stroke={OUTLINE}
        strokeWidth="0.018"
      />
    </g>
  )
}

/**
 * The way out: the tile the party has to be standing on.
 *
 * Every length here is in units of the tile, stroke widths included. A shape in
 * the unit square must not borrow a stroke width from CSS: the group it sits in
 * is scaled by the tile size, so a `stroke-width: 2` becomes a hundred-pixel
 * band and a dash pattern becomes a blob.
 */
export function ExitShape() {
  return (
    <g>
      <rect
        x="0.06"
        y="0.06"
        width="0.88"
        height="0.88"
        rx="0.08"
        fill="rgba(111, 156, 88, 0.16)"
        stroke="var(--green)"
        strokeWidth="0.035"
        strokeDasharray="0.11 0.07"
      />
      <path
        d="M0.32,0.5 L0.68,0.5 M0.55,0.36 L0.68,0.5 L0.55,0.64"
        fill="none"
        stroke="var(--green)"
        strokeWidth="0.05"
        strokeLinecap="round"
      />
    </g>
  )
}

/** Floor that is going to give way. The number of rounds left is a badge. */
export function CollapsingShape() {
  return (
    <path
      d="M0.15,0.5 L0.35,0.3 L0.5,0.6 L0.7,0.35 L0.88,0.55"
      fill="none"
      stroke="rgba(200,86,63,0.75)"
      strokeWidth="0.04"
    />
  )
}

/**
 * One of the ship's modules, standing on the board in a boarding action.
 *
 * A box with a rune light in it — deliberately unlike anything that moves, so it
 * never reads as a unit you can order about.
 */
export function InstallationShape({ hurt }: { hurt: boolean }) {
  const tone = hurt ? 'var(--danger)' : 'var(--echo)'
  return (
    <g>
      <ellipse cx="0.5" cy="0.83" rx="0.3" ry="0.05" fill="#000000" opacity="0.35" />
      <rect
        x="0.16"
        y="0.2"
        width="0.68"
        height="0.6"
        rx="0.06"
        fill="var(--bg-4)"
        stroke={tone}
        strokeWidth="0.045"
      />
      <rect x="0.16" y="0.2" width="0.68" height="0.6" rx="0.06" fill="url(#fig-shade)" />
      <rect x="0.28" y="0.32" width="0.44" height="0.1" fill={tone} opacity="0.7" />
      <circle cx="0.5" cy="0.6" r="0.08" fill={tone} opacity="0.8" />
    </g>
  )
}

/** A trap marker. */
export function TrapShape() {
  return (
    <g>
      <circle
        cx="0.5"
        cy="0.5"
        r="0.3"
        fill="none"
        stroke="var(--danger)"
        strokeWidth="0.05"
        strokeDasharray="0.1 0.07"
      />
      <path d="M0.38,0.38 L0.62,0.62 M0.62,0.38 L0.38,0.62" stroke="var(--danger)" strokeWidth="0.06" />
    </g>
  )
}
