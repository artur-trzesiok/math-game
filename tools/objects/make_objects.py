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
    # light_heavy story: Beaver's raft on the brook - the characters stand on it and it dips under the heavy ones
    "tratwa_bobra": {
        "names": ["tratwa"],
        "outline": True,
        "size": "1536x1024",
        "rows": 1,
        "px": 1024,                 # wide on the stage, characters stand on it
        "prompt": f"""A sprite sheet of ONE illustrated thing for a children's picture book, in the middle of a fully
TRANSPARENT background. NO coloured background, NO glow, NO halo, NO water, NO ground.
{STYL}
One small flat wooden RAFT seen from the front and a little from above: SIX round light-brown logs lying side by side
across the picture, tied together with rope at both ends, so the raft's flat top deck is clearly visible as a long wide
strip. It is much wider than tall (about four times as wide as it is tall). NO mast, NO sail, NO oars, NO animals,
NO things on it - the deck is empty. The raft fills about four fifths of the sheet's width.""",
    },
    # light_heavy: the picnic watermelon, the shopping bags (a big light crisps bag, a small heavy potato bag) and a big
    # light popcorn jar to weigh against the small honey jar (sloik)
    "lekki_ciezki": {
        "names": ["arbuz", "torba_chipsy", "torba_ziemniaki", "sloik_popcorn"],
        "outline": True,
        "size": "1536x1024",
        "rows": 1,
        "px": 512,
        "prompt": f"""A sprite sheet of FOUR illustrated things for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO table.
{STYL}
Left to right: one whole round green striped WATERMELON with dark green stripes, lying, NOT cut; one BIG puffy shiny
yellow bag of potato CRISPS, blown up full of air like a pillow, with a picture of one golden crisp on it and NO
letters; one SMALL brown paper bag full of POTATOES, open at the top, several round brown potatoes heaped in it and
showing over the rim, the bag bulging heavy; one TALL big glass JAR full of white fluffy POPCORN, with a red lid.
Each thing fills at most a fifth of the sheet's width; a WIDE empty gap between neighbours.""",
    },
    # logical_pairs home: things that go together in Deer's hallway and at her tea (teapot -> cup, umbrella -> boots)
    "pary_dom": {
        "names": ["czajniczek", "parasol", "kalosze", "pasta"],
        "outline": True,
        "size": "1536x1024",
        "rows": 1,
        "prompt": f"""A sprite sheet of FOUR illustrated things for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO table.
{STYL}
Left to right: one round white porcelain TEAPOT with a little blue flower on its side, a spout and a lid; one closed
yellow UMBRELLA with a curved wooden handle, standing upright; one pair of green rubber RAIN BOOTS standing side by side;
one tube of TOOTHPASTE, white with a blue stripe and a blue cap, lying flat, NO letters on it.
Each thing fills at most a fifth of the sheet's width; a WIDE empty gap between neighbours.""",
    },
    # noticing_order home: what a sandwich is made of, one by one (Bunny stacks them anyhow)
    "kanapka_skladniki": {
        "names": ["kromka", "maslo", "ser"],
        "outline": True,
        "size": "1536x1024",
        "rows": 1,
        "prompt": f"""A sprite sheet of THREE illustrated things for a children's picture book, in ONE ROW of 3 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO plate, NO table.
{STYL}
Left to right: one plain slice of white bread with a golden crust, seen straight on, nothing on it; one block of pale
yellow butter on a small white butter dish, a butter knife lying beside it on the dish; one square slice of yellow
cheese with a few round holes, seen straight on.
Each thing fills at most a quarter of the sheet's width; a WIDE empty gap between neighbours.""",
    },
    # shapes home: biscuits baked in the four shapes for Hedgehog's tea, and a triangle sandwich for "I spy"
    "ciastka_figury": {
        "names": ["ciastko_kolo", "ciastko_kwadrat", "ciastko_trojkat", "ciastko_prostokat", "kanapka_trojkat"],
        "outline": True,
        "size": "1536x1024",
        "rows": 1,
        "prompt": f"""A sprite sheet of FIVE illustrated things for a children's picture book, in ONE ROW of 5 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO plate, NO table.
{STYL}
Four flat golden-brown butter BISCUITS seen straight from above, each one exactly ONE clear geometric shape with crisp
straight edges and sharp corners, a few sugar sprinkles on top, all the same golden colour: left to right - a ROUND
biscuit, a perfect circle; a SQUARE biscuit, all four sides exactly equal, lying straight (not turned); a TRIANGLE
biscuit, point up, three equal sides; a RECTANGLE biscuit, lying flat, twice as wide as it is tall. The fifth: a
SANDWICH cut into a TRIANGLE (white bread, a green lettuce leaf and yellow cheese peeking out), seen from the front,
point up. Each thing fills at most a sixth of the sheet's width.""",
    },
    # bigger_smaller: Squirrel's store in a moving box (story and home), full so "a box of the store" is seen
    "pudlo_zapasy": {
        "names": ["pudlo_zapasy"],
        "outline": True,
        "size": "1024x1024",
        "rows": 1,
        "px": 512,
        "refs": ["pudelko"],
        "prompt": f"""ONE illustrated object for a children's picture book in the middle of a fully TRANSPARENT background,
filling most of the image. NO glow, NO halo, NO background.
{STYL}
The open cardboard box from the reference, seen straight on and a little from above, wide and low, its flaps open,
FILLED to the top with brown hazelnuts, acorns with little caps and a few pine cones heaped up a little over the rim.
Only the box and its nuts - NOTHING else.""",
    },
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
        "names": ["stol", "krzeslo", "krzak", "jez", "zajac", "mysz", "kaczatko_stoi", "motyl"],
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

