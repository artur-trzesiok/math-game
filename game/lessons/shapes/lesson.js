// Lesson: shapes - circle, triangle, square, rectangle, told by corners and sides (not by colour, not by turn). Shy
// Hedgehog has no house for the winter; the friends build one from shapes: the shapes traced with a finger, the
// corners counted, then Hedgehog's drawing of his dream house (the child finds the triangle - the roof), and walls,
// roof, window and door each found and put in place. Bunny's kite is a turned square. Practice: tangram, a turned triangle, a traced rectangle, the shape with no
// corners, colour by number. At home: what shape is a plate, a chocolate bar. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wyrosnij = (c) => c.stage.tween(0.4, () => {});                  // let things popping in reach their size before a shot frames them
const OBRYS = { kolo: Array.from({ length: 16 }, (_, i) => [0.5 * Math.cos(i * Math.PI / 8), 0.5 * Math.sin(i * Math.PI / 8)]), kwadrat: [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
  trojkat: [[-0.55, -0.45], [0.55, -0.45], [0, 0.5]], prostokat: [[-0.8, -0.42], [0.8, -0.42], [0.8, 0.42], [-0.8, 0.42]] };
const KOLOR = { kolo: "#e8604c", trojkat: "#f5c341", kwadrat: "#3f8ce0", prostokat: "#58bd68" };

// the house: walls (a square), roof (a triangle on top), window (a circle), door (an upright rectangle)
const DOM = { x: 1.3, dol: -2.45, bok: 1.6 };
const czesci = () => {
  const s = DOM.bok, gora = DOM.dol + s, dach = 1.8;
  return [
    { kind: "kwadrat", x: DOM.x, y: DOM.dol + s / 2, size: s, rot: 0, linia: "line.b_sciany" },
    { kind: "trojkat", x: DOM.x, y: gora + 0.45 * dach, size: dach, rot: 0, linia: "line.b_dach" },
    { kind: "kolo", x: DOM.x + 0.45, y: DOM.dol + s * 0.62, size: 0.6, rot: 0, linia: "line.b_okno" },
    { kind: "prostokat", x: DOM.x - 0.45, y: DOM.dol + 0.68, size: 0.85, rot: 90, linia: "line.b_drzwi" },
  ];
};

// a row of shapes laid out by their drawn widths (turned ones included) with a clear gap: a fixed step let a turned
// rectangle lie over the triangle in "which one is the triangle?"; distinct colours, so colour never decides
function rzad(c, kinds, { y = 0.8, size = 1.3, rot = () => 0, przerwa = 0.55, kolory = null } = {}) {
  const barwy = kolory || tasuj(Object.values(KOLOR));
  const hs = kinds.map((k, i) => c.shape(k, { x: 0, y, size, color: barwy[i % barwy.length], rot: rot(k, i) }));
  // widths from the shapes' own outlines (geometria.js KSZTALTY), turned: corners() reads the scale still popping in
  const szer = kinds.map((k, i) => { const a = rot(k, i) * Math.PI / 180, xs = OBRYS[k].map(([u, v]) => (u * Math.cos(a) - v * Math.sin(a)) * size); return Math.max(...xs) - Math.min(...xs) + 0.3; });
  let x = -(szer.reduce((a, b) => a + b, 0) + przerwa * (hs.length - 1)) / 2;
  hs.forEach((h, i) => { h.mesh.position.x = x + szer[i] / 2; h.home = { x: h.mesh.position.x, y }; x += szer[i] + przerwa; });
  return hs;
}

// touch every corner (stage 2: before counting): each touched corner gets a pencil ring, no numbers
async function rogi(c, ksztalt, wrong) {
  const r = c.corners(ksztalt), znaczki = [];
  while (r.some((q) => !q.dotkniety)) {
    const zostale = r.filter((q) => !q.dotkniety);
    dobre(zostale); const hit = await c.task({ targets: zostale, correct: zostale, wrong }); dobre(zostale, false);
    hit.dotkniety = true; znaczki.push(await c.circle(hit, { margin: 0.12, duration: 0.3 }));
  }
  return { remove: () => { znaczki.forEach((z) => z.remove()); r.forEach((q) => q.remove?.()); } };
}

export default {
  id: "shapes",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -4.9 }, jez: { side: "right", x: 4.9 }, sowa: { side: "right", x: 3.0 }, zajac: { side: "right", x: 3.0 } },
  backgrounds: { story: "laka", practice: { kolor: "#eef3d9", motyw: "figury" }, apply: "dom" },
  stages: {
    story: [
      // A. the meadow: Hedgehog has no house; the shapes are traced and their corners counted
      async (c) => {
        c.show("jez");
        const krzak = await c.object("krzak", { x: 4.9, y: -1.9, size: 2.9, z: 0.6 });
        krzak.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 35; });   // stickers draw under puppets (10 < 20): the bush must hide Hedgehog
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.ujecie("sredni", { na: [krzak] });                           // the bush fills the shot, Hedgehog still hidden
        await c.say("lisek", "line.a_kto_tam");
        krzak.remove(); c.stage.bump(c.stage.puppets.jez);
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.a_nie_mam_domu", { anim: "Smutek" });
        await c.ujecie("dwuujecie", { na: ["sowa", "jez"] });
        await c.say("sowa", "line.a_zbudujemy", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.a_z_czego");
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.a_z_figur");
        // trace them: a circle (no corners), a triangle (count its corners), a square (count them)
        await c.ujecie("ogolny");
        await c.say("sowa", "line.a_kolo");
        let t = await c.slad("kolo", { x: 0, y: 0.4, size: 3.0 });
        await c.ujecie("sredni", { na: [...t.tusz, "sowa"] });                // the traced circle and the one telling about it
        await c.say("sowa", "line.a_kolo_ok");
        t.remove();
        await c.ujecie("ogolny");
        await c.say("sowa", "line.a_trojkat");
        t = await c.slad("trojkat", { x: -0.8, y: 0.3, size: 3.0 });
        t.remove();
        const tr = c.shape("trojkat", { x: -0.8, y: 0.3, size: 3.0, color: KOLOR.trojkat });
        await c.say("sowa", "line.a_policz_trojkat");
        await c.count(c.corners(tr), { who: "sowa" });                       // counting to three is known by now; four is not
        await c.ujecie("sredni", { na: [tr, "sowa"] });
        await c.say("sowa", "line.a_trzy_rogi");
        tr.remove(); c.clear();
        await c.ujecie("ogolny");
        await c.say("sowa", "line.a_kwadrat");
        t = await c.slad("kwadrat", { x: -0.8, y: 0.3, size: 2.8 });
        t.remove();
        const kw = c.shape("kwadrat", { x: -0.8, y: 0.3, size: 2.8, color: KOLOR.kwadrat });
        await c.say("sowa", "line.a_policz");
        await rogi(c, kw, "line.a_policz");
        await c.ujecie("sredni", { na: [kw, "sowa"] });
        await c.say("sowa", "line.a_cztery_rogi");
        kw.remove(); c.clear();
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.a_budujemy", { anim: "Radosc" });
        await c.ujecie("ogolny");
      },
      // B. building: each part's place drawn in pencil, the child finds the right shape among them all
      async (c) => {
        const S = c.stage;
        S.puppets.sowa.korzen.position.x = 3.5; S.puppets.jez.korzen.position.x = 5.4;                         // by Hedgehog: the pieces lie on the left, over Fox's head
        // Hedgehog's drawing of the house he dreams of: the child finds the triangle on it - the roof
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.b_rysunek", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const rys = await c.znalezisko("rysunek_domku", { skad: "jez" });
        await c.say("sowa", "line.b_rysunek_trojkat");
        dobre(rys.cele); await c.task({ targets: [...rys.cele, rys.tlo], correct: rys.cele[0], wrong: "line.b_rysunek_nie" }); dobre(rys.cele, false);
        await rys.zaznacz();
        await c.say("sowa", "line.b_rysunek_dach", { anim: "Radosc" });
        await rys.remove();
        const plan = czesci();
        // the pieces lie in the grass, in a row on the left (a turned rectangle and a spare triangle among them)
        const lez = [];
        for (const [i, k] of tasuj(["kwadrat", "trojkat", "kolo", "prostokat", "trojkat"]).entries()) {
          const h = c.shape(k, { x: -3.9 + (i % 3) * 1.65, y: 2.45 - Math.floor(i / 3) * 1.45, size: k === "kwadrat" ? 1.6 : k === "trojkat" ? 1.8 : k === "kolo" ? 0.6 : 0.85, color: KOLOR[k], rot: k === "prostokat" ? 90 : 0 });
          lez.push(h);
        }
        await wyrosnij(c);
        await c.ujecie("sredni", { na: ["lisek", ...lez] });                // the pieces in the grass, by Fox
        await c.say("lisek", "line.b_plan");
        await c.ujecie("ogolny");
        for (const p of plan) {
          await c.say(p.kind === "kwadrat" || p.kind === "trojkat" ? "sowa" : "lisek", p.linia);
          const items = lez.filter((h) => !h.wDomu);
          const t = await c.slots({ items, slots: [{ x: p.x, y: p.y, w: p.size * (p.kind === "prostokat" ? 0.9 : 1.6), h: p.size * (p.kind === "prostokat" ? 1.7 : 1.1), ksztalt: p.kind, size: p.size, rot: p.rot, accept: (it) => it.ksztalt === p.kind }], wrong: "line.b_nie_ta" });
          await t.done();
          const h = items.find((it) => it.slot); h.wDomu = true; h.naWierzch?.(); t.remove();
        }
        lez.filter((h) => !h.wDomu).forEach((h) => h.remove());
        const dom = lez.filter((h) => h.wDomu);
        await c.rozblysk(dom.find((h) => h.ksztalt === "kwadrat") || dom[0]);
        await c.ujecie("sredni", { na: [...dom, "sowa"] });                  // the finished house
        await c.say("sowa", "line.b_gotowy", { anim: "Brawo" });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.b_jak_rysunek", { anim: "Radosc" });
        // Hedgehog walks into the house
        await c.ujecie("ogolny");
        await c.przejdz("jez", [[DOM.x - 0.45, -2.6]]);
        await c.ujecie("zblizenie", { na: "jez" });
        await c.emocja("jez", "serce", { anim: "Radosc" });
        await c.say("jez", "line.b_dziekuje");
        c.clear();
        await c.ujecie("ogolny");
        await c.przejdz("jez", [[4.9, -3.3]]);
      },
      // C. the playground: Bunny's kite got turned - a square is a square however it is turned
      async (c) => {
        await c.go("plac_zabaw", { enter: true });
        c.show("zajac");
        await Promise.all(["lisek", "jez"].map((n) => c.enter(n)));
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.c_latawiec", { anim: "Smutek" });
        await c.ujecie("ogolny");
        // four painted kites well apart (shapes laid side by side covered each other); the square one stands on a corner
        const hs = [];
        for (const [i, k] of tasuj(["kwadrat", "prostokat", "trojkat", "kolo"]).entries()) { const h = await c.object(`latawiec_${k}`, { x: -2.9 + i * 2.0, y: 1.1, size: 2.7 }); h.ksztalt = k; hs.push(h); }
        await c.say("lisek", "line.c_ktory");
        const ok = hs.find((h) => h.ksztalt === "kwadrat");
        dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.c_ktory_nie" });
        // the geometric square laid on the chosen kite, the others gone; to the middle, and it turns round and round
        const b = c.bounds(ok), bok = (b.right - b.left) * 0.62;      // the sail: the upper part of the picture (the tail hangs below)
        const kw = c.shape("kwadrat", { x: ok.mesh.position.x, y: b.top - (b.top - b.bottom) * 0.27, size: bok, color: KOLOR.kwadrat, rot: 45 });
        for (const h of hs) if (h !== ok) h.remove();
        await c.wait(0.5);
        ok.remove();
        await Promise.all([kw.moveTo(0.2, 0.8, 0.6), (async () => { const s0 = kw.mesh.scale.x; await c.stage.tween(0.6, (s) => kw.mesh.scale.setScalar(s0 * (1 + 0.6 * s))); })()]);
        const kreci = (async () => { for (let r = 1; r <= 4; r++) await kw.rotateTo(45 + r * 45, 0.7); })();
        await c.ujecie("sredni", { na: [kw] });                              // the turning square fills the shot
        await c.say("lisek", "line.c_obrocony", { anim: "Zgloszenie" });
        await kreci;
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.c_dziekuje", { anim: "Podskok" });
        c.clear();
        await c.ujecie("dwuujecie", { na: ["lisek", "jez"] });
        await c.say("lisek", "line.c_do_domu");
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("lisek"); c.show("sowa");
        S.puppets.lisek.korzen.position.x = -5.3; S.puppets.sowa.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await wyrosnij(c);
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1. tangram: the little house from pieces
        {
          await c.say("lisek", "line.p_tangram"); const t = await c.tangram("domek", { x: 0.4, y: 0.6, scale: 3.0 }); await t.done();
          await c.ujecie("zblizenie", { na: "sowa" }); await c.brawo("sowa"); gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 2. the triangle among turned shapes
        {
          const hs = rzad(c, tasuj(["trojkat", "kwadrat", "prostokat", "kolo"]), { size: 1.25, rot: (k, i) => 20 + ((i * 47) % 140) });
          await c.say("sowa", "line.p_trojkat");
          const ok = hs.find((h) => h.ksztalt === "trojkat");
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_trojkat_nie" });
          await c.ujecie("sredni", { na: [ok, "lisek"] });                   // the found triangle in the praise
          await c.say("lisek", "line.p_dobrze"); gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 3. trace a rectangle
        {
          await c.say("lisek", "line.p_prostokat"); const t = await c.slad("prostokat", { x: 0.3, y: 0.4, size: 3.0 });
          await c.ujecie("sredni", { na: [...t.tusz, "sowa"] }); await c.say("sowa", "line.p_dobrze"); t.remove(); gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 4. the shape with no corners
        {
          const hs = rzad(c, tasuj(["kolo", "kwadrat", "trojkat"]), { size: 1.5 });
          await c.say("sowa", "line.p_bez_rogow");
          const ok = hs.find((h) => h.ksztalt === "kolo");
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_bez_rogow_nie" });
          await c.ujecie("zblizenie", { na: "lisek" });
          await c.say("lisek", "line.p_dobrze"); gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 5. colour the house by signs (not digits: numbers come later)
        {
          await c.say("sowa", "line.p_kolorowanka_znak"); const k = await c.kolorowanka("domek", { x: 0.2, y: 0.55, size: 5.0, znaki: ["trojkat", "kwadrat", "kolo", "prostokat", "serce", "gwiazdka"] });
          await c.ujecie("sredni", { na: [{ mesh: k.obraz }] });           // the coloured picture
          await c.say("lisek", "line.p_kolorowanka_ok"); k.remove(); gw.dodaj(); await c.ujecie("ogolny");
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // home, the kitchen: what shape is the plate, the chocolate bar?
      async (c) => {
        for (const n of ["lisek", "jez"]) c.show(n);
        await wyrosnij(c);
        await c.ujecie("dwuujecie", { na: ["lisek", "jez"] });
        await c.say("lisek", "line.d_kuchnia", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        for (const [rzecz, kind, linia] of [["talerz", "kolo", "line.d_talerz"], ["czekolada", "prostokat", "line.d_czekolada"]]) {
          const r = await c.object(rzecz, { x: 0, y: 1.5, size: 1.9 });
          await wyrosnij(c);
          await c.ujecie("sredni", { na: [r] });                             // the thing first, then all the options
          await c.wait(0.6);
          await c.ujecie("ogolny");
          const ks = tasuj(["kolo", "kwadrat", "trojkat", "prostokat"]);
          const hs = rzad(c, ks, { y: -1.6, size: 1.1, kolory: ks.map((k) => KOLOR[k]) });
          await c.say("jez", linia);
          const ok = hs.find((h) => h.ksztalt === kind);
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.d_nie" });
          await c.ujecie("sredni", { na: [r, ok] });                         // the thing and its shape side by side in the shot
          await c.say("lisek", kind === "kolo" ? "line.d_kolo" : "line.d_prostokat");
          r.remove(); c.clear();
          await c.ujecie("ogolny");
        }
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.d_rodzice");
      },
    ],
  },
};
