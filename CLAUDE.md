# math_game - how to work here

Read `MEMORY.md` (the session memory) first, then `guidelines.md`: the concept (pedagogy, three stages, safe area,
the lesson contract), then `game_mechanics.md`: every mechanic a lesson can use (and the rule to ask before adding one). This file is the mechanics: layout, pipelines, tests, rules
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
manager/                    the manager: lessons, story preview, sceneries, stickers, character editor + dev server
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
`?lekcja=<id>&etap=story|practice|apply&lang=pl|en`, `?cicho` (nothing is heard: voices and effects play muted - ALWAYS in tests, the user hears the speakers otherwise), `?szybko` (every line 0.4 s,
cards auto-close, walks 0.2 s), `?napisy` (subtitles for every line), `?safe`
(draws the safe rectangle), `?debug=1` (the phase icons are clickable and jump to
that stage). A whole stage can be driven with `?szybko` plus
`klikCel` in a loop and inspected with snapshots. Look at the PNGs; judge by eye.

The editor (`/manager/editor.html?kto=lisek`) accepts `&anim=Radosc&faza=0.6&snap=name`
for review snapshots of all four puppets at a frozen phase.

## Lessons

One folder per lesson, see `guidelines.md` for the contract and
`game/lessons/bigger_smaller_pro/` as the reference. Order of work for a new lesson:
`scenario.md` first (the script, three stages), then `i18n/pl.json` + `en.json`
(every spoken line as `"line.<stage>_<n>": {who, text}` - `who` is always a character
of the lesson, never a narrator, the default speaker; `"speakers": [...]` lists the
other characters a scene may give the line to - the pipeline records one file per
speaker (`<key>.<who>.mp3`) and the game picks the file by the speaker the scene
chose (a missing variant falls back to the default voice with a console warning); the key is the mp3 name, so never rename a
recorded line, add a new key), then `lesson.js`, then a line in
`lessons/index.json`, then `python tools/lessons/make_cover.py <id>` (the `cover`
field of lesson.json says what the square menu picture shows; style and cast come
from the character and background references), then a run with `?szybko` and snapshots of every scene, then
`python tools/audio/make_audio.py <id>` once the lines are final.

**Everything is loaded before a lesson starts** (the loading screen, `Stage.prepare`): its sceneries (the
stages' backgrounds + lesson.json `backgrounds`), its stickers (lesson.json `objects` - list every sticker the
lesson shows), the garments its code names, the characters and the transitions' bands and head badges, all sent
to the GPU. A scenery is built once and kept (going back to it is a swap); textures are one per file and shared.
Loading during a lesson (a sticker missing from `objects`) still works, but stutters on a tablet.

Scenes are plain async functions; keep each one a screen's worth. Every stage
(story, practice, at home) has about five interactions - a story that only talks
is a bug. Positions are
safe-area units (x -6..6, y -4.5..4.5, ground -3.3); puppets (3.6 units tall, 40% of the safe height) stand at x = +-4.6,
the object layer (stickers, signs) floats at y = 1.2, above the puppets' heads, so
nothing ever covers a character; zones lie on the ground between them (y -2.3). The two characters of a lesson stand
left/right as `characters[name].side` says; the player preloads them and hides
them until `enter`/`show`. Never block on anything but `ctx` calls. Nothing is drawn above `SUFIT` (y 3.3): the phase icons sit there.

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

