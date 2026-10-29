// Lesson: bigger and smaller - a new home for Squirrel (stage 1, rethought). Her hollow has become too small; the
// friends look for a new one: too small, too big, just right - compared with the old hollow's round door, carried
// along and held against each new hole (a hollow cannot be carried; its door can): a dark gap round the door - bigger,
// the door covering the hole and sticking out - smaller. The mice need a bigger box; at Squirrel's new oak a catching
// game fills the new store; at home the cups go by size.
// Script in scenario.md.

const ROW_Y = 1.4;
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wyrosnij = (c) => c.stage.tween(0.4, () => {});                  // let things popping in reach their size before a shot frames them
const DZIUPLA = { x: 3.14, y: 2.55 };                       // the hole of the new hollow in the dab_wiewiorki plate
const MIEJSCE = { sowa: 0, lisek: 1, wiewiorka: 2 };       // head sizes, biggest first: Owl has much the biggest head, Squirrel the smallest

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
// the door held against a hollow's hole, centred; an orange pencil ring round the larger of the two (the gap, or the
// door's edge on the bark); returns {zdejmij()}
// the door always in front of the hollows (stickers draw at 10): a drag lifts it and puts its own order back
const przed = (drzwi) => { drzwi.mesh.position.z = 0.6; drzwi.mesh.traverse((m) => { if (m.isMesh) m.renderOrder = 12 + (m.renderOrder % 1); }); };
async function przyloz(c, drzwi, h) {
  const o = otwor(h); przed(drzwi);
  await drzwi.moveTo(o.x, o.y, 0.6); c.sfx("tap");
  const r = Math.max(o.d, drzwi.base * DRZWI) / 2 + 0.06;
  const kolo = await c.line(Array.from({ length: 49 }, (_, i) => [o.x + r * Math.cos(i / 48 * 2 * Math.PI), o.y + r * Math.sin(i / 48 * 2 * Math.PI)]), { color: "#e8702a", width: 0.07, duration: 0.5, strong: true });
  return { zdejmij: async () => { kolo.remove(); await drzwi.moveTo(drzwi.home.x, drzwi.home.y, 0.4); } };
}

