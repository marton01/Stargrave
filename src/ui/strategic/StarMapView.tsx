// The star map: columns of systems with forward links.
//
// Drawn as SVG so the links are actual lines — the shape of the road is the
// decision, and a table of names would hide it. Nodes the sensors have not
// revealed show as question marks, which is what makes Sensor power worth
// paying for.

import { mapNode } from '../../engine/expedition/starmap'
import {
  canGoHome,
  canSetCourse,
  heraldDistance,
  nodeEngageable,
} from '../../engine/expedition/expedition'
import type { ExpeditionAction } from '../../engine/expedition/expedition'
import { useLang } from '../../i18n/LangContext'
import type { ExpeditionState, MapNode, NodeKind } from '../../engine/expedition/types'
import type { UiKey } from '../../i18n/ui'

const COLUMN_WIDTH = 128
const ROW_HEIGHT = 92

/** Exported with `KindMark` and `KIND_KEY` so the help can draw the same node. */
export const NODE_RADIUS = 20

export const KIND_KEY: Record<NodeKind, UiKey> = {
  empty: 'nodeEmpty',
  ruins: 'nodeRuins',
  station: 'nodeStation',
  anomaly: 'nodeAnomaly',
  world: 'nodeWorld',
  trade: 'nodeTrade',
  distress: 'nodeDistress',
  heart: 'nodeHeart',
}

const KIND_COLOR: Record<NodeKind, string> = {
  empty: 'var(--text-faint)',
  ruins: 'var(--rune)',
  station: '#7f9bc4',
  anomaly: '#b47fc6',
  world: 'var(--green)',
  trade: '#d08a55',
  distress: 'var(--danger)',
  heart: 'var(--echo)',
}

/** A small glyph per node kind, so the map reads without labels. */
export function KindMark({ kind }: { kind: NodeKind }) {
  const color = KIND_COLOR[kind]
  switch (kind) {
    case 'ruins':
      return <path d="M-7,7 L-3,-6 L1,7 M-5,2 L-1,2 M3,7 L7,-2 L9,7" stroke={color} strokeWidth={2} fill="none" />
    case 'station':
      return <path d="M-6,-6 L6,-6 L6,6 L-6,6 Z M0,-6 L0,6" stroke={color} strokeWidth={2} fill="none" />
    case 'anomaly':
      return <path d="M-8,4 Q-4,-6 0,4 T8,4" stroke={color} strokeWidth={2} fill="none" />
    case 'world':
      return <circle r={6.5} stroke={color} strokeWidth={2} fill="none" />
    case 'trade':
      return <path d="M-7,-3 L7,-3 M-7,3 L7,3 M-3,-7 L-3,7 M3,-7 L3,7" stroke={color} strokeWidth={1.8} fill="none" />
    case 'distress':
      return <path d="M0,-8 L0,3 M0,6 L0,8" stroke={color} strokeWidth={2.6} fill="none" strokeLinecap="round" />
    case 'heart':
      return (
        <g stroke={color} strokeWidth={2} fill="none">
          <circle r={8} />
          <circle r={3.5} />
        </g>
      )
    default:
      return <circle r={2.5} fill={color} />
  }
}

