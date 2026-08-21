// The title screen and the Archive.
//
// Between expeditions this is the whole game: what you learned last time, what it
// unlocked, and how long the next road should be. The Archive is the reason a
// failed run is not wasted.

import { useRef, useState } from 'react'
import {
  canUnlock,
  ENDINGS_BEFORE_LAST,
  ENDING_TITLES,
  offeredUnlocks,
} from '../../engine/expedition/archive'
import { LENGTHS } from '../../engine/expedition/starmap'
import { useLang } from '../../i18n/LangContext'
import type { ArchiveState, ArchiveUnlockId, ExpeditionLength } from '../../engine/expedition/types'

/**
 * Which understanding tier each ending needs. Mirrors `availableEndings`, and is
 * here rather than in the engine because it exists only to be *shown* — the
 * engine decides, this explains.
 */
const ENDING_TIER: Record<(typeof ENDINGS_BEFORE_LAST)[number], number> = {
  flee: 0,
  blindRuin: 0,
  witness: 1,
  intervene: 2,
  communion: 3,
}

export function ArchiveView({
  archive,
  hasRunningExpedition,
  onStart,
  onContinue,
  onUnlock,
  onExport,
  onImport,
  onDeleteSave,
}: {
  archive: ArchiveState
  hasRunningExpedition: boolean
  onStart: (length: ExpeditionLength, seed: number | null) => void
  onContinue: () => void
  onUnlock: (id: ArchiveUnlockId) => void
  onExport: () => void
  onImport: (text: string) => boolean
  onDeleteSave: () => void
}) {
  const { t, s } = useLang()
  const [length, setLength] = useState<ExpeditionLength>('medium')
  const [seedText, setSeedText] = useState('')
  const [importError, setImportError] = useState(false)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const lengthLabel: Record<ExpeditionLength, string> = {
    short: t.lengthShort,
    medium: t.lengthMedium,
    long: t.lengthLong,
  }
  const lengthText: Record<ExpeditionLength, string> = {
    short: t.lengthShortText,
    medium: t.lengthMediumText,
    long: t.lengthLongText,
  }

  return (
    <div className="archive-screen">
      <header className="title-block">
        <h1>{t.appTitle}</h1>
        <p className="title-tagline">{t.titleTagline}</p>
      </header>

      <section className="panel launch-panel">
        <header className="panel-head">
          <h2>{t.newExpedition}</h2>
        </header>

        <div className="length-choices">
          {(['short', 'medium', 'long'] as const).map((option) => (
            <button
              key={option}
              className={`length-card ${length === option ? 'on' : ''}`}
              data-action="setLength"
              data-length={option}
              onClick={() => setLength(option)}
            >
              <strong>{lengthLabel[option]}</strong>
              <span>{lengthText[option]}</span>
              <span className="length-meta">
                {LENGTHS[option].columns} · {LENGTHS[option].weeks} {t.historyWeek}
              </span>
            </button>
          ))}
        </div>

        <div className="launch-row">
          <label className="setting">
            {t.seed}
            <input
              type="text"
              data-action="seed"
              value={seedText}
              onChange={(event) => setSeedText(event.target.value)}
              size={10}
            />
          </label>
          <button
            className="button button-primary"
            data-action="launchExpedition"
            onClick={() => {
              const parsed = seedText.trim() ? Number(seedText.trim()) : null
              onStart(length, parsed !== null && Number.isFinite(parsed) ? parsed : null)
            }}
          >
            {t.launch}
          </button>
          {hasRunningExpedition && (
            <button className="button" data-action="continueExpedition" onClick={onContinue}>
              {t.continueExpedition}
            </button>
          )}
        </div>
        <p className="panel-meta">{t.seedHint}</p>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>{t.archiveHeading}</h2>
          <span className="panel-meta">
            {t.archivePoints}: {archive.points} · {t.expeditionsRun}: {archive.expeditionsRun} ·{' '}
            {t.bestUnderstanding}: {archive.bestUnderstanding}
          </span>
        </header>
        <p className="panel-intro">{t.archiveIntro}</p>

        <h3>{t.endingsHeading}</h3>
        <p className="panel-meta">
          {archive.completed
            ? t.endingsDone
            : t.endingsProgress(
                ENDINGS_BEFORE_LAST.filter((id) => archive.endingsSeen.includes(id)).length,
                ENDINGS_BEFORE_LAST.length,
              )}
        </p>
        <ul className="endings">
          {ENDINGS_BEFORE_LAST.map((id) => {
            const seen = archive.endingsSeen.includes(id)
            return (
              <li key={id} className={`endings-row ${seen ? 'endings-seen' : ''}`} data-ending={id}>
                <span className="endings-mark">{seen ? '◆' : '◇'}</span>
                <span className="endings-name">{seen ? s(ENDING_TITLES[id]) : t.endingUnseen}</span>
                <span className="endings-need">{t.endingNeed(ENDING_TIER[id])}</span>
              </li>
            )
          })}
          {/* The sixth is not a slot to fill in but the thing the other five are
              for, so it is only named once it can be aimed at. */}
          {(archive.unlocked.includes('last-question') || archive.completed) && (
            <li
              className={`endings-row endings-final ${archive.completed ? 'endings-seen' : ''}`}
              data-ending="theAnswer"
            >
              <span className="endings-mark">{archive.completed ? '✦' : '◇'}</span>
              <span className="endings-name">
                {archive.completed ? s(ENDING_TITLES.theAnswer) : t.endingLastQuestion}
              </span>
              <span className="endings-need">{t.endingNeed(3)}</span>
            </li>
          )}
        </ul>

        <h3>{t.unlockHeading}</h3>
        <div className="unlock-list">
          {offeredUnlocks(archive).map((unlock) => {
            const owned = archive.unlocked.includes(unlock.id)
            const affordable = canUnlock(archive, unlock.id)
            return (
              <div key={unlock.id} className={`unlock ${owned ? 'unlock-owned' : ''}`}>
                <div className="unlock-text">
                  <strong>{s(unlock.name)}</strong>
                  <span>{s(unlock.description)}</span>
                </div>
                <span className="unlock-cost">
                  {t.unlockCost}: {unlock.cost}
                </span>
                <button
                  className="button button-small"
                  data-action="unlock"
                  data-unlock={unlock.id}
                  disabled={owned || !affordable}
                  onClick={() => onUnlock(unlock.id)}
                >
                  {owned ? t.unlockOwned : t.unlockBuy}
                </button>
              </div>
            )
          })}
        </div>

        {archive.history.length > 0 && (
          <>
            <h3>{t.historyHeading}</h3>
            <ul className="history-list">
              {[...archive.history].reverse().map((entry, i) => (
                <li key={i}>
                  {entry.week} {t.historyWeek} · {t.understanding} {entry.understanding} ·{' '}
                  <code>{entry.outcome}</code>
                  {/* Older archives have entries from before seeds were kept. */}
                  {entry.seed !== undefined && (
                    <>
                      {' · '}
                      <button
                        type="button"
                        className="seed-recall"
                        data-action="recallSeed"
                        title={t.seedReuse(entry.seed)}
                        onClick={() => setSeedText(String(entry.seed))}
                      >
                        {t.seed} {entry.seed}
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <div className="button-row">
          <button className="button" data-action="exportSave" onClick={onExport}>
            {t.exportSave}
          </button>
          <button
            className="button"
            data-action="importSave"
            onClick={() => fileInput.current?.click()}
          >
            {t.importSave}
          </button>
          <button
            className="button"
            data-action="deleteSave"
            onClick={() => {
              if (window.confirm(t.deleteSaveConfirm)) onDeleteSave()
            }}
          >
            {t.deleteSave}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const text = await file.text()
              setImportError(!onImport(text))
              event.target.value = ''
            }}
          />
        </div>
        {importError && <p className="warning">{t.importFailed}</p>}
      </section>
    </div>
  )
}
