// Lesson: counting to 3 - one, two, three: counting things by touch, each one once; the last number says how many; the
// digits 1, 2, 3. Hedgehog turns three: Bear counts the candles and touches one twice ("four!"); each once - three.
// The digits drawn and traced; three raspberries for the cake, a fourth jumps back; claps counted by ear. At home: three
// spoons. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// digit cards 1..3 in a row: a paper card (the target) with the digit drawn on it
async function karty(c, { y = -2.0, xs = [-0.8, 1.0, 2.8] } = {}) {
  const out = [];
  for (const [i, n] of tasuj([1, 2, 3]).entries()) {
    const k = await c.object("karta_cyfry", { obraz: "/game/assets/menu/karta.webp", x: xs[i], y, size: 1.5 });
    await c.digit(n, { x: xs[i], y: y + 0.05, size: 0.95, duration: 0.2 });
    k.liczba = n; out.push(k);
  }
  return out;
}
// give exactly `ile` things to a character by dragging; one more jumps back with a line
function daj(c, rzeczy, who, ile, { gdy = null, zaDuzo = "line.za_duzo" } = {}) {
  const S = c.stage; let dane = 0;
  const x = () => S.puppets[who].korzen.position.x;
  return new Promise((ok) => S.free({
    items: rzeczy.slice(), rozdaj: { wolni: () => (dane < ile ? [{ who }] : []), pozycja: () => [x(), -1.0] },
    onDrop: async (h, p) => {
      if (Math.abs(p.x - x()) > 1.7) { await h.moveTo(h.home.x, h.home.y, 0.35); return; }
      if (dane >= ile) { c.sfx("wrong"); await h.moveTo(h.home.x, h.home.y, 0.35); await c.say(who, zaDuzo); return; }
      dane++; c.sfx("pop"); await h.moveTo(x() + 0.6, -0.6 + dane * 0.35, 0.25); gdy?.(dane);
      if (dane === ile) { await c.wait(0.5); S.endSort(); ok(); }
    },
    onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
  }));
}

