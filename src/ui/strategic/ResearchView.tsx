// Research: two branches, one pool of Information.
//
// The two columns sit side by side on purpose. Technology is obviously useful and
// understanding obviously is not — right up to the moment you stand in the Heart
// and find out which one mattered.

import { RESEARCH_PROJECTS, availableProjects, researchProject } from '../../content/research'
import type { ResearchBranch, ResearchProject } from '../../content/research'
import { MODULES, RESOURCES } from '../../content/ship'
import type { ExpeditionAction } from '../../engine/expedition/expedition'
import { useLang } from '../../i18n/LangContext'
import type { ExpeditionState } from '../../engine/expedition/types'

export function ResearchView({
  state,
  dispatch,
}: {
  state: ExpeditionState
  dispatch: (action: ExpeditionAction) => void
}) {
  const { t, s } = useLang()
  const available = availableProjects(state.research.completed)
  const active = state.research.active

  const column = (branch: ResearchBranch) =>
    RESEARCH_PROJECTS.filter((p) => p.branch === branch)

  return (
    <div className="research">
      <header className="panel-head">
        <h2>{t.researchHeading}</h2>
        <span className="panel-meta">
          {s(RESOURCES.information.name)}: {state.resources.information} · {t.understanding}:{' '}
          {state.understanding}
        </span>
      </header>
      <p className="panel-intro">{t.researchIntro}</p>

      <div className="research-active">
        {active ? (
          <>
            <strong>{t.researchActive}:</strong> {s(researchProject(active.id).name)} —{' '}
            {t.researchWeeksLeft(active.weeksLeft)}
          </>
        ) : (
          <span className="muted">{t.researchNone}</span>
        )}
      </div>

      <div className="research-columns">
        {(['technology', 'understanding'] as const).map((branch) => (
          <section key={branch} className={`research-branch branch-${branch}`}>
            <h3>{branch === 'technology' ? t.branchTechnology : t.branchUnderstanding}</h3>
            {column(branch).map((project) => (
              <ProjectRow
                key={project.id}
                state={state}
                project={project}
                startable={!active && available.some((p) => p.id === project.id)}
                onStart={() => dispatch({ k: 'startResearch', projectId: project.id })}
              />
            ))}
          </section>
        ))}
      </div>

      <section className="panel">
        <header className="panel-head">
          <h2>{t.modulesHeading}</h2>
        </header>
        {state.modules.length === 0 ? (
          <p className="muted">{t.modulesNone}</p>
        ) : (
          <ul className="module-list">
            {state.modules.map((id) => (
              <li key={id}>
                <strong>{s(MODULES[id].name)}</strong> — {s(MODULES[id].description)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function ProjectRow({
  state,
  project,
  startable,
  onStart,
}: {
  state: ExpeditionState
  project: ResearchProject
  startable: boolean
  onStart: () => void
}) {
  const { t, s } = useLang()
  const done = state.research.completed.includes(project.id)
  const missing = project.requires.filter((r) => !state.research.completed.includes(r))
  const tooDear = state.resources.information < project.cost

  return (
    <div className={`project ${done ? 'project-done' : ''}`}>
      <div className="project-head">
        <strong>{s(project.name)}</strong>
        <span className="project-cost">
          ◈ {project.cost} · {project.weeks} {t.historyWeek}
        </span>
      </div>
      <p className="project-desc">{s(project.description)}</p>
      {done ? (
        <span className="project-state good">{t.researchDone}</span>
      ) : missing.length > 0 ? (
        <span className="project-state">{t.researchLocked}</span>
      ) : (
        <button
          className="button button-small"
          data-action="startResearch"
          data-project={project.id}
          disabled={!startable || tooDear}
          onClick={onStart}
        >
          {tooDear ? t.researchTooExpensive : t.researchStart}
        </button>
      )}
    </div>
  )
}
