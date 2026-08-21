// Encounters, and the market.
//
// The encounter screen is where most of the game's stories happen, so it reads
// like a page rather than a form. Choices that cannot be taken are still shown —
// seeing what you *could* have done with two more shield power is half of why
// the power allocation matters.

import { encounter } from '../../content/encounters'
import type { EncounterChoice, EncounterCost } from '../../content/encounters'
import {
  choiceAffordable,
  choiceAvailable,
  payableCards,
} from '../../engine/expedition/expedition'
import type { ExpeditionAction } from '../../engine/expedition/expedition'
import { CardView } from '../CardView'
import { mapNode } from '../../engine/expedition/starmap'
import { MODULES, RESOURCES } from '../../content/ship'
import { SPECIALITY_NAMES } from '../../content/crew'
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
      ) : cardCost && cardCost.k === 'cards' ? (
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
          <div className="button-row">
            <button
              className="button button-primary"
              data-action="encounterConfirm"
              disabled={pending.payment.length < cardCost.count}
              onClick={() => dispatch({ k: 'encounterConfirm' })}
            >
              {t.encounterConfirm}
            </button>
          </div>
        </>
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
  const { t, s } = useLang()
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
      {!available && <span className="choice-reason">{t.encounterRequirementUnmet}</span>}
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
              <button
                className="button"
                data-action="marketBuy"
                disabled={offer.bought || tooDear}
                onClick={() => dispatch({ k: 'marketBuy', index })}
              >
                {offer.bought ? t.marketBought : tooDear ? t.marketTooExpensive : t.marketBuy}
              </button>
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
