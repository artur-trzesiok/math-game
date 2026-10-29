// Mechanics, fifth set (point 5 of the worlds plan, docs/mechaniki_na_zapas.md rows 1-3): a grid with row and column
// headers, sorting by a rule nobody says, giving things out to characters. The child acts with a finger; a wrong move
// shows its consequence and calls `onZle` - the lesson speaks, the mechanic never does.

import * as THREE from "three";
import { texture, GROUND, SUFIT } from "./scene.js";

const FAST = new URLSearchParams(location.search).has("szybko");
const t = (s) => (FAST ? Math.min(s, 0.08) : s);
const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
// a mesh of the mechanic's own, known to the stage so a cleared or skipped scene takes it away
function rejestruj(S, mesh, extra = {}) {
  const h = { mesh, kind: "mechanika", base: 1, pulse: false, ...extra,
    remove: () => { mesh.parent?.remove(mesh); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); S.untarget(h); },
    highlight: () => {} };
  S.scene.add(mesh); S.objects.push(h); return h;
}
const naRenderOrder = (h, ro) => h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = ro; });
// things given as sticker names or {name, ...fields} become stickers; handles stay as they are
async function naklejki(S, rzeczy, { y, size, x0 = -3.5, x1 = 3.5 }) {
  const n = rzeczy.length; if (!n) return [];
  const naRzad = Math.max(1, Math.floor((x1 - x0) / (size * 1.15))), rzedy = Math.ceil(n / naRzad);
  const out = [];
  for (const [i, r] of rzeczy.entries()) {
    if (r && r.mesh) { out.push(r); continue; }
    const spec = typeof r === "string" ? { name: r } : r;
    const rz = Math.floor(i / naRzad), wRz = Math.min(naRzad, n - rz * naRzad), j = i - rz * naRzad;
    const x = (j - (wRz - 1) / 2) * size * 1.15 + (x0 + x1) / 2, yy = y + (rzedy - 1 - rz) * size * 1.15;
    const h = await S.object(spec.name, { x, y: yy, size, plik: spec.plik });
    for (const [k, v] of Object.entries(spec)) if (!(k in h) || k === "name") h[k] = v;
    out.push(h);
  }
  for (const h of out) h.home = { x: h.mesh.position.x, y: h.mesh.position.y };
  return out;
}
const skaluj = (S, h, s1, d = 0.2) => { const s0 = h.mesh.scale.x; h.base = s1; return S.tween(t(d), (s) => h.mesh.scale.setScalar(s0 + (s1 - s0) * s)); };
// a hop back home in an arc: a thing refused by a container jumps out of it
const odskocz = (S, h, d = 0.45) => {
  const a = h.mesh.position.clone(), b = h.home;
  return S.tween(t(d), (s) => { h.mesh.position.x = a.x + (b.x - a.x) * s; h.mesh.position.y = a.y + (b.y - a.y) * s + Math.sin(s * Math.PI) * 1.0; });
};

