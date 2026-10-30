// Lesson: one or many? - one thing / many things, seen at a glance, before any numbers. Squirrel gathers her winter
// store: Fox brings one huge pumpkin as "a lot of food" (big is not many); a heap of nuts is many; the garden's harvest
// sorted onto the plate (one) and into the basket (many); a kite in the autumn wind (the breather); a duckling alone
// found for Mother Duck; the first snow at night, and in the morning one cabbage and many carrots under the snow. At
// home the store goes onto the shelves (Fox puts the huge pumpkin with "the many" again), the table is laid, the guests
// come - one hedgehog, many ducklings - and the feast. Script in scenario.md.

const ROW_Y = 1.45, ZY = -2.25;
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
// one thing or a heap of it, tagged for the plate / the basket
const rzecz = async (c, name, ile, o = {}) => {
  const h = ile > 1 ? await c.kupka(name, ile, { size: 1.15, ...o }) : await c.object(name, { size: 0.95, ...o });
  h.tag = ile > 1 ? "wiele" : "jeden"; return h;
};
const pojemniki = async (c, { xs = [-0.55, 2.05], w = 2.2, h = 1.9 } = {}) => {   // clear of Squirrel's tail
  const z = [await c.zone({ x: xs[0], y: ZY, w, h, image: "talerz", name: "talerz" }), await c.zone({ x: xs[1], y: ZY, w, h, image: "koszyk", name: "koszyk" })];
  z[0].want = "jeden"; z[1].want = "wiele"; return z;
};
const cienie = (c, h, on = true) => { c.cien(h, on); for (const d of h.dzieci || []) c.cien(d, on); };
// the pumpkin and the nuts side by side, between the characters
const dyniaOrzechy = async (c) => {
  const dynia = await c.object("dynia", { x: -0.6, y: -2.0, size: 1.9 });
  const orzechy = [];
  for (let i = 0; i < 6; i++) orzechy.push(await c.object("orzech", { x: 0.95 + (i % 3) * 0.7, y: -1.95 + Math.floor(i / 3) * 0.66, size: 0.6 }));   // apart: a heap of six, not overlapping
  return { dynia, orzechy };
};

