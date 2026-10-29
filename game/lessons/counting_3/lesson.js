// Lesson: counting to 3 - one, two, three: counting things by touch, each one once; the last number says how many; the
// digits 1, 2, 3. Hedgehog turns three and Bear promises a raspberry cake: Bear counts the candles and touches one twice
// ("four!"); each once - three. The digits on an insert, the 3 traced; in the raspberry thicket Grandma's recipe says
// three, the sweetest three hide under the leaves; Squirrel's present joined from dots. At home the party: Hedgehog
// counts Bear twice, the plates one each, the table, the cake's raspberries, the candles by his age, blown out.
// Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// digit cards 1..3 in a row: a paper card (the target) with the digit drawn on it
async function karty(c, { y = -2.0, xs = [-0.8, 1.0, 2.8] } = {}) {
  const out = [];
  for (const [i, n] of tasuj([1, 2, 3]).entries()) {
    const k = await c.object("karta_cyfry", { obraz: "/game/assets/menu/karta.webp", x: xs[i], y, size: 1.5 });
    k.cyfra = await c.digit(n, { x: xs[i], y: y + 0.05, size: 0.95, duration: 0.2 });
    k.liczba = n; out.push(k);
  }
  return out;
}
const POZ = { jez: -4.4, wiewiorka: -2.4, mis: 4.6 };
const naMiejsca = (c, poz = POZ) => { for (const [n, x] of Object.entries(poz)) c.stage.puppets[n].korzen.position.x = x; };

