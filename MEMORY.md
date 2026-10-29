# Session memory

What the user and Claude agreed, learned and left open while building the game - the things the code, CLAUDE.md
and guidelines.md do not say by themselves. Read it at the start of a session on any machine; keep it current (see
CLAUDE.md, "Memory"). Dates are absolute.

## Working with the user (Artur)

- **Chat in Polish**, every status line too; code, comments, commits and repo docs in English.
- **Commit locally when a step is done; never push** unless asked in so many words. The remote `origin` is
  https://github.com/artur-trzesiok/math-game.git (`master`), first pushed by the user 2026-10-29.
- **Never print or commit keys.** `.env` holds OPENAI_API_KEY and ELEVENLABS_API_KEY (git-ignored). A STALE
  ELEVENLABS_API_KEY sits in the user's OS environment - always run audio through `tools/audio/run.py`, which lets the
  repo's `.env` win (make_music.py run directly fails with "invalid key").
- **Always test with `?cicho`** - otherwise voices and music play on the user's speakers.
- **Do not start a second server on 8750** - the user runs `python manager/server.py`; test in your own browser tab.
- **New mechanics: ask first.** Mechanics the user proposes are approved by that. Within an approved plan work
  autonomously - do not ask about every step.
- **Everything audible comes from ElevenLabs** (voices, music, effects); tuned notes are synthesised (exact pitch).
- **Everything visible is painted by gpt-image** - even layouts made by code (a maze plan) go to gpt-image as a
  reference; plain vector graphics and numpy drawings are for tests only.
- **Comments one line**, reasons go to the commit message; commits cut by feature.
- **Judge visuals by eye** (render, snapshot, look), measure only what the eye cannot decide.
- Lines never assume the child's gender. No counting beyond 3 before the counting lessons; no digits before the digit
  lessons (shapes: colouring by signs, not numbers).
- The user plays lessons by hand and reports with screenshots, often mid-task: fix what they flag before going on.

## Where the project stands (2026-10-29)

- 24 lessons in six stages (`game/lessons/index.json` topics), each three stages (story / practice / at home), all
  recorded pl + en, all run end to end by the autopilot (`?szybko&scenariusz`).
- Every lesson was reviewed twice on 2026-10-29: (1) editing - close-ups, medium shots, wide before tasks;
  (2) enrichment with the new story tools where they fit (found pictures, mazes, a dedicated last place). Left as they
  were on purpose: noticing_order, one_many, more_fewer_pro, rhythm (reasons in their commits).
- `ordering` (In order) was rebuilt around Beaver's evening concert: lantern tower, map, stepping stones for the
  owlets, the owlet choir on a new glade (ElevenLabs owl song, sour after Bunny's prank), at home a water-glass
  xylophone (C E G C).
- The game runs offline: three.js and Baloo 2 are in `game/vendor`.
- Minimal time to pass a lesson (a child who never errs): about 3:40-7:15, rhythm about 10:00; about 2 h 7 min for all
  24 (speech measured or summed from the code, the rest estimated - the hidden browser pane stalls real-time runs).

## Decisions the user made

- Editing: cuts and flights mixed by one key in the engine (`efekty.js ruchKamery`): cut on a change of subject,
  fly when something stays in the shot / back to wide / wide to medium; held shots creep in. `?kamera=ciecie|lot`
  compares. The speaker is always kept in the shot (`mowcaWKadrze`).
- "Static editing" was flagged again and again: it is now a hard rule in guidelines.md for every lesson; there is no
  "plain" vs "pro" lesson any more - the pro rules are the default.
- A story ends in a new place with its own scenery (a background costs less than a few recordings).
- Found pictures (`ctx.znalezisko`): points OR whole paths to mark, recognisable at a glance by a 3-year-old.
- Mazes (`ctx.labirynt`): a Python plan painted by gpt-image, moves checked on the plan.
- Do not trim the stories that grew past ~5 interactions (front_back 9, queue 7, shapes ~11) - the user said no.
- The adventure map in the menu: liked, but postponed until the lessons are complete.
- Sticker variants (3 each) are drawn at random, but a colour a story names must stay.
- Walks: a slight glide is better than fast tiny steps (cadence capped at 1.5x natural).
- Music: every place has a theme in two ~150 s versions (30 s loops felt repetitive), weather loops beside it.

## Pitfalls that cost time

- **The browser pane is often hidden**: rAF runs at 0 fps, screenshots are stale, real-speed runs stall on
  animations. Test with `?szybko` and `gra.snap("name")` (PNG to work/snap), drive with `gra.klikCel`, read
  `gra.dziennik`. JS evals time out at 45 s - split them.
- **Python edits in heredocs lose backslashes**; write the script with Write and run the file. `sed -i` turns CRLF
  into LF. A trailing `// comment` inserted into a one-line statement swallowed code twice (kolorowanka, the veil) -
  after such an edit run `node --check` AND look that the call is still outside the comment.
- **Draw order beats z**: stickers 10, puppets 20-30, found pictures and mazes 38-39. A sticker meant to hide a
  character needs a renderOrder above 30 (the bush in shapes). A traverse that sets renderOrder afterwards resets
  special layers (the slot outline).
- **`shake` must move by an offset**: restoring its starting x sent a wrongly dropped thing home under the wrong place.
- **`ujecie` measured things still popping in** (scale 0) and framed empty boxes - it now waits for them.
- **Found-picture spots start NOT marked right**; the lesson marks the answer with `dobre(...)` before the task (the
  autopilot taps whatever is marked).
- **Two painted paths share their ends and merge** - each path gets an edit of its own.
- **gpt-image cannot be trusted with exact counts above ~5 or with digits** in pictures.
- **gpt-image output moderation** blocks innocent animals at random (deer) - retry, do not rewrite the prompt.
- **Sticker sheets**: say "NO background, NO glow" explicitly; sort sheets with `kolumna` when the model lays
  them out top to bottom; a neighbour's leaf in a sticker's box comes along unless the cut keeps only its own blob
  (fixed in make_objects.py split).
- **Editor corrections are absolute positions**: regenerating a piece (Beaver's tail) makes the old correction wrong.
  Do not reinstall a character while the user edits it in the editor (it raced once on 2026-10-29).
- Subagents for parallel lesson work: waves of 3-4, each told not to commit and to use its own browser tab; shared
  tool files edited only with small Edit insertions; review their pictures yourself before committing.

## Open, not started

- Trimming long stories: declined by the user (keep as is).
- noticing_order and one_many still end in shared sceneries, not a place of their own.
- Long-short map: a right pick shows a tick and the path in pencil; tangram poster: the two ear spots overlap a bit.
- Queue: tapping the photo's empty background plays "that one was faster..." - a new wrong-line would fit better.
- Covers were not regenerated for the lessons whose stories changed on 2026-10-29 (only ordering's was).
