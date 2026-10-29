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
  3. **Apply** - a third act with its own small story (see "The home stage is the third act"): the characters play the home version of the game on screen
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

## Rules learned in review

- **Part 1 always brings the concept in through a scene** - the story's opening,
  every lesson, no exceptions:
  1. a problem the characters have (a mess, a quarrel, will everyone get a plate?);
  2. one character's naive try, built on a real childish misconception ("higher is
     bigger", "big ones are more", "tidying = throwing it all in one box");
  3. the other one objects and says why it does not work;
  4. "then how?";
  5. the concept named as the solution ("by comparing", "by making pairs", "by
     grouping");
  6. "what is that?" - "I'll show you, it's a fun game";
  7. the lesson's interactions;
  8. the problem solved thanks to the concept (the quarrel settled, the missing
     plate fetched, the pear found at once).
  Filler action ("something rolled away, fetch it") is not a story.

- Teach the method, not only the answer: compare by standing things evenly on one
  line and drawing a line over each top; pair things with pencil lines.
- A thing that rolls or flies away lands in open view, never under a character -
  the child must be able to see it and point to it.
- A tapped character repeats the task's instruction, never the feedback said since.
- A "mess" must look like one: scattered and turned, where the line says it is. (do not relearn them)

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
  computer, we do not know). **No one-word sentences**: ElevenLabs reads a lone
  "Wskaż." badly, also at the end of a question ("Kto jest najwyższy? Wskaż.").
  Make it one sentence ("Wskaż, kto z nas jest najwyższy.") or let the question
  be the whole instruction ("Gdzie jest więcej?").
- **A right answer is named, not just praised**: "Tak, trzy gruszki!", not a bare
  "Brawo!". Where nothing can be named (a finished puzzle) `ctx.brawo(who)` plays one
  of the character's recorded praise variants at random.
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
- **Nothing is asked before it is taught**: a digit is drawn and described before a
  child is asked to find it, digits come one by one in order (1, 2, 3 ... 10), and a
  card offer holds only digits already met; a sign ("=", "+") is shown and named
  before it is asked for; what practice asks (the biggest, a rhythm of sizes) the
  story has shown. No digits or number words in lessons that come before the numbers
  lessons (ordering marks its first place with an arrow, not a 1).
- **A tapped character repeats the instruction in force**, everywhere and always
  (tasks, counting, sorting, dragging); the instruction is the line said before the
  interaction began, never the "try again" since. One rule in the engine
  (`scene.tapPuppet` + the player's `wDzialaniu`), not per lesson.
- **The naive try must be visible and consistent**: six apples counted as "seven",
  one apple twice (it grows each time it is counted, so it ends up the biggest) - not
  "nine", which no child can see; a queue's "another go" only for the one who went.
- **The words match the screen at that moment**: a thing is named once it is there; a
  container named in a line is the one the check accepts; no "plate", "shelf",
  "stand" or "drawer" that is not drawn; the line's tense follows the animation ("it
  goes down" before, "it wants another go" after).
- **One big digit at a time, nothing drawn over anything**: the 7 goes before the 8
  is drawn (an 8 over a 7 read as neither, a 10 beside a 9 read as 109); two groups
  stand clearly apart; rows stay off the characters' heads; a two-digit counting badge
  is drawn smaller so "9 10" does not read "910".
- **Random layouts never give the answer or break the task**: shuffled things never
  lie in the answer order already; random turns that do not fit are replaced.

## The home stage is the third act

The audit of October 2026 found the home stage a stub: about 5 lines and one interaction against about 27 lines in
the story, and the story's thread often dropped. More of the same mechanic does not fix it; the home stage is a
small story of its own, built like this:
1. **Arrival with the thread** - the story's promise or reward is why we are home (the housewarming, the feast, the
   concert for the parents), and a character says so.
2. **A home problem of its own**, with a character's mistaken idea - the lesson's misconception again, now in a
   room ("all into one box!", "I'll stand on the books!").
3. **Four or five interactions in different forms** in a painted room whose shelves, hooks, table and box are real
   drop places (`miejsca`): put, point, count, order, a scratch-off or a story strip - never one mechanic four times.
4. **The payoff** - the problem solved thanks to the idea, the promise kept and SEEN (an event illustration for a
   concert, a party, a goodnight).
5. **The home task shown in play** - the characters do on screen what parent and child will do at home, then the
   line for the parents, then the goodbye iris.
The story preview flags a home stage with fewer than four interactions.

## A lesson asks for the tools it needs

The tools available today are listed in `game_mechanics.md`; that list is a starting point, not a limit.

