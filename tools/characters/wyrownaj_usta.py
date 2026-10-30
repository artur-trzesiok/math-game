"""Every mouth piece carries the nose; placed by its core, the nose landed at a different spot per mouth (it jumped
while talking). This measures the nose on each mouth piece and writes the piece's `przesun` [dx, dy] (frame px, the
editor's per-variant correction) so its nose stands where the closed mouth's does, per view. Pieces that already
have `przesun` keep it (the editor's), unless --nadpisz. A beak has no nose: skipped.

  python tools/characters/wyrownaj_usta.py all|<kto> [--nadpisz] [--debug]
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

SUF = {"przod": "", "bok": "_bok", "profil": "_profil"}
ROZOWE = ("kret", "zajac")      # pale pink noses: the dark blob up there is the mouth line


def nos(a: np.ndarray, widok: str, rozowy: bool) -> tuple[float, float] | None:
    """The nose's centre: the topmost sizeable dark blob in the upper part (an open mouth lies lower), or for a pink
    nose the topmost deep-pink blob (the rightmost in profile: the snout points right, the blush lies behind)."""
    rgb, op = a[:, :, :3].astype(int), a[:, :, 3] > 150
    if rozowy:
        m = op & (rgb[:, :, 0] - rgb[:, :, 1] > 70) & (rgb[:, :, 1] < 150)
        m = ndimage.binary_closing(m, iterations=2)
    else:
        m = ndimage.binary_opening(op & (rgb.mean(axis=2) < 75), iterations=2)
    m[int(a.shape[0] * 0.6):] = False
    lab, n = ndimage.label(m)
    plamy = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(ys) >= max(60, 0.002 * a.shape[0] * a.shape[1]):
            plamy.append((xs.mean(), ys.mean(), ys.min(), xs.max()))
    if not plamy:
        return None
    p = max(plamy, key=lambda q: q[3]) if (rozowy and widok == "profil") else min(plamy, key=lambda q: q[2])
    return float(p[0]), float(p[1])


def jeden(kto: str, nadpisz: bool, debug: bool) -> None:
    if mc.POSTACIE[kto].get("usta") == "beak":
        print(kto, "dziob - pomijam"); return
    kat, gra = mc.KORZEN / kto, mc.GRA / kto
    d = json.loads((gra / "postac.json").read_text(encoding="utf-8"))
    c, tw = d["czesci"], d["twarz"]
    przes, rys = {}, []
    for widok, suf in SUF.items():
        cel = tw.get(widok, {}).get("usta"); baz = c.get("usta_usmiech" + suf)
        if not cel or not baz:
            continue
        rb = baz.get("rdzen") or {"x": 0, "y": 0, "w": baz["w"], "h": baz["h"]}
        k = cel["w"] / rb["w"]
        pozycje = {}
        for n, cz in c.items():
            if not n.startswith("usta_") or (suf and not n.endswith(suf)) or (not suf and n.endswith(("_bok", "_profil"))):
                continue
            im = Image.open(gra / "czesci" / cz["plik"]).convert("RGBA"); s = im.width / cz["w"]
            q = nos(np.asarray(im), widok, kto in ROZOWE)
            if q is None:
                continue
            r = cz.get("rdzen") or {"x": 0, "y": 0, "w": cz["w"], "h": cz["h"]}
            p0 = cz.get("przesun", [0, 0])
            bx = cel["x"] + cel["w"] / 2 - (r["x"] + r["w"] / 2) * k + p0[0]      # lalka.js placement
            by = cel["y"] - r["y"] * k + p0[1]
            pozycje[n] = (bx + q[0] / s * k, by + q[1] / s * k, p0)
            if debug:
                bg = Image.new("RGBA", im.size, (120, 120, 120, 255)); bg.alpha_composite(im); dr = ImageDraw.Draw(bg)
                dr.ellipse((q[0] - 7, q[1] - 7, q[0] + 7, q[1] + 7), outline="lime", width=3); rys.append(bg)
        wz = pozycje.get("usta_zamkniete" + suf)
        if not wz:
            continue
        for n, (x, y, p0) in pozycje.items():
            if "przesun" in c[n] and not nadpisz:
                continue
            dx, dy = round(p0[0] + wz[0] - x, 1), round(p0[1] + wz[1] - y, 1)
            if abs(dx) > 0.5 or abs(dy) > 0.5:
                przes[n] = [dx, dy]
    for p in (gra / "postac.json", kat / "postac.json", gra / "poprawki.json"):
        if not p.exists() and p.name != "poprawki.json":
            continue
        dd = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
        for n, v in przes.items():
            if p.name == "poprawki.json":
                dd.setdefault("czesci", {}).setdefault(n, {})["przesun"] = v
            elif n in dd["czesci"]:
                dd["czesci"][n]["przesun"] = v
        p.write_text(json.dumps(dd, ensure_ascii=False), encoding="utf-8")
    print(kto, len(przes), "korekt:", {n: v for n, v in przes.items()})
    if debug and rys:
        W = sum(i.width for i in rys); o = Image.new("RGBA", (W, max(i.height for i in rys))); x = 0
        for i in rys:
            o.paste(i, (x, 0)); x += i.width
        o.save(kat / "debug_wyrownaj.png")


if __name__ == "__main__":
    ktorzy = list(mc.POSTACIE) if sys.argv[1] == "all" else [sys.argv[1]]
    for k in ktorzy:
        if (mc.GRA / k / "postac.json").exists():
            jeden(k, "--nadpisz" in sys.argv, "--debug" in sys.argv)
