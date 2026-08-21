# STARGRAVE — game design v1.0

*Cooperative expedition command for two, on one machine. Web based.*
*Star Trek + FTL + euro board game + tactical RPG — not action oriented.*

> In Hungarian: [DESIGN.hu.md](DESIGN.hu.md). Both files must be updated together.

---

## 1. In one paragraph

**The Gate** has opened — an ancient structure that looks out onto another galaxy. On the far
side lie the remains of a civilisation that fused magic and technology and then vanished within
a single generation. No war destroyed it: something *finished* them.

The two of you are the command crew of an expedition ship. You have a crew, a reactor, and a
finite number of weeks before the Gate closes. Every week you decide where to go, what to
research, what to build, who to take on, and which call to answer. When you land somewhere you
move to a tactical grid — but that is not necessarily combat: it may be exploration, it may be a
puzzle.

The goal is to reach the heart of the galaxy, the **Stargrave** — but what you can do once you are
there is not decided by your weapons. It is decided by **how much you understood** along the way.
If the expedition fails a new one sets out, and everything you discovered goes into the
**Archive**, which brings the next crew closer.

**Working title:** Stargrave (in Hungarian: Csillagsír)
**Mood:** mythic and melancholic — lost gods, vast ruins, heavy beauty

---

## 2. The game's two layers

```
┌─────────────────────────────────────────────────────────────┐
│  STRATEGIC LAYER — the ship  (the spine, ~60%)              │
│                                                             │
│  Weekly turns · power allocation · crew placement            │
│  star map · research · fabrication · encounters              │
│  moral choices · the Gate counting down                      │
└───────────────────────────┬─────────────────────────────────┘
                            │  landing / boarding
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  TACTICAL LAYER — the landing party  (~40%)                 │
│                                                             │
│  Square grid · card abilities · initiative                   │
│  ⅓ exploration   ⅓ logic puzzle   ⅓ combat                  │
└─────────────────────────────────────────────────────────────┘
```

**Key principle: combat is not the default.** About a third of landing missions are exploration
(the same grid, but instead of enemies there is dangerous terrain, closing doors, time limits,
rescues), a third are logic puzzles, and a third are combat. The same engine serves all three, so
it costs little extra code — but the rhythm is completely different.

---

## 3. Core decisions

| Question | Decision |
|---|---|
| Format | 2 players, **one machine, one monitor, one mouse** (hotseat co-op) |
| Relationship | **Cooperative** — together, not against each other |
| Information | **Fully open** |
| Spine | **Weekly ship command** — power allocation + crew placement |
| Resources | **7 shared** + power as a weekly allocation |
| Crew | **Named individuals** with a speciality and traits |
| Tactical layer | Square grid, 8 directions, Chebyshev distance (diagonal = 1) |
| Combat economy | **Ability cards with hand exhaustion**, visible enemy intent |
| Mission size | **Small and dense** — 2 heroes + a crew member, ~10x10, 10-15 minutes |
| Equipment | **Rune slots on the cards** |
| Puzzles | **9 types**, all generated and **language independent** |
| Language | **Hungarian and English**, switchable in real time · the code is English |
| Time pressure | **The Gate closes in N weeks** |
| Victory | **Reach the heart of the galaxy** — and *understanding* decides what you can do there |
| Research | **Two branches:** technology (capability) and understanding (the key to the endgame) |
| Mission failure | **Withdrawal with losses** — not the end of the run |
| Saving | **Automatic**, one running expedition, no reloading |
| End of run | **Roguelite** — a new expedition after failure, unlocked content persists |
| Run length | short ~15 weeks / medium ~25 / long ~40 |
| Depth | Medium-deep, introduced gradually |
| Graphics | **Stylised flat 2D** — silhouettes, restricted palette, rune light |

---

## 4. The strategic layer: the ship

### 4.1 The weekly turn

