"""Colour-by-number pictures (mechaniki.js kolorowanka): gpt-image draws a picture in FLAT colours with thick black
outlines (a coloured-in colouring page); the code takes it apart - the outlines (dark pixels) become the line layer, every
area between them a region with its flat colour; the colours are clustered into a small palette, numbered 1..k.

  python tools/kolorowanki/make_kolorowanka.py domek     # work/domek.png -> game/assets/kolorowanki/domek/

Output: linie.webp (the outlines on transparency), regiony.png (region index in the red channel, 0 = outline or
outside), meta.json {szerokosc, wysokosc, paleta: [hex], regiony: [{id, kolor (1..k), x, y, pole}]}. Delete the work
file to redraw.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "kolorowanki"
STYL = """A colouring-book page for small children that is already coloured in: big simple shapes, every area filled
with ONE FLAT colour (no shading, no gradients, no texture, no small details), separated by THICK black outlines that
close every area, on a plain WHITE background, nothing touching the edges. At most six different colours in the whole
picture. NO text, NO numbers."""
KOLOROWANKI = {
    "domek": f"""A small cottage with a red roof, a yellow wall, a blue door and two windows, a big round yellow sun
in the sky, one green tree with a brown trunk beside the house, green grass along the bottom.
{STYL}""",
}
CIEMNE = 70          # an outline pixel: all channels below this
MIN_POLE = 600       # px: smaller areas are dropped (bits of outline, tiny gaps)
PALETA_MAKS = 6


def gen(n: str) -> Path:
    WORK.mkdir(parents=True, exist_ok=True)
    dst = WORK / f"{n}.png"
    if not dst.exists():
        figgen.generate(KOLOROWANKI[n], dst, size="1024x1024", quality="high", background="opaque")
    return dst


def build(n: str) -> None:
    im = np.asarray(Image.open(WORK / f"{n}.png").convert("RGB")).astype(int)
    h, w, _ = im.shape
    linia = im.max(axis=2) < CIEMNE
    linia = ndimage.binary_dilation(linia, iterations=1)                 # close hairline gaps between areas
    bialy = im.min(axis=2) > 235
    pola, ile = ndimage.label(~linia)
    regiony, kolory = [], []
    mapa = np.zeros((h, w), np.uint8)
    for i in range(1, ile + 1):
        m = pola == i
        pole = int(m.sum())
        if pole < MIN_POLE: continue
        sr = np.median(im[m], axis=0)
        if bialy[m].mean() > 0.6: continue                                # the white page around the picture
        if m[0, :].any() or m[-1, :].any() or m[:, 0].any() or m[:, -1].any(): continue
        if len(regiony) >= 254: break
        rid = len(regiony) + 1
        mapa[m] = rid
        ys, xs = np.nonzero(ndimage.binary_erosion(m, iterations=6) if ndimage.binary_erosion(m, iterations=6).any() else m)
        # the label goes where the region is deepest (the distance transform's peak), not at a centroid outside it
        d = ndimage.distance_transform_edt(m); cy, cx = np.unravel_index(np.argmax(d), d.shape)
        regiony.append({"id": rid, "x": int(cx), "y": int(cy), "pole": pole, "r": float(d.max())}); kolory.append(sr)
    # cluster the regions' colours into a small palette (k-means on RGB, seeded by the most distinct ones)
    K = np.array(kolory, float)
    cent = [K[np.argmax([r["pole"] for r in regiony])]]
    while len(cent) < min(PALETA_MAKS, len(K)):
        dmin = np.min([np.linalg.norm(K - c, axis=1) for c in cent], axis=0)
        if dmin.max() < 45: break
        cent.append(K[np.argmax(dmin)])
    cent = np.array(cent)
    for _ in range(10):
        lab = np.argmin(((K[:, None] - cent[None]) ** 2).sum(-1), axis=1)
        cent = np.array([K[lab == j].mean(0) if (lab == j).any() else cent[j] for j in range(len(cent))])
    lab = np.argmin(((K[:, None] - cent[None]) ** 2).sum(-1), axis=1)
    for r, j in zip(regiony, lab): r["kolor"] = int(j) + 1
    paleta = ["#%02x%02x%02x" % tuple(int(v) for v in c) for c in cent]
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    rgba = np.zeros((h, w, 4), np.uint8); rgba[..., 3] = (im.max(axis=2) < CIEMNE) * 255
    Image.fromarray(rgba, "RGBA").save(out / "linie.webp", "WEBP", quality=90, method=6, exact=True)
    rgb = np.zeros((h, w, 3), np.uint8); rgb[..., 0] = mapa
    Image.fromarray(rgb, "RGB").save(out / "regiony.png", optimize=True)
    (out / "meta.json").write_text(json.dumps({"szerokosc": w, "wysokosc": h, "paleta": paleta, "regiony": regiony}, indent=1), encoding="utf-8")
    print(f"{n}: {len(regiony)} regions, palette {paleta}")


if __name__ == "__main__":
    for n in sys.argv[1:] or KOLOROWANKI:
        gen(n); build(n)
