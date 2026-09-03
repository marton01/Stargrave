// What only you can see.
//
// THE PROBLEM THIS EXISTS FOR
//
// Every screen in this game showed every player the same thing. Four people were
// looking at one board with one true state on it, which means the table's best
// strategist could work out the right move for all four seats and say it out
// loud — and everybody else became a pair of hands. That is quarterbacking, and
// it is the way co-operative games most often stop being social: replace one
// player with an automaton and nothing about the evening changes.
//
// The cure is not to give people separate goals. It is to give them separate
// FACTS. When the Rite-caller is the only one who can see that Kane Mardov has
// four weeks left before he walks, the table cannot route around her: she has to
// say it, in her own words, and the others have to decide whether to spend the
// week on it. That is a conversation the rules created and did not script.
//
// THE RULES THIS FOLLOWS
//
//   **Private, never secret.** Nothing here is hidden FROM the table — it is
//   held BY one player. Every reading is meant to be said out loud; the game
//   just makes somebody responsible for saying it.
//
//   **Actionable, or it is decoration.** A reading has to change what the week
//   is worth doing. "The hull is at 17" is trivia. "Two more encounters at this
//   shield setting and we lose the Forge" is a decision.
//
//   **It is the hero's, not the seat's.** Whoever plays the Astromancer sees the
//   road, in every game, in every seat. That is what it means for a class to be
//   yours.
//
// In local play at one keyboard every reading is shown, because there is one
// screen and hiding things from it would be theatre. The asymmetry is real in an
// online room, which is exactly where quarterbacking is worst.

import { HERO_CLASSES } from '../../content/heroes'
import { MODULES } from '../../content/ship'
import { loyaltyBand } from '../../content/crew'
import { aboardChance, councilDue, councilSupport, livingCrew, sensorOutput } from './expedition'
import { mapNode } from './starmap'
import type { ExpeditionState } from './types'
import type { HeroClassId, Text } from '../types'

/** One thing one hero knows. */
export type Reading = {
  /** How urgent it is to say this out loud. */
  tone: 'plain' | 'warn' | 'bad'
  text: Text
}

/**
 * What this hero can see that the others cannot.
 *
 * Read from the same state as everything else — there is no hidden information
 * in the engine, and there must not be: the whole game is a pure function of a
 * shared seed, and a second private state would break the lockstep the room
 * runs on. What is private is only WHO IS SHOWN IT.
 */
export function privateReading(s: ExpeditionState, hero: HeroClassId): Reading[] {
  switch (hero) {
    case 'runesmith':
      return forgeReading(s)
    case 'echoreader':
      return echoReading(s)
    case 'cantor':
      return crewReading(s)
    case 'surveyor':
      return roadReading(s)
  }
}

/**
 * The Runeweaver has his hands on the ship.
 *
 * He is the only one who knows how much the hull will actually take before
 * something breaks, as opposed to what the number at the top of the screen says.
 */
function forgeReading(s: ExpeditionState): Reading[] {
  const out: Reading[] = []
  const hull = s.resources.hull
  const max = 20

  // What one bad encounter costs at the current shield setting. This is the
  // number that decides whether the shields are worth the reactor point, and
  // nobody else at the table can work it out.
  const soak = s.power.shields
  const bite = Math.max(1, 6 - soak)
  const survives = Math.max(0, Math.floor((hull - 1) / bite))
  out.push({
    tone: survives <= 2 ? 'bad' : survives <= 4 ? 'warn' : 'plain',
    text: {
      hu: `A pajzs mostani állásán egy rossz találkozás ${bite} hajótestet visz. Ennyiből még ${survives} fér bele.`,
      en: `At this shield setting a bad encounter takes ${bite} hull. There is room for ${survives} more.`,
    },
  })

  if (hull < max * 0.5) {
    out.push({
      tone: 'warn',
      text: {
        hu: 'A varratok tartanak, de nem szeretem. A Kohó egy hete nem elég ahhoz, hogy behozzuk.',
        en: 'The seams are holding and I do not like them. One week of the Forge will not catch this up.',
      },
    })
  }

  // Which module is standing on the thinnest ice in a boarding action.
  const first = s.modules[0]
  if (first) {
    out.push({
      tone: 'plain',
      text: {
        hu: `Ha hajóra törnek, ez áll legelöl: ${MODULES[first].name.hu}.`,
        en: `If we are boarded, this one stands closest to the door: ${MODULES[first].name.en}.`,
      },
    })
  }

  return out
}

/**
 * The Pastcaller hears what is coming before it arrives.
 *
 * Not the future: the pressure. She is the one who can say "this week is going
 * to ask us for something" while there is still time to be somewhere else.
 */
function echoReading(s: ExpeditionState): Reading[] {
  const out: Reading[] = []

  const chance = aboardChance(s)
  out.push({
    tone: chance >= 0.5 ? 'warn' : 'plain',
    text:
      chance <= 0
        ? { hu: 'A hajó csendes. Ezen a héten nem szól semmi.', en: 'The ship is quiet. Nothing will speak this week.' }
        : chance >= 0.5
          ? {
              hu: 'A hajó feszül. Erre a hétre nagy eséllyel készülni kell valamire.',
              en: 'The ship is tight. There is a good chance this week asks us for something.',
            }
          : {
              hu: 'A hajó nyugodt, de nem néma. Lehet, hogy történik valami.',
              en: 'The ship is calm but not silent. Something may happen.',
            },
  })

  if (s.attention >= 5) {
    out.push({
      tone: 'bad',
      text: {
        hu: `Már nem csak hallgat. ${8 - s.attention} lépésre van attól, hogy elinduljon.`,
        en: `It is no longer only listening. It is ${8 - s.attention} steps from setting out.`,
      },
    })
  }

  // What is coming due, and when — she reads the ship's own promises.
  const soon = s.debts.filter((debt) => debt.at - s.week <= 2 && debt.kind !== 'leaving')
  for (const debt of soon) {
    out.push({
      tone: 'warn',
      text: {
        hu: `${debt.at - s.week} hét: ${debt.note.hu}`,
        en: `${debt.at - s.week} weeks: ${debt.note.en}`,
      },
    })
  }

  return out
}

