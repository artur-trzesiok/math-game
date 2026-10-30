// Mechanics, third set (accepted 2026-10-28, stages 4 and 6): the fence (a closed line drawn with a finger makes an inside),
// the lift (a basket on a rope over a pulley, stopping at levels), the ten frame and dominoes. The player wraps them as ctx calls.

import * as THREE from "three";
import { texture } from "./scene.js";
import { v } from "./v.js";

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
  // the painted wooden tray (tools/objects/make_ramka.py, cups laid out from this geometry); flat shapes without it
  const malowana = krok === 0.95 ? await texture("/game/assets/objects/ramka_dziesiatkowa.webp").catch(() => null) : null;
  const plaski = (w, h, o) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o }));
  if (malowana) {
    const tacka = plaski(W + 0.22 + 0.04, H + 0.22 + 0.04, { map: malowana }); tacka.renderOrder = 9.3; grp.add(tacka);
  } else {
    const tlo = plaski(W + 0.22, H + 0.22, { color: "#8a5a2e" }), plyta = plaski(W, H, { color: "#fdf6e6" });   // a wooden frame
    tlo.renderOrder = 9.2; plyta.renderOrder = 9.3; grp.add(tlo, plyta);
    const srodek = plaski(W, 0.06, { color: "#8a5a2e" });
    srodek.renderOrder = 9.45; srodek.position.z = 0.02; grp.add(srodek);               // the line between the two fives
  }
  const miejsca = [];
  for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
    const mx = (k - 2) * krok, my = (0.5 - r) * krok;
    if (!malowana) {
      const kwadrat = plaski(krok - 0.12, krok - 0.12, { color: kolor, opacity: 0.22 });
      kwadrat.position.set(mx, my, 0.01); kwadrat.renderOrder = 9.4; grp.add(kwadrat);
    }
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
// the painted tile and pip (tools/objects/make_domino.py), loaded with the module; flat shapes until they are in
const DOMINO = {};
for (const n of ["plytka", "oczko"]) texture(`/game/assets/objects/domino_${n}.webp`).then((t) => { DOMINO[n] = t; }, () => {});

