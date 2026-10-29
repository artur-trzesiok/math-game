"""Illustrated backgrounds: plate + movers (two gpt-image passes, the second
with the plate as reference), then the difference cut into PNG props with alpha
that the engine (game/engine/tlo2d.js) sways or drifts.

  python tools/backgrounds/make_background.py gen sad      # work/sad/plyta.png, ruch.png
  python tools/backgrounds/make_background.py split sad    # work/sad/rekwizyt_NN.png + rekwizyty.json
  python tools/backgrounds/make_background.py install sad  # -> game/assets/backgrounds/sad/
  python tools/backgrounds/make_background.py all sad

A new scene = an entry in SCENY (plate prompt + movers prompt) + `all`.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
KORZEN = TU / "work"
GRA = TU.parent.parent / "game" / "assets" / "backgrounds"


def _horyzont(plyta: np.ndarray) -> int:
    """First row from the top where green takes over. Everything above it
    drifts, everything below it sways - so a bird needs no special case."""
    r, g, b = plyta[:, :, 0], plyta[:, :, 1], plyta[:, :, 2]
    zielen = ((g > r) & (g > b)).mean(axis=1)
    kandydaci = np.where(zielen > 0.5)[0]
    return int(kandydaci[0]) if len(kandydaci) else plyta.shape[0] // 3


def _skladowe(m: np.ndarray, min_pikseli: int):
    """Connected runs of True, biggest first."""
    from scipy import ndimage

    etykiety, ile = ndimage.label(m, structure=np.ones((3, 3), dtype=int))
    out = []
    for i in range(1, ile + 1):
        ys, xs = np.where(etykiety == i)
        if len(ys) >= min_pikseli:
            out.append((ys, xs))
    out.sort(key=lambda g: -len(g[0]))
    return out

STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading
with a fine paper-grain texture, warm friendly colours, thin soft outlines.
NOT flat vector, NOT 3D render."""

