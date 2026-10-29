// Geometry and order: drawn shapes (filled, pencil rim, white outline - die-cut like the stickers), their corners
// to count by touch, the tangram (seven pieces, a silhouette, a tap turns a piece by 45 degrees, a piece snaps into
// a matching place), positions relative to a thing (on, under, beside, behind, between) checked where the child
// drops, symmetry (half a sticker by a pencil axis, the mirrored half to add) and rows of slots (patterns,
// ordering). Every interaction is free dragging (scene.free): a short tap without moving is a tap.

import * as THREE from "three";
import { wstega, material as olowekMaterial } from "./olowek.js";
import { narysujCyfre } from "./liczby.js";
const SUFIT = 3.3;                                         // the content ceiling under the HUD (scene.js)

// ------------------------------------------------------------------ shapes
const KOLO = Array.from({ length: 48 }, (_, i) => [0.5 * Math.cos(i / 48 * 2 * Math.PI), 0.5 * Math.sin(i / 48 * 2 * Math.PI)]);
export const KSZTALTY = {
  kolo: { pts: KOLO, kolor: "#e8604c", rogi: 0 },
  kwadrat: { pts: [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]], kolor: "#3f8ce0", rogi: 4 },
  trojkat: { pts: [[-0.55, -0.45], [0.55, -0.45], [0, 0.5]], kolor: "#f5c341", rogi: 3 },
  prostokat: { pts: [[-0.8, -0.42], [0.8, -0.42], [0.8, 0.42], [-0.8, 0.42]], kolor: "#58bd68", rogi: 4 },
};
// tangram pieces in tangram units (the whole square has side 1), each centred on its centroid, rot 0:
// a right-angled isosceles triangle has its right angle at the origin and its legs along +x and +y
const tri = (a) => { const c = a / 3; return [[-c, -c], [a - c, -c], [-c, a - c]]; };
export const TANGRAM = {
  L: { pts: tri(Math.SQRT1_2), kolor: "#e8604c", sym: 360 },
  M: { pts: tri(0.5), kolor: "#f5c341", sym: 360 },
  S: { pts: tri(Math.SQRT1_2 / 2), kolor: "#9b6fd6", sym: 360 },
  Q: { pts: [[-0.1768, -0.1768], [0.1768, -0.1768], [0.1768, 0.1768], [-0.1768, 0.1768]], kolor: "#3f8ce0", sym: 90 },
  P: { pts: [[-0.125, -0.125], [0.375, -0.125], [0.125, 0.125], [-0.375, 0.125]], kolor: "#58bd68", sym: 180 },
};
// silhouettes: slots {t, x, y, rot} in tangram units, centred on the picture
export const UKLADANKI = {
  kwadrat: [{ t: "L", x: -0.1179, y: -0.1179, rot: 0 }, { t: "L", x: 0.1179, y: 0.1179, rot: 180 }],
  domek: [{ t: "Q", x: 0, y: -0.12, rot: 0 }, { t: "M", x: 0, y: 0.1747, rot: 225 }],
  ryba: [{ t: "Q", x: 0.12, y: 0, rot: 45 }, { t: "M", x: -0.3657, y: 0, rot: 135 }],
  lodka: [{ t: "P", x: 0, y: -0.16, rot: 0 }, { t: "M", x: -0.1333, y: 0.1317, rot: 0 }],
  // a cat sitting sideways: the big triangle as the body (right angle bottom right, the slope its back), the square turned
  // to a diamond as the head on the body's top corner, two small triangles as the ears on the diamond's upper edges
  kot: [{ t: "L", x: 0, y: -0.4929, rot: 90 }, { t: "Q", x: 0.2357, y: 0.2285, rot: 45 }, { t: "S", x: 0.069, y: 0.4785, rot: 135 }, { t: "S", x: 0.4024, y: 0.4785, rot: 315 }],
  duzy_kwadrat: [
    { t: "L", x: 0.0, y: -0.3333, rot: 225 }, { t: "L", x: -0.3333, y: 0.0, rot: 135 }, { t: "M", x: 0.3333, y: 0.3333, rot: 180 },
    { t: "Q", x: 0.25, y: 0.0, rot: 45 }, { t: "S", x: 0.0, y: 0.1667, rot: 45 }, { t: "S", x: 0.4167, y: -0.25, rot: 315 },
    { t: "P", x: -0.125, y: 0.375, rot: 0 },
  ],
};

