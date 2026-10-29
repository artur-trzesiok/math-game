// Mechanics, second set (accepted 2026-10-28): memory (pairs of cards), the shop (pay with coins), arrows (a program
// a pawn follows), shadows (any sticker as its silhouette), colour by number. The player wraps them as ctx calls.

import * as THREE from "three";
import { narysujCyfre } from "./liczby.js";
import { ksztalt } from "./geometria.js";
import { texture, GROUND } from "./scene.js";
import { Lalka } from "./lalka.js";
import * as U from "./ubior.js";

const FAST = new URLSearchParams(location.search).has("szybko");
const czekaj = (s) => new Promise((ok) => setTimeout(ok, (FAST ? Math.min(s, 0.15) : s) * 1000));
const tasuj = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// a stage thing moved into a group (keeps where it is on screen)
const doGrupy = (S, grp, h) => { S.scene.remove(h.mesh); h.mesh.position.x -= grp.position.x; h.mesh.position.y -= grp.position.y; grp.add(h.mesh); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); };
function uchwyt(S, grp, extra = {}) {
  const h = { mesh: grp, kind: "object", base: 1, size0: 1, pulse: false, home: { x: grp.position.x, y: grp.position.y }, zone: null, ...extra,
    remove: () => { S.scene.remove(grp); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); S.untarget(h); },
    highlight: (on) => { h.pulse = on; if (!on) grp.scale.setScalar(1); },
    moveTo: (nx, ny, d = 0.4) => { const x0 = grp.position.x, y0 = grp.position.y; return S.tween(d, (s) => { grp.position.x = x0 + (nx - x0) * s; grp.position.y = y0 + (ny - y0) * s; }); } };
  S.objects.push(h); return h;
}
// dots for a small number, in the pattern of a die (2-6) or a row
function kropki(n, r = 0.11, kolor = "#2b2622") {
  const g = new THREE.Group(), u = r * 2.6;
  const W = { 1: [[0, 0]], 2: [[-1, 1], [1, -1]], 3: [[-1, 1], [0, 0], [1, -1]], 4: [[-1, 1], [1, 1], [-1, -1], [1, -1]], 5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]], 6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]] }[n]
    || Array.from({ length: n }, (_, i) => [((i % 5) - 2) * 0.9, Math.floor(i / 5) * -1 + 0.5]);
  for (const [a, b] of W) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color: kolor, transparent: true, depthWrite: false })); m.position.set(a * u, b * u, 0.01); m.renderOrder = 12; g.add(m); }
  return g;
}

