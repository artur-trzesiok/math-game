"""The game as it goes onto the server: a clean `dist/` with only what a tablet loads.

  python make_dist.py            # rebuild dist/ from game/
  python make_dist.py --check    # list what would be shipped and what is left out, write nothing
  python make_dist.py --glos64   # the spoken lines at 64 kbps mono (music and effects untouched), each encoded
                                 # once from its original (tools/audio/work/oryginaly) with its speaker's loudness

Layout = the hosting (https://matematyka.cubeproject.pl): `index.html`, `og.jpg` and `engine/` at the root (the page
imports `./engine/player.js`), everything the engine loads by its `/game/...` paths under `/game/`. Left out: notes and plans (*.md), editor files (postac.build.json, poprawki.json, *.bak),
lessons not ready yet (index.json "wkrotce") with their recordings, recordings of lessons no longer in the index.
`dist/` is rebuilt from scratch every time and is not in git.
"""
from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GAME = ROOT / "game"
DIST = ROOT / "dist"

POMIJANE_NAZWY = {"postac.build.json", "poprawki.json"}
POMIJANE_ROZSZERZENIA = {".md", ".bak", ".py", ".tmp"}
KORZEN = ("index.html", "og.jpg", "manifest.webmanifest", "ikona-192.png", "ikona-512.png", "ikona-180.png", "engine/")   # served from the domain root


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


KBPS = 64 if "--glos64" in sys.argv else 0


_A = None


def _wczytaj_audio() -> None:
    """In each worker process: tools/audio/make_audio.py's functions (normalize, the originals)."""
    global _A
    import runpy
    argv, sys.argv = sys.argv, [sys.argv[0]]
    _A = runpy.run_path(str(ROOT / "tools" / "audio" / "make_audio.py"), run_name="make_dist")
    sys.argv = argv


def _jeden(zadanie: tuple[str, str, str | None, int]) -> None:
    src, dst, who, kbps = zadanie
    _A["normalize"](Path(src), who, dst=Path(dst), kbps=kbps)


def przekoduj(glosy: list[tuple[Path, Path]]) -> None:
    """The spoken lines at KBPS: from the original, with the speaker's gain (tools/audio/make_audio.py normalize).
    Worker processes, one per core: threads left most cores idle (the loudness is measured in Python)."""
    from concurrent.futures import ProcessPoolExecutor
    kto = {}
    for rel, _ in glosy:
        mf = GAME / rel.parent / "manifest.json"
        if mf.parent not in kto:
            kto[mf.parent] = json.loads(mf.read_text(encoding="utf-8")) if mf.exists() else {}
    zadania = [(str(GAME / rel), str(dst), kto[(GAME / rel).parent].get(rel.stem, {}).get("who"), KBPS) for rel, dst in glosy]
    with ProcessPoolExecutor(os.cpu_count() or 8, initializer=_wczytaj_audio) as ex:
        for i, _ in enumerate(ex.map(_jeden, zadania, chunksize=24), 1):
            if i % 1000 == 0:
                print(f"  voices {i}/{len(glosy)}")
    mb = sum(d.stat().st_size for _, d in glosy) / 2**20
    print(f"voices: {len(glosy)} at {KBPS} kbps, {mb:.0f} MB")


def main() -> int:
    tylko_sprawdz = "--check" in sys.argv
    if not tylko_sprawdz:                                             # the painted pictures each lesson preloads
        import runpy
        runpy.run_path(str(ROOT / "tools" / "assets_index.py"), run_name="__main__")
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
    glosy = []
    for rel in pliki:
        r = rel.as_posix()
        dst = DIST / (rel if r in KORZEN or r.startswith("engine/") else Path("game") / rel)
        dst.parent.mkdir(parents=True, exist_ok=True)
        if KBPS and rel.parts[0] == "audio" and rel.parts[1] in ("pl", "en") and rel.suffix == ".mp3":
            glosy.append((rel, dst))
        else:
            shutil.copy2(GAME / rel, dst)
    if glosy:
        przekoduj(glosy)
    # a lesson without its files is a placeholder in the shipped menu, whatever the working index says
    ix = DIST / "game" / "lessons" / "index.json"
    d = json.loads(ix.read_text(encoding="utf-8"))
    for l in d["lessons"]:
        if l["id"] not in gotowe:
            l["wkrotce"] = True
    ix.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # the release's stamp: a running game compares it with the one it started with and reloads in the menu (player.js)
    import subprocess, datetime
    commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    stempel = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    (DIST / "wersja.json").write_text(json.dumps({"wersja": f"{stempel} {commit}"}) + "\n", encoding="utf-8")
    print(f"-> {DIST}  (upload its contents to the domain root)  version {stempel} {commit}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
