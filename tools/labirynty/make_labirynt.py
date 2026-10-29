"""Mazes (mechaniki3.js labirynt): Python makes a simple perfect maze (one way between any two cells), draws its plan
plainly (light paths on dark walls) and gpt-image PAINTS it in the book's style with that plan as the reference - a
hedge maze, paths in a forest, a garden from above. The game checks moves on the Python grid, never on the painting,
so the painting must keep the plan: the build measures every wall and every opening on the painted picture and
reports the ones that do not look like it (redraw: delete work/<name>_obraz.png).

  python tools/labirynty/make_labirynt.py zywoplot     # -> game/assets/labirynty/<name>/obraz.webp + meta.json

meta.json: {kolumny, wiersze, start: [c, r], cel: [c, r], sciany: [[N, E, S, W] per cell, row by row], ramka:
[x0, y0, x1, y1] the grid's box in fractions of the picture}.
"""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "labirynty"
W, H = 1536, 1024
RAMKA = (0.08, 0.1, 0.92, 0.9)          # the grid inside the picture: a border of scenery around it
LABIRYNTY = {
    # front_back: the garden hedge maze - Hedgehog's way in to the mouse hiding behind the hedges
    "labirynt_chowany": {
        "kolumny": 5, "wiersze": 4, "ziarno": 23, "start": (0, 3), "cel": (4, 0),
        "styl": """a sunny park garden hedge maze seen from straight above for a children's picture book: the dark areas
of the plan are tall neatly trimmed hedges of rich dark green leaves with a few tiny white flowers, the light areas are a
pale sandy garden path, clearly lighter than the hedges. Around the maze a bright lawn with a few round flower beds.
Picture-book illustration, soft painterly shading, fine paper grain, warm friendly colours. The hedges stay clearly
green and dark, the path stays clearly light.""",
    },
    # in_out: the storm is coming - the duckling's way home between the meadow bushes to Hedgehog's burrow
    "sciezki_do_norki": {
        "kolumny": 5, "wiersze": 4, "ziarno": 11, "start": (0, 0), "cel": (4, 3),
        "styl": """a meadow seen from straight above for a children's picture book, in the grey-blue light of an evening
before a storm: the dark areas of the plan are thick round bushes of rich dark green leaves, packed close together like a
hedge, the light areas are a pale sandy footpath, clearly lighter than the bushes. Around the maze short grass with a
few daisies. Picture-book illustration, soft painterly shading, fine paper grain. The bushes stay clearly green and dark,
the path stays clearly light.""",
    },
    # morning_night: at dusk, the little hedgehog's way home through the forest paths
    "las_o_zmierzchu": {
        "kolumny": 5, "wiersze": 4, "ziarno": 5, "start": (0, 3), "cel": (4, 0),
        "styl": """a forest seen from straight above for a children's picture book at dusk, warm orange-pink evening light
from the low sun: the dark areas of the plan are dense dark green fir and bush thickets with a few ferns, the light
areas are a pale warm sandy forest path glowing in the evening light, clearly lighter than the thickets. Around the maze
mossy forest floor. Picture-book illustration, soft painterly shading, fine paper grain. The thickets stay clearly green
and dark, the path stays clearly light.""",
    },
    "zywoplot": {
        "kolumny": 6, "wiersze": 4, "ziarno": 7, "start": (0, 3), "cel": (5, 0),
        "styl": """a garden hedge maze seen from straight above for a children's picture book: the dark areas of the
plan are tall neat green hedges with little leaves and a few tiny flowers, the light areas are a soft sandy path. Around
the maze a sunny lawn. Picture-book illustration, soft painterly shading, fine paper grain, warm friendly colours.""",
    },
}


def labirynt(k: int, w: int, ziarno: int):
    """A perfect maze by a random depth-first walk: walls[r][c] = [N, E, S, W] (True = a wall)."""
    rnd = random.Random(ziarno)
    sciany = [[[True] * 4 for _ in range(k)] for _ in range(w)]
    widziane, stos = {(0, 0)}, [(0, 0)]
    kier = [(0, -1, 0, 2), (1, 0, 1, 3), (0, 1, 2, 0), (-1, 0, 3, 1)]   # dx, dy, my wall, the neighbour's wall
    while stos:
        c, r = stos[-1]
        mozliwe = [(c + dx, r + dy, a, b) for dx, dy, a, b in kier if 0 <= c + dx < k and 0 <= r + dy < w and (c + dx, r + dy) not in widziane]
        if not mozliwe:
            stos.pop(); continue
        c2, r2, a, b = rnd.choice(mozliwe)
        sciany[r][c][a] = False; sciany[r2][c2][b] = False
        widziane.add((c2, r2)); stos.append((c2, r2))
    return sciany


def geometria(z):
    k, w = z["kolumny"], z["wiersze"]
    x0, y0, x1, y1 = RAMKA[0] * W, RAMKA[1] * H, RAMKA[2] * W, RAMKA[3] * H
    return k, w, x0, y0, (x1 - x0) / k, (y1 - y0) / w


