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
import { CREW_TRAITS, SPECIALITY_NAMES } from '../../content/crew'
import { portrait } from '../assets'
import { Portrait } from '../Portrait'
import { understandingTier } from '../../content/research'
import { useLang } from '../../i18n/LangContext'
import type { ExpeditionState } from '../../engine/expedition/types'
import type { StationId, SystemId } from '../../content/ship'
import type { UiKey } from '../../i18n/ui'

const TIER_KEY: UiKey[] = ['tier0', 'tier1', 'tier2', 'tier3']

export function ShipView({
  state,
  dispatch,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
}) {
  const { t, s } = useLang()
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
        <p className="panel-intro">{t.powerIntro}</p>

        <div className="power-rows">
          {SYSTEM_ORDER.map((id) => (
            <PowerRow
              key={id}
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
          {STATION_ORDER.map((id) => {
            const def = STATIONS[id]
            const here = crewAt(state, id)
            const running = stationActive(state, id)
            const powered = state.power[def.needs] > 0
            return (
              <div key={id} className={`station ${running ? 'station-on' : ''}`}>
                <div className="station-head">
                  <span className="station-name">{s(def.name)}</span>
                  <span className={`station-state ${running ? 'good' : powered ? '' : 'bad'}`}>
                    {running ? t.stationRunning : powered ? t.stationEmpty : t.stationNoPower}
                  </span>
                </div>
                <p className="station-effect">{s(def.effect)}</p>
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
              <div className="crew-traits">
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
}: {
  system: SystemId
  value: number
  free: number
  warn: boolean
  highlight: boolean
  onSet: (value: number) => void
}) {
  const { s } = useLang()
  const def = SYSTEMS[system]

  return (
    <div className={`power-row ${highlight ? 'power-row-key' : ''} ${warn ? 'power-row-warn' : ''}`}>
      <span className="power-icon">{def.icon}</span>
      <div className="power-text">
        <span className="power-name">{s(def.name)}</span>
        <span className="power-desc">{s(def.description)}</span>
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
