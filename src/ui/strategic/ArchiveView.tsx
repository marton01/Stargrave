// The title screen and the Archive.
//
// Between expeditions this is the whole game: what you learned last time, what it
// unlocked, and how long the next road should be. The Archive is the reason a
// failed run is not wasted.

import { useRef, useState } from 'react'
import {
  canUnlock,
  EARNED_ENDINGS,
  ENDINGS_BEFORE_LAST,
  ENDING_TEXTS,
  ENDING_TITLES,
  offeredUnlocks,
} from '../../engine/expedition/archive'
import { LENGTHS } from '../../engine/expedition/starmap'
import { buildLabel } from '../../version'
import { useLang } from '../../i18n/LangContext'
import { HERO_CLASSES } from '../../content/heroes'
import { HERO_ORDER, partyForSeats } from '../../engine/expedition/expedition'
import type { HeroClassId } from '../../engine/types'
import {
  GAME_MODES,
  assignHero,
  formatRoomCode,
  normaliseRoomCode,
  parseRoomCode,
  seatsAllowed,
} from '../../engine/session/room'
import type { GameMode } from '../../engine/session/room'
import type { RoomRecord } from '../../engine/expedition/save'
import type {
  ArchiveState,
  ArchiveUnlockId,
  EndingId,
  ExpeditionLength,
} from '../../engine/expedition/types'

const MODE_NAME: Record<GameMode, 'modeSolo' | 'modeLocal' | 'modeOnline'> = {
  solo: 'modeSolo',
  local: 'modeLocal',
  online: 'modeOnline',
}
const MODE_TEXT: Record<GameMode, 'modeSoloText' | 'modeLocalText' | 'modeOnlineText'> = {
  solo: 'modeSoloText',
  local: 'modeLocalText',
  online: 'modeOnlineText',
}

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
  onJoin,
  rooms,
  onContinue,
  onUnlock,
  onExport,
  onImport,
  onDeleteSave,
}: {
  archive: ArchiveState
  hasRunningExpedition: boolean
  onStart: (
    length: ExpeditionLength,
    seed: number | null,
    mode: GameMode,
    players: number,
    party: HeroClassId[],
  ) => void
  onJoin: (code: string) => void
  rooms: RoomRecord[]
  onContinue: () => void
  onUnlock: (id: ArchiveUnlockId) => void
  onExport: () => void
  onImport: (text: string) => boolean
  onDeleteSave: () => void
}) {
  const { t, s } = useLang()
  // Which ending is open for reading. Only one at a time, so the list stays a list.
  const [openEnding, setOpenEnding] = useState<EndingId | null>(null)
  const [length, setLength] = useState<ExpeditionLength>('medium')
  // How this table is going to play. Solo and local are the game as it was;
  // online opens a room whose code the others type in.
  const [mode, setMode] = useState<GameMode>('local')
  const [players, setPlayers] = useState(2)
  // Who plays whom, before there is a room to decide it in. Picking somebody
  // else's hero trades with them, so the list can never hold two of anybody.
  const [party, setParty] = useState<HeroClassId[]>(() => partyForSeats(2))
  const [joinText, setJoinText] = useState('')
  const [joinError, setJoinError] = useState(false)
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
        {/* Which build this is.
         *
         * Small, and in the one place everybody passes through. It answers the
         * question that cannot be answered from a screenshot — "are you actually
         * running the fix?" — and it is the cache check: the bundle carries a
         * content hash so a stale bundle is impossible, but a stale `index.html`
         * pointing at an old one is not, and it shows up here as an old date. */}
        <p className="build-stamp" title={t.buildTitle}>
          {t.buildLabel} <span>{buildLabel()}</span>
        </p>
      </header>

      <section className="panel launch-panel">
        <header className="panel-head">
          <h2>{t.newExpedition}</h2>
        </header>

        <div className="mode-choices">
          {GAME_MODES.map((option) => (
            <button
              key={option}
              className={`mode-card ${mode === option ? 'on' : ''}`}
              data-action="setMode"
              data-mode={option}
              onClick={() => {
                setMode(option)
                // Solo seats one; the others start at two.
                const seats = option === 'solo' ? 1 : Math.max(2, players)
                setPlayers(seats)
                setParty(partyForSeats(seats))
              }}
            >
              <strong>{t[MODE_NAME[option]] as string}</strong>
              <span>{t[MODE_TEXT[option]] as string}</span>
            </button>
          ))}
        </div>

        {mode !== 'solo' && (
          <div className="player-choices">
            <span className="setting-label">{t.playersHeading}</span>
            {seatsAllowed(mode).map((count) => (
              <button
                key={count}
                className={`button button-small ${players === count ? 'button-primary' : ''}`}
                data-action="setPlayers"
                data-players={count}
                onClick={() => {
                  setPlayers(count)
                  setParty(partyForSeats(count))
                }}
              >
                {t.playersCount(count)}
              </button>
            ))}
            <span className="muted">{t.playersHint(players)}</span>
          </div>
        )}

        {mode !== 'online' && (
          <div className="party-choices">
            <span className="setting-label">{t.partyHeading}</span>
            {party.map((heroClass, i) => (
              <select
                key={i}
                className="seat-hero"
                data-action="pickHero"
                data-seat={i + 1}
                value={heroClass}
                onChange={(event) =>
                  setParty(assignHero(party, i, event.target.value as HeroClassId))
                }
              >
                {HERO_ORDER.map((id) => (
                  <option key={id} value={id}>
                    {s(HERO_CLASSES[id].name)}
                  </option>
                ))}
              </select>
            ))}
            <span className="muted">{t.partyHint}</span>
          </div>
        )}

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
              onStart(
                length,
                parsed !== null && Number.isFinite(parsed) ? parsed : null,
                mode,
                players,
                party,
              )
            }}
          >
            {mode === 'online' ? t.launchRoom : t.launch}
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
          <h2>{t.joinHeading}</h2>
        </header>
        <p className="panel-intro">{t.joinIntro}</p>
        <div className="launch-row">
          <label className="setting">
            {t.roomCode}
            <input
              type="text"
              data-action="roomCode"
              value={joinText}
              placeholder="XXXX-XXXX"
              onChange={(event) => {
                setJoinText(event.target.value)
                setJoinError(false)
              }}
              size={12}
            />
          </label>
          <button
            className="button button-primary"
            data-action="joinRoom"
            onClick={() => {
              if (parseRoomCode(joinText)) onJoin(normaliseRoomCode(joinText))
              else setJoinError(true)
            }}
          >
            {t.joinRoom}
          </button>
          {joinError && <span className="bad">{t.joinBadCode}</span>}
        </div>

        {rooms.length > 0 && (
          <div className="room-list">
            <h3>{t.roomsKnown}</h3>
            {rooms.map((record) => (
              <div key={record.code} className="room-row">
                <strong>{formatRoomCode(record.code)}</strong>
                <span className="muted">
                  {t.roomRowMeta(record.players, record.week)}
                </span>
                <button
                  className="button button-small"
                  data-action="rejoinRoom"
                  data-room={record.code}
                  onClick={() => onJoin(record.code)}
                >
                  {t.roomRejoin}
                </button>
              </div>
            ))}
          </div>
        )}
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
          {ENDINGS_BEFORE_LAST.map((id) => (
            <EndingRow
              key={id}
              id={id}
              seen={archive.endingsSeen.includes(id)}
              need={t.endingNeed(ENDING_TIER[id])}
              open={openEnding === id}
              onToggle={() => setOpenEnding(openEnding === id ? null : id)}
            />
          ))}
          {/* The sixth is not a slot to fill in but the thing the other five are
              for, so it is only named once it can be aimed at. */}
          {(archive.unlocked.includes('last-question') || archive.completed) && (
            <EndingRow
              id="theAnswer"
              seen={archive.completed === true}
              final
              unseenName={t.endingLastQuestion}
              need={t.endingNeed(3)}
              open={openEnding === 'theAnswer'}
              onToggle={() => setOpenEnding(openEnding === 'theAnswer' ? null : 'theAnswer')}
            />
          )}
        </ul>

        <h3>{t.endingsEarnedHeading}</h3>
        <p className="panel-meta">{t.endingsEarnedIntro}</p>
        <ul className="endings">
          {EARNED_ENDINGS.map(({ id, condition }) => (
            <EndingRow
              key={id}
              id={id}
              seen={archive.endingsSeen.includes(id)}
              need={s(condition)}
              // These are named even before they are reached: the condition is the
              // point of them, and an ending nobody can see the door to might as
              // well not exist.
              nameWhenUnseen
              open={openEnding === id}
              onToggle={() => setOpenEnding(openEnding === id ? null : id)}
            />
          ))}
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

