"""Illustrated backgrounds: plate + movers (two gpt-image passes, the second
with the plate as reference), then the difference cut into PNG props with alpha
that the engine (game/engine/tlo2d.js) sways or drifts.

  python tools/backgrounds/make_background.py gen sad      # work/sad/plyta.png, ruch.png
  python tools/backgrounds/make_background.py split sad    # work/sad/rekwizyt_NN.png + rekwizyty.json
  python tools/backgrounds/make_background.py install sad  # -> game/assets/backgrounds/sad/
  python tools/backgrounds/make_background.py all sad

A new scene = an entry in SCENY (plate prompt + movers prompt) + `all`.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
KORZEN = TU / "work"
GRA = TU.parent.parent / "game" / "assets" / "backgrounds"


def _horyzont(plyta: np.ndarray) -> int:
    """First row from the top where green takes over. Everything above it
    drifts, everything below it sways - so a bird needs no special case."""
    r, g, b = plyta[:, :, 0], plyta[:, :, 1], plyta[:, :, 2]
    zielen = ((g > r) & (g > b)).mean(axis=1)
    kandydaci = np.where(zielen > 0.5)[0]
    return int(kandydaci[0]) if len(kandydaci) else plyta.shape[0] // 3


def _skladowe(m: np.ndarray, min_pikseli: int):
    """Connected runs of True, biggest first."""
    from scipy import ndimage

    etykiety, ile = ndimage.label(m, structure=np.ones((3, 3), dtype=int))
    out = []
    for i in range(1, ile + 1):
        ys, xs = np.where(etykiety == i)
        if len(ys) >= min_pikseli:
            out.append((ys, xs))
    out.sort(key=lambda g: -len(g[0]))
    return out

STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading
with a fine paper-grain texture, warm friendly colours, thin soft outlines.
NOT flat vector, NOT 3D render."""

