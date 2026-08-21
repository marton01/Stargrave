# Stargrave — rules

> This file **is also the text of the in-game help**. Open it in the game with the
> `?` button in the header (or `F1`); the `##` sections below become tabs
> automatically. Edit it here and the help follows immediately.
>
> **IMPORTANT:** the sections of `RULES.hu.md` (Hungarian) must appear in **the same
> order** as here. The help picks which tab to open by position, because the titles
> differ per language. The order is: 1. Overview, 2. The weekly turn, 3. Star map,
> 4. Landings, 5. Puzzles, 6. Research, 7. The Stargrave, 8. The Archive, 9. Tips.
>
> The game pieces (units, terrain, badges) are not described here: the help **draws
> them live** with the same components the grid uses, so they can never drift from
> what you actually see.

## Overview

The two of you are the command crew of an expedition ship, **at one machine with one
mouse**. A Gate has opened onto a galaxy where a civilisation fused magic and
technology and then vanished within a single generation. No war destroyed it:
something *finished* them.

The goal is to reach the heart of the galaxy, the **Stargrave**, before the Gate
closes. But what you can do once you are there is not decided by your weapons. It is
decided by **how much you understood** along the way.

**All information is open.** That is deliberate: there is no point hiding anything on
a single monitor, so the tension comes from planning together rather than from secrecy.

**The game's two layers:**

- **The ship (the spine).** Weekly turns. Power allocation, crew placement, route
  selection, research, encounters, moral choices.
- **The landing.** When you set down somewhere you move to a tactical grid — but
  **combat is not the default**: roughly a third of missions are exploration, a third
  are logic puzzles, and a third are fights.

The header always shows the six resources, the crew count, your understanding, and
how many weeks remain before the Gate closes. The panel on the right is the **log**:
everything that has happened, most recent first.

## The weekly turn

A week is one click — or a dense run of decisions, depending on where you are.

**The key principle:** power allocation and crew placement are a **standing
configuration, not a weekly chore.** You set them up and only adjust when something
changes. A quiet week under way then takes half a minute, while arriving in a system
is real planning.

### Power allocation

The reactor gives **8 units** (upgradeable). Seven systems want a share, and it is
never enough. This is a **joint decision** — the strongest cooperative element in the
game.

- **Life support** — a mandatory minimum by crew size (one unit per four people). Too
  little and morale decays and people are lost.
- **Engines** — how many weeks a jump takes, and how much fuel it burns.
- **Shields** — protection in encounters: this decides how much the hull pays for a
  risky choice.
- **Lab** — Information output and research speed.
- **Forge** — hull repair.
- **Sensors** — how far ahead you can see on the star map.
- **Rune core** — **this becomes the landing party's Flux.** Whatever you give it is
  what they fight with. This is what ties the two layers together.

**Does the amount matter?** Yes, with one exception — and the ship screen states, under
every system, what the current allocation **buys right now**, as a number. There is no
guessing whether a fourth point earns its keep.

- **Scales linearly**: Engines (every point above the first cuts a week off a journey),
  Shields (absorbs that much hull risk), Lab (+1 information a week per point), Sensors
  (reveals that many columns), Rune core (that much Flux for the landing party), Forge
  (power and crew together, half a point each).
- **A threshold, not a scale**: **Life support**. Below what the crew needs, morale falls
  and people can die; **above it, not one point does anything**. That is a system to spend
  exactly on, never to stockpile.

### Stations

You post crew members to stations. A station only works if it **has power AND has crew
standing on it** — that double constraint is where the scarcity lives.

Every crew member has a speciality and is considerably more effective on the matching
station. Traits (brave, sceptical, of alien descent, veteran…) affect morale, research
or alien technology.

**Does the number of people matter?** The first one is what makes a station run at all.
The second now **adds something everywhere**: the Forge repairs more, the Medbay heals
more, the Sanctum holds morale higher, the Bridge saves more fuel, the Archive skips two
weeks of research instead of one, the Armoury gives an extra Flux. Someone whose
speciality fits counts double — and the station's card shows what it is producing **now**.

### Morale

Morale **drifts towards a target** rather than falling or rising in a straight line.
The target comes from conditions: the crew's traits, whether the Sanctum is running,
life support, food, and the Darkening level. When things go badly morale sinks to a
floor and stays there — fix the cause and it recovers. **At zero it is over**, though:
the crew refuses orders.

### What happens at the end of a week

Food is eaten (one unit per three people per week) and fuel burns if you are under
way. Stations run. Research advances. Travel moves on. And the Gate counter drops by
one.

## Star map

Systems in columns, with roads leading forward. **You choose the road**, and every
road costs weeks — the longer one costs more.

