// Lesson: adding to 10 by counting on - the first number is known, so start from it and count only the new things;
// equations to ten. The hopscotch tournament: Squirrel's bag holds five pebbles (a 5 on it), Owl brings three and
// Squirrel says "three!"; counted on from five - 6, 7, 8; the ten frame; hopping on from a stone; Bear's bucket of
// fish; the tournament square: from the 7 three more hops reach the ten. At home: shoes in the hallway. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

async function karty(c, liczby, { y = -2.2, xs = [-1.0, 0.8, 2.6] } = {}) {
  const out = [];
  for (const [i, n] of tasuj(liczby).entries()) {
    const k = await c.object("karta_cyfry", { obraz: "/game/assets/menu/karta.webp", x: xs[i], y, size: 1.4 });
    k.cyfra = await c.digit(n, { x: xs[i], y: y + 0.05, size: n === 10 ? 0.7 : 0.9, duration: 0.2 });
    k.liczba = n; out.push(k);
  }
  return out;
}
const oferta = (n) => tasuj([n, n === 10 ? 8 : n + 1, n - 1]);
// an equation with its result missing: the child picks the card, it flies into the gap
async function wynik(c, a, b, { y = 2.6, linia, wrong, who, xs } = {}) {
  const r = await c.equation([a, "+", b, "=", null], { y, size: 1.1 });
  const k = await karty(c, oferta(a + b), xs ? { xs } : {});
  await c.say(who, linia);
  const ok = k.find((q) => q.liczba === a + b);
  dobre(ok); await c.task({ targets: k, correct: ok, wrong });
  for (const q of k) if (q !== ok) { q.cyfra.remove(); q.remove(); }
  const [gx, gy] = [r.luki[0].x, r.luki[0].y];
  ok.cyfra.remove(); await ok.moveTo(gx, gy, 0.4); await c.digit(a + b, { x: gx, y: gy + 0.05, size: a + b === 10 ? 0.6 : 0.8, duration: 0.2 });
  return r;
}
// a closed container with its number written on it - what is inside is known, not shown
async function znane(c, name, n, { x = -1.4, y = -1.6, size = 1.9 } = {}) {
  const h = await c.object(name, { x, y, size });
  h.cyfraNa = await c.digit(n, { x, y: y - 0.15, size: 0.8, color: "#1f5fbf", duration: 0.25 });
  return h;
}

