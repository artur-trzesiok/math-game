"""Cut-out puppet characters drawn whole by gpt-image. See ../CLAUDE.md.

  python postac3.py all lisek        # gen + build + install (retries rejected pieces)
  python postac3.py gen lisek        # only missing images
  python postac3.py build lisek      # keyed images -> work/postaci/lisek/czesci + postac.json
  python postac3.py install lisek    # -> postaci/lisek/

Nothing here cuts a character: every piece is a gpt-image result with the
magenta key turned into transparency. Code measures (bounding boxes, pivots,
face targets) and writes postac.json from the rig template.
"""

from __future__ import annotations

import json
import shutil
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

TU = Path(__file__).resolve().parent               # tools/characters
KORZEN = TU / "work"                               # generation inputs and build output per character
RIGI = TU / "rigs"
GRA = TU.parent.parent / "game" / "assets" / "characters"   # what the game loads
ROZMIAR = "1024x1536"

STYL = """STYLE: a modern children's picture-book illustration - soft painterly shading
with a fine paper-grain texture, warm friendly colours, a thin soft dark outline
around shapes, rosy cheeks, big expressive eyes with lashes. NOT 3D render,
NOT flat vector, NOT clip art."""

POSTACIE = {
    "lisek": {
        "rig": "humanoid", "wysokosc": 1.5,
        "opis": "a small, friendly orange fox cub with a white muzzle and belly, big pointed "
                "ears with dark tips, a bushy tail with a white tip, dark paws",
        "konczyny": "arms", "konczyna": "arm", "usta": "mouth", "ogon": True,
    },
    "wiewiorka": {
        "rig": "humanoid", "wysokosc": 1.4,
        "opis": "a small, friendly red squirrel with a cream belly, tufted ears, a huge "
                "fluffy curled tail, tiny dark paws",
        "konczyny": "arms", "konczyna": "arm", "usta": "mouth", "ogon": True,
    },
    "sowa": {
        "rig": "humanoid", "wysokosc": 1.4,
        "opis": "a round, friendly little brown owl with a cream heart-shaped face, big "
                "round eyes, short wings, small orange feet",
        "konczyny": "wings", "konczyna": "wing", "usta": "beak", "ogon": False,
    },
    "sarenka": {
        "rig": "czworonog", "wysokosc": 1.5,
        # "fawn" + "young" wpadlo w moderacje wyjscia; sam jelonek przechodzi
        "opis": "a cute, friendly cartoon roe deer with a light brown coat, big ears, a small black nose "
                "and a short fluffy tail",  # no spots/belly/fawn/doe: those get the side view moderation-blocked
        "konczyny": "front legs", "konczyna": "front leg", "usta": "mouth", "ogon": True,
    },
}

USTA_WARIANTY = {
    "mouth": ["mouth closed, gently smiling", "mouth open wide in a happy smile",
              "mouth slightly open (mid speech)", "mouth open in a round O (speaking)",
              "mouth closed with corners turned down, sad"],
    "beak": ["beak closed, gently smiling", "beak open wide in a happy smile",
             "beak slightly open (mid speech)", "beak open in a round O (speaking)",
             "beak closed with corners turned down, sad"],
}

# ----------------------------------------------------------------- prompts

POSTAC_H = """A single cartoon character on a fully TRANSPARENT background: {opis}.
Standing upright on two legs, seen straight from the front, happy open-mouth
smile, both {konczyny} held slightly away from the body so there is a clear gap
of transparent background between each one and the body, legs slightly apart.
{styl}
The whole body is visible from the top of the head to the feet, centred, large.
Nothing else in the picture: NO text, NO ground shadow, NO props."""

POSTAC_C = """A single cartoon character on a fully TRANSPARENT background: {opis}.
Standing on all four legs, seen straight from the FRONT (facing the viewer),
head up, happy open-mouth smile, the two front legs clearly apart with a gap of
transparent background between them, the hind legs visible behind.
{styl}
The whole body is visible from the top of the head to the hooves, centred, large.
Nothing else in the picture: NO text, NO ground shadow, NO props."""

EDYCJA = """Exactly the same character in exactly the same pose, the same position in the
frame, the same size, the same colours and the same style as the reference
image, with ONE change only: {zmiana}
Everything else stays identical. Fully TRANSPARENT background, NO text, NO shadow."""

WIDOKI = {
    "profil": {
        "humanoid": "the character is seen in FULL SIDE VIEW (profile), facing the viewer's "
                    "RIGHT, standing upright, {konczyny} hanging naturally at the side of the "
                    "body with a clear gap between the near {konczyna} and the body, the legs "
                    "slightly apart so both are visible, the tail (if any) behind.",
        "czworonog": "the character is seen in FULL SIDE VIEW (profile), facing the viewer's "
                     "RIGHT, standing on all four legs, all four legs visible and slightly "
                     "apart (the near legs in front of the far legs), the tail at the back.",
    },
    "bok": {
        "humanoid": "the character is turned three-quarters towards the viewer's RIGHT, "
                    "the face drawn correctly for that angle.",
        "czworonog": "the character's HEAD is turned three-quarters towards the viewer's "
                     "RIGHT, the face drawn correctly for that angle; the body stays as it was.",
    },
    "tyl": {
        "humanoid": "the character is seen from BEHIND - the back of the head and the back "
                    "of the body, no face visible; the feet are seen from behind as well: heels "
                    "and soles towards the viewer, the toes point AWAY from the viewer and are "
                    "hidden (no toes, claws or talons visible).",
        "czworonog": "the character is seen from BEHIND - the back of the head and ears, the "
                     "back and rump, the four legs from behind, the tail; no face visible; the "
                     "hooves are seen from behind, pointing away from the viewer.",
    },
}

KLUCZ = """Exactly the same picture as the reference image, the same size and the same
position in the frame, but showing ONLY {co} as {a_} separate paper cut-out puppet
piece{s_}, and the rest of the character as one flat solid magenta (#FF00FF)
silhouette lying BEHIND {obj}.
{Co} {zostaje} exactly where {it} {is}, drawn exactly as before{twarz}, COMPLETE and
WHOLE, as the topmost layer: any arm, leg, head, tail or other body part that was in
front of {co} in the reference is LEFT OUT entirely, and the part of {co} it was hiding
is painted in with {its_} own fur, colour and outline, so {it} {has} no notch, bite or
hole. No magenta is painted on top of {co} anywhere. {Co} {each_is} completed as a
puppet piece: {domkniecie} Draw the completion OVER the magenta silhouette, in the
piece's own colour and fur, ending in a smooth rounded shape. Transparent background
outside the character. NO text."""

