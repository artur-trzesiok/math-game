"""Event illustrations (ilustracje.js, ctx.ilustracja): a full picture of what the puppets cannot act - a storm at night,
a train on a bridge, the parents applauding. It lands on the screen like a big stamp and the characters speak over it
from a round badge.

  python tools/ilustracje/make_ilustracja.py pociag_most        # -> game/assets/ilustracje/<name>/obraz.webp + meta.json
  python tools/ilustracje/make_ilustracja.py                    # every one that is not built yet

Cast and place come from REFERENCES (the characters' front references, a scenery plate), so the picture keeps the
game's style and characters. Delete work/<name>.png to redraw.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent / "work"
OUT = ROOT / "game" / "assets" / "ilustracje"
CHARACTERS = ROOT / "tools" / "characters" / "work"
BACKGROUNDS = ROOT / "tools" / "backgrounds" / "work"
STYL = ("STYLE: exactly the style of the reference images - a modern children's picture-book illustration, soft "
        "painterly shading with a fine paper-grain texture, warm friendly colours, thin soft outlines. NOT flat vector, "
        "NOT 3D render. A full-bleed picture with no border, NO text, NO letters, NO numbers, NO speech bubbles.")
POSTAC = {
    "lisek": "the FOX", "wiewiorka": "the SQUIRREL (three quarters of the fox's height)", "sowa": "the OWL",
    "sarenka": "the ROE DEER", "mis": "the BEAR (the tallest)", "jez": "the small HEDGEHOG", "kret": "the MOLE",
    "bobr": "the BEAVER", "zajac": "the BUNNY",
}
# name: {postacie: [who], tlo: scenery plate or None, scena: what happens, lekcje: [ids] (for the manager)}
ILUSTRACJE = {
    # shapes home: the payoff - tea at Hedgehog's new house built of shapes, the shape biscuits on four plates
    "herbatka_u_jeza": {
        "postacie": ["jez", "lisek", "sowa", "zajac"], "tlo": "laka", "lekcje": ["shapes"],
        "scena": """A cosy TEA PARTY on the meadow from the reference picture, late afternoon in golden autumn light. In the
middle stands the little HEDGEHOG's new HOUSE built of big flat shapes, exactly like a child's drawing: a big blue
SQUARE for the walls; a PLAIN yellow TRIANGLE roof on top with nothing on it; ON THE BLUE WALL, on the right, a round red
CIRCLE window; on the left of the same wall a green upright RECTANGLE door standing open. In front of it a small round
wooden table with four cups of tea and FOUR plates of golden biscuits: one plate of round biscuits, one of square
biscuits, one of triangle biscuits, one of rectangle biscuits. The little HEDGEHOG, the host, stands proudly at his open
door pouring tea from a teapot; the FOX, the OWL and the BUNNY sit round the table holding biscuits, laughing. A square
kite on a string is tied to the house and flies high in the sky. A few autumn leaves on the grass. Warm, happy, homely.""",
    },
    # ordering home: the payoff - the evening concert promised all lesson, at night on the glade
    "koncert_noc": {
        "postacie": ["bobr", "zajac", "sowa"], "tlo": "polana_koncert", "lekcje": ["ordering"],
        "scena": """The evening CONCERT at NIGHT on the forest glade from the reference picture: a deep blue sky full of stars
and a round moon, the string of paper lanterns over the little log stage glowing warm gold, fireflies in the air. On the
stage the BEAVER plays FOUR water glasses standing in a row on a little table, from the fullest (on the left) to the
emptiest (on the right), tapping them with a spoon, his eyes closed with joy; beside him the BUNNY beats a small drum;
the OWL stands in front and conducts with one wing. In front of the owl THREE little fluffy grey OWLETS stand in a row
from the smallest to the biggest, beaks open, singing. At the side of the stage a TOWER of four wooden blocks - a big red
one at the bottom, a yellow, a green and the smallest blue one on top - with a glowing glass jar lantern on the very top.
On the tree stumps in front small forest guests seen from behind (a hedgehog, a mole, a squirrel) listen happily. Warm,
magical and joyful.""",
    },
    # tall_short: Bear's wish kept - from the treehouse window the whole forest from above
    "las_z_domku": {
        "postacie": ["mis", "wiewiorka", "lisek"], "tlo": "domek_wnetrze", "lekcje": ["tall_short"],
        "scena": """The view from HIGH UP in a treehouse: in the foreground the big round wooden window of the treehouse from the
