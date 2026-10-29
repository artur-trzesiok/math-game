// Mechanics, sixth set (docs/mechaniki_na_zapas.md rows 7, 8, 4): does it fit through a gap (szpara), measuring with
// units laid end to end (miarka: paws, blocks, a ruler, weights on the scale), a picture bar chart (wykres). Everything
// the child sees is a painted sticker; the code measures the paintings (alpha), draws pencil lines and digits, and keeps
// invisible tap targets. Tests: S.szpara / S.miarka / S.wykres .dokoncz().

import * as THREE from "three";
import { texture, GROUND, SUFIT } from "./scene.js";

const FAST = new URLSearchParams(location.search).has("szybko");
const t = (s) => (FAST ? Math.min(s, 0.1) : s);
const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
const kolejnoscRzeczy = (h, r) => h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = r; });
const przezroczystosc = (h, a) => h.mesh.traverse((o) => { if (o.isMesh && o.material) o.material.opacity = a; });

// an invisible tap target (as mechaniki4's): a lesson asks with c.task({targets: [...]})
function cel(S, g, extra) {
  S.scene.add(g);
  const h = { mesh: g, kind: "object", base: 1, size0: 1, pulse: false, zone: null, ...extra,
    remove: () => { g.parent?.remove(g); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); S.untarget(h); } };
  h.highlight ??= (on) => { h.pulse = on; if (!on) g.scale.setScalar(1); };
  S.objects.push(h); return h;
}
const prostokat = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat({ opacity: 0, side: THREE.DoubleSide })); m.position.set(x, y, 0.5); return m; };

// the alpha of a sticker's picture (cached per image): fractions of the square where the painting really is
const ALFA = new WeakMap();
function alfa(img) {
  let a = ALFA.get(img); if (a) return a;
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, img.width, img.height).data, W = img.width, H = img.height;
  const pelny = (px, py) => d[(py * W + px) * 4 + 3] > 40;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) if (pelny(px, py)) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
  a = { W, H, pelny, u0: x0 / W, u1: (x1 + 1) / W, v0: y0 / H, v1: (y1 + 1) / H };
  ALFA.set(img, a); return a;
}
const obrazNaklejki = async (n) => (await texture(`/game/assets/objects/${n}.webp`)).image;

// the see-through opening of a painted gap, in fractions of the sticker: across (os "x": between two posts, measured
// on the lower part where a thing passes) or up (os "y": under an arch, from the drawn bottom)
export function zmierzOtwor(img, os) {
  const a = alfa(img), { W, H, pelny } = a;
  const X0 = Math.round(a.u0 * W), X1 = Math.round(a.u1 * W) - 1, Y0 = Math.round(a.v0 * H), Y1 = Math.round(a.v1 * H) - 1;
  const cx = Math.round((X0 + X1) / 2);
  const wolnyKolo = (py) => { for (let d = 0; d < (X1 - X0) * 0.2; d++) { if (!pelny(cx + d, py)) return cx + d; if (!pelny(cx - d, py)) return cx - d; } return -1; };
  if (os === "y") {
    const hs = [], ls = [], rs = [];
    for (let px = cx - Math.round(W * 0.03); px <= cx + Math.round(W * 0.03); px++) { let py = Y1; while (py > Y0 && !pelny(px, py)) py--; hs.push(Y1 - py); }
    const yy = Y1 - 2; let l = cx, r = cx; while (l > X0 && !pelny(l, yy)) l--; while (r < X1 && !pelny(r, yy)) r++; ls.push(l); rs.push(r);
    return { os, wys: Math.min(...hs) / H, uL: (ls[0] + 1) / W, uR: rs[0] / W, ...a };
  }
  const szer = [];
  for (let py = Math.round(Y0 + (Y1 - Y0) * 0.5); py <= Math.round(Y0 + (Y1 - Y0) * 0.92); py += 2) {
    const s = wolnyKolo(py); if (s < 0) continue;
    let l = s, r = s; while (l > X0 && !pelny(l, py)) l--; while (r < X1 && !pelny(r, py)) r++;
    if (l <= X0 || r >= X1) continue;                                   // open to the side: not between two posts
    szer.push([r - l - 1, l + 1, r]);
  }
  if (!szer.length) throw new Error("szpara: no see-through opening between two sides in this picture");
  szer.sort((p, q) => p[0] - q[0]);
  const [, l, r] = szer[Math.floor(szer.length * 0.2)];                // a tuft of grass must not decide, the narrow part must
  return { os, uL: l / W, uR: r / W, wys: (Y1 - Y0) / H, ...a };
}

