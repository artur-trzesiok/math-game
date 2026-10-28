"""Lesson objects in the picture-book style: one gpt-image sheet per group, then one
256 px WebP sticker per object (exact alpha).

  python tools/objects/make_objects.py gen objects        # work/objects.png
  python tools/objects/make_objects.py split objects      # -> game/assets/objects/<name>.webp
  python tools/objects/make_objects.py all containers     # the baskets and boxes the sorting zones sit on

A sheet = an entry in SHEETS: the names in reading order (row by row) and the prompt
that lists the same things in the same order. More objects = a new sheet (never
reorder an existing one: names map by position). Split by alpha; a cell is the
largest blobs, closed so a leaf does not fall off its apple.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "objects"

STYL = """STYLE: modern children's picture-book illustration - soft painterly shading
with a fine paper-grain texture, warm colours, thin soft dark outlines. NOT flat
vector, NOT 3D. Each object is one single thing seen straight on, NO ground
shadow, NO text."""

SHEETS = {
    "objects": {
        "outline": True,         # lesson stickers get a white die-cut outline
        "names": ["jablko", "gruszka", "kwiatek", "ciastko", "kubek", "talerz", "skarpetka", "pilka"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of EIGHT small illustrated objects for a children's picture
book, arranged in a neat grid of 2 rows and 4 columns on a fully TRANSPARENT
background, with generous empty space between objects so none of them touch.
{STYL}
Row 1, left to right: a red apple with a small green leaf; a green pear; a
pink daisy flower with a yellow centre; a round brown chocolate-chip cookie.
Row 2, left to right: a blue cup with a handle; a white round plate with a
light blue rim; a single striped orange-and-white sock; a red-and-white ball.
All eight objects roughly the same size.""",
    },
    "icons": {
        "names": ["ikona_opowiesc", "ikona_cwiczenia", "ikona_dom"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of THREE illustrated icons for a children's game, arranged in
one row of 3 on a fully TRANSPARENT background, with generous empty space between
them so none of them touch. Each icon is a single simple object, big and readable at
a small size, seen straight on, centred, with a soft white rounded-square card
behind it.
{STYL}
Left to right: an open picture book with a tiny fox on its pages (the STORY); a
child's hand with the index finger pointing, tapping (the PRACTICE); a small cosy
house with a red roof and a window (AT HOME).
All three roughly the same size.""",
    },
    "objects2": {
        "outline": True,
        "names": ["szyszka", "listek", "kamyk", "marchewka", "but", "lyzka", "misiu", "klocek"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of EIGHT small illustrated objects for a children's picture
book, arranged in a neat grid of 2 rows and 4 columns on a fully TRANSPARENT
background, with generous empty space between objects so none of them touch.
{STYL}
Row 1, left to right: a brown pine cone; a single green leaf; a smooth grey
round pebble; an orange carrot with green tops.
Row 2, left to right: a single child's red shoe seen from the side; a wooden
spoon; a small brown teddy bear; a red wooden toy block.
All eight objects roughly the same size.""",
    },
    "objects3": {
        "outline": True,
        "names": ["stol", "krzeslo", "krzak", "jez", "zajac", "mysz", "kaczka", "motyl"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of EIGHT small illustrated things for a children's picture book, arranged in a
neat grid of 2 rows and 4 columns on a fully TRANSPARENT background, with generous empty space between them
so none of them touch.
{STYL}
Row 1, left to right: a small wooden kitchen table with four legs, seen from the front; a small wooden chair
seen from the side; a round green bush; a cute little hedgehog standing, side view facing left.
Row 2, left to right: a cute little grey bunny sitting, side view facing left; a cute little grey mouse,
side view facing left; a cute little yellow duckling, side view facing left; a colourful butterfly with open
wings seen straight from above, its two wings mirror images of each other.
All eight roughly the same size.""",
    },
    "containers": {
        "names": ["koszyk", "pudelko", "miska", "polka"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of FOUR illustrated EMPTY containers for a children's picture
book, arranged in one row of 4 on a fully TRANSPARENT background, with generous
empty space between them so none of them touch. Each container is seen slightly
from above so its open inside is visible and EMPTY, wide and low (wider than
tall), so small things can be laid in it.
{STYL}
Left to right: a light wicker basket with no handle; an open cardboard box; a
wide blue ceramic bowl; a small wooden shelf tray with a low rim.
All four roughly the same width.""",
    },
    "gesty": {
        "outline": True,
        "names": ["gest_kamien", "gest_papier", "gest_nozyce"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of THREE illustrated hand gestures for the game rock, paper,
scissors in a children's picture book, arranged in one row of 3 on a fully TRANSPARENT
background, with generous empty space between them so none of them touch. Each is
one small child's hand with a short bit of wrist, warm light skin, seen straight on
from the back of the hand, fingers pointing up, big and readable at a small size.
{STYL}
NOT an emoji, NOT yellow, NOT glossy, NO card or frame behind it, NO sleeve.
Left to right: ROCK - a closed fist; PAPER - an open flat hand, all five fingers
spread; SCISSORS - the index and middle fingers up in a V, the others folded.
All three roughly the same size.""",
    },
    "jesien": {
        "outline": True,
        "names": ["szarlotka", "grzyb", "zoledz", "orzech", "lisc_czerwony", "lisc_zolty", "dynia", "kasztan"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of EIGHT small illustrated autumn objects for a children's picture book, arranged in
a neat grid of 2 rows and 4 columns on a fully TRANSPARENT background, with generous empty space between objects so
none of them touch.
{STYL}
Row 1, left to right: a whole round apple pie with a golden lattice crust on a simple plate; a brown-capped forest
mushroom (a cep) with a thick white stem; one acorn with its little cap; one hazelnut in its brown shell.
Row 2, left to right: one bright RED maple leaf; one bright YELLOW birch leaf; a round orange pumpkin with a short
stem; one shiny brown horse chestnut.
All eight objects roughly the same size; the two leaves the same shape size, only the colour and the leaf type differ.""",
    },
    "noc": {
        "outline": True,
        "names": ["latarenka", "latarenka_swieci", "swietlik", "poduszka", "balonik", "przycisk_muzyki", "gwiazdka", "ksiezyc"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of EIGHT small illustrated objects for a children's picture book, arranged in a neat grid
of 2 rows and 4 columns on a fully TRANSPARENT background, with generous empty space between objects so none of them
touch.
{STYL}
Row 1, left to right: a small EMPTY glass jar lantern with a wire handle on top, clear glass, nothing inside, not lit;
the SAME glass jar lantern glowing warm yellow from inside, as if a firefly sits in it, a soft golden glow; one cute
little firefly beetle with tiny wings and a softly glowing yellow-green tail, seen from the side; one fluffy soft
white pillow with a little stitched edge.
Row 2, left to right: one round red balloon with a curly string hanging down; a big round friendly push button,
bright green, with a white musical note on it; a golden five-pointed star with a soft sparkle; a smiling pale yellow
crescent moon.
All eight roughly the same size.""",
    },
    "kokarda": {
        "outline": True,
        "names": ["kokarda"],
        "size": "1024x1024",
        "prompt": f"""ONE small shiny GOLDEN ribbon bow, like the bow on top of a gift, seen straight on, centred, on a fully
TRANSPARENT background, with plenty of empty space around it.
{STYL}
NOT red, NOT a whole gift box - only the golden bow with two short ribbon tails.""",
    },
    "prezent": {
        "outline": True,
        "names": ["prezent", "prezent_otwarty"],
        "size": "1536x1024",
        "prompt": f"""A sprite sheet of TWO illustrations of the SAME birthday present for a children's picture book,
arranged in one row of 2 on a fully TRANSPARENT background, with generous empty space between them so they do
not touch.
{STYL}
The present: a square box wrapped in sky-blue paper with small white dots, a wide red ribbon crossing it, seen
slightly from above and from the front.
Left: the present CLOSED - its lid on, a big red bow on top, nothing inside visible.
Right: the SAME present OPENED - the lid with the bow taken off and leaning against the box's side, the box's
inside dark and EMPTY, nothing coming out of it.
Both the same size.""",
    },
}


SHEETS["rytm"] = {
    "outline": True,
    "names": ["beben", "dzwonek", "garnek", "kubek_lyzka", "choragiewka_czerwona", "choragiewka_zolta", "choragiewka_niebieska", "ruch_klask"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of EIGHT small illustrated objects for a children's picture book, arranged in a neat
grid of 2 rows and 4 columns on a fully TRANSPARENT background, with generous empty space between objects so none
of them touch.
{STYL}
Row 1, left to right: a small round toy drum with a red side, a light skin on top and two wooden drumsticks crossed
on it; a shiny golden hand bell with a wooden handle; a round steel cooking pot with two handles and a lid; a blue
cup with a silver spoon standing in it.
Row 2, left to right: one triangular bunting flag pointing down, plain RED, a short piece of string along its top
edge; the SAME triangular flag, plain YELLOW; the SAME triangular flag, plain BLUE; two small hands clapping
together with three short curved motion lines around them.
All eight roughly the same size.""",
}
SHEETS["rytm_ruchy"] = {
    "outline": True,
    "names": ["ruch_skok", "ruch_obrot", "koralik_czerwony", "koralik_zolty", "koralik_niebieski"],
    "rows": 1,
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of FIVE small illustrated objects for a children's picture book, arranged in ONE ROW
of 5 on a fully TRANSPARENT background, with generous empty space between objects so none of them touch.
{STYL}
Left to right: a pair of small red children's shoes leaping up, with an arched dotted line under them showing the
jump; a big round curved arrow going almost all the way around in a circle, bright orange, showing a spin; one big
round shiny wooden bead painted RED with a hole through its middle; the SAME round bead painted YELLOW; the SAME
round bead painted BLUE.
All five roughly the same size.""",
}

# the jump on its own: two shoes as two blobs on the row sheet split into one shoe and a scrap
SHEETS["ruch_skok"] = {
    "outline": True,
    "names": ["ruch_skok"],
    "size": "1024x1024",
    "prompt": f"""ONE pair of small red children's shoes pressed together side by side, TOUCHING each other, lifted up
in the air in a jump, with a thick orange curved arrow pointing UP drawn right under their soles and touching them,
all one connected shape, centred, on a fully TRANSPARENT background with plenty of empty space around it, no glow.
{STYL}""",
}

# the engine's mechanics (mechaniki.js): a balance scale in three parts, a cup to hide things under, things to cut
SHEETS["mechaniki"] = {
    "outline": True,
    "names": ["waga_podstawa", "waga_belka", "waga_szalka", "kubeczek", "pizza", "czekolada"],
    "bez_obwodki": ["waga_podstawa", "waga_belka", "waga_szalka"],
    "px": 1024,                 # big on the stage: the long thin beam blurred at 384 px    # parts of one thing: an outline of each ran over the next
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of SIX separate illustrated parts for a children's picture book, arranged in a neat
grid of 2 rows and 3 columns on a fully TRANSPARENT background, with generous empty space between them so none of
them touch.
{STYL}
Row 1, left to right: the STAND of an old-fashioned golden balance scale alone - a round wooden foot and a straight
golden post with a small round knob on top, NO beam, NO pans; the BEAM of the same scale alone - one long thin
straight golden bar lying flat, with a small ring at its middle and a small hook at each end; ONE PAN of the same
scale alone - a shallow round golden dish seen from the side with three thin chains meeting in a ring above it.
Row 2, left to right: one small round RED plastic cup turned UPSIDE DOWN (the opening at the bottom), opaque, with a
little white dot pattern, seen from the side; one whole round pizza seen straight from ABOVE, tomato and cheese
with a few round slices of salami, not cut; one whole bar of milk chocolate seen straight from ABOVE, a rectangle of
4 by 2 squares, unwrapped.
The beam is long and thin; the other parts roughly the same size.""",
}

# the second set of mechanics: memory, the shop, arrows
SHEETS["mechaniki2"] = {
    "outline": True,
    "names": ["karta_rewers", "moneta", "metka", "strzalka"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of FOUR separate illustrated objects for a children's picture book, arranged in ONE ROW
of 4 on a fully TRANSPARENT background, with generous empty space between them so none of them touch.
{STYL}
Left to right: the BACK of a playing card for a children's memory game, a little taller than wide, warm green with a
cream border and a simple pattern of small leaves and one acorn in the middle, rounded corners; one shiny round
golden coin with a little embossed leaf in its middle and a raised rim, NO numbers; one blank cream paper price tag
with a small round hole and a short red string, rectangular with one cut corner, NOTHING written on it; one big bold
friendly green arrow pointing to the RIGHT, thick and rounded.
All four roughly the same size.""",
}

# the stages' signs (menu): on a stage's plank, and as the special sticker for finishing a stage
SHEETS["znaki"] = {
    "outline": True,
    "names": ["znak_kwiatek", "znak_slonce", "znak_lisc", "znak_platek", "znak_tecza", "znak_gwiazda"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of SIX bold, simple, cheerful emblems for a children's game, arranged in a neat grid of 2 rows
and 3 columns on a fully TRANSPARENT background, with generous empty space between them so none of them touch. Each
one big, round-ish, readable at a small size, with a soft golden glow at its edge like a little medal.
{STYL}
Row 1, left to right: a pink five-petal flower with a yellow middle; a smiling golden sun with short rays; a red-and-
orange autumn maple leaf.
Row 2, left to right: a white-and-light-blue snowflake with six arms; a small arch of rainbow with two little white
clouds at its ends; a big shiny golden five-pointed star.
All six the same size.""",
}

# one or many (stage 1)
SHEETS["jeden_wiele"] = {
    "outline": True,
    "names": ["kaczatko", "wisnia"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of TWO small illustrated objects for a children's picture book, in ONE ROW of 2 on a fully
TRANSPARENT background, with generous empty space between them so they do not touch.
{STYL}
Left: one fluffy little yellow duckling swimming, seen from the side, facing right, with a tiny orange beak, a bit of
blue water ripple under it. Right: one pair of red cherries joined by their green stalks with a small leaf.
Both the same size.""",
}

SHEETS["kaczka_mama"] = {
    "outline": True,
    "names": ["kaczka_mama", "trzcina"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of TWO illustrated objects for a children's picture book, in ONE ROW of 2 on a fully
TRANSPARENT background, with generous empty space between them so they do not touch.
{STYL}
Left: one grown-up MOTHER DUCK swimming, seen from the side, facing right - a brown speckled mallard hen with a
white-and-blue wing patch and an orange beak, clearly bigger and darker than a yellow duckling, a bit of blue water
ripple under her. Right: one tall clump of green reeds and bulrushes with two brown cattail heads, growing from a
bit of water, taller than wide.
Both the same height.""",
}

# long and short (stage 1): each thing twice, the SAME thing at two lengths (a length compared, never a size)
SHEETS["dlugi_krotki"] = {
    "outline": True,
    "names": ["deska_dluga", "deska_krotka", "wstazka_dluga", "wstazka_krotka", "szalik_dlugi", "szalik_krotki", "bagietka_dluga", "slimak"],
    "wspolna_skala": True,      # one scale for the whole sheet: a short plank stays short next to the long one
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of EIGHT illustrated objects for a children's picture book, in a neat grid of 2 rows and 4 columns
on a fully TRANSPARENT background, with generous empty space between them so none of them touch. Every object lies
flat and HORIZONTAL, seen from the front.
{STYL}
Row 1, left to right: one LONG wooden plank lying horizontally (very long and narrow); the SAME wooden plank but
SHORT (a third as long, same width); one LONG red ribbon lying straight and horizontal; the SAME red ribbon but SHORT.
Row 2, left to right: one LONG striped knitted scarf laid out straight and horizontal, blue and white stripes with a
fringe at both ends; the SAME scarf but SHORT; one LONG baguette of bread lying horizontally; one cute little snail
with a spiral orange shell, seen from the side, facing right.
The long things are about three times as long as the short ones; all equally thick.""",
}

# bigger and smaller, rethought (stage 1): a tree hollow (one picture, shown at several sizes), the mice's family
SHEETS["dziupla"] = {
    "outline": True,
    "names": ["dziupla", "myszki"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of TWO illustrated objects for a children's picture book, in ONE ROW of 2 on a fully TRANSPARENT
background, with generous empty space between them so they do not touch.
{STYL}
Left: one round tree hollow seen from the front - a round dark opening in a piece of brown tree bark with a little
wooden ledge under it and a few green leaves around it, cosy, nothing inside the opening. Right: a family of four
cute little grey mice huddled together, a mother and three babies, seen from the front.
Both the same size.""",
}

# tall and short (stage 2): each thing twice, the SAME thing at two heights, standing upright on one ground line
SHEETS["wysoki_niski"] = {
    "outline": True,
    "wspolna_skala": True,
    "names": ["slonecznik_wysoki", "slonecznik_niski", "swieca_wysoka", "swieca_niska", "drzewko_wysokie", "drzewko_niskie", "patyk_wysoki", "patyk_niski"],
    "rows": 1,
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of EIGHT illustrated objects for a children's picture book, in ONE ROW of 8 on a fully
TRANSPARENT background, with empty space between them so none of them touch. Every object stands UPRIGHT, its foot on
the same invisible ground line at the bottom.
{STYL}
Left to right: one TALL sunflower on a long green stem; the SAME sunflower but SHORT (a stem a third as long, the same
flower head); one TALL white candle with a little flame; the SAME candle but SHORT; one TALL slim young apple tree; the
SAME young tree but SHORT; one TALL straight wooden stick standing upright; the SAME stick but SHORT.
The tall things are about three times as tall as the short ones; the same width.
The background is fully TRANSPARENT: NO coloured background, NO glow, NO light halo around anything.""",
}
SHEETS["wysoki_niski2"] = {
    "outline": True,
    "names": ["pieniek_niski", "miarka_scienna", "domek_na_drzewie", "jablon_wysoka"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch.
{STYL}
Left to right: one low round tree stump with rings on its flat top, a little moss; a tall narrow wooden height chart
for a wall, painted with coloured stripes and small notches, NO numbers, NO letters; a small cosy wooden treehouse on a
platform with a little roof, seen from the front, NO tree under it; one big tall apple tree with red apples.""",
}


def gen(sheet: str) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    dst = WORK / f"{sheet}.png"
    if dst.exists():
        print(f"{dst} exists, skipping")
        return
    s = SHEETS[sheet]
    figgen.generate(s["prompt"], dst, size=s["size"], quality="high", background="transparent")


PX = 384             # sticker side in pixels


def die_cut(im: Image.Image, border: float = 0.055) -> Image.Image:
    """A thick white outline following the object's shape - a sticker cut around it.
    The canvas grows so the outline is not clipped; the object is drawn on top."""
    from scipy import ndimage

    r = max(2, int(PX * border)); pad = r + 3
    big = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0)); big.paste(im, (pad, pad))
    a = np.asarray(big)[:, :, 3] > 40
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    disk = (x * x + y * y) <= r * r
    grown = ndimage.binary_dilation(a, structure=disk)
    edge = ndimage.gaussian_filter(grown.astype(np.float32), 1.0)         # soft 1 px edge
    white = np.zeros((big.height, big.width, 4), dtype=np.uint8); white[:, :, :3] = 255
    white[:, :, 3] = np.clip(edge * 255, 0, 255).astype(np.uint8)
    out = Image.alpha_composite(Image.fromarray(white, "RGBA"), big)
    return out.resize((PX, PX), Image.LANCZOS)


def split(sheet: str, min_pikseli: int = 1500) -> None:
    from scipy import ndimage

    names = SHEETS[sheet]["names"]
    im = Image.open(WORK / f"{sheet}.png").convert("RGBA")
    a = np.asarray(im)
    maska = ndimage.binary_closing(a[:, :, 3] > 40, iterations=6)
    etyk, ile = ndimage.label(maska, structure=np.ones((3, 3)))
    plamy = []
    for i in range(1, ile + 1):
        ys, xs = np.where(etyk == i)
        if len(ys) >= min_pikseli:
            plamy.append((int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max()), float(ys.mean()), float(xs.mean())))
    plamy.sort(key=lambda p: -((p[1] - p[0]) * (p[3] - p[2])))
    plamy = plamy[:len(names)]
    if len(plamy) != len(names):
        print(f"UWAGA: {len(plamy)} plam, oczekiwano {len(names)} - sprawdz arkusz")
    rows = SHEETS[sheet].get("rows", 2 if len(names) > 4 else 1)
    srodek_y = np.median([p[4] for p in plamy])
    plamy.sort(key=lambda p: ((0 if p[4] < srodek_y else 1) if rows == 2 else 0, p[5]))
    OUT.mkdir(parents=True, exist_ok=True)
    wspolny = max(max(p[1] - p[0], p[3] - p[2]) for p in plamy) + 16 if SHEETS[sheet].get("wspolna_skala") else None
    for nazwa, (y0, y1, x0, x1, _, _) in zip(names, plamy):
        pad = 8
        kaw = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
        bok = wspolny or max(kaw.width, kaw.height)
        kw = Image.new("RGBA", (bok, bok), (0, 0, 0, 0))
        kw.paste(kaw, ((bok - kaw.width) // 2, (bok - kaw.height) // 2))
        kw = kw.resize((SHEETS[sheet].get("px", PX),) * 2, Image.LANCZOS)
        if SHEETS[sheet].get("outline") and nazwa not in SHEETS[sheet].get("bez_obwodki", []):
            kw = die_cut(kw)
        kw.save(OUT / f"{nazwa}.webp", "WEBP", quality=80, method=6, exact=True)
        print(f"  {nazwa:10s} {kaw.width}x{kaw.height}")


if __name__ == "__main__":
    cmd, sheet = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "objects"
    if cmd in ("gen", "all"):
        gen(sheet)
    if cmd in ("split", "all"):
        split(sheet)
