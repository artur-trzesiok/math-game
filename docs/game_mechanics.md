# Game mechanics - what the engine offers a lesson

**This is the list of mechanics available today. It is not a limit.** When a lesson would be better with a mechanic
that is not on this list, ask the operator (the user) whether to add it: describe what the child does on screen, why
the lesson needs it and what it costs (engine code, pictures, sounds). Never water a lesson down to this list in
silence, and never build a new mechanic without a yes (guidelines.md, "A lesson asks for the tools it needs"). An
accepted mechanic goes into the engine for every lesson, gets a demo on `manager/mechaniki.html?m=<name>` where it
makes sense, and an entry here in the same commit.

**Building one** (the nine of 2026-10-29 were built this way): `export async function <name>(S, ..., opts)` in an engine
file; the child acts with a finger, a wrong move has a visible consequence and calls `onZle` (the lesson says the line -
a mechanic never speaks); everything shown is painted (a tools/* pipeline, looked at before use); every added object is
registered so `S.clear()` removes it; while waiting it sets `S.<name> = {dokoncz}` (the test driver) and works with
`?szybko`. Register it in: `game/engine/player.js` (import, a ctx entry through `wDzialaniu`, the INTERAKCJE set), the
importmap list in `game/index.html` (new engine files), `manager/autopilot.js` (the `dokoncz` driver list),
`manager/mechaniki.html` (a demo), `tools/lessons/montaz.py` (INTERACT), and here.

Every call is on the scene context `c` (a lesson scene is `async (c) => {}`). "Lessons" lists who uses it today
(2026-10-29); "-" means built and waiting for a lesson. Engine details that matter when changing a mechanic are in the
appendix at the end (moved from CLAUDE.md); puppets, feet, walks, meshes, audio and backgrounds stay in CLAUDE.md.

---------------------------------------------------------------------------------------------------------------------

## 1. Pointing and choosing

| call | what the child does | lessons |
|---|---|---|
| `c.task({targets, correct, wrong, hintAfter, onWrong, wszystkie})` | points to the right thing (or to ALL right ones with `wszystkie`); a wrong one shakes and its `wrong` line is said; the hint ladder: after `hintAfter` misses the answer pulses, then a pencil arrow, then the character looks, points and circles it. Characters can be targets (`S.puppets.x`) | all |
| `c.choose(targets)` | a plain pick with no right answer | - |
| `c.memory(pary, {szer})` | turns cards and finds pairs; faces `{obraz}`, `{cyfra}`, `{kropki}` | one_many, morning_night, noticing_order, logical_pairs, counting_5 |
| `c.kubki({ile, rzeczy, x, odstep})` -> `{przykryj, tasuj(n), odkryj, kubki}` | the shell game: watches, then points to the cup | one_many, in_out |
| `c.cien(h, on)` | any sticker shown as its silhouette ("whose shadow?") | one_many, spot_difference, bigger_smaller, long_short, tall_short, tangram |
| `c.odbicie(who, {woda, ubrania, rozne})` | a character's reflection in water with something different; point to the difference | spot_difference |
| `c.roznice(name, {size})` | spot the difference on a painted pair (`tools/roznice`) | spot_difference |
| `c.portrety({postacie, ubrania, widok, kadr, kolumny, szer})` -> `{odrzuc({pasuje, wrong}), znajdz(kto, {wrong}), ostatni(), karty, remove}` | the characters as cards (the memory game's `menu/karta` and `karta_rewers`): each puppet rendered once at rest onto its card in `widok` "przod" / "tyl" / "profil", dressed in `ubrania` ({kto: ["okulary", "kapelusz"]}, the wardrobe's garments; quadrupeds are not dressed), framed `kadr` "glowa" (a head badge with shoulders, the default from the front) or "cala" (the default from behind / the side). `odrzuc({pasuje: (kto) => bool})`: "who has glasses? turn over who has not" - the child taps the cards that do NOT fit, each turns face down; a fitting one shakes and stays (`wrong`); resolves with the names left up (one left = the answer, it bumps). `znajdz(kto)`: cards show the back / side, a tapped card turns round to its front - the right one stays, another shows who it was, shakes and turns back. Cards to tap carry `dobry`; tests `S.portrety.dokoncz()` | - (guess_who, every_side) |
| `c.szukaj(name, {y, size, luneta})` | finds the hidden things in a painted scene (tools/roznice), a count of circles; through a round spyglass with a painted brass rim (`luneta_obwodka`, the count set into its arc) where the story has one, `luneta: false` = a plain picture on paper (pieces in the grass) | tall_short, complete_shape |

## 2. Dragging and placing

| call | what the child does | lessons |
|---|---|---|
| `c.sort({items, zones, wrong})` | drags things into drawn containers, any order, checked when all are in; a zone may name its kind (`zone.want`) | one_many, grouping, in_out, up_down, adding_5 |
| `c.slots({items, slots:[{x,y,w,h,accept}], numery, numeryNad})` -> `done()` | drags things into dashed places (patterns with a gap, seriation, numbered places) | ordering, noticing_order, morning_night, shapes, up_down, rhythm, queue |
| `c.place({item, ref, ref2, want, wrong})` | puts a thing on / under / beside / behind / between / in / in front of another; `c.relation`, `c.behind` read it | front_back, in_out |
| `c.stage.free({items, onDrop, onTap, doLinii})` | free dragging, the lesson decides what a drop means (standing things on one line, giving one to each) | tall_short, long_short, more_fewer, counting_3, counting_5, numbers_1_5, bigger_smaller |
| `c.tangram(name, {x, y, scale, obroty})` -> `done()`; `c.piece(t)` | lays tangram pieces on a silhouette, a tap turns 45 deg; one piece as a target | shapes, tangram |
| `c.wieza({klocki, miejsca, stoi})` | stacks blocks; a block that does not stand tips and falls back | ordering |
| `c.waga()` -> `{poloz, przeciagaj, wynik}` | a balance scale, the beam tips to the heavier pan | - |
| `c.ramka({x, y})` -> `{wloz, ile, przeciagaj}` | the ten frame, filled place by place - a painted wooden tray (`tools/objects/make_ramka.py`, cups laid out from the engine's geometry) | numbers_6_10, adding_10 |
| `c.sklepik({towar, cena, pokaz})` | pays: coins onto a plate, as many as the tag | numbers_1_5, counting_5, adding_5 |
| `c.ubieranie({rzeczy, kto, pasuje, wrong})` | dresses characters; a wrong size goes on, slips and falls off | bigger_smaller, grouping |
| `c.miejsca()` -> `{name: {slot(accept), strefa(), x, y, w, h, rodzaj}}` | the scenery's painted surfaces as drop places: a shelf, the hooks, the table, the rug (`game/assets/backgrounds/<scene>/miejsca.json`, `tools/miejsca/make_miejsca.py`). `m.gorna_polka.slot(accept)` goes into `c.slots`, `m.stol.strefa()` into `c.sort`; nothing is drawn - the picture shows where; a thing STANDS on a shelf, HANGS on a hook, LIES on a rug. Rooms with places: dom, pokoj, przedpokoj, pokoj_noc | - (the home stage, phase 3) |
| `c.winda({x, pietra})` -> `{doPoziomu, jedz, wloz, wyjmij}` | sends a basket on a rope up and down (pull the rope or drag the basket) | up_down |
| `c.siatka({wiersze, kolumny, rzeczy, komorki, plansza, sudoku, rozwiazanie, pasuje, pojemnosc, wrong})` -> `{komorki, komorka(r, c), cele, naglowki, pokaz(r, c), zawartosc(r, c), remove}` | a GRID with row and column headers (icon stickers in tinted lanes): drags things into cells - a cell takes only what fits its row AND column (a thing's `wiersz` / `kolumna`: index or header key); a wrong one goes in, shakes with the header that says no (or the cell flashes red), and goes home; after 2 misses with one thing its row and column light up where they meet. `sudoku: true`: the same picture already in that row / column shakes; `rozwiazanie` [[name]] fixes the answer (leave blanks whose choice is forced). A header may be an empty place `{klucz, puste: true}` for a label (a thing with that `klucz`). `komorki` [[name or {cyfra}]]: given content (a calendar's days). Without `rzeczy` it only lays out: read a cell with `c.task({targets: s.cele, correct: s.komorka(1, 2)})`; `s.pokaz(r, c)` lights a row and a column up to their cell. On a paper card with pencil lines (floats, things on the floor) or `plansza: "regal_3x3"` - a painted bookcase standing on the ground, things over it (`game/assets/siatki/<name>`, `tools/siatki/make_siatka.py`: the painting, then an edit with magenta on every compartment's back = the cells). Tests `S.siatka.dokoncz()` | - (two_features, tables_1, shelf_grid, picture_sudoku, shelf_labels, calendar) |
| `c.regula({pojemniki, rzeczy, cecha, wartosci, cechy, poIlu, ikony, onRegula, wrong})` -> `{cecha, wartosci, pojemniki, etykiety, remove}` | sorts into containers with NO label (painted stickers: koszyk, pudelko, skrzynia, miska); each quietly takes one kind. `cecha` + `wartosci` (one per container) fix the rule (guess_rule); `cechy` (several features) leave it to the child - the first drops decide, any rule the things allow is right (sort_free). Features: `h.cechy[f]` or `h[f]` (things given as `{name, kolor: "czerwony"}`, or handles - digit cards from `c.sign` for number_patterns). A wrong one falls in, the container shakes and spits it back home. After `poIlu` right ones, once the rule is clear, `onRegula({cecha, wartosci})` (awaited) lets a character say it out loud; `ikony` {value: sticker} then hang a small label on each container (shelf_labels). Tests `S.regula.dokoncz()` | - (guess_rule, sort_free, shelf_labels, number_patterns) |
| `c.rozdaj({komu, rzeczy, miski, ile, rowno, start, onNierowno, wrong})` -> `{kupki, reszta, odbiorcy, paruj(a, b), remove}` | gives things out: drags each from the row over the heads onto a character (its body or the bowl in front of it - `miski: "miska"`, `null` = a heap on the ground at its feet) or onto a plate / box (`komu: [{obraz: "talerz"}, ...]`); every heap grows visibly (rows of 3, 2, 1), things move between heaps or back. `ile`: each gets exactly that many, one more is refused (the heap shakes, it hops back: how_many_plates). `rowno` (default): done when all that can be shared is given AND the heaps are equal - all given but unequal, the one with fewer is sad and `onNierowno(kupki)` is called; a remainder that cannot be shared stays in the row. `rowno: false`: done when all is given (split_5, any split; `kupki` says which). `start` [[names]]: heaps already there (make_equal). `r.paruj()` - the even / odd check: the two heaps step out into two rows face to face, the pencil joins them pair by pair, the one without a pair (the remainder too) is circled; returns `{pary, bezPary}`. Tests `S.rozdaj.dokoncz()` | - (split_5, fair_share, even_odd, how_many_plates, make_equal) |
| `c.szpara({szpary, rzeczy, pasuje, jedna, luz, wrong})` -> `{szpary, rzeczy, przeszly, utknely, miesci(h, g), remove}` | DOES IT FIT? pushes a thing through a painted gap standing on the ground (`szpary`: `{obraz, x, szczelina, size, os}` - stickers `szpara_furtka` (a narrow gateway in a picket fence), `szpara_brama` (a gateway in a stone wall), `szpara_drzewa` (between two birches), `szpara_mostek` (under a stone arch, `os: "y"` = height)); the see-through opening is measured on the painting's alpha, `szczelina` scales a gap so its opening is that many units (capped on screen). Things wait over the heads (`rzeczy`: names, `{obraz, size, toczy}` or handles). One that fits slides in BEHIND the sides and goes away through the gap (rolls with `toczy`); one too thick / wide (or too tall under the arch) is pushed in FRONT of the sides so it sticks out over them, wobbles, `wrong` is said, and it goes back. `pasuje(h, g)` overrides the measure (solids: what rolls). Done when every thing that fits some gap went through (`jedna`: after the first). Tests `S.szpara.dokoncz()` | - (thick_thin, wide_narrow, solids) |
| `c.miarka({rzecz, dlugosc, jednostka, przyciagaj, who, wrong, ...})` -> `{ile, jednostki, rzecz, remove}` | MEASURING WITH UNITS from a pencil start line; the thing (a sticker name is sized to `dlugosc` units, a handle keeps its size) lies on the floor. `jednostka: "lapka" / "klocek"` (painted `lapka_miarka`, `klocek_miarka`, or any sticker): units wait over the heads (`zapas` more than needed), each dragged one snaps to the end of the row under the thing and is counted - a blue digit and `line.n<k>` said by `who`; `przyciagaj: false` keeps a unit where it is dropped: a gap or an overlap is marked red, it shakes and goes back (`wrong(reason)`: "przerwa", "zachodzi"); one past the end sticks out and goes back ("za_duzo"). `jednostka: "linijka"` (`podzialka` units, ruler_cm): a painted BLANK ruler (`linijka`) whose ticks and numbers the pencil draws; dragged under the thing it snaps with 0 on the line when near the start, else a red line shows the miss ("zero"); then (`odczytaj`) the child taps the number where the thing ends (a wrong one gets a pencil line up to the thing, "odczyt"; the right one green + circled). `jednostka: "odwaznik"` (kilograms): the balance scale with the thing (`masa` kg) on the left pan, weights (`odwaznik`, `wagi` = kg each, e.g. [2, 2, 1, 1]; a 2 kg one drawn bigger) dragged onto the right pan, kilograms counted by `who`; too much tips the beam the other way ("za_duzo"); done when level. Tests `S.miarka.dokoncz()` | - (measure_steps, ruler_cm, kilograms) |
| `c.wykres({rodzaje, rzeczy, wypelnij, wiersze, liczby, wlasna, wrong})` -> `{kolumny: [{rodzaj, x, ile, rzeczy, cel}], kolumna(r), najwyzsza(), najnizsza(), remove}` | a PICTURE BAR CHART: columns over a pencil baseline, the kind's sticker under each, faint pencil levels and blue numbers up the side (`liczby`). The child drags each thing (`rzeczy`: names that line up over the heads, or handles with `.rodzaj`) onto the chart: it shrinks into the next cell of its kind's column with a pop; dropped on another kind's column it lands there, shakes and flies back (`wlasna: true`: any drop on the chart goes to its own column, for the youngest). `wypelnij: {kind: n}` builds a finished chart cell by cell (reading: tables_1, estimation). Read it with `c.task({targets: w.kolumny.map((k) => k.cel), correct: w.najwyzsza().cel})` (null on a tie), count a column with `c.count(w.kolumna("jablko").rzeczy)`. Without `rzeczy` it only builds. Tests `S.wykres.dokoncz()` | - (charts, tables_1, estimation) |

## 3. Drawing with a finger

| call | what the child does | lessons |
|---|---|---|
| `c.slad(digit or shape, {x, y, size})` | traces along a light road from a green dot | shapes, counting_3, numbers_1_5, numbers_6_10 |
| `c.polacz({...})` | joins things that go together with finger-drawn lines | logical_pairs |
| `c.zagroda({rzeczy, chcemy, wrong, otwarta})`; `c.plot(pts)` | draws a closed fence round exactly the wanted things; an open one lets one walk out | in_out |
| `c.labirynt(name, {pionek, cel})` | leads a pawn through a painted maze cell by cell, a pencil trail behind (`tools/labirynty`) | morning_night, in_out, front_back |
| `c.podziel(obraz, {ciecia})` -> `{kawalki, rowne, ulamek}` | cuts with a finger stroke into equal (or unequal) parts | - |
| `c.kolorowanka(name, {znaki})` | colour by number or by sign (`tools/kolorowanki`) | shapes |
| `c.strzalki({kolumny, wiersze, start, cel, przeszkody})` | programs a pawn with arrows | - |
| `c.symmetry(name, ...)` | completes the mirrored half of a sticker | - |

## 4. Counting and numbers

| call | what it does | lessons |
|---|---|---|
| `c.count(items, {who, od, rzad})` | counting by touch: each thing once, its number drawn in blue and spoken from the lesson's `line.n1..n10`; `od` counts on, `rzad` moves counted things into a row | shapes, counting_3, counting_5, numbers_1_5, numbers_6_10, adding_5, adding_10 |
| `c.digit(n, opts)` | draws a digit (0-10) stroke by stroke | counting_3, counting_5, numbers_1_5, numbers_6_10, adding_5, adding_10, queue |
| `c.equation([2, "+", 1, "=", null])` | writes an equation, a null leaves a gap for a card | adding_5, adding_10 |
| `c.kupka(name, n, opts)` | a heap or row of n stickers | one_many, counting_3, counting_5, numbers_1_5, numbers_6_10 |
| `c.dzwieki(n, {kto, ruch, dzwiek, tempo})` | counting by ear: claps, hops, drum, bell (the music falls silent) | one_many, counting_3, counting_5, numbers_1_5, adding_5 |
| `c.domino(a, b)` | a domino tile of dots, a task target with `suma` | counting_5, adding_5 |
| `c.os({od, do})` -> `{skocz, kamienie, kamien(n)}` | stepping stones with numbers | numbers_1_5, numbers_6_10, adding_10 |
| `c.zegar({x, y, size, godzina, minuty, ruchome, polowki, cyfry})` -> `{ustaw({godzina, minuty, wrong, podpowiedzPo}), pokaz(h, m), teraz(), remove}` | a painted wall clock (`zegar_tarcza`: red rim, EMPTY dial; hands `zegar_krotka` / `zegar_dluga`, sheets `zegar_tarcza`, `zegar_wskazowki`); the 12 digits and hour ticks are drawn by the pencil (gpt-image cannot be trusted with numerals). Without a task it just shows the story's time; `pokaz(h, m)` turns the hands forward (time passes). `ustaw` is the task: the child drags round the face - the hand nearest the finger turns (`ruchome` "krotka" = only the short one, "obie"); on release the short hand snaps to a whole hour, the long one to the full hour (or the half with `polowki`), carrying the short one along like a real clock. A hand released wrong: the clock shakes, `wrong` (a key or `(t) => key`, t = {godzina, minuty}); after 2 misses a pencil circle on the wanted digit. Tests `S.zegar.dokoncz()` | - (clock; days_of_week, calendar to show a time) |
| `c.peczki({peczki, patyczki, zapas, zapasPeczki, x, y, size})` -> `{uloz({cel, wrong, wiaz, rozwiazuj}), wartosc(), ile(), zwiaz(), rozwiaz(b), remove}` | bundles of ten: a painted tray (`mata_peczki`, bunches left, single sticks right, badges say which) with `peczki` bunches and `patyczki` sticks on it, a heap of `zapas` sticks / `zapasPeczki` bunches below. The child drags sticks or bunches onto the tray (a tap in the heap puts one there) and off it to take away; at the tenth single stick the ten gather and the painted red twine (`wstazka_peczka`) ties them, the bunch moves left; a tapped bunch unties into ten sticks (borrowing). `uloz({cel})` resolves when the tray holds `cel` with every ten tied; a move past it jumps back with a shake, `wrong` (a key or `(powod) => key`, powod "za_duzo" / "za_malo"). Past three bunches they lie in two rows. Tests `S.peczki.dokoncz()` | - (teens, whole_tens, tens_add_sub, plus_carry, minus_borrow, count_20) |
| `c.shape(kind, opts)`, `c.corners(h)` | a filled shape sticker; its corners as things to count | shapes, ordering |

## 5. Sound, rhythm, movement

| call | what it does | lessons |
|---|---|---|
| `c.rytm(items, {tempo, kiwaja, linia, kto, slowo})` | plays a row from the start one thing per beat, or reads it aloud word by word | noticing_order, ordering, rhythm |
| `c.taniec(who, moves)`, `c.ruch(who, klask/skok/obrot)` | a dance on the beat; one move | rhythm, up_down |
| `c.zamroz(who, on)`, `c.potknij(who)` | statues (body stops, face lives); a wobble for a wrong move | rhythm |
| `c.muzyka(name)` | a scene's own music (the theme falls silent) | more_fewer, rhythm |
| `c.sfx(name)` | a sound effect (most play by themselves: pop, tap, wrong, plop, pencil, whoosh, right) | many |
| sticker sound `c.object(name, {dzwiek})` | a thing that sounds when pointed at | ordering, rhythm |

## 6. Painted pictures (the found-picture family)

The strongest family: gpt-image paints the picture in one go, the code only reads it (a magenta key, or a plan it
checks against), the picture is an object in the story so the answer moves the plot, and the manager reviews it
(`znaleziska.html?rodzaj=znaleziska|labirynty|roznice`).

| call | what the child does | pipeline | lessons |
|---|---|---|---|
| `c.znalezisko(name, {skad, y})` -> `{cele, tlo, zaznacz, remove}` | a found map, photo, drawing or note flies up big; the child points to spots or whole paths, or counts them | `tools/znaleziska/make_znalezisko.py` | long_short, ordering, shapes, counting_3, logical_pairs, up_down, tangram, grouping, front_back, queue, counting_5, adding_5 |
| `c.labirynt` | see 3 | `tools/labirynty/make_labirynt.py` | |
| `c.zdrapka(name)` -> found picture | rubs a painted cover (snow, a fogged window, sand, leaves) off with a finger; at 75 % the rest melts and the scene under it is a found picture (`cele`, `tlo`, `zaznacz`) to count or point on. Tests `S.zdrapka.dokoncz()` | `tools/zdrapki/make_zdrapka.py` (scene, the same scene covered, spots) | - (samples snieg_ogrodek, szyba_rano) |
| `c.kropki(name, {znaki: wielkosc / cyfry})` | joins dots on the outline of a painted thing in order (draws from dot to dot or taps the next); the outline closes and the picture appears. `wielkosc`: the dots grow, from the smallest (before numbers); `cyfry`: digits. A wrong dot shakes. Tests `S.kropki.dokoncz()` | `tools/kropki/make_kropki.py` (one thing on a transparent background; dots along the outline, pulled to corners) | - (samples niedzwiedz_gwiazd on a night card, lokomotywa 1-10) |
| `c.historyjka(name, {uloz})` -> `{karty}` | puts the panels of ONE painted comic page in order: cards shuffled on the floor (never already in order), places over the heads, an arrow at the first. `uloz: false` only lays the cards out for the lesson's own question. Tests `S.historyjka.dokoncz()` | `tools/historyjki/make_historyjka.py` (3-4 panels in one picture, cut at the white gutters) | - (samples dzien_kreta, jajko_kura) |
| `c.podarty(name, {kawalki: 4 / 6})` -> found picture | a found picture torn by the story: jagged pieces (shared cut lines, a white paper rim) scattered and turned; dropped near its place a piece snaps in; then the usual found-picture task. Tests `S.podarty.dokoncz()` | any found picture | - |
| `c.wedrowka(name, {pionek, dobra})` -> found picture | drags a pawn along a painted PATH of a found picture; on the shared stretch freely, past the fork only the right path (`dobra`) lets it on - the other one shakes the pawn (the story says why). Tests `S.wedrowka.dokoncz()` | found pictures with `droga` spots | - (try mapa_pikniku, dobra 0 = the short path) |
| `c.roznice`, `c.szukaj` | see 1 | `tools/roznice/make_roznice.py` | |
| `c.kolorowanka` | see 3 | `tools/kolorowanki/make_kolorowanka.py` | |

## 7. Story and film tools

| call | what it does |
|---|---|
| `c.say(who, key, {anim})` | a line by a character on screen (never a narrator); the speaker is always put in the shot |
| `c.enter`, `c.show`, `c.play`, `c.walkTo`, `c.przejdz(who, pts, {skok, glebia})` | characters come in, act, walk, walk into the picture (smaller further away, hops over stones) |
| `c.look(who, thing)` | the gaze; during a task the characters look from option to option |
| `c.take(who, thing)`, `c.put(who, x, y)` | carrying in the paw (a quadruped on its back) |
| `c.idea(who, groups)` | a thought bubble with stickers ("I have an idea!") |
| `c.wonder(who)`, `c.emocja(who, kind, {anim})` | a "?" over a head; an emotion bubble (zlosc, pot, serce, radosc, smutek, sen, wykrzyknik, zarowka, zimno, mokro, muzyka, strach) |
| `c.ubierz`, `c.zdejmij`, `c.nieUbieraj`, `c.ubranie` | dressing a character; a garment as a sticker |
| `c.go(bg, {enter, przejscie, ciecie})` | a new place (a transition between adventures) |
| `c.ilustracja(name, {ruch: najazd / w_lewo / w_prawo})` -> `{zsun(), okienko(i), calosc()}` | an EVENT ILLUSTRATION (ilustracje.js): a painted picture of what puppets cannot act lands on the screen like a big perforated stamp - tilted, bending like paper, flattening - over a dimmed scene; the camera creeps over it; whoever speaks shows in a round badge in the corner (a live render of their head, lip-sync included); `zsun()` slides it down off the screen. Lines are said as usual with `c.say` while it is up. Pipeline `tools/ilustracje/make_ilustracja.py` (characters' and scenery references keep cast and style); review in the manager's Ilustracje tab. OPTION, a COMIC: an entry with `"uklad": "3" / "3d" / "4"` is painted into that slanted-panel layout template (`UKLADY`); the stamp lands with only panel 1 painted, `okienko(i)` paints panel i in and moves to it, `calosc()` shows the page - use it for a short sequence (how something happened), a single picture stays the default. Lessons: - (samples pociag_most, burza_noc; comic jezyk_zgubil_sie in morning_night) |
| `c.go({kolor, motyw})` | an INSERT on a plain colour: the scenery fades, the characters stand on one soft colour with a light circle and faint drifting shapes (kola, figury, chmurki, deszcz, cyfry, gwiazdki, liscie) - for a method or a thing talked about alone; use them often |
| `c.ujecie(ogolny / sredni / zblizenie / dwuujecie, {na})` | the shot; the engine cuts or flies by one key |
| `c.pan(k, {idz})` | slides a panorama to area k, characters walk on the spot |
| `c.focus(items)`, `c.unfocus()` | zoom with a dimmed veil around the thing |
| `c.przejscie(fn, kind)` | a transition (tecza, wzor, irys, babelki) |
| `c.rozblysk(who or thing)` | rays and sparkles behind a discovery |
| `c.noc({ciemnosc})`, `c.swiatlo(thing, {r, moc})` | night over the scene and lights in it |
| `c.czastki(kind, {wiatr, gestosc})` | rain, snow, fireflies, leaves, pollen, bubbles, feathers |
| `c.odliczanie({styl})`, `c.konfetti(h)`, `c.ptaszek(h)`, `c.gwiazdki(n)` | countdown, confetti, a big tick, the practice star bar |
| `c.nalozenie(top, bottom)` | lays one thing on another: the bigger sticks out all round |
| `c.line`, `c.segment`, `c.circle`, `c.arrow`, `c.cross` | pencil strokes (a stroke can be a task target) and bold marks |
| `c.object`, `c.sign`, `c.zone`, `c.arrange`, `c.standOn`, `c.bounds` | stickers, signs, zones, layout by real widths |
| `c.glowy(who)` | head badges |

## 7b. Praise and wrong-answer variants (`game/pochwaly`)

| call | what it does |
|---|---|
| `c.brawo(who)` | one of six recorded praise lines ("Brawo!", "Świetnie! Udało się.", ...) in that character's own voice, at random, never the same twice in a row; the character cheers. Use it only where the answer cannot be named - a right answer is NAMED by the lesson's own line ("Tak, trzy gruszki!") |
| (automatic) | a wrong try in `task`, `sort`, `place`, `slots`, `symmetry`, `polacz`, `zagroda`, `winda` with NO `wrong` line of its own gets a gentle variant ("Prawie! Popatrz uważnie jeszcze raz.") in the instructing character's voice; a lesson's own `wrong` line always wins |

Every variant is recorded for all nine characters (`speakers`), so nobody ever speaks in another's voice.
`python tools/audio/run.py pochwaly` records them (`game/audio/<lang>/pochwaly`).

## 7a. What every lesson gets without asking

A start card and a card before every stage; head badges peeking in; encouragement after 9 s without a touch
(`game/zachety`, in the instructing character's voice); a tap on a character repeats the instruction in force; the
lesson's sticker for the album at the end; the goodbye iris; HUD pause / next / fullscreen; music per place.

## 8. Breathers (non-maths mini-games, oddechy.js)

Every story has ONE breather, never maths, never the same as the lesson before or after it (lesson.json `oddech`,
checked by the story preview). The proposed assignment per lesson is in `game/lessons/oddechy_plan.md`. Their words
come from the shared pool `game/oddechy` (every line in all nine voices: `python tools/audio/run.py oddechy`). Tests:
`S.oddech.dokoncz()` finishes the running one. Demos on `manager/mechaniki.html?m=<name>`.

| call | what the child does |
|---|---|
| `c.kpn({kto, naucz})` -> "dziecko" / who | rock, paper, scissors against `kto` to decide who goes first; taught first (each sign beats one, shown and said), then "kamień, papier, nożyce!", both say what they chose, the rule decides out loud; a draw is played again (after two the child wins). Hand stickers `gest_*` |
| `c.lustro({kto, rundy})` | copy the face: `kto` pulls a face (an emotion bubble that is a face: joy, sad, cross, sleepy, scared, worried), the child points to the same face among three |
| `c.karmienie({zwierze, jedzenie, fuj, kto})` | drags food to a hungry animal sticker: it gulps the good food, spits the odd one back |
| `c.latawiec({ksztalt, kto})` | drags up anywhere: the kite on a string from `kto`'s paw climbs, sways, sinks when nobody pulls; at the top it loops the loop |
| `c.ktoPowiedzial({gospodarz, kryjowki})` | the hiders walk behind painted bushes (one bush stays empty) and are gone; one calls "a kuku!" in its own voice (the only line said by a hidden character - the game is the voice), the host asks, the child points to that bush and the hider jumps out |
| `c.malowanie({tlo: noc / szyba, zdrapka, kto})` | free finger drawing: glowing gold on the night sky, or wiping a painted steamy window (a scratch-off pair: its painted mist on the glass, its view behind); ends a while after the first stroke and is admired |
| `c.zdrapka(name)` (section 6) | a reveal for fun: what is under the snow |
| `c.kropki(name, {znaki: "wielkosc"})` (section 6) | a surprise picture from dots |
| statues (`c.zamroz`, rhythm) | dance, freeze, point to who still moves |
| the snail race (long_short's own code) | point to a snail to cheer it on |

Not breathers any more: catch what pops up (it was in eight lessons), counting claps / hops / bells (that is practice).
Tried and dropped (2026-10-29): a swing (a rigid sticker swinging in the air looked fake). Not built: skipping stones.

---------------------------------------------------------------------------------------------------------------------

## Appendix - engine notes (moved from CLAUDE.md)

Pencil (`olowek.js`, ctx `line`, `segment`): a stroke along a polyline or a chain of
cubic Beziers, drawn in with a moving tip, graphite grain, tapered ends and a slight
hand wobble; a segment has end ticks. A stroke is a handle like a sticker (a wide
invisible strip takes the tap, so a line can be a task target; `highlight` makes it
glow; `clear` removes it). `bounds(h)` is a sticker's real drawing (its alpha box, not
the transparent square), `standOn(items, y)` stands stickers on a line. Lessons build
with them: the pairing lines in more_fewer. On a tap a
thing beats a character (a character only repeats the instruction, the one said
before the task - never the last "try again"). This is ONE rule for the whole game: `scene.tapPuppet` (a tap on a
visible character that no task takes) calls the player's `onPuppetTap`, which repeats the instruction in force,
set by `wDzialaniu(p)` for the life of every interaction (task, count, sort, tangram, place, slots, symmetry),
one repeat at a time and never over a line being spoken. Counting by touch used to ignore the characters.

Camera and annotations: `ctx.focus(items)` zooms (<= 1.6x, inside the design frame)
and dims the rest under a veil with a soft hole, `ctx.unfocus()`. `ctx.circle(h)`,
`ctx.arrow(h)`, `ctx.cross(h)` draw bold pencil marks (`strong`: pressed hard, little
grain, saturated orange / red - the first thin ones did not read), `ctx.wonder(who)`
a "?" over a head. The hint ladder in `task`: after `hintAfter` misses the answer
pulses, one miss later a pencil arrow points at it, one more and the instructing
character looks, points and circles it; the marks go when the task ends.

Carrying and ideas: `ctx.take(who, thing)` - the near arm comes forward and bends, the
thing sits just beyond the paw (in front in profile, beside it from the front) INSIDE the
puppet's draw order (its renderOrder, z between torso and arm), so the paw holds its
edge; a quadruped carries it on its back; it follows walking; `ctx.put(who, x, y)`.
Drawn over the whole puppet it covered the body - that looked wrong. `ctx.idea(who,
[[names...], [names...]])`: a thought bubble over the head with stickers in groups (a
row each), the "I have an idea!" step of a part 1 scene; `remove()` pops it.

Numbers (`liczby.js`): `ctx.digit(n)` draws a digit (0-9, and 10 as two) with the
pencil, stroke after stroke as a child writes it; `ctx.equation([2, "+", 1, "=", null])`
writes an equation, a null leaves a gap (`luki`) for a card to fly into; `ctx.count(items,
{who, od, rzad})` - counting by touch: every thing once, its number drawn over it in blue
and spoken by `who` from the lesson's own `line.n1..n10`; `od` counts on (from 5: 6, 7,
8), `rzad` moves each counted thing into a row so nothing is counted twice. Number
lessons keep things BIG (stickers ~1.0, counting badges 0.7, digit cards 1.2 on the floor,
containers raised between the characters): the first layout at 0.5-0.7 was unreadable.

Geometry, positions and rows (`geometria.js`). Free dragging (`S.free(set)`): a thing goes anywhere; a tap
without moving (< 0.15 units, < 450 ms) is `onTap`, otherwise `onDrop`; a tap on a character repeats the
instruction. `S.upusc(item, x, y)` / `S.stuknij(item)` drive it from tests. On top of it:
- `ctx.shape(kind, {x, y, size, color, rot})` - circle / triangle / square / rectangle drawn as a filled sticker
  with a white rim and a pencil outline (synchronous, a handle with `rotateTo`, `corners()`). The rim is geometry
  (`obwodka`: the polygon grown by a disc, even width, round corners) - the pencil ribbon wobbled and broke at the
  corners. Each shape has its own band of draw orders and comes on top when picked up or turned (`naWierzch`), so
  overlapping pieces lie like paper; with shared orders the lower piece's outline showed through the upper one; `ctx.corners(h)` -
  corner dots for `ctx.count` (each puts its number OUTSIDE the shape, `etykieta`).
- `ctx.tangram(name, {x, y, scale, obroty})` - a grey silhouette with a pencil outline (`UKLADANKI`: kwadrat,
  domek, ryba, lodka, kot, duzy_kwadrat) and its pieces packed without overlap on the floor between the characters,
  over their heads when the floor is full (`rozloz`: biggest first, each piece may take any turn, the preferred
  one first - a big triangle on its tip is taller than the floor, so a random turn left it in a pile). A drop near
  a place of the same piece snaps when the turn matches modulo the piece's symmetry; a tap turns 45 deg; `done()`.
  `ctx.piece(t)` - one piece as a target ("which piece fits the gap?").
- `ctx.place({item, ref, ref2, want, wrong})` - on / under / beside / behind (peeks out over the top) / between /
  in ("w" = the centre inside, drawn in front) / in front of ("przed" = over its lower part, drawn in front); `relation`, `behind`. Moving a thing in front of or behind another
  shifts its whole draw order past the other's and keeps its own layers (fill, halo, outline) - flattening them
  to one value hid a round window under the square it was dropped into.
- `ctx.symmetry(name, ...)` - an axis, the left half of a sticker, three halves to add (mirrored = right).
- `ctx.slots({items, slots: [{x, y, w, h, accept}], numery, numeryNad})` - dashed places (patterns with a gap,
  seriation into numbered places, numbers under or over them); `done()` resolves when every place is filled.
- A sort zone may name the kind it takes (`zone.want = "kolo"`) when the line names the containers.
Rows and queues are laid out by the things' drawn widths (`c.bounds`), never a fixed step: rhythm rows run over
the heads at full width (8 things at 1.3), ordering puts things on the floor within x +-3.1 and the places
over the heads, the queue lesson stands animals feet on the floor, the bunny clearly the biggest.

Film tools (`efekty.js`, guidelines "Atmosphere and editing"; `bigger_smaller` uses them all):
- inserts on a plain colour: `ctx.go({kolor, motyw, kolo})` (motyw kola, figury, chmurki, deszcz, cyfry,
  gwiazdki, liscie - drifting very faintly; `ciecie: true` inside one adventure);
- transitions `E.przejscie` (tecza with the characters' heads cut from the frame, wzor, irys, babelki; random
  unless named): the lesson's `przejscia: true` makes every stage and `go` change one;
- `ctx.ujecie(ogolny | sredni | zblizenie | dwuujecie, {na})` cuts or flies the camera (efekty.js `ruchKamery`: a cut on a change of subject, a flight when something stays in the shot, back to wide and wide to medium; held shots creep in; `ciecie: true|false` overrides; the speaker is kept in the shot before every line, `mowcaWKadrze`) (a two-shot steps the two closer
  until the next wide shot); `ctx.pan(k, {idz})` slides a panorama to area k (fractions allowed), the named
  characters walk on the spot in step with the ground;
- `ctx.odliczanie({styl: cyfry | kropki})`, `ctx.konfetti(h)`, `ctx.ptaszek(h)` (or `nagrody: true` for every
  right pick), `ctx.emocja(who, rodzaj, {anim})` (zlosc, pot, serce, radosc, smutek, sen, wykrzyknik, zarowka,
  zimno, mokro, muzyka, strach), `ctx.nalozenie(gorny, dolny)` -> {wiekszy, cofnij()}, `ctx.czastki(rodzaj)`
  (deszcz, snieg, swietliki, liscie, pylek, babelki; ends with the background), `ctx.gwiazdki(n)` (practice
  stars in the HUD, a streak badge after two first-try answers);
- comic effects: speed lines on every jump into a close-up (automatic in `ujecie`), `ctx.rozblysk(who | handle)`
  (golden rays and sparkles behind a discovery), motion streaks behind a sticker flying far and fast (automatic in
  `moveTo`); `ctx.przejdz(who, [[x, y]...], {skok})` walks into the picture (smaller, shadow along).
Rhythm (`rytm.js`, the rhythm lesson): a sticker may carry its own sound (`object(name, {dzwiek})`, also
`cicho: true` for no pop) - it sounds when pointed at; `ctx.rytm(items, {tempo, kiwaja})` plays a row from the start,
one thing per beat (bump, glow, its sound), the method and the hint after a miss; `ctx.rytm(items, {linia, kto,
slowo})` reads it aloud instead - each thing bumps as its name is said (word start times, `slowa` in the recording's
json, come from the ElevenLabs timestamps; only new recordings have them, so a line used this way is recorded again); `ctx.ruch(who, klask|skok|obrot)`
one dance move squeezed into a beat (a one-clap `Klask` is built from Brawo at run time), `ctx.taniec(who, moves)`,
`ctx.potknij(who)` (a wobble and a sour sound for a wrong move); `ctx.zamroz(who, on)` - statues: the body's
animation clock stops and new animations are ignored, eyes and mouth still live, so a statue can speak. Characters
can be the options of a task (statues: "who moved?").
Mechanics (`mechaniki.js`, `mechaniki2.js`; try each on `manager/mechaniki.html?m=<name>`): `ctx.slad(digit | shape)`
- trace with a finger along a light road from a green dot (the pencil follows forward only, off the road it stops);
`ctx.waga()` -> {poloz, przeciagaj({rzeczy, gotowe}), wynik} - a balance scale, things carry `masa`, the beam tips to
the heavier pan (its parts have no sticker outline: one ran over the next); `ctx.os({od, do})` -> {skocz(who, z, na)}
- stepping stones with numbers; `ctx.wieza({klocki, miejsca, stoi})` - blocks stacked by dragging, a block that does
not stand (wider than the one below) tips and falls back; `ctx.kubki({ile, rzeczy})` -> {przykryj, tasuj(n), odkryj};
`ctx.dzwieki(n, {kto, ruch | dzwiek})` - counting by ear; `ctx.podziel(obraz, {ciecia})` -> {kawalki, rowne, ulamek} -
cut with a finger stroke (near the middle it snaps through it, far from it the pieces come out unequal);
`ctx.memory(pary)` (faces {obraz | cyfra | kropki}); `ctx.sklepik({towar, cena})` - coins onto a plate, as many as
the tag; `ctx.strzalki({kolumny, wiersze, start, cel, przeszkody})` - a program of arrows a pawn follows;
`ctx.cien(h)` - any sticker as its silhouette; `ctx.zagroda({rzeczy, chcemy, wrong, otwarta})` (mechaniki3.js) - a fence drawn with a finger: a closed line round exactly the wanted things builds it, an open one has a gap a thing walks out through; `ctx.plot(pts)` a pencil fence; `ctx.winda({x, pietra})` -> {doPoziomu(i), jedz, wloz, wyjmij} - a basket on a rope over a painted pulley (parts winda_*.webp; the rope is stacked from pieces of the painted one and drawn behind every sticker);  `ctx.ramka({x, y})` -> {wloz, ile, przeciagaj({rzeczy, ile, wrong})} - a ten frame (two rows of five, filled place by place); `ctx.domino(a, b)` - a domino tile of dots, a task target with `suma`; `ctx.znalezisko(name, {skad})` (mechaniki3.js) - a found picture (map, photo, drawing; square or oblong) flies up from
`skad` and lies big over a dimmed scene; it returns {cele, tlo, zaznacz(), remove()} and the lesson asks with
`c.task({targets: [...z.cele, z.tlo], correct: z.cele (wszystkie for several)})` - the spots start NOT marked right for the tests: mark the answer with `dobre(...)` before the task, so a tap elsewhere is a miss with the
hint ladder, or `c.count(z.cele)` counts the spots by touch (rings, hint arrows and counting digits draw over the picture:
the spots carry `nadObrazem`; remove the count's `znaczki` with the picture) (`tools/znaleziska/make_znalezisko.py`: gpt-image draws the picture, then an edit with a magenta disc on
every spot described in words; the discs found by colour are the `cele`; review `work/<name>_cele.png`). A spot can
be a whole PATH (`{"droga": "the short path from ... to ..."}` in `cele`): each path gets an edit of its own (two paths
share their ends and merged when painted together), its painted line is skeletonized into points, the game makes the
whole path one target and `zaznacz(cel)` draws it along in pencil - a disc on a plain stretch of path gave a 3-year-old
nothing to recognise; `ctx.labirynt(name, {pionek, cel})` - a painted maze the child leads a pawn through with a finger, cell by cell
through the openings only, a pencil trail behind (`tools/labirynty/make_labirynt.py`: Python makes a perfect maze and
its plain plan, gpt-image paints it with the plan as the reference - a hedge maze, forest paths - and the build checks
every wall and opening of the painting against the plan, review `work/<name>_sprawdz.png`; moves are checked on the
plan, never on the painting; tests `S.labirynt.dokoncz()`); `ctx.line(..., {warstwa})` lifts a stroke over a big
picture (38+) keeping its halo under the ink; stickers have random variants (`game/engine/warianty.js`, `object(name, {plik})` forces one); `ctx.roznice(name)` - spot the difference (`tools/roznice/make_roznice.py`:
gpt-image draws a picture and an edit with the pair's changes spelled out, the code finds the changed areas by a
blurred difference; review `tools/roznice/work/<name>_roznice.png`); `ctx.kolorowanka(name)` - colour by number
(`tools/kolorowanki/make_kolorowanka.py`: a flat-coloured page split into regions, colours clustered into a palette).
A drawing finger takes the stage's pointers while set (`S.palec` {down, move, up}); tests drive them through
`S.slad.dokoncz()`, `S.zagroda.dokoncz()`, `S.winda.dokoncz()`, `S.podziel.tnij(kat)`, `S.memory.karty`, `S.strzalki`, `S.kolorowanka.dokoncz()`.

A big picture over the scene (`znalezisko`, `podarty`) makes room for the characters (`miejsceNaObraz`, `odsun` in
mechaniki3.js): it shrinks or shifts so each visible character fits beside it inside the 4:3 safe area, the ones it
would cover walk aside and come back when it goes. Nobody speaks from behind a picture.
