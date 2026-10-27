"""Visemes: which mouth shape when, baked next to each recording (<key>.json "wiz": [[t, code], ...]).

The game used to open the mouth by loudness only. Polish spelling is nearly phonetic, so the text says which
sound comes - a, o, u, e, i, a closure on m/b/p, teeth on s/sz/cz - and only the timing is missing:

  from_timestamps   exact: ElevenLabs text-to-speech/with-timestamps returns when each character is spoken
                    (new recordings are made through it);
  align_local       for recordings that exist already (forced alignment needs a key permission ours lacks):
                    the text is split into phrases at punctuation, the audio into voiced runs at pauses (the
                    0.6 s sentence breaks are clear anchors), phrases are matched to runs, inside a run the
                    sounds are laid out by weight (a vowel is longer than a consonant) and every vowel snaps to
                    the nearest loudness peak - a syllable's nucleus.

Codes: X rest, M closed lips (m b p), A open (a), E (e ę), I spread (i y j), O round (o ą), U small round
(u ó w), S teeth (s z c ś ź ć sz ż rz cz dz dź dż), F lower lip (f), L other consonants. python visemes.py
"<text>" <mp3> prints the alignment.
"""
import re
import sys
from pathlib import Path

import numpy as np

DIGRAFY = ["dź", "dż", "dz", "sz", "cz", "rz", "ch"]
SAMOGLOSKI = {"a": "A", "ą": "O", "e": "E", "ę": "E", "i": "I", "y": "I", "o": "O", "ó": "U", "u": "U"}
SPOLGLOSKI = {"m": "M", "b": "M", "p": "M", "f": "F", "w": "U", "j": "I",
              **{k: "S" for k in ["s", "z", "c", "ś", "ź", "ć", "ż", "sz", "cz", "rz", "dz", "dź", "dż"]}}
WAGA = {"A": 1.0, "E": 1.0, "I": 0.9, "O": 1.0, "U": 0.95, "M": 0.55, "S": 0.7, "F": 0.6, "L": 0.5}
PRZERWA = 0.22       # s of silence that separates two voiced runs (sentence breaks are 0.6 s, commas ~0.3)


def glosky(slowo: str) -> list[str]:
    """Sounds of a word as viseme codes (Polish; English text gets a rough letter mapping, still better than none)."""
    s, out, i = slowo.lower(), [], 0
    while i < len(s):
        d = next((d for d in DIGRAFY if s.startswith(d, i)), None)
        if d:
            out.append(SPOLGLOSKI.get(d, "L")); i += len(d); continue
        ch = s[i]; i += 1
        if not ch.isalpha():
            continue
        out.append(SAMOGLOSKI.get(ch) or SPOLGLOSKI.get(ch, "L"))
    return out


def frazy(text: str) -> list[list[str]]:
    """The text as phrases (split at . , ! ? ; : and dashes), each a list of viseme codes."""
    text = re.sub(r"<[^>]+>", " ", text)
    out = []
    for f in re.split(r"[.,!?;:…–—]+", text):
        u = [g for w in f.split() for g in glosky(w)]
        if u:
            out.append(u)
    return out


def _glosnosc(x: np.ndarray, sr: int = 16000, krok: float = 0.01) -> np.ndarray:
    n = int(sr * krok)
    fr = x[: len(x) // n * n].reshape(-1, n)
    return np.sqrt((fr ** 2).mean(axis=1))


def _odcinki(rms: np.ndarray, krok: float = 0.01) -> list[tuple[float, float]]:
    """Voiced runs (start, end) in seconds: above 8% of the peak, gaps under PRZERWA bridged, specks dropped."""
    on = rms > 0.08 * (rms.max() or 1)
    runs, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]:
                j += 1
            runs.append([i, j]); i = j
        else:
            i += 1
    merged = []
    for r in runs:
        if merged and (r[0] - merged[-1][1]) * krok < PRZERWA:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return [(a * krok, b * krok) for a, b in merged if (b - a) * krok >= 0.06]