STAW = ("extend {it} a little INTO the body, past the point where {subj} join{s} the body, "
        "by about a QUARTER of {its} own length, as a continuation of the same limb (same "
        "thickness, same fur) that ends in a smooth ROUNDED {staw} cap - like the "
        "shoulder end of a paper puppet's arm.")
SZYJA = ("extend it DOWNWARD with a short rounded neck stub in the head's own colour and "
         "fur, going into the magenta body, so the head can tilt without leaving a gap.")
TULOW = ("close it off: a smooth rounded top edge where the head was and a smooth rounded "
         "bottom edge where the legs were, so the body is one complete closed shape; do "
         "NOT make it wider or longer than it is in the reference.")
CIALO_C = ("close it off smoothly where the head, the legs and the tail were, so the body "
           "is one complete closed shape; do NOT make it wider or longer than in the reference.")
OGON = ("extend it a little INTO the body where it joins, by about a quarter of its "
        "length, ending in a smooth rounded root.")
BEZ_TWARZY = (" but with the eyes, the eyebrows, the nose and the {usta} REMOVED - a blank "
              "face area in the plain face colour and fur, no nose at all, cheeks stay")

# kazdy gotowiec: (obraz referencyjny, opis "co zostaje", liczba mnoga, domkniecie, bez twarzy)
def gotowce(p: dict) -> dict:
    h = p["rig"] == "humanoid"
    k, k1, u = p["konczyny"], p["konczyna"], p["usta"]
    staw = lambda s, mn: STAW.format(it="them" if mn else "it", subj="they" if mn else "it", s="" if mn else "s",
                                     its="their" if mn else "its", staw=s)
    g = {
        "k_glowa":       ("postac", "the HEAD", False, SZYJA, True),
        "k_glowa_bok":   ("bok", "the HEAD", False, SZYJA, True),
        "k_glowa_tyl":   ("tyl", "the HEAD", False, SZYJA, False),
        # "only": otherwise the model folds the shoulders/back feathers into the head and the body draws them again
        "k_p_glowa":     ("profil", "the HEAD only (the head down to the neck - not the shoulders, the back "
                          "or the chest)", False, SZYJA, True),
    }
    if h:
        g.update({
            "k_tulow":  ("postac", "the BODY (the torso between the neck and the hips, without the "
                         f"{k}, the legs and the head)", False, TULOW, False),
            "k_rece":   ("postac", f"BOTH {k}", True, staw("shoulder", True), False),
            "k_nogi":   ("postac", "BOTH legs with their feet", True, staw("hip", True), False),
            "k_p_cialo": ("profil", f"the BODY (the torso only, without the head, the {k}, the "
                          "legs and the tail)", False, TULOW, False),
            "k_p_reka": ("profil", f"the {k1} closer to the viewer (the one drawn in front)", False,
                         staw("shoulder", False), False),
            "k_p_noga_przod": ("profil", "the leg and foot CLOSER to the viewer (drawn in front, "
                               "fully visible)", False, staw("hip", False), False),
            "k_p_noga_tyl": ("profil", "the leg and foot FARTHER from the viewer (drawn behind, "
                             "partly hidden by the front leg)", False, staw("hip", False), False),
        })
    else:
        g.update({
            "k_tulow":  ("postac", "the BODY (the torso only, without the head, the legs and the "
                         "tail)", False, CIALO_C, False),
            "k_nogi_przednie": ("postac", "BOTH FRONT legs with their hooves", True, staw("shoulder", True), False),
            "k_nogi_tylne": ("postac", "BOTH HIND legs with their hooves (the ones further back)", True,
                             staw("hip", True), False),
            # the body keeps the root of the neck so the head+neck piece overlaps it (no seam when the head tilts)
            "k_p_cialo": ("profil", "the BODY (the torso together with the LOWEST THIRD of the neck "
                          "where it grows out of the chest and back, without the head and the upper "
                          "neck, the four legs and the tail)", False, CIALO_C, False),
            "k_p_noga_pp": ("profil", "the FRONT leg CLOSER to the viewer (the front leg drawn in "
                            "front)", False, staw("shoulder", False), False),
            "k_p_noga_pd": ("profil", "the FRONT leg FARTHER from the viewer (exactly ONE leg: the front "
                            "leg drawn behind the other front leg; the nearer front leg is NOT part of "
                            "this piece and is left out)", False, staw("shoulder", False), False),
            "k_p_noga_tp": ("profil", "the HIND leg CLOSER to the viewer (the hind leg drawn in "
                            "front)", False, staw("hip", False), False),
            "k_p_noga_td": ("profil", "the HIND leg FARTHER from the viewer (exactly ONE leg: the hind "
                            "leg drawn behind the other hind leg; the nearer hind leg is NOT part of "
                            "this piece and is left out)", False, staw("hip", False), False),
        })
    # back view: the same pieces again, keyed on tyl.png (the back puppet)
    if h:
        g.update({
            "k_t_tulow": ("tyl", "the BODY seen from behind (the torso between the neck and the hips, "
                          "without the head, the arms, the legs and the tail)", False, TULOW, False),
            "k_t_rece":  ("tyl", f"BOTH {k} seen from behind", True, staw("shoulder", True), False),
            "k_t_nogi":  ("tyl", "BOTH legs with their feet seen from behind", True, staw("hip", True), False),
        })
    else:
        g.update({
            "k_t_tulow": ("tyl", "the BODY seen from behind (the torso only, without the head, the legs "
                          "and the tail)", False, CIALO_C, False),
            "k_t_nogi_przednie": ("tyl", "BOTH FRONT legs with their hooves seen from behind (the ones "
                                  "further away, drawn behind the hind legs)", True, staw("shoulder", True), False),
            "k_t_nogi_tylne": ("tyl", "BOTH HIND legs with their hooves seen from behind (the ones "
                               "closer to the viewer)", True, staw("hip", True), False),
        })
    if p["ogon"]:
        g["k_ogon"] = ("postac", "the TAIL", False, OGON, False)
        g["k_t_ogon"] = ("tyl", "the TAIL seen from behind", False, OGON, False)
        g["k_p_ogon"] = ("profil", "the TAIL", False, OGON, False)
    return g


