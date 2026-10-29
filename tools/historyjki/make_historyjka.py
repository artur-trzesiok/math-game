"""A story strip from one picture (mechaniki4.js historyjka): gpt-image paints 3-4 comic panels in ONE image - the same
characters in every panel, which one image keeps far better than separate pictures - and the code cuts the panels into
cards the child puts in order.

  python tools/historyjki/make_historyjka.py dzien_kreta    # -> game/assets/historyjki/<name>/panel_<i>.webp + meta.json

The panels are found by the white gutters (rows and columns that are nearly all white); the count must match, else the
picture is reported. Each card gets a white rounded border (a card, as the stickers' die-cut edge). Panels are described
in story order. Review work/<name>_panele.png; delete work/<name>.png to redraw.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

TU = Path(__file__).resolve().parent
sys.path.insert(0, str(TU.parent / "common"))
import figgen  # noqa: E402

ROOT = TU.parents[1]
WORK = TU / "work"
OUT = ROOT / "game" / "assets" / "historyjki"
CHARACTERS = ROOT / "tools" / "characters" / "work"
STYL = ("STYLE: a modern children's picture-book illustration, soft painterly shading with a fine paper-grain texture, warm "
        "friendly colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO text, NO letters, NO numbers, NO "
        "speech bubbles, NO panel numbers.")
HISTORYJKI = {
    # front_back home: Bunny's pictures of the hide-and-seek day, mixed up - in front, behind, the mouse found
    "dzien_chowanego": {"postacie": ["zajac", "mis", "jez"], "lekcje": ["front_back"], "panele": [
        "a sunny forest clearing: the BUNNY stands IN FRONT of a round green BUSH, fully seen, his eyes squeezed shut and grinning, while the BEAR points at him and laughs",
        "the same sunny forest clearing and the same round green bush: the bunny is hidden BEHIND the bush, only his two long ears peek out over the top of it",
        "a garden maze of tall clipped green hedges: the small HEDGEHOG hugs a little grey MOUSE, both laughing, in the middle of the maze"]},
    # in_out home: the bedtime recap - the duckling's evening in four pictures
    "wieczor_kaczuszki": {"postacie": [], "lekcje": ["in_out"], "panele": [
        "the EVENING meadow before a storm, dark clouds far away: a small fluffy YELLOW DUCKLING sits snugly INSIDE a wicker basket on the grass",
        "the same meadow in the RAIN: a bright zigzag LIGHTNING bolt in the dark sky, the little yellow duckling leaps OUT of the tipped wicker basket in fright",
        "the little yellow duckling runs along a winding sandy path between round green BUSHES in the rain, towards a little round wooden door in a grassy hill far ahead",
        "INSIDE a warm cosy burrow by a glowing stove: the little yellow duckling sits dry and happy on a rug, rain on the round window behind"]},
    # ordering practice: the lantern tower built in four steps, from the biggest block up
    "wieza_latarenki": {"postacie": [], "lekcje": ["ordering"], "panele": [
        "on green grass by a little brook: ONE big wide RED wooden block lying alone on the grass",
        "the same place: on the big red block now stands a smaller YELLOW block - two blocks",
        "the same place: on the yellow block now stands a still smaller GREEN block - a tower of three blocks",
        "the same place at dusk: the smallest BLUE block on top - a tower of four blocks, the biggest at the bottom, the smallest at the top - and on the very top a glass jar lantern glowing warm gold"]},
    # morning_night: Mole's day in four pictures
    "dzien_kreta": {"postacie": ["kret"], "lekcje": ["morning_night"], "panele": [
        "MORNING: the mole stretches and yawns beside his little bed, the round sun rising low in a pink sky in the window",
        "MIDDAY: the mole plays with a ball on a sunny green meadow, the sun high in a bright blue sky",
        "EVENING: the mole walks home along a path, the big orange sun setting behind the hills, an orange sky",
        "NIGHT: the mole sleeps in his little bed under a blanket, the moon and stars in the dark blue window"]},
    # noticing_order: from the egg to the hen
    "jajko_kura": {"postacie": [], "lekcje": ["noticing_order"], "panele": [
        "a white EGG lying alone in a straw nest",
        "a fluffy yellow CHICK just hatched, standing in the straw nest beside the broken egg shell",
        "a big white HEN with a red comb standing proudly next to the empty straw nest"]},
}


def gen(n: str) -> Path:
    z = HISTORYJKI[n]; WORK.mkdir(parents=True, exist_ok=True)
    a = WORK / f"{n}.png"
    if a.exists(): return a
    k = len(z["panele"])
    uklad = ("a 2 x 2 grid of FOUR equal square panels: top-left, top-right, bottom-left, bottom-right" if k == 4 else
             f"ONE ROW of {k} equal square panels side by side, from left to right, the white page above and below them")
    refs = [CHARACTERS / q / "postac.png" for q in z["postacie"]]
    kto = (f"The character{'s' if len(z['postacie']) > 1 else ''} in every panel {'are' if len(z['postacie']) > 1 else 'is'} "
           f"from the reference picture{'s' if len(z['postacie']) > 1 else ''} - exactly the same design, colours and size in "
           "all panels. " if z["postacie"] else "")
    opis = "\n".join(f"  {i + 1}. {p}" for i, p in enumerate(z["panele"]))
    figgen.generate(f"""A children's picture-story page: {uklad}, separated by THICK plain WHITE gutters (wide white space between
