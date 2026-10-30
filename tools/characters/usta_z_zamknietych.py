"""Speech mouths redrawn as EDITS of the character's closed mouth piece of one view, in its own frame: the muzzle patch,
its outline and fur edge and the nose stay those of the closed piece, only the mouth changes. For a view whose speech
sheet drew the patch differently from the face sheet (Fox 3/4: a band of ginger fur over some mouths).

  python tools/characters/usta_z_zamknietych.py lisek _bok

Each piece keeps the closed piece's frame (x, y, w, rdzen) with room below for a dropped jaw, so the nose stays put.
Delete work/<kto>/zz_<name>.png to redraw one.
"""
from __future__ import annotations

import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

TU = Path(__file__).resolve().parent
sys.path.insert(0, str(TU))
import make_character as mc  # noqa: E402
from make_usta import KSZTALTY  # noqa: E402

PROMPT = """The SAME {usta} piece of a cartoon character as in the picture, seen at the same angle, in exactly the same
place and size: keep the patch of fur around it, its outline, its fur edge, colours and the nose EXACTLY as they are,
pixel for pixel. Change ONLY the mouth line inside the patch: {ksztalt}. Subtle and natural, as in a gentle picture-book
animation, not exaggerated. Fully TRANSPARENT background, nothing else added. {styl}"""
CW, CH, DOL = 1536, 1024, 0.35     # canvas; room below the closed piece for a lower jaw (share of its height)


def main(kto: str, suf: str) -> None:
    kat, gra = mc.KORZEN / kto, mc.GRA / kto
    d = json.loads((gra / "postac.json").read_text(encoding="utf-8"))
    wz = d["czesci"][f"usta_zamkniete{suf}"]
    zam = Image.open(kat / "czesci" / f"usta_zamkniete{suf}.png").convert("RGBA")
    W, H = zam.width, round(zam.height * (1 + DOL))
    k = min(CW * 0.7 / W, CH * 0.7 / H)
    w, h = round(W * k), round(H * k)
    x0, y0 = (CW - w) // 2, (CH - h) // 2
    kan = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    kan.paste(zam.resize((round(zam.width * k), round(zam.height * k)), Image.LANCZOS), (x0, y0))
    wej = kat / f"zz_kanwa{suf}.png"; kan.save(wej)

    def jeden(ks):
        n, opis = ks[0], ks[1]
        raw = kat / f"zz_{n}{suf}.png"
        if not raw.exists():
            mc.figgen.generate(PROMPT.format(usta=mc.POSTACIE[kto]["usta"], ksztalt=opis, styl=mc.STYL), raw, refs=[wej],
                               size="1536x1024", quality="high", background="transparent")
        out = Image.open(raw).convert("RGBA").resize((CW, CH)).crop((x0, y0, x0 + w, y0 + h)).resize((W, H), Image.LANCZOS)
        arr = np.asarray(out)
        ys = np.where(arr[:, :, 3].max(axis=1) > 20)[0]
        out = out.crop((0, 0, W, max(zam.height, int(ys.max()) + 2)))       # trim the unused room below
        nazwa = f"usta_{n}{suf}"
        out.save(kat / "czesci" / f"{nazwa}.png")
        out.save(gra / "czesci" / f"{nazwa}.webp", "WEBP", quality=75, method=6, exact=True)
        return nazwa, out.height

    with ThreadPoolExecutor(3) as ex:
        wyniki = list(ex.map(jeden, KSZTALTY))
    for plik, png in ((gra / "postac.json", False), (gra / "postac.build.json", False), (kat / "postac.json", True),
                      (gra / "poprawki.json", None)):
        if not plik.exists():
            continue
        dd = json.loads(plik.read_text(encoding="utf-8"))
        for nazwa, hh in wyniki:
            if png is None:                                   # the closed piece's placement: no correction of its own
                dd.get("czesci", {}).get(nazwa, {}).pop("przesun", None); continue
            cz = dict(wz, plik=f"{nazwa}.png" if png else f"{nazwa}.webp", h=hh)
            if "przesun" in wz and png is not None:
                cz["przesun"] = wz["przesun"]
            dd["czesci"][nazwa] = cz
        plik.write_text(json.dumps(dd, ensure_ascii=False), encoding="utf-8")
    print(kto, suf, [n for n, _ in wyniki])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "")
