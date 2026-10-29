// Mechanics, seventh set (point 5 of the worlds plan, docs/mechaniki_na_zapas.md rows 5, 6, 9): a painted clock whose
// hands the child turns, the characters as cards that flip (guess who / who is this from behind), bundles of ten sticks
// on a place-value tray. Painted parts: tools/objects/make_objects.py sheets zegar_tarcza, zegar_wskazowki, peczki,
// mata_peczki; the cards are the memory game's (menu/karta, karta_rewers) with the puppets rendered on them.

import * as THREE from "three";
import { texture } from "./scene.js";
import { CYFRY } from "./liczby.js";
import { Lalka } from "./lalka.js";
import { v } from "./v.js";
import * as U from "./ubior.js";

const FAST = new URLSearchParams(location.search).has("szybko");
const czekaj = (s) => new Promise((ok) => setTimeout(ok, (FAST ? Math.min(s, 0.15) : s) * 1000));
const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
const TAU = Math.PI * 2;
const OBJ = (n) => `/game/assets/objects/${n}.webp`;
// a group of the stage's: known to S.objects, so S.clear() / a skipped scene takes it away
function uchwyt(S, grp, extra = {}) {
  const h = { mesh: grp, kind: "object", base: 1, size0: 1, pulse: false, home: { x: grp.position.x, y: grp.position.y }, zone: null, ...extra,
    remove: () => { grp.parent?.remove(grp); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); S.untarget(h); extra.naUsun?.(); },
    highlight: (on) => { h.pulse = on; if (!on) grp.scale.setScalar(h.base); },
    moveTo: (nx, ny, d = 0.4) => { const x0 = grp.position.x, y0 = grp.position.y; return S.tween(FAST ? Math.min(d, 0.1) : d, (s) => { grp.position.x = x0 + (nx - x0) * s; grp.position.y = y0 + (ny - y0) * s; }); } };
  S.objects.push(h); return h;
}
// a line drawn by the stage (S.line) moved into a group, keeping where it is on screen
const doGrupy = (S, grp, h) => { S.scene.remove(h.mesh); h.mesh.position.x -= grp.position.x; h.mesh.position.y -= grp.position.y; h.mesh.position.z -= grp.position.z; grp.add(h.mesh); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); };