const obroc = (pts, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]); };

// a clean white sticker rim: a ring of constant width d around a convex polygon, rounded at the corners (the polygon
// grown by a disc). The pencil ribbon used before wobbled and broke at the corners.
function obwodka(pts, d, color = "#ffffff", opacity = 1) {
  const pole = pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
  const P = pole >= 0 ? pts : pts.slice().reverse();                       // counter-clockwise
  const n = P.length, nor = P.map((p, i) => { const q = P[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1], l = Math.hypot(ex, ey) || 1; return [ey / l, -ex / l]; });
  const out = [];
  for (let i = 0; i < n; i++) {
    const a0 = Math.atan2(nor[(i - 1 + n) % n][1], nor[(i - 1 + n) % n][0]); let a1 = Math.atan2(nor[i][1], nor[i][0]);
    while (a1 < a0) a1 += 2 * Math.PI;
    const k = Math.max(1, Math.ceil((a1 - a0) / 0.2));
    for (let j = 0; j <= k; j++) { const t = a0 + ((a1 - a0) * j) / k; out.push(new THREE.Vector2(P[i][0] + d * Math.cos(t), P[i][1] + d * Math.sin(t))); }
  }
  const shp = new THREE.Shape(out);
  shp.holes.push(new THREE.Path(P.map(([x, y]) => new THREE.Vector2(x, y))));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shp, 1), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 10.5; m.frustumCulled = false;
  return m;
}
// a ribbon mesh along a closed polygon (the pencil rim, or its white outline under it)
function obrys(pts, width, color, seed, halo) {
  const zamk = [...pts, pts[0], pts[1]];
  const m = new THREE.Mesh(wstega(zamk, { grubosc: width, drzenie: 0.006, ziarno: seed }).g, olowekMaterial(color, 1, seed, 1));
  m.material.uniforms.postep.value = 1; m.material.uniforms.mocno.value = 1;
  m.renderOrder = halo ? 10.5 : 10.7; m.frustumCulled = false;
  return m;
}

