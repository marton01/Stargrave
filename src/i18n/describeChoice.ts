// Putting a decision into words before it is taken.
//
// The interface used to show only what a choice *costs*. That is exactly half of
// a decision: you could see the price and not the goods, so the honest way to
// find out what an option meant was to take it — and taking it is not undoable.
//
// So both sides are described here, from the same data the engine will apply.
// Nothing is written by hand twice: if an effect is added to an encounter and not
// to this file, the compiler says so.

import { MODULES, RESOURCES } from '../content/ship'
import { CREW_TRAITS } from '../content/crew'
import { HERO_CLASSES } from '../content/heroes'
import { relic } from '../content/relics'
import { pick } from './ui'
import type { EncounterCost, EncounterEffect, ChoiceRequirement } from '../content/encounters'
import type { Reward } from '../engine/expedition/types'
import type { Lang, TrialSymbol } from '../engine/types'

/** One line of an account: what it is, and whether it is a gain or a price. */
export type ChoiceLine = { text: string; tone: 'gain' | 'loss' | 'echo' | 'plain' }

export function describeCost(cost: EncounterCost, lang: Lang): ChoiceLine {
  const hu = lang === 'hu'
  switch (cost.k) {
    case 'resource':
      return {
        text: `${pick(RESOURCES[cost.id].name, lang)} −${cost.amount}`,
        tone: 'loss',
      }
    case 'weeks':
      return {
        text: hu
          ? `${cost.amount} hét — a Kapu addig is számol`
          : `${cost.amount} ${cost.amount === 1 ? 'week' : 'weeks'} — the Gate keeps counting`,
        tone: 'loss',
      }
    case 'cards':
      // The one cost that needs spelling out: it is paid from the heroes' decks
      // and it is permanent, which no other price in the game is.
      return {
        text: hu
          ? `${cost.count} lap véglegesen elveszik a hősök paklijából (${symbolName(cost.symbol, lang)})`
          : `${cost.count} cards lost from the heroes' decks for good (${symbolName(cost.symbol, lang)})`,
        tone: 'loss',
      }
  }
}

/** Which cards a trial will accept. The symbols are the ones printed on them. */
function symbolName(symbol: TrialSymbol, lang: Lang): string {
  const hu = lang === 'hu'
  switch (symbol) {
    case 'force':
      return hu ? 'erő ⚒ jelű lapok közül' : 'from cards marked force ⚒'
    case 'insight':
      return hu ? 'belátás ◈ jelű lapok közül' : 'from cards marked insight ◈'
  }
}

