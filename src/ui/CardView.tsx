// A single ability card.
//
// The two halves read separately, and the initiative number is the most
// prominent element — because planning a round starts with who acts when.

import { card } from '../content/cards'
import { cardArt, useOptionalImage } from './assets'
import { HERO_CLASSES } from '../content/heroes'
import { HERO_COLOR } from './gridStyle'
import { Shape, ShapeDefs } from './shapes'
import type { HeroClassId } from '../engine/types'
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
    <div
      className={className}
      onClick={onClick}
      data-card-id={cardId}
      data-card-class={c.heroClass}
      data-selected={!!selected}
    >
      {art ? (
        <div className="card-art" style={{ backgroundImage: `url(${art})` }} />
      ) : (
        <CardMark heroClass={c.heroClass} />
      )}

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

/**
 * The owner's mark, drawn behind a card that has no art file.
 *
 * A hand of cards used to be a wall of identical grey rectangles, and with four
 * heroes at the table that is the wrong thing for it to be: whose hand this is
 * should be the first thing you see, before you read a single word. The mark is
 * the same figure the board draws, faint, in the class colour — no download, and
 * it steps aside the moment real art is dropped in for the card.
 */
function CardMark({ heroClass }: { heroClass: HeroClassId }) {
  return (
    <svg className="card-mark" viewBox="0 0 1 1" aria-hidden="true">
      <ShapeDefs />
      <Shape shape={HERO_CLASSES[heroClass].shape} color={HERO_COLOR[heroClass]} />
    </svg>
  )
}
