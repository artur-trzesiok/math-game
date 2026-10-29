// Lesson: morning and night - the parts of the day in order (morning, midday, evening, night) and what we do in each.
// Mole, who lives underground and sees badly, thinks it is always night; Deer and Squirrel take him up for one long day:
// the morning (breakfast), the day passing (the cards put in order), a lost little hedgehog found with a lantern at
// dusk and led home through the forest paths before the night (a maze), fireflies by his oak at night.
// At home: the evening routine in order. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const PORY = ["pora_rano", "pora_poludnie", "pora_wieczor", "pora_noc"];
const DRZWI = [-5.35, 0.0];                       // the little hedgehog's door under the oak in the dab_noc plate

// cards to put in order into a row of places (the first marked by an arrow); never already lying in order
async function wKolejce(c, nazwy, { y = 1.5, yK = -2.2, krok = 2.0, size = 1.8, wrong = "line.zla_kolejnosc" } = {}) {
  const n = nazwy.length, x0 = -((n - 1) * krok) / 2;
  let m = tasuj(nazwy.map((_, i) => i)); while (m.every((v, i) => v === i)) m = tasuj(m);
  const items = [];
  for (const [i, nazwa] of nazwy.entries()) { const h = await c.object(nazwa, { x: x0 + m[i] * krok, y: yK, size }); h.ranga = i; items.push(h); }
  const t = await c.slots({ items, slots: nazwy.map((_, k) => ({ x: x0 + k * krok, y, w: krok * 0.92, h: size * 1.05, accept: (it) => it.ranga === k })), wrong });
  const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
  await t.done(); strzalka.remove();
  return t;
}

