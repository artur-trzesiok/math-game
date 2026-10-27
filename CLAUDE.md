# math_game - how to work here

Read `guidelines.md` first: it is the concept (pedagogy, three stages, safe area,
the lesson contract). This file is the mechanics: layout, pipelines, tests, rules
that cost time to learn. Chat with the user is in Polish; code, commits and repo
docs are in English. Engine internals (`lalka.js`, `tlo.js`, `make_character.py`)
keep their Polish identifiers - they were moved here working, not rewritten.

## Layout

```
game/                       the runtime a tablet loads (static, three.js via importmap)
  index.html                master player: lesson list, language, HUD, cards
  engine/player.js          runs a lesson: stages -> scenes, builds the scene context
  engine/scene.js           Stage: camera + SAFE AREA, background, puppets, stickers, signs,
                            zones, click targets, tweens, snapshots
  engine/lalka.js           cut-out puppet engine (postac.json -> animated Object3D)
  engine/tlo.js             background engine (plate + swaying/drifting props)
  engine/speech.js          mp3 or browser speech, mouth amplitude, subtitles
  engine/i18n.js            language pick, string tables
  i18n/<lang>.json          the player's own strings
  lessons/index.json        the lesson list (order, titles)
  lessons/<id>/             lesson.json, lesson.js, i18n/<lang>.json, scenario.md
  assets/characters/<kto>/  postac.json + czesci/*.webp (+ postac.build.json, poprawki.json)
  assets/backgrounds/<sc>/  plyta.webp, rekwizyt_NN.webp, rekwizyty.json
  assets/objects/*.webp     256 px stickers
  audio/<lang>/<lesson>/    <key>.mp3 + manifest.json (made by tools/audio)
manager/                    the manager app (today: the character editor) + dev server
tools/                      pipelines; never shipped. Each has work/ (gpt-image outputs,
                            git-ignored: the cache that lets us rebuild without paying again)
  common/figgen.py          gpt-image client (key from the repo's .env, never printed)
  characters/make_character.py   gen | build | install | all <kto>   (+ rigs/, debug_face.py)
  backgrounds/make_background.py gen | split | install | all <scene>
  objects/make_objects.py        gen | split
  audio/make_audio.py            [lesson]   ElevenLabs -> game/audio
  lessons/make_cover.py          [lesson]   square menu cover from the lesson's `cover` prompt + refs
work/                       local scratch: snapshots (work/snap), debug renders - git-ignored
```

## Run and test

`python manager/server.py` (launch config `math_game`, port 8750) serves the repo:
`/game/` and `/manager/`. It also takes `POST /api/snap?name=x` (a PNG from the
page -> `work/snap/x.png`) and the editor's save API.

The desktop app's browser pane may be hidden while the page says it is visible:
then rAF runs at 0 fps and screenshots are stale. Test the game from the console
instead of the pane: `gra` (the Player) exposes `gra.snap("name")` (renders a
frame and POSTs it), `gra.cele` (names of the current click targets),
`gra.klikCel(i)` (clicks target i), `gra.klik(nx, ny)` (normalised device
coords), `gra.dziennik` (spoken lines with timestamps). URL switches:
`?lekcja=<id>&etap=story|practice|apply&lang=pl|en`, `?szybko` (every line 0.4 s,
cards auto-close, walks 0.2 s), `?napisy` (subtitles for every line), `?safe`
(draws the safe rectangle), `?debug=1` (the phase icons are clickable and jump to
that stage). A whole stage can be driven with `?szybko` plus
`klikCel` in a loop and inspected with snapshots. Look at the PNGs; judge by eye.

The editor (`/manager/editor.html?kto=lisek`) accepts `&anim=Radosc&faza=0.6&snap=name`
for review snapshots of all four puppets at a frozen phase.

## Lessons

One folder per lesson, see `guidelines.md` for the contract and
`game/lessons/bigger_smaller/` as the reference. Order of work for a new lesson:
`scenario.md` first (the script, three stages), then `i18n/pl.json` + `en.json`
(every spoken line as `"line.<stage>_<n>": {who, text}` - `who` is always a character
of the lesson, never a narrator, and it is THE speaker: the recording carries that
voice, so the puppet that moves its mouth is chosen from the line, never by the
scene code (to alternate speakers, write two lines); the key is the mp3 name, so never rename a
recorded line, add a new key), then `lesson.js`, then a line in
`lessons/index.json`, then `python tools/lessons/make_cover.py <id>` (the `cover`
field of lesson.json says what the square menu picture shows; style and cast come
from the character and background references), then a run with `?szybko` and snapshots of every scene, then
`python tools/audio/make_audio.py <id>` once the lines are final.

