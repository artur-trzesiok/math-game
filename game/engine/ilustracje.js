// Event illustrations (accepted 2026-10-29): a painted full picture of what the puppets cannot act (a storm at night, a
// train on a bridge) lands on the screen like a big stamp - it comes in tilted and curled like paper being laid down,
// flattens, the camera creeps over it, and it slides down off the screen at the end. The characters keep speaking: the
// speaker shows in a round badge in a corner, a live picture of their head (lip-sync and all), so there is never a
// voice without a face. Assets: game/assets/ilustracje/<name>/ (tools/ilustracje/make_ilustracja.py).

import * as THREE from "three";
import { texture } from "./scene.js";

const FAST = new URLSearchParams(location.search).has("szybko");
const KAM_Z = 10, FOV = 30;
const easeOut = (s) => 1 - (1 - s) ** 3;

// the stamp's paper: white with a perforated edge (half discs bitten out all round), drawn once per size
function znaczek(w, h, b) {
  const k = 512 / Math.max(w, h), W = Math.round(w * k), H = Math.round(h * k), B = Math.max(10, Math.round(b * k));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#fffaf0"; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "destination-out";
  const r = B * 0.32, krok = r * 3.1;
  for (let p = krok / 2; p < W; p += krok) { x.beginPath(); x.arc(p, 0, r, 0, 7); x.arc(p, H, r, 0, 7); x.fill(); }
  for (let p = krok / 2; p < H; p += krok) { x.beginPath(); x.arc(0, p, r, 0, 7); x.arc(W, p, r, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// a grid plane whose vertices can be bent: z = curl * (distance from the held edge)^2
function arkusz(w, h, mat, ro) {
  const g = new THREE.PlaneGeometry(w, h, 24, 16), m = new THREE.Mesh(g, mat);
  m.userData.baza = Float32Array.from(g.attributes.position.array); m.renderOrder = ro; m.frustumCulled = false;
  return m;
}
function wygnij(m, curl, Hc) {
  const p = m.geometry.attributes.position, b = m.userData.baza;
  for (let i = 0; i < p.count; i++) { const u = (Hc / 2 - b[i * 3 + 1]) / Hc; p.setZ(i, curl * u * u * Hc); }
  p.needsUpdate = true;
}

export async function ilustracja(S, nazwa, { ruch = "najazd" } = {}) {
  const kat = `/game/assets/ilustracje/${nazwa}/`;
  const meta = await fetch(kat + "meta.json", { cache: "no-store" }).then((r) => r.json());
  const tex = await texture(kat + "obraz.webp");
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const obrazTex = tex.clone(); obrazTex.needsUpdate = true;            // its own repeat / offset for the slow push in
  const scena = new THREE.Scene(), kam = new THREE.PerspectiveCamera(FOV, S.camera.aspect, 0.1, 100);
  kam.position.set(0, 0, KAM_Z); kam.lookAt(0, 0, 0);
  const widac = () => { const h = 2 * KAM_Z * Math.tan(FOV / 2 * Math.PI / 180); return { w: h * S.camera.aspect, h }; };
  const V = widac(), ar = meta.wysokosc / meta.szerokosc;
  const H = Math.min(V.h * 0.7, V.w * 0.74 * ar), W = H / ar, b = H * 0.06, Hc = H + 2 * b;   // ~80 % of a 4:3 screen
  const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, ...o });

  const welon = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat({ color: "#1d1a17", opacity: 0 })); welon.position.z = -1; welon.renderOrder = 1;
  const papier = znaczek(W + 2 * b, Hc, b);
  const karta = new THREE.Group();
  const cien = arkusz(W + 2 * b, Hc, mat({ map: papier, color: "#000000", opacity: 0.2 }), 2); cien.position.set(0.09, -0.12, -0.05);
  const rama = arkusz(W + 2 * b, Hc, mat({ map: papier }), 3);
  const obraz = arkusz(W, H, mat({ map: obrazTex }), 4); obraz.position.z = 0.002;
  karta.add(cien, rama, obraz); scena.add(welon, karta);

  // the speaker's badge: a live render of the head of whoever speaks, a white ring round it
  const rt = new THREE.WebGLRenderTarget(256, 256, { stencilBuffer: true, depthBuffer: true });
  const kamG = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
  const R = Math.min(V.h * 0.14, 0.78);
  const plakietka = new THREE.Group(); plakietka.scale.setScalar(0.001);
  const twarz = new THREE.Mesh(new THREE.CircleGeometry(R, 48), mat({ map: rt.texture })); twarz.renderOrder = 6;
  const obwodka = new THREE.Mesh(new THREE.RingGeometry(R, R * 1.12, 48), mat({ color: "#fffaf0" })); obwodka.renderOrder = 6.1;
  const kreska = new THREE.Mesh(new THREE.RingGeometry(R * 1.12, R * 1.16, 48), mat({ color: "#3a332d" })); kreska.renderOrder = 6.2;
  plakietka.add(twarz, obwodka, kreska); plakietka.position.z = 0.6; scena.add(plakietka);
  let mowca = null, pokaz = 0;

  const t0 = performance.now();
  let curl = 1.3, gotowa = false;
  const warstwa = {
    scena, kam,
    przed: () => {
      kam.aspect = S.camera.aspect; kam.updateProjectionMatrix();
      for (const m of [cien, rama, obraz]) wygnij(m, curl, Hc);
      if (gotowa) {                                                  // the camera creeps over the picture
        const s = Math.min(1, (performance.now() - t0) / 14000), z = 1 - 0.1 * s;
        obrazTex.repeat.set(z, z);
        const dx = ruch === "w_lewo" ? (1 - z) * (1 - s) : ruch === "w_prawo" ? (1 - z) * s : (1 - z) / 2;
        obrazTex.offset.set(dx, (1 - z) / 2);
      }
      // who speaks: their head, live, in the corner on their side
      const L = S.puppets[S.ostatniMowca];
      const kto = L && L.korzen.visible ? L : null;
      if (kto !== mowca) { mowca = kto; pokaz = 0; }
      pokaz = Math.min(1, pokaz + 0.08);
      plakietka.scale.setScalar(mowca ? 0.001 + easeOut(pokaz) : 0.001);
      if (!mowca) return;
      // the badge lies nearer the camera than the picture: the frame there is smaller
      const V2 = widac(), k = (KAM_Z - 0.6) / KAM_Z, lewo = mowca.korzen.position.x < 0;
      plakietka.position.set((lewo ? -1 : 1) * (V2.w / 2 * k - R * 1.32), -V2.h / 2 * k + R * 1.32, 0.6);
      // aimed at the visible head piece's box, so any character's face sits in the middle
      const L2 = mowca, wid = L2.widokGrupy.profil?.visible ? "p_glowa" : L2.widokGrupy.tyl?.visible ? "t_glowa" : "glowa";
      const gl = L2.kosci[wid] || L2.kosci.glowa, glowa = new THREE.Vector3();
      let rozmiar = mowca.wysokosc * 0.3;
      if (gl) {
        mowca.korzen.updateMatrixWorld(true);
        const bb = new THREE.Box3().setFromObject(gl); bb.getCenter(glowa);
        rozmiar = Math.max(bb.max.y - bb.min.y, bb.max.x - bb.min.x) * 0.62;
        glowa.y -= (bb.max.y - bb.min.y) * 0.04;
      } else { mowca.korzen.getWorldPosition(glowa); glowa.y += mowca.wysokosc * 0.8; }
      kamG.position.set(glowa.x, glowa.y, glowa.z + 8); kamG.lookAt(glowa);
      kamG.fov = 2 * Math.atan(rozmiar / 8) * 180 / Math.PI; kamG.updateProjectionMatrix();
      S.renderer.setRenderTarget(rt); S.renderer.render(S.scene, kamG); S.renderer.setRenderTarget(null);
    },
  };
  S.warstwy.push(warstwa);

  // landing: from above the screen, tilted and curled like a sheet held by its top edge, it flattens as it lies down
  karta.position.y = V.h; karta.rotation.set(-0.5, 0, 0.14);
  S.sfx.graj("whoosh");
  await S.tween(FAST ? 0.2 : 0.75, (s) => {
    const e = easeOut(s);
    karta.position.y = V.h * (1 - e); karta.rotation.x = -0.5 * (1 - e); karta.rotation.z = 0.14 + (-0.025 - 0.14) * e;
    curl = 1.3 * (1 - e) - 0.12 * Math.sin(e * Math.PI);           // the paper bends, then springs flat
    welon.material.opacity = 0.62 * e;
  });
  curl = 0; S.sfx.graj("plop"); gotowa = true;
  await S.tween(FAST ? 0.05 : 0.18, (s) => karta.scale.setScalar(1.035 - 0.035 * s));

  let zniknela = false;
  const usun = () => {
    if (zniknela) return; zniknela = true;
    const i = S.warstwy.indexOf(warstwa); if (i >= 0) S.warstwy.splice(i, 1);
    rt.dispose(); papier.dispose(); obrazTex.dispose();
    for (const m of [cien, rama, obraz, twarz, obwodka, kreska, welon]) m.geometry.dispose();
    const j = S.objects.indexOf(h); if (j >= 0) S.objects.splice(j, 1);
  };
  const h = {
    kind: "ilustracja", name: nazwa, mesh: karta, base: 1, meta,
    // the end: it slides down off the screen, its leading edge lifting
    zsun: async () => {
      if (zniknela) return;
      S.sfx.graj("whoosh", { glosnosc: 0.7 });
      const V3 = widac();
      await S.tween(FAST ? 0.15 : 0.6, (s) => {
        const e = s * s; karta.position.y = -V3.h * 1.15 * e; karta.rotation.z = -0.025 + 0.12 * e; curl = -0.5 * e;
        welon.material.opacity = 0.62 * (1 - e); plakietka.scale.setScalar(0.001 + (1 - e) * (mowca ? 1 : 0));
      });
      usun();
    },
    remove: () => usun(),                                            // a cleared or skipped scene takes it at once
  };
  S.objects.push(h);
  return h;
}
