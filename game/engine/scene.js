// The stage every lesson plays on: a three.js scene with an illustrated background
// (tlo.js), cut-out puppets (lalka.js), object stickers, click targets, cards and a
// SAFE AREA. Tablets come in 4:3, 16:10 and 16:9; the camera always shows the whole
// safe rectangle (SAFE, 4:3, at z = 0) and whatever the wider screens add on the
// sides is background only. Everything a lesson places is in safe-area units:
// x in [-6, 6], y in [-4.5, 4.5], ground at GROUND. ?safe draws the rectangle.

import * as THREE from "three";
import { Muzyka } from "./muzyka.js";
import { losuj, warianty } from "./warianty.js";
import { v } from "./v.js";
import { Lalka } from "./lalka.js";
import { Sfx } from "./sfx.js";
import { zbudujTlo, czas as bgClock, zginanieTla } from "./tlo.js";
import { probkuj, wstega, material as olowekMaterial } from "./olowek.js";
import * as E from "./efekty.js";
import { ruszUbiory } from "./ubior.js";
import * as U from "./ubior.js";
if (new URLSearchParams(location.search).has("sztywnetlo")) zginanieTla.value = 0;   // A/B: the old shearing grass

export const SAFE = { w: 12, h: 9 };
export const GROUND = -3.3;
// nothing a lesson draws goes above this: the band over it belongs to the phase icons (HUD, at most ~10% of the
// screen height, sized in vh so a small tablet does not get bigger icons). Digits, equations, bubbles and
// arrows that would reach higher are moved down by the engine itself.
export const SUFIT = 3.3;
export const ASPECT_MIN = 4 / 3, ASPECT_MAX = 16 / 9;
const CAM_Z = 7.2;

// A shot moves the FRAME, not the camera: position.x/y (set by shots, read everywhere as "where the camera looks")
// becomes an off-axis shift of the projection, the eye stays at x = y = 0. Moving the eye made the puppets (z 0)
// and the background movers slide against the painted plate (z -9) - parallax a cut-out theatre must not have.
// The shift is held inside `ramka` (the design frame at z 0, where the plate ends) at every zoom, in every move: a
// flight that dips its zoom half way showed the sky colour past the plate's edge.
function kadrBezParalaksy(cam, ramka) {
  const oko = new THREE.Vector3(), up = cam.updateProjectionMatrix.bind(cam);
  const przesun = () => {
    const R = ramka(), hh = cam.position.z * Math.tan(cam.fov * Math.PI / 360) / cam.zoom, hw = hh * cam.aspect;
    const px = Math.max(-Math.max(0, R.w / 2 - hw), Math.min(Math.max(0, R.w / 2 - hw), cam.position.x));
    const py = Math.max(-Math.max(0, R.h / 2 - hh), Math.min(Math.max(0, R.h / 2 - hh), cam.position.y));
    const e = cam.projectionMatrix.elements, sx = e[0] * px / cam.position.z, sy = e[5] * py / cam.position.z;
    if (e[8] !== sx || e[9] !== sy) { e[8] = sx; e[9] = sy; cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert(); }
  };
  cam.updateProjectionMatrix = () => { up(); przesun(); };
  cam.updateMatrixWorld = () => {
    cam.matrix.compose(oko.set(0, 0, cam.position.z), cam.quaternion, cam.scale);
    cam.matrixWorld.copy(cam.matrix); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    przesun();
  };
  cam.updateWorldMatrix = () => cam.updateMatrixWorld();
}
const ZAKRESLACZ = "#ff5a1f";          // pencil annotations: a bold saturated orange that reads on grass, sky and wood
const PARAMS = new URLSearchParams(location.search);
const FRESH = { cache: "no-store" };

// ?perf: every frame longer than 50 ms listed in a corner with what appeared just then - new textures (an upload),
// new shader programs (a compile), new geometries - and the line being said; a tablet's hitches read off a screenshot
const PERF = PARAMS.has("perf");
let perfEl = null, perfPrzed = null, perfIle = 0, perfMax = 0;
const perfLista = [];
function zmierz(S, ms) {
  const inf = S.renderer.info, teraz = { tex: inf.memory.textures, geo: inf.memory.geometries, prog: inf.programs?.length || 0 };
  const p = perfPrzed; perfPrzed = teraz;
  if (!p || ms < 50 || ms > 5000) return;                                      // > 5 s: the tab was hidden
  perfIle++; perfMax = Math.max(perfMax, ms);
  const linia = window.gra?.dziennik?.slice(-1)[0]?.[0]?.replace("line.", "") || "";
  perfLista.unshift(`${Math.round(ms)} ms  tex+${teraz.tex - p.tex} prog+${teraz.prog - p.prog} geo+${teraz.geo - p.geo}  ${linia}`);
  perfLista.length = Math.min(perfLista.length, 12);
  if (!perfEl) { perfEl = document.createElement("pre"); perfEl.style.cssText = "position:fixed;left:6px;top:40px;z-index:99;margin:0;padding:6px 8px;background:rgba(0,0,0,.6);color:#9f9;font:11px/1.35 monospace;pointer-events:none;border-radius:6px"; document.body.appendChild(perfEl); }
  perfEl.textContent = [`zaciecia > 50 ms: ${perfIle}, najdluzsze ${Math.round(perfMax)} ms`, ...perfLista].join("\n");
}

// one texture per file for the whole game: loaded (and sent to the GPU) once, shared by every sticker of it
const loader = new THREE.TextureLoader(), TEKSTURY = new Map();
export function texture(url) {
  // decode() before resolving: the image is decoded now, off the frame, not at its first draw
  if (!TEKSTURY.has(url)) TEKSTURY.set(url, new Promise((ok, bad) => loader.load(url.startsWith("data:") ? url : v(url), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; const d = t.image?.decode?.(); (d ? d.catch(() => {}) : Promise.resolve()).then(() => ok(t)); }, undefined, (e) => { TEKSTURY.delete(url); bad(e); })));
  return TEKSTURY.get(url);
}
const easeInOut = (s) => s * s * (3 - 2 * s);
const easeOutBack = (s) => { const c = 1.7; return 1 + (c + 1) * Math.pow(s - 1, 3) + c * Math.pow(s - 1, 2); };   // a small overshoot

