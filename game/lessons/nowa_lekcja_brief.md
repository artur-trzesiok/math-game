# Building a new lesson - brief for one lesson

You build ONE new lesson of the maths game in `D:\Project\ai\math_game` from its approved plan. Other agents work on
other lessons at the same time; work alone on yours.

## Read first
`CLAUDE.md`, `docs/MEMORY.md`, `docs/guidelines.md` (all of it: the lesson contract, "The home stage is the third
act", "Watch it as the child", "Atmosphere and editing"), `docs/game_mechanics.md` (every tool you may use; try a
mechanic you have not seen on `manager/mechaniki.html?m=<name>`), `docs/program.md` (where your lesson stands - what
the child knows by then: the lessons before it in `game/lessons/index.json`), and YOUR lesson's section in
`game/lessons/etap6_plan.md` ("New lessons, 2026-10-30") - the approved plan. Then a finished lesson of the same
stage of the work as a model: `game/lessons/one_many/` (the pilot of the lesson pass) and `game/lessons/rhythm/`
(scenario.md, lesson.js, lesson.json, i18n) - copy their structure, helpers (`dobre`, shots, inserts) and style.

## Do, in this order
1. **scenario.md** from the plan: the three stages, every scene with its shot, line and interaction; keep the plan's
   idea, misconception, thread, cast, breather and home act. Improve details where the plan is thin; do not change
   its direction. End with an "Iterations" note (v1, 2026-10-30).
2. **Lines** `i18n/pl.json` + `i18n/en.json` (`"line.<stage>_<n>": {who, text}`, `who` always a character of the
   lesson; `speakers` where a scene may give a line to another; `line.n1..n5` for counting if you count). Natural
   spoken Polish for a 4-year-old; one sentence per instruction ("Wskaż, kto jest cięższy."); after a task a line that
   NAMES the answer, not a bare "Brawo!"; no gender assumptions; no digits past 5, no counting past 5, no sums.
   The lesson sticker lines `naklejka_daj`, `naklejka_juz`, `naklejka_opis` (see a finished lesson).
3. **Pictures** with the pipelines - add YOUR entries with small Edit insertions at the top of the dicts (other agents
   edit the same files; never rewrite or reorder them; run each pipeline only with your names):
   `tools/objects/make_objects.py` (a new sheet for your stickers - look how sheets are declared),
   `tools/ilustracje/make_ilustracja.py <name>` (event illustrations; a comic layout only where 3-4 beats happen at
   once), `tools/znaleziska/make_znalezisko.py <name>` (found pictures, also what `podarty` tears),
   `tools/zdrapki/make_zdrapka.py`, `tools/kropki/make_kropki.py`, `tools/historyjki/make_historyjka.py`,
   `tools/backgrounds/make_background.py all <scene>` only if no existing scenery fits (then one MOTYW key in
   `game/engine/muzyka.js`). Look at every picture (Read the PNG) and redraw what is wrong. Names: lowercase Polish
   without diacritics. Everything the child sees is painted by gpt-image.
4. **lesson.js** and **lesson.json** (`characters`, `backgrounds` = every scenery used, `objects` = every sticker
   shown, `oddech`, `cover` prompt, `naklejka: {obraz, kto}`, `goal`, `age`). Mark right answers for the autopilot
   with `dobre(...)`. Then `python tools/lessons/make_cover.py <lesson>` and look at the cover.
5. **Editing pass, shot by shot** (guidelines "A static camera is a bug"): every shot has a reason; never a wide shot
   cut away at once; a dialogue of two is a `dwuujecie`; a close-up only for an emotion / reaction / surprise; the
   instruction said in the shot that shows the task; at least one plain-colour insert (`c.go({kolor, motyw}, {ciecie:
   true})`) where the idea is shown alone. Goal for `python tools/lessons/montaz.py <lesson>`: 0 wide-then-cut.
6. **Audio**: `python tools/audio/run.py <lesson>` once the lines are final (never another lesson).
7. **Check like a child**: open YOUR OWN browser tab (`tabs_create`; never close or navigate other tabs; never start or
   stop a server - the user's runs on 8750). Always `?cicho`. Run `http://localhost:8750/manager/opowiesc.html?lekcja=
   <lesson>&nagraj` until "Gotowe", fix its flags (`.uwaga`); run each stage with `/game/index.html?lekcja=<lesson>
   &etap=story|practice|apply&cicho&szybko` and `await (await import('/manager/autopilot.js')).run(30,
   '<lesson>_<stage>')` (snapshots in work/snap); LOOK at the snapshots of every scene against "Watch it as the
   child". JS calls time out at 45 s - poll in short calls.

## Engine rules in force (built - use them, do not fight them)
- After a right answer the scene holds ~1.2 s with every visible puppet cheering - add no waits for that.
- Nothing just vanishes: removed objects slide out of the frame by themselves; never hide things with visible=false.
- An illustration or comic waits for a tap on the painted "next" arrow; its speaker badge aims at the head itself.
- `put` of a thing outside the frame goes wide first by itself; `sort` lifts items above the containers (set zones
  first, give them a moment to grow in); shots zoom softly, two-shots walk the characters in and out; no parallax.
- The ten frame and the domino are painted (not needed here).

## Do NOT
- commit or push (the lead reviews and commits);
- edit engine files (`game/engine/*`, except one MOTYW key in muzyka.js), `manager/*`, `tools/*` code (only YOUR dict
  entries), CLAUDE.md, docs/*, PLAN_usprawnienia.md, `game/lessons/index.json`, other lessons;
- build a new mechanic - if the plan cannot be done with the existing tools, describe what is missing in the report;
- leave a picture you have not looked at.

## Report (your final message)
The lesson in short (story, practice, home: scene by scene, one line each), the new assets by kind and name, the
`montaz.py` table, the preview's remaining flags (and why they stay), what differs from the plan and why, anything you
could not do, any engine problem you hit (file, what happens, how to reproduce).
