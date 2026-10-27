// Spoken lines: an mp3 made by tools/audio/make_audio.py when there is one, the
// browser's speech synthesis otherwise. Either way the speaking puppet gets an
// amplitude every frame (mow()), so its mouth moves with the sound, and the player
// shows a subtitle only for synthesised lines (the children cannot read; the
// subtitle is for whoever is testing) or when ?napisy is set.

const PARAMS = new URLSearchParams(location.search);
export const FAST = PARAMS.has("szybko");
const FORCE_SUBS = PARAMS.has("napisy");
const LOCALE = { pl: "pl-PL", en: "en-US" };

let audioCtx = null, analyser = null, buf = null;
function attachAnalyser(audio) {
  try {
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
  if (!(k in manifests)) manifests[k] = await fetch(`/game/audio/${k}/manifest.json`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return manifests[k];
}

export class Speech {
  constructor(subtitleEl) { this.sub = subtitleEl; this.current = null; this.amp = 0; this.log = []; }

  // called every frame by the stage loop: feeds the mouth of whoever is speaking
  tick(now) {
    const c = this.current; if (!c) return;
    let a;
    if (c.live && analyser) { analyser.getByteTimeDomainData(buf); let s = 0; for (const v of buf) { const d = (v - 128) / 128; s += d * d; } a = Math.min(1, Math.sqrt(s / buf.length) * 6); }
    else a = 0.5 + 0.5 * Math.sin(now / 70);
    this.amp += (a - this.amp) * 0.35;
    if (c.puppet) c.puppet.mow(this.amp);
  }

  // say a line; resolves when it ends
  async say({ lang, lessonId, key, text, who, puppet }) {
    this.stop();
    this.log.push([key, who, performance.now() | 0]);
    const m = await manifest(lang, lessonId);
    const subtitle = (show) => { if (!this.sub) return; this.sub.textContent = show ? text : ""; this.sub.style.display = show ? "block" : "none"; };
    this.current = { puppet, live: false };
    try {
      if (FAST) { subtitle(FORCE_SUBS); await new Promise((r) => setTimeout(r, 400)); return; }
      if (m[key]) {
        const a = new Audio(`/game/audio/${lang}/${lessonId}/${key}.mp3`);
        this.current.live = attachAnalyser(a);
        subtitle(FORCE_SUBS);
        await new Promise((ok, bad) => {
          let timer = null;
          const end = () => { clearTimeout(timer); ok(); };
          const arm = () => { clearTimeout(timer); timer = setTimeout(end, ((a.duration || 10) - a.currentTime + 1.5) * 1000); };
          a.onloadedmetadata = arm; a.onplay = arm; a.onpause = () => clearTimeout(timer); a.onended = end;
          a.onerror = () => { clearTimeout(timer); bad(new Error("no file")); };
          const vis = () => { if (document.hidden) a.pause(); else a.play().catch(() => {}); };
          document.addEventListener("visibilitychange", vis);
          a.addEventListener("ended", () => document.removeEventListener("visibilitychange", vis));
          this.current.audio = a;
          a.play().catch(bad);
        });
        return;
      }
      subtitle(true);
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
      speechSynthesis.cancel(); speechSynthesis.speak(u);
      this.current.utterance = u;
    });
  }

  stop() {
    if (!this.current) return;
    if (this.current.audio) { try { this.current.audio.pause(); } catch (e) { /* ignore */ } }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (this.current.puppet) this.current.puppet.cicho();
    this.current = null;
  }
}