// ===================================================================== the clock (zegar)
// A painted wall clock (zegar_tarcza: a red rim, an EMPTY cream dial) with its two painted hands (zegar_krotka,
// zegar_dluga); the twelve hour digits and ticks are drawn by the engine's pencil (gpt-image cannot be trusted with
// twelve numerals). zegar(S, {godzina, minuty}) only puts it up - a clock in a scene showing the story's time;
// `.pokaz(h, m)` turns the hands forward (time passes); `.ustaw({godzina, minuty})` is the task: the child turns the
// movable hand(s) (`ruchome`: "krotka" = the short one only, "obie") by dragging anywhere on the face; on release
// the short hand snaps to a whole hour, the long one to the full or the half hour (`polowki`). Turning the long hand
// carries the short one along, as on a real clock. A released hand standing wrong: the clock shakes (`onZle`); after
// `podpowiedzPo` misses the wanted digit gets a pencil circle. Tests: S.zegar.dokoncz().
const TARCZA = { cx: 0.5, cy: 0.496, r: 0.40 };                         // the dial inside the rim, sticker fractions
const WSKAZOWKI = { zegar_krotka: { os: 0.678, czubek: 0.237 }, zegar_dluga: { os: 0.910, czubek: 0.008 } };   // the hub's and the tip's v (shared scale)
export async function zegar(S, { x = 0, y = 0.6, size = 4.2, godzina = 12, minuty = 0, ruchome = "krotka", polowki = false, cyfry = true } = {}) {
  const [tT, tK, tD] = await Promise.all(["zegar_tarcza", "zegar_krotka", "zegar_dluga"].map((n) => texture(OBJ(n))));
  const grp = new THREE.Group(); grp.position.set(x, y, 0.4); S.scene.add(grp);
  const tarcza = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat({ map: tT, alphaTest: 0.05 })); tarcza.renderOrder = 10; grp.add(tarcza);
  const c0 = [(TARCZA.cx - 0.5) * size, (0.5 - TARCZA.cy) * size], R = TARCZA.r * size;
  const naTarczy = (a, r) => [x + c0[0] + Math.sin(a) * r, y + c0[1] + Math.cos(a) * r];   // a = clockwise from 12
  // the hands: one shared scale (the long one reaches 0.84 of the dial), each turning on its hub
  const sk = 0.84 * R / (WSKAZOWKI.zegar_dluga.os - WSKAZOWKI.zegar_dluga.czubek);
  const reka = (t, nazwa, z, ro) => {
    const g = new THREE.PlaneGeometry(sk, sk); g.translate(0, (WSKAZOWKI[nazwa].os - 0.5) * sk, 0);
    const m = new THREE.Mesh(g, mat({ map: t, alphaTest: 0.05 })); m.position.set(c0[0], c0[1], z); m.renderOrder = ro; grp.add(m); return m;
  };
  const krotka = reka(tK, "zegar_krotka", 0.02, 12), dluga = reka(tD, "zegar_dluga", 0.03, 12.1);
  const dlKrotkiej = (WSKAZOWKI.zegar_krotka.os - WSKAZOWKI.zegar_krotka.czubek) * sk;
  // digits and ticks with the pencil, dark on the cream, no white halo
  const kreski = [], miejscaCyfr = {};
  if (cyfry) {
    const rozmiar = 0.2 * R, k = rozmiar / 1.4, rd = 0.74 * R;
    for (let n = 1; n <= 12; n++) {
      const a = n / 12 * TAU, [px, py] = naTarczy(a, rd); miejscaCyfr[n % 12] = [px, py];
      const znaki = String(n).split("").map(Number), gap = 0.12 * k, szer = znaki.length * 0.9 * k + (znaki.length - 1) * gap;
      for (const [j, d] of znaki.entries()) {
        const ox = px - szer / 2 + j * (0.9 * k + gap), oy = py - rozmiar / 2, mp = ([qx, qy]) => [ox + qx * k, oy + qy * k];
        for (const s of CYFRY[d]) kreski.push(S.line(s.bezier ? { bezier: s.bezier.map(mp) } : s.map(mp), { color: "#2b2622", width: 0.09 * rozmiar * 1.4, duration: 0.01, halo: false, wait: false, strong: true, name: "zegar_cyfra", warstwa: 11 }));
      }
      const [ax, ay] = naTarczy(a, 0.93 * R), [bx, by] = naTarczy(a, 0.99 * R);
      kreski.push(S.line([[ax, ay], [bx, by]], { color: "#2b2622", width: 0.035 * R, duration: 0.01, halo: false, wait: false, strong: true, warstwa: 11 }));
    }
  }
  for (const h of await Promise.all(kreski)) doGrupy(S, grp, h);
  // the time: H = the short hand's hour (whole between drags), M = minutes 0..60
  let H = godzina % 12, M = minuty;
  const rysuj = () => { krotka.rotation.z = -((H + M / 60) / 12) * TAU; dluga.rotation.z = -(M / 60) * TAU; };
  rysuj();
  let palec = null;
  const handle = uchwyt(S, grp, { name: "zegar", naUsun: () => { if (palec && S.palec === palec) S.palec = null; if (S.zegar?.zegar === handle) S.zegar = null; } });
  S.appear(handle);
  const teraz = () => { const h = ((Math.round(H) % 12) + 12) % 12; return { godzina: h || 12, minuty: Math.round(M) % 60 }; };
  // the hands turn forward to (h, m): the story's time passes
  const pokaz = async (h, m = 0, { d = 1.2 } = {}) => {
    const t0 = H * 60 + M, roznica = (((h % 12) * 60 + m - t0) % 720 + 720) % 720;
    let ost = Math.floor(t0 / 60);
    await S.tween(FAST ? 0.15 : Math.max(0.3, d * roznica / 360), (s) => {
      const t = t0 + roznica * s; H = Math.floor(t / 60); M = t - H * 60;
      if (Math.floor(t / 60) !== ost) { ost = Math.floor(t / 60); S.sfx.graj("tap", { glosnosc: 0.35 }); }
      rysuj();
    });
    H = ((h % 12) + 12) % 12; M = m; rysuj();
  };
  const ustaw = ({ godzina: hc, minuty: mc = 0, onZle = null, podpowiedzPo = 2 } = {}) => new Promise((gotowe) => {
    const cel = ((hc % 12) + 12) % 12, mozna = ruchome === "obie" ? ["krotka", "dluga"] : [ruchome];
    let reka = null, ostKat = 0, zle = 0, koniec = false, kolko = null, przeskok = 0;
    const kat = ([px, py]) => { const a = Math.atan2(px - x - c0[0], py - y - c0[1]); return a < 0 ? a + TAU : a; };
    const roznicaKatow = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
    const zakoncz = async () => {
      if (koniec) return; koniec = true; if (S.palec === palec) S.palec = null; palec = null; S.zegar = null;
      kolko?.remove(); S.sfx.graj("right"); S.bump(handle, 0.08, false);
      gotowe(teraz());
    };
    const ocen = async (ktora) => {
      const t = teraz(), hOk = (t.godzina % 12) === cel, mOk = t.minuty === mc % 60;
      if (hOk && mOk) return zakoncz();
      if ((ktora === "krotka" && !hOk) || (ktora === "dluga" && !mOk)) {
        zle++; S.shake(handle); onZle?.(t);
        if (zle >= podpowiedzPo && !kolko && miejscaCyfr[ktora === "krotka" ? cel : (mc === 30 ? 6 : 0)]) {
          const [px, py] = miejscaCyfr[ktora === "krotka" ? cel : (mc === 30 ? 6 : 0)], r = 0.17 * R;
          kolko = await S.line(Array.from({ length: 41 }, (_, j) => { const a = j / 40 * TAU * 1.1 + 2.2; return [px + Math.cos(a) * r, py + Math.sin(a) * r]; }), { color: "#ff5a1f", width: 0.06 * R, duration: 0.4, strong: true, warstwa: 12.5 });
        }
      }
    };
    const pusc = async () => {
      const ktora = reka; reka = null; if (!ktora) return;
      // the snap: a whole hour; the long hand to the full (or the half) hour, carrying the short one past 12
      if (ktora === "krotka") { const H0 = H, H1 = Math.round(H); await S.tween(0.12, (s) => { H = H0 + (H1 - H0) * s; rysuj(); }); H = H1; }
      else {                                                        // in whole minutes, so the short hand follows the long one
        const krok = polowki ? 30 : 60, t0 = H * 60 + M, t1 = H * 60 + Math.round(M / krok) * krok;
        await S.tween(0.12, (s) => { const t = t0 + (t1 - t0) * s; H = Math.floor(t / 60); M = t - H * 60; rysuj(); });
        H = Math.floor(t1 / 60); M = t1 - H * 60;
      }
      H = ((Math.round(H) % 12) + 12) % 12; rysuj();
      S.sfx.graj("tap");
      await ocen(ktora);
    };
    palec = {
      down: (p) => {
        if (koniec || Math.hypot(p[0] - x - c0[0], p[1] - y - c0[1]) > R * 1.15) return false;
        const a = kat(p), r = Math.hypot(p[0] - x - c0[0], p[1] - y - c0[1]);
        // the hand nearest the finger's direction; where both are near, the finger's distance decides
        const kK = Math.abs(roznicaKatow(a, -krotka.rotation.z)), kD = Math.abs(roznicaKatow(a, -dluga.rotation.z));
        reka = mozna.length === 1 ? mozna[0] : (Math.abs(kK - kD) < 0.5 ? (r > dlKrotkiej * 1.05 ? "dluga" : "krotka") : (kK < kD ? "krotka" : "dluga"));
        ostKat = a; przeskok = Math.floor(H + M / 60); S.sfx.graj("tap", { glosnosc: 0.5 });
        return true;
      },
      move: (p) => {
        if (!reka || koniec) return;
        const a = kat(p), d = roznicaKatow(a, ostKat); ostKat = a;
        if (reka === "krotka") H += d / TAU * 12;
        else { M += d / TAU * 60; while (M >= 60) { M -= 60; H += 1; } while (M < 0) { M += 60; H -= 1; } }
        rysuj();
        const g = Math.floor(H + M / 60 + (reka === "dluga" ? 0 : 0)), q = reka === "dluga" ? Math.floor(M / 5) : g;
        if (q !== przeskok) { przeskok = q; S.sfx.graj("tap", { glosnosc: 0.3 }); }
      },
      up: () => { pusc(); },
    };
    S.palec = palec;
    S.zegar = { zegar: handle, dokoncz: async () => { reka = null; await pokaz(cel, mc % 60, { d: 0.4 }); await zakoncz(); } };
  });
  return { kind: "zegar", mesh: grp, handle, pokaz, ustaw, teraz, remove: () => handle.remove() };
}

