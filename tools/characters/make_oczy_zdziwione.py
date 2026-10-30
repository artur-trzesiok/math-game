"""Redraw one character's surprised eyes for one view from its open eyes (a face sheet's grid cell held a mouth there).

  python tools/characters/make_oczy_zdziwione.py jez _bok
  python tools/characters/make_oczy_zdziwione.py mis _profil

gpt-image edits the open-eyes piece into the surprised one in the same framing; it is scaled to the open piece's width
and given its core (the same framing), installed into the game and both postac.json files. Delete
work/<kto>/oczy_zdziwione<suf>_nowe.png to redraw.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

TU = Path(__file__).resolve().parent
sys.path.insert(0, str(TU))
import make_character as mc  # noqa: E402

PROMPT = """The SAME {co} as in the reference picture, in the same framing, angle, size and position, with the same patch
of fur, colours, line and style - now WIDE OPEN IN SURPRISE: the eyes a little bigger and rounder, more white around the
irises, the eyebrows raised. On a fully TRANSPARENT background, nothing else: no nose, no mouth, no head around it.
{styl}"""


def main(kto: str, suf: str) -> None:
    kat, gra = mc.KORZEN / kto, mc.GRA / kto
    src = kat / "czesci" / f"oczy_otwarte{suf}.png"
    raw = kat / f"oczy_zdziwione{suf}_nowe.png"
    co = "single eye with its eyebrow (side view)" if suf == "_profil" else "pair of eyes with their eyebrows"
    if not raw.exists():
        mc.figgen.generate(PROMPT.format(co=co, styl=mc.STYL), raw, refs=[src], size="1536x1024", quality="high", background="transparent")
    im = Image.open(raw).convert("RGBA")
    a = np.asarray(im.getchannel("A")) > 40
    lab, n = ndimage.label(ndimage.binary_closing(a, iterations=4))
    rozm = ndimage.sum(a, lab, range(1, n + 1))                          # both eyes and the brows: every blob of size
    ys, xs = np.where(np.isin(lab, [i + 1 for i, r in enumerate(rozm) if r >= 0.05 * rozm.max()]))
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    d = json.loads((gra / "postac.json").read_text(encoding="utf-8"))
    wz = d["czesci"][f"oczy_otwarte{suf}"]
    s = wz["w"] / im.width
    im = im.resize((wz["w"], max(1, round(im.height * s))), Image.LANCZOS)
    nazwa = f"oczy_zdziwione{suf}"
    im.save(kat / "czesci" / f"{nazwa}.png")
    im.save(gra / "czesci" / f"{nazwa}.webp", "WEBP", quality=75, method=6, exact=True)
    cz = {"plik": f"{nazwa}.webp", "x": wz["x"], "y": wz["y"], "w": im.width, "h": im.height,
          "rdzen": dict(wz["rdzen"], h=min(im.height - wz["rdzen"]["y"], round(wz["rdzen"]["h"] * im.height / wz["h"])))}
    for plik, png in ((gra / "postac.json", False), (gra / "postac.build.json", False), (kat / "postac.json", True)):
        if plik.exists():
            dd = json.loads(plik.read_text(encoding="utf-8"))
            dd["czesci"][nazwa] = dict(cz, plik=cz["plik"].replace(".webp", ".png")) if png else dict(cz)
            plik.write_text(json.dumps(dd, ensure_ascii=False), encoding="utf-8")
    print(kto, nazwa, im.size)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "")