// ===================================================================== does it fit through? (szpara)
// Painted gaps stand on the ground (two trees, a gateway in a fence or a stone wall, an arch under a little bridge);
// things wait above the heads. The child drags a thing onto a gap: one that fits slides in BEHIND the sides and goes
// away through it (rolls when `h.toczy`); one too wide (os "x") or too tall (os "y", an arch) is pushed in front of
// the sides - so it visibly sticks out over them - gets stuck, wobbles, `onZle(h, gap)` and goes back. The opening is
// measured on the painting; `szczelina` scales a gap so its opening is that many units. `pasuje(h, gap)` overrides the
// measure (solids: what rolls). Resolves when every thing that fits some gap went through (`jedna`: after the first).
export async function szpara(S, { szpary = [{ obraz: "szpara_furtka" }], rzeczy = [], y = GROUND + 0.1, rzeczyY = 1.6, rozmiar = 1.1, pasuje = null, jedna = false, luz = 0.02, onZle = null, onPrzeszla = null } = {}) {
  // the gaps, standing on the ground line
  const bramy = [];
  for (const [i, s0] of szpary.entries()) {
    const s = typeof s0 === "string" ? { obraz: s0 } : s0;
    const os = s.os || (/mostek|tunel|luk/.test(s.obraz) ? "y" : "x");
    const o = zmierzOtwor(await obrazNaklejki(s.obraz), os);
    const otw = os === "x" ? o.uR - o.uL : o.wys;
    // a gap scaled to its opening stays on the screen: at most 5.6 wide and up to SUFIT high
    const a0 = alfa(await obrazNaklejki(s.obraz)), sMax = Math.min(5.6 / (a0.u1 - a0.u0), (SUFIT - 0.2 - (s.y ?? y)) / (a0.v1 - a0.v0));
    if (s.szczelina && s.szczelina / otw > sMax) console.warn(`szpara: ${s.obraz} cannot open ${s.szczelina} units on screen; capped`);
    const size = Math.min(sMax, s.szczelina ? s.szczelina / otw : s.size ?? 3.4);
    const x = s.x ?? (szpary.length === 1 ? 1.4 : -2.2 + 4.4 * i / (szpary.length - 1));
    const yc = (s.y ?? y) - (0.5 - o.v1) * size;
    const g = await S.object(s.obraz, { x, y: yc, size, plik: s.obraz });
    g.os = os; g.otwor = { xl: x + (o.uL - 0.5) * size, xr: x + (o.uR - 0.5) * size, dol: s.y ?? y };
    g.otwor.szer = g.otwor.xr - g.otwor.xl; g.otwor.wys = o.wys * size; g.otwor.x = (g.otwor.xl + g.otwor.xr) / 2;
    g.dobry = false; bramy.push(g);
  }
  // the things: handles stay where the lesson put them, names line up above the heads
  const lista = [];
  for (const [i, r] of rzeczy.entries()) {
    if (typeof r !== "string" && !r.obraz) { lista.push(r); continue; }
    const n = typeof r === "string" ? r : r.obraz, sz = r.size ?? rozmiar;
    const krok = Math.min(2.0, 8.4 / Math.max(1, rzeczy.length));
    const h = await S.object(n, { x: (i - (rzeczy.length - 1) / 2) * krok, y: rzeczyY, size: sz });
    if (r.toczy) h.toczy = true;
    lista.push(h);
  }
  for (const h of lista) { h.home = { x: h.mesh.position.x, y: h.mesh.position.y }; h.przeszla = null; }
  const miara = (h, g) => { const b = S.bounds(h); return g.os === "x" ? b.right - b.left : b.top - b.bottom; };
  const miesci = (h, g) => (pasuje ? pasuje(h, g) : miara(h, g) <= (g.os === "x" ? g.otwor.szer : g.otwor.wys) + luz);
  const przeszly = [], utknely = [];
  const naDnie = (h, g) => { const b = S.bounds(h); return h.mesh.position.y + (g.otwor.dol + 0.02 - b.bottom); };
  const przejdz = async (h, g) => {
    h.zajeta = true; h.zablokowany = true; kolejnoscRzeczy(h, 9.6);          // behind the gap's sides: it goes in between them
    S.sfx.graj("whoosh");
    await h.moveTo(g.otwor.x, naDnie(h, g), t(0.3));
    const b0 = h.base, y0 = h.mesh.position.y, r0 = h.mesh.rotation.z;
    await S.tween(t(0.75), (s) => {
      const q = b0 * (1 - 0.5 * s); h.mesh.scale.setScalar(q);
      h.mesh.position.y = y0 + (g.otwor.wys * 0.18) * s - (b0 - q) * 0.0;
      if (h.toczy) h.mesh.rotation.z = r0 - s * Math.PI * 1.5;
      przezroczystosc(h, s < 0.55 ? 1 : 1 - (s - 0.55) / 0.45);
    });
    h.mesh.visible = false; h.przeszla = g; przeszly.push(h);
    onPrzeszla?.(h, g);
  };
  const utknij = async (h, g) => {
    h.zajeta = true; kolejnoscRzeczy(h, 10.6);                              // in front: it sticks out over the sides
    await h.moveTo(g.otwor.x, naDnie(h, g), t(0.25));
    S.bump(g, 0.04, false);
    const r0 = h.mesh.rotation.z;
    await Promise.all([S.shake(h), S.tween(t(0.7), (s) => { h.mesh.rotation.z = r0 + 0.1 * Math.sin(s * Math.PI * 5) * (1 - s); })]);
    h.mesh.rotation.z = r0; if (!utknely.includes(h)) utknely.push(h);
    onZle?.(h, g);
    await S.wait(t(0.5));
    await h.moveTo(h.home.x, h.home.y, t(0.4));
    kolejnoscRzeczy(h, 10); h.zajeta = false;
  };
  const moga = () => lista.filter((h) => bramy.some((g) => miesci(h, g)));
  await new Promise((gotowe) => {
    let koniec = false;
    const sprawdz = () => {
      if (koniec) return;
      const ok = jedna ? przeszly.length > 0 : moga().length ? moga().every((h) => h.przeszla) : lista.every((h) => utknely.includes(h));
      if (ok) { koniec = true; S.endSort(); S.szpara = null; S.sfx.graj("right"); gotowe(); }
    };
    const aktywne = lista.slice();
    S.free({ items: aktywne, onTap: () => {}, onPuppet: () => S.onPuppetTap?.(), onDrop: async (h, p) => {
      if (h.zajeta || h.przeszla) return;
      const g = bramy.find((q) => { const b = S.bounds(q); return p.x > b.left - 0.4 && p.x < b.right + 0.4 && p.y > b.bottom - 0.6 && p.y < b.top + 0.4; });
      if (!g) return h.moveTo(h.home.x, h.home.y, t(0.35));
      if (miesci(h, g)) { aktywne.splice(aktywne.indexOf(h), 1); await przejdz(h, g); } else await utknij(h, g);
      sprawdz();
    } });
    S.szpara = { dokoncz: async () => {
      for (const h of moga()) if (!h.przeszla) { const i = aktywne.indexOf(h); if (i >= 0) aktywne.splice(i, 1); await przejdz(h, bramy.find((g) => miesci(h, g))); if (jedna) break; }
      if (!moga().length) for (const h of lista) if (!utknely.includes(h)) await utknij(h, bramy[0]);
      sprawdz();
    } };
  });
  return { kind: "szpara", szpary: bramy, rzeczy: lista, przeszly, utknely, miesci,
    remove: () => { bramy.forEach((g) => g.remove()); lista.forEach((h) => h.remove()); } };
}

