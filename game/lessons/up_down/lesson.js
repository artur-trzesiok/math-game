// Lesson: up and down - up is towards the sky, down towards the ground, whichever way you stand; at the top, at the
// bottom, higher. Squirrel's apple day, for a pie: Bunny stands on his head and says the apples are down; up = sky, on
// an insert; the wind tears Fox's lift plan - put together, its top and bottom marked; rock-paper-scissors with Bunny for
// who sends the basket up; the apples come down. The autumn orchard: the wind sort, a walk, Squirrel's map - up the hill
// home. At home the wind's mess, Bunny on his head again; hooks up, doormat down, the basket on the top shelf, the
// balloon fetched from under the ceiling by the lift; the pie, seen; "jump up!" played. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// things in a row; each carries its tag (gora / dol), the zones take the tags they name
async function rzad(c, nazwy, tagi, { y = 0.5, x0 = -1.6, krok = 1.0, size = 0.95 } = {}) {
  const out = [];
  for (const [i, n] of tasuj(nazwy).entries()) { const h = await c.object(n, { x: x0 + i * krok, y, size }); h.tag = tagi[n]; out.push(h); }
  return out;
}
async function goraDol(c, nazwy, tagi, { x = 0.9, w = 5.2, gora = ["niebo", 2.55, 1.3], dol = ["trawa", -2.5, 1.1], wrong = "line.nie_tu" } = {}) {
  const zG = await c.zone({ x, y: gora[1], w, h: gora[2], name: gora[0] }), zD = await c.zone({ x, y: dol[1], w, h: dol[2], name: dol[0] });
  zG.want = "gora"; zD.want = "dol";
  const items = await rzad(c, nazwy, tagi, { x0: x - 2.5 });
  await c.sort({ items, zones: [zG, zD], wrong });
}
// Bunny on his head (and back): turned about his feet and lifted by his height
async function naGlowie(c, on) {
  const L = c.stage.puppets.zajac, H = 3.1;
  if (L.y0 === undefined) L.y0 = L.korzen.position.y;
  const y0 = L.y0, a = on ? 0 : 1, b = on ? 1 : 0;
  L.bezCienia = true;
  await c.stage.tween(0.5, (s) => { const t = a + (b - a) * s; L.korzen.rotation.z = Math.PI * t; L.korzen.position.y = y0 + H * t; });
  if (!on) L.bezCienia = false;
}