the panels and round the edge of the page); every panel a full painted scene with a thin dark rounded border. {kto}The panels,
in reading order:
{opis}
The same place and the same style in every panel. {STYL}""", a, refs=refs or None, size="1536x1024" if k != 4 else "1024x1024",
                    quality="high", background="opaque")
    return a


def panele(A: Image.Image, k: int) -> list:
    g = np.asarray(A.convert("L")).astype(float)
    biale = g > 232
    def odcinki(frac, minimum):
        jest = frac < 0.93                                                 # not a gutter
        out, s = [], None
        for i, v in enumerate(list(jest) + [False]):
            if v and s is None: s = i
            if not v and s is not None:
                if i - s >= minimum: out.append((s, i))
                s = None
        return out
    rows = odcinki(biale.mean(axis=1), A.height * 0.2)
    boxes = []
    for (y0, y1) in rows:
        cols = odcinki(biale[y0:y1].mean(axis=0), A.width * 0.12)
        boxes += [(x0, y0, x1, y1) for (x0, x1) in cols]
    if len(boxes) != k: raise SystemExit(f"{len(boxes)} panels found for {k} - check the picture")
    return boxes


def build(n: str) -> None:
    z = HISTORYJKI[n]; A = Image.open(gen(n)).convert("RGB")
    boxes = panele(A, len(z["panele"]))
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    pliki = []
    for i, b in enumerate(boxes):
        p = A.crop(b); s = 480 / max(p.size); p = p.resize((round(p.width * s), round(p.height * s)), Image.LANCZOS)
        r = 18; karta = Image.new("RGBA", (p.width + 2 * r, p.height + 2 * r), (0, 0, 0, 0))
        m = Image.new("L", karta.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, karta.width - 1, karta.height - 1], 34, fill=255)
        karta.paste((255, 255, 255, 255), (0, 0), m); karta.paste(p, (r, r))
        karta.save(out / f"panel_{i}.webp", "WEBP", quality=86, method=6, exact=True); pliki.append(f"panel_{i}.webp")
    (out / "meta.json").write_text(json.dumps({"panele": pliki, "opisy": z["panele"], "postacie": z["postacie"], "lekcje": z.get("lekcje", [])},
                                              ensure_ascii=False, indent=1), encoding="utf-8")
    pod = A.copy(); d = ImageDraw.Draw(pod)
    for i, b in enumerate(boxes): d.rectangle(b, outline=(255, 40, 40), width=6); d.text((b[0] + 10, b[1] + 8), str(i + 1), fill=(255, 0, 0))
    pod.resize((A.width // 2, A.height // 2)).save(WORK / f"{n}_panele.png")
    print(f"{n}: {len(boxes)} panels")


if __name__ == "__main__":
    for n in sys.argv[1:] or HISTORYJKI:
        build(n)
