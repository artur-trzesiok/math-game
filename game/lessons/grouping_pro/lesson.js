// Lesson: grouping, the "pro" build (guidelines.md, "Atmosphere and editing"): a detective story on the autumn
// panorama - someone leaves red gifts; grouping by one rule and then another shows what they have in common, a
// trail of red leaves leads to a shy Fox, who is helped to find his red hat and invited home for the promised apple
// pie. Script in scenario.md.

const PANO = "jesienny_sad";
const ROW_Y = 1.45;                              // loose things: above the characters' heads
const ZL = -1.75, ZR = 1.75, ZY = -2.0, ZW = 3.3, ZH = 2.6;          // two containers on the ground between them
const DRZWI = { x: 3.05, y: 0.15 };             // Fox's red door in area 2 (where he comes out, small: far away)
const GLEBIA = 0.2;                              // how fast he grows as he walks to the front (door-sized at the door)
const TRZY = { x: 2.2, w: 2.5, h: 2.3 };          // containers when Fox stands between the two others (at 0)
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);

// things in a row up in the air, shuffled; each keeps its tag (what group it belongs to) and `prezent`
async function wRzedzie(c, rzeczy, { y = ROW_Y, size = 0.85 } = {}) {
  const hs = [];
  for (const r of tasuj(rzeczy)) {
    const h = r.ubranie ? await c.ubranie(r.name, { y, size: r.size || size }) : await c.object(r.name, { y, size: r.size || size });
    Object.assign(h, { tag: r.tag, prezent: !!r.prezent, kolor: r.kolor }); hs.push(h);
  }
  c.arrange([hs], { y, gap: 0.14 });
  return hs;
}
// two containers; `lewy` / `prawy` = the tag each takes (the line names them, so the check keeps to them)
async function pojemniki(c, [obrazL, lewy], [obrazP, prawy], { x = ZR, w = ZW, h = ZH } = {}) {
  const z = [await c.zone({ x: -x, y: ZY, w, h, image: obrazL, name: obrazL }),
             await c.zone({ x, y: ZY, w, h, image: obrazP, name: obrazP })];
  z[0].want = lewy; z[1].want = prawy;
  return z;
}
// the gifts light up one after another wherever they lie now
async function pokazPrezenty(c, rzeczy) {
  for (const h of rzeczy.filter((h) => h.prezent)) { c.stage.bump(h, 0.3); c.sfx("tap"); await c.wait(0.35); }
}
// things pop up anywhere for a moment: catch the one that belongs (a quick game, not the maths the lesson counts)
async function zlap(c, { dobre, zle, linia, wrong, ile = 3, size = 1.1 }) {
  const miejsca = tasuj([[-3.4, 1.6], [-0.6, 0.9], [2.2, 1.7], [-2.0, -0.2], [0.9, 2.2], [3.6, 0.4]]).slice(0, ile);
  const dobry = await c.object(dobre, { x: miejsca[0][0], y: miejsca[0][1], size });
  const inne = [];
  for (let i = 1; i < ile; i++) inne.push(await c.object(zle[(i - 1) % zle.length], { x: miejsca[i][0], y: miejsca[i][1], size }));
  if (linia) await c.say(...linia);
  await c.task({ targets: tasuj([dobry, ...inne]), correct: dobry, wrong });
  c.clear();
}

