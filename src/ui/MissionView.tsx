// A mission in progress: a battle on the tactical grid, or a puzzle on a panel.
//
// Both come back to the ship the same way, through one button, so the expedition
// layer never has to care which kind it was.

import { ActionBar } from './ActionBar'
import { activeUnit } from '../engine/battle'
import { Grid } from './Grid'
import { PuzzleView } from './puzzles/PuzzleView'
import { Sidebar } from './Sidebar'
import { missionSettled } from '../engine/expedition/expedition'
import type { ExpeditionAction } from '../engine/expedition/expedition'
import { useLang } from '../i18n/LangContext'
import type { ExpeditionState } from '../engine/expedition/types'
import type { BattleState, Objective } from '../engine/types'

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
}: {
  battle: BattleState
  canUndo: boolean
  onUndo: () => void
}) {
  const { t } = useLang()
  const parts: string[] = [objectiveText(battle.objective, t)]

  if (battle.objective.k === 'collect') {
    parts.push(t.relicsCarried(battle.carried, battle.objective.count))
  }
  if (battle.roundLimit !== null) {
    parts.push(t.roundLimitLeft(Math.max(0, battle.roundLimit - battle.round)))
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
    </div>
  )
}

export function MissionView({
  state,
  dispatch,
  canUndo,
  onUndo,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
  canUndo: boolean
  onUndo: () => void
}) {
  const { t, s } = useLang()
  const mission = state.activeMission
  if (!mission) return null
  const settled = missionSettled(state)

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

  return (
    <div className="mission mission-battle" data-phase={battle.phase}>
      <ObjectiveBar battle={battle} canUndo={canUndo} onUndo={onUndo} />

      <div className="mission-body">
        <main className="grid-area">
          <Grid
            state={battle}
            selectableTiles={selectableTiles}
            selectableUnits={selectableUnits}
            activeId={active?.id}
            previewRadius={previewRadius}
            onTile={(key) => dispatch({ k: 'battleAction', action: { k: 'choose', value: key } })}
            onUnit={(id) => dispatch({ k: 'battleAction', action: { k: 'choose', value: id } })}
          />
        </main>
        <Sidebar state={battle} />
      </div>

      <footer className="action-area">
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
