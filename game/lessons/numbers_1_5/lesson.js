// Lesson: numbers 1 to 5 - count to five, every thing once; the digits 4 and 5 (1-3 are known); a number says how many
// to give, not only how many there are; five spread out is still five. Mole's little forest train: a ticket costs as
// many coins as its number, passengers board the wagon of their ticket, Bear's five apples lie far apart ("mine are
// more!"), the conductor's bell, five passengers hop off at the lakeside stop. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const PASAZEROWIE = ["mysz", "zajac", "jez", "kaczatko_stoi", "slimak"];

// digit cards in a row: a paper card (the target) with the digit drawn on it
async function karty(c, liczby, { y = -2.0, xs = [-0.9, 0.9, 2.7] } = {}) {
  const out = [];
  for (const [i, n] of tasuj(liczby).entries()) {
    const k = await c.object("karta_cyfry", { obraz: "/game/assets/menu/karta.webp", x: xs[i], y, size: 1.5 });
    await c.digit(n, { x: xs[i], y: y + 0.05, size: 0.95, duration: 0.2 });
    k.liczba = n; out.push(k);
  }
  return out;
}
// the train: five wagons numbered 1-5 over the characters' heads
async function wagony(c, { y = 1.75, krok = 1.9, size = 1.9 } = {}) {
  const w = [];
  for (let i = 0; i < 5; i++) {
    const x = -3.8 + i * krok, h = await c.object("wagon", { x, y, size, cicho: i > 0 });
    await c.digit(i + 1, { x, y: y - 0.1, size: 0.6, duration: 0.15 });
    h.liczba = i + 1; w.push(h);
  }
  return w;
}
// a passenger with a ticket boards the wagon of the ticket's number
async function wsiadanie(c, w, kto, n, linia) {
  const p = await c.object(kto, { x: 0.2, y: -1.4, size: 1.5 });
  const bilet = await c.object("bilet", { x: 2.1, y: -1.35, size: 1.7 });
  const cyfra = await c.digit(n, { x: 2.1, y: -1.35, size: 0.75, duration: 0.25 });
  await c.say("kret", linia);
  const ok = w[n - 1];
  dobre(ok); await c.task({ targets: w, correct: ok, wrong: "line.zly_wagon" }); dobre(ok, false);
  p.mesh.position.z = ok.mesh.position.z - 0.02; p.mesh.scale.setScalar(0.6); p.base = 0.6;
  bilet.remove(); cyfra.remove();
  await p.moveTo(ok.mesh.position.x, ok.mesh.position.y + 0.5, 0.5); c.sfx("hop");
  return p;
}
// pack exactly `ile` things into the backpack by dragging; one more jumps back
function spakuj(c, rzeczy, plecak, ile, zaDuzo) {
  const S = c.stage; let dane = 0;
  const [px, py] = [plecak.mesh.position.x, plecak.mesh.position.y];
  return new Promise((ok) => S.free({
    items: rzeczy.slice(), rozdaj: { wolni: () => (dane < ile ? [{ who: "plecak" }] : []), pozycja: () => [px, py] },
    onDrop: async (h, p) => {
      if (Math.hypot(p.x - px, p.y - py) > 1.4) { await h.moveTo(h.home.x, h.home.y, 0.35); return; }
      if (dane >= ile) { c.sfx("wrong"); await h.moveTo(h.home.x, h.home.y, 0.35); await c.say("kret", zaDuzo); return; }
      dane++; c.sfx("plop"); h.mesh.position.z = plecak.mesh.position.z - 0.02; await h.moveTo(px - 0.5 + (dane % 3) * 0.5, py + 0.55, 0.25);
      await c.say("kret", `line.n${dane}`);
      if (dane === ile) { await c.wait(0.4); S.endSort(); ok(); }
    },
    onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
  }));
}