TWARZ = """A sprite sheet of NINE separate face pieces of the SAME cartoon character as
in the reference image, each piece drawn at the SAME VIEWING ANGLE as the
reference head ({kat}). {styl}
Arrange the nine pieces in a neat grid of 3 rows and 3 columns on a fully
TRANSPARENT background, generous empty space between pieces, nothing touching,
NO labels, NO text, NO frames. Each piece is drawn LARGE, filling most of its
cell, on nothing else - no head around it.
Row 1: {oczy} in three states:
  1. eyes wide open and friendly, with lashes, exactly as on the reference;
  2. eyes half closed, upper lids with lashes covering half the eye;
  3. eyes fully closed - just the curved closed lids with lashes.
Row 2:
  4. the pair of eyes wide open in surprise, bigger than in piece 1;
  5. {u0};
  6. {u1}.
Row 3:
  7. {u2};
  8. {u3};
  9. {u4}.
All eye pieces the same size as each other; all {usta} pieces the same size as
each other; same colours and style as the reference."""

ARKUSZE = {"twarz": ("postac", "straight from the front"),
           "twarz_bok": ("bok", "turned three-quarters to the viewer's right"),
           "twarz_profil": ("profil", "in full side view, facing the viewer's right")}
OCZY_ARKUSZA = {"twarz": "the PAIR OF EYES (both eyes together, as one piece)",
                "twarz_bok": "the PAIR OF EYES (both eyes together, as one piece)",
                # side view shows one eye; a drawn pair would be shrunk to the size of that one eye
                "twarz_profil": "the ONE visible EYE (in side view only the near eye shows: a single eye "
                                "with its eyebrow, never two eyes)"}
NAZWY_TWARZY = ["oczy_otwarte", "oczy_pol", "oczy_zamkniete", "oczy_zdziwione",
                "usta_zamkniete", "usta_usmiech", "usta_pol", "usta_o", "usta_smutne"]


# --------------------------------------------------------------------- gen

def gen(nazwa: str, jakosc: str = "high") -> None:
    p = POSTACIE[nazwa]
    kat = KORZEN / nazwa
    kat.mkdir(parents=True, exist_ok=True)
    h = p["rig"] == "humanoid"

    def zrob(dst, prompt, refs=(), size=ROZMIAR):
        if dst.exists():
            return
        print(f"{dst.stem}...", flush=True)
        for proba in range(5):
            try:
                figgen.generate(prompt, dst, refs=list(refs), size=size, quality=jakosc, background="transparent")
                return
            except figgen.GenError as e:
                # output-stage moderation is stochastic for innocent prompts; a rerun usually passes
                if "moderation_blocked" not in str(e) or proba == 4:
                    raise
                print(f"{dst.stem}: moderacja, ponawiam ({proba + 1})", flush=True)

    postac = kat / "postac.png"
    zrob(postac, (POSTAC_H if h else POSTAC_C).format(styl=STYL, **p))

    with ThreadPoolExecutor(3) as ex:
        prace = [ex.submit(zrob, kat / f"{w}.png", EDYCJA.format(zmiana=WIDOKI[w][p["rig"]].format(**p)), [postac])
                 for w in WIDOKI]
        for pr in prace:
            pr.result()

    def gotowiec(klucz):
        ref, co, mnoga, domk, bez_twarzy = gotowce(p)[klucz]
        twarz = BEZ_TWARZY.format(usta=p["usta"]) if bez_twarzy else ""
        zrob(kat / f"{klucz}.png", KLUCZ.format(
            co=co, Co=co[0].upper() + co[1:], zostaje="stay" if mnoga else "stays",
            it="they" if mnoga else "it", twarz=twarz, domkniecie=domk,
            each_is="each is" if mnoga else "is", its_="their" if mnoga else "its",
            has="have" if mnoga else "has", a_="" if mnoga else "a", s_="s" if mnoga else "", obj="them" if mnoga else "it",
            **{"is": "are" if mnoga else "is"}),
            [kat / f"{ref}.png"])

    def arkusz(klucz):
        ref, kat_widoku = ARKUSZE[klucz]
        u = USTA_WARIANTY[p["usta"]]
        zrob(kat / f"{klucz}.png", TWARZ.format(styl=STYL, kat=kat_widoku, usta=p["usta"], oczy=OCZY_ARKUSZA[klucz],
                                               u0=u[0], u1=u[1], u2=u[2], u3=u[3], u4=u[4]),
             [kat / f"{ref}.png"], size="1536x1024")

    with ThreadPoolExecutor(8) as ex:
        prace = [ex.submit(gotowiec, k) for k in gotowce(p)] + [ex.submit(arkusz, k) for k in ARKUSZE]
        for pr in prace:
            pr.result()


# ------------------------------------------------------------------- build

ODRZUCONE: list[str] = []


def _rgba(p: Path) -> np.ndarray:
    return np.asarray(Image.open(p).convert("RGBA"))


def _dopasuj(b: np.ndarray, a: np.ndarray) -> np.ndarray:
    if b.shape != a.shape:
        b = np.asarray(Image.fromarray(b).resize((a.shape[1], a.shape[0]), Image.LANCZOS))
    return b


def _plamy(maska: np.ndarray, min_pikseli: int):
    from scipy import ndimage

    etyk, ile = ndimage.label(maska, structure=np.ones((3, 3)))
    out = []
    for i in range(1, ile + 1):
        ys, xs = np.where(etyk == i)
        if len(ys) < min_pikseli:
            continue
        out.append({"etyk": i, "n": int(len(ys)), "x0": int(xs.min()), "x1": int(xs.max()) + 1,
                    "y0": int(ys.min()), "y1": int(ys.max()) + 1})
    out.sort(key=lambda b: -b["n"])
    return out, etyk


def _dziura(mk: np.ndarray) -> str | None:
    from scipy import ndimage
    dziury = ndimage.binary_fill_holes(mk) & ~mk
    return f"dziura {int(dziury.sum())}px" if dziury.sum() > 400 else None


BLIZNIAKI = {"p_noga_tyl": "p_noga_przod", "p_noga_pd": "p_noga_pp", "p_noga_td": "p_noga_tp"}


