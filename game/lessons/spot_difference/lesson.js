// Lesson: spot the difference - look carefully at two pictures and find what is not the same. The magic pond on the
// meadow plays tricks: Fox's reflection has no scarf (a quick look says "the same!"); the pond's own pictures on an
// insert; Owl's drawing for her granny and the pond's copy - the differences tell which is hers; the pond's fish fed
// (the breather); the walk to Granny's oak over the brook (stones laid by the child); the drawing left at her door
// (owls sleep by day). Practice: three picture pairs, what is gone, which one is not like the others. At home, the third
// act: the toys put in their places in the evening, Granny finds the drawing at night, in the morning "all the same!" -
// two toys swapped and a feather left: she came to say thank you; the game for the parents shown in play.
// Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wyrosnij = (c) => c.stage.tween(0.4, () => {});                  // let things popping in reach their size before a shot frames them
const WODA = -0.6;                                    // the pond's edge, where Fox stands to look in
const DRZWI_BABCI = { x: -4.95, y: 2.55 };            // just under the little round door high in Granny's oak (dab_babci; the door itself is above SUFIT)
const BROD = 1.8;                                     // droga_do_debu: the last area - the brook in the middle, the oak on the hill beyond
const KAMIENIE = [[-1.55, -3.0], [-0.7, -3.05], [0.15, -3.1]];   // the stepping stones across the brook (on BROD)

// eyes closed: the things hide for a moment (a soft fade), something changes, they come back
async function zamknijOczy(c, rzeczy, zmiana) {
  for (const h of rzeczy) h.mesh.visible = false;
  await c.wait(1.4);
  await zmiana();
  for (const h of rzeczy) if (!h.usuniety) { h.mesh.visible = true; c.stage.appear(h, true); }
}
// a sticker stood with its drawn bottom on y (things on a sill or a rug keep their feet where they were)
let wieczor = null;                                   // where the toys were put in the evening (the morning scene reads it)
const postaw = (c, h, x, dol) => { h.mesh.position.x = x; h.mesh.position.y += dol - c.bounds(h).bottom; };