SCENY = {
    # in_out: the same lake meadow on the evening before the storm (the story says "a storm is coming", then it rains)
    "laka_burza": {
        "z": "laka",
        "plyta": f"""Exactly the same lake meadow, the same willow on the left, the same lake, shore, hills and trees in
the same places, but in the EVENING BEFORE A STORM: a heavy dark blue-grey sky with big storm clouds rolling in over the
hills, a last warm orange glow low on the horizon, the lake dark and rippled by the wind, the willow's branches blown
to one side, the grass a deeper evening green. Dim, moody, but still clear and readable for a small child. The lower
middle stays EMPTY flat grass where characters will stand.
{STYL}
Do NOT move, add or remove anything. NO tufts, NO flowers, NO birds, NO lightning, NO rain, NO people, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two things have been added, in the
same style:
  - FIVE or SIX dark grey storm clouds with lighter edges drifting across the sky, big and small, none touching each other;
  - MANY tufts of taller evening-green grass bent by the wind and a few clumps of reeds at the water's edge - at least
    fifteen tufts scattered over the foreground and the middle ground, each tuft separate from the others.
Same colours, same horizon, same lake, same willow, same texture - only the clouds and the tufts are new. Do NOT move or
redraw anything that was already there. Do NOT add boats, animals, birds or anything else.""",
    },
    # noticing_order: the henhouse yard behind Fox's garden, where the chick hatches (the end of the story)
    "kurnik": {
        "plyta": f"""A background illustration for a children's game: a sunny little farmyard at the edge of a friendly
forest, behind a garden. On the LEFT a small cosy wooden henhouse painted warm red with a white-framed little window, a
small round door and a short wooden ramp with slats leading up to it; a little heap of golden straw by the ramp. Along
the back a low woven wicker fence with a few sunflowers, behind it green bushes and the trees of the forest, a blue sky.
On the far right a wooden water trough and a small sack of grain. The ground in the lower part of the picture is EMPTY
and open - packed earth with a little scattered straw - where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
NO chickens, NO hens, NO birds, NO eggs, NO nests in the open, NO characters, NO animals, NO people, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass along the fence, by the henhouse and at the edges of the yard, and six or
seven soft white clouds in the blue sky, none touching each other.
Same colours, same henhouse, same fence, same trough. Do NOT move or redraw anything that was already there.""",
    },
    # bigger_smaller home: inside Squirrel's new hollow (the housewarming) - a big shelf and a small one for the store
    "dziupla_wnetrze": {
        "wnetrze": True,
        "plyta": f"""A background illustration for a children's game: the inside of a squirrel's cosy little round home in
the hollow of a big oak tree, seen straight on: curved walls of warm pale honey-coloured wood with soft tree-ring
patterns, a round window in the middle of the back wall with green oak leaves and blue sky outside, a few dry oak
leaves and a small garland of acorns hanging on the wall, a soft green moss carpet on the wooden floor. On the back
wall LEFT of the window one BIG long wide wooden shelf, sturdy and tall, completely EMPTY. On the back wall RIGHT of the
window one SMALL short little wooden shelf, only about a third as long as the big one, completely EMPTY. Both shelves
hang at the same height, their boards just ABOVE THE MIDDLE of the picture (about 45 percent of the way down from the
top), with a lot of empty wall ABOVE them; both well inside the picture, far from its edges: the big shelf spans from
about a fifth to almost half of the picture's width, the small shelf sits close to the right of the window. The floor in the lower middle is EMPTY where characters will stand.
{STYL}
Wide landscape composition.
NO furniture on the floor, NO table, NO chairs, NO jars, NO cups, NO characters, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that one thing has been added, in the same
style: a few green oak leaves on a twig swaying outside the round window.
Same colours, same walls, same shelves. Do NOT move or redraw anything that was already there.""",
    },
    "sad": {
        "plyta": f"""A background illustration for a children's game: a sunny meadow at the
edge of an orchard. On the left one big round apple tree with a thick trunk and
a dense green crown WITHOUT apples. Gentle green hills along the horizon, a
small round pond on the far right, two bushes. The lower middle is EMPTY grass
where characters will stand, with a checked picnic blanket lying flat on the
grass slightly left of centre.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO stones.
NO fruit anywhere. NO characters, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - SIX or SEVEN soft white cartoon clouds spread across the whole sky, big
    and small, none touching each other;
  - MANY tufts of taller grass standing up from the ground - at least fifteen,
    scattered over the foreground and the middle ground, left, centre and
    right, each tuft separate from the others.
Same colours, same horizon, same tree, same pond, same blanket, same texture -
only the clouds and the tufts are new. Do NOT move or redraw anything that was
already there. Do NOT add fruit, animals, birds or anything else.""",
    },
    "dom": {
        "wnetrze": True,
        "plyta": f"""A background illustration for a children's game: the inside of a cosy,
bright kitchen and dining room seen straight on. A big wooden table in the
lower middle with its top COMPLETELY EMPTY, floor space in front of it where
characters will stand. On the back wall: one large window with plain sky, two
EMPTY wooden wall shelves (lessons put things there), a wall clock, pale patterned wallpaper. A fridge on one
side, a cupboard on the other. Warm wooden floor.
{STYL}
Wide landscape composition.
NO plants. NO curtains. NO steam. NO people, NO animals, NO food, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - a leafy green houseplant in a pot standing on the floor next to the window;
  - a few small soft clouds visible through the window, in the sky part only.
Same colours, same furniture, same empty table, same texture - only the plant
and the clouds are new. Do NOT move or redraw anything that was already there.
Do NOT add anything else.""",
    },
    "laka": {
        "plyta": f"""A background illustration for a children's game: a sunny meadow on the
shore of a small calm lake. The lake takes the right third of the picture, with a
gentle sandy edge; low green hills and a line of trees on the far shore; one
leaning willow tree on the left. The lower middle is EMPTY flat grass where
characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO reeds, NO stones.
NO boats, NO characters, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - SIX or SEVEN soft white cartoon clouds spread across the whole sky, big
    and small, none touching each other;
  - MANY tufts of taller grass and a few clumps of reeds at the water's edge -
    at least fifteen tufts scattered over the foreground and the middle ground,
    each tuft separate from the others.
Same colours, same horizon, same lake, same willow, same texture - only the
clouds and the tufts are new. Do NOT move or redraw anything that was already
there. Do NOT add boats, animals, birds or anything else.""",
    },
    "pokoj": {
        "wnetrze": True,
        "plyta": f"""A background illustration for a children's game: a bright, tidy
children's bedroom seen straight on. A low bed with a plain blanket on the left,
a wooden toy shelf on the right with a few closed boxes, one big window on the
back wall with plain sky, pale striped wallpaper, a round rug in the middle of a
warm wooden floor. The floor in the lower middle is EMPTY where characters will
stand.
{STYL}
Wide landscape composition.
NO toys lying around, NO plants, NO curtains, NO people, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - a paper mobile with three small stars hanging from the ceiling near the window;
  - a few small soft clouds visible through the window, in the sky part only.
Same colours, same furniture, same rug, same texture - only the mobile and the
clouds are new. Do NOT move or redraw anything that was already there.
Do NOT add anything else.""",
    },
    # the same room at night (a sleepover): the day plate EDITED, so bed, shelf and rug stay where they are
    "pokoj_noc": {
        "wnetrze": True,
        "z": "pokoj",
        "plyta": f"""Exactly the same children's bedroom, the same furniture in the same places, the same
bed, shelf, boxes, window, rug, floor and wallpaper, but LATE AT NIGHT: through the window a deep
dark-blue night sky with a small crescent moon and a few tiny stars, cool soft moonlight falling
through the window onto the rug, the room dim and bluish, and a warm golden glow of a small
night lamp standing on the floor beside the bed lighting the bed and the floor around it.
{STYL}
Do NOT move, add or remove any furniture except the small night lamp.
NO toys lying around, NO people, NO animals, NO text.""",
        # no movers: a second pass redrew the window frame and the pictures, and they swung with the mobile; the
        # night lives in the lamp's breathing glow instead (plate pixels of the lampshade)
        "ruch": None,
        "poswiaty": [{"x": 448, "y": 495, "r": 380, "kolor": "#ffbf5e", "moc": 0.8}],
    },
    # one_many: the morning after the first snow - the same vegetable garden, white; the story ends here
    "ogrod_zima": {
        "z": "ogrod",
        "plyta": f"""Exactly the same vegetable garden, the same raised beds, fence, gate, trees and path in the same
places, but the MORNING AFTER THE FIRST SNOW: a soft even layer of fresh white snow on the beds, the fence posts, the
tree branches and the ground, little snow caps on everything, a pale blue winter sky, the trees bare. The lower
middle path stays a flat EMPTY snowy space where characters will stand.
{STYL}
Do NOT move, add or remove anything. The SKY IS EMPTY - NO clouds, NO birds, NO sun. NO people, NO animals, NO text.""",
        "ruch": None,
    },
    # Mole's home under the meadow (morning and night): a cosy burrow, roots from the ceiling, a round way up to the light
    "nora": {
        "wnetrze": True,
        "plyta": f"""A background illustration for a children's game: a cosy underground burrow of a mole seen straight on, a
wide round cave of warm brown earth, tree roots hanging from the earthen ceiling, a small round tunnel opening high
on the right going up to a little circle of daylight, a little bed made of moss on the left, a wooden shelf with jars,
a soft rug on the floor. The floor in the lower middle is EMPTY where characters will stand.
{STYL}
Wide landscape composition.
NO characters, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that one thing has been added, in the same
style: a few small glowing mushrooms near the moss bed.
Same colours, same roots, same shelf, same tunnel. Do NOT move or redraw anything that was already there.""",
    },
    # Beaver's workshop by the brook (what goes with what): a cosy wooden hut full of shelves and tools
    "warsztat": {
        "wnetrze": True,
        "plyta": f"""A background illustration for a children's game: the inside of a cosy wooden workshop of a beaver by a
brook, seen straight on: log walls, a big workbench on the left, wooden shelves with jars and little boxes on the right,
a round window with the brook outside, a few tools hanging on the wall, wood shavings on the plank floor. The floor in
the lower middle is EMPTY where characters will stand.
{STYL}
Wide landscape composition.
NO characters, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that one thing has been added, in the same
style: a little potted plant on the windowsill.
Same colours, same walls, same shelves. Do NOT move or redraw anything that was already there.""",
    },
    "plac_zabaw": {
        "plyta": f"""A background illustration for a children's game: a sunny small playground
in a park. On the left a wooden sandbox with a low red-and-yellow slide behind it,
on the right a simple swing frame with two empty swings, a few round trees along
the back, a low hedge. The lower middle is EMPTY flat grass where characters will
stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO toys, NO balls.
NO characters, NO animals, NO people, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - SIX or SEVEN soft white cartoon clouds spread across the whole sky, big
    and small, none touching each other;
  - MANY tufts of taller grass standing up from the ground - at least fifteen,
    scattered over the foreground and the middle ground, each tuft separate.
Same colours, same horizon, same sandbox, same swings, same texture - only the
clouds and the tufts are new. Do NOT move or redraw anything that was already
there. Do NOT add toys, animals, people or anything else.""",
    },
    "las": {
        "plyta": f"""A background illustration for a children's game: a sunny clearing in a
friendly deciduous forest. Tall tree trunks with green crowns on both sides and
along the back, soft light between them, a fallen log on the far left, a few
round bushes. The lower middle is EMPTY flat grass where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY between the crowns IS EMPTY - NO clouds, NO birds, NO sun rays.
The GRASS IS PLAIN - NO tufts, NO flowers, NO mushrooms, NO stones.
NO characters, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - a few small soft white clouds in the sky visible between the tree crowns,
    none touching each other;
  - MANY tufts of taller grass and a few small ferns standing up from the ground -
    at least fifteen, scattered over the foreground and the middle ground, each
    separate from the others.
Same colours, same trees, same log, same texture - only the clouds and the tufts
are new. Do NOT move or redraw anything that was already there. Do NOT add
animals, mushrooms or anything else.""",
    },
    "ogrod": {
        "plyta": f"""A background illustration for a children's game: a sunny vegetable garden
behind a cottage. Low wooden raised beds with leafy green rows on the left and
right, a watering can on the far left, a wooden fence with a gate along the back,
a few fruit trees behind the fence. The lower middle is an EMPTY path of flat
grass and earth where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
NO vegetables lying on the ground, NO tools on the path, NO characters, NO
animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - SIX or SEVEN soft white cartoon clouds spread across the whole sky, big
    and small, none touching each other;
  - MANY tufts of taller grass standing up along the path and in front of the
    beds - at least fifteen, scattered over the foreground, each tuft separate.
Same colours, same beds, same fence, same texture - only the clouds and the tufts
are new. Do NOT move or redraw anything that was already there. Do NOT add
vegetables, animals or anything else.""",
    },
    "strumyk": {
        "plyta": f"""A background illustration for a children's game: a shallow clear brook
winding through a meadow, with a small arched wooden footbridge on the right.
Smooth round pebbles along the near bank, a few big mossy boulders on the left,
low green hills and a line of trees in the distance. The lower middle is EMPTY
flat grass on the near bank where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers. NO fish, NO characters, NO animals,
NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - SIX or SEVEN soft white cartoon clouds spread across the whole sky, big
    and small, none touching each other;
  - MANY tufts of taller grass and a few reeds at the water's edge - at least
    fifteen, scattered over the foreground and the banks, each separate.
Same colours, same brook, same bridge, same boulders, same texture - only the
clouds and the tufts are new. Do NOT move or redraw anything that was already
there. Do NOT add fish, animals or anything else.""",
    },
    "przedpokoj": {
        "wnetrze": True,
        "plyta": f"""A background illustration for a children's game: a cosy home hallway
seen straight on. A low wooden shoe rack on the left with its shelves EMPTY, a
row of coat hooks on the back wall with nothing on them, a small round window
with plain sky, a door on the right, warm wooden floor with a small doormat. The
floor in the lower middle is EMPTY where characters will stand.
{STYL}
Wide landscape composition.
NO shoes, NO coats, NO plants, NO people, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - a leafy green houseplant in a pot standing on the floor next to the door;
  - a few small soft clouds visible through the round window, in the sky part only.
Same colours, same furniture, same floor, same texture - only the plant and the
clouds are new. Do NOT move or redraw anything that was already there.
Do NOT add anything else.""",
    },
}

