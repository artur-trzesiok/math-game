"""Narration for the lessons: every spoken line -> game/audio/<lang>/<lesson>/<key>.mp3

  python tools/audio/make_audio.py                 # every lesson, every language, missing/changed lines only
  python tools/audio/make_audio.py bigger_smaller  # one lesson
  python tools/audio/make_audio.py --voices        # list the account's voices and exit
  python tools/audio/make_audio.py --bake          # (re)compute the lip-sync envelopes of every mp3

Next to every mp3 a <key>.json holds the baked lip-sync envelope (RMS every 20 ms,
normalised); the game drives the mouth from it and needs no WebAudio.

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
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
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
    # lisek: a child-like voice; "Thomas Martin - Upbeat" (0Wf1qAPYadufJQRrU48G, young, high-pitched)
    # is the target once it is added to the account (the key cannot add voices; use the web UI)
    "pl": {"lisek": "2nnOurMrHn7IFbLfsAKx",      # chosen by the user for the fox
           "sowa": "5lDyCSjSKjtI6WDIPTVj",       # Tata Czyta - calm, clear storyteller
           "wiewiorka": "XXphLKNRxvJ1Qa95KBhX",  # chosen by the user for the squirrel
           "sarenka": "3U1eLgixPqHuRDH10Wyb"},   # added to the account by the user for the deer
    "en": {"lisek": "TX3LPaxmHKxFdv7VOQHJ",      # Liam - energetic
           "sowa": "Xb7hH8MSUJpSbSDYk0k2",       # Alice - clear educator
           "wiewiorka": "cgSgspJ2msm6clMCkdW9",  # Jessica - playful, bright
           "sarenka": "pFZP5JQG7iQjIQuC4Bku"},   # Lily - velvety
}
SPEED = float(os.environ.get("ELEVENLABS_SPEED", "0.85"))     # children: slower than the default 1.0 (range 0.7-1.2)
SETTINGS = {"stability": 0.6, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True, "speed": SPEED}


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


ENV_STEP = 0.02      # seconds per envelope sample


def envelope(mp3: Path) -> dict:
    """Baked lip-sync: RMS loudness every ENV_STEP seconds, normalised to the file's
    peak and rounded to two decimals. Decoded with FFmpeg to 16 kHz mono PCM."""
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
    n = int(16000 * ENV_STEP)
    frames = x[: len(x) // n * n].reshape(-1, n)
    rms = np.sqrt((frames ** 2).mean(axis=1))
    peak = float(rms.max()) if len(rms) else 1.0
    amp = np.clip(rms / max(peak, 1e-4), 0, 1) ** 0.6          # gamma: speech peaks are rare, open the mouth sooner
    return {"step": ENV_STEP, "duration": round(len(x) / 16000, 3), "amp": [round(float(a), 2) for a in amp]}


def bake(dst: Path) -> None:
    dst.with_suffix(".json").write_text(json.dumps(envelope(dst), separators=(",", ":")), encoding="utf-8")


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
        voice = VOICES[lang].get(l["who"]) or next(iter(VOICES[lang].values()))
        digest = hashlib.sha1((l["who"] + "|" + voice + "|" + MODEL + "|" + json.dumps(SETTINGS, sort_keys=True) + "|" + l["text"]).encode("utf-8")).hexdigest()[:12]   # a voice or settings change regenerates too
        dst = out / f"{l['key']}.mp3"
        if dst.exists() and manifest.get(l["key"], {}).get("hash") == digest:
            if not dst.with_suffix(".json").exists():
                bake(dst)
            skipped += 1
            continue
        try:
            synthesize(l["text"], voice, dst)
            bake(dst)
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
    if "--bake" in sys.argv:
        n = 0
        for mp3 in AUDIO.glob("*/*/*.mp3"):
            bake(mp3); n += 1
        print(f"baked {n} envelopes")
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
