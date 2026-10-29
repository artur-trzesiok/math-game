// Lesson: numbers 1 to 5 - count to five, every thing once; the digits 4 and 5 (1-3 are known); a number says how many
// to give, not only how many there are; five spread out is still five. Mole's little forest train: a ticket costs as
// many coins as its number, passengers board the wagon of their ticket (the late snail helped to his), the ride through
// the forest is a pan, Bear's five apples lie far apart ("mine are more!"), over the bridge to the lakeside stop, five
// passengers hop off, the hungry duck is fed. At home the picnic is packed: Bear's long row again, a picture chart shows
// five and five, five things into the backpack, the picnic seen. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const PASAZEROWIE = ["mysz", "zajac", "jez", "kaczatko_stoi", "slimak"];
const LOKOMOTYWA = "/game/assets/kropki/lokomotywa_piec/obraz.webp";                     // the engine joined from dots
const POZ = { kret: -4.9, sowa: -3.0, mis: 4.6 };
const naMiejsca = (c, poz = POZ) => { for (const [n, x] of Object.entries(poz)) c.stage.puppets[n].korzen.position.x = x; };

// digit cards in a row: a paper card (the target) with the digit drawn on it
async function karty(c, liczby, { y = -2.0, xs = [-0.9, 0.9, 2.7] } = {}) {
  const out = [];
  for (const [i, n] of tasuj(liczby).entries()) {
    const k = await c.object("karta_cyfry", { obraz: "/game/assets/menu/karta.webp", x: xs[i], y, size: 1.5 });
    k.cyfra = await c.digit(n, { x: xs[i], y: y + 0.05, size: 0.95, duration: 0.2 });
    k.liczba = n; out.push(k);
  }
  return out;
}
// the train: five wagons numbered 1-5 over the characters' heads
async function wagony(c, { y = 1.75, krok = 1.9, size = 1.9 } = {}) {
  const w = [];
  for (let i = 0; i < 5; i++) {
    const x = -3.8 + i * krok, h = await c.object("wagon", { x, y, size, cicho: i > 0 });
    await c.digit(i + 1, { x, y: y - 0.1, size: 0.6, duration: 0.15 });
    h.liczba = i + 1; w.push(h);
  }
  return w;
}
// a passenger hops into its wagon (small, behind the wagon's side)
async function doWagonu(c, p, ok) {
  p.mesh.position.z = ok.mesh.position.z - 0.02; p.mesh.scale.setScalar(0.6); p.base = 0.6;
  await p.moveTo(ok.mesh.position.x, ok.mesh.position.y + 0.5, 0.5); c.sfx("hop");
}
// a passenger with a ticket: the child points to the wagon of the ticket's number
async function wsiadanie(c, w, kto, n, linia, { size = 1.5 } = {}) {
  const p = await c.object(kto, { x: 0.2, y: -1.4, size });
  const bilet = await c.object("bilet", { x: 2.1, y: -1.35, size: 1.7 });
  const cyfra = await c.digit(n, { x: 2.1, y: -1.35, size: 0.75, duration: 0.25 });
  await c.say("kret", linia);
  const ok = w[n - 1];
  dobre(ok); await c.task({ targets: w, correct: ok, wrong: "line.zly_wagon" }); dobre(ok, false);
  bilet.remove(); cyfra.remove();
  await doWagonu(c, p, ok);
  return p;
}
// pack exactly `ile` things into the backpack by dragging; one more jumps back
function spakuj(c, rzeczy, plecak, ile, zaDuzo) {
  const S = c.stage; let dane = 0;
  const [px, py] = [plecak.mesh.position.x, plecak.mesh.position.y];
  return new Promise((ok) => S.free({
    items: rzeczy.slice(), rozdaj: { wolni: () => (dane < ile ? [{ who: "plecak" }] : []), pozycja: () => [px, py] },
    onDrop: async (h, p) => {
      if (Math.hypot(p.x - px, p.y - py) > 1.4) { await h.moveTo(h.home.x, h.home.y, 0.35); return; }
      if (dane >= ile) { c.sfx("wrong"); await h.moveTo(h.home.x, h.home.y, 0.35); await c.say("kret", zaDuzo); return; }
      dane++; c.sfx("plop"); h.mesh.position.z = plecak.mesh.position.z - 0.02; await h.moveTo(px - 0.5 + (dane % 3) * 0.5, py + 0.55, 0.25);
      await c.say("kret", `line.n${dane}`);
      if (dane === ile) { await c.wait(0.4); S.endSort(); ok(); }
    },
    onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
  }));
}