Designing a lesson starts from what would make it a good lesson, not from what the engine can do today. When an
idea needs a mechanic or a tool the engine does not have yet (a row that plays itself, a dance on a beat, statues,
a night with lights, music), describe it to the user for acceptance - what it does on screen, why the lesson needs
it, what it costs (engine code, new pictures or sounds) - before building it. Never water the lesson down to the
existing tools in silence, and never build a new tool without the user's yes. An accepted tool goes into the engine
for every lesson (documented in CLAUDE.md), not into one lesson's code.

## Watch it as the child before calling it done

A lesson written alone (more_fewer_pro) reached the user with plain faults that one look would have caught:
a voice from a character who was not on screen, mice that vanished in a cut so nobody could know which bush had
more, pairing arcs all at one height that ran into one band, a "sleepover" in a sunlit room, the characters
covering the game, one lantern of four given its firefly. The code ran; nobody had watched it as a child does.
So, for EVERY scene, look at the snapshot and listen to the line, and answer each question with what is on the
picture, not with what the code means:
- **Who is speaking - can I see them?** Every line is said by a character on screen (the engine hands a hidden
  speaker's line to a visible one that has a recording, but write the scene right). A character that walked off
  says nothing until it is back.
- **Could a child who saw only this get it right?** Anything to remember or compare happens ON screen and slowly
  enough: things hide by moving behind the cover one by one, never by disappearing in a cut; a group is shown
  apart from the other group, next to the place it goes to.
- **Can every line on the picture be followed with a finger?** Pairing lines, arcs and arrows never share a path:
  nested arcs grow with their span, crossing lines are avoided, two strokes never lie over each other.
- **Does the place fit the words?** The scenery shows the time and the weather the story talks about: a night is a
  night picture (`pokoj_noc`), not a day picture under a dark veil; rain is seen.
- **Is anything covered?** Characters, the HUD and other things never cover a task, a thing to drag or its target;
  a thing in the hand is in front of the one carrying it.
- **Does every promise come true?** What the story says happens to all ("every lantern gets a firefly") happens to
  all, each one shown.
- **Is the answer in the picture, not given away?** The answer is visible to the eye that looks (the mice come out
  again after the pick), and nothing (a character standing next to it, a layout in answer order) gives it away
  before.
Run the whole lesson with the autopilot, snapshot every scene (each task before and after its answer), view the
snapshots one by one against this list, and only then show it to the user.

## Atmosphere and editing (every lesson)

Learned from a competitor's 7-minute "Big and Small" lesson (`reference/analiza_mniejszy_wiekszy.md`).
There is no "plain" and "pro" kind of lesson: these rules are the default for EVERY lesson, old ones
included - a lesson that misses them is unfinished, whatever its folder is called.

### The story
- **Less talk, more happening.** Aim for about half of the story stage spoken; between lines something
  happens on screen (a jump, a splash, something falls, someone runs). Lines stay short; a scene that is
  mostly talk is a bug, even if it has a task in it.
- **One goal across all three stages.** The story opens a thread the later stages close: a promise, a
  reward, a guest expected at home ("you will get a present when we are back" -> the present is the home
  stage). The child should feel one lesson, not three.
- **A chain of small adventures, each needing the concept.** The story is two or three short adventures
  in different places, each with its own everyday problem (getting dressed for the rain, a race, someone
  in trouble); every one is solved with the lesson's maths, used as a tool to DO something (put on the coat
  that fits, step on the big stone, build a step to reach) - not only as an answer to "point to".
- **We help someone thanks to maths.** At least one adventure is helping a character who has a problem.
  It is never the same rescue twice: a friend who cannot reach, a guest who is cold, a neighbour whose
  things got mixed up, a little one who is lost - vary who and how.
- **A breather: one mini-game without maths in every story** (rock-paper-scissors to decide who starts, a
  scratch-off, feeding a pet, statues): rhythm and stakes, a rest between the maths. It is NOT maths (counting
  claps is practice, not a breather), and two neighbouring lessons never share one - "catch what pops up" was the
  breather of eight lessons and read as the same game. `game_mechanics.md` section 8 lists them.
