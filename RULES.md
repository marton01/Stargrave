# Stargrave — rules

> This file **is also the text of the in-game help**. Open it in the game with the
> `?` button in the header (or `F1`); the `##` sections below become tabs
> automatically. Edit it here and the help follows immediately.
>
> **IMPORTANT:** the sections of `RULES.hu.md` (Hungarian) must appear in **the same
> order** as here. The help picks which tab to open by position, because the titles
> differ per language. The order is: 1. Overview, 2. The weekly turn, 3. Star map,
> 4. Landings, 5. Puzzles, 6. Research, 7. The Stargrave, 8. The Archive,
> 9. Consoles, 10. Attention and the Herald, 11. Orders from home,
> 12. When does it end?, 13. Tips.
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
- **Engines** — how many weeks a jump takes and what it burns a week. A trade rather than
  free speed. **The first point is what lets the ship move at all**: on no power you cannot
  set a course, and a jump already under way stalls (the week passes anyway, and the crew
  takes it badly). After that, **every point above the first cuts a week, and every point
  above the second adds a unit of fuel** to each week under way. On a three-week road, 2
  power is two weeks at 2 fuel (four in total), 3 power is one week at 3 (three in total),
  and 4 power is that same single week for 4. The Bridge takes one off every week.
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

- **Scales linearly**: Engines (the first point is movement itself, every further one cuts
  a week off a journey),
  Shields (absorbs that much hull risk), Lab (+1 information a week per point), Sensors
  (reveals that many columns), Rune core (that much Flux for the landing party), Forge
  (power and crew together, half a point each).
- **A threshold, not a scale**: **Life support**. Below what the crew needs, morale falls
  and people can die; **above it, not one point does anything**. That is a system to spend
  exactly on, never to stockpile.

### Stations

You post crew members to stations. A station only works if it **has power AND has crew
standing on it** — that double constraint is where the scarcity lives.

Every crew member has a speciality and is **considerably more effective on the matching
station** — anywhere else they only keep the station alive. Their card says which station
is home for them.

**One rule that makes the whole posting table simple:** the traits that affect station
strength (veteran, restless, young) **only count on the station of their own speciality**.
A veteran engineer is not a better scientist in the Lab than a scientist, and a restless
engineer does not raise the morale target in the Sanctum. The other traits (brave,
sceptical, devout, of alien descent…) affect morale, research or alien technology wherever
they stand.

Under every station the interface prints **what its number is made of**: who is on it,
whether it is their speciality, and what their rank and traits add. You do not have to
keep a spreadsheet.

**Does the number of people matter?** The first one is what makes a station run at all.
The second now **adds something everywhere**: the Forge repairs more, the Medbay heals
more, the Sanctum holds morale higher, the Bridge saves more fuel, the Archive skips two
weeks of research instead of one, the Armoury gives an extra Flux, the Sensors reveal one
column more with a navigator on them. **Every station rewards the speciality it is for** —
there are no exceptions — and the station's card shows what it is producing **now** and
what that number is made of.

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

**Upkeep cannot be driven to zero.** However you optimise — a manned Bridge, low engine
power, the gentlest upkeep dial — **at least 1 fuel goes for every week under way**, and
**at least 1 food a week**. That is deliberate: the ship runs and the crew eats. No
setting makes travel free; settings only make it cheaper.

There is one exception, and it has to be researched: **Fuel synthesis** **offsets** one
unit for every week under way. With a low engine setting and navigators on the Bridge the
burn can be brought to **exactly zero** — that is what the project is for, and why it is
expensive.

What it never does is fill the tank. Fuel **cannot grow** out of the weekly accounting,
under way or standing still — the synthesiser offsets, it does not produce. Fuel still
comes from markets, encounters and mission rewards: for those you have to go somewhere.

If there is not enough fuel for a week, **the jump stalls** (the journey gets a week
longer), morale drops by one, and the tank sits at zero. If there is not enough food the
crew goes hungry: morale −3, and somebody may die of it.

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