// ===================================================================== memory
// pary: [[face, face], ...], a face = {obraz} (a sticker; with `ile` many of it in a heap), {cyfra}, {kropki}. The cards lie face down in a grid; the
// child turns two; a pair stays open, two different ones turn back. Resolves when every pair is open.
export async function memory(S, pary, { x = 0, y = 0.35, kolumny = 4, szer = 1.45, odstep = 0.28 } = {}) {
  const wys = szer * 1.25, karty = tasuj(pary.flatMap((p, i) => p.map((f) => ({ ...f, para: i }))));
  const wiersze = Math.ceil(karty.length / kolumny), hs = [];
  for (const [i, f] of karty.entries()) {
    const c = i % kolumny, r = Math.floor(i / kolumny);
    const grp = new THREE.Group(); grp.position.set(x + (c - (kolumny - 1) / 2) * (szer + odstep), y + ((wiersze - 1) / 2 - r) * (wys + odstep), 0.4); S.scene.add(grp);
    const przod = new THREE.Group(), tyl = new THREE.Group(); grp.add(przod, tyl); przod.visible = false;
    const karta = await S.object("karta_przod", { obraz: "/game/assets/menu/karta.webp", x: grp.position.x, y: grp.position.y, size: wys * 1.02, cicho: true }); doGrupy(S, grp, karta); przod.add(karta.mesh);
    const rewers = await S.object("karta_rewers", { x: grp.position.x, y: grp.position.y, size: wys * 1.1, cicho: true }); doGrupy(S, grp, rewers); tyl.add(rewers.mesh);
    if (f.obraz && !(f.ile > 1)) { const o = await S.object(f.obraz, { x: grp.position.x, y: grp.position.y, size: szer * 0.78, cicho: true }); doGrupy(S, grp, o); przod.add(o.mesh); }
    if (f.obraz && f.ile > 1) for (let j = 0; j < f.ile; j++) {                 // many of one thing on one card: a little heap
      const a = j / f.ile * Math.PI * 2 + 0.4, rr = j ? szer * 0.22 : 0;
      const o = await S.object(f.obraz, { x: grp.position.x + Math.cos(a) * rr, y: grp.position.y + Math.sin(a) * rr * 1.2, size: szer * 0.38, cicho: true }); doGrupy(S, grp, o); przod.add(o.mesh);
    }
    if (f.cyfra != null) { const d = await narysujCyfre(S, f.cyfra, { x: grp.position.x, y: grp.position.y, size: wys * 0.5, duration: 0.01 }); for (const p of d.parts) { doGrupy(S, grp, p); przod.add(p.mesh); } }
    if (f.kropki) { const k = kropki(f.kropki, szer * 0.08); k.position.z = 0.05; przod.add(k); }
    const h = uchwyt(S, grp, { name: "karta", para: f.para, przod, tyl, otwarta: false });
    h.obroc = async (otworz) => {
      await S.tween(FAST ? 0.04 : 0.16, (s) => { grp.scale.x = Math.max(0.01, 1 - s); });
      przod.visible = otworz; tyl.visible = !otworz; h.otwarta = otworz;
      await S.tween(FAST ? 0.04 : 0.16, (s) => { grp.scale.x = Math.max(0.01, s); }); grp.scale.x = 1;
    };
    hs.push(h); S.appear(h, true);
  }
  S.memory = { karty: hs };
  for (let znalezione = 0; znalezione < pary.length;) {
    hs.forEach((h) => (h.dobry = !h.otwarta));                          // tests: any closed card first, then its pair
    const a = await S.choose(hs.filter((h) => !h.otwarta)); S.sfx.graj("tap"); await a.obroc(true);
    hs.forEach((h) => (h.dobry = !h.otwarta && h.para === a.para));
    const b = await S.choose(hs.filter((h) => !h.otwarta)); S.sfx.graj("tap"); await b.obroc(true);
    if (a.para === b.para) { znalezione++; S.sfx.graj("right"); S.bump(a, 0.15, false); S.bump(b, 0.15, false); a.znaleziona = b.znaleziona = true; }
    else { await czekaj(1.0); await Promise.all([a.obroc(false), b.obroc(false)]); }
  }
  S.memory = null;
  return { karty: hs, remove: () => hs.forEach((h) => h.remove()) };
}

// ===================================================================== the shop
// A thing with its price tag (dots up to 6, else a digit; or `pokaz`), a plate in front of the counter, coins. The
// child drags coins onto the plate - as many as the tag says. One too many jumps back; a tap on a coin on the plate
// takes it back. Resolves when the plate holds exactly the price.
export async function sklepik(S, { towar, cena, monet = cena + 2, pokaz = cena <= 6 ? "kropki" : "cyfra", x = 0, y = 0.7, onZaDuzo = null } = {}) {
  const rzecz = await S.object(towar, { x: x - 1.2, y, size: 1.5 });
  const metka = await S.object("metka", { x: x + 1.0, y: y + 0.2, size: 2.0 });
  const tx = metka.mesh.position.x + 0.05, ty = metka.mesh.position.y - 0.3;             // the tag's body, under its hole
  const tresc = pokaz === "kropki" ? (() => { const g = new THREE.Group(); g.position.set(tx, ty, 0.47); g.add(kropki(cena, 0.1)); S.scene.add(g); return uchwyt(S, g, { name: "cena" }); })()   // a handle: clear() takes it too
    : await narysujCyfre(S, cena, { x: tx, y: ty, size: 0.85, duration: 0.3 });
  const talerz = await S.object("talerz", { x, y: -1.45, size: 2.2, z: 0.35 });
  const monety = [];
  for (let i = 0; i < monet; i++) monety.push(await S.object("moneta", { x: x - ((monet - 1) / 2) * 0.85 + i * 0.85, y: -2.75, size: 0.75, cicho: i > 0 }));
  const na = [];
  const uloz = () => na.forEach((m, i) => m.moveTo(x - ((na.length - 1) / 2) * 0.5 + i * 0.5, -1.35 + (i % 2) * 0.06, 0.2));
  await new Promise((ok) => {
    S.free({
      items: monety.slice(), sklepik: { cena, na, x },
      onDrop: (m, p) => {
        const i = na.indexOf(m); if (i >= 0) na.splice(i, 1);
        if (Math.hypot(p.x - x, p.y + 1.45) < 1.4) {
          if (na.length >= cena) { S.sfx.graj("wrong"); m.moveTo(m.home.x, m.home.y, 0.35); onZaDuzo?.(); uloz(); return; }   // one too many: back it goes
          na.push(m); S.sfx.graj("plop"); uloz();
          if (na.length === cena) { S.endSort(); S.sfx.graj("right"); ok(); }
        } else { m.moveTo(m.home.x, m.home.y, 0.35); uloz(); }
      },
      onTap: (m) => { const i = na.indexOf(m); if (i >= 0) { na.splice(i, 1); m.moveTo(m.home.x, m.home.y, 0.3); uloz(); } },
      onPuppet: () => S.onPuppetTap?.(),
    });
  });
  return { rzecz, metka, talerz, monety, na, remove: () => { [rzecz, metka, talerz, ...monety].forEach((h) => h.remove()); tresc.remove(); } };
}

