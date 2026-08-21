// The application shell.
//
// One state, one reducer, one save. The shell owns the top bar (week, Gate,
// resources, navigation, language, help) and hands the body to whichever screen
// the expedition says is current.
//
// Saving is automatic after every action, which is the promise the design makes:
// you never lose the evening's work, and there is no reloading to undo a decision.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArchiveView } from './ui/strategic/ArchiveView'
import { bankExpedition, newArchive, purchaseUnlock } from './engine/expedition/archive'
import { canAdvanceWeek, expeditionStep, livingCrew } from './engine/expedition/expedition'
import type { ExpeditionAction } from './engine/expedition/expedition'
import { clearSave, loadGame, parseSave, saveFileName, saveGame, serialiseSave } from './engine/expedition/save'
import { describeExpeditionEvent } from './i18n/describeExpedition'
import { EncounterView, MarketView } from './ui/strategic/EncounterView'
import { HeartView, OverView } from './ui/strategic/EndView'
import { Help } from './ui/Help'
import type { HelpTopic } from './ui/Help'
import { LangProvider, useLang } from './i18n/LangContext'
import { setSoundEnabled, soundEnabled } from './ui/assets'
import { MissionView } from './ui/MissionView'
import { randomSeed } from './engine/rng'
import { RESOURCES, RESOURCE_ORDER } from './content/ship'
import { ResearchView } from './ui/strategic/ResearchView'
import { ShipView } from './ui/strategic/ShipView'
import { ChangeSummary, shotOf, summaryMatters } from './ui/strategic/ChangeSummary'
import type { Shot, Summary, SummaryKind } from './ui/strategic/ChangeSummary'
import { StarMapView } from './ui/strategic/StarMapView'
import { startExpedition } from './engine/expedition/expedition'
import type {
  ArchiveUnlockId,
  ExpeditionLength,
  ExpeditionState,
  GameState,
  Screen,
} from './engine/expedition/types'
import type { Lang } from './engine/types'
import { useEventSounds } from './ui/useEventSounds'

export function App() {
  return (
    <LangProvider>
      <Game />
    </LangProvider>
  )
}

const NAV: { screen: Screen; labelKey: 'shipHeading' | 'starMapHeading' | 'researchHeading' }[] = [
  { screen: 'ship', labelKey: 'shipHeading' },
  { screen: 'starmap', labelKey: 'starMapHeading' },
  { screen: 'research', labelKey: 'researchHeading' },
]

/**
 * The session: the game, plus the way back out of a misclick.
 *
 * The history is deliberately not part of `GameState` and never saved — it
 * belongs to this sitting at the keyboard, not to the expedition — and it only
 * ever holds battle states. See `rewindable` for why only battles.
 */
type Session = {
  game: GameState
  undo: ExpeditionState[]
  /**
   * Where the numbers stood when the current scene opened, for the scenes whose
   * effect arrives in pieces: a market visit is several purchases, an encounter
   * is a choice and sometimes a payment. Their summary is of the whole visit.
   */
  mark: { kind: SummaryKind; shot: Shot } | null
  /** The box waiting to be read, if an event has just finished. */
  summary: Summary | null
}

/** The scene a screen belongs to, for the marks above. */
function sceneOf(screen: Screen): SummaryKind | null {
  if (screen === 'encounter') return 'encounter'
  if (screen === 'market') return 'market'
  return null
}

/**
 * What just happened to the ship's numbers, if it is worth saying out loud.
 *
 * A week and a mission are single steps, so they are their own before and after.
 * An encounter or a market visit is not: the summary for those is opened when the
 * screen is entered and closed when it is left, so buying four things at one post
 * is one account rather than four.
 */
