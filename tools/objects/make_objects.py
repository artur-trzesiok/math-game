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
        "outline": True,         # lesson stickers get a white die-cut outline
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
    "icons": {
        "names": ["ikona_opowiesc", "ikona_cwiczenia", "ikona_dom"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of THREE illustrated icons for a children's game, arranged in
one row of 3 on a fully TRANSPARENT background, with generous empty space between
them so none of them touch. Each icon is a single simple object, big and readable at
a small size, seen straight on, centred, with a soft white rounded-square card
behind it.
{STYL}
Left to right: an open picture book with a tiny fox on its pages (the STORY); a
child's hand with the index finger pointing, tapping (the PRACTICE); a small cosy
house with a red roof and a window (AT HOME).
All three roughly the same size.""",
    },
    "objects2": {
        "outline": True,
        "names": ["szyszka", "listek", "kamyk", "marchewka", "but", "lyzka", "misiu", "klocek"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of EIGHT small illustrated objects for a children's picture
book, arranged in a neat grid of 2 rows and 4 columns on a fully TRANSPARENT
background, with generous empty space between objects so none of them touch.
{STYL}
Row 1, left to right: a brown pine cone; a single green leaf; a smooth grey
round pebble; an orange carrot with green tops.
Row 2, left to right: a single child's red shoe seen from the side; a wooden
spoon; a small brown teddy bear; a red wooden toy block.
All eight objects roughly the same size.""",
    },
    "objects3": {
        "outline": True,
        "names": ["stol", "krzeslo", "krzak", "jez", "zajac", "mysz", "kaczka", "motyl"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of EIGHT small illustrated things for a children's picture book, arranged in a
neat grid of 2 rows and 4 columns on a fully TRANSPARENT background, with generous empty space between them
so none of them touch.
{STYL}
Row 1, left to right: a small wooden kitchen table with four legs, seen from the front; a small wooden chair
seen from the side; a round green bush; a cute little hedgehog standing, side view facing left.
Row 2, left to right: a cute little grey bunny sitting, side view facing left; a cute little grey mouse,
side view facing left; a cute little yellow duckling, side view facing left; a colourful butterfly with open
wings seen straight from above, its two wings mirror images of each other.
All eight roughly the same size.""",
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
    "gesty": {
        "outline": True,
        "names": ["gest_kamien", "gest_papier", "gest_nozyce"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of THREE illustrated hand gestures for the game rock, paper,
scissors in a children's picture book, arranged in one row of 3 on a fully TRANSPARENT
background, with generous empty space between them so none of them touch. Each is
one small child's hand with a short bit of wrist, warm light skin, seen straight on
from the back of the hand, fingers pointing up, big and readable at a small size.
{STYL}
NOT an emoji, NOT yellow, NOT glossy, NO card or frame behind it, NO sleeve.
Left to right: ROCK - a closed fist; PAPER - an open flat hand, all five fingers
spread; SCISSORS - the index and middle fingers up in a V, the others folded.
All three roughly the same size.""",
    },
    "prezent": {
        "outline": True,
        "names": ["prezent", "prezent_otwarty"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of TWO illustrations of the SAME birthday present for a children's picture book,
arranged in one row of 2 on a fully TRANSPARENT background, with generous empty space between them so they do
not touch.
{STYL}
The present: a square box wrapped in sky-blue paper with small white dots, a wide red ribbon crossing it, seen
slightly from above and from the front.
Left: the present CLOSED - its lid on, a big red bow on top, nothing inside visible.
Right: the SAME present OPENED - the lid with the bow taken off and leaning against the box's side, the box's
inside dark and EMPTY, nothing coming out of it.
Both the same size.""",
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


PX = 384             # sticker side in pixels


def die_cut(im: Image.Image, border: float = 0.055) -> Image.Image:
    """A thick white outline following the object's shape - a sticker cut around it.
    The canvas grows so the outline is not clipped; the object is drawn on top."""
    from scipy import ndimage

    r = max(2, int(PX * border)); pad = r + 3
    big = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0)); big.paste(im, (pad, pad))
    a = np.asarray(big)[:, :, 3] > 40
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    disk = (x * x + y * y) <= r * r
    grown = ndimage.binary_dilation(a, structure=disk)
    edge = ndimage.gaussian_filter(grown.astype(np.float32), 1.0)         # soft 1 px edge
    white = np.zeros((big.height, big.width, 4), dtype=np.uint8); white[:, :, :3] = 255
    white[:, :, 3] = np.clip(edge * 255, 0, 255).astype(np.uint8)
    out = Image.alpha_composite(Image.fromarray(white, "RGBA"), big)
    return out.resize((PX, PX), Image.LANCZOS)


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
        kw = kw.resize((PX, PX), Image.LANCZOS)
        if SHEETS[sheet].get("outline"):
            kw = die_cut(kw)
        kw.save(OUT / f"{nazwa}.webp", "WEBP", quality=80, method=6, exact=True)
        print(f"  {nazwa:10s} {kaw.width}x{kaw.height}")


if __name__ == "__main__":
    cmd, sheet = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "objects"
    if cmd in ("gen", "all"):
        gen(sheet)
    if cmd in ("split", "all"):
        split(sheet)
