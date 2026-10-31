// Lesson: tall and short - tall / short, taller / shorter, the tallest / the shortest (height, standing up), and the
// method: everyone on ONE ground, a line over each head. Bear wants to see the whole forest from above; Squirrel on a
// stump "is the tallest now" - she jumps and does not reach; on one line (an insert) Bear is plainly the tallest. The
// tallest stick mends the ladder; from the treehouse window the whole forest (an event illustration); an old chest, its
// key on the highest peg - only the tallest reaches it; in the chest a spyglass: mice hidden in the orchard below, then
// Hedgehog, who reaches only the shortest tree, and hide and seek ("who said that?"). At home in the hallway: the
// spyglass on the hook rail, everyone marked on the height chart, Hedgehog on a pile of books (onto the shoe rack), the
// highest line, and Hedgehog on Bear's shoulders sees the forest - higher, not taller. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const GROUND = -3.3;
const KOLORY = { mis: "#8a5a2e", wiewiorka: "#e0702a", lisek: "#c8501e", jez: "#6b5a8a" };

// stand things on ONE ground: a pencil ground line; the child drags each thing onto it (a place per thing, nothing
// drawn but the line), it stands with its foot on the line
async function naKresce(c, rzeczy, { y0 = -1.6, xs = [-1.4, 0.4], x0 = -2.6, x1 = 3.4, H = 3.6 } = {}) {
  const kreska = await c.line([[x0, y0], [x1, y0]], { color: "#3b3631", width: 0.07, strong: true });
  const t = await c.slots({ items: rzeczy, slots: xs.map((x) => ({ x, y: y0 + 0.3 * H, w: 1.4, h: H, accept: () => true, niewidoczna: true, rodzaj: "stoi" })) });
  await t.done();
  return { remove: () => { kreska.remove(); t.remove(); } };
}

// a pencil line over a character's head, at `x` (the chart) or over the head itself
async function nadGlowa(c, n, { x = null, pol = 0.75 } = {}) {
  const S = c.stage, b = S._box(S.puppets[n]), cx = x ?? (b.left + b.right) / 2;
  return c.line([[cx - pol, b.top], [cx + pol, b.top]], { color: KOLORY[n], width: 0.1, duration: 0.4, strong: true });
}

