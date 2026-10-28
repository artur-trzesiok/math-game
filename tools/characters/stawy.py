"""Joint measurement for bendable limbs:  python tools/characters/stawy.py <kto>|all

A limb piece is drawn whole (hip to toes, shoulder to paw, tail base to tip). The game
deforms it as a mesh along a chain of joints, so it needs to know where the knee,
the ankle, the elbow... lie on the drawing. Measurement only, nothing is cut:

  s      = geodesic distance inside the alpha mask from the PROXIMAL side of the pivot -
           the overlap hidden behind the torso: above the pivot for legs, arms and wings,
           towards the view's torso centre for tails (the bone's `dystalnie`: "dol" |
           "od_tulowia") - divided by the farthest one (0 there, 1 at the tip). It follows
           the drawing, so a curled tail or an L-shaped owl foot is walked along its own
           shape, and it rises from 0 smoothly along the whole border (game/engine/siatka.js
           computes the same field for the mesh).
  width  = how many mask cells share each s band - a joint is where the limb narrows.
  joint  = for a rig joint with an `okno` [a, b]: the narrowest band inside that window
           (a pull to the window's middle: cartoon legs taper all the way to the foot, so
           only a real narrowing moves a joint off the middle); with a fixed
           `s` (tails): that band. Its position = the band's centroid.

Writes `stawy: [{x, y}, ...]` (reference-frame pixels, like `os`) into every chain
piece of game/assets/characters/<kto>/postac.build.json and postac.json; a piece the
editor corrected (poprawki.json) keeps its corrected joints.
"""
import heapq
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CHARACTERS = ROOT / "game" / "assets" / "characters"
CELL = 4            # px of the measuring grid
BANDS = 60


def geodesic(mask: np.ndarray, seed: tuple, source: np.ndarray = None) -> np.ndarray:
    """8-connected Dijkstra from the `source` cells plus the mask cells nearest to `seed` (which may lie outside the mask)."""
    h, w = mask.shape
    ys, xs = np.nonzero(mask)
    d0 = np.hypot(xs - seed[0], ys - seed[1])
    start = (d0 <= d0.min() + 2.5) | (source[ys, xs] if source is not None else False)
    dist = np.full(mask.shape, np.inf)
    heap = []
    for x, y in zip(xs[start], ys[start]):
        dist[y, x] = 0.0
        heap.append((0.0, int(y), int(x)))
    heapq.heapify(heap)
    steps = [(-1, 0, 1.0), (1, 0, 1.0), (0, -1, 1.0), (0, 1, 1.0), (-1, -1, 1.414), (-1, 1, 1.414), (1, -1, 1.414), (1, 1, 1.414)]
    while heap:
        d, y, x = heapq.heappop(heap)
        if d > dist[y, x]:
            continue
        for dy, dx, c in steps:
            yy, xx = y + dy, x + dx
            if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and d + c < dist[yy, xx]:
                dist[yy, xx] = d + c
                heapq.heappush(heap, (d + c, yy, xx))
    return dist


TORSO = {"przod": "tulow", "bok": "tulow", "tyl": "t_tulow", "profil": "p_cialo"}


def field(mask: np.ndarray, seed: tuple, centre: tuple, side: str = "dol") -> np.ndarray:
    """s per cell (NaN outside the mask): geodesic distance from the proximal side over the farthest one."""
    ys, xs = np.mgrid[: mask.shape[0], : mask.shape[1]]
    if side == "od_tulowia":          # the half-plane beyond the pivot, seen from the torso centre
        vx, vy = seed[0] - centre[0], seed[1] - centre[1]
        distal = (xs + 0.5 - seed[0]) * vx + (ys + 0.5 - seed[1]) * vy > 0
    elif side == "gora":              # rooted at the bottom (the torso on the hips, a plant)
        distal = ys + 0.5 < seed[1]
    else:
        distal = ys + 0.5 > seed[1]
    dist = geodesic(mask, seed, mask & ~distal)
    ok = np.isfinite(dist)
    return np.where(ok, np.clip(dist / dist[ok].max(), 0, 1), np.nan)


