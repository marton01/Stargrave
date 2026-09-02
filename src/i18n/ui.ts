// Interface strings.
//
// Game *content* (card names, enemy descriptions, encounter text) stores both
// languages next to each other in the content files, because the wording belongs
// with the number it describes. Interface *chrome* is different: it is keyed, so
// that a single catalogue can be scanned for gaps.
//
// Every key must exist in both languages — TypeScript enforces that, because the
// English catalogue's type is derived from the Hungarian one. A missing key is a
// compile error rather than a string that silently stays Hungarian.

import type { Lang, Text } from '../engine/types'

const HU = {
  // ------------------------------------------------------------------ shell
  appTitle: 'Csillagsír',
  appSubtitle: 'kooperatív expedíció 1-4 főre',
  language: 'Nyelv',
  helpTitle: 'Súgó és játékszabályok (F1)',
  soundTitle: 'Hang be- és kikapcsolása',
  soundOn: 'Hang: be',
  soundOff: 'Hang: ki',
  back: 'Vissza',
  close: 'Bezárás',
  helpSearchPlaceholder: 'Keresés a leírásban…',
  helpSearchDrawn: (n: number) =>
    `${n} találat ezen a fülön. Ez a fül kódból rajzolódik, ezért itt nincs kijelölés — az alakzatok alatti szövegekben keresd.`,
  helpSearchHits: (n: number) => `${n} találat`,
  helpSearchNone: 'Nincs találat',
  helpSearchElsewhere: 'Ezen a fülön nincs találat — a többi fülön a szám mutatja, hol van.',
  dialsTitle: 'Nehézség',
  dialsHeading: 'Nehézség — külön-külön állítható',
  dialsIntro:
    'Nem egy szám, hanem több kis tárcsa: mindegyik a játék egy szorítását állítja, öt fokozatban. A harmadik mindenhol az, ahogy a játék tervezve van. Minden tárcsa alatt ott van, hogy a mostani fokozat mit jelent a gyakorlatban.',
  dialsSavePreset: 'Legyen ez az alapbeállításom',
  dialsLoadPreset: 'Az elmentett beállításom',
  dialsReset: 'Vissza a tervezettre',
  dialScopeLanding: 'a következő partraszállástól',
  dialScopeWeek: 'a következő héttől',
  dialScopeExpedition: 'a következő expedíciótól',
  undo: 'Visszavonás',
  wipeTitle: 'Minden törlése és új játék',
  wipeHeading: 'Mindent törölsz?',
  wipeText: 'Ez nem egy expedíciót zár le, hanem az egész eddigi játékot eldobja:',
  wipeItemExpedition: 'a futó expedíció, azonnal — nem kerül be az Archívumba',
  wipeItemArchive: 'az Archívum: pontok, feloldások, végkifejletek, a hosszú emlékezet',
  wipeItemSave: 'a böngészőben tárolt mentés',
  wipeItemRooms: 'minden szoba, amit ez a böngésző ismer — és a játékoskulcsod is',
  wipeHint: 'Nincs visszavonás. Ha meg akarod tartani, előbb exportáld a mentést az Archívum képernyőjén.',
  wipeConfirm: 'Törlés és új játék',
  bondActive: '⇄ Kötelék: +1 sebzés',
  handHide: 'Kéz elrejtése',
  handShow: 'Kéz megjelenítése',
  handToggleHint: 'A kártyapanel összecsukásával a csatatér megnő. A körhöz vissza kell nyitni.',
  projectionHint:
    'Ennyivel változik a hét végén, ha az energia-elosztás és a legénység-beosztás így marad.',
  bondHint:
    'Van társ 2 mezőn belül, ezért mindkettőtök támadása +1-et sebez. Ezért sebez egy „Támadás 3" néha 4-et.',
  endingsHeading: 'Végkifejletek',
  endingsProgress: (seen: number, total: number) =>
    `${seen} / ${total} megvan. A cél nem a túlélés, hanem hogy mind az ötöt lássátok — és utána az, ami belőlük következik.`,
  endingsDone: 'Mind megvan, és a válasz is. Ez a játék vége — az Archívum kész.',
  endingUnseen: 'Még nem láttátok',
  endingsEarnedHeading: 'Kiérdemelt végkifejletek',
  endingsEarnedIntro:
    'Ezeket nem a megfejtés száma nyitja, hanem az, amit az expedíció tett. A nevük és a ' +
    'feltételük itt látszik — a szövegük csak akkor, ha ott állsz előtte.',
  endingNeed: (tier: number) =>
    tier === 0 ? 'megfejtés nem kell hozzá' : `${tier}. megfejtés-szint kell hozzá`,
  endingLastQuestion: 'Az utolsó kérdés — a Csillagsírban tehető fel',
  accountCosts: 'Amit kér',
  accountEffects: 'Amit ad',
  accountNothing: 'Nincs se ára, se hozadéka — csak a döntés.',
  encounterBack: 'Mégse',
  heartConfirm: 'Ezt választjuk',
  heartFinal: 'Ez az expedíció utolsó döntése. Nincs utána visszaút.',
  marketConfirm: (price: number) => `Megveszem — ${price} ✧`,
  summaryWeek: 'A hét vége',
  summaryMission: 'Mi lett a partraszállásból',
  summaryEncounter: 'A döntés következménye',
  summaryMarket: 'Kereskedés vége',
  summaryWeeksPassed: (weeks: number) => `${weeks} hét telt el`,
  summaryGateLeft: (weeks: number) => `A Kapu ${weeks} hét múlva zárul`,
  summaryClose: 'Rendben',
  undoTitle: 'Az utolsó lépés visszavonása a csatában (Ctrl+Z)',
  rescueStuck: 'Beragadt?',
  rescueIntro:
    'Ha a pálya nem bejárható — például egy ellenség nem megközelíthető —, vagy a csata elakadt, itt van kiút. A feladat, a nehézség és az ellenfelek összetétele mindhárom esetben ugyanaz marad.',
  rescueChoose: 'Ezt',
  rescueConfirm: 'Biztosan',
  landingDifficultyLabel: 'Partraszállások nehézsége:',
  landingGentle: 'Engedékeny',
  landingNormal: 'Szokásos',
  landingHard: 'Kemény',
  landingGentleHint:
    'Egy szinttel könnyebb küldetések és 30%-kal kevesebb ellenfél. A hajó dolgai (Kapu, élelem, morál) változatlanok.',
  landingNormalHint: 'Ahogy tervezve van: a nehézség a térkép mélységéből és a Sötétedésből jön.',
  landingHardHint:
    'Egy szinttel nehezebb küldetések és 30%-kal több ellenfél. A hajó dolgai változatlanok.',
  rescueWin: 'Legyen győzelem',
  rescueWinText:
    'A csata véget ér győzelemként: megkapod a küldetés teljes jutalmát, ereklyés küldetésnél az összes ereklyével. A legjobb forgatókönyv, harc nélkül.',
  rescueLose: 'Legyen vereség',
  rescueLoseText:
    'A csata véget ér vereségként, a teljes árral: a csapat elesik (mindenki 1 életerővel jön haza), egy hét elmegy, morál −2, és egy legénységtag meghal. Hajóra törésnél a hajótest is sérül. Ez a legrosszabb forgatókönyv, harc nélkül.',
  rescueSkip: 'Partraszállás kihagyása',
  rescueSkipText:
    'Se jutalom, se veszteség: a helyszín lezárul, a csapat hazamegy. Ha csak túl akarsz lenni rajta.',
  rescueEdit: 'Pálya szerkesztése',
  rescueEditText:
    'A terep átrakása kézzel: kattints egy mezőre, és az lesz belőle, amit a palettán kiválasztottál. A csata áll közben, és minden változás visszavonható (Ctrl+Z).',
  paletteLabel: 'Terep:',
  paletteHint: 'Kattints egy mezőre. Egységre, ereklyére vagy a kijáratra nem lehet falat tenni.',
  paletteDone: 'Kész',
  rescueRestart: 'Csata újrakezdése',
  rescueRestartText: 'Ugyanez a helyszín, elölről. A hősök úgy állnak fel, ahogy a partraszállásnál.',
  rescueReroll: 'Pálya újragenerálása',
  rescueRerollText: 'Új helyszín ugyanerre a feladatra: ugyanaz a cél, nehézség és ellenfélkészlet, más terep.',
  rescueWithdraw: 'Vissza a partraszállás előttre',
  rescueWithdrawText: 'Kilépés a csillagtérképre. A csomópont érintetlen marad, később újra le lehet szállni.',
  cancel: 'Mégse',
  confirm: 'Rendben',

  // --------------------------------------------------------- title / archive
  titleTagline: 'Egy galaxis, ami nem háborúban halt meg. Valami befejezte.',
  newExpedition: 'Új expedíció',
  continueExpedition: 'Folytatás',
  expeditionLength: 'Hossz',
  lengthShort: 'Rövid',
  lengthMedium: 'Közepes',
  lengthLong: 'Hosszú',
  lengthShortText: '8 rendszer, 20 hét. Egy hosszabb este.',
  lengthMediumText: '10 rendszer, 28 hét. Ez az alapeset.',
  lengthLongText: '13 rendszer, 40 hét. Több estére, több megfejtésre.',
  launch: 'Indulás',
  archiveHeading: 'Az Archívum',
  archiveIntro:
    'Az Archívum a Kapu innenső oldala: a hazatérők adatait ide gyűjtik. Minden expedíció — még a ' +
    'kudarcos is — hazaküldi, amit megtudott, és abból pont lesz. A pontokból NEM erősebb hajót ' +
    'lehet venni, hanem több tartalmat: új helyzeteket, új végkifejleteket. A világ gazdagodik, ' +
    'nem könnyebbé válik.',
  archivePoints: 'Archívum-pont',
  expeditionsRun: 'Expedíciók',
  bestUnderstanding: 'Legjobb megfejtés',
  unlockHeading: 'Feloldható',
  unlockBuy: 'Feloldás',
  unlockOwned: 'Feloldva',
  unlockCost: 'Költség',
  historyHeading: 'Korábbi expedíciók',
  historyWeek: 'hét',
  exportSave: 'Mentés fájlba',
  importSave: 'Mentés betöltése',
  importFailed: 'Ez a fájl nem olvasható mentés.',
  deleteSave: 'Mentés törlése',
  deleteSaveConfirm: 'Biztosan törlöd a mentést? Ez nem visszavonható.',
  seed: 'Kezdőszám',
  seedHint:
    'Ez a szám sorsolja ki az egész expedíciót: a térképet, a helyszíneket, a találkozásokat. ' +
    'Ugyanaz a szám ugyanazt a galaxist adja — így egy jól sikerült futamot újra le lehet ' +
    'játszani, vagy ugyanazt odaadni valaki másnak. Üresen hagyva kapsz egy véletlent.',
  seedReuse: (seed: number) => `${seed} kezdőszám beírása a mezőbe`,

  // ------------------------------------------------------------------- ship
  shipHeading: 'A hajó',
  week: 'Hét',
  gateLeft: 'A Kapu bezárul',
  gateWeeks: (n: number) => `${n} hét`,
  darkening: 'Sötétedés',
  darkeningLevel: (n: number) => `${n}. szint`,
  reactor: 'Reaktor',
  powerAllocated: 'Elosztva',
  powerFree: 'Szabad',
  powerHeading: 'Energia-elosztás',
  powerIntro: (units: number, free: number) =>
    `A reaktor ezen a héten ${units} egységet ad, és hét rendszer kér belőle — ` +
    `sosem elég mindenre. Minden egységet el kell osztani valahol: ` +
    `${free > 0 ? `${free} még szabadon áll, és amíg ott van, semmit nem csinál` : 'most mind be van osztva'}. ` +
    'Amit nem használsz, azt nem tudod félretenni: a jövő heti elosztást újra megbeszélitek. ' +
    'Ez közös döntés — ez a játék legerősebb kooperatív eleme.',
  stationsHeading: 'Állomások',
  stationsIntro:
    'Az állomás a hajó egy-egy munkahelye: a kohó, a labor, a gyógyító. Akkor és csak akkor ' +
    'dolgozik, ha KAP ENERGIÁT a reaktorból, ÉS ÁLL VALAKI a legénységből. Se elég energia ' +
    'emberek nélkül, se elég ember energia nélkül — ez a két korlát adja a játék szűkösségét.',
  stationEmpty: 'Nincs beosztva senki',
  stationNoPower: 'Nincs energia',
  stationRunning: 'Működik',
  crewHeading: 'Legénység',
  crewSpeciality: 'Szakterület',
  crewTraits: 'Jellemvonások',
  crewHome: (stations: string) => `Otthon: ${stations} — máshol csak életben tartja az állomást`,
  crewUnassigned: 'Nincs beosztva',
  crewWeeks: (n: number) => `${n}. hét a fedélzeten`,
  crewLostLabel: 'Elveszett',
  assignTo: 'Beosztás',
  unassign: 'Leváltás',
  endWeek: 'A hét vége',
  endWeekBlocked: 'Előbb be kell fejezni, ami folyamatban van.',
  fluxPreview: (n: number) => `A partraszálló csapat ${n} Töltettel indul.`,
  fluxPreviewHint:
    'A Rúnamagra adott energia lesz a Töltet. Ez köti össze a hajót és a partraszállást.',
  logHeading: 'Napló',
  understanding: 'Megfejtés',
  understandingHint:
    'Mennyit fejtettetek meg abból, hogy MI TÖRTÉNT ITT — mitől halt ki egy egész galaxis. ' +
    'Harcban semmit nem ér. A végén viszont csak ez számít: ez dönti el, hányféle vége lehet ' +
    'az expedíciónak. Kevés megfejtéssel mindössze kettő marad — elmenekültök, vagy szétveritek ' +
    'azt, amit nem értettetek meg.',
  tier0: 'Semmit nem értünk',
  tier1: 'Kezdjük érteni',
  tier2: 'Látjuk, mi történik',
  tier3: 'Értjük, miért',
  /** Egy szó a fejlécbe a szám mellé — a hosszú mondat ott két sorba tört. */
  tierName: (tier: number): string =>
    tier >= 3 ? 'értjük' : tier === 2 ? 'látszik' : tier === 1 ? 'sejtés' : 'semmi',
  darkeningHint:
    'A galaxis kihűlése. Ahogy telnek a hetek, egyre magasabb szintre lép, és minden szint ' +
    'ugyanazt a kettőt teszi: a reaktor kevesebb energiát ad, odalent pedig erősebbek az ' +
    'ellenfelek. Megállítani nem lehet, csak elé dolgozni.',

  // --------------------------------------------------------------- research
  researchHeading: 'Kutatás',
  researchIntro:
    'Egy közös Információ-készlet, két irány, és nem lehet mindkettőt vinni. A TECHNOLÓGIA most ' +
    'segít: erősebb hajót, több energiát, jobb felszerelést ad. A MEGFEJTÉS most semmit nem ad — ' +
    'a végén viszont ez dönti el, hogy egyáltalán mit tudtok kezdeni azzal, amit a galaxis ' +
    'szívében találtok.',
  branchTechnology: 'Technológia',
  branchUnderstanding: 'Megfejtés',
  researchActive: 'Folyamatban',
  researchWeeksLeft: (n: number) => `${n} hét`,
  researchStart: 'Indítás',
  researchDone: 'Kész',
  researchNeeds: 'Kell hozzá:',
  researchLocked: 'Előfeltétel hiányzik',
  researchTooExpensive: 'Nincs elég Információ',
  researchNone: 'Nincs futó kutatás.',
  modulesHeading: 'Beépített modulok',
  modulesNone: 'Még nincs egy sem.',

  // --------------------------------------------------------------- star map
  starMapHeading: 'Csillagtérkép',
  starMapIntro:
    'Innen vezetnek utak előre. A térkép OSZLOPOKBA van rendezve: balra a Kapu, jobbra a ' +
    'galaxis szíve, és minden oszloppal mélyebbre juttok — nehezebb ellenfelek, jobb leletek. ' +
    'Amit választotok, az heteket kér, és a Kapu közben számolja a magáét.',
  enginesColdWarning:
    'A hajtómű energia nélkül áll: így nem lehet útnak indulni. Adj neki legalább egy egységet a Hajó képernyőn.',
  setCourse: 'Irány',
  travellingTo: (node: string, weeks: number) => `Útban: ${node} — ${weeks} hét`,
  currentPosition: 'Itt vagyunk',
  unknownSystem: 'Ismeretlen',
  nodeEmpty: 'Üres tér',
  nodeRuins: 'Romok',
  nodeStation: 'Állomás',
  nodeAnomaly: 'Anomália',
  nodeWorld: 'Lakott világ',
  nodeTrade: 'Kereskedelmi pont',
  nodeDistress: 'Vészjelzés',
  nodeHeart: 'A galaxis szíve',

  // A csomópont-jelmagyarázat szövegei (súgó, Csillagtérkép fül). A százalékok
  // a generátorból jönnek (engine/expedition/starmap.ts), nem becslések.
  nodeRuinsText:
    'A leggyakoribb csomópont, és a térkép vége felé egyre gyakoribb. Nagyjából minden második romnál partraszállás vár (45%), minden negyediknél feladvány (25%), egyébként egy leírt helyzet. A kiszámítható kreditforrás.',
  nodeAnomalyText:
    'Valami, ami nem viselkedik. Csaknem felében feladvány (45%), egyébként találkozás — és az anomáliáknál a találkozások a kockázatosabbak. Mélyebben egyre több van belőlük.',
  nodeWorldText:
    'Ahol emberek élnek. Mindig leírt helyzet: itt lehet legénységet találni, és itt kell a nehéz döntéseket meghozni. A Kapuhoz közel gyakori, a galaxis szíve felé eltűnik.',
  nodeStationText:
    'Egy még működő létesítmény. Minden ötödikből piac lesz (40%), egyébként találkozás. A térkép elején sok, a végén szinte semmi.',
  nodeTradeText:
    'Mindig piac: 2–4 ajánlat erőforrásból, modulból vagy felvehető legénységtagból. Az egyetlen csomópont, aminél előre tudod, mi lesz.',
  nodeDistressText:
    'Valaki segítséget kér. Mindig találkozás, és mindig döntés: a segítség heteket és hajótestet kér, a továbbmenés morált. A térkép egészén ugyanolyan gyakori.',
  nodeEmptyText:
    'Nincs itt semmi — csak a hét, ami elmegy rá. Nem hiba a térképen: a mélyebb oszlopokban egyre több az üres tér, és ez maga a nyomás.',
  nodeHeartText:
    'A galaxis szíve, a Csillagsír. Az út vége. Hogy ott mit tudsz tenni, azt a megfejtés dönti el, nem a felszerelés.',

  engageMission: 'Partraszállás',
  engagePuzzle: 'Megvizsgáljuk',
  engageEncounter: 'Odamegyünk',
  engageMarket: 'Dokkolás',
  nodeResolved: 'Elvégezve',
  nodeNothing: 'Nincs itt semmi.',

  // -------------------------------------------------------------- encounter
  encounterHeading: 'Találkozás',
  encounterRequirementUnmet: 'Ehhez nincs meg a feltétel.',
  encounterUnaffordable: 'Ehhez nincs elég erőforrás.',
  encounterPayCards: (count: number) =>
    `Válassz ${count} lapot. Ezek véglegesen elveszik — a következő partraszálláson hiányozni fognak.`,
  encounterPaySelected: (a: number, b: number) => `Kiválasztva: ${a} / ${b}`,
  encounterConfirm: 'Így legyen',
  encounterContinue: 'Tovább',
  costWeeks: (n: number) => `${n} hét`,
  costCards: (n: number) => `${n} lap`,

  // ----------------------------------------------------------------- market
  marketHeading: 'Kereskedés',
  marketBuy: 'Vásárlás',
  marketBought: 'Megvásárolva',
  marketTooExpensive: 'Nincs elég kredit',
  marketEmpty: 'Nincs több ajánlat.',
  marketCrew: 'Legénységtag',
  marketRelic: 'Ereklye',
  marketSellHeading: 'Amit el tudsz adni',
  marketSellHint:
    'Ráhangolni csak keveset lehet egyszerre, a többi a raktárban áll. Az állomás megveszi — ' +
    'de gondold meg: három ereklyével a Csillagsírban külön végkifejlet nyílik.',
  marketSell: 'Eladás',
  marketSellConfirm: (price: number) => `Eladom — ${price} ✧`,
  marketSellNone: 'Minden ereklyét hordja valaki. Előbb le kell venni.',

  // ---------------------------------------------------------------- mission
  missionHeading: 'Küldetés',
  missionBriefing: 'Feladat',
  missionLaunch: 'Indulás',
  missionFinish: 'Jelentés a hajóra',
  objectiveEliminate: 'Minden ellenséget le kell győzni.',
  objectiveReachExit: 'MINDEN hősnek el kell jutnia a kimenekítési pontra (rá vagy mellé).',
  atExitCount: (there: number, total: number) => `${there}/${total} a kijáratnál`,
  objectiveCollect: (n: number) =>
    `${n} ereklyét kell begyűjteni, majd MINDENKINEK ki a kimenekítési ponton.`,
  objectiveSurvive: (n: number) => `${n} körig ki kell tartani. Az erősítés folyamatosan jön.`,
  objectiveHold: (n: number) => `A jelölt pontot kell megtartani a ${n}. kör végén.`,
  objectiveLabel: 'Cél',
  relicsCarried: (a: number, b: number) => `Ereklye: ${a} / ${b}`,
  roundLimitLeft: (n: number) => `Hátralévő kör: ${n}`,
  exitMarker: 'Kimenekítési pont',
  collapsingWarning: (n: number) => `${n} mező recseg`,

  // ---------------------------------------------------------------- puzzles
  puzzleHeading: 'Feladvány',
  puzzleSolved: 'Megfejtve',
  puzzleFailed: 'Nem sikerült',
  puzzleSubmit: 'Beadás',
  puzzleReset: 'Újra',
  puzzleUndo: 'Visszavonás',
  puzzleAttemptsLeft: (n: number) => `Hátralévő próba: ${n}`,
  puzzleNoGuessing:
    'Minden feladvány levezethető logikával. Nem kell tippelni, és nincs benne nyelvi tartalom.',
  runeDecodeName: 'Rúnafejtés',
  runeDecodeHelp:
    'Ki kell találni a rúnasorrendet. Kattints egy mezőre a következő rúnáért (jobb klikk: visszafelé), majd Beadás. Utána két számot kapsz: mennyi rúna volt a helyén, és mennyi szerepel a sorozatban, de más helyen. Azt NEM mondja meg, melyik — csak azt, mennyi.',
  runeExact: 'a helyén',
  runePartial: 'máshol benne',
  runeScoreHint:
    'A két szám darabszám, nem pozíció: azt mondja meg, MENNYI rúna jó, nem azt, melyik. Ami egyáltalán nem szerepel a sorozatban, az egyik számban sem jelenik meg.',
  balanceScalesName: 'Egyensúly-mérleg',
  balanceScalesHelp:
    'Az ereklyék súlya rejtve van. Mérj, amíg tudsz, aztán add meg a sorrendet a legkönnyebbtől a legnehezebbig.',
  scaleWeigh: 'Mérés',
  scaleClear: 'Serpenyők ürítése',
  scaleLeft: 'Bal',
  scaleRight: 'Jobb',
  scaleWeighingsLeft: (n: number) => `Hátralévő mérés: ${n}`,
  scaleOrderHeading: 'Sorrend a legkönnyebbtől',
  scaleOrderClear: 'Sorrend törlése',
  glyphsName: 'Jelfejtés',
  glyphsHelp:
    'Minden vonáselem egy fogalmat jelent. A példákból ki kell következtetni, melyik melyiket — aztán megadni, mit jelent a kérdéses jel.',
  glyphsExamples: 'Példák',
  glyphsQuery: 'Ez a jel mit jelent?',
  safeGroundName: 'Biztos talaj',
  safeGroundHelp:
    'A számok azt mutatják, hány szomszédos mező omlik be. Jelöld meg mindet, ami beomlik.',
  powerRoutingName: 'Vezetékrendezés',
  powerRoutingHelp:
    'Forgasd a vezetékeket, amíg a reaktor eléri az összes csatlakozót. Két mező csak akkor kapcsolódik, ha mindkettő egymás felé mutat.',
  powerRoutingReactor: 'Reaktor',
  powerRoutingTerminal: 'Csatlakozó',
  refractionName: 'Fénytörés',
  refractionHelp:
    'Fordítsd a tükröket, hogy a rúnafény minden fókuszt elérjen. Kattints egy tükörre az átfordításához.',
  refractionFocus: 'Fókusz',
  starChartName: 'Csillagtérkép-illesztés',
  starChartHelp:
    'Illeszd össze a töredékeket úgy, hogy a szélek kódjai minden illesztésnél egyezzenek. Bal klikk: elhelyezés, jobb klikk: forgatás.',
  starChartTray: 'Töredékek',
  starChartRotate: 'Forgatás',
  resonanceName: 'Rezonancia-hangolás',
  resonanceHelp:
    'Minden érintés eggyel léptet egy tárcsát és a négy szomszédját. Mindet nullára kell vinni.',
  resonanceTaps: (n: number) => `Érintés: ${n}`,
  gravityCoresName: 'Gravitációs magok',
  gravityCoresHelp:
    'Told a magokat a jelölt helyekre. Csak tolni lehet, húzni nem — a nyilakkal vagy a mezőkre kattintva.',
  gravityCoresMoves: (n: number) => `Lépés: ${n}`,

  // ------------------------------------------------------------------ heart
  heartHeading: 'A Csillagsír',
  heartIntro:
    'Ez a galaxis szíve, a Csillagsír. Nem a fegyvereitek döntik el, mit tudtok tenni vele, hanem ' +
    'az, hogy mennyit fejtettetek meg abból, mi történt az itt élőkkel. Amit nem értetek, azt ' +
    'csak itt hagyni vagy szétverni tudjátok.',
  heartUnderstanding: (n: number) => `Megfejtés: ${n}`,
  heartChoose: 'Ezt tesszük',
  heartLocked: 'Ehhez túl keveset fejtettetek meg abból, mi történt itt.',
  // ------------------------------------------------------------------- over
  overVictory: 'Az expedíció véget ért',
  overLost: 'Az expedíció elveszett',
  overArchiveEarned: (n: number) => `Az Archívum ${n} ponttal gazdagodott.`,
  overUnderstanding: (n: number) => `Megfejtés a végén: ${n}`,
  overWeeks: (n: number) => `${n} hét`,
  overReturn: 'Vissza az Archívumhoz',
  abandonExpedition: 'Expedíció leállítása',
  abandonConfirm: 'Biztosan leállítod? Ami megvan, az bekerül az Archívumba.',

  // ------------------------------------------------------ battle (tactical)
  round: 'Kör',
  fluxShared: 'Töltet — ebből fizetitek a lapok erős felét',
  phase: 'Fázis',
  phaseCardSelection: 'Lapválasztás',
  phaseResolution: 'Végrehajtás',
  phaseOver: 'Vége',
  difficulty: 'Nehézség',
  difficultyEasy: 'Könnyű',
  difficultyNormal: 'Normál',
  difficultyHard: 'Nehéz',
  newBattle: 'Új csata',
  initiative: 'Kezdeményezés',
  yourTeam: 'A csapat',
  followersHeading: 'Akiket lehoztatok',
  followerFallen: 'Elesett. A hajón sem lesz többé.',
  takeFollowers: 'Kit visztek le?',
  takeFollowersHint:
    'Csak képzett tanítvány jöhet — és aki lent elesik, az a legénységi listáról is lekerül.',
  followerNobody: 'Most nincs képzett tanítványod, akit lehozhatnál.',
  bondTogether: 'most egy állomáson',
  ashoreHeading: 'Lemész?',
  ashoreMeta: (n: number): string => `${n} hős száll partra`,
  ashoreIntro:
    'Nem muszáj mindenkinek lemenni. Aki fent marad, az a csata alatt a hajót viszi: körönként egy támogatás, a raktár terhére. Lent viszont eggyel kevesebben lesztek.',
  ashoreStaying: 'Fent maradok ✓',
  ashoreGoing: 'Inkább fent maradok',
  ashoreLocked: 'Valakinek le kell mennie — legalább ketten mindig partra szállnak.',
  supportHeading: 'A hajóról',
  supportSpent: 'ebben a körben már volt',
  pledgeHeading: 'A szavad',
  pledgeMeta: 'egyszerre egy, az egész asztalra',
  pledgeIntro:
    'Mondj ki valamit hangosan, határidővel. A játék felírja, és számon is kéri — ha megtartod, a jegy a tiéd.',
  pledgeBy: (name: string, weeks: number): string => `${name} szava · ${weeks} hét`,
  prospectsHeading: 'Hogyan érhet véget',
  prospectsIntro:
    'Ezért éri meg megfejteni, mi történt itt: ez a lista mondja meg, hogyan érhet véget az ' +
    'expedíció. Amelyik sor zárva van, oda ki van írva, mi hiányzik hozzá. Ha végig csendben ' +
    'maradtok, csak a nyitva maradt kettő marad — elmenekültök, vagy szétveritek.',
  prospectOpen: 'nyitva',
  understandingTierLine: (tier: number): string =>
    tier >= 3
      ? 'Értjük, miért'
      : tier === 2
        ? 'Látjuk, mi történik'
        : tier === 1
          ? 'Kezdjük érteni'
          : 'Még semmit nem értünk',
  attentionCostLine: 'amit megfejtetek, azt meg is hallják: 2 megfejtés 1 zajba kerül',
  figuresHeading: 'Akikkel találkoztatok',
  figuresMeta: 'ők emlékeznek rátok',
  figureWarm: 'jóban vagytok',
  figureCold: 'haragszik rátok',
  readingYours: 'ezt csak te látod',
  readingTheirs: 'ezt csak ő látja',
  readingIntro:
    'Ezt rajtad kívül senki nem látja az asztalnál. Nem titok — a te dolgod, hogy elmondd.',
  readingClosed: (name: string, count: number): string =>
    `${count} dolgot lát, amit te nem. Kérdezd meg ${name}-t.`,
  followerTake: 'Lehozom',
  followerComing: 'Lejön ✓',
  followerNeedsRank: 'Csak képzett tanítvány jöhet le. Adj neki még pár hetet egy állomáson.',
  enemy: 'Ellenség',
  noEnemiesLeft: 'Nincs több ellenség.',
  noIntentYet: 'Még nem mutatta fel a szándékát.',
  playerLabel: (n: number) => `${n}. játékos`,
  inHand: 'Kézben',
  inDiscard: 'Elhasznált',
  lostForever: 'Véglegesen elveszett',
  statusExhausted: 'Kifáradt — kivitték a csatából',
  statusFallen: 'Elesett',
  chooseTwoCards:
    'Válassz **két lapot**, majd jelöld ki, melyik adja a **kezdeményezést** — ez határozza meg, hol lépsz az ellenség között.',
  initiativeLabel: 'Kezdeményezés:',
  ready: 'Kész',
  restInstead: 'Inkább pihenek',
  mustRestNow: 'Nincs elég lapod a kézben, tehát pihenned kell.',
  restLoseWarning: (name: string) =>
    `A „${name}" ezzel ELVESZIK az expedíció hátralévő részére. A többi elhasznált lapot visszakapod, és gyógyulsz 2-t.`,
  restConfirm: 'Pihenés, ezt vesztem el',
  restExplain: 'Pihenés: visszakapod az elhasznált lapjaidat, és gyógyulsz 2-t.',
  restPickCard: '**Egy lap viszont véglegesen elveszik — válaszd ki, melyik.**',
  nothingToRecover: 'Nincs elhasznált lapod, amit vissza lehetne hozni.',
  enemyUpNext: (name: string) => `${name} következik`,
  initiativeShort: (n: number) => `kezdeményezés ${n}`,
  noIntent: 'Nincs szándéka.',
  next: 'Tovább',
  whichTopHalf: 'Melyik lap **felső** felét használod? A másiknak az **alsó** fele fut le.',
  pickHalfToPlay:
    'Kattints a lap felére, amit végre akarsz hajtani. A sorrend a tiéd — előbb mozogsz, vagy előbb ütsz?',
  bothHalvesDone: 'Mindkét fél lefutott. Zárd le a kört.',
  clickOnGrid: 'kattints a rácson.',
  endTurn: 'Kör vége',
  skipTop: 'Felső kihagyása',
  skipBottom: 'Alsó kihagyása',
  promptAttackTarget: (power: number, range: number) =>
    `Válassz célpontot (támadás ${power}, hatótáv ${range})`,
  promptAreaCentre: (power: number, radius: number) =>
    `Válassz középpontot (terület ${power}, sugár ${radius})`,
  promptMoveDestination: (distance: number) => `Hova lépsz? (mozgás ${distance})`,
  promptStatusTarget: (range: number) => `Kire kerüljön? (hatótáv ${range})`,
  promptPillarTile: 'Hova emeled az oszlopot?',
  promptTrapTile: 'Hova állítod a csapdát?',
  promptRecoverCard: 'Melyik lapot veszed vissza a kezedbe?',
  promptEchoCard: 'Melyik elhasznált lap felső felét játszod újra?',
  cardTop: 'Felső',
  cardBottom: 'Alsó',
  cardLostHint: 'A lap véglegesen elveszik',
  victoryTitle: 'A helyszín a tiétek',
  defeatTitle: 'Visszavonulás',
  victoryText: (rounds: number) => `${rounds} kör alatt teljesítettétek a feladatot.`,
  defeatText:
    'A csapatot fel kellett húzni a hajóra. A küldetés meghiúsult — de az expedíció megy tovább.',

  // ------------------------------------------------------------------- help
  helpHeading: 'Súgó és játékszabályok',
  helpClose: 'Bezárás',
  helpElementsTab: 'Játékelemek',
  helpFooter: 'A szabályok szövege a projekt',
  helpFooterTail: 'fájljából jön — ott szerkeszthető. Bezárás:',
  helpMissingSection: 'Ez a fejezet nem található a szabályfájlban.',
  helpLiveNote:
    'Ezeket az alakokat és színeket a súgó ugyanazzal a kóddal rajzolja, mint a rács — amit itt látsz, az pontosan az, ami a csatatéren van.',
  helpHeroes: 'A ti hőseitek',
  helpEnemies: 'Ellenségek',
  helpNodes: 'Csomópontok a csillagtérképen',
  helpTerrain: 'Terep',
  helpMarkers: 'Küldetés-jelölők',
  markerInstallation: 'Hajómodul',
  markerInstallationText:
    'Csak akkor van a rácson, ha a hajót támadják: a saját moduljaid állnak ott. Minden kör végén annyit sérülnek, ahány ellenfél a szomszédjukban áll — nem támadni kell őket megvédeni, hanem elzavarni onnan azt, aki mellettük áll. Ami elpusztul, az az EXPEDÍCIÓ VÉGÉIG hiányzik, akkor is, ha a csatát megnyered. Hogy hány modul áll ki, azt a nehézségi tárcsa dönti (akár nulla).',
  markerRelic: 'Ereklye',
  markerRelicText:
    'Fel kell venni: rálépsz, és a csapat viszi. Az „Ereklyék összeszedése" küldetéseken ' +
    'ezekért mentek le, és a kimenekítési ponton kell kijutni velük. Amit ott hagytok, az odalent marad.',
  markerExit: 'Kimenekítési pont',
  markerExitText:
    'A kijárat. Ahol „El kell jutni a pontra" a cél, ott elég ráállni; ahol „Tartsd a pontot", ' +
    'ott a megadott körben is rajta kell állni. Ereklyés küldetésen ez a kijutás helye.',
  markerCollapsing: 'Beszakadó padló',
  markerCollapsingText:
    'A szám azt mondja, hány kör múlva szakad be. Utána szakadék: nem járható, és nem jön vissza. ' +
    'Aki rajta áll a beszakadáskor, sebződik és kilökődik a szomszédos mezőre.',
  helpBadges: 'Jelvények a rácson',
  helpStatuses: 'Állapotjelzők',
  helpHp: 'életerő',
  helpShieldCapNote:
    'A számmal jelölt állapotok kör végén 1-gyel csökkennek. A Vért kivétel: az nem időhöz kötött, hanem használatkor fogy.',
  terrainFloor: 'Padló',
  terrainAsh: 'Hamu',
  terrainWall: 'Fal',
  terrainChasm: 'Szakadék',
  terrainPillar: 'Rúnaoszlop',
  terrainTrap: 'Csapda',
  terrainFloorText: 'Szabadon járható. Ezen a mezőn látszik a rácsvonal.',
  terrainAshText: 'Járható, de a belépés 2 mozgásba kerül — az ellenségnek is.',
  terrainWallText: 'Nem járható, és a látást is blokkolja. Nincs rajta rácsvonal.',
  terrainChasmText: 'Nem járható, de át lehet fölötte lőni és látni.',
  terrainPillarText:
    'Nem járható, a látást is blokkolja. A Rúnaszövő tud ilyet emelni — de olyan mezőre nem, ami kettévágná a pályát. Átlósan EL LEHET mellette menni: egy átlós lépés akkor tilos, ha mindkét szomszédos mező blokkolt, tehát egy magában álló oszlop nem zár el semmit.',
  terrainTrapText:
    'A Rúnaszövő állítja. Aki rálép, sebzést kap, és a csapda elhasználódik. Az ellenség nem látja előre.',
  badgeInitiative: 'Kezdeményezés (jobbra fent, piros)',
  badgeInitiativeText:
    'Ugyanaz a szám három helyen: az ellenfél mezőjén (jobbra fent), az ellenfél neve mellett az oldalsávban, és a saját lapjaid BAL FELSŐ sarkában. Ez a kezdeményezés: aki kisebb, az lép előbb. A körödben a két kiválasztott lap közül az adja a tiédet, amelyiket kezdeményezésnek jelölöd — ezért nem mindegy, melyiket.',
  badgeBond: 'Kötelék (a hős kártyáján, zöld)',
  badgeBondText:
    'Ha van társad 2 mezőn belül, MINDKETTŐTÖK támadása +1-et sebez — hárman-négyen is, mindenkire külön. Ezen felül: ha ugyanabban a körben már megsebezte valaki ugyanazt az ellenfelet, a te találatod további +1-et visz (Összehangolás). Amikor célpontot választasz, a rács a célpont közepére kiírja, mennyit visz el a találat — abban a számban már minden benne van: Kötelék, Összehangolás, Rúnajel, Vért, ledöntés.',
  badgeShield: 'Vért (balra fent, kék)',
  badgeShieldText: 'Ennyivel csökken a következő találat sebzése, aztán a Vért 1-gyel fogy.',
  badgeStatusDots: 'Állapotpontok (balra lent)',
  badgeStatusDotsText:
    'Borostyán = Horgony, ciánkék = Rúnajel, lila = ledöntött / elvakított / gyengített. A pontos értéket az oldalsáv írja ki.',
  badgeHp: 'Életerő-csík és borostyán keret',
  badgeHpText: 'Alul az életerő. A borostyán keret azt jelenti, hogy ez az egység van éppen soron.',
  badgeRelic: 'Ereklye és kimenekítési pont',
  badgeRelicText:
    'A begyűjtendő ereklyék és a kijárat. Felderítő küldetéseken ezek a cél, nem az ellenség.',

  // -------------------------------------------------- consoles and marks
  consolesHeading: 'Kezelőpultok',
  consolesIntro:
    'Mindenkinek van egy saját pultja a hajón, és ami ott van, az NEM közös. A jegyeidet te ' +
    'gyűjtöd és te költöd el, a parancsod a te határidőd, a tanítványaid a te embereid. A ' +
    'többiek pultját is látod — de ott ne nyomkodj, az az ő dolguk.',
  consoleTabHint: 'Itt válthatsz a pultok között. A sajátod az, amelyiken a te hősöd neve áll.',
  marksHeld: (n: number, name: string) => `${n} ${name}`,
  marksEarned: (n: number) => `eddig összesen ${n} gyűlt össze`,
  marksHow: 'Miből gyűlik a jegyed',
  perksHeading: 'Amit megtanulhat',
  perksIntro:
    'A jegy a SAJÁT fejlődésed pontja: nem a hajóé és nem a többieké, más nem tudja elkölteni. ' +
    'Azért kapod, amit a te hősöd csinál, és arra költöd, amit ő tanul meg — egy megtanult dolog ' +
    'végleg az övé marad, az expedíció végéig.',
  perkBuy: (cost: number) => `Megtanulja — ${cost} jegy`,
  perkOwned: 'Megvan',
  perkNeeds: (name: string) => `Előbb: ${name}`,
  perkTooExpensive: 'Nincs elég jegy',
  relicsHeading: 'Ereklyék',
  relicsIntro:
    'Egy ereklye a raktárban NEM TESZ SEMMIT. Csak az hat, amit valaki magára vesz — ezt hívja a ' +
    'játék ráhangolódásnak —, és mindenkinek csak egy-két helye van rá. Több ereklye van, mint ' +
    'hely: az igazi kérdés nem az, hogy találtatok-e egyet, hanem hogy ezen a héten ki melyiket ' +
    'hordja.',
  relicSlots: (used: number, total: number) => `Magán hordja: ${used} / ${total}`,
  relicAttune: 'Magamra veszem',
  relicStow: 'Leteszem a raktárba',
  relicWornBy: (name: string) => `${name} hordja`,
  relicOnlyFor: (name: string) => `Csak ${name} tudja hordani`,
  relicNoSlot: 'Nincs több hely — előbb le kell venni valamit',
  relicNone: 'Nincs ereklye a fedélzeten. Feltárásos partraszállásokból, kereskedőktől és néhány döntésből jönnek.',
  relicWhisper: 'Az ára',
  menteesHeading: 'Tanítványok',
  menteesIntro:
    'A legénység nem szám, hanem emberek. Akit a szárnyaid alá veszel, az kétszer olyan gyorsan ' +
    'tanul a posztján, jobban is bírja a hajót — és ha képzett szintre ér, lehozhatod magaddal a ' +
    'partraszállásra. Ha ott elesik, a legénységi listáról is lekerül.',
  menteeCount: (n: number, max: number) => `${n} / ${max} tanítvány`,
  menteeTake: 'Elvállalom',
  menteeRelease: 'Elengedem',
  menteeFull: 'Ennyit tudsz vinni',
  menteeOther: (name: string) => `${name} tanítványa`,
  crewRankLine: (rank: string, xp: number) => `${rank} · ${xp} munkahét`,
  crewNextRank: (n: number) => `${n} hét a következő szintig`,
  heroHpLine: (hp: number, max: number) => `Életerő ${hp} / ${max}`,

  // ------------------------------------------------------------ directives
  directivesHeading: 'Parancsok otthonról',
  directivesIntro:
    'Kérések otthonról, határidővel: az Archívum a Kapu túloldaláról üzen, hogy mit várnak tőletek. ' +
    'Mindegyik parancs EGY pultra kerül, és azé a játékosé, aki ott ül: ő felel érte, és ő kapja a ' +
    'jegyeket, ha összejön. Ami lejár, az morálba kerül.',
  directiveDue: (week: number) => `határidő: ${week}. hét`,
  directiveLeft: (weeks: number) => `${weeks} hét van rá`,
  directiveOverdue: 'lejárt',
  directiveProgressLine: (now: number, target: number) => `${now} / ${target}`,
  directiveAtDeadline: 'Ezt csak a határidőkor mérik.',
  directiveNone: 'Most nincs parancs. (A nehézségi tárcsán ki is lehet kapcsolni őket.)',
  directiveStateDone: 'teljesítve',
  directiveStateFailed: 'elbukva',
  directiveReward: 'Amit fizet',

  // ------------------------------------------------------- attention, Herald
  attention: 'Zaj',
  attentionHint:
    'Mennyire hallatszotok. Zajt csap a harc, az erővel nyitott szerkezet, a felpörgetett ' +
    'hajtómű — és minden, amit megfejtetek: 2 megfejtés 1 zaj. Leviszi a csendes hét egy már ' +
    'lezárt rendszerben, a Csendburok és néhány ereklye. Ha a zaj eléri a nyolcat, valami ' +
    'elindul felétek a mélyből: a Hírnök.',
  heraldLabel: 'Hírnök',
  heraldAway: (columns: number) =>
    columns === 0 ? 'itt van' : `${columns} oszlopra`,
  heraldHint:
    'Nem az utakon jön, hanem a folyosón: mindig felétek tart. Aki mélyebbre menekül, azzal ' +
    'együtt megy. Ha beér, hajóra törés lesz — ha megállítjátok, nem küldenek másikat.',
  heraldSilencedLabel: 'A Hírnök elhallgatott',

  // --------------------------------------------------------------- the Gate
  gateHeading: 'Vissza a Kapun',
  gateIntro:
    'A Kapu az egyetlen átjáró oda, ahonnan jöttetek — és csak egy ideig marad nyitva. Amíg ' +
    'nyitva van, és van elég üzemanyag, bármikor meg lehet fordulni. Ez nem vereség: amit eddig ' +
    'összeszedtetek, átmegy rajta, és az Archívum megkapja. Az expedíció viszont itt véget ér.',
  gateFuelCost: (fuel: number) => `${fuel} üzemanyag a hazaútra`,
  gateBanks: (points: number) => `Kb. ${points} archívum-pont`,
  gateGoHome: 'Hazatérés',
  gateGoHomeShort: 'Hazatérés…',
  gateConfirm: 'Megfordulunk',
  gateNoFuel: (fuel: number) => `Ehhez ${fuel} üzemanyag kell. Ennyivel nem lehet visszafordulni.`,
  gateHintOnMap: 'Innen bármikor haza lehet fordulni, amíg van rá üzemanyag és nyitva a Kapu.',

  // ----------------------------------------------------------- the Heart
  heartReadButton: 'Elolvassuk a peremet',
  heartReadHint:
    'Egyszer, mielőtt bármit eldöntenétek: egy szerkezet a legnehezebb fokozaton. Ha megfejtitek, ' +
    '+2 megfejtés — és az itt, ebben a pillanatban új végkifejletet nyithat. Ha nem, morálba kerül.',
  heartReadDone: 'A peremet elolvastátok. Ez egyszeri volt.',

  // -------------------------------------------------------- the two commands
  commandFilter: 'Kinek a pultja',
  commandAll: 'Minden',
  domainEngineering: 'Gépészet',
  domainResearch: 'Kutatás',
  domainShared: 'Közös',
  domainHint:
    'A hajó két félre van osztva, és mindkét fél valakinek a dolga: a GÉPÉSZET (hajótest, kohó, ' +
    'hajtómű) és a KUTATÁS (labor, archívum, érzékelők). Ami közösnek van jelölve, arról tényleg ' +
    'együtt kell döntenetek — a reaktor energiáját senki nem osztja fel egyedül.',
  // ------------------------------------------------------- modes and rooms
  modeSolo: 'Egyedül',
  modeSoloText:
    'Egy ember viszi az egész csapatot. Minden pult a tiéd, semmi nincs zárolva.',
  modeLocal: 'Egy gépen, többen',
  modeLocalText:
    'Ketten-négyen egy billentyűzet előtt. Aki épp az egérnél ül, bármit megnyomhat — a pultok csak azt mutatják, kinek mi a dolga.',
  modeOnline: 'Online, külön gépeken',
  modeOnlineText:
    'Ketten-négyen, mindenki a saját gépén. Szobakódot kaptok, azzal léptek be. A saját hősödet csak te mozgathatod; a hajó közös.',
  playersHeading: 'Hányan játszotok',
  partyHeading: 'Ki kivel',
  partyHint: 'Bárki bármelyiket viheti. Ha olyat választasz, ami már foglalt, cseréltek.',
  playersCount: (n: number) => `${n} játékos`,
  playersHint: (n: number): string =>
    n <= 2
      ? 'Rúnaszövő és Múltidéző.'
      : n === 3
        ? 'Rúnaszövő, Múltidéző és Rítushívó.'
        : 'Mind a négy: Rúnaszövő, Múltidéző, Rítushívó, Asztromanta.',
  launchRoom: 'Szoba nyitása',
  joinHeading: 'Csatlakozás egy szobához',
  joinIntro:
    'Ha valaki már nyitott szobát, írd be a kódját. A kód magában hordozza a magot, a hosszt és a létszámot — ezért mindenki bitre ugyanazt a galaxist kapja, mielőtt bárki bármit átküldene.',
  roomCode: 'Szobakód',
  joinRoom: 'Belépek',
  joinBadCode: 'Ez nem érvényes kód — nézd meg még egyszer.',
  roomsKnown: 'Szobák, amiket ez a böngésző ismer',
  roomRowMeta: (players: number, week: number): string =>
    week > 0 ? `${players} fő · ${week}. hét` : `${players} fő · még el sem indult`,
  roomRejoin: 'Vissza ide',

  // --------------------------------------------------------------- the lobby
  lobbyHeading: 'A szoba',
  lobbyIntro:
    'Mondd be a kódot a többieknek. Amíg nem ül mindenki a helyén, az expedíció nem indul el.',
  seatsHeading: 'Székek',
  seatsFree: (n: number): string => (n === 0 ? 'mindenki a helyén' : `${n} szabad hely`),
  seatEmpty: 'szabad',
  seatUnnamed: 'névtelen',
  seatYou: 'te',
  seatSit: 'Ide ülök',
  seatStand: 'Felállok',
  seatFree: 'Felszabadítom',
  seatTaken: 'foglalt',
  seatNoneYours: 'Még nem ülsz sehol. Válassz egy széket — a hősödet csak onnan tudod mozgatni.',
  yourName: 'A neved',
  yourNamePlaceholder: 'ahogy a többiek látnak',
  playerKeyHeading: 'A játékoskulcsod',
  playerKeyIntro:
    'Ez tesz vissza a saját székedbe, bármelyik gépről. A böngésző megjegyzi, de ha kitörlöd az adatokat, csak ez marad — írd fel valahova. (Ha elveszne: a házigazda fel tudja szabadítani a székedet, és újra beülhetsz.)',
  playerKeyShow: 'Megmutat',
  playerKeyHide: 'Elrejt',
  copy: 'Másolás',
  copied: 'Kimásolva',
  lobbyBegin: 'Indulás a Kapun',
  lobbyWaiting: 'Várunk a többiekre…',
  lobbyGuestWait: 'A házigazda indítja el, ha mindenki a helyén van.',
  lobbyLeave: 'Kilépés a szobából',
  netOff: 'nincs kapcsolat',
  netOpening: 'kapcsolódás…',
  netHosting: (peers: number) => `te vagy a házigazda · ${peers} csatlakozott`,
  netJoined: 'csatlakozva',
  netLost: 'megszakadt a kapcsolat',
  netRetrying: 'újrapróbálkozás…',
  netGaveUp: 'nem sikerült kapcsolódni',
  /**
   * Az egyetlen hibaüzenet, ami tényleg számít.
   *
   * A böngésző konzoljában ilyenkor több száz „WebSocket connection failed" áll,
   * a felületen viszont eddig annyi volt, hogy „megszakadt a kapcsolat" — amiből
   * senki nem tudja kitalálni, hogy nem a másik játékossal van baj, hanem azzal a
   * szerverrel, ami összeismerteti a két gépet.
   */
  netBrokerDown: (host: string): string =>
    `Nem érjük el a jelzőszervert (${host}). Ez az a szolgáltatás, ami összeismerteti ` +
    'a két gépet — játékadat nem megy át rajta. Ha a többieknek megy, akkor nálad blokkolja ' +
    'valami: reklámblokkoló vagy adatvédelmi kiegészítő, DNS-szűrő, céges/iskolai tűzfal, ' +
    'VPN vagy víruskereső. Próbáld ki: nyisd meg ezt a címet egy új fülön — ha nem ad vissza ' +
    'egy hosszú azonosítót, akkor nem a játékkal van baj.',
  netBrokerTest: 'Kapcsolat ellenőrzése',
  netBrokerTesting: 'mérés folyamatban…',
  netProbeHttp: 'Sima HTTPS-kérés a szerverhez',
  netProbeWs: 'WebSocket — a játéknak EZ kell',
  netProbeOk: 'átmegy',
  netProbeFail: 'nem megy át',
  /**
   * A négy lehetséges eredmény, mert mind a négy mást jelent, és mind a négyhez
   * más a teendő. Az előző verzió csak a HTTPS-t nézte, és tiszta lapot adott
   * olyanoknak, akiknek a socketjét ölte meg valami.
   */
  netProbeVerdictOk:
    'A jelzőszerver elérhető, a WebSocket is nyílik. Ha a játék mégsem kapcsolódik, az már ' +
    'nem a szerver: próbáld újratölteni az oldalt.',
  netProbeVerdictWs:
    'Itt a hiba: a sima HTTPS átmegy, a WebSocket viszont nem. Ez majdnem mindig valami helyi ' +
    'dolog, ami belenéz a titkosított forgalomba, és nem érti a WebSocket-átkapcsolást: ' +
    'víruskereső HTTPS-vizsgálata (Kaspersky, ESET, Avast, Bitdefender), céges vagy iskolai ' +
    'proxy, VPN, vagy egy böngészőkiegészítő (uBlock, AdGuard, Brave pajzs) — a peerjs.com több ' +
    'szűrőlistán rajta van. Próbáld ki inkognitóban, kiegészítők nélkül; ha ott megy, az egyik ' +
    'kiegészítő a bűnös. Ha a víruskereső a ludas, a HTTPS-vizsgálatból ki lehet venni ezt a ' +
    'címet. Ha egyik sem oldható meg, írjatok be másik jelzőszervert.',
  netProbeVerdictAll:
    'A szerver egyáltalán nem érhető el innen — se HTTPS, se WebSocket. A leggyakoribb ok, hogy ' +
    'a jelzőszerver ÁTMENETILEG KITILTOTT titeket, mert túl sok kapcsolódás jött erről az ' +
    'internetkapcsolatról (a böngészőben ilyenkor „Error 1015 — You are being rate limited" ' +
    'látszik). Ez magától elmúlik, jellemzően fél–egy óra alatt: addig egyszerűen ne próbálkozzatok, ' +
    'mert minden újabb kísérlet meghosszabbítja. Ha nem ez, akkor DNS-szűrés, tűzfal vagy ' +
    'hálózati blokk — érdemes másik hálózatról (pl. mobilnetről) kipróbálni, vagy másik ' +
    'jelzőszervert beírni.',
  netCooldownHeading: 'Most pihentetjük a kapcsolatot',
  netCooldown: (minutes: number): string =>
    `A jelzőszerver kitiltotta ezt az internetkapcsolatot, mert túl sok kérés ment rá ` +
    `(Cloudflare „Error 1015"). Ez magától elmúlik — a játék ${minutes} percig nem is próbálkozik, ` +
    'mert minden újabb kopogtatás meghosszabbítaná a tiltást. Addig lehet egy gépen játszani, ' +
    'vagy be lehet írni másik jelzőszervert.',
  netCooldownSkip: 'Mégis próbáljuk most',
  netProbeVerdictOdd:
    'A WebSocket nyílik, a HTTPS-kérés viszont nem — ez szokatlan. Valószínűleg egy kiegészítő ' +
    'szűri a kéréseket. A játék ettől még működhet.',
  netBrokerHeading: 'Jelzőszerver',
  netBrokerIntro:
    'Alapból a PeerJS ingyenes szervere. Ha valakinél a hálózat blokkolja, itt átírhatjátok ' +
    'egy másikra — de MINDENKINEK ugyanazt kell beírnia az asztalnál. Saját szervert egy ' +
    'paranccsal lehet indítani: npx peerjs --port 9000',
  netBrokerPlaceholder: 'alapértelmezett (0.peerjs.com)',
  netBrokerReset: 'Vissza az alapértelmezettre',
  netBrokerInsecure:
    'Ez a cím http://, a játék viszont https-en fut — a böngésző az ilyen kapcsolatot letiltja. ' +
    'Vagy https-es szerver kell, vagy a játékot is http-n kell megnyitni.',
  netBrokerSaved: 'Elmentve. Töltsd újra az oldalt, hogy érvénybe lépjen.',
  netPlayLocally: 'Játsszunk egy gépen',
  netPlayLocallyHint:
    'Ha a hálózat nem jön össze, ne bukjon el az este: a szobakód magában hordozza a magot, ' +
    'tehát ugyanez a galaxis megnyílik egy gépen, felváltva. Aki előtt a gép van, az nyom, ' +
    'a többiek mondják.',
  notYourHero: 'Ez nem a te hősöd — az ő gépén kell lépni vele.',
  notYourTurn: (who: string) => `Most ${who} lép — az ő gépén kell megnyomni.`,
  // ------------------------------------------------------ the split task
  proposalHeading: 'Kérdés az asztalnak',
  proposalAsked: (who: string, what: string) =>
    `${who} ezt kérdezi: ${what}. Ehhez még valakinek rá kell bólintania — utána nincs visszaút.`,
  proposalAgree: 'Rábólintok',
  proposalRefuse: 'Ne most',
  proposalWithdraw: 'Visszavonom',
  watchHeading: 'A heti őrséged — mivel telik el a heted',
  watchIntro:
    'Minden héten egy döntés, ami csak a tiéd: mivel telik el a heted a hajón. A hét végén lefut, ' +
    'aztán újra kérdez. Aki nem ad ki őrséget, az nem csinál semmit — nincs érte büntetés, csak ' +
    'kimarad belőle.',
  watchSetLabel: 'kiadva',
  watchUnset: 'még nincs kiadva',
  watchPending: (n: number): string =>
    n === 0 ? 'Mindenki kiadta a heti őrségét.' : `${n} hősnek még nincs kiadva a heti őrsége.`,
  siteNow: (what: string) => `A helyszín: ${what} — a kör végén`,
  siteIn: (what: string, rounds: number) => `A helyszín: ${what} — ${rounds} kör múlva`,
  focusHint:
    'Ha ugyanabban a körben már megsebezte valaki ezt az ellenfelet, a te találatod +1-et sebez. A rácson kiírt szám ezt már tartalmazza.',
  taskHeading: 'Zárósor — egy zár, amit egyedül senki nem tud kinyitni',
  taskSeat: (slot: number) => `${slot}. szék`,
  taskYours: 'a tiéd',
  taskTheirs: 'az övé',
  taskNotYours: (who: string) => `Ezt ${who} tudja megnyomni — szólj neki.`,
  taskNoClues: 'Neked most nem jutott leírás — a te dolgod a rúnáidat megnyomni, amikor a többiek mondják.',
  taskHidden: (n: number): string =>
    n === 1 ? '1 leírás, amit csak ő lát' : `${n} leírás, amit csak ő lát`,
  taskStrikes: (used: number, max: number) => `Hibák: ${used} / ${max}`,
  taskSolved: 'A zárósor kinyílt.',
  taskFailed: 'A zárósor bezárult. Nem nyílik többet.',
  // --------------------------------------------------- the ship's own weeks
  aboardHeading: 'A hajón',
  aboardOwner: (who: string) => `${who} dolga eldönteni`,
  aboardAnybody: 'Bárki eldöntheti',
  aboardSubject: (name: string) => `róla van szó: ${name}`,
  crewLoyalty: (band: string, value: number) => `${band} (hűség ${value}/10)`,
  debtsHeading: 'Ami még jön',
  debtsMeta: (n: number): string => (n === 1 ? '1 dolog' : `${n} dolog`),
  debtsIntro:
    'Amit korábban eldöntöttetek, és még nem ért ide. Ezek maguktól megtörténnek — nem kell velük semmit tenni, csak tudni róluk.',
  debtIn: (weeks: number): string => (weeks <= 0 ? 'ezen a héten' : `${weeks} hét múlva`),
} as const

