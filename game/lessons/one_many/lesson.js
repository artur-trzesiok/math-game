// Lesson: one or many? - one thing / many things, seen at a glance, before any numbers. Squirrel gathers her winter
// store: Fox brings one huge pumpkin as "a lot of food" (big is not many); a heap of nuts is many; the garden's harvest
// sorted onto the plate (one) and into the basket (many); a duckling alone found for Mother Duck; at home the store is
// a feast - one cake, many cherries. Script in scenario.md.

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
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_zima", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // Fox and the pumpkin roll in across the screen
        // Fox rolls in one enormous pumpkin
        const dynia = await c.object("dynia", { x: -7.5, y: -2.0, size: 1.9 });
        await Promise.all([c.enter("lisek"), dynia.moveTo(-0.6, -2.0, 1.6)]);       // between the characters, in plain view
        await c.ujecie("sredni", { na: ["lisek", dynia] });
        await c.say("lisek", "line.a_duzo", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.say("sarenka", "line.a_jedna", { anim: "Kiwanie" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_co_wiele");
        await c.ujecie("ogolny");
        // many: this one, and this, and this... each nut bumps as she points
        const orzechy = [];
        for (let i = 0; i < 6; i++) orzechy.push(await c.object("orzech", { x: 0.95 + (i % 3) * 0.7, y: -1.95 + Math.floor(i / 3) * 0.66, size: 0.6 }));   // apart: a heap of six, not overlapping
        await c.ujecie("sredni", { na: orzechy });
        await c.say("sarenka", "line.a_wiele", { anim: "Wskazanie" });
        for (const h of orzechy) { c.stage.bump(h, 0.35); await c.wait(0.3); }
        await c.ujecie("sredni", { na: [dynia, ...orzechy] });
        await c.say("sarenka", "line.a_nazwa");
        await c.ujecie("ogolny");
        // where is one, where are many
        const cele = [dynia, ...orzechy];
        await c.say("wiewiorka", "line.a_gdzie_jedna");
        dobre(dynia); await c.task({ targets: cele, correct: dynia, wrong: "line.a_to_wiele" }); dobre(dynia, false);
        await c.ujecie("sredni", { na: [dynia] });
        await c.say("sarenka", "line.a_tak_jedna");
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.a_gdzie_wiele");
        dobre(orzechy); await c.task({ targets: cele, correct: orzechy, wrong: "line.a_to_jedna" }); dobre(orzechy, false);
        await c.ujecie("sredni", { na: orzechy });
        await c.say("sarenka", "line.a_tak_wiele");
        await c.ujecie("ogolny");
        c.clear();
        // the harvest: onto the plate if one, into the basket if many
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.a_zbiory");
        await c.ujecie("ogolny");
        const plan = tasuj([["gruszka", 1], ["jablko", 5], ["grzyb", 1], ["zoledz", 6], ["marchewka", 1], ["listek", 5]]);
        const items = [];
        for (const [n, ile] of plan) items.push(await rzecz(c, n, ile, { y: ROW_Y }));
        c.arrange([items], { y: ROW_Y, gap: 0.2 });
        const zones = await pojemniki(c);
        await c.say("sarenka", "line.a_sortuj");
        await c.sort({ items, zones, wrong: "line.a_pomylka" });
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.a_dynia_tez", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });
        await c.say("wiewiorka", "line.a_do_strumyka");
        await c.ujecie("ogolny");
        c.clear();
      },
      // B. the brook: Mother Duck's many ducklings, one missing; the child finds the one alone; then a catching game
      async (c) => {
        await c.go("strumyk", { enter: true });
        await Promise.all(["wiewiorka", "lisek", "sarenka"].map((n) => c.enter(n)));
        // the family swims on the brook (the water runs across the middle of the picture)
        const mama = await c.object("kaczka_mama", { x: -0.9, y: 0.75, size: 1.9 });
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.emocja("sarenka", "wykrzyknik");
        await c.say("sarenka", "line.b_kaczka");
        await c.ujecie("sredni", { na: ["wiewiorka", mama] });
        await c.say("wiewiorka", "line.b_mama");
        const grupa = await c.kupka("kaczatko", 5, { x: 1.6, y: 0.55, size: 1.0 });       // ducklings half their mother's size
        await c.ujecie("sredni", { na: [mama, grupa] });
        await c.say("sarenka", "line.b_wiele_brak");
        await c.ujecie("ogolny");
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
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "serce", { anim: "Radosc" });
        await c.ujecie("sredni", { na: [mama, grupa, sam] });
        await c.say("lisek", "line.b_dziekuje");
        await c.ujecie("ogolny");
        // the breather: hide and seek - a duckling pops up here and there, catch it
        trzcina.remove(); sam.remove();
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.b_zabawa", { anim: "Podskok" });
        await c.ujecie("ogolny");
        for (const [x, y] of tasuj([[-2.6, 1.3], [0.4, 1.8], [2.6, 0.9], [-0.8, 0.6]]).slice(0, 3)) {
          const k = await c.object("kaczatko", { x, y, size: 0.75 });
          dobre(k); await c.task({ targets: [k], correct: k, wrong: "line.b_zabawa" });
          c.sfx("pop"); k.remove();
        }
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.b_do_domu", { anim: "Machanie" });
        await c.ujecie("ogolny");
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
        await c.ujecie("ogolny");
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
            await c.ujecie("ogolny");
          }
          gw.dodaj(); c.clear();
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
          await c.say("lisek", "line.p_kubki_ok");
          await c.ujecie("ogolny");
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
          await c.ujecie("ogolny");
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
      // home: the feast - one cake on the plate, many cherries in the bowl
      async (c) => {
        for (const n of ["lisek", "wiewiorka", "sarenka"]) c.show(n);
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.d_uczta", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const tort = await c.object("szarlotka", { x: -1.5, y: ROW_Y, size: 1.3 }); tort.tag = "jeden";
        const wisnie = [];
        for (let i = 0; i < 6; i++) { const h = await c.object("wisnia", { x: 0.4 + i * 0.7, y: ROW_Y, size: 0.7 }); h.tag = "wiele"; wisnie.push(h); }
        const zones = [await c.zone({ x: -0.8, y: ZY, w: 2.2, h: 1.6, image: "talerz", name: "talerz" }), await c.zone({ x: 2.0, y: ZY, w: 2.2, h: 1.6, image: "miska", name: "miska" })];
        zones[0].want = "jeden"; zones[1].want = "wiele";
        await c.say("sarenka", "line.d_nakryj");
        await c.sort({ items: [tort, ...wisnie], zones, wrong: "line.d_pomylka" });
        await c.ujecie("sredni", { na: [tort, ...wisnie] });                 // the laid table
        await c.say("sarenka", "line.d_gotowe", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.d_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
