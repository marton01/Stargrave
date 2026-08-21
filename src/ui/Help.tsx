// The in-game help panel.
//
// Built from two sources, deliberately:
//
//  1. The prose comes from the rules markdown at the project root, read raw and
//     picked by language. Its `##` sections become the tabs. That way there is no
//     second copy of the rules that can drift — edit the file and the help
//     follows.
//
//  2. The "Game pieces" tab is NOT text. It draws the units, terrain and badges
//     live, with the same components and the same colour constants the grid
//     uses. So the help cannot claim an amber pentagon while the grid shows
//     something else. The enemy data comes straight from the content files too.

import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import rulesHu from '../../RULES.hu.md?raw'
import rulesEn from '../../RULES.md?raw'
import { ENEMY_TYPES } from '../content/enemies'
import { GRID_LINE, TERRAIN_COLOR, TERRAIN_TEXT, TILE } from './gridStyle'
import { HERO_CLASSES } from '../content/heroes'
import {
  CollapsingShape,
  ExitShape,
  InstallationShape,
  PillarShape,
  RelicShape,
  Shape,
  TrapShape,
  type ShapeKey,
} from './shapes'
import { STATUS_DESCRIPTIONS, STATUS_NAMES } from '../content/statuses'
import { KIND_KEY, KindMark, NODE_RADIUS } from './strategic/StarMapView'
import { useLang } from '../i18n/LangContext'
import type { Lang, StatusKind, TerrainKind } from '../engine/types'
import type { NodeKind } from '../engine/expedition/types'
import type { UiKey } from '../i18n/ui'

const RULES: Record<Lang, string> = { hu: rulesHu, en: rulesEn }

type Section = {
  title: string
  html: string
  /** The plain prose of the section, for searching. */
  text: string
}

/** Split the rules markdown into sections along the `##` headings. */
function sections(markdown: string): Section[] {
  const lines = markdown.split(/\r?\n/)
  const out: Section[] = []
  let title: string | null = null
  let body: string[] = []

  const close = () => {
    if (title === null) return
    const source = body.join('\n')
    out.push({
      title,
      html: marked.parse(source) as string,
      // Searched against the markdown rather than the rendered html, so a query
      // can never match a tag name or an attribute.
      text: source,
    })
  }

  for (const line of lines) {
    const match = /^##\s+(.+?)\s*$/.exec(line)
    if (match) {
      close()
      title = match[1]!
      body = []
    } else if (title !== null) {
      body.push(line)
    }
  }
  close()
  return out
}

/**
 * Which tab to open on, given what the player is looking at.
 *
 * Matched by POSITION, not by title, because the titles are translated. Both
 * rules files must therefore keep the same section order, and both carry a
 * comment saying so. The smoke test fails if the two files ever disagree on the
 * number of sections.
 */
const SECTION_FOR_TOPIC: Record<HelpTopic, number> = {
  overview: 0,
  strategic: 1,
  starmap: 2,
  mission: 3,
  puzzle: 4,
  ending: 6,
}

export type HelpTopic = 'overview' | 'strategic' | 'starmap' | 'mission' | 'puzzle' | 'ending'

function preferredTab(topic: HelpTopic, titles: string[]): string | undefined {
  return titles[SECTION_FOR_TOPIC[topic]] ?? titles[0]
}