SCENY = {
    "sad": {
        "plyta": f"""A background illustration for a children's game: a sunny meadow at the
edge of an orchard. On the left one big round apple tree with a thick trunk and
a dense green crown WITHOUT apples. Gentle green hills along the horizon, a
small round pond on the far right, two bushes. The lower middle is EMPTY grass
where characters will stand, with a checked picnic blanket lying flat on the
grass slightly left of centre.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO stones.
NO fruit anywhere. NO characters, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - SIX or SEVEN soft white cartoon clouds spread across the whole sky, big
    and small, none touching each other;
  - MANY tufts of taller grass standing up from the ground - at least fifteen,
    scattered over the foreground and the middle ground, left, centre and
    right, each tuft separate from the others.
Same colours, same horizon, same tree, same pond, same blanket, same texture -
only the clouds and the tufts are new. Do NOT move or redraw anything that was
already there. Do NOT add fruit, animals, birds or anything else.""",
    },
    "dom": {
        "plyta": f"""A background illustration for a children's game: the inside of a cosy,
bright kitchen and dining room seen straight on. A big wooden table in the
lower middle with its top COMPLETELY EMPTY, floor space in front of it where
characters will stand. On the back wall: one large window with plain sky, a
shelf with a few jars, a wall clock, pale patterned wallpaper. A fridge on one
side, a cupboard on the other. Warm wooden floor.
{STYL}
Wide landscape composition.
NO plants. NO curtains. NO steam. NO people, NO animals, NO food, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - a leafy green houseplant in a pot standing on the floor next to the window;
  - a few small soft clouds visible through the window, in the sky part only.
Same colours, same furniture, same empty table, same texture - only the plant
and the clouds are new. Do NOT move or redraw anything that was already there.
Do NOT add anything else.""",
    },
    "laka": {
        "plyta": f"""A background illustration for a children's game: a sunny meadow on the
shore of a small calm lake. The lake takes the right third of the picture, with a
gentle sandy edge; low green hills and a line of trees on the far shore; one
leaning willow tree on the left. The lower middle is EMPTY flat grass where
characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO reeds, NO stones.
NO boats, NO characters, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - SIX or SEVEN soft white cartoon clouds spread across the whole sky, big
    and small, none touching each other;
  - MANY tufts of taller grass and a few clumps of reeds at the water's edge -
    at least fifteen tufts scattered over the foreground and the middle ground,
    each tuft separate from the others.
Same colours, same horizon, same lake, same willow, same texture - only the
clouds and the tufts are new. Do NOT move or redraw anything that was already
there. Do NOT add boats, animals, birds or anything else.""",
    },
    "pokoj": {
        "plyta": f"""A background illustration for a children's game: a bright, tidy
children's bedroom seen straight on. A low bed with a plain blanket on the left,
a wooden toy shelf on the right with a few closed boxes, one big window on the
back wall with plain sky, pale striped wallpaper, a round rug in the middle of a
warm wooden floor. The floor in the lower middle is EMPTY where characters will
stand.
{STYL}
Wide landscape composition.
NO toys lying around, NO plants, NO curtains, NO people, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - a paper mobile with three small stars hanging from the ceiling near the window;
  - a few small soft clouds visible through the window, in the sky part only.
Same colours, same furniture, same rug, same texture - only the mobile and the
clouds are new. Do NOT move or redraw anything that was already there.
Do NOT add anything else.""",
    },
    "plac_zabaw": {
        "plyta": f"""A background illustration for a children's game: a sunny small playground
in a park. On the left a wooden sandbox with a low red-and-yellow slide behind it,
on the right a simple swing frame with two empty swings, a few round trees along
the back, a low hedge. The lower middle is EMPTY flat grass where characters will
stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO toys, NO balls.
NO characters, NO animals, NO people, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - SIX or SEVEN soft white cartoon clouds spread across the whole sky, big
    and small, none touching each other;
  - MANY tufts of taller grass standing up from the ground - at least fifteen,
    scattered over the foreground and the middle ground, each tuft separate.
Same colours, same horizon, same sandbox, same swings, same texture - only the
clouds and the tufts are new. Do NOT move or redraw anything that was already
there. Do NOT add toys, animals, people or anything else.""",
    },
    "las": {
        "plyta": f"""A background illustration for a children's game: a sunny clearing in a
friendly deciduous forest. Tall tree trunks with green crowns on both sides and
along the back, soft light between them, a fallen log on the far left, a few
round bushes. The lower middle is EMPTY flat grass where characters will stand.
{STYL}
Wide landscape composition, horizon one third from the top.
The SKY between the crowns IS EMPTY - NO clouds, NO birds, NO sun rays.
The GRASS IS PLAIN - NO tufts, NO flowers, NO mushrooms, NO stones.
NO characters, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - a few small soft white clouds in the sky visible between the tree crowns,
    none touching each other;
  - MANY tufts of taller grass and a few small ferns standing up from the ground -
    at least fifteen, scattered over the foreground and the middle ground, each
    separate from the others.
Same colours, same trees, same log, same texture - only the clouds and the tufts
are new. Do NOT move or redraw anything that was already there. Do NOT add
animals, mushrooms or anything else.""",
    },
    "przedpokoj": {
        "plyta": f"""A background illustration for a children's game: a cosy home hallway
seen straight on. A low wooden shoe rack on the left with its shelves EMPTY, a
row of coat hooks on the back wall with nothing on them, a small round window
with plain sky, a door on the right, warm wooden floor with a small doormat. The
floor in the lower middle is EMPTY where characters will stand.
{STYL}
Wide landscape composition.
NO shoes, NO coats, NO plants, NO people, NO animals, NO text.""",
        "ruch": """Exactly the same illustration, unchanged in every way, except that two
things have been added, in the same style:
  - a leafy green houseplant in a pot standing on the floor next to the door;
  - a few small soft clouds visible through the round window, in the sky part only.
Same colours, same furniture, same floor, same texture - only the plant and the
clouds are new. Do NOT move or redraw anything that was already there.
Do NOT add anything else.""",
    },
}


def gen(nazwa: str, jakosc: str = "high") -> None:
    kat = KORZEN / nazwa
    kat.mkdir(parents=True, exist_ok=True)
    plyta = kat / "plyta.png"
    if not plyta.exists():
        print("plyta...", flush=True)
        figgen.generate(SCENY[nazwa]["plyta"], plyta, size="1536x1024",
                        quality=jakosc, background="opaque")
    ruch = kat / "ruch.png"
    if not ruch.exists():
        print("ruch...", flush=True)
        figgen.generate(SCENY[nazwa]["ruch"], ruch, refs=[plyta], size="1536x1024",
                        quality=jakosc, background="opaque")


