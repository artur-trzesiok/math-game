"""Found pictures (mechaniki3.js znalezisko): a picture someone finds in a story - a map, a photo, a drawing - with n
spots the child marks on it. gpt-image draws the picture, then an EDIT of it with a flat magenta disc on every spot
(described in words); the code finds the discs by the difference of the two (blurred) and writes them as circles. The
game shows the clean picture.

  python tools/znaleziska/make_znalezisko.py mapa_polany     # work/<name>_a.png, _b.png -> game/assets/znaleziska/<name>/

A spot may be a whole PATH ({"droga": "the short path from ... to ..."}): the edit paints a thick magenta line along
all of it, and the build keeps its centre line ("droga": points) - the child taps anywhere on the path, a small disc on
a plain stretch of path gave a little one nothing to recognise.
Output: obraz.webp, meta.json {szerokosc, wysokosc, cele: [{x, y, r, droga?}] in fractions of the width / height}. Review
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
    # grouping: a map of the forest the wind blows in - the path of red leaves leads to the big oak (Fox's home)
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
    # long_short: Deer's map from the meadow to the picnic glade - two paths from one start, the straight one shorter
    "mapa_pikniku": {
        "rozmiar": "1536x1024",
        "obraz": f"""A simple hand-drawn map on worn cream paper, seen flat from above, filling the whole picture, like a
child's map. At the BOTTOM MIDDLE a small round green meadow with a little lake. At the TOP MIDDLE a small sunny glade
with a red-and-white checked picnic blanket and a wicker basket on it. From the meadow TWO footpaths lead up to the
picnic glade; both start at the same spot on the meadow and both end at the blanket:
  - the LEFT path is SHORT: a gently curving dotted brown path that goes up almost straight from the meadow to the
    blanket, on the left side of the middle;
  - the RIGHT path is LONG: a dotted brown path that bends far away to the right, winds in big loops round a round
    hill with a rock on the right side of the map, goes down and up again in a long zigzag, and only then comes back
    to the blanket.
The two paths are far apart and never cross or touch each other between the meadow and the blanket. A few little
trees with round green crowns and some bushes between them, drawn simply. Big simple clear shapes.
{STYL}""",
        "cele": [{"droga": "the whole SHORT left dotted path, from the meadow up to the picnic blanket"},
                 {"droga": "the whole LONG right dotted path, from the meadow round the hill and back to the picnic blanket"}],
    },
    # shapes: Hedgehog's drawing of the house he dreams of - the roof is a triangle (no digits, no text: before numbers)
    "rysunek_domku": {
        "rozmiar": "1024x1024",
        "obraz": f"""A child's crayon drawing on a sheet of white paper with slightly crumpled edges, seen flat from above,
filling the whole picture, drawn as a picture-book illustration. On the drawing ONE little house built ONLY of simple flat
geometric shapes, big in the middle, drawn with bold crayon lines and coloured in with crayon strokes:
  - the walls are ONE big BLUE SQUARE;
  - on top of the walls the roof is ONE big YELLOW TRIANGLE pointing up, as wide as the walls;
  - on the right side of the walls ONE small RED CIRCLE window;
  - on the left side of the walls ONE GREEN upright RECTANGLE door standing on the ground.
Under the house a strip of green crayon grass, above it light blue crayon sky with two little fluffy clouds. NO sun, NO
other circles, NO other triangles, NO trees, NO animals, NO people. Big simple clear shapes.
{STYL}""",
        "cele": ["on the big yellow triangle roof on top of the house (the disc in the middle of the triangle)"],
    },
    # tangram: the poster of Owl's shadow theatre - the cat's shadow is made of pieces, its ears are two small triangles
    "plakat_teatru": {
        "rozmiar": "1024x1024",
        "obraz": f"""A hand-painted poster for a children's shadow theatre on warm cream paper with a thin red painted border
