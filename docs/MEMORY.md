# Session memory

What the user and Claude agreed, learned and left open while building the game - the things the code, CLAUDE.md and
guidelines.md do not say by themselves: standing rules, every decision the user made, the user's feedback and what it
taught, the state of every lesson, how the tools behave in practice, and the traps that cost time. Read it at the start
of a session on any machine; keep it current (CLAUDE.md, "Memory"). Dates are absolute. History: the project moved
here from `D:\Project\ai\math\demo3_2d` on 2026-10-27 (205 commits by 2026-10-29); `math_game2` was a sandbox for the
bendable limbs, merged back as 151b815 and no longer needed.

---------------------------------------------------------------------------------------------------------------------

## 1. Working with the user (Artur) - standing rules

- **Language**: chat in Polish, every status line too ("teraz robię X"), no English sentences mixed in. Code, comments,
  commit messages and repo docs in English. Polish identifiers inside the engine (`lalka.js`, `tlo.js`, ...) stay.
- **Git**: commit locally when a step is done; never push unless asked in so many words (approval for one push does
  not carry over). Remote `origin` = https://github.com/artur-trzesiok/math-game.git, branch `master`, first pushed by
  the user 2026-10-29. Rewriting unpushed history is fine. Commits cut by feature, message says what and why, not the
  story of how it was found.
- **Keys**: never print, never commit. `math_game/.env` (git-ignored) holds OPENAI_API_KEY, ELEVENLABS_API_KEY,
  ELEVENLABS_MODEL_ID, ELEVENLABS_OUTPUT_FORMAT. A STALE ELEVENLABS_API_KEY sits in the user's OS environment (401
  "invalid key"): always go through `tools/audio/run.py`, which reads the repo's `.env` first. The user once insisted
  the key was valid and paid up - it was; the stale env var was the culprit. Suggest removing it from the OS env.
