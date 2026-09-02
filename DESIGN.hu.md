# CSILLAGSÍR — Játékterv v1.0

*Kooperatív expedíció-vezetés két főre, egy gépen. Web alapú.*
*Star Trek + FTL + euro-társas + taktikai RPG — nem akcióorientált.*

> Angolul: [DESIGN.md](DESIGN.md). A két fájlt együtt kell frissíteni.

---

## 1. Egy bekezdésben

Megnyílt **a Kapu** — egy ősi építmény, ami egy másik galaxisra néz. A túloldalon egy
civilizáció maradványai, amelyik egyesítette a mágiát és a technológiát, aztán egyetlen
nemzedék alatt eltűnt. Nem háború pusztította el: valami *befejezte* őket.

Ketten vagytok egy expedíciós hajó parancsnoki csapata. Van egy legénységed, egy reaktorod, és
véges számú heted, amíg a Kapu bezárul. Minden héten eldöntitek, hova mentek, mit kutatsz, mit
gyártasz, kit veszel fel a legénységbe, és melyik hívásra válaszolsz. Amikor leszállsz valahol,
átkerülsz egy taktikai rácsra — de az nem feltétlenül harc: lehet felderítés, lehet feladvány.

A cél eljutni a galaxis szívébe, a **Csillagsírba** — de hogy ott mit tudtok tenni, azt nem a
fegyvereitek döntik el, hanem az, **mennyit értettetek meg** útközben. Ha az expedíció elbukik,
egy új indul — és amit felfedeztetek, bekerül az **Archívumba**, ami közelebb visz a következő
csapatot.

**Munkacím:** Csillagsír (angolul: Stargrave)
**Hangulat:** mitikus és melankolikus — elveszett istenek, hatalmas romok, súlyos szépség

---

## 2. A játék két rétege

```
┌─────────────────────────────────────────────────────────────┐
│  STRATÉGIAI RÉTEG — a hajó  (a játék gerince, ~60%)         │
│                                                             │
│  Heti körök · energia-elosztás · legénység-lehelyezés        │
│  csillagtérkép · kutatás · gyártás · találkozások            │
│  morális döntések · a Kapu visszaszámlálása                  │
└───────────────────────────┬─────────────────────────────────┘
                            │  leszállás / átszállás
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  TAKTIKAI RÉTEG — a partraszálló csapat  (~40%)             │
│                                                             │
│  Négyzetrács · kártyás képességek · kezdeményezés            │
│  ⅓ felderítés   ⅓ logikai feladvány   ⅓ harc                │
└─────────────────────────────────────────────────────────────┘
```

**Fontos elv: a harc nem az alapeset.** A partraszálló küldetések körülbelül harmada
felderítés (ugyanaz a rács, de ellenség helyett veszélyes terep, záródó ajtók, időkorlát,
mentés), harmada logikai feladvány, harmada harc. Ugyanaz a motor szolgálja ki mindhármat,
tehát kevés extra kód — de teljesen más ritmus.

---

## 3. Alapdöntések

| Kérdés | Döntés |
|---|---|
| Formátum | 2 játékos, **egy gép, egy monitor, egy egér** (hotseat co-op) |
| Viszony | **Kooperatív** — együtt, nem egymás ellen |
| Információ | **Teljesen nyílt** |
| Gerinc | **Heti körös hajóvezetés** — energia-elosztás + legénység-lehelyezés |
| Erőforrások | **7 közös** + az energia mint heti elosztás |
| Legénység | **Nevesített személyek** szakterülettel és jellemvonásokkal |
| Taktikai réteg | Négyzetrács, 8 irány, Chebyshev-távolság (átló = 1) |
| Harc-ökonómia | **Képességkártyák kézkimerüléssel**, látható ellenség-szándékkal |
| Küldetésméret | **Kicsi és sűrű** — 2 hős + legénységtag, ~10x10, 10-15 perc |
| Felszerelés | **Rúnafoglalatok a kártyákon** |
| Feladványok | **9 típus**, mind generált és **nyelvfüggetlen** |
| Nyelv | **Magyar és angol**, valós idejű váltással · a kód angol |
| Időnyomás | **A Kapu N hét múlva bezárul** |
| Győzelem | **Eljutni a galaxis szívébe** — és a *megfejtés* dönti el, mit tehetsz ott |
| Kutatás | **Két ág:** technológia (képesség) és megfejtés (a végjáték kulcsa) |
| Küldetés-kudarc | **Visszavonulás veszteséggel** — nem a futam vége |
| Mentés | **Automatikus**, egy folyó futam, visszaújratöltés nélkül |
| Futam vége | **Roguelite** — bukás után új expedíció, a feloldott tartalom megmarad |
| Futamhossz | rövid ~15 hét / közepes ~25 / hosszú ~40 |
| Mélység | Közepes-mély, fokozatos bevezetéssel |
| Grafika | **Stilizált, lapos 2D** — sziluettek, korlátozott paletta, rúnafény |

