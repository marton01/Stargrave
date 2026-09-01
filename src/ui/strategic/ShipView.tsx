// The ship: power allocation, stations and crew.
//
// This is the screen the players will spend most of the game on, and the one
// place where the two of them genuinely have to negotiate: seven systems, one
// pool of reactor output. The rune core row is called out on purpose, because it
// is the line that ties this screen to the tactical grid.

import {
  crewAt,
  livingCrew,
  missionFlux,
  powerUsed,
  stationActive,
} from '../../engine/expedition/expedition'
import type { ExpeditionAction } from '../../engine/expedition/expedition'
import {
  STATIONS,
  STATION_ORDER,
  SYSTEMS,
  SYSTEM_ORDER,
  lifeSupportNeeded,
} from '../../content/ship'
import {
  CREW_TRAITS,
  RANK_NAMES,
  SPECIALITY_NAMES,
  crewRank,
  loyaltyBand,
} from '../../content/crew'
import { HERO_CLASSES } from '../../content/heroes'
import { portrait } from '../assets'
import { Portrait } from '../Portrait'
import { understandingTier } from '../../content/research'
import {
  describeStationCrew,
  describeStationYield,
  describeSystemYield,
  homeStations,
} from '../../i18n/describePower'
import { useLang } from '../../i18n/LangContext'
import { useState } from 'react'
import type { ExpeditionState } from '../../engine/expedition/types'
import type { StationId, SystemId } from '../../content/ship'
import type { UiKey } from '../../i18n/ui'

const TIER_KEY: UiKey[] = ['tier0', 'tier1', 'tier2', 'tier3']

/**
 * Whose console a row belongs to.
 *
 * The domains were in the data from the beginning and nothing ever showed them,
 * so the ship screen was one long list two people scrolled past together. With a
 * filter it becomes two screens that happen to share a reactor: each player can
 * look at their own half, and what is marked shared is visibly the thing they
 * have to settle between them.
 */
type Domain = 'engineering' | 'research' | 'shared'

const DOMAIN_KEY: Record<Domain, UiKey> = {
  engineering: 'domainEngineering',
  research: 'domainResearch',
  shared: 'domainShared',
}

/** Which hero holds a domain, for the filter's labels. */
const DOMAIN_HERO: Record<Domain, 'runesmith' | 'echoreader' | null> = {
  engineering: 'runesmith',
  research: 'echoreader',
  shared: null,
}

