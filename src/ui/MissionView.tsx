// A mission in progress: a battle on the tactical grid, or a puzzle on a panel.
//
// Both come back to the ship the same way, through one button, so the expedition
// layer never has to care which kind it was.

import { useState } from 'react'
import { RESOURCES } from '../content/ship'
import { SUPPORT_DEFS } from '../content/support'
import { seatOfHero, supportAvailable } from '../engine/expedition/expedition'
import { ActionBar } from './ActionBar'
import { activeUnit, atExit } from '../engine/battle'
import { predictDamage } from '../engine/combat'
import { Grid } from './Grid'
import { PuzzleView } from './puzzles/PuzzleView'
import { Sidebar } from './Sidebar'
import { missionSettled } from '../engine/expedition/expedition'
import type { ExpeditionAction } from '../engine/expedition/expedition'
import { useLang } from '../i18n/LangContext'
import { TaskView } from './TaskView'
import { siteName } from '../i18n/describe'
import type { RoomState } from '../engine/session/room'
import type { ExpeditionState } from '../engine/expedition/types'
import { TERRAIN_TEXT } from './gridStyle'
import type { BattleState, Objective, TerrainKind } from '../engine/types'

export function objectiveText(objective: Objective, t: ReturnType<typeof useLang>['t']): string {
  switch (objective.k) {
    case 'eliminate':
      return t.objectiveEliminate
    case 'reachExit':
      return t.objectiveReachExit
    case 'collect':
      return t.objectiveCollect(objective.count)
    case 'survive':
      return t.objectiveSurvive(objective.rounds)
    case 'hold':
      return t.objectiveHold(objective.rounds)
  }
}

/**
 * The terrain palette: which ground the next click puts down.
 *
 * A repair tool, and it says so — it is reached from the "stuck?" panel and it
 * stays visible with a way out of it, so nobody edits a board by accident. Every
 * change is an ordinary battle action, so Ctrl+Z takes it back.
 */
function TerrainPalette({
  kind,
  onPick,
  onClose,
}: {
  kind: TerrainKind
  onPick: (kind: TerrainKind) => void
  onClose: () => void
}) {
  const { t } = useLang()
  const kinds: TerrainKind[] = ['floor', 'ash', 'wall', 'chasm', 'pillar']

  return (
    <div className="palette">
      <span className="palette-label">{t.paletteLabel}</span>
      {kinds.map((option) => (
        <button
          key={option}
          className={`button button-small ${option === kind ? 'button-on' : ''}`}
          data-action="pickTerrain"
          data-terrain={option}
          onClick={() => onPick(option)}
        >
          {t[TERRAIN_TEXT[option].name] as string}
        </button>
      ))}
      <span className="palette-hint">{t.paletteHint}</span>
      <button className="button button-small" data-action="closePalette" onClick={onClose}>
        {t.paletteDone}
      </button>
    </div>
  )
}

/**
 * The way out of a landing that cannot be finished.
 *
 * Deliberately quiet — a small button in the corner, not an option in the flow —
 * because it is for a broken board, not for a hard one. Each choice is asked for
 * twice, and each says what it keeps and what it redeals, so nobody rerolls a
 * battlefield by accident while reaching for the undo.
 */
type RescueKey = 'restart' | 'reroll' | 'withdraw' | 'win' | 'lose' | 'skip'

function Rescue({
  dispatch,
  onEdit,
}: {
  dispatch: (action: ExpeditionAction) => void
  onEdit: () => void
}) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState<RescueKey | null>(null)

  const options: { key: RescueKey; label: string; text: string; action: ExpeditionAction }[] = [
    {
      key: 'restart',
      label: t.rescueRestart,
      text: t.rescueRestartText,
      action: { k: 'restartBattle' },
    },
    {
      key: 'reroll',
      label: t.rescueReroll,
      text: t.rescueRerollText,
      action: { k: 'rerollBattle' },
    },
    {
      key: 'withdraw',
      label: t.rescueWithdraw,
      text: t.rescueWithdrawText,
      action: { k: 'withdrawBeforeLanding' },
    },
    {
      key: 'win',
      label: t.rescueWin,
      text: t.rescueWinText,
      action: { k: 'settleBattle', as: 'victory' },
    },
    {
      key: 'lose',
      label: t.rescueLose,
      text: t.rescueLoseText,
      action: { k: 'settleBattle', as: 'defeat' },
    },
    {
      key: 'skip',
      label: t.rescueSkip,
      text: t.rescueSkipText,
      action: { k: 'settleBattle', as: 'skip' },
    },
  ]

  // A modal rather than a panel in the bar: opening it must not resize the board
  // underneath, which is the thing you are trying to look at.
  return (
    <>
      <button className="button button-small rescue-open" data-action="openRescue" onClick={() => setOpen(true)}>
        {t.rescueStuck}
      </button>
      {open && <div className="rescue-veil" onClick={() => setOpen(false)}>{panel()}</div>}
    </>
  )

  function panel() {
    return (
      <div className="rescue" onClick={(event) => event.stopPropagation()}>
        <p className="rescue-intro">{t.rescueIntro}</p>
        {/* The fourth way out, and the only one that keeps the battle: change the
          ground itself. It is not an action to confirm but a tool to pick up, so
          it sits apart from the three. */}
      <div className="rescue-option">
        <div className="rescue-text">
          <strong>{t.rescueEdit}</strong>
          <span>{t.rescueEditText}</span>
        </div>
        <button
          className="button button-small"
          data-action="rescue-edit"
          onClick={() => {
            onEdit()
            setOpen(false)
          }}
        >
          {t.rescueChoose}
        </button>
      </div>

      {options.map((option) => (
        <div key={option.key} className="rescue-option">
          <div className="rescue-text">
            <strong>{option.label}</strong>
            <span>{option.text}</span>
          </div>
          {confirming === option.key ? (
            <span className="rescue-buttons">
              <button
                className="button button-small button-primary"
                data-action={`rescue-${option.key}`}
                onClick={() => {
                  dispatch(option.action)
                  setConfirming(null)
                  setOpen(false)
                }}
              >
                {t.rescueConfirm}
              </button>
              <button className="button button-small" onClick={() => setConfirming(null)}>
                {t.encounterBack}
              </button>
            </span>
          ) : (
            <button
              className="button button-small"
              data-action={`rescue-pick-${option.key}`}
              onClick={() => setConfirming(option.key)}
            >
              {t.rescueChoose}
            </button>
          )}
        </div>
        ))}
        <button className="button button-small rescue-close" data-action="closeRescue" onClick={() => setOpen(false)}>
          {t.close}
        </button>
        </div>
    )
  }
}

