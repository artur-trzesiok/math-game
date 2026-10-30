"""Picture pairs for "spot the difference" (mechaniki2.js roznice): gpt-image draws a picture, then an EDIT of it with
the pair's changes spelled out; the code finds where the two differ (both blurred, so paper grain and brush jitter are
no change; the largest changed areas, as many as the pair has changes) and writes them as circles.

  python tools/roznice/make_roznice.py laka       # work/laka_a.png, laka_b.png -> game/assets/roznice/laka/

Output: a.webp, b.webp, meta.json {roznice: [{x, y, r}] in fractions of the picture}. Delete the work files to redraw.
A pair whose found areas are not as many as its changes is reported; look at work/<name>_roznice.png.
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
OUT = TU.parent.parent / "game" / "assets" / "roznice"
STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading with a fine paper-grain texture, warm
friendly colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO characters, NO text."""
PARY = {
    "laka": {
        "obraz": f"""A square picture of a sunny meadow: a small white cottage with a red roof and a round window, a wooden fence
with a little bird sitting on it, a big tree with red apples, three red tulips in front, a yellow sun and two
fluffy clouds, a butterfly. Big simple clear shapes, everything well apart.
{STYL}""",
        "zmiany": ["the little bird on the fence is GONE (just the fence there)", "the three tulips are BLUE instead of red",
                   "the round window of the cottage is now a SQUARE window"],
    },
    "rysunek": {
        "obraz": f"""A square picture of a child's crayon drawing pinned to a wall: a house with a red roof, a big yellow sun with
rays, a green tree, two flowers and a small cat, drawn with wax crayons on white paper, simple and cheerful.
{STYL.replace("NO characters, ", "")}""",
        "zmiany": ["the small cat is GONE", "the sun has NO rays", "the door of the house is RED instead of blue"],
    },
    "ogrodek": {
        "obraz": f"""A square picture of a vegetable garden: a wooden watering can, a row of three orange carrots sticking out of the
soil, a red ladybird on a big green leaf, a scarecrow with a straw hat, a blue bucket, a white fence behind.
{STYL}""",
        "zmiany": ["the ladybird is GONE", "the bucket is RED instead of blue", "the scarecrow has NO hat"],
    },
    "plaza": {
        "obraz": f"""A square picture of a sunny sandy beach by the sea: a red-and-white beach umbrella, a yellow bucket and spade, a
big sandcastle with one flag, a starfish on the sand, a sailing boat far on the sea, a seagull in the sky.
{STYL}""",
        "zmiany": ["the sandcastle's flag is GONE", "the starfish is PURPLE instead of orange", "the sailing boat is GONE"],
    },
    "pokoik": {
        "obraz": f"""A square picture of a cosy children's room corner: a shelf with three books and a toy car, a teddy bear sitting
on the floor, a red ball, a round rug, a window with green curtains, a picture of a boat on the wall.
{STYL}""",
        "zmiany": ["the red toy car on the shelf is GONE", "the red ball is GONE", "the boat picture shows a HOUSE instead"],
    },
    # front_back: hide and seek in the forest - five little animals hidden BEHIND things, each only partly showing
    "chowany_las": {
        "obraz": f"""A square picture of a sunny forest clearing seen from a little above: a big grey stone, a tree stump, the
trunk of a big tree, a large fern leaf, a red-capped mushroom, a log, a few flowers and tufts of grass. Lots of small
details, everything well apart.
{STYL}""",
        "zmiany": ["a little grey mouse hides BEHIND the stone, only its long tail and one ear showing past the stone's edge",
                   "a small brown rabbit hides BEHIND the tree stump, only its two long ears sticking up above the stump",
                   "a small bird hides BEHIND the big tree trunk, only its head and beak peeking out at the side",
                   "a little green frog hides BEHIND the large fern leaf, only its two eyes peeking over the leaf",
                   "a small snail hides BEHIND the mushroom, only its shell peeking out at the side of the stem"],
    },
    # grouping: the torn pieces of the forest map scattered on the forest floor
    "kawalki_mapy": {
        "obraz": f"""A square picture of a forest floor seen from close above: fallen autumn leaves in red, orange and yellow, a
fern, three pinecones, a small brown mushroom, a mossy root, a twig, a patch of green moss and a few acorns. Lots of
small details, everything well apart.
{STYL}""",
        "zmiany": ["a torn scrap of old yellowed map paper with tiny painted trees and part of a dotted path on it lies among the leaves",
                   "a torn scrap of old yellowed map paper with a bit of a small blue pond painted on it is half hidden under the fern",
                   "a torn scrap of old yellowed map paper with a painted red dotted path on it leans against the mushroom",
                   "a torn scrap of old yellowed map paper with a painted little oak tree on it lies on the moss by the root"],
    },
    # logical_pairs: the torn pieces of Mole's photo scattered over the workshop floor by the storm
    # (its build finds 3 areas: the hammer and sky scraps touch - meta.json was split into 4 by hand; redo after a rebuild)
    "kawalki_zdjecia": {
        "obraz": f"""A square picture of a cosy wooden workshop floor seen from close above: wooden planks, curly wood shavings, a
small saw, a tin of nails, a paint brush, a coil of string, a wooden bucket, a few screws and a rag. Lots of small
details, everything well apart.
{STYL}""",
        "zmiany": ["a torn scrap of an old photo with green grass and a red apple on it lies among the wood shavings",
                   "a torn scrap of an old photo with a bit of dark grey fur and a pink paw on it peeks out from under the rag",
                   "a torn scrap of an old photo with a wooden hammer handle on it lies beside the tin of nails",
                   "a torn scrap of an old photo with blue sky and a white cloud on it leans against the bucket"],
    },
    # up_down: the torn pieces of Fox's lift plan blown into the orchard grass
    "kawalki_planu": {
        "obraz": f"""A square picture of orchard grass seen from close above: fallen red apples, green leaves, a little wicker basket
on its side, the foot of a wooden ladder, a tree root, a few daisies and a snail. Lots of small details, everything
well apart.
{STYL}""",
        "zmiany": ["a torn scrap of squared paper with a pencil drawing of a brown tree trunk on it lies in the grass between the apples",
                   "a torn scrap of squared paper with a pencil drawing of a round wheel on it is caught under the ladder foot",
                   "a torn scrap of squared paper with a pencil drawing of a long rope on it lies beside the basket",
                   "a torn scrap of squared paper with a pencil drawing of a small basket on it lies by the tree root"],
    },
    # complete_shape: the torn pieces of Owl's picture hidden in the meadow, found through her spyglass
    "luneta_kawalki": {
        "obraz": f"""A square picture of a sunny meadow seen from close above: tall green grass, a few dandelions and daisies, a
low bush, a red-capped mushroom, a grey stone, a clump of clover and a fallen leaf. Lots of small details, everything well
apart.
{STYL}""",
        "zmiany": ["a torn scrap of white drawing paper with a piece of BLUE crayon sky and part of a YELLOW sun on it lies half hidden in the tall grass",
                   "a torn scrap of white drawing paper with a corner of a RED crayon roof on it peeks out from under the bush",
                   "a torn scrap of white drawing paper with a YELLOW crayon door on it leans against the mushroom",
                   "a torn scrap of white drawing paper with crayon RED FLOWERS and green grass on it lies beside the stone"],
    },
    # tall and short: the view through the spyglass (mechaniki3.js szukaj) - six mice hidden in the orchard; the code
    # finds each where the two pictures differ, the game shows only the second one
    "luneta_sad": {
        "obraz": f"""A square picture of a sunny orchard seen from high up in a treehouse: three apple trees of different
heights with red apples, a wooden fence, a wheelbarrow, a basket of apples on the grass, a little pond, a bush, flowers,
a stone and a tree stump. Lots of small details, everything well apart.
{STYL}""",
        "zmiany": ["a small grey mouse peeks out from behind the trunk of the tallest apple tree",
                   "a small grey mouse sits inside the wheelbarrow, only its head showing",
                   "a small grey mouse hides among the flowers",
                   "a small grey mouse sits on top of the tree stump",
                   "a small grey mouse peeks over the edge of the apple basket",
                   "a small grey mouse sits by the pond behind the stone"],
    },
}
ROZMYCIE = 3.0
PROG = 38