export function domino(S, a, b, { x = 0, y = 0.8, size = 2.4, pozioma = false } = {}) {
  const grp = new THREE.Group(); grp.position.set(x, y, 0.4); S.scene.add(grp);
  const w = size * 0.5, hh = size;
  const zaokr = (W, H, r) => { const s = new THREE.Shape(); s.moveTo(-W / 2 + r, -H / 2); s.lineTo(W / 2 - r, -H / 2); s.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r); s.lineTo(W / 2, H / 2 - r); s.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2); s.lineTo(-W / 2 + r, H / 2); s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r); s.lineTo(-W / 2, -H / 2 + r); s.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2); return s; };
  const mat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false });
  if (DOMINO.plytka) {
    const im = DOMINO.plytka.image, H2 = hh + 0.12, W2 = H2 * im.width / im.height;
    const t = new THREE.Mesh(new THREE.PlaneGeometry(W2, H2), new THREE.MeshBasicMaterial({ map: DOMINO.plytka, transparent: true, depthWrite: false }));
    t.renderOrder = 10.1; grp.add(t);
  } else {
    const brzeg = new THREE.Mesh(new THREE.ShapeGeometry(zaokr(w + 0.08, hh + 0.08, 0.14)), mat("#3a332d"));
    const plyta = new THREE.Mesh(new THREE.ShapeGeometry(zaokr(w, hh, 0.11)), mat("#fffaf0"));
    const kreska = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, 0.035), mat("#3a332d"));
    brzeg.renderOrder = 10; plyta.renderOrder = 10.1; kreska.renderOrder = 10.2; kreska.position.z = 0.01; grp.add(brzeg, plyta, kreska);
  }
  const r = w * 0.085, u = w * 0.25;
  for (const [n, sy] of [[a, 1], [b, -1]]) for (const [px, py] of WZORY[n]) {
    const d = DOMINO.oczko
      ? new THREE.Mesh(new THREE.PlaneGeometry(2.3 * r, 2.3 * r), new THREE.MeshBasicMaterial({ map: DOMINO.oczko, transparent: true, depthWrite: false }))
      : new THREE.Mesh(new THREE.CircleGeometry(r, 20), mat("#2b2622"));
    d.position.set(px * u, sy * hh / 4 + py * u, 0.02); d.renderOrder = 10.3; grp.add(d);
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
// `luneta: false` - the same search on a plain picture in a paper frame over the dimmed scene, like a found picture
// (pieces in the grass need no spyglass): it makes room for the characters and stays where the scene is.
export async function szukaj(S, nazwa, { y = 0.25, size = 5.6, ikona = null, luneta = true } = {}) {
  const kat = `/game/assets/roznice/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const tex = await texture(kat + "b.webp");
  // the painted ring keeps the old outer size (inside the safe area); the view shrinks to its hole
  const om = await fetch(v("/game/assets/objects/luneta_obwodka.json"), { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const ramaZew = size / 2 + 0.36;
  if (luneta && om?.wew) size = ramaZew * om.wew * 2 + 0.08;
  const RO = luneta ? 0 : 28.6;                                                   // a plain picture lies over the characters
  let gx = 0, welon = null, wroc = null;
  if (!luneta) {
    const m = miejsceNaObraz(S, size + 0.32); size *= m.k; gx = m.cx;              // the count in a row under it
    wroc = odsun(S, gx - size / 2 - 0.4, gx + size / 2 + 0.4);
    welon = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ color: "#1d1a17", transparent: true, opacity: 0, depthWrite: false }));
    welon.position.set(0, 0, 0.42); welon.renderOrder = 38; S.scene.add(welon);
    S.tween(0.35, (s) => { welon.material.opacity = 0.58 * s; });
  }
  const grp = new THREE.Group(); grp.position.set(gx, y, luneta ? 0.3 : 0.45); S.scene.add(grp);
  const obraz = new THREE.Mesh(luneta ? new THREE.CircleGeometry(size / 2, 96) : new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  const uv = obraz.geometry.attributes.uv, pos = obraz.geometry.attributes.position;          // the square picture seen through a circle
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / size, 0.5 + pos.getY(i) / size);
  const brzeg = new THREE.Mesh(new THREE.RingGeometry(size / 2, size / 2 + 0.28, 96), new THREE.MeshBasicMaterial({ color: "#6b4a2a", transparent: true, depthWrite: false }));
  const brzeg2 = new THREE.Mesh(new THREE.RingGeometry(size / 2 + 0.28, size / 2 + 0.36, 96), new THREE.MeshBasicMaterial({ color: "#c9a25a", transparent: true, depthWrite: false }));
  obraz.renderOrder = 9.9 + RO; brzeg.renderOrder = 10; brzeg2.renderOrder = 10; grp.add(obraz);
  if (luneta) grp.add(brzeg, brzeg2);
  else {                                                                              // a picture on paper, like a found picture
    const rama = new THREE.Mesh(new THREE.PlaneGeometry(size + 0.32, size + 0.32), new THREE.MeshBasicMaterial({ color: "#fffaf0", transparent: true, depthWrite: false }));
    const cien = new THREE.Mesh(new THREE.PlaneGeometry(size + 0.32, size + 0.32), new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.28, depthWrite: false }));
    rama.position.z = -0.01; cien.position.set(0.14, -0.16, -0.02); rama.renderOrder = 9.8 + RO; cien.renderOrder = 9.7 + RO; grp.add(cien, rama);
  }
  // the painted eyepiece ring (tools/objects/make_luneta_obwodka.py) over the drawn one, its hole fitted to the view
  let ramaR = luneta ? size / 2 + 0.36 : size / 2 + 0.16;
  if (luneta && om?.wew) {
    ramaR = ramaZew;
    const P = ramaR * 2;
    const ob = new THREE.Mesh(new THREE.PlaneGeometry(P, P), new THREE.MeshBasicMaterial({ map: await texture("/game/assets/objects/luneta_obwodka.webp"), transparent: true, depthWrite: false }));
    ob.renderOrder = 10; grp.remove(brzeg, brzeg2); grp.add(ob); ramaR = P / 2;
  }
  const h = { mesh: grp, kind: "szukaj", name: "luneta_widok", base: 1, remove: () => { S.scene.remove(grp); if (welon) S.scene.remove(welon); wroc?.then((f) => f()); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); } };
  S.objects.push(h);
  const punkt = (r) => [gx + (r.x - 0.5) * size, y + (0.5 - r.y) * size];
  // inside the circle only: a hidden thing in the square's corner would be unseen
  const rzeczy = meta.roznice.filter((r) => !luneta || Math.hypot(r.x - 0.5, r.y - 0.5) < 0.47);
  // the count: empty circles at the side, filled one by one
  const licznik = [];
  for (let i = 0; i < rzeczy.length; i++) {
    // on the painted ring: set into its right arc like gems (no room beside it for a column and a character in 4:3)
    const luk = luneta && om?.wew ? ramaR * (om.wew + (1 - om.wew) * 0.64) : 0, kat = ((rzeczy.length - 1) / 2 - i) * 0.27;
    const ky = luk ? y + Math.sin(kat) * luk : luneta ? y + ((rzeczy.length - 1) / 2 - i) * 0.62 : y - size / 2 - 0.55;
    const kx = luk ? Math.cos(kat) * luk : luneta ? Math.min(ramaR + 0.5, 5.6) : (i - (rzeczy.length - 1) / 2) * 0.66;
    const k = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false }));
    const o = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.3, 32), new THREE.MeshBasicMaterial({ color: "#3a332d", transparent: true, depthWrite: false }));
    k.position.set(kx, ky - y, 0.01); o.position.set(kx, ky - y, 0.02); k.renderOrder = o.renderOrder = 10.2 + RO; grp.add(k, o); licznik.push(k);
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
    kolka.push(await S.line(kolo(hit.p, hit.r), { color: "#e8502e", width: 0.09, duration: 0.3, strong: true, warstwa: luneta ? 11 : 39.6 }));
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
// a big picture over the scene: every character it would cover steps aside to the nearer side, its whole body inside
// the 4:3 safe area (x -6..6); returns a function that walks them back (only those still where they stepped to)
export async function odsun(S, x0, x1) {
  // a side with someone covered is repacked from the safe edge inwards, side by side (two characters on one side
  // used to end up on top of each other)
  const SAFE = 6, ZAKLAD = 0.95, wroc = [], ruchy = [], mid = (x0 + x1) / 2;
  const widoczne = Object.entries(S.puppets).filter(([, L]) => L.korzen.visible && Math.abs(L.korzen.position.x) < SAFE + 1)
    .map(([n, L]) => { const b = S.bounds(L), x = L.korzen.position.x; return { n, L, x, b, lewo: x - b.left, prawo: b.right - x }; });
  for (const strona of [-1, 1]) {
    const ci = widoczne.filter((p) => Math.sign(p.x - mid || -1) === strona).sort((a, b) => strona * (b.x - a.x));   // outermost first
    if (!ci.some((p) => p.b.right > x0 + 0.25 && p.b.left < x1 - 0.25)) continue;
    let brzeg = strona * SAFE;
    for (const p of ci) {
      const cel = strona < 0 ? brzeg + p.lewo : brzeg - p.prawo;
      brzeg = strona < 0 ? cel + p.prawo * ZAKLAD : cel - p.lewo * ZAKLAD;
      if (Math.abs(cel - p.x) < 0.05) continue;
      wroc.push([p.n, p.L, p.x, cel]); ruchy.push(S.walkTo(p.n, cel));
    }
  }
  await Promise.all(ruchy);
  return () => Promise.all(wroc.map(([n, L, x, cel]) => (Math.abs(L.korzen.position.x - cel) < 1e-3 ? S.walkTo(n, x) : null)));
}

// where a big picture of width `szer` goes so every character on screen keeps room beside it inside the 4:3 safe area:
// {k: its scale (<= 1), cx: its centre}; a wide owl and a squirrel leave less than the full width
export function miejsceNaObraz(S, szer) {
  const SAFE = 6; let lewa = -SAFE, prawa = SAFE;
  for (const L of Object.values(S.puppets)) {
    if (!L.korzen.visible || Math.abs(L.korzen.position.x) > SAFE + 1) continue;
    const b = S.bounds(L), w = b.right - b.left;
    if (L.korzen.position.x < 0) lewa += w * 0.95 + 0.15; else prawa -= w * 0.95 + 0.15;   // characters on one side stand side by side
  }
  const k = Math.max(0.6, Math.min(1, (prawa - lewa) / szer)), pol = szer * k / 2;
  return { k, cx: Math.max(lewa + pol, Math.min(prawa - pol, 0)) };
}

export async function znalezisko(S, nazwa, { skad = null, y = 0.3, size = 7.6, rama = "#fffaf0", obrot = -2.5, bezLotu = false, x = null } = {}) {
  const kat = `/game/assets/znaleziska/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const tex = await texture(kat + "obraz.webp");
  const ar = meta.wysokosc / meta.szerokosc, b = 0.32;
  let W = ar > 1 ? size / ar * 1.0 : size, cx = x ?? 0;
  if (x === null) { const m = miejsceNaObraz(S, W + b); W *= m.k; cx = m.cx; }
  const H = W * ar;
  const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
  // the veil: the scene goes quiet behind the picture
  const welon = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat({ color: "#1d1a17", opacity: 0 }));
  welon.position.set(0, 0, 0.42); welon.renderOrder = 38; S.scene.add(welon);   // over the characters (20-30): the picture is all there is
  const grp = new THREE.Group(); S.scene.add(grp);
  const karta = new THREE.Group(); karta.rotation.z = obrot * Math.PI / 180; grp.add(karta);
  const cien = new THREE.Mesh(new THREE.PlaneGeometry(W + b, H + b), mat({ color: "#000000", opacity: 0.28 }));
  cien.position.set(0.14, -0.16, -0.02); cien.renderOrder = 38.2;
  const brzeg = new THREE.Mesh(new THREE.PlaneGeometry(W + b, H + b), mat({ color: rama })); brzeg.position.z = -0.01; brzeg.renderOrder = 38.4;
  const obraz = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ map: tex })); obraz.renderOrder = 38.6;
  karta.add(cien, brzeg, obraz);
  const wrocPostacie = odsun(S, cx - (W + b) / 2 - 0.2, cx + (W + b) / 2 + 0.2);         // nobody speaks from behind the picture
  const h = { mesh: grp, kind: "znalezisko", name: nazwa, base: 1, remove: () => { S.scene.remove(grp); S.scene.remove(welon); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); wrocPostacie.then((f) => f()); } };
  S.objects.push(h);
  // the spots: invisible discs on the picture (in the card, so they turn with it); the rest of the picture is a miss
  const lokalnie = ([x, yy]) => [(x - 0.5) * W, (0.5 - yy) * H];
  const cele = meta.cele.map((c, k) => {
    const rr = Math.max(0.45, c.r * W), g = new THREE.Group();
    if (c.droga) {                                   // a whole path: discs all along it, one target (any of them counts)
      const [ox, oy] = lokalnie(c.droga[Math.floor(c.droga.length / 2)]); g.position.set(ox, oy, 0.05);   // its middle: where a test taps
      for (const q of c.droga) { const [px, py] = lokalnie(q); const d = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), mat({ opacity: 0, side: THREE.DoubleSide })); d.position.set(px - ox, py - oy, 0); g.add(d); }
      karta.add(g);
      return uchwytCelu(S, g, { name: `${nazwa}_${k}`, nr: k, r: rr, dobry: false, droga: c.droga });
    }
    g.add(new THREE.Mesh(new THREE.CircleGeometry(rr, 24), mat({ opacity: 0, side: THREE.DoubleSide })));
    g.position.set((c.x - 0.5) * W, (0.5 - c.y) * H, 0.05); karta.add(g);
    return uchwytCelu(S, g, { name: `${nazwa}_${k}`, nr: k, r: rr, dobry: false, nadObrazem: 39 });   // rings and counting digits draw over the picture; the lesson marks the right one (dobre)
  });
  const tlo = uchwytCelu(S, obraz, { name: `${nazwa}_obraz`, dobry: false });
  // the flight: from whoever found it, small, to the middle, big
  let x0 = 0, y0 = y - 2;
  const L = typeof skad === "string" ? S.puppets[skad] : null;
  if (L) { x0 = L.korzen.position.x; y0 = L.korzen.position.y + 2.2; } else if (skad?.mesh) { x0 = skad.mesh.position.x; y0 = skad.mesh.position.y; }
  if (bezLotu) { grp.position.set(cx, y, 0.45); welon.material.opacity = 0.58; }   // it is already there (a torn picture just put together)
  else {
    grp.position.set(x0, y0, 0.45); grp.scale.setScalar(0.12);
    S.sfx.graj("whoosh");
    await S.tween(0.55, (s) => { const e = 1 - (1 - s) ** 3; grp.position.set(x0 + (cx - x0) * e, y0 + (y - y0) * e, 0.45); grp.scale.setScalar(0.12 + 0.88 * e); welon.material.opacity = 0.58 * e; });
  }
  const kolka = [];
  const kolo = (c) => { const w = new THREE.Vector3(); c.mesh.getWorldPosition(w); return Array.from({ length: 41 }, (_, j) => { const a = j / 40 * Math.PI * 2 + 0.6; return [w.x + Math.cos(a) * c.r, w.y + Math.sin(a) * c.r * 0.92]; }); };
  return {
    ...h, cele, tlo, meta,
    // `ktore`: the spots to mark (all by default); a path is drawn along in pencil, a spot is ringed
    zaznacz: async (ktore = cele) => {
      for (const c of [].concat(ktore)) {
        const pts = c.droga ? c.droga.map((q) => { const v = new THREE.Vector3(...lokalnie(q), 0); karta.localToWorld(v); return [v.x, v.y]; }) : kolo(c);
        kolka.push(await S.line(pts, { color: "#e8502e", width: c.droga ? 0.16 : 0.1, duration: c.droga ? 0.6 : 0.3, strong: true, warstwa: 39 }));
      }
    },
    remove: async () => {
      cele.forEach((c) => c.remove()); tlo.remove(); kolka.forEach((k) => k.remove());
      await S.tween(0.3, (s) => { grp.scale.setScalar(1 - 0.9 * s); welon.material.opacity = 0.58 * (1 - s); });
      h.remove();
    },
  };
}

