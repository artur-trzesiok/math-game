// Raster background with a rig: the plate is one textured quad, every mover
// (cut out of the second generation by difference) is a subdivided textured
// quad that bends in the vertex shader. Same rig as the vector version in
// the vector version - weight ((y - root)/h)^2 for grass, constant for clouds -
// but the pixels are the illustration itself, grain and outline included.

import * as THREE from "three";

export const czas = { value: 0 };
const SWIEZO = { cache: "no-store" };
const ladowacz = new THREE.TextureLoader();

function tekstura(url) {
  return new Promise((ok, zle) => ladowacz.load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = 4;
    ok(t);
  }, undefined, zle));
}

function materialRuchu(mapa, moc, faza, sway) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { czas, moc: { value: moc }, faza: { value: faza }, sway: { value: sway ? 1 : 0 }, mapa: { value: mapa } },
    vertexShader: `
      uniform float czas, moc, faza, sway;
      attribute float waga;
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec3 p = position;
        float t = czas * 1.1 + faza * 6.2831;
        // trawa: glowny podmuch + szybsze drzenie czubka; chmury: dryf w bok
        // i lekkie unoszenie - odwaznie, ma byc widoczne z fotela
        if (sway > 0.5) { p.x += (sin(t) + 0.35 * sin(t * 2.7 + 1.0)) * moc * waga; p.y -= abs(sin(t)) * moc * 0.12 * waga; }
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
export async function zbudujTlo(scena, wymiar, opcje = {}) {
  const kat = opcje.katalog ?? "tlo/";
  const Z_TLA = opcje.zTla ?? -9, Z_CHMUR = opcje.zChmur ?? -8.4, Z_TRAWY = opcje.zTrawy ?? -1.2;
  const kamZ = opcje.odlegloscKamery ?? 7.2;
  const opis = await (await fetch(kat + "rekwizyty.json", SWIEZO)).json();
  const W = opis.szerokosc, H = opis.wysokosc;
  const { w: pw, h: ph } = wymiar(Z_TLA);
  const s0 = Math.max(pw / W, ph / H) * 1.02;        // cover

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
    const g = new THREE.PlaneGeometry(r.w * s, r.h * s, 6, 10);
    // RIG: waga per wierzcholek; korzen (dol) 0, czubek 1, kwadratowo
    const poz = g.attributes.position, waga = new Float32Array(poz.count);
    for (let i = 0; i < poz.count; i++) {
      const u = (poz.getY(i) + r.h * s / 2) / (r.h * s);
      waga[i] = r.klasa === "sway" ? u * u : 1.0;
    }
    g.setAttribute("waga", new THREE.BufferAttribute(waga, 1));
    const moc = r.klasa === "sway" ? r.h * s * 0.45 : r.w * s * 0.22;
    const m = new THREE.Mesh(g, materialRuchu(mapa, moc, r.faza, r.klasa === "sway"));
    const wyzej = r.klasa === "drift" && opcje.podniesChmury !== false ? H * 0.13 * s : 0;
    m.position.set((r.x + r.w / 2 - W / 2) * s, (H / 2 - r.y - r.h / 2) * s + wyzej + (opcje.srodekY ?? 0) * (kamZ - z) / (kamZ - Z_TLA), z);
    m.renderOrder = r.klasa === "drift" ? 0 : 2;
    scena.add(m);
  }
  return { rekwizytow: opis.rekwizyty.length, horyzont: opis.horyzont, skala: s0, wysokosc: H, zTla: Z_TLA, plyta, srodekY: opcje.srodekY ?? 0 };
}
