"""More mouths for the lip-sync: six speech shapes per view added to an installed character, nothing else touched.

  python tools/characters/make_usta.py gen lisek     # three sheets (front, 3/4, profile) - gpt-image
  python tools/characters/make_usta.py cut lisek     # cut, scale, install into postac.json (game + work)
  python tools/characters/make_usta.py all all       # every character

Each sheet (2 rows x 4) also draws two mouths the character already has - closed and the round O - from the existing
face sheet as reference: the whole sheet is scaled so those two match the installed pieces, so the new ones come out at
the same size and proportions and their placement copies the existing mouths' (the engine fits every usta_* variant
of a view to the same mouth target, scaled by the smile's core). The core (`rdzen`, what is unlike the fur) is measured
like the face sheets' cores. After a full rebuild of a character run `cut` again.
Shapes (lalka.js WIZEMY): scisniete (m b p), szeroko (a), zeby (s z c t d n), fw (f w), l (l), dziobek (u o-glide).
"""
from __future__ import annotations

import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

TU = Path(__file__).resolve().parent
sys.path.insert(0, str(TU))
import make_character as mc  # noqa: E402

KSZTALTY = [  # (name, mouth, beak)
    ("scisniete", "lips pressed firmly together, a little drawn in (saying M or B)", "beak pressed tightly shut, a little pinched (saying M)"),
    ("szeroko", "mouth open WIDE, the tongue visible inside, jaw dropped (saying a long A)", "beak open WIDE, a small tongue visible inside (saying A)"),
    ("zeby", "lips slightly parted in a flat line with only a THIN sliver of teeth just visible in the gap, no grin (saying S or T)", "beak barely open, a thin straight gap between upper and lower beak (saying S)"),
    ("fw", "mouth almost closed, the lower lip tucked in a little under the upper one, at most a tiny hint of the upper teeth (saying F or V)", "upper beak resting on the lower beak, the lower beak drawn back a little (saying F)"),
    ("l", "mouth half open with the tip of the tongue raised behind the upper teeth (saying L)", "beak half open with the small tongue raised inside (saying L)"),
    ("dziobek", "the mouth drawn as a SMALL round opening, smaller and narrower than the round O piece, drawn with the same "
                "line as the other mouths - NO separate pink lips, nothing added to the muzzle (saying U or OO)",
     "beak opened in a small round hole, smaller than the round O piece (saying U)"),
]
WIDOKI = {"": ("postac", "twarz", "straight from the front"),
          "_bok": ("bok", "twarz_bok", "turned three-quarters to the viewer's right"),
          "_profil": ("profil", "twarz_profil", "in full side view, facing the viewer's right")}

ARKUSZ = """A sprite sheet of EIGHT separate {usta} pieces of the SAME cartoon character as in the references, every piece
drawn at the SAME VIEWING ANGLE as the character's head ({kat}), exactly as the {usta} pieces on the reference face sheet
are drawn: the same size, the same patch of fur or skin around them, the same colours, line and style. {styl}
Arrange the eight pieces in a neat grid of 2 rows and 4 columns on a fully TRANSPARENT background, generous empty space
between pieces, nothing touching, NO labels, NO text, NO frames, no head around them.
Row 1:
  1. {usta} closed, gently smiling - EXACTLY the closed {usta} piece of the reference face sheet;
  2. {k0};
  3. {k1};
  4. {k2}.
Row 2:
  5. {usta} open in a round O - EXACTLY the round O piece of the reference face sheet;
  6. {k3};
  7. {k4};
  8. {k5}.
All eight pieces the SAME SIZE as each other and as the {usta} pieces on the reference face sheet.
Every piece ends EXACTLY where the reference's mouth pieces end: only the light muzzle patch around the mouth, with
NO band or fringe of the darker fur above or beside it - the same outline as the reference's closed mouth piece.
SUBTLE, natural speech positions of a calm character talking, as in a gentle picture-book animation - NOT exaggerated:
no piece opens wider than the reference's round O or its slightly open piece, the jaw drops only a little, teeth and
tongue only just show; the shapes differ from each other by small, clear changes of the lips."""


