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
    "pociag_most": {
        "postacie": ["kret", "mis", "sowa"], "tlo": "las", "lekcje": ["numbers_1_5"],
        "scena": """A little red steam train with FIVE small wooden wagons crosses a high wooden bridge over a forest valley,
seen from the side and a little from below, the whole train in the picture going from left to right. The MOLE drives the
engine, leaning out of the cab, waving his cap; a puff of white steam rises from the chimney. In the second wagon the
BEAR, in the fourth the OWL, both looking out happily over the valley. Far below a small river, autumn trees, a blue
sky with round clouds. A feeling of a joyful journey.""",
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
