// Bendable limbs: a piece drawn whole (hip to toes, shoulder to paw, tail base to tip)
// becomes a grid mesh trimmed to its alpha, deformed along a chain of joints.
//
// s (0 at the pivot, 1 at the tip) = geodesic distance inside the mesh from the proximal
// side of the pivot (the overlap hidden behind the torso), so it walks along the drawing
// (a curled tail, an L-shaped foot) and rises from 0 smoothly everywhere along that border -
// measuring from the pivot point instead tore the mesh where a hidden lobe met the limb. Each joint k sits at
// s_k; a vertex turns around the joint by w_k(s) * angle, w_k a smoothstep across a band
// of width `miekkosc` centred on s_k: wide = a soft, rubber-hose arc, narrow = a sharp,
// anatomical joint. Turning around the joint (not blending positions) keeps the limb's
// length, so a bent knee never collapses. Same measurement as tools/characters/stawy.py.

const CELL = 12;                       // reference px per grid cell
const obrazy = new WeakMap();          // image -> alpha
const bazy = new Map();                // piece geometry + field, shared by every puppet

function alfa(img) {
  let a = obrazy.get(img);
  if (!a) {
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
    a = { d: ctx.getImageData(0, 0, img.width, img.height).data, w: img.width, h: img.height };
    obrazy.set(img, a);
  }
  return a;
}

// 8-connected Dijkstra over the kept cells from the seed cells (the proximal side; else the cells nearest the pivot)
function geodezyjnie(keep, nx, ny, sx, sy, zrodlo) {
  const n = nx * ny, dist = new Float64Array(n).fill(Infinity);   // float64: the heap compares exact values
  let dmin = Infinity;
  for (let i = 0; i < n; i++) if (keep[i]) dmin = Math.min(dmin, Math.hypot(i % nx + 0.5 - sx, ((i / nx) | 0) + 0.5 - sy));
  const heap = [];
  const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  for (let i = 0; i < n; i++) if (keep[i] && (zrodlo(i) || Math.hypot(i % nx + 0.5 - sx, ((i / nx) | 0) + 0.5 - sy) <= dmin + 1)) { dist[i] = 0; push(0, i); }
  const kroki = [[-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1], [-1, -1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [1, 1, 1.414]];
  while (heap.length) {
    const [d, i] = pop();
    if (d > dist[i]) continue;
    const x = i % nx, y = (i / nx) | 0;
    for (const [dx, dy, c] of kroki) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= nx || yy >= ny) continue;
      const j = yy * nx + xx;
      if (keep[j] && d + c < dist[j]) { dist[j] = d + c; push(d + c, j); }
    }
  }
  return dist;
}