export default {
  id: "counting_3",
  przejscia: true,
  nagrody: true,
  characters: { jez: { side: "left", x: -4.4 }, mis: { side: "right", x: 4.6 }, wiewiorka: { side: "left", x: -2.4 } },
  backgrounds: { story: "laka", practice: { kolor: "#fbe3e8", motyw: "kola" }, apply: "dom" },
  stages: {
    story: [
      // A. the meadow: Hedgehog's birthday - three; Bear promises the cake and counts the candles twice-over; each once;
      // the digits on an insert, the 3 traced
      async (c) => {
        c.show("jez");
        await Promise.all([c.enter("wiewiorka"), c.enter("mis", "right")]);
        await c.ujecie("zblizenie", { na: "jez" });                          // his joy
        await c.say("jez", "line.a_urodziny", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["jez", "wiewiorka"] });
        await c.say("wiewiorka", "line.a_ile_lat");
        await c.say("jez", "line.a_trzy", { anim: "Podskok" });
        await c.ujecie("ogolny");                                            // the candles come in over everyone
        const sw = [];
        for (let i = 0; i < 3; i++) sw.push(await c.object("swieczka", { x: -1.2 + i * 1.2, y: 1.2, size: 1.9 }));
        await c.say("mis", "line.a_swieczki", { anim: "Zgloszenie" });
        // the naive try: Bear counts and touches the middle one twice - it bumps twice; "four!"
        await c.ujecie("sredni", { na: ["mis", ...sw] });                    // the candles and Bear: the double touch shows
        const licze = c.say("mis", "line.a_licze_zle", { anim: "Wskazanie" });
        for (const k of [0, 1, 1, 2]) { await c.wait(c.fast ? 0.08 : 0.55); c.stage.bump(sw[k], 0.35); }
        await licze;
        await c.ujecie("zblizenie", { na: "mis" });                          // proud of his wrong answer
        await c.say("mis", "line.a_cztery", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // her surprise
        await c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.a_dwa_razy");
        await c.ujecie("sredni", { na: ["wiewiorka", ...sw] });              // the rule, the candles in the shot
        await c.say("wiewiorka", "line.a_kazda_raz", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.say("jez", "line.a_ty_policz");
        await c.count(sw, { who: "wiewiorka" });
        await c.say("wiewiorka", "line.a_trzy_swieczki");
        await c.ujecie("zblizenie", { na: "mis" });                          // he gets it
        await c.emocja("mis", "zarowka", { anim: "Kiwanie" });
        await c.say("mis", "line.a_rozumiem");
        // the method on a plain colour: the digits 1, 2, 3, drawn one after another; the child traces the 3
        await c.go({ kolor: "#fdf0d5", motyw: "cyfry" }, { ciecie: true });
        naMiejsca(c);
        await c.ujecie("dwuujecie", { na: ["jez", "wiewiorka"] });           // she tells him; the digits come wide
        await c.say("wiewiorka", "line.a_cyfry", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        for (const [i, n] of [1, 2, 3].entries()) { await c.digit(n, { x: -2.0 + i * 2.2, y: 1.3, size: 1.6 }); await c.say("wiewiorka", `line.a_cyfra${n}`); }
        await c.wait(0.4); c.clear();
        await c.ujecie("sredni", { na: ["jez"] });                           // his wish: the road for the 3 comes next, wide
        await c.say("jez", "line.a_narysuj_trzy", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const t = await c.slad(3, { x: 0, y: 0.4, size: 3.0 });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.a_moja_trojka", { anim: "Radosc" });
        t.remove(); c.clear();
        // back on the meadow: off to the thicket for the cake's raspberries
        await c.go("laka", { ciecie: true });
        naMiejsca(c);
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "mis"] });
        await c.say("mis", "line.a_po_maliny", { anim: "Machanie" });
      },
      // B. the raspberry thicket: how many for the cake? Grandma's recipe - the child counts its raspberries; the
      // sweetest hide under the leaves - rubbed off and counted; Squirrel's present joined from the smallest dot
      async (c) => {
        await c.go("malinowy_zagajnik", { enter: true });
        await Promise.all(["jez", "wiewiorka", "mis"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await c.play("mis", "Rozgladanie");
        await c.say("mis", "line.b_zagajnik", { anim: "Radosc" });           // the wide shot: the raspberry bushes in view
        await c.ujecie("zblizenie", { na: "jez" });                          // his worry
        await c.wonder("jez");
        await c.say("jez", "line.b_ile_malin");
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.b_przepis", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        // the recipe card: the child counts the raspberries on the drawn cake, each once - the last number says how many
        const przepis = await c.znalezisko("przepis_tort", { skad: "mis" });
        await c.say("wiewiorka", "line.b_przepis_policz");
        const licz = await c.count(przepis.cele, { who: "wiewiorka" });
        await c.say("wiewiorka", "line.b_przepis_trzy");
        licz?.znaczki?.forEach((z) => z.remove());                            // the digits go away with the card
        await przepis.remove();
        // the sweetest ones hide under the leaves: rub them off, count what is there
        await c.ujecie("dwuujecie", { na: ["jez", "wiewiorka"] });          // she knows where to look
        await c.say("wiewiorka", "line.b_pod_liscmi", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const z = await c.zdrapka("maliny_pod_liscmi");
        await c.say("jez", "line.b_sa_maliny", { anim: "Podskok" });
        await c.say("mis", "line.b_policz_maliny", { anim: "Zgloszenie" });
        const lz = await c.count(z.cele, { who: "mis" });
        await c.say("mis", "line.b_trzy", { anim: "Brawo" });
        lz?.znaczki?.forEach((q) => q.remove());
        await z.remove();
        // Bear picks the three into his basket
        const kosz = await c.object("koszyk", { x: 2.4, y: -2.5, size: 1.4 });
        for (let i = 0; i < 3; i++) {
          const m = await c.object("malina", { x: -1.0 + i * 1.0, y: 1.4, size: 0.8 });
          await m.moveTo(2.15 + i * 0.25, -2.2, c.fast ? 0.1 : 0.45); c.sfx("plop");
        }
        c.stage.bump(kosz, 0.2);
        // the breather: Squirrel's surprise present, joined from the smallest dot
        await c.ujecie("dwuujecie", { na: ["jez", "wiewiorka"] });
        await c.say("wiewiorka", "line.b_niespodzianka", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the dot card lies over the wide scene
        const k = await c.kropki("bebenek_prezent", { znaki: "wielkosc", wrong: "line.b_niespodzianka" });
        await c.ujecie("zblizenie", { na: "jez" });                          // his delight
        await c.emocja("jez", "serce", { anim: "Radosc" });
        await c.say("jez", "line.b_bebenek");
        await k.remove();
        await c.ujecie("ogolny");                                            // all three with the basket, ready to go
        await c.say("mis", "line.b_do_domu", { anim: "Machanie" });
        c.clear();
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("wiewiorka"); c.show("mis");
        S.puppets.wiewiorka.korzen.position.x = -5.2; S.puppets.mis.korzen.position.x = 5.0;
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.p_start", { anim: "Radosc" });
        // 1. how many apples? point to the digit
        {
          await c.ujecie("ogolny");                                          // the apples and the cards come in
          const ile = 1 + Math.floor(Math.random() * 3);
          const jb = []; for (let i = 0; i < ile; i++) jb.push(await c.object("jablko", { x: -1.6 + i * 1.6, y: 1.5, size: 1.5 }));
          const k = await karty(c, { xs: [-1.4, 0.3, 2.0] });
          await c.say("mis", "line.p_ile_jablek");
          const ok = k.find((q) => q.liczba === ile);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_ile_jablek_nie" });
          await c.ujecie("sredni", { na: [...jb, ok] });                     // the apples and their digit
          await c.say("wiewiorka", `line.p_jablka${ile}`, { anim: "Brawo" }); gw.dodaj();
          c.clear();
        }
        // 2. give Squirrel two acorns into her bowl; a third is refused
        {
          await c.ujecie("ogolny");
          await c.say("wiewiorka", "line.p_dwa", { anim: "Zgloszenie" });
          const r = await c.rozdaj({ komu: ["wiewiorka"], rzeczy: ["zoledz", "zoledz", "zoledz", "zoledz"], ile: 2, miski: "miska", rzeczyY: 1.4, rzeczySize: 1.1,
            wrong: "line.p_dwa_juz" });
          await c.ujecie("zblizenie", { na: "wiewiorka" });                  // her thank-you
          await c.say("wiewiorka", "line.p_dwa_ok", { anim: "Radosc" }); gw.dodaj();
          r.remove(); c.clear();
        }
        // 3. trace the 1 and the 2
        {
          await c.ujecie("ogolny");
          await c.say("mis", "line.p_rysuj");
          let t = await c.slad(1, { x: 0, y: 0.4, size: 2.8 }); t.remove();
          t = await c.slad(2, { x: 0, y: 0.4, size: 2.8 });
          await c.say("wiewiorka", "line.p_cyfry_ok", { anim: "Brawo" }); gw.dodaj();
          t.remove(); c.clear();
        }
        // 4. listen: how many drum beats?
        {
          const ile = 1 + Math.floor(Math.random() * 3);
          const b = await c.object("beben", { x: 0, y: 1.4, size: 1.6 });
          await c.ujecie("sredni", { na: ["mis", b] });                      // the drum talked about
          await c.say("mis", "line.p_sluchaj");
          await c.dzwieki(ile, { dzwiek: "beben", tempo: 0.7, rzecz: b });
          await c.ujecie("ogolny");                                          // the cards come in
          const k = await karty(c, { xs: [-1.4, 0.3, 2.0] });
          await c.say("mis", "line.p_ile_bum");
          const ok = k.find((q) => q.liczba === ile);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_ile_bum" });
          await c.say("wiewiorka", `line.p_bum${ile}`, { anim: "Brawo" }); gw.dodaj();
          c.clear();
        }
        // 5. which heap has three pears?
        {
          const kupki = [];
          for (const [i, n] of tasuj([1, 2, 3]).entries()) { const h = n > 1 ? await c.kupka("gruszka", n, { x: -2.4 + i * 2.4, y: 0.8, size: 1.6 }) : await c.object("gruszka", { x: -2.4 + i * 2.4, y: 0.8, size: 1.0 }); h.ile = n; kupki.push(h); }
          await c.say("wiewiorka", "line.p_trzy");
          const ok = kupki.find((h) => h.ile === 3);
          dobre(ok); await c.task({ targets: kupki, correct: ok, wrong: "line.p_trzy_nie" });
          await c.ujecie("sredni", { na: ["mis", ok] });                     // he counts the right heap
          await c.say("mis", "line.p_gruszki_ok", { anim: "Brawo" }); gw.dodaj();
          c.clear();
        }
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.praise("wiewiorka");
      },
    ],
    apply: [
      // home - the third act: the birthday party. Hedgehog counts his guests and counts Bear twice - four plates; the
      // method on an insert: one plate each, one left over; three plates on the painted table; the cake's raspberries
      // counted (as in the recipe); the candles by his age; blown out (seen); three hops for the parents
      async (c) => {
        const S = c.stage;
        for (const n of ["jez", "wiewiorka", "mis"]) c.show(n);
        naMiejsca(c);
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("ogolny");                                            // the kitchen, all three
        await c.say("mis", "line.d_w_domu", { anim: "Radosc" });
        // the misconception again: Hedgehog counts the guests and points at Bear twice
        await c.say("jez", "line.d_policze", { anim: "Zgloszenie" });
        const licze = c.say("jez", "line.d_licze_zle", { anim: "Wskazanie" });
        for (const who of ["wiewiorka", "mis", "mis", "jez"]) { await c.wait(c.fast ? 0.08 : 0.6); c.play(who, "Podskok"); }
        await licze;
        const tal = [];
        for (let i = 0; i < 4; i++) tal.push(await c.object("talerz", { x: -1.5 + i * 1.3, y: 1.6, size: 1.1 }));
        await c.ujecie("zblizenie", { na: "jez" });                          // proud of four
        await c.say("jez", "line.d_cztery", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // her surprise
        await c.emocja("wiewiorka", "wykrzyknik");
        await c.say("wiewiorka", "line.d_dwa_razy");
        await c.ujecie("sredni", { na: ["mis", ...tal] });                   // Bear and the four plates
        await c.say("mis", "line.d_kazdy_raz", { anim: "Kiwanie" });
        // the method on a plain colour: one plate for each of us
        await c.go({ kolor: "#fde4ec", motyw: "kola" }, { ciecie: true });
        naMiejsca(c, { jez: -4.6, wiewiorka: -1.2, mis: 4.6 });              // apart, so every heap lies by its owner
        await c.ujecie("ogolny");
        const t4 = [];
        for (let i = 0; i < 4; i++) t4.push(await c.object("talerz", { x: -1.95 + i * 1.3, y: 1.3, size: 1.1 }));
        await c.say("wiewiorka", "line.d_rozdaj");
        const r = await c.rozdaj({ komu: ["jez", "wiewiorka", "mis"], rzeczy: t4, ile: 1, miski: null, wrong: "line.d_kazdy_raz" });
        const zostal = t4.find((q) => !q.odbiorca) || t4[3];
        await c.ujecie("sredni", { na: ["jez", zostal] });                   // the plate nobody needs
        S.bump(zostal, 0.3);
        await c.say("jez", "line.d_zostal", { anim: "Radosc" });
        r.remove();
        // back in the kitchen: three plates on the painted table, one in front of each
        await c.go("dom", { ciecie: true });
        naMiejsca(c);
        const m = await c.miejsca(), st = m.stol, yS = st.y + 0.15;
        const xs = [-3.9, -1.9, 2.5];                                        // over Hedgehog's and Squirrel's heads, beside Bear
        await c.ujecie("ogolny");
        const t3 = [];
        for (let i = 0; i < 3; i++) t3.push(await c.object("talerz", { x: -1.3 + i * 1.3, y: 2.3, size: 1.0 }));
        await c.say("wiewiorka", "line.d_na_stol");
        const sl = await c.slots({ items: t3, slots: xs.map((x) => ({ x, y: yS, w: 1.4, h: 0.8, accept: () => true, rodzaj: "stoi" })), wrong: "line.d_na_stol" });
        await sl.done(); sl.remove();
        await c.ujecie("sredni", { na: ["jez", ...t3] });
        await c.say("jez", "line.d_kazdy", { anim: "Brawo" });
        // the cake: as many raspberries as in Grandma's recipe?
        await c.ujecie("ogolny");                                            // the cake comes onto the table
        const tort = await c.object("tort", { x: 0.3, y: yS + 0.75, size: 2.0 });
        const ml = [];
        for (let i = 0; i < 3; i++) ml.push(await c.object("malina", { x: -0.25 + i * 0.55, y: yS + 1.3, size: 0.55 }));
        await c.say("mis", "line.d_tort", { anim: "Zgloszenie" });
        const lm = await c.count(ml, { who: "mis" });
        await c.say("mis", "line.d_maliny_ok", { anim: "Radosc" });          // the counted raspberries stay in the shot
        lm?.znaczki?.forEach((q) => q.remove());
        // the candles: how old is Hedgehog? point to the digit (the cards come in on the floor)
        const k = await karty(c, { xs: [-0.5, 0.95, 2.4] });
        await c.say("wiewiorka", "line.d_ile_swieczek");
        const ok = k.find((q) => q.liczba === 3);
        dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.d_ile_swieczek_nie" }); dobre(ok, false);
        const sw = [];
        for (let i = 0; i < 3; i++) sw.push(await c.object("swieczka", { x: -0.25 + i * 0.55, y: yS + 1.85, size: 0.8 }));
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.d_trzy_lata", { anim: "Radosc" });
        // the payoff, seen: the three candles blown out
        const il = await c.ilustracja("zdmuchiwanie_swieczek", { ruch: "najazd" });
        await c.say("jez", "line.d_zdmuchuje");
        await c.say("wiewiorka", "line.d_sto_lat");
        await il.zsun();
        k.forEach((q) => { q.cyfra?.remove?.(); q.remove(); });                                        // the cards go; the party table stays for the hops
        // the home game, played: three birthday hops, counted out loud together
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.d_podskoki", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // everyone hops
        for (let n = 1; n <= 3; n++) {
          for (const who of ["jez", "wiewiorka", "mis"]) c.ruch(who, "skok");
          await c.say("mis", `line.n${n}`);
        }
        await c.ujecie("sredni", { na: ["mis"] });                           // the home task, said to the parents
        await c.say("mis", "line.d_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
