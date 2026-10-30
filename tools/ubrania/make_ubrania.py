"""The wardrobe for dressing up (game/engine/ubior.js): one gpt-image picture per garment with its three views
side by side (front, side facing right, back), split by alpha into game/assets/ubrania/<name>_<view>.webp, and
the gallery game/assets/ubrania/ubrania.json (slot, views, fit).

  python tools/ubrania/make_ubrania.py gen [name ...]     # work/<name>.png (resumable: existing ones are kept)
  python tools/ubrania/make_ubrania.py split [name ...]   # -> game/assets/ubrania + ubrania.json
  python tools/ubrania/make_ubrania.py all [name ...]

A garment = an entry in RZECZY. The engine fits it to every humanoid from the character's own pieces, so a
garment is drawn alone, never on a character. Shoes are ONE shoe per view (the engine puts one on each foot).
"""

from __future__ import annotations

import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "ubrania"

STYL = """STYLE: modern children's picture-book illustration - soft painterly shading with a fine paper-grain
texture, warm friendly colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO ground shadow,
NO text, NO character, NO head, NO mannequin: the object alone, as if it floated."""

def _trzy(co: str, widoki: str) -> str:
    return f"""Three views of the SAME {co}, side by side in one row on a fully TRANSPARENT background, with wide
empty space between them so they never touch. {widoki} The three views have exactly the same size, colours
and details, so they read as one object turned around.
{STYL}"""

