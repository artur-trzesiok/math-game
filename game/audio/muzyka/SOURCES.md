# Music sources

| file | what | made with | licence |
|---|---|---|---|
| menu.mp3 | the menu's tune: ukulele, glockenspiel, pizzicato, shaker (45 s, loops) | ElevenLabs Music (music_v1), 2026-10-28 | ours: generated on a paid plan, commercial use allowed |

Prompt: "A gentle, warm, cheerful instrumental for the main menu of a picture-book maths game for small children:
ukulele and glockenspiel with soft pizzicato strings and a light shaker, a sunny meadow mood, calm and friendly,
steady medium-slow tempo, not distracting, seamless loop, no vocals."

Replaced Happy Lullaby (cynicmusic, CC0, OpenGameArt), the first menu tune.

## The places and the weather (2026-10-29)

`<motyw>_1.mp3`, `<motyw>_2.mp3` (laka, las, woda, dom, noc, teatr, cwiczenia, menu): ElevenLabs Music (music_v1),
150 s each, two versions per theme played in turn - prompts in `tools/audio/make_music.py`. The weather loops
`game/audio/pogoda/*.mp3` (20 s, `loop`): ElevenLabs sound generation, normalised to a mean of -34 dB. Ours: generated
on a paid plan, commercial use allowed. `menu.mp3` (45 s) stays as the fallback if menu_1/menu_2 are missing.