// ===================================================================== measuring with units (miarka)
// A thing lies on the floor from a pencil start line, `dlugosc` units long (a sticker name is sized so; a handle keeps its
// size). `jednostka`:
//  - "lapka" / "klocek" (or any sticker name): units wait above the heads (`zapas` more than needed); the child drags
//    them down, each snaps to the end of the row along the thing and is counted (a blue digit, `onLicz(n)` for the
//    voice). With `przyciagaj: false` a unit stays where it is dropped: a gap or an overlap is marked in red, it shakes
//    and goes back (`onZle("przerwa" | "zachodzi")`). One more past the end sticks out, shakes, goes back
//    (`onZle("za_duzo")`). Resolves when the row reaches the end.
//  - "linijka": a painted blank ruler, its ticks and numbers drawn in pencil (`podzialka` units); the child drags it
//    under the thing - near the start it snaps with 0 on the line, else a red line shows the miss (`onZle("zero")`);
//    then (`odczytaj`) taps the number where the thing ends (a wrong one gets a pencil line up to the thing,
//    `onZle("odczyt")`).
//  - "odwaznik": the balance scale (mechaniki.js waga): the thing (`masa` kilograms) on the left pan, one-kilogram
//    weights to drag onto the right pan, each counted; one too many tips the beam the other way (`onZle("za_duzo")`);
//    resolves when level.
// Returns {kind, ile, jednostki, rzecz, remove} (+ ruler: {linijka}; scale: {waga, odwazniki}).
const JEDNOSTKI = { lapka: "lapka_miarka", klocek: "klocek_miarka", odwaznik: "odwaznik", linijka: "linijka" };
export async function miarka(S, o = {}) {
  if (o.jednostka === "odwaznik") return miarkaWaga(S, o);
  if (o.jednostka === "linijka") return miarkaLinijka(S, o);
  return miarkaJednostki(S, o);
}

