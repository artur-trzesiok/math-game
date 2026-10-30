// Lesson: thick and wide - thick / thin for round things, wide / narrow for flat things and openings; whether a thing
// goes through a gap is decided by how thick or wide it is, never by how long. Mole moves house, Fox and Deer carry:
// Fox bets the short barrel goes through the narrow gate and the long stick does not - the barrel sticks, the stick
// passes; the insert; the barrel through the wide gateway; between two birches only the thinnest log; the thickest
// tree is Mole's; the muddy doormat (the breather); thin things down the narrow tunnel, thick down the wide one; the
// new burrow. At home (the burrow's hallway) Deer thinks the long umbrella won't fit the narrow stand; books by
// thickness on the shelf, the widest scarf, the widest present needs the door opened wide; the guests. Script in
// scenario.md.

const GROUND = -3.3;                                                  // the stage floor (scene.js)

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
// a shuffled order that never already is the answer order (0, 1, 2 ...)
const nieWKolejnosci = (n) => { let m = tasuj([...Array(n).keys()]); while (m.every((v, i) => v === i)) m = tasuj(m); return m; };
// things in order into places (an arrow at the first); never lying in the answer order already
async function poKolei(c, rzeczy, { x = 0.6, y = 2.0, yK = -2.35, krok = 2.0, miejsca = null, wrong }) {
  const n = rzeczy.length, x0 = x - ((n - 1) * krok) / 2, m = nieWKolejnosci(n);
  const items = [];
  for (const [i, [name, size]] of rzeczy.entries()) { const h = await c.object(name, { x: x0 + m[i] * krok, y: yK, size }); h.ranga = i; items.push(h); }
  await c.wait(0.4);
  const sloty = miejsca || rzeczy.map((_, k) => ({ x: x0 + k * krok, y, w: krok * 0.9, h: 1.6 }));
  const t = await c.slots({ items, slots: sloty.map((s, k) => ({ ...s, accept: (it) => it.ranga === k })), wrong });
  const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
  await t.done(); strzalka.remove();
  for (const h of items) h.slot = null;                               // free for the next places (the tests skip things with a slot)
  return { items: items.slice().sort((a, b) => a.ranga - b.ranga), t };
}
// a row laid out by the drawn widths (the sticker squares are much wider than a crayon), centred on x
function rzad(c, hs, x, y, gap) {
  const ws = hs.map((h) => { const b = c.bounds(h); return b.right - b.left; });
  let lx = x - (ws.reduce((a, w) => a + w, 0) + gap * (hs.length - 1)) / 2;
  hs.forEach((h, i) => { const b = c.bounds(h), tx = lx + ws[i] / 2 + (h.mesh.position.x - (b.left + b.right) / 2); h.mesh.position.set(tx, y, h.mesh.position.z); h.home = { x: tx, y }; lx += ws[i] + gap; });
}
// the garden's gates: the narrow wicket (the same in every round) and the wide gateway in the stone wall
const FURTKA = { obraz: "szpara_furtka", szczelina: 0.6 };
const BRAMA = { obraz: "szpara_brama", szczelina: 1.05 };
// the see-through opening of each painted gap in sticker pixels of 768 (as mechaniki6.js zmierzOtwor measures it)
const OTWOR = { szpara_furtka: [300, 469], szpara_brama: [288, 495], szpara_drzewa: [295, 484] };
// the gaps shown before the task, exactly where and how big c.szpara will draw them (its own copy lands on top), so
// everything is said - the bet and the instruction - before the child can push anything
async function pokazSzpary(c, szpary) {
  const hs = [];
  for (const s of szpary) { const [l, r] = OTWOR[s.obraz]; hs.push(await c.object(s.obraz, { x: s.x, y: -2.0, size: s.szczelina / ((r - l) / 768) })); }
  await c.standOn(hs, GROUND + 0.1, 0.01);
  return hs;
}
// Mole's barrel and long stick over the heads
const beczka = (c, x = -1.6) => c.object("beczka", { x, y: 1.5, size: 1.0 });
const kij = (c, x = 1.4) => c.object("patyk_wysoki", { x, y: 1.55, size: 2.4 });

