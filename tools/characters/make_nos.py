"""The nose over the eyes: every mouth piece carries the nose, and turned 3/4 or in profile the nose sticks out in front
of the near eye - but the eyes are drawn over the mouth (its light muzzle patch must never cover them). So the nose
alone is cut from each 3/4 and profile mouth piece into `nos_<piece>` (the same frame); lalka.js hangs it on its mouth
and draws it over the eyes.

  python tools/characters/make_nos.py all      # or one character
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

TU = Path(__file__).resolve().parent
sys.path.insert(0, str(TU))
import make_character as mc  # noqa: E402
from make_usta import nos as nos_srodek  # noqa: E402


def maska_nosa(arr: np.ndarray) -> np.ndarray | None:
    """The nose blob in the upper part, grown a little to take its outline, edges softened: a very dark one, or (a pink
    nose: Bunny, Mole) the biggest blob there clearly unlike the fur around the piece."""
    a = arr[:, :, 3] > 150
    jas = arr[:, :, :3].astype(int).mean(axis=2)
    if nos_srodek(arr) is not None:
        kand = a & (jas < 75)
    else:
        pierscien = a & ~ndimage.binary_erosion(a, iterations=14)
        futro = np.median(arr[pierscien][:, :3].astype(int), axis=0) if pierscien.any() else np.array([200, 180, 160])
        kand = ndimage.binary_erosion(a, iterations=6) & (np.abs(arr[:, :, :3].astype(int) - futro).max(axis=2) > 80)
    kand[int(arr.shape[0] * 0.5):] = False
    lab, n = ndimage.label(ndimage.binary_opening(kand, iterations=2))
    if not n:
        return None
    rozm = ndimage.sum(kand, lab, range(1, n + 1)); k = int(np.argmax(rozm)) + 1
    if rozm[k - 1] < 0.004 * arr.shape[0] * arr.shape[1]:
        return None
    m = ndimage.binary_dilation(lab == k, iterations=5)
    return np.clip(ndimage.gaussian_filter(m.astype(float), 1.5) * 1.6, 0, 1)


def jeden(kto: str) -> None:
    if mc.POSTACIE[kto]["usta"] == "beak" or kto in ("zajac", "kret"):   # a beak is on top anyway; pale pink noses: no
        return
    kat, gra = mc.KORZEN / kto, mc.GRA / kto
    d = json.loads((gra / "postac.json").read_text(encoding="utf-8"))
    nowe = {}
    for n, cz in d["czesci"].items():
        if not n.startswith("usta_") or not n.endswith(("_bok", "_profil")):
            continue
        arr = np.asarray(Image.open(gra / "czesci" / cz["plik"]).convert("RGBA")).copy()
        m = maska_nosa(arr)
        if m is None:
            continue
        arr[:, :, 3] = (arr[:, :, 3] * m).astype(np.uint8)
        nazwa = f"nos_{n}"
        Image.fromarray(arr).save(gra / "czesci" / f"{nazwa}.webp", "WEBP", quality=80, method=6, exact=True)
        if (kat / "czesci").exists():
            Image.fromarray(arr).save(kat / "czesci" / f"{nazwa}.png")
        nowe[nazwa] = {"plik": f"{nazwa}.webp", "x": cz["x"], "y": cz["y"], "w": cz["w"], "h": cz["h"]}
    for plik, png in ((gra / "postac.json", False), (gra / "postac.build.json", False), (kat / "postac.json", True)):
        if plik.exists():
            dd = json.loads(plik.read_text(encoding="utf-8"))
            for n, cz in nowe.items():
                dd["czesci"][n] = dict(cz, plik=cz["plik"].replace(".webp", ".png")) if png else dict(cz)
            plik.write_text(json.dumps(dd, ensure_ascii=False), encoding="utf-8")
    print(kto, len(nowe), "noses")


if __name__ == "__main__":
    for k in (list(mc.POSTACIE) if sys.argv[1] == "all" else sys.argv[1:]):
        jeden(k)