// the measured thing, lying with its drawn left end on x0, its drawn middle at y, `dl` units of `u` long
async function polozRzecz(S, rzecz, { dl, u, x0, y }) {
  if (typeof rzecz !== "string") return rzecz;
  const a = alfa(await obrazNaklejki(rzecz)), fw = a.u1 - a.u0, size = dl * u / fw;
  const h = await S.object(rzecz, { x: x0 + (0.5 - a.u0) * size, y: y + ((a.v0 + a.v1) / 2 - 0.5) * size, size, plik: rzecz });
  h.zablokowany = true; return h;
}
const kreskaStartu = (S, x0, gora, dol) => S.line([[x0, gora], [x0, dol]], { color: "#2b2622", width: 0.07, duration: t(0.35), strong: true, name: "linia_startu" });

async function miarkaJednostki(S, { rzecz = "deska_dluga", dlugosc = 5, jednostka = "lapka", x0 = null, y = -1.5, zapas = 2, przyciagaj = true, cyfry = true, u = null, onZle = null, onLicz = null } = {}) {
  const { narysujCyfre } = await import("./liczby.js");
  const nazwa = JEDNOSTKI[jednostka] || jednostka;
  const aj = alfa(await obrazNaklejki(nazwa)), fw = aj.u1 - aj.u0, fh = aj.v1 - aj.v0;
  u = u ?? Math.min(1.1, 6.6 / dlugosc);
  const sizeJ = u / fw, hj = fh * sizeJ;
  x0 = x0 ?? -dlugosc * u / 2;
  const R = await polozRzecz(S, rzecz, { dl: dlugosc, u, x0, y });
  const bR = S.bounds(R);
  if (typeof rzecz !== "string") x0 = bR.left;
  const dl = (bR.right - bR.left) / u, potrzeba = Math.max(1, Math.round(dl));
  const yr = bR.bottom - 0.1 - hj / 2;                                      // the row of units under the thing
  const start = await kreskaStartu(S, x0, bR.top + 0.3, yr - hj / 2 - 0.15);
  // the units waiting above the heads
  const n = potrzeba + zapas, wRzedzie = Math.max(1, Math.floor(9.2 / (u + 0.2))), jedn = [];
  for (let i = 0; i < n; i++) {
    const rz = Math.floor(i / wRzedzie), ile = Math.min(wRzedzie, n - rz * wRzedzie), k = i % wRzedzie;
    const h = await S.object(nazwa, { x: (k - (ile - 1) / 2) * (u + 0.2), y: 2.2 - rz * (hj + 0.25), size: sizeJ, plik: nazwa });
    h.home = { x: h.mesh.position.x, y: h.mesh.position.y }; jedn.push(h);
  }
  const lezy = [], znaki = [], czerwone = [];
  // where a unit's mesh must stand so its drawn left edge is at x
  const naLewo = (h, x) => { const b = S.bounds(h); return x + (h.mesh.position.x - b.left); };
  const naRzad = (h) => { const b = S.bounds(h); return h.mesh.position.y + (yr - (b.top + b.bottom) / 2); };
  let mowa = Promise.resolve();
  const policz = async (h) => {
    lezy.push(h); h.zablokowany = true; S.sfx.graj("plop"); S.bump(h, 0.15, false);
    const k = lezy.length;
    if (cyfry) narysujCyfre(S, k, { x: x0 + (k - 0.5) * u, y: yr - hj / 2 - 0.34, size: Math.min(0.5, u * 0.6), color: "#1f5fbf", duration: t(0.3) }).then((c) => znaki.push(c));
    if (onLicz) mowa = mowa.then(() => onLicz(k)).catch(() => {});
  };
  const wpasuj = async (h) => { await h.moveTo(naLewo(h, x0 + lezy.length * u), naRzad(h), t(0.22)); await policz(h); };
  const zle = async (h, powod, odcinek) => {
    h.zajety = true;
    if (odcinek) czerwone.push(await S.line(odcinek, { color: "#d32f2f", width: 0.1, duration: t(0.25), strong: true }));
    await S.shake(h); onZle?.(powod);
    await S.wait(t(0.6));
    czerwone.splice(0).forEach((q) => q.remove());
    await h.moveTo(h.home.x, h.home.y, t(0.35)); h.zajety = false;
  };
  await new Promise((gotowe) => {
    let koniec = false;
    const sprawdz = async () => {
      if (koniec || lezy.length < potrzeba) return;
      koniec = true; S.endSort(); S.miarka = null; await mowa; S.sfx.graj("right"); gotowe();
    };
    S.free({ items: jedn.slice(), onTap: () => {}, onPuppet: () => S.onPuppetTap?.(), onDrop: async (h, p) => {
      if (h.zajety || lezy.includes(h)) return;
      const blisko = Math.abs(p.y - yr) < Math.max(1.3, hj * 1.5) && p.x > x0 - 1.2 && p.x < x0 + (potrzeba + 1.5) * u;
      if (!blisko) return h.moveTo(h.home.x, h.home.y, t(0.35));
      if (lezy.length >= potrzeba) {                                        // the row already reaches the end
        await h.moveTo(naLewo(h, x0 + lezy.length * u), naRzad(h), t(0.2));
        return zle(h, "za_duzo", [[x0 + potrzeba * u, yr - hj / 2 - 0.1], [x0 + potrzeba * u, bR.top + 0.1]]);
      }
      if (przyciagaj) { await wpasuj(h); return sprawdz(); }
      // where it was put: its left edge against the end of the row
      h.mesh.position.y = naRzad(h);
      const b = S.bounds(h), koniecRzedu = x0 + lezy.length * u, d = b.left - koniecRzedu;
      if (Math.abs(d) <= 0.22 * u) { await wpasuj(h); return sprawdz(); }
      const yy = yr - hj / 2 - 0.08;
      return zle(h, d > 0 ? "przerwa" : "zachodzi", [[Math.min(koniecRzedu, b.left), yy], [Math.max(koniecRzedu, b.left), yy]]);
    } });
    S.miarka = { dokoncz: async () => { for (const h of jedn) { if (lezy.length >= potrzeba) break; if (!lezy.includes(h) && !h.zajety) await wpasuj(h); } await sprawdz(); } };
  });
  return { kind: "miarka", ile: potrzeba, jednostki: lezy, rzecz: R, start,
    remove: () => { [R, start, ...jedn, ...znaki].forEach((q) => q?.remove?.()); } };
}

