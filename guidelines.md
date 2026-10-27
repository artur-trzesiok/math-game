# Game guidelines

An educational maths game for 3-4 year olds, played on a tablet with a parent
nearby. The child cannot read, so everything is spoken and everything the child
does is pointing at something on screen (a finger on a tablet, a mouse on a
computer - the lines always say "point to" / "wskaż", never "tap" or "click"). The target is a library of ~100 lessons
built the same way, by Claude Code, from reusable characters, backgrounds and
objects - no hand-made art, no in-house level editor.

## The pedagogy

- **No numbers before the ideas.** The first lessons compare and sort without
  counting: bigger / smaller by eye, more / fewer by pairing one to one, groups by
  a spoken rule. Numerals arrive only when the relations they describe are familiar.
- **Every lesson has three stages**, always in this order, flowing into one another
  without a prompt; a strip of three icons at the top (book, hand, house) shows
  which one the child is in:
  **Every stage has about five moments where the child acts** (a choice, a drag),
  never a stretch of listening only.
  **The story opens with a small adventure**: something happens (a gust, a cup
  rolling to the water, a pear under the bed), the characters react with their
  bodies (a jump, a run) and the child helps once before the idea is introduced.
  1. **Story** - two characters meet a small everyday problem (two apples, not
     enough plates, a messy blanket) and the idea is shown, not explained. The
     child joins in once or twice, guided.
  2. **Practice** - short tasks that repeat the idea with different things. A wrong
     answer is never punished: it is named ("that is the bigger one"), the question
     is asked again, and after two misses the right answer pulses. A right answer
     is never skipped past: the correct picture stays on screen while a character
     names it ("yes, the mouth opens towards the cups, because..."), then a pause.
  3. **Apply** - the characters play the home version of the game on screen
     (bigger than my paw, a plate for every cup, tidying after a snack), the child
     joins for one round, and they close with "ask your parents to play this at
     home". No text, no card for the parent: the game itself shows how to play.
     The lesson ends with the characters waving goodbye while a blue iris closes
     around their faces and the menu fades in - a clear, calm ending, so the
     tablet can be put down.
- **One idea per lesson, said in both directions** ("bigger than ... smaller
  than"), with the same words every time.
- **Nothing just appears or just happens**: things grow in with a little
  overshoot, the tapped thing pops, a wrong one also shakes, the right one flies
  where it belongs. **Praise is a character's reaction** (a cheer,
  applause), not a score. No timers, no lives, no stars.

## The world

- A cast of cut-out animal puppets (fox, squirrel, owl, roe deer so far), each with
  the same set of moves (walk, talk, cheer, point, raise a paw, wave, sway, sad,
  look around) so any lesson can use any of them. The fox is the host; the others
  rotate so the child meets everyone.
