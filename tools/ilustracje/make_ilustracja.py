"""Event illustrations (ilustracje.js, ctx.ilustracja): a full picture of what the puppets cannot act - a storm at night,
a train on a bridge, the parents applauding. It lands on the screen like a big stamp and the characters speak over it
from a round badge.

  python tools/ilustracje/make_ilustracja.py pociag_most        # -> game/assets/ilustracje/<name>/obraz.webp + meta.json
  python tools/ilustracje/make_ilustracja.py                    # every one that is not built yet

Cast and place come from REFERENCES (the characters' front references, a scenery plate), so the picture keeps the
game's style and characters. Delete work/<name>.png to redraw.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent / "work"
OUT = ROOT / "game" / "assets" / "ilustracje"
CHARACTERS = ROOT / "tools" / "characters" / "work"
BACKGROUNDS = ROOT / "tools" / "backgrounds" / "work"
STYL = ("STYLE: exactly the style of the reference images - a modern children's picture-book illustration, soft "
        "painterly shading with a fine paper-grain texture, warm friendly colours, thin soft outlines. NOT flat vector, "
        "NOT 3D render. A full-bleed picture with no border, NO text, NO letters, NO numbers, NO speech bubbles.")
POSTAC = {
    "lisek": "the FOX", "wiewiorka": "the SQUIRREL (three quarters of the fox's height)", "sowa": "the OWL",
    "sarenka": "the ROE DEER", "mis": "the BEAR (the tallest)", "jez": "the small HEDGEHOG", "kret": "the MOLE",
    "bobr": "the BEAVER", "zajac": "the BUNNY",
}
# name: {postacie: [who], tlo: scenery plate or None, scena: what happens, lekcje: [ids] (for the manager)}
ILUSTRACJE = {
    # up_down home: the payoff - the apple pie from the apples the lift brought down, in the tidy hallway
    "szarlotka_wiewiorki": {
        "postacie": ["wiewiorka", "lisek", "zajac"], "tlo": "przedpokoj", "lekcje": ["up_down"],
        "scena": """Squirrel's cosy home from the reference picture (the same warm walls, the round window, the row of hooks
on the wall), in warm evening light. On the hooks hang a red hat, a long striped scarf and a little backpack. In the
middle a small round wooden table with a checked tablecloth; on it ONE big golden APPLE PIE just out of the oven,
steaming, one slice cut out, and a wicker basket full of red apples. The SQUIRREL, wearing oven mitts, proudly sets the
pie down; the FOX holds a plate with a slice of pie and smiles; the BUNNY licks his lips with a fork in his paw.
Cosy, happy and calm - friends together after a day of picking apples.""",
    },
    # numbers_1_5 home: the payoff - the promised picnic by the lake the next day, the five packed things laid out
    "piknik_nad_jeziorem": {
        "postacie": ["kret", "mis", "sowa"], "tlo": "stacja_jezioro", "lekcje": ["numbers_1_5"],
        "scena": """A sunny PICNIC on the green grass by the blue lake from the reference picture, the little red engine on the
rails behind and the wooden pier on the lake. The MOLE, the BEAR and the OWL sit on a red-and-white checked blanket,
laughing; an open little backpack lies on the blanket and in front of it EXACTLY FIVE things are laid out in a row: one
red apple, one sandwich, one cap, one ball, one small picture book. On the water near the shore a mother duck swims with
her yellow ducklings; the bear holds out a piece of bread to them. Warm morning light, a joyful day out.""",
    },
    # logical_pairs home: the payoff - Deer's promised tea, every cup on its saucer, the teapot in the middle
    "herbatka_u_sarenki": {
        "postacie": ["sarenka", "bobr", "kret"], "tlo": "przedpokoj", "lekcje": ["logical_pairs"],
        "scena": """Deer's cosy home from the reference picture (the same warm walls, the round window), in warm afternoon light,
