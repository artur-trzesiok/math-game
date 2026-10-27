"""Lesson objects in the picture-book style: one gpt-image sheet per group, then one
256 px WebP sticker per object (exact alpha).

  python tools/objects/make_objects.py gen objects        # work/objects.png
  python tools/objects/make_objects.py split objects      # -> game/assets/objects/<name>.webp
  python tools/objects/make_objects.py all containers     # the baskets and boxes the sorting zones sit on

A sheet = an entry in SHEETS: the names in reading order (row by row) and the prompt
that lists the same things in the same order. More objects = a new sheet (never
reorder an existing one: names map by position). Split by alpha; a cell is the
largest blobs, closed so a leaf does not fall off its apple.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "objects"

STYL = """STYLE: modern children's picture-book illustration - soft painterly shading
with a fine paper-grain texture, warm colours, thin soft dark outlines. NOT flat
vector, NOT 3D. Each object is one single thing seen straight on, NO ground
shadow, NO text."""

SHEETS = {
    "objects": {
        "names": ["jablko", "gruszka", "kwiatek", "ciastko", "kubek", "talerz", "skarpetka", "pilka"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of EIGHT small illustrated objects for a children's picture
book, arranged in a neat grid of 2 rows and 4 columns on a fully TRANSPARENT
background, with generous empty space between objects so none of them touch.
{STYL}
Row 1, left to right: a red apple with a small green leaf; a green pear; a
pink daisy flower with a yellow centre; a round brown chocolate-chip cookie.
Row 2, left to right: a blue cup with a handle; a white round plate with a
light blue rim; a single striped orange-and-white sock; a red-and-white ball.
All eight objects roughly the same size.""",
    },
    "containers": {
        "names": ["koszyk", "pudelko", "miska", "polka"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of FOUR illustrated EMPTY containers for a children's picture
book, arranged in one row of 4 on a fully TRANSPARENT background, with generous
empty space between them so none of them touch. Each container is seen slightly
from above so its open inside is visible and EMPTY, wide and low (wider than
tall), so small things can be laid in it.
{STYL}
Left to right: a light wicker basket with no handle; an open cardboard box; a
wide blue ceramic bowl; a small wooden shelf tray with a low rim.
All four roughly the same width.""",
    },
}


def gen(sheet: str) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    dst = WORK / f"{sheet}.png"
    if dst.exists():
        print(f"{dst} exists, skipping")
        return
    s = SHEETS[sheet]
    figgen.generate(s["prompt"], dst, size=s["size"], quality="high", background="transparent")


def split(sheet: str, min_pikseli: int = 1500) -> None:
    from scipy import ndimage

    names = SHEETS[sheet]["names"]
    im = Image.open(WORK / f"{sheet}.png").convert("RGBA")
    a = np.asarray(im)
    maska = ndimage.binary_closing(a[:, :, 3] > 40, iterations=6)
    etyk, ile = ndimage.label(maska, structure=np.ones((3, 3)))
    plamy = []
    for i in range(1, ile + 1):
        ys, xs = np.where(etyk == i)
        if len(ys) >= min_pikseli:
            plamy.append((int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max()), float(ys.mean()), float(xs.mean())))
    plamy.sort(key=lambda p: -((p[1] - p[0]) * (p[3] - p[2])))
    plamy = plamy[:len(names)]
    if len(plamy) != len(names):
        print(f"UWAGA: {len(plamy)} plam, oczekiwano {len(names)} - sprawdz arkusz")
    rows = 2 if len(names) > 4 else 1
    srodek_y = np.median([p[4] for p in plamy])
    plamy.sort(key=lambda p: ((0 if p[4] < srodek_y else 1) if rows == 2 else 0, p[5]))
    OUT.mkdir(parents=True, exist_ok=True)
    for nazwa, (y0, y1, x0, x1, _, _) in zip(names, plamy):
        pad = 8
        kaw = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
        bok = max(kaw.width, kaw.height)
        kw = Image.new("RGBA", (bok, bok), (0, 0, 0, 0))
        kw.paste(kaw, ((bok - kaw.width) // 2, (bok - kaw.height) // 2))
        kw = kw.resize((256, 256), Image.LANCZOS)
        kw.save(OUT / f"{nazwa}.webp", "WEBP", quality=75, method=6, exact=True)
        print(f"  {nazwa:10s} {kaw.width}x{kaw.height}")


if __name__ == "__main__":
    cmd, sheet = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "objects"
    if cmd in ("gen", "all"):
        gen(sheet)
    if cmd in ("split", "all"):
        split(sheet)