export default {
  id: "counting_3",
  przejscia: true,
  nagrody: true,
  characters: { jez: { side: "left", x: -4.4 }, mis: { side: "right", x: 4.6 }, wiewiorka: { side: "left", x: -2.4 } },
  backgrounds: { story: "laka", practice: { kolor: "#fbe3e8", motyw: "kola" }, apply: "dom" },
  stages: {
    story: [
      // A. the meadow: Hedgehog's birthday - three; Bear counts the candles twice-over; each once
      async (c) => {
        c.show("jez");
        await Promise.all([c.enter("wiewiorka"), c.enter("mis", "right")]);
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.a_urodziny", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["jez", "wiewiorka"] });
        await c.say("wiewiorka", "line.a_ile_lat");
        await c.say("jez", "line.a_trzy");
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.a_swieczki", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const sw = [];
        for (let i = 0; i < 3; i++) sw.push(await c.object("swieczka", { x: -1.2 + i * 1.2, y: 1.2, size: 1.9 }));
        // the naive try: Bear counts and touches the middle one twice - it grows; "four!"
        await c.ujecie("sredni", { na: sw });                                // the candles fill the shot: the double touch shows
        await c.say("mis", "line.a_licze_zle");
        for (const k of [0, 1, 1, 2]) { c.stage.bump(sw[k], 0.35); await c.wait(0.45); }
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_cztery", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.a_dwa_razy");
        await c.ujecie("sredni", { na: sw });
        await c.say("wiewiorka", "line.a_kazda_raz", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.say("jez", "line.a_ty_policz");
        await c.count(sw, { who: "wiewiorka" });
        await c.say("wiewiorka", "line.a_trzy_swieczki");
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_rozumiem", { anim: "Kiwanie" });
        await c.ujecie("ogolny");
        c.clear();
        // the digits 1, 2, 3, drawn one after another; the child traces the 3
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.a_cyfry");
        await c.ujecie("ogolny");
        for (const [i, n] of [1, 2, 3].entries()) { await c.digit(n, { x: -2.4 + i * 2.4, y: 1.3, size: 1.6 }); await c.say("wiewiorka", `line.a_cyfra${n}`); }
        await c.wait(0.4); c.clear();
        await c.ujecie("sredni", { na: ["jez"] });
        await c.say("jez", "line.a_narysuj_trzy");
        await c.ujecie("ogolny");
        const t = await c.slad(3, { x: 0, y: 0.4, size: 3.0 });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.a_moja_trojka", { anim: "Radosc" });
        await c.ujecie("ogolny");
        t.remove(); c.clear();
      },
      // B. the raspberry thicket: how many for the cake? Grandma's recipe shows it - the child counts its raspberries;
      // three are picked (a fourth jumps back); Hedgehog's claps counted by ear
      async (c) => {
        await c.go("malinowy_zagajnik", { enter: true });
        await Promise.all(["jez", "wiewiorka", "mis"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await c.play("mis", "Rozgladanie");
        await c.say("mis", "line.b_zagajnik", { anim: "Radosc" });           // the wide shot: the raspberry bushes in view
        await c.ujecie("zblizenie", { na: "jez" });
        await c.wonder("jez");
        await c.say("jez", "line.b_ile_malin");
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.b_przepis", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        // the recipe card: the child counts the raspberries on the drawn cake, each once - the last number says how many
        const przepis = await c.znalezisko("przepis_tort", { skad: "mis" });
        await c.say("wiewiorka", "line.b_przepis_policz");
        dobre(przepis.cele, false);                                          // the spots come marked right: the tests then pick the first again and again
        const licz = await c.count(przepis.cele, { who: "wiewiorka" });
        await c.say("wiewiorka", "line.b_przepis_trzy");
        licz?.znaczki?.forEach((z) => z.remove());                            // the digits go away with the card
        await przepis.remove();
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.b_zrywamy", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const ml = [];
        for (let i = 0; i < 5; i++) ml.push(await c.object("malina", { x: -1.4 + i * 1.0, y: 1.6 - (i % 2) * 0.7, size: 1.0 }));
        await c.say("wiewiorka", "line.b_daj");
        await daj(c, ml, "mis", 3, { zaDuzo: "line.b_za_duzo" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_trzy", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
        // the breather: Hedgehog claps for each guest - how many claps?
        await c.ujecie("sredni", { na: ["jez"] });
        await c.say("jez", "line.b_klaszcze", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const ile = 1 + Math.floor(Math.random() * 3);
        await c.dzwieki(ile, { kto: "jez", ruch: "klask", tempo: 0.6 });
        const k = await karty(c);
        await c.say("wiewiorka", "line.b_ile_klasniec");
        const ok = k.find((q) => q.liczba === ile);
        dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.b_ile_klasniec" });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", `line.b_klask${ile}`);
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.b_do_domu");
        await c.ujecie("ogolny");
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
        await c.ujecie("ogolny");
        // 1. how many apples? point to the digit
        {
          const ile = 1 + Math.floor(Math.random() * 3);
          const jb = []; for (let i = 0; i < ile; i++) jb.push(await c.object("jablko", { x: -1.6 + i * 1.6, y: 1.5, size: 1.5 }));
          const k = await karty(c);
          await c.ujecie("sredni", { na: jb });
          await c.say("mis", "line.p_ile_jablek");
          await c.ujecie("ogolny");
          const ok = k.find((q) => q.liczba === ile);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_ile_jablek_nie" });
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 2. give Squirrel two acorns
        {
          const z = []; for (let i = 0; i < 4; i++) z.push(await c.object("zoledz", { x: -1.8 + i * 1.2, y: 1.4, size: 1.1 }));
          await c.ujecie("sredni", { na: z });
          await c.say("wiewiorka", "line.p_dwa");
          await c.ujecie("ogolny");
          await daj(c, z, "wiewiorka", 2, { zaDuzo: "line.p_dwa_juz" });
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_dwa_ok"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 3. trace the 1 and the 2
        {
          await c.ujecie("sredni", { na: ["mis"] });
          await c.say("mis", "line.p_rysuj");
          await c.ujecie("ogolny");
          for (const n of [1, 2]) { const t = await c.slad(n, { x: 0, y: 0.4, size: 2.8 }); t.remove(); }
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 4. listen: how many drum beats?
        {
          const ile = 1 + Math.floor(Math.random() * 3);
          await c.ujecie("sredni", { na: ["mis"] });
          await c.say("mis", "line.p_sluchaj");
          await c.ujecie("ogolny");
          await c.dzwieki(ile, { dzwiek: "beben", tempo: 0.7 });
          const k = await karty(c);
          await c.say("mis", "line.p_ile_bum");
          const ok = k.find((q) => q.liczba === ile);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_ile_bum" });
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 5. which basket has three?
        {
          const kupki = [];
          for (const [i, n] of tasuj([1, 2, 3]).entries()) { const h = n > 1 ? await c.kupka("gruszka", n, { x: -2.4 + i * 2.4, y: 0.8, size: 1.6 }) : await c.object("gruszka", { x: -2.4 + i * 2.4, y: 0.8, size: 1.0 }); h.ile = n; kupki.push(h); }
          await c.ujecie("sredni", { na: ["wiewiorka"] });
          await c.say("wiewiorka", "line.p_trzy");
          await c.ujecie("ogolny");
          const ok = kupki.find((h) => h.ile === 3);
          dobre(ok); await c.task({ targets: kupki, correct: ok, wrong: "line.p_trzy_nie" });
          await c.ujecie("zblizenie", { na: "mis" });
          await c.say("mis", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        await c.praise("wiewiorka");
      },
    ],
    apply: [
      // home: the birthday cake with three candles - count them; three spoons for three friends
      async (c) => {
        for (const n of ["jez", "wiewiorka", "mis"]) c.show(n);
        const tort = await c.object("tort", { x: 0, y: 0.7, size: 2.4 });
        const sw = []; for (let i = 0; i < 3; i++) sw.push(await c.object("swieczka", { x: -0.55 + i * 0.55, y: 1.8, size: 1.0 }));
        await c.ujecie("sredni", { na: [tort, ...sw] });
        await c.say("mis", "line.d_tort", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await c.count(sw, { who: "mis" });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.d_trzy_lata", { anim: "Radosc" });
        c.sfx("clap");
        await c.ujecie("ogolny");
        c.clear();
        const ly = []; for (let i = 0; i < 3; i++) ly.push(await c.object("lyzka", { x: -1.4 + i * 1.4, y: 0.7, size: 1.7 }));
        await c.ujecie("sredni", { na: ly });
        await c.say("wiewiorka", "line.d_lyzki");
        await c.ujecie("ogolny");
        await c.count(ly, { who: "wiewiorka" });
        await c.say("wiewiorka", "line.d_kazdy");
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.d_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
