# Assets — élő kívánságlista / living wishlist

**Képformátum röviden / Image formats in short:** minden kép lehet `.webp` vagy `.png`;
a hangok `.mp3`-ak. — every picture may be `.webp` or `.png`; sounds are `.mp3`.

**HU:** A játék **egyetlen letöltött fájl nélkül is teljes**: minden alakzat kódból
rajzolódik, minden esemény olvasható a naplóból. Ezek a fájlok tehát *javítanak*, nem
lehetővé tesznek. A kód **pontosan az itt megadott néven** keresi őket a megadott
mappában, és ha nincs ott, akkor **csendben** nincs ott: nincs hibajelzés, nincs törött
kép ikon, nincs lyuk a felületen. Egy fájlt bármikor beteszel, frissítesz, és ott van.

**EN:** The game is **complete without a single downloaded file**: every shape is drawn
from code and every event is legible from the log. These files therefore *improve* the
game rather than enable it. The code looks for **exactly the names listed here** in the
given folder, and when one is absent it is absent **quietly**: no error, no broken-image
icon, no gap in the layout. Drop a file in, reload, and it is there.

**Jelölés / Marking:** ☐ = még nincs / not yet · ☑ = a fájl megvan / the file is here

**Be van kötve? / Wired up?** A táblázatok „Be" oszlopa azt mondja, hogy a **kód**
használja-e már: ✔ = igen, tedd be és látszik/hallatszik · — = még nincs bekötve, előbb
szólj. — The "In" column says whether the **code** already uses it: ✔ = yes, drop it in
and it shows up · — = not wired yet, ask me first.

**Licenc / Licence:** legyen szabadon használható (CC0, CC-BY, vagy megvásárolt licenc).
Ha CC-BY, írd a szerzőt a táblázat mellé. — Must be free to use (CC0, CC-BY, or a
purchased licence). If CC-BY, note the author next to the table.

**Hangulat / Mood:** mitikus és melankolikus, nem hollywoodi. Kevés hang, sok tér, sötét
alaptónus. — Mythic and melancholic, not Hollywood. Few sounds, plenty of space, a dark
base tone.

---

## 1. prioritás — Hangok / Sounds (`audio/`)

**HU:** Ez adja a legnagyobb élménybeli ugrást a legkevesebb munkával. Egy körökre osztott
játékban a hang az, ami a kattintást *tettnek* érezteti. **Mind be van kötve**, és a
naplóból vezérelve szólal meg — vagyis pontosan akkor, amikor a napló is ír róla. A
fejlécben van egy `♪` gomb, amivel elhallgattathatod.

**EN:** The biggest jump in feel for the least work. In a turn-based game sound is what
makes a click feel like an *act*. **All of these are wired**, and they are driven by the
log — they sound exactly when the log says something happened. There is a `♪` button in
the header to silence them.

| Kész | Be | Fájl | Mikor szólal meg / When it plays | Hossz |
|---|---|---|---|---|
| ☐ | ✔ | `audio/hit.mp3` | Sebzés, csapda, beszakadó padló · Damage, a trap, a floor giving way | ~0,3 s |
| ☐ | ✔ | `audio/shielded.mp3` | Vért felfogja a találatot, vagy Vért kerül valakire · Shield absorbs a hit, or Shield is granted | ~0,3 s |
| ☐ | ✔ | `audio/defeated.mp3` | Egy egység elesik vagy kimerül · A unit falls or is exhausted | ~0,6 s |
| ☐ | ✔ | `audio/heal.mp3` | Gyógyítás · Healing | ~0,4 s |
| ☐ | ✔ | `audio/rest.mp3` | Pihenés — egy lap örökre elveszik · Resting — a card is lost forever | ~0,5 s |
| ☐ | ✔ | `audio/relic.mp3` | Relikvia felvéve, vagy a kijárat elérve · A relic picked up, or the exit reached | ~0,5 s |
| ☐ | ✔ | `audio/week.mp3` | Eltelt egy hét (mély, halk gong) · A week passed (a deep, soft gong) | ~0,8 s |
| ☐ | ✔ | `audio/research.mp3` | Kutatás kész, modul beépítve, megértés nőtt · Research done, module installed, understanding gained | ~0,6 s |
| ☐ | ✔ | `audio/puzzleSolved.mp3` | Feladvány megoldva (tiszta, felfelé tartó) · A puzzle solved (clean, ascending) | ~1 s |
| ☐ | ✔ | `audio/missionWon.mp3` | Küldetés siker (visszafogott, nem fanfár) · Mission won (restrained, not a fanfare) | 2–4 s |
| ☐ | ✔ | `audio/missionLost.mp3` | Visszavonulás, legénység elvesztése, morálösszeomlás · Withdrawal, a lost crew member, morale collapse | 2–4 s |
| ☐ | ✔ | `audio/ending.mp3` | Megérkezés a Csillagsírba · Arriving at the Stargrave | 4–8 s |
| ☐ | — | `audio/ambient-battle.mp3` | **Loopolható** ambient: mély drone, halk fémes zörejek · **Loopable** ambience: deep drone, faint metallic noises | 2–4 perc |
| ☐ | — | `audio/ambient-ship.mp3` | **Loopolható** hajóbelső: lassú lélegzés, távoli gépzaj · **Loopable** ship interior: slow breathing, distant machinery | 2–4 perc |