# stage 4: Mole's little forest railway (numbers 1 to 5) and Owl's shadow theatre (tangram)
SCENY["stacyjka"] = {
    "plyta": f"""A background illustration for a children's game: a tiny wooden railway station at the edge of a sunny
forest. On the left a small wooden station hut with a little roof and a round clock, a lantern on a post; along the
back a narrow railway track runs across the whole picture, and on it, on the RIGHT, a small friendly red toy-like steam
locomotive with a tall chimney and no wagons. Pine and birch trees behind, gentle hills. The lower middle is an EMPTY
grassy platform where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO stones.
NO characters, NO animals, NO people, NO text, NO numbers.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - SIX or SEVEN soft white cartoon clouds spread across the whole sky, big
    and small, none touching each other;
  - MANY tufts of taller grass standing up from the ground - at least fifteen,
    scattered over the foreground and the middle ground, left, centre and
    right, each tuft separate from the others.
Same colours, same horizon, same hut, same track, same locomotive, same texture - only the clouds and the tufts are
new. Do NOT move or redraw anything that was already there. Do NOT add animals or anything else.""",
}
SCENY["teatrzyk"] = {
    "wnetrze": True,
    "plyta": f"""A background illustration for a children's game: a cosy little shadow-puppet theatre in a forest
animal's living room in the evening. In the middle, high up, a big wooden frame with a plain WHITE cloth screen
stretched in it, softly glowing warm from a lamp behind it, little red curtains tied at its sides; the screen is EMPTY.
Below the screen a dark wooden floor; on the left and right a few small wooden stools and cushions for the audience,
a garland of little paper lanterns along the top. Dim, warm evening light.
The floor in the lower middle is EMPTY where characters will stand.
{STYL}
Wide landscape composition.
NO characters, NO animals, NO shadows on the screen, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that one thing has been added, in the same
style: a little potted plant standing on the floor near the right wall.
Same colours, same screen, same curtains, same lanterns. Do NOT move or redraw anything that was already there.""",
}

