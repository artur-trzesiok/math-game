"""Wide backgrounds (panoramas) for pans between areas of one place (game/engine/efekty.js `pan`).

A panorama is made of TILES that join: tile 0 is painted from its prompt; every next tile is an edit of a
canvas whose left third is the right third of the previous tile (the rest transparent) - "keep the left third,
continue to the right". The tiles are stitched with a soft cross-fade inside the overlap, so a model that
redrew the kept part a little leaves no seam. Then the movers pass (clouds, tufts) runs on screen-wide windows
of the stitched plate, and the usual difference split cuts the props.

  python tools/backgrounds/make_panorama.py gen droga_do_debu      # work/<name>/kafel_N.png, plyta.png, ruch.png
  python tools/backgrounds/make_panorama.py split droga_do_debu    # props + rekwizyty.json (with "obszary")
  python tools/backgrounds/make_panorama.py install droga_do_debu
  python tools/backgrounds/make_panorama.py all droga_do_debu

A panorama = an entry in PANORAMY: one prompt per tile (what that stretch shows), the shared rules, the movers.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import figgen  # noqa: E402
import make_background as MB  # noqa: E402

W, H = 1536, 1024
ZAKLADKA = 512              # px of the previous tile the next one starts from
NOWE = W - ZAKLADKA         # px each tile adds

ZASADY = f"""{MB.STYL}
Wide landscape composition, the horizon one third from the top, the ground level the same across the
whole picture. The lower middle is EMPTY flat ground where characters will stand.
The SKY IS EMPTY - just sky, NO clouds, NO birds, NO sun.
The GRASS IS PLAIN - NO tufts, NO flowers, NO reeds.
NO characters, NO animals, NO text."""

PANORAMY = {
    "polana_wieczorem": {
        "kafle": [
            """A garden at sunset: on the left a big old friendly tree with a round little door and a round window
high up in its trunk - an owl's home - and a small wooden shed with an open door beside it; a narrow earth path
starts there and runs to the right across short grass. The SKY is a warm sunset: orange and pink near the
horizon, soft violet above, no sun visible, no clouds.""",
            """The path climbs onto a wide open glade on a gentle round hilltop: short soft grass, a few low bushes
far away at the edges, a big open sunset sky over it (orange and pink at the horizon, violet above). The middle
of the glade is open and empty.""",
        ],
        "ruch": """Exactly the same illustration, unchanged in every way, except that two things have been added, in
the same style:
  - THREE or FOUR thin soft pink-and-orange sunset clouds in the sky, none touching each other and none touching
    the left or the right edge of the picture;
  - MANY tufts of taller grass, at least twelve, scattered over the foreground and the middle ground, each tuft
    separate from the others, none on the path, none touching the left or right edge.
Same colours, same horizon, same path, same everything - only the clouds and the tufts are new. Do NOT move or
redraw anything that was already there.""",
    },
    "jesienny_sad": {
        "kafle": [
            """An autumn orchard on a sunny afternoon: on the far left a low wooden fence; three apple trees with red
apples and one pear tree with yellow-green pears, their leaves turning yellow and orange; a narrow earth path
starts at the fence and runs to the right across the grass.""",
            """The path leaves the orchard and crosses an open autumn meadow: golden-green grass, a few small
orange and yellow bushes far away, gentle hills with autumn trees on the horizon; the middle of the picture is
open and empty.""",
            """The path reaches the edge of an autumn forest: tall trees with orange, red and yellow crowns. In the
MIDDLE of this new part, not near its right edge, stands the biggest tree; at its foot, between its roots, a
mossy mound with a round bright RED wooden door and a little window - a tiny cosy home, clearly visible, about as
tall as a child; a heap of fallen leaves beside it.""",
        ],
        "ruch": """Exactly the same illustration, unchanged in every way, except that two things have been added, in
the same style:
  - FOUR or FIVE soft white cartoon clouds in the sky, big and small, none touching each other and none
    touching the left or the right edge of the picture;
  - MANY tufts of taller autumn grass, at least twelve, scattered over the foreground and the middle ground, each
    tuft separate from the others, none on the path, none touching the left or right edge.
Same colours, same horizon, same path, same everything - only the clouds and the tufts are new. Do NOT move or
redraw anything that was already there.""",
    },
    "droga_do_debu": {
        "kafle": [
            """A sunny meadow at the start of a walk: on the far left a small wooden garden gate and a low hedge;
a narrow sandy path starts there and runs to the right across the grass.""",
            """The path reaches a small shallow brook that crosses the picture from the top (far away, thin)
to the bottom (near, wider), with clear light-blue water and a sandy bank on both sides. There are NO stones
in the water.""",
            """Beyond the brook the path ends at one huge old oak tree with a thick trunk and a wide dense
crown, on gentle green ground; a low hill behind it.""",
        ],
        "ruch": """Exactly the same illustration, unchanged in every way, except that two things have been added, in
the same style:
  - FOUR or FIVE soft white cartoon clouds in the sky, big and small, none touching each other and none
    touching the left or the right edge of the picture;
  - MANY tufts of taller grass, at least twelve, scattered over the foreground and the middle ground, each
    tuft separate from the others, none on the path, none in the water, none touching the left or right edge.