export function Help({ topic, onClose }: { topic: HelpTopic; onClose: () => void }) {
  const { t, s, lang } = useLang()
  const parsed = useMemo(() => sections(RULES[lang]), [lang])
  const tabs = useMemo(() => [t.helpElementsTab, ...parsed.map((p) => p.title)], [parsed, t])

  const [active, setActive] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const searching = query.trim().length > 0
  // How many times the query occurs in each section, for the tab badges and for
  // the "it is on another tab" line.
  const hits = useMemo(() => {
    const map = new Map(parsed.map((p) => [p.title, countMatches(p.text, query)]))
    map.set(t.helpElementsTab, countMatches(gamePiecesText(t, s), query))
    return map
  }, [parsed, query, t, s])
  const totalHits = [...hits.values()].reduce((sum, n) => sum + n, 0)

  // Switching language rebuilds the tab titles, so an index-based default is
  // needed rather than remembering the old string.
  const currentTab =
    active && tabs.includes(active)
      ? active
      : (preferredTab(topic, parsed.map((p) => p.title)) ?? tabs[0] ?? t.helpElementsTab)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const shown = parsed.find((p) => p.title === currentTab)

  return (
    <div className="help-veil" onClick={onClose}>
      <div className="help" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal>
        <header className="help-header">
          <h2>{t.helpHeading}</h2>
          <button className="help-close" data-action="closeHelp" onClick={onClose} aria-label={t.helpClose}>
            ✕
          </button>
        </header>

        <div className="help-search">
          <input
            type="search"
            className="help-search-input"
            data-action="helpSearch"
            value={query}
            placeholder={t.helpSearchPlaceholder}
            aria-label={t.helpSearchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          {searching && (
            <span className="help-search-count">
              {totalHits > 0 ? t.helpSearchHits(totalHits) : t.helpSearchNone}
            </span>
          )}
          {searching && (
            <button className="button button-small" data-action="clearHelpSearch" onClick={() => setQuery('')}>
              {t.cancel}
            </button>
          )}
        </div>

        <nav className="help-tabs">
          {tabs.map((tab) => {
            const found = hits.get(tab) ?? 0
            return (
              <button
                key={tab}
                className={`help-tab ${tab === currentTab ? 'help-tab-active' : ''} ${
                  searching && found === 0 ? 'help-tab-quiet' : ''
                }`}
                onClick={() => setActive(tab)}
              >
                {tab}
                {searching && found > 0 && <span className="help-tab-hits">{found}</span>}
              </button>
            )
          })}
        </nav>

        <div className="help-body">
          {currentTab === t.helpElementsTab ? (
            <>
              {searching && (hits.get(t.helpElementsTab) ?? 0) > 0 && (
                <p className="help-note">{t.helpSearchDrawn(hits.get(t.helpElementsTab) ?? 0)}</p>
              )}
              <GamePieces />
            </>
          ) : shown ? (
            <>
              {searching && (hits.get(shown.title) ?? 0) === 0 && totalHits > 0 && (
                <p className="help-note">{t.helpSearchElsewhere}</p>
              )}
              <HelpSection html={searching ? markMatches(shown.html, query) : shown.html} />
            </>
          ) : (
            <p>{t.helpMissingSection}</p>
          )}
        </div>

        <footer className="help-footer">
          {t.helpFooter} <code>{lang === 'hu' ? 'RULES.hu.md' : 'RULES.md'}</code>{' '}
          {t.helpFooterTail} <kbd>Esc</kbd>
        </footer>
      </div>
    </div>
  )
}

// ------------------------------------------------------------- live legend

function ShapeSample({ shape, color }: { shape: ShapeKey; color: string }) {
  const size = 46
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sample">
      <rect width={size} height={size} fill={TERRAIN_COLOR.floor} />
      <rect width={size} height={size} fill="none" stroke={GRID_LINE.floor} strokeWidth={1} />
      <g transform={`translate(${size * 0.12} ${size * 0.06}) scale(${size * 0.76})`}>
        <Shape shape={shape} color={color} />
      </g>
    </svg>
  )
}

function TerrainSample({ kind }: { kind: TerrainKind }) {
  const size = 46
  const scale = size / TILE
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sample">
      <rect width={size} height={size} fill={TERRAIN_COLOR[kind]} />
      {GRID_LINE[kind] && (
        <rect width={size} height={size} fill="none" stroke={GRID_LINE[kind]} strokeWidth={1} />
      )}
      {kind === 'ash' && (
        <g fill="rgba(180,170,150,0.16)">
          <circle cx={size * 0.3} cy={size * 0.35} r={2 * scale * 1.4} />
          <circle cx={size * 0.62} cy={size * 0.28} r={1.6 * scale * 1.4} />
          <circle cx={size * 0.45} cy={size * 0.66} r={2.2 * scale * 1.4} />
          <circle cx={size * 0.74} cy={size * 0.7} r={1.4 * scale * 1.4} />
        </g>
      )}
      {kind === 'chasm' && (
        <rect
          x={3}
          y={3}
          width={size - 6}
          height={size - 6}
          fill="none"
          stroke="rgba(90,125,170,0.5)"
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />
      )}
      {kind === 'pillar' && (
        <g transform={`scale(${size})`}>
          <PillarShape />
        </g>
      )}
    </svg>
  )
}

// ----------------------------------------------------------------- search

/**
 * The searchable text of the Game pieces tab.
 *
 * That tab is drawn from code, not from the rules file, so a search over the
 * markdown alone reports "no matches" for a rune pillar or the Bond — which is
 * worse than not offering a search. The strings are taken from the same places
 * the tab renders them, so the two cannot disagree about what is on the page.
 */
