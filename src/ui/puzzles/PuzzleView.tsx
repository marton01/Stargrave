// The nine puzzles, on screen.
//
// One frame, nine bodies. Every interaction is a click or a placement — never
// typing — which is what keeps them language independent and what makes them
// work for two people sharing one mouse: you both stare at it and argue.

import { useState } from 'react'
import { Concept, EDGE_COLORS, Glyph, Relic, Rune } from './marks'
import { edgeAt, poweredTiles, puzzleStatus, traceBeam } from '../../engine/puzzles/index'
import { useLang } from '../../i18n/LangContext'
import type { Puzzle, PuzzleKind, PuzzleMove } from '../../engine/puzzles/types'
import type { UiKey } from '../../i18n/ui'

export type PuzzleProps = {
  puzzle: Puzzle
  onMove: (move: PuzzleMove) => void
}

const NAME_KEY: Record<PuzzleKind, UiKey> = {
  runeDecode: 'runeDecodeName',
  balanceScales: 'balanceScalesName',
  glyphs: 'glyphsName',
  safeGround: 'safeGroundName',
  powerRouting: 'powerRoutingName',
  refraction: 'refractionName',
  starChart: 'starChartName',
  resonance: 'resonanceName',
  gravityCores: 'gravityCoresName',
}

const HELP_KEY: Record<PuzzleKind, UiKey> = {
  runeDecode: 'runeDecodeHelp',
  balanceScales: 'balanceScalesHelp',
  glyphs: 'glyphsHelp',
  safeGround: 'safeGroundHelp',
  powerRouting: 'powerRoutingHelp',
  refraction: 'refractionHelp',
  starChart: 'starChartHelp',
  resonance: 'resonanceHelp',
  gravityCores: 'gravityCoresHelp',
}

export function puzzleName(kind: PuzzleKind, t: ReturnType<typeof useLang>['t']): string {
  return t[NAME_KEY[kind]] as string
}

