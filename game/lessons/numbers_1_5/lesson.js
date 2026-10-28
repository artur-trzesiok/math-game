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
// two groups of one thing side by side over the heads, clearly apart (a wide gap between, a small one inside), each
// outlined: the zones come from the real extent of each group. `pierwsza` = the group that is the answer
async function dwieGrupy(c, nazwa, n, m, { size = 0.85, y = 1.25 } = {}) {
  const A = [], B = [];
  for (let i = 0; i < n; i++) A.push(await c.object(nazwa, { y, size }));
  for (let i = 0; i < m; i++) B.push(await c.object(nazwa, { y, size }));
  const lewa = Math.random() < 0.5;
  const info = c.arrange(lewa ? [A, B] : [B, A], { y, gap: 0.08, groupGap: 1.8 });
  const [iA, iB] = lewa ? info : [info[1], info[0]];
  const zA = await c.zone({ x: iA.x, y, w: iA.w + 0.5, h: size * 1.12 + 0.4 }), zB = await c.zone({ x: iB.x, y, w: iB.w + 0.5, h: size * 1.12 + 0.4 });
  return { zA, zB };
}
const oferta = (n) => tasuj([n, n === 5 ? 3 : n + 1, n === 1 ? 2 : n - 1].filter((v, i, a) => a.indexOf(v) === i));

export default {
  id: "numbers_1_5",
  characters: { wiewiorka: { side: "left" }, sowa: { side: "right" } },
  backgrounds: { story: "las", practice: "laka", apply: "pokoj" },
  stages: {
    story: [
      // A. forest, the problem: Squirrel stores cones for winter and has "a lot". Owl: "a lot" says nothing -
      // count! One cone, then two, then three: each counted by touch, its digit drawn, then found among cards.
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
        // the digits come one by one, each tied to an amount, each drawn before it is asked for, one big digit at
        // a time; the cards offered are only digits already met
        const miejsca = szyszki.map((h) => ({ x: h.mesh.position.x, y: h.mesh.position.y }));
        await Promise.all([szyszki[1].moveTo(-3.3, -3.5, 0.5), szyszki[2].moveTo(-2.5, -3.6, 0.5)]);   // waiting at Squirrel's feet, clear of the cards
        await c.say("sowa", "line.s_start_one");
        let liczenie = await c.count([szyszki[0]], { who: "sowa" });
        await c.say("sowa", "line.s_one", { anim: "Radosc" });
        await c.say("sowa", "line.s_digits");
        let duza = await pokazCyfre(c, 1, "sowa");
        for (const n of [2, 3]) {
          await c.say("wiewiorka", n === 2 ? "line.s_add_2" : "line.s_add_3", { anim: "Podskok" });
          await szyszki[n - 1].moveTo(miejsca[n - 1].x, miejsca[n - 1].y, 0.5);
          liczenie.znaczki.forEach((z) => z.remove());
          await c.say("sowa", "line.s_count_again");
          liczenie = await c.count(szyszki.slice(0, n), { who: "sowa" });
          await c.say("sowa", n === 2 ? "line.s_two" : "line.s_last", { anim: "Radosc" });
          duza.remove();
          duza = await pokazCyfre(c, n, "sowa");
          const karta = await ktoraCyfra(c, n, "wiewiorka", `line.s_point_${n}`, tasuj([1, 2, 3].slice(0, n)));
          await c.say("sowa", "line.good_digit", { anim: "Brawo" });
          karta.remove();
        }
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
        await ktoraCyfra(c, 4, "sowa", "line.b_pick_4", tasuj([2, 3, 4]));   // only digits met so far
        await c.say("sowa", "line.good_digit", { anim: "Brawo" });
        await c.say("wiewiorka", "line.b_to_home");
        c.clear();
      },
      // C. home: cookies for the guests - five; the digit 5; which group has five?
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
        const { zA: piec, zB: cztery } = await dwieGrupy(c, "ciastko", 5, 4);
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
          const nazwa = rzeczy.shift() || "kubek";
          const { zA: zn, zB: zm } = await dwieGrupy(c, nazwa, n, m);
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
