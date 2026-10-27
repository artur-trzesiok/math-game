// Lesson: adding up to 10 by counting on - the first group is known already, so we start from its number and
// count only the new things; the equation written with the pencil. Script in scenario.md.

const Y = 1.0;
const SZ = 0.62;
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);

async function wStrefie(c, zona, name, n, size = SZ) {
  const hs = [];
  for (let i = 0; i < n; i++) { const h = await c.object(name, { x: zona.x, y: zona.y, size }); h.tag = "x"; zona.put(h); hs.push(h); }
  return hs;
}
async function kupka(c, name, n, { x, y = -2.2, size = SZ } = {}) {
  const hs = [];
  for (let i = 0; i < n; i++) { const h = await c.object(name, { x, y, size }); hs.push(h); }
  c.arrange([hs], { x, y, gap: 0.1 });
  return hs;
}
async function ktoraCyfra(c, n, who, key, oferta, { y = -2.45 } = {}) {
  const karty = [];
  for (const d of oferta) karty.push(await c.sign(String(d), { size: 1.2 }));
  c.arrange([karty], { y, gap: 0.8 });
  await c.say(who, key);
  const dobra = karty[oferta.indexOf(n)];
  await c.task({ targets: karty, correct: dobra, wrong: "line.wrong_digit" });
  for (const k of karty) if (k !== dobra) k.remove();
  return dobra;
}
const oferta = (n) => tasuj([n, n === 10 ? 8 : n + 1, n - 1].filter((v, i, a) => a.indexOf(v) === i));
// a basket that holds `a` things already counted: a pencil number over it says how many are inside
async function koszZLiczba(c, nazwa, a, { x = -0.8, image = "koszyk" } = {}) {
  const kosz = await c.zone({ x, y: -0.55, w: 4.2, h: 2.4, image, name: image });
  await wStrefie(c, kosz, nazwa, a, 1.0);
  const liczba = await c.digit(a, { x, y: 1.25, size: 1.0, color: "#1f5fbf", duration: 0.4 });
  return { kosz, liczba };
}