export function describeEffect(effect: EncounterEffect, lang: Lang): ChoiceLine {
  const hu = lang === 'hu'
  switch (effect.k) {
    case 'resource': {
      const name = pick(RESOURCES[effect.id].name, lang)
      return {
        text: `${name} ${effect.amount >= 0 ? '+' : '−'}${Math.abs(effect.amount)}`,
        tone: effect.amount >= 0 ? 'gain' : 'loss',
      }
    }
    case 'understanding':
      return {
        text: hu ? `Megértés +${effect.amount}` : `Understanding +${effect.amount}`,
        tone: 'echo',
      }
    case 'module':
      return {
        text: hu
          ? `Modul beépítve: ${pick(MODULES[effect.id].name, lang)}`
          : `Module installed: ${pick(MODULES[effect.id].name, lang)}`,
        tone: 'gain',
      }
    case 'crewJoin':
      return {
        text: hu
          ? `${effect.count} új legénységtag`
          : `${effect.count} new crew`,
        tone: 'gain',
      }
    case 'crewLost':
      return {
        text: hu
          ? `${effect.count} legénységtag elveszik`
          : `${effect.count} crew lost`,
        tone: 'loss',
      }
    case 'archive':
      return {
        text: hu ? `Archívum-pont +${effect.amount}` : `Archive points +${effect.amount}`,
        tone: 'gain',
      }
    case 'revealMap':
      return {
        text: hu
          ? `${effect.columns} oszlop felfedve a csillagtérképen`
          : `${effect.columns} columns of the star map revealed`,
        tone: 'gain',
      }
    case 'hullRisk':
      return {
        text: hu
          ? `Hajótest-kockázat ${effect.amount} — a pajzs és a vértek csökkentik`
          : `Hull risk ${effect.amount} — shields and wards reduce it`,
        tone: 'loss',
      }
    case 'startMission':
      return {
        text: hu ? 'Partraszállás következik' : 'A landing follows',
        tone: 'plain',
      }
    case 'startPuzzle':
      return {
        text: hu ? 'Feladvány következik' : 'A puzzle follows',
        tone: 'plain',
      }
    case 'gateWeeks':
      return {
        text:
          effect.amount >= 0
            ? hu
              ? `A Kapu ${effect.amount} héttel tovább tart nyitva`
              : `The Gate holds open ${effect.amount} weeks longer`
            : hu
              ? `A Kapu ${-effect.amount} héttel hamarabb zárul`
              : `The Gate closes ${-effect.amount} weeks sooner`,
        tone: effect.amount >= 0 ? 'gain' : 'loss',
      }
    case 'darkening':
      return {
        text:
          effect.amount >= 0
            ? hu
              ? 'A Sötétedés egy szintet lép előre'
              : 'The Darkening rises a level'
            : hu
              ? 'A Sötétedés egy szintet visszalép'
              : 'The Darkening falls back a level',
        tone: effect.amount >= 0 ? 'loss' : 'gain',
      }
    case 'flag':
    case 'mark':
      // Deliberately not shown: that a decision is remembered is the point, and
      // saying "this sets flag x" would turn a story into a checklist. The
      // consequence announces itself when it arrives.
      return { text: '', tone: 'plain' }
    case 'loyalty': {
      const where =
        effect.who === 'all'
          ? hu
            ? 'az egész legénységnél'
            : 'across the crew'
          : effect.who === 'lowest'
            ? hu
              ? 'akinek a legkevesebb'
              : 'for whoever has least'
            : hu
              ? 'nála'
              : 'for them'
      return {
        text: hu
          ? `Hűség ${effect.amount >= 0 ? '+' : '−'}${Math.abs(effect.amount)} ${where}`
          : `Loyalty ${effect.amount >= 0 ? '+' : '−'}${Math.abs(effect.amount)} ${where}`,
        tone: effect.amount >= 0 ? 'gain' : 'loss',
      }
    }
    case 'later':
      return {
        text: hu
          ? `${effect.weeks} hét múlva: ${pick(effect.note, lang)}`
          : `In ${effect.weeks} weeks: ${pick(effect.note, lang)}`,
        tone: 'echo',
      }
    case 'defect':
      return {
        text: hu ? 'Elmegy, és elvisz valamit' : 'They leave, and take something',
        tone: 'loss',
      }
    case 'aboard':
      return { text: '', tone: 'plain' }
    case 'startTask':
      return {
        text: hu ? 'Egy zárósor, közösen' : 'A closing line, together',
        tone: 'plain',
      }
    case 'relic':
      return {
        text: effect.id
          ? hu
            ? `Ereklye: ${pick(relic(effect.id).name, lang)}`
            : `Relic: ${pick(relic(effect.id).name, lang)}`
          : hu
            ? 'Egy ereklye — nem tudni, melyik'
            : 'A relic — no telling which',
        tone: 'gain',
      }
    case 'attention':
      return {
        text:
          effect.amount >= 0
            ? hu
              ? `Figyelem +${effect.amount} — a Hírnök hamarabb indul`
              : `Attention +${effect.amount} — the Herald sets out sooner`
            : hu
              ? `Figyelem −${Math.abs(effect.amount)} — csendesebbek lesztek`
              : `Attention −${Math.abs(effect.amount)} — you go quieter`,
        tone: effect.amount >= 0 ? 'loss' : 'gain',
      }
    case 'heroXp':
      return {
        text: effect.who
          ? hu
            ? `${pick(HERO_CLASSES[effect.who].name, lang)}: +${effect.amount} jegy`
            : `${pick(HERO_CLASSES[effect.who].name, lang)}: +${effect.amount} marks`
          : hu
            ? `Mindkét hősnek +${effect.amount} jegy`
            : `+${effect.amount} marks for both heroes`,
        tone: 'gain',
      }
    case 'then':
      return {
        text: hu ? 'A helyzet folytatódik' : 'The situation continues',
        tone: 'plain',
      }
  }
}