now with a small round wooden table in the middle covered with a checked tablecloth. On it a round white TEAPOT with a
little blue flower, three white CUPS each standing on its own white SAUCER, a spoon beside each, a plate of biscuits.
Around the table the ROE DEER pours tea from the teapot, smiling as the hostess; the BEAVER holds his cup on its saucer
and smiles; the MOLE, with his little HAMMER tucked under his arm, sips from his cup with happy closed eyes. A big
golden STAR-shaped key hangs on a hook by the door. Calm, happy and cosy - friends together after the storm.""",
    },
    # more_fewer story: the night everyone came for - the fireflies dance over the glade
    "taniec_swietlikow": {
        "postacie": ["lisek", "wiewiorka", "sowa", "sarenka"], "tlo": "polana_wieczorem", "lekcje": ["more_fewer"],
        "scena": """The grassy glade from the reference picture at NIGHT: a deep dark-blue starry sky, a smiling crescent moon,
the big oak with a little round lit window on the left, everything in soft blue moonlight. In the middle of the sky over
the glade HUNDREDS of tiny glowing yellow-green FIREFLIES dance in a big swirling ribbon, loops and spirals of little
lights, some coming down low over the grass. In the front on the grass stand the FOX, the SQUIRREL, the OWL and the ROE
DEER side by side, seen a little from behind and the side, looking up at the dance with delight; each holds a small glass
jar lantern glowing warm yellow with one firefly inside. The SQUIRREL laughs with her paws raised - she is not afraid of
the dark any more. Magical, calm and joyful.""",
    },
    # more_fewer home: the payoff - the sleepover, everyone asleep on the rug, the fireflies dancing outside the window
    "nocowanie": {
        "postacie": ["lisek", "wiewiorka", "sowa", "sarenka"], "tlo": "pokoj_noc", "lekcje": ["more_fewer"],
        "scena": """The children's room from the reference picture at night, lit only by the small warm bedside lamp and the
moon through the window. On the big round blue rug in the middle the FOX, the SQUIRREL, the OWL and the ROE DEER lie
asleep side by side under soft blankets, EACH with its head on its OWN white PILLOW (exactly four pillows under four
heads), eyes closed, smiling in their sleep. A few white feathers still lie on the rug from the pillow fight. Outside the
window, in the dark blue sky by the crescent moon, a little swirl of glowing yellow fireflies dances. Quiet, cosy and
sleepy - goodnight.""",
    },
    # noticing_order story: the payoff - the chick hatches in the henhouse yard, the hen beside it, the friends watching
    "wyklucie": {
        "postacie": ["zajac", "sowa", "lisek"], "tlo": "kurnik", "lekcje": ["noticing_order"],
        "scena": """The sunny henhouse yard from the reference picture. In the front middle, on the ground, a round straw NEST;
in it a white EGG has just CRACKED open - the top of the shell lifted off, and a tiny fluffy yellow CHICK pokes its head
and wings out, its beak wide open as it cheeps, little pieces of shell around it. A big white HEN with a red comb stands
right beside the nest, bending her head down lovingly to her chick. Behind the nest, a little apart, the BUNNY crouches
down with both paws on his cheeks, amazed and delighted; the OWL stands next to him smiling warmly with her wings
folded; the FOX kneels at the other side, smiling. Golden afternoon light, warm and joyful - a new little life.""",
    },
    # noticing_order home: the payoff - after the sandwiches Owl reads the whole picture book at the kitchen table
    "czytanie_ksiazeczki": {
        "postacie": ["sowa", "zajac", "lisek"], "tlo": "dom", "lekcje": ["noticing_order"],
        "scena": """The cosy kitchen from the reference picture, in warm late-afternoon light. Around the big wooden table sit