// the ride: the joined engine and five wagons with their passengers on the painted track
const TOR_Y = 1.45;                                                          // the painted rails
async function pociag(c) {
  const czesci = [], x0 = 3.6, krok = 1.35;
  czesci.push(await c.object("lokomotywa", { obraz: LOKOMOTYWA, x: x0, y: TOR_Y + 0.25, size: 1.8, cicho: true }));
  for (let i = 0; i < 5; i++) {
    const x = x0 - 1.55 - i * krok;
    const p = await c.object(PASAZEROWIE[4 - i], { x, y: TOR_Y + 0.5, size: 0.65, cicho: true });
    p.mesh.position.z -= 0.02;
    czesci.push(p, await c.object("wagon", { x, y: TOR_Y, size: 1.3, cicho: true }));
  }
  return czesci;
}
async function jazda(c, czesci, k, d) {
  const S = c.stage, y0 = czesci.map((h) => h.mesh.position.y);
  await Promise.all([c.pan(k, { d }), S.tween(c.fast ? 0.1 : d, (s) => czesci.forEach((h, i) => { h.mesh.position.y = y0[i] + Math.abs(Math.sin(s * 34 + i * 0.7)) * 0.04; }))]);
}

export default {
  id: "numbers_1_5",
  przejscia: true,
  nagrody: true,
  characters: { kret: { side: "left", x: -4.9 }, sowa: { side: "left", x: -3.0 }, mis: { side: "right", x: 4.6 } },
  backgrounds: { story: "stacyjka", practice: { kolor: "#e4eefa", motyw: "cyfry" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the station: Mole's train goes to the lake; a ticket costs its number in coins; the digits 1-5 on an insert
      // (4 and 5 new); Bear pays four coins and writes the 4 on his ticket
      async (c) => {
        await c.enter("kret");
        await c.ujecie("sredni", { na: ["kret"] });
        await c.say("kret", "line.a_pociag", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the friends come running
        await Promise.all([c.enter("mis", "right"), c.enter("sowa")]);
        await c.ujecie("dwuujecie", { na: ["kret", "mis"] });                // Bear asks, Mole answers
        await c.say("mis", "line.a_chce", { anim: "Podskok" });
        await c.say("kret", "line.a_bilet", { anim: "Zgloszenie" });
        await c.say("kret", "line.a_cztery");
        // the method on a plain colour: the known 1, 2, 3, then the new 4 and 5
        await c.go({ kolor: "#fdf0d5", motyw: "cyfry" }, { ciecie: true });
        naMiejsca(c);
        await c.ujecie("ogolny");
        for (const [i, n] of [1, 2, 3].entries()) await c.digit(n, { x: -3.2 + i * 1.2, y: 1.3, size: 1.1 });
        await c.say("kret", "line.a_znasz");
        const d4 = await c.digit(4, { x: 0.4, y: 1.2, size: 1.6 });
        await c.ujecie("sredni", { na: ["kret", d4] });                      // the new digit, Mole beside it
        await c.say("kret", "line.a_to_cztery", { anim: "Wskazanie" });
        const d5 = await c.digit(5, { x: 2.1, y: 1.2, size: 1.6 });
        await c.ujecie("ogolny", { na: ["kret", d4, d5] });                  // the five beside the four: all the digits in view
        await c.say("kret", "line.a_to_piec", { anim: "Radosc" });
        c.clear();
        // back at the station: Bear pays for his ticket
        await c.go("stacyjka", { ciecie: true });
        naMiejsca(c);
        await c.ujecie("ogolny");
        await c.say("sowa", "line.a_zaplac");
        const s = await c.sklepik({ towar: "bilet", cena: 4, pokaz: "cyfra", x: 0.8, onZaDuzo: () => c.say("kret", "line.a_za_duzo") });
        await c.ujecie("sredni", { na: ["kret"] });
        await c.say("kret", "line.a_cztery_monety", { anim: "Kiwanie" });
        s.remove();
        await c.ujecie("ogolny");                                            // the ticket comes in big: the task
        await c.object("bilet", { x: 0.8, y: 0.4, size: 4.4 });
        await c.say("kret", "line.a_napisz");
        const t = await c.slad(4, { x: 0.8, y: 0.4, size: 2.4 });
        await c.ujecie("zblizenie", { na: "mis" });                          // his joy
        await c.say("mis", "line.a_moj_bilet", { anim: "Radosc" });
        t.remove(); c.clear();
      },
      // B. the passengers board the wagon of their ticket's number; the late snail is helped to his; off we go
      async (c) => {
        await c.ujecie("ogolny");
        const w = await wagony(c);
        await c.say("kret", "line.b_wagony", { anim: "Zgloszenie" });
        let p = await wsiadanie(c, w, PASAZEROWIE[0], 2, "line.b_bilet2");
        await c.ujecie("sredni", { na: [p, w[1]] });                         // the passenger in the wagon of the ticket
        await c.say("kret", "line.b_wsiada2");
        await c.ujecie("ogolny");
        p = await wsiadanie(c, w, PASAZEROWIE[1], 5, "line.b_bilet5");
        await c.ujecie("sredni", { na: [p, w[4]] });
        await c.say("kret", "line.b_wsiada5");
        // Hedgehog knows his three
        await c.ujecie("ogolny");
        const jez = await c.object(PASAZEROWIE[2], { x: 0.2, y: -1.4, size: 1.4 });
        await c.say("kret", "line.b_bilet3");
        await doWagonu(c, jez, w[2]);
        // the two late ones run up; the duckling knows its one, the snail needs help with his four
        const kacz = await c.object(PASAZEROWIE[3], { x: 6.5, y: -1.5, size: 1.2 });
        const slim = await c.object(PASAZEROWIE[4], { x: 7.5, y: -1.5, size: 2.0 });
        await Promise.all([kacz.moveTo(-0.9, -1.5, 0.6), slim.moveTo(0.6, -1.5, 0.9)]);
        await c.say("kret", "line.b_spoznieni", { anim: "Zgloszenie" });
        await c.say("kret", "line.b_bilety_wczoraj");
        await doWagonu(c, kacz, w[0]);
        const bilet = await c.object("bilet", { x: 2.2, y: -1.35, size: 1.5 });
        const cyfra = await c.digit(4, { x: 2.2, y: -1.35, size: 0.7, duration: 0.25 });
        await c.ujecie("sredni", { na: [slim, bilet] });                     // the lost little one and his ticket
        c.stage.shake(slim);
        await c.ujecie("ogolny");                                            // the wagons: the task
        await c.say("kret", "line.b_slimak");
        dobre(w[3]); await c.task({ targets: w, correct: w[3], wrong: "line.zly_wagon" }); dobre(w[3], false);
        bilet.remove(); cyfra.remove();
        await doWagonu(c, slim, w[3]);
        await c.ujecie("sredni", { na: ["kret", w[3]] });
        await c.say("kret", "line.b_wsiada4", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "kret" });                         // the conductor's call
        await c.say("kret", "line.b_odjazd", { anim: "Machanie" });
        c.sfx("dzwonek"); c.clear();
      },
      // C. the ride through the forest (the pan is the ride) to the forest stop: Bear's five apples far apart, Owl's five
      // pears close - "mine are more!"; counted, five and five; back on the train, over the high bridge (seen)
      async (c) => {
        await c.go("kolej_lesna", { enter: true });                          // everyone is on the train
        await c.ujecie("ogolny");
        const tren = await pociag(c);
        c.sfx("dzwonek");
        await jazda(c, tren, 1, 3.4);
        await jazda(c, tren, 2, 3.4);
        // the forest stop: everyone gets off, the train waits further on
        await Promise.all(["kret", "mis", "sowa"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await Promise.all(tren.map((h) => h.moveTo(h.mesh.position.x + 9, h.mesh.position.y, c.fast ? 0.2 : 1.6)));
        tren.forEach((h) => h.remove());
        await c.say("sowa", "line.c_jablka", { anim: "Zgloszenie" });
        const misia = [], sowy = [];
        for (let i = 0; i < 5; i++) misia.push(await c.object("jablko", { x: -3.6 + i * 1.8, y: 1.95, size: 1.0 }));
        for (let i = 0; i < 5; i++) sowy.push(await c.object("gruszka", { x: -0.9 + i * 0.95, y: -0.6, size: 0.8 }));
        await c.ujecie("zblizenie", { na: "mis" });                          // proud of his long row
        await c.say("mis", "line.c_wiecej", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sowa" });                         // her doubt
        await c.wonder("sowa");
        await c.say("sowa", "line.c_policz");
        await c.ujecie("ogolny");
        await c.count(misia, { who: "sowa" });
        await c.ujecie("zblizenie", { na: "mis" });                          // his surprise
        await c.emocja("mis", "wykrzyknik");
        await c.say("mis", "line.c_tylko_piec");
        await c.ujecie("ogolny");                                            // the pears: the next count
        await c.say("sowa", "line.c_piec_misia");
        await c.count(sowy, { who: "sowa" });
        await c.ujecie("sredni", { na: ["sowa", ...sowy] });
        await c.say("sowa", "line.c_tyle_samo", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "mis" });                          // he gets it
        await c.emocja("mis", "zarowka", { anim: "Kiwanie" });
        await c.say("mis", "line.c_rozumiem");
        await c.ujecie("ogolny");
        c.clear();
        await c.say("kret", "line.c_wsiadamy", { anim: "Machanie" });
        c.sfx("dzwonek");
        // the journey on, seen: the train over the high bridge
        const il = await c.ilustracja("pociag_most", { ruch: "w_lewo" });
        await c.say("sowa", "line.c_most");
        await c.say("mis", "line.c_most2");
        await il.zsun();
      },
      // D. the lakeside stop (the end of the journey): five passengers hop off - counted; the hungry duck is fed (the
      // breather); tomorrow a picnic here
      async (c) => {
        const S = c.stage;
        await c.go("stacja_jezioro", { enter: true });
        await Promise.all(["kret", "mis", "sowa"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.d_jezioro", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await c.play("sowa", "Rozgladanie");
        await c.say("sowa", "line.d_stacja", { anim: "Zgloszenie" });   // the wide shot: the lake, the pier and the train in view
        await c.say("kret", "line.d_wysiadaja");
        // one after another out of the train at the back (small: far away), each hops onto the grass between Owl and Bear
        const p = [];
        for (const [i, n] of PASAZEROWIE.entries()) {
          const h = await c.object(n, { x: -4.3, y: 0.4, size: 0.5, cicho: true }), s0 = h.base, s1 = s0 * 2.6;
          c.sfx("hop");
          await Promise.all([h.moveTo(-1.1 + i * 1.0, -1.0 - (i % 2) * 0.95, 0.45), S.tween(0.45, (q) => h.mesh.scale.setScalar(s0 + (s1 - s0) * q))]);
          h.base = s1; p.push(h);
        }
        await c.say("mis", "line.d_ilu");
        await c.count(p, { who: "mis" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.d_pieciu", { anim: "Brawo" });
        // the breather: a hungry duck on the lake
        c.clear();
        const KACZKA = { x: 0.6, y: 0.3, size: 1.2 };
        const kaczka = await c.object("kaczka_mama", KACZKA);
        await c.ujecie("sredni", { na: ["kret", kaczka] });
        await c.say("kret", "line.d_kaczki", { anim: "Wskazanie" });
        await c.ujecie("ogolny");                                            // the bread over the heads, the duck on the water
        await c.say("sowa", "line.d_karm");
        kaczka.remove();                                                     // the game's own duck takes its place
        await c.karmienie({ zwierze: "kaczka_mama", jedzenie: ["bulka", "bulka", "bulka"], fuj: ["szyszka"], kto: "sowa", ...KACZKA });
        await c.ujecie("dwuujecie", { na: ["kret", "sowa"] });
        await c.say("kret", "line.d_najedzona", { anim: "Radosc" });
        await c.say("kret", "line.d_jutro");
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.d_piknik", { anim: "Podskok" });
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("kret"); c.show("sowa");
        S.puppets.kret.korzen.position.x = -5.2; S.puppets.sowa.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                  // show() pops the puppet in
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        // 1. how many? point to the digit
        {
          await c.ujecie("ogolny");
          const ile = 4 + Math.floor(Math.random() * 2), co = tasuj(["szyszka", "zoledz", "grzyb"])[0];
          const rz = []; for (let i = 0; i < ile; i++) rz.push(await c.object(co, { x: -2.4 + i * 1.2, y: 1.5, size: 1.1 }));
          const k = await karty(c, [3, 4, 5]);
          await c.say("kret", "line.p_ile");
          const ok = k.find((q) => q.liczba === ile);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_ile_nie" });
          await c.ujecie("sredni", { na: [...rz, ok] });                     // the things and their digit
          await c.say("sowa", `line.p_ile${ile}`, { anim: "Brawo" }); gw.dodaj(); c.clear();
        }
        // 2. a ticket for five coins
        {
          await c.ujecie("ogolny");
          await c.say("kret", "line.p_bilet5");
          await c.sklepik({ towar: "bilet", cena: 5, pokaz: "cyfra", onZaDuzo: () => c.say("kret", "line.a_za_duzo") });
          await c.ujecie("sredni", { na: ["sowa"] });
          await c.say("sowa", "line.p_bilet_ok", { anim: "Brawo" }); gw.dodaj(); c.clear();
        }
        // 3. write the 5
        {
          await c.ujecie("ogolny");
          await c.say("sowa", "line.p_napisz5"); const t = await c.slad(5, { x: 0, y: 0.4, size: 2.8 });
          await c.ujecie("sredni", { na: ["kret"] });
          await c.say("kret", "line.p_piatka_ok", { anim: "Radosc" }); gw.dodaj(); t.remove(); c.clear();
        }
        // 4. join the dots 1 to 5: Mole's engine
        {
          await c.ujecie("ogolny");
          await c.say("sowa", "line.p_kropki", { anim: "Zgloszenie" });
          const k = await c.kropki("lokomotywa_piec", { znaki: "cyfry", wrong: "line.p_kropki" });
          await c.ujecie("zblizenie", { na: "kret" });                        // his delight
          await c.say("kret", "line.p_lokomotywa", { anim: "Radosc" }); gw.dodaj();
          await k.remove();
        }
        // 5. Mole hops along the stones - which stone is four?
        {
          await c.ujecie("ogolny");
          const os = await c.os({ od: 0, do: 5, x0: -3.4, x1: 3.4, y: -1.2, size: 0.9 });
          await c.say("kret", "line.p_kamienie");
          const ok = os.kamien(4);
          dobre(ok); await c.task({ targets: os.kamienie.filter((k) => k.liczba > 0), correct: ok, wrong: "line.p_kamienie_nie" });
          S.puppets.kret.korzen.position.x = os.pole(0)[0];
          await os.skocz("kret", 0, 4);
          await c.ujecie("zblizenie", { na: "kret" });
          await c.say("kret", "line.p_doskoczylem", { anim: "Radosc" });
          gw.dodaj(); c.clear(); S.puppets.kret.korzen.position.x = -5.2;
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // home - the third act: packing for tomorrow's picnic at the lake. Bear's apples in a long row - "I have more!" -
      // again; on an insert a picture chart: five and five; the digit of the column; five things from the sill into the
      // backpack; five fingers to wave to the ducks; the picnic, seen; five claps for the parents
      async (c) => {
        for (const n of ["kret", "mis", "sowa"]) c.show(n);
        naMiejsca(c);
        await c.wait(0.4);                                                  // show() pops the puppet in
        await c.ujecie("ogolny");                                            // the room, all three
        await c.say("kret", "line.h_jutro", { anim: "Radosc" });
        // the method on a plain colour: Bear's long row against Owl's short one, then the chart
        await c.go({ kolor: "#e9f3df", motyw: "kola" }, { ciecie: true });
        naMiejsca(c);
        await c.ujecie("ogolny");
        const jab = [], kan = [];
        for (let i = 0; i < 5; i++) { const h = await c.object("jablko", { x: -4.2 + i * 2.1, y: 2.7, size: 0.75 }); h.rodzaj = "jablko"; jab.push(h); }
        for (let i = 0; i < 5; i++) { const h = await c.object("kanapka_1", { x: -0.6 + i * 0.55, y: 1.95, size: 0.7 }); h.rodzaj = "kanapka_1"; kan.push(h); }
        await c.say("mis", "line.h_jedzenie", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "mis" });                          // proud again
        await c.say("mis", "line.h_wiecej", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sowa" });                         // her surprise
        await c.emocja("sowa", "wykrzyknik");
        await c.say("sowa", "line.h_znowu");
        await c.ujecie("ogolny");                                            // the chart comes in: the task
        await c.say("sowa", "line.h_wykres");
        const w = await c.wykres({ rodzaje: ["jablko", "kanapka_1"], rzeczy: [...jab, ...kan], wiersze: 5, wrong: "line.h_wykres_nie" });
        await c.ujecie("sredni", { na: ["sowa", ...jab, ...kan] });          // two columns of one height
        await c.say("sowa", "line.h_rowne", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the cards come in over the chart
        const k = await karty(c, [3, 4, 5], { y: 2.45, xs: [-2.2, 2.2, 3.9] });
        await c.say("sowa", "line.h_ile_kolumna");
        const ok = k.find((q) => q.liczba === 5);
        dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.h_ile_kolumna_nie" }); dobre(ok, false);
        await c.ujecie("zblizenie", { na: "mis" });                          // he gets it
        await c.emocja("mis", "zarowka", { anim: "Kiwanie" });
        await c.say("mis", "line.h_piec_i_piec");
        w?.remove?.(); c.clear();
        // back in the room: five things from the windowsill into the backpack on the rug
        await c.go("pokoj", { ciecie: true });
        naMiejsca(c);
        const m = await c.miejsca(), par = m.parapet, dyw = m.dywan;
        await c.ujecie("ogolny");
        const plecak = await c.object("plecak", { x: dyw.x + 0.4, y: dyw.y + 0.3, size: 2.0 });
        const rzeczy = [], nazwy = ["jablko", "kanapka_1", "czapka", "pilka", "ksiazeczka", "skarpetka", "kubek"];
        const krok = Math.min(1.0, par.w / nazwy.length);
        for (const [i, n] of tasuj(nazwy).entries()) rzeczy.push(await c.object(n, { x: par.x + (i - 3) * krok, y: par.y + 0.38, size: 0.8 }));
        await c.say("kret", "line.h_spakuj");
        await spakuj(c, rzeczy, plecak, 5, "line.h_za_duzo");
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.h_spakowane", { anim: "Radosc" });
        c.clear();
        // a five on the backpack's tag
        await c.ujecie("ogolny");
        await c.object("plecak", { x: 2.7, y: -1.7, size: 1.5 });
        await c.object("metka", { x: 0, y: 0.5, size: 3.6 });
        await c.say("kret", "line.h_metka");
        const tm = await c.slad(5, { x: 0, y: 0.5, size: 2.2 });
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.h_metka_ok", { anim: "Brawo" });
        tm.remove(); c.clear();
        // five fingers to wave to the ducks
        await c.ujecie("ogolny");
        const reka = await c.object("gest_papier", { x: 0, y: 1.3, size: 2.6 });
        const kp = await karty(c, [3, 4, 5], { xs: [-0.6, 1.0, 2.6] });
        await c.say("mis", "line.h_palce");
        const okp = kp.find((q) => q.liczba === 5);
        dobre(okp); await c.task({ targets: kp, correct: okp, wrong: "line.h_palce_nie" });
        await c.ujecie("sredni", { na: [reka, okp] });                       // the hand and its five
        await c.say("kret", "line.h_piec_palcow");
        c.clear();
        // the payoff, seen: the picnic by the lake the next day
        const il = await c.ilustracja("piknik_nad_jeziorem", { ruch: "najazd" });
        await c.say("sowa", "line.h_piknik");
        await c.say("mis", "line.h_piknik2");
        await il.zsun();
        // the home game, played: five claps, counted out loud together
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.h_klaszczemy", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // everyone claps
        for (let n = 1; n <= 5; n++) {
          for (const who of ["kret", "sowa", "mis"]) c.ruch(who, "klask");
          await c.say("mis", `line.n${n}`);
        }
        await c.ujecie("sredni", { na: ["mis"] });                           // the home task, said to the parents
        await c.say("mis", "line.h_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