**Formátum / Format:** `.mp3` (a név pontosan a fenti, kisbetű-nagybetű is számít!).
Effektek monóban is jók, csúcs kb. −18 dBFS, fájlonként 200 KB alatt. — `.mp3` (exact
name, case-sensitive). Effects can be mono, peak around −18 dBFS, under 200 KB each.

A két ambient loop szándékosan nincs bekötve: zenét nem akarok engedély nélkül elindítani,
és a loopoláshoz kell egy kis-kis kapcsoló a felületen. Ha beteszed őket, szólj, és
bekötöm. — The two loops are deliberately not wired: I will not start music without being
asked, and looping needs its own switch. Drop them in and say the word.

---

## 2. prioritás — Portrék / Portraits (`portraits/`)

**HU:** Az oldalsávban (hősök, ellenfelek) és a hajón (legénység) jelennek meg, 44×44
pixeles bélyegként. **A rácson maradnak a sziluettek**, mert azok olvashatóbbak. Mind be
van kötve.

**EN:** These appear in the sidebar (heroes, enemies) and on the ship (crew) as a 44×44
thumbnail. **The grid keeps its silhouettes**, because those read better. All wired.

| Kész | Be | Fájl | Mi legyen / What it should be |
|---|---|---|---|
| ☑ | ✔ | `portraits/hero-runesmith.webp` | Páncélos, súlyos alak; borostyán rúnafény a fémen · An armoured, heavy figure; amber rune light on metal |
| ☑ | ✔ | `portraits/hero-echoreader.webp` | Törékeny, csuklyás alak; hideg ciánkék fény · A fragile, hooded figure; cold cyan light |
| ☑ | ✔ | `portraits/enemy-ash-husk.webp` | Hamuból álló, összeomló váz · A collapsing husk made of ash |
| ☑ | ✔ | `portraits/enemy-rune-sentinel.webp` | Álló, pajzsos gépi őrszem · A standing, shielded mechanical sentry |
| ☑ | ✔ | `portraits/enemy-choir-wraith.webp` | Alaktalan, éneklő jelenés · A formless, singing apparition |
| ☑ | ✔ | `portraits/enemy-godmachine-shard.webp` | Hatalmas gépdarab, ami valaha isten volt · A vast machine fragment that was once a god |
| ☑ | ✔ | `portraits/crew-engineer.webp` | Gépész: kormos kéz, szerszám · Engineer: sooty hands, a tool |
| ☑ | ✔ | `portraits/crew-scientist.webp` | Tudós: műszer, jegyzet, hideg fény · Scientist: an instrument, notes, cold light |
| ☑ | ✔ | `portraits/crew-guard.webp` | Testőr: páncélzat, zárt arc · Guard: armour, a closed face |
| ☑ | ✔ | `portraits/crew-medic.webp` | Orvos: fáradt, figyelmes · Medic: tired, attentive |
| ☑ | ✔ | `portraits/crew-navigator.webp` | Navigátor: csillagtérkép tükröződése a szemben · Navigator: a star chart reflected in the eye |