def gen(kto: str) -> None:
    p = mc.POSTACIE[kto]; kat = mc.KORZEN / kto
    beak = p["usta"] == "beak"
    def jeden(suf):
        ref, arkusz, kat_w = WIDOKI[suf]
        dst = kat / f"usta_mowa{suf}.png"
        if dst.exists():
            return
        opisy = {f"k{i}": (k[2] if beak else k[1]) for i, k in enumerate(KSZTALTY)}
        prompt = ARKUSZ.format(usta=p["usta"], kat=kat_w, styl=mc.STYL, **opisy)
        for proba in range(5):
            try:
                mc.figgen.generate(prompt, dst, refs=[kat / f"{ref}.png", kat / f"{arkusz}.png"], size="1536x1024", quality="high", background="transparent")
                print(f"  {kto} {dst.name}", flush=True); return
            except mc.figgen.GenError as e:
                if "moderation_blocked" not in str(e) or proba == 4:
                    raise
    with ThreadPoolExecutor(3) as ex:
        for f in [ex.submit(jeden, s) for s in WIDOKI]:
            f.result()


def rdzen(piece: np.ndarray) -> dict:
    """What is unlike the fur around it: the ring along the piece's edge gives the fur's colour."""
    a = piece[:, :, 3] > 60
    wn = ndimage.binary_erosion(a, iterations=6)
    pierscien = a & ~ndimage.binary_erosion(a, iterations=14)
    futro = np.median(piece[pierscien][:, :3].astype(int), axis=0) if pierscien.any() else np.array([200, 160, 120])
    inne = wn & (np.abs(piece[:, :, :3].astype(int) - futro).max(axis=2) > 70)
    inne = ndimage.binary_opening(inne, iterations=2)
    if inne.sum() < 50:
        inne = a
    ys, xs = np.where(inne)
    return {"x": int(xs.min()), "y": int(ys.min()), "w": int(xs.max() - xs.min() + 1), "h": int(ys.max() - ys.min() + 1)}


