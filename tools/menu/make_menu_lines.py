"""The menu's spoken lines (game/menu/i18n): for every stage after the first, what Fox says when a child taps it while it
is locked (which stage to finish first) and when it opens. Made from lessons/index.json, so a renamed or new topic
gets its lines; then `python tools/audio/run.py menu` records them.

  python tools/menu/make_menu_lines.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
# the stages are numbered: Fox names the one to finish and the one that opens by its ordinal
_J = ["pierwszy", "drugi", "trzeci", "czwarty", "piąty", "szósty", "siódmy", "ósmy", "dziewiąty"]
_JD = ["pierwszego", "drugiego", "trzeciego", "czwartego", "piątego", "szóstego", "siódmego", "ósmego", "dziewiątego"]
_N = ["dziesiąty", "jedenasty", "dwunasty", "trzynasty", "czternasty", "piętnasty", "szesnasty", "siedemnasty", "osiemnasty", "dziewiętnasty"]
_ND = ["dziesiątego", "jedenastego", "dwunastego", "trzynastego", "czternastego", "piętnastego", "szesnastego", "siedemnastego", "osiemnastego", "dziewiętnastego"]
_EN = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth",
       "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth"]
PORZ = {"pl": _J + _N + ["dwudziesty"] + [f"dwudziesty {x}" for x in _J[:4]],
        "pl_d": _JD + _ND + ["dwudziestego"] + [f"dwudziestego {x}" for x in _JD[:4]],
        "en": _EN + [f"twenty-{x}" for x in _EN[:4]]}
# the world map (engine/mapa.js): Fox tapped on the map (one at random), a locked stop tapped
OBROC = {"pl": "Obróć tablet bokiem, wtedy zaczynamy!", "en": "Turn your tablet sideways, then we can start!"}
MAPA = {
    "pl": (["To ja! Tu teraz jesteśmy.", "Hop, hop! Idziemy dalej ścieżką!", "Pokaż mi, dokąd chcesz iść!",
            "Ale ta mapa jest piękna! Ciekawe, co czeka na następnej polance."],
           ["Tu jeszcze nie dojdziemy. Najpierw skończmy przygody przed nami!",
            "Ta polanka jest jeszcze zamknięta. Idziemy po kolei, krok po kroku!"]),
    "en": (["It's me! This is where we are now.", "Hop, hop! Let's go on along the path!", "Show me where you want to go!",
            "What a lovely map! I wonder what waits at the next clearing."],
           ["We can't go there yet. Let's finish the adventures before it first!",
            "This clearing is still locked. We go one by one, step by step!"]),
}
# the cheer that opens a stage's lines, in turn (one "Hura!" every time was too much); the stage's end uses them shifted,
# so its cheer and the next stage's opening never begin alike
OKRZYK = {"pl": ["Hura!", "Gratulacje!", "Brawo!", "Świetnie!", "Znakomicie!"],
          "en": ["Hooray!", "Congratulations!", "Bravo!", "Great!", "Excellent!"]}
OTWARCIE = {
    "pl": ["{o} Odblokowaliśmy {nr} etap naszej podróży! Nowe przygody czekają!",
           "{o} {Nr} etap stoi przed nami otworem. Ruszamy dalej!",
           "{o} Otworzyliśmy {nr} etap naszej podróży. Zobaczmy, co w nim czeka!",
           "{o} Przed nami {nr} etap. Nowe przygody już czekają!",
           "{o} {Nr} etap jest otwarty. Idziemy dalej!"],
    "en": ["{o} We've unlocked the {nr} stage of our journey! New adventures are waiting!",
           "{o} The {nr} stage is open for us. Let's go on!",
           "{o} We opened the {nr} stage of our journey. Let's see what waits in it!",
           "{o} The {nr} stage is ahead of us. New adventures are waiting!",
           "{o} The {nr} stage is open. Let's go on!"],
}
TEKST = {
    "pl": ("Ta droga jest jeszcze zamknięta. Najpierw skończmy wszystkie przygody z {poprz_d} etapu, a kłódka sama się otworzy!",
           "Hura! Odblokowaliśmy {nr} etap naszej podróży! Nowe przygody czekają!"),
    "pl_koniec": ("{o} Ukończyliśmy cały {nr} etap! Na pamiątkę tej wspólnej wędrówki przyklej w albumie jego naklejkę.",
                  "To pamiątka z {nr_d} etapu. Wszystkie jego przygody przeszliśmy razem."),
    "en_koniec": ("{o} We finished the whole {nr} stage! As a keepsake of our journey, stick its sticker in your album.",
                  "This is a keepsake of the {nr} stage. We went through all its adventures together."),
    "en": ("This way is still locked. Let's first finish all the adventures of the {poprz} stage, and the padlock will open by itself!",
           "Hooray! We've unlocked the {nr} stage of our journey! New adventures are waiting!"),
}
def tytul(l, lang):
    """A lesson's name read out over its card: the title, a longer breath, the subtitle ("Lekki i ciężki. Tratwa Bobra.")."""
    t = l["title"][lang].strip()
    t += "" if t[-1] in ".?!" else "."
    pod = (l.get("subtitle") or {}).get(lang, "").strip()
    if not pod:
        return {"who": "narrator", "text": t}
    return {"who": "narrator", "text": f"{t} {pod[0].upper()}{pod[1:]}.", "pauza": "1.0s"}


