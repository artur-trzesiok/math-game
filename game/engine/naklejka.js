// A sticker's look, drawn by the GPU from one rim-free picture: while a story plays it lies in the scene with a soft
// shadow only (a white die-cut edge says "touch me" - Hania tapped every sticker of a story a dozen times); the moment
// it waits for a touch (a target, a thing to drag) the white edge grows round it, as wide as the old baked one.
import * as THREE from "three";

// the stickers that get this look (tools/objects/make_objects.py writes the list with the rim-free pictures)
export const NAKLEJKI = fetch("/game/assets/objects/naklejki.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).then((l) => new Set(l)).catch(() => new Set());
const KRAWEDZ = 0.055;          // the edge's width as a share of the picture (make_objects.die_cut's border)
const KIERUNKI = 16;

export function materialNaklejki(mapa) {
  const u = { uObw: { value: 0 }, uCien: { value: 1 }, uR: { value: KRAWEDZ } };
  const m = new THREE.MeshBasicMaterial({ map: mapa, transparent: true, alphaTest: 0.02, depthWrite: false });
  m.userData.naklejka = u;
  m.customProgramCacheKey = () => "naklejka";
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", `uniform float uObw; uniform float uCien; uniform float uR;
float aN(vec2 q) { return (q.x < 0.0 || q.y < 0.0 || q.x > 1.0 || q.y > 1.0) ? 0.0 : texture2D(map, q).a; }
vec4 nad(vec4 s, vec4 d) { float a = s.a + d.a * (1.0 - s.a); return vec4((s.rgb * s.a + d.rgb * d.a * (1.0 - s.a)) / max(a, 1e-4), a); }
void main() {`)
      .replace("#include <map_fragment>", `
  vec4 tex = texture2D(map, vMapUv);
  vec4 kol = vec4(0.0);
  if (uCien > 0.001) {                     // a soft shadow a little below and to the right
    float s = 0.0; vec2 o = vMapUv - vec2(0.022, -0.032);
    for (int i = 0; i < 8; i++) { float k = float(i) * 0.7854; s += aN(o + vec2(cos(k), sin(k)) * 0.022); }
    s = (s + aN(o) * 2.0) / 10.0;
    kol = vec4(0.008, 0.014, 0.008, s * 0.42 * uCien);
  }
  if (uObw > 0.001) {                      // the white edge: the picture's alpha spread out round it
    float r = 0.0, w = uR * uObw;
    for (int i = 0; i < ${KIERUNKI}; i++) { float k = float(i) * ${(2 * Math.PI / KIERUNKI).toFixed(5)}; vec2 d = vec2(cos(k), sin(k));
      r = max(r, aN(vMapUv + d * w)); r = max(r, aN(vMapUv + d * w * 0.5)); }
    kol = nad(vec4(1.0, 1.0, 1.0, smoothstep(0.25, 0.6, r)), kol);
  }
  diffuseColor *= nad(tex, kol);`);
  };
  return m;
}

// every frame: the edge grows on what waits for a touch and goes again (`czeka`: is this handle a target now) - on EVERY
// sticker the handle holds: a heap is one handle of several stickers, and each of them needs its own edge
export function krokNaklejek(objects, czeka, dt) {
  for (const h of objects) {
    if (!h.icon || !h.mesh) continue;
    let us = h.naklejkiU;
    if (!us || h.naklejkiN !== h.mesh.children.length) {             // gathered again when the group's children change
      us = []; h.mesh.traverse((o) => { const u = o.material?.userData?.naklejka; if (u) us.push(u); });
      h.naklejkiU = us; h.naklejkiN = h.mesh.children.length;
    }
    if (!us.length) continue;
    const cel = czeka(h) ? 1 : 0;
    for (const u of us) { const v = u.uObw.value; if (v !== cel) u.uObw.value = cel > v ? Math.min(1, v + dt * 4) : Math.max(0, v - dt * 3); }   // ~0.25 s in, a little slower out
  }
}
