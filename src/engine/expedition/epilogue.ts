// What happened to everybody.
//
// The ending screen used to say three numbers: weeks, understanding, archive
// points. And a run that had cost you Rasquen Mard in week nine — a name you had
// posted, taught, worried about and taken down onto a floor that gave way —
// finished with an integer.
//
// A crew member is the only thing in this game a player can be attached to.
// Naming every one of them at the end, and saying in one line what became of
// them, is the cheapest possible way to turn a score into a story. It is also
// the only place the game admits out loud that the ship was full of people.
//
// The lines are written FROM the state — rank, loyalty, mentor, how they died —
// so two runs never produce the same epilogue, and none of it is invented: every
// sentence is a thing the players could have read on the crew screen.

import { crewRank, loyaltyBand } from '../../content/crew'
import { HERO_CLASSES } from '../../content/heroes'
import type { CrewMember } from '../../content/crew'
import type { ExpeditionState } from './types'
import type { Text } from '../types'

export type Epilogue = {
  name: string
  /** Alive at the end, or not. */
  home: boolean
  line: Text
}

/**
 * One line each, for everybody who was ever aboard.
 *
 * The dead first, because they are what the run cost, and a list that buries
 * them under the survivors is a list that is trying not to mention them.
 */
export function epilogue(s: ExpeditionState): Epilogue[] {
  const dead = s.crew.filter((c) => !c.alive).map((c) => lineFor(c, false))
  const home = s.crew.filter((c) => c.alive).map((c) => lineFor(c, true))
  return [...dead, ...home]
}

function lineFor(member: CrewMember, home: boolean): Epilogue {
  return { name: member.name, home, line: home ? cameHome(member) : didNot(member) }
}

/** What is said about somebody who did not come back. */
function didNot(member: CrewMember): Text {
  // Taken down by somebody. This is the one the game most owes a sentence to.
  if (member.mentor) {
    const hero = HERO_CLASSES[member.mentor].name
    return {
      hu: `${hero.hu} tanítványa volt. A nevét felírták a hídon, és ott is maradt.`,
      en: `They were the ${hero.en}'s student. Their name went up on the bridge and stayed there.`,
    }
  }
  const rank = crewRank(member)
  if (rank >= 3) {
    return {
      hu: 'Mester volt a szakmájában, mire vége lett. Nincs, aki átvegye tőle.',
      en: 'They were a master of their work by the end. There is nobody to take it over.',
    }
  }
  if (member.weeksAboard <= 4) {
    return {
      hu: 'Alig pár hetet töltött a fedélzeten. A legtöbben a nevét sem tanulták meg.',
      en: 'They were aboard a few weeks. Most people never learned their name.',
    }
  }
  return {
    hu: 'A helye üresen maradt az állomásán, és senki nem ült oda a hátralévő időben.',
    en: 'Their place at the station stayed empty, and nobody sat there for the rest of it.',
  }
}

/** And about somebody who did. */
function cameHome(member: CrewMember): Text {
  const rank = crewRank(member)
  const band = loyaltyBand(member)

  if (member.mentor) {
    const hero = HERO_CLASSES[member.mentor].name
    return {
      hu: `${hero.hu} tanította végig. Az Archívum felvette, és a következő expedícióra már ő tanít.`,
      en: `The ${hero.en} taught them the whole way. The Archive took them on; next expedition they teach.`,
    }
  }
  if (member.loyalty <= 3) {
    return {
      hu: `Hazaért, és a kikötőben szó nélkül lelépett. A listán hetek óta ez állt mellette: „${band.name.hu}".`,
      en: `They got home and walked off at the dock without a word. ${band.name.en} for weeks by then.`,
    }
  }
  if (rank >= 3) {
    return {
      hu: 'Mester lett odakint. Azóta is arról beszél, mit látott, és nem hiszik el neki.',
      en: 'They came back a master. They still talk about what they saw, and nobody believes them.',
    }
  }
  if (rank === 2) {
    return {
      hu: 'Képzett kézzel jött vissza, és rögtön jelentkezett a következőre.',
      en: 'They came back trained, and signed on for the next one the same day.',
    }
  }
  return {
    hu: 'Hazaért. Nem beszél róla, és nem is fog.',
    en: 'They got home. They do not talk about it, and they are not going to.',
  }
}

/** The one line above the list. */
export function epilogueHeading(s: ExpeditionState): Text {
  const home = s.crew.filter((c) => c.alive).length
  const lost = s.crew.length - home
  return {
    hu:
      lost === 0
        ? `Mind a ${home} ember hazaért.`
        : `${home} ember jött haza. ${lost} nem.`,
    en: lost === 0 ? `All ${home} of them came home.` : `${home} came home. ${lost} did not.`,
  }
}
