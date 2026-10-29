# Game mechanics - what the engine offers a lesson

**This is the list of mechanics available today. It is not a limit.** When a lesson would be better with a mechanic
that is not on this list, ask the operator (the user) whether to add it: describe what the child does on screen, why
the lesson needs it and what it costs (engine code, pictures, sounds). Never water a lesson down to this list in
silence, and never build a new mechanic without a yes (guidelines.md, "A lesson asks for the tools it needs"). An
accepted mechanic goes into the engine for every lesson, gets a demo on `manager/mechaniki.html?m=<name>` where it
makes sense, and an entry here in the same commit.

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
| `c.cien(h, on)` | any sticker shown as its silhouette ("whose shadow?") | one_many, spot_difference, bigger_smaller_pro, long_short, tall_short, tangram |
| `c.odbicie(who, {woda, ubrania, rozne})` | a character's reflection in water with something different; point to the difference | spot_difference |
| `c.roznice(name, {size})` | spot the difference on a painted pair (`tools/roznice`) | spot_difference |
| `c.szukaj(name, {y, size})` | looks through a round spyglass at a painted scene and finds the hidden things, a count at the side | tall_short |

## 2. Dragging and placing

| call | what the child does | lessons |
|---|---|---|
| `c.sort({items, zones, wrong})` | drags things into drawn containers, any order, checked when all are in; a zone may name its kind (`zone.want`) | one_many, grouping_pro, in_out, up_down, adding_5 |
| `c.slots({items, slots:[{x,y,w,h,accept}], numery, numeryNad})` -> `done()` | drags things into dashed places (patterns with a gap, seriation, numbered places) | ordering, noticing_order, morning_night, shapes, up_down, rhythm, queue |
| `c.place({item, ref, ref2, want, wrong})` | puts a thing on / under / beside / behind / between / in / in front of another; `c.relation`, `c.behind` read it | front_back, in_out |
| `c.stage.free({items, onDrop, onTap, doLinii})` | free dragging, the lesson decides what a drop means (standing things on one line, giving one to each) | tall_short, long_short, more_fewer_pro, counting_3, counting_5, numbers_1_5, bigger_smaller_pro |
| `c.tangram(name, {x, y, scale, obroty})` -> `done()`; `c.piece(t)` | lays tangram pieces on a silhouette, a tap turns 45 deg; one piece as a target | shapes, tangram |
| `c.wieza({klocki, miejsca, stoi})` | stacks blocks; a block that does not stand tips and falls back | ordering |
| `c.waga()` -> `{poloz, przeciagaj, wynik}` | a balance scale, the beam tips to the heavier pan | - |
| `c.ramka({x, y})` -> `{wloz, ile, przeciagaj}` | the ten frame, filled place by place | numbers_6_10, adding_10 |
| `c.sklepik({towar, cena, pokaz})` | pays: coins onto a plate, as many as the tag | numbers_1_5, counting_5, adding_5 |
| `c.ubieranie({rzeczy, kto, pasuje, wrong})` | dresses characters; a wrong size goes on, slips and falls off | bigger_smaller_pro, grouping_pro |
| `c.winda({x, pietra})` -> `{doPoziomu, jedz, wloz, wyjmij}` | sends a basket on a rope up and down (pull the rope or drag the basket) | up_down |

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
| `c.shape(kind, opts)`, `c.corners(h)` | a filled shape sticker; its corners as things to count | shapes, ordering |

## 5. Sound, rhythm, movement

| call | what it does | lessons |
|---|---|---|
| `c.rytm(items, {tempo, kiwaja, linia, kto, slowo})` | plays a row from the start one thing per beat, or reads it aloud word by word | noticing_order, ordering, rhythm |
| `c.taniec(who, moves)`, `c.ruch(who, klask/skok/obrot)` | a dance on the beat; one move | rhythm, up_down |
| `c.zamroz(who, on)`, `c.potknij(who)` | statues (body stops, face lives); a wobble for a wrong move | rhythm |
| `c.muzyka(name)` | a scene's own music (the theme falls silent) | more_fewer_pro, rhythm |
| `c.sfx(name)` | a sound effect (most play by themselves: pop, tap, wrong, plop, pencil, whoosh, right) | many |
| sticker sound `c.object(name, {dzwiek})` | a thing that sounds when pointed at | ordering, rhythm |

## 6. Painted pictures (the found-picture family)

The strongest family: gpt-image paints the picture in one go, the code only reads it (a magenta key, or a plan it
checks against), the picture is an object in the story so the answer moves the plot, and the manager reviews it
(`znaleziska.html?rodzaj=znaleziska|labirynty|roznice`).

| call | what the child does | pipeline | lessons |
|---|---|---|---|
| `c.znalezisko(name, {skad, y})` -> `{cele, tlo, zaznacz, remove}` | a found map, photo, drawing or note flies up big; the child points to spots or whole paths, or counts them | `tools/znaleziska/make_znalezisko.py` | long_short, ordering, shapes, counting_3, logical_pairs, up_down, tangram, grouping_pro, front_back, queue, counting_5, adding_5 |
| `c.labirynt` | see 3 | `tools/labirynty/make_labirynt.py` | |
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
| `c.ilustracja(name, {ruch: najazd / w_lewo / w_prawo})` -> `{zsun()}` | an EVENT ILLUSTRATION (ilustracje.js): a painted picture of what puppets cannot act lands on the screen like a big perforated stamp - tilted, bending like paper, flattening - over a dimmed scene; the camera creeps over it; whoever speaks shows in a round badge in the corner (a live render of their head, lip-sync included); `zsun()` slides it down off the screen. Lines are said as usual with `c.say` while it is up. Pipeline `tools/ilustracje/make_ilustracja.py` (characters' and scenery references keep cast and style); review in the manager's Ilustracje tab. Lessons: - (samples pociag_most, burza_noc) |
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

## 8. Breathers in use (non-maths mini-games)

Built in each lesson's own code from the parts above:
- **catch what pops up** (a `task` loop on things that pop in and out): one_many (duckling), spot_difference
  (butterflies), bigger_smaller_pro (acorns), tall_short (sunflowers), logical_pairs (leaves), morning_night
  (fireflies), grouping_pro (red leaf, mushrooms), long_short practice (ribbons) - overused, being replaced;
- **statues** (`zamroz`): rhythm;
- **snail race** (cheer a snail by pointing): long_short;
- **stumps / musical chairs**: more_fewer_pro (it is maths there);
- **hide-and-seek**: front_back (part of the topic).

---------------------------------------------------------------------------------------------------------------------

## Appendix - engine notes (moved from CLAUDE.md)

Pencil (`olowek.js`, ctx `line`, `segment`): a stroke along a polyline or a chain of
cubic Beziers, drawn in with a moving tip, graphite grain, tapered ends and a slight
hand wobble; a segment has end ticks. A stroke is a handle like a sticker (a wide
invisible strip takes the tap, so a line can be a task target; `highlight` makes it
glow; `clear` removes it). `bounds(h)` is a sticker's real drawing (its alpha box, not
the transparent square), `standOn(items, y)` stands stickers on a line. Lessons build
with them: the pairing lines in more_fewer_pro. On a tap a
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

Film tools (`efekty.js`, guidelines "Atmosphere and editing"; `bigger_smaller_pro` uses them all):
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