def align_local(x: np.ndarray, text: str, sr: int = 16000) -> list[list]:
    krok = 0.01
    rms = _glosnosc(x, sr, krok)
    seg = _odcinki(rms, krok)
    fr = frazy(text)
    if not seg or not fr:
        return [[0.0, "X"]]
    # match phrases to voiced runs: merge the closest runs or the lightest neighbouring phrases until counts agree
    seg = [list(s) for s in seg]
    while len(seg) > len(fr):
        k = min(range(len(seg) - 1), key=lambda i: seg[i + 1][0] - seg[i][1])
        seg[k] = [seg[k][0], seg[k + 1][1]]; del seg[k + 1]
    while len(fr) > len(seg):
        k = min(range(len(fr) - 1), key=lambda i: len(fr[i]) + len(fr[i + 1]))
        fr[k] = fr[k] + fr[k + 1]; del fr[k + 1]
    out = []
    for (t0, t1), units in zip(seg, fr):
        w = np.array([WAGA[u] for u in units]); edges = t0 + (t1 - t0) * np.concatenate([[0], np.cumsum(w)]) / w.sum()
        centres = (edges[:-1] + edges[1:]) / 2
        # vowels snap to the nearest loudness peak (a syllable's nucleus), within half a unit
        for i, u in enumerate(units):
            if u in "AEIOU":
                half = (edges[i + 1] - edges[i]) * 0.6
                a, b = int(max(t0, centres[i] - half) / krok), int(min(t1, centres[i] + half) / krok) + 1
                if b > a:
                    centres[i] = (a + int(np.argmax(rms[a:b]))) * krok + krok / 2
        centres = np.maximum.accumulate(centres)
        starts = np.concatenate([[t0], (centres[:-1] + centres[1:]) / 2])
        for s, u in zip(starts, units):
            out.append([round(float(s), 2), u])
        out.append([round(t1, 2), "X"])
    return _scal(out)


def from_timestamps(alignment: dict) -> list[list]:
    """ElevenLabs alignment {characters, character_start_times_seconds, character_end_times_seconds}
    (characters of the text sent, break tags included) -> visemes."""
    ch, st, en = alignment["characters"], alignment["character_start_times_seconds"], alignment["character_end_times_seconds"]
    text = "".join(ch)
    out, i, tag = [], 0, False
    while i < len(ch):
        c = ch[i]
        if c == "<": tag = True
        if tag:
            if c == ">": tag = False
            i += 1; continue
        d = next((d for d in DIGRAFY if text.lower().startswith(d, i)), None)
        if d:
            out.append([round(st[i], 2), SPOLGLOSKI.get(d, "L")]); i += len(d); continue
        if c.isalpha():
            out.append([round(st[i], 2), SAMOGLOSKI.get(c.lower()) or SPOLGLOSKI.get(c.lower(), "L")])
        elif c in " .,!?;:" and i and (i + 1 >= len(ch) or st[i + 1] - en[i] > 0.15 or c in ".!?"):
            out.append([round(en[i - 1] if i else st[i], 2), "X"])
        i += 1
    out.append([round(en[-1], 2), "X"])
    return _scal(out)


def _scal(w: list[list]) -> list[list]:
    """Merge repeats, drop shapes shorter than 40 ms (the mouth cannot show them, they would only flicker)."""
    w = sorted(w, key=lambda e: e[0])
    out = []
    for t, v in w:
        if out and out[-1][1] == v:
            continue
        if out and t - out[-1][0] < 0.04 and out[-1][1] != "X":
            out[-1][1] = v
            if len(out) > 1 and out[-2][1] == v:
                out.pop()
            continue
        out.append([t, v])
    return out


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent))
    import os
    os.environ.setdefault("ELEVENLABS_API_KEY", "x")
    import make_audio as ma
    print(align_local(ma.decode(Path(sys.argv[2])), sys.argv[1]))