export function StarMapView({
  state,
  dispatch,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
}) {
  const { t } = useLang()
  const map = state.map
  const here = mapNode(map, state.at)
  // Nothing moves on a cold engine line, so the course options say so rather than
  // quietly doing nothing when clicked.
  const cold = !canSetCourse(state)
  const rowsPerColumn = new Map<number, number>()
  for (const node of map.nodes) {
    rowsPerColumn.set(node.column, Math.max(rowsPerColumn.get(node.column) ?? 0, node.row + 1))
  }
  const maxRows = Math.max(...rowsPerColumn.values())

  const width = map.columns * COLUMN_WIDTH + 40
  const height = maxRows * ROW_HEIGHT + 40

  const centre = (node: MapNode) => {
    const rows = rowsPerColumn.get(node.column) ?? 1
    const offset = (maxRows - rows) / 2
    return {
      x: 30 + node.column * COLUMN_WIDTH,
      y: 30 + (node.row + offset) * ROW_HEIGHT,
    }
  }

  const engageLabel = (node: MapNode): string => {
    switch (node.event.k) {
      case 'mission':
        return t.engageMission
      case 'puzzle':
        return t.engagePuzzle
      case 'encounter':
        return t.engageEncounter
      case 'market':
        return t.engageMarket
      default:
        return t.nodeNothing
    }
  }

  return (
    <div className="starmap">
      <header className="panel-head">
        <h2>{t.starMapHeading}</h2>
        <span className="panel-meta">
          {state.travel
            ? t.travellingTo(mapNode(map, state.travel.to).name, state.travel.weeksLeft)
            : `${t.currentPosition}: ${here.name}`}
        </span>
      </header>
      <p className="panel-intro">{t.starMapIntro}</p>

      {state.herald && (
        <p className="starmap-warning" title={t.heraldHint}>
          <strong>{t.heraldLabel}</strong> — {t.heraldAway(heraldDistance(state) ?? 0)} ·{' '}
          {t.heraldHint}
        </p>
      )}

      <div className="starmap-scroll">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="starmap-svg">
          {/*
            The Herald. It does not sit on a node — it is not using the roads —
            so it is drawn as the whole column it has reached, closing on the
            ship. A marker on a node would say something untrue about it.
          */}
          {state.herald && (
            <g className="starmap-herald">
              <rect
                x={30 + state.herald.column * COLUMN_WIDTH - COLUMN_WIDTH / 2}
                y={0}
                width={COLUMN_WIDTH}
                height={height}
                fill="var(--danger)"
                opacity={0.12}
              />
              <text
                x={30 + state.herald.column * COLUMN_WIDTH}
                y={16}
                className="starmap-herald-label"
              >
                {t.heraldLabel}
              </text>
            </g>
          )}

          {/* links */}
          {map.nodes.flatMap((node) =>
            node.links.map((targetId, i) => {
              const target = map.nodes.find((n) => n.id === targetId)
              if (!target) return null
              const a = centre(node)
              const b = centre(target)
              const isOption = node.id === state.at && !state.travel
              const isPlanned = state.travel?.to === targetId && node.id === state.at
              return (
                <g key={`${node.id}-${targetId}`}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={isPlanned ? 'var(--rune)' : isOption ? 'var(--echo)' : 'var(--line)'}
                    strokeWidth={isPlanned ? 3 : isOption ? 2 : 1.2}
                    strokeDasharray={isOption && !isPlanned ? '5 4' : undefined}
                  />
                  {isOption && (
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2 - 6}
                      className="starmap-weeks"
                    >
                      {node.linkWeeks[i]}
                    </text>
                  )}
                </g>
              )
            }),
          )}

          {/* nodes */}
          {map.nodes.map((node) => {
            const p = centre(node)
            const isHere = node.id === state.at
            const reachable = here.links.includes(node.id) && !state.travel && cold === false
            return (
              <g key={node.id} transform={`translate(${p.x} ${p.y})`}>
                <circle
                  r={NODE_RADIUS}
                  fill={isHere ? 'var(--bg-4)' : 'var(--bg-3)'}
                  stroke={
                    isHere
                      ? 'var(--rune)'
                      : reachable
                        ? 'var(--echo)'
                        : node.visited
                          ? 'var(--line)'
                          : 'var(--line-soft)'
                  }
                  strokeWidth={isHere || reachable ? 2.5 : 1.4}
                />
                {node.known ? (
                  <KindMark kind={node.kind} />
                ) : (
                  <text y={5} className="starmap-unknown">
                    ?
                  </text>
                )}
                {node.resolved && node.kind !== 'heart' && (
                  <circle r={NODE_RADIUS + 4} fill="none" stroke="var(--green)" strokeWidth={1} opacity={0.5} />
                )}
                <text y={NODE_RADIUS + 15} className="starmap-name">
                  {node.known ? node.name : t.unknownSystem}
                </text>
                {reachable && (
                  <circle
                    r={NODE_RADIUS + 6}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onClick={() => dispatch({ k: 'setCourse', nodeId: node.id })}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="starmap-actions">
        <div className="node-detail">
          <span className="node-kind" style={{ color: KIND_COLOR[here.kind] }}>
            {t[KIND_KEY[here.kind]] as string}
          </span>
          <strong>{here.name}</strong>
          {here.resolved && here.kind !== 'heart' && (
            <span className="node-done">{t.nodeResolved}</span>
          )}
        </div>

        {nodeEngageable(state) && (
          <button
            className="button button-primary"
            data-action="engageNode"
            onClick={() => dispatch({ k: 'engageNode' })}
          >
            {engageLabel(here)}
          </button>
        )}

        {canGoHome(state) && (
          <button
            className="button"
            data-action="openGate"
            title={t.gateHintOnMap}
            onClick={() => dispatch({ k: 'openScreen', screen: 'gate' })}
          >
            {t.gateGoHomeShort}
          </button>
        )}

        {here.kind === 'heart' && (
          <button
            className="button button-primary"
            data-action="openHeart"
            onClick={() => dispatch({ k: 'openScreen', screen: 'heart' })}
          >
            {t.nodeHeart}
          </button>
        )}

        {cold && <p className="starmap-warning">{t.enginesColdWarning}</p>}

        {!state.travel && here.links.length > 0 && (
          <div className="course-options">
            {here.links.map((id, i) => {
              const target = mapNode(map, id)
              return (
                <button
                  key={id}
                  className="button"
                  data-action="setCourse"
                  data-node={id}
                  disabled={cold}
                  title={cold ? t.enginesColdWarning : undefined}
                  onClick={() => dispatch({ k: 'setCourse', nodeId: id })}
                >
                  {t.setCourse}: {target.known ? target.name : t.unknownSystem} ·{' '}
                  {here.linkWeeks[i]} {t.historyWeek}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