def gen(n: str) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    a, b = WORK / f"{n}_a.png", WORK / f"{n}_b.png"
    if not a.exists():
        figgen.generate(PARY[n]["obraz"], a, size="1024x1024", quality="high", background="opaque")
    if not b.exists():
        zm = "\n".join(f"  - {z};" for z in PARY[n]["zmiany"])
        figgen.generate(f"""Exactly the same illustration, unchanged in every way - same composition, same colours, same
light, same texture, every other thing exactly where it is - except these {len(PARY[n]["zmiany"])} changes:
{zm}
Do NOT change, move or redraw anything else.""", b, refs=[a], size="1024x1024", quality="high", background="opaque")


def build(n: str) -> None:
    A = np.asarray(Image.open(WORK / f"{n}_a.png").convert("RGB")).astype(float)
    B = np.asarray(Image.open(WORK / f"{n}_b.png").convert("RGB").resize((A.shape[1], A.shape[0]), Image.LANCZOS)).astype(float)
    d = np.abs(ndimage.gaussian_filter(A, (ROZMYCIE, ROZMYCIE, 0)) - ndimage.gaussian_filter(B, (ROZMYCIE, ROZMYCIE, 0))).max(axis=2)
    m = ndimage.binary_opening(d > PROG, iterations=2)
    m = ndimage.binary_closing(m, iterations=12)
    lab, ile = ndimage.label(m)
    pola = sorted(((int((lab == i).sum()), i) for i in range(1, ile + 1)), reverse=True)
    ile_zmian = len(PARY[n]["zmiany"])
    h, w = m.shape
    roznice = []
    # every changed area as a circle; overlapping circles are one change (the rays around a sun come in pieces)
    kola = []
    for pole, i in pola:
        ys, xs = np.nonzero(lab == i)
        kola.append([xs.mean(), ys.mean(), max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 + 18, pole])
    zlane = True
    while zlane:
        zlane = False
        for i1 in range(len(kola)):
            for i2 in range(i1 + 1, len(kola)):
                k1, k2 = kola[i1], kola[i2]
                if np.hypot(k1[0] - k2[0], k1[1] - k2[1]) < k1[2] + k2[2]:
                    x0, x1 = min(k1[0] - k1[2], k2[0] - k2[2]), max(k1[0] + k1[2], k2[0] + k2[2])
                    y0, y1 = min(k1[1] - k1[2], k2[1] - k2[2]), max(k1[1] + k1[2], k2[1] + k2[2])
                    kola[i1] = [(x0 + x1) / 2, (y0 + y1) / 2, max(x1 - x0, y1 - y0) / 2, k1[3] + k2[3]]
                    kola.pop(i2); zlane = True; break
            if zlane: break
    kola.sort(key=lambda k: -k[3]); pola = kola
    for cx, cy, r, pole in kola[:ile_zmian]:
        roznice.append({"x": round(cx / w, 4), "y": round(cy / h, 4), "r": round(max(r, 40) / w, 4), "pole": int(pole)})
    if len(pola) != ile_zmian:
        print(f"  {n}: {len(pola)} changed areas found for {ile_zmian} changes (the largest kept) - check work/{n}_roznice.png")
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    for k, arr in (("a", A), ("b", B)):
        Image.fromarray(arr.astype(np.uint8)).resize((768, 768), Image.LANCZOS).save(out / f"{k}.webp", "WEBP", quality=84, method=6)
    (out / "meta.json").write_text(json.dumps({"roznice": roznice}, indent=1), encoding="utf-8")
    # a review sheet: both pictures, every found area circled
    podglad = Image.new("RGB", (w * 2 + 20, h), "white")
    for j, arr in enumerate((A, B)):
        im = Image.fromarray(arr.astype(np.uint8)); dr = ImageDraw.Draw(im)
        for r in roznice: dr.ellipse([(r["x"] - r["r"]) * w, (r["y"] - r["r"]) * h, (r["x"] + r["r"]) * w, (r["y"] + r["r"]) * h], outline=(255, 40, 40), width=8)
        podglad.paste(im, (j * (w + 20), 0))
    podglad.resize((podglad.width // 2, podglad.height // 2)).save(WORK / f"{n}_roznice.png")
    print(f"{n}: {len(roznice)} differences")


if __name__ == "__main__":
    for n in sys.argv[1:] or PARY:
        gen(n); build(n)