// ===================================================================== arrows
// A board of tiles, a pawn, a goal, bushes in the way. Arrows (up, right, down, left) wait at the side: a tap puts one
// at the end of the program row, a tap on the row's arrow takes it out; the green button runs it - the pawn hops cell
// by cell; into a bush or off the board it bumps and goes back to the start. Resolves when the pawn reaches the goal.
const KIER = { gora: [0, 1, 90], prawo: [1, 0, 0], dol: [0, -1, -90], lewo: [-1, 0, 180] };
export async function strzalki(S, { kolumny = 5, wiersze = 3, start = [0, 0], cel = [4, 2], przeszkody = [], pionek = "jez", celObraz = "marchewka", x = 0.6, y = 0.9, krok = 1.15, maks = 8 } = {}) {
  const pole = ([c, r]) => [x + (c - (kolumny - 1) / 2) * krok, y + (r - (wiersze - 1) / 2) * krok];
  const plytki = [];
  for (let r = 0; r < wiersze; r++) for (let c = 0; c < kolumny; c++) { const [px, py] = pole([c, r]); plytki.push(ksztalt(S, "kwadrat", { x: px, y: py, size: krok * 0.92, color: (c + r) % 2 ? "#f3e6c4" : "#eadbb2", name: "plytka" })); }
  const bez = (h) => h.mesh.traverse((o) => { if (o.renderOrder != null) o.renderOrder = Math.min(o.renderOrder, 9.5); });
  plytki.forEach(bez);
  const krzaki = []; for (const p of przeszkody) { const [px, py] = pole(p); krzaki.push(await S.object("krzak", { x: px, y: py, size: krok * 0.95, cicho: true })); }
  const [cx, cy] = pole(cel), celH = await S.object(celObraz, { x: cx, y: cy, size: krok * 0.8 });
  const [sx, sy] = pole(start), pion = await S.object(pionek, { x: sx, y: sy, size: krok * 0.85, z: 0.5 });
  // the arrows to pick from, on the left; the program row along the bottom; the green go button
  const wybor = [];
  for (const [i, k] of Object.keys(KIER).entries()) {
    const h = await S.object("strzalka", { x: -5.3 + (i % 2) * 1.0, y: 1.4 - Math.floor(i / 2) * 1.0, size: 0.9, cicho: true }); h.icon.rotation.z = KIER[k][2] * Math.PI / 180; h.kier = k; wybor.push(h);
  }
  const przycisk = ksztalt(S, "kolo", { x: 5.2, y: -2.5, size: 1.1, color: "#4caf50", name: "start" });
  const tr = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.16, -0.22), new THREE.Vector2(0.24, 0), new THREE.Vector2(-0.16, 0.22)])), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false }));
  tr.renderOrder = 11; tr.position.z = 0.05; przycisk.inner.add(tr);
  const program = [], miejsceX = (i) => -3.9 + i * 1.0;
  const zlicz = () => program.forEach((h, i) => h.moveTo(miejsceX(i), -2.65, 0.15));
  const wykonaj = async () => {
    let p = start.slice();
    for (const h of program) {
      const [dx, dy] = KIER[h.kier], n = [p[0] + dx, p[1] + dy];
      h.highlight(true);
      const zle = n[0] < 0 || n[1] < 0 || n[0] >= kolumny || n[1] >= wiersze || przeszkody.some((q) => q[0] === n[0] && q[1] === n[1]);
      const [ax, ay] = pole(p), [bx, by] = pole(n);
      if (zle) {                                                         // halfway in, a bump, back
        await S.tween(FAST ? 0.05 : 0.2, (s) => { pion.mesh.position.x = ax + (bx - ax) * 0.4 * s; pion.mesh.position.y = ay + (by - ay) * 0.4 * s; });
        S.sfx.graj("wrong"); await S.tween(FAST ? 0.05 : 0.2, (s) => { pion.mesh.position.x = ax + (bx - ax) * 0.4 * (1 - s); pion.mesh.position.y = ay + (by - ay) * 0.4 * (1 - s); });
        h.highlight(false); await czekaj(0.4); await pion.moveTo(sx, sy, 0.35); return false;
      }
      S.sfx.graj("hop");
      await S.tween(FAST ? 0.06 : 0.38, (s) => { pion.mesh.position.x = ax + (bx - ax) * s; pion.mesh.position.y = ay + (by - ay) * s + Math.sin(s * Math.PI) * 0.35; });
      h.highlight(false); p = n;
      if (p[0] === cel[0] && p[1] === cel[1]) { S.sfx.graj("right"); S.bump(celH, 0.3, false); return true; }
    }
    await czekaj(0.5); await pion.moveTo(sx, sy, 0.35); return false;          // the program ended short of the goal
  };
  await new Promise((ok) => {
    const petla = async () => {
      for (;;) {
        const hit = await S.choose([...wybor, ...program, przycisk]);
        if (hit === przycisk) { if (!program.length) continue; S.sfx.graj("tap"); if (await wykonaj()) return ok(); continue; }
        if (program.includes(hit)) { program.splice(program.indexOf(hit), 1); hit.remove(); zlicz(); continue; }
        if (program.length >= maks) { S.shake(hit); continue; }
        const h = await S.object("strzalka", { x: hit.mesh.position.x, y: hit.mesh.position.y, size: 0.8, cicho: true }); h.icon.rotation.z = hit.icon.rotation.z; h.kier = hit.kier;
        program.push(h); zlicz();
      }
    };
    S.strzalki = { kolumny, wiersze, start, cel, przeszkody, wybor, przycisk, program };   // tests
    petla();
  });
  S.strzalki = null;
  return { remove: () => [...plytki, ...krzaki, celH, pion, ...wybor, ...program, przycisk].forEach((h) => h.remove()) };
}