**There are eight node kinds:** ruins, anomalies, inhabited worlds, stations, trading
posts, distress calls, empty space, and at the far end the heart of the galaxy. What each
one holds — and with what odds — is in the **legend** below, drawn with the same marks
the map uses.

<!-- legend: nodes -->

Anything the Sensors have not revealed shows as a question mark. The power you give
the sensors literally decides how blind you travel.

### Decisions

In an encounter, taking a choice is **two steps**: you click it, the full account
appears — *what it asks* and *what it gives* — and only then is there a confirmation, or
a way back. That is deliberate: understanding an option must not be the same act as
taking it. Buying at a market and choosing an ending at the Stargrave work the same way,
and a battle has an undo (Ctrl+Z).

**Paying with cards.** A few decisions are not paid in supplies but in **cards from the
heroes' decks, permanently**. The account says how many and which symbol (⚒ force,
◈ insight), and you choose which ones to hand over. It is the most expensive price in
the game: a decision on the bridge is paid for on the next landing.

**Decisions continue.** A situation does not always end in one paragraph. Your answer can
leave a trace and **come back later** — at another node in the same expedition, or in a
**later expedition**, because the Archive remembers that too. What you let out will find
you. The people you did not help are read about.

So there are no empty decisions: if a closing line says something set off somewhere,
then something set off somewhere.

### Credits — where they come from, where they go

**You start with 12 credits** and the counter stops at 99. Credits cannot buy
understanding and cannot buy weeks: they buy equipment, supplies and people.

**Where they come from:**

- **Landings.** Every completed mission pays, **7, 10 or 13** credits depending on
  difficulty. This is the predictable income: if you need credits, you take a mission.
- **A fight you did not choose.** When the ship is boarded, or ruins have to be cleared,
  the fight pays **6**.
- **Puzzles.** The reward is random: roughly a **thirty percent** chance of credits
  (**11–17**, by difficulty), otherwise information, understanding or a revealed stretch
  of map. So you cannot go to a puzzle *for* credits.
- **Encounters.** The best trade is **selling information**: 6 Information for **14**
  credits at the trader swarm, 10 Information for **20** from the Archivist. Boarding a
  drifting hulk pays (**8**), stripping a sentinel for parts (**9**), forcing a sealed
  vault (**14**), sampling the edge of the crystal forest (**5**).
- **Some decisions pay.** Leaving the refugees behind, or not telling the children of ash
  the truth, pays **6**. That is deliberate: credits are sometimes the price you are paid
  instead of somebody else.

**Where they go:**

- **Trading posts.** Supplies (8 credits → 12 food, 10 → 8 fuel, 12 → 6 hull, 9 → 5
  information), a **module** (from 22, rising with map depth), **hiring crew** (from 10,
  the same way).
- **Encounters.** In a few situations credits are the answer itself: the scavengers'
  demand is 12, fuel from the trader swarm 10, food 8.

Information is therefore useful twice: research needs it, and sold it is the most
profitable source of credits in the game. That is one of the real decisions — what you
sell, you do not understand.

### The Gate and the Darkening

The counter is measured in weeks (short run ~20, medium ~28, long ~40). It passes
through four **Darkening levels**, and with each one:

- stronger enemy variants appear,
- reactor output drops,
- morale is harder to hold.

The counter is **generous enough that a direct route fits comfortably.** The pressure
comes from every detour, every extra piece of research and every ship you save
*costing weeks*. That is what makes route selection a real decision.

If the Gate closes before you arrive, you are stranded. That is an ending of its own,
not a plain failure — what you discovered made it through at the last moment.

## Landings

The tactical grid: squares, movement in **8 directions**, and **a diagonal step counts
as 1**. You cannot cut diagonally between the corners of two obstacles.

The objective comes from the mission and always sits at the top of the screen: defeat
every enemy, reach a point, collect relics and extract, hold out for X rounds, or hold
a point. **On exploration missions the enemies can be avoided** — the challenge is the
terrain, the collapsing floor and the clock.

### The shape of a round

**1. Card selection.** The enemies **have already revealed their intent** — the sidebar
spells out what each will do and at what initiative. Only then do you choose cards.
This is the most important rule in the game: **you know what is coming.**

Player 1 first, then player 2: click **two cards**, then mark which one provides the
**initiative** — that decides where you act among the enemies. Then **Ready**.

**2. Resolution.** Everyone acts in initiative order, from the lowest number upwards,
heroes and enemies interleaved.

