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
    # logical_pairs: an old photo of Mole in Beaver's workshop - what he holds in his paw (the hammer) says whose it is
    "zdjecie_kreta": {
        "rozmiar": "1024x1024",
        "obraz": f"""An old family photograph drawn as a picture-book illustration: a square picture with a wide white paper
border, slightly faded warm colours, filling the whole image. In the photo, in the middle, stands a small friendly
cartoon MOLE, front view, full figure: round body covered in soft dark grey fluffy fur with a lighter grey-brown belly,
a round head, small shiny dark brown eyes, rosy pink cheeks, a small round pink nose, a happy open smile, short arms
with PINK paws and long pale cream claws, short legs with pink feet; no clothes, no glasses. In ONE raised paw he
proudly holds a small wooden HAMMER with a grey metal head, clearly visible beside his body. Behind him the round
earthen entrance of his burrow in a green grassy hill, and a little crooked wooden shelf on a post. On the grass at his
feet a red apple and a small yellow flower, well apart from him. Big simple clear shapes.
{STYL}""",
        "cele": ["on the small hammer in the mole's raised paw (the disc covers the whole hammer, its metal head and its wooden handle down to the paw)"],
    },
    # grouping_pro: a map of the forest the wind blows in - the path of red leaves leads to the big oak (Fox's home)
    "mapa_lasu": {
        "rozmiar": "1536x1024",
        "obraz": f"""A simple hand-drawn map of a forest on worn cream paper, seen flat from above, filling the whole picture.
At the bottom middle a small round meadow. From the meadow THREE separate footpaths go up into the forest, fanning out,
far apart, never crossing or touching each other:
  - the LEFT path is strewn with small YELLOW leaves and ends at the top left at a little burrow in a low hill;
  - the MIDDLE path is strewn with small GREEN leaves and ends at the top middle at a little wooden hut by a pond;
  - the RIGHT path is strewn with small bright RED leaves and ends at the top right at one BIG OAK TREE with a little
    round door in its trunk.
Every path carries leaves of ONE colour only, clearly visible along its whole length. Between the paths little trees
drawn simply with soft green crowns, a few bushes, like a child's map. Big simple clear shapes.
{STYL}""",
        "cele": ["the big oak tree with the little round door at the top right, at the very end of the path of red leaves"],
    },
    # queue: Beaver's photo of the finish line - the hedgehog's nose touches the line first, the bunny just behind
    "fotofinisz": {
        "rozmiar": "1536x1024",
        "obraz": f"""A photo-finish photograph of a little forest race, drawn as a picture-book illustration: an oblong picture
filling the whole image, warm slightly faded colours like a printed photo. A sunny meadow seen from the side and a little
from above. Four straight racing lanes of mown grass run from left to right, one above the other, separated by thin white
chalk lines. Near the RIGHT edge a wide white chalk FINISH LINE crosses all four lanes from top to bottom, with a wooden
post beside it topped by a small red-and-white checkered flag. All four racers run towards the RIGHT, side view, one in
each lane, nobody overlapping anybody:
  - top lane: a big grey BUNNY with long upright pink-lined ears and a white fluffy tail, close to the finish line but
    still half a step BEFORE it;
  - second lane: a small round brown HEDGEHOG with a cream face, rosy cheeks, a black button nose and brown spines; the
    tip of its nose is already ON the white finish line - it is the FIRST to reach it;
  - third lane: a fluffy yellow DUCKLING with an orange beak, a step further behind than the bunny;
  - bottom lane: a little grey MOUSE with big round pink ears, far behind, on the left side of the picture.
Happy faces, running poses, big simple clear shapes. NO people.
{STYL}""",
        "cele": ["on the small brown hedgehog in the second lane, whose nose touches the finish line (the disc covers its head and body)",
                 "on the little grey mouse far behind in the bottom lane (the disc covers its head and body)"],
    },
    # front_back: Bunny's snapshot of the hide-and-seek - the mouse's ears peek out from behind the maze's hedge
    "zdjecie_chowany": {
        "rozmiar": "1536x1024",
        "obraz": f"""A snapshot photograph of a game of hide-and-seek in a sunny park garden, drawn as a picture-book
illustration: an oblong picture filling the whole image, warm slightly faded colours like a printed photo, taken from
close by. Across the middle of the picture runs a LOW neat trimmed green HEDGE, only a little taller than the hen, the
outer wall of a hedge maze, with an arched opening at the right end leading inside. On the grass in front of it: on the
LEFT a small wooden bench, and IN FRONT of the bench stands a big white HEN with a red comb, full figure, fully visible.
In the MIDDLE, BEHIND the hedge, a grey MOUSE is hiding: the top of her head with two BIG round pink ears and her two
eyes peek out over the top of the hedge, clearly visible, her head about as big as the hen's head; all the rest of her
is hidden by the hedge. A round flower bed with red and yellow flowers at the front right, blue sky and round trees
above the hedge. Big simple clear shapes. NO people.
{STYL}""",
        "cele": ["on the little grey mouse's head and two pink ears peeking out over the top of the hedge"],
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
