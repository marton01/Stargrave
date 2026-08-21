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
  appSubtitle: 'kooperatív expedíció két főre',
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
  dialsHeading: 'Nehézség — tárcsákkal',
  dialsIntro:
    'Nem egy szám, hanem több kis tárcsa: mindegyik a játék egy szorítását állítja, öt fokozatban. A harmadik mindenhol az, ahogy a játék tervezve van. Minden tárcsa alatt ott van, hogy a mostani fokozat mit jelent a gyakorlatban.',
  dialsSavePreset: 'Mentés presetként',
  dialsLoadPreset: 'Mentett preset betöltése',
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
  wipeHint: 'Nincs visszavonás. Ha meg akarod tartani, előbb exportáld a mentést az Archívum képernyőjén.',
  wipeConfirm: 'Törlés és új játék',
  bondActive: '⇄ Kötés: +1 sebzés',
  handHide: 'Kéz elrejtése',
  handShow: 'Kéz megjelenítése',
  handToggleHint: 'A kártyapanel összecsukásával a csatatér megnő. A körhöz vissza kell nyitni.',
  projectionHint:
    'Ennyivel változik a hét végén, ha az energia-elosztás és a legénység-beosztás így marad.',
  bondHint:
    'A két hős 2 mezőn belül van egymástól, ezért mindkettő támadása +1-et sebez. Ezért sebez egy „Támadás 3" néha 4-et.',
  endingsHeading: 'Végkifejletek',
  endingsProgress: (seen: number, total: number) =>
    `${seen} / ${total} megvan. A cél nem a túlélés, hanem hogy mind az ötöt lássátok — és utána az, ami belőlük következik.`,
  endingsDone: 'Mind megvan, és a válasz is. Ez a játék vége — az Archívum kész.',
  endingUnseen: 'Még nem láttátok',
  endingNeed: (tier: number) =>
    tier === 0 ? 'megértés nem kell hozzá' : `${tier}. megértés-szint kell hozzá`,
  endingLastQuestion: 'Az utolsó kérdés — a Csillagsírban tehető fel',
  accountCosts: 'Amit kér',
  accountEffects: 'Amit ad',
  accountNothing: 'Nincs se ára, se hozadéka — csak a döntés.',
  encounterBack: 'Mégse',
  heartConfirm: 'Ezt választjuk',
  heartFinal: 'Ez az expedíció utolsó döntése. Nincs utána visszaút.',
  marketConfirm: (price: number) => `Megveszem — ${price} ✧`,
  summaryWeek: 'A hét vége',
  summaryMission: 'Küldetés elszámolása',
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
  rescueWin: 'Elszámolás teljesítettként',
  rescueWinText:
    'A csata véget ér győzelemként: megkapod a küldetés teljes jutalmát, ereklyés küldetésnél az összes ereklyével. A legjobb forgatókönyv, harc nélkül.',
  rescueLose: 'Feladás teljes veszteséggel',
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
  lengthLongText: '13 rendszer, 40 hét. Több estére, több megértésre.',
  launch: 'Indulás',
  archiveHeading: 'Az Archívum',
  archiveIntro:
    'Minden expedíció — még a kudarcos is — hazaküldi az adatait a Kapun át. Ez nem erősödést old fel, hanem tartalmat: a világ gazdagodik, nem könnyebbé válik.',
  archivePoints: 'Archívum-pont',
  expeditionsRun: 'Expedíciók',
  bestUnderstanding: 'Legjobb megértés',
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
  seed: 'Mag',
  seedHint: 'Ugyanaz a mag ugyanazt az expedíciót adja. Egy lezárt futam magja az előzményekben van, egy kattintással beírható.',
  seedReuse: (seed: number) => `Mag ${seed} beírása a mezőbe`,

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
    'Egy állomás akkor működik, ha energiája is van és legénység is áll rajta. Ez a kettős korlát adja a szűkösséget.',
  stationEmpty: 'Nincs beosztva senki',
  stationNoPower: 'Nincs energia',
  stationRunning: 'Működik',
  crewHeading: 'Legénység',
  crewSpeciality: 'Szakterület',
  crewTraits: 'Jellemvonások',
  crewUnassigned: 'Nincs beosztva',
  crewWeeks: (n: number) => `${n}. hét a fedélzeten`,
  crewLostLabel: 'Elveszett',
  assignTo: 'Beosztás',
  unassign: 'Leváltás',
  endWeek: 'A hét vége',
  endWeekBlocked: 'Előbb be kell fejezni, ami folyamatban van.',
  fluxPreview: (n: number) => `A partraszálló csapat ${n} Fluxussal indul.`,
  fluxPreviewHint:
    'A Rúnamagra adott energia lesz a Fluxus. Ez köti össze a hajót és a partraszállást.',
  logHeading: 'Napló',
  understanding: 'Megértés',
  understandingHint:
    'A megértés nem ad harci előnyt. Mégis ez dönti el, mit tehetsz a galaxis szívében.',
  tier0: 'Semmit nem értünk',
  tier1: 'Kezdjük érteni',
  tier2: 'Látjuk, mi történik',
  tier3: 'Értjük, miért',

  // --------------------------------------------------------------- research
  researchHeading: 'Kutatás',
  researchIntro:
    'Egy Információ-készlet, két ág. A technológia erősebb hajót ad. A megértés nem ad semmit — csak a végjátékot.',
  branchTechnology: 'Technológia',
  branchUnderstanding: 'Megértés',
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
    'Előre vezető utak. Amit választotok, az heteket kér — és a Kapu közben számol.',
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
    'A galaxis szíve, a Csillagsír. Az út vége. Hogy ott mit tudsz tenni, azt a megértés dönti el, nem a felszerelés.',

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

  // ---------------------------------------------------------------- mission
  missionHeading: 'Küldetés',
  missionBriefing: 'Feladat',
  missionLaunch: 'Indulás',
  missionFinish: 'Jelentés a hajóra',
  objectiveEliminate: 'Minden ellenséget le kell győzni.',
  objectiveReachExit: 'MINDKÉT hősnek el kell jutnia a kimenekítési pontra (rá vagy mellé).',
  atExitCount: (there: number, total: number) => `${there}/${total} a kijáratnál`,
  objectiveCollect: (n: number) =>
    `${n} ereklyét kell begyűjteni, majd MINDKÉT hősnek ki a kimenekítési ponton.`,
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
  runeDecodeName: 'Rúnadekódolás',
  runeDecodeHelp:
    'Ki kell találni a rúnasorrendet. Kattints egy mezőre a következő rúnáért (jobb klikk: visszafelé), majd Beadás. Utána megmutatja, mennyi volt a helyén (●), és mennyi szerepel benne, de máshol (○).',
  runeExact: 'helyén',
  runePartial: 'benne',
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
  powerRoutingName: 'Energia-útvonaltervezés',
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
    'Itt van a galaxis szíve. Nem a fegyvereitek döntik el, mit tehettek — hanem az, mennyit értettetek meg.',
  heartUnderstanding: (n: number) => `Megértés: ${n}`,
  heartChoose: 'Ezt tesszük',
  heartLocked: 'Ehhez nem értetek eleget.',

  // ------------------------------------------------------------------- over
  overVictory: 'Az expedíció véget ért',
  overLost: 'Az expedíció elveszett',
  overArchiveEarned: (n: number) => `Az Archívum ${n} ponttal gazdagodott.`,
  overUnderstanding: (n: number) => `Megértés a végén: ${n}`,
  overWeeks: (n: number) => `${n} hét`,
  overReturn: 'Vissza az Archívumhoz',
  abandonExpedition: 'Expedíció leállítása',
  abandonConfirm: 'Biztosan leállítod? Ami megvan, az bekerül az Archívumba.',

  // ------------------------------------------------------ battle (tactical)
  round: 'Kör',
  fluxShared: 'Fluxus (közös)',
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
    'Nem járható, a látást is blokkolja. A Rúnakovács tud ilyet emelni — de olyan mezőre nem, ami kettévágná a pályát. Átlósan EL LEHET mellette menni: egy átlós lépés akkor tilos, ha mindkét szomszédos mező blokkolt, tehát egy magában álló oszlop nem zár el semmit.',
  terrainTrapText:
    'A Rúnakovács állítja. Aki rálép, sebzést kap, és a csapda elhasználódik. Az ellenség nem látja előre.',
  badgeInitiative: 'Kezdeményezés (jobbra fent, piros)',
  badgeInitiativeText:
    'Ugyanaz a szám három helyen: az ellenfél mezőjén (jobbra fent), az ellenfél neve mellett az oldalsávban, és a saját lapjaid BAL FELSŐ sarkában. Ez a kezdeményezés: aki kisebb, az lép előbb. A körödben a két kiválasztott lap közül az adja a tiédet, amelyiket kezdeményezésnek jelölöd — ezért nem mindegy, melyiket.',
  badgeBond: 'Kötés (a hős kártyáján, zöld)',
  badgeBondText:
    'Ha a két hős 2 mezőn belül van egymástól, MINDKETTŐ támadása +1-et sebez. Ezért sebez egy „Támadás 3" négyet. Amikor célpontot választasz, a rács a célpont közepére kiírja, mennyit visz el a találat — abban a számban már minden benne van: Kötés, Rúnajel, Vért, ledöntés.',
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
  appSubtitle: 'a cooperative expedition for two',
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
  wipeHint: 'There is no undo. If you want to keep it, export the save from the Archive screen first.',
  wipeConfirm: 'Delete and start over',
  bondActive: '⇄ Bond: +1 damage',
  handHide: 'Fold the hand away',
  handShow: 'Show the hand',
  handToggleHint: 'Folding the card panel away makes the battlefield bigger. Open it again to play.',
  projectionHint:
    'How much this changes at the end of the week, if the power allocation and the postings stay as they are.',
  bondHint:
    'The two heroes are within 2 tiles, so both of them hit for one more. That is why an "Attack 3" sometimes takes off 4.',
  endingsHeading: 'Endings',
  endingsProgress: (seen: number, total: number) =>
    `${seen} of ${total} found. The goal is not to survive but to see all five — and then what follows from them.`,
  endingsDone: 'All of them, and the answer too. This is the end of the game — the Archive is finished.',
  endingUnseen: 'Not seen yet',
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

  // ---------------------------------------------------------------- mission
  missionHeading: 'Mission',
  missionBriefing: 'Objective',
  missionLaunch: 'Go',
  missionFinish: 'Report to the ship',
  objectiveEliminate: 'Every enemy has to be defeated.',
  objectiveReachExit: 'BOTH heroes have to reach the extraction point (on it or beside it).',
  atExitCount: (there: number, total: number) => `${there}/${total} at the exit`,
  objectiveCollect: (n: number) =>
    `Collect ${n} relics, then BOTH heroes out through the extraction point.`,
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
    'Work out the rune sequence. Click a slot for the next rune (right-click for the previous one), then Submit. It then shows how many were in the right place (●) and how many appear but elsewhere (○).',
  runeExact: 'in place',
  runePartial: 'present',
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
    'While the two heroes are within 2 tiles, BOTH of them hit for one more. That is why an "Attack 3" takes off four. When you pick a target, the grid prints on it what the hit will actually take — that number already includes the Bond, Rune Mark, Shield and being prone.',
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
