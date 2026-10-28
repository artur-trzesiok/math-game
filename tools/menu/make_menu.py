"""The menu's painted pieces (game/index.html, the lesson strip): the scenery behind it, the title sign per
language, and a sheet of blank parts - a wooden plank (topic names, chips), a round wooden button (languages,
fullscreen), a paper card (a lesson), a tree stump (the album sits on it).

  python tools/menu/make_menu.py        # work/*.png -> game/assets/menu/*.webp

Delete a work file to redo it.
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
OUT = TU.parent.parent / "game" / "assets" / "menu"

STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading with a fine paper-grain
texture, warm friendly colours, thin soft dark-brown outlines. NOT flat vector, NOT 3D render."""

OBRAZY = {
    "tlo": ("1536x1024", "opaque", f"""A wide calm illustrated landscape for the main menu of a children's game: a soft
light-blue morning sky with two or three small fluffy clouds, gentle rolling green hills far away, a few round
trees at the left and right edges, a sunny meadow in front with tiny flowers. The whole middle of the picture is
open and calm (things will be placed over it). No path, no buildings.
{STYL}
NO characters, NO animals, NO text."""),
    "szyld_pl": ("1536x1024", "transparent", f"""ONE wide wooden sign board for the title of a children's game, on a fully
TRANSPARENT background with empty space around it: a long rounded plank of warm light wood with a painted
dark-brown outline, two small green leaves and a little red berry at its ends, and on it the words
"Matematyka z Liskiem" painted in big, round, friendly, bold dark-brown letters, perfectly spelled, centred.
{STYL}
ONLY these words, exactly spelled: Matematyka z Liskiem"""),
    "szyld_en": ("1536x1024", "transparent", f"""ONE wide wooden sign board for the title of a children's game, on a fully
TRANSPARENT background with empty space around it: a long rounded plank of warm light wood with a painted
dark-brown outline, two small green leaves and a little red berry at its ends, and on it the words
"Maths with Fox" painted in big, round, friendly, bold dark-brown letters, perfectly spelled, centred.
{STYL}
ONLY these words, exactly spelled: Maths with Fox"""),
    # the parts one per picture, each filling its canvas (cut from one sheet they came out too small: the card
    # was 227 px wide and blurred on the menu)
    "karta": ("1024x1024", "transparent", f"""ONE BLANK card of thick cream paper filling most of the picture, on a fully
TRANSPARENT background, a little taller than wide (exactly 4 to 5), slightly rounded corners, a soft painted darker
edge evenly all around, a fine paper texture. NOTHING on it - no tape, no pictures, no text.
{STYL}"""),
    "drogowskaz": ("1024x1536", "transparent", f"""ONE tall thin wooden signpost standing in a small tuft of grass with a few
little meadow flowers (daisies, a red poppy) at its foot, on a fully TRANSPARENT background: a straight wooden post
with a dark-brown outline, and near its top one small BLANK wooden arrow board pointing to the RIGHT, a tiny green
leafy twig wound around the post. Tall and narrow (about 1 to 4), filling the height of the picture.
{STYL}
NOTHING written on it."""),
    "tasma": ("1536x1024", "transparent", f"""ONE short strip of green washi tape with small white dots, seen from above, with
softly torn ends, about 3 times wider than tall, filling the middle of the picture, on a fully TRANSPARENT
background.
{STYL}
NOTHING else."""),
    "deska": ("1536x1024", "transparent", f"""ONE BLANK wide short wooden plank sign filling the width of the picture, on a
fully TRANSPARENT background, warm light wood with grain and two little knots, a dark-brown outline, about 4 times
wider than tall, slightly irregular ends. NOTHING written on it.
{STYL}"""),
    "guzik": ("1024x1024", "transparent", f"""ONE BLANK round wooden button like a thick wooden coin seen from the front,
filling most of the picture, on a fully TRANSPARENT background, warm light wood with grain, a darker wooden rim, a
dark-brown outline. NOTHING on it.
{STYL}"""),
    "pniak": ("1536x1024", "transparent", f"""ONE low wide tree stump with visible rings on its flat top, a little moss and a
small red mushroom at its foot, filling most of the picture, on a fully TRANSPARENT background.
{STYL}
NO text."""),
    # a topic not open yet (its cards lie in a mist): a padlock, closed, and the same one open for the moment it opens
    "klodka": ("1024x1024", "transparent", f"""ONE old-fashioned padlock, CLOSED, filling most of the picture, on a fully
TRANSPARENT background: a chunky rounded body of warm golden brass with a dark keyhole in the middle and a few
scratches, a thick silver-grey shackle on top, a dark-brown outline, friendly and toy-like, seen straight from the
front, centred.
{STYL}
NO key, NO chain, NO text."""),
    "klodka_otwarta": ("1024x1024", "transparent", f"""The SAME old-fashioned padlock, now OPEN: the thick silver-grey
shackle lifted up and turned to the side, released from the body; the chunky rounded golden brass body with its dark
keyhole, a dark-brown outline, friendly and toy-like, seen straight from the front, centred, filling most of the
picture, on a fully TRANSPARENT background.
{STYL}
NO key, NO chain, NO text."""),
}
CZESCI = ["deska", "guzik", "karta", "pniak", "tasma", "drogowskaz", "klodka", "klodka_otwarta"]
DLUGOSC = {"karta": 900, "deska": 1100, "guzik": 520, "pniak": 900, "tasma": 400, "drogowskaz": 900, "klodka": 420, "klodka_otwarta": 420}      # the long side kept (the menu draws them big)


def gen() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    for n, (size, tlo, prompt) in OBRAZY.items():
        dst = WORK / f"{n}.png"
        if dst.exists():
            print(f"{dst} exists, skipping"); continue
        figgen.generate(prompt, dst, size=size, quality="high", background=tlo)


def przytnij(im: Image.Image) -> Image.Image:
    bb = im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    return im.crop(bb) if bb else im


def install() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    t = Image.open(WORK / "tlo.png").convert("RGB"); t.save(OUT / "tlo.webp", "WEBP", quality=82, method=6)
    for n in ("szyld_pl", "szyld_en"):
        im = przytnij(Image.open(WORK / f"{n}.png").convert("RGBA")); im.thumbnail((1200, 600), Image.LANCZOS)
        im.save(OUT / f"{n}.webp", "WEBP", quality=88, method=6)
    for nazwa in CZESCI:
        im = przytnij(Image.open(WORK / f"{nazwa}.png").convert("RGBA")); im.thumbnail((DLUGOSC[nazwa], DLUGOSC[nazwa]), Image.LANCZOS)
        im.save(OUT / f"{nazwa}.webp", "WEBP", quality=90, method=6); print(nazwa, im.size)

if __name__ == "__main__":
    gen()
    install()