- **For the child it is a story, and the story leads.** Every step is said and linked, never cut short: the
  problem -> the goal said out loud ("we must find out who it is") -> the plan and WHY ("let's check what the gifts
  have in common - maybe that helps us guess who left them") -> the action -> what it showed ("all in the basket -
  they are all red!") -> what it means ("someone loves red") -> the next step and why ("the trail may lead us to
  them"). Arriving somewhere is narrated too ("look, what a beautiful red oak... somebody lives here... oh, a red
  door - this must be the place!"); a new character is greeted and asked before he explains himself; a task says
  why it is needed ("I'd like to wear my red hat for the visit, but my things are in a mess"). Terse, hurried lines
  that jump from one task to the next read as careless. Before recording, read the whole script in order, aloud, as
  the child will hear it, and add every missing link.
- **The story ends somewhere new.** The last adventure takes the characters to a place made for it, with its own
  scenery (the treehouse inside, the concert glade): a background costs less than a few recordings, so a dedicated
  place is never too much. Arriving there is a beat of its own (a transition, a look around, a line about the place).
- **Found pictures and mazes as story beats** (`ctx.znalezisko`, the maze tool): somebody finds a map, a photo, a
  drawing; it flies up big in the middle and the child marks what the story needs on it - where the path crosses the
  river (that is where the treasure is, so we go there), what the lost friend holds in the photo (an apple - so she
  went to the orchard). The answer moves the story on; it is never a quiz for its own sake. One spot or several, points or whole paths -
  what is marked must be recognisable at a glance by a 3-year-old (a thing, a crossing, a whole path), never an anonymous
  point on a plain stretch.
  A maze to find the way through works the same: solving it lets the story go on.
- **Everything the child sees is painted.** Even what code makes (a maze's layout, a map's spots) is drawn by
  gpt-image in the book's style, with the code's layout given as a reference; plain diagrams and vector shapes are
  for tests, never for the child.
- **A game is taught before it is played.** Rock-paper-scissors: first the three signs, then each pair
  shown with what happens (the rock moves onto the scissors and they shake: "rock blunts scissors"), then
  "one, two, three, show!", then each player says what they showed ("I chose rock", "Squirrel chose paper"),
  the rule decides out loud, and only then who won and what it means. A game started without its rules
  reads as a jump in the story.
- **The words follow the picture.** Nobody asks "how do we cross the brook?" while standing on the far bank:
  before writing a scene, look at every character's spot in that area of the scenery (water, a gate, a tree)
  and walk them where they belong; something said to have happened ("we crossed!") is said after it is seen.
- **Sizes in the story match what the child sees.** Look at the render before writing "Owl has a small
  head": the line, the right answer and the drawing must agree.
- **Choosing what is useful for a goal** ("what will help us reach the nest?" - the boxes yes, the ball
  no): a principle, a task with several right answers.
- **A wrong answer has a visible consequence**: the coat that is too big hangs off, the stone too small
  sinks, the tower in the wrong order wobbles and falls, the hat slips over the eyes. The child sees WHY,
  then the hint comes; the bare shake is the fallback.
- **Emotions read from the sofa**: a character's feeling is shown big (an emotion bubble over the head -
  anger, sweat, heart, joy, cold, an idea - with the matching animation), not only by the drawn face. The
  bubble matches the world: wet in the rain is a drop (`mokro`), a snowflake (`zimno`) only in the cold.

### The picture
- **Inserts on a plain colour** (`ctx.go({kolor, motyw})`): for a task, a method or a close-up the
  scenery goes and the characters stand on one soft colour with a light circle behind them; something
  barely moves in the background (drifting circles, shapes, clouds, rain, digits - very subtle: it is a
  background). Cheap, readable, and the eye goes to the task. Every moment where a method is shown or one thing is
  talked about alone gets one - several per story, in practice and at home too; the user wants many of them (there
  were two in 24 stories in October 2026). Placed where the moment calls for it, never to fill a count.
- **Editing like a film** (`ctx.ujecie`): cut between a wide shot, a two-shot, a medium shot and a close-up
  of a face; a new shot every several seconds while the story talks; a close-up for an emotion or a reaction,
  a wide shot when something moves. A task is shown in the shot where every option is visible.
