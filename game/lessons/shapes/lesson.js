// Lesson: shapes - circle, triangle, square, rectangle, told by corners and sides (not by colour, not by turn). Shy
// Hedgehog has no house for the winter; the friends build one from shapes: the shapes traced with a finger, the
// corners counted, then walls, roof, window and door each found and put in place. Bunny's kite is a turned square;
// Hedgehog rolls about (a catching game). Practice: tangram, a turned triangle, a traced rectangle, the shape with no
// corners, colour by number. At home: what shape is a plate, a chocolate bar. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
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
        const krzak = await c.object("krzak", { x: 4.9, y: -2.1, size: 2.2, z: 0.6 });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.say("lisek", "line.a_kto_tam");
        krzak.remove(); c.stage.bump(c.stage.puppets.jez);
        await c.say("jez", "line.a_nie_mam_domu", { anim: "Smutek" });
        await c.say("sowa", "line.a_zbudujemy", { anim: "Zgloszenie" });
        await c.say("lisek", "line.a_z_czego");
        await c.say("sowa", "line.a_z_figur");
        // trace them: a circle (no corners), a triangle (count its corners), a square (count them)
        await c.say("sowa", "line.a_kolo");
        let t = await c.slad("kolo", { x: 0, y: 0.4, size: 3.0 });
        await c.say("sowa", "line.a_kolo_ok");
        t.remove();
        await c.say("sowa", "line.a_trojkat");
        t = await c.slad("trojkat", { x: -0.8, y: 0.3, size: 3.0 });
        t.remove();
        const tr = c.shape("trojkat", { x: -0.8, y: 0.3, size: 3.0, color: KOLOR.trojkat });
        await c.say("sowa", "line.a_policz_trojkat");
        await c.count(c.corners(tr), { who: "sowa" });                       // counting to three is known by now; four is not
        await c.say("sowa", "line.a_trzy_rogi");
        tr.remove(); c.clear();
        await c.say("sowa", "line.a_kwadrat");
        t = await c.slad("kwadrat", { x: -0.8, y: 0.3, size: 2.8 });
        t.remove();
        const kw = c.shape("kwadrat", { x: -0.8, y: 0.3, size: 2.8, color: KOLOR.kwadrat });
        await c.say("sowa", "line.a_policz");
        await rogi(c, kw, "line.a_policz");
        await c.say("sowa", "line.a_cztery_rogi");
        kw.remove(); c.clear();
        await c.say("lisek", "line.a_budujemy", { anim: "Radosc" });
      },
      // B. building: each part's place drawn in pencil, the child finds the right shape among them all
      async (c) => {
        const S = c.stage;
        S.puppets.sowa.korzen.position.x = 3.5; S.puppets.jez.korzen.position.x = 5.4;                         // by Hedgehog: the pieces lie on the left, over Fox's head
        const plan = czesci();
        // the pieces lie in the grass, in a row on the left (a turned rectangle and a spare triangle among them)
        const lez = [];
        for (const [i, k] of tasuj(["kwadrat", "trojkat", "kolo", "prostokat", "trojkat"]).entries()) {
          const h = c.shape(k, { x: -3.9 + (i % 3) * 1.65, y: 2.45 - Math.floor(i / 3) * 1.45, size: k === "kwadrat" ? 1.6 : k === "trojkat" ? 1.8 : k === "kolo" ? 0.6 : 0.85, color: KOLOR[k], rot: k === "prostokat" ? 90 : 0 });
          lez.push(h);
        }
        await c.say("lisek", "line.b_plan");
        for (const p of plan) {
          await c.say(p.kind === "kwadrat" || p.kind === "trojkat" ? "sowa" : "lisek", p.linia);
          const items = lez.filter((h) => !h.wDomu);
          const t = await c.slots({ items, slots: [{ x: p.x, y: p.y, w: p.size * (p.kind === "prostokat" ? 0.9 : 1.6), h: p.size * (p.kind === "prostokat" ? 1.7 : 1.1), ksztalt: p.kind, size: p.size, rot: p.rot, accept: (it) => it.ksztalt === p.kind }], wrong: "line.b_nie_ta" });
          await t.done();
          const h = items.find((it) => it.slot); h.wDomu = true; h.naWierzch?.(); t.remove();
        }
        lez.filter((h) => !h.wDomu).forEach((h) => h.remove());
        await c.say("sowa", "line.b_gotowy", { anim: "Brawo" });
        // Hedgehog walks into the house
        await c.przejdz("jez", [[DOM.x - 0.45, -2.6]]);
        await c.emocja("jez", "serce", { anim: "Radosc" });
        await c.say("jez", "line.b_dziekuje");
        c.clear();
        await c.przejdz("jez", [[4.9, -3.3]]);
      },
      // C. the playground: Bunny's kite got turned - a square is a square however it is turned; a catching game
      async (c) => {
        await c.go("plac_zabaw", { enter: true });
        c.show("zajac");
        await Promise.all(["lisek", "jez"].map((n) => c.enter(n)));
        await c.say("zajac", "line.c_latawiec", { anim: "Smutek" });
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
        await c.say("lisek", "line.c_obrocony", { anim: "Zgloszenie" });
        await kreci;
        await c.say("zajac", "line.c_dziekuje", { anim: "Podskok" });
        c.clear();
        // the breather: Hedgehog rolls into a ball and bounces about - catch him three times
        await c.say("jez", "line.c_turlam", { anim: "Radosc" });
        for (const [x, y] of tasuj([[-2.2, 1.2], [0.4, 0.4], [2.4, 1.6], [-0.8, -0.6], [1.6, -0.8]]).slice(0, 3)) {
          const k = await c.object("jez", { x, y, size: 1.0 });
          dobre(k); await c.task({ targets: [k], correct: k, wrong: "line.c_turlam" });
          c.sfx("hop"); k.remove();
        }
        await c.say("lisek", "line.c_do_domu");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("lisek"); c.show("sowa");
        S.puppets.lisek.korzen.position.x = -5.3; S.puppets.sowa.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        // 1. tangram: the little house from pieces
        { await c.say("lisek", "line.p_tangram"); const t = await c.tangram("domek", { x: 0.4, y: 0.6, scale: 3.0 }); await t.done(); await c.say("sowa", "line.p_dobrze"); gw.dodaj(); c.clear(); }
        // 2. the triangle among turned shapes
        {
          const hs = [];
          for (const [i, k] of tasuj(["trojkat", "kwadrat", "prostokat", "kolo"]).entries()) hs.push(c.shape(k, { x: -2.4 + i * 1.6, y: 0.8, size: 1.3, color: tasuj(Object.values(KOLOR))[0], rot: (i * 47) % 180 }));
          await c.say("sowa", "line.p_trojkat");
          const ok = hs.find((h) => h.ksztalt === "trojkat");
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_trojkat_nie" });
          await c.say("lisek", "line.p_dobrze"); gw.dodaj(); c.clear();
        }
        // 3. trace a rectangle
        { await c.say("lisek", "line.p_prostokat"); const t = await c.slad("prostokat", { x: 0.3, y: 0.4, size: 3.0 }); t.remove(); await c.say("sowa", "line.p_dobrze"); gw.dodaj(); c.clear(); }
        // 4. the shape with no corners
        {
          const hs = [];
          for (const [i, k] of tasuj(["kolo", "kwadrat", "trojkat"]).entries()) hs.push(c.shape(k, { x: -2.0 + i * 2.0, y: 0.8, size: 1.5, color: tasuj(Object.values(KOLOR))[0] }));
          await c.say("sowa", "line.p_bez_rogow");
          const ok = hs.find((h) => h.ksztalt === "kolo");
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_bez_rogow_nie" });
          await c.say("lisek", "line.p_dobrze"); gw.dodaj(); c.clear();
        }
        // 5. colour the house by numbers
        { await c.say("sowa", "line.p_kolorowanka"); const k = await c.kolorowanka("domek", { x: 0.2, y: 0.55, size: 5.0 }); await c.say("lisek", "line.p_kolorowanka_ok"); k.remove(); gw.dodaj(); }
        await c.praise("sowa");
      },
    ],
    apply: [
      // home, the kitchen: what shape is the plate, the chocolate bar?
      async (c) => {
        for (const n of ["lisek", "jez"]) c.show(n);
        await c.say("lisek", "line.d_kuchnia", { anim: "Zgloszenie" });
        for (const [rzecz, kind, linia] of [["talerz", "kolo", "line.d_talerz"], ["czekolada", "prostokat", "line.d_czekolada"]]) {
          const r = await c.object(rzecz, { x: 0, y: 1.5, size: 1.9 });
          const hs = [];
          for (const [i, k] of tasuj(["kolo", "kwadrat", "trojkat", "prostokat"]).entries()) hs.push(c.shape(k, { x: -2.4 + i * 1.6, y: -1.6, size: 1.1, color: KOLOR[k] }));
          await c.say("jez", linia);
          const ok = hs.find((h) => h.ksztalt === kind);
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.d_nie" });
          await c.say("lisek", kind === "kolo" ? "line.d_kolo" : "line.d_prostokat");
          r.remove(); c.clear();
        }
        await c.say("jez", "line.d_rodzice");
      },
    ],
  },
};
