// Breathers (accepted 2026-10-29, PLAN_usprawnienia.md phase 2b): one mini-game WITHOUT maths in every story - rhythm
// and fun between the maths. Each is one gesture a three-year-old gets at once. The characters' words come from the
// shared pool game/oddechy (every line in all nine voices) through `mow(kto, key)`, which the player hands in.
// Tests: S.oddech.dokoncz() finishes the running one.

import * as THREE from "three";
import { emocja } from "./efekty.js";
import { GROUND, texture } from "./scene.js";

const FAST = new URLSearchParams(location.search).has("szybko");
const czekaj = (S, s) => S.wait(FAST ? Math.min(s, 0.15) : s);
const nic = async () => {};
const usun = (...hs) => hs.flat().forEach((h) => h?.remove?.());

// ===================================================================== rock, paper, scissors (kpn)
// Taught first (`naucz`): each sign beats one - the winner moves onto the loser, which shakes, and the rule is said.
// Then the child points to a hand, the character shows theirs, both are said, the rule decides out loud. A draw is
// played again (after two draws the child wins). Returns "dziecko" or the character's name.
const ZNAKI = ["kamien", "papier", "nozyce"];
const BIJE = { kamien: "nozyce", nozyce: "papier", papier: "kamien" };
const ZASADA = { kamien: "rps_kamien_nozyce", nozyce: "rps_nozyce_papier", papier: "rps_papier_kamien" };
export async function kpn(S, { kto, naucz = true, mow = nic } = {}) {
  const pokazWalke = async (a, b, xa = -1.4, xb = 1.4) => {          // a beats b
    const A = await S.object(`gest_${a}`, { x: xa, y: 1.4, size: 1.6 }), B = await S.object(`gest_${b}`, { x: xb, y: 1.4, size: 1.6 });
    B.icon.scale.x = -1;                                              // the other player's hand faces back
    await czekaj(S, 0.5); S.sfx.graj("whoosh");
    await A.moveTo(xb - Math.sign(xb - xa) * 0.5, 1.5, 0.35); S.shake(B);
    await mow(kto, ZASADA[a]); await czekaj(S, 0.3);
    return [A, B];
  };
  if (naucz) for (const a of ZNAKI) { const p = await pokazWalke(a, BIJE[a]); usun(p); }
  let remisy = 0;
  for (;;) {
    const opcje = []; for (const [i, z] of ZNAKI.entries()) { const h = await S.object(`gest_${z}`, { x: -2.4 + i * 2.4, y: 1.3, size: 1.5 }); h.znak = z; opcje.push(h); }
    await mow(kto, "rps_wybierz");
    S.oddech = { dokoncz: async () => S.clickOn(opcje[0]) };
    const wybor = await S.choose(opcje); S.oddech = null;
    usun(opcje);
    const ty = wybor?.znak || "kamien";
    let ja = ZNAKI[Math.floor(Math.random() * 3)];
    if (remisy >= 2) ja = BIJE[ty];                                   // two draws: now the child wins
    await mow(kto, "rps_haslo");
    const T = await S.object(`gest_${ty}`, { x: -1.6, y: 1.3, size: 1.7 }), J = await S.object(`gest_${ja}`, { x: 1.6, y: 1.3, size: 1.7 }); J.icon.scale.x = -1;
    S.sfx.graj("pop"); await czekaj(S, 0.4);
    await mow(kto, `rps_${ja}`);
    if (ty === ja) { await mow(kto, "rps_remis"); remisy++; usun(T, J); continue; }
    const [W, P] = BIJE[ty] === ja ? [T, J] : [J, T];
    S.sfx.graj("whoosh"); await W.moveTo(P.mesh.position.x - Math.sign(P.mesh.position.x - W.mesh.position.x) * 0.5, 1.4, 0.35); S.shake(P);
    await mow(kto, ZASADA[BIJE[ty] === ja ? ty : ja]);
    const wygral = BIJE[ty] === ja ? "dziecko" : kto;
    if (wygral === "dziecko") { S.sfx.graj("right"); S.puppets[kto]?.graj("Brawo"); } else S.puppets[kto]?.graj("Radosc");
    await mow(kto, wygral === "dziecko" ? "rps_ty" : "rps_ja");
    await czekaj(S, 0.4); usun(T, J);
    return wygral;
  }
}

