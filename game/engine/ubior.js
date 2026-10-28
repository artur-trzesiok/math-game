// Dressing up: things a humanoid character wears (a hat, glasses, a scarf, shoes), fitted automatically to
// every character from its own pieces - no per-character data. The gallery is game/assets/ubrania/ubrania.json:
// { name: { slot, widoki: {przod, profil, tyl}, szer, nasun } } with one picture per view (a view without a
// picture hides the thing in that view). Quadrupeds are not dressed; a tail is never dressed.
//
// Slots and their anchors, measured on the character's textures the first time it is dressed:
//   glowa  - on the skull: the top of the head piece in its middle (between the ears), as wide as the head at
//            the eyes; `nasun` (share of the hat's height) pulls it down over the skull
//   oczy   - centred on the eyes' box of that view (front, profile), as wide as the box
//   szyja  - at the neck (the head's pivot), as wide as the head
//   stopy  - one per foot: follows the foot (the tip of the leg mesh) every frame, as wide as the foot
import * as THREE from "three";
import { v } from "./v.js";

const SWIEZO = { cache: "no-store" };
const ladowacz = new THREE.TextureLoader();
const tekstura = (url) => new Promise((ok, zle) => ladowacz.load(v(url), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; ok(t); }, undefined, zle));
let GALERIA = null;
export async function galeria() {
  if (!GALERIA) GALERIA = await fetch(v("/game/assets/ubrania/ubrania.json"), SWIEZO).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return GALERIA;
}
// hand corrections from the manager's wardrobe: per character, per garment, per view; dx, dy in the character's
// heights (so they hold at any stage size), skala multiplies, obrot in degrees
export async function korekty(L) {
  if (L.korektyUbioru === undefined) L.korektyUbioru = await fetch(v(`/game/assets/characters/${L.name}/ubior.json`), SWIEZO).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return L.korektyUbioru;
}
const korekta = (L, rzecz, widok) => ({ dx: 0, dy: 0, skala: 1, obrot: 0, ...(L.korektyUbioru?.[rzecz]?.[widok] || {}) });
const DOMYSLNE = { glowa: { szer: 0.92, nasun: 0.3 }, oczy: { szer: 1.15, nasun: 0 }, szyja: { szer: 0.8, nasun: 0 }, stopy: { szer: 1.0, nasun: 0, do: 0.42 } };

// a texture's alpha as a canvas once
function alfa(tex) {
  if (tex.userData?.alfa) return tex.userData.alfa;
  const im = tex.image, c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
  const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data, a = new Uint8Array(c.width * c.height);
  for (let i = 0; i < a.length; i++) a[i] = d[4 * i + 3];
  tex.userData = { ...(tex.userData || {}), alfa: { a, w: c.width, h: c.height } };
  return tex.userData.alfa;
}