export default {
  id: "numbers_1_5",
  przejscia: true,
  nagrody: true,
  characters: { kret: { side: "left", x: -4.9 }, sowa: { side: "left", x: -3.0 }, mis: { side: "right", x: 4.6 } },
  backgrounds: { story: "stacyjka", practice: { kolor: "#e4eefa", motyw: "cyfry" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the station: Mole's train; Bear's ticket costs four coins; the digit 4
      async (c) => {
        await c.enter("kret");
        await c.ujecie("sredni", { na: ["kret"] });
        await c.say("kret", "line.a_pociag", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await Promise.all([c.enter("mis", "right"), c.enter("sowa")]);
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_chce", { anim: "Podskok" });
        await c.ujecie("sredni", { na: ["kret", "sowa"] });
        await c.say("kret", "line.a_bilet", { anim: "Zgloszenie" });
        await c.say("kret", "line.a_cztery");
        await c.ujecie("ogolny");
        const d4 = await c.digit(4, { x: 0.8, y: 1.2, size: 1.8 });
        await c.ujecie("sredni", { na: [d4] });                  // the new digit fills the screen
        await c.say("kret", "line.a_to_cztery");
        await c.ujecie("ogolny");
        c.clear();
        await c.say("sowa", "line.a_zaplac");
        const s = await c.sklepik({ towar: "bilet", cena: 4, pokaz: "cyfra", x: 0.8, onZaDuzo: () => c.say("kret", "line.a_za_duzo") });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.a_cztery_monety", { anim: "Kiwanie" });
        await c.ujecie("ogolny");
        s.remove();
        // the child writes the 4 on Bear's ticket
        await c.say("kret", "line.a_napisz");
        await c.object("bilet", { x: 0.8, y: 0.4, size: 4.4 });
        const t = await c.slad(4, { x: 0.8, y: 0.4, size: 2.4 });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_moj_bilet", { anim: "Radosc" });
        await c.ujecie("ogolny");
        t.remove(); c.clear();
      },
      // B. the passengers board the wagon of their ticket's number; off into the forest
      async (c) => {
        const w = await wagony(c);
        await c.ujecie("sredni", { na: ["kret", ...w] });
        await c.say("kret", "line.b_wagony");
        await c.ujecie("ogolny");
        for (const [i, n] of [[0, 2], [1, 5], [2, 3]]) {
          const p = await wsiadanie(c, w, PASAZEROWIE[i], n, `line.b_bilet${n}`);
          await c.ujecie("sredni", { na: [p, w[n - 1]] });       // the passenger in the wagon of the ticket
          await c.say("kret", "line.b_wsiada");
          await c.ujecie("ogolny");
        }
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.b_odjazd", { anim: "Machanie" });
        await c.ujecie("ogolny");
        c.sfx("dzwonek"); c.clear();
      },
      // C. the forest: Bear's five apples far apart, Owl's five close - "mine are more!"; the digit 5; the bell
      async (c) => {
        await c.go("las", { enter: true });
        await Promise.all(["kret", "mis", "sowa"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await c.say("sowa", "line.c_jablka");
        const misia = [], sowy = [];
        for (let i = 0; i < 5; i++) misia.push(await c.object("jablko", { x: -3.6 + i * 1.8, y: 1.85, size: 1.0 }));
        for (let i = 0; i < 5; i++) sowy.push(await c.object("gruszka", { x: -0.9 + i * 0.95, y: -0.6, size: 0.8 }));
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.c_wiecej", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.wonder("sowa");
        await c.say("sowa", "line.c_policz");
        await c.ujecie("ogolny");
        await c.count(misia, { who: "sowa" });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.c_piec_misia");
        await c.ujecie("ogolny");
        await c.count(sowy, { who: "sowa" });
        await c.ujecie("sredni", { na: ["sowa", ...sowy] });
        await c.say("sowa", "line.c_tyle_samo", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.c_rozumiem", { anim: "Kiwanie" });
        await c.ujecie("ogolny");
        c.clear();
        await c.say("sowa", "line.c_cyfra5");
        const d5 = await c.digit(5, { x: 0.8, y: 1.2, size: 1.8 });
        await c.ujecie("sredni", { na: [d5] });
        await c.say("sowa", "line.c_to_piec");
        await c.ujecie("ogolny");
        c.clear();
        // the breather: how many times did the conductor ring the bell?
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.c_dzwonek", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const dz = await c.object("dzwonek", { x: 0.6, y: 1.4, size: 1.6 });
        const ile = 3 + Math.floor(Math.random() * 3);
        await c.dzwieki(ile, { dzwiek: "dzwonek", rzecz: dz, tempo: 0.7 });
        const k = await karty(c, [3, 4, 5]);
        await c.say("sowa", "line.c_ile_dzwonkow");
        const ok = k.find((q) => q.liczba === ile);
        dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.c_ile_dzwonkow" });
        await c.ujecie("sredni", { na: ["kret", dz] });
        await c.say("kret", `line.c_dzwonek${ile}`);
        await c.ujecie("ogolny");
        c.clear();
      },
      // D. the lakeside stop (the end of the journey): the passengers hop off the train onto the platform - count them
      async (c) => {
        const S = c.stage;
        await c.go("stacja_jezioro", { enter: true });
        await Promise.all(["kret", "mis", "sowa"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.d_jezioro", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await c.play("sowa", "Rozgladanie");
        await c.say("sowa", "line.d_stacja", { anim: "Zgloszenie" });   // the wide shot: the lake, the pier and the train in view
        await c.ujecie("sredni", { na: ["kret"] });
        await c.say("kret", "line.d_wysiadaja");
        await c.ujecie("ogolny");
        // one after another out of the train at the back (small: far away), each hops onto the grass between Owl and Bear
        const p = [];
        for (const [i, n] of PASAZEROWIE.entries()) {
          const h = await c.object(n, { x: -4.3, y: 0.4, size: 0.5, cicho: true }), s0 = h.base, s1 = s0 * 2.6;
          c.sfx("hop");
          await Promise.all([h.moveTo(-1.1 + i * 1.0, -1.0 - (i % 2) * 0.95, 0.45), S.tween(0.45, (q) => h.mesh.scale.setScalar(s0 + (s1 - s0) * q))]);
          h.base = s1; p.push(h);
        }
        await c.say("mis", "line.d_ilu");
        await c.count(p, { who: "mis" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.d_pieciu", { anim: "Brawo" });
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("kret"); c.show("sowa");
        S.puppets.kret.korzen.position.x = -5.2; S.puppets.sowa.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        // 1. how many? point to the digit
        {
          const ile = 4 + Math.floor(Math.random() * 2), co = tasuj(["szyszka", "zoledz", "grzyb"])[0];
          for (let i = 0; i < ile; i++) await c.object(co, { x: -2.4 + i * 1.2, y: 1.5, size: 1.1 });
          const k = await karty(c, [3, 4, 5]);
          await c.say("kret", "line.p_ile");
          const ok = k.find((q) => q.liczba === ile);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_ile_nie" });
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 2. a ticket for five coins
        {
          await c.say("kret", "line.p_bilet5"); await c.sklepik({ towar: "bilet", cena: 5, pokaz: "cyfra", onZaDuzo: () => c.say("kret", "line.a_za_duzo") });
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 3. write the 5
        {
          await c.say("sowa", "line.p_napisz5"); const t = await c.slad(5, { x: 0, y: 0.4, size: 2.8 }); t.remove();
          await c.ujecie("zblizenie", { na: "kret" });
          await c.say("kret", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 4. which basket has four?
        {
          const kupki = [];
          for (const [i, n] of tasuj([3, 4, 5]).entries()) { const h = await c.kupka("jablko", n, { x: -2.4 + i * 2.4, y: 0.8, size: 1.7 }); h.ile = n; kupki.push(h); }
          await c.ujecie("sredni", { na: kupki });               // the baskets, before the question
          await c.say("sowa", "line.p_cztery");
          await c.ujecie("ogolny");
          const ok = kupki.find((h) => h.ile === 4);
          dobre(ok); await c.task({ targets: kupki, correct: ok, wrong: "line.p_cztery_nie" });
          await c.ujecie("zblizenie", { na: "kret" });
          await c.say("kret", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 5. Mole hops along the stones - which stone is four?
        {
          const os = await c.os({ od: 0, do: 5, x0: -3.4, x1: 3.4, y: -1.2, size: 0.9 });
          await c.say("kret", "line.p_kamienie");
          const ok = os.kamien(4);
          dobre(ok); await c.task({ targets: os.kamienie.filter((k) => k.liczba > 0), correct: ok, wrong: "line.p_kamienie_nie" });
          S.puppets.kret.korzen.position.x = os.pole(0)[0];
          await os.skocz("kret", 0, 4);
          await c.ujecie("zblizenie", { na: "kret" });
          await c.say("kret", "line.p_doskoczylem", { anim: "Radosc" });
          await c.ujecie("ogolny");
          gw.dodaj(); c.clear(); S.puppets.kret.korzen.position.x = -5.2;
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // home: pack five things for tomorrow's trip; how many fingers on a hand
      async (c) => {
        for (const n of ["kret", "mis"]) c.show(n);
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.h_jutro", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const plecak = await c.object("plecak", { x: 0.2, y: -1.7, size: 2.0 });
        const rzeczy = [];
        for (const [i, n] of ["jablko", "kanapka_1", "czapka", "pilka", "ksiazeczka", "skarpetka", "kubek"].entries()) rzeczy.push(await c.object(n, { x: -3.0 + i * 1.0, y: 1.5 - (i % 2) * 0.7, size: 0.9 }));
        await c.say("kret", "line.h_spakuj");
        await spakuj(c, rzeczy, plecak, 5, "line.h_za_duzo");
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.h_spakowane", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
        const reka = await c.object("gest_papier", { x: 0, y: 1.3, size: 2.6 });
        const k = await karty(c, [3, 4, 5], { xs: [-1.6, 0, 1.6] });
        await c.say("mis", "line.h_palce");
        const ok = k.find((q) => q.liczba === 5);
        dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.h_palce_nie" });
        await c.ujecie("sredni", { na: [reka, ok] });             // the hand and its five
        await c.say("kret", "line.h_piec_palcow");
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.h_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