### Reading the rim

On arrival, **once**, before you decide anything: you can sit down in front of the
rim. One mechanism at the hardest setting. Solve it and you gain **2 understanding**
— which can open a different ending right there, in that moment, with the list
already on the screen. Fail and it costs morale. The last screen of an expedition
should be able to go wrong too.

### The nine endings

**Five come from understanding** (turning back, blind ruin, the witness, the
intervention, communion), and **four have to be earned** — those are not opened by
a number but by what you did:

| Ending | Condition |
|---|---|
| **Homecoming** | At any time on the road: turn back for the Gate while there is fuel |
| **The Herald's silence** | Stop the Herald, and arrive at understanding tier 1 |
| **Inheritance** | Three relics aboard, at understanding tier 1 |
| **Taking the watch** | Arrive with five crew alive, morale 8 or more, understanding tier 2 |

The **Archive** lists all nine with their conditions — you see the name and the
condition in advance, the words only when you are standing in front of it. The
tenth, **The answer**, follows from the five understanding endings, and is the end
of the game.

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

## Consoles: what is yours

Almost everything on this ship is shared: **one reactor, one hold, one route**.
That is the point of the game — but if *nothing* belongs to either of you in
particular, then sooner or later one of you drives and the other watches. Hence
the **Consoles** tab (in the header, next to Research): two pages, one per person.

**The other one cannot reach in here.** You cannot take your partner's relic, you
cannot spend their marks, and you cannot take their mentee.

### Marks: two kinds, because it is two kinds of work

Each hero collects their **own** advancement points, and not for the same things:

| | Runesmith — *forge marks* | Echo-reader — *echo marks* |
|---|---|---|
| A landing won | +1 | +1 |
| A boarding action in which **no module** was destroyed | **+2** | — |
| A mechanism solved (a puzzle) | — | **+2** |
| An order carried out (on their own console) | +2 | +2 |
| Two trained mentees, when a landing is won | +1 | +1 |
| The Herald silenced | +3 | +3 |

The ship's integrity is on his account; understanding is on hers. That is not
decoration: because the game pays you for different things, you will **push in
different directions** in the decisions you share.

Marks buy from that console's own list. The two lists are deliberately not mirror
images: the Runesmith buys toughness, ground and ship structure (Ironback,
Wardlines, the Rampart card, Relic bearer, The quiet forge); the Echo-reader buys
sight, memory and understanding (Longsight, Archivist, Remembrance, Tether, The
Still Note card, Relic reader).

Two of them add a **new card** to your deck for good — and only to yours.

### Relics: only what you wear does anything

A relic is a **named object** with an effect: they come from exploration landings
(everything you carry out is one), from traders, from mechanisms and from a few
decisions.

**A relic in the hold does nothing.** Only what one of the heroes is **wearing
attuned** has any effect — and by default each of you can wear **one**. So the
real question is not whether you found a relic but **who wears which, this week**.

- More room: the *Relic bearer* / *Relic reader* perk, or the **Relic cradle**
  module (research), which gives one more to each of you.
- Some can be worn by **only one of you**: the Anvil fragment, the Silent plate
  and The first rune are his; the Choir shard and The ledger of names are hers.
- Some have a **price**: The watcher's eye sees further but gathers +1 attention a
  week; the Godmachine tap gives Flux but the crew does not like sharing a deck
  with it. It is always written down.
- Whatever nobody is wearing can be **sold** at a post. Think first: **three
  relics** open an ending of their own at the Stargrave.

### Mentees

Either hero may take **up to three** of the crew under their wing. A mentee learns
**twice as fast** at their post — and once two of them have reached *trained*,
every landing won pays their mentor a mark.

Only one of you can take a given person: if they are your partner's, they have to
let them go first.

### The crew grows too

Anybody standing on a **running** station (it has power and they are on it) earns
one week of work a week — two as a mentee.

- **8 weeks of work → *trained*.** Station strength +2, which is worth as much as
  being the station's own specialist. That is the human reason not to reshuffle
  everybody every week.
