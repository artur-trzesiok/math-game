// Lesson: shapes - circle, triangle, square, rectangle, told by corners and sides (not by colour, not by turn). Shy
// Hedgehog has no house for the winter; Fox takes a square standing on its corner for "some other shape" - Owl turns it:
// we know a shape by its corners and sides; the shapes traced on an insert; Hedgehog's drawing, torn by Bunny and put
// together; the house built, its roof made from three dots; Bunny's kite found (a turned square again) and flown. At
// home, shape biscuits for Hedgehog's tea: one traced, Bunny's turned square, the plates, "I spy", the tea seen.
// Script in scenario.md.

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
    { kind: "trojkat", x: DOM.x, y: gora + 0.45 * dach, size: dach, rot: 0 },
    { kind: "kolo", x: DOM.x + 0.45, y: DOM.dol + s * 0.62, size: 0.6, rot: 0, linia: "line.b_okno" },
    { kind: "prostokat", x: DOM.x - 0.45, y: DOM.dol + 0.68, size: 0.85, rot: 90, linia: "line.b_drzwi" },
  ];
};

// a row of shapes laid out by their drawn widths (turned ones included) with a clear gap: a fixed step let a turned
// rectangle lie over the triangle in "which one is the triangle?"; distinct colours, so colour never decides
function rzad(c, kinds, { y = 0.8, size = 1.3, rot = () => 0, przerwa = 0.55, kolory = null } = {}) {
  const barwy = kolory || tasuj(Object.values(KOLOR));
  const hs = kinds.map((k, i) => c.shape(k, { x: 0, y, size, color: barwy[i % barwy.length], rot: rot(k, i) }));
  const szer = kinds.map((k, i) => { const a = rot(k, i) * Math.PI / 180, xs = OBRYS[k].map(([u, v]) => (u * Math.cos(a) - v * Math.sin(a)) * size); return Math.max(...xs) - Math.min(...xs) + 0.3; });
  let x = -(szer.reduce((a, b) => a + b, 0) + przerwa * (hs.length - 1)) / 2;
  hs.forEach((h, i) => { h.mesh.position.x = x + szer[i] / 2; h.home = { x: h.mesh.position.x, y }; x += szer[i] + przerwa; });
  return hs;
}

// touch every corner (before counting to four): each touched corner gets a pencil ring, no numbers
async function rogi(c, ksztalt, wrong) {
  const r = c.corners(ksztalt), znaczki = [];
  while (r.some((q) => !q.dotkniety)) {
    const zostale = r.filter((q) => !q.dotkniety);
    dobre(zostale); const hit = await c.task({ targets: zostale, correct: zostale, wrong }); dobre(zostale, false);
    hit.dotkniety = true; znaczki.push(await c.circle(hit, { margin: 0.12, duration: 0.3 }));
  }
  return { remove: () => { znaczki.forEach((z) => z.remove()); r.forEach((q) => q.remove?.()); } };
}

// the meadow's shapes: a square, a circle, a triangle, a rectangle and a second square standing on its corner
const KSZTALTY_LAKI = ["kwadrat", "kolo", "kwadrat_rog", "trojkat", "prostokat"];
const lakaKsztalt = (c, kolejnosc = KSZTALTY_LAKI) => {
  const hs = rzad(c, kolejnosc.map((k) => (k === "kwadrat_rog" ? "kwadrat" : k)), { y: 1.25, size: 1.15, przerwa: 0.45, rot: (k, i) => (kolejnosc[i] === "kwadrat_rog" ? 45 : 0) });
  hs.forEach((h, i) => { h.rog = kolejnosc[i] === "kwadrat_rog"; });
  return hs;
};