const LEKCJA = {
  id: "thick_wide",
  przejscia: true,
  nagrody: true,
  characters: { kret: { side: "left", x: -4.7 }, lisek: { side: "right", x: 3.7 }, sarenka: { side: "right", x: 5.3 } },
  backgrounds: { story: "ogrod", practice: { kolor: "#e2efd6", motyw: "kola" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the garden gate: Fox bets on the short barrel - it sticks; the long stick goes through
      async (c) => {
        for (const n of ["kret", "lisek", "sarenka"]) c.show(n);
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("ogolny");                                            // the three friends in the garden
        await c.say("kret", "line.a_przeprowadzka", { anim: "Radosc" });
        await c.say("sarenka", "line.a_pomozemy", { anim: "Kiwanie" });
        const b = await beczka(c), k = await kij(c);
        await c.say("kret", "line.a_rzeczy", { anim: "Wskazanie" });
        const [furtka] = await pokazSzpary(c, [{ ...FURTKA, x: -0.6 }]);
        await c.ujecie("sredni", { na: ["kret", furtka] });
        await c.say("kret", "line.a_furtka");
        await c.ujecie("sredni", { na: ["lisek", b, k] });                  // the bet: the short one goes, the long one won't
        await c.say("lisek", "line.a_zaklad", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.a_beczka");
        // the barrel only sticks: the round ends with it stuck, so no confetti for it (the lesson's own reward switch)
        LEKCJA.nagrody = false;
        try { await c.szpara({ szpary: [{ ...FURTKA, x: -0.6 }], rzeczy: [b], wrong: "line.a_utknela" }); } finally { LEKCJA.nagrody = true; }
        c.wonder("lisek");                                                   // over the head while the wide shot has room for it
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.a_jak_to");
        await c.ujecie("ogolny");                                            // the same gate, the stick's turn
        await c.say("sarenka", "line.a_kij");
        await c.szpara({ szpary: [{ ...FURTKA, x: -0.6 }], rzeczy: [k] });
        await c.ujecie("zblizenie", { na: "lisek" });
        c.emocja("lisek", "wykrzyknik");
        await c.say("lisek", "line.a_przeszedl");
        // the method on a plain colour: the gate's opening against the barrel's width
        await c.go({ kolor: "#f1e6cc", motyw: "kola" }, { ciecie: true });
        const g = await c.object("szpara_furtka", { x: -1.9, y: -2.0, size: 3.2 });
        const b2 = await c.object("beczka", { x: 0.4, y: -2.2, size: 1.3 });
        const k2 = await c.object("patyk_wysoki", { x: 1.7, y: -1.9, size: 2.4 });
        await c.standOn([g, b2, k2], GROUND + 0.1, 0.01);
        await c.ujecie("sredni", { na: [g, b2, k2] });
        const gb = c.bounds(g), xl = -1.9 + (OTWOR.szpara_furtka[0] / 768 - 0.5) * 3.2, xr = -1.9 + (OTWOR.szpara_furtka[1] / 768 - 0.5) * 3.2, yo = gb.bottom + 0.25;
        const s1 = await c.segment([xl, yo], [xr, yo], { strong: true, color: "#c0392b" });
        await c.say("sarenka", "line.a_waska", { anim: "Wskazanie" });
        const bb = c.bounds(b2), kb = c.bounds(k2), yb = (bb.top + bb.bottom) / 2;
        const s2 = await c.segment([bb.left, yb], [bb.right, yb], { strong: true, color: "#c0392b" });
        const s3 = await c.segment([kb.left - 0.02, yb], [kb.right + 0.02, yb], { strong: true, color: "#2e8b57" });
        await c.say("sarenka", "line.a_cienki");
        s1.remove(); s2.remove(); s3.remove();
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.a_aha", { anim: "Radosc" });
        // back at the gate: the wide gateway in the stone wall next to it
        await c.go("ogrod", { ciecie: true });
        await c.ujecie("sredni", { na: ["kret"] });
        c.wonder("kret");
        await c.say("kret", "line.a_jak_beczka");
        const b3 = await beczka(c, 0.2);
        const szpary = [{ ...FURTKA, x: -2.3 }, { ...BRAMA, x: 1.0 }];
        await pokazSzpary(c, szpary);
        await c.ujecie("ogolny");                                            // both gates and the barrel in the shot
        await c.say("sarenka", "line.a_brama", { anim: "Wskazanie" });
        await c.say("sarenka", "line.a_ktora");
        await c.szpara({ szpary, rzeczy: [b3], wrong: "line.a_ktora_nie" });
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.a_ktora_tak", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["kret"] });
        await c.say("kret", "line.a_do_lasu", { anim: "Machanie" });
        c.clear();
      },
      // B. the birch wood: only the thinnest log goes between the birches; the thickest tree is Mole's
      async (c) => {
        await c.go("las", { enter: true });
        await Promise.all(["kret", "lisek", "sarenka"].map((n) => c.enter(n)));
        await c.ujecie("ogolny");                                            // the arrival
        await c.say("kret", "line.b_las", { anim: "Rozgladanie" });
        const xs = tasuj([-2.4, 0.2, 2.6]);
        const polana = [];
        for (const [i, n] of ["polano_grube", "polano_srednie", "polano_cienkie"].entries()) polana.push(await c.object(n, { x: xs[i], y: 1.5, size: 1.8 }));
        await c.say("kret", "line.b_polana");
        const brzozy = [{ obraz: "szpara_drzewa", x: 0.2, szczelina: 0.65 }];
        await pokazSzpary(c, brzozy);
        await c.ujecie("sredni", { na: ["lisek", ...polana] });              // Fox's bet again: they're all short
        await c.say("lisek", "line.b_lisek", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.b_brzozy");
        const sz = await c.szpara({ szpary: brzozy, rzeczy: polana, wrong: "line.b_brzozy_nie" });
        const grube = polana.filter((h) => !sz.przeszly.includes(h));
        await c.ujecie("sredni", { na: ["kret", ...grube] });
        await c.say("kret", "line.b_brzozy_tak", { anim: "Radosc" });
        c.clear();
        // the thickest tree in the wood: Mole sees badly
        await c.ujecie("zblizenie", { na: "kret" });
        c.emocja("kret", "smutek");
        await c.say("kret", "line.b_najgrubsze", { anim: "Rozgladanie" });
        await c.walkTo("kret", -5.1);                                        // room for three trees
        const xt = tasuj([-3.0, -0.75, 1.5]);
        const drzewa = [];
        for (const [i, n] of ["drzewo_grube", "drzewo_srednie", "drzewo_cienkie"].entries()) drzewa.push(await c.object(n, { x: xt[i], y: -1.6, size: 3.0 }));
        await c.standOn(drzewa, GROUND + 0.05, 0.01);
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.b_pomozemy", { anim: "Kiwanie" });
        dobre(drzewa[0]); await c.task({ targets: drzewa, correct: drzewa[0], wrong: "line.b_drzewo_nie" }); dobre(drzewa, false);
        c.rozblysk(drzewa[0]);
        await c.ujecie("sredni", { na: ["kret", drzewa[0]] });
        await c.say("kret", "line.b_drzewo_tak", { anim: "Podskok" });
        await Promise.all([drzewa[1].remove(), drzewa[2].remove()]);
        await drzewa[0].moveTo(0.0, drzewa[0].mesh.position.y, 0.6);
      },
      // C. at the new burrow: the muddy doormat (the breather), two tunnels - thin and thick, everything inside
      async (c) => {
        const drzewo = c.stage.objects.find((o) => o.name === "drzewo_grube");
        await c.ujecie("dwuujecie", { na: ["kret", "lisek"] });
        c.emocja("kret", "pot");
        await c.say("kret", "line.c_bloto");
        await c.say("lisek", "line.c_zetrzyj", { anim: "Wskazanie" });
        await c.ujecie("ogolny");                                            // the mat flies up from the whole place
        const z = await c.zdrapka("wycieraczka_kreta");
        await c.say("kret", "line.c_odkryte", { anim: "Radosc" });
        await c.say("lisek", "line.c_kto");
        dobre(z.cele); await c.task({ targets: [...z.cele, z.tlo], correct: z.cele, wszystkie: true, wrong: "line.c_kto_nie" }); dobre(z.cele, false);
        await c.say("kret", "line.c_kto_tak", { anim: "Podskok" });
        await z.remove();
        // the two tunnels at the foot of the tree
        await c.walkTo("lisek", 4.6);                                        // room for the wide tunnel
        const waski = await c.zone({ x: -2.75, y: -2.3, w: 2.6, h: 1.8, image: "tunel_waski", name: "waski" }); waski.want = "cienkie";
        const szeroki = await c.zone({ x: 2.4, y: -2.3, w: 2.7, h: 1.8, image: "tunel_szeroki", name: "szeroki" }); szeroki.want = "grube";
        await c.ujecie("sredni", { na: ["kret", waski, szeroki, ...(drzewo ? [drzewo] : [])] });
        await c.say("kret", "line.c_tunele", { anim: "Wskazanie" });
        await c.say("kret", "line.c_tunele2");
        const rzeczy = [];
        for (const [n, size, tag] of tasuj([["patyk_wysoki", 2.2, "cienkie"], ["kredka_cienka", 1.6, "cienkie"], ["polano_cienkie", 1.6, "cienkie"],
          ["beczka", 1.0, "grube"], ["polano_grube", 1.6, "grube"], ["kredka_gruba", 1.6, "grube"]])) {
          const h = await c.object(n, { x: 0, y: 1.6, size }); h.tag = tag; rzeczy.push(h);
        }
        rzad(c, rzeczy, 0.3, 1.6, 0.45);
        await c.ujecie("ogolny");                                            // the task: things and both tunnels in the shot
        await c.say("sarenka", "line.c_wloz");
        await c.sort({ items: rzeczy, zones: [waski, szeroki], wrong: "line.c_wloz_nie" });
        await c.ujecie("sredni", { na: [waski, szeroki] });
        await c.say("kret", "line.c_wloz_tak", { anim: "Radosc" });
        const il = await c.ilustracja("przeprowadzka_kreta", { ruch: "najazd" });
        await c.say("kret", "line.c_wszystko");
        await il.zsun();
        c.clear();
      },
      // D. inside the new burrow: welcome, thanks, the housewarming tomorrow
      async (c) => {
        await c.go("nora", { enter: true });
        await Promise.all(["kret", "lisek", "sarenka"].map((n) => c.enter(n)));
        await c.ujecie("ogolny");                                            // the arrival
        await c.say("kret", "line.c_witajcie", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.c_przytulnie", { anim: "Rozgladanie" });
        await c.ujecie("zblizenie", { na: "kret" });
        c.emocja("kret", "serce");
        await c.say("kret", "line.c_dziekuje", { anim: "Brawo" });
        await c.ujecie("dwuujecie", { na: ["kret", "lisek"] });
        await c.say("kret", "line.c_parapetowka", { anim: "Machanie" });
        await c.say("lisek", "line.c_prezenty", { anim: "Podskok" });
      },
    ],
    practice: [
      // five games on a plain colour, a star each
      async (c) => {
        for (const n of ["kret", "lisek", "sarenka"]) c.show(n);
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.p_start", { anim: "Radosc" });
        // 1. thicker, thinner: two crayons, then two trees (never the extreme pair)
        for (const [para, size, y, pyt, nie, tak, ok] of [
          [["kredka_srednia", "kredka_cienka"], 2.2, 1.2, "line.p_kredka", "line.p_kredka_nie", "line.p_kredka_tak", 0],
          [["drzewo_grube", "drzewo_srednie"], 3.4, -1.6, "line.p_drzewo", "line.p_drzewo_nie", "line.p_drzewo_tak", 1],
        ]) {
          const xs = tasuj(y < 0 ? [-2.2, 0.6] : [-1.4, 1.4]);
          const rz = []; for (const [i, n] of para.entries()) rz.push(await c.object(n, { x: xs[i], y, size }));
          if (y < 0) await c.standOn(rz, GROUND + 0.05, 0.01);
          await c.ujecie("ogolny");
          await c.say("lisek", pyt);
          dobre(rz[ok]); await c.task({ targets: rz, correct: rz[ok], wrong: nie }); dobre(rz[ok], false);
          await c.ujecie("sredni", { na: ["sarenka", rz[ok]] });
          await c.say("sarenka", tak, { anim: "Radosc" });
          c.clear();
        }
        gw.dodaj();
        // 2. wider, narrower: two ribbons of one length (the narrow one drawn a little shorter: sized up to match)
        {
          for (const [pyt, nie, tak, ok] of [["line.p_wstazka", "line.p_wstazka_nie", "line.p_wstazka_tak", 0], ["line.p_wezsza", "line.p_wezsza_nie", "line.p_wezsza_tak", 1]]) {
            const ys = tasuj([0.6, 2.0]);
            const rz = [await c.object("wstazka_szeroka", { x: 0.3, y: ys[0], size: 3.2 }), await c.object("wstazka_waska", { x: 0.3, y: ys[1], size: 3.2 * 370 / 328 })];
            await c.ujecie("ogolny");
            await c.say("lisek", pyt);
            dobre(rz[ok]); await c.task({ targets: rz, correct: rz[ok], wrong: nie }); dobre(rz[ok], false);
            await c.ujecie("sredni", { na: ["sarenka", ...rz] });
            await c.say("sarenka", tak, { anim: "Radosc" });
            c.clear();
          }
          gw.dodaj();
        }
        // 3. does it fit: a narrow gap in a stone wall, a pumpkin and a little stick
        {
          await c.ujecie("ogolny");
          const mur = [{ obraz: "szpara_brama", x: 0.3, szczelina: 0.85 }];
          const xs = tasuj([-1.0, 1.4]);
          const rz = [await c.object("dynia", { x: xs[0], y: 1.6, size: 1.5 }), await c.object("patyk_niski", { x: xs[1], y: 1.6, size: 1.5 })];
          await pokazSzpary(c, mur);
          await c.say("sarenka", "line.p_szpara");
          const sz = await c.szpara({ szpary: mur, rzeczy: rz, wrong: "line.p_szpara_nie" });
          await c.ujecie("sredni", { na: ["lisek", ...sz.szpary] });
          await c.say("lisek", "line.p_szpara_tak", { anim: "Radosc" });
          c.clear(); gw.dodaj();
        }
        // 4. in order from the thinnest crayon
        {
          await c.ujecie("ogolny");
          const kolej = poKolei(c, [["kredka_cienka", 2.0], ["kredka_srednia", 2.0], ["kredka_gruba", 2.0]], { x: 0.0, krok: 1.8, wrong: "line.p_kolejka_nie" });
          await c.wait(0.6);
          await c.say("lisek", "line.p_kolejka");
          const { items } = await kolej;
          await c.ujecie("sredni", { na: ["sarenka", ...items] });
          await c.say("sarenka", "line.p_kolejka_tak", { anim: "Radosc" });
          c.clear(); gw.dodaj();
        }
        // 5. thick or wide: the round crayon is thick, the flat ribbon is wide
        {
          const xs = tasuj([-1.5, 1.8]);
          const kredka = await c.object("kredka_gruba", { x: xs[0], y: 1.2, size: 1.8 });
          const wstazka = await c.object("wstazka_szeroka", { x: xs[1], y: 1.2, size: 2.6 });
          const rz = [kredka, wstazka];
          for (const [pyt, nie, tak, ok] of [["line.p_grube", "line.p_grube_nie", "line.p_grube_tak", kredka], ["line.p_szerokie", "line.p_szerokie_nie", "line.p_szerokie_tak", wstazka]]) {
            await c.ujecie("ogolny");
            await c.say("lisek", pyt);
            dobre(ok); await c.task({ targets: rz, correct: ok, wrong: nie }); dobre(ok, false);
            await c.ujecie("sredni", { na: ["sarenka", ok] });
            await c.say("sarenka", tak, { anim: "Radosc" });
          }
          c.clear(); gw.dodaj();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      // home - the third act in the new burrow's hallway: the umbrella in the narrow stand, the books by thickness, the
      // widest scarf, the widest present needs the door opened wide, the guests
      async (c) => {
        const S = c.stage;
        for (const n of ["kret", "lisek", "sarenka"]) c.show(n);
        await c.wait(0.4);
        const m = await c.miejsca();
        await c.walkTo("kret", -1.4);                                        // off the shelf: the books go there later
        await c.ujecie("ogolny");                                            // home: the hallway and the things to tidy
        await c.say("kret", "line.d_dom", { anim: "Radosc" });
        const stojak = await c.object("stojak_parasol", { x: -2.9, y: -2.4, size: 1.6 });
        await c.standOn([stojak], GROUND + 0.05, 0.01);
        const parasol = await c.object("parasol", { x: -0.2, y: 1.5, size: 2.0 }); parasol.tag = "parasol";
        const ksiazka = await c.object("ksiazka_gruba", { x: 2.0, y: 1.4, size: 1.3 }); ksiazka.tag = "ksiazka";
        await c.say("sarenka", "line.d_balagan", { anim: "Rozgladanie" });
        // Deer's mistake: the long umbrella and the narrow stand
        await c.ujecie("sredni", { na: ["sarenka", stojak, parasol] });
        await c.say("sarenka", "line.d_parasol", { anim: "Kiwanie" });
        await c.ujecie("zblizenie", { na: "lisek" });                       // the objection
        c.wonder("lisek");
        await c.say("lisek", "line.d_pamietasz");
        await c.ujecie("ogolny");
        const sb = c.bounds(stojak), pb = c.bounds(parasol);
        const yS = sb.top - 0.9 + (pb.top - pb.bottom) / 2;                  // the umbrella's foot well inside the stand
        const st = await c.slots({ items: [parasol, ksiazka], slots: [{ x: -2.9, y: yS, w: 1.1, h: (pb.top - pb.bottom) + 0.2, accept: (h) => h.tag === "parasol" }], wrong: "line.d_stojak_nie" });
        await c.say("kret", "line.d_stojak");
        await st.done();
        parasol.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9.5; });   // inside: the stand's front covers its foot
        st.remove?.();
        await c.ujecie("sredni", { na: ["sarenka", stojak, parasol] });
        await c.say("sarenka", "line.d_stojak_tak", { anim: "Radosc" });
        await ksiazka.remove();
        // the books on the painted shelf, from the thinnest
        const p = m.szafka_srodek;
        await c.ujecie("ogolny");                                            // the shelf and the books in one shot
        await c.say("kret", "line.d_ksiazki", { anim: "Wskazanie" });
        const krok = 0.75, x0 = Math.max(p.x - p.w / 2 + 0.5, -5.4);
        const miejsca = [0, 1, 2].map((k) => ({ x: x0 + k * krok, y: p.y, w: krok * 0.95, h: Math.max(0.8, p.h), niewidoczna: true, rodzaj: p.rodzaj }));
        const kolej = poKolei(c, [["ksiazka_cienka", 1.0], ["ksiazka_srednia", 1.0], ["ksiazka_gruba", 1.0]], { x: 1.0, krok: 1.0, miejsca, wrong: "line.d_uloz_nie" });
        await c.wait(0.6);
        await c.say("kret", "line.d_uloz");
        const { items: ksiazki } = await kolej;
        await c.ujecie("sredni", { na: ["kret", ...ksiazki] });
        await c.say("kret", "line.d_uloz_tak", { anim: "Radosc" });
        // the scarves on the hooks: the widest is the warmest
        const w = m.wieszak;
        const xs = tasuj([-1.8, 0.0, 1.8]).map((d) => w.x + d * Math.min(1, w.w / 5.4));
        const szaliki = [];
        for (const [i, n] of ["szalik_szeroki", "szalik_sredni", "szalik_waski"].entries()) szaliki.push(await c.object(n, { x: xs[i], y: w.y - 1.0, size: 2.1 }));
        await Promise.all(szaliki.map((h) => { const b = c.bounds(h); return h.moveTo(h.mesh.position.x, h.mesh.position.y + (w.y + 0.05 - b.top), 0.01); }));
        await c.ujecie("dwuujecie", { na: ["lisek", "sarenka"] });
        c.emocja("lisek", "zimno");
        await c.say("lisek", "line.d_zimno");
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.d_szalik");
        dobre(szaliki[0]); await c.task({ targets: szaliki, correct: szaliki[0], wrong: "line.d_szalik_nie" }); dobre(szaliki, false);
        await c.take("lisek", szaliki[0]);
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.d_szalik_tak", { anim: "Radosc" });
        // a knock: the presents by the door - the widest needs the door opened wide
        await c.ujecie("ogolny");
        await c.say("kret", "line.d_puk", { anim: "Rozgladanie" });
        const prezenty = [];
        for (const [n, size] of [["obraz_szeroki", 1.4], ["prezent", 0.8], ["torebka", 0.8]]) prezenty.push(await c.object(n, { x: 0, y: -2.3, size }));
        rzad(c, nieWKolejnosci(3).map((i) => prezenty[i]), 1.0, -2.3, 0.25);
        await c.standOn(prezenty, GROUND + 0.1, 0.01);
        await c.say("kret", "line.d_prezent");
        dobre(prezenty[0]); await c.task({ targets: prezenty, correct: prezenty[0], wrong: "line.d_prezent_nie" }); dobre(prezenty, false);
        await c.ujecie("sredni", { na: ["kret", prezenty[0]] });
        await c.say("kret", "line.d_prezent_tak", { anim: "Radosc" });
        // the payoff: the guests come in through the wide open door
        const il = await c.ilustracja("parapetowka_kreta", { ruch: "najazd" });
        await c.say("kret", "line.d_goscie");
        await c.say("sarenka", "line.d_obraz");
        await il.zsun();
        // the home game alone, on a plain colour: a thick and a thin crayon
        await c.go({ kolor: "#f3e6cf", motyw: "kola" }, { ciecie: true });
        await c.ujecie("ogolny");
        const gruba = await c.object("kredka_gruba", { x: -1.4, y: -2.3, size: 1.4 }), cienka = await c.object("kredka_cienka", { x: 1.8, y: -2.3, size: 1.4 });
        await Promise.all([c.take("kret", gruba), c.take("lisek", cienka)]);
        await c.ujecie("dwuujecie", { na: ["kret", "lisek"] });
        await c.say("lisek", "line.d_kredki", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.d_rodzice", { anim: "Machanie" });
      },
    ],
  },
};

export default LEKCJA;