export default {
  id: "tall_short",
  przejscia: true,
  nagrody: true,
  characters: { mis: { side: "left", x: -4.4 }, wiewiorka: { side: "right", x: 2.6 }, lisek: { side: "right", x: 4.8 }, jez: { side: "right", x: 2.4 } },
  backgrounds: { story: "las", practice: { kolor: "#fdebc4", motyw: "chmurki" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the forest: the treehouse up in a tree; Squirrel on a stump "is the tallest" - she does not reach; the method
      // on a plain colour: one ground line, a line over each head; the tallest and the shortest
      async (c) => {
        const S = c.stage;
        const domek = await c.object("domek_na_drzewie", { x: 0.2, y: 2.3, size: 2.3 });
        await c.enter("mis");
        await c.ujecie("sredni", { na: ["mis", domek] });                     // Bear and the treehouse he wants
        await c.say("mis", "line.a_domek", { anim: "Wskazanie" });
        await c.ujecie("ogolny");                                            // the friends come in
        await Promise.all([c.enter("wiewiorka"), c.enter("lisek")]);
        await c.say("lisek", "line.a_kto");
        // Squirrel climbs a stump: "now I'm the tallest!"
        const pien = await c.object("pieniek_niski", { x: 0.6, y: GROUND + 0.45, size: 1.6, z: 0.2 });
        await c.przejdz("wiewiorka", [[0.6, GROUND]]);
        const L = S.puppets.wiewiorka; await S.tween(0.35, (s) => { L.korzen.position.y = GROUND + 0.75 * s; }); L.podloga = GROUND + 0.75;
        await c.ujecie("sredni", { na: [S.puppets.wiewiorka, pien, domek] });   // the stump lifts her, the house is still far
        await c.say("wiewiorka", "line.a_najwyzsza", { anim: "Radosc" });
        await c.play("wiewiorka", "Podskok");
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // the consequence: sad
        await c.emocja("wiewiorka", "smutek", { anim: "Smutek" });
        await c.say("wiewiorka", "line.a_nie_siegam");
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });         // Fox answers her
        await c.say("lisek", "line.a_metoda", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // she climbs down and runs back
        await S.tween(0.3, (s) => { L.korzen.position.y = GROUND + 0.75 * (1 - s); }); L.podloga = null;
        await c.przejdz("wiewiorka", [[2.6, GROUND]]);
        pien.remove();
        // the method on a plain colour: one ground line, a line over every head
        await c.go({ kolor: "#e6f0d4", motyw: "liscie" }, { ciecie: true });
        const ziemia = await c.line([[-5.8, GROUND - 0.02], [5.8, GROUND - 0.02]], { color: "#3b3631", width: 0.08, strong: true });
        await c.say("lisek", "line.a_wszyscy", { anim: "Zgloszenie" });
        for (const n of ["mis", "wiewiorka", "lisek"]) await nadGlowa(c, n);
        const cele = ["mis", "wiewiorka", "lisek"].map((n) => S.puppets[n]);
        await c.say("lisek", "line.a_najwyzszy");
        dobre(cele, false); dobre(S.puppets.mis); await c.task({ targets: cele, correct: S.puppets.mis, wrong: "line.a_najwyzszy_nie" });
        await c.ujecie("zblizenie", { na: "mis" });                          // Bear's joy: a reaction
        await c.say("mis", "line.a_ja", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the next question: all three in the shot
        await c.say("lisek", "line.a_najnizszy");
        dobre(cele, false); dobre(S.puppets.wiewiorka); await c.task({ targets: cele, correct: S.puppets.wiewiorka, wrong: "line.a_najnizszy_nie" });
        dobre(cele, false);
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // her answer, proud anyway
        await c.say("wiewiorka", "line.a_ja_najnizsza", { anim: "Podskok" });
        ziemia.remove(); c.clear();
      },
      // B. the ladder: both sticks on one line, the taller one mends it - up into the treehouse
      async (c) => {
        const S = c.stage;
        await c.go("las", { ciecie: true });
        const domek = await c.object("domek_na_drzewie", { x: 0.2, y: 2.3, size: 2.3 });
        await c.ujecie("sredni", { na: ["mis", domek] });                     // the broken ladder
        await c.emocja("mis", "smutek", { anim: "Smutek" });
        await c.say("mis", "line.b_drabina");
        await c.ujecie("ogolny");                                            // the sticks come in: the task is wide
        const d = await c.object("patyk_wysoki", { x: -1.0, y: 0.4, size: 3.2 }), k = await c.object("patyk_niski", { x: 1.6, y: 1.3, size: 3.2 });
        await c.say("lisek", "line.b_postaw");
        const l1 = await naKresce(c, tasuj([d, k]), { xs: [-1.6, 0.6], x0: -3.0, x1: 1.8 });
        await c.ujecie("sredni", { na: ["mis", d, k] });                     // both on one ground: the difference shows
        await c.say("mis", "line.b_stoja", { anim: "Wskazanie" });
        await c.ujecie("ogolny");                                            // the question: both sticks in the shot
        await c.say("lisek", "line.b_ktory");
        dobre(d); await c.task({ targets: [d, k], correct: d, wrong: "line.b_ktory_nie" }); dobre(d, false);
        l1.remove(); k.remove();
        // the tall stick flies up to the ladder: mended
        const s0 = d.mesh.scale.x;
        await S.tween(0.7, (s) => { d.mesh.position.x += (-0.05 - d.mesh.position.x) * s; d.mesh.position.y += (1.55 - d.mesh.position.y) * s; d.mesh.scale.setScalar(s0 * (1 - 0.7 * s)); });
        c.sfx("tap"); await c.wait(0.2); c.sfx("tap"); S.bump(domek, 0.2);
        d.remove();
        await c.ujecie("zblizenie", { na: "mis" });                          // Bear's joy
        await c.say("mis", "line.b_mam", { anim: "Radosc" });
        c.clear();
      },
      // C. inside the treehouse: the whole forest from the window (Bear's wish kept); an old chest, its key on the highest
      // peg - the tallest takes it down; a spyglass, and the orchard below with the mice hidden in it
      async (c) => {
        const S = c.stage;
        await c.go("domek_wnetrze", { enter: true });
        await Promise.all(["mis", "wiewiorka", "lisek"].map((n) => c.enter(n)));
        await c.say("mis", "line.c_okno", { anim: "Podskok" });               // wide: the arrival
        const il = await c.ilustracja("las_z_domku", { ruch: "najazd" });
        await c.say("mis", "line.c_las");
        await il.zsun();
        const skrzynia = await c.object("skrzynia", { x: 0.4, y: -2.2, size: 2.0 });
        await c.ujecie("sredni", { na: ["wiewiorka", skrzynia] });           // a discovery
        await c.say("wiewiorka", "line.c_skrzynia", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["lisek", skrzynia] });               // Fox about the lock
        await c.say("lisek", "line.c_zamknieta");
        await c.ujecie("ogolny");                                            // the key high up, Squirrel jumps
        const klucz = await c.object("klucz_stary", { x: 0.0, y: 2.3, size: 1.6 });
        S.bump(klucz);
        await c.say("wiewiorka", "line.c_klucz");
        await c.play("wiewiorka", "Podskok");
        await c.emocja("wiewiorka", "smutek", { anim: "Smutek" });
        await c.say("lisek", "line.c_kto");
        const cele = ["mis", "wiewiorka", "lisek"].map((n) => S.puppets[n]);
        dobre(cele, false); dobre(S.puppets.mis); await c.task({ targets: cele, correct: S.puppets.mis, wrong: "line.c_kto_nie" }); dobre(cele, false);
        await c.walkTo("mis", -0.7);
        await c.say("mis", "line.c_zdejmuje", { anim: "Zgloszenie" });
        await c.take("mis", klucz);
        await c.walkTo("mis", -1.6);
        await c.put("mis", 0.4, -1.9);
        klucz.remove(); c.sfx("tap");
        skrzynia.remove();
        await c.object("skrzynia_otwarta", { x: 0.4, y: -2.2, size: 2.0 });
        const luneta = await c.object("luneta", { x: 0.4, y: -0.4, size: 1.7 });
        await c.rozblysk(luneta);
        await c.walkTo("mis", -4.4);
        await c.ujecie("sredni", { na: ["wiewiorka", luneta] });             // the spyglass, admired
        await c.say("wiewiorka", "line.c_luneta", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["lisek", luneta] });
        await c.say("lisek", "line.c_patrze", { anim: "Zgloszenie" });
        c.clear();
        // through the spyglass: the orchard below; Fox and Bear watch from the sides
        await c.go({ kolor: "#2b2a33", motyw: null }, { przejscie: "irys" });
        S.puppets.wiewiorka.korzen.visible = false;
        S.puppets.mis.korzen.position.x = -4.9; S.puppets.lisek.korzen.position.x = 5.2;   // clear of the circle and its count, inside 4:3
        await c.say("mis", "line.c_widze_sad", { anim: "Zgloszenie" });
        const w = c.szukaj("luneta_sad", { y: -0.55, size: 6.4 });
        await c.say("lisek", "line.c_myszki");
        await w;
        await c.ujecie("zblizenie", { na: "mis" });                          // the joy of finding them all
        await c.say("mis", "line.c_wszystkie", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // Hedgehog in the picture
        await c.say("lisek", "line.c_jezyk", { anim: "Wskazanie" });
        (await w).remove();
      },
      // D. the orchard: Hedgehog reaches only the shortest tree; hide and seek ("who said that?"); Bear's promise
      async (c) => {
        const S = c.stage;
        await c.go("sad", { enter: true, przejscie: "irys" });
        c.show("jez"); S.puppets.jez.korzen.position.x = 3.1;
        await Promise.all(["mis", "lisek"].map((n) => c.enter(n)));
        await c.ujecie("sredni", { na: ["jez"] });                            // a new friend greets us
        await c.say("jez", "line.b_jez", { anim: "Machanie" });
        await c.ujecie("ogolny");                                            // the trees grow in: the task is wide
        const drzewa = [];
        for (const [i, [n, s]] of tasuj([["drzewko_wysokie", 3.2], ["drzewko_niskie", 3.2], ["drzewko_wysokie", 2.3]]).entries()) {
          const h = await c.object(n, { x: -2.3 + i * 1.6, y: 0, size: s }); h.niskie = n === "drzewko_niskie"; drzewa.push(h);
        }
        await c.standOn(drzewa, -2.4, 0.01);
        await c.say("lisek", "line.b_najnizsze");
        const ok = drzewa.find((h) => h.niskie);
        dobre(ok); await c.task({ targets: drzewa, correct: ok, wrong: "line.b_najnizsze_nie" }); dobre(ok, false);
        await c.ujecie("zblizenie", { na: "jez" });                          // the thank-you
        await c.emocja("jez", "serce", { anim: "Radosc" });
        await c.say("jez", "line.b_dziekuje");
        c.clear();
        // the breather: hide and seek - Hedgehog and Fox hide behind the bushes, Bear seeks, the child points to the voice
        await c.ujecie("dwuujecie", { na: ["jez", "mis"] });
        await c.say("jez", "line.b_chowany", { anim: "Podskok" });
        await c.say("mis", "line.b_zasady");
        await c.ujecie("ogolny");                                            // the bushes and the hiding: wide
        await c.ktoPowiedzial({ gospodarz: "mis", kryjowki: ["jez", "lisek"] });
        await c.play("mis", "Brawo");                                        // Bear found them all
        // Hedgehog never saw the forest from above: Bear promises
        await c.ujecie("zblizenie", { na: "jez" });
        await c.emocja("jez", "smutek", { anim: "Smutek" });
        await c.say("jez", "line.b_smutno");
        await c.ujecie("dwuujecie", { na: ["mis", "jez"] });
        await c.say("mis", "line.b_obiecuje", { anim: "Machanie" });
        await c.ujecie("ogolny");                                            // off home together
        await Promise.all(["mis", "jez", "lisek"].map((n) => c.walkTo(n, 8)));
        c.clear();
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("mis"); c.show("lisek");
        S.puppets.mis.korzen.position.x = -5.2; S.puppets.lisek.korzen.position.x = 5.3;
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("dwuujecie", { na: ["mis", "lisek"] });
        await c.say("lisek", "line.p_start", { anim: "Radosc" });
        // 1. which is taller, two candles on one shelf
        {
          await c.ujecie("ogolny");                                          // the candles grow in: both in the shot
          const w = Math.random() < 0.5;
          const a = await c.object(w ? "swieca_wysoka" : "swieca_niska", { x: -1.2, y: 0, size: 3.8 }), b = await c.object(w ? "swieca_niska" : "swieca_wysoka", { x: 1.4, y: 0, size: 3.8 });
          await c.standOn([a, b], -1.6, 0.01);
          await c.say("mis", "line.p_wyzsza");
          const ok = w ? a : b;
          dobre(ok); await c.task({ targets: [a, b], correct: ok, wrong: "line.p_wyzsza_nie" }); dobre(ok, false);
          await c.ujecie("sredni", { na: ["lisek", ok] });                   // the right one named, in the shot
          await c.say("lisek", "line.p_wyzsza_ok");
          gw.dodaj(); c.clear();
        }
        // 2. one higher up: put both on one ground first
        {
          await c.ujecie("ogolny");
          const w = await c.object("slonecznik_wysoki", { x: 1.6, y: 0.3, size: 3.4 }), n = await c.object("slonecznik_niski", { x: -1.4, y: 1.6, size: 3.4 });
          await c.say("lisek", "line.p_na_ziemi");
          const l = await naKresce(c, [n, w], { xs: [-0.6, 1.2] });
          await c.ujecie("sredni", { na: ["mis", n, w] });
          await c.say("mis", "line.p_stoja");
          await c.ujecie("ogolny");
          await c.say("lisek", "line.p_ktory");
          dobre(w); await c.task({ targets: [w, n], correct: w, wrong: "line.p_ktory_nie" }); dobre(w, false);
          await c.ujecie("sredni", { na: ["mis", w] });
          await c.say("mis", "line.p_ktory_ok", { anim: "Radosc" });
          l.remove(); gw.dodaj(); c.clear();
        }
        // 3. the shortest of three sticks
        {
          await c.ujecie("ogolny");
          const hs = [];
          for (const [i, [n, s]] of tasuj([["patyk_wysoki", 3.4], ["patyk_niski", 3.4], ["patyk_wysoki", 2.4]]).entries()) { const h = await c.object(n, { x: -1.6 + i * 1.6, y: 0, size: s }); h.niski = n === "patyk_niski"; hs.push(h); }
          await c.standOn(hs, -1.8, 0.01);
          await c.say("mis", "line.p_najnizszy");
          const ok = hs.find((h) => h.niski);
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_najnizszy_nie" }); dobre(ok, false);
          await c.ujecie("sredni", { na: ["lisek", ok] });
          await c.say("lisek", "line.p_najnizszy_ok");
          gw.dodaj(); c.clear();
        }
        // 4. shadows: the tall tree's or the short one's
        {
          await c.ujecie("ogolny");
          const w = Math.random() < 0.5;
          const cien = await c.object(w ? "drzewko_wysokie" : "drzewko_niskie", { x: 0, y: 1.1, size: 2.4 }); c.cien(cien);
          const a = await c.object("drzewko_wysokie", { x: -1.6, y: -1.2, size: 2.2 }), b = await c.object("drzewko_niskie", { x: 1.8, y: -1.2, size: 2.2 });
          await c.standOn([a, b], -2.6, 0.01);
          await c.say("lisek", "line.p_cien");
          const ok = w ? a : b;
          dobre(ok); await c.task({ targets: [a, b], correct: ok, wrong: "line.p_cien_nie" }); dobre(ok, false);
          c.cien(cien, false);
          await c.ujecie("sredni", { na: ["mis", cien, ok] });               // the shadow lit up over its tree
          await c.say("mis", w ? "line.p_cien_wysokie" : "line.p_cien_niskie");
          gw.dodaj(); c.clear();
        }
        // 5. the friends: who is the shortest of us?
        {
          c.show("jez"); S.puppets.jez.korzen.position.x = 0;
          await c.ujecie("ogolny");                                          // all three in the shot
          await c.say("lisek", "line.p_kto");
          const cele = ["mis", "jez", "lisek"].map((n) => S.puppets[n]);
          dobre(cele, false); dobre(S.puppets.jez); await c.task({ targets: cele, correct: S.puppets.jez, wrong: "line.p_kto_nie" }); dobre(cele, false);
          await c.ujecie("zblizenie", { na: "jez" });                        // Hedgehog, proud
          await c.say("jez", "line.p_kto_ok", { anim: "Radosc" });
          gw.dodaj();
        }
        await c.ujecie("zblizenie", { na: "lisek" });                        // the praise at the end
        await c.praise("lisek");
      },
    ],
    apply: [
      // home - the third act in the hallway: the spyglass onto the painted hook rail; the height chart, a line over each
      // head; Hedgehog on a pile of books (the misconception again) - the books onto the painted shoe rack; the highest
      // line; Fox or Squirrel; the payoff: Hedgehog on Bear's shoulders with the spyglass - higher, not taller
      async (c) => {
        const S = c.stage, CHART = 0.6;
        const KTO = [["lisek", -2.5], ["wiewiorka", -1.0], ["jez", 2.1], ["mis", 4.1]];
        for (const [n, x] of KTO) { c.show(n); S.puppets[n].korzen.position.x = x; }
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        const m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["jez", "mis"] });                 // the thread: home with Hedgehog and the spyglass
        await c.say("mis", "line.d_powrot", { anim: "Radosc" });
        // the spyglass onto the hook rail (its right part: the middle lies under the phase icons)
        await c.ujecie("ogolny");                                            // the spyglass and the hooks: the task is wide
        const luneta = await c.object("luneta", { x: 0.4, y: -1.6, size: 1.5 });
        await c.say("mis", "line.d_powies");
        const hak = { ...m.wieszak.slot((h) => h === luneta), x: 2.2, w: 1.8 };
        const t1 = await c.slots({ items: [luneta], slots: [hak] });
        await t1.done();
        // it HANGS on a hook: lying across the rail it read as put on a shelf. Upright, its top on the nearest hook's tip
        // (the hooks and their tips measured on the painting, in fractions of the rail's place)
        const W = m.wieszak, HAKI = [0.3652, 0.4342, 0.5043, 0.5754, 0.6442].map((f) => W.x + (f - 0.5036) / 0.3535 * W.w);
        const hx = HAKI.reduce((a, b) => (Math.abs(b - luneta.mesh.position.x) < Math.abs(a - luneta.mesh.position.x) ? b : a)), czubek = W.y - (0.2217 - 0.1855) / 0.0742 * W.h;
        const bl = c.bounds(luneta), ox = (bl.left + bl.right) / 2 - luneta.mesh.position.x, oy = (bl.top + bl.bottom) / 2 - luneta.mesh.position.y;
        const szer = bl.right - bl.left;                                     // bounds ignore the turn: turned a quarter clockwise,
        await c.stage.tween(0.25, (s) => { luneta.icon.rotation.z = -Math.PI / 2 * s; });   // the drawing's middle goes (ox, oy) -> (oy, -ox)
        await luneta.moveTo(hx - oy, czubek + 0.08 + ox - szer / 2, 0.25);
        // the height chart: a line over each head
        const miarka = await c.object("miarka_scienna", { x: CHART, y: -0.4, size: 5.6, z: -0.2 });
        await c.ujecie("sredni", { na: ["lisek", miarka] });                 // Fox and the chart
        await c.say("lisek", "line.d_miarka", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // everyone walks to the chart in turn
        const kreski = {};
        for (const [n, x] of KTO.filter(([n]) => n !== "jez")) {
          await c.walkTo(n, CHART);
          kreski[n] = await nadGlowa(c, n, { x: CHART });
          await c.walkTo(n, x);
        }
        // Hedgehog wants to be taller: a pile of books
        await c.walkTo("jez", CHART);
        const L = S.puppets.jez, ks = [];
        for (let i = 0; i < 2; i++) { const h = await c.object("ksiazeczka", { x: CHART, y: GROUND + 0.25 + i * 0.45, size: 1.3 }); h.tag = "ksiazka"; ks.push(h); }
        await S.tween(0.35, (s) => { L.korzen.position.y = GROUND + 0.9 * s; }); L.podloga = GROUND + 0.9;
        await c.ujecie("zblizenie", { na: "jez" });                          // proud of the trick
        await c.say("jez", "line.d_jez_ksiazki", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "jez"] });           // Squirrel objects
        await c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.d_zabierz");
        await c.ujecie("ogolny");                                            // the books and the shoe rack: the task is wide
        await c.say("wiewiorka", "line.d_odloz");
        const polka = await c.zone({ x: -4.3, y: m.szafka_srodek.y, w: 1.9, h: m.szafka_srodek.h, name: "polka", niewidoczna: true, rodzaj: "stoi" });
        polka.want = "ksiazka";
        // Hedgehog comes down with every book taken; the one left drops to the floor
        let sort = true, ile = ks.length;
        const zejdz = (async () => {
          while (sort) {
            const zostalo = ks.filter((h) => !h.zone);
            if (zostalo.length < ile) {
              ile = zostalo.length;
              zostalo.forEach((h, i) => { h.home = { x: CHART, y: GROUND + 0.25 + i * 0.45 }; h.moveTo(h.home.x, h.home.y, 0.25); });
              const y0 = L.korzen.position.y, y1 = GROUND + 0.45 * ile;
              await S.tween(0.3, (s) => { L.korzen.position.y = y0 + (y1 - y0) * s; }); L.podloga = ile ? y1 : null;
            }
            await c.wait(0.1);
          }
        })();
        await c.sort({ items: ks, zones: [polka] });
        sort = false; await zejdz;
        L.korzen.position.y = GROUND; L.podloga = null;
        await c.say("lisek", "line.d_na_podlodze");
        kreski.jez = await nadGlowa(c, "jez", { x: CHART });
        await c.walkTo("jez", 2.1);
        // the lines on the chart say it all
        const linie = ["mis", "lisek", "wiewiorka", "jez"].map((n) => kreski[n]);
        await c.ujecie("sredni", { na: [miarka] });                          // the chart, its four lines
        await c.say("mis", "line.d_najwyzszy");
        dobre(linie, false); dobre(kreski.mis); await c.task({ targets: linie, correct: kreski.mis, wrong: "line.d_nie" }); dobre(kreski.mis, false);
        await c.ujecie("sredni", { na: ["mis", miarka] });
        await c.say("mis", "line.d_najwyzszy_ok", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the two to compare, both in the shot
        await c.say("jez", "line.d_kto_wyzszy");
        const dwoje = [S.puppets.lisek, S.puppets.wiewiorka];
        dobre(dwoje, false); dobre(S.puppets.lisek); await c.task({ targets: dwoje, correct: S.puppets.lisek, wrong: "line.d_nie" }); dobre(dwoje, false);
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });         // said both ways
        await c.say("lisek", "line.d_wyzszy_ok");
        // the payoff: Bear, the tallest, takes the spyglass down and lifts Hedgehog onto his shoulders
        await c.ujecie("zblizenie", { na: "jez" });
        await c.emocja("jez", "smutek", { anim: "Smutek" });
        await c.say("jez", "line.d_smutno");
        await c.ujecie("ogolny");                                            // Bear walks to the hooks
        await c.walkTo("mis", 2.2);
        await c.say("mis", "line.d_ramiona", { anim: "Zgloszenie" });
        await c.take("mis", luneta);
        await c.walkTo("mis", 3.2);
        const il = await c.ilustracja("jez_na_ramionach", { ruch: "najazd" });
        await c.say("jez", "line.d_widze");
        await c.say("wiewiorka", "line.d_ale");
        await c.say("jez", "line.d_rosne");
        await il.zsun();
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });         // the task for home, the chart behind
        await c.say("lisek", "line.d_rodzice");
      },
    ],
  },
};
