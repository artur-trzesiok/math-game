// Mechanics (accepted 2026-10-28): tracing with a finger, a balance scale, a number line to hop along, a tower of
// blocks that falls when built wrong, cups to hide things under, counting by ear, cutting into equal parts.
// Each takes the Stage; the player wraps them as ctx calls (slad, waga, os, wieza, kubki, dzwieki, podziel).

import * as THREE from "three";
import { probkuj } from "./olowek.js";
import { CYFRY, narysujCyfre } from "./liczby.js";
import { KSZTALTY, ksztalt } from "./geometria.js";
import { GROUND, texture } from "./scene.js";
import { ruch } from "./rytm.js";

const FAST = new URLSearchParams(location.search).has("szybko");
const czekaj = (s) => new Promise((ok) => setTimeout(ok, s * 1000));
const lerp = (a, b, t) => a + (b - a) * t;
const dl = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// the finger on the stage while drawing: the stage hands it every pointer (down returns false to let a tap through)
const palec = (S, h) => { S.palec = h; return () => { if (S.palec === h) S.palec = null; }; };
function kropka(S, [x, y], { r = 0.2, kolor = "#4caf50" } = {}) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color: kolor, transparent: true, depthWrite: false, depthTest: false }));
  const obw = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.06, 32), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false, depthTest: false }));
  const g = new THREE.Group(); g.add(obw, m); g.position.set(x, y, 0.6); m.renderOrder = obw.renderOrder = 14; S.scene.add(g);
  return { mesh: g, remove: () => S.scene.remove(g) };
}
const kreskaMaterialy = (h) => { const out = []; h.mesh.traverse((o) => { if (o.material?.uniforms?.postep) out.push(o.material.uniforms.postep); }); return out; };

// ===================================================================== 1. tracing with a finger
// `co` a digit (0-9: the strokes a child writes, in order) or a shape (kolo, trojkat, kwadrat, prostokat). A light
// road shows the way and draws itself in the stroke's direction; a green dot marks where the finger starts; the
// pencil follows the finger along the road (only forward, only near it - off the road it simply stops, and the dot
// waits where it stopped). Resolves when every stroke is traced; the ink stays (`remove()` on the result).
function drogi(co, x, y, size) {
  if (typeof co === "number") {
    const k = size / 1.4, ox = x - 0.45 * k, oy = y - size / 2, map = ([px, py]) => [ox + px * k, oy + py * k];
    return CYFRY[co].map((s) => probkuj(s.bezier ? { bezier: s.bezier.map(map) } : s.map(map), 0.03));
  }
  const pts = KSZTALTY[co].pts.map(([a, b]) => [x + a * size, y + b * size]);
  let s = 0; pts.forEach((p, i) => { if (p[1] - 0.001 * p[0] > pts[s][1] - 0.001 * pts[s][0]) s = i; });   // from the top (left): how a child starts
  const od = [...pts.slice(s), ...pts.slice(0, s)];
  return [probkuj([...od, od[0]], 0.03)];
}
export async function slad(S, co, { x = 0, y = 0.4, size = 3.4, tolerancja = 0.5, kolor = "#3f7fe0" } = {}) {
  const kreski = drogi(co, x, y, size), drogiH = [], tusz = [];
  for (const pts of kreski) drogiH.push(await S.line(pts, { color: "#e2d6c2", width: 0.34, duration: FAST ? 0.05 : 0.5, halo: true, strong: false, wobble: 0 }));
  for (const [ki, pts] of kreski.entries()) {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dl(pts[i], pts[i - 1]));
    // the ink waits for the finger: hidden until its draw-in has been reset to nothing (it would flash in full)
    const ink = await S.line(pts, { color: kolor, width: 0.17, duration: 0.01, strong: true, wobble: 0.004, wait: false });
    ink.mesh.visible = false; await czekaj(0.06);
    const postep = kreskaMaterialy(ink); postep.forEach((u) => (u.value = 0)); ink.mesh.visible = true; tusz.push(ink);
    let i = 0, aktywny = false, kr = kropka(S, pts[0]);
    const tetno = setInterval(() => { const s = 1 + 0.18 * Math.sin(performance.now() / 160); kr.mesh.scale.setScalar(aktywny ? 1 : s); }, 40);
    await new Promise((gotowe) => {
      const ustaw = (j) => { i = j; postep.forEach((u) => (u.value = cum[i] / cum[cum.length - 1])); kr.mesh.position.set(pts[i][0], pts[i][1], 0.6); if (i >= pts.length - 3) koniec(); };
      const koniec = () => { postep.forEach((u) => (u.value = 1)); oddaj(); clearInterval(tetno); kr.remove(); S.sfx.graj(ki === kreski.length - 1 ? "right" : "pop"); gotowe(); };
      const oddaj = palec(S, {
        down: ([px, py]) => { if (dl([px, py], pts[i]) > tolerancja * 1.4) return false; aktywny = true; S.sfx.graj("pencil", { dlugosc: 0.3 }); return true; },
        move: ([px, py]) => {
          if (!aktywny) return;
          let best = -1, bd = Infinity;
          for (let j = i; j < Math.min(pts.length, i + 40); j++) { const d = dl([px, py], pts[j]); if (d < bd) { bd = d; best = j; } }
          if (bd > tolerancja) { aktywny = false; S.sfx.graj("wrong", { glosnosc: 0.5 }); return; }   // off the road: the pencil stops, the dot waits
          if (best > i) ustaw(best);
        },
        up: () => { aktywny = false; },
      });
      S.slad = { dokoncz: () => ustaw(pts.length - 1) };                 // tests: trace the stroke at once
    });
  }
  S.slad = null;
  for (const d of drogiH) d.remove();
  return { tusz, remove: () => tusz.forEach((t) => t.remove()) };
}