// a filled shape handle (a sticker-like thing: draggable, a task target, zones take it)
export function ksztalt(S, kind, { x = 0, y = 1.2, size = 1.3, color = null, rot = 0, def = null, name = kind } = {}) {
  const d = def || KSZTALTY[kind];
  const pts = d.pts.map(([a, b]) => [a * size, b * size]);
  const shp = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)));
  const g = new THREE.Group(); g.position.set(x, y, 0.4);
  const inner = new THREE.Group(); inner.rotation.z = rot * Math.PI / 180; g.add(inner);
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(shp, 24), new THREE.MeshBasicMaterial({ color: color || d.kolor, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  fill.renderOrder = 10.6;
  const seed = Math.random() * 1000;
  const warstwy = [obwodka(pts, 0.13), fill, obrys(pts, 0.06, "#2b2622", seed, false)];
  inner.add(...warstwy);
  const handle = { mesh: g, inner, name, tag: kind, kind: "object", ksztalt: kind, base: 1, size0: 1, size, pts, rot, home: { x, y }, zone: null, pulse: false,
    remove: () => { S.scene.remove(g); const i = S.objects.indexOf(handle); if (i >= 0) S.objects.splice(i, 1); S.untarget(handle); if (handle.zone) handle.zone.take(handle, false); },
    highlight: (on) => { handle.pulse = on; if (!on) g.scale.setScalar(handle.base); },
    moveTo: (nx, ny, dd = 0.5) => { const x0 = g.position.x, y0 = g.position.y; return S.tween(dd, (s) => { g.position.x = x0 + (nx - x0) * s; g.position.y = y0 + (ny - y0) * s; }); },
    rotateTo: (deg, dd = 0.22) => { const r0 = handle.rot; handle.rot = deg; return S.tween(dd, (s) => { inner.rotation.z = (r0 + (deg - r0) * s) * Math.PI / 180; }); },
    // the whole shape (halo, fill, outline) above every other shape: overlapping pieces lie like paper, one on
    // another - with shared orders the lower piece's outline showed through the upper piece
    naWierzch: () => {
      const inne = S.objects.filter((o) => o !== handle && o.warstwa != null).sort((p, q) => p.warstwa - q.warstwa);
      if (inne.length && inne[inne.length - 1].warstwa > 60) inne.forEach((o, i) => o.ustawWarstwe(i));   // compact: stay under the puppets (20)
      handle.ustawWarstwe(inne.length ? inne[inne.length - 1].warstwa + 1 : 0);
    },
    ustawWarstwe: (j) => {
      handle.warstwa = j;
      warstwy.forEach((m, k) => { m.renderOrder = 10.5 + j * 0.03 + k * 0.01; m.userData.ro0 = m.renderOrder; });
    },
    // corners in world coordinates, as drawn now
    corners: () => { g.updateMatrixWorld(true); return obroc(pts, handle.rot).map(([a, b]) => new THREE.Vector3(a, b, 0).applyMatrix4(g.matrixWorld)); },
  };
  handle.naWierzch();
  S.scene.add(g); S.objects.push(handle); S.appear(handle);
  return handle;
}

// the corners of a shape as small dots to count by touch (each a handle: bounds, choose, remove)
export function rogi(S, h) {
  return h.corners().map((p, i) => {
    const g = new THREE.Group(); g.position.set(p.x, p.y, 0.7);
    const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.beginPath(); x.arc(32, 32, 30, 0, 7); x.fill(); x.fillStyle = "#1f5fbf"; x.beginPath(); x.arc(32, 32, 20, 0, 7); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.38), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }));
    m.renderOrder = 13; g.add(m);
    const cx = h.mesh.position.x, cy = h.mesh.position.y, dl = Math.hypot(p.x - cx, p.y - cy) || 1;
    const handle = { mesh: g, name: `rog_${i}`, kind: "object", base: 1, pulse: false, etykieta: { x: p.x + (p.x - cx) / dl * 0.5, y: p.y + (p.y - cy) / dl * 0.5 },
      remove: () => { S.scene.remove(g); const k = S.objects.indexOf(handle); if (k >= 0) S.objects.splice(k, 1); S.untarget(handle); },
      highlight: (on) => { handle.pulse = on; if (!on) g.scale.setScalar(1); },
      moveTo: () => Promise.resolve() };
    S.scene.add(g); S.objects.push(handle); S.appear(handle);
    return handle;
  });
}

