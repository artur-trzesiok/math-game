// Lalka wycinankowa sterowana danymi: postac.json (czesci, kosci, osie,
// twarz, animacje) -> drzewo Object3D z teksturowanymi czworokatami.
// Animacje to klatki kluczowe per kosc w JSON (stopnie, czas jako ulamek),
// interpolowane gladko; do tego mruganie, lipsync z amplitudy i widoki
// (przod / bok / tyl / profil) z podmiana glowy. Konczyny z lancuchem stawow
// (rig: kosci[k].stawy, pomiar: czesci[n].stawy) sa siatka zginana w stawach (siatka.js).

import * as THREE from "three";
import { v } from "./v.js";
import { baza, sW, waga, pasmo, deformuj, punkt } from "./siatka.js";

const DEG = Math.PI / 180;
const ladowacz = new THREE.TextureLoader();
function tekstura(url) {
  return new Promise((ok, zle) => ladowacz.load(v(url), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; ok(t); }, undefined, zle));
}
// interpolacja toru [[t, v], ...] (t w 0..1), gladka miedzy klatkami
function tor(klatki, u) {
  if (!klatki || !klatki.length) return 0;
  if (u <= klatki[0][0]) return klatki[0][1];
  for (let i = 1; i < klatki.length; i++) {
    if (u <= klatki[i][0]) {
      const [t0, v0] = klatki[i - 1], [t1, v1] = klatki[i];
      let s = (u - t0) / Math.max(1e-6, t1 - t0);
      s = s * s * (3 - 2 * s);
      return v0 + (v1 - v0) * s;
    }
  }
  return klatki[klatki.length - 1][1];
}
function sekwencja(lista, u) {
  let v = null;
  for (const [t, w] of lista) if (u >= t) v = w;
  return v;
}

const TULOW = { przod: "tulow", profil: "p_cialo", tyl: "t_tulow" };
// viseme -> drawn mouth + stretch (x, y): a open, o round, u small round, e half, i spread, s teeth, m closed
const WIZEMY = {
  X: ["zamkniete", 1, 1], M: ["zamkniete", 1.02, 0.9], A: ["o", 1.12, 1.12], O: ["o", 0.84, 1.0], U: ["o", 0.66, 0.82],
  E: ["pol", 1.12, 1.0], I: ["usmiech", 1.06, 0.82], S: ["usmiech", 0.92, 0.66], F: ["pol", 0.94, 0.58], L: ["pol", 0.96, 0.78],
};
// the speech mouths drawn for a sound (tools/characters/make_usta.py) - used when the character has them, else the
// stretched one above: m b p pressed lips, a wide, u a small round, s z c teeth, f w lip under teeth, l t d n the tongue
export const WIZEMY_RYSOWANE = { M: "scisniete", A: "szeroko", U: "dziobek", S: "zeby", F: "fw", L: "l" };
// a right-side bone (and its joints) takes mirrored angles
const lustro = (k) => k.endsWith("_p") || k === "reka_p" || k === "noga_p" || k === "noga_tp";

export class Lalka {
  static klatki = 0;                       // >0: krokowanie lalki (np. 12)
  static zginanie = true;                  // false: chains stay at rest (A/B against the rigid cut-out)
  static przejscie = 0.22;                 // s: a new animation blends in from the last pose (0 = cut, an animation may set `wejscie`)

  static async wczytaj(katalog, opis = {}) {
    const dane = await (await fetch(v(katalog + "postac.json"), { cache: "no-store" })).json();
    return new Lalka(dane, await Lalka.tekstury(katalog, dane), opis);
  }
  static async tekstury(katalog, dane) {
    const tex = {};
    await Promise.all(Object.keys(dane.czesci).map(async (n) => { tex[n] = await tekstura(`${katalog}czesci/${dane.czesci[n].plik}`); }));
    return tex;
  }

  constructor(dane, tex, opis) {
    this.dane = dane; this.tex = tex;
    this.wysokosc = opis.wysokosc ?? dane.wysokosc;
    this.strona = opis.strona || "lewo";
    this.skala = this.wysokosc / (dane.kadr.dol - dane.kadr.gora);
    this.skalaP = this.wysokosc / (dane.kadr_profil.dol - dane.kadr_profil.gora);
    this.skalaT = dane.kadr_tyl ? this.wysokosc / (dane.kadr_tyl.dol - dane.kadr_tyl.gora) : this.skala;
    this.kierunek = "przod"; this.kierunekBazowy = "przod"; this.widokWymuszony = null;
    this.mowi = false; this.amplituda = 0; this.ustaStan = "zamkniete"; this.ustaOd = 0;
    this.emocja = { oczy: "otwarte", usta: "zamkniete" };
    this.mruganie = -1; this.nastepneMrugniecie = 2 + Math.random() * 3;
    this.t = 0; this.ta = 0; this.akcja = null; this.naKoniec = null;
    this.mikro = { od: {}, cel: {}, start: 0, nastepny: 1 + Math.random() * 2 };
    this.faza = Math.random() * 6.28;
    this.stencil = (Lalka.licznikStencil = ((Lalka.licznikStencil || 0) % 254) + 1);   // maska tulowia tej lalki
    this._zbuduj();
    this.spoczynek();
  }

