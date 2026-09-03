// What happens on the ship, during the week.
//
// The weekly turn had a shape problem. Power and postings are a standing
// configuration — you set them and then only adjust — which is right, and which
// left "end the week" as one click for weeks at a time. Everything that ever
// *happened* happened at a place on the map. So four people were running a ship
// on which nothing aboard ever needed them.
//
// These are the weeks' own situations, and three things make them do the work:
//
//  1. **Somebody in particular answers.** Every one of them names an `owner`, and
//     in an online room that player is the only one who can. Four people running
//     a ship is not four people voting; it is four people each answering for
//     something while the others watch and say what they think.
//  2. **They are about the crew**, who were stat blocks with names. Loyalty is
//     the thread: it drifts with how the ship is actually run, these events move
//     it, and at the bottom of it somebody leaves and takes something with them.
//  3. **Half of them land later.** A `later` effect schedules a consequence for a
//     few weeks out, which is the only way a decision can be remembered by the
//     game rather than by the players.
//
// They are ordinary encounters — same costs, same requirements, same interface —
// with two extra fields. See `Encounter` in encounters.ts for why.

import { registerEncounters } from './encounters'
import type { Encounter } from './encounters'

export const ABOARD_EVENTS: Encounter[] = [
  // ------------------------------------------------------------- the crew
  {
    id: 'aboard-hold-fight',
    aboard: true,
    owner: 'cantor',
    title: { hu: 'Verekedés a raktérben', en: 'A fight in the hold' },
    text: {
      hu:
        'Ketten egymásnak estek a hármas raktérben, és egyikük sem mondja meg, miért. A ' +
        'legénység többi része tudja, és nem mondja. Valamit lépni kell, mert holnap ' +
        'ugyanketten dolgoznak együtt.',
      en:
        'Two of them went down in hold three, and neither will say why. The rest of the crew ' +
        'knows and is not saying. Something has to be done, because tomorrow the same two are ' +
        'working the same shift.',
    },
    tags: ['drift'],
    weight: 12,
    choices: [
      {
        text: { hu: 'Elrendezem. Mindkettő beosztást vált.', en: 'Sorted. Both of them change watch.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'morale', amount: 1 },
          { k: 'loyalty', amount: -1, who: 'subject' },
        ],
        result: {
          hu:
            'Szétrakod őket, és attól kezdve rá se néznek egymásra. A hajón csend van, ' +
            'és a csend nem ugyanaz, mint a rend — de működik.',
          en:
            'You separate them, and from then on they do not look at each other. The ship is ' +
            'quiet, and quiet is not the same as order — but it works.',
        },
      },
      {
        text: {
          hu: 'Leülünk hárman, és végigbeszéljük.',
          en: 'The three of us sit down and talk it through.',
        },
        costs: [],
        effects: [
          { k: 'loyalty', amount: 2, who: 'subject' },
          {
            k: 'later',
            weeks: 3,
            note: {
              hu: 'A raktéri ügy tényleg elrendeződött: a legénység emlékszik rá, ki állt oda.',
              en: 'The business in the hold really was settled: the crew remembers who stood there.',
            },
            effects: [
              { k: 'resource', id: 'morale', amount: 2 },
              { k: 'loyalty', amount: 1, who: 'all' },
            ],
          },
        ],
        result: {
          hu:
            'Két órába kerül, és a végén egyik sem elégedett. Három hét múlva viszont ' +
            'valaki más is idejön majd, hogy elmondjon valamit — mert látta, hogy ez itt ' +
            'lehetséges.',
          en:
            'It takes two hours, and neither of them is satisfied at the end of it. Three weeks ' +
            'from now, though, somebody else will come here to say something — because they saw ' +
            'that it can be done.',
        },
      },
      {
        text: { hu: 'Nem az én dolgom.', en: 'Not my business.' },
        costs: [],
        effects: [
          {
            k: 'later',
            weeks: 2,
            note: {
              hu: 'A raktéri ügyet senki nem rendezte el. Most már négyen vannak benne.',
              en: 'Nobody settled the business in the hold. There are four of them in it now.',
            },
            effects: [
              { k: 'resource', id: 'morale', amount: -3 },
              { k: 'loyalty', amount: -2, who: 'all' },
            ],
          },
        ],
        result: {
          hu:
            'Visszamész a pulthoz. A hajó nagy, és ez nem a te posztod. Két hét, és nem ' +
            'lesz nagy.',
          en:
            'You go back to your console. The ship is big and this is not your post. Two weeks, ' +
            'and it will not be big.',
        },
      },
    ],
  },

  {
    id: 'aboard-withdrawn',
    aboard: true,
    owner: 'cantor',
    title: { hu: 'Aki nem jön ki a kabinjából', en: 'The one who will not come out' },
    text: {
      hu:
        'Van valaki, aki két hete nem eszik a többiekkel. A műszakját leadja, a munkáját ' +
        'elvégzi, és utána bezárkózik. A hajón ez nem magánügy: aki így megy tovább, az ' +
        'egyszer csak nem lesz ott.',
      en:
        'Somebody has not eaten with the others for two weeks. They stand their watch, do their ' +
        'work, and then shut the door. On a ship that is not a private matter: somebody who goes ' +
        'on like that is eventually not there at all.',
    },
    tags: ['drift'],
    weight: 14,
    requires: { k: 'loyaltyAtMost', value: 4 },
    choices: [
      {
        text: { hu: 'Bekopogok. Akármeddig tart.', en: 'I knock. However long it takes.' },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'loyalty', amount: 4, who: 'subject' },
          { k: 'resource', id: 'morale', amount: 1 },
        ],
        result: {
          hu:
            'Egy hét, és a végén kijön. Nem lett jobban, de kijön, és leül a többiekhez. ' +
            'A Kapu közben egy hetet fogyott. Megérte.',
          en:
            'A week, and at the end of it they come out. They are not better, but they come out ' +
            'and sit down with the others. The Gate is a week shorter. It was worth it.',
        },
      },
      {
        text: {
          hu: 'Munkát adok neki, ami mellé más is kell.',
          en: 'I give them work that needs somebody else too.',
        },
        costs: [],
        effects: [
          { k: 'loyalty', amount: 2, who: 'subject' },
          {
            k: 'later',
            weeks: 2,
            note: {
              hu: 'A közös műszak megtette a magáét: van, akivel újra beszél.',
              en: 'The shared watch did its work: there is somebody they speak to again.',
            },
            effects: [{ k: 'loyalty', amount: 1, who: 'subject' }],
          },
        ],
        result: {
          hu:
            'Nem beszélget, de dolgozik valaki mellett, és ez valamiért nem ugyanaz. ' +
            'Két hét, és köszön.',
          en:
            'They do not talk, but they work beside somebody, and that is somehow not the same ' +
            'thing. Two weeks, and they say good morning.',
        },
      },
      {
        text: { hu: 'Hagyom. Mindenkinek jár a saját tempó.', en: 'I leave it. Everybody gets their own pace.' },
        costs: [],
        effects: [{ k: 'loyalty', amount: -1, who: 'subject' }],
        result: {
          hu: 'Az ajtó zárva marad. A napló bejegyzése ennyi: „rendben van".',
          en: 'The door stays shut. The log entry reads: "fine".',
        },
      },
    ],
  },

  // -------------------------------------------------------------- the ship
  {
    id: 'aboard-hydro-leak',
    aboard: true,
    owner: 'runesmith',
    title: { hu: 'Szivárgás a hidropóniában', en: 'A leak in the hydroponics' },
    text: {
      hu:
        'Egy csatlakozás sír. Nem ömlik, csak sír — pár csepp óránként, és a padlón egy ' +
        'kör, ami minden nap nagyobb. Most fél napba kerül. Ha marad, akkor nem fél napba.',
      en:
        'A joint is weeping. Not pouring, weeping — a few drops an hour, and a circle on the ' +
        'floor that is bigger every day. Half a day now. If it stays, not half a day.',
    },
    tags: ['drift'],
    weight: 11,
    choices: [
      {
        text: { hu: 'Most megcsinálom.', en: 'I do it now.' },
        costs: [{ k: 'resource', id: 'hull', amount: 1 }],
        effects: [{ k: 'loyalty', amount: 1, who: 'all' }],
        result: {
          hu:
            'Egy lemez, két rúna, fél nap. A hajó anyagából megy, de a kör eltűnik a ' +
            'padlóról, és a legénység látja, hogy eltűnt.',
          en:
            'One plate, two runes, half a day. It comes out of the ship’s own stock, but the ' +
            'circle is gone from the floor, and the crew can see that it is gone.',
        },
      },
      {
        text: { hu: 'Ráérünk. Van fontosabb.', en: 'It can wait. There are bigger things.' },
        costs: [],
        effects: [
          {
            k: 'later',
            weeks: 3,
            note: {
              hu: 'A hidropóniás szivárgás elvitte egy tartály vizét, és vele az ültetést.',
              en: 'The hydroponics leak took a tank of water, and the planting with it.',
            },
            effects: [
              { k: 'resource', id: 'food', amount: -10 },
              { k: 'resource', id: 'morale', amount: -1 },
            ],
          },
        ],
        result: {
          hu:
            'Ráteszel egy szorítót, és felírod a listára. A lista hosszú. Három hét múlva ' +
            'a lista egy sorral rövidebb lesz, csak nem úgy, ahogy szeretted volna.',
          en:
            'You put a clamp on it and add it to the list. The list is long. In three weeks the ' +
            'list will be one line shorter, but not in the way you wanted.',
        },
      },
    ],
  },

  {
    id: 'aboard-reactor-song',
    aboard: true,
    owner: 'echoreader',
    title: { hu: 'A reaktor dallama megváltozott', en: 'The reactor is humming differently' },
    text: {
      hu:
        'Nem hangosabb és nem rosszabb: **más**. Két hete ugyanazt a négy hangot adta, ma ' +
        'egy ötödik is van benne. A mérnökök szerint minden rendben. Te viszont hallod, hogy ' +
        'nem az idegen technológia beszél. Valami MÁS szólal meg benne — valami, ami eddig csak ' +
        'hallgatta a reaktort, és most válaszol neki.',
      en:
        'Not louder and not worse: **different**. For two weeks it gave the same four notes; ' +
        'today there is a fifth. Engineering says everything is fine. You can hear that it is ' +
        'not the alien technology talking — it is something listening to it.',
    },
    tags: ['drift', 'anomaly'],
    weight: 10,
    once: true,
    choices: [
      {
        text: { hu: 'Leírom, végig. Akármit is jelent.', en: 'I write it down, all of it. Whatever it means.' },
        costs: [{ k: 'resource', id: 'information', amount: 4 }],
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'attention', amount: 1 },
          { k: 'heroXp', amount: 2, who: 'echoreader' },
        ],
        result: {
          hu:
            'Négy éjszaka a reaktorterem előtt, fejhallgatóval. Az ötödik hang egy szó, és a ' +
            'szó egy név. Nem a miénk. Amit leírtál, azt a Csillagsír is leírta rólad.',
          en:
            'Four nights outside the reactor room with headphones on. The fifth note is a word, ' +
            'and the word is a name. Not ours. What you wrote down, the Stargrave wrote down ' +
            'about you.',
        },
      },
      {
        text: { hu: 'Lefojtjuk. Nem akarok tudni róla.', en: 'We damp it. I do not want to know.' },
        costs: [],
        effects: [
          { k: 'attention', amount: -2 },
          { k: 'resource', id: 'morale', amount: -1 },
        ],
        result: {
          hu:
            'Szigetelés, plusz egy réteg, és a hang eltűnik. A legénység szerint mégis ' +
            'hallani, csak már nem lehet rá fogni semmit.',
          en:
            'Insulation, one more layer, and the sound is gone. The crew says you can still ' +
            'hear it, except now there is nothing to point at.',
        },
      },
      {
        text: {
          hu: 'Odaviszek valakit, aki nem hallotta még.',
          en: 'I bring somebody who has not heard it yet.',
        },
        costs: [],
        effects: [
          { k: 'understanding', amount: 1 },
          { k: 'loyalty', amount: -2, who: 'subject' },
          {
            k: 'later',
            weeks: 4,
            note: {
              hu: 'Aki a reaktornál hallgatta veled, azóta nem az, aki volt.',
              en: 'Whoever listened at the reactor with you has not been the same since.',
            },
            effects: [{ k: 'loyalty', amount: -2, who: 'subject' }],
          },
        ],
        result: {
          hu:
            'Ő is hallja. Utána két napig nem szól, aztán megkérdezi, hogy szerinted a ' +
            'név kit szólít. Nem tudsz válaszolni.',
          en:
            'They hear it too. Then they say nothing for two days, and then they ask who you ' +
            'think the name is calling. You have no answer.',
        },
      },
    ],
  },

  {
    id: 'aboard-shortcut',
    aboard: true,
    owner: 'surveyor',
    title: { hu: 'Valaki rövidebb utat talált', en: 'Somebody found a shorter road' },
    text: {
      hu:
        'Az egyik navigátor letett egy számítást az asztalodra. Ha igaza van, két hetet ' +
        'lehet nyerni. Ha nincs, akkor egy olyan íven mentek keresztül, amit senki nem ' +
        'mért be — és a te műszereden fog kiderülni, melyik.',
      en:
        'One of the navigators put a calculation on your desk. If they are right, it saves two ' +
        'weeks. If they are not, you cross an arc nobody has measured — and it will be your ' +
        'instrument that finds out which.',
    },
    tags: ['drift'],
    weight: 11,
    choices: [
      {
        text: { hu: 'Végigszámolom magam.', en: 'I check the whole thing myself.' },
        costs: [{ k: 'resource', id: 'information', amount: 6 }],
        effects: [
          { k: 'resource', id: 'fuel', amount: 6 },
          { k: 'loyalty', amount: 1, who: 'subject' },
        ],
        result: {
          hu:
            'Két nap papír. Az ív jó, csak nem annyira, amennyire ő hitte — de üzemanyagot ' +
            'megtakarít, és a navigátor látta, hogy komolyan vetted.',
          en:
            'Two days of paper. The arc holds, just not as well as they thought — but it saves ' +
            'fuel, and the navigator saw that you took it seriously.',
        },
      },
      {
        text: { hu: 'Bízom benne. Megyünk.', en: 'I trust them. We go.' },
        costs: [],
        effects: [
          { k: 'gateWeeks', amount: 2 },
          { k: 'loyalty', amount: 2, who: 'subject' },
          {
            k: 'later',
            weeks: 2,
            note: {
              hu: 'A be nem mért ív sikerült — de a hajó egy hetet vesztegelt egy porörvényben.',
              en: 'The unmeasured arc held — but the ship sat a week in a dust eddy.',
            },
            effects: [
              { k: 'gateWeeks', amount: -1 },
              { k: 'hullRisk', amount: 3 },
            ],
          },
        ],
        result: {
          hu:
            'Két hét a zsebben, és egy navigátor, aki most először érezte, hogy számít, mit ' +
            'tesz le az asztalra. Az ív viszont tényleg nincs bemérve.',
          en:
            'Two weeks in hand, and a navigator who has just felt, for the first time, that what ' +
            'they put on the desk matters. The arc really is unmeasured, though.',
        },
      },
      {
        text: { hu: 'Nem. A bemért úton megyünk.', en: 'No. We take the measured road.' },
        costs: [],
        effects: [{ k: 'loyalty', amount: -2, who: 'subject' }],
        result: {
          hu:
            'Visszaadod a papírt. Nem szól semmit. A következő számítást nem fogja letenni ' +
            'az asztalodra.',
          en:
            'You hand the paper back. They say nothing. They will not put the next calculation ' +
            'on your desk.',
        },
      },
    ],
  },

  {
    id: 'aboard-ration-question',
    aboard: true,
    owner: 'runesmith',
    title: { hu: 'A fejadagok kérdése', en: 'The question of the rations' },
    text: {
      hu:
        'A raktárkezelő megkérdezi, csökkentse-e a fejadagot. Nem panasz: kérdés. Ő tudja, ' +
        'mennyi van, és azt is, hogy meddig kell tartani. Rád vár, mert valakinek ki kell ' +
        'mondania.',
      en:
        'The quartermaster asks whether to cut the ration. Not a complaint: a question. They ' +
        'know how much there is and how long it has to last. They are waiting for you, because ' +
        'somebody has to say it.',
    },
    tags: ['drift'],
    weight: 10,
    choices: [
      {
        text: { hu: 'Csökkentsük. Most inkább, mint később.', en: 'Cut it. Better now than later.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'food', amount: 8 },
          { k: 'resource', id: 'morale', amount: -2 },
          { k: 'loyalty', amount: -1, who: 'all' },
        ],
        result: {
          hu:
            'Nyolc adag megmarad a raktárban, és a legénység ezt minden este látja a ' +
            'tányérján. Nem lázadás, csak csend a menzán.',
          en:
            'Eight rations stay in the hold, and the crew sees it on their plate every evening. ' +
            'Not a mutiny, just quiet in the mess.',
        },
      },
      {
        text: { hu: 'Nem. Aki dolgozik, az egyen.', en: 'No. People who work, eat.' },
        costs: [],
        effects: [
          { k: 'resource', id: 'morale', amount: 2 },
          { k: 'loyalty', amount: 1, who: 'all' },
        ],
        result: {
          hu:
            'A raktárkezelő bólint, mintha erre várt volna. Az élelem viszont ugyanannyi ' +
            'marad, amennyi.',
          en:
            'The quartermaster nods as though that was what they were waiting for. The food, ' +
            'however, stays exactly as much as it is.',
        },
      },
      {
        text: {
          hu: 'A hősök adagját csökkentjük, a legénységét nem.',
          en: 'We cut the heroes’ rations, not the crew’s.',
        },
        costs: [],
        effects: [
          { k: 'resource', id: 'food', amount: 4 },
          { k: 'loyalty', amount: 2, who: 'all' },
          {
            k: 'later',
            weeks: 2,
            note: {
              hu: 'A partraszálló csapat két hete kevesebbet eszik, és ez a rácson is látszik.',
              en: 'The landing party has been eating less for two weeks, and it shows on the grid.',
            },
            effects: [{ k: 'resource', id: 'morale', amount: -1 }],
          },
        ],
        result: {
          hu:
            'Nem mondod be a menzán, de két nap múlva mindenki tudja. Ettől kezdve máshogy ' +
            'néznek rátok — és két hét múlva a saját csapatodon is érezni fogod.',
          en:
            'You do not announce it in the mess, and two days later everybody knows. They look ' +
            'at you differently from then on — and in two weeks you will feel it on the stairs.',
        },
      },
    ],
  },

  {
    id: 'aboard-relic-touched',
    aboard: true,
    owner: 'echoreader',
    title: { hu: 'Valaki hozzáért', en: 'Somebody touched it' },
    text: {
      hu:
        'Az ereklyék közül az egyiket elmozdították. Nem eltűnt, csak nincs ott, ahol ' +
        'hagytad — és aki hozzáért, az most a menzán ül, és nem néz fel.',
      en:
        'One of the relics has been moved. Not taken, just not where you left it — and whoever ' +
        'touched it is sitting in the mess now, not looking up.',
    },
    tags: ['drift', 'ruins'],
    weight: 10,
    requires: { k: 'relicsAtLeast', value: 1 },
    choices: [
      {
        text: {
          hu: 'Megkérdezem, mit hallott.',
          en: 'I ask them what they heard.',
        },
        costs: [],
        effects: [
          { k: 'understanding', amount: 2 },
          { k: 'loyalty', amount: 1, who: 'subject' },
        ],
        result: {
          hu:
            'Elmondja, és félúton elakad, mert nincs rá szava. Amit el tud mondani, az ' +
            'többet ér, mint amit a Labor egy hónap alatt kimért.',
          en:
            'They tell you, and stop halfway because there is no word for it. What they can say ' +
            'is worth more than a month of the Lab’s measurements.',
        },
      },
      {
        text: { hu: 'Lezárom a rakteret. Senki nem megy be.', en: 'I seal the hold. Nobody goes in.' },
        costs: [],
        effects: [
          { k: 'attention', amount: -1 },
          { k: 'loyalty', amount: -1, who: 'all' },
        ],
        result: {
          hu:
            'Rúna a zsilipre, és a raktér a tiéd. A legénység szerint attól, hogy nem ' +
            'látják, még ott van.',
          en:
            'A rune on the airlock, and the hold is yours. The crew says that not seeing it does ' +
            'not make it not there.',
        },
      },
    ],
  },

  // ------------------------------------------------- the shape of the table
  {
    id: 'aboard-who-decides',
    aboard: true,
    owner: 'runesmith',
    title: { hu: 'Kinek a szava dönt', en: 'Whose word decides' },
    text: {
      hu:
        'A legénység egy része hozzád jön a kérdéseivel, egy része máshoz. Ez eddig nem ' +
        'volt gond. Most viszont ketten ugyanarra a kérdésre két másik választ kaptak, és ' +
        'mindkettő szerint ő járt el helyesen.',
      en:
        'Some of the crew brings its questions to you, some to somebody else. That has not been ' +
        'a problem until now. Two of them just got two different answers to the same question, ' +
        'and each of them thinks they acted correctly.',
    },
    tags: ['drift'],
    weight: 9,
    once: true,
    choices: [
      {
        text: {
          hu: 'Kiírjuk, ki miért felel. Papíron.',
          en: 'We write down who answers for what. On paper.',
        },
        costs: [],
        effects: [
          { k: 'loyalty', amount: 1, who: 'all' },
          {
            k: 'later',
            weeks: 3,
            note: {
              hu: 'A kiírt hatáskörök beváltak: a legénység tudja, kihez menjen.',
              en: 'The written-down responsibilities held: the crew knows who to go to.',
            },
            effects: [
              { k: 'resource', id: 'morale', amount: 2 },
              { k: 'heroXp', amount: 1 },
            ],
          },
        ],
        result: {
          hu:
            'Egy lap a menza falán, négy oszlop, mindenki neve fölött az, amiért felel. ' +
            'Nevetnek rajta. Aztán elkezdik használni.',
          en:
            'One sheet on the mess wall, four columns, each name over what it answers for. They ' +
            'laugh at it. Then they start using it.',
        },
      },
      {
        text: {
          hu: 'Mindenki jöjjön bárkihez. Együtt vezetjük.',
          en: 'Anybody can come to any of us. We run it together.',
        },
        costs: [],
        effects: [
          { k: 'resource', id: 'morale', amount: 1 },
          {
            k: 'later',
            weeks: 4,
            note: {
              hu: 'Négy ember négyféle választ ad, és a legénység már nem kérdez semmit.',
              en: 'Four people give four answers, and the crew has stopped asking anything.',
            },
            effects: [{ k: 'loyalty', amount: -2, who: 'all' }],
          },
        ],
        result: {
          hu:
            'Szép elv, és a legénység szeretné, ha igaz lenne. Négy hétig működik is.',
          en: 'A fine principle, and the crew would like it to be true. It works for four weeks.',
        },
      },
    ],
  },

  {
    id: 'aboard-nobody-noticed',
    aboard: true,
    owner: 'surveyor',
    title: { hu: 'Amit senki nem vett észre', en: 'What nobody noticed' },
    text: {
      hu:
        'A műszereden egy hete fut egy hiba, amit senki nem jelentett — mert az, aki ' +
        'észrevette, azt hitte, hogy a te dolgod, és nem akart beleszólni. Egy hétnyi mérés ' +
        'megsemmisült. Cserébe kiderült valami arról, hogyan működik ez a hajó.',
      en:
        'An error has been running on your instrument for a week that nobody reported — because ' +
        'the person who spotted it thought it was your business and did not want to interfere. A ' +
        'week of data is gone. And something came to light about how this ship works.',
    },
    tags: ['drift'],
    weight: 9,
    choices: [
      {
        text: {
          hu: 'Kimondom a menzán: szóljatok, ha látjátok.',
          en: 'I say it in the mess: speak up when you see something.',
        },
        costs: [],
        effects: [
          { k: 'loyalty', amount: 2, who: 'all' },
          {
            k: 'later',
            weeks: 2,
            note: {
              hu: 'Valaki szólt, mert megkértük rá — és ezzel megelőzött egy komolyabb hibát.',
              en: 'Somebody spoke up because we asked them to — and it headed off a worse fault.',
            },
            effects: [
              { k: 'resource', id: 'hull', amount: 3 },
              { k: 'resource', id: 'information', amount: 4 },
            ],
          },
        ],
        result: {
          hu:
            'Kellemetlen két perc, mert a saját műszeredről van szó. Utána viszont ' +
            'többször szólnak hozzád, mint az egész expedíció alatt eddig.',
          en:
            'Two uncomfortable minutes, because it is your instrument. Afterwards, though, more ' +
            'people speak to you than in the whole expedition so far.',
        },
      },
      {
        text: { hu: 'Csendben megjavítom.', en: 'I fix it quietly.' },
        costs: [],
        effects: [{ k: 'resource', id: 'information', amount: 2 }],
        result: {
          hu:
            'Fél óra, és megvan. A hiba eltűnt, és az is, hogy bárki szólni akart volna.',
          en:
            'Half an hour and it is done. The fault is gone, and so is anybody’s intention to ' +
            'mention the next one.',
        },
      },
    ],
  },

  // ---------------------------------------------------------- the departure
  //
  // The end of the loyalty thread. It is only ever reached after weeks of the
  // crew list saying somebody has stopped talking to anybody, and this scene is
  // the last chance to stop it.
  {
    id: 'aboard-leaving',
    aboard: true,
    owner: 'cantor',
    title: { hu: 'Valaki csomagol', en: 'Somebody is packing' },
    text: {
      hu:
        'Nem titkolja. Ott áll a kabinjában egy zsákkal, és amikor benyitsz, nem hazudik: ' +
        'a következő állomáson leszáll. Azt is megmondja, mit visz magával, mert szerinte ' +
        'megérdemli.',
      en:
        'They are not hiding it. They are standing in their cabin with a bag, and when you open ' +
        'the door they do not lie: they are getting off at the next station. They also tell you ' +
        'what they are taking, because they think they have earned it.',
    },
    tags: ['drift'],
    weight: 20,
    choices: [
      {
        text: {
          hu: 'Marad. Bármi az ára.',
          en: 'They stay. Whatever it costs.',
        },
        costs: [{ k: 'resource', id: 'credits', amount: 14 }],
        effects: [
          { k: 'loyalty', amount: 5, who: 'subject' },
          { k: 'resource', id: 'morale', amount: -1 },
        ],
        result: {
          hu:
            'Kifizetitek, amit kér, és marad. A legénység tudja, hogy meg lehet fizetni a ' +
            'maradást — és ezt is elteszi valahova.',
          en:
            'You pay what they ask and they stay. The crew now knows that staying can be bought, ' +
            'and files that away somewhere too.',
        },
      },
      {
        text: {
          hu: 'Végigbeszélem vele. Nem fizetek.',
          en: 'I talk it through with them. No payment.',
        },
        costs: [{ k: 'weeks', amount: 1 }],
        effects: [
          { k: 'loyalty', amount: 4, who: 'subject' },
          { k: 'loyalty', amount: 1, who: 'all' },
        ],
        result: {
          hu:
            'Egy hét, és a zsák visszakerül a szekrénybe. Nem azért, mert meggyőzted — ' +
            'hanem mert valaki egy hetet szánt rá.',
          en:
            'A week, and the bag goes back in the locker. Not because you convinced them — ' +
            'because somebody spent a week on it.',
        },
      },
      {
        text: {
          hu: 'Akkor menjen. De üres kézzel.',
          en: 'Then go. But empty-handed.',
        },
        costs: [],
        effects: [
          { k: 'crewLost', count: 1 },
          { k: 'resource', id: 'morale', amount: -2 },
          { k: 'loyalty', amount: -1, who: 'all' },
        ],
        result: {
          hu:
            'Elveszed tőle, amit összeszedett, és kiteszed a zsilipnél. A legénység végig ' +
            'nézi. Senki nem szól semmit, és ez a rosszabb.',
          en:
            'You take back what they gathered and put them out at the airlock. The crew watches ' +
            'the whole thing. Nobody says anything, and that is the worse part.',
        },
      },
      {
        text: { hu: 'Menjen, és vigye, amit akar.', en: 'Let them go, and take what they like.' },
        costs: [],
        effects: [{ k: 'defect' }],
        result: {
          hu:
            'Nem állítja meg senki. Reggel nincs ott, és nincs ott az sem, amit magának ' +
            'számolt. A legénység nem haragszik rá. Ez a furcsa benne.',
          en:
            'Nobody stops them. In the morning they are gone, and so is what they counted as ' +
            'theirs. The crew is not angry with them. That is the strange part.',
        },
      },
    ],
  },
]

// One index for every situation in the game — see `registerEncounters`.
registerEncounters(ABOARD_EVENTS)

export function aboardEvents(): Encounter[] {
  return ABOARD_EVENTS
}
