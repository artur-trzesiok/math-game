// Lesson: numbers 6-10 - counting on past five without skipping or doubling (a counted thing moves aside), the
// digits 6-10, ten written with two digits. Script in scenario.md.

const Y = 0.15;                 // the row of things: between the characters, so a big digit fits over it
const SZ = 0.86;
const CY = 2.65;                // a big digit: over the row and its counting badges, under the phase icons
// where counted things line up, one after another: centred for the whole count (n), so the row stays off the heads
const rzadNa = (n, gap = n > 9 ? 0.74 : 0.86) => ({ x: -((n - 1) * gap) / 2, y: Y, gap });

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
async function rzad(c, name, n, { y = Y, size = SZ, x = 0, gap = 0.1 } = {}) {
  const hs = [];
  for (let i = 0; i < n; i++) hs.push(await c.object(name, { x, y, size }));
  c.arrange([hs], { x, y, gap });
  return hs;
}
// things lying anyhow in the lower middle (a mess to be counted), never on top of each other
async function rozsyp(c, name, n, { size = SZ, szer = 5.6, odstep = Math.min(1.15, Math.sqrt((5.6 * 2.0) / n) * 0.8) } = {}) {
  let spots = [];
  for (let t = 0; spots.length < n; t++) {
    if (t > 0 && t % 800 === 0) { spots = []; odstep *= 0.92; }        // crowded: a little closer, never fewer things
    const x = (Math.random() - 0.5) * szer, y = -0.8 - Math.random() * 2.0;
    if (spots.every(([a, b]) => Math.hypot(a - x, b - y) > odstep)) spots.push([x, y]);
  }
  const hs = [];
  for (const [x, y] of spots) { const h = await c.object(name, { x, y, size }); h.mesh.rotation.z = (Math.random() - 0.5) * 1.2; hs.push(h); }
  return hs;
}
async function ktoraCyfra(c, n, who, key, oferta) {
  const karty = [];
  for (const d of oferta) { const k = await c.sign(String(d), { size: 1.0 }); karty.push(k); }
  c.arrange([karty], { y: -2.1, gap: 0.8 });
  await c.say(who, key);
  const dobra = karty[oferta.indexOf(n)];
  await c.task({ targets: karty, correct: dobra, wrong: "line.wrong_digit" });
  for (const k of karty) if (k !== dobra) k.remove();
  dobra.highlight(true); await c.wait(0.6); dobra.highlight(false);
  return dobra;
}
async function pokazCyfre(c, n, who, { x = 0, y = CY } = {}) {
  const [d] = await Promise.all([c.digit(n, { x, y, size: 1.3, duration: 1.0 }), c.say(who, `line.d${n}`, { anim: "Wskazanie" })]);
  return d;
}
const oferta = (n) => tasuj([n, n === 10 ? 8 : n + 1, n === 6 ? 7 : n - 1].filter((v, i, a) => a.indexOf(v) === i));

