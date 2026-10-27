"""Lesson objects in the picture-book style: one sheet, then one 256 px PNG per object.

One generation instead of eight: the icons come out in one consistent style,
and the split by alpha is the same trick prep.py uses on character sheets.
Order on the sheet is row-major and fixed by the prompt, so names map by
position.

  python tools/objects/make_objects.py gen     # work/sheet.png
  python tools/objects/make_objects.py split   # -> game/assets/objects/<name>.png

More objects = extend NAZWY and the PROMPT rows (order on the sheet is the order
of NAZWY), delete work/sheet.png, run gen + split.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
ARKUSZ = TU / "work" / "sheet.png"
OUT = TU.parent.parent / "game" / "assets" / "objects"

# wiersz 1, wiersz 2 - kolejnosc na arkuszu
NAZWY = ["jablko", "gruszka", "kwiatek", "ciastko",
         "kubek", "talerz", "skarpetka", "pilka"]

PROMPT = """A sprite sheet of EIGHT small illustrated objects for a children's picture
book, arranged in a neat grid of 2 rows and 4 columns on a fully TRANSPARENT
background, with generous empty space between objects so none of them touch.
STYLE: modern children's picture-book illustration - soft painterly shading
with a fine paper-grain texture, warm colours, thin soft dark outlines. NOT flat
vector, NOT 3D. Each object is one single thing seen straight on, NO ground
shadow, NO text.
Row 1, left to right: a red apple with a small green leaf; a green pear; a
pink daisy flower with a yellow centre; a round brown chocolate-chip cookie.
Row 2, left to right: a blue cup with a handle; a white round plate with a
light blue rim; a single striped orange-and-white sock; a red-and-white ball.
All eight objects roughly the same size."""


def gen() -> None:
    ARKUSZ.parent.mkdir(parents=True, exist_ok=True)
    figgen.generate(PROMPT, ARKUSZ, size="1536x1024", quality="high",
                    background="transparent")


def split(min_pikseli: int = 1500) -> None:
    from scipy import ndimage

    im = Image.open(ARKUSZ).convert("RGBA")
    a = np.asarray(im)
    maska = a[:, :, 3] > 40
    # domkniecie, zeby lisc jablka nie odpadl jako osobny obiekt
    maska = ndimage.binary_closing(maska, iterations=6)
    etyk, ile = ndimage.label(maska, structure=np.ones((3, 3)))
    plamy = []
    for i in range(1, ile + 1):
        ys, xs = np.where(etyk == i)
        if len(ys) < min_pikseli:
            continue
        plamy.append((int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max()),
                      float(ys.mean()), float(xs.mean())))
    # rzad po srodku y (2 rzedy), potem x
    if len(plamy) != len(NAZWY):
        print(f"UWAGA: {len(plamy)} plam, oczekiwano {len(NAZWY)} - sprawdz arkusz")
    srodek_y = np.median([p[4] for p in plamy])
    plamy.sort(key=lambda p: (0 if p[4] < srodek_y else 1, p[5]))
    OUT.mkdir(parents=True, exist_ok=True)
    for nazwa, (y0, y1, x0, x1, _, _) in zip(NAZWY, plamy):
        pad = 8
        kaw = im.crop((max(0, x0 - pad), max(0, y0 - pad),
                       min(im.width, x1 + pad), min(im.height, y1 + pad)))
        # kwadrat, zeby sprite w grze nie byl rozciagniety
        bok = max(kaw.width, kaw.height)
        kw = Image.new("RGBA", (bok, bok), (0, 0, 0, 0))
        kw.paste(kaw, ((bok - kaw.width) // 2, (bok - kaw.height) // 2))
        kw = kw.resize((256, 256), Image.LANCZOS)
        kw.save(OUT / f"{nazwa}.webp", "WEBP", quality=75, method=6, exact=True)
        print(f"  {nazwa:10s} {kaw.width}x{kaw.height}")


if __name__ == "__main__":
    {"gen": gen, "split": split}[sys.argv[1]]()
