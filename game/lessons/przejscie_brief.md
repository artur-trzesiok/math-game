# The lesson pass - brief for one lesson (phase 5 of PLAN_usprawnienia.md)

You rework ONE lesson of the maths game in `D:\Project\ai\math_game` the way the pilot `one_many` was reworked
(commit 80350576 - read its diff: `git show 80350576 -- game/lessons/one_many`). Work alone on your lesson; other
agents work on other lessons at the same time.

## Read first
`CLAUDE.md`, `MEMORY.md`, `guidelines.md` (above all "The home stage is the third act" and "Atmosphere and editing"),
`game_mechanics.md` (every tool you may use), `PLAN_usprawnienia.md` (your lesson's row in "Lesson notes"), the
approved tables `game/lessons/rozmieszczenie_plan.md` (illustrations, places, scratch-offs, dots, strips, torn
pictures, walks, panoramas for your lesson) and `game/lessons/oddechy_plan.md` (your lesson's breather). Then your
lesson: `scenario.md`, `lesson.js`, `lesson.json`, `i18n/pl.json`, `i18n/en.json`, and `python tools/lessons/montaz.py
<lesson>`.

## Do, in this order
1. **scenario.md first**: keep what works; fix the audit notes of your row; the home stage as a third act (arrival
   with the story's thread, a home problem with the lesson's misconception again, 4-5 interactions in DIFFERENT forms -
   in a painted room with `c.miejsca()` where it fits - the payoff SEEN, often an event illustration, the parents'
   task shown in play); the breather from oddechy_plan.md (non-maths; replace "catch what pops up"); the approved new
   tools where the table puts them - each for a story reason; a story that ends in a shared place gets a place of its
   own if your row says so. Add an "Iterations" note at the end (v-next, 2026-10-29, what changed and why).
2. **Lines** (`i18n/pl.json` + `en.json`, both): every line ending in a separate "Wskaż." / one-word sentence becomes
   ONE sentence ("Wskaż, kto jest najwyższy."; the English follows: "Point to the tallest."); every bare "Brawo!"
   after a task becomes a line that NAMES the answer ("Tak, trzy gruszki!") - only where nothing can be named use
   `c.brawo(who)`; new lines for the new scenes. Never rename a recorded key (change its text - it is re-recorded by
   hash), add new keys, delete keys no longer said. No line assumes the child's or a character's gender in a way that
   breaks for another speaker; no counting past what is taught before this lesson, no digits before the number
   lessons (menu order in game/lessons/index.json). Polish lines are natural spoken Polish for a 3-4 year old.
3. **Pictures** with the pipelines (add YOUR entries with small Edit insertions at the dict's top - other agents edit
   the same files; never rewrite or reorder those files; run the pipeline only with your names):
   `tools/ilustracje/make_ilustracja.py <name>` (event illustrations: cast and scenery as refs), `tools/zdrapki/
   make_zdrapka.py <name>`, `tools/kropki/make_kropki.py <name>`, `tools/historyjki/make_historyjka.py <name>`,
   `tools/znaleziska/make_znalezisko.py <name>` (found pictures; paths as `droga` for a walk on the map),
   `tools/backgrounds/make_background.py all <scene>` (a scenery or a variant `"z"`; add it to MOTYW in
   `game/engine/muzyka.js` - the ONE engine file you may touch, one key), `tools/backgrounds/make_panorama.py all
   <name>`, `tools/objects/make_objects.py all <sheet>` (a new sheet for missing stickers). Look at every picture
   (Read the PNG) and its review image; redraw what is wrong. Names: lowercase Polish without diacritics.
4. **lesson.js**: the new scenes, the home act, the breather (`c.kpn`, `c.lustro`, `c.karmienie`, `c.latawiec`,
   `c.ktoPowiedzial`, `c.malowanie`, `c.zdrapka`, `c.kropki` ...), the editing pass below. lesson.json: `backgrounds`
   (every scenery used), `objects` (every sticker shown), `"oddech": "<name>"`. Mark right answers for the autopilot
   with `dobre(...)` as the lesson already does.
5. **Editing pass, shot by shot** (guidelines "A static camera is a bug"): every shot has a reason. NEVER a wide shot
   cut away at once (`ogolny` followed by another `ujecie` with nothing said, done or moved between); a dialogue of two
   is a `dwuujecie`; a close-up only for an emotion / reaction / surprise / thank-you; an instruction is said in the
   shot that shows the task (usually wide); a plain-colour insert `c.go({kolor, motyw}, {ciecie: true})` wherever a
   method is shown or one thing is talked about alone (objects are cleared by `go`: re-create them after); practice
   and home are edited too. Goal for `montaz.py`: 0 wide-then-cut in every stage, ping-pongs only where the close-up
   is a reaction, at least one insert in the story.
6. **Audio**: `python tools/audio/run.py <lesson>` once the lines are final (never another lesson).
7. **Check like a child**: open YOUR OWN browser tab (`tabs_create`, never close or navigate the user's tabs, never
   start a server - it runs on 8750). Always `?cicho`. Run `http://localhost:8750/manager/opowiesc.html?lekcja=<lesson>
   &nagraj` until "Gotowe", read its flags (`.uwaga`), fix them; run each stage with
   `/game/index.html?lekcja=<lesson>&etap=story|practice|apply&cicho&szybko` and `await (await
   import('/manager/autopilot.js')).run(30, '<lesson>_<stage>')` (snapshots land in work/snap); LOOK at the snapshots
   of every new scene against guidelines "Watch it as the child". JS calls time out at 45 s - poll in short calls.
8. `python tools/lessons/montaz.py <lesson>` - paste the before / after table into your report.

## Do NOT
- commit (the lead reviews and commits); push;
- edit engine files (`game/engine/*`, except one MOTYW key in muzyka.js), `manager/*`, `tools/*` code (only YOUR
  dict entries), CLAUDE.md, guidelines.md, game_mechanics.md, PLAN_usprawnienia.md, MEMORY.md, other lessons;
- build a new mechanic - if the lesson needs one, describe it in the report instead;
- leave a picture you have not looked at.

## Report (your final message)
What changed in the story, practice and home (short), the new assets (by kind and name), the before / after
`montaz.py` table, the preview's remaining flags (and why they stay), anything you could not do, any engine problem you
hit (file, what happens, how to reproduce).