export default {
  id: "numbers_6_10",
  characters: { lisek: { side: "left" }, wiewiorka: { side: "right" } },
  backgrounds: { story: "sad", practice: "plac_zabaw", apply: "przedpokoj" },
  stages: {
    story: [
      // A. orchard, the problem: the jam recipe needs six apples. Fox counts out loud in a hurry, one apple twice -
      // "seven!". Squirrel: every thing once - move each counted one aside. The child counts: six.
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        const jablka = await rozsyp(c, "jablko", 6);
        await c.say("lisek", "line.s_jam", { anim: "Radosc" });
        await c.say("wiewiorka", "line.s_enough");
        await c.say("lisek", "line.s_fast", { anim: "Podskok" });            // the hurry, so "too fast!" has a cause
        // the naive count, out loud: every counted apple grows a little, so the one counted twice ends up the biggest -
        // six apples, "seven!" (one twice, none missed: the only mistake a child can see)
        const kolej = [0, 1, 2, 3, 2, 4, 5];
        for (const [k, i] of kolej.entries()) {
          const j = jablka[i]; j.base *= 1.28; j.highlight(true);
          await c.say("lisek", `line.n${k + 1}`);
          j.highlight(false);
        }
        await c.say("lisek", "line.s_seven");
        await c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.s_twice");
        const kolko = await c.circle(jablka[2]);
        await c.say("lisek", "line.s_how");
        kolko.remove();
        for (const j of jablka) { j.base = SZ; j.mesh.scale.setScalar(SZ); }   // a fresh start for the right count, once the evidence was seen
        const pomysl = await c.idea("wiewiorka", [["jablko", "jablko", "jablko", "jablko", "jablko", "jablko"]]);   // one row, as the count lines them up
        await c.say("wiewiorka", "line.s_aside", { anim: "Zgloszenie" });
        await c.say("lisek", "line.s_what");
        pomysl.remove();
        await c.say("wiewiorka", "line.s_show");
        await c.count(jablka, { who: "wiewiorka", rzad: rzadNa(6) });
        await c.say("wiewiorka", "line.s_six", { anim: "Radosc" });
        await c.say("lisek", "line.s_after_five");
        await pokazCyfre(c, 6, "wiewiorka", { x: 2.3 });
        await c.say("lisek", "line.s_solved", { anim: "Brawo" });
        await c.say("wiewiorka", "line.s_to_garden");
        c.clear();
      },
      // B. vegetable garden: seven carrots counted aside; one more pulled out and counted on - eight; the digit 8
      // is shown before the child is asked to find it
      async (c) => {
        await c.go("ogrod", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        const marchewki = await rozsyp(c, "marchewka", 7);
        await c.say("lisek", "line.b_carrots");
        await c.count(marchewki, { who: "lisek", rzad: rzadNa(8) });          // room for the eighth
        await c.say("lisek", "line.b_seven");
        const siedem = await pokazCyfre(c, 7, "lisek", { x: 2.5 });
        await c.say("wiewiorka", "line.b_one_more", { anim: "Podskok" });
        const nowa = await c.object("marchewka", { x: 2.2, y: -2.3, size: SZ });
        await c.say("wiewiorka", "line.b_how_many_now");
        // counting on: the new one is the eighth; only then the digit 8 is shown, and only then asked for
        await c.count([nowa], { who: "lisek", od: 7, rzad: { ...rzadNa(8), x: rzadNa(8).x + 7 * rzadNa(8).gap } });
        await c.say("lisek", "line.b_eight", { anim: "Radosc" });
        await c.say("wiewiorka", "line.b_enough");                            // the jam needed eight: solved
        siedem.remove();                                       // one big digit at a time: an 8 drawn over the 7 read as neither
        await pokazCyfre(c, 8, "wiewiorka", { x: 2.5 });
        await ktoraCyfra(c, 8, "wiewiorka", "line.b_pick", tasuj([6, 7, 8]));   // only digits met so far (9 comes later)
        await c.say("wiewiorka", "line.b_to_home");
        c.clear();
      },
      // C. home: a party - nine cups, one more guest knocks: ten; ten is written with two digits
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        await c.say("wiewiorka", "line.c_party");
        const kubki = await rozsyp(c, "kubek", 9);
        const R10 = rzadNa(10);
        await c.count(kubki, { who: "wiewiorka", rzad: R10 });
        const dziewiec = await pokazCyfre(c, 9, "lisek", { x: 2.5 });
        await c.say("lisek", "line.c_knock", { anim: "Rozgladanie" });
        const kubek = await c.object("kubek", { x: -5.6, y: -2.2, size: SZ });
        await c.take("lisek", kubek, { d: 0.3 });
        await c.walkTo("lisek", 1.8);
        await c.put("lisek", R10.x + 9 * R10.gap, -1.4);
        await c.walkTo("lisek", -4.6);
        await c.say("wiewiorka", "line.c_count_on");
        await c.count([kubek], { who: "wiewiorka", od: 9, rzad: { ...R10, x: R10.x + 9 * R10.gap } });   // the tenth is counted too
        await c.say("wiewiorka", "line.c_ten");
        dziewiec.remove();
        await pokazCyfre(c, 10, "wiewiorka", { x: 1.2 });
        await c.say("lisek", "line.c_solved", { anim: "Brawo" });
        c.clear();
      },
    ],
    practice: [
      // three "count and point to the digit", two "point to the group with n"
      async (c) => {
        c.show("lisek"); c.show("wiewiorka");
        await c.say("lisek", "line.p_intro");
        const rzeczy = ["kwiatek", "pilka", "gruszka", "szyszka", "lyzka"];
        for (const n of tasuj([6, 8, 10])) {
          const hs = await rozsyp(c, rzeczy.shift(), n, { size: 0.78 });
          await c.say("lisek", "line.p_count");
          await c.count(hs, { who: "lisek", rzad: rzadNa(hs.length) });
          await ktoraCyfra(c, n, "wiewiorka", "line.p_which_digit", oferta(n));
          await c.say("lisek", "line.good_digit", { anim: "Brawo" });
          c.clear();
        }
        for (const [n, m] of [[7, 6], [9, 10]]) {
          const lewa = Math.random() < 0.5, nazwa = rzeczy.shift() || "kubek";
          await rzad(c, nazwa, n, { x: lewa ? -3 : 3, size: 0.56, gap: 0.03 }); await rzad(c, nazwa, m, { x: lewa ? 3 : -3, size: 0.56, gap: 0.03 });
          const zn = await c.zone({ x: lewa ? -3 : 3, y: Y, w: n * 0.54 + 0.5, h: 1.0 }), zm = await c.zone({ x: lewa ? 3 : -3, y: Y, w: m * 0.54 + 0.5, h: 1.0 });
          await c.say("wiewiorka", `line.p_group_${n}`);
          await c.task({ targets: [zn, zm], correct: zn, wrong: "line.p_wrong_group" });
          await c.say("lisek", "line.good_group", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      // the home game: count things in the hallway, moving each aside - shoes, socks, blocks
      async (c) => {
        c.show("lisek"); c.show("wiewiorka");
        await c.say("wiewiorka", "line.a_game");
        await c.say("lisek", "line.a_ok");
        for (const [nazwa, n] of [["but", 6], ["skarpetka", 8], ["klocek", 10]]) {
          const hs = await rozsyp(c, nazwa, n, { size: 0.78 });
          await c.say("lisek", `line.a_count_${nazwa}`);
          await c.count(hs, { who: "wiewiorka", rzad: rzadNa(hs.length) });
          await ktoraCyfra(c, n, "lisek", "line.a_which_digit", oferta(n));
          await c.say("wiewiorka", "line.good_digit", { anim: "Brawo" });
          c.clear();
        }
        await c.say("wiewiorka", "line.a_ask_parents");
        await c.say("lisek", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("wiewiorka", "Machanie");
      },
    ],
  },
};