the OWL, the BUNNY and the FOX. On the table three plates with half-eaten sandwiches (bread, butter and yellow cheese),
crumbs, three cups of milk. The OWL holds an open picture book with both wings and reads it aloud; on the open pages a
simple picture of a white egg in a straw nest. The BUNNY leans in close with his chin on his paws, listening with shining
eyes; the FOX listens too, smiling. Calm, happy and cosy - the promised story at last.""",
    },
    # counting_3 home: the payoff - Hedgehog blows out the three candles of his birthday cake in the kitchen
    "zdmuchiwanie_swieczek": {
        "postacie": ["jez", "mis", "wiewiorka"], "tlo": "dom", "lekcje": ["counting_3"],
        "scena": """Hedgehog's BIRTHDAY PARTY at the big wooden kitchen table from the reference picture, warm afternoon light
through the window, a few colourful paper streamers and balloons by the window. On the table in the middle a round
birthday CAKE with pink icing; on top of it EXACTLY THREE red RASPBERRIES and EXACTLY THREE thin candles, their little
flames just blown sideways and going out, with tiny wisps of smoke. The little HEDGEHOG stands on a chair at the table,
cheeks puffed out, blowing the candles out with all his might, eyes shut with joy. The BEAR stands on one side clapping
his paws, beaming; the SQUIRREL on the other side throws a handful of confetti. EXACTLY THREE small plates on the table,
one in front of each of them, and a little red toy drum with two drumsticks beside the hedgehog's plate. Happy, warm,
festive.""",
    },
    # morning_night story: Mole's first morning - he climbs out of his burrow onto the meadow as the sun rises
    "wschod_slonca": {
        "postacie": ["kret", "wiewiorka", "sarenka"], "tlo": "laka", "lekcje": ["morning_night"],
        "scena": """Early MORNING on the meadow from the reference picture, at SUNRISE: the big round orange SUN is just coming
up over the far hills, the sky pink, gold and pale blue, long soft morning light over the dewy grass, a little mist in
the hollows. In the front a small round MOLEHILL of brown earth with a hole in the top; the MOLE has just climbed half
out of it, his front paws on the grass, blinking at the light with one paw shading his eyes, amazed. The SQUIRREL stands
beside the molehill pointing happily at the rising sun; the ROE DEER stands a little behind, smiling at the mole. A few
birds fly over the sun. Fresh, bright and hopeful - the first morning the mole has ever seen.""",
    },
    # morning_night home: the payoff - the next morning in the bedroom, Mole wakes up with his friends when the sun rises
    "pobudka_rano": {
        "postacie": ["kret", "wiewiorka", "sarenka"], "tlo": "pokoj", "lekcje": ["morning_night"],
        "scena": """The NEXT MORNING in the children's bedroom from the reference picture: bright morning SUN streams in through
the big window, the round sun low over the green trees outside, a pink and gold morning sky, warm sunbeams across the
floor. The MOLE sits up in the bed under the blue blanket, stretching both paws high with a big happy smile, wide awake;
striped pyjamas on him. The SQUIRREL, who slept in a little nest of cushions on the rug, waves at him; the ROE DEER
stands by the window and opens the curtain wider. On the bedside table a closed picture book. Cheerful, fresh, the
start of a new day.""",
    },
    # shapes home: the payoff - tea at Hedgehog's new house built of shapes, the shape biscuits on four plates
    "herbatka_u_jeza": {
        "postacie": ["jez", "lisek", "sowa", "zajac"], "tlo": "laka", "lekcje": ["shapes"],
        "scena": """A cosy TEA PARTY on the meadow from the reference picture, late afternoon in golden autumn light. In the
