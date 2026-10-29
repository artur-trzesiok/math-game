"""The "next" button an event illustration waits on (ilustracje.js): a round painted button with an arrow.

  python tools/objects/make_przycisk.py     # -> game/assets/objects/przycisk_dalej.webp

Delete work/przycisk_dalej.png to redraw.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "objects" / "przycisk_dalej.webp"

PROMPT = """ONE big round friendly "next" BUTTON for a children's picture-book game, seen straight from the front, on a
fully TRANSPARENT background, filling most of the picture: a plump glossy round button in warm sunny orange with a
soft lighter top and a thin darker rim, and on it ONE big chunky rounded white ARROW pointing to the RIGHT, with a
soft thin dark outline. Cheerful and inviting, like a candy.
STYLE: modern children's picture-book illustration - soft painterly shading with a fine paper-grain texture, warm
colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO text, NO letters, NO shadow under it, NO glow."""


if __name__ == "__main__":
    raw = WORK / "przycisk_dalej.png"; WORK.mkdir(parents=True, exist_ok=True)
    if not raw.exists():
        figgen.generate(PROMPT, raw, size="1024x1024", quality="high", background="transparent")
    im = Image.open(raw).convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 30 else 0).getbbox()); im.thumbnail((320, 320), Image.LANCZOS)
    im.save(OUT, "WEBP", quality=90, method=6)
    print(OUT.name, im.size)
