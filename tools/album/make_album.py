"""The sticker album's pictures (the menu's album and the open album the stickers go into):

  python tools/album/make_album.py            # work/*.png -> game/assets/album/*.webp

  okladka.webp      the closed album, a button on the menu (transparent around it)
  rozkladowka.webp  the album lying open: two empty cream pages, the binding in the middle; the pages' inner
                    boxes are measured into album.json (fractions of the picture), where stickers may go

Delete a work file to redo it.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "album"

STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading with a fine paper-grain
texture, warm friendly colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO text, NO letters."""

OBRAZY = {
    "okladka": ("1024x1024", "transparent", f"""ONE closed children's sticker album, seen from the front, slightly tilted, on a
fully TRANSPARENT background with empty space around it. A thick square album with a soft orange fabric cover and a
rounded spine, a golden star in the middle of the cover and a few colourful stickers peeking out from between the
pages (a red apple, a leaf, a little hat). Friendly and inviting, like a treasure book.
{STYL}"""),
    "rozkladowka": ("1536x1024", "opaque", f"""A children's sticker album lying OPEN, seen straight from above, filling the
whole picture: two big EMPTY pages of thick warm cream paper side by side, a soft orange fabric binding in the middle
between them, the orange cover's edge showing around the pages. Each page has only a thin delicate decorative border
of tiny painted leaves and dots near its edges and is otherwise COMPLETELY EMPTY - large clean space for stickers.
Soft light, a gentle shadow in the fold.
{STYL}
NO stickers, NO pictures on the pages, NO writing."""),
}

# every world its own album (the forest keeps the one above): another cover outside, other pages inside; the pages stay
# light (album.json measures them by their light paper)
ALBUMY = {
    "swiat2": ("a soft light-blue linen cover with a thin hemp rope tied around it in a bow, a small pink seashell and a "
               "little painted sailing boat on the front",
               "a light-blue linen binding and cover edge with a hemp rope along the spine; each page has only a thin "
               "delicate border of tiny painted waves, little shells and reeds near its edges"),
    "swiat3": ("a snow-white and icy pale-blue cover with a big shiny painted snowflake in the middle, a little soft snow "
               "on its top edge",
               "an icy pale-blue binding and cover edge with a little soft snow on it; each page has only a thin delicate "
               "border of tiny painted snowflakes and little pine twigs near its edges"),
    "swiat4": ("a deep red velvet cover with shiny golden corners, a golden crown in the middle and a little red ribbon "
               "bookmark hanging out",
               "a deep red velvet binding and cover edge with golden corners; the pages are light cream parchment, each "
               "with only a thin delicate border of tiny painted golden pennant flags and little crowns near its edges"),
}
for _s, (_okl, _rz) in ALBUMY.items():
    OBRAZY[f"okladka_{_s}"] = ("1024x1024", "transparent", f"""ONE closed children's sticker album, seen from the front,
slightly tilted, on a fully TRANSPARENT background with empty space around it. A thick square album: {_okl}, a few
colourful stickers peeking out from between the pages. Friendly and inviting, like a treasure book.
{STYL}""")
    OBRAZY[f"rozkladowka_{_s}"] = ("1536x1024", "opaque", f"""A children's sticker album lying OPEN, seen straight from
above, filling the whole picture: two big EMPTY pages of thick warm light paper side by side, {_rz}, and is otherwise
COMPLETELY EMPTY - large clean space for stickers. Soft light, a gentle shadow in the fold.
{STYL}
NO stickers, NO pictures on the pages, NO writing.""")


def gen() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    for n, (size, tlo, prompt) in OBRAZY.items():
        dst = WORK / f"{n}.png"
        if dst.exists():
            print(f"{dst} exists, skipping"); continue
        figgen.generate(prompt, dst, size=size, quality="high", background=tlo)


def strony(im: Image.Image) -> list[list[float]]:
    """The two pages' boxes: the light paper (bright, low saturation) in the left and the right half, shrunk a
    little inside the painted border. Fractions of the picture: [x0, y0, x1, y1]."""
    a = np.asarray(im.convert("RGB")).astype(float) / 255
    jasne = (a.min(axis=2) > 0.72) & (a.max(axis=2) - a.min(axis=2) < 0.22)
    H, W = jasne.shape
    out = []
    for x0, x1 in ((0, W // 2), (W // 2, W)):
        m = jasne[:, x0:x1]
        kol = np.where(m.mean(axis=0) > 0.5)[0]; wie = np.where(m.mean(axis=1) > 0.5)[0]
        bx0, bx1, by0, by1 = x0 + kol.min(), x0 + kol.max(), wie.min(), wie.max()
        dx, dy = (bx1 - bx0) * 0.07, (by1 - by0) * 0.07
        out.append([round((bx0 + dx) / W, 4), round((by0 + dy) / H, 4), round((bx1 - dx) / W, 4), round((by1 - dy) / H, 4)])
    return out


def install() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for kon in [""] + [f"_{s}" for s in ALBUMY]:                         # the forest's album, then every world's own
        if not (WORK / f"okladka{kon}.png").exists() or not (WORK / f"rozkladowka{kon}.png").exists(): continue
        ok = Image.open(WORK / f"okladka{kon}.png").convert("RGBA")
        bb = ok.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
        ok = ok.crop(bb); ok.thumbnail((512, 512), Image.LANCZOS); ok.save(OUT / f"okladka{kon}.webp", "WEBP", quality=88, method=6)
        rz = Image.open(WORK / f"rozkladowka{kon}.png").convert("RGB")
        rz.save(OUT / f"rozkladowka{kon}.webp", "WEBP", quality=86, method=6)
        opis = {"strony": strony(rz), "wymiar": list(rz.size)}
        (OUT / f"album{kon}.json").write_text(json.dumps(opis, indent=1), encoding="utf-8")
        print(f"album{kon} strony:", opis["strony"])


if __name__ == "__main__":
    gen()
    install()
