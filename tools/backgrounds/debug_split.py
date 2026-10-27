"""Review sheet of a background split: python tools/backgrounds/debug_split.py <scene>|all
-> work/split_<scene>.png: the plate with every prop's outline (cyan = sways, magenta = drifts)
and its index, the horizon (yellow), and below it every prop on a checkerboard, numbered, so a
piece of redrawn plate stuck to a prop (leaves on a cloud) shows at a glance."""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

TU = Path(__file__).resolve().parent
ROOT = TU.parent.parent


def sheet(nazwa: str) -> Path:
    kat = TU / "work" / nazwa
    opis = json.loads((kat / "rekwizyty.json").read_text(encoding="utf-8"))
    plyta = Image.open(kat / opis["plyta"]).convert("RGB")
    W, H = plyta.size
    over = plyta.copy(); d = ImageDraw.Draw(over)
    d.line([(0, opis["horyzont"]), (W, opis["horyzont"])], fill=(255, 230, 0), width=2)
    thumbs = []
    for i, r in enumerate(opis["rekwizyty"]):
        im = Image.open(kat / r["plik"]).convert("RGBA")
        a = np.asarray(im)[:, :, 3] > 100
        brzeg = a & ~ndimage.binary_erosion(a, iterations=2)
        kol = (0, 230, 255) if r["klasa"] == "sway" else (255, 0, 200)
        ys, xs = np.nonzero(brzeg)
        px = over.load()
        for y, x in zip(ys + r["y"], xs + r["x"]):
            if 0 <= x < W and 0 <= y < H:
                px[x, y] = kol
        d.text((r["x"] + 3, r["y"] + 2), str(i), fill=kol)
        szach = Image.new("RGB", im.size, (200, 200, 200))
        cd = ImageDraw.Draw(szach)
        for y in range(0, im.height, 12):
            for x in range(0, im.width, 12):
                if (x // 12 + y // 12) % 2:
                    cd.rectangle([x, y, x + 11, y + 11], fill=(150, 150, 150))
        szach.paste(im, (0, 0), im)
        s = min(1.0, 220 / max(im.size))
        t = szach.resize((max(1, int(im.width * s)), max(1, int(im.height * s))))
        ImageDraw.Draw(t).text((3, 2), f"{i} {r['klasa']}", fill=kol)
        thumbs.append(t)
    rows, row, x = [], [], 0
    for t in thumbs:
        if x + t.width > W and row:
            rows.append(row); row, x = [], 0
        row.append(t); x += t.width + 6
    if row:
        rows.append(row)
    hh = sum(max(t.height for t in r) + 6 for r in rows)
    out = Image.new("RGB", (W, H + hh + 10), (40, 40, 40))
    out.paste(over, (0, 0))
    y = H + 10
    for r in rows:
        x = 0
        for t in r:
            out.paste(t, (x, y)); x += t.width + 6
        y += max(t.height for t in r) + 6
    dst = ROOT / "work" / f"split_{nazwa}.png"
    dst.parent.mkdir(exist_ok=True)
    out.save(dst)
    return dst


if __name__ == "__main__":
    kto = sys.argv[1] if len(sys.argv) > 1 else "all"
    for n in sorted(p.name for p in (TU / "work").iterdir() if (p / "rekwizyty.json").exists()) if kto == "all" else [kto]:
        print(sheet(n))