// stickers with a handle, and the side it is drawn on (1 = right): a carried one turns its handle to the paw
const UCHO = { kubek: 1, kubek_czerwony: 1, filizanka: 1, kubek_lyzka: 1 };
const KADENCJA = 1.5;                  // a capped walk steps at most this many times its natural speed, then glides
export class Stage {
  constructor(container, speech) {
    this.container = container; this.speech = speech;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true, preserveDrawingBuffer: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9fd0f0);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(0, 0, CAM_Z);
    kadrBezParalaksy(this.camera, () => this.design(0));
    this.puppets = {}; this.objects = []; this.targets = []; this.tweens = []; this.bg = []; this.frame = 0; this.camZ = CAM_Z; this.warstwy = [];
    // Nothing just vanishes (a global rule, 2026-10-30): a thing of the scene (every handle in `objects` - stickers,
    // the ten frame, dominoes, cards) taken off the stage slides down out of the frame first. Its handle is gone at
    // once (taps, counts and zones never see it again), only the picture is still leaving; zejscia() waits for it.
    this.wychodza = new Set();
    this.objects.push = (...hs) => { for (const h of hs) if (h?.mesh?.isObject3D) h.mesh.userData.zejdz = true; return Array.prototype.push.apply(this.objects, hs); };
    // the thing itself is removed at once (re-parenting into a paw calls remove too); a copy sharing its geometry and
    // materials does the leaving, started only if nobody took the thing a moment later
    const usunTeraz = this.scene.remove.bind(this.scene);
    this.scene.remove = (...objs) => {
      for (const o of objs) {
        const wyjdz = o?.userData?.zejdz && o.parent === this.scene && o.visible !== false;
        usunTeraz(o);
        if (wyjdz) queueMicrotask(() => {
          if (o.parent) return;
          const kopia = o.clone(); kopia.userData.zejdz = false; this.scene.add(kopia);
          this.zejdz(kopia, () => usunTeraz(kopia));
        });
      }
      return this.scene;
    };
    this.pauza = false; this.panorama = null; this.otoczenie = []; this.dymki = [];
    this.pending = null; this.lastHit = null; this.dragSet = null; this.drag = null;
    this.raycaster = new THREE.Raycaster();
    // sound effects: ?cicho mutes them; a hop and a clap come with the puppets' animations
    this.sfx = new Sfx({ wycisz: PARAMS.has("cicho") }); this.sfx.wczytaj();
    this.muzyka = new Muzyka({ wycisz: PARAMS.has("cicho"), sfx: this.sfx });     // the place's music and the weather (muzyka.js)
    Lalka.naGraj = (L, nazwa) => { if (L.bezDzwieku) return; if (nazwa === "Podskok") this.sfx.graj("hop"); else if (nazwa === "Brawo") this.sfx.graj("clap", { glosnosc: 0.8 }); };
    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize); this.resize();
    // a finger drawing on the stage (mechaniki.js: tracing, cutting) takes every pointer while it is set; its down()
    // returns false for a touch it does not want (a tap on a character still repeats the instruction then)
    const naScenie = (e) => { const w = this.worldAt(this.ndc(e)); return [w.x, w.y]; };
    this.renderer.domElement.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if (this.palec && this.palec.down?.(naScenie(e)) !== false) { this.palecWcisniety = true; try { this.renderer.domElement.setPointerCapture(e.pointerId); } catch { /* ignore */ } return; }
      if (!this.dragStart(e)) this.pointer(e);
    });
    this.renderer.domElement.addEventListener("pointermove", (e) => { if (this.palec && this.palecWcisniety) return this.palec.move?.(naScenie(e)); this.dragMove(e); });
    const puszczony = () => { if (this.palecWcisniety) { this.palecWcisniety = false; return this.palec?.up?.(); } this.dragEnd(); };
    this.renderer.domElement.addEventListener("pointerup", puszczony);
    this.renderer.domElement.addEventListener("pointercancel", puszczony);
    if (PARAMS.has("safe")) this.showSafe();
    this.last = performance.now(); this.lastRaf = this.last;
    this.running = true;
    const loop = (t) => { if (!this.running) return; this.lastRaf = t; this.tick(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    // a hidden pane gets no animation frames; keep tweens and speech moving anyway (real time, 20 Hz)
    this.watchdog = setInterval(() => { const now = performance.now(); if (now - this.lastRaf > 300) this.tick(now); }, 50);
  }

  // ------------------------------------------------------------------ camera and safe area
  // The canvas keeps an aspect between 4:3 and 16:9 and sits centred; a wider or a
  // taller screen gets black bars (the container's background) where nothing is drawn.
  resize() {
    const W = this.container.clientWidth || 800, H = this.container.clientHeight || 600;
    const aspect = Math.min(ASPECT_MAX, Math.max(ASPECT_MIN, W / H));
    const w = Math.round(W / H > aspect ? H * aspect : W), h = Math.round(W / H > aspect ? H : W / aspect);
    this.renderer.setSize(w, h, false);
    const c = this.renderer.domElement.style;
    c.width = w + "px"; c.height = h + "px"; c.position = "absolute"; c.left = Math.round((W - w) / 2) + "px"; c.top = Math.round((H - h) / 2) + "px";
    this.camera.aspect = aspect;
    const h0 = SAFE.h * 1.02;                                             // 4:3 or wider: the safe rect fits by height
    this.camera.fov = 2 * Math.atan(h0 / 2 / CAM_Z) * 180 / Math.PI;
    this.camera.updateProjectionMatrix();
    this.frameRect = { x: (W - w) / 2, y: (H - h) / 2, w, h };
    E.dopasujNakladke(this);
  }
  visible(z = 0) {                                                        // visible rectangle at depth z
    const h = 2 * (CAM_Z - z) * Math.tan(this.camera.fov / 2 * Math.PI / 180);
    return { w: h * this.camera.aspect, h };
  }
  // the DESIGN rectangle at depth z: what a 16:9 landscape tablet sees around the safe area.
  // The background is sized to this, never to the actual viewport, so the plate (and the
  // ground, the blanket, the table) keep one fixed relation to the puppets on every screen;
  // a narrower screen simply crops the sides.
  design(z = 0) {
    const h0 = SAFE.h * 1.02, fov = 2 * Math.atan(h0 / 2 / CAM_Z);
    const h = 2 * (CAM_Z - z) * Math.tan(fov / 2);
    return { w: h * ASPECT_MAX, h };
  }
  showSafe() {
    const g = new THREE.BufferGeometry().setFromPoints([-6, 6, 6, -6, -6].map((x, i) => new THREE.Vector3(x, [-4.5, -4.5, 4.5, 4.5, -4.5][i], 0.01)));
    this.scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xff3030 })));
  }
  toScreen(v) {                                                            // world -> css pixels in the container
    const p = v.clone().project(this.camera), r = this.renderer.domElement;
    return { x: (p.x + 1) / 2 * r.clientWidth, y: (1 - p.y) / 2 * r.clientHeight };
  }

  // ------------------------------------------------------------------ loop
  tick(t) {
    if (PERF) zmierz(this, t - this.last);
    const dt0 = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.frame++;
    if (this.pauza) { this.rysuj(); return; }                               // paused: the picture stands still
    const dt = dt0;
    E.ruszOtoczenie(this, dt, t); E.ruszNakladke(this, dt); E.ruszCzastki(this, dt, t); E.ruszNoc(this, t);
    for (const d of this.dymki) d.za();
    bgClock.value += dt;
    for (const L of Object.values(this.puppets)) {
      if (L.lustro) {                                                         // a reflection (mechaniki2.js odbicie) moves as its original does
        const O = L.lustro; L.akcja = O.akcja; L.ta = O.ta; L.przejscie = O.przejscie; L.t = O.t - dt; L.pozaSurowa = O.pozaSurowa; L.mikro = O.mikro;   // one clock: a blend timed by the original's clock exploded in the reflection's (streaks) L.kierunekBazowy = O.kierunekBazowy;
        L.mowi = O.mowi; L.amplituda = O.amplituda; L.wiz = O.wiz; L.celSpojrzenia = O.celSpojrzenia; L.korzen.position.x = O.korzen.position.x;
      }
      L.update(dt);
      if (L.cien) {                                                           // the shadow stays on the ground under the feet
        // L.podloga: the ground of a puppet walking into the picture (stepping stones): higher up = further away
        const g = L.podloga ?? GROUND, lift = Math.max(0, L.korzen.position.y - g);
        if (L.cienDy === undefined) L.cienDy = L.cien.position.y - GROUND;
        L.cien.visible = L.korzen.visible; L.cien.position.x = L.korzen.position.x; L.cien.position.y = g + L.cienDy;
        const k = Math.max(0.4, 1 - lift * 0.8); L.cien.scale.set(k * L.korzen.scale.x, k * L.korzen.scale.y, 1); L.cien.material.opacity = L.bezCienia ? 0 : 0.85 * k;
      }
    }
    ruszUbiory(this);                                                       // after the legs bent this frame
    // carried things follow the paw (or the back) they sit in, drawn over the one carrying them
    for (const L of Object.values(this.puppets)) {
      const h = L.trzyma; if (!h) continue;
      L.korzen.updateMatrixWorld(true);
      const { p, na, kier, widok } = L.uchwyt();
      const ro = L.korzen.children[0] ? (() => { let r = 20; L.korzen.traverse((o) => { if (o.isMesh) r = o.renderOrder; }); return r; })() : 20;
      if (na === "plecy") { h.mesh.position.set(p.x, p.y + h.base * 0.35, L.korzen.position.z + 0.2); h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = ro + 1; }); continue; }
      // the paw holds its near edge: the thing sits a little in front (profile) or beside (front), under the paw
      const dx = kier * h.base * (widok === "profil" ? 0.3 : 0.34), dy = widok === "profil" ? -h.base * 0.05 : -h.base * 0.18;
      if (UCHO[h.name] && h.icon) { const z = UCHO[h.name] === kier ? -1 : 1; if (Math.sign(h.icon.scale.x) !== z) { h.icon.scale.x *= -1; h.icon.material.side = THREE.DoubleSide; } }   // the handle towards the paw
      h.mesh.position.set(p.x + dx, p.y + dy, L.korzen.position.z + (widok === "profil" ? 0.02 : 0.07));
      h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = ro + 0.5; });          // in front of its carrier, never hidden behind
    }
    for (const tw of this.tweens.slice()) {
      tw.t += dt; const s = (tw.ease || easeInOut)(Math.min(1, tw.t / tw.d));
      tw.step(s);
      if (tw.t >= tw.d) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.done(); }
    }
    for (const o of this.objects) if (o.pulse && !o.bumping) o.mesh.scale.setScalar(o.base * (1 + 0.08 * Math.sin(t / 150)));
    if (this.speech) this.speech.tick(t);
    this.rysuj();
  }
  // the world, then the overlay (transitions, countdown, confetti) over it
  // then the extra layers (`warstwy`: an event illustration in its own perspective scene) on top of everything; a layer
  // may render something to a texture first (`przed`: the speaker's live badge)
  rysuj() {
    for (const w of this.warstwy) w.przed?.();
    this.renderer.render(this.scene, this.camera);
    if (this.nak && this.nak.scena.children.length) {
      this.renderer.autoClear = false; this.renderer.clearDepth();
      this.renderer.render(this.nak.scena, this.nak.kam); this.renderer.autoClear = true;
    }
    if (this.warstwy.length) {
      this.renderer.autoClear = false;
      for (const w of this.warstwy) { this.renderer.clearDepth(); this.renderer.render(w.scena, w.kam); }
      this.renderer.autoClear = true;
    }
  }
  tween(d, step, ease = null) { return new Promise((done) => this.tweens.push({ t: 0, d, step, done, ease })); }
  // a thing leaves: it lifts a hair, then slides down past the bottom of the frame, turning a little; things leaving
  // together go one after another from the left
  zejdz(o, potem) {
    this.wychodza.add(o);
    const teraz = performance.now(), rzut = (this._rzutZejsc && teraz - this._rzutZejsc.t < 30) ? this._rzutZejsc : (this._rzutZejsc = { t: teraz, n: 0 });
    const opoz = Math.min(0.3, rzut.n++ * 0.05);
    if (rzut.n === 1) this.sfx.graj("whoosh", { glosnosc: 0.45 });
    const v = this.visible(0), dol = this.camera.position.y - v.h / 2 / this.camera.zoom;
    const b = new THREE.Box3().setFromObject(o);
    const y0 = o.position.y, y1 = y0 + (dol - b.max.y - 0.3), r0 = o.rotation.z, r1 = r0 + (o.position.x < this.camera.position.x ? -0.35 : 0.35);
    const d = PARAMS.has("szybko") ? 0.12 : 0.55;
    const p = this.tween(d + opoz, (s) => {
      const t = Math.max(0, (s * (d + opoz) - opoz) / d), spad = t > 0.15 ? ((t - 0.15) / 0.85) ** 2 : 0;
      o.position.y = y0 + 0.15 * Math.sin(Math.min(1, t / 0.15) * Math.PI / 2) * (1 - spad) + (y1 - y0) * spad;   // a little hop up, then down
      o.rotation.z = r0 + (r1 - r0) * spad;
    }).then(() => { this.wychodza.delete(o); potem(); });
    this._zejscia = (this._zejscia || new Set()).add(p); p.then(() => this._zejscia.delete(p));
  }
  async zejscia() { await null; await Promise.all([...(this._zejscia || [])]); }   // after the copies have started
  // things grow in from nothing with a little overshoot; not awaited by the caller, so a row appears sticker by sticker
  appear(h, cicho = false) {
    const m = this.meshOf(h), base = h.base ?? 1;
    if (!cicho) this.sfx.graj("pop", { tempo: 0.9 + Math.random() * 0.25 });
    h.bumping = true; m.scale.setScalar(0.001);
    return this.tween(0.38, (s) => { const q = base * Math.max(0.001, s); m.scale.set(q, q, h.korzen ? 1 : q); }, easeOutBack)
      .then(() => { m.scale.set(base, base, h.korzen ? 1 : base); h.bumping = false; });
  }
  // touch feedback: the tapped thing pops (scale up and back); a wrong answer also shakes
  async bump(h, amount = 0.25, dzwiek = true) {
    const m = this.meshOf(h), k = h.korzen ? 0.08 : amount;
    if (dzwiek) this.sfx.graj(h.dzwiek || "tap");
    if (h.bumping) return;
    // a puppet keeps its own scale (a reflection is flipped, one further up the bank smaller): set to base, the
    // reflection stood up and vanished behind the fox
    const s0 = h.korzen ? m.scale.clone() : null, base = h.base ?? 1;
    h.bumping = true;
    await this.tween(0.28, (s) => { const q = 1 + k * Math.sin(s * Math.PI); if (s0) m.scale.set(s0.x * q, s0.y * q, s0.z); else m.scale.setScalar(base * q); });
    if (s0) m.scale.copy(s0); else m.scale.setScalar(base); h.bumping = false;
  }
  async shake(h) {
    // an offset on top of wherever it is: restoring the x of the shake's start pulled a thing sent home meanwhile back
    // under the wrong place (an owlet landed on another one)
    const m = this.meshOf(h); let o = 0;
    this.sfx.graj("wrong");
    await this.tween(0.4, (s) => { const n = 0.12 * Math.sin(s * Math.PI * 4) * (1 - s); m.position.x += n - o; o = n; });
    m.position.x -= o;
  }
  wait(s) { return new Promise((ok) => setTimeout(ok, s * 1000)); }

  // ------------------------------------------------------------------ background
  async background(name) {
    if (this.bgName === name) return false;                                // same scenery: leave it as it is
    this.bgName = name;
    for (const m of this.bg) this.scene.remove(m);
    this.otoczenie = []; this.panorama = null; E.czastki(this, null); E.koniecNocy(this);   // weather and night belong to the place
    if (typeof name !== "object") this.muzyka.miejsce(name);             // an insert keeps the place's music (the practice stage sets its own)
    if (typeof name === "object") { await E.plansza(this, name); this.bgName = name.id || this.bgName; return true; }   // an insert on a plain colour
    const t = await this.tlo(name);
    for (const m of t.meshes) this.scene.add(m);
    this.bg = t.meshes;
    if (t.panorama) { this.panorama = { ...t.panorama, teraz: 0 }; E.ustawObszar(this, 0); }
    return true;
  }
  // a scenery is built once per lesson and kept (coming back to it is only a swap - rebuilding the panorama's 143
  // textures every time stuttered on the iPad); built into its own group, so it can be made ahead (prepare)
  tlo(name) {
    this.tla = this.tla || {};
    if (!this.tla[name]) this.tla[name] = (async () => {
      const grupa = new THREE.Group(), Z_TLA = -9;
      const info = await zbudujTlo(grupa, (z) => this.design(z), { katalog: `/game/assets/backgrounds/${name}/`, odlegloscKamery: CAM_Z, srodekY: 0.6, zTla: Z_TLA });
      const meshes = grupa.children.slice(); for (const m of meshes) grupa.remove(m);
      // a background wider than the design frame is a panorama: areas the scenery slides between (E.pan)
      let panorama = null;
      const Wp = info.plyta.geometry.parameters.width, pw = this.design(Z_TLA).w;
      if (Wp > pw * 1.25) {
        const n = info.obszary || Math.max(2, Math.round((Wp - pw) / (pw * 0.65)) + 1), zakres = (Wp - pw) / 2;
        panorama = { n, fPrzod: CAM_Z / (CAM_Z - Z_TLA), przesuniecie: (k) => zakres - k * (2 * zakres) / (n - 1) };
        for (const m of meshes) m.userData.pan = { x0: m.position.x, f: (CAM_Z - m.position.z) / (CAM_Z - Z_TLA) };
      }
      return { meshes, panorama };
    })();
    this.tla[name].catch(() => { delete this.tla[name]; });          // a scenery that failed is tried again next time
    return this.tla[name];
  }
  // everything a lesson will show, loaded and sent to the GPU before it starts (a loading screen is fine; a stutter
  // in a transition is not): its sceneries, stickers, garments, the transitions' bands, the characters
  async prepare({ tla = [], obiekty = [], ubrania = [], obrazy = [] } = {}, postep = () => {}) {
    const zadania = [...tla.map((n) => () => this.tlo(n)), ...obrazy.map((u) => () => texture(u).catch(() => null)), ...obiekty.flatMap(warianty).map((n) => () => texture(`/game/assets/objects/${n}.webp`).catch(() => null)), () => U.wczytajUbrania(ubrania)];
    let zrobione = 0;
    for (const z of zadania) { await z(); postep(++zrobione / (zadania.length + 1)); }
    E.przygotujGlowy(this);                                          // the transitions' head badges, with faces
    const tex = new Set(E.teksturyEfektow());
    const zbierz = (o) => o.traverse((m) => { const map = m.material?.map || m.material?.uniforms?.mapa?.value || m.material?.uniforms?.map?.value; if (map?.isTexture) tex.add(map); });
    for (const n of tla) for (const m of (await this.tlo(n)).meshes) zbierz(m);
    for (const L of Object.values(this.puppets)) zbierz(L.korzen);
    for (const p of TEKSTURY.values()) { const t = await p.catch(() => null); if (t) tex.add(t); }
    for (const t of await U.wczytajUbrania(ubrania)) tex.add(t);
    for (const t of tex) this.renderer.initTexture(t);
    // the shaders too: one render of each scenery, off screen
    for (const n of tla) { const g = new THREE.Group(); for (const m of (await this.tlo(n)).meshes) g.add(m); this.scene.add(g); this.renderer.compile(this.scene, this.camera); this.scene.remove(g); for (const m of g.children.slice()) g.remove(m); }
    postep(1);
  }

  // ------------------------------------------------------------------ puppets
  // height: the character's natural size, the same in every lesson - meta.json "wysokosc" in scene units (Fox 3.6,
  // Squirrel three quarters of him); a lesson's height only for a character with none of its own
  async puppet(name, { x = 0, side = "left", height = null } = {}) {
    const meta = await fetch(v(`/game/assets/characters/${name}/meta.json`), { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    height = meta.wysokosc ?? height ?? 3.6;
    const L = await Lalka.wczytaj(`/game/assets/characters/${name}/`, { strona: side === "left" ? "lewo" : "prawo", wysokosc: height });
    L.meta = meta;
    L.korzen.position.set(x, GROUND, 0);
    L.korzen.visible = false; L.home = x; L.name = name;
    L.cien = this.shadow(height * 0.42);
    // puppets never interleave: no depth test, every piece sorted by z within the puppet,
    // and the whole puppet on its own render layer (the moving one in front)
    L.korzen.traverse((o) => { if (o.isMesh) { o.material.depthTest = false; o.material.depthWrite = false; } });
    this.scene.add(L.korzen, L.cien); this.puppets[name] = L;
    this.layer(L, false);
    return L;
  }
  // every puppet on a layer of its own, in the order they were last in front (the one brought forward on top, 30): two
  // overlapping puppets never interleave their pieces - one is wholly in front of the other (all on 20 they did)
  layer(L, front) {
    const kol = (this.kolejnoscLalek ||= []).filter((o) => o !== L);
    if (front) kol.push(L); else kol.unshift(L);
    this.kolejnoscLalek = kol;
    kol.forEach((o, i) => { const ro = front && o === L ? 30 : 20 + i * 0.5; o.korzen.traverse((m) => { if (m.isMesh) m.renderOrder = ro; }); });
  }
  bringToFront(L) { this.layer(L, true); }
  // a contact shadow with a pencil feel: short diagonal strokes inside a slightly wobbly ellipse
  shadow(w) {
    if (!this.shadowTex) {
      const c = document.createElement("canvas"); c.width = 512; c.height = 160; const ctx = c.getContext("2d");
      const cx = 256, cy = 80, rx = 236, ry = 62;
      ctx.save();
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 36) {             // wobbly outline, like a hand-drawn ellipse
        const j = 1 + 0.04 * Math.sin(a * 5.3) + 0.03 * Math.sin(a * 11.1 + 1);
        ctx.lineTo(cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j);
      }
      ctx.closePath(); ctx.clip();
      ctx.fillStyle = "rgba(40,30,20,0.10)"; ctx.fillRect(0, 0, 512, 160);        // a faint base
      ctx.strokeStyle = "rgba(40,30,20,0.42)"; ctx.lineCap = "round";
      let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 70; i++) {                                              // hatching, denser in the middle
        const t = i / 70, x = 20 + t * 472, y0 = 8 + rnd() * 30, y1 = 152 - rnd() * 30;
        const s = 1 - Math.abs(t - 0.5) * 1.1;
        ctx.lineWidth = 2.5 + rnd() * 2; ctx.globalAlpha = 0.35 + s * 0.55;
        ctx.beginPath(); ctx.moveTo(x - 18 + rnd() * 6, y1); ctx.lineTo(x + 18 + rnd() * 6, y0); ctx.stroke();
      }
      ctx.restore();
      this.shadowTex = new THREE.CanvasTexture(c); this.shadowTex.colorSpace = THREE.SRGBColorSpace;
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 2, w * 0.62), new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false, opacity: 0.85 }));
    m.position.set(0, GROUND + 0.02, -0.05); m.renderOrder = 5; m.visible = false;
    return m;
  }
  async enter(name, from = "left") {
    const L = this.puppets[name]; if (!L) throw new Error("no puppet " + name);
    const edge = this.visible(0).w / 2 + 1.2;
    const x0 = from === "left" ? -edge : edge;
    L.korzen.position.x = x0; L.korzen.visible = true; this.bringToFront(L);
    L.korzen.position.y = GROUND; L.korzen.scale.setScalar(1); L.podloga = null;   // back on the front ground (after walking into the picture)
    L.patrz(from === "left" ? "prawo" : "lewo"); L.graj("Chod", true);
    await this.walkLine(L, x0, L.home);
    L.patrz("przod"); L.spoczynek();
  }
  // walk to x (profile puppet), face the front there; the caller walks back the same way
  async walkTo(name, x) {
    const L = this.puppets[name]; if (!L) return;
    const x0 = L.korzen.position.x; if (Math.abs(x - x0) < 0.05) return;
    this.bringToFront(L);
    L.patrz(x > x0 ? "prawo" : "lewo"); L.graj("Chod", true);
    await this.walkLine(L, x0, x);
    L.patrz("przod"); L.spoczynek();
  }
  // walk along points on the ground [x, y]: y above GROUND is further into the picture, so the puppet gets smaller
  // (glebia per unit) and its shadow goes along (L.podloga); skok > 0 hops from point to point (stepping stones)
  async przejdz(name, punkty, { skok = 0, glebia = 0.1 } = {}) {
    const L = this.puppets[name]; if (!L) return;
    this.bringToFront(L); L.graj("Chod", true);
    for (const [x1, y1] of punkty) {
      const x0 = L.korzen.position.x, y0 = L.podloga ?? GROUND, dl = Math.hypot(x1 - x0, y1 - y0); if (dl < 0.02) continue;
      if (Math.abs(x1 - x0) > 0.02) L.patrz(x1 > x0 ? "prawo" : "lewo");
      let last = 0;
      const nat = dl / L.predkoscChodu + 0.15, d = skok ? 0.45 : Math.min(nat, 0.7 + dl * 0.3), k = skok ? 1 : Math.min(1, KADENCJA * d / nat);   // as walkLine
      await this.tween(d, (q) => {
        const gy = y0 + (y1 - y0) * q; L.podloga = gy;
        L.korzen.position.x = x0 + (x1 - x0) * q; L.korzen.position.y = gy + skok * Math.sin(Math.PI * q);
        L.korzen.scale.setScalar(1 - glebia * (gy - GROUND));
        L.idz((q - last) * dl * k); last = q;
      });
      if (skok) this.sfx.graj("tap");
    }
    L.patrz("przod"); L.spoczynek();
  }
  // move a walking puppet from x0 to x1 at its stride speed (gentle start and stop); the stride's phase
  // follows the distance covered, so a planted foot stays where it stands
  async walkLine(L, x0, x1) {
    // the natural pace (stride / stance) made short legs crawl - the owl took 23 s to come in, the fox 7: the walk is
    // capped, and the steps go at most KADENCJA times their natural speed - the rest of the way the feet slide a little
    // (quick tiny steps looked odd; a glide reads as a cartoon walk)
    const dist = Math.abs(x1 - x0), nat = dist / L.predkoscChodu + 0.25, d = Math.min(nat, 0.9 + dist * 0.22), k = Math.min(1, KADENCJA * d / nat);
    let last = x0; L.droga = true;
    await this.tween(PARAMS.has("szybko") ? 0.2 : d, (s) => { const x = x0 + (x1 - x0) * s; L.idz((x - last) * k); last = x; L.korzen.position.x = x; });
    L.droga = false;
  }
  // where a thing is now (a sticker, a sign, a zone or a puppet's head), for a gaze
  pointOf(h) {
    const v = new THREE.Vector3();
    if (h?.korzen) { h.korzen.getWorldPosition(v); v.y += 0.8 * h.wysokosc; return v; }
    const m = h?.mesh || h; if (!m?.getWorldPosition) return null;
    return m.getWorldPosition(v);
  }
  // puppets look at a thing (null = back to the front); `for` seconds, then back on their own
  lookAt(who, h, { for: na = null } = {}) {
    const list = who ? [this.puppets[who]].filter(Boolean) : Object.values(this.puppets);
    for (const L of list) L.patrzNa(h ? () => this.pointOf(h) : null, na);
  }
  async play(name, anim, { face = "przod", loop = false } = {}) {
    const L = this.puppets[name]; if (!L) return;
    L.patrz(face); L.graj(anim, loop);
    if (!loop) await new Promise((ok) => { L.naKoniec = ok; });
  }
  mood(name, { eyes, mouth } = {}) { const L = this.puppets[name]; if (!L) return; if (eyes) L.emocja.oczy = eyes; if (mouth) L.emocja.usta = mouth; }

  // ------------------------------------------------------------------ objects
  // a sticker: the icon with its baked white die-cut outline, so a green pear reads on green grass
  // obraz: a picture of its own (a data: URL made in the page, e.g. the friends' heads) instead of objects/<name>.webp
  // dzwiek: the thing's own sound (an instrument), heard when it is pointed at and when its row plays (rytm.js)
  async object(name, { x = 0, y = 1.2, size = 1.1, sticker = false, z = 0.4, label = null, obraz = null, dzwiek = null, cicho = false, plik = null } = {}) {
    plik = obraz ? null : plik || losuj(name);                       // which variant's file (warianty.js); `plik` forces one
    const g = new THREE.Group(); g.position.set(x, y, z);
    if (sticker) {
      const c = document.createElement("canvas"); c.width = c.height = 512; const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(16, 16, 480, 480, 88); ctx.fill();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 1.18), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      m.position.z = -0.01; g.add(m);
    }
    const mapa = await texture(obraz || `/game/assets/objects/${plik}.webp`), iw = mapa.image.width, ih = mapa.image.height;
    // a non-square picture (a garment) keeps its proportions inside the unit square
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(iw >= ih ? 1 : iw / ih, iw >= ih ? ih / iw : 1), new THREE.MeshBasicMaterial({ map: mapa, transparent: true, alphaTest: 0.05, depthWrite: false }));
    g.add(icon);
    if (label) g.add(this.textMesh(label, { y: -0.72, size: 0.32 }));
    g.traverse((o) => { if (o.isMesh) o.renderOrder = 10; });                 // the foreground draws after every background prop
    const handle = { mesh: g, icon, name, plik, base: size, size0: size, home: { x, y }, zone: null, kind: "object", pulse: false, dzwiek,
      remove: () => { this.scene.remove(g); this.objects.splice(this.objects.indexOf(handle), 1); this.untarget(handle); if (handle.zone) handle.zone.take(handle, false); },
      highlight: (on) => { handle.pulse = on; if (!on) g.scale.setScalar(handle.base); },
      moveTo: (nx, ny, d = 0.5) => { const x0 = g.position.x, y0 = g.position.y; if (Math.hypot(nx - x0, ny - y0) > 2.5) this.sfx.graj("whoosh", { glosnosc: 0.7 }); E.smuga(this, x0, y0, nx, ny, d); return this.tween(d, (s) => { g.position.x = x0 + (nx - x0) * s; g.position.y = y0 + (ny - y0) * s; }); } };
    this.scene.add(g); this.objects.push(handle);
    this.appear(handle, cicho);                      // cicho: no pop (a note joining a played row has its own sound)
    for (const L of Object.values(this.puppets)) if (L.korzen.visible && !L.celSpojrzenia) L.patrzNa(() => this.pointOf(handle), 1.1);   // a glance at what just appeared
    return handle;
  }
  // a sign or a word drawn on a card (=, <, >, a label)
  textMesh(text, { size = 1, y = 0, color = "#222", bg = "#fff" } = {}) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 512; const ctx = c.getContext("2d");
    if (bg) { ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(16, 16, 480, 480, 80); ctx.fill(); }
    ctx.fillStyle = color; ctx.font = "bold 340px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 280);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));   // no depth: a transparent corner must not cut out the grass behind
    m.position.y = y; return m;
  }
  async sign(text, { x = 0, y = 1.2, size = 1.1 } = {}) {
    const m = this.textMesh(text, { size }); m.position.set(x, y, 0.4); m.renderOrder = 10;
    const handle = { mesh: m, name: text, base: size, kind: "sign", pulse: false,
      remove: () => { this.scene.remove(m); this.objects.splice(this.objects.indexOf(handle), 1); this.untarget(handle); },
      highlight: (on) => { handle.pulse = on; if (!on) m.scale.setScalar(1); },
      moveTo: (nx, ny, d = 0.5) => { const x0 = m.position.x, y0 = m.position.y; return this.tween(d, (s) => { m.position.x = x0 + (nx - x0) * s; m.position.y = y0 + (ny - y0) * s; }); } };
    this.scene.add(m); this.objects.push(handle);
    this.appear(handle);
    return handle;
  }
  // a zone: an area objects are sorted into - a dashed outline, optionally drawn over a
  // container picture (a basket, a box). Items inside are laid out in rows by their real
  // widths, a little smaller than loose (0.8), so even the big ones fit.
  // `obrys`: a polygon (points in units, around the zone's centre) drawn dashed instead of the rounded rectangle - a
  // place for a triangle looks like a triangle; it is drawn over what already lies there (a window on a wall)
  async zone({ x = 0, y = -2.2, w = 3, h = 2.2, color = "#ffffff", image = null, name = "zone", obrys = null, niewidoczna = false, rodzaj = "stoi" } = {}) {
    const g = new THREE.Group(); g.position.set(x, y, 0.3);
    if (niewidoczna) {                                                      // a painted place (ctx.miejsca): the picture shows where, no dashes
      const handle = { mesh: g, name, kind: "zone", x, y, w, h, base: 1, pulse: false, items: [], niewidoczna: true, rodzaj,
        contains: (px, py) => Math.abs(px - x) < w / 2 + 0.25 && Math.abs(py - y) < h / 2 + 0.35,
        // side by side along the place: standing on its lower part, hanging from its top, or lying in its middle
        layout: () => {
          const n = handle.items.length;
          handle.items.forEach((it, i) => {
            const tx = x - w / 2 + (i + 0.5) * w / n, b = this.bounds(it), dol = it.mesh.position.y - b.bottom, gora = b.top - it.mesh.position.y;
            const ty = rodzaj === "stoi" ? y - h * 0.3 + dol : rodzaj === "wisi" ? y + h * 0.1 - gora : y;
            it.moveTo(tx, ty, 0.2);
          });
        },
        put: (it) => { if (it.zone && it.zone !== handle) it.zone.take(it); if (!handle.items.includes(it)) handle.items.push(it); it.zone = handle; handle.layout(); },
        take: (it, relayout = true) => { const i = handle.items.indexOf(it); if (i >= 0) handle.items.splice(i, 1); it.zone = null; if (relayout) handle.layout(); },
        highlight: (on) => { handle.pulse = false; for (const it of handle.items) it.highlight?.(on); },
        remove: () => { this.scene.remove(g); const i = this.objects.indexOf(handle); if (i >= 0) this.objects.splice(i, 1); this.untarget(handle); } };
      this.scene.add(g); this.objects.push(handle);
      return handle;
    }
    if (image) {
      const side = Math.max(w, h) * 1.05;
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(side, side), new THREE.MeshBasicMaterial({ map: await texture(`/game/assets/objects/${image}.webp`), transparent: true, alphaTest: 0.05, depthWrite: false }));
      pic.position.set(0, (side - h) / 2 - side * 0.12, -0.01); g.add(pic);
    }
    // drawn at a fixed pixels-per-unit, so the dashes are the same length on every zone
    const PPU = 200, c = document.createElement("canvas"); c.width = Math.round(w * PPU); c.height = Math.round(h * PPU); const ctx = c.getContext("2d");
    const lw = 16, r = 44;
    ctx.fillStyle = image ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.22)"; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash([44, 28]); ctx.lineCap = "round";
    ctx.beginPath();
    if (obrys) { obrys.forEach(([px, py], i) => { const X = c.width / 2 + px * PPU, Y = c.height / 2 - py * PPU; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); }
    else ctx.roundRect(lw, lw, c.width - 2 * lw, c.height - 2 * lw, r);
    ctx.fill(); ctx.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: image ? 0.7 : 1, depthWrite: false }));
    g.add(m);
    g.traverse((o) => { if (o.isMesh) o.renderOrder = 9; });                  // zones under the stickers, over the props
    if (obrys) { m.renderOrder = 13; m.position.z = 0.3; }                    // after the traverse, which reset it to 9
    const handle = { mesh: g, name, kind: "zone", x, y, w, h, base: 1, pulse: false, items: [],
      contains: (px, py) => Math.abs(px - x) < w / 2 + 0.2 && Math.abs(py - y) < h / 2 + 0.3,
      layout: (animate = true) => {
        // everything must fit: the things inside shrink together until the rows fill the container no more than it holds
        // (a sort is about kinds, not sizes); never above their own size
        const uklad = (k) => {
          const rows = [[]]; let rowW = 0;
          for (const it of handle.items) { const iw = 1.18 * it.size0 * 0.8 * k; if (rowW + iw > w - 0.25 && rows[rows.length - 1].length) { rows.push([]); rowW = 0; } rows[rows.length - 1].push(it); rowW += iw + 0.08; }
          return rows.reduce((a, r) => a + Math.max(...r.map((it) => 1.18 * it.size0 * 0.8 * k)) + 0.08, 0) - 0.08;
        };
        let k = 1; while (k > 0.3 && handle.items.length && uklad(k) > h - 0.24) k *= 0.88;
        for (const it of handle.items) { it.base = it.size0 * 0.8 * k; if (!animate) it.mesh.scale.setScalar(it.base); else { const s0 = it.mesh.scale.x, s1 = it.base; this.tween(0.3, (s) => it.mesh.scale.setScalar(s0 + (s1 - s0) * s)); } }
        const gap = 0.08, maxW = w - 0.25, rows = [[]]; let rowW = 0;
        for (const it of handle.items) {
          const iw = 1.18 * it.base;
          if (rowW + iw > maxW && rows[rows.length - 1].length) { rows.push([]); rowW = 0; }
          rows[rows.length - 1].push(it); rowW += iw + gap;
        }
        let top = y + h / 2 - 0.12;
        const total = rows.reduce((a, r) => a + Math.max(...r.map((it) => 1.18 * it.base)) + gap, 0) - gap;
        top -= Math.max(0, (h - 0.24 - total) / 2);
        for (const r of rows) {
          const rh = Math.max(...r.map((it) => 1.18 * it.base)), rw = r.reduce((a, it) => a + 1.18 * it.base + gap, 0) - gap;
          let cx = x - rw / 2;
          for (const it of r) {
            const iw = 1.18 * it.base, tx = cx + iw / 2, ty = top - rh / 2;
            if (animate) it.moveTo(tx, ty, 0.35); else it.mesh.position.set(tx, ty, it.mesh.position.z);
            cx += iw + gap;
          }
          top -= rh + gap;
        }
      },
      put: (it) => { if (it.zone && it.zone !== handle) it.zone.take(it); if (!handle.items.includes(it)) handle.items.push(it); it.zone = handle; handle.layout(); },
      take: (it, relayout = true) => { const i = handle.items.indexOf(it); if (i >= 0) handle.items.splice(i, 1); it.zone = null; it.base = it.size0; it.mesh.scale.setScalar(it.base); if (relayout) handle.layout(); },
      // kept for scenes that place things one by one
      slot: () => { const i = handle.items.length + (handle.slots = (handle.slots || 0) + 1) - 1; const cols = Math.max(2, Math.round(w / 1.05)); return { x: x - w / 2 + 0.6 + (i % cols) * (w - 1.2) / (cols - 1), y: y + h / 2 - 0.65 - Math.floor(i / cols) * 0.8 }; },
      remove: () => { this.scene.remove(g); this.objects.splice(this.objects.indexOf(handle), 1); this.untarget(handle); },
      highlight: (on) => { handle.pulse = on; if (!on) g.scale.setScalar(1); } };
    this.scene.add(g); this.objects.push(handle);
    this.appear(handle);
    return handle;
  }

  // ------------------------------------------------------------------ layout
  // the width a handle takes on screen (sticker card, sign card, zone)
  widthOf(h) { return h.kind === "zone" ? h.w : h.kind === "sign" ? h.base : 1.12 * (h.base ?? 1); }
  // arrange(groups): lay the groups out in one line centred on x - items in a group `gap`
  // apart, groups `groupGap` apart, every item centred on y. Returns {x, w, items} per
  // group, so a zone or a sign can be sized from the group's real extent.
  arrange(groups, { x = 0, y = 1.2, gap = 0.18, groupGap = 1.0, animate = false } = {}) {
    const info = groups.map((items) => ({ items, w: items.reduce((a, h) => a + this.widthOf(h), 0) + gap * Math.max(0, items.length - 1) }));
    const total = info.reduce((a, g) => a + g.w, 0) + groupGap * Math.max(0, info.length - 1);
    let cx = x - total / 2;
    for (const g of info) {
      g.x = cx + g.w / 2;
      let ix = cx;
      for (const h of g.items) {
        const w = this.widthOf(h), tx = ix + w / 2;
        if (animate && h.moveTo) h.moveTo(tx, y, 0.4); else { h.mesh.position.x = tx; h.mesh.position.y = y; if (h.home) { h.home.x = tx; h.home.y = y; } }
        ix += w + gap;
      }
      cx += g.w + groupGap;
    }
    return info;
  }

  // ------------------------------------------------------------------ drag and drop sorting
  // sort({items, zones, onDrop, onTap}): the child drags any item into any zone, in any order,
  // and may take it out again; onDrop(item, zone) after every drop, onTap(puppet) for a tap
  // on a character (repeat the instruction). endSort() when the lesson is satisfied.
  sort(set) { this.dragSet = set; this.drag = null; }
  // free dragging (geometria.js): things move anywhere; a short tap without moving is a tap (it turns a tangram
  // piece), a drop goes to set.onDrop(item, {x, y}); a tapped character repeats the instruction (set.onPuppet)
  free(set) { this.dragSet = { ...set, free: true, zones: [] }; this.drag = null; }
  // tests: drop a thing at (x, y) as the child would
  upusc(item, x, y) { const set = this.dragSet; if (!set?.free) return; item.mesh.position.x = x; item.mesh.position.y = y; set.onDrop(item, { x, y }); }
  stuknij(item) { const set = this.dragSet; if (set?.free) set.onTap(item); }
  endSort() { this.dragSet = null; this.drag = null; }
  dropInto(item, zone) { zone.put(item); this.bump(zone, 0.06, false); this.sfx.graj("plop"); if (this.dragSet) this.dragSet.onDrop(item, zone); }
  ndc(e) { const r = this.renderer.domElement.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
  worldAt(ndc, z = 0.4) {
    this.raycaster.setFromCamera(ndc, this.camera);
    const o = this.raycaster.ray.origin, d = this.raycaster.ray.direction, t = (z - o.z) / d.z;
    return new THREE.Vector3(o.x + d.x * t, o.y + d.y * t, z);
  }
  dragStart(e) {
    const set = this.dragSet; if (!set) return false;
    const n = this.ndc(e); this.raycaster.setFromCamera(n, this.camera);
    let best = null, bestD = Infinity;
    // the topmost thing under the finger: a shape's own layer first (overlapping pieces), then distance
    for (const it of set.items) { const hits = this.raycaster.intersectObject(it.mesh, true); if (!hits.length) continue; const d = hits[0].distance - (it.warstwa ?? 0) * 1e3; if (d < bestD) { best = it; bestD = d; } }
    if (!best) {
      for (const L of Object.values(this.puppets)) if (L.korzen.visible && this.raycaster.intersectObject(L.korzen, true).some((i) => i.object.visible)) { const f = set.free ? set.onPuppet : set.onTap; if (f) { this.bump(L); f(L); } else this.tapPuppet(L); return true; }
      return false;
    }
    if (set.free && best.zablokowany) return true;
    const p = this.worldAt(n);
    best.naWierzch?.();                                     // a picked-up shape lies over the others
    this.drag = { item: best, dx: best.mesh.position.x - p.x, dy: best.mesh.position.y - p.y, from: { x: best.mesh.position.x, y: best.mesh.position.y }, zone: best.zone, t0: performance.now() };
    if (best.zone) best.zone.take(best);
    // in the hand it is over everything, the characters too (a scarf dragged onto Owl went under her)
    this.drag.ro = []; best.mesh.traverse((o) => { if (o.isMesh || o.isLine) { this.drag.ro.push([o, o.renderOrder]); o.renderOrder = 50 + (o.renderOrder % 10); } });
    best.mesh.position.z = 0.9; this.bump(best, 0.12);
    this.renderer.domElement.setPointerCapture(e.pointerId);
    return true;
  }
  dragMove(e) {
    const d = this.drag; if (!d) return;
    const p = this.worldAt(this.ndc(e)); d.item.mesh.position.x = p.x + d.dx; d.item.mesh.position.y = p.y + d.dy;
  }
  dragEnd() {
    const d = this.drag; if (!d) return; this.drag = null;
    const it = d.item, px = it.mesh.position.x, py = it.mesh.position.y;
    it.mesh.position.z = 0.4;
    for (const [o, r] of d.ro || []) o.renderOrder = r;
    if (this.dragSet?.free) {
      const ruch = Math.hypot(px - d.from.x, py - d.from.y);
      if (ruch < 0.15 && performance.now() - d.t0 < 450) { it.mesh.position.x = d.from.x; it.mesh.position.y = d.from.y; this.dragSet.onTap?.(it); }
      else this.dragSet.onDrop?.(it, { x: px, y: py });
      return;
    }
    const zone = (this.dragSet?.zones || []).find((z) => z.contains(px, py));
    if (zone) this.dropInto(it, zone);
    else if (d.zone) { d.zone.put(it); }                              // dropped nowhere: back where it was
    else it.moveTo(it.home.x, it.home.y, 0.35);
  }
  clear() { for (const L of Object.values(this.puppets)) L.patrzNa(null); this.unfocus(0); this.dwuujecie = null;   // a two-shot's stored places never reach the next scene
    this.palec = null; this.palecWcisniety = false;                      // a finger mechanic of a skipped scene lets go
    for (const d of this.dymki.slice()) d.remove();
    this.endSort();
    for (const o of this.objects.slice()) o.remove();
    this.targets = [];
  }

  // ------------------------------------------------------------------ carrying
  // a character takes a thing into its paw (a quadruped onto its back): the thing flies there, then follows
  // every move - walking included - until `put` sets it down at (x, y)
  async take(who, h, { d = 0.4 } = {}) {
    const L = this.puppets[who]; if (!L || !h) return;
    L.niesie = true;
    await this.wait(0.25);                                            // the arm comes forward first
    L.korzen.updateMatrixWorld(true);
    const { p, na } = L.uchwyt();
    h.zapisanyRO = []; h.mesh.traverse((o) => { if (o.isMesh) h.zapisanyRO.push([o, o.renderOrder]); });
    this.untarget(h);
    h.baseNiesiony = h.base; h.base = h.base * 0.72; h.mesh.scale.setScalar(h.base);   // a carried thing is held close: a bit smaller
    await h.moveTo(p.x, p.y + (na === "plecy" ? h.base * 0.35 : -h.base * 0.1), d);
    L.trzyma = h; this.sfx.graj("tap");
  }
  async put(who, x, y, { d = 0.45 } = {}) {
    const L = this.puppets[who]; const h = L?.trzyma; if (!h) return null;
    L.trzyma = null; L.niesie = false;
    h.mesh.position.z = 0.4;
    if (h.baseNiesiony) { h.base = h.baseNiesiony; h.baseNiesiony = null; h.mesh.scale.setScalar(h.base); }
    await h.moveTo(x, y, d);
    for (const [o, r] of h.zapisanyRO || []) o.renderOrder = r;
    this.sfx.graj("plop");
    return h;
  }

  // ------------------------------------------------------------------ thought bubble
  // a character imagines something: a white cloud with a pencil rim over its head, three little puffs trailing
  // down to it, and inside the stickers it thinks of - in groups (each group a row, a gap between groups), so
  // "apples here, pears there" can be pictured. Returns a handle: remove() pops it away.
  async idea(who, groups, { size = 0.6, na = null } = {}) {
    const L = this.puppets[who]; if (!L) return null;
    const rows = groups.map((g) => (Array.isArray(g) ? g : [g]));
    const ncol = Math.max(...rows.map((r) => r.length)), w = Math.max(2.2, ncol * size * 1.15 + 1.0), h = Math.max(1.5, rows.length * size * 1.2 + 0.9);
    const o = new THREE.Vector3(); L.korzen.getWorldPosition(o);
    const side = o.x < 0 ? 1 : -1;
    const cx = Math.max(-6 + w / 2, Math.min(6 - w / 2, o.x + side * (w / 2 + 0.2))), cy = Math.min(SUFIT - h / 2, o.y + L.wysokosc + h / 2 + 0.25);
    // the cloud, drawn once per size on a canvas: overlapping round puffs, white, a pencil-grey rim
    const c = document.createElement("canvas"), px = 160; c.width = Math.round(w * px); c.height = Math.round(h * px);
    const ctx = c.getContext("2d"), puffs = [];
    const W = c.width, H = c.height, r = Math.min(W, H) * 0.22;
    const brzeg = r * 1.2 + 9;                    // the biggest puff plus its rim stays inside the canvas (it was clipped flat)
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; puffs.push([W / 2 + Math.cos(a) * (W / 2 - brzeg), H / 2 + Math.sin(a) * (H / 2 - brzeg), r * (0.95 + 0.25 * Math.sin(i * 2.3))]); }
    const draw = (grow, fill) => { ctx.beginPath(); for (const [x, y, rr] of puffs) { ctx.moveTo(x + rr + grow, y); ctx.arc(x, y, rr + grow, 0, Math.PI * 2); } ctx.rect(brzeg, brzeg, W - 2 * brzeg, H - 2 * brzeg); ctx.fillStyle = fill; ctx.fill(); };
    draw(7, "#4a433c"); draw(0, "#ffffff");
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const grp = new THREE.Group(); grp.position.set(cx, cy, 0.9);
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
    cloud.renderOrder = 45; grp.add(cloud);
    // the puffs trailing down to the head
    const head = new THREE.Vector3(o.x + side * 0.35, o.y + L.wysokosc * 0.98, 0);
    for (let i = 0; i < 3; i++) {
      const t = (i + 1) / 4, rr = 0.07 + 0.05 * i;
      const pc = document.createElement("canvas"); pc.width = pc.height = 64; const p2 = pc.getContext("2d");
      p2.fillStyle = "#4a433c"; p2.beginPath(); p2.arc(32, 32, 30, 0, 7); p2.fill(); p2.fillStyle = "#fff"; p2.beginPath(); p2.arc(32, 32, 25, 0, 7); p2.fill();
      const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(rr * 2, rr * 2), new THREE.MeshBasicMaterial({ map: pt, transparent: true, depthWrite: false, depthTest: false }));
      const bx = cx - side * w * 0.25, by = cy - h / 2 + 0.05;
      m.position.set(head.x + (bx - head.x) * t - cx, head.y + (by - head.y) * t - cy, 0); m.renderOrder = 45; grp.add(m);
    }
    // the imagined things, row by row
    rows.forEach((row, j) => {
      const y = (rows.length - 1) / 2 * size * 1.2 - j * size * 1.2;
      row.forEach((wpis, i) => {
        const [name, skala] = String(wpis).split("@"), sz = size * (+skala || 1);   // "kubek@0.6": a smaller one (an order pictured)
        const m = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false }));
        texture(`/game/assets/objects/${name}.webp`).then((t) => { m.material.map = t; m.material.needsUpdate = true; });
        m.position.set((i - (row.length - 1) / 2) * size * 1.15, y, 0.01); m.renderOrder = 46; grp.add(m);
      });
    });
    this.scene.add(grp);
    const handle = { mesh: grp, kind: "idea", base: 1, remove: () => { this.scene.remove(grp); const k = this.objects.indexOf(handle); if (k >= 0) this.objects.splice(k, 1); } };
    this.objects.push(handle);
    this.sfx.graj("idea");
    grp.scale.setScalar(0.001);
    await this.tween(0.35, (s) => grp.scale.setScalar(Math.max(0.001, s)), easeOutBack);
    if (na) setTimeout(() => handle.remove(), na * 1000);
    return handle;
  }

  // ------------------------------------------------------------------ camera focus
  // close in on some things (stickers, lines, zones, puppets) and dim the rest: the camera zooms (1..2x) and
  // pans so they fill the middle - never past the design frame - and a dark veil with a soft bright hole
  // around them covers everything else, the characters included; the things themselves rise above the veil
  async focus(items, { zoom = null, dim = 0.5, d = 0.7, margin = 0.6 } = {}) {
    if (!items?.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const h of items) {
      const b = h.korzen ? (() => { const bb = new THREE.Box3().setFromObject(h.korzen); return { left: bb.min.x, right: bb.max.x, bottom: bb.min.y, top: bb.max.y }; })() : this.bounds(h);
      x0 = Math.min(x0, b.left); x1 = Math.max(x1, b.right); y0 = Math.min(y0, b.bottom); y1 = Math.max(y1, b.top);
    }
    x0 -= margin; x1 += margin; y0 -= margin; y1 += margin;
    const v = this.visible(0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const z = zoom ?? Math.max(1, Math.min(1.6, v.w / (x1 - x0), v.h / (y1 - y0)));   // 1.6 at most: some context stays and the veil shows
    const ramka = this.design(0), hw = v.w / 2 / z, hh = v.h / 2 / z;
    const tx = Math.max(-ramka.w / 2 + hw, Math.min(ramka.w / 2 - hw, cx)), ty = Math.max(-ramka.h / 2 + hh, Math.min(ramka.h / 2 - hh, cy));
    // the veil, once
    if (!this.zaslona) {
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthTest: false, depthWrite: false,
        uniforms: { alfa: { value: 0 }, srodek: { value: new THREE.Vector2() }, rozmiar: { value: new THREE.Vector2(1, 1) } },
        vertexShader: `varying vec2 vP; void main(){ vP = (modelMatrix * vec4(position, 1.0)).xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float alfa; uniform vec2 srodek, rozmiar; varying vec2 vP;
          void main(){ vec2 q = (vP - srodek) / rozmiar; float r = length(q);
            float a = alfa * smoothstep(0.75, 1.15, r);
            gl_FragColor = vec4(0.03, 0.03, 0.08, a); }`,
      });
      this.zaslona = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), mat);
      this.zaslona.position.z = 0.6; this.zaslona.renderOrder = 40; this.zaslona.frustumCulled = false;
      this.scene.add(this.zaslona);
    }
    const u = this.zaslona.material.uniforms;
    u.srodek.value.set(cx, cy); u.rozmiar.value.set((x1 - x0) / 2, (y1 - y0) / 2);
    // the things in focus draw above the veil
    this.unlift();
    this.lifted = [];
    for (const h of items) (h.korzen || h.mesh).traverse((o) => { if (o.isMesh || o.isLine) { this.lifted.push([o, o.renderOrder]); o.renderOrder = 41 + (o.renderOrder % 20); } });
    this.sfx.graj("zoom");
    const z0 = this.camera.zoom, px = this.camera.position.x, py = this.camera.position.y, a0 = u.alfa.value;
    await this.tween(PARAMS.has("szybko") ? 0.1 : d, (s) => {
      this.camera.zoom = z0 + (z - z0) * s; this.camera.position.x = px + (tx - px) * s; this.camera.position.y = py + (ty - py) * s;
      this.camera.updateProjectionMatrix(); u.alfa.value = a0 + (dim - a0) * s;
    });
  }
  unlift() { for (const [o, r] of this.lifted || []) o.renderOrder = r; this.lifted = []; }
  // back to the whole stage
  async unfocus(d = 0.6) {
    if (!this.zaslona && this.camera.zoom === 1) return;
    const u = this.zaslona?.material.uniforms, z0 = this.camera.zoom, px = this.camera.position.x, py = this.camera.position.y, a0 = u ? u.alfa.value : 0;
    const krok = (s) => {
      this.camera.zoom = z0 + (1 - z0) * s; this.camera.position.x = px * (1 - s); this.camera.position.y = py * (1 - s);
      this.camera.updateProjectionMatrix(); if (u) u.alfa.value = a0 * (1 - s);
    };
    if (d > 0 && !PARAMS.has("szybko")) await this.tween(d, krok); else krok(1);
    this.unlift();
  }

  // ------------------------------------------------------------------ pencil
  // a pencil stroke along a path (polyline [[x, y], ...] or { bezier: [p0, c1, c2, p1, ...] }), drawn in over
  // `duration` s; a handle like a sticker's: a task target (a wide invisible strip takes the tap), remove, highlight
  async line(path, { width = 0.06, color = "#3b3631", duration = 0.7, wobble = 0.012, name = "kreska", wait = true, strong = false, halo = true, warstwa = 11 } = {}) {
    const pts = probkuj(path);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const local = pts.map(([x, y]) => [x - cx, y - cy]);
    const seed = Math.random() * 1000;
    const { g: geo, dlugosc } = wstega(local, { grubosc: width, drzenie: wobble, ziarno: seed });
    const mat = olowekMaterial(color, dlugosc, seed, strong ? 1 : 0);
    const stroke = new THREE.Mesh(geo, mat); stroke.renderOrder = warstwa + 0.01; stroke.frustumCulled = false;   // `warstwa`: over a big picture (38+), the halo still under the ink
    // a white outline under every stroke, like the stickers' die-cut edge: the pencil reads on grass, water and sky
    let haloMesh = null;
    if (halo) {
      const hw = Math.max(0.06, width * 0.7);
      haloMesh = new THREE.Mesh(wstega(local, { grubosc: width + 2 * hw, drzenie: wobble, ziarno: seed }).g, olowekMaterial("#ffffff", dlugosc, seed + 7, 1));
      haloMesh.material.uniforms.mocno.value = 1; haloMesh.renderOrder = warstwa; haloMesh.frustumCulled = false;
    }
    const hit = new THREE.Mesh(wstega(local, { grubosc: Math.max(0.45, width * 4), drzenie: 0 }).g,
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false, side: THREE.DoubleSide }));
    const grp = new THREE.Group(); grp.position.set(cx, cy, 0.45); if (haloMesh) grp.add(haloMesh); grp.add(stroke, hit);
    const handle = { mesh: grp, name, kind: "line", base: 1, pulse: false, points: pts, y: cy, x: cx,
      remove: () => { this.scene.remove(grp); const i = this.objects.indexOf(handle); if (i >= 0) this.objects.splice(i, 1); this.untarget(handle); },
      highlight: (on) => { mat.uniforms.blask.value = on ? 1 : 0; } };
    this.scene.add(grp); this.objects.push(handle);
    const czas = PARAMS.has("szybko") ? 0.1 : duration;
    if (czas >= 0.2) this.sfx.graj("pencil", { dlugosc: czas, tempo: 0.9 + Math.random() * 0.2 });
    const draw = this.tween(czas, (s) => { mat.uniforms.postep.value = s; if (haloMesh) haloMesh.material.uniforms.postep.value = s; })
      .then(() => { mat.uniforms.postep.value = 1; if (haloMesh) haloMesh.material.uniforms.postep.value = 1; });
    if (wait) await draw;
    return handle;
  }
  // a segment |----| from a to b: the stroke and two short ticks across its ends
  async segment(a, b, { ticks = 0.14, ...opts } = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * ticks / 2, ny = dx / l * ticks / 2;
    const main = await this.line([a, b], opts);
    const t1 = await this.line([[a[0] - nx, a[1] - ny], [a[0] + nx, a[1] + ny]], { ...opts, duration: 0.15 });
    const t2 = await this.line([[b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny]], { ...opts, duration: 0.15 });
    const parts = [main, t1, t2];
    main.remove0 = main.remove; main.remove = () => parts.forEach((p) => (p === main ? p.remove0() : p.remove()));
    return main;
  }
  // ---- pencil annotations: the answer circled, an arrow down onto a thing, a thing crossed out, a "?" over a head
  _box(h) {
    if (h.korzen) { const bb = new THREE.Box3().setFromObject(h.korzen); return { left: bb.min.x, right: bb.max.x, bottom: bb.min.y, top: bb.max.y, x: (bb.min.x + bb.max.x) / 2, y: (bb.min.y + bb.max.y) / 2 }; }
    return this.bounds(h);
  }
  // a hand-drawn loop around a thing: a little more than one turn, its end overshooting the start
  circle(h, { color = ZAKRESLACZ, margin = 0.18, duration = 0.8, width = 0.13, warstwa = h?.nadObrazem ?? 11 } = {}) {
    const b = this._box(h), cx = (b.left + b.right) / 2, cy = (b.bottom + b.top) / 2;
    const rx = (b.right - b.left) / 2 + margin, ry = (b.top - b.bottom) / 2 + margin;
    const pts = [], a0 = 2.2, turns = 1.12, n = 64;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * turns * 2 * Math.PI, r = 1 + 0.06 * (i / n);       // the stroke drifts outwards as a hand does
      pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]);
    }
    return this.line(pts, { color, duration, width, name: "kolko", strong: true, warstwa });
  }
  // an arrow bending down onto a thing from above-left (or `from`), with a two-stroke head
  async arrow(h, { from = null, color = ZAKRESLACZ, duration = 0.6, width = 0.13, warstwa = h?.nadObrazem ?? 11 } = {}) {
    const b = this._box(h), tx = (b.left + b.right) / 2, ty = b.top + 0.12;
    const [fx, fy] = from || [tx - 1.1, Math.min(SUFIT, ty + 1.5)];
    const k = [(fx + tx) / 2 - 0.35, (fy + ty) / 2 + 0.25];
    const body = await this.line({ bezier: [[fx, fy], k, [tx - 0.1, ty + 0.5], [tx, ty]] }, { color, duration, width, name: "strzalka", strong: true, warstwa });
    const ang = Math.atan2(ty - (ty + 0.5), tx - (tx - 0.1)), L = 0.28;
    const g1 = await this.line([[tx, ty], [tx - L * Math.cos(ang - 0.5), ty - L * Math.sin(ang - 0.5)]], { color, duration: 0.12, width, strong: true, warstwa });
    const g2 = await this.line([[tx, ty], [tx - L * Math.cos(ang + 0.5), ty - L * Math.sin(ang + 0.5)]], { color, duration: 0.12, width, strong: true, warstwa });
    const parts = [g1, g2]; const r0 = body.remove; body.remove = () => { r0(); parts.forEach((p) => p.remove()); };
    return body;
  }
  // two strokes across a thing
  async cross(h, { color = "#d32f2f", duration = 0.3, width = 0.14, margin = 0.05 } = {}) {
    const b = this._box(h);
    const a = await this.line([[b.left - margin, b.top + margin], [b.right + margin, b.bottom - margin]], { color, duration, width, name: "krzyzyk", strong: true });
    const c = await this.line([[b.right + margin, b.top + margin], [b.left - margin, b.bottom - margin]], { color, duration, width, strong: true });
    const r0 = a.remove; a.remove = () => { r0(); c.remove(); };
    return a;
  }
  // a pencil "?" over a character's head for a moment: puzzled
  async wonder(who, { na = 1.8 } = {}) {
    const L = this.puppets[who]; if (!L || !L.korzen.visible) return null;
    const o = new THREE.Vector3(); L.korzen.getWorldPosition(o);
    // right over the head: above the head bone's x, its bottom just over the top of the ears
    L.korzen.updateMatrixWorld(true);
    const gl = L.kosci.glowa && L.widokGrupy.przod.visible ? L.kosci.glowa : (L.kosci.p_glowa && L.widokGrupy.profil.visible ? L.kosci.p_glowa : L.kosci.t_glowa);
    const top = new THREE.Box3().setFromObject(L.korzen).max.y;
    const hx = gl ? gl.getWorldPosition(new THREE.Vector3()).x : o.x;
    // inside what the camera sees now (a close-up or a two-shot zooms in): under the phase icons, beside the head
    // when there is no room above it; a little smaller when zoomed
    const v = this.visible(0), zc = this.camera.zoom, hw = v.w / 2 / zc, hh = v.h / 2 / zc, s = 0.85 / Math.sqrt(zc);
    const gora = Math.min(SUFIT, this.camera.position.y + hh - 2 * hh * 0.11) - 1.05 * s;
    let x = hx + 0.12 * s, y = top + 0.5 * s + 0.3;
    if (y > gora) {
      y = gora;
      const b = new THREE.Box3().setFromObject(gl || L.korzen), strona = o.x < this.camera.position.x ? 1 : -1;
      x = strona > 0 ? b.max.x + 0.6 * s : b.min.x - 0.6 * s;
    }
    x = Math.max(this.camera.position.x - hw + 0.6 * s, Math.min(this.camera.position.x + hw - 0.6 * s, x));
    this.sfx.graj("wonder");
    const hook = await this.line({ bezier: [[x - 0.45 * s, y + 0.55 * s], [x - 0.45 * s, y + 1.05 * s], [x + 0.55 * s, y + 1.05 * s], [x + 0.5 * s, y + 0.55 * s],
                                            [x + 0.45 * s, y + 0.2 * s], [x, y + 0.25 * s], [x, y - 0.15 * s]] }, { color: "#2b2622", duration: 0.5, width: 0.14, name: "pytajnik", strong: true });
    // the dot: drawn with the same pencil as the hook - a small circle of Bezier quarters, overlapping where it closes
    const r = 0.05 * s, k = 0.5523 * r, dx = x, dy = y - 0.46 * s;
    const kolo = [[dx + r, dy], [dx + r, dy + k], [dx + k, dy + r], [dx, dy + r], [dx - k, dy + r], [dx - r, dy + k], [dx - r, dy],
                  [dx - r, dy - k], [dx - k, dy - r], [dx, dy - r], [dx + k, dy - r], [dx + r, dy - k], [dx + r, dy],
                  [dx + r, dy + k], [dx + k, dy + r], [dx, dy + r]];   // a quarter past the start: no notch where it closes
    const dot = await this.line({ bezier: kolo }, { color: "#2b2622", duration: 0.2, width: 0.14, name: "pytajnik", strong: true });
    setTimeout(() => { hook.remove(); dot.remove(); }, na * 1000);
    return hook;
  }

  // where a sticker's drawing really is (its alpha box, not the transparent square around it), in safe-area units
  bounds(h) {
    if (h.icon?.material?.map?.image) {
      const img = h.icon.material.map.image;
      if (!this.alphaBoxes) this.alphaBoxes = new WeakMap();
      let b = this.alphaBoxes.get(img);
      if (!b) {
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        const ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, img.width, img.height).data;
        let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0;
        for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (d[(y * img.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        b = { u0: x0 / img.width, u1: (x1 + 1) / img.width, v0: y0 / img.height, v1: (y1 + 1) / img.height };
        this.alphaBoxes.set(img, b);
      }
      const p = h.mesh.position, s = h.base ?? 1, gw = s * (h.icon.geometry.parameters.width ?? 1), gh = s * (h.icon.geometry.parameters.height ?? 1);
      return { left: p.x + (b.u0 - 0.5) * gw, right: p.x + (b.u1 - 0.5) * gw, top: p.y + (0.5 - b.v0) * gh, bottom: p.y + (0.5 - b.v1) * gh, x: p.x, y: p.y };
    }
    const box = new THREE.Box3().setFromObject(this.meshOf(h));
    return { left: box.min.x, right: box.max.x, top: box.max.y, bottom: box.min.y, x: (box.min.x + box.max.x) / 2, y: (box.min.y + box.max.y) / 2 };
  }
  // stand stickers with their bottoms on the line y (each keeps its x)
  standOn(items, y, d = 0.6) {
    return Promise.all(items.map((h) => { const b = this.bounds(h); return h.moveTo(h.mesh.position.x, h.mesh.position.y + (y - b.bottom), d); }));
  }

  // ------------------------------------------------------------------ clicks
  target(handle) { if (!this.targets.includes(handle)) this.targets.push(handle); }
  untarget(handle) { const i = this.targets.indexOf(handle); if (i >= 0) this.targets.splice(i, 1); }
  // wait for a click on one of the handles (objects, signs, zones or puppets); resolves with the handle
  choose(handles) {
    this.targets = handles.slice();
    return new Promise((ok) => { this.pending = ok; });
  }
  cancelChoice() { const p = this.pending; this.pending = null; this.targets = []; if (p) p(null); }
  meshOf(h) { return h.korzen ? h.korzen : h.mesh; }
  pointer(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.click(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  // a visible character under the ray (only one standing in front counts)
  puppetAt() {
    let best = null, d = Infinity;
    for (const L of Object.values(this.puppets)) {
      if (!L.korzen.visible) continue;
      const h = this.raycaster.intersectObject(L.korzen, true).filter((i) => i.object.visible);
      if (h.length && h[0].distance < d) { best = L; d = h[0].distance; }
    }
    return best;
  }
  // the one rule of the whole game: a tapped character repeats the instruction in force (the player sets it while
  // an interaction runs). Here it covers what a task does not: no choice open, or a choice among things only
  tapPuppet(L) { if (!L) return null; this.bump(L); this.onPuppetTap?.(L); return L; }
  click(nx, ny) {                                   // normalised device coords; also used by tests (gra.klik)
    this.scene.updateMatrixWorld(); this.camera.updateMatrixWorld();   // things moved since the last frame (no frame while the page is hidden)
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    if (!this.pending) return this.tapPuppet(this.puppetAt());
    // a thing beats a character: tapping a character only repeats the instruction, so where a sticker and a
    // character overlap (a cup rolled under the owl) the answer must win
    let best = null, bestD = Infinity, bestP = null, bestPD = Infinity;
    for (const h of this.targets) {
      const hits = this.raycaster.intersectObject(this.meshOf(h), true).filter((i) => i.object.visible);
      if (!hits.length) continue;
      if (h.korzen) { if (hits[0].distance < bestPD) { bestP = h; bestPD = hits[0].distance; } continue; }
      // a sticker is a square: where squares overlap (long things in rows), the one whose drawing holds the point wins
      const p = hits[0].point, b = h.icon ? this.bounds(h) : null, wSrodku = !b || (p.x >= b.left && p.x <= b.right && p.y >= b.bottom && p.y <= b.top);
      const d = hits[0].distance + (wSrodku ? 0 : 100);
      if (d < bestD) { best = h; bestD = d; }
    }
    best = best || bestP;
    this.lastHit = best;
    if (!best) return this.tapPuppet(this.puppetAt());     // a choice among things: the character still repeats
    const ok = this.pending; this.pending = null; this.targets = [];
    this.bump(best);                                 // visible reaction before anything else happens
    ok(best);
    return best;
  }
  clickOn(handle) {                                 // tests: click the centre of a target
    this.scene.updateMatrixWorld(); this.camera.updateMatrixWorld();
    const p = new THREE.Vector3(); this.meshOf(handle).getWorldPosition(p);
    if (handle.korzen) p.y += 1.2;
    p.x += 0.013; p.y += 0.007;                     // a hair off the centre: a ray through a disc's centre vertex can miss every triangle
    const s = p.project(this.camera);
    return this.click(s.x, s.y);
  }

  // ------------------------------------------------------------------ tests
  async snap(name) {
    this.rysuj();
    const blob = await new Promise((ok) => this.renderer.domElement.toBlob(ok, "image/png"));
    await fetch(`/api/snap?name=${name}`, { method: "POST", body: blob });
    return name;
  }
  dispose() { this.muzyka?.zamknij();                                  // the music fades out with the lesson
    for (const L of Object.values(this.puppets)) if (L.cien) this.scene.remove(L.cien); this.running = false; clearInterval(this.watchdog); window.removeEventListener("resize", this.onResize); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