// ===================================================================== the characters as cards (portrety)
// Every character can stand on a card: its puppet (the same cut-out pieces the stage uses) rendered once, at rest, in
// the view asked for - "przod", "tyl" (from behind) or "profil" - dressed in `ubrania` ({kto: ["okulary", ...]},
// the wardrobe's garments: who has glasses, who a hat), framed to the head (`kadr` "glowa": a head badge with the
// shoulders) or the whole body ("cala"). The cards are the memory game's (menu/karta, karta_rewers on the back).
// portrety(S, {postacie}) lays them out face up and returns two tasks:
//   .odrzuc({pasuje}) - "who has glasses? not him - turn him over": the child taps the cards that do NOT fit; each
//     turns face down. A card that fits shakes and stays (`onZle`). Resolves when only fitting cards are up, with
//     their names; one left = the answer (it bumps).
//   .znajdz(kto) - the cards show `widok` (the back, the side); a tapped card turns round to the front: the right one
//     stays, any other shows who it was, shakes (`onZle`) and turns back.
// Tests: S.portrety.dokoncz(); the cards to tap carry `dobry` for the autopilot.
const PORTRETY = new Map();
async function portret(S, kto, { widok = "przod", kadr = "glowa", ubrania = [], px = 400, aspekt = 0.73 } = {}) {
  const klucz = [kto, widok, kadr, ubrania.join("+")].join("|");
  if (PORTRETY.has(klucz)) return PORTRETY.get(klucz);
  const p = (async () => {
    const meta = await fetch(v(`/game/assets/characters/${kto}/meta.json`), { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    const L = await Lalka.wczytaj(`/game/assets/characters/${kto}/`, { wysokosc: meta.wysokosc ?? 3.6 });
    L.name = kto; L.emocja.usta = "usmiech";
    L.korzen.traverse((o) => { if (o.isMesh) { o.material.depthTest = false; o.material.depthWrite = false; o.renderOrder = 20; } });
    if (widok === "profil") { L.widokWymuszony = "profil"; L.patrz("prawo"); } else L.patrz(widok === "tyl" ? "tyl" : "przod");
    for (let i = 0; i < 4; i++) L.update(0.4);                       // the view's blend and squash settled
    L.nastepneMrugniecie = 99; L.mruganie = -1;
    const F = { puppets: { [kto]: L }, sfx: { graj() {} }, tween: async () => {} };   // the wardrobe needs only these
    for (const r of ubrania) await U.ubierz(F, kto, r, { pop: false });
    L.update(0); U.ruszUbiory(F); L.korzen.updateMatrixWorld(true);
    // the frame: what is visible of the head (with its hat and glasses) or of the whole body
    const pudlo = (o) => { const b = new THREE.Box3(), t = new THREE.Box3(); o.traverseVisible((m) => { if (m.isMesh) { m.geometry.computeBoundingBox(); t.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); b.union(t); } }); return b; };
    const glowa = widok === "tyl" ? L.kosci.t_glowa : widok === "profil" ? L.kosci.p_glowa : L.kosci.glowa;
    const b = kadr === "glowa" && glowa ? pudlo(glowa) : pudlo(L.korzen);
    let w = b.max.x - b.min.x, h = b.max.y - b.min.y, cx = (b.min.x + b.max.x) / 2, cy = (b.min.y + b.max.y) / 2;
    if (kadr === "glowa") { h *= 1.3; w *= 1.2; cy -= h * 0.08; } else { h *= 1.06; w *= 1.08; }
    if (w / h > aspekt) h = w / aspekt; else w = h * aspekt;
    const kam = new THREE.OrthographicCamera(cx - w / 2, cx + w / 2, cy + h / 2, cy - h / 2, -50, 50);
    const scena = new THREE.Scene(); scena.add(L.korzen);
    // an sRGB target (blended in linear, stored as sRGB); the colour ends premultiplied by the blending onto transparent black
    const rt = new THREE.WebGLRenderTarget(Math.round(px * aspekt), px, { depthBuffer: true, stencilBuffer: true, colorSpace: THREE.SRGBColorSpace });
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    const r = S.renderer, kolor = r.getClearColor(new THREE.Color()), alfa = r.getClearAlpha();
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(true, true, true); r.render(scena, kam);
    r.setRenderTarget(null); r.setClearColor(kolor, alfa);
    scena.remove(L.korzen);
    return rt.texture;
  })();
  PORTRETY.set(klucz, p); p.catch(() => PORTRETY.delete(klucz));
  return p;
}
const materialPortretu = (t) => new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
export async function portrety(S, { postacie, ubrania = {}, widok = "przod", kadr = null, x = 0, y = 0.75, kolumny = null, szer = null } = {}) {
  const n = postacie.length;
  kolumny = kolumny || (n <= 3 ? n : Math.min(4, Math.ceil(n / 2)));
  const wiersze = Math.ceil(n / kolumny);
  szer = szer || Math.min(1.75, 7.0 / kolumny - 0.3, (wiersze > 1 ? 4.3 / wiersze : 3.6) / 1.4);
  const wys = szer * 1.38, odstep = 0.3;
  kadr = kadr || (widok === "przod" ? "glowa" : "cala");
  const [kartaT, ...obrazy] = await Promise.all([texture("/game/assets/menu/karta.webp"), ...postacie.map((k) => portret(S, k, { widok, kadr, ubrania: ubrania[k] || [] }))]);
  const przody = widok === "przod" ? obrazy : await Promise.all(postacie.map((k) => portret(S, k, { widok: "przod", kadr: "glowa", ubrania: ubrania[k] || [] })));
  const rewersT = await texture(OBJ("karta_rewers"));
  const karty = [];
  for (const [i, kto] of postacie.entries()) {
    const c = i % kolumny, r = Math.floor(i / kolumny), wRzedzie = Math.min(kolumny, n - r * kolumny);
    const grp = new THREE.Group(); grp.position.set(x + (c - (wRzedzie - 1) / 2) * (szer + odstep), y + ((wiersze - 1) / 2 - r) * (wys + odstep), 0.4); S.scene.add(grp);
    const lico = new THREE.Group(), tyl = new THREE.Group(); grp.add(lico, tyl); tyl.visible = false;
    const papier = new THREE.Mesh(new THREE.PlaneGeometry(szer, wys), mat({ map: kartaT, alphaTest: 0.05 })); papier.renderOrder = 10; lico.add(papier);
    const plan = (t) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(szer * 0.88, szer * 0.88 / 0.73), materialPortretu(t)); m.position.z = 0.01; m.renderOrder = 10.5; return m; };
    const widokM = plan(obrazy[i]), przodM = widok === "przod" ? widokM : plan(przody[i]); lico.add(widokM); if (przodM !== widokM) { przodM.visible = false; lico.add(przodM); }
    const rew = new THREE.Mesh(new THREE.PlaneGeometry(wys * 1.0, wys * 1.0), mat({ map: rewersT, alphaTest: 0.05 })); rew.renderOrder = 10; tyl.add(rew);
    const h = uchwyt(S, grp, { name: `portret_${kto}`, kto, otwarta: true, dobry: false });
    const obrot = async (zmien) => {
      await S.tween(FAST ? 0.04 : 0.16, (s) => { grp.scale.x = Math.max(0.01, 1 - s); });
      zmien();
      await S.tween(FAST ? 0.04 : 0.16, (s) => { grp.scale.x = Math.max(0.01, s); }); grp.scale.x = 1;
    };
    h.obroc = (otworz) => obrot(() => { lico.visible = otworz; tyl.visible = !otworz; h.otwarta = otworz; });
    h.odwrocDoPrzodu = (tak) => obrot(() => { widokM.visible = !tak || przodM === widokM; przodM.visible = tak || przodM === widokM; h.przodem = tak; });
    karty.push(h); S.appear(h, i > 0);
  }
  const wybierz = async (lista, dobre, nazwa) => {
    karty.forEach((h) => (h.dobry = dobre.includes(h)));
    const d = { dokoncz: async () => { const h = karty.find((k) => k.dobry && lista.includes(k)); if (h) S.clickOn(h); } };
    const cel = (c) => Object.defineProperty(S, "zachetaCel", { configurable: true, writable: true, value: c });   // the waiting hint points there
    S.portrety = d; cel(dobre[0] || null);
    const hit = await S.choose(lista);
    if (S.portrety === d) S.portrety = null;
    cel(null); return hit;
  };
  const odrzuc = async ({ pasuje, onZle = null } = {}) => {
    const zostaje = (h) => !!pasuje(h.kto, h);
    for (;;) {
      const otwarte = karty.filter((h) => h.otwarta), zle = otwarte.filter((h) => !zostaje(h));
      if (!zle.length) break;
      const hit = await wybierz(otwarte, zle, "odrzuc");
      if (!hit) continue;
      if (zostaje(hit)) { S.shake(hit); onZle?.(hit.kto); await czekaj(0.4); }
      else { S.sfx.graj("tap"); await hit.obroc(false); }
    }
    karty.forEach((h) => (h.dobry = false));
    const zostaly = karty.filter((h) => h.otwarta);
    S.sfx.graj("right");
    if (zostaly.length === 1) { await S.bump(zostaly[0], 0.2, false); }
    return zostaly.map((h) => h.kto);
  };
  const znajdz = async (kto, { onZle = null } = {}) => {
    for (;;) {
      const lista = karty.filter((h) => h.otwarta && !h.przodem);
      const hit = await wybierz(lista, lista.filter((h) => h.kto === kto), "znajdz");
      if (!hit) continue;
      S.sfx.graj("tap");
      if (widok !== "przod") await hit.odwrocDoPrzodu(true);
      if (hit.kto === kto) { S.sfx.graj("right"); await S.bump(hit, 0.2, false); return hit.kto; }
      S.shake(hit); onZle?.(hit.kto);
      await czekaj(1.2);
      if (widok !== "przod") await hit.odwrocDoPrzodu(false);
    }
  };
  return { kind: "portrety", karty, odrzuc, znajdz, ostatni: () => karty.filter((h) => h.otwarta).map((h) => h.kto), remove: () => karty.forEach((h) => h.remove()) };
}