export default {
  id: "spot_difference",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -4.8 }, sowa: { side: "right", x: 4.8 } },
  backgrounds: { story: "laka", practice: { kolor: "#e3f0d6", motyw: "kola" }, apply: "pokoj_noc" },
  stages: {
    story: [
      // A. the magic pond: Fox's reflection - "the same as me!" at a glance; looked at carefully, no scarf
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.ubierz("lisek", "szalik");
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.a_staw", { anim: "Wskazanie" });
        await c.ujecie("ogolny");                                            // Fox walks to the water
        await c.przejdz("lisek", [[0, WODA]]);
        let o = await c.odbicie("lisek", { woda: WODA, ubrania: ["szalik"], rozne: ["szalik"] });
        await c.ujecie("sredni", { na: ["lisek", o.odbicie] });             // Fox and his reflection
        await c.say("lisek", "line.a_takie_samo", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });             // Owl objects: a dialogue
        await c.say("sowa", "line.a_uwaznie");
        await c.ujecie("ogolny");                                            // the task: Fox and the water in the shot
        await c.say("sowa", "line.a_znajdz");
        await o.znajdz();
        await c.ujecie("zblizenie", { na: "lisek" });                        // the surprise
        await c.emocja("lisek", "wykrzyknik");
        await c.say("lisek", "line.a_bez_szalika");
        await c.ujecie("sredni", { na: ["sowa", o.odbicie] });               // what a difference is, the reflection in the shot
        await c.say("sowa", "line.a_roznica", { anim: "Zgloszenie" });
        // a second trick: a hat and glasses on - the reflection has no glasses, and a winter cap instead of the hat
        o.remove(); c.zdejmij("lisek");
        await c.say("lisek", "line.a_jeszcze", { anim: "Radosc" });
        o = await c.odbicie("lisek", { woda: WODA, ubrania: ["kapelusz", "okulary", "szalik"], rozne: ["kapelusz", "okulary"], zamiana: { kapelusz: "czapka_zimowa" } });
        await c.ujecie("ogolny");
        await c.say("sowa", "line.a_dwie");
        await o.znajdz();
        await c.ujecie("sredni", { na: ["lisek", o.odbicie] });
        await c.say("lisek", "line.a_dwie_zamiana", { anim: "Brawo" });
        o.remove(); c.zdejmij("lisek");
        await c.ujecie("ogolny");                                            // Fox steps back from the water
        await c.walkTo("lisek", -5.4);
        c.clear();
      },
      // B. the pond's pictures (an insert: the meadow fades, the pond shows them); Owl's drawing and the pond's copy;
      // back at the pond its fish are fed (the breather)
      async (c) => {
        const S = c.stage;
        await c.go({ kolor: "#dcecf2", motyw: "kola" }, { ciecie: true });   // the pond shows its pictures: the meadow fades
        S.puppets.lisek.korzen.position.x = -5.4; S.puppets.sowa.korzen.position.x = 5.4;     // at the edges: the pictures fill the middle
        await c.say("sowa", "line.b_gra");                                   // the method, said over the two pictures
        const r1 = await c.roznice("laka", { size: 3.85 });
        await c.ujecie("zblizenie", { na: "lisek" });                        // a cheer
        await c.say("lisek", "line.b_gra_ok", { anim: "Radosc" });
        r1.remove();
        // helping: Owl's drawing for her granny, and the copy the pond made
        const il = await c.ilustracja("staw_kopia", { ruch: "najazd" });    // the pond's copy, seen
        await c.say("sowa", "line.b_rysunek");
        await il.zsun();
        await c.ujecie("zblizenie", { na: "sowa" });                         // worried
        await c.emocja("sowa", "pot", { anim: "Smutek" });
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });
        await c.say("lisek", "line.b_pomoge");
        await c.ujecie("ogolny");                                            // the two drawings: every option in the shot
        const r2 = await c.roznice("rysunek", { size: 3.85 });
        await c.say("lisek", "line.b_roznice_ok", { anim: "Wskazanie" });   // what the differences showed
        await c.say("sowa", "line.b_ktory");
        dobre(r2.obrazy[0]); await c.task({ targets: r2.obrazy, correct: r2.obrazy[0], wrong: "line.b_ktory_nie" });
        await c.ujecie("zblizenie", { na: "sowa" });                         // thank you
        await c.emocja("sowa", "serce", { anim: "Radosc" });
        await c.say("sowa", "line.b_moj");
        r2.remove();
        // back at the pond: a hungry fish - bread for it, a thank-you for the game
        await c.go("laka", { ciecie: true });
        S.puppets.lisek.korzen.position.x = -4.8; S.puppets.sowa.korzen.position.x = 4.8;
        const RYBA = { x: 2.4, y: 0.15, size: 1.5 };                          // in the water of the pond
        const ryba = await c.object("rybka", RYBA);
        await c.ujecie("sredni", { na: ["sowa", ryba] });
        await c.say("sowa", "line.b_rybki_karma", { anim: "Wskazanie" });
        await c.ujecie("ogolny");                                            // the bread over the heads, the fish in the water
        await c.say("lisek", "line.b_rybki_jak_karma");
        ryba.remove();                                                       // the game's own fish takes its place
        await c.karmienie({ zwierze: "rybka", jedzenie: ["karma_rybki", "karma_rybki", "karma_rybki"], fuj: ["szyszka"], kto: "lisek", ...RYBA });
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });
        await c.say("lisek", "line.b_rybki_ok", { anim: "Radosc" });
        await c.say("lisek", "line.b_do_babci", { anim: "Machanie" });
        c.clear();
      },
      // C. the walk to Granny's oak: the path, the brook (the child lays the stepping stones), the oak on the hill
      async (c) => {
        const S = c.stage;
        await c.go("droga_do_debu", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await Promise.all([c.walkTo("lisek", -5.1), c.walkTo("sowa", -2.9)]);                                       // both on the path, setting out to the right
        await c.say("sowa", "line.c_droga", { anim: "Wskazanie" });
        await c.pan(BROD, { idz: ["lisek", "sowa"], d: 2.4 });
        await c.ujecie("zblizenie", { na: "lisek" });                        // oh no
        await c.emocja("lisek", "wykrzyknik");
        await c.say("lisek", "line.c_strumyk");
        await c.ujecie("ogolny");                                            // the brook and the stones: the task
        const kamienie = [];
        for (const [i, x] of [2.4, 3.6, 4.8].entries()) kamienie.push(await c.object("kamien_schodek", { x, y: 1.3 + (i % 2) * 0.25, size: 0.8 }));
        await c.say("sowa", "line.c_kamienie");
        const t = await c.slots({ items: kamienie, slots: KAMIENIE.map(([x, y]) => ({ x, y, w: 0.8, h: 0.7, accept: () => true })) });
        await t.done();
        t.remove();
        // they hop across, stone by stone, and go on along the path
        for (const n of ["sowa", "lisek"]) await c.przejdz(n, [...KAMIENIE.map(([x, y]) => [x, y + 0.25]), [n === "lisek" ? 1.6 : 3.6, -3.3]], { skok: 0.6, glebia: 0 });   // Owl first: she stands nearer the water
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });
        await c.say("lisek", "line.c_hop", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the oak on the hill in the shot
        await c.say("sowa", "line.c_widac", { anim: "Wskazanie" });
        c.clear();
      },
      // D. Granny Owl's old oak: the drawing is left by her door (by day she sleeps); home before dark
      async (c) => {
        const S = c.stage;
        await c.go("dab_babci", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.play("lisek", "Rozgladanie");
        await c.say("sowa", "line.c_dab", { anim: "Wskazanie" });             // wide: the door high in the oak in view
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });
        await c.say("lisek", "line.c_zapukaj", { anim: "Radosc" });
        await c.say("sowa", "line.c_spi", { anim: "Zgloszenie" });
        // the drawing flies from Owl up to the little door and stays there
        await c.ujecie("ogolny");
        const laurka = await c.object("laurka", { x: 2.4, y: 0.6, size: 1.2 });           // the drawing alone (the pair's picture has the wall)
        await wyrosnij(c);
        await laurka.moveTo(DRZWI_BABCI.x, DRZWI_BABCI.y, 0.9);
        c.sfx("pop"); await S.tween(0.4, (s) => { laurka.base = 1.2 - 0.3 * s; laurka.mesh.scale.setScalar(laurka.base); });
        await c.rozblysk(laurka);
        await c.say("lisek", "line.c_czeka", { anim: "Brawo" });               // wide: a closer shot cuts the door off
        await c.say("sowa", "line.b_do_domu", { anim: "Machanie" });
        c.clear();
      },
    ],
    practice: [
      // five games, a star each
      async (c) => {
        const S = c.stage;
        c.show("lisek"); c.show("sowa");
        S.puppets.lisek.korzen.position.x = -5.4; S.puppets.sowa.korzen.position.x = 5.4;
        const gw = c.gwiazdki(5, { auto: false });
        await wyrosnij(c);
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        for (const [i, para] of ["ogrodek", "plaza", "pokoik"].entries()) {
          await c.say(i % 2 ? "lisek" : "sowa", `line.p_para_${para}`);
          const r = await c.roznice(para, { size: 3.85 });
          await c.ujecie("zblizenie", { na: i % 2 ? "sowa" : "lisek" });     // the cheer between rounds
          await c.say(i % 2 ? "sowa" : "lisek", "line.p_para_ok", { anim: "Radosc" });
          r.remove(); gw.dodaj();
          if (i < 2) await c.ujecie("ogolny");                              // the next pair; after the last the row comes up close
        }
        // what is gone: three rounds, the row grows (four, then five things); eyes closed; one disappears
        for (const [runda, zestaw] of [["jablko", "gruszka", "marchewka", "grzyb"], ["pilka", "misiu", "klocek", "kubek", "but"], ["szyszka", "zoledz", "kasztan", "lisc_czerwony", "kwiatek"]].entries()) {
          const nazwy = tasuj(zestaw), krok = nazwy.length > 4 ? 1.35 : 1.6, x0 = -0.15 - ((nazwy.length - 1) * krok) / 2, rzad = [];
          for (const [i, n] of nazwy.entries()) rzad.push(await c.object(n, { x: x0 + i * krok, y: 1.3, size: 1.05 }));
          await wyrosnij(c);
          await c.ujecie("sredni", { na: rzad });                           // the row to remember, close
          await c.say("lisek", runda ? "line.p_jeszcze_raz" : "line.p_zapamietaj");
          await c.wait(1.5 + runda * 0.5);
          await c.say("lisek", "line.p_zamknij");
          await c.ujecie("ogolny");                                          // the row fades: wide, the task follows
          const znika = rzad[Math.floor(Math.random() * rzad.length)];
          await zamknijOczy(c, rzad, async () => { znika.usuniety = true; znika.remove(); });
          // the row framed, a "?" in the gap: the child sees where to look
          const xa = x0 - 0.85, xb = x0 + (nazwy.length - 1) * krok + 0.85;
          await c.line([[xa, 2.05], [xb, 2.05], [xb, 0.55], [xa, 0.55], [xa, 2.05]], { color: "#1f5fbf", width: 0.07, duration: 0.5, strong: true });
          await c.sign("?", { x: znika.mesh.position.x, y: 1.3, size: 1.0 });
          const inne = tasuj(zestaw.filter((n) => n !== znika.name)).slice(0, 1).concat(tasuj(["pilka", "kubek", "misiu", "jablko", "lyzka"].filter((n) => !zestaw.includes(n))).slice(0, 1));
          const opcje = [];
          for (const [i, n] of tasuj([znika.name, ...inne]).entries()) { const h = await c.object(n, { x: -2.0 + i * 2.0, y: -1.8, size: 1.1, plik: rzad.find((q) => q.name === n)?.plik ?? null }); opcje.push(h); }   // the very picture of the row
          await c.say("lisek", "line.p_co_zniknelo");
          const ok = opcje.find((h) => h.name === znika.name);
          dobre(ok); await c.task({ targets: opcje, correct: ok, wrong: "line.p_co_zniknelo_nie" });
          await c.ujecie("sredni", { na: [ok, "sowa"] });
          await c.say("sowa", "line.p_co_zniknelo_ok");
          c.clear();                                                         // the next row comes up close
        }
        gw.dodaj();
        await c.ujecie("ogolny");                                            // the four shadows: every option in the shot
        // which one is not like the others: four shadows, one of another thing
        {
          const inny = Math.floor(Math.random() * 4), cienie = [];
          for (let i = 0; i < 4; i++) { const h = await c.object(i === inny ? "gruszka" : "jablko", { x: -2.7 + i * 1.8, y: 0.6, size: 1.4, plik: i === inny ? null : "jablko" }); c.cien(h); cienie.push(h); }   // the apples alike: only the pear differs
          await c.say("sowa", "line.p_inny");
          dobre(cienie[inny]); await c.task({ targets: cienie, correct: cienie[inny], wrong: "line.p_inny_nie" });
          for (const h of cienie) c.cien(h, false);
          await c.ujecie("sredni", { na: [cienie[inny]] });                 // the pear among the apples
          await c.say("lisek", "line.p_inny_ok");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // home, the third act. The evening at Fox's: Owl sleeps over; tonight Granny finds the drawing and surely comes to
      // say thank you - the toys go to their places to see in the morning whether anything changed
      async (c) => {
        for (const n of ["lisek", "sowa"]) c.show(n);
        await wyrosnij(c);
        const m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });             // home, the thread, the plan
        await c.say("sowa", "line.d_wieczor", { anim: "Radosc" });
        await c.say("sowa", "line.d_przyleci");
        await c.say("lisek", "line.d_plan", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the room and the toys: the task
        const zabawki = {};
        for (const [i, n] of ["misiu", "pilka", "klocek"].entries()) zabawki[n] = await c.object(n, { x: -1.8 + i * 1.8, y: 2.2, size: 1.2 });
        await c.say("lisek", "line.d_poloz");
        const naDywanie = [-0.21, 0, 0.21].map((f) => { const q = m.dywan.slot(); q.x = m.dywan.x + f * m.dywan.w; q.w = m.dywan.w * 0.18; return q; });   // three places side by side on the rug (the one place both the evening and the morning room have)
        const t = await c.slots({ items: Object.values(zabawki), slots: naDywanie });
        await t.done();
        await c.ujecie("sredni", { na: Object.values(zabawki) });           // to remember
        await c.say("sowa", "line.d_zapamietaj");
        await c.wait(1.5);
        const gdzie = wieczor = Object.fromEntries(Object.entries(zabawki).map(([n, h]) => [n, { x: h.mesh.position.x, dol: c.bounds(h).bottom, plik: h.plik }]));
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });
        await c.say("lisek", "line.d_dobranoc", { anim: "Machanie" });
        // the night: Granny Owl finds the drawing at her door (the payoff)
        const il = await c.ilustracja("babcia_laurka", { ruch: "najazd" });
        await c.say("sowa", "line.d_noc");
        await il.zsun();
      },
      // the morning: "everything is the same!" - the teddy and the block swapped, a feather on the rug: Granny was here;
      // then the game played the way it is played at home
      async (c) => {
        const S = c.stage;
        const gdzie = wieczor ?? { misiu: { x: -3, dol: -2.2 }, pilka: { x: 0, dol: -2.2 }, klocek: { x: 3, dol: -2.2 } };
        await c.go("pokoj", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        // Granny's tricks: the teddy and the block swapped, her feather on the rug
        const z = {};
        for (const n of ["misiu", "pilka", "klocek"]) z[n] = await c.object(n, { x: 0, y: 0, size: 1.2, plik: gdzie[n].plik ?? null });   // the very toys of the evening (stickers have random variants)
        postaw(c, z.misiu, gdzie.klocek.x, gdzie.klocek.dol); postaw(c, z.klocek, gdzie.misiu.x, gdzie.misiu.dol); postaw(c, z.pilka, gdzie.pilka.x, gdzie.pilka.dol);
        const pioro = await c.object("pioro_sowy", { x: (gdzie.pilka.x + gdzie.klocek.x) / 2 + 0.2, y: gdzie.pilka.dol + 0.35, size: 0.8 });
        await wyrosnij(c);
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });             // the quick look, and the objection
        await c.say("lisek", "line.d_rano", { anim: "Radosc" });
        await c.say("sowa", "line.d_uwaznie", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the room: every toy in the shot
        const wszystkie = [z.misiu, z.pilka, z.klocek, pioro];
        await c.say("sowa", "line.d_co");
        const para = [z.misiu, z.klocek];
        dobre(para); const pierwsza = await c.task({ targets: wszystkie, correct: para, wrong: "line.d_nie" }); dobre(para, false);
        const druga = pierwsza === z.misiu ? z.klocek : z.misiu;
        const k1 = await c.circle(pierwsza);
        await c.say("sowa", "line.d_pierwsza_ok");
        await c.say("sowa", "line.d_druga");
        dobre(druga); await c.task({ targets: wszystkie.filter((h) => h !== pierwsza), correct: druga, wrong: "line.d_druga_nie" }); dobre(druga, false);
        const k2 = await c.circle(druga);
        await c.ujecie("sredni", { na: para });                             // the two swapped toys, circled
        await c.say("lisek", "line.d_tak", { anim: "Radosc" });
        k1.remove(); k2.remove();
        await c.ujecie("ogolny");                                            // what is new: every thing in the shot
        await c.say("sowa", "line.d_nowe");
        dobre(pioro); await c.task({ targets: wszystkie, correct: pioro, wrong: "line.d_nowe_nie" }); dobre(pioro, false);
        await c.rozblysk(pioro);
        await c.ujecie("zblizenie", { na: "sowa" });                         // Granny was here - she said thank you
        await c.emocja("sowa", "serce", { anim: "Radosc" });
        await c.say("sowa", "line.d_pioro");
        // the home game shown in play: Owl closes her eyes, Fox moves the teddy, Owl finds it
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });
        await c.say("lisek", "line.d_jak_babcia", { anim: "Zgloszenie" });
        c.emocja("sowa", "sen");
        await c.ujecie("ogolny");                                            // the teddy moves across the room
        await z.misiu.moveTo(z.misiu.mesh.position.x - 0.5, z.misiu.mesh.position.y - 0.9, 0.8);   // off the rug, in front
        await c.wait(0.4);
        await c.ujecie("sredni", { na: ["sowa", z.misiu] });
        await c.say("sowa", "line.d_sowa_znalazla", { anim: "Wskazanie" });
        // and the child's turn
        await c.ujecie("ogolny");
        await c.say("lisek", "line.d_zamknij");
        const rzeczy = [z.misiu, z.pilka, z.klocek, pioro];
        await zamknijOczy(c, rzeczy, async () => { postaw(c, z.pilka, z.pilka.mesh.position.x - 0.7, c.bounds(z.pilka).bottom - 1.0); });   // the ball rolls off the rug onto the floor
        await c.say("lisek", "line.d_ktora");
        dobre(z.pilka); await c.task({ targets: rzeczy, correct: z.pilka, wrong: "line.d_ktora_nie" }); dobre(z.pilka, false);
        await c.ujecie("sredni", { na: [z.pilka, "lisek"] });
        await c.say("lisek", "line.d_ktora_ok", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sowa" });                         // the task for the parents
        await c.say("sowa", "line.d_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
