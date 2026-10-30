"""The game as it goes onto the server: a clean `dist/` with only what a tablet loads.

  python make_dist.py            # rebuild dist/ from game/
  python make_dist.py --check    # list what would be shipped and what is left out, write nothing

Layout = the hosting (https://matematyka.cubeproject.pl): `index.html`, `og.jpg` and `engine/` at the root (the page
imports `./engine/player.js`), everything the engine loads by its `/game/...` paths under `/game/`. Left out: notes and plans (*.md), editor files (postac.build.json, poprawki.json, *.bak),
lessons not ready yet (index.json "wkrotce") with their recordings, recordings of lessons no longer in the index.
`dist/` is rebuilt from scratch every time and is not in git.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GAME = ROOT / "game"
DIST = ROOT / "dist"

POMIJANE_NAZWY = {"postac.build.json", "poprawki.json"}
POMIJANE_ROZSZERZENIA = {".md", ".bak", ".py", ".tmp"}
KORZEN = ("index.html", "og.jpg", "engine/")   # served from the domain root


def lekcje() -> tuple[set[str], set[str]]:
    """(lessons that ship, every lesson id in the index)."""
    idx = json.loads((GAME / "lessons" / "index.json").read_text(encoding="utf-8"))
    wszystkie = {l["id"] for l in idx["lessons"]}
    gotowe = {l["id"] for l in idx["lessons"] if not l.get("wkrotce") and (GAME / "lessons" / l["id"] / "lesson.json").exists()}
    return gotowe, wszystkie


def wysylamy(rel: Path, gotowe: set[str], katalogi_lekcji: set[str]) -> bool:
    if rel.name in POMIJANE_NAZWY or rel.suffix.lower() in POMIJANE_ROZSZERZENIA or rel.name.startswith("."):
        return False
    cz = rel.parts
    if cz[0] == "lessons" and len(cz) > 2 and cz[1] not in gotowe:              # a lesson folder not ready
        return False
    if cz[0] == "audio" and len(cz) > 3 and cz[1] in ("pl", "en") and cz[2] in katalogi_lekcji and cz[2] not in gotowe:
        return False                                                              # its recordings
    return True


def main() -> int:
    tylko_sprawdz = "--check" in sys.argv
    gotowe, wszystkie = lekcje()
    # every lesson folder or recording folder that is not ready or no longer in the index stays out;
    # the shared voices (menu, album, zachety, pochwaly, oddechy, etapy) are not lesson folders
    katalogi_lekcji = wszystkie | {p.name for p in (GAME / "lessons").iterdir() if p.is_dir()}
    for lang in ("pl", "en"):
        for p in (GAME / "audio" / lang).iterdir():
            if p.is_dir() and (p / "manifest.json").exists() and not (GAME / p.name).is_dir() and p.name not in ("album", "menu", "etapy"):
                katalogi_lekcji.add(p.name)
    pliki, pominiete = [], []
    for f in sorted(GAME.rglob("*")):
        if f.is_file():
            rel = f.relative_to(GAME)
            (pliki if wysylamy(rel, gotowe, katalogi_lekcji) else pominiete).append(rel)

    rozmiar = sum((GAME / r).stat().st_size for r in pliki)
    print(f"lessons shipped: {len(gotowe)}  ({', '.join(sorted(wszystkie - gotowe)[:6])}{' ...' if len(wszystkie - gotowe) > 6 else ''} wait)")
    print(f"files: {len(pliki)} shipped, {len(pominiete)} left out, {rozmiar / 2**20:.0f} MB")
    if tylko_sprawdz:
        kat = {}
        for r in pominiete:
            k = "/".join(r.parts[:3]) if r.parts[0] == "audio" else "/".join(r.parts[:2])
            kat[k] = kat.get(k, 0) + 1
        for k, n in sorted(kat.items()):
            print(f"  left out  {k}  ({n})")
        return 0

    if DIST.exists():
        shutil.rmtree(DIST)
    for rel in pliki:
        r = rel.as_posix()
        dst = DIST / (rel if r in KORZEN or r.startswith(KORZEN[2]) else Path("game") / rel)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(GAME / rel, dst)
    print(f"-> {DIST}  (upload its contents to the domain root)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