---

## 4. A stratégiai réteg: a hajó

### 4.1 A heti kör

```
1. JELENTÉS      — fogyás (élelem a legénységszám szerint, üzemanyag ha úton vagytok),
                   eseménydobás, a Kapu-számláló csökken
2. BEÁLLÍTÁS     — ha kell: energia újraosztása, legénység átrendezése
3. HATÁSKÖRÖK    — mindkét játékos meghozza a saját osztálya döntéseit
4. KÖZÖS DÖNTÉS  — útvonal, küldetésvállalás, felvétel, morális dilemmák
5. VÉGREHAJTÁS   — állomások lefutnak, utazás halad, esetleg leszállás
```

**A kritikus tervezési elv:** a 2. lépés **állandó beállítás, nem heti feladat.** Beállítod,
aztán csak módosítod, ha változott valami. Így egy nyugodt utazó-hét 30 másodperc alatt lefut,
egy rendszerbe érkezés viszont sűrű döntéssorozat lesz. Ez a ritmus a különbség egy jó
hajóvezetés-játék és egy táblázatkitöltés között.

### 4.2 Energia — a heti elosztás

A reaktor kimenete kezdetben **8 egység** (fejleszthető). Szét kell osztani a rendszerek
között — **ez közös döntés**, és ez a legerősebb kooperatív elem a játékban:

| Rendszer | Mit ad |
|---|---|
| **Életfenntartás** | kötelező minimum a legénységszám szerint; kevés → morál és életerő romlik |
| **Hajtómű** | utazási sebesség — hány hét egy ugrás |
| **Pajzs** | védelem találkozásokon és átszálló csatáknál |
| **Labor** | Információ-termelés, kutatási sebesség |
| **Kohó** | javítás és gyártás |
| **Érzékelők** | mennyit látsz előre a csillagtérképen |
| **Rúnamag** | **ebből lesz a partraszálló csapat Töltete a küldetésen** |

Nyolc egység, hét rendszer — mindegyik 1-3-at akar. Sosem elég, és minden héten másra kell.
A Rúnamag sora külön fontos: **ez köti össze a két réteget.** Amit a héten a rúnamagra adtál,
azzal fog harcolni a partraszálló csapat.

### 4.3 Legénység-lehelyezés — az állomások

A legénységtagokat **állomásokra** helyezed. Egy állomás akkor működik, ha **energiája is van
és legénység is áll rajta** — ez a kettős korlát adja az igazi szűkösséget.

| Állomás | Hatás | Hatáskör |
|---|---|---|
| **Híd** | navigáció, üzemanyag-hatékonyság | közös |
| **Labor** | Információ-termelés, kutatás | Múltidéző |
| **Archívum** | lapfejlesztés, idegen technológia elemzése | Múltidéző |
| **Érzékelő** | előre látod, mi van a következő rendszerekben | Múltidéző |
| **Kohó** | hajótest-javítás, rúnaszövés, gyártás | Rúnaszövő |
| **Fegyverzet** | pajzs- és védelmi felkészülés | Rúnaszövő |
| **Gyógyító** | életerő és sebek kezelése | közös |
| **Szentély** | morál helyreállítása | közös |

Minden legénységtagnak van **szakterülete**: a megfelelő állomáson lényegesen hatékonyabb.

### 4.4 A hét erőforrás

| Erőforrás | Csoport | Mire kell | Ki költi |
|---|---|---|---|
| **Üzemanyag** | fizikai | ugrások a csillagtérképen | közös |
| **Élelem** | fizikai | heti fogyás a legénységszám szerint | közös |
| **Hajótest** | fizikai | a hajó integritása; nullán vége | Rúnaszövő javítja |
| **Legénység** | emberi | állomások betöltése, partraszállás | közös felvétel |
| **Morál** | emberi | alacsonyan: hibák, lázongás, kilépők | közös |
| **Információ** | absztrakt | kutatási projektek, megfejtés | Múltidéző |
| **Kredit** | absztrakt | vásárlás, felvétel, kereskedés | közös |

### 4.5 Hatáskörök: mi közös, mi a tiéd

Mindkét játékos **ugyanolyan súlyú** — ugyanannyi döntést hoz, egyik sem asszisztens. A
megosztás **hatáskör szerint** történik, nem szerep szerint:

**Rúnaszövő — mérnöki hatáskör.** Kohó és Fegyverzet, hajótest-javítás, modulépítés,
üzemanyag-szintézis, rúnaszövés. Az ő döntése, hogy a hajó *fizikailag* mit tud.