Bendable limbs (`game/engine/siatka.js`). A rig bone may carry `stawy`: a chain of
joints (`nazwa` = the animation track, `okno` [a, b] or a fixed `s`, `miekkosc`,
`zakres` [min, max] in degrees, same sign convention as bones, mirrored with the
bone). Its piece then becomes a grid mesh (12 px cells, trimmed to alpha plus one
cell) instead of a quad. s = geodesic distance inside the mesh from the PROXIMAL
side of the pivot (the overlap hidden behind the torso: above the pivot for limbs,
towards the torso centre for tails - the bone's `dystalnie`), 0 there, 1 at the tip;
it follows curled tails and L-shaped feet. A vertex turns around joint k by
smoothstep(s across a band of width `miekkosc` centred on s_k) x angle, last joint
first; turning (not blending positions) keeps the limb's length, so a bend never
collapses. `tools/characters/stawy.py <kto>|all` measures the joints (narrowest
band in the window, pulled to its middle) into `czesci[n].stawy` [{x, y}] of
postac.build.json and postac.json (install runs it; poprawki.json keeps the editor's
joints and per-joint `miekkosc`); `debug_stawy.py <kto>` draws field + joints into
work/. Measuring s from the pivot POINT tore the mesh where a hidden lobe met the
limb (a sliver of the tail's overlap stuck out); measuring over the alpha mask
instead of the mesh let a thin gap (a deer's hock tuft, owl claws) split s across one
triangle (streaks); float32 distances in the Dijkstra stopped it half way. A foot
drawn level must be kept level by the ankle track (= -(hip + knee)) or it dips
under the floor at the ends of a stride. The editor: pink circles = joints (drag),
per-joint sliders `miękkość` (saved) and `zgięcie` (a test bend, not saved),
switches `zginanie` (A/B against the rigid cut-out) and `siatka` (wireframe);
`edytor.przeglad(kto, anim, faza, nazwa, {zgin, druty})` snapshots from the console.

Feet (`lalka.js`, legs = chains of a `noga*` bone with a knee and an ankle). An
animation's `stopy` decides: `"ik"` - feet planted: the animation moves only the hips
(root rotation `biodra`, sideways shift `biodra_x` and height `skok`, both in puppet
heights) and every leg of the visible view is solved as a 2-bone IK so its ankle
returns to where it stood at rest; the knee track only picks the side the knee folds
to (inside `zakres` first), the ankle keeps the foot level (Kiwanie). `"ziemia"` -
the view moves up or down until the leg reaching deepest below ITS OWN rest floor
stands on it (Chod, Skradanie): a far leg is drawn higher (perspective) or reaching
lower, so one shared floor lifts or sinks the others; the walk's bob then comes from
the legs and replaces `skok`. Rigid stance legs still lift the other feet a little.

The walk (`krok` on Chod / Skradanie: `dlugosc`, `uniesienie`, `przysiad` in leg
lengths, `podpora` = stance fraction, `fazy` per leg, `pary` = legs sharing a stride
centre) is procedural: in stance an ankle slides back in a straight line as fast as
the body moves, in swing it arcs forward; the hips drop just enough for every leg to
reach, the IK bends knees (the side from `zakres`) and keeps feet level. The leg
tracks of those animations are gone. The stage walks a puppet by distance
(`walkLine`): the stride's phase follows the ground covered, so a planted foot never
slides, easing included; speed = stride / stance time, so a short-legged owl
toddles. Legs and tails turn at a HIP joint inside the mesh (band 0.1 / 0.2 from
s = 0): the bone keeps its base rotation, so the overlap hidden behind the torso
stays there - turning the whole piece swung it out past the body's outline.

The torso bends too (`tulow_1/2`, `p_tulow_1/2`, `t_tulow_1/2`; `dystalnie` "gora":
s runs up from the hips); the head and arms hang on it, so after the bend they are
moved and turned with it at their attachment (`_niesDzieci`). Order in a frame:
bones, head view, hips, non-leg chains + carried children, then the legs solve. A
quadruped's profile body stays rigid (its legs hang on it). Frames (`kadr*`) must
span what the view's pieces actually draw (head top to feet), or that view comes out
taller or shorter than the others: a correction that moves legs down needs the frame
moved too (lisek profile, sarenka back fixed in poprawki.json).

Gaze: `lalka.patrzNa(fn | null, seconds)`, `stage.lookAt(who, thing)`, `ctx.look`.
The head turns to 3/4 towards the thing, nods towards its height and the torso leans;
an animation's own direction wins. During a task the characters look from option to
option (every option, so the gaze gives nothing away), after the right pick at it;
a new sticker gets a glance, a sort watches the containers, `clear` resets. A nod
(`glowa_x`) slides the face on the head - turning the head about x sorted the face
behind it on the stage (no depth test) and the mouth vanished.

Lesson mechanics (pencil, camera and annotations, carrying, numbers, geometry, film tools, rhythm, the mechanics modules, painted pictures) are listed in `game_mechanics.md`, with these engine notes in its appendix. A mechanic not on that list: ask the user before building it.
Sound effects (`sfx.js`, `game/audio/sfx/*.mp3`): `python tools/audio/run.py --sfx` makes
them - ElevenLabs sound generation when the key has the `sound_generation` permission
(ours has it since 2026-10-28; at least 0.5 s each), else a numpy synthesis recipe per effect (repeatable, no service);
trimmed of leading silence, normalised to -27 dB (voices -20). The stage plays them
itself: pop on appear, tap on a tap, wrong on a shake, plop into a zone, pencil while
a line draws, whoosh for a long flight, hop / clap with Podskok / Brawo (`Lalka.naGraj`),
right on a correct pick or a finished sort; `ctx.sfx(name)` for a scene's own. Plain
`<audio>` pools, a 60 ms gap per effect, ducking under speech, `?cicho` mutes.

Music: `game/audio/muzyka/` (SOURCES.md says where each tune comes from), all ElevenLabs (`python tools/audio/run.py --music`, make_music.py - through run.py: a stale ELEVENLABS_API_KEY sits in the user's environment and the repo's .env must win). Every scenery belongs to a theme (`muzyka.js` MOTYW: laka, las, woda, dom, noc, teatr; inserts on a plain colour: cwiczenia), each theme has two ~150 s versions played in turn (a 30-45 s loop got tiring over long use); a change of place crossfades, the same theme plays on. The weather particles have a quiet loop each (`game/audio/pogoda/<rodzaj>.mp3`, ~20 s) next to the music. Both duck under speech and fall silent while a scene listens (`dzwieki`, `rytm`, `taniec`, a scene's own `ctx.muzyka`); `?cicho` mutes them. The menu: menu_1 / menu_2 in turn.
Every lesson also gets, without its code doing anything: a start card (cover + name) and a card before every
stage (icon + name), the characters' head badges peeking in (`plansza`, 2 s, a tap skips); encouragement when the
child waits 9 s without a touch (game/zachety: invitations, never praise, in the instructing character's voice;
the second time in a pointing task "hmm... maybe here?" with the answer pulsing); at the end of the home stage
the lesson's sticker (lesson.json `naklejka: {obraz, kto}`, lines `naklejka_daj`, `naklejka_juz`,
`naklejka_opis`) for the album (`album.js`, localStorage; game/album holds the narrator's welcome). The menu is
painted (tools/menu); a card shows its sticker waiting, and a peeled-off patch once it is in the album.
Overlay effects draw in the stage's orthographic overlay scene (`S.nak`, rendered after the world by `rysuj`),
so they cover the letterboxed frame exactly and are in snapshots.
HUD: pause (the picture, tweens and the voice stop), next (the scene's context is retired - every ctx call of the
skipped scene throws "abort", so nothing of it keeps running), fullscreen (also in the menu).

Panoramas: `tools/backgrounds/make_panorama.py all <name>` - tiles of 1536 px, each next one an edit of a canvas
whose left third is the previous tile's right third ("keep it, continue to the right"), stitched with a smooth
ramp in the overlap; the movers pass runs on screen-wide windows; the usual split; `obszary` in rekwizyty.json.
A plate wider than 1.25 design frames is a panorama for the stage (`S.panorama`).

Dressing up (`ubior.js`): garments from `game/assets/ubrania/ubrania.json` (`tools/ubrania/make_ubrania.py`: one
picture per garment with front / side / back views, prompted WITHOUT visible insides - a hat's opening or a
boot's top showed as a dark hole). Fitted from the character's own pieces: a hat between the ears (the dome
width where the ears join; in profile the ear is redrawn over it with a soft mask), glasses on the eyes' box, a
scarf at the neck (capped for small characters), shoes as a grid glued vertex by vertex to the nearest leg
vertex at rest and turned by that vertex's angle - so they bend with knee and ankle (giving them the leg's s tore
them apart at a bent ankle); a little oversize so no paw shows, as high as `do` (s on the leg). Corrections per
character and view in `game/assets/characters/<kto>/ubior.json` (dx, dy in heights, skala, obrot), edited in the
manager's wardrobe panel. `ctx.ubieranie({rzeczy, kto, pasuje, wrong})` - drag garments onto characters; a wrong
size goes on, slips and falls off. Quadrupeds are not dressed, tails never.

Topics open one after another (player.js menu): a topic opens when every lesson of the one before has its sticker in
the album; until then its cards lie in a mist under a painted padlock (tools/menu: klodka, klodka_otwarta), a tap
shakes it, a 3 s press on the padlock opens it for good (localStorage math_game.otwarte - a parent's way through),
`?wszystko` opens all, and typing "admin" on the menu (a keyboard) puts every sticker in the album and opens every stage for good; the first time a topic is seen open it unlocks on screen (math_game.widziane_otwarte).
Menu topics: `lessons/index.json` "topics" ({id, title, color, lessons}), in the order a child should take them
(topics by the age of their easiest lesson, lessons by difficulty). The menu is ONE strip scrolled sideways (a
finger, the mouse wheel, a mouse drag; no visible scrollbar, edges fade where there is more), each topic a tinted
block with its name on a plank, a signpost between two topics (no row of chips: it read as a web menu); numbers restart per topic, a
lesson in no topic goes to a last block. Everything is sized from the height (`--k` = 38vh, 31vh under 520 px) with
pixel floors for text only: pixel caps made it tiny on a big screen. The strip keeps its place after a lesson.

Transitions: `graj` remembers the pose of the last frame (every numeric channel,
before the gaze) and the new animation blends in from it over `Lalka.przejscie`
(0.22 s; an animation may set `wejscie`, 0 = cut). Feet that were planted (`stopy:
"ik"`) stay planted while the hips blend back. The editor's `raz` plays an
animation once and returns to the idle, so the blend shows there.

Background grass (`tlo.js`) uses the same mesh: a tuft is a grid trimmed to its alpha,
s from its bottom edge up each blade (`dystalnie` "gora"), three bend lines at s 0.4 /
0.62 / 0.82; the wind turns every vertex around the bend line under it (a tuft is
wide, one rotation centre would lift its outer blades), the gust reaching each line
0.55 rad later. Clouds still drift as one quad. `?sztywnetlo` = the old shear (A/B).

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
(clouds). The split (`split`, knobs at the top of `make_background.py`): the
difference is taken between the two passes BLURRED (sigma 1.2: paper grain and brush
jitter are no change), strong > 40 plus weak > 24 within 4 px outdoors (14 within 8
indoors); every pixel joins the component of its nearest CORE (the mask opened by
r 2), so a mover touching redrawn plate by a thin bridge splits off while grass blades
keep their tuft. Indoors notches are closed and holes filled (a pot the colour of the
floor); outdoors not - the gaps between blades show the plate anyway, filled they
carried water and stones along. A cloud keeps only its bright unsaturated body plus a
bluish or white rim (leaves of a crown stuck to clouds before); an outdoor tuft drops
light blue / teal pixels (water redrawn between reeds; a teal blade is dark, a purple
flower has red); an indoor mover that is NEW in the second pass (median difference
>= 80) drops, above its foot, pixels within 45 of the plate (the wallpaper between a
plant's leaves) - one the plate already has keeps its leaves. Review every split with
`python tools/backgrounds/debug_split.py <scene>|all` -> `work/split_<scene>.png`
(outlines on the plate, every prop on a checkerboard). A variant of a scene (`"z": "pokoj"`, e.g. `pokoj_noc`) edits that scene's plate; `"ruch": None` makes a still plate, and `poswiaty` ({x, y, r} in plate pixels, `kolor`, `moc`) lay a breathing lamp glow over it. `make_objects.py gen|split`: all objects from one sheet, row-major
order = `NAZWY`; split by alpha into 256 px WebP stickers.

## Audio

`python tools/audio/run.py [lesson]` reads every `"line.*"` of every language,
synthesises what is missing or changed (manifest by text hash) and writes
`game/audio/<lang>/<lesson>/<key>.mp3` plus `<key>.json`, the BAKED lip-sync
envelope (RMS every 20 ms, normalised; `--bake` recomputes them all) that the game
reads by playback time - no WebAudio on the tablet. The json also holds VISEMES (`"wiz": [[t, code]]`,
`tools/audio/visemes.py`): which mouth shape when - a, o, u, e, i, m/b/p closed, s/sz
teeth, f lower lip, other consonants. New recordings get exact ones from ElevenLabs
`with-timestamps` (character times; the plain TTS permission suffices); existing ones
are aligned locally (`run.py --visemes`): phrases at punctuation matched to voiced runs
at the pauses, sounds laid out by weight, vowels snapped to loudness peaks (forced
alignment needs a permission our key lacks). The puppet maps each code to one of the
drawn mouths stretched (o narrow for u, pol wide for e, usmiech flat for s ...) and
opened a little more when loud; without visemes it falls back to loudness. A break of `ELEVENLABS_PAUSE` (0.6 s) is inserted after every sentence at synthesis
time, so the i18n text stays clean. Every recording is normalised
to -20 dBFS RMS of its voiced frames (`--normalize` redoes all), and each character's
`meta.json` (`game/assets/characters/<who>/`) holds its ElevenLabs voice per language
and a `volume` trim the game multiplies in, plus its natural height `wysokosc` (scene units: Fox 3.6, Squirrel
2.7 = three quarters of him, Owl 3.6 with the biggest head) - the game always draws it at that size, whatever a
lesson says. Keys live in the repository's `.env`
(`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL_ID`,
`ELEVENLABS_OUTPUT_FORMAT`; git-ignored, never printed). Voices per speaker per language in `VOICES`. Without an mp3 the game
uses the browser's voice and shows a subtitle - fine for testing, not for a child.

## The manager

`/manager/` is the shell for internal tools (modules in an iframe, `#lekcje` in the address opens one):
- `lekcje.html`: every lesson with its cover, goal, characters, sceneries, stickers, recordings complete per
  language (`pl: 70/70`), missing files, links to play it from any stage and to its story preview;
- `opowiesc.html?lekcja=<id>`: the story preview - the game runs the lesson with `?scenariusz` (the autopilot,
  `manager/autopilot.js`, plays it; `work/_auto.js` re-exports it) and writes down every line with a thumbnail of
  the frame and its recording's length, every shot and task; the page flags what the telling misses (a task with
  no word before it, two tasks in a row, a task nobody comments on, a new place with no word, five lines with
  nothing happening, a missing recording). Run it on every new lesson before calling it done;
- `tla.html`: every scenery, the plate with or without its props, prop boxes, horizon, panorama areas, who uses it;
- `obiekty.html`: every sticker and garment, its size, which lessons use it (or none).
- `znaleziska.html?rodzaj=znaleziska|labirynty|roznice` (three tabs): every found picture, maze and difference pair
  with what the child must find drawn in (spots and paths, the plan's walls, the differences) and the lessons that
  call it; `/api/<rodzaj>.pdf[?cele=1]` makes a sheet of them (JPEG inside - lossless was 40 MB).

The character editor
(`editor.html`): all four puppets at once, any animation, a phase slider, lip-sync
and blinking, click-to-select with alpha test, drag (pivot travels; a head carries
its face targets), Shift-drag pivot, Alt-drag rotation (Q/E), arrows, numeric
fields, "zablokuj" to keep the selection under the cursor, Ctrl+Z, Ctrl+S. Saving
writes `postac.json` and `poprawki.json` (the diff from `postac.build.json`);
`install` re-applies that file after every rebuild. A correction that repeats
across characters is a pipeline bug: fix the measurement, delete the file.

## Memory

`MEMORY.md` is the session memory of this project: the user's standing rules, decisions they made, where the work
stands, pitfalls that cost time and what is left open. Read it at the start of every session (on any machine) and
keep it current: when the user decides something, a lesson or tool changes state, or a mistake costs time, update the
matching section in the same step and commit it with the work. Keep it short - facts and rules, not a diary; what the
code, this file or guidelines.md already say does not go there.

## Git

Local repository only; commit when a step is done, never push. Assets in
`game/assets` are committed (WebP keeps a character under 2 MB); `tools/*/work`
and `work/` are not.
