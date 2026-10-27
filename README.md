# math_game

Educational maths game for 3-4 year olds: cut-out animal puppets, picture-book
scenes, spoken lessons in Polish and English, built for tablets. Concept and
pedagogy: [guidelines.md](guidelines.md). How to work in this repository:
[CLAUDE.md](CLAUDE.md).

```
python manager/server.py          # http://localhost:8740/game/     the game (master player)
                                  # http://localhost:8740/manager/  the manager (character editor)
```

```
game/        the runtime: engine, assets, lessons, audio (what a tablet loads)
manager/     the manager app (today: the character editor) + the dev server
tools/       generation pipelines: characters, backgrounds, objects, audio (never shipped)
work/        local scratch (screenshots, debug renders) - not in git
```
