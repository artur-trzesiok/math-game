// Master player: lists the lessons, picks the language, runs a lesson's three
// stages (story, practice, apply) scene by scene. A lesson is a plug-in module
// (game/lessons/<id>/lesson.js) that follows the contract in guidelines.md; the
// player gives every scene a context object and never looks inside the lesson.
//
// URL: ?lekcja=<id>&etap=story|practice|apply&lang=pl|en&szybko&napisy&safe

import * as THREE from "three";
import { Stage } from "./scene.js";
import { Speech, FAST } from "./speech.js";
import { LANGS, pickLang, loadStrings, translator, lineOf } from "./i18n.js";

const $ = (s) => document.querySelector(s);
const PARAMS = new URLSearchParams(location.search);
const STAGES = ["story", "practice", "apply"];
const DEBUG = PARAMS.has("debug");                   // ?debug=1: the phase icons jump between stages

export class Player {
  constructor() {
    this.lang = pickLang();
    this.ui = {};
    this.speech = new Speech($("#subtitle"));
    this.stage = null; this.lesson = null; this.lessonId = null; this.run = 0;
    window.gra = this;                                   // tests and debugging (see CLAUDE.md)
  }

  async boot() {
    this.ui = await loadStrings(`/game/i18n/${this.lang}.json`);
    this.t = translator([this.ui]);
    this.index = await (await fetch("/game/lessons/index.json", { cache: "no-store" })).json();
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
    $("#langs").innerHTML = LANGS.map((l) => `<button data-lang="${l}" class="${l === this.lang ? "on" : ""}">${l.toUpperCase()}</button>`).join("");
    $("#langs").onclick = (e) => { const l = e.target.dataset.lang; if (l) location.search = `?lang=${l}`; };
    $("#lessons").innerHTML = this.index.lessons.map((l, i) => `
      <button class="lesson" data-id="${l.id}">
        <img class="cover" src="/game/lessons/${l.id}/cover.webp" alt="" onerror="this.style.visibility='hidden'">
        <span class="nr">${i + 1}</span>
        <span class="name">${l.title[this.lang] || l.title.en}</span>
        <span class="sub">${l.subtitle?.[this.lang] || ""}</span>
      </button>`).join("");
    $("#lessons").onclick = (e) => { const b = e.target.closest(".lesson"); if (b) this.start(b.dataset.id); };
  }

  // ------------------------------------------------------------------ lesson
  async start(id, fromStage = null) {
    this.lessonId = id;
    const meta = this.index.lessons.find((l) => l.id === id);
    const mod = await import(`/game/lessons/${id}/lesson.js?t=${Date.now()}`);
    this.lesson = mod.default;
    this.strings = await loadStrings(`/game/lessons/${id}/i18n/${this.lang}.json`);
    this.tl = translator([this.strings, this.ui]);
    $("#menu").style.display = "none"; $("#hud").style.display = "flex";
    $("#hud .lesson-name").textContent = meta.title[this.lang] || meta.title.en;
    $("#hud .menu").onclick = () => this.leave();
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
    if (bg && this.stage.bgName !== bg) {                 // a new scenery: dip to dark instead of a bare frame
      await this.fade(true); this.stage.clear();
      for (const L of Object.values(this.stage.puppets)) L.korzen.visible = false;
      await this.stage.background(bg); await this.fade(false);
    } else this.stage.clear();
    const ctx = this.context(st, this.run);
    for (const scene of scenes) {
      if (this.abort) return;
      try { await scene(ctx); }
      catch (e) {
        if (e && e.message === "abort") return;        // the child left the lesson
        console.error(`lesson ${this.lessonId} / ${st}:`, e); await this.card(`Błąd sceny (${st}): ${e.message || e}`, this.t("button.menu")); this.abort = true; this.menu(); return;
      }
    }
  }

  leave() {
    this.abort = true; this.run++;
    this.speech.stop(); this.stage?.cancelChoice();
    this.menu();
  }