- **A static camera is a bug, in EVERY lesson and every stage (the user flagged it again and again).** A scene
  filmed in one wide shot from start to end reads as dull however good the script is. The rule, checked before a
  lesson is called done:
  - at most three spoken lines in a row in the same shot - then a cut (`ujecie`), a pan, a walk into the
    picture, an insert (`go`) or a focus (`focus`) on the thing talked about;
  - a close-up (`zblizenie`) for every emotion, surprise, "oh no" and "thank you"; a medium shot (`sredni`,
    `na: [who, thing]`) when a character talks about a thing - the thing in the shot;
  - a two-shot (`dwuujecie`) for a dialogue of two; back to the wide shot (`ogolny`) for every task, walk and
    anything that moves across the screen;
  - a discovery gets `rozblysk`, an arrival a walk-in (`przejdz`), a new place a transition or a pan;
  - practice and home too: a close-up on the praise between rounds, a medium shot on a thing before it is asked
    about, an insert for a method - not five tasks in one frozen frame;
  - cut or fly - the engine decides by one key, the lesson only names the shot: a CUT when the subject changes
    (another character's face, other things, a new place), so a small viewer sees at once what to look at; a FLIGHT
    when the new shot keeps something of the last one (the same character or thing), when it widens back to the whole
    scene and when a medium shot opens from the wide one; a close-up from afar is a cut with comic speed lines. A held
    shot creeps in slowly (5 % in 8 s). `?kamera=ciecie` / `?kamera=lot` force one way to compare;
  - every shot has a reason - a template is not editing. The October 2026 audit found the rule kept by numbers
    and broken in spirit: 232 "close-up for one line, back to wide" ping-pongs, 75 wide shots cut away at once,
    28 two-shots in the whole game. So:
    - never a wide shot that is cut away at once (a flight out for nothing), never a shot change with no line,
      task or movement in it;
    - a dialogue of two is a two-shot (or shot / reverse shot), not a close-up per line and back to wide;
    - a close-up only for an emotion, a reaction, a surprise, a "thank you";
    - an instruction is said in the shot that shows the task, so the child looks at the options, not at a face;
    - the wide shot is for tasks, walks, arrivals and things moving across the screen;
  - measure: `python tools/lessons/montaz.py <lesson>` (lines, shots by type, the longest run in one shot,
    wide-then-cut, ping-pongs) and the story preview, which flags four lines in one shot and a wide shot cut away.
    No lesson is the reference by being old: the three once named here had become the most static.
- **Wide sceneries and pans** (`ctx.pan`): a background may be wider than the screen (a panorama made of
  joined tiles); a scene moves to the next area with a pan while the characters walk, instead of a cut to
  another picture when the place is the same.
- **Transitions between adventures** (`przejscia: true` in the lesson, or `ctx.go(bg, {przejscie})`): a
  rainbow of bands with the characters' heads, a pattern, an iris, bubbles - chosen at random unless a scene
  names one. Inside one adventure a cut or a pan, between adventures a transition.
- **A countdown** (`ctx.odliczanie`) before a race or a quick game; the dots style carries its digits too
  (three bare dots meant nothing to a child).
- **Practice shows progress**: a bar of stars (`ctx.gwiazdki`) fills as the rounds go, a streak of first-try
  answers is cheered; practice is a few different mini-games, not one task five times.
- **A right answer is celebrated**: confetti and a big tick (`ctx.konfetti`, `ctx.ptaszek`, or
  `nagrody: true` in the lesson for every right pick).
- **Weather and light in the air** (`ctx.czastki(rodzaj, {gestosc, wiatr})`): rain over the whole scene,
  snow, fireflies floating and gently pulsing in a forest morning, falling leaves, dust in the sunlight, bubbles.
  A design tool for the mood of a place (and a story beat: the rain starts, so we need coats); never hiding a
  task, but weather the story talks about must be seen at a glance (rain also dims the day); it ends with the
  background, call it again after `go`.
- **Walking into the picture** (`ctx.przejdz(who, [[x, y], ...], {skok})`): higher up the screen is further
  away, so the character gets smaller and its shadow goes along; across stepping stones it hops. The next pan
  brings them back to the front (`ctx.pan(k, {cele: {who: x}})`). A brook is crossed along the stones, never
  by walking sideways through the water.
- **Things to pick or drag lie where nothing else is**: in the sky or on open grass, not over water, the
  path or a character (check the area of the panorama); a thing in the hand is drawn over everything.
- **Signs and icons are drawn in the game's style** (gpt-image stickers through `tools/objects`, e.g. the
  rock-paper-scissors hands), never emoji.
- **Dressing up** (`ctx.ubierz(who, rzecz)`, `ctx.ubranie(rzecz)` as a sticker to drag): hats, glasses, a scarf,
  shoes from the wardrobe (`game/assets/ubrania`), fitted to any humanoid by the engine; children love dressing
  games. Quadrupeds are not dressed and a tail never is. A wrong size is shown (`nieUbieraj`: it slips, wobbles
  and falls off) before the hint.
- **A second way to compare: overlapping** (`ctx.nalozenie`): one thing laid on the other, the bigger one
  sticks out all around. Next to the base line, for things that can lie on each other (coats, leaves, hats).

## How it is made

Everything is scripted and repeatable (see `CLAUDE.md`): characters, backgrounds
and objects come from gpt-image through the tools in `tools/`, speech from
ElevenLabs through `tools/audio`, and the only hand work is in the manager
(`manager/`): a character editor to nudge a piece or a pivot after a review, whose
corrections survive every rebuild. Reviews are done by looking at renders, never
by trusting a green test alone.
