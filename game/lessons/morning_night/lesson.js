// Lesson: morning and night - the parts of the day in order (morning, midday, evening, night) and what we do in each.
// Mole, who lives underground and sees badly, thinks it is always night; his way out is plugged with earth - the child
// rubs it off and the morning shines in (the breather). Deer and Squirrel take him up for one long day: the sunrise
// (an event illustration), breakfast, the day's method on an insert, Squirrel's drawing of his day scattered by a gust
// (a story strip), a lost little hedgehog found with a lantern at dusk and led home through the forest paths (a maze),
// the Great Bear joined from the smallest star at his oak at night. At home - the sleepover: Mole's pyjamas in the bath,
// the evening in order on the rug, the book on the bedside table, the morning after (seen), the day told in play.
// Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const PORY = ["pora_rano", "pora_poludnie", "pora_wieczor", "pora_noc"];
const WIECZOR = ["wanna", "pizama", "ksiazeczka", "lozeczko"];
const DRZWI = [-5.35, 0.0];                       // the little hedgehog's door under the oak in the dab_noc plate

// cards to put in order into a row of places (the first marked by an arrow); never already lying in order
async function wKolejce(c, nazwy, { y = 1.5, yK = -2.2, x = 0, krok = 2.0, size = 1.8, wrong = "line.zla_kolejnosc", hMiejsca } = {}) {
  const n = nazwy.length, x0 = x - ((n - 1) * krok) / 2;
  let m = tasuj(nazwy.map((_, i) => i)); while (m.every((v, i) => v === i)) m = tasuj(m);
  const items = [];
  for (const [i, nazwa] of nazwy.entries()) { const h = await c.object(nazwa, { x: x0 + m[i] * krok, y: yK, size }); h.ranga = i; items.push(h); }
  const t = await c.slots({ items, slots: nazwy.map((_, k) => ({ x: x0 + k * krok, y, w: krok * 0.92, h: hMiejsca ?? size * 1.05, accept: (it) => it.ranga === k })), wrong });
  const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
  await t.done(); strzalka.remove();
  return items.slice().sort((a, b) => a.ranga - b.ranga);
}