/** The whole account of a choice, in reading order: what it asks, what it gives. */
export function describeChoice(
  costs: readonly EncounterCost[],
  effects: readonly EncounterEffect[],
  lang: Lang,
): { costs: ChoiceLine[]; effects: ChoiceLine[] } {
  return {
    costs: costs.map((c) => describeCost(c, lang)),
    effects: effects.map((e) => describeEffect(e, lang)).filter((line) => line.text.length > 0),
  }
}

export function describeRequirement(need: ChoiceRequirement, lang: Lang): string {
  const hu = lang === 'hu'
  switch (need.k) {
    case 'shieldsAtLeast':
      return hu ? `Pajzs ${need.value}+` : `Shields ${need.value}+`
    case 'moduleInstalled':
      return hu
        ? `Kell: ${pick(MODULES[need.id].name, lang)}`
        : `Needs: ${pick(MODULES[need.id].name, lang)}`
    case 'understandingAtLeast':
      return hu ? `Megértés ${need.value}+` : `Understanding ${need.value}+`
    case 'crewWithTrait':
      return hu
        ? `Kell egy ${pick(CREW_TRAITS[need.trait].name, lang)} legénységtag`
        : `Needs a ${pick(CREW_TRAITS[need.trait].name, lang)} crew member`
    case 'resourceAtLeast':
      return hu
        ? `${pick(RESOURCES[need.id].name, lang)} ${need.value}+`
        : `${pick(RESOURCES[need.id].name, lang)} ${need.value}+`
    case 'relicsAtLeast':
      return hu ? `${need.value}+ ereklye a fedélzeten` : `${need.value}+ relics aboard`
    case 'loyaltyAtMost':
      return hu
        ? 'Valaki a legénységből a végét járja'
        : 'Somebody aboard is at the end of their tether'
    case 'subjectIsMentee':
      return hu ? 'Ő valakinek a tanítványa' : 'They are somebody’s mentee'
    case 'attentionAtLeast':
      return hu ? `Figyelem ${need.value}+` : `Attention ${need.value}+`
    case 'flag':
    case 'noFlag':
    case 'mark':
      // These are about what you did, not what you have; there is nothing useful
      // to tell a player who does not meet them, and a lot to spoil.
      return hu ? 'Máskor.' : 'Another time.'
  }
}

/**
 * A reward, in one line. Rewards and encounter effects overlap but are not the
 * same union — a reward can unlock a puzzle type, an effect can start a mission —
 * so this maps the ones a reward can be rather than casting between them. A cast
 * would compile and then hand `describeEffect` a shape it has no case for, which
 * is a crash rather than a missing line.
 */
export function describeReward(reward: Reward, lang: Lang): ChoiceLine {
  const hu = lang === 'hu'
  switch (reward.k) {
    case 'resource':
    case 'understanding':
    case 'module':
    case 'crewJoin':
    case 'archive':
    case 'revealMap':
    case 'relic':
    case 'heroXp':
      return describeEffect(reward, lang)
    case 'unlockPuzzle':
      return {
        text: hu ? 'Új feladványtípus' : 'A new kind of mechanism',
        tone: 'echo',
      }
  }
}