export default {
  id: "adding_10",
  przejscia: true,
  nagrody: true,
  characters: { wiewiorka: { side: "left", x: -4.9 }, mis: { side: "left", x: -2.7 }, sowa: { side: "right", x: 4.7 } },
  backgrounds: { story: "plac_zabaw", practice: { kolor: "#e9eff8", motyw: "cyfry" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the playground: five in the bag, three more; Squirrel counts only the new ones; counting on from five
      async (c) => {
        const S = c.stage;
        c.show("wiewiorka"); c.stage.puppets.mis.korzen.visible = false;
        await c.enter("sowa", "right");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_turniej", { anim: "Radosc" });
        await c.say("wiewiorka", "line.a_potrzebuje");
        await c.ujecie("ogolny");
        const torebka = await znane(c, "torebka", 5);
        await c.ujecie("sredni", { na: ["wiewiorka", torebka] });   // the bag with its 5 in the shot
        await c.say("wiewiorka", "line.a_w_torebce");
        await c.ujecie("ogolny");
        const k = []; for (let i = 0; i < 3; i++) k.push(await c.object("kamyk", { x: -0.2 + i * 1.0, y: -1.8, size: 0.95 }));
        await c.ujecie("sredni", { na: ["sowa", ...k] });
        await c.say("sowa", "line.a_przynioslam");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_trzy", { anim: "Podskok" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.wonder("sowa");
        await c.say("sowa", "line.a_a_piec");
        await c.ujecie("ogolny");
        await c.say("sowa", "line.a_od_pieciu", { anim: "Zgloszenie" });
        await c.count(k, { who: "sowa", od: 5 });
        await c.say("sowa", "line.a_osiem");
        await c.equation([5, "+", 3, "=", 8], { y: 2.6, size: 1.1 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_szybciej", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
        // the ten frame: five already in, three more - the top row shows the five at a glance
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.a_ramka");
        await c.ujecie("ogolny");
        const r = await c.ramka({ x: 0.4, y: 1.3 });
        for (let i = 0; i < 5; i++) await r.wloz(await c.object("kamyk", { x: 0.4, y: 1.3, size: 0.8, cicho: true }));
        const n = []; for (let i = 0; i < 4; i++) n.push(await c.object("kamyk", { x: -1.5 + i * 1.2, y: -2.2, size: 0.9 }));
        await c.say("sowa", "line.a_dorzuc");
        await r.przeciagaj({ rzeczy: n, ile: 8, wrong: "line.a_dosc" });
        await c.ujecie("sredni", { na: ["wiewiorka", r] });   // the filled frame beside her
        await c.say("wiewiorka", "line.a_piec_i_trzy");
        await c.ujecie("ogolny");
        c.clear();
        // hopscotch: Squirrel stands on 6 and hops three more - where does she land?
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_klasy", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const os = await c.os({ od: 0, do: 10, x0: -3.9, x1: 2.3, y: -1.4, size: 0.58 });
        S.puppets.wiewiorka.korzen.position.x = os.pole(6)[0];
        await c.say("sowa", "line.a_z_szostki");
        const ok = os.kamien(9);
        dobre(ok); await c.task({ targets: os.kamienie.filter((q) => q.liczba > 6), correct: ok, wrong: "line.a_z_szostki_nie" });
        await os.skocz("wiewiorka", 6, 9);
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_dziewiec", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear(); S.puppets.wiewiorka.korzen.position.x = -4.8;
      },
      // B. the brook: Bear's bucket holds seven fish, he catches two more; the bell rings on
      async (c) => {
        await c.go("strumyk", { enter: true });
        await Promise.all(["wiewiorka", "sowa", "mis"].map((n) => c.enter(n, n === "sowa" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_ryby", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const wiadro = await znane(c, "wiaderko", 7, { x: -0.6 });
        const r = [await c.object("rybka_srebrna", { x: 1.0, y: -1.7, size: 1.0 }), await c.object("rybka_srebrna", { x: 2.2, y: -1.9, size: 1.0 })];
        await c.ujecie("sredni", { na: ["mis", wiadro, ...r] });   // the bucket with its 7 and the two new fish
        await c.say("mis", "line.b_zlowilem");
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.b_od_siedmiu");
        await c.count(r, { who: "wiewiorka", od: 7 });
        await wynik(c, 7, 2, { linia: "line.b_karta", wrong: "line.b_karta_nie", who: "sowa" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_dziewiec", { anim: "Brawo" });
        await c.ujecie("ogolny");
        c.clear();
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sowa"] });
        await c.say("wiewiorka", "line.b_na_turniej", { anim: "Podskok" });
        await c.ujecie("ogolny");
      },
      // C. the tournament square (the end of the story): the final jump - Squirrel on the 7 hops three more, to the ten
      async (c) => {
        const S = c.stage;
        S.puppets.mis.home = 3.4; S.puppets.sowa.home = 5.4;               // both on the right: the stones run along the left and middle
        await c.go("turniej_klasy", { enter: true });
        await Promise.all(["wiewiorka", "sowa", "mis"].map((n) => c.enter(n, n === "wiewiorka" ? "left" : "right")));
        await c.rozblysk("wiewiorka");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.c_plac", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const os = await c.os({ od: 0, do: 10, x0: -4.5, x1: 1.2, y: 0.45, size: 0.58 });   // over Squirrel's head: standing on the 7 she hid the 6 to 8
        await c.ujecie("sredni", { na: ["sowa", os.kamien(10)] });
        await c.say("sowa", "line.c_zasady", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.c_moja_kolej");
        await c.ujecie("ogolny");
        await os.skocz("wiewiorka", 0, 7, { tempo: 0.4 });
        await c.ujecie("sredni", { na: ["wiewiorka", os.kamien(7)] });
        await c.say("wiewiorka", "line.c_siodemka");
        await c.ujecie("ogolny");
        await c.say("sowa", "line.c_jeszcze_trzy");
        const ok = os.kamien(10);
        dobre(ok); await c.task({ targets: os.kamienie.filter((q) => q.liczba > 7), correct: ok, wrong: "line.c_jeszcze_trzy_nie" }); dobre(ok, false);
        await os.skocz("wiewiorka", 7, 10);
        await c.konfetti();
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "radosc", { anim: "Radosc" });
        await c.say("wiewiorka", "line.c_dziesiec");
        await c.ujecie("ogolny");
        await c.equation([7, "+", 3, "=", 10], { y: 2.6, size: 1.1 });
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.c_rownanie");
        await c.ujecie("zblizenie", { na: "mis" });
        c.sfx("clap"); c.play("mis", "Brawo");
        await c.say("mis", "line.c_wygrana", { anim: "Brawo" });
        await c.ujecie("sredni", { na: ["wiewiorka", "mis"] });
        await c.say("mis", "line.b_koniec");
        await c.ujecie("ogolny");
        c.clear(); S.puppets.wiewiorka.korzen.position.x = -4.9; S.puppets.mis.home = -2.7; S.puppets.sowa.home = 4.7;
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("wiewiorka"); c.show("sowa");
        S.puppets.wiewiorka.korzen.position.x = -5.2; S.puppets.sowa.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1. six in the basket, three more: count on
        {
          const kosz = await znane(c, "koszyk", 6, { x: -1.6, y: -1.5 });
          const j = []; for (let i = 0; i < 3; i++) j.push(await c.object("jablko", { x: 0.8 + i * 1.1, y: -1.7, size: 0.95 }));
          await c.ujecie("sredni", { na: ["wiewiorka", kosz, ...j] });
          await c.say("wiewiorka", "line.p_od_szesciu");
          await c.ujecie("ogolny");
          await c.count(j, { who: "wiewiorka", od: 6 });
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_dziewiec"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 2. on the stones from 4, hop 4 more
        {
          const os = await c.os({ od: 0, do: 10, x0: -3.6, x1: 3.6, y: -1.4, size: 0.62 });
          await c.say("sowa", "line.p_z_czworki");
          const ok = os.kamien(8);
          dobre(ok); await c.task({ targets: os.kamienie.filter((q) => q.liczba > 4), correct: ok, wrong: "line.p_z_czworki_nie" });
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 3. 7 + 2 = ?
        {
          await wynik(c, 7, 2, { linia: "line.p_karta", wrong: "line.p_karta_nie", who: "wiewiorka" });
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 4. eight in the frame: how many more to ten?
        {
          const r = await c.ramka({ x: 0.4, y: 1.3 });
          for (let i = 0; i < 8; i++) await r.wloz(await c.object("szyszka", { x: 0.4, y: 1.3, size: 0.8, cicho: true }));
          const k = await karty(c, [1, 2, 3]);
          await c.say("sowa", "line.p_do_dziesieciu");
          const ok = k.find((q) => q.liczba === 2);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_do_dziesieciu_nie" });
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_dwa"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 5. 5 + 5 = ?
        {
          await wynik(c, 5, 5, { linia: "line.p_karta", wrong: "line.p_karta_nie", who: "sowa" });
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_dziesiec"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.praise("sowa");
        await c.ujecie("ogolny");
      },
    ],
    apply: [
      // home, the hallway: six shoes by the door, two more come in - counting on
      async (c) => {
        for (const n of ["wiewiorka", "mis"]) c.show(n);
        await c.ujecie("sredni", { na: ["wiewiorka", "mis"] });
        await c.say("wiewiorka", "line.h_buty", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const b = []; for (let i = 0; i < 6; i++) b.push(await c.object("but", { x: -1.2 + i * 0.75, y: -2.2, size: 0.72 }));
        await c.digit(6, { x: 0.7, y: -0.9, size: 0.8, color: "#1f5fbf" });
        await c.ujecie("sredni", { na: ["mis", ...b] });   // the six shoes and their 6
        await c.say("mis", "line.h_szesc");
        await c.ujecie("ogolny");
        const nowe = [await c.object("but", { x: 3.6, y: -2.2, size: 0.72 }), await c.object("but", { x: 4.4, y: -2.2, size: 0.72 })];
        await c.say("mis", "line.h_dwa_nowe");
        await c.count(nowe, { who: "mis", od: 6 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.h_osiem", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.h_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