// grid, UVs, triangles and the s field of one piece (cached: the editor rebuilds puppets on every drag)
export function baza(img, bb, os, centrum, strona = "dol") {
  const klucz = [img.src, bb.x, bb.y, bb.w, bb.h, os[0], os[1], strona, Math.round(centrum[0]), Math.round(centrum[1])].join("|");
  if (bazy.has(klucz)) return bazy.get(klucz);
  const A = alfa(img), kx = A.w / bb.w, ky = A.h / bb.h;
  const nx = Math.ceil(bb.w / CELL), ny = Math.ceil(bb.h / CELL);
  const pelne = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let hit = 0;
    for (let a = 0; a < 4 && !hit; a++) for (let b = 0; b < 4 && !hit; b++) {
      const px = Math.min(A.w - 1, ((i * CELL + (a + 0.5) * CELL / 4) * kx) | 0), py = Math.min(A.h - 1, ((j * CELL + (b + 0.5) * CELL / 4) * ky) | 0);
      if (A.d[(py * A.w + px) * 4 + 3] > 20) hit = 1;
    }
    pelne[j * nx + i] = hit;
  }
  const keep = new Uint8Array(nx * ny);           // one cell of margin so the soft edge is never clipped
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let k = 0;
    for (let b = -1; b <= 1 && !k; b++) for (let a = -1; a <= 1 && !k; a++) { const x = i + a, y = j + b; if (x >= 0 && y >= 0 && x < nx && y < ny && pelne[y * nx + x]) k = 1; }
    keep[j * nx + i] = k;
  }
  const sx = (os[0] - bb.x) / CELL, sy = (os[1] - bb.y) / CELL, cx = (centrum[0] - bb.x) / CELL, cy = (centrum[1] - bb.y) / CELL;
  // the distal side: below the pivot (limbs) or beyond it as seen from the torso centre (tails)
  const dystalna = (i) => {
    const x = i % nx + 0.5, y = ((i / nx) | 0) + 0.5;
    return strona === "od_tulowia" ? (x - sx) * (sx - cx) + (y - sy) * (sy - cy) > 0 : y > sy;
  };
  const dist = geodezyjnie(keep, nx, ny, sx, sy, (i) => !dystalna(i));   // over the mesh itself: a thin gap (a tuft, a claw) must not split s across one triangle
  let tip = 0;
  for (let i = 0; i < nx * ny; i++) if (isFinite(dist[i])) tip = Math.max(tip, dist[i]);
  const s = new Float32Array(nx * ny).fill(-1);
  for (let i = 0; i < nx * ny; i++) if (isFinite(dist[i])) s[i] = Math.min(1, dist[i] / (tip || 1));
  // margin cells take the s of their nearest mask neighbour
  for (let i = 0; i < nx * ny; i++) if (keep[i] && s[i] < 0) {
    const x = i % nx, y = (i / nx) | 0; let best = 0, bd = Infinity;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const xx = x + a, yy = y + b; if (xx < 0 || yy < 0 || xx >= nx || yy >= ny) continue; const v = s[yy * nx + xx]; if (v >= 0 && Math.abs(a) + Math.abs(b) < bd) { bd = Math.abs(a) + Math.abs(b); best = v; } }
    s[i] = best;
  }
  // vertices at the corners of kept cells; a vertex's s = mean of its kept cells
  const idx = new Int32Array((nx + 1) * (ny + 1)).fill(-1), px = [], py = [], vs = [], vn = [];
  const vert = (i, j) => {
    const k = j * (nx + 1) + i;
    if (idx[k] < 0) { idx[k] = px.length; px.push(Math.min(bb.x + bb.w, bb.x + i * CELL)); py.push(Math.min(bb.y + bb.h, bb.y + j * CELL)); vs.push(0); vn.push(0); }
    return idx[k];
  };
  const komorki = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (keep[j * nx + i]) {
    const c = [vert(i, j), vert(i + 1, j), vert(i + 1, j + 1), vert(i, j + 1)], v = s[j * nx + i];
    for (const q of c) { vs[q] += v; vn[q]++; }
    komorki.push([v, c]);
  }
  komorki.sort((a, b) => b[0] - a[0]);            // distal cells first: where a bend folds over, the limb nearer the body stays on top
  const index = [];
  for (const [, [a, b, c, d]] of komorki) index.push(a, d, b, b, d, c);
  const B = { nx, ny, s, keep, bb, px: Float32Array.from(px), py: Float32Array.from(py), vs: Float32Array.from(vs.map((v, i) => v / vn[i])), index };
  bazy.set(klucz, B);
  return B;
}

// s at a point of the reference frame: the nearest kept cell
export function sW(B, x, y) {
  const i0 = Math.floor((x - B.bb.x) / CELL), j0 = Math.floor((y - B.bb.y) / CELL);
  let best = 0, bd = Infinity;
  for (let r = 0; r < 12 && bd === Infinity; r++)
    for (let j = j0 - r; j <= j0 + r; j++) for (let i = i0 - r; i <= i0 + r; i++) {
      if (i < 0 || j < 0 || i >= B.nx || j >= B.ny || !B.keep[j * B.nx + i] || B.s[j * B.nx + i] < 0) continue;
      const d = Math.hypot(i - i0, j - j0);
      if (d < bd) { bd = d; best = B.s[j * B.nx + i]; }
    }
  return best;
}

export function waga(s, sk, h) {
  const lo = sk - h / 2;
  const t = Math.max(0, Math.min(1, (s - lo) / h));
  return t * t * (3 - 2 * t);
}
// the band never reaches back over the pivot
export function pasmo(sk, miekkosc) { return Math.max(0.02, Math.min(miekkosc, 2 * (sk - 0.01))); }

// turn the rest positions around the joints, last joint first (forward kinematics)
export function deformuj(rest, out, wagi, stawy, katy) {
  const n = rest.length / 3, J = stawy.length;
  for (let v = 0; v < n; v++) {
    let x = rest[3 * v], y = rest[3 * v + 1];
    for (let k = J - 1; k >= 0; k--) {
      const f = katy[k] * wagi[k * n + v];
      if (!f) continue;
      const c = Math.cos(f), sn = Math.sin(f), dx = x - stawy[k].jx, dy = y - stawy[k].jy;
      x = stawy[k].jx + dx * c - dy * sn; y = stawy[k].jy + dx * sn + dy * c;
    }
    out[3 * v] = x; out[3 * v + 1] = y;
  }
}
// where a point at chain position s ends up (a joint marker in the editor)
export function punkt(x, y, s, stawy, katy) {
  for (let k = stawy.length - 1; k >= 0; k--) {
    const f = katy[k] * waga(s, stawy[k].sk, stawy[k].h);
    if (!f) continue;
    const c = Math.cos(f), sn = Math.sin(f), dx = x - stawy[k].jx, dy = y - stawy[k].jy;
    x = stawy[k].jx + dx * c - dy * sn; y = stawy[k].jy + dx * sn + dy * c;
  }
  return [x, y];
}
