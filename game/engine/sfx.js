import { v } from "./v.js";
import { naPierwszyDotyk } from "./odblokuj.js";
// Sound effects (game/audio/sfx/*.mp3, made by tools/audio/make_sfx.py): decoded once into Web Audio buffers and played
// as one-shot sources - on an iPad every <audio> play (pause, rewind, play) cost the main thread, and a child's burst of
// taps made the game stutter; <audio> also ignores `volume` there. The old element pool stays as the fallback (no Web
// Audio, a buffer not decoded yet). A gap so a burst of identical events is one sound, ducking under speech.

const NAZWY = ["pop", "tap", "wrong", "right", "pencil", "hop", "clap", "plop", "whoosh", "idea", "zoom", "wonder", "plansza", "etap", "melodyjka", "beben", "beben_maly", "dzwonek", "garnek", "kubek", "falsz", "klask", "koniec", "szklo_1", "szklo_2", "szklo_3", "szklo_4", "hu_1", "hu_2", "hu_3", "chor_sowiatek", "chor_falsz"];
const PETLE = new Set(["melodyjka"]);    // music loops: WAV (an mp3 has a gap where it loops)
const GLOSNOSC = { pop: 0.55, tap: 0.6, wrong: 0.7, right: 0.7, pencil: 0.45, hop: 0.6, clap: 0.55, plop: 0.6, whoosh: 0.5, idea: 0.7, zoom: 0.5, wonder: 0.6, plansza: 0.85, etap: 0.8, beben: 0.9, beben_maly: 0.85, dzwonek: 0.8, garnek: 0.85, kubek: 0.85, falsz: 0.7, klask: 0.8, szklo_1: 0.8, szklo_2: 0.8, szklo_3: 0.8, szklo_4: 0.8, hu_1: 0.8, hu_2: 0.8, hu_3: 0.8, chor_sowiatek: 0.9, chor_falsz: 0.9 };
const ODSTEP = 0.06;                     // s: the same effect again within this is dropped (five stickers popping in = a ripple, not a blast)

export class Sfx {
  constructor({ wycisz = false } = {}) {
    this.wycisz = wycisz;
    this.glos = 1;                         // master
    this.mowa = false;                     // set by the speech while a line plays: effects duck
    this.pule = {}; this.ostatnio = {}; this.bufory = {}; this.grajace = {}; this.ile = 0;
    for (const n of NAZWY) this.pule[n] = [];
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !wycisz) {
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch { /* iOS 17+: play past the silent switch like <audio> */ }
      try { this.ctx = new AC(); } catch { this.ctx = null; }
      naPierwszyDotyk(() => { if (this.ctx?.state === "suspended") this.ctx.resume().catch(() => {}); });   // a context starts only inside a tap
    }
    // iPad: an element plays only once started inside a tap - start two of each, muted, in the first one
    naPierwszyDotyk(() => { for (const n of NAZWY) for (let i = 0; i < 2; i++) { const a = this._audio(n, true); a.muted = true; const p = a.play(); if (p) p.then(() => { a.pause(); a.muted = false; }).catch(() => { a.muted = false; }); } });
  }
  _audio(n, nowy = false) {
    const pula = this.pule[n];
    let a = nowy ? null : pula.find((x) => x.paused || x.ended);
    if (!a && pula.length < 4) { a = new Audio(v(`/game/audio/sfx/${n}.${PETLE.has(n) ? "wav" : "mp3"}`)); a.preload = "auto"; pula.push(a); }
    return a || pula[0];
  }
  // play an effect; `glosnosc` scales its own level, `dlugosc` (s) cuts it with a short fade (the pencil drawing a line)
  graj(n, { glosnosc = 1, dlugosc = null, tempo = 1 } = {}) {
    if (this.wycisz || !this.pule[n]) return;
    const t = performance.now() / 1000;
    if (t - (this.ostatnio[n] || -1) < ODSTEP) return;
    this.ostatnio[n] = t; this.ile++;
    const v0 = Math.max(0, Math.min(1, (GLOSNOSC[n] ?? 0.6) * glosnosc * this.glos * (this.mowa ? 0.55 : 1)));
    const buf = this.bufory[n];
    if (buf && this.ctx && this.ctx.state === "running") {
      try {
        const gr = (this.grajace[n] ||= []);
        while (gr.length >= 4) { try { gr.shift().stop(); } catch { /* ended */ } }   // at most four of one effect at once
        const src = this.ctx.createBufferSource(), g = this.ctx.createGain(), t0 = this.ctx.currentTime;
        src.buffer = buf; src.playbackRate.value = tempo; g.gain.value = v0;
        src.connect(g).connect(this.ctx.destination); src.start();          // started before a stop may be scheduled
        if (dlugosc) { const k = t0 + Math.max(0.05, dlugosc - 0.15); g.gain.setValueAtTime(v0, k); g.gain.linearRampToValueAtTime(0, k + 0.15); src.stop(k + 0.16); }
        gr.push(src); src.onended = () => { const i = gr.indexOf(src); if (i >= 0) gr.splice(i, 1); };
        return;
      } catch { /* fall back to the element */ }
    }
    const a = this._audio(n);
    try {
      a.pause(); a.currentTime = 0; a.playbackRate = tempo;
      const v = Math.max(0, Math.min(1, (GLOSNOSC[n] ?? 0.6) * glosnosc * this.glos * (this.mowa ? 0.55 : 1)));
      a.volume = v;
      const p = a.play(); if (p) p.catch(() => {});
      if (dlugosc) {
        clearTimeout(a._stop);
        a._stop = setTimeout(() => {
          let k = 0; const krok = () => { k++; a.volume = v * Math.max(0, 1 - k / 6); if (k < 6) setTimeout(krok, 25); else a.pause(); };
          krok();
        }, Math.max(0, dlugosc * 1000 - 150));
      }
    } catch { /* an effect must never break the game */ }
  }
  // a music loop: plays until stop(), ducked under speech
  muzyka(n, { glosnosc = 0.55 } = {}) {
    if (this.wycisz || !this.pule[n]) return { stop() {} };
    const a = this._audio(n); a.loop = true; a.currentTime = 0;
    const baza = Math.max(0, Math.min(1, glosnosc * this.glos));
    a.volume = baza; const p = a.play(); if (p) p.catch(() => {});
    const duck = setInterval(() => { a.volume = baza * (this.mowa ? 0.35 : 1); }, 120);
    return { stop: (ms = 250) => { clearInterval(duck); let k = 0; const krok = () => { k++; a.volume = baza * Math.max(0, 1 - k / 6); if (k < 6) setTimeout(krok, ms / 6); else { a.pause(); a.loop = false; } }; krok(); } };
  }
  // decode every effect once (a few MB of samples); the element pool is warmed too, for the fallback
  wczytaj() {
    for (const n of NAZWY) this._audio(n);
    if (!this.ctx) return;
    for (const n of NAZWY) {
      fetch(v(`/game/audio/sfx/${n}.${PETLE.has(n) ? "wav" : "mp3"}`)).then((r) => r.arrayBuffer())
        .then((b) => new Promise((ok, bad) => this.ctx.decodeAudioData(b, ok, bad))).then((buf) => { this.bufory[n] = buf; }).catch(() => {});
    }
  }
}
