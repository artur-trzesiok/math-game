// Raster background with a rig: the plate is one textured quad, every mover
// (cut out of the second generation by difference) bends in the vertex shader.
// Grass and plants are the puppets' bendable mesh (siatka.js): a grid trimmed to the
// alpha, s = geodesic distance from the root up each blade, and three bend lines the
// wind turns the tuft around - a wave running from the root to the tips, so every blade
// arcs instead of the whole tuft shearing. Each vertex turns around the bend line under
// itself (not one point: a tuft is wide). Clouds drift as one quad.

import * as THREE from "three";
import { v } from "./v.js";
import { baza, wysokoscS, pasmo } from "./siatka.js";

export const czas = { value: 0 };
export const zginanieTla = { value: 1 };          // 0: the old shear (A/B)
const LINIE = [0.4, 0.62, 0.82], MIEKKOSC = 0.35;  // bend lines along the blade and their band width
const SWIEZO = { cache: "no-store" };
const ladowacz = new THREE.TextureLoader();

function tekstura(url) {
  return new Promise((ok, zle) => ladowacz.load(v(url), (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = 4;
    ok(t);
  }, undefined, zle));
}

function materialRuchu(mapa, moc, faza, sway, linie = null) {
  const L = linie || { sk: [2, 2, 2], h: [0.1, 0.1, 0.1], jy: [0, 0, 0] };
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { czas, zgin: zginanieTla, moc: { value: moc }, faza: { value: faza }, sway: { value: sway ? 1 : 0 }, mapa: { value: mapa },
                sk: { value: L.sk }, hh: { value: L.h }, jy: { value: L.jy }, siatka: { value: linie ? 1 : 0 } },
    vertexShader: `
      uniform float czas, moc, faza, sway, zgin, siatka;
      uniform float sk[3], hh[3], jy[3];
      attribute float waga;
      attribute float s;
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec3 p = position;
        float t = czas * 1.1 + faza * 6.2831;
        if (sway > 0.5 && siatka > 0.5 && zgin > 0.5) {
          // the wind bends the tuft along its blades: three bend lines, the gust reaching each a moment later
          for (int k = 2; k >= 0; k--) {
            float tk = t - float(k) * 0.55;
            float f = -(sin(tk) + 0.35 * sin(tk * 2.7 + 1.0) + 0.25) * 0.3 * smoothstep(sk[k] - hh[k] * 0.5, sk[k] + hh[k] * 0.5, s);
            float dy = p.y - jy[k];
            p.x -= dy * sin(f); p.y = jy[k] + dy * cos(f);
          }
        }
        // the old rig: the tuft shears sideways; clouds drift and bob - bold, it has to read from the sofa
        else if (sway > 0.5) { p.x += (sin(t) + 0.35 * sin(t * 2.7 + 1.0)) * moc * waga; p.y -= abs(sin(t)) * moc * 0.12 * waga; }
        else { p.x += sin(t * 0.33) * moc; p.y += cos(t * 0.19) * moc * 0.35; }
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D mapa;
      varying vec2 vUv;
      void main(){
        vec4 k = texture2D(mapa, vUv);
        if (k.a < 0.02) discard;
        gl_FragColor = k;
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * @param scena   grupa, do ktorej trafia tlo
 * @param wymiar  (z) -> {w, h} widocznego prostokata na glebokosci z
 * @param opcje   {katalog, zTla, zChmur, zTrawy, odlegloscKamery, podniesChmury}
 */
// a lamp's glow (rekwizyty.json `poswiaty`: {x, y, r} in plate pixels, `kolor`): an additive radial light over the
// plate whose radius and strength breathe a little, like a warm light that is alive
function poswiata(p, s, z, W, H, srodekY) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(p.r * 2.4 * s, p.r * 2.4 * s), new THREE.ShaderMaterial({
    uniforms: { czas, kolor: { value: new THREE.Color(p.kolor || "#ffcf7a") }, moc: { value: p.moc ?? 0.55 }, faza: { value: p.faza ?? 0 } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float czas, moc, faza; uniform vec3 kolor; varying vec2 vUv;
      void main() {
        float t = czas + faza * 6.2831;
        float oddech = 0.5 + 0.5 * sin(t * 1.3) * 0.7 + 0.15 * sin(t * 3.1 + 1.7) + 0.08 * sin(t * 7.9);   // slow swell, a faint flicker
        float r = length(vUv - 0.5) * 2.4 / (0.9 + 0.12 * oddech);
        float a = pow(max(0.0, 1.0 - r), 2.2) * moc * (0.75 + 0.35 * oddech);
        gl_FragColor = vec4(kolor * a, a);
      }`,
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  }));
  m.position.set((p.x - W / 2) * s, (H / 2 - p.y) * s + srodekY, z);
  m.renderOrder = 1; m.frustumCulled = false;
  return m;
}