export default {
  id: "bigger_smaller",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -5.0 }, wiewiorka: { side: "left", x: -2.9 }, sowa: { side: "right", x: 4.8 } },
  backgrounds: { story: "las", practice: { kolor: "#c7ecc0", motyw: "figury" }, apply: "pokoj" },
  stages: {
    story: [
      // A. Squirrel's old hollow: she does not fit any more; the idea - a bigger one; how to tell: lay one on the other
      async (c) => {
        c.show("wiewiorka");
        const STARA = 1.8;                                                    // the old hollow: the door is cut to its hole
        const stara = await c.object("dziupla", { x: -0.4, y: 1.0, size: STARA });
        await wyrosnij(c);
        await c.ujecie("sredni", { na: ["wiewiorka", stara] });              // Squirrel and her old hollow
        await c.say("wiewiorka", "line.a_zapasy", { anim: "Radosc" });
        // she squeezes in - only her head goes in, she bounces back
        await c.ujecie("ogolny");
        const L = c.stage.puppets.wiewiorka;
        await c.przejdz("wiewiorka", [[-1.3, -2.4]]);
        c.stage.shake(stara);
        await c.stage.tween(0.5, (s) => { L.korzen.scale.set(1 - 0.18 * Math.sin(s * Math.PI), 1 + 0.12 * Math.sin(s * Math.PI), 1); });
        await c.przejdz("wiewiorka", [[-2.9, -3.3]]);
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "pot", { anim: "Smutek" });
        await c.say("wiewiorka", "line.a_nie_mieszcze");
        await c.ujecie("ogolny");
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.ujecie("sredni", { na: ["lisek", "wiewiorka", stara] });
        await c.say("lisek", "line.a_za_mala");
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.a_nowa", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_jak");
        // the old hollow's round door: it fits the old hole exactly - a template to carry along
        await c.ujecie("ogolny");
        const o = otwor(stara), drzwi = await c.object("drzwiczki", { x: o.x, y: o.y, size: o.d / DRZWI }); przed(drzwi);
        await wyrosnij(c);
        await c.ujecie("sredni", { na: [stara, drzwi, "sowa"] });            // the door in the old hole, Owl telling about it
        await c.say("sowa", "line.a_drzwiczki", { anim: "Zgloszenie" });
        await c.say("sowa", "line.a_metoda");
        await c.ujecie("ogolny");
        await c.wait(0.5); await drzwi.moveTo(-2.4, 0.9, 0.6);
        await c.say("lisek", "line.a_w_droge", { anim: "Machanie" });
        c.clear();
      },
      // B. three hollows: too big, too small, just right - each compared with the old door laid onto it
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
        await c.ujecie("ogolny");
        // the child holds the door against each hollow in any order; Fox says what it shows
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
          if (!sprawdzone.has(h)) sprawdzone.add(h);
          if (sprawdzone.size < 3) await c.say("sowa", "line.b_nastepna");
        }
        // then the question: which is the biggest? the smallest? and which one for Squirrel?
        await c.say("lisek", "line.b_najwieksza");
        dobre(duza); await c.task({ targets: [duza, mala, sr], correct: duza, wrong: "line.b_najwieksza_nie" }); dobre(duza, false);
        await c.ujecie("sredni", { na: ["wiewiorka", duza] });
        await c.say("wiewiorka", "line.b_sprobuje");
        c.czastki("liscie", { wiatr: 1.4 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
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
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "serce", { anim: "Radosc" });
        await c.say("wiewiorka", "line.b_w_sam_raz");
        c.clear();
        // helping: the mice move into the old hollow's box - too small for all of them; the bigger box
        const myszki = await c.object("myszki", { x: -0.6, y: -1.9, size: 1.3 });
        await wyrosnij(c);
        await c.ujecie("sredni", { na: [myszki] });
        await c.say("sowa", "line.b_myszki");
        await c.ujecie("ogolny");
        const p1 = await c.object("pudelko", { x: 1.4, y: 1.2, size: 0.9 }), p2 = await c.object("pudelko", { x: -1.8, y: 1.3, size: 1.7 });
        await c.say("lisek", "line.b_pudelko");
        dobre(p2); await c.task({ targets: [p1, p2], correct: p2, wrong: "line.b_pudelko_nie" }); dobre(p2, false);
        await myszki.moveTo(p2.mesh.position.x, p2.mesh.position.y - 0.1, 0.6); myszki.remove();
        await c.ujecie("sredni", { na: [p2] });                              // the mice in their new box
        await c.say("sowa", "line.b_dziekuja");
        c.clear();
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_przeprowadzka", { anim: "Podskok" });
        await c.ujecie("ogolny");
      },
      // C. Squirrel's new home: the oak with the just-right hollow; acorns fall - the big ones go into the new store
      async (c) => {
        const S = c.stage;
        await c.go("dab_wiewiorki", { enter: true });
        await Promise.all(["lisek", "wiewiorka", "sowa"].map((n) => c.enter(n)));
        await c.play("wiewiorka", "Rozgladanie");
        await c.say("wiewiorka", "line.c_nowy_dom", { anim: "Radosc" });           // wide: the oak, its hollow and its acorns in view
        await c.say("sowa", "line.c_zoledzie", { anim: "Wskazanie" });
        // the breather: acorns fall from the oak - catch the big ones for the new store; each flies into the hollow
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.b_lapanie", { anim: "Podskok" });
        await c.ujecie("ogolny");
        for (let r = 0; r < 3; r++) {
          const m = tasuj([[-3.6, 2.0], [-1.6, 2.4], [0.2, 1.6], [-1.4, 0.5], [-0.4, -1.4]]);
          const d = await c.object("zoledz", { x: m[0][0], y: m[0][1], size: 1.3 }), k = await c.object("zoledz", { x: m[1][0], y: m[1][1], size: 0.65 });
          dobre(d); await c.task({ targets: [d, k], correct: d, wrong: "line.b_lapanie" });
          k.remove();
          await Promise.all([d.moveTo(DZIUPLA.x, DZIUPLA.y, 0.6), S.tween(0.6, (s) => { d.mesh.scale.setScalar(1.3 * (1 - 0.7 * s)); })]);
          c.sfx("plop"); d.remove();
        }
        await c.say("wiewiorka", "line.c_zapasy_w_dziupli", { anim: "Radosc" });   // wide: the hollow they went into in view
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_do_domu");
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      // five games, a star each
      async (c) => {
        c.show("lisek"); c.show("wiewiorka"); c.show("sowa");
        const gw = c.gwiazdki(5, { auto: false });
        await wyrosnij(c);
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.p_start");
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
        // 3. the biggest of three
        {
          const hs = [];
          for (const [i, s] of tasuj([1.7, 1.15, 0.7]).entries()) { const h = await c.object("jablko", { x: -1.8 + i * 2.0, y: 1.0, size: s }); h.s = s; hs.push(h); }
          const ok = hs.reduce((a, b) => (a.s > b.s ? a : b));
          await c.say("lisek", "line.p_najwiekszy");
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_najwiekszy_nie" });
          gw.dodaj(); c.clear();
        }
        // 4. shadows: the big apple's shadow or the small one's?
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
        await c.praise("wiewiorka");
      },
    ],
    apply: [
      // home - the new hollow: a housewarming; the cups go by size (the big one for Fox, the small one for Squirrel)
      async (c) => {
        for (const n of ["lisek", "wiewiorka", "sowa"]) { c.show(n); c.zdejmij(n); }
        await wyrosnij(c);
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.d_parapetowka", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const duzy = await c.object("kubek", { x: -0.4, y: ROW_Y, size: 1.5 }), maly = await c.object("kubek", { x: 1.8, y: ROW_Y, size: 0.85 });
        await c.say("sowa", "line.d_kubki");
        const kto = new Map([[duzy, "lisek"], [maly, "wiewiorka"]]), maja = new Set();
        await new Promise((ok) => c.stage.free({
          items: [duzy, maly], rozdaj: { wolni: () => [...kto.values()].filter((n) => !maja.has(n)).map((who) => ({ who })), pozycja: (o) => [c.stage.puppets[o.who].korzen.position.x, -1.0] },
          onDrop: async (h, p) => {
            const who = kto.get(h), L = c.stage.puppets[who];
            if (Math.abs(p.x - L.korzen.position.x) > 1.6) { await h.moveTo(h.home.x, h.home.y, 0.35); await c.say("sowa", "line.d_nie_ten"); return; }
            maja.add(who); c.sfx("pop"); await c.take(who, h);
            if (maja.size === 2) { c.stage.endSort(); ok(); }
          },
          onTap: () => {}, onPuppet: () => c.stage.onPuppetTap?.(),
        }));
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });        // both with their cups
        await c.say("lisek", "line.d_pasuje", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.d_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