reference picture, and leaning out of it, seen from behind and a little from the side, the BEAR with his paws on the
sill, the FOX and the little SQUIRREL beside him, all three looking out and down in wonder. Below and far away the
WHOLE FOREST seen from above: soft green tree tops rolling to the hills, a winding brook glittering, a small orchard
with apple trees in a clearing right below, a meadow, birds flying BELOW the window. Bright summer morning, a wide
open sky. The feeling: we are so high up, we can see everything.""",
    },
    # tall_short home: the payoff - Hedgehog on Bear's shoulders sees the forest through the spyglass (higher, not taller)
    "jez_na_ramionach": {
        "postacie": ["mis", "jez", "lisek", "wiewiorka"], "tlo": "przedpokoj", "lekcje": ["tall_short"],
        "scena": """In the cosy hallway from the reference picture, by its big ROUND window: the BEAR stands tall and carries the
little HEDGEHOG on his shoulders; the HEDGEHOG, now high up by the round window, holds an old brass SPYGLASS to his
eye and looks out through the window at the green forest outside, delighted. The BEAR holds the hedgehog's little feet
and laughs. Below them the FOX and the SQUIRREL look up at them, laughing and clapping. On the wall beside them a
wooden HEIGHT CHART with four short coloured pencil marks at different heights. Warm afternoon light, happy and funny.""",
    },
    # long_short: the picnic at the end of the short path - the long baguette is enough for everybody
    "piknik_polana": {
        "postacie": ["sarenka", "lisek", "wiewiorka"], "tlo": "polana_piknik", "lekcje": ["long_short"],
        "scena": """A happy PICNIC on the sunny glade from the reference picture: the ROE DEER, the FOX and the SQUIRREL sit
together on the red-and-white checked blanket under the big oak, the wicker basket open beside them. The FOX holds up
ONE very LONG baguette of bread and is breaking it into pieces; the SQUIRREL already nibbles her piece, the DEER takes
hers; a jug of juice and three cups. The squirrel wears a long blue-and-white striped scarf. Behind them a narrow
footpath comes almost straight across the meadow to the blanket. Warm summer light, everybody smiling.""",
    },
    # long_short home: dinner in the kitchen - the longest and the shortest pasta from one pot
    "obiad_makaron": {
        "postacie": ["sarenka", "lisek", "wiewiorka"], "tlo": "dom", "lekcje": ["long_short"],
        "scena": """DINNER in the kitchen from the reference picture, evening light: the ROE DEER, the FOX and the SQUIRREL sit
at the wooden table round one big steaming pot of pasta. The FOX slurps ONE very LONG strand of spaghetti that goes from
his plate up to his mouth, his cheeks puffed, laughing; the little SQUIRREL holds up ONE tiny short elbow macaroni on her
fork, delighted; the DEER laughs at them. Plates, forks, a bowl of grated cheese. Cosy and funny.""",
    },
    # spot_difference home: the payoff - at night Granny Owl opens her little door and finds Owl's drawing waiting there
    "babcia_laurka": {
        "postacie": ["sowa"], "tlo": "dab_babci", "lekcje": ["spot_difference"],
        "scena": """NIGHT at the big old oak from the reference picture: a round full moon and stars, a deep blue sky, the
meadow silver in the moonlight. High in the trunk the little ROUND WOODEN DOOR stands open, warm golden candle light
shining out of it. In the doorway stands GRANNY OWL - an OLD owl drawn like the reference owl but with soft grey-white
feathers, small round spectacles on her beak and a knitted lilac shawl round her shoulders. With both wings she holds
up a child's crayon DRAWING (a sun with rays, a little house with a red roof, a tree and an orange kitten) and looks
at it, deeply touched and smiling, one wing on her heart. A little lantern hangs by the door. Calm, warm, magical.
Granny Owl is the ONLY animal in the picture: the reference owl only shows how owls are drawn - NO young owl, NO
other animal anywhere, the meadow under the oak is empty.""",
    },
    # bigger_smaller: the problem, big and funny - Squirrel has outgrown her old hollow, only her head goes in
    "wiewiorka_utknela": {
        "postacie": ["wiewiorka"], "tlo": "las", "lekcje": ["bigger_smaller"],
        "scena": """In the forest from the reference picture, a close view of a tree trunk with a SMALL round hollow in it. The
SQUIRREL has pushed only her HEAD into the little round hole; her whole body is stuck OUTSIDE: her plump body pressed
against the bark, her hind paws kicking in the air, her big fluffy tail sticking up, her front paws pushing on the
trunk. The hole is clearly much too small for her - her shoulders cannot go in. A few acorns and nuts fall around,
a leaf flutters. Funny, not scary: a comic moment, the trunk and the hole big in the picture.""",
    },
    # bigger_smaller home: the housewarming in Squirrel's new hollow - every cup, chair and jar its own size
    "parapetowka": {
        "postacie": ["wiewiorka", "lisek", "sowa"], "tlo": "dziupla_wnetrze", "lekcje": ["bigger_smaller"],
        "scena": """A cosy HOUSEWARMING party inside the squirrel's round hollow home from the reference picture: the SQUIRREL,