// ===================================================================== copy the face (lustro)
// The character pulls a face (the emotion bubble shows it big, the body acts it); the child points to the same face
// among three painted ones; a wrong one shakes. `rundy` faces in a row.
const MINY = { radosc: "Radosc", smutek: "Smutek", zlosc: "Smutek", sen: "Spoczynek", strach: "Smutek", pot: "Rozgladanie" };   // only bubbles that are faces
const NAKLEJKA_MINY = (n) => `emocja_${n === "pot" ? "ojej" : n}`;
export async function lustro(S, { kto, rundy = 3, mow = nic } = {}) {
  const nazwy = Object.keys(MINY).sort(() => Math.random() - 0.5);
  for (let r = 0; r < rundy; r++) {
    const mina = nazwy[r % nazwy.length];
    const inne = nazwy.filter((n) => n !== mina).sort(() => Math.random() - 0.5).slice(0, 2);
    const kolej = [mina, ...inne].sort(() => Math.random() - 0.5);
    S.puppets[kto]?.graj(MINY[mina]); emocja(S, kto, mina, { na: 3.5 });
    await mow(kto, r ? "mina_jeszcze" : "mina_pokaz");
    const opcje = []; for (const [i, n] of kolej.entries()) { const h = await S.object(NAKLEJKA_MINY(n), { x: -2.2 + i * 2.2, y: 1.3, size: 1.5 }); h.mina = n; opcje.push(h); }
    S.oddech = { dokoncz: async () => S.clickOn(opcje.find((o) => o.mina === mina)) };
    for (;;) {
      const hit = await S.choose(opcje);
      if (hit?.mina === mina) { S.sfx.graj("right"); S.bump(hit, 0.3, false); S.puppets[kto]?.graj("Radosc"); await mow(kto, "mina_tak"); break; }
      S.shake(hit);
    }
    S.oddech = null; await czekaj(S, 0.3); usun(opcje);
  }
}

// ===================================================================== feeding (karmienie)
// A hungry animal (a sticker) and its food above the heads; the child drags food to it: good food it gulps (a bump and
// a munch), the odd one (`fuj`) it spits back (a shake, the thing flies home). Ends when all the good food is eaten.
export async function karmienie(S, { zwierze = "kaczka_mama", jedzenie = ["bulka", "bulka", "bulka"], fuj = ["kamyk"], kto = null, mow = nic, x = 0, y = -1.7, size = 2.3 } = {}) {
  const Z = await S.object(zwierze, { x, y, size });
  const rzeczy = [], wszystkie = [...jedzenie.map((n) => [n, true]), ...fuj.map((n) => [n, false])].sort(() => Math.random() - 0.5);
  for (const [i, [n, dobre]] of wszystkie.entries()) { const h = await S.object(n, { x: (i - (wszystkie.length - 1) / 2) * 1.5, y: 1.4, size: 1.0 }); h.dobre = dobre; h.home = { x: h.mesh.position.x, y: 1.4 }; rzeczy.push(h); }
  let mniam = false, ble = false;
  const zjedz = async (h) => {
    h.zjedzone = true; await h.moveTo(Z.mesh.position.x, Z.mesh.position.y + size * 0.15, 0.2);
    await S.tween(0.18, (s) => h.mesh.scale.setScalar(h.base * (1 - s))); h.remove();
    S.sfx.graj("plop"); S.bump(Z, 0.2, false);
  };
  await new Promise((gotowe) => {
    const koniec = () => { if (rzeczy.filter((h) => h.dobre).every((h) => h.zjedzone)) { S.endSort(); S.oddech = null; gotowe(); } };
    S.free({ items: rzeczy.slice(), onTap: () => {}, onDrop: async (h, p) => {
      if (Math.hypot(p.x - Z.mesh.position.x, p.y - Z.mesh.position.y) > size * 0.75) return h.moveTo(h.home.x, h.home.y, 0.3);
      if (h.dobre) { await zjedz(h); if (kto && !mniam) { mniam = true; mow(kto, "karm_mniam"); } koniec(); }
      else { S.sfx.graj("wrong"); S.shake(Z); await h.moveTo(h.home.x, h.home.y, 0.35); if (kto && !ble) { ble = true; mow(kto, "karm_fuj"); } }
    } });
    S.oddech = { dokoncz: async () => { for (const h of rzeczy) if (h.dobre && !h.zjedzone) await zjedz(h); koniec(); } };
  });
  S.puppets[kto]?.graj("Radosc"); await czekaj(S, 0.6);
  usun(rzeczy, Z);
}

