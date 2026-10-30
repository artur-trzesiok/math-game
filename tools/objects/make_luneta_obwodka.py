"""The spyglass view's rim (mechaniki3.js szukaj): a painted round eyepiece ring, see-through inside and outside.

  python tools/objects/make_luneta_obwodka.py   # -> game/assets/objects/luneta_obwodka.webp + .json {wew}

`wew` = the inner (see-through) radius as a fraction of the picture's half width, measured on the alpha, so the engine
fits the view into the hole. Delete work/luneta_obwodka.png to redraw.
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
OUT = TU.parent.parent / "game" / "assets" / "objects" / "luneta_obwodka.webp"

PROMPT = """ONE round brass-and-wood EYEPIECE RING of an old spyglass, seen straight from the front, perfectly round and
centred, filling the whole picture edge to edge, on a fully TRANSPARENT background. It is a RING only: the big round
middle is EMPTY and fully transparent (we look through it), and the ring band is thin - about one eighth of the radius -
a warm polished brass rim with a darker inner lip, two thin engraved lines and four tiny screws, a soft highlight on the
upper left. Nothing inside the ring, nothing outside it.
STYLE: modern children's picture-book illustration - soft painterly shading with a fine paper-grain texture, warm
colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO text, NO shadow, NO glass, NO lens, NO reflection
inside the ring."""


if __name__ == "__main__":
    raw = WORK / "luneta_obwodka.png"; WORK.mkdir(parents=True, exist_ok=True)
    if not raw.exists():
        figgen.generate(PROMPT, raw, size="1024x1024", quality="high", background="transparent")
    im = Image.open(raw).convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 30 else 0).getbbox())
    s = max(im.size); sq = Image.new("RGBA", (s, s)); sq.paste(im, ((s - im.width) // 2, (s - im.height) // 2)); sq = sq.resize((1024, 1024), Image.LANCZOS)
    a = np.asarray(sq.getchannel("A")) > 128
    c = 512; promienie = []
    for kat in np.linspace(0, 2 * np.pi, 72, endpoint=False):          # from the centre outwards to the first opaque pixel
        for r in range(0, 512):
            x, y = int(c + r * np.cos(kat)), int(c + r * np.sin(kat))
            if a[y, x]: promienie.append(r); break
    wew = float(np.percentile(promienie, 90)) / 512                       # the inner lip: cover it, never show a gap
    sq.save(OUT, "WEBP", quality=90, method=6)
    OUT.with_suffix(".json").write_text(json.dumps({"wew": round(wew, 4)}), encoding="utf-8")
    print(OUT.name, "inner radius", round(wew, 3), "min", min(promienie) / 512)