// ------------------------------------------------------------------ the tangram
// shelf packing: each piece offers outlines (points around its origin, one per allowed turn, the preferred first) and
// takes the first that fits a row of the first region with room; rows are centred. Biggest first, so the small pieces
// fill what is left. Returns [{x, y, k}] - k = which outline was taken.
function rozloz(warianty, regiony, odstep = 0.3) {
  const box = (p) => { const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]); const b = { l: Math.min(...xs), r: Math.max(...xs), b: Math.min(...ys), t: Math.max(...ys) }; b.w = b.r - b.l; b.h = b.t - b.b; return b; };
  const kawalki = warianty.map((w, i) => ({ i, boxy: w.map(box) }));
  const stan = regiony.map((g) => ({ ...g, rzedy: [] }));
  const out = warianty.map(() => ({ x: 0, y: -2.4, k: 0 }));               // nothing fits: the old pile in the middle
  const wstaw = (g, b) => {
    let rz = g.rzedy.find((r) => r.szer + odstep + b.w <= g.x1 - g.x0 && b.h <= r.h);
    if (!rz) {
      if (b.w > g.x1 - g.x0) return null;
      const gora = g.rzedy.length ? g.rzedy[g.rzedy.length - 1].dol - odstep : g.y1;
      if (gora - b.h < g.y0) return null;
      rz = { gora, h: b.h, dol: gora - b.h, szer: -odstep, el: [] }; g.rzedy.push(rz);
    }
    return rz;
  };
  for (const kw of kawalki.sort((p, q) => q.boxy[0].w * q.boxy[0].h - p.boxy[0].w * p.boxy[0].h)) {
    let gotowe = false;
    for (const [k, b] of kw.boxy.entries()) {
      for (const g of stan) { const rz = wstaw(g, b); if (rz) { rz.el.push({ ...b, i: kw.i, k }); rz.szer += odstep + b.w; gotowe = true; break; } }
      if (gotowe) break;
    }
  }
  for (const g of stan) for (const rz of g.rzedy) {
    let x = (g.x0 + g.x1) / 2 - rz.szer / 2;
    for (const b of rz.el) { out[b.i] = { x: x - b.l, y: rz.gora - rz.h / 2 - (b.t + b.b) / 2, k: b.k }; x += b.w + odstep; }
  }
  return out;
}
const rownowazne = (a, b, sym) => (((a - b) % sym) + sym) % sym === 0;
// a silhouette at (x, y) in `scale` units per tangram unit, its pieces scattered below; resolves when every place is
// filled. `obroty`: the starting rotation of each piece (default: random multiples of 45 degrees)
export function tangram(S, nazwa, { x = 0, y = 1.0, scale = 3.2, rozsyp = null, obroty = null, kontur = true } = {}) {
  const sloty = UKLADANKI[nazwa].map((s, i) => ({ ...s, i, x: x + s.x * scale, y: y + s.y * scale, zajety: null }));
  // the silhouette: every place drawn as a faint pencil outline (a scaffold), filled grey
  const tlo = [], grupa = new THREE.Group(); S.scene.add(grupa);
  const zarys = { mesh: grupa, kind: "zarys", name: "zarys", base: 1, remove: () => { S.scene.remove(grupa); const i = S.objects.indexOf(zarys); if (i >= 0) S.objects.splice(i, 1); } };
  S.objects.push(zarys);                                   // clear() takes the silhouette away with everything else
  for (const s of sloty) {
    const pts = obroc(TANGRAM[s.t].pts.map(([a, b]) => [a * scale, b * scale]), s.rot);
    const shp = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shp), new THREE.MeshBasicMaterial({ color: "#4a423b", transparent: true, opacity: 0.42, depthWrite: false }));
    m.position.set(s.x, s.y, 0.3); m.renderOrder = 9; grupa.add(m); tlo.push(m);
    if (kontur) {                                          // white halo + dark pencil line: the faint grey alone vanished on light plates
      const o = obwodka(pts, 0.06, "#ffffff", 0.9); o.renderOrder = 9.1; o.position.set(s.x, s.y, 0.31); grupa.add(o); tlo.push(o);
      const d = obrys(pts, 0.04, "#3a332d", 3, false); d.renderOrder = 9.2; d.position.set(s.x, s.y, 0.32); grupa.add(d); tlo.push(d);
    }
  }
  // the pieces, packed without overlap on the floor between the characters, over their heads when the floor is full
  // every piece may take any turn; the preferred one (given, or random) first, the packer falls back to another that fits
  const pref = sloty.map((_, i) => (obroty ? obroty[i] : 45 * Math.floor(Math.random() * 8)));
  const kolej = pref.map((r0) => Array.from({ length: 8 }, (_, k) => (r0 + 45 * k) % 360));
  let miejsca = rozsyp, rots = pref;
  if (!miejsca) {
    let sb = Infinity, sl = Infinity, sr = -Infinity;
    for (const s of sloty) for (const [a, b] of obroc(TANGRAM[s.t].pts.map(([u, v]) => [u * scale, v * scale]), s.rot)) { sb = Math.min(sb, s.y + b); sl = Math.min(sl, s.x + a); sr = Math.max(sr, s.x + a); }
    const regiony = [{ x0: -3.7, x1: 3.7, y1: Math.min(-0.6, sb - 0.35), y0: -4.1 }, { x0: -5.9, x1: Math.min(-1.0, sl - 0.35), y1: SUFIT, y0: 0.7 }, { x0: Math.max(1.0, sr + 0.35), x1: 5.9, y1: SUFIT, y0: 0.7 }];
    const wynik = rozloz(sloty.map((s, i) => kolej[i].map((r) => obroc(TANGRAM[s.t].pts.map(([u, v]) => [u * scale, v * scale]), r))), regiony);
    miejsca = wynik.map((w) => [w.x, w.y]); rots = wynik.map((w, i) => kolej[i][w.k]);
  }
  const kawalki = sloty.map((s, i) => {
    const rot = rots[i];
    const h = ksztalt(S, s.t, { x: miejsca[i][0], y: miejsca[i][1], size: scale, def: TANGRAM[s.t], rot, name: `kawalek_${s.t}` });
    h.home = { x: miejsca[i][0], y: miejsca[i][1] };
    return h;
  });
  const sprzatnij = () => zarys.remove();
  return {
    kawalki, sloty, remove: () => { sprzatnij(); kawalki.forEach((k) => k.remove()); },
    wait: () => new Promise((resolve) => {
      const wolne = () => kawalki.filter((k) => !k.na);
      S.free({
        items: kawalki, tangram: sloty,
        onTap: (k) => { if (k.na) return; S.sfx.graj("tap"); k.naWierzch(); k.rotateTo(k.rot + 45); },
        onDrop: async (k, p) => {
          // the nearest free place of the same piece type
          let best = null, bd = Infinity;
          for (const s of sloty) if (!s.zajety && s.t === k.tag) { const dd = Math.hypot(s.x - p.x, s.y - p.y); if (dd < bd) { bd = dd; best = s; } }
          if (best && bd < 0.32 * scale) {
            if (rownowazne(k.rot, best.rot, TANGRAM[k.tag].sym)) {
              best.zajety = k; k.na = best; S.sfx.graj("plop");
              await k.moveTo(best.x, best.y, 0.18); k.rot = best.rot; k.inner.rotation.z = best.rot * Math.PI / 180;
              S.bump(k, 0.08, false);
              if (!wolne().length) { S.endSort(); S.sfx.graj("right"); resolve(true); }
              return;
            }
            S.shake(k); S.onObrot?.(k);                               // the right place, turned wrong: a hint to tap
            return;
          }
          // dropped elsewhere: it stays where it was put (free play), unless off the stage
          if (Math.abs(p.x) > 6 || p.y < -4.2 || p.y > 3.3) k.moveTo(k.home.x, k.home.y, 0.35);
        },
      });
    }),
  };
}