# stage 6: Bear's little forest bakery (counting to 5)
SCENY["piekarnia"] = {
    "wnetrze": True,
    "plyta": f"""A background illustration for a children's game: the inside of a cosy little forest bakery made of wood,
seen straight on: a big round brick bread oven glowing warm on the left, a long wooden counter across the back with a
few EMPTY baskets on it, wooden shelves with jars of flour and honey on the right, a little window with a striped
awning view of trees, warm morning light. The floor in the lower middle is EMPTY where characters will stand.
{STYL}
Wide landscape composition.
NO bread, NO cakes on display, NO characters, NO animals, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that one thing has been added, in the same
style: a little potted plant on the windowsill.
Same colours, same oven, same counter, same shelves. Do NOT move or redraw anything that was already there.""",
}

# tall and short: inside the treehouse - a cosy wooden room high in a tree, a round window with leaves outside
# ordering: the forest glade of the evening concert (the end of the story)
SCENY["polana_koncert"] = {
    "plyta": f"""A background illustration for a children's game: a round forest glade at early evening, warm golden sky
with the first star, tall trees around. In the upper middle, a little low wooden stage made of logs, with a garland of
small paper lanterns glowing warm yellow strung between two poles above it, and a few tree stumps in an arc in front
of it like seats. The grassy ground in the lower part of the picture is EMPTY and open where characters will stand.
{STYL}
Wide landscape composition.
NO characters, NO animals, NO instruments, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass across the ground, and three soft clouds in the evening sky.
Same colours, same stage, same lanterns. Do NOT move or redraw anything that was already there.""",
}

SCENY["podium_wyscigu"] = {
    "plyta": f"""A background illustration for a children's game: a festive sunny meadow at the edge of a forest, ready for
a prize-giving after a race. Across the back, between two tall wooden poles far apart, a garland of little colourful
triangular flags; flowering bushes at both sides, tall trees at the far edges, blue sky. The grassy ground in the
whole lower half of the picture is EMPTY and open: the winners' podium and the characters will stand there.
{STYL}
Wide landscape composition.
NO podium, NO stage, NO characters, NO animals, NO medals, NO numbers, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass across the ground, and six or seven soft white clouds in the blue sky.
Same colours, same podium, same flags. Do NOT move or redraw anything that was already there.""",
}

SCENY["ogrod_labirynt"] = {
    "plyta": f"""A background illustration for a children's game: a sunny park garden with a hedge maze. Across the upper
middle of the picture runs the outer wall of a big hedge maze made of tall neatly trimmed green hedges, with one arched
opening in the hedge in the middle leading inside, where more hedges are seen. A small wooden bench at the left side,
round flower beds with red and yellow flowers, a sandy path leading to the maze opening. Blue sky and round trees above
the hedges. The grass in the lower part of the picture is EMPTY and open where characters will stand.
{STYL}
Wide landscape composition.
NO characters, NO animals, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass across the lawn, and six or seven soft white clouds in the blue sky.
Same colours, same hedges, same bench. Do NOT move or redraw anything that was already there.""",
}

SCENY["domek_wnetrze"] = {
    "wnetrze": True,
    "plyta": f"""A background illustration for a children's game: the inside of a cosy little wooden treehouse, seen
straight on: walls of rough planks, a big round window on the right with green leaves and a branch outside and blue
sky, a few old drawings pinned to the wall, a small rug, a low shelf with pine cones on the left. On the wall high in
the middle a row of little wooden pegs, EMPTY. The floor in the lower middle is EMPTY where characters will stand.
{STYL}
Wide landscape composition.
NO characters, NO animals, NO chest, NO key, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that one thing has been added, in the same
style: a few green leaves swaying outside the round window.
Same colours, same walls, same pegs. Do NOT move or redraw anything that was already there.""",
}

# grouping: inside Fox's home in the big oak (the end of the story) - everything he loves is red
SCENY["lisia_nora"] = {
    "wnetrze": True,
    "plyta": f"""A background illustration for a children's game: the inside of a cosy little home in the hollow of a big
old oak tree, seen straight on: curved walls of warm golden wood with tree rings, roots on the left wall, a small round
window high on the right with orange autumn leaves outside, red checked curtains at the window, a small red armchair
with a red cushion on the far left, a low wooden shelf on the right with a few red cups, a red round rug on the wooden
floor, a little lantern glowing warm. Many things are red. The floor in the lower middle is EMPTY where characters
will stand.
{STYL}
Wide landscape composition.
NO characters, NO animals, NO hats, NO scarves, NO clothes, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that one thing has been added, in the same
style: a little potted plant on the windowsill.
Same colours, same walls, same curtains, same armchair. Do NOT move or redraw anything that was already there.""",
}

# inside and outside: Hedgehog's warm burrow while the storm rages outside (the end of the story)
SCENY["norka_burza"] = {
    "wnetrze": True,
    "plyta": f"""A background illustration for a children's game: the inside of a hedgehog's cosy little burrow under a
meadow, seen straight on: a round room of warm brown earth with roots on the ceiling, a small glowing stove with a
kettle on the left, a soft leaf bed, a shelf with apples and mushrooms. In the wall on the right a big round window
with a wooden frame: OUTSIDE it a dark stormy evening, heavy rain falling, grey clouds and bent wet grass. Inside
everything is warm, dry and golden. The floor in the lower middle is EMPTY where characters will stand.
{STYL}
Wide landscape composition.
NO characters, NO animals, NO text.""",
    "ruch": None,
}