function summaryFor(
  action: ExpeditionAction,
  before: ExpeditionState,
  after: ExpeditionState,
  mark: Session['mark'],
): Summary | null {
  if (action.k === 'advanceWeek') return { kind: 'week', before: shotOf(before), after: shotOf(after) }
  if (action.k === 'missionFinish') return { kind: 'mission', before: shotOf(before), after: shotOf(after) }

  const left = sceneOf(before.screen)
  if (mark && left !== null && sceneOf(after.screen) !== left) {
    return { kind: mark.kind, before: mark.shot, after: shotOf(after) }
  }
  return null
}

/** How far back a battle can be rewound. Longer than any mission needs. */
const UNDO_LIMIT = 200

/** Which battle is on the table, if any. Changes when a mission starts or ends. */
function battleOnTable(state: ExpeditionState): string | null {
  const mission = state.activeMission
  return mission && mission.k === 'battle' ? mission.nodeId : null
}

/**
 * May this action be taken back?
 *
 * Only inside a battle, and the reason is information rather than randomness.
 * Every random draw in the game comes from `seed + rngStep`, and both live in
 * the state — so a rewound action, replayed, gives exactly the same result.
 * There is nothing to fish for by retrying.
 *
 * What an undo *could* give away elsewhere is knowledge: how an encounter turned
 * out, what a puzzle probe revealed. A battle has no such secret — enemy intents
 * are shown before cards are picked and the enemy AI is deterministic — so
 * taking a move back there can only ever undo a slip.
 */
function rewindable(action: ExpeditionAction, before: ExpeditionState, after: ExpeditionState): boolean {
  if (action.k !== 'battleAction') return false
  const battle = battleOnTable(before)
  return battle !== null && battle === battleOnTable(after)
}

