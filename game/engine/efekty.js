// Film tools for the "pro" lessons (guidelines.md, "Atmosphere and editing"): inserts on a plain colour with a
// barely moving background, transitions between adventures, a countdown, confetti and a tick, emotion bubbles,
// comparing by overlapping, camera shots and pans over wide backgrounds.
// Overlay effects (transitions, countdown, confetti) live in the stage's overlay scene (an orthographic camera,
// y -1..1, x -aspect..aspect, drawn after the world), so they cover the letterboxed frame exactly and show in
// snapshots; bubbles and ticks live in the world next to what they mark.

import * as THREE from "three";
import { v } from "./v.js";
import { GROUND } from "./scene.js";

const PARAMS = new URLSearchParams(location.search);
const FAST = PARAMS.has("szybko");
const easeInOut = (s) => s * s * (3 - 2 * s);
const easeOut = (s) => 1 - Math.pow(1 - s, 3);
const easeOutBack = (s) => { const c = 1.7; return 1 + (c + 1) * Math.pow(s - 1, 3) + c * Math.pow(s - 1, 2); };
const los = (a, b) => a + Math.random() * (b - a);
const T = (s) => (FAST ? Math.min(s, 0.08) : s);

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// a canvas texture made once for the whole game (transition bands, patterns): never disposed, warmed up front
const TRWALE = new Map();
function trwaly(w, h, draw, klucz = null) {
  if (klucz && TRWALE.has(klucz)) return TRWALE.get(klucz);
  const t = canvasTex(w, h, draw); t.userData.trwala = true;
  if (klucz) TRWALE.set(klucz, t);
  return t;
}
export function teksturyEfektow() { pasTeczy(); for (const k of TECZA) wzorTex(k); return [...TRWALE.values(), ...GLOWY.values()]; }
function plaski(tex, w, h, { opacity = 1, order = 0, color = null } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthTest: false, depthWrite: false, color: color || 0xffffff }));
  m.renderOrder = order; m.frustumCulled = false; return m;
}
// a colour lighter (k > 0) or darker (k < 0)
function odcien(hex, k) {
  const c = new THREE.Color(hex), t = k > 0 ? new THREE.Color(1, 1, 1) : new THREE.Color(0, 0, 0);
  return "#" + c.lerp(t, Math.abs(k)).getHexString();
}

// ====================================================================== inserts on a plain colour
// The scenery goes; a soft vertical gradient of one colour, a light circle behind the characters and a motif
// drifting very slowly in the back - it must stay a background: low contrast, slow, never near the middle bright.
const MOTYWY = ["kola", "figury", "chmurki", "deszcz", "cyfry", "gwiazdki", "liscie"];

function ksztaltMotywu(motyw, i) {
  const S = 128;
  return canvasTex(S, S, (x) => {
    x.fillStyle = "#fff"; x.strokeStyle = "#fff"; x.lineWidth = 9; x.lineJoin = "round"; x.lineCap = "round";
    if (motyw === "kola") {
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 62); g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.7, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill();
    } else if (motyw === "figury") {
      const k = i % 4; x.beginPath();
      if (k === 0) x.arc(64, 64, 44, 0, 7);
      else if (k === 1) { x.moveTo(64, 18); x.lineTo(110, 102); x.lineTo(18, 102); x.closePath(); }
      else if (k === 2) x.rect(24, 24, 80, 80);
      else for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 22 : 50; x.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); }
      x.closePath(); x.stroke();
    } else if (motyw === "chmurki") {
      x.beginPath(); for (const [cx, cy, r] of [[40, 76, 26], [64, 60, 32], [90, 76, 24], [64, 84, 26]]) { x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, 7); } x.fill();
    } else if (motyw === "deszcz") {
      x.lineWidth = 7; x.beginPath(); x.moveTo(80, 10); x.lineTo(48, 118); x.stroke();
    } else if (motyw === "cyfry") {
      x.font = "bold 104px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(String(i % 10), 64, 70);
    } else if (motyw === "gwiazdki") {
      x.beginPath(); for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4, r = j % 2 ? 12 : 58; x.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); } x.closePath(); x.fill();
    } else if (motyw === "liscie") {
      x.beginPath(); x.moveTo(64, 10); x.quadraticCurveTo(118, 64, 64, 118); x.quadraticCurveTo(10, 64, 64, 10); x.fill();
    }
  });
}

export async function plansza(S, { kolor = "#8fd3f4", motyw = "kola", kolo = { x: -1.2, y: 0.2, r: 4.2 }, gestosc = 1 } = {}) {
  for (const m of S.bg) S.scene.remove(m);
  S.bg = []; S.panorama = null; S.otoczenie = [];
  const Z = -9, d = S.design(Z), k = (S.camZ - Z) / S.camZ;             // a safe-area unit at the back is k units wide
  const grad = canvasTex(4, 256, (x) => { const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, odcien(kolor, 0.18)); g.addColorStop(1, odcien(kolor, -0.06)); x.fillStyle = g; x.fillRect(0, 0, 4, 256); });
  const plyta = new THREE.Mesh(new THREE.PlaneGeometry(d.w * 1.25, d.h * 1.25), new THREE.MeshBasicMaterial({ map: grad }));
  plyta.position.set(0, 0, Z); S.scene.add(plyta); S.bg.push(plyta);
  if (kolo) {
    const t = canvasTex(256, 256, (x) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, "rgba(255,255,255,0.42)"); g.addColorStop(0.82, "rgba(255,255,255,0.36)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256); });
    const c = plaski(t, kolo.r * 2 * k, kolo.r * 2 * k, { order: 1 }); c.position.set(kolo.x * k, kolo.y * k, Z + 0.05); S.scene.add(c); S.bg.push(c);
  }
  if (motyw && MOTYWY.includes(motyw)) {
    const n = Math.round({ kola: 14, figury: 12, chmurki: 7, deszcz: 40, cyfry: 16, gwiazdki: 22, liscie: 12 }[motyw] * gestosc);
    const tex = [...Array(motyw === "cyfry" ? 10 : motyw === "figury" ? 4 : 1)].map((_, i) => ksztaltMotywu(motyw, i));
    const W = d.w * 1.15, H = d.h * 1.15;
    for (let i = 0; i < n; i++) {
      const r = { kola: los(0.5, 1.8), figury: los(0.5, 1.1), chmurki: los(1.4, 2.6), deszcz: los(0.35, 0.6), cyfry: los(0.5, 1.0), gwiazdki: los(0.15, 0.4), liscie: los(0.35, 0.7) }[motyw] * k;
      const alfa = { kola: los(0.10, 0.2), figury: los(0.10, 0.17), chmurki: los(0.14, 0.24), deszcz: los(0.16, 0.26), cyfry: los(0.08, 0.14), gwiazdki: los(0.2, 0.4), liscie: los(0.10, 0.17) }[motyw];
      const m = plaski(tex[i % tex.length], r, r, { opacity: alfa, order: 1 });
      m.position.set(los(-W / 2, W / 2), los(-H / 2, H / 2), Z + 0.1 + i * 0.001);
      const ruch = {
        kola: [los(-0.05, 0.05), los(0.08, 0.2)], figury: [los(-0.12, 0.12), los(0.05, 0.12)], chmurki: [los(0.12, 0.25), 0],
        deszcz: [-0.45, -2.2], cyfry: [los(-0.05, 0.05), los(-0.3, -0.15)], gwiazdki: [los(-0.03, 0.03), los(-0.03, 0.03)], liscie: [los(0.1, 0.25), los(-0.25, -0.1)],
      }[motyw].map((u) => u * k);
      const obrot = { figury: los(-0.25, 0.25), cyfry: los(-0.2, 0.2), liscie: los(-0.8, 0.8) }[motyw] || 0;
      const faza = Math.random() * 6.28;
      m.userData.ruch = { vx: ruch[0], vy: ruch[1], obrot, faza, alfa, W, H, motyw };
      S.scene.add(m); S.bg.push(m); S.otoczenie.push(m);
    }
  }
  S.bgName = `kolor:${kolor}:${motyw}`;
  return plyta;
}
// called every frame by the stage
export function ruszOtoczenie(S, dt, t) {
  for (const m of S.otoczenie || []) {
    const u = m.userData.ruch; const p = m.position;
    p.x += u.vx * dt + (u.motyw === "kola" || u.motyw === "liscie" ? Math.sin(t / 1600 + u.faza) * 0.002 : 0);
    p.y += u.vy * dt;
    m.rotation.z += u.obrot * dt;
    if (u.motyw === "gwiazdki") m.material.opacity = u.alfa * (0.55 + 0.45 * Math.sin(t / 700 + u.faza));
    if (p.x > u.W / 2) p.x -= u.W; if (p.x < -u.W / 2) p.x += u.W;
    if (p.y > u.H / 2) p.y -= u.H; if (p.y < -u.H / 2) p.y += u.H;
  }
}

