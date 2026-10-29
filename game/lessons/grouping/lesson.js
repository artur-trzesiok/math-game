// Lesson: grouping - a detective story on the autumn panorama: someone leaves red gifts; grouping by one rule and then
// another shows what they have in common (the method on an insert); a trail of red leaves, buried by the wind - the child
// rakes the leaves off and finds paw prints (the breather); the torn forest map put together and walked along the path
// of red leaves; Fox at the red door tells how it happened (a comic), and is helped to find his red hat in his oak. At
// home, the third act: Fox's "everything into one box" again, the room's painted places (sill, rug, box), the detective
// game shown in play, the things for the pie, the pie seen. Script in scenario.md.

const PANO = "jesienny_sad";
const ROW_Y = 1.45;                              // loose things: above the characters' heads
const ZL = -1.75, ZR = 1.75, ZY = -2.0, ZW = 3.3, ZH = 2.6;          // two containers on the ground between them
const DRZWI = { x: 3.05, y: 0.15 };             // Fox's red door in area 2 (where he comes out, small: far away)
const GLEBIA = 0.2;                              // how fast he grows as he walks to the front (door-sized at the door)
const TRZY = { x: 2.2, w: 2.5, h: 2.3 };          // containers when Fox stands between the two others (at 0)
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

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
// the gifts and the things the wind blew in, made again (an insert clears the stage)
async function rzeczySadu(c) {
  const out = [];
  for (const n of ["jablko", "lisc_czerwony", "klocek", "pilka"]) {
    const h = await c.object(n, { y: ROW_Y, size: 0.95 });
    Object.assign(h, { prezent: true, tag: n === "jablko" ? "jedzenie" : "inne", kolor: "czerwone" }); await kokarda(c, h); out.push(h);
  }
  for (const [n, tag] of [["gruszka", "jedzenie"], ["lisc_zolty", "inne"], ["szyszka", "inne"]]) {
    const h = await c.object(n, { y: ROW_Y, size: 0.95 }); Object.assign(h, { tag, kolor: "inne" }); out.push(h);
  }
  c.arrange([tasuj(out)], { y: ROW_Y, gap: 0.14 });
  return out;
}
// things already on screen up into a row (out of their containers too) - the same things, ready for another rule
async function doRzedu(c, rzeczy, { y = ROW_Y } = {}) {
  for (const h of rzeczy) if (h.zone) h.zone.take(h, false);
  c.arrange([tasuj(rzeczy)], { y, gap: 0.14, animate: true });                 // shuffled: the gifts never stand together
  await c.wait(0.5);
}
// the gifts light up one after another wherever they lie now
async function pokazPrezenty(c, rzeczy) {
  for (const h of rzeczy.filter((h) => h.prezent)) { c.stage.bump(h, 0.3); c.sfx("tap"); await c.wait(0.35); }
}
// home: the room's things scattered on the floor between the characters, turned anyhow
async function naPodlodze(c, rzeczy, { x0 = -1.6, x1 = 3.0, y0 = -3.0, y1 = -1.9, size = 1.0 } = {}) {
  const miejsca = [];
  for (let proby = 0; miejsca.length < rzeczy.length && proby < 800; proby++) {
    const x = x0 + Math.random() * (x1 - x0), y = y0 + Math.random() * (y1 - y0);
    if (miejsca.every(([mx, my]) => Math.hypot(mx - x, (my - y) * 1.4) > 0.9)) miejsca.push([x, y]);
  }
  const out = [];
  for (const [i, r] of tasuj(rzeczy).entries()) {
    const [x, y] = miejsca[i] || [(x0 + x1) / 2, (y0 + y1) / 2];
    const h = await c.object(r.name, { x, y, size: r.size || size });
    Object.assign(h, { tag: r.tag }); h.mesh.rotation.z = (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.7); out.push(h);
  }
  return out;
}

