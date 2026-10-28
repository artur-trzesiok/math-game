"""Sound effects for the game, run through run.py so the key comes from .env:

  python tools/audio/run.py --sfx            # make what is missing or changed
  python tools/audio/run.py --sfx pop tap    # only these (remade)
  python tools/audio/run.py --sfx --synth    # force the built-in synthesis

Two backends: ElevenLabs sound generation from the text prompt below (needs the key's
`sound_generation` permission - ours lacks it today, 401), else SYNTHESIS: each effect is a
small numpy recipe (sines with pitch slides, filtered noise, bursts), so the set is repeatable
without any service. Output: game/audio/sfx/<name>.mp3 + manifest.json (hash of backend, recipe
version and settings). Each file is trimmed of leading silence (a UI sound must react at once)
and normalised to SFX_RMS_DB - well under the voices (-20), so effects never cover speech.
"""
import hashlib
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
import requests
from scipy import signal

sys.path.insert(0, str(Path(__file__).parent))
import make_audio as ma  # noqa: E402  (api key, decode, loudness helpers)

OUT = ma.ROOT / "game" / "audio" / "sfx"
SFX_RMS_DB = -27.0
SFX = {
    "pop":     ("a single soft cute bubble pop, a sticker appearing, children's game, clean, no music", 0.5),
    "tap":     ("one gentle soft wooden tap, a button pressed in a children's game, clean, short", 0.4),
    "wrong":   ("one soft friendly low cartoon boing, a gentle 'not this one', never harsh, children's game", 0.7),
    "right":   ("a short bright magical sparkle chime, a correct answer in a children's game, cheerful", 1.0),
    "pencil":  ("a pencil quickly drawing a line on paper, graphite scratching, close, no voices", 1.5),
    "hop":     ("a playful cartoon jump, a quick springy hop whoosh, children's animation", 0.5),
    "clap":    ("a few children clapping happily for a moment, short applause, no voices, no music", 2.0),
    "plop":    ("a piece of fruit dropped softly into a cardboard box, a soft plop, close", 0.5),
    "whoosh":  ("a soft light swoosh of something flying through the air, children's animation", 0.6),
    "idea":    ("a soft twinkle pop, a cartoon thought bubble appearing, magical and light", 0.7),
    "zoom":    ("a soft airy magical swish, a camera gently zooming in, children's animation", 0.7),
    "wonder":  ("a short curious cartoon 'hmm?' sound made by a soft rising slide whistle, no voice", 0.6),
    # the cards before a lesson and before each of its stages (player.js plansza)
    "plansza": ("a short cheerful magical jingle for the title card of a children's cartoon: a quick rising xylophone "
                "and glockenspiel flourish ending in a warm twinkling sparkle, bright, happy, no voices, no drums", 2.0),
    "melodyjka": ("a cheerful bouncy little marimba melody for a children's party game, loopable, 120 bpm, no voices", 4.0),
    "etap":    ("a short bright playful chime announcing the next part of a children's game: three rising "
                "glockenspiel notes and a little sparkle, warm and happy, no voices", 1.2),
}

SR = 44100
PETLE = {"melodyjka"}       # music loops (sfx.muzyka): written as WAV, gapless
WERSJA_SYNTEZY = 1


def _t(d):
    return np.arange(int(SR * d)) / SR


def _env(n, a=0.004, r=0.2):
    """Fast attack, exponential release (seconds)."""
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))