// ===================================================================== 2. a balance scale
// The stand, the beam on its top and two pans hanging from the beam's ends. Things lie on the pans; each has `masa`
// (1 if not said). The beam tips towards the heavier pan with a little wobble, level when they weigh the same.
// `przeciagaj({rzeczy, gotowe})` lets the child drag things onto the pans and off again until gotowe(stan) is true.
export async function waga(S, { x = 0, y = -1.25, skala = 1, czulosc = 7, max = 16 } = {}) {
  const pod = await S.object("waga_podstawa", { x, y, size: 3.0 * skala });
  const bp = S.bounds(pod), oska = [x, bp.top - 0.08 * skala];
  const belka = await S.object("waga_belka", { x: oska[0], y: oska[1], size: 4.6 * skala, z: 0.42 });
  const bb = S.bounds(belka), ramie = (bb.right - bb.left) / 2 - 0.14 * skala;
  const szalki = [], zawies = [];
  for (const k of [-1, 1]) {
    const s = await S.object("waga_szalka", { x: oska[0] + k * ramie, y: oska[1] - 1.0, size: 2.1 * skala, z: 0.44 });
    const b = S.bounds(s); zawies.push([b.top - s.mesh.position.y, b.bottom - s.mesh.position.y]); szalki.push(s);
  }
  const stan = { lewa: [], prawa: [], kat: 0 };
  const masa = (l) => l.reduce((a, h) => a + (h.masa ?? 1), 0);
  stan.wynik = () => { const d = masa(stan.lewa) - masa(stan.prawa); return Math.abs(d) < 1e-6 ? "rowno" : d > 0 ? "lewa" : "prawa"; };
  const ulozenie = () => {
    const t = stan.kat * Math.PI / 180;
    belka.mesh.rotation.z = t;
    [stan.lewa, stan.prawa].forEach((lista, k) => {
      const zn = k ? 1 : -1, ex = oska[0] + zn * ramie * Math.cos(t), ey = oska[1] + zn * ramie * Math.sin(t);
      const s = szalki[k]; s.mesh.position.set(ex, ey - zawies[k][0], s.mesh.position.z);
      const dno = ey - zawies[k][0] + zawies[k][1] + 0.16 * skala;          // the dish's rim, where things stand
      const szer = lista.map((h) => { const b = S.bounds(h); return b.right - b.left; }), razem = szer.reduce((a, b) => a + b, 0);
      let px = ex - razem / 2;
      lista.forEach((h, i) => { if (S.drag?.item === h) return; const b = S.bounds(h); h.mesh.position.x = px + szer[i] / 2; h.mesh.position.y += dno - b.bottom; px += szer[i]; });
    });
  };
  let anim = null;
  const przechyl = () => {
    const cel = Math.max(-max, Math.min(max, (masa(stan.lewa) - masa(stan.prawa)) * czulosc)), od = stan.kat;
    if (Math.abs(cel - od) > 0.01 && !FAST) S.sfx.graj("tap", { glosnosc: 0.5 });
    const moj = anim = S.tween(FAST ? 0.1 : 0.9, (s) => { if (anim !== moj) return; const e = 1 - Math.cos(s * Math.PI * 2.2) * Math.exp(-4 * s); stan.kat = od + (cel - od) * Math.min(1.12, e); ulozenie(); });
    return moj.then(() => { if (anim === moj) { stan.kat = cel; ulozenie(); } });
  };
  const zdejmij = (h) => { for (const l of [stan.lewa, stan.prawa]) { const i = l.indexOf(h); if (i >= 0) l.splice(i, 1); } };
  const poloz = (h, strona) => { zdejmij(h); stan[strona].push(h); h.mesh.position.z = 0.46; S.sfx.graj("plop"); return przechyl(); };
  ulozenie();
  return {
    stan, szalki, belka, podstawa: pod, poloz, zdejmij: (h) => { zdejmij(h); return przechyl(); }, wynik: stan.wynik, przechyl,
    remove: () => [pod, belka, ...szalki].forEach((h) => h.remove()),
    przeciagaj: ({ rzeczy, gotowe = () => false, onPolozony = null }) => new Promise((ok) => {
      S.free({
        items: rzeczy.slice(), waga: { stan, szalki },
        onDrop: async (h, p) => {
          const k = szalki.map((s, i) => [i, Math.hypot(s.mesh.position.x - p.x, s.mesh.position.y - p.y)]).sort((a, b) => a[1] - b[1])[0];
          if (k[1] < 1.9 * skala) await poloz(h, k[0] ? "prawa" : "lewa");
          else { const by = [...stan.lewa, ...stan.prawa].includes(h); zdejmij(h); if (by) przechyl(); h.moveTo(h.home.x, h.home.y, 0.35); }
          onPolozony?.(h, stan);
          if (gotowe(stan)) { S.endSort(); ok(stan); }
        },
        onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
      });
    }),
  };
}

