// Lesson: up and down - up is towards the sky, down towards the ground, whichever way you stand; at the top, at the
// bottom, higher. Squirrel's apple day: Bunny stands on his head and says the apples are down; the child works Fox's
// lift (up to the apples, down to Bunny); the wind - what flies up, what falls down; "jump up!". At home: hats up on
// the hooks, shoes down on the floor. Script in scenario.md.

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

export default {
  id: "up_down",
  przejscia: true,
  nagrody: true,
  characters: { wiewiorka: { side: "left", x: -4.8 }, lisek: { side: "right", x: 2.8 }, zajac: { side: "right", x: 4.6 } },
  backgrounds: { story: "sad", practice: { kolor: "#e8f1fb", motyw: "chmurki" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the orchard: the apples are up in the tree; Bunny on his head says they are down; up = sky
      async (c) => {
        const S = c.stage;
        c.show("wiewiorka");
        await Promise.all([c.enter("lisek", "right"), c.enter("zajac", "right")]);
        const jablka = [];
        for (const [x, y] of [[-4.7, 2.6], [-3.6, 2.1], [-5.2, 1.6]]) jablka.push(await c.object("jablko", { x, y, size: 0.9 }));
        await c.ujecie("sredni", { na: ["wiewiorka", ...jablka] });   // the apples up in the tree
        await c.say("wiewiorka", "line.a_jablka", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_inaczej", { anim: "Podskok" });
        await c.ujecie("ogolny");
        // Bunny stands on his head
        const L = S.puppets.zajac, H = 3.1, y0 = L.korzen.position.y; L.bezCienia = true;
        await S.tween(0.5, (s) => { L.korzen.rotation.z = Math.PI * s; L.korzen.position.y = y0 + H * s; });
        await c.ujecie("sredni", { na: ["zajac"] });
        await c.say("zajac", "line.a_na_dole");
        await c.ujecie("ogolny");
        await c.play("wiewiorka", "Radosc"); await c.play("lisek", "Radosc");
        await c.ujecie("sredni", { na: ["lisek", "zajac"] });
        await c.say("lisek", "line.a_niebo", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await S.tween(0.5, (s) => { L.korzen.rotation.z = Math.PI * (1 - s); L.korzen.position.y = y0 + H * (1 - s); });
        L.bezCienia = false;
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_rozumiem");
        await c.ujecie("ogolny");
        // how to get the apples down? Fox's plan of the lift: the child marks what goes at the top and what at the bottom
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "pot");
        await c.say("wiewiorka", "line.a_jak_zdjac");
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.a_plan", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const plan = await c.znalezisko("plan_windy", { skad: "lisek" });
        const [kolo, kosz] = plan.cele.slice().sort((a, b) => plan.meta.cele[a.nr].y - plan.meta.cele[b.nr].y);   // the top spot first
        const naPlanie = [...plan.cele, plan.tlo];
        await c.say("lisek", "line.a_plan_gora");
        dobre(kolo); await c.task({ targets: naPlanie, correct: kolo, wrong: "line.a_plan_gora_nie" }); dobre(kolo, false);
        await c.say("lisek", "line.a_plan_kolo");
        await c.say("lisek", "line.a_plan_dol");
        dobre(kosz); await c.task({ targets: naPlanie, correct: kosz, wrong: "line.a_plan_dol_nie" }); dobre(kosz, false);
        await plan.zaznacz();
        await c.wait(0.6);
        await plan.remove();
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_plan_koszyk", { anim: "Radosc" });
        // the lift, built as the plan says: the basket up to the apples, down to Bunny
        await c.ujecie("ogolny");
        const w = await c.winda({ x: -2.3, pietra: [-2.1, 1.6], wrong: "line.a_winda_nie" });
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.a_zbudowana", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.say("lisek", "line.a_do_gory");
        await w.doPoziomu(1);
        await c.say("wiewiorka", "line.a_wkladam");
        for (const [i, j] of jablka.entries()) await w.wloz(j, -0.3 + i * 0.3);
        await c.say("lisek", "line.a_na_dol");
        await w.doPoziomu(0);
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_mam", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
      },
      // B. the autumn orchard, the wind: what flies up, what falls down; "jump up!"
      async (c) => {
        const S = c.stage;
        await c.go("jesienny_sad", { enter: true });
        await Promise.all(["wiewiorka", "lisek", "zajac"].map((n) => c.enter(n, n === "wiewiorka" ? "left" : "right")));
        c.czastki("liscie", { wiatr: 1.6 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_wiatr");
        await c.ujecie("ogolny");
        await c.say("lisek", "line.b_sortuj");
        await goraDol(c, ["balonik", "ptak", "motyl", "jablko", "kamyk", "szyszka"], { balonik: "gora", ptak: "gora", motyl: "gora", jablko: "dol", kamyk: "dol", szyszka: "dol" }, { x: -0.8, w: 4.8 });
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.b_dobrze");
        await c.ujecie("ogolny");
        c.clear(); c.czastki("liscie", { wiatr: 0.3 });
        // the breather: "jump up!" - one of them claps instead
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.b_skok", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const kto = tasuj(["wiewiorka", "zajac"])[0], inni = ["wiewiorka", "zajac"].filter((n) => n !== kto);
        await Promise.all([...inni.map((n) => c.ruch(n, "skok")), c.ruch(kto, "klask")]);
        await c.wait(0.4);
        const cele = ["wiewiorka", "zajac"].map((n) => S.puppets[n]);
        await c.say("lisek", "line.b_kto");
        dobre(cele, false); dobre(S.puppets[kto]); await c.task({ targets: cele, correct: S.puppets[kto], wrong: "line.b_kto" }); dobre(cele, false);
        await c.ujecie("zblizenie", { na: kto });
        await c.say(kto, `line.b_pomylka_${kto}`, { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.b_do_domu");
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("lisek"); c.show("zajac");
        S.puppets.lisek.korzen.position.x = -5.2; S.puppets.zajac.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("lisek", "line.p_start", { anim: "Radosc" });
        // 1. the jar on the top shelf, the shoe on the bottom one
        {
          await c.object("polka", { x: 0, y: 1.35, size: 3.2 }); await c.object("polka", { x: 0, y: -1.85, size: 3.2 });
          const sloik = await c.object("sloik", { x: -3.0, y: -0.2, size: 1.2 }), but = await c.object("but", { x: 3.0, y: -0.2, size: 1.2 });
          await c.say("zajac", "line.p_polki");
          const t = await c.slots({ items: [sloik, but], slots: [{ x: 0, y: 1.75, w: 2.6, h: 1.3, accept: (h) => h === sloik }, { x: 0, y: -1.45, w: 2.6, h: 1.3, accept: (h) => h === but }], wrong: "line.p_polki_nie" });
          await t.done();
          await c.ujecie("zblizenie", { na: "lisek" });
          await c.say("lisek", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 2. the lift: to the very top, then to the very bottom
        {
          const w = await c.winda({ x: -0.4, pietra: [-2.1, -0.2, 1.6], wrong: "line.p_winda_nie" });
          await w.wloz(await c.object("misiu", { x: 2.4, y: -2.0, size: 0.9 }));
          await c.say("zajac", "line.p_winda_gora"); await w.doPoziomu(2);
          await c.say("zajac", "line.p_winda_dol"); await w.doPoziomu(0);
          await c.ujecie("zblizenie", { na: "lisek" });
          await c.say("lisek", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 3. which bird is higher?
        {
          const [a, b] = tasuj([[-1.6, 2.4], [1.8, -0.6]]), wyzej = a[1] > b[1] ? a : b;
          const pa = await c.object("ptak", { x: a[0], y: a[1], size: 1.3 }), pb = await c.object("ptak", { x: b[0], y: b[1], size: 1.3 });
          const ok = wyzej === a ? pa : pb;
          await c.say("lisek", "line.p_wyzej");
          dobre(ok); await c.task({ targets: [pa, pb], correct: ok, wrong: "line.p_wyzej_nie" });
          await c.ujecie("zblizenie", { na: "zajac" });
          await c.say("zajac", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 4. a tower: what is at the very top, what at the very bottom?
        {
          const dol = await c.object("pudelko", { x: 0, y: -2.05, size: 1.7 }), sr = await c.object("klocek", { x: 0, y: -0.85, size: 1.15 }), gora = await c.object("misiu", { x: 0, y: 0.45, size: 1.4 });
          const cele = [dol, sr, gora];
          await c.ujecie("sredni", { na: cele });                // the tower, before it is asked about
          await c.say("zajac", "line.p_wieza_gora");
          await c.ujecie("ogolny");
          dobre(gora); await c.task({ targets: cele, correct: gora, wrong: "line.p_wieza_gora_nie" }); dobre(gora, false);
          await c.say("zajac", "line.p_wieza_dol");
          dobre(dol); await c.task({ targets: cele, correct: dol, wrong: "line.p_wieza_dol_nie" }); dobre(dol, false);
          await c.ujecie("zblizenie", { na: "lisek" });
          await c.say("lisek", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 5. sky or ground?
        {
          await c.say("lisek", "line.p_niebo_ziemia");
          await goraDol(c, ["znak_slonce", "gwiazdka", "ptak", "but", "grzyb", "kamyk"], { znak_slonce: "gora", gwiazdka: "gora", ptak: "gora", but: "dol", grzyb: "dol", kamyk: "dol" }, { x: 0, w: 5.6, dol: ["ziemia", -2.5, 1.1] });
          await c.ujecie("zblizenie", { na: "zajac" });
          await c.say("zajac", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      // home, the hallway: hats and scarves up on the hooks, shoes and the ball down on the floor
      async (c) => {
        for (const n of ["wiewiorka", "zajac"]) c.show(n);
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.h_przedpokoj", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await goraDol(c, ["czapka", "szalik_dlugi", "plecak", "but", "pilka"], { czapka: "gora", szalik_dlugi: "gora", plecak: "gora", but: "dol", pilka: "dol" },
          { x: 0.9, w: 4.8, gora: ["wieszak", 2.45, 1.2], dol: ["podloga", -2.55, 1.0], wrong: "line.h_nie_tu" });
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.h_porzadek", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.h_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