def nos(zrodlo) -> tuple[float, float] | None:
    """The nose in a mouth piece: the largest very dark blob in its upper half (a beak has none: None)."""
    arr = zrodlo if isinstance(zrodlo, np.ndarray) else (np.asarray(Image.open(zrodlo).convert("RGBA")) if Path(zrodlo).exists() else None)
    if arr is None:
        return None
    jas = arr[:, :, :3].astype(int).mean(axis=2)
    ciemne = (arr[:, :, 3] > 150) & (jas < 75)
    ciemne[arr.shape[0] // 2:] = False
    lab, n = ndimage.label(ndimage.binary_opening(ciemne, iterations=2))
    if not n:
        return None
    rozm = ndimage.sum(ciemne, lab, range(1, n + 1)); k = int(np.argmax(rozm)) + 1
    if rozm[k - 1] < 0.004 * arr.shape[0] * arr.shape[1]:
        return None
    y, x = ndimage.center_of_mass(lab == k)
    return float(x), float(y)


def cut(kto: str) -> None:
    kat = mc.KORZEN / kto; gra = mc.GRA / kto
    postac_g = json.loads((gra / "postac.json").read_text(encoding="utf-8"))
    nowe = {}
    for suf in WIDOKI:
        plik = kat / f"usta_mowa{suf}.png"
        if not plik.exists():
            print(f"  {kto}: no {plik.name}"); continue
        T = mc._rgba(plik)
        maska = ndimage.binary_closing(T[:, :, 3] > 40, iterations=3)
        plamy, etyk = mc._plamy(maska, 400)
        komorki = {}
        for b in plamy:
            k = (min(1, int((b["y0"] + b["y1"]) / 2 / T.shape[0] * 2)), min(3, int((b["x0"] + b["x1"]) / 2 / T.shape[1] * 4)))
            komorki.setdefault(k, []).append(b)
        def wytnij(k):
            if k not in komorki:
                return None
            mk = np.zeros(etyk.shape, dtype=bool)
            for b in komorki[k]:
                mk |= etyk == b["etyk"]
            ys, xs = np.where(mk)
            out = T[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy()
            out[~mk[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 3] = 0
            return out
        # the scale: the two mouths the character has, drawn again here, to the installed pieces' size
        skale = []
        for k, stary in (((0, 0), f"usta_zamkniete{suf}"), ((1, 0), f"usta_o{suf}")):
            w = wytnij(k); s = postac_g["czesci"].get(stary)
            if w is not None and s:
                skale.append(s["w"] / w.shape[1])
        if not skale:
            print(f"  {kto}{suf}: no anchors found - skipped"); continue
        sk = float(np.mean(skale))
        if len(skale) == 2 and abs(skale[0] - skale[1]) / sk > 0.25:
            print(f"  {kto}{suf}: anchors disagree ({skale[0]:.2f} vs {skale[1]:.2f}) - look at {plik.name}")
        for i, (n, _, _) in enumerate(KSZTALTY):
            k = (0, 1 + i) if i < 3 else (1, i - 2)
            w = wytnij(k)
            if w is None:
                print(f"  {kto}{suf}: piece {n} missing"); continue
            im = Image.fromarray(w).resize((max(1, round(w.shape[1] * sk)), max(1, round(w.shape[0] * sk))), Image.LANCZOS)
            nazwa = f"usta_{n}{suf}"
            arr = np.asarray(im).copy()
            nieprz = arr[:, :, 3] > 0                               # RGB bled under transparency, as the pipeline does
            if nieprz.any() and not nieprz.all():
                _, idx = ndimage.distance_transform_edt(~nieprz, return_indices=True)
                arr[~nieprz, :3] = arr[idx[0][~nieprz], idx[1][~nieprz], :3]
            Image.fromarray(arr).save(kat / "czesci" / f"{nazwa}.png")
            Image.fromarray(arr).save(gra / "czesci" / f"{nazwa}.webp", "WEBP", quality=75, method=6, exact=True)
            # its placement copies the closed mouth's, pinned at the NOSE (every mouth piece carries it): the closed one's
            # core, shifted by how far this piece's nose lies from the closed piece's - the nose never moves, the mouth
            # opens below it (centring the pieces put a hedgehog's nose under its eye). No nose found: centred.
            wz = postac_g["czesci"].get(f"usta_zamkniete{suf}", {}); rz = wz.get("rdzen") or rdzen(arr)
            dziob = mc.POSTACIE[kto]["usta"] == "beak"                      # a beak is the whole mouth: no nose to pin
            n0, n1 = (None, None) if dziob else (nos(gra / "czesci" / wz.get("plik", "-")), nos(arr))
            if n0 and n1:
                r = dict(rz, x=int(round(rz["x"] + n1[0] - n0[0])), y=int(round(rz["y"] + n1[1] - n0[1])))
            else:
                r = dict(rz, x=int(round(rz["x"] + (im.width - wz.get("w", im.width)) / 2)))
            nowe[nazwa] = {"plik": f"{nazwa}.webp", "x": wz.get("x", 0), "y": wz.get("y", 0), "w": im.width, "h": im.height, "rdzen": r}
        print(f"  {kto}{suf}: scale {sk:.2f}, {sum(1 for n in nowe if n.endswith(suf) or not suf)} pieces")
    if not nowe:
        return
    for plik, png in ((gra / "postac.json", False), (gra / "postac.build.json", False), (kat / "postac.json", True)):
        if not plik.exists():
            continue
        d = json.loads(plik.read_text(encoding="utf-8"))
        for n, cz in nowe.items():
            d["czesci"][n] = dict(cz, plik=cz["plik"].replace(".webp", ".png")) if png else dict(cz)
        plik.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    print(f"{kto}: {len(nowe)} mouths installed")


if __name__ == "__main__":
    cmd, kto = sys.argv[1], sys.argv[2]
    kto_lista = list(mc.POSTACIE) if kto == "all" else [kto]
    if cmd in ("gen", "all"):
        with ThreadPoolExecutor(3) as ex:
            for f in [ex.submit(gen, k) for k in kto_lista]:
                f.result()
    if cmd in ("cut", "all"):
        for k in kto_lista:
            cut(k)