**Formátum / Format:** `.webp` **vagy `.png`** (amelyik éppen van — a kód mindkettőt
megtalálja, előbb a `.webp`-et keresi), 256×256 px, **sötét vagy átlátszó háttérrel** (a
felület sötét, a világos háttér kivágottnak látszana). A név a kiterjesztés előtt akkor is
pontosan a fenti. — `.webp` **or `.png`** (whichever you have; the code finds both and
looks for `.webp` first), 256×256, **dark or transparent background** (the interface is
dark; a light background would look cut out). The name before the extension must still
match exactly.

**HU: Nagy képet töltöttél le? Semmi baj.** Ha a fájl nem 256×256 (a generált és
stock képek tipikusan 1000×1400 körül, 2 MB-osak), akkor tedd be, és futtasd:

```
npm run assets:fit
```

Ez megkeresi az alakot a sötét háttéren, négyzetre vágja körülötte, 256×256-os `.webp`-et
ír a helyére, az eredetit pedig átmozgatja az `assets-src/portraits/` mappába (az a
buildbe nem kerül bele, de megmarad). Kiírja, hol vágott — ha valamit rosszul keretezett:

```
node tools/fit-portraits.mjs enemy-ash-husk --rect 130,170,900,900
```

**EN: Downloaded something large? That is fine.** If the file is not 256×256 — generated
and stock art is typically around 1000×1400 and two megabytes — drop it in and run
`npm run assets:fit`. It finds the subject against the dark background, cuts a square
around it, writes a 256×256 `.webp` in its place and moves the original to
`assets-src/portraits/` (kept, but never built). It prints the crop it chose; the
`--rect` form above overrides it when the framing is wrong.

**HU:** A legénységi portrék szakma szerint mennek, nem személy szerint — a nevek
generáltak, és egy expedíció során sok tucat ember megfordulhat a hajón. Ha valamelyik
szakmához több változatot szeretnél, szólj, és bekötöm a `crew-engineer-2.webp` formát is.
— Crew portraits go by speciality, not by person: the names are generated and dozens of
people pass through the ship. If you want several variants per speciality, say so and I
will wire up a `crew-engineer-2.webp` form too.

---

## 3. prioritás — Betűtípus / Typeface (`fonts/`)

| Kész | Be | Fájl | Mi legyen / What it should be |
|---|---|---|---|
| ☐ | — | `fonts/display.woff2` | Címsorokhoz: keskeny, vésett vagy antikva jellegű, kissé archaikus · For headings: narrow, engraved or serif-ish, slightly archaic |
| ☐ | — | `fonts/body.woff2` | Kenyérszöveghez: nagyon jól olvasható sans-serif, kis méretben is · For body text: a very legible sans-serif, even small |

**KRITIKUS / CRITICAL:** a betűtípusnak **teljes magyar karakterkészlete** legyen — `ő ű Ő
Ű` és az összes ékezet. Ez a leggyakoribb csapda: sok szép display font pont az `ő`-t és
`ű`-t hagyja ki. Próbáld ki letöltés előtt ezzel: **„Csillagsír Rúnakovács
Visszhang-olvasó őrző ütköző"**. — The typeface must cover **the full Hungarian character
set**. Many beautiful display fonts omit exactly `ő` and `ű`. Test with the string above
before downloading.

Ez azért nincs bekötve, mert egy `@font-face` a hiányzó fájlra 404-et ír a konzolba, és a
csendes hiány itt nem megoldható ugyanúgy. Tedd be a fájlokat, és **egy sorral** bekötöm.
— Not wired, because an `@font-face` pointing at a missing file logs a 404 and the quiet
fallback does not work the same way here. Drop the files in and it is a one-line change.

---

## 4. prioritás — Kártya-illusztrációk / Card art (`cards/`)

**HU:** Be van kötve: ha ott a fájl, halványan (22% átlátszóság) a lap szövege *mögé*
kerül, mert a szöveggel játszol, nem a képpel. **A fájlnév pontosan a lap azonosítója.**
Ez 26 kép, tehát ne ezzel kezdd — a hangok sokkal többet adnak. Nem baj, ha csak néhány
van meg: a többi lap ugyanúgy működik.