function Game() {
  const { t, s, lang, setLang } = useLang()
  const [session, setSession] = useState<Session>(() => ({
    game: loadGame() ?? { archive: newArchive(), expedition: null },
    undo: [],
    mark: null,
    summary: null,
  }))
  const game = session.game

  /**
   * Everything that is not a move in a battle: the history goes, because there
   * is nothing sensible to rewind to across a new expedition, an imported save
   * or a banked result.
   */
  const setGame = useCallback((update: GameState | ((previous: GameState) => GameState)) => {
    setSession((current) => {
      const game = typeof update === 'function' ? update(current.game) : update
      return { game, undo: [], mark: null, summary: null }
    })
  }, [])
  const [showArchive, setShowArchive] = useState(() => !loadGame()?.expedition)
  const [helpOpen, setHelpOpen] = useState(false)
  const [sound, setSound] = useState(() => soundEnabled())
  const downloadRef = useRef<HTMLAnchorElement | null>(null)

  const dispatch = useCallback((action: ExpeditionAction) => {
    setSession((current) => {
      const before = current.game.expedition
      if (!before) return current
      const after = expeditionStep(before, action)
      const entered = sceneOf(after.screen)
      const summary = summaryFor(action, before, after, current.mark)
      return {
        game: { ...current.game, expedition: after },
        undo: rewindable(action, before, after)
          ? [...current.undo, before].slice(-UNDO_LIMIT)
          : [],
        // A scene keeps its mark until it is left; a new one takes a fresh one,
        // and so does a scene that has just had an account rendered inside it —
        // a week ended at a trading post must not be charged to the trading.
        mark:
          entered === null
            ? null
            : current.mark && current.mark.kind === entered && summary === null
              ? current.mark
              : { kind: entered, shot: shotOf(after) },
        summary: summary && summaryMatters(summary) ? summary : current.summary,
      }
    })
  }, [])

  /** One step back in the current battle. */
  const undo = useCallback(() => {
    setSession((current) => {
      const before = current.undo[current.undo.length - 1]
      if (!before) return current
      return {
        ...current,
        game: { ...current.game, expedition: before },
        undo: current.undo.slice(0, -1),
      }
    })
  }, [])

  const canUndo = session.undo.length > 0

  const closeSummary = useCallback(() => {
    setSession((current) => (current.summary ? { ...current, summary: null } : current))
  }, [])

  // Sound follows the log (see ui/useEventSounds.ts) and stays silent unless the
  // audio files have actually been dropped into public/assets/audio.
  useEventSounds(game.expedition)

  const toggleSound = useCallback(() => {
    setSound((on) => {
      setSoundEnabled(!on)
      return !on
    })
  }, [])

  // Automatic saving. There is no reloading to an earlier point — the undo
  // history below is for a misclick in a battle, not for a second attempt at the
  // week — but there is also nothing to lose when the evening ends mid-week.
  useEffect(() => {
    saveGame(game)
  }, [game])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const inField =
        event.target instanceof HTMLElement &&
        (event.target.tagName === 'INPUT' ||
          event.target.tagName === 'SELECT' ||
          event.target.tagName === 'TEXTAREA')
      if (inField) return
      if (event.key === 'F1' || event.key === '?') {
        event.preventDefault()
        setHelpOpen((open) => !open)
      }
      // Ctrl+Z does nothing outside a battle: the history is empty there.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
      if (event.key === 'Escape' || event.key === 'Enter') closeSummary()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSummary, undo])

  const startNew = (length: ExpeditionLength, seed: number | null) => {
    setGame((previous) => ({
      ...previous,
      expedition: startExpedition(seed ?? randomSeed(), length, previous.archive),
    }))
    setShowArchive(false)
  }

  const returnToArchive = () => {
    setGame((previous) => {
      if (!previous.expedition) return { ...previous, expedition: null }
      return { archive: bankExpedition(previous.archive, previous.expedition), expedition: null }
    })
    setShowArchive(true)
  }

  const exportSave = () => {
    const blob = new Blob([serialiseSave(game)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = downloadRef.current
    if (anchor) {
      anchor.href = url
      anchor.download = saveFileName(game)
      anchor.click()
    }
    // Give the browser a moment to start the download before revoking.
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const importSave = (text: string): boolean => {
    const parsed = parseSave(text)
    if (!parsed) return false
    setGame(parsed)
    setShowArchive(!parsed.expedition)
    return true
  }

  const expedition = game.expedition
  const logLines = useMemo(() => {
    if (!expedition) return []
    return [...expedition.log].reverse().slice(0, 60)
  }, [expedition])

  if (!expedition || showArchive) {
    return (
      <div className="app app-archive" data-screen="archive" data-lang={lang}>
        <TopBarSlim
          lang={lang}
          setLang={setLang}
          onHelp={() => setHelpOpen(true)}
          onBack={expedition ? () => setShowArchive(false) : undefined}
          sound={sound}
          onToggleSound={toggleSound}
        />
        <ArchiveView
          archive={game.archive}
          hasRunningExpedition={!!expedition}
          onStart={startNew}
          onContinue={() => setShowArchive(false)}
          onUnlock={(id: ArchiveUnlockId) =>
            setGame((previous) => ({ ...previous, archive: purchaseUnlock(previous.archive, id) }))
          }
          onExport={exportSave}
          onImport={importSave}
          onDeleteSave={() => {
            clearSave()
            setGame({ archive: newArchive(), expedition: null })
          }}
        />
        <a ref={downloadRef} hidden />
        {helpOpen && <Help topic="overview" onClose={() => setHelpOpen(false)} />}
      </div>
    )
  }

  const screen = expedition.screen
  const inMission = screen === 'mission'

  // Surfaced for the smoke test: when a landing mission is waiting for a target
  // the bot has to know, and reading it off the DOM keeps the test independent
  // of any wording.
  const battlePending =
    expedition.activeMission?.k === 'battle'
      ? (expedition.activeMission.battle.pending?.kind ?? '')
      : ''

  // A compact fingerprint of the battle, for the same reason: a mission that
  // stops advancing has to be catchable from outside, and comparing rendered
  // text does not work when a move changes no words at all.
  const battleFingerprint = (() => {
    const mission = expedition.activeMission
    if (mission?.k !== 'battle') return ''
    const b = mission.battle
    const turn = b.heroTurn
    const active = turn?.active
    return [
      b.round,
      b.orderIndex,
      b.phase,
      b.pending?.kind ?? '-',
      turn ? `${turn.heroId}:${turn.topDone ? 1 : 0}${turn.bottomDone ? 1 : 0}:${turn.choices.length}` : '-',
      active
        ? `${active.cardId}/${active.half}#${active.index}:${active.effects[active.index]?.k ?? 'end'}`
        : 'noActive',
      b.pending ? b.pending.options.slice(0, 6).join(',') : '',
      b.units.map((u) => `${u.hp}@${u.pos.x},${u.pos.y}`).join(';'),
    ].join('|')
  })()

  return (
    <div
      className={`app ${inMission ? 'app-mission' : 'app-strategic'}`}
      data-screen={screen}
      data-lang={lang}
      data-week={expedition.week}
      data-pending={battlePending}
      data-battle={battleFingerprint}
      data-outcome={expedition.outcome ? 'over' : ''}
    >
      <header className="topbar">
        <div className="topbar-left">
          <h1>{t.appTitle}</h1>
          <span className="subtitle">
            {t.week} {expedition.week} · {t.gateLeft} {t.gateWeeks(expedition.gateWeeksLeft)}
          </span>
        </div>

        <div className="topbar-middle">
          {RESOURCE_ORDER.map((id) => (
            <div key={id} className="meter meter-tight" title={s(RESOURCES[id].name)}>
              <span className="meter-label">
                {RESOURCES[id].icon} {s(RESOURCES[id].name)}
              </span>
              <span className="meter-value">{expedition.resources[id]}</span>
            </div>
          ))}
          <div className="meter meter-tight">
            <span className="meter-label">☍ {t.crewHeading}</span>
            <span className="meter-value">{livingCrew(expedition).length}</span>
          </div>
          <div className="meter meter-tight meter-flux">
            <span className="meter-label">◈ {t.understanding}</span>
            <span className="meter-value">{expedition.understanding}</span>
          </div>
          {expedition.darkening > 0 && (
            <div className="meter meter-tight meter-danger">
              <span className="meter-label">{t.darkening}</span>
              <span className="meter-value">{t.darkeningLevel(expedition.darkening)}</span>
            </div>
          )}
        </div>

        <div className="topbar-right">
          {!inMission && !expedition.pendingEncounter && (
            <nav className="nav">
              {NAV.map((entry) => (
                <button
                  key={entry.screen}
                  className={`nav-button ${screen === entry.screen ? 'on' : ''}`}
                  data-action="nav"
                  data-screen={entry.screen}
                  onClick={() => dispatch({ k: 'openScreen', screen: entry.screen })}
                >
                  {t[entry.labelKey]}
                </button>
              ))}
            </nav>
          )}

          <div className="lang-switch" title={t.language}>
            {(['hu', 'en'] as Lang[]).map((code) => (
              <button
                key={code}
                className={`lang-button ${lang === code ? 'lang-button-on' : ''}`}
                data-action="setLang"
                data-lang={code}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <SoundButton on={sound} onToggle={toggleSound} />

          <button
            className="button button-help"
            data-action="openHelp"
            onClick={() => setHelpOpen(true)}
            title={t.helpTitle}
            aria-label={t.helpTitle}
          >
            ?
          </button>
        </div>
      </header>

      <main className="body">
        {screen === 'ship' && <ShipView state={expedition} dispatch={dispatch} />}
        {screen === 'starmap' && <StarMapView state={expedition} dispatch={dispatch} />}
        {screen === 'research' && <ResearchView state={expedition} dispatch={dispatch} />}
        {screen === 'crew' && <ShipView state={expedition} dispatch={dispatch} />}
        {screen === 'market' && <MarketView state={expedition} dispatch={dispatch} />}
        {screen === 'encounter' && <EncounterView state={expedition} dispatch={dispatch} />}
        {screen === 'mission' && (
          <MissionView state={expedition} dispatch={dispatch} canUndo={canUndo} onUndo={undo} />
        )}
        {screen === 'heart' && <HeartView state={expedition} dispatch={dispatch} />}
        {screen === 'over' && <OverView state={expedition} onReturn={returnToArchive} />}
      </main>

      {!inMission && screen !== 'over' && (
        <footer className="weekbar">
          <button
            className="button button-primary"
            data-action="endWeek"
            disabled={!canAdvanceWeek(expedition)}
            onClick={() => dispatch({ k: 'advanceWeek' })}
            title={canAdvanceWeek(expedition) ? undefined : t.endWeekBlocked}
          >
            {t.endWeek}
          </button>

          <div className="weeklog">
            {logLines.slice(0, 4).map((entry, i) => (
              <span key={i} className={`weeklog-line ${i === 0 ? 'fresh' : ''}`}>
                {describeExpeditionEvent(entry.event, lang)}
              </span>
            ))}
          </div>

          <button
            className="button"
            data-action="abandon"
            onClick={() => {
              if (window.confirm(t.abandonConfirm)) dispatch({ k: 'abandon' })
            }}
          >
            {t.abandonExpedition}
          </button>
        </footer>
      )}

      {!inMission && (
        <aside className="logpanel">
          <h3>{t.logHeading}</h3>
          <div className="log">
            {logLines.map((entry, i) => (
              <div key={i} className="log-line">
                <span className="log-round">{entry.week}.</span>{' '}
                {describeExpeditionEvent(entry.event, lang)}
              </div>
            ))}
          </div>
        </aside>
      )}

      <a ref={downloadRef} hidden />
      {helpOpen && <Help topic={helpTopicFor(screen)} onClose={() => setHelpOpen(false)} />}
      {session.summary && <ChangeSummary summary={session.summary} onClose={closeSummary} />}
    </div>
  )
}

/** Which chapter of the rules is most useful from this screen. */
function helpTopicFor(screen: Screen): HelpTopic {
  switch (screen) {
    case 'starmap':
      return 'starmap'
    case 'mission':
      return 'mission'
    case 'heart':
    case 'over':
      return 'ending'
    default:
      return 'strategic'
  }
}

function TopBarSlim({
  lang,
  setLang,
  onHelp,
  onBack,
  sound,
  onToggleSound,
}: {
  lang: Lang
  setLang: (lang: Lang) => void
  onHelp: () => void
  onBack?: () => void
  sound: boolean
  onToggleSound: () => void
}) {
  const { t } = useLang()
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{t.appTitle}</h1>
        <span className="subtitle">{t.appSubtitle}</span>
      </div>
      <div className="topbar-right">
        {onBack && (
          <button className="button" data-action="backToExpedition" onClick={onBack}>
            {t.back}
          </button>
        )}
        <div className="lang-switch" title={t.language}>
          {(['hu', 'en'] as Lang[]).map((code) => (
            <button
              key={code}
              className={`lang-button ${lang === code ? 'lang-button-on' : ''}`}
              data-action="setLang"
              data-lang={code}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <SoundButton on={sound} onToggle={onToggleSound} />
        <button
          className="button button-help"
          data-action="openHelp"
          onClick={onHelp}
          title={t.helpTitle}
          aria-label={t.helpTitle}
        >
          ?
        </button>
      </div>
    </header>
  )
}

/**
 * The only interface the sound layer needs: a switch.
 *
 * The glyph never changes — a struck-through note renders as a box in half the
 * fonts out there — so "off" is carried by the dimming and by the label.
 *
 * It is shown even when no audio files are present, because the player is the
 * one who decides whether to add them — and a switch that appears the moment
 * you drop in a file would be stranger than one that is always there.
 */
function SoundButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const { t } = useLang()
  return (
    <button
      className={`button button-sound ${on ? '' : 'button-muted'}`}
      data-action="toggleSound"
      data-sound={on ? 'on' : 'off'}
      onClick={onToggle}
      title={t.soundTitle}
      aria-label={on ? t.soundOn : t.soundOff}
    >
      {'♪'}
    </button>
  )
}