```
1. REPORT      — consumption (food by crew size, fuel if under way),
                 event roll, the Gate counter drops
2. SETUP       — if needed: reallocate power, rearrange the crew
3. DOMAINS     — each player makes the decisions of their own domain
4. JOINT CALL  — route, mission acceptance, recruitment, moral dilemmas
5. EXECUTION   — stations run, travel advances, possibly a landing
```

**The critical design principle:** step 2 is a **standing configuration, not a weekly chore.** You
set it up and only adjust it when something changes. A quiet week under way then takes thirty
seconds, while arriving in a system is a dense run of decisions. That rhythm is the difference
between a good ship-command game and filling in a spreadsheet.

### 4.2 Power — the weekly allocation

The reactor produces **8 units** to start with (upgradeable). It has to be split between the
systems — **this is a joint decision**, and it is the strongest cooperative element in the game:

| System | What it gives |
|---|---|
| **Life support** | a mandatory minimum by crew size; too little → morale and health decay |
| **Engines** | travel speed — how many weeks a jump takes |
| **Shields** | protection in encounters and boarding fights |
| **Lab** | Information output, research speed |
| **Forge** | repair and fabrication |
| **Sensors** | how far ahead you can see on the star map |
| **Rune core** | **this becomes the landing party's Flux on the mission** |

Eight units, seven systems — each wants 1-3. It is never enough, and every week needs something
different. The rune core row matters especially: **it is what ties the two layers together.**
Whatever you gave the rune core this week is what the landing party fights with.

### 4.3 Crew placement — the stations

You place crew members onto **stations**. A station only works if it **has power AND has crew
standing on it** — that double constraint is what creates the real scarcity.

| Station | Effect | Domain |
|---|---|---|
| **Bridge** | navigation, fuel efficiency | shared |
| **Lab** | Information output, research | Echo-reader |
| **Archive** | card upgrades, analysing alien technology | Echo-reader |
| **Sensors** | see what lies in the next systems | Echo-reader |
| **Forge** | hull repair, rune forging, fabrication | Runesmith |
| **Armoury** | shield and defence preparation | Runesmith |
| **Medbay** | health and wound treatment | shared |
| **Sanctum** | restoring morale | shared |

Every crew member has a **speciality**: on the matching station they are considerably more
effective.

### 4.4 The seven resources

| Resource | Group | What it is for | Who spends it |
|---|---|---|---|
| **Fuel** | physical | jumps on the star map | shared |
| **Food** | physical | weekly consumption by crew size | shared |
| **Hull** | physical | the ship's integrity; at zero it is over | Runesmith repairs it |
| **Crew** | human | staffing stations, landing parties | shared recruitment |
| **Morale** | human | low: mistakes, unrest, people leaving | shared |
| **Information** | abstract | research projects, understanding | Echo-reader |
| **Credits** | abstract | buying, hiring, trading | shared |

### 4.5 Domains: what is shared, what is yours

Both players carry **equal weight** — the same number of decisions, neither is an assistant. The
split runs along **domains**, not along roles:

**Runesmith — the engineering domain.** Forge and Armoury, hull repair, module building, fuel
synthesis, rune forging. It is their call what the ship can *physically* do.

**Echo-reader — the research domain.** Lab, Archive, Sensors, research projects, analysing alien
technology, glyph decipherment. It is their call what the ship *understands* about the world.

**Shared:** power allocation, route, mission acceptance, recruitment, moral dilemmas, Medbay and
Sanctum (the human matters).

### 4.6 Crew — named people

Every crew member has:
- a **name** and a short background
- a **speciality** (engineer / scientist / guard / medic / navigator)
- **1-2 traits** — e.g. *brave* (grants morale after danger), *sceptical* (less morale, more
  Information), *of alien descent* (bonus with alien technology), *veteran*, *young*
- a **landing ability**: if they join the party they contribute a small card set to the tactical
  mission