/**
 * The Rite-caller knows the people.
 *
 * The crew list shows everybody a band — "withdrawn", "not speaking to
 * anybody". She sees the number, and she sees the date somebody has set on
 * themselves. This is the reading that most needs to be said out loud, and the
 * table cannot get it any other way.
 */
function crewReading(s: ExpeditionState): Reading[] {
  const out: Reading[] = []

  const leaving = s.debts.filter((debt) => debt.kind === 'leaving')
  for (const debt of leaving) {
    const member = s.crew.find((c) => c.id === debt.subject)
    if (!member) continue
    out.push({
      tone: 'bad',
      text: {
        hu: `${member.name} ${debt.at - s.week} hét múlva lelép. Mentor vagy jobb hajó még megállítja.`,
        en: `${member.name} walks in ${debt.at - s.week} weeks. A mentor or a better ship still stops it.`,
      },
    })
  }

  const sinking = livingCrew(s)
    .filter((c) => c.loyalty <= 4)
    .sort((a, b) => a.loyalty - b.loyalty)
  for (const member of sinking.slice(0, 3)) {
    if (leaving.some((debt) => debt.subject === member.id)) continue
    out.push({
      tone: member.loyalty <= 3 ? 'warn' : 'plain',
      text: {
        hu: `${member.name}: ${member.loyalty}/10 — ${loyaltyBand(member).name.hu}. Innen két hét, és bemondja.`,
        en: `${member.name}: ${member.loyalty}/10 — ${loyaltyBand(member).name.en}. Two weeks from here and they say it.`,
      },
    })
  }

  const tally = councilSupport(s)
  if (tally.for > 0) {
    out.push({
      tone: councilDue(s) ? 'warn' : 'plain',
      text: {
        hu: `A ${tally.of} főből ${tally.for} akar mondani valamit. ${councilDue(s) ? 'Ezen a héten ki is mondják.' : ''}`,
        en: `${tally.for} of ${tally.of} have something to say. ${councilDue(s) ? 'This week they will say it.' : ''}`,
      },
    })
  }

  if (out.length === 0) {
    out.push({
      tone: 'plain',
      text: {
        hu: 'Mindenki rendben van. Ezt is meg kell mondani, amikor igaz.',
        en: 'Everybody is all right. That is worth saying out loud too, when it is true.',
      },
    })
  }

  return out
}

/**
 * The Astromancer reads the road.
 *
 * Everybody can see the star map. He is the only one who can say what a leg
 * actually costs before the ship commits to it — and whether the sensors are
 * about to pay for themselves.
 */
function roadReading(s: ExpeditionState): Reading[] {
  const out: Reading[] = []

  const here = mapNode(s.map, s.at)
  const legs = here.links.map((id, i) => ({ node: mapNode(s.map, id), weeks: here.linkWeeks[i] ?? 1 }))
  const cheapest = legs.slice().sort((a, b) => a.weeks - b.weeks)[0]
  const dearest = legs.slice().sort((a, b) => b.weeks - a.weeks)[0]
  if (cheapest && dearest && cheapest.weeks !== dearest.weeks) {
    out.push({
      tone: 'plain',
      text: {
        hu: `Innen a legrövidebb út ${cheapest.weeks} hét, a leghosszabb ${dearest.weeks}. A Kapuból ${s.gateWeeksLeft} maradt.`,
        en: `The shortest leg from here is ${cheapest.weeks} weeks, the longest ${dearest.weeks}. The Gate has ${s.gateWeeksLeft} left.`,
      },
    })
  }

  // The one number nobody else can compute: whether the ship can still get home.
  const fuelNeeded = legs.reduce((worst, leg) => Math.max(worst, leg.weeks), 0) * 2
  out.push({
    tone: s.resources.fuel < fuelNeeded ? 'bad' : s.resources.fuel < fuelNeeded * 2 ? 'warn' : 'plain',
    text: {
      hu: `A leghosszabb innen induló ugrás nagyjából ${fuelNeeded} üzemanyag. Van ${s.resources.fuel}.`,
      en: `The longest jump from here runs to about ${fuelNeeded} fuel. There is ${s.resources.fuel}.`,
    },
  })

  const unknown = s.map.nodes.filter((n) => !n.known).length
  out.push({
    tone: 'plain',
    text: {
      hu:
        sensorOutput(s) > 0
          ? `Az Érzékelők hetente ${sensorOutput(s)} oszlopnyit tárnak fel. ${unknown} rendszer van még sötétben.`
          : `Az Érzékelők állnak. ${unknown} rendszer van sötétben, és így is marad.`,
      en:
        sensorOutput(s) > 0
          ? `The Sensors open ${sensorOutput(s)} columns a week. ${unknown} systems are still dark.`
          : `The Sensors are down. ${unknown} systems are dark and will stay dark.`,
    },
  })

  return out
}

/** The heading a hero's own readings sit under. */
export function readingHeading(hero: HeroClassId): Text {
  const name = HERO_CLASSES[hero].name
  // Hungarian wants the definite article, and which one depends on the sound the
  // name starts with: "a Rúnaszövő", but "az Asztromanta".
  const article = /^[aáeéiíoóöőuúüű]/i.test(name.hu) ? 'az' : 'a'
  return {
    hu: `Amit csak ${article} ${name.hu} lát`,
    en: `What only the ${name.en} can see`,
  }
}
