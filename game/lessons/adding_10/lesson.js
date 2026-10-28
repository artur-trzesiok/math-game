// Lesson: adding to 10 by counting on - the first number is known, so start from it and count only the new things;
// equations to ten. The hopscotch tournament: Squirrel's bag holds five pebbles (a 5 on it), Owl brings three and
// Squirrel says "three!"; counted on from five - 6, 7, 8; the ten frame; hopping on from a stone; Bear's bucket of
// fish; the bell rings on. At home: shoes in the hallway. Script in scenario.md.

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
        await c.say("wiewiorka", "line.a_turniej", { anim: "Radosc" });
        await c.say("wiewiorka", "line.a_potrzebuje");
        await znane(c, "torebka", 5);
        await c.say("wiewiorka", "line.a_w_torebce");
        const k = []; for (let i = 0; i < 3; i++) k.push(await c.object("kamyk", { x: -0.2 + i * 1.0, y: -1.8, size: 0.95 }));
        await c.say("sowa", "line.a_przynioslam");
        await c.say("wiewiorka", "line.a_trzy", { anim: "Podskok" });
        await c.wonder("sowa");
        await c.say("sowa", "line.a_a_piec");
        await c.say("sowa", "line.a_od_pieciu", { anim: "Zgloszenie" });
        await c.count(k, { who: "sowa", od: 5 });
        await c.say("sowa", "line.a_osiem");
        await c.equation([5, "+", 3, "=", 8], { y: 2.6, size: 1.1 });
        await c.say("wiewiorka", "line.a_szybciej", { anim: "Radosc" });
        c.clear();
        // the ten frame: five already in, three more - the top row shows the five at a glance
        await c.say("sowa", "line.a_ramka");
        const r = await c.ramka({ x: 0.4, y: 1.3 });
        for (let i = 0; i < 5; i++) await r.wloz(await c.object("kamyk", { x: 0.4, y: 1.3, size: 0.8, cicho: true }));
        const n = []; for (let i = 0; i < 4; i++) n.push(await c.object("kamyk", { x: -1.5 + i * 1.2, y: -2.2, size: 0.9 }));
        await c.say("sowa", "line.a_dorzuc");
        await r.przeciagaj({ rzeczy: n, ile: 8, wrong: "line.a_dosc" });
        await c.say("wiewiorka", "line.a_piec_i_trzy");
        c.clear();
        // hopscotch: Squirrel stands on 6 and hops three more - where does she land?
        await c.say("wiewiorka", "line.a_klasy", { anim: "Zgloszenie" });
        const os = await c.os({ od: 0, do: 10, x0: -3.9, x1: 2.3, y: -1.4, size: 0.58 });
        S.puppets.wiewiorka.korzen.position.x = os.pole(6)[0];
        await c.say("sowa", "line.a_z_szostki");
        const ok = os.kamien(9);
        dobre(ok); await c.task({ targets: os.kamienie.filter((q) => q.liczba > 6), correct: ok, wrong: "line.a_z_szostki_nie" });
        await os.skocz("wiewiorka", 6, 9);
        await c.say("wiewiorka", "line.a_dziewiec", { anim: "Radosc" });
        c.clear(); S.puppets.wiewiorka.korzen.position.x = -4.8;
      },
      // B. the brook: Bear's bucket holds seven fish, he catches two more; the bell rings on
      async (c) => {
        await c.go("strumyk", { enter: true });
        await Promise.all(["wiewiorka", "sowa", "mis"].map((n) => c.enter(n, n === "sowa" ? "right" : "left")));
        await c.say("mis", "line.b_ryby", { anim: "Radosc" });
        await znane(c, "wiaderko", 7, { x: -0.6 });
        const r = [await c.object("rybka_srebrna", { x: 1.0, y: -1.7, size: 1.0 }), await c.object("rybka_srebrna", { x: 2.2, y: -1.9, size: 1.0 })];
        await c.say("mis", "line.b_zlowilem");
        await c.say("wiewiorka", "line.b_od_siedmiu");
        await c.count(r, { who: "wiewiorka", od: 7 });
        await wynik(c, 7, 2, { linia: "line.b_karta", wrong: "line.b_karta_nie", who: "sowa" });
        await c.say("mis", "line.b_dziewiec", { anim: "Brawo" });
        c.clear();
        // the breather: the bell - the 6 is written, then it rings again: count on
        await c.say("sowa", "line.b_dzwonek", { anim: "Zgloszenie" });
        const dz = await c.object("dzwonek", { x: -1.0, y: 1.4, size: 1.5 });
        await c.digit(6, { x: 0.8, y: 1.4, size: 1.2, color: "#1f5fbf" });
        await c.say("sowa", "line.b_juz_szesc");
        const ile = 2 + Math.floor(Math.random() * 3);
        await c.dzwieki(ile, { dzwiek: "dzwonek", rzecz: dz, tempo: 0.7 });
        const k = await karty(c, oferta(6 + ile));
        await c.say("sowa", "line.b_ile_razem");
        const ok = k.find((q) => q.liczba === 6 + ile);
        dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.b_ile_razem_nie" });
        await c.say("wiewiorka", `line.b_razem${6 + ile}`);
        await c.say("mis", "line.b_koniec");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("wiewiorka"); c.show("sowa");
        S.puppets.wiewiorka.korzen.position.x = -5.2; S.puppets.sowa.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        // 1. six in the basket, three more: count on
        {
          await znane(c, "koszyk", 6, { x: -1.6, y: -1.5 });
          const j = []; for (let i = 0; i < 3; i++) j.push(await c.object("jablko", { x: 0.8 + i * 1.1, y: -1.7, size: 0.95 }));
          await c.say("wiewiorka", "line.p_od_szesciu");
          await c.count(j, { who: "wiewiorka", od: 6 });
          await c.say("sowa", "line.p_dziewiec"); gw.dodaj(); c.clear();
        }
        // 2. on the stones from 4, hop 4 more
        {
          const os = await c.os({ od: 0, do: 10, x0: -3.6, x1: 3.6, y: -1.4, size: 0.62 });
          await c.say("sowa", "line.p_z_czworki");
          const ok = os.kamien(8);
          dobre(ok); await c.task({ targets: os.kamienie.filter((q) => q.liczba > 4), correct: ok, wrong: "line.p_z_czworki_nie" });
          await c.say("wiewiorka", "line.p_dobrze"); gw.dodaj(); c.clear();
        }
        // 3. 7 + 2 = ?
        { await wynik(c, 7, 2, { linia: "line.p_karta", wrong: "line.p_karta_nie", who: "wiewiorka" }); await c.say("sowa", "line.p_dobrze"); gw.dodaj(); c.clear(); }
        // 4. eight in the frame: how many more to ten?
        {
          const r = await c.ramka({ x: 0.4, y: 1.3 });
          for (let i = 0; i < 8; i++) await r.wloz(await c.object("szyszka", { x: 0.4, y: 1.3, size: 0.8, cicho: true }));
          const k = await karty(c, [1, 2, 3]);
          await c.say("sowa", "line.p_do_dziesieciu");
          const ok = k.find((q) => q.liczba === 2);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_do_dziesieciu_nie" });
          await c.say("wiewiorka", "line.p_dwa"); gw.dodaj(); c.clear();
        }
        // 5. 5 + 5 = ?
        { await wynik(c, 5, 5, { linia: "line.p_karta", wrong: "line.p_karta_nie", who: "sowa" }); await c.say("wiewiorka", "line.p_dziesiec"); gw.dodaj(); c.clear(); }
        await c.praise("sowa");
      },
    ],
    apply: [
      // home, the hallway: six shoes by the door, two more come in - counting on
      async (c) => {
        for (const n of ["wiewiorka", "mis"]) c.show(n);
        await c.say("wiewiorka", "line.h_buty", { anim: "Zgloszenie" });
        const b = []; for (let i = 0; i < 6; i++) b.push(await c.object("but", { x: -1.2 + i * 0.75, y: -2.2, size: 0.72 }));
        await c.digit(6, { x: 0.7, y: -0.9, size: 0.8, color: "#1f5fbf" });
        await c.say("mis", "line.h_szesc");
        const nowe = [await c.object("but", { x: 3.6, y: -2.2, size: 0.72 }), await c.object("but", { x: 4.4, y: -2.2, size: 0.72 })];
        await c.say("mis", "line.h_dwa_nowe");
        await c.count(nowe, { who: "mis", od: 6 });
        await c.say("wiewiorka", "line.h_osiem", { anim: "Radosc" });
        await c.say("mis", "line.h_rodzice");
      },
    ],
  },
};