  // the contract every scene gets; `run` is the lesson instance - once the player leaves,
  // every call throws "abort" so the scene cannot keep speaking or showing things
  context(st, run) {
    const S = this.stage, lang = this.lang, lessonId = this.lessonId, strings = this.strings;
    const alive = () => { if (this.run !== run) throw new Error("abort"); };
    const guard = (f) => async (...a) => { alive(); const r = await f(...a); alive(); return r; };
    let last = null;                                   // the last line, repeated when a puppet is tapped during a task
    const say = async (who, key, { anim = null } = {}) => {
      alive();
      const line = lineOf([strings], key);
      if (!S.puppets[who]) who = line.who;                            // the scene picks the speaker; the line's `who` is the default
      const stem = who === line.who ? key : `${key}.${who}`;          // a recording exists per allowed speaker (i18n `speakers`)
      last = { who, key, anim }; this.lastSpeaker = who;
      const puppet = S.puppets[who] || null;
      if (puppet && puppet.korzen.visible && anim !== false) { puppet.patrz("przod"); puppet.graj(anim || "Mowienie", true); }
      await this.speech.say({ lang, lessonId, key: stem, fallback: key, text: line.text, who, puppet, volume: puppet?.meta?.volume ?? 1 });   // who speaks is shown by the mouth, no bubble
      alive();
      if (puppet && puppet.korzen.visible) puppet.spoczynek();
    };
    return {
      stage: S, lang, st, t: this.tl, fast: FAST,
      say,
      enter: guard((who, from) => S.enter(who, from || ((this.lesson.characters[who] || {}).side === "right" ? "right" : "left"))),
      show: (who) => { alive(); const L = S.puppets[who]; if (L) { L.korzen.visible = true; L.korzen.position.x = L.home; L.patrz("przod"); L.spoczynek(); S.appear(L); } },
      play: guard((who, anim, opts) => S.play(who, anim, opts)),
      walkTo: guard((who, x) => S.walkTo(who, x)),
      mood: (who, m) => S.mood(who, m),
      object: guard((name, opts) => S.object(name, opts)),
      sign: guard((text, opts) => S.sign(text, opts)),
      zone: guard((opts) => S.zone(opts)),
      arrange: (groups, opts) => { alive(); return S.arrange(groups, opts); },
      choose: guard((targets) => S.choose(targets)),
      // a task: the child must click `correct` among `targets`; a wrong click plays the
      // `wrong` line and, after `hintAfter` misses, pulses the right answer
      task: async ({ targets, correct, wrong, hintAfter = 2, onWrong = null }) => {
        const ok = Array.isArray(correct) ? correct : [correct];
        let misses = 0;
        const puppets = Object.values(S.puppets).filter((L) => L.korzen.visible);
        for (;;) {
          alive();
          const hit = await S.choose([...targets, ...puppets]);
          alive();
          if (hit && hit.korzen) { if (last) await say(last.who, last.key, { anim: last.anim }); continue; }   // "say it again"
          if (ok.includes(hit)) { for (const h of ok) h.highlight?.(false); return hit; }
          misses++;
          S.shake(hit);
          if (onWrong) await onWrong(hit); else if (wrong) await say("narrator", wrong);
          if (misses >= hintAfter) for (const h of ok) h.highlight?.(true);
        }
      },
      // free sorting: every item must end up in a zone and every zone must hold one kind
      // (by item.tag); a mixed zone sends its odd ones home with the `wrong` line
      sort: async ({ items, zones, wrong }) => {
        alive();
        return new Promise((resolve) => {
          let busy = false;
          const check = async () => {
            if (busy || items.some((i) => !i.zone)) return;
            busy = true;
            try {
              const odd = [];
              for (const z of zones) {
                const count = {}; for (const i of z.items) count[i.tag] = (count[i.tag] || 0) + 1;
                const main = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
                for (const i of z.items) if (i.tag !== main) odd.push(i);
              }
              if (!odd.length) { S.endSort(); resolve(true); return; }
              for (const i of odd) { S.shake(i); }
              await S.wait(0.45);
              for (const i of odd) { i.zone.take(i); i.moveTo(i.home.x, i.home.y, 0.4); }
              if (wrong && this.run === run) await say("narrator", wrong);
            } finally { busy = false; }
          };
          S.sort({ items, zones, onDrop: () => { if (this.run === run) check(); }, onTap: () => { if (last && this.run === run) say(last.who, last.key, { anim: last.anim }); } });
        });
      },
      card: guard((key, button = "button.next") => this.card(this.tl(key), this.t(button))),
      wait: guard((s) => S.wait(FAST ? Math.min(s, 0.2) : s)),
      clear: () => { alive(); S.clear(); },
      praise: guard(async (who) => { const L = S.puppets[who]; if (L && L.korzen.visible) { L.graj("Radosc"); } await S.wait(FAST ? 0.2 : 1.2); }),
    };
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