// ===================================================================== a grid with headers (siatka)
// Rows and columns, each with a header (an icon sticker, e.g. a colour bead and a leaf), on a paper card drawn with
// pencil lines or on a painted bookcase / board (game/assets/siatki/<name>, tools/siatki/make_siatka.py). The child
// drags things into cells: a cell takes only what fits its row AND its column (a thing's `wiersz` / `kolumna`: an index
// or a header's key); a wrong one goes in, shakes, and the header that does not fit shakes with it, then it goes home;
// after `podpowiedz` misses with one thing its row and column light up where they meet. `sudoku`: a cell takes a thing
// its row and column do not have yet (the same picture in the row shakes); `rozwiazanie` [[name]] fixes the answer.
// A header place may be empty ({klucz, puste: true}): then a thing with that `klucz` goes there (labels for shelves).
// Cells may hold given content: a sticker name or {cyfra: n} (a calendar). Without `rzeczy` it only lays out: the cells
// (`s.komorka(r, c)`, `s.cele`) and headers are targets for c.task - reading a cell. `s.pokaz(r, c)` lights a row and a
// column up to their meeting cell. Tests: S.siatka.dokoncz().
export async function siatka(S, { wiersze = [], kolumny = [], komorki = null, rzeczy = [], pasuje = null, sudoku = false, rozwiazanie = null,
  pojemnosc = 1, plansza = null, x = 0, y = null, kom = null, rzeczyY = null, rzeczySize = null, podpowiedz = 2, onZle = null, onDobrze = null } = {}) {
  const meta = plansza ? await fetch(`/game/assets/siatki/${plansza}/meta.json`, { cache: "no-store" }).then((r) => r.json()) : null;
  const R = Math.max(wiersze.length, komorki?.length || 0, rozwiazanie?.length || 0, meta?.wiersze || 0, 1);
  const C = Math.max(kolumny.length, komorki?.[0]?.length || 0, rozwiazanie?.[0]?.length || 0, meta?.kolumny || 0, 1);
  const naglW = wiersze.some(Boolean), naglK = kolumny.some(Boolean);
  // room: under the phase icons, over the loose things on the floor (one or two rows of them)
  const nR = rzeczy.length, size0 = rzeczySize ?? Math.min(1.0, Math.max(0.7, 7.0 / Math.max(1, nR) / 1.15));
  const rzedyRz = nR ? Math.ceil(nR / Math.max(1, Math.floor(7.0 / (size0 * 1.15)))) : 0;
  // a painted bookcase stands on the ground with the things over it; a paper card floats with the things on the floor
  const nadRzeczami = (rzedyRz - 1) * size0 * 1.15 + size0 / 2;
  const rY = rzeczyY ?? (meta ? SUFIT - 0.12 - nadRzeczami : GROUND + 0.6 + size0 / 2);
  const gora = meta && nR ? rY - size0 / 2 - 0.3 : SUFIT - 0.12, dol = meta ? GROUND + 0.15 : nR ? rY + nadRzeczami + 0.3 : GROUND + 0.4;
  let k, W, H, cx, cy, obraz = null;                                  // header lane = k wide; cells W x H; the block's centre
  if (meta) {
    const ar = meta.wysokosc / meta.szerokosc, lane = naglW || naglK ? 0.95 : 0;
    H = Math.min(gora - dol - (naglK ? lane : 0), (7.6 - (naglW ? lane : 0)) * ar); W = H / ar; k = lane;
  } else {
    k = kom ?? Math.min(1.5, (gora - dol) / (R + (naglK ? 1 : 0)), 6.8 / (C + (naglW ? 1 : 0)));
    W = C * k; H = R * k;
  }
  const blokW = W + (naglW ? k : 0), blokH = H + (naglK ? k : 0);
  cy = y ?? (meta ? dol + blokH / 2 : (gora + dol) / 2); cx = x;
  const lewo = cx - blokW / 2 + (naglW ? k : 0), gor = cy + blokH / 2 - (naglK ? k : 0);   // the cells' top-left corner
  const czesci = [];                                                   // everything drawn, for remove()
  // the cells' rectangles (world): a regular grid on the card, measured boxes on a painting
  const pole = (r, c) => {
    if (meta) { const [fx, fy, fw, fh] = meta.komorki[r][c]; return { x: lewo + (fx + fw / 2) * W, y: gor - (fy + fh / 2) * H, w: fw * W, h: fh * H }; }
    return { x: lewo + (c + 0.5) * k, y: gor - (r + 0.5) * k, w: k, h: k };
  };
  const kk = meta ? Math.min(...meta.komorki.flat().map(([, , fw, fh]) => Math.min(fw * W, fh * H))) : k;   // a cell's side
  if (meta) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ map: await texture(`/game/assets/siatki/${plansza}/obraz.webp`) }));
    g.position.set(lewo + W / 2, gor - H / 2, 0.3); g.renderOrder = 8; obraz = g;
    czesci.push(rejestruj(S, g, { kind: "plansza" }));
  } else {
    // the paper card under the grid, its shadow, and the pencil lines (a table drawn by hand)
    const grp = new THREE.Group(); grp.position.set(cx, cy, 0.3);
    const cien = new THREE.Mesh(new THREE.PlaneGeometry(blokW + 0.3, blokH + 0.3), mat({ color: "#000000", opacity: 0.22 })); cien.position.set(0.1, -0.12, -0.01); cien.renderOrder = 7.8;
    const papier = new THREE.Mesh(new THREE.PlaneGeometry(blokW + 0.3, blokH + 0.3), mat({ color: "#fbf6ea" })); papier.renderOrder = 7.9;
    grp.add(cien, papier);
    // the header lanes a shade darker: the icons there are the table's "names", not things to move
    if (naglK) { const p = new THREE.Mesh(new THREE.PlaneGeometry(W, k), mat({ color: "#efe3c8" })); p.position.set(lewo + W / 2 - cx, gor + k / 2 - cy, 0.002); p.renderOrder = 7.95; grp.add(p); }
    if (naglW) { const p = new THREE.Mesh(new THREE.PlaneGeometry(k, H), mat({ color: "#efe3c8" })); p.position.set(lewo - k / 2 - cx, gor - H / 2 - cy, 0.002); p.renderOrder = 7.95; grp.add(p); }
    czesci.push(rejestruj(S, grp, { kind: "karta" }));
    S.sfx.graj("whoosh", { glosnosc: 0.6 });
    const L0 = lewo - (naglW ? k : 0), T0 = gor + (naglK ? k : 0), linie = [];
    for (let r = 0; r <= R; r++) linie.push([[L0, gor - r * k], [lewo + W, gor - r * k]]);
    for (let c = 0; c <= C; c++) linie.push([[lewo + c * k, T0], [lewo + c * k, gor - H]]);
    if (naglK) linie.push([[lewo, T0], [lewo + W, T0]]);
    if (naglW) linie.push([[L0, gor], [L0, gor - H]]);
    czesci.push(...await Promise.all(linie.map((l) => S.line(l, { color: "#5b5047", width: 0.05, duration: t(0.3), warstwa: 9.5, halo: false }))));
  }
  // the highlights: a soft yellow band per row and column (pokaz), and each cell's own glow
  const pasek = (x0, y0, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat({ color: "#ffd84a", opacity: 0 })); m.position.set(x0, y0, 0.32); m.renderOrder = 9.2; czesci.push(rejestruj(S, m, { kind: "pasek" })); return m; };
  const pasyW = [...Array(R).keys()].map((r) => { const p = pole(r, 0), q = pole(r, C - 1), l = Math.min(p.x - p.w / 2, cx - blokW / 2), rr = q.x + q.w / 2; return pasek((l + rr) / 2, p.y, rr - l, p.h); });
  const pasyK = [...Array(C).keys()].map((c) => { const p = pole(0, c), q = pole(R - 1, c), g0 = Math.max(p.y + p.h / 2, cy + blokH / 2), d0 = q.y - q.h / 2; return pasek(p.x, (g0 + d0) / 2, p.w, g0 - d0); });
  // the cells: invisible targets that glow when highlighted
  const cele = [], komorkiH = [];
  for (let r = 0; r < R; r++) {
    komorkiH.push([]);
    for (let c = 0; c < C; c++) {
      const p = pole(r, c), g = new THREE.Group(); g.position.set(p.x, p.y, 0.33);
      const traf = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), mat({ opacity: 0 }));
      const blask = new THREE.Mesh(new THREE.PlaneGeometry(p.w * 0.94, p.h * 0.94), mat({ color: "#ffe066", opacity: 0 })); blask.renderOrder = 9.3;
      g.add(traf, blask);
      const h = rejestruj(S, g, { kind: "komorka", name: `komorka_${r}_${c}`, r, c, ...p, rzeczy: [], dobry: false });
      h.highlight = (on) => { h.pulse = on; blask.material.color.set("#ffe066"); blask.material.opacity = on ? 0.45 : 0; if (!on) g.scale.setScalar(1); };
      h.zle = () => { blask.material.color.set("#e8502e"); return S.tween(t(0.7), (q) => { blask.material.opacity = 0.45 * Math.sin(q * Math.PI); }); };   // this cell says no
      komorkiH[r].push(h); cele.push(h);
    }
  }
  const komorka = (r, c) => komorkiH[r]?.[c];
  // the headers: icon stickers in their lanes (or an empty place for a label to be put)
  const naglowki = { w: [], k: [] };
  const klucz = (hd, i) => (hd == null ? i : typeof hd === "string" ? hd : hd.klucz ?? hd.obraz ?? hd.name ?? i);
  const miejsceNagl = (r, c) => {
    if (r < 0) { const p = pole(0, c); return { x: p.x, y: meta ? gor + k / 2 : gor + k / 2, w: meta ? p.w : k, h: k }; }
    const p = pole(r, 0); return { x: lewo - k / 2, y: p.y, w: k, h: meta ? p.h : k };
  };
  for (const [lista, gdzie] of [[wiersze, "w"], [kolumny, "k"]]) {
    for (const [i, n] of lista.entries()) {
      const m = gdzie === "w" ? miejsceNagl(i, -1) : miejsceNagl(-1, i);
      const nazwa = typeof n === "string" ? n : n?.puste ? null : n?.obraz ?? n?.name;
      let h = null;
      if (nazwa) { h = await S.object(nazwa, { x: m.x, y: m.y, size: Math.min(m.w, m.h) * 0.8 }); h.naglowek = true; h.klucz = klucz(n, i); }
      const miejsce = { ...m, r: gdzie === "w" ? i : -1, c: gdzie === "k" ? i : -1, rzeczy: h ? [h] : [], puste: !h && !!n, klucz: klucz(n, i), ikona: h };
      if (miejsce.puste) {                                             // a place for a label: a dashed pencil frame
        const s = Math.min(m.w, m.h) * 0.4, ramka = [[m.x - s, m.y - s], [m.x + s, m.y - s], [m.x + s, m.y + s], [m.x - s, m.y + s], [m.x - s, m.y - s]];
        czesci.push(await S.line(ramka, { color: "#a0907c", width: 0.04, duration: t(0.2), warstwa: 9.5, halo: false }));
      }
      naglowki[gdzie].push(miejsce);
    }
  }
  // given content: a sticker or a pencil number in a cell
  const wCelu = (h, kom, i = 0, n = 1) => {                           // where a thing sits in a cell (n things share it)
    const kol = Math.ceil(Math.sqrt(n)), rz = Math.ceil(n / kol), s = Math.min(kom.w / kol, kom.h / rz) * (n > 1 ? 0.86 : 0.8);
    const px = kom.x + ((i % kol) - (kol - 1) / 2) * kom.w / kol, py = kom.y + ((rz - 1) / 2 - Math.floor(i / kol)) * kom.h / rz;
    return { x: px, y: meta && n === 1 ? kom.y - kom.h / 2 + s * 0.5 : py, s };   // on a painted shelf it stands on the board
  };
  const cyfry = [];                                                   // a calendar's numbers are written all at once
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const v = komorki?.[r]?.[c]; if (v == null) continue;
    const kom = komorka(r, c);
    if (typeof v === "object" && v.cyfra != null) {
      const { narysujCyfre } = await import("./liczby.js");
      kom.cyfra = v.cyfra;
      cyfry.push(narysujCyfre(S, v.cyfra, { x: kom.x, y: kom.y, size: Math.min(0.9, kk * (String(v.cyfra).length > 1 ? 0.4 : 0.5)), color: v.kolor || "#2b2622", duration: t(0.12), warstwa: 9.6 }));
      continue;
    }
    const nazwa = typeof v === "string" ? v : v.obraz ?? v.name, p = wCelu(null, kom);
    const h = await S.object(nazwa, { x: p.x, y: p.y, size: p.s }); h.stala = true; kom.rzeczy.push(h); czesci.push(h);
  }
  czesci.push(...await Promise.all(cyfry));
  // the things to put in, on the floor between the characters
  const luzem = await naklejki(S, rzeczy, { y: rY, size: size0 });
  const s = { kind: "siatka", plansza, R, C, komorki: komorkiH, cele, komorka, naglowki, rzeczy: luzem, obraz,
    zawartosc: (r, c) => komorka(r, c)?.rzeczy.slice() || [],
    // once each: a sticker's remove() is not idempotent (a second one splices the stage's last object)
    remove: () => { for (const h of new Set([...czesci, ...cele, ...luzem, ...[...naglowki.w, ...naglowki.k].flatMap((q) => q.rzeczy)])) h?.remove?.(); } };
  // a row and a column light up and meet in the cell (how a grid is read)
  s.pokaz = async (r, c, { trzymaj = 1.4 } = {}) => {
    const pasy = [r >= 0 ? pasyW[r] : null, c >= 0 ? pasyK[c] : null].filter(Boolean);
    await S.tween(t(0.3), (q) => pasy.forEach((m) => { m.material.opacity = 0.32 * q; }));
    if (r >= 0 && c >= 0) komorka(r, c).highlight(true);
    await S.wait(t(trzymaj));
    await S.tween(t(0.3), (q) => pasy.forEach((m) => { m.material.opacity = 0.32 * (1 - q); }));
    if (r >= 0 && c >= 0) komorka(r, c).highlight(false);
  };
  if (!luzem.length) return s;

  // ---- putting things in
  const miejsca = () => [...cele, ...naglowki.w.filter((m) => m.puste), ...naglowki.k.filter((m) => m.puste)];
  const zgodne = (want, i, hd) => want === undefined || want === null || want === i || want === klucz(hd, i);
  const wRzedzie = (r, c) => [...(komorkiH[r] || []).flatMap((q) => q.rzeczy), ...komorkiH.map((rz) => rz[c]).flatMap((q) => q.rzeczy)];
  // why a thing does not fit a place: the headers (or the twins in a sudoku) that say no
  const powody = (h, m) => {
    if (m.r < 0 || m.c < 0) return h.klucz !== undefined && h.klucz === m.klucz ? [] : [m];
    if (pasuje) { if (pasuje(h, m.r, m.c, s)) return []; const z = [naglowki.w[m.r]?.ikona, naglowki.k[m.c]?.ikona].filter(Boolean); return z.length ? z : [m]; }
    const zle = [];
    if (sudoku) zle.push(...wRzedzie(m.r, m.c).filter((q) => q !== h && q.name === h.name));
    if (rozwiazanie && rozwiazanie[m.r]?.[m.c] !== h.name && !zle.length) zle.push(m);
    if (!zgodne(h.wiersz, m.r, wiersze[m.r])) zle.push(naglowki.w[m.r]?.ikona || m);
    if (!zgodne(h.kolumna, m.c, kolumny[m.c])) zle.push(naglowki.k[m.c]?.ikona || m);
    return zle;
  };
  const pelne = (m) => m.rzeczy.length >= (m.r < 0 || m.c < 0 ? 1 : pojemnosc);
  const ulozWCelu = async (m, d = 0.2) => {
    const n = m.rzeczy.length, wszystkie = m.rzeczy;
    await Promise.all(wszystkie.map((q, i) => {
      if (m.r < 0 || m.c < 0) return Promise.all([q.moveTo(m.x, m.y, t(d)), skaluj(S, q, Math.min(m.w, m.h) * 0.8, d)]);
      const p = wCelu(q, m, i, n); return Promise.all([q.moveTo(p.x, p.y, t(d)), skaluj(S, q, p.s, d)]);
    }));
  };
  const dobreMiejsce = (h) => miejsca().find((m) => !pelne(m) && !powody(h, m).length);
  const wloz = async (h, m) => {
    h.zablokowany = true; h.miejsce = m; m.rzeczy.push(h); S.sfx.graj("plop");
    await ulozWCelu(m); if (m.mesh) S.bump(m, 0.06, false);
  };
  await new Promise((gotowe) => {
    const koniec = () => { if (luzem.every((h) => h.miejsce)) { S.endSort(); S.siatka = null; S.sfx.graj("right"); gotowe(); } };
    S.free({ items: luzem.slice(), onTap: () => {}, onDrop: async (h, p) => {
      if (h.miejsce) return;
      // the place under the finger: its box grown by a quarter of a cell (forgiving), the nearest one
      const pas = 0.25 * kk;
      const m = miejsca().filter((q) => Math.abs(p.x - q.x) < q.w / 2 + pas && Math.abs(p.y - q.y) < q.h / 2 + pas)
        .sort((a, b) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(p.x - b.x, p.y - b.y))[0];
      if (!m || pelne(m)) { await h.moveTo(h.home.x, h.home.y, t(0.35)); return; }
      const zle = powody(h, m);
      if (!zle.length) { await wloz(h, m); onDobrze?.(h, m.r, m.c); koniec(); return; }
      // it goes in, shakes with what says no, and goes back
      h.zablokowany = true;
      await h.moveTo(m.x, m.y, t(0.12));
      S.shake(h); for (const q of zle) if (q === m) m.zle?.(); else if (q.mesh) S.shake(q);
      onZle?.(h, m.r, m.c);
      await S.wait(t(0.45)); await h.moveTo(h.home.x, h.home.y, t(0.35)); h.zablokowany = false;
      h.pudla = (h.pudla || 0) + 1;
      if (h.pudla >= podpowiedz) { const d = dobreMiejsce(h); if (d) s.pokaz(d.r, d.c); }
    } });
    S.siatka = { dokoncz: async () => {
      for (const h of luzem) { if (h.miejsce) continue; const m = dobreMiejsce(h); if (m) { await h.moveTo(m.x, m.y, t(0.15)); await wloz(h, m); } }
      koniec();
    } };
  });
  return s;
}