**Múltidéző — kutatási hatáskör.** Labor, Archívum, Érzékelő, kutatási projektek, idegen
technológia elemzése, jelfejtés. Az ő döntése, hogy a hajó *mit ért meg* a világból.

**Közös:** energia-elosztás, útvonal, küldetésvállalás, legénységfelvétel, morális dilemmák,
Gyógyító és Szentély (az emberi ügyek).

### 4.6 Legénység — nevesített emberek

Minden legénységtagnak van:
- **név** és rövid háttér
- **szakterület** (mérnök / tudós / őr / gyógyító / navigátor)
- **1-2 jellemvonás** — pl. *bátor* (veszély után morált ad), *kétkedő* (kevesebb morál, több
  Információ), *idegen származású* (bónusz az idegen technológiához), *veterán*, *fiatal*
- **partraszálló képesség**: ha beszáll a csapatba, egy kis kártyakészletet ad a taktikai
  küldetésre

Ez ad érzelmi tétet, amit roguelite-ban nehéz elérni: **a legénységtagok meghalhatnak**, és
mindenki emlékezni fog arra, ki miatt vesztettétek el őket.

### 4.7 Csillagtérkép és utazás

Csomópontos térkép (rendszerek és útvonalak), generálva minden expedícióhoz. Egy ugrás **1-3
hét**, a Hajtómű energiájától és a távolságtól függően, és üzemanyagot fogyaszt.

A rendszerekben: romok, elhagyott állomások, anomáliák, lakott világok, kereskedelmi
pontok, vészjelzések. Az Érzékelő energiája dönti el, mennyit látsz előre — tehát a
felderítés maga is befektetés.

### 4.8 A Kapu — az időnyomás

Egy hetekben mért visszaszámlálás (rövid ~15, közepes ~25, hosszú ~40 hét). **Minden hét
fogyaszt egyet.**

A számláló négy **Sötétedés-szinten** megy át. Minden szinttel:
- erősebb ellenségváltozatok jelennek meg,
- a globális modifikátorok csúnyábbak lesznek,
- a reaktor kimenete csökken (a galaxis maga eszi az energiát).

A számláló **elég bőkezű ahhoz, hogy egy célra tartó útvonal kényelmesen beférjen** — a nyomás
abból jön, hogy minden kitérő, minden extra kutatás, minden megmentett hajó *heteket kér*. Ez
teszi az útvonalválasztást igazi döntéssé.

### 4.9 Kutatás — két ág, egy készlet

Az **Információ** a Múltidéző valutája, és **két ágra** költhető:

**Technológia-ág** — azonnali képesség: hajómodulok, reaktor-fejlesztés, új rúnatípusok, új lapok
az osztályaidhoz, hatékonyabb állomások.

**Megfejtés-ág** — a világ titkai: mi történt ezzel a galaxissal, mik az isten-gépek, mi fejezte be
őket. **Ez nyitja a végjáték lehetőségeit** és az Archívum bejegyzéseit. A Jelfejtés-feladványok
közvetlenül ide táplálnak be.

A dilemma szándékosan éles: **a megfejtés nem ad harci előnyt.** Nem lesz tőle erősebb a hajó és
nem lesznek jobbak a lapjaid — mégis ez a győzelem kulcsa. Tehát a tisztán optimalizáló út
*nem* a helyes út, és ezt a játékosnak magának kell felfedeznie.

### 4.10 Győzelem — a galaxis szíve

Van egy végső helyszín: **a Csillagsír**, a galaxis szíve. A cél eljutni oda, mielőtt a Kapu
bezárul.

És itt a csavar: **a megfejtés-szintetek dönti el, mit tudtok ott egyáltalán *tenni*.** Ugyanaz a
helyszín, de teljesen más végkifejlet:

| Megfejtés | Mit tehetsz a Szívben |
|---|---|
| alacsony | csak elmenekülhetsz, vagy vakon elpusztítod, amit találtál |
| közepes | megtudod, mi történt — és haza tudod vinni a tudást |
| magas | felismered, mi *történik éppen*, és beavatkozhatsz |
| teljes | a legmélyebb végkifejlet: érted, miért nem háború volt |

Ez az igazi újrajátszási motor. **Az első futamokban nem is fogod érteni, mit láttál** — és pont
ez a jó benne. Az Archívum minden expedíció után közelebb visz.

### 4.11 Vereség — mikor ér véget egy expedíció

| Feltétel | Következmény |
|---|---|
| **Hajótest nullán** | a hajó elveszik, az expedíció véget ér |
| **Morál nullán** | a legénység megtagadja a parancsot, az expedíció megszakad |
| **A Kapu bezárul** | ott ragadtok — külön, saját végkifejlet, nem csak kudarc |
| **Élelem elfogy** | *nem* azonnali vég: morál-zuhanás és legénységveszteség, tehát egy spirál, amiből még ki lehet mászni |