export async function zbudujTlo(scena, wymiar, opcje = {}) {
  const kat = opcje.katalog ?? "tlo/";
  const Z_TLA = opcje.zTla ?? -9, Z_CHMUR = opcje.zChmur ?? -8.4, Z_TRAWY = opcje.zTrawy ?? -1.2;
  const kamZ = opcje.odlegloscKamery ?? 7.2;
  const opis = await (await fetch(v(kat + "rekwizyty.json"), SWIEZO)).json();
  const W = opis.szerokosc, H = opis.wysokosc;
  const { w: pw, h: ph } = wymiar(Z_TLA);
  // cover, with the plate's raised centre (srodekY) still covering the bottom edge - a panorama is scaled by its
  // height, and without the margin a blue strip showed under it
  const s0 = Math.max(pw / W, (ph + 2 * Math.abs(opcje.srodekY ?? 0)) / H) * 1.02;

  const plyta = new THREE.Mesh(new THREE.PlaneGeometry(W * s0, H * s0),
    new THREE.MeshBasicMaterial({ map: await tekstura(kat + opis.plyta) }));
  // srodek plyty w srodku kadru na tej glebokosci (kamera patrzy lekko w dol)
  plyta.position.set(0, opcje.srodekY ?? 0, Z_TLA);
  plyta.userData.plyta = true;
  scena.add(plyta);

  for (const r of opcje.bezRekwizytow ? [] : opis.rekwizyty) {
    const z = r.klasa === "drift" ? Z_CHMUR : Z_TRAWY;
    // rekwizyt blizej kamery musi byc mniejszy, zeby rzutowal sie tak jak na plycie
    const s = s0 * (kamZ - z) / (kamZ - Z_TLA);
    const mapa = await tekstura(kat + r.plik);
    let g, linie = null;
    if (r.klasa === "sway") {
      // a tuft: the bendable mesh, rooted along its bottom edge (the lowest few percent stay put)
      const bb = { x: 0, y: 0, w: r.w, h: r.h };
      const B = baza(mapa.image, bb, [r.w / 2, r.h * 0.94], [r.w / 2, r.h * 2], "gora");
      const n = B.px.length, pos = new Float32Array(3 * n), uv = new Float32Array(2 * n);
      for (let v = 0; v < n; v++) {
        pos[3 * v] = (B.px[v] - r.w / 2) * s; pos[3 * v + 1] = (r.h / 2 - B.py[v]) * s;
        uv[2 * v] = B.px[v] / r.w; uv[2 * v + 1] = 1 - B.py[v] / r.h;
      }
      g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      g.setAttribute("s", new THREE.BufferAttribute(B.vs, 1));
      g.setIndex(B.index);
      linie = { sk: LINIE, h: LINIE.map((k) => pasmo(k, MIEKKOSC)), jy: LINIE.map((k) => (r.h / 2 - wysokoscS(B, k)) * s) };
    } else g = new THREE.PlaneGeometry(r.w * s, r.h * s, 6, 10);
    // the old rig (A/B and clouds): a weight per vertex, root (bottom) 0, tip 1, squared
    const poz = g.attributes.position, waga = new Float32Array(poz.count);
    for (let i = 0; i < poz.count; i++) {
      const u = (poz.getY(i) + r.h * s / 2) / (r.h * s);
      // the lower third stays put (a pot, a root), the top bends most
      waga[i] = r.klasa === "sway" ? Math.pow(Math.max(0, (u - 0.3) / 0.7), 2) : 1.0;
    }
    g.setAttribute("waga", new THREE.BufferAttribute(waga, 1));
    if (!g.attributes.s) g.setAttribute("s", new THREE.BufferAttribute(new Float32Array(poz.count), 1));
    const moc = r.klasa === "sway" ? r.h * s * 0.45 : r.w * s * 0.22;
    const m = new THREE.Mesh(g, materialRuchu(mapa, moc, r.faza, r.klasa === "sway", linie));
    m.frustumCulled = false;
    const wyzej = r.klasa === "drift" && opcje.podniesChmury !== false ? H * 0.13 * s : 0;
    m.position.set((r.x + r.w / 2 - W / 2) * s, (H / 2 - r.y - r.h / 2) * s + wyzej + (opcje.srodekY ?? 0) * (kamZ - z) / (kamZ - Z_TLA), z);
    m.renderOrder = r.klasa === "drift" ? 0 : 2;
    scena.add(m);
  }
  for (const p of opis.poswiaty || []) scena.add(poswiata(p, s0, Z_TLA + 0.05, W, H, opcje.srodekY ?? 0));
  return { obszary: opis.obszary || null, rekwizytow: opis.rekwizyty.length, horyzont: opis.horyzont, skala: s0, wysokosc: H, zTla: Z_TLA, plyta, srodekY: opcje.srodekY ?? 0 };
}