def measure_piece(img: Image.Image, cz: dict, specs: list, torso: dict, side: str = "dol") -> list:
    a = np.asarray(img.convert("RGBA"))[:, :, 3]
    h, w = a.shape[0] // CELL, a.shape[1] // CELL
    mask = a[: h * CELL, : w * CELL].reshape(h, CELL, w, CELL).max(axis=(1, 3)) > 40
    sx, sy = cz["w"] / a.shape[1], cz["h"] / a.shape[0]           # image px -> reference px (1:1 today)
    os_ = cz.get("os") or ([cz["x"] + cz["w"] / 2, cz["y"] + cz["h"] * 0.97] if side == "gora" else [cz["x"] + cz["w"] / 2, cz["y"]])
    seed = ((os_[0] - cz["x"]) / sx / CELL, (os_[1] - cz["y"]) / sy / CELL)
    centre = ((torso["x"] + torso["w"] / 2 - cz["x"]) / sx / CELL, (torso["y"] + torso["h"] / 2 - cz["y"]) / sy / CELL)
    s = field(mask, seed, centre, side)
    ok = np.isfinite(s)
    band = np.clip(np.nan_to_num(s * BANDS).astype(int), 0, BANDS - 1)
    count = np.array([(ok & (band == b) & (s > 0)).sum() for b in range(BANDS)], float)
    width = np.where(count > 0, np.convolve(count, np.ones(3) / 3, mode="same"), np.inf)   # an empty band is no joint
    out = []
    for sp in specs:
        if "s" in sp:
            b = int(sp["s"] * BANDS)
            filled = np.nonzero(count)[0]
            if filled.size: b = int(filled[np.argmin(abs(filled - b))])   # a tiny piece (a bunny's tail) may have no field at all
        else:
            lo, hi = int(sp["okno"][0] * BANDS), int(sp["okno"][1] * BANDS)
            mid = (lo + hi) / 2
            cost = [width[b] * (1 + 1.0 * abs(b - mid) / max(1, (hi - lo) / 2)) for b in range(lo, hi + 1)]
            b = lo + int(np.argmin(cost))
        ys, xs = np.nonzero(ok & (band == b) & (s > 0))
        if not len(xs): ys, xs = np.nonzero(mask)                  # no field: the piece's own middle
        cx, cy = (xs.mean() + 0.5) * CELL, (ys.mean() + 0.5) * CELL
        out.append({"x": round(cz["x"] + cx * sx), "y": round(cz["y"] + cy * sy)})
    return out


def measure(kto: str) -> None:
    kat = CHARACTERS / kto
    pop_f = kat / "poprawki.json"
    pop = json.loads(pop_f.read_text(encoding="utf-8")).get("czesci", {}) if pop_f.exists() else {}
    files = [kat / "postac.build.json", kat / "postac.json"]
    docs = [json.loads(f.read_text(encoding="utf-8")) for f in files if f.exists()]
    live = docs[-1]
    measured = {}
    for kosc in live["kosci"].values():
        n, specs = kosc.get("czesc"), kosc.get("stawy")
        if not specs or n not in live["czesci"]:
            continue
        cz = live["czesci"][n]
        torso = live["czesci"][TORSO[cz.get("widok", "przod")]]
        measured[n] = measure_piece(Image.open(kat / "czesci" / cz["plik"]), cz, specs, torso, kosc.get("dystalnie", "dol"))
        print(f"  {kto:10s} {n:14s} " + "  ".join(f"{sp['nazwa']}=({j['x']},{j['y']})" for sp, j in zip(specs, measured[n])))
    for f, d in zip([f for f in files if f.exists()], docs):
        for n, st in measured.items():
            if n in d["czesci"]:
                d["czesci"][n]["stawy"] = st
        if f.name == "postac.json":
            for n, zm in pop.items():
                if "stawy" in zm and n in d["czesci"]:
                    d["czesci"][n]["stawy"] = zm["stawy"]
        f.write_text(json.dumps(d, ensure_ascii=False, indent=1 if f.name == "postac.build.json" else None), encoding="utf-8")


if __name__ == "__main__":
    who = sys.argv[1] if len(sys.argv) > 1 else "all"
    for k in sorted(p.name for p in CHARACTERS.iterdir() if p.is_dir()) if who == "all" else [who]:
        measure(k)