/**
 * The objective read-out that sits above the grid — and the undo button.
 *
 * The button lives here rather than in the action bar because the action bar is
 * a different shape in every phase of a turn (picking cards, assigning halves,
 * clicking a target), and a way back out of a misclick has to be in the same
 * place in all of them.
 */
function ObjectiveBar({
  battle,
  canUndo,
  onUndo,
  rescue,
}: {
  battle: BattleState
  canUndo: boolean
  onUndo: () => void
  rescue: React.ReactNode
}) {
  const { t, lang } = useLang()
  const parts: string[] = [objectiveText(battle.objective, t)]

  if (battle.objective.k === 'collect') {
    parts.push(t.relicsCarried(battle.carried, battle.objective.count))
  }
  // Who is out and who is not: without this, a mission that will not end because
  // one hero is three tiles from the exit looks like a bug.
  if (battle.objective.k === 'reachExit' || battle.objective.k === 'collect') {
    const { there, total } = atExit(battle)
    parts.push(t.atExitCount(there, total))
  }
  if (battle.roundLimit !== null) {
    parts.push(t.roundLimitLeft(Math.max(0, battle.roundLimit - battle.round)))
  }
  // What the ground is about to do. The enemies announce their intent a round
  // ahead; the site gets the same courtesy, or it is a surprise rather than a
  // problem to plan around.
  const coming = battle.site?.find((event) => event.at >= battle.round)
  if (coming) {
    parts.push(
      coming.at === battle.round
        ? t.siteNow(siteName(coming.kind, lang))
        : t.siteIn(siteName(coming.kind, lang), coming.at - battle.round),
    )
  }
  if (battle.collapsing.length > 0) {
    parts.push(t.collapsingWarning(battle.collapsing.length))
  }

  return (
    <div className="objective-bar">
      <span className="objective-label">{t.objectiveLabel}</span>
      <span className="objective-text">{parts.join(' · ')}</span>
      <button
        className="button button-small undo-button"
        data-action="undo"
        disabled={!canUndo}
        title={t.undoTitle}
        onClick={onUndo}
      >
        {t.undo}
      </button>
      {rescue}
    </div>
  )
}

