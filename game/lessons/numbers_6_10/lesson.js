// Lesson: numbers 6-10 - counting on past five without skipping or doubling (a counted thing moves aside), the
// digits 6-10, ten written with two digits. Script in scenario.md.

const Y = 0.15;                 // the row of things: between the characters, so a big digit fits over it
const SZ = 0.86;
const CY = 2.65;                // a big digit: over the row and its counting badges, under the phase icons
const RZAD = { x: -4.4, y: Y, gap: 0.98 };     // where counted things line up, one after another

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
async function rzad(c, name, n, { y = Y, size = SZ, x = 0, gap = 0.1 } = {}) {
  const hs = [];
  for (let i = 0; i < n; i++) hs.push(await c.object(name, { x, y, size }));
  c.arrange([hs], { x, y, gap });
  return hs;
}
// things lying anyhow in the lower middle (a mess to be counted), never on top of each other
async function rozsyp(c, name, n, { size = SZ } = {}) {
  const spots = [];
  for (let t = 0; spots.length < n && t < 800; t++) {
    const x = (Math.random() - 0.5) * 6.4, y = -0.9 - Math.random() * 1.7;
    if (spots.every(([a, b]) => Math.hypot(a - x, b - y) > 0.85)) spots.push([x, y]);
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
      // A. orchard, the problem: the jam recipe needs six apples. Fox counts in a hurry, one apple twice and one
      // missed - "nine!". Squirrel: every thing once - move each counted one aside. The child counts: six.
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        const jablka = await rozsyp(c, "jablko", 6);
        await c.say("lisek", "line.s_jam", { anim: "Radosc" });
        await c.say("wiewiorka", "line.s_enough");
        // the naive count: too fast, one apple twice, one never
        await c.say("lisek", "line.s_fast", { anim: "Podskok" });
        const kolej = [0, 1, 2, 2, 3, 5, 4, 5, 1];
        const strzalki = [];
        for (const i of kolej) { c.sfx("tap"); jablka[i].highlight(true); await c.wait(0.18); jablka[i].highlight(false); }
        await c.say("lisek", "line.s_nine");
        await c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.s_twice");
        strzalki.push(await c.cross(jablka[2]));
        await c.wait(0.6); strzalki.forEach((s) => s.remove());
        await c.say("lisek", "line.s_how");
        const pomysl = await c.idea("wiewiorka", [["jablko", "jablko", "jablko"], ["jablko", "jablko", "jablko"]]);
        await c.say("wiewiorka", "line.s_aside", { anim: "Zgloszenie" });
        await c.say("lisek", "line.s_what");
        pomysl.remove();
        await c.say("wiewiorka", "line.s_show");
        await c.count(jablka, { who: "wiewiorka", rzad: RZAD });
        await c.say("wiewiorka", "line.s_six", { anim: "Radosc" });
        await c.say("lisek", "line.s_after_five");
        await pokazCyfre(c, 6, "wiewiorka", { x: 2.3 });
        await c.say("lisek", "line.s_solved", { anim: "Brawo" });
        await c.say("wiewiorka", "line.s_to_garden");
        c.clear();
      },
      // B. vegetable garden: seven carrots counted aside; one more pulled out - eight
      async (c) => {
        await c.go("ogrod", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        await c.say("lisek", "line.b_carrots");
        const marchewki = await rozsyp(c, "marchewka", 7);
        await c.count(marchewki, { who: "lisek", rzad: RZAD });
        await c.say("lisek", "line.b_seven");
        await pokazCyfre(c, 7, "lisek", { x: 2.5 });
        await c.say("wiewiorka", "line.b_one_more", { anim: "Podskok" });
        const nowa = await c.object("marchewka", { x: 5.2, y: -2.4, size: SZ });
        await nowa.moveTo(RZAD.x + 7 * RZAD.gap, Y, 0.7);
        await c.say("wiewiorka", "line.b_how_many_now");
        await ktoraCyfra(c, 8, "wiewiorka", "line.b_pick", oferta(8));
        await c.say("lisek", "line.b_eight", { anim: "Radosc" });
        await pokazCyfre(c, 8, "wiewiorka", { x: 2.5 });
        await c.say("wiewiorka", "line.b_to_home");
        c.clear();
      },
      // C. home: a party - nine cups, one more guest knocks: ten; ten is written with two digits
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        await c.say("wiewiorka", "line.c_party");
        const kubki = await rozsyp(c, "kubek", 9);
        await c.count(kubki, { who: "wiewiorka", rzad: { ...RZAD, x: -4.6, gap: 0.92 } });
        await pokazCyfre(c, 9, "lisek", { x: 2.5 });
        await c.say("lisek", "line.c_knock", { anim: "Rozgladanie" });
        const kubek = await c.object("kubek", { x: -5.6, y: -2.2, size: SZ });
        await c.take("lisek", kubek, { d: 0.3 });
        await c.walkTo("lisek", 1.8);
        await c.put("lisek", -4.6 + 9 * 0.92, Y);
        await c.walkTo("lisek", -4.6);
        await c.say("wiewiorka", "line.c_ten");
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
          await c.count(hs, { who: "lisek", rzad: { x: -4.5, y: Y, gap: 0.92 } });
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
          await c.count(hs, { who: "wiewiorka", rzad: { x: -4.5, y: Y, gap: 0.92 } });
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
