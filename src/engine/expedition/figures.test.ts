// People who come back.
//
// The thing that makes a figure worth building is that the galaxy remembers you.
// So the tests are about memory and about reachability:
//
//   **They can actually be met.** A registered encounter that is only in the
//   lookup index can be resolved but never found — which is exactly what
//   happened to these the first time: content nothing could reach.
//
//   **They come back with a date.** Never an ambush: the return is an ordinary
//   dated debt, announced in the log and listed on the ship screen.
//
//   **The scene is chosen when they arrive, not when they leave.** Four weeks of
//   behaving differently has to be able to change which door they come through,
//   or standing is a number that does nothing.

import { describe, expect, it } from 'vitest'
import { newArchive } from './archive'
import { HERO_ORDER, expeditionStep, startExpedition } from './expedition'
import { FIGURE_DEFS, FIGURE_ENCOUNTERS, figureDef } from '../../content/figures'
import { encountersFor, findEncounter } from '../../content/encounters'
import { defaultDials } from '../../content/difficulty'
import type { ExpeditionState } from './types'

function ship(): ExpeditionState {
  const s = startExpedition(
    777,
    'medium',
    newArchive(),
    { ...defaultDials(), directives: 1, attention: 1, aboard: 1 },
    HERO_ORDER,
  )
  s.map.nodes.find((n) => n.id === s.at)!.resolved = true
  return s
}

describe('somebody you can actually meet', () => {
  it('offers every first meeting on the map', () => {
    for (const def of FIGURE_DEFS) {
      const first = FIGURE_ENCOUNTERS.find((e) => e.figure?.id === def.id && e.figure.stage === 0)
      expect(first, `${def.id} has no first meeting`).toBeDefined()
      const pool = encountersFor(first!.tags, [], true)
      expect(pool.map((e) => e.id), `${def.id} can never be met`).toContain(first!.id)
    }
  })

  it('keeps every later scene out of the map pool', () => {
    // Only the dated return may open these. A stage-two scene found at a place
    // would be somebody catching up with you before you had met them.
    for (const scene of FIGURE_ENCOUNTERS.filter((e) => (e.figure?.stage ?? 0) > 0)) {
      expect(scene.chained, `${scene.id} is loose on the map`).toBe(true)
    }
  })

  it('has every scene it promises, in both languages', () => {
    for (const def of FIGURE_DEFS) {
      for (const stage of def.scenes) {
        for (const id of [stage.warm, stage.cold]) {
          const scene = findEncounter(id)
          expect(scene, `${def.id}: ${id} does not exist`).toBeDefined()
          expect(scene!.choices.length).toBeGreaterThanOrEqual(1)
          for (const choice of scene!.choices) {
            expect(choice.text.hu.length).toBeGreaterThan(3)
            expect(choice.text.en.length).toBeGreaterThan(3)
          }
        }
      }
    }
  })
})

describe('they remember', () => {
  /** Answer the first meeting with a given choice, and return the state after. */
  function meet(figure: string, index: number): ExpeditionState {
    let s = ship()
    const first = FIGURE_ENCOUNTERS.find((e) => e.figure?.id === figure && e.figure.stage === 0)!
    s.pendingEncounter = { id: first.id, chosen: null, payment: [], resolvedText: null }
    s = expeditionStep(s, { k: 'encounterChoose', index })
    s = expeditionStep(s, { k: 'encounterConfirm' })
    return expeditionStep(s, { k: 'encounterClose' })
  }

  it('writes down how you treated them, and says when they will be back', () => {
    const after = meet('ordrec', 0)
    expect(after.figures.ordrec?.standing).toBeGreaterThan(0)
    const coming = after.debts.filter((d) => d.kind === 'figure' && d.figure === 'ordrec')
    expect(coming, 'nobody is coming back').toHaveLength(1)
    // Never an ambush: it is dated, and it is in the log.
    expect(coming[0]!.at).toBeGreaterThan(after.week + 1)
    expect(after.log.some((e) => e.event.k === 'figureExpected')).toBe(true)
  })

  it('brings the warm scene to a run that treated them well, and the cold one to a run that did not', () => {
    function sceneAfter(index: number): string | undefined {
      let s = meet('ordrec', index)
      for (let i = 0; i < 12 && !s.pendingEncounter && !s.outcome; i++) {
        s = expeditionStep(s, { k: 'advanceWeek' })
      }
      return s.pendingEncounter?.id
    }
    const def = figureDef('ordrec')!
    const kind = sceneAfter(0)
    const cruel = sceneAfter(1)
    expect(kind).toBe(def.scenes[0]!.warm)
    expect(cruel).toBe(def.scenes[0]!.cold)
  })

  it('stops after the scenes run out', () => {
    let s = meet('envoy', 0)
    for (let i = 0; i < 40 && !s.outcome; i++) {
      s = expeditionStep(s, { k: 'advanceWeek' })
      if (s.pendingEncounter) {
        s = expeditionStep(s, { k: 'encounterChoose', index: 0 })
        s = expeditionStep(s, { k: 'encounterConfirm' })
        s = expeditionStep(s, { k: 'encounterClose' })
      }
    }
    // Three meetings is a story; four is a serial.
    expect(s.figures.envoy?.stage ?? 0).toBeLessThanOrEqual(figureDef('envoy')!.scenes.length)
    expect(s.debts.some((d) => d.kind === 'figure' && d.figure === 'envoy')).toBe(false)
  })
})
