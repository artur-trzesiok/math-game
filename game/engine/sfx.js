import { v } from "./v.js";
import { naPierwszyDotyk } from "./odblokuj.js";
// Sound effects (game/audio/sfx/*.mp3, made by tools/audio/make_sfx.py): plain <audio> elements, no
// WebAudio (the tablet), a small pool per effect so they can overlap, a gap so a burst of identical
// events is one sound, and ducking under speech so an effect never covers what a character says.

const NAZWY = ["pop", "tap", "wrong", "right", "pencil", "hop", "clap", "plop", "whoosh", "idea", "zoom", "wonder", "plansza", "etap", "melodyjka"];
const PETLE = new Set(["melodyjka"]);    // music loops: WAV (an mp3 has a gap where it loops)
const GLOSNOSC = { pop: 0.55, tap: 0.6, wrong: 0.7, right: 0.7, pencil: 0.45, hop: 0.6, clap: 0.55, plop: 0.6, whoosh: 0.5, idea: 0.7, zoom: 0.5, wonder: 0.6, plansza: 0.85, etap: 0.8 };
const ODSTEP = 0.06;                     // s: the same effect again within this is dropped (five stickers popping in = a ripple, not a blast)

export class Sfx {
  constructor({ wycisz = false } = {}) {
    this.wycisz = wycisz;
    this.glos = 1;                         // master
    this.mowa = false;                     // set by the speech while a line plays: effects duck
    this.pule = {}; this.ostatnio = {};
    for (const n of NAZWY) this.pule[n] = [];
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
    this.ostatnio[n] = t;
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
  wczytaj() { for (const n of NAZWY) this._audio(n); }      // warm the pool so the first pop is on time
}
