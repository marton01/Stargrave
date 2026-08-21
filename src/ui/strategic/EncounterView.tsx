// Encounters, and the market.
//
// The encounter screen is where most of the game's stories happen, so it reads
// like a page rather than a form. Choices that cannot be taken are still shown —
// seeing what you *could* have done with two more shield power is half of why
// the power allocation matters.

import { encounter } from '../../content/encounters'
import type { EncounterChoice, EncounterCost, EncounterEffect } from '../../content/encounters'
import {
  choiceAffordable,
  choiceAvailable,
  payableCards,
} from '../../engine/expedition/expedition'
import type { ExpeditionAction } from '../../engine/expedition/expedition'
import { useState } from 'react'
import { CardView } from '../CardView'
import { mapNode } from '../../engine/expedition/starmap'
import { MODULES, RESOURCES } from '../../content/ship'
import { SPECIALITY_NAMES } from '../../content/crew'
import { describeChoice, describeRequirement } from '../../i18n/describeChoice'
import { useLang } from '../../i18n/LangContext'
import type { ExpeditionState } from '../../engine/expedition/types'

function CostLabel({ cost }: { cost: EncounterCost }) {
  const { t, s } = useLang()
  if (cost.k === 'resource') {
    return (
      <span className="cost">
        {s(RESOURCES[cost.id].name)} −{cost.amount}
      </span>
    )
  }
  if (cost.k === 'weeks') return <span className="cost">{t.costWeeks(cost.amount)}</span>
  return (
    <span className="cost cost-cards">
      {t.costCards(cost.count)} {cost.symbol === 'force' ? '⚒' : '◈'}
    </span>
  )
}

/**
 * What a decision asks and what it gives, side by side.
 *
 * Both halves come from the same data the engine applies, so the account cannot
 * promise something the resolution will not do.
 */