// ===================================================================== shadows
// A sticker drawn as its silhouette (from its own picture's alpha, so every sticker has one); cien(h, false) shows it again.
export function cien(S, h, on = true, { kolor = "#3e3a54" } = {}) {
  const m = h.icon; if (!m) return h;
  if (on && !m.userData.zwykly) {
    m.userData.zwykly = m.material;
    m.material = new THREE.ShaderMaterial({
      uniforms: { mapa: { value: m.material.map }, kolor: { value: new THREE.Color(kolor) } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform sampler2D mapa; uniform vec3 kolor; varying vec2 vUv; void main() { float a = texture2D(mapa, vUv).a; if (a < 0.02) discard; gl_FragColor = vec4(kolor, a * 0.92); }",
      transparent: true, depthWrite: false,
    });
  } else if (!on && m.userData.zwykly) { m.material = m.userData.zwykly; m.userData.zwykly = null; }
  h.cien = on; return h;
}

// ===================================================================== colour by number
// game/assets/kolorowanki/<name> (tools/kolorowanki): a picture whose areas carry numbers; crayons with the same
// numbers along the bottom. The child picks a crayon, then points to an area: one with that number fills with its
// colour, another shakes the crayon. Resolves when every area is coloured.
// `znaki`: a sign per colour instead of its number (["kolo", "trojkat", ...]) - for a lesson before the digits
const ZNAK = (cx, k, x, y, r) => {
  cx.beginPath();
  if (k === "kolo") cx.arc(x, y, r * 0.8, 0, 7);
  else if (k === "trojkat") { cx.moveTo(x, y - r * 0.85); cx.lineTo(x + r * 0.95, y + r * 0.7); cx.lineTo(x - r * 0.95, y + r * 0.7); cx.closePath(); }
  else if (k === "kwadrat") cx.rect(x - r * 0.72, y - r * 0.72, r * 1.44, r * 1.44);
  else if (k === "prostokat") cx.rect(x - r * 0.95, y - r * 0.5, r * 1.9, r * 1.0);
  else if (k === "serce") { cx.moveTo(x, y + r * 0.8); cx.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35); cx.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.3, y - r * 0.1, x, y + r * 0.8); }
  else { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.42 : r; cx.lineTo(x + q * Math.cos(a), y + q * Math.sin(a)); } cx.closePath(); }   // gwiazdka
  cx.fill();
};
export async function kolorowanka(S, nazwa, { x = 0.4, y = 0.55, size = 5.6, znaki = null } = {}) {
  const kat = `/game/assets/kolorowanki/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const wczytaj = (u) => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = kat + u; });
  const [mapaImg, linieImg] = await Promise.all([wczytaj("regiony.png"), wczytaj("linie.webp")]);
  const W = meta.szerokosc, H = meta.wysokosc;
  const mc = document.createElement("canvas"); mc.width = W; mc.height = H; const mx = mc.getContext("2d", { willReadFrequently: true }); mx.drawImage(mapaImg, 0, 0);
  const ids = mx.getImageData(0, 0, W, H).data;
  const plotno = document.createElement("canvas"); plotno.width = W; plotno.height = H; const px = plotno.getContext("2d");
  const barwy = new Map();                                                // region id -> fill colour (once coloured)
  const rysuj = () => {
    const img = px.createImageData(W, H), d = img.data;
    for (let i = 0; i < W * H; i++) {
      const id = ids[i * 4]; if (!id) continue;
      const c = barwy.get(id); d[i * 4] = c ? c[0] : 255; d[i * 4 + 1] = c ? c[1] : 255; d[i * 4 + 2] = c ? c[2] : 255; d[i * 4 + 3] = 255;
    }
    px.putImageData(img, 0, 0); px.drawImage(linieImg, 0, 0);
    px.fillStyle = "#6b6258"; px.textAlign = "center"; px.textBaseline = "middle";
    for (const r of meta.regiony) if (!barwy.has(r.id)) {
      const wys = Math.max(18, Math.min(64, r.r * 1.1));
      if (znaki) ZNAK(px, znaki[r.kolor - 1], r.x, r.y, Math.min(r.r * 0.7, wys * 0.6));   // a sign reads smaller than a digit
      else { px.font = `bold ${wys}px sans-serif`; px.fillText(String(r.kolor), r.x, r.y); }
    }
    tex.needsUpdate = true;
  };
  const tex = new THREE.CanvasTexture(plotno); tex.colorSpace = THREE.SRGBColorSpace;
  const obraz = new THREE.Mesh(new THREE.PlaneGeometry(size, size * H / W), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  obraz.position.set(x, y, 0.35); obraz.renderOrder = 10; S.scene.add(obraz);
  rysuj();
  const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  // the crayons: a coloured stick with its number, one per colour of the palette
  const kredki = meta.paleta.map((k, i) => {
    const kx = -((meta.paleta.length - 1) / 2) * 1.05 + i * 1.05 + x;
    const h = ksztalt(S, "prostokat", { x: kx, y: -2.85, size: 0.62, color: k, rot: 90, name: "kredka" }); h.kolor = i + 1;
    const n = document.createElement("canvas"); n.width = n.height = 128; const nx = n.getContext("2d"); nx.fillStyle = "#fff"; nx.beginPath(); nx.arc(64, 64, 46, 0, 7); nx.fill(); nx.fillStyle = "#2b2622";
    if (znaki) ZNAK(nx, znaki[i], 64, 66, 30); else { nx.font = "bold 72px sans-serif"; nx.textAlign = "center"; nx.textBaseline = "middle"; nx.fillText(String(i + 1), 64, 70); }
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(n), transparent: true, depthWrite: false })); s.renderOrder = 12; s.position.z = 0.06; h.mesh.add(s);
    return h;
  });
  let wybrana = null;
  const wybierz = (k) => { if (wybrana) wybrana.moveTo(wybrana.home.x, wybrana.home.y, 0.15); wybrana = k; k.moveTo(k.home.x, k.home.y + 0.3, 0.15); S.sfx.graj("tap"); };
  const zostalo = () => meta.regiony.filter((r) => !barwy.has(r.id));
  const pomaluj = (r) => { barwy.set(r.id, hex(meta.paleta[r.kolor - 1])); rysuj(); S.sfx.graj("pop"); };
  await new Promise((ok) => {
    const oddaj = (S.palec = {
      down: ([wx, wy]) => {
        const k = kredki.find((h) => Math.abs(h.mesh.position.x - wx) < 0.45 && Math.abs(h.mesh.position.y - wy) < 0.6);
        if (k) { wybierz(k); return true; }
        const u = (wx - (x - size / 2)) / size, v = 1 - (wy - (y - size * H / W / 2)) / (size * H / W);
        if (u < 0 || u > 1 || v < 0 || v > 1) return false;
        const id = ids[(Math.floor(v * H) * W + Math.floor(u * W)) * 4], r = meta.regiony.find((q) => q.id === id);
        if (!r || barwy.has(r.id)) return true;
        if (!wybrana) { kredki.forEach((h) => S.bump(h, 0.2, false)); return true; }        // no crayon yet: the crayons wave
        if (wybrana.kolor !== r.kolor) { S.shake(wybrana); return true; }
        pomaluj(r);
        if (!zostalo().length) { S.palec = null; S.kolorowanka = null; S.sfx.graj("right"); ok(); }
        return true;
      },
    });
    S.kolorowanka = { meta, dokoncz: () => { for (const r of zostalo()) barwy.set(r.id, hex(meta.paleta[r.kolor - 1])); rysuj(); if (S.palec === oddaj) S.palec = null; S.kolorowanka = null; ok(); } };   // tests
  });
  return { obraz, kredki, remove: () => { S.scene.remove(obraz); kredki.forEach((k) => k.remove()); } };
}

// ===================================================================== spot the difference
// game/assets/roznice/<name> (tools/roznice): two pictures side by side; every difference is a target in BOTH (an
// invisible disc); a found one is circled with the pencil in both pictures. Resolves when all are found.
export async function roznice(S, nazwa, { y = 0.45, size = 4.9, odstep = 0.35 } = {}) {
  const kat = `/game/assets/roznice/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const [ta, tb] = await Promise.all([texture(kat + "a.webp"), texture(kat + "b.webp")]);
  const xs = [-(size + odstep) / 2, (size + odstep) / 2], obrazy = [];
  for (const [i, t] of [ta, tb].entries()) {
    const ramka = new THREE.Mesh(new THREE.PlaneGeometry(size + 0.16, size + 0.16), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false }));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    ramka.renderOrder = 9.8; m.renderOrder = 9.9; m.position.z = 0.01;
    const g = new THREE.Group(); g.add(ramka, m); g.position.set(xs[i], y, 0.3); S.scene.add(g);
    obrazy.push(uchwyt(S, g, { name: "obrazek" }));
  }
  const punkt = (r, i) => [xs[i] + (r.x - 0.5) * size, y + (0.5 - r.y) * size];
  // one target per difference per picture; either finds it
  const cele = [];
  for (const [k, r] of meta.roznice.entries()) for (const i of [0, 1]) {
    const [px, py] = punkt(r, i), rr = Math.max(0.35, r.r * size);
    const m = new THREE.Mesh(new THREE.CircleGeometry(rr, 24), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    const g = new THREE.Group(); g.add(m); g.position.set(px, py, 0.5); S.scene.add(g);
    cele.push(uchwyt(S, g, { name: "roznica", nr: k, r: rr, dobry: true }));
  }
  const znalezione = new Set(), kolka = [];
  const kolo = ([cx, cy], r) => Array.from({ length: 41 }, (_, j) => { const a = j / 40 * Math.PI * 2 + 0.6, w = 1 + 0.06 * Math.sin(j * 1.7); return [cx + Math.cos(a) * r * w, cy + Math.sin(a) * r * 0.92 * w]; });
  Object.defineProperty(S, "zachetaCel", { configurable: true, get: () => cele.find((c) => !znalezione.has(c.nr)) || null });
  while (znalezione.size < meta.roznice.length) {
    const hit = await S.choose(cele.filter((c) => !znalezione.has(c.nr)));
    znalezione.add(hit.nr); S.sfx.graj("right");
    const r = meta.roznice[hit.nr];
    for (const i of [0, 1]) kolka.push(await S.line(kolo(punkt(r, i), Math.max(0.35, r.r * size)), { color: "#e8502e", width: 0.09, duration: 0.35, strong: true }));
  }
  Object.defineProperty(S, "zachetaCel", { configurable: true, value: null, writable: true });
  cele.forEach((c) => c.remove());
  return { obrazy, kolka, remove: () => [...obrazy, ...kolka].forEach((h) => h.remove()) };
}