// ------------------------------------------------------------------ positions
export const RELACJE = ["na", "pod", "obok", "za", "miedzy"];
// which relation the item has to ref (and ref2 for "between") now
export function relacja(S, item, ref, ref2 = null) {
  const i = S.bounds(item), r = S.bounds(ref), cx = (i.left + i.right) / 2, cy = (i.top + i.bottom) / 2;
  const h = r.top - r.bottom, w = r.right - r.left;
  if (ref2) {
    const r2 = S.bounds(ref2), a = Math.min(r.right, r2.right), b = Math.max(r.left, r2.left);
    const lo = Math.min((r.left + r.right) / 2, (r2.left + r2.right) / 2), hi = Math.max((r.left + r.right) / 2, (r2.left + r2.right) / 2);
    if (cx > lo && cx < hi && !(cx > r.left && cx < r.right) && !(cx > r2.left && cx < r2.right) && Math.abs(cy - (r.y + r2.y) / 2) < Math.max(h, 1.2)) return "miedzy";
    void a; void b;
  }
  const wPionie = cx > r.left + 0.1 * w && cx < r.right - 0.1 * w;
  if (wPionie && cy > r.bottom + 0.25 * h && cy < r.top - 0.25 * h) return "za";
  if (wPionie && cy >= r.top - 0.25 * h && i.bottom > r.top - 0.4 * h && cy < r.top + 2.0) return "na";
  if (wPionie && cy <= r.bottom + 0.25 * h && cy > r.bottom - 2.0) return "pod";
  if (Math.abs(cy - r.y) < 0.75 * h && ((cx < r.left && cx > r.left - 1.8) || (cx > r.right && cx < r.right + 1.8))) return "obok";
  return null;
}
// where a thing goes for a relation (used to settle it after a right drop, and by tests)
export function pozycja(S, rel, item, ref, ref2 = null) {
  const i = S.bounds(item), r = S.bounds(ref), ih = i.top - i.bottom, iw = i.right - i.left, ox = item.mesh.position.x - (i.left + i.right) / 2, oy = item.mesh.position.y - (i.top + i.bottom) / 2;
  const rx = (r.left + r.right) / 2;
  if (rel === "na") return { x: rx + ox, y: r.top + ih / 2 - 0.05 * ih + oy };
  if (rel === "pod") return { x: rx + ox, y: r.bottom + ih / 2 + oy };
  if (rel === "za") return { x: rx + 0.22 * (r.right - r.left) + ox, y: r.top - 0.3 * ih + oy };   // peeking out over the top
  if (rel === "w") return { x: rx + ox, y: (r.top + r.bottom) / 2 + oy };
  if (rel === "przed") return { x: rx + ox, y: r.bottom + ih / 2 - 0.25 * ih + oy };   // lower, covering its foot
  if (rel === "obok") return { x: r.right + iw / 2 + 0.15 + ox, y: r.bottom + ih / 2 + oy };
  if (rel === "miedzy") { const r2 = S.bounds(ref2); return { x: ((r.left + r.right) / 2 + (r2.left + r2.right) / 2) / 2 + ox, y: Math.min(r.bottom, r2.bottom) + ih / 2 + oy }; }
  return { x: item.home.x, y: item.home.y };
}
// put a thing behind another (drawn under it, so it peeks out)
export function zaRzecza(item, ref) { przesunKolejnosc(item, ref, -1); item.mesh.position.z = ref.mesh.position.z - 0.05; }
// in front of a thing (or back to the sticker layer without one); a shape's halo, fill and outline keep their order
export function przedRzecza(item, ref = null) { przesunKolejnosc(item, ref, 1); item.mesh.position.z = 0.4; }
function przesunKolejnosc(item, ref, strona) {
  const zakres = (h, wlasny = false) => { let lo = Infinity, hi = -Infinity; h.mesh.traverse((o) => { if (o.isMesh) { const r = wlasny ? o.userData.ro0 : o.renderOrder; lo = Math.min(lo, r); hi = Math.max(hi, r); } }); return [lo, hi]; };
  item.mesh.traverse((o) => { if (o.isMesh && o.userData.ro0 === undefined) o.userData.ro0 = o.renderOrder; });
  const [lo, hi] = zakres(item, true);
  const d = !ref ? 0 : strona > 0 ? Math.max(0, zakres(ref)[1] + 0.1 - lo) : Math.min(0, zakres(ref)[0] - 0.1 - hi);
  item.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = o.userData.ro0 + d; });
}
// the child drags `item` so it is `want` relative to ref (and ref2); a wrong drop shakes it home with `onWrong`
export function umiesc(S, { item, ref, ref2 = null, want, onWrong = null }) {
  return new Promise((resolve) => {
    S.free({
      items: [item], place: { ref, ref2, want },
      onTap: () => {},
      onDrop: async (k) => {
        let rel = relacja(S, k, ref, ref2);
        if (want === "w" && rel === "za") rel = "w";                     // "inside": the same spot as behind, but in front
        if (want === "przed" && (rel === "za" || rel === "pod")) rel = "przed";   // "in front of": dropped on it, drawn over its lower part
        if (rel === want) {
          const p = pozycja(S, want, k, ref, ref2);
          if (want === "za") zaRzecza(k, ref); else przedRzecza(k, ref);
          await k.moveTo(p.x, p.y, 0.25); S.sfx.graj("right"); S.endSort(); resolve(rel);
          return;
        }
        S.shake(k); await k.moveTo(k.home.x, k.home.y, 0.4); przedRzecza(k);
        if (onWrong) onWrong(rel);
      },
    });
  });
}