**Ha egy partraszálló küldetés balul üt ki**, az *nem* a futam vége: felhúzzák őket a hajóra.
Veszteség: kezelendő sebek, elmaradt zsákmány, 1-2 elvesztett hét, és jó eséllyel egy halott
legénységtag. Fáj, de nem viszi el az estét.

### 4.12 Mentés

**Automatikus mentés minden hét és minden küldetés után**, egy folyó futam, visszaújratöltés
nélkül. A döntések súlya megmarad, de sosem veszítitek el a munkát, ha be kell fejezni az estét.

*Technikai megjegyzés:* a mentés böngészőben él, de **legyen exportálható fájlba** — egy törölt
böngésző-adat nem vihet el egy 25 hetes expedíciót.

---

## 5. Találkozások — a játék tartalmi motorja

Ezek a legfontosabb narratív helyzetek, és itt születnek a történetek. Nem külön csomópontok,
hanem menet közben és rendszerekbe érkezéskor jönnek elő.

Példák:
- **Sodródó hajó.** Átszálljunk? A pajzs energiája dönti a kockázatot. Jutalom lehet
  alkatrész, legénység, vagy egy napló, ami előrelendíti a történetet — de lehet átszálló csata is.
- **Vészjelzés.** Kitérő három hetet kér. Vállaljuk?
- **Idegen technológia.** Beépítsük a hajóba? Erős bónusz, de valamit visz is — és nem tudod
  előre, mit, csak ha a Labor előbb elemzi.
- **Menekültek.** Felvesszük őket? Több élelem-fogyás, de legénység és morál.
- **Kereskedő-raj.** Kredit, üzemanyag, alkatrész — mit adsz el, hogy mit vegyél?
- **Ősi jelzés.** Nem tudod, mi az, amíg oda nem mész.

A döntéseknek **következményük van a futam hátralevő részére**, és a történet ágai zárnak és
nyílnak. Az elágazó eseménykészlet fokozatosan bővül, az Archívum feloldásaival.

---

## 6. A taktikai réteg: partraszállás

Amikor leszálltok valahol, átkerültök egy **10x10-es négyzetrácsra**. A csapat: **a két hős +
opcionálisan egy legénységtag.**

### 6.1 Küldetéstípusok

**Felderítés (⅓)** — nincs ellenség, vagy elkerülhető. A kihívás a terep: záródó ajtók,
összeomló szerkezetek, mérgező zónák, időkorlát, mentés, begyűjtés. Ugyanaz a kártya-ökonómia,
de a lapokat mozgásra és problémamegoldásra kell osztani.

**Logikai feladvány (⅓)** — a rács közepén (vagy több pontján) egy generált rejtvény. Odáig el
kell jutni, aztán meg kell fejteni. A teljes katalógus a **6.8** pontban.

**Harc (⅓)** — a klasszikus taktikai összecsapás. Plusz: **átszálló védelem**, amikor a hajót
támadják meg, és a hajó belseje a térkép — ott a modulok a rácson állnak, és ha elpusztulnak,
elveszik a bónuszuk az expedíció hátralevő részére.

### 6.2 Kártyaökonómia

- Mindkét hősnek van egy **készlete** (jelenleg **13 lap** osztályonként), amiből az expedíció
  előtt **aktív kezet** állít össze. Ez a "build".
- **Körönként két lapot** játszik ki: az egyik lap **felső**, a másik lap **alsó** felét. Minden
  lap kétféleképp hasznos, tehát minden kijátszás fájdalmas döntés.
- A kijátszott lapok az **elhasznált** kupacba mennek (vagy véglegesen elveszhetnek).
- **Pihenéssel** visszakapod az elhasználtakat — de minden pihenéskor **véglegesen elveszítesz
  egyet.**
- Két óra jár egyszerre: **életerő** és **kifáradás**. Egy hős akkor is kiesik, ha nem tud lapot
  játszani.

### 6.3 Kártya anatómia

```
┌──────────────────────────────┐
│  KEZDEMÉNYEZÉS: 34           │  ← ez határozza meg, hol lépsz a körben
│  Név                         │
├──────────────────────────────┤
│  FELSŐ FÉL                   │  ← támadás / erős hatás / feladvány-eszköz
│  ◇ rúnafoglalat   ⟐ Töltet   │
├──────────────────────────────┤
│  ALSÓ FÉL                    │  ← mozgás / támogatás / terepkezelés
│  ◇ rúnafoglalat              │
├──────────────────────────────┤
│  ⟳ elhasznált  /  ✕ elveszett │
│  ⚒ ◈ próbatétel-szimbólumok  │  ← nem-harci helyzetek fizetésére
└──────────────────────────────┘
```

### 6.4 Kezdeményezés — a közös tervezés motorja