// ===================================================================== the kite (latawiec)
// A painted kite low over the meadow on a string from a character's paw; the child drags up (anywhere) and the kite
// climbs, sways in the wind, sinks slowly when nobody pulls; at the top it loops the loop - hooray.
export async function latawiec(S, { ksztalt = "latawiec_kwadrat", kto = null, mow = nic } = {}) {
  const K = await S.object(ksztalt, { x: 0.8, y: -0.4, size: 1.5 });
  const L = kto ? S.puppets[kto] : null;
  if (kto) await mow(kto, "latawiec");                                  // how to play it
  const reka = () => (L ? [L.korzen.position.x + (L.korzen.position.x < 0 ? 0.6 : -0.6), L.korzen.position.y + L.wysokosc * 0.45] : [-3.6, -2.4]);
  // the string: the painted twisted rope (winda_lina) repeated along a sagging curve that ripples in the wind - a
  // 1 px line read as a technical drawing
  const N = 28, GRUB = 0.1, OKRES = 0.6;
  const lina = await texture("/game/assets/objects/winda_lina.webp").catch(() => null);
  let u0 = 0, u1 = 1;                                                   // the rope's own columns: the picture is mostly empty
  if (lina) {
    lina.wrapT = THREE.RepeatWrapping; lina.needsUpdate = true;
    try {
      const im = lina.image, c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
      const x = c.getContext("2d"); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
      const kol = []; for (let i = 0; i < c.width; i++) { let n = 0; for (let j = 0; j < c.height; j += 4) if (d[(j * c.width + i) * 4 + 3] > 40) n++; kol.push(n / (c.height / 4)); }
      const lin = kol.map((v, i) => (v > 0.3 ? i : -1)).filter((i) => i >= 0);
      if (lin.length) { u0 = lin[0] / c.width; u1 = (lin[lin.length - 1] + 1) / c.width; }
    } catch { /* keep the whole width */ }
  }
  const geo = new THREE.BufferGeometry(), poz = new Float32Array((N + 1) * 2 * 3), uvy = new Float32Array((N + 1) * 2 * 2), idx = [];
  for (let i = 0; i < N; i++) { const a = 2 * i; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  geo.setAttribute("position", new THREE.BufferAttribute(poz, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uvy, 2)); geo.setIndex(idx);
  const sznurek = new THREE.Mesh(geo, new THREE.MeshBasicMaterial(lina ? { map: lina, transparent: true, depthWrite: false, side: THREE.DoubleSide } : { color: "#6b4a2a", side: THREE.DoubleSide }));
  sznurek.renderOrder = 9.5; sznurek.frustumCulled = false; S.scene.add(sznurek);
  const ulozSznurek = (ax, ay, bx, by, faza) => {
    const dl = Math.hypot(bx - ax, by - ay), zwis = 0.12 * dl + 0.15;
    let prev = null, droga = 0;
    const pkt = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, fala = Math.sin(t * Math.PI) * 0.07 * Math.sin(faza * 3 + t * 6);
      pkt.push([ax + (bx - ax) * t + fala * 0.5, ay + (by - ay) * t - zwis * 4 * t * (1 - t) + fala]);
    }
    for (let i = 0; i <= N; i++) {
      const [x, y] = pkt[i], [x2, y2] = pkt[Math.min(N, i + 1)], [x0, y0] = pkt[Math.max(0, i - 1)];
      let tx = x2 - x0, ty = y2 - y0; const n = Math.hypot(tx, ty) || 1; tx /= n; ty /= n;
      if (prev) droga += Math.hypot(x - prev[0], y - prev[1]); prev = [x, y];
      const nx = -ty * GRUB / 2, ny = tx * GRUB / 2, v = droga / OKRES;
      poz.set([x - nx, y - ny, 0.39, x + nx, y + ny, 0.39], i * 6); uvy.set([u0, v, u1, v], i * 4);
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.uv.needsUpdate = true;
  };
  let y = -0.4, vy = 0, faza = 0, petla, gotowe, ost = null;
  const h = { kind: "latawiec", mesh: sznurek, base: 1, remove: () => { clearInterval(petla); S.scene.remove(sznurek); K.remove(); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); } };
  S.objects.push(h);
  let t0 = performance.now();
  petla = setInterval(() => {
    const t = performance.now(), dt = Math.min(0.05, (t - t0) / 1000); t0 = t; faza += dt;
    vy -= 0.35 * dt; vy *= 0.97; y = Math.max(-1.0, Math.min(2.7, y + vy * dt));
    const x = 0.8 + Math.sin(faza * 1.3) * 0.5 + (y + 1) * 0.35;
    K.mesh.position.set(x, y, 0.4); if (!K.petla) K.mesh.rotation.z = Math.sin(faza * 2.1) * 0.18;
    const [rx, ry] = reka(); ulozSznurek(rx, ry, x, y - 0.55, faza);
    if (y >= 2.6 && gotowe) { const g0 = gotowe; gotowe = null; g0(); }
  }, 16);
  await new Promise((ok) => {
    gotowe = ok;
    S.palec = { down: (q) => { ost = q[1]; return true; }, move: (q) => { if (ost !== null && q[1] > ost) vy += (q[1] - ost) * 1.6; ost = q[1]; }, up: () => { ost = null; } };
    S.oddech = { dokoncz: async () => { y = 2.65; } };
  });
  S.palec = null; S.oddech = null;
  K.petla = true; S.sfx.graj("whoosh");
  await S.tween(FAST ? 0.2 : 1.1, (s) => { K.mesh.rotation.z = s * Math.PI * 2; });
  K.petla = false; S.sfx.graj("right");
  if (kto) { L?.graj("Radosc"); await mow(kto, "latawiec_hura"); }
  await czekaj(S, 0.8); h.remove();
}