- **20 weeks of work → *master*.** They gain a **new trait** (brave, veteran,
  meticulous, devout or of alien descent). A long posting leaves a mark on the
  person, not only on a number.

Ranks show up on the Consoles and in the crew list.

### The ship's two halves

The ship's systems and stations are divided: **Engineering** is the Runesmith's
(Shields, Forge, Rune core; the Forge and Armoury stations), **Research** is the
Echo-reader's (Lab, Sensors; the Lab, Archive, Sensors and Sanctum stations). What
is **Shared** — Life support, Engines, Bridge, Medbay — really does have to be
decided together.

At the top of the Ship screen there is a **filter**: "Whose console". It locks
nothing, it only narrows the list down to what is yours. The other half stays
readable — a co-operative game where you cannot see your partner's screen is just
two solitaires.

## Attention and the Herald

The Gate's clock is the same on every expedition, and once you know it you stop
feeling it. **Attention** is not like that: this is a number **you write
yourselves**.

**It rises with:**

- a landing won: +1 (a boarding action: +2)
- a mechanism **forced**, that is, a puzzle failed: +1
- +1 a week while travelling with the **engines at 3**
- some decisions in encounters (always written out)

**It falls with:**

- a week spent **standing still** at a node that is already settled: −1
- the **Silence shroud** module (research): −2 a week
- the **Lantern of still air** relic: −2 · the **Hollow bell**: −1 · the *Quiet
  forge* perk: −1

Attention is in the header from the **first point**, because a threat you cannot
see coming is not tension but a trap.

### The Herald

At **eight**, something sets out from the deep. The Herald is not a guard and not
a hunter: it **counts** — for seventy years it counted how much noise arrived in a
dead galaxy, and every time it set out to look.

- On the star map a **column** is marked: that is where it is. It does not use the
  roads, it comes up the corridor — always towards you, **one column a week** (two
  above 12 attention). Running deeper does not help: it comes with you.
- If it **arrives**, there is a boarding action, the hardest fight in the game —
  and your modules are standing on that board too.
- **If you stop it:** it falls silent, and the Stargrave sends no other. Attention
  drops to nothing, both heroes gain 3 marks, and the ending **The Herald's
  silence** opens. The Archive remembers it as well: a later expedition can be
  asked about it.
- **If you only drive it off:** the hull pays, the Herald falls back three columns
  — and comes back **stronger**. Deliberately: "let us lose to it on purpose"
  must not be the way to beat the mechanic.
- **The Herald** research (understanding branch) makes the fight one level easier:
  whoever understands what it counts knows when it turns their way.

It can be **switched off entirely** on the difficulty dials (first step: no
Herald, and no attention either).

## Orders from home

From the far side of the Gate come **dated requests**: two run at once by
default, one on each console. The dial sets anything from 0 to 4.

An order is always **somebody's** order — that player answers for it, and takes
the marks if it comes good. One that runs out costs **2 morale**.

What they may ask for: win N landings · solve N mechanisms · have N relics aboard
· reach N understanding · finish N research projects · be in system column N ·
have enough morale or food at the deadline.

The target is always measured **from where** the ship stood when the order was
issued: an order never arrives already carried out. The ones that ask for stores
or morale are measured **only at the deadline** — until then you have to keep it
up.

## When does it end?

There are three answers, and that is deliberate:

1. **Reach the Stargrave** and choose there. Nine endings are out there — five
   opened by your understanding tier, four by what you did (see the Stargrave
   chapter).
2. **Turn back for the Gate.** From the star map, at any time, while there is fuel
   for it: **2 fuel per column**. This is **not a defeat**: everything you gathered
   goes through the Gate and the Archive gets it — every relic carried home is
   worth an extra point. At home they will not call it a victory. But whoever
   comes back can hand something on.
3. **Run out of time** on the far side. That is a defeat — and now it was a
   *decision* rather than a rule that ambushed you: the interesting week is the one
   where you could still turn round, and do not.

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
