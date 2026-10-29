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
import bigjpg  # noqa: E402

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
    # the cover of a lesson that is not made yet (a placeholder in the menu)
    "wkrotce": ("1024x1024", "opaque", f"""A square cover illustration: a small wooden painter's easel standing on a sunny
meadow, a BLANK white canvas on it, a few paint brushes in a jar and a palette with bright paint blobs beside it,
a little butterfly. Calm and friendly, waiting to be painted.
{STYL}
NO characters, NO animals except the butterfly, NO text."""),
}
# the worlds (docs/program.md): each world's menu scenery, its round badge for the world switcher, and the gate at the
# end of a world's strip that leads to the next one
SWIATY = {
    "swiat2": "a sunny LAKESIDE VILLAGE: a calm blue lake, a few small cosy wooden cottages with red roofs on the shore, "
              "a little wooden jetty with a rowing boat, reeds and water lilies, green hills behind",
    "swiat3": "SNOWY MOUNTAINS on a bright winter day: soft white peaks under a pale blue sky, snowy pine trees at the "
              "left and right edges, a frozen little lake, a cosy wooden hut with smoke from the chimney far away",
    "swiat4": "a CASTLE TOWN on a hill: a friendly fairy-tale castle with round towers and coloured flags on a green hill "
              "far away, a little town of colourful houses below it, a winding road, an orchard in front",
}
for _s, _opis in SWIATY.items():
    OBRAZY[f"tlo_{_s}"] = ("1536x1024", "opaque", f"""A wide calm illustrated landscape for the main menu of a children's
game, in exactly the style of a picture book: {_opis}. The whole middle of the picture is open and calm (things will be
placed over it), a meadow or a snowy field in front.
{STYL}
NO characters, NO animals, NO text.""")
ODZNAKI = {
    "swiat1": "a round green forest with a big friendly oak and a little red mushroom",
    "swiat2": "a blue lake with a little cottage with a red roof and a jetty",
    "swiat3": "white snowy mountain peaks with a little pine tree",
    "swiat4": "a little fairy-tale castle with round towers and a flag on a green hill",
}
for _s, _opis in ODZNAKI.items():
    OBRAZY[f"odznaka_{_s}"] = ("1024x1024", "transparent", f"""ONE round medallion badge like a thick painted wooden coin,
filling most of the picture, on a fully TRANSPARENT background: a warm wooden rim with a dark-brown outline, and
inside it a tiny picture-book landscape: {_opis}.
{STYL}
NO text, NO letters, NO numbers.""")
OBRAZY["brama"] = ("1024x1536", "transparent", f"""ONE wooden archway gate standing alone, on a fully TRANSPARENT
background, filling most of the picture: two thick round wooden posts, an arched wooden beam over them hung with green
ivy and a few little flowers, a small wooden signpost arrow on the right post pointing onwards, an open path between
the posts. Friendly, inviting.
{STYL}
NO text, NO letters, NO ground, NO shadow.""")
# every world's own plank (the stage names, the world switcher, the gate): the same plank dressed for its land, the
# middle left clear for the name
DESKI = {
    "swiat1": "a little soft green moss along the top edge, a small sprig of oak leaves with one acorn at the left end and "
              "a tiny red-and-white mushroom at the right end - a FOREST plank",
    "swiat2": "the wood painted soft light blue, the paint a little worn so the wood shows through, both ends wound with "
              "a thick hemp rope, a small pink seashell and two thin green reeds at the right end - a LAKESIDE plank",
    "swiat3": "a thick soft cap of white snow lying along the whole top edge, five or six small clear icicles hanging "
              "from the bottom edge, a pale-blue frosty icy sheen on the wood - a WINTER plank",
    "swiat4": "a small string of colourful triangle pennant flags (red, yellow, blue, green) hanging along the top edge, "
              "two tiny red pennants on thin poles sticking up from both ends - a CASTLE plank",
}
for _s, _opis in DESKI.items():
    OBRAZY[f"deska_{_s}"] = ("1536x1024", "transparent", f"""ONE BLANK wide short wooden plank sign filling the width of the
picture, on a fully TRANSPARENT background, warm light wood with grain, a dark-brown outline, about 4 times wider than
tall, slightly irregular ends; {_opis}. The decorations stay small and at the edges: the whole middle of the plank is
clear and EMPTY for a name.
{STYL}
NOTHING written on it, NO letters.""")
# the signpost and the gate in every world but the forest (it has the plain ones): standing in that land's ground
STOJAKI = {
    "swiat2": ("a few tall green reeds and a yellow iris at its foot on a little patch of sandy shore",
               "hung with a thin fishing net, a hemp rope and two small seashells instead of ivy"),
    "swiat3": ("a small heap of snow at its foot, a soft cap of snow on the arrow board and the post top, two small icicles",
               "covered with a thick soft cap of snow on the arched beam, small icicles hanging from it, a few snowy pine twigs instead of ivy"),
    "swiat4": ("a little clump of grass and a small stone at its foot, a tiny red pennant flag on top of the post",
               "with a small row of colourful triangle pennant flags (red, yellow, blue) strung along the arched beam and a little red flag on top of each post, instead of ivy"),
}
for _s, (_drog, _brama) in STOJAKI.items():
    OBRAZY[f"drogowskaz_{_s}"] = ("1024x1536", "transparent", f"""ONE tall thin wooden signpost, on a fully TRANSPARENT
background: a straight wooden post with a dark-brown outline, and near its top one small BLANK wooden arrow board
pointing to the RIGHT; {_drog}. Tall and narrow (about 1 to 4), filling the height of the picture.
{STYL}
NOTHING written on it.""")
    OBRAZY[f"brama_{_s}"] = ("1024x1536", "transparent", f"""ONE wooden archway gate standing alone, on a fully TRANSPARENT
background, filling most of the picture: two thick round wooden posts, an arched wooden beam over them {_brama}, a
small wooden signpost arrow on the right post pointing onwards, an open path between the posts. Friendly, inviting.
{STYL}
NO text, NO letters, NO ground, NO shadow.""")
# the round buttons (languages, fullscreen) and the stump the album lies on, dressed for every world but the forest
GUZIKI = {
    "swiat2": "the wood painted soft light blue with the paint a little worn, a thin hemp rope wound around the rim",
    "swiat3": "a soft cap of white snow on its top edge, a frosty pale-blue sheen on the wood, two tiny icicles under it",
    "swiat4": "a thin shiny golden rim around the wood and a tiny golden crown engraved at the top edge",
}
for _s, _opis in GUZIKI.items():
    OBRAZY[f"guzik_{_s}"] = ("1024x1024", "transparent", f"""ONE BLANK round wooden button like a thick wooden coin seen
from the front, filling most of the picture, on a fully TRANSPARENT background, warm light wood with grain, a darker
wooden rim, a dark-brown outline; {_opis}. The middle stays clear and EMPTY.
{STYL}
NOTHING written on it.""")
PNIAKI = {
    "swiat2": "standing on a little patch of sandy lake shore with two green reeds, a small pink seashell and a pebble at its foot",
    "swiat3": "with a thick soft cap of snow on its flat top edge, a little heap of snow and a small snowy pine twig at its foot",
    "swiat4": "with a little red pennant flag on a thin pole stuck in its side and a few small stones and a daisy at its foot",
}
for _s, _opis in PNIAKI.items():
    OBRAZY[f"pniak_{_s}"] = ("1536x1024", "transparent", f"""ONE low wide tree stump with visible rings on its flat top,
{_opis}, filling most of the picture, on a fully TRANSPARENT background. The flat top stays free (a book will lie on it).
{STYL}
NO text.""")
CZESCI = ["deska", "guzik", "karta", "pniak", "tasma", "drogowskaz", "klodka", "klodka_otwarta", "brama"] + [f"odznaka_{s}" for s in ODZNAKI] + [f"deska_{s}" for s in DESKI] + [f"{n}_{s}" for s in STOJAKI for n in ("drogowskaz", "brama")] + [f"guzik_{s}" for s in GUZIKI] + [f"pniak_{s}" for s in PNIAKI]
DLUGOSC = {"karta": 900, "deska": 1100, "guzik": 520, "pniak": 900, "tasma": 400, "drogowskaz": 900, "klodka": 420, "klodka_otwarta": 420, "brama": 900, **{f"odznaka_{s}": 360 for s in ODZNAKI}, **{f"deska_{s}": 1100 for s in DESKI}, **{f"{n}_{s}": 900 for s in STOJAKI for n in ("drogowskaz", "brama")}, **{f"guzik_{s}": 520 for s in GUZIKI}, **{f"pniak_{s}": 900 for s in PNIAKI}}      # the long side kept (the menu draws them big)


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


