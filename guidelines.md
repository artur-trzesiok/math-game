# Game guidelines

An educational maths game for 3-4 year olds, played on a tablet with a parent
nearby. The child cannot read, so everything is spoken and everything the child
does is a tap on something on screen. The target is a library of ~100 lessons
built the same way, by Claude Code, from reusable characters, backgrounds and
objects - no hand-made art, no in-house level editor.

## The pedagogy

- **No numbers before the ideas.** The first lessons compare and sort without
  counting: bigger / smaller by eye, more / fewer by pairing one to one, groups by
  a spoken rule. Numerals arrive only when the relations they describe are familiar.
- **Every lesson has three stages**, always in this order:
  1. **Story** - two characters meet a small everyday problem (two apples, not
     enough plates, a messy blanket) and the idea is shown, not explained. The
     child joins in once or twice, guided.
  2. **Practice** - short tasks that repeat the idea with different things. A wrong
     answer is never punished: it is named ("that is the bigger one"), the question
     is asked again, and after two misses the right answer pulses.
  3. **Apply** - the characters send the child off screen: a mission in the
     kitchen, at the table, with the socks; then a card for the parent with one
     concrete thing to do together. The game should end with the tablet put down.
- **One idea per lesson, said in both directions** ("bigger than ... smaller
  than"), with the same words every time.
- **Praise is a character's reaction** (a cheer, applause), not a score. No timers,
  no lives, no stars.

## The world

- A cast of cut-out animal puppets (fox, squirrel, owl, roe deer so far), each with
  the same set of moves (walk, talk, cheer, point, raise a paw, wave, sway, sad,
  look around) so any lesson can use any of them. The fox is the host; the others
  rotate so the child meets everyone.
- Picture-book backgrounds (orchard, lake meadow, children's room, kitchen) with
  gently moving grass and clouds. **Every lesson's story and practice play in a
  setting no other lesson uses**; the "at home" stage may reuse a home setting.
- Illustrated objects on white stickers (so a green pear reads on green grass),
  scaled for "bigger / smaller", repeated for "more / fewer", sorted for "groups".
- Two languages from day one (Polish, English); every spoken line is a key in a
  per-lesson translation file and becomes an mp3 through the audio pipeline. Until
  the mp3 exists the browser's own voice reads the line (for testing only).

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
`object(name, {x, y, size})`, `sign(text)`, `zone({x, y, w, h})`, `choose(targets)`,
`task({targets, correct, wrong})`, `card(key)`, `wait(s)`, `clear()`, `praise(who)`,
`t(key)`, `lang`, `fast`. A lesson never touches three.js directly and never knows
about other lessons; the player never knows what a lesson does. Adding lesson
number 42 is a new folder and one line in `index.json`.

## How it is made

Everything is scripted and repeatable (see `CLAUDE.md`): characters, backgrounds
and objects come from gpt-image through the tools in `tools/`, speech from
ElevenLabs through `tools/audio`, and the only hand work is in the manager
(`manager/`): a character editor to nudge a piece or a pivot after a review, whose
corrections survive every rebuild. Reviews are done by looking at renders, never
by trusting a green test alone.