This is what creates the emotional stake that a roguelite finds hard to earn: **crew members can
die**, and everyone will remember whose fault it was that you lost them.

### 4.7 Star map and travel

A node map (systems and routes), generated for every expedition. A jump takes **1-3 weeks**,
depending on Engine power and distance, and burns fuel.

In the systems: ruins, abandoned stations, anomalies, inhabited worlds, trading posts, distress
calls. Sensor power decides how far ahead you can see — so scouting is itself an investment.

### 4.8 The Gate — the time pressure

A countdown measured in weeks (short ~15, medium ~25, long ~40). **Every week consumes one.**

The counter passes through four **Darkening levels**. With each level:
- stronger enemy variants appear,
- global modifiers get nastier,
- reactor output drops (the galaxy itself eats the power).

The counter is **generous enough that a direct route fits comfortably** — the pressure comes from
every detour, every extra piece of research and every ship you save *costing weeks*. That is what
makes route selection a real decision.

### 4.9 Research — two branches, one pool

**Information** is the Echo-reader's currency, and it can be spent on **two branches**:

**Technology branch** — immediate capability: ship modules, reactor upgrades, new rune types, new
cards for your classes, more effective stations.

**Understanding branch** — the secrets of the world: what happened to this galaxy, what the
godmachines are, what finished them. **This is what opens the endgame options** and the Archive
entries. The glyph decipherment puzzles feed directly into it.

The dilemma is deliberately sharp: **understanding grants no combat advantage.** It will not make
the ship stronger and it will not improve your cards — and yet it is the key to victory. So the
purely optimising route is *not* the right one, and the player has to discover that for themselves.

### 4.10 Victory — the heart of the galaxy

There is a final location: **the Stargrave**, the heart of the galaxy. The goal is to reach it
before the Gate closes.

And here is the twist: **your understanding decides what you can *do* there at all.** The same
location, entirely different endings:

| Understanding | What you can do in the Heart |
|---|---|
| low | you can only flee, or blindly destroy what you found |
| medium | you learn what happened — and can carry the knowledge home |
| high | you recognise what *is happening*, and can intervene |
| complete | the deepest ending: you understand why it was not a war |

This is the true replay engine. **In your first runs you will not even understand what you saw** —
and that is exactly the point. Every expedition brings the Archive closer.

### 4.11 Defeat — when an expedition ends

| Condition | Consequence |
|---|---|
| **Hull at zero** | the ship is lost, the expedition ends |
| **Morale at zero** | the crew refuses orders, the expedition breaks off |
| **The Gate closes** | you are stranded — a separate ending of its own, not just a failure |
| **Food runs out** | *not* an instant end: morale collapse and crew loss, a spiral you can still climb out of |

**If a landing mission goes badly**, that is *not* the end of the run: they are pulled back up to
the ship. The cost: wounds to treat, the loot you missed, 1-2 lost weeks, and quite possibly a
dead crew member. It hurts, but it does not take the evening away.

### 4.12 Saving

**Automatic saving after every week and every mission**, one running expedition, no reloading. The
weight of decisions is preserved, but you never lose the work if you have to stop for the night.

*Technical note:* the save lives in the browser, but it **must be exportable to a file** — cleared
browser data must not be able to take away a 25 week expedition.

---

## 5. Encounters — the game's content engine

These are the most important narrative situations, and this is where the stories come from. They
are not separate nodes; they come up under way and on arriving in systems.

Examples:
- **A drifting ship.** Board it? Shield power decides the risk. The reward may be parts, crew, or
  a log that pushes the story forward — but it may also be a boarding fight.
- **A distress call.** The detour costs three weeks. Do we take it?
- **Alien technology.** Fit it into the ship? A strong bonus, but it takes something too — and you
  do not know what unless the Lab analyses it first.
- **Refugees.** Do we take them aboard? More food consumed, but crew and morale.
- **A trader swarm.** Credits, fuel, parts — what do you sell to buy what?
- **An ancient signal.** You do not know what it is until you go there.