**EN:** Wired: when the file is there it sits *behind* the card text at 22% opacity,
because you play with the words, not the picture. **The filename is exactly the card id.**
26 images, so do not start here. A partial set is fine — the rest simply have no art.

**Rúnakovács / Runesmith:** `rs-hammer-arc`, `rs-iron-ward`, `rs-rune-pillar`,
`rs-earthquake`, `rs-shove`, `rs-set-trap`, `rs-forge-wrath`, `rs-endurance`,
`rs-cast-anchor`, `rs-last-anvil`, `rs-ore-throw`, `rs-charging-cut`, `rs-stand-fast`

**Visszhang-olvasó / Echo-reader:** `er-rune-mark`, `er-ashing-wind`, `er-echo`,
`er-dimming`, `er-choir-shard`, `er-hex-ring`, `er-flux-tap`, `er-memory-shred`,
`er-weakening-song`, `er-silent-command`, `er-ash-veil`, `er-soul-swap`, `er-echo-choir`

**Formátum / Format:** `.webp` **vagy `.png`**, 400×400 px (a lap kétszerese; a kép a lap
egész felületét kitölti, tehát a széleken vághat), sötét alaptónussal. Példa útvonal:
`cards/rs-hammer-arc.webp`. — `.webp` **or `.png`**, 400×400 (twice the card, which the art
covers entirely, so the edges may be cropped), dark base tone.

---

## 5. prioritás — Terep-textúrák / Terrain textures (`terrain/`)

**HU: Óvatosan ezzel.** A rács olvashatósága a legfontosabb, és egy részletes textúra
könnyen elrontja. Csak akkor érdemes, ha nagyon halk és nagyon egyszerű. Ezért nincs
bekötve: ha beteszed, előbb megnézem egy csatában, hogy nem rontja-e el a leolvasást.

**EN: Careful with this one.** Grid readability matters most and a detailed texture easily
ruins it. Only worth it if it is very quiet and very simple — which is why it is not
wired: drop it in and I will look at it in a real battle first.

| Kész | Be | Fájl | Mi legyen / What it should be |
|---|---|---|---|
| ☐ | — | `terrain/floor.webp` | Alig látható kő/fém padlóminta · A barely visible stone/metal floor pattern |
| ☐ | — | `terrain/ash.webp` | Finom hamuszemcse · Fine ash grain |
| ☐ | — | `terrain/wall.webp` | Tömör, nagyon sötét kő · Solid, very dark stone |
| ☐ | — | `terrain/starfield.webp` | A csillagtérkép háttere: sötét, kevés csillag, egy halvány ködfolt · Star-map background: dark, few stars, one faint nebula |

**Formátum / Format:** `.webp` vagy `.png`, 128×128 px, **hézagmentesen ismételhető (seamless)**, nagyon
alacsony kontraszt. A `starfield.webp` kivétel: 1920×1080, nem kell ismételhetőnek lennie.
— seamlessly tileable, very low contrast. `starfield.webp` is the exception: 1920×1080 and
need not tile.

---

## Ellenőrzés / Checking

**HU:** Miután betettél valamit, indítsd el a játékot (`npm run dev`), és nézd meg ott,
ahol lennie kell — portré az oldalsávban, kártyakép a lapokon, hang a `♪` gomb bekapcsolt
állapotában. Ha nem látszik: a fájlnév vagy a mappa nem stimmel (a kis- és nagybetű is
számít, pl. `puzzleSolved.mp3`).

**EN:** After dropping something in, start the game (`npm run dev`) and look where it
belongs — portrait in the sidebar, card art on the cards, sound with the `♪` button on. If
nothing shows, the filename or folder is off (case matters, e.g. `puzzleSolved.mp3`).

## Ha kérdés van / If anything is unclear

**HU:** Ha valamiről nem világos, mekkora vagy milyen legyen, szólj — és ha találsz
valamit, ami nincs a listán, de szerinted jól illene ide, tedd be a mappába, és megnézem,
hogy be tudjuk-e kötni.

**EN:** If a size or style is unclear, just ask — and if you find something that is not on
the list but you think fits, drop it into the folder and I will see whether we can wire it
in.