When a hero's turn comes: the game asks which card's **top** half you use (the other
card's **bottom** half becomes its partner), then you click the half you want to
resolve. **The order is yours** — do you move first or strike first? If the effect
needs a target, the options light up on the grid.

### Flux — the shared force

Every card has **two halves**, a **top** and a **bottom**, and on your turn you play the
top of one card and the bottom of the other. Most halves are free — a few of the stronger
ones have **a price printed on them**, a `◈` and a number. **Flux is what pays that
price.**

**So there are card halves that can only be played if there is enough Flux.** When there
is not, that half simply cannot be picked — the card's other half (the movement, the
shield) still can. And Flux is good for **nothing else**: not movement, not healing, not
anything besides this. It does one thing: it opens the halves with a price tag.

The pool is **shared**: one number, shown in the header as `FLUX (SHARED)`, and **both
players spend from the same one**. It is not hit points and not mana that refills by
itself: a landing party is given a batch, and it lasts as long as it lasts.

**Where it comes from** — the ship, and this is the thread that ties the two layers
together:

- **The power you gave the rune core.** However many units sit on the rune core is how
  much Flux the party lands with. That is the point of the choice: power on the rune core
  produces nothing aboard, and counts only *down there*.
- **The Armoury station** gives +1 when it has both power and hands (+2 when well
  staffed).
- **The Rune amplifier module** gives +2 (from research).
- **The difficulty dial** "Starting Flux" shifts it by +3 to −2.

**During a battle** there are two more sources:

- **Flux Tap** (Echo-reader card): Attack 1 at range 3, **and +2 Flux into the shared
  pool**. It is the only card that produces any.
- **Rune Mark**: when a marked enemy falls to a hero, **+1 Flux**.

**What it buys.** Five card halves carry a price tag — the heavy artillery of a battle:

| Card | What it does | Cost |
|---|---|---|
| **Forge Wrath** (Runesmith) | Attack 4, range 1 | 1 |
| **Earthquake** (Runesmith) | Attack 2 against **every** adjacent enemy, and knock down | 2 |
| **Hex Ring** (Echo-reader) | Attack 2 against **every** enemy within range 2 | 1 |
| **Ash Veil** (Echo-reader) | Blind every enemy within range 2 — **their attacks deal nothing** | 1 |
| **Echo** (Echo-reader) | Replay the top half of one of your spent cards | 2 |

The price is printed on the card in play (`◈2`), and if the pool does not hold that much,
**the half is not clickable** — the game will not let you play what you cannot pay for.

**Why shared?** Because it makes Flux a **conversation** rather than a resource. At two
Flux, the Runesmith's Earthquake and the Echo-reader's Echo are an either/or, and it has
to be talked through. That is the densest cooperative moment in the game.

**An example.** You gave the rune core 2 power and the Armoury is running: the party lands
with **3 Flux**. In round two, four Ash Husks surround the Runesmith.

- *Earthquake* (2 Flux): all four take damage and go down — **1 Flux** left.
- Or *Hex Ring* (1) with the other hero plus *Forge Wrath* (1) on the Rune Sentinel —
  **1** left.
- Or nothing expensive: all 3 kept for the Rune Sentinel, who acts next round.

If the Echo-reader plays *Flux Tap* meanwhile, the pool is back at 3 and both are
playable. That is why the Tap is worth more than its damage suggests.

**Worth knowing:**

- **It does not refill each round.** One batch per landing.
- **It does not come home.** Leftover Flux is gone when the mission ends — there is no
  point hoarding it for a last round if it is needed now.
- **The rune core's power can be reallocated every week.** Move power onto it before a
  fight; less so before an exploration run.

Some of the halves you play have **a price on them** (`◈` and a number): those can only be
played if the shared **Flux** pool holds enough. See below.

### Why only two cards?

Because every card has two halves, and each round you use the **top** half of one and
the **bottom** half of the other. Every card is useful in two ways, but you only get
one of them. The question is not which card is good but **which half you give up.**

On top of that the initiative comes from one of the two cards: you decide *what* you do
and *when* you do it in the same breath.

### Fatigue

Cards you play go to the **discard** pile, and during a battle they do not come back on
their own. **Resting** returns them and heals 2 — **but one card is lost forever**, and
you choose which. Resting costs your entire turn.

If you have fewer than two cards in hand you must rest. If there is nothing to rest
from, the hero **is exhausted** and leaves the battle — even at full health.

**Between missions the ship recovers the discard pile.** What is *permanently* lost is
lost for the whole expedition. That is the attrition that matters, and you chose every
piece of it.

### Combos

This is what makes the game cooperative. The **Bond** matters most: while you are
within 2 tiles of each other, **both of your attacks deal +1**. **Rune Mark** and
**Anchor** are the real cooperation: the Echo-reader marks someone from a distance and
the Runesmith hits it for +2 in the same round — which requires lining up the
**initiative**.

**Shield** stacks only up to 3; it subtracts from every hit, then drops by 1.

## Puzzles

Roughly a third of missions are logic puzzles. **There are nine kinds, all generated**,
so they come in endless variations.

**Two rules hold for every one of them:**