// ===================================================================== bundles of ten (peczki)
// A painted wooden tray (mata_peczki) with two felt compartments: bunches on the left, single sticks on the right
// (its badges show which); painted sticks (patyczek) lie in a heap below it. The child drags sticks (or tied bunches)
// from the heap onto the tray - a tap on a stick in the heap puts it there too - and back off it to take away. When a
// tenth single stick lands, the ten gather and the painted red twine (wstazka_peczka) ties them into a bunch, which
// moves to the bunches' side. A tapped bunch on the tray unties into ten sticks (regrouping, for taking away).
// `.uloz({cel})` is the task: make the tray hold `cel` (bunches x 10 + sticks, every ten tied); a move past it (one
// stick too many, a whole bunch taken where only sticks should go) jumps back with a shake (`onZle(powod)`, powod
// "za_duzo" | "za_malo"). Tests: S.peczki.dokoncz().
const MATA = { lewa: [0.059, 0.485], prawa: [0.517, 0.941], v: [0.305, 0.656] };   // the felt compartments, sticker fractions
const PATYK = { szer: 0.106 };                                                       // the stick's drawn width per its length
const WSTAZKA = { szer: 0.574 };                                                     // the twine's width per stick length (same sheet scale)
export async function peczki(S, { peczki: nP = 0, patyczki: nS = 0, zapas = 0, zapasPeczki = 0, x = 0, y = 0.9, size = 6.6, L = 1.25 } = {}) {
  const [tPat, tWst] = await Promise.all([texture(OBJ("patyczek")), texture(OBJ("wstazka_peczka"))]);
  const mata = await S.object("mata_peczki", { x, y, size, z: 0.3 });
  mata.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9.6; });
  const komora = (u) => ({ x: x + ((u[0] + u[1]) / 2 - 0.5) * size, y: y + (0.5 - (MATA.v[0] + MATA.v[1]) / 2) * size, w: (u[1] - u[0]) * size, h: (MATA.v[1] - MATA.v[0]) * size });
  const lewa = komora(MATA.lewa), prawa = komora(MATA.prawa);
  const naMacie = (p) => Math.abs(p.x - x) < size * 0.5 && p.y < y + size * 0.27 && p.y > y - size * 0.27;
  const rzeczy = [];                                                  // every stick and bunch: the drag set's live list
  const geoPatyka = new THREE.PlaneGeometry(1, 1);
  // a stick: the painted sticker on a plane, its group scaled by its length (as S.object's stickers)
  const patyczek = (px, py, rot = 0) => {
    const g = new THREE.Group(); g.position.set(px, py, 0.4); g.rotation.z = rot; g.scale.setScalar(L); S.scene.add(g);
    const icon = new THREE.Mesh(geoPatyka, mat({ map: tPat, alphaTest: 0.05 })); icon.renderOrder = 10; g.add(icon);
    const h = uchwyt(S, g, { name: "patyczek", icon, base: L, size0: L, wartosc: 1, gdzie: "zapas" });
    const r0 = h.remove; h.remove = () => { r0(); const i = rzeczy.indexOf(h); if (i >= 0) rzeczy.splice(i, 1); };
    rzeczy.push(h); return h;
  };
  // a bunch: ten sticks side by side in a slight fan and the twine over their middle
  const SZER_PECZKA = 0.68, krok = (SZER_PECZKA - PATYK.szer) / 9;      // a bunch is 0.68 of a stick length wide
  const ukladPeczka = (i) => [(i - 4.5) * krok * L, ((i * 7) % 3 - 1) * 0.02 * L, (i - 4.5) * 0.018];
  const peczek = (px, py, { wstazka = true } = {}) => {
    const g = new THREE.Group(); g.position.set(px, py, 0.4); S.scene.add(g);
    const pal = [];
    for (let i = 0; i < 10; i++) { const [dx, dy, r] = ukladPeczka(i); const m = new THREE.Mesh(geoPatyka, mat({ map: tPat, alphaTest: 0.05 })); m.scale.setScalar(L); m.position.set(dx, dy, i * 0.001); m.rotation.z = r; m.renderOrder = 10; g.add(m); pal.push(m); }
    const sw = SZER_PECZKA / WSTAZKA.szer;
    const w = new THREE.Mesh(geoPatyka, mat({ map: tWst, alphaTest: 0.05 })); w.scale.setScalar(L * sw); w.position.set(0, -0.04 * L, 0.02); w.renderOrder = 10.2; g.add(w);
    if (!wstazka) w.scale.setScalar(0.001);
    const h = uchwyt(S, g, { name: "peczek", wartosc: 10, gdzie: "zapas", wstazka: w, wstazkaSkala: L * sw, pal });
    const r0 = h.remove; h.remove = () => { r0(); const i = rzeczy.indexOf(h); if (i >= 0) rzeczy.splice(i, 1); };
    rzeczy.push(h); return h;
  };
  const obroc = (h, rot, d) => { const r0 = h.mesh.rotation.z; return S.tween(FAST ? Math.min(d, 0.1) : d, (s) => { h.mesh.rotation.z = r0 + (rot - r0) * s; }); };
  const idz = (h, px, py, rot, d = 0.3) => Promise.all([h.moveTo(px, py, d), obroc(h, rot, d)]);
  // where everything lies: bunches in a row on the left (two rows of smaller ones past three), sticks upright on the
  // right, the heap below the tray (bunches first, the sticks lying askew)
  const uloz = async (d = 0.3) => {
    const pk = rzeczy.filter((h) => h.gdzie === "mata" && h.wartosc === 10), st = rzeczy.filter((h) => h.gdzie === "mata" && h.wartosc === 1);
    const ruchy = [];
    const dwaRzedy = pk.length > 3, sk = dwaRzedy ? 0.82 : 1, naRzad = dwaRzedy ? Math.ceil(pk.length / 2) : pk.length;
    pk.forEach((h, i) => {
      const r = dwaRzedy ? Math.floor(i / naRzad) : 0, j = i - r * naRzad, ile = dwaRzedy ? (r ? pk.length - naRzad : naRzad) : pk.length;
      const sp = Math.min(0.95 * L * sk, (lewa.w - 0.9 * L * sk) / Math.max(1, ile - 1));
      const py = dwaRzedy ? lewa.y + (r ? -1 : 1) * lewa.h * 0.24 : lewa.y;
      h.base = sk; h.mesh.scale.setScalar(sk);
      ruchy.push(idz(h, lewa.x + (j - (ile - 1) / 2) * sp, py, 0, d));
    });
    const sps = Math.min(0.3 * L, (prawa.w - 0.4 * L) / Math.max(1, st.length - 1));
    st.forEach((h, i) => (h.base = L, h.mesh.scale.setScalar(L)));
    st.forEach((h, i) => ruchy.push(idz(h, prawa.x + (i - (st.length - 1) / 2) * sps, prawa.y + (i % 2) * 0.03, 0, d)));
    const kupka = [...rzeczy.filter((h) => h.gdzie === "zapas" && h.wartosc === 10), ...rzeczy.filter((h) => h.gdzie === "zapas" && h.wartosc === 1)];
    const dol = y - size * 0.27;
    kupka.forEach((h, i) => {
      const kol = i % 5, rz = Math.floor(i / 5), los = ((i * 37) % 11) / 11 - 0.5;
      h.base = h.wartosc === 10 ? 0.8 : L; h.mesh.scale.setScalar(h.base);
      ruchy.push(idz(h, x - 2.6 + kol * 1.3 + (rz % 2) * 0.55 + los * 0.25, dol - 0.55 - rz * 0.38 + los * 0.1, Math.PI / 2 + los * 0.6, d));
    });
    await Promise.all(ruchy);
  };
  for (let i = 0; i < nP; i++) peczek(lewa.x, lewa.y).gdzie = "mata";
  for (let i = 0; i < nS; i++) patyczek(prawa.x, prawa.y).gdzie = "mata";
  for (let i = 0; i < zapasPeczki; i++) peczek(x, y - size * 0.3);
  for (let i = 0; i < zapas; i++) patyczek(x, y - size * 0.3);
  await uloz(0.01);
  rzeczy.forEach((h, i) => S.appear(h, i > 0));
  const wartosc = () => rzeczy.filter((h) => h.gdzie === "mata").reduce((a, h) => a + h.wartosc, 0);
  const ile = () => ({ peczki: rzeczy.filter((h) => h.gdzie === "mata" && h.wartosc === 10).length, patyczki: rzeczy.filter((h) => h.gdzie === "mata" && h.wartosc === 1).length });
  // ten single sticks gather on the right and the twine ties them; the bunch goes to the left
  const zwiaz = async () => {
    const dziesiec = rzeczy.filter((h) => h.gdzie === "mata" && h.wartosc === 1).slice(0, 10);
    await Promise.all(dziesiec.map((h, i) => { const [dx, dy, r] = ukladPeczka(i); return idz(h, prawa.x + dx, prawa.y + dy, r, 0.3); }));
    const P = peczek(prawa.x, prawa.y, { wstazka: false }); P.gdzie = "mata";
    dziesiec.forEach((h) => h.remove());
    S.sfx.graj("pop");
    await S.tween(FAST ? 0.1 : 0.35, (s) => { const q = 1 + 0.25 * Math.sin(s * Math.PI); P.wstazka.scale.setScalar(Math.max(0.001, P.wstazkaSkala * s * q)); });
    P.wstazka.scale.setScalar(P.wstazkaSkala);
    await czekaj(0.35); S.sfx.graj("whoosh", { glosnosc: 0.6 });
    await uloz();
  };
  // a bunch unties: the twine drops off and its ten sticks join the single ones
  const rozwiaz = async (P) => {
    S.sfx.graj("pop");
    await S.tween(FAST ? 0.1 : 0.3, (s) => { P.wstazka.scale.setScalar(Math.max(0.001, P.wstazkaSkala * (1 - s))); P.wstazka.position.y = -0.04 * L - s * 0.4; });
    const sk = P.base, nowe = P.pal.map((m) => { const w = new THREE.Vector3(); m.getWorldPosition(w); const h = patyczek(w.x, w.y, m.rotation.z); h.gdzie = "mata"; return h; });
    nowe.forEach((h) => h.mesh.scale.setScalar(L * sk));
    P.remove();
    await uloz();
  };
  let kolejka = Promise.resolve();
  const zadanie = ({ cel, onZle = null, wiaz = true, rozwiazuj = true } = {}) => new Promise((gotowe) => {
    let koniec = false;
    const sprawdz = () => {
      if (koniec || wartosc() !== cel || ile().patyczki >= 10) return;
      koniec = true; S.endSort(); S.peczki = null; S.sfx.graj("right"); S.bump(mata, 0.05, false);
      gotowe(ile());
    };
    const zle = async (h, powod) => { S.shake(h); onZle?.(powod); await czekaj(0.35); await uloz(); };
    const naMate = async (h) => {
      if (h.gdzie === "mata") return uloz();
      if (wartosc() + h.wartosc > cel && wartosc() < cel + 1) return zle(h, "za_duzo");        // past the number: back it jumps
      h.gdzie = "mata"; S.sfx.graj("plop");
      await uloz(0.25);
      if (wiaz && ile().patyczki >= 10) await zwiaz();
      sprawdz();
    };
    const zMaty = async (h) => {
      if (h.gdzie !== "mata") return uloz();
      if (wartosc() - h.wartosc < cel && wartosc() > cel - 1) return zle(h, "za_malo");          // too much taken away
      h.gdzie = "zapas"; S.sfx.graj("plop");
      await uloz(0.25); sprawdz();
    };
    // moves one after another: a stick dropped while ten are being tied waits its turn
    const przez = (f) => (...a) => (kolejka = kolejka.then(() => (koniec ? uloz() : f(...a))).catch((e) => console.error(e)));
    const set = {
      items: rzeczy, peczki: { cel, wartosc },
      onTap: przez(async (h) => {
        if (h.gdzie === "zapas") return naMate(h);                                             // a tap in the heap: onto the tray
        if (h.wartosc === 10 && rozwiazuj) { await rozwiaz(h); sprawdz(); }
      }),
      onDrop: przez(async (h, p) => (naMacie(p) ? naMate(h) : zMaty(h))),
    };
    S.free(set);
    // the driver: sticks or bunches on, bunches untied when only sticks can go
    S.peczki = { dokoncz: async () => {
      for (let n = 0; n < 60 && !koniec; n++) {
        const w = wartosc();
        if (w < cel) { const h = (cel - w >= 10 && rzeczy.find((q) => q.gdzie === "zapas" && q.wartosc === 10)) || rzeczy.find((q) => q.gdzie === "zapas" && q.wartosc === 1); if (!h) break; await set.onDrop(h, { x: prawa.x, y: prawa.y }); }
        else if (w > cel) {
          const s = rzeczy.find((q) => q.gdzie === "mata" && q.wartosc === 1), b = rzeczy.find((q) => q.gdzie === "mata" && q.wartosc === 10);
          if (w - cel >= 10 && b) await set.onDrop(b, { x, y: y - size }); else if (s) await set.onDrop(s, { x, y: y - size }); else if (b) await set.onTap(b); else break;
        } else { if (ile().patyczki >= 10) await zwiaz(); sprawdz(); }
      }
    } };
    sprawdz();
  });
  return { kind: "peczki", mesh: mata.mesh, mata, rzeczy, wartosc, ile, uloz: zadanie, zwiaz, rozwiaz, remove: () => { S.endSort(); rzeczy.slice().forEach((h) => h.remove()); mata.remove(); } };
}