// ====================================================================== the overlay scene
export function nakladka(S) {
  if (S.nak) return S.nak;
  const scena = new THREE.Scene(), kam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  S.nak = { scena, kam, czastki: [] };
  dopasujNakladke(S);
  return S.nak;
}
export function dopasujNakladke(S) {
  if (!S.nak) return;
  const a = S.camera.aspect; Object.assign(S.nak.kam, { left: -a, right: a, top: 1, bottom: -1 }); S.nak.kam.updateProjectionMatrix();
  S.nak.a = a;
}
// a world point -> overlay coordinates
function naNakladke(S, p) { const q = p.clone().project(S.camera); return new THREE.Vector2(q.x * S.camera.aspect, q.y); }
function punktRzeczy(S, h) {
  if (!h) return new THREE.Vector3(0, 0.5, 0);
  if (h.x !== undefined && h.y !== undefined && !h.mesh) return new THREE.Vector3(h.x, h.y, 0);
  if (h.korzen) { const b = new THREE.Box3().setFromObject(h.korzen); return new THREE.Vector3((b.min.x + b.max.x) / 2, b.min.y + (b.max.y - b.min.y) * 0.62, 0); }
  const b = S.bounds(h); return new THREE.Vector3((b.left + b.right) / 2, (b.top + b.bottom) / 2, 0);
}

// ====================================================================== transitions
// cover -> change (await) -> uncover; `rodzaj` null = one at random
export const PRZEJSCIA = ["tecza", "wzor", "irys", "babelki"];
const TECZA = ["#f7868f", "#f4e55a", "#95d837", "#2fa8f0"];
function pasTeczy(k = null) {
  for (const c of k ? [k] : TECZA) trwaly(4096, 512, (x) => {
    x.fillStyle = c; x.beginPath(); x.roundRect(0, 0, 4400, 512, 256); x.fill();
    x.fillStyle = odcien(c, -0.1); for (let j = 0; j < 6; j++) { x.beginPath(); x.arc(680 + j * 560, 160 + (j % 2) * 200, 72 + (j % 3) * 32, 0, 7); x.fill(); }
  }, "tecza" + c).anisotropy = 8;
  return k ? TRWALE.get("tecza" + k) : null;
}
function wzorTex(k) {
  const t = trwaly(1024, 1024, (x) => {
    x.fillStyle = k; x.fillRect(0, 0, 1024, 1024); x.fillStyle = odcien(k, 0.28);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const cx = 128 + c * 256 + (r % 2) * 128, cy = 128 + r * 256; x.beginPath(); if ((r + c) % 2) x.arc(cx, cy, 60, 0, 7); else { x.moveTo(cx, cy - 68); x.lineTo(cx + 64, cy + 52); x.lineTo(cx - 64, cy + 52); x.closePath(); } x.fill(); }
  }, "wzor" + k);
  t.anisotropy = 8; t.generateMipmaps = true; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// the characters' heads as round badges with their faces on, cut out of a rendered frame - once, on the loading
// screen (rendering and reading the frame back at every transition stalled the iPad's GPU)
const GLOWY = new Map();
export function przygotujGlowy(S) {
  const L0 = Object.values(S.puppets).filter((L) => !GLOWY.has(L.name)); if (!L0.length) return;
  const bylo = L0.map((L) => L.korzen.visible);
  for (const L of L0) { L.korzen.visible = true; L.korzen.updateMatrixWorld(true); }
  const kan = S.renderer.domElement;
  S.renderer.render(S.scene, S.camera);
  for (const L of L0) {
    const gl = L.kosci.glowa && L.widokGrupy.przod.visible ? L.kosci.glowa : L.kosci.p_glowa && L.widokGrupy.profil.visible ? L.kosci.p_glowa : L.kosci.t_glowa;
    if (!gl) continue;
    const b = new THREE.Box3().setFromObject(gl), c = new THREE.Vector3((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, 0), r = Math.max(b.max.x - b.min.x, b.max.y - b.min.y) * 0.55;
    const p = c.clone().project(S.camera), q = new THREE.Vector3(c.x + r, c.y, 0).project(S.camera);
    const px = (p.x + 1) / 2 * kan.width, py = (1 - p.y) / 2 * kan.height, pr = Math.abs(q.x - p.x) / 2 * kan.width;
    GLOWY.set(L.name, trwaly(512, 512, (x) => {
      x.scale(2, 2);
      x.fillStyle = "#fff"; x.beginPath(); x.arc(128, 128, 124, 0, 7); x.fill();
      x.save(); x.beginPath(); x.arc(128, 128, 112, 0, 7); x.clip();
      x.drawImage(kan, px - pr, py - pr, 2 * pr, 2 * pr, 16, 16, 224, 224); x.restore();
    }));
  }
  L0.forEach((L, i) => { L.korzen.visible = bylo[i]; });
}
// a character's head badge as a picture (the stage cards show them peeking in)
export const glowaObraz = (name) => GLOWY.get(name)?.image || null;
function glowyPostaci(S) {
  if (Object.values(S.puppets).some((L) => !GLOWY.has(L.name))) przygotujGlowy(S);     // a character added later
  return Object.values(S.puppets).filter((L) => L.korzen.visible && GLOWY.has(L.name)).map((L) => GLOWY.get(L.name));
}

// a disc drawn by a shader: a crisp edge at any size (a canvas circle stretched over the screen was pixelated)
function dysk(kolor, order) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, uniforms: { kolor: { value: new THREE.Color(kolor) }, alfa: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 kolor; uniform float alfa; varying vec2 vUv; void main(){ float r = length(vUv - 0.5); float w = fwidth(r); float a = 1.0 - smoothstep(0.5 - w, 0.5, r); if (a <= 0.0) discard; gl_FragColor = vec4(kolor, a * alfa); }",
  }));
  m.renderOrder = order; m.frustumCulled = false; return m;
}
export async function przejscie(S, zmiana, { rodzaj = null } = {}) {
  const N = nakladka(S), a = N.a || S.camera.aspect;
  rodzaj = rodzaj && PRZEJSCIA.includes(rodzaj) ? rodzaj : PRZEJSCIA[Math.floor(Math.random() * PRZEJSCIA.length)];
  const g = new THREE.Group(); N.scena.add(g);
  const glowy = rodzaj === "tecza" || rodzaj === "irys" ? glowyPostaci(S) : [];
  let zakryj, odkryj;
  S.sfx.graj("whoosh", { glosnosc: 0.8 });
  if (rodzaj === "tecza") {
    // a green ground slides in, then four bands with a rounded leading end, one after another, a head riding on each;
    // they rest with their ends staggered on the left (the ground shows between them), then slide on out
    const zielen = plaski(canvasTex(4, 4, (x) => { x.fillStyle = "#7fd37a"; x.fillRect(0, 0, 4, 4); }), 2 * a + 0.2, 2.2, { order: 0.5 });
    zielen.position.x = 2 * a + 0.2; g.add(zielen);
    const koniec = [-a + 0.85, -a + 0.35, -a + 0.75, -a + 0.45];
    const pasy = TECZA.map((k, i) => {
      const t = pasTeczy(k);
      const L = 2 * a * 1.6;
      const m = plaski(t, L, 0.5, { order: 1 }); m.geometry.translate(L / 2, 0, 0);
      m.position.set(a + 0.3, 0.75 - i * 0.5, 0); g.add(m);
      const tex = glowy[i % Math.max(1, glowy.length)];
      const glo = tex ? plaski(tex, 0.44, 0.44, { order: 2 }) : null;
      if (glo) { glo.position.set(0.27, 0, 0.1); m.add(glo); }
      return m;
    });
    zakryj = () => S.tween(T(0.8), (s) => {
      zielen.position.x = (2 * a + 0.2) * (1 - easeOut(Math.min(1, s * 1.4)));
      pasy.forEach((m, i) => { const q = easeOut(Math.max(0, Math.min(1, s * 1.6 - i * 0.2))); m.position.x = a + 0.3 + (koniec[i] - a - 0.3) * q; });
    });
    odkryj = () => S.tween(T(0.75), (s) => {
      pasy.forEach((m, i) => { const q = easeInOut(Math.max(0, Math.min(1, s * 1.6 - i * 0.2))); m.position.x = koniec[i] - q * (2 * a * 1.6 + 1.5); });
      zielen.material.opacity = 1 - easeInOut(Math.max(0, (s - 0.35) / 0.65));
    });
  } else if (rodzaj === "wzor") {
    // a layer of one colour with a pattern of shapes sweeps in diagonally and out the other side
    const k = TECZA[Math.floor(Math.random() * 4)];
    const t = wzorTex(k); t.repeat.set(3 * a, 3);
    const m = plaski(t, 2 * a * 1.5, 2 * 1.5, { order: 1 }); m.rotation.z = -0.35; g.add(m);
    const start = new THREE.Vector2(3.2 * a, 2.2), srodek = new THREE.Vector2(0, 0), koniec = new THREE.Vector2(-3.2 * a, -2.2);
    m.position.set(start.x, start.y, 0);
    zakryj = () => S.tween(T(0.6), (s) => { const q = easeOut(s); m.position.x = start.x + (srodek.x - start.x) * q; m.position.y = start.y + (srodek.y - start.y) * q; });
    odkryj = () => S.tween(T(0.6), (s) => { const q = easeInOut(s); m.position.x = srodek.x + (koniec.x - srodek.x) * q; m.position.y = srodek.y + (koniec.y - srodek.y) * q; });
  } else if (rodzaj === "irys") {
    // the picture closes into a circle, held a moment on a head, then to black; opens the same way
    const mat = new THREE.ShaderMaterial({ transparent: true, depthTest: false, uniforms: { r: { value: 2.5 }, c: { value: new THREE.Vector2(0, 0) } },
      vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform float r; uniform vec2 c; varying vec2 vP; void main(){ float d = length(vP - c); gl_FragColor = vec4(0.05,0.05,0.08, smoothstep(r - 0.01, r + 0.01, d)); }" });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4 * a, 4), mat); m.renderOrder = 1; m.frustumCulled = false; g.add(m);
    const L = S.puppets[S.ostatniMowca] && S.puppets[S.ostatniMowca].korzen.visible ? S.puppets[S.ostatniMowca] : Object.values(S.puppets).find((p) => p.korzen.visible);
    if (L) { const b = new THREE.Box3().setFromObject(L.korzen); mat.uniforms.c.value.copy(naNakladke(S, new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y - (b.max.y - b.min.y) * 0.22, 0))); }
    zakryj = async () => { await S.tween(T(0.5), (s) => { mat.uniforms.r.value = 2.5 + (0.32 - 2.5) * easeInOut(s); }); await S.wait(T(0.3)); await S.tween(T(0.2), (s) => { mat.uniforms.r.value = 0.32 * (1 - s) - 0.02 * s; }); };
    odkryj = async () => { mat.uniforms.c.value.set(0, 0); await S.tween(T(0.55), (s) => { mat.uniforms.r.value = -0.02 + 2.6 * easeOut(s); }); };
  } else {
    // bubbles in the rainbow colours grow from all over until they meet, then shrink away
    const kolka = [];
    for (let i = 0; i < 26; i++) {
      const m = dysk(TECZA[i % 4], 1 + i * 0.01);
      m.position.set(los(-a, a), los(-1, 1), 0); m.scale.setScalar(0.001); m.userData = { r: los(0.9, 1.5), d: Math.random() * 0.35 };
      g.add(m); kolka.push(m);
    }
    const tlo = dysk(TECZA[3], 2); tlo.scale.set(0.001, 0.001, 1); g.add(tlo);
    zakryj = () => S.tween(T(0.75), (s) => { for (const m of kolka) { const q = easeOutBack(Math.max(0, Math.min(1, (s - m.userData.d) / 0.65))); m.scale.setScalar(Math.max(0.001, q * m.userData.r)); } const q = Math.max(0.001, Math.max(0, s - 0.6) / 0.4 * 6 * a); tlo.scale.set(q, q, 1); });
    odkryj = () => S.tween(T(0.6), (s) => { g.children.forEach((m) => { m.material.uniforms.alfa.value = 1 - easeInOut(s); }); });
  }
  await zakryj();
  try { await zmiana(); } finally {
    await odkryj();
    N.scena.remove(g);
    g.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); if (!o.material.map?.userData?.trwala) o.material.map?.dispose(); o.material.dispose(); } });
  }
}

