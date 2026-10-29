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