and two little paper corners, seen flat, filling the whole picture. In the middle, BIG, the dark purple-grey SHADOW of a
CAT made of flat geometric tangram pieces, sitting sideways, facing right: the body is ONE big right-angled TRIANGLE
(its long slope is the cat's back), the head is ONE SQUARE turned like a diamond sitting on the top corner of the body,
and on top of the head TWO SMALL pointed TRIANGLES are the ears, clearly apart from each other. Thin light lines show
where the pieces meet. In the lower left corner a small shadow of a FISH made of a turned square and a triangle tail,
in the lower right corner a small shadow of a sailing BOAT made of a triangle sail on a long boat shape. A few small
painted yellow stars around. NO text, NO letters, NO numbers, NO animals other than these shadows, NO people.
{STYL}""",
        "cele": ["on the LEFT small triangle ear on top of the big cat's head (a small disc covering only that ear)",
                 "on the RIGHT small triangle ear on top of the big cat's head (a small disc covering only that ear)"],
    },
    # counting_3: Bear's grandma's recipe for the birthday cake - the drawing shows how many raspberries go on top (three)
    "przepis_tort": {
        "rozmiar": "1536x1024",
        "obraz": f"""An old hand-drawn recipe card on warm cream paper with slightly worn edges and a little grease spot,
seen flat from above, filling the whole picture, drawn like a grandmother's cookbook page with no words. In the MIDDLE,
BIG, a round birthday cake on a white plate, seen from the side and a little from above: golden sponge with pink cream
and pink icing on top. On top of the cake lie EXACTLY THREE big red RASPBERRIES, one on the left, one in the middle, one
on the right, far apart from each other, each one big and clearly visible, nothing else on top of the cake. Around the
cake, small and well apart: a wooden spoon on the left, a white egg and a small jug of milk on the right, a little sack
of flour at the bottom left. NO other berries, NO other red round things, NO candles, NO cherries, NO strawberries.
NO text, NO letters, NO numbers, NO animals, NO people. Big simple clear shapes.
{STYL}""",
        "cele": ["on the LEFT raspberry on top of the cake (a disc covering only that raspberry)",
                 "on the MIDDLE raspberry on top of the cake (a disc covering only that raspberry)",
                 "on the RIGHT raspberry on top of the cake (a disc covering only that raspberry)"],
    },
    # up_down: Fox's plan of the apple lift - the wheel goes at the top, on the branch; the basket at the bottom, in the grass
    "plan_windy": {
        "rozmiar": "1024x1024",
        "obraz": f"""A plan drawn with coloured pencils on a sheet of light squared paper with a torn edge, seen flat from above,
filling the whole picture, like an inventor's sketch with no words. It shows ONE apple tree, big, from the side: a brown
trunk, a round green crown at the TOP of the picture with ONE long straight branch reaching out to the right. At the very
end of that branch, at the TOP of the picture, hangs ONE round WOODEN WHEEL with four spokes (a pulley). A thin rope
goes over the wheel and hangs straight down to the BOTTOM of the picture, where ONE empty wicker BASKET stands on green
grass. Big clear distance between the wheel at the top and the basket at the bottom. NO apples, NO birds, NO sun, NO
animals, NO people, NO arrows, NO text, NO letters, NO numbers. Big simple clear shapes.
{STYL}""",
        "cele": ["on the round wooden wheel at the end of the branch at the top of the picture (the disc covering the wheel)",
                 "on the wicker basket standing on the grass at the bottom of the picture (the disc covering the basket)"],
    },
    # counting_5: Owl's order note slipped under the bakery door - she drew how many rolls she wants (four)
    "zamowienie_sowy": {
        "rozmiar": "1536x1024",
        "refs": ["game/assets/objects/bulka.webp"],
        "obraz": f"""A small order note on a sheet of cream notepaper with a torn top edge, seen flat from above, filling the
whole picture, drawn with soft coloured pencils with no words. Across the middle of the note, in ONE row, EXACTLY FOUR
round golden bread ROLLS with a cross cut on top, like the roll in the reference picture but drawn with pencils on the
paper (NOT a sticker, NO white outline), all four the same size, big, well apart from each other, nothing between them.
In the top right corner ONE small soft grey-brown owl FEATHER. Nothing else on the note: NO other rolls, NO other round
things, NO bag, NO coins, NO animals, NO people, NO text, NO letters, NO numbers. Big simple clear shapes.
{STYL}""",
        "cele": ["on the FIRST roll from the left (a disc covering only that roll)",
                 "on the SECOND roll from the left (a disc covering only that roll)",
                 "on the THIRD roll from the left (a disc covering only that roll)",
                 "on the FOURTH roll from the left, the last one on the right (a disc covering only that roll)"],
    },
    # adding_5: Fox's picnic invitation - everyone he invited is painted on it; who is not on the blanket yet?
    "zaproszenie_lisa": {
        "rozmiar": "1536x1024",
        "refs": ["game/assets/objects/slimak.webp", "game/assets/objects/jez.webp", "game/assets/objects/motyl.webp",
                 "game/assets/objects/mysz.webp", "game/assets/objects/kaczatko_stoi.webp"],
        "obraz": f"""A picnic invitation card painted on thick cream card paper, with a narrow red-and-white checked border like
a picnic blanket, seen flat, filling the whole picture, with no words. Across the middle of the card, standing on ONE
long strip of green grass, FIVE little guests in ONE row, well apart from each other, all about the same height, each
one looking exactly like the animal in its reference picture (the same colours and shapes), but painted on the card
(NOT stickers, NO white outlines). From LEFT to RIGHT:
  1. a small SNAIL with an orange spiral shell (reference 1), drawn as big as the others;
  2. a brown HEDGEHOG with a cream face (reference 2);
  3. a BUTTERFLY with orange, yellow and blue wings, sitting on a flower (reference 3);
  4. a little grey MOUSE with big pink ears (reference 4);
  5. a fluffy yellow DUCKLING with an orange beak (reference 5).
Above them a few small painted flowers and a little sun in the corner. NO fox, NO other animals, NO people, NO text, NO
letters, NO numbers. Big simple clear shapes.
{STYL}""",
        "cele": ["on the SNAIL, the first guest on the left (a disc covering only the snail)",
                 "on the HEDGEHOG, the second guest from the left (a disc covering only the hedgehog)",
                 "on the BUTTERFLY, the guest in the middle (a disc covering only the butterfly)",
                 "on the MOUSE, the fourth guest from the left (a disc covering only the mouse)",
                 "on the DUCKLING, the last guest on the right (a disc covering only the duckling)"],
    },
}
ROZMYCIE = 2.0


def gen(n: str) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    z = ZNALEZISKA[n]; a, b = WORK / f"{n}_a.png", WORK / f"{n}_b.png"
    if not a.exists():
        refs = [TU.parent.parent / r for r in z.get("refs", [])] or None       # what the picture's characters must look like
        figgen.generate(z["obraz"], a, refs=refs, size=z.get("rozmiar", "1024x1024"), quality="high", background="opaque")
    plamy = [c for c in z["cele"] if isinstance(c, str)]
    if plamy and not b.exists():                       # all the spots in one edit: discs never touch
        figgen.generate(f"""Exactly the same illustration, unchanged in every way, with ONLY this added: a flat solid bright magenta
(#FF00FF) filled disc, about one tenth of the picture's height across, placed exactly on each of these
{len(plamy)} places:
{chr(10).join(f"  - {c};" for c in plamy)}
Nothing else changes; no other magenta anywhere.""", b, refs=[a], size=z.get("rozmiar", "1024x1024"), quality="high", background="opaque")
    # every path in an edit of its own: two paths share their ends (one start, one goal), painted together they merge
    for k, c in enumerate(c for c in z["cele"] if isinstance(c, dict)):
        bk = WORK / f"{n}_droga{k}.png"
        if bk.exists(): continue
        figgen.generate(f"""Exactly the same illustration, unchanged in every way, with ONLY this added: a thick flat solid bright
magenta (#FF00FF) line painted exactly along {c["droga"]}, covering it from its one end to its other end and following
every bend. Only this one path; nothing else changes; no other magenta anywhere.""", bk, refs=[a], size=z.get("rozmiar", "1024x1024"), quality="high", background="opaque")


def droga(maska, w, h, krok=34):
    """The centre line of a painted path: its skeleton, thinned to a point every `krok` px and ordered end to end."""
    from skimage.morphology import skeletonize
    ys, xs = np.nonzero(skeletonize(maska))
    pts = list(zip(xs.tolist(), ys.tolist()))
    sasiedzi = lambda p: sum((p[0] + dx, p[1] + dy) in zbior for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)
    zbior = set(pts)
    konce = [p for p in pts if sasiedzi(p) == 1] or pts[:1]
    start = max(konce, key=lambda p: p[1])                     # the lower end first
    kolej, zostalo, akt = [start], set(pts) - {start}, start
    while zostalo:                                            # walk along: always the nearest skeleton pixel
        nast = min(zostalo, key=lambda q: (q[0] - akt[0]) ** 2 + (q[1] - akt[1]) ** 2)
        if (nast[0] - akt[0]) ** 2 + (nast[1] - akt[1]) ** 2 > 60 ** 2: break
        kolej.append(nast); zostalo.discard(nast); akt = nast
    rzadko = [kolej[0]]
    for q in kolej[1:]:
        if (q[0] - rzadko[-1][0]) ** 2 + (q[1] - rzadko[-1][1]) ** 2 >= krok ** 2: rzadko.append(q)
    return [[round(x / w, 4), round(y / h, 4)] for x, y in rzadko]


def magenta(sciezka: Path, rozmiar) -> np.ndarray:
    B = np.asarray(Image.open(sciezka).convert("RGB").resize(rozmiar, Image.LANCZOS)).astype(float)
    r, g, bl = B[..., 0], B[..., 1], B[..., 2]
    m = (r > 170) & (bl > 150) & (g < 110) & (np.abs(r - bl) < 90)       # wherever the edit painted
    return ndimage.binary_closing(ndimage.binary_opening(ndimage.gaussian_filter(m.astype(float), ROZMYCIE) > 0.5, iterations=2), iterations=6)


def build(n: str) -> None:
    z = ZNALEZISKA[n]
    A = Image.open(WORK / f"{n}_a.png").convert("RGB")
    w, h = A.size
    cele = []
    plamy = [c for c in z["cele"] if isinstance(c, str)]
    if plamy:
        lab, ile = ndimage.label(magenta(WORK / f"{n}_b.png", A.size))
        for pole, i in sorted(((int((lab == i).sum()), i) for i in range(1, ile + 1)), reverse=True)[:len(plamy)]:
            ys, xs = np.nonzero(lab == i)
            rr = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
            cele.append({"x": round(xs.mean() / w, 4), "y": round(ys.mean() / h, 4), "r": round(max(rr * 1.25, 0.05 * w) / w, 4)})
    for k, _ in enumerate(c for c in z["cele"] if isinstance(c, dict)):
        lab, ile = ndimage.label(magenta(WORK / f"{n}_droga{k}.png", A.size))
        if not ile: continue
        pola = [(lab == j).sum() for j in range(1, ile + 1)]
        kawalki = [droga(lab == j + 1, w, h) for j, s in enumerate(pola) if s >= 0.05 * max(pola)]   # the paint may break; specks go
        # the pieces chained end to end, the lowest start first (a walk over all of them at once took shortcuts)
        kawalki.sort(key=lambda k: -max(k[0][1], k[-1][1])); lancuch = kawalki.pop(0)
        if lancuch[-1][1] > lancuch[0][1]: lancuch.reverse()
        d2 = lambda a, b: (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
        while kawalki:
            k = min(kawalki, key=lambda k: min(d2(lancuch[-1], k[0]), d2(lancuch[-1], k[-1]))); kawalki.remove(k)
            lancuch += k if d2(lancuch[-1], k[0]) <= d2(lancuch[-1], k[-1]) else k[::-1]
        maska = np.isin(lab, [j + 1 for j, s in enumerate(pola) if s >= 0.05 * max(pola)])
        ys, xs = np.nonzero(maska)
        cele.append({"x": round(xs.mean() / w, 4), "y": round(ys.mean() / h, 4), "r": 0.03, "droga": lancuch})
    if len(cele) != len(z["cele"]):
        print(f"  {n}: {len(cele)} spots found for {len(z['cele'])} asked - check work/{n}_cele.png")
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    k = 1024 / max(w, h)
    A.resize((round(w * k), round(h * k)), Image.LANCZOS).save(out / "obraz.webp", "WEBP", quality=84, method=6)
    (out / "meta.json").write_text(json.dumps({"szerokosc": round(w * k), "wysokosc": round(h * k), "cele": cele}, indent=1), encoding="utf-8")
    podglad = A.copy(); dr = ImageDraw.Draw(podglad)
    for c in cele:
        if c.get("droga"): dr.line([(x * w, y * h) for x, y in c["droga"]], fill=(255, 40, 40), width=10)
        else: dr.ellipse([(c["x"] - c["r"]) * w, c["y"] * h - c["r"] * w, (c["x"] + c["r"]) * w, c["y"] * h + c["r"] * w], outline=(255, 40, 40), width=8)
    podglad.resize((w // 2, h // 2)).save(WORK / f"{n}_cele.png")
    print(f"{n}: {len(cele)} spots")


if __name__ == "__main__":
    for n in sys.argv[1:] or ZNALEZISKA:
        gen(n); build(n)