NA_GLOWIE = """Seen EXACTLY at eye level, as it looks when worn on a head: the opening and the inside of the hat
are NOT visible at all - NO inner lining, NO dark hole, NO inside of the crown; the bottom edge is one clean
straight horizontal line (where it would sit on the head)."""
HAT = "Left: seen from the FRONT. Middle: seen from the SIDE, facing right. Right: seen from the BACK. " + NA_GLOWIE
BUT = """Seen EXACTLY at the level of the shoe, as it looks when worn: the top opening and the inside of the shoe
are NOT visible at all - NO hole, NO lining at the top; the top edge is one clean straight line (where the leg
goes in)."""
RZECZY = {
    "czapka_zimowa": {"slot": "glowa", "prompt": _trzy("knitted winter beanie hat with a big fluffy pompom on top, red with a white folded brim, empty inside (nobody wears it), its bottom edge a gentle arc", HAT)},
    "kapelusz": {"slot": "glowa", "nasun": 0.22, "szer": 1.25, "prompt": _trzy("straw sun hat with a wide round brim and a blue ribbon around the crown, empty (nobody wears it)", HAT)},
    "czapka_z_daszkiem": {"slot": "glowa", "nasun": 0.28, "prompt": _trzy("children's baseball cap, yellow with a green peak, empty (nobody wears it); in the side view the peak points right", HAT)},
    "korona": {"slot": "glowa", "nasun": 0.12, "szer": 0.85, "prompt": _trzy("paper party crown, golden yellow with five pointed tips and little coloured gems, a ring of paper, empty", HAT)},
    "okulary": {"slot": "oczy", "widoki": ["przod", "profil"], "prompt": """Two views of the SAME pair of
children's round glasses with thick red frames, side by side in one row on a fully TRANSPARENT background, wide
empty space between them. Left: seen from the FRONT (both round lenses, the bridge, the arms hidden). Right: seen
from the SIDE facing right (one round lens seen edge-on, the arm going left). Lenses clear and light, nearly
invisible.
""" + STYL},
    "szalik": {"slot": "szyja", "prompt": _trzy("cosy striped scarf wrapped once around a neck (an empty ring of scarf, nobody inside), blue and white stripes, one fringed end hanging down the front", HAT)},
    "kalosze": {"slot": "stopy", "prompt": _trzy("single short yellow rubber rain boot (ONE boot, not a pair), shiny, with a rounded toe", "Left: seen from the FRONT (toe towards us). Middle: seen from the SIDE, toe pointing right. Right: seen from the BACK (the heel). " + BUT)},
    "trampki": {"slot": "stopy", "prompt": _trzy("single low children's sneaker (ONE shoe, not a pair), blue with white laces and a white rubber sole", "Left: seen from the FRONT (toe towards us). Middle: seen from the SIDE, toe pointing right. Right: seen from the BACK (the heel). " + BUT)},
}
# children like a choice: three of every kind (the first ones above, two variants each here)
_WARIANTY = {
    "czapka_zimowa": [("czapka_zimowa_2", "knitted winter beanie hat with a big fluffy pompom on top, mint green with yellow stripes and a folded brim, empty inside (nobody wears it), its bottom edge a gentle arc"),
                      ("czapka_zimowa_3", "knitted winter beanie hat with two little knitted bear ears on top instead of a pompom, purple with white snowflakes and a folded brim, empty inside (nobody wears it)")],
    "kapelusz": [("kapelusz_2", "pink sun hat with a wide soft floppy brim and a big daisy flower on the side, empty (nobody wears it)"),
                 ("kapelusz_3", "small green explorer's safari hat with a short round brim and a brown band, empty (nobody wears it)")],
    "czapka_z_daszkiem": [("czapka_z_daszkiem_2", "children's baseball cap, red with a white peak and a white star on the front, empty (nobody wears it); in the side view the peak points right"),
                          ("czapka_z_daszkiem_3", "children's baseball cap, light blue with a dark blue peak and a small cloud on the front, empty (nobody wears it); in the side view the peak points right")],
    "korona": [("korona_2", "silver paper party crown with three tall rounded tips and pink hearts, a ring of paper, empty"),
               ("korona_3", "a ring of fresh flowers worn as a crown (a flower wreath) with daisies, poppies and green leaves, empty")],
    "szalik": [("szalik_2", "cosy striped scarf wrapped once around a neck (an empty ring of scarf, nobody inside), red and yellow stripes, one fringed end hanging down the front"),
               ("szalik_3", "cosy knitted scarf wrapped once around a neck (an empty ring of scarf, nobody inside), green with white polka dots, one end with a pompom hanging down the front")],
    "kalosze": [("kalosze_2", "single short red rubber rain boot with white polka dots (ONE boot, not a pair), shiny, with a rounded toe"),
                ("kalosze_3", "single short green rubber rain boot shaped like a frog, with two little frog eyes on the toe (ONE boot, not a pair)")],
    "trampki": [("trampki_2", "single low children's sneaker (ONE shoe, not a pair), pink with white laces and a white rubber sole"),
                ("trampki_3", "single low children's sneaker (ONE shoe, not a pair), green with yellow velcro straps and a white rubber sole")],
}
for _baza, _lista in _WARIANTY.items():
    _b = RZECZY[_baza]
    for _n, _opis in _lista:
        _r = {k: v for k, v in _b.items() if k != "prompt"}
        if _b["slot"] == "stopy":
            _r["prompt"] = _trzy(_opis, "Left: seen from the FRONT (toe towards us). Middle: seen from the SIDE, toe pointing right. Right: seen from the BACK (the heel). " + BUT)
        else:
            _r["prompt"] = _trzy(_opis, HAT)
        RZECZY[_n] = _r
_OKULARY = """Two views of the SAME pair of children's glasses {co}, side by side in one row on a fully TRANSPARENT
background, wide empty space between them. Left: seen from the FRONT (both lenses, the bridge, the arms hidden).
Right: seen from the SIDE facing right (one lens seen edge-on, the arm going left). Lenses clear and light, nearly
invisible.
""" + STYL
RZECZY["okulary_2"] = {"slot": "oczy", "widoki": ["przod", "profil"], "prompt": _OKULARY.format(co="with blue star-shaped frames")}
RZECZY["okulary_3"] = {"slot": "oczy", "widoki": ["przod", "profil"], "prompt": _OKULARY.format(co="with green square frames with rounded corners")}

