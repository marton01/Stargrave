// The rune line, seen from one chair.
//
// This is the only screen in the game that deliberately shows you LESS than the
// game knows — and less than the person next to you is looking at. Your clues,
// your runes, and everybody else's runes greyed out with their owner's name on
// them, so you know who to ask.
//
// At one keyboard the same screen shows every seat's panel at once, which turns
// the same task into an ordinary logic puzzle. That is the honest thing to do:
// the split only means something when the screens are actually apart, and hiding
// half the clues from somebody who is allowed to lean over and read them would be
// theatre rather than a rule.

import { HERO_CLASSES } from '../content/heroes'
import { cluesFor, runeName, runesOf, taskStatus } from '../engine/task/runeline'
import type { Clue, RuneLineTask } from '../engine/task/runeline'
import { Rune } from './puzzles/marks'
import { useLang } from '../i18n/LangContext'
import type { Lang, Text } from '../engine/types'
import type { RoomState } from '../engine/session/room'

/** One clue, in a sentence somebody can read out loud. */
export function clueText(clue: Clue, room: RoomState | null, lang: Lang): string {
  const hu = lang === 'hu'
  const name = (rune: number) => runeName(rune)[lang]
  const seatName = (slot: number) => {
    const seat = room?.seats.find((s) => s.slot === slot)
    if (!seat) return hu ? `${slot}. szék` : `seat ${slot}`
    return seat.name || HERO_CLASSES[seat.heroClass].name[lang]
  }

  switch (clue.k) {
    case 'before':
      return hu
        ? `${name(clue.a)} előbb, mint ${name(clue.b)}.`
        : `${name(clue.a)} comes before ${name(clue.b)}.`
    case 'position':
      return hu
        ? `${name(clue.rune)} ${article(clue.at)} ${clue.at}. helyen áll.`
        : `${name(clue.rune)} is ${ordinal(clue.at, lang)}.`
    case 'notAt':
      return hu
        ? `${name(clue.rune)} NEM ${article(clue.at)} ${clue.at}. helyen áll.`
        : `${name(clue.rune)} is NOT ${ordinal(clue.at, lang)}.`
    case 'adjacent':
      return hu
        ? `${name(clue.a)} és ${name(clue.b)} közvetlenül egymás után jön (bármelyik sorrendben).`
        : `${name(clue.a)} and ${name(clue.b)} are pressed one straight after the other (either way round).`
    case 'ownerAt':
      return hu
        ? `${article(clue.at) === 'az' ? 'Az' : 'A'} ${clue.at}. rúna ${seatName(clue.seat)} rúnája.`
        : `The ${ordinal(clue.at, lang)} rune belongs to ${seatName(clue.seat)}.`
  }
}

/**
 * The Hungarian article for a numeral read aloud.
 *
 * "az 1." and "az 5." because those are read *egyes* and *ötödik*; everything
 * else takes "a". A small thing, and the sort of small thing that makes a game
 * read like it was written by somebody who speaks the language.
 */
function article(n: number): 'a' | 'az' {
  return n === 1 || n === 5 ? 'az' : 'a'
}

function ordinal(n: number, lang: Lang): string {
  if (lang === 'hu') return `${n}.`
  return ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth'][n] ?? `${n}th`
}

export function TaskView({
  task,
  room,
  /** The seats this machine is playing. Every seat, at one keyboard. */
  mine,
  briefing,
  onPress,
  onFinish,
}: {
  task: RuneLineTask
  room: RoomState | null
  mine: number[]
  briefing: Text
  onPress: (rune: number) => void
  onFinish: () => void
}) {
  const { t, s, lang } = useLang()
  const status = taskStatus(task)
  const lit = new Set(task.done)

  const seatName = (slot: number) => {
    const seat = room?.seats.find((x) => x.slot === slot)
    if (!seat) return t.taskSeat(slot)
    return seat.name || s(HERO_CLASSES[seat.heroClass].name)
  }

  return (
    <div className="mission mission-task">
      <header className="panel-head">
        <h2>{t.taskHeading}</h2>
        <span className="panel-meta">
          {t.taskStrikes(task.strikes, task.maxStrikes)}
        </span>
      </header>
      <p className="panel-intro">{s(briefing)}</p>

      {/* The line itself: everybody's, and the same on every screen. */}
      <div className="task-line">
        {Array.from({ length: task.count }, (_, slot) => {
          const rune = task.done[slot]
          return (
            <div key={slot} className={`task-slot ${rune !== undefined ? 'task-slot-lit' : ''}`}>
              <span className="task-slot-number">{slot + 1}</span>
              {rune !== undefined ? <Rune index={rune} size={26} /> : <span className="task-slot-empty">·</span>}
            </div>
          )
        })}
      </div>

      <div className="task-panels">
        {Array.from({ length: task.seats }, (_, i) => i + 1).map((seat) => {
          const isMine = mine.includes(seat)
          const clues = cluesFor(task, seat)
          return (
            <section
              key={seat}
              className={`task-panel ${isMine ? 'task-panel-mine' : ''}`}
              data-seat={seat}
            >
              <header className="task-panel-head">
                <strong>{seatName(seat)}</strong>
                <span className="muted">{isMine ? t.taskYours : t.taskTheirs}</span>
              </header>

              <div className="task-runes">
                {runesOf(task, seat).map((rune) => (
                  <button
                    key={rune}
                    className={`task-rune ${lit.has(rune) ? 'task-rune-lit' : ''}`}
                    data-action="taskPress"
                    data-rune={rune}
                    disabled={!isMine || lit.has(rune) || status !== 'open'}
                    title={isMine ? undefined : t.taskNotYours(seatName(seat))}
                    onClick={() => onPress(rune)}
                  >
                    <Rune index={rune} size={26} />
                    <span className="task-rune-name">{s(runeName(rune))}</span>
                  </button>
                ))}
              </div>

              {isMine ? (
                <ul className="task-clues">
                  {clues.map((clue, i) => (
                    <li key={i}>{clueText(clue, room, lang)}</li>
                  ))}
                  {clues.length === 0 && <li className="muted">{t.taskNoClues}</li>}
                </ul>
              ) : (
                <p className="muted task-hidden">{t.taskHidden(clues.length)}</p>
              )}
            </section>
          )
        })}
      </div>

      {status !== 'open' && (
        <p className={`puzzle-verdict ${status === 'solved' ? 'good' : 'bad'}`}>
          {status === 'solved' ? t.taskSolved : t.taskFailed}
        </p>
      )}

      <div className="button-row">
        <button
          className="button button-primary"
          data-action="missionFinish"
          onClick={onFinish}
        >
          {t.missionFinish}
        </button>
      </div>
    </div>
  )
}
