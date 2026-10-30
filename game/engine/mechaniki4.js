// Mechanics, fourth set (the improvement plan, accepted 2026-10-29): painted places in a room, scratch-off, connect the
// dots, a story strip from one picture, a torn picture, a walk on a map. Each one reads a gpt-image painting (a magenta
// key or a plan it checks against); the code never draws what the child looks at.

import * as THREE from "three";
import { texture } from "./scene.js";

const FAST = new URLSearchParams(location.search).has("szybko");
const CAM_Z = 7.2;

const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
// an invisible tap target on a picture (as mechaniki3's found-picture spots)
function cel(S, g, extra) {
  const h = { mesh: g, kind: "object", base: 1, size0: 1, pulse: false, zone: null, ...extra,
    remove: () => { g.parent?.remove(g); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); S.untarget(h); },
    highlight: (on) => { h.pulse = on; if (!on) g.scale.setScalar(1); } };
  S.objects.push(h); return h;
}
// a picture card over a dimmed scene, like a found picture: veil, shadow, paper frame, the picture; returns its parts
function karta(S, { W, H, y, rama = "#fffaf0", obrot = -2 }) {
  const welon = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat({ color: "#1d1a17", opacity: 0 }));
  welon.position.set(0, 0, 0.42); welon.renderOrder = 38; S.scene.add(welon);
  const grp = new THREE.Group(); grp.position.set(0, y, 0.45); S.scene.add(grp);
  const k = new THREE.Group(); k.rotation.z = obrot * Math.PI / 180; grp.add(k);
  const b = 0.32;
  const cien = new THREE.Mesh(new THREE.PlaneGeometry(W + b, H + b), mat({ color: "#000000", opacity: 0.28 })); cien.position.set(0.14, -0.16, -0.02); cien.renderOrder = 38.2;
  const brzeg = new THREE.Mesh(new THREE.PlaneGeometry(W + b, H + b), mat({ color: rama })); brzeg.position.z = -0.01; brzeg.renderOrder = 38.4;
  k.add(cien, brzeg);
  // known to the stage, so a cleared or skipped scene takes the card and its veil away at once
  const h = { kind: "karta", mesh: grp, base: 1, remove: () => { S.scene.remove(grp); S.scene.remove(welon); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); } };
  S.objects.push(h);
  return { welon, grp, k, zdejmij: h.remove };
}
const kolo = (c) => { const w = new THREE.Vector3(); c.mesh.getWorldPosition(w); return Array.from({ length: 41 }, (_, j) => { const a = j / 40 * Math.PI * 2 + 0.6; return [w.x + Math.cos(a) * c.r, w.y + Math.sin(a) * c.r * 0.92]; }); };

