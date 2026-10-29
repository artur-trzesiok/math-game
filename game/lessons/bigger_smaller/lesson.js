// Lesson: bigger and smaller - a new home for Squirrel (stage 1). Her hollow has become too small (she gets stuck, only
// her head in); the friends look for a new one: too small, too big, just right - compared with the old hollow's round
// door, carried along and held against each new hole (a hollow cannot be carried; its door can): a dark gap round the
// door - bigger, the door covering the hole and sticking out - smaller. The mice need a bigger box; rock-paper-scissors
// for who carries the first box; at Squirrel's new oak the store goes up into the hollow. At home the housewarming in
// the new hollow: the big box on the small shelf falls, the boxes by size onto the painted shelves, chairs, cups, the party,
// and the shoes laid one on the other. Script in scenario.md.

const ROW_Y = 1.4;
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wyrosnij = (c) => c.stage.tween(0.4, () => {});                  // let things popping in reach their size before a shot frames them
const DZIUPLA = { x: 3.14, y: 2.55 };                       // the hole of the new hollow in the dab_wiewiorki plate
const MIEJSCE = { sowa: 0, lisek: 1, wiewiorka: 2 };       // head sizes, biggest first: Owl has much the biggest head, Squirrel the smallest
let kpnWygral = "dziecko";                                   // who carries the first box (story B -> C)

// garment stickers of one kind at sizes (biggest first); h.ranga = 0 for the biggest
async function rzeczy(c, rzecz, rozmiary, { y = -2.4, odstep = 2.2 } = {}) {
  const out = [];
  for (const [k, i] of tasuj(rozmiary.map((_, i) => i)).entries()) {
    const h = await c.ubranie(rzecz, { x: (k - (rozmiary.length - 1) / 2) * odstep, y, size: rozmiary[i] }); h.ranga = i; out.push(h);
  }
  return out;
}
const pasujeRozmiar = (h, who) => (h.ranga === MIEJSCE[who] ? true : h.ranga < MIEJSCE[who] ? "za_duze" : "za_male");
const zleRozmiar = (o) => (o === "za_duze" ? "line.za_duze" : "line.za_male");

// the hole of a "dziupla" sticker: centre and diameter (measured on the picture: 0.43 of the sticker, a bit above the middle)
const OTWOR = { dx: 0.0, dy: 0.025, d: 0.43 }, DRZWI = 0.94;      // DRZWI: the door's circle in its own sticker
const otwor = (h) => ({ x: h.mesh.position.x + OTWOR.dx * h.base, y: h.mesh.position.y + OTWOR.dy * h.base, d: OTWOR.d * h.base });
// the door always in front of the hollows (stickers draw at 10): a drag lifts it and puts its own order back
const przed = (drzwi) => { drzwi.mesh.position.z = 0.6; drzwi.mesh.traverse((m) => { if (m.isMesh) m.renderOrder = 12 + (m.renderOrder % 1); }); };
// the door held against a hollow's hole, centred; an orange pencil ring round the larger of the two; returns {zdejmij()}
async function przyloz(c, drzwi, h) {
  const o = otwor(h); przed(drzwi);
  await drzwi.moveTo(o.x, o.y, 0.6); c.sfx("tap");
  const r = Math.max(o.d, drzwi.base * DRZWI) / 2 + 0.06;
  const kolo = await c.line(Array.from({ length: 49 }, (_, i) => [o.x + r * Math.cos(i / 48 * 2 * Math.PI), o.y + r * Math.sin(i / 48 * 2 * Math.PI)]), { color: "#e8702a", width: 0.07, duration: 0.5, strong: true });
  return { zdejmij: async () => { kolo.remove(); await drzwi.moveTo(drzwi.home.x, drzwi.home.y, 0.4); } };
}
// the old hollow with its door in the hole
async function staraZDrzwiami(c, x, y, size) {
  const stara = await c.object("dziupla", { x, y, size });
  const o = otwor(stara), drzwi = await c.object("drzwiczki", { x: o.x, y: o.y, size: o.d / DRZWI }); przed(drzwi);
  await wyrosnij(c);
  return { stara, drzwi };
}
// a box of the store flies up into the new hollow and goes in
async function doDziupli(c, h) {
  const s0 = h.mesh.scale.x;
  await Promise.all([h.moveTo(DZIUPLA.x, DZIUPLA.y, 0.6), c.stage.tween(0.6, (s) => { h.mesh.scale.setScalar(s0 * (1 - 0.7 * s)); })]);
  c.sfx("plop"); h.remove();
}