// ===================================================================== a maze (labirynt)
// game/assets/labirynty/<name> (tools/labirynty): a painted maze whose plan (cells and walls) the game checks moves on.
// It lies big over a dimmed scene; `pionek` (a sticker) stands at the entrance, `cel` (a sticker) at the exit. The child
// leads the pawn with a finger: it steps into the next cell only through an opening, a pencil trail behind it; going
// back is allowed. Resolves at the exit; `S.labirynt.dokoncz()` walks it there (tests).
export async function labirynt(S, nazwa, { pionek = "jez", cel = null, y = 0.2, szer = 10.2 } = {}) {
  const kat = `/game/assets/labirynty/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const tex = await texture(kat + "obraz.webp");
  const W = szer, H = W * meta.wysokosc / meta.szerokosc, K = meta.kolumny, R = meta.wiersze;
  const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
  const welon = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat({ color: "#1d1a17", opacity: 0 }));
  welon.position.set(0, 0, 0.42); welon.renderOrder = 38; S.scene.add(welon);
  const grp = new THREE.Group(); grp.position.set(0, y, 0.45); S.scene.add(grp);
  const brzeg = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.3, H + 0.3), mat({ color: "#fffaf0" })); brzeg.position.z = -0.01; brzeg.renderOrder = 38.4;
  const obraz = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ map: tex })); obraz.renderOrder = 38.6;
  grp.add(brzeg, obraz);
  const [fx0, fy0, fx1, fy1] = meta.ramka, cw = (fx1 - fx0) * W / K, ch = (fy1 - fy0) * H / R;
  const srodek = ([c, r]) => [-W / 2 + fx0 * W + (c + 0.5) * cw, y + H / 2 - fy0 * H - (r + 0.5) * ch];
  const komorka = ([x, yy]) => [Math.floor((x + W / 2 - fx0 * W) / cw), Math.floor((y + H / 2 - fy0 * H - yy) / ch)];
  const sciana = ([c, r], k) => meta.sciany[r * K + c][k];          // k: 0 N, 1 E, 2 S, 3 W
  const KIER = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const otwarte = (a, b) => { const k = KIER.findIndex(([dx, dy]) => a[0] + dx === b[0] && a[1] + dy === b[1]); return k >= 0 && !sciana(a, k); };
  // the pawn and the goal: stickers over the picture
  const naWierzch = (h, ro) => h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = ro; });
  let poz = meta.start.slice();
  const [sx, sy] = srodek(poz), roz = Math.min(cw, ch) * 0.8;
  const pion = await S.object(pionek, { x: sx, y: sy, size: roz, z: 0.6 }); naWierzch(pion, 39.5);
  let meta2 = null;
  if (cel) { const [gx, gy] = srodek(meta.cel); meta2 = await S.object(cel, { x: gx, y: gy, size: roz * 0.9, z: 0.55 }); naWierzch(meta2, 39.2); }
  await S.tween(0.35, (s) => { welon.material.opacity = 0.58 * s; });
  const slad = [];
  const krok = async (nowa) => {
    const a = srodek(poz), b = srodek(nowa); poz = nowa;
    S.line([a, b], { color: "#e8502e", width: 0.12, duration: 0.12, strong: true, wait: false, warstwa: 38.9 }).then((k) => slad.push(k));
    await pion.moveTo(b[0], b[1], 0.12);
  };
  const wyjscie = async () => { S.sfx.graj("right"); if (meta2) S.bump(meta2, 0.3, false); await S.wait(0.4); };
  await new Promise((gotowe) => {
    let aktywny = false, idzie = false, koniec = false;
    const sprawdzKoniec = async () => { if (!koniec && poz[0] === meta.cel[0] && poz[1] === meta.cel[1]) { koniec = true; oddaj(); S.labirynt = null; await wyjscie(); gotowe(); } };
    const oddaj = (() => { const h = {
      down: ([px, py]) => { const [x, yy] = srodek(poz); if (Math.hypot(px - x, py - yy) > Math.max(cw, ch) * 0.8) return false; aktywny = true; S.sfx.graj("tap"); return true; },
      move: async ([px, py]) => {
        if (!aktywny || idzie || koniec) return;
        const k = komorka([px, py]);
        if (k[0] === poz[0] && k[1] === poz[1]) return;
        // one cell at a time, towards the finger: through an opening it goes, against a hedge it stops
        const dx = Math.sign(k[0] - poz[0]), dy = Math.sign(k[1] - poz[1]);
        const proba = Math.abs(k[0] - poz[0]) >= Math.abs(k[1] - poz[1]) ? [[poz[0] + dx, poz[1]], [poz[0], poz[1] + dy]] : [[poz[0], poz[1] + dy], [poz[0] + dx, poz[1]]];
        const nast = proba.find((n) => (n[0] !== poz[0] || n[1] !== poz[1]) && otwarte(poz, n));
        if (!nast) return;
        idzie = true; await krok(nast); idzie = false; sprawdzKoniec();
      },
      up: () => { aktywny = false; },
    }; S.palec = h; return () => { if (S.palec === h) S.palec = null; }; })();
    S.labirynt = { meta, dokoncz: async () => {                     // tests: the way out by a search over the plan
      const klucz = (q) => q.join(","), skad = new Map([[klucz(poz), null]]), kol = [poz];
      while (kol.length) { const q = kol.shift(); if (q[0] === meta.cel[0] && q[1] === meta.cel[1]) break; for (const [dx, dy] of KIER) { const n = [q[0] + dx, q[1] + dy]; if (n[0] < 0 || n[1] < 0 || n[0] >= K || n[1] >= R || skad.has(klucz(n)) || !otwarte(q, n)) continue; skad.set(klucz(n), q); kol.push(n); } }
      const droga = []; for (let q = meta.cel; q && klucz(q) !== klucz(poz); q = skad.get(klucz(q))) droga.unshift(q);
      for (const q of droga) await krok(q);
      await sprawdzKoniec();
    } };
  });
  const h = { mesh: grp, kind: "labirynt", name: nazwa, base: 1,
    remove: async () => { slad.forEach((k) => k.remove()); pion.remove(); meta2?.remove(); await S.tween(0.3, (s) => { welon.material.opacity = 0.58 * (1 - s); grp.scale.setScalar(1 - 0.9 * s); }); S.scene.remove(grp); S.scene.remove(welon); } };
  return h;
}

function uchwytCelu(S, g, extra) {
  const h = { mesh: g, kind: "object", base: 1, size0: 1, pulse: false, zone: null, ...extra,
    remove: () => { S.scene.remove(g); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); S.untarget(h); },
    highlight: (on) => { h.pulse = on; if (!on) g.scale.setScalar(1); } };
  S.objects.push(h); return h;
}
