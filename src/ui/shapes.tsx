// Silhouettes. Every unit is a simple, recognisable shape — the point of the
// flat 2D style is that you can tell what something is at a glance, even small.
//
// All shapes are defined inside the 0..1 unit square so they scale to any size.

type ShapeProps = { color: string }

export function SmithShape({ color }: ShapeProps) {
  return (
    <g>
      <polygon points="0.5,0.12 0.86,0.34 0.79,0.86 0.21,0.86 0.14,0.34" fill={color} />
      <rect x="0.36" y="0.44" width="0.28" height="0.1" fill="rgba(0,0,0,0.45)" />
    </g>
  )
}

export function ReaderShape({ color }: ShapeProps) {
  return (
    <g>
      <polygon points="0.5,0.08 0.88,0.5 0.5,0.92 0.12,0.5" fill={color} />
      <circle cx="0.5" cy="0.5" r="0.13" fill="rgba(0,0,0,0.5)" />
    </g>
  )
}

export function HuskShape({ color }: ShapeProps) {
  return <polygon points="0.5,0.16 0.79,0.84 0.21,0.84" fill={color} />
}

export function SentinelShape({ color }: ShapeProps) {
  return (
    <g>
      <path
        d="M0.5,0.12 L0.84,0.28 L0.84,0.58 Q0.84,0.82 0.5,0.9 Q0.16,0.82 0.16,0.58 L0.16,0.28 Z"
        fill={color}
      />
      <rect x="0.44" y="0.3" width="0.12" height="0.34" fill="rgba(0,0,0,0.4)" />
    </g>
  )
}

export function WraithShape({ color }: ShapeProps) {
  return (
    <g>
      <path
        d="M0.5,0.1 Q0.82,0.34 0.78,0.6 Q0.74,0.86 0.5,0.9 Q0.26,0.86 0.22,0.6 Q0.18,0.34 0.5,0.1 Z"
        fill={color}
        opacity="0.85"
      />
      <circle cx="0.5" cy="0.44" r="0.09" fill="rgba(0,0,0,0.5)" />
    </g>
  )
}

export function ShardShape({ color }: ShapeProps) {
  return (
    <g>
      <polygon points="0.5,0.06 0.92,0.28 0.84,0.8 0.5,0.96 0.16,0.8 0.08,0.28" fill={color} />
      <polygon points="0.5,0.28 0.68,0.42 0.6,0.7 0.4,0.7 0.32,0.42" fill="rgba(0,0,0,0.4)" />
    </g>
  )
}

const SHAPES = {
  smith: SmithShape,
  reader: ReaderShape,
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
      <rect x="0.22" y="0.16" width="0.56" height="0.68" rx="0.06" fill="#2a3444" />
      <rect
        x="0.22"
        y="0.16"
        width="0.56"
        height="0.68"
        rx="0.06"
        fill="none"
        stroke="#3d4a5e"
        strokeWidth="0.03"
      />
      <circle cx="0.5" cy="0.5" r="0.11" fill="var(--rune)" opacity="0.7" />
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
      <circle cx="0.5" cy="0.5" r="0.22" fill="none" stroke="var(--rune)" strokeWidth="0.04" />
      <polygon points="0.5,0.34 0.66,0.5 0.5,0.66 0.34,0.5" fill="var(--rune)" />
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