/**
 * The English catalogue must have exactly the same keys as the Hungarian one —
 * that is what guarantees no string is left untranslated. The literal types from
 * `as const` are widened here, otherwise every English entry would fail to match
 * the Hungarian *value*. Functions keep their signature, so a mismatch in the
 * number of interpolated arguments is still a compile error.
 */
type Widen<T> = T extends string ? string : T
type Catalog = { [K in keyof typeof HU]: Widen<(typeof HU)[K]> }

const EN: Catalog = {
  // ------------------------------------------------------------------ shell
  appTitle: 'Stargrave',
  appSubtitle: 'a co-operative expedition for one to four',
  language: 'Language',
  helpTitle: 'Help and rules (F1)',
  soundTitle: 'Turn sound on or off',
  soundOn: 'Sound: on',
  soundOff: 'Sound: off',
  back: 'Back',
  close: 'Close',
  helpSearchPlaceholder: 'Search the rules…',
  helpSearchDrawn: (n: number) =>
    `${n} matches on this tab. It is drawn from code, so nothing is highlighted here — look in the text beside the shapes.`,
  helpSearchHits: (n: number) => `${n} matches`,
  helpSearchNone: 'No matches',
  helpSearchElsewhere: 'Nothing on this tab — the numbers on the others show where it is.',
  dialsTitle: 'Difficulty',
  dialsHeading: 'Difficulty — by dials',
  dialsIntro:
    'Not one number but several small dials: each one sets one of the pressures the game applies, in five steps. Three is the game as designed, everywhere. Under each dial is what its current step means in play.',
  dialsSavePreset: 'Save as preset',
  dialsLoadPreset: 'Load saved preset',
  dialsReset: 'Back to as designed',
  dialScopeLanding: 'from the next landing',
  dialScopeWeek: 'from the next week',
  dialScopeExpedition: 'from the next expedition',
  undo: 'Undo',
  wipeTitle: 'Delete everything and start over',
  wipeHeading: 'Delete everything?',
  wipeText: 'This does not end an expedition. It throws away the whole game so far:',
  wipeItemExpedition: 'the running expedition, at once — it does not reach the Archive',
  wipeItemArchive: 'the Archive: points, unlocks, endings, the long memory',
  wipeItemSave: 'the save stored in this browser',
  wipeItemRooms: 'every room this browser knows — and your player key with them',
  wipeHint: 'There is no undo. If you want to keep it, export the save from the Archive screen first.',
  wipeConfirm: 'Delete and start over',
  bondActive: '⇄ Bond: +1 damage',
  handHide: 'Fold the hand away',
  handShow: 'Show the hand',
  handToggleHint: 'Folding the card panel away makes the battlefield bigger. Open it again to play.',
  projectionHint:
    'How much this changes at the end of the week, if the power allocation and the postings stay as they are.',
  bondHint:
    'An ally is within 2 tiles, so both of you hit for one more. That is why an "Attack 3" sometimes takes off 4.',
  endingsHeading: 'Endings',
  endingsProgress: (seen: number, total: number) =>
    `${seen} of ${total} found. The goal is not to survive but to see all five — and then what follows from them.`,
  endingsDone: 'All of them, and the answer too. This is the end of the game — the Archive is finished.',
  endingUnseen: 'Not seen yet',
  endingsEarnedHeading: 'Endings you earn',
  endingsEarnedIntro:
    'These are not opened by the understanding number but by what the expedition did. Their names ' +
    'and their conditions are here — their words only when you are standing in front of them.',
  endingNeed: (tier: number) =>
    tier === 0 ? 'needs no understanding' : `needs understanding tier ${tier}`,
  endingLastQuestion: 'The last question — to be asked at the Stargrave',
  accountCosts: 'What it asks',
  accountEffects: 'What it gives',
  accountNothing: 'No price and no gain — only the decision.',
  encounterBack: 'Back',
  heartConfirm: 'This is our answer',
  heartFinal: 'This is the last decision of the expedition. There is no way back from it.',
  marketConfirm: (price: number) => `Buy it — ${price} ✧`,
  summaryWeek: 'End of the week',
  summaryMission: 'Mission accounted for',
  summaryEncounter: 'What the decision cost',
  summaryMarket: 'Trading done',
  summaryWeeksPassed: (weeks: number) => `${weeks} ${weeks === 1 ? 'week' : 'weeks'} passed`,
  summaryGateLeft: (weeks: number) => `The Gate closes in ${weeks} weeks`,
  summaryClose: 'Right',
  undoTitle: 'Take back the last move in this battle (Ctrl+Z)',
  rescueStuck: 'Stuck?',
  rescueIntro:
    'If the ground cannot be crossed — an enemy that cannot be reached, say — or the battle has wedged, here is the way out. The objective, the difficulty and what you are fighting stay the same in all three cases.',
  rescueChoose: 'This one',
  rescueConfirm: 'Yes, do it',
  landingDifficultyLabel: 'Landing difficulty:',
  landingGentle: 'Gentle',
  landingNormal: 'Normal',
  landingHard: 'Hard',
  landingGentleHint:
    'Missions one level easier and 30% fewer enemies. The ship\u2019s own pressures — the Gate, food, morale — are untouched.',
  landingNormalHint: 'As designed: difficulty comes from map depth and the Darkening.',
  landingHardHint: 'Missions one level harder and 30% more enemies. The ship\u2019s pressures are untouched.',
  rescueWin: 'Book it as completed',
  rescueWinText:
    'The battle ends as a victory: the mission pays out in full, and on a relic run every relic counts as carried. The best case, without the fight.',
  rescueLose: 'Give it up, at full cost',
  rescueLoseText:
    'The battle ends as a defeat, at full cost: the party falls (everyone comes home at 1 hit point), a week goes, morale −2, and a crew member dies. In a boarding action the hull takes damage too. The worst case, without the fight.',
  rescueSkip: 'Skip the landing',
  rescueSkipText:
    'No reward and no loss: the site closes and the party comes home. For when you only want it over with.',
  rescueEdit: 'Edit the ground',
  rescueEditText:
    'Rearranging the terrain by hand: click a tile and it becomes whatever the palette is holding. The battle waits, and every change can be taken back (Ctrl+Z).',
  paletteLabel: 'Ground:',
  paletteHint: 'Click a tile. Nothing solid can go on a unit, a relic or the exit.',
  paletteDone: 'Done',
  rescueRestart: 'Restart the battle',
  rescueRestartText: 'The same site, from the beginning. The heroes stand as they did on landing.',
  rescueReroll: 'Redeal the battlefield',
  rescueRerollText: 'A new site for the same task: same objective, difficulty and enemies, different ground.',
  rescueWithdraw: 'Back to before the landing',
  rescueWithdrawText: 'Out to the star map. The node is left untouched and can be landed on again later.',
  cancel: 'Cancel',
  confirm: 'All right',

  // --------------------------------------------------------- title / archive
  titleTagline: 'A galaxy that did not die in a war. Something finished it.',
  newExpedition: 'New expedition',
  continueExpedition: 'Continue',
  expeditionLength: 'Length',
  lengthShort: 'Short',
  lengthMedium: 'Medium',
  lengthLong: 'Long',
  lengthShortText: '8 systems, 20 weeks. One long evening.',
  lengthMediumText: '10 systems, 28 weeks. The default.',
  lengthLongText: '13 systems, 40 weeks. More evenings, more understanding.',
  launch: 'Set out',
  archiveHeading: 'The Archive',
  archiveIntro:
    'Every expedition — even a failed one — sends its data home through the Gate. It unlocks content, not power: the world grows richer rather than easier.',
  archivePoints: 'Archive points',
  expeditionsRun: 'Expeditions',
  bestUnderstanding: 'Best understanding',
  unlockHeading: 'Available',
  unlockBuy: 'Unlock',
  unlockOwned: 'Unlocked',
  unlockCost: 'Cost',
  historyHeading: 'Earlier expeditions',
  historyWeek: 'weeks',
  exportSave: 'Save to file',
  importSave: 'Load a save',
  importFailed: 'That file is not a readable save.',
  deleteSave: 'Delete save',
  deleteSaveConfirm: 'Delete the save for good? This cannot be undone.',
  seed: 'Seed',
  seedHint: 'The same seed gives the same expedition. A finished run’s seed is in the history below, one click away.',
  seedReuse: (seed: number) => `Put seed ${seed} in the field`,

  // ------------------------------------------------------------------- ship
  shipHeading: 'The ship',
  week: 'Week',
  gateLeft: 'The Gate closes in',
  gateWeeks: (n: number) => `${n} weeks`,
  darkening: 'Darkening',
  darkeningLevel: (n: number) => `level ${n}`,
  reactor: 'Reactor',
  powerAllocated: 'Allocated',
  powerFree: 'Free',
  powerHeading: 'Power allocation',
  powerIntro: (units: number, free: number) =>
    `The reactor gives ${units} units this week, and seven systems want them — ` +
    `never enough for everything. Every unit has to go somewhere: ` +
    `${free > 0 ? `${free} still unassigned, and while it sits there it does nothing` : 'all of them are assigned right now'}. ` +
    'What you do not use cannot be saved: next week’s allocation is decided again. ' +
    'This is a shared decision — the strongest cooperative element in the game.',
  stationsHeading: 'Stations',
  stationsIntro:
    'A station only works if it has power AND has crew standing on it. That double constraint is where the scarcity lives.',
  stationEmpty: 'Nobody posted',
  stationNoPower: 'No power',
  stationRunning: 'Running',
  crewHeading: 'Crew',
  crewSpeciality: 'Speciality',
  crewTraits: 'Traits',
  crewHome: (stations: string) =>
    `At home on: ${stations} — anywhere else they only keep the station alive`,
  crewUnassigned: 'Unposted',
  crewWeeks: (n: number) => `week ${n} aboard`,
  crewLostLabel: 'Lost',
  assignTo: 'Post to',
  unassign: 'Stand down',
  endWeek: 'End the week',
  endWeekBlocked: 'Finish what is in progress first.',
  fluxPreview: (n: number) => `The landing party will start with ${n} Flux.`,
  fluxPreviewHint:
    'Whatever you give the rune core becomes the Flux. That is what ties the ship to the landing.',
  logHeading: 'Log',
  understanding: 'Understanding',
  understandingHint:
    'Understanding grants no combat advantage. It still decides what you can do in the heart of the galaxy.',
  tier0: 'We understand nothing',
  tier1: 'We are beginning to read',
  tier2: 'We can see what is happening',
  tier3: 'We understand why',
  tierName: (tier: number): string =>
    tier >= 3
      ? 'we understand why'
      : tier === 2
        ? 'we can see what is happening'
        : tier === 1
          ? 'we are starting to see it'
          : 'we understand nothing yet',
  darkeningHint:
    'The galaxy cooling. As the weeks pass it steps up, and every step does the same two things: ' +
    'the reactor gives less power, and what you meet on the ground is stronger. It cannot be ' +
    'stopped, only worked ahead of.',

  // --------------------------------------------------------------- research
  researchHeading: 'Research',
  researchIntro:
    'One pool of Information, two branches. Technology makes a stronger ship. Understanding gives you nothing — except the endgame.',
  branchTechnology: 'Technology',
  branchUnderstanding: 'Understanding',
  researchActive: 'In progress',
  researchWeeksLeft: (n: number) => `${n} weeks`,
  researchStart: 'Begin',
  researchDone: 'Done',
  researchNeeds: 'Needs first:',
  researchLocked: 'Prerequisite missing',
  researchTooExpensive: 'Not enough Information',
  researchNone: 'No project running.',
  modulesHeading: 'Installed modules',
  modulesNone: 'None yet.',

  // --------------------------------------------------------------- star map
  starMapHeading: 'Star map',
  starMapIntro:
    'Roads leading on. Whichever you pick costs weeks — and the Gate is counting.',
  enginesColdWarning:
    'The engines have no power: no course can be set like this. Give them at least one unit on the Ship screen.',
  setCourse: 'Set course',
  travellingTo: (node: string, weeks: number) => `Under way: ${node} — ${weeks} weeks`,
  currentPosition: 'We are here',
  unknownSystem: 'Unknown',
  nodeEmpty: 'Empty space',
  nodeRuins: 'Ruins',
  nodeStation: 'Station',
  nodeAnomaly: 'Anomaly',
  nodeWorld: 'Inhabited world',
  nodeTrade: 'Trading post',
  nodeDistress: 'Distress call',
  nodeHeart: 'The heart of the galaxy',

  nodeRuinsText:
    'The most common node, and more common towards the far end of the map. Roughly every second ruin is a landing (45%), every fourth a puzzle (25%), otherwise a written situation. This is the predictable source of credits.',
  nodeAnomalyText:
    'Something that does not behave. Almost half are puzzles (45%), the rest encounters — and at an anomaly the encounters are the riskier kind. There are more of them the deeper you go.',
  nodeWorldText:
    'Where people live. Always a written situation: this is where crew can be found and where the hard decisions have to be made. Common near the Gate, gone by the heart of the galaxy.',
  nodeStationText:
    'A facility still running. Two in five turn out to be a market (40%), otherwise an encounter. Many at the start of the map, almost none at the end.',
  nodeTradeText:
    'Always a market: two to four offers of supplies, a module or a crew member for hire. The only node whose content you know in advance.',
  nodeDistressText:
    'Somebody is asking for help. Always an encounter, and always a decision: helping costs weeks and hull, passing by costs morale. Equally common across the whole map.',
  nodeEmptyText:
    'There is nothing here — only the week it costs. Not a flaw in the map: the deeper columns hold more empty space, and that is the pressure itself.',
  nodeHeartText:
    'The heart of the galaxy, the Stargrave. The end of the road. What you can do there is decided by your understanding, not your equipment.',

  engageMission: 'Land',
  engagePuzzle: 'Examine it',
  engageEncounter: 'Go closer',
  engageMarket: 'Dock',
  nodeResolved: 'Done',
  nodeNothing: 'There is nothing here.',

  // -------------------------------------------------------------- encounter
  encounterHeading: 'Encounter',
  encounterRequirementUnmet: 'The condition for this is not met.',
  encounterUnaffordable: 'Not enough resources for this.',
  encounterPayCards: (count: number) =>
    `Choose ${count} cards. They are lost forever — they will be missing on the next landing.`,
  encounterPaySelected: (a: number, b: number) => `Chosen: ${a} / ${b}`,
  encounterConfirm: 'So be it',
  encounterContinue: 'Continue',
  costWeeks: (n: number) => `${n} weeks`,
  costCards: (n: number) => `${n} cards`,

  // ----------------------------------------------------------------- market
  marketHeading: 'Trade',
  marketBuy: 'Buy',
  marketBought: 'Bought',
  marketTooExpensive: 'Not enough credits',
  marketEmpty: 'No offers left.',
  marketCrew: 'Crew member',
  marketRelic: 'Relic',
  marketSellHeading: 'What you can sell',
  marketSellHint:
    'Only a few can be attuned at once; the rest sit in the hold. The post will take them — but ' +
    'think first: three relics open an ending of their own at the Stargrave.',
  marketSell: 'Sell',
  marketSellConfirm: (price: number) => `Sell it — ${price} ✧`,
  marketSellNone: 'Every relic is being worn. They have to come off first.',

  // ---------------------------------------------------------------- mission
  missionHeading: 'Mission',
  missionBriefing: 'Objective',
  missionLaunch: 'Go',
  missionFinish: 'Report to the ship',
  objectiveEliminate: 'Every enemy has to be defeated.',
  objectiveReachExit: 'EVERY hero has to reach the extraction point (on it or beside it).',
  atExitCount: (there: number, total: number) => `${there}/${total} at the exit`,
  objectiveCollect: (n: number) =>
    `Collect ${n} relics, then EVERYBODY out through the extraction point.`,
  objectiveSurvive: (n: number) => `Hold out for ${n} rounds. Reinforcements keep coming.`,
  objectiveHold: (n: number) => `Hold the marked point at the end of round ${n}.`,
  objectiveLabel: 'Objective',
  relicsCarried: (a: number, b: number) => `Relics: ${a} / ${b}`,
  roundLimitLeft: (n: number) => `Rounds left: ${n}`,
  exitMarker: 'Extraction point',
  collapsingWarning: (n: number) => `${n} tiles are groaning`,

  // ---------------------------------------------------------------- puzzles
  puzzleHeading: 'Puzzle',
  puzzleSolved: 'Solved',
  puzzleFailed: 'Failed',
  puzzleSubmit: 'Submit',
  puzzleReset: 'Restart',
  puzzleUndo: 'Undo',
  puzzleAttemptsLeft: (n: number) => `Attempts left: ${n}`,
  puzzleNoGuessing:
    'Every puzzle is derivable by logic. No guessing is required, and there is no linguistic content in any of them.',
  runeDecodeName: 'Rune decoding',
  runeDecodeHelp:
    'Work out the rune sequence. Click a slot for the next rune (right-click for the previous one), then Submit. You then get two numbers: how many runes were in the right place, and how many appear in the sequence but somewhere else. It does NOT tell you which — only how many.',
  runeExact: 'in place',
  runePartial: 'elsewhere',
  runeScoreHint:
    'The two numbers are counts, not positions: they say HOW MANY runes are right, not which ones. Anything that is not in the sequence at all shows up in neither number.',
  balanceScalesName: 'Balance scales',
  balanceScalesHelp:
    'The relics’ weights are hidden. Weigh while you can, then give the order from lightest to heaviest.',
  scaleWeigh: 'Weigh',
  scaleClear: 'Clear the pans',
  scaleLeft: 'Left',
  scaleRight: 'Right',
  scaleWeighingsLeft: (n: number) => `Weighings left: ${n}`,
  scaleOrderHeading: 'Order from lightest',
  scaleOrderClear: 'Clear the order',
  glyphsName: 'Glyph reading',
  glyphsHelp:
    'Every stroke means one concept. Deduce which is which from the examples, then say what the query glyph means.',
  glyphsExamples: 'Examples',
  glyphsQuery: 'What does this glyph mean?',
  safeGroundName: 'Safe ground',
  safeGroundHelp:
    'The numbers show how many neighbouring tiles will give way. Mark every tile that will.',
  powerRoutingName: 'Power routing',
  powerRoutingHelp:
    'Rotate the conduits until the reactor reaches every terminal. Two tiles connect only when both point at each other.',
  powerRoutingReactor: 'Reactor',
  powerRoutingTerminal: 'Terminal',
  refractionName: 'Refraction',
  refractionHelp:
    'Turn the mirrors so the rune-light reaches every focus. Click a mirror to flip it.',
  refractionFocus: 'Focus',
  starChartName: 'Star chart fitting',
  starChartHelp:
    'Fit the fragments so the edge codes match at every seam. Left click to place, right click to rotate.',
  starChartTray: 'Fragments',
  starChartRotate: 'Rotate',
  resonanceName: 'Resonance tuning',
  resonanceHelp:
    'Every tap advances one dial and its four orthogonal neighbours. Bring them all to zero.',
  resonanceTaps: (n: number) => `Taps: ${n}`,
  gravityCoresName: 'Gravity cores',
  gravityCoresHelp:
    'Push the cores onto the marked tiles. You can only push, never pull — use the arrows or click a tile.',
  gravityCoresMoves: (n: number) => `Moves: ${n}`,

  // ------------------------------------------------------------------ heart
  heartHeading: 'The Stargrave',
  heartIntro:
    'Here is the heart of the galaxy. What you can do is not decided by your weapons but by how much you understood.',
  heartUnderstanding: (n: number) => `Understanding: ${n}`,
  heartChoose: 'This is what we do',
  heartLocked: 'You do not understand enough for this.',

  // ------------------------------------------------------------------- over
  overVictory: 'The expedition has ended',
  overLost: 'The expedition is lost',
  overArchiveEarned: (n: number) => `The Archive gained ${n} points.`,
  overUnderstanding: (n: number) => `Understanding at the end: ${n}`,
  overWeeks: (n: number) => `${n} weeks`,
  overReturn: 'Back to the Archive',
  abandonExpedition: 'Call off the expedition',
  abandonConfirm: 'Call it off? What you have goes into the Archive.',

  // ------------------------------------------------------ battle (tactical)
  round: 'Round',
  fluxShared: 'Flux (shared)',
  phase: 'Phase',
  phaseCardSelection: 'Card selection',
  phaseResolution: 'Resolution',
  phaseOver: 'Over',
  difficulty: 'Difficulty',
  difficultyEasy: 'Easy',
  difficultyNormal: 'Normal',
  difficultyHard: 'Hard',
  newBattle: 'New battle',
  initiative: 'Initiative',
  yourTeam: 'Your team',
  followersHeading: 'Who came down',
  followerFallen: 'Fallen. Not aboard the ship any more either.',
  takeFollowers: 'Who comes down?',
  takeFollowersHint:
    'Only a trained mentee can come — and whoever falls down there comes off the crew list too.',
  followerNobody: 'You have no trained mentee to bring.',
  bondTogether: 'on the same station now',
  ashoreHeading: 'Are you going down?',
  ashoreMeta: (n: number): string => `${n} heroes land`,
  ashoreIntro:
    'Not everybody has to go down. Whoever stays runs the ship during the fight: one support action a round, out of the hold. Down there you will be one fewer.',
  ashoreStaying: 'Staying aboard ✓',
  ashoreGoing: 'Stay aboard',
  ashoreLocked: 'Somebody has to land — at least two always go down.',
  supportHeading: 'From the ship',
  supportSpent: 'already spent this round',
  pledgeHeading: 'Your word',
  pledgeMeta: 'one at a time, for the whole table',
  pledgeIntro:
    'Say something out loud, with a deadline. The game writes it down and holds you to it — keep it and the marks are yours.',
  pledgeBy: (name: string, weeks: number): string => `the ${name}’s word · ${weeks} weeks`,
  prospectsHeading: 'How this can end',
  prospectsIntro:
    'This is what the understanding is for. Whatever is shut says what it is waiting on — and if you stay quiet, the top two are what is left.',
  prospectOpen: 'open',
  understandingTierLine: (tier: number): string => `tier ${tier}`,
  attentionCostLine: 'every 2 understanding is +1 attention',
  figuresHeading: 'People you have met',
  figuresMeta: 'they remember you',
  figureWarm: 'on good terms',
  figureCold: 'holds it against you',
  readingYours: 'your reading',
  readingTheirs: 'their reading',
  readingIntro:
    'Nobody else at the table can see this. It is not a secret — it is your job to say it.',
  readingClosed: (name: string, count: number): string =>
    `They can see ${count} things you cannot. Ask the ${name}.`,
  followerTake: 'Bring them',
  followerComing: 'Coming ✓',
  followerNeedsRank: 'Only a trained mentee can come down. Give them a few more weeks at a station.',
  enemy: 'Enemies',
  noEnemiesLeft: 'No enemies left.',
  noIntentYet: 'It has not revealed its intent yet.',
  playerLabel: (n: number) => `Player ${n}`,
  inHand: 'In hand',
  inDiscard: 'Discarded',
  lostForever: 'Lost forever',
  statusExhausted: 'Exhausted — carried out of the battle',
  statusFallen: 'Fallen',
  chooseTwoCards:
    'Choose **two cards**, then mark which one provides the **initiative** — that decides where you act among the enemies.',
  initiativeLabel: 'Initiative:',
  ready: 'Ready',
  restInstead: 'Rest instead',
  mustRestNow: 'You do not have enough cards in hand, so you must rest.',
  restLoseWarning: (name: string) =>
    `"${name}" is LOST for the rest of the expedition. Your other spent cards come back, and you heal 2.`,
  restConfirm: 'Rest, and lose that one',
  restExplain: 'Rest: you take your discarded cards back and heal 2.',
  restPickCard: '**One card is lost forever, though — choose which one.**',
  nothingToRecover: 'You have no discarded cards to bring back.',
  enemyUpNext: (name: string) => `${name} is up next`,
  initiativeShort: (n: number) => `initiative ${n}`,
  noIntent: 'It has no intent.',
  next: 'Continue',
  whichTopHalf:
    "Which card's **top** half do you use? The other card's **bottom** half will run.",
  pickHalfToPlay:
    'Click the card half you want to resolve. The order is yours — do you move first, or strike first?',
  bothHalvesDone: 'Both halves have resolved. Close out the turn.',
  clickOnGrid: 'click on the grid.',
  endTurn: 'End turn',
  skipTop: 'Skip top half',
  skipBottom: 'Skip bottom half',
  promptAttackTarget: (power: number, range: number) =>
    `Choose a target (attack ${power}, range ${range})`,
  promptAreaCentre: (power: number, radius: number) =>
    `Choose a centre (area ${power}, radius ${radius})`,
  promptMoveDestination: (distance: number) => `Where do you go? (move ${distance})`,
  promptStatusTarget: (range: number) => `Who gets it? (range ${range})`,
  promptPillarTile: 'Where do you raise the pillar?',
  promptTrapTile: 'Where do you place the trap?',
  promptRecoverCard: 'Which card do you take back into your hand?',
  promptEchoCard: 'Which discarded card do you replay the top half of?',
  cardTop: 'Top',
  cardBottom: 'Bottom',
  cardLostHint: 'The card is lost forever',
  victoryTitle: 'The site is yours',
  defeatTitle: 'Withdrawal',
  victoryText: (rounds: number) => `You completed the objective in ${rounds} rounds.`,
  defeatText:
    'The party had to be pulled back to the ship. The mission failed — but the expedition goes on.',

  // ------------------------------------------------------------------- help
  helpHeading: 'Help and rules',
  helpClose: 'Close',
  helpElementsTab: 'Game pieces',
  helpFooter: "The rules text comes from the project's",
  helpFooterTail: 'file — edit it there. Close:',
  helpMissingSection: 'This section was not found in the rules file.',
  helpLiveNote:
    'These shapes and colours are drawn by the same code as the grid — what you see here is exactly what is on the battlefield.',
  helpHeroes: 'Your heroes',
  helpEnemies: 'Enemies',
  helpNodes: 'Nodes on the star map',
  helpTerrain: 'Terrain',
  helpMarkers: 'Mission markers',
  markerInstallation: 'Ship module',
  markerInstallationText:
    'Only on the board when the ship is boarded: those are your own modules standing there. At the end of every round each takes a point for every enemy beside it — defending one is a matter of clearing the tile next to it, not of attacking it. Whatever is destroyed is gone for the REST OF THE EXPEDITION, even if you win the battle. How many are put at risk is a difficulty dial (zero included).',
  markerRelic: 'Relic',
  markerRelicText:
    'Picked up by stepping on it, then carried. On "collect the relics" missions this is what you ' +
    'came down for, and you have to leave through the extraction point with them. What you leave ' +
    'behind stays down there.',
  markerExit: 'Extraction point',
  markerExitText:
    'The way out. Where the objective is to reach a point, standing on it is enough; where it is to ' +
    'hold a point, you have to be on it at the named round. On a relic run this is where you leave.',
  markerCollapsing: 'Failing floor',
  markerCollapsingText:
    'The number is how many rounds until it gives way. After that it is a chasm: impassable, and it ' +
    'does not come back. Whoever stands on it when it goes takes damage and is thrown to a ' +
    'neighbouring tile.',
  helpBadges: 'Badges on the grid',
  helpStatuses: 'Status effects',
  helpHp: 'hit points',
  helpShieldCapNote:
    'Statuses with a number count down by 1 at the end of the round. Shield is the exception: it is not tied to time but wears down as it is used.',
  terrainFloor: 'Floor',
  terrainAsh: 'Ash',
  terrainWall: 'Wall',
  terrainChasm: 'Chasm',
  terrainPillar: 'Rune pillar',
  terrainTrap: 'Trap',
  terrainFloorText: 'Freely walkable. The grid line is visible on this tile.',
  terrainAshText: 'Walkable, but entering costs 2 movement — for enemies too.',
  terrainWallText: 'Not walkable, and it blocks sight. No grid line on it.',
  terrainChasmText: 'Not walkable, but you can see and shoot across it.',
  terrainPillarText:
    'Not walkable, and it blocks sight. The Runesmith can raise one — but never on a tile that would cut the map in two. You CAN step diagonally past it: a diagonal step is only forbidden when both tiles beside it are blocked, so a single pillar seals nothing.',
  terrainTrapText:
    'Placed by the Runesmith. Whoever steps on it takes damage, and the trap is used up. Enemies cannot see it coming.',
  badgeInitiative: 'Initiative (top right, red)',
  badgeInitiativeText:
    'The same number in three places: on the enemy tile (top right), beside the enemy name in the sidebar, and in the TOP LEFT corner of your own cards. It is initiative: the lower number acts first. Yours comes from whichever of your two chosen cards you mark as the initiative card — which is why the choice matters.',
  badgeBond: 'Bond (on the hero card, green)',
  badgeBondText:
    'While an ally is within 2 tiles, BOTH of you hit for one more — with three or four heroes it applies to each of you separately. On top of that: if somebody has already wounded the same enemy this round, your hit takes off one more again (Focus). When you pick a target, the grid prints on it what the hit will actually take — that number already includes the Bond, Focus, Rune Mark, Shield and being prone.',
  badgeShield: 'Shield (top left, blue)',
  badgeShieldText: 'The next hit is reduced by this much, then Shield drops by 1.',
  badgeStatusDots: 'Status dots (bottom left)',
  badgeStatusDotsText:
    'Amber = Anchor, cyan = Rune Mark, purple = prone / blinded / weakened. The sidebar spells out the exact values.',
  badgeHp: 'Hit point bar and amber frame',
  badgeHpText:
    'Hit points along the bottom. The amber frame means this unit is currently to act.',
  badgeRelic: 'Relic and extraction point',
  badgeRelicText:
    'The relics to collect and the way out. On exploration missions these are the objective, not the enemies.',

  // -------------------------------------------------- consoles and marks
  consolesHeading: 'Consoles',
  consolesIntro:
    'Two consoles, two people. Nothing here is shared: marks belong to whoever earned them, a ' +
    'relic works for whoever put it on, and mentees are trained by whoever took them on. Share ' +
    'the reactor — not this.',
  consoleTabHint: 'Pick your own console. You can see the other one, but do not press things on it.',
  marksHeld: (n: number, name: string) => `${n} ${name}`,
  marksEarned: (n: number) => `${n} earned in all`,
  marksHow: 'How marks are earned',
  perksHeading: 'What they can learn',
  perksIntro:
    'A mark is YOUR own point of progress: not the ship’s and not anybody else’s, and nobody ' +
    'else can spend it. You earn it for what your hero does, and you spend it on what your hero ' +
    'learns — and what is learned stays theirs for the rest of the expedition.',
  perkBuy: (cost: number) => `Learn it — ${cost} marks`,
  perkOwned: 'Learned',
  perkNeeds: (name: string) => `First: ${name}`,
  perkTooExpensive: 'Not enough marks',
  relicsHeading: 'Relics',
  relicsIntro:
    'A relic in the hold does nothing. Only what somebody is wearing works — and each of you can ' +
    'wear only as much as you have room for.',
  relicSlots: (used: number, total: number) => `Attuned: ${used} of ${total}`,
  relicAttune: 'Attune it',
  relicStow: 'Take it off',
  relicWornBy: (name: string) => `worn by ${name}`,
  relicOnlyFor: (name: string) => `Only ${name} can wear this`,
  relicNoSlot: 'No room left — something has to come off first',
  relicNone: 'No relics aboard. They come from exploration landings, from traders and from a few decisions.',
  relicWhisper: 'What it costs',
  menteesHeading: 'Mentees',
  menteesIntro:
    'Whoever you take on learns twice as fast at their post. Once two of them reach trained rank, ' +
    'every landing won pays you a mark for their work.',
  menteeCount: (n: number, max: number) => `${n} of ${max} mentees`,
  menteeTake: 'Take them on',
  menteeRelease: 'Let them go',
  menteeFull: 'That is all you can carry',
  menteeOther: (name: string) => `${name}’s mentee`,
  crewRankLine: (rank: string, xp: number) => `${rank} · ${xp} weeks of work`,
  crewNextRank: (n: number) => `${n} weeks to the next rank`,
  heroHpLine: (hp: number, max: number) => `Hit points ${hp} of ${max}`,

  // ------------------------------------------------------------ directives
  directivesHeading: 'Orders from home',
  directivesIntro:
    'Dated requests from the far side of the Gate. Each one lands on one console — that player is ' +
    'answerable for it, and takes the marks if it comes good. What runs out costs morale.',
  directiveDue: (week: number) => `due in week ${week}`,
  directiveLeft: (weeks: number) => `${weeks} weeks left`,
  directiveOverdue: 'overdue',
  directiveProgressLine: (now: number, target: number) => `${now} of ${target}`,
  directiveAtDeadline: 'This one is only measured at the deadline.',
  directiveNone: 'No orders right now. (They can be switched off on the difficulty dials.)',
  directiveStateDone: 'carried out',
  directiveStateFailed: 'failed',
  directiveReward: 'What it pays',

  // ------------------------------------------------------- attention, Herald
  attention: 'Attention',
  attentionHint:
    'How loudly you are playing. Fighting, forcing mechanisms and running the engines hot all ' +
    'build it; quiet weeks, the silence shroud and a few relics bring it down. At eight the ' +
    'Herald sets out.',
  heraldLabel: 'Herald',
  heraldAway: (columns: number) => (columns === 0 ? 'here' : `${columns} columns off`),
  heraldHint:
    'It does not use the roads: it comes up the corridor, always towards you. Running deeper takes ' +
    'it with you. If it arrives there is a boarding action — and if you stop it, no other is sent.',
  heraldSilencedLabel: 'The Herald has fallen silent',

  // --------------------------------------------------------------- the Gate
  gateHeading: 'Back through the Gate',
  gateIntro:
    'The Gate is still open, and there is enough fuel to turn round with. This is not a defeat: ' +
    'everything you have gathered goes through, and the Archive gets it. The expedition ends here.',
  gateFuelCost: (fuel: number) => `${fuel} fuel for the road home`,
  gateBanks: (points: number) => `About ${points} archive points`,
  gateGoHome: 'Go home',
  gateGoHomeShort: 'Turn for home…',
  gateConfirm: 'We turn round',
  gateNoFuel: (fuel: number) => `That needs ${fuel} fuel. You cannot turn back on this much.`,
  gateHintOnMap: 'You can turn for home from here at any time, while there is fuel for it and the Gate is open.',

  // ----------------------------------------------------------- the Heart
  heartReadButton: 'Read the rim',
  heartReadHint:
    'Once, before you decide anything: one mechanism at the hardest setting. Solve it and you gain ' +
    '2 understanding — which can open a different ending right here, in this moment. Fail and it ' +
    'costs morale.',
  heartReadDone: 'You have read the rim. That was the one chance.',

  // -------------------------------------------------------- the two commands
  commandFilter: 'Whose console',
  commandAll: 'Everything',
  domainEngineering: 'Engineering',
  domainResearch: 'Research',
  domainShared: 'Shared',
  domainHint:
    'The ship is split in two: the Runesmith answers for engineering, the Echo-reader for ' +
    'research. What is marked shared really does have to be decided together.',

  // ------------------------------------------------------- modes and rooms
  modeSolo: 'On your own',
  modeSoloText: 'One person running the whole party. Every console is yours; nothing is locked.',
  modeLocal: 'One machine, several of you',
  modeLocalText:
    'Two to four people at one keyboard. Whoever has the mouse can press anything — the consoles only show whose job is whose.',
  modeOnline: 'Online, on your own machines',
  modeOnlineText:
    'Two to four people, each at their own machine. You get a room code to join with. Only you can move your own hero; the ship is shared.',
  playersHeading: 'How many of you',
  partyHeading: 'Who plays whom',
  partyHint: 'Anybody can take any of them. Pick one that is taken and the two of you trade.',
  playersCount: (n: number) => `${n} players`,
  playersHint: (n: number): string =>
    n <= 2
      ? 'Runesmith and Echo-reader.'
      : n === 3
        ? 'Runesmith, Echo-reader and Cantor.'
        : 'All four: Runesmith, Echo-reader, Cantor, Surveyor.',
  launchRoom: 'Open a room',
  joinHeading: 'Join a room',
  joinIntro:
    'If somebody has already opened a room, type in its code. The code carries the seed, the length and the party size — which is why everybody builds a bitwise identical galaxy before a single byte crosses the network.',
  roomCode: 'Room code',
  joinRoom: 'Join',
  joinBadCode: 'That is not a valid code — have another look.',
  roomsKnown: 'Rooms this browser knows',
  roomRowMeta: (players: number, week: number): string =>
    week > 0 ? `${players} players · week ${week}` : `${players} players · not started yet`,
  roomRejoin: 'Back to it',

  // --------------------------------------------------------------- the lobby
  lobbyHeading: 'The room',
  lobbyIntro:
    'Read the code out to the others. The expedition does not set out until everybody is in a chair.',
  seatsHeading: 'Seats',
  seatsFree: (n: number): string => (n === 0 ? 'everybody is seated' : `${n} free`),
  seatEmpty: 'free',
  seatUnnamed: 'unnamed',
  seatYou: 'you',
  seatSit: 'Sit here',
  seatStand: 'Stand up',
  seatFree: 'Free it',
  seatTaken: 'taken',
  seatNoneYours: 'You are not sitting anywhere yet. Take a chair — it is the only way to move your hero.',
  yourName: 'Your name',
  yourNamePlaceholder: 'what the others see',
  playerKeyHeading: 'Your player key',
  playerKeyIntro:
    'This is what puts you back in your own chair, from any machine. The browser remembers it, but if you clear your data this is all there is — write it down somewhere. (If it is lost: the host can free your seat and you sit down again.)',
  playerKeyShow: 'Show',
  playerKeyHide: 'Hide',
  copy: 'Copy',
  copied: 'Copied',
  lobbyBegin: 'Through the Gate',
  lobbyWaiting: 'Waiting for the others…',
  lobbyGuestWait: 'The host starts it once everybody is seated.',
  lobbyLeave: 'Leave the room',
  netOff: 'not connected',
  netOpening: 'connecting…',
  netHosting: (peers: number) => `you are hosting · ${peers} connected`,
  netJoined: 'connected',
  netLost: 'the line dropped',
  netRetrying: 'trying again…',
  netGaveUp: 'could not connect',
  netBrokerDown: (host: string): string =>
    `Cannot reach the signalling server (${host}). That is the service that introduces the ` +
    'two machines to each other — no game data passes through it. If it works for everybody ' +
    'else, something on your side is blocking it: an ad-blocker or privacy extension, a DNS ' +
    'filter, a school or office firewall, a VPN, or antivirus web protection. Try opening this ' +
    'address in a new tab — if it does not return a long id, the problem is not the game.',
  netBrokerTest: 'Check the connection',
  netBrokerTesting: 'measuring…',
  netProbeHttp: 'Plain HTTPS request to the server',
  netProbeWs: 'WebSocket — this is what the game needs',
  netProbeOk: 'gets through',
  netProbeFail: 'blocked',
  netProbeVerdictOk:
    'The signalling server is reachable and the socket opens. If the game still will not ' +
    'connect, it is not the server: try reloading the page.',
  netProbeVerdictWs:
    'This is the fault: ordinary HTTPS gets through, the WebSocket does not. That is almost ' +
    'always something local that inspects encrypted traffic and does not understand the ' +
    'WebSocket upgrade: antivirus https scanning (Kaspersky, ESET, Avast, Bitdefender), a ' +
    'corporate or school proxy, a VPN, or a browser extension (uBlock, AdGuard, Brave shields) ' +
    '— peerjs.com is on more than one blocklist. Try a private window with extensions off; if ' +
    'it works there, an extension is the culprit. If antivirus is doing it, this address can be ' +
    'excluded from https scanning. If neither can be changed, use a different signalling server.',
  netProbeVerdictAll:
    'The server cannot be reached at all from here — neither HTTPS nor WebSocket. The commonest ' +
    'reason is that the signalling server has TEMPORARILY BANNED you for too many connections ' +
    'from this internet connection (the browser shows "Error 1015 — You are being rate limited"). ' +
    'It clears on its own, usually within half an hour to an hour: simply stop trying until then, ' +
    'because every further attempt extends it. Failing that it is DNS filtering, a firewall or a ' +
    'network block — worth trying from another network, or using a different signalling server.',
  netCooldownHeading: 'Letting the connection rest',
  netCooldown: (minutes: number): string =>
    'The signalling server has banned this internet connection for making too many requests ' +
    `(Cloudflare "Error 1015"). It clears on its own — the game will not even try for ${minutes} ` +
    'minutes, because every further knock would extend the ban. Play on one machine meanwhile, ' +
    'or point the game at a different signalling server.',
  netCooldownSkip: 'Try now anyway',
  netProbeVerdictOdd:
    'The WebSocket opens but the HTTPS request does not — which is unusual, and probably an ' +
    'extension filtering requests. The game may well work anyway.',
  netBrokerHeading: 'Signalling server',
  netBrokerIntro:
    'PeerJS’s free server by default. If somebody’s network blocks it, point the game at ' +
    'another one here — but EVERYBODY at the table has to enter the same address. Running your ' +
    'own takes one command: npx peerjs --port 9000',
  netBrokerPlaceholder: 'default (0.peerjs.com)',
  netBrokerReset: 'Back to the default',
  netBrokerInsecure:
    'That address is http:// while the game runs on https — browsers block such a connection. ' +
    'Either use an https server, or open the game over http as well.',
  netBrokerSaved: 'Saved. Reload the page for it to take effect.',
  netPlayLocally: 'Play on one machine',
  netPlayLocallyHint:
    'If the network will not come together, the evening does not have to end: the room code ' +
    'carries the seed, so this same galaxy opens as a hotseat game. Whoever has the keyboard ' +
    'clicks, and the others say what they think.',
  notYourHero: 'Not your hero — that move belongs on their machine.',
  notYourTurn: (who: string) => `It is ${who}’s move — it has to be pressed on their machine.`,
  // ------------------------------------------------------ the split task
  proposalHeading: 'A question for the table',
  proposalAsked: (who: string, what: string) =>
    `${who} is asking for ${what}. Somebody else has to agree — and then there is no going back.`,
  proposalAgree: 'I agree',
  proposalRefuse: 'Not now',
  proposalWithdraw: 'Withdraw',
  watchHeading: 'Your duty this week',
  watchIntro:
    'One decision a week that is nobody else’s. It runs at the end of the week and then asks again. A seat that sets nothing simply does nothing — no penalty, you just miss out.',
  watchSetLabel: 'set',
  watchUnset: 'not set yet',
  watchPending: (n: number): string =>
    n === 0 ? 'Everybody has set their duty for the week.' : `${n} consoles have not set a duty yet.`,
  siteNow: (what: string) => `The site: ${what} — at the end of this round`,
  siteIn: (what: string, rounds: number) => `The site: ${what} — in ${rounds} rounds`,
  focusHint:
    'If somebody else has already wounded this enemy in the same round, your hit takes off one more. The number printed on the grid already includes it.',
  taskHeading: 'Closing line',
  taskSeat: (slot: number) => `seat ${slot}`,
  taskYours: 'yours',
  taskTheirs: 'theirs',
  taskNotYours: (who: string) => `${who} presses this one — tell them.`,
  taskNoClues: 'No part of the description came to you — you press your runes when you are told.',
  taskHidden: (n: number): string =>
    n === 1 ? '1 line only they can see' : `${n} lines only they can see`,
  taskStrikes: (used: number, max: number) => `Mistakes: ${used} of ${max}`,
  taskSolved: 'The closing line opened.',
  taskFailed: 'The closing line shut. It will not open again.',
  // --------------------------------------------------- the ship's own weeks
  aboardHeading: 'Aboard',
  aboardOwner: (who: string) => `${who}’s call`,
  aboardAnybody: 'Anybody can answer',
  aboardSubject: (name: string) => `about ${name}`,
  crewLoyalty: (band: string, value: number) => `${band} (loyalty ${value}/10)`,
  debtsHeading: 'What is still coming',
  debtsMeta: (n: number): string => (n === 1 ? '1 thing' : `${n} things`),
  debtsIntro:
    'What you decided earlier and has not arrived yet. These happen by themselves — nothing to do about them, but worth knowing.',
  debtIn: (weeks: number): string => (weeks <= 0 ? 'this week' : `in ${weeks} weeks`),
}

const CATALOGS: Record<Lang, Catalog> = { hu: HU, en: EN }

export type UiKey = keyof Catalog

export function ui(lang: Lang): Catalog {
  return CATALOGS[lang]
}

/** Resolve a content Text in the active language. */
export function pick(text: Text, lang: Lang): string {
  return text[lang]
}