async function miarkaLinijka(S, { rzecz = "deska_dluga", dlugosc = 5, podzialka = null, x0 = null, y = -1.3, odczytaj = true, onZle = null } = {}) {
  const { narysujCyfre } = await import("./liczby.js");
  const N = podzialka ?? Math.max(10, dlugosc + 1);
  const u = Math.min(0.62, 6.4 / N);                                    // clear of the characters (x +-3.4)
  x0 = x0 ?? -N * u / 2;
  const R = await polozRzecz(S, rzecz, { dl: dlugosc, u, x0, y });
  const bR = S.bounds(R);
  if (typeof rzecz !== "string") x0 = bR.left;
  const dl = Math.round((bR.right - bR.left) / u);
  const al = alfa(await obrazNaklejki("linijka")), fw = al.u1 - al.u0, size = N * u / fw, hl = (al.v1 - al.v0) * size;
  const yr = bR.bottom - 0.12 - hl / 2;                                     // where the ruler lies when it is under the thing
  const start = await kreskaStartu(S, x0, bR.top + 0.3, yr - hl / 2 - 0.6);
  // the ruler waits above the heads, shifted, so the child brings it and puts 0 on the line
  const L = await S.object("linijka", { x: 0.4, y: 2.2, size, plik: "linijka" });
  await S.wait(0.45);                                                       // it has grown in: the pencil marks attach at full size
  const b = S.bounds(L), lewo = b.left, dolL = b.bottom;
  const kreski = [];
  for (let i = 0; i <= N; i++) {
    const x = lewo + i * u, dlug = i % 5 === 0 ? 0.55 : 0.36;
    kreski.push(S.line([[x, b.top - 0.02], [x, b.top - dlug * hl]], { color: "#3b2a1a", width: 0.035, duration: 0.05, halo: false, wait: false, strong: true }));
  }
  const cyf = [];
  for (let i = 0; i <= N; i++) cyf.push(narysujCyfre(S, i, { x: lewo + i * u, y: dolL - 0.26, size: Math.min(0.36, u * (i > 9 ? 0.45 : 0.6)), color: "#2b2622", duration: 0.05 }));
  const naLinijce = [...await Promise.all(kreski), ...(await Promise.all(cyf)).flatMap((c) => c.parts)];
  for (const k of naLinijce) { L.mesh.attach(k.mesh); const i = S.objects.indexOf(k); if (i >= 0) S.objects.splice(i, 1); }
  L.home = { x: L.mesh.position.x, y: L.mesh.position.y };
  const zero = () => S.bounds(L).left;
  const czerwone = [];
  await new Promise((gotowe) => {
    let koniec = false, zajety = false;
    const przyloz = async () => {
      koniec = true; S.endSort(); S.miarka = null;
      await L.moveTo(L.mesh.position.x + (x0 - zero()), L.mesh.position.y + (yr - S.bounds(L).y), t(0.25));
      S.sfx.graj("plop"); S.bump(L, 0.05, false); gotowe();
    };
    S.free({ items: [L], onTap: () => {}, onPuppet: () => S.onPuppetTap?.(), onDrop: async (h, p) => {
      if (zajety || koniec) return;
      const bb = S.bounds(L);
      if (Math.abs(bb.y - yr) > 1.4) return;                              // put down somewhere else: it stays there
      if (Math.abs(zero() - x0) < Math.max(0.45, u * 0.7)) return przyloz();
      zajety = true;                                                        // not from the start line: show the miss
      await L.moveTo(L.mesh.position.x, L.mesh.position.y + (yr - bb.y), t(0.15));
      czerwone.push(await S.line([[x0, yr + hl / 2 + 0.05], [zero(), yr + hl / 2 + 0.05]], { color: "#d32f2f", width: 0.1, duration: t(0.25), strong: true }));
      await S.shake(L); onZle?.("zero");
      await S.wait(t(0.8)); czerwone.splice(0).forEach((q) => q.remove()); zajety = false;
    } });
    S.miarka = { dokoncz: przyloz };
  });
  // reading: the number where the thing ends
  const liczby = [];
  if (odczytaj) {
    const yc = S.bounds(L).bottom - 0.26;
    for (let i = 0; i <= N; i++) liczby.push(cel(S, prostokat(Math.max(0.5, u * 0.95), 0.7, x0 + i * u, yc), { name: `linijka_${i}`, liczba: i, dobry: i === dl }));
    const ok = liczby[dl];
    await new Promise((gotowe) => {
      const pytaj = async () => {
        S.miarka = { dokoncz: () => S.clickOn(ok) };
        const hit = await S.choose(liczby);
        if (!hit) return gotowe();                                          // the scene was cleared
        if (hit === ok) {
          S.miarka = null; S.sfx.graj("right");
          czerwone.push(await S.line([[x0 + dl * u, bR.top], [x0 + dl * u, yc + 0.32]], { color: "#1f9d55", width: 0.08, duration: t(0.3), strong: true }));
          czerwone.push(await S.circle(ok, { margin: 0.05 }));
          return gotowe();
        }
        const zly = await S.line([[hit.mesh.position.x, yc + 0.32], [hit.mesh.position.x, bR.top]], { color: "#e8502e", width: 0.08, duration: t(0.3), strong: true });
        S.sfx.graj("wrong"); onZle?.("odczyt");
        await S.wait(t(0.9)); zly.remove(); pytaj();
      };
      pytaj();
    });
  }
  return { kind: "miarka", ile: dl, jednostki: [], rzecz: R, linijka: L, liczby, start,
    remove: () => { [R, L, start, ...liczby, ...czerwone].forEach((q) => q?.remove?.()); } };
}

