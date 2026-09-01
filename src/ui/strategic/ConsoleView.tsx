// The two consoles: the one screen in the game that is not shared.
//
// Everything else here is a joint decision, and that was always the point — one
// reactor, one hold, one route, two people arguing. What was missing is the other
// half of a co-operative game: something each player owns, develops and knows
// better than their partner does. A shared game with nothing personal in it turns
// into one person driving while the other watches.
//
// So: two tabs, and each of them is somebody's. Marks earned by the work that
// player did, a perk track only they can spend from, relics only they can put on
// (some of which only they can wear at all), the crew members they took under
// their wing, and the orders from home that landed on their desk. Nothing on this
// screen can be done for you by the other player — which is exactly why it is
// worth having.

import { useState } from 'react'
import {
  attunementSlots,
  directiveProgress,
  heroMaxHp,
  menteesOf,
  mentorLimit,
} from '../../engine/expedition/expedition'
import type { ExpeditionAction } from '../../engine/expedition/expedition'
import { directiveAtDeadline, directiveLabel, party } from '../../engine/expedition/expedition'
import { HERO_CLASSES } from '../../content/heroes'
import { MARK_NAMES, MARK_SOURCES, perkAvailable, perksOf } from '../../content/advance'
import { RANK_NAMES, SPECIALITY_NAMES, crewRank, xpToNextRank } from '../../content/crew'
import { dutiesOf } from '../../content/watch'
import { STATIONS } from '../../content/ship'
import { relic, relicFits } from '../../content/relics'
import { describeReward } from '../../i18n/describeChoice'
import { Portrait } from '../Portrait'
import { portrait } from '../assets'
import { useLang } from '../../i18n/LangContext'
import type { Directive, ExpeditionState } from '../../engine/expedition/types'
import type { HeroClassId } from '../../engine/types'
import type { StationId } from '../../content/ship'

export function ConsoleView({
  state,
  dispatch,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
}) {
  const { t, s } = useLang()
  // One tab per seat at the table, in seat order.
  const seats = party(state)
  const [who, setWho] = useState<HeroClassId>(seats[0] ?? 'runesmith')

  return (
    <div className="consoles">
      <header className="panel-head">
        <h2>{t.consolesHeading}</h2>
        <span className="panel-meta">{t.consoleTabHint}</span>
      </header>
      <p className="panel-intro">{t.consolesIntro}</p>

      <div className="console-tabs">
        {seats.map((hero) => (
          <button
            key={hero}
            className={`console-tab console-tab-${hero} ${who === hero ? 'on' : ''}`}
            data-action="consoleTab"
            data-hero={hero}
            onClick={() => setWho(hero)}
          >
            {s(HERO_CLASSES[hero].name)}
            <span className="console-tab-marks">
              {state.heroRecords[hero].marks} {s(MARK_NAMES[hero])}
            </span>
          </button>
        ))}
      </div>

      <Console key={who} state={state} dispatch={dispatch} hero={who} />
    </div>
  )
}

function Console({
  state,
  dispatch,
  hero,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
  hero: HeroClassId
}) {
  const { t, s } = useLang()
  const record = state.heroRecords[hero]
  const cls = HERO_CLASSES[hero]
  const carried = state.heroes.find((h) => h.heroClass === hero)

  return (
    <div className={`console console-${hero}`} data-hero={hero}>
      <section className="panel console-head-panel">
        <div className="console-identity">
          <Portrait path={portrait.hero(hero)} />
          <div>
            <h3>{s(cls.name)}</h3>
            <p className="muted">{s(cls.description)}</p>
            <p className="console-stats">
              <strong>{t.heroHpLine(carried?.hp ?? cls.hp, heroMaxHp(state, hero))}</strong>
              {' · '}
              <strong data-marks={record.marks}>
                {t.marksHeld(record.marks, s(MARK_NAMES[hero]))}
              </strong>{' '}
              <span className="muted">({t.marksEarned(record.marksEarned)})</span>
            </p>
            <p className="console-how">
              <em>{t.marksHow}:</em> {s(MARK_SOURCES[hero])}
            </p>
          </div>
        </div>
      </section>

      <Watch state={state} dispatch={dispatch} hero={hero} />
      <Directives state={state} hero={hero} />
      <Perks state={state} dispatch={dispatch} hero={hero} />
      <Relics state={state} dispatch={dispatch} hero={hero} />
      <Mentees state={state} dispatch={dispatch} hero={hero} />
    </div>
  )
}