export default {
  id: "one_many",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -5.0 }, wiewiorka: { side: "left", x: -2.9 }, sarenka: { side: "right", x: 4.8 } },
  backgrounds: { story: "ogrod", practice: { kolor: "#f6dfb2", motyw: "liscie" }, apply: "dom" },
  stages: {
    story: [
      // A. the garden: Fox's one huge pumpkin is "a lot of food"; one, but big; many is lots of things
      async (c) => {
        c.czastki("liscie", { wiatr: 0.4 });
        c.show("wiewiorka"); c.show("sarenka");
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });       // the two friends in the autumn garden
        await c.say("wiewiorka", "line.a_zima", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // Fox and the pumpkin roll in across the screen
        const dynia0 = await c.object("dynia", { x: -7.5, y: -2.0, size: 1.9 });
        await Promise.all([c.enter("lisek"), dynia0.moveTo(-0.6, -2.0, 1.6)]);
        await c.ujecie("sredni", { na: ["lisek", dynia0] });
        await c.say("lisek", "line.a_duzo", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["sarenka", dynia0] });               // Deer talks about the pumpkin: it is in the shot
        await c.say("sarenka", "line.a_jedna", { anim: "Kiwanie" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // the question that starts the lesson
        await c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.a_co_wiele");
        // the method on a plain colour: one pumpkin, and many nuts - this one, and this, and this...
        await c.go({ kolor: "#f6dfb2", motyw: "liscie" }, { ciecie: true });
        let { dynia, orzechy } = await dyniaOrzechy(c);
        await c.ujecie("sredni", { na: ["sarenka", ...orzechy] });
        await c.say("sarenka", "line.a_wiele", { anim: "Wskazanie" });
        for (const h of orzechy) { c.stage.bump(h, 0.35); await c.wait(0.3); }
        await c.ujecie("sredni", { na: [dynia, ...orzechy] });
        await c.say("sarenka", "line.a_nazwa");
        // back in the garden: the child shows it
        await c.go("ogrod", { ciecie: true });
        c.czastki("liscie", { wiatr: 0.4 });
        ({ dynia, orzechy } = await dyniaOrzechy(c));
        const cele = [dynia, ...orzechy];
        // the game's one rule, told once in the first lesson: a white edge = your turn, touch it; no edge = listen
        await c.ujecie("sredni", { na: ["lisek", ...cele] });
        c.obwodka(cele); await c.wait(0.4);
        await c.say("lisek", "line.a_obwodka", { anim: "Wskazanie" });
        c.obwodka(cele, false); await c.wait(0.5);
        await c.say("lisek", "line.a_sluchaj");
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.a_gdzie_jedna");
        dobre(dynia); await c.task({ targets: cele, correct: dynia, wrong: "line.a_to_wiele" }); dobre(dynia, false);
        await c.ujecie("sredni", { na: [dynia] });
        await c.say("sarenka", "line.a_tak_jedna");
        await c.ujecie("ogolny");                                            // the next question: every option in the shot
        await c.say("wiewiorka", "line.a_gdzie_wiele");
        dobre(orzechy); await c.task({ targets: cele, correct: orzechy, wrong: "line.a_to_jedna" }); dobre(orzechy, false);
        await c.ujecie("sredni", { na: orzechy });
        await c.say("sarenka", "line.a_tak_wiele");
        c.clear();
        // the harvest: onto the plate if one, into the basket if many
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });
        await c.say("wiewiorka", "line.a_zbiory");
        await c.ujecie("ogolny");                                            // the harvest appears over the heads, the sort is wide
        const plan = tasuj([["gruszka", 1], ["jablko", 5], ["grzyb", 1], ["zoledz", 6], ["marchewka", 1], ["listek", 5]]);
        const items = [];
        for (const [n, ile] of plan) items.push(await rzecz(c, n, ile, { y: ROW_Y }));
        c.arrange([items], { y: ROW_Y, gap: 0.2 });
        const zones = await pojemniki(c);
        await c.say("sarenka", "line.a_sortuj");
        await c.sort({ items, zones, wrong: "line.a_pomylka" });
        await c.ujecie("zblizenie", { na: "lisek" });                        // Fox laughs at himself
        await c.say("lisek", "line.a_dynia_tez", { anim: "Radosc" });
        c.clear();
        // the breather: the autumn wind - Fox's kite
        await c.ujecie("ogolny");                                            // the wind blows over the whole scene, the kite climbs across the sky
        c.czastki("liscie", { wiatr: 1.4 });
        await c.say("lisek", "line.a_wiatr", { anim: "Podskok" });
        await c.latawiec({ ksztalt: "latawiec_trojkat", kto: "lisek" });
        c.czastki("liscie", { wiatr: 0.4 });
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });
        await c.say("wiewiorka", "line.a_do_strumyka");
        c.clear();
      },
      // B. the brook: Mother Duck's many ducklings, one missing; the child finds the one alone; she is invited
      async (c) => {
        await c.go("strumyk", { enter: true });
        await Promise.all(["wiewiorka", "lisek", "sarenka"].map((n) => c.enter(n)));
        const mama = await c.object("kaczka_mama", { x: -0.9, y: 0.75, size: 1.9 });
        await c.ujecie("zblizenie", { na: "sarenka" });                      // the alarm
        await c.emocja("sarenka", "wykrzyknik");
        await c.say("sarenka", "line.b_kaczka");
        await c.ujecie("sredni", { na: ["wiewiorka", mama] });
        await c.say("wiewiorka", "line.b_mama");
        const grupa = await c.kupka("kaczatko", 5, { x: 1.6, y: 0.55, size: 1.0 });       // ducklings half their mother's size
        await c.ujecie("sredni", { na: [mama, grupa] });
        await c.say("sarenka", "line.b_wiele_brak");
        await c.ujecie("ogolny");                                            // the reeds come in: the whole brook to search
        const sam = await c.object("kaczatko", { x: -3.1, y: 0.05, size: 0.6 });             // far from the others, in the water by the reeds
        const trzcina = await c.object("trzcina", { x: -3.75, y: 0.3, size: 1.5, z: 0.45 });
        await c.say("wiewiorka", "line.b_gdzie");
        dobre(sam); await c.task({ targets: [grupa, sam], correct: sam, wrong: "line.b_to_wiele" }); dobre(sam, false);
        await c.ujecie("sredni", { na: [sam, trzcina] });
        await c.rozblysk(sam);
        await c.say("sarenka", "line.b_jest", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the duckling swims across to its family
        await sam.moveTo(2.4, 0.55, 1.4);
        c.stage.bump(mama, 0.3);
        await c.ujecie("sredni", { na: [mama, grupa, sam] });
        c.emocja("wiewiorka", "serce", { anim: "Radosc" });
        await c.say("lisek", "line.b_dziekuje");
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });         // the invitation, the way home
        await c.say("wiewiorka", "line.b_do_domu", { anim: "Machanie" });
        c.clear();
      },
      // C. the first snow: at night it falls (an event illustration); in the morning the garden is white - under the snow
      // one cabbage and many carrots (a scratch-off); they go to the feast
      async (c) => {
        const il = await c.ilustracja("pierwszy_snieg", { ruch: "najazd" });
        await c.say("wiewiorka", "line.c_noc");
        await il.zsun();
        await c.go("ogrod_zima", { enter: true });
        await Promise.all(["wiewiorka", "lisek", "sarenka"].map((n) => c.enter(n)));
        c.czastki("snieg", { gestosc: 0.5 });
        await c.ujecie("zblizenie", { na: "sarenka" });                      // cold, and worried
        await c.emocja("sarenka", "zimno", { anim: "Smutek" });
        await c.say("sarenka", "line.c_rano");
        await c.ujecie("ogolny");                                            // the snowy garden, the picture flies up from it
        await c.say("wiewiorka", "line.c_zetrzyj");
        const z = await c.zdrapka("snieg_ogrodek");
        await c.say("lisek", "line.c_marchewki", { anim: "Radosc" });
        dobre(z.cele); await c.task({ targets: [...z.cele, z.tlo], correct: z.cele, wszystkie: true, wrong: "line.c_marchewki_nie" }); dobre(z.cele, false);
        await c.say("wiewiorka", "line.c_mamy", { anim: "Podskok" });
        await z.remove();
        c.clear();
      },
    ],
    practice: [
      // checking the store: five games, a star each
      async (c) => {
        const S = c.stage;
        c.show("lisek"); c.show("wiewiorka");
        S.puppets.lisek.korzen.position.x = -5.3; S.puppets.wiewiorka.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.p_start", { anim: "Radosc" });
        // 1. listen: one clap or many claps
        {
          const raz = await c.object("ruch_klask", { x: -1.6, y: 0.9, size: 1.3 }), wiele = await c.kupka("ruch_klask", 5, { x: 1.6, y: 0.9, size: 1.7 });
          for (const ile of tasuj([1, 6])) {                                 // both, in a random order: a guess is not enough
            const ok = ile === 1 ? raz : wiele;
            await c.ujecie("sredni", { na: ["lisek"] });
            await c.say("lisek", "line.p_sluchaj");
            await c.ujecie("ogolny");
            await c.dzwieki(ile, { kto: "lisek", ruch: "klask", tempo: 0.55 });
            await c.say("lisek", "line.p_ile_razy");
            dobre(ok); await c.task({ targets: [raz, wiele], correct: ok, wrong: "line.p_ile_razy" }); dobre(ok, false);
            await c.ujecie("zblizenie", { na: "wiewiorka" });
            await c.say("wiewiorka", ile === 1 ? "line.p_raz" : "line.p_wiele_razy");
          }
          gw.dodaj(); c.clear();
          await c.ujecie("ogolny");                                          // the cups: both in the shot
        }
        // 2. cups: one acorn under one, many under the other
        {
          const k = await c.kubki({ ile: 2, x: 0, odstep: 3.0, rzeczy: tasuj(["zoledz", { name: "zoledz", ile: 6 }]) });
          await c.say("wiewiorka", "line.p_kubki");
          await c.wait(1.2); await k.przykryj(); await k.tasuj(3);
          const ok = k.kubki.find((q) => q.pod?.ile > 1);
          await c.say("wiewiorka", "line.p_gdzie_wiele");
          dobre(ok); const hit = await c.task({ targets: k.kubki, correct: ok, wrong: "line.p_kubki_nie", onWrong: async (h) => { await k.odkryj(h); await c.say("wiewiorka", "line.p_kubki_nie"); } });
          await k.odkryj(hit);
          await c.ujecie("zblizenie", { na: "lisek" });
          await c.say("lisek", "line.p_kubki_ok");                         // Fox stays in the shot: the memory game is his
          gw.dodaj(); c.clear();
        }
        // 3. memory: one with one, many with many
        {
          await c.ujecie("sredni", { na: ["lisek"] });
          await c.say("lisek", "line.p_memory");
          await c.ujecie("ogolny");
          await c.memory([[{ obraz: "jablko" }, { obraz: "jablko" }], [{ obraz: "jablko", ile: 5 }, { obraz: "jablko", ile: 5 }], [{ obraz: "orzech" }, { obraz: "orzech" }], [{ obraz: "orzech", ile: 5 }, { obraz: "orzech", ile: 5 }]]);
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_memory_ok");
          gw.dodaj(); c.clear();
        }
        // 4. shadows: one pear's or many pears'
        {
          const wiele = Math.random() < 0.5;
          const cien = wiele ? await c.kupka("gruszka", 5, { x: 0, y: 1.5, size: 2.0 }) : await c.object("gruszka", { x: 0, y: 1.5, size: 1.5 });
          cienie(c, cien);
          const jedna = await c.object("gruszka", { x: -1.7, y: -1.9, size: 1.35 }), kilka = await c.kupka("gruszka", 5, { x: 1.7, y: -1.9, size: 1.4 });
          await c.ujecie("sredni", { na: [cien] });                          // the shadow first, then the options
          await c.say("lisek", "line.p_cien");
          await c.ujecie("ogolny");
          const ok = wiele ? kilka : jedna;
          dobre(ok); await c.task({ targets: [jedna, kilka], correct: ok, wrong: "line.p_cien_nie" });
          cienie(c, cien, false);
          await c.ujecie("sredni", { na: [cien, ok] });
          await c.say("wiewiorka", wiele ? "line.p_cien_wiele" : "line.p_cien_jedna");
          await c.ujecie("ogolny");
          gw.dodaj(); c.clear();
        }
        // 5. one among many: many stars, one moon
        {
          const gw5 = [];
          for (const [x, y] of [[-3.4, 2.2], [-1.6, 1.0], [0.2, 2.4], [1.4, 0.6], [3.0, 2.0], [-2.6, -0.4], [0.8, -0.8], [2.8, -0.2]]) gw5.push(await c.object("gwiazdka", { x, y, size: 0.75 }));
          const ks = await c.object("ksiezyc", { x: -0.6, y: 0.4, size: 1.5 });
          await c.say("lisek", "line.p_niebo");
          dobre(ks); await c.task({ targets: [...gw5, ks], correct: ks, wrong: "line.p_niebo_nie" });
          await c.ujecie("sredni", { na: [ks] });
          await c.say("wiewiorka", "line.p_niebo_ok");
          await c.ujecie("ogolny");
          gw.dodaj(); c.clear();
        }
        await c.praise("wiewiorka");
      },
    ],
    apply: [
      // home - the third act in the kitchen: the store onto the painted shelves (Fox puts the huge pumpkin with "the many"
      // again - it is one), the table laid, the guests come (one hedgehog, many ducklings), the feast
      async (c) => {
        for (const n of ["lisek", "wiewiorka", "sarenka"]) c.show(n);
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        const m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sarenka"] });       // home, the plan
        await c.say("wiewiorka", "line.d_uczta", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the store and the shelves in one shot
        const dynia = await c.object("dynia", { x: 0.6, y: -2.2, size: 1.1 }); dynia.tag = "jeden";   // shelf-sized
        const orzechy = await c.kupka("orzech", 6, { x: 2.4, y: -2.2, size: 0.8 }); orzechy.tag = "wiele";
        await c.say("sarenka", "line.d_polki");
        // Fox's mistake, played: the huge pumpkin onto the shelf of the many
        await c.ujecie("sredni", { na: ["lisek", dynia] });
        await c.say("lisek", "line.d_dynia_lis", { anim: "Radosc" });
        await c.take("lisek", dynia);
        await c.put("lisek", m.polka_dolna.x + 0.4, m.polka_dolna.y + 0.3);
        await c.ujecie("zblizenie", { na: "sarenka" });                      // the objection
        await c.wonder("sarenka");
        await c.say("sarenka", "line.d_dynia_nie");
        await c.ujecie("ogolny");                                            // the shelves are the task: all in the shot
        const t1 = await c.slots({ items: [dynia], slots: [m.polka_gorna.slot((h) => h === dynia)], wrong: "line.d_polka_nie" });
        await t1.done();
        await c.say("wiewiorka", "line.d_orzechy");
        const t2 = await c.slots({ items: [orzechy], slots: [m.polka_dolna.slot((h) => h === orzechy)], wrong: "line.d_polka_nie" });
        await t2.done();
        await c.ujecie("zblizenie", { na: "lisek" });                        // Fox gets it
        await c.say("lisek", "line.d_polki_ok", { anim: "Zgloszenie" });
        // the table: one cake on the plate, many cherries in the bowl - on the painted table
        await c.ujecie("ogolny");
        // the containers first, then the things well above them: touching the plate, the cake read as already put away
        const zy = m.stol.y + 0.35;
        const zones = [await c.zone({ x: -0.8, y: zy, w: 2.2, h: 1.6, image: "talerz", name: "talerz" }), await c.zone({ x: 2.0, y: zy, w: 2.2, h: 1.6, image: "miska", name: "miska" })];
        await c.wait(0.5);                                                    // measured grown, not mid pop-in
        const nadZ = Math.max(...zones.map((z) => c.stage.bounds(z).top)) + 0.6;
        const tort = await c.object("szarlotka", { x: -1.5, y: nadZ + 0.6, size: 1.3 }); tort.tag = "jeden";
        const wisnie = [];
        for (let i = 0; i < 6; i++) { const h = await c.object("wisnia", { x: 0.4 + i * 0.7, y: nadZ + 0.35, size: 0.7 }); h.tag = "wiele"; wisnie.push(h); }
        zones[0].want = "jeden"; zones[1].want = "wiele";
        await c.say("sarenka", "line.d_nakryj");
        await c.sort({ items: [tort, ...wisnie], zones, wrong: "line.d_pomylka" });
        await c.ujecie("sredni", { na: [tort, ...wisnie] });                 // the laid table
        await c.say("sarenka", "line.d_gotowe", { anim: "Radosc" });
        // the guests: one hedgehog from one side, many ducklings from the other
        await c.ujecie("ogolny");
        c.sfx("tap"); await c.wait(0.2); c.sfx("tap");
        await c.say("sarenka", "line.d_goscie");
        const jez = await c.object("jez", { x: 7.5, y: -2.45, size: 1.1 }), kaczatka = await c.kupka("kaczatko", 5, { x: -7.5, y: -2.55, size: 1.1 });
        await Promise.all([jez.moveTo(3.1, -2.45, 1.3), kaczatka.moveTo(0.4, -2.55, 1.6)]);
        await c.say("wiewiorka", "line.d_kto_sam");
        dobre(jez); await c.task({ targets: [jez, kaczatka], correct: jez, wrong: "line.d_kto_sam_nie" }); dobre(jez, false);
        await c.ujecie("sredni", { na: [jez, kaczatka] });
        await c.say("lisek", "line.d_jez", { anim: "Radosc" });
        // the feast: everybody at the table (an event illustration), then the task for the parents
        const il = await c.ilustracja("uczta_zima", { ruch: "najazd" });
        await c.say("wiewiorka", "line.d_uczta_ok");
        await il.zsun();
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.d_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