// ===================================================================== a reflection in water
// The character stands on the bank (`woda`: the water's edge, its feet there) and the same puppet hangs upside down
// under it, moving as it does (scene.js copies the animation every frame), under a blue rippling veil. It wears
// `ubrania` like the original except `rozne` - those are the differences; `znajdz()` makes each a target on both
// (the garment on the character and its mirror image) and circles a found one on both.
export async function odbicie(S, who, { woda = 0.2, ubrania = [], rozne = [] } = {}) {
  const L = S.puppets[who]; if (!L) return null;
  L.korzen.position.y = woda; L.podloga = woda; L.lustroOn = true;
  L.bezCienia = true;                                                   // the pond is its shadow (the hatched one flickered across the water)
  const O = await Lalka.wczytaj(`/game/assets/characters/${who}/`, { strona: L.strona ?? "lewo", wysokosc: L.meta?.wysokosc ?? 3.6 });
  const klucz = `${who}_odbicie`;
  O.name = who; O.meta = L.meta; O.lustro = L; O.home = L.home;
  const k = L.korzen.scale.x;                                           // a character further up the bank is drawn smaller
  O.korzen.position.set(L.korzen.position.x, woda, -0.1); O.korzen.scale.set(k, -k, 1); O.korzen.visible = L.korzen.visible;
  S.scene.add(O.korzen); S.puppets[klucz] = O;
  const dwustronnie = () => O.korzen.traverse((o) => { if (o.isMesh) { o.material.depthTest = false; o.material.depthWrite = false; o.material.side = THREE.DoubleSide; } });
  dwustronnie(); S.layer(O, false);
  for (const r of ubrania) { await U.ubierz(S, who, r, { pop: false }); if (!rozne.includes(r)) await U.ubierz(S, klucz, r, { pop: false }); }
  dwustronnie();
  // the pond: an oval of water under the reflection, and a light rippling veil over it
  const wys = (L.meta?.wysokosc ?? 3.6) * 1.12 * k, szer = 4.8 * k;
  const shader = (alfa) => new THREE.ShaderMaterial({
    uniforms: { czas: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float czas; varying vec2 vUv; void main() {
      vec2 p = (vUv - vec2(0.5, 0.52)) * vec2(2.0, 2.0); float d = length(p);
      float owal = 1.0 - smoothstep(0.9, 1.0, d);
      float f = 0.5 + 0.5 * sin(vUv.y * 70.0 + czas * 2.0 + sin(vUv.x * 9.0 + czas) * 1.5);
      vec3 kol = mix(vec3(0.33, 0.58, 0.82), vec3(0.62, 0.82, 0.95), smoothstep(0.2, 1.0, vUv.y));
      gl_FragColor = vec4(kol + 0.06 * f, owal * (${alfa} + 0.06 * f) + (1.0 - smoothstep(0.98, 1.06, d)) * smoothstep(0.88, 0.98, d) * 0.5); }`,
  });
  const tafla = new THREE.Mesh(new THREE.PlaneGeometry(szer, wys), shader("0.92")), fale = new THREE.Mesh(new THREE.PlaneGeometry(szer, wys), shader("0.22"));
  for (const [m, ro] of [[tafla, 19], [fale, 26]]) { m.position.set(L.korzen.position.x, woda - wys / 2 + 0.1, 0.2); m.renderOrder = ro; S.scene.add(m); }
  const fala = setInterval(() => {
    for (const m of [tafla, fale]) { m.material.uniforms.czas.value += 0.05; m.position.x = L.korzen.position.x; }
    O.korzen.scale.x = k * (1 + 0.015 * Math.sin(performance.now() / 300));
  }, 40);
  const narysowane = [];                                              // the circles of znajdz(): they go with the pond
  let usuniete = false;
  const remove = () => { if (usuniete) return; usuniete = true; const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); clearInterval(fala); L.bezCienia = false; narysowane.forEach((k) => k.remove()); S.scene.remove(tafla); S.scene.remove(fale); U.zdejmij(S, klucz); S.scene.remove(O.korzen); delete S.puppets[klucz]; L.korzen.position.y = GROUND; L.podloga = null; };   // back on the front ground
  const h = { mesh: tafla, kind: "staw", name: "staw", base: 1, remove };       // a stage object: clear() (a skipped scene too) takes the pond and the reflection
  S.objects.push(h);
  // the differences: a target on the garment and on the place it would be in the water
  const znajdz = async () => {
    const cele = [];
    for (const [k, r] of rozne.entries()) {
      const u = Object.values(L.ubior || {}).find((q) => q.rzecz === r); if (!u) continue;
      const widac = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };   // only the view on show
      L.korzen.updateMatrixWorld(true);
      const b = new THREE.Box3(); for (const [m] of u.rzeczy) if (widac(m)) b.expandByObject(m);
      if (b.isEmpty()) continue;
      const c = b.getCenter(new THREE.Vector3()), rr = Math.max(0.4, (b.max.x - b.min.x) * 0.6);
      for (const [px, py] of [[c.x, c.y], [c.x, 2 * woda - c.y]]) {
        const m = new THREE.Mesh(new THREE.CircleGeometry(rr, 24), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
        const g = new THREE.Group(); g.add(m); g.position.set(px, py, 0.9); S.scene.add(g);
        cele.push(uchwyt(S, g, { name: "roznica", nr: k, r: rr, dobry: true, punkty: [[c.x, c.y], [c.x, 2 * woda - c.y]] }));
      }
    }
    const znalezione = new Set(), kolka = [];
    const kolo = ([cx, cy], r) => Array.from({ length: 41 }, (_, j) => { const a = j / 40 * Math.PI * 2 + 0.6; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9]; });
    const ile = new Set(cele.map((c) => c.nr)).size;
    while (znalezione.size < ile) {
      const hit = await S.choose(cele.filter((c) => !znalezione.has(c.nr)));
      znalezione.add(hit.nr); S.sfx.graj("right");
      for (const p of hit.punkty) {
        const k = await S.line(kolo(p, hit.r), { color: "#e8502e", width: 0.09, duration: 0.35, strong: true, wait: false });
        k.mesh.traverse((o) => { if (o.isMesh) o.renderOrder += 30; });                        // over the character and the water
        kolka.push(k); narysowane.push(k); await czekaj(0.35);
      }
    }
    cele.forEach((c) => c.remove());
    return kolka;
  };
  return { odbicie: O, znajdz, remove };
}

// ===================================================================== joining pairs with a line
// `lewe` and `prawe` (handles already on the stage); `para(a, b)` says whether two belong together. The child draws from a
// thing to another with a finger: the pencil follows; let go on its pair - the line stays drawn and both bump; on a
// wrong one the line wobbles and fades. Resolves when every one of `lewe` is joined. Tests: S.polacz.dokoncz().
export async function polacz(S, { lewe, prawe, para, kolor = "#2f6fd0", onZle = null }) {
  const wszystkie = [...lewe, ...prawe], linie = [], polaczone = new Set();
  const nad = ([x, y]) => wszystkie.find((h) => { if (polaczone.has(h)) return false; const b = S.bounds(h); return x >= b.left - 0.15 && x <= b.right + 0.15 && y >= b.bottom - 0.15 && y <= b.top + 0.15; });
  const srodek = (h) => [h.mesh.position.x, h.mesh.position.y];
  let tymczasowa = null, od = null;
  // the line under the finger: a thick rounded band from the start to the finger (a GL line is one pixel thin)
  const pokaz = (a, b) => {
    if (!tymczasowa) { tymczasowa = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.11), new THREE.MeshBasicMaterial({ color: kolor, transparent: true, opacity: 0.75, depthTest: false })); tymczasowa.renderOrder = 60; S.scene.add(tymczasowa); }
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 0.001;
    tymczasowa.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.8); tymczasowa.scale.set(l, 1, 1); tymczasowa.rotation.z = Math.atan2(dy, dx);
    tymczasowa.userData.koniec = b; tymczasowa.visible = true;
  };
  const schowaj = () => { if (tymczasowa) tymczasowa.visible = false; };
  const dobrze = async (a, b) => {
    polaczone.add(a); polaczone.add(b);
    linie.push(await S.line([srodek(a), srodek(b)], { color: kolor, width: 0.08, duration: 0.25, strong: true }));
    S.sfx.graj("right"); S.bump(a, 0.25, false); S.bump(b, 0.25, false);
  };
  await new Promise((ok) => {
    const koniec = () => { if (lewe.every((h) => polaczone.has(h))) { S.palec = null; S.polacz = null; if (tymczasowa) S.scene.remove(tymczasowa); ok(); } };
    S.palec = {
      down: (p) => { od = nad(p); return !!od; },
      move: (p) => { if (od) pokaz(srodek(od), p); },
      up: async () => {
        const a = od; od = null; if (!a || !tymczasowa?.visible) { schowaj(); return; }
        const b = nad(tymczasowa.userData.koniec); schowaj();
        if (!b || b === a) return;
        if (para(a, b) || para(b, a)) { await dobrze(a, b); koniec(); }
        else { S.sfx.graj("wrong"); S.shake(b); onZle?.(a, b); }
      },
    };
    S.polacz = {                                                          // tests: join every pair at once
      dokoncz: async () => { for (const a of lewe) if (!polaczone.has(a)) { const b = prawe.find((q) => !polaczone.has(q) && (para(a, q) || para(q, a))); if (b) await dobrze(a, b); } koniec(); },
      lewe, prawe, para,
    };
  });
  return { linie, remove: () => linie.forEach((l) => l.remove()) };
}
