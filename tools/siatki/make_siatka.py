"""A painted grid for mechaniki5.js siatka: a bookcase / shelf / board with R rows x C columns of compartments.

  python tools/siatki/make_siatka.py regal_3x3      # -> game/assets/siatki/<name>/obraz.webp (transparent) + meta.json

gpt-image paints the thing with EMPTY compartments, then an EDIT of the same picture fills the back of every compartment
with flat magenta; the magenta blobs are the cells (sorted into rows by height, then by x). The count must be R x C, else
the picture is reported. The headers (row / column icons) are stickers the engine lays beside it, never painted in.
Review work/<name>_komorki.png; delete work/<name>.png (or <name>_b.png) to redraw.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

TU = Path(__file__).resolve().parent
sys.path.insert(0, str(TU.parent / "common"))
import figgen  # noqa: E402

ROOT = TU.parents[1]
WORK = TU / "work"
OUT = ROOT / "game" / "assets" / "siatki"
STYL = ("STYLE: a modern children's picture-book illustration, soft painterly shading with a fine paper-grain texture, warm "
        "friendly colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO text, NO letters, NO numbers.")
SIATKI = {
    # shelf_grid (and shelf_labels): a bookcase of nine cubbies, seen straight from the front
    "regal_3x3": {"wiersze": 3, "kolumny": 3, "lekcje": ["shelf_grid", "shelf_labels"],
                  "obraz": "A sturdy warm honey-coloured wooden BOOKCASE seen exactly from the front (no perspective, no side "
                           "visible), standing alone: THREE rows and THREE columns of equal, square, EMPTY open compartments "
                           "(nine cubbies), separated by thick wooden boards, a plain darker wooden back wall inside every "
                           "compartment, a little plinth at the bottom. The compartments are completely empty."},
}


def magenta(B: Image.Image) -> np.ndarray:
    a = np.asarray(B.convert("RGBA")).astype(float)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    m = (r > 170) & (b > 150) & (g < 110) & (np.abs(r - b) < 90) & (al > 128)
    return ndimage.binary_closing(ndimage.binary_opening(m, iterations=2), iterations=4)


def build(n: str) -> None:
    z = SIATKI[n]; WORK.mkdir(parents=True, exist_ok=True)
    R, C = z["wiersze"], z["kolumny"]
    a, b = WORK / f"{n}.png", WORK / f"{n}_b.png"
    if not a.exists():
        figgen.generate(f"{z['obraz']} On a fully TRANSPARENT background, the whole thing in the picture, NO shadow on the "
                        f"ground. {STYL}", a, size="1024x1024", quality="high", background="transparent")
    if not b.exists():
        figgen.generate(f"""Exactly the same illustration, unchanged in every way, with ONLY this added: the back wall of EVERY one of
the {R * C} compartments filled edge to edge with flat solid bright magenta (#FF00FF) - one magenta rectangle per compartment,
inside its wooden boards. The boards, the frame and the background stay exactly as they are; no other magenta anywhere.""",
                        b, refs=[a], size="1024x1024", quality="high", background="opaque")
    A = Image.open(a).convert("RGBA"); W, H = A.size
    lab, ile = ndimage.label(magenta(Image.open(b).resize(A.size, Image.LANCZOS)))
    pola = sorted(((int((lab == i).sum()), i) for i in range(1, ile + 1)), reverse=True)[:R * C]
    if len(pola) < R * C or pola[-1][0] < 0.3 * pola[0][0]:
        raise SystemExit(f"{n}: {len(pola)} compartments found for {R * C} - check work/{n}_b.png")
    boxes = []
    for _, i in pola:
        ys, xs = np.nonzero(lab == i)
        boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    boxes.sort(key=lambda q: (q[1] + q[3]) / 2)
    rzedy = [sorted(boxes[r * C:(r + 1) * C], key=lambda q: q[0]) for r in range(R)]
    # the thing's own box: the picture is cropped to it so the engine can size it by what is drawn
    bb = A.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    A = A.crop(bb); W, H = A.size
    komorki = [[[round((q[0] - bb[0]) / W, 4), round((q[1] - bb[1]) / H, 4), round((q[2] - q[0]) / W, 4), round((q[3] - q[1]) / H, 4)]
                for q in rz] for rz in rzedy]
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    s = min(1.0, 900 / max(W, H))
    A.resize((round(W * s), round(H * s)), Image.LANCZOS).save(out / "obraz.webp", "WEBP", quality=86, method=6, exact=True)
    (out / "meta.json").write_text(json.dumps({"szerokosc": round(W * s), "wysokosc": round(H * s), "wiersze": R, "kolumny": C,
                                               "komorki": komorki, "lekcje": z.get("lekcje", [])}, indent=1), encoding="utf-8")
    pod = Image.new("RGBA", A.size, (230, 230, 230, 255)); pod.alpha_composite(A); d = ImageDraw.Draw(pod)
    for r, rz in enumerate(komorki):
        for c, (x, y, w, h) in enumerate(rz):
            d.rectangle([x * W, y * H, (x + w) * W, (y + h) * H], outline=(255, 30, 30), width=5)
            d.text((x * W + 8, y * H + 6), f"{r},{c}", fill=(255, 0, 0))
    pod.convert("RGB").save(WORK / f"{n}_komorki.png")
    print(f"{n}: {R} x {C} cells -> {out}")


if __name__ == "__main__":
    for n in sys.argv[1:] or SIATKI:
        build(n)
