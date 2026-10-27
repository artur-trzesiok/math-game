// The stage every lesson plays on: a three.js scene with an illustrated background
// (tlo.js), cut-out puppets (lalka.js), object stickers, click targets, cards and a
// SAFE AREA. Tablets come in 4:3, 16:10 and 16:9; the camera always shows the whole
// safe rectangle (SAFE, 4:3, at z = 0) and whatever the wider screens add on the
// sides is background only. Everything a lesson places is in safe-area units:
// x in [-6, 6], y in [-4.5, 4.5], ground at GROUND. ?safe draws the rectangle.

import * as THREE from "three";
import { Lalka } from "./lalka.js";
import { zbudujTlo, czas as bgClock } from "./tlo.js";

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
    this.pending = null; this.lastHit = null;
    this.raycaster = new THREE.Raycaster();
    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize); this.resize();
    this.renderer.domElement.addEventListener("pointerdown", (e) => this.pointer(e));
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
    for (const L of Object.values(this.puppets)) L.update(dt);
    for (const tw of this.tweens.slice()) {
      tw.t += dt; const s = easeInOut(Math.min(1, tw.t / tw.d));
      tw.step(s);
      if (tw.t >= tw.d) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.done(); }
    }
    for (const o of this.objects) if (o.pulse) o.mesh.scale.setScalar(o.base * (1 + 0.08 * Math.sin(t / 150)));
    if (this.speech) this.speech.tick(t);
    this.renderer.render(this.scene, this.camera);
  }
  tween(d, step) { return new Promise((done) => this.tweens.push({ t: 0, d, step, done })); }
  wait(s) { return new Promise((ok) => setTimeout(ok, s * 1000)); }

  // ------------------------------------------------------------------ background
  async background(name) {
    for (const m of this.bg) this.scene.remove(m);
    const before = new Set(this.scene.children);
    await zbudujTlo(this.scene, (z) => this.design(z), { katalog: `/game/assets/backgrounds/${name}/`, odlegloscKamery: CAM_Z, srodekY: 0.6 });
    this.bg = this.scene.children.filter((c) => !before.has(c));
  }

  // ------------------------------------------------------------------ puppets
  async puppet(name, { x = 0, side = "left", height = 2.7 } = {}) {
    const L = await Lalka.wczytaj(`/game/assets/characters/${name}/`, { strona: side === "left" ? "lewo" : "prawo", wysokosc: height });
    L.korzen.position.set(x, GROUND, 0);
    L.korzen.visible = false; L.home = x; L.name = name;
    this.scene.add(L.korzen); this.puppets[name] = L;
    return L;
  }
  async enter(name, from = "left") {
    const L = this.puppets[name]; if (!L) throw new Error("no puppet " + name);
    const edge = this.visible(0).w / 2 + 1.2;
    const x0 = from === "left" ? -edge : edge;
    L.korzen.position.x = x0; L.korzen.visible = true;
    L.patrz(from === "left" ? "prawo" : "lewo"); L.graj("Chod", true);
    const d = Math.abs(L.home - x0) / (L.predkoscChodu * 1.3);
    await this.tween(PARAMS.has("szybko") ? 0.2 : d, (s) => { L.korzen.position.x = x0 + (L.home - x0) * s; });
    L.patrz("przod"); L.spoczynek();
  }
  async play(name, anim, { face = "przod", loop = false } = {}) {
    const L = this.puppets[name]; if (!L) return;
    L.patrz(face); L.graj(anim, loop);
    if (!loop) await new Promise((ok) => { L.naKoniec = ok; });
  }
  mood(name, { eyes, mouth } = {}) { const L = this.puppets[name]; if (!L) return; if (eyes) L.emocja.oczy = eyes; if (mouth) L.emocja.usta = mouth; }

  // ------------------------------------------------------------------ objects
  // a sticker: the icon on a white rounded card, so a green pear reads on green grass
  async object(name, { x = 0, y = -1.8, size = 1.1, sticker = true, z = 0.4, label = null } = {}) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    if (sticker) {
      const c = document.createElement("canvas"); c.width = c.height = 128; const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(4, 4, 120, 120, 22); ctx.fill();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 1.18), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
      m.position.z = -0.01; g.add(m);
    }
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: await texture(`/game/assets/objects/${name}.webp`), transparent: true, alphaTest: 0.05 }));
    g.add(icon);
    if (label) g.add(this.textMesh(label, { y: -0.72, size: 0.32 }));
    g.scale.setScalar(size);
    const handle = { mesh: g, name, base: size, kind: "object", pulse: false,
      remove: () => { this.scene.remove(g); this.objects.splice(this.objects.indexOf(handle), 1); this.untarget(handle); },
      highlight: (on) => { handle.pulse = on; if (!on) g.scale.setScalar(handle.base); },
      moveTo: (nx, ny, d = 0.5) => { const x0 = g.position.x, y0 = g.position.y; return this.tween(d, (s) => { g.position.x = x0 + (nx - x0) * s; g.position.y = y0 + (ny - y0) * s; }); } };
    this.scene.add(g); this.objects.push(handle);
    return handle;
  }
  // a sign or a word drawn on a card (=, <, >, a label)
  textMesh(text, { size = 1, y = 0, color = "#222", bg = "#fff" } = {}) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 256; const ctx = c.getContext("2d");
    if (bg) { ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(8, 8, 240, 240, 40); ctx.fill(); }
    ctx.fillStyle = color; ctx.font = "bold 170px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 140);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    m.position.y = y; return m;
  }
  async sign(text, { x = 0, y = -1.8, size = 1.1 } = {}) {
    const m = this.textMesh(text, { size }); m.position.set(x, y, 0.4);
    const handle = { mesh: m, name: text, base: size, kind: "sign", pulse: false,
      remove: () => { this.scene.remove(m); this.objects.splice(this.objects.indexOf(handle), 1); this.untarget(handle); },
      highlight: (on) => { handle.pulse = on; if (!on) m.scale.setScalar(1); },
      moveTo: (nx, ny, d = 0.5) => { const x0 = m.position.x, y0 = m.position.y; return this.tween(d, (s) => { m.position.x = x0 + (nx - x0) * s; m.position.y = y0 + (ny - y0) * s; }); } };
    this.scene.add(m); this.objects.push(handle);
    return handle;
  }
  // a zone: an outlined area objects can be sorted into
  zone({ x = 0, y = -1.8, w = 3, h = 2.2, color = "#ffffff" } = {}) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 192; const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.setLineDash([22, 14]);
    ctx.beginPath(); ctx.roundRect(8, 8, 240, 176, 28); ctx.fill(); ctx.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    m.position.set(x, y, 0.3);
    const handle = { mesh: m, name: "zone", kind: "zone", x, y, w, h, base: 1, pulse: false, slots: 0,
      slot: () => { const i = handle.slots++; return { x: x - w / 2 + 0.75 + (i % 3) * (w - 1.5) / 2, y: y + h / 2 - 0.7 - Math.floor(i / 3) * 0.9 }; },
      remove: () => { this.scene.remove(m); this.objects.splice(this.objects.indexOf(handle), 1); this.untarget(handle); },
      highlight: (on) => { handle.pulse = on; if (!on) m.scale.setScalar(1); } };
    this.scene.add(m); this.objects.push(handle);
    return handle;
  }
  clear() {
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
  cancelChoice() { this.pending = null; this.targets = []; }
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
  dispose() { this.running = false; clearInterval(this.watchdog); window.removeEventListener("resize", this.onResize); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