// ===================================================================== 3. a number line to hop along
// Stepping stones with their numbers under them along the floor; `skocz(who, z, na)` - the character hops stone by
// stone (each hop lands with a bump of the stone), forwards or back; `pole(n)` - a stone's position.
export async function os(S, { od = 0, do: doN = 10, y = GROUND + 0.25, x0 = -5.0, x1 = 5.0, size = 0.8, cyfry = true } = {}) {
  const n = doN - od, krok = (x1 - x0) / Math.max(1, n), kamienie = [];
  for (let k = 0; k <= n; k++) { const h = await S.object("kamyk", { x: x0 + k * krok, y, size, cicho: k > 0, z: 0.3 }); h.liczba = od + k; kamienie.push(h); }
  if (cyfry) for (const h of kamienie) h.cyfra = await narysujCyfre(S, h.liczba, { x: h.mesh.position.x, y: y - size * 0.95, size: size * 0.5, duration: FAST ? 0.02 : 0.1 });
  const kamien = (v) => kamienie[v - od];
  return {
    kamienie, kamien, pole: (v) => [kamien(v).mesh.position.x, y],
    skocz: async (who, z, na, { tempo = 0.62 } = {}) => {
      const L = S.puppets[who]; if (!L) return;
      const t = FAST ? 0.15 : tempo, dir = Math.sign(na - z);
      L.korzen.position.x = kamien(z).mesh.position.x;
      for (let v = z; v !== na; v += dir) {
        const xa = kamien(v).mesh.position.x, xb = kamien(v + dir).mesh.position.x;
        ruch(S, who, "skok", { tempo: t });
        await S.tween(t, (s) => { L.korzen.position.x = lerp(xa, xb, s); });
        S.bump(kamien(v + dir), 0.3, false);
      }
      L.spoczynek();
    },
    remove: () => kamienie.forEach((h) => { h.cyfra?.remove(); h.remove(); }),
  };
}