- Picture-book backgrounds (orchard, lake meadow, forest, playground, vegetable
  garden, brook, children's room, hallway, kitchen) with gently moving grass and
  clouds. A story travels through two or three of them; the practice has one of
  its own (children like variety); the "at home" stage reuses the home.
- Illustrated objects on white stickers (so a green pear reads on green grass),
  scaled for "bigger / smaller", repeated for "more / fewer", sorted for "groups".
- Two languages from day one (Polish, English); every spoken line is a key in a
  per-lesson translation file and becomes an mp3 through the audio pipeline, with its
  lip-sync envelope baked next to it. Until the mp3 exists the browser's own voice
  reads the line (for testing only).
  **Sound only**: no subtitles, no written instructions. If the child missed the
  instruction, tapping a character repeats it. **No narrator**: there is no voice
  from off screen; every line belongs to a character who is on screen and moves
  its mouth.

## Tablets and the safe area

Tablets come in 4:3, 16:10 and 16:9, and that is the supported range. The stage
has a fixed **safe area of 4:3 (12 x 9 units)** centred and always fully visible;
between 4:3 and 16:9 the extra width shows background only. A screen wider than
16:9 or taller than 4:3 gets black bars outside the renderer, where nothing
happens. Everything that matters - puppets, objects, signs,
zones, cards - is placed in safe-area units (x in -6..6, y in -4.5..4.5, the ground
at y = -3.3). The background plate is sized to a fixed design frame (what a 16:9
tablet sees around the safe area), never to the actual viewport, so the ground,
the blanket or the table keep the same relation to the puppets on every screen; a
narrower screen only crops the sides. Landscape only. `?safe=1` draws the
rectangle while testing.

## Plug & play lessons

A lesson is a folder `game/lessons/<id>/` with:

- `lesson.json` - id, title (per language), goal, age, which characters,
  backgrounds and objects it uses (the manifest the master player lists);
- `lesson.js` - an ES module exporting `{ id, characters, backgrounds, stages }`
  where `stages.story`, `stages.practice`, `stages.apply` are arrays of **scenes**,
  each an `async (ctx) => {}`;
- `i18n/pl.json`, `i18n/en.json` - labels and spoken lines (`"line.*": {who, text}`);
- `scenario.md` - the script in prose, for review before any code.

The master player (`game/index.html`) lists lessons from `game/lessons/index.json`,
picks the language, loads the module and runs the scenes in order, giving each one
a `ctx` with: `say(who, key)`, `enter(who)`, `show(who)`, `play(who, anim)`,
`object(name, {x, y, size})`, `sign(text)`, `zone({x, y, w, h, image})`, `choose(targets)`,
`sort({items, zones, wrong})` (drag things into containers, any order; checked only
when everything is in, each container one kind), `arrange(groups, opts)` (the layout:
rows and groups by real widths, so nothing overlaps or misaligns),
`task({targets, correct, wrong})`, `card(key)`, `wait(s)`, `clear()`, `praise(who)`,
`t(key)`, `lang`, `fast`. A scene chooses who says a line; a line declares its
default speaker and the others allowed, and the pipeline records every variant.
A lesson never touches three.js directly and never knows
about other lessons; the player never knows what a lesson does. Adding lesson
number 42 is a new folder and one line in `index.json`.

## Rules learned in review (do not relearn them)

Each of these came from a reviewer watching a child-sized screen; a new lesson
that breaks one of them is wrong even if it runs.

- **Size is compared on the same thing at two sizes** (two apples, two cups),
  never on two different things drawn at chosen sizes: a big cookie next to a
  small plate asks the child to ignore what they know (a plate IS bigger than a
  cookie). A single picture must also keep its real relation (a plate drawn
  bigger than a paw, a cookie smaller).
- **The point of reference is on the screen.** "Smaller than your hand" cannot
  be answered by looking at two stickers; a screen question compares two
  visible things ("which one is bigger?"). Real-world references (your hand,
  your shoe) belong to the home task with real objects.
- **A sign stands between two groups side by side.** "<", "=" and ">" only make
  sense with a left pile and a right pile and a visible empty slot between them,
  where the chosen card lands. Never ask for a sign while things are stacked
  (after a pairing animation, lay the piles out side by side again first).
- **A right answer stays on screen and is named.** The correct picture does not
  vanish on the tap: the character praises it and says what it shows ("the mouth
  opens towards the cups, because there are more cups"), then a pause. The child
  has to see the correct arrangement, not just hear "well done".
- **A wrong answer is explained, never punished**, and after two misses the right
  one pulses.
- **Instructions say "wskaż" / "point to"**, never "click" or "tap" (tablet or
  computer, we do not know). **No one-word sentences** ("Wskaż." alone is read
  badly by the voice); a question such as "Gdzie jest więcej?" is the whole
  instruction.
- **No narrator.** Every line belongs to a character on screen whose mouth moves.
  **No subtitles, no text** the child would have to read. A tap on a character
  repeats the last instruction.
- **About five interactions in every stage**, the story included. A story that
  only talks is a bug.
- **The story is a journey through two or three places** (`go`), each with its
  own small adventure; the practice has a setting of its own, different from the
  story's; across lessons settings may repeat, and the "at home" stage shares the
  home (hallway, kitchen).
- **The object layer floats above the characters' heads** (safe-area y 1.2) and
  never covers them; characters stand at x = ±4.6. Everything is placed with
  `arrange` (real widths, real gaps), zones are sized from what it returns, so
  nothing overlaps and rows line up with their signs.
- **Nothing pops in or out.** Things grow in with a little overshoot, a tapped
  thing bumps, a wrong one shakes, a chosen one flies where it belongs, the stage
  does not flicker between parts (same scenery is kept; a new one dips to dark).
- **Stickers, not cards.** Objects carry a white die-cut outline baked by the
  pipeline; a flat card behind an icon reads as a UI widget. Canvases for signs
  and zones are drawn at a fixed pixel density (no stretched dashes, no
  pixelation).
- **Sorting is drag and drop into drawn containers** (a basket, a box), in any
  order, checked only when everything is in; each container must hold one kind.
  Containers are sized so the big things fit (rows by real widths).
- **Voices are the characters'**: a child-like voice for a child-like character,
  speech at 0.85 speed, lip-sync baked from the recording.
- **Endings are gentle**: no cards between stages, three phase icons at the top
  centre, the goodbye iris closes on the face of whoever spoke last, the menu
  fades in.
- **One scene, one idea, visible from the start**: the same mechanic for the
  same idea across stages (pairing is always the check for "more"), so the child
  recognises it.

## How it is made

Everything is scripted and repeatable (see `CLAUDE.md`): characters, backgrounds
and objects come from gpt-image through the tools in `tools/`, speech from
ElevenLabs through `tools/audio`, and the only hand work is in the manager
(`manager/`): a character editor to nudge a piece or a pivot after a review, whose
corrections survive every rebuild. Reviews are done by looking at renders, never
by trusting a green test alone.
