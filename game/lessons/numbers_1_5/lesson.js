// Lesson: numbers 1-5 - counting (every thing once, the last number says how many) and what the digits look
// like. Script in scenario.md.

const Y = 0.15;                 // the row of things: between the characters, so a big digit fits over it                  // the row of things, above the characters' heads
const SZ = 1.2;
const CY = 2.65;                // a big digit: over the row and its counting badges, under the phase icons                 // where a big digit is drawn, over the row

async function rzad(c, name, n, { y = Y, size = SZ, x = 0, gap = 0.14 } = {}) {
  const hs = [];
  for (let i = 0; i < n; i++) hs.push(await c.object(name, { x, y, size }));
  c.arrange([hs], { x, y, gap });
  return hs;
}
// the digit cards on the floor; the child points to the one for n
async function ktoraCyfra(c, n, who, key, oferta) {
  const karty = [];
  for (const d of oferta) { const k = await c.sign(String(d), { size: 1.0 }); k.value = d; karty.push(k); }
  c.arrange([karty], { y: -2.1, gap: 0.8 });
  await c.say(who, key);
  const dobra = karty[oferta.indexOf(n)];
  await c.task({ targets: karty, correct: dobra, wrong: "line.wrong_digit" });
  for (const k of karty) if (k !== dobra) k.remove();
  dobra.highlight(true); await c.wait(0.6); dobra.highlight(false);
  return dobra;
}
// a big digit drawn with the pencil, its rhyme said while it is drawn
async function pokazCyfre(c, n, who, { x = 0, y = CY } = {}) {
  const [d] = await Promise.all([c.digit(n, { x, y, size: 1.3, duration: 1.0 }), c.say(who, `line.d${n}`, { anim: "Wskazanie" })]);
  return d;
}
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const oferta = (n) => tasuj([n, n === 5 ? 3 : n + 1, n === 1 ? 2 : n - 1].filter((v, i, a) => a.indexOf(v) === i));

