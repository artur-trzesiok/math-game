import { v } from "./v.js";
import { naPierwszyDotyk, CISZA, poprosODotyk } from "./odblokuj.js";
// Spoken lines: an mp3 made by tools/audio/make_audio.py when there is one, the
// browser's speech synthesis otherwise. The speaking puppet gets an amplitude every
// frame (mow()), so its mouth moves with the sound. The amplitude comes from the
// BAKED envelope next to the mp3 (<key>.json, RMS every 20 ms, normalised - made by
// the pipeline, identical on every device, no WebAudio needed); only when that file
// is missing does a live WebAudio analyser stand in, and for synthesised lines a
// fake rhythm. Subtitles only with ?napisy (testing).

const PARAMS = new URLSearchParams(location.search);
export const FAST = PARAMS.has("szybko");
const FORCE_SUBS = PARAMS.has("napisy");
const CICHO = PARAMS.has("cicho");          // tests: everything plays (timing, lip-sync) but nothing is heard
const LOCALE = { pl: "pl-PL", en: "en-US" };

// one element for every line, started inside the first tap (iPad: a new element per line was refused)
const GLOS = new Audio();
naPierwszyDotyk(() => { if (GLOS.src) return; GLOS.src = CISZA; const p = GLOS.play(); if (p) p.then(() => { if (GLOS.src === CISZA) GLOS.pause(); }).catch(() => {}); });   // a line already waiting: its own play button starts it

let audioCtx = null, analyser = null, buf = null, podpiety = false;
function attachAnalyser(audio) {
  if (podpiety) return !!analyser;
  try {
    podpiety = true;
    if (!audioCtx) {
      audioCtx = new AudioContext(); analyser = audioCtx.createAnalyser(); analyser.fftSize = 256;
      analyser.connect(audioCtx.destination); buf = new Uint8Array(analyser.fftSize);
    }
    audioCtx.createMediaElementSource(audio).connect(analyser);
    if (audioCtx.state === "suspended") audioCtx.resume();
    return true;
  } catch (e) { return false; }
}

const voices = {};
function pickVoice(lang) {
  if (!("speechSynthesis" in window)) return null;
  const all = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang));
  voices[lang] = all.find((v) => /female|kobieta|paulina|zofia|samantha|zira|aria/i.test(v.name)) || all[0] || null;
}
if ("speechSynthesis" in window) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => Object.keys(LOCALE).forEach(pickVoice); }