// the head of a view: its bone, the piece's box (view-frame pixels) and the anchors in the bone's local units
function glowaWidoku(L, widok) {
  const d = L.dane, nazwaKosci = { przod: "glowa", profil: "p_glowa", tyl: "t_glowa" }[widok];
  const kosc = L.kosci[nazwaKosci]; if (!kosc) return null;
  const czesc = d.kosci[nazwaKosci].czesc, cz = d.czesci[czesc], tex = L.tex[czesc]; if (!cz || !tex) return null;
  const os = kosc.userData.os, s = L._skala(widok === "tyl" ? "tyl" : widok === "profil" ? "profil" : "przod");
  const lok = (px, py) => new THREE.Vector2((px - os[0]) * s, -(py - os[1]) * s);
  if (!L.kotwice) L.kotwice = {};
  if (!L.kotwice[widok]) {
    const A = alfa(tex), kx = cz.w / A.w, ky = cz.h / A.h;
    // the skull's top: the highest opaque pixel in the middle fifth of the piece (ears stand at the sides)
    // the head's width at the eyes (front / profile: the face box; back: 45% down from the skull)
    const tw = d.twarz?.[widok === "profil" ? "profil" : "przod"]?.oczy;
    // the skull's top over the eyes (in profile the ear stands at the back, in front the ears at the sides): the
    // highest opaque pixel in a narrow band of columns through the eyes' middle (the middle fifth without a face)
    const kol = tw && widok !== "tyl" ? (tw.x + tw.w / 2 - cz.x) / kx : A.w / 2, pas = widok === "profil" ? A.w * 0.05 : A.w * 0.1;
    let gora = A.h;
    for (let x = Math.max(0, Math.floor(kol - pas)); x < Math.min(A.w, Math.ceil(kol + pas)); x++) for (let y = 0; y < A.h; y++) if (A.a[y * A.w + x] > 140) { if (y < gora) gora = y; break; }
    const yOczu = widok !== "tyl" && tw ? (tw.y + tw.h / 2 - cz.y) / ky : gora + (A.h - gora) * 0.45;
    const row = Math.max(0, Math.min(A.h - 1, Math.round(yOczu)));
    let l = A.w, r = -1; for (let x = 0; x < A.w; x++) if (A.a[row * A.w + x] > 140) { if (x < l) l = x; r = x; }
    const szer = Math.max(1, r - l) * kx, srodek = widok === "profil" && tw ? cz.x + kol * kx - (r - l) * kx * 0.12 : cz.x + (l + r) / 2 * kx;
    // ears: going down from the skull's top, the last row where opaque runs other than the one through the middle
    // still exist is where the ears join the head; the dome between them is the run through the middle there
    const sx = Math.round((l + r) / 2);
    let zlacze = -1, kopula = 0;
    for (let y = gora; y < Math.min(A.h, gora + (A.h - gora) * 0.6); y++) {
      let start = -1, inne = false, sr = null;
      for (let x = 0; x <= A.w; x++) {
        const pelny = x < A.w && A.a[y * A.w + x] > 140;
        if (pelny && start < 0) start = x;
        if (!pelny && start >= 0) { if (start <= sx && sx < x) sr = [start, x]; else if (x - start > A.w * 0.03) inne = true; start = -1; }
      }
      if (inne && sr) { zlacze = y; kopula = sr[1] - sr[0]; }
      else if (zlacze >= 0) break;
    }
    const uszy = zlacze > gora + (A.h - gora) * 0.04 ? { y: cz.y + zlacze * ky, szer: kopula * kx } : null;
    L.kotwice[widok] = { gora: cz.y + gora * ky, szer, srodek, dol: cz.y + cz.h, tw: widok !== "tyl" ? tw : null, uszy };
  }
  const K = L.kotwice[widok];
  return { kosc, s, lok, K, os };
}

// the legs of a view: the chains whose meshes carry the feet, with the foot vertices (s > 0.86)
function stopyWidoku(L, widok) {
  const kosci = { przod: ["noga_l", "noga_p"], profil: ["p_noga_przod", "p_noga_tyl"], tyl: ["t_noga_l", "t_noga_p"] }[widok];
  const out = [];
  for (const k of kosci) {
    const R = L.lancuchy.find((c) => c.kosc === k); if (!R || !R.B) continue;
    if (!R.stopa) { R.stopa = []; R.kostka = []; for (let i = 0; i < R.B.vs.length; i++) { if (R.B.vs[i] > 0.86) R.stopa.push(i); if (R.B.vs[i] > 0.66 && R.B.vs[i] < 0.8) R.kostka.push(i); } }
    out.push(R);
  }
  return out;
}