1. **No language in them.** Every puzzle is solvable from symbols, geometry, numbers
   and spatial relations. No wordplay, no anagrams, no letter counting. The answer is
   always a click or a placement, never typing.
2. **No guessing.** Where a puzzle could in principle be ambiguous, the generator
   verifies that the solution is the *only* one consistent with the clues shown.

- **Rune decoding** — work out a rune sequence from partial feedback.
- **Balance scales** — order relics by weight from comparisons.
- **Glyph reading** — the composition rules of an alien sign system, in icons.
- **Safe ground** — which floor tiles give way, from adjacency counts.
- **Power routing** — rotate conduits so the reactor reaches every terminal.
- **Refraction** — turn mirrors so the rune-light reaches every focus.
- **Star chart fitting** — fit fragments together by their edge codes.
- **Resonance tuning** — bring dials to zero, where every tap affects its neighbours.
- **Gravity cores** — push ancient cores into place.

Each has a **different reward domain**: star chart fitting, for instance, literally
opens new places on the star map. That is why they are not interchangeable, and why
every one of them is worth solving.

The first expedition starts with three kinds. The Archive opens up the rest.

## Research and understanding

One pool of Information, **two branches**:

- **Technology** — immediate capability: ship modules, reactor upgrades, more Flux,
  sensors that see further, a bigger hull.
- **Understanding** — the secrets of the world: what happened to this galaxy, what the
  godmachines are, what finished them.

**The dilemma is deliberately sharp: understanding grants no combat advantage.** It
will not make the ship stronger and it will not improve your cards — and yet it is the
key to victory. The purely optimising route is *not* the right one.

Understanding does not only come from research: encounters, glyph reading and certain
missions all give it.

## The Stargrave

The heart of the galaxy. This is what you have to reach before the Gate closes.

And here is the twist: **your understanding decides what you can do there at all.** The
same location, entirely different endings:

- **low understanding** — you can only flee, or blindly destroy what you found;
- **medium** — you learn what happened and can carry the knowledge home;
- **high** — you recognise what *is happening*, and can intervene;
- **complete** — the deepest ending: you understand why it was never a war.

**In your first runs you will not even understand what you saw** — and that is exactly
the point.

### When an expedition is lost

Hull at zero takes the ship. Morale at zero takes the crew. Food running out is not an
instant end but a spiral you can still climb out of. If a landing goes badly that is
**not** the end of the run: they are pulled back to the ship — with wounds, missed
loot, a lost week, and quite possibly a dead crew member.

## The Archive

Every expedition — **even a failed one** — sends its data home through the Gate. That
is what builds the Archive, and as it grows it unlocks new puzzle kinds, deeper
encounters, a prepared cache, a steadier Gate.

**It unlocks content, not power.** The world grows richer rather than easier — which is
why the twentieth run is still worth playing. Understanding earns points even when the
expedition is lost: nothing is wasted.

### When does the whole game end?

An expedition ends one of three ways: you reach the Stargrave and **choose an ending**,
you fail, or the Gate closes. The *game*, though, has an end of its own, and that is the
goal:

**There are five endings**, gated by understanding — two are reachable with none at all,
the rest from tiers 1, 2 and 3. The Archive shows which you have seen. That collection is
the real progress: not becoming stronger, but seeing all five, because they only add up
together.

**Once you have all five** — and have followed at least two threads to their end, so you
have not merely watched consequences but done something about them — **The last question**
appears in the Archive. It is the most expensive unlock and it grants no new game piece:
it opens a **sixth ending**, answerable only at understanding tier 3, at the Stargrave.

That sixth one is the end of the game. After it the Archive is **finished** — not lost,
finished. Until then you can run as many expeditions as you like; after it too, though you
will not need to.

## Tips

1. **The log and the enemy's intent are the most important text on screen.** Skip them
   and you are playing blind.
2. **Never leave Life support below what the crew needs.** That is the kind of loss
   that runs for weeks and does not announce itself.
3. **The rune core IS the Flux.** If you are landing tomorrow, give it power today —
   and if you are only travelling, it is wasted there.
4. **Post somebody to the Sanctum.** Morale drifts towards a target, and the Sanctum
   raises the target.
5. **Sensors are not a luxury.** Choosing a road blind costs more than one unit of
   power.
6. **Kill the Rune Sentinel first** in a fight: it shields everyone, and everything
   slows to a crawl while it lives.
7. **Stay within 2 tiles** for the Bond bonus — but do not both stand next to the same
   enemy if it has announced an area attack.
8. **Plan your rest, do not suffer it.** It costs a turn, so it is better done when
   nobody is breathing down your neck.
9. **Understanding is not an indulgence.** Pour everything into the ship and you will
   arrive — with nothing you can do.