middle stands the little HEDGEHOG's new HOUSE built of big flat shapes, exactly like a child's drawing: a big blue
SQUARE for the walls; a PLAIN yellow TRIANGLE roof on top with nothing on it; ON THE BLUE WALL, on the right, a round red
CIRCLE window; on the left of the same wall a green upright RECTANGLE door standing open. In front of it a small round
wooden table with four cups of tea and FOUR plates of golden biscuits: one plate of round biscuits, one of square
biscuits, one of triangle biscuits, one of rectangle biscuits. The little HEDGEHOG, the host, stands proudly at his open
door pouring tea from a teapot; the FOX, the OWL and the BUNNY sit round the table holding biscuits, laughing. A square
kite on a string is tied to the house and flies high in the sky. A few autumn leaves on the grass. Warm, happy, homely.""",
    },
    # ordering home: the payoff - the evening concert promised all lesson, at night on the glade
    "koncert_noc": {
        "postacie": ["bobr", "zajac", "sowa"], "tlo": "polana_koncert", "lekcje": ["ordering"],
        "scena": """The evening CONCERT at NIGHT on the forest glade from the reference picture: a deep blue sky full of stars
and a round moon, the string of paper lanterns over the little log stage glowing warm gold, fireflies in the air. On the
stage the BEAVER plays FOUR water glasses standing in a row on a little table, from the fullest (on the left) to the
emptiest (on the right), tapping them with a spoon, his eyes closed with joy; beside him the BUNNY beats a small drum;
the OWL stands in front and conducts with one wing. In front of the owl THREE little fluffy grey OWLETS stand in a row
from the smallest to the biggest, beaks open, singing. At the side of the stage a TOWER of four wooden blocks - a big red
one at the bottom, a yellow, a green and the smallest blue one on top - with a glowing glass jar lantern on the very top.
On the tree stumps in front small forest guests seen from behind (a hedgehog, a mole, a squirrel) listen happily. Warm,
magical and joyful.""",
    },
    # tall_short: Bear's wish kept - from the treehouse window the whole forest from above
    "las_z_domku": {
        "postacie": ["mis", "wiewiorka", "lisek"], "tlo": "domek_wnetrze", "lekcje": ["tall_short"],
        "scena": """The view from HIGH UP in a treehouse: in the foreground the big round wooden window of the treehouse from the
reference picture, and leaning out of it, seen from behind and a little from the side, the BEAR with his paws on the
sill, the FOX and the little SQUIRREL beside him, all three looking out and down in wonder. Below and far away the
WHOLE FOREST seen from above: soft green tree tops rolling to the hills, a winding brook glittering, a small orchard
with apple trees in a clearing right below, a meadow, birds flying BELOW the window. Bright summer morning, a wide
open sky. The feeling: we are so high up, we can see everything.""",
    },
    # tall_short home: the payoff - Hedgehog on Bear's shoulders sees the forest through the spyglass (higher, not taller)
    "jez_na_ramionach": {
        "postacie": ["mis", "jez", "lisek", "wiewiorka"], "tlo": "przedpokoj", "lekcje": ["tall_short"],
        "scena": """In the cosy hallway from the reference picture, by its big ROUND window: the BEAR stands tall and carries the
little HEDGEHOG on his shoulders; the HEDGEHOG, now high up by the round window, holds an old brass SPYGLASS to his
eye and looks out through the window at the green forest outside, delighted. The BEAR holds the hedgehog's little feet
and laughs. Below them the FOX and the SQUIRREL look up at them, laughing and clapping. On the wall beside them a
wooden HEIGHT CHART with four short coloured pencil marks at different heights. Warm afternoon light, happy and funny.""",
    },
    # long_short: the picnic at the end of the short path - the long baguette is enough for everybody
    "piknik_polana": {
        "postacie": ["sarenka", "lisek", "wiewiorka"], "tlo": "polana_piknik", "lekcje": ["long_short"],
        "scena": """A happy PICNIC on the sunny glade from the reference picture: the ROE DEER, the FOX and the SQUIRREL sit
together on the red-and-white checked blanket under the big oak, the wicker basket open beside them. The FOX holds up
ONE very LONG baguette of bread and is breaking it into pieces; the SQUIRREL already nibbles her piece, the DEER takes
hers; a jug of juice and three cups. The squirrel wears a long blue-and-white striped scarf. Behind them a narrow
footpath comes almost straight across the meadow to the blanket. Warm summer light, everybody smiling.""",
    },
    # long_short home: dinner in the kitchen - the longest and the shortest pasta from one pot
    "obiad_makaron": {
        "postacie": ["sarenka", "lisek", "wiewiorka"], "tlo": "dom", "lekcje": ["long_short"],
        "scena": """DINNER in the kitchen from the reference picture, evening light: the ROE DEER, the FOX and the SQUIRREL sit
