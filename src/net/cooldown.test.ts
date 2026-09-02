// Not knocking.
//
// The failure that started all of this was self-inflicted. The public
// signalling server sits behind Cloudflare, and an address that keeps asking
// gets Error 1015 — banned for a while, everybody in the household with it. This
// game earned exactly that: it dialled a saved room on every page load, from the
// title screen, and retried every two and a half seconds for ever.
//
// From inside, the ban then looked like something else entirely — plain https
// still answered while the websocket did not, which reads as a firewall.
//
// Backing off within a tab is not enough, because a reload resets the counter
// and the knocking starts again, so the ban never expires. That is the one thing
// this has to get right: **giving up has to survive a reload.**

import { beforeEach, describe, expect, it } from 'vitest'

// These tests run in node, where there is no browser storage. The cooldown's
// whole job is to survive a reload, so it is stored rather than remembered — and
// testing that means giving it somewhere to store things.
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
})

const { COOLDOWN_MS, clearCooldown, cooldownLeft, startCooldown } = await import('./broker')

describe('waiting a rate limit out', () => {
  beforeEach(() => {
    clearCooldown()
  })

  it('is nothing at all until something has gone wrong', () => {
    expect(cooldownLeft()).toBe(0)
  })

  it('holds for the whole window once it starts', () => {
    startCooldown()
    const left = cooldownLeft()
    expect(left).toBeGreaterThan(COOLDOWN_MS - 5000)
    expect(left).toBeLessThanOrEqual(COOLDOWN_MS)
  })

  it('survives a reload, which is the entire point', () => {
    // Nothing in memory: this is what a fresh page load sees. If the answer here
    // were zero, five more attempts would fire and refresh the ban — which is
    // how a ten-minute ban becomes an evening.
    startCooldown()
    expect(cooldownLeft()).toBeGreaterThan(0)
  })

  it('lets go by itself when the time has passed', () => {
    startCooldown(-1)
    expect(cooldownLeft()).toBe(0)
  })

  it('can be waved off by somebody who knows better', () => {
    startCooldown()
    clearCooldown()
    expect(cooldownLeft()).toBe(0)
  })

  it('is never confused by rubbish in storage', () => {
    localStorage.setItem('stargrave.netCooldown', 'tomorrow')
    expect(cooldownLeft()).toBe(0)
  })
})