# morning and night: the old oak at night where the little hedgehog lives (the end of the story)
SCENY["dab_noc"] = {
    "plyta": f"""A background illustration for a children's game: a small forest glade at night under a big old oak, deep
blue night sky with a bright crescent moon and many stars, dark trees around. Between the oak's big roots on the left
a little round wooden door with a tiny round window glowing warm yellow - a hedgehog's home. Soft moonlight on the
grass. The grassy ground in the lower part of the picture is EMPTY and open where characters will stand. A clear night
picture, dark but readable, not black.
{STYL}
Wide landscape composition.
NO characters, NO animals, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass across the ground, and three thin soft clouds in the night sky.
Same colours, same oak, same door, same moon. Do NOT move or redraw anything that was already there.""",
}

# long_short: the picnic glade at the end of the short path (the end of the story)
SCENY["polana_piknik"] = {
    "plyta": f"""A background illustration for a children's game: a sunny little glade at the edge of a birch wood, ready
for a picnic. In the middle distance a red-and-white checked picnic blanket lies spread on the grass with a wicker
picnic basket on one corner and a small jug of juice beside it; a big shady oak at the left edge, flowering bushes and
white birches at the back and at the right, a blue sky. The grass in the lower part of the picture is EMPTY and open
where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
NO characters, NO animals, NO food out of the basket, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass across the ground, and six or seven soft white clouds in the blue sky.
Same colours, same blanket, same basket, same trees. Do NOT move or redraw anything that was already there.""",
}

# spot_difference: Granny Owl's old oak, where the drawing is taken (the end of the story); by day she sleeps
SCENY["dab_babci"] = {
    "plyta": f"""A background illustration for a children's game: a sunny clearing in a friendly forest with a huge old
oak tree on the left side of the picture. High in the oak's trunk a round hollow with a little round wooden door,
closed, with a tiny curtained window and a small wooden plaque with a painted moon above it - the home of an old owl;
a little wooden ladder of branches leads up the trunk. Under the oak a round bed of colourful flowers - red, yellow,
purple - and a few round bushes. Tall trees at the back and at the right, blue sky. The grass in the lower middle and
the lower right is EMPTY and open where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
NO characters, NO animals, NO birds, NO butterflies, NO letters on the plaque, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass across the ground, and six or seven soft white clouds in the blue sky.
Same colours, same oak, same door, same flowers. Do NOT move or redraw anything that was already there.""",
}

# bigger_smaller: Squirrel's new home - the tree with the just-right hollow (the end of the story)
SCENY["dab_wiewiorki"] = {
    "plyta": f"""A background illustration for a children's game: a sunny corner of a friendly deciduous forest in early
autumn. In the middle of the picture, a little to the right, stands a big old oak tree with a thick trunk and a wide
crown full of green and golden leaves and acorns. In the trunk, about halfway up, ONE round tree hollow, dark inside,
with a smooth rim of bark - a squirrel's cosy new home; a short branch sticks out under it like a little doorstep. A
small heap of acorns lies between the oak's roots. Other trees at both edges, a few round bushes, blue sky with soft
light. The grass in the lower left and the lower middle is EMPTY and open where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
NO characters, NO animals, NO squirrels, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass and a few small ferns across the ground, and a few small soft white clouds
in the sky between the tree crowns.
Same colours, same oak, same hollow, same acorns. Do NOT move or redraw anything that was already there.""",
}

# adding to 10: the square of the hopscotch tournament (the end of the story) - the stones are drawn by the game
SCENY["turniej_klasy"] = {
    "plyta": f"""A background illustration for a children's game: a festive sunny little square in a park, ready for a
hopscotch tournament. Across the back, between two tall wooden poles far apart, a garland of little colourful triangular
flags; behind it a low striped red-and-white tent on the left, two wooden benches at the sides, round flowering bushes,
round trees and a blue sky. The whole lower half of the picture is an EMPTY, open, smooth, light sandy-beige paved ground
of big soft flagstones, where the stones of the game and the characters will stand.
{STYL}
Wide landscape composition.
NO chalk drawings, NO hopscotch squares, NO stones, NO numbers, NO characters, NO animals, NO people, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: six or seven soft white clouds in the blue sky, and at least fifteen tufts of grass along the edges of the
bushes and the flower beds (NOT on the paved ground).
Same colours, same flags, same tent, same benches. Do NOT move or redraw anything that was already there.""",
}

# counting to 3: the raspberry thicket in the forest where Bear picks three raspberries for the cake (the end of the story)
SCENY["malinowy_zagajnik"] = {
    "plyta": f"""A background illustration for a children's game: a sunny little clearing deep in a friendly forest, full of
raspberry canes. Tall tree trunks with green crowns at both sides and along the back, soft golden light between them.
Across the middle of the picture, from the left edge to the right edge, a long low thicket of raspberry bushes, about as
high as a small child, with many small ripe red raspberries among their green leaves; a little wicker basket and a
wooden ladder left leaning on a tree at the far right. The grassy ground in the lower part of the picture is EMPTY and
open where characters will stand. The sky between the crowns is light blue.
{STYL}
Wide landscape composition, the bushes in the middle distance.
NO characters, NO animals, NO people, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass and a few small ferns across the ground in front of the bushes, and a few
small soft white clouds in the sky between the tree crowns, none touching each other.
Same colours, same trees, same raspberry bushes, same basket. Do NOT move or redraw anything that was already there.""",
}