TLA = ["tlo"] + [f"tlo_{sw}" for sw in SWIATY]        # the menu's sceneries: full screen, so upscaled 2x (Bigjpg)


def powieksz() -> None:
    for n in TLA:
        src, dst = WORK / f"{n}.png", WORK / f"{n}_x2.jpg"
        if src.exists() and not dst.exists():
            print(f"bigjpg {n} ..."); dst.write_bytes(bigjpg.upscale(src.read_bytes(), name=n, scale=2))


def install() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for n in TLA:                                                         # the sceneries, the upscaled copy when there is one
        src = next((p for p in (WORK / f"{n}_x2.jpg", WORK / f"{n}.png") if p.exists()), None)
        if src: Image.open(src).convert("RGB").save(OUT / f"{n}.webp", "WEBP", quality=82, method=6)
    if (WORK / "wkrotce.png").exists():
        Image.open(WORK / "wkrotce.png").convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "wkrotce.webp", "WEBP", quality=82, method=6)
    for n in ("szyld_pl", "szyld_en"):
        im = przytnij(Image.open(WORK / f"{n}.png").convert("RGBA")); im.thumbnail((1200, 600), Image.LANCZOS)
        im.save(OUT / f"{n}.webp", "WEBP", quality=88, method=6)
    for nazwa in CZESCI:
        if not (WORK / f"{nazwa}.png").exists(): continue
        im = przytnij(Image.open(WORK / f"{nazwa}.png").convert("RGBA")); im.thumbnail((DLUGOSC[nazwa], DLUGOSC[nazwa]), Image.LANCZOS)
        im.save(OUT / f"{nazwa}.webp", "WEBP", quality=90, method=6); print(nazwa, im.size)

if __name__ == "__main__":
    gen()
    powieksz()
    install()
