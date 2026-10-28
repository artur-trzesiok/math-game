// Master player: lists the lessons, picks the language, runs a lesson's three
// stages (story, practice, apply) scene by scene. A lesson is a plug-in module
// (game/lessons/<id>/lesson.js) that follows the contract in guidelines.md; the
// player gives every scene a context object and never looks inside the lesson.
//
// URL: ?lekcja=<id>&etap=story|practice|apply&lang=pl|en&szybko&napisy&safe

import * as THREE from "three";
import { v } from "./v.js";
import { narysujCyfre, liczDotykiem, narysujRownanie } from "./liczby.js";
import * as G from "./geometria.js";
import * as E from "./efekty.js";
import * as U from "./ubior.js";
import { Stage, GROUND } from "./scene.js";
import { Speech, FAST } from "./speech.js";
import { LANGS, pickLang, loadStrings, translator, lineOf } from "./i18n.js";

const $ = (s) => document.querySelector(s);
const PARAMS = new URLSearchParams(location.search);
const STAGES = ["story", "practice", "apply"];
const DEBUG = PARAMS.has("debug");                   // ?debug=1: the phase icons jump between stages

// a background's identity: a name, or an insert {kolor, motyw}
const tloId = (bg) => (typeof bg === "object" && bg ? (bg.id || `kolor:${bg.kolor}:${bg.motyw}`) : bg);
function pelnyEkran() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)?.call(document.documentElement);
}
const GWIAZDA = (kolor) => `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="${kolor}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
// the stars of a practice stage in the HUD: grey until a round is done
function pasekGwiazdek(n, auto) {
  const el = $("#hud .gwiazdki"); el.innerHTML = Array.from({ length: n }, () => GWIAZDA("#c9d3dd")).join("");
  let zrobione = 0;
  return { auto, get zrobione() { return zrobione; }, dodaj() {
    const g = el.children[zrobione]; if (!g) return; zrobione++;
    g.outerHTML = GWIAZDA("#ffc928").replace("<svg", '<svg class="pelna"');
  }, usun() { el.innerHTML = ""; } };
}
// a streak of first-try answers: a badge with one flame per answer (no digits: the youngest cannot read them)
function pokazSerie(n, S) {
  const el = $("#seria"), plomien = `<svg viewBox="0 0 24 24"><path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-2-1-3-1-3 3 1 5 4 5 7a7 7 0 01-14 0c0-6 7-8 7-13z" fill="#fff"/></svg>`;
  el.innerHTML = plomien.repeat(Math.min(5, n)); el.classList.add("on"); S.sfx.graj("idea");
  clearTimeout(pokazSerie.t); pokazSerie.t = setTimeout(() => el.classList.remove("on"), 1500);
}

export class Player {
  constructor() {
    this.lang = pickLang();
    this.ui = {};
    this.speech = new Speech($("#subtitle"));
    this.stage = null; this.lesson = null; this.lessonId = null; this.run = 0; this.scenaNr = 0;
    window.gra = this;                                   // tests and debugging (see CLAUDE.md)
  }

  async boot() {
    this.ui = await loadStrings(`/game/i18n/${this.lang}.json`);
    this.t = translator([this.ui]);
    this.index = await (await fetch(v("/game/lessons/index.json"), { cache: "no-store" })).json();
    const wanted = PARAMS.get("lekcja");
    if (wanted && this.index.lessons.some((l) => l.id === wanted)) await this.start(wanted, PARAMS.get("etap"));
    else this.menu();
  }