# numbers_1_5: the lakeside stop where Mole's train ends its journey (the end of the story)
SCENY["stacja_jezioro"] = {
    "plyta": f"""A background illustration for a children's game: a tiny wooden railway stop on the shore of a calm blue
forest lake on a sunny day. Along the back of the picture a narrow railway track runs across the whole width, and on it,
on the LEFT, the same small friendly red toy-like steam locomotive with a tall black chimney and no wagons, standing
still. Behind the track the lake glitters, with a little wooden pier reaching into the water on the right, a few water
lilies, reeds at the shore, pine trees and soft hills on the far shore. A small wooden shelter with a bench at the far
right edge. The lower part of the picture is an EMPTY grassy lakeside platform where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO stones.
NO boats, NO characters, NO animals, NO people, NO text, NO numbers.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass across the platform's grass and a few reeds at the water's edge, each
separate, and six or seven soft white clouds in the blue sky, none touching each other.
Same colours, same lake, same locomotive, same pier. Do NOT move or redraw anything that was already there. Do NOT add
boats, animals, birds or anything else.""",
}

# numbers_6_10: Beaver's dam on the brook with the hole the ten logs mend (the end of the story)
SCENY["tama_bobra"] = {
    "plyta": f"""A background illustration for a children's game: a forest brook in a sunny clearing, seen from its near
bank. In the middle distance, just below the horizon, Beaver's dam stretches across the whole brook from the left bank
to the right bank: a long low wall of stacked brown logs and sticks lying sideways. In the MIDDLE of the dam a wide gap
is missing from the top, about one fifth of the picture's width, and there the water pours through in a little foamy
waterfall into the brook in front. Behind the dam a calm wide pond reflecting the trees; on the right bank a round
beaver lodge, a dome of sticks and mud; birches and pines around, soft hills. The near bank in the lower part of the
picture is EMPTY flat grass where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO stones.
NO characters, NO animals, NO loose logs on the grass, NO text.""",
    "ruch": """Exactly the same illustration, unchanged in every way, except that some things have been added, in the
same style: at least fifteen tufts of grass across the near bank and a few reeds at the water's edge, each separate,
and six or seven soft white clouds in the blue sky, none touching each other.
Same colours, same dam, same gap, same waterfall, same lodge. Do NOT move or redraw anything that was already there.
Do NOT add logs, animals, birds or anything else.""",
}


def gen(nazwa: str, jakosc: str = "high") -> None:
    kat = KORZEN / nazwa
    kat.mkdir(parents=True, exist_ok=True)
    plyta = kat / "plyta.png"
    if not plyta.exists():
        print("plyta...", flush=True)
        z = SCENY[nazwa].get("z")                   # a variant of another scene: an edit of its plate
        figgen.generate(SCENY[nazwa]["plyta"], plyta, refs=[KORZEN / z / "plyta.png"] if z else None, size="1536x1024",
                        quality=jakosc, background="opaque")
    ruch = kat / "ruch.png"
    if SCENY[nazwa]["ruch"] and not ruch.exists():
        print("ruch...", flush=True)
        figgen.generate(SCENY[nazwa]["ruch"], ruch, refs=[plyta], size="1536x1024",
                        quality=jakosc, background="opaque")


# ---- the difference split: tuning knobs (see split)
ROZMYCIE = 1.2          # sigma (px) of the blur both passes get before the difference: paper grain and brush jitter are no change
PROG = 40               # a strong difference (max channel, 0-255)
# a weak difference counts within ZASIEG px of a strong one; indoors the movers are solid things (a pot the
# colour of the floor) whose notches are closed and holes filled; outdoors they are tufts and reeds whose gaps
# show the plate anyway - filled, the gaps would carry water and stones along when the tuft sways
WNETRZE = {"slaby": 14, "zasieg": 8, "domkniecie": 9, "dziury": True}
PLENER = {"slaby": 24, "zasieg": 4, "domkniecie": 3, "dziury": False}
NOWY = 80               # ... only for a mover that is new in the second pass (median difference; kitchen plant 122,
                        # mobile and stars 88+), not one the plate already has and the model nudged (hallway plant)
TAPETA = 45             # indoors, above a mover's foot: a pixel this close to the plate is wallpaper the model
                        # redrew a little (measured 18-41 around the kitchen plant; its leaves differ by 68+)
RDZEN = 2               # opening radius that finds a mover's core; thin bridges to redrawn plate have none
CHMURA_JASNOSC = 170    # cloud pixels: bright ...
CHMURA_NASYCENIE = 0.30 # ... and unsaturated (sky is blue, leaves are green or yellow)
CHMURA_BRZEG = 3        # px of soft rim kept around a cloud's body


def _kolo(r: int) -> np.ndarray:
    y, x = np.mgrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def _maska_roznicy(plyta: np.ndarray, ruch: np.ndarray, k: dict) -> np.ndarray:
    from scipy import ndimage
    rozm = lambda im: np.stack([ndimage.gaussian_filter(im[:, :, c].astype(float), ROZMYCIE) for c in range(3)], axis=2)
    roznica = np.abs(rozm(ruch) - rozm(plyta)).max(axis=2)
    mocna = roznica > PROG
    # hysteresis: a weak difference counts next to a strong one
    m = mocna | ((roznica > k["slaby"]) & ndimage.binary_dilation(mocna, structure=_kolo(1), iterations=k["zasieg"]))
    m = ndimage.binary_closing(m, structure=np.ones((k["domkniecie"], k["domkniecie"])), iterations=2 if k["dziury"] else 1)
    if k["dziury"]:
        m = ndimage.binary_fill_holes(m)
    return m


def _rozdziel(m: np.ndarray) -> np.ndarray:
    """Labels: every pixel of the mask joins the component of its nearest CORE (the mask opened by RDZEN).
    Two movers touching by a thin bridge (a cloud and a redrawn crown) become two components; thin blades
    of grass keep their tuft, because the mask itself is never eroded."""
    from scipy import ndimage
    rdzen = ndimage.binary_opening(m, structure=_kolo(RDZEN))
    etyk, ile = ndimage.label(rdzen, structure=np.ones((3, 3), dtype=int))
    if not ile:
        return ndimage.label(m, structure=np.ones((3, 3), dtype=int))[0]
    _, (iy, ix) = ndimage.distance_transform_edt(etyk == 0, return_indices=True)
    out = np.where(m, etyk[iy, ix], 0)
    # a pixel that joined a core it does not touch through the mask (an island) becomes its own component
    final = np.zeros_like(out)
    n = 0
    for i in range(1, ile + 1):
        czesci, k = ndimage.label(out == i, structure=np.ones((3, 3), dtype=int))
        for j in range(1, k + 1):
            n += 1
            final[czesci == j] = n
    return final


