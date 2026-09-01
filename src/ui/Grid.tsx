// The tactical grid. Square tiles, 8 directions, Chebyshev distance.
//
// Layers from bottom to top: terrain, traps, highlights, units, click surface.
// The click surface sits on top as one transparent rect per tile, so we never
// have to fight hit-testing on the silhouettes themselves.

import { useState } from 'react'
import { allTiles, distance, fromTileKey, terrainAt, tileKey, unitAt } from '../engine/grid'
import { ENEMY_TYPES, intentOf } from '../content/enemies'
import { ENEMY_COLOR, GRID_LINE, HERO_COLOR, TERRAIN_COLOR, TILE } from './gridStyle'
import { HERO_CLASSES } from '../content/heroes'
import { portrait, useOptionalImage } from './assets'
import {
  CollapsingShape,
  ExitShape,
  InstallationShape,
  PillarShape,
  RelicShape,
  Shape,
  ShapeDefs,
  TrapShape,
  type ShapeKey,
} from './shapes'
import { isFollower, isHero } from '../engine/state'
import type { BattleState, Unit } from '../engine/types'

export function unitShape(u: Unit): ShapeKey {
  if (isFollower(u)) return 'mentee'
  if (isHero(u)) return HERO_CLASSES[u.heroClass].shape
  return u.side === 'enemy'
    ? (ENEMY_TYPES.find((t) => t.id === u.enemyType)?.shape ?? 'husk')
    : 'husk'
}

export function unitColor(u: Unit): string {
  // A follower wears the colour of whoever taught them. That is the whole
  // reading of the board: two figures the same colour are one player's.
  if (isFollower(u)) return HERO_COLOR[u.mentor]
  if (isHero(u)) return HERO_COLOR[u.heroClass]
  return u.side === 'enemy' ? (ENEMY_COLOR[u.enemyType] ?? 'var(--danger)') : 'var(--danger)'
}

/**
 * Depth for the floor itself.
 *
 * Both of these are ONE element covering the whole board rather than something
 * per tile: the bevel is a `pattern` the size of a tile, so a hundred-tile map
 * costs a single rect. Flat colour fields were what made the board read as a
 * spreadsheet with counters on it.
 */
function BoardDefs() {
  return (
    <defs>
      <linearGradient id="tile-light" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.055" />
        <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.14" />
      </linearGradient>
      <pattern id="tile-bevel" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
        <rect width={TILE} height={TILE} fill="url(#tile-light)" />
        <path d={`M0,0.5 H${TILE}`} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <path d={`M0.5,0 V${TILE}`} stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
        <path d={`M0,${TILE - 0.5} H${TILE}`} stroke="rgba(0,0,0,0.32)" strokeWidth="1" />
      </pattern>
      {/* objectBoundingBox units, so one clip rounds every token wherever it
          stands on the board */}
      <clipPath id="token-round" clipPathUnits="objectBoundingBox">
        <circle cx="0.5" cy="0.5" r="0.5" />
      </clipPath>
      <radialGradient id="token-shade" cx="0.38" cy="0.3" r="0.78">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
        <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.55" />
      </radialGradient>
      <radialGradient id="board-vignette" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.45" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.22" />
      </radialGradient>
    </defs>
  )
}

/**
 * What a unit looks like on the board.
 *
 * If a portrait file happens to be sitting in `public/assets` for this hero
 * class or enemy type, the unit is drawn as a **token**: the art in a coin, in a
 * ring of its own colour. If not, the silhouette is drawn instead, and it is not
 * a placeholder — it is the same figure the help legend teaches.
 *
 * The rule from `assets.ts` holds all the way to here: a missing file is not an
 * error and leaves no gap. Nothing on this board needs a download to be legible.
 */
