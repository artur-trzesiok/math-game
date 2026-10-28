"""The menu's painted pieces (game/index.html, the lesson strip): the scenery behind it, the title sign per
language, and a sheet of blank parts - a wooden plank (topic names, chips), a round wooden button (languages,
fullscreen), a paper card (a lesson), a tree stump (the album sits on it).

  python tools/menu/make_menu.py        # work/*.png -> game/assets/menu/*.webp

Delete a work file to redo it.
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
OUT = TU.parent.parent / "game" / "assets" / "menu"

STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading with a fine paper-grain
texture, warm friendly colours, thin soft dark-brown outlines. NOT flat vector, NOT 3D render."""

OBRAZY = {
    "tlo": ("1536x1024", "opaque", f"""A wide calm illustrated landscape for the main menu of a children's game: a soft
light-blue morning sky with two or three small fluffy clouds, gentle rolling green hills far away, a few round
trees at the left and right edges, a sunny meadow in front with tiny flowers. The whole middle of the picture is
open and calm (things will be placed over it). No path, no buildings.
{STYL}
NO characters, NO animals, NO text."""),
    "szyld_pl": ("1536x1024", "transparent", f"""ONE wide wooden sign board for the title of a children's game, on a fully
TRANSPARENT background with empty space around it: a long rounded plank of warm light wood with a painted
dark-brown outline, two small green leaves and a little red berry at its ends, and on it the words
"Matematyka z Liskiem" painted in big, round, friendly, bold dark-brown letters, perfectly spelled, centred.
{STYL}
ONLY these words, exactly spelled: Matematyka z Liskiem"""),
    "szyld_en": ("1536x1024", "transparent", f"""ONE wide wooden sign board for the title of a children's game, on a fully
TRANSPARENT background with empty space around it: a long rounded plank of warm light wood with a painted
dark-brown outline, two small green leaves and a little red berry at its ends, and on it the words
"Maths with Fox" painted in big, round, friendly, bold dark-brown letters, perfectly spelled, centred.
{STYL}
ONLY these words, exactly spelled: Maths with Fox"""),
    "czesci": ("1536x1024", "transparent", f"""A sprite sheet of FOUR separate painted parts for a children's game menu, arranged
in one row of 4 on a fully TRANSPARENT background, with generous empty space between them so none of them touch.
{STYL}
Left to right:
1) a BLANK wide short wooden plank sign, warm light wood with a dark-brown outline, wider than tall (about 4 to 1),
   NOTHING written on it;
2) a BLANK round wooden button like a thick wooden coin seen from the front, warm light wood, a dark-brown outline,
   NOTHING on it;
3) a BLANK card of thick cream paper, taller than wide (about 4 to 5), slightly rounded corners, a soft painted
   edge and a tiny shadow, a small piece of washi tape at the top, NOTHING on it;
4) a low wide tree stump with visible rings on its flat top, a little moss and a small mushroom at its foot.
NO text anywhere."""),
}
CZESCI = ["deska", "guzik", "karta", "pniak"]


def gen() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    for n, (size, tlo, prompt) in OBRAZY.items():
        dst = WORK / f"{n}.png"
        if dst.exists():
            print(f"{dst} exists, skipping"); continue
        figgen.generate(prompt, dst, size=size, quality="high", background=tlo)


def przytnij(im: Image.Image) -> Image.Image:
    bb = im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    return im.crop(bb) if bb else im


def install() -> None:
    from scipy import ndimage
    OUT.mkdir(parents=True, exist_ok=True)
    t = Image.open(WORK / "tlo.png").convert("RGB"); t.save(OUT / "tlo.webp", "WEBP", quality=82, method=6)
    for n in ("szyld_pl", "szyld_en"):
        im = przytnij(Image.open(WORK / f"{n}.png").convert("RGBA")); im.thumbnail((1200, 600), Image.LANCZOS)
        im.save(OUT / f"{n}.webp", "WEBP", quality=88, method=6)
    sheet = Image.open(WORK / "czesci.png").convert("RGBA"); a = np.asarray(sheet)[:, :, 3] > 24
    lab, n = ndimage.label(ndimage.binary_closing(a, iterations=6))
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); big = np.argsort(sizes)[::-1][:4] + 1
    boxes = sorted([ndimage.find_objects((lab == k).astype(int))[0] for k in big], key=lambda s: s[1].start)
    for nazwa, (sy, sx) in zip(CZESCI, boxes):
        im = przytnij(sheet.crop((sx.start, sy.start, sx.stop, sy.stop)))
        im.save(OUT / f"{nazwa}.webp", "WEBP", quality=88, method=6); print(nazwa, im.size)


if __name__ == "__main__":
    gen()
    install()