// ===================================================================== scratch-off (zdrapka)
// game/assets/zdrapki/<name> (tools/zdrapki): a picture under a cover painted for it (snow on the garden, mist on the
// window). It lies big over a dimmed scene; the child rubs the cover off with a finger (soft round strokes, a scratching
// sound); at 75 % the rest melts away. Then it is a found picture: {cele, tlo, zaznacz, remove} - count the spots
// (c.count(z.cele)) or point to one (c.task). Tests: S.zdrapka.dokoncz().
export async function zdrapka(S, nazwa, { y = 0.3, size = 7.6, pedzel = 0.6 } = {}) {
  const kat = `/game/assets/zdrapki/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const [odkryty, zakryty] = await Promise.all([texture(kat + "odkryty.webp"), texture(kat + "zakryty.webp")]);
  const ar = meta.wysokosc / meta.szerokosc, W = size, H = W * ar;
  const { welon, grp, k, zdejmij } = karta(S, { W, H, y });
  const obraz = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ map: odkryty })); obraz.renderOrder = 38.6;
  // the cover: its alpha is a canvas the finger paints black
  const MW = 256, MH = Math.round(256 * ar), mc = document.createElement("canvas"); mc.width = MW; mc.height = MH;
  const mx = mc.getContext("2d", { willReadFrequently: true }); mx.fillStyle = "#fff"; mx.fillRect(0, 0, MW, MH);
  const maska = new THREE.CanvasTexture(mc);
  const oslona = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ map: zakryty, alphaMap: maska })); oslona.position.z = 0.01; oslona.renderOrder = 38.7;
  k.add(obraz, oslona);
  grp.scale.setScalar(0.12); S.sfx.graj("whoosh");
  await S.tween(FAST ? 0.15 : 0.5, (s) => { const e = 1 - (1 - s) ** 3; grp.scale.setScalar(0.12 + 0.88 * e); welon.material.opacity = 0.58 * e; });
  const r = pedzel / W * MW;
  const zetrzyj = (u, v) => {
    const g = mx.createRadialGradient(u * MW, v * MH, 0, u * MW, v * MH, r);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.6, "rgba(0,0,0,0.9)"); g.addColorStop(1, "rgba(0,0,0,0)");
    mx.fillStyle = g; mx.beginPath(); mx.arc(u * MW, v * MH, r, 0, 7); mx.fill(); maska.needsUpdate = true;
  };
  const ileZostalo = () => { const d = mx.getImageData(0, 0, MW, MH).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] > 128) n++; return n / (d.length / 16); };
  const naObrazie = ([px, py]) => { const p = obraz.worldToLocal(new THREE.Vector3(px, py, 0.45)); return [p.x / W + 0.5, 0.5 - p.y / H]; };
  await new Promise((gotowe) => {
    let aktywny = false, ruchy = 0, dzwiek = 0, ost = null, koniec = false;
    const odslon = async () => {
      if (koniec) return; koniec = true; if (S.palec === h) S.palec = null; S.zdrapka = null;
      S.sfx.graj("right");
      await S.tween(FAST ? 0.1 : 0.6, (s) => { oslona.material.opacity = 1 - s; });
      gotowe();
    };
    const pociagnij = (u, v) => {                                   // a stroke between two finger points, no gaps
      if (ost) { const n = Math.ceil(Math.hypot(u - ost[0], (v - ost[1]) * ar) * MW / (r * 0.5)); for (let i = 1; i <= n; i++) zetrzyj(ost[0] + (u - ost[0]) * i / n, ost[1] + (v - ost[1]) * i / n); }
      else zetrzyj(u, v);
      ost = [u, v];
      const t = performance.now(); if (t - dzwiek > 260) { S.sfx.graj("pencil", { glosnosc: 0.6 }); dzwiek = t; }
      if (++ruchy % 8 === 0 && ileZostalo() < 0.25) odslon();
    };
    const h = {
      down: (p) => { const [u, v] = naObrazie(p); if (u < -0.02 || u > 1.02 || v < -0.02 || v > 1.02) return false; aktywny = true; ost = null; pociagnij(u, v); return true; },
      move: (p) => { if (!aktywny || koniec) return; const [u, v] = naObrazie(p); pociagnij(Math.min(1, Math.max(0, u)), Math.min(1, Math.max(0, v))); },
      up: () => { aktywny = false; ost = null; if (ileZostalo() < 0.25) odslon(); },
    };
    S.palec = h;
    S.zdrapka = { dokoncz: async () => { for (let v = 0; v <= 1; v += 0.12) { ost = null; for (let u = 0; u <= 1; u += 0.1) pociagnij(u, v); await S.wait(0.02); } await odslon(); } };
  });
  // then it is a found picture: the spots as targets, the rest of the picture a miss
  const lokalnie = (c) => [(c.x - 0.5) * W, (0.5 - c.y) * H];
  const cele = meta.cele.map((c, i) => {
    const rr = Math.max(0.45, c.r * W), g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CircleGeometry(rr, 24), mat({ opacity: 0, side: THREE.DoubleSide })));
    const [x, yy] = lokalnie(c); g.position.set(x, yy, 0.05); k.add(g);
    return cel(S, g, { name: `${nazwa}_${i}`, nr: i, r: rr, dobry: false, nadObrazem: 39 });
  });
  const tlo = cel(S, obraz, { name: `${nazwa}_obraz`, dobry: false });
  const kolka = [];
  return {
    kind: "zdrapka", name: nazwa, mesh: grp, meta, cele, tlo,
    zaznacz: async (ktore = cele) => { for (const c of [].concat(ktore)) kolka.push(await S.line(kolo(c), { color: "#e8502e", width: 0.1, duration: 0.3, strong: true, warstwa: 39 })); },
    remove: async () => {
      cele.forEach((c) => c.remove()); tlo.remove(); kolka.forEach((q) => q.remove());
      await S.tween(FAST ? 0.1 : 0.3, (s) => { grp.scale.setScalar(1 - 0.9 * s); welon.material.opacity = 0.58 * (1 - s); });
      zdejmij(); maska.dispose();
    },
  };
}

// ===================================================================== connect the dots (kropki)
// game/assets/kropki/<name> (tools/kropki): dots on the outline of a painted thing, on a card (paper, or a night sky
// for a constellation). The child joins them in order - drawing from dot to dot or tapping the next one; a pencil line
// follows; the last joins back to the first and the picture appears inside. The order is shown by `znaki`: "cyfry"
// (digits, from numbers_1_5 on) or "wielkosc" (the dots grow: from the smallest - before the numbers). A wrong dot
// shakes (`onZle`). Tests: S.kropki.dokoncz().
export async function kropki(S, nazwa, { znaki = "wielkosc", y = 0.3, size = 6.4, onZle = null } = {}) {
  const { narysujCyfre } = await import("./liczby.js");
  const kat = `/game/assets/kropki/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const tex = await texture(kat + "obraz.webp");
  const noc = meta.tlo === "noc", ar = meta.wysokosc / meta.szerokosc;
  const W = size, H = Math.min(size * 0.72, 5.2);
  const { welon, grp, k, zdejmij } = karta(S, { W, H, y, rama: noc ? "#2a3566" : "#fffaf0", obrot: -1.5 });
  const papier = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ color: noc ? "#141d3f" : "#f6efdf" })); papier.renderOrder = 38.6; k.add(papier);
  // the picture fits the card with a margin; hidden until the outline is closed
  const ph = Math.min(H * 0.86, W * 0.86 * ar), pw = ph / ar;
  const obraz = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), mat({ map: tex, opacity: 0 })); obraz.position.z = 0.01; obraz.renderOrder = 38.7; k.add(obraz);
  grp.scale.setScalar(0.12); S.sfx.graj("whoosh");
  await S.tween(FAST ? 0.15 : 0.5, (s) => { const e = 1 - (1 - s) ** 3; grp.scale.setScalar(0.12 + 0.88 * e); welon.material.opacity = 0.58 * e; });
  const n = meta.kropki.length;
  const lok = ([fx, fy]) => new THREE.Vector3((fx - 0.5) * pw, (0.5 - fy) * ph, 0.02);
  const swiat = (v) => { const w = v.clone(); k.localToWorld(w); return [w.x, w.y]; };
  const kolor = noc ? "#ffd86b" : "#2b2622";
  const dots = meta.kropki.map((q, i) => {
    const r = znaki === "wielkosc" ? 0.1 + 0.16 * i / Math.max(1, n - 1) : 0.13;
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), mat({ color: kolor })); m.position.copy(lok(q)); m.renderOrder = 39.3; k.add(m);
    return { m, r, p: swiat(lok(q)), i };
  });
  const etykiety = [];
  if (znaki === "cyfry") for (const d of dots) {
    const [x, yy] = d.p, dx = x - (k.getWorldPosition(new THREE.Vector3()).x), dy = yy - y, l = Math.hypot(dx, dy) || 1;
    etykiety.push(await narysujCyfre(S, d.i + 1, { x: x + dx / l * 0.42, y: yy + dy / l * 0.42, size: 0.42, color: "#1f5fbf", duration: 0.12, warstwa: 39.4 }));
  }
  const kreski = [];
  let teraz = 0;                                                         // the next dot to reach
  const pulsuj = () => dots.forEach((d) => { d.m.scale.setScalar(1); d.puls = d.i === teraz; });
  const puls = setInterval(() => { for (const d of dots) if (d.puls) d.m.scale.setScalar(1 + 0.25 * Math.abs(Math.sin(performance.now() / 260))); }, 30);
  pulsuj();
  const polacz = async (d) => {
    if (teraz > 0) kreski.push(await S.line([dots[teraz - 1].p, d.p], { color: noc ? "#ffe9a6" : "#e8502e", width: 0.09, duration: FAST ? 0.05 : 0.22, strong: true, warstwa: 39.2 }));
    S.sfx.graj("tap"); teraz++; pulsuj();
  };
  await new Promise((gotowe) => {
    let aktywny = false, zajety = false;
    const blisko = (p) => dots.find((d) => Math.hypot(d.p[0] - p[0], d.p[1] - p[1]) < Math.max(0.5, d.r * 2.6));
    const sprobuj = async (p, zDotyku) => {
      if (zajety || teraz >= n) return;
      const d = blisko(p); if (!d) return;
      if (d.i === teraz) { zajety = true; await polacz(d); zajety = false; if (teraz === n) await koniec(); }
      else if (zDotyku && d.i > teraz) { S.sfx.graj("wrong"); S.bump({ mesh: d.m, base: 1 }, 0.3, false); onZle?.(d.i); }
    };
    const koniec = async () => {
      clearInterval(puls); dots.forEach((d) => d.m.scale.setScalar(1));
      kreski.push(await S.line([dots[n - 1].p, dots[0].p], { color: noc ? "#ffe9a6" : "#e8502e", width: 0.09, duration: FAST ? 0.05 : 0.25, strong: true, warstwa: 39.2 }));
      if (S.palec === h) S.palec = null; S.kropki = null;
      S.sfx.graj("right");
      await S.tween(FAST ? 0.1 : 0.8, (s) => { obraz.material.opacity = s; for (const d of dots) d.m.material.opacity = 1 - s * 0.7; });
      gotowe();
    };
    const h = {
      down: (p) => { if (!blisko(p)) return false; aktywny = true; sprobuj(p, true); return true; },
      move: (p) => { if (aktywny) sprobuj(p, false); },
      up: () => { aktywny = false; },
    };
    S.palec = h;
    S.kropki = { dokoncz: async () => { while (teraz < n) await polacz(dots[teraz]); await koniec(); } };
  });
  return {
    kind: "kropki", name: nazwa, mesh: grp, meta,
    remove: async () => {
      kreski.forEach((q) => q.remove()); etykiety.forEach((q) => q.remove?.());
      await S.tween(FAST ? 0.1 : 0.3, (s) => { grp.scale.setScalar(1 - 0.9 * s); welon.material.opacity = 0.58 * (1 - s); });
      zdejmij();
    },
  };
}