WIDOKI = ["przod", "profil", "tyl"]
# every shoe is stored at the boots' proportions per view (a low shoe padded with transparency on top), so the
# engine fits them all alike; `pasma` keeps the low shoe out of the shaft band the engine shortens
WZOR_BUTA = "kalosze"


def na_wzor_buta(kaw: Image.Image, w: str) -> tuple[Image.Image, float]:
    wz = OUT / f"{WZOR_BUTA}_{w}.webp"
    prop = Image.open(wz).height / Image.open(wz).width if wz.exists() else 1.0
    H = round(kaw.width * prop)
    if H <= kaw.height:
        return kaw, 1.0
    out = Image.new("RGBA", (kaw.width, H), (0, 0, 0, 0)); out.paste(kaw, (0, H - kaw.height))
    return out, kaw.height / H


def gen(nazwy: list[str]) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    def jeden(n):
        dst = WORK / f"{n}.png"
        if dst.exists():
            return
        print(f"{n}...", flush=True)
        figgen.generate(RZECZY[n]["prompt"], dst, size="1536x1024", quality="high", background="transparent")
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(jeden, nazwy))


def split(nazwy: list[str]) -> None:
    from scipy import ndimage
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / "ubrania.json"
    gal = json.loads(p.read_text(encoding="utf8")) if p.exists() else {}
    for n in nazwy:
        src = WORK / f"{n}.png"
        if not src.exists():
            print(f"brak {src}"); continue
        r = RZECZY[n]; widoki = r.get("widoki", WIDOKI)
        im = Image.open(src).convert("RGBA"); a = np.asarray(im)
        maska = ndimage.binary_closing(a[:, :, 3] > 40, iterations=4)
        etyk, ile = ndimage.label(maska, structure=np.ones((3, 3)))
        plamy = []
        for i in range(1, ile + 1):
            ys, xs = np.where(etyk == i)
            if len(ys) > 1500:
                plamy.append((len(ys), int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())))
        plamy = sorted(sorted(plamy, reverse=True)[:len(widoki)], key=lambda q: q[3])
        if len(plamy) != len(widoki):
            print(f"UWAGA {n}: {len(plamy)} plam, oczekiwano {len(widoki)}")
        pliki, udzial = {}, 0.0
        for w, (_, y0, y1, x0, x1) in zip(widoki, plamy):
            kaw = im.crop((x0, y0, x1 + 1, y1 + 1))
            m = np.asarray(kaw).copy(); m[(etyk[y0:y1 + 1, x0:x1 + 1] == 0) & (m[:, :, 3] < 40)] = 0
            kaw = Image.fromarray(m)
            if r["slot"] == "stopy" and not n.startswith(WZOR_BUTA):
                kaw, u = na_wzor_buta(kaw, w); udzial = max(udzial, u)
            kaw.thumbnail((512, 512), Image.LANCZOS)
            plik = f"{n}_{w}.webp"; kaw.save(OUT / plik, "WEBP", quality=85, method=6, exact=True)
            pliki[w] = plik
        wpis = {"slot": r["slot"], "widoki": pliki}
        for k in ("szer", "nasun", "do"):
            if k in r: wpis[k] = r[k]
        if udzial:
            wpis["pasma"] = [round(udzial + 0.02, 3), 0.0]
        gal.get(n, {}).pop("do", None)
        gal[n] = {**gal.get(n, {}), **wpis}
        print(f"{n}: {', '.join(pliki)}")
    p.write_text(json.dumps(gal, ensure_ascii=False, indent=2), encoding="utf8")


if __name__ == "__main__":
    cmd, *nazwy = sys.argv[1:] or ["all"]
    nazwy = nazwy or list(RZECZY)
    if cmd in ("gen", "all"):
        gen(nazwy)
    if cmd in ("split", "all"):
        split(nazwy)
