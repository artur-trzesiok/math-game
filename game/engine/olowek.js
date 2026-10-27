// Pencil strokes: a ribbon along a path, drawn in with its tip moving, graphite grain, a soft
// tapered start and end and a slight hand wobble. A path is a polyline [[x, y], ...] or a chain
// of cubic Bezier segments { bezier: [p0, c1, c2, p1, c3, c4, p2, ...] } (safe-area units).

import * as THREE from "three";

// points along the path, about every `krok` units
export function probkuj(sciezka, krok = 0.02) {
  const out = [];
  if (sciezka.bezier) {
    const p = sciezka.bezier;
    for (let i = 0; i + 3 < p.length; i += 3) {
      const [a, b, c, d] = [p[i], p[i + 1], p[i + 2], p[i + 3]];
      const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) + Math.hypot(c[0] - b[0], c[1] - b[1]) + Math.hypot(d[0] - c[0], d[1] - c[1]);
      const n = Math.max(4, Math.ceil(dl / krok));
      for (let k = i ? 1 : 0; k <= n; k++) {
        const t = k / n, u = 1 - t;
        out.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
                  u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]);
      }
    }
    return out;
  }
  for (let i = 0; i + 1 < sciezka.length; i++) {
    const [a, b] = [sciezka[i], sciezka[i + 1]], n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / krok));
    for (let k = i ? 1 : 0; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
}

// the ribbon: two vertices per sample, u = length fraction (0..1), v = across (0..1); the width
// swells a little in the middle and tapers at both ends, the centre line wobbles like a hand
export function wstega(punkty, { grubosc = 0.06, drzenie = 0.012, ziarno = Math.random() * 1000 } = {}) {
  const n = punkty.length, dl = [0];
  for (let i = 1; i < n; i++) dl.push(dl[i - 1] + Math.hypot(punkty[i][0] - punkty[i - 1][0], punkty[i][1] - punkty[i - 1][1]));
  const L = dl[n - 1] || 1;
  const pos = new Float32Array(n * 2 * 3), uv = new Float32Array(n * 2 * 2), idx = [];
  for (let i = 0; i < n; i++) {
    const a = punkty[Math.max(0, i - 1)], b = punkty[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx, u = dl[i] / L;
    const w = drzenie * (Math.sin(u * L * 7.3 + ziarno) * 0.6 + Math.sin(u * L * 17.1 + ziarno * 1.7) * 0.4);
    const cx = punkty[i][0] + nx * w, cy = punkty[i][1] + ny * w;
    const h = grubosc * 0.5 * (0.55 + 0.45 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u)) ), 0.35));
    for (const [j, s] of [[0, -1], [1, 1]]) {
      pos.set([cx + nx * h * s, cy + ny * h * s, 0], (2 * i + j) * 3);
      uv.set([u, j], (2 * i + j) * 2);
    }
    if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return { g, dlugosc: L };
}

// graphite: grain along the stroke, soft ragged edges, revealed up to `postep` with a lighter tip
export function material(kolor = "#3b3631", dlugosc = 1, ziarno = Math.random() * 1000) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    uniforms: { postep: { value: 0 }, kolor: { value: new THREE.Color(kolor) }, dl: { value: dlugosc }, ziarno: { value: ziarno }, blask: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float postep, dl, ziarno, blask; uniform vec3 kolor; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + ziarno) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        float s = vUv.x * dl;
        if (vUv.x > postep) discard;
        float brzeg = 0.18 + 0.12 * n(vec2(s * 60.0, 3.0));                       // a ragged edge
        float a = smoothstep(0.0, brzeg, vUv.y) * smoothstep(0.0, brzeg, 1.0 - vUv.y);
        float g = n(vec2(s * 180.0, vUv.y * 9.0)) * 0.6 + n(vec2(s * 47.0, vUv.y * 3.0)) * 0.4;   // graphite grain
        a *= 0.55 + 0.45 * g;
        a *= mix(0.6, 1.0, smoothstep(0.0, 0.03 / max(dl, 0.01), postep - vUv.x));  // the fresh tip is lighter
        vec3 c = mix(kolor, vec3(1.0, 0.85, 0.3), blask * 0.6);
        gl_FragColor = vec4(c, a * (0.9 + 0.1 * blask));
        #include <colorspace_fragment>
      }`,
  });
}