/**
 * One line of the endings list, and the ending itself when it is opened.
 *
 * The Archive used to name what you had seen and never show it again — so the
 * text of an ending existed for exactly one screen, at the end of the expedition
 * that earned it, and then only in memory. Reading them side by side is most of
 * what the Archive is for: the last question is literally "what do these five
 * answers add up to", and you cannot answer that from titles.
 *
 * Unseen endings stay closed. The point of them is to be found.
 */
function EndingRow({
  id,
  seen,
  need,
  open,
  onToggle,
  final,
  nameWhenUnseen,
  unseenName,
}: {
  id: EndingId
  seen: boolean
  need: string
  open: boolean
  onToggle: () => void
  final?: boolean
  nameWhenUnseen?: boolean
  unseenName?: string
}) {
  const { t, s } = useLang()
  const name = seen || nameWhenUnseen ? s(ENDING_TITLES[id]) : (unseenName ?? t.endingUnseen)

  return (
    <li
      className={`endings-row ${seen ? 'endings-seen' : ''} ${final ? 'endings-final' : ''}`}
      data-ending={id}
    >
      <span className="endings-mark">{seen ? (final ? '✦' : '◆') : '◇'}</span>
      {seen ? (
        <button
          className="endings-name endings-open"
          data-action="readEnding"
          data-ending={id}
          aria-expanded={open}
          onClick={onToggle}
        >
          {name} <span className="endings-caret">{open ? '▾' : '▸'}</span>
        </button>
      ) : (
        <span className="endings-name">{name}</span>
      )}
      <span className="endings-need">{need}</span>
      {open && seen && <p className="endings-text">{s(ENDING_TEXTS[id])}</p>}
    </li>
  )
}
