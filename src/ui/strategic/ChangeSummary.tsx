// What that just cost, and what it was worth.
//
// The log is the honest record and it says all of this already — but a line of
// text scrolling past in a side panel is easy to miss, and after a battle or a
// week of travel there are usually four or five numbers that moved at once. So
// when an event finishes, the deltas are put on the screen once, in a box that
// has to be dismissed.
//
// It is built by comparing two snapshots rather than by reading the log, which
// means it cannot disagree with the actual state: whatever the ship has now
// minus whatever it had before the event.

import { RESOURCES, RESOURCE_ORDER } from '../../content/ship'
import { useLang } from '../../i18n/LangContext'
import type { ExpeditionState } from '../../engine/expedition/types'
import type { ResourceId } from '../../content/ship'
import type { UiKey } from '../../i18n/ui'

/** Everything the summary can talk about, as it stands at one moment. */
export type Shot = {
  resources: Record<ResourceId, number>
  understanding: number
  crew: number
  archive: number
  week: number
  gateWeeksLeft: number
}

export function shotOf(state: ExpeditionState): Shot {
  return {
    resources: { ...state.resources },
    understanding: state.understanding,
    crew: state.crew.length,
    archive: state.archiveEarned,
    week: state.week,
    gateWeeksLeft: state.gateWeeksLeft,
  }
}

/** Which event has just finished. Decides the heading, nothing else. */
export type SummaryKind = 'week' | 'mission' | 'encounter' | 'market'

export type Summary = { kind: SummaryKind; before: Shot; after: Shot }

const HEADING: Record<SummaryKind, UiKey> = {
  week: 'summaryWeek',
  mission: 'summaryMission',
  encounter: 'summaryEncounter',
  market: 'summaryMarket',
}

type Row = {
  key: string
  icon: string
  label: string
  delta: number
  value: number
  /** Understanding is the thing the whole expedition is for, so it reads apart. */
  tone: 'gain' | 'loss' | 'echo'
}

function rowsOf(summary: Summary, label: (key: UiKey) => string, name: (id: ResourceId) => string): Row[] {
  const { before, after } = summary
  const rows: Row[] = []

  for (const id of RESOURCE_ORDER) {
    const delta = after.resources[id] - before.resources[id]
    if (delta === 0) continue
    rows.push({
      key: id,
      icon: RESOURCES[id].icon,
      label: name(id),
      delta,
      value: after.resources[id],
      tone: delta > 0 ? 'gain' : 'loss',
    })
  }

  const extras: { key: string; icon: string; labelKey: UiKey; delta: number; value: number; tone: Row['tone'] }[] = [
    {
      key: 'understanding',
      icon: '◆',
      labelKey: 'understanding',
      delta: after.understanding - before.understanding,
      value: after.understanding,
      tone: 'echo',
    },
    {
      key: 'crew',
      icon: '☗',
      labelKey: 'crewHeading',
      delta: after.crew - before.crew,
      value: after.crew,
      tone: after.crew >= before.crew ? 'gain' : 'loss',
    },
    {
      key: 'archive',
      icon: '✦',
      labelKey: 'archivePoints',
      delta: after.archive - before.archive,
      value: after.archive,
      tone: 'gain',
    },
  ]
  for (const extra of extras) {
    if (extra.delta === 0) continue
    rows.push({ ...extra, label: label(extra.labelKey) })
  }

  return rows
}

/** Nothing moved? Then there is nothing worth interrupting anybody for. */
export function summaryMatters(summary: Summary): boolean {
  const { before, after } = summary
  if (before.understanding !== after.understanding) return true
  if (before.crew !== after.crew) return true
  if (before.archive !== after.archive) return true
  return RESOURCE_ORDER.some((id) => before.resources[id] !== after.resources[id])
}

export function ChangeSummary({ summary, onClose }: { summary: Summary; onClose: () => void }) {
  const { t, s } = useLang()
  const label = (key: UiKey) => t[key] as string
  const rows = rowsOf(summary, label, (id) => s(RESOURCES[id].name))
  const weeks = summary.after.week - summary.before.week

  return (
    <div className="summary-veil" data-summary={summary.kind} onClick={onClose}>
      <div
        className="summary"
        role="dialog"
        aria-modal
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{t[HEADING[summary.kind]] as string}</h2>
        <p className="summary-sub">
          {weeks > 0 ? `${t.summaryWeeksPassed(weeks)} · ` : ''}
          {t.summaryGateLeft(summary.after.gateWeeksLeft)}
        </p>

        <ul className="summary-rows">
          {rows.map((row) => (
            <li key={row.key} className={`summary-row tone-${row.tone}`}>
              <span className="summary-icon">{row.icon}</span>
              <span className="summary-name">{row.label}</span>
              <span className="summary-delta">
                {row.delta > 0 ? '+' : '−'}
                {Math.abs(row.delta)}
              </span>
              <span className="summary-value">{row.value}</span>
            </li>
          ))}
        </ul>

        <div className="button-row">
          <button className="button button-primary" data-action="closeSummary" onClick={onClose}>
            {t.summaryClose}
          </button>
        </div>
      </div>
    </div>
  )
}