at the wooden table round one big steaming pot of pasta. The FOX slurps ONE very LONG strand of spaghetti that goes from
his plate up to his mouth, his cheeks puffed, laughing; the little SQUIRREL holds up ONE tiny short elbow macaroni on her
fork, delighted; the DEER laughs at them. Plates, forks, a bowl of grated cheese. Cosy and funny.""",
    },
    # spot_difference home: the payoff - at night Granny Owl opens her little door and finds Owl's drawing waiting there
    "babcia_laurka": {
        "postacie": ["sowa"], "tlo": "dab_babci", "lekcje": ["spot_difference"],
        "scena": """NIGHT at the big old oak from the reference picture: a round full moon and stars, a deep blue sky, the
meadow silver in the moonlight. High in the trunk the little ROUND WOODEN DOOR stands open, warm golden candle light
shining out of it. In the doorway stands GRANNY OWL - an OLD owl drawn like the reference owl but with soft grey-white
feathers, small round spectacles on her beak and a knitted lilac shawl round her shoulders. With both wings she holds
up a child's crayon DRAWING (a sun with rays, a little house with a red roof, a tree and an orange kitten) and looks
at it, deeply touched and smiling, one wing on her heart. A little lantern hangs by the door. Calm, warm, magical.
Granny Owl is the ONLY animal in the picture: the reference owl only shows how owls are drawn - NO young owl, NO
other animal anywhere, the meadow under the oak is empty.""",
    },
    # bigger_smaller: the problem, big and funny - Squirrel has outgrown her old hollow, only her head goes in
    "wiewiorka_utknela": {
        "postacie": ["wiewiorka"], "tlo": "las", "lekcje": ["bigger_smaller"],
        "scena": """In the forest from the reference picture, a close view of a tree trunk with a SMALL round hollow in it. The
SQUIRREL has pushed only her HEAD into the little round hole; her whole body is stuck OUTSIDE: her plump body pressed
against the bark, her hind paws kicking in the air, her big fluffy tail sticking up, her front paws pushing on the
trunk. The hole is clearly much too small for her - her shoulders cannot go in. A few acorns and nuts fall around,
a leaf flutters. Funny, not scary: a comic moment, the trunk and the hole big in the picture.""",
    },
    # bigger_smaller home: the housewarming in Squirrel's new hollow - every cup, chair and jar its own size
    "parapetowka": {
        "postacie": ["wiewiorka", "lisek", "sowa"], "tlo": "dziupla_wnetrze", "lekcje": ["bigger_smaller"],
        "scena": """A cosy HOUSEWARMING party inside the squirrel's round hollow home from the reference picture: the SQUIRREL,
the FOX and the OWL sit round a small round wooden table, laughing and raising their cups. The OWL on the BIGGEST chair,
the FOX on a middle chair, the little SQUIRREL on the SMALLEST chair; a big cup for the fox, a small cup for the squirrel.
On the BIG shelf on the wall stands one BIG open cardboard box full of nuts and acorns, on the SMALL shelf one small
open cardboard box full of nuts. A plate of acorn
cookies on the table, a little garland of leaves, warm light, steam from the cups. A joyful party.""",
    },
    "pociag_most": {
        "postacie": ["kret", "mis", "sowa"], "tlo": "las", "lekcje": ["numbers_1_5"],
        "scena": """A little red steam train with FIVE small wooden wagons crosses a high wooden bridge over a forest valley,
