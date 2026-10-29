// Mechanics, third set (accepted 2026-10-28, stages 4 and 6): the fence (a closed line drawn with a finger makes an inside),
// the lift (a basket on a rope over a pulley, stopping at levels), the ten frame and dominoes. The player wraps them as ctx calls.

import * as THREE from "three";
import { texture } from "./scene.js";

const FAST = new URLSearchParams(location.search).has("szybko");
const DREWNO = "#7a5530";

const srodek = (S, h) => { const b = S.bounds(h); return [(b.left + b.right) / 2, (b.bottom + b.top) / 2]; };
// is the point inside the polygon (even-odd ray cast)
export function wSrodku(poly, [x, y]) {
  let w = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) w = !w;
  }
  return w;
}
// a flat band from a to b (the live line under the finger, the rope)
function pasek(kolor, grubosc, z = 0.8, ro = 60) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, grubosc), new THREE.MeshBasicMaterial({ color: kolor, transparent: true, depthTest: false, depthWrite: false }));
  m.renderOrder = ro; m.position.z = z; m.frustumCulled = false;
  m.ustaw = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 0.001; m.position.x = (a[0] + b[0]) / 2; m.position.y = (a[1] + b[1]) / 2; m.scale.x = l; m.rotation.z = Math.atan2(dy, dx); };
  return m;
}

// ===================================================================== the fence
// a pencil fence along `pts` (closed or not): the rail plus a post every ~0.55 units; a handle with remove()
export async function plot(S, pts, { zamkniety = true, kolor = DREWNO, duration = 0.7 } = {}) {
  const sciezka = zamkniety ? [...pts, pts[0]] : pts.slice();
  const czesci = [await S.line(sciezka, { color: kolor, width: 0.09, duration, strong: true, name: "plot" })];
  let reszta = 0;
  for (let i = 1; i < sciezka.length; i++) {
    const [ax, ay] = sciezka[i - 1], [bx, by] = sciezka[i], l = Math.hypot(bx - ax, by - ay);
    for (let d = 0.55 - reszta; d <= l; d += 0.55) { const x = ax + ((bx - ax) * d) / l, y = ay + ((by - ay) * d) / l; czesci.push(await S.line([[x, y - 0.17], [x, y + 0.2]], { color: kolor, width: 0.08, duration: 0.02, strong: true, name: "slupek" })); }
    reszta = (reszta + l) % 0.55;
  }
  return { mesh: czesci[0].mesh, points: sciezka, remove: () => czesci.forEach((c) => c.remove()) };
}

