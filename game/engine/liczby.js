// Numbers: digits drawn with the pencil (the strokes a child would make, one after another) and counting by
// touch (every thing once, its number appears over it). Coordinates of a digit: 0..0.9 wide, 0..1.4 tall,
// origin bottom-left; a stroke is a polyline or { bezier: [p0, c1, c2, p1, c3, c4, p2, ...] }.

export const CYFRY = {
  0: [{ bezier: [[0.45, 1.4], [-0.08, 1.4], [-0.08, 0], [0.45, 0], [0.98, 0], [0.98, 1.4], [0.45, 1.4]] }],
  1: [[[0.18, 1.02], [0.55, 1.4], [0.55, 0]]],
  2: [{ bezier: [[0.1, 1.05], [0.15, 1.48], [0.86, 1.52], [0.8, 1.0], [0.76, 0.62], [0.3, 0.34], [0.06, 0]] }, [[0.06, 0], [0.88, 0]]],
  3: [{ bezier: [[0.12, 1.22], [0.35, 1.52], [0.98, 1.42], [0.42, 0.76], [1.02, 0.78], [0.92, -0.12], [0.08, 0.16]] }],
  4: [[[0.62, 1.4], [0.06, 0.46], [0.9, 0.46]], [[0.66, 0.92], [0.66, 0]]],
  5: [[[0.8, 1.4], [0.22, 1.4], [0.16, 0.8]], { bezier: [[0.16, 0.8], [0.56, 1.02], [1.02, 0.66], [0.76, 0.2], [0.56, -0.1], [0.2, -0.02], [0.08, 0.18]] }],
  6: [{ bezier: [[0.76, 1.36], [0.3, 1.22], [0.04, 0.72], [0.12, 0.36], [0.2, -0.1], [0.86, -0.1], [0.82, 0.42], [0.78, 0.86], [0.2, 0.82], [0.13, 0.42]] }],
  7: [[[0.06, 1.4], [0.88, 1.4], [0.34, 0]], [[0.3, 0.7], [0.72, 0.7]]],
  8: [{ bezier: [[0.5, 0.76], [0.0, 0.9], [0.08, 1.42], [0.5, 1.42], [0.92, 1.42], [1.0, 0.9], [0.5, 0.76], [-0.06, 0.6], [0.0, 0.0], [0.5, 0.0], [1.0, 0.0], [1.06, 0.6], [0.5, 0.76]] }],
  9: [{ bezier: [[0.78, 1.05], [0.75, 1.5], [0.1, 1.5], [0.12, 1.05], [0.15, 0.64], [0.75, 0.64], [0.78, 1.05], [0.8, 0.5], [0.62, 0.0], [0.2, 0.05]] }],
};

// draw the number n (0..10) with its top-left corner at nothing in particular: centred on (x, y), `size` = height
export async function narysujCyfre(S, n, { x = 0, y = 1.2, size = 1.6, color = "#2b2622", width = null, duration = 0.5, strong = true } = {}) {
  const znaki = String(n).split("").map(Number), k = size / 1.4, gap = 0.3 * k;
  const szer = znaki.length * 0.9 * k + (znaki.length - 1) * gap;
  const parts = [];
  for (const [j, d] of znaki.entries()) {
    const ox = x - szer / 2 + j * (0.9 * k + gap), oy = y - size / 2;
    const map = ([px, py]) => [ox + px * k, oy + py * k];
    for (const s of CYFRY[d]) {
      const path = s.bezier ? { bezier: s.bezier.map(map) } : s.map(map);
      parts.push(await S.line(path, { color, width: width ?? 0.095 * size, duration: duration / CYFRY[d].length, strong, name: `cyfra_${n}` }));
    }
  }
  const head = parts[0];
  head.parts = parts; head.value = n; head.x = x; head.y = y;
  const r0 = head.remove; head.remove = () => { r0(); parts.slice(1).forEach((p) => p.remove()); };
  const h0 = head.highlight; head.highlight = (on) => parts.forEach((p, i) => (i ? p.highlight(on) : h0(on)));
  return head;
}

// a sign drawn with the pencil, in the digits' box: + = < > -
export const ZNAKI = {
  "+": [[[0.45, 1.0], [0.45, 0.25]], [[0.1, 0.62], [0.8, 0.62]]],
  "=": [[[0.1, 0.85], [0.8, 0.85]], [[0.1, 0.4], [0.8, 0.4]]],
  "-": [[[0.12, 0.62], [0.78, 0.62]]],
  "<": [[[0.8, 1.05], [0.1, 0.62], [0.8, 0.2]]],
  ">": [[[0.1, 1.05], [0.8, 0.62], [0.1, 0.2]]],
};
// an equation like [2, "+", 1, "=", 3] written left to right with the pencil; null leaves an empty slot
// (returned as `luki`, centres of the gaps, for a card to fly into). Returns { czesci, luki, x0, x1 }
export async function narysujRownanie(S, tokens, { x = 0, y = 3.2, size = 1.2, color = "#2b2622", duration = 0.35 } = {}) {
  const k = size / 1.4, szer = (t) => (t === null ? 0.9 : typeof t === "number" ? String(t).length * 0.9 + (String(t).length - 1) * 0.3 : 0.9) * k;
  const gap = 0.35 * k, total = tokens.reduce((a, t) => a + szer(t), 0) + gap * (tokens.length - 1);
  let cx = x - total / 2;
  const czesci = [], luki = [];
  for (const t of tokens) {
    const w = szer(t), mid = cx + w / 2;
    if (t === null) luki.push({ x: mid, y });
    else if (typeof t === "number") czesci.push(await narysujCyfre(S, t, { x: mid, y, size, color, duration }));
    else {
      const ox = mid - 0.45 * k, oy = y - size / 2;
      for (const st of ZNAKI[t]) czesci.push(await S.line(st.map(([px, py]) => [ox + px * k, oy + py * k]), { color, width: 0.095 * size, duration: duration / 2, strong: true, name: `znak_${t}` }));
    }
    cx += w + gap;
  }
  return { czesci, luki, x0: x - total / 2, x1: x + total / 2, remove: () => czesci.forEach((c) => c.remove()) };
}

// counting by touch: the child points to every thing once; each one bumps, its number is drawn small over it and
// `say(k)` speaks it. A thing counted already only gives a tap. Resolves with the count when all are counted.
// `od`: the count starts after this number (counting on: the basket holds 5, the child counts 6, 7, 8);
// `rzad` {x, y, gap}: every counted thing moves into that row first, so nothing is counted twice.
export function liczDotykiem(S, items, { say, kolor = "#1f5fbf", size = 0.7, od = 0, rzad = null } = {}) {
  return new Promise((resolve) => {
    let k = 0;
    const policzone = new Set(), znaczki = [];
    for (const h of items) h.policzony = false;        // tests read it; a counted thing becomes true
    const tura = async () => {
      if (k === items.length) { resolve({ n: k, znaczki }); return; }
      const hit = await S.choose(items);
      if (policzone.has(hit)) { tura(); return; }
      policzone.add(hit); hit.policzony = true; k++;
      if (rzad) { hit.mesh.rotation.z = 0; await hit.moveTo(rzad.x + (k - 1) * (rzad.gap ?? 0.95), rzad.y, 0.35); }
      const b = S.bounds(hit);
      znaczki.push(await narysujCyfre(S, od + k, { x: (b.left + b.right) / 2, y: b.top + size * 0.75, size, color: kolor, duration: 0.25 }));
      await say(od + k);
      tura();
    };
    tura();
  });
}