export default {
  id: "morning_night",
  przejscia: true,
  nagrody: true,
  characters: { kret: { side: "left", x: -4.6 }, sarenka: { side: "right", x: 4.8 }, wiewiorka: { side: "right", x: 2.7 } },
  backgrounds: { story: "nora", practice: { kolor: "#dfe8f7", motyw: "chmurki" }, apply: "pokoj_noc" },
  stages: {
    story: [
      // A. the burrow: Mole wakes in the dark - is it morning? underground it's always night; the friends take him up
      async (c) => {
        await c.noc({ ciemnosc: 0.55, d: 0.1 });
        c.swiatlo([-3.6, -1.6], { r: 2.2, moc: 0.8, migotanie: 0.05 });
        c.show("kret");
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("zblizenie", { na: "kret" });
        await c.emocja("kret", "sen");
        await c.say("kret", "line.a_ziew", { anim: "Kiwanie" });
        await c.wonder("kret");
        await c.say("kret", "line.a_ciemno");
        await c.ujecie("ogolny");
        await Promise.all([c.enter("wiewiorka", "right"), c.enter("sarenka", "right")]);
        await c.ujecie("dwuujecie", { na: ["kret", "wiewiorka"] });
        await c.say("wiewiorka", "line.a_dzien_dobry", { anim: "Machanie" });
        await c.say("kret", "line.a_noc");
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.a_na_gore", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        c.clear();
      },
      // B. the meadow: the sun rises; what we do in the morning; the day passes - the four cards in order
      async (c) => {
        await c.go("laka", { enter: true });
        await c.noc({ ciemnosc: 0.5, d: 0.1 });
        await Promise.all(["kret", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        await c.noc({ ciemnosc: 0, d: 2.5 });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.emocja("kret", "wykrzyknik", { anim: "Radosc" });
        await c.say("kret", "line.b_jasno");
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.b_rano");
        await c.ujecie("ogolny");
        const rzeczy = [];
        for (const [i, n] of tasuj(["sniadanie", "lozeczko", "pizama"]).entries()) rzeczy.push(await c.object(n, { x: -2.0 + i * 2.0, y: 1.4, size: 1.5 }));
        await c.say("wiewiorka", "line.b_co_rano");
        const sn = rzeczy.find((h) => h.name === "sniadanie");
        dobre(sn); await c.task({ targets: rzeczy, correct: sn, wrong: "line.b_co_rano_nie" }); dobre(sn, false);
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.b_sniadanie", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
        // the whole day on four cards
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.b_caly_dzien");
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.b_uloz");
        await wKolejce(c, PORY);
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.b_po_kolei", { anim: "Brawo" });
        await c.ujecie("ogolny");
        c.clear();
      },
      // C. dusk: a little hedgehog lost - lanterns light the bushes; the maze home; the oak at night: fireflies; Mole understands
      async (c) => {
        await c.noc({ ciemnosc: 0.6, d: 2.0 });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.c_wieczor");
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.say("sarenka", "line.c_zgubil", { anim: "Smutek" });
        await c.ujecie("ogolny");
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
        await c.ujecie("zblizenie", { na: "kret" });
        await c.emocja("kret", "pot");
        await c.say("kret", "line.c_zdazyc");
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.c_latarenka");
        await c.ujecie("ogolny");
        c.clear();
        await c.say("sarenka", "line.c_prowadz");
        const lab = await c.labirynt("las_o_zmierzchu", { pionek: "jez", cel: "drzwiczki" });
        await lab.remove();
        // the end of the story: the old oak at night, the little hedgehog's door
        await c.go("dab_noc", { enter: true });
        await c.noc({ ciemnosc: 0.3, d: 0.1 });
        await Promise.all(["kret", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
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
        await c.ujecie("ogolny");
        // night: catch the fireflies
        await c.noc({ ciemnosc: 0.5, d: 1.5 });
        await c.say("kret", "line.c_noc_swietliki");
        for (const [x, y] of tasuj([[-2.4, 1.3], [0.2, 2.0], [2.4, 0.9], [-0.8, 0.4], [1.4, 1.6]]).slice(0, 3)) {
          const s = await c.object("swietlik", { x, y, size: 0.9 }); const l = c.swiatlo(s, { r: 0.9, moc: 0.9 });
          dobre(s); await c.task({ targets: [s], correct: s, wrong: "line.c_noc_swietliki" });
          c.sfx("pop"); s.remove(); l?.remove?.();
        }
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.c_juz_wiem", { anim: "Zgloszenie" });
        await c.ujecie("dwuujecie", { na: ["kret", "wiewiorka"] });
        await c.say("wiewiorka", "line.c_dobranoc");
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("kret"); c.show("sarenka");
        S.puppets.kret.korzen.position.x = -5.2; S.puppets.sarenka.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.say("sarenka", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1. what comes next after morning, midday, evening?
        {
          const rz = []; for (const [i, n] of PORY.slice(0, 3).entries()) rz.push(await c.object(n, { x: -3.3 + i * 2.0, y: 1.5, size: 1.8 }));
          await c.zone({ x: 2.7, y: 1.5, w: 1.9, h: 1.9, name: "luka" });
          const op = []; for (const [i, n] of tasuj(["pora_noc", "pora_rano", "pora_poludnie"]).entries()) op.push(await c.object(n, { x: -2.1 + i * 2.1, y: -2.1, size: 1.7 }));
          await c.ujecie("sredni", { na: rz });
          await c.say("kret", "line.p_co_dalej");
          await c.ujecie("ogolny");
          const ok = op.find((h) => h.name === "pora_noc");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_co_dalej_nie" });
          await ok.moveTo(2.7, 1.5, 0.4);
          await c.ujecie("sredni", { na: [...rz, ok] });                  // the row complete
          await c.say("sarenka", "line.p_noc"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 2. what do we do at night?
        {
          const op = []; for (const [i, n] of tasuj(["lozeczko", "sniadanie", "szczoteczka"]).entries()) op.push(await c.object(n, { x: -2.2 + i * 2.2, y: 0.6, size: 1.9 }));
          await c.ujecie("sredni", { na: op });
          await c.say("sarenka", "line.p_w_nocy");
          await c.ujecie("ogolny");
          const ok = op.find((h) => h.name === "lozeczko");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_w_nocy_nie" });
          await c.ujecie("sredni", { na: [ok] });
          await c.say("kret", "line.p_spimy"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 3. three cards in order
        {
          await c.ujecie("sredni", { na: ["kret"] });
          await c.say("kret", "line.p_trzy");
          await c.ujecie("ogolny");
          await wKolejce(c, PORY.slice(0, 3));
          await c.ujecie("zblizenie", { na: "sarenka" });
          await c.say("sarenka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 4. memory: day cards in pairs
        {
          await c.ujecie("sredni", { na: ["sarenka"] });
          await c.say("sarenka", "line.p_memory");
          await c.ujecie("ogolny");
          await c.memory(PORY.map((n) => [{ obraz: n }, { obraz: n }]), { szer: 1.5 });
          await c.ujecie("zblizenie", { na: "kret" });
          await c.say("kret", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 5. after night comes ...?
        {
          const noc = await c.object("pora_noc", { x: -1.2, y: 1.5, size: 1.5 });
          await c.zone({ x: 1.2, y: 1.5, w: 1.6, h: 1.6, name: "luka" });
          const op = []; for (const [i, n] of tasuj(["pora_rano", "pora_wieczor"]).entries()) op.push(await c.object(n, { x: -1.0 + i * 2.2, y: -2.2, size: 1.3 }));
          await c.ujecie("sredni", { na: [noc] });
          await c.say("kret", "line.p_po_nocy");
          await c.ujecie("ogolny");
          const ok = op.find((h) => h.name === "pora_rano");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_po_nocy_nie" });
          await ok.moveTo(1.2, 1.5, 0.4);
          await c.ujecie("sredni", { na: [noc, ok] });
          await c.say("sarenka", "line.p_rano_znowu"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // home at night: the evening routine in order - bath, pyjamas, a story, bed
      async (c) => {
        for (const n of ["kret", "wiewiorka", "sarenka"]) c.show(n);
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.d_wieczor", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.d_uloz");
        await wKolejce(c, ["wanna", "pizama", "ksiazeczka", "lozeczko"], { size: 1.6, krok: 1.9 });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.d_dobranoc", { anim: "Kiwanie" });
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.d_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
