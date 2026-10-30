# Improvement plan (from the lesson audit, 2026-10-29)

The audit of all 24 lessons (story, practice, at home, editing) found the stories in good shape and three weak spots
that run through the whole game: the home stage is a stub, practice has the same answers and breathers everywhere, and
the camera is busy without being directed. This plan fixes them and adds seven painted mechanics. Every item says what
done looks like. Work in this order; each phase ends with a commit (local only) and a line in docs/MEMORY.md.

## Status

Updated at the end of every phase (date, commit).

| phase | state |
|---|---|
| 0 rules, docs/game_mechanics.md, flags, lint | DONE 2026-10-29 (f7296d08, 3e40898d, b073483a + flags commit). Baseline from `montaz.py all`: 1209 shots, 44 % wide, 28 two-shots, 2 inserts, 74 wide-then-cut, 237 ping-pongs, 111 "Wskaż." lines, 22 home stages under 4 interactions |
| 1 praise / wrong variants | DONE 2026-10-29: `game/pochwaly` (6 praise + 4 wrong, pl + en, all nine voices, 180 mp3), `ctx.brawo`, the wrong pool where a lesson has no line of its own; first use in shapes practice (verified: Owl said brawo_5) |
| 2 seven mechanics | DONE 2026-10-29 (1f2b8e2a, 9617ca36, 65b00498): ilustracja, miejsca, zdrapka, kropki, historyjka, podarty, wedrowka - engine, pipelines, 2 samples each (podarty / wedrowka reuse found pictures), demos on mechaniki.html, manager tabs Ilustracje / Miejsca / Zdrapki / Kropki / Historyjki, entries in docs/game_mechanics.md. Waiting: the user's look at the demos |
| 2b breathers designed and built | DONE 2026-10-29: six new ones built and tested on the mechanics page (kpn, lustro, karmienie, latawiec, ktoPowiedzial, malowanie) with their own line pool `game/oddechy` (23 lines x 9 voices x 2 languages); the swing was built and dropped by the user, skipping stones not built; the assignment in `oddechy_plan.md` avoids both |
| 3 home act, rooms with drop places | rooms DONE (dom, pokoj, pokoj_noc, przedpokoj have `miejsca.json`), the architecture is in docs/guidelines.md; the home acts themselves are written in phase 5. Found: the bookcase in pokoj / pokoj_noc and most of the doormat lie off a 4:3 screen, the hooks reach under the phase icons |
| tables: placements, breathers, panoramas | approved 2026-10-29; `oddechy_plan.md` rewritten 2026-10-30 as built |
| 4-5 pass over the 24 lessons | in progress: tables approved 2026-10-29; pilot one_many DONE (80350576); the brief for the agents is `game/lessons/przejscie_brief.md`; waves of 3. DONE: one_many, long_short, spot_difference, bigger_smaller, tall_short, ordering, shapes, morning_night, noticing_order, counting_3, more_fewer, logical_pairs, numbers_1_5, up_down (14 of 24); in_out, tangram, grouping, front_back, queue, rhythm (20 of 24); stage 6 (2026-10-30): counting_5 passed, light_heavy, thick_wide and complete_shape built new to the same standard - DONE for world 1 |
| 6 whole game | next. Covers checked 2026-10-30: all match their stories, none redrawn |

Decisions the user made for this plan (2026-10-29):
- "Mam pięć zabaw" stays: the repeated opening of practice gives children a calm rhythm.
- Praise and generic wrong-answer lines get random recorded variants per character (like the sticker variants).
- Breathers: new non-maths mini-games, swapped in so that no two neighbouring lessons share one.
- Home stage: rebuilt per lesson as a piece of story, never by repeating a mechanic more times.
- Editing: an LLM agent reviews every lesson's shots one by one; "wide then an immediate cut elsewhere" is forbidden.
- Every lesson line that ends with a separate "Wskaż." is rewritten (ElevenLabs reads it badly).
- Guidelines: the "reference lessons for the camera" sentence is wrong (history of the project) and goes.
- Seven new mechanics accepted: event illustration, drop places on a painting, scratch-off, connect the dots,
  a story strip from one picture, a torn picture, a walk on the map. Each comes with a review of where it goes.

---------------------------------------------------------------------------------------------------------------------