the FOX and the OWL sit round a small round wooden table, laughing and raising their cups. The OWL on the BIGGEST chair,
the FOX on a middle chair, the little SQUIRREL on the SMALLEST chair; a big cup for the fox, a small cup for the squirrel.
On the BIG shelf on the wall stands one BIG open cardboard box full of nuts and acorns, on the SMALL shelf one small
open cardboard box full of nuts. A plate of acorn
cookies on the table, a little garland of leaves, warm light, steam from the cups. A joyful party.""",
    },
    "pociag_most": {
        "postacie": ["kret", "mis", "sowa"], "tlo": "las", "lekcje": ["numbers_1_5"],
        "scena": """A little red steam train with FIVE small wooden wagons crosses a high wooden bridge over a forest valley,
seen from the side and a little from below, the whole train in the picture going from left to right. The MOLE drives the
engine, leaning out of the cab, waving his cap; a puff of white steam rises from the chimney. In the second wagon the
BEAR, in the fourth the OWL, both looking out happily over the valley. Far below a small river, autumn trees, a blue
sky with round clouds. A feeling of a joyful journey.""",
    },
    # one_many: the night the first snow falls - Squirrel's store is safe, the garden goes white
    "pierwszy_snieg": {
        "postacie": ["wiewiorka"], "tlo": "ogrod", "lekcje": ["one_many"],
        "scena": """NIGHT in the vegetable garden from the reference picture: the FIRST SNOW is falling in big soft flakes,
the beds and the fence turning white. At the round window of a hollow in a big tree at the side, the SQUIRREL looks out
in her pyjamas, holding a candle, amazed, her nose against the glass; inside behind her a little shelf full of nuts.
Dark blue sky, a warm glow from the window. Calm and magical.""",
    },
    # one_many home: the winter feast at Squirrel's table - one cake, many cherries, the friends, the ducklings visiting
    "uczta_zima": {
        "postacie": ["wiewiorka", "lisek", "sarenka"], "tlo": "dom", "lekcje": ["one_many"],
        "scena": """A cosy winter FEAST in the kitchen from the reference picture, snow outside the window: the SQUIRREL, the
FOX and the ROE DEER sit round the wooden table, laughing; in the middle ONE big apple cake on a plate and a bowl full
of many red cherries; one big orange pumpkin on the shelf; a little HEDGEHOG and a mother DUCK with her fluffy yellow
ducklings have come to visit and stand by the table. Warm light, steam from cups of tea.""",
    },
    "burza_noc": {
        "postacie": [], "tlo": "strumyk", "lekcje": ["logical_pairs"],
        "scena": """The brook from the reference picture at NIGHT in a big storm: dark blue sky with heavy clouds, one bright
zigzag of lightning lighting the scene, slanting rain. The strong wind blows things off a little wooden table by the
water and carries them through the air: a red cup, a saucer, a hammer, a paintbrush, a key, a small pot of paint -
each one clearly visible, flying in the wind. The trees bend in the wind. Dramatic but not scary - a picture-book
storm for small children.""",
    },
}


def build(n: str) -> None:
    z = ILUSTRACJE[n]
    refs = [CHARACTERS / k / "postac.png" for k in z["postacie"]] + ([BACKGROUNDS / z["tlo"] / "plyta.png"] if z.get("tlo") else [])
    for r in refs:
        if not r.exists(): raise SystemExit(f"missing reference {r}")
    kto = ", ".join(f"{POSTAC[k]} (reference {i + 1})" for i, k in enumerate(z["postacie"]))
    obsada = (f"The characters are {kto} - draw each exactly as in its reference (same design, colours, proportions). "
              if kto else "")
    miejsce = f"The place is the one in the last reference picture (same colours, simplified). " if z.get("tlo") else ""
    prompt = f"An OBLONG picture-book illustration of one moment of a story. {obsada}{miejsce}{z['scena']} {STYL}"
    WORK.mkdir(parents=True, exist_ok=True)
    raw = WORK / f"{n}.png"
    if not raw.exists():
        print(f"{n}: generating...", flush=True)
        figgen.generate(prompt, raw, refs=refs or None, size="1536x1024", quality="high", background="opaque")
    im = Image.open(raw).convert("RGB")
    k = 1280 / max(im.size)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    im.save(out / "obraz.webp", "WEBP", quality=84, method=6)
    (out / "meta.json").write_text(json.dumps({"szerokosc": im.width, "wysokosc": im.height, "postacie": z["postacie"],
                                               "lekcje": z.get("lekcje", []), "opis": " ".join(z["scena"].split())},
                                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{n}: {im.width}x{im.height}")


if __name__ == "__main__":
    for n in sys.argv[1:] or ILUSTRACJE:
        if sys.argv[1:] or not (OUT / n / "obraz.webp").exists():
            build(n)