export default {
  id: "bigger_smaller",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -5.0 }, wiewiorka: { side: "left", x: -2.9 }, sowa: { side: "right", x: 4.8 } },
  backgrounds: { story: "las", practice: { kolor: "#c7ecc0", motyw: "figury" }, apply: "dziupla_wnetrze" },
  stages: {
    story: [
      // A. Squirrel's old hollow: she gets stuck (an event illustration); the idea - a bigger one; the method on an insert
      async (c) => {
        c.show("wiewiorka");
        const stara = await c.object("dziupla", { x: -0.4, y: 1.0, size: 1.8 });
        await wyrosnij(c);
        await c.ujecie("sredni", { na: ["wiewiorka", stara] });              // Squirrel and her old hollow
        await c.say("wiewiorka", "line.a_zapasy", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // she runs at the hollow
        const L = c.stage.puppets.wiewiorka;
        await c.przejdz("wiewiorka", [[-1.3, -2.4]]);
        c.stage.shake(stara);
        await c.stage.tween(0.5, (s) => { L.korzen.scale.set(1 - 0.18 * Math.sin(s * Math.PI), 1 + 0.12 * Math.sin(s * Math.PI), 1); });
        // the problem, big and funny: only her head goes in
        const il = await c.ilustracja("wiewiorka_utknela", { ruch: "najazd" });
        await c.say("wiewiorka", "line.a_nie_mieszcze");
        await il.zsun();
        await c.przejdz("wiewiorka", [[-2.9, -3.3]]);                        // she pops out and back
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // puffed out
        await c.emocja("wiewiorka", "pot", { anim: "Smutek" });
        await c.ujecie("ogolny");                                            // the friends come in
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.ujecie("sredni", { na: ["lisek", "wiewiorka", stara] });
        await c.say("lisek", "line.a_za_mala");
        await c.ujecie("dwuujecie", { na: ["sowa", "wiewiorka"] });          // Owl and Squirrel: the plan, the question
        await c.say("sowa", "line.a_nowa", { anim: "Zgloszenie" });
        c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.a_jak");
        // the method on a plain colour: the old hollow's round door fits exactly - a template to carry along
        await c.go({ kolor: "#f3e2b8", motyw: "liscie" }, { ciecie: true });
        const m = await staraZDrzwiami(c, 1.4, 0.7, 2.6);
        await c.ujecie("sredni", { na: [m.stara, m.drzwi, "sowa"] });
        await c.say("sowa", "line.a_drzwiczki", { anim: "Zgloszenie" });
        await m.drzwi.moveTo(-0.8, 0.9, 0.5); await c.wait(0.2); await m.drzwi.moveTo(m.drzwi.home.x, m.drzwi.home.y, 0.5); c.sfx("tap");
        await c.say("sowa", "line.a_metoda");
        // back in the forest: off they go, the door in hand
        await c.go("las", { ciecie: true });
        const n = await staraZDrzwiami(c, -0.4, 1.0, 1.8);
        await c.ujecie("ogolny");
        await n.drzwi.moveTo(-2.4, 0.9, 0.6);
        await c.say("lisek", "line.a_w_droge", { anim: "Machanie" });
        c.clear();
      },
      // B. three hollows: too big, too small, just right - each compared with the old door laid onto it; the mice; who
      // carries the first box (rock, paper, scissors)
      async (c) => {
        await c.ujecie("ogolny");
        const duza = await c.object("dziupla", { x: -1.5, y: 1.1, size: 3.1 });
        const mala = await c.object("dziupla", { x: 1.15, y: 0.9, size: 1.3 });
        const sr = await c.object("dziupla", { x: 3.4, y: 1.1, size: 2.1 });
        await c.say("sowa", "line.b_trzy");
        const drzwi = await c.object("drzwiczki", { x: 0.9, y: -1.9, size: OTWOR.d * 1.8 / DRZWI });     // the old door, the size of the old hole
        przed(drzwi);
        await wyrosnij(c);
        await c.ujecie("sredni", { na: [drzwi, "sowa"] });
        await c.say("sowa", "line.b_stara_ze_soba");
        await c.ujecie("ogolny");                                            // the task: every hollow in the shot
        const KOMENTARZ = new Map([[duza, "line.b_k_duza"], [mala, "line.b_k_mala"], [sr, "line.b_k_srednia"]]);
        const sprawdzone = new Set();
        await c.say("sowa", "line.b_przykladaj");
        while (sprawdzone.size < 3) {
          const h = await new Promise((ok) => c.stage.free({
            items: [drzwi], przeloz: { x: [duza, mala, sr].find((q) => !sprawdzone.has(q)).mesh.position.x, y: 1.1 },
            onDrop: async (d, pt) => {
              const cel = [duza, mala, sr].find((q) => Math.hypot(pt.x - q.mesh.position.x, pt.y - q.mesh.position.y) < q.base * 0.55);
              if (cel) { c.stage.endSort(); ok(cel); } else await d.moveTo(d.home.x, d.home.y, 0.35);
            },
            onTap: () => {}, onPuppet: () => c.stage.onPuppetTap?.(),
          }));
          const n = await przyloz(c, drzwi, h);
          await c.ujecie("sredni", { na: [h, drzwi] });                     // the door on the hole: what Fox talks about
          await c.say("lisek", KOMENTARZ.get(h), { anim: "Wskazanie" });
          await c.ujecie("ogolny");
          await n.zdejmij();
          sprawdzone.add(h);
          if (sprawdzone.size < 3) await c.say("sowa", "line.b_nastepna");
        }
        // then the questions: the biggest, the smallest, the one for Squirrel
        await c.say("lisek", "line.b_najwieksza");
        dobre(duza); await c.task({ targets: [duza, mala, sr], correct: duza, wrong: "line.b_najwieksza_nie" }); dobre(duza, false);
        await c.ujecie("sredni", { na: ["wiewiorka", duza] });
        await c.say("wiewiorka", "line.b_sprobuje");
        c.czastki("liscie", { wiatr: 1.4 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // cold in the huge one
        await c.emocja("wiewiorka", "zimno", { anim: "Smutek" });
        await c.say("wiewiorka", "line.b_za_duza");
        c.czastki(null);
        await c.ujecie("ogolny");
        await c.say("lisek", "line.b_najmniejsza");
        dobre(mala); await c.task({ targets: [duza, mala, sr], correct: mala, wrong: "line.b_najmniejsza_nie" }); dobre(mala, false);
        await c.ujecie("sredni", { na: ["wiewiorka", mala] });
        await c.say("wiewiorka", "line.b_za_mala");
        await c.ujecie("ogolny");
        await c.say("sowa", "line.b_ostatnia_dla");
        dobre(sr); await c.task({ targets: [duza, mala, sr], correct: sr, wrong: "line.b_ostatnia_nie" }); dobre(sr, false);
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // found it
        await c.emocja("wiewiorka", "serce", { anim: "Radosc" });
        await c.say("wiewiorka", "line.b_w_sam_raz");
        c.clear();
        // helping: the mice move into the old hollow - their box is too small; the bigger box
        const myszki = await c.object("myszki", { x: -0.6, y: -1.9, size: 1.3 });
        await wyrosnij(c);
        await c.ujecie("sredni", { na: [myszki, "sowa"] });
        await c.say("sowa", "line.b_myszki");
        await c.ujecie("ogolny");
        const p1 = await c.object("pudelko", { x: -1.4, y: 1.2, size: 0.9 }), p2 = await c.object("pudelko", { x: 2.0, y: 1.3, size: 1.7 });   // the big one near Owl: the thank-you shot holds both
        await c.say("lisek", "line.b_pudelko");
        dobre(p2); await c.task({ targets: [p1, p2], correct: p2, wrong: "line.b_pudelko_nie" }); dobre(p2, false);
        przed(myszki);                                                       // in front of the box: the mice sit in it
        await Promise.all([myszki.moveTo(p2.mesh.position.x, p2.mesh.position.y + 0.15, 0.6), c.stage.tween(0.6, (s) => myszki.mesh.scale.setScalar(1 - 0.25 * s))]);
        await c.ujecie("sredni", { na: [p2, myszki, "sowa"] });              // the mice in their new box
        await c.say("sowa", "line.b_dziekuja");
        c.clear();
        // moving day: two boxes of the store - who carries the first one? (the breather)
        const pudla = await Promise.all([c.object("pudlo_zapasy", { x: -0.6, y: -2.4, size: 1.6 }), c.object("pudlo_zapasy", { x: 1.1, y: -2.7, size: 1.0 })]);
        await wyrosnij(c);
        await c.ujecie("sredni", { na: ["lisek", "wiewiorka", ...pudla] });  // the two talk about the two boxes
        await c.say("wiewiorka", "line.b_przeprowadzka", { anim: "Podskok" });
        await c.say("lisek", "line.b_ja_pierwszy", { anim: "Zgloszenie" });
        c.clear();
        await c.ujecie("ogolny");                                            // the hands fly across the screen; Fox says who carries first, still wide
        kpnWygral = await c.kpn({ kto: "lisek" });
        await c.say("lisek", kpnWygral === "dziecko" ? "line.b_kpn_ty" : "line.b_kpn_ja", { anim: kpnWygral === "dziecko" ? "Brawo" : "Radosc" });
      },
      // C. Squirrel's new home: the oak with the just-right hollow; the two boxes go up into it - all the store fits
      async (c) => {
        await c.go("dab_wiewiorki", { enter: true });
        await Promise.all(["lisek", "wiewiorka", "sowa"].map((n) => c.enter(n)));
        await c.play("wiewiorka", "Rozgladanie");
        await c.say("wiewiorka", "line.c_nowy_dom", { anim: "Radosc" });           // wide: the oak, its hollow and its acorns in view
        await c.ujecie("sredni", { na: ["sowa"] });                          // Owl admires the oak
        await c.say("sowa", "line.c_zoledzie", { anim: "Wskazanie" });
        await c.ujecie("ogolny");                                            // the boxes and the hollow in one shot
        const s1 = await c.object("pudlo_zapasy", { x: -0.6, y: -2.4, size: 1.6 }), s2 = await c.object("pudlo_zapasy", { x: 1.1, y: -2.7, size: 1.0 });
        await wyrosnij(c);
        const dziecko = async (h) => {
          await c.say("wiewiorka", "line.c_pudlo_ty");
          const t = await c.slots({ items: [h], slots: [{ x: DZIUPLA.x, y: DZIUPLA.y, w: 1.4, h: 1.1, accept: () => true, niewidoczna: true }] });
          await t.done();
          await doDziupli(c, h);
        };
        const lisek = async (h) => {
          await c.play("lisek", "Podskok");
          await c.say("lisek", "line.c_pudlo_lis", { anim: "Radosc" });
          await doDziupli(c, h);
        };
        if (kpnWygral === "dziecko") { await dziecko(s1); await lisek(s2); } else { await lisek(s1); await dziecko(s2); }
        await c.say("wiewiorka", "line.c_zapasy_w_dziupli", { anim: "Radosc" });   // wide: the hollow they went into in view
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // the invitation, happy
        await c.say("wiewiorka", "line.b_do_domu", { anim: "Machanie" });
      },
    ],
    practice: [
      // five games, a star each
      async (c) => {
        c.show("lisek"); c.show("wiewiorka"); c.show("sowa");
        const gw = c.gwiazdki(5, { auto: false });
        await wyrosnij(c);
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });       // the two hosts of the games
        await c.say("wiewiorka", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1-2. which is bigger, then the overlap shows it
        for (const rzecz of ["listek", "talerz"]) {
          const duzy = Math.random() < 0.5;
          const a = await c.object(rzecz, { x: duzy ? -1.2 : 1.6, y: 1.0, size: 1.6 }), b = await c.object(rzecz, { x: duzy ? 1.6 : -1.2, y: 1.0, size: 1.05 });
          await c.say("lisek", "line.p_wiekszy");
          dobre(a); await c.task({ targets: [a, b], correct: a, wrong: "line.p_poloz" });
          const n = await c.nalozenie(b, a);
          await c.ujecie("sredni", { na: [a, b] });                          // the overlap close: the bigger one sticks out
          await c.say("wiewiorka", "line.p_wystaje"); await n.cofnij(0.3);
          await c.ujecie("ogolny");
          gw.dodaj(); c.clear();
        }
        // 3. the biggest of three - named
        {
          const hs = [];
          for (const [i, s] of tasuj([1.7, 1.15, 0.7]).entries()) { const h = await c.object("jablko", { x: -1.8 + i * 2.0, y: 1.0, size: s }); h.s = s; hs.push(h); }
          const ok = hs.reduce((a, b) => (a.s > b.s ? a : b));
          await c.say("lisek", "line.p_najwiekszy");
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_najwiekszy_nie" });
          await c.ujecie("sredni", { na: hs });                              // the three apples, the biggest one named
          await c.say("wiewiorka", "line.p_najwiekszy_tak");
          gw.dodaj(); c.clear();
          await c.ujecie("ogolny");
        }
        // 4. shadows: the big pear's shadow or the small one's?
        {
          const duzy = Math.random() < 0.5;
          const cien = await c.object("gruszka", { x: 0.4, y: 1.7, size: duzy ? 1.7 : 0.9 }); c.cien(cien);
          const a = await c.object("gruszka", { x: -1.2, y: -1.6, size: 1.6 }), b = await c.object("gruszka", { x: 1.9, y: -1.6, size: 0.9 });
          await c.say("lisek", "line.p_cien");
          const ok = duzy ? a : b;
          dobre(ok); await c.task({ targets: [a, b], correct: ok, wrong: "line.p_cien_nie" });
          c.cien(cien, false);
          await c.ujecie("sredni", { na: [cien, ok] });                      // the shadow and its pear
          await c.say("wiewiorka", duzy ? "line.p_cien_duzy" : "line.p_cien_maly");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 5. caps by size: the biggest for Owl, the middle for Fox, the smallest for Squirrel (over the heads, not on the floor)
        const czapki = await rzeczy(c, "czapka_z_daszkiem", [1.5, 1.2, 0.9], { y: 1.4, odstep: 2.2 });
        await c.say("lisek", "line.p_czapki");
        await c.ubieranie({ rzeczy: czapki, kto: ["lisek", "sowa", "wiewiorka"], pasuje: pasujeRozmiar, wrong: zleRozmiar });
        gw.dodaj();
        await c.ujecie("dwuujecie", { na: ["sowa", "wiewiorka"] });          // the biggest cap on Owl, the smallest on Squirrel
        await c.say("wiewiorka", "line.p_czapki_ok", { anim: "Radosc" });
      },
    ],
    apply: [
      // home - the third act in Squirrel's new hollow: the store onto the painted shelves (Squirrel puts the big box on
      // the small shelf - it falls), the chairs, the cups, the housewarming seen, the shoes laid one on the other
      async (c) => {
        for (const n of ["lisek", "wiewiorka", "sowa"]) { c.show(n); c.zdejmij(n); }
        await wyrosnij(c);
        const m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sowa"] });          // the hostess and her guest
        await c.say("wiewiorka", "line.d_parapetowka", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the boxes and both shelves in one shot
        const duzy = await c.object("pudlo_zapasy", { x: -0.4, y: -2.4, size: 2.3 }), maly = await c.object("pudlo_zapasy", { x: 2.0, y: -2.75, size: 1.3 });
        await c.say("sowa", "line.d_polki");
        // Squirrel's mistake, played: the big box onto the little shelf - it sticks out, wobbles and falls
        await c.ujecie("sredni", { na: ["wiewiorka", duzy] });
        await c.say("wiewiorka", "line.d_pudlo_wiew", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the box flies across to the shelf
        await c.take("wiewiorka", duzy);
        await c.put("wiewiorka", m.polka_mala.x, m.polka_mala.y + 0.1);
        await c.wait(0.3); c.stage.shake(duzy);
        await c.stage.tween(0.35, (s) => { duzy.mesh.rotation.z = -0.35 * s; });
        c.sfx("whoosh");
        await Promise.all([duzy.moveTo(-0.4, -2.4, 0.5), c.stage.tween(0.5, (s) => { duzy.mesh.rotation.z = -0.35 * (1 - s); })]);
        duzy.mesh.rotation.z = 0;
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // oh no
        await c.emocja("wiewiorka", "pot", { anim: "Smutek" });
        await c.say("wiewiorka", "line.d_ojej");
        await c.ujecie("sredni", { na: ["sowa", duzy, maly] });              // Owl on the two boxes
        await c.say("sowa", "line.d_pudlo_nie");
        await c.ujecie("ogolny");                                            // the shelves are the task: all in the shot
        await c.say("sowa", "line.d_postaw");
        const t = await c.slots({ items: [duzy, maly], slots: [m.polka_duza.slot((h) => h === duzy), m.polka_mala.slot((h) => h === maly)], wrong: "line.d_polka_nie" });
        await t.done();
        await c.ujecie("sredni", { na: ["wiewiorka", duzy] });               // the big box on the big shelf
        await c.say("wiewiorka", "line.d_pudla_ok", { anim: "Radosc" });
        // the chairs: the smallest for Squirrel
        await c.ujecie("ogolny");
        const krzesla = [];
        for (const [i, s] of tasuj([1.9, 1.4, 0.95]).entries()) { const h = await c.object("krzeslo", { x: -0.9 + i * 1.75, y: -2.5 + s / 2 - 0.95, size: s }); h.s = s; krzesla.push(h); }
        const najm = krzesla.reduce((a, b) => (a.s < b.s ? a : b));
        await c.say("sowa", "line.d_krzesla");
        dobre(najm); await c.task({ targets: krzesla, correct: najm, wrong: "line.d_krzesla_nie" }); dobre(najm, false);
        await c.ujecie("sredni", { na: ["wiewiorka", najm] });
        await c.say("wiewiorka", "line.d_krzesla_ok", { anim: "Radosc" });
        krzesla.forEach((h) => h.remove());
        // the tea: the big cup to big Fox, the small one to little Squirrel
        await c.ujecie("ogolny");
        const kd = await c.object("kubek", { x: 0.2, y: ROW_Y - 0.6, size: 1.4 }), km = await c.object("kubek", { x: 2.2, y: ROW_Y - 0.6, size: 0.8 });
        await c.say("sowa", "line.d_kubki");
        kd.tag = "lisek"; km.tag = "wiewiorka";
        const strefy = [];                                                     // the characters themselves take the cups
        for (const who of ["lisek", "wiewiorka"]) { const z = await c.zone({ x: c.stage.puppets[who].korzen.position.x, y: -1.6, w: 1.9, h: 3.4, name: `dla_${who}`, niewidoczna: true }); z.want = who; strefy.push(z); }
        await c.sort({ items: [kd, km], zones: strefy, wrong: "line.d_nie_ten" });
        await Promise.all([c.take("lisek", kd), c.take("wiewiorka", km)]);
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });        // both with their cups
        await c.say("lisek", "line.d_pasuje", { anim: "Radosc" });
        // the payoff: the housewarming, every box, chair and cup its size
        const il = await c.ilustracja("parapetowka", { ruch: "najazd" });
        await c.say("wiewiorka", "line.d_impreza");
        await il.zsun();
        c.clear();
        // the home task shown in play, on a plain colour: two shoes, the bigger one sticks out all round
        await c.go({ kolor: "#f6e2c4", motyw: "kola" }, { ciecie: true });
        const lewyDuzy = Math.random() < 0.5;
        const bd = await c.object("but", { x: lewyDuzy ? -0.7 : 2.1, y: -2.2, size: 2.3 }), bm = await c.object("but", { x: lewyDuzy ? 2.1 : -0.7, y: -2.45, size: 1.35 });
        await wyrosnij(c);
        await c.ujecie("ogolny");
        await c.say("lisek", "line.d_buty");
        dobre(bd); await c.task({ targets: [bd, bm], correct: bd, wrong: "line.d_buty_nie" }); dobre(bd, false);
        await c.ujecie("sredni", { na: [bd, bm, "lisek"] });
        await c.say("lisek", "line.d_buty_tak");
        await c.nalozenie(bm, bd);
        await c.ujecie("sredni", { na: ["sowa", bd] });                      // Owl gives the game to the parents, the shoes in the shot
        await c.say("sowa", "line.d_rodzice");
      },
    ],
  },
};