function UnitFigure({ unit }: { unit: Unit }) {
  // A follower is never drawn from art: they must read as smaller and plainer
  // than the four, and a portrait coin would make them look like a fifth hero.
  const art = useOptionalImage(
    isHero(unit)
      ? portrait.hero(unit.heroClass)
      : unit.side === 'enemy'
        ? portrait.enemy(unit.enemyType)
        : null,
  )
  const color = unitColor(unit)

  if (!art) {
    return (
      <g transform={`translate(${TILE * 0.12} ${TILE * 0.06}) scale(${TILE * 0.76})`}>
        <Shape shape={unitShape(unit)} color={color} />
      </g>
    )
  }

  const r = TILE * 0.34
  const cx = TILE / 2
  const cy = TILE * 0.46
  return (
    <g>
      <ellipse cx={cx} cy={TILE * 0.86} rx={r * 0.8} ry={r * 0.22} fill="#000" opacity="0.45" />
      {/* a breath of the unit's own colour behind it: portrait art is dark, the
          floor is dark, and without this the coins sink into the board */}
      <circle cx={cx} cy={cy} r={r * 1.6} fill={color} opacity="0.13" />
      <circle cx={cx} cy={cy} r={r + 1.5} fill="#080b11" opacity="0.9" />
      <image
        href={art}
        x={cx - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
        clipPath="url(#token-round)"
        preserveAspectRatio="xMidYMid slice"
      />
      {/* Every portrait is dark art, and at forty pixels four dark circles look
          alike — the flat style's whole promise is that you can tell what
          something is at a glance. `color` blending keeps the art's drawing and
          takes its hue from the unit, so a Choir-wraith is magenta and an Ash
          husk is red before you have read anything. It also pulls art from four
          different sources into one palette. */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        opacity="0.5"
        style={{ mixBlendMode: 'color' }}
      />
      {/* the same light the silhouettes get, so art and drawing sit together */}
      <circle cx={cx} cy={cy} r={r} fill="url(#token-shade)" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2} />
    </g>
  )
}

export type GridProps = {
  state: BattleState
  /** Selectable tiles (tile keys). */
  selectableTiles: Set<string>
  /** Selectable units (ids). */
  selectableUnits: Set<string>
  /** The unit currently to act. */
  activeId: string | undefined
  /** When targeting an area effect, preview a radius this large. */
  previewRadius: number | null
  /**
   * What the pending attack would actually take off each target, by unit id.
   *
   * The card says "Attack 3" and the hit can be a 4 or a 1: the Bond between the
   * heroes, a Rune Mark, Shield, being prone — every one of them lands here and
   * none of them was visible before. `predictDamage` exists in the engine
   * precisely so this can be shown, and until now nothing showed it.
   */
  damagePreview: Map<string, number>
  /**
   * Terrain editing: every tile is clickable and nothing else is.
   *
   * The repair tool from the "stuck?" panel. While it is on, a click means "put
   * this ground here" rather than "act on this tile", so the two must not be
   * live at the same time.
   */
  editing: boolean
  onTile: (tileKey: string) => void
  onUnit: (unitId: string) => void
}

export function Grid({
  state,
  selectableTiles,
  selectableUnits,
  activeId,
  previewRadius,
  damagePreview,
  editing,
  onTile,
  onUnit,
}: GridProps) {
  const width = state.map.width * TILE
  const height = state.map.height * TILE
  const tiles = allTiles(state.map)

  // Hovered tile — used for the area effect preview.
  const [hovered, setHovered] = useState<string | null>(null)

  const previewTiles = new Set<string>()
  if (previewRadius !== null && hovered && selectableTiles.has(hovered)) {
    const centre = fromTileKey(hovered)
    for (const c of tiles) {
      if (distance(c, centre) <= previewRadius) previewTiles.add(tileKey(c))
    }
  }

  return (
    <svg
      className="grid"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      onMouseLeave={() => setHovered(null)}
    >
      <ShapeDefs />
      <BoardDefs />

      {/* terrain */}
      {tiles.map((c) => {
        const kind = terrainAt(state.map, c)
        return (
          <g key={`t${tileKey(c)}`} transform={`translate(${c.x * TILE} ${c.y * TILE})`}>
            <rect width={TILE} height={TILE} fill={TERRAIN_COLOR[kind]} />
            {GRID_LINE[kind] && (
              <rect
                width={TILE}
                height={TILE}
                fill="none"
                stroke={GRID_LINE[kind]}
                strokeWidth={1}
              />
            )}
            {kind === 'ash' && (
              <g fill="rgba(180,170,150,0.16)">
                <circle cx={TILE * 0.3} cy={TILE * 0.35} r={2} />
                <circle cx={TILE * 0.62} cy={TILE * 0.28} r={1.6} />
                <circle cx={TILE * 0.45} cy={TILE * 0.66} r={2.2} />
                <circle cx={TILE * 0.74} cy={TILE * 0.7} r={1.4} />
              </g>
            )}
            {kind === 'chasm' && (
              <rect
                x={4}
                y={4}
                width={TILE - 8}
                height={TILE - 8}
                fill="none"
                stroke="rgba(90,125,170,0.5)"
                strokeWidth={1.2}
                strokeDasharray="5 5"
              />
            )}
            {kind === 'pillar' && (
              <g transform={`scale(${TILE})`}>
                <PillarShape />
              </g>
            )}
          </g>
        )
      })}

      {/* the floor's own light: one bevel pattern and one vignette for the
          whole board, both of them deaf to the mouse */}
      <rect width={width} height={height} fill="url(#tile-bevel)" pointerEvents="none" />
      <rect width={width} height={height} fill="url(#board-vignette)" pointerEvents="none" />

      {/* area effect preview */}
      {[...previewTiles].map((key) => {
        const c = fromTileKey(key)
        return (
          <rect
            key={`p${key}`}
            x={c.x * TILE}
            y={c.y * TILE}
            width={TILE}
            height={TILE}
            fill="var(--danger)"
            opacity={0.18}
          />
        )
      })}

      {/* the ship's own modules, when the fight is aboard */}
      {state.installations.map((installation) => (
        <g
          key={`inst${tileKey(installation.pos)}`}
          transform={`translate(${installation.pos.x * TILE} ${installation.pos.y * TILE})`}
        >
          <g transform={`scale(${TILE})`}>
            <InstallationShape hurt={installation.hp < installation.maxHp} />
          </g>
          <rect x={TILE * 0.2} y={TILE - 7} width={TILE * 0.6} height={3} rx={1.5} fill="rgba(0,0,0,0.6)" />
          <rect
            x={TILE * 0.2}
            y={TILE - 7}
            width={TILE * 0.6 * (installation.hp / installation.maxHp)}
            height={3}
            rx={1.5}
            fill="var(--echo)"
          />
        </g>
      ))}

      {/* objective features: relics to collect, the way out, floor about to go.
          The marks themselves live in shapes.tsx so the help can draw them too. */}
      {state.collapsing.map((tile) => (
        <g
          key={`col${tileKey(tile.pos)}`}
          transform={`translate(${tile.pos.x * TILE} ${tile.pos.y * TILE})`}
        >
          <g transform={`scale(${TILE})`}>
            <CollapsingShape />
          </g>
          <text x={TILE - 9} y={TILE - 6} className="grid-badge">
            {tile.roundsLeft}
          </text>
        </g>
      ))}

      {state.exit && (
        <g transform={`translate(${state.exit.x * TILE} ${state.exit.y * TILE}) scale(${TILE})`}>
          <ExitShape />
        </g>
      )}

      {state.relics.map((relic) => (
        <g
          key={`relic${tileKey(relic)}`}
          transform={`translate(${relic.x * TILE} ${relic.y * TILE}) scale(${TILE})`}
        >
          <RelicShape />
        </g>
      ))}

      {/* traps */}
      {state.traps.map((trap) => (
        <g
          key={`trap${tileKey(trap.pos)}`}
          transform={`translate(${trap.pos.x * TILE} ${trap.pos.y * TILE}) scale(${TILE})`}
        >
          <TrapShape />
        </g>
      ))}

      {/* selectable tiles */}
      {[...selectableTiles].map((key) => {
        const c = fromTileKey(key)
        return (
          <rect
            key={`s${key}`}
            className="grid-selectable"
            x={c.x * TILE + 2}
            y={c.y * TILE + 2}
            width={TILE - 4}
            height={TILE - 4}
            rx={3}
          />
        )
      })}

      {/* units */}
      {state.units
        .filter((u) => u.alive)
        .map((u) => {
          const selectable = selectableUnits.has(u.id)
          const active = activeId === u.id
          const initiative =
            u.side === 'enemy' && u.intent ? intentOf(u.enemyType, u.intent).initiative : null

          return (
            <g key={u.id} transform={`translate(${u.pos.x * TILE} ${u.pos.y * TILE})`}>
              {active && (
                <rect className="grid-active" x={1} y={1} width={TILE - 2} height={TILE - 2} rx={4} />
              )}
              {selectable && (
                <rect
                  className="grid-targetable"
                  x={1}
                  y={1}
                  width={TILE - 2}
                  height={TILE - 2}
                  rx={4}
                />
              )}

              <UnitFigure unit={u} />

              {/* hit point bar */}
              <rect
                x={TILE * 0.15}
                y={TILE - 8}
                width={TILE * 0.7}
                height={4}
                rx={2}
                fill="rgba(0,0,0,0.6)"
              />
              <rect
                x={TILE * 0.15}
                y={TILE - 8}
                width={TILE * 0.7 * (u.hp / u.maxHp)}
                height={4}
                rx={2}
                fill={u.side === 'hero' ? '#6a9955' : '#b8543f'}
              />

              {/* what this hit would take off, when one is being aimed */}
              {damagePreview.has(u.id) && (
                <g>
                  <circle
                    cx={TILE / 2}
                    cy={TILE / 2}
                    r={12}
                    fill="rgba(8,11,17,0.85)"
                    stroke="var(--rune)"
                    strokeWidth={1.5}
                  />
                  <text x={TILE / 2} y={TILE / 2 + 4.5} className="grid-damage">
                    {damagePreview.get(u.id)}
                  </text>
                </g>
              )}

              {/* initiative badge: shows when this enemy will act */}
              {initiative !== null && (
                <g>
                  <circle
                    cx={TILE - 10}
                    cy={10}
                    r={9}
                    fill="rgba(8,11,17,0.9)"
                    stroke="var(--danger)"
                    strokeWidth={1}
                  />
                  <text x={TILE - 10} y={13.5} className="grid-badge">
                    {initiative}
                  </text>
                </g>
              )}

              {/* shield */}
              {(u.statuses.shield ?? 0) > 0 && (
                <g>
                  <circle cx={10} cy={10} r={9} fill="rgba(8,11,17,0.9)" stroke="#7f9bc4" strokeWidth={1} />
                  <text x={10} y={13.5} className="grid-badge">
                    {u.statuses.shield}
                  </text>
                </g>
              )}

              {/* status dots in the bottom corner */}
              <g>
                {(['anchor', 'runeMark', 'prone', 'blind', 'weakened'] as const)
                  .filter((k) => (u.statuses[k] ?? 0) > 0)
                  .map((k, i) => (
                    <circle
                      key={k}
                      cx={9 + i * 9}
                      cy={TILE - 14}
                      r={3.2}
                      fill={
                        k === 'runeMark'
                          ? 'var(--echo)'
                          : k === 'anchor'
                            ? 'var(--rune)'
                            : '#b06fc4'
                      }
                    />
                  ))}
              </g>
            </g>
          )
        })}

      {/* while editing, every tile shows that it can be changed */}
      {editing &&
        tiles.map((c) => (
          <rect
            key={`e${tileKey(c)}`}
            className="grid-editable"
            x={c.x * TILE + 1}
            y={c.y * TILE + 1}
            width={TILE - 2}
            height={TILE - 2}
            rx={3}
          />
        ))}

      {/* click surface */}
      {tiles.map((c) => {
        const key = tileKey(c)
        const here = unitAt(state.units, c)
        const unitSelectable = editing ? false : here ? selectableUnits.has(here.id) : false
        const tileSelectable = editing || selectableTiles.has(key)
        const clickable = unitSelectable || tileSelectable
        return (
          <rect
            key={`c${key}`}
            x={c.x * TILE}
            y={c.y * TILE}
            width={TILE}
            height={TILE}
            fill="transparent"
            // Addressable for the smoke test: the highlight rects have
            // pointer-events disabled, so this is the layer a click has to land
            // on, and a bot needs to be able to name it.
            data-tile={key}
            data-selectable={clickable ? (unitSelectable ? 'unit' : 'tile') : undefined}
            style={{ cursor: clickable ? 'pointer' : 'default' }}
            onMouseEnter={() => setHovered(key)}
            onClick={() => {
              if (unitSelectable && here) onUnit(here.id)
              else if (tileSelectable) onTile(key)
            }}
          />
        )
      })}
    </svg>
  )
}
