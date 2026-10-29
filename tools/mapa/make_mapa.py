"""The world maps (the menu's map button): every world's land painted as a picture-book map with a winding dotted
path past six empty clearings - one per stage. The clearings' places are read by eye from a grid print and kept in
STOPY (fractions of the picture); the game puts the stage signs and Fox on them.

  python tools/mapa/make_mapa.py          # work/*.png -> game/assets/mapa/*.webp + mapa.json
  python tools/mapa/make_mapa.py siatka   # work/<map>_siatka.png: the map with a 10% grid, to read the stops

Delete a work file to redo it.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "mapa"

STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading with a fine paper-grain
texture, warm friendly colours, thin soft dark-brown outlines. NOT flat vector, NOT 3D render."""

KRAINY = {
    "swiat1": "a FOREST LAND: green woods of round oaks and pines, a little stream with a wooden footbridge, a meadow "
              "with flowers, a big old hollow oak, mushrooms, a pond",
    "swiat2": "a LAKESIDE VILLAGE: a blue lake with a wooden jetty and a rowing boat, small cosy cottages with red roofs, "
              "reeds and water lilies, a windmill, green hills",
    "swiat3": "SNOWY MOUNTAINS in winter: white snowy hills and peaks, snowy pine trees, a frozen pond, a wooden hut with "
              "smoke from the chimney, a little sledge slope",
    "swiat4": "a CASTLE LAND: a friendly fairy-tale castle with round towers and coloured flags on a hill in the top "
              "right, a little town of colourful houses, an orchard, a stone bridge over a river",
}
OBRAZY = {f"mapa_{s}": ("1536x1024", "opaque", f"""A children's picture-book MAP of {opis}, seen from above at a gentle
angle, filling the whole picture edge to edge like an illustrated board-game map. Across it winds ONE clear path
drawn as a line of small round light stepping stones, starting at the BOTTOM LEFT corner and ending at the RIGHT
edge. Along the path, evenly spread, lie exactly SIX round EMPTY flat clearings of pale sand, all the same size (each
about one tenth of the picture's height), clearly separated, with NOTHING on them - places where markers will be put.
The landmarks stand BETWEEN the clearings, never on them.
{STYL}
NO characters, NO animals, NO text, NO letters, NO numbers.""") for s, opis in KRAINY.items()}
OBRAZY["ikona"] = ("1024x1024", "transparent", f"""ONE old paper treasure map, half unrolled, seen from the front,
slightly tilted, on a fully TRANSPARENT background, filling most of the picture: warm cream parchment with soft
edges, a dotted red path winding over little green hills and a tiny tree, a small red X at its end, the rolled ends
tied with a little red string.
{STYL}
NO text, NO letters.""")

# the scroll's roller (both sides; the right one mirrored): the paper rolled round a wooden rod with knobs
OBRAZY["walek"] = ("1024x1536", "transparent", f"""ONE vertical rolled-up edge of an old paper scroll, standing upright
and filling the whole HEIGHT of the picture, on a fully TRANSPARENT background: a tall thin cylinder of warm cream
parchment rolled tightly around a wooden rod, the paper's rolled edge spiralling on top, and a round polished wooden
knob in warm brown with a small red ring sticking out at the very top and the very bottom. Seen straight from the
front, perfectly vertical, about 12 times taller than wide, soft shading so it looks round.
{STYL}
NO text, NO shadow on the ground.""")

# the six clearings of every map, in the order of the path (fractions of the picture: x from the left, y from the top)
STOPY: dict[str, list[list[float]]] = {"swiat1": [[0.094, 0.846], [0.276, 0.575], [0.436, 0.428], [0.581, 0.311], [0.788, 0.382], [0.929, 0.268]], "swiat2": [[0.079, 0.866], [0.222, 0.683], [0.449, 0.602], [0.761, 0.468], [0.784, 0.266], [0.929, 0.249]], "swiat3": [[0.071, 0.886], [0.261, 0.597], [0.452, 0.467], [0.593, 0.374], [0.762, 0.299], [0.934, 0.322]], "swiat4": [[0.068, 0.919], [0.234, 0.695], [0.38, 0.554], [0.627, 0.522], [0.794, 0.409], [0.92, 0.313]]}


def gen() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    for n, (size, tlo, prompt) in OBRAZY.items():
        dst = WORK / f"{n}.png"
        if dst.exists():
            print(f"{dst} exists, skipping"); continue
        figgen.generate(prompt, dst, size=size, quality="high", background=tlo)


def siatka() -> None:
    for s in KRAINY:
        im = Image.open(WORK / f"mapa_{s}.png").convert("RGB"); d = ImageDraw.Draw(im); W, H = im.size
        for i in range(1, 20):
            c = (255, 0, 0) if i % 2 == 0 else (255, 160, 160)
            d.line([(W * i / 20, 0), (W * i / 20, H)], fill=c, width=2 if i % 2 == 0 else 1)
            d.line([(0, H * i / 20), (W, H * i / 20)], fill=c, width=2 if i % 2 == 0 else 1)
            if i % 2 == 0:
                d.text((W * i / 20 + 3, 3), f"{i * 5}", fill=(255, 0, 0)); d.text((3, H * i / 20 + 3), f"{i * 5}", fill=(255, 0, 0))
        for k, (x, y) in enumerate(STOPY.get(s, [])):
            d.ellipse([x * W - 30, y * H - 30, x * W + 30, y * H + 30], outline=(0, 0, 255), width=5); d.text((x * W - 4, y * H - 6), str(k + 1), fill=(0, 0, 255))
        im.save(WORK / f"mapa_{s}_siatka.png")


def install() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for s in KRAINY:
        if (WORK / f"mapa_{s}.png").exists():
            Image.open(WORK / f"mapa_{s}.png").convert("RGB").save(OUT / f"mapa_{s}.webp", "WEBP", quality=86, method=6)
    if (WORK / "walek.png").exists():
        im = Image.open(WORK / "walek.png").convert("RGBA")
        im.putalpha(im.getchannel("A").point(lambda v: 0 if v < 90 else min(255, (v - 90) * 255 // 120)))   # no glow around it
        im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()); im.thumbnail((400, 1400), Image.LANCZOS)
        im.save(OUT / "walek.webp", "WEBP", quality=90, method=6); print("walek", im.size)
    if (WORK / "ikona.png").exists():
        im = Image.open(WORK / "ikona.png").convert("RGBA")
        im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()); im.thumbnail((400, 400), Image.LANCZOS)
        im.save(OUT / "ikona.webp", "WEBP", quality=88, method=6)
    (OUT / "mapa.json").write_text(json.dumps({"stopy": STOPY}, indent=1), encoding="utf-8")


if __name__ == "__main__":
    if sys.argv[1:] == ["siatka"]:
        siatka()
    else:
        gen()
        install()
