// Browser smoke test.
//
// With the dev server running, this plays a whole expedition through the real
// interface — archive screen, launch, weeks, star map, encounters, landings,
// puzzles, the Heart, an ending, and back to the Archive. It also walks every
// help tab in both languages and switches language mid-run.
//
// What it is looking for is not balance but three interface failures:
//   1. the page throwing anything,
//   2. a screen with no legal action left (a dead end),
//   3. text left untranslated after a language switch.
//
// It drives everything through data-action / data-screen attributes rather than
// visible text, so it works in either language and survives rewording. That is
// the whole reason those attributes exist.
//
// Usage:  npm run dev      (in a separate window)
//         npm run smoke

import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173'
const OUT = process.env.SMOKE_OUT ?? '.smoke'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1680, height: 1050 } })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`)
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

// A rolling trail of what we did, so a renderer crash can name the action that
// caused it rather than the innocent one that noticed.
// Newline without a backslash: this file travels through shells that eat them.
const NL = String.fromCharCode(10)
const trail = []
function note(what) {
  trail.push(what)
  if (trail.length > 16) trail.shift()
}
page.on('crash', () => {
  console.error('RENDERER CRASHED. Last actions:')
  for (const entry of trail) console.error('  ' + entry)
})

const shots = new Set()
async function shotOnce(name) {
  if (shots.has(name)) return
  shots.add(name)
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

// The bot's own choices are seeded too, from the same number the expedition uses.
// Otherwise the map would be reproducible but the path through it would not, and
// "it failed on seed 1234" would not be a reproduction recipe. Same generator as
// the engine's (mulberry32), for the same reason: it is short and it is stable.
let botSeed = 0
function botRandom() {
  botSeed = (botSeed + 0x6d2b79f5) | 0
  let t = botSeed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** One of a plain array, using the same seeded dice as `randomOf`. */
function randomItem(items) {
  if (items.length === 0) return null
  return items[Math.floor(botRandom() * items.length)]
}

async function randomOf(locator) {
  const n = await locator.count()
  if (n === 0) return null
  return locator.nth(Math.floor(botRandom() * n))
}

async function clickCentre(element) {
  const box = await element.boundingBox()
  if (!box) return false
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  return true
}

async function setLang(code) {
  await page.locator(`[data-action="setLang"][data-lang="${code}"]`).first().click()
  await page.waitForSelector(`.app[data-lang="${code}"]`)
}

async function screen() {
  return page.locator('.app').getAttribute('data-screen')
}

/** Click a button by its data-action, if it is there and enabled. */
async function tryAction(action) {
  const button = page.locator(`[data-action="${action}"]`).first()
  if ((await button.count()) === 0) return false
  if (await button.isDisabled().catch(() => false)) return false
  note(`action:${action}`)
  await button.click()
  return true
}

// ------------------------------------------------------------------- help

async function walkHelp(langCode) {
  await setLang(langCode)
  await tryAction('openHelp')
  await page.waitForSelector('.help')
  const tabs = await page.locator('.help-tab').allInnerTexts()
  for (let i = 0; i < tabs.length; i++) {
    await page.locator('.help-tab').nth(i).click()
    const body = await page.locator('.help-body').innerText()
    if (body.trim().length < 40) {
      throw new Error(`Help tab "${tabs[i]}" (${langCode}) looks empty.`)
    }
    await page.screenshot({ path: `${OUT}/help-${langCode}-${String(i).padStart(2, '0')}.png` })
  }
  await page.keyboard.press('Escape')
  await page.waitForSelector('.help', { state: 'detached' })
  return tabs
}

// --------------------------------------------------------------- the battle

/** One step of a landing mission, or null when there is nothing left to do. */
async function battleStep() {
  const app = page.locator('.app')
  const pending = await app.getAttribute('data-pending')

  if (pending === 'tile' || pending === 'unit') {
    // Click the addressable click-surface rect rather than the highlight, which
    // has pointer-events disabled. Using the element's own click also lets
    // Playwright scroll the grid into view first.
    const target = await randomOf(page.locator(`[data-selectable="${pending}"]`))
    if (target) {
      // Scroll first: the grid can be taller than its pane, and a forced click
      // would otherwise land on whatever is covering the tile.
      const tile = await target.getAttribute('data-tile')
      note(`grid:${pending}:${tile}`)
      await target.scrollIntoViewIfNeeded().catch(() => {})
      await target.click({ timeout: 4000 }).catch(async () => {
        await target.click({ force: true })
      })
      return true
    }
    return false
  }

  const bar = page.locator('.action-bar')
  if ((await bar.count()) === 0) return false
  const mode = await bar.getAttribute('data-mode')

  if (mode === 'settled') return tryAction('missionFinish')
  if (mode === 'enemy') return tryAction('advanceEnemy')

  if (pending === 'card' || mode === 'pickCard') {
    const c = await randomOf(page.locator('.action-bar .card'))
    if (c) {
      await c.click()
      return true
    }
    return false
  }

  if (mode === 'rest') {
    // Losing a card is asked for twice now: pick one, then confirm.
    if (await tryAction('confirmRest')) return true
    const c = await randomOf(page.locator('.action-bar .card'))
    if (c) {
      await c.click()
      return true
    }
    return false
  }

  if (mode === 'select') {
    const chosen = await page.locator('.action-bar .card[data-selected="true"]').count()
    const candidate = await randomOf(page.locator('.action-bar .card[data-selected="false"]'))
    if (chosen < 2 && candidate) {
      note(`select:${await candidate.getAttribute('data-card-id')}`)
      await candidate.click()
      return true
    }
    return tryAction('ready')
  }

  if (mode === 'assignTop') {
    const c = await randomOf(page.locator('.action-bar .card'))
    if (c) {
      note(`assignTop:${await c.getAttribute('data-card-id')}`)
      await c.click()
      return true
    }
    return false
  }

  if (mode === 'playHalves') {
    const half = await randomOf(page.locator('.card-half[data-playable="true"]'))
    if (half) {
      const which = await half.getAttribute('data-half')
      const cardId = await half.evaluate((el) => el.closest('.card')?.getAttribute('data-card-id'))
      note(`half:${cardId}:${which}`)
      await half.click()
      return true
    }
    if (await tryAction('endTurn')) return true
    if (await tryAction('skipTop')) return true
    if (await tryAction('skipBottom')) return true
    return false
  }

  return false
}

// -------------------------------------------------------------------- run

await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.app[data-screen]', { timeout: 30000 })

// Start from a clean slate, so a leftover save from a previous run cannot make
// the test pass or fail for the wrong reason.
await tryAction('deleteSave').catch(() => false)
await page.evaluate(() => {
  window.localStorage.removeItem('stargrave.save')
})
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.app[data-screen="archive"]')

const huTabs = await walkHelp('hu')
const enTabs = await walkHelp('en')
if (huTabs.length !== enTabs.length) {
  throw new Error(
    `The two rules files have a different number of sections: hu=${huTabs.length}, en=${enTabs.length}.`,
  )
}
await setLang('hu')
await shotOnce('01-archive')

// Launch a short expedition on a FIXED seed, so a failure can be reproduced by
// typing the same number into the launch screen. Override with SMOKE_SEED=... —
// the default is one whose route passes an encounter, a battle, a puzzle and a
// market, so one run covers every kind of screen. When the map or the content
// changes the covering route changes with it — scan a handful of seeds with
// SMOKE_SEED and move this number rather than dropping a coverage check.
const seed = process.env.SMOKE_SEED ?? '8675309'
botSeed = Number(seed) | 0
// A real expedition, not the practice run — which is what a first-time archive
// offers by default. The bot is here to exercise the game that counts.
await tryAction('setKind')
const normalKind = page.locator('[data-action="setKind"][data-kind="normal"]')
if (await normalKind.count()) await normalKind.click()
await page.locator('[data-action="setLength"][data-length="short"]').click()
await page.locator('[data-action="seed"]').fill(seed)
await tryAction('launchExpedition')
await page.waitForSelector('.app[data-screen="ship"]')
await shotOnce('02-ship')

let steps = 0
let switchedMidRun = false
let sawEncounter = false
let sawMission = false
let sawPuzzle = false
let sawMarket = false
let finalScreen = null
let lastWeek = '0'
// Stall detection.
//
// On the strategic screens a fingerprint of the visible text works: if nothing
// changed for 25 actions, we are going in circles. Inside a landing mission it
// does NOT work — moving a hero one tile changes no text at all — so there we
// simply cap how many actions one mission may take.
const summaryKinds = new Set()
// Every screen the run passed through. Worth printing: when the route changes,
// the fastest question to answer is which screens it stopped visiting.
const screensSeen = new Set()
const route = []
/** What the run still has not shown. Empty means the bot may go home. */
const missingCoverage = () =>
  [
    !sawEncounter && 'an encounter',
    !sawMission && 'a landing battle',
    !sawPuzzle && 'a puzzle',
    !sawMarket && 'a market',
  ].filter(Boolean)
let lastFingerprint = ''
let stalled = 0
let missionActions = 0
let lastBattleState = ''
let battleStalled = 0

while (steps < 4000) {
  steps += 1
  const current = await screen()
  screensSeen.add(current)
  lastWeek = (await page.locator('.app').getAttribute('data-week')) ?? lastWeek

  // The change summary is modal: it covers everything until it is read, so it
  // has to be dismissed before any other click can land. First thing, always.
  if ((await page.locator('[data-action="closeSummary"]').count()) > 0) {
    const kind = await page.locator('.summary-veil').getAttribute('data-summary')
    summaryKinds.add(kind)
    await shotOnce(`11-summary-${kind}`)
    await tryAction('closeSummary')
    continue
  }

  if (current === 'mission') {
    missionActions += 1
    // A battle that stops advancing has to be caught here, before the tab dies
    // from thousands of clicks on a frozen page.
    const battleState = await page.locator('.app').getAttribute('data-battle')
    if (battleState && battleState === lastBattleState) {
      battleStalled += 1
      if (battleStalled > 20) {
        await page.screenshot({ path: `${OUT}/stall.png` })
        const mode = await page.locator('.action-bar').getAttribute('data-mode').catch(() => null)
        const pendingKind = await page.locator('.app').getAttribute('data-pending')
        const selectable = await page.locator('[data-selectable]').count()
        const playable = await page.locator('.card-half[data-playable="true"]').count()
        // Ask the browser what is actually at that point: a covered click surface
        // is invisible in every other diagnostic.
        const cover = await page
          .locator('[data-selectable]')
          .first()
          .evaluate((el) => {
            const box = el.getBoundingClientRect()
            const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
            const describe = (node) =>
              node
                ? `${node.tagName}.${node.getAttribute('class') ?? ''}[tile=${node.getAttribute('data-tile') ?? '-'}]`
                : 'null'
            return {
              target: describe(el),
              atPoint: describe(hit),
              same: hit === el,
              box: `${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}`,
            }
          })
          .catch((e) => ({ error: String(e) }))

        throw new Error(
          [
            `The battle stopped advancing: mode=${mode} pending=${pendingKind}`,
            `hit test: ${JSON.stringify(cover)}`,
            `selectable=${selectable} playableHalves=${playable}`,
            `state=${battleState}`,
            'last actions:',
            ...trail.map((entry) => '  ' + entry),
          ].join(NL),
        )
      }
    } else {
      battleStalled = 0
      lastBattleState = battleState
    }
    if (missionActions > 1400) {
      await page.screenshot({ path: `${OUT}/stall.png` })
      const mode = await page.locator('.action-bar').getAttribute('data-mode').catch(() => null)
      const pendingKind = await page.locator('.app').getAttribute('data-pending')
      throw new Error(
        `One landing mission ran for 1400 actions: mode=${mode} pending=${pendingKind}. ` +
          'Something in the mission loop is not advancing.',
      )
    }
  } else {
    missionActions = 0
    const fingerprint = `${current}|${lastWeek}|${await page.locator('.app').innerText()}`
    if (fingerprint === lastFingerprint) {
      stalled += 1
      if (stalled > 25) {
        await page.screenshot({ path: `${OUT}/stall.png` })
        const buttons = await page.locator('button:not([disabled])').allInnerTexts()
        throw new Error(
          `Stalled on "${current}" week ${lastWeek}: 25 actions changed nothing. ` +
            `Enabled buttons: [${buttons.slice(0, 12).join(' | ')}]`,
        )
      }
    } else {
      stalled = 0
      lastFingerprint = fingerprint
    }
  }

  if (current === 'over') {
    await shotOnce('09-over')
    finalScreen = 'over'
    await tryAction('returnToArchive')
    await page.waitForSelector('.app[data-screen="archive"]')
    await shotOnce('10-archive-after')
    break
  }

  // Around fifty actions in, switch language. By then the log is full of lines
  // written in Hungarian, which is the real test of structured log events.
  if (!switchedMidRun && steps > 18) {
    await setLang('en')
    await shotOnce('05-mid-run-en')
    const body = await page.locator('.app').innerText()
    if (/hét telt|Megérkeztünk|Kutatás kész|Beépítve/.test(body)) {
      throw new Error('Hungarian text left on screen after switching to English:\n' + body.slice(0, 800))
    }
    await setLang('hu')
    switchedMidRun = true
  }

  if (current === 'mission') {
    // A puzzle mission has no grid, so tell the two apart before flagging.
    const isPuzzle = (await page.locator('.mission-puzzle').count()) > 0
    if (!isPuzzle && !sawMission) {
      await shotOnce('06-mission')
      sawMission = true
    }
    if (isPuzzle) {
      if (!sawPuzzle) {
        await shotOnce('07-puzzle')
        sawPuzzle = true
      }
      // Poke at it a little, then report back. The engine tests are what prove
      // the puzzles are solvable; here we only need the screen to survive.
      for (let i = 0; i < 6; i++) {
        const target = await randomOf(page.locator('.puzzle-body [style*="cursor"], .puzzle-body button'))
        if (!target) break
        await target.click().catch(() => {})
      }
      if (await tryAction('missionFinish')) continue
      throw new Error('A puzzle mission has no way to report back.')
    }
    if (await battleStep()) continue
    if (await tryAction('missionFinish')) continue
    throw new Error('Stuck inside a landing mission.')
  }

  if (current === 'encounter') {
    if (!sawEncounter) {
      await shotOnce('04-encounter')
      sawEncounter = true
    }
    if (await tryAction('encounterClose')) continue

    // A choice is picked but not taken: the account is on screen, with a way
    // back. Pay any card cost, then confirm.
    if ((await page.locator('.proposal').count()) > 0) {
      await shotOnce('04b-proposal')
      if (await tryAction('encounterConfirm')) continue
      const card = await randomOf(page.locator('.encounter .card'))
      if (card) {
        await card.click()
        continue
      }
      // Nothing to pay with: back out and take a different option.
      if (await tryAction('encounterCancel')) continue
      throw new Error('Stuck on a proposed choice that can neither be paid nor cancelled.')
    }

    const choice = await randomOf(page.locator('[data-action="encounterChoose"]:not([disabled])'))
    if (choice) {
      await choice.click()
      continue
    }
    throw new Error('Stuck on an encounter with no takeable choice.')
  }

  if (current === 'market') {
    if (!sawMarket) {
      await shotOnce('08-market')
      sawMarket = true
    }
    // Buying is two clicks now: pick, then confirm the price.
    if (await tryAction('marketBuy')) continue
    if (await tryAction('marketPick')) continue
    if (await tryAction('closeMarket')) continue
    throw new Error('Stuck in the market.')
  }

  if (current === 'heart') {
    await shotOnce('09-heart')
    // The last decision of a run is asked for twice as well.
    if (await tryAction('chooseEnding')) continue
    const ending = await randomOf(page.locator('[data-action="heartPick"]'))
    if (ending) {
      await ending.click()
      continue
    }
    throw new Error('The Heart offered no ending at all.')
  }

  // Strategic screens. Work the star map; fall back to ending the week.
  if (current !== 'starmap') {
    if (await tryAction('nav')) {
      await page.locator('[data-action="nav"][data-screen="starmap"]').click()
      continue
    }
  }

  if (current === 'starmap') {
    await shotOnce('03-starmap')
    if (await tryAction('engageNode')) continue

    // The Heart ENDS the run, so while a screen is still uncovered the bot would
    // rather be out here. A PREFERENCE, never a refusal: at the Gate there are no
    // onward links and the week cannot be ended once the timer is out, so a bot
    // that flatly refused the Heart sat there with nothing legal left and
    // reported a dead end in the game that was really a dead end in itself.
    const exploring = missingCoverage().length > 0
    if (!exploring && (await tryAction('openHeart'))) continue

    // Read the labels and choose by hand rather than with a text filter: a
    // filter that matches nothing fails silently, and looks exactly like "the
    // Gate was the only way on".
    const all = await page.locator('[data-action="setCourse"]').all()
    const labelled = []
    for (const button of all) {
      labelled.push({ button, text: await button.innerText().catch(() => '') })
    }
    const outward = exploring
      ? labelled.filter((c) => !/Csillagsír|Stargrave/.test(c.text))
      : labelled
    const course = randomItem(outward.map((c) => c.button)) ?? randomItem(all)
    if (course) {
      // The route is the most useful line in the output when coverage changes:
      // it says where the run actually went, not just what it saw there.
      route.push((await course.innerText()).replace(/\s+/g, ' ').trim())
      await course.click()
      continue
    }

    // Nowhere left to go: take the ending after all.
    if (await tryAction('openHeart')) continue
  }

  if (await tryAction('endWeek')) continue

  // Nothing legal left anywhere: that is exactly the dead end we are hunting.
  const dump = await page.locator('.app').innerText()
  throw new Error(`Dead end on screen "${current}":\n${dump.slice(0, 900)}`)
}

await browser.close()

// With the seed fixed the route is fixed too, so missing coverage is a real
// regression rather than bad luck: this expedition passes a battle AND a puzzle.
if (!process.env.SMOKE_SEED) {
  const missing = missingCoverage()
  if (missing.length) {
    errors.push(`coverage: the default seed no longer reaches ${missing.join(', ')}`)
  }
}

console.log(`Help tabs:      ${huTabs.length} hu / ${enTabs.length} en`)
console.log(`Language swap:  ${switchedMidRun ? 'checked mid-run' : 'NOT reached'}`)
console.log(`Seed:           ${seed}`)
console.log(`Actions:        ${steps}`)
console.log(`Week reached:   ${lastWeek}`)
console.log(`Saw encounter:  ${sawEncounter}`)
console.log(`Saw landing:    ${sawMission}`)
console.log(`Saw puzzle:     ${sawPuzzle}`)
console.log(`Saw market:     ${sawMarket}`)
console.log(`Ended:          ${finalScreen ?? 'not within the action cap'}`)
console.log(`Route:          ${route.join(' -> ') || 'never left the first system'}`)
console.log(`Screens:        ${[...screensSeen].sort().join(', ')}`)
console.log(`Summaries:      ${[...summaryKinds].sort().join(', ') || 'none seen'}`)
console.log(`Screenshots:    ${OUT}/`)
console.log(`Errors:         ${errors.length}`)
for (const e of errors.slice(0, 20)) console.log('  ' + e)

process.exit(errors.length > 0 ? 1 : 0)