# where the gate leads, in the form the sentence needs (Polish genitive after "do")
DOKAD = {"pl": {"swiat2": "Wioski nad Jeziorem", "swiat3": "Zimowych Gór", "swiat4": "Zamku na Wzgórzu"},
         "en": {"swiat2": "the Lakeside Village", "swiat3": "the Snowy Mountains", "swiat4": "the Castle on the Hill"}}
# a closed gate tapped: which land waits behind it and which one to finish first (its genitive)
SKAD = {"pl": {"swiat1": "Leśnej Krainy", "swiat2": "Wioski nad Jeziorem", "swiat3": "Zimowych Gór"},
        "en": {"swiat1": "the Forest Land", "swiat2": "the Lakeside Village", "swiat3": "the Snowy Mountains"}}
ZA_BRAMA = {"pl": "Za tą bramą czeka {kraina}! Brama otworzy się, gdy przejdziemy wszystkie etapy {skad}.",
            "en": "{kraina} is waiting behind this gate! It will open when we finish all the stages of {skad}."}
BRAMA = {"pl": "Brama do {dokad} stoi otworem! Ruszamy w drogę!",
         "en": "The gate to {dokad} is wide open! Off we go!"}


ix = json.loads((ROOT / "game" / "lessons" / "index.json").read_text(encoding="utf-8"))
topics = [t for t in ix.get("topics", []) if t.get("title")]
for lang in ("pl", "en"):
    zamk, otw = TEKST[lang]
    brawo, opis = TEKST[f"{lang}_koniec"]
    out = {}
    for k, t in enumerate(topics):                              # finishing a stage: Fox's cheer, the album's narrator
        nr_d = PORZ["pl_d" if lang == "pl" else "en"][k]
        out[f"line.etap_koniec_{t['id']}"] = {"who": "lisek", "text": brawo.format(o=OKRZYK[lang][(k + 2) % 5], nr=PORZ[lang][k])}
        out[f"line.naklejka_opis_{t['id']}"] = {"who": "narrator", "text": opis.format(nr_d=nr_d, nr=PORZ[lang][k])}
    for k, t in enumerate(topics[1:], start=1):
        pd = PORZ["pl_d" if lang == "pl" else "en"][k - 1]
        out[f"line.zamkniete_{t['id']}"] = {"who": "lisek", "text": zamk.format(poprz_d=pd, poprz=pd)}
        nr, n = PORZ[lang][k], (k - 1) % 5
        out[f"line.otwarte_{t['id']}"] = {"who": "lisek", "text": OTWARCIE[lang][n].format(o=OKRZYK[lang][n], nr=nr, Nr=nr[0].upper() + nr[1:])}
    for sw in ix.get("swiaty", [])[1:]:                         # the gate to a land opens (player.js swietujOtwarcie)
        out[f"line.brama_{sw['id']}"] = {"who": "lisek", "text": BRAMA[lang].format(dokad=DOKAD[lang][sw["id"]])}
    swiaty = ix.get("swiaty", [])
    for poprz, sw in zip(swiaty, swiaty[1:]):
        out[f"line.brama_zamknieta_{sw['id']}"] = {"who": "lisek", "text": ZA_BRAMA[lang].format(kraina=sw["title"][lang], skad=SKAD[lang][poprz["id"]])}
    for sw in ix.get("swiaty", []):                             # a land tapped in the switcher: its name read out
        out[f"line.swiat_{sw['id']}"] = {"who": "narrator", "text": sw["title"][lang]}
    for l in ix.get("lessons", []):                             # a lesson chosen: its name read out over its card
        if not l.get("wkrotce"): out[f"line.tytul_{l['id']}"] = tytul(l, lang)
    lisek, klodka = MAPA[lang]
    for k, t in enumerate(lisek, 1): out[f"line.mapa_lisek_{k}"] = {"who": "lisek", "text": t}
    for k, t in enumerate(klodka, 1): out[f"line.mapa_klodka_{k}"] = {"who": "lisek", "text": t}
    out["line.obroc"] = {"who": "narrator", "text": OBROC[lang]}    # the card asking to turn a tablet held upright
    d = ROOT / "game" / "menu" / "i18n"; d.mkdir(parents=True, exist_ok=True)
    (d / f"{lang}.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(lang, len(out), "lines")