const manifests = {};
async function manifest(lang, lessonId) {
  const k = `${lang}/${lessonId}`;
  if (!(k in manifests)) manifests[k] = await fetch(v(`/game/audio/${k}/manifest.json`), { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return manifests[k];
}

export class Speech {
  constructor(subtitleEl) { this.sub = subtitleEl; this.current = null; this.amp = 0; this.log = []; }

  // called every frame by the stage loop: feeds the mouth of whoever is speaking
  tick(now) {
    const c = this.current; if (!c) return;
    let a;
    if (c.envelope && c.audio) {                                           // baked: look the loudness up by playback time
      const env = c.envelope, i = Math.floor(c.audio.currentTime / env.step);
      a = c.audio.paused || c.audio.ended ? 0 : (env.amp[Math.min(i, env.amp.length - 1)] ?? 0);
    } else if (c.live && analyser) {
      analyser.getByteTimeDomainData(buf); let s = 0; for (const v of buf) { const d = (v - 128) / 128; s += d * d; }
      const rms = Math.sqrt(s / buf.length);
      // normalise against the recording's own running peak, so a quiet file still opens the mouth fully
      c.peak = Math.max((c.peak || 0) * 0.996, rms);
      a = Math.min(1, rms / Math.max(c.peak, 0.02));
    }
    else a = 0.5 + 0.5 * Math.sin(now / 70);
    this.amp += (a - this.amp) * (c.envelope ? 0.6 : 0.45);
    // the baked visemes: the mouth shape of the sound being spoken, looked up by playback time (a hair early,
    // as the eye expects the mouth to lead the sound)
    let wiz = null;
    const W = c.envelope?.wiz;
    if (W && c.audio && !c.audio.paused) {
      const t = c.audio.currentTime + 0.04;
      let lo = 0, hi = W.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (W[mid][0] <= t) lo = mid; else hi = mid - 1; }
      wiz = W[lo][0] <= t ? W[lo][1] : "X";
    }
    if (c.puppet) c.puppet.mow(this.amp, wiz);
  }

  // say a line; resolves when it ends
  async say({ lang, lessonId, key, fallback = null, text, who, puppet, volume = 1 }) {
    this.stop();
    this.log.push([fallback || key, who, performance.now() | 0]);
    const m = await manifest(lang, lessonId);
    if (!m[key] && fallback && m[fallback]) { console.warn(`no recording of ${fallback} for ${who}; add "${who}" to its speakers`); key = fallback; }
    const subtitle = (show) => { if (!this.sub) return; this.sub.textContent = show ? text : ""; this.sub.style.display = show ? "block" : "none"; };
    this.current = { puppet, live: false };
    try {
      if (FAST) { subtitle(FORCE_SUBS); await new Promise((r) => setTimeout(r, 400)); return; }
      if (m[key]) {
        const a = GLOS; a.onloadedmetadata = a.onplay = a.onpause = a.onended = a.onerror = null;
        a.src = v(`/game/audio/${lang}/${lessonId}/${key}.mp3`);
        a.volume = Math.max(0, Math.min(1, volume));                      // the character's trim (recordings are normalised already)
        a.muted = CICHO;
        this.current.envelope = await fetch(v(`/game/audio/${lang}/${lessonId}/${key}.json`), { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
        if (!this.current.envelope) this.current.live = attachAnalyser(a);
        subtitle(FORCE_SUBS);
        await new Promise((ok, bad) => {
          let timer = null;
          const end = () => { clearTimeout(timer); document.removeEventListener("visibilitychange", vis); ok(); };
          const arm = () => { clearTimeout(timer); timer = setTimeout(end, ((a.duration || 10) - a.currentTime + 1.5) * 1000); };
          a.onloadedmetadata = arm; a.onplay = arm; a.onpause = () => clearTimeout(timer); a.onended = end;
          this.current.koniec = end;                                     // stop() ends the line too
          a.onerror = () => { clearTimeout(timer); bad(new Error("no file")); };
          const vis = () => { if (document.hidden) a.pause(); else a.play().catch(() => {}); };
          document.addEventListener("visibilitychange", vis);
          this.current.audio = a;
          // still refused (no tap yet): a play button, and the line goes on from that tap - never a broken scene
          a.play().catch((e) => { if (e?.name === "NotAllowedError") poprosODotyk(() => a.play().catch(() => end())); else bad(e); });
        });
        return;
      }
      subtitle(FORCE_SUBS);
      await this.synth(text, lang, who);
    } finally {
      subtitle(false);
      if (puppet) puppet.cicho();
      this.current = null;
    }
  }

  synth(text, lang, who) {
    return new Promise((ok) => {
      if (!("speechSynthesis" in window)) return setTimeout(ok, 800 + text.length * 60);
      if (!voices[lang]) pickVoice(lang);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LOCALE[lang] || lang; if (voices[lang]) u.voice = voices[lang];
      u.rate = 0.92; u.pitch = { lisek: 1.2, wiewiorka: 1.35, sowa: 0.9, sarenka: 1.1, narrator: 1.0 }[who] ?? 1;
      const guard = setTimeout(ok, 1500 + text.length * 90);
      u.onend = u.onerror = () => { clearTimeout(guard); ok(); };
      if (CICHO) u.volume = 0;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
      this.current.utterance = u;
    });
  }

  // pause / resume the line being spoken (the HUD's pause button)
  pause() { const a = this.current?.audio; if (a) { this.wstrzymany = true; a.pause(); } if ("speechSynthesis" in window) speechSynthesis.pause(); }
  resume() { const a = this.current?.audio; if (a && this.wstrzymany) { this.wstrzymany = false; a.play().catch(() => {}); } if ("speechSynthesis" in window) speechSynthesis.resume(); }
  stop() {
    if (!this.current) return;
    if (this.current.audio) { try { this.current.audio.pause(); } catch (e) { /* ignore */ } }
    const koniec = this.current.koniec;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (this.current.puppet) this.current.puppet.cicho();
    this.current = null;
    if (koniec) koniec();
  }
}
