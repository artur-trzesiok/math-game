// Lesson 3: grouping by a criterion (kind, colour, size). The child taps the things
// that belong to the named group; each tap moves the thing into the group's zone.
// Script in scenario.md.

const ROW_Y = 0.9;                             // loose things: above the puppets' heads
const ZONE_L = -1.7, ZONE_R = 1.7, ZONE_Y = -2.3; // zones: on the ground between the puppets

// scatter stickers in a row; `items` = [{name, size, tag}]
async function scatter(c, items, y = ROW_Y, size = 0.85) {
  const hs = [];
  const shuffled = items.slice().sort(() => Math.random() - 0.5);
  for (const [i, it] of shuffled.entries()) {
    const h = await c.object(it.name, { x: (i - (shuffled.length - 1) / 2) * 1.25, y, size: it.size || size });
    h.tag = it.tag; hs.push(h);
  }
  return hs;
}
// one sorting round: tap every item with `tag`; wrong taps are explained; right ones fly into the zone
async function sortInto(c, items, tag, zone, { wrong, done }) {
  let left = items.filter((h) => h.tag === tag);
  while (left.length) {
    const hit = await c.task({ targets: items.filter((h) => !h.sorted), correct: left, wrong, hintAfter: 2 });
    if (!hit) return;
    hit.sorted = true; hit.highlight(false);
    const s = zone.slot(); await hit.moveTo(s.x, s.y, 0.5);
    left = left.filter((h) => h !== hit);
  }
  if (done) await c.say("narrator", done);
}

export default {
  id: "grouping",
  characters: { wiewiorka: { side: "left" }, sarenka: { side: "right" } },
  backgrounds: { story: "pokoj", practice: "pokoj", apply: "dom" },
  stages: {
    story: [
      // 1. tidying up after the picnic: apples to one basket, pears to the other
      async (c) => {
        await Promise.all([c.enter("wiewiorka"), c.enter("sarenka")]);
        await c.say("narrator", "line.s1_intro");
        const items = await scatter(c, [
          { name: "jablko", tag: "apple" }, { name: "gruszka", tag: "pear" }, { name: "jablko", tag: "apple" },
          { name: "gruszka", tag: "pear" }, { name: "jablko", tag: "apple" }]);
        await c.say("wiewiorka", "line.s1_sq_mixed");
        await c.say("sarenka", "line.s1_deer_idea");
        const za = c.zone({ x: ZONE_L, y: ZONE_Y, w: 3.1, h: 1.9 }), zp = c.zone({ x: ZONE_R, y: ZONE_Y, w: 3.1, h: 1.9 });
        await c.say("narrator", "line.s1_apples");
        await sortInto(c, items, "apple", za, { wrong: "line.s1_not_apple", done: "line.s1_apples_done" });
        await c.say("narrator", "line.s1_pears");
        await sortInto(c, items, "pear", zp, { wrong: "line.s1_not_pear", done: "line.s1_pears_done" });
        await c.say("sarenka", "line.s1_deer_happy", { anim: "Radosc" });
        await c.say("narrator", "line.s1_daily");
        c.clear();
      },
      // 2. the same things, another rule: by size
      async (c) => {
        await c.say("wiewiorka", "line.s2_sq_size");
        const items = await scatter(c, [
          { name: "jablko", tag: "big", size: 1.3 }, { name: "gruszka", tag: "small", size: 0.7 }, { name: "jablko", tag: "small", size: 0.7 },
          { name: "gruszka", tag: "big", size: 1.3 }, { name: "jablko", tag: "big", size: 1.3 }]);
        const zb = c.zone({ x: ZONE_L, y: ZONE_Y, w: 3.1, h: 1.9 }), zs = c.zone({ x: ZONE_R, y: ZONE_Y, w: 3.1, h: 1.9 });
        await c.say("narrator", "line.s2_big");
        await sortInto(c, items, "big", zb, { wrong: "line.s2_not_big" });
        await c.say("narrator", "line.s2_small");
        await sortInto(c, items, "small", zs, { wrong: "line.s2_not_small" });
        await c.say("narrator", "line.s2_summary");
        c.clear();
      },
    ],
    practice: [
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka");
        await c.say("sarenka", "line.p_intro");
        const rounds = [
          { ask: "line.p_cups", wrong: "line.p_not_cup", tag: "cup", items: [
            { name: "kubek", tag: "cup" }, { name: "talerz", tag: "x" }, { name: "kubek", tag: "cup" }, { name: "pilka", tag: "x" }, { name: "kubek", tag: "cup" }, { name: "talerz", tag: "x" }] },
          { ask: "line.p_food", wrong: "line.p_not_food", tag: "food", items: [
            { name: "ciastko", tag: "food" }, { name: "skarpetka", tag: "x" }, { name: "jablko", tag: "food" }, { name: "pilka", tag: "x" }, { name: "gruszka", tag: "food" }, { name: "kubek", tag: "x" }] },
          { ask: "line.p_red", wrong: "line.p_not_red", tag: "red", items: [
            { name: "jablko", tag: "red" }, { name: "gruszka", tag: "x" }, { name: "pilka", tag: "red" }, { name: "kubek", tag: "x" }, { name: "talerz", tag: "x" }, { name: "jablko", tag: "red" }] },
          { ask: "line.p_small", wrong: "line.p_not_small", tag: "small", items: [
            { name: "kwiatek", tag: "small", size: 0.7 }, { name: "kwiatek", tag: "x", size: 1.3 }, { name: "ciastko", tag: "small", size: 0.7 },
            { name: "ciastko", tag: "x", size: 1.3 }, { name: "pilka", tag: "x", size: 1.3 }, { name: "pilka", tag: "small", size: 0.7 }] },
        ];
        for (const r of rounds) {
          const items = await scatter(c, r.items);
          const zone = c.zone({ x: 0, y: ZONE_Y, w: 6.4, h: 1.9 });
          await c.say("sarenka", r.ask);
          await sortInto(c, items, r.tag, zone, { wrong: r.wrong, done: "line.p_done" });
          await c.say("wiewiorka", "line.p_good", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka");
        await c.say("narrator", "line.a_intro");
        await c.say("wiewiorka", "line.a_sq_socks");
        await c.say("sarenka", "line.a_deer_toys");
        await c.card("card.a_parents");
        await c.say("narrator", "line.a_bye");
        await c.play("wiewiorka", "Machanie"); await c.play("sarenka", "Machanie");
      },
    ],
  },
};
