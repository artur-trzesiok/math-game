"""The menu's spoken lines (game/menu/i18n): for every stage after the first, what Fox says when a child taps it while it
is locked (which stage to finish first) and when it opens. Made from lessons/index.json, so a renamed or new topic
gets its lines; then `python tools/audio/run.py menu` records them.

  python tools/menu/make_menu_lines.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
# the stages are numbered: Fox names the one to finish and the one that opens by its ordinal
PORZ = {"pl": ["pierwszy", "drugi", "trzeci", "czwarty", "piąty", "szósty", "siódmy", "ósmy"],
        "pl_d": ["pierwszego", "drugiego", "trzeciego", "czwartego", "piątego", "szóstego", "siódmego", "ósmego"],
        "en": ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"]}
TEKST = {
    "pl": ("Ta droga jest jeszcze zamknięta. Najpierw skończmy wszystkie przygody z {poprz_d} etapu, a kłódka sama się otworzy!",
           "Hurra! Otworzył się {nr} etap. Nowe przygody czekają!"),
    "pl_koniec": ("Brawo! Ukończyliśmy cały {nr} etap! Za to dostajesz specjalną naklejkę do albumu.",
                  "To nagroda za ukończenie {nr_d} etapu. Wszystkie jego przygody przeszliśmy razem."),
    "en_koniec": ("Bravo! We finished the whole {nr} stage! Here is a special sticker for your album.",
                  "This is the prize for finishing the {nr} stage. We went through all its adventures together."),
    "en": ("This way is still locked. Let's first finish all the adventures of the {poprz} stage, and the padlock will open by itself!",
           "Hooray! The {nr} stage is open. New adventures are waiting!"),
}
ix = json.loads((ROOT / "game" / "lessons" / "index.json").read_text(encoding="utf-8"))
topics = [t for t in ix.get("topics", []) if t.get("title")]
for lang in ("pl", "en"):
    zamk, otw = TEKST[lang]
    brawo, opis = TEKST[f"{lang}_koniec"]
    out = {}
    for k, t in enumerate(topics):                              # finishing a stage: Fox's cheer, the album's narrator
        nr_d = PORZ["pl_d" if lang == "pl" else "en"][k]
        out[f"line.etap_koniec_{t['id']}"] = {"who": "lisek", "text": brawo.format(nr=PORZ[lang][k])}
        out[f"line.naklejka_opis_{t['id']}"] = {"who": "narrator", "text": opis.format(nr_d=nr_d, nr=PORZ[lang][k])}
    for k, t in enumerate(topics[1:], start=1):
        pd = PORZ["pl_d" if lang == "pl" else "en"][k - 1]
        out[f"line.zamkniete_{t['id']}"] = {"who": "lisek", "text": zamk.format(poprz_d=pd, poprz=pd)}
        out[f"line.otwarte_{t['id']}"] = {"who": "lisek", "text": otw.format(nr=PORZ[lang][k])}
    d = ROOT / "game" / "menu" / "i18n"; d.mkdir(parents=True, exist_ok=True)
    (d / f"{lang}.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(lang, len(out), "lines")
