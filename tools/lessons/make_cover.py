"""Lesson covers for the menu: one square picture-book illustration per lesson.

  python tools/lessons/make_cover.py bigger_smaller     # -> game/lessons/bigger_smaller/cover.webp
  python tools/lessons/make_cover.py                    # every lesson that has none yet

The prompt is the lesson's `cover` field in lesson.json (what the picture shows);
style and cast come from REFERENCES handed to gpt-image as edit inputs: the front
reference of each of the lesson's characters and the plate of its story
background, so the cover is drawn in the same style, with the same characters, in
the same place. Delete cover.webp to redo one. Work files stay in tools/lessons/work/.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "common"))
import figgen  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
LESSONS = ROOT / "game" / "lessons"
WORK = Path(__file__).resolve().parent / "work"
CHARACTERS = ROOT / "tools" / "characters" / "work"
BACKGROUNDS = ROOT / "tools" / "backgrounds" / "work"

STYL = ("STYLE: exactly the style of the reference images - a modern children's picture-book "
        "illustration, soft painterly shading with a fine paper-grain texture, warm friendly "
        "colours, thin soft outlines. NOT flat vector, NOT 3D render.")


def cover(lesson: Path) -> None:
    meta = json.loads((lesson / "lesson.json").read_text(encoding="utf-8"))
    chars = meta["characters"]
    scene = meta["backgrounds"][0]
    refs = [CHARACTERS / k / "postac.png" for k in chars] + [BACKGROUNDS / scene / "plyta.png"]
    for r in refs:
        if not r.exists():
            raise SystemExit(f"missing reference {r}")
    names = " and ".join(f"the {k}" for k in chars)
    prompt = (f"A SQUARE cover illustration for a children's lesson card. The characters are "
              f"{names} from the reference images - draw them exactly as in the references "
              f"(same design, same colours, same proportions), both standing close together in "
              f"the foreground, looking at the viewer, friendly. The setting is the place from the "
              f"last reference image (same colours, same mood), simplified. {meta['cover']} "
              f"{STYL} Square composition, the characters large and centred, no border, NO text, "
              f"NO letters, NO numbers.")
    WORK.mkdir(parents=True, exist_ok=True)
    raw = WORK / f"{lesson.name}.png"
    if not raw.exists():
        print(f"{lesson.name}: generating...", flush=True)
        figgen.generate(prompt, raw, refs=refs, size="1024x1024", quality="high", background="opaque")
    im = Image.open(raw).convert("RGB").resize((512, 512), Image.LANCZOS)
    im.save(lesson / "cover.webp", "WEBP", quality=82, method=6)
    print(f"{lesson.name}: cover.webp")


if __name__ == "__main__":
    wanted = sys.argv[1:]
    for p in sorted(LESSONS.iterdir()):
        if p.is_dir() and (p / "lesson.json").exists() and (not wanted or p.name in wanted):
            if not wanted and (p / "cover.webp").exists():
                continue
            cover(p)