async function miarkaWaga(S, { rzecz = "dynia", masa = 3, zapas = 2, wagi = null, x = 0, y = -1.25, rozmiar = 1.3, onZle = null, onLicz = null } = {}) {
  const M = await import("./mechaniki.js");
  const w = await M.waga(S, { x, y });
  const R = typeof rzecz === "string" ? await S.object(rzecz, { x: x - 2, y: 1.6, size: rozmiar }) : rzecz;
  R.masa = masa; await w.poloz(R, "lewa");
  const od = [];
  wagi = wagi || Array(masa + zapas).fill(1);                              // kilograms per weight; a 2 kg one is drawn bigger
  for (const [i, m] of wagi.entries()) {
    const h = await S.object("odwaznik", { x: (i - (wagi.length - 1) / 2) * 0.85, y: 2.3, size: 0.6 * Math.cbrt(m), plik: "odwaznik" });
    h.masa = m; h.home = { x: h.mesh.position.x, y: h.mesh.position.y }; od.push(h);
  }
  let mowa = Promise.resolve(), zaDuzo = false, ostatnio = 0;
  await new Promise((gotowe) => {
    let koniec = false;
    const skoncz = async () => { if (koniec) return; koniec = true; S.endSort(); S.miarka = null; await mowa; S.sfx.graj("right"); gotowe(); };
    w.przeciagaj({ rzeczy: od, gotowe: (st) => st.wynik() === "rowno", onPolozony: (h, st) => {
      const k = st.prawa.length;
      const kg = st.prawa.reduce((q, r) => q + r.masa, 0);                    // the voice counts kilograms on the pan
      if (k > ostatnio && st.prawa.includes(h) && onLicz) mowa = mowa.then(() => onLicz(kg)).catch(() => {});
      ostatnio = k;
      if (st.wynik() === "prawa") { if (!zaDuzo) { zaDuzo = true; S.sfx.graj("wrong"); onZle?.("za_duzo"); } } else zaDuzo = false;
    } }).then(skoncz);
    const naPrawej = () => w.stan.prawa.reduce((a, h) => a + h.masa, 0);
    S.miarka = { dokoncz: async () => { for (const h of w.stan.prawa.slice()) { await w.zdejmij(h); h.moveTo(h.home.x, h.home.y, t(0.3)); } for (const h of [...od].sort((a, b) => b.masa - a.masa)) { if (w.wynik() === "rowno") break; if (!w.stan.prawa.includes(h) && naPrawej() + h.masa <= masa) await w.poloz(h, "prawa"); } await skoncz(); } };
  });
  return { kind: "miarka", ile: masa, jednostki: w.stan.prawa.slice(), odwazniki: od, rzecz: R, waga: w,
    remove: () => { w.remove(); R.remove(); od.forEach((h) => h.remove()); } };
}