  // ------------------------------------------------------------------ menu
  menu() {
    this.closeStage();
    const menu = $("#menu"); menu.style.display = "flex"; $("#hud").style.display = "none";
    menu.classList.remove("in"); setTimeout(() => { menu.classList.add("in"); $("#iris").style.display = "none"; }, 20);
    $("#title").textContent = this.t("menu.title");
    $("#langs").innerHTML = LANGS.map((l) => `<button data-lang="${l}" class="${l === this.lang ? "on" : ""}">${l.toUpperCase()}</button>`).join("")
      + `<button class="pelny" aria-label="fullscreen">⛶</button>`;
    $("#langs").onclick = (e) => { if (e.target.closest(".pelny")) return pelnyEkran(); const l = e.target.dataset.lang; if (l) location.search = `?lang=${l}`; };
    // lessons grouped into topics (index.json "topics"; a lesson in no topic goes to a last, untitled row);
    // numbers restart in every topic, the topic's colour marks its cards
    const byId = Object.fromEntries(this.index.lessons.map((l) => [l.id, l]));
    const topics = (this.index.topics || []).map((t) => ({ ...t, lessons: t.lessons.filter((id) => byId[id]) })).filter((t) => t.lessons.length);
    const rest = this.index.lessons.map((l) => l.id).filter((id) => !topics.some((t) => t.lessons.includes(id)));
    if (rest.length) topics.push({ id: "inne", title: null, color: "#ffb347", lessons: rest });
    const card = (l, i, color) => `
      <button class="lesson" data-id="${l.id}">
        <img class="cover" src="${v(`/game/lessons/${l.id}/cover.webp`)}" alt="" onerror="this.style.visibility='hidden'">
        <span class="nr" style="background:${color}">${i + 1}</span>
        <span class="name">${l.title[this.lang] || l.title.en}</span>
        <span class="sub">${l.subtitle?.[this.lang] || ""}</span>
      </button>`;
    // one long strip, a tinted block per topic; chips under it jump to a topic and show where the strip is
    const pas = $("#lessons"), chips = $("#chips");
    pas.innerHTML = topics.map((t) => `
      <section class="topic" data-topic="${t.id}" style="--c:${t.color}">
        ${t.title ? `<h2>${t.title[this.lang] || t.title.en}</h2>` : ""}
        <div class="row">${t.lessons.map((id, i) => card(byId[id], i, t.color)).join("")}</div>
      </section>`).join("");
    chips.innerHTML = topics.filter((t) => t.title).map((t) => `<button data-topic="${t.id}" style="--c:${t.color}">${t.title[this.lang] || t.title.en}</button>`).join("");
    const bloki = [...pas.querySelectorAll(".topic")];
    const naBlok = (sec) => pas.scrollTo({ left: sec.offsetLeft - parseFloat(getComputedStyle(pas).paddingLeft), behavior: "smooth" });
    const odswiez = () => {
      const x = pas.scrollLeft, max = pas.scrollWidth - pas.clientWidth;
      pas.style.setProperty("--fade-l", x > 4 ? "40px" : "0px"); pas.style.setProperty("--fade-r", x < max - 4 ? "40px" : "0px");   // more this way
      const srodek = x + pas.clientWidth * 0.35;
      let akt = bloki[0]; for (const b of bloki) if (b.offsetLeft <= srodek) akt = b;
      if (x >= max - 4) akt = bloki[bloki.length - 1];
      chips.querySelectorAll("button").forEach((c) => c.classList.toggle("on", c.dataset.topic === akt?.dataset.topic));
      this.menuX = x;
    };
    pas.onscroll = odswiez;
    chips.onclick = (e) => { const c = e.target.closest("button"); if (c) naBlok(bloki.find((b) => b.dataset.topic === c.dataset.topic)); };
    // a mouse wheel turns into sideways scroll; a mouse drag scrolls the strip (a finger does it natively)
    pas.onwheel = (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { pas.scrollLeft += e.deltaY; e.preventDefault(); } };
    let ciag = null;
    pas.onpointerdown = (e) => { if (e.pointerType !== "mouse" || e.button !== 0) return; ciag = { x: e.clientX, l: pas.scrollLeft, ruch: false }; };
    pas.onpointermove = (e) => {
      if (!ciag) return; const dx = e.clientX - ciag.x;
      if (!ciag.ruch && Math.abs(dx) > 8) { ciag.ruch = true; pas.classList.add("drag"); try { pas.setPointerCapture(e.pointerId); } catch {} }
      if (ciag.ruch) pas.scrollLeft = ciag.l - dx;
    };
    pas.onpointerup = pas.onpointercancel = () => { if (ciag?.ruch) { pas.classList.remove("drag"); pas.dataset.przeciagniete = "1"; setTimeout(() => delete pas.dataset.przeciagniete, 0); } ciag = null; };
    pas.onclick = (e) => { if (pas.dataset.przeciagniete) return; const b = e.target.closest(".lesson"); if (b) this.start(b.dataset.id); };
    pas.scrollLeft = this.menuX || 0; odswiez();                     // back from a lesson: where the child was
  }