export default {
  id: "up_down",
  przejscia: true,
  nagrody: true,
  characters: { wiewiorka: { side: "left", x: -4.8 }, lisek: { side: "right", x: 2.8 }, zajac: { side: "right", x: 4.6 } },
  backgrounds: { story: "sad", practice: { kolor: "#e8f1fb", motyw: "chmurki" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the orchard: the apples are up in the tree, for a pie; Bunny on his head says they are down; up = sky (an
      // insert); the wind tears Fox's plan; rock-paper-scissors for the rope; the lift brings the apples down
      async (c) => {
        c.show("wiewiorka");
        await Promise.all([c.enter("lisek", "right"), c.enter("zajac", "right")]);
        const jabloni = async () => { const out = []; for (const [x, y] of [[-4.7, 2.6], [-3.6, 2.1], [-5.2, 1.6]]) out.push(await c.object("jablko", { x, y, size: 0.9 })); return out; };
        let jablka = await jabloni();
        await c.ujecie("sredni", { na: ["wiewiorka", ...jablka] });           // the apples up in the tree
        await c.say("wiewiorka", "line.a_jablka", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "zajac" });                        // his funny idea
        await c.say("zajac", "line.a_inaczej", { anim: "Podskok" });
        await c.ujecie("ogolny");                                            // the handstand, with the apples up in the shot
        await naGlowie(c, true);
        await c.say("zajac", "line.a_na_dole");
        await Promise.all([c.play("wiewiorka", "Radosc"), c.play("lisek", "Radosc")]);
        // the idea on a plain sky: the sun up, a stone down, Bunny still on his head
        await c.go({ kolor: "#dcecfa", motyw: "chmurki" }, { ciecie: true });
        const slonce = await c.object("znak_slonce", { x: 1.0, y: 2.4, size: 1.3 }), kamien = await c.object("kamyk", { x: 1.0, y: -2.8, size: 0.9 });
        await c.ujecie("sredni", { na: ["lisek", "zajac", slonce, kamien] });   // the two, the sun up and the stone down
        await c.say("lisek", "line.a_niebo", { anim: "Zgloszenie" });
        await naGlowie(c, false);
        c.look("zajac", slonce);
        await c.say("zajac", "line.a_rozumiem", { anim: "Kiwanie" });
        kamien.remove(); slonce.remove();
        await c.go("sad", { ciecie: true });
        jablka = await jabloni();
        // how to get them down? Fox's plan - and the wind tears it
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "pot");
        await c.say("wiewiorka", "line.a_jak_zdjac");
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });
        await c.say("lisek", "line.a_plan", { anim: "Zgloszenie" });
        c.czastki("liscie", { wiatr: 2.4 }); c.sfx("whoosh");                // the gust tears the plan out of his paw
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.emocja("lisek", "wykrzyknik", { anim: "Smutek" });
        await c.say("lisek", "line.a_wiatr_plan");
        await c.ujecie("ogolny");                                            // the pieces land over the wide scene
        await c.say("wiewiorka", "line.a_posklejaj");
        const plan = await c.podarty("plan_windy", { kawalki: 4 });
        c.czastki("liscie", { wiatr: 0.4 });
        await c.say("lisek", "line.a_plan_caly", { anim: "Radosc" });
        const [kolo, kosz] = plan.cele.slice().sort((a, b) => plan.meta.cele[a.nr].y - plan.meta.cele[b.nr].y);   // the top spot first
        const naPlanie = [...plan.cele, plan.tlo];
        await c.say("lisek", "line.a_plan_gora");
        dobre(kolo); await c.task({ targets: naPlanie, correct: kolo, wrong: "line.a_plan_gora_nie" }); dobre(kolo, false);
        await c.focus([kolo]);                                               // the wheel, talked about
        await c.say("lisek", "line.a_plan_kolo");
        await c.unfocus();
        await c.say("lisek", "line.a_plan_dol");
        dobre(kosz); await c.task({ targets: naPlanie, correct: kosz, wrong: "line.a_plan_dol_nie" }); dobre(kosz, false);
        await plan.zaznacz();
        await c.wait(0.6);
        await plan.remove();
        await c.ujecie("zblizenie", { na: "zajac" });                        // the basket is his part: joy
        await c.say("zajac", "line.a_plan_koszyk", { anim: "Radosc" });
        // the breather: who sends the basket up? rock, paper, scissors with Bunny
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "zajac"] });
        await c.say("zajac", "line.a_ja_wysle", { anim: "Podskok" });
        await c.say("wiewiorka", "line.a_kpn", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the hands fly across the screen
        const wygral = await c.kpn({ kto: "zajac" });
        // the lift, built as the plan says
        const w = await c.winda({ x: -2.3, pietra: [-2.1, 1.6], wrong: "line.a_winda_nie" });
        await c.say("lisek", "line.a_zbudowana", { anim: "Zgloszenie" });
        if (wygral === "dziecko") {
          await c.say("lisek", "line.a_do_gory");
          await w.doPoziomu(1);
        } else {
          c.play("zajac", "Radosc");
          await c.say("zajac", "line.a_ciagne");
          await w.jedz(1, 1.2);
        }
        await c.ujecie("sredni", { na: ["wiewiorka", ...jablka] });          // the basket up by the apples
        await c.say("wiewiorka", "line.a_wkladam");
        for (const [i, j] of jablka.entries()) await w.wloz(j, -0.3 + i * 0.3);
        await c.ujecie("ogolny");
        await c.say("lisek", "line.a_na_dol");
        await w.doPoziomu(0);
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_mam", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // all three, off for home
        await c.say("wiewiorka", "line.a_do_domu", { anim: "Machanie" });
        c.clear();
      },
      // B. the autumn orchard, the wind: what flies up, what falls down; the walk on (a pan); Squirrel's map - the path
      // up the hill to her cottage, not down to the pond
      async (c) => {
        const WSZYSCY = ["wiewiorka", "lisek", "zajac"];
        await c.go("jesienny_sad", { enter: true });
        await Promise.all(WSZYSCY.map((n) => c.enter(n, n === "wiewiorka" ? "left" : "right")));
        c.czastki("liscie", { wiatr: 1.6 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // the gust surprises her
        await c.emocja("wiewiorka", "wykrzyknik");
        await c.say("wiewiorka", "line.b_wiatr");
        await c.ujecie("ogolny");
        await c.say("lisek", "line.b_sortuj");
        await goraDol(c, ["balonik", "ptak", "motyl", "jablko", "kamyk", "szyszka"], { balonik: "gora", ptak: "gora", motyl: "gora", jablko: "dol", kamyk: "dol", szyszka: "dol" }, { x: -0.8, w: 4.8 });
        await c.say("zajac", "line.b_dobrze", { anim: "Radosc" });          // the sorted things still in the shot
        c.clear(); c.czastki("liscie", { wiatr: 0.3 });
        await c.say("lisek", "line.b_dalej", { anim: "Machanie" });
        await c.pan(1, { idz: WSZYSCY, d: 3 });
        await c.ujecie("dwuujecie", { na: ["zajac", "wiewiorka"] });
        await c.play("zajac", "Rozgladanie");
        await c.say("zajac", "line.b_rozstaje");
        await c.ujecie("ogolny");                                            // the map lies over the wide scene
        await c.say("wiewiorka", "line.b_mapa", { anim: "Zgloszenie" });
        const m = await c.wedrowka("mapa_wzgorza", { pionek: "koszyk", dobra: 0, skad: "wiewiorka", wrong: "line.b_mapa_nie" });
        await c.say("zajac", "line.b_mapa_ok", { anim: "Podskok" });         // the way still drawn on the map
        await m.remove();
        await c.say("wiewiorka", "line.b_do_domu", { anim: "Machanie" });
        await Promise.all(WSZYSCY.map((n) => c.walkTo(n, 8)));
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("lisek"); c.show("zajac");
        S.puppets.lisek.korzen.position.x = -5.2; S.puppets.zajac.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                  // show() pops the puppet in
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.p_start", { anim: "Radosc" });
        // 1. the jar on the top shelf, the shoe on the bottom one
        {
          await c.ujecie("ogolny");                                          // the shelves come in
          await c.object("polka", { x: 0, y: 1.35, size: 3.2 }); await c.object("polka", { x: 0, y: -1.85, size: 3.2 });
          const sloik = await c.object("sloik", { x: -3.0, y: -0.2, size: 1.2 }), but = await c.object("but", { x: 3.0, y: -0.2, size: 1.2 });
          await c.say("zajac", "line.p_polki");
          const t = await c.slots({ items: [sloik, but], slots: [{ x: 0, y: 1.75, w: 2.6, h: 1.3, accept: (h) => h === sloik }, { x: 0, y: -1.45, w: 2.6, h: 1.3, accept: (h) => h === but }], wrong: "line.p_polki_nie" });
          await t.done();
          await c.ujecie("sredni", { na: ["lisek", sloik, but] });           // the jar up, the shoe down, named
          await c.say("lisek", "line.p_polki_ok", { anim: "Brawo" }); gw.dodaj(); c.clear();
        }
        // 2. the lift: to the very top, then to the very bottom
        {
          await c.ujecie("ogolny");
          const w = await c.winda({ x: -0.4, pietra: [-2.1, -0.2, 1.6], wrong: "line.p_winda_nie" });
          const mis = await c.object("misiu", { x: 2.4, y: -2.0, size: 0.9 });
          await w.wloz(mis);
          await c.say("zajac", "line.p_winda_gora"); await w.doPoziomu(2);
          await c.say("zajac", "line.p_winda_dol"); await w.doPoziomu(0);
          await c.ujecie("sredni", { na: ["lisek", mis] });
          await c.say("lisek", "line.p_winda_ok", { anim: "Brawo" }); gw.dodaj(); c.clear();
        }
        // 3. which bird is higher?
        {
          await c.ujecie("ogolny");
          const [a, b] = tasuj([[-1.6, 2.4], [1.8, -0.6]]), wyzej = a[1] > b[1] ? a : b;
          const pa = await c.object("ptak", { x: a[0], y: a[1], size: 1.3 }), pb = await c.object("ptak", { x: b[0], y: b[1], size: 1.3 });
          const ok = wyzej === a ? pa : pb;
          await c.say("lisek", "line.p_wyzej");
          dobre(ok); await c.task({ targets: [pa, pb], correct: ok, wrong: "line.p_wyzej_nie" });
          await c.say("zajac", "line.p_wyzej_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();   // both birds still in the wide shot
        }
        // 4. a tower: what is at the very top, what at the very bottom?
        {
          const dol = await c.object("pudelko", { x: 0, y: -2.05, size: 1.7 }), sr = await c.object("klocek", { x: 0, y: -0.85, size: 1.15 }), gora = await c.object("misiu", { x: 0, y: 0.45, size: 1.4 });
          const cele = [dol, sr, gora];
          await c.ujecie("sredni", { na: ["zajac", ...cele] });              // the tower, before it is asked about
          await c.say("zajac", "line.p_wieza_gora");
          dobre(gora); await c.task({ targets: cele, correct: gora, wrong: "line.p_wieza_gora_nie" }); dobre(gora, false);
          await c.say("zajac", "line.p_wieza_gora_ok", { anim: "Radosc" });
          await c.say("zajac", "line.p_wieza_dol");
          dobre(dol); await c.task({ targets: cele, correct: dol, wrong: "line.p_wieza_dol_nie" }); dobre(dol, false);
          await c.ujecie("sredni", { na: ["lisek", ...cele] });
          await c.say("lisek", "line.p_wieza_ok", { anim: "Brawo" }); gw.dodaj(); c.clear();
        }
        // 5. sky or ground?
        {
          await c.ujecie("ogolny");
          await c.say("lisek", "line.p_niebo_ziemia");
          await goraDol(c, ["znak_slonce", "gwiazdka", "ptak", "but", "grzyb", "kamyk"], { znak_slonce: "gora", gwiazdka: "gora", ptak: "gora", but: "dol", grzyb: "dol", kamyk: "dol" }, { x: 0, w: 5.6, dol: ["ziemia", -2.5, 1.1] });
          await c.say("zajac", "line.p_niebo_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.praise("lisek");
      },
    ],
    apply: [
      // home - the third act in Squirrel's hallway: the pie. The wind's mess; Bunny on his head again ("the hooks are
      // down"); hooks up, doormat down; the apples on the top shelf; the balloon fetched from under the ceiling with the
      // lift; the pie, seen; "jump up!" played for the parents
      async (c) => {
        const S = c.stage;
        const POZ = { wiewiorka: -1.4, zajac: 0.4, lisek: 2.2 };
        for (const n of Object.keys(POZ)) c.show(n);
        for (const [n, x] of Object.entries(POZ)) S.puppets[n].korzen.position.x = x;
        await c.wait(0.4);                                                  // show() pops the puppet in
        const m = await c.miejsca();
        await c.ujecie("ogolny");
        // the door bangs open: the things fly about and land scattered on the floor
        c.sfx("whoosh");
        const rzeczy = [];
        for (const [n, x, y, r, tag] of [["czapka", -5.1, -2.7, 0.5, "gora"], ["szalik_dlugi", -3.7, -2.85, -0.3, "gora"], ["plecak", -4.5, -1.55, 0.25, "gora"], ["but", -2.7, -1.75, -0.6, "dol"], ["pilka", -2.6, -2.9, 0, "dol"]]) {
          const h = await c.object(n, { x, y, size: 0.95 }); h.mesh.rotation.z = r; h.tag = tag; rzeczy.push(h);
        }
        const koszyk = await c.object("koszyk", { x: 1.6, y: 1.5, size: 1.1 });
        await c.emocja("wiewiorka", "pot", { anim: "Smutek" });
        await c.say("wiewiorka", "line.d_w_domu");
        // the misconception again: Bunny on his head - "the hooks are down now"
        await naGlowie(c, true);
        await c.say("zajac", "line.d_na_glowie", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["lisek", "zajac"] });
        await c.say("lisek", "line.d_zawsze", { anim: "Kiwanie" });
        await naGlowie(c, false);
        await c.say("zajac", "line.d_aha", { anim: "Kiwanie" });
        // hooks up, doormat down
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.h_przedpokoj", { anim: "Zgloszenie" });
        const zG = await m.wieszak.strefa(), wy = m.wycieraczka, zD = await c.zone({ x: wy.x - 0.4, y: wy.y, w: 2.6, h: 1.0, niewidoczna: true, rodzaj: "lezy" });   // the doormat's near part: on a 4:3 screen its far end is cut
        zG.want = "gora"; zD.want = "dol";
        await c.sort({ items: rzeczy, zones: [zG, zD], wrong: "line.h_nie_tu" });
        await c.say("zajac", "line.h_porzadek", { anim: "Radosc" });         // everything on its place, in the shot
        // the apples on the very top shelf, where the ball cannot knock them off
        await c.say("wiewiorka", "line.d_jablka");
        const polki = [await m.szafka_gora.strefa(), await m.szafka_srodek.strefa(), await m.szafka_dol.strefa()];
        polki.forEach((z, i) => { z.want = i === 0 ? "gora" : "nizej"; }); koszyk.tag = "gora";
        await c.sort({ items: [koszyk], zones: polki, wrong: "line.d_jablka_nie" });
        await c.ujecie("sredni", { na: ["lisek", koszyk] });
        await c.say("lisek", "line.d_jablka_ok", { anim: "Radosc" });
        // the balloon flies up under the ceiling; the lift brings it down
        await c.ujecie("ogolny");
        const bal = await c.object("balonik", { x: 1.3, y: 0.9, size: 1.2 });
        await c.say("zajac", "line.d_balonik", { anim: "Podskok" });
        c.sfx("whoosh"); await bal.moveTo(-2.75, 1.95, c.fast ? 0.2 : 1.6);   // high, beside the lift's beam and under the hooks
        await c.ujecie("zblizenie", { na: "zajac" });                        // he cannot reach it
        await c.emocja("zajac", "smutek", { anim: "Smutek" });
        await c.say("zajac", "line.d_balonik_wysoko");
        await c.ujecie("ogolny");
        const w = await c.winda({ x: -4.3, pietra: [-2.2, 1.2], kosz: "wiaderko", wrong: "line.a_winda_nie" });
        await c.say("lisek", "line.d_winda", { anim: "Zgloszenie" });
        await w.doPoziomu(1);
        await w.wloz(bal);
        await c.say("lisek", "line.d_winda_dol");
        await w.doPoziomu(0);
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.d_balonik_ok", { anim: "Radosc" });
        // higher now: the basket on the top shelf, the balloon down in the bucket
        await c.ujecie("ogolny");
        await c.say("lisek", "line.d_wyzej");
        dobre(koszyk); await c.task({ targets: [bal, koszyk], correct: koszyk, wrong: "line.d_wyzej_nie" }); dobre(koszyk, false);
        await c.say("wiewiorka", "line.d_wyzej_ok", { anim: "Radosc" });   // both still in the wide shot
        const zostaja = [...rzeczy, koszyk];                                  // the tidied things stay on their places, the lift goes
        for (const o of S.objects.slice()) if (!zostaja.includes(o)) o.remove();
        // the payoff, seen: the apple pie
        const il = await c.ilustracja("szarlotka_wiewiorki", { ruch: "najazd" });
        await c.say("wiewiorka", "line.d_szarlotka");
        await c.say("zajac", "line.d_pyszna");
        await il.zsun();
        // the home game, played: "jump up!" - one of them claps instead
        await c.ujecie("ogolny");
        await c.say("lisek", "line.b_skok", { anim: "Podskok" });
        const kto = tasuj(["wiewiorka", "zajac"])[0], inni = ["wiewiorka", "zajac"].filter((n) => n !== kto);
        await Promise.all([...inni.map((n) => c.ruch(n, "skok")), c.ruch(kto, "klask")]);
        await c.wait(0.4);
        const cele = ["wiewiorka", "zajac"].map((n) => S.puppets[n]);
        await c.say("lisek", "line.b_kto");
        dobre(cele, false); dobre(S.puppets[kto]); await c.task({ targets: cele, correct: S.puppets[kto], wrong: "line.b_kto" }); dobre(cele, false);
        await c.ujecie("zblizenie", { na: kto });                            // caught: a laugh
        await c.say(kto, `line.b_pomylka_${kto}`, { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["wiewiorka"] });                     // the home task, said to the parents
        await c.say("wiewiorka", "line.h_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