Decisions have **consequences for the rest of the run**, and story branches open and close. The
branching event set grows gradually with Archive unlocks.

---

## 6. The tactical layer: landing

When you land somewhere you move to a **10x10 square grid**. The party: **the two heroes +
optionally one crew member.**

### 6.1 Mission types

**Exploration (⅓)** — no enemies, or avoidable ones. The challenge is the terrain: closing doors,
collapsing structures, toxic zones, time limits, rescues, collection. The same card economy, but
you have to spend cards on movement and problem solving.

**Logic puzzle (⅓)** — a generated puzzle in the middle of the grid (or at several points). You
have to get there, then solve it. The full catalogue is in **6.8**.

**Combat (⅓)** — the classic tactical fight. Plus: **boarding defence**, when the ship itself is
attacked and its interior is the map — there the modules stand on the grid, and if they are
destroyed their bonus is lost for the rest of the expedition.

### 6.2 Card economy

- Each hero has a **collection** (currently **13 cards** per class), from which they assemble an
  **active hand** before the expedition. That is the "build".
- **Two cards per round** are played: the **top** half of one and the **bottom** half of the other.
  Every card is useful in two ways, so every play is a painful decision.
- Played cards go to the **discard** pile (or may be lost permanently).
- **Resting** brings the discards back — but every rest **loses one card permanently.**
- Two clocks run at once: **hit points** and **fatigue**. A hero drops out even at full health if
  they cannot play cards.

### 6.3 Card anatomy

```
┌──────────────────────────────┐
│  INITIATIVE: 34              │  ← this decides where you act in the round
│  Name                        │
├──────────────────────────────┤
│  TOP HALF                    │  ← attack / strong effect / puzzle tool
│  ◇ rune slot     ⟐ Flux      │
├──────────────────────────────┤
│  BOTTOM HALF                 │  ← movement / support / terrain work
│  ◇ rune slot                 │
├──────────────────────────────┤
│  ⟳ discarded  /  ✕ lost       │
│  ⚒ ◈ trial symbols           │  ← for paying in non-combat situations
└──────────────────────────────┘
```

### 6.4 Initiative — the engine of shared planning

1. Every enemy **reveals its intent**: where it goes, who it attacks, how much it deals, at what
   initiative.
2. The two players **choose their cards** and decide which one provides their hero's initiative.
3. Everyone acts in **initiative order**.

Because the enemy's plan is visible, the round is a **choreography planned together**. The tension
does not come from hiding information but from the shared puzzle — and that is precisely what
works for two people at one monitor.

### 6.5 Combos — the connection

| Status | Who applies it | What it gives their partner |
|---|---|---|
| **Anchor** | Runesmith | the marked unit cannot move, and area effects deal +1 to it |
| **Rune Mark** | Echo-reader | melee attacks deal +2 to the marked unit, and killing it grants Flux |
| **Bond** | passive, while within 2 tiles | +1 damage for both of you |
| **Setup** | prone, knockback, blinding | positional advantage for the other |

Mutual: both heroes can set up and both can cash in.

**Shield is capped at 3.** Without the cap the shielding enemies stacked it without limit, and
since Shield subtracts from every hit, low-damage attacks did nothing at all. The cap keeps armour
a worthwhile investment without letting it grow into a wall.

### 6.6 Flux — the resource that links the layers

How much Flux you start a mission with **is determined by how much power you gave the rune core
that week.** One shared pool that both of you spend strong abilities from — so the negotiation
continues during the mission too.

### 6.7 Trials paid with cards

In non-combat situations (ruins, anomalies, encounters) **you pay with cards from your hand**:

```
"Runes run along the gate's inner ring, and nobody carved them."

  ▸ Force it open        — lose 2 cards with the ⚒ symbol
  ▸ Understand the pattern — lose 2 cards with the ◈ symbol
  ▸ Burn through with Flux — 3 Flux
  ▸ Move on              — no cost, no reward
```

