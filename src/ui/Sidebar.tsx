// Sidebar: initiative order, heroes, enemies with their intents, and the log.
//
// The enemy's intent is the single most important piece of information on the
// screen — which is why it sits high up and is written as a whole sentence
// rather than as icons.

import { card } from '../content/cards'
import { describeLogEvent } from '../i18n/describe'
import { enemies, followers, heroes, isFollower, isHero, livingFollowers } from '../engine/state'
import {
  FOLLOWER_ORDERS,
  FOLLOWER_ORDER_HINTS,
  FOLLOWER_ORDER_NAMES,
} from '../engine/followers'
import { HERO_TONE } from './gridStyle'
import type { FollowerOrder } from '../engine/types'
import { intentOf } from '../content/enemies'
import { STATUS_NAMES } from '../content/statuses'
import { bondActive } from '../engine/combat'
import { portrait } from './assets'
import { Portrait } from './Portrait'
import { useLang } from '../i18n/LangContext'
import type { BattleState, StatusKind, Unit } from '../engine/types'

function StatusBadges({ unit }: { unit: Unit }) {
  const { s } = useLang()
  const kinds = (Object.keys(unit.statuses) as StatusKind[]).filter(
    (k) => (unit.statuses[k] ?? 0) > 0,
  )
  if (kinds.length === 0) return null
  return (
    <div className="statuses">
      {kinds.map((k) => (
        <span key={k} className={`status status-${k}`}>
          {s(STATUS_NAMES[k])} {unit.statuses[k]}
        </span>
      ))}
    </div>
  )
}

function HpBar({ unit }: { unit: Unit }) {
  return (
    <div className="hp">
      <div
        className={`hp-fill ${unit.side === 'hero' ? 'hp-hero' : 'hp-enemy'}`}
        style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
      />
      <span className="hp-number">
        {unit.hp}/{unit.maxHp}
      </span>
    </div>
  )
}

