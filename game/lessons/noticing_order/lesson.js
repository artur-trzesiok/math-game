// Lesson: noticing order - things happen in order: first, then, last; a story can be told from its pictures, and a
// missing step found. Owl reads Bunny a picture book; Bunny, in a hurry, drops it and puts the pages back anyhow ("the
// order doesn't matter") - nonsense; in order it makes sense. Is it true, a chick from an egg? To Fox's: a seed grows to
// a flower (the method on an insert), the snowman's missing page, Bunny's faces (the breather), and the henhouse yard
// behind the garden, where the chick hatches (seen). At home: Bunny's upside-down sandwich, the sandwich in order on the
// counter, the plate on the shelf, the promised book read (seen), the day told in three pictures. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const STRONY = ["jajko", "piskle", "kura"];                                // Owl's book: the painted strip jajko_kura
const strona = (i) => ({ obraz: `/game/assets/historyjki/jajko_kura/panel_${i}.webp` });
const SLOWA = { jajko: { pl: ["jajko"], en: ["egg"] }, piskle: { pl: ["pisklę"], en: ["chick"] }, kura: { pl: ["kurą"], en: ["hen"] } };
const pomieszane = (n) => { let m = tasuj([...Array(n).keys()]); while (m.every((v, i) => v === i)) m = tasuj(m); return m; };

// things already on the screen (each with .ranga) into a row of places, first -> last, an arrow on the first
async function poKolei(c, items, { x = 0, y = 1.45, krok = 2.1, w, h, wrong = "line.zla_kolejnosc" } = {}) {
  const n = items.length, x0 = x - ((n - 1) * krok) / 2;
  const t = await c.slots({ items, slots: items.map((_, k) => ({ x: x0 + k * krok, y, w: w ?? krok * 0.92, h: h ?? krok * 0.9, accept: (it) => it.ranga === k })), wrong });
  const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
  await t.done(); strzalka.remove();
  return items.slice().sort((a, b) => a.ranga - b.ranga);
}
// story cards laid on the floor, never in order already, then put in order
async function historyjka(c, nazwy, { xK = -0.7, yK = -2.2, krok = 2.1, size = 1.8, ...o } = {}) {
  const m = pomieszane(nazwy.length), x0 = xK - ((nazwy.length - 1) * krok) / 2, items = [];   // the floor clear of Fox at x 2.8
  for (const [i, nazwa] of nazwy.entries()) { const h = await c.object(nazwa, { x: x0 + m[i] * krok, y: yK, size }); h.ranga = i; items.push(h); }
  return poKolei(c, items, { krok, ...o });
}
// a sticker wobbles where it stands (no buzz: nothing is wrong)
const kiwaj = (c, h, s = 1.2) => c.stage.tween(s, (t) => { h.mesh.rotation.z = Math.sin(t * Math.PI * 6) * 0.18 * (1 - t); });

