// Lesson: adding up to 5 - putting two groups together and counting them all; the signs + and =, an equation
// written with the pencil. Script in scenario.md.

const Y = 1.0;
const SZ = 0.72;
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);

async function wStrefie(c, zona, name, n, size = SZ) {
  const hs = [];
  for (let i = 0; i < n; i++) { const h = await c.object(name, { x: zona.x, y: zona.y, size }); h.tag = "x"; zona.put(h); hs.push(h); }
  return hs;
}
async function kupka(c, name, n, { x, y = -2.2, size = SZ } = {}) {
  const hs = [];
  for (let i = 0; i < n; i++) { const h = await c.object(name, { x, y, size }); h.tag = "x"; hs.push(h); }
  c.arrange([hs], { x, y, gap: 0.1 });
  for (const h of hs) h.home = { x: h.mesh.position.x, y: h.mesh.position.y };
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
const oferta = (n) => tasuj([n, n === 5 ? 3 : n + 1, n === 1 ? 2 : n - 1].filter((v, i, a) => a.indexOf(v) === i));

export default {
  id: "adding_5",
  characters: { lisek: { side: "left" }, sowa: { side: "right" } },
  backgrounds: { story: "sad", practice: "las", apply: "pokoj" },
  stages: {
    story: [
      // A. orchard, the problem: three hedgehogs come for a snack, one apple each. Fox has two, Owl one; Fox thinks
      // "together that is two - mine are more, so mine count". Owl: nothing vanishes - add! Put them together, count all.
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        const kosz = await c.zone({ x: -0.9, y: -0.1, w: 5.6, h: 2.0, image: "koszyk", name: "koszyk" });
        await wStrefie(c, kosz, "jablko", 2, 1.1);
        const sowy = await kupka(c, "jablko", 1, { x: 3.4, y: 2.0, size: 1.05 });
        await c.say("sowa", "line.s_guests");
        await c.say("lisek", "line.s_fox_has", { anim: "Wskazanie" });
        await c.say("sowa", "line.s_owl_has");
        await c.say("lisek", "line.s_naive", { anim: "Podskok" });
        await c.wonder("sowa");
        await c.say("sowa", "line.s_not");
        await c.say("lisek", "line.s_how");
        const pomysl = await c.idea("sowa", [["jablko", "jablko"], ["jablko"]]);
        await c.say("sowa", "line.s_add", { anim: "Zgloszenie" });
        await c.say("lisek", "line.s_what");
        pomysl.remove();
        await c.say("sowa", "line.s_show");
        await c.sort({ items: sowy, zones: [kosz] });
        await c.say("sowa", "line.s_count_all");
        await c.count(kosz.items, { who: "lisek" });
        await c.say("lisek", "line.s_three", { anim: "Radosc" });
        await Promise.all([c.equation([2, "+", 1, "=", 3], { y: 3.65, size: 1.25 }), c.say("sowa", "line.s_write", { anim: "Wskazanie" })]);
        await c.say("sowa", "line.s_plus");
        await c.say("lisek", "line.s_solved", { anim: "Brawo" });
        await c.say("sowa", "line.s_to_meadow");
        c.clear();
      },
      // B. lake picnic: two cups and two more onto the blanket - four; the child picks the digit, the equation
      async (c) => {
        await c.go("laka", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        const koc = await c.zone({ x: -0.9, y: -0.1, w: 5.6, h: 2.0, name: "koc" });
        await wStrefie(c, koc, "kubek", 2, 1.1);
        await c.say("lisek", "line.b_picnic");
        const sowy = await kupka(c, "kubek", 2, { x: 3.4, y: 2.0, size: 1.05 });
        await c.say("sowa", "line.b_owl");
        await c.sort({ items: sowy, zones: [koc] });
        await c.say("lisek", "line.b_count");
        await c.count(koc.items, { who: "sowa" });
        const k = await ktoraCyfra(c, 4, "sowa", "line.b_pick", oferta(4));
        k.remove();
        await Promise.all([c.equation([2, "+", 2, "=", 4], { y: 3.65, size: 1.25 }), c.say("sowa", "line.b_write")]);
        await c.say("lisek", "line.b_to_home", { anim: "Radosc" });
        c.clear();
      },
      // C. home: three cookies and two more; this time the child completes the equation
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        const talerz = await c.zone({ x: -0.9, y: -0.1, w: 5.6, h: 2.0, name: "talerz" });
        await wStrefie(c, talerz, "ciastko", 3, 1.1);
        await c.say("lisek", "line.c_bake");
        const sowy = await kupka(c, "ciastko", 2, { x: 3.4, y: 2.0, size: 1.05 });
        await c.say("sowa", "line.c_owl");
        await c.sort({ items: sowy, zones: [talerz] });
        await c.count(talerz.items, { who: "lisek" });
        const r = await c.equation([3, "+", 2, "=", null], { y: 3.65, size: 1.25 });
        const slot = await c.zone({ x: r.luki[0].x, y: r.luki[0].y, w: 1.1, h: 1.5, name: "luka" });
        const karta = await ktoraCyfra(c, 5, "sowa", "line.c_slot", oferta(5));
        await karta.moveTo(r.luki[0].x, r.luki[0].y, 0.6); slot.remove();
        await c.say("sowa", "line.c_read", { anim: "Radosc" });
        await c.say("lisek", "line.c_solved", { anim: "Brawo" });
        c.clear();
      },
    ],
    practice: [
      // five rounds: two little piles with a pencil + between them; how many together? point to the digit
      async (c) => {
        c.show("lisek"); c.show("sowa");
        await c.say("sowa", "line.p_intro");
        const rzeczy = ["szyszka", "jablko", "gruszka", "kwiatek", "pilka"];
        for (const [a, b] of [[1, 1], [2, 1], [1, 3], [2, 3], [4, 1]]) {
          const nazwa = rzeczy.shift();
          await kupka(c, nazwa, a, { x: -2.4, y: Y, size: 0.95 }); await kupka(c, nazwa, b, { x: 2.4, y: Y, size: 0.95 });
          await c.equation(["+"], { x: 0, y: Y, size: 1.5 });
          await ktoraCyfra(c, a + b, "sowa", "line.p_together", oferta(a + b));
          await c.say("lisek", "line.good_digit", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // the home game: add toys - one group goes into the box with the other, count all, the digit
      async (c) => {
        c.show("lisek"); c.show("sowa");
        await c.say("lisek", "line.a_game");
        await c.say("sowa", "line.a_ok");
        for (const [nazwa, a, b] of [["misiu", 2, 1], ["klocek", 3, 2], ["pilka", 1, 3]]) {
          const pudlo = await c.zone({ x: -0.9, y: -0.1, w: 5.6, h: 2.0, image: "pudelko", name: "pudelko" });
          await wStrefie(c, pudlo, nazwa, a, 1.0);
          const reszta = await kupka(c, nazwa, b, { x: 3.4, y: 2.0, size: 1.05 });
          await c.say("sowa", "line.a_put");
          await c.sort({ items: reszta, zones: [pudlo] });
          await c.count(pudlo.items, { who: "lisek" });
          await ktoraCyfra(c, a + b, "sowa", "line.a_which_digit", oferta(a + b));
          await c.say("lisek", "line.good_digit", { anim: "Brawo" });
          c.clear();
        }
        await c.say("sowa", "line.a_ask_parents");
        await c.say("lisek", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("sowa", "Machanie");
      },
    ],
  },
};