// ===================================================================== 4. a tower of blocks
// Blocks (w x h, a colour) dragged onto one or more building places. A block lands on top of the stack there; if it
// does not stand on the one below (`stoi`; by default: not wider than it) it tips and falls off - the child sees
// why - and goes back. Only the top block of a stack can be taken off again. Resolves when gotowe(miejsca) is true.
export function wieza(S, { klocki, miejsca = [{ x: 0 }], podloga = GROUND + 0.02, stoi = (nowy, pod) => !pod || nowy.w <= pod.w + 0.06, gotowe = (m) => m.reduce((a, q) => a + q.stos.length, 0) === klocki.length, onUpadek = null, onPolozony = null } = {}) {
  const hs = klocki.map((k, i) => {
    const pts = [[-k.w / 2, -k.h / 2], [k.w / 2, -k.h / 2], [k.w / 2, k.h / 2], [-k.w / 2, k.h / 2]];
    const h = ksztalt(S, "klocek", { def: { pts, kolor: k.kolor || ["#e8604c", "#f5c341", "#58bd68", "#3f8ce0", "#b06ad0"][i % 5] }, x: k.x ?? -4 + i * 1.2, y: k.y ?? podloga + k.h / 2, size: 1, name: k.name || "klocek" });
    Object.assign(h, { w: k.w, h: k.h, dane: k }); h.home = { x: h.mesh.position.x, y: h.mesh.position.y };
    // the white rim of every block lies under every block's fill: a stack has one outline round it all
    const u0 = h.ustawWarstwe; h.ustawWarstwe = (j) => { u0(j); const r = h.inner.children[0]; r.renderOrder = 10.4; r.userData.ro0 = 10.4; };
    h.ustawWarstwe(h.warstwa ?? 0);
    return h;
  });
  const m = miejsca.map((q) => ({ ...q, stos: [] }));
  const zablokuj = () => { for (const h of hs) { const q = m.find((q) => q.stos.includes(h)); h.zablokowany = !!q && q.stos[q.stos.length - 1] !== h; } };
  const gora = (q) => q.stos.reduce((y, h) => y + h.h, podloga);
  const wynik = { klocki: hs, miejsca: m, wysokosc: (q) => gora(q) - podloga };
  wynik.gotowe = new Promise((ok) => {
    S.free({
      items: hs.slice(), wieza: { miejsca: m, stoi },
      onDrop: async (h, p) => {
        const z = m.find((q) => q.stos.includes(h)); if (z) z.stos.splice(z.stos.indexOf(h), 1);
        const q = m.map((q) => [q, Math.abs(q.x - p.x)]).sort((a, b) => a[1] - b[1])[0];
        if (!q || q[1] > 1.6) { await h.moveTo(h.home.x, h.home.y, 0.35); zablokuj(); return; }
        const cel = q[0], pod = cel.stos[cel.stos.length - 1] || null, ty = gora(cel) + h.h / 2;
        await h.moveTo(cel.x, ty, 0.25);
        if (!stoi(h, pod)) {
          // it tips over the edge of the narrower block under it and falls to the floor, then goes back
          S.sfx.graj("wrong"); const kier = p.x >= cel.x ? 1 : -1;
          await h.rotateTo(-kier * 35, FAST ? 0.05 : 0.35);
          await S.tween(FAST ? 0.05 : 0.45, (s) => { h.mesh.position.x = cel.x + kier * s * (pod ? pod.w / 2 + h.w / 2 : 1); h.mesh.position.y = ty - s * s * (ty - podloga - h.h / 2); });
          S.sfx.graj("plop"); await h.rotateTo(0, 0.2); await h.moveTo(h.home.x, h.home.y, 0.4);
          onUpadek?.(h, pod, cel); zablokuj(); return;
        }
        cel.stos.push(h); S.sfx.graj("plop"); zablokuj();
        onPolozony?.(h, cel);
        if (gotowe(m)) { S.endSort(); ok(wynik); }
      },
      onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
    });
  });
  return wynik;
}