// ===================================================================== a story strip from one picture (historyjka)
// game/assets/historyjki/<name> (tools/historyjki): the panels of one painted comic page as cards. They lie shuffled on
// the floor (never already in order), the places wait in a row over the heads, an arrow at the first; each place takes
// only its panel, a wrong one goes back with `onZle`. Resolves when the story is in order; returns {karty, remove}.
// `uloz: false` only lays the cards out (the lesson asks its own question - which one is missing, what comes next).
export async function historyjka(S, nazwa, { size = 1.75, uloz = true, onZle = null, y = 1.55 } = {}) {
  const G = await import("./geometria.js");
  const kat = `/game/assets/historyjki/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const n = meta.panele.length, krok = Math.min(size * 1.12, 7.4 / n);   // the floor between the characters (x +-3.6)
  let kol = [...Array(n).keys()];
  do kol = kol.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]); while (n > 1 && kol.every((v, i) => v === i));
  const karty = [];
  for (const [j, i] of kol.entries()) {
    const h = await S.object(`${nazwa}_${i}`, { obraz: kat + meta.panele[i], x: (j - (n - 1) / 2) * krok, y: -1.95, size: krok * 0.92 });
    h.nr = i; h.opis = meta.opisy?.[i]; h.dobry = false; karty.push(h);
  }
  if (!uloz) return { karty, meta, remove: () => karty.forEach((k) => k.remove()) };
  const sloty = [...Array(n).keys()].map((i) => ({ x: (i - (n - 1) / 2) * krok, y, w: krok * 0.96, h: krok * 0.96, accept: (k) => k.nr === i }));
  const t = await G.sloty(S, { items: karty, slots: sloty, onWrong: onZle });
  const strzalka = await S.arrow(t.strefy[0], {});
  S.historyjka = { dokoncz: async () => { for (const k of karty) { const z = t.strefy[k.nr]; z.zajety = k; k.slot = z; await k.moveTo(z.x, z.y, 0.1); } S.endSort(); } };
  await Promise.race([t.wait(), new Promise((ok) => { const c = setInterval(() => { if (karty.every((k) => k.slot && t.strefy[k.nr] === k.slot)) { clearInterval(c); ok(); } }, 120); })]);
  S.historyjka = null; strzalka?.remove?.();
  return { karty, meta, remove: () => { t.remove(); karty.forEach((k) => k.remove()); } };
}

// ===================================================================== a torn picture (podarty)
// Any found picture (game/assets/znaleziska/<name>) torn into 4 or 6 pieces: the cut lines are jagged and shared by
// neighbours, so the pieces fit; each has a white paper-fibre rim. They lie scattered and turned over a dimmed scene, a
// faint frame shows where the picture goes; a piece dropped near its place snaps in. Put together, the picture is the
// usual found picture ({cele, tlo, zaznacz, remove}), ready for its task. Tests: S.podarty.dokoncz().
export async function podarty(S, nazwa, { kawalki = 4, y = 0.3, size = 7.6 } = {}) {
  const M3 = await import("./mechaniki3.js");
  const kat = `/game/assets/znaleziska/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const img = (await texture(kat + "obraz.webp")).image;
  const ar = meta.wysokosc / meta.szerokosc, m0 = M3.miejsceNaObraz(S, (ar > 1 ? size / ar : size) + 0.32), cx = m0.cx;
  size *= m0.k;                                                                     // room for the characters beside it
  const W = ar > 1 ? size / ar : size, H = W * ar;
  const kol = kawalki >= 6 ? 3 : 2, wier = 2;
  // the jagged cut lines, in picture pixels: one shared line between every two neighbours
  const PW = img.width, PH = img.height, los = (a) => (Math.random() - 0.5) * a;
  const pion = [...Array(kol + 1).keys()].map((i) => [...Array(13).keys()].map((j) => [i === 0 ? 0 : i === kol ? PW : PW * i / kol + los(PW * 0.06) + (j % 2 ? los(PW * 0.02) : 0), PH * j / 12]));
  const poz = [...Array(wier + 1).keys()].map((i) => [...Array(13).keys()].map((j) => [PW * j / 12, i === 0 ? 0 : i === wier ? PH : PH * i / wier + los(PH * 0.06) + (j % 2 ? los(PH * 0.025) : 0)]));
  const welon = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat({ color: "#1d1a17", opacity: 0 })); welon.position.set(0, 0, 0.42); welon.renderOrder = 37.5; S.scene.add(welon);
  const rama = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ color: "#fffaf0", opacity: 0.18 })); rama.position.set(cx, y, 0.43); rama.renderOrder = 37.6; S.scene.add(rama);
  const wroc = await M3.odsun(S, cx - W / 2 - 0.4, cx + W / 2 + 0.4);                                    // the scattered pieces need the middle clear too
  const tlo = { kind: "karta", mesh: rama, base: 1, remove: () => { S.scene.remove(rama); S.scene.remove(welon); const i = S.objects.indexOf(tlo); if (i >= 0) S.objects.splice(i, 1); } };
  S.objects.push(tlo);
  await S.tween(FAST ? 0.1 : 0.35, (s) => { welon.material.opacity = 0.58 * s; });
  const czesci = [];
  for (let r = 0; r < wier; r++) for (let c = 0; c < kol; c++) {
    // the piece's outline: its top line (left to right), right line (down), bottom line (back), left line (up)
    const gora = poz[r].filter(([x]) => x >= PW * c / kol - 1 && x <= PW * (c + 1) / kol + 1);
    const dol = poz[r + 1].filter(([x]) => x >= PW * c / kol - 1 && x <= PW * (c + 1) / kol + 1);
    const lewa = pion[c].filter(([, yy]) => yy >= PH * r / wier - 1 && yy <= PH * (r + 1) / wier + 1);
    const prawa = pion[c + 1].filter(([, yy]) => yy >= PH * r / wier - 1 && yy <= PH * (r + 1) / wier + 1);
    const obrys = [...gora, ...prawa, ...dol.slice().reverse(), ...lewa.slice().reverse()];
    const xs = obrys.map((p) => p[0]), ys = obrys.map((p) => p[1]);
    const x0 = Math.max(0, Math.min(...xs) - 12), y0 = Math.max(0, Math.min(...ys) - 12), x1 = Math.min(PW, Math.max(...xs) + 12), y1 = Math.min(PH, Math.max(...ys) + 12);
    const cv = document.createElement("canvas"); cv.width = Math.round(x1 - x0); cv.height = Math.round(y1 - y0);
    const g = cv.getContext("2d"); g.translate(-x0, -y0);
    const sciezka = () => { g.beginPath(); obrys.forEach(([x, yy], i) => (i ? g.lineTo(x, yy) : g.moveTo(x, yy))); g.closePath(); };
    g.save(); sciezka(); g.lineJoin = "round"; g.lineWidth = 9; g.strokeStyle = "#fbf6ea"; g.stroke(); g.fillStyle = "#fbf6ea"; g.fill(); g.restore();   // the torn paper's white fibre
    g.save(); sciezka(); g.clip(); g.drawImage(img, 0, 0); g.restore();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const pw = cv.width / PW * W, ph = cv.height / PH * H;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), mat({ map: t })); m.renderOrder = 38.6;
    const grp = new THREE.Group(); grp.add(m); S.scene.add(grp);
    const cel = [cx - W / 2 + ((x0 + x1) / 2) / PW * W, y + H / 2 - ((y0 + y1) / 2) / PH * H];
    const h = { mesh: grp, kind: "object", name: `${nazwa}_kawalek`, base: 1, size0: 1, pulse: false, zone: null, cel, gotowy: false,
      moveTo: (x, yy, d = 0.25) => { const a = grp.position.clone(); return S.tween(d, (s) => grp.position.set(a.x + (x - a.x) * s, a.y + (yy - a.y) * s, a.z)); },
      highlight: () => {}, remove: () => { S.scene.remove(grp); t.dispose(); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); } };
    S.objects.push(h); czesci.push(h);
  }
  // scattered: each away from its place, turned a little, a bit smaller
  const miejscaRozrzutu = czesci.map((_, i) => [cx + (-1 + 2 * ((i * 0.618) % 1)) * W * 0.32, y + (i % 2 ? -1 : 1) * H * 0.18 + los(0.5)]);
  miejscaRozrzutu.sort(() => Math.random() - 0.5);
  czesci.forEach((h, i) => { const [x, yy] = miejscaRozrzutu[i]; h.mesh.position.set(x, yy, 0.46 + i * 0.002); h.mesh.rotation.z = los(0.5); h.mesh.scale.setScalar(0.8); h.home = { x, y: yy }; });
  S.sfx.graj("whoosh");
  const wloz = async (h) => {
    h.gotowy = true; S.sfx.graj("plop"); const r0 = h.mesh.rotation.z;
    await Promise.all([h.moveTo(h.cel[0], h.cel[1], 0.2), S.tween(0.2, (s) => { h.mesh.rotation.z = r0 * (1 - s); h.mesh.scale.setScalar(0.8 + 0.2 * s); })]);
    h.mesh.position.z = 0.44;
  };
  await new Promise((gotowe) => {
    const sprawdz = () => { if (czesci.every((h) => h.gotowy)) { S.endSort(); S.podarty = null; gotowe(); } };
    S.free({ items: czesci.slice(), onTap: () => {}, onDrop: async (h, p) => {
      if (h.gotowy) return;
      if (Math.hypot(p.x - h.cel[0], p.y - h.cel[1]) < Math.min(W, H) * 0.22) { await wloz(h); sprawdz(); }
      else { h.mesh.scale.setScalar(0.8); }
    } });
    S.podarty = { dokoncz: async () => { for (const h of czesci) if (!h.gotowy) await wloz(h); sprawdz(); } };
  });
  S.sfx.graj("right");
  const z = await M3.znalezisko(S, nazwa, { y, size, obrot: 0, bezLotu: true, x: cx });
  for (const o of [...czesci.map((h) => h.mesh), tlo.mesh]) o.userData.zejdz = false;   // the whole picture takes their place: no slide-out
  czesci.forEach((h) => h.remove()); tlo.remove();
  const usun = z.remove; z.remove = async () => { await usun(); wroc(); };          // the characters come back when it goes
  return z;
}

