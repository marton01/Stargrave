# Stargrave

> Magyarul: [README.hu.md](README.hu.md) · Rules: [RULES.md](RULES.md) ·
> Design: [DESIGN.md](DESIGN.md)

A two-player **cooperative** campaign board game in the browser: one machine, one
monitor, one mouse. The two of you command the same expedition ship — you plan
the route, the research and the power allocation in weekly turns, and when you
set down somewhere it continues on a tactical grid: a fight, an exploration, or a
logic puzzle.

The game is **complete in both Hungarian and English**, and the language can be
**switched on any screen, mid-game** (top right). That applies retroactively to
the log too: old entries change language with it, because the log stores events
rather than sentences.

## Getting started

```bash
npm install
npm run dev
```

Then open the address it prints (<http://localhost:5173> by default). No server,
no account, no network: everything runs in the browser and the save lives in
`localStorage`.

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server with instant reload |
| `npm run build` | static build into `dist/` |
| `npm run preview` | serve the finished build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest: engine, puzzles, expeditions, saves |
| `npm run balance` | optional balance report (measures, does not assert) |
| `npm run smoke` | browser playthrough with real clicks (needs `dev` running) |

## What works

**All of it.** The game plays through: launching an expedition, weekly turns, the
star map, encounters, landings, nine kinds of generated puzzle, research on two
branches, the market, crew recruitment, the several endings of the Stargrave,
Archive unlocks, and then a new expedition carrying what the last one learned.

- **Strategic layer** — 8 reactor units across 7 systems, 8 stations (each needs
  power **and** crew), 6 resources plus crew and morale, 13 research projects, 24
  encounters, a Gate countdown with 4 Darkening levels.
- **Tactical layer** — square grid, movement in 8 directions, a Gloomhaven-style
  card economy (13 cards per class, two per round: the top half of one and the
  bottom half of the other), visible enemy intent, 5 mission kinds (clear, reach,
  relics, survive, hold), collapsing floors, traps, 4 enemy types.
- **Puzzles** — nine kinds, all generated and all **language-free**: rune
  decoding, balance scales, glyph reading, safe ground, power routing,
  refraction, star chart fitting, resonance tuning, gravity cores.
- **Meta** — the Archive: 9 unlocks that open **content, not power**. Automatic
  saving, plus JSON export/import.
- **Help** — the `?` button (or `F1`) opens the whole rulebook, always on the
  chapter matching the current screen, and the "Game pieces" tab **draws** the
  units and terrain live with the same components as the grid.
- **Optional assets** — art and sound are used the moment the files are there and
  are silently absent when they are not; see
  [public/assets/README.md](public/assets/README.md).

What it does *not* do: no network multiplayer, no music (the two ambient loops in
the asset list are deliberately unwired), and the graphics are still SVG drawn
from code.

## Structure

```
RULES.md / RULES.hu.md      the rulebook — ALSO the text of the in-game help
DESIGN.md / DESIGN.hu.md    the design document (why it is like this, not how)
public/assets/README.md     what to download and where to put it (asset list)
tools/smoke-test.mjs        browser playthrough with Playwright

src/engine/                 the rules engine — knows NOTHING about React
  types.ts                  every battle type (+ Text, Lang, LogEvent)
  rng.ts                    mulberry32 — seeded, reproducible
  grid.ts                   grid, Chebyshev distance, line of sight, reach
  state.ts                  cloning, statuses, logging
  combat.ts                 damage, shield, knockback, traps, relics
  effects.ts                resolving the effect list (interruptible: s.pending)
  enemyAi.ts                enemy turns, target selection
  mapgen.ts                 map and mission-feature generation
  battle.ts                 startMission / step / missionResult
  puzzles/                  the generators and rules of the nine puzzles
  expedition/               the strategic layer
    starmap.ts              star-map generation
    expedition.ts           weekly turn, encounters, mission launch, market
    archive.ts              meta unlocks, ending texts
    save.ts                 save, load, export/import
src/content/                data, not logic (cards, enemies, ship, research…)
src/i18n/                   ui.ts (interface), describe*.ts (log), LangContext
src/ui/                     React — display and clicks only
  strategic/                ship, star map, encounter, research, ending, archive
  puzzles/                  the puzzle panel and its marks
  assets.ts                 optional art and sound, quietly absent by default
```

**Two rules keep the project honest:**

1. **The engine does not know React exists.** One entry point in battle
   (`step(state, action)`) and one in the strategic layer
   (`expeditionStep(state, action)`), both pure: `structuredClone`, then mutate
   the clone. That is what makes it possible to bot the whole game headlessly.
2. **The log stores events, not text.** `LogEvent` and `ExpeditionEvent`
   structures, translated by `i18n/describe*.ts` — which is why switching
   language rewrites the past as well.

Content text **lives next to the numbers** in `content/` (`Text = { hu, en }`),
while the fixed interface labels live in `i18n/ui.ts`. There, the
`type Widen<T> = T extends string ? string : T` trick makes a missing English key
a **compile error**.

## How it is verified

Three overlapping levels:

1. **`npm run typecheck`** — the types police the content too: a missing
   translation, an unknown card id or a wrong effect key is a compile error.
2. **`npm run test`** — 34 Vitest tests. They do not measure balance; they check
   that the game *does not stall and does not lie*:
   - battles played to the end with random but always **legal** moves, across
     many seeds and every difficulty — no deadlock, no crash;
   - invariants: hp never goes below zero, the dead do not attack, **cards are
     never duplicated and never vanish**, shield never passes its cap;
   - 9 puzzle kinds × 3 difficulties × 30 seeds = 810 instances, all solvable,
     with uniqueness verified for the deduction kinds;
   - whole expeditions botted, with invariants checked after every step;
   - saves round-tripped, plus an upper bound on save size (~17 kB).
3. **`npm run smoke`** — Playwright drives the *system Chrome* through a whole
   expedition in the **real interface**, in both languages, and fails on a dead
   end, on untranslated text, on an empty help tab, or when the two rules files
   have a different number of sections. Clicks go to `data-action` / `data-tile`
   hooks rather than to labels, so the test is language-independent. Screenshots
   land in `.smoke/`.

   The run is **fully deterministic**: the expedition seed is fixed and so is the
   bot's own randomness, so the same seed produces the same 535 clicks in the dev
   server and in the production build alike. That is what makes a failure
   reproducible — type the seed the run printed into the launch screen and you
   are in the same expedition. Change it with `SMOKE_SEED=1234 npm run smoke`.
   The default seed's route passes an encounter, a battle, a puzzle and a market,
   and the test fails if it ever stops covering all four.

`npm run balance` is deliberately not part of the test suite: it does not fail,
it prints a table (win rate, round length, resource drain) to tune from.

## Knobs

| What you feel | Where to turn it |
| --- | --- |
| combat too easy / too hard | `content/enemies.ts` — types and `ENEMY_COUNT` per difficulty |
| too few cards / they run out | `content/heroes.ts` `handSize`, `content/cards.ts` |
| shield runs away | `engine/state.ts` `SHIELD_MAX` |
| food spirals | `content/ship.ts` `lifeSupportNeeded`, food drain in `expedition.ts` |
| morale bottoms out | `expedition.ts` `moraleTarget` |
| the Gate is too tight / too loose | `expedition/starmap.ts` `LENGTHS` |
| rewards too small / too large | `puzzles/types.ts` `PUZZLE_REWARD`, `content/encounters.ts` |
| research too slow | costs in `content/research.ts`, lab output in `expedition.ts` |
| encounters feel samey | `content/encounters.ts` (24 of them, `buildEncounter`) |
| too few unlocks | `expedition/archive.ts` `ARCHIVE_UNLOCKS` |

## Balance log

What came out of playtesting or botting, and why it ended up this way:

- **"So few cards, when I always have to discard one."** Hand size 10 → 13, and
  the card lost to a rest is chosen by hand. The *loss* stays: it is the heart of
  the game, it just cannot be that tight.
- **"The Rune Sentinel has absurd defence."** Shield stacked without limit, and
  Normal could roll two Sentinels. Now `SHIELD_MAX = 3`, the Sentinel's shield
  2 → 1, two Sentinels never share a map, and Hard is 6 → 5 enemies.
- **Food death spiral.** Life support demand grew linearly with the crew →
  `ceil(crew/4)`, consumption `ceil(crew/3)`, starting food 36.
- **Morale hit zero by week 4.** Instead of a linear decline it now **drifts
  towards a target** (`moraleTarget`): bad conditions settle it at a low floor,
  and fixing the cause brings it back.
- **Cards duplicated.** At the end of a mission the selected cards sat in the
  hand *and* the discard. `missionResult` now excludes `selected` from the hand
  and honours `heroTurn.losing`.
- **Echo echoing itself** froze the tab: the replayed card's top half spliced
  another echo into the effect list every pass. Now forbidden, and the resolver
  is guarded by a step counter.
- **The sidebar sat on top of the battlefield** (an old `grid-area` inside the
  mission view) — clicks landed on an `<h3>` and the renderer crashed. Fixed with
  explicit `grid-column`/`grid-row`; the smoke test is what found it.

## Assets

Art and sound are optional and **wired for graceful absence**: a file that is
present is used, a file that is missing changes nothing — no error, no
broken-image icon, no gap. What is worth downloading and where it goes is tracked
in [public/assets/README.md](public/assets/README.md), with exact filenames,
formats and sizes.
