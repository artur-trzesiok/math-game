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
// fruit lying anyhow on the rug (the floor between the characters), each a little turned: a real mess
const RUG = { x: 0.2, y: -1.45, w: 5.6, h: 1.2 };     // the oval rug of the children's room, between the characters
async function onRug(c, items, size = 0.85) {
  // random spots on the rug, never two stickers on top of each other
  const spots = [];
  for (let tries = 0; spots.length < items.length && tries < 500; tries++) {
    const x = RUG.x + (Math.random() - 0.5) * (RUG.w - 0.9), y = RUG.y + (Math.random() - 0.5) * (RUG.h - 0.5);
    if (spots.every(([sx, sy]) => Math.hypot(sx - x, (sy - y) * 1.4) > 0.95)) spots.push([x, y]);
  }
  const out = [];
  for (const [i, it] of items.slice().sort(() => Math.random() - 0.5).entries()) {
    const [x, y] = spots[i] || [RUG.x, RUG.y];
    const h = await c.object(it.name, { x, y, size: it.size || size });
    h.tag = it.tag; h.mesh.rotation.z = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.9); out.push(h);
  }
  return out;
}
// straighten what lay turned, over a short moment
async function wyprostuj(c, items) {
  const r0 = items.map((h) => h.mesh.rotation.z);
  for (let k = 1; k <= 8; k++) { items.forEach((h, i) => { h.mesh.rotation.z = r0[i] * (1 - k / 8); }); await c.wait(0.03); }
}
// basket and box; `doKosza` / `doPudla` = the tag each takes: the lines name the containers, so a sort must keep to
// them (without it cups in the box and the rest in the basket counted as right)
async function containers(c, doKosza, doPudla) {
  const z = [await c.zone({ x: ZL, y: ZY, w: ZW, h: ZH, image: "koszyk", name: "koszyk" }),
             await c.zone({ x: ZR, y: ZY, w: ZW, h: ZH, image: "pudelko", name: "pudelko" })];
  z[0].want = doKosza; z[1].want = doPudla;
  return z;
}

