"""Found pictures (mechaniki3.js znalezisko): a picture someone finds in a story - a map, a photo, a drawing - with n
spots the child marks on it. gpt-image draws the picture, then an EDIT of it with a flat magenta disc on every spot
(described in words); the code finds the discs by the difference of the two (blurred) and writes them as circles. The
game shows the clean picture.

  python tools/znaleziska/make_znalezisko.py mapa_polany     # work/<name>_a.png, _b.png -> game/assets/znaleziska/<name>/

Output: obraz.webp, meta.json {szerokosc, wysokosc, cele: [{x, y, r}] in fractions of the width / height}. Review
work/<name>_cele.png; delete the work files to redraw. A picture whose found spots are not as many as asked is reported.
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

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "znaleziska"
STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading with a fine paper-grain texture, warm
friendly colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO text, NO letters, NO numbers."""
ZNALEZISKA = {
    # ordering: Beaver's old map of the way to the concert glade; where the path crosses the brook the stones go
    "mapa_polany": {
        "rozmiar": "1536x1024",
        "obraz": f"""An old hand-drawn treasure-style map on worn cream paper, seen flat from above, filling the whole picture:
a winding dotted footpath starts at a little beaver lodge on the left and leads to a round forest glade with a small
wooden stage and lanterns on the right. On the way ONE blue brook runs from the top edge to the bottom edge and the
footpath crosses it exactly once, in the middle of the map; no bridge there, the path simply meets the water on both
banks. A few little trees, a hill, two flowers drawn like a child's map. Big simple clear shapes.
{STYL}""",
        "cele": ["the one place where the dotted footpath crosses the blue brook"],
    },
}
ROZMYCIE = 2.0


def gen(n: str) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    z = ZNALEZISKA[n]; a, b = WORK / f"{n}_a.png", WORK / f"{n}_b.png"
    if not a.exists():
        figgen.generate(z["obraz"], a, size=z.get("rozmiar", "1024x1024"), quality="high", background="opaque")
    if not b.exists():
        miejsca = "\n".join(f"  - {c};" for c in z["cele"])
        figgen.generate(f"""Exactly the same illustration, unchanged in every way, with ONLY this added: a flat solid bright magenta
(#FF00FF) filled disc, about one tenth of the picture's height across, placed exactly on each of these
{len(z["cele"])} places:
{miejsca}
Nothing else changes; no other magenta anywhere.""", b, refs=[a], size=z.get("rozmiar", "1024x1024"), quality="high", background="opaque")


def build(n: str) -> None:
    z = ZNALEZISKA[n]
    A = Image.open(WORK / f"{n}_a.png").convert("RGB")
    B = np.asarray(Image.open(WORK / f"{n}_b.png").convert("RGB").resize(A.size, Image.LANCZOS)).astype(float)
    r, g, bl = B[..., 0], B[..., 1], B[..., 2]
    magenta = (r > 170) & (bl > 150) & (g < 110) & (np.abs(r - bl) < 90)       # the discs, wherever the edit put them
    m = ndimage.binary_closing(ndimage.binary_opening(ndimage.gaussian_filter(magenta.astype(float), ROZMYCIE) > 0.5, iterations=2), iterations=6)
    lab, ile = ndimage.label(m)
    pola = sorted(((int((lab == i).sum()), i) for i in range(1, ile + 1)), reverse=True)[:len(z["cele"])]
    w, h = A.size
    cele = []
    for pole, i in pola:
        ys, xs = np.nonzero(lab == i)
        rr = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
        cele.append({"x": round(xs.mean() / w, 4), "y": round(ys.mean() / h, 4), "r": round(max(rr * 1.25, 0.05 * w) / w, 4)})
    if len(cele) != len(z["cele"]):
        print(f"  {n}: {len(cele)} spots found for {len(z['cele'])} asked - check work/{n}_cele.png")
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    k = 1024 / max(w, h)
    A.resize((round(w * k), round(h * k)), Image.LANCZOS).save(out / "obraz.webp", "WEBP", quality=84, method=6)
    (out / "meta.json").write_text(json.dumps({"szerokosc": round(w * k), "wysokosc": round(h * k), "cele": cele}, indent=1), encoding="utf-8")
    podglad = A.copy(); dr = ImageDraw.Draw(podglad)
    for c in cele: dr.ellipse([(c["x"] - c["r"]) * w, c["y"] * h - c["r"] * w, (c["x"] + c["r"]) * w, c["y"] * h + c["r"] * w], outline=(255, 40, 40), width=8)
    podglad.resize((w // 2, h // 2)).save(WORK / f"{n}_cele.png")
    print(f"{n}: {len(cele)} spots")


if __name__ == "__main__":
    for n in sys.argv[1:] or ZNALEZISKA:
        gen(n); build(n)
