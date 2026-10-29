// Lesson: numbers 6 to 10 - count past five to ten, each thing once (a counted thing moves aside into a row); 6-10 as
// five and some more (the ten frame: a full top row and some below); the digits 6-10; ten is written with two digits.
// Beaver's dam needs ten logs: Mole counts the heap and loses track ("twelve!"); the logs counted into a row - eight;
// two more fetched from the forest; the stepping stones to the number Beaver says. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// digit cards in a row: a paper card (the target) with the number drawn on it
async function karty(c, liczby, { y = -2.0, xs = [-1.1, 0.8, 2.7] } = {}) {
  const out = [];
  for (const [i, n] of tasuj(liczby).entries()) {
    const k = await c.object("karta_cyfry", { obraz: "/game/assets/menu/karta.webp", x: xs[i], y, size: 1.5 });
    await c.digit(n, { x: xs[i], y: y + 0.05, size: n === 10 ? 0.75 : 0.95, duration: 0.2 });
    k.liczba = n; out.push(k);
  }
  return out;
}
// a heap of n things lying anyhow in an area (no two on top of each other)
async function stos(c, name, n, { x = 0.6, y = 0.6, w = 3.6, h = 1.6, size = 0.9 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let px, py, k = 0;
    do { px = x - w / 2 + Math.random() * w; py = y - h / 2 + Math.random() * h; k++; } while (k < 40 && out.some((o) => Math.hypot(o.mesh.position.x - px, o.mesh.position.y - py) < size * 0.8));
    out.push(await c.object(name, { x: px, y: py, size }));
  }
  return out;
}

