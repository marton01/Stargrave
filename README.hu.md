# Csillagsír

> English: [README.md](README.md) · Szabályok: [RULES.hu.md](RULES.hu.md) ·
> Terv: [DESIGN.hu.md](DESIGN.hu.md)

Kétszemélyes, **kooperatív**, kampányos társasjáték böngészőben: egy gép, egy
monitor, egy egér. Ketten vezetitek ugyanazt az expedíciós hajót — heti körökben
tervezitek az utat, a kutatást és az energiát, majd ha leszálltok valahol, egy
taktikai rácson folytatódik: harc, felfedezés vagy logikai feladvány.

A játék **magyarul és angolul is teljes**, és a nyelv **bármelyik képernyőn,
menet közben átváltható** (fejléc jobb felső sarka). Ez a naplóra is
visszamenőleg érvényes: a régi bejegyzések is átfordulnak, mert a napló nem
szöveget, hanem eseményeket tárol.

## Elindítás

```bash
npm install
npm run dev
```

Utána nyisd meg a kiírt címet (alapból <http://localhost:5173>). Nincs szerver,
nincs fiók, nincs hálózat: minden a böngészőben fut, a mentés a `localStorage`-ban.

| Parancs | Mit tesz |
| --- | --- |
| `npm run dev` | fejlesztői szerver, azonnali újratöltéssel |
| `npm run build` | statikus build a `dist/`-be (fájlból is megnyitható) |
| `npm run preview` | a kész build kiszolgálása |
| `npm run typecheck` | `tsc --noEmit` — típusellenőrzés |
| `npm run test` | Vitest: motor, feladványok, expedíciók, mentés |
| `npm run balance` | opcionális balansz-riport (nem tesztel, hanem mér) |
| `npm run smoke` | böngészős végigjátszás igazi kattintásokkal (fusson a `dev`!) |

## Mi működik

**Minden.** A játék végigjátszható: expedíció indítása, heti körök, csillagtérkép,
találkozások, partraszállások, kilencféle generált feladvány, kutatás két ággal,
piac, legénységfelvétel, a Csillagsír több befejezése, Archívum-fejlesztések, majd
új expedíció az előző tanulságaival.

- **Stratégiai réteg** — 8 reaktoregység 7 rendszer között, 8 állomás (áram **és**
  legénység is kell hozzá), 6 nyersanyag + legénység + morál, 13 kutatási projekt,
  24 találkozás, Kapu-visszaszámláló 4 Sötétülés-szinttel.
- **Taktikai réteg** — négyzetrács, 8 irányú mozgás, Gloomhaven-szerű kártyagazdaság
  (13 lap osztályonként, körönként két lap: egyik felső, másik alsó fele), látható
  ellenséges szándék, 5 küldetéstípus (irtás, elérés, relikviák, kitartás, tartás),
  omló padló, csapdák, 4 ellenségtípus.
- **Feladványok** — kilenc fajta, mind generált és mind **nyelvfüggetlen**:
  rúnafejtés, mérleg, glifaolvasás, biztos talaj, energiavezetés, fénytörés,
  csillagtérkép-illesztés, rezonancia, gravitációs magok.
- **Meta** — Archívum: 9 feloldás, ami **tartalmat nyit, nem erőt**. Automatikus
  mentés, plusz JSON export/import.
- **Assetek** — a kép- és hangfájlok **akkor lépnek életbe, amikor beteszed őket**,
  és amíg nincsenek ott, csendben nincsenek ott: lásd
  [public/assets/README.md](public/assets/README.md). A fejlécben `♪` gombbal
  elhallgattatható a hang.
- **Súgó** — a `?` gomb (vagy `F1`) a teljes szabálykönyvet nyitja, mindig az adott
  képernyőhöz tartozó fejezeten, és a „Játékelemek” fül **élőben rajzolja** ki az
  egységeket és a terepet ugyanazokkal a komponensekkel, mint a rács.

Amit *nem* csinál: nincs hálózati többjátékos mód, nincs zene (az asset-listában
szereplő két ambient loop szándékosan nincs bekötve), és a grafika egyelőre kódból
generált SVG.

## Felépítés

```
RULES.hu.md / RULES.md      a szabálykönyv — EZ a játékbeli súgó szövege is
DESIGN.hu.md / DESIGN.md    a tervezői dokumentum (miért ilyen, nem hogyan)
public/assets/README.md     mit kell letölteni és hova tenni (asset-lista)
tools/smoke-test.mjs        böngészős végigjátszás Playwright-tal

src/engine/                 a szabálymotor — NEM tud a Reactről
  types.ts                  a csata összes típusa (+ Text, Lang, LogEvent)
  rng.ts                    mulberry32 — magvetett, ismételhető
  grid.ts                   rács, Chebyshev-távolság, látóvonal, elérhetőség
  state.ts                  klónozás, státuszok, naplózás
  combat.ts                 sebzés, pajzs, hátralökés, csapda, relikvia
  effects.ts                a hatáslista feloldása (megszakítható: s.pending)
  enemyAi.ts                ellenséges kör, célválasztás
  mapgen.ts                 pálya- és küldetésgenerálás
  battle.ts                 startMission / step / missionResult
  puzzles/                  a kilenc feladvány generátora és szabálya
  expedition/               a stratégiai réteg
    starmap.ts              csillagtérkép-generálás
    expedition.ts           heti kör, találkozás, küldetésindítás, piac
    archive.ts              meta-feloldások, befejezésszövegek
    save.ts                 mentés, betöltés, export/import
src/content/                adat, nem logika (kártyák, ellenfelek, hajó, kutatás…)
src/i18n/                   ui.ts (felület), describe*.ts (napló), LangContext
src/ui/                     React — csak megjelenítés és kattintás
  strategic/                hajó, csillagtérkép, találkozás, kutatás, vég, archívum
  puzzles/                  a feladványpanel és a jelölések
  assets.ts                 opcionális kép és hang, alapból csendben hiányzik
```

**Két szabály tartja rendben a projektet:**

1. **A motor nem ismeri a Reactet.** Egyetlen belépési pont csatában
   (`step(state, action)`) és egy a stratégiai rétegben
   (`expeditionStep(state, action)`), mindkettő tiszta függvény: `structuredClone`,
   majd a klón módosítása. Ezért lehet a teljes játékot fejek nélkül végigbotoltatni.
2. **A napló eseményeket tárol, nem szöveget.** `LogEvent` és `ExpeditionEvent`
   struktúrákat, amiket az `i18n/describe*.ts` fordít le — így a nyelvváltás a
   múltat is átírja.

A szövegek **a számok mellett élnek** a `content/`-ben (`Text = { hu, en }`), a
felület állandó feliratai pedig az `i18n/ui.ts`-ben. Ott a
`type Widen<T> = T extends string ? string : T` trükk miatt **fordítási hiba**, ha
az angol katalógusból kimarad egy kulcs.

## Hogyan ellenőrzöm

Három, egymást lefedő szinten:

1. **`npm run typecheck`** — a típusok tartják a tartalmat is: hiányzó fordítás,
   ismeretlen kártyaazonosító, rossz effekt-kulcs fordítási hiba.
2. **`npm run test`** — 34 Vitest teszt. Nem a balanszot méri, hanem azt, hogy
   *nem áll meg és nem hazudik*:
   - random, de mindig **legális** lépésekkel végigjátszott csaták több magon és
     minden nehézségen — nincs holtpont, nincs összeomlás;
   - invariánsok: HP nem megy nulla alá, halott nem támad, **lap nem duplázódik és
     nem tűnik el**, pajzs nem lép a plafon fölé;
   - 9 feladványfajta × 3 nehézség × 30 mag = 810 példány, mind megoldható, és a
     dedukciós fajtáknál az egyediség is ellenőrizve;
   - teljes expedíciók botolása invariánsokkal minden lépés után;
   - mentés kör-be-kör, plusz a mentésméret felső korlátja (~17 kB).
3. **`npm run smoke`** — Playwright a *rendszer Chrome-jával* végigjátszik egy
   expedíciót az **igazi felületen**, mindkét nyelven, és elhasal, ha zsákutcába
   fut, ha lefordítatlan szöveget lát, ha a súgó valamelyik füle üres, vagy ha a
   két szabályfájl fejezetszáma eltér. A kattintások `data-action` / `data-tile`
   horgokra mennek, nem feliratokra, ezért nyelvfüggetlen. Képek a `.smoke/`-ba.

   A futás **teljesen determinisztikus**: az expedíció magja fix, és a bot saját
   véletlenje is, tehát ugyanaz a mag ugyanazt az 535 kattintást adja a fejlesztői
   szerveren és a kész buildben is. Ezért reprodukálható egy hiba: beírod az
   indítóképernyőn azt a magot, amit a futás kiírt, és ugyanabban az expedícióban
   vagy. Másik mag: `SMOKE_SEED=1234 npm run smoke`. Az alapértelmezett mag útja
   érint találkozást, csatát, feladványt és piacot is, és a teszt elhasal, ha ez
   a négy lefedés bármikor megszűnik.

A `npm run balance` szándékosan nincs a tesztek között: az nem elhasal, hanem
kiír egy táblázatot (győzelmi arány, körhossz, nyersanyag-lefolyás), amiből
állítani lehet.

## Ha állítani akarsz rajta

| Amit érzel | Hol állítsd |
| --- | --- |
| a harc túl könnyű / nehéz | `content/enemies.ts` — típusok és `ENEMY_COUNT` nehézségenként |
| kevés a lap / túl hamar elfogy | `content/heroes.ts` `handSize`, `content/cards.ts` |
| a pajzs elszabadul | `engine/state.ts` `SHIELD_MAX` |
| kifullad az élelem | `content/ship.ts` `lifeSupportNeeded`, `expedition.ts` élelemfogyás |
| a morál padlóra megy | `expedition.ts` `moraleTarget` |
| túl szoros / laza a Kapu | `expedition/starmap.ts` `LENGTHS` |
| kevés / sok a jutalom | `puzzles/types.ts` `PUZZLE_REWARD`, `content/encounters.ts` |
| lassú a kutatás | `content/research.ts` költségek, `expedition.ts` labor-hozam |
| unalmasak a találkozások | `content/encounters.ts` (24 db, `buildEncounter`) |
| kevés a feloldás | `expedition/archive.ts` `ARCHIVE_UNLOCKS` |

## Balansz-napló

Ami playtesztből vagy botolásból jött, és miért lett úgy:

- **„Kevés a lap, ha mindig el kell dobnom egyet.”** Kézméret 10 → 13, és a
  pihenés utáni veszteség kézzel választható. A *lapdobás* maradt: ez a játék
  szíve, csak nem lehet ilyen szoros.
- **„A Rúnaőrző elképesztően sok védelemmel bír.”** A pajzs korlátlanul
  halmozódott, és Normálon két Őrző is előfordulhatott. Most `SHIELD_MAX = 3`, az
  Őrző pajzsa 2 → 1, két Őrző soha nem kerül egy pályára, és a Hard 6 → 5 ellenfél.
- **Élelem-halálspirál.** Az életfenntartás igénye lineárisan nőtt a legénységgel
  → `ceil(létszám/4)`, a fogyás `ceil(létszám/3)`, kezdő élelem 36.
- **A morál a 4. hétre nullázódott.** Lineáris csökkenés helyett **cél felé
  sodródás** (`moraleTarget`): rossz körülmények között beáll egy alacsony
  szintre, de ha javítasz a helyzeten, visszajön.
- **Lapduplázódás.** A küldetés végén a kiválasztott lapok a kézben *és* a dobóban
  is ott voltak. A `missionResult` most kizárja a `selected`-et a kézből, és
  tiszteletben tartja a `heroTurn.losing`-ot.
- **Az Echo önmagát visszhangozta** és megfagyasztotta a lapot: a visszajátszott
  lap felső fele újra visszhangot fűzött a listába. Most tiltott, és a
  hatásfeloldó lépésszámlálóval védett.
- **Az oldalsáv a csatatér fölé került** (régi `grid-area` a küldetésnézetben) —
  a kattintás egy `<h3>`-ra ment, a renderer összeomlott. Explicit
  `grid-column`/`grid-row` a megoldás; a smoke teszt találta meg.

## Assetek

A kép és a hang **opcionális, és a hiányra van megtervezve**: ami ott van, azt
használja, ami nincs, az semmit nem változtat — nincs hibajelzés, nincs törött kép
ikon, nincs lyuk a felületen. Hogy mit érdemes letölteni és hova, azt a
[public/assets/README.md](public/assets/README.md) tartja számon, pontos
fájlnevekkel, formátummal és mérettel.