// ===================================================================== a heap
// many of one thing as ONE handle (dragged, pointed at, hidden as one): the first sticker shrunk to the middle and the
// rest around it, children of its group; `dzieci` are the others (a shadow is made of each)
export async function kupka(S, name, n, { x = 0, y = 1.2, size = 1.1, z = 0.4, cicho = false } = {}) {
  const h = await S.object(name, { x, y, size, z, cicho });
  h.icon.scale.setScalar(0.55); h.dzieci = []; h.ile = n;
  for (let j = 1; j < n; j++) {
    const a = j / (n - 1) * Math.PI * 2 + 0.5, d = await S.object(name, { size: 1, cicho: true });
    S.scene.remove(d.mesh); const i = S.objects.indexOf(d); if (i >= 0) S.objects.splice(i, 1);
    d.mesh.position.set(Math.cos(a) * 0.27, Math.sin(a) * 0.22, 0.01 + j * 0.002); d.mesh.scale.setScalar(0.5); h.mesh.add(d.mesh); h.dzieci.push(d);
  }
  return h;
}

// ===================================================================== 5. cups to hide things under
// Cups raised over things; `przykryj()` - they come down (the things are hidden), `tasuj(n)` - pairs swap places in
// arcs (what is under goes along), `odkryj(i)` - a cup lifts. `kubki` are the targets for a task ("where is it?").
export async function kubki(S, { ile = 3, x = 0, y = -1.95, odstep = 2.3, size = 1.6, rzeczy = [] } = {}) {
  const xs = Array.from({ length: ile }, (_, i) => x + (i - (ile - 1) / 2) * odstep), uniesienie = size * 0.95;
  const pod = [], cups = [];
  for (let i = 0; i < ile; i++) {
    const r = rzeczy[i];
    const o = { x: xs[i], y: y - size * 0.22, size: size * 0.48, z: 0.3 };      // a thing, or {name, ile} - a heap of it
    pod.push(!r ? null : typeof r === "string" ? await S.object(r, o) : r.ile > 1 ? await kupka(S, r.name, r.ile, { ...o, size: o.size * 1.4 }) : await S.object(r.name, o));
    const c = await S.object("kubeczek", { x: xs[i], y: y + uniesienie, size, z: 0.5 }); c.pod = pod[i]; c.miejsce = i; cups.push(c);
  }
  const ukryj = (c, on) => { if (c.pod) c.pod.mesh.visible = !on; };
  const k = {
    kubki: cups,
    przykryj: async () => { await Promise.all(cups.map((c) => c.moveTo(c.mesh.position.x, y, FAST ? 0.05 : 0.45))); S.sfx.graj("plop"); cups.forEach((c) => ukryj(c, true)); },
    odkryj: async (c) => { c = typeof c === "number" ? cups[c] : c; ukryj(c, false); S.sfx.graj("whoosh", { glosnosc: 0.5 }); await c.moveTo(c.mesh.position.x, y + uniesienie, FAST ? 0.05 : 0.4); },
    tasuj: async (n = 4, { tempo = 0.55 } = {}) => {
      const t = FAST ? 0.06 : tempo;
      for (let s = 0; s < n; s++) {
        const a = Math.floor(Math.random() * ile); let b = Math.floor(Math.random() * (ile - 1)); if (b >= a) b++;
        const A = cups.find((c) => c.miejsce === a), B = cups.find((c) => c.miejsce === b), xa = xs[a], xb = xs[b];
        S.sfx.graj("whoosh", { glosnosc: 0.35, tempo: 1.3 });
        await S.tween(t, (u) => {
          const e = u * u * (3 - 2 * u);
          A.mesh.position.set(lerp(xa, xb, e), y + Math.sin(e * Math.PI) * 0.55, 0.52); B.mesh.position.set(lerp(xb, xa, e), y - Math.sin(e * Math.PI) * 0.25, 0.5);
          for (const c of [A, B]) if (c.pod) { c.pod.mesh.position.x = c.mesh.position.x; }
        });
        A.miejsce = b; B.miejsce = a;
      }
      for (const c of cups) { c.home = { x: c.mesh.position.x, y }; if (c.pod) c.pod.home = { x: c.mesh.position.x, y: c.pod.mesh.position.y }; }
    },
    remove: () => { cups.forEach((c) => c.remove()); pod.forEach((p) => p?.remove()); },
  };
  return k;
}