// The child draws a line around things with a finger. Let go near the start = a closed fence; `chcemy(h)` says which
// of `rzeczy` belong inside: exactly those inside -> the fence is built (posts, a bump of everything inside) and the
// call resolves; a line left open -> onOtwarta (a thing walks out through the gap); a wrong set -> onZle. The wrong
// line fades. Tests: S.zagroda.dokoncz().
export async function zagroda(S, { rzeczy, chcemy = () => true, kolor = DREWNO, onOtwarta = null, onZle = null, uciekinier = null }) {
  const chciane = rzeczy.filter(chcemy);
  let pts = [], kreski = [], plotek = null;
  const grp = new THREE.Group(); S.scene.add(grp);
  const czysc = () => { for (const k of kreski) grp.remove(k); kreski = []; pts = []; };
  const zgas = async () => {
    const mats = kreski.map((k) => k.material);
    await S.tween(FAST ? 0.05 : 0.45, (s) => mats.forEach((m) => { m.opacity = 1 - s; })); czysc();
  };
  const zbuduj = async (poly) => {
    czysc(); plotek = await plot(S, poly, { kolor, duration: FAST ? 0.1 : 0.4 });
    S.sfx.graj("right"); for (const h of chciane) S.bump(h, 0.2, false);
  };
  const ocen = async (poly) => {
    const w = rzeczy.filter((h) => wSrodku(poly, srodek(S, h)));
    if (w.length === chciane.length && chciane.every((h) => w.includes(h))) { await zbuduj(poly); return true; }
    S.sfx.graj("wrong"); for (const h of rzeczy.filter((h) => w.includes(h) !== chciane.includes(h))) S.shake(h);
    await zgas(); onZle?.(w); return false;
  };
  const wynik = await new Promise((ok) => {
    const koniec = (poly) => { S.palec = null; S.zagroda = null; ok(poly); };
    S.palec = {
      down: (p) => { czysc(); pts.push(p); return true; },
      move: (p) => {
        const q = pts[pts.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.1) return;
        const k = pasek(kolor, 0.11); k.ustaw(q, p); grp.add(k); kreski.push(k);
        const d = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), k.material); d.position.set(p[0], p[1], 0.8); d.renderOrder = 60; grp.add(d); kreski.push(d);
        pts.push(p);
      },
      up: async () => {
        const dl = pts.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
        if (pts.length < 6 || dl < 2.0) { czysc(); return; }
        const poly = pts.slice(), [a, b] = [poly[0], poly[poly.length - 1]];
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) > Math.max(0.9, dl * 0.12)) {              // open: a gap between the ends
          S.sfx.graj("wrong");
          const u = uciekinier || chciane[0];
          if (u?.moveTo) { const [ux, uy] = srodek(S, u), gx = (a[0] + b[0]) / 2, gy = (a[1] + b[1]) / 2; const hx = u.mesh.position.x, hy = u.mesh.position.y;
            await u.moveTo(hx + (gx - ux) * 1.3, hy + (gy - uy) * 1.3, FAST ? 0.05 : 0.6); await u.moveTo(hx, hy, FAST ? 0.05 : 0.5); }
          await zgas(); onOtwarta?.(); return;
        }
        if (await ocen(poly)) koniec(poly);
      },
    };
    S.zagroda = {                                                        // tests: a loop around exactly the wanted things
      dokoncz: async () => {
        const cs = chciane.map((h) => srodek(S, h)), r = 0.95, kolo = [];
        for (const [x, y] of cs) for (let i = 0; i < 16; i++) kolo.push([x + r * Math.cos((i / 16) * 2 * Math.PI), y + r * Math.sin((i / 16) * 2 * Math.PI)]);
        const poly = otoczka(kolo);
        await zbuduj(poly); koniec(poly);
      },
      rzeczy, chcemy,
    };
  });
  S.scene.remove(grp);
  const wewnatrz = rzeczy.filter((h) => wSrodku(wynik, srodek(S, h)));
  return { plot: plotek, wewnatrz, remove: () => plotek?.remove() };
}
// convex hull (monotone chain)
function otoczka(p) {
  const P = p.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of P) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of P.reverse()) { while (hi.length > 1 && x(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}

// ===================================================================== the lift
// A basket (sticker `kosz`) hangs on a rope from a painted pulley (winda_kolo) under a beam (winda_belka) over (x, top);
// the rope (pieces of winda_lina stacked to any length, drawn behind every sticker) runs over the wheel and down its
// other side to a wooden toggle (winda_uchwyt). Pull the toggle down and the basket rises, or drag the basket itself;
// let go and it settles on the nearest of `pietra` (y of the basket's centre, bottom first). Things put in ride along.
// doPoziomu(i) waits for the child to bring it to level i. Tests: S.winda.dokoncz().
const ramkaAlfy = (img) => {
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data; let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (d[(y * img.width + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { u0: x0 / img.width, u1: (x1 + 1) / img.width, v0: 1 - (y1 + 1) / img.height, v1: 1 - y0 / img.height, asp: (y1 + 1 - y0) / (x1 + 1 - x0) };
};
// a rope from a (top) down to b: pieces of the painted rope, the last one cut short; ro below the stickers' 10
function lina(map, r, grubosc = 0.13) {
  const grp = new THREE.Group(), kawalek = grubosc * r.asp, pula = [];
  const mat = new THREE.MeshBasicMaterial({ map, transparent: true, depthTest: false, depthWrite: false });
  grp.ustaw = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), n = Math.ceil(l / kawalek);
    grp.position.set(a[0], a[1], 0.3); grp.rotation.z = Math.atan2(dy, dx) + Math.PI / 2;
    while (pula.length < n) {
      const g = new THREE.PlaneGeometry(grubosc, 1); const m = new THREE.Mesh(g, mat); m.renderOrder = 9.6; m.frustumCulled = false; grp.add(m); pula.push(m);
    }
    pula.forEach((m, i) => {
      m.visible = i < n; if (!m.visible) return;
      const h = Math.min(kawalek, l - i * kawalek), f = h / kawalek, uv = m.geometry.attributes.uv;
      m.scale.y = h; m.position.y = -(i * kawalek + h / 2);
      uv.setXY(0, r.u0, r.v1); uv.setXY(1, r.u1, r.v1); uv.setXY(2, r.u0, r.v1 - (r.v1 - r.v0) * f); uv.setXY(3, r.u1, r.v1 - (r.v1 - r.v0) * f); uv.needsUpdate = true;
    });
  };
  return grp;
}
export async function winda(S, { x = -2.0, pietra = [-2.0, 2.0], start = 0, kosz = "koszyk", size = 1.2, szer = 0.8, onZly = null } = {}) {
  const r = szer / 2, yK = Math.min(3.25 - r - 0.3, pietra[pietra.length - 1] + size * 0.5 + 0.5), xL = x, xP = x + szer, cx = x + r;
  pietra = pietra.map((p) => Math.min(p, yK - r - 0.3 - size * 0.4));    // the top level stops the basket under the wheel
  const dol = pietra[0], gora = pietra[pietra.length - 1];
  const h = await S.object(kosz, { x, y: pietra[start], size });
  const belka = await S.object("winda_belka", { x: cx, y: yK + r * 0.55, size: szer * 2.6, cicho: true });
  const kolo = await S.object("winda_kolo", { x: cx, y: yK, size: szer * 1.25, cicho: true });
  const raczka = await S.object("winda_uchwyt", { x: xP, y: 0, size: 0.55, cicho: true });
  const map = await texture("/game/assets/objects/winda_lina.webp"), rl = ramkaAlfy(map.image);
  const lina1 = lina(map, rl), lina2 = lina(map, rl), liny = new THREE.Group(); liny.add(lina1, lina2); S.scene.add(liny);
  const linyH = { mesh: liny, kind: "lina", name: "lina", base: 1, remove: () => { S.scene.remove(liny); const i = S.objects.indexOf(linyH); if (i >= 0) S.objects.splice(i, 1); } };
  S.objects.push(linyH);                                                 // clear() takes the ropes with the stickers
  const wiezie = [];                                                     // [handle, dx, dy]
  const gornaKosza = () => S.bounds(h).top - 0.08;
  const L = (yK - (dol + size * 0.4)) + (yK - gora);                     // rope length: basket down = toggle up
  let y = pietra[start];
  const ustaw = (ny) => {
    const dy = ny - y; y = ny; h.mesh.position.y = ny; h.home = { x, y: ny };
    for (const [t, ox, oy] of wiezie) { t.mesh.position.set(x + ox, ny + oy, t.mesh.position.z); t.home = { x: x + ox, y: ny + oy }; }
    const top = gornaKosza(), yr = yK - (L - (yK - top));
    lina1.ustaw([xL, yK], [x, top]); lina2.ustaw([xP, yK], [xP, yr]);
    raczka.mesh.position.set(xP, yr - 0.16, raczka.mesh.position.z); raczka.home = { x: xP, y: yr - 0.16 };
    kolo.mesh.rotation.z -= dy / r;                                      // the wheel turns as the rope runs over it
  };
  ustaw(y);
  const najblizszy = () => pietra.reduce((b, p, i) => (Math.abs(p - y) < Math.abs(pietra[b] - y) ? i : b), 0);
  const jedz = async (i, d = 0.6) => { const y0 = y, y1 = pietra[i]; if (Math.abs(y1 - y0) > 0.01) S.sfx.graj("whoosh", { glosnosc: 0.4 }); await S.tween(FAST ? 0.05 : d, (s) => ustaw(y0 + (y1 - y0) * s)); ustaw(y1); };
  const W = {
    kosz: h, pietra,
    poziom: () => najblizszy(),
    jedz,
    // a thing into the basket (it sits in it, its lower part hidden by the rim), out again to (nx, ny)
    wloz: async (t, dx = 0) => { const ty = gornaKosza() - h.mesh.position.y + 0.05; t.mesh.position.z = h.mesh.position.z - 0.02; await t.moveTo(x + dx, y + ty, FAST ? 0.05 : 0.4); wiezie.push([t, dx, ty]); S.sfx.graj("plop"); },
    wyjmij: async (t, nx, ny) => { const i = wiezie.findIndex((q) => q[0] === t); if (i >= 0) wiezie.splice(i, 1); await t.moveTo(nx, ny, FAST ? 0.05 : 0.4); },
    // the child works the lift until it stands at level i
    doPoziomu: (i) => new Promise((ok) => {
      let chwyt = null, dy0 = 0;
      S.palec = {
        down: (p) => {
          const b = S.bounds(h), rb = S.bounds(raczka);
          if (p[0] >= rb.left - 0.35 && p[0] <= rb.right + 0.35 && p[1] >= rb.bottom - 0.35 && p[1] <= rb.top + 0.35) { chwyt = "lina"; dy0 = p[1] - raczka.mesh.position.y; return true; }
          if (p[0] >= b.left - 0.2 && p[0] <= b.right + 0.2 && p[1] >= b.bottom - 0.2 && p[1] <= b.top + 0.2) { chwyt = "kosz"; dy0 = p[1] - y; return true; }
          return false;
        },
        move: (p) => {
          if (!chwyt) return;
          const ny = chwyt === "kosz" ? p[1] - dy0 : (() => { const yr = p[1] - dy0 + 0.16, top = yK - (L - (yK - yr)); return y + (top - gornaKosza()); })();
          ustaw(Math.max(dol, Math.min(gora, ny)));
        },
        up: async () => {
          if (!chwyt) return; chwyt = null;
          const k = najblizszy(); await jedz(k, 0.25); S.sfx.graj("plop");
          if (k === i) { S.palec = null; S.winda = null; ok(); } else onZly?.(k);
        },
      };
      S.winda = { dokoncz: async () => { await jedz(i); S.palec = null; S.winda = null; ok(); } };
    }),
    remove: () => [h, belka, kolo, raczka, linyH].forEach((q) => q.remove()),
  };
  return W;
}

// ===================================================================== the ten frame
// Two rows of five places (a card with a white rim); things dropped on it fill it place by place, top row first, so
// "five and some more" is seen at a glance. ramka(S, {x, y}) -> {wloz(h), ile(), miejsce(i), przeciagaj({rzeczy, ile,
// onZaDuzo}), remove}. przeciagaj waits until exactly `ile` lie in it (one more jumps back). Tests: the autopilot
// drops on the frame (dragSet.ramka).
export async function ramka(S, { x = 0.5, y = 1.0, krok = 0.95, kolor = "#2f6fd0" } = {}) {
  const grp = new THREE.Group(); grp.position.set(x, y, 0.32); S.scene.add(grp);
  const W = krok * 5 + 0.3, H = krok * 2 + 0.3;
  const tlo = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.22, H + 0.22), new THREE.MeshBasicMaterial({ color: "#8a5a2e", transparent: true, depthWrite: false }));   // a wooden frame
  const plyta = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ color: "#fdf6e6", transparent: true, depthWrite: false }));
  tlo.renderOrder = 9.2; plyta.renderOrder = 9.3; grp.add(tlo, plyta);
  const miejsca = [];
  const srodek = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.06), new THREE.MeshBasicMaterial({ color: "#8a5a2e", transparent: true, depthWrite: false }));
  srodek.renderOrder = 9.45; srodek.position.z = 0.02; grp.add(srodek);                 // the line between the two fives
  for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
    const mx = (k - 2) * krok, my = (0.5 - r) * krok;
    const kwadrat = new THREE.Mesh(new THREE.PlaneGeometry(krok - 0.12, krok - 0.12), new THREE.MeshBasicMaterial({ color: kolor, transparent: true, opacity: 0.22, depthWrite: false }));
    kwadrat.position.set(mx, my, 0.01); kwadrat.renderOrder = 9.4; grp.add(kwadrat);
    miejsca.push({ x: x + mx, y: y + my, h: null });
  }
  const h = { mesh: grp, kind: "ramka", name: "ramka", base: 1, remove: () => { S.scene.remove(grp); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); for (const m of miejsca) m.h?.remove?.(); } };
  S.objects.push(h);
  const ile = () => miejsca.filter((m) => m.h).length;
  const wloz = async (t) => {
    const m = miejsca.find((q) => !q.h); if (!m) return false;
    m.h = t; t.wRamce = true;
    while (t.bumping) await new Promise((ok) => setTimeout(ok, 30));      // measured mid pop-in it reads too small
    const b = S.bounds(t), s = Math.min(1, (krok - 0.18) / Math.max(b.right - b.left, b.top - b.bottom));
    t.mesh.scale.multiplyScalar(s); t.base = (t.base || 1) * s;
    await t.moveTo(m.x, m.y, FAST ? 0.05 : 0.25); S.sfx.graj("plop"); S.bump(t, 0.12, false);
    return true;
  };
  return {
    ...h, h, miejsca, ile, wloz,
    miejsce: (i) => miejsca[i],
    // drag things in until exactly n lie in the frame
    przeciagaj: ({ rzeczy, ile: n, onZaDuzo = null }) => new Promise((ok) => {
      S.free({
        items: rzeczy.slice(), ramka: { x, y, W, H, n, ile },
        onDrop: async (t, p) => {
          if (t.wRamce) return;
          const wRamke = Math.abs(p.x - x) < W / 2 + 0.3 && Math.abs(p.y - y) < H / 2 + 0.3;
          if (!wRamke) { await t.moveTo(t.home.x, t.home.y, 0.3); return; }
          if (ile() >= n) { S.sfx.graj("wrong"); await t.moveTo(t.home.x, t.home.y, 0.35); onZaDuzo?.(); return; }
          await wloz(t);
          if (ile() === n) { S.endSort(); S.sfx.graj("right"); ok(); }
        },
        onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
      });
    }),
  };
}

