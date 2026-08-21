// The bottom bar: every decision happens here.
//
// In a hotseat game the most important thing is that it is ALWAYS obvious whose
// decision it is. That is why the bar leads with a large label naming the player.
//
// Buttons carry data-action attributes so the browser smoke test can drive the
// interface without matching on translated text.

import { useState } from 'react'
import { activeUnit, canRest, mustRest, type Action } from '../engine/battle'
import { card } from '../content/cards'
import { CardView } from './CardView'
import { describePrompt } from '../i18n/describe'
import { intentOf } from '../content/enemies'
import { livingHeroes } from '../engine/state'
import { useLang } from '../i18n/LangContext'
import type { BattleState, Hero } from '../engine/types'

/** Renders **bold** segments of an interface string. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
    </>
  )
}

export function ActionBar({
  state,
  dispatch,
}: {
  state: BattleState
  dispatch: (action: Action) => void
}) {
  if (state.phase === 'cardSelection') return <SelectionBar state={state} dispatch={dispatch} />
  if (state.phase === 'resolution') return <ResolutionBar state={state} dispatch={dispatch} />
  return null
}

// ------------------------------------------------------- card selection phase

function SelectionBar({
  state,
  dispatch,
}: {
  state: BattleState
  dispatch: (action: Action) => void
}) {
  const { t } = useLang()
  const [restMode, setRestMode] = useState(false)
  const hero = livingHeroes(state).find((h) => h.id === state.selectingHero)

  if (!hero) return null

  const forcedRest = mustRest(hero)
  const restPossible = canRest(hero)
  const showRest = forcedRest || restMode

  return (
    <div className="action-bar" data-mode={showRest ? 'rest' : 'select'}>
      <PlayerLabel hero={hero} />

      {showRest ? (
        <>
          <p className="instruction">
            <Rich text={forcedRest ? t.mustRestNow : t.restExplain} />{' '}
            <Rich text={t.restPickCard} />
          </p>
          {restPossible ? (
            <div className="card-row">
              {hero.discard.map((cardId) => (
                <CardView
                  key={cardId}
                  cardId={cardId}
                  onClick={() => {
                    dispatch({ k: 'rest', heroId: hero.id, loseCard: cardId })
                    dispatch({ k: 'confirmSelection', heroId: hero.id })
                    setRestMode(false)
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="instruction warning">{t.nothingToRecover}</p>
          )}
          {!forcedRest && (
            <div className="button-row">
              <button className="button" data-action="cancelRest" onClick={() => setRestMode(false)}>
                {t.cancel}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="instruction">
            <Rich text={t.chooseTwoCards} />
          </p>

          <div className="card-row">
            {hero.hand.map((cardId) => (
              <CardView
                key={cardId}
                cardId={cardId}
                selected={hero.selected.includes(cardId)}
                initiative={hero.initiativeCard === cardId}
                onClick={() => dispatch({ k: 'selectCard', heroId: hero.id, cardId })}
              />
            ))}
          </div>

          {hero.selected.length === 2 && (
            <div className="initiative-picker">
              <span>{t.initiativeLabel}</span>
              {hero.selected.map((cardId) => (
                <button
                  key={cardId}
                  className={`button button-small ${hero.initiativeCard === cardId ? 'button-on' : ''}`}
                  data-action="setInitiative"
                  data-card-id={cardId}
                  onClick={() => dispatch({ k: 'setInitiativeCard', heroId: hero.id, cardId })}
                >
                  {card(cardId).initiative}
                </button>
              ))}
            </div>
          )}

          <div className="button-row">
            <button
              className="button button-primary"
              data-action="ready"
              disabled={hero.selected.length !== 2 || !hero.initiativeCard}
              onClick={() => dispatch({ k: 'confirmSelection', heroId: hero.id })}
            >
              {t.ready}
            </button>
            {restPossible && (
              <button className="button" data-action="rest" onClick={() => setRestMode(true)}>
                {t.restInstead}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------- resolution phase

function ResolutionBar({
  state,
  dispatch,
}: {
  state: BattleState
  dispatch: (action: Action) => void
}) {
  const { t, s, lang } = useLang()
  const unit = activeUnit(state)
  if (!unit) return null

  if (unit.side === 'enemy') {
    const intent = unit.intent ? intentOf(unit.enemyType, unit.intent) : null
    return (
      <div className="action-bar" data-mode="enemy">
        <div className="player-label tone-danger">
          {t.enemyUpNext(s(unit.name))}
          {intent && <span className="label-muted">{t.initiativeShort(intent.initiative)}</span>}
        </div>
        <p className="instruction">{intent ? s(intent.text) : t.noIntent}</p>
        <div className="button-row">
          <button
            className="button button-primary"
            data-action="advanceEnemy"
            onClick={() => dispatch({ k: 'advanceEnemy' })}
          >
            {t.next}
          </button>
        </div>
      </div>
    )
  }

  const turn = state.heroTurn
  if (!turn) return null
  const hero = unit as Hero

  // Choosing a card for an effect (Memory Shred, Echo).
  if (state.pending?.kind === 'card') {
    return (
      <div className="action-bar" data-mode="pickCard">
        <PlayerLabel hero={hero} />
        <p className="instruction highlight">{describePrompt(state.pending.prompt, lang)}</p>
        <div className="card-row">
          {state.pending.options.map((cardId) => (
            <CardView
              key={cardId}
              cardId={cardId}
              onClick={() => dispatch({ k: 'choose', value: cardId })}
            />
          ))}
        </div>
      </div>
    )
  }

  // Assigning which card gives the top half.
  if (!turn.topCard) {
    return (
      <div className="action-bar" data-mode="assignTop">
        <PlayerLabel hero={hero} />
        <p className="instruction">
          <Rich text={t.whichTopHalf} />
        </p>
        <div className="card-row">
          {hero.selected.map((cardId) => (
            <CardView
              key={cardId}
              cardId={cardId}
              selected
              initiative={hero.initiativeCard === cardId}
              onClick={() => dispatch({ k: 'assignTopCard', cardId })}
            />
          ))}
        </div>
      </div>
    )
  }

  const topCardId = turn.topCard
  const bottomCardId = turn.bottomCard
  const topCost = card(topCardId).top.flux ?? 0
  const bottomCost = bottomCardId ? (card(bottomCardId).bottom.flux ?? 0) : 0
  const bothDone = turn.topDone && turn.bottomDone

  return (
    <div className="action-bar" data-mode="playHalves">
      <PlayerLabel hero={hero} />

      {state.pending ? (
        <p className="instruction highlight">
          {describePrompt(state.pending.prompt, lang)} — {t.clickOnGrid}
        </p>
      ) : bothDone ? (
        <p className="instruction">{t.bothHalvesDone}</p>
      ) : (
        <p className="instruction">{t.pickHalfToPlay}</p>
      )}

      <div className="card-row">
        <CardView
          cardId={topCardId}
          selected
          initiative={hero.initiativeCard === topCardId}
          topState={turn.topDone ? 'done' : 'assigned'}
          bottomState="idle"
          topAffordable={topCost <= state.flux}
          onTop={state.pending ? undefined : () => dispatch({ k: 'playHalf', half: 'top' })}
        />
        {bottomCardId && (
          <CardView
            cardId={bottomCardId}
            selected
            initiative={hero.initiativeCard === bottomCardId}
            topState="idle"
            bottomState={turn.bottomDone ? 'done' : 'assigned'}
            bottomAffordable={bottomCost <= state.flux}
            onBottom={state.pending ? undefined : () => dispatch({ k: 'playHalf', half: 'bottom' })}
          />
        )}
      </div>

      {!state.pending && (
        <div className="button-row">
          <button
            className="button button-primary"
            data-action="endTurn"
            disabled={!bothDone}
            onClick={() => dispatch({ k: 'endTurn' })}
          >
            {t.endTurn}
          </button>
          {!turn.topDone && (
            <button
              className="button"
              data-action="skipTop"
              onClick={() => dispatch({ k: 'skipHalf', half: 'top' })}
            >
              {t.skipTop}
            </button>
          )}
          {!turn.bottomDone && (
            <button
              className="button"
              data-action="skipBottom"
              onClick={() => dispatch({ k: 'skipHalf', half: 'bottom' })}
            >
              {t.skipBottom}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PlayerLabel({ hero }: { hero: Hero }) {
  const { t, s } = useLang()
  return (
    <div
      className={`player-label ${hero.heroClass === 'runesmith' ? 'tone-rune' : 'tone-echo'}`}
    >
      {t.playerLabel(hero.playerSlot)} — {s(hero.name)}
    </div>
  )
}