// ===================================================================== who said that? (ktoPowiedzial)
// Big painted bushes stand on the grass; the hiding characters walk behind them one by one while the child watches
// (the bushes are drawn over the characters, so nobody peeks out). Then a hidden one calls "peekaboo!" in its own
// voice, the host asks who called, the child points to that bush: it shakes and the one behind it steps out. Every
// hiding character calls once; one bush stays empty.
export async function ktoPowiedzial(S, { gospodarz, kryjowki, mow = nic, size = 2.8 } = {}) {
  // one bush per hider and one empty, side by side on the grass, clear of the host (who stays where it stands)
  const hx = S.puppets[gospodarz]?.korzen.position.x ?? 4.8, n = kryjowki.length + 1, szer = size * 0.95;
  const [a, b] = hx > 0 ? [-4.4 + szer / 2, hx - 1.2 - szer / 2] : [hx + 1.2 + szer / 2, 4.4 - szer / 2];
  const xs = [...Array(n).keys()].map((i) => (n > 1 ? a + (b - a) * i / (n - 1) : (a + b) / 2));
  const krzaki = [];
  for (const x of xs) {
    const k = await S.object("krzak", { x, y: GROUND + 0.435 * size, size, z: 0.5 });
    k.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 36; }); krzaki.push(k);
  }
  const miejsce = new Map(), domy = new Map();
  const wolne = xs.map((_, i) => i).sort(() => Math.random() - 0.5);
  // behind its bush the character is gone (a puppet taller than the bush showed its ears, sunk into the ground its feet);
  // found, it jumps out beside the bush
  const kucnij = async (L, dol, x = null) => {
    if (dol) { L.korzen.visible = false; if (L.cien) L.cien.visible = false; return; }
    if (x !== null) L.korzen.position.x = x;
    L.korzen.visible = true; if (L.cien) L.cien.visible = true;
  };
  for (const kto of kryjowki) {
    const L = S.puppets[kto]; if (!L) continue;
    domy.set(kto, L.korzen.position.x);
    const i = wolne.pop(); miejsce.set(kto, i);
    await S.walkTo(kto, xs[i]); await kucnij(L, true);                // crouches behind it: nobody peeks out
  }
  await czekaj(S, 0.5);
  for (const kto of [...miejsce.keys()].sort(() => Math.random() - 0.5)) {
    const L = S.puppets[kto], k = krzaki[miejsce.get(kto)];
    S.bump(k, 0.06, false);
    await mow(kto, "kto_tu", { ukryty: true });                       // only the voice: who is it, and where?
    await mow(gospodarz, "kto_pytanie");
    S.oddech = { dokoncz: async () => S.clickOn(k) };
    for (;;) {
      const hit = await S.choose(krzaki);
      if (hit === k) break;
      S.shake(hit); S.sfx.graj("wrong");
    }
    S.oddech = null;
    S.sfx.graj("right"); S.shake(k);
    const bok = k.mesh.position.x + (k.mesh.position.x < 0 ? 1 : -1) * size * 0.55;
    await kucnij(L, false, bok); L.graj("Podskok");                   // jumps out beside the bush
    await mow(kto, "kto_znalazles");
  }
  usun(krzaki);
  for (const [kto, x] of domy) await S.walkTo(kto, x);
}