// ====================================================================== countdown
// dims the picture, counts 3-2-1 big (or three dots going out, for lessons before the numbers), then "go"
const KOLORY_ODL = ["#ff6b6b", "#ffb347", "#4cc3ff", "#6bd66b"];
function liczbaTex(tekst, kolor) {
  return canvasTex(512, 512, (x) => {
    x.font = "900 400px system-ui, 'Arial Rounded MT Bold', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.lineJoin = "round"; x.lineWidth = 46; x.strokeStyle = "#fff"; x.strokeText(tekst, 256, 290);
    x.fillStyle = kolor; x.fillText(tekst, 256, 290);
  });
}
export async function odliczanie(S, { od = 3, styl = "cyfry" } = {}) {
  const N = nakladka(S), a = N.a || S.camera.aspect, g = new THREE.Group(); N.scena.add(g);
  const tlo = new THREE.Mesh(new THREE.PlaneGeometry(4 * a, 4), new THREE.MeshBasicMaterial({ color: 0x0a0a14, transparent: true, opacity: 0, depthTest: false }));
  tlo.renderOrder = 1; g.add(tlo);
  await S.tween(T(0.25), (s) => { tlo.material.opacity = 0.5 * s; });
  // a dot carries its number (1, 2, 3 left to right): the count is heard and seen - three bare dots meant nothing
  const kropka = (n) => canvasTex(256, 256, (x) => {
    x.scale(2, 2); x.fillStyle = "#fff"; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill(); x.fillStyle = "#ffb347"; x.beginPath(); x.arc(64, 64, 46, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.font = "900 60px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(String(n), 64, 68);
  });
  const kropki = styl === "kropki" ? [...Array(od)].map((_, i) => { const m = plaski(kropka(i + 1), 0.42, 0.42, { order: 2 }); m.position.x = (i - (od - 1) / 2) * 0.56; g.add(m); return m; }) : [];
  for (let n = od; n >= 1; n--) {
    S.sfx.graj("tap", { tempo: 0.8 + (od - n) * 0.12 });
    if (styl === "kropki") {
      const m = kropki[n - 1];
      await S.tween(T(0.3), (s) => m.scale.setScalar(1 + 0.4 * Math.sin(s * Math.PI)));
      await S.tween(T(0.25), (s) => m.scale.setScalar(Math.max(0.001, 1 - s)));
      await S.wait(T(0.35));
    } else {
      const m = plaski(liczbaTex(String(n), KOLORY_ODL[(od - n) % 4]), 1.1, 1.1, { order: 2 }); g.add(m);
      await S.tween(T(0.3), (s) => m.scale.setScalar(Math.max(0.001, easeOutBack(s))));
      await S.wait(T(0.45));
      await S.tween(T(0.15), (s) => { m.material.opacity = 1 - s; m.scale.setScalar(1 + 0.3 * s); });
      g.remove(m);
    }
  }
  // go: a green flash ring
  S.sfx.graj("right");
  const ring = plaski(canvasTex(1024, 1024, (x) => { x.scale(4, 4); x.strokeStyle = "#6bd66b"; x.lineWidth = 34; x.beginPath(); x.arc(128, 128, 100, 0, 7); x.stroke(); }), 1, 1, { order: 2 }); g.add(ring);
  await S.tween(T(0.4), (s) => { ring.scale.setScalar(0.3 + 2.2 * s); ring.material.opacity = 1 - s; tlo.material.opacity = 0.5 * (1 - s); });
  N.scena.remove(g);
}

// ====================================================================== night and light
// noc(S, {ciemnosc}): the whole picture darkens (the characters too), and around every light (swiatlo) the dark
// opens in a soft, gently flickering circle with a warm glow - a lantern, a firefly, the moon, a night lamp. A light
// follows its thing (a sticker, a character, a point). The night ends with the scenery, or with noc(S, {ciemnosc: 0}).
const MAX_SWIATEL = 16;
function poswiataTex() {
  return canvasTex(256, 256, (x) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.35, "rgba(255,255,255,0.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256); });
}
export async function noc(S, { ciemnosc = 0.72, kolor = "#0a1430", d = 1.2 } = {}) {
  if (!S.noc) {
    if (!ciemnosc) return null;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      uniforms: { kolor: { value: new THREE.Color(kolor) }, cieply: { value: new THREE.Color("#ffb35a") }, ciemnosc: { value: 0 },
        sw: { value: Array.from({ length: MAX_SWIATEL }, () => new THREE.Vector3()) }, moc: { value: new Array(MAX_SWIATEL).fill(0) }, n: { value: 0 } },
      vertexShader: "varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }",
      fragmentShader: `uniform vec3 kolor; uniform vec3 cieply; uniform float ciemnosc; uniform vec3 sw[${MAX_SWIATEL}]; uniform float moc[${MAX_SWIATEL}]; uniform int n; varying vec2 vP;
        void main(){ float l = 0.0; for (int i = 0; i < ${MAX_SWIATEL}; i++) { if (i >= n) break; float d = length(vP - sw[i].xy); l = max(l, moc[i] * (1.0 - smoothstep(sw[i].z * 0.2, sw[i].z, d))); }
          gl_FragColor = vec4(mix(kolor, cieply, l * 0.4), ciemnosc * (1.0 - l)); }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); m.renderOrder = 35; m.frustumCulled = false; m.position.z = 0.95;
    S.scene.add(m);
    S.noc = { m, mat, swiatla: S.noc?.swiatla || [], ciemnosc: 0 };
  }
  const N = S.noc, od = N.mat.uniforms.ciemnosc.value;
  await S.tween(FAST ? 0.05 : d, (q) => { N.mat.uniforms.ciemnosc.value = od + (ciemnosc - od) * q; });
  if (!ciemnosc) koniecNocy(S);
  return N;
}
export function koniecNocy(S) {
  const N = S.noc; if (!N) return;
  S.scene.remove(N.m); N.m.geometry.dispose(); N.mat.dispose();
  for (const s of N.swiatla) s.poswiata && S.scene.remove(s.poswiata);
  S.noc = null;
}
export function swiatlo(S, cel, { r = 1.4, moc = 1, migotanie = 0.12, kolor = "#ffd27a", poswiata = true, dy = 0 } = {}) {
  if (!S.noc) S.noc = { swiatla: [], m: null, mat: null };              // registered before the night: shows when it falls
  const s = { cel, r, moc, migotanie, dy, faza: Math.random() * 10, zgasza: false, poswiata: null };
  if (poswiata) {
    if (!S.texPoswiaty) S.texPoswiaty = poswiataTex();
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: S.texPoswiaty, color: kolor, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    p.renderOrder = 36; p.frustumCulled = false; p.position.z = 0.96; S.scene.add(p); s.poswiata = p;
  }
  S.noc.swiatla.push(s);
  return {
    zgas: async (d = 0.4) => { const m0 = s.moc; await S.tween(FAST ? 0.05 : d, (q) => { s.moc = m0 * (1 - q); }); usun(); },
    ustaw: (o) => Object.assign(s, o),
  };
  function usun() { const L = S.noc?.swiatla; if (L) L.splice(L.indexOf(s), 1); if (s.poswiata) { S.scene.remove(s.poswiata); s.poswiata.material.dispose(); } }
}
export function ruszNoc(S, t) {
  const N = S.noc; if (!N || !N.m) return;
  const kam = S.camera, v = S.visible(0);
  N.m.position.x = kam.position.x; N.m.position.y = kam.position.y; N.m.scale.set(v.w / kam.zoom * 1.3, v.h / kam.zoom * 1.3, 1);
  const s0 = t / 1000, ile = Math.min(MAX_SWIATEL, N.swiatla.length);
  const p = new THREE.Vector3();
  for (let i = 0; i < ile; i++) {
    const s = N.swiatla[i], c = s.cel;
    if (Array.isArray(c)) p.set(c[0], c[1], 0);
    else if (c?.korzen) { c.korzen.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(c.korzen); p.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, 0); }
    else if (c?.mesh) c.mesh.getWorldPosition(p);
    p.y += s.dy;
    const migot = 1 - s.migotanie * (0.5 + 0.5 * Math.sin(s0 * 6.3 + s.faza) * Math.sin(s0 * 2.1 + s.faza * 1.7));
    const widac = c?.mesh ? c.mesh.visible !== false && c.mesh.parent !== null : true;
    N.mat.uniforms.sw.value[i].set(p.x, p.y, s.r); N.mat.uniforms.moc.value[i] = widac ? s.moc * migot : 0;
    if (s.poswiata) { s.poswiata.position.x = p.x; s.poswiata.position.y = p.y; s.poswiata.scale.setScalar(s.r * 1.6); s.poswiata.material.opacity = widac ? 0.32 * s.moc * migot * Math.min(1, N.mat.uniforms.ciemnosc.value * 1.6) : 0; }
  }
  N.mat.uniforms.n.value = ile;
}

// ====================================================================== comic effects
// speed lines: thin white wedges from the screen's edges toward its middle, a burst when the camera jumps in close
export async function linieSzybkosci(S, { d = 0.5, ile = 36 } = {}) {
  if (FAST) return;
  const N = nakladka(S), a = N.a || S.camera.aspect, g = new THREE.Group(); N.scena.add(g);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
  const R = Math.hypot(a, 1) * 1.08, kliny = [];
  for (let i = 0; i < ile; i++) {
    const kat = (i / ile) * 2 * Math.PI + los(-0.06, 0.06), r1 = R * los(0.58, 0.78), w = R * los(0.008, 0.022);
    const c = Math.cos(kat), s = Math.sin(kat);
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(c * r1, s * r1, 0), new THREE.Vector3(c * R - s * w, s * R + c * w, 0), new THREE.Vector3(c * R + s * w, s * R - c * w, 0)]);
    const m = new THREE.Mesh(geo, mat); m.renderOrder = 3; m.userData = { kat, r1 }; g.add(m); kliny.push(m);
  }
  await S.tween(d, (q) => { mat.opacity = 0.85 * Math.sin(Math.PI * q); g.scale.setScalar(1 + 0.06 * q); });
  N.scena.remove(g); for (const m of kliny) m.geometry.dispose(); mat.dispose();
}
// a burst behind a discovery ("they are all red!"): golden rays spin out behind it and little sparkles fly off
export async function rozblysk(S, cel, { r = 1.5 } = {}) {
  let x = 0, y = 0;
  if (cel?.korzen) { const b = new THREE.Box3().setFromObject(cel.korzen); x = (b.min.x + b.max.x) / 2; y = b.max.y - (b.max.y - b.min.y) * 0.2; }
  else if (cel?.mesh) { const p = new THREE.Vector3(); cel.mesh.getWorldPosition(p); x = p.x; y = p.y; }
  else if (Array.isArray(cel)) [x, y] = cel;
  const g = new THREE.Group(); g.position.set(x, y, 0.25); S.scene.add(g);
  const promienie = new THREE.Group(); g.add(promienie);
  const zlota = new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 14; i++) {
    const k = (i / 14) * 2 * Math.PI, w = 0.16, c = Math.cos(k), s = Math.sin(k);
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(c * 0.2, s * 0.2, 0), new THREE.Vector3(c * r - s * w * r, s * r + c * w * r, 0), new THREE.Vector3(c * r + s * w * r, s * r - c * w * r, 0)]);
    const m = new THREE.Mesh(geo, zlota); m.renderOrder = 8; promienie.add(m);
  }
  const blask = dysk("#fff6c8", 8.5); blask.scale.setScalar(r * 0.45); g.add(blask);
  const iskry = [];
  for (let i = 0; i < 10; i++) {
    const sh = new THREE.Shape(); for (let j = 0; j < 8; j++) { const kk = j * Math.PI / 4, rr = j % 2 ? 0.035 : 0.13; j ? sh.lineTo(Math.cos(kk) * rr, Math.sin(kk) * rr) : sh.moveTo(rr, 0); }
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffffff : 0xffe680, transparent: true, depthTest: false, depthWrite: false }));
    const k = Math.random() * 2 * Math.PI; m.userData = { vx: Math.cos(k) * los(1.2, 2.4), vy: Math.sin(k) * los(1.2, 2.4) }; m.renderOrder = 46; g.add(m); iskry.push(m);
  }
  S.sfx.graj("idea", { glosnosc: 0.6 });
  await S.tween(FAST ? 0.1 : 0.9, (q) => {
    const wejscie = Math.min(1, q * 3.5);
    promienie.scale.setScalar(0.3 + 0.9 * easeOutBack(wejscie)); promienie.rotation.z = q * 0.8;
    zlota.opacity = 0.85 * (q < 0.6 ? 1 : 1 - (q - 0.6) / 0.4);
    if (blask.material.uniforms?.alfa) blask.material.uniforms.alfa.value = 0.9 * (1 - q);
    for (const m of iskry) { m.position.set(m.userData.vx * q, m.userData.vy * q, 0); m.material.opacity = 1 - q; m.rotation.z = q * 4; }
  });
  S.scene.remove(g); g.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose?.(); } });
}
// motion streaks: something flying fast leaves three fading lines behind it, along its path
export function smuga(S, x0, y0, x1, y1, d) {
  if (FAST) return;
  const dl = Math.hypot(x1 - x0, y1 - y0); if (dl < 1.8 || d > 0.6) return;
  const ux = (x1 - x0) / dl, uy = (y1 - y0) / dl, g = new THREE.Group(); S.scene.add(g);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthTest: false, depthWrite: false });
  for (const o of [-0.22, 0, 0.22]) {
    const L = dl * (o ? 0.45 : 0.6), w = o ? 0.05 : 0.07, m = new THREE.Mesh(new THREE.PlaneGeometry(L, w), mat);
    m.position.set(x0 + ux * L / 2 - uy * o, y0 + uy * L / 2 + ux * o, 0.3); m.rotation.z = Math.atan2(uy, ux); m.renderOrder = 9; g.add(m);
  }
  S.tween(d + 0.25, (q) => { mat.opacity = 0.8 * (1 - q); g.position.set(ux * dl * 0.4 * q, uy * dl * 0.4 * q, 0); })
    .then(() => { S.scene.remove(g); g.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); mat.dispose(); });
}

// ====================================================================== confetti and a tick
export function konfetti(S, h = null, { ile = 60 } = {}) {
  const N = nakladka(S), z = naNakladke(S, punktRzeczy(S, h));
  if (!N.konf) {
    N.konf = canvasTex(64, 64, (x) => { x.fillStyle = "#fff"; x.fillRect(8, 20, 48, 24); });
    N.gw = canvasTex(64, 64, (x) => { x.fillStyle = "#fff"; x.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 12 : 30; x.lineTo(32 + r * Math.cos(a), 32 + r * Math.sin(a)); } x.fill(); });
  }
  const kol = ["#ff6b6b", "#ffd93d", "#6bd66b", "#4cc3ff", "#c77dd6", "#ff9a3c"];
  for (let i = 0; i < ile; i++) {
    const m = plaski(i % 4 ? N.konf : N.gw, 0.07, 0.07, { order: 5, color: new THREE.Color(kol[i % kol.length]) });
    const kat = Math.random() * Math.PI * 2, v0 = los(0.6, 1.6);
    m.position.set(z.x, z.y, 0); m.userData = { vx: Math.cos(kat) * v0, vy: Math.sin(kat) * v0 + 0.9, w: los(-9, 9), zycie: los(1.1, 1.7) };
    N.scena.add(m); N.czastki.push(m);
  }
}
export function ruszNakladke(S, dt) {
  const N = S.nak; if (!N) return;
  for (const m of N.czastki.slice()) {
    const u = m.userData; u.zycie -= dt;
    u.vy -= 2.4 * dt; u.vx *= 1 - 1.2 * dt;
    m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.rotation.z += u.w * dt;
    m.scale.y = 0.6 + 0.4 * Math.sin(u.zycie * 12);                         // tumbling paper
    if (u.zycie < 0.4) m.material.opacity = Math.max(0, u.zycie / 0.4);
    if (u.zycie <= 0) { N.scena.remove(m); m.geometry.dispose(); m.material.dispose(); N.czastki.splice(N.czastki.indexOf(m), 1); }
  }
}
// a big green tick on the thing (or over a character): vector geometry - two thick strokes with round ends and
// joins over a white rim - crisp at any size (the pencil ribbon's grain looked pixelated this thick); pops in
function grubaLinia(pts, w, kolor, order) {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: kolor, depthTest: false, depthWrite: false, transparent: true });
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dl = Math.hypot(bx - ax, by - ay);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(dl, w), mat); m.position.set((ax + bx) / 2, (ay + by) / 2, 0); m.rotation.z = Math.atan2(by - ay, bx - ax); m.renderOrder = order; g.add(m);
  }
  for (const [x, y] of pts) { const c = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 40), mat); c.position.set(x, y, 0); c.renderOrder = order; g.add(c); }
  return g;
}
export async function ptaszek(S, h = null, { na = 1.2 } = {}) {
  const p = punktRzeczy(S, h), k = 0.9, pts = [[-0.42 * k, 0], [-0.1 * k, -0.33 * k], [0.5 * k, 0.42 * k]];
  const g = new THREE.Group(); g.position.set(p.x, p.y, 0.95);
  g.add(grubaLinia(pts, 0.34, 0xffffff, 47), grubaLinia(pts, 0.2, 0x3fbf3f, 47.5));
  g.scale.setScalar(0.001); S.scene.add(g);
  const handle = { mesh: g, remove: () => { S.scene.remove(g); g.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); } };
  await S.tween(T(0.32), (s) => g.scale.setScalar(Math.max(0.001, easeOutBack(s))));
  if (na) setTimeout(async () => { await S.tween(T(0.2), (s) => g.scale.setScalar(Math.max(0.001, 1 - s))); handle.remove(); }, na * 1000);
  return handle;
}

// ====================================================================== emotion bubbles
// a small white bubble over the head with a big icon: what the character feels, readable from the sofa
export const EMOCJE = ["zlosc", "pot", "serce", "radosc", "smutek", "sen", "wykrzyknik", "zarowka", "zimno", "mokro", "muzyka", "strach"];
// painted faces set into a bubble (a sweat drop read as nothing to a child): a sticker drawn over the bubble once loaded
const MALOWANE = Object.fromEntries(["serce", "radosc", "zlosc", "sen", "wykrzyknik", "zarowka", "zimno", "mokro", "muzyka", "strach", "smutek"].map((n) => [n, `/game/assets/objects/emocja_${n}.webp`]));
MALOWANE.pot = "/game/assets/objects/emocja_ojej.webp";
function ikonaEmocji(rodzaj) {
  const tex = rysujDymek(rodzaj);
  if (MALOWANE[rodzaj]) {
    const img = new Image();
    img.onload = () => { const x = tex.image.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(img, 256 - 140, 224 - 140, 280, 280); tex.needsUpdate = true; };   // the bubble was drawn scaled 2x
    img.src = MALOWANE[rodzaj];
  }
  return tex;
}
function rysujDymek(rodzaj) {
  return canvasTex(512, 512, (x) => {
    x.scale(2, 2);                                               // drawn at 256, rendered at twice the pixels
    // the bubble
    x.fillStyle = "#fff"; x.strokeStyle = "#4a433c"; x.lineWidth = 8;
    x.beginPath(); x.ellipse(128, 112, 104, 92, 0, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(96, 196); x.lineTo(80, 246); x.lineTo(132, 202); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = "#fff"; x.beginPath(); x.ellipse(128, 112, 98, 86, 0, 0, 7); x.fill();
    x.lineCap = "round"; x.lineJoin = "round";
    const C = (k) => { x.fillStyle = k; x.strokeStyle = k; };
    if (MALOWANE[rodzaj]) return;                                  // only the bubble: the painted sign goes in when loaded
    if (rodzaj === "zlosc") {                                    // the comic anger vein: four curved brackets around a gap
      C("#e2453c"); x.lineWidth = 20;
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { x.beginPath(); x.moveTo(128 + dx * 16, 112 + dy * 62); x.quadraticCurveTo(128 + dx * 16, 112 + dy * 16, 128 + dx * 62, 112 + dy * 16); x.stroke(); }
    } else if (rodzaj === "pot") {                               // "oh dear": a painted worried face, drawn in when loaded (below)
    } else if (rodzaj === "serce") {
      C("#ff5b8a"); x.beginPath(); x.moveTo(128, 170); x.bezierCurveTo(40, 112, 70, 40, 128, 78); x.bezierCurveTo(186, 40, 216, 112, 128, 170); x.fill();
    } else if (rodzaj === "radosc") {
      C("#ffc928"); for (const [cx, cy, r] of [[100, 100, 42], [168, 78, 24], [160, 150, 20]]) { x.beginPath(); for (let j = 0; j < 8; j++) { const a = -Math.PI / 2 + j * Math.PI / 4, q = j % 2 ? r * 0.36 : r; x.lineTo(cx + q * Math.cos(a), cy + q * Math.sin(a)); } x.fill(); }
    } else if (rodzaj === "smutek") {                            // a painted sad face, drawn in when loaded (MALOWANE)
    } else if (rodzaj === "sen") {
      C("#6a7fd6"); x.font = "900 92px system-ui, sans-serif"; x.textAlign = "center"; x.fillText("z", 92, 150); x.font = "900 66px system-ui, sans-serif"; x.fillText("z", 142, 110); x.font = "900 46px system-ui, sans-serif"; x.fillText("z", 180, 78);
    } else if (rodzaj === "wykrzyknik") {
      C("#ff7a1a"); x.beginPath(); x.roundRect(110, 34, 36, 98, 18); x.fill(); x.beginPath(); x.arc(128, 160, 20, 0, 7); x.fill();
    } else if (rodzaj === "zarowka") {
      C("#ffd23a"); x.beginPath(); x.arc(128, 92, 48, 0, 7); x.fill(); C("#9a8f80"); x.fillRect(108, 136, 40, 30);
      C("#ffd23a"); x.lineWidth = 10; for (const a of [-2.4, -1.57, -0.74, -3.1, 0]) { x.beginPath(); x.moveTo(128 + Math.cos(a) * 62, 92 + Math.sin(a) * 62); x.lineTo(128 + Math.cos(a) * 82, 92 + Math.sin(a) * 82); x.stroke(); }
    } else if (rodzaj === "zimno") {
      C("#5bb4f0"); x.lineWidth = 14; for (let j = 0; j < 3; j++) { const a = j * Math.PI / 3; x.beginPath(); x.moveTo(128 - Math.cos(a) * 62, 104 - Math.sin(a) * 62); x.lineTo(128 + Math.cos(a) * 62, 104 + Math.sin(a) * 62); x.stroke(); }
    } else if (rodzaj === "mokro") {                             // rain on someone: a big drop and two small ones, falling
      C("#5bb4f0");
      for (const [cx, cy, q] of [[112, 92, 1], [170, 64, 0.5], [172, 146, 0.45]]) {
        x.beginPath(); x.moveTo(cx, cy - 58 * q); x.bezierCurveTo(cx + 46 * q, cy + 8 * q, cx + 40 * q, cy + 62 * q, cx, cy + 62 * q); x.bezierCurveTo(cx - 40 * q, cy + 62 * q, cx - 46 * q, cy + 8 * q, cx, cy - 58 * q); x.fill();
      }
      x.fillStyle = "#fff"; x.beginPath(); x.ellipse(98, 116, 9, 17, -0.4, 0, 7); x.fill();
    } else if (rodzaj === "muzyka") {
      C("#c77dd6"); x.beginPath(); x.ellipse(96, 150, 26, 20, -0.4, 0, 7); x.fill(); x.beginPath(); x.ellipse(166, 132, 26, 20, -0.4, 0, 7); x.fill();
      x.lineWidth = 12; x.beginPath(); x.moveTo(118, 146); x.lineTo(118, 52); x.lineTo(188, 36); x.lineTo(188, 128); x.stroke();
    } else if (rodzaj === "strach") {
      C("#8a6fd6"); x.lineWidth = 10; for (let j = 0; j < 3; j++) { x.beginPath(); x.moveTo(70 + j * 40, 50); for (let k = 1; k <= 6; k++) x.lineTo(70 + j * 40 + (k % 2 ? 12 : -12), 50 + k * 20); x.stroke(); }
    }
  });
}
export async function emocja(S, who, rodzaj, { na = 2.2 } = {}) {
  const L = S.puppets[who]; if (!L || !L.korzen.visible) return null;
  if (!S.ikonyEmocji) S.ikonyEmocji = {};
  const tex = S.ikonyEmocji[rodzaj] || (S.ikonyEmocji[rodzaj] = ikonaEmocji(rodzaj));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  m.renderOrder = 46; m.frustumCulled = false; S.scene.add(m);
  const strona = L.korzen.position.x < 0 ? 1 : -1;
  const handle = { mesh: m, kind: "emocja", base: 1,
    remove: () => { S.scene.remove(m); m.geometry.dispose(); m.material.dispose(); S.dymki = (S.dymki || []).filter((d) => d !== handle); } };
  handle.za = () => {                                                   // follows the head every frame
    const gl = L.kosci.glowa && L.widokGrupy.przod.visible ? L.kosci.glowa : L.kosci.p_glowa && L.widokGrupy.profil.visible ? L.kosci.p_glowa : L.kosci.t_glowa;
    const b = new THREE.Box3().setFromObject(gl || L.korzen);
    // inside what the camera sees now (a close-up zooms in): under the phase icons, beside the head when there
    // is no room above it; a little smaller in a close-up so it does not fill the frame
    const kam = S.camera, v = S.visible(0), z = kam.zoom, hw = v.w / 2 / z, hh = v.h / 2 / z;
    const k = 1 / Math.sqrt(z), r = 0.6 * k * (handle.q ?? 1);
    const gora = kam.position.y + hh - 2 * hh * 0.11 - r, lewo = kam.position.x - hw + r, prawo = kam.position.x + hw - r;
    let x = (b.min.x + b.max.x) / 2 + strona * 0.75, y = b.max.y + 0.45;
    if (y > gora) { y = gora; x = strona > 0 ? b.max.x + r * 0.9 : b.min.x - r * 0.9; }
    m.position.set(Math.max(lewo, Math.min(prawo, x)), y, 0.9);
    handle.k = k;
    m.scale.set(strona * k * (handle.q ?? 1), k * (handle.q ?? 1), 1);   // the tail points to the head
  };
  handle.q = 0.001; handle.za();
  (S.dymki = S.dymki || []).push(handle);
  S.sfx.graj(rodzaj === "zarowka" ? "idea" : "pop");
  await S.tween(T(0.3), (s) => { handle.q = Math.max(0.001, easeOutBack(s)); });
  handle.q = 1;
  if (na) setTimeout(async () => { await S.tween(T(0.2), (s) => { handle.q = Math.max(0.001, 1 - s); }); handle.remove(); }, na * 1000);
  return handle;
}

// ====================================================================== comparing by overlapping
// `gorny` is laid on `dolny` (bottoms aligned, centred); the bigger one's outline glows where it sticks out.
// Resolves with { wiekszy, mniejszy, cofnij() } - cofnij puts the moved one back.
export async function nalozenie(S, gorny, dolny, { d = 0.7, wyrownaj = "dol" } = {}) {
  const bg = S.bounds(gorny), bd = S.bounds(dolny);
  const pole = (b) => (b.right - b.left) * (b.top - b.bottom);
  const wiekszy = pole(bg) >= pole(bd) ? gorny : dolny, mniejszy = wiekszy === gorny ? dolny : gorny;
  const z0 = { x: gorny.mesh.position.x, y: gorny.mesh.position.y };
  const ox = gorny.mesh.position.x - (bg.left + bg.right) / 2, oy = gorny.mesh.position.y - bg.bottom;
  const cy = wyrownaj === "srodek" ? (bd.top + bd.bottom) / 2 - (bg.top - bg.bottom) / 2 : bd.bottom;
  // the moved one is drawn on top, a little see-through
  const ro = []; gorny.mesh.traverse((o) => { if (o.isMesh) { ro.push([o, o.renderOrder, o.material.opacity]); o.renderOrder = 12; } });
  await gorny.moveTo((bd.left + bd.right) / 2 + ox, cy + oy, d);
  for (const [o] of ro) { o.material.transparent = true; o.material.opacity = 0.82; }
  // the bigger one's outline: a tinted copy of its picture just behind it, a little larger, pulsing twice
  const ic = wiekszy.icon || wiekszy.mesh.children.find((c) => c.isMesh);
  let obrys = null;
  if (ic) {
    obrys = new THREE.Mesh(ic.geometry, new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, uniforms: { mapa: { value: ic.material.map }, alfa: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform sampler2D mapa; uniform float alfa; varying vec2 vUv; void main(){ float a = texture2D(mapa, vUv).a; if (a < 0.1) discard; gl_FragColor = vec4(1.0, 0.45, 0.12, alfa); }" }));
    obrys.renderOrder = 9.5; obrys.position.z = -0.02; obrys.scale.setScalar(1.08); wiekszy.mesh.add(obrys);
    S.sfx.graj("right", { glosnosc: 0.6 });
    await S.tween(T(1.4), (s) => { obrys.material.uniforms.alfa.value = 0.85 * Math.abs(Math.sin(s * Math.PI * 2)); obrys.scale.setScalar(1.06 + 0.04 * Math.sin(s * Math.PI * 4)); });
    obrys.material.uniforms.alfa.value = 0.7;
  }
  return {
    wiekszy, mniejszy,
    cofnij: async (dd = 0.5) => {
      if (obrys) { wiekszy.mesh.remove(obrys); obrys.material.dispose(); }
      for (const [o, r, a] of ro) { o.renderOrder = r; o.material.opacity = a; }
      await gorny.moveTo(z0.x, z0.y, dd);
    },
  };
}

// ====================================================================== camera shots
// "ogolny" the whole stage; "sredni" (who or things) a medium shot; "zblizenie" (who) the face fills the frame;
// "dwuujecie" (a, b) both from the waist up - the two step closer for the shot (a film cut allows it) and go
// back on the next wide shot. `ciecie` (default) cuts; false moves the camera.
function obwiednia(S, cele) {
  const b = new THREE.Box3();
  for (const h of cele) {
    if (!h) continue;
    if (h.korzen) b.union(new THREE.Box3().setFromObject(h.korzen));
    else { const q = S.bounds(h); b.union(new THREE.Box3(new THREE.Vector3(q.left, q.bottom, 0), new THREE.Vector3(q.right, q.top, 0))); }
  }
  return b;
}
export async function ujecie(S, typ = "ogolny", { na = null, ciecie = true, d = 0.8 } = {}) {
  const lista = (Array.isArray(na) ? na : na ? [na] : []).map((n) => (typeof n === "string" ? S.puppets[n] : n)).filter(Boolean);
  // back from a two-shot: the characters return to their places
  if (S.dwuujecie && typ !== "dwuujecie") { for (const [L, x] of S.dwuujecie) L.korzen.position.x = x; S.dwuujecie = null; }
  const v = S.visible(0);
  let z = 1, cx = 0, cy = 0;
  if (typ === "zblizenie" && lista[0]?.korzen) {
    const L = lista[0];
    const gl = L.kosci.glowa && L.widokGrupy.przod.visible ? L.kosci.glowa : L.kosci.p_glowa && L.widokGrupy.profil.visible ? L.kosci.p_glowa : L.kosci.t_glowa;
    // the head piece alone (not the hat, not the hidden 3/4 and back heads): the face fills the frame
    const glowna = gl ? (gl === L.kosci.glowa ? L.widoki.przod : gl.children.find((o) => o.isMesh)) : null;
    const b = new THREE.Box3().setFromObject(glowna || gl || L.korzen);
    const h = (b.max.y - b.min.y) * 1.55;                                 // the head and a little of the shoulders
    z = Math.min(3.4, v.h / h); cx = (b.min.x + b.max.x) / 2; cy = (b.min.y + b.max.y) / 2 - (b.max.y - b.min.y) * 0.12;
  } else if (typ === "dwuujecie" && lista.length >= 2) {
    if (!S.dwuujecie) { S.dwuujecie = lista.map((L) => [L, L.korzen.position.x]); }
    const [A, B] = lista, lewy = A.korzen.position.x <= B.korzen.position.x ? A : B, prawy = lewy === A ? B : A;
    // closer together around their own middle (fixed spots at +-2.3 put Squirrel into a brook); near enough: stay
    const sr = (lewy.korzen.position.x + prawy.korzen.position.x) / 2, rozstaw = prawy.korzen.position.x - lewy.korzen.position.x;
    // never onto things on the ground: with containers or stickers between them they stay, the camera frames them
    const cosMiedzy = S.objects.some((o) => o.mesh?.visible !== false && (o.kind === "zone" || o.kind === "object") && o.mesh.position.x > lewy.korzen.position.x && o.mesh.position.x < prawy.korzen.position.x);
    if (rozstaw > 4.6 && !cosMiedzy) { lewy.korzen.position.x = sr - 2.3; prawy.korzen.position.x = sr + 2.3; }
    const b = obwiednia(S, lista);
    const h = (b.max.y - b.min.y) * 0.72 + 1.0;                           // from the waist up, room over the heads (the HUD)
    z = Math.min(1.9, v.h / h, v.w / ((b.max.x - b.min.x) * 1.15)); cx = (b.min.x + b.max.x) / 2; cy = b.max.y + 0.9 - v.h / 2 / z;
  } else if (typ === "sredni" && lista.length) {
    const b = obwiednia(S, lista), w = (b.max.x - b.min.x) + 1.2, h = (b.max.y - b.min.y) + 1.0;
    z = Math.max(1, Math.min(2.2, v.w / w, v.h / h)); cx = (b.min.x + b.max.x) / 2; cy = (b.min.y + b.max.y) / 2;
  }
  // stay inside the design frame (the background ends there)
  const ramka = S.design(0), hw = v.w / 2 / z, hh = v.h / 2 / z;
  cx = Math.max(-ramka.w / 2 + hw, Math.min(ramka.w / 2 - hw, cx)); cy = Math.max(-ramka.h / 2 + hh, Math.min(ramka.h / 2 - hh, cy));
  if (S.zaslona) S.zaslona.material.uniforms.alfa.value = 0;
  S.unlift?.();
  const kam = S.camera, z0 = kam.zoom, x0 = kam.position.x, y0 = kam.position.y;
  const krok = (s) => { kam.zoom = z0 + (z - z0) * s; kam.position.x = x0 + (cx - x0) * s; kam.position.y = y0 + (cy - y0) * s; kam.updateProjectionMatrix(); };
  // a jump in close gets speed lines (the comic-book zoom); a cut back out does not
  if (typ === "zblizenie" && S.ujecieTeraz !== "zblizenie") linieSzybkosci(S);
  if (ciecie || FAST) krok(1); else await S.tween(d, krok);
  S.ujecieTeraz = typ;
}

// ====================================================================== wide backgrounds: areas and pans
// a background wider than the screen (rekwizyty.json "szerokosc" > the design frame) is split into areas; the
// scenery slides (every layer by the same projected amount, so the cut-out props stay on their plate) while the
// characters may walk on the spot
export function obszaryTla(S) {
  const P = S.panorama; if (!P) return 1;
  return P.n;
}
export function ustawObszar(S, k, s = 1, od = null) {
  const P = S.panorama; if (!P) return;
  const cel = P.przesuniecie(k), start = od ?? P.teraz;
  const dx = start + (cel - start) * s;
  for (const m of S.bg) { const u = m.userData.pan; if (u) m.position.x = u.x0 + dx * u.f; }
  if (s >= 1) P.teraz = cel;
}
// cele: { who: x } - those walkers also make their way to x and back to the front ground (out of a walk into the
// picture, ctx.przejdz) while the scenery goes by
export async function pan(S, k, { d = 2.6, idz = [], cele = {} } = {}) {
  const P = S.panorama; if (!P) return;
  k = Math.max(0, Math.min(P.n - 1, k));
  const start = P.teraz;
  const lalki = idz.map((n) => S.puppets[n]).filter((L) => L && L.korzen.visible);
  const cel = P.przesuniecie(k), kier = cel < start ? 1 : -1;             // scenery slides left = we walk right
  for (const L of lalki) { L.patrz(kier > 0 ? "prawo" : "lewo"); L.graj("Chod", true); L.droga = true; }
  // the stride follows the ground going by (the plate's shift seen at the characters' depth), so feet do not slide
  const naPrzod = P.fPrzod;
  let ostatnio = 0;
  const z = Object.entries(cele).map(([n, x]) => { const L = S.puppets[n]; return L && { L, x0: L.korzen.position.x, x, g0: L.podloga, s0: L.korzen.scale.x }; }).filter(Boolean);
  await S.tween(FAST ? 0.1 : d, (s) => {
    const q = easeInOut(s); ustawObszar(S, k, q, start);
    const droga = Math.abs(cel - start) * q * naPrzod; for (const L of lalki) L.idz((droga - ostatnio) * kier); ostatnio = droga;
    for (const o of z) {
      o.L.korzen.position.x = o.x0 + (o.x - o.x0) * q;
      if (o.g0 != null) { const g = o.g0 + (GROUND - o.g0) * q; o.L.podloga = g; o.L.korzen.position.y = g; o.L.korzen.scale.setScalar(o.s0 + (1 - o.s0) * q); }
    }
  });
  for (const o of z) o.L.podloga = null;
  P.teraz = cel;
  for (const L of lalki) { L.droga = false; L.patrz("przod"); L.spoczynek(); }
}

// ====================================================================== particles over the whole scene
// Weather and light in the air: rain, snow, fireflies (floating, gently pulsing lights - a forest morning),
// falling leaves, dust in the light, bubbles. A layer in front of the scene but faint, so it never hides a task;
// it belongs to the place: a background change ends it (call again after `go`). `rodzaj` null stops it.
export const CZASTKI = ["deszcz", "snieg", "swietliki", "liscie", "pylek", "babelki", "piorka"];
function teksturaCzastki(rodzaj) {
  return canvasTex(64, 64, (x) => {
    if (rodzaj === "deszcz") { const g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,0.95)"); x.strokeStyle = g; x.lineWidth = 9; x.lineCap = "round"; x.beginPath(); x.moveTo(36, 2); x.lineTo(28, 62); x.stroke(); }
    else if (rodzaj === "liscie") { x.fillStyle = "#fff"; x.beginPath(); x.moveTo(32, 4); x.quadraticCurveTo(62, 32, 32, 60); x.quadraticCurveTo(2, 32, 32, 4); x.fill(); }
    else if (rodzaj === "piorka") { x.fillStyle = "#fff"; x.beginPath(); x.ellipse(32, 32, 9, 28, 0.5, 0, 7); x.fill(); x.strokeStyle = "rgba(200,200,210,0.9)"; x.lineWidth = 2; x.beginPath(); x.moveTo(20, 56); x.lineTo(44, 8); x.stroke(); }
    else if (rodzaj === "babelki") { x.strokeStyle = "rgba(255,255,255,0.95)"; x.lineWidth = 4; x.beginPath(); x.arc(32, 32, 26, 0, 7); x.stroke(); x.fillStyle = "rgba(255,255,255,0.8)"; x.beginPath(); x.arc(23, 22, 6, 0, 7); x.fill(); }
    else { const g = x.createRadialGradient(32, 32, 0, 32, 32, 31); const glow = rodzaj === "swietliki"; g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(glow ? 0.18 : 0.5, glow ? "rgba(255,255,230,0.9)" : "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  });
}
const KOLOR_CZASTKI = { piorka: "#ffffff", deszcz: "#e6f1ff", snieg: "#ffffff", swietliki: "#fff1a8", liscie: ["#e8a23a", "#d9682b", "#9cc24a", "#c9462c"], pylek: "#fff6d8", babelki: "#e8f7ff" };
export function czastki(S, rodzaj, { gestosc = 1, wiatr = 0 } = {}) {
  if (S.warstwaCzastek) { S.scene.remove(S.warstwaCzastek.grupa); S.warstwaCzastek.grupa.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); S.warstwaCzastek = null; }
  S.muzyka?.pogoda(rodzaj && CZASTKI.includes(rodzaj) ? rodzaj : null);       // the weather is heard too, quietly
  if (!rodzaj || !CZASTKI.includes(rodzaj)) return null;
  const d = S.design(0), W = d.w * 1.1, H = d.h * 1.1, grupa = new THREE.Group(); S.scene.add(grupa);
  const n = Math.round({ deszcz: 360, snieg: 110, swietliki: 26, liscie: 60, piorka: 45, pylek: 55, babelki: 18 }[rodzaj] * gestosc);
  const tex = teksturaCzastki(rodzaj), lista = [];
  for (let i = 0; i < n; i++) {
    const kol = KOLOR_CZASTKI[rodzaj], kolor = Array.isArray(kol) ? kol[i % kol.length] : kol;
    const r = { deszcz: [0.16, 0.95], snieg: [los(0.06, 0.16), 0], swietliki: [los(0.3, 0.55), 0], liscie: [los(0.3, 0.5), 0], piorka: [los(0.22, 0.36), 0], pylek: [los(0.05, 0.12), 0], babelki: [los(0.18, 0.4), 0] }[rodzaj];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r[0], r[1] || r[0]), new THREE.MeshBasicMaterial({ map: tex, color: kolor, transparent: true, depthTest: false, depthWrite: false, blending: rodzaj === "swietliki" || rodzaj === "pylek" ? THREE.AdditiveBlending : THREE.NormalBlending }));
    m.renderOrder = 44; m.frustumCulled = false;
    // nearer particles (z) are bigger and faster: a little depth
    const blisko = Math.random();
    m.position.set(los(-W / 2, W / 2), los(-H / 2, H / 2), 0.8 + blisko * 0.6);
    const alfa = { piorka: los(0.75, 0.95), deszcz: los(0.7, 0.95), snieg: los(0.55, 0.85), swietliki: los(0.5, 0.9), liscie: los(0.75, 0.95), pylek: los(0.25, 0.5), babelki: los(0.35, 0.6) }[rodzaj];
    m.userData = { faza: Math.random() * 6.28, alfa, blisko, wx: los(0.6, 1.4) };
    m.material.opacity = alfa; grupa.add(m); lista.push(m);
  }
  // rain also dims the day a little: grey-blue over the scenery, under the characters - drops alone read as nothing
  if (rodzaj === "deszcz") {
    const mrok = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.2, H * 1.2), new THREE.MeshBasicMaterial({ color: 0x41506b, transparent: true, opacity: 0.16, depthTest: false, depthWrite: false }));
    mrok.renderOrder = 8; mrok.position.z = 0.3; mrok.frustumCulled = false; grupa.add(mrok);
  }
  S.warstwaCzastek = { grupa, lista, rodzaj, W, H, wiatr };
  return S.warstwaCzastek;
}
export function ruszCzastki(S, dt, t) {
  const C = S.warstwaCzastek; if (!C) return;
  const s = t / 1000;
  for (const m of C.lista) {
    const u = m.userData, p = m.position, k = 0.7 + u.blisko * 0.6;
    switch (C.rodzaj) {
      case "deszcz": p.y -= 9 * k * dt; p.x += (C.wiatr - 1.2) * k * dt; m.rotation.z = -0.13 + C.wiatr * 0.05; break;
      case "snieg": p.y -= 0.55 * k * dt; p.x += (Math.sin(s * 0.9 * u.wx + u.faza) * 0.35 + C.wiatr) * dt; break;
      case "swietliki":                                                   // they float and drift and gently pulse
        p.x += Math.sin(s * 0.35 * u.wx + u.faza) * 0.12 * dt + C.wiatr * 0.2 * dt; p.y += Math.cos(s * 0.27 * u.wx + u.faza * 1.3) * 0.1 * dt + 0.02 * dt;
        m.material.opacity = u.alfa * (0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(s * 1.3 * u.wx + u.faza), 2)); break;
      case "liscie": p.y -= 0.6 * k * dt; p.x += (Math.sin(s * 1.1 * u.wx + u.faza) * 0.6 + C.wiatr + 0.15) * dt; m.rotation.z = Math.sin(s * 1.6 * u.wx + u.faza) * 1.1; m.scale.x = Math.cos(s * 2 * u.wx + u.faza); break;
      case "pylek": p.x += (Math.sin(s * 0.2 * u.wx + u.faza) * 0.06 + C.wiatr * 0.1) * dt; p.y += Math.sin(s * 0.15 * u.wx + u.faza) * 0.05 * dt; m.material.opacity = u.alfa * (0.6 + 0.4 * Math.sin(s * 0.8 + u.faza)); break;
      case "piorka": p.y -= 0.35 * k * dt; p.x += (Math.sin(s * 0.9 * u.wx + u.faza) * 0.5 + C.wiatr) * dt; m.rotation.z = Math.sin(s * 1.3 * u.wx + u.faza) * 0.9; break;
      case "babelki": p.y += 0.45 * k * dt; p.x += Math.sin(s * 1.2 * u.wx + u.faza) * 0.25 * dt; break;
    }
    if (p.y < -C.H / 2) p.y += C.H; if (p.y > C.H / 2) p.y -= C.H;
    if (p.x < -C.W / 2) p.x += C.W; if (p.x > C.W / 2) p.x -= C.W;
  }
}