// ===================================================================== a picture bar chart (wykres)
// Columns stand on a pencil baseline, a kind's sticker under each (`rodzaje`), faint lines mark the levels and pencil
// numbers count them up the left side (`liczby`). The child drags each thing (`rzeczy`: handles with `.rodzaj`, or sticker
// names that line up above) onto the chart: it shrinks into the next cell of its kind's column with a pop; dropped on
// another kind's column it lands there, shakes and flies back (`onZle(h, rodzaj)`); `wlasna: true` lets any drop on the
// chart go to its own column (the youngest). `wypelnij: {kind: n}` builds columns by itself, cell by cell. Resolves when
// every thing is in; returns {kolumny: [{rodzaj, x, ile, rzeczy, cel}], kolumna(r), najwyzsza(), najnizsza(), remove} -
// a column's `cel` is a tap target for c.task ("which is the tallest?"), its `rzeczy` go to c.count.
export async function wykres(S, { rodzaje = null, rzeczy = [], wypelnij = null, wiersze = null, x = 0, y = -2.45, liczby = true, wlasna = false, rozmiar = 0.75, onZle = null, onDodana = null } = {}) {
  const { narysujCyfre } = await import("./liczby.js");
  const nazwy = rzeczy.map((r) => (typeof r === "string" ? r : r.rodzaj ?? r.name));
  rodzaje = rodzaje || [...new Set([...nazwy, ...Object.keys(wypelnij || {})])];
  const ile0 = Object.fromEntries(rodzaje.map((r) => [r, (wypelnij?.[r] || 0) + nazwy.filter((n) => n === r).length]));
  const max = wiersze ?? Math.max(3, ...Object.values(ile0));
  const c = Math.min(0.95, (1.55 - y) / max, 6.4 / (rodzaje.length * 1.3)), krok = c * 1.3;
  const xs = rodzaje.map((_, i) => x + (i - (rodzaje.length - 1) / 2) * krok);
  const lewo = xs[0] - krok / 2, prawo = xs[xs.length - 1] + krok / 2;
  const kreski = [];
  // the levels, the baseline, the numbers up the side
  for (let j = 1; j <= max; j++) kreski.push(S.line([[lewo, y + j * c], [prawo, y + j * c]], { color: "#8d8273", width: 0.025, duration: t(0.15), halo: false, wait: false }));
  kreski.push(S.line([[lewo - 0.1, y], [prawo + 0.1, y]], { color: "#2b2622", width: 0.08, duration: t(0.4), strong: true, wait: false }));
  for (let i = 0; i <= rodzaje.length; i++) kreski.push(S.line([[lewo + i * krok, y], [lewo + i * krok, y + max * c]], { color: "#8d8273", width: 0.025, duration: t(0.15), halo: false, wait: false }));
  if (liczby) for (let j = 1; j <= max; j++) kreski.push(narysujCyfre(S, j, { x: lewo - 0.32, y: y + (j - 0.5) * c, size: Math.min(0.45, c * 0.62), color: "#1f5fbf", duration: t(0.2) }));
  const kol = [];
  for (const [i, r] of rodzaje.entries()) {
    const naglowek = await S.object(r, { x: xs[i], y: y - c * 0.62, size: c * 1.05, plik: r });
    const k = { rodzaj: r, x: xs[i], rzeczy: [], naglowek, get ile() { return k.rzeczy.length; } };
    k.cel = cel(S, prostokat(krok * 0.96, max * c + c * 1.2, xs[i], y + (max * c - c * 1.2) / 2), {
      name: `kolumna_${r}`, rodzaj: r, kolumna: k, dobry: false, highlight: (on) => [naglowek, ...k.rzeczy].forEach((h) => h.highlight?.(on)) });
    kol.push(k);
  }
  const kolumna = (r) => kol.find((k) => k.rodzaj === r);
  const komorka = (k, j) => [k.x, y + (j + 0.5) * c];
  const wloz = async (h, k) => {
    h.zablokowany = true; k.rzeczy.push(h); h.wykres = k;
    const [cx, cy] = komorka(k, k.rzeczy.length - 1), b0 = h.base, b1 = c * 0.98;
    await Promise.all([h.moveTo(cx, cy, t(0.25)), S.tween(t(0.25), (s) => h.mesh.scale.setScalar(b0 + (b1 - b0) * s))]);
    h.base = b1; S.sfx.graj("pop", { tempo: 0.9 + 0.05 * k.rzeczy.length }); S.bump(h, 0.22, false);
    onDodana?.(h, k);
  };
  // columns given by number grow by themselves, cell by cell
  if (wypelnij) for (const k of kol) for (let j = 0; j < (wypelnij[k.rodzaj] || 0); j++) {
    const [cx, cy] = komorka(k, k.rzeczy.length);
    const h = await S.object(k.rodzaj, { x: cx, y: cy, size: c * 0.98, plik: k.rodzaj }); h.zablokowany = true; h.wykres = k; k.rzeczy.push(h);
    await S.wait(t(0.14));
  }
  await Promise.all(kreski);
  // the things to put in: names line up above the heads
  const lista = [];
  const zn = rzeczy.map((r, i) => [Math.random(), r, i]).sort((a, b) => a[0] - b[0]).map((q) => q[1]);
  const wRz = Math.max(1, Math.floor(10 / (rozmiar + 0.15)));
  for (const [i, r] of (typeof rzeczy[0] === "string" ? zn : rzeczy).entries()) {
    if (typeof r !== "string") { lista.push(r); continue; }
    const rz = Math.floor(i / wRz), n = Math.min(wRz, rzeczy.length - rz * wRz);
    const h = await S.object(r, { x: (i % wRz - (n - 1) / 2) * (rozmiar + 0.15), y: 2.35 - rz * (rozmiar + 0.12), size: rozmiar });
    h.rodzaj = r; lista.push(h);
  }
  for (const h of lista) { h.rodzaj ??= h.name; h.home = { x: h.mesh.position.x, y: h.mesh.position.y }; }
  const wynik = {
    kind: "wykres", kolumny: kol, kolumna, rzeczy: lista,
    najwyzsza: () => { const m = Math.max(...kol.map((k) => k.ile)); const t2 = kol.filter((k) => k.ile === m); return t2.length === 1 ? t2[0] : null; },
    najnizsza: () => { const m = Math.min(...kol.map((k) => k.ile)); const t2 = kol.filter((k) => k.ile === m); return t2.length === 1 ? t2[0] : null; },
    remove: async () => { (await Promise.all(kreski)).forEach((q) => q?.remove?.()); kol.forEach((k) => { k.naglowek.remove(); k.cel.remove(); k.rzeczy.forEach((h) => h.remove()); }); lista.forEach((h) => h.remove()); },
  };
  if (!lista.length) return wynik;
  await new Promise((gotowe) => {
    let koniec = false;
    const sprawdz = () => { if (!koniec && lista.every((h) => h.wykres)) { koniec = true; S.endSort(); S.wykres = null; S.sfx.graj("right"); gotowe(); } };
    S.free({ items: lista.slice(), onTap: () => {}, onPuppet: () => S.onPuppetTap?.(), onDrop: async (h, p) => {
      if (h.zajety || h.wykres) return;
      const naWykresie = p.x > lewo - 0.5 && p.x < prawo + 0.5 && p.y > y - c * 1.3 && p.y < y + max * c + 0.7;
      if (!naWykresie) return h.moveTo(h.home.x, h.home.y, t(0.35));
      const k = wlasna ? kolumna(h.rodzaj) : kol.reduce((a, q) => (Math.abs(q.x - p.x) < Math.abs(a.x - p.x) ? q : a));
      if (!k) return h.moveTo(h.home.x, h.home.y, t(0.35));
      if (k.rodzaj === h.rodzaj) { await wloz(h, k); return sprawdz(); }
      h.zajety = true;                                                      // another kind's column: it lands, shakes, flies back
      await h.moveTo(...komorka(k, k.rzeczy.length), t(0.2));
      await S.shake(h); onZle?.(h, k.rodzaj);
      await S.wait(t(0.4)); await h.moveTo(h.home.x, h.home.y, t(0.35)); h.zajety = false;
    } });
    S.wykres = { dokoncz: async () => { for (const h of lista) if (!h.wykres) await wloz(h, kolumna(h.rodzaj)); sprawdz(); } };
  });
  return wynik;
}