// ------------------------------------------------------------------ symmetry
// half a sticker: `strona` "lewa" | "prawa" of the picture, its cut edge at x; `lustro` mirrors it
export async function polowka(S, name, { x = 0, y = 1.0, size = 2.0, strona = "lewa", lustro = false, tex = null } = {}) {
  const t = tex || (await new Promise((ok) => new THREE.TextureLoader().load(`/game/assets/objects/${name}.webp?t=${window.__T || Date.now()}`, (tt) => { tt.colorSpace = THREE.SRGBColorSpace; ok(tt); })));
  const geo = new THREE.PlaneGeometry(0.5, 1);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, (strona === "lewa" ? 0 : 0.5) + uv.getX(i) * 0.5);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 10;
  // the cut edge sits at the group's origin: a left half extends to the left, a mirrored left half to the right
  const naPrawo = (strona === "prawa") !== lustro;
  m.position.x = naPrawo ? 0.25 : -0.25;
  if (lustro) m.scale.x = -1;
  const g = new THREE.Group(); g.position.set(x, y, 0.4); g.scale.setScalar(size); g.add(m);
  const handle = { mesh: g, name, tag: `${name}_${strona}_${lustro ? "l" : "n"}`, kind: "object", base: size, size0: size, home: { x, y }, zone: null, pulse: false, tex: t,
    naPrawo,
    remove: () => { S.scene.remove(g); const i = S.objects.indexOf(handle); if (i >= 0) S.objects.splice(i, 1); S.untarget(handle); },
    highlight: (on) => { handle.pulse = on; if (!on) g.scale.setScalar(handle.base); },
    moveTo: (nx, ny, dd = 0.5) => { const x0 = g.position.x, y0 = g.position.y; return S.tween(dd, (s) => { g.position.x = x0 + (nx - x0) * s; g.position.y = y0 + (ny - y0) * s; }); } };
  S.scene.add(g); S.objects.push(handle); S.appear(handle);
  return handle;
}
// the symmetry task: the left half of `name` stands at the pencil axis x; three candidates lie below - the right one
// is that half mirrored. Resolves when the child brings it to the axis.
export async function symetria(S, name, { x = 0, y = 0.9, size = 2.2, inne = "jablko", onWrong = null } = {}) {
  const os = await S.line([[x, y - size * 0.62], [x, y + size * 0.62]], { width: 0.05, color: "#1f5fbf", duration: 0.5, name: "os" });
  const lewa = await polowka(S, name, { x, y, size, strona: "lewa" });
  const kandydaci = [
    await polowka(S, name, { size: size * 0.85, strona: "lewa", lustro: true, tex: lewa.tex }),     // the mirror: right
    await polowka(S, name, { size: size * 0.85, strona: "lewa", lustro: false, tex: lewa.tex }),    // the same half, not mirrored
    await polowka(S, inne, { size: size * 0.85, strona: "lewa", lustro: true }),                     // another thing
  ];
  kandydaci[0].ok = true;
  const kolej = kandydaci.slice().sort(() => Math.random() - 0.5);
  kolej.forEach((k, i) => { const px = -2.6 + i * 2.6; k.mesh.position.set(px, -2.2, 0.4); k.home = { x: px, y: -2.2 }; });
  return {
    lewa, os, kandydaci, remove: () => { os.remove(); lewa.remove(); kandydaci.forEach((k) => k.remove()); },
    wait: () => new Promise((resolve) => {
      S.free({
        items: kandydaci, sym: { x, y },
        onTap: () => {},
        onDrop: async (k, p) => {
          const blisko = Math.abs(p.x - (x + size * 0.18)) < size * 0.5 && Math.abs(p.y - y) < size * 0.55;
          if (blisko && k.ok) {
            k.base = size; await Promise.all([k.moveTo(x, y, 0.25), S.tween(0.25, (s) => k.mesh.scale.setScalar(size * 0.85 + size * 0.15 * s))]);
            S.sfx.graj("right"); S.endSort(); resolve(k); return;
          }
          if (blisko) { S.shake(k); if (onWrong) onWrong(k); }
          k.moveTo(k.home.x, k.home.y, 0.4);
        },
      });
    }),
  };
}

