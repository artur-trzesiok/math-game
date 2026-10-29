// The place's music and the weather's sound (game/audio/muzyka, game/audio/pogoda; tools/audio/make_music.py):
// every scenery belongs to a theme, a theme has two ~150 s versions played in turn (no audible loop within a
// lesson); a change of place fades the old theme out and the new one in, the same theme plays on. The weather (the
// particles: rain, snow, leaves ...) loops quietly next to it. Both duck under speech and fall silent while a scene
// listens (counting claps, the rhythm). Plain <audio> elements, no WebAudio (the tablet); a missing file is silence.
import { v } from "./v.js";
import { naPierwszyDotyk } from "./odblokuj.js";

export const MOTYW = {
  laka: "laka", sad: "laka", ogrod: "laka", plac_zabaw: "laka", stacyjka: "laka", podium_wyscigu: "laka", turniej_klasy: "laka",ogrod_labirynt: "laka", polana_piknik: "laka", dab_babci: "las", dab_wiewiorki: "las",
  las: "las", droga_do_debu: "las", jesienny_sad: "las", malinowy_zagajnik: "las",
  strumyk: "woda", stacja_jezioro: "woda", tama_bobra: "woda",
  dom: "dom", pokoj: "dom", przedpokoj: "dom", nora: "dom", piekarnia: "dom", warsztat: "dom", lisia_nora: "dom",
  pokoj_noc: "noc", polana_wieczorem: "noc", polana_koncert: "noc", dab_noc: "noc", norka_burza: "dom",
  teatrzyk: "teatr",
};
const WERSJE = 2, GLOS_MUZ = 0.32, GLOS_POG = 0.45, POD_MOWA = 0.45, FADE = 1400;

class Kanal {
  constructor(wycisz = false) { this.a = null; this.cel = 0; this.vol = 0; this.wycisz = wycisz; }
  graj(src, { loop = false, onKoniec = null } = {}) {
    const a = new Audio(v(src)); a.loop = loop; a.volume = 0; a.preload = "auto"; a.muted = this.wycisz;   // ?cicho: everything runs, nothing is heard (tests)
    a.onended = () => onKoniec?.(); a.onerror = () => {};             // not made yet: silence
    a.play()?.catch(() => {});
    return a;
  }
}

export class Muzyka {
  constructor({ wycisz = false, sfx = null } = {}) {
    this.wycisz = wycisz; this.sfx = sfx;
    this.motyw = null; this.wersja = 0; this.muz = [];             // [{a, cel}] fading in and out
    this.pogodaNazwa = null; this.pog = [];
    this.cicho = 0;                                                  // >0: a scene listens
    this.wylaczona = false;
    naPierwszyDotyk(() => { for (const k of [...this.muz, ...this.pog]) if (k.a.paused && k.cel > 0) k.a.play()?.catch(() => {}); });
    this.t = setInterval(() => this._krok(), 50);
  }
  _krok() {
    const pod = this.sfx?.mowa ? POD_MOWA : 1, cisza = this.cicho > 0 || this.wylaczona ? 0 : 1;
    const krok = 50 / FADE;
    for (const lista of [this.muz, this.pog]) {
      const g = lista === this.muz ? GLOS_MUZ : GLOS_POG;
      for (const k of lista.slice()) {
        const cel = k.cel * pod * cisza;
        k.vol += Math.sign(cel - k.vol) * Math.min(Math.abs(cel - k.vol), krok);
        k.a.volume = Math.max(0, Math.min(1, k.vol * g));
        if (k.cel === 0 && k.vol <= 0.001) { k.a.pause(); lista.splice(lista.indexOf(k), 1); }
      }
    }
  }
  _wersja(motyw) {
    const k = { a: null, cel: 1, vol: 0 };
    let dalej = false;
    const nastepna = () => {                                         // the other version next, crossfaded over this one's tail
      if (dalej || this.motyw !== motyw) return; dalej = true;
      k.cel = 0; this.wersja = (this.wersja + 1) % WERSJE; this.muz.push(this._wersja(motyw));
    };
    k.a = new Kanal(this.wycisz).graj(`/game/audio/muzyka/${motyw}_${this.wersja + 1}.mp3`, { onKoniec: nastepna });
    k.a.ontimeupdate = () => { if (k.a.duration && k.a.duration - k.a.currentTime < 4) nastepna(); };   // the tracks end on a fade
    return k;
  }
  // a place: its name (a scenery) or an insert on a plain colour (an object) - the practice theme
  miejsce(nazwa) {
    if (this.zamkniety) return;
    const m = typeof nazwa === "object" ? "cwiczenia" : MOTYW[nazwa] || null;
    if (m === this.motyw) return;
    for (const k of this.muz) k.cel = 0;
    this.motyw = m;
    if (m) { this.wersja = Math.floor(Math.random() * WERSJE); this.muz.push(this._wersja(m)); }
  }
  pogoda(rodzaj) {
    if (this.zamkniety || rodzaj === this.pogodaNazwa) return;
    for (const k of this.pog) k.cel = 0;
    this.pogodaNazwa = rodzaj || null;
    if (rodzaj) this.pog.push({ a: new Kanal(this.wycisz).graj(`/game/audio/pogoda/${rodzaj}.mp3`, { loop: true }), cel: 1, vol: 0 });
  }
  // a scene that listens (counting claps, a rhythm): music and weather fade out until it is done
  async ucisz(p) { this.cicho++; try { return await p; } finally { this.cicho--; } }
  stop() { this.miejsce(null); this.pogoda(null); }
  // the lesson is over: fade everything out, then stop the clock (clearing it at once left the last place's music
  // playing under the menu's)
  zamknij() {
    this.stop(); this.zamkniety = true;                              // nothing starts after this (a late scenery change did)
    const koniec = setInterval(() => { if (!this.muz.length && !this.pog.length) { clearInterval(this.t); clearInterval(koniec); } }, 100);
    setTimeout(() => { for (const k of [...this.muz, ...this.pog]) k.a.pause(); this.muz = []; this.pog = []; clearInterval(this.t); clearInterval(koniec); }, FADE + 600);
  }
}