export default {
  id: "grouping",
  characters: { wiewiorka: { side: "left" }, sarenka: { side: "right" } },
  backgrounds: { story: "pokoj", practice: "przedpokoj", apply: "dom" },
  stages: {
    story: [
      // A. children's room, the problem: a mess on the rug. Squirrel "tidies" by throwing everything into one box;
      // Deer: that only moves the mess - group! Sort apples and pears; then a pear is found at once.
      async (c) => {
        await Promise.all([c.enter("wiewiorka"), c.enter("sarenka")]);
        // the same five fruit come back in the kitchen ("the same fruit, another rule"), so the sizes match there
        const items = await onRug(c, [
          { name: "jablko", tag: "apple", size: 1.3 }, { name: "gruszka", tag: "pear", size: 0.7 }, { name: "jablko", tag: "apple", size: 0.7 },
          { name: "gruszka", tag: "pear", size: 1.3 }, { name: "jablko", tag: "apple", size: 1.3 }]);
        await c.say("wiewiorka", "line.g0_mess", { anim: "Rozgladanie" });
        await c.say("wiewiorka", "line.g0_box", { anim: "Podskok" });
        // the naive way: everything flies into one box, anyhow
        const box = await c.object("pudelko", { x: 0, y: -1.7, size: 2.4 });
        box.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9; });          // under the fruit falling in
        for (const h of items.slice().sort(() => Math.random() - 0.5)) {
          await h.moveTo((Math.random() - 0.5) * 1.1, -1.45 + (Math.random() - 0.5) * 0.35, 0.3);
          h.mesh.rotation.z = (Math.random() - 0.5) * 2;
        }
        await c.wonder("sarenka");
        await c.say("sarenka", "line.g0_not_tidy", { anim: "Smutek" });
        await c.say("wiewiorka", "line.g0_how");
        const pomysl = await c.idea("sarenka", [["jablko", "jablko", "jablko"], ["gruszka", "gruszka"]]);
        await c.say("sarenka", "line.g0_group", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.g0_what");
        await c.say("sarenka", "line.g0_explain");
        pomysl.remove();
        await c.say("wiewiorka", "line.g0_out");
        await wyprostuj(c, items);
        c.arrange([items], { y: ROW_Y, gap: 0.14, animate: true }); await c.wait(0.6);
        box.remove();
        const zones = await containers(c, "apple", "pear");
        await c.say("sarenka", "line.s1_apples");
        await c.sort({ items, zones, wrong: "line.s1_mixed" });
        await c.say("sarenka", "line.s1_apples_done");
        await c.say("wiewiorka", "line.s1_point_apples");
        const apples = zones.find((z) => z.items.some((i) => i.tag === "apple"));
        await c.task({ targets: zones, correct: apples, wrong: "line.s1_not_apples" });
        // the problem solved: a pear, found at once
        await c.say("sarenka", "line.g0_pear_please");
        await c.say("wiewiorka", "line.g0_where_pear");
        const pears = zones.find((z) => z.items.some((i) => i.tag === "pear"));
        await c.task({ targets: zones, correct: pears, wrong: "line.g0_wrong_pear" });
        const one = pears.items.find((i) => i.tag === "pear");
        pears.take(one);
        // Squirrel takes it in her paw and brings it over
        await c.take("wiewiorka", one);
        await c.walkTo("wiewiorka", 2.2);
        await c.put("wiewiorka", 3.4, ROW_Y - 0.9);
        await c.say("wiewiorka", "line.g0_found", { anim: "Radosc" });
        await c.walkTo("wiewiorka", -4.6);
        await c.say("sarenka", "line.s1_deer_happy", { anim: "Radosc" });
        await c.say("wiewiorka", "line.j3_to_brook");
        c.clear();
      },
      // B. the brook: pebbles and leaves for the game, sorted; a cone among the pebbles does not belong
      async (c) => {
        await c.go("strumyk", { enter: true });
        await Promise.all([c.enter("wiewiorka"), c.enter("sarenka")]);
        await c.say("sarenka", "line.j3_brook");
        const items = await scatter(c, [
          { name: "kamyk", tag: "stone" }, { name: "listek", tag: "leaf" }, { name: "kamyk", tag: "stone" },
          { name: "listek", tag: "leaf" }, { name: "kamyk", tag: "stone" }, { name: "listek", tag: "leaf" }]);
        await c.say("wiewiorka", "line.j3_collect");
        const zones = await containers(c, "stone", "leaf");
        await c.say("sarenka", "line.j3_sort");
        await c.sort({ items, zones, wrong: "line.j3_mixed" });
        await c.say("wiewiorka", "line.j3_sorted", { anim: "Brawo" });
        // action: Squirrel takes a pebble from the basket and throws it into the brook - plop! Meanwhile a cone drops
        // from the tree into the basket: what does not belong with the pebbles?
        await c.say("wiewiorka", "line.j3_throw", { anim: "Wskazanie" });
        const kosz = zones[0], stone = kosz.items[0];
        kosz.take(stone);
        await stone.moveTo(1.5, 3.0, 0.5); await stone.moveTo(4.2, -1.6, 0.6); stone.remove();
        await c.play("sarenka", "Podskok");
        const cone = await c.object("szyszka", { x: ZL, y: 3.0, size: 0.9 }); cone.tag = "cone";
        await cone.moveTo(ZL, ZY, 0.5); kosz.put(cone);
        await c.say("sarenka", "line.j3_plop");
        await c.say("sarenka", "line.j3_point_odd");
        await c.task({ targets: kosz.items.slice(), correct: cone, wrong: "line.j3_wrong_odd" });
        await c.say("wiewiorka", "line.j3_odd_right", { anim: "Radosc" });
        await c.say("sarenka", "line.j3_to_home");
        c.clear();
      },
      // C. kitchen: the same fruit, another rule - big and small
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all([c.enter("wiewiorka"), c.enter("sarenka")]);
        await c.say("wiewiorka", "line.s2_sq_size");
        const items = await scatter(c, [
          { name: "jablko", tag: "big", size: 1.3 }, { name: "gruszka", tag: "small", size: 0.7 }, { name: "jablko", tag: "small", size: 0.7 },
          { name: "gruszka", tag: "big", size: 1.3 }, { name: "jablko", tag: "big", size: 1.3 }]);
        const zones = await containers(c, "big", "small");
        await c.say("sarenka", "line.s2_big");
        await c.sort({ items, zones, wrong: "line.s2_mixed" });
        await c.say("sarenka", "line.s2_point_big");
        const big = zones.find((z) => z.items.some((i) => i.tag === "big"));
        await c.task({ targets: zones, correct: big, wrong: "line.s2_not_big" });
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
          const zones = await containers(c, r.items.find((i) => i.tag !== "x").tag, "x");
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
      // the home game: tidying up after a snack - one rule after another, basket and box
      async (c) => {
        c.show("wiewiorka"); c.show("sarenka");
        await c.say("sarenka", "line.a_deer_tidy");
        const rounds = [
          { ask: "line.a_rule_food", items: [{ name: "jablko", tag: "a" }, { name: "kubek", tag: "b" }, { name: "ciastko", tag: "a" }, { name: "talerz", tag: "b" }, { name: "gruszka", tag: "a" }, { name: "kubek", tag: "b" }] },
          { ask: "line.a_rule_cups", items: [{ name: "kubek", tag: "a" }, { name: "talerz", tag: "b" }, { name: "kubek", tag: "a" }, { name: "talerz", tag: "b" }, { name: "talerz", tag: "b" }] },
          { ask: "line.a_rule_red", items: [{ name: "jablko", tag: "a" }, { name: "pilka", tag: "a" }, { name: "gruszka", tag: "b" }, { name: "kubek", tag: "b" }, { name: "jablko", tag: "a" }] },
          { ask: "line.a_rule_big", items: [{ name: "pilka", tag: "a", size: 1.3 }, { name: "pilka", tag: "b", size: 0.7 }, { name: "ciastko", tag: "a", size: 1.3 }, { name: "ciastko", tag: "b", size: 0.7 }, { name: "kwiatek", tag: "b", size: 0.7 }] },
          { ask: "line.a_rule_toys", items: [{ name: "pilka", tag: "a" }, { name: "kubek", tag: "b" }, { name: "misiu", tag: "a" }, { name: "talerz", tag: "b" }, { name: "klocek", tag: "a" }, { name: "lyzka", tag: "b" }] },
        ];
        for (const [i, r] of rounds.entries()) {
          const items = await scatter(c, r.items);
          const zones = await containers(c, "a", "b");
          await c.say(i % 2 ? "wiewiorka" : "sarenka", r.ask);
          await c.sort({ items, zones, wrong: "line.a_mixed" });
          await c.say(i % 2 ? "sarenka" : "wiewiorka", "line.a_sq_right", { anim: "Brawo" });
          c.clear();
        }
        await c.say("sarenka", "line.a_ask_parents");
        await c.say("wiewiorka", "line.a_bye");
        await c.play("wiewiorka", "Machanie"); await c.play("sarenka", "Machanie");
      },
    ],
  },
};
