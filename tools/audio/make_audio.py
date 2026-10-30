"""Narration for the lessons: every spoken line -> game/audio/<lang>/<lesson>/<key>.mp3

  python tools/audio/make_audio.py                 # every lesson, every language, missing/changed lines only
  python tools/audio/make_audio.py bigger_smaller  # one lesson
  python tools/audio/make_audio.py --voices        # list the account's voices and exit
  python tools/audio/make_audio.py --bake          # (re)compute the lip-sync envelopes of every mp3
  python tools/audio/make_audio.py --normalize     # bring every mp3 to its speaker's loudness and re-bake
  python tools/audio/make_audio.py --normalize zajac   # only that speaker's recordings (gain only, no re-bake)

Loudness: every recording is normalised to the same speech loudness (-20 dBFS RMS
of the voiced frames, peaks limited), so no voice shouts over another. A character's
calibration lives in game/assets/characters/<who>/meta.json ("volume", 1.0 = -20 dBFS,
1.1 = 10% louder) and is baked into its recordings here - a browser cannot play
louder than 1 - together with the ElevenLabs voice per language ("voices").

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
           "sarenka": "3U1eLgixPqHuRDH10Wyb",    # added to the account by the user for the deer
           "narrator": "5lDyCSjSKjtI6WDIPTVj"},  # Tata Czyta: the album tells where each sticker came from
    "en": {"lisek": "TX3LPaxmHKxFdv7VOQHJ",      # Liam - energetic
           "sowa": "Xb7hH8MSUJpSbSDYk0k2",       # Alice - clear educator
           "wiewiorka": "cgSgspJ2msm6clMCkdW9",  # Jessica - playful, bright
           "sarenka": "pFZP5JQG7iQjIQuC4Bku",    # Lily - velvety
           "narrator": "Xb7hH8MSUJpSbSDYk0k2"},  # Alice - clear educator
}
SPEED = float(os.environ.get("ELEVENLABS_SPEED", "0.85"))     # children: slower than the default 1.0 (range 0.7-1.2)
SETTINGS = {"stability": 0.6, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True, "speed": SPEED}
PAUSE = os.environ.get("ELEVENLABS_PAUSE", "0.6s")          # a break after every sentence, so a child can take it in


def with_pauses(text: str) -> str:
    """Insert an ElevenLabs break tag after every sentence end; the i18n text stays clean. Not before a one-word
    sentence after a longer one ("Which one is bigger? Point."): alone after a break it came out garbled."""
    import re
    zdania = re.split(r"(?<=[.!?])\s+", text.strip())
    out = zdania[0]
    for poprz, z in zip(zdania, zdania[1:]):              # counting ("One. Two. Three.") keeps its breaks
        out += (" " if len(z.split()) == 1 and len(poprz.split()) >= 3 else f' <break time="{PAUSE}" /> ') + z
    return out


def api_key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not k:
        raise SystemExit("ELEVENLABS_API_KEY is not set")
    return k


def lines(lesson: Path, lang: str) -> list[dict]:
    """One entry per (line, speaker): the default speaker (`who`) records as <key>.mp3,
    every other speaker listed in `speakers` as <key>.<who>.mp3 - so a scene may give
    the same line to whichever character it likes among those."""
    f = lesson / "i18n" / f"{lang}.json"
    if not f.exists():
        return []
    data = json.loads(f.read_text(encoding="utf-8"))
    out = []
    for k, v in data.items():
        if not (k.startswith("line.") and isinstance(v, dict) and v.get("text")):
            continue
        default = v.get("who", "narrator")
        for who in dict.fromkeys([default, *v.get("speakers", [])]):
            out.append({"key": k if who == default else f"{k}.{who}", "who": who, "text": v["text"]})
    return out


ENV_STEP = 0.02      # seconds per envelope sample
TARGET_RMS_DB = -20.0   # every recording is normalised to this speech loudness (RMS of voiced frames)
CHARACTERS = ROOT / "game" / "assets" / "characters"


def voice_for(lang: str, who: str) -> str:
    """The character's meta.json (game/assets/characters/<who>/meta.json: voices per language,
    volume) wins over the VOICES defaults here."""
    meta = CHARACTERS / who / "meta.json"
    if meta.exists():
        v = json.loads(meta.read_text(encoding="utf-8")).get("voices", {}).get(lang)
        if v:
            return v
    return VOICES[lang].get(who) or next(iter(VOICES[lang].values()))


def glosnosc(who: str | None) -> float:
    """The speaker's calibration from meta.json (1.0 = TARGET_RMS_DB)."""
    meta = CHARACTERS / str(who) / "meta.json"
    return float(json.loads(meta.read_text(encoding="utf-8")).get("volume", 1.0)) if who and meta.exists() else 1.0