Scenes are plain async functions; keep each one a screen's worth. Every stage
(story, practice, at home) has about five interactions - a story that only talks
is a bug. Positions are
safe-area units (x -6..6, y -4.5..4.5, ground -3.3); puppets (3.6 units tall, 40% of the safe height) stand at x = +-4.6,
the object layer (stickers, signs) floats at y = 1.2, above the puppets' heads, so
nothing ever covers a character; zones lie on the ground between them (y -2.3). The two characters of a lesson stand
left/right as `characters[name].side` says; the player preloads them and hides
them until `enter`/`show`. Never block on anything but `ctx` calls.

## Characters (the cut-out pipeline)

The rule that drives everything: **no piece of a character is ever cut, trimmed,
capped, filled or masked by code.** gpt-image draws every piece in place,
complete, with its joint overlap; code only turns the magenta key into
transparency, measures (bounding boxes, pivots, face targets), tests and writes
`postac.json`. A wrong piece is fixed by a prompt change and regeneration of that
file, never a pixel operation. Two rig classes: `humanoid` and `czworonog`
(`tools/characters/rigs/`), one file format, the same standard animation set.

```
python tools/characters/make_character.py all lisek   # gen (~25 images) -> build -> install
```

1. **References** (text-to-image, then three edits, all 1024x1536, transparent,
   the same frame): `postac.png` front, `profil.png` side facing right, `bok.png`
   three-quarter right, `tyl.png` from behind. The back prompt spells out the
   feet (heels to the viewer, toes away, no toes/talons visible) - without it the
   model draws a back view standing on front-view feet.
2. **Keyed pieces** - one EDIT per piece: show ONLY piece X as a cut-out puppet
   piece, the rest of the character one flat magenta silhouette BEHIND it; X stays
   where it is, COMPLETE as the topmost layer, occluders left out, no magenta on
   X, plus the joint closure (limb extension with a rounded cap; neck stub for
   heads; torsos closed where head/limbs/tail were). Pairs go in ONE image (the
   model confuses left and right). Heads are keyed with eyes, brows, NOSE and
   mouth removed (mouth variants carry the nose). Because every piece stays in
   the reference's frame, its position is free: no scaling, no placement.
3. **Face sheets** - 3x3 per view (front, 3/4, profile; the profile sheet asks
   for ONE eye): eyes open/half/closed/wide, mouth closed/smile/half/O/sad.
4. **Build** = measurement + tests, writes `work/<kto>/czesci/*.png` + `postac.json`.
5. **Install** converts to WebP (q75, exact alpha), rewrites `animacje`, `kosci`,
   `glowy`, `lokomocja` from the rig (a rig edit needs only `install`), re-applies
   `poprawki.json` (editor corrections) and leaves `postac.build.json` next to the
   character as the baseline the editor diffs against.
6. **Review** in the manager's editor; the old acceptance sheet is gone.

`all` regenerates whatever build rejected, up to twice. `gen` is resumable; to
redo one piece delete its `k_*.png` in `tools/characters/work/<kto>/` and rerun.
The output moderation filter sometimes blocks innocent animals (deer: "fawn",
"doe", "spots" were ~100% blocked; "roe deer ... short fluffy tail" passes); it is
stochastic - retry, do not rewrite.

Build rules (measurement only): piece alpha = not magenta AND own alpha, key-tinted
edge pixels recoloured from the nearest clean pixel at their own luminance; pairs
= two largest blobs by x; limb/tail/head pivot = centroid of the piece inside the
8 px band along the torso contour (widened to 24/64 px when nothing overlaps);
face targets = where the view reference differs from the blank head, measured on
the SAVED piece, within the head plus a 40 px margin, where outside the head only
pixels unlike the head's palette count (a beak yes, the tail no); eyes = blobs
unlike the fur (white + dark) OR a side-by-side pair of similar size (a brown
iris on brown fur), top one of the two largest plus one beside it, flat blobs
above fold in (brows); mouth = the rest below the eyes' centre; sheet cores = cell
pixels unlike the blank head's palette under that target; a blank head whose
largest diff blob is taller than 0.4 of the head is rejected (it drifted).
`python tools/characters/debug_face.py <kto> <widok>` draws it all.

Tests that reject a piece: taller than 0.6 of the figure (0.9 for tails); a pair
with fewer than two blobs; a hole > 400 px; a BITE = morphological closing (r 40)
of the piece lying >= 80% under a piece the rig puts in front (> 300 px) - a
front piece masked by the torso (`za_tulowiem`) counts only outside the torso;
a far leg 1.35x wider than its near twin.