// ===================================================================== dominoes
// A domino tile: a white rounded tile, a line across the middle, dots on each half (die patterns 0-6). A handle like a
// sticker (a task target; `lewa`, `prawa`, `suma` on it). Pionowa by default (the halves above each other).
const WZORY = { 0: [], 1: [[0, 0]], 2: [[-1, 1], [1, -1]], 3: [[-1, 1], [0, 0], [1, -1]], 4: [[-1, 1], [1, 1], [-1, -1], [1, -1]], 5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]], 6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]] };
export function domino(S, a, b, { x = 0, y = 0.8, size = 2.4, pozioma = false } = {}) {
  const grp = new THREE.Group(); grp.position.set(x, y, 0.4); S.scene.add(grp);
  const w = size * 0.5, hh = size;
  const zaokr = (W, H, r) => { const s = new THREE.Shape(); s.moveTo(-W / 2 + r, -H / 2); s.lineTo(W / 2 - r, -H / 2); s.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r); s.lineTo(W / 2, H / 2 - r); s.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2); s.lineTo(-W / 2 + r, H / 2); s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r); s.lineTo(-W / 2, -H / 2 + r); s.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2); return s; };
  const mat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false });
  const brzeg = new THREE.Mesh(new THREE.ShapeGeometry(zaokr(w + 0.08, hh + 0.08, 0.14)), mat("#3a332d"));
  const plyta = new THREE.Mesh(new THREE.ShapeGeometry(zaokr(w, hh, 0.11)), mat("#fffaf0"));
  const kreska = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, 0.035), mat("#3a332d"));
  brzeg.renderOrder = 10; plyta.renderOrder = 10.1; kreska.renderOrder = 10.2; kreska.position.z = 0.01; grp.add(brzeg, plyta, kreska);
  const r = w * 0.085, u = w * 0.25;
  for (const [n, sy] of [[a, 1], [b, -1]]) for (const [px, py] of WZORY[n]) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(r, 20), mat("#2b2622")); d.position.set(px * u, sy * hh / 4 + py * u, 0.02); d.renderOrder = 10.3; grp.add(d);
  }
  if (pozioma) grp.rotation.z = Math.PI / 2;
  const h = { mesh: grp, kind: "object", name: "domino", base: 1, size0: 1, pulse: false, home: { x, y }, zone: null, lewa: a, prawa: b, suma: a + b,
    remove: () => { S.scene.remove(grp); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); S.untarget(h); },
    highlight: (on) => { h.pulse = on; if (!on) grp.scale.setScalar(1); },
    moveTo: (nx, ny, d = 0.4) => { const x0 = grp.position.x, y0 = grp.position.y; return S.tween(d, (s) => { grp.position.x = x0 + (nx - x0) * s; grp.position.y = y0 + (ny - y0) * s; }); } };
  S.objects.push(h); S.appear?.(h, true);
  return h;
}