function gamePiecesText(t: ReturnType<typeof useLang>['t'], s: ReturnType<typeof useLang>['s']): string {
  const parts: string[] = [t.helpHeroes, t.helpEnemies, t.helpTerrain, t.helpMarkers, t.helpBadges]

  for (const hero of [HERO_CLASSES.runesmith, HERO_CLASSES.echoreader]) {
    parts.push(s(hero.name), s(hero.description))
  }
  for (const enemy of ENEMY_TYPES) parts.push(s(enemy.name), s(enemy.description))
  for (const kind of ['floor', 'ash', 'wall', 'chasm', 'pillar'] as TerrainKind[]) {
    parts.push(t[TERRAIN_TEXT[kind].name] as string, t[TERRAIN_TEXT[kind].text] as string)
  }
  parts.push(t.terrainTrap, t.terrainTrapText)
  parts.push(t.markerRelic, t.markerRelicText, t.markerExit, t.markerExitText)
  parts.push(t.markerCollapsing, t.markerCollapsingText)
  parts.push(t.markerInstallation, t.markerInstallationText)
  parts.push(t.badgeBond, t.badgeBondText, t.badgeInitiative, t.badgeInitiativeText)
  parts.push(t.badgeShield, t.badgeShieldText)
  for (const kind of NODE_ORDER) parts.push(t[KIND_KEY[kind]] as string, t[NODE_TEXT[kind]] as string)
  for (const kind of Object.keys(STATUS_NAMES) as StatusKind[]) {
    parts.push(s(STATUS_NAMES[kind]), s(STATUS_DESCRIPTIONS[kind]))
  }
  return parts.join('\n')
}

