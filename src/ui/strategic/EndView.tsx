// The Heart, and the end of an expedition.
//
// The Heart is the whole design in one screen: the same location, and what you
// can do there depends only on how much you understood. A player who optimised
// the ship perfectly and never spent a point on understanding gets exactly two
// options, and both of them are small.

import { useState } from 'react'
import { ENDING_TEXTS, ENDING_TITLES, LOSS_TEXTS } from '../../engine/expedition/archive'
import { availableEndings, canGoHome, homewardFuel } from '../../engine/expedition/expedition'
import type { ExpeditionAction } from '../../engine/expedition/expedition'
import { understandingTier } from '../../content/research'
import { epilogue, epilogueHeading } from '../../engine/expedition/epilogue'
import { useLang } from '../../i18n/LangContext'
import type { EndingId, ExpeditionState } from '../../engine/expedition/types'
import type { UiKey } from '../../i18n/ui'

const TIER_KEY: UiKey[] = ['tier0', 'tier1', 'tier2', 'tier3']

/**
 * Everything that can be chosen at the Stargrave, in the order it is offered.
 *
 * `homecoming` is not here: turning back is not a decision you take standing on
 * the rim, it is one you take on the road. See `GateView`.
 */
const ALL_ENDINGS: EndingId[] = [
  'flee',
  'blindRuin',
  'witness',
  'intervene',
  'silence',
  'inheritance',
  'custodian',
  'communion',
  'theAnswer',
]

