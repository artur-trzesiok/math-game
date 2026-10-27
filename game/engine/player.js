// Master player: lists the lessons, picks the language, runs a lesson's three
// stages (story, practice, apply) scene by scene. A lesson is a plug-in module
// (game/lessons/<id>/lesson.js) that follows the contract in guidelines.md; the
// player gives every scene a context object and never looks inside the lesson.
//
// URL: ?lekcja=<id>&etap=story|practice|apply&lang=pl|en&szybko&napisy&safe

import { Stage } from "./scene.js";
import { Speech, FAST } from "./speech.js";
import { LANGS, pickLang, loadStrings, translator, lineOf } from "./i18n.js";

const $ = (s) => document.querySelector(s);
const PARAMS = new URLSearchParams(location.search);
const STAGES = ["story", "practice", "apply"];

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
    $("#menu").style.display = "flex"; $("#hud").style.display = "none";
    $("#title").textContent = this.t("menu.title");
    $("#langs").innerHTML = LANGS.map((l) => `<button data-lang="${l}" class="${l === this.lang ? "on" : ""}">${l.toUpperCase()}</button>`).join("");
    $("#langs").onclick = (e) => { const l = e.target.dataset.lang; if (l) location.search = `?lang=${l}`; };
    $("#lessons").innerHTML = this.index.lessons.map((l, i) => `
      <button class="lesson" data-id="${l.id}">
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
    if (!this.abort && this.run === run) { await this.card(this.t("lesson.done"), this.t("button.menu")); if (this.run === run) this.menu(); }
  }

  async runStage(st) {
    const scenes = this.lesson.stages[st] || [];
    for (const el of document.querySelectorAll("#hud .phase")) {           // the phase strip: done / current / ahead
      const i = STAGES.indexOf(el.dataset.stage), j = STAGES.indexOf(st);
      el.className = "phase " + (i < j ? "done" : i === j ? "current" : "ahead");
      el.title = this.t(`stage.${el.dataset.stage}`);
    }
    const bg = (this.lesson.backgrounds || {})[st];
    if (bg) await this.stage.background(bg);
    this.stage.clear();
    for (const L of Object.values(this.stage.puppets)) { L.korzen.visible = false; }
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
    const say = async (who, key, { anim = null } = {}) => {
      alive();
      const line = lineOf([strings], key);
      const puppet = who === "narrator" ? null : S.puppets[who];
      if (puppet && puppet.korzen.visible && anim !== false) { puppet.patrz("przod"); puppet.graj(anim || "Mowienie", true); }
      await this.speech.say({ lang, lessonId, key, text: line.text, who, puppet });   // who speaks is shown by the mouth, no bubble
      alive();
      if (puppet && puppet.korzen.visible) puppet.spoczynek();
    };
    return {
      stage: S, lang, st, t: this.tl, fast: FAST,
      say,
      enter: guard((who, from) => S.enter(who, from || ((this.lesson.characters[who] || {}).side === "right" ? "right" : "left"))),
      show: (who) => { alive(); const L = S.puppets[who]; if (L) { L.korzen.visible = true; L.korzen.position.x = L.home; L.patrz("przod"); L.spoczynek(); } },
      play: guard((who, anim, opts) => S.play(who, anim, opts)),
      mood: (who, m) => S.mood(who, m),
      object: guard((name, opts) => S.object(name, opts)),
      sign: guard((text, opts) => S.sign(text, opts)),
      zone: (opts) => { alive(); return S.zone(opts); },
      choose: guard((targets) => S.choose(targets)),
      // a task: the child must click `correct` among `targets`; a wrong click plays the
      // `wrong` line and, after `hintAfter` misses, pulses the right answer
      task: async ({ targets, correct, wrong, hintAfter = 2, onWrong = null }) => {
        const ok = Array.isArray(correct) ? correct : [correct];
        let misses = 0;
        for (;;) {
          alive();
          const hit = await S.choose(targets);
          alive();
          if (ok.includes(hit)) { for (const h of ok) h.highlight?.(false); return hit; }
          misses++;
          S.shake(hit);
          if (onWrong) await onWrong(hit); else if (wrong) await say("narrator", wrong);
          if (misses >= hintAfter) for (const h of ok) h.highlight?.(true);
        }
      },
      card: guard((key, button = "button.next") => this.card(this.tl(key), this.t(button))),
      wait: guard((s) => S.wait(FAST ? Math.min(s, 0.2) : s)),
      clear: () => { alive(); S.clear(); },
      praise: guard(async (who) => { const L = S.puppets[who]; if (L && L.korzen.visible) { L.graj("Radosc"); } await S.wait(FAST ? 0.2 : 1.2); }),
    };
  }

  // ------------------------------------------------------------------ overlays
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