// the ears of a head piece above a line (the hat's bottom edge, in the bone's units): in every row above it, the
// opaque runs that do not hold the skull's middle column are ears (the skull dome is the run through the middle)
function uszyNaCzapce(L, widok, H, yBrzegu) {
  const glowna = widok === "przod" ? L.widoki.przod : H.kosc.children.find((o) => o.isMesh && !o.userData.ubior);
  if (!glowna) return null;
  const tex = glowna.material.map, A = alfa(tex), d = L.dane, nazwa = d.kosci[{ przod: "glowa", profil: "p_glowa", tyl: "t_glowa" }[widok]].czesc, cz = d.czesci[nazwa];
  const ky = cz.h / A.h, kx = cz.w / A.w, wiersz = Math.round((H.os[1] - yBrzegu / H.s - cz.y) / ky), srodek = Math.round((H.K.srodek - cz.x) / kx);
  const c = document.createElement("canvas"); c.width = A.w; c.height = A.h; const x = c.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, A.w, A.h); x.fillStyle = "#fff";
  let ile = 0;
  for (let y = 0; y < Math.min(A.h, wiersz); y++) {
    let start = -1;
    for (let i = 0; i <= A.w; i++) {
      const pelny = i < A.w && A.a[y * A.w + i] > 60;
      if (pelny && start < 0) start = i;
      if (!pelny && start >= 0) { if (!(start <= srodek && srodek < i)) { x.fillRect(start, y, i - start, 1); ile += i - start; } start = -1; }
    }
  }
  if (ile < 50) return null;                                           // no ears above the brim
  // a soft edge: the row-wise mask blurred, no alpha test - a hard cut flickered along the brim
  const c2 = document.createElement("canvas"); c2.width = A.w; c2.height = A.h; const x2 = c2.getContext("2d"); x2.filter = "blur(2px)"; x2.drawImage(c, 0, 0);
  const maska = new THREE.CanvasTexture(c2);
  const m = new THREE.Mesh(glowna.geometry, new THREE.MeshBasicMaterial({ map: tex, alphaMap: maska, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
  m.position.copy(glowna.position); m.position.z = 0.09; m.frustumCulled = false; m.userData.ubior = true; m.userData.uszy = true;
  return m;
}

function meshRzeczy(tex, w) {
  const h = w * tex.image.height / tex.image.width;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.userData.h = h; return m;
}
const warstwaLalki = (L) => { let r = 20; L.korzen.traverse((o) => { if (o.isMesh && !o.userData.ubior) r = o.renderOrder; }); return r; };

// put `rzecz` (a gallery name) on `who`; opts.skala scales it (a hat too big: 1.5 slips over the eyes),
// opts.nasun overrides how far it sits down. Replaces what the slot had. Returns the worn thing.
export async function ubierz(S, who, rzecz, { skala = 1, nasun = null, pop = true } = {}) {
  const L = S.puppets[who]; if (!L) return null;
  if (L.dane.rig === "czworonog") { console.warn(`${who}: quadrupeds are not dressed`); return null; }
  const G = await galeria(), def = G[rzecz]; if (!def) { console.warn(`no garment ${rzecz}`); return null; }
  const slot = def.slot, P = { ...DOMYSLNE[slot], ...def };
  await korekty(L);
  const tex = {}; for (const [w, plik] of Object.entries(def.widoki || {})) tex[w] = await tekstura(`/game/assets/ubrania/${plik}`);
  zdejmij(S, who, slot);                 // only once the new pictures are in: a swap never shows an empty frame
  const rzeczy = [];                     // [mesh, update?]
  const ro = warstwaLalki(L);
  for (const widok of ["przod", "profil", "tyl"]) {
    const t = tex[widok]; if (!t) continue;
    if (slot === "stopy") {
      for (const R of stopyWidoku(L, widok)) {
        // the shoe is a grid bent by the same joints as the leg: every vertex takes the chain position s of the
        // nearest leg vertex at rest, so the sole stays level with the foot and the shaft follows the shin
        const srodki = (arr) => {
          let fx = 0, fy = 0, ax = 0, y0 = Infinity, k0 = Infinity, k1 = -Infinity, f0 = Infinity, f1 = -Infinity;
          for (const i of R.stopa) { const x = arr[3 * i], y = arr[3 * i + 1]; fx += x; fy += y; y0 = Math.min(y0, y); f0 = Math.min(f0, x); f1 = Math.max(f1, x); }
          for (const i of R.kostka) { const x = arr[3 * i]; ax += x; k0 = Math.min(k0, x); k1 = Math.max(k1, x); }
          const nf = R.stopa.length, na = Math.max(1, R.kostka.length);
          // a little oversize, so no paw shows: in profile the whole foot length and some, from the front the ankle and some
          const kost = R.kostka.length ? k1 - k0 : 0.3;
          const szer = widok === "profil" ? Math.max(kost * 1.35, (f1 - f0) * 1.3) : Math.max(kost * 1.35, (f1 - f0) * 1.1);
          return { fx: (f0 + f1) / 2, fy: fy / nf, ax: ax / na, y0, szer };
        };
        const K = korekta(L, rzecz, widok), H0 = L.wysokosc;
        const S0 = srodki(R.rest), w = S0.szer * P.szer * skala * K.skala;
        // the height comes from the leg, not from the picture (a front boot is tall and narrow, a side one wide):
        // from the sole up to the leg at s = `do` (a wellington to mid-shin, a sneaker just over the ankle)
        let gy = 0, gn = 0; for (let i = 0; i < R.B.vs.length; i++) if (Math.abs(R.B.vs[i] - P.do) < 0.04) { gy += R.rest[3 * i + 1]; gn++; }
        const h = gn ? Math.max(w * 0.5, gy / gn - S0.y0 + 0.07) * K.skala : (t.image.height / t.image.width) * w;
        const cx = (widok === "profil" ? S0.fx : S0.ax) + K.dx * H0, cy = S0.y0 + h / 2 - 0.05 + K.dy * H0;
        const obrot = K.obrot * Math.PI / 180, co = Math.cos(obrot), si = Math.sin(obrot);
        const g = new THREE.PlaneGeometry(w, h, 6, 12), rest = g.attributes.position.array.slice();
        for (let i = 0; i < rest.length; i += 3) { const x = rest[i], y = rest[i + 1]; rest[i] = cx + x * co - y * si; rest[i + 1] = cy + x * si + y * co; rest[i + 2] = 0.012; }
        g.attributes.position.array.set(rest);
        // every shoe vertex is glued to its nearest leg vertex at rest: it keeps its offset from it, turned by the
        // same angle that vertex turns by (the sum of its joints' angles x weights) - the shoe bends exactly like
        // the leg under it (giving it the leg's s instead tore it apart across the joint bands at a bent ankle)
        const n = rest.length / 3, najb = new Int32Array(n), off = new Float32Array(2 * n);
        for (let v = 0; v < n; v++) {
          let best = Infinity, bi = 0;
          for (let i = 0; i < R.B.vs.length; i++) { const dx = R.rest[3 * i] - rest[3 * v], dy = R.rest[3 * i + 1] - rest[3 * v + 1], d = dx * dx + dy * dy; if (d < best) { best = d; bi = i; } }
          najb[v] = bi; off[2 * v] = rest[3 * v] - R.rest[3 * bi]; off[2 * v + 1] = rest[3 * v + 1] - R.rest[3 * bi + 1];
        }
        const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.05, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
        m.frustumCulled = false; m.userData.ubior = true; m.userData.rzecz = rzecz; m.userData.widok = widok; m.renderOrder = ro; R.mesh.add(m);
        const nl = R.rest.length / 3;
        const aktualizuj = () => {
          const lp = R.mesh.geometry.attributes.position.array, out = g.attributes.position.array;
          const stawy = R.biodro ? [R.katBiodra, ...R.katy] : R.katy, wagi = R.biodro ? R.wagiD : R.wagi;
          for (let v = 0; v < n; v++) {
            const i = najb[v]; let kat = 0;
            if (wagi) for (let k = 0; k < stawy.length; k++) kat += stawy[k] * wagi[k * nl + i];
            const c = Math.cos(kat), sn = Math.sin(kat), ox = off[2 * v], oy = off[2 * v + 1];
            out[3 * v] = lp[3 * i] + ox * c - oy * sn; out[3 * v + 1] = lp[3 * i + 1] + ox * sn + oy * c;
          }
          g.attributes.position.needsUpdate = true;
        };
        aktualizuj(); rzeczy.push([m, aktualizuj]);
      }
      continue;
    }
    const H = glowaWidoku(L, widok); if (!H) continue;
    const { K, lok } = H;
    let w, cx, cy, m;
    if (slot === "glowa") {
      const n = nasun ?? P.nasun;
      if (K.uszy && widok !== "profil") {
        // between the ears: as wide as the dome where the ears join it, the brim on that line - the ears stay whole
        w = Math.max(K.uszy.szer * 1.02, K.szer * 0.55) * H.s * (P.szer / DOMYSLNE.glowa.szer) * skala; m = meshRzeczy(t, w);
        const brzeg = lok(K.srodek, K.uszy.y);
        cx = brzeg.x; cy = brzeg.y + m.userData.h / 2 - m.userData.h * 0.06 - (skala > 1 ? m.userData.h * 0.35 : 0);
      } else {
        w = K.szer * H.s * P.szer * skala; m = meshRzeczy(t, w);
        const top = lok(K.srodek, K.gora);
        cx = top.x; cy = top.y + m.userData.h / 2 - m.userData.h * n * (skala > 1 ? 1.6 : 1);
      }
    } else if (slot === "oczy") {
      if (!K.tw) continue;
      w = K.tw.w * H.s * P.szer * skala; m = meshRzeczy(t, w);
      const c = lok(K.tw.x + K.tw.w / 2, K.tw.y + K.tw.h / 2); cx = c.x; cy = c.y;
    } else if (slot === "szyja") {
      w = K.szer * H.s * P.szer * skala;
      const proporcja = t.image.height / t.image.width;
      if (w * proporcja > L.wysokosc * 0.3) w = L.wysokosc * 0.3 / proporcja;   // a small character: the scarf ends above its knees
      m = meshRzeczy(t, w);
      const c = lok(K.srodek, K.dol); cx = c.x; cy = c.y - m.userData.h * 0.22;   // the ring just under the chin, the end hanging down
    } else continue;
    const Q = korekta(L, rzecz, widok);
    if (Q.skala !== 1) { m.scale.setScalar(Q.skala); m.userData.h *= Q.skala; }
    cx += Q.dx * L.wysokosc; cy += Q.dy * L.wysokosc; m.rotation.z = -Q.obrot * Math.PI / 180;
    m.position.set(cx, cy, slot === "szyja" ? -0.01 : 0.08);             // a scarf under the head, a hat over the face
    m.userData.ubior = true; m.userData.rzecz = rzecz; m.userData.widok = widok; m.renderOrder = ro;
    H.kosc.add(m); rzeczy.push([m, null]);
    // no ear redrawn over the hat: it flickered along the brim; the hat covers the ear's base
  }
  const ubrane = { who, slot, rzecz, rzeczy, skala };
  (L.ubior = L.ubior || {})[slot] = ubrane;
  (S.ubiory = S.ubiory || new Set()).add(L);
  if (pop) {
    S.sfx.graj("pop");
    const baza = rzeczy.map(([m]) => m.scale.x);
    await S.tween(0.25, (s) => { const q = 0.6 + 0.4 * s + 0.15 * Math.sin(s * Math.PI); rzeczy.forEach(([m, a], i) => { if (!a) m.scale.setScalar(baza[i] * q); }); });
    rzeczy.forEach(([m, a], i) => { if (!a) m.scale.setScalar(baza[i]); });
  }
  return ubrane;
}
export function zdejmij(S, who, slot = null) {
  const L = S.puppets[who]; if (!L?.ubior) return;
  for (const [sl, u] of Object.entries(L.ubior)) {
    if (slot && sl !== slot) continue;
    for (const [m] of u.rzeczy) { m.parent?.remove(m); m.geometry.dispose(); m.material.dispose(); }
    delete L.ubior[sl];
  }
}
// every frame: shoes follow the feet
export function ruszUbiory(S) {
  for (const L of S.ubiory || []) for (const u of Object.values(L.ubior || {})) for (const [, a] of u.rzeczy) if (a) a();
}
// a wrong fit, seen: the thing goes on at its wrong size, wobbles and falls off (then the hint comes)
export async function nieUbieraj(S, who, rzecz, { skala = 1.5 } = {}) {
  const u = await ubierz(S, who, rzecz, { skala, pop: false });
  if (!u) return;
  S.sfx.graj("wrong");
  const ms = u.rzeczy.map(([m]) => m), r0 = ms.map((m) => m.rotation.z), y0 = ms.map((m) => m.position.y);
  await S.tween(0.6, (s) => ms.forEach((m, i) => { m.rotation.z = r0[i] + 0.25 * Math.sin(s * Math.PI * 4) * (1 - s); }));
  await S.tween(0.45, (s) => ms.forEach((m, i) => { m.position.y = y0[i] - s * s * 2.5; m.rotation.z = r0[i] + s * 1.2; m.material.opacity = 1 - s; }));
  zdejmij(S, who, u.slot);
}
// a garment as a sticker on the stage (its front view), to be dragged onto a character
export async function ubranieNaNaklejce(S, rzecz, { x = 0, y = 1.2, size = 1.1 } = {}) {
  const G = await galeria(), def = G[rzecz]; if (!def) return null;
  const plik = def.widoki.przod || Object.values(def.widoki)[0];
  const h = await S.object(`../ubrania/${plik.replace(/\.webp$/, "")}`, { x, y, size });
  h.rzecz = rzecz; h.tag = rzecz;
  return h;
}

// a dressing task: the child drags garment stickers (ubranieNaNaklejce) onto the characters. `pasuje(h, who)`
// says true, or "za_duze" / "za_male": a wrong one goes on at that wrong size, slips and falls off (and onWrong
// speaks), then flies home. Resolves when every sticker that has a match is worn (`zostaw` = stickers that
// belong to nobody, they stay). h.skala = how big it is worn (the same hat at two sizes).
export function ubieranie(S, { rzeczy, kto, pasuje, onWrong = null, zostaw = [] }) {
  for (const h of rzeczy) h.home = { x: h.mesh.position.x, y: h.mesh.position.y };
  const zostalo = new Set(rzeczy.filter((h) => !zostaw.includes(h)));
  return new Promise((resolve) => {
    S.free({
      items: rzeczy, ubieranie: { kto, pasuje, zostaw },
      onTap: () => {},
      onDrop: async (h, p) => {
        const L = kto.map((n) => [n, S.puppets[n]]).find(([, L]) => {
          if (!L?.korzen.visible) return false;
          const b = new THREE.Box3().setFromObject(L.korzen);
          return p.x > b.min.x - 0.3 && p.x < b.max.x + 0.3 && p.y > b.min.y - 0.3 && p.y < b.max.y + 0.5;
        });
        if (!L) { if (Math.abs(p.x) > 6 || p.y < -4.3) h.moveTo(h.home.x, h.home.y, 0.35); return; }
        const [who] = L, ocena = pasuje(h, who);
        if (ocena === true) {
          h.mesh.visible = false;
          await ubierz(S, who, h.rzecz, { skala: h.skala || 1 });
          h.remove(); zostalo.delete(h);
          if (!zostalo.size) { S.endSort(); S.sfx.graj("right"); resolve(true); }
          return;
        }
        h.mesh.visible = false;
        await nieUbieraj(S, who, h.rzecz, { skala: (h.skala || 1) * (ocena === "za_male" ? 0.55 : 1.7) });
        h.mesh.position.set(h.home.x, h.home.y, h.mesh.position.z); h.mesh.visible = true; S.appear(h);
        if (onWrong) onWrong(h, who, ocena);
      },
    });
  });
}