def _slide(f0, f1, d, curve=2.0):
    """A sine sliding from f0 to f1 (the phase integrated)."""
    t = _t(d)
    f = f0 + (f1 - f0) * (t / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def _band(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return signal.lfilter(b, a, x)


def _noise(d, rng):
    return rng.standard_normal(int(SR * d))


def _mix(*parts):
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


def _at(x, t0, total):
    out = np.zeros(int(SR * total))
    i = int(SR * t0)
    k = min(len(x), len(out) - i)
    out[i:i + k] += x[:k]
    return out


def synth(name: str) -> np.ndarray:
    rng = np.random.default_rng(int(hashlib.md5(name.encode()).hexdigest()[:8], 16))
    if name == "pop":
        x = _slide(900, 260, 0.09, 0.6) * _env(int(SR * 0.09), 0.002, 0.035)
        return _mix(x, 0.3 * _band(_noise(0.012, rng), 2000, 6000) * _env(int(SR * 0.012), 0.0005, 0.004))
    if name == "tap":
        return _mix(0.7 * _slide(220, 140, 0.06) * _env(int(SR * 0.06), 0.001, 0.02),
                    0.5 * _band(_noise(0.03, rng), 1500, 4000) * _env(int(SR * 0.03), 0.0005, 0.006))
    if name == "wrong":
        t = _t(0.45)
        f = (230 - 90 * (t / 0.45) ** 0.7) * (1 + 0.03 * np.sin(2 * np.pi * 9 * t))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(len(t), 0.01, 0.22) * (0.8 + 0.2 * np.sin(2 * np.pi * 2 * t))
    if name == "right":
        out = np.zeros(int(SR * 1.0))
        for k, f in enumerate((1046.5, 1318.5, 1568.0, 2093.0)):
            t = _t(0.8)
            tone = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2.76 * t)) * _env(len(t), 0.002, 0.25)
            out += _at(0.5 * tone, k * 0.06, 1.0)
        return out
    if name == "pencil":
        d = 1.5
        t = _t(d)
        n = _band(_noise(d, rng), 2500, 7000, 3)
        strokes = np.clip(np.sin(2 * np.pi * 7.5 * t + rng.uniform(0, 6)) * 0.8 + 0.5, 0, 1)
        grain = np.abs(signal.lfilter([1], [1, -0.995], rng.standard_normal(len(t)))) / 25
        return n * strokes * np.clip(0.6 + grain, 0, 1.5) * _env(len(t), 0.03, 4.0)
    if name == "hop":
        return _mix(_slide(280, 950, 0.17, 1.4) * _env(int(SR * 0.17), 0.003, 0.09),
                    0.25 * _band(_noise(0.2, rng), 800, 3000) * _env(int(SR * 0.2), 0.02, 0.06))
    if name == "clap":
        total = 1.8
        out = np.zeros(int(SR * total))
        for _ in range(34):
            t0 = rng.uniform(0, 1.45) ** 1.1
            amp = rng.uniform(0.4, 1.0) * (1 - t0 / 2)
            c = _band(_noise(0.04, rng), rng.uniform(900, 1300), rng.uniform(2200, 3200)) * _env(int(SR * 0.04), 0.0007, 0.009)
            out += _at(amp * c, t0, total)
        return out
    if name == "plop":
        return _mix(_slide(190, 90, 0.16, 0.7) * _env(int(SR * 0.16), 0.002, 0.06),
                    0.35 * _band(_noise(0.05, rng), 200, 900) * _env(int(SR * 0.05), 0.001, 0.02))
    if name == "whoosh":
        d = 0.55
        t = _t(d)
        n = _noise(d, rng)
        out = np.zeros_like(n)
        for i, lo in enumerate(np.linspace(400, 2200, 8)):           # a band sweeping up
            seg = slice(int(i * len(n) / 8), int((i + 1) * len(n) / 8))
            out[seg] = _band(n, lo, lo * 2.2)[seg]
        return out * np.sin(np.pi * t / d) ** 2
    if name == "idea":
        return _mix(0.6 * np.sin(2 * np.pi * 1568 * _t(0.5)) * _env(int(SR * 0.5), 0.003, 0.15),
                    _at(0.6 * np.sin(2 * np.pi * 2349 * _t(0.5)) * _env(int(SR * 0.5), 0.003, 0.2), 0.08, 0.7),
                    0.15 * _band(_noise(0.3, rng), 5000, 9000) * _env(int(SR * 0.3), 0.01, 0.08))
    if name == "zoom":
        d = 0.6
        t = _t(d)
        n = _band(_noise(d, rng), 300, 4000)
        return n * np.sin(np.pi * t / d) ** 3 * (0.5 + 0.5 * t / d) + 0.2 * _slide(300, 600, d) * np.sin(np.pi * t / d) ** 2
    if name == "wonder":
        t = _t(0.5)
        f = (380 + 330 * (t / 0.5) ** 1.5) * (1 + 0.025 * np.sin(2 * np.pi * 7 * t))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(len(t), 0.03, 0.3)
    if name == "melodyjka":
        # 8 beats at 120 bpm (4 s) that loop: a bouncy marimba tune over a soft bass, every note ends inside the bar
        total, beat = 4.0, 0.5
        out = np.zeros(int(SR * total))
        tune = [(0, 784.0), (0.5, 659.3), (1, 784.0), (1.5, 880.0), (2, 784.0), (2.25, 659.3), (2.5, 587.3), (3, 523.3),
                (4, 659.3), (4.5, 784.0), (5, 880.0), (5.5, 1046.5), (6, 880.0), (6.5, 784.0), (7, 659.3), (7.5, 587.3)]
        for b, f in tune:
            t = _t(0.42)
            ton = np.sin(2 * np.pi * f * t) * _env(len(t), 0.002, 0.16) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * _env(len(t), 0.001, 0.03)
            out += _at(0.5 * ton, b * beat, total)
        for b, f in [(0, 130.8), (2, 196.0), (4, 174.6), (6, 196.0)]:
            t = _t(0.9)
            out += _at(0.35 * np.sin(2 * np.pi * f * t) * _env(len(t), 0.01, 0.35), b * beat, total)
        fade = int(SR * 0.01); out[-fade:] *= np.linspace(1, 0, fade); out[:fade] *= np.linspace(0, 1, fade)
        return out
    if name in ("plansza", "etap"):
        # a marimba-like run (a fundamental and a fast-dying 4x partial) up the major chord, a shimmer on the last note
        nuty = (523.3, 659.3, 784.0, 1046.5, 1318.5) if name == "plansza" else (784.0, 1046.5, 1318.5)
        krok, total = (0.085, 2.0) if name == "plansza" else (0.11, 1.3)
        out = np.zeros(int(SR * total))
        for k, f in enumerate(nuty):
            t = _t(1.0)
            ton = np.sin(2 * np.pi * f * t) * _env(len(t), 0.002, 0.35) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * _env(len(t), 0.001, 0.05)
            ton += 0.18 * np.sin(2 * np.pi * f * 2.76 * t) * _env(len(t), 0.002, 0.25)       # the glockenspiel's bell
            out += _at(0.45 * ton, k * krok, total)
        t0 = len(nuty) * krok
        for j in range(9 if name == "plansza" else 5):                                   # the twinkle
            f = rng.uniform(2600, 4200)
            out += _at(0.12 * np.sin(2 * np.pi * f * _t(0.25)) * _env(int(SR * 0.25), 0.002, 0.08), t0 + j * 0.06, total)
        if name == "plansza":
            out += _at(0.2 * _band(_noise(0.5, rng), 600, 3000) * np.sin(np.pi * _t(0.5) / 0.5) ** 2, 0.0, total)   # a soft swoosh in
        return out
    raise KeyError(name)