# the stages' signs of worlds 2-4 (stages 7-24), each world's six in its own land's mood, the same medal style
ZNAKI_SWIATOW = {
    "znaki_swiat2": (["znak_rybka", "znak_lodka", "znak_muszla", "znak_kaczka", "znak_lilia", "znak_kotwica"],
                     """Row 1, left to right: a small smiling orange fish; a little wooden sailing boat with a white sail; a pink
scallop seashell.
Row 2, left to right: a yellow rubber-duck-like little duck; a pink water lily flower on a green round leaf; a blue
ship's anchor with a rope."""),
    "znaki_swiat3": (["znak_balwan", "znak_rekawiczka", "znak_sanki", "znak_choinka", "znak_czapka", "znak_kubek"],
                     """Row 1, left to right: a smiling snowman with a carrot nose; a red knitted mitten with a white pattern; a
little wooden sledge.
Row 2, left to right: a snowy green pine tree; a blue knitted winter hat with a white pom-pom; a red mug of hot cocoa
with a little steam."""),
    "znaki_swiat4": (["znak_korona", "znak_tarcza", "znak_klucz", "znak_wieza", "znak_klejnot", "znak_choragiew"],
                     """Row 1, left to right: a golden crown with red jewels; a round blue knight's shield with a golden star; a
big golden old key.
Row 2, left to right: a small round castle tower with a red pointed roof; a sparkling purple gem; a red pennant flag
on a pole."""),
}
for _n, (_names, _rows) in ZNAKI_SWIATOW.items():
    SHEETS[_n] = {
        "outline": True, "names": _names, "size": "1536x1024",
        "prompt": f"""A sprite sheet of SIX bold, simple, cheerful emblems for a children's game, arranged in a neat grid of 2 rows
and 3 columns on a fully TRANSPARENT background, with generous empty space between them so none of them touch. Each
one big, round-ish, readable at a small size, with a soft golden glow at its edge like a little medal.
{STYL}
{_rows}
All six the same size.""",
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
# spot_difference home: the proof that Granny Owl came at night - one of her feathers left on the rug
SHEETS["pioro_babci"] = {
    "outline": True,
    "names": ["pioro_sowy"],
    "size": "1024x1024",
    "prompt": f"""ONE illustrated object for a children's picture book, alone in the middle of a fully TRANSPARENT background,
NO glow, NO halo, with generous empty space around it.
{STYL}
One single soft OWL FEATHER, lying diagonally: soft grey-white with gentle light-brown bars across it, a fluffy downy
base and a thin pale quill, big and clear.""",
}

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

# long_short: the short twin of the baguette (the picnic basket holds both) and the friends' pawn for the walk on the map
SHEETS["piknik_pionek"] = {
    "outline": True,
    "names": ["bagietka_krotka", "pionek_lisek"],
    "size": "1536x1024",
    "rows": 1,
    "refs": ["bagietka_dluga"],
    "prompt": f"""A sprite sheet of TWO illustrated objects for a children's picture book, in ONE ROW of TWO on a fully
TRANSPARENT background, with generous empty space between them so they do not touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
Left: the SAME baguette of bread as in the reference picture (same colour, same crust, same thickness), but SHORT - half
as long - lying flat and HORIZONTAL, seen from the front. Right: one small wooden board-game pawn carved as a cute
little red FOX sitting upright on a round wooden base, seen from the front, smiling, painted orange-red with a white
chest and a white tail tip.""",
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
    "px": 1024,                 # tall things shown big: at 384 px the height chart was pixelated
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
    "px": 1024,                 # tall things shown big: at 384 px the height chart was pixelated
    "names": ["pieniek_niski", "miarka_scienna", "domek_na_drzewie", "jablon_wysoka"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch.
{STYL}
Left to right: one low round tree stump with rings on its flat top, a little moss; a tall narrow wooden height chart
for a wall, painted with coloured stripes and small notches, NO numbers, NO letters; a small cosy wooden treehouse on a
platform with a little roof, seen from the front, NO tree under it; one big tall apple tree with red apples.""",
}

# in order, at home: a water-glass xylophone - the SAME glass four times, water at four levels (more water, a lower note)
SHEETS["szklanki"] = {
    "outline": True,
    "wspolna_skala": True,
    "px": 512,
    "names": ["szklanka_1", "szklanka_2", "szklanka_3", "szklanka_4"],
    "rows": 1,
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of FOUR illustrated drinking glasses for a children's picture book, in ONE ROW of 4 on a
fully TRANSPARENT background, with generous empty space between them so none of them touch. They stand UPRIGHT with
their bottoms on the same invisible ground line.
{STYL}
The SAME simple clear glass tumbler four times, exactly the same size and shape, a little shine on the glass. Each holds
clear light-blue water to a different level, left to right: filled almost to the top; filled three quarters; filled
half; filled only a quarter. The water levels are clearly different and easy to compare. No spoon, no straw, no table.
The background is fully TRANSPARENT: NO coloured background, NO glow, NO light halo around anything.""",
}

# in order (stage 2): nesting boxes and owlets at three sizes, cups that stack inside each other
SHEETS["po_kolei"] = {
    "outline": True,
    "names": ["budka", "sowiatko", "kubek_skladany", "kamien_schodek"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow.
{STYL}
Left to right: one wooden bird nesting box with a round hole and a little sloped roof, seen from the front; one fluffy
baby owl, round, cream and brown, big eyes, seen from the front; one plain round stacking toy cup, bright orange,
seen from the side, wider at the top; one flat grey river stone standing on its edge, as tall as wide.
All four the same size.""",
    "rows": 1,
}

# morning and night (stage 2): the parts of the day as cards, and the evening routine
SHEETS["pory_dnia"] = {
    "outline": True,
    "names": ["pora_rano", "pora_poludnie", "pora_wieczor", "pora_noc"],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR small square picture cards for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. Each card has rounded corners
and shows the SAME little meadow with one tree and a small house, at a different time of day:
{STYL}
Left to right: MORNING - a pale pink and gold sky, the sun just rising low on the left horizon, dew; MIDDAY - a bright
blue sky, the sun high in the middle; EVENING - an orange and purple sky, the sun setting low on the right; NIGHT - a
dark blue sky with a crescent moon and stars, a lit window in the house.""",
}
SHEETS["rutyna"] = {
    "outline": True,
    "names": ["sniadanie", "wanna", "pizama", "ksiazeczka", "lozeczko", "szczoteczka"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of SIX illustrated objects for a children's picture book, in a neat grid of 2 rows and 3 columns
on a fully TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured
background, NO glow.
{STYL}
Row 1, left to right: a breakfast - a bowl of porridge with a spoon and a glass of milk; a little white bathtub with
bubbles and a yellow rubber duck; a pair of blue pyjamas with little stars, folded.
Row 2, left to right: a children's picture book, open; a small cosy bed with a pillow and a blanket; a toothbrush with
a blob of toothpaste and a cup.
All six the same size.""",
}

# stage 3: story steps (three in a row = one little story, drawn on one sheet so they match), birthday, pairs
SHEETS["historyjki1"] = {
    "outline": True,
    "names": ["jajko", "piskle", "kura", "nasiono", "kielek", "kwiat_rozkwit"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of SIX square picture cards with rounded corners for a children's picture book, in a neat grid
of 2 rows and 3 columns on a fully TRANSPARENT background, with generous empty space between them. NO coloured background, NO glow.
{STYL}
Row 1 is one little story, the same nest on each card: a white egg in a straw nest; the same egg cracking with a
yellow chick peeking out; a grown white hen standing by the empty nest.
Row 2 is another story, the same pot of soil on each card: a seed being put into the soil; a small green sprout with
two leaves; a big red tulip in bloom.""",
}
SHEETS["historyjki2"] = {
    "outline": True,
    "names": ["balwan_1", "balwan_2", "balwan_3", "ciasto_1", "ciasto_2", "ciasto_3"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of SIX square picture cards with rounded corners for a children's picture book, in a neat grid
of 2 rows and 3 columns on a fully TRANSPARENT background, with generous empty space between them. NO coloured background, NO glow.
{STYL}
Row 1 is one little story in the same snowy garden: one big snowball on the snow; two snowballs stacked; a finished
snowman with a carrot nose, a hat and a scarf.
Row 2 is another story on the same kitchen table: eggs, a bag of flour and a bottle of milk; a mixing bowl with dough
and a whisk; a round baked cake.""",
}
SHEETS["historyjki3"] = {
    "outline": True,
    "names": ["kanapka_1", "kanapka_2", "kanapka_3", "tort", "swieczka", "malina"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of SIX illustrated items for a children's picture book, in a neat grid of 2 rows and 3 columns
on a fully TRANSPARENT background, with generous empty space between them. NO coloured background, NO glow.
{STYL}
Row 1 is one little story, three square picture cards with rounded corners on the same plate: a slice of bread; the
same slice spread with butter; the same slice with butter and a slice of yellow cheese on top.
Row 2: a round birthday cake with pink icing and NO candles, seen from the front; one thin striped birthday candle with
a little flame; one red raspberry.""",
}
SHEETS["pary1"] = {
    "outline": True,
    "names": ["filizanka", "spodek", "pedzel", "farby", "pszczola", "mlotek", "gwozdz", "kubek_czerwony"],
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of EIGHT illustrated objects for a children's picture book, in a neat grid of 2 rows and 4
columns on a fully TRANSPARENT background, with generous empty space between them. NO coloured background, NO glow.
{STYL}
Row 1, left to right: a white teacup with a little blue flower; a matching white saucer seen from the side; a paint
brush; a box of watercolour paints.
Row 2, left to right: a cute bee; a wooden hammer; one big nail; a plain RED cup with a handle.
All eight roughly the same size.""",
}
SHEETS["pary2"] = {
    "outline": True,
    "names": ["klucz_gwiazda", "klucz_kolo", "klucz_kwadrat", "drzwi_gwiazda"],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them. NO coloured background, NO glow.
{STYL}
Left to right: a big golden key whose bit (the end) is shaped like a STAR; the same golden key but its bit shaped like a
CIRCLE; the same golden key but its bit shaped like a SQUARE; a small round wooden door with a big keyhole shaped like a
STAR.
All four roughly the same height.""",
}

# stage 4 (numbers 1-5, up and down, inside and outside): one row of four per sheet - a 3x4 grid came out on a glowing
# coloured background twice and the split mixed the names
SHEETS["etap4_a"] = {
    "outline": True,
    "names": ['wagon', 'bilet', 'ptak', 'gniazdo'],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
Left to right: one small open red toy-train wagon seen from the side, with wheels, EMPTY, its side plain
(NO number); one blank cream paper train ticket, nothing written on it; one small round blue songbird sitting, seen
from the side; one empty round bird nest made of twigs.
All four roughly the same size.""",
}
SHEETS["etap4_b"] = {
    "outline": True,
    "names": ['owca', 'wilk', 'akwarium', 'rybka'],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
Left to right: one SMALL fluffy white sheep standing, seen from the side; one SMALL friendly grey cartoon wolf sitting,
smiling, NOT scary; one round glass fishbowl with water, EMPTY (no fish); one small orange goldfish seen from the side.
Each object fills at most a fifth of the sheet's width; a WIDE empty gap between neighbours.
All four roughly the same size.""",
}
SHEETS["etap4_c"] = {
    "outline": True,
    "names": ['klatka', 'plecak', 'sloik', 'czapka'],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
Left to right: one EMPTY round golden birdcage with its little door open; one small green child's backpack;
one glass jar of honey with a cloth lid; one red knitted winter hat with a pompom.
All four roughly the same size.""",
}

# the lift (mechaniki3.js winda): its parts painted, the code only moves them - the wheel turns, the rope is stacked
# from pieces of `winda_lina` to any length
SHEETS["winda"] = {
    "outline": True,
    "bez_obwodki": ["winda_lina"],
    "names": ["winda_belka", "winda_kolo", "winda_lina", "winda_uchwyt"],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated parts of a simple wooden rope lift for a children's picture book, in ONE
ROW of 4 on a fully TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured
background, NO glow, NO halo, NO vignette - the space around and between the parts is completely empty and transparent.
{STYL}
Left to right: a short thick horizontal wooden beam (a log plank) with a small iron bracket hanging down from its middle,
NOTHING hanging from the bracket; a round wooden pulley wheel seen flat from the front, with a dark groove around its
rim, four spokes and a metal axle in the centre; one short STRAIGHT VERTICAL piece of thick twisted brown rope, cut
clean at both ends, perfectly upright, as tall as the beam is wide; a small round wooden pull-handle (a toggle) with a
tiny iron ring on top.
The beam widest, the wheel as wide as half the beam, the handle small.""",
}

# stage 5 (in front and behind, the race): medals and a finish line; big things to hide behind and a little house
SHEETS["etap5_a"] = {
    "outline": True,
    "names": ['medal_zloty', 'medal_srebrny', 'medal_brazowy', 'meta'],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
Left to right: one round GOLD medal on a short red ribbon, blank (NO number, NO text); the same medal in SILVER; the same
medal in BRONZE; a finish line: two short wooden posts with a red-and-white chequered ribbon stretched between them.
Each object fills at most a fifth of the sheet's width; a WIDE empty gap between neighbours.
The three medals exactly the same size.""",
}
SHEETS["etap5_b"] = {
    "outline": True,
    "names": ['zaslona', 'fotel', 'glaz', 'domek'],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
Left to right: a tall soft blue window curtain hanging straight down, seen from the front (only the curtain, NO window);
a cosy round green armchair seen from the front; one big round grey boulder, wider than tall; a small cosy cottage with
a red roof and a round door, seen from the front.
Each object fills at most a fifth of the sheet's width; a WIDE empty gap between neighbours.
All four roughly the same size.""",
}

# variants the stage picks from at random (scene.js WARIANTY): an apple stays RED (stories name its colour), a pear
# stays green-yellow; the originals' references keep the style and size
SHEETS["warianty_owoce"] = {
    "outline": True,
    "names": ["jablko_2", "jablko_3", "gruszka_2", "gruszka_3"],
    "size": "1536x1024",
    "rows": 1,
    "refs": ["jablko", "gruszka"],
    "prompt": f"""A sprite sheet of FOUR illustrated fruits for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the fruits is completely empty and transparent.
{STYL}
The reference images show the game's apple and pear: paint the same style, the same size and the same colours.
Left to right: one shiny RED apple, a little rounder and wider than the reference, with a short brown stem and TWO
green leaves; one RED apple, a little taller, with a short stem and NO leaf, a soft yellow blush on one side but red
overall; one green-yellow pear like the reference but plumper, with a stem and one leaf; one green-yellow pear, slimmer
and taller, with a curved stem and no leaf.
All four the same size as the reference fruits.""",
}

# more variants (scene.js WARIANTY): the block stays RED (grouping puts it with the red things), the mug BLUE, the acorn
# brown; each keeps the original's size, only its look changes
SHEETS["warianty_rzeczy"] = {
    "outline": True,
    "names": ["klocek_2", "klocek_3", "kubek_2", "kubek_3"],
    "size": "1536x1024",
    "rows": 1,
    "refs": ["klocek", "kubek"],
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of FOUR on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference images show the game's own objects: paint the same style, the same size and the same colours.
Left to right: one RED wooden toy cube like the reference with a small white star painted on its front; one RED wooden
toy cube like the reference with softly rounded edges and a white dot on its front; one BLUE mug like the reference
with small white polka dots; one BLUE mug like the reference with a thin white stripe round it.
All four the same size as the references.""",
}
SHEETS["warianty_zoledz"] = {
    "outline": True,
    "names": ["zoledz_2", "zoledz_3"],
    "size": "1536x1024",
    "rows": 1,
    "refs": ["zoledz"],
    "prompt": f"""A sprite sheet of TWO illustrated objects for a children's picture book, in ONE ROW of TWO on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference images show the game's own objects: paint the same style, the same size and the same colours.
Left to right: one brown acorn like the reference but rounder and plumper, its cap tilted a little; one brown acorn
like the reference but slimmer, with a little stalk on its cap and one small green oak leaf.
Both the same size as the reference.""",
}

# the ball stays RED and white (grouping counts it with the red things); the hedgehog keeps facing LEFT (queues face
# their front on the left)
SHEETS["warianty_3"] = {
    "outline": True,
    "names": ["szyszka_2", "szyszka_3", "pilka_2", "pilka_3"],
    "size": "1536x1024",
    "rows": 1,
    "refs": ["szyszka", "pilka"],
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of FOUR on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference images show the game's own objects: paint the same style, the same size and the same colours.
Left to right: one brown pine cone like the reference but rounder and more open; one brown pine cone like the
reference but slimmer and longer, with a tiny twig and two pine needles on top; one RED and white beach ball like the
reference but with white stars on red; one RED and white ball with a single wide white band round its middle.
All four the same size as the references.""",
}
SHEETS["warianty_jez"] = {
    "outline": True,
    "names": ["jez_2", "jez_3"],
    "size": "1536x1024",
    "rows": 1,
    "refs": ["jez"],
    "prompt": f"""A sprite sheet of TWO illustrated objects for a children's picture book, in ONE ROW of TWO on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference images show the game's own objects: paint the same style, the same size and the same colours.
Left to right: the same little hedgehog as the reference, seen from the side FACING LEFT, walking with one front paw
raised; the same little hedgehog FACING LEFT, sitting up a little, holding a tiny red apple on its back spines.
Both the same size and colours as the reference hedgehog, both facing LEFT.""",
}

SHEETS["warianty_but"] = {
    "outline": True,
    "names": ["but_2", "but_3"],
    "size": "1536x1024",
    "rows": 1,
    "refs": ["but"],
    "prompt": f"""A sprite sheet of TWO illustrated objects for a children's picture book, in ONE ROW of 2 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference image shows the game's own shoe: paint the same style, the same size and the same colour.
Left to right: one RED child's sneaker with white laces and a white sole, seen from the side, toe to the left like the
reference; one RED child's ankle boot with two buttons, seen from the side, toe to the left.
Both the same size as the reference.""",
}

SHEETS["warianty_4"] = {
    "outline": True,
    "names": ["kaczatko_stoi_2", "kaczatko_stoi_3", "krzak_2", "krzak_3"],
    "size": "1536x1024",
    "rows": 1,
    "refs": ["kaczatko_stoi", "krzak"],
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference images show the game's own duckling and bush: paint the same style, the same size and the same colours.
Left to right: the same yellow duckling standing, seen from the side FACING LEFT, flapping its little wings; the same
yellow duckling FACING LEFT, one foot lifted as if walking; one round green bush like the reference with a few tiny
white flowers; one green bush like the reference, a little wider and lower, with a few red berries.
All four the same size as the references; the ducklings face LEFT.""",
}

# the flower may change colour (no story names it), the teddy stays brown, the sock orange and striped, the plate
# ROUND (it is a circle in the shapes lesson), the bunny faces LEFT
SHEETS["warianty_5"] = {
    "outline": True,
    "names": ['kwiatek_2', 'kwiatek_3', 'misiu_2', 'misiu_3'],
    "size": "1536x1024",
    "rows": 1,
    "refs": ['kwiatek', 'misiu'],
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference images show the game's own objects: paint the same style and the same size.
Left to right: one round daisy-like flower head like the reference but YELLOW petals with an orange centre; one
round flower head like the reference but LIGHT PURPLE petals with a yellow centre; the same brown teddy bear as the
reference sitting, with a red bow at its neck; the same brown teddy bear standing, waving one paw.
All the same size as the references.""",
}
SHEETS["warianty_6"] = {
    "outline": True,
    "names": ['skarpetka_2', 'skarpetka_3', 'talerz_2', 'talerz_3'],
    "size": "1536x1024",
    "rows": 1,
    "refs": ['skarpetka', 'talerz'],
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference images show the game's own objects: paint the same style and the same size.
Left to right: one ORANGE sock like the reference with white polka dots instead of stripes; one ORANGE sock with thin white
stripes and a white heel and toe; one ROUND white plate seen from above like the reference with a green rim; one ROUND
white plate seen from above with a red rim and little dots.
All the same size as the references.""",
}
SHEETS["warianty_zajac"] = {
    "outline": True,
    "names": ['zajac_2', 'zajac_3'],
    "size": "1536x1024",
    "rows": 1,
    "refs": ['zajac'],
    "prompt": f"""A sprite sheet of TWO illustrated objects for a children's picture book, in ONE ROW of 2 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference images show the game's own objects: paint the same style and the same size.
Left to right: the same grey-brown bunny as the reference sitting, seen from the side FACING LEFT, one ear
flopped down; the same bunny FACING LEFT, hopping, both hind legs stretched back.
Both face LEFT.
All the same size as the references.""",
}

SHEETS["warianty_grzyb"] = {
    "outline": True,
    "names": ["grzyb_2", "grzyb_3"],
    "size": "1536x1024",
    "rows": 1,
    "refs": ["grzyb"],
    "prompt": f"""A sprite sheet of TWO illustrated objects for a children's picture book, in ONE ROW of 2 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
The reference image shows the game's own mushroom (a brown cep): paint the same style and the same size.
Left to right: a brown-capped cep like the reference but with a wider, flatter cap and a short thick stem; a
brown-capped cep like the reference but young and round, its cap small and domed, a tiny blade of grass at its foot.
Both the same size as the reference.""",
}

# a better bunny variant (a leaping one did not fit a queue or a hiding place) and the morning card with a crowing
# rooster: a child could not tell the morning from the evening by the sun and the colours alone
SHEETS["warianty_zajac2"] = {
    "outline": True,
    "names": ["zajac_3"],
    "size": "1024x1024",
    "rows": 1,
    "refs": ["zajac"],
    "prompt": f"""ONE illustrated object for a children's picture book in the middle of a fully TRANSPARENT background.
NO coloured background, NO glow, NO halo.
{STYL}
The reference image shows the game's own bunny: the same grey-brown bunny, the same style and size, SITTING calmly on
all four paws, seen from the side FACING LEFT, both ears up and a little apart, a small daisy in its mouth.""",
}
SHEETS["pora_rano2"] = {
    "outline": True,
    "names": ["pora_rano"],
    "size": "1024x1024",
    "rows": 1,
    "refs": ["pora_rano"],
    "prompt": f"""ONE illustrated card for a children's picture book in the middle of a fully TRANSPARENT background.
NO glow, NO halo outside the card.
{STYL}
Exactly the reference card - the same rounded frame, the same little house, tree, path and pink morning sky with the
sun rising - with ONE thing added in the front on the left: a proud colourful ROOSTER standing on the fence, beak wide
open, crowing, with three little curved sound lines coming from its beak. Keep everything else as it is.""",
}

# stage 6: the bakery, the dam, the picnic, the tournament
SHEETS["etap6_a"] = {
    "outline": True,
    "names": ['bulka', 'torebka', 'taca', 'bal'],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
Left to right: one round golden bread roll; one small brown paper bag, open at the top, EMPTY; one
long flat wooden tray seen slightly from above, EMPTY; one short thick wooden log lying on its side, its cut end showing
rings.
Each object fills at most a fifth of the sheet's width; a WIDE empty gap between neighbours.""",
}
SHEETS["etap6_b"] = {
    "outline": True,
    "names": ['wiaderko', 'rybka_srebrna', 'kocyk', 'tablica'],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
Left to right: one small blue tin bucket, EMPTY; one small silver-blue fish seen from the side; a small
folded red-and-white checked picnic blanket; one small wooden board on two legs with a blank dark green surface (NO
writing).
Each object fills at most a fifth of the sheet's width; a WIDE empty gap between neighbours.""",
}

# the stage icons again, one per image at 1024 px: on the stage cards they are shown big and the 256 px sheet blurred
SHEETS["ikona_opowiesc_hd"] = {
    "names": ["ikona_opowiesc"],
    "size": "1024x1024",
    "rows": 1,
    "px": 1024,
    "refs": ["ikona_opowiesc"],
    "prompt": f"""ONE illustrated icon for a children's game in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow, NO halo outside it.
{STYL}
The reference image shows the same icon small: paint it again, the same design, colours and soft white rounded-square
card behind it, with crisp clean detail: an open picture book with a tiny fox on its pages (the STORY).""",
}
SHEETS["ikona_cwiczenia_hd"] = {
    "names": ["ikona_cwiczenia"],
    "size": "1024x1024",
    "rows": 1,
    "px": 1024,
    "refs": ["ikona_cwiczenia"],
    "prompt": f"""ONE illustrated icon for a children's game in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow, NO halo outside it.
{STYL}
The reference image shows the same icon small: paint it again, the same design, colours and soft white rounded-square
card behind it, with crisp clean detail: a child's hand with the index finger pointing, tapping (the PRACTICE).""",
}
SHEETS["ikona_dom_hd"] = {
    "names": ["ikona_dom"],
    "size": "1024x1024",
    "rows": 1,
    "px": 1024,
    "refs": ["ikona_dom"],
    "prompt": f"""ONE illustrated icon for a children's game in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow, NO halo outside it.
{STYL}
The reference image shows the same icon small: paint it again, the same design, colours and soft white rounded-square
card behind it, with crisp clean detail: a small cosy house with a red roof and a window (AT HOME).""",
}

# the "oh dear" bubble (efekty.js emocja "pot"): a painted worried face, set into the drawn speech bubble
SHEETS["emocja_ojej"] = {
    "names": ["emocja_ojej"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow, NO halo, NO background.
{STYL}
A round warm-yellow smiley face that looks WORRIED, "oh dear!": eyebrows raised and tilted up in the middle, big round
worried eyes, a small round open mouth like an "o", soft rosy cheeks. Friendly and gentle, NOT scary, NOT crying.""",
}

# long and short at home: five kinds of pasta at their TRUE lengths (one shared scale, not each resized to the sticker)
SHEETS["makarony"] = {
    "outline": True,
    "wspolna_skala": True,
    "names": ["makaron_spaghetti", "makaron_tagliatelle", "makaron_swiderek", "makaron_penne", "makaron_kolanko"],
    "kolumna": True,
    "px": 1024,                 # shown about 4.6 units wide: at 384 px the strands blurred
    "size": "1536x1024",
    "prompt": f"""A sprite sheet of FIVE single pieces of dry uncooked pasta for a children's picture book, on a fully
TRANSPARENT background, each LYING HORIZONTALLY, stacked one under another with generous empty space between them, all
drawn at the SAME real-world scale so their lengths differ a lot. NO coloured background, NO glow, NO halo, NO
vignette, NO light behind them - the space around and between the pieces is completely empty and transparent.
{STYL}
Top to bottom: one long straight thin strand of spaghetti, the longest, almost as wide as the sheet; one flat ribbon
of tagliatelle, about two thirds as long as the spaghetti; one spiral fusilli, about a third as long; one tube of penne
with slanted ends, about a quarter as long; one small curved macaroni elbow, the shortest, about a tenth as long as
the spaghetti. All golden-yellow.""",
}

SHEETS["emocja_smutek"] = {
    "names": ["emocja_smutek"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow, NO halo, NO background.
{STYL}
The same round warm-yellow face as the reference, now SAD: eyebrows tilted down at the sides, eyes looking down, a
small downturned mouth, ONE small tear on one cheek, soft rosy cheeks. Gentle, NOT scary.""",
}

# bigger and smaller: the old hollow's little round door - carried along and held against each new hole (a template)
SHEETS["drzwiczki"] = {
    "names": ["drzwiczki"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["dziupla"],
    "prompt": f"""ONE illustrated object for a children's picture book in the middle of a fully TRANSPARENT background,
filling most of the image. NO glow, NO halo, NO background.
{STYL}
A small ROUND wooden door for the tree hollow in the reference, seen straight on: a perfect circle of light planks with
a thin darker rim, a tiny round knob and a little leaf painted on it. Only the door - NO tree, NO frame.""",
}

# the speech bubbles' signs painted (efekty.js MALOWANE): the vector ones looked foreign next to the painted faces
SHEETS["emocja_serce"] = {
    "names": ["emocja_serce"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: one plump glossy red heart, soft highlight.""",
}
SHEETS["emocja_radosc"] = {
    "names": ["emocja_radosc"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: three sparkling golden stars of different sizes, twinkling, happy.""",
}
SHEETS["emocja_zlosc"] = {
    "names": ["emocja_zlosc"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: a little angry red cartoon storm cloud with a tiny lightning zigzag, cute, not scary.""",
}
SHEETS["emocja_sen"] = {
    "names": ["emocja_sen"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: a small blue crescent moon with three soft 'z' letters floating up, sleepy.""",
}
SHEETS["emocja_wykrzyknik"] = {
    "names": ["emocja_wykrzyknik"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: one big bold red exclamation mark, cheerful and round.""",
}
SHEETS["emocja_zarowka"] = {
    "names": ["emocja_zarowka"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: one glowing yellow light bulb with little rays around it, a bright idea.""",
}
SHEETS["emocja_zimno"] = {
    "names": ["emocja_zimno"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: one pale blue snowflake with a few tiny frost sparkles, cold.""",
}
SHEETS["emocja_mokro"] = {
    "names": ["emocja_mokro"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: ONE single big soft blue water drop, nothing else (no other drops).""",
}
SHEETS["emocja_muzyka"] = {
    "names": ["emocja_muzyka"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: two joined purple music notes with a little sparkle, cheerful.""",
}
SHEETS["emocja_strach"] = {
    "names": ["emocja_strach"],
    "size": "1024x1024",
    "rows": 1,
    "px": 512,
    "refs": ["emocja_ojej"],
    "prompt": f"""ONE illustrated icon for a children's picture book in the middle of a fully TRANSPARENT background, filling
most of the image. NO glow outside it, NO halo, NO background, NO speech bubble, NO text except as described.
{STYL}
The same painted style as the reference: a round warm-yellow face that is SCARED - very wide eyes with small pupils, eyebrows high, the mouth wide open in a gasp, two little shiver lines on each side of the face; cute, not scary.""",
}

SHEETS["domek_skarb"] = {
    "outline": True,
    "names": ["skrzynia", "skrzynia_otwarta", "luneta", "klucz_stary"],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated objects for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO vignette - the space around and between the objects is completely empty and transparent.
{STYL}
Left to right: one small old wooden treasure chest with brass corners, CLOSED, with a keyhole; the SAME chest OPEN,
its lid up, EMPTY inside, a soft golden glimmer inside; one old brass telescope (a spyglass) lying sideways; one big
old iron key with a round bow.
Each object fills at most a fifth of the sheet's width; a WIDE empty gap between neighbours.""",
}

# shapes: four kites, each one clear simple shape (the geometric shape is laid on the chosen one in the game)
SHEETS["latawce"] = {
    "outline": True,
    "names": ["latawiec_kwadrat", "latawiec_prostokat", "latawiec_trojkat", "latawiec_kolo"],
    "size": "1536x1024",
    "rows": 1,
    "prompt": f"""A sprite sheet of FOUR illustrated toy kites for a children's picture book, in ONE ROW of 4 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO sky, NO clouds.
{STYL}
Each kite is seen flat from the front, its sail ONE clear simple shape with a thin wooden frame, a short tail of little
bows hanging down: left to right - a SQUARE kite standing on one corner (a diamond, all four sides equal); a long
RECTANGLE kite, twice as tall as wide; a TRIANGLE kite, point up; a ROUND kite, a perfect circle.
All four the same size, bright different colours.""",
}


# queue: the winners' podium the racers stand on (three steps; the lesson measures their tops on the sticker)
SHEETS["podium"] = {
    "outline": True,
    "names": ["podium"],
    "size": "1536x1024",
    "px": 768,                  # shown about six units wide
    "prompt": f"""ONE illustrated wooden winners' podium for a children's picture book, alone in the middle of a fully
TRANSPARENT background, with generous empty space around it. NO coloured background, NO glow, NO grass, NO ground, NO
shadow.
{STYL}
Seen straight from the front: three plain wide rectangular wooden blocks side by side, touching, all three EXACTLY the
same width, their bottoms on one level line: the MIDDLE block golden yellow and clearly the tallest, the LEFT block
silver grey and a little lower (about three quarters of the middle one's height), the RIGHT block warm bronze brown and
the lowest (about half of the middle one's height). The tops are flat, level and EMPTY; only a thin sliver of each top
is seen. NO numbers, NO medals, NO flags, NO text.""",
}


# mechaniki6 miarka: the units laid end to end (a paw print, a block) and the weight for the scale
SHEETS["miarka_jednostki"] = {
    "outline": True,
    "names": ["lapka_miarka", "klocek_miarka", "odwaznik"],
    "size": "1536x1024",
    "rows": 1,
    "px": 512,
    "refs": ["klocek", "deska_dluga"],
    "prompt": f"""A sprite sheet of THREE illustrated objects for a children's picture book, in ONE ROW of 3 on a fully
TRANSPARENT background, with generous empty space between them so none of them touch. NO coloured background, NO glow,
NO halo, NO ground, NO shadow.
{STYL}
The same painted style as the references. Left to right: one PAW PRINT cut out of thick orange paper, seen flat from
above - one round pad with four small round toe pads above it, all joined into one piece, the toes pointing to the
RIGHT; one plain light-wood toy BLOCK seen straight from the front, a long flat rectangle exactly twice as wide as it is
tall, smooth, with no pattern; one old black cast-iron WEIGHT for a balance scale seen from the front, a squat
bell-like shape with a flat bottom and a little round handle on top, NO numbers, NO letters.
Each object fills at most a fifth of the sheet's width.""",
}
# miarka ruler_cm: a blank ruler - the code draws its ticks and numbers with the pencil (painted digits are unreliable)
SHEETS["linijka"] = {
    "names": ["linijka"],
    "size": "1536x1024",
    "rows": 1,
    "px": 1024,
    "refs": ["deska_dluga"],
    "prompt": f"""ONE illustrated school RULER for a children's picture book, alone and lying perfectly level across the
middle of a fully TRANSPARENT background, filling almost the whole width. NO glow, NO halo, NO background, NO shadow.
{STYL}
A long flat ruler of light yellow wood seen straight from the front: a thin perfectly straight horizontal strip about
twelve times as long as it is tall, square ends, an even width along its whole length, a slightly darker wooden edge
along its top. It is completely BLANK: NO marks, NO lines, NO ticks, NO numbers, NO letters.""",
}
# mechaniki6 szpara: painted gaps a thing is pushed through; the opening is see-through, the code measures it on the alpha
SHEETS["szpara_drzewa"] = {
    "outline": False,           # no die-cut rim: it would narrow the opening
    "names": ["szpara_drzewa"],
    "caly": True,
    "size": "1024x1024",
    "rows": 1,
    "px": 768,
    "refs": ["pniak", "krzak"],
    "prompt": f"""ONE illustrated thing for a children's picture book in the middle of a fully TRANSPARENT background,
filling most of the image. NO glow, NO halo, NO background, NO sky.
{STYL}
TWO young birch trees standing side by side, seen straight from the front, their straight white trunks parallel and
upright, their small green crowns touching above. Between the two trunks a clear EMPTY gap as wide as two trunks, from
the ground up to the crowns: the gap is completely transparent (we see through it), NOTHING in it - no grass, no ground,
no branches, no leaves. Each trunk stands on its own small tuft of grass; nothing joins the two trees at the bottom.""",
}
SHEETS["szpara_furtka"] = {
    "outline": False,           # no die-cut rim: it would narrow the opening
    "names": ["szpara_furtka"],
    "caly": True,
    "size": "1024x1024",
    "rows": 1,
    "px": 768,
    "refs": ["pniak", "deska_dluga"],
    "prompt": f"""ONE illustrated thing for a children's picture book in the middle of a fully TRANSPARENT background,
filling most of the image. NO glow, NO halo, NO background, NO ground.
{STYL}
A short piece of a low wooden picket fence seen straight from the front, with a NARROW OPEN GATEWAY in the middle: on
the left three pickets with their rails and a thick gate post, on the right a thick gate post and three pickets with
their rails. Between the two gate posts the gateway is EMPTY and completely transparent from the bottom edge to the top
(we see through it): NO gate, NO rails across it, NO arch over it, NO ground in it. The gateway is about as wide as one
fence section of three pickets.""",
}
SHEETS["szpara_brama"] = {
    "outline": False,           # no die-cut rim: it would narrow the opening
    "names": ["szpara_brama"],
    "caly": True,
    "size": "1024x1024",
    "rows": 1,
    "px": 768,
    "refs": ["glaz", "pniak"],
    "prompt": f"""ONE illustrated thing for a children's picture book in the middle of a fully TRANSPARENT background,
filling most of the image. NO glow, NO halo, NO background, NO ground.
{STYL}
A low wall of round grey field stones seen straight from the front, with a WIDE OPEN GATEWAY in the middle between two
stone pillars, each pillar topped with a little cap of moss. The gateway is EMPTY and completely transparent from the
bottom edge to the top (we see through it): NO gate, NO arch over it, NO ground, NO path in it. The gateway is wide -
about half of the whole wall's width; the two wall pieces on its sides are short.""",
}
SHEETS["szpara_mostek"] = {
    "outline": False,           # no die-cut rim: it would narrow the opening
    "names": ["szpara_mostek"],
    "caly": True,
    "size": "1024x1024",
    "rows": 1,
    "px": 768,
    "refs": ["glaz", "pniak"],
    "prompt": f"""ONE illustrated thing for a children's picture book in the middle of a fully TRANSPARENT background,
filling most of the image. NO glow, NO halo, NO background, NO water, NO ground.
{STYL}
A small old stone ARCH bridge seen straight from the front, wider than tall, built of round grey stones with moss, a
little grass on its top. Under it ONE low round-topped ARCH opening in the middle: the opening is EMPTY and completely
transparent from the bottom edge up to the stones of the arch (we see through it) - NO water, NO ground, NO path, NO
shadow inside it. The opening is about half of the bridge's width and about half of its height.""",
}

# mechaniki7 zegar: a clock face with an EMPTY dial (the engine draws the hour digits with the pencil - gpt-image cannot
# be trusted with twelve numerals) and its two hands, pointing up, each turning on a round hub at its bottom end
SHEETS["zegar_tarcza"] = {
    "names": ["zegar_tarcza"],
    "size": "1024x1024",
    "rows": 1,
    "px": 1024,
    "prompt": f"""ONE illustrated round wall clock for a children's picture book in the middle of a fully TRANSPARENT
background, filling most of the image. NO glow, NO halo, NO background, NO wall, NO shadow.
{STYL}
Seen exactly straight from the front: a PERFECT CIRCLE. A thick, smooth, warm red painted wooden rim with a soft
highlight, and inside it a plain light cream dial. The dial is COMPLETELY EMPTY: NO numbers, NO marks, NO dots, NO
lines, NO hands, NO centre pin, NO text, NO logo - just the smooth cream surface with a little paper grain.""",
}
SHEETS["zegar_wskazowki"] = {
    "names": ["zegar_krotka", "zegar_dluga"],
    "size": "1536x1024",
    "rows": 1,
    "px": 1024,
    "wspolna_skala": True,     # the short hand stays shorter than the long one
    "prompt": f"""A sprite sheet of TWO separate illustrated clock HANDS for a children's picture book, side by side in ONE
ROW on a fully TRANSPARENT background, with a wide empty gap between them. NO clock face, NO glow, NO halo, NO
background, NO shadow.
{STYL}
Both hands are dark navy blue painted wood, stand exactly VERTICAL and point straight UP, drawn at the SAME scale. Each
has at its BOTTOM end a round flat hub (a small disc) with a tiny golden dot in its middle - the hand turns on it; from
the hub a tapered hand rises to a rounded leaf-shaped tip. Left: the SHORT hour hand, wide and sturdy, about half as
long as the other one. Right: the LONG minute hand, thinner, the tallest thing on the sheet, almost as tall as the
sheet.""",
}
# mechaniki7 peczki: one wooden stick, the red twine that ties ten of them into a bunch, the place-value tray
SHEETS["peczki"] = {
    "names": ["patyczek", "wstazka_peczka"],
    "size": "1536x1024",
    "rows": 1,
    "px": 512,
    "wspolna_skala": True,     # the tie is drawn as wide as a bunch of ten of these sticks
    "prompt": f"""A sprite sheet of TWO separate illustrated things for a children's picture book, side by side in ONE ROW
on a fully TRANSPARENT background, with a wide empty gap between them. NO glow, NO halo, NO background, NO shadow.
{STYL}
Left: ONE single plain wooden counting stick (like an ice-lolly stick but longer), light natural wood with a soft
grain, rounded ends, standing exactly VERTICAL, the tallest thing on the sheet, about eight times as tall as it is wide.
Right: ONLY the red twine that ties a bundle of ten such sticks - a short HORIZONTAL band of thick red twine wound twice
round, as wide as ten of those sticks lying side by side, with a small neat BOW knot in its middle and two short loose
ends. The bundle itself is NOT drawn: no sticks, nothing behind the twine.""",
}
SHEETS["mata_peczki"] = {
    "names": ["mata_peczki"],
    "size": "1536x1024",
    "rows": 1,
    "px": 1024,
    "prompt": f"""ONE illustrated wooden tray for a children's picture book in the middle of a fully TRANSPARENT background,
filling most of the image. NO glow, NO halo, NO background, NO table, NO shadow.
{STYL}
A wide, low, light wooden tray seen straight from ABOVE, a rectangle about twice as wide as it is tall, with a raised
wooden rim, divided by ONE wooden wall down its middle into TWO equal compartments, LEFT and RIGHT. Both compartments
are EMPTY, lined with plain soft green felt. On the rim in front of (below) the LEFT compartment a small round wooden
badge with a little painted bundle of sticks tied with red twine; on the rim below the RIGHT compartment a small round
wooden badge with ONE little painted single stick. NO numbers, NO letters, NO text, nothing inside the compartments.""",
}


def gen(sheet: str) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    dst = WORK / f"{sheet}.png"
    if dst.exists():
        print(f"{dst} exists, skipping")
        return
    s = SHEETS[sheet]
    refs = [OUT / f"{n}.webp" for n in s.get("refs", [])] or None       # existing stickers to match (style, size, colour)
    figgen.generate(s["prompt"], dst, size=s["size"], quality="high", background="transparent", refs=refs)


PX = 384             # sticker side in pixels


def die_cut(im: Image.Image, border: float = 0.055) -> Image.Image:
    """A thick white outline following the object's shape - a sticker cut around it.
    The canvas grows so the outline is not clipped; the object is drawn on top."""
    from scipy import ndimage

    n = im.width; r = max(2, int(n * border)); pad = r + 3
    big = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0)); big.paste(im, (pad, pad))
    a = np.asarray(big)[:, :, 3] > 40
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    disk = (x * x + y * y) <= r * r
    grown = ndimage.binary_dilation(a, structure=disk)
    edge = ndimage.gaussian_filter(grown.astype(np.float32), 1.0)         # soft 1 px edge
    white = np.zeros((big.height, big.width, 4), dtype=np.uint8); white[:, :, :3] = 255
    white[:, :, 3] = np.clip(edge * 255, 0, 255).astype(np.uint8)
    out = Image.alpha_composite(Image.fromarray(white, "RGBA"), big)
    return out.resize((n, n), Image.LANCZOS)              # the sticker's own size (a sheet's `px`), not always PX


def split(sheet: str, min_pikseli: int = 1500) -> None:
    from scipy import ndimage

    names = SHEETS[sheet]["names"]
    im = Image.open(WORK / f"{sheet}.png").convert("RGBA")
    a = np.asarray(im)
    maska = ndimage.binary_closing(a[:, :, 3] > 40, iterations=6)
    etyk, ile = ndimage.label(maska, structure=np.ones((3, 3)))
    if SHEETS[sheet].get("caly"):                        # one thing in separate parts (a gateway's two sides): all alpha is it
        etyk, ile = maska.astype(np.int32), 1
    plamy = []
    for i in range(1, ile + 1):
        ys, xs = np.where(etyk == i)
        if len(ys) >= min_pikseli:
            plamy.append((int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max()), float(ys.mean()), float(xs.mean()), i))
    plamy.sort(key=lambda p: -((p[1] - p[0]) * (p[3] - p[2])))
    plamy = plamy[:len(names)]
    if len(plamy) != len(names):
        print(f"UWAGA: {len(plamy)} plam, oczekiwano {len(names)} - sprawdz arkusz")
    rows = SHEETS[sheet].get("rows", 2 if len(names) > 4 else 1)
    srodek_y = np.median([p[4] for p in plamy])
    if SHEETS[sheet].get("kolumna"):                     # one column, top to bottom
        plamy.sort(key=lambda p: p[4])
    else:
        plamy.sort(key=lambda p: ((0 if p[4] < srodek_y else 1) if rows == 2 else 0, p[5]))
    OUT.mkdir(parents=True, exist_ok=True)
    wspolny = max(max(p[1] - p[0], p[3] - p[2]) for p in plamy) + 16 if SHEETS[sheet].get("wspolna_skala") else None
    for nazwa, (y0, y1, x0, x1, _, _, lab) in zip(names, plamy):
        pad = 8
        box = (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))
        # only this object's own blob: a neighbour's leaf reaching into the box came along with its outline
        wlasna = ndimage.binary_dilation(etyk[box[1]:box[3], box[0]:box[2]] == lab, iterations=3)
        k = np.asarray(im.crop(box)).copy(); k[:, :, 3] = np.where(wlasna, k[:, :, 3], 0)
        kaw = Image.fromarray(k, "RGBA")
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