  // ------------------------------------------------------------------ lesson
  async start(id, fromStage = null) {
    this.lessonId = id;
    const meta = this.index.lessons.find((l) => l.id === id);
    const mod = await import(v(`/game/lessons/${id}/lesson.js`));
    this.lesson = mod.default;
    this.strings = await loadStrings(`/game/lessons/${id}/i18n/${this.lang}.json`);
    this.tl = translator([this.strings, this.ui]);
    $("#menu").style.display = "none"; $("#hud").style.display = "flex";
    $("#hud .lesson-name").textContent = meta.title[this.lang] || meta.title.en;
    $("#hud .menu").onclick = () => this.leave();
    $("#hud .pauza").onclick = () => this.pauza(!this.wPauzie);
    $("#pauza button").onclick = () => this.pauza(false);
    $("#hud .dalej").onclick = () => this.dalej();
    $("#hud .pelny").onclick = () => pelnyEkran();
    $("#hud .gwiazdki").innerHTML = "";
    this.closeStage();
    const run = ++this.run;                             // every ctx call checks it: leaving the lesson stops the scene
    this.stage = new Stage($("#stage"), this.speech);
    for (const [name, o] of Object.entries(this.lesson.characters || {})) await this.stage.puppet(name, { x: o.x ?? (o.side === "right" ? 4.6 : -4.6), side: o.side, height: o.height });
    this.abort = false;
    const order = fromStage && STAGES.includes(fromStage) ? STAGES.slice(STAGES.indexOf(fromStage)) : STAGES;
    for (const st of order) {
      if (this.abort) return;
      await this.runStage(st);
      if (this.abort) return;
    }
    if (!this.abort && this.run === run) { await this.outro(); if (this.run === run) this.menu(); }
  }

  async runStage(st) {
    const scenes = this.lesson.stages[st] || [];
    for (const el of document.querySelectorAll("#hud .phase")) {           // the phase strip: done / current / ahead
      const i = STAGES.indexOf(el.dataset.stage), j = STAGES.indexOf(st);
      el.className = "phase " + (i < j ? "done" : i === j ? "current" : "ahead") + (DEBUG ? " debug" : "");
      el.title = this.t(`stage.${el.dataset.stage}`);
      if (DEBUG) el.onclick = () => { const q = new URLSearchParams(location.search); q.set("lekcja", this.lessonId); q.set("etap", el.dataset.stage); location.search = q.toString(); };
    }
    const bg = (this.lesson.backgrounds || {})[st];
    $("#hud .gwiazdki").innerHTML = ""; this.gwiazdki = null; this.seria = 0;     // a progress bar belongs to one stage
    if (bg && this.stage.bgName !== tloId(bg)) {          // a new scenery: dip to dark (or a transition) instead of a bare frame
      const zmien = async () => { this.stage.clear(); for (const L of Object.values(this.stage.puppets)) L.korzen.visible = false; await this.stage.background(bg); this.stage.bgName = tloId(bg); };
      if (this.lesson.przejscia) await E.przejscie(this.stage, zmien, {});
      else { await this.fade(true); await zmien(); await this.fade(false); }
    } else this.stage.clear();
    for (const scene of scenes) {
      if (this.abort) return;
      // every scene gets its own context: "next" (dalej) retires it, so whatever it still awaits throws and dies
      const nr = ++this.scenaNr, ctx = this.context(st, this.run, nr);
      const pominieto = new Promise((ok) => { this.pomin = () => ok("pomin"); });
      try {
        const p = Promise.resolve(scene(ctx)).then(() => "ok");
        p.catch(() => {});
        if (await Promise.race([p, pominieto]) === "pomin") { this.posprzataj(); continue; }
      }
      catch (e) {
        if (e && e.message === "abort") return;        // the child left the lesson
        console.error(`lesson ${this.lessonId} / ${st}:`, e); await this.card(`Błąd sceny (${st}): ${e.message || e}`, this.t("button.menu")); this.abort = true; this.menu(); return;
      }
    }
  }