/** Count of matches, case- and accent-insensitively enough for Hungarian. */
function countMatches(haystack: string, needle: string): number {
  if (needle.trim().length === 0) return 0
  const hay = haystack.toLocaleLowerCase()
  const what = needle.trim().toLocaleLowerCase()
  let from = 0
  let found = 0
  for (;;) {
    const at = hay.indexOf(what, from)
    if (at < 0) return found
    found += 1
    from = at + what.length
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Mark the matches inside rendered html.
 *
 * The html is split on tags first and only the text between them is touched, so
 * a search for "p" cannot rewrite a paragraph tag into nonsense. The markdown is
 * already escaped by `marked`, so wrapping a run in <mark> is safe.
 */
function markMatches(html: string, needle: string): string {
  const what = needle.trim()
  if (what.length === 0) return html
  const pattern = new RegExp(escapeRegExp(what), 'gi')
  return html
    .split(/(<[^>]*>)/)
    .map((part, index) => (index % 2 === 1 ? part : part.replace(pattern, (hit) => `<mark>${hit}</mark>`)))
    .join('')
}

/**
 * Where a rules file asks for the drawn node legend.
 *
 * Both language files carry this comment in the same place, and it survives
 * markdown untouched. Putting the position in the prose rather than in the code
 * means the legend sits exactly where the text introduces the nodes, instead of
 * at the end of whatever section happens to contain them.
 */
const NODE_LEGEND_MARK = '<!-- legend: nodes -->'

/** Prose from the rules file, with the legend spliced in where it asks for it. */
function HelpSection({ html }: { html: string }) {
  const [before, after] = html.split(NODE_LEGEND_MARK)
  return (
    <div className="help-prose">
      <div dangerouslySetInnerHTML={{ __html: before ?? html }} />
      {after !== undefined && (
        <>
          <StarMapNodes />
          <div dangerouslySetInnerHTML={{ __html: after }} />
        </>
      )}
    </div>
  )
}

/** The node kinds, in the order the star map section introduces them. */
const NODE_ORDER: NodeKind[] = [
  'ruins',
  'anomaly',
  'world',
  'station',
  'trade',
  'distress',
  'empty',
  'heart',
]

const NODE_TEXT: Record<NodeKind, UiKey> = {
  ruins: 'nodeRuinsText',
  anomaly: 'nodeAnomalyText',
  world: 'nodeWorldText',
  station: 'nodeStationText',
  trade: 'nodeTradeText',
  distress: 'nodeDistressText',
  empty: 'nodeEmptyText',
  heart: 'nodeHeartText',
}

/**
 * One node, drawn exactly as the map draws it: same radius, same glyph, same
 * colour, imported rather than copied. The circle is the "known but not yet
 * visited" state, which is how a node looks when you are deciding about it.
 */
function NodeSample({ kind }: { kind: NodeKind }) {
  const size = 46
  const half = size / 2
  return (
    <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`} className="sample sample-node">
      <circle r={NODE_RADIUS} fill="var(--bg-3)" stroke="var(--line)" strokeWidth={1.4} />
      <KindMark kind={kind} />
    </svg>
  )
}

function StarMapNodes() {
  const { t } = useLang()
  return (
    <>
      <h3>{t.helpNodes}</h3>
      <div className="legend">
        {NODE_ORDER.map((kind) => (
          <div key={kind} className="legend-item">
            <NodeSample kind={kind} />
            <div>
              <strong>{t[KIND_KEY[kind]] as string}</strong>
              <p>{t[NODE_TEXT[kind]] as string}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/**
 * A mission marker on a piece of floor.
 *
 * These three are why the grid's own drawing code was pulled into `shapes.tsx`:
 * a legend that redraws a mark by hand is a legend that can be wrong about it.
 */
function MarkerSample({ children, badge }: { children: React.ReactNode; badge?: string }) {
  const size = 46
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sample">
      <rect width={size} height={size} fill={TERRAIN_COLOR.floor} />
      <rect width={size} height={size} fill="none" stroke={GRID_LINE.floor} strokeWidth={1} />
      <g transform={`scale(${size})`}>{children}</g>
      {badge && (
        <text x={size - 8} y={size - 5} className="grid-badge" style={{ fontSize: 11 }}>
          {badge}
        </text>
      )}
    </svg>
  )
}

function GamePieces() {
  const { t, s } = useLang()
  const heroList = [HERO_CLASSES.runesmith, HERO_CLASSES.echoreader]
  const terrainOrder: TerrainKind[] = ['floor', 'ash', 'wall', 'chasm', 'pillar']
  const statusOrder: StatusKind[] = [
    'shield',
    'anchor',
    'runeMark',
    'prone',
    'blind',
    'weakened',
  ]

  return (
    <div className="help-prose help-wide">
      <p className="help-note">{t.helpLiveNote}</p>

      <h3>{t.helpHeroes}</h3>
      <div className="legend">
        {heroList.map((h) => (
          <div key={h.id} className="legend-item">
            <ShapeSample
              shape={h.shape}
              color={h.id === 'runesmith' ? 'var(--rune)' : 'var(--echo)'}
            />
            <div>
              <strong className={h.id === 'runesmith' ? 'tone-rune' : 'tone-echo'}>
                {s(h.name)}
              </strong>
              <span className="legend-meta">
                {h.hp} {t.helpHp}
              </span>
              <p>{s(h.description)}</p>
            </div>
          </div>
        ))}
      </div>

      <h3>{t.helpEnemies}</h3>
      <div className="legend">
        {ENEMY_TYPES.map((e) => (
          <div key={e.id} className="legend-item">
            <ShapeSample
              shape={e.shape}
              color={e.id === 'godmachine-shard' ? '#9a5a4a' : 'var(--danger)'}
            />
            <div>
              <strong className="tone-danger">{s(e.name)}</strong>
              <span className="legend-meta">
                {e.hp} {t.helpHp}
              </span>
              <p>{s(e.description)}</p>
            </div>
          </div>
        ))}
      </div>

      <h3>{t.helpTerrain}</h3>
      <div className="legend">
        {terrainOrder.map((kind) => (
          <div key={kind} className="legend-item">
            <TerrainSample kind={kind} />
            <div>
              <strong>{t[TERRAIN_TEXT[kind].name] as string}</strong>
              <p>{t[TERRAIN_TEXT[kind].text] as string}</p>
            </div>
          </div>
        ))}
        <div className="legend-item">
          <svg width={46} height={46} viewBox="0 0 46 46" className="sample">
            <rect width={46} height={46} fill={TERRAIN_COLOR.floor} />
            <rect width={46} height={46} fill="none" stroke={GRID_LINE.floor} strokeWidth={1} />
            <g transform="scale(46)">
              <TrapShape />
            </g>
          </svg>
          <div>
            <strong>{t.terrainTrap}</strong>
            <p>{t.terrainTrapText}</p>
          </div>
        </div>
      </div>

      <h3>{t.helpMarkers}</h3>
      <div className="legend">
        <div className="legend-item">
          <MarkerSample>
            <RelicShape />
          </MarkerSample>
          <div>
            <strong className="tone-rune">{t.markerRelic}</strong>
            <p>{t.markerRelicText}</p>
          </div>
        </div>

        <div className="legend-item">
          <MarkerSample>
            <InstallationShape hurt={false} />
          </MarkerSample>
          <div>
            <strong className="tone-echo">{t.markerInstallation}</strong>
            <p>{t.markerInstallationText}</p>
          </div>
        </div>

        <div className="legend-item">
          <MarkerSample>
            <ExitShape />
          </MarkerSample>
          <div>
            <strong>{t.markerExit}</strong>
            <p>{t.markerExitText}</p>
          </div>
        </div>

        <div className="legend-item">
          <MarkerSample badge="3">
            <CollapsingShape />
          </MarkerSample>
          <div>
            <strong className="tone-danger">{t.markerCollapsing}</strong>
            <p>{t.markerCollapsingText}</p>
          </div>
        </div>
      </div>

      <h3>{t.helpBadges}</h3>
      <div className="legend">
        <div className="legend-item">
          <svg width={46} height={46} viewBox="0 0 46 46" className="sample">
            <rect width={46} height={46} fill={TERRAIN_COLOR.floor} />
            <circle cx={32} cy={14} r={11} fill="rgba(8,11,17,0.9)" stroke="var(--danger)" strokeWidth={1.2} />
            <text x={32} y={18} className="grid-badge" style={{ fontSize: 12 }}>
              45
            </text>
          </svg>
          <div>
            <strong>{t.badgeInitiative}</strong>
            <p>{t.badgeInitiativeText}</p>
          </div>
        </div>

        <div className="legend-item">
          <svg width={46} height={46} viewBox="0 0 46 46" className="sample">
            <rect width={46} height={46} fill={TERRAIN_COLOR.floor} />
            <circle cx={23} cy={23} r={12} fill="rgba(8,11,17,0.85)" stroke="var(--rune)" strokeWidth={1.5} />
            <text x={23} y={27.5} className="grid-damage">
              4
            </text>
          </svg>
          <div>
            <strong className="tone-rune">{t.badgeBond}</strong>
            <p>{t.badgeBondText}</p>
          </div>
        </div>

        <div className="legend-item">
          <svg width={46} height={46} viewBox="0 0 46 46" className="sample">
            <rect width={46} height={46} fill={TERRAIN_COLOR.floor} />
            <circle cx={14} cy={14} r={11} fill="rgba(8,11,17,0.9)" stroke="#7f9bc4" strokeWidth={1.2} />
            <text x={14} y={18} className="grid-badge" style={{ fontSize: 12 }}>
              2
            </text>
          </svg>
          <div>
            <strong>{t.badgeShield}</strong>
            <p>{t.badgeShieldText}</p>
          </div>
        </div>

        <div className="legend-item">
          <svg width={46} height={46} viewBox="0 0 46 46" className="sample">
            <rect width={46} height={46} fill={TERRAIN_COLOR.floor} />
            <circle cx={11} cy={34} r={3.6} fill="var(--rune)" />
            <circle cx={21} cy={34} r={3.6} fill="var(--echo)" />
            <circle cx={31} cy={34} r={3.6} fill="#b06fc4" />
          </svg>
          <div>
            <strong>{t.badgeStatusDots}</strong>
            <p>{t.badgeStatusDotsText}</p>
          </div>
        </div>

        <div className="legend-item">
          <svg width={46} height={46} viewBox="0 0 46 46" className="sample">
            <rect width={46} height={46} fill={TERRAIN_COLOR.floor} />
            <rect x={7} y={38} width={32} height={4} rx={2} fill="rgba(0,0,0,0.6)" />
            <rect x={7} y={38} width={19} height={4} rx={2} fill="#6a9955" />
            <rect
              x={1}
              y={1}
              width={44}
              height={44}
              rx={4}
              fill="none"
              stroke="var(--rune)"
              strokeWidth={2}
            />
          </svg>
          <div>
            <strong>{t.badgeHp}</strong>
            <p>{t.badgeHpText}</p>
          </div>
        </div>
      </div>

      <h3>{t.helpStatuses}</h3>
      <table className="help-table">
        <tbody>
          {statusOrder.map((kind) => (
            <tr key={kind}>
              <th>{s(STATUS_NAMES[kind])}</th>
              <td>{s(STATUS_DESCRIPTIONS[kind])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="help-note">{t.helpShieldCapNote}</p>
    </div>
  )
}