export function HeartView({
  state,
  dispatch,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
}) {
  const { t, s } = useLang()
  const open = availableEndings(state)
  const tier = understandingTier(state.understanding)
  // The last click of an expedition, and there is no undoing it: it is asked for
  // twice, like every other decision that cannot be taken back.
  const [confirming, setConfirming] = useState<EndingId | null>(null)

  return (
    <div className="heart">
      <header className="panel-head">
        <h2>{t.heartHeading}</h2>
        <span className="panel-meta">
          {t.heartUnderstanding(state.understanding)} · {t[TIER_KEY[tier]!] as string}
        </span>
      </header>
      <p className="heart-intro">{t.heartIntro}</p>

      {/*
        One reading of the rim, before anything is decided. Two points of
        understanding can open a different ending while the list is already on
        screen — which is the whole reason it is offered here and not earlier.
      */}
      <div className="heart-read">
        {state.heartRead ? (
          <p className="muted">{t.heartReadDone}</p>
        ) : (
          <>
            <button
              className="button button-primary"
              data-action="readHeart"
              onClick={() => dispatch({ k: 'readHeart' })}
            >
              {t.heartReadButton}
            </button>
            <p className="muted">{t.heartReadHint}</p>
          </>
        )}
      </div>

      <div className="ending-list">
        {ALL_ENDINGS.filter((id) => id !== 'theAnswer' || open.includes(id)).map((id) => {
          const unlocked = open.includes(id)
          return (
            <div key={id} className={`ending ${unlocked ? '' : 'ending-locked'}`}>
              <h3>{s(ENDING_TITLES[id])}</h3>
              {unlocked ? (
                <>
                  <p>{s(ENDING_TEXTS[id])}</p>
                  {confirming === id ? (
                    <div className="button-row">
                      <button
                        className="button button-primary"
                        data-action="chooseEnding"
                        data-ending={id}
                        onClick={() => dispatch({ k: 'chooseEnding', endingId: id })}
                      >
                        {t.heartConfirm}
                      </button>
                      <button className="button" data-action="heartBack" onClick={() => setConfirming(null)}>
                        {t.encounterBack}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="button button-primary"
                      data-action="heartPick"
                      data-ending={id}
                      onClick={() => setConfirming(id)}
                    >
                      {t.heartChoose}
                    </button>
                  )}
                  {confirming === id && <p className="heart-warning">{t.heartFinal}</p>}
                </>
              ) : (
                <p className="muted">{t.heartLocked}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function OverView({
  state,
  onReturn,
}: {
  state: ExpeditionState
  onReturn: () => void
}) {
  const { t, s } = useLang()
  const outcome = state.outcome
  if (!outcome) return null

  const won = outcome.k === 'ending'
  const title = won ? s(ENDING_TITLES[outcome.id]) : t.overLost
  const body = won ? s(ENDING_TEXTS[outcome.id]) : s(LOSS_TEXTS[outcome.reason]!)

  return (
    <div className="over">
      <div className={`over-panel ${won ? 'over-good' : 'over-bad'}`}>
        <span className="over-label">{won ? t.overVictory : t.overLost}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        <p className="over-stats">
          {t.overWeeks(state.week)} · {t.overUnderstanding(state.understanding)}
        </p>
        <p className="over-archive">{t.overArchiveEarned(state.archiveEarned)}</p>

        {/* Everybody who was ever aboard, by name. A run that cost you somebody
            in week nine used to finish as an integer. */}
        <section className="epilogue">
          <h3>{s(epilogueHeading(state))}</h3>
          <ul className="epilogue-list">
            {epilogue(state).map((entry) => (
              <li key={entry.name} className={entry.home ? 'epilogue-home' : 'epilogue-lost'}>
                <strong>{entry.name}</strong> — {s(entry.line)}
              </li>
            ))}
          </ul>
        </section>

        <div className="button-row">
          <button className="button button-primary" data-action="returnToArchive" onClick={onReturn}>
            {t.overReturn}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * The Gate, from the inside: the screen that answers "when does this end?".
 *
 * Before this the answer was "when you reach the Stargrave, or when the clock
 * runs out and you lose everything". So a run that had gone badly had nothing to
 * play for, and a run that had gone well had no reason to stop. Turning back is
 * an ENDING now — a small one, banked and counted, worth more for every relic in
 * the hold — and the interesting week of an expedition is the one where you can
 * still afford it and are deciding not to.
 */
export function GateView({
  state,
  dispatch,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
}) {
  const { t, s } = useLang()
  const [confirming, setConfirming] = useState(false)
  const fuel = homewardFuel(state)
  const possible = canGoHome(state)
  // What the Archive would get: the ending itself, a point for every relic
  // carried home, and half of everything understood. Stated rather than
  // discovered, because it is the one number this decision turns on.
  const banked = 3 + state.relics.length + Math.floor(state.understanding / 2) + state.archiveEarned

  return (
    <div className="heart gate-view">
      <header className="panel-head">
        <h2>{t.gateHeading}</h2>
        <span className="panel-meta">
          {t.gateFuelCost(fuel)} · {t.gateBanks(banked)}
        </span>
      </header>
      <p className="heart-intro">{t.gateIntro}</p>

      <div className="ending-list">
        <div className="ending">
          <h3>{s(ENDING_TITLES.homecoming)}</h3>
          <p>{s(ENDING_TEXTS.homecoming)}</p>
          {!possible ? (
            <p className="muted">{t.gateNoFuel(fuel)}</p>
          ) : confirming ? (
            <>
              <div className="button-row">
                <button
                  className="button button-primary"
                  data-action="chooseEnding"
                  data-ending="homecoming"
                  onClick={() => dispatch({ k: 'chooseEnding', endingId: 'homecoming' })}
                >
                  {t.gateConfirm}
                </button>
                <button
                  className="button"
                  data-action="gateBack"
                  onClick={() => setConfirming(false)}
                >
                  {t.encounterBack}
                </button>
              </div>
              <p className="heart-warning">{t.heartFinal}</p>
            </>
          ) : (
            <div className="button-row">
              <button
                className="button button-primary"
                data-action="gatePick"
                onClick={() => setConfirming(true)}
              >
                {t.gateGoHome}
              </button>
              <button
                className="button"
                data-action="gateLeave"
                onClick={() => dispatch({ k: 'openScreen', screen: 'starmap' })}
              >
                {t.back}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
