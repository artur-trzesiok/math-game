"""Scratch-off pictures (mechaniki4.js zdrapka): the child rubs off snow, sand, mud, leaves or a fogged window with a
finger and a painted scene shows underneath; then the spots on it are counted or pointed to (as on a found picture).

  python tools/zdrapki/make_zdrapka.py snieg_ogrodek    # -> game/assets/zdrapki/<name>/odkryty.webp, zakryty.webp, meta.json

Three gpt-image passes: the scene (a), the SAME scene covered (b: the cover follows the picture, a snow-covered garden,
not a white sheet), and an edit of (a) with a magenta disc on every spot (c). Spots are found as in make_znalezisko.py.
Review work/<name>_cele.png; delete a work file to redraw it.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

TU = Path(__file__).resolve().parent
sys.path.insert(0, str(TU.parent / "common")); sys.path.insert(0, str(TU.parent / "znaleziska"))
import figgen  # noqa: E402
from make_znalezisko import magenta, STYL  # noqa: E402

WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "zdrapki"
ZDRAPKI = {
    # light_heavy home: Bear's heaviest bag lies under brown wrapping paper - rub it off: a big pumpkin for the soup
    "zakupy_misia": {
        "oslona": "papier", "lekcje": ["light_heavy"],
        "obraz": f"""A close view of a warm wooden kitchen TABLE seen from the front and a little from above, filling the whole
picture. On the table lies ONE big open brown paper shopping BAG on its side, and out of it has rolled ONE very BIG round
ORANGE PUMPKIN with a green stalk, in the middle of the picture, much bigger than anything else; beside it two orange
carrots and one small onion. Behind the table a soft blurred cream kitchen wall. NO other pumpkins, NO animals, NO
people, NO text, NO numbers. Big simple clear shapes.
{STYL}""",
        "zakryj": """a big sheet of crumpled light-brown WRAPPING PAPER laid over the whole table, with soft folds and creases
and a piece of string, so NONE of the pumpkin, the bag or the vegetables shows through anywhere - only paper; the blurred
wall at the back stays as it is.""",
        "cele": ["on the big orange pumpkin in the middle (a disc covering only the pumpkin)"],
    },
    # counting_5: Bear's flour sack tipped over the counter - wipe the flour off and count the rolls under it
    "maka_na_ladzie": {
        "oslona": "maka", "lekcje": ["counting_5"],
        "obraz": f"""A close view of a warm wooden bakery COUNTER seen from the front and a little from above, filling the whole
picture. On the counter lies ONE long flat wooden baking TRAY, and on the tray, in ONE row from left to right, EXACTLY
FIVE round golden-brown bread ROLLS with a cross cut on top, all the same size, big, each one clearly apart from the next
with a gap of wood between them. Behind the counter a soft blurred warm bakery wall with a glowing brick oven far on the
left. NO other rolls, NO other bread, NO cakes, NO bowls, NO animals, NO people, NO text, NO numbers. Big simple clear
shapes.
{STYL}""",
        "zakryj": """a thick, soft, even layer of white FLOUR spilled all over the counter and the tray, like fresh powdery snow
with little heaps and puffs and a few fingerprints of dust, so NONE of the five rolls shows through anywhere - only
flour; the blurred wall and the oven at the back stay as they are.""",
        "cele": ["on the FIRST roll from the left (a disc covering only that roll)",
                 "on the SECOND roll from the left (a disc covering only that roll)",
                 "on the THIRD roll from the left, in the middle (a disc covering only that roll)",
                 "on the FOURTH roll from the left (a disc covering only that roll)",
                 "on the FIFTH roll from the left, the last one on the right (a disc covering only that roll)"],
    },
    # grouping: the breather - the wind heaped leaves over the trail; rake them off and the paw prints show the way
    "trop_pod_liscmi": {
        "oslona": "liscie", "lekcje": ["grouping"],
        "obraz": f"""A close view of a soft damp brown earth FOOTPATH at the edge of an autumn forest, seen from above at a slant,
filling the whole picture. Along the path runs ONE clear trail of SIX neat animal PAW PRINTS (each a round heel pad with
four small oval toe pads), pressed into the earth, from the BOTTOM LEFT corner to the TOP RIGHT, where the path enters the
forest: a few big tree trunks with orange and red autumn crowns and ONE big old OAK at the top right. A little short
grass at the sides of the path, two small mushrooms. NO animals, NO people, NO leaves on the path. Big simple clear
shapes.
{STYL}""",
        "zakryj": """a thick heap of fallen autumn LEAVES - red, orange, yellow and brown leaves of all sizes piled over the