1. Minden ellenség **felmutatja a szándékát**: hova megy, kit támad, mennyit sebez, milyen
   kezdeményezéssel.
2. A két játékos **kiválasztja a lapjait**, és eldönti, melyik adja a hőse kezdeményezését.
3. Mindenki **kezdeményezés-sorrendben** lép.

Mivel az ellenség terve látható, a kör egy **közösen megtervezett koreográfia**. Nem az
információ titkolása adja a feszültséget, hanem a közös rejtvény — és pont ez az, ami egy
monitor előtt kettesben működik.

### 6.5 Kombók — az összekapcsolódás

| Állapot | Ki teszi fel | Mit ad a párjának |
|---|---|---|
| **Horgony** | Rúnaszövő | a megjelölt nem tud elmozdulni, és a területhatások +1 sebzést tesznek rá |
| **Rúnajel** | Múltidéző | a megjelöltre a közelharci támadás +2, és ha megöli, Töltet jár |
| **Kötelék** | passzív, ha 2 mezőn belül vagytok | mindkettőtöknek +1 sebzés |
| **Előkészítés** | ledöntés, hátralökés, elvakítás | pozicionális előny a másiknak |

Kölcsönös: mindkét hős tud előkészíteni és kihasználni.

**A Vért felső korlátja 3.** Enélkül a pajzsoló ellenségek korlátlanul halmozták, és mivel a
Vért minden találatból levon, a kis sebzésű támadások nullát tettek. A korlát megtartja a
páncélt értékes befektetésnek, de nem engedi fallá nőni.

### 6.6 Töltet — a réteg-összekötő erőforrás

A küldetés kezdetén kapott Töltet mennyiségét **az határozza meg, mennyi energiát adtatok a
héten a Rúnamagra.** Egy közös készlet, amiből mindketten költhetitek az erős képességeket —
tehát a küldetés alatt is folyamatos egyeztetés.

### 6.7 Próbatétel lapokkal

Nem-harci helyzetekben (romok, anomáliák, találkozások) **lapokkal fizetsz a kezedből**:

```
"A kapu belső gyűrűjén rúnák futnak, amiket senki nem faragott."

  ▸ Erővel kinyitni       — veszíts el 2 lapot ⚒ szimbólummal
  ▸ Megérteni a mintát    — veszíts el 2 lapot ◈ szimbólummal
  ▸ Töltettel átégetni    — 3 Töltet
  ▸ Továbbmenni           — nincs költség, nincs jutalom
```

Nincs új rendszer, ugyanazzal az erőforrással játszol, mint a harcban — és igazán fáj, mert amit
itt elveszítesz, az a következő küldetésen hiányzik.

### 6.8 Feladványkatalógus

**Alapelv — nyelvfüggetlenség.** A játék magyarul és angolul is fut, de **egyetlen feladvány sem
támaszkodik nyelvre.** Minden rejtvény szimbólumokból, geometriából, számokból és térbeli
viszonyokból megfejthető. Nincs szójáték, anagramma, betűszámolás, keresztrejtvény, se olyan
helyzet, ahol egy magyar vagy angol szó ismerete előny. A megoldás mindig kattintás vagy
elhelyezés, nem beírás. Ez nem csak fordítási kérdés: így a rejtvények **generálhatók és gépileg
ellenőrizhetők** is, tehát garantálhatjuk, hogy minden példány megoldható.

**Két családba tartoznak:**

*Rácson játszódók* — ugyanazt a taktikai motort használják, tehát mindkét hős mozog és
együtt dolgozik. Kevés extra kód, mert a rács már megvan.

| Feladvány | Mechanika | Hol jön elő | Jutalma |
|---|---|---|---|
| **Gravitációs magok** | ősi magokat kell tolni a helyükre a rácson (Sokoban-logika), a hősök különböző irányból tudnak tolni | isten-gépek újraindítása | energia, hajómodulok |
| **Biztos talaj** | a padló egy része összeomlik; szomszédsági jelzésekből kell kikövetkeztetni, mely mezők biztonságosak | romok, összeomló szerkezetek | átjutás, zsákmány |
| **Fénytörés** | rúnafény-nyalábot kell tükrökkel és prizmákkal célokra terelni; a hősök forgatják az elemeket | templomok, zárt szentélyek | ereklyék, rúnák |

*Panelen játszódók* — egy szerkezetre kattintva nyílnak, és a rács szünetel közben. Ezek a
„leülünk és együtt gondolkodunk" pillanatok.

