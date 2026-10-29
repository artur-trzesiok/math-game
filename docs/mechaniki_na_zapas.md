# Which mechanic for which lesson of worlds 2-4 (point 5 of the worlds plan, 2026-10-29)

Every lesson of worlds 2-4 (`docs/program.md`) checked against what the engine has (`docs/game_mechanics.md`): which
mechanic a lesson is made with. Read it when writing a lesson of worlds 2-4.

## The nine new mechanics - built 2026-10-29 (API in game_mechanics.md), and the lessons waiting for them

- `c.siatka` - two_features, tables_1, shelf_grid, picture_sudoku, shelf_labels, calendar, (charts)
- `c.regula` - guess_rule, sort_free, shelf_labels, (number_patterns)
- `c.rozdaj` - split_5, fair_share, even_odd, how_many_plates, (make_equal)
- `c.szpara` - thick_thin, wide_narrow, (solids)
- `c.miarka` - measure_steps, ruler_cm, kilograms (weights on the scale)
- `c.wykres` - charts, tables_1, (estimation)
- `c.zegar` - clock, (days_of_week, calendar)
- `c.portrety` - guess_who, every_side
- `c.peczki` - teens, whole_tens, tens_add_sub, plus_carry, minus_borrow, (count_20)

## Small extensions of what exists (no new gesture - built with the lesson that needs them)

- `c.shape`: new kinds - oval, trapezium, pentagon, hexagon, rhombus (plane_shapes_2); a seven-piece tangram set in
  `UKLADANKI` (tangram_2).
- `c.sklepik`: coins of 1, 2 and 5 (coins), change given back (change).
- `c.ramka`: two frames side by side - the twenty frame (make_ten, add_through_10, subtract_through_10, count_20).
- `c.znalezisko`: spots in an ORDER to find one after another, the missing one asked at the end (number_hunt).
- ~~`c.waga`: weights to put on the other pan (kilograms)~~ - done in `c.miarka({jednostka: "odwaznik"})`.
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
