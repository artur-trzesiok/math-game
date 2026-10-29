// Lesson: more, fewer - the night of the fireflies. Compare two amounts without counting - give one to each and see
// who is left without; as many when nobody is; a long row is not more; make two amounts as many by adding, taking away,
// moving one over. All four characters; the night falls (ctx.noc) and every light the child makes opens in the dark
// (ctx.swiatlo). Fox's long row of lanterns fools him; the lanterns lit by fireflies; Owl's map - the path with more
// fireflies leads to their dance (seen); hide-and-seek in the dark (the breather); the game of stumps to music. At home
// the sleepover: Fox is fooled by a long row again, the pillows paired, one moved over, laid out one each on the rug,
// the fireflies let home, everyone asleep (seen). Script in scenario.md.

const PANO = "polana_wieczorem";
const ROW_Y = 1.5;
const WSZYSCY = ["lisek", "wiewiorka", "sowa", "sarenka"];
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const naMiejsca = (c, poz) => { for (const [n, x] of Object.entries(poz)) { c.show(n); c.stage.puppets[n].korzen.position.x = x; } };

// where a receiver is: a character (the middle of its body) or a sticker
const pozycja = (c, o) => {
  if (o.who) { const L = c.stage.puppets[o.who], b = c.stage.bounds({ korzen: L.korzen, mesh: L.korzen }); return [b.x, b.y]; }
  return [o.h.mesh.position.x, o.h.mesh.position.y];
};
// give one to each: the child drags the lanterns into the friends' paws, one each; one dropped away goes back. Ends when
// the things run out or every receiver has one. `daj(o, h)` does the giving.
function rozdaj(c, rzeczy, odbiorcy, daj) {
  return new Promise((ok) => {
    const S = c.stage, wolni = () => odbiorcy.filter((o) => !o.ma), items = rzeczy.slice();
    S.free({
      items, rozdaj: { wolni, pozycja: (o) => pozycja(c, o) },
      onDrop: async (h, p) => {
        const najbl = wolni().map((o) => [o, Math.hypot(pozycja(c, o)[0] - p.x, pozycja(c, o)[1] - p.y)]).sort((a, b) => a[1] - b[1])[0];
        if (!najbl || najbl[1] > 2.4) { h.moveTo(h.home.x, h.home.y, 0.35); return; }
        najbl[0].ma = true; items.splice(items.indexOf(h), 1); c.sfx("pop");
        await daj(najbl[0], h);
        if (!items.length || !wolni().length) { S.endSort(); ok(); }
      },
      onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
    });
  });
}
// a pencil line from a to b (a pair)
const para = (c, [ax, ay], [bx, by]) => c.line([[ax, ay], [bx, by]], { color: "#ffd76a", duration: 0.35, width: 0.07 });

// a lantern: the empty jar and, hidden inside it, the lit one; zapal(c) lights it and opens the dark around it (c: the
// scene lighting it - a lantern made in one scene is lit in the next)
async function latarenka(c, x, y) {
  const h = await c.object("latarenka", { x, y, size: 0.75 });
  const lit = await c.object("latarenka_swieci", { x, y, size: 0.75 });
  c.stage.scene.remove(lit.mesh); lit.mesh.position.set(0, 0, 0.01); lit.mesh.scale.setScalar(1 / 0.75 * 0.75); lit.mesh.visible = false; h.mesh.add(lit.mesh);
  h.zapal = (cc) => { h.icon.visible = false; lit.mesh.visible = true; h.swiatlo = cc.swiatlo(h, { r: 1.8, migotanie: 0.15 }); h.zapalona = true; };
  return h;
}