def split(nazwa: str, prog: int = 40, min_pikseli: int = 500) -> dict:
    kat = KORZEN / nazwa
    plyta_img = Image.open(kat / "plyta.png").convert("RGB")
    plyta = np.asarray(plyta_img)
    ruch_img = Image.open(kat / "ruch.png").convert("RGB").resize(plyta_img.size, Image.LANCZOS)
    ruch = np.asarray(ruch_img)

    # Ziarno papieru roznicuje sie wszedzie po trochu: prog wyzszy niz w
    # wersji wektorowej i otwarcie, zeby zostaly tylko obiekty.
    roznica = np.abs(ruch.astype(int) - plyta.astype(int)).max(axis=2)
    m = roznica > prog
    # hysteresis: a weak difference counts when it touches a strong one (a pot the colour of the floor)
    from scipy import ndimage
    m = (roznica > prog / 3) & ndimage.binary_dilation(m, iterations=14)
    maska = Image.fromarray((m * 255).astype(np.uint8))
    maska = maska.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(3))
    m = np.asarray(maska) > 127
    # a pot the colour of the floor leaves holes and notches in the difference: close and fill them
    from scipy import ndimage
    m = ndimage.binary_closing(m, structure=np.ones((9, 9)), iterations=2)
    m = ndimage.binary_fill_holes(m)

    hor = _horyzont(plyta)
    grupy = _skladowe(m, min_pikseli)
    print(f"roznica: {m.mean()*100:.1f}% kadru, {len(grupy)} elementow, horyzont y={hor}")
    for stary in kat.glob("rekwizyt_*.png"):
        stary.unlink()

    rekwizyty = []
    for ys, xs in grupy:
        y0, y1 = int(ys.min()), int(ys.max()) + 1
        x0, x1 = int(xs.min()), int(xs.max()) + 1
        szer, wys = x1 - x0, y1 - y0
        wydluzenie = max(szer, wys) / max(min(szer, wys), 1)
        wypelnienie = len(ys) / max(szer * wys, 1)
        if wydluzenie > 6 or wypelnienie < 0.12:
            continue
        # a huge component is the model redrawing part of the plate (a whole tree), not a mover
        if wys > 0.45 * plyta.shape[0] or len(ys) > 0.06 * plyta.shape[0] * plyta.shape[1]:
            print(f"  pominieto duza skladowa {szer}x{wys} ({len(ys)} px) - to przerysowane tlo, nie rekwizyt")
            continue
        i = len(rekwizyty)
        # alfa = maska rozmyta o niecaly piksel, zeby brzeg nie byl zabkowany
        pole = np.zeros((wys, szer), dtype=np.uint8)
        pole[ys - y0, xs - x0] = 255
        alfa = Image.fromarray(pole).filter(ImageFilter.GaussianBlur(0.8))
        rgba = np.dstack([ruch[y0:y1, x0:x1], np.asarray(alfa)])
        plik = f"rekwizyt_{i:02d}.png"
        Image.fromarray(rgba, "RGBA").save(kat / plik)
        srodek_y = (y0 + y1) / 2
        # nad horyzontem dryfuja tylko male rzeczy (chmury); roslina w oknie
        # kuchni ma srodek nad horyzontem, a ma sie kolysac, nie plywac
        klasa = "drift" if (srodek_y < hor and wys < 100) else "sway"
        rekwizyty.append({"plik": plik, "klasa": klasa, "x": x0, "y": y0, "w": szer, "h": wys,
                          "faza": round((i * 0.6180339887) % 1.0, 4)})
    opis = {"plyta": "plyta.png", "szerokosc": int(plyta.shape[1]), "wysokosc": int(plyta.shape[0]),
            "horyzont": hor, "rekwizyty": rekwizyty}
    (kat / "rekwizyty.json").write_text(json.dumps(opis, indent=1), encoding="utf-8")
    print(f"rekwizytow: {len(rekwizyty)} "
          f"(sway {sum(r['klasa']=='sway' for r in rekwizyty)}, drift {sum(r['klasa']=='drift' for r in rekwizyty)})")
    return opis


def install(nazwa: str) -> None:
    import shutil
    src, dst = KORZEN / nazwa, GRA / nazwa
    dst.mkdir(parents=True, exist_ok=True)
    for stary in dst.glob("*"):
        stary.unlink()
    # WebP for the game: the plate opaque q80, props with exact alpha
    opis = json.loads((src / "rekwizyty.json").read_text(encoding="utf-8"))
    Image.open(src / opis["plyta"]).convert("RGB").save(dst / "plyta.webp", "WEBP", quality=80, method=6)
    opis["plyta"] = "plyta.webp"
    for r in opis["rekwizyty"]:
        Image.open(src / r["plik"]).convert("RGBA").save(dst / (r["plik"].rsplit(".", 1)[0] + ".webp"), "WEBP", quality=80, method=6, exact=True)
        r["plik"] = r["plik"].rsplit(".", 1)[0] + ".webp"
    (dst / "rekwizyty.json").write_text(json.dumps(opis, indent=1), encoding="utf-8")
    print(f"zainstalowano tlo {nazwa}: {len(list(dst.glob('*.webp')))} plikow")


if __name__ == "__main__":
    cmd, nazwa = sys.argv[1], sys.argv[2]
    if cmd in ("gen", "all"):
        gen(nazwa)
    if cmd in ("split", "all"):
        split(nazwa)
    if cmd in ("install", "all"):
        install(nazwa)
