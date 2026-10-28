// Lesson: bigger and smaller - a new home for Squirrel (stage 1, rethought). Her hollow has become too small; the
// friends look for a new one: too small, too big, just right - compared by laying one on the other (the bigger
// sticks out all round). The mice need a bigger box; a catching game; at home the cups and hats go by size.
// Script in scenario.md.

const ROW_Y = 1.4;
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const MIEJSCE = { lisek: 0, sowa: 1, wiewiorka: 2 };       // by size: the biggest first (Owl is as tall as Fox, Squirrel the smallest)

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

export default {
  id: "bigger_smaller_pro",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -5.0 }, wiewiorka: { side: "left", x: -2.9 }, sowa: { side: "right", x: 4.8 } },
  backgrounds: { story: "las", practice: { kolor: "#c7ecc0", motyw: "figury" }, apply: "pokoj" },
  stages: {
    story: [
      // A. Squirrel's old hollow: she does not fit any more; the idea - a bigger one; how to tell: lay one on the other
      async (c) => {
        c.show("wiewiorka");
        const stara = await c.object("dziupla", { x: -0.6, y: 1.1, size: 1.0 });
        await c.say("wiewiorka", "line.a_zapasy", { anim: "Radosc" });
        // she squeezes in - only her head goes in, she bounces back
        const L = c.stage.puppets.wiewiorka;
        await c.przejdz("wiewiorka", [[-1.3, -2.4]]);
        c.stage.shake(stara);
        await c.stage.tween(0.5, (s) => { L.korzen.scale.set(1 - 0.18 * Math.sin(s * Math.PI), 1 + 0.12 * Math.sin(s * Math.PI), 1); });
        await c.przejdz("wiewiorka", [[-2.9, -3.3]]);
        await c.emocja("wiewiorka", "pot", { anim: "Smutek" });
        await c.say("wiewiorka", "line.a_nie_mieszcze");
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.say("lisek", "line.a_za_mala");
        await c.say("sowa", "line.a_nowa", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.a_jak");
        await c.say("sowa", "line.a_metoda");
        await c.say("lisek", "line.a_w_droge", { anim: "Machanie" });
        c.clear();
      },
      // B. three hollows: too big, too small, just right - each compared with the old door laid onto it
      async (c) => {
        await c.ujecie("ogolny");
        const duza = await c.object("dziupla", { x: -1.6, y: 1.5, size: 2.2 });
        const mala = await c.object("dziupla", { x: 0.9, y: 1.3, size: 0.7 });
        const sr = await c.object("dziupla", { x: 2.9, y: 1.4, size: 1.35 });
        await c.say("sowa", "line.b_trzy");
        // the biggest first
        await c.say("lisek", "line.b_najwieksza");
        dobre(duza); await c.task({ targets: [duza, mala, sr], correct: duza, wrong: "line.b_najwieksza_nie" }); dobre(duza, false);
        await c.say("wiewiorka", "line.b_sprobuje");
        c.czastki("liscie", { wiatr: 1.4 });
        await c.emocja("wiewiorka", "zimno", { anim: "Smutek" });
        await c.say("wiewiorka", "line.b_za_duza");
        c.czastki(null);
        // the smallest
        await c.say("lisek", "line.b_najmniejsza");
        dobre(mala); await c.task({ targets: [duza, mala, sr], correct: mala, wrong: "line.b_najmniejsza_nie" }); dobre(mala, false);
        c.stage.shake(mala);
        await c.say("wiewiorka", "line.b_za_mala");
        // the last one: laid on the old door, it sticks out a little - bigger than the old, smaller than the huge
        await c.say("sowa", "line.b_sprawdzmy");
        const stara = await c.object("dziupla", { x: -4.2, y: 1.3, size: 1.0 });
        const n = await c.nalozenie(stara, sr);
        await c.say("sowa", "line.b_wystaje");
        await n.cofnij(0.3);
        await c.say("sowa", "line.b_wskaz_wieksza");
        dobre(sr); await c.task({ targets: [stara, sr], correct: sr, wrong: "line.b_wskaz_wieksza_nie" }); dobre(sr, false);
        await c.emocja("wiewiorka", "serce", { anim: "Radosc" });
        await c.say("wiewiorka", "line.b_w_sam_raz");
        c.clear();
        // helping: the mice move into the old hollow's box - too small for all of them; the bigger box
        const myszki = await c.object("myszki", { x: -0.6, y: -1.9, size: 1.3 });
        await c.say("sowa", "line.b_myszki");
        const p1 = await c.object("pudelko", { x: 1.4, y: 1.2, size: 0.9 }), p2 = await c.object("pudelko", { x: -1.8, y: 1.3, size: 1.7 });
        await c.say("lisek", "line.b_pudelko");
        dobre(p2); await c.task({ targets: [p1, p2], correct: p2, wrong: "line.b_pudelko_nie" }); dobre(p2, false);
        await myszki.moveTo(p2.mesh.position.x, p2.mesh.position.y - 0.1, 0.6); myszki.remove();
        await c.say("sowa", "line.b_dziekuja");
        c.clear();
        // the breather: acorns fall from the oak - catch the big ones for the new store
        await c.say("lisek", "line.b_lapanie", { anim: "Podskok" });
        for (let r = 0; r < 3; r++) {
          const m = tasuj([[-2.4, 1.6], [0, 0.8], [2.2, 1.8], [-1.0, -0.6], [1.6, -0.4]]);
          const d = await c.object("zoledz", { x: m[0][0], y: m[0][1], size: 1.3 }), k = await c.object("zoledz", { x: m[1][0], y: m[1][1], size: 0.65 });
          dobre(d); await c.task({ targets: [d, k], correct: d, wrong: "line.b_lapanie" });
          c.clear();
        }
        await c.say("wiewiorka", "line.b_do_domu");
      },
    ],
    practice: [
      // five games, a star each
      async (c) => {
        c.show("lisek"); c.show("wiewiorka"); c.show("sowa");
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("wiewiorka", "line.p_start");
        // 1-2. which is bigger, then the overlap shows it
        for (const rzecz of ["listek", "talerz"]) {
          const duzy = Math.random() < 0.5;
          const a = await c.object(rzecz, { x: duzy ? -1.2 : 1.6, y: 1.0, size: 1.6 }), b = await c.object(rzecz, { x: duzy ? 1.6 : -1.2, y: 1.0, size: 1.05 });
          await c.say("lisek", "line.p_wiekszy");
          dobre(a); await c.task({ targets: [a, b], correct: a, wrong: "line.p_poloz" });
          const n = await c.nalozenie(b, a); await c.say("wiewiorka", "line.p_wystaje"); await n.cofnij(0.3);
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
          c.cien(cien, false); await c.say("wiewiorka", duzy ? "line.p_cien_duzy" : "line.p_cien_maly");
          gw.dodaj(); c.clear();
        }
        // 5. caps by size: the biggest for Fox, the middle for Owl, the smallest for Squirrel
        const czapki = await rzeczy(c, "czapka_z_daszkiem", [1.5, 1.2, 0.9], { odstep: 2.2 });
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
        await c.say("wiewiorka", "line.d_parapetowka", { anim: "Radosc" });
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
        await c.say("lisek", "line.d_pasuje", { anim: "Radosc" });
        await c.say("sowa", "line.d_rodzice");
      },
    ],
  },
};
