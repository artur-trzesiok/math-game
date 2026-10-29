"""The domino tile (mechaniki3.js domino) painted: a blank tile with its middle line, laid out from the engine's own
geometry (the template is the first reference), and one pip the engine places by the number.

  python tools/objects/make_domino.py      # -> game/assets/objects/domino_plytka.webp, domino_oczko.webp

Delete work/domino*.png to redraw.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "objects"

# the engine's geometry for size 1: the tile 0.5 x 1 with a 0.04 rim, the middle line 0.8 of the width
WO, HO = 0.5 + 0.08, 1.0 + 0.08
PX = 1300 / HO
X0, Y0 = (1024 - WO * PX) / 2, (1536 - HO * PX) / 2

STYL = ("STYLE: modern children's picture-book illustration - soft painterly shading with a fine paper-grain texture, "
        "warm colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO text, NO numbers.")


def szablon() -> Path:
    im = Image.new("RGB", (1024, 1536), "white"); d = ImageDraw.Draw(im)
    d.rounded_rectangle([X0, Y0, X0 + WO * PX, Y0 + HO * PX], radius=0.14 * PX, fill=(235, 235, 235), outline=(0, 0, 0), width=6)
    cy, pol = 768, 0.5 * 0.8 * PX / 2
    d.line([(512 - pol, cy), (512 + pol, cy)], fill=(0, 0, 0), width=8)
    p = WORK / "domino_szablon.png"; WORK.mkdir(parents=True, exist_ok=True); im.save(p)
    return p


PLYTKA = f"""The FIRST reference picture is the exact LAYOUT: one upright tile with a line across its middle. Paint it as
ONE object keeping its outline, size and position EXACTLY: a children's big wooden DOMINO tile seen straight from the
front, standing upright - warm ivory-cream painted wood with softly rounded corners, a thin darker wooden edge all
round, and one short engraved dark line across the middle dividing it into two equal squares. BOTH halves completely
BLANK: NO dots, NO pips, NO marks.
On a fully TRANSPARENT background: NO shadow, NO glow, nothing around it. {STYL}"""

OCZKO = f"""ONE single round domino PIP on a fully TRANSPARENT background, filling most of the picture: a small round
hollow pressed into ivory wood, painted deep dark brown, with a soft light rim on its lower edge so it reads as a dent.
Seen straight from the front, a perfect circle. NO shadow, NO glow, nothing else. {STYL}"""


def gen() -> None:
    if not (WORK / "domino.png").exists():
        figgen.generate(PLYTKA, WORK / "domino.png", refs=[szablon()], size="1024x1536", quality="high", background="transparent")
    if not (WORK / "domino_oczko.png").exists():
        figgen.generate(OCZKO, WORK / "domino_oczko.png", size="1024x1024", quality="high", background="transparent")


def install() -> None:
    im = Image.open(WORK / "domino.png").convert("RGBA")
    pad = 0.02 * PX
    im = im.crop((round(X0 - pad), round(Y0 - pad), round(X0 + WO * PX + pad), round(Y0 + HO * PX + pad)))
    im.thumbnail((400, 800), Image.LANCZOS); im.save(OUT / "domino_plytka.webp", "WEBP", quality=88, method=6)
    o = Image.open(WORK / "domino_oczko.png").convert("RGBA")
    o = o.crop(o.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()); o.thumbnail((128, 128), Image.LANCZOS)
    o.save(OUT / "domino_oczko.webp", "WEBP", quality=90, method=6)
    print("domino_plytka", im.size, "domino_oczko", o.size)


if __name__ == "__main__":
    gen(); install()
