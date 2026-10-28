"""Picture pairs for "spot the difference" (mechaniki2.js roznice): gpt-image draws a picture, then an EDIT of it with
the pair's changes spelled out; the code finds where the two differ (both blurred, so paper grain and brush jitter are
no change; the largest changed areas, as many as the pair has changes) and writes them as circles.

  python tools/roznice/make_roznice.py laka       # work/laka_a.png, laka_b.png -> game/assets/roznice/laka/

Output: a.webp, b.webp, meta.json {roznice: [{x, y, r}] in fractions of the picture}. Delete the work files to redraw.
A pair whose found areas are not as many as its changes is reported; look at work/<name>_roznice.png.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "roznice"
STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading with a fine paper-grain texture, warm
friendly colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO characters, NO text."""
PARY = {
    "laka": {
        "obraz": f"""A square picture of a sunny meadow: a small white cottage with a red roof and a round window, a wooden fence
with a little bird sitting on it, a big tree with red apples, three red tulips in front, a yellow sun and two
fluffy clouds, a butterfly. Big simple clear shapes, everything well apart.
{STYL}""",
        "zmiany": ["the little bird on the fence is GONE (just the fence there)", "the three tulips are BLUE instead of red",
                   "the round window of the cottage is now a SQUARE window"],
    },
}
ROZMYCIE = 3.0
PROG = 38


def gen(n: str) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    a, b = WORK / f"{n}_a.png", WORK / f"{n}_b.png"
    if not a.exists():
        figgen.generate(PARY[n]["obraz"], a, size="1024x1024", quality="high", background="opaque")
    if not b.exists():
        zm = "\n".join(f"  - {z};" for z in PARY[n]["zmiany"])
        figgen.generate(f"""Exactly the same illustration, unchanged in every way - same composition, same colours, same
light, same texture, every other thing exactly where it is - except these {len(PARY[n]["zmiany"])} changes:
{zm}
Do NOT change, move or redraw anything else.""", b, refs=[a], size="1024x1024", quality="high", background="opaque")


def build(n: str) -> None:
    A = np.asarray(Image.open(WORK / f"{n}_a.png").convert("RGB")).astype(float)
    B = np.asarray(Image.open(WORK / f"{n}_b.png").convert("RGB").resize((A.shape[1], A.shape[0]), Image.LANCZOS)).astype(float)
    d = np.abs(ndimage.gaussian_filter(A, (ROZMYCIE, ROZMYCIE, 0)) - ndimage.gaussian_filter(B, (ROZMYCIE, ROZMYCIE, 0))).max(axis=2)
    m = ndimage.binary_opening(d > PROG, iterations=2)
    m = ndimage.binary_closing(m, iterations=12)
    lab, ile = ndimage.label(m)
    pola = sorted(((int((lab == i).sum()), i) for i in range(1, ile + 1)), reverse=True)
    ile_zmian = len(PARY[n]["zmiany"])
    h, w = m.shape
    roznice = []
    for pole, i in pola[:ile_zmian]:
        ys, xs = np.nonzero(lab == i)
        cx, cy = xs.mean(), ys.mean(),
        r = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 + 18
        roznice.append({"x": round(cx / w, 4), "y": round(cy / h, 4), "r": round(max(r, 40) / w, 4), "pole": pole})
    if len(pola) != ile_zmian:
        print(f"  {n}: {len(pola)} changed areas found for {ile_zmian} changes (the largest kept) - check work/{n}_roznice.png")
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    for k, arr in (("a", A), ("b", B)):
        Image.fromarray(arr.astype(np.uint8)).resize((768, 768), Image.LANCZOS).save(out / f"{k}.webp", "WEBP", quality=84, method=6)
    (out / "meta.json").write_text(json.dumps({"roznice": roznice}, indent=1), encoding="utf-8")
    # a review sheet: both pictures, every found area circled
    podglad = Image.new("RGB", (w * 2 + 20, h), "white")
    for j, arr in enumerate((A, B)):
        im = Image.fromarray(arr.astype(np.uint8)); dr = ImageDraw.Draw(im)
        for r in roznice: dr.ellipse([(r["x"] - r["r"]) * w, (r["y"] - r["r"]) * h, (r["x"] + r["r"]) * w, (r["y"] + r["r"]) * h], outline=(255, 40, 40), width=8)
        podglad.paste(im, (j * (w + 20), 0))
    podglad.resize((podglad.width // 2, podglad.height // 2)).save(WORK / f"{n}_roznice.png")
    print(f"{n}: {len(roznice)} differences")


if __name__ == "__main__":
    for n in sys.argv[1:] or PARY:
        gen(n); build(n)