seen from the side and a little from below, the whole train in the picture going from left to right. The MOLE drives the
engine, leaning out of the cab, waving his cap; a puff of white steam rises from the chimney. In the second wagon the
BEAR, in the fourth the OWL, both looking out happily over the valley. Far below a small river, autumn trees, a blue
sky with round clouds. A feeling of a joyful journey.""",
    },
    # one_many: the night the first snow falls - Squirrel's store is safe, the garden goes white
    "pierwszy_snieg": {
        "postacie": ["wiewiorka"], "tlo": "ogrod", "lekcje": ["one_many"],
        "scena": """NIGHT in the vegetable garden from the reference picture: the FIRST SNOW is falling in big soft flakes,
the beds and the fence turning white. At the round window of a hollow in a big tree at the side, the SQUIRREL looks out
in her pyjamas, holding a candle, amazed, her nose against the glass; inside behind her a little shelf full of nuts.
Dark blue sky, a warm glow from the window. Calm and magical.""",
    },
    # one_many home: the winter feast at Squirrel's table - one cake, many cherries, the friends, the ducklings visiting
    "uczta_zima": {
        "postacie": ["wiewiorka", "lisek", "sarenka"], "tlo": "dom", "lekcje": ["one_many"],
        "scena": """A cosy winter FEAST in the kitchen from the reference picture, snow outside the window: the SQUIRREL, the
FOX and the ROE DEER sit round the wooden table, laughing; in the middle ONE big apple cake on a plate and a bowl full
of many red cherries; one big orange pumpkin on the shelf; a little HEDGEHOG and a mother DUCK with her fluffy yellow
ducklings have come to visit and stand by the table. Warm light, steam from cups of tea.""",
    },
    "burza_noc": {
        "postacie": [], "tlo": "strumyk", "lekcje": ["logical_pairs"],
        "scena": """The brook from the reference picture at NIGHT in a big storm: dark blue sky with heavy clouds, one bright
zigzag of lightning lighting the scene, slanting rain. The strong wind blows things off a little wooden table by the
water and carries them through the air: a red cup, a saucer, a hammer, a paintbrush, a key, a small pot of paint -
each one clearly visible, flying in the wind. The trees bend in the wind. Dramatic but not scary - a picture-book
storm for small children.""",
    },
}


def build(n: str) -> None:
    z = ILUSTRACJE[n]
    refs = [CHARACTERS / k / "postac.png" for k in z["postacie"]] + ([BACKGROUNDS / z["tlo"] / "plyta.png"] if z.get("tlo") else [])
    for r in refs:
        if not r.exists(): raise SystemExit(f"missing reference {r}")
    kto = ", ".join(f"{POSTAC[k]} (reference {i + 1})" for i, k in enumerate(z["postacie"]))
    obsada = (f"The characters are {kto} - draw each exactly as in its reference (same design, colours, proportions). "
              if kto else "")
    miejsce = f"The place is the one in the last reference picture (same colours, simplified). " if z.get("tlo") else ""
    prompt = f"An OBLONG picture-book illustration of one moment of a story. {obsada}{miejsce}{z['scena']} {STYL}"
    WORK.mkdir(parents=True, exist_ok=True)
    raw = WORK / f"{n}.png"
    if not raw.exists():
        print(f"{n}: generating...", flush=True)
        figgen.generate(prompt, raw, refs=refs or None, size="1536x1024", quality="high", background="opaque")
    im = Image.open(raw).convert("RGB")
    k = 1280 / max(im.size)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = OUT / n; out.mkdir(parents=True, exist_ok=True)
    im.save(out / "obraz.webp", "WEBP", quality=84, method=6)
    (out / "meta.json").write_text(json.dumps({"szerokosc": im.width, "wysokosc": im.height, "postacie": z["postacie"],
                                               "lekcje": z.get("lekcje", []), "opis": " ".join(z["scena"].split())},
                                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{n}: {im.width}x{im.height}")


if __name__ == "__main__":
    for n in sys.argv[1:] or ILUSTRACJE:
        if sys.argv[1:] or not (OUT / n / "obraz.webp").exists():
            build(n)
