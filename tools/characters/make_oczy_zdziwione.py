"""Redraw one character's surprised eyes for one view from its open eyes (a face sheet's grid cell held a mouth there).

  python tools/characters/make_oczy_zdziwione.py jez _bok
  python tools/characters/make_oczy_zdziwione.py mis _profil

gpt-image edits the open-eyes piece (on a canvas) into the surprised one; cropped back to the open piece's frame, it takes
its placement, installed into the game and both postac.json files. Delete
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
irises, the eyebrows raised. The patch of fur keeps its SOFT, feathered, blurry outer edge exactly as in the
picture - NO outline around it, no hard edge. On a fully TRANSPARENT background, nothing else: no nose, no mouth, no head around it.
{styl}"""


CW, CH = 1536, 1024


def main(kto: str, suf: str) -> None:
    """An EDIT of the open-eyes piece on a canvas, cropped back to that piece's own frame: the same patch of fur, size
    and place (a free redraw came out framed differently - a bear's profile eye smaller on a wider, harder patch)."""
    kat, gra = mc.KORZEN / kto, mc.GRA / kto
    src = kat / "czesci" / f"oczy_otwarte{suf}.png"
    raw = kat / f"oczy_zdziwione{suf}_nowe.png"
    co = "single eye with its eyebrow (side view)" if suf == "_profil" else "pair of eyes with their eyebrows"
    ot = Image.open(src).convert("RGBA")
    k = min(CW * 0.7 / ot.width, CH * 0.7 / ot.height)
    w, h = round(ot.width * k), round(ot.height * k)
    x0, y0 = (CW - w) // 2, (CH - h) // 2
    kan = Image.new("RGBA", (CW, CH), (0, 0, 0, 0)); kan.paste(ot.resize((w, h), Image.LANCZOS), (x0, y0))
    wej = kat / f"oczy_kanwa{suf}.png"; kan.save(wej)
    if not raw.exists():
        mc.figgen.generate(PROMPT.format(co=co, styl=mc.STYL), raw, refs=[wej], size="1536x1024", quality="high", background="transparent")
    im = Image.open(raw).convert("RGBA").resize((CW, CH)).crop((x0, y0, x0 + w, y0 + h)).resize(ot.size, Image.LANCZOS)
    d = json.loads((gra / "postac.json").read_text(encoding="utf-8"))
    wz = d["czesci"][f"oczy_otwarte{suf}"]
    nazwa = f"oczy_zdziwione{suf}"
    im.save(kat / "czesci" / f"{nazwa}.png")
    im.save(gra / "czesci" / f"{nazwa}.webp", "WEBP", quality=75, method=6, exact=True)
    cz = {k2: v for k2, v in wz.items() if k2 != "przesun"}
    cz["plik"] = f"{nazwa}.webp"
    for plik, png in ((gra / "postac.json", False), (gra / "postac.build.json", False), (kat / "postac.json", True)):
        if plik.exists():
            dd = json.loads(plik.read_text(encoding="utf-8"))
            dd["czesci"][nazwa] = dict(cz, plik=cz["plik"].replace(".webp", ".png")) if png else dict(cz)
            plik.write_text(json.dumps(dd, ensure_ascii=False), encoding="utf-8")
    pop = gra / "poprawki.json"
    if pop.exists():                                   # the old piece's corrections do not fit the new one
        dd = json.loads(pop.read_text(encoding="utf-8")); dd.get("czesci", {}).pop(nazwa, None)
        pop.write_text(json.dumps(dd, ensure_ascii=False), encoding="utf-8")
    print(kto, nazwa, im.size)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "")
