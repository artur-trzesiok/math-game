// Lesson: tall and short - tall / short, taller / shorter, the tallest / the shortest (height, standing up), and the
// method: everyone on ONE ground. Bear wants to reach the treehouse; Squirrel on a stump "is the tallest now" - she jumps
// and does not reach; all on the grass, Bear is plainly the tallest. A stick for the ladder, the tallest; Mother
// Hedgehog's little one picks apples from the shortest tree; a catching game. At home: the height chart.
// Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const GROUND = -3.3;

// stand things on ONE ground: a pencil ground line; the child drags each thing onto it, it snaps with its foot on the line
async function naJednejLinii(c, rzeczy, { y0 = -1.6, xs = [-1.4, 0.4, 2.2], x0 = -2.6, x1 = 3.4 } = {}) {
  const S = c.stage, zajete = new Map();
  const kreska = await c.line([[x0, y0], [x1, y0]], { color: "#3b3631", width: 0.07, strong: true });
  const stopa = (h) => { const b = c.bounds(h); return h.mesh.position.y - b.bottom; };
  const cel = (h) => { const x = xs.find((x) => !zajete.has(x) || zajete.get(x) === h) ?? xs[0]; return [x, y0 + stopa(h)]; };
  await new Promise((ok) => S.free({
    items: rzeczy.slice(), doLinii: cel,
    onDrop: async (h, p) => {
      for (const [x, q] of zajete) if (q === h) zajete.delete(x);
      const b = c.bounds(h);
      if (Math.abs(p.y - stopa(h) - y0) > 1.6) { await h.moveTo(h.home.x, h.home.y, 0.35); return; }         // far from the line: back
      const x = xs.filter((x) => !zajete.has(x)).sort((a, q) => Math.abs(a - p.x) - Math.abs(q - p.x))[0];
      zajete.set(x, h); c.sfx("plop"); await h.moveTo(x, y0 + stopa(h), 0.2);
      if (rzeczy.every((q) => [...zajete.values()].includes(q))) { S.endSort(); ok(); }
    },
    onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
  }));
  return kreska;
}