export default {
  id: "numbers_6_10",
  przejscia: true,
  nagrody: true,
  characters: { bobr: { side: "left", x: -4.8 }, kret: { side: "left", x: -3.0 }, sowa: { side: "right", x: 4.7 } },
  backgrounds: { story: "strumyk", practice: { kolor: "#e6f0f4", motyw: "cyfry" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the brook: the dam needs ten logs; Mole counts the heap anyhow - "twelve!"; counted into a row: eight
      async (c) => {
        await Promise.all(["bobr", "kret", "sowa"].map((n) => c.enter(n, n === "sowa" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.a_tama", { anim: "Smutek" });
        await c.say("bobr", "line.a_dziesiec");
        await c.ujecie("ogolny");
        const bale = await stos(c, "bal", 8, { x: 0.8, y: 0.9, w: 4.0, h: 1.6, size: 0.85 });
        await c.ujecie("sredni", { na: ["kret", ...bale] });   // Mole and the heap he counts anyhow
        await c.say("kret", "line.a_licze", { anim: "Zgloszenie" });
        for (const k of [0, 1, 2, 1, 3, 4, 5, 4, 6, 7, 6, 2]) { c.stage.bump(bale[k], 0.3); await c.wait(0.3); }
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.a_dwanascie", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.wonder("sowa");
        await c.say("sowa", "line.a_dwa_razy");
        await c.ujecie("ogolny");
        await c.say("sowa", "line.a_odkladaj", { anim: "Zgloszenie" });
        await c.count(bale, { who: "sowa", rzad: { y: -1.7, x: -1.6, gap: 0.76 } });
        await c.ujecie("sredni", { na: ["sowa", ...bale] });   // the counted row
        await c.say("sowa", "line.a_osiem");
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.a_brakuje");
        await c.ujecie("ogolny");
        c.clear();
        // five and some more: the ten frame
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.a_ramka");
        await c.ujecie("ogolny");
        const r = await c.ramka({ x: 0.6, y: 1.2 });
        const b2 = []; for (let i = 0; i < 8; i++) b2.push(await c.object("bal", { x: -2.6 + i * 0.85, y: -2.3, size: 0.85 }));
        await c.say("sowa", "line.a_wloz");
        await r.przeciagaj({ rzeczy: b2, ile: 8 });
        await c.ujecie("sredni", { na: ["sowa", r] });   // the full top row and three below
        await c.say("sowa", "line.a_piec_i_trzy", { anim: "Kiwanie" });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.a_widze");
        await c.ujecie("ogolny");
        c.clear();
      },
      // B. the forest: fetch logs until the frame holds ten; the digits 6-10; the stones to the number Beaver says
      async (c) => {
        const S = c.stage;
        await c.go("las", { enter: true });
        await Promise.all(["bobr", "kret", "sowa"].map((n) => c.enter(n, n === "sowa" ? "right" : "left")));
        await c.ujecie("sredni", { na: ["bobr", "kret"] });
        await c.say("bobr", "line.b_las");
        await c.ujecie("ogolny");
        const r = await c.ramka({ x: 0.6, y: 1.3 });
        for (let i = 0; i < 8; i++) await r.wloz(await c.object("bal", { x: 0.6, y: 1.3, size: 0.8, cicho: true }));
        const b = []; for (let i = 0; i < 4; i++) b.push(await c.object("bal", { x: -1.6 + i * 1.3, y: -2.2, size: 0.95 }));
        await c.say("bobr", "line.b_do_dziesieciu");
        await r.przeciagaj({ rzeczy: b, ile: 10, wrong: "line.b_pelna" });
        await c.ujecie("sredni", { na: ["sowa", r] });
        await c.say("sowa", "line.b_dziesiec", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
        // the digits 6 to 10 drawn; ten has two digits
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.b_cyfry");
        for (const [i, n] of [6, 7, 8, 9].entries()) {
          await c.ujecie("ogolny");
          const g = await c.digit(n, { x: -2.4 + i * 1.6, y: 1.4, size: 1.2 });
          await c.ujecie("sredni", { na: g.parts });   // an insert on the digit being named
          await c.say("sowa", `line.b_cyfra${n}`);
        }
        await c.ujecie("ogolny");
        c.clear();
        const g10 = await c.digit(10, { x: 0.6, y: 1.2, size: 1.8 });
        await c.ujecie("sredni", { na: ["sowa", ...g10.parts] });
        await c.say("sowa", "line.b_cyfra10");
        await c.ujecie("ogolny");
        c.clear();
        // the breather: hop along the stones to the number Beaver says
        const os = await c.os({ od: 0, do: 10, x0: -3.6, x1: 3.9, y: -1.4, size: 0.62 });
        const cel = 6 + Math.floor(Math.random() * 4);
        await c.say("bobr", `line.b_skacz${cel}`);
        const ok = os.kamien(cel);
        dobre(ok); await c.task({ targets: os.kamienie.filter((k) => k.liczba > 0), correct: ok, wrong: "line.b_skacz_nie" });
        S.puppets.kret.korzen.position.x = os.pole(0)[0];
        await os.skocz("kret", 0, cel);
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.b_doskoczylem", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.b_tama_gotowa");
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("bobr"); c.show("sowa");
        S.puppets.bobr.korzen.position.x = -5.2; S.puppets.sowa.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1. how many (6-10) in the frame? point to the number
        {
          const ile = 6 + Math.floor(Math.random() * 5), r = await c.ramka({ x: 0.4, y: 1.3 });
          for (let i = 0; i < ile; i++) await r.wloz(await c.object("szyszka", { x: 0.4, y: 1.3, size: 0.8, cicho: true }));
          const opcje = tasuj([ile, ile === 10 ? 8 : ile + 1, ile === 6 ? 7 : ile - 1]);
          const k = await karty(c, opcje);
          await c.say("bobr", "line.p_ile");
          const ok = k.find((q) => q.liczba === ile);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_ile_nie" });
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 2. put seven in the frame
        {
          const r = await c.ramka({ x: 0.4, y: 1.3 });
          const j = []; for (let i = 0; i < 9; i++) j.push(await c.object("jablko", { x: -3.0 + i * 0.85, y: -2.3, size: 0.8 }));
          await c.say("sowa", "line.p_siedem");
          await r.przeciagaj({ rzeczy: j, ile: 7, wrong: "line.p_siedem_juz" });
          await c.ujecie("sredni", { na: ["bobr", r] });
          await c.say("bobr", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 3. write the 7
        {
          await c.ujecie("sredni", { na: ["bobr"] });
          await c.say("bobr", "line.p_napisz");
          await c.ujecie("ogolny");
          const t = await c.slad(7, { x: 0, y: 0.4, size: 2.8 }); t.remove();
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 4. which heap has more: eight or six? (counted, not guessed by the spread)
        {
          const a = await c.kupka("zoledz", 8, { x: -1.6, y: 0.8, size: 2.0 }), b = await c.kupka("zoledz", 6, { x: 2.0, y: 0.8, size: 2.4 });
          a.ile = 8; b.ile = 6;
          await c.say("sowa", "line.p_wiecej");
          dobre(a); await c.task({ targets: [a, b], correct: a, wrong: "line.p_wiecej_nie" });
          await c.ujecie("sredni", { na: ["bobr", a] });   // the heap of eight
          await c.say("bobr", "line.p_osiem"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 5. the stones: hop to nine
        {
          const os = await c.os({ od: 0, do: 10, x0: -3.6, x1: 3.9, y: -1.4, size: 0.62 });
          await c.say("bobr", "line.p_dziewiec");
          const ok = os.kamien(9);
          dobre(ok); await c.task({ targets: os.kamienie.filter((k) => k.liczba > 0), correct: ok, wrong: "line.b_skacz_nie" });
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.praise("sowa");
        await c.ujecie("ogolny");
      },
    ],
    apply: [
      // home: ten fingers - five on each hand; ten toys back into the box
      async (c) => {
        for (const n of ["bobr", "kret"]) c.show(n);
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.h_palce", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const dl = [await c.object("gest_papier", { x: -1.0, y: 1.2, size: 2.2 }), await c.object("gest_papier", { x: 2.0, y: 1.2, size: 2.2 })];
        const k = await karty(c, [8, 9, 10]);
        await c.say("bobr", "line.h_ile_palcow");
        const ok = k.find((q) => q.liczba === 10);
        dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.h_ile_palcow_nie" });
        await c.ujecie("sredni", { na: ["kret", ...dl] });   // five and five fingers
        await c.say("kret", "line.h_dziesiec", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.h_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