export default {
  id: "morning_night",
  przejscia: true,
  nagrody: true,
  characters: { kret: { side: "left", x: -4.6 }, sarenka: { side: "right", x: 4.8 }, wiewiorka: { side: "right", x: 2.7 } },
  backgrounds: { story: "nora", practice: { kolor: "#dfe8f7", motyw: "chmurki" }, apply: "pokoj_noc" },
  stages: {
    story: [
      // A. the burrow: Mole wakes in the dark - underground it's always night; his way out is plugged with earth: the
      // child rubs it off (the breather) and the morning shines in, the rooster crows
      async (c) => {
        await c.noc({ ciemnosc: 0.55, d: 0.1 });
        c.swiatlo([-3.6, -1.6], { r: 2.2, moc: 0.8, migotanie: 0.05 });
        c.show("kret");
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("zblizenie", { na: "kret" });                         // sleepy, puzzled
        await c.emocja("kret", "sen");
        await c.say("kret", "line.a_ziew", { anim: "Kiwanie" });
        await c.wonder("kret");
        await c.say("kret", "line.a_ciemno");
        await c.ujecie("ogolny");                                            // the friends come down the tunnel
        await Promise.all([c.enter("wiewiorka", "right"), c.enter("sarenka", "right")]);
        await c.ujecie("dwuujecie", { na: ["kret", "wiewiorka"] });
        await c.say("wiewiorka", "line.a_dzien_dobry", { anim: "Machanie" });
        await c.say("kret", "line.a_noc");
        await c.ujecie("sredni", { na: ["kret", "sarenka"] });              // Deer explains, Mole and the dark way out in the shot
        await c.say("sarenka", "line.a_zasypane", { anim: "Wskazanie" });
        // the breather: rub the earth off the way out
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.a_odgarnij", { anim: "Zgloszenie" });
        const z = await c.zdrapka("wyjscie_z_nory");
        c.noc({ ciemnosc: 0.15, d: 1.5 });                                   // the light pours into the burrow
        await c.say("kret", "line.a_swiatlo", { anim: "Radosc" });
        await c.say("wiewiorka", "line.a_kto_pieje");
        const kogut = z.cele[1];
        dobre(kogut); await c.task({ targets: [...z.cele, z.tlo], correct: kogut, wrong: "line.a_kto_pieje_nie" }); dobre(kogut, false);
        await z.zaznacz(kogut); await c.rozblysk(kogut);
        const mowa = c.say("sarenka", "line.a_kogut", { anim: "Radosc" });
        await c.wait(c.fast ? 0.2 : 3.2); await z.zaznacz(z.cele[0]);        // "... and next to him the sun is rising"
        await mowa;
        await z.remove();
        await c.ujecie("zblizenie", { na: "kret" });                         // the surprise
        await c.emocja("kret", "wykrzyknik", { anim: "Podskok" });
        await c.say("kret", "line.a_noc_nie");
        await c.ujecie("dwuujecie", { na: ["kret", "sarenka"] });
        await c.say("sarenka", "line.a_na_gore", { anim: "Zgloszenie" });
        c.clear();
      },
      // B. the meadow: the sunrise (an event illustration); what we do in the morning; the day's method on an insert;
      // Squirrel's drawing of Mole's day, scattered by a gust - the story strip in order
      async (c) => {
        await c.go("laka", { enter: true });
        await c.noc({ ciemnosc: 0.5, d: 0.1 });
        await Promise.all(["kret", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        await c.noc({ ciemnosc: 0, d: 2.5 });
        const il = await c.ilustracja("wschod_slonca", { ruch: "najazd" });
        await c.say("kret", "line.b_jasno");
        await c.say("sarenka", "line.b_rano");
        await il.zsun();
        await c.ujecie("ogolny");                                            // the task: every option in the shot
        const rzeczy = [];
        for (const [i, n] of tasuj(["sniadanie", "lozeczko", "pizama"]).entries()) rzeczy.push(await c.object(n, { x: -2.0 + i * 2.0, y: 1.4, size: 1.5 }));
        await c.say("wiewiorka", "line.b_co_rano");
        const sn = rzeczy.find((h) => h.name === "sniadanie");
        dobre(sn); await c.task({ targets: rzeczy, correct: sn, wrong: "line.b_co_rano_nie" }); dobre(sn, false);
        await c.ujecie("zblizenie", { na: "kret" });                         // his delight
        await c.say("kret", "line.b_sniadanie", { anim: "Radosc" });
        // the method on a plain colour: the four cards of the day, one after another
        await c.go({ kolor: "#fbeed4", motyw: "chmurki" }, { ciecie: true });
        const karty = [];
        for (const [i, n] of PORY.entries()) karty.push(await c.object(n, { x: -2.85 + i * 1.9, y: 1.2, size: 1.6 }));
        await c.ujecie("sredni", { na: ["sarenka", ...karty] });
        const metoda = c.say("sarenka", "line.b_caly_dzien", { anim: "Wskazanie" });
        for (const k of karty) { await c.wait(c.fast ? 0.1 : 1.6); c.stage.bump(k, 0.35); }
        await metoda;
        // back on the meadow: Squirrel's drawing of the day - a gust mixes it up
        await c.go("laka", { ciecie: true });
        await c.ujecie("dwuujecie", { na: ["kret", "wiewiorka"] });
        await c.say("wiewiorka", "line.b_rysunek", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the gust crosses the whole picture
        c.czastki("liscie", { wiatr: 3, gestosc: 0.8 }); c.sfx("whoosh");
        await Promise.all([c.walkTo("wiewiorka", 4.4), c.walkTo("sarenka", 5.5), c.emocja("wiewiorka", "wykrzyknik", { anim: "Podskok" })]);
        await c.say("wiewiorka", "line.b_wiatr");
        c.czastki(null);
        await c.say("sarenka", "line.b_uloz");
        const h = await c.historyjka("dzien_kreta", { size: 1.5, wrong: "line.zla_kolejnosc" });     // smaller: three of us stand round the floor
        await c.ujecie("sredni", { na: ["wiewiorka", ...h.karty] });
        await c.say("wiewiorka", "line.b_po_kolei", { anim: "Brawo" });
        h.remove(); c.clear();
      },
      // C. dusk: a little hedgehog lost - lanterns light the bushes; the maze home before the night
      async (c) => {
        await c.noc({ ciemnosc: 0.6, d: 2.0 });
        await c.ujecie("dwuujecie", { na: ["kret", "sarenka"] });
        await c.say("kret", "line.c_wieczor");
        await c.say("sarenka", "line.c_zgubil", { anim: "Smutek" });
        await c.ujecie("ogolny");                                            // the bushes come in: the task is wide
        const krzaki = [], gdzie = Math.floor(Math.random() * 3);
        for (let i = 0; i < 3; i++) krzaki.push(await c.object("krzak", { x: -2.2 + i * 2.2, y: -1.2, size: 2.0, z: 0.5 }));
        const maly = await c.object("jez", { x: krzaki[gdzie].mesh.position.x, y: -1.5, size: 0.8, z: 0.3 }); maly.mesh.visible = false;
        await c.say("wiewiorka", "line.c_poswiec");
        dobre(krzaki[gdzie]);
        await c.task({ targets: krzaki, correct: krzaki[gdzie], wrong: "line.c_pusto", onWrong: async (h) => { c.swiatlo(h, { r: 1.4, moc: 0.9 }); await c.say("wiewiorka", "line.c_pusto"); } });
        c.swiatlo(krzaki[gdzie], { r: 1.6, moc: 1 });
        maly.mesh.visible = true; await maly.moveTo(maly.mesh.position.x, -2.4, 0.5);
        maly.mesh.position.z = 0.7; await maly.moveTo(0.2, -2.7, 0.5);       // out into the open, in front of the bushes
        await c.ujecie("sredni", { na: [krzaki[gdzie], maly] });
        await c.rozblysk(maly);
        await c.say("sarenka", "line.c_jest", { anim: "Radosc" });
        // his home is across the wood, and the night is coming: the way through the forest paths (a maze)
        await c.ujecie("sredni", { na: ["wiewiorka", maly] });
        await c.say("wiewiorka", "line.c_dom", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "kret" });                         // worried
        await c.emocja("kret", "pot");
        await c.say("kret", "line.c_zdazyc");
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.c_latarenka");
        c.clear();
        await c.ujecie("ogolny");                                            // the maze flies up over the wide scene
        await c.say("sarenka", "line.c_prowadz");
        const lab = await c.labirynt("las_o_zmierzchu", { pionek: "jez", cel: "drzwiczki" });
        await lab.remove();
        await c.ujecie("sredni", { na: ["kret", "sarenka"] });              // the way is found: on to the oak
        await c.say("sarenka", "line.c_sciezka_ok", { anim: "Radosc" });
      },
      // D. the end of the story: the old oak at night, the little hedgehog's door; the Great Bear joined from the smallest
      // star; Mole understands the day; the sleepover
      async (c) => {
        await c.go("dab_noc", { enter: true });
        await c.noc({ ciemnosc: 0.3, d: 0.1 });
        await Promise.all(["kret", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        c.czastki("swietliki", { gestosc: 0.5 });
        await c.walkTo("kret", -1.2);                                       // off the way to the little door under the roots
        const jezyk = await c.object("jez", { x: -7.5, y: -2.7, size: 0.8 });
        await jezyk.moveTo(-3.3, -2.7, 0.6);
        await c.say("sarenka", "line.c_dab", { anim: "Wskazanie" });
        // he goes home: along the grass to his door, smaller as it is further away, and in
        const s0 = jezyk.base;
        await Promise.all([jezyk.moveTo(DRZWI[0], DRZWI[1], 1.2), c.stage.tween(1.2, (s) => jezyk.mesh.scale.setScalar(s0 * (1 - 0.5 * s)))]);
        await c.stage.tween(0.4, (s) => jezyk.mesh.scale.setScalar(s0 * 0.5 * (1 - s)));
        jezyk.remove();
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("wiewiorka", "line.c_w_domu", { anim: "Machanie" });
        // night: Mole looks up at the stars for the first time
        c.noc({ ciemnosc: 0.5, d: 1.5 });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.emocja("kret", "serce", { anim: "Radosc" });
        await c.say("kret", "line.c_noc_swietliki");
        await c.ujecie("ogolny");                                            // the night card lies over the wide scene
        await c.say("sarenka", "line.c_gwiazdy");
        const k = await c.kropki("niedzwiedz_gwiazd", { znaki: "wielkosc" });
        await c.say("wiewiorka", "line.c_mis", { anim: "Radosc" });
        await k.remove();
        await c.ujecie("zblizenie", { na: "kret" });                         // he gets it
        await c.emocja("kret", "zarowka");
        await c.say("kret", "line.c_juz_wiem", { anim: "Zgloszenie" });
        await c.ujecie("sredni", { na: ["kret", "wiewiorka"] });            // the invitation (a two-shot would leave them stepped in for practice)
        await c.say("wiewiorka", "line.c_dobranoc", { anim: "Machanie" });
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("kret"); c.show("sarenka");
        S.puppets.kret.korzen.position.x = -5.2; S.puppets.sarenka.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("dwuujecie", { na: ["kret", "sarenka"] });
        await c.say("sarenka", "line.p_start", { anim: "Radosc" });
        // 1. what comes next after morning, midday, evening?
        {
          const rz = []; for (const [i, n] of PORY.slice(0, 3).entries()) rz.push(await c.object(n, { x: -3.3 + i * 2.0, y: 1.5, size: 1.8 }));
          await c.zone({ x: 2.7, y: 1.5, w: 1.9, h: 1.9, name: "luka" });
          const op = []; for (const [i, n] of tasuj(["pora_noc", "pora_rano", "pora_poludnie"]).entries()) op.push(await c.object(n, { x: -2.1 + i * 2.1, y: -2.1, size: 1.7 }));
          await c.ujecie("ogolny");                                          // the row and the options: the task
          await c.say("kret", "line.p_co_dalej");
          const ok = op.find((h) => h.name === "pora_noc");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_co_dalej_nie" });
          await ok.moveTo(2.7, 1.5, 0.4);
          await c.ujecie("sredni", { na: [...rz, ok] });                  // the row complete
          await c.say("sarenka", "line.p_noc"); gw.dodaj();
          c.clear();
        }
        // 2. what do we do at night?
        {
          const op = []; for (const [i, n] of tasuj(["lozeczko", "sniadanie", "szczoteczka"]).entries()) op.push(await c.object(n, { x: -2.2 + i * 2.2, y: 0.6, size: 1.9 }));
          await c.ujecie("ogolny");
          await c.say("sarenka", "line.p_w_nocy");
          const ok = op.find((h) => h.name === "lozeczko");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_w_nocy_nie" });
          await c.ujecie("sredni", { na: ["kret", ok] });
          await c.say("kret", "line.p_spimy"); gw.dodaj();
          c.clear();
        }
        // 3. three cards in order
        {
          await c.ujecie("ogolny");
          await c.say("kret", "line.p_trzy");
          const rz = await wKolejce(c, PORY.slice(0, 3));
          await c.ujecie("sredni", { na: ["sarenka", ...rz] });
          await c.say("sarenka", "line.p_trzy_ok", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        // 4. memory: day cards in pairs
        {
          await c.ujecie("ogolny");
          await c.say("sarenka", "line.p_memory");
          await c.memory(PORY.map((n) => [{ obraz: n }, { obraz: n }]), { szer: 1.5 });
          await c.ujecie("zblizenie", { na: "kret" });                       // his joy
          await c.say("kret", "line.p_memory_ok", { anim: "Brawo" }); gw.dodaj();
          c.clear();
        }
        // 5. after night comes ...?
        {
          const noc = await c.object("pora_noc", { x: -1.2, y: 1.5, size: 1.5 });
          await c.zone({ x: 1.2, y: 1.5, w: 1.6, h: 1.6, name: "luka" });
          const op = []; for (const [i, n] of tasuj(["pora_rano", "pora_wieczor"]).entries()) op.push(await c.object(n, { x: -1.0 + i * 2.2, y: -2.2, size: 1.3 }));
          await c.ujecie("ogolny");
          await c.say("kret", "line.p_po_nocy");
          const ok = op.find((h) => h.name === "pora_rano");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_po_nocy_nie" });
          await ok.moveTo(1.2, 1.5, 0.4);
          await c.ujecie("sredni", { na: ["sarenka", noc, ok] });
          await c.say("sarenka", "line.p_rano_znowu", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // home - the third act: Mole sleeps over at Squirrel's. "Evening - everything at once": pyjamas on and into the
      // bath; the method on an insert; the evening in order on the painted rug; the bedtime story, the book onto the
      // painted bedside table; goodnight; what comes after the night - the morning, seen; the day told in play
      async (c) => {
        const S = c.stage;
        for (const n of ["kret", "wiewiorka", "sarenka"]) c.show(n);
        const naBok = () => { S.puppets.wiewiorka.korzen.position.x = 3.8; S.puppets.sarenka.korzen.position.x = 5.3; };   // off the rug's row
        naBok();
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        let m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["kret", "wiewiorka"] });          // the thread: the sleepover
        await c.say("wiewiorka", "line.d_wieczor", { anim: "Radosc" });
        // Mole's "everything at once": the pyjamas on, then into the bath in them
        await c.ujecie("ogolny");                                            // the bath and the pyjamas come in, he hurries across
        const wanna = await c.object("wanna", { x: -1.6, y: -2.6, size: 1.6 }), pizama = await c.object("pizama", { x: -3.2, y: 0.9, size: 1.1 });
        await c.say("kret", "line.d_kret_pizama", { anim: "Podskok" });
        await c.take("kret", pizama);
        await c.walkTo("kret", -2.4);
        await c.play("kret", "Podskok"); c.sfx("plop");
        await c.put("kret", -1.4, -2.2);
        await c.ujecie("zblizenie", { na: "kret" });                         // wet, dismayed
        await c.emocja("kret", "mokro", { anim: "Smutek" });
        await c.say("kret", "line.d_mokro");
        wanna.remove(); pizama.remove();
        // the method on a plain colour: the bath first, then the pyjamas
        await c.go({ kolor: "#dbe9f6", motyw: "kola" }, { ciecie: true });
        S.puppets.kret.korzen.position.x = -4.6; naBok();
        const w1 = await c.object("wanna", { x: -1.3, y: 1.1, size: 1.8 }), p1 = await c.object("pizama", { x: 1.3, y: 1.1, size: 1.8 });
        await c.ujecie("sredni", { na: ["sarenka", w1, p1] });
        const mowa = c.say("sarenka", "line.d_najpierw", { anim: "Wskazanie" });
        await c.wait(c.fast ? 0.1 : 0.6); c.stage.bump(w1, 0.35);
        await c.wait(c.fast ? 0.1 : 1.6); c.stage.bump(p1, 0.35);
        await mowa;
        // back in the room: what comes first in the evening?
        await c.go("pokoj_noc", { ciecie: true });
        m = await c.miejsca();
        await c.ujecie("ogolny");
        const op = [];
        for (const [i, n] of tasuj(WIECZOR).entries()) op.push(await c.object(n, { x: -2.85 + i * 1.9, y: 1.3, size: 1.5 }));
        await c.say("sarenka", "line.d_co_najpierw");
        const w2 = op.find((h) => h.name === "wanna");
        dobre(w2); await c.task({ targets: op, correct: w2, wrong: "line.d_co_najpierw_nie" }); dobre(w2, false);
        await c.ujecie("sredni", { na: ["kret", w2] });
        await c.say("kret", "line.d_kapiel", { anim: "Radosc" });
        c.clear();
        // the whole evening in order on the painted rug
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.d_uloz");
        const dy = m.dywan, krok = 1.5, xR = -0.8;                       // the row on the rug, left of Squirrel
        const wieczor = await wKolejce(c, WIECZOR, { x: xR, y: dy.y + 0.35, yK: 1.3, krok, size: 1.25, hMiejsca: 1.2 });
        await c.ujecie("sredni", { na: ["wiewiorka", ...wieczor] });
        await c.say("wiewiorka", "line.d_wieczor_ok", { anim: "Brawo" });
        c.clear();
        // the bedtime story, and the book onto the painted bedside table by the lamp
        const ks = await c.object("ksiazeczka", { x: 1.2, y: -0.6, size: 1.0 });
        await c.take("wiewiorka", ks);
        await c.ujecie("dwuujecie", { na: ["kret", "wiewiorka"] });
        await c.say("wiewiorka", "line.d_bajka", { anim: "Kiwanie" });
        await c.put("wiewiorka", 0.4, -2.6);
        await c.ujecie("ogolny");                                            // the book and the table in one shot
        await c.say("sarenka", "line.d_ksiazka");
        const sz = m.szafka_nocna;
        const t = await c.slots({ items: [ks], slots: [sz.slot((h) => h === ks)], wrong: "line.d_ksiazka" });
        await t.done();
        await c.noc({ ciemnosc: 0.55, d: 1.2 });                             // the lamp goes off
        await c.ujecie("zblizenie", { na: "kret" });
        await c.emocja("kret", "sen", { anim: "Kiwanie" });
        await c.say("kret", "line.d_dobranoc");
        c.clear();
        // the night passes: what comes after it?
        await c.ujecie("ogolny");
        const op2 = [];
        for (const [i, n] of tasuj(["pora_rano", "pora_poludnie", "pora_wieczor"]).entries()) op2.push(await c.object(n, { x: -2.0 + i * 2.0, y: 1.3, size: 1.5 }));
        await c.say("wiewiorka", "line.d_po_nocy");
        const r2 = op2.find((h) => h.name === "pora_rano");
        dobre(r2); await c.task({ targets: op2, correct: r2, wrong: "line.d_po_nocy_nie" }); dobre(r2, false);
        c.clear();
        // the morning, seen: Mole wakes up with the sun
        await c.noc({ ciemnosc: 0, d: 1.2 });
        const il = await c.ilustracja("pobudka_rano", { ruch: "najazd" });
        await c.say("kret", "line.d_rano", { anim: "Radosc" });
        await c.say("sarenka", "line.d_rano_ok");
        await il.zsun();
        // the home game, played: the day's cards on the rug in the morning room, the child points, Mole tells
        await c.go("pokoj", { ciecie: true });
        m = await c.miejsca();
        await c.ujecie("ogolny");
        const d2 = m.dywan, dzien = [];
        for (const [i, n] of PORY.entries()) dzien.push(await c.object(n, { x: -0.8 + (i - 1.5) * 1.5, y: d2.y + 0.35, size: 1.25 }));
        await c.say("sarenka", "line.d_opowiedz");
        for (const [i, karta] of dzien.entries()) {
          await c.ujecie("ogolny");                                          // every card in the shot for the pick
          dobre(karta); await c.task({ targets: dzien, correct: karta, wrong: "line.d_opowiedz_nie" }); dobre(karta, false);
          await c.ujecie("sredni", { na: ["kret", karta] });                 // he talks about that one
          await c.say("kret", ["line.d_kret_rano", "line.d_kret_poludnie", "line.d_kret_wieczor", "line.d_kret_noc"][i], { anim: i === 3 ? "Radosc" : "Mowienie" });
        }
        await c.ujecie("sredni", { na: ["sarenka", ...dzien] });             // the home task, the cards just told in the shot
        await c.say("sarenka", "line.d_rodzice", { anim: "Zgloszenie" });
      },
    ],
  },
};