// ===================================================================== finger painting (malowanie)
// A card to draw on with a finger: the night sky (glowing gold strokes) or a steamy window (the finger wipes the mist
// and the painted view shows through). Free drawing, nothing to get right;
// it ends a while after the first stroke (or `czas` seconds), and the character admires it. The window is a
// scratch-off pair (`zdrapka`): its painted mist on the glass, its painted view behind.
export async function malowanie(S, { tlo = "noc", zdrapka = "szyba_rano", kto = null, mow = nic, czas = 12, y = 0.3, W = 7.2 } = {}) {
  const H = W * 0.62;
  const { texture } = await import("./scene.js");
  const kat = `/game/assets/zdrapki/${zdrapka}/`;
  const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
  const welon = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat({ color: "#1d1a17", opacity: 0.5 })); welon.position.set(0, 0, 0.42); welon.renderOrder = 38; S.scene.add(welon);
  const grp = new THREE.Group(); grp.position.set(0, y, 0.45); grp.rotation.z = -0.02; S.scene.add(grp);
  const rama = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.34, H + 0.34), mat({ color: tlo === "noc" ? "#2a3566" : "#7a5530" })); rama.renderOrder = 38.3; grp.add(rama);
  const CW = 512, CH = Math.round(512 * H / W), cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
  const x = cv.getContext("2d");
  if (tlo === "noc") { x.fillStyle = "#141d3f"; x.fillRect(0, 0, CW, CH); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,230,${0.2 + Math.random() * 0.5})`; x.beginPath(); x.arc(Math.random() * CW, Math.random() * CH, Math.random() * 1.6 + 0.4, 0, 7); x.fill(); } }
  else x.drawImage((await texture(kat + "zakryty.webp")).image, 0, 0, CW, CH);   // the painted mist, wiped off by the finger
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  if (tlo !== "noc") {                                                  // the view behind the steamy glass (a scratch-off pair)
    const t = await texture(kat + "odkryty.webp"); const pod = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ map: t })); pod.renderOrder = 38.5; pod.position.z = 0.005; grp.add(pod);
  }
  const plotno = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat({ map: tex })); plotno.renderOrder = 38.6; plotno.position.z = 0.01; grp.add(plotno);
  const h = { kind: "malowanie", mesh: grp, base: 1, remove: () => { S.scene.remove(grp); S.scene.remove(welon); tex.dispose(); const i = S.objects.indexOf(h); if (i >= 0) S.objects.splice(i, 1); } };
  S.objects.push(h);
  if (kto) await mow(kto, "maluj");
  const uv = ([px, py]) => { const v = plotno.worldToLocal(new THREE.Vector3(px, py, 0.45)); return [(v.x / W + 0.5) * CW, (0.5 - v.y / H) * CH]; };
  let ost = null, start = null, dzwiek = 0;
  const kreska = (a, b) => {
    x.lineCap = x.lineJoin = "round";
    if (tlo === "noc") { x.globalCompositeOperation = "lighter"; x.strokeStyle = "rgba(255,214,107,0.85)"; x.shadowColor = "#ffd86b"; x.shadowBlur = 14; x.lineWidth = 7; }
    else { x.globalCompositeOperation = "destination-out"; x.strokeStyle = "rgba(0,0,0,1)"; x.shadowBlur = 0; x.lineWidth = 26; }
    x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke(); x.globalCompositeOperation = "source-over"; x.shadowBlur = 0; tex.needsUpdate = true;
    const t = performance.now(); if (t - dzwiek > 300) { S.sfx.graj("pencil", { glosnosc: 0.4 }); dzwiek = t; }
  };
  await new Promise((ok) => {
    let koniec = false;
    const zakoncz = () => { if (!koniec) { koniec = true; ok(); } };
    S.palec = { down: (q) => { ost = uv(q); if (!start) { start = performance.now(); setTimeout(zakoncz, (FAST ? 0.5 : czas) * 1000); } kreska(ost, [ost[0] + 0.1, ost[1]]); return true; },
      move: (q) => { if (!ost) return; const n = uv(q); kreska(ost, n); ost = n; }, up: () => { ost = null; } };
    S.oddech = { dokoncz: async () => { for (let i = 0; i < 40; i++) kreska([CW * 0.2 + i * 8, CH / 2 + Math.sin(i / 4) * 40], [CW * 0.2 + (i + 1) * 8, CH / 2 + Math.sin((i + 1) / 4) * 40]); zakoncz(); } };
  });
  S.palec = null; S.oddech = null;
  if (kto) { S.puppets[kto]?.graj("Brawo"); await mow(kto, "maluj_ladne"); }
  await czekaj(S, 0.8); h.remove();
}