// ===================================================================== 6. counting by ear
// n sounds on a steady beat: a character's move (clap, jump - its own sound) or a sound with a thing bumping, or
// the sound alone (nothing to look at: the child counts what is heard).
export async function dzwieki(S, n, { dzwiek = "klask", kto = null, ruch: r = null, rzecz = null, tempo = 0.75 } = {}) {
  for (let k = 0; k < n; k++) {
    if (kto && r) ruch(S, kto, r, { tempo }); else S.sfx.graj(dzwiek);
    if (rzecz) S.bump(rzecz, 0.3, false);
    await czekaj(tempo);
  }
  if (kto) S.puppets[kto]?.spoczynek();
}

// ===================================================================== 7. cutting into equal parts
// A thing (a sticker seen from above: pizza, chocolate) the child cuts with a finger stroke across it. A cut that
// passes near the middle snaps through it (and for a rectangle near an axis, along it), so a careful cut is fair;
// one far from the middle stays where it was drawn - the pieces come out unequal and everyone can see it. After
// `ciecia` cuts: { kawalki, rowne, ulamek } (pieces as handles to drag; equal = areas within 12%), `remove()`.
const pole = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % P.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };
const srodek = (P) => P.reduce((a, p) => [a[0] + p[0] / P.length, a[1] + p[1] / P.length], [0, 0]);
function przetnij(P, [ax, ay], [nx, ny]) {                    // the convex polygon split by the line through a with normal n
  const s = (p) => (p[0] - ax) * nx + (p[1] - ay) * ny, A = [], B = [];
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length], sp = s(p), sq = s(q);
    (sp >= 0 ? A : B).push(p);
    if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq), x = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; A.push(x); B.push(x); }
  }
  return A.length >= 3 && B.length >= 3 ? [A, B] : null;
}
function alfaRamka(img) {
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, img.width, img.height).data; let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0;
  for (let y = 0; y < img.height; y++) for (let xx = 0; xx < img.width; xx++) if (d[(y * img.width + xx) * 4 + 3] > 40) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { u0: x0 / img.width, u1: (x1 + 1) / img.width, v0: y0 / img.height, v1: (y1 + 1) / img.height };
}
export async function podziel(S, obraz, { x = 0, y = 0.4, size = 3.4, ksztalt: rodzaj = obraz === "pizza" ? "kolo" : "prostokat", ciecia = 1, przyciag = 0.16 } = {}) {
  const map = await texture(`/game/assets/objects/${obraz}.webp`);
  const r = alfaRamka(map.image), L = x - size / 2, D = y - size / 2;
  const bx0 = L + r.u0 * size, bx1 = L + r.u1 * size, by1 = D + (1 - r.v0) * size, by0 = D + (1 - r.v1) * size;
  const caly = rodzaj === "kolo"
    ? Array.from({ length: 72 }, (_, i) => { const a = i / 72 * Math.PI * 2, rr = Math.min(bx1 - bx0, by1 - by0) / 2 * 0.99; return [(bx0 + bx1) / 2 + rr * Math.cos(a), (by0 + by1) / 2 + rr * Math.sin(a)]; })
    : [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]];
  const C = srodek(caly), poleCale = pole(caly);
  // a piece: its polygon in the picture's own coordinates (the texture stays on it), drawn moved by `off`
  const kawalek = (P, off = [0, 0]) => {
    const c = srodek(P), shp = new THREE.Shape(P.map(([a, b]) => new THREE.Vector2(a - c[0], b - c[1])));
    const g = new THREE.ShapeGeometry(shp), pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + c[0] - L) / size, (pos.getY(i) + c[1] - D) / size);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = 10;
    const grp = new THREE.Group(); grp.add(m); grp.position.set(c[0] + off[0], c[1] + off[1], 0.4); S.scene.add(grp);
    const h = { mesh: grp, icon: null, name: `kawalek_${obraz}`, kind: "object", base: 1, size0: 1, pulse: false, P, pole: pole(P), home: { x: c[0], y: c[1] }, zone: null,
      remove: () => { S.scene.remove(grp); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); S.untarget(h); },
      highlight: (on) => { h.pulse = on; if (!on) grp.scale.setScalar(1); },
      moveTo: (nx, ny, d = 0.4) => { const x0 = grp.position.x, y0 = grp.position.y; return S.tween(d, (s) => { grp.position.x = x0 + (nx - x0) * s; grp.position.y = y0 + (ny - y0) * s; }); } };
    S.objects.push(h); return h;
  };
  let kawalki = [kawalek(caly)];
  const tnij = async (a, b) => {
    let [dx, dy] = [b[0] - a[0], b[1] - a[1]]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    if (rodzaj !== "kolo") for (const [ux, uy] of [[1, 0], [0, 1]]) if (Math.abs(dx * ux + dy * uy) > Math.cos(12 * Math.PI / 180)) { const z = Math.sign(dx * ux + dy * uy); dx = ux * z; dy = uy * z; }
    let nx = -dy, ny = dx, p = a;
    const odl = (C[0] - a[0]) * nx + (C[1] - a[1]) * ny;
    if (Math.abs(odl) < przyciag * size) p = C;                       // near the middle: through it - a fair cut
    const nowe = [];
    for (const k of kawalki) {
      const c = srodek(k.P), off = [k.mesh.position.x - c[0], k.mesh.position.y - c[1]];   // where it lies now (moved apart, dragged)
      const w = przetnij(k.P, [p[0] - off[0], p[1] - off[1]], [nx, ny]);
      if (!w) { nowe.push(k); continue; }
      k.remove();
      for (const [j, Q] of w.entries()) {
        const h = kawalek(Q, off), zn = j ? -1 : 1, tx = h.mesh.position.x + zn * nx * 0.09, ty = h.mesh.position.y + zn * ny * 0.09;
        nowe.push(h); h.moveTo(tx, ty, 0.25); h.home = { x: tx, y: ty };
      }
    }
    if (nowe.length !== kawalki.length) S.sfx.graj("whoosh", { glosnosc: 0.6 });
    const bylo = kawalki.length; kawalki = nowe; return kawalki.length > bylo;
  };
  const wynik = () => { const a = kawalki.map((k) => k.pole); return { kawalki, rowne: Math.max(...a) / Math.min(...a) < 1.12, czesci: kawalki.length, ulamek: a.map((v) => v / poleCale) }; };
  const remove = () => kawalki.forEach((k) => k.remove());
  let zrobione = 0, kreska = null;
  await new Promise((gotowe) => {
    let p0 = null;
    const linia = (a, b) => {
      if (!kreska) { kreska = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: "#2b2622", dashSize: 0.15, gapSize: 0.1, depthTest: false, transparent: true })); kreska.renderOrder = 60; S.scene.add(kreska); }
      kreska.geometry.setFromPoints([new THREE.Vector3(a[0], a[1], 0.8), new THREE.Vector3(b[0], b[1], 0.8)]); kreska.computeLineDistances(); kreska.visible = true;
    };
    const koniec = async (a, b) => {
      if (kreska) kreska.visible = false;
      if (!a || dl(a, b) < size * 0.4) return;
      if (await tnij(a, b) && ++zrobione >= ciecia) { oddaj(); if (kreska) S.scene.remove(kreska); S.podziel = null; gotowe(); }
    };
    const oddaj = palec(S, { down: (p) => { p0 = [p.x ?? p[0], p.y ?? p[1]]; return true; }, move: (p) => { if (p0) linia(p0, [p.x ?? p[0], p.y ?? p[1]]); }, up: () => { const a = p0; p0 = null; if (a && kreska?.visible) { const pos = kreska.geometry.attributes.position; koniec(a, [pos.getX(1), pos.getY(1)]); } } });
    S.podziel = { tnij: (kat = 90, przez = C) => { const t = kat * Math.PI / 180, R = size; return koniec([przez[0] - Math.cos(t) * R, przez[1] - Math.sin(t) * R], [przez[0] + Math.cos(t) * R, przez[1] + Math.sin(t) * R]); } };   // tests
  });
  const w = wynik();
  return { ...w, remove, srodek: C };
}