export function ShipView({
  state,
  dispatch,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
}) {
  const { t, s, lang } = useLang()
  // null is "everything". A filter, not a lock: the other half stays readable,
  // because a co-operative game where you cannot see your partner's screen is
  // just two solitaires.
  const [only, setOnly] = useState<Domain | null>(null)
  const shown = (domain: Domain) => only === null || domain === only || domain === 'shared'
  const used = powerUsed(state)
  const free = state.reactorOutput - used
  const crew = livingCrew(state)
  const lifeNeeded = lifeSupportNeeded(crew.length)

  return (
    <div className="ship">
      <section className="panel">
        <header className="panel-head">
          <h2>{t.powerHeading}</h2>
          <span className="panel-meta">
            {t.reactor} {state.reactorOutput} · {t.powerAllocated} {used} · {t.powerFree} {free}
          </span>
        </header>
        <p className="panel-intro">{t.powerIntro(state.reactorOutput, free)}</p>

        <div className="domain-filter" title={t.domainHint}>
          <span className="domain-filter-label">{t.commandFilter}:</span>
          <button
            className={`button button-small ${only === null ? 'button-primary' : ''}`}
            data-action="domainFilter"
            data-domain="all"
            onClick={() => setOnly(null)}
          >
            {t.commandAll}
          </button>
          {(['engineering', 'research'] as Domain[]).map((domain) => (
            <button
              key={domain}
              className={`button button-small ${only === domain ? 'button-primary' : ''}`}
              data-action="domainFilter"
              data-domain={domain}
              onClick={() => setOnly(domain)}
            >
              {s(HERO_CLASSES[DOMAIN_HERO[domain]!].name)} · {t[DOMAIN_KEY[domain]] as string}
            </button>
          ))}
        </div>



        <div className="power-rows">
          {SYSTEM_ORDER.filter((id) => shown(SYSTEMS[id].domain)).map((id) => (
            <PowerRow
              key={id}
              state={state}
              system={id}
              value={state.power[id]}
              free={free}
              warn={id === 'lifeSupport' && state.power[id] < lifeNeeded}
              highlight={id === 'runeCore'}
              onSet={(value) => dispatch({ k: 'setPower', system: id, value })}
            />
          ))}
        </div>

        <p className="flux-preview">
          <strong>{t.fluxPreview(missionFlux(state))}</strong> {t.fluxPreviewHint}
        </p>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>{t.stationsHeading}</h2>
          <span className="panel-meta">
            {t.understanding}: {state.understanding} · {t[TIER_KEY[understandingTier(state.understanding)]!] as string}
          </span>
        </header>
        <p className="panel-intro">{t.stationsIntro}</p>

        <div className="station-grid">
          {STATION_ORDER.filter((id) => shown(STATIONS[id].domain)).map((id) => {
            const def = STATIONS[id]
            const here = crewAt(state, id)
            const running = stationActive(state, id)
            const powered = state.power[def.needs] > 0
            return (
              <div key={id} className={`station ${running ? 'station-on' : ''}`}>
                <div className="station-head">
                  <span className="station-name">{s(def.name)}</span>
                  <span className={`domain-badge domain-${def.domain}`}>
                    {t[DOMAIN_KEY[def.domain]] as string}
                  </span>
                  <span className={`station-state ${running ? 'good' : powered ? '' : 'bad'}`}>
                    {running ? t.stationRunning : powered ? t.stationEmpty : t.stationNoPower}
                  </span>
                </div>
                <p className="station-effect">{s(def.effect)}</p>
                {(() => {
                  const output = describeStationYield(state, id, lang)
                  return output ? <p className="station-yield">{output}</p> : null
                })()}
                {(() => {
                  // Where the number came from. Without this the station gives a
                  // figure and never says why, which is how two navigators on one
                  // station producing different amounts became a mystery.
                  const breakdown = describeStationCrew(state, id, lang)
                  return breakdown ? <p className="station-breakdown">{breakdown}</p> : null
                })()}
                <p className="station-needs">
                  {s(SYSTEMS[def.needs].name)} · {s(SPECIALITY_NAMES[def.speciality])} ·{' '}
                  {here.length}/{def.slots}
                </p>
                <div className="station-crew">
                  {here.map((member) => (
                    <button
                      key={member.id}
                      className="crew-chip on"
                      data-action="unassign"
                      onClick={() => dispatch({ k: 'assignCrew', crewId: member.id, station: null })}
                      title={t.unassign}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {state.debts.length > 0 && (
        <section className="panel">
          <header className="panel-head">
            <h2>{t.debtsHeading}</h2>
            <span className="panel-meta">{t.debtsMeta(state.debts.length)}</span>
          </header>
          <p className="panel-intro">{t.debtsIntro}</p>
          <div className="debt-list">
            {[...state.debts]
              .sort((a, b) => a.at - b.at)
              .map((debt, i) => (
                <div key={i} className="debt">
                  <span className="debt-when">{t.debtIn(Math.max(0, debt.at - state.week))}</span>
                  <span className="debt-note">{s(debt.note)}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="panel">
        <header className="panel-head">
          <h2>{t.crewHeading}</h2>
          <span className="panel-meta">{crew.length}</span>
        </header>

        <div className="crew-list">
          {state.crew.map((member) => (
            <div key={member.id} className={`crew-card ${member.alive ? '' : 'crew-dead'}`}>
              <div className="crew-head">
                <Portrait path={portrait.crew(member.speciality)} />
                <span className="crew-name">{member.name}</span>
                <span className="crew-speciality">{s(SPECIALITY_NAMES[member.speciality])}</span>
              </div>
              <p className="crew-home">
                {t.crewHome(homeStations(member.speciality, lang))}
              </p>
              {member.alive && (
                <p className={`crew-loyalty tone-${loyaltyBand(member).tone}`}>
                  {t.crewLoyalty(s(loyaltyBand(member).name), member.loyalty)}
                </p>
              )}
              <div className="crew-traits">
                <span className={`trait trait-rank rank-${crewRank(member)}`}>
                  {s(RANK_NAMES[crewRank(member)])}
                </span>
                {member.mentor && (
                  <span className="trait trait-mentor">
                    {t.menteeOther(s(HERO_CLASSES[member.mentor].name))}
                  </span>
                )}
                {member.traits.map((trait) => (
                  <span key={trait} className="trait" title={s(CREW_TRAITS[trait].description)}>
                    {s(CREW_TRAITS[trait].name)}
                  </span>
                ))}
              </div>
              {member.alive ? (
                <div className="crew-post">
                  <select
                    value={member.station ?? ''}
                    onChange={(event) =>
                      dispatch({
                        k: 'assignCrew',
                        crewId: member.id,
                        station: (event.target.value || null) as StationId | null,
                      })
                    }
                  >
                    <option value="">{t.crewUnassigned}</option>
                    {STATION_ORDER.map((id) => (
                      <option key={id} value={id}>
                        {s(STATIONS[id].name)}
                      </option>
                    ))}
                  </select>
                  <span className="crew-weeks">{t.crewWeeks(member.weeksAboard)}</span>
                </div>
              ) : (
                <span className="crew-lost">{t.crewLostLabel}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function PowerRow({
  system,
  value,
  free,
  warn,
  highlight,
  onSet,
  state,
}: {
  system: SystemId
  value: number
  free: number
  warn: boolean
  highlight: boolean
  onSet: (value: number) => void
  state: ExpeditionState
}) {
  const { s, lang } = useLang()
  const def = SYSTEMS[system]
  // What this allocation is actually buying, in numbers. This is the line that
  // makes the screen a decision rather than a row of pips.
  const output = describeSystemYield(state, system, lang)

  return (
    <div className={`power-row ${highlight ? 'power-row-key' : ''} ${warn ? 'power-row-warn' : ''}`}>
      <span className="power-icon">{def.icon}</span>
      <div className="power-text">
        <span className="power-name">{s(def.name)}</span>
        <span className="power-desc">{s(def.description)}</span>
        <span className={`power-yield ${output.warn ? 'power-yield-warn' : ''}`}>{output.text}</span>
      </div>
      <div className="power-pips">
        {Array.from({ length: def.max }, (_, i) => (
          <button
            key={i}
            className={`pip ${i < value ? 'pip-on' : ''}`}
            data-action="setPower"
            data-system={system}
            data-value={i + 1}
            disabled={i >= value && free <= 0}
            onClick={() => onSet(i < value ? i : i + 1)}
            aria-label={`${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