export default {
  id: "tall_short",
  przejscia: true,
  nagrody: true,
  characters: { mis: { side: "left", x: -4.4 }, wiewiorka: { side: "right", x: 2.6 }, lisek: { side: "right", x: 4.8 }, jez: { side: "right", x: 2.4 } },
  backgrounds: { story: "las", practice: { kolor: "#fdebc4", motyw: "chmurki" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the forest: the treehouse up in a tree; Squirrel on a stump "is the tallest" - she does not reach; one ground
      async (c) => {
        const S = c.stage;
        await c.object("domek_na_drzewie", { x: 0.2, y: 2.3, size: 2.3 });
        await c.enter("mis");
        await c.say("mis", "line.a_domek", { anim: "Wskazanie" });
        await Promise.all([c.enter("wiewiorka"), c.enter("lisek")]);
        await c.say("lisek", "line.a_kto");
        // Squirrel climbs a stump: "now I'm the tallest!"
        const pien = await c.object("pieniek_niski", { x: 0.6, y: GROUND + 0.45, size: 1.6, z: 0.2 });
        await c.przejdz("wiewiorka", [[0.6, GROUND]]);
        const L = S.puppets.wiewiorka; await S.tween(0.35, (s) => { L.korzen.position.y = GROUND + 0.75 * s; }); L.podloga = GROUND + 0.75;
        await c.say("wiewiorka", "line.a_najwyzsza", { anim: "Radosc" });
        await c.play("wiewiorka", "Podskok");
        await c.emocja("wiewiorka", "smutek", { anim: "Smutek" });
        await c.say("wiewiorka", "line.a_nie_siegam");
        await c.say("lisek", "line.a_metoda", { anim: "Zgloszenie" });
        await S.tween(0.3, (s) => { L.korzen.position.y = GROUND + 0.75 * (1 - s); }); L.podloga = null;
        await c.przejdz("wiewiorka", [[2.6, GROUND]]);
        pien.remove();
        await c.say("lisek", "line.a_wszyscy");
        // who is the tallest, standing on one ground: the characters are the options
        const cele = ["mis", "wiewiorka", "lisek"].map((n) => S.puppets[n]);
        await c.say("lisek", "line.a_najwyzszy");
        dobre(cele, false); dobre(S.puppets.mis); await c.task({ targets: cele, correct: S.puppets.mis, wrong: "line.a_najwyzszy_nie" });
        await c.say("mis", "line.a_ja", { anim: "Radosc" });
        await c.say("lisek", "line.a_najnizszy");
        dobre(cele, false); dobre(S.puppets.wiewiorka); await c.task({ targets: cele, correct: S.puppets.wiewiorka, wrong: "line.a_najnizszy_nie" });
        dobre(cele, false);
        await c.say("wiewiorka", "line.a_ja_najnizsza");
        c.clear();
      },
      // B. the ladder: its side poles are gone - the tallest stick; then Mother Hedgehog's little one and the shortest tree
      async (c) => {
        await c.object("domek_na_drzewie", { x: 0.2, y: 2.3, size: 2.3 });
        await c.say("mis", "line.b_drabina");
        const d = await c.object("patyk_wysoki", { x: -1.0, y: 0.6, size: 3.2 }), k = await c.object("patyk_niski", { x: 0.9, y: 1.5, size: 3.2 });
        await c.say("lisek", "line.b_postaw");
        const l1 = await naJednejLinii(c, tasuj([d, k]), { xs: [-1.6, 0.2], x0: -3.0, x1: 1.4 });
        await c.say("lisek", "line.b_ktory");
        dobre(d); await c.task({ targets: [d, k], correct: d, wrong: "line.b_ktory_nie" }); dobre(d, false);
        await c.say("mis", "line.b_mam", { anim: "Radosc" });
        l1.remove(); c.clear();
        // the orchard: Mother Hedgehog asks for apples from the tree her little one can reach
        await c.go("sad", { enter: true });
        c.show("jez");
        await Promise.all(["mis", "lisek"].map((n) => c.enter(n)));
        await c.say("jez", "line.b_jez", { anim: "Machanie" });
        const drzewa = [];
        for (const [i, [n, s]] of tasuj([["drzewko_wysokie", 3.2], ["drzewko_niskie", 3.2], ["drzewko_wysokie", 2.3]]).entries()) {
          const h = await c.object(n, { x: -1.6 + i * 1.9, y: 0, size: s }); h.niskie = n === "drzewko_niskie"; drzewa.push(h);
        }
        await c.standOn(drzewa, -2.4, 0.01);
        await c.say("lisek", "line.b_najnizsze");
        const ok = drzewa.find((h) => h.niskie);
        dobre(ok); await c.task({ targets: drzewa, correct: ok, wrong: "line.b_najnizsze_nie" }); dobre(ok, false);
        await c.emocja("jez", "serce", { anim: "Radosc" });
        await c.say("jez", "line.b_dziekuje");
        c.clear();
        // the breather: sunflowers pop up - catch the tall one
        await c.say("mis", "line.b_lapanie", { anim: "Podskok" });
        for (let r = 0; r < 3; r++) {
          const m = tasuj([[-2.2, 0.4], [0, -0.2], [2.2, 0.6], [-1.0, 1.2], [1.2, 1.0]]);
          const w = await c.object("slonecznik_wysoki", { x: m[0][0], y: m[0][1], size: 3.0 }), n = await c.object("slonecznik_niski", { x: m[1][0], y: m[1][1], size: 3.0 });
          dobre(w); await c.task({ targets: [w, n], correct: w, wrong: "line.b_lapanie" });
          c.clear();
        }
        await c.say("lisek", "line.b_do_domu");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("mis"); c.show("lisek");
        S.puppets.mis.korzen.position.x = -5.2; S.puppets.lisek.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("lisek", "line.p_start", { anim: "Radosc" });
        // 1. which is taller, two candles on one shelf
        {
          const w = Math.random() < 0.5;
          const a = await c.object(w ? "swieca_wysoka" : "swieca_niska", { x: -1.2, y: 0, size: 3.8 }), b = await c.object(w ? "swieca_niska" : "swieca_wysoka", { x: 1.4, y: 0, size: 3.8 });
          await c.standOn([a, b], -1.6, 0.01);
          await c.say("mis", "line.p_wyzsza");
          const ok = w ? a : b;
          dobre(ok); await c.task({ targets: [a, b], correct: ok, wrong: "line.p_wyzsza_nie" });
          await c.say("lisek", "line.p_wyzsza_ok");
          gw.dodaj(); c.clear();
        }
        // 2. one on a stump: put both on one ground first
        {
          const w = await c.object("slonecznik_wysoki", { x: 1.6, y: 0.3, size: 3.4 }), n = await c.object("slonecznik_niski", { x: -1.4, y: 1.6, size: 3.4 });
          await c.say("lisek", "line.p_na_ziemi");
          const l = await naJednejLinii(c, [n, w], { xs: [-0.6, 1.2] });
          await c.say("lisek", "line.p_ktory");
          dobre(w); await c.task({ targets: [w, n], correct: w, wrong: "line.p_ktory_nie" });
          l.remove(); gw.dodaj(); c.clear();
        }
        // 3. the shortest of three sticks
        {
          const hs = [];
          for (const [i, [n, s]] of tasuj([["patyk_wysoki", 3.4], ["patyk_niski", 3.4], ["patyk_wysoki", 2.4]]).entries()) { const h = await c.object(n, { x: -1.6 + i * 1.6, y: 0, size: s }); h.niski = n === "patyk_niski"; hs.push(h); }
          await c.standOn(hs, -1.8, 0.01);
          await c.say("mis", "line.p_najnizszy");
          const ok = hs.find((h) => h.niski);
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_najnizszy_nie" });
          await c.say("lisek", "line.p_najnizszy_ok");
          gw.dodaj(); c.clear();
        }
        // 4. shadows: the tall tree's or the short one's
        {
          const w = Math.random() < 0.5;
          const cien = await c.object(w ? "drzewko_wysokie" : "drzewko_niskie", { x: 0, y: 1.1, size: 2.4 }); c.cien(cien);
          const a = await c.object("drzewko_wysokie", { x: -1.6, y: -1.2, size: 2.2 }), b = await c.object("drzewko_niskie", { x: 1.8, y: -1.2, size: 2.2 });
          await c.standOn([a, b], -2.6, 0.01);
          await c.say("lisek", "line.p_cien");
          const ok = w ? a : b;
          dobre(ok); await c.task({ targets: [a, b], correct: ok, wrong: "line.p_cien_nie" });
          c.cien(cien, false); await c.say("mis", "line.p_cien_ok");
          gw.dodaj(); c.clear();
        }
        // 5. the friends: who is taller, Bear or Fox? Fox or the little hedgehog?
        {
          c.show("jez"); S.puppets.jez.korzen.position.x = 0;
          await c.say("lisek", "line.p_kto");
          const cele = ["mis", "jez", "lisek"].map((n) => S.puppets[n]);
          dobre(cele, false); dobre(S.puppets.jez); await c.task({ targets: cele, correct: S.puppets.jez, wrong: "line.p_kto_nie" }); dobre(cele, false);
          await c.say("jez", "line.p_kto_ok");
          gw.dodaj();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      // home: the height chart on the hallway wall - everyone stands by it; the tallest, the shortest
      async (c) => {
        const S = c.stage;
        for (const [n, x] of [["mis", -3.4], ["wiewiorka", -1.0], ["lisek", 1.4], ["jez", 3.6]]) { c.show(n); S.puppets[n].korzen.position.x = x; }
        await c.object("miarka_scienna", { x: 0.2, y: -0.4, size: 5.6, z: -0.2 });
        await c.say("lisek", "line.d_miarka", { anim: "Zgloszenie" });
        const cele = ["mis", "wiewiorka", "lisek", "jez"].map((n) => S.puppets[n]);
        await c.say("mis", "line.d_najwyzszy");
        dobre(cele, false); dobre(S.puppets.mis); await c.task({ targets: cele, correct: S.puppets.mis, wrong: "line.d_nie" });
        await c.say("wiewiorka", "line.d_najnizszy");
        dobre(cele, false); dobre(S.puppets.jez); await c.task({ targets: cele, correct: S.puppets.jez, wrong: "line.d_nie" }); dobre(cele, false);
        await c.say("jez", "line.d_rosne", { anim: "Radosc" });
        await c.say("lisek", "line.d_rodzice");
      },
    ],
  },
};