// ===================================================================== a walk on the map (wedrowka)
// A found picture with PATHS (znaleziska meta: cele with `droga`): a pawn stands at the paths' common start and the
// child drags it along. On the shared stretch it goes freely; past the fork only the right path (`dobra`, its index)
// lets it on - stepping onto another one, the pawn shakes and stays (`onZle`), as the story says why ("the longer
// bridge", "where there are more trees"). Reaching the end of the right path resolves. Tests: S.wedrowka.dokoncz().
export async function wedrowka(S, nazwa, { pionek = "jez", dobra = 0, onZle = null, ...o } = {}) {
  const M3 = await import("./mechaniki3.js");
  const z = await M3.znalezisko(S, nazwa, o);
  const sciezki = z.cele.filter((c) => c.droga);
  if (!sciezki.length) throw new Error(`wedrowka: ${nazwa} has no paths`);
  // the paths in world points (they turn with the card)
  const karta = z.mesh.children[0];
  const W = karta.children[2].geometry.parameters.width, H = karta.children[2].geometry.parameters.height;
  const pkt = (q) => { const v = new THREE.Vector3((q[0] - 0.5) * W, (0.5 - q[1]) * H, 0.06); karta.localToWorld(v); return [v.x, v.y]; };
  const drogi = sciezki.map((c) => c.droga.map(pkt));
  const dobraDroga = drogi[dobra];
  // a point of another path is "off the way" when it is far from every point of the right one
  const odDobrej = (p) => Math.min(...dobraDroga.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1])));
  const naj = (p) => { let best = null; drogi.forEach((d, di) => d.forEach((q, qi) => { const dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (!best || dd < best.dd) best = { di, qi, dd, q }; })); return best; };
  const roz = Math.min(W, H) * 0.08;
  const pion = await S.object(pionek, { x: dobraDroga[0][0], y: dobraDroga[0][1], size: roz * 1.6, z: 0.6 });
  pion.mesh.traverse((q) => { if (q.isMesh) q.renderOrder = 39.5; });
  let teraz = 0; const slad = [];
  const idz = async (qi) => {
    const a = dobraDroga[teraz], b = dobraDroga[qi]; teraz = qi;
    S.line([a, b], { color: "#e8502e", width: 0.12, duration: 0.1, strong: true, wait: false, warstwa: 39.1 }).then((k) => slad.push(k));
    await pion.moveTo(b[0], b[1], 0.1);
  };
  await new Promise((gotowe) => {
    let aktywny = false, idzie = false, koniec = false, zle = 0;
    const meta = async () => { if (koniec) return; koniec = true; if (S.palec === h) S.palec = null; S.wedrowka = null; S.sfx.graj("right"); S.bump(pion, 0.3, false); await S.wait(0.4); gotowe(); };
    const h = {
      down: (p) => { if (Math.hypot(p[0] - dobraDroga[teraz][0], p[1] - dobraDroga[teraz][1]) > roz * 3) return false; aktywny = true; S.sfx.graj("tap"); return true; },
      move: async (p) => {
        if (!aktywny || idzie || koniec) return;
        const n = naj(p); if (!n || n.dd > roz * 2.5) return;
        if (n.di !== dobra && odDobrej(n.q) > roz * 1.8) {                  // onto the other path, past the fork
          if (performance.now() - zle > 1500) { zle = performance.now(); S.sfx.graj("wrong"); S.shake(pion); onZle?.(n.di); }
          return;
        }
        // the nearest point of the right path ahead, one short step at a time
        let qi = teraz, dd = Infinity;
        for (let i = teraz; i < Math.min(dobraDroga.length, teraz + 4); i++) { const d2 = Math.hypot(dobraDroga[i][0] - p[0], dobraDroga[i][1] - p[1]); if (d2 < dd) { dd = d2; qi = i; } }
        if (qi > teraz) { idzie = true; await idz(qi); idzie = false; if (teraz >= dobraDroga.length - 1) meta(); }
      },
      up: () => { aktywny = false; },
    };
    S.palec = h;
    S.wedrowka = { dokoncz: async () => { while (teraz < dobraDroga.length - 1) await idz(teraz + 1); await meta(); } };
  });
  const zdejmij = z.remove;
  return { ...z, pionek: pion, remove: async () => { slad.forEach((k) => k.remove()); pion.remove(); await zdejmij(); } };
}