## Phase 0 - rules and checks first

0.0 **`docs/game_mechanics.md`** - the mechanics move out of CLAUDE.md into their own file, listed plainly:
- it opens with the rule: this is the list of what the engine offers today; when a mechanic NOT on the list would
  make a lesson better, ask the operator (the user) whether to add it - never water a lesson down to the list in
  silence, never build a new one without a yes (the rule of guidelines "A lesson asks for the tools it needs");
- one entry per mechanic: name, ctx call, what the child does, what it teaches well, the pipeline that paints it (if
  any), the test driver, the lessons that use it, the manager demo link (`mechaniki.html?m=`);
- grouped: pointing and choosing, dragging and placing, drawing with a finger, counting and numbers, sound and rhythm,
  painted pictures (found pictures, mazes, differences, colouring), story and film tools (camera, inserts,
  transitions, emotions, weather), breathers;
- CLAUDE.md keeps only the engine mechanics needed to build them (draw order, stencil, meshes) and points to
  `docs/game_mechanics.md`; docs/guidelines.md points to it where lessons choose tools;
- from then on every new mechanic of phase 2 and every new breather is added there, with its entry, in the same commit.

0.1 **Guidelines** (`docs/guidelines.md`, "Atmosphere and editing"):
- remove "tall_short, grouping, more_fewer are the reference, about 0.4-0.7 per line" - they are now the most
  static lessons (no shot at all in their practice, up to 10 lines in one shot). Name a new reference only after the
  first lesson passes phase 5;
- add the editing rules from phase 4 (no wide shot that is cut away at once, two-shots for exchanges, a shot has a
  reason);
- inserts on a plain colour: replace "roughly every other shot" by "every moment where a method is shown or one thing
  is talked about alone gets one" - the user likes them and wants MORE (used twice in 24 stories today); expect
  several per story, in practice and home too, but placed where the moment calls for it, not by a count;
- the home stage architecture of phase 3;
- the breather rule: a breather is NOT maths, and two neighbouring lessons never share one.

0.2 **Story preview flags** (`manager/opowiesc.html`), so each rule is checked by the tool, not by memory:
- a wide shot followed by another shot with no line, task or movement between ("szeroki i od razu cięcie");
- a bare praise ("Brawo!" and the like) right after a task whose answer could be named;
- a home stage with fewer than four interactions or no problem of its own;
- a line ending with a separate one-word sentence ("Wskaż.");
- the same breather as in the lesson before or after (by mechanic name).

0.3 **Montage lint** `tools/lessons/montaz.py <lesson>|all`: from lesson.js, per stage - lines, camera calls, shot
types, the longest run of lines in one shot, wide-then-cut count, zoom-one-line-wide ping-pongs. The audit numbers to
beat: 75 wide-then-cut, 232 ping-pongs, 28 two-shots in the whole game, 44 % of shots wide.

Done: `docs/game_mechanics.md` lists every ctx mechanic in use (checked against `player.js`), guidelines committed, the preview shows the new flags on a lesson known to break them, the lint prints the table.

## Phase 1 - praise and wrong-answer variants