`postac.json`: `rig`, `wysokosc`, `kadr`/`kadr_profil`/`kadr_tyl`, `czesci`
(`plik, x, y, w, h, os, obrot?, widok, rdzen?`), `twarz` (`przod/bok/profil` ->
`oczy/usta` boxes, `obrot?`), `usta_nad_oczami`, `animacje`. Sign convention: a
left/right pair shares one value (the engine mirrors the right side), positive =
outward; profile (facing right) positive = backward; "arm up" ~ 110 deg; `obrot`
(degrees, clockwise) is a base rotation never mirrored. Standard set: Spoczynek,
Chod, Skradanie, Mowienie, Podskok, Radosc, Zgloszenie, Wskazanie, Machanie,
Kiwanie (a sway of the whole puppet on its feet via the root track), Smutek,
Brawo, Rozgladanie, Obrot. `kierunek: "profil"` on an animation always selects
the side puppet. A quadruped's front legs rotate at the shoulder, so front
tracks stay under ~8 deg and hoof gestures carry `kierunek: profil`.

Three puppets per character: `przod` (front; the 3/4 head `glowa_bok` swaps in
for "patrz prawo/lewo", in its own sub-group with its own pivot), `tyl` (`t_*`
bones, a full back puppet; front tracks drive the `t_` twins), `profil` (`p_*`,
locomotion). Z-order: head above torso (0.04), torso 0, legs/tail behind; FRONT
ARMS (a quadruped's front legs) must be behind the torso yet in front of the
head, so they sit at 0.10 with `za_tulowiem`: the torso writes a stencil ref and
the arm draws only where the stencil differs. **Every renderer that shows a
puppet must be created with `stencil: true`** (three r163+ defaults to false).
On the stage a puppet's materials have depth test and depth write OFF: pieces
sort by z inside the puppet, and each puppet sits on its own `renderOrder`
layer (20, the one walking or entering 30), so two overlapping puppets never
interleave their pieces.
Back view: limbs plainly behind. Profile: the near limb over the body, jumping
to `z_uniesiona` past 45 deg.

Dead ends (do not retry): loose-part sheets for body pieces; any Python cut
(difference masks, caps, erosion, hole filling); "head with face" as a keyed
edit; a blank head keeping the nose; a profile sheet with a pair of eyes;
"draw X complete underneath" + "everything else magenta" (the occluder wins).

## Backgrounds and objects

`make_background.py all <scene>`: plate + movers in two gpt-image passes
(picture-book prompt in `SCENY`; ask for "at least fifteen tufts" and "six or
seven clouds" - "a few" is too sparse), difference -> PNG props, install ->
WebP (plate q80 opaque, props q80 exact alpha). The engine puts the plate on one
quad (cover) and each prop on a subdivided quad that sways (grass) or drifts
(clouds). `make_objects.py gen|split`: all objects from one sheet, row-major
order = `NAZWY`; split by alpha into 256 px WebP stickers.

## Audio

`python tools/audio/run.py [lesson]` reads every `"line.*"` of every language,
synthesises what is missing or changed (manifest by text hash) and writes
`game/audio/<lang>/<lesson>/<key>.mp3` plus `<key>.json`, the BAKED lip-sync
envelope (RMS every 20 ms, normalised; `--bake` recomputes them all) that the game
reads by playback time - no WebAudio on the tablet. A break of `ELEVENLABS_PAUSE` (0.6 s) is inserted after every sentence at synthesis
time, so the i18n text stays clean. Every recording is normalised
to -20 dBFS RMS of its voiced frames (`--normalize` redoes all), and each character's
`meta.json` (`game/assets/characters/<who>/`) holds its ElevenLabs voice per language
and a `volume` trim the game multiplies in. Keys live in the repository's `.env`
(`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL_ID`,
`ELEVENLABS_OUTPUT_FORMAT`; git-ignored, never printed). Voices per speaker per language in `VOICES`. Without an mp3 the game
uses the browser's voice and shows a subtitle - fine for testing, not for a child.

## The manager

`/manager/` is the shell for internal tools; today it holds the character editor
(`editor.html`): all four puppets at once, any animation, a phase slider, lip-sync
and blinking, click-to-select with alpha test, drag (pivot travels; a head carries
its face targets), Shift-drag pivot, Alt-drag rotation (Q/E), arrows, numeric
fields, "zablokuj" to keep the selection under the cursor, Ctrl+Z, Ctrl+S. Saving
writes `postac.json` and `poprawki.json` (the diff from `postac.build.json`);
`install` re-applies that file after every rebuild. A correction that repeats
across characters is a pipeline bug: fix the measurement, delete the file.

## Git

Local repository only; commit when a step is done, never push. Assets in
`game/assets` are committed (WebP keeps a character under 2 MB); `tools/*/work`
and `work/` are not.
