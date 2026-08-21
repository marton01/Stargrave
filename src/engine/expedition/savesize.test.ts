import { describe, expect, it } from 'vitest'
import { expeditionStep, startExpedition } from './expedition'
import { newArchive } from './archive'
import { serialiseSave } from './save'

describe('save size', () => {
  it('stays small enough to write on every action', () => {
    let s = startExpedition(4242, 'short', newArchive())
    const bare = serialiseSave({ archive: newArchive(), expedition: s }).length

    // Walk onto a mission node and launch it: that is the biggest the state gets.
    const node = s.map.nodes.find((n) => n.event.k === 'mission')
    let withMission = bare
    if (node) {
      s = { ...s, at: node.id }
      s = expeditionStep(s, { k: 'engageNode' })
      withMission = serialiseSave({ archive: newArchive(), expedition: s }).length
    }

    console.log(`  save size: bare ${(bare / 1024).toFixed(0)} kB, mid-mission ${(withMission / 1024).toFixed(0)} kB`)
    expect(withMission).toBeLessThan(600_000)
  })
})
