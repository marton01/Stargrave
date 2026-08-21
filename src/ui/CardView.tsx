// A single ability card.
//
// The two halves read separately, and the initiative number is the most
// prominent element — because planning a round starts with who acts when.

import { card } from '../content/cards'
import { cardArt, useOptionalImage } from './assets'
import { useLang } from '../i18n/LangContext'

export type HalfState = 'idle' | 'assigned' | 'done'

export type CardViewProps = {
  cardId: string
  /** Chosen for this round. */
  selected?: boolean
  /** This card provides the initiative. */
  initiative?: boolean
  topState?: HalfState
  bottomState?: HalfState
  faded?: boolean
  onClick?: () => void
  onTop?: () => void
  onBottom?: () => void
  /** Is there enough Flux for that half? */
  topAffordable?: boolean
  bottomAffordable?: boolean
}

export function CardView({
  cardId,
  selected,
  initiative,
  topState = 'idle',
  bottomState = 'idle',
  faded,
  onClick,
  onTop,
  onBottom,
  topAffordable = true,
  bottomAffordable = true,
}: CardViewProps) {
  const { t, s } = useLang()
  const c = card(cardId)
  // Optional art, drawn behind the text. Absent by default, and the card is
  // designed to be read without it.
  const art = useOptionalImage(cardArt(cardId))

  const className = [
    'card',
    selected ? 'card-selected' : '',
    faded ? 'card-faded' : '',
    onClick ? 'card-clickable' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} onClick={onClick} data-card-id={cardId} data-selected={!!selected}>
      {art && <div className="card-art" style={{ backgroundImage: `url(${art})` }} />}

      <div className="card-header">
        <span className={`card-initiative ${initiative ? 'card-initiative-active' : ''}`}>
          {c.initiative}
        </span>
        <span className="card-name">{s(c.name)}</span>
      </div>

      <HalfView
        which="top"
        label={t.cardTop}
        text={s(c.top.text)}
        flux={c.top.flux}
        lostOnUse={c.top.lostOnUse}
        state={topState}
        affordable={topAffordable}
        onPlay={onTop}
      />

      <div className="card-divider" />

      <HalfView
        which="bottom"
        label={t.cardBottom}
        text={s(c.bottom.text)}
        flux={c.bottom.flux}
        lostOnUse={c.bottom.lostOnUse}
        state={bottomState}
        affordable={bottomAffordable}
        onPlay={onBottom}
      />
    </div>
  )
}

function HalfView({
  which,
  label,
  text,
  flux,
  lostOnUse,
  state,
  affordable,
  onPlay,
}: {
  which: 'top' | 'bottom'
  label: string
  text: string
  flux: number | undefined
  lostOnUse: boolean | undefined
  state: HalfState
  affordable: boolean
  onPlay: (() => void) | undefined
}) {
  const { t } = useLang()
  const playable = !!onPlay && state === 'assigned' && affordable

  return (
    <div
      className={[
        'card-half',
        state === 'done' ? 'card-half-done' : '',
        state === 'assigned' ? 'card-half-assigned' : '',
        playable ? 'card-half-playable' : '',
        !affordable && state === 'assigned' ? 'card-half-unaffordable' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-half={which}
      data-playable={playable}
      onClick={
        playable
          ? (event) => {
              event.stopPropagation()
              onPlay?.()
            }
          : undefined
      }
    >
      <div className="card-half-label">
        <span>{label}</span>
        <span className="card-marks">
          {flux ? <span className="card-flux">⟐{flux}</span> : null}
          {lostOnUse ? (
            <span className="card-lost" title={t.cardLostHint}>
              ✕
            </span>
          ) : null}
          {state === 'done' ? <span className="card-tick">✓</span> : null}
        </span>
      </div>
      <div className="card-half-text">{text}</div>
    </div>
  )
}