def _szczerby(maski: dict, klucze: dict, z: dict, prog: int = 300, za_tulowiem: set = frozenset(), tulow: str = "tulow") -> list[str]:
    """Two failure shapes of a piece drawn behind another one:
    - a BITE: closing the piece (r ~40 px) fills it, and that filled blob lies
      almost entirely (>= 80%) under a piece the rig puts in front - the arm's
      silhouette cut out of the tail. A natural concavity (a leg's bend, a tail
      curl) is only partly under anything, so it passes.
    - a SWALLOW: a far leg drawn together with its near twin is ~2x as wide."""
    from scipy import ndimage

    zle = []
    # a piece masked by the torso (stencil) is "in front" only where it shows: outside the torso
    przod = {q: (mq & ~maski[tulow]) if q in za_tulowiem and tulow in maski else mq for q, mq in maski.items()}
    for p_, mp in maski.items():
        dom = ndimage.binary_closing(mp, iterations=40, border_value=0) & ~mp
        etyk, ile = ndimage.label(dom)
        for q, mq in przod.items():
            if q == p_ or z.get(q, 0) <= z.get(p_, 0):
                continue
            for i in range(1, ile + 1):
                kawalek = etyk == i
                n = int(kawalek.sum())
                if n > prog and (kawalek & mq).sum() >= 0.8 * n:
                    print(f"  {klucze[p_]}: {p_} ma wciecie w ksztalcie {q} ({n}px) - ODRZUCONY")
                    zle.append(klucze[p_]); break
            if klucze[p_] in zle:
                break
        blizniak = BLIZNIAKI.get(p_)
        if blizniak in maski and klucze[p_] not in zle:
            szer = lambda m: np.ptp(np.where(m)[1])
            if szer(mp) > 1.35 * szer(maski[blizniak]):
                print(f"  {klucze[p_]}: {p_} jest {szer(mp) / szer(maski[blizniak]):.1f}x szersza od {blizniak} (obie nogi w jednym) - ODRZUCONY")
                zle.append(klucze[p_])
    return zle


def _magenta(K: np.ndarray) -> np.ndarray:
    rgb = K[:, :, :3].astype(int)
    m = (rgb[:, :, 0] > 150) & (rgb[:, :, 2] > 150) & (rgb[:, :, 1] < 120)
    m |= (np.abs(rgb[:, :, 0] - rgb[:, :, 2]) < 60) & (rgb[:, :, 1] < rgb[:, :, 0] - 60)
    return m


def _odmieszaj(K: np.ndarray, rdzen: np.ndarray, promien: int = 3):
    """Edge pixels blended with the key take the colour of the nearest clean
    pixel at their own luminance (a colour correction, the shape stays)."""
    from scipy import ndimage

    op = K[:, :, 3] > 10
    rgb = K[:, :, :3].astype(int)
    tint = (rgb[:, :, 0] - rgb[:, :, 1] > 25) & (rgb[:, :, 2] - rgb[:, :, 1] > 12)
    pasek = rdzen & ~ndimage.binary_erosion(rdzen, iterations=8)
    tint |= pasek & (rgb[:, :, 0] - rgb[:, :, 1] > 60) & (rgb[:, :, 2] >= rgb[:, :, 1] - 5)
    wnetrze = rdzen & ~ndimage.binary_dilation(~rdzen, iterations=16)
    if wnetrze.sum() > 500:
        ref = np.median(rgb[wnetrze], axis=0)
        odl = np.sqrt(((rgb - ref) ** 2).sum(axis=2))
        tint |= pasek & (rgb.mean(axis=2) > 70) & (odl > 38) & (rgb[:, :, 0] > rgb[:, :, 1] + 40)
    czyste = rdzen & ~tint
    mk = ndimage.binary_dilation(rdzen, iterations=promien) & op
    brzeg = mk & ~czyste
    K = K.copy()
    if brzeg.any() and czyste.any():
        _, idx = ndimage.distance_transform_edt(~czyste, return_indices=True)
        zr = K[idx[0][brzeg], idx[1][brzeg], :3].astype(float)
        lum = (rgb[brzeg].mean(axis=1, keepdims=True) + 1) / (zr.mean(axis=1, keepdims=True) + 1)
        K[brzeg, :3] = np.clip(zr * np.minimum(1.0, lum), 0, 255).astype(np.uint8)
    return K, mk


