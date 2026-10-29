"""Connect the dots (mechaniki4.js kropki): dots on the outline of a painted thing; joined in order, the picture appears.

  python tools/kropki/make_kropki.py lokomotywa      # -> game/assets/kropki/<name>/obraz.webp (transparent) + meta.json

gpt-image paints ONE thing on a transparent background; the code takes the outline of its alpha, simplifies it to the
corners (Douglas-Peucker until at most n points), adds points on the longest sides up to n, and orders them clockwise
from the top. The card's background (paper or a night sky) is the engine's. Review work/<name>_kropki.png.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

TU = Path(__file__).resolve().parent
sys.path.insert(0, str(TU.parent / "common"))
import figgen  # noqa: E402

WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "kropki"
STYL = ("STYLE: a modern children's picture-book illustration, soft painterly shading with a fine paper-grain texture, warm "
        "friendly colours, thin soft dark outlines. NOT flat vector, NOT 3D render. ONE thing only, whole, centred, filling "
        "most of the picture, on a fully TRANSPARENT background, NO glow, NO halo, NO shadow on the ground, NO text, NO "
        "letters, NO numbers.")
KROPKI = {
    # shapes: the big roof for Hedgehog's house - three corners joined from the smallest make a triangle
    "dach_trojkat": {"n": 3, "tlo": "papier", "lekcje": ["shapes"],
                     "obraz": "A big house ROOF on its own: ONE plain TRIANGLE pointing up, wide at the bottom, made of warm yellow-orange roof tiles in neat rows, with three sharp clean corners and three perfectly straight edges. Nothing else: no walls, no chimney, no windows."},
    # ordering: the fireflies light Beaver's lantern for the tower - joined from the smallest to the biggest
    "latarenka_swietlikow": {"n": 8, "tlo": "noc", "lekcje": ["ordering"],
                             "obraz": "A glass JAR LANTERN with a curved wire handle arching over its top, glowing warm golden light from many tiny fireflies inside, seen straight from the front: a simple bold silhouette - the round arch of the handle, the jar's rim, straight sides, a flat bottom."},
    # numbers_1_5: Mole's engine appears from five dots
    "lokomotywa": {"n": 10, "tlo": "papier", "lekcje": [],
                   "obraz": "A little red steam ENGINE seen from the side, facing right: a round boiler, a tall black chimney, a cab with a window, big red wheels. A simple bold silhouette with few corners."},
    # morning_night: a constellation - the stars of the Great Bear, joined from the smallest to the biggest
    "niedzwiedz_gwiazd": {"n": 9, "tlo": "noc", "lekcje": ["morning_night"],
                          "obraz": "A friendly BEAR walking to the right, seen from the side, drawn in soft glowing pale-gold and light blue as a magical night-sky constellation picture, a simple bold silhouette."},
}


def kontur(alfa: np.ndarray) -> np.ndarray:
    from skimage import measure
    m = ndimage.binary_fill_holes(ndimage.binary_opening(alfa > 128, iterations=3))
    lab, n = ndimage.label(m); m = lab == (int(np.argmax(ndimage.sum(m, lab, range(1, n + 1)))) + 1)
    c = max(measure.find_contours(m.astype(float), 0.5), key=len)               # (row, col)
    return c[:, ::-1]                                                          # (x, y)


def kropki(c: np.ndarray, n: int) -> list:
    """n points along the outline, evenly by length, each pulled to the sharpest corner of its stretch, in outline order
    (sorting by angle round the centre crossed the lines of a concave shape), starting at the top, going clockwise."""
    c = c[:-1] if np.allclose(c[0], c[-1]) else c
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(c, axis=0), axis=1))]; L = seg[-1]
    s = max(4, int(len(c) / 60))                                              # how far to look for a corner
    v1, v2 = c - np.roll(c, s, axis=0), np.roll(c, -s, axis=0) - c
    kat = np.abs(np.arctan2(v1[:, 0] * v2[:, 1] - v1[:, 1] * v2[:, 0], (v1 * v2).sum(axis=1)))   # turning angle
    start = int(np.argmin(c[:, 1]))                                           # the top of the thing
    idx = []
    for k in range(n):
        cel = (seg[start] + k * L / n) % L
        okno = np.nonzero(np.abs(((seg - cel + L / 2) % L) - L / 2) < L / (3 * n))[0]
        idx.append(int(okno[np.argmax(kat[okno])]) if len(okno) else int(np.argmin(np.abs(seg - cel))))
    pts = [tuple(c[i]) for i in idx]
    pole = sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1] for i in range(n))
    if pole < 0: pts = [pts[0]] + pts[1:][::-1]                               # clockwise on screen (y down)
    return pts


def build(n: str) -> None:
    z = KROPKI[n]; WORK.mkdir(parents=True, exist_ok=True)
    a = WORK / f"{n}.png"
    if not a.exists():
        figgen.generate(f"{z['obraz']} {STYL}", a, size="1024x1024", quality="high", background="transparent")
    A = Image.open(a).convert("RGBA")
    bb = A.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    pad = 40; A = A.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(A.width, bb[2] + pad), min(A.height, bb[3] + pad)))
    w, h = A.size
    pts = kropki(kontur(np.asarray(A.getchannel("A"))), z["n"])
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    k = 900 / max(w, h)
    A.resize((round(w * k), round(h * k)), Image.LANCZOS).save(out / "obraz.webp", "WEBP", quality=86, method=6, exact=True)
    (out / "meta.json").write_text(json.dumps({"szerokosc": round(w * k), "wysokosc": round(h * k), "tlo": z["tlo"], "lekcje": z.get("lekcje", []),
                                               "kropki": [[round(x / w, 4), round(y / h, 4)] for x, y in pts]}, indent=1), encoding="utf-8")
    pod = Image.new("RGBA", A.size, (250, 245, 230, 255)); pod.alpha_composite(A); d = ImageDraw.Draw(pod)
    d.line([*pts, pts[0]], fill=(230, 60, 40), width=5)
    for i, (x, y) in enumerate(pts): d.ellipse([x - 12, y - 12, x + 12, y + 12], fill=(30, 30, 30)); d.text((x + 14, y - 10), str(i + 1), fill=(0, 0, 0))
    pod.convert("RGB").resize((w // 2, h // 2)).save(WORK / f"{n}_kropki.png")
    print(f"{n}: {len(pts)} dots")


if __name__ == "__main__":
    for n in sys.argv[1:] or KROPKI:
        build(n)