No new system, you play with the same resource as in combat — and it genuinely hurts, because what
you lose here is missing on the next mission.

### 6.8 Puzzle catalogue

**Core principle — language independence.** The game runs in both Hungarian and English, but **not
one puzzle relies on language.** Every puzzle is solvable from symbols, geometry, numbers and
spatial relations. No wordplay, no anagrams, no letter counting, no crosswords, and no situation
where knowing a Hungarian or English word is an advantage. The answer is always a click or a
placement, never typing. This is not only a translation question: it also means the puzzles can be
**generated and verified by machine**, so we can guarantee every instance is solvable.

**They fall into two families:**

*Played on the grid* — they use the same tactical engine, so both heroes move and work together.
Little extra code, because the grid already exists.

| Puzzle | Mechanic | Where it appears | Reward |
|---|---|---|---|
| **Gravity cores** | ancient cores have to be pushed into place on the grid (Sokoban logic); the heroes can push from different directions | restarting godmachines | power, ship modules |
| **Safe ground** | part of the floor collapses; adjacency clues tell you which tiles are safe | ruins, collapsing structures | passage, loot |
| **Refraction** | a rune-light beam has to be steered onto targets with mirrors and prisms; the heroes rotate the pieces | temples, sealed shrines | relics, runes |

*Played on a panel* — they open by clicking a device, and the grid pauses meanwhile. These are the
"let us sit down and think about this together" moments.

| Puzzle | Mechanic | Where it appears | Reward |
|---|---|---|---|
| **Power routing** | route power to targets through limited-capacity conduits in a damaged network | power plants, ship repair, sealed doors | system access, power |
| **Rune decoding** | work out a rune sequence from partial feedback (Mastermind logic) | locks, relic activation | relics, runes |
| **Resonance tuning** | several dials must be set at once, but each affects its neighbours (Lights Out logic) | choir gates, beacons | alien technology |
| **Glyph reading** | deduce the *composition rules* of an alien sign system: which stroke modifies what. Known partial translations are given as **icons**, and the answer is icon selection too — zero linguistic content | inscriptions, logs, godmachines | **understanding the main story**, Archive |
| **Star chart fitting** | rotate and fit map fragments together until a hidden location emerges | ancient archives, ship logs | **new locations on the star map** |
| **Balance scales** | deduce the relative weight of relics from comparisons | treasure vaults, sacrificial altars | relics, Information |

**Why so many?** Because each one is a **different mode of thinking** (deductive, spatial,
pathfinding, state transition, comparison) and each has a **different reward domain** — so they are
not interchangeable, and every one of them matters. Star chart fitting, for instance, literally
**opens new places on the star map**, which feeds back into the strategic layer: solving the puzzle
gives you a concrete destination.

**Difficulty scaling.** Every type has a size and constraint parameter that grows with the
Darkening level and Archive progress. On generation the solver checks both that (a) a solution
exists and (b) **no guessing is required** — everything is derivable by logic.

---

## 7. The two starting heroes

Both carry equal weight. Only their *toolkits* are entirely different.

### Runesmith — the ground-shaper
A melee builder who **rearranges the battlefield**: shields for himself and his partner, traps,
raising rune pillars and walls (blocking terrain that also cuts line of sight), knockback, prone,
**Anchor**. Strong single-target damage, short range, slow initiative. On exploration missions he
opens the way and stabilises collapsing structures.

### Echo-reader — the pattern-reader
A ranged hexer who **plays with her own discard pile**: area hexes and weakening, **Rune Mark**,
and **Echo** — for Flux she can replay an effect out of her discards. She is the one who *handles*
fatigue well, while the Runesmith merely suffers it. Fragile, fast initiative. On puzzle missions
she supplies hints and partial information.

The pairing works because the two heroes **manage different resources**: the Runesmith manages
space and armour, the Echo-reader manages cards and Flux.

