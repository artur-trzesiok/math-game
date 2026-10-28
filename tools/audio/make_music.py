"""Background music for the places and loops for the weather, all from ElevenLabs.

  python tools/audio/run.py --music            # make what is missing or changed (manifest by prompt hash)
  python tools/audio/run.py --music las dom    # only these themes / weather loops (remade)
(through run.py: it takes the key from the repository's .env - a stale ELEVENLABS_API_KEY sits in the user's env)

Music: ELEVENLABS Music (/v1/music), two versions of every theme, ~150 s each - the stage plays them in turn, so
nothing loops audibly within a lesson (a 30 s loop got tiring). Weather: sound generation, ~20 s loops (`loop`),
played next to the place's music. Output: game/audio/muzyka/<motyw>_<n>.mp3, game/audio/pogoda/<rodzaj>.mp3;
game/engine/muzyka.js maps each scenery to a theme. Loudness normalised so the stage can set plain levels.
"""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_audio as ma  # noqa: E402

MUZ = ma.ROOT / "game" / "audio" / "muzyka"
POG = ma.ROOT / "game" / "audio" / "pogoda"
DLUGOSC_MS = 150_000
WSPOLNE = ("instrumental background music for a calm picture-book maths game for small children, soft and gentle, "
           "quiet enough to sit under speech, no vocals, no sudden loud parts, no drums solo, warm acoustic sound")
MOTYWY = {
    "laka": ("a sunny meadow and orchard in summer: ukulele, soft flute and glockenspiel, light shaker, "
             "carefree and bright, medium-slow tempo", "a warm sunny afternoon in a garden: acoustic guitar picking, "
             "soft clarinet melody, gentle pizzicato strings, happy and relaxed"),
    "las": ("a friendly sunlit forest: soft harp, wooden flute and light marimba, a little mysterious but cosy, "
            "slow tempo", "a walk through a green forest: gentle celesta, soft strings and recorder, curious and calm"),
    "woda": ("a brook and a pond on a summer day: flowing harp arpeggios, soft vibraphone, light woodwinds, "
             "calm like moving water", "by the water: gentle kalimba and soft strings, a slow rocking rhythm, peaceful"),
    "dom": ("a cosy home, a warm kitchen and a children's room: soft piano, gentle music box and warm cello, "
            "homely and tender", "inside a cosy wooden house: light acoustic guitar, soft accordion and celesta, "
            "friendly and warm"),
    "noc": ("a quiet starry evening, almost bedtime: a slow lullaby on soft piano and music box with warm pads, "
            "dreamy and calm", "a peaceful night with fireflies: soft harp and celesta over gentle strings, slow, sleepy"),
    "teatr": ("a little puppet show in the evening: a playful old-time waltz on soft accordion, pizzicato strings "
              "and toy piano, curious and charming", "a cosy shadow theatre: gentle glockenspiel and clarinet in a "
              "slow waltz, warm and a little magical"),
    "menu": ("the main menu of a picture-book maths game: ukulele and glockenspiel with soft pizzicato strings and a "
             "light shaker, a sunny meadow mood, calm and friendly, steady medium-slow tempo",
             "the main menu of a picture-book maths game: soft acoustic guitar and celesta with gentle woodwinds and a "
             "light shaker, warm and welcoming, steady medium-slow tempo"),
    "cwiczenia": ("a light focused practice moment for small children: soft marimba and gentle pizzicato, a steady "
                  "calm pulse, cheerful but quiet, easy to think over", "a calm playful puzzle time: soft vibraphone "
                  "and kalimba, light and simple, gentle steady rhythm"),
}
POGODA = {
    "deszcz": "gentle steady rain falling on grass and leaves, soft and calm, no thunder, seamless loop",
    "snieg": "a quiet snowy day, a very soft cold wind, faint and peaceful, seamless loop",
    "liscie": "a light autumn breeze rustling dry leaves in the trees, soft, seamless loop",
    "swietliki": "a calm summer night, soft crickets chirping far away, very quiet, seamless loop",
    "pylek": "a sunny summer meadow, soft distant bees humming and birds far away, calm, seamless loop",
    "piorka": "a soft gentle breeze in the open air, light and airy, seamless loop",
    "babelki": "soft underwater bubbles rising slowly, gentle and calm, seamless loop",
}
MUZ_DB, POG_DB = -26.0, -30.0                # music sits low; the weather lower still


def _hash(*parts) -> str:
    return hashlib.sha1("|".join(map(str, parts)).encode()).hexdigest()[:12]


def _srednia_db(src: Path) -> float:
    """The mean loudness of the whole file (a speech-frame measure misread steady noise: the rain came out 15 dB loud)."""
    import re
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"mean_volume: (-?[0-9.]+) dB", out).group(1))


def _norm(src: Path, dst: Path, db: float) -> None:
    gain = max(-30.0, min(30.0, db - _srednia_db(src)))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", f"volume={gain:.2f}dB,alimiter=limit=0.9",
                    "-codec:a", "libmp3lame", "-b:a", "128k", str(dst)], check=True)


def muzyka(prompt: str, dst: Path) -> None:
    r = requests.post(f"{ma.API}/music", headers={"xi-api-key": ma.api_key(), "accept": "audio/mpeg"},
                      json={"prompt": f"{prompt}. {WSPOLNE}", "music_length_ms": DLUGOSC_MS, "model_id": "music_v1"}, timeout=600)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code} {r.text[:200]}")
    raw = dst.with_suffix(".raw.mp3"); raw.write_bytes(r.content); _norm(raw, dst, MUZ_DB); raw.unlink()


def pogoda(prompt: str, dst: Path) -> None:
    body = {"text": prompt, "duration_seconds": 20, "prompt_influence": 0.5, "loop": True}
    r = requests.post(f"{ma.API}/sound-generation", headers={"xi-api-key": ma.api_key(), "accept": "audio/mpeg"}, json=body, timeout=180)
    if r.status_code == 422:                                       # an older model without `loop`
        body.pop("loop"); r = requests.post(f"{ma.API}/sound-generation", headers={"xi-api-key": ma.api_key(), "accept": "audio/mpeg"}, json=body, timeout=180)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code} {r.text[:200]}")
    raw = dst.with_suffix(".raw.mp3"); raw.write_bytes(r.content); _norm(raw, dst, POG_DB); raw.unlink()


def main() -> int:
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    MUZ.mkdir(parents=True, exist_ok=True); POG.mkdir(parents=True, exist_ok=True)
    mf = MUZ / "manifest.json"; man = json.loads(mf.read_text(encoding="utf-8")) if mf.exists() else {}
    zadania = [(f"{m}_{i + 1}", MUZ / f"{m}_{i + 1}.mp3", p, muzyka, _hash(p, WSPOLNE, DLUGOSC_MS)) for m, ps in MOTYWY.items() for i, p in enumerate(ps) if not only or m in only]
    zadania += [(f"pogoda_{n}", POG / f"{n}.mp3", p, pogoda, _hash(p, 20)) for n, p in POGODA.items() if not only or n in only]
    zle = 0
    for klucz, dst, prompt, f, h in zadania:
        if dst.exists() and man.get(klucz) == h and not only:
            continue
        try:
            f(prompt, dst); man[klucz] = h; print(f"  {klucz:18s} ok ({dst.stat().st_size // 1024} kB)")
        except Exception as e:                                     # noqa: BLE001
            zle += 1; print(f"  {klucz:18s} FAILED: {e}")
        mf.write_text(json.dumps(man, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"music: {len(zadania) - zle} ok, {zle} failed")
    return 1 if zle else 0


if __name__ == "__main__":
    sys.exit(main())
