# Mechanics ahead of the lessons (point 5 of the worlds plan, 2026-10-29)

Every lesson of worlds 2-4 (`docs/program.md`) checked against what the engine has (`docs/game_mechanics.md`). Most
lessons are built from existing parts; the new mechanics below are the ones several lessons need - built once, early,
so the first lessons of a world are not poorer than the last. Every new one needs the user's yes (the rule at the top of
game_mechanics.md); the list is ordered by how many lessons use it.

## New mechanics (proposed)

| # | mechanic | what the child does | lessons | painted parts |
|---|---|---|---|---|
| 1 | **siatka** - a grid with row and column headers | puts things into cells (a cell takes what fits its row AND column), or reads a cell; the same engine fills a table, sorts by two features, shelves in rows and columns, a sudoku, a calendar month | two_features, tables_1, shelf_grid, picture_sudoku, shelf_labels, calendar, (charts) | a painted board / shelf per lesson; icons as stickers |
| 2 | **ukryta reguła** - sorting by a rule nobody says | drags things into containers that have no label; each container quietly takes one kind; after a few right ones a character says the rule out loud ("they are all ... red!"); a wrong one tells by a visible consequence | guess_rule, sort_free, shelf_labels, (number_patterns) | none (existing containers) |
| 3 | **rozdaj** - giving things to characters | drags things into the characters' paws (or bowls in front of them), each sees its own heap grow; "fair" is checked by the engine (equal heaps), with a pairing line check for even / odd | split_5, fair_share, even_odd, how_many_plates, (make_equal) | none |
| 4 | **wykres** - a picture bar chart | stacks one sticker per thing in a column above each kind; reads the tallest / the lowest / how many; columns grow with a pop | charts, tables_1 (reading), (estimation) | none |
| 5 | **zegar** - a painted clock | turns the short hand (and later the long one) to an hour; the clock in a scene shows the time of the story | clock, (days_of_week, calendar) | a painted clock face and hands (gpt-image) |
| 6 | **pęczki** - bundling tens | gathers ten sticks into a bunch (it ties itself at ten), a place-value mat of bunches and single sticks; regrouping unties a bunch | teens, whole_tens, tens_add_sub, plus_carry, minus_borrow, (count_20) | painted sticks and a tie |
| 7 | **przez szparę** - does it fit? | pushes a thing through a gap (a door, between two trees, a fence): too thick / too wide it gets stuck and wobbles - the consequence that shows thick / wide | thick_thin, wide_narrow, (solids: what rolls through) | painted gaps as stickers |
| 8 | **miarka** - measuring with units | lays paws / blocks end to end along a thing from one line; they snap in a row and are counted | measure_steps, ruler_cm (the ruler as a painted strip of units), (kilograms: weights on the scale) | a painted ruler |
| 9 | **portrety** - characters as cards | the characters' head badges as cards that flip ("who has glasses? not him - turn him over"); also "who is this from behind?" with the puppet drawn in its back / side view on a card | guess_who, every_side | none (puppet views exist) |

## Small extensions of what exists (no new gesture - built with the lesson that needs them)

- `c.shape`: new kinds - oval, trapezium, pentagon, hexagon, rhombus (plane_shapes_2); a seven-piece tangram set in
  `UKLADANKI` (tangram_2).
- `c.sklepik`: coins of 1, 2 and 5 (coins), change given back (change).
- `c.ramka`: two frames side by side - the twenty frame (make_ten, add_through_10, subtract_through_10, count_20).
- `c.znalezisko`: spots in an ORDER to find one after another, the missing one asked at the end (number_hunt).
- `c.waga`: weights to put on the other pan (kilograms).
- a crossing-out helper for taking away (a pencil cross over what leaves) - `c.cross` exists; subtract_5, subtraction_10.

## Already enough (from the engine as it is)

light_heavy (`waga`, never used yet), counting_10 (`count`), number_neighbors (`os`), ordinal_10 (`slots` numbered),
equal_sets / make_equal (`polacz`, `sort`), compare_sets / sort_by_quantity (`count`, `slots`), complete_shape (`piece`,
`tangram`), symmetry (`symmetry`, never used yet), shapes_hunt and rhythm_hunt (`szukaj` / found pictures with whole
groups as spots), secret_code (a found letter + `slots` + `digit`), days_of_week and seasons (`historyjka`, event
illustrations), add_sub_family / addition_10 / subtraction_10 / add_three ... (`equation`, `domino`, `ramka`),
split_10 / bonds_10 (`ramka`), count_by_groups (`zagroda` round groups), compare_numbers (signs between two piles),
turned_shapes (`shape` with `rotateTo`), number_patterns (`slots` + digit cards), picture_problems (event illustration
+ `equation`), estimation (`kubki`-style glimpse + `count`), coding (`strzalki`), castle_treasure (`wedrowka`).

## Suggested order

Before world 2: 1 siatka, 2 ukryta reguła, 3 rozdaj, 7 przez szparę, 8 miarka (world 2 needs them). Before world 3: 4
wykres, 5 zegar, 9 portrety. Before world 4: 6 pęczki.