whole path and the grass, overlapping like a soft blanket, so NONE of the paw prints shows through anywhere - only
leaves; the tree trunks and crowns at the top right stay as they are.""",
        "cele": ["on the paw print in the MIDDLE of the trail (a disc covering that one print)",
                 "on the big old oak at the top right, where the trail of paw prints leads into the forest"],
    },
    # in_out: the breather - the round window of Hedgehog's burrow is steamy from the warm stove; a finger wipes it and
    # the storm outside shows (malowanie, tlo "szyba")
    "szyba_norki": {
        "oslona": "para", "lekcje": ["in_out"],
        "obraz": f"""A view through a big window glass, filling the whole picture, seen from inside a warm cosy burrow: outside
a dark stormy MEADOW in the evening - heavy rain pouring down in slanting streaks, dark blue-grey storm clouds, ONE bright
yellow zigzag LIGHTNING bolt in the sky on the right, the tall grass and two round bushes bending in the wind, big rain
drops running down the outside of the glass. A thin wooden window frame at the very edges. NO animals, NO people. Big
simple clear shapes.
{STYL}""",
        "zakryj": """the window glass completely STEAMED UP from the warm room: a thick even milky-white mist of
condensation covering the whole glass, with a few tiny water droplets, so NOTHING outside can be seen - no rain, no
lightning, no meadow; the thin wooden window frame at the edges stays as it is.""",
        "cele": ["on the bright yellow zigzag lightning bolt"],
    },
    # logical_pairs: the storm blew everybody's things onto Beaver's workbench under a splash of mud - wipe it off
    "bloto_warsztat": {
        "oslona": "bloto", "lekcje": ["logical_pairs"],
        "obraz": f"""A close-up of the top of a sturdy old wooden WORKBENCH in a cosy log workshop, filling the whole picture,
seen from the front and a little from above. Lying on it, well apart from each other and each one big and clearly
visible: a PAINTBRUSH with a wooden handle, a small box of WATERCOLOUR PAINTS with eight colours, a HAMMER with a wooden
handle, one long iron NAIL, a white CUP with a little blue flower, and its white SAUCER. A few wood shavings. Warm light.
NO animals, NO people. Big simple clear shapes.
{STYL}""",
        "zakryj": """thick wet brown MUD splashed and smeared over the whole workbench, as after a storm: blobs, splashes and
drips of glossy brown mud, a few wet leaves stuck in it, so NONE of the things on the bench shows through anywhere -
only mud; the edges of the picture stay as they are.""",
        "cele": ["on the HAMMER (a disc covering its head and the top of its handle)"],
    },
    # counting_3: the ripest raspberries hide under the leaves - push the leaves aside and count them
    "maliny_pod_liscmi": {
        "oslona": "liscie", "lekcje": ["counting_3"],
        "obraz": f"""A close-up of ONE branch of a raspberry bush in a sunny forest thicket, filling the whole picture: a few
thorny green stems and some green leaves at the edges, and hanging from the stems EXACTLY THREE big ripe deep-red
RASPBERRIES, each one big, plump and clearly visible, well apart from each other - one on the LEFT, one in the MIDDLE,
one on the RIGHT. A soft green blurred forest background with sunlight. NO other berries, NO flowers, NO other red
things. Big simple clear shapes.
{STYL}""",
        "zakryj": """big fresh green RASPBERRY LEAVES (jagged edges, light veins) piled thickly over the whole branch, overlapping
each other like a green blanket, so NONE of the three red raspberries shows through anywhere - only leaves; the edges of
the picture stay as they are.""",
        "cele": ["on the LEFT raspberry (a disc covering the whole berry)",
                 "on the MIDDLE raspberry (a disc covering the whole berry)",
                 "on the RIGHT raspberry (a disc covering the whole berry)"],
    },
    # morning_night: earth fell into Mole's way out in the night - rub it off and the morning shines in
    "wyjscie_z_nory": {
        "oslona": "piasek", "lekcje": ["morning_night"],
        "obraz": f"""Inside a cosy underground MOLE BURROW, looking at its big ROUND way OUT: the round opening fills most of the
picture, its edge made of brown earth with little roots and pebbles. Through the opening we see the outside: a green
meadow at SUNRISE, the big round orange SUN just above the hills on the LEFT side of the opening, a pink and gold morning
sky, and on the RIGHT side a wooden fence with a big red ROOSTER standing on it, crowing with its beak open. Bright
morning light pours in. Big simple clear shapes.
{STYL}""",
        "zakryj": """the round opening completely PLUGGED with loose dark brown SOIL, crumbs of earth, little pebbles and a