| Feladvány | Mechanika | Hol jön elő | Jutalma |
|---|---|---|---|
| **Energia-útvonaltervezés** | korlátozott kapacitású vezetékeken kell energiát célokhoz vezetni, sérült hálózatban | erőművek, hajójavítás, zárt ajtók | rendszer-hozzáférés, energia |
| **Rúnadekódolás** | rúnasorozat kitalálása részleges visszajelzésekből (Mastermind-logika) | zárak, ereklye-aktiválás | ereklyék, rúnák |
| **Rezonancia-hangolás** | több tárcsát kell egyszerre beállítani, de mindegyik hat a szomszédaira (Lights Out-logika) | kórus-kapuk, jeladók | idegen technológia |
| **Jelfejtés** | idegen jelrendszer *kompozíciós szabályait* kell kikövetkeztetni: melyik alakelem mit módosít. Ismert részfordítások **ikonokkal** adottak, és a válasz is ikonválasztás — nulla nyelvi tartalom | feliratok, naplók, isten-gépek | **a fő történet megfejtése**, Archívum |
| **Csillagtérkép-illesztés** | térképtöredékeket kell forgatni és illeszteni, hogy kirajzolódjon egy rejtett hely | ősi archívumok, hajónaplók | **új helyszínek a csillagtérképen** |
| **Egyensúly-mérleg** | ereklyék relatív súlyát kell kikövetkeztetni összehasonlításokból | kincskamrák, áldozati oltárok | ereklyék, Információ |

**Miért ennyi?** Mert mindegyiknek **más a gondolkodási módja** (deduktív, térbeli, útvonalkeresés,
állapotátmenet, összehasonlítás) és **más a jutalomterülete** — tehát nem csereszabatosak, és
mindegyik számít. A Csillagtérkép-illesztés például szó szerint **új helyeket nyit a
csillagtérképen**, ami visszahat a stratégiai rétegre: a feladvány megfejtése konkrét úti célt ad.

**Nehézségi skálázás.** Minden típusnak van egy méret- és megszorítás-paramétere, ami a Sötétedés
szintjével és az Archívum előrehaladásával nő. Generáláskor a megoldó egyszerre ellenőrzi, hogy
(a) van megoldás, és (b) **nem kell tippelni** — csak logikával levezethető.

---

## 7. A két induló hős

Mindkettő ugyanolyan súlyú. Csak a *készletük* teljesen más.

### Rúnaszövő — a terepformáló
Közelharcos építő, aki **átrendezi a csatateret**: vért magára és a párjára, csapdák, rúnaoszlopok
és falak emelése (blokkoló terep, ami látótávolságot is vág), hátralökés, ledöntés, **Horgony**.
Erős egycélú sebzés, rövid hatótáv, lassú kezdeményezés. Felderítő küldetéseken ő nyit utat és
stabilizál összeomló szerkezeteket.

### Múltidéző — a mintaolvasó
Távolsági rontómágus, aki **a saját elhasznált lapjaival játszik**: területhatású rontás és
gyengítés, **Rúnajel**, és a **Visszhang** — Töltetért újra kijátszhat egy hatást az elhasznált
kupacából. Ő az, aki *jól bánik* a kifáradással, míg a Rúnaszövő csak elszenvedi. Törékeny,
gyors kezdeményezés. Feladvány-küldetéseken ő ad tippeket és részinformációt.

A párosítás azért működik, mert a két hős **más erőforrással gazdálkodik**: a Rúnaszövő térrel
és páncéllal, a Múltidéző lapokkal és Töltettel.

---

## 8. Változatosság — négy forrásból

**1. Procedurális térképek és küldetések.** Csillagtérkép generálva. A küldetéstérképek
szoba-építőkészletből (10x10): szobadarabok, folyosók, terepelemek (fedezék, szakadék,
rúnaoszlop, hamukupac). Biome-készletek: hajóbelső, ősi templom, holt bolygófelszín,
kristályerdő.

**2. Random ellenségek és modifikátorok.** Induló ellenségkészlet:
- **Hamvadó váz** — közelharci horda, kevés életerő
- **Rúnaőrző** — távolsági, pajzsot ad a társainak
- **Kórus-fantom** — gyors, Töltetet szív
- **Istengép-töredék** — lassú, hatalmas területsebzés

Mindegyiknek van egy **szándék-készlete** (3-4 szándék), amiből a kör elején felmutat egyet.
Globális modifikátorok (még nincs megírva): rúnavihar, instabil gravitáció, sűrű hamu, néma tér.

**3. Random rúna- és kutatáskínálat.** Minden expedícióban más rúnák, más kutatási projektek,
más legénységtagok — ugyanaz a hős is máshogy épül fel.

**4. Elágazó történet és találkozáskészlet.** Írott helyzetek döntésekkel, amik ágakat zárnak és
nyitnak.

**Megvalósítási sorrend:** az 1-2-3 generatív, tehát kevés kézi munkával sok változatosságot ad
→ ezek jönnek először. A 4. (írott tartalom) fokozatosan bővül, és később is korlátlanul
szórható a játékba.

