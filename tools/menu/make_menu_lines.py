"""The menu's spoken lines (game/menu/i18n): for every topic after the first, what Fox says when a child taps it while it
is locked (which topic to finish first) and when it opens. Made from lessons/index.json, so a renamed or new topic
gets its lines; then `python tools/audio/run.py menu` records them.

  python tools/menu/make_menu_lines.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEKST = {
    "pl": ("Ta droga jest jeszcze zamknięta. Najpierw skończmy wszystkie przygody z działu {poprz}, a kłódka sama się otworzy!",
           "Hurra! Otworzyła się nowa droga: {nazwa}!"),
    "en": ("This way is still locked. Let's first finish all the adventures in {poprz}, and the padlock will open by itself!",
           "Hooray! A new way has opened: {nazwa}!"),
}
ix = json.loads((ROOT / "game" / "lessons" / "index.json").read_text(encoding="utf-8"))
topics = [t for t in ix.get("topics", []) if t.get("title")]
for lang, (zamk, otw) in TEKST.items():
    out = {}
    for poprz, t in zip(topics, topics[1:]):
        out[f"line.zamkniete_{t['id']}"] = {"who": "lisek", "text": zamk.format(poprz=poprz["title"][lang])}
        out[f"line.otwarte_{t['id']}"] = {"who": "lisek", "text": otw.format(nazwa=t["title"][lang])}
    d = ROOT / "game" / "menu" / "i18n"; d.mkdir(parents=True, exist_ok=True)
    (d / f"{lang}.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(lang, len(out), "lines")
