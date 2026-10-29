# Breathers - the design sheet (phase 2b of PLAN_usprawnienia.md)

A breather is one mini-game WITHOUT maths in every story: 30-60 s of rhythm and fun between the maths. Today "catch
what pops up" is the breather of eight lessons, and about ten lessons have maths in its place (counting claps, hops, a
bell, stones). Rule: every lesson one breather, never the same in two neighbouring lessons (menu order), never maths.
Every one is one gesture a three-year-old gets at once, taught by a character before it is played.

## The catalogue

| # | name | what the child does | what the characters do | sound | built from | fits |
|---|---|---|---|---|---|---|
| 1 | **zdrapka** (exists) | rubs snow / mist / mud / leaves off a painted picture to see what is under it - no counting after | guess first ("what is under the snow?"), cheer at the reveal | scratching, a "ta-da" | ctx.zdrapka (built) | winter, morning window, after a storm, autumn |
| 2 | **kropki z obrazkami** (exists) | joins dots from the smallest, a surprise picture appears | "what will it be?", then name it | pencil, sparkle | ctx.kropki `wielkosc` (built) | a surprise, a gift, the night sky |
| 3 | **posągi** (exists) | watches the dance; when the music stops, points to who still moves | dance, freeze, one wiggles | music | rhythm.js (built) | a party, a concert |
| 4 | **wyścig ślimaków** (exists) | points to a snail to cheer it on | cheer | crawl, cheer | long_short code (built) | a meadow |
| 5 | **kamień, papier, nożyce** (NEW) | picks a hand sign against a character to decide who goes first; taught first (each pair shown, "rock blunts scissors") | count "one, two, three", show, say what they chose, the rule decides out loud | whoosh, a cheer | new code; the hand stickers `gest_kamien/papier/nozyce` exist | anywhere two want the same thing |
| 6 | **karmienie** (NEW) | drags food (crumbs, seeds, a carrot) to a hungry animal (ducks, fish, birds, hens); it eats with a funny face; one thing it does not like - it spits it out | the animal is a sticker that wobbles and munches; the characters laugh | munch, splash, a yuck | new code; animal and food stickers (some exist, some to paint) | a pond, a farm, a lake, a garden |
| 7 | ~~huśtawka~~ (REJECTED by the user 2026-10-29: a rigid sticker swinging in the air looked fake) | swipes in time to push a swing; each push in time swings it higher, too early it slows | a character (or a little one) on the swing laughs "higher!" | creak, whoosh, laughter | new code; a painted swing sticker; the rider is a sticker or a puppet's head | a playground, a tree with a branch |
| 8 | ~~puszczanie kaczek~~ (NOT built - the user's choice, 2026-10-29) | flicks a flat stone across the water; it skips 2-5 times, rings spread on each hop | count nothing - just "wow, it skipped so far!" | splash, plop | new code; stone sticker exists (`kamyk`); rings drawn as ripples | a brook, a lake, a pond |
| 9 | **latawiec** (NEW) | drags the kite's string against the wind; the kite climbs, wobbles, does a loop | run with it, cheer | wind, flapping | new code; kite stickers exist (`latawiec_*`) | a windy meadow, a picnic |
| 10 | **lustro min** (NEW) | a character pulls a face (happy, surprised, sleepy, cross - the emotion bubble shows it); the child points to the same face among three | the prankster pulls faces, the others laugh | boing | new code; faces from the emotion bubbles (painted) | Bunny, a theatre |
| 11 | **kto to powiedział?** (NEW) | hears a voice from behind one of three bushes / in the dark; points where it came from; that one pops out | hide, call out, pop out | rustle, a laugh | new code; each character's recordings (a line per character) | hide and seek, the night, a dark burrow |
| 12 | **malowanie palcem** (NEW) | draws freely with a finger: on a steamy window, or with light on the night sky (a glittering trail that slowly fades) | "draw something for me!", they guess | a soft shimmer | new code (the pencil engine with a glow) | a night, a rainy window |

Not again: catch what pops up (overused); counting claps / hops / bells (that is practice, not a breather).

## Proposed assignment (menu order; no neighbours alike)

| | lesson | today | proposed breather | where in the story |
|---|---|---|---|---|
| 1 | one_many | catch a duckling | latawiec (the autumn wind in the garden) | the garden, before the brook |
| 2 | spot_difference | catch butterflies | karmienie (fish in the magic pond) | at the pond |
| 3 | bigger_smaller | catch big acorns | kamień, papier, nożyce (who carries the first box) | before the move to the new hollow |
| 4 | long_short | snail race | wyścig ślimaków (keep) | the meadow |
| 5 | tall_short | catch tall sunflowers | kto to powiedział? (hiding in the orchard) | in the orchard with Hedgehog |
| 6 | ordering | (the choir song) | malowanie palcem - light on the evening sky | before the concert |
| 7 | shapes | (removed catch game) | latawiec (Bunny's kite flies again) | the playground, after the kite is found |
| 8 | morning_night | catch fireflies | zdrapka - the fogged morning window | Mole's first morning |
| 9 | noticing_order | hop race (first / last) | lustro min (Bunny pulls faces) | the garden |
| 10 | counting_3 | count claps | kropki z obrazkami - a surprise gift for Hedgehog | the birthday |
| 11 | more_fewer | (stumps - maths) | kto to powiedział? in the dark glade | the night glade |
| 12 | logical_pairs | catch leaves | zdrapka - mud off the things after the storm | the workshop |
| 13 | numbers_1_5 | count the bell | karmienie (ducks at the lake stop) | the lakeside stop |
| 14 | up_down | who did not jump | kamień, papier, nożyce (who rides the lift first) | the orchard |
| 15 | in_out | (the circle game - maths) | malowanie palcem on the burrow's steamy window | the warm burrow in the storm |
| 16 | tangram | - | lustro min (the actors' faces before the show) | the theatre |
| 17 | grouping | catch the red leaf, mushrooms | zdrapka - rake leaves off to find footprints | on the trail |
| 18 | front_back | - | kto to powiedział? (who calls from behind the bush) | the hide-and-seek |
| 19 | rhythm | statues | posągi (keep) | before Deer |
| 20 | queue | race to the swings | lustro min (Bunny pulls faces in the queue) | the playground |
| 21 | counting_5 | count hops | karmienie (birds at the bakery door) | the orchard |
| 22 | numbers_6_10 | stones (maths) | zdrapka - mud off the logs | the dam |
| 23 | adding_5 | count claps | latawiec (the picnic meadow) | after the guests arrive |
| 24 | adding_10 | - | kamień, papier, nożyce (who jumps first) | the tournament |

Decided 2026-10-29: build 5, 6, 9, 10, 11, 12 (six new ones); the swing was built, tried and dropped; skipping stones not built. Each needs a yes; each gets a demo on the mechanics page
and an entry in docs/game_mechanics.md section 8. lesson.json gets `"oddech": "<name>"`, so the story preview checks
neighbours.