def _chmura(ruch: np.ndarray, ys: np.ndarray, xs: np.ndarray):
    """A cloud component keeps only its bright unsaturated body (its largest part, plus parts at least a
    fifth of it) and a soft rim of CHMURA_BRZEG px - leaves or a roof stuck to it fall off."""
    from scipy import ndimage
    y0, x0 = ys.min(), xs.min()
    h, w = ys.max() - y0 + 1, xs.max() - x0 + 1
    skl = np.zeros((h, w), bool); skl[ys - y0, xs - x0] = True
    px = ruch[y0:y0 + h, x0:x0 + w].astype(int)
    jas = px.mean(axis=2); nas = (px.max(axis=2) - px.min(axis=2)) / np.maximum(px.max(axis=2), 1)
    cialo = skl & (jas >= CHMURA_JASNOSC) & (nas <= CHMURA_NASYCENIE)
    etyk, ile = ndimage.label(cialo, structure=np.ones((3, 3), dtype=int))
    if not ile:
        return ys, xs
    rozm = ndimage.sum(cialo, etyk, range(1, ile + 1))
    cialo = np.isin(etyk, 1 + np.where(rozm >= 0.2 * rozm.max())[0])
    cialo = ndimage.binary_fill_holes(ndimage.binary_closing(cialo, structure=_kolo(2)))
    # the rim only where it is sky or cloud (bluish or white): a willow leaf touching the cloud is green or yellow
    niebo = px[:, :, 2] >= px[:, :, 1] - 5
    nowa = skl & (cialo | (niebo & ndimage.binary_dilation(cialo, structure=_kolo(1), iterations=CHMURA_BRZEG)))
    yy, xx = np.nonzero(nowa)
    return yy + y0, xx + x0


def _bez_wody(ruch: np.ndarray, ys: np.ndarray, xs: np.ndarray):
    """An outdoor tuft keeps no water or sky: reeds drawn over a lake come with the redrawn ripples between their
    blades, which would sway along. Light blue or teal pixels go (a purple flower has red in it, a reed blade is dark),
    then specks smaller than a twentieth of what is left."""
    from scipy import ndimage
    px = ruch[ys, xs].astype(int)
    # water and sky: blue over red, blue at least about green (pale teal water too), and light - a teal reed blade is dark
    woda = (px[:, 2] > px[:, 0] + 25) & (px[:, 2] > px[:, 1] - 10) & (px[:, 0] > 105)
    ys, xs = ys[~woda], xs[~woda]
    if not len(ys):
        return ys, xs
    y0, x0 = ys.min(), xs.min()
    pole = np.zeros((ys.max() - y0 + 1, xs.max() - x0 + 1), bool); pole[ys - y0, xs - x0] = True
    etyk, ile = ndimage.label(pole, structure=np.ones((3, 3), dtype=int))
    rozm = ndimage.sum(pole, etyk, range(1, ile + 1))
    pole = np.isin(etyk, 1 + np.where(rozm >= max(40, 0.05 * rozm.max()))[0])
    yy, xx = np.nonzero(pole)
    return yy + y0, xx + x0


def _bez_tla_u_gory(plyta: np.ndarray, ruch: np.ndarray, ys: np.ndarray, xs: np.ndarray):
    """An indoor mover is closed and filled for its solid foot (a pot the colour of the floor), but its upper part
    sways: there the filling would carry the wallpaper between the leaves along. Above the lower third, pixels the
    two passes nearly agree on (TAPETA) go - the plate shows the same wallpaper there and it stays put."""
    from scipy import ndimage
    y0, x0 = ys.min(), xs.min(); h, w = ys.max() - y0 + 1, xs.max() - x0 + 1
    a = ndimage.gaussian_filter(plyta[y0:y0 + h, x0:x0 + w].astype(float), (ROZMYCIE, ROZMYCIE, 0))
    b = ndimage.gaussian_filter(ruch[y0:y0 + h, x0:x0 + w].astype(float), (ROZMYCIE, ROZMYCIE, 0))
    roz = np.abs(b - a).max(axis=2)[ys - y0, xs - x0]
    if np.median(roz) < NOWY:                # the thing is already in the plate (a plant the model only nudged): its
        return ys, xs                        # leaves agree with the plate too and must not be cut away
    zgodne = roz < TAPETA
    gora = (ys - y0) < 0.65 * h
    keep = ~(zgodne & gora)
    ys, xs = ys[keep], xs[keep]
    pole = np.zeros((h, w), bool); pole[ys - y0, xs - x0] = True
    etyk, ile = ndimage.label(pole, structure=np.ones((3, 3), dtype=int))
    if ile:
        rozm = ndimage.sum(pole, etyk, range(1, ile + 1))
        pole = np.isin(etyk, 1 + np.where(rozm >= max(40, 0.05 * rozm.max()))[0])
    yy, xx = np.nonzero(pole)
    return yy + y0, xx + x0


def _jasnosc_nasycenie(px: np.ndarray):
    px = px.astype(int)
    return px.mean(), ((px.max(axis=1) - px.min(axis=1)) / np.maximum(px.max(axis=1), 1)).mean()