// ---------------------------------------------------------------- directives

function Directives({ state, hero }: { state: ExpeditionState; hero: HeroClassId }) {
  const { t, s, lang } = useLang()
  const mine = state.directives.filter((d) => d.owner === hero && d.state === 'open')
  const closed = state.directives.filter((d) => d.owner === hero && d.state !== 'open').slice(-3)

  return (
    <section className="panel">
      <header className="panel-head">
        <h3>{t.directivesHeading}</h3>
        <span className="panel-meta">{mine.length}</span>
      </header>
      <p className="panel-intro">{t.directivesIntro}</p>

      {mine.length === 0 && <p className="muted">{t.directiveNone}</p>}
      {mine.map((d) => {
        const now = directiveProgress(state, d)
        const left = d.due - state.week
        const reward = d.reward.map((r) => describeReward(r, lang))
        return (
          <div key={d.id} className={`directive ${left <= 2 ? 'directive-urgent' : ''}`}>
            <div className="directive-head">
              <strong>{s(directiveLabel(d))}</strong>
              <span className="directive-clock">
                {left > 0 ? t.directiveLeft(left) : t.directiveOverdue} · {t.directiveDue(d.due)}
              </span>
            </div>
            <div className="directive-progress">
              <span className="directive-count">{t.directiveProgressLine(now, d.target)}</span>
              <span className="directive-bar">
                <span
                  className="directive-fill"
                  style={{ width: `${Math.min(100, (now / Math.max(1, d.target)) * 100)}%` }}
                />
              </span>
            </div>
            {directiveAtDeadline(d.kind) && (
              <p className="muted directive-note">{t.directiveAtDeadline}</p>
            )}
            <p className="directive-reward">
              <em>{t.directiveReward}:</em>{' '}
              {reward.map((line, i) => (
                <span key={i} className={`choice-line tone-${line.tone}`}>
                  {line.text}
                </span>
              ))}
            </p>
          </div>
        )
      })}

      {closed.map((d) => (
        <p key={d.id} className={`directive-closed directive-${d.state}`}>
          {s(directiveLabel(d))} —{' '}
          {d.state === 'done' ? t.directiveStateDone : t.directiveStateFailed}
        </p>
      ))}
    </section>
  )
}

// ---------------------------------------------------------------- perks

