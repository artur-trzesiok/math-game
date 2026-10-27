// Lesson 3: grouping by a criterion (kind, purpose, colour, size). The child DRAGS
// things into two containers in any order; what matters is that each container ends
// up holding one kind. Script in scenario.md.

const ROW_Y = 1.2;                               // loose things: above the puppets' heads
const ZL = -1.75, ZR = 1.75, ZY = -2.0;          // the two containers on the floor between the puppets
const ZW = 3.3, ZH = 2.6;

async function scatter(c, items, size = 0.85) {
  const hs = [];
  const shuffled = items.slice().sort(() => Math.random() - 0.5);
  for (const it of shuffled) {
    const h = await c.object(it.name, { y: ROW_Y, size: it.size || size });
    h.tag = it.tag; hs.push(h);
  }
  c.arrange([hs], { y: ROW_Y, gap: 0.14 });
  return hs;
}
async function containers(c) {
  return [await c.zone({ x: ZL, y: ZY, w: ZW, h: ZH, image: "koszyk", name: "koszyk" }),
          await c.zone({ x: ZR, y: ZY, w: ZW, h: ZH, image: "pudelko", name: "pudelko" })];
}

export default {
  id: "grouping",
  characters: { wiewiorka: { side: "left" }, sarenka: { side: "right" } },
  backgrounds: { story: "pokoj", practice: "pokoj", apply: "dom" },
  stages: {
    story: [
      // 1. after a snack: apples and pears mixed up on the rug - one container each
      async (c) => {
        await Promise.all([c.enter("wiewiorka"), c.enter("sarenka")]);
        await c.say("wiewiorka", "line.s1_intro");
        const items = await scatter(c, [
          { name: "jablko", tag: "apple" }, { name: "gruszka", tag: "pear" }, { name: "jablko", tag: "apple" },
          { name: "gruszka", tag: "pear" }, { name: "jablko", tag: "apple" }]);
        await c.say("sarenka", "line.s1_sq_mixed");
        const zones = await containers(c);
        await c.say("wiewiorka", "line.s1_deer_idea");
        await c.say("sarenka", "line.s1_apples");
        await c.sort({ items, zones, wrong: "line.s1_mixed" });
        await c.say("sarenka", "line.s1_apples_done");
        await c.say("sarenka", "line.s1_deer_happy", { anim: "Radosc" });
        await c.say("wiewiorka", "line.s1_daily");
        c.clear();
      },
      // 2. the same things, another rule: by size
      async (c) => {
        await c.say("wiewiorka", "line.s2_sq_size");
        const items = await scatter(c, [
          { name: "jablko", tag: "big", size: 1.3 }, { name: "gruszka", tag: "small", size: 0.7 }, { name: "jablko", tag: "small", size: 0.7 },
          { name: "gruszka", tag: "big", size: 1.3 }, { name: "jablko", tag: "big", size: 1.3 }]);
        const zones = await containers(c);
        await c.say("sarenka", "line.s2_big");
        await c.sort({ items, zones, wrong: "line.s2_mixed" });
        await c.say("wiewiorka", "line.s2_summary");
        c.clear();
      },
    ],
    practice: [
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka");
        await c.say("sarenka", "line.p_intro");
        const rounds = [
          { ask: "line.p_cups", items: [
            { name: "kubek", tag: "cup" }, { name: "talerz", tag: "x" }, { name: "kubek", tag: "cup" }, { name: "pilka", tag: "x" }, { name: "kubek", tag: "cup" }, { name: "talerz", tag: "x" }] },
          { ask: "line.p_food", items: [
            { name: "ciastko", tag: "food" }, { name: "skarpetka", tag: "x" }, { name: "jablko", tag: "food" }, { name: "pilka", tag: "x" }, { name: "gruszka", tag: "food" }, { name: "kubek", tag: "x" }] },
          { ask: "line.p_red", items: [
            { name: "jablko", tag: "red" }, { name: "gruszka", tag: "x" }, { name: "pilka", tag: "red" }, { name: "kubek", tag: "x" }, { name: "talerz", tag: "x" }, { name: "jablko", tag: "red" }] },
          { ask: "line.p_small", items: [
            { name: "kwiatek", tag: "small", size: 0.7 }, { name: "kwiatek", tag: "x", size: 1.3 }, { name: "ciastko", tag: "small", size: 0.7 },
            { name: "ciastko", tag: "x", size: 1.3 }, { name: "pilka", tag: "x", size: 1.3 }, { name: "pilka", tag: "small", size: 0.7 }] },
        ];
        for (const r of rounds) {
          const items = await scatter(c, r.items);
          const zones = await containers(c);
          await c.say("sarenka", r.ask);
          await c.sort({ items, zones, wrong: "line.p_mixed" });
          await c.say("sarenka", "line.p_done");
          await c.say("wiewiorka", "line.p_good", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // the home game: tidying up after a snack - Squirrel puts the food away, the child the dishes
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka");
        await c.say("sarenka", "line.a_deer_tidy");
        const items = await scatter(c, [
          { name: "jablko", tag: "food" }, { name: "kubek", tag: "dish" }, { name: "ciastko", tag: "food" },
          { name: "talerz", tag: "dish" }, { name: "gruszka", tag: "food" }, { name: "kubek", tag: "dish" }]);
        const zones = await containers(c);
        await c.say("wiewiorka", "line.a_sq_food");
        for (const h of items.filter((h) => h.tag === "food")) { zones[0].put(h); await c.wait(0.4); }
        await c.say("sarenka", "line.a_deer_dishes");
        await c.sort({ items, zones, wrong: "line.a_mixed" });
        await c.say("wiewiorka", "line.a_sq_right", { anim: "Brawo" });
        c.clear();
        await c.say("sarenka", "line.a_ask_parents");
        await c.say("wiewiorka", "line.a_bye");
        await c.play("wiewiorka", "Machanie"); await c.play("sarenka", "Machanie");
      },
    ],
  },
};
