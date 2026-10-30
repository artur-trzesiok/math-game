# Breathers - the design sheet (phase 2b of PLAN_usprawnienia.md)

A breather is one mini-game WITHOUT maths in every story: 30-60 s of rhythm and fun between the maths. Rule: every
lesson one breather, never the same in two neighbouring lessons (menu order), never maths. Every one is one gesture a
three-year-old gets at once, taught by a character before it is played. lesson.json `"oddech": "<name>"` names it;
the story preview (`manager/opowiesc.html`) checks the neighbours. Code: `game/engine/oddechy.js` (the new ones),
lines from the shared pool `game/oddechy`, demos on `manager/mechaniki.html?m=<name>`, docs in
`docs/game_mechanics.md` section 8.

## State (2026-10-30)

- All six new breathers chosen on 2026-10-29 are built: kamień-papier-nożyce (`kpn`), karmienie, latawiec, lustro min,
  kto to powiedział?, malowanie palcem.
- World 1 (stages 1-6, 24 lessons) is complete: every lesson has its breather, no two neighbours alike (checked
  against the menu order after the stage 6 reorder).
- Open: the three built lessons moved out of world 1 have none yet (below), and worlds 2-4 get theirs as their
  lessons are built.

## The catalogue

| # | name (`oddech`) | what the child does | status | used in world 1 |
|---|---|---|---|---|
| 1 | zdrapka | rubs snow / mist / mud / leaves off a painted picture to see what is under it - no counting after | built | 4 |
| 2 | kropki (with pictures) | joins dots from the smallest, a surprise picture appears | built | 1 |
| 3 | posagi | watches the dance; when the music stops, points to who still moves | built (rhythm.js) | 1 |
| 4 | slimaki | points to a snail to cheer it on | built (long_short) | 1 |
| 5 | kpn | rock-paper-scissors against a character to decide who goes first; taught first | built 2026-10-29 | 2 |
| 6 | karmienie | drags food to a hungry animal (fish, ducks, birds); one thing it spits out | built 2026-10-29 | 3 |
| 7 | latawiec | drags the kite's string against the wind; it climbs, wobbles, loops | built 2026-10-29 | 2 |
| 8 | lustro | a character pulls a face; the child points to the same face among three | built 2026-10-29 | 3 |
| 9 | ktoPowiedzial | hears a voice from behind one of the bushes; points where it came from; that one pops out | built 2026-10-29 | 4 |
| 10 | malowanie | draws freely with a finger: light on the night sky, or on a steamy window | built 2026-10-29 | 3 |

Rejected: the swing (built, tried and dropped 2026-10-29 - a rigid sticker swinging in the air looked fake), skipping
stones (not built, the user's choice 2026-10-29). Not breathers any more: catch what pops up (it was in eight
lessons), counting claps / hops / bells (that is practice). A breather not in this catalogue is a new mechanic: ask
the user first.

## World 1 - as built (menu order)

| stage | lesson | breather | where in the story |
|---|---|---|---|
| 1 | one_many | latawiec | the garden (Fox's triangle kite) |
| 1 | spot_difference | karmienie | fish in the magic pond, on the meadow |
| 1 | bigger_smaller | kpn | the forest, who carries the first box |
| 1 | long_short | slimaki | the meadow snail race |
| 2 | tall_short | ktoPowiedzial | hiding in the orchard (Bear seeks Hedgehog and Fox) |
| 2 | ordering | malowanie | light on the evening sky before the concert |
| 2 | shapes | latawiec | the playground, Bunny's kite flies again |
| 2 | morning_night | zdrapka | Mole's fogged morning window |
| 3 | noticing_order | lustro | Bunny pulls faces in the garden |
| 3 | counting_3 | kropki | the surprise gift (a drum) in the raspberry grove |
| 3 | more_fewer | ktoPowiedzial | the night glade (Owl seeks three) |
| 3 | logical_pairs | zdrapka | mud off the things in the workshop after the storm |
| 4 | numbers_1_5 | karmienie | ducks at the lakeside stop |
| 4 | up_down | kpn | the orchard, who rides the lift first |
| 4 | in_out | malowanie | the burrow's steamy window in the storm |
| 4 | tangram | lustro | the actors' faces before the show |
| 5 | grouping | zdrapka | leaves raked off to find footprints |
| 5 | front_back | ktoPowiedzial | the hide-and-seek in the forest |
| 5 | rhythm | posagi | the meadow, before Deer |
| 5 | queue | lustro | Mole pulls faces in the playground queue |
| 6 | counting_5 | karmienie | birds in the orchard by the bakery |
| 6 | light_heavy | ktoPowiedzial | by the brook (Beaver seeks Bear and Bunny) |
| 6 | thick_wide | zdrapka | Mole's doormat |
| 6 | complete_shape | malowanie | the meadow, a picture painted in a frame |

Uneven use: zdrapka and ktoPowiedzial four times each, kropki, slimaki and posagi once. Zdrapka also appears in many
lessons as a painted mechanic of the maths itself, so a child meets the scratch-off most often of all. In worlds 2-4,
prefer the less used ones (kropki, posagi, latawiec, kpn) and give zdrapka and ktoPowiedzial a rest.

## Built lessons moved out of world 1 (2026-10-30) - no breather yet

They kept their stories when stage 6 stopped being arithmetic; their old spot is empty or still maths. Proposals
(from the 2026-10-29 sheet), to settle once their neighbours in the new stages exist:

| stage | lesson | today | proposed breather | where |
|---|---|---|---|---|
| 7 | numbers_6_10 | none (counting stones is the maths) | zdrapka - mud off the logs | the dam |
| 12 | adding_5 | counting claps (maths - must go) | latawiec | the picnic meadow, after the guests arrive |
| 17 | adding_10 | none | kpn - who hops first | the tournament |

Each gets `"oddech"` in its lesson.json and a run of the story preview to check the neighbours.
