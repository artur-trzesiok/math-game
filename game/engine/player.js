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
    this.stage = null; this.lesson = null; this.lessonId = null;
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
    $("#hud .menu").onclick = () => { this.abort = true; this.speech.stop(); this.stage?.cancelChoice(); this.menu(); };
    this.closeStage();
    this.stage = new Stage($("#stage"), this.speech);
    for (const [name, o] of Object.entries(this.lesson.characters || {})) await this.stage.puppet(name, { x: o.x ?? (o.side === "right" ? 3.4 : -3.4), side: o.side, height: o.height });
    this.abort = false;
    const order = fromStage && STAGES.includes(fromStage) ? STAGES.slice(STAGES.indexOf(fromStage)) : STAGES;
    for (const st of order) {
      if (this.abort) return;
      await this.runStage(st);
      if (this.abort) return;
      if (st !== "apply") await this.card(this.t(`stage.done.${st}`), this.t("button.next"));
    }
    if (!this.abort) { await this.card(this.t("lesson.done"), this.t("button.menu")); this.menu(); }
  }

  async runStage(st) {
    const scenes = this.lesson.stages[st] || [];
    $("#hud .stage-name").textContent = this.t(`stage.${st}`);
    const bg = (this.lesson.backgrounds || {})[st];
    if (bg) await this.stage.background(bg);
    this.stage.clear();
    for (const L of Object.values(this.stage.puppets)) { L.korzen.visible = false; }
    const ctx = this.context(st);
    for (const scene of scenes) { if (this.abort) return; await scene(ctx); }
  }

  // the contract every scene gets
  context(st) {
    const S = this.stage, lang = this.lang, lessonId = this.lessonId, strings = this.strings;
    const say = async (who, key, { anim = null } = {}) => {
      const line = lineOf([strings], key);
      const puppet = who === "narrator" ? null : S.puppets[who];
      if (puppet && puppet.korzen.visible && anim !== false) { puppet.patrz("przod"); puppet.graj(anim || "Mowienie", true); }
      this.bubble(puppet);
      await this.speech.say({ lang, lessonId, key, text: line.text, who, puppet });
      this.bubble(null);
      if (puppet && puppet.korzen.visible) puppet.spoczynek();
    };
    return {
      stage: S, lang, st, t: this.tl, fast: FAST,
      say,
      enter: (who, from) => S.enter(who, from || ((this.lesson.characters[who] || {}).side === "right" ? "right" : "left")),
      show: (who) => { const L = S.puppets[who]; if (L) { L.korzen.visible = true; L.korzen.position.x = L.home; L.patrz("przod"); L.spoczynek(); } },
      play: (who, anim, opts) => S.play(who, anim, opts),
      mood: (who, m) => S.mood(who, m),
      object: (name, opts) => S.object(name, opts),
      sign: (text, opts) => S.sign(text, opts),
      zone: (opts) => S.zone(opts),
      choose: (targets) => S.choose(targets),
      // a task: the child must click `correct` among `targets`; a wrong click plays the
      // `wrong` line and, after `hintAfter` misses, pulses the right answer
      task: async ({ targets, correct, wrong, hintAfter = 2, onWrong = null }) => {
        const ok = Array.isArray(correct) ? correct : [correct];
        let misses = 0;
        for (;;) {
          const hit = await S.choose(targets);
          if (this.abort) return null;
          if (ok.includes(hit)) { for (const h of ok) h.highlight?.(false); return hit; }
          misses++;
          if (onWrong) await onWrong(hit); else if (wrong) await say("narrator", wrong);
          if (misses >= hintAfter) for (const h of ok) h.highlight?.(true);
        }
      },
      card: (key, button = "button.next") => this.card(this.tl(key), this.t(button)),
      wait: (s) => S.wait(FAST ? Math.min(s, 0.2) : s),
      clear: () => S.clear(),
      praise: async (who) => { const L = S.puppets[who]; if (L && L.korzen.visible) { L.graj("Radosc"); } await S.wait(FAST ? 0.2 : 1.2); },
    };
  }

  // ------------------------------------------------------------------ overlays
  bubble(puppet) {
    const b = $("#bubble");
    if (!puppet) { b.style.display = "none"; clearInterval(this.bubbleTimer); return; }
    b.style.display = "block";
    const place = () => { const p = puppet.korzen.position.clone(); p.y += puppet.wysokosc + 0.3; const s = this.stage.toScreen(p); b.style.left = s.x + "px"; b.style.top = s.y + "px"; };
    place(); clearInterval(this.bubbleTimer); this.bubbleTimer = setInterval(place, 100);
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