---

## 9. Meta-fejlődés: az Archívum

Minden expedíció — még a kudarcos is — hazaküldi az adatait a Kapun át. Ebből épül az
**Archívum**, és ahogy nő, feloldja:
- új hősosztályokat (Árnyékfutó, Kórus-őr, Gépelme-lovas, Idő-hajlító…)
- új lapokat a meglévő osztályokhoz
- új hajómodulokat, rúnatípusokat, kutatási projekteket
- új legénységtagokat, ellenségeket, biome-okat, találkozásokat
- a fő történet mélyebb rétegeit (a jelfejtés itt kamatozik)

**Nem erősödést old fel, hanem tartalmat.** A világ gazdagodik, nem könnyebbé válik — tehát a
huszadik futam is izgalmas.

---

## 10. Fokozatos bevezetés

A bevezetés **az első expedícióhoz kötődik, nem minden futamhoz:**

- 1-3. hét: csak alap állomások és alap lapok, nincs rúna, nincs Töltet
- 4-8. hét: megjelenik a Rúnamag és a Töltet, első feladvány
- 9. héttől: rúnafoglalatok, kutatási projektek, idegen technológia
- utána minden nyitva, és az Archívum további rétegeket ad

---

## 11. Grafika

**Stilizált, lapos 2D.** Sziluettek, kevés részlet, erős korlátozott paletta, sok izzás és
rúnafény. Új figura gyorsan készül, a rácson kitűnően olvasható, és a melankolikus hangulat
kifejezetten jól áll neki.

Paletta:
- alap: hamuszürke és mélykék — hideg, halott világ
- rúnafény: izzó borostyán — a mágia, ami még ég
- technológia és visszhang: hideg ciánkék
- veszély: tompa vörös

---

## 12. Amit tudatosan kezelnünk kell

**Az alfa-játékos probléma.** Nyílt információs co-opban könnyen kialakul, hogy az egyik játékos
dönt mindkettő helyett. Beépített ellenszerek: két külön hatáskör a hajón (mérnöki és kutatási),
két teljesen más kártyakészlet más erőforrásokkal, és a közös döntések ott vannak, ahol az
egyeztetés *maga a játék* (energia-elosztás, útvonal, morális dilemmák, a kör koreográfiája).

**A heti kör tempója.** Ha egy nyugodt utazó-hét is 3 percet visz, a játék elviselhetetlen lesz.
Ezért kell az állandó beállítás elve, és ezért kell, hogy a hetek nagy része **egy kattintás**
legyen. Ez tesztelés közben mérendő szám.

**A küldetés hossza.** A "kicsi és sűrű" döntés kritikus. Ha egy küldetés 25 perc fölé megy, egy
este alatt nem érzitek a haladást.

**A tartalommennyiség.** Négy változatosság-forrás sok tartalmat jelent. Generatív rendszerek
először, kézzel írt tartalom utána, folyamatosan.

---

## 13. Technológia

| Döntés | Miért |
|---|---|
| **Vite + React + TypeScript** | A stratégiai réteg lényegében egy összetett felület, és abból lesz a játék nagyobb része. A Vite azonnali újratöltése balanszoláskor aranyat ér. |
| **SVG a rácshoz és a feladványokhoz** | A lapos, sziluettes stílus pont SVG-re való: éles minden felbontáson, könnyű rákattintani, a paletta CSS-változóból jön. |
| **A szabálymotor tiszta TypeScript, React nélkül** | Külön `engine/` mappa, ami semmit nem tud a felületről. Gépileg tesztelhető, és ugyanaz a motor kiszolgálja majd a felderítő küldetéseket és az átszálló csatákat is. |
| **Magvezérelt véletlen** | Minden csatának van egy magja. Ha valami hibás vagy igazságtalan, pontosan újra elő tudjuk állítani. |
| **Tartalom tipizált adatfájlokban** | A lapok, ellenségek, szándékok külön fájlokban, ahol csak számokat kell átírni. A TypeScript viszont szól, ha elírsz valamit. |
| **Angol kód, kétnyelvű felület** | A kód azonosítói és kommentjei angolok. A játékos szövegei minden tartalomfájlban `{ hu, en }` párként állnak, közvetlenül a szám mellett, amit leírnak. A napló szerkezetű eseményekben él, nem kész mondatokban — ezért vált át visszamenőleg is. |
| **Csak helyben fut** | Nincs szerver, nincs fiók, nincs költség. Egy gépen játszotok, tehát semmi másra nincs szükség. |

---

## 14. Megvalósítás állapota

**A játék kész és végigjátszható.** Indítás, parancsok és felépítés:
[README.hu.md](README.hu.md). Szabályok: [RULES.hu.md](RULES.hu.md).