export function MissionView({
  state,
  dispatch,
  canUndo,
  onUndo,
  room,
  mySeats,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
  canUndo: boolean
  onUndo: () => void
  /** The table, when there is one: whose seat is whose. */
  room: RoomState | null
  /** Which seats this machine plays. Every seat, at one keyboard. */
  mySeats: number[]
}) {
  const { t, s } = useLang()
  const mission = state.activeMission
  // The hand can be folded away to give the board the screen. The height is what
  // limits the board — it scales to fit its box — so this is the one thing that
  // actually makes the battlefield bigger.
  const [handOpen, setHandOpen] = useState(true)
  // Which ground the repair tool is holding, or null when it is put away.
  const [editKind, setEditKind] = useState<TerrainKind | null>(null)
  if (!mission) return null
  const settled = missionSettled(state)

  if (mission.k === 'task') {
    return (
      <TaskView
        task={mission.task}
        room={room}
        mine={mySeats}
        briefing={mission.briefing}
        onPress={(rune) => dispatch({ k: 'taskPress', rune })}
        onFinish={() => dispatch({ k: 'missionFinish' })}
      />
    )
  }

  if (mission.k === 'puzzle') {
    return (
      <div className="mission mission-puzzle">
        <header className="panel-head">
          <h2>{t.puzzleHeading}</h2>
          <span className="panel-meta">{s(mission.briefing)}</span>
        </header>
        <PuzzleView
          puzzle={mission.puzzle}
          onMove={(move) => dispatch({ k: 'puzzleMove', move })}
        />
        <div className="button-row">
          <button
            className="button button-primary"
            data-action="missionFinish"
            onClick={() => dispatch({ k: 'missionFinish' })}
          >
            {t.missionFinish}
          </button>
        </div>
      </div>
    )
  }

  const battle = mission.battle
  const active = activeUnit(battle)

  const selectableTiles = new Set<string>(
    battle.pending?.kind === 'tile' ? battle.pending.options : [],
  )
  const selectableUnits = new Set<string>(
    battle.pending?.kind === 'unit' ? battle.pending.options : [],
  )
  const activeEffect = battle.heroTurn?.active
    ? battle.heroTurn.active.effects[battle.heroTurn.active.index]
    : undefined
  const previewRadius = activeEffect?.k === 'areaAtPoint' ? activeEffect.radius : null

  // What each offered target would actually lose. Asked of the engine, so the
  // number on the board is the number that will be taken off.
  const damagePreview = new Map<string, number>()
  if (battle.pending?.kind === 'unit' && battle.pending.prompt.k === 'pickAttackTarget' && active) {
    const { power, range } = battle.pending.prompt
    for (const id of battle.pending.options) {
      const target = battle.units.find((u) => u.id === id)
      if (target) {
        damagePreview.set(id, predictDamage(battle, active, target, power, { melee: range <= 1 }))
      }
    }
  }

  return (
    <div className="mission mission-battle" data-phase={battle.phase}>
      <ObjectiveBar
        battle={battle}
        canUndo={canUndo}
        onUndo={onUndo}
        rescue={
          <>
            {!settled && (
              <button
                className="button button-small hand-toggle"
                data-action="toggleHand"
                title={t.handToggleHint}
                onClick={() => setHandOpen((open) => !open)}
              >
                {handOpen ? t.handHide : t.handShow}
              </button>
            )}
            {settled ? null : <Rescue dispatch={dispatch} onEdit={() => setEditKind('floor')} />}
          </>
        }
      />

      {editKind !== null && (
        <TerrainPalette kind={editKind} onPick={setEditKind} onClose={() => setEditKind(null)} />
      )}

      <div className="mission-body">
        <main className="grid-area">
          <Grid
            state={battle}
            selectableTiles={selectableTiles}
            selectableUnits={selectableUnits}
            activeId={active?.id}
            previewRadius={previewRadius}
            damagePreview={damagePreview}
            editing={editKind !== null}
            onTile={(key) =>
              dispatch(
                editKind !== null
                  ? { k: 'battleAction', action: { k: 'editTerrain', tile: key, kind: editKind } }
                  : { k: 'battleAction', action: { k: 'choose', value: key } },
              )
            }
            onUnit={(id) => dispatch({ k: 'battleAction', action: { k: 'choose', value: id } })}
          />
        </main>
        {/* The ship, while the fight is happening. Shows only when somebody
            stayed aboard — the one place two groups of players are doing
            different things in the same minute. */}
        {state.ashore.length > 0 && (
          <aside className="ship-support">
            <h3>{t.supportHeading}</h3>
            {SUPPORT_DEFS.map((def) => {
              const mine = state.ashore.filter((h) => mySeats.includes(seatOfHero(state, h)))
              const who = mine[0] ?? state.ashore[0]!
              const spent = !supportAvailable(state)
              const poor = state.resources[def.cost.id] < def.cost.amount
              return (
                <button
                  key={def.kind}
                  className="button button-small"
                  data-action="shipSupport"
                  data-support={def.kind}
                  disabled={spent || poor}
                  title={spent ? t.supportSpent : s(def.text)}
                  onClick={() => dispatch({ k: 'shipSupport', hero: who, kind: def.kind })}
                >
                  {s(def.name)}{' '}
                  <span className="muted">
                    {def.cost.amount} {s(RESOURCES[def.cost.id].name)}
                  </span>
                </button>
              )
            })}
          </aside>
        )}

        <Sidebar
          state={battle}
          mySeats={mySeats}
          onOrderFollower={(followerId, order) =>
            dispatch({ k: 'battleAction', action: { k: 'orderFollower', followerId, order } })
          }
        />
      </div>

      <footer className={`action-area ${handOpen || settled ? '' : 'action-area-folded'}`}>
        {settled ? (
          <div className="action-bar" data-mode="settled">
            <div
              className={`player-label ${battle.outcome === 'victory' ? 'tone-rune' : 'tone-danger'}`}
            >
              {battle.outcome === 'victory' ? t.victoryTitle : t.defeatTitle}
            </div>
            <p className="instruction">
              {battle.outcome === 'victory' ? t.victoryText(battle.round) : t.defeatText}
            </p>
            <div className="button-row">
              <button
                className="button button-primary"
                data-action="missionFinish"
                onClick={() => dispatch({ k: 'missionFinish' })}
              >
                {t.missionFinish}
              </button>
            </div>
          </div>
        ) : (
          <ActionBar
            state={battle}
            dispatch={(action) => dispatch({ k: 'battleAction', action })}
          />
        )}
      </footer>
    </div>
  )
}