def digest(name: str, backend: str) -> str:
    p, d = SFX[name]
    wersja = WERSJA_SYNTEZY if backend == "synth" else ""
    return hashlib.sha1(f"{backend}|{wersja}|{p}|{d}|{SFX_RMS_DB}".encode()).hexdigest()[:12]


def _encode(src: Path, dst: Path) -> None:
    """Trim leading silence, normalise the loudness of the sound itself, limit the peaks."""
    gain = max(-30.0, min(30.0, SFX_RMS_DB - ma.speech_rms_db(ma.decode(src))))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af",
                    f"silenceremove=start_periods=1:start_threshold=-45dB,volume={gain:.2f}dB,alimiter=limit=0.9",
                    "-codec:a", "libmp3lame", "-b:a", "128k", str(dst)], check=True)


def generate_synth(name: str, dst: Path) -> None:
    x = synth(name)
    x = x / (np.abs(x).max() or 1) * 0.9
    if name in PETLE:                                         # a loop stays WAV, exact length, no trimming
        x *= 10 ** ((SFX_RMS_DB + 4 - 20 * np.log10(np.sqrt(np.mean(x ** 2)) or 1e-9)) / 20)
        with wave.open(str(dst.with_suffix(".wav")), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
        return
    wav = dst.with_suffix(".tmp.wav")
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())
    _encode(wav, dst)
    wav.unlink()


class BrakUprawnien(Exception):
    pass


def generate_elevenlabs(name: str, dst: Path) -> None:
    prompt, dur = SFX[name]
    r = requests.post(f"{ma.API}/sound-generation", headers={"xi-api-key": ma.api_key(), "accept": "audio/mpeg"},
                      json={"text": prompt, "duration_seconds": dur, "prompt_influence": 0.6}, timeout=120)
    if r.status_code == 401 and "sound_generation" in r.text:
        raise BrakUprawnien()
    if r.status_code != 200:
        raise RuntimeError(f"{name}: HTTP {r.status_code} {r.text[:200]}")
    raw = dst.with_suffix(".raw.mp3")
    raw.write_bytes(r.content)
    _encode(raw, dst)
    raw.unlink()


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    mf = OUT / "manifest.json"
    manifest = json.loads(mf.read_text(encoding="utf-8")) if mf.exists() else {}
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    backend = "synth" if "--synth" in sys.argv else "elevenlabs"
    done = failed = 0
    for name in (only or SFX):
        dst = OUT / f"{name}.{'wav' if name in PETLE else 'mp3'}"
        if not only and dst.exists() and manifest.get(name) in (digest(name, "synth"), digest(name, "elevenlabs")):
            continue
        try:
            if backend == "elevenlabs" and name not in PETLE:        # a loop is always synthesised (exact length)
                try:
                    generate_elevenlabs(name, dst)
                except BrakUprawnien:
                    print("  the key lacks the sound_generation permission: synthesising instead")
                    backend = "synth"
            if backend == "synth" or name in PETLE:
                generate_synth(name, dst)
            manifest[name] = digest(name, backend)
            done += 1
            print(f"  {name:8s} ok, {backend} ({dst.stat().st_size // 1024} kB)")
        except Exception as e:  # keep going, report at the end
            failed += 1
            print(f"  {name:8s} FAILED {e}")
        mf.write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print(f"sfx: {done} made, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
