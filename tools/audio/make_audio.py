"""Narration for the lessons: every spoken line -> game/audio/<lang>/<lesson>/<key>.mp3

  python tools/audio/make_audio.py                 # every lesson, every language, missing/changed lines only
  python tools/audio/make_audio.py bigger_smaller  # one lesson
  python tools/audio/make_audio.py --voices        # list the account's voices and exit

Source of truth: game/lessons/<lesson>/i18n/<lang>.json. A line is an entry whose
key starts with "line." and whose value is {"who": "<speaker>", "text": "..."}
(plain strings are UI labels and are not spoken). The speaker maps to a voice in
VOICES[lang]. The manifest next to the mp3s remembers the text and speaker each
file was made from, so editing one line regenerates one file.

ElevenLabs, model from ELEVENLABS_MODEL_ID (default eleven_multilingual_v2). The key
comes from ELEVENLABS_API_KEY and is never printed; `tools/audio/run.py` loads it from
the repository's .env.

The game falls back to the browser's speech synthesis for lines that have no mp3,
so the pipeline can run late; subtitles are shown only for such lines.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent.parent
LESSONS = ROOT / "game" / "lessons"
AUDIO = ROOT / "game" / "audio"
API = "https://api.elevenlabs.io/v1"
MODEL = os.environ.get("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")
FORMAT = os.environ.get("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128")
LANGS = ("pl", "en")

# Voices from the account (tools/audio/run.py --voices lists them): a distinct one per
# character and language; there is no narrator.
VOICES = {
    "pl": {"lisek": "6NJSmKqvyC5gS4qslstw",      # Patryk - young, narrative
           "sowa": "NacdHGUYR1k3M0FAbAia",       # Hanna - calm and encouraging
           "wiewiorka": "EdXKgqQHVOTjwJdLxQiw",  # Natalia - sweet, soothing
           "sarenka": "ZrIglAg8qumzXuvlNzWL"},   # Weronika - warm, natural
    "en": {"lisek": "TX3LPaxmHKxFdv7VOQHJ",      # Liam - energetic
           "sowa": "Xb7hH8MSUJpSbSDYk0k2",       # Alice - clear educator
           "wiewiorka": "cgSgspJ2msm6clMCkdW9",  # Jessica - playful, bright
           "sarenka": "pFZP5JQG7iQjIQuC4Bku"},   # Lily - velvety
}
SETTINGS = {"stability": 0.55, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True}


def api_key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not k:
        raise SystemExit("ELEVENLABS_API_KEY is not set")
    return k


def lines(lesson: Path, lang: str) -> list[dict]:
    f = lesson / "i18n" / f"{lang}.json"
    if not f.exists():
        return []
    data = json.loads(f.read_text(encoding="utf-8"))
    return [{"key": k, "who": v.get("who", "narrator"), "text": v["text"]}
            for k, v in data.items() if k.startswith("line.") and isinstance(v, dict) and v.get("text")]


def synthesize(text: str, voice: str, dst: Path) -> None:
    r = requests.post(f"{API}/text-to-speech/{voice}",
                      headers={"xi-api-key": api_key(), "accept": "audio/mpeg"},
                      params={"output_format": FORMAT},
                      json={"text": text, "model_id": MODEL, "voice_settings": SETTINGS}, timeout=120)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
    dst.write_bytes(r.content)


def run(lesson: Path, lang: str) -> tuple[int, int, int]:
    out = AUDIO / lang / lesson.name
    out.mkdir(parents=True, exist_ok=True)
    manifest_p = out / "manifest.json"
    manifest = json.loads(manifest_p.read_text(encoding="utf-8")) if manifest_p.exists() else {}
    done = skipped = failed = 0
    for l in lines(lesson, lang):
        digest = hashlib.sha1((l["who"] + "|" + l["text"]).encode("utf-8")).hexdigest()[:12]
        dst = out / f"{l['key']}.mp3"
        if dst.exists() and manifest.get(l["key"], {}).get("hash") == digest:
            skipped += 1
            continue
        voice = VOICES[lang].get(l["who"]) or next(iter(VOICES[lang].values()))
        try:
            synthesize(l["text"], voice, dst)
            manifest[l["key"]] = {"hash": digest, "who": l["who"], "text": l["text"]}
            manifest_p.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
            done += 1
            print(f"  {lang} {lesson.name} {l['key']:28s} {l['who']:10s} {len(l['text']):4d} chars  ok")
            time.sleep(0.3)
        except Exception as e:  # noqa: BLE001
            failed += 1
            print(f"  {lang} {lesson.name} {l['key']:28s} FAILED: {e}")
            if "401" in str(e):
                raise SystemExit("key rejected")
    return done, skipped, failed


def main() -> int:
    if "--voices" in sys.argv:
        r = requests.get(f"{API}/voices", headers={"xi-api-key": api_key()}, timeout=30)
        if r.status_code != 200:
            print(f"HTTP {r.status_code}: {r.text[:200]}")
        for v in r.json().get("voices", []):
            lab = v.get("labels", {})
            print(f"  {v['voice_id']}  {v['name']:<16} {lab.get('gender', '?'):<7} {lab.get('age', '?'):<11} {lab.get('accent', '?')}")
        return 0
    wanted = [a for a in sys.argv[1:] if not a.startswith("--")]
    lessons = [p for p in sorted(LESSONS.iterdir()) if p.is_dir() and (p / "lesson.json").exists() and (not wanted or p.name in wanted)]
    total = [0, 0, 0]
    for lesson in lessons:
        for lang in LANGS:
            d, s, f = run(lesson, lang)
            total[0] += d; total[1] += s; total[2] += f
    print(f"done {total[0]}, skipped {total[1]}, failed {total[2]}")
    return 1 if total[2] else 0


if __name__ == "__main__":
    raise SystemExit(main())
