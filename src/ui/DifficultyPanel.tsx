// The difficulty panel: one dial per pressure the game applies.
//
// Reached from a button that is always in the header, because the moment a player
// wants it is the moment something has just been too much — not at the launch
// screen half an hour earlier.
//
// Every dial says what its current setting means in play, in a sentence. That is
// the whole point: "hard" tells you nothing, "a third more enemies, so the Bond
// and area attacks start to matter" tells you what you are agreeing to.
//
// The panel also keeps a preset in the browser, separate from the save, so the
// terms you like do not have to be re-dialled every expedition.

import { useLang } from '../i18n/LangContext'
import { DEFAULT_LEVEL, DIALS, dialsAreDefault } from '../content/difficulty'
import type { DialId, DialScope, Dials } from '../content/difficulty'
import type { UiKey } from '../i18n/ui'

const SCOPE_KEY: Record<DialScope, UiKey> = {
  nextLanding: 'dialScopeLanding',
  nextWeek: 'dialScopeWeek',
  nextExpedition: 'dialScopeExpedition',
}

export function DifficultyPanel({
  dials,
  hasPreset,
  onSet,
  onSavePreset,
  onLoadPreset,
  onReset,
  onClose,
}: {
  dials: Dials
  hasPreset: boolean
  onSet: (dial: DialId, level: number) => void
  onSavePreset: () => void
  onLoadPreset: () => void
  onReset: () => void
  onClose: () => void
}) {
  const { t, s } = useLang()

  return (
    <div className="dials-veil" onClick={onClose}>
      <div className="dials" role="dialog" aria-modal onClick={(event) => event.stopPropagation()}>
        <header className="dials-head">
          <h2>{t.dialsHeading}</h2>
          <button className="help-close" data-action="closeDials" onClick={onClose} aria-label={t.close}>
            ✕
          </button>
        </header>
        <p className="dials-intro">{t.dialsIntro}</p>

        <div className="dials-list">
          {DIALS.map((dial) => {
            const level = dials[dial.id] ?? DEFAULT_LEVEL
            return (
              <div key={dial.id} className="dial" data-dial={dial.id}>
                <div className="dial-head">
                  <strong>{s(dial.name)}</strong>
                  <span className="dial-scope">{t[SCOPE_KEY[dial.scope]] as string}</span>
                </div>
                <p className="dial-about">{s(dial.about)}</p>

                <div className="dial-steps">
                  {dial.levels.map((step, index) => {
                    const value = index + 1
                    return (
                      <button
                        key={value}
                        className={`dial-step ${value === level ? 'dial-step-on' : ''} ${
                          value === DEFAULT_LEVEL ? 'dial-step-default' : ''
                        }`}
                        data-action="setDial"
                        data-dial={dial.id}
                        data-level={value}
                        title={s(step.text)}
                        onClick={() => onSet(dial.id, value)}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>

                {/* What the chosen step means, spelled out. */}
                <p className={`dial-meaning ${level === DEFAULT_LEVEL ? 'dial-meaning-default' : ''}`}>
                  {s(dial.levels[level - 1]!.text)}
                </p>
              </div>
            )
          })}
        </div>

        <div className="button-row dials-buttons">
          <button className="button button-small" data-action="savePreset" onClick={onSavePreset}>
            {t.dialsSavePreset}
          </button>
          {hasPreset && (
            <button className="button button-small" data-action="loadPreset" onClick={onLoadPreset}>
              {t.dialsLoadPreset}
            </button>
          )}
          <button
            className="button button-small"
            data-action="resetDials"
            disabled={dialsAreDefault(dials)}
            onClick={onReset}
          >
            {t.dialsReset}
          </button>
          <button className="button button-small button-primary" data-action="closeDials" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
}