// ===================================================================== drop places on a painted room (miejsca)
// game/assets/backgrounds/<scene>/miejsca.json (tools/miejsca): named surfaces of the scenery's plate - a shelf, the
// hooks, the table, the rug - each with a kind: things stand on it, hang from it or lie on it. miejsca(S) maps them
// from the plate to the stage (the base camera at the wide shot) and returns {name: {x, y, w, h, rodzaj, slot(accept),
// strefa()}}: `slot` is a place for ctx.slots ({..., niewidoczna}), `strefa` a zone for ctx.sort - both invisible, the
// painting shows where. A sticker dropped there stands on the shelf, hangs on the hook, lies on the rug.
export async function miejsca(S, { scena = S.bgName } = {}) {
  const dane = await fetch(`/game/assets/backgrounds/${scena}/miejsca.json`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
  if (!dane) throw new Error(`no painted places for "${scena}" (tools/miejsca/make_miejsca.py ${scena})`);
  const plyta = S.bg.find((m) => m.userData.plyta);
  if (!plyta) throw new Error("miejsca: no plate in the scenery");
  const { width: Wp, height: Hp } = plyta.geometry.parameters;
  plyta.updateMatrixWorld(true);
  // a point of the plate, seen from the base camera, on the stage plane (z 0) where stickers live
  const naScene = (fx, fy) => {
    const p = new THREE.Vector3((fx - 0.5) * Wp, (0.5 - fy) * Hp, 0); plyta.localToWorld(p);
    const k = CAM_Z / (CAM_Z - p.z); return [p.x * k, p.y * k];
  };
  const out = {};
  for (const [name, m] of Object.entries(dane)) {
    const [x0, y0] = naScene(m.x - m.w / 2, m.y - m.h / 2), [x1, y1] = naScene(m.x + m.w / 2, m.y + m.h / 2);
    const p = { name, rodzaj: m.rodzaj, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) };
    // a place off the safe area (x beyond +-6) is cut off on a 4:3 tablet: a lesson must not use it
    const widac = Math.max(0, Math.min(6, p.x + p.w / 2) - Math.max(-6, p.x - p.w / 2)) / Math.max(0.01, p.w);
    p.poza = widac < 0.6 || Math.abs(p.y) > 4.5;
    p.nadSufitem = p.y + p.h / 2 > 3.3;                                     // the phase icons live up there
    if (p.poza) console.warn(`miejsca: "${name}" in ${scena} lies mostly outside the safe area - not seen on a 4:3 screen`);
    else if (p.nadSufitem) console.warn(`miejsca: "${name}" in ${scena} reaches above SUFIT (y 3.3), under the phase icons`);
    p.slot = (accept = () => true) => ({ x: p.x, y: p.y, w: Math.max(0.9, p.w), h: Math.max(0.7, p.h), accept, niewidoczna: true, rodzaj: p.rodzaj, miejsce: name });
    p.strefa = () => S.zone({ x: p.x, y: p.y, w: Math.max(0.9, p.w), h: Math.max(0.7, p.h), name: `miejsce_${name}`, niewidoczna: true, rodzaj: p.rodzaj });
    out[name] = p;
  }
  return out;
}
