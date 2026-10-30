"""The list of painted pictures a lesson may show (game/assets/malowane.json): illustrations, found pictures,
scratch-offs, search and difference pictures, dots, comics, mazes, grids - {"ilustracje/uczta_zima": ["obraz.webp"], ...}.

  python tools/assets_index.py      # make_dist.py runs it too

The player reads it while a lesson loads (Player.coWczytac): every picture whose name the lesson's code mentions is
loaded, decoded and sent to the GPU on the loading screen, not the moment it appears (that froze a tablet for a frame).
A picture missing from the list still works - it loads when shown, as before.
"""
from __future__ import annotations

import json
from pathlib import Path

ASSETS = Path(__file__).resolve().parents[1] / "game" / "assets"
RODZAJE = ["ilustracje", "znaleziska", "zdrapki", "roznice", "kropki", "historyjki", "labirynty", "siatki"]


def main() -> None:
    out = {}
    for r in RODZAJE:
        for d in sorted((ASSETS / r).iterdir()) if (ASSETS / r).exists() else []:
            pliki = sorted(p.name for p in d.glob("*.webp"))
            if d.is_dir() and pliki:
                out[f"{r}/{d.name}"] = pliki
    (ASSETS / "malowane.json").write_text(json.dumps(out, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print(f"malowane.json: {len(out)} pictures")


if __name__ == "__main__":
    main()