export default {
  id: "grouping_pro",
  przejscia: true,
  nagrody: true,
  characters: { wiewiorka: { side: "left" }, sarenka: { side: "right" }, lisek: { side: "left", x: 0 } },
  backgrounds: { story: PANO, practice: { kolor: "#f6e1b8", motyw: "liscie" }, apply: "dom" },
  stages: {
    story: [
      // A. the orchard: gifts again under the apple tree; the wind mixes them up; be detectives - which rule shows
      // what the gifts have in common? Food / the rest: they land in both groups. Red / the rest: all in one!
      async (c) => {
        c.czastki("liscie", { wiatr: 0.5 });
        await Promise.all([c.enter("wiewiorka"), c.enter("sarenka")]);
        // the gifts, lying together under the tree
        const prezenty = [];
        for (const [i, n] of ["jablko", "lisc_czerwony", "klocek", "pilka"].entries()) {
          const h = await c.object(n, { x: -1.6 + i * 1.05, y: -1.9, size: 0.85 }); h.prezent = true; prezenty.push(h);
        }
        await c.say("sarenka", "line.a_rano", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "wykrzyknik", { anim: "Podskok" });
        await c.say("wiewiorka", "line.a_kto");
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("sarenka", "line.a_obietnica");
        await c.emocja("wiewiorka", "zarowka", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.a_detektywi");
        // a gust: other things blow in and everything goes up in a whirl
        await c.ujecie("ogolny");
        c.czastki("liscie", { wiatr: 2.2, gestosc: 1.6 }); c.sfx("whoosh");
        for (const h of prezenty) h.moveTo(h.mesh.position.x + (Math.random() - 0.5) * 3, 1.2 + Math.random(), 0.6);
        await c.wait(0.7);
        c.clear(); c.czastki("liscie", { wiatr: 0.5 });
        await c.say("sarenka", "line.a_pomieszane", { anim: "Smutek" });
        // the method on a plain colour: things that belong together go together
        await c.go({ kolor: "#f6dcae", motyw: "liscie" }, { ciecie: true });
        await c.ujecie("ogolny");
        const pomysl = await c.idea("sarenka", [["jablko", "jablko", "jablko"], ["szyszka", "szyszka"]]);
        await c.say("sarenka", "line.a_grupuj");
        pomysl.remove();
        await c.go(PANO, { ciecie: true }); c.czastki("liscie", { wiatr: 0.5 });
        const rzeczy = [
          { name: "jablko", prezent: true, tag: "jedzenie", kolor: "czerwone" }, { name: "lisc_czerwony", prezent: true, tag: "inne", kolor: "czerwone" },
          { name: "klocek", prezent: true, tag: "inne", kolor: "czerwone" }, { name: "pilka", prezent: true, tag: "inne", kolor: "czerwone" },
          { name: "gruszka", tag: "jedzenie", kolor: "inne" }, { name: "lisc_zolty", tag: "inne", kolor: "inne" }, { name: "szyszka", tag: "inne", kolor: "inne" }];
        // rule one: food / the rest
        let items = await wRzedzie(c, rzeczy);
        let zones = await pojemniki(c, ["miska", "jedzenie"], ["pudelko", "inne"]);
        await c.say("wiewiorka", "line.a_zasada_jedzenie");
        await c.sort({ items, zones, wrong: "line.a_pomylka" });
        await c.say("sarenka", "line.a_gdzie_prezenty");
        await pokazPrezenty(c, items);
        await c.emocja("wiewiorka", "pot");
        await c.say("wiewiorka", "line.a_nie_ta");
        c.clear();
        // rule two: red / the rest - the same things
        items = await wRzedzie(c, rzeczy.map((r) => ({ ...r, tag: r.kolor })));
        zones = await pojemniki(c, ["koszyk", "czerwone"], ["pudelko", "inne"]);
        await c.say("sarenka", "line.a_zasada_kolor");
        await c.sort({ items, zones, wrong: "line.a_pomylka" });
        await pokazPrezenty(c, items);
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "wykrzyknik", { anim: "Radosc" });
        await c.say("wiewiorka", "line.a_wszystkie_czerwone");
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("sarenka", "line.a_trop", { anim: "Kiwanie" });
        c.clear();
        // a trail of red leaves leads away across the meadow
        const slad = [];
        for (let i = 0; i < 5; i++) slad.push(await c.object("lisc_czerwony", { x: -1.2 + i * 1.05, y: -2.7 + i * 0.38, size: 0.6 - i * 0.07 }));   // away into the picture: higher and smaller
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.a_slady", { anim: "Wskazanie" });
        await c.say("sarenka", "line.a_idziemy");
        c.clear();
        await c.pan(1, { idz: ["wiewiorka", "sarenka"], d: 3 });
      },
      // B. the meadow: a cold wind - what is useful against it (onto Squirrel; Deer has her fur); then the trail as a
      // quick game: catch the red leaf four times, every catch a few steps on
      async (c) => {
        c.czastki("liscie", { wiatr: 1.6, gestosc: 1.3 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "smutek", { anim: "Smutek" });
        await c.say("wiewiorka", "line.b_wieje");
        await c.ujecie("ogolny");
        const miejsca = tasuj([-3.4, -1.15, 1.15, 3.4]);
        const pomoc = [await c.ubranie("czapka_zimowa_3", { x: miejsca[0], y: ROW_Y, size: 1.0 }), await c.ubranie("szalik_3", { x: miejsca[1], y: ROW_Y, size: 1.0 })];
        const nie = [await c.object("pilka", { x: miejsca[2], y: ROW_Y, size: 0.9 }), await c.object("lyzka", { x: miejsca[3], y: ROW_Y, size: 0.9 })];
        await c.say("sarenka", "line.b_co_przyda");
        await c.task({ targets: [...pomoc, ...nie], correct: pomoc, wrong: "line.b_nie_grzeje" });
        for (const h of nie) h.remove();
        await c.say("sarenka", "line.b_ubierz");
        await c.ubieranie({ rzeczy: pomoc, kto: ["wiewiorka"], pasuje: () => true });
        await c.say("wiewiorka", "line.b_cieplo", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.say("sarenka", "line.b_futerko", { anim: "Kiwanie" });
        await c.ujecie("ogolny");
        // along the trail: catch the red leaf; every catch, a few steps
        await c.say("wiewiorka", "line.b_lapiemy", { anim: "Podskok" });
        await c.odliczanie({ styl: "kropki" });
        for (let i = 0; i < 4; i++) {
          await zlap(c, { dobre: "lisc_czerwony", zle: ["lisc_zolty"], linia: i === 0 ? ["wiewiorka", "line.b_lap"] : null, wrong: "line.b_nie_ten", ile: 3 });
          await c.pan(1 + (i + 1) * 0.25, { idz: ["wiewiorka", "sarenka"], d: 1.1 });
        }
        await c.say("sarenka", "line.b_las", { anim: "Wskazanie" });
      },
      // C. the forest edge: the red door; Fox comes out (far away, small) and walks up to them - it was him; he is
      // invited for the pie, but cannot find his red hat in the mess: sort hats and scarves, point to the red hat
      async (c) => {
        c.czastki("liscie", { wiatr: 0.4 });
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("wiewiorka", "line.c_drzwi", { anim: "Wskazanie" });
        await c.say("sarenka", "line.c_puk");
        c.sfx("tap"); await c.wait(0.25); c.sfx("tap"); await c.wait(0.25); c.sfx("tap");
        // Fox steps out of his door and walks to the front
        await c.ujecie("ogolny");
        const L = c.stage.puppets.lisek, G0 = c.stage.puppets.wiewiorka.korzen.position.y;
        L.korzen.position.set(DRZWI.x, DRZWI.y, 0); L.podloga = DRZWI.y; L.korzen.scale.setScalar(1 - GLEBIA * (DRZWI.y - G0));
        L.korzen.visible = true; c.stage.appear(L);
        await c.przejdz("lisek", [[DRZWI.x - 0.2, DRZWI.y - 0.35], [0, G0]], { glebia: GLEBIA });
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.emocja("lisek", "serce", { anim: "Kiwanie" });
        await c.say("lisek", "line.c_to_ja");
        await c.say("wiewiorka", "line.c_czemu");
        await c.say("lisek", "line.c_wstyd", { anim: "Smutek" });
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.c_zapraszamy", { anim: "Radosc" });
        await c.say("lisek", "line.c_balagan", { anim: "Rozgladanie" });
        // his things: hats into the basket, scarves into the box
        const rzeczy = [
          { name: "czapka_zimowa", ubranie: true, tag: "czapki", kolor: "czerwona" }, { name: "czapka_zimowa_2", ubranie: true, tag: "czapki" }, { name: "czapka_zimowa_3", ubranie: true, tag: "czapki" },
          { name: "szalik", ubranie: true, tag: "szaliki" }, { name: "szalik_2", ubranie: true, tag: "szaliki" }, { name: "szalik", ubranie: true, tag: "szaliki" }];
        const items = await wRzedzie(c, rzeczy, { size: 0.9 });
        const zones = await pojemniki(c, ["koszyk", "czapki"], ["pudelko", "szaliki"], TRZY);
        await c.say("wiewiorka", "line.c_pogrupujmy");
        await c.sort({ items, zones, wrong: "line.c_pomylka" });
        // the red one among the hats
        const czapki = zones[0].items.slice();
        await c.say("sarenka", "line.c_ktora");
        const czerwona = czapki.find((h) => h.kolor === "czerwona");
        await c.task({ targets: czapki, correct: czerwona, wrong: "line.c_nie_ta" });
        c.clear();
        await c.ubierz("lisek", "czapka_zimowa");
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.emocja("lisek", "radosc", { anim: "Radosc" });
        await c.say("lisek", "line.c_gotowy");
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      // a detective's training: five different mini-games, a star each
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka");
        c.gwiazdki(5);
        await c.say("wiewiorka", "line.p_start", { anim: "Podskok" });
        // 1. what fits this group? three red things in Deer's bubble, which of two joins them
        const grupa = await c.idea("sarenka", [["jablko", "klocek", "lisc_czerwony"]]);
        const czerwony = Math.random() < 0.5;
        const a = await c.object("pilka", { x: czerwony ? -1.6 : 1.6, y: -0.2, size: 1.2 }), b = await c.object("lisc_zolty", { x: czerwony ? 1.6 : -1.6, y: -0.2, size: 1.2 });
        await c.say("sarenka", "line.p_wspolne");
        await c.task({ targets: [a, b], correct: a, wrong: "line.p_nie_pasuje" });
        grupa.remove(); c.clear();
        // 2. red leaves and yellow leaves into two containers
        let items = await wRzedzie(c, [0, 1, 2].flatMap(() => [{ name: "lisc_czerwony", tag: "czerwone" }, { name: "lisc_zolty", tag: "zolte" }]));
        let zones = await pojemniki(c, ["koszyk", "czerwone"], ["pudelko", "zolte"]);
        await c.say("sarenka", "line.p_liscie");
        await c.sort({ items, zones, wrong: "line.p_pomylka" });
        c.clear();
        // 3. catch the mushrooms popping up, twice
        await c.say("wiewiorka", "line.p_grzyby", { anim: "Podskok" });
        for (let i = 0; i < 2; i++) await zlap(c, { dobre: "grzyb", zle: ["orzech", "kasztan", "zoledz"], wrong: "line.p_nie_grzyb", ile: 4 });
        // 4. the odd one out: three acorns and a chestnut
        const wiersz = await wRzedzie(c, [{ name: "zoledz", tag: "z" }, { name: "zoledz", tag: "z" }, { name: "zoledz", tag: "z" }, { name: "kasztan", tag: "k" }], { y: 0.6, size: 1.1 });
        await c.say("sarenka", "line.p_inny");
        await c.task({ targets: wiersz, correct: wiersz.find((h) => h.tag === "k"), wrong: "line.p_pasuje" });
        c.clear();
        // 5. acorns and chestnuts into two containers
        items = await wRzedzie(c, [0, 1, 2].flatMap(() => [{ name: "zoledz", tag: "zoledzie" }, { name: "kasztan", tag: "kasztany" }]));
        zones = await pojemniki(c, ["koszyk", "zoledzie"], ["pudelko", "kasztany"]);
        await c.say("sarenka", "line.p_zoledzie");
        await c.sort({ items, zones, wrong: "line.p_pomylka" });
        await c.praise("wiewiorka");
      },
    ],
    apply: [
      // home, with Fox: the promised pie - first only the apples for it, then cups on the shelf and plates into the
      // box, and the pie is there
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka"); c.show("lisek");
        await c.ubierz("lisek", "czapka_zimowa");
        await c.say("lisek", "line.d_witaj", { anim: "Rozgladanie" });
        const owoce = await wRzedzie(c, [{ name: "jablko", tag: "j" }, { name: "jablko", tag: "j", size: 1.05 }, { name: "jablko", tag: "j", size: 0.7 }, { name: "gruszka", tag: "x" }, { name: "marchewka", tag: "x" }, { name: "grzyb", tag: "x" }]);
        await c.say("sarenka", "line.d_najpierw");
        await c.task({ targets: owoce, correct: owoce.filter((h) => h.tag === "j"), wrong: "line.d_nie_jablko" });
        c.clear();
        const items = await wRzedzie(c, [{ name: "kubek", tag: "kubki" }, { name: "kubek", tag: "kubki" }, { name: "talerz", tag: "talerze" }, { name: "talerz", tag: "talerze" }]);
        const zones = await pojemniki(c, ["polka", "kubki"], ["pudelko", "talerze"], TRZY);
        await c.say("wiewiorka", "line.d_naczynia");
        await c.sort({ items, zones, wrong: "line.d_pomylka" });
        c.clear();
        // the pie
        const ciasto = await c.object("szarlotka", { x: 2.3, y: -0.35, size: 1.7 });    // on the table, beside Fox
        c.sfx("idea"); c.konfetti(ciasto, { ile: 90 });
        await c.say("sarenka", "line.d_szarlotka", { anim: "Radosc" });
        await c.emocja("lisek", "serce", { anim: "Radosc" });
        await c.say("lisek", "line.d_pycha");
        await c.say("wiewiorka", "line.d_rodzice");
        await c.say("sarenka", "line.d_pa");
        await Promise.all([c.play("wiewiorka", "Machanie"), c.play("sarenka", "Machanie"), c.play("lisek", "Machanie")]);
      },
    ],
  },
};