---

## 8. Variety — from four sources

**1. Procedural maps and missions.** The star map is generated. Mission maps come from a room kit
(10x10): room pieces, corridors, terrain features (cover, chasm, rune pillar, ash drift). Biome
kits: ship interior, ancient temple, dead planet surface, crystal forest.

**2. Random enemies and modifiers.** The starting enemy set:
- **Ash Husk** — melee swarm, few hit points
- **Rune Sentinel** — ranged, shields its allies
- **Choir Wraith** — fast, drains Flux
- **Godmachine Shard** — slow, enormous area damage

Each has an **intent set** (3-4 intents) from which it reveals one at the start of the round.
Global modifiers (not implemented yet): rune storm, unstable gravity, dense ash, silent space.

**3. Random rune and research offerings.** Every expedition brings different runes, different
research projects, different crew members — so the same hero builds up differently.

**4. Branching story and encounter set.** Written situations with choices that close and open
branches.

**Implementation order:** 1-2-3 are generative, so they give a lot of variety for little manual
work → those come first. Item 4 (written content) grows gradually and can be poured in
indefinitely later.

---

## 9. Meta-progression: the Archive

Every expedition — even a failed one — sends its data home through the Gate. That is what builds
the **Archive**, and as it grows it unlocks:
- new hero classes (Shadowrunner, Choir Warden, Machine-mind Rider, Time-bender…)
- new cards for the existing classes
- new ship modules, rune types, research projects
- new crew members, enemies, biomes, encounters
- deeper layers of the main story (this is where glyph reading pays off)

**It unlocks content, not power.** The world grows richer rather than easier — so the twentieth run
is still exciting.

---

## 10. Gradual introduction

The introduction is tied **to the first expedition, not to every run:**

- weeks 1-3: only basic stations and basic cards, no runes, no Flux
- weeks 4-8: the rune core and Flux appear, the first puzzle
- from week 9: rune slots, research projects, alien technology
- after that everything is open, and the Archive adds further layers

---

## 11. Graphics

**Stylised flat 2D.** Silhouettes, little detail, a strongly restricted palette, plenty of glow and
rune light. New figures are quick to make, they read excellently on the grid, and the melancholic
mood suits the style particularly well.

Palette:
- ground: ash grey and deep blue — a cold, dead world
- rune light: glowing amber — the magic that still burns
- technology and echoes: cold cyan
- danger: muted red

---

## 12. What we have to handle deliberately

**The alpha player problem.** In an open-information co-op it is easy for one player to end up
deciding for both. Built-in countermeasures: two separate domains on the ship (engineering and
research), two entirely different card sets with different resources, and shared decisions placed
exactly where the negotiation *is* the game (power allocation, route, moral dilemmas, the
choreography of the round).

**The pace of the weekly turn.** If a quiet week under way also takes three minutes, the game
becomes unbearable. That is why the standing-configuration principle matters, and why most weeks
have to be **one click**. It is a number to measure during playtesting.

**Mission length.** The "small and dense" decision is critical. If a mission runs past 25 minutes
you will not feel any progress in an evening.

**Content volume.** Four sources of variety means a lot of content. Generative systems first,
hand-written content after, continuously.

---

## 13. Technology

| Decision | Why |
|---|---|
| **Vite + React + TypeScript** | The strategic layer is essentially a complex interface, and that will be the larger part of the game. Vite's instant reload is worth its weight in gold while balancing. |
| **SVG for the grid and the puzzles** | The flat, silhouette style is made for SVG: crisp at any resolution, easy to click, palette from CSS variables. |
| **The rules engine is plain TypeScript, no React** | A separate `engine/` folder that knows nothing about the interface. Machine testable, and the same engine will serve the exploration missions and boarding fights too. |
| **Seeded randomness** | Every battle has a seed. If something is buggy or unfair we can reproduce it exactly. |
| **Content in typed data files** | Cards, enemies and intents live in separate files where only numbers need changing. TypeScript still shouts if you mistype something. |
| **English code, bilingual interface** | Identifiers and comments are English. Player-facing text lives as `{ hu, en }` pairs in the content files, right next to the number it describes. The log is stored as structured events rather than finished sentences — which is why switching language rewrites past lines too. |
| **Runs locally only** | No server, no account, no cost. You play on one machine, so nothing else is needed. |