export default {
  id: "numbers_1_5",
  characters: { wiewiorka: { side: "left" }, sowa: { side: "right" } },
  backgrounds: { story: "las", practice: "laka", apply: "pokoj" },
  stages: {
    story: [
      // A. forest, the problem: Squirrel stores cones for winter and has "a lot". Owl: "a lot" says nothing -
      // count! Every cone once, the last number says how many; the digits 1, 2, 3; the store is labelled.
      async (c) => {
        await Promise.all([c.enter("wiewiorka"), c.enter("sowa")]);
        const szyszki = await rzad(c, "szyszka", 3);
        await c.say("wiewiorka", "line.s_store", { anim: "Radosc" });
        await c.say("sowa", "line.s_how_many");
        await c.say("wiewiorka", "line.s_lots", { anim: "Podskok" });
        await c.wonder("sowa");
        await c.say("sowa", "line.s_lots_not");
        await c.say("wiewiorka", "line.s_how");
        const pomysl = await c.idea("sowa", [["szyszka", "szyszka", "szyszka"]]);
        await c.say("sowa", "line.s_count", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.s_what");
        pomysl.remove();
        await c.say("sowa", "line.s_show");
        await c.say("sowa", "line.s_point_each");
        await c.count(szyszki, { who: "sowa" });
        await c.say("sowa", "line.s_last", { anim: "Radosc" });
        // the digits: 1, 2, 3 drawn big, each with its rhyme
        await c.say("sowa", "line.s_digits");
        const cyfry = [];
        for (const [i, n] of [1, 2, 3].entries()) cyfry.push(await pokazCyfre(c, n, "sowa", { x: -2.2 + i * 2.2 }));
        await c.say("wiewiorka", "line.s_point_3");
        await c.task({ targets: cyfry, correct: cyfry[2], wrong: "line.wrong_digit" });
        await c.circle(cyfry[2]);
        await c.say("wiewiorka", "line.s_solved", { anim: "Brawo" });
        await c.say("sowa", "line.s_to_brook");
        c.clear();
      },
      // B. the brook: pebbles for hopscotch - Squirrel brings one more each time; four; the digit 4
      async (c) => {
        await c.go("strumyk", { enter: true });
        await Promise.all([c.enter("wiewiorka"), c.enter("sowa")]);
        await c.say("wiewiorka", "line.b_pebbles");
        const kamyki = await rzad(c, "kamyk", 4);
        await c.say("sowa", "line.b_count");
        await c.count(kamyki, { who: "wiewiorka" });
        await c.say("wiewiorka", "line.b_four", { anim: "Radosc" });
        await pokazCyfre(c, 4, "sowa", { x: 0 });
        await ktoraCyfra(c, 4, "sowa", "line.b_pick_4", tasuj([3, 4, 5]));
        await c.say("sowa", "line.good_digit", { anim: "Brawo" });
        await c.say("wiewiorka", "line.b_to_home");
        c.clear();
      },
      // C. home: cookies for the guests - five; the digit 5; which plate has five?
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all([c.enter("wiewiorka"), c.enter("sowa")]);
        await c.say("sowa", "line.c_cookies");
        const ciastka = await rzad(c, "ciastko", 5);
        await c.count(ciastka, { who: "sowa" });
        await c.say("sowa", "line.c_five", { anim: "Radosc" });
        await pokazCyfre(c, 5, "wiewiorka", { x: 0 });
        c.clear();
        // two plates of cookies: which one has five?
        await c.say("wiewiorka", "line.c_two_plates");
        const a = await rzad(c, "ciastko", 5, { x: -2.7, gap: 0.05, size: 0.78 }), b = await rzad(c, "ciastko", 4, { x: 2.7, gap: 0.05, size: 0.78 });
        const lewa = Math.random() < 0.5;
        if (!lewa) { c.arrange([b], { x: -2.6, y: Y, gap: 0.05 }); c.arrange([a], { x: 2.6, y: Y, gap: 0.05 }); }
        const piec = await c.zone({ x: lewa ? -2.6 : 2.6, y: Y, w: 4.6, h: 1.5 }), cztery = await c.zone({ x: lewa ? 2.6 : -2.6, y: Y, w: 3.8, h: 1.5 });
        await c.say("wiewiorka", "line.c_pick_5");
        await c.task({ targets: [piec, cztery], correct: piec, wrong: "line.c_wrong_5" });
        await c.say("sowa", "line.c_solved", { anim: "Brawo" });
        c.clear();
      },
    ],
    practice: [
      // five rounds: three "how many? point to the digit", two "point to the group with n"
      async (c) => {
        c.show("wiewiorka"); c.show("sowa");
        await c.say("sowa", "line.p_intro");
        const rzeczy = ["jablko", "kwiatek", "pilka", "gruszka", "marchewka"];
        for (const n of tasuj([2, 3, 5]).concat()) {
          const hs = await rzad(c, rzeczy.shift(), n);
          await ktoraCyfra(c, n, "sowa", "line.p_how_many", oferta(n));
          await c.say("wiewiorka", "line.good_digit", { anim: "Brawo" });
          c.clear();
        }
        for (const [n, m] of [[1, 2], [4, 3]]) {
          const lewa = Math.random() < 0.5;
          const nazwa = rzeczy.shift() || "kubek";
          const A = await rzad(c, nazwa, n, { x: lewa ? -2.6 : 2.6 }), B = await rzad(c, nazwa, m, { x: lewa ? 2.6 : -2.6 });
          const zn = await c.zone({ x: lewa ? -2.6 : 2.6, y: Y, w: Math.max(1.6, n * 1.2 + 0.5), h: 1.6 });
          const zm = await c.zone({ x: lewa ? 2.6 : -2.6, y: Y, w: Math.max(1.6, m * 1.2 + 0.5), h: 1.6 });
          await c.say("wiewiorka", `line.p_group_${n}`);
          await c.task({ targets: [zn, zm], correct: zn, wrong: "line.p_wrong_group" });
          await c.say("sowa", "line.good_group", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // the home game: count your toys - the friends show it, then the child counts by touch and finds the digit
      async (c) => {
        c.show("wiewiorka"); c.show("sowa");
        await c.say("wiewiorka", "line.a_game");
        await c.say("sowa", "line.a_ok");
        for (const [nazwa, n] of [["klocek", 3], ["misiu", 2], ["pilka", 5]]) {
          const hs = await rzad(c, nazwa, n);
          await c.say("sowa", `line.a_count_${nazwa}`);
          await c.count(hs, { who: "wiewiorka" });
          await ktoraCyfra(c, n, "wiewiorka", "line.a_which_digit", oferta(n));
          await c.say("sowa", "line.good_digit", { anim: "Brawo" });
          c.clear();
        }
        await c.say("sowa", "line.a_ask_parents");
        await c.say("wiewiorka", "line.a_bye");
        await c.play("wiewiorka", "Machanie"); await c.play("sowa", "Machanie");
      },
    ],
  },
};