  leave() {
    this.pauza(false);
    this.abort = true; this.run++;
    this.speech.stop(); this.stage?.cancelChoice();
    this.menu();
  }

  // the contract every scene gets; `run` is the lesson instance - once the player leaves,
  // every call throws "abort" so the scene cannot keep speaking or showing things
  // the HUD's pause: the picture, the tweens and the voice stand still until play
  pauza(tak) {
    this.wPauzie = !!tak;
    if (this.stage) this.stage.pauza = this.wPauzie;
    $("#pauza").style.display = this.wPauzie ? "flex" : "none";
    if (this.wPauzie) this.speech.pause(); else this.speech.resume();
  }
  // the HUD's "next": the scene being played ends here, the next one starts (for parents and for testing)
  dalej() { if (this.wPauzie) this.pauza(false); if (this.pomin) this.pomin(); }
  posprzataj() {
    const S = this.stage; if (!S) return;
    this.speech.stop(); S.cancelChoice(); S.endSort(); S.clear();
    E.ujecie(S, "ogolny");
  }

  context(st, run, nr = this.scenaNr) {
    const S = this.stage, lang = this.lang, lessonId = this.lessonId, strings = this.strings;
    const alive = () => { if (this.run !== run || this.scenaNr !== nr) throw new Error("abort"); };
    const guard = (f) => async (...a) => { alive(); const r = await f(...a); alive(); return r; };
    let last = null;                                   // the last line spoken; a task keeps the one said before it as its instruction
    // the instruction in force while an interaction runs: a tapped character repeats it (scene.js tapPuppet), one
    // repeat at a time; `wDzialaniu(p)` sets it for the life of promise p
    let polecenieTeraz = null, powtarza = false;
    S.onPuppetTap = async () => {
      if (!polecenieTeraz || powtarza || S.sfx.mowa || this.run !== run) return;   // never over a line being spoken
      powtarza = true;
      try { await say(polecenieTeraz.who, polecenieTeraz.key, { anim: polecenieTeraz.anim }); } catch {} finally { powtarza = false; }
    };
    // a right answer: confetti and a tick when the lesson wants them (nagrody), a star and the streak in practice
    const nagroda = (h, bezBledu = true) => {
      if (this.run !== run) return;
      if (this.lesson.nagrody) { E.konfetti(S, h); if (h) E.ptaszek(S, h); }
      if (this.gwiazdki) {
        if (this.gwiazdki.auto) this.gwiazdki.dodaj();
        this.seria = bezBledu ? (this.seria || 0) + 1 : 0;
        if (this.seria >= 2) pokazSerie(this.seria, S);
      }
    };
    const wDzialaniu = (p) => { const pol = last; polecenieTeraz = pol; const koniec = () => { if (polecenieTeraz === pol) polecenieTeraz = null; }; Promise.resolve(p).then(koniec, koniec); return p; };
    const say = async (who, key, { anim = null } = {}) => {
      alive();
      const line = lineOf([strings], key);
      if (!S.puppets[who]) who = line.who;                            // the scene picks the speaker; the line's `who` is the default
      const stem = who === line.who ? key : `${key}.${who}`;          // a recording exists per allowed speaker (i18n `speakers`)
      last = { who, key, anim }; this.lastSpeaker = who; S.ostatniMowca = who;
      const puppet = S.puppets[who] || null;
      if (puppet && puppet.korzen.visible && anim !== false) { puppet.patrz("przod"); puppet.graj(anim || "Mowienie", true); }
      S.sfx.mowa = true;                                              // effects duck under a line
      try { await this.speech.say({ lang, lessonId, key: stem, fallback: key, text: line.text, who, puppet, volume: puppet?.meta?.volume ?? 1 }); }
      finally { S.sfx.mowa = false; }   // who speaks is shown by the mouth, no bubble
      alive();
      if (puppet && puppet.korzen.visible) puppet.spoczynek();
    };
    const ctx = {
      stage: S, lang, st, t: this.tl, fast: FAST,
      say,
      enter: guard((who, from) => S.enter(who, from || ((this.lesson.characters[who] || {}).side === "right" ? "right" : "left"))),
      show: (who) => { alive(); const L = S.puppets[who]; if (L) { L.korzen.visible = true; L.korzen.position.x = L.home; L.korzen.position.y = GROUND; L.korzen.scale.setScalar(1); L.podloga = null; L.patrz("przod"); L.spoczynek(); S.appear(L); } },
      play: guard((who, anim, opts) => S.play(who, anim, opts)),
      walkTo: guard((who, x) => S.walkTo(who, x)),
      // into the picture: [[x, y], ...] on the ground, higher = further (smaller); { skok } hops (stepping stones)
      przejdz: guard((who, punkty, opts) => S.przejdz(who, punkty, opts)),
      // travel inside a stage: dip to dark, new scenery, objects cleared; puppets stay at home
      // (visible as before) unless enter: true hides them so the scene can walk them in again
      // bg: a background name, or an insert on a plain colour {kolor, motyw, kolo}; przejscie: true (one at random),
      // a name (E.PRZEJSCIA) or false; the lesson's `przejscia: true` makes every change a transition
      go: guard(async (bg, { enter = false, przejscie = undefined, obszar = 0, ciecie = false } = {}) => {
        if (S.bgName === tloId(bg)) return;
        const zmien = async () => {
          S.clear(); E.ujecie(S, "ogolny");
          for (const L of Object.values(S.puppets)) { if (enter) L.korzen.visible = false; else L.korzen.position.x = L.home; }
          await S.background(bg); S.bgName = tloId(bg);
          if (obszar) E.ustawObszar(S, obszar);
        };
        const p = przejscie ?? (this.lesson.przejscia && !ciecie ? true : false);
        if (ciecie) await zmien();                                    // a cut: inside one adventure
        else if (p) await E.przejscie(S, zmien, { rodzaj: typeof p === "string" ? p : null });
        else { await this.fade(true); await zmien(); await this.fade(false); }
      }),
      przejscie: guard((zmiana, rodzaj = null) => E.przejscie(S, async () => { alive(); await zmiana(); }, { rodzaj })),
      // film tools (efekty.js, guidelines "Atmosphere and editing")
      ujecie: guard((typ, opts) => E.ujecie(S, typ, opts)),
      pan: guard((k, opts) => E.pan(S, k, opts)),
      odliczanie: guard((opts) => E.odliczanie(S, opts)),
      konfetti: (h, opts) => { alive(); E.konfetti(S, h, opts); },
      ptaszek: guard((h, opts) => E.ptaszek(S, h, opts)),
      emocja: guard(async (who, rodzaj, { anim = null, na = 2.2 } = {}) => { if (anim) S.play(who, anim); return E.emocja(S, who, rodzaj, { na }); }),
      nalozenie: guard((gorny, dolny, opts) => E.nalozenie(S, gorny, dolny, opts)),
      // particles over the whole scene: deszcz, snieg, swietliki, liscie, pylek, babelki (null stops them)
      czastki: (rodzaj, opts) => { alive(); return E.czastki(S, rodzaj, opts); },
      // a bar of stars in the HUD for a practice stage; auto: every finished task adds one
      gwiazdki: (n, { auto = true } = {}) => { alive(); this.gwiazdki = pasekGwiazdek(n, auto); return this.gwiazdki; },
      // dressing up (ubior.js): a hat, glasses, shoes ... fitted to any humanoid character
      ubierz: guard((who, rzecz, opts) => U.ubierz(S, who, rzecz, opts)),
      zdejmij: (who, slot) => { alive(); return U.zdejmij(S, who, slot); },
      nieUbieraj: guard((who, rzecz, opts) => U.nieUbieraj(S, who, rzecz, opts)),
      ubranie: guard((rzecz, opts) => U.ubranieNaNaklejce(S, rzecz, opts)),
      // drag garments onto characters: { rzeczy, kto: [names], pasuje(h, who) -> true | "za_duze" | "za_male", wrong(ocena) -> line key, zostaw }
      ubieranie: guard((o) => wDzialaniu(U.ubieranie(S, { ...o, onWrong: o.wrong ? (h, who, ocena) => say("narrator", typeof o.wrong === "function" ? o.wrong(ocena, h, who) : o.wrong) : null })).then((r) => { nagroda(null); return r; })),
      mood: (who, m) => S.mood(who, m),
      look: (who, target, opts) => S.lookAt(who, target, opts),   // a scene may direct a gaze too (null = ahead)
      sfx: (name, opts) => S.sfx.graj(name, opts),                // a sound effect (game/audio/sfx)
      shake: (h) => { alive(); return S.shake(h); },                  // a wrong try: the thing shakes (and buzzes)
      // the camera closes in on things and dims the rest; unfocus brings the whole stage back
      focus: guard((items, opts) => S.focus(items, opts)),
      // carrying: take a thing into a character's paw (onto a quadruped's back), walk with it, put it down
      take: guard((who, h, opts) => S.take(who, h, opts)),
      // "I have an idea!": a thought bubble over a character with stickers pictured inside, in groups
      idea: guard((who, groups, opts) => S.idea(who, groups, opts)),
      // numbers: a digit (or 10) drawn with the pencil; counting by touch - the number words are the lesson's own
      // lines "line.n1".."line.n10", spoken by `who`
      digit: guard((n, opts) => narysujCyfre(S, n, opts)),
      count: guard((items, { who, od = 0, rzad = null } = {}) => wDzialaniu(liczDotykiem(S, items, { od, rzad, say: (k) => say(who, `line.n${k}`) }))),
      equation: guard((tokens, opts) => narysujRownanie(S, tokens, opts)),
      // geometry and order (geometria.js); the waits repeat the instruction when a character is tapped
      shape: (kind, opts) => { alive(); return G.ksztalt(S, kind, opts); },
      corners: (h) => G.rogi(S, h),
      piece: (t, opts = {}) => G.ksztalt(S, t, { ...opts, def: G.TANGRAM[t], name: `kawalek_${t}` }),
      tangram: guard(async (name, opts) => { const t = G.tangram(S, name, opts); const pol = last; t.done = () => wDzialaniu(t.wait()).then((r) => { nagroda(null); return r; }); return t; }),
      place: guard(async (o) => { const pol = last; return wDzialaniu(G.umiesc(S, { ...o, onWrong: o.wrong ? () => say("narrator", o.wrong) : null })); }),
      behind: (item, ref) => G.zaRzecza(item, ref),
      relation: (item, ref, ref2) => G.relacja(S, item, ref, ref2),
      symmetry: guard(async (name, o = {}) => { const pol = last; const t = await G.symetria(S, name, { ...o, onWrong: o.wrong ? () => say("narrator", o.wrong) : null }); t.done = () => wDzialaniu(t.wait()).then((r) => { nagroda(null); return r; }); return t; }),
      slots: guard(async (o) => { const pol = last; const t = await G.sloty(S, { ...o, onWrong: o.wrong ? () => say("narrator", o.wrong) : null }); t.done = () => wDzialaniu(t.wait()).then((r) => { nagroda(null); return r; }); return t; }),
      put: guard((who, x, y, opts) => S.put(who, x, y, opts)),
      // pencil annotations (each a handle: remove it, or clear() does)
      circle: guard((h, opts) => S.circle(h, opts)),
      arrow: guard((h, opts) => S.arrow(h, opts)),
      cross: guard((h, opts) => S.cross(h, opts)),
      wonder: guard((who, opts) => S.wonder(who, opts)),
      unfocus: guard((d) => S.unfocus(d)),
      // drawing with a pencil: a stroke along points or Bezier segments, a segment with end ticks; stickers' real
      // edges (bounds) and standing things on a line - the pieces for comparisons and pairings
      line: guard((path, opts) => S.line(path, opts)),
      segment: guard((a, b, opts) => S.segment(a, b, opts)),
      bounds: (h) => S.bounds(h),
      standOn: guard((items, y, d) => S.standOn(items, y, d)),
      object: guard((name, opts) => S.object(name, opts)),
      sign: guard((text, opts) => S.sign(text, opts)),
      zone: guard((opts) => S.zone(opts)),
      arrange: (groups, opts) => { alive(); return S.arrange(groups, opts); },
      choose: guard((targets) => S.choose(targets)),
      // a task: the child must click `correct` among `targets`; a wrong click plays the
      // `wrong` line and, after `hintAfter` misses, pulses the right answer
      task: (o) => wDzialaniu(zadanie(o)),
      sort: (o) => wDzialaniu(sortuj(o)).then((r) => { nagroda(null); return r; }),
      _task: async ({ targets, correct, wrong, hintAfter = 2, onWrong = null }) => {
        const ok = Array.isArray(correct) ? correct : [correct];
        const polecenie = last;                          // the instruction: a tapped character repeats it, not the "try again" said since
        let misses = 0;
        const podpowiedzi = [];                          // pencil hints drawn on the way; wiped when the task ends
        const puppets = Object.values(S.puppets).filter((L) => L.korzen.visible);
        // while the child thinks, the characters look from one option to the next - every option, so the gaze gives nothing away
        const names = Object.keys(S.puppets).filter((n) => S.puppets[n].korzen.visible);
        let tick = 0;
        const glance = () => { names.forEach((n, j) => S.lookAt(n, targets[(tick + j) % targets.length])); tick++; };
        glance(); const gazeTimer = setInterval(() => { if (this.run !== run) return clearInterval(gazeTimer); glance(); }, FAST ? 400 : 1700);
        try {
        for (;;) {
          alive();
          const hit = await S.choose([...targets, ...puppets]);
          alive();
          if (hit && hit.korzen) { if (polecenie) await say(polecenie.who, polecenie.key, { anim: polecenie.anim }); continue; }   // "say it again"
          if (ok.includes(hit)) { for (const h of ok) h.highlight?.(false); clearInterval(gazeTimer); S.lookAt(null, hit); S.sfx.graj("right"); nagroda(hit, misses === 0); return hit; }
          misses++;
          S.shake(hit);
          if (onWrong) await onWrong(hit); else if (wrong) await say("narrator", wrong);
          // the hint ladder: first the answer pulses, then a pencil arrow points at it, then the character shows it
          if (misses >= hintAfter) for (const h of ok) h.highlight?.(true);
          if (misses === hintAfter + 1 && !podpowiedzi.length) podpowiedzi.push(await S.arrow(ok[0]));
          if (misses === hintAfter + 2) {
            const kto = polecenie?.who && S.puppets[polecenie.who] ? polecenie.who : Object.keys(S.puppets).find((n) => S.puppets[n].korzen.visible);
            if (kto) { S.lookAt(kto, ok[0]); S.puppets[kto].graj("Wskazanie"); }
            podpowiedzi.push(await S.circle(ok[0]));
          }
        }
        } finally { clearInterval(gazeTimer); for (const p of podpowiedzi) p.remove(); }
      },
      // free sorting: every item must end up in a zone and every zone must hold one kind
      // (by item.tag); a mixed zone sends its odd ones home with the `wrong` line
      _sort: async ({ items, zones, wrong }) => {
        alive();
        const polecenie = last;
        Object.keys(S.puppets).forEach((n, j) => S.lookAt(n, zones[j % zones.length]));   // the characters watch the containers
        return new Promise((resolve) => {
          let busy = false;
          const check = async () => {
            if (busy || items.some((i) => !i.zone)) return;
            busy = true;
            try {
              const odd = [];
              for (const z of zones) {
                const count = {}; for (const i of z.items) count[i.tag] = (count[i.tag] || 0) + 1;
                const main = z.want || Object.keys(count).sort((a, b) => count[b] - count[a])[0];
                for (const i of z.items) if (i.tag !== main) odd.push(i);
              }
              if (!odd.length) { S.endSort(); S.lookAt(null, null); S.sfx.graj("right"); resolve(true); return; }
              for (const i of odd) { S.shake(i); }
              await S.wait(0.45);
              for (const i of odd) { i.zone.take(i); i.moveTo(i.home.x, i.home.y, 0.4); }
              if (wrong && this.run === run) await say("narrator", wrong);
            } finally { busy = false; }
          };
          S.sort({ items, zones, onDrop: () => { if (this.run === run) check(); }, onTap: () => S.onPuppetTap() });
        });
      },
      card: guard((key, button = "button.next") => this.card(this.tl(key), this.t(button))),
      wait: guard((s) => S.wait(FAST ? Math.min(s, 0.2) : s)),
      clear: () => { alive(); S.clear(); },
      praise: guard(async (who) => { const L = S.puppets[who]; if (L && L.korzen.visible) { L.graj("Radosc"); } await S.wait(FAST ? 0.2 : 1.2); }),
    };
    const zadanie = ctx._task, sortuj = ctx._sort;   // task/sort run under the instruction rule (wDzialaniu)
    return ctx;
  }

