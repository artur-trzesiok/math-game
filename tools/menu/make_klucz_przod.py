"""The padlock key seen from the front, in the keyhole (player.js swietujOtwarcie): a key in a lock facing us turns
round the axis pointing at us, so the turn is a plain rotation of this picture - its bow face-on, the shank hidden in
the lock. gpt-image paints it from the key itself (tools/menu/work/klucz.png).

  python tools/menu/make_klucz_przod.py   # -> game/assets/menu/klucz_przod.webp

Delete work/klucz_przod.png to redraw.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "menu" / "klucz_przod.webp"

PROMPT = """The SAME golden brass key as in the reference picture, now seen from its handle end, pointing straight AWAY from
the viewer as if it were stuck in a keyhole in front of us: we see the round bow (the ring handle) FACE-ON, upright, with
its heart-shaped hole, and just the start of the thick round shank behind it, very foreshortened, as a short dark ring
under the bow. Centred, filling most of the picture, on a fully TRANSPARENT background. Same golden brass, same soft
painterly picture-book style with a fine paper grain and a dark-brown outline, light from the upper left. NOT 3D render.
NO lock, NO hand, NO text."""


if __name__ == "__main__":
    raw = WORK / "klucz_przod.png"; WORK.mkdir(parents=True, exist_ok=True)
    if not raw.exists():
        figgen.generate(PROMPT, raw, refs=[WORK / "klucz.png"], size="1024x1024", quality="high", background="transparent")
    im = Image.open(raw).convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 30 else 0).getbbox()); im.thumbnail((420, 420), Image.LANCZOS)
    im.save(OUT, "WEBP", quality=90, method=6)
    print(OUT.name, im.size)