Same colours, same horizon, same path, same everything - only the clouds and the tufts are new. Do NOT move or
redraw anything that was already there.""",
    },
}


for _n in PANORAMY:                       # the difference split reads its knobs from SCENY: panoramas are outdoors
    MB.SCENY.setdefault(_n, {"wnetrze": False})


def _dalej(segment: str) -> str:
    return f"""This picture is one piece of a WIDE PANORAMA that continues to the right. Its LEFT THIRD is already
painted: keep that left third EXACTLY as it is, and paint the empty right two thirds so the scene continues
seamlessly from it - the same horizon line at the same height, the same ground level, the same sky colour, the
same style, lighting, scale and paper texture, as if it had always been one picture.
In the new part: {segment}
{ZASADY}"""


def _laczenie(lewy: np.ndarray, prawy: np.ndarray) -> np.ndarray:
    """Weights for the overlap: the previous tile on the left, the new one on the right, a smooth ramp over the
    middle half of the overlap."""
    x = np.arange(ZAKLADKA, dtype=float)
    t = np.clip((x - ZAKLADKA * 0.25) / (ZAKLADKA * 0.5), 0, 1)
    t = t * t * (3 - 2 * t)
    return lewy * (1 - t)[None, :, None] + prawy * t[None, :, None]


def gen(nazwa: str, jakosc: str = "high") -> None:
    P = PANORAMY[nazwa]; kat = MB.KORZEN / nazwa; kat.mkdir(parents=True, exist_ok=True)
    kafle = []
    for i, seg in enumerate(P["kafle"]):
        dst = kat / f"kafel_{i}.png"
        if not dst.exists():
            print(f"kafel {i}...", flush=True)
            if i == 0:
                figgen.generate(f"""A background illustration for a children's game, the LEFT end of a wide panorama:
{seg}
{ZASADY}""", dst, size=f"{W}x{H}", quality=jakosc, background="opaque")
            else:
                poprz = np.asarray(Image.open(kat / f"kafel_{i - 1}.png").convert("RGBA"))
                plotno = np.zeros((H, W, 4), dtype=np.uint8); plotno[:, :ZAKLADKA] = poprz[:, W - ZAKLADKA:]
                wejscie = kat / f"kafel_{i}_wejscie.png"; Image.fromarray(plotno).save(wejscie)
                figgen.generate(_dalej(seg), dst, refs=[wejscie], size=f"{W}x{H}", quality=jakosc, background="opaque")
        kafle.append(np.asarray(Image.open(dst).convert("RGB")).astype(float))
    # stitching
    szer = W + NOWE * (len(kafle) - 1)
    plyta = np.zeros((H, szer, 3)); plyta[:, :W] = kafle[0]
    for i, k in enumerate(kafle[1:], 1):
        x = NOWE * i
        plyta[:, x:x + ZAKLADKA] = _laczenie(plyta[:, x:x + ZAKLADKA], k[:, :ZAKLADKA])
        plyta[:, x + ZAKLADKA:x + W] = k[:, ZAKLADKA:]
    Image.fromarray(plyta.clip(0, 255).astype(np.uint8)).save(kat / "plyta.png")
    print(f"plyta {szer}x{H}")
    # the movers pass on screen-wide windows; each pixel of ruch comes from exactly one window (the first that
    # covers it), and is compared with the stitched plate, so window edges make no difference
    ruch = kat / "ruch.png"
    if not ruch.exists():
        okna = list(range(0, szer - W, W)) + [szer - W]
        wynik = np.asarray(Image.open(kat / "plyta.png").convert("RGB")).copy(); pokryte = 0
        for j, x in enumerate(okna):
            wyc = kat / f"okno_{j}.png"; Image.fromarray(wynik[:, x:x + W] if j == 0 else np.asarray(Image.open(kat / "plyta.png").convert("RGB"))[:, x:x + W]).save(wyc)
            dst = kat / f"ruch_{j}.png"
            if not dst.exists():
                print(f"ruch {j}...", flush=True)
                figgen.generate(P["ruch"], dst, refs=[wyc], size=f"{W}x{H}", quality=jakosc, background="opaque")
            r = np.asarray(Image.open(dst).convert("RGB"))
            od = max(pokryte, x)
            wynik[:, od:x + W] = r[:, od - x:]
            pokryte = x + W
        Image.fromarray(wynik).save(ruch)


def split(nazwa: str) -> None:
    opis = MB.split(nazwa)
    p = MB.KORZEN / nazwa / "rekwizyty.json"; o = json.loads(p.read_text(encoding="utf-8"))
    o["obszary"] = len(PANORAMY[nazwa]["kafle"]); p.write_text(json.dumps(o, indent=1), encoding="utf-8")
    return opis


if __name__ == "__main__":
    cmd, nazwa = sys.argv[1], sys.argv[2]
    if cmd in ("gen", "all"):
        gen(nazwa)
    if cmd in ("split", "all"):
        split(nazwa)
    if cmd in ("install", "all"):
        MB.install(nazwa)