  // ------------------------------------------------------------ budowa
  _kadr(w) { return w === "profil" || w === true ? this.dane.kadr_profil : w === "tyl" ? this.dane.kadr_tyl : this.dane.kadr; }
  _skala(w) { return w === "profil" || w === true ? this.skalaP : w === "tyl" ? this.skalaT : this.skala; }
  _sw(px, py, widok) {
    const k = this._kadr(widok), s = this._skala(widok);
    return [(px - k.w / 2) * s, (k.dol - py) * s];
  }
  _plane(nazwa, os, z, widok, bb = this.dane.czesci[nazwa]) {
    const s = this._skala(widok);
    const g = new THREE.PlaneGeometry(bb.w * s, bb.h * s);
    g.translate((bb.x + bb.w / 2 - os[0]) * s, -(bb.y + bb.h / 2 - os[1]) * s, 0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.tex[nazwa], transparent: true, alphaTest: 0.05, side: THREE.DoubleSide }));
    m.position.z = z; m.userData.czesc = nazwa; m.frustumCulled = false;
    return m;
  }

  // a limb as a grid mesh trimmed to its alpha, bent along its joints
  _siatka(k, o, os) {
    const cz = this.dane.czesci[o.czesc], s = this._skala(o.widok), t = this.dane.czesci[TULOW[o.widok]] || cz;
    // a root piece (the torso) bends upward from the hips: its field starts at its bottom edge
    const zrodlo = o.dystalnie === "gora" && !cz.os ? [cz.x + cz.w / 2, cz.y + cz.h * 0.97] : os;
    const B = baza(this.tex[o.czesc].image, cz, zrodlo, [t.x + t.w / 2, t.y + t.h / 2], o.dystalnie);
    const n = B.px.length, rest = new Float32Array(3 * n), uv = new Float32Array(2 * n);
    for (let v = 0; v < n; v++) {
      rest[3 * v] = (B.px[v] - os[0]) * s; rest[3 * v + 1] = -(B.py[v] - os[1]) * s;
      uv[2 * v] = (B.px[v] - cz.x) / cz.w; uv[2 * v + 1] = 1 - (B.py[v] - cz.y) / cz.h;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(rest.slice(), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setIndex(B.index);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.tex[o.czesc], transparent: true, alphaTest: 0.05, side: THREE.DoubleSide }));
    m.userData.czesc = o.czesc; m.frustumCulled = false;
    const stawy = o.stawy.map((spec, i) => {
      const j = cz.stawy[i] || cz.stawy[cz.stawy.length - 1], sk = sW(B, j.x, j.y);
      return { nazwa: spec.nazwa, zakres: spec.zakres || [-180, 180], sk, h: pasmo(sk, j.miekkosc ?? spec.miekkosc ?? 0.3),
               jx: (j.x - os[0]) * s, jy: -(j.y - os[1]) * s, px: j.x, py: j.y };
    });
    const wagi = new Float32Array(stawy.length * n);
    stawy.forEach((st, i) => { for (let v = 0; v < n; v++) wagi[i * n + v] = waga(B.vs[v], st.sk, st.h); });
    // legs and tails turn at a hip joint inside the mesh: the hidden overlap above the pivot stays with the body
    let biodro = null;
    if (/noga|ogon/.test(k)) {
      const hb = /ogon/.test(k) ? 0.2 : 0.1;
      biodro = { nazwa: null, jx: 0, jy: 0, sk: hb / 2, h: hb, wagi: Float32Array.from(B.vs, (v) => waga(v, hb / 2, hb)) };
    }
    this.lancuchy.push({ kosc: k, czesc: o.czesc, widok: o.widok, mesh: m, rest, wagi, stawy, lustro: lustro(k), katy: new Float32Array(stawy.length), wazne: false, B, biodro, katBiodra: 0 });
    for (const st of stawy) this.stawyNazwy.add(st.nazwa);
    return m;
  }

  // editor: the wireframe of every chain mesh on/off
  pokazSiatke(tak) {
    for (const L of this.lancuchy) {
      let w = L.mesh.children.find((c) => c.userData.druty);
      if (tak && !w) { w = new THREE.Mesh(L.mesh.geometry, new THREE.MeshBasicMaterial({ color: 0x00e0ff, wireframe: true, transparent: true, opacity: 0.35, depthTest: false })); w.userData.druty = true; w.renderOrder = 999; w.raycast = () => {}; L.mesh.add(w); }
      if (w) w.visible = !!tak;
    }
  }
  // editor: where the joints of a piece are now, in world coordinates
  stawyCzesci(czesc) {
    const L = this.lancuchy.find((l) => l.czesc === czesc && this._widoczna(l.mesh));
    if (!L) return [];
    L.mesh.updateWorldMatrix(true, false);
    return L.stawy.map((st, i) => {
      const [x, y] = L.biodro ? punkt(st.jx, st.jy, st.sk, [L.biodro, ...L.stawy], [L.katBiodra, ...L.katy]) : punkt(st.jx, st.jy, st.sk, L.stawy, L.katy);
      return { i, nazwa: st.nazwa, sk: st.sk, h: st.h, zakres: st.zakres, swiat: new THREE.Vector3(x, y, 0).applyMatrix4(L.mesh.matrixWorld) };
    });
  }
  _widoczna(o) { for (; o; o = o.parent) if (o.visible === false) return false; return true; }

  // ------------------------------------------------------------ carrying
  // where a carried thing sits now, in world coordinates: a humanoid holds it in the paw of the near arm
  // (the tip of the arm chain, s > 0.9, as bent), a quadruped carries it on its back (the top of its torso)
  uchwyt() {
    const widok = this.wProfilu ? "profil" : this.wTyle ? "tyl" : "przod";
    const reka = { przod: "reka_p", profil: "p_reka", tyl: "t_reka_p" }[widok];
    const R = this.lancuchy.find((l) => l.czesc === reka || l.kosc === reka);
    const v = new THREE.Vector3();
    if (R && this.dane.rig !== "czworonog") {
      if (!R.dlon) { R.dlon = []; for (let i = 0; i < R.B.vs.length; i++) if (R.B.vs[i] > 0.9) R.dlon.push(i); }
      const pos = R.mesh.geometry.attributes.position.array;
      for (const i of R.dlon) { v.x += pos[3 * i]; v.y += pos[3 * i + 1]; }
      v.multiplyScalar(1 / Math.max(1, R.dlon.length));
      R.mesh.updateWorldMatrix(true, false);
      const o = new THREE.Vector3(); this.korzen.getWorldPosition(o);
      v.applyMatrix4(R.mesh.matrixWorld);
      // which way the thing sits beyond the paw: forward in profile, outward from the body in front / back
      const kier = widok === "profil" ? (this.kierunek === "lewo" ? -1 : 1) : Math.sign(v.x - o.x) || 1;
      return { p: v, na: "dlon", kier, widok };
    }
    const tul = this.kosci[{ przod: "tulow", profil: "p_cialo", tyl: "t_tulow" }[widok]]?.children.find((c) => c.isMesh);
    if (!tul) { this.korzen.getWorldPosition(v); v.y += this.wysokosc * 0.6; return { p: v, na: "plecy" }; }
    const bb = new THREE.Box3().setFromObject(tul);
    return { p: new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.max.y - (bb.max.y - bb.min.y) * 0.08, 0), na: "plecy" };
  }

  // what hangs on a bent piece (the head and arms on the torso) moves and turns with the bend at its attachment
  _niesDzieci() {
    for (const L of this.lancuchy) {
      const g = this.kosci[L.kosc];
      if (!L.dzieci) L.dzieci = g.children.filter((c) => c.isGroup && c.userData.os).map((c) => ({ c, x: c.position.x, y: c.position.y, s: sW(L.B, c.userData.os[0], c.userData.os[1]) }));
      if (!L.dzieci.length) continue;
      for (const d of L.dzieci) {
        const [x, y] = punkt(d.x, d.y, d.s, L.stawy, L.katy);
        let a = 0; L.stawy.forEach((st, i) => { a += L.katy[i] * waga(d.s, st.sk, st.h); });
        d.c.position.x = x; d.c.position.y = y; d.c.rotation.z += a;
      }
    }
  }

  _zginaj(p, ktore = null) {
    for (const L of this.lancuchy) {
      if (ktore && !ktore(L)) continue;
      if (!this.widokGrupy[L.widok].visible) { L.wazne = false; continue; }   // a hidden view bends when it shows up
      let zmiana = !L.wazne;
      L.stawy.forEach((st, i) => {
        if (L.ikKaty && i < 2) { const f = L.ikKaty[i]; if (f !== L.katy[i]) { L.katy[i] = f; zmiana = true; } return; }
        let a = (p[st.nazwa] || 0) + (this.recznie?.[st.nazwa] || 0);
        a = Math.max(st.zakres[0], Math.min(st.zakres[1], a));
        if (L.lustro) a = -a;
        const f = Lalka.zginanie ? -a * DEG : 0;
        if (f !== L.katy[i]) { L.katy[i] = f; zmiana = true; }
      });
      if (L.biodro) {                                     // the bone's own turn becomes the hip joint; the piece itself keeps its base rotation
        const g = this.kosci[L.kosc], baza = -(this.dane.czesci[L.czesc]?.obrot || 0) * DEG, f = Lalka.zginanie ? g.rotation.z - baza : 0;
        if (Lalka.zginanie) g.rotation.z = baza;
        if (f !== L.katBiodra) { L.katBiodra = f; zmiana = true; }
      }
      if (!zmiana) continue;
      const pos = L.mesh.geometry.attributes.position;
      if (L.biodro) {
        if (!L.wagiD) { const n = L.rest.length / 3; L.wagiD = new Float32Array((L.stawy.length + 1) * n); L.wagiD.set(L.biodro.wagi, 0); L.wagiD.set(L.wagi, n); L.stawyD = [L.biodro, ...L.stawy]; }
        deformuj(L.rest, pos.array, L.wagiD, L.stawyD, [L.katBiodra, ...L.katy]);
      } else deformuj(L.rest, pos.array, L.wagi, L.stawy, L.katy);
      pos.needsUpdate = true; L.mesh.geometry.boundingSphere = null; L.mesh.geometry.boundingBox = null;
      L.wazne = true;
    }
  }

  _zbuduj() {
    const d = this.dane, c = d.czesci;
    this.korzen = new THREE.Group();
    this.kosci = {};
    this.lancuchy = []; this.stawyNazwy = new Set();
    this.widokGrupy = { przod: new THREE.Group(), profil: new THREE.Group(), tyl: new THREE.Group() };
    this.korzen.add(this.widokGrupy.przod, this.widokGrupy.profil, this.widokGrupy.tyl);
    this.widokGrupy.profil.visible = false; this.widokGrupy.tyl.visible = false;
    // korzenie: biodra = dol tulowia danego widoku
    const tulowWidoku = { przod: "tulow", profil: "p_cialo", tyl: "t_tulow" };
    for (const [k, o] of Object.entries(d.kosci)) {
      if (o.rodzic) continue;
      const cz = c[tulowWidoku[o.widok]];
      if (!cz) continue;                       // view without pieces (older character)
      const os = [cz.x + cz.w / 2, cz.y + cz.h];
      const g = new THREE.Group();
      const [x, y] = this._sw(os[0], os[1], o.widok);
      g.position.set(x, y, 0);
      g.userData = { os, widok: o.widok, bazaY: y, bazaX: x };
      this.widokGrupy[o.widok].add(g);
      this.kosci[k] = g;
    }
    // reszta kosci w kolejnosci rodzicow
    let zostalo = Object.entries(d.kosci).filter(([k]) => !this.kosci[k]);
    while (zostalo.length) {
      const nast = [];
      for (const [k, o] of zostalo) {
        const rodzic = this.kosci[o.rodzic];
        if (!rodzic) { nast.push([k, o]); continue; }
        const cz = o.czesc && c[o.czesc];
        if (!cz) { if (!o.opcjonalna) console.warn("brak czesci", o.czesc); continue; }
        const s = this._skala(o.widok);
        const os = cz.os || [cz.x + cz.w / 2, cz.y];
        const g = new THREE.Group();
        const ro = rodzic.userData.os;
        g.position.set((os[0] - ro[0]) * s, -(os[1] - ro[1]) * s, o.z ?? 0);
        g.userData = { os, widok: o.widok, z: o.z ?? 0, zUniesiona: o.z_uniesiona, czesc: o.czesc, bazaY: g.position.y };
        const m = o.stawy && cz.stawy ? this._siatka(k, o, os) : this._plane(o.czesc, os, 0, o.widok);
        // "za tulowiem, ale przed glowa": element lezy nad glowa, a tulow wycina go w stencilu tam, gdzie sie nakladaja
        if (o.czesc === "tulow") Object.assign(m.material, { stencilWrite: true, stencilRef: this.stencil, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp });
        if (o.za_tulowiem) Object.assign(m.material, { stencilWrite: true, stencilRef: this.stencil, stencilFunc: THREE.NotEqualStencilFunc, stencilWriteMask: 0 });
        g.add(m);
        rodzic.add(g); this.kosci[k] = g;
      }
      if (nast.length === zostalo.length) break;
      zostalo = nast;
    }
    // glowy: trzy widoki na tej samej kosci "glowa" (przod), kazda ze swojego kadru;
    // glowa bok/tyl siedzi w podgrupie z wlasna osia (cz.os, domyslnie os glowy z przodu),
    // ktora przejmuje obrot kosci, gdy ten widok jest aktywny
    this.widoki = {}; this.widokiGrupy = {};
    const gl = this.kosci.glowa;
    if (gl) {
      this.widoki.przod = gl.children[0];
      for (const w of ["bok", "tyl"]) {
        const n = d.glowy[w], cz = c[n];
        if (!cz || (w === "tyl" && this.kosci.t_tulow)) continue;
        const osG = gl.userData.os, os = cz.os || osG, s = this.skala;
        const sub = new THREE.Group();
        sub.position.set((os[0] - osG[0]) * s, -(os[1] - osG[1]) * s, 0);
        sub.userData = { os, bx: sub.position.x, widok: w };
        const m = this._plane(n, os, 0, false);
        m.visible = false; sub.add(m); gl.add(sub); this.widoki[w] = m; this.widokiGrupy[w] = sub;
      }
    }
    // warianty twarzy per widok
    this.twarze = {}; this.twarzeGrupy = {};
    for (const [widok, przyrostek, kosc] of [["przod", "", "glowa"], ["bok", "_bok", "glowa"], ["profil", "_profil", "p_glowa"]]) {
      const cel = d.twarz[widok], g = this.widokiGrupy[widok] || this.kosci[kosc];   // twarz bok/tyl w podgrupie tej glowy
      if (!cel || !g) continue;
      const glowaCz = c[widok === "profil" ? "p_glowa" : widok === "bok" ? d.glowy.bok : "glowa"];
      const osG = g.userData.os, profil = widok === "profil" ? "profil" : "przod", s = this._skala(profil);
      const zestaw = { oczy: {}, usta: {} };
      // kontener twarzy w osi glowy (lustro, obrot glowy bok/tyl) -> grupa celu w jego srodku (wlasny obrot) -> warianty
      const kont = new THREE.Group(); g.add(kont); this.twarzeGrupy[widok] = kont;
      const grupyCelu = {};
      for (const [n, cz] of Object.entries(c)) {
        const baza = przyrostek ? (n.endsWith(przyrostek) ? n.slice(0, -przyrostek.length) : null) : (/_(bok|profil)$/.test(n) ? null : n);
        if (!baza) continue;
        const t = baza.startsWith("oczy_") ? "oczy" : baza.startsWith("usta_") ? "usta" : null;
        if (!t || !cel[t]) continue;
        const bazowy = c[(t === "usta" ? "usta_usmiech" : "oczy_otwarte") + przyrostek] || cz;
        const rb = bazowy.rdzen || { x: 0, y: 0, w: bazowy.w, h: bazowy.h };
        const r = cz.rdzen || { x: 0, y: 0, w: cz.w, h: cz.h };
        const k = cel[t].w / rb.w;
        const y = t === "usta" ? cel[t].y - r.y * k : cel[t].y + cel[t].h - (r.y + r.h) * k;
        const bb = { x: cel[t].x + cel[t].w / 2 - (r.x + r.w / 2) * k, y, w: cz.w * k, h: cz.h * k };
        if (cz.przesun) { bb.x += cz.przesun[0]; bb.y += cz.przesun[1]; }   // the editor's per-variant correction (frame px)
        const nadOczami = d.usta_nad_oczami ? t === "usta" : t === "oczy";
        if (!grupyCelu[t]) {
          const sr = [cel[t].x + cel[t].w / 2, cel[t].y + cel[t].h / 2], gt = new THREE.Group();
          gt.position.set((sr[0] - osG[0]) * s, -(sr[1] - osG[1]) * s, nadOczami ? 0.03 : 0.02);
          gt.rotation.z = -(cel[t].obrot || 0) * DEG;
          gt.userData.cel = t; gt.userData.baseY = gt.position.y; gt.userData.polH = cel[t].h / 2 * s;   // the visemes stretch it from its top edge
          kont.add(gt); grupyCelu[t] = { g: gt, sr };
        }
        const m = this._plane(n, grupyCelu[t].sr, 0, profil, bb);
        m.visible = false; grupyCelu[t].g.add(m);
        // the nose alone (tools/characters/make_nos.py) hangs on its mouth and is drawn over the eyes: turned 3/4 or in
        // profile it sticks out in front of the near eye, while the muzzle patch stays under them
        if (t === "usta" && c[`nos_${n}`] && this.tex[`nos_${n}`]) {
          const nm = new THREE.Mesh(m.geometry, m.material.clone()); nm.material.map = this.tex[`nos_${n}`];
          nm.position.z = 0.02; nm.renderOrder = m.renderOrder; m.add(nm);
        }
        zestaw[t][baza.slice(5)] = m;
      }
      this.twarze[widok] = zestaw;
    }
    this.korzen.userData.lalka = this;
    this._spoczynekStop();
  }

  // ------------------------------------------------------------ feet
  // legs = chains of a bone named noga* with a knee and an ankle; at rest: where each ankle
  // stands (view space), the foot's rotation, and how low the lowest foot vertex reaches
  _spoczynekStop() {
    this.nogi = this.lancuchy.filter((L) => /noga/.test(L.kosc) && L.stawy.length >= 2);
    for (const [k, g] of Object.entries(this.kosci)) g.rotation.z = g.userData.czesc ? -(this.dane.czesci[g.userData.czesc]?.obrot || 0) * DEG : 0;
    this.korzen.updateMatrixWorld(true);
    for (const L of this.nogi) {
      const g = this.kosci[L.kosc], wg = this.widokGrupy[L.widok];
      L.cel = wg.worldToLocal(g.localToWorld(new THREE.Vector3(L.stawy[1].jx, L.stawy[1].jy, 0)));
      L.stopa0 = this._obrotWidoku(g);
      L.podeszwa = [];
      const B = L.rest;
      for (let v = 0; v < B.length / 3; v++) if (L.wagi[1 * (B.length / 3) + v] > 0.99) L.podeszwa.push(v);   // the foot: past the ankle
      L.dno0 = this._dnoNogi(L, true);   // each leg's own floor: a far leg is often drawn reaching lower than the near one
    }
  }
  // the sum of z rotations from a bone up to its view group: the bone's angle in view space
  _obrotWidoku(g) { const widoki = Object.values(this.widokGrupy); let a = 0; for (let o = g; o && !widoki.includes(o); o = o.parent) a += o.rotation.z; return a; }
  // the lowest foot vertex of a leg in its view space (rest geometry or the bent one)
  _dnoNogi(L, spoczynek = false) {
    const wg = this.widokGrupy[L.widok], src = spoczynek ? L.rest : L.mesh.geometry.attributes.position.array;
    const m = new THREE.Matrix4().copy(wg.matrixWorld).invert().multiply(L.mesh.matrixWorld), v = new THREE.Vector3();
    let lo = Infinity;
    for (const i of L.podeszwa) { v.set(src[3 * i], src[3 * i + 1], 0).applyMatrix4(m); if (v.y < lo) lo = v.y; }
    return lo;
  }
  // feet planted: every leg of the visible view is solved (2-bone IK) so its ankle stays where it stood at rest;
  // the animation moves the hips (biodra, biodra_x, skok), the knees follow. The track value of a knee only picks
  // the side it folds to; the ankle keeps the foot level (plus its own track).
  _ik(p, cele = null) {
    this.korzen.updateMatrixWorld(true);
    for (const L of this.nogi) {
      L.ikKaty = null;
      if (!this.widokGrupy[L.widok].visible || !Lalka.zginanie) continue;
      const g = this.kosci[L.kosc], wg = this.widokGrupy[L.widok];
      const T = g.parent.worldToLocal(wg.localToWorld((cele?.get(L) || L.cel).clone()));
      const ux = T.x - g.position.x, uy = T.y - g.position.y, d = Math.hypot(ux, uy);
      const [k0, k1] = L.stawy;
      const kx = k0.jx, ky = k0.jy, ax = k1.jx - k0.jx, ay = k1.jy - k0.jy;
      const L1 = Math.hypot(kx, ky), L2 = Math.hypot(ax, ay), beta = Math.atan2(ay, ax) - Math.atan2(ky, kx);
      const c = Math.max(-1, Math.min(1, (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2))), gam = Math.acos(c);
      const norm = (a) => Math.atan2(Math.sin(a), Math.cos(a));
      // which way the knee folds: the track's value; else, for a joint that bends one way (a deer's [-5, 130]), the
      // middle of its range - the same at every phase; else the bend it had a frame ago. Nearest to 0 every frame
      // flipped the deer's leg between the two solutions mid-stride (one of them hyperextended inside the -5 slack)
      const srodek = (k0.zakres[0] + k0.zakres[1]) / 2;
      const hint = p[k0.nazwa] ? p[k0.nazwa] : Math.abs(srodek) > 15 ? srodek : (L.ikPoprz ?? 0), jakKat = (psi) => (L.lustro ? 1 : -1) * psi / DEG;
      const ocena = (psi) => { const kat = jakKat(psi); return (kat < k0.zakres[0] || kat > k0.zakres[1] ? 1000 : 0) + Math.abs(kat - hint); };
      const a1 = norm(gam - beta), a2 = norm(-gam - beta), psi = ocena(a1) <= ocena(a2) ? a1 : a2;
      L.ikPoprz = jakKat(psi);
      const vx = kx + Math.cos(psi) * ax - Math.sin(psi) * ay, vy = ky + Math.sin(psi) * ax + Math.cos(psi) * ay;
      g.rotation.z = Math.atan2(uy, ux) - Math.atan2(vy, vx);
      const rodzic = this._obrotWidoku(g) - g.rotation.z;
      const chi = L.stopa0 - (rodzic + g.rotation.z + psi) + (L.lustro ? 1 : -1) * (p[k1.nazwa] || 0) * DEG;
      L.ikKaty = [psi, chi];
    }
  }
  // leg length (pivot - knee - ankle) of the legs of a view: a stride is measured in it - the SHORTER leg's, so it can
  // reach every step (stocky characters draw their far leg much shorter; the average made the hips drop each step)
  _dlugoscNogi(widok) {
    const n = this.nogi.filter((L) => L.widok === widok);
    if (!n.length) return this.wysokosc * 0.3;
    return Math.min(...n.map((L) => { const [k0, k1] = L.stawy; return Math.hypot(k0.jx, k0.jy) + Math.hypot(k1.jx - k0.jx, k1.jy - k0.jy); }));
  }
  // a walk with planted feet (animation `krok`): each leg runs its own phase; in stance its ankle slides back
  // in a straight line exactly as fast as the body moves forward (so it stays put on the floor), in swing it
  // arcs forward. The hips drop just enough for every leg to reach its target, the IK bends knees and ankles.
  _krok(u, k) {
    const widok = "profil", nogi = this.nogi.filter((L) => L.widok === widok);
    if (!nogi.length || !Lalka.zginanie || !this.widokGrupy.profil.visible) return;
    const D = this._dlugoscNogi(widok), S = (k.dlugosc ?? 0.9) * D, lift = (k.uniesienie ?? 0.2) * D, duty = k.podpora ?? 0.6;
    // a stride swings around the pair's common centre (legs drawn standing apart would limp), on each leg's own floor
    // ... unless the feet stand far apart at rest (a stocky character's short far leg stands well forward): then each
    // leg strides around its own foot, or the far one would have to reach across and the hips would sink every step
    const xs = nogi.map((n) => n.cel.x), osobno = !k.pary && Math.max(...xs) - Math.min(...xs) > 0.5 * D;
    const para = (L) => (osobno ? [[L.kosc]] : k.pary || [nogi.map((n) => n.kosc)]).find((pr) => pr.includes(L.kosc)) || [L.kosc];
    const cele = new Map();
    for (const L of nogi) {
      const pr = nogi.filter((n) => para(L).includes(n.kosc)), cx = pr.reduce((a, n) => a + n.cel.x, 0) / pr.length;
      const q = ((u + (k.fazy?.[L.kosc] ?? 0)) % 1 + 1) % 1;
      let x, y = 0;
      if (q < duty) x = S / 2 - S * (q / duty);
      else { const w = (q - duty) / (1 - duty), e = w * w * (3 - 2 * w); x = -S / 2 + S * e; y = lift * Math.sin(Math.PI * w); }
      cele.set(L, new THREE.Vector3(cx + x, L.cel.y + y, 0));
    }
    // the hips come down until the farthest-reaching leg can reach (a straight leg cannot stride)
    const root = this.kosci.p_biodra, wg = this.widokGrupy.profil;
    root.position.y -= (k.przysiad ?? 0.03) * D;
    this.korzen.updateMatrixWorld(true);
    let spadek = 0;
    for (const L of nogi) {
      const g = this.kosci[L.kosc], P = wg.worldToLocal(g.parent.localToWorld(g.position.clone())), T = cele.get(L);
      const [k0, k1] = L.stawy, R = 0.97 * (Math.hypot(k0.jx, k0.jy) + Math.hypot(k1.jx - k0.jx, k1.jy - k0.jy));
      const dx = T.x - P.x, dyMax = Math.sqrt(Math.max(0, R * R - dx * dx));
      spadek = Math.max(spadek, (P.y - T.y) - dyMax);
    }
    root.position.y -= spadek;
    this._ik(this.poza, cele);
  }
  // feet on the floor: the visible view moves up or down until the leg reaching deepest below its own
  // rest floor stands exactly on it - stance legs carry the body, the walk's bob comes from the legs
  _naZiemi() {
    const widok = this.wProfilu ? "profil" : this.wTyle ? "tyl" : "przod", nogi = this.nogi.filter((L) => L.widok === widok);
    if (!nogi.length) return;
    this.korzen.updateMatrixWorld(true);
    const rel = Math.min(...nogi.map((L) => this._dnoNogi(L) - L.dno0));
    const root = this.kosci[{ przod: "biodra", profil: "p_biodra", tyl: "t_biodra" }[widok]];
    if (root && isFinite(rel)) root.position.y -= rel;
  }

  // ------------------------------------------------------------ stan
  _oczyTeraz() {
    if (this.wymus?.oczy) return this.wymus.oczy;                    // the editor's face slider
    if (this.mruganie >= 0) return this.mruganie < 0.08 ? "pol" : this.mruganie < 0.2 ? "zamkniete" : "pol";
    return this.poza.oczy || this.emocja.oczy;
  }
  _ustaTeraz() {
    this.ustaSkala = null;
    if (this.wymus?.usta) return this.wymus.usta;
    if (!this.mowi) return this.poza.usta || this.emocja.usta;
    if (this.wiz) {
      // a viseme: one of the drawn mouths, stretched to the sound's shape, opened a little more when louder
      const rys = WIZEMY_RYSOWANE[this.wiz];
      if (rys && this.twarze?.przod?.usta?.[rys]) {                         // drawn for this sound: barely stretched
        this.ustaSkala = [1, rys === "scisniete" ? 1 : 0.97 + 0.06 * Math.min(1, this.amplituda)];
        return rys;
      }
      const [n, sx, sy] = WIZEMY[this.wiz] || WIZEMY.X;
      const otwarcie = n === "zamkniete" ? 1 : 0.94 + 0.1 * Math.min(1, this.amplituda);
      this.ustaSkala = [sx, sy * otwarcie];
      return n === "zamkniete" && this.wiz === "X" ? (this.poza.usta || "zamkniete") : n;
    }
    const chce = this.amplituda > 0.55 ? "o" : this.amplituda > 0.22 ? "pol" : (this.poza.usta || "zamkniete");
    if (chce !== this.ustaStan && this.t - this.ustaOd > 0.08) { this.ustaStan = chce; this.ustaOd = this.t; }
    return this.ustaStan;
  }
  _ustawTwarz() {
    const kier = this.kierunek, wProfilu = this.wProfilu;
    const lewo = kier === "lewo";
    // glowa z przodu: ktory widok
    const wTyle = this.wTyle;
    const widokGlowy = wProfilu || wTyle ? null : kier === "tyl" ? "tyl" : (kier !== "przod" && this.widoki.bok) ? "bok" : "przod";
    for (const [w, m] of Object.entries(this.widoki)) m.visible = w === widokGlowy;
    const oczy = this._oczyTeraz(), usta = this._ustaTeraz();
    for (const [w, z] of Object.entries(this.twarze)) {
      const aktywny = wProfilu ? w === "profil" : !wTyle && w === widokGlowy;
      const sub = this.widokiGrupy[w];
      if (sub) { sub.scale.x = lewo ? -1 : 1; sub.position.x = (lewo ? -1 : 1) * sub.userData.bx; }   // lustro wokol osi glowy z przodu
      for (const [n, m] of Object.entries(z.oczy)) m.visible = aktywny && n === oczy;
      for (const [n, m] of Object.entries(z.usta)) m.visible = aktywny && n === usta;
      const gu = Object.values(z.usta)[0]?.parent;                 // the mouth target group (its own centre)
      if (gu) {
        // the drawn mouths carry the nose above them: the mouth opens downward from its top edge (the nose nearly
        // stays) and stretches sideways only a little (that is what widened the nose)
        const [sx0, sy0] = this.ustaSkala || [1, 1], sx = 1 + (sx0 - 1) * 0.35, sy = 1 + (sy0 - 1) * 0.5;   // gentle: the shape comes from the drawn mouth
        gu.scale.x += (sx - gu.scale.x) * 0.6; gu.scale.y += (sy - gu.scale.y) * 0.6;
        if (gu.userData.polH) gu.position.y = gu.userData.baseY - gu.userData.polH * (gu.scale.y - 1);
      }
    }
  }

  graj(nazwa, petla = null) {
    const a = this.dane.animacje[nazwa];
    if (!a || this.zamrozona) return false;           // a statue keeps its pose, even while it speaks
    // the pose the puppet holds now blends into the new animation instead of jumping; feet that were planted stay planted
    const czas = a.wejscie ?? Lalka.przejscie;
    this.przejscie = this.pozaSurowa && czas > 0 ? { od: { ...this.pozaSurowa }, start: this.t, czas, stopy: this.przejscie?.stopy === "ik" ? "ik" : this.akcja?.stopy } : null;
    this.akcja = { nazwa, ...a, petla: petla ?? !!a.petla }; this.ta = 0;
    Lalka.naGraj?.(this, nazwa);           // the stage hooks its sound effects here
    return true;
  }
  spoczynek() { this.graj("Spoczynek", true); if (this.akcja) this.ta = Math.random() * this.akcja.czas; }
  mow(amp, wiz = null) { this.mowi = true; this.amplituda = amp; this.wiz = wiz; }
  cicho() { this.mowi = false; this.amplituda = 0; this.wiz = null; }
  patrz(k) { this.kierunekBazowy = k; }
  // a walk with planted feet moves exactly one stride per stance: speed = stride / (stance time)
  get predkoscChodu() {
    const a = this.dane.animacje.Chod, k = a?.krok;
    if (k && Lalka.zginanie && this.nogi?.length) return (k.dlugosc ?? 0.9) * this._dlugoscNogi("profil") / ((k.podpora ?? 0.6) * a.czas);
    return (a?.predkosc ?? 1) * this.wysokosc / 1.5;
  }
  // the scene moves the puppet: a walk's phase follows the distance, so planted feet never slide (easing included)
  idz(dx) { if (this.akcja?.krok) this.ta += Math.abs(dx) / Math.max(1e-6, this.predkoscChodu); }
  // look at a point (a function returning world {x, y}, or null); `na` seconds, then back
  patrzNa(cel, na = null) { this.celSpojrzenia = cel; this.spojrzenieDo = na ? this.t + na : null; }

  // ------------------------------------------------------------ klatka
  update(dt) {
    // a statue (rytm.js): the animation's clock stops, so the pose of this moment stays; eyes and mouth still live
    this.t += dt; if (!this.zamrozona && !(this.droga && this.akcja?.krok)) this.ta += dt;   // walking on the stage: the distance drives the stride
    if (Lalka.klatki) { this.akum = (this.akum || 0) + dt; if (this.akum < 1 / Lalka.klatki) return; this.akum = 0; }
    const p = this.poza = {};
    const a = this.akcja;
    let u = 0;
    if (a) {
      u = a.czas ? this.ta / a.czas : 1;
      if (u >= 1) {
        if (a.petla) { u -= Math.floor(u); }
        else { u = 1; this.spoczynek(); if (this.naKoniec) { const f = this.naKoniec; this.naKoniec = null; f(); } return this.update(0); }
      }
      for (const [k, kl] of Object.entries(a.tory || {})) p[k] = tor(kl, u);
      for (const k of Object.keys(p)) if (!k.startsWith("p_") && !k.startsWith("t_") && p["t_" + k] === undefined && (this.kosci["t_" + k] || this.stawyNazwy.has("t_" + k))) p["t_" + k] = p[k];
      if (a.skok) p.skok = tor(a.skok, u);
      if (a.usta) p.usta = a.usta;
      if (a.oczy) p.oczy = a.oczy;
      if (a.patrz) p.kierunek = a.patrz === "prawo" && this.strona === "prawo" ? "lewo" : a.patrz;
      if (a.patrz_sekwencja) p.kierunek = sekwencja(a.patrz_sekwencja, u);
      if (a.mikro) {
        // hold + snap: nowa mikropoza co 1.5-4 s, dojscie w 0.2 s
        const m = this.mikro;
        if (this.t > m.nastepny) { m.od = { ...m.cel }; m.cel = { glowa: (Math.random() - 0.5) * 3, reka_l: (Math.random() - 0.5) * 8, reka_p: (Math.random() - 0.5) * 8, p_glowa: (Math.random() - 0.5) * 4, p_ogon: (Math.random() - 0.5) * 10 };
                                   m.start = this.t; m.nastepny = this.t + 1.5 + Math.random() * 2.5; }
        const s = Math.min(1, (this.t - m.start) / 0.2), e = s * s * (3 - 2 * s);
        for (const k of Object.keys(m.cel)) p[k] = (p[k] || 0) + (m.od[k] || 0) + ((m.cel[k] || 0) - (m.od[k] || 0)) * e;
      }
    }
    // a blend from the previous animation's last pose: every numeric channel (bones, joints, hips, height, torso)
    const B = this.przejscie;
    if (B) {
      const w = (this.t - B.start) / B.czas;
      if (w >= 1) this.przejscie = null;
      else {
        const e = w * w * (3 - 2 * w), spoczynkowe = { tulow_skala: 1 };
        for (const k of new Set([...Object.keys(B.od), ...Object.keys(p)])) {
          if (typeof p[k] === "string" || typeof B.od[k] === "string") continue;
          const v0 = B.od[k] ?? spoczynkowe[k] ?? 0, v1 = p[k] ?? spoczynkowe[k] ?? 0;
          p[k] = v0 + (v1 - v0) * e;
        }
      }
    }
    this.pozaSurowa = Object.fromEntries(Object.entries(p).filter(([, v]) => typeof v === "number"));   // before the gaze adds its own smoothed part
    // carrying: the arm that holds comes forward and bends, blended in and out over 0.25 s
    this.niesienieW = Math.max(0, Math.min(1, (this.niesienieW || 0) + (this.niesie ? 1 : -1) * dt / 0.25));
    if (this.niesienieW > 0 && this.dane.rig !== "czworonog") {
      const w = this.niesienieW * this.niesienieW * (3 - 2 * this.niesienieW);
      p.reka_p = (p.reka_p || 0) * (1 - w) + 22 * w; p.lokiec_p = (p.lokiec_p || 0) * (1 - w) + 30 * w; p.nadgarstek_p = (p.nadgarstek_p || 0) * (1 - w);
      p.t_reka_p = p.reka_p; p.t_lokiec_p = p.lokiec_p;
      p.p_reka = (p.p_reka || 0) * (1 - w) - 55 * w; p.p_lokiec = (p.p_lokiec || 0) * (1 - w) - 35 * w; p.p_nadgarstek = (p.p_nadgarstek || 0) * (1 - w);
    }
    // mruganie
    this.nastepneMrugniecie -= dt;
    if (this.mruganie >= 0) { this.mruganie += dt; if (this.mruganie > 0.28) { this.mruganie = -1; this.nastepneMrugniecie = 2 + Math.random() * 4; } }
    else if (this.nastepneMrugniecie <= 0) this.mruganie = 0;
    // widok
    const lokomocja = a && (this.dane.lokomocja || []).includes(a.nazwa);
    this._spojrzenie(p, dt, lokomocja);
    const kier = p.kierunek || this.kierunekBazowy;
    this.wProfilu = lokomocja && kier !== "przod" && kier !== "tyl" || !!(a && a.kierunek === "profil");   // kierunek profil = always the side puppet
    if (kier !== this.kierunek) { this.kierunek = kier; this.squash = 0.15; }
    if (this.widokWymuszony) this.wProfilu = this.widokWymuszony === "profil";
    this.wTyle = !this.wProfilu && kier === "tyl" && !!this.kosci.t_tulow;
    this.widokGrupy.profil.visible = !!this.wProfilu;
    this.widokGrupy.tyl.visible = this.wTyle;
    this.widokGrupy.przod.visible = !this.wProfilu && !this.wTyle;
    this.widokGrupy.profil.scale.x = kier === "lewo" ? -1 : 1;
    this._ustawTwarz();
    // kosci: kat w stopniach; znak: prawa strona odwrotnie (odbicie)
    for (const [k, g] of Object.entries(this.kosci)) {
      if (!g.userData.czesc) { g.rotation.z = -(p[k] || 0) * DEG; continue; }   // korzen: kolysanie calej lalki na stopach
      let kat = p[k] || 0;
      if (lustro(k)) kat = -kat;
      if (k === "glowa" || k === "p_glowa" || k === "t_glowa") kat = Math.max(-25, Math.min(25, kat));
      if (k === "glowa") this.katGlowy = kat;
      g.rotation.z = -(kat + (this.dane.czesci[g.userData.czesc]?.obrot || 0)) * DEG;   // obrot = base rotation of the piece, not mirrored
      if (k === "glowa") for (const kont of Object.values(this.twarzeGrupy)) kont.position.y = (p.glowa_x || 0) * 0.0022 * this.wysokosc;   // a nod slides the face up or down the head
      if (g.userData.zUniesiona !== undefined) g.position.z = Math.abs(p[k] || 0) > 45 ? g.userData.zUniesiona : g.userData.z;   // uniesiona konczyna przed glowa
      if (k === "tulow" || k === "p_cialo" || k === "t_tulow") g.scale.y = p.tulow_skala || 1;
    }
    for (const root of ["biodra", "p_biodra", "t_biodra"]) {
      const g = this.kosci[root]; if (!g) continue;
      g.position.y = g.userData.bazaY + (p.skok || 0) * this.wysokosc;
      g.position.x = g.userData.bazaX + (p.biodra_x || 0) * this.wysokosc;   // the hips shift sideways over the feet
    }
    // squash glowy przy zwrocie; glowy bok/tyl i ich twarze maja wlasny obrot bazowy wzgledem glowy z przodu
    const gl = this.kosci.glowa;
    if (gl) {
      const ob = (n) => this.dane.czesci[n]?.obrot || 0;
      for (const w of ["bok", "tyl"]) {
        const sub = this.widokiGrupy[w]; if (!sub) continue;
        const aktywna = this.widoki[w].visible;
        sub.rotation.z = aktywna ? -((this.katGlowy || 0) + ob(this.dane.glowy[w])) * DEG : 0;
        if (aktywna) gl.rotation.z = 0;               // obrot przejmuje podgrupa, wokol wlasnej osi
      }
      if (this.squash > 0) { this.squash -= dt; const q = 1 - 0.1 * Math.sin(Math.max(0, this.squash) / 0.15 * Math.PI); gl.scale.set(q, 1 / q, 1); }
      else gl.scale.set(1, 1, 1);
    }
    // order: the torso (and everything not a leg) bends and carries the head and arms, then the legs solve to the floor
    const nogi = new Set(this.nogi);
    this._zginaj(p, (L) => !nogi.has(L));
    this._niesDzieci();
    const stopy = a?.stopy ?? (this.przejscie?.stopy === "ik" ? "ik" : undefined);   // planted feet stay planted while the hips blend back
    if (a?.krok && this.wProfilu) this._krok(u, a.krok);
    else if (stopy === "ik") this._ik(p); else for (const L of this.nogi) { L.ikKaty = null; L.ikPoprz = null; }
    this._zginaj(p, (L) => nogi.has(L));
    if (stopy === "ziemia" && Lalka.zginanie) this._naZiemi();
  }

  // gaze: the head turns to 3/4 towards the target, nods towards its height and the torso leans a little;
  // an animation's own direction (patrz, locomotion, a forced view) always wins
  _spojrzenie(p, dt, lokomocja) {
    if (this.spojrzenieDo && this.t > this.spojrzenieDo) { this.celSpojrzenia = null; this.spojrzenieDo = null; }
    let cel = null;
    if (this.celSpojrzenia && !lokomocja && !p.kierunek && !this.widokWymuszony && this.akcja?.kierunek !== "profil") { try { cel = this.celSpojrzenia(); } catch { cel = null; } }
    let nod = 0, bok = 0;
    if (cel) {
      const o = new THREE.Vector3(); this.korzen.getWorldPosition(o);
      const hy = o.y + 0.8 * this.wysokosc, dx = cel.x - o.x, dy = cel.y - hy;
      p.kierunek = Math.abs(dx) < 0.22 * this.wysokosc ? "przod" : dx > 0 ? "prawo" : "lewo";
      nod = Math.max(-1, Math.min(1, Math.atan2(dy, Math.abs(dx) + 0.5 * this.wysokosc) / 0.8));
      bok = p.kierunek === "przod" ? 0 : dx > 0 ? 1 : -1;
    }
    const z = Math.min(1, dt * 6);
    this.gNod = (this.gNod || 0) + (nod - (this.gNod || 0)) * z;
    this.gBok = (this.gBok || 0) + (bok - (this.gBok || 0)) * z;
    const kier = p.kierunek || this.kierunekBazowy;
    p.glowa_x = (p.glowa_x || 0) + this.gNod * 10;                                      // nod up / down
    p.glowa = (p.glowa || 0) - this.gNod * 8 * (kier === "lewo" ? -1 : kier === "prawo" ? 1 : 0);   // a 3/4 head tilts its chin to the target
    p.tulow_2 = (p.tulow_2 || 0) + this.gBok * 4;                                       // the torso leans towards it
  }
}