// ===================================================================== sorting by a hidden rule (regula)
// Containers with no label (painted stickers: a basket, a box, a chest); each quietly takes one kind. With `cecha` and
// `wartosci` (one per container) the rule is fixed (guess_rule: "kolor", ["czerwony", "zolty"]); with `cechy`
// (several features) nobody decides it - the child's first drops do, and any rule the things allow is right (sort_free).
// A thing's features: h.cechy?.[f] ?? h[f]. A wrong one falls in, the container shakes and spits it back home. After
// `poIlu` right ones, once the rule is clear, `onRegula({cecha, wartosci})` lets a character say it out loud; with
// `ikony` ({value: sticker}) a small label then appears on every container. Resolves when everything is in.
// Tests: S.regula.dokoncz().
export async function regula(S, { pojemniki = ["koszyk", "pudelko"], rzeczy = [], cecha = null, wartosci = null, cechy = null, poIlu = 3,
  ikony = null, y = -2.15, size = 2.1, rzeczyY = 1.25, rzeczySize = 1.0, onRegula = null, onZle = null, onDobrze = null } = {}) {
  const n = pojemniki.length, rozstaw = Math.min(3.4, 7.2 / n);
  const P = [];
  for (const [i, p] of pojemniki.entries()) {
    const spec = typeof p === "string" ? { obraz: p } : p;
    const h = await S.object(spec.obraz, { x: spec.x ?? (i - (n - 1) / 2) * rozstaw, y: spec.y ?? y, size: spec.size ?? size });
    h.wart = {}; h.w = []; h.pojemnik = true; P.push(h);
  }
  const luzem = await naklejki(S, rzeczy, { y: rzeczyY, size: rzeczySize });
  const val = (h, f) => h.cechy?.[f] ?? h[f];
  // the features still possible as THE rule; a fixed rule is one feature with its values given
  let F = cecha ? [cecha] : (cechy || []).filter((f) => new Set(luzem.map((h) => val(h, f))).size <= n);
  if (cecha && wartosci) P.forEach((p, i) => { p.wart[cecha] = wartosci[i]; });
  const pasujace = (h, p) => F.filter((f) => {
    const v = val(h, f); if (v === undefined) return false;
    if (p.wart[f] !== undefined && p.wart[f] !== v) return false;
    return P.every((o) => o === p || o.wart[f] !== v);
  });
  let dobrych = 0, powiedziana = false;
  const etykiety = [];
  const powiedz = async () => {
    if (powiedziana || F.length !== 1) return; powiedziana = true;
    const f = F[0], wart = P.map((p) => p.wart[f]);
    if (ikony) for (const p of P) if (ikony[p.wart[f]]) {
      const e = await S.object(ikony[p.wart[f]], { x: p.mesh.position.x + size * 0.38, y: p.mesh.position.y + size * 0.36, size: size * 0.32 });
      naRenderOrder(e, 10.6); etykiety.push(e);
    }
    await onRegula?.({ cecha: f, wartosci: wart });
  };
  // inside: a little heap on the container's mouth, each thing a bit smaller, in front of it
  const ulozW = (p, d = 0.25) => {
    const s = Math.min(rzeczySize * 0.62, size * 0.34), naRz = Math.max(2, Math.floor(size * 0.8 / (s * 0.8)));
    return Promise.all(p.w.map((q, i) => {
      const rz = Math.floor(i / naRz), j = i % naRz, wRz = Math.min(naRz, p.w.length - rz * naRz);
      const px = p.mesh.position.x + (j - (wRz - 1) / 2) * s * 0.8, py = p.mesh.position.y + size * 0.05 + rz * s * 0.45;
      naRenderOrder(q, 10.2 + rz * 0.01 + j * 0.001); q.mesh.position.z = 0.42;
      return Promise.all([q.moveTo(px, py, t(d)), skaluj(S, q, s, d)]);
    }));
  };
  const wloz = async (h, p, f) => {
    for (const q of f) if (p.wart[q] === undefined) p.wart[q] = val(h, q);
    F = f; h.zablokowany = true; h.pojemnik = p; p.w.push(h);
    S.sfx.graj("plop"); S.bump(p, 0.06, false); await ulozW(p);
  };
  const wynik = await new Promise((gotowe) => {
    const koniec = async () => {
      if (!luzem.every((h) => h.pojemnik)) return;
      S.endSort(); S.regula = null; S.sfx.graj("right");
      if (!powiedziana) { F = F.slice(0, 1); await powiedz(); }
      gotowe({ cecha: F[0], wartosci: P.map((p) => p.wart[F[0]]) });
    };
    S.free({ items: luzem.slice(), onTap: () => {}, onDrop: async (h, q) => {
      if (h.pojemnik) return;
      const p = P.filter((o) => Math.abs(q.x - o.mesh.position.x) < size * 0.62 && Math.abs(q.y - o.mesh.position.y) < size * 0.62)
        .sort((a, b) => Math.abs(q.x - a.mesh.position.x) - Math.abs(q.x - b.mesh.position.x))[0];
      if (!p) { await h.moveTo(h.home.x, h.home.y, t(0.35)); return; }
      const f = pasujace(h, p);
      if (f.length) {
        await wloz(h, p, f); dobrych++; onDobrze?.(h, P.indexOf(p));
        if (dobrych >= poIlu) await powiedz();
        return koniec();
      }
      // refused: it falls in, the container shakes and spits it out
      h.zablokowany = true;
      await h.moveTo(p.mesh.position.x, p.mesh.position.y + size * 0.1, t(0.12));
      S.shake(p); onZle?.(h, P.indexOf(p));
      await S.wait(t(0.3)); await odskocz(S, h); h.zablokowany = false;
    } });
    S.regula = { dokoncz: async () => {
      for (const h of luzem) {
        if (h.pojemnik) continue;
        const p = P.find((o) => pasujace(h, o).length); if (!p) continue;
        await h.moveTo(p.mesh.position.x, p.mesh.position.y, t(0.15)); await wloz(h, p, pasujace(h, p)); dobrych++;
        if (dobrych >= poIlu) await powiedz();
      }
      await koniec();
    } };
  });
  return { kind: "regula", ...wynik, pojemniki: P, rzeczy: luzem, etykiety,
    remove: () => { [...P, ...luzem, ...etykiety].forEach((h) => h.remove()); } };
}