export default {
  id: "noticing_order",
  przejscia: true,
  nagrody: true,
  characters: { sowa: { side: "left", x: -4.8 }, zajac: { side: "right", x: 4.8 }, lisek: { side: "right", x: 2.8 } },
  backgrounds: { story: "las", practice: { kolor: "#f6ead1", motyw: "kola" }, apply: "dom" },
  stages: {
    story: [
      // A. the forest: the picture book falls apart; Bunny's pages anyhow - nonsense; in order it makes sense
      async (c) => {
        c.show("sowa");
        await c.enter("zajac");
        await c.ujecie("dwuujecie", { na: ["sowa", "zajac"] });
        await c.say("sowa", "line.a_ksiazka", { anim: "Radosc" });
        await c.say("zajac", "line.a_szybko", { anim: "Podskok" });
        await c.ujecie("ogolny");                                            // the pages fly across the screen
        const strony = [], gdzie = pomieszane(3);
        for (const i of [0, 1, 2]) { const h = await c.object(`jajko_kura_${i}`, { ...strona(i), x: -3.4, y: 0.4, size: 1.9 }); h.ranga = i; h.klucz = STRONY[i]; strony.push(h); }
        c.sfx("whoosh");
        await Promise.all(strony.map((h, i) => Promise.all([
          h.moveTo(-2.2 + gdzie[i] * 2.2, -2.0 - 0.3 * Math.random(), 0.7),
          c.stage.tween(0.7, (s) => { h.mesh.scale.setScalar(h.base * (0.3 + 0.7 * s)); h.mesh.rotation.z = (i - 1) * 0.35 * s + 0.15; }),
        ])));
        await c.ujecie("zblizenie", { na: "zajac" });                        // oh no
        await c.emocja("zajac", "pot", { anim: "Smutek" });
        await c.say("zajac", "line.a_ojej");
        await c.ujecie("ogolny");                                            // Bunny puts them back anyhow: hen, egg, chick
        const mowa = c.say("zajac", "line.a_dowolnie", { anim: "Wskazanie" });
        for (const [i, k] of [2, 0, 1].entries()) { strony[k].mesh.rotation.z = 0; await strony[k].moveTo(-2.2 + i * 2.2, 1.5, 0.35); }
        await mowa;
        await c.ujecie("sredni", { na: ["sowa", ...strony] });              // Owl reads the pages as they lie
        await c.say("sowa", "line.a_czyta_zle");
        await c.ujecie("dwuujecie", { na: ["sowa", "zajac"] });              // they laugh; Owl explains
        await Promise.all([c.play("sowa", "Radosc"), c.play("zajac", "Radosc")]);
        await c.say("zajac", "line.a_smieszne");
        await c.say("sowa", "line.a_po_kolei", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the pages down on the floor again, mixed
        const m = pomieszane(3);
        await Promise.all(strony.map((h, i) => h.moveTo(-2.2 + m[i] * 2.2, -2.2, 0.4)));
        await c.say("sowa", "line.a_uloz");
        const ulozone = await poKolei(c, strony, { krok: 2.2, h: 2.1 });
        await c.ujecie("sredni", { na: ulozone });                          // the pages in order while Owl reads them
        await c.rytm(ulozone, { linia: "line.a_czyta_dobrze", kto: "sowa", slowo: (h) => SLOWA[h.klucz]?.[c.lang] });
        await c.ujecie("zblizenie", { na: "zajac" });                        // his delight
        await c.say("zajac", "line.a_ma_sens", { anim: "Radosc" });
        c.clear();
        await c.ujecie("dwuujecie", { na: ["sowa", "zajac"] });              // the doubt, and where to see it for real
        await c.say("zajac", "line.a_naprawde", { anim: "Zgloszenie" });
        await c.say("sowa", "line.a_do_liska", { anim: "Wskazanie" });
      },
      // B. the garden: the seed grows (the method on an insert); its pictures in order; the snowman's missing page;
      // Bunny's faces (the breather); the hen calls from behind the fence
      async (c) => {
        await c.go("ogrod", { enter: true });
        await Promise.all(["sowa", "zajac", "lisek"].map((n) => c.enter(n)));
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.b_nasiono", { anim: "Machanie" });
        // the method on a plain colour: one pot, seed -> sprout -> flower
        await c.go({ kolor: "#eaf2d7", motyw: "liscie" }, { ciecie: true });
        let h = await c.object("nasiono", { x: -0.6, y: 1.0, size: 2.2 });
        await c.ujecie("sredni", { na: ["sowa", h] });
        await c.say("sowa", "line.b_najpierw", { anim: "Wskazanie" });
        await c.wait(c.fast ? 0.1 : 0.8); h.remove(); h = await c.object("kielek", { x: -0.6, y: 1.0, size: 2.2 });
        await c.say("sowa", "line.b_potem");
        await c.wait(c.fast ? 0.1 : 0.8); h.remove(); h = await c.object("kwiat_rozkwit", { x: -0.6, y: 1.0, size: 2.2 });
        await c.rozblysk(h);
        await c.say("sowa", "line.b_na_koncu", { anim: "Radosc" });
        // back in the garden: Fox's pictures of it, mixed
        await c.go("ogrod", { ciecie: true });
        await c.ujecie("ogolny");
        await c.say("lisek", "line.b_uloz");
        const kwiat = await historyjka(c, ["nasiono", "kielek", "kwiat_rozkwit"]);
        await c.ujecie("sredni", { na: ["lisek", ...kwiat] });
        await c.say("lisek", "line.b_dobrze", { anim: "Brawo" });
        c.clear();
        // helping: Fox's snowman story is missing its middle page
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.emocja("lisek", "smutek", { anim: "Smutek" });
        await c.say("lisek", "line.b_balwan");
        await c.ujecie("ogolny");
        const b1 = await c.object("balwan_1", { x: -2.2, y: 1.5, size: 1.8 });
        const luka = await c.zone({ x: 0, y: 1.5, w: 1.9, h: 1.9, name: "luka" });
        const b3 = await c.object("balwan_3", { x: 2.2, y: 1.5, size: 1.8 });
        const op = [];
        for (const [i, n] of tasuj(["balwan_2", "ciasto_2", "kielek"]).entries()) op.push(await c.object(n, { x: -2.7 + i * 2.0, y: -2.2, size: 1.6 }));
        await c.say("sowa", "line.b_ktora");
        const ok = op.find((q) => q.name === "balwan_2");
        dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.b_ktora_nie" }); dobre(ok, false);
        await ok.moveTo(luka.x, luka.y, 0.4);
        await c.ujecie("sredni", { na: ["lisek", b1, ok, b3] });            // the whole snowman story, the gap filled
        await c.say("lisek", "line.b_balwan_ok", { anim: "Radosc" });
        // the breather: the snowman's merry face gives Bunny an idea - copy his faces
        await c.ujecie("sredni", { na: ["zajac", b3] });
        await c.say("zajac", "line.b_miny", { anim: "Podskok" });
        c.clear();
        await c.ujecie("ogolny");                                            // Bunny hops out in front; the faces to pick are wide
        await c.walkTo("zajac", 0.6);
        await c.lustro({ kto: "zajac", rundy: 3 });
        await c.walkTo("zajac", 4.8);
        // the hen calls from behind the fence
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });
        await c.emocja("lisek", "wykrzyknik");
        await c.say("lisek", "line.b_kurnik", { anim: "Wskazanie" });
      },
      // C. the henhouse yard (the end of the story): the egg in the nest wobbles - what comes next? The chick hatches
      async (c) => {
        await c.go("kurnik", { enter: true });
        await Promise.all(["sowa", "zajac", "lisek"].map((n) => c.enter(n)));
        c.play("zajac", "Rozgladanie");                                      // the arrival, wide: the red henhouse in the shot
        await c.say("zajac", "line.c_kurnik");
        const jajko = await c.object("jajko", { x: -0.4, y: -2.3, size: 1.7 });
        await c.ujecie("sredni", { na: ["lisek", jajko] });
        await c.say("lisek", "line.c_gniazdo", { anim: "Wskazanie" });
        await c.ujecie("sredni", { na: ["sowa", jajko] });                  // it moves
        const kiw = kiwaj(c, jajko, c.fast ? 0.3 : 1.6);
        await c.emocja("sowa", "wykrzyknik");
        await c.say("sowa", "line.c_rusza");
        await kiw;
        await c.ujecie("ogolny");                                            // the task: every option in the shot
        const op = [];
        for (const [i, n] of tasuj(["piskle", "kura"]).entries()) op.push(await c.object(n, { x: -1.2 + i * 2.6, y: 1.4, size: 1.8 }));
        await c.say("sowa", "line.c_co_potem");
        const ok = op.find((h) => h.name === "piskle");
        dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.c_co_potem_nie" }); dobre(ok, false);
        await kiwaj(c, jajko, c.fast ? 0.2 : 0.8);
        c.clear();
        // the chick hatches, seen
        const il = await c.ilustracja("wyklucie", { ruch: "najazd" });
        await c.say("zajac", "line.c_piskle");
        await c.say("lisek", "line.c_kura");
        await il.zsun();
        const piskle = await c.object("piskle", { x: -0.4, y: -2.3, size: 1.7 });
        await c.ujecie("sredni", { na: ["zajac", piskle] });
        await c.rozblysk(piskle);
        await c.ujecie("zblizenie", { na: "zajac" });                        // he gets it
        await c.emocja("zajac", "zarowka", { anim: "Radosc" });
        await c.say("zajac", "line.c_juz_wiem");
        await c.ujecie("sredni", { na: ["sowa", piskle] });                  // the promise for home
        await c.say("sowa", "line.c_do_domu", { anim: "Zgloszenie" });
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("sowa"); c.show("zajac");
        S.puppets.sowa.korzen.position.x = -5.3; S.puppets.zajac.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("dwuujecie", { na: ["sowa", "zajac"] });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        // 1. a cake in order
        {
          await c.ujecie("ogolny");
          await c.say("zajac", "line.p_ciasto");
          const rz = await historyjka(c, ["ciasto_1", "ciasto_2", "ciasto_3"]);
          await c.ujecie("sredni", { na: ["sowa", ...rz] });
          await c.say("sowa", "line.p_ciasto_ok", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        // 2. what came first?
        {
          const a = await c.object("kura", { x: -1.6, y: 0.8, size: 2.5 }), b = await c.object("jajko", { x: 1.8, y: 0.8, size: 2.5 });
          await c.ujecie("ogolny");
          await c.say("sowa", "line.p_co_pierwsze");
          dobre(b); await c.task({ targets: [a, b], correct: b, wrong: "line.p_co_pierwsze_nie" });
          await c.ujecie("sredni", { na: ["zajac", b] });
          await c.say("zajac", "line.p_jajko", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        // 3. the snowman in order
        {
          await c.ujecie("ogolny");
          await c.say("zajac", "line.p_balwan");
          const rz = await historyjka(c, ["balwan_1", "balwan_2", "balwan_3"]);
          await c.ujecie("sredni", { na: ["sowa", ...rz] });
          await c.say("sowa", "line.p_balwan_ok", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        // 4. what comes last?
        {
          const op = []; for (const [i, n] of tasuj(["nasiono", "kielek", "kwiat_rozkwit"]).entries()) op.push(await c.object(n, { x: -2.4 + i * 2.4, y: 0.8, size: 2.2 }));
          await c.ujecie("ogolny");
          await c.say("sowa", "line.p_ostatnie");
          const ok = op.find((h) => h.name === "kwiat_rozkwit");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_ostatnie_nie" });
          await c.ujecie("sredni", { na: ["zajac", ok] });
          await c.say("zajac", "line.p_kwiat", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        // 5. memory of story pictures
        {
          await c.ujecie("ogolny");
          await c.say("zajac", "line.p_memory");
          await c.memory([["jajko"], ["piskle"], ["kura"], ["kielek"]].map(([n]) => [{ obraz: n }, { obraz: n }]), { szer: 1.4 });
          await c.ujecie("sredni", { na: ["sowa"] });                        // the pairs found, named
          await c.say("sowa", "line.p_memory_ok", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // home - the third act in the kitchen: first the snack, then the book. Bunny's sandwich anyhow (it slides apart);
      // the method on an insert; the bread first; the sandwich in order on the painted counter; the plate onto the
      // painted shelf; the book read, seen; the day told in three pictures
      async (c) => {
        const S = c.stage;
        const naMiejsca = () => { S.puppets.sowa.korzen.position.x = -4.8; S.puppets.zajac.korzen.position.x = 3.5; S.puppets.lisek.korzen.position.x = 5.3; };   // Bunny acts, Fox behind him
        for (const n of ["sowa", "zajac", "lisek"]) c.show(n);
        naMiejsca();
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        let m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["sowa", "zajac"] });              // the thread: the snack, then the book
        await c.say("sowa", "line.d_dom", { anim: "Radosc" });
        await c.say("zajac", "line.d_kanapka", { anim: "Podskok" });
        // Bunny's "everything at once": cheese, butter, bread - the stack slides apart
        await c.ujecie("ogolny");
        const st = m.stol, bl = m.blat, TX = st.x + 1.0, TY = st.y + 0.35;
        const talerz = await c.object("talerz", { x: TX, y: TY, size: 1.6 });
        const ser = await c.object("ser", { x: bl.x - 2.2, y: bl.y + 0.65, size: 1.2 });
        const maslo = await c.object("maslo", { x: bl.x, y: bl.y + 0.6, size: 1.3 });
        const kromka = await c.object("kromka", { x: bl.x + 2.2, y: bl.y + 0.65, size: 1.2 });
        const mowa = c.say("zajac", "line.d_zajac_robi", { anim: "Wskazanie" });
        await ser.moveTo(TX, TY + 0.1, 0.45); c.sfx("plop");
        await maslo.moveTo(TX, TY + 0.4, 0.45); c.sfx("plop");
        await kromka.moveTo(TX + 0.1, TY + 0.75, 0.45); c.sfx("plop");
        await mowa;
        await kiwaj(c, kromka, c.fast ? 0.2 : 0.7);
        c.sfx("whoosh");
        await Promise.all([kromka.moveTo(TX - 2.4, -2.8, 0.6), c.stage.tween(0.6, (s) => { kromka.mesh.rotation.z = 2.2 * s; })]);
        await c.ujecie("zblizenie", { na: "zajac" });                        // sticky paws, dismay
        await c.emocja("zajac", "pot", { anim: "Smutek" });
        await c.say("zajac", "line.d_ojej");
        // the method on a plain colour: the sandwich step by step
        await c.go({ kolor: "#fbeed4", motyw: "kola" }, { ciecie: true });
        naMiejsca();
        const kroki = [];
        for (const [i, n] of ["kanapka_1", "kanapka_2", "kanapka_3"].entries()) kroki.push(await c.object(n, { x: -2.4 + i * 2.2, y: 1.2, size: 1.8 }));
        await c.ujecie("sredni", { na: ["sowa", ...kroki] });
        const metoda = c.say("sowa", "line.d_najpierw", { anim: "Wskazanie" });
        for (const k of kroki) { await c.wait(c.fast ? 0.1 : 1.5); c.stage.bump(k, 0.35); }
        await metoda;
        // back in the kitchen: what goes on the plate first?
        await c.go("dom", { ciecie: true });
        naMiejsca();
        m = await c.miejsca();
        await c.ujecie("ogolny");
        const talerz2 = await c.object("talerz", { x: TX, y: TY, size: 1.6 });
        const sk = [];
        for (const [i, n] of tasuj(["kromka", "maslo", "ser"]).entries()) sk.push(await c.object(n, { x: bl.x + (i - 1) * 2.2, y: bl.y + 0.65, size: 1.3 }));
        await c.say("lisek", "line.d_co_najpierw");
        const chleb = sk.find((h) => h.name === "kromka");
        dobre(chleb); await c.task({ targets: sk, correct: chleb, wrong: "line.d_co_najpierw_nie" }); dobre(chleb, false);
        await chleb.moveTo(TX, TY + 0.15, 0.45); c.sfx("plop");
        await c.ujecie("sredni", { na: ["zajac", talerz2, chleb] });
        await c.say("zajac", "line.d_chleb", { anim: "Radosc" });
        c.clear();
        // the sandwich in order on the painted counter
        await c.ujecie("ogolny");
        await c.say("sowa", "line.d_uloz");
        const kan = await historyjka(c, ["kanapka_1", "kanapka_2", "kanapka_3"], { x: bl.x, y: bl.y + 0.75, krok: 2.0, size: 1.5, xK: -0.9, yK: -2.3, h: 1.5 });
        await c.ujecie("sredni", { na: ["zajac", ...kan] });
        await c.say("zajac", "line.d_mniam", { anim: "Radosc" });
        c.clear();
        // eaten: the plate onto the painted shelf
        await c.ujecie("ogolny");
        const pusty = await c.object("talerz", { x: TX, y: TY, size: 1.3 });
        await c.say("lisek", "line.d_talerz");
        const po = m.polka_dolna;
        const t = await c.slots({ items: [pusty], slots: [po.slot((h) => h === pusty)], wrong: "line.d_talerz" });
        await t.done();
        await c.say("lisek", "line.d_talerz_ok", { anim: "Radosc" });           // the plate stays on the shelf
        // the promised book, seen
        const il = await c.ilustracja("czytanie_ksiazeczki", { ruch: "najazd" });
        await c.say("sowa", "line.d_czytanie");
        await c.say("zajac", "line.d_czytanie_zajac");
        await il.zsun();
        // the home game, played: today in three pictures on the counter; the child points in order, Bunny tells
        await c.ujecie("ogolny");
        const DZIEN = ["ksiazeczka", "kwiat_rozkwit", "piskle"], gdzie = pomieszane(3), dzien = [];
        for (const [i, n] of DZIEN.entries()) dzien.push(await c.object(n, { x: bl.x + (gdzie[i] - 1) * 2.2, y: bl.y + 0.75, size: 1.5 }));
        await c.say("zajac", "line.d_opowiem", { anim: "Zgloszenie" });
        for (const [i, karta] of dzien.entries()) {
          await c.ujecie("ogolny");                                          // every picture in the shot for the pick
          dobre(karta); await c.task({ targets: dzien, correct: karta, wrong: "line.d_dzien_nie" }); dobre(karta, false);
          await c.ujecie("sredni", { na: ["zajac", karta] });               // he tells that part
          await c.say("zajac", `line.d_dzien_${i + 1}`, { anim: i === 2 ? "Radosc" : "Mowienie" });
        }
        await c.ujecie("sredni", { na: ["sowa", ...dzien] });                // the home task, the pictures just told in the shot
        await c.say("sowa", "line.d_rodzice", { anim: "Zgloszenie" });
      },
    ],
  },
};