def plan(n: str):
    z = LABIRYNTY[n]; k, w, x0, y0, cw, ch = geometria(z)
    sciany = labirynt(k, w, z["ziarno"])
    im = Image.new("RGB", (W, H), (240, 232, 205)); d = ImageDraw.Draw(im)
    t = int(min(cw, ch) * 0.28)                 # wall thickness: thick, so a painted hedge has room
    sc = (40, 70, 40)
    for r in range(w):
        for c in range(k):
            X, Y = x0 + c * cw, y0 + r * ch
            N, E, S, Wl = sciany[r][c]
            if N: d.rectangle([X - t / 2, Y - t / 2, X + cw + t / 2, Y + t / 2], fill=sc)
            if S: d.rectangle([X - t / 2, Y + ch - t / 2, X + cw + t / 2, Y + ch + t / 2], fill=sc)
            if Wl: d.rectangle([X - t / 2, Y - t / 2, X + t / 2, Y + ch + t / 2], fill=sc)
            if E: d.rectangle([X + cw - t / 2, Y - t / 2, X + cw + t / 2, Y + ch + t / 2], fill=sc)
    # the entrance and the exit: gaps in the outer wall by the start and the goal
    for (c, r) in (z["start"], z["cel"]):
        X, Y = x0 + c * cw, y0 + r * ch
        if c == 0: d.rectangle([X - t, Y + t / 2, X + t / 2, Y + ch - t / 2], fill=(240, 232, 205))
        elif c == k - 1: d.rectangle([X + cw - t / 2, Y + t / 2, X + cw + t, Y + ch - t / 2], fill=(240, 232, 205))
        elif r == 0: d.rectangle([X + t / 2, Y - t, X + cw - t / 2, Y + t / 2], fill=(240, 232, 205))
        else: d.rectangle([X + t / 2, Y + ch - t / 2, X + cw - t / 2, Y + ch + t], fill=(240, 232, 205))
    WORK.mkdir(parents=True, exist_ok=True)
    im.save(WORK / f"{n}_plan.png")
    return sciany, t


def maluj(n: str):
    z = LABIRYNTY[n]; dst = WORK / f"{n}_obraz.png"
    if dst.exists():
        return
    figgen.generate(f"""Paint this maze as {z["styl"]}
Keep the layout EXACTLY as in the reference plan: every wall stays where it is, with the same length and the same
gaps; every path stays open where it is open; do not add or remove any wall, do not close any gap, do not open any
new one. The dark shapes of the plan become the hedges, the light shapes become the path. Seen straight from above,
the same framing as the plan. NO characters, NO animals, NO text, NO arrows.""", dst, refs=[WORK / f"{n}_plan.png"],
                    size=f"{W}x{H}", quality="high", background="opaque")


def sprawdz(n: str, sciany, t):
    """Every wall must look like hedge and every opening like path on the painting (darker+greener vs lighter)."""
    z = LABIRYNTY[n]; k, w, x0, y0, cw, ch = geometria(z)
    a = np.asarray(Image.open(WORK / f"{n}_obraz.png").convert("RGB").resize((W, H))).astype(float)
    jasn = a.mean(axis=2); ziel = a[..., 1] - (a[..., 0] + a[..., 2]) / 2
    zywoplot = (ziel > 8) & (jasn < 150)
    zle = []
    def probka(xa, ya, xb, yb):
        xa, xb, ya, yb = int(min(xa, xb)), int(max(xa, xb)), int(min(ya, yb)), int(max(ya, yb))
        return zywoplot[max(0, ya):yb + 1, max(0, xa):xb + 1].mean()
    for r in range(w):
        for c in range(k):
            X, Y = x0 + c * cw, y0 + r * ch
            # only the inner sides once: east and south
            if c < k - 1:
                v = probka(X + cw - t / 4, Y + ch * 0.3, X + cw + t / 4, Y + ch * 0.7)
                if sciany[r][c][1] != (v > 0.45): zle.append((c, r, "E", round(v, 2)))
            if r < w - 1:
                v = probka(X + cw * 0.3, Y + ch - t / 4, X + cw * 0.7, Y + ch + t / 4)
                if sciany[r][c][2] != (v > 0.45): zle.append((c, r, "S", round(v, 2)))
    return zle


def build(n: str):
    z = LABIRYNTY[n]
    sciany, t = plan(n)
    maluj(n)
    zle = sprawdz(n, sciany, t)
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    Image.open(WORK / f"{n}_obraz.png").convert("RGB").resize((1536, 1024), Image.LANCZOS).save(out / "obraz.webp", "WEBP", quality=84, method=6)
    meta = {"kolumny": z["kolumny"], "wiersze": z["wiersze"], "start": list(z["start"]), "cel": list(z["cel"]),
            "sciany": [c for r in sciany for c in r], "ramka": list(RAMKA), "szerokosc": W, "wysokosc": H}
    (out / "meta.json").write_text(json.dumps(meta), encoding="utf-8")
    # a review sheet: the painting with the plan's walls traced over it, wrong ones in red
    k, w, x0, y0, cw, ch = geometria(z)
    im = Image.open(WORK / f"{n}_obraz.png").convert("RGB").resize((W, H)); d = ImageDraw.Draw(im)
    for r in range(w):
        for c in range(k):
            X, Y = x0 + c * cw, y0 + r * ch
            for i, (xa, ya, xb, yb) in enumerate([(X, Y, X + cw, Y), (X + cw, Y, X + cw, Y + ch), (X, Y + ch, X + cw, Y + ch), (X, Y, X, Y + ch)]):
                if sciany[r][c][i]: d.line([xa, ya, xb, yb], fill=(255, 255, 0), width=3)
    for c, r, s, v in zle:
        X, Y = x0 + c * cw, y0 + r * ch
        p = (X + cw, Y + ch / 2) if s == "E" else (X + cw / 2, Y + ch)
        d.ellipse([p[0] - 30, p[1] - 30, p[0] + 30, p[1] + 30], outline=(255, 0, 0), width=6)
    im.resize((W // 2, H // 2)).save(WORK / f"{n}_sprawdz.png")
    print(f"{n}: {len(zle)} walls/openings that do not match the plan" + (f" {zle}" if zle else ""))


if __name__ == "__main__":
    for n in sys.argv[1:] or LABIRYNTY:
        build(n)
