// The Heart, and the end of an expedition.
//
// The Heart is the whole design in one screen: the same location, and what you
// can do there depends only on how much you understood. A player who optimised
// the ship perfectly and never spent a point on understanding gets exactly two
// options, and both of them are small.

import { useState } from 'react'
import { ENDING_TEXTS, ENDING_TITLES, LOSS_TEXTS } from '../../engine/expedition/archive'
import { availableEndings } from '../../engine/expedition/expedition'
import type { ExpeditionAction } from '../../engine/expedition/expedition'
import { understandingTier } from '../../content/research'
import { useLang } from '../../i18n/LangContext'
import type { EndingId, ExpeditionState } from '../../engine/expedition/types'
import type { UiKey } from '../../i18n/ui'

const TIER_KEY: UiKey[] = ['tier0', 'tier1', 'tier2', 'tier3']
const ALL_ENDINGS: EndingId[] = [
  'flee',
  'blindRuin',
  'witness',
  'intervene',
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
        <div className="button-row">
          <button className="button button-primary" data-action="returnToArchive" onClick={onReturn}>
            {t.overReturn}
          </button>
        </div>
      </div>
    </div>
  )
}
