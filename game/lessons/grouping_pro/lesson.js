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
async function pojemniki(c, [obrazL, lewy], [obrazP, prawy], { x = ZR, w = ZW, h = ZH, xs = [-x, x] } = {}) {
  const z = [await c.zone({ x: xs[0], y: ZY, w, h, image: obrazL, name: obrazL }),
             await c.zone({ x: xs[1], y: ZY, w, h, image: obrazP, name: obrazP })];
  z[0].want = lewy; z[1].want = prawy;
  return z;
}
// a gift wears a golden bow (a child of its sticker, so it goes wherever the gift goes - into a container too)
async function kokarda(c, h) {
  const k = await c.object("kokarda", { size: 0.45 });
  c.stage.scene.remove(k.mesh); k.mesh.position.set(0.32, 0.36, 0.05); k.mesh.scale.setScalar(0.5); h.mesh.add(k.mesh);   // in the sticker's own units
  return h;
}
// things already on screen up into a row (out of their containers too) - the same things, ready for another rule
async function doRzedu(c, rzeczy, { y = ROW_Y } = {}) {
  for (const h of rzeczy) if (h.zone) h.zone.take(h, false);
  c.arrange([tasuj(rzeczy)], { y, gap: 0.14, animate: true });                 // shuffled: the gifts never stand together
  await c.wait(0.5);
}
// the children's room: the rug between the characters (Fox stands left of it at home)
const DYWAN = { x: 1.0, y: -1.5, w: 4.4, h: 1.1 };
async function naDywanie(c, rzeczy, size = 0.85) {
  const miejsca = [];
  for (let proby = 0; miejsca.length < rzeczy.length && proby < 600; proby++) {
    const x = DYWAN.x + (Math.random() - 0.5) * (DYWAN.w - 0.9), y = DYWAN.y + (Math.random() - 0.5) * (DYWAN.h - 0.4);
    if (miejsca.every(([mx, my]) => Math.hypot(mx - x, (my - y) * 1.4) > 0.95)) miejsca.push([x, y]);
  }
  const out = [];
  for (const [i, r] of tasuj(rzeczy).entries()) {
    const [x, y] = miejsca[i] || [DYWAN.x, DYWAN.y];
    const h = r.ubranie ? await c.ubranie(r.name, { x, y, size: r.size || size }) : await c.object(r.name, { x, y, size: r.size || size });
    Object.assign(h, { tag: r.tag }); h.mesh.rotation.z = (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.8); out.push(h);
  }
  return out;
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
  backgrounds: { story: PANO, practice: { kolor: "#f6e1b8", motyw: "liscie" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the orchard: gifts again under the apple tree; the wind mixes them up; be detectives - which rule shows
      // what the gifts have in common? Food / the rest: they land in both groups. Red / the rest: all in one!
      async (c) => {
        c.czastki("liscie", { wiatr: 0.5 });
        // the gifts already lie under the apple tree, each with a golden bow; Squirrel runs in, sees them and calls Deer
        const prezenty = [];
        for (const [i, n] of ["jablko", "lisc_czerwony", "klocek", "pilka"].entries()) {
          const h = await c.object(n, { x: -1.7 + i * 1.15, y: -1.95, size: 0.95 });
          Object.assign(h, { prezent: true, tag: n === "jablko" ? "jedzenie" : "inne", kolor: "czerwone" }); await kokarda(c, h); prezenty.push(h);
        }
        await c.enter("wiewiorka");
        await c.emocja("wiewiorka", "wykrzyknik", { anim: "Podskok" });
        await c.say("wiewiorka", "line.a_start", { anim: "Machanie" });
        await c.enter("sarenka");
        await c.say("sarenka", "line.a_znowu", { anim: "Radosc" });
        await c.ujecie("sredni", { na: prezenty });
        await c.say("wiewiorka", "line.a_wymien");
        for (const h of prezenty) { c.stage.bump(h, 0.3); await c.wait(0.45); }
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "wykrzyknik", { anim: "Podskok" });
        await c.say("wiewiorka", "line.a_kto");
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("sarenka", "line.a_obietnica");
        await c.emocja("wiewiorka", "zarowka", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.a_detektywi");
        await c.say("sarenka", "line.a_pomoze", { anim: "Kiwanie" });
        // a gust blows other things in from the side: they land among the gifts (the gifts keep their bows)
        await c.ujecie("ogolny");
        c.czastki("liscie", { wiatr: 2.2, gestosc: 1.6 }); c.sfx("whoosh");
        const inne = [];
        for (const [i, [n, tag]] of [["gruszka", "jedzenie"], ["lisc_zolty", "inne"], ["szyszka", "inne"]].entries()) {
          const h = await c.object(n, { x: -7, y: 1.5 + i * 0.4, size: 0.95 }); Object.assign(h, { tag, kolor: "inne" }); inne.push(h);
        }
        // everything lands on its own spot, gifts and the rest shuffled together
        const miejsca = tasuj([-2.9, -1.95, -1.0, -0.05, 0.9, 1.85, 2.8]);
        [...prezenty, ...inne].forEach((h, i) => { h.moveTo(miejsca[i], -1.75 - (i % 3) * 0.28, 0.7); h.mesh.rotation.z = (i % 2 ? 0.3 : -0.25); });
        await c.wait(0.8);
        c.czastki("liscie", { wiatr: 0.5 });
        await c.say("sarenka", "line.a_pomieszane", { anim: "Smutek" });
        // the method in a thought: things that belong together go together
        const pomysl = await c.idea("sarenka", [["jablko", "jablko", "jablko"], ["szyszka", "szyszka"]]);
        await c.say("sarenka", "line.a_grupuj");
        pomysl.remove();
        // rule one: food / the rest - the very things lying there rise into a row
        const items = [...prezenty, ...inne];
        for (const h of items) h.mesh.rotation.z = 0;
        await doRzedu(c, items);
        let zones = await pojemniki(c, ["miska", "jedzenie"], ["pudelko", "inne"]);
        await c.say("wiewiorka", "line.a_zasada_jedzenie");
        await c.sort({ items, zones, wrong: "line.a_pomylka" });
        await c.say("sarenka", "line.a_gdzie_prezenty");
        await pokazPrezenty(c, items);
        c.play("wiewiorka", "Rozgladanie"); await c.wonder("wiewiorka");                // puzzled: in both groups?
        await c.say("wiewiorka", "line.a_nie_ta");
        // rule two: red / the rest - the same things come back out of the containers
        await doRzedu(c, items);
        for (const z of zones) z.remove();
        for (const h of items) h.tag = h.kolor;
        zones = await pojemniki(c, ["koszyk", "czerwone"], ["pudelko", "inne"]);
        await c.say("sarenka", "line.a_zasada_kolor");
        await c.sort({ items, zones, wrong: "line.a_pomylka" });
        await pokazPrezenty(c, items);
        await c.rozblysk(zones[0]);                                                  // all the gifts in one basket!
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
        await c.task({ targets: [...pomoc, ...nie], correct: pomoc, wrong: "line.b_nie_grzeje", wszystkie: true });
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
        // they arrive at the great tree: someone lives here... a red door - it must be here
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.c_dab", { anim: "Wskazanie" });
        await c.say("sarenka", "line.c_mieszka", { anim: "Rozgladanie" });
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.emocja("wiewiorka", "wykrzyknik", { anim: "Podskok" });
        await c.say("wiewiorka", "line.c_drzwi");
        await c.say("sarenka", "line.c_puk");
        c.sfx("tap"); await c.wait(0.25); c.sfx("tap"); await c.wait(0.25); c.sfx("tap");
        // the door opens: Fox steps out and walks to the front
        await c.ujecie("ogolny");
        c.sfx("whoosh");
        await c.say("sarenka", "line.c_otwieraja", { anim: "Rozgladanie" });
        const L = c.stage.puppets.lisek, G0 = c.stage.puppets.wiewiorka.korzen.position.y;
        L.korzen.position.set(DRZWI.x, DRZWI.y, 0); L.podloga = DRZWI.y; L.korzen.scale.setScalar(1 - GLEBIA * (DRZWI.y - G0));
        L.korzen.visible = true; c.stage.appear(L);
        await c.przejdz("lisek", [[DRZWI.x - 0.2, DRZWI.y - 0.35], [0, G0]], { glebia: GLEBIA });
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });
        await c.say("wiewiorka", "line.c_pytanie", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "lisek" });
        c.rozblysk("lisek");
        await c.emocja("lisek", "serce", { anim: "Kiwanie" });
        await c.say("lisek", "line.c_to_ja");
        await c.say("wiewiorka", "line.c_czemu");
        await c.say("lisek", "line.c_wstyd", { anim: "Smutek" });
        await c.say("wiewiorka", "line.c_dziekujemy", { anim: "Radosc" });
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
      // home, Fox's first visit: the pie is still baking; the room is a mess. Fox "tidies" - everything into one box;
      // Deer wants to play ball - where is it? Somewhere in the jumble. Group: toys into the basket, clothes into the
      // box - and the ball is found at once. Then the promised pie.
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka"); c.show("lisek");
        const W = c.stage.puppets.wiewiorka, S = c.stage.puppets.sarenka, L = c.stage.puppets.lisek;
        W.korzen.position.x = -5.0; L.korzen.position.x = -3.2; S.korzen.position.x = 4.9;     // three of them, the rug free between
        await c.ubierz("lisek", "czapka_zimowa");
        const rzeczy = await naDywanie(c, [
          { name: "klocek", tag: "zabawki" }, { name: "misiu", tag: "zabawki" }, { name: "pilka", tag: "zabawki" },
          { name: "skarpetka", tag: "ubrania" }, { name: "but", tag: "ubrania" }, { name: "czapka_zimowa_2", ubranie: true, tag: "ubrania" }]);
        await c.say("wiewiorka", "line.e_witaj", { anim: "Machanie" });
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.emocja("lisek", "wykrzyknik", { anim: "Rozgladanie" });
        await c.say("lisek", "line.e_balagan");
        await c.say("lisek", "line.e_posprzatam", { anim: "Podskok" });
        // the naive way: everything flies into one box, anyhow
        await c.ujecie("ogolny");
        const pudlo = await c.object("pudelko", { x: DYWAN.x, y: -1.75, size: 2.4 });
        pudlo.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9; });          // under the things falling in
        for (const h of tasuj(rzeczy)) { await h.moveTo(DYWAN.x + (Math.random() - 0.5) * 1.1, -1.5 + (Math.random() - 0.5) * 0.35, 0.3); h.mesh.rotation.z = (Math.random() - 0.5) * 2; }
        await c.say("lisek", "line.e_gotowe", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["lisek", "sarenka"] });
        await c.say("sarenka", "line.e_pilka", { anim: "Podskok" });
        // where is the ball? somewhere in the jumble: Fox rummages, nothing comes out right
        await c.ujecie("ogolny");
        for (let i = 0; i < 3; i++) { c.shake(pudlo); await c.wait(0.35); }
        c.play("lisek", "Smutek"); await c.wonder("lisek");
        await c.say("lisek", "line.e_nie_ma");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "zarowka", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.e_grupujmy");
        // out of the box, into a row; then the two groups
        await c.ujecie("ogolny");
        for (const h of rzeczy) h.mesh.rotation.z = 0;
        await doRzedu(c, rzeczy);
        pudlo.remove();
        const zones = await pojemniki(c, ["koszyk", "zabawki"], ["pudelko", "ubrania"], { xs: [-0.15, 2.55], w: 2.4, h: 2.3 });   // right of Fox
        await c.say("wiewiorka", "line.e_zasada");
        await c.sort({ items: rzeczy, zones, wrong: "line.e_pomylka" });
        await c.say("sarenka", "line.e_porzadek", { anim: "Radosc" });
        // now finding is easy: where to look for the ball?
        await c.say("lisek", "line.e_gdzie_pilka");
        const zabawki = zones[0];
        await c.task({ targets: zones, correct: zabawki, wrong: "line.e_nie_tam" });
        const pilka = zabawki.items.find((h) => h.name === "pilka");
        if (pilka) { c.stage.bump(pilka, 0.35); await c.take("lisek", pilka); }                   // straight into his paw
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.emocja("lisek", "radosc", { anim: "Radosc" });
        await c.say("lisek", "line.e_jest");
        await c.ujecie("ogolny");
        if (pilka) await c.put("lisek", L.korzen.position.x + 1.3, -1.7);          // the paw is free again for the pie
        c.clear();
        // the promised pie
        const ciasto = await c.object("szarlotka", { x: 1.2, y: -1.55, size: 1.8 });   // on the rug: a picnic
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