few roots, as if the earth had fallen in during the night - no light comes in and NOTHING of the meadow, the sun or the
rooster shows through; the burrow's earth walls around the opening stay as they are.""",
        "cele": ["on the big round orange sun rising above the hills", "on the red rooster standing on the fence"],
    },
    # one_many / counting: snow fell on the vegetable patch - rub it off and see what is still in the ground
    "snieg_ogrodek": {
        "oslona": "snieg", "lekcje": ["one_many"],
        "obraz": f"""A small vegetable patch seen from the front and a little from above, filling the whole picture: dark brown
soil in neat rows with a low wooden edge. In the soil grow EXACTLY THREE big orange CARROTS with green leafy tops, well
apart from each other (left, middle, right), and ONE big round green CABBAGE at the front. A little wooden fence behind,
a pale winter sky. Big simple clear shapes.
{STYL}""",
        "zakryj": """the whole picture covered by a thick, soft, even layer of fresh white SNOW - the soil, the carrots, the
cabbage and the fence all buried and invisible under smooth snow drifts with soft blue shadows; only the sky is left as
it was. NOTHING of the vegetables shows through.""",
        "cele": ["on the LEFT carrot (a disc covering its orange root and leafy top)",
                 "on the MIDDLE carrot (a disc covering its orange root and leafy top)",
                 "on the RIGHT carrot (a disc covering its orange root and leafy top)"],
    },
    # morning_night: the window is fogged in the morning - wipe it and see the sun rising and the rooster on the fence
    "szyba_rano": {
        "oslona": "para", "lekcje": ["morning_night"],
        "obraz": f"""A view through a big wooden-framed window, filling the whole picture, seen from inside: outside a green
meadow at sunrise, the big round orange SUN just above the hills on the left, pink and gold morning sky, a wooden fence
with a red ROOSTER standing on it on the right, crowing, a few dew drops on the grass. Big simple clear shapes.
{STYL}""",
        "zakryj": """the window glass completely FOGGED: a thick milky-white mist of condensation covering the whole glass
evenly, with a few tiny water droplets, so nothing outside can be seen; the wooden window frame stays as it is.""",
        "cele": ["on the big round orange sun rising above the hills", "on the red rooster standing on the fence"],
    },
}


def gen(n: str) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    z = ZDRAPKI[n]; a, b, c = (WORK / f"{n}_{k}.png" for k in "abc")
    if not a.exists():
        figgen.generate(z["obraz"], a, size="1536x1024", quality="high", background="opaque")
    if not b.exists():
        figgen.generate(f"Exactly the same picture, the same composition and framing, with {z['zakryj']} Same style.",
                        b, refs=[a], size="1536x1024", quality="high", background="opaque")
    if not c.exists():
        figgen.generate(f"""Exactly the same illustration, unchanged in every way, with ONLY this added: a flat solid bright magenta
(#FF00FF) filled disc, about one tenth of the picture's height across, placed exactly on each of these {len(z['cele'])} places:
{chr(10).join(f"  - {x};" for x in z['cele'])}
Nothing else changes; no other magenta anywhere.""", c, refs=[a], size="1536x1024", quality="high", background="opaque")


def build(n: str) -> None:
    z = ZDRAPKI[n]
    A = Image.open(WORK / f"{n}_a.png").convert("RGB"); w, h = A.size
    B = Image.open(WORK / f"{n}_b.png").convert("RGB").resize((w, h), Image.LANCZOS)
    lab, ile = ndimage.label(magenta(WORK / f"{n}_c.png", A.size))
    cele = []
    for _, i in sorted(((int((lab == i).sum()), i) for i in range(1, ile + 1)), reverse=True)[:len(z["cele"])]:
        ys, xs = np.nonzero(lab == i); rr = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
        cele.append({"x": round(xs.mean() / w, 4), "y": round(ys.mean() / h, 4), "r": round(max(rr * 1.2, 0.05 * w) / w, 4)})
    cele.sort(key=lambda c: c["x"])
    if len(cele) != len(z["cele"]): print(f"  {n}: {len(cele)} spots for {len(z['cele'])} asked - check work/{n}_cele.png")
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    k = 1280 / max(w, h); size = (round(w * k), round(h * k))
    A.resize(size, Image.LANCZOS).save(out / "odkryty.webp", "WEBP", quality=84, method=6)
    B.resize(size, Image.LANCZOS).save(out / "zakryty.webp", "WEBP", quality=84, method=6)
    (out / "meta.json").write_text(json.dumps({"szerokosc": size[0], "wysokosc": size[1], "oslona": z["oslona"], "cele": cele,
                                               "lekcje": z.get("lekcje", [])}, indent=1), encoding="utf-8")
    pod = A.copy(); d = ImageDraw.Draw(pod)
    for c in cele: d.ellipse([(c["x"] - c["r"]) * w, c["y"] * h - c["r"] * w, (c["x"] + c["r"]) * w, c["y"] * h + c["r"] * w], outline=(255, 40, 40), width=8)
    pod.resize((w // 2, h // 2)).save(WORK / f"{n}_cele.png")
    print(f"{n}: {len(cele)} spots")


if __name__ == "__main__":
    for n in sys.argv[1:] or ZDRAPKI:
        gen(n); build(n)