// ===================================================================== giving things out (rozdaj)
// The things lie over the heads; the child drags each to a character (onto its body or the bowl in front of it) or to a
// plate / box (`komu`: puppet names or {obraz, x, y, size}); every heap grows visibly, things can be moved from heap to
// heap or back. `ile`: everyone gets exactly that many (one more is refused: the heap shakes and it hops back - groups
// of two on plates). `rowno` (default): done when everything that can be shared is given out AND the heaps are equal;
// all given but unequal: the one with fewer is sad (`onNierowno(kupki)`) and the child moves things. `rowno: false`:
// done when all is given (5 = 2 + 3). `start`: heaps already there ([[names], [names]], make_equal). `s.paruj(a, b)`
// lines the two heaps up in two rows and joins them in pairs with the pencil; the one without a pair is circled
// (even / odd). Tests: S.rozdaj.dokoncz().
export async function rozdaj(S, { komu = ["lisek", "sowa"], rzeczy = [], miski = "miska", ile = null, rowno = true, start = null,
  rzeczyY = 1.25, rzeczySize = 0.95, onZle = null, onDobrze = null, onNierowno = null } = {}) {
  const n = komu.length, odbiorcy = [];
  for (const [i, k] of komu.entries()) {
    const L = typeof k === "string" ? S.puppets[k] : null;
    const o = { i, kto: L ? k : null, L, kupka: [] };
    if (L) {
      const px = L.korzen.position.x, ku = px > 0.1 ? -1 : px < -0.1 ? 1 : 0;
      o.x = px + ku * 1.55; o.y = GROUND + 0.55;
      if (miski) { o.naczynie = await S.object(miski, { x: o.x, y: o.y, size: 1.4 }); o.y = o.naczynie.mesh.position.y; }
    } else {
      const spec = typeof k === "string" ? { obraz: k } : k, rozstaw = Math.min(3.0, 7.0 / n);
      o.naczynie = await S.object(spec.obraz, { x: spec.x ?? (i - (n - 1) / 2) * rozstaw, y: spec.y ?? -2.3, size: spec.size ?? 1.5 });
      o.x = o.naczynie.mesh.position.x; o.y = o.naczynie.mesh.position.y;
    }
    odbiorcy.push(o);
  }
  const luzem = await naklejki(S, rzeczy, { y: rzeczyY, size: rzeczySize });
  const wszystkie = luzem.slice();
  // a heap: rows of 3, 2, 1 ... over the bowl's rim, each row a little higher, in front of the bowl
  const kupkaS = (o) => Math.min(0.62, rzeczySize * 0.66) * (o.kupka.length > 10 ? 0.8 : 1);
  const ulozKupke = (o, d = 0.25) => {
    const s = kupkaS(o), rzedy = []; let zostalo = o.kupka.length, cap = 3;
    while (zostalo > 0) { const r = Math.min(zostalo, Math.max(1, cap)); rzedy.push(r); zostalo -= r; cap = Math.max(1, cap - 1); if (cap === 1 && zostalo > 1) cap = 3; }
    const podloga = o.naczynie ? o.y + 0.12 : GROUND + s * 0.42;
    let i = 0;
    return Promise.all(rzedy.flatMap((ileW, rz) => [...Array(ileW).keys()].map((j) => {
      const q = o.kupka[i++], px = o.x + (j - (ileW - 1) / 2) * s * 0.66, py = podloga + rz * s * 0.5;
      naRenderOrder(q, 10.2 + rz * 0.01 + j * 0.001); q.mesh.position.z = 0.42;
      q.home = { x: px, y: py };
      return Promise.all([q.moveTo(px, py, t(d)), skaluj(S, q, s, d)]);
    })));
  };
  const zabierz = (q) => { const o = q.odbiorca; if (!o) return; o.kupka.splice(o.kupka.indexOf(q), 1); q.odbiorca = null; ulozKupke(o); };
  const daj = async (q, o) => {
    zabierz(q); q.odbiorca = o; o.kupka.push(q); S.sfx.graj("plop");
    if (o.naczynie) S.bump(o.naczynie, 0.06, false);
    await ulozKupke(o);
  };
  if (start) for (const [i, lista] of start.entries()) {
    const o = odbiorcy[i]; if (!o) continue;
    for (const name of lista) { const q = await S.object(name, { x: o.x, y: o.y + 0.4, size: rzeczySize }); wszystkie.push(q); q.odbiorca = o; o.kupka.push(q); }
    await ulozKupke(o, 0.05);
  }
  // the pool's places: a thing taken back from a heap goes to the first free one
  const pula = luzem.map((h) => ({ ...h.home })), wPuli = () => wszystkie.filter((q) => !q.odbiorca);
  const doPuli = async (q) => {
    zabierz(q);
    const zajete = wPuli().filter((r) => r !== q).map((r) => r.home);
    const m = pula.find((p) => !zajete.some((z) => Math.hypot(z.x - p.x, z.y - p.y) < 0.1)) || { x: 0, y: rzeczyY };
    q.home = { ...m }; naRenderOrder(q, 10); await Promise.all([q.moveTo(m.x, m.y, t(0.3)), skaluj(S, q, rzeczySize)]);
  };
  const kupki = () => odbiorcy.map((o) => o.kupka.length);
  const reszta = () => (ile ? 0 : rowno ? wszystkie.length % n : 0);
  let smutni = false;
  const smutek = (on) => {
    if (on === smutni) return; smutni = on;
    const min = Math.min(...kupki());
    for (const o of odbiorcy) {
      if (!on) { if (o.L) o.L.spoczynek(); continue; }
      if (o.kupka.length === min) { if (o.L) o.L.graj("Smutek", true); else if (o.naczynie) S.shake(o.naczynie); }
    }
  };
  const wynik = await new Promise((gotowe) => {
    const sprawdz = () => {
      const k = kupki(), wolne = wPuli().length;
      let gotowy = false;
      if (ile) gotowy = k.every((v) => v === ile);
      else if (rowno) {
        const rowne = k.every((v) => v === k[0]);
        if (wolne <= reszta() && rowne) gotowy = true;
        else if (wolne <= reszta() && !rowne) { if (!smutni) { smutek(true); onNierowno?.(k); } return; }
      } else gotowy = wolne === 0;
      smutek(false);
      if (gotowy) {
        S.endSort(); S.rozdaj = null; S.sfx.graj("right");
        for (const o of odbiorcy) if (o.L) o.L.graj("Radosc");
        gotowe();
      }
    };
    // which receiver is under the finger: its heap / bowl, or the character's body
    const kto = (p) => odbiorcy.map((o) => {
      let d = Math.hypot(p.x - o.x, p.y - o.y);
      if (o.L) { const lx = o.L.korzen.position.x, wys = o.L.wysokosc || 3.6; if (Math.abs(p.x - lx) < 1.1 && p.y > GROUND - 0.2 && p.y < GROUND + wys) d = Math.min(d, 0.5); }
      return { o, d };
    }).filter((q) => q.d < 1.35).sort((a, b) => a.d - b.d)[0]?.o;
    S.free({ items: wszystkie.slice(), onTap: () => {}, onDrop: async (q, p) => {
      const o = kto(p);
      if (!o) { if (q.odbiorca) await doPuli(q); else await q.moveTo(q.home.x, q.home.y, t(0.3)); sprawdz(); return; }
      if (o === q.odbiorca) { await ulozKupke(o); return; }
      if (ile && o.kupka.length >= ile) {                               // one too many: the heap shakes, it hops back
        q.zablokowany = true; await q.moveTo(o.x, o.y + 0.5, t(0.12));
        if (o.naczynie) S.shake(o.naczynie); else if (o.L) S.shake(o.L);
        onZle?.(q, o.i);
        await S.wait(t(0.25)); await odskocz(S, q); q.zablokowany = false;
        if (q.odbiorca) await ulozKupke(q.odbiorca);
        return;
      }
      await daj(q, o); onDobrze?.(q, o.i); sprawdz();
    } });
    S.rozdaj = { dokoncz: async () => {
      // one for you, one for you ... ; heaps given at the start are evened out from the biggest to the smallest
      for (;;) {
        const k = kupki(), wolne = wPuli();
        if (ile) { const o = odbiorcy.find((r) => r.kupka.length < ile), q = wolne[0]; if (!o || !q) break; await daj(q, o); continue; }
        if (wolne.length > reszta()) { const o = odbiorcy.reduce((a, b) => (b.kupka.length < a.kupka.length ? b : a)); await daj(wolne[0], o); continue; }
        if (!rowno) break;
        const max = odbiorcy.reduce((a, b) => (b.kupka.length > a.kupka.length ? b : a)), min = odbiorcy.reduce((a, b) => (b.kupka.length < a.kupka.length ? b : a));
        if (k.every((v) => v === k[0]) || max.kupka.length - min.kupka.length < 1) break;
        await daj(max.kupka[max.kupka.length - 1], min);
      }
      sprawdz();
    } };
  });
  void wynik;
  const kreski = [];
  // the pairing check: the two heaps step out into two rows, face to face, and a pencil joins them pair by pair
  const paruj = async (a = 0, b = 1, { y = 0.2 } = {}) => {
    // what could not be shared (an odd one left in the pool) joins the first row: it is the one without a pair
    const A = [...odbiorcy[a].kupka, ...wPuli()], B = odbiorcy[b].kupka.slice(), m = Math.max(A.length, B.length), s = Math.min(0.9, 7.0 / Math.max(1, m) / 1.2);
    const ys = [y + s * 0.85, y - s * 0.85];
    await Promise.all([A, B].flatMap((rz, k) => rz.map((q, i) => { naRenderOrder(q, 10); return Promise.all([q.moveTo((i - (m - 1) / 2) * s * 1.2, ys[k], t(0.4)), skaluj(S, q, s, 0.4)]); })));
    const pary = Math.min(A.length, B.length);
    for (let i = 0; i < pary; i++) {
      const x0 = (i - (m - 1) / 2) * s * 1.2;
      kreski.push(await S.line([[x0, ys[0] - s * 0.42], [x0, ys[1] + s * 0.42]], { color: "#1f5fbf", width: 0.07, duration: t(0.25), strong: true }));
    }
    const bezPary = [...A.slice(pary), ...B.slice(pary)];
    for (const q of bezPary) { kreski.push(await S.circle(q)); S.bump(q, 0.3, false); }
    return { pary, bezPary };
  };
  return { kind: "rozdaj", kupki: kupki(), reszta: wPuli(), odbiorcy, paruj,
    remove: () => { [...wszystkie, ...kreski, ...odbiorcy.map((o) => o.naczynie).filter(Boolean)].forEach((h) => h.remove()); smutek(false); } };
}