// ===================================================================== a search picture (through a spyglass)
// One picture of a roznice pair (tools/roznice: the second picture, `b`, has the hidden things; its found areas are
// where they hide), shown big in a round spyglass view with a dark rim; the child taps each hidden thing - it gets a
// pencil ring and a tick in the count of empty circles at the side. szukaj(S, nazwa) -> {remove}. Tests: S.szukaj.dokoncz().
export async function szukaj(S, nazwa, { y = 0.25, size = 5.6, ikona = null } = {}) {
  const kat = `/game/assets/roznice/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const tex = await texture(kat + "b.webp");
  const grp = new THREE.Group(); grp.position.set(0, y, 0.3); S.scene.add(grp);
  const obraz = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 96), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  const uv = obraz.geometry.attributes.uv, pos = obraz.geometry.attributes.position;          // the square picture seen through a circle
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / size, 0.5 + pos.getY(i) / size);
  const brzeg = new THREE.Mesh(new THREE.RingGeometry(size / 2, size / 2 + 0.28, 96), new THREE.MeshBasicMaterial({ color: "#6b4a2a", transparent: true, depthWrite: false }));
  const brzeg2 = new THREE.Mesh(new THREE.RingGeometry(size / 2 + 0.28, size / 2 + 0.36, 96), new THREE.MeshBasicMaterial({ color: "#c9a25a", transparent: true, depthWrite: false }));
  obraz.renderOrder = 9.9; brzeg.renderOrder = 10; brzeg2.renderOrder = 10; grp.add(obraz, brzeg, brzeg2);
  const h = { mesh: grp, kind: "szukaj", name: "luneta_widok", base: 1, remove: () => { S.scene.remove(grp); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); } };
  S.objects.push(h);
  const punkt = (r) => [(r.x - 0.5) * size, y + (0.5 - r.y) * size];
  // inside the circle only: a hidden thing in the square's corner would be unseen
  const rzeczy = meta.roznice.filter((r) => Math.hypot(r.x - 0.5, r.y - 0.5) < 0.47);
  // the count: empty circles at the side, filled one by one
  const licznik = [];
  for (let i = 0; i < rzeczy.length; i++) {
    const ky = y + ((rzeczy.length - 1) / 2 - i) * 0.62, kx = Math.min(size / 2 + 0.85, 5.6);
    const k = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false }));
    const o = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.3, 32), new THREE.MeshBasicMaterial({ color: "#3a332d", transparent: true, depthWrite: false }));
    k.position.set(kx, ky - y, 0.01); o.position.set(kx, ky - y, 0.02); k.renderOrder = o.renderOrder = 10.2; grp.add(k, o); licznik.push(k);
  }
  const cele = rzeczy.map((r, k) => {
    const [px, py] = punkt(r), rr = Math.max(0.4, r.r * size);
    const m = new THREE.Mesh(new THREE.CircleGeometry(rr, 24), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    const g = new THREE.Group(); g.add(m); g.position.set(px, py, 0.5); S.scene.add(g);
    return uchwytCelu(S, g, { name: "ukryta", nr: k, r: rr, dobry: true, p: [px, py] });
  });
  const znalezione = new Set(), kolka = [];
  const kolo = ([cx, cy], r) => Array.from({ length: 41 }, (_, j) => { const a = j / 40 * Math.PI * 2 + 0.6; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92]; });
  const znajdz = async (hit) => {
    znalezione.add(hit.nr); S.sfx.graj("right");
    kolka.push(await S.line(kolo(hit.p, hit.r), { color: "#e8502e", width: 0.09, duration: 0.3, strong: true }));
    const k = licznik[znalezione.size - 1]; k.material.color.set("#f2b632"); S.bump({ mesh: k, base: 1 }, 0.3, false);
  };
  Object.defineProperty(S, "zachetaCel", { configurable: true, get: () => cele.find((c) => !znalezione.has(c.nr)) || null });
  S.szukaj = { dokoncz: async () => { for (const c of cele) if (!znalezione.has(c.nr)) await znajdz(c); } };
  while (znalezione.size < cele.length) {
    const hit = await S.choose(cele.filter((c) => !znalezione.has(c.nr)));
    if (hit && !znalezione.has(hit.nr)) await znajdz(hit);
  }
  S.szukaj = null;
  Object.defineProperty(S, "zachetaCel", { configurable: true, value: null, writable: true });
  cele.forEach((c) => c.remove());
  return { ...h, ile: cele.length, remove: () => { h.remove(); kolka.forEach((k) => k.remove()); } };
}
// ===================================================================== a found picture (znalezisko)
// game/assets/znaleziska/<name> (tools/znaleziska): a picture someone found - a map, a photo, a drawing, square or
// oblong - flies up from `skad` (a character's name or a handle) and lies big in the middle over a dimmed scene. It
// has `cele`: n spots to mark (one or more); the lesson asks with c.task({targets: z.cele.concat(z.tlo), correct:
// z.cele, wszystkie: n > 1}), so a tap elsewhere on the picture is a miss with the usual hint ladder. `zaznacz()`
// rings the spots in pencil; `remove()` puts the picture away.
export async function znalezisko(S, nazwa, { skad = null, y = 0.3, size = 5.6, rama = "#fffaf0", obrot = -2.5 } = {}) {
  const kat = `/game/assets/znaleziska/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const tex = await texture(kat + "obraz.webp");
  const ar = meta.wysokosc / meta.szerokosc, W = ar > 1 ? size / ar * 1.0 : size, H = W * ar, b = 0.32;
  const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
  // the veil: the scene goes quiet behind the picture
  const welon = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat({ color: "#1d1a17", opacity: 0 }));
  welon.position.set(0, 0, 0.42); welon.renderOrder = 38;             // over the characters (20-30): the picture is all there is S.scene.add(welon);
  const grp = new THREE.Group(); S.scene.add(grp);
  const karta = new THREE.Group(); karta.rotation.z = obrot * Math.PI / 180; grp.add(karta);
  const cien = new THREE.Mesh(new THREE.PlaneGeometry(W + b, H + b), mat({ color: "#000000", opacity: 0.28 }));
  cien.position.set(0.14, -0.16, -0.02); cien.renderOrder = 38.2;
  const brzeg = new THREE.Mesh(new THREE.PlaneGeometry(W + b, H + b), mat({ color: rama })); brzeg.position.z = -0.01; brzeg.renderOrder = 38.4;
  const obraz = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ map: tex })); obraz.renderOrder = 38.6;
  karta.add(cien, brzeg, obraz);
  const h = { mesh: grp, kind: "znalezisko", name: nazwa, base: 1, remove: () => { S.scene.remove(grp); S.scene.remove(welon); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); } };
  S.objects.push(h);
  // the spots: invisible discs on the picture (in the card, so they turn with it); the rest of the picture is a miss
  const cele = meta.cele.map((c, k) => {
    const rr = Math.max(0.45, c.r * W), g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CircleGeometry(rr, 24), mat({ opacity: 0, side: THREE.DoubleSide })));
    g.position.set((c.x - 0.5) * W, (0.5 - c.y) * H, 0.05); karta.add(g);
    return uchwytCelu(S, g, { name: `${nazwa}_${k}`, nr: k, r: rr, dobry: true });
  });
  const tlo = uchwytCelu(S, obraz, { name: `${nazwa}_obraz`, dobry: false });
  // the flight: from whoever found it, small, to the middle, big
  let x0 = 0, y0 = y - 2;
  const L = typeof skad === "string" ? S.puppets[skad] : null;
  if (L) { x0 = L.korzen.position.x; y0 = L.korzen.position.y + 2.2; } else if (skad?.mesh) { x0 = skad.mesh.position.x; y0 = skad.mesh.position.y; }
  grp.position.set(x0, y0, 0.45); grp.scale.setScalar(0.12);
  S.sfx.graj("whoosh");
  await S.tween(0.55, (s) => { const e = 1 - (1 - s) ** 3; grp.position.set(x0 + (0 - x0) * e, y0 + (y - y0) * e, 0.45); grp.scale.setScalar(0.12 + 0.88 * e); welon.material.opacity = 0.42 * e; });
  const kolka = [];
  const kolo = (c) => { const w = new THREE.Vector3(); c.mesh.getWorldPosition(w); return Array.from({ length: 41 }, (_, j) => { const a = j / 40 * Math.PI * 2 + 0.6; return [w.x + Math.cos(a) * c.r, w.y + Math.sin(a) * c.r * 0.92]; }); };
  return {
    ...h, cele, tlo, meta,
    zaznacz: async () => { for (const c of cele) { const k = await S.line(kolo(c), { color: "#e8502e", width: 0.1, duration: 0.3, strong: true }); k.mesh.traverse((o) => { o.renderOrder = 39; }); kolka.push(k); } },
    remove: async () => {
      cele.forEach((c) => c.remove()); tlo.remove(); kolka.forEach((k) => k.remove());
      await S.tween(0.3, (s) => { grp.scale.setScalar(1 - 0.9 * s); welon.material.opacity = 0.42 * (1 - s); });
      h.remove();
    },
  };
}

function uchwytCelu(S, g, extra) {
  const h = { mesh: g, kind: "object", base: 1, size0: 1, pulse: false, zone: null, ...extra,
    remove: () => { S.scene.remove(g); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); S.untarget(h); },
    highlight: (on) => { h.pulse = on; if (!on) g.scale.setScalar(1); } };
  S.objects.push(h); return h;
}