export default {
  id: "shapes",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -4.9 }, jez: { side: "right", x: 4.9 }, sowa: { side: "right", x: 3.0 }, zajac: { side: "left", x: -2.7 } },
  backgrounds: { story: "laka", practice: { kolor: "#eef3d9", motyw: "figury" }, apply: "dom" },
  stages: {
    story: [
      // A. the meadow: Hedgehog has no house; Fox's pointy square "is another shape"; Owl turns it; corners and sides,
      // the shapes traced on an insert; back in the grass the child finds every square
      async (c) => {
        c.show("jez");
        const krzak = await c.object("krzak", { x: 4.9, y: -1.9, size: 2.9, z: 0.6 });
        krzak.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 35; });   // stickers draw under puppets (10 < 20): the bush must hide Hedgehog
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.ujecie("sredni", { na: [krzak, "lisek"] });                  // Fox asks about the bush in front of him
        await c.say("lisek", "line.a_kto_tam");
        krzak.remove(); c.stage.bump(c.stage.puppets.jez);
        await c.ujecie("zblizenie", { na: "jez" });                          // shy and sad
        await c.say("jez", "line.a_nie_mam_domu", { anim: "Smutek" });
        await c.ujecie("dwuujecie", { na: ["sowa", "jez"] });
        await c.say("sowa", "line.a_zbudujemy", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the shapes grow in over the grass
        const hs = lakaKsztalt(c);
        await wyrosnij(c);
        await c.say("lisek", "line.a_z_czego");
        await c.say("sowa", "line.a_z_figur", { anim: "Wskazanie" });
        // Fox's mistake: the square on its corner is "some other shape"
        const prosty = hs.find((h) => h.ksztalt === "kwadrat" && !h.rog), rog = hs.find((h) => h.rog);
        await c.ujecie("sredni", { na: ["lisek", prosty, rog] });
        c.stage.bump(prosty, 0.3);
        await c.say("lisek", "line.a_nie_kwadrat", { anim: "Wskazanie" });
        await c.ujecie("dwuujecie", { na: ["sowa", "lisek"] });              // the objection
        await c.say("sowa", "line.a_obroc");
        await c.ujecie("sredni", { na: [prosty, rog] });                     // the pointy one turns: the same as the square
        await rog.rotateTo(0, 0.9);
        c.stage.bump(rog, 0.3);
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.wonder("lisek");
        await c.say("lisek", "line.a_jak_poznac");
        await c.ujecie("dwuujecie", { na: ["sowa", "lisek"] });
        await c.say("sowa", "line.a_rogi_boki", { anim: "Zgloszenie" });
        await c.say("lisek", "line.a_co_to");
        await c.say("sowa", "line.a_pokaze", { anim: "Radosc" });
        // the method on a plain colour: a circle (no corners), a triangle (three corners), a square (equal sides)
        await c.go({ kolor: "#eef3d9", motyw: "figury" }, { ciecie: true });
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
        const r = await rogi(c, kw, "line.a_policz");
        await c.ujecie("sredni", { na: [kw, "sowa"] });
        await c.say("sowa", "line.a_cztery_rogi");
        r.remove(); kw.remove(); c.clear();
        // back on the meadow: the pointy one lies on its corner again - which ones are squares?
        await c.go("laka", { ciecie: true });
        await c.ujecie("ogolny");
        const hs2 = lakaKsztalt(c, tasuj(KSZTALTY_LAKI));
        await wyrosnij(c);
        const kwadraty = hs2.filter((h) => h.ksztalt === "kwadrat");
        await c.say("sowa", "line.a_wszystkie_kwadraty");
        dobre(kwadraty); await c.task({ targets: hs2, correct: kwadraty, wszystkie: true, wrong: "line.a_kwadraty_nie" }); dobre(kwadraty, false);
        await c.ujecie("sredni", { na: ["lisek", ...kwadraty] });            // Fox has got it: both squares in the shot
        await c.say("lisek", "line.a_oba_kwadraty", { anim: "Radosc" });
        c.clear();
        await c.ujecie("zblizenie", { na: "lisek" });                        // Fox, eager to start
        await c.say("lisek", "line.a_budujemy", { anim: "Podskok" });
      },
      // B. Hedgehog's drawing, torn by Bunny and put together; the house: walls, a roof from three dots, window, door
      async (c) => {
        const S = c.stage;
        S.puppets.sowa.korzen.position.x = 3.25; S.puppets.jez.korzen.position.x = 5.4;                         // by Hedgehog: the pieces lie on the left, over Fox's head
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.b_rysunek", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // a found picture flies with the camera: wide first
        const caly = await c.znalezisko("rysunek_domku", { skad: "jez" });
        await c.wait(0.8);
        await caly.remove();
        await c.enter("zajac");                                              // Bunny hops in and grabs it
        await c.play("zajac", "Podskok");
        await c.say("zajac", "line.b_pokaz", { anim: "Zgloszenie" });
        c.sfx("whoosh");
        await c.ujecie("zblizenie", { na: "zajac" });                        // oh no
        await c.emocja("zajac", "pot", { anim: "Smutek" });
        await c.say("zajac", "line.b_podarlem");
        await c.ujecie("dwuujecie", { na: ["sowa", "zajac"] });             // Owl comforts Bunny
        await c.say("sowa", "line.b_posklejaj");
        await c.ujecie("ogolny");                                            // a found picture flies with the camera: wide first
        const rys = await c.podarty("rysunek_domku", { kawalki: 4 });
        await c.say("jez", "line.b_caly", { anim: "Radosc" });
        await c.say("sowa", "line.b_rysunek_trojkat");
        dobre(rys.cele); await c.task({ targets: [...rys.cele, rys.tlo], correct: rys.cele[0], wrong: "line.b_rysunek_nie" }); dobre(rys.cele, false);
        await rys.zaznacz();
        await c.say("sowa", "line.b_rysunek_dach", { anim: "Radosc" });
        await rys.remove();
        const plan = czesci();
        // the pieces lie in the grass, in a row on the left: a square, a circle, an upright rectangle, one tiny triangle
        const lez = [], ROZM = { kwadrat: 1.6, trojkat: 0.7, kolo: 0.6, prostokat: 0.85 }, SZER = { kwadrat: 1.6, trojkat: 0.8, kolo: 0.6, prostokat: 0.75 };
        let lx = -4.7;                                                       // one row over Fox's and Bunny's heads, by drawn widths
        for (const k of tasuj(["kwadrat", "kolo", "prostokat", "trojkat"])) {
          const h = c.shape(k, { x: lx + SZER[k] / 2, y: 2.3, size: ROZM[k], color: KOLOR[k], rot: k === "prostokat" ? 90 : 0 });
          lx += SZER[k] + 0.6; lez.push(h);
        }
        await wyrosnij(c);
        await c.ujecie("sredni", { na: ["lisek", ...lez] });                // the pieces in the grass, by Fox
        await c.say("lisek", "line.b_plan");
        await c.ujecie("ogolny");
        const poloz = async (p, wrong = "line.b_nie_ta") => {
          const items = lez.filter((h) => !h.wDomu);
          const t = await c.slots({ items, slots: [{ x: p.x, y: p.y, w: p.size * (p.kind === "prostokat" ? 0.9 : 1.6), h: p.size * (p.kind === "prostokat" ? 1.7 : 1.1), ksztalt: p.kind, size: p.size, rot: p.rot, accept: (it) => it.ksztalt === p.kind }], wrong });
          await t.done();
          const h = items.find((it) => it.slot); h.wDomu = true; h.naWierzch?.(); t.remove();
          return h;
        };
        const [sciany, dach, okno, drzwi] = plan;
        await c.say("sowa", sciany.linia);
        await poloz(sciany);
        // the roof: the triangle in the grass is too small - three corners joined make a big one
        const maly = lez.find((h) => h.ksztalt === "trojkat");
        await c.ujecie("sredni", { na: ["zajac", maly] });
        c.stage.bump(maly, 0.3);
        await c.say("zajac", "line.b_maly_trojkat", { anim: "Wskazanie" });
        await c.ujecie("sredni", { na: [maly, ...lez.filter((h) => h.wDomu), "sowa"] });   // the tiny triangle against the walls
        await c.say("sowa", "line.b_za_maly");
        await c.ujecie("ogolny");                                            // the dots card flies up over the whole scene
        await c.say("sowa", "line.b_kropki");
        const k = await c.kropki("dach_trojkat", { znaki: "wielkosc", wrong: "line.b_kropki" });
        await c.say("sowa", "line.b_dach", { anim: "Radosc" });
        await k.remove();
        const dh = c.shape("trojkat", { x: -0.6, y: 1.4, size: dach.size, color: KOLOR.trojkat });
        await wyrosnij(c);
        await dh.moveTo(dach.x, dach.y, 0.8);
        c.stage.bump(dh, 0.2); c.sfx("plop");
        dh.wDomu = true;
        await c.say("lisek", okno.linia);
        await poloz(okno);
        await c.ujecie("zblizenie", { na: "jez" });                          // his window: a reaction
        await c.say("jez", "line.b_okienko", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the next task: every piece in the shot
        await c.say("lisek", drzwi.linia);
        await poloz(drzwi);
        maly.remove();
        const dom = [...lez.filter((h) => h.wDomu), dh];
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
        // a gust: Bunny's kite is blown away to the playground
        await c.ujecie("ogolny");
        c.czastki("liscie", { wiatr: 1.6 });
        await c.przejdz("jez", [[5.4, -3.3]]);
        // the gust, as a comic: the kite flies, the string slips, the kite sails off to the playground
        const il = await c.ilustracja("latawiec_porwany");
        await il.okienko(1); await c.wait(1.8);
        c.sfx("whoosh");
        await il.okienko(2);
        await c.say("zajac", "line.b_wiatr");
        await il.okienko(3);
        await c.say("lisek", "line.b_szukamy");
        await il.calosc(); await c.wait(1.0);
        await il.zsun();
        c.czastki(null);
        c.clear();
      },
      // C. the playground: Bunny's kite stands on its corner - "not a square"; found, it flies again (the breather)
      async (c) => {
        await c.go("plac_zabaw", { enter: true });
        await Promise.all(["lisek", "zajac", "jez"].map((n) => c.enter(n)));
        // four painted kites well apart (shapes laid side by side covered each other); the square one stands on a corner
        const hs = [];
        for (const [i, k] of tasuj(["kwadrat", "prostokat", "trojkat", "kolo"]).entries()) { const h = await c.object(`latawiec_${k}`, { x: -2.6 + i * 2.0, y: 1.5, size: 2.5 }); h.ksztalt = k; hs.push(h); }
        await wyrosnij(c);
        await c.ujecie("zblizenie", { na: "zajac" });                        // the misconception again, sad
        await c.wonder("zajac");
        await c.say("zajac", "line.c_latawiec", { anim: "Smutek" });
        await c.ujecie("ogolny");                                            // the task: every kite in the shot
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
        await c.ujecie("sredni", { na: [kw, "lisek"] });                     // the turning square, and Fox telling about it
        await c.say("lisek", "line.c_obrocony", { anim: "Zgloszenie" });
        await kreci;
        await c.ujecie("zblizenie", { na: "zajac" });                        // his kite!
        await c.emocja("zajac", "radosc", { anim: "Podskok" });
        await c.say("zajac", "line.c_dziekuje");
        c.clear();
        // the breather: Bunny's kite flies again
        await c.ujecie("ogolny");
        await c.latawiec({ ksztalt: "latawiec_kwadrat", kto: "zajac" });
        await c.ujecie("sredni", { na: ["jez"] });                           // the invitation: the thread to the home stage
        await c.say("jez", "line.c_herbatka", { anim: "Zgloszenie" });
        await c.ujecie("sredni", { na: ["lisek", "zajac"] });                // and the answer
        await c.say("lisek", "line.c_do_domu", { anim: "Radosc" });
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
          await c.ujecie("sredni", { na: ["sowa"] }); await c.say("sowa", "line.p_tangram_ok", { anim: "Brawo" }); gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 2. the triangle among turned shapes
        {
          const hs = rzad(c, tasuj(["trojkat", "kwadrat", "prostokat", "kolo"]), { size: 1.25, rot: (k, i) => 20 + ((i * 47) % 140) });
          await c.say("sowa", "line.p_trojkat");
          const ok = hs.find((h) => h.ksztalt === "trojkat");
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_trojkat_nie" });
          await c.ujecie("sredni", { na: [ok, "lisek"] });                   // the found triangle in the praise
          await c.say("lisek", "line.p_trojkat_ok"); gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 3. trace a rectangle
        {
          await c.say("lisek", "line.p_prostokat"); const t = await c.slad("prostokat", { x: 0.3, y: 0.4, size: 3.0 });
          await c.ujecie("sredni", { na: [...t.tusz, "sowa"] }); await c.say("sowa", "line.p_prostokat_ok"); t.remove(); gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 4. the shape with no corners
        {
          const hs = rzad(c, tasuj(["kolo", "kwadrat", "trojkat"]), { size: 1.5 });
          await c.say("sowa", "line.p_bez_rogow");
          const ok = hs.find((h) => h.ksztalt === "kolo");
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_bez_rogow_nie" });
          await c.ujecie("sredni", { na: [ok, "lisek"] });
          await c.say("lisek", "line.p_bez_rogow_ok"); gw.dodaj(); c.clear(); await c.ujecie("ogolny");
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
      // home - the third act in the kitchen: shape biscuits for Hedgehog's tea; one traced; Bunny's turned square on the
      // triangles' plate - its corners; the plates on the painted table; "I spy a shape"; the tea seen
      async (c) => {
        const S = c.stage;
        for (const n of ["lisek", "jez", "zajac"]) c.show(n);
        S.puppets.zajac.korzen.position.x = 2.5;                             // the table between Fox and the other two
        await wyrosnij(c);
        const m = await c.miejsca();
        await c.ujecie("zblizenie", { na: "jez" });                          // the thread: tomorrow's tea, and his joy
        await c.say("jez", "line.d_herbatka", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["lisek"] });                         // Fox's idea
        await c.say("lisek", "line.d_ciasteczka", { anim: "Zgloszenie" });
        // the baked biscuits over the table, in a row; one of the squares lies on its corner
        await c.ujecie("ogolny");
        const RZAD = ["kolo", "kwadrat", "trojkat", "kolo", "kwadrat_rog", "trojkat", "prostokat"];
        const ciastka = [];
        const ry = 2.55;
        for (const [i, k] of tasuj(RZAD).entries()) {
          const kind = k === "kwadrat_rog" ? "kwadrat" : k;
          const h = await c.object(`ciastko_${kind}`, { x: -3.6 + i * 1.2, y: ry, size: 0.95 });
          h.tag = kind; h.rog = k === "kwadrat_rog"; if (h.rog) h.mesh.rotation.z = Math.PI / 4;
          h.home = { x: h.mesh.position.x, y: ry }; ciastka.push(h);
        }
        await wyrosnij(c);
        // one rectangle missing: cut out of the dough by tracing
        await c.say("lisek", "line.d_brakuje");
        const t = await c.slad("prostokat", { x: -0.6, y: 0.3, size: 2.2 });
        t.remove();
        const pr = await c.object("ciastko_prostokat", { x: -0.6, y: 0.3, size: 1.3 }); pr.tag = "prostokat";
        await wyrosnij(c);
        await c.ujecie("sredni", { na: [pr, "jez"] });
        await c.say("jez", "line.d_wyciete", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await Promise.all([pr.moveTo(4.8 - 0.2, ry, 0.6), c.stage.tween(0.6, (s) => pr.mesh.scale.setScalar(pr.mesh.scale.x + (0.95 / 1.3 * pr.base - pr.mesh.scale.x) * s))]);
        pr.home = { x: pr.mesh.position.x, y: ry }; ciastka.push(pr);
        // four plates on the painted table
        const st = m.stol, xs = [-2.4, -0.8, 0.8, 2.4].map((x) => Math.max(st.x - st.w / 2 + 0.8, Math.min(st.x + st.w / 2 - 0.8, x)));
        const talerze = [];
        for (const x of xs) talerze.push(await c.zone({ x, y: st.y + 0.25, w: 1.5, h: 1.1, image: "talerz", name: "talerz" }));
        const TX = xs[3], TY = st.y + 0.25;
        await c.say("lisek", "line.d_talerzyki");
        // Bunny's mistake: a triangle on a plate, then the square on its corner with it - "it's pointy"
        const tr = ciastka.find((h) => h.tag === "trojkat"), rog = ciastka.find((h) => h.rog);
        await c.ujecie("sredni", { na: ["zajac", tr, talerze[3]] });
        await c.say("zajac", "line.d_pomoge", { anim: "Zgloszenie" });
        await tr.moveTo(TX - 0.3, TY + 0.1, 0.5); c.sfx("plop");
        await c.ujecie("ogolny");                                            // the turned square flies across to it
        await c.say("zajac", "line.d_spiczaste", { anim: "Wskazanie" });
        await rog.moveTo(TX + 0.35, TY + 0.15, 0.6); c.sfx("plop");
        await c.ujecie("zblizenie", { na: "jez" });                          // the objection
        await c.wonder("jez");
        await c.ujecie("ogolny");                                            // the biscuit comes down big between them, to be looked at
        const s0 = rog.mesh.scale.x;
        await Promise.all([rog.moveTo(-1.0, -1.6, 0.6), c.stage.tween(0.6, (s) => rog.mesh.scale.setScalar(s0 * (1 + 1.3 * s)))]);
        await c.say("jez", "line.d_rogi");
        const bok = 0.95 * 2.3 * 0.8;                                        // the biscuit's side: 0.8 of the sticker, 2.3x enlarged
        const kw = c.shape("kwadrat", { x: rog.mesh.position.x, y: rog.mesh.position.y, size: bok, color: KOLOR.kwadrat, rot: 45 });
        const r = await rogi(c, kw, "line.d_rogi");
        await c.say("jez", "line.d_kwadrat");
        r.remove(); kw.remove();
        await c.ujecie("zblizenie", { na: "zajac" });                        // he gets it
        await c.emocja("zajac", "zarowka", { anim: "Radosc" });
        await c.say("zajac", "line.d_zapomnialem");
        // all the biscuits onto the plates, each plate one shape
        await c.ujecie("ogolny");
        await Promise.all([tr.moveTo(tr.home.x, tr.home.y, 0.5), rog.moveTo(rog.home.x, rog.home.y, 0.5), c.stage.tween(0.5, (s) => rog.mesh.scale.setScalar(s0 * (2.3 - 1.3 * s)))]);
        await c.say("lisek", "line.d_poloz");
        await c.sort({ items: ciastka, zones: talerze, wrong: "line.d_poloz_nie" });
        await c.ujecie("sredni", { na: talerze });                          // the plates, each its own shape
        await c.say("jez", "line.d_gotowe", { anim: "Radosc" });
        // to the cupboard to cool; then "I spy a shape" - the game for home, shown in play
        await c.ujecie("ogolny");
        c.sfx("whoosh");
        const x0 = [...ciastka, ...talerze].map((h) => h.mesh.position.x);   // zones have no moveTo: slide every mesh
        await c.stage.tween(0.9, (s) => [...ciastka, ...talerze].forEach((h, i) => { h.mesh.position.x = x0[i] + 9 * s * s; }));
        ciastka.forEach((h) => h.remove()); talerze.forEach((h) => h.remove());
        const zegar = await c.zone({ x: 3.75, y: 3.7, w: 1.2, h: 1.2, name: "zegar", niewidoczna: true });
        await c.say("lisek", "line.d_zgadywanka", { anim: "Zgloszenie" });
        c.look("jez", zegar);
        await c.say("jez", "line.d_zegar", { anim: "Wskazanie" });
        await c.rozblysk(zegar);
        c.look("jez", null);
        // the things on the painted counter and shelf
        const polka = m.polka_dolna, blat = m.blat;
        const rzeczy = [
          await c.object("talerz", { x: polka.poza ? -2.6 : polka.x, y: polka.poza ? blat.y + 0.55 : polka.y + 0.5, size: 1.0 }),
          await c.object("kanapka_trojkat", { x: -2.2, y: blat.y + 0.55, size: 1.2 }),
          await c.object("czekolada", { x: 0.9, y: blat.y + 0.5, size: 1.3 }),
        ];
        await wyrosnij(c);
        await c.say("jez", "line.d_trzy_rogi");
        const kan = rzeczy[1];
        dobre(kan); await c.task({ targets: rzeczy, correct: kan, wrong: "line.d_trzy_rogi_nie" }); dobre(kan, false);
        await c.ujecie("sredni", { na: [kan, "lisek"] });
        await c.say("lisek", "line.d_kanapka", { anim: "Radosc" });
        c.clear();
        // the payoff: the tea at Hedgehog's house of shapes
        const il = await c.ilustracja("herbatka_u_jeza", { ruch: "najazd" });
        await c.say("jez", "line.d_herbatka_ok");
        await il.zsun();
        await c.ujecie("sredni", { na: ["lisek"] });                         // Fox to the child: the game for home
        await c.say("lisek", "line.d_rodzice", { anim: "Machanie" });
        await c.ujecie("ogolny");
      },
    ],
  },
};
