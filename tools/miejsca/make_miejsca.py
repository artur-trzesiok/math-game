"""Drop places on a painted room (ctx.miejsca): the shelves, hooks, table and rug the scenery already shows become
places the child puts things ON. gpt-image paints one flat magenta patch over the named surface (one edit per place:
neighbouring shelves painted in one edit merged), the code keeps the patch's box.

  python tools/miejsca/make_miejsca.py przedpokoj      # -> game/assets/backgrounds/przedpokoj/miejsca.json
  python tools/miejsca/make_miejsca.py                 # every scene in MIEJSCA

A place has a kind: "stoi" (things stand on it - their feet on the patch's lower part), "wisi" (things hang from it - their
top at the patch) or "lezy" (things lie on it, centred). Review work/<scene>_miejsca.png; delete work/<scene>_<place>.png
to repaint one.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent / "work"
PLATES = ROOT / "tools" / "backgrounds" / "work"
OUT = ROOT / "game" / "assets" / "backgrounds"

# scene: {place: (kind, where the patch goes)}
MIEJSCA = {
    "dziupla_wnetrze": {
        "polka_duza": ("stoi", "the BIG long wooden wall shelf on the LEFT of the round window (the shelf board and the space just above it)"),
        "polka_mala": ("stoi", "the SMALL short wooden wall shelf on the RIGHT of the round window (the shelf board and the space just above it)"),
    },
    "dom": {
        "stol": ("stoi", "the whole flat TOP SURFACE of the big wooden kitchen table in the middle (only the table top, not the legs or chairs)"),
        "polka_gorna": ("stoi", "the UPPER small wooden wall shelf on the left, above the counter, with the jars standing on it (the shelf board and the space just above it where the jars stand)"),
        "polka_dolna": ("stoi", "the LOWER small wooden wall shelf on the left, with the little jars and the pot on it (the shelf board and the space just above it)"),
        "blat": ("stoi", "the long kitchen COUNTER TOP along the back wall, between the fridge and the cupboard, just under the window (only the counter's top surface)"),
        "kredens": ("stoi", "the middle glass-doored shelf of the tall green cupboard on the right, where the plates and bowls stand"),
    },
    "pokoj": {
        "lozko": ("lezy", "the blue blanket on top of the bed on the left (the flat top of the bed)"),
        "dywan": ("lezy", "the round blue-and-cream rug on the floor in the middle"),
        "regal_gora": ("stoi", "the TOP shelf of the wooden bookcase on the right, where the books stand (the shelf board and the space just above it)"),
        "regal_srodek": ("stoi", "the MIDDLE shelf of the wooden bookcase on the right, with the white and green boxes (the shelf board and the space just above it)"),
        "regal_dol": ("stoi", "the BOTTOM shelf of the wooden bookcase on the right, with the blue and yellow baskets (the shelf board and the space just above it)"),
        "parapet": ("stoi", "the white window SILL under the big window in the middle (only the sill)"),
    },
    "przedpokoj": {
        "wieszak": ("wisi", "the wooden board with five black HOOKS on the wall in the middle (the board and its hooks)"),
        "szafka_gora": ("stoi", "the flat TOP surface of the low wooden shoe rack on the left"),
        "szafka_srodek": ("stoi", "the MIDDLE shelf inside the low wooden shoe rack on the left (the shelf board and the space just above it)"),
        "szafka_dol": ("stoi", "the BOTTOM shelf inside the low wooden shoe rack on the left, just above the floor (the shelf board and the space just above it)"),
        "wycieraczka": ("lezy", "the brown doormat on the floor in front of the door on the right"),
    },
    "pokoj_noc": {
        "lozko": ("lezy", "the blue blanket on top of the bed on the left (the flat top of the bed)"),
        "dywan": ("lezy", "the round blue-and-cream rug on the floor in the middle"),
        "regal_gora": ("stoi", "the TOP shelf of the wooden bookcase on the right, where the books stand (the shelf board and the space just above it)"),
        "regal_srodek": ("stoi", "the MIDDLE shelf of the wooden bookcase on the right, with the white and green boxes (the shelf board and the space just above it)"),
        "regal_dol": ("stoi", "the BOTTOM shelf of the wooden bookcase on the right, with the blue and yellow baskets (the shelf board and the space just above it)"),
        "szafka_nocna": ("stoi", "the floor right next to the little glowing lamp beside the bed, where the lamp stands"),
    },
}


def magenta(p: Path, size) -> np.ndarray:
    B = np.asarray(Image.open(p).convert("RGB").resize(size, Image.LANCZOS)).astype(float)
    r, g, b = B[..., 0], B[..., 1], B[..., 2]
    m = (r > 170) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)
    m = ndimage.binary_closing(ndimage.binary_opening(ndimage.gaussian_filter(m.astype(float), 2.0) > 0.5, iterations=2), iterations=6)
    lab, n = ndimage.label(m)
    if not n: return m
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    return lab == (int(np.argmax(sizes)) + 1)                                # one place = its biggest patch


def build(scene: str) -> None:
    plate = PLATES / scene / "plyta.png"
    A = Image.open(plate).convert("RGB"); w, h = A.size
    WORK.mkdir(parents=True, exist_ok=True)
    out = {}
    for name, (kind, where) in MIEJSCA[scene].items():
        b = WORK / f"{scene}_{name}.png"
        if not b.exists():
            print(f"  {scene}/{name}: painting the patch...", flush=True)
            figgen.generate(f"""Exactly the same picture, unchanged in every way, with ONLY this added: ONE flat solid bright magenta
(#FF00FF) patch painted exactly over {where}, following its shape and covering it completely. Nothing else changes; no
other magenta anywhere.""", b, refs=[plate], size=f"{w}x{h}", quality="high", background="opaque")
        m = magenta(b, (w, h))
        if m.sum() < 400: print(f"  {scene}/{name}: NO patch found - check {b.name}"); continue
        ys, xs = np.nonzero(m)
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        out[name] = {"rodzaj": kind, "x": round((x0 + x1) / 2 / w, 4), "y": round((y0 + y1) / 2 / h, 4),
                     "w": round((x1 - x0) / w, 4), "h": round((y1 - y0) / h, 4)}
    (OUT / scene / "miejsca.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    pod = A.copy(); d = ImageDraw.Draw(pod)
    for n, p in out.items():
        X0, Y0 = (p["x"] - p["w"] / 2) * w, (p["y"] - p["h"] / 2) * h
        d.rectangle([X0, Y0, X0 + p["w"] * w, Y0 + p["h"] * h], outline=(255, 40, 40), width=6)
        d.text((X0 + 8, Y0 + 6), f"{n} ({p['rodzaj']})", fill=(255, 255, 255))
    pod.resize((w // 2, h // 2)).save(WORK / f"{scene}_miejsca.png")
    print(f"{scene}: {len(out)} places")


if __name__ == "__main__":
    for s in sys.argv[1:] or MIEJSCA:
        build(s)
