// The first ten minutes.
//
// This is the thing the game was most missing, and it was missing for a reason
// that is easy to sympathise with: every system here is worth having, and each
// one was added to a game that already worked. Nobody ever had to open it for
// the first time and be shown where to start.
//
// What a first group actually meets is nineteen help tabs, eight stations, seven
// reactor lines, four heroes with fifty-four cards between them, four consoles,
// orders with deadlines, a crew that has opinions, and something that counts
// their noise. All of it is explained somewhere. None of it is explained *in
// order*, next to the thing it is about, at the moment it first matters.
//
// So: an ordered walk. Each step names a screen, says the one thing that screen
// is for, and gets out of the way. Two rules kept it honest:
//
//   **Nothing is hidden.** An earlier draft of this simply switched the Herald,
//   the orders and the aboard events off for a first run. That is a worse game
//   AND a worse lesson — the group then meets those systems later with no
//   introduction at all. They stay on, turned down, and the walk introduces
//   each of them by name.
//
//   **It follows the players, not the other way round.** A step whose screen is
//   already open marks itself as read. Nobody is ever blocked, nothing is
//   modal, and the whole thing can be dismissed on any step and picked up again
//   from the help.

import type { Screen } from '../engine/expedition/types'
import type { Text } from '../engine/types'

export type GuideStep = {
  id: string
  /** Which screen this is about, or null for a step that is about the game. */
  screen: Screen | null
  title: Text
  text: Text
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'what',
    screen: null,
    title: { hu: 'Miről szól ez az egész', en: 'What this is about' },
    text: {
      hu:
        'Egy galaxisba jöttetek át, ahol egy civilizáció eltűnt — nem háborúban. A cél eljutni ' +
        'a galaxis szívébe, a Csillagsírba, mielőtt a Kapu bezárul. Hogy ott mit tudtok tenni, azt ' +
        'nem a fegyvereitek döntik el, hanem az, hogy MENNYIT FEJTETTETEK MEG abból, mi történt itt. ' +
        'Ezt méri a Megfejtés a fejlécben.',
      en:
        'You have come through into a galaxy where a civilisation vanished — not in a war. The aim ' +
        'is to reach the heart of it, the Stargrave, before the Gate closes. What you can do when ' +
        'you get there is decided not by your weapons but by HOW MUCH YOU HAVE WORKED OUT about ' +
        'what happened here. That is the Understanding figure in the header.',
    },
  },
  {
    id: 'header',
    screen: null,
    title: { hu: 'A fejléc: minden szám egy helyen', en: 'The header: every number in one place' },
    text: {
      hu:
        'Balról jobbra: az erőforrások, a legénység létszáma, a Megfejtés, a Zaj, és hogy hány hét ' +
        'van még a Kapu bezárultáig. Bármelyik szám fölé állva megmondja, mit jelent. ' +
        'KETTŐ VÉGET IS TUD VETNI A FUTAMNAK: ha a HAJÓTEST nullára fogy, és ha a MORÁL — a legénység ' +
        'kedve — nullára esik, mert akkor megtagadják a parancsot. A jobb oldalon a napló: minden, ' +
        'ami történt, visszafelé.',
      en:
        'Left to right: the resources, how many crew are alive, Understanding, Attention, and how ' +
        'many weeks are left before the Gate shuts. Hover any of them and it says what it is. ' +
        'TWO OF THEM CAN END THE RUN: the HULL at zero, and MORALE — how willingly the crew work — ' +
        'at zero, because then they refuse the order. On the right is the log: everything that ' +
        'happened, most recent first.',
    },
  },
  {
    id: 'ship',
    screen: 'ship',
    title: { hu: 'A hajó: az energia elosztása', en: 'The ship: dividing the power' },
    text: {
      hu:
        'A reaktor 8 egységet ad, és hét rendszer kér belőle — sosem elég mindenre. Ez a játék ' +
        'legfontosabb közös döntése, és minden héten újra megbeszélhetitek. Minden rendszer alatt ott ' +
        'áll, hogy a mostani beosztás MIT AD MOST, számmal: nem kell kitalálni, megéri-e a negyedik pont.',
      en:
        'The reactor gives 8 units and seven systems want them — never enough for everything. It is ' +
        'the most important shared decision in the game, and you can settle it again every week. ' +
        'Under each system is what the current allocation ACTUALLY GIVES, as a number: you never have ' +
        'to guess whether a fourth point is worth it.',
    },
  },
  {
    id: 'stations',
    screen: 'ship',
    title: { hu: 'Állomások: kit hova osztasz', en: 'Stations: who works where' },
    text: {
      hu:
        'Az állomás a hajó egy munkahelye. Csak akkor dolgozik, ha KAP ENERGIÁT és ÁLL VALAKI a ' +
        'legénységből. A szakma számít: a tudós a Laborban kétszer annyit ér, mint bárki más — és a ' +
        'jellemvonásai is csak a saját állomásán élnek. Aki nincs beosztva sehová, az nem csinál semmit.',
      en:
        'A station is a workplace on the ship. It only works when it HAS POWER and SOMEBODY IS ' +
        'STANDING at it. The speciality matters: a scientist in the Lab is worth twice what anybody ' +
        'else is — and their traits only count on their own station. Somebody unassigned does nothing.',
    },
  },
  {
    id: 'consoles',
    screen: 'consoles',
    title: { hu: 'Kezelőpultok: ami csak a tiéd', en: 'Consoles: what is yours alone' },
    text: {
      hu:
        'Mindenkinek van egy saját pultja, és ami ott van, az NEM közös: a jegyeid, amiket te költesz ' +
        'el a saját hősöd fejlesztésére; a parancsod, ami a te határidőd; a tanítványaid; a heti ' +
        'őrséged; és a szavad, ha megígérsz valamit az asztalnak. A többiek pultját is látod — de ott ' +
        'ne nyomkodj.',
      en:
        'Everybody has a console of their own, and what is on it is NOT shared: your marks, which only ' +
        'you spend on your own hero; your order, which is your deadline; your mentees; your weekly ' +
        'watch; and your word, if you promise the table something. You can see everybody else’s — ' +
        'but that is their business.',
    },
  },
  {
    id: 'starmap',
    screen: 'starmap',
    title: { hu: 'Csillagtérkép: merre tovább', en: 'Star map: which way on' },
    text: {
      hu:
        'A térkép oszlopokba van rendezve: balra a Kapu, jobbra a galaxis szíve. Minden oszloppal ' +
        'mélyebbre juttok — nehezebb ellenfelek, jobb leletek. Az út heteket kér, és a Kapu közben ' +
        'számolja a magáét. Ahol megállsz, ott vagy partraszállás vár, vagy feladvány, vagy egy leírt ' +
        'helyzet, amiben döntenetek kell.',
      en:
        'The map is laid out in columns: the Gate on the left, the heart of the galaxy on the right. ' +
        'Every column is deeper in — harder enemies, better finds. Travel costs weeks, and the Gate ' +
        'counts its own down meanwhile. Where you stop there is either a landing, a puzzle, or a ' +
        'written situation you have to answer.',
    },
  },
  {
    id: 'research',
    screen: 'research',
    title: { hu: 'Kutatás: és hogyan érhet véget', en: 'Research: and how this can end' },
    text: {
      hu:
        'Egy közös Információ-készlet, két irány. A TECHNOLÓGIA most segít: jobb hajót ad. A MEGFEJTÉS ' +
        'most semmit nem ad — a végén viszont ez dönt mindent. Itt van az a lista is, ami megmondja, ' +
        'HOGYAN ÉRHET VÉGET az expedíció, és amelyik zárva van, ott ki van írva, mi hiányzik hozzá. ' +
        'Ezt érdemes elolvasni, mielőtt bárhová elindulnátok.',
      en:
        'One shared pool of Information, two directions. TECHNOLOGY helps now: a better ship. ' +
        'UNDERSTANDING gives nothing now — and decides everything at the end. This screen also carries ' +
        'the list of HOW THIS CAN END, and whatever is shut says what it is waiting on. Worth reading ' +
        'before you set out anywhere.',
    },
  },
  {
    id: 'week',
    screen: null,
    title: { hu: 'A hét vége', en: 'Ending the week' },
    text: {
      hu:
        'Ha megvan az energia, a beosztás és az irány, a bal alsó „A hét vége" gombbal telik el egy hét: ' +
        'a legénység eszik, az állomások termelnek, a hajó megy tovább. Az energia-elosztás és a ' +
        'beosztás ÁLLANDÓ — nem kell minden héten újra megadni, csak ha változtatnátok. Egy nyugodt ' +
        'utazó-hét így fél perc.',
      en:
        'Once the power, the postings and the course are set, "End the week" in the bottom left passes ' +
        'one: the crew eat, the stations produce, the ship travels on. The power allocation and the ' +
        'postings are STANDING — you do not set them again every week, only when you want them ' +
        'different. A quiet week under way takes half a minute.',
    },
  },
  {
    id: 'landing',
    screen: null,
    title: { hu: 'Partraszállás: a lapok két fele', en: 'A landing: the two halves of a card' },
    text: {
      hu:
        'Amikor leszállsz valahová, taktikai rácsra kerülsz. Körönként KÉT LAPOT választasz, és ' +
        'megjelölöd, melyik adja a kezdeményezést — a kisebb szám lép előbb. Az egyik lap FELSŐ, a ' +
        'másik ALSÓ felét használod, a sorrend a tiéd. Ha egy társad 2 mezőn belül áll, mindkettőtök ' +
        'támadása +1-et sebez: ezért érdemes együtt mozogni.',
      en:
        'When you land somewhere you go to a tactical grid. Each round you pick TWO CARDS and mark ' +
        'which gives the initiative — the lower number acts first. You use the TOP half of one and the ' +
        'BOTTOM half of the other, in whichever order you like. An ally within 2 tiles makes both of ' +
        'your attacks hit for one more, so it pays to move together.',
    },
  },
  {
    id: 'attention',
    screen: null,
    title: { hu: 'A Zaj és a Hírnök', en: 'Attention and the Herald' },
    text: {
      hu:
        'A fejlécben a Zaj azt mutatja, mennyire hallatszotok. Zajt csap a harc, az erővel feltört ' +
        'szerkezet, a felpörgetett hajtómű — és MINDEN, amit megfejtetek: 2 megfejtés 1 zaj. Ha eléri ' +
        'a nyolcat, valami elindul felétek a mélyből: a Hírnök. Ez a játék szíve: nem lehet csendben ' +
        'nyerni, mert kevés megfejtéssel két végkifejlet marad. A kérdés csak az, meddig bírjátok.',
      en:
        'Attention in the header is how easy you are to hear. Noise comes from fighting, from forcing ' +
        'a mechanism, from running the engines hot — and from EVERYTHING you understand: 2 ' +
        'understanding is 1 attention. At eight, something sets out towards you from the deep: the ' +
        'Herald. This is the heart of the game. You cannot win quietly, because low understanding ' +
        'leaves two endings. The only question is how long you can take it.',
    },
  },
  {
    id: 'crew',
    screen: null,
    title: { hu: 'A legénység saját élete', en: 'The crew have a life of their own' },
    text: {
      hu:
        'A legénység nem szám. Van hűségük, ami attól függ, milyen a hajón élni; tanulnak a posztjukon; ' +
        'a szárnyad alá vehetsz valakit, és ha képzett lesz, le is viheted a partraszállásra. Néha ' +
        'történik valami a hajón, amit egy KONKRÉT hősnek kell eldöntenie, és a hét addig nem tud ' +
        'eltelni. Pár hetente pedig a legénység maga kér valamit.',
      en:
        'The crew are not a number. They have loyalty, which follows what the ship is like to live on; ' +
        'they learn at their posts; you can take somebody under your wing, and once trained you can ' +
        'take them down on a landing. Sometimes something happens aboard that ONE named hero has to ' +
        'answer, and the week cannot turn over until they do. And every few weeks the crew ask for ' +
        'something themselves.',
    },
  },
  {
    id: 'stop',
    screen: null,
    title: { hu: 'Ha abba akarjátok hagyni', en: 'When you want to stop' },
    text: {
      hu:
        'Bármikor letehetitek. A „Félbehagyjuk mára" gombbal — vagy a bal felső CSILLAGSÍR feliratra ' +
        'kattintva — visszamentek a kezdőképernyőre, és semmi nem vész el: onnan folytatható, ahol ' +
        'abbahagytátok. Adjatok neki nevet, hogy megtaláljátok. Az „Expedíció leállítása" MÁS: az ' +
        'véget vet a futamnak.',
      en:
        'You can put it down at any time. "Stop for today" — or clicking STARGRAVE in the top left — ' +
        'takes you back to the title screen, and nothing is lost: it carries on from where you left ' +
        'it. Give it a name so you can find it. "Call off the expedition" is something else: that ends ' +
        'the run.',
    },
  },
  {
    id: 'done',
    screen: null,
    title: { hu: 'Ennyi az alapja', en: 'That is the base of it' },
    text: {
      hu:
        'A többit menet közben mondja el a játék: minden képernyőn ott van, mi mit jelent, és a ' +
        'fejlécben a `?` gomb a teljes szabálykönyvet nyitja (F1). Ha valami szót nem ismersz, a ' +
        'Szótár fülön mind ott van egy-egy mondatban. Jó utat — és ne legyetek túl hangosak.',
      en:
        'The game says the rest as you go: every screen explains what its own numbers mean, and the ' +
        '`?` in the header opens the whole rulebook (F1). If a word is unfamiliar, the Glossary tab ' +
        'has all of them in a sentence each. Safe travels — and try not to be too loud.',
    },
  },
]

export function guideStep(index: number): GuideStep | null {
  return GUIDE_STEPS[index] ?? null
}