What: like `warianty.js` for stickers, a pool of recorded variants per character.
- `game/pochwaly/i18n/pl.json`, `en.json` (the shape of `game/zachety`): about six praise lines ("Brawo!", "Świetnie!",
  "Super, udało się!", "Tak jest!", "Ale z ciebie bystrzak!" - no gender), every line with `speakers` = all nine
  characters, so every character has every variant in its own voice; the same for a gentle wrong pool ("Hmm, to nie
  to. Spróbuj jeszcze raz.", "Prawie! Popatrz jeszcze raz.") - invitations, never a verdict.
- Engine: `ctx.brawo(who)` plays a random praise of that character, never the same one twice in a row in a lesson; the
  wrong pool plays where an interaction has NO `wrong` line of its own (today a silent shake) and replaces the few
  generic ones ("Tu jest pusto. Spróbuj jeszcze raz." stays - it says what happened; bare "Spróbuj jeszcze raz" goes).
  A dedicated wrong line always wins.
- Audio: `python tools/audio/run.py` must record the pools (9 voices x ~10 lines x 2 languages, about 180 short mp3).
- The 54 bare "Brawo!" in practice: in phase 5 each becomes either a line that names the answer ("Tak, trzy
  gruszki!") or, where nothing can be named (a finished tangram), `ctx.brawo`.

Done: pools recorded, `ctx.brawo` used in one lesson, a run with `?cicho` logs different variants in `gra.dziennik`,
CLAUDE.md documents it.

## Phase 2 - seven new mechanics

Each mechanic follows the found-picture recipe (why it hit): gpt-image paints the whole thing in one go, the code only
READS the painting (a magenta key, a plan it checks against), the thing is an object in the story so the answer moves
the plot, what the child marks is recognisable at a glance, it is a big picture (a free insert shot), and the manager
can review it. Each one: engine module + ctx call, a `tools/<name>/make_<name>.py` pipeline with a `work/` review image,
a demo on `manager/mechaniki.html?m=<name>`, a test driver (`S.<name>.dokoncz()`), a tab or section in the manager's
review pages, an entry in `docs/game_mechanics.md`. Build them one at a time, show each on the demo page before the next.

2.1 **Event illustration** (`ctx.ilustracja(name, {...})`) - the comic-book panel for what puppets cannot act: a storm
at night, a train on a bridge, the race start, the sun rising, the parents applauding.
- Pipeline: a full-frame painting from a prompt, characters and sceneries as references (style and cast stay the same).
- On screen: it arrives like a big photo or stamp with a white frame laid onto the screen - a 3D plane that comes in
  tilted, bends like paper as it is put down (a vertex bend over a grid, as in `siatka.js`), settles with a shadow;
  the camera creeps over it (slow push or pan); weather particles can run over it; the speaking character shows as a
  head badge in a corner (the transition badges) with lip-sync, so there is still no narrator; at the end it slides
  down off the screen.
- Review: where it goes (candidates below), at most one or two per story.

2.2 **Drop places on a painting** (`ctx.miejsca(name)` -> places as drop targets for `sort` / `place` / `slots`) - a
painted room (shelves, hooks, a table, a box, a curtain) where things are put ON painted places instead of floating
stickers. Pipeline: the room, then an edit with a magenta patch on every place described in words (as found-picture
spots); places carry names ("gorna_polka", "pod_stolem"). This is the main tool of the new home stage (phase 3).

2.3 **Scratch-off** (`ctx.zdrapka(name, {cover})`) - the child rubs off snow, sand, mud, leaves or a fogged window with
a finger and a painted scene shows underneath; then something on it is counted or pointed to (found-picture spots).
Pipeline: the uncovered painting and a covered edit of it (two passes, as backgrounds); the engine erases the cover's
alpha along the finger, done at a threshold. A tactile breather as well as a story beat.

2.4 **Connect the dots** (`ctx.kropki(name, {znaki: cyfry | obrazki | wielkosc})`) - dots on the outline of a painted
picture; joined in order, the picture fades in (a constellation turns into a bear). Before the number lessons the
order is given by pictures or by dot size (ordering: from the smallest), digits only from numbers_1_5 on. Pipeline:
the painting; dots from its alpha contour (or a magenta line along the outline), evenly spaced at corners first.

2.5 **A story strip from one picture** (`ctx.historyjka(name)`) - gpt-image paints 3-4 comic panels in ONE image (the
same characters in every panel - its strength), the code finds the gutters and cuts cards; the child orders them or
picks the missing one. Pipeline checks four panels found, equal size; review image with panel numbers.

2.6 **A torn picture** (`ctx.podarty(name, {kawalki: 4..6})`) - any found picture torn by the story (the storm, a
puppy): pieces with a torn-paper edge scattered, dragged into the frame (snap when close and turned right), then the
usual found-picture task on the whole. No new painting: the cut is code on a picture that is not a character (allowed;
the no-cutting rule is for puppet pieces), the torn edge is a painted texture from gpt-image.

Built differently (2026-10-29): the torn edge is drawn by code (a jagged cut shared by neighbours, a white paper-fibre
rim) - a painted edge could not make the pieces fit each other; it is an edge effect like the stamp's perforation.

2.7 **A walk on the map** (`ctx.wedrowka(name, {pionek, cel, rozwidlenia})`) - the pawn is dragged along a painted path
of a found picture (the skeleton we already make for path spots); at each fork the story asks a maths question ("the
longer bridge", "where there are more trees", "up the hill") and only the right branch lets the pawn on. Pipeline:
paths as in `make_znalezisko.py` with fork points named.

Done per mechanic: demo works on the mechanics page, pipeline makes one sample with its review image, its entry is in
`docs/game_mechanics.md`, and EVERY new asset (illustrations, rooms with their places, scratch-off pairs, dot pictures,
story strips, torn pieces, walk maps) can be browsed in the manager (`http://localhost:8750/manager/`, a tab like
Znaleziska with the answer drawn in) - the user asked to be able to look at all of them there.

## Phase 2b - breathers: design and build the non-maths mini-games

The breather list in phase 5 is a list of ideas; this phase turns it into games. Steps:
1. A design sheet `game/lessons/oddechy_plan.md`: 10-12 breathers, each with what the child does (one gesture a
   3-year-old gets at once), what the characters do, the sound, what it is built from (existing parts or new code,
   new pictures), how long it takes (30-60 s), and which kinds of story it fits (outdoors, water, night, home).
   No maths in any of them; none is "catch what pops up" again.
2. The user picks which to build (a new gesture or new code needs a yes, per `docs/game_mechanics.md`).
3. Build the chosen ones as engine calls (`ctx.oddech(name, opts)` or one call each), each with a demo on
   `manager/mechaniki.html?m=<name>`, a test driver and an entry in `docs/game_mechanics.md` section 8.
4. The assignment table (every lesson one breather, no two neighbours alike) goes to the user with the other tables.
Done: the chosen breathers run on the mechanics page; the table is approved.

## Phase 3 - the home stage as a third act

Today: about 5 lines and 1 interaction per home stage against about 27 lines in the story; the story's thread is often
dropped ("zabawki w kolejce do spania" after a race for medals). The architecture, for every lesson:
1. **Arrival with the thread**: the promise or reward of the story is the reason we are home (the housewarming, the
   feast, the concert for the parents). Say it.
2. **A home problem of its own** with a character's mistaken idea, the same misconception as in the story but in a
   room ("Wszystko do jednego pudła!", "Ja stanę na książkach!").
3. **Four or five interactions in different forms** on a painted room with drop places (2.2): put, point, count, order,
   a scratch-off or a story strip - not one mechanic four times.
4. **The payoff**: the problem solved thanks to the idea, the promise kept and SEEN (an event illustration for a
   concert, a party, a goodnight).
5. **The home task shown in play**: the characters do on screen what the parent and child will do at home, then the
   line for the parents, then the goodbye iris.
Rooms: `dom` (kitchen), `pokoj`, `przedpokoj`, `pokoj_noc` get drop-place versions (`miejsca`) once, shared by lessons.

## Phase 4 - editing, lesson by lesson (an LLM agent per lesson)

The agent reads the lesson's scenes in order and gives every line a shot WITH A REASON, not a template:
- forbidden: a wide shot cut away at once (it is a wasted flight out); a shot changed with no line, task or movement;
- a dialogue of two is a two-shot (or shot / reverse shot) - not a close-up per line and back to wide each time;
- zoom-one-line-wide ping-pong only where the line is an emotion or a reaction;
- an instruction is said in the shot that shows the task (the child looks at the options, not at a face);
- the wide shot is for tasks, walks, arrivals and things moving across the screen;
- inserts on a plain colour (`ctx.go({kolor, motyw})` - the scenery fades, the characters stand on one soft colour
  with a light circle and faint drifting shapes) at every method and every thing talked about alone - the user wants
  many more of them; the agent lists each insert it added in the lesson's commit;
- a pan on a panorama instead of a cut when the place is the same (see the panorama review below);
- practice and home are edited too (three lessons have no shot at all in practice).
Checked by the lint (0.3) and the story preview (0.2); the numbers of the lesson go into its commit message.

## Phase 5 - the pass over every lesson

One lesson at a time (agents in waves of 3-4, each in its own browser tab, no commits by agents; review their pictures
before committing). For each lesson, in this order:
1. scenario.md updated first (story notes below, the new home act, the breather, the new mechanics placed);
2. i18n pl + en: rewrite every line ending in a separate "Wskaż." into one sentence ("Wskaż, kto z nas jest
   najwyższy." - the 111 lines are listed by the preview flag); the English twins follow the same sentence ("Point
   to the tallest of us."); every bare "Brawo!" either names the answer or becomes `ctx.brawo`;
3. pictures: new illustrations, drop-place rooms, scratch-offs, strips, maps (pipelines of phase 2);
4. lesson.js: the story notes, the home act, the breather, the editing pass (phase 4);
5. `python tools/audio/run.py <id>` once the lines are final (changed texts re-record by hash; never rename a key);
6. autopilot run with `?cicho&szybko&scenariusz`, snapshots of every scene, the story preview with no flags;
7. cover redrawn when the story changed (`make_cover.py`), docs/MEMORY.md lesson entry updated, one commit per lesson.

### Lesson notes and candidate places for the new tools

Candidates are proposals for the review step of each mechanic; the user approves the final list per mechanic before
the lessons are touched. "Breather" = the current one and what to do with it.

| lesson | story notes from the audit | home act (thread to close) | candidate new tools |
|---|---|---|---|
| one_many | strong misconception (the pumpkin); ends in the shared `strumyk` - a place of its own | the winter feast: one table, many guests; Squirrel's pantry shelves | scratch-off: snow over the garden hides the stores; drop places: pantry; illustration: the first snow |
| spot_difference | the ending has no payoff (Granny asleep, "she will find it tonight" never seen) | home "what changed" is not linked to the drawing | illustration: Granny finds the drawing at night (the payoff); scratch-off: the fogged pond |
| bigger_smaller | the door template is good; practice 3 names nothing | the housewarming (kept), add a home problem: cups and chairs by size | drop places: Squirrel's new hollow inside; illustration: Squirrel stuck in the old hollow |
| long_short | best visible consequence (the plank falls in); the picnic glade is 3 lines, no interaction | scarves + pasta (kept, rich) | walk on the map: the two paths, walk the shorter; torn picture: the picnic map |
| tall_short | best chain of adventures; practice has no shot at all; 13 "Wskaż." | height chart (kept, rich) | illustration: the view from the treehouse; drop places: hallway pegs by height |
| ordering | tower falls (good); the evening concert promised at home is never seen | xylophone (kept, the best home) - end with the concert seen | illustration: the concert at night (promise kept); connect the dots by size: the lantern; story strip |
| shapes | NO misconception: the story opens with a lecture and three tracings; the catch game was removed - ask the user | kitchen shapes: 1 task | connect the dots: corners into a triangle roof; torn picture: Hedgehog's drawing torn into shapes; drop places |
| morning_night | Mole's "always night" good | evening routine: 1 ordering, 3 lines | story strip: the day; scratch-off: the fogged morning window; connect the dots: a night constellation (pictures); illustration: sunrise |
| noticing_order | ends in the shared `ogrod`; the hop race is maths, not a breather; 3x "Brawo, wszystko po kolei!" | sandwich: 1 ordering | story strip: Owl's picture book pages (the natural fit); drop places: kitchen counter steps |
| counting_3 | Bear counting a candle twice (good); 4 bare praises | cake and spoons (2 counts) | scratch-off: raspberries under leaves; drop places: three places at the table; illustration: blowing out the candles |
| more_fewer | strong misconception; the most static camera (runs of 8-10 lines) | pillow fight (kept, rich) | illustration: the fireflies' dance; walk on the map: where more fireflies |
| logical_pairs | Mole's photo (good); "Połącz palcem" twice in practice | hallway pairs: 1 task, 3 lines | illustration: the storm at night (now only told); torn picture: Mole's photo; scratch-off: mud on the things |
| numbers_1_5 | nobody is helped; 4 bare praises | backpack + fingers (2) | illustration: the train on the bridge; connect the dots 1-5: the engine; panorama: the ride through the forest |
| up_down | weak climax (the "jump up" game); `jesienny_sad` is a panorama but never panned | hallway: 1 sort, 3 lines | drop places: hooks up, floor down (the natural fit); walk on the map: up the hill / down the hill; pan |
| in_out | the fence with a gap (good), the burrow in the storm (good) | toy box: 1 sort | illustration: the thunder; scratch-off: the steamy burrow window; drop places: in the box / out on the rug |
| tangram | practice and home repeat the story's puzzles (house, fish, boat, cat) | kitchen tangram again | torn picture: the theatre poster; connect the dots: a shadow outline; new practice puzzles of their own |
| grouping | best story; practice has no shot and terse lines ("Szybko! Łap grzyby!") | Fox's visit (kept, rich) | walk on the map: the red path with colour forks; torn picture: the forest map |
| front_back | Bunny "hidden" with eyes shut (good); 5 bare praises | curtain + armchair (2) | drop places: behind the curtain, in front of the armchair; scratch-off: a leaf pile; illustration: the seeker counting |
| rhythm | strong all through; the longest | the concert for the parents (kept, rich) | illustration: the parents applauding (the payoff) |
| queue | photo finish (good); 9 "Wskaż." | toys in a queue to bed - not linked to the race | illustration: the race start; story strip: the race; home: a medal ceremony for the toys or the family queue |
| counting_5 | ends where it started (the bakery) | table for five (2 counts) | drop places: the bakery shelves and the table; scratch-off: flour on the counter; a place of its own for the end |
| numbers_6_10 | the dam ending (good) | fingers: 1 task | connect the dots 1-10: the dam or a fish; illustration: water through the hole |
| adding_5 | Bunny counts only the newcomer (good); flat ending (dominoes in the orchard) | cups on a tray: 1 sort | illustration: the guests arriving; a new last place; drop places: the tray and the table |
| adding_10 | the tournament finale (good); Bear's fishing is a side thread | shoes: 1 count | connect the dots 1-10: the hopscotch; walk on the map to the tournament; the fishing tied to the thread or cut |

### Breathers (non-maths mini-games)

Today "catch what pops up" is the breather in 8 lessons (duckling, butterflies, acorns, sunflowers, leaves, fireflies,
mushrooms, ribbons) and in about 10 lessons the breather is maths (claps, hops, a bell, stones). New ones, built from
the engine's parts unless marked (a new one needs the user's yes, per guidelines "A lesson asks for the tools it needs"):
- scratch-off for fun (2.3) - what is under the snow?
- connect the dots with pictures (2.4) - a surprise picture
- rock-paper-scissors to decide who starts (guidelines describe it, never built)
- feed a pet: drag food, it reacts (likes / pulls a face)
- push the swing: swipe in time, it swings higher
- skip a stone on the water: a flick, it hops and splashes
- fly a kite: drag against the wind, it climbs
- blow bubbles / stroke a cat until it purrs (a rub gesture)
- who said that? a voice and three characters
- copy the face: a character shows an emotion bubble, pick the same face
- statues (exists, rhythm) and the snail race cheer (exists, long_short)
Assignment rule: every lesson one breather, never the same in two neighbouring lessons, not maths. The assignment is a
table approved by the user before phase 5.

### Panoramas

Panorama plates today: `jesienny_sad` (grouping pans it; up_down uses it without panning), `polana_wieczorem`
(more_fewer), `droga_do_debu` (made, used by no lesson). Candidates where a journey happens in one place:
- numbers_1_5 - the train ride through the forest (the pan IS the ride);
- up_down - pan the autumn orchard it already uses;
- spot_difference - the walk to Granny's oak (`droga_do_debu` exists);
- queue - the race track, the pan follows the runners;
- long_short - from the brook over the plank to the meadow;
- adding_10 - from the brook to the tournament square.
`make_panorama.py all <name>` per new one; the user approves the list.

## Phase 6 - the whole game

All 24 lessons through the autopilot end to end, the lint table for the game (compare with the audit numbers), covers
redrawn where stories changed, the manager's lesson page complete (recordings pl/en), docs/MEMORY.md state per lesson, the
open list cleaned.

## Order and approvals

| step | needs the user |
|---|---|
| 0 docs/game_mechanics.md, rules, flags, lint | no |
| 1 praise / wrong variants | no (approved) |
| 2 mechanics, one by one | a look at each demo; the placement list per mechanic |
| 2b breathers | which ideas to build; a look at each demo |
| 3 home architecture | no (approved); rooms with drop places reviewed by eye |
| breathers and panoramas | the assignment tables |
| 4-5 lesson pass | no within the approved tables; a new mechanic or a change of direction - ask |
| 6 whole game | the final playthrough |
