"""The ten frame (mechaniki3.js ramka) painted: a wooden tray with two rows of five square cups. Its layout is drawn
from the engine's own geometry and given to gpt-image as the first reference, so every cup lies where the code puts
a thing (the same trick as the comic layouts in tools/ilustracje).

  python tools/objects/make_ramka.py           # -> game/assets/objects/ramka_dziesiatkowa.webp
  python tools/objects/make_ramka.py siatka    # work/ramka_siatka.png: the painting with the cups' boxes drawn over

Delete work/ramka.png to redraw.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent
WORK = TU / "work"
OUT = TU.parent.parent / "game" / "assets" / "objects" / "ramka_dziesiatkowa.webp"

# the engine's geometry (mechaniki3.js ramka, krok 0.95): the frame W+0.22 x H+0.22, cups krok-0.12 on a krok grid
KROK = 0.95
W, H = KROK * 5 + 0.3, KROK * 2 + 0.3
WO, HO = W + 0.22, H + 0.22
PX = 1400 / WO                                   # pixels per unit on the 1536x1024 page
X0, Y0 = (1536 - WO * PX) / 2, (1024 - HO * PX) / 2


def kubki() -> list[tuple[float, float, float, float]]:
    """The ten cups' boxes in page pixels."""
    a = (KROK - 0.12) * PX / 2
    out = []
    for r in range(2):
        for k in range(5):
            cx, cy = 768 + (k - 2) * KROK * PX, 512 - (0.5 - r) * KROK * PX
            out.append((cx - a, cy - a, cx + a, cy + a))
    return out


def szablon() -> Path:
    im = Image.new("RGB", (1536, 1024), "white"); d = ImageDraw.Draw(im)
    d.rounded_rectangle([X0, Y0, X0 + WO * PX, Y0 + HO * PX], radius=28, fill=(150, 150, 150), outline=(0, 0, 0), width=4)
    for b in kubki():
        d.rounded_rectangle(b, radius=14, fill=(235, 235, 235), outline=(0, 0, 0), width=3)
    p = WORK / "ramka_szablon.png"; WORK.mkdir(parents=True, exist_ok=True); im.save(p)
    return p


PROMPT = """The FIRST reference picture is the exact LAYOUT: a tray with TEN square cups in TWO rows of FIVE. Paint it as ONE
object, keeping its outline, size and position and every cup's position and size EXACTLY as in the layout:
a children's wooden TEN FRAME tray seen straight from above - a sturdy frame of warm light natural wood with soft
rounded corners and a fine wood grain, and ten shallow square hollows carved into it, their insides a lighter, smooth
pale cream wood with a soft inner shadow on their upper edge so they read as hollows. The wooden bar between the two
rows of five is the same as the bars between the cups. All ten cups are EMPTY.
On a fully TRANSPARENT background: NO table, NO shadow under the tray, NO glow, nothing around it.
STYLE: modern children's picture-book illustration - soft painterly shading with a fine paper-grain texture, warm
colours, thin soft dark outlines. NOT flat vector, NOT 3D render. NO text, NO numbers, NO dots, NO objects."""


def gen() -> None:
    raw = WORK / "ramka.png"
    if not raw.exists():
        figgen.generate(PROMPT, raw, refs=[szablon()], size="1536x1024", quality="high", background="transparent")


def install() -> None:
    im = Image.open(WORK / "ramka.png").convert("RGBA")
    pad = 0.02 * PX                               # a hair of margin for the soft outline
    im = im.crop((round(X0 - pad), round(Y0 - pad), round(X0 + WO * PX + pad), round(Y0 + HO * PX + pad)))
    im.save(OUT, "WEBP", quality=88, method=6)
    print(OUT.name, im.size)


def siatka() -> None:
    im = Image.open(WORK / "ramka.png").convert("RGB"); d = ImageDraw.Draw(im)
    d.rectangle([X0, Y0, X0 + WO * PX, Y0 + HO * PX], outline=(255, 0, 0), width=3)
    for b in kubki():
        d.rectangle(b, outline=(0, 0, 255), width=3)
    im.save(WORK / "ramka_siatka.png")


if __name__ == "__main__":
    if sys.argv[1:] == ["siatka"]:
        siatka()
    else:
        gen(); install(); siatka()