export default {
  id: "more_fewer",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -5.0 }, wiewiorka: { side: "left", x: -2.6 }, sowa: { side: "right", x: 2.0 }, sarenka: { side: "right", x: 4.6 } },
  backgrounds: { story: PANO, practice: { kolor: "#22305a", motyw: "gwiazdki" }, apply: "pokoj_noc" },
  stages: {
    story: [
      // A. sunset at Owl's tree: the invitation; Squirrel is afraid of the dark; Fox brings lanterns laid out in a
      // long row - "enough for everyone!"; a long row is not more: give one to each - one friend is left without
      async (c) => {
        c.show("sowa");                                                          // the host waits at her home; the friends come
        await Promise.all(["lisek", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        await c.say("sowa", "line.a_zaproszenie", { anim: "Machanie" });         // wide: Owl's tree, the sunset, everyone
        await c.say("lisek", "line.a_hurra", { anim: "Podskok" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                         // her fear
        await c.emocja("wiewiorka", "strach", { anim: "Smutek" });
        await c.say("wiewiorka", "line.a_boje");
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });              // he comforts her
        await c.say("lisek", "line.a_latarenki", { anim: "Zgloszenie" });
        // Fox fetches them from the shed
        await c.ujecie("ogolny");
        await c.walkTo("lisek", -7.5);
        const lat = [];
        for (const x of [-4.8, -0.2, 4.4]) lat.push(await latarenka(c, x, ROW_Y));
        await c.walkTo("lisek", -5.0);
        await c.say("lisek", "line.a_dlugi", { anim: "Radosc" });
        // the trap, drawn plain: the friends close together, the lanterns in a long row
        await c.go({ kolor: "#f3d6a8", motyw: "kola" }, { ciecie: true });
        const twarze = [];
        for (const [i, n] of WSZYSCY.entries()) twarze.push(await c.object(`glowa_${n}`, { x: -1.65 + i * 1.1, y: 2.4, size: 1.0, obraz: c.glowy([n]) }));
        const rzad = [];
        for (const x of [-4.6, 0, 4.6]) rzad.push(await c.object("latarenka", { x, y: 0.95, size: 1.0 }));
        await c.say("lisek", "line.a_dlugi_rzad");
        await c.say("sarenka", "line.a_sprawdzmy", { anim: "Kiwanie" });
        c.clear();
        await c.go(PANO, { ciecie: true });
        for (const [i, x] of [-4.8, -0.2, 4.4].entries()) { lat[i] = await latarenka(c, x, ROW_Y); }
        // give one each
        const odbiorcy = WSZYSCY.map((who) => ({ who }));
        await c.say("sarenka", "line.a_rozdaj");
        await rozdaj(c, lat, odbiorcy, (o, h) => c.take(o.who, h, { d: 0.4 }));
        const bez = odbiorcy.find((o) => !o.ma).who;
        await c.ujecie("zblizenie", { na: bez });                                 // left without: sad
        await c.emocja(bez, "smutek", { anim: "Smutek" });
        await c.say(bez, "line.a_zabraklo");
        await c.ujecie("dwuujecie", { na: ["sarenka", "lisek"] });                // she explains, he sees his mistake
        await c.say("sarenka", "line.a_wiecej");
        await c.say("lisek", "line.a_oszukal", { anim: "Kiwanie" });
        // Fox runs for one more; the one left out gets it
        await c.ujecie("ogolny");
        await c.walkTo("lisek", -7.5);
        const czwarta = await latarenka(c, -6.5, ROW_Y);
        await c.walkTo("lisek", -5.0);
        await c.take(bez, czwarta);
        lat.push(czwarta);
        await c.emocja(bez, "serce", { anim: "Radosc" });
        await c.say("sowa", "line.a_tyle_samo");
        await c.say("wiewiorka", "line.a_chodzmy", { anim: "Podskok" });
        c.stage.lekcja = { latarenki: lat };
        await c.pan(1, { idz: WSZYSCY, d: 3.2 });
      },
      // B. the glade at night: the lanterns are empty jars; a tapped lantern calls a firefly in and lights up; all four
      // lit - more fireflies than lanterns; the free ones fly off to dance; Owl's map: the path with more fireflies leads
      // there; the dance, seen
      async (c) => {
        await c.noc({ ciemnosc: 0.74, d: 2 });
        const ks = await c.object("ksiezyc", { x: 4.6, y: 3.1, size: 1.0 }); c.swiatlo(ks, { r: 1.6, moc: 0.75, migotanie: 0 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                         // the dark scares her
        await c.emocja("wiewiorka", "strach", { anim: "Smutek" });
        await c.say("wiewiorka", "line.b_ciemno");
        await c.ujecie("sredni", { na: ["lisek"] });                              // Fox and his empty jar
        await c.say("lisek", "line.b_puste", { anim: "Rozgladanie" });
        // the fireflies drift over the glade
        await c.ujecie("ogolny");
        const roj = [];
        for (let i = 0; i < 6; i++) { const h = await c.object("swietlik", { x: -4 + i * 1.6, y: 1.8 + (i % 2) * 0.6, size: 0.5 }); h.swiatlo = c.swiatlo(h, { r: 0.7, moc: 0.85, migotanie: 0.3 }); h.faza = i * 1.3; roj.push(h); }
        let t = 0; const lot = setInterval(() => { t += 0.04; for (const h of roj) if (!h.wLatarence && !h.odlecial && h.mesh.parent) { h.mesh.position.x += Math.sin(t * 0.8 + h.faza) * 0.018; h.mesh.position.y += Math.cos(t * 1.1 + h.faza) * 0.012; } }, 40);
        await c.say("sowa", "line.b_swietliki", { anim: "Zgloszenie" });
        const lat = (c.stage.lekcja?.latarenki || []).filter((h) => h.mesh.parent);
        await c.say("sowa", "line.b_dotknij");
        for (let i = 0; i < lat.length; i++) {
          const ciemne = lat.filter((h) => !h.zapalona); dobre(ciemne);
          const h = await c.task({ targets: ciemne, correct: ciemne, wrong: "line.b_dotknij" });
          dobre(ciemne, false);
          const s = roj.find((f) => !f.wLatarence); s.wLatarence = true;
          const p = new (h.mesh.position.constructor)(); h.mesh.getWorldPosition(p);
          await s.moveTo(p.x, p.y, 0.45); s.swiatlo.zgas(0.2); s.remove();
          h.zapal(c); c.sfx("idea");
          if (i === 0) await c.say("wiewiorka", "line.b_swieci", { anim: "Radosc" });
        }
        await c.ujecie("zblizenie", { na: "wiewiorka" });                         // the light took her fear
        await c.emocja("wiewiorka", "radosc", { anim: "Radosc" });
        await c.say("wiewiorka", "line.b_jasno");
        const wolne = roj.filter((f) => !f.wLatarence);
        await c.ujecie("sredni", { na: ["sarenka", ...wolne] });                  // the fireflies still flying
        await c.say("sarenka", "line.b_zostaly", { anim: "Rozgladanie" });
        // which are more? a firefly card or a lantern card
        await c.ujecie("ogolny");
        const k1 = await c.object("swietlik", { x: -1.8, y: 0.4, size: 1.3 }), k2 = await c.object("latarenka_swieci", { x: 1.8, y: 0.4, size: 1.3 });
        await c.say("sarenka", "line.b_czego");
        dobre(k1); await c.task({ targets: tasuj([k1, k2]), correct: k1, wrong: "line.b_czego_nie" }); dobre(k1, false);
        await c.say("sowa", "line.b_wiecej_swietlikow", { anim: "Radosc" });
        k1.remove(); k2.remove();
        // the free ones fly away over the trees
        for (const [i, f] of wolne.entries()) { f.odlecial = true; f.moveTo(7.5, 3.0 - i * 0.4, 1.4); }
        await c.say("sowa", "line.b_odlatuja", { anim: "Wskazanie" });
        clearInterval(lot);
        // Owl's map: the way to the dance is the path with more fireflies
        await c.ujecie("dwuujecie", { na: ["sowa", "sarenka"] });
        await c.say("sowa", "line.b_mapa", { anim: "Zgloszenie" });
        await c.say("sarenka", "line.b_ktora");
        await c.ujecie("ogolny");                                                 // the map lies over the wide scene
        const w = await c.wedrowka("mapa_swietlikow", { pionek: "latarenka_swieci", dobra: 0, skad: "sowa", wrong: "line.b_ktora_nie" });
        await c.say("lisek", "line.b_tedy", { anim: "Podskok" });                 // the drawn way still on the map
        await w.remove();
        // the dance, the night everyone came for
        const il = await c.ilustracja("taniec_swietlikow", { ruch: "najazd" });
        await c.say("wiewiorka", "line.b_taniec");
        await c.say("sowa", "line.b_taniec2");
        await il.zsun();
      },
      // C. the breather - hide-and-seek in the dark, Squirrel's idea now that she is brave; then the game of stumps
      // (musical chairs), taught before it is played; the child stops the music. Four friends on three stumps (more
      // friends), one stump added (as many), three players on four stumps (more stumps). A shooting star ends the night.
      async (c) => {
        const S = c.stage, G0 = S.puppets.lisek.korzen.position.y, gracze = WSZYSCY;
        await c.ujecie("zblizenie", { na: "wiewiorka" });                         // brave now: her idea
        await c.emocja("wiewiorka", "zarowka", { anim: "Podskok" });
        await c.say("wiewiorka", "line.e_chowany");
        await c.ujecie("ogolny");                                                 // Owl steps aside, the bushes come
        await Promise.all([c.walkTo("sowa", 5.0), c.walkTo("sarenka", 3.0)]);
        await c.say("sowa", "line.e_pomoz", { anim: "Zgloszenie" });
        await c.ktoPowiedzial({ gospodarz: "sowa", kryjowki: ["lisek", "wiewiorka", "sarenka"], size: 2.0 });
        await Promise.all([c.walkTo("sowa", 2.0), c.walkTo("sarenka", 4.6)]);
        // the game of stumps
        await c.ujecie("dwuujecie", { na: ["sowa", "lisek"] });                   // Owl explains, Fox adds the catch
        await c.say("sowa", "line.c_gra", { anim: "Radosc" });
        await c.say("sowa", "line.c_zasady");
        await c.say("lisek", "line.c_zasady2", { anim: "Podskok" });
        await c.ujecie("ogolny");
        let pienki = [];
        for (const x of [-3.2, 0, 3.2]) pienki.push(await c.object("pniak", { x, y: -2.75, size: 1.7 }));
        const gora = (p) => S.bounds(p).top - 0.12;
        const przycisk = await c.object("przycisk_muzyki", { x: 0, y: 2.6, size: 1.0 }); c.swiatlo(przycisk, { r: 1.0, moc: 0.7, migotanie: 0 });
        // a round: music, the players walk to and fro until the child presses the button, then each hops onto the
        // nearest free stump (`bezPienka` is kept off them all); returns who stands where
        const runda = async (kto, bezPienka = null, linia = "line.c_ty") => {
          const muzyka = c.muzyka("melodyjka");
          const st = { stop: false };
          const marsz = (async () => { let dir = 1; while (!st.stop) { await Promise.all(kto.map((n, i) => c.walkTo(n, -4.8 + i * (9.6 / Math.max(1, kto.length - 1)) + dir * 0.9))); dir = -dir; } })();
          await c.say("sowa", linia);
          dobre(przycisk); await c.task({ targets: [przycisk], correct: przycisk, wrong: linia }); dobre(przycisk, false);
          st.stop = true; muzyka.stop(); await marsz;
          const wolne = pienki.slice(), gdzie = new Map();
          for (const n of kto.filter((n) => n !== bezPienka).sort((a, b) => S.puppets[a].korzen.position.x - S.puppets[b].korzen.position.x)) {
            if (!wolne.length) break;
            const x = S.puppets[n].korzen.position.x, p = wolne.sort((a, b) => Math.abs(a.mesh.position.x - x) - Math.abs(b.mesh.position.x - x)).shift();
            gdzie.set(n, p);
          }
          await Promise.all([...gdzie].map(([n, p]) => c.przejdz(n, [[p.mesh.position.x, gora(p)]], { skok: 0.6, glebia: 0 })));
          return gdzie;
        };
        const zejdz = (gdzie) => Promise.all([...gdzie.keys()].map((n) => c.przejdz(n, [[S.puppets[n].korzen.position.x, G0]], { skok: 0.3, glebia: 0 })));
        // round 1: four friends, three stumps - Fox is left out
        let gdzie = await runda(gracze, "lisek");
        await c.ujecie("zblizenie", { na: "lisek" });                             // left out
        await c.emocja("lisek", "smutek", { anim: "Smutek" });
        await c.say("lisek", "line.c_bez");
        await c.ujecie("ogolny");                                                 // the two cards come in
        const przyj = await c.object("przyjaciele", { x: -2.2, y: 1.0, size: 1.3, obraz: c.glowy(gracze) }), pk = await c.object("pniak", { x: 2.2, y: 1.0, size: 1.4 });
        await c.say("sarenka", "line.c_kogo");
        dobre(przyj); await c.task({ targets: tasuj([przyj, pk]), correct: przyj, wrong: "line.c_kogo_nie" }); dobre(przyj, false);
        await c.ujecie("sredni", { na: ["sowa", przyj] });                        // the answer named, the card in the shot
        await c.say("sowa", "line.c_wiecej_przyjaciol");
        przyj.remove(); pk.remove();
        await c.ujecie("ogolny");
        await zejdz(gdzie);
        // round 2: one more stump - as many
        const zapas = await c.object("pniak", { x: 5.6, y: -1.2, size: 1.3 });
        await c.say("wiewiorka", "line.c_dolozmy");
        dobre(zapas); await c.task({ targets: [zapas], correct: zapas, wrong: "line.c_dolozmy" }); dobre(zapas, false);
        zapas.remove();
        for (const p of pienki) p.remove();
        pienki = [];
        for (const x of [-4.2, -1.4, 1.4, 4.2]) pienki.push(await c.object("pniak", { x, y: -2.75, size: 1.7 }));
        await c.say("wiewiorka", "line.c_nowy", { anim: "Radosc" });
        gdzie = await runda(gracze, null, "line.c_jeszcze_raz");
        await c.ujecie("dwuujecie", { na: ["lisek", "sarenka"] });                // his joy, her rule
        await c.say("lisek", "line.c_kazdy", { anim: "Radosc" });
        await c.say("sarenka", "line.c_tyle");
        await c.ujecie("ogolny");
        await zejdz(gdzie);
        // round 3: Owl referees - three players, four stumps: one stays empty
        await c.say("sowa", "line.c_sedzia");
        await c.walkTo("sowa", 6.6);
        gdzie = await runda(["lisek", "wiewiorka", "sarenka"], null, "line.c_ostatni");
        const pusty = pienki.find((p) => ![...gdzie.values()].includes(p));
        await c.say("sowa", "line.c_stop", { anim: "Zgloszenie" });
        await c.say("sowa", "line.c_pusty");
        dobre(pusty); await c.task({ targets: pienki, correct: pusty, wrong: "line.c_pusty_nie" }); dobre(pusty, false);
        await c.ujecie("sredni", { na: ["sarenka", pusty] });                    // the empty stump named
        await c.say("sarenka", "line.c_wiecej_pienkow");
        await c.ujecie("ogolny");
        await zejdz(gdzie);
        // the shooting star
        przycisk.remove();
        const gw = await c.object("gwiazdka", { x: -6.2, y: 3.6, size: 0.8 }); c.swiatlo(gw, { r: 1.0, migotanie: 0 });
        await gw.moveTo(5.5, 2.2, 0.55); c.rozblysk([5.5, 2.2]);
        await c.say("wiewiorka", "line.c_gwiazda", { anim: "Wskazanie" });
        await c.ujecie("dwuujecie", { na: ["sowa", "lisek"] });                   // the wish, then home
        await c.say("sowa", "line.c_zyczenie");
        await c.say("lisek", "line.c_hurra", { anim: "Podskok" });
      },
    ],
    practice: [
      // five night games, a star each; every right answer named with the answer in the shot
      async (c) => {
        c.show("sowa"); c.show("sarenka");
        c.stage.puppets.sowa.korzen.position.x = -5.4; c.stage.puppets.sarenka.korzen.position.x = 5.4;   // at the edges: the games fill the middle
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                       // show() pops the puppet in
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        // 1. without a pair: bunnies joined by lines to carrots, but one
        {
          const xs = [-3, -1, 1, 3], bez = Math.floor(Math.random() * 4), zaj = [], linie = [];
          for (const x of xs) zaj.push(await c.object("zajac", { x, y: 1.3, size: 1.1 }));
          // each carrot right under its bunny, the line straight down; the unpaired bunny has nothing under it
          for (const [i, x] of xs.entries()) { if (i === bez) continue; await c.object("marchewka", { x, y: -1.3, size: 0.9 }); }
          for (const [i, x] of xs.entries()) { if (i === bez) continue; linie.push(await para(c, [x, 0.65], [x, -0.7])); }
          await c.say("sarenka", "line.p_bez_pary");
          dobre(zaj[bez]); await c.task({ targets: zaj, correct: zaj[bez], wrong: "line.p_bez_pary_nie" });
          await c.ujecie("sredni", { na: ["sarenka", zaj[bez]] });
          await c.say("sarenka", "line.p_bez_pary_ok", { anim: "Brawo" });
          gw.dodaj(); c.clear(); for (const l of linie) l.remove?.();
        }
        // 2. the long row: three apples spread far, four pears close - where are more?
        {
          await c.ujecie("ogolny");
          const jab = [], gru = [];
          for (const x of [-4.2, 0, 4.2]) jab.push(await c.object("jablko", { x, y: 1.3, size: 0.9 }));
          for (const x of [-1.5, -0.5, 0.5, 1.5]) gru.push(await c.object("gruszka", { x, y: -1.0, size: 0.85 }));
          await c.say("sowa", "line.p_dlugi");
          let linie = [];
          dobre(gru);
          await c.task({ targets: [...jab, ...gru], correct: gru, wrong: "line.p_dlugi_nie", onWrong: async () => {
            if (!linie.length) for (let i = 0; i < 3; i++) linie.push(await para(c, [jab[i].mesh.position.x, 0.75], [gru[i].mesh.position.x, -0.45]));
            await c.say("sarenka", "line.p_dlugi_nie");
          } });
          await c.ujecie("sredni", { na: ["sarenka", ...gru] });
          await c.say("sarenka", "line.p_dlugi_ok", { anim: "Brawo" });
          gw.dodaj(); c.clear(); for (const l of linie) l.remove?.();
        }
        // 3. one carrot for each bunny (rozdaj, one each): two carrots are left - more carrots than bunnies
        {
          await c.ujecie("ogolny");
          await c.say("sarenka", "line.p_daj");
          const r = await c.rozdaj({ komu: [-2.6, 0, 2.6].map((x) => ({ obraz: "zajac", x, y: -1.7, size: 1.7 })), rzeczy: ["marchewka", "marchewka", "marchewka", "marchewka", "marchewka"],
            ile: 1, rzeczyY: 1.5, rzeczySize: 1.1, wrong: "line.p_daj" });
          await c.ujecie("sredni", { na: ["sarenka", ...r.reszta] });              // the two left over
          for (const q of r.reszta) c.stage.bump(q, 0.3);
          await c.say("sarenka", "line.p_daj_ok", { anim: "Radosc" });
          gw.dodaj(); r.remove(); c.clear();
        }
        // 4. too many balloons: pop them until each bunny has one
        {
          await c.ujecie("ogolny");
          const zaj = [await c.object("zajac", { x: -1.6, y: -1.6, size: 1.1 }), await c.object("zajac", { x: 1.6, y: -1.6, size: 1.1 })];
          const bal = [];
          for (const x of [-3.3, -1.1, 1.1, 3.3]) bal.push(await c.object("balonik", { x, y: 1.5, size: 1.0 }));
          await c.say("sowa", "line.p_baloniki");
          while (bal.length > zaj.length) {
            dobre(bal); const h = await c.task({ targets: bal, correct: bal.slice(), wrong: "line.p_baloniki" }); dobre(bal, false);
            bal.splice(bal.indexOf(h), 1); c.sfx("pop"); c.konfetti(h, { ile: 18 }); h.remove();
          }
          const linie = [];
          for (let i = 0; i < 2; i++) linie.push(await para(c, [bal[i].mesh.position.x, 0.7], [zaj[i].mesh.position.x, -0.95]));
          await c.ujecie("sredni", { na: ["sowa", ...bal, ...zaj] });
          await c.say("sowa", "line.p_baloniki_ok", { anim: "Brawo" });
          gw.dodaj(); c.clear(); for (const l of linie) l.remove?.();
        }
        // 5. a quick look: mice, then they hide behind two bushes - behind which are more?
        {
          await c.ujecie("ogolny");
          // the bushes stand there first, each group of mice clearly under its own bush, and the child WATCHES them run in
          const lewe = Math.random() < 0.5 ? 2 : 3, prawe = lewe === 2 ? 3 : 2;
          const k1 = await c.object("krzak", { x: -2.6, y: 0.3, size: 2.2, z: 0.5 }), k2 = await c.object("krzak", { x: 2.6, y: 0.3, size: 2.2, z: 0.5 });
          const grupa = async (n, x0) => { const g = []; for (let i = 0; i < n; i++) g.push(await c.object("mysz", { x: x0 + (i - (n - 1) / 2) * 0.85, y: -2.0, size: 0.7, z: 0.3 })); return g; };
          const ml = await grupa(lewe, -2.6), mp = await grupa(prawe, 2.6);
          await c.say("sowa", "line.p_myszki", { anim: "Zgloszenie" });
          await c.wait(1.5);
          for (const [g, k] of [[ml, k1], [mp, k2]]) for (const m of g) {
            await m.moveTo(k.mesh.position.x + (Math.random() - 0.5) * 0.6, 0.1, 0.7);   // behind the bush (drawn further back)
            m.mesh.visible = false; c.sfx("tap"); await c.wait(0.25);
          }
          const wiecej = lewe > prawe ? k1 : k2;
          await c.say("sowa", "line.p_ktory_krzak");
          dobre(wiecej); await c.task({ targets: [k1, k2], correct: wiecej, wrong: "line.p_krzak_nie" });
          // they come out again: the answer seen
          for (const m of [...ml, ...mp]) { m.mesh.visible = true; m.moveTo(m.home.x, m.home.y, 0.6); }
          await c.say("sowa", "line.p_krzak_ok", { anim: "Wskazanie" });
          await c.wait(0.8);
          gw.dodaj(); c.clear();
        }
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.praise("sowa");
      },
    ],
    apply: [
      // home - the third act: the sleepover at Owl's. Fox is fooled by a long row of pillows again; on an insert the
      // pillows are paired - two of his have no pair; one moved over: as many; the pillow fight; one pillow each laid on
      // the painted rug, two left over; the fireflies let out of the lanterns; everyone asleep (seen)
      async (c) => {
        const S = c.stage;
        const POZ = { lisek: -5.6, wiewiorka: -4.3, sowa: 4.5, sarenka: 5.7 };
        naMiejsca(c, POZ);
        await c.wait(0.4);                                                       // show() pops the puppets in
        await c.ujecie("ogolny");                                                // the night room, all four
        await c.say("sowa", "line.d_nocowanie", { anim: "Radosc" });
        await c.say("lisek", "line.d_druzyny");
        // Fox's team: four pillows close together; Owl's team: two in a long row
        const poduszki = async () => {
          const lewa = [], prawa = [];
          for (const x of [-2.8, -2.25, -1.7, -1.15]) lewa.push(await c.object("poduszka", { x, y: -2.2, size: 1.2 }));
          for (const x of [0.0, 2.6]) prawa.push(await c.object("poduszka", { x, y: -2.2, size: 1.2 }));
          return [lewa, prawa];
        };
        let [lewa, prawa] = await poduszki();
        await c.ujecie("zblizenie", { na: "lisek" });                            // fooled by the long row again
        await c.emocja("lisek", "zlosc", { anim: "Smutek" });
        await c.say("lisek", "line.d_dlugi_rzad");
        // the method on a plain colour: the pillows joined in pairs, team to team
        await c.go({ kolor: "#2c3a6b", motyw: "gwiazdki" }, { ciecie: true });
        naMiejsca(c, POZ);
        [lewa, prawa] = await poduszki();
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.d_sarenka", { anim: "Kiwanie" });
        // nested arcs, inner pair lowest: at one height they ran into one band and no pair could be followed
        const luk = (a, b, i) => { const g = -0.9 + i * 0.6; return c.line({ bezier: [[a.mesh.position.x, -1.6], [a.mesh.position.x, g], [b.mesh.position.x, g], [b.mesh.position.x, -1.6]] }, { color: "#ffd76a", duration: 0.4, width: 0.07 }); };
        await c.say("sowa", "line.d_pary");
        let linie = [];
        for (let i = 0; i < prawa.length; i++) linie.push(await luk(lewa[lewa.length - 1 - i], prawa[i], i));
        const bezPary = lewa.slice(0, lewa.length - prawa.length);
        await c.say("sowa", "line.d_bez_pary");
        dobre(bezPary); await c.task({ targets: [...lewa, ...prawa], correct: bezPary, wrong: "line.d_bez_pary" }); dobre(bezPary, false);
        await c.ujecie("sredni", { na: ["sowa", ...lewa] });                    // the two without a pair, named
        for (const q of bezPary) S.bump(q, 0.3);
        await c.say("sowa", "line.d_zostaly");
        await c.ujecie("zblizenie", { na: "lisek" });                            // he sees it
        await c.emocja("lisek", "pot");
        await c.say("lisek", "line.d_oj");
        // move one over
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.d_przeloz");
        for (const l of linie) l.remove?.();
        const zrzut = { x: 1.3, y: -2.2 };                                     // a dashed place on Owl's side, between her two
        const s1 = await c.slots({ items: lewa.slice(), slots: [{ ...zrzut, w: 1.3, h: 0.9, accept: () => true, rodzaj: "lezy" }], wrong: "line.d_przeloz_nie" });
        await s1.done(); s1.remove?.();
        const przel = lewa.reduce((a, b) => (b.mesh.position.x > a.mesh.position.x ? b : a));
        lewa.splice(lewa.indexOf(przel), 1); prawa.splice(1, 0, przel);
        lewa.forEach((h, i) => h.moveTo(-2.9 + i * 0.9, -2.2, 0.3)); prawa.forEach((h, i) => h.moveTo(1.1 + i * 0.9, -2.2, 0.3));
        await c.wait(0.4);
        await c.say("sowa", "line.d_sprawdz");
        linie = [];
        for (let i = 0; i < 3; i++) linie.push(await luk(lewa[lewa.length - 1 - i], prawa[i], i));
        await c.ujecie("sredni", { na: ["sarenka", ...prawa] });
        await c.say("sarenka", "line.d_tyle", { anim: "Radosc" });
        // back in the room: the pillow fight
        await c.go("pokoj_noc", { ciecie: true });
        naMiejsca(c, POZ);
        lewa = []; prawa = [];
        for (const x of [-3.0, -2.0, -1.0]) lewa.push(await c.object("poduszka", { x, y: -2.2, size: 1.2 }));
        for (const x of [1.0, 2.0, 3.0]) prawa.push(await c.object("poduszka", { x, y: -2.2, size: 1.2 }));
        await c.ujecie("ogolny");
        await c.say("lisek", "line.d_bitwa", { anim: "Podskok" });
        c.czastki("piorka", { wiatr: 0.2 });
        for (let r = 0; r < 3; r++) {
          await Promise.all([...lewa.map((h) => h.moveTo(3.5 + Math.random(), -0.5 + Math.random(), 0.45)), ...prawa.map((h) => h.moveTo(-3.8 - Math.random(), -0.5 + Math.random(), 0.45))]);
          c.sfx("plop");
          await Promise.all([...lewa.map((h) => h.moveTo(-3.0 + Math.random() * 2, -2.2, 0.45)), ...prawa.map((h) => h.moveTo(1.0 + Math.random() * 2, -2.2, 0.45))]);
        }
        await Promise.all(WSZYSCY.map((n) => c.play(n, "Radosc")));
        c.czastki(null);
        // bedtime: one pillow for each of us, laid on the painted rug; two are left over
        const pod = [...lewa, ...prawa];
        await Promise.all(pod.map((h, i) => h.moveTo(-3.0 + i * 1.2, 1.6, 0.4)));
        await c.say("sarenka", "line.d_spac");
        const m = await c.miejsca(), dyw = m.dywan;
        const xs = [-2.1, -0.7, 0.7, 2.1].map((x) => dyw.x + x * Math.min(1, dyw.w / 6));
        await c.say("sowa", "line.d_rozdaj");
        const sl = await c.slots({ items: pod, slots: xs.map((x) => ({ x, y: dyw.y, w: 1.3, h: 0.9, accept: () => true, rodzaj: "lezy" })), wrong: "line.d_rozdaj" });
        await sl.done();
        const zapas = pod.filter((h) => !xs.some((x) => Math.hypot(h.mesh.position.x - x, h.mesh.position.y - dyw.y) < 0.3));
        await c.ujecie("sredni", { na: ["sarenka", ...zapas] });                // the two left over
        for (const q of zapas) S.bump(q, 0.3);
        await c.say("sarenka", "line.d_dwie_zostaly", { anim: "Kiwanie" });
        sl.remove?.();
        // the fireflies go home: each lantern pointed to lets its firefly out through the window
        await c.ujecie("ogolny");
        const lampki = [];
        for (const x of [-2.4, -0.8, 0.8, 2.4]) lampki.push(await c.object("latarenka_swieci", { x, y: 0.4, size: 0.85 }));
        await c.say("sowa", "line.d_wypusc");
        for (let i = 0; i < 4; i++) {
          const swiecace = lampki.filter((h) => !h.pusta); dobre(swiecace);
          const h = await c.task({ targets: swiecace, correct: swiecace, wrong: "line.d_wypusc" });
          dobre(swiecace, false); h.pusta = true;
          const { x, y } = h.mesh.position;
          const f = await c.object("swietlik", { x, y, size: 0.45 });
          const pusta = await c.object("latarenka", { x, y, size: 0.85 }); h.remove();
          lampki[lampki.indexOf(h)] = Object.assign(pusta, { pusta: true });
          f.moveTo(0.4 + i * 0.3, 2.9, c.fast ? 0.2 : 1.0).then(() => f.remove());
        }
        await c.say("wiewiorka", "line.d_leca", { anim: "Wskazanie" });
        lampki.forEach((h) => h.remove());
        // the payoff, seen: everyone asleep on the rug, a pillow each, the fireflies dancing outside
        const il = await c.ilustracja("nocowanie", { ruch: "najazd" });
        await c.say("sowa", "line.d_dobranoc");
        await il.zsun();
        await c.ujecie("sredni", { na: ["wiewiorka"] });                         // the home task, said to the parents
        await c.say("wiewiorka", "line.d_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