Ami a tervből megvalósult, gyakorlatilag hiánytalanul: a stratégiai réteg (heti kör,
energia-elosztás, állomások, legénység, hét erőforrás, csillagtérkép, Kapu és Sötétülés,
kutatás két ággal, piac, találkozások), a taktikai réteg (öt küldetéstípus, kártyaökonómia,
kezdeményezés, kombók, Töltet, kifáradás, csapdák, omló padló), mind a kilenc feladvány,
a Csillagsír megfejtés-vezérelt befejezései, az Archívum, az automatikus mentés és a
valós idejű magyar/angol nyelvváltás minden képernyőn.

### Amiben eltértünk a tervtől — és miért

1. **A feladványok saját panelen futnak, nem a taktikai rácson.** A terv szerint három
   feladvány (Gravitációs magok, Biztos talaj, Energiavezetés) a csataréteget használta volna.
   Írás közben kiderült, hogy ez két dolgot ront el: a rács kattintási nyelvezete a harcra van
   szabva (célzás, mozgás, felezés), és egy feladvány közben ez félrevezető; a kilenc feladvány
   pedig **egységesen** kezelhető, ha mindnek ugyanaz a kerete van. Így egyetlen `PuzzleView`
   szolgálja ki mindet, és a generátorok tisztán tesztelhetők a felület nélkül.
2. **A dobópakli a küldetések között visszatér, az elveszett lap nem.** A terv nem mondta ki,
   hogy a kifáradás meddig tart. Ha a dobópakli is átjönne, minden küldetés csonka kézzel
   indulna, és a hosszú expedíció matematikailag reménytelen lenne; ha minden visszatérne, a
   pihenés súlya elszállna. A kettő közötti vonal: **amit magadtól dobtál el, azt a hajón
   rendezed; amit örökre elvesztettél, az az expedíció vesztesége.**
3. **A morál cél felé sodródik, nem lineárisan mozog.** Playteszt-botolásból: lineáris
   csökkenéssel a 4. hétre nullázódott, és nem volt visszaút. A célérték-modell ugyanazt a
   nyomást adja (rossz körülmények → alacsony morál), de **javítható**, és ez sokkal jobb
   döntési helyzet.
4. **A morál kikerült az erőforráslistából.** A tervben hét erőforrás volt egy listában, de a
   morál nem gyűjtögethető, hanem *állapot* — saját szabály kellett neki.
5. **Opcionális assetek.** A terv csak listát ígért. Végül a kód *be is köti* őket úgy, hogy
   a hiányuk csendes: hang, portrék és kártyaképek működésbe lépnek, amikor a fájl megjelenik,
   és addig semmi nem hivatkozik rájuk (lásd `src/ui/assets.ts` és
   [public/assets/README.md](public/assets/README.md)).

### Balanszdöntések, amiket a tesztelés kényszerített ki

Ezek nem tervezői ízlésből, hanem mérésből és playtesztből jöttek; a teljes lista a README
balansz-naplójában áll, itt csak a tervet érintő tanulságok:

- **A kártyaveszteség jó, a kártyaszűke nem.** A 13-as kéz és a kézzel választott veszteség
  megőrzi a kifáradás drámáját anélkül, hogy a második küldetés már kilátástalan lenne.
- **A defenzív ellenfél a legkockázatosabb tervezői elem.** A Rúnaőrző korlátlan pajzsa nem
  „nehéz” volt, hanem *lassú* — és a lassúság sokkal rosszabb. Innen a `SHIELD_MAX = 3` és az
  a szabály, hogy két Őrző soha nem kerül egy pályára.
- **A logisztikai spirálokat lineárisan skálázni halálos.** Az életfenntartás és az élelem
  igénye a legénységgel arányosan nőtt, ami minden felvett emberrel közelebb hozta a véget:
  pontosan az ellenkezője annak, amit egy legénységgyűjtő játék akar.
- **Az időnyomás legyen bőkezű, a *kerülőút* legyen drága.** A Kapu-számláló így nem azt
  mondja, hogy „siess”, hanem azt, hogy „mit hagysz ki” — és ez a stratégiai réteg egész
  döntéshozását átalakítja.

### Ami hátravan

1. **Játékteszt kettesben.** Ez az egyetlen dolog, amit gép nem tud elvégezni. A csavarok
   helye a README táblájában.
2. **Assetek** — hang és portrék; a kód már várja őket.
3. **Ambient zene** — a két loop szándékosan nincs bekötve, mert kell hozzá egy külön kapcsoló
   és egy halkítási szabály a csata alatt.
4. **Tartalombővítés** — a szűk keresztmetszet nem a rendszer, hanem a *szöveg*: több
   találkozás, több kutatási projekt, több ellenségtípus, egy harmadik hősosztály. Mindegyik
   pusztán `content/`-fájl, motorváltozás nélkül.