function Perks({
  state,
  dispatch,
  hero,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
  hero: HeroClassId
}) {
  const { t, s } = useLang()
  const record = state.heroRecords[hero]

  return (
    <section className="panel">
      <header className="panel-head">
        <h3>{t.perksHeading}</h3>
        <span className="panel-meta">{t.marksHeld(record.marks, s(MARK_NAMES[hero]))}</span>
      </header>

      <div className="perk-list">
        {perksOf(hero).map((perk) => {
          const owned = record.perks.includes(perk.id)
          const open = perkAvailable(perk, record.perks)
          const missing = perk.requires.filter((r) => !record.perks.includes(r))
          const affordable = record.marks >= perk.cost
          return (
            <div
              key={perk.id}
              className={`perk ${owned ? 'perk-owned' : open ? '' : 'perk-locked'}`}
              data-perk={perk.id}
            >
              <div className="perk-text">
                <strong>{s(perk.name)}</strong>
                <span className="perk-desc">{s(perk.description)}</span>
              </div>
              {owned ? (
                <span className="perk-state good">{t.perkOwned}</span>
              ) : open ? (
                <button
                  className="button button-primary button-small"
                  data-action="buyPerk"
                  data-hero={hero}
                  disabled={!affordable}
                  onClick={() => dispatch({ k: 'buyPerk', hero, perkId: perk.id })}
                >
                  {affordable ? t.perkBuy(perk.cost) : t.perkTooExpensive}
                </button>
              ) : (
                <span className="perk-state muted">
                  {t.perkNeeds(missing.map((id) => s(perksOf(hero).find((p) => p.id === id)!.name)).join(', '))}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- relics

function Relics({
  state,
  dispatch,
  hero,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
  hero: HeroClassId
}) {
  const { t, s } = useLang()
  const record = state.heroRecords[hero]
  const slots = attunementSlots(state, hero)
  // Who else is wearing what. With four people this is no longer "the other one",
  // so the relic says whose neck it is on by name.
  const wornByOthers = new Map<string, HeroClassId>()
  for (const seat of party(state)) {
    if (seat === hero) continue
    for (const id of state.heroRecords[seat].attuned) wornByOthers.set(id, seat)
  }

  return (
    <section className="panel">
      <header className="panel-head">
        <h3>{t.relicsHeading}</h3>
        <span className="panel-meta">{t.relicSlots(record.attuned.length, slots)}</span>
      </header>
      <p className="panel-intro">{t.relicsIntro}</p>

      {state.relics.length === 0 && <p className="muted">{t.relicNone}</p>}

      <div className="relic-list">
        {state.relics.map((id) => {
          const def = relic(id)
          const mine = record.attuned.includes(id)
          const wearer = wornByOthers.get(id)
          const fits = relicFits(id, hero)
          const room = record.attuned.length < slots
          return (
            <div key={id} className={`relic ${mine ? 'relic-worn' : ''}`} data-relic={id}>
              <div className="relic-text">
                <strong>{s(def.name)}</strong>
                <span className="relic-desc">{s(def.description)}</span>
                <span className="relic-effect">{relicEffectLine(id, s)}</span>
                {def.whisper && (
                  <span className="relic-whisper">
                    {t.relicWhisper}: {s(def.whisper)}
                  </span>
                )}
              </div>
              {mine ? (
                <button
                  className="button button-small"
                  data-action="stowRelic"
                  onClick={() => dispatch({ k: 'stowRelic', hero, relicId: id })}
                >
                  {t.relicStow}
                </button>
              ) : wearer ? (
                <span className="relic-state muted">
                  {t.relicWornBy(s(HERO_CLASSES[wearer].name))}
                </span>
              ) : !fits ? (
                <span className="relic-state muted">
                  {t.relicOnlyFor(s(HERO_CLASSES[def.bearer!].name))}
                </span>
              ) : (
                <button
                  className="button button-primary button-small"
                  data-action="attuneRelic"
                  data-hero={hero}
                  disabled={!room}
                  onClick={() => dispatch({ k: 'attuneRelic', hero, relicId: id })}
                >
                  {room ? t.relicAttune : t.relicNoSlot}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/**
 * A relic's effect in plain numbers.
 *
 * Written from the effect object rather than by hand, so a relic whose numbers
 * are tuned cannot end up describing the old ones.
 */
function relicEffectLine(id: string, s: (text: { hu: string; en: string }) => string): string {
  const e = relic(id).effect
  const parts: string[] = []
  const add = (hu: string, en: string) => parts.push(s({ hu, en }))
  if (e.flux) add(`Fluxus +${e.flux}`, `Flux +${e.flux}`)
  if (e.heroHp) add(`Életerő +${e.heroHp}`, `Hit points +${e.heroHp}`)
  if (e.wards) add(`Hajótest-védelem +${e.wards}`, `Hull protection +${e.wards}`)
  if (e.sensorRange) add(`Érzékelők +${e.sensorRange} oszlop`, `Sensors +${e.sensorRange} columns`)
  if (e.moraleTarget) {
    const n = e.moraleTarget
    add(`Morál-cél ${n > 0 ? '+' : '−'}${Math.abs(n)}`, `Morale target ${n > 0 ? '+' : '−'}${Math.abs(n)}`)
  }
  if (e.research) add(`Labor +${e.research} információ`, `Lab +${e.research} information`)
  if (e.repair) add(`Kohó +${e.repair} hajótest`, `Forge +${e.repair} hull`)
  if (e.bondRange) add(`Kötés ${e.bondRange} mezőig`, `Bond up to ${e.bondRange} tiles`)
  if (e.weekly) add(`Hetente +${e.weekly.amount}`, `+${e.weekly.amount} a week`)
  if (e.attention) {
    const n = e.attention
    add(`Figyelem ${n > 0 ? '+' : '−'}${Math.abs(n)}/hét`, `Attention ${n > 0 ? '+' : '−'}${Math.abs(n)} a week`)
  }
  return parts.join(' · ')
}

// ---------------------------------------------------------------- mentees

function Mentees({
  state,
  dispatch,
  hero,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
  hero: HeroClassId
}) {
  const { t, s } = useLang()
  const mine = menteesOf(state, hero)
  const limit = mentorLimit(state, hero)

  return (
    <section className="panel">
      <header className="panel-head">
        <h3>{t.menteesHeading}</h3>
        <span className="panel-meta">{t.menteeCount(mine.length, limit)}</span>
      </header>
      <p className="panel-intro">{t.menteesIntro}</p>

      <div className="mentee-list">
        {state.crew
          .filter((c) => c.alive)
          .map((member) => {
            const rank = crewRank(member)
            const isMine = member.mentor === hero
            const mentor = member.mentor && member.mentor !== hero ? member.mentor : null
            const needed = xpToNextRank(member)
            const station = member.station as StationId | null
            return (
              <div key={member.id} className={`mentee ${isMine ? 'mentee-mine' : ''}`}>
                <div className="mentee-text">
                  <strong>{member.name}</strong>
                  <span className="mentee-detail">
                    {s(SPECIALITY_NAMES[member.speciality])}
                    {station ? ` · ${s(STATIONS[station].name)}` : ''}
                  </span>
                  <span className="mentee-rank">
                    {t.crewRankLine(s(RANK_NAMES[rank]), member.xp)}
                    {needed !== null
                      ? ` · ${t.crewNextRank(Math.max(1, Math.ceil(needed / (isMine ? 2 : 1))))}`
                      : ''}
                  </span>
                </div>
                {isMine ? (
                  <button
                    className="button button-small"
                    data-action="releaseMentee"
                    onClick={() => dispatch({ k: 'setMentor', crewId: member.id, hero: null })}
                  >
                    {t.menteeRelease}
                  </button>
                ) : mentor ? (
                  <span className="mentee-state muted">
                    {t.menteeOther(s(HERO_CLASSES[mentor].name))}
                  </span>
                ) : (
                  <button
                    className="button button-primary button-small"
                    data-action="takeMentee"
                    data-hero={hero}
                    disabled={mine.length >= limit}
                    onClick={() => dispatch({ k: 'setMentor', crewId: member.id, hero })}
                  >
                    {mine.length >= limit ? t.menteeFull : t.menteeTake}
                  </button>
                )}
              </div>
            )
          })}
      </div>
    </section>
  )
}

/** Shared by the star map and the console: one order in one line. */
export function directiveOneLine(d: Directive, lang: 'hu' | 'en'): string {
  return directiveLabel(d)[lang]
}

// ---------------------------------------------------------------- the watch

/**
 * What this hero is doing with the week.
 *
 * The one decision on this screen that comes round again every single week, and
 * the reason a player who is not driving the mouse still has to think. Cleared
 * when the week turns over — see `runWatches`.
 */
function Watch({
  state,
  dispatch,
  hero,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
  hero: HeroClassId
}) {
  const { t, s } = useLang()
  const chosen = state.watch?.[hero]

  return (
    <section className="panel">
      <header className="panel-head">
        <h3>{t.watchHeading}</h3>
        <span className={`panel-meta ${chosen ? 'good' : ''}`}>
          {chosen ? t.watchSetLabel : t.watchUnset}
        </span>
      </header>
      <p className="panel-intro">{t.watchIntro}</p>

      <div className="watch-list">
        {dutiesOf(hero).map((duty) => {
          const on = chosen === duty.id
          return (
            <button
              key={duty.id}
              className={`watch-duty ${on ? 'on' : ''}`}
              data-action="setWatch"
              data-hero={hero}
              data-duty={duty.id}
              onClick={() => dispatch({ k: 'setWatch', hero, duty: duty.id })}
            >
              <strong>{s(duty.name)}</strong>
              <span>{s(duty.description)}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
