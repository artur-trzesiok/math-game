"""Draw the measured face blobs and targets of an installed character.

  python tools/characters/debug_face.py lisek przod|bok|profil  ->  work/_dbg_<kto>_<widok>.png
"""
import sys, json
from pathlib import Path
TU = Path(__file__).resolve().parent; R = TU.parent.parent
sys.path.insert(0, str(TU))
import numpy as np
from PIL import Image, ImageDraw
import make_character as postac3
kto, widok = sys.argv[1], sys.argv[2]
ref = {"przod": "postac", "bok": "bok", "profil": "profil"}[widok]
czesc = {"przod": "glowa", "bok": "glowa_bok", "profil": "p_glowa"}[widok]
d = json.load(open(R / "game" / "assets" / "characters" / kto / "postac.json", encoding="utf-8")); c = d["czesci"][czesc]
W = postac3._rgba(TU / "work" / kto / f"{ref}.png")
P = np.array(Image.open(R / "game" / "assets" / "characters" / kto / "czesci" / c["plik"]).convert("RGBA"))
G = np.zeros_like(W); G[c["y"]:c["y"] + P.shape[0], c["x"]:c["x"] + P.shape[1]] = P
maska = G[:, :, 3] > 60
tw = postac3._twarz(G, maska, None, "x_twarz", W)
roz = postac3.OSTATNIA_ROZNICA
print("twarz:", tw)
for b in (postac3.OSTATNIE_PLAMY or {}).get("plamy", []): print("  plama", {k: (round(v, 2) if isinstance(v, float) else v) for k, v in b.items() if k != "etyk"})
im = Image.fromarray(W).convert("RGB"); im.paste(Image.new("RGB", im.size, (138, 138, 138)), mask=Image.fromarray(((W[:, :, 3] <= 60) * 255).astype(np.uint8)))
ov = np.array(im); ov[roz] = (0, 255, 0)
im = Image.fromarray(ov); dr = ImageDraw.Draw(im)
for k, bb in (tw or {}).items():
    if bb: dr.rectangle((bb["x"], bb["y"], bb["x"] + bb["w"], bb["y"] + bb["h"]), outline=(0, 0, 255) if k == "oczy" else (255, 0, 0), width=4)
y0 = max(0, c["y"]); im.crop((0, y0, 1024, min(1536, y0 + c["h"] + 40))).save(R / "work" / f"_dbg_{kto}_{widok}.png")