// ------------------------------------------------------------------ rows of slots (patterns, ordering)
// slots: [{x, y, w, h, accept(item) -> bool, nr?}] drawn as dashed places; the child drags items in; a wrong one
// shakes home with onWrong. Resolves when every slot is filled.
export async function sloty(S, { items, slots, onWrong = null, numery = false, numeryNad = false }) {
  const strefy = [];
  for (const [i, s] of slots.entries()) {
    // a slot may say its shape (`ksztalt`, `size`, `rot`): its place is drawn as that shape's outline
    const obrys = s.ksztalt ? obroc(KSZTALTY[s.ksztalt].pts.map(([a, b]) => [a * s.size, b * s.size]), s.rot || 0) : null;
    const z = await S.zone({ x: s.x, y: s.y, w: s.w + (obrys ? 0.3 : 0), h: s.h + (obrys ? 0.3 : 0), name: `slot_${i}`, obrys, niewidoczna: !!s.niewidoczna, rodzaj: s.rodzaj });
    z.accept = s.accept; z.i = i; strefy.push(z);
    if (numery) z.nr = await narysujCyfre(S, i + 1, { x: s.x, y: numeryNad ? Math.min(SUFIT - 0.3, s.y + s.h / 2 + 0.42) : s.y - s.h / 2 - 0.42, size: 0.55, color: "#1f5fbf", duration: 0.15 });
  }
  for (const it of items) it.home = { x: it.mesh.position.x, y: it.mesh.position.y };
  const wynik = new Promise((resolve) => {
    S.free({
      items, slots: strefy,
      onTap: () => {},
      onDrop: async (k, p) => {
        if (k.slot) { k.slot.zajety = null; k.slot = null; }
        const z = strefy.find((s) => !s.zajety && Math.abs(p.x - s.x) < s.w / 2 + 0.2 && Math.abs(p.y - s.y) < s.h / 2 + 0.2);
        if (z && z.accept(k)) {
          z.zajety = k; k.slot = z; S.sfx.graj("plop");
          if (z.niewidoczna) { z.items = [k]; z.layout(); await S.wait(0.2); }       // a painted place: it stands, hangs or lies there
          else { await k.moveTo(z.x, z.y, 0.18); S.bump(z, 0.05, false); }
          if (strefy.every((s) => s.zajety)) { S.endSort(); S.sfx.graj("right"); resolve(true); }
          return;
        }
        if (z) { S.shake(k); if (onWrong) onWrong(k, z); }
        k.moveTo(k.home.x, k.home.y, 0.4);
      },
    });
  });
  return { strefy, wait: () => wynik, remove: () => strefy.forEach((z) => { z.remove(); z.nr?.remove(); }) };
}