def _zapisz(K: np.ndarray, maska: np.ndarray, dst: Path) -> dict:
    """Write the piece (its own alpha, key removed); RGB under transparency
    bled from the edge so texture filtering does not show the key."""
    from scipy import ndimage

    ys, xs = np.where(maska)
    y0, y1, x0, x1 = int(ys.min()), int(ys.max()) + 1, int(xs.min()), int(xs.max()) + 1
    out = K[y0:y1, x0:x1].copy()
    out[~maska[y0:y1, x0:x1], 3] = 0
    nieprz = out[:, :, 3] > 0
    if nieprz.any() and not nieprz.all():
        _, idx = ndimage.distance_transform_edt(~nieprz, return_indices=True)
        out[~nieprz, :3] = out[idx[0][~nieprz], idx[1][~nieprz], :3]
    Image.fromarray(out).save(dst)
    return {"plik": dst.name, "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}


def _plamy_klucza(kat: Path, klucz: str, wzor: np.ndarray, ile: int, min_px: int = 1500):
    """The `ile` largest non-magenta blobs of a keyed image, each already
    colour-corrected. Rejects (returns None) when there are fewer, or a blob
    is taller than 0.6 of the figure (half the figure left unpainted)."""
    from scipy import ndimage

    plik = kat / f"{klucz}.png"
    if not plik.exists():
        return None
    K = _dopasuj(_rgba(plik), wzor)
    m = ndimage.binary_opening((K[:, :, 3] > 60) & ~_magenta(K), iterations=2)
    plamy, etyk = _plamy(m, min_px)
    ys = np.where(wzor[:, :, 3] > 60)[0]
    H = ys.max() - ys.min()
    out = []
    for b in plamy:
        # a bushy tail legitimately spans most of the figure, so it gets a looser limit
        limit = 0.9 if "ogon" in klucz else 0.6
        if b["y1"] - b["y0"] > limit * H and ile < 3:
            print(f"  {klucz}: plama {b['y1'] - b['y0']}px wysoka (> {limit} H) - ODRZUCONY")
            ODRZUCONE.append(klucz)
            return None
        K2, mk = _odmieszaj(K, etyk == b["etyk"])
        out.append((K2, mk))
        if len(out) == ile:
            break
    if len(out) < ile:
        print(f"  {klucz}: {len(out)} plam, trzeba {ile} - ODRZUCONY")
        ODRZUCONE.append(klucz)
        return None
    return out


def _os_na_konturze(mk: np.ndarray, cialo: np.ndarray, zapas: int = 8):
    """Pivot = centroid of the piece's pixels in the band along the body
    contour (inside the body, `zapas` px deep); fallback top-centre."""
    from scipy import ndimage

    pas = mk & cialo & ~ndimage.binary_erosion(cialo, iterations=zapas)
    # no overlap (a long neck ending exactly at the body line): widen the band step by step
    for szer in (zapas, 3 * zapas, 8 * zapas):
        if pas.any():
            break
        pas = mk & ndimage.binary_dilation(cialo, iterations=szer) & ~cialo
    if pas.any():
        sy, sx = np.where(pas)
        return [int(sx.mean()), int(sy.mean())]
    ys, xs = np.where(mk)
    return [int(xs.mean()), int(ys.min())]


def _bbox(bs):
    return {"x": min(b["x0"] for b in bs), "y": min(b["y0"] for b in bs),
            "w": max(b["x1"] for b in bs) - min(b["x0"] for b in bs),
            "h": max(b["y1"] for b in bs) - min(b["y0"] for b in bs)}


def _scal_nachodzace(plamy):
    """Fold a smaller blob into a bigger one when it sits ON TOP of it (an eye split
    from its lid/eyebrow by the opening); a mouth or beak beside or below stays apart."""
    plamy = [dict(b) for b in plamy]
    zmiana = True
    while zmiana:
        zmiana = False
        for a in plamy:
            for b in plamy:
                if b is a or b["n"] >= a["n"]:
                    continue
                w = min(a["x1"], b["x1"]) - max(a["x0"], b["x0"])
                luz = 0.6 * (a["y1"] - a["y0"])
                # only a flat blob (a brow, a lid) folds in - a small far eye above a nose does not
                if (w >= 0.6 * (b["x1"] - b["x0"]) and a["y0"] - luz < b["y1"] and b["y0"] < a["y1"]
                        and b["y0"] + b["y1"] < a["y0"] + a["y1"] and b["y1"] - b["y0"] < 0.6 * (a["y1"] - a["y0"])):
                    a.update(x0=min(a["x0"], b["x0"]), y0=min(a["y0"], b["y0"]), x1=max(a["x1"], b["x1"]),
                             y1=max(a["y1"], b["y1"]), n=a["n"] + b["n"], obce=max(a.get("obce", 1.0), b.get("obce", 1.0)))
                    plamy.remove(b); zmiana = True; break
            if zmiana:
                break
    return sorted(plamy, key=lambda b: -b["n"])


def _paleta(K: np.ndarray, mk: np.ndarray, ile: int = 1500) -> np.ndarray:
    """RGB samples of a piece well inside its outline (its fur / skin / feathers)."""
    from scipy import ndimage

    px = K[ndimage.binary_erosion(mk, iterations=14) & (K[:, :, 3] > 200)][:, :3].astype(int)
    if not len(px):
        px = K[mk & (K[:, :, 3] > 60)][:, :3].astype(int)
    return px[np.random.default_rng(0).choice(len(px), min(ile, len(px)), replace=False)]


def _obce(K: np.ndarray, region: np.ndarray, paleta: np.ndarray, prog: int = 70) -> np.ndarray:
    """Pixels of K inside `region` unlike every palette colour (Chebyshev > prog)."""
    from scipy.spatial import cKDTree

    out = np.zeros(region.shape, bool)
    ys, xs = np.where(region)
    if not len(ys):
        return out
    d, _ = cKDTree(paleta).query(K[ys, xs, :3].astype(int), p=np.inf)
    out[ys[d > prog], xs[d > prog]] = True
    return out


OSTATNIA_ROZNICA = None
OSTATNIE_PLAMY = None


def _twarz(glowa_bez: np.ndarray, maska: np.ndarray, kat: Path, klucz_z_twarza: str, wzor):
    """Face targets = where the view reference differs from the blank head, within
    the head and a 40 px margin (a beak sticks out). A blob is kept only if a third
    of its pixels are unlike the blank head's LOCAL palette (the fur around it): an
    edge strip left by a slightly narrower blank head is face-coloured and drops
    out, a beak / eye / nose stays. Blobs touching the head's bottom (neck,
    shoulders) are dropped. Eyes = the top pair with brows folded in, mouth =
    everything below the eyes' centre."""
    from scipy import ndimage
    global OSTATNIA_ROZNICA

    Z = wzor
    region = (Z[:, :, 3] > 60) & ndimage.binary_dilation(maska, iterations=40)
    inna = np.abs(Z[:, :, :3].astype(int) - glowa_bez[:, :, :3].astype(int)).max(axis=2) > 50
    roz = region & (inna | (glowa_bez[:, :, 3] <= 60))
    # outside the head only pixels unlike the head's palette count (a beak); fur-coloured ones
    # (a tail, the chest, the cheek edge of a narrower blank head) would bridge an eye to the bottom
    rdzen_glowy = ndimage.binary_erosion(maska, iterations=10) & (glowa_bez[:, :, 3] > 200)
    poza = roz & ~maska
    if rdzen_glowy.sum() >= 50 and poza.any():
        pal = glowa_bez[rdzen_glowy][:, :3].astype(int)
        pal = pal[np.random.default_rng(0).choice(len(pal), min(1500, len(pal)), replace=False)]
        roz[poza & ~_obce(Z, poza, pal)] = False
    roz = ndimage.binary_opening(roz, iterations=8)
    plamy, etyk = _plamy(roz, 300)
    ys = np.where(maska)[0]
    dol, H = ys.max(), ys.max() - ys.min()
    dobre = []
    przy_glowie = ndimage.binary_dilation(maska, iterations=8)
    for b in plamy:
        if b["y1"] >= dol - 20:
            continue                                          # neck stub vs real neck, shoulders
        m = etyk == b["etyk"]
        if not (m & przy_glowie).any():
            roz[m] = False; continue                          # chest spots inside the margin
        okolica = ndimage.binary_dilation(m, iterations=30) & rdzen_glowy & ~m
        if okolica.sum() >= 50:
            pal = glowa_bez[okolica][:, :3].astype(int)
            pal = pal[np.random.default_rng(0).choice(len(pal), min(600, len(pal)), replace=False)]
            b["obce"] = _obce(Z, m, pal).sum() / b["n"]
        else:
            b["obce"] = 1.0
        if (m & maska).sum() >= 0.9 * b["n"] or b["obce"] > 0.15:
            dobre.append(b)                                   # inside the head (a drawn feature) or unlike the fur
        else:
            roz[m] = False
    OSTATNIA_ROZNICA = roz
    plamy = _scal_nachodzace(dobre)
    global OSTATNIE_PLAMY; OSTATNIE_PLAMY = plamy
    if len(plamy) < 2:
        return None
    if plamy[0]["y1"] - plamy[0]["y0"] > 0.4 * H:
        klucz = klucz_z_twarza.replace("_twarz", "")
        print(f"  {klucz}: pusta glowa odbiega od referencji (plama {plamy[0]['y1'] - plamy[0]['y0']}px) - ODRZUCONY")
        ODRZUCONE.append(klucz)
        return None
    # eyes carry white and dark, so they are unlike the fur; a thick brow or a muzzle is not.
    # A brown iris on brown fur can fail that, so a side-by-side pair of similar blobs counts too.
    def para_z(a, c):
        oy = min(a["y1"], c["y1"]) - max(a["y0"], c["y0"])
        ox = min(a["x1"], c["x1"]) - max(a["x0"], c["x0"])
        return (oy > 0.5 * (a["y1"] - a["y0"]) and oy > 0.5 * (c["y1"] - c["y0"]) and 0.5 <= a["n"] / c["n"] <= 2
                and ox < 0.5 * min(a["x1"] - a["x0"], c["x1"] - c["x0"]))
    blizniacze = {id(b) for b in plamy for c in plamy if b is not c and para_z(b, c)}
    kandydaci = [b for b in plamy if b.get("obce", 1.0) > 0.3 or id(b) in blizniacze] or plamy
    OSTATNIE_PLAMY = {"plamy": plamy, "kandydaci": kandydaci}
    glowne = min(kandydaci[:2], key=lambda b: b["y0"] + b["y1"])
    def pokrycie(b):
        return max(0, min(b["y1"], glowne["y1"]) - max(b["y0"], glowne["y0"])) / (b["y1"] - b["y0"])
    def osobno_w_x(b):
        # the second eye sits beside the first, not on top of it
        return min(b["x1"], glowne["x1"]) - max(b["x0"], glowne["x0"]) < 0.5 * min(b["x1"] - b["x0"], glowne["x1"] - glowne["x0"])
    oczy = [glowne] + [b for b in kandydaci if b is not glowne and pokrycie(b) > 0.5 and b["n"] > 0.15 * glowne["n"] and osobno_w_x(b)][:1]
    srodek = (min(b["y0"] for b in oczy) + max(b["y1"] for b in oczy)) / 2
    usta = [b for b in plamy if b not in oczy and (b["y0"] + b["y1"]) / 2 > srodek]
    if usta:
        # specks (a feather spot, a stray edge) must not stretch the box
        usta = [b for b in usta if b["n"] > 0.1 * max(b_["n"] for b_ in usta)]
    return {"oczy": _bbox(oczy), "usta": _bbox(usta) if usta else None}


def _arkusz(kat: Path, klucz: str, out: Path, przyrostek: str, kolor_twarzy, czesci: dict, probki=None):
    """probki: {"oczy": RGB samples, "usta": RGB samples} of the blank head under each
    target; a cell's core is what is unlike them (eye, nose, lips, beak), not the fur
    it was drawn on - the same local-palette rule the targets were measured with."""
    from scipy import ndimage

    plik = kat / f"{klucz}.png"
    if not plik.exists():
        return
    T = _rgba(plik)
    tm = ndimage.binary_closing(T[:, :, 3] > 40, iterations=3)
    plamy, etyk = _plamy(tm, 400)
    komorki = {}
    for b in plamy:
        k = (min(2, int((b["y0"] + b["y1"]) / 2 / T.shape[0] * 3)), min(2, int((b["x0"] + b["x1"]) / 2 / T.shape[1] * 3)))
        komorki.setdefault(k, []).append(b)
    for i, n in enumerate(NAZWY_TWARZY):
        k = (i // 3, i % 3)
        if k not in komorki:
            print(f"  BRAK {n}{przyrostek}")
            continue
        mk = np.zeros(etyk.shape, dtype=bool)
        for b in komorki[k]:
            mk |= etyk == b["etyk"]
        nazwa = n + przyrostek
        czesci[nazwa] = _zapisz(T, mk, out / f"{nazwa}.png")
        # rdzen = piksele niepodobne do koloru twarzy (nos i kreska, dziob, plastry)
        piece = _rgba(out / f"{nazwa}.png")
        op = ndimage.binary_erosion(piece[:, :, 3] > 60, iterations=16)
        pal = (probki or {}).get("usta" if n.startswith("usta") else "oczy")
        inne = _obce(piece, op, pal) if pal is not None else op & (np.abs(piece[:, :, :3].astype(int) - kolor_twarzy.astype(int)).max(axis=2) > 110)
        inne = ndimage.binary_opening(inne, iterations=2)
        if inne.sum() < 50:
            inne = piece[:, :, 3] > 60
        ys, xs = np.where(inne)
        czesci[nazwa]["rdzen"] = {"x": int(xs.min()), "y": int(ys.min()), "w": int(xs.max() - xs.min() + 1), "h": int(ys.max() - ys.min() + 1)}


def build(nazwa: str) -> dict:
    p = POSTACIE[nazwa]
    rig = json.loads((RIGI / f"{p['rig']}.json").read_text(encoding="utf-8"))
    kat = KORZEN / nazwa
    out = kat / "czesci"
    out.mkdir(exist_ok=True)
    for stary in out.glob("*.png"):
        stary.unlink()
    A = _rgba(kat / "postac.png")
    P = _rgba(kat / "profil.png")
    ys = np.where(A[:, :, 3] > 60)[0]
    kadr = {"w": int(A.shape[1]), "h": int(A.shape[0]), "gora": int(ys.min()), "dol": int(ys.max()) + 1}
    ysp = np.where(P[:, :, 3] > 60)[0]
    kadr_p = {"w": int(P.shape[1]), "h": int(P.shape[0]), "gora": int(ysp.min()), "dol": int(ysp.max()) + 1}
    czesci = {}
    twarz = {}
    h = p["rig"] == "humanoid"

    maski, klucze = {}, {}

    def jeden(klucz, nazwa_czesci, wzor, cialo=None, widok="przod"):
        r = _plamy_klucza(kat, klucz, wzor, 1, 3000)
        if not r:
            return None
        K, mk = r[0]
        if zle := _dziura(mk):
            print(f"  {klucz}: {zle} - ODRZUCONY"); ODRZUCONE.append(klucz)
            return None
        maski[nazwa_czesci] = mk & (K[:, :, 3] > 60); klucze[nazwa_czesci] = klucz
        czesci[nazwa_czesci] = _zapisz(K, mk, out / f"{nazwa_czesci}.png") | {"widok": widok}
        if cialo is not None:
            czesci[nazwa_czesci]["os"] = _os_na_konturze(mk, cialo)
        print(f"  {nazwa_czesci:14s} {czesci[nazwa_czesci]}")
        # the face is measured on the SAVED piece (key removed, edge de-tinted), exactly what the engine shows
        c = czesci[nazwa_czesci]
        G = np.zeros_like(K); G[c["y"]:c["y"] + c["h"], c["x"]:c["x"] + c["w"]] = _rgba(out / f"{nazwa_czesci}.png")
        return G, G[:, :, 3] > 60

    def para(klucz, nazwy, wzor, cialo, widok):
        r = _plamy_klucza(kat, klucz, wzor, 2)
        if not r:
            return
        r.sort(key=lambda km: np.where(km[1])[1].mean())      # lewa, prawa po x
        for K, mk in r:
            if zle := _dziura(mk):
                print(f"  {klucz}: {zle} - ODRZUCONY"); ODRZUCONE.append(klucz)
                return
        for (K, mk), n in zip(r, nazwy):
            maski[n] = mk & (K[:, :, 3] > 60); klucze[n] = klucz
            czesci[n] = _zapisz(K, mk, out / f"{n}.png") | {"widok": widok, "os": _os_na_konturze(mk, cialo)}
            print(f"  {n:14s} {czesci[n]}")

    # ---- przod
    t = jeden("k_tulow", "tulow", A)
    cialo = t[1] if t else (A[:, :, 3] > 60)
    g = jeden("k_glowa", "glowa", A, cialo)
    if g:
        twarz["przod"] = _twarz(g[0], g[1], kat, "k_glowa_twarz", A)
    if h:
        para("k_rece", ("reka_l", "reka_p"), A, cialo, "przod")
        para("k_nogi", ("noga_l", "noga_p"), A, cialo, "przod")
    else:
        para("k_nogi_przednie", ("noga_l", "noga_p"), A, cialo, "przod")
        para("k_nogi_tylne", ("noga_tl", "noga_tp"), A, cialo, "przod")
    if p["ogon"]:
        jeden("k_ogon", "ogon", A, cialo)
    # ---- 3/4 i tyl: glowy na kadrze swojej referencji
    for w, klucz, ref in (("bok", "k_glowa_bok", "bok"), ("tyl", "k_glowa_tyl", "tyl")):
        R = _rgba(kat / f"{ref}.png")
        r = jeden(klucz, f"glowa_{w}", R, None, w)
        if r:
            ysr = np.where(R[:, :, 3] > 60)[0]
            czesci[f"glowa_{w}"]["kadr"] = {"w": int(R.shape[1]), "h": int(R.shape[0]), "gora": int(ysr.min()), "dol": int(ysr.max()) + 1}
            if w == "bok":
                twarz["bok"] = _twarz(r[0], r[1], kat, "k_glowa_bok_twarz", R)
    # ---- tyl: trzecia lalka (tulow, konczyny, ogon od tylu) na kadrze tyl.png
    T = _rgba(kat / "tyl.png")
    yst = np.where(T[:, :, 3] > 60)[0]
    kadr_t = {"w": int(T.shape[1]), "h": int(T.shape[0]), "gora": int(yst.min()), "dol": int(yst.max()) + 1}
    tt = jeden("k_t_tulow", "t_tulow", T, None, "tyl")
    cialo_t = tt[1] if tt else (T[:, :, 3] > 60)
    if "glowa_tyl" in maski:
        czesci["glowa_tyl"]["os"] = _os_na_konturze(maski["glowa_tyl"], cialo_t)
    if h:
        para("k_t_rece", ("t_reka_l", "t_reka_p"), T, cialo_t, "tyl")
        para("k_t_nogi", ("t_noga_l", "t_noga_p"), T, cialo_t, "tyl")
    else:
        para("k_t_nogi_przednie", ("t_noga_l", "t_noga_p"), T, cialo_t, "tyl")
        para("k_t_nogi_tylne", ("t_noga_tl", "t_noga_tp"), T, cialo_t, "tyl")
    if p["ogon"]:
        jeden("k_t_ogon", "t_ogon", T, cialo_t, "tyl")
    # ---- profil
    tp = jeden("k_p_cialo", "p_cialo", P, None, "profil")
    cialo_p = tp[1] if tp else (P[:, :, 3] > 60)
    gp = jeden("k_p_glowa", "p_glowa", P, cialo_p, "profil")
    if gp:
        twarz["profil"] = _twarz(gp[0], gp[1], kat, "k_p_glowa_twarz", P)
    nogi = ("k_p_noga_przod", "k_p_noga_tyl") if h else ("k_p_noga_pp", "k_p_noga_pd", "k_p_noga_tp", "k_p_noga_td")
    for klucz in nogi:
        jeden(klucz, klucz[2:], P, cialo_p, "profil")
    if h:
        jeden("k_p_reka", "p_reka", P, cialo_p, "profil")
    if p["ogon"]:
        jeden("k_p_ogon", "p_ogon", P, cialo_p, "profil")
    # ---- szczerby: brzeg wzdluz czesci lezacej z przodu (z rigu)
    z = {o["czesc"]: o.get("z", 0) for o in rig["kosci"].values() if o.get("czesc")}
    za = {o["czesc"] for o in rig["kosci"].values() if o.get("za_tulowiem")}
    for widok_ in ("przod", "profil", "tyl"):
        m_ = {n: m for n, m in maski.items() if czesci.get(n, {}).get("widok") == widok_}
        for klucz_ in _szczerby(m_, klucze, z, za_tulowiem=za):
            ODRZUCONE.append(klucz_)
    # ---- arkusze twarzy
    def kolor(K, mk):
        return np.median(K[mk & (K[:, :, 3] > 200)][:, :3], axis=0)
    def probki(K, mk, widok):
        from scipy import ndimage
        out_ = {}
        for co in ("oczy", "usta"):
            t = (twarz.get(widok) or {}).get(co)
            if not t:
                continue
            okno = np.zeros_like(mk); okno[t["y"]:t["y"] + t["h"], t["x"]:t["x"] + t["w"]] = True
            # keep the head's dark outline out of the palette, or a black nose would count as "fur"
            px = K[ndimage.binary_erosion(mk, iterations=14) & okno & (K[:, :, 3] > 200)][:, :3].astype(int)
            if len(px):
                out_[co] = px[np.random.default_rng(0).choice(len(px), min(800, len(px)), replace=False)]
        return out_
    if g:
        _arkusz(kat, "twarz", out, "", kolor(*g), czesci, probki(*g, "przod"))
    if "glowa_bok" in czesci:
        R = _rgba(kat / "bok.png"); rb = _plamy_klucza(kat, "k_glowa_bok", R, 1, 3000)
        if rb:
            _arkusz(kat, "twarz_bok", out, "_bok", kolor(*rb[0]), czesci, probki(*rb[0], "bok"))
    if gp:
        _arkusz(kat, "twarz_profil", out, "_profil", kolor(*gp), czesci, probki(*gp, "profil"))
    # ---- os glowy: srodek glowy (os_wzgledna z rigu), nie szyja
    for kosc, opis in rig["kosci"].items():
        cz = opis.get("czesc")
        if cz and cz in czesci and opis.get("os_wzgledna"):
            b = czesci[cz]; u, v = opis["os_wzgledna"]
            czesci[cz]["os"] = [int(b["x"] + b["w"] * u), int(b["y"] + b["h"] * v)]
    # przod symetryczny: cele twarzy na osi glowy
    if twarz.get("przod") and "glowa" in czesci:
        gl = czesci["glowa"]
        for t_ in ("oczy", "usta"):
            if twarz["przod"].get(t_):
                twarz["przod"][t_]["x"] = int(gl["x"] + gl["w"] / 2 - twarz["przod"][t_]["w"] / 2)
    for w, tw in twarz.items():
        print(f"  twarz {w}: {tw}")

    opis = {"nazwa": nazwa, "rig": p["rig"], "wysokosc": p["wysokosc"], "kadr": kadr, "kadr_profil": kadr_p, "kadr_tyl": kadr_t,
            "kosci": rig["kosci"], "glowy": rig["glowy"], "lokomocja": rig["lokomocja"],
            "czesci": czesci, "twarz": twarz, "usta_nad_oczami": p["usta"] == "beak", "animacje": rig["animacje"], "odrzucone": list(ODRZUCONE)}
    (kat / "postac.json").write_text(json.dumps(opis, indent=1, ensure_ascii=False), encoding="utf-8")
    return opis


def zastosuj_poprawki(opis: dict, pop: dict) -> None:
    for n, zm in pop.get("czesci", {}).items():
        if n in opis["czesci"]:
            opis["czesci"][n].update(zm)
    for w, cele in pop.get("twarz", {}).items():
        opis.setdefault("twarz", {}).setdefault(w, {}).update(cele)
    for k in ("kadr", "kadr_profil", "kadr_tyl"):
        if k in pop:
            opis[k] = pop[k]


def install(nazwa: str) -> None:
    src = KORZEN / nazwa
    dst = GRA / nazwa
    (dst / "czesci").mkdir(parents=True, exist_ok=True)
    for stary in (dst / "czesci").glob("*"):
        stary.unlink()
    # the game gets WebP: alpha kept exact (the RGB bled under transparency survives), q75 is
    # indistinguishable from PNG at tablet scale and 8-10x smaller
    for f in (src / "czesci").glob("*.png"):
        Image.open(f).convert("RGBA").save(dst / "czesci" / (f.stem + ".webp"), "WEBP", quality=75, method=6, exact=True)
    opis = json.loads((src / "postac.json").read_text(encoding="utf-8"))
    for cz in opis["czesci"].values():
        cz["plik"] = cz["plik"].rsplit(".", 1)[0] + ".webp"
    # animations always come from the rig template, so a rig edit needs no rebuild
    rig = json.loads((RIGI / f"{opis['rig']}.json").read_text(encoding="utf-8"))
    for klucz in ("animacje", "kosci", "glowy", "lokomocja"):
        opis[klucz] = rig[klucz]
    # manual corrections from editor.py survive a rebuild
    poprawki = dst / "poprawki.json"
    if poprawki.exists():
        zastosuj_poprawki(opis, json.loads(poprawki.read_text(encoding="utf-8")))
        print("nalozono poprawki z edytora")
    (dst / "postac.json").write_text(json.dumps(opis, ensure_ascii=False), encoding="utf-8")
    # the untouched build result travels with the character: the editor diffs against it (poprawki.json)
    shutil.copy(src / "postac.json", dst / "postac.build.json")
    # joints of the bendable limbs: measured on the installed pieces, editor corrections kept
    from stawy import measure as zmierz_stawy
    zmierz_stawy(nazwa)
    print(f"zainstalowano {nazwa}: {len(list((dst / 'czesci').glob('*.webp')))} czesci")


if __name__ == "__main__":
    cmd, kto = sys.argv[1], sys.argv[2]
    if cmd in ("gen", "all"):
        gen(kto)
    if cmd in ("build", "all"):
        ODRZUCONE.clear()
        build(kto)
        for _ in range(2):
            if cmd != "all" or not ODRZUCONE:
                break
            print("powtarzam generacje:", ODRZUCONE)
            for k in set(ODRZUCONE):
                (KORZEN / kto / f"{k}.png").unlink(missing_ok=True)
            gen(kto)
            ODRZUCONE.clear()
            build(kto)
    if cmd in ("install", "all"):
        install(kto)