export default {
  id: "adding_10",
  characters: { wiewiorka: { side: "left" }, sarenka: { side: "right" } },
  backgrounds: { story: "strumyk", practice: "przedpokoj", apply: "pokoj" },
  stages: {
    story: [
      // A. brook, the problem: hopscotch needs eight pebbles; Squirrel has five in her basket (counted this morning),
      // Deer brings three. Squirrel counts everything from one and loses count. Deer: start from five - count on!
      async (c) => {
        await Promise.all([c.enter("wiewiorka"), c.enter("sarenka")]);
        await koszZLiczba(c, "kamyk", 5);
        const nowe = await kupka(c, "kamyk", 3, { x: 2.6, y: 0.8, size: 0.95 });
        await c.say("sarenka", "line.s_need");
        await c.say("wiewiorka", "line.s_have", { anim: "Wskazanie" });
        await c.say("wiewiorka", "line.s_naive", { anim: "Smutek" });
        await c.wonder("sarenka");
        await c.say("sarenka", "line.s_not");
        await c.say("wiewiorka", "line.s_how");
        const pomysl = await c.idea("sarenka", [["kamyk", "kamyk", "kamyk", "kamyk", "kamyk"], ["kamyk", "kamyk", "kamyk"]], { size: 0.45 });
        await c.say("sarenka", "line.s_on", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.s_what");
        pomysl.remove();
        await c.say("sarenka", "line.s_show");
        await c.count(nowe, { who: "sarenka", od: 5 });
        await c.say("wiewiorka", "line.s_eight", { anim: "Radosc" });
        await Promise.all([c.equation([5, "+", 3, "=", 8], { y: 2.7, size: 1.2 }), c.say("sarenka", "line.s_write", { anim: "Wskazanie" })]);
        await c.say("wiewiorka", "line.s_solved", { anim: "Brawo" });
        await c.say("sarenka", "line.s_to_garden");
        c.clear();
      },
      // B. garden: six carrots in the basket, two more pulled out - count on from six; the digit
      async (c) => {
        await c.go("ogrod", { enter: true });
        await Promise.all([c.enter("wiewiorka"), c.enter("sarenka")]);
        await koszZLiczba(c, "marchewka", 6);
        await c.say("wiewiorka", "line.b_basket");
        const nowe = await kupka(c, "marchewka", 2, { x: 2.6, y: 0.8, size: 0.95 });
        await c.say("sarenka", "line.b_more", { anim: "Podskok" });
        await c.say("sarenka", "line.b_count");
        await c.count(nowe, { who: "wiewiorka", od: 6 });
        const k = await ktoraCyfra(c, 8, "wiewiorka", "line.b_pick", oferta(8));
        k.remove();
        await Promise.all([c.equation([6, "+", 2, "=", 8], { y: 2.7, size: 1.2 }), c.say("sarenka", "line.b_write")]);
        await c.say("wiewiorka", "line.b_to_home");
        c.clear();
      },
      // C. home: seven cups on the table, the guests bring three - count on from seven to ten; complete the equation
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all([c.enter("wiewiorka"), c.enter("sarenka")]);
        await koszZLiczba(c, "kubek", 7, { image: "pudelko" });
        await c.say("sarenka", "line.c_cups");
        const nowe = await kupka(c, "kubek", 3, { x: 2.6, y: 0.8, size: 0.95 });
        await c.say("wiewiorka", "line.c_count");
        await c.count(nowe, { who: "sarenka", od: 7 });
        const r = await c.equation([7, "+", 3, "=", null], { y: 2.7, size: 1.2 });
        const slot = await c.zone({ x: r.luki[0].x, y: r.luki[0].y, w: 1.5, h: 1.5, name: "luka" });
        const karta = await ktoraCyfra(c, 10, "wiewiorka", "line.c_slot", oferta(10));
        await karta.moveTo(r.luki[0].x, r.luki[0].y, 0.6); slot.remove();
        await c.say("sarenka", "line.c_solved", { anim: "Brawo" });
        c.clear();
      },
    ],
    practice: [
      // five rounds: a basket with its number, a few more things - count on, point to the digit
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka");
        await c.say("sarenka", "line.p_intro");
        const rzeczy = ["szyszka", "kamyk", "but", "skarpetka", "klocek"];
        for (const [a, b] of [[4, 2], [6, 3], [5, 4], [8, 2], [7, 2]]) {
          const nazwa = rzeczy.shift();
          await koszZLiczba(c, nazwa, a, { image: "pudelko" });
          const nowe = await kupka(c, nazwa, b, { x: 2.6, y: 0.8, size: 0.95 });
          await c.say("sarenka", "line.p_count_on");
          await c.count(nowe, { who: "wiewiorka", od: a });
          await ktoraCyfra(c, a + b, "sarenka", "line.p_together", oferta(a + b));
          await c.say("wiewiorka", "line.good_digit", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // the home game: spoons in the drawer, blocks in the box, cups on the shelf - count on from what is known
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka");
        await c.say("wiewiorka", "line.a_game");
        await c.say("sarenka", "line.a_ok");
        for (const [nazwa, a, b] of [["lyzka", 5, 3], ["klocek", 6, 4], ["kubek", 7, 2]]) {
          await koszZLiczba(c, nazwa, a, { image: "pudelko" });
          const nowe = await kupka(c, nazwa, b, { x: 2.6, y: 0.8, size: 0.95 });
          await c.say("sarenka", `line.a_${nazwa}`);
          await c.count(nowe, { who: "wiewiorka", od: a });
          await ktoraCyfra(c, a + b, "sarenka", "line.a_which_digit", oferta(a + b));
          await c.say("wiewiorka", "line.good_digit", { anim: "Brawo" });
          c.clear();
        }
        await c.say("sarenka", "line.a_ask_parents");
        await c.say("wiewiorka", "line.a_bye");
        await c.play("wiewiorka", "Machanie"); await c.play("sarenka", "Machanie");
      },
    ],
  },
};
