"""The nose point: every mouth piece carries the nose, so each one is placed by it. Measures `nos` {x, y} (piece px)
on every mouth piece and `twarz[view].usta.nos` [dx, dy] (frame px from the target box's top-left corner) from the
view reference; lalka.js then puts each mouth so its nose point lands on the target's. A first guess only - the
editor shows both points and edits them. Pieces that already have `nos` keep it unless --nadpisz.

  python tools/characters/nos_punkt.py kret [--nadpisz] [--debug]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

TU = Path(__file__).resolve().parent
sys.path.insert(0, str(TU))
import make_character as mc  # noqa: E402

REF = {"przod": "postac.png", "bok": "bok.png", "profil": "profil.png"}
SUF = {"przod": "", "bok": "_bok", "profil": "_profil"}
ROZOWE = ("kret", "zajac")   # pale pink noses: the dark blob up there is the mouth line


def nos(a: np.ndarray, widok: str, gorna: float = 0.6, rozowy: bool = False) -> tuple[float, float] | None:
    """A dark nose: the darkest blob in the upper part. A pink one: deep-pink pixels, the topmost blob (front, 3/4) or
    the rightmost (profile: the snout points right, the blush lies behind it)."""
    rgb = a[:, :, :3].astype(int)
    op = a[:, :, 3] > 150
    ciemny = op & (rgb.mean(axis=2) < 75) & (not rozowy)
    ciemny[int(a.shape[0] * gorna):] = False
    lab, n = ndimage.label(ndimage.binary_opening(ciemny, iterations=2))
    if n:
        rozm = ndimage.sum(ciemny, lab, range(1, n + 1)); k = int(np.argmax(rozm)) + 1
        if rozm[k - 1] > 0.004 * a.shape[0] * a.shape[1]:
            ys, xs = np.where(lab == k); return float(xs.mean()), float(ys.mean())
    m = op & (rgb[:, :, 0] - rgb[:, :, 1] > 70) & (rgb[:, :, 1] < 150)
    m[int(a.shape[0] * gorna):] = False
    lab, n = ndimage.label(ndimage.binary_closing(m, iterations=2))
    plamy = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(ys) >= 60:
            plamy.append((xs.mean(), ys.mean(), ys.min(), xs.max()))
    if not plamy:
        return None
    p = max(plamy, key=lambda q: q[3]) if widok == "profil" else min(plamy, key=lambda q: q[2])
    return float(p[0]), float(p[1])


def main(kto: str, nadpisz: bool, debug: bool) -> None:
    kat, gra = mc.KORZEN / kto, mc.GRA / kto
    d = json.loads((gra / "postac.json").read_text(encoding="utf-8"))
    c, tw = d["czesci"], d["twarz"]
    cele, punkty, rysunki = {}, {}, []
    for widok, plik in REF.items():
        cel = tw.get(widok, {}).get("usta")
        if not cel or not (kat / plik).exists():
            continue
        ref = np.asarray(Image.open(kat / plik).convert("RGBA"))
        x0, y0 = max(0, cel["x"] - 60), max(0, cel["y"] - 120)
        wyc = ref[y0:cel["y"] + cel["h"] + 40, x0:cel["x"] + cel["w"] + 120]
        p = nos(wyc, widok, 1.0, kto in ROZOWE)
        if p and (nadpisz or "nos" not in cel):
            cele[widok] = [round(p[0] + x0 - cel["x"], 1), round(p[1] + y0 - cel["y"], 1)]
        for n, cz in c.items():
            if not n.startswith("usta_") or (SUF[widok] and not n.endswith(SUF[widok])) or (not SUF[widok] and n.endswith(("_bok", "_profil"))):
                continue
            im = Image.open(gra / "czesci" / cz["plik"]).convert("RGBA")
            s = im.width / cz["w"]
            q = nos(np.asarray(im), widok, rozowy=kto in ROZOWE)
            if q and (nadpisz or "nos" not in cz):
                punkty[n] = {"x": round(q[0] / s, 1), "y": round(q[1] / s, 1)}
            if debug and q:
                bg = Image.new("RGBA", im.size, (120, 120, 120, 255)); bg.alpha_composite(im); dr = ImageDraw.Draw(bg)
                dr.ellipse((q[0] - 7, q[1] - 7, q[0] + 7, q[1] + 7), outline="lime", width=3); rysunki.append(bg)
    for p, png in ((gra / "postac.json", False), (gra / "postac.build.json", False), (kat / "postac.json", True),
                   (gra / "poprawki.json", None)):
        if not p.exists():
            continue
        dd = json.loads(p.read_text(encoding="utf-8"))
        if png is not None:
            for n, q in punkty.items():
                if n in dd["czesci"]:
                    dd["czesci"][n]["nos"] = q
        for widok, v in cele.items():
            box = dd.get("twarz", {}).get(widok, {}).get("usta")
            if box is not None:
                box["nos"] = v
        p.write_text(json.dumps(dd, ensure_ascii=False), encoding="utf-8")
    print(kto, "cele:", cele, "| punkty ust:", len(punkty))
    if debug and rysunki:
        W = sum(i.width for i in rysunki); H = max(i.height for i in rysunki); o = Image.new("RGBA", (W, H)); x = 0
        for i in rysunki:
            o.paste(i, (x, 0)); x += i.width
        o.save(kat / "debug_nos.png"); print("->", kat / "debug_nos.png")


if __name__ == "__main__":
    main(sys.argv[1], "--nadpisz" in sys.argv, "--debug" in sys.argv)
