"""Draws the joint measurement of every chain piece: python tools/characters/debug_stawy.py <kto>
-> work/stawy_<kto>.png: the piece, its geodesic field (dark at the pivot, light at the tip),
the pivot (yellow) and the joints (magenta), labelled with their names."""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from stawy import CELL, CHARACTERS, ROOT, TORSO, field  # noqa: E402

kto = sys.argv[1]
kat = CHARACTERS / kto
d = json.loads((kat / "postac.json").read_text(encoding="utf-8"))
tiles = []
for kosc in d["kosci"].values():
    n, specs = kosc.get("czesc"), kosc.get("stawy")
    if not specs or n not in d["czesci"]:
        continue
    cz = d["czesci"][n]
    im = Image.open(kat / "czesci" / cz["plik"]).convert("RGBA")
    a = np.asarray(im)[:, :, 3]
    h, w = a.shape[0] // CELL, a.shape[1] // CELL
    mask = a[: h * CELL, : w * CELL].reshape(h, CELL, w, CELL).max(axis=(1, 3)) > 40
    os_ = cz.get("os") or [cz["x"] + cz["w"] / 2, cz["y"]]
    t = d["czesci"][TORSO[cz.get("widok", "przod")]]
    s = field(mask, ((os_[0] - cz["x"]) / CELL, (os_[1] - cz["y"]) / CELL), ((t["x"] + t["w"] / 2 - cz["x"]) / CELL, (t["y"] + t["h"] / 2 - cz["y"]) / CELL), kosc.get("dystalnie", "dol"))
    ok = np.isfinite(s); s = np.nan_to_num(s)
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., 0] = (s * 255).astype(np.uint8); rgba[..., 1] = (s * 180).astype(np.uint8); rgba[..., 2] = 255 - (s * 200).astype(np.uint8)
    rgba[..., 3] = np.where(ok, 150, 0)
    f = Image.fromarray(rgba).resize((w * CELL, h * CELL), Image.NEAREST)
    tile = Image.new("RGBA", im.size, (235, 235, 235, 255))
    tile.alpha_composite(im)
    tile.alpha_composite(f.crop((0, 0) + im.size) if f.size >= im.size else f)
    dr = ImageDraw.Draw(tile)
    ox, oy = os_[0] - cz["x"], os_[1] - cz["y"]
    dr.ellipse((ox - 9, oy - 9, ox + 9, oy + 9), outline=(255, 220, 0), width=4)
    for sp, j in zip(specs, cz.get("stawy", [])):
        x, y = j["x"] - cz["x"], j["y"] - cz["y"]
        dr.ellipse((x - 8, y - 8, x + 8, y + 8), fill=(255, 0, 200))
        dr.text((x + 10, y - 6), sp["nazwa"], fill=(0, 0, 0))
    dr.text((4, 4), n, fill=(0, 0, 0))
    tiles.append(tile)
H = 420
tiles = [t.resize((max(1, int(t.width * H / t.height)), H)) if t.height > H else t for t in tiles]
rows, row, x = [], [], 0
for t in tiles:
    if x + t.width > 1800 and row: rows.append(row); row, x = [], 0
    row.append(t); x += t.width + 8
rows.append(row)
out = Image.new("RGBA", (1800, sum(max(t.height for t in r) + 8 for r in rows)), (255, 255, 255, 255))
y = 0
for r in rows:
    x = 0
    for t in r: out.alpha_composite(t, (x, y)); x += t.width + 8
    y += max(t.height for t in r) + 8
dst = ROOT / "work" / f"stawy_{kto}.png"; dst.parent.mkdir(exist_ok=True)
out.save(dst); print(dst)