def split(nazwa: str, min_pikseli: int = 500) -> dict:
    kat = KORZEN / nazwa
    if not SCENY[nazwa]["ruch"]:                    # a still plate, only glows
        W, H = Image.open(kat / "plyta.png").size
        opis = {"plyta": "plyta.png", "szerokosc": W, "wysokosc": H, "horyzont": _horyzont(np.asarray(Image.open(kat / "plyta.png").convert("RGB"))),
                "rekwizyty": [], "poswiaty": SCENY[nazwa].get("poswiaty", [])}
        (kat / "rekwizyty.json").write_text(json.dumps(opis, indent=1), encoding="utf-8")
        return opis
    plyta_img = Image.open(kat / "plyta.png").convert("RGB")
    plyta = np.asarray(plyta_img)
    ruch_img = Image.open(kat / "ruch.png").convert("RGB").resize(plyta_img.size, Image.LANCZOS)
    ruch = np.asarray(ruch_img)

    m = _maska_roznicy(plyta, ruch, WNETRZE if SCENY[nazwa].get("wnetrze") else PLENER)
    etyk = _rozdziel(m)
    grupy = []
    for i in range(1, int(etyk.max()) + 1):
        ys, xs = np.nonzero(etyk == i)
        if len(ys) >= min_pikseli:
            grupy.append((ys, xs))
    grupy.sort(key=lambda g: -len(g[0]))
    hor = _horyzont(plyta)
    print(f"roznica: {m.mean()*100:.1f}% kadru, {len(grupy)} elementow, horyzont y={hor}")
    for stary in kat.glob("rekwizyt_*.png"):
        stary.unlink()

    rekwizyty = []
    H, W = plyta.shape[:2]
    for ys, xs in grupy:
        # a cloud is bright and unsaturated and drifts; everything else sways (grass, a plant, a mobile)
        jasnosc, nasycenie = _jasnosc_nasycenie(ruch[ys, xs])
        wys0 = ys.max() - ys.min() + 1
        chmura = jasnosc >= 185 and nasycenie <= 0.28 and wys0 < 0.3 * H
        if chmura:
            ys, xs = _chmura(ruch, ys, xs)
        elif not SCENY[nazwa].get("wnetrze"):
            ys, xs = _bez_wody(ruch, ys, xs)
        else:
            ys, xs = _bez_tla_u_gory(plyta, ruch, ys, xs)
        if len(ys) < min_pikseli:
            continue
        y0, y1 = int(ys.min()), int(ys.max()) + 1
        x0, x1 = int(xs.min()), int(xs.max()) + 1
        szer, wys = x1 - x0, y1 - y0
        wydluzenie = max(szer, wys) / max(min(szer, wys), 1)
        wypelnienie = len(ys) / max(szer * wys, 1)
        if wydluzenie > 6 or wypelnienie < 0.12:
            continue
        # a huge component is the model redrawing part of the plate (a whole tree), not a mover
        if wys > 0.45 * H or len(ys) > 0.06 * H * W:
            print(f"  pominieto duza skladowa {szer}x{wys} ({len(ys)} px) - to przerysowane tlo, nie rekwizyt")
            continue
        srodek_y = (y0 + y1) / 2
        # outdoors, a dark saturated bit above the horizon is redraw noise (a piece of a swing frame, a crown)
        if not SCENY[nazwa].get("wnetrze") and srodek_y < hor and not chmura:
            print(f"  pominieto plamke nad horyzontem {szer}x{wys} (jasnosc {jasnosc:.0f}, nasycenie {nasycenie:.2f}) - nie chmura")
            continue
        i = len(rekwizyty)
        # alpha = the mask softened by under a pixel, so the edge is not jagged
        pole = np.zeros((wys, szer), dtype=np.uint8)
        pole[ys - y0, xs - x0] = 255
        alfa = Image.fromarray(pole).filter(ImageFilter.GaussianBlur(0.8))
        rgba = np.dstack([ruch[y0:y1, x0:x1], np.asarray(alfa)])
        plik = f"rekwizyt_{i:02d}.png"
        Image.fromarray(rgba, "RGBA").save(kat / plik)
        rekwizyty.append({"plik": plik, "klasa": "drift" if chmura else "sway", "x": x0, "y": y0, "w": szer, "h": wys,
                          "faza": round((i * 0.6180339887) % 1.0, 4)})
    opis = {"plyta": "plyta.png", "szerokosc": int(W), "wysokosc": int(H), "horyzont": hor, "rekwizyty": rekwizyty}
    if SCENY[nazwa].get("poswiaty"): opis["poswiaty"] = SCENY[nazwa]["poswiaty"]
    (kat / "rekwizyty.json").write_text(json.dumps(opis, indent=1), encoding="utf-8")
    print(f"rekwizytow: {len(rekwizyty)} "
          f"(sway {sum(r['klasa']=='sway' for r in rekwizyty)}, drift {sum(r['klasa']=='drift' for r in rekwizyty)})")
    return opis


def install(nazwa: str) -> None:
    import shutil
    src, dst = KORZEN / nazwa, GRA / nazwa
    dst.mkdir(parents=True, exist_ok=True)
    for stary in dst.glob("*"):
        stary.unlink()
    # WebP for the game: the plate opaque q80, props with exact alpha
    opis = json.loads((src / "rekwizyty.json").read_text(encoding="utf-8"))
    Image.open(src / opis["plyta"]).convert("RGB").save(dst / "plyta.webp", "WEBP", quality=80, method=6)
    opis["plyta"] = "plyta.webp"
    for r in opis["rekwizyty"]:
        Image.open(src / r["plik"]).convert("RGBA").save(dst / (r["plik"].rsplit(".", 1)[0] + ".webp"), "WEBP", quality=80, method=6, exact=True)
        r["plik"] = r["plik"].rsplit(".", 1)[0] + ".webp"
    (dst / "rekwizyty.json").write_text(json.dumps(opis, indent=1), encoding="utf-8")
    print(f"zainstalowano tlo {nazwa}: {len(list(dst.glob('*.webp')))} plikow")


if __name__ == "__main__":
    cmd, nazwa = sys.argv[1], sys.argv[2]
    if cmd in ("gen", "all"):
        gen(nazwa)
    if cmd in ("split", "all"):
        split(nazwa)
    if cmd in ("install", "all"):
        install(nazwa)