// home: the painted window sill (books stand there), the middle of the rug (toys lie there; not under the characters)
// and the box by the wall (clothes)
async function miejscaPokoju(c, m) {
  const parapet = await m.parapet.strefa(); parapet.want = "ksiazki";
  const dywan = await c.zone({ x: m.dywan.x - 0.3, y: m.dywan.y, w: 3.0, h: Math.max(0.8, m.dywan.h), name: "miejsce_dywan", niewidoczna: true, rodzaj: "lezy" }); dywan.want = "zabawki";
  const pud = await c.zone({ x: 2.7, y: -2.3, w: 1.9, h: 1.5, image: "pudelko", name: "pudelko" }); pud.want = "ubrania";
  return { parapet, dywan, pud };
}

export default {
  id: "grouping",
  przejscia: true,
  nagrody: true,
  characters: { wiewiorka: { side: "left" }, sarenka: { side: "right" }, lisek: { side: "left", x: 0 } },
  backgrounds: { story: PANO, practice: { kolor: "#f6e1b8", motyw: "liscie" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the orchard: gifts again under the apple tree; the wind mixes them up; the method on an insert; which rule
      // shows what the gifts have in common? Food / the rest: they land in both groups. Red / the rest: all in one!
      async (c) => {
        c.czastki("liscie", { wiatr: 0.5 });
        // the gifts already lie under the apple tree, each with a golden bow; Squirrel runs in, sees them and calls Deer
        const prezenty = [];
        for (const [i, n] of ["jablko", "lisc_czerwony", "klocek", "pilka"].entries()) {
          const h = await c.object(n, { x: -1.7 + i * 1.15, y: -1.95, size: 0.95 });
          Object.assign(h, { prezent: true }); await kokarda(c, h); prezenty.push(h);
        }
        await c.enter("wiewiorka");
        await c.emocja("wiewiorka", "wykrzyknik", { anim: "Podskok" });
        await c.say("wiewiorka", "line.a_start", { anim: "Machanie" });
        await c.enter("sarenka");
        await c.say("sarenka", "line.a_znowu", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["wiewiorka", ...prezenty] });             // Squirrel names the gifts, the gifts in the shot
        await c.say("wiewiorka", "line.a_wymien");
        for (const h of prezenty) { c.stage.bump(h, 0.3); await c.wait(0.45); }
        await c.ujecie("zblizenie", { na: "wiewiorka" });                        // a surprise: the third time!
        await c.emocja("wiewiorka", "wykrzyknik", { anim: "Podskok" });
        await c.say("wiewiorka", "line.a_kto");
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });          // the plan, a dialogue of two
        await c.say("sarenka", "line.a_obietnica");
        await c.emocja("wiewiorka", "zarowka", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.a_detektywi");
        await c.say("sarenka", "line.a_pomoze", { anim: "Kiwanie" });
        // a gust blows other things in from the side: they land among the gifts (the gifts keep their bows)
        await c.ujecie("ogolny");
        c.czastki("liscie", { wiatr: 2.2, gestosc: 1.6 }); c.sfx("whoosh");
        const inne = [];
        for (const [i, n] of ["gruszka", "lisc_zolty", "szyszka"].entries()) inne.push(await c.object(n, { x: -7, y: 1.5 + i * 0.4, size: 0.95 }));
        const miejsca = tasuj([-2.9, -1.95, -1.0, -0.05, 0.9, 1.85, 2.8]);
        [...prezenty, ...inne].forEach((h, i) => { h.moveTo(miejsca[i], -1.75 - (i % 3) * 0.28, 0.7); h.mesh.rotation.z = (i % 2 ? 0.3 : -0.25); });
        await c.wait(0.8);
        c.czastki("liscie", { wiatr: 0.5 });
        await c.emocja("sarenka", "smutek", { anim: "Smutek" });
        await c.say("sarenka", "line.a_pomieszane");
        // the method on a plain colour: apples and cones mixed, then apples together and cones together
        await c.go({ kolor: "#f6e1b8", motyw: "liscie" }, { ciecie: true });
        const metoda = [];
        for (const [i, n] of ["jablko", "szyszka", "jablko", "szyszka", "jablko"].entries()) {
          const h = await c.object(n, { x: -2.4 + i * 1.2, y: -0.2 + (i % 2 ? 0.5 : -0.3), size: 1.0 }); h.mesh.rotation.z = (i % 2 ? 0.3 : -0.2); metoda.push(h);
        }
        await c.ujecie("sredni", { na: ["sarenka", ...metoda] });
        await c.say("sarenka", "line.a_grupuj", { anim: "Zgloszenie" });
        let ja = 0, sz = 0;
        for (const h of metoda) {                                                // they fly into two groups, one by one
          const jab = h.name === "jablko";
          h.mesh.rotation.z = 0;
          await h.moveTo(jab ? -2.4 + ja++ * 0.95 : 1.4 + sz++ * 0.95, 0.2, c.fast ? 0.15 : 0.45);
        }
        await c.ujecie("zblizenie", { na: "wiewiorka" });                         // she gets it
        await c.emocja("wiewiorka", "zarowka", { anim: "Kiwanie" });
        await c.say("wiewiorka", "line.a_grupuj_ok");
        // back in the orchard: the same things in a row; rule one: food / the rest
        await c.go(PANO, { ciecie: true });
        c.czastki("liscie", { wiatr: 0.5 });
        const items = await rzeczySadu(c);
        await c.ujecie("ogolny");
        let zones = await pojemniki(c, ["miska", "jedzenie"], ["pudelko", "inne"]);
        await c.say("wiewiorka", "line.a_zasada_jedzenie");
        await c.sort({ items, zones, wrong: "line.a_pomylka" });
        await c.say("sarenka", "line.a_gdzie_prezenty");
        await pokazPrezenty(c, items);
        await c.ujecie("sredni", { na: ["wiewiorka", ...zones] });                 // she looks at the two groups: gifts in both?
        c.play("wiewiorka", "Rozgladanie"); await c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.a_nie_ta");
        // rule two: red / the rest - the same things come back out of the containers
        await c.ujecie("ogolny");
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
      // B. the meadow: a cold wind - what is useful against it (onto Squirrel; Deer has her fur); the wind buries the
      // trail - the breather: rake the leaves off, paw prints lead to the oak; the torn map put together and walked
      async (c) => {
        c.czastki("liscie", { wiatr: 1.6, gestosc: 1.3 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "zimno", { anim: "Smutek" });
        await c.say("wiewiorka", "line.b_wieje");
        const miejsca = tasuj([-3.4, -1.15, 1.15, 3.4]);
        const pomoc = [await c.ubranie("czapka_zimowa_3", { x: miejsca[0], y: ROW_Y, size: 1.0 }), await c.ubranie("szalik_3", { x: miejsca[1], y: ROW_Y, size: 1.0 })];
        const nie = [await c.object("pilka", { x: miejsca[2], y: ROW_Y, size: 0.9 }), await c.object("lyzka", { x: miejsca[3], y: ROW_Y, size: 0.9 })];
        await c.ujecie("ogolny");                                                // the task: every option in the shot
        await c.say("sarenka", "line.b_co_przyda");
        dobre(pomoc); await c.task({ targets: [...pomoc, ...nie], correct: pomoc, wrong: "line.b_nie_grzeje", wszystkie: true }); dobre(pomoc, false);
        await c.say("sarenka", "line.b_co_przyda_ok", { anim: "Kiwanie" });
        for (const h of nie) h.remove();
        await c.say("sarenka", "line.b_ubierz");
        await c.ubieranie({ rzeczy: pomoc, kto: ["wiewiorka"], pasuje: () => true });
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("wiewiorka", "line.b_cieplo", { anim: "Radosc" });
        await c.say("sarenka", "line.b_futerko", { anim: "Kiwanie" });
        // along the trail - a gust heaps leaves over it
        await c.pan(1.4, { idz: ["wiewiorka", "sarenka"], d: 1.6 });
        c.czastki("liscie", { wiatr: 2.6, gestosc: 2.0 }); c.sfx("whoosh");
        await c.wait(0.8);
        c.czastki("liscie", { wiatr: 0.6 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                        // oh no: the trail is gone
        await c.emocja("wiewiorka", "wykrzyknik", { anim: "Smutek" });
        await c.say("wiewiorka", "line.b_zniknely");
        await c.ujecie("dwuujecie", { na: ["sarenka", "wiewiorka"] });
        await c.say("sarenka", "line.b_odgarnij", { anim: "Zgloszenie" });
        // the breather: rake the leaves off with a finger
        await c.ujecie("ogolny");
        const z = await c.zdrapka("trop_pod_liscmi");
        const [lapka, dab] = z.cele;                                             // sorted by x: the print, then the oak
        await z.zaznacz(lapka);
        await c.say("wiewiorka", "line.b_lapki", { anim: "Podskok" });
        await c.say("sarenka", "line.b_dokad");
        dobre(dab); await c.task({ targets: [...z.cele, z.tlo], correct: dab, wrong: "line.b_dokad_nie" }); dobre(dab, false);
        await z.zaznacz(dab);
        await c.say("wiewiorka", "line.b_do_debu", { anim: "Radosc" });
        await z.remove();
        await c.pan(1.75, { idz: ["wiewiorka", "sarenka"], d: 1.4 });
        await c.say("sarenka", "line.b_las", { anim: "Wskazanie" });
        // the forest is big: the wind blows a map into a branch and tears it
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        c.play("wiewiorka", "Rozgladanie"); await c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.b_gdzie_teraz");
        await c.ujecie("dwuujecie", { na: ["sarenka", "wiewiorka"] });          // a gust: something flies in
        c.czastki("liscie", { wiatr: 2.2, gestosc: 1.4 }); c.sfx("whoosh");
        await c.say("sarenka", "line.b_kartka", { anim: "Podskok" });
        c.czastki("liscie", { wiatr: 0.6 });
        await c.ujecie("ogolny");                                                // the torn map: a task, wide
        await c.say("wiewiorka", "line.b_poskladaj");
        const mapa = await c.podarty("mapa_lasu", { kawalki: 4 });
        await c.say("wiewiorka", "line.b_mapa_plan");
        await mapa.remove();
        // our way along the path of red leaves (index 0); the other paths shake the pawn
        await c.say("sarenka", "line.b_mapa_gdzie");
        const w = await c.wedrowka("mapa_lasu", { pionek: "lisc_czerwony", dobra: 0, bezLotu: true, wrong: "line.b_mapa_nie" });
        await w.remove();
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("wiewiorka", "line.b_mapa_dab", { anim: "Radosc" });
        await c.pan(2, { idz: ["wiewiorka", "sarenka"], d: 1.6 });
      },
      // C. the forest edge: the red door; Fox comes out (far away, small) and walks up to them - it was him, and the comic
      // shows how; invited for the pie, but he cannot find his red hat in the mess: sort hats and scarves, the red hat
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
        await c.say("sarenka", "line.c_otwieraja", { anim: "Rozgladanie" });
        // the door opens: Fox steps out and walks to the front, in the wide shot
        await c.ujecie("ogolny");
        c.sfx("whoosh");
        const L = c.stage.puppets.lisek, G0 = c.stage.puppets.wiewiorka.korzen.position.y;
        L.korzen.position.set(DRZWI.x, DRZWI.y, 0); L.podloga = DRZWI.y; L.korzen.scale.setScalar(1 - GLEBIA * (DRZWI.y - G0));
        L.korzen.visible = true; c.stage.appear(L);
        await c.przejdz("lisek", [[DRZWI.x - 0.2, DRZWI.y - 0.35], [0, G0]], { glebia: GLEBIA });
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });
        await c.say("wiewiorka", "line.c_pytanie", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "lisek" });                            // the surprise: it was him
        c.rozblysk("lisek");
        await c.emocja("lisek", "serce", { anim: "Kiwanie" });
        await c.say("lisek", "line.c_to_ja");
        // how it happened, as a comic, panel by panel
        const il = await c.ilustracja("lisek_prezenty");
        await il.okienko(1);
        await c.say("lisek", "line.c_komiks_1");
        await il.okienko(2);
        await c.say("lisek", "line.c_komiks_2");
        await il.okienko(3);
        await c.say("lisek", "line.c_komiks_3");
        await il.calosc(); await c.wait(1.0);
        await il.zsun();
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });
        await c.say("wiewiorka", "line.c_czemu");
        await c.say("lisek", "line.c_wstyd", { anim: "Smutek" });
        await c.say("wiewiorka", "line.c_dziekujemy", { anim: "Radosc" });
        await c.ujecie("ogolny");                                                // all three: the invitation
        await c.say("sarenka", "line.c_zapraszamy", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["lisek", "sarenka"] });
        await c.say("lisek", "line.c_balagan", { anim: "Rozgladanie" });
        await c.say("lisek", "line.c_wejdzcie", { anim: "Zgloszenie" });
        // inside Fox's home in the oak: everything red - and his hats and scarves all over the place
        await c.go("lisia_nora", { enter: true });
        await Promise.all(["wiewiorka", "sarenka", "lisek"].map((n) => c.enter(n)));
        await c.rozblysk("wiewiorka");
        await c.say("wiewiorka", "line.c_przytulnie", { anim: "Rozgladanie" });
        const rzeczy = [
          { name: "czapka_zimowa", ubranie: true, tag: "czapki", kolor: "czerwona" }, { name: "czapka_zimowa_2", ubranie: true, tag: "czapki" }, { name: "czapka_zimowa_3", ubranie: true, tag: "czapki" },
          { name: "szalik", ubranie: true, tag: "szaliki" }, { name: "szalik_2", ubranie: true, tag: "szaliki" }, { name: "szalik", ubranie: true, tag: "szaliki" }];
        const items = await wRzedzie(c, rzeczy, { size: 0.9 });
        for (const h of items) { h.mesh.rotation.z = (Math.random() - 0.5) * 1.4; h.mesh.position.y += (Math.random() - 0.5) * 0.5; }   // a mess, turned anyhow
        await c.ujecie("sredni", { na: ["lisek", ...items] });
        await c.say("lisek", "line.c_lubie", { anim: "Smutek" });
        // his things: hats into the basket, scarves into the box
        await c.ujecie("ogolny");
        for (const h of items) h.mesh.rotation.z = 0;
        await doRzedu(c, items);
        const zones = await pojemniki(c, ["koszyk", "czapki"], ["pudelko", "szaliki"], TRZY);
        await c.say("wiewiorka", "line.c_pogrupujmy");
        await c.sort({ items, zones, wrong: "line.c_pomylka" });
        await c.ujecie("sredni", { na: ["lisek", ...zones] });
        await c.say("lisek", "line.c_pogrupowane", { anim: "Radosc" });
        // the red one among the hats
        await c.ujecie("ogolny");
        const czapki = zones[0].items.slice();
        await c.say("sarenka", "line.c_ktora");
        const czerwona = czapki.find((h) => h.kolor === "czerwona");
        dobre(czerwona); await c.task({ targets: czapki, correct: czerwona, wrong: "line.c_nie_ta" }); dobre(czerwona, false);
        c.clear();
        await c.ubierz("lisek", "czapka_zimowa");
        await c.ujecie("zblizenie", { na: "lisek" });                            // thank you
        await c.emocja("lisek", "radosc", { anim: "Radosc" });
        await c.say("lisek", "line.c_gotowy");
      },
    ],
    practice: [
      // a detective's training: five different mini-games, a star each, every answer named
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka"); c.zdejmij("wiewiorka");          // the training is not out in the wind
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("wiewiorka", "line.p_start", { anim: "Podskok" });
        // 1. what fits this group? three red things in Deer's bubble, which of two joins them
        {
          const grupa = await c.idea("sarenka", [["jablko", "klocek", "lisc_czerwony"]]);
          const lewo = Math.random() < 0.5;
          const a = await c.object("pilka", { x: lewo ? -1.6 : 1.6, y: -0.2, size: 1.2 }), b = await c.object("lisc_zolty", { x: lewo ? 1.6 : -1.6, y: -0.2, size: 1.2 });
          await c.ujecie("ogolny");
          await c.say("sarenka", "line.p_wspolne");
          dobre(a); await c.task({ targets: [a, b], correct: a, wrong: "line.p_nie_pasuje" }); dobre(a, false);
          b.remove();
          await c.ujecie("sredni", { na: ["sarenka", a] });
          await c.say("sarenka", "line.p_wspolne_ok", { anim: "Radosc" }); gw.dodaj();
          grupa.remove(); c.clear();
        }
        // 2. the secret rule: a basket and a chest with no label - mushrooms into one, cones into the other
        {
          await c.ujecie("ogolny");
          await c.say("wiewiorka", "line.p_tajna", { anim: "Zgloszenie" });
          const r = await c.regula({ pojemniki: ["koszyk", "skrzynia"], cecha: "rodzaj", wartosci: ["grzyb", "szyszka"], poIlu: 3,
            rzeczy: tasuj([0, 1, 2].flatMap(() => [{ name: "grzyb", rodzaj: "grzyb" }, { name: "szyszka", rodzaj: "szyszka" }])),
            wrong: "line.p_tajna_nie" });
          gw.dodaj();
          await c.ujecie("sredni", { na: ["sarenka", ...r.pojemniki] });
          await c.say("sarenka", "line.p_tajna_ok", { anim: "Radosc" });
          r.remove(); c.clear();
        }
        // 3. the odd one out: three acorns and a chestnut
        {
          await c.ujecie("ogolny");
          const wiersz = await wRzedzie(c, [{ name: "zoledz", tag: "z" }, { name: "zoledz", tag: "z" }, { name: "zoledz", tag: "z" }, { name: "kasztan", tag: "k" }], { y: 0.6, size: 1.1 });
          await c.say("sarenka", "line.p_inny");
          const k = wiersz.find((h) => h.tag === "k");
          dobre(k); await c.task({ targets: wiersz, correct: k, wrong: "line.p_pasuje" }); dobre(k, false);
          await c.ujecie("sredni", { na: ["sarenka", k] });
          await c.say("sarenka", "line.p_inny_ok", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        // 4. your own rule: leaves and flags, red and yellow - the first drops decide, Squirrel says the rule
        await c.go({ kolor: "#e3eed6", motyw: "kola" }, { ciecie: true });
        const zestaw = () => tasuj([["lisc_czerwony", "czerwony", "lisc"], ["lisc_zolty", "zolty", "lisc"], ["choragiewka_czerwona", "czerwony", "choragiewka"],
          ["choragiewka_zolta", "zolty", "choragiewka"], ["lisc_czerwony", "czerwony", "lisc"], ["choragiewka_zolta", "zolty", "choragiewka"]].map(([name, kolor, rodzaj]) => ({ name, kolor, rodzaj })));
        const mowRegule = (cecha) => c.say("wiewiorka", cecha === "kolor" ? "line.p_wg_koloru" : "line.p_wg_rodzaju", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["sarenka", "wiewiorka"] });
        await c.say("sarenka", "line.p_wymysl", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const r1 = await c.regula({ pojemniki: ["koszyk", "skrzynia"], cechy: ["kolor", "rodzaj"], poIlu: 3, rzeczy: zestaw(),
          wrong: "line.p_wymysl_nie" });
        gw.dodaj();
        await c.ujecie("sredni", { na: ["wiewiorka", ...r1.pojemniki] });
        await mowRegule(r1.cecha);
        r1.remove();
        // 5. the same things the other way
        const inna = r1.cecha === "kolor" ? "rodzaj" : "kolor";
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("wiewiorka", "line.p_inaczej", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const r2 = await c.regula({ pojemniki: ["koszyk", "skrzynia"], cecha: inna, wartosci: inna === "kolor" ? ["czerwony", "zolty"] : ["lisc", "choragiewka"],
          poIlu: 3, rzeczy: zestaw(), wrong: "line.p_wymysl_nie" });
        gw.dodaj();
        await c.ujecie("sredni", { na: ["wiewiorka", ...r2.pojemniki] });
        await mowRegule(r2.cecha);
        await c.ujecie("dwuujecie", { na: ["sarenka", "wiewiorka"] });
        await c.say("sarenka", "line.p_inaczej_ok", { anim: "Kiwanie" });
        r2.remove();
        await c.say("wiewiorka", "line.p_koniec", { anim: "Brawo" });
      },
    ],
    apply: [
      // home - the third act, Fox's first visit: the pie is still baking; books, toys and clothes on the floor. Fox
      // "tidies" - everything into one box; Deer wants the ball - lost in the jumble. Group: books onto the sill, toys
      // onto the rug, clothes into the box (painted places); the ball found at once; the detective game shown in play;
      // the things for the pie; the pie seen.
      async (c) => {
        const S = c.stage;
        c.show("wiewiorka"); c.show("sarenka"); c.show("lisek"); c.zdejmij("wiewiorka");   // indoors: hat and scarf off
        const W = S.puppets.wiewiorka, Sa = S.puppets.sarenka, L = S.puppets.lisek;
        W.korzen.position.x = -5.0; L.korzen.position.x = -3.3; Sa.korzen.position.x = 5.1;     // three of them, the floor free between
        await c.ubierz("lisek", "czapka_zimowa");
        const m = await c.miejsca();
        const rzeczy = await naPodlodze(c, [
          { name: "ksiazeczka", tag: "ksiazki" }, { name: "ksiazeczka", tag: "ksiazki" },
          { name: "klocek", tag: "zabawki" }, { name: "misiu", tag: "zabawki" }, { name: "pilka", tag: "zabawki" },
          { name: "skarpetka", tag: "ubrania" }, { name: "but", tag: "ubrania" }]);
        // arrival with the thread: the guest, the pie in the oven
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });
        await c.say("wiewiorka", "line.e_witaj", { anim: "Machanie" });
        await c.ujecie("zblizenie", { na: "lisek" });                            // the mess: a surprise
        await c.emocja("lisek", "wykrzyknik", { anim: "Rozgladanie" });
        await c.say("lisek", "line.e_balagan");
        await c.say("lisek", "line.e_posprzatam", { anim: "Podskok" });
        // the naive way: everything flies into one box, anyhow
        await c.ujecie("ogolny");
        const PX = 0.6;
        const pudlo = await c.object("pudelko", { x: PX, y: -2.0, size: 2.4 });
        pudlo.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9; });          // under the things falling in
        for (const h of tasuj(rzeczy)) { await h.moveTo(PX + (Math.random() - 0.5) * 1.1, -1.75 + (Math.random() - 0.5) * 0.35, c.fast ? 0.1 : 0.3); h.mesh.rotation.z = (Math.random() - 0.5) * 2; }
        await c.say("lisek", "line.e_gotowe", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["lisek", "sarenka"] });
        await c.say("sarenka", "line.e_pilka", { anim: "Podskok" });
        // where is the ball? somewhere in the jumble: Fox rummages, nothing comes out right
        await c.ujecie("sredni", { na: ["lisek", pudlo] });
        for (let i = 0; i < 3; i++) { c.shake(pudlo); await c.wait(0.35); }
        c.play("lisek", "Smutek"); await c.wonder("lisek");
        await c.say("lisek", "line.e_nie_ma");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "zarowka", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.e_grupujmy");
        // 1. out of the box, into a row; every group onto its painted place: books on the sill, toys on the rug, clothes into the box
        await c.ujecie("ogolny");
        for (const h of rzeczy) h.mesh.rotation.z = 0;
        await doRzedu(c, rzeczy, { y: 2.3 });
        pudlo.remove();
        const { parapet, dywan, pud } = await miejscaPokoju(c, m);
        await c.say("wiewiorka", "line.e_zasada");
        await c.sort({ items: rzeczy, zones: [parapet, dywan, pud], wrong: "line.e_pomylka" });
        await c.say("sarenka", "line.e_porzadek", { anim: "Radosc" });
        // 2. now finding is easy: where to look for the ball? (any toy on the rug is the right place)
        const zabawki = rzeczy.filter((h) => h.tag === "zabawki"), pilka = zabawki.find((h) => h.name === "pilka");
        await c.say("lisek", "line.e_gdzie_pilka");
        dobre(zabawki); await c.task({ targets: rzeczy, correct: zabawki, wrong: "line.e_nie_tam" }); dobre(zabawki, false);
        c.stage.bump(pilka, 0.35); dywan.take(pilka); await c.take("lisek", pilka);                   // straight into his paw
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.emocja("lisek", "radosc", { anim: "Radosc" });
        await c.say("lisek", "line.e_jest");
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });
        await c.put("lisek", dywan.x - 1.0, dywan.y); dywan.put(pilka);
        // 3. the detective game, the home game shown in play: a sock slips in among the toys
        await c.say("wiewiorka", "line.e_gra", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const skarpetka = rzeczy.find((h) => h.name === "skarpetka");
        pud.take(skarpetka); dywan.put(skarpetka); await c.wait(0.6);
        await c.say("sarenka", "line.e_gra_kto");
        const naDywanie = dywan.items.slice();
        dobre(skarpetka); await c.task({ targets: naDywanie, correct: skarpetka, wrong: "line.e_gra_nie" }); dobre(skarpetka, false);
        await c.ujecie("sredni", { na: ["lisek", skarpetka] });
        await c.say("lisek", "line.e_gra_ok", { anim: "Radosc" });
        dywan.take(skarpetka); pud.put(skarpetka);
        // 4. the pie is ready: what do we need for it? (on a plain colour: the things talked about alone)
        await c.go({ kolor: "#f6e2c4", motyw: "kola" }, { ciecie: true });
        W.korzen.position.x = -5.0; L.korzen.position.x = -3.3; Sa.korzen.position.x = 5.1;      // the row between them, nobody under it
        const doCiasta = [], inne = [];
        for (const n of ["talerz", "kubek", "lyzka"]) doCiasta.push(await c.object(n, { y: 0.4, size: 1.1 }));
        for (const n of ["klocek", "ksiazeczka"]) inne.push(await c.object(n, { y: 0.4, size: 1.1 }));
        const wybor = tasuj([...doCiasta, ...inne]);
        c.arrange([wybor], { y: 0.4, gap: 0.35 });
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.e_szarlotka", { anim: "Radosc" });
        dobre(doCiasta); await c.task({ targets: wybor, correct: doCiasta, wrong: "line.e_szarlotka_nie", wszystkie: true }); dobre(doCiasta, false);
        for (const h of inne) h.remove();
        await c.ujecie("sredni", { na: ["wiewiorka", ...doCiasta] });
        await c.say("wiewiorka", "line.e_szarlotka_ok", { anim: "Radosc" });
        // the payoff: back in the tidy room, the pie on the rug, then the picture of the tea party
        await c.go("pokoj", { ciecie: true });
        W.korzen.position.x = -5.0; L.korzen.position.x = -3.3; Sa.korzen.position.x = 5.1;
        const m2 = await c.miejsca(), p2 = await miejscaPokoju(c, m2);
        for (const [z, n] of [[p2.parapet, "ksiazeczka"], [p2.parapet, "ksiazeczka"], [p2.pud, "skarpetka"], [p2.pud, "but"]]) z.put(await c.object(n, { x: z.x, y: z.y, size: 1.0 }));
        for (const [i, n] of ["misiu", "klocek", "pilka"].entries()) await c.object(n, { x: p2.dywan.x - 2.0 + i * 0.7, y: p2.dywan.y, size: 0.85 });   // the toys together at the rug's left edge
        await c.ujecie("ogolny");
        const ciasto = await c.object("szarlotka", { x: p2.dywan.x + 0.95, y: p2.dywan.y + 0.1, size: 1.4 });
        c.sfx("idea"); c.konfetti(ciasto, { ile: 90 });
        await c.say("sarenka", "line.d_szarlotka", { anim: "Radosc" });
        const il = await c.ilustracja("szarlotka_z_liskiem", { ruch: "najazd" });
        await c.say("lisek", "line.d_pycha");
        await il.zsun();
        // the home game, said to the parents
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });
        await c.say("wiewiorka", "line.d_rodzice", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.d_pa");
        await Promise.all([c.play("wiewiorka", "Machanie"), c.play("sarenka", "Machanie"), c.play("lisek", "Machanie")]);
      },
    ],
  },
};