export function PuzzleView({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  const status = puzzleStatus(puzzle)

  return (
    <div className="puzzle" data-puzzle={puzzle.k} data-status={status}>
      <header className="puzzle-head">
        <h3>{t[NAME_KEY[puzzle.k]] as string}</h3>
        <p className="puzzle-help">{t[HELP_KEY[puzzle.k]] as string}</p>
      </header>

      <div className="puzzle-body">
        {puzzle.k === 'runeDecode' && <RuneDecode puzzle={puzzle} onMove={onMove} />}
        {puzzle.k === 'balanceScales' && <BalanceScales puzzle={puzzle} onMove={onMove} />}
        {puzzle.k === 'glyphs' && <Glyphs puzzle={puzzle} onMove={onMove} />}
        {puzzle.k === 'safeGround' && <SafeGround puzzle={puzzle} onMove={onMove} />}
        {puzzle.k === 'powerRouting' && <PowerRouting puzzle={puzzle} onMove={onMove} />}
        {puzzle.k === 'refraction' && <Refraction puzzle={puzzle} onMove={onMove} />}
        {puzzle.k === 'starChart' && <StarChart puzzle={puzzle} onMove={onMove} />}
        {puzzle.k === 'resonance' && <Resonance puzzle={puzzle} onMove={onMove} />}
        {puzzle.k === 'gravityCores' && <GravityCores puzzle={puzzle} onMove={onMove} />}
      </div>

      {status !== 'open' && (
        <p className={`puzzle-verdict ${status === 'solved' ? 'good' : 'bad'}`}>
          {status === 'solved' ? t.puzzleSolved : t.puzzleFailed}
        </p>
      )}
      <p className="puzzle-note">{t.puzzleNoGuessing}</p>
    </div>
  )
}

// ================================================================ rune decode

function RuneDecode({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  if (puzzle.k !== 'runeDecode') return null
  const s = puzzle.s
  const left = s.maxAttempts - s.guesses.length

  return (
    <>
      <div className="rune-row">
        {s.draft.map((symbol, slot) => (
          <button
            key={slot}
            className="rune-slot"
            onClick={() => onMove({ k: 'runeSetSlot', slot, symbol: (symbol + 1) % s.symbols })}
            onContextMenu={(event) => {
              event.preventDefault()
              onMove({ k: 'runeSetSlot', slot, symbol: (symbol + s.symbols - 1) % s.symbols })
            }}
            title={`${slot + 1}`}
          >
            <Rune index={symbol} size={30} />
          </button>
        ))}
        <button className="button button-primary" onClick={() => onMove({ k: 'runeSubmit' })}>
          {t.puzzleSubmit}
        </button>
      </div>

      <p className="puzzle-meta">{t.puzzleAttemptsLeft(left)}</p>

      {/*
        The scores used to be printed as a row of dots — ●● for two in place — sat
        immediately next to the row of four runes, which reads exactly like "these
        first two are correct". It never meant that: it is a count of how many are
        right, not of which. A tester spent a whole puzzle believing the first two
        slots had been confirmed. Numbers with the words next to them, and a line
        above the history saying what they do not tell you.
      */}
      {s.guesses.length > 0 && <p className="rune-legend">{t.runeScoreHint}</p>}

      <div className="rune-history">
        {s.guesses.map((g, i) => (
          <div key={i} className="rune-guess">
            {g.guess.map((symbol, j) => (
              <Rune key={j} index={symbol} size={22} />
            ))}
            <span className="rune-score">
              <span className="score-exact">
                {g.exact} {t.runeExact}
              </span>
              <span className="score-partial">
                {g.partial} {t.runePartial}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

// ============================================================ balance scales

function BalanceScales({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  if (puzzle.k !== 'balanceScales') return null
  const s = puzzle.s
  const relics = Array.from({ length: s.count }, (_, i) => i)
  const left = s.maxWeighings - s.weighings.length

  return (
    <>
      <div className="scale-pans">
        {(['left', 'right'] as const).map((pan) => (
          <div key={pan} className="scale-pan">
            <span className="scale-label">{pan === 'left' ? t.scaleLeft : t.scaleRight}</span>
            <div className="scale-slots">
              {s[pan].map((relic) => (
                <button
                  key={relic}
                  className="relic-chip on"
                  onClick={() => onMove({ k: 'scaleTogglePan', relic, pan })}
                >
                  <Relic index={relic} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="relic-tray">
        {relics.map((relic) => {
          const placed = s.left.includes(relic) || s.right.includes(relic)
          return (
            <div key={relic} className="relic-pick">
              <Relic index={relic} />
              <div className="relic-buttons">
                <button
                  className="button button-small"
                  disabled={placed}
                  onClick={() => onMove({ k: 'scaleTogglePan', relic, pan: 'left' })}
                >
                  ◀
                </button>
                <button
                  className="button button-small"
                  disabled={placed}
                  onClick={() => onMove({ k: 'scaleTogglePan', relic, pan: 'right' })}
                >
                  ▶
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="button-row">
        <button
          className="button button-primary"
          disabled={s.left.length === 0 || s.right.length === 0 || left <= 0}
          onClick={() => onMove({ k: 'scaleWeigh' })}
        >
          {t.scaleWeigh}
        </button>
        <button className="button" onClick={() => onMove({ k: 'scaleClearPans' })}>
          {t.scaleClear}
        </button>
        <span className="puzzle-meta">{t.scaleWeighingsLeft(left)}</span>
      </div>

      <div className="scale-history">
        {s.weighings.map((w, i) => (
          <div key={i} className="scale-result">
            <span className="scale-side">
              {w.left.map((r) => (
                <Relic key={r} index={r} size={20} />
              ))}
            </span>
            <span className="scale-sign">{w.result < 0 ? '<' : w.result > 0 ? '>' : '='}</span>
            <span className="scale-side">
              {w.right.map((r) => (
                <Relic key={r} index={r} size={20} />
              ))}
            </span>
          </div>
        ))}
      </div>

      <h4>{t.scaleOrderHeading}</h4>
      <div className="scale-order">
        {s.order.map((relic, i) => (
          <span key={relic} className="order-chip">
            <span className="order-index">{i + 1}</span>
            <Relic index={relic} size={22} />
          </span>
        ))}
        {s.order.length < s.count && (
          <span className="order-remaining">
            {relics
              .filter((r) => !s.order.includes(r))
              .map((relic) => (
                <button
                  key={relic}
                  className="relic-chip"
                  onClick={() => onMove({ k: 'scaleOrderPush', relic })}
                >
                  <Relic index={relic} size={22} />
                </button>
              ))}
          </span>
        )}
      </div>

      <div className="button-row">
        <button className="button" onClick={() => onMove({ k: 'scaleOrderClear' })}>
          {t.scaleOrderClear}
        </button>
        <button
          className="button button-primary"
          disabled={s.order.length !== s.count}
          onClick={() => onMove({ k: 'scaleSubmit' })}
        >
          {t.puzzleSubmit}
        </button>
      </div>
    </>
  )
}

// ==================================================================== glyphs

function Glyphs({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  if (puzzle.k !== 'glyphs') return null
  const s = puzzle.s

  return (
    <>
      <h4>{t.glyphsExamples}</h4>
      <div className="glyph-examples">
        {s.examples.map((example, i) => (
          <div key={i} className="glyph-example">
            <Glyph mask={example.mask} />
            <span className="glyph-arrow">→</span>
            <span className="glyph-concepts">
              {example.concepts.map((c) => (
                <Concept key={c} index={c} />
              ))}
            </span>
          </div>
        ))}
      </div>

      <h4>{t.glyphsQuery}</h4>
      <div className="glyph-query">
        <Glyph mask={s.query} size={64} />
      </div>

      <div className="concept-choices">
        {Array.from({ length: s.concepts }, (_, c) => (
          <button
            key={c}
            className={`concept-chip ${s.answer.includes(c) ? 'on' : ''}`}
            onClick={() => onMove({ k: 'glyphToggle', concept: c })}
          >
            <Concept index={c} size={30} />
          </button>
        ))}
      </div>

      <div className="button-row">
        <button
          className="button button-primary"
          disabled={s.answer.length === 0}
          onClick={() => onMove({ k: 'glyphSubmit' })}
        >
          {t.puzzleSubmit}
        </button>
      </div>
    </>
  )
}

// =============================================================== safe ground

function SafeGround({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  if (puzzle.k !== 'safeGround') return null
  const s = puzzle.s
  const cell = 46

  return (
    <>
      <svg
        className="puzzle-grid"
        width={s.w * cell}
        height={s.h * cell}
        viewBox={`0 0 ${s.w * cell} ${s.h * cell}`}
      >
        {Array.from({ length: s.w * s.h }, (_, i) => {
          const x = (i % s.w) * cell
          const y = Math.floor(i / s.w) * cell
          const clue = s.clues[i]!
          const known = clue >= 0
          const marked = s.marked[i]
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect
                width={cell - 2}
                height={cell - 2}
                x={1}
                y={1}
                rx={3}
                fill={known ? 'var(--bg-3)' : marked ? 'var(--danger-dim)' : 'var(--bg-4)'}
                stroke={marked ? 'var(--danger)' : 'var(--line)'}
                strokeWidth={marked ? 2 : 1}
              />
              {known && (
                <text x={cell / 2} y={cell / 2 + 5} className="puzzle-number">
                  {clue}
                </text>
              )}
              {!known && marked && (
                <path
                  d={`M${cell * 0.3},${cell * 0.3} L${cell * 0.7},${cell * 0.7} M${cell * 0.7},${cell * 0.3} L${cell * 0.3},${cell * 0.7}`}
                  stroke="var(--danger)"
                  strokeWidth={2.5}
                />
              )}
              {!known && (
                <rect
                  width={cell}
                  height={cell}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onMove({ k: 'groundToggle', index: i })}
                />
              )}
            </g>
          )
        })}
      </svg>
      <div className="button-row">
        <button className="button button-primary" onClick={() => onMove({ k: 'groundSubmit' })}>
          {t.puzzleSubmit}
        </button>
      </div>
    </>
  )
}

// ============================================================ power routing

function PowerRouting({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  if (puzzle.k !== 'powerRouting') return null
  const s = puzzle.s
  const cell = 60
  const lit = poweredTiles(s)

  return (
    <>
      <svg
        className="puzzle-grid"
        width={s.w * cell}
        height={s.h * cell}
        viewBox={`0 0 ${s.w * cell} ${s.h * cell}`}
      >
        {Array.from({ length: s.w * s.h }, (_, i) => {
          const x = (i % s.w) * cell
          const y = Math.floor(i / s.w) * cell
          if (s.empty[i]) {
            return (
              <rect
                key={i}
                x={x + 1}
                y={y + 1}
                width={cell - 2}
                height={cell - 2}
                rx={3}
                fill="var(--bg)"
                stroke="var(--line-soft)"
              />
            )
          }
          const mask = s.masks[i]!
          const powered = lit.has(i)
          const isSource = i === s.source
          const isTarget = s.targets.includes(i)
          const mid = cell / 2
          const arms = [
            { d: `M${mid},${mid} L${mid},0`, bit: 1 },
            { d: `M${mid},${mid} L${cell},${mid}`, bit: 2 },
            { d: `M${mid},${mid} L${mid},${cell}`, bit: 4 },
            { d: `M${mid},${mid} L0,${mid}`, bit: 8 },
          ]
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect
                x={1}
                y={1}
                width={cell - 2}
                height={cell - 2}
                rx={3}
                fill="var(--bg-3)"
                stroke="var(--line)"
              />
              {arms.map((arm) =>
                mask & arm.bit ? (
                  <path
                    key={arm.bit}
                    d={arm.d}
                    stroke={powered ? 'var(--rune)' : 'var(--text-faint)'}
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                ) : null,
              )}
              {isSource && (
                <circle cx={mid} cy={mid} r={11} fill="var(--rune)" stroke="var(--bg)" strokeWidth={2} />
              )}
              {isTarget && (
                <circle
                  cx={mid}
                  cy={mid}
                  r={9}
                  fill={powered ? 'var(--echo)' : 'none'}
                  stroke="var(--echo)"
                  strokeWidth={2.5}
                />
              )}
              <rect
                width={cell}
                height={cell}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => onMove({ k: 'routeRotate', index: i })}
              />
            </g>
          )
        })}
      </svg>
      <p className="puzzle-meta">
        <span className="legend-dot rune" /> {t.powerRoutingReactor}
        <span className="legend-dot echo" /> {t.powerRoutingTerminal}
      </p>
    </>
  )
}

// ================================================================ refraction

function Refraction({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  if (puzzle.k !== 'refraction') return null
  const s = puzzle.s
  const cell = 46
  const path = traceBeam(s)
  const hit = new Set(path)
  const centre = (i: number) => ({
    x: (i % s.w) * cell + cell / 2,
    y: Math.floor(i / s.w) * cell + cell / 2,
  })
  const points = [s.emitter, ...path].map(centre)

  return (
    <>
      <svg
        className="puzzle-grid"
        width={s.w * cell}
        height={s.h * cell}
        viewBox={`0 0 ${s.w * cell} ${s.h * cell}`}
      >
        {Array.from({ length: s.w * s.h }, (_, i) => {
          const x = (i % s.w) * cell
          const y = Math.floor(i / s.w) * cell
          const blocked = s.blockers.includes(i)
          return (
            <rect
              key={`bg${i}`}
              x={x + 1}
              y={y + 1}
              width={cell - 2}
              height={cell - 2}
              rx={2}
              fill={blocked ? 'var(--bg)' : 'var(--bg-3)'}
              stroke={blocked ? 'var(--line)' : 'var(--line-soft)'}
            />
          )
        })}

        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="var(--rune)"
          strokeWidth={3}
          opacity={0.8}
        />

        {Array.from({ length: s.w * s.h }, (_, i) => {
          const x = (i % s.w) * cell
          const y = Math.floor(i / s.w) * cell
          const mirror = s.mirrors[i] ?? 0
          const isTarget = s.targets.includes(i)
          return (
            <g key={`fg${i}`} transform={`translate(${x} ${y})`}>
              {i === s.emitter && (
                <polygon
                  points={`${cell * 0.25},${cell * 0.3} ${cell * 0.75},${cell * 0.5} ${cell * 0.25},${cell * 0.7}`}
                  fill="var(--rune)"
                />
              )}
              {mirror !== 0 && (
                <path
                  d={
                    mirror === 1
                      ? `M${cell * 0.18},${cell * 0.82} L${cell * 0.82},${cell * 0.18}`
                      : `M${cell * 0.18},${cell * 0.18} L${cell * 0.82},${cell * 0.82}`
                  }
                  stroke="var(--echo)"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              )}
              {isTarget && (
                <circle
                  cx={cell / 2}
                  cy={cell / 2}
                  r={cell * 0.28}
                  fill="none"
                  stroke={hit.has(i) ? 'var(--rune)' : 'var(--danger)'}
                  strokeWidth={2.5}
                />
              )}
              {mirror !== 0 && (
                <rect
                  width={cell}
                  height={cell}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onMove({ k: 'refractRotate', index: i })}
                />
              )}
            </g>
          )
        })}
      </svg>
      <p className="puzzle-meta">
        {t.refractionFocus}: {s.targets.filter((x) => hit.has(x)).length} / {s.targets.length}
      </p>
    </>
  )
}

// ================================================================ star chart

function StarChart({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  const [held, setHeld] = useState<number | null>(null)
  if (puzzle.k !== 'starChart') return null
  const s = puzzle.s
  const cell = 84
  const tray = s.fragments.map((_, i) => i).filter((i) => !s.placement.includes(i))

  const fragment = (index: number, size: number) => {
    const edges = s.fragments[index]!
    const rotation = s.rotation[index]!
    const half = size / 2
    const notch = (dir: number) => {
      const code = edgeAt(edges, rotation, dir)
      const color = EDGE_COLORS[code] ?? 'transparent'
      const positions = [
        { x: half, y: 6 },
        { x: size - 6, y: half },
        { x: half, y: size - 6 },
        { x: 6, y: half },
      ]
      const p = positions[dir]!
      return <circle key={dir} cx={p.x} cy={p.y} r={5} fill={color} />
    }
    return (
      <g>
        <rect
          width={size - 4}
          height={size - 4}
          x={2}
          y={2}
          rx={4}
          fill="var(--bg-3)"
          stroke="var(--line)"
        />
        {/* Star lines, so the seams read visually and not only by colour. */}
        <path
          d={`M${half},2 L${half},${half} M${size - 2},${half} L${half},${half} M${half},${size - 2} L${half},${half} M2,${half} L${half},${half}`}
          stroke="var(--line)"
          strokeWidth={1}
          opacity={0.5}
        />
        {[0, 1, 2, 3].map(notch)}
      </g>
    )
  }

  return (
    <>
      <svg
        className="puzzle-grid"
        width={s.size * cell}
        height={s.size * cell}
        viewBox={`0 0 ${s.size * cell} ${s.size * cell}`}
      >
        {Array.from({ length: s.size * s.size }, (_, i) => {
          const x = (i % s.size) * cell
          const y = Math.floor(i / s.size) * cell
          const placed = s.placement[i]
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              {placed === null || placed === undefined ? (
                <rect
                  width={cell - 4}
                  height={cell - 4}
                  x={2}
                  y={2}
                  rx={4}
                  fill="var(--bg)"
                  stroke="var(--line-soft)"
                  strokeDasharray="4 4"
                />
              ) : (
                fragment(placed, cell)
              )}
              <rect
                width={cell}
                height={cell}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (held !== null) {
                    onMove({ k: 'chartPlace', fragment: held, cell: i })
                    setHeld(null)
                  } else if (placed !== null && placed !== undefined) {
                    onMove({ k: 'chartLift', cell: i })
                    setHeld(placed)
                  }
                }}
                onContextMenu={(event) => {
                  event.preventDefault()
                  if (placed !== null && placed !== undefined) {
                    onMove({ k: 'chartRotate', fragment: placed })
                  }
                }}
              />
            </g>
          )
        })}
      </svg>

      <h4>{t.starChartTray}</h4>
      <div className="chart-tray">
        {tray.map((index) => (
          <div key={index} className={`chart-piece ${held === index ? 'held' : ''}`}>
            <svg width={64} height={64} viewBox="0 0 64 64" onClick={() => setHeld(index)}>
              {fragment(index, 64)}
            </svg>
            <button className="button button-small" onClick={() => onMove({ k: 'chartRotate', fragment: index })}>
              {t.starChartRotate}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

// ================================================================= resonance

function Resonance({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  if (puzzle.k !== 'resonance') return null
  const s = puzzle.s
  const cell = 62

  return (
    <>
      <svg
        className="puzzle-grid"
        width={s.w * cell}
        height={s.h * cell}
        viewBox={`0 0 ${s.w * cell} ${s.h * cell}`}
      >
        {s.values.map((value, i) => {
          const x = (i % s.w) * cell
          const y = Math.floor(i / s.w) * cell
          const mid = cell / 2
          const angle = (value / s.modulus) * Math.PI * 2 - Math.PI / 2
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle
                cx={mid}
                cy={mid}
                r={cell * 0.36}
                fill={value === 0 ? 'var(--echo-dim)' : 'var(--bg-4)'}
                stroke={value === 0 ? 'var(--echo)' : 'var(--rune)'}
                strokeWidth={2}
              />
              <line
                x1={mid}
                y1={mid}
                x2={mid + Math.cos(angle) * cell * 0.26}
                y2={mid + Math.sin(angle) * cell * 0.26}
                stroke={value === 0 ? 'var(--echo)' : 'var(--rune)'}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <rect
                width={cell}
                height={cell}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => onMove({ k: 'resonanceTap', index: i })}
              />
            </g>
          )
        })}
      </svg>
      <p className="puzzle-meta">{t.resonanceTaps(s.taps)}</p>
    </>
  )
}

// ============================================================ gravity cores

function GravityCores({ puzzle, onMove }: PuzzleProps) {
  const { t } = useLang()
  if (puzzle.k !== 'gravityCores') return null
  const s = puzzle.s
  const cell = 48

  return (
    <>
      <svg
        className="puzzle-grid"
        width={s.w * cell}
        height={s.h * cell}
        viewBox={`0 0 ${s.w * cell} ${s.h * cell}`}
      >
        {Array.from({ length: s.w * s.h }, (_, i) => {
          const x = (i % s.w) * cell
          const y = Math.floor(i / s.w) * cell
          const wall = s.walls[i]
          const goal = s.goals.includes(i)
          const core = s.cores.includes(i)
          const hero = s.hero === i
          const mid = cell / 2
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect
                width={cell - 1}
                height={cell - 1}
                rx={2}
                fill={wall ? 'var(--bg)' : 'var(--bg-3)'}
                stroke={wall ? 'var(--line)' : 'var(--line-soft)'}
              />
              {goal && (
                <circle
                  cx={mid}
                  cy={mid}
                  r={cell * 0.3}
                  fill="none"
                  stroke="var(--echo)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              )}
              {core && (
                <circle
                  cx={mid}
                  cy={mid}
                  r={cell * 0.26}
                  fill={goal ? 'var(--echo)' : 'var(--rune)'}
                  stroke="var(--bg)"
                  strokeWidth={1.5}
                />
              )}
              {hero && (
                <polygon
                  points={`${mid},${cell * 0.24} ${cell * 0.76},${cell * 0.74} ${cell * 0.24},${cell * 0.74}`}
                  fill="var(--text)"
                />
              )}
            </g>
          )
        })}
      </svg>

      <div className="core-pad">
        <button className="button" onClick={() => onMove({ k: 'coreStep', dir: 0 })}>
          ▲
        </button>
        <div>
          <button className="button" onClick={() => onMove({ k: 'coreStep', dir: 3 })}>
            ◀
          </button>
          <button className="button" onClick={() => onMove({ k: 'coreStep', dir: 1 })}>
            ▶
          </button>
        </div>
        <button className="button" onClick={() => onMove({ k: 'coreStep', dir: 2 })}>
          ▼
        </button>
      </div>

      <div className="button-row">
        <button className="button" onClick={() => onMove({ k: 'coreUndo' })}>
          {t.puzzleUndo}
        </button>
        <span className="puzzle-meta">{t.gravityCoresMoves(s.moves)}</span>
      </div>
    </>
  )
}