def decode(mp3: Path) -> np.ndarray:
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0


def speech_rms_db(x: np.ndarray) -> float:
    n = 320
    fr = x[: len(x) // n * n].reshape(-1, n)
    rms = np.sqrt((fr ** 2).mean(axis=1)); rms = rms[rms > 0.01]            # voiced frames only, pauses do not count
    return float(20 * np.log10(rms.mean())) if len(rms) else -60.0


def normalize(mp3: Path, who: str | None = None) -> float:
    """Re-encode the mp3 with the gain that brings its speech loudness to TARGET_RMS_DB times the
    speaker's calibration (a limiter keeps the peaks under -0.5 dBFS). Returns the gain applied in dB."""
    cel = TARGET_RMS_DB + 20 * np.log10(glosnosc(who))
    gain = max(-12.0, min(12.0, cel - speech_rms_db(decode(mp3))))
    if abs(gain) < 0.5:
        return 0.0
    tmp = mp3.with_suffix(".tmp.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-af", f"volume={gain:.2f}dB,alimiter=limit=0.94:attack=3:release=40",
                    "-codec:a", "libmp3lame", "-b:a", "128k", str(tmp)], check=True)
    tmp.replace(mp3)
    return gain


def envelope(mp3: Path) -> dict:
    """Baked lip-sync: RMS loudness every ENV_STEP seconds, normalised to the file's
    peak and rounded to two decimals. Decoded with FFmpeg to 16 kHz mono PCM."""
    x = decode(mp3)
    n = int(16000 * ENV_STEP)
    frames = x[: len(x) // n * n].reshape(-1, n)
    rms = np.sqrt((frames ** 2).mean(axis=1))
    peak = float(rms.max()) if len(rms) else 1.0
    amp = np.clip(rms / max(peak, 1e-4), 0, 1) ** 0.6          # gamma: speech peaks are rare, open the mouth sooner
    return {"step": ENV_STEP, "duration": round(len(x) / 16000, 3), "amp": [round(float(a), 2) for a in amp]}


def slowa(alignment: dict) -> list[list]:
    """When each word starts, [[t, "word"], ...] (lowercase letters only; the <break> tags skipped) - a row of
    things can bump in step with a line that names them (rytm.js)."""
    out, slowo, t0, w_tagu = [], "", 0.0, False
    for ch, st in zip(alignment["characters"], alignment["character_start_times_seconds"]):
        if ch == "<": w_tagu = True
        if w_tagu:
            if ch == ">": w_tagu = False
            ch = " "
        if ch.isalpha():
            if not slowo: t0 = st
            slowo += ch.lower()
        elif slowo:
            out.append([round(t0, 3), slowo]); slowo = ""
    if slowo: out.append([round(t0, 3), slowo])
    return out


def bake(dst: Path, text: str | None = None, wiz: list | None = None, slowa_: list | None = None) -> None:
    """The envelope plus the visemes ("wiz", see visemes.py): exact ones from the synthesis timestamps when
    given, else aligned locally from the text (read from the manifest when not given)."""
    import visemes
    e = envelope(dst)
    if wiz is None:
        if text is None:
            mf = dst.parent / "manifest.json"
            text = (json.loads(mf.read_text(encoding="utf-8")).get(dst.stem, {}) if mf.exists() else {}).get("text")
        if text:
            wiz = visemes.align_local(decode(dst), text)
    if wiz:
        e["wiz"] = wiz
    if slowa_ is None and dst.with_suffix(".json").exists():       # a rebake keeps the words' times (only synthesis knows them)
        slowa_ = json.loads(dst.with_suffix(".json").read_text(encoding="utf-8")).get("slowa")
    if slowa_:
        e["slowa"] = slowa_
    dst.with_suffix(".json").write_text(json.dumps(e, separators=(",", ":")), encoding="utf-8")


def synthesize(text: str, voice: str, dst: Path) -> tuple[list | None, list | None]:
    """Speech with character timestamps: returns the visemes of the recording (exact lip-sync) and its words' times."""
    import base64
    import visemes
    r = requests.post(f"{API}/text-to-speech/{voice}/with-timestamps",
                      headers={"xi-api-key": api_key(), "accept": "application/json"},
                      params={"output_format": FORMAT},
                      json={"text": with_pauses(text), "model_id": MODEL, "voice_settings": SETTINGS}, timeout=120)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
    d = r.json()
    dst.write_bytes(base64.b64decode(d["audio_base64"]))
    al = d.get("alignment") or d.get("normalized_alignment")
    return (visemes.from_timestamps(al), slowa(al)) if al else (None, None)


def run(lesson: Path, lang: str) -> tuple[int, int, int]:
    out = AUDIO / lang / lesson.name
    out.mkdir(parents=True, exist_ok=True)
    manifest_p = out / "manifest.json"
    manifest = json.loads(manifest_p.read_text(encoding="utf-8")) if manifest_p.exists() else {}
    done = skipped = failed = 0
    for l in lines(lesson, lang):
        voice = voice_for(lang, l["who"])
        digest = hashlib.sha1((l["who"] + "|" + voice + "|" + MODEL + "|" + json.dumps(SETTINGS, sort_keys=True) + "|" + PAUSE + "|" + l["text"]).encode("utf-8")).hexdigest()[:12]   # a voice, settings or pause change regenerates too
        dst = out / f"{l['key']}.mp3"
        if dst.exists() and manifest.get(l["key"], {}).get("hash") == digest:
            if not dst.with_suffix(".json").exists():
                bake(dst, l["text"])
            skipped += 1
            continue
        try:
            wiz, sl = synthesize(l["text"], voice, dst)
            normalize(dst, l["who"])                              # gain only: the timing stays
            bake(dst, l["text"], wiz, sl)
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
    # prune recordings of lines that no longer exist
    live = {l["key"] for l in lines(lesson, lang)}
    for f in list(out.glob("line.*.mp3")) + list(out.glob("line.*.json")):
        if f.stem not in live:
            f.unlink(); manifest.pop(f.stem, None); print(f"  {lang} {lesson.name} {f.name:32s} removed (no such line)")
    manifest_p.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
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
    if "--normalize" in sys.argv:
        tylko = [a for a in sys.argv[1:] if not a.startswith("--")]    # speakers: gain only, the baked visemes stay
        n = 0
        for mp3 in AUDIO.glob("*/*/*.mp3"):
            mf = mp3.parent / "manifest.json"
            who = json.loads(mf.read_text(encoding="utf-8")).get(mp3.stem, {}).get("who") if mf.exists() else None
            if tylko and who not in tylko:
                continue
            g = normalize(mp3, who); n += 1
            if not tylko:
                bake(mp3)
            print(f"  {mp3.parent.parent.name} {mp3.parent.name} {mp3.name:32s} {g:+.1f} dB")
        print(f"normalised {n} recordings")
        return 0
    if "--visemes" in sys.argv:                                # (re)align the visemes of every recording locally
        n = 0
        for mp3 in AUDIO.glob("*/*/line.*.mp3"):
            bake(mp3); n += 1
        print(f"visemes baked for {n} recordings")
        return 0
    if "--bake" in sys.argv:
        n = 0
        for mp3 in AUDIO.glob("*/*/*.mp3"):
            bake(mp3); n += 1
        print(f"baked {n} envelopes")
        return 0
    wanted = [a for a in sys.argv[1:] if not a.startswith("--")]
    lessons = [p for p in sorted(LESSONS.iterdir()) if p.is_dir() and (p / "lesson.json").exists() and (not wanted or p.name in wanted)]
    album = LESSONS.parent / "album"                            # the sticker album's narrator (game/album/i18n) -> audio/<lang>/album
    if (album / "i18n").exists() and (not wanted or "album" in wanted): lessons.append(album)
    menu = LESSONS.parent / "menu"                              # Fox in the menu: a locked topic, a topic opening -> audio/<lang>/menu
    if (menu / "i18n").exists() and (not wanted or "menu" in wanted): lessons.append(menu)
    zachety = LESSONS.parent / "zachety"                        # encouragements when a child waits, every voice -> audio/<lang>/zachety
    if (zachety / "i18n").exists() and (not wanted or "zachety" in wanted): lessons.append(zachety)
    oddechy = LESSONS.parent / "oddechy"                        # the breathers' own lines (rock-paper-scissors, peekaboo), every voice
    if (oddechy / "i18n").exists() and (not wanted or "oddechy" in wanted): lessons.append(oddechy)
    pochwaly = LESSONS.parent / "pochwaly"                      # praise and gentle wrong variants, every voice -> audio/<lang>/pochwaly
    if (pochwaly / "i18n").exists() and (not wanted or "pochwaly" in wanted): lessons.append(pochwaly)
    etapy = LESSONS.parent / "etapy"                          # the narrator on the stage cards ("here comes the story!") -> audio/<lang>/etapy
    if (etapy / "i18n").exists() and (not wanted or "etapy" in wanted): lessons.append(etapy)
    total = [0, 0, 0]
    for lesson in lessons:
        for lang in LANGS:
            d, s, f = run(lesson, lang)
            total[0] += d; total[1] += s; total[2] += f
    print(f"done {total[0]}, skipped {total[1]}, failed {total[2]}")
    return 1 if total[2] else 0


if __name__ == "__main__":
    raise SystemExit(main())