  // ------------------------------------------------------------------ overlays
  fade(dark) {
    const f = $("#fade"); f.style.display = "block";
    // timers, not animation frames: a hidden tab gets no frames and would hang here
    return new Promise((ok) => { setTimeout(() => { f.style.opacity = dark ? "1" : "0"; setTimeout(() => { if (!dark) f.style.display = "none"; ok(); }, FAST ? 60 : 380); }, 20); });
  }
  // the goodbye: a blue iris closes around the characters' faces, then covers everything
  async outro() {
    const S = this.stage, iris = $("#iris");
    // the iris closes on the face of whoever spoke last (the one saying goodbye)
    const visible = Object.values(S.puppets).filter((L) => L.korzen.visible);
    const star = S.puppets[this.lastSpeaker] && S.puppets[this.lastSpeaker].korzen.visible ? S.puppets[this.lastSpeaker] : visible[0];
    const r = S.renderer.domElement.getBoundingClientRect();
    let cx = r.left + r.width / 2, cy = r.top + r.height / 2, r1 = 220;
    if (star) {
      const head = star.korzen.position.clone(); head.y += star.wysokosc * 0.82;
      const c = S.toScreen(head), edge = S.toScreen(head.clone().add(new THREE.Vector3(star.wysokosc * 0.3, 0, 0)));
      cx = c.x + r.left; cy = c.y + r.top; r1 = Math.abs(edge.x - c.x);
    }
    const r0 = Math.hypot(innerWidth, innerHeight);
    iris.style.display = "block";
    const t0 = performance.now(), d = FAST ? 400 : 1800;
    await new Promise((ok) => {
      const step = () => {
        const s = Math.min(1, (performance.now() - t0) / d);
        // three phases: close in on the face (ease-out), hold on it, then shut (ease-in)
        let radius;
        if (s < 0.65) { const u = s / 0.65, e = 1 - Math.pow(1 - u, 3); radius = r0 + (r1 - r0) * e; }
        else if (s < 0.8) radius = r1;
        else { const u = (s - 0.8) / 0.2; radius = r1 * (1 - u * u); }
        const m = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${Math.max(0, radius)}px, #000 ${Math.max(0, radius) + 3}px)`;
        iris.style.webkitMaskImage = m; iris.style.maskImage = m;
        if (s < 1) setTimeout(step, 16); else setTimeout(ok, FAST ? 100 : 500);
      };
      step();
    });
  }
  card(text, button) {
    const c = $("#card"); c.style.display = "flex";
    c.querySelector(".text").textContent = text;
    const b = c.querySelector("button"); b.textContent = button;
    return new Promise((ok) => {
      const close = () => { c.style.display = "none"; ok(); };
      b.onclick = close;
      if (FAST) setTimeout(close, 300);
    });
  }
  closeStage() { if (this.stage) { this.stage.dispose(); this.stage = null; } }

  // ------------------------------------------------------------------ test helpers (window.gra)
  klik(nx, ny) { return this.stage?.click(nx, ny); }
  klikCel(i) { const t = this.stage?.targets[i]; return t ? this.stage.clickOn(t) : null; }
  get cele() { return (this.stage?.targets || []).map((t) => t.name); }
  snap(name) { return this.stage?.snap(name); }
  get dziennik() { return this.speech.log; }
}