- **Testing**: always `?cicho` in every game URL (otherwise voices and music go to the user's speakers). Never start a
  second server on 8750 - the user runs `python manager/server.py`; test in a tab of your own. The user often plays
  the same lesson by hand in the browser pane at the same time.
- **Autonomy**: within an approved plan work without asking about each step (stages 1, 4, 5, 6 were approved that
  way). Ask before a NEW mechanic; mechanics the user proposes are approved by that. Ask on a change of direction.
- **Sound**: everything audible from ElevenLabs ("wszystko generujemy w elevenlabs") - voices, music, effects, the owl
  song; only tuned notes (exact pitch: water glasses, owl hoots) are synthesised.
- **Pictures**: everything the child sees is painted by gpt-image ("chodzi mi o to aby te rzeczy były ŁADNE dla
  dziecka"). What code makes (a maze plan, spots on a map) goes to gpt-image as a reference or is found in its
  painting; vector shapes, numpy drawings and CSS are for tests only. Even the speech-bubble signs (worried face, heart)
  and the stage-card icons were repainted with gpt-image after the user flagged vector ones.
- **Comments**: one line where it adds something; reasons go to the commit message.
- **Visual judgement by eye**: render, snapshot, look; measure only what the eye cannot settle (counts, positions).
- **Content rules**: lines never assume the child's gender; counting up to 3 is fine before the counting lessons, more
  is not; no digits before the digit lessons (shapes colours by SIGNS, not numbers); a colour a story names must stay
  (sticker variants keep it).
- **How the user reports**: screenshots mid-task, short Polish notes, often several in a row while Claude works.
  Fix what they flag before going on and say what was fixed. They test on a tablet-like landscape screen.
- **When the user asks a question, answer it** (e.g. "nie rozumiem" -> explain plainly, then offer the fix); for a
  verdict ("ciąć czy latać?") give an opinion with reasons.

## 2. The product

- A maths game for children 3-6 (Polish first, English too) on a landscape tablet, 4:3..16:9; the safe area is 4:3
  (12 x 9 units) in the middle, the background scaled to a fixed 16:9 design frame around it (never to the viewport).
- Production: https://matematyka.cubeproject.pl = the `game/` folder as the domain root (the user deploys it
  himself). Meta tags need full URLs with that domain (a relative og:image did not work in Messenger); after changing
  the link preview remind the user to refresh it in the Facebook Sharing Debugger.
- The game must work OFFLINE: three.js and the Baloo 2 font live in `game/vendor` (2026-10-29); never add a CDN.
- Lessons: 24, in six stages ("Etap 1".."Etap 6" in `game/lessons/index.json` topics). A topic opens when every lesson
  of the one before has its sticker; typing "admin" in the menu opens everything; `?wszystko` too.
- Each lesson: story (an adventure), practice (five different mini-games, stars), at home (apply it in a room, ends
  with a task for the parents and the lesson's sticker). Stage cards: the narrator says "Poznaj opowieść!", "Teraz
  ćwiczenia!", "Wracamy do domu!" (game/etapy). The menu keeps its scroll position (localStorage).
- Stage plans written before building: `game/lessons/etap1_plan.md` .. `etap6_plan.md`.

## 3. Characters

Nine cut-out puppets (gpt-image pieces, `tools/characters`), natural height in scene units from `meta.json`
(`wysokosc`, the game always draws them at it), voices per language there too:

| who | name | height | notes |
|---|---|---|---|
| lisek | Fox | 3.6 | the default guide; red things in grouping |
| wiewiorka | Squirrel | 2.7 | three quarters of Fox |
| sowa | Owl | 3.6 | the biggest head (gets the biggest cap); owlets are stickers (`sowiatko`) |
| sarenka | Deer | 3.6 | gpt-image output moderation blocks deer at random - retry, never rewrite |
| mis | Bear | 4.3 | the tallest |
| jez | Hedgehog | 2.1 | small, shy |
| kret | Mole | 2.5 | sees badly (a story device), lives underground |
| bobr | Beaver | 3.2 | the builder; tail piece regenerated 2026-10-29, the user then corrected it in the editor |
| zajac | Bunny | 3.1 | the hasty one (piles blocks anyhow, pranks) |

- Every character has its own encouragement voice (game/zachety speakers = all nine): "śmiało spróbuj" once played in
  Fox's voice for Bear - never let a line fall back to another character's voice.
- Editor corrections (`poprawki.json`) are ABSOLUTE positions of pieces: after regenerating a piece the old correction
  misplaces it (Beaver's tail stuck out). Never reinstall a character while the user edits it in the editor - on
  2026-10-29 a reinstall raced the user's save (the user's later save won; check `postac.json` after such a clash).
- Walks: capped at ~3 s (Owl took 23 s once); fast tiny steps looked "dziwne" - a slight glide is better, cadence at
  most 1.5x natural (`KADENCJA` in scene.js).
- Cups are held handle towards the paw (`UCHO` flip in scene.js).

## 4. Lessons - state on 2026-10-29

All recorded pl + en, all pass the autopilot end to end. "Tools" = story tools used. Sceneries in order.

**Etap 1**
- `one_many` (Jeden czy wiele?) - Squirrel's winter store: Fox's one huge pumpkin is not "a lot"; nuts are many;
  plate (one) vs basket (many); a lone duckling for Mother Duck (ducklings half her size); claps: one and many by
  ear. Sceneries ogrod, strumyk, dom. Left without new story tools on purpose (the lone duckling is already on screen).
- `spot_difference` (Znajdź różnice) - the magic pond: Fox's reflection without the scarf (`odbicie`; the reflection
  must not vanish on a wrong tap), picture pairs, Owl's drawing vs the pond's copy, three rounds of "what is gone"
  (framed row, "?" in the gap, "na górze" in the line), the swapped toys ask for BOTH toys. Ends at Granny Owl's oak
  (`dab_babci`, she sleeps by day). Sceneries laka, dab_babci, pokoj.
- `bigger_smaller` (Większy, mniejszy) - Squirrel's new home: a hollow cannot be carried, its old round DOOR can
  - held against each new hole in any order, Fox comments, then the question; the door drawn in front of the holes.
  Caps: biggest for Owl, middle Fox, small Squirrel (placed high on the heads). Ends at Squirrel's new oak
  (`dab_wiewiorki`): big acorns fit the bigger hollow. Sceneries las, dab_wiewiorki, pokoj.
- `long_short` (Krótki i długi) - the plank bridge lies bank to bank, diagonally; ribbons turn smoothly; plank ends
  marked with ticks and commented; the snail race; Deer's map with TWO PATHS - the child taps the whole shorter path
  (paths, not points); ends on the picnic glade (`polana_piknik`, baguette on the blanket); at home scarves and a
  kitchen pasta scene (5 pasta stickers at true lengths, laid from one line). Block counting removed (no counting
  before it is taught).

**Etap 2**
- `tall_short` (Wysoki i niski) - the reference for camera work (~0.7 shots per line). Squirrel on the stump is "the
  tallest" (the stump stays in shot); the tallest stick mends the ladder; inside the treehouse (`domek_wnetrze`) a
  chest, the key on the highest peg, a spyglass; through it the orchard from above with 6 hidden mice (`szukaj`,
  a different mechanic from spot-the-difference - the user loved the change of perspective: "one nie mogą być
  nużące!"); Hedgehog must not cover the tree asked about; at home the height chart, Hedgehog on books.
- `ordering` (Po kolei) - REBUILT 2026-10-29 ("brakuje polotu", "przemyśl architekturę"): one thread, Beaver's evening
  concert. Lantern tower (blocks stand only in order; Bunny's pile falls); Beaver's old map (`mapa_polany`): mark where
  the path crosses the brook; owlets wait on the FAR bank (higher up = smaller), stones laid in the water from the
  lowest, owlets hop across and grow as they come near; the concert glade (`polana_koncert`): the choir lines up from
  the smallest and sings a wordless owl song (ElevenLabs `chor_sowiatek`), Bunny swaps two - `chor_falsz` - the child
  finds an owlet out of place; at home (`pokoj_noc`) a water-glass xylophone (`szklanka_1..4`, notes `szklo_1..4` =
  C5 E5 G5 C6, fullest = lowest): tap each, put in order, it plays a rising scale, the child plays it glass by glass.
  Practice kept (cups, carrots, the apple for the gap, which row of leaves, a tower of three) - different from home.
- `shapes` (Figury geometryczne) - Hedgehog's house: circle traced (both ways round - closed outlines), triangle's
  3 corners counted, square's corners touched without numbers (4 is not taught yet); Hedgehog's crayon drawing of his
  dream house (mark the triangle roof); building: each slot drawn as its shape's outline OVER what lies there (window
  and door were invisible under the wall, the triangle's place was once a rectangle - "metodologicznie
  nieakceptowalne"); the bush really hides Hedgehog (renderOrder 35); kites painted with gpt-image (4 shapes), the
  geometric square laid on the chosen kite, the others vanish, it turns in the middle. Practice: tangram, turned
  shapes in rows laid by their turned widths (they overlapped), colouring by SIGNS. The catching game was removed by an
  agent to shorten the story (the user may want it back).
- `morning_night` (Rano i wieczór) - Mole thinks it is always night; morning icon with a crowing rooster (morning and
  evening were hard to tell apart); cards of the day in order; the lost little hedgehog led home through a dusk forest
  maze (`las_o_zmierzchu`) before the night; ends at his oak at night (`dab_noc`), fireflies.

**Etap 3**
- `noticing_order` (Zauważanie porządku) - Owl's picture book, Bunny drops the pages; seed to flower; the snowman's
  missing step; hop race. No new tools (the pages already are the pictures). Ends in ogrod.
- `counting_3` (Liczymy do 3) - Hedgehog's birthday, Bear counts a candle twice ("four!"); digits traced; in a new
  raspberry thicket (`malinowy_zagajnik`) Grandma's cake recipe (`przepis_tort`): count its 3 raspberries, then pick 3.
- `more_fewer` (Więcej, mniej) - the night of the fireflies with its own night tools (`ctx.noc`, `ctx.swiatlo`),
  stumps game to music. Left as it was (already ~10 interactions and its own travel).
- `logical_pairs` (Co do pary?) - the storm blew things into Beaver's workshop; Mole pairs a red cup with a red apple
  (looks alike is not "goes with"); finger-drawn pairing lines (`polacz`); Mole's old photo (`zdjecie_kreta`) shows the
  hammer in his paw - so the nail is his too; Deer's key.

**Etap 4**
- `numbers_1_5` (Liczby od 1 do 5) - Mole's train: tickets cost their number in coins, passengers board the wagon of
  their ticket; the duckling and the snail run up late with tickets bought the day before (1 and 4) so all five who
  get off at the lake were seen boarding; Bear's five apples far apart ("mine are more!"); the lakeside stop
  (`stacja_jezioro`).
- `up_down` (U góry i na dole) - Squirrel's apple day, Bunny on his head; Fox's lift PLAN (`plan_windy`): mark the
  wheel at the very top and the basket at the very bottom, then the lift (`winda`, painted parts, the rope never over
  a sticker) works up and down; the wind sort; "jump up!".
- `in_out` (W środku i na zewnątrz) - the evening before the storm: the fence with a gap, the child draws a closed
  one (`zagroda`); the duckling "in" the basket is only next to it; thunder scares it off, the child leads it through
  a maze (`sciezki_do_norki`) into the burrow; ends in the warm burrow in the storm (`norka_burza`), shell game.
- `tangram` (Tangram) - Owl's shadow theatre; Bear throws away a triangle that only needed turning; each finished
  puppet's shadow comes alive; the poster (`plakat_teatru`) shows a cat they have not made - mark its two triangle
  ears (the two spots overlap a little).

**Etap 5**
- `grouping` (Grupowanie) - a detective story on the autumn panorama: red gifts; grouping by one rule then
  another; a forest map (`mapa_lasu`) with yellow, green and red leaf paths - follow the red one; ends inside Fox's red
  home in the oak (`lisia_nora`), his red hat found.
- `front_back` (Z przodu i z tyłu) - hide-and-seek: Bunny "hides" in front of the bush with his eyes shut; Bunny's
  photo (`zdjecie_chowany`): the mouse's ears peek from behind the hedge, the hen in front of the bench is seen whole;
  the maze garden (`ogrod_labirynt`, maze `labirynt_chowany`): Hedgehog finds her. 9 story interactions - the user said
  do not trim.
- `rhythm` (Rytm) - the friends' band for the parents' afternoon concert; heard, seen (garland), danced; the method
  is always "play the row from the start". The longest lesson (~10 min minimum). Left as it was.
- `queue` (Kolejka) - the race ends in a photo finish (`fotofinisz`): mark who touches the line first, then who came
  last; racers face the way they run; the podium glade (`podium_wyscigu`) with a painted podium sticker, medals in
  order. 7 story interactions - do not trim. Open: tapping the photo's empty background plays "that one was faster".

**Etap 6** (since 2026-10-30 only `counting_5` is built here; `numbers_6_10` moved to stage 7, `adding_5` to stage 12,
`adding_10` to stage 18 - see section 5)
- `counting_5` (Liczymy do 5) - pass 2026-10-30 (2701ef76): Bear's bakery, the flour scratch-off hides five rolls,
  spread rolls are still five; Owl's order note (`zamowienie_sowy`), four rolls packed; ends at Owl's tree
  (`dziupla_sowy`): four owlets one roll each, four coins; home: supper for five (plates and cups one to one, hoots
  counted). Nothing past five, no adding language.
- `light_heavy` (Lekki i ciężki, new 2026-10-30, 50245c86) - Beaver's raft dips under Bear; the balance (`waga`, first
  use) beats Bunny's "big = heavy"; home: heavy low / light high on the kitchen shelves, pumpkin soup.
- `complete_shape` (Brakujący kawałek, new 2026-10-30, df11ad01) - Owl's picture for Hedgehog torn by the wind
  (`podarty`, first use), the red square sticks out of the triangular hole (shape, not colour); home: the broken plate,
  a house from pieces, the birthday card. `thick_wide` ("Czy się zmieści?") still being built.

- `numbers_6_10` (Liczby od 6 do 10) - Beaver's dam needs ten logs; Mole loses track ("twelve!"); counted into a row;
  two more from the forest; the dam itself shown at last (`tama_bobra`): ten counted again and laid in two rows of five
  like the ten frame (that shot stays wide on purpose - a zoom slides the painted hole off the logs).
- `adding_5` (Dodawanie do 5) - Fox's picnic, guests arrive; Fox's invitation (`zaproszenie_lisa`, painted from the
  game's stickers as references): mark who is not on the blanket yet; equations with a gap for a card; dominoes
  (approved mechanic).
- `adding_10` (Dodawanie do 10) - counting on; the ten frame (approved mechanic); the promised hopscotch tournament
  finally happens on a new square (`turniej_klasy`): from the 7 three more hops to the ten, 7 + 3 = 10.

**Minimal pass times** (a child who never errs, 2026-10-29): 3:40-7:15 per lesson, rhythm ~10:00, all 24 ~2 h 7 min,
mean ~5:20; a real child 1.5-2x. Speech measured by the autopilot for 3 lessons, summed from the code for the rest
(±25 %); taps, walks, cards and the sticker estimated - real-time runs stall in the hidden pane.

## 5. Decisions and rules the user set (with the feedback behind them)

- **Stage 6 is not arithmetic** (2026-10-30, user: "dodawanie do 5 i do 10 to kolejne lekcje?", "liczymy do 10 jest
  później niż dodajemy do 10 - bez sensu"): the competitor adds only after a whole block of comparing, counting to 10
  and decomposition, and puts ~19 lessons between adding to 5 and to 10. World 1 ends with one number lesson
  (counting_5) and three non-numerical ones (light_heavy, thick_wide "Czy się zmieści?" = thick_thin + wide_narrow merged, complete_shape).
  Moved, built lessons keep their ids and stickers: numbers_6_10 -> stage 7 (replaces the duplicate counting_10),
  adding_5 -> stage 12 (after split_5, before subtract_5), adding_10 -> stage 18 (replaces the duplicate addition_10).
  New placeholders: quick_look (subitizing, stage 7), capacity (stage 8), missing_5 (stage 13). Full table in
  docs/program.md.
- **Worlds 2-4 checked after it** (2026-10-30, user: "sprawdź logiczność"): no lesson may need what comes later
  (the clock needs 11-12, coins need adding to 10, two-digit sums need place value) and no skill taught twice; a
  duplicate is MERGED and the freed place goes to a gap the order exposed (doubles, numbers_100), never a topic
  invented to fill a slot. Changes listed at the end of docs/program.md.

**Editing and camera** (flagged "static" again and again - "uwagi o dynamicznym montażu wracają")
- A static camera is a bug in every lesson and stage: at most three lines in one shot; close-ups for emotions,
  medium shots on what is talked about, two-shots for dialogue, wide before every task and walk. Written as a hard
  rule in guidelines.md; the story preview flags four lines in one shot.
- There is no "plain" vs "pro" lesson: the pro rules (atmosphere and editing) are the default for all.
- Cut or fly, decided by one key in the engine (`efekty.js ruchKamery`), after the user saw a prototype: CUT on a
  change of subject (another face, other things, a new place); FLY when something stays in the shot, when widening
  back to the scene, and wide to medium; close-ups from afar are cuts with speed lines; a held shot creeps in 5 % in
  8 s; a long flight rises over the scene (the zoom dips half way). `?kamera=ciecie|lot` compares.
- The speaker is always in the shot ("nie widać postaci, która mówi... fixnąć matematycznie"): before every line
  `mowcaWKadrze` measures the speaker's head against the shot and widens it.
- A medium shot pushed in from the background's edge steps back until all it frames fits.

**Story**
- "For the child it is a story": narrate every step; a weak story becomes an adventure (tall_short's treehouse was
  the model: "gdybyśmy weszli do tego domku... i tam coś znajdujemy fajnego").
- The story ends somewhere new with its own scenery ("background jest tańszy niż mp3 jeśli chodzi o kb") - a
  dedicated place for the last adventure is never too much.
- Found pictures (the user's own mechanic, 2026-10-29): a picture someone finds (map, photo, drawing, poster; square
  or oblong) flies up big; the child marks 1..n POINTS or whole PATHS on it, and the answer moves the story on ("tam
  jest skarb i tam idziemy", "co trzyma w rączce - jabłko - i to ma znaczenie dla fabuły"). What is marked must be
  recognisable at a glance by a 3-year-old (two dots on a plain stretch of path were rejected: "mało cech
  charakterystycznych").
- Mazes (the user's own mechanic, 2026-10-29): a simple maze the child leads a pawn through so the story can go on;
  generated in Python, painted by gpt-image with the plan as reference, moves checked on the plan.
- Practice must not repeat the home stage, and the home stage must not be "bez polotu" (long_short, ordering,
  tall_short were redone for it).
- Story length: guidelines say ~5 interactions per stage, but the user said NOT to trim the grown stories.
- Methodology is checked hard: things that conflict with what is taught are bugs (counting before counting, digits
  before digits, a triangle's place drawn as a rectangle, a place nobody can see, a tower line mentioned but not drawn,
  "carry the old hollow" which is impossible).

**Look**
- Everything painted (see 1). Sticker variants: 3 per base sticker drawn at random (warianty.js), grouped with the
  base in the manager; the story's named colour stays; the skipping bunny variant was replaced with a sitting one.
- Sticker sheets for review: the manager's "pobierz arkusz" (one PDF page, a grid of equal squares, originals at their
  aspect, with names); backgrounds as plates one under another, fitted to the widest.
- Things must never overlap where a child chooses among them (rows laid out by drawn widths; "figury nie mogą
  zachodzić na siebie gdy pytamy który to trójkąt").
- Characters never cover what is asked about or talked about (owlets behind Owl, the duckling behind Owl, Bear over a
  ticket, Hedgehog over a tree were all flagged).
- Pixelated stickers are flagged at once (the pasta, the height chart): long or big stickers need 1024 px sheets.

**Sound and music**
- Every place has a looping theme in two ~150 s versions (30-45 s loops felt repetitive - "30s to za krótko"),
  crossfaded; weather loops next to it; ducking under speech; silence while a scene listens; the menu has two versions;
  the manager's "animowane" scenery preview plays music + weather. Fixed bug: menu and lesson music overlapping on
  return (`muzyka.zamknij()`).
- The end-of-lesson iris has a rising sound with a sweet close (`koniec`).

**Postponed**: the adventure map in the menu (liked, but only when the lessons are complete).

## 6. Engine and tools - what to know in practice

- **Autopilot / tests**: `?cicho&szybko&scenariusz&lekcja=<id>&etap=story` runs story, practice and home to the
  sticker. `gra.dziennik` = spoken lines [key, who, ms]; `gra.snap("x")` -> work/snap/x.png (look at it with Read);
  `gra.klikCel(i)`, `gra.cele`; `gra.pomin()` skips a scene; `S.upusc(item, x, y)` drops a dragged thing;
  `S.montaz` logs [shot, cut|fly]; `S.poprawkiKadru` counts speaker re-framings. The autopilot taps whatever is marked
  `dobry` - found-picture spots start NOT marked, the lesson marks the answer with `dobre(...)`.
- **Manager tabs Znaleziska / Labirynty / Różnice** (2026-10-29, the user asked for them with PDF export): review every
  picture task with its answers drawn in; the PDF endpoints need a server restart after server.py changes.
- **Story preview** `manager/opowiesc.html?lekcja=<id>` lists lines, shots and tasks and flags gaps in the telling
  (not yet run on the lessons changed 2026-10-29). Since 2026-10-29 it also flags a separate "Wskaż.", a bare
  "Brawo!" after a task, a wide shot cut away at once, a home stage under 4 interactions and a missing or repeated
  breather (lesson.json `oddech`). Static twin: `python tools/lessons/montaz.py <id>|all`.
- **Mechanics list**: `game_mechanics.md` (moved out of CLAUDE.md 2026-10-29) - ask the user before adding one.
- **Draw order**: background props < zones 9 < stickers 10 < shapes 10.5-12 < slot outlines 13 < puppets 20-30 <
  found pictures / mazes 38-39 (veil 38, opacity 0.58). A sticker that must hide a character needs > 30. Pencil lines
  over a big picture: `line(..., {warstwa: 39})` keeps the halo under the ink.
- **Found pictures** `tools/znaleziska/make_znalezisko.py <name>`: a picture, then an edit with magenta discs on the
  described spots (one edit for all points) or a thick magenta line along each path (ONE EDIT PER PATH - two paths
  share their ends and merged); the build skeletonizes paths (pieces chained end to end, a greedy walk took
  shortcuts); `refs` paints from the game's stickers; review `work/<name>_cele.png`.
- **Mazes** `tools/labirynty/make_labirynt.py <name>`: perfect maze (5-6 x 4 cells, seed), plain plan, gpt-image paints
  it from the plan, the build checks every wall and opening on the painting (must be 0 mismatches; else delete
  `work/<name>_obraz.png` and rerun); review `work/<name>_sprawdz.png`.
- **Spot the difference / hidden objects** `tools/roznice/make_roznice.py`: pairs; `szukaj` shows only picture b
  through a round spyglass with a count at the side.
- **Backgrounds** `tools/backgrounds/make_background.py all <scene>` (SCENY prompts; "at least fifteen tufts", "six
  or seven clouds"); review `python tools/backgrounds/debug_split.py <scene>`; add the scenery to `MOTYW` in
  `game/engine/muzyka.js` (its music theme) and to the lesson's `lesson.json` backgrounds.
- **Stickers** `tools/objects/make_objects.py all <sheet>` (62 sheets): options `px` (1024 for long or big things),
  `rows`, `kolumna` (model lays it top to bottom), `wspolna_skala` (things compared by size share one scale),
  `bez_obwodki`, `refs` (existing stickers as references). Prompts must say "fully TRANSPARENT background, NO glow, NO
  halo" (a glowing sheet once), and name every object concretely (vague names gave "akwarium", "gniazdo" mix-ups). The
  split keeps only each object's own blob (a neighbour's leaf came along with a notched outline); `die_cut` keeps the
  sheet's `px` (it once forced 384 and pixelated the pasta).
- **Audio** `python tools/audio/run.py <lesson>` (lines; skips unchanged by text hash; deletes recordings of removed
  keys), `--sfx [names]` (ElevenLabs sound generation; tuned notes in STROJONE always synthesised), `--music [names]`.
  Speech -20 dB, effects -27 dB, music -26 dB, weather renormalised to -34 dB mean (the speech-frame loudness measure
  misreads steady noise - use mean volumedetect).
- **Covers** `python tools/lessons/make_cover.py <id>` (delete `tools/lessons/work/<id>.png` first to redraw).
- **gpt-image**: models gpt-image-1 .. -2.5-sunburst; 2.5 draws better scenes but follows style worse - list what is
  NOT wanted; it cannot be trusted with exact counts above ~5 or with digits in pictures; output moderation blocks
  deer at random (retry).
- **Subagents**: waves of 3-4 (12 at once once burned 2.3 M tokens and all died at the session limit); each told: no
  commits, own browser tab, edit shared tool files only with small Edit insertions; review their pictures yourself
  before committing their work. A wave of 4 agents over 20 lessons took ~15-25 min each.

## 7. Traps that cost time

- **Recordings keep their originals** (2026-10-30, user: "skoro wypiekamy w plikach stratnych, musimy mieć oryginały"):
  `tools/audio/work/oryginaly/` (local, not in git, ~350 MB) holds ElevenLabs' file or the oldest version; every gain
  (a character's `volume` in meta.json, Bunny 1.1) is applied from there, so a recalibration is one lossy encode.
- **`python make_dist.py`** builds `dist/` for the server (index.html, og.jpg, engine/ at the root, the rest under
  /game/ - the hosting's layout); lessons without files ship as placeholders.
- **No parallax on the stage** (fixed 2026-10-30, user: "postacie pływają"): a shot must never move the camera's eye -
  puppets (z 0) and grass (then z -1.2) slid against the plate (z -9). `kadrBezParalaksy` (scene.js) turns
  camera.position.x/y into an off-axis projection shift; the movers lie just in front of the plate (tlo.js).
- **The hidden browser pane**: rAF runs at 0 fps although the page says visible; screenshots are stale; real-time
  runs stall on animations (szybko runs work). JS evals time out at 45 s - split long polls. Background tabs throttle.
  An autopilot inside an iframe stalled on a drag where the same lesson in a tab passed.
- **Comments that swallow code**: inserting `// comment` into a one-line statement swallowed the code after it twice
  (colouring, the found picture's veil - the veil never showed for a whole wave of lessons). After such an edit run
  `node --check` AND read the line.
- **Heredoc Python loses backslashes** - write the script with Write and run the file; `sed -i` turns CRLF into LF;
  write a file right after each successful replacement and verify on disk.
- **A traverse that sets renderOrder afterwards** resets special layers (the slot outline went under the wall).
- **`shake`** must move by an offset (restoring its starting x sent a wrongly dropped owlet home under the wrong
  slot, onto another one).
- **`ujecie`** measured things still popping in (scale 0) and framed empty boxes - it now waits for them.
- **`dwuujecie`** takes characters only (a sticker in its list threw); **`c.go(bg, {enter: true})`** hides the
  characters - `c.enter(...)` each one afterwards or they are missing at the new place.
- **The speaker check** must use the head only (a close-up never holds the whole body) and the stage's visible
  rectangle over the zoom (the camera is perspective, not orthographic).
- **Character overlap**: check every new scene's snapshot for characters covering things; the middle of the floor is
  narrow when three characters stand.
- **Story timing in szybko**: emotion bubbles last real time and can hang over the next scene in fast mode only.
- **Lesson code positions vs plate**: zooms slide the painted background against stickers (parallax) - things that
  must sit ON a painted thing (logs in the dam's hole, winners on a painted podium) need a wide shot or a sticker.

## 8. Open, not started

- **Plan state 2026-10-29**: phases 0, 1, 2 done (see the plan's status table); new mechanics in `game_mechanics.md`
  (ilustracja, miejsca, zdrapka, kropki, historyjka, podarty, wedrowka) and praise variants (`ctx.brawo`, game/pochwaly).
  Waiting for the user: which new breathers to build (`game/lessons/oddechy_plan.md`) and the placement / panorama
  tables (`game/lessons/rozmieszczenie_plan.md`); only then the lesson pass.
- **`PLAN_usprawnienia.md`** (2026-10-29, from the lesson audit, approved): mechanics moved to `game_mechanics.md`,
  praise / wrong-answer variants, 7 painted mechanics, the home stage as a third act, an editing pass per lesson,
  new breathers, panoramas, every "Wskaż." line rewritten. "Mam pięć zabaw" stays on purpose (a calm rhythm).

- noticing_order and one_many still end in shared sceneries, not a place of their own.
- shapes: the catching game was removed by an agent; ask the user if they want it back.
- queue: a new wrong line for a tap on the photo's empty background.
- long_short map: a right pick shows a tick and the path in pencil (fine); tangram poster: ear spots overlap.
- Covers not regenerated for the lessons whose stories changed on 2026-10-29 (only ordering's was).
- The story preview (`manager/opowiesc.html`) not yet run on the lessons changed 2026-10-29.
- The adventure map in the menu - when the lessons are complete.
