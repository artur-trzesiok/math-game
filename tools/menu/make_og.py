"""The share picture (og:image) of the game: the four friends on the menu's meadow, 1200x630 JPEG. No words on
it: one picture serves every language.

  python tools/menu/make_og.py        # work/og.png -> game/og.jpg

Delete work/og.png to redraw the scene.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
ROOT = TU.parent.parent
WORK = TU / "work"
CHARACTERS = ROOT / "tools" / "characters" / "work"
GAME = ROOT / "game"
KTO = ["lisek", "wiewiorka", "sowa", "sarenka"]
W, H = 1200, 630

PROMPT = """A WIDE illustration for a children's maths game, used as its picture when a link is shared. The fox,
the squirrel, the owl and the deer from the reference images - drawn exactly as in the references (same design,
same colours, same proportions) - stand together on the sunny meadow of the last reference image, in the middle of
the picture, waving and smiling at the viewer. SIZES: the squirrel is three quarters of the fox's height;
the owl is as tall as the fox and has the biggest head of all; the deer is as tall as the fox. A few colourful
paper shapes and big round digits 1, 2, 3 float playfully in the sky above them.
STYLE: exactly the style of the reference images - a modern children's picture-book illustration, soft painterly
shading with a fine paper-grain texture, warm friendly colours, thin soft outlines. NOT flat vector, NOT 3D render.
NO text, NO letters."""


def gen() -> Path:
    WORK.mkdir(parents=True, exist_ok=True)
    dst = WORK / "og.png"
    if not dst.exists():
        refs = [CHARACTERS / k / "postac.png" for k in KTO] + [WORK / "tlo.png"]
        figgen.generate(PROMPT, dst, refs=refs, size="1536x1024", quality="high", background="opaque")
    return dst


def install(src: Path) -> None:
    im = Image.open(src).convert("RGB")
    s = W / im.width                                         # fill the width, crop around the middle
    im = im.resize((W, round(im.height * s)), Image.LANCZOS)
    top = (im.height - H) // 2
    im.crop((0, top, W, top + H)).save(GAME / "og.jpg", "JPEG", quality=86, optimize=True, progressive=True)
    print("og.jpg", (W, H))


if __name__ == "__main__":
    install(gen())
