// Who may press what.
//
// Only in an online room. At one keyboard there is one mouse and the question
// does not arise; over a network it is the whole of the turn structure, so it
// lives in one pure function with tests rather than being sprinkled through the
// interface as disabled buttons.
//
// The rule in one sentence: **your hero is yours, and the ship is everybody's.**
//
// That is a deliberate reading of what this game is. It is co-operative, there
// is nothing to cheat at, and the interesting arguments — where do we go, who
// gets the reactor power, do we take the risky answer — are supposed to happen
// out loud between people who can all reach the button. What must NOT happen is
// somebody else moving your hero for you: that is your character, your cards,
// your marks, and having them played from another chair is the one thing that
// would make four players worse than two.
//
// So the battle is turn-based by ownership rather than by a token: the engine
// already decides whose turn it is by initiative, and this decides whether that
// hero is you.

import { controls } from './room'
import { pendingOwner } from '../expedition/expedition'
import type { RoomState } from './room'
import type { ExpeditionAction } from '../expedition/expedition'
import type { ExpeditionState } from '../expedition/types'
import type { Action as BattleAction } from '../battle'
import type { HeroClassId } from '../types'

/** Which hero an action belongs to, or null when it belongs to the table. */
export function actionOwner(
  room: RoomState | null,
  state: ExpeditionState | null,
  action: ExpeditionAction,
): HeroClassId | null {
  switch (action.k) {
    // A console belongs to one person: their marks, their relics, their people.
    case 'buyPerk':
    case 'attuneRelic':
    case 'stowRelic':
      return action.hero
    case 'setMentor':
      return action.hero
    // The week's duty is the one decision that is always yours, every week.
    case 'setWatch':
      return action.hero
    case 'battleAction':
      return battleOwner(state, action.action)
    // A situation on the ship names whose call it is. Four people running a ship
    // is not four people voting: it is four people each answering for something
    // while the others say what they think.
    case 'encounterChoose':
    case 'encounterCancel':
    case 'encounterPayCard':
    case 'encounterConfirm':
    case 'encounterClose':
      return state ? (pendingOwner(state) ?? null) : null
    // A rune in a split task belongs to a SEAT rather than to a hero — the whole
    // point of the task is that the panels are different. The seat is turned back
    // into a hero here so that one rule decides everything.
    case 'taskPress': {
      const mission = state?.activeMission
      if (mission?.k !== 'task') return null
      const slot = mission.task.owner[action.rune]
      if (slot === undefined) return null
      return room?.seats.find((seat) => seat.slot === slot)?.heroClass ?? null
    }
    default:
      return null
  }
}

/**
 * Whose move a battle action is.
 *
 * Most of them carry no hero at all — "skip this half", "end turn" — because the
 * engine already knows whose turn it is. So the owner is read off the battle:
 * the hero choosing cards during selection, and the hero whose turn is being
 * resolved after it.
 */
function battleOwner(state: ExpeditionState | null, action: BattleAction): HeroClassId | null {
  const mission = state?.activeMission
  if (!mission || mission.k !== 'battle') return null
  const battle = mission.battle

  const named =
    'heroId' in action && typeof action.heroId === 'string' ? action.heroId : null
  const acting =
    named ??
    (battle.phase === 'cardSelection' ? battle.selectingHero : (battle.heroTurn?.heroId ?? null))
  if (!acting) return null

  const unit = battle.units.find((u) => u.id === acting)
  return unit && unit.side === 'hero' ? unit.heroClass : null
}

/**
 * May this player take this action right now?
 *
 * Actions that belong to nobody in particular — ending the week, setting a
 * course, answering an encounter, moving the enemies along — are open to
 * everybody at the table on purpose. See the note at the top of the file.
 */
export function mayAct(
  room: RoomState | null,
  tag: string,
  state: ExpeditionState | null,
  action: ExpeditionAction,
): boolean {
  if (!room || room.mode !== 'online') return true
  const owner = actionOwner(room, state, action)
  if (owner === null) return true
  return controls(room, tag, owner)
}

/** Why not, in a form the interface can turn into a sentence. */
export function blockedBy(
  room: RoomState | null,
  state: ExpeditionState | null,
  action: ExpeditionAction,
): HeroClassId | null {
  if (!room || room.mode !== 'online') return null
  return actionOwner(room, state, action)
}
