# Brief: building a new mechanic (point 5 of the worlds plan)

The user approved building all nine mechanics of `docs/mechaniki_na_zapas.md` now, ahead of the lessons of worlds 2-4
(`docs/program.md`). Read first: `CLAUDE.md`, `docs/guidelines.md`, `docs/game_mechanics.md`, `docs/mechaniki_na_zapas.md`,
`docs/program.md` (find every lesson that will use your mechanic and make sure the API covers them all), and as models
`game/engine/mechaniki4.js` (kropki, historyjka, wedrowka) and `game/engine/oddechy.js`.

## What a mechanic is here
- A function `export async function <nazwa>(S, ..., opts)` in YOUR engine file (given in your task). `S` is the Stage
  (`game/engine/scene.js`): `S.scene`, `S.objects`, `S.tween`, `S.sfx.graj(...)`, `S.line`, `S.bump`, `S.palec` (a
  finger handler `{down, move, up}` with world coordinates), `texture(url)`.
- The child acts with a finger (tap or drag); a wrong move has a VISIBLE consequence and calls `onZle` (the lesson
  plays a wrong line through it); the mechanic itself never speaks - lines come from the lesson (callbacks such as
  `onDobrze`, `onRegula`, ...).
- Everything the child looks at is painted (gpt-image through the tools pipelines, e.g. a sticker sheet in
  `tools/objects/make_objects.py`, viewed before use); code draws only lines, highlights and invisible targets.
- Every object it adds is registered so `S.clear()` / a skipped scene removes it (see `karta()` / `cel()` in mechaniki4).
- A test driver: while waiting it sets `S.<nazwa> = { dokoncz: async () => ... }` (does the right moves itself) and clears
  it at the end; returns `{kind, ..., remove}`. Works with `?szybko` (FAST: short tweens).
- Ages 3-6: big targets (at least 0.5 world units), forgiving drops, no reading needed.

## Registration (shared files - other agents edit them at the same time)
Edit shared files ONLY with small anchored insertions (the Edit tool, re-read just before each edit; if an edit fails
because the file changed, re-read and retry). Never rewrite or reformat a shared file, never touch another agent's
mechanic.
- `game/engine/player.js`: import your engine file (next to the M4 import), a ctx entry per mechanic next to `kropki:`
  (`<nazwa>: (...) => wDzialaniu(MX.<nazwa>(S, ...), "dotknij" | "przeciagnij")`, `onZle: () => blad(o.wrong)`), and
  the name in the INTERAKCJE set (line ~84).
- `manager/autopilot.js`: add the name to the list of `S.<k>.dokoncz()` drivers (line ~21).
- `manager/mechaniki.html`: a demo entry per mechanic (like `kropki` / `latawiec` there) that runs it with sample data.
- `tools/lessons/montaz.py`: the name in INTERACT.
- `docs/game_mechanics.md`: an entry per mechanic (what the child does, the API, options, the painted parts, which
  lessons of docs/program.md use it), in the style of the existing entries.
- `docs/mechaniki_na_zapas.md`: mark it built.

## Checking
Run each demo in the preview at http://localhost:8750/manager/mechaniki.html (always `?cicho` - no sound on the
user's speakers), by hand and with the driver; the hidden browser pane has no requestAnimationFrame, so take pictures
with the canvas snapshot (`/api/snap`, as the other tools do) and LOOK at them. Fix what looks wrong. Do not commit.

## Report
Per mechanic: the API, the painted parts made, the demo, what was checked by eye, what was not, and anything in the
engine that got in the way.