export function Account({
  costs,
  effects,
  compact,
}: {
  costs: readonly EncounterCost[]
  effects: readonly EncounterEffect[]
  compact?: boolean
}) {
  const { t, lang } = useLang()
  const account = describeChoice(costs, effects, lang)
  if (account.costs.length === 0 && account.effects.length === 0) {
    return <p className="account-empty">{t.accountNothing}</p>
  }

  return (
    <div className={`account ${compact ? 'account-compact' : ''}`.trim()}>
      {account.costs.length > 0 && (
        <div className="account-side">
          <span className="account-label">{t.accountCosts}</span>
          <ul>
            {account.costs.map((line, i) => (
              <li key={i} className={`tone-${line.tone}`}>
                {line.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {account.effects.length > 0 && (
        <div className="account-side">
          <span className="account-label">{t.accountEffects}</span>
          <ul>
            {account.effects.map((line, i) => (
              <li key={i} className={`tone-${line.tone}`}>
                {line.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function EncounterView({
  state,
  dispatch,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
}) {
  const { t, s } = useLang()
  const pending = state.pendingEncounter
  if (!pending) return null
  const def = encounter(pending.id)
  const chosen = pending.chosen !== null ? def.choices[pending.chosen] : null
  const cardCost = chosen?.costs.find((c) => c.k === 'cards')

  return (
    <div className="encounter" data-encounter={def.id}>
      <header className="encounter-head">
        <span className="encounter-label">{t.encounterHeading}</span>
        <h2>{s(def.title)}</h2>
      </header>

      <p className="encounter-text">{s(def.text)}</p>

      {pending.resolvedText ? (
        <>
          <p className="encounter-result">{s(pending.resolvedText)}</p>
          <div className="button-row">
            <button
              className="button button-primary"
              data-action="encounterClose"
              onClick={() => dispatch({ k: 'encounterClose' })}
            >
              {t.encounterContinue}
            </button>
          </div>
        </>
      ) : chosen ? (
        // The account of a choice that has been picked but not taken. This is the
        // whole point of the two-step: what it costs and what it does, in words,
        // while there is still a way back.
        <div className="proposal">
          <p className="proposal-choice">{s(chosen.text)}</p>
          <Account costs={chosen.costs} effects={chosen.effects} />

          {cardCost && cardCost.k === 'cards' && (
            <>
              <p className="encounter-prompt">{t.encounterPayCards(cardCost.count)}</p>
              <p className="panel-meta">
                {t.encounterPaySelected(pending.payment.length, cardCost.count)}
              </p>
              <div className="card-row">
                {payableCards(state, cardCost.symbol).map(({ heroClass, cardId }) => {
                  const token = `${heroClass}:${cardId}`
                  return (
                    <CardView
                      key={token}
                      cardId={cardId}
                      selected={pending.payment.includes(token)}
                      onClick={() => dispatch({ k: 'encounterPayCard', heroClass, cardId })}
                    />
                  )
                })}
              </div>
            </>
          )}

          <div className="button-row">
            <button
              className="button button-primary"
              data-action="encounterConfirm"
              disabled={cardCost && cardCost.k === 'cards' ? pending.payment.length < cardCost.count : false}
              onClick={() => dispatch({ k: 'encounterConfirm' })}
            >
              {t.encounterConfirm}
            </button>
            <button
              className="button"
              data-action="encounterCancel"
              onClick={() => dispatch({ k: 'encounterCancel' })}
            >
              {t.encounterBack}
            </button>
          </div>
        </div>
      ) : (
        <div className="choice-list">
          {def.choices.map((choice, index) => (
            <ChoiceRow
              key={index}
              state={state}
              choice={choice}
              onPick={() => dispatch({ k: 'encounterChoose', index })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ChoiceRow({
  state,
  choice,
  onPick,
}: {
  state: ExpeditionState
  choice: EncounterChoice
  onPick: () => void
}) {
  const { t, s, lang } = useLang()
  const available = choiceAvailable(state, choice)
  const affordable = choiceAffordable(state, choice)
  const enabled = available && affordable

  return (
    <button
      className={`choice ${enabled ? '' : 'choice-locked'}`}
      data-action="encounterChoose"
      disabled={!enabled}
      onClick={onPick}
    >
      <span className="choice-text">{s(choice.text)}</span>
      <span className="choice-costs">
        {choice.costs.map((cost, i) => (
          <CostLabel key={i} cost={cost} />
        ))}
      </span>
      {!available && choice.requires && (
        <span className="choice-reason">{describeRequirement(choice.requires, lang)}</span>
      )}
      {available && !affordable && (
        <span className="choice-reason">{t.encounterUnaffordable}</span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------- market

export function MarketView({
  state,
  dispatch,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
}) {
  const { t, s } = useLang()
  // Spending is not undoable either, so a purchase is asked for twice.
  const [confirming, setConfirming] = useState<number | null>(null)
  const node = mapNode(state.map, state.at)
  if (node.event.k !== 'market') return null
  const offers = node.event.offers

  return (
    <div className="market">
      <header className="panel-head">
        <h2>{t.marketHeading}</h2>
        <span className="panel-meta">
          {s(RESOURCES.credits.name)}: {state.resources.credits}
        </span>
      </header>

      <div className="offer-list">
        {offers.map((offer, index) => {
          const label =
            offer.item.k === 'resource'
              ? `${s(RESOURCES[offer.item.id].name)} +${offer.item.amount}`
              : offer.item.k === 'module'
                ? s(MODULES[offer.item.id].name)
                : `${t.marketCrew}: ${offer.item.member.name}`
          const detail =
            offer.item.k === 'module'
              ? s(MODULES[offer.item.id].description)
              : offer.item.k === 'crew'
                ? `${s(SPECIALITY_NAMES[offer.item.member.speciality])}`
                : ''
          const tooDear = state.resources.credits < offer.price
          return (
            <div key={index} className={`offer ${offer.bought ? 'offer-bought' : ''}`}>
              <div className="offer-text">
                <strong>{label}</strong>
                {detail && <span className="offer-detail">{detail}</span>}
              </div>
              <span className="offer-price">{offer.price} ✧</span>
              {confirming === index ? (
                <span className="offer-confirm">
                  <button
                    className="button button-primary button-small"
                    data-action="marketBuy"
                    onClick={() => {
                      dispatch({ k: 'marketBuy', index })
                      setConfirming(null)
                    }}
                  >
                    {t.marketConfirm(offer.price)}
                  </button>
                  <button
                    className="button button-small"
                    data-action="marketCancel"
                    onClick={() => setConfirming(null)}
                  >
                    {t.encounterBack}
                  </button>
                </span>
              ) : (
                <button
                  className="button"
                  data-action="marketPick"
                  disabled={offer.bought || tooDear}
                  onClick={() => setConfirming(index)}
                >
                  {offer.bought ? t.marketBought : tooDear ? t.marketTooExpensive : t.marketBuy}
                </button>
              )}
            </div>
          )
        })}
        {offers.every((o) => o.bought) && <p className="muted">{t.marketEmpty}</p>}
      </div>

      <div className="button-row">
        <button
          className="button button-primary"
          data-action="closeMarket"
          onClick={() => dispatch({ k: 'openScreen', screen: 'starmap' })}
        >
          {t.close}
        </button>
      </div>
    </div>
  )
}