export function Sidebar({
  state,
  onOrderFollower,
  mySeats,
}: {
  state: BattleState
  /** Give a follower a standing order. Absent when nobody may. */
  onOrderFollower?: (followerId: string, order: FollowerOrder) => void
  /** Which seats this browser runs. Empty means hotseat: everybody. */
  mySeats?: number[]
}) {
  const { t, s, lang } = useLang()
  const activeId = state.phase === 'resolution' ? state.order[state.orderIndex] : undefined

  return (
    <aside className="sidebar">
      {state.phase === 'resolution' && (
        <section className="block">
          <h3>{t.initiative}</h3>
          <ol className="order">
            {state.order.map((id, index) => {
              const u = state.units.find((x) => x.id === id)
              if (!u || !u.alive) return null
              // A follower has no number of their own: they go half a step after
              // the hero who taught them, so the list shows their mentor's.
              const mentorUnit = isFollower(u)
                ? state.units.find((x) => isHero(x) && x.heroClass === u.mentor && x.alive)
                : undefined
              const initiative = isHero(u)
                ? u.resting || !u.initiativeCard
                  ? 99
                  : card(u.initiativeCard).initiative
                : isFollower(u)
                  ? isHero(mentorUnit) && mentorUnit.initiativeCard
                    ? card(mentorUnit.initiativeCard).initiative
                    : 98
                  : u.side === 'enemy' && u.intent
                    ? intentOf(u.enemyType, u.intent).initiative
                    : 99
              return (
                <li
                  key={id}
                  className={[
                    'order-item',
                    id === activeId ? 'order-active' : '',
                    index < state.orderIndex ? 'order-done' : '',
                    isFollower(u)
                      ? 'order-follower'
                      : u.side === 'hero'
                        ? 'order-hero'
                        : 'order-enemy',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="order-number">{initiative}</span>
                  <span className="order-name">{s(u.name)}</span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="block">
        <h3>{t.yourTeam}</h3>
        {heroes(state).map((h) => (
          <div key={h.id} className={`unit-card ${h.alive ? '' : 'unit-dead'}`}>
            <div className="unit-head">
              <Portrait path={portrait.hero(h.heroClass)} />
              <span
                className={`unit-name ${HERO_TONE[h.heroClass]}`}
              >
                {s(h.name)}
              </span>
              <span className="unit-player">{t.playerLabel(h.playerSlot)}</span>
            </div>
            {h.alive ? (
              <>
                <HpBar unit={h} />
                <StatusBadges unit={h} />
                {bondActive(state, h) && (
                  <div className="bond" title={t.bondHint}>
                    {t.bondActive}
                  </div>
                )}
                <div className="card-counts">
                  <span title={t.inHand}>✋ {h.hand.length}</span>
                  <span title={t.inDiscard}>⟳ {h.discard.length}</span>
                  <span title={t.lostForever} className={h.lost.length > 0 ? 'counts-loss' : ''}>
                    ✕ {h.lost.length}
                  </span>
                </div>
              </>
            ) : (
              <div className="unit-state-text">
                {h.exhausted ? t.statusExhausted : t.statusFallen}
              </div>
            )}
          </div>
        ))}
      </section>

      {livingFollowers(state).length > 0 && (
        <section className="block">
          <h3>{t.followersHeading}</h3>
          {followers(state).map((f) => {
            // Only the seat that teaches them gives the orders. Everybody sees
            // the person and what they were told; one player decides.
            const mine = !mySeats || mySeats.length === 0 || mySeats.includes(f.playerSlot)
            return (
              <div key={f.id} className={`unit-card unit-follower ${f.alive ? '' : 'unit-dead'}`}>
                <div className="unit-head">
                  <span className={`unit-name ${HERO_TONE[f.mentor]}`}>{s(f.name)}</span>
                  <span className="unit-player">{t.playerLabel(f.playerSlot)}</span>
                </div>
                {f.alive ? (
                  <>
                    <HpBar unit={f} />
                    <StatusBadges unit={f} />
                    <div className="follower-orders">
                      {FOLLOWER_ORDERS.map((order) => (
                        <button
                          key={order}
                          type="button"
                          className={`chip ${f.order === order ? 'chip-on' : ''}`}
                          data-action="orderFollower"
                          data-order={order}
                          disabled={!mine || !onOrderFollower}
                          title={s(FOLLOWER_ORDER_HINTS[order])}
                          onClick={() => onOrderFollower?.(f.id, order)}
                        >
                          {s(FOLLOWER_ORDER_NAMES[order])}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="unit-state-text">{t.followerFallen}</div>
                )}
              </div>
            )
          })}
        </section>
      )}

      <section className="block">
        <h3>{t.enemy}</h3>
        {enemies(state).filter((e) => e.alive).length === 0 && (
          <p className="muted">{t.noEnemiesLeft}</p>
        )}
        {enemies(state)
          .filter((e) => e.alive)
          .map((e) => {
            const intent = e.intent ? intentOf(e.enemyType, e.intent) : null
            return (
              <div key={e.id} className={`unit-card ${e.id === activeId ? 'unit-active' : ''}`}>
                <div className="unit-head">
                  <Portrait path={portrait.enemy(e.enemyType)} />
                  <span className="unit-name tone-danger">{s(e.name)}</span>
                  {intent && <span className="initiative-badge">{intent.initiative}</span>}
                </div>
                <HpBar unit={e} />
                <StatusBadges unit={e} />
                {intent ? (
                  <div className="intent">{s(intent.text)}</div>
                ) : (
                  <div className="intent muted">{t.noIntentYet}</div>
                )}
              </div>
            )
          })}
      </section>

      <section className="block block-log">
        <h3>{t.logHeading}</h3>
        <div className="log">
          {[...state.log]
            .reverse()
            .slice(0, 40)
            .map((entry, index) => (
              <div key={`${entry.round}-${index}`} className="log-line">
                <span className="log-round">{entry.round}.</span>{' '}
                {describeLogEvent(entry.event, lang)}
              </div>
            ))}
        </div>
      </section>
    </aside>
  )
}
