// The walk through the game, one screen at a time.
//
// Deliberately not modal and deliberately not a sequence of gates. A tutorial
// that will not let you press anything until you have pressed the right thing
// teaches the order of a script rather than the shape of a game — and with four
// people at one table, three of them are then watching a fourth follow
// instructions.
//
// So this is a panel in the corner that says one thing at a time, follows along
// when the players wander off to look at something, and can be shut on any step.
// Whether it is open at all is per-player and lives in this browser: in an online
// game one person can be reading it while another has closed it.

import { GUIDE_STEPS } from '../content/guide'
import { useLang } from '../i18n/LangContext'
import type { Screen } from '../engine/expedition/types'

export type GuideProps = {
  /** Which step is showing. */
  step: number
  /** Which screen the player is looking at, so the panel can point at the next one. */
  screen: Screen
  onStep: (step: number) => void
  onClose: () => void
  /** Open the screen this step is about. */
  onGo: (screen: Screen) => void
}

export function Guide({ step, screen, onStep, onClose, onGo }: GuideProps) {
  const { t, s } = useLang()
  const current = GUIDE_STEPS[step]
  if (!current) return null

  const last = step >= GUIDE_STEPS.length - 1
  // A step about a screen the player is not on gets a way to get there. It is an
  // offer, not a requirement: nothing here blocks anything.
  const elsewhere = current.screen !== null && current.screen !== screen

  return (
    <aside className="guide" data-guide-step={current.id}>
      <header className="guide-head">
        <span className="guide-count">{t.guideStepOf(step + 1, GUIDE_STEPS.length)}</span>
        <button
          className="guide-close"
          data-action="guideClose"
          title={t.guideCloseHint}
          onClick={onClose}
        >
          ✕
        </button>
      </header>

      <h3>{s(current.title)}</h3>
      <p>{s(current.text)}</p>

      {elsewhere && (
        <button
          className="button button-small"
          data-action="guideGo"
          onClick={() => onGo(current.screen as Screen)}
        >
          {t.guideGo}
        </button>
      )}

      <div className="guide-actions">
        <button
          className="button button-small"
          data-action="guideBack"
          disabled={step === 0}
          onClick={() => onStep(step - 1)}
        >
          {t.guideBack}
        </button>
        <button
          className="button button-small button-primary"
          data-action="guideNext"
          onClick={() => (last ? onClose() : onStep(step + 1))}
        >
          {last ? t.guideDone : t.guideNext}
        </button>
      </div>
    </aside>
  )
}
