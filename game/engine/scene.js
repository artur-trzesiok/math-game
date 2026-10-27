// The stage every lesson plays on: a three.js scene with an illustrated background
// (tlo.js), cut-out puppets (lalka.js), object stickers, click targets, cards and a
// SAFE AREA. Tablets come in 4:3, 16:10 and 16:9; the camera always shows the whole
// safe rectangle (SAFE, 4:3, at z = 0) and whatever the wider screens add on the
// sides is background only. Everything a lesson places is in safe-area units:
// x in [-6, 6], y in [-4.5, 4.5], ground at GROUND. ?safe draws the rectangle.

import * as THREE from "three";
import { Lalka } from "./lalka.js";
import { zbudujTlo, czas as bgClock, zginanieTla } from "./tlo.js";
if (new URLSearchParams(location.search).has("sztywnetlo")) zginanieTla.value = 0;   // A/B: the old shearing grass

export const SAFE = { w: 12, h: 9 };
export const GROUND = -3.3;
export const ASPECT_MIN = 4 / 3, ASPECT_MAX = 16 / 9;
const CAM_Z = 7.2;
const PARAMS = new URLSearchParams(location.search);
const FRESH = { cache: "no-store" };

const loader = new THREE.TextureLoader();
function texture(url) {
  return new Promise((ok, bad) => loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; ok(t); }, undefined, bad));
}
const easeInOut = (s) => s * s * (3 - 2 * s);
const easeOutBack = (s) => { const c = 1.7; return 1 + (c + 1) * Math.pow(s - 1, 3) + c * Math.pow(s - 1, 2); };   // a small overshoot

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
    this.puppets = {}; this.objects = []; this.targets = []; this.tweens = []; this.bg = []; this.frame = 0;
    this.pending = null; this.lastHit = null; this.dragSet = null; this.drag = null;
    this.raycaster = new THREE.Raycaster();
    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize); this.resize();
    this.renderer.domElement.addEventListener("pointerdown", (e) => { if (e.button !== 0 && e.pointerType === "mouse") return; if (!this.dragStart(e)) this.pointer(e); });
    this.renderer.domElement.addEventListener("pointermove", (e) => this.dragMove(e));
    this.renderer.domElement.addEventListener("pointerup", () => this.dragEnd());
    this.renderer.domElement.addEventListener("pointercancel", () => this.dragEnd());
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
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.frame++;
    bgClock.value += dt;
    for (const L of Object.values(this.puppets)) {
      L.update(dt);
      if (L.cien) {                                                           // the shadow stays on the ground under the feet
        const lift = Math.max(0, L.korzen.position.y - GROUND);
        L.cien.visible = L.korzen.visible; L.cien.position.x = L.korzen.position.x;
        const k = Math.max(0.4, 1 - lift * 0.8); L.cien.scale.set(k, k, 1); L.cien.material.opacity = 0.85 * k;
      }
    }
    for (const tw of this.tweens.slice()) {
      tw.t += dt; const s = (tw.ease || easeInOut)(Math.min(1, tw.t / tw.d));
      tw.step(s);
      if (tw.t >= tw.d) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.done(); }
    }
    for (const o of this.objects) if (o.pulse && !o.bumping) o.mesh.scale.setScalar(o.base * (1 + 0.08 * Math.sin(t / 150)));
    if (this.speech) this.speech.tick(t);
    this.renderer.render(this.scene, this.camera);
  }
  tween(d, step, ease = null) { return new Promise((done) => this.tweens.push({ t: 0, d, step, done, ease })); }
  // things grow in from nothing with a little overshoot; not awaited by the caller, so a row appears sticker by sticker
  appear(h) {
    const m = this.meshOf(h), base = h.base ?? 1;
    h.bumping = true; m.scale.setScalar(0.001);
    return this.tween(0.38, (s) => { const q = base * Math.max(0.001, s); m.scale.set(q, q, h.korzen ? 1 : q); }, easeOutBack)
      .then(() => { m.scale.set(base, base, h.korzen ? 1 : base); h.bumping = false; });
  }
  // touch feedback: the tapped thing pops (scale up and back); a wrong answer also shakes
  async bump(h, amount = 0.25) {
    const m = this.meshOf(h), base = h.base ?? 1, k = h.korzen ? 0.08 : amount;
    h.bumping = true;
    await this.tween(0.28, (s) => { const q = base * (1 + k * Math.sin(s * Math.PI)); m.scale.set(q, q, h.korzen ? 1 : q); });
    m.scale.set(base, base, h.korzen ? 1 : base); h.bumping = false;
  }
  async shake(h) {
    const m = this.meshOf(h), x0 = m.position.x;
    await this.tween(0.4, (s) => { m.position.x = x0 + 0.12 * Math.sin(s * Math.PI * 4) * (1 - s); });
    m.position.x = x0;
  }
  wait(s) { return new Promise((ok) => setTimeout(ok, s * 1000)); }

  // ------------------------------------------------------------------ background
  async background(name) {
    if (this.bgName === name) return false;                                // same scenery: leave it as it is
    this.bgName = name;
    for (const m of this.bg) this.scene.remove(m);
    const before = new Set(this.scene.children);
    await zbudujTlo(this.scene, (z) => this.design(z), { katalog: `/game/assets/backgrounds/${name}/`, odlegloscKamery: CAM_Z, srodekY: 0.6 });
    this.bg = this.scene.children.filter((c) => !before.has(c));
    return true;
  }

  // ------------------------------------------------------------------ puppets
  async puppet(name, { x = 0, side = "left", height = 3.6 } = {}) {
    const L = await Lalka.wczytaj(`/game/assets/characters/${name}/`, { strona: side === "left" ? "lewo" : "prawo", wysokosc: height });
    L.meta = await fetch(`/game/assets/characters/${name}/meta.json`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
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
  layer(L, front) { L.korzen.traverse((o) => { if (o.isMesh) o.renderOrder = front ? 30 : 20; }); }
  bringToFront(L) { for (const o of Object.values(this.puppets)) this.layer(o, o === L); }
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
  // move a walking puppet from x0 to x1 at its stride speed (gentle start and stop); the stride's phase
  // follows the distance covered, so a planted foot stays where it stands
  async walkLine(L, x0, x1) {
    const d = Math.abs(x1 - x0) / L.predkoscChodu + 0.25;
    let last = x0; L.droga = true;
    await this.tween(PARAMS.has("szybko") ? 0.2 : d, (s) => { const x = x0 + (x1 - x0) * s; L.idz(x - last); last = x; L.korzen.position.x = x; });
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
  async object(name, { x = 0, y = 1.2, size = 1.1, sticker = false, z = 0.4, label = null } = {}) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    if (sticker) {
      const c = document.createElement("canvas"); c.width = c.height = 512; const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(16, 16, 480, 480, 88); ctx.fill();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 1.18), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      m.position.z = -0.01; g.add(m);
    }
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: await texture(`/game/assets/objects/${name}.webp`), transparent: true, alphaTest: 0.05, depthWrite: false }));
    g.add(icon);
    if (label) g.add(this.textMesh(label, { y: -0.72, size: 0.32 }));
    g.traverse((o) => { if (o.isMesh) o.renderOrder = 10; });                 // the foreground draws after every background prop
    const handle = { mesh: g, name, base: size, size0: size, home: { x, y }, zone: null, kind: "object", pulse: false,
      remove: () => { this.scene.remove(g); this.objects.splice(this.objects.indexOf(handle), 1); this.untarget(handle); if (handle.zone) handle.zone.take(handle, false); },
      highlight: (on) => { handle.pulse = on; if (!on) g.scale.setScalar(handle.base); },
      moveTo: (nx, ny, d = 0.5) => { const x0 = g.position.x, y0 = g.position.y; return this.tween(d, (s) => { g.position.x = x0 + (nx - x0) * s; g.position.y = y0 + (ny - y0) * s; }); } };
    this.scene.add(g); this.objects.push(handle);
    this.appear(handle);
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
  async zone({ x = 0, y = -2.2, w = 3, h = 2.2, color = "#ffffff", image = null, name = "zone" } = {}) {
    const g = new THREE.Group(); g.position.set(x, y, 0.3);
    if (image) {
      const side = Math.max(w, h) * 1.05;
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(side, side), new THREE.MeshBasicMaterial({ map: await texture(`/game/assets/objects/${image}.webp`), transparent: true, alphaTest: 0.05, depthWrite: false }));
      pic.position.set(0, (side - h) / 2 - side * 0.12, -0.01); g.add(pic);
    }
    // drawn at a fixed pixels-per-unit, so the dashes are the same length on every zone
    const PPU = 200, c = document.createElement("canvas"); c.width = Math.round(w * PPU); c.height = Math.round(h * PPU); const ctx = c.getContext("2d");
    const lw = 16, r = 44;
    ctx.fillStyle = image ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.22)"; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash([44, 28]); ctx.lineCap = "round";
    ctx.beginPath(); ctx.roundRect(lw, lw, c.width - 2 * lw, c.height - 2 * lw, r); ctx.fill(); ctx.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: image ? 0.7 : 1, depthWrite: false }));
    g.add(m);
    g.traverse((o) => { if (o.isMesh) o.renderOrder = 9; });                  // zones under the stickers, over the props
    const handle = { mesh: g, name, kind: "zone", x, y, w, h, base: 1, pulse: false, items: [],
      contains: (px, py) => Math.abs(px - x) < w / 2 + 0.2 && Math.abs(py - y) < h / 2 + 0.3,
      layout: (animate = true) => {
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
      put: (it) => { if (it.zone && it.zone !== handle) it.zone.take(it); if (!handle.items.includes(it)) handle.items.push(it); it.zone = handle; it.base = it.size0 * 0.8; it.mesh.scale.setScalar(it.base); handle.layout(); },
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
  endSort() { this.dragSet = null; this.drag = null; }
  dropInto(item, zone) { zone.put(item); this.bump(zone, 0.06); if (this.dragSet) this.dragSet.onDrop(item, zone); }
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
    for (const it of set.items) { const hits = this.raycaster.intersectObject(it.mesh, true); if (hits.length && hits[0].distance < bestD) { best = it; bestD = hits[0].distance; } }
    if (!best) {
      for (const L of Object.values(this.puppets)) if (L.korzen.visible && this.raycaster.intersectObject(L.korzen, true).some((i) => i.object.visible)) { this.bump(L); set.onTap?.(L); return true; }
      return false;
    }
    const p = this.worldAt(n);
    this.drag = { item: best, dx: best.mesh.position.x - p.x, dy: best.mesh.position.y - p.y, from: { x: best.mesh.position.x, y: best.mesh.position.y }, zone: best.zone };
    if (best.zone) best.zone.take(best);
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
    const zone = (this.dragSet?.zones || []).find((z) => z.contains(px, py));
    if (zone) this.dropInto(it, zone);
    else if (d.zone) { d.zone.put(it); }                              // dropped nowhere: back where it was
    else it.moveTo(it.home.x, it.home.y, 0.35);
  }
  clear() { for (const L of Object.values(this.puppets)) L.patrzNa(null);
    this.endSort();
    for (const o of this.objects.slice()) o.remove();
    this.targets = [];
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
  click(nx, ny) {                                   // normalised device coords; also used by tests (gra.klik)
    if (!this.pending) return null;
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    let best = null, bestD = Infinity;
    for (const h of this.targets) {
      const hits = this.raycaster.intersectObject(this.meshOf(h), true).filter((i) => i.object.visible);
      if (hits.length && hits[0].distance < bestD) { best = h; bestD = hits[0].distance; }
    }
    this.lastHit = best;
    if (!best) return null;
    const ok = this.pending; this.pending = null; this.targets = [];
    this.bump(best);                                 // visible reaction before anything else happens
    ok(best);
    return best;
  }
  clickOn(handle) {                                 // tests: click the centre of a target
    const p = new THREE.Vector3(); this.meshOf(handle).getWorldPosition(p);
    if (handle.korzen) p.y += 1.2;
    const s = p.project(this.camera);
    return this.click(s.x, s.y);
  }

  // ------------------------------------------------------------------ tests
  async snap(name) {
    this.renderer.render(this.scene, this.camera);
    const blob = await new Promise((ok) => this.renderer.domElement.toBlob(ok, "image/png"));
    await fetch(`/api/snap?name=${name}`, { method: "POST", body: blob });
    return name;
  }
  dispose() { for (const L of Object.values(this.puppets)) if (L.cien) this.scene.remove(L.cien); this.running = false; clearInterval(this.watchdog); window.removeEventListener("resize", this.onResize); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