---

## 14. Implementation status

**The game is finished and plays through.** How to start it, the commands and the
structure: [README.md](README.md). Rules: [RULES.md](RULES.md).

Essentially all of the plan is built: the strategic layer (weekly turn, power allocation,
stations, crew, seven resources, star map, the Gate and the Darkening, research on two
branches, market, encounters), the tactical layer (five mission types, card economy,
initiative, combos, Flux, fatigue, traps, collapsing floors), all nine puzzles, the
understanding-driven endings of the Stargrave, the Archive, automatic saving, and real-time
Hungarian/English switching on every screen.

### Where we departed from the plan — and why

1. **The puzzles run on their own panel, not on the tactical grid.** The plan had three
   puzzles (Gravity cores, Safe ground, Power routing) reusing the battle layer. Writing it
   showed that this spoils two things: the grid's click language is built for combat
   (targeting, movement, halves) and is misleading inside a puzzle; and nine puzzles can be
   handled **uniformly** if they all share one frame. So a single `PuzzleView` serves all of
   them, and the generators stay testable without any interface at all.
2. **The discard pile comes back between missions; a lost card does not.** The plan never said
   how long fatigue lasts. If the discard carried over, every mission would start crippled and
   a long expedition would be mathematically hopeless; if everything came back, resting would
   weigh nothing. The line between them: **what you threw away, the ship sorts out; what you
   lost forever is the expedition's loss.**
3. **Morale drifts towards a target instead of moving linearly.** From botted playtests: a
   linear decline hit zero by week 4 with no way back. The target model applies the same
   pressure (bad conditions to low morale) but is **fixable**, which is a far better decision.
4. **Morale was pulled out of the resource list.** The plan had seven resources in one list,
   but morale is not something you stockpile — it is a *state*, and it needed its own rule.
5. **Optional assets.** The plan only promised a list. In the end the code *wires them up* in a
   way that makes their absence silent: sound, portraits and card art come alive the moment a
   file appears, and until then nothing points at them (see `src/ui/assets.ts` and
   [public/assets/README.md](public/assets/README.md)).

### Balance decisions that testing forced

These came from measurement and play, not designer taste; the full list is the README's
balance log, and these are the ones that touch the design:

- **Losing cards is good; running out of cards is not.** A hand of 13 with the loss chosen by
  hand keeps the drama of fatigue without making the second mission hopeless.
- **A defensive enemy is the riskiest design element there is.** The Rune Sentinel's unbounded
  shield was not "hard", it was *slow* — and slow is much worse. Hence `SHIELD_MAX = 3` and
  the rule that two Sentinels never share a map.
- **Scaling a logistical spiral linearly is lethal.** Life support and food demand grew in
  proportion to the crew, so every person you recruited brought the end closer: the exact
  opposite of what a crew-collecting game wants.
- **Time pressure should be generous; the *detour* should be expensive.** That way the Gate
  counter does not say "hurry", it says "what will you skip" — and that reshapes every
  decision in the strategic layer.

### What is left

1. **Playtesting, the two of you.** The one thing a machine cannot do. The knobs are in the
   README's table.
2. **Assets** — sound and portraits; the code is already waiting for them.
3. **Ambient music** — the two loops are deliberately unwired: they need their own switch and a
   rule for ducking during battle.
4. **More content** — the bottleneck is not the systems but the *writing*: more encounters, more
   research projects, more enemy types, a third hero class. Every one of those is a `content/`
   file with no engine change.
