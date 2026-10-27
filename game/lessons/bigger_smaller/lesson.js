// Lesson 1: bigger / smaller (size, no numbers). See scenario.md for the script;
// every spoken line lives in i18n/<lang>.json under its "line.*" key.

const L = -4.6, R = 4.6;                       // where the two friends stand (safe-area x)
const Y = 1.2;                                 // the object layer: above the puppets' heads
const ZIEMIA = -3.05;                          // the grass at the puppets' feet: where fallen things lie
const OLOWEK = ["#d9682b", "#2f6fb4"];         // the two top lines get a colour each, so they can be told apart

// the comparison method: stand both on one line, then a line over each at its top, across both of them.
// Returns the two top lines (in the order of `rzeczy`).
async function porownaj(c, rzeczy, { podstawa = Y - 0.75 } = {}) {
  const b0 = rzeczy.map((h) => c.bounds(h));
  const x0 = Math.min(...b0.map((b) => b.left)) - 0.35, x1 = Math.max(...b0.map((b) => b.right)) + 0.35;
  await c.line([[x0, podstawa], [x1, podstawa]], { duration: 0.8, name: "podstawa" });
  await c.standOn(rzeczy, podstawa, 0.7);
  const kreski = [];
  for (const [i, h] of rzeczy.entries()) {
    const top = c.bounds(h).top;
    kreski.push(await c.line({ bezier: [[x0, top], [x0 + (x1 - x0) / 3, top + 0.02], [x0 + 2 * (x1 - x0) / 3, top - 0.02], [x1, top]] },
      { color: OLOWEK[i % 2], width: 0.07, duration: 0.9, name: `kreska_${i}` }));
  }
  return kreski;
}

export default {
  id: "bigger_smaller",
  characters: { lisek: { side: "left" }, wiewiorka: { side: "right" } },
  backgrounds: { story: "sad", practice: "plac_zabaw", apply: "dom" },
  stages: {
    story: [
      // A. orchard, the problem: each friend says their pear is bigger; Fox thinks "higher = bigger".
      // Squirrel: compare! - on one line, a pencil line over each top. The quarrel is settled.
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        const small = await c.object("gruszka", { x: 1.5, y: Y + 0.55, size: 1.08 });      // Fox's: the smaller one, hanging higher
        const big = await c.object("gruszka", { x: -1.5, y: Y - 0.25, size: 1.28 });       // Squirrel's
        await c.say("lisek", "line.b0_mine", { anim: "Wskazanie" });
        await c.say("wiewiorka", "line.b0_no");
        await c.say("lisek", "line.b0_higher", { anim: "Podskok" });
        await c.wonder("wiewiorka");
        await c.say("wiewiorka", "line.b0_not");
        await c.say("lisek", "line.b0_how", { anim: "Rozgladanie" });
        const pomysl = await c.idea("wiewiorka", [["gruszka", "gruszka"]]);
        await c.say("wiewiorka", "line.b0_compare", { anim: "Zgloszenie" });
        await c.say("lisek", "line.b0_what");
        pomysl.remove();
        await c.say("wiewiorka", "line.b0_show");
        const [kBig, kSmall] = await porownaj(c, [big, small]);
        await c.focus([big, small, kBig, kSmall]);                 // the camera closes in on the comparison
        await c.say("wiewiorka", "line.c1_which_line");
        await c.task({ targets: [kBig, kSmall], correct: kBig, wrong: "line.c1_wrong_line" });
        kBig.highlight(true); big.highlight(true);
        await c.say("lisek", "line.c1_higher", { anim: "Radosc" });
        kBig.highlight(false); big.highlight(false);
        await c.unfocus();
        await c.say("wiewiorka", "line.c1_pick");
        await c.task({ targets: [big, small], correct: big, wrong: "line.c1_wrong_pear" });
        await c.circle(big);
        await c.say("lisek", "line.b0_fair", { anim: "Kiwanie" });
        await c.say("lisek", "line.c1_rule", { anim: "Brawo" });
        c.clear();
      },
      // A2. orchard: a gust shakes the tree, two apples drop out of the crown - the bigger one is for Fox
      async (c) => {
        await c.say("lisek", "line.s0_wind", { anim: "Rozgladanie" });
        const big = await c.object("jablko", { x: -1.6, y: 4.6, size: 1.7 });
        const small = await c.object("jablko", { x: 1.6, y: 4.9, size: 0.85 });
        await c.wait(0.3);
        // they fall all the way down to the grass at the friends' feet, and bounce once
        const naZiemi = (h) => h.mesh.position.y + (ZIEMIA - c.bounds(h).bottom);
        const yb = naZiemi(big), ys = naZiemi(small);
        await Promise.all([big.moveTo(-1.6, yb, 0.75), small.moveTo(1.6, ys, 0.6)]);
        c.sfx("plop");
        await Promise.all([big.moveTo(-1.6, yb + 0.22, 0.14), small.moveTo(1.6, ys + 0.16, 0.12), c.play("lisek", "Podskok"), c.play("wiewiorka", "Podskok")]);
        await Promise.all([big.moveTo(-1.6, yb, 0.14), small.moveTo(1.6, ys, 0.12)]);
        await c.say("wiewiorka", "line.s0_fell");
        // the method once more, one step lighter: the base line only, no lines over the tops
        await c.say("wiewiorka", "line.a1_line", { anim: "Wskazanie" });
        await c.line([[-3.0, ZIEMIA], [3.0, ZIEMIA]], { duration: 0.8, name: "podstawa" });
        await c.standOn([big, small], ZIEMIA, 0.4);
        await c.say("wiewiorka", "line.a1_see");
        await c.say("lisek", "line.s1_pick_bigger");
        await c.task({ targets: [big, small], correct: big, wrong: "line.s1_wrong" });
        await big.moveTo(L + 1.9, yb, 0.6);                    // rolled over to Fox, still on the grass
        await c.say("lisek", "line.s1_fox_thanks", { anim: "Radosc" });
        await c.say("wiewiorka", "line.s1_compare");
        await c.say("lisek", "line.a1_soon", { anim: "Brawo" });
        await c.say("lisek", "line.j1_to_forest");
        c.clear();
      },
      // B. forest: cones for the winter store (the bigger one), a leaf spins down (the smaller one fits behind the ear)
      async (c) => {
        await c.go("las", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        await c.say("wiewiorka", "line.j1_forest");
        const bigCone = await c.object("szyszka", { y: Y, size: 1.7 }), smallCone = await c.object("szyszka", { y: Y, size: 0.85 });
        c.arrange([[smallCone], [bigCone]], { y: Y, groupGap: 1.2 });
        await c.say("wiewiorka", "line.j1_cones", { anim: "Wskazanie" });
        await c.say("lisek", "line.c1_check");
        await porownaj(c, [smallCone, bigCone]);                // the method again: on one line, a line over each
        await c.say("lisek", "line.j1_pick_big_cone");
        await c.task({ targets: [bigCone, smallCone], correct: bigCone, wrong: "line.j1_wrong_cone" });
        await bigCone.moveTo(R - 1.4, Y);
        await c.say("wiewiorka", "line.j1_cone_thanks", { anim: "Radosc" });
        c.clear();
        // action: a leaf comes spinning down from the crowns
        await c.say("lisek", "line.j1_leaf_falls", { anim: "Rozgladanie" });
        const leaf = await c.object("listek", { x: 0.8, y: 5.0, size: 1.6 });
        await leaf.moveTo(-0.6, 3.2, 0.8); await leaf.moveTo(0.9, 1.9, 0.8); await leaf.moveTo(0, Y, 0.7);
        const smallLeaf = await c.object("listek", { y: Y, size: 0.8 });
        c.arrange([[leaf], [smallLeaf]], { y: Y, groupGap: 1.2, animate: true });
        await c.say("wiewiorka", "line.j1_leaf_hat");
        await c.say("lisek", "line.j1_pick_small_leaf");
        await c.task({ targets: [leaf, smallLeaf], correct: smallLeaf, wrong: "line.j1_wrong_leaf" });
        await smallLeaf.moveTo(R - 1.3, Y);
        await c.say("wiewiorka", "line.j1_leaf_thanks", { anim: "Radosc" });
        await c.say("lisek", "line.j1_cold");
        c.clear();
      },
      // C. kitchen: the smaller cup, the bigger cookie, the smaller spoon
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        await c.say("wiewiorka", "line.s2_thirsty");
        const bigCup = await c.object("kubek", { y: Y, size: 1.7 });
        const smallCup = await c.object("kubek", { y: Y, size: 0.85 });
        c.arrange([[bigCup], [smallCup]], { y: Y, groupGap: 1.2 });
        await c.say("lisek", "line.s2_fox_asks");
        await c.say("lisek", "line.s2_prompt");
        await c.task({ targets: [bigCup, smallCup], correct: smallCup, wrong: "line.s2_wrong" });
        await smallCup.moveTo(R - 1.3, Y);
        await c.say("wiewiorka", "line.s2_thanks", { anim: "Radosc" });
        await c.say("lisek", "line.s2_summary");
        c.clear();
        await c.say("wiewiorka", "line.s5_sq_cookies");
        const bigC = await c.object("ciastko", { y: Y, size: 1.7 });
        const smallC = await c.object("ciastko", { y: Y, size: 0.85 });
        c.arrange([[smallC], [bigC]], { y: Y, groupGap: 1.2 });
        await c.say("lisek", "line.s5_fox_hungry");
        await c.say("wiewiorka", "line.s5_pick_bigger");
        await c.task({ targets: [bigC, smallC], correct: bigC, wrong: "line.s5_wrong" });
        await bigC.moveTo(L + 1.6, Y);
        await smallC.moveTo(R - 1.3, Y);
        await c.say("wiewiorka", "line.s5_sq_mine");
        c.clear();
        const bigS = await c.object("lyzka", { y: Y, size: 1.7 }), smallS = await c.object("lyzka", { y: Y, size: 0.85 });
        c.arrange([[bigS], [smallS]], { y: Y, groupGap: 1.2 });
        await c.say("lisek", "line.j1_spoons");
        await c.say("wiewiorka", "line.j1_pick_small_spoon");
        await c.task({ targets: [bigS, smallS], correct: smallS, wrong: "line.j1_wrong_spoon" });
        await smallS.moveTo(R - 1.3, Y); await bigS.moveTo(L + 1.6, Y);
        await c.say("lisek", "line.s5_summary", { anim: "Radosc" });
        c.clear();
      },
    ],
    practice: [
      async (c) => {
        c.show("lisek");
        await c.say("lisek", "line.p_intro");
        // five tasks: pairs of one object at two sizes, bigger / smaller alternating
        const plan = [
          ["gruszka", "bigger"], ["pilka", "smaller"], ["ciastko", "bigger"], ["kwiatek", "smaller"], ["skarpetka", "bigger"],
        ];
        for (const [name, want] of plan) {
          const flip = Math.random() < 0.5;
          const a = await c.object(name, { y: Y, size: flip ? 0.85 : 1.7 });
          const b = await c.object(name, { y: Y, size: flip ? 1.7 : 0.85 });
          c.arrange([[a], [b]], { y: Y, groupGap: 1.2 });
          const bigger = flip ? b : a, smaller = flip ? a : b;
          await c.say("lisek", want === "bigger" ? "line.p_click_bigger" : "line.p_click_smaller");
          await c.task({ targets: [a, b], correct: want === "bigger" ? bigger : smaller, wrong: "line.p_wrong" });
          await c.say("lisek", "line.p_good", { anim: "Brawo" });
          c.clear();
        }
      },
      async (c) => {
        // two tasks with three sizes: the biggest, the smallest
        for (const [name, want] of [["jablko", "biggest"], ["kubek", "smallest"]]) {
          const sizes = [0.8, 1.25, 1.7].sort(() => Math.random() - 0.5);
          const hs = [];
          for (let i = 0; i < 3; i++) hs.push(await c.object(name, { y: Y, size: sizes[i] }));
          c.arrange([hs], { y: Y, gap: 0.6 });
          const target = hs[sizes.indexOf(want === "biggest" ? 1.7 : 0.8)];
          await c.say("lisek", want === "biggest" ? "line.p_click_biggest" : "line.p_click_smallest");
          await c.task({ targets: hs, correct: target, wrong: "line.p_wrong" });
          await c.say("lisek", "line.p_good", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      // the home game: "bigger or smaller than your hand?" - the friends show it, then five rounds for the child
      async (c) => {
        c.show("lisek"); c.show("wiewiorka");
        await c.say("lisek", "line.a_fox_game");
        await c.say("wiewiorka", "line.a_sq_ok");
        const plate = await c.object("talerz", { x: 0, y: Y, size: 1.6 });
        await c.say("lisek", "line.a_fox_plate", { anim: "Wskazanie" });
        await c.say("wiewiorka", "line.a_sq_bigger", { anim: "Radosc" });
        plate.remove();
        const cookie = await c.object("ciastko", { x: 0, y: Y, size: 0.8 });
        await c.say("lisek", "line.a_fox_cookie", { anim: "Wskazanie" });
        await c.say("wiewiorka", "line.a_sq_smaller");
        cookie.remove();
        await c.say("wiewiorka", "line.a_sq_your_turn");
        // always the SAME thing at two sizes: two different things would mix picture size with real size
        const rounds = [["pilka", "pilka", "bigger"], ["kubek", "kubek", "smaller"], ["talerz", "talerz", "bigger"], ["jablko", "jablko", "smaller"], ["skarpetka", "skarpetka", "bigger"]];
        for (const [i, [n1, n2, want]] of rounds.entries()) {
          const flip = Math.random() < 0.5;
          const a = await c.object(n1, { y: Y, size: flip ? 0.8 : 1.6 }), b = await c.object(n2, { y: Y, size: flip ? 1.6 : 0.8 });
          c.arrange([[a], [b]], { y: Y, groupGap: 1.2 });
          const bigger = flip ? b : a, smaller = flip ? a : b;
          await c.say(i % 2 ? "lisek" : "wiewiorka", want === "bigger" ? "line.a_pick_bigger" : "line.a_pick_smaller");   // both are allowed speakers of these lines
          await c.task({ targets: [a, b], correct: want === "bigger" ? bigger : smaller, wrong: "line.p_wrong" });
          await c.say(i % 2 ? "wiewiorka" : "lisek", "line.a_right", { anim: "Brawo" });
          c.clear();
        }
        await c.say("wiewiorka", "line.a_ask_parents");
        await c.say("lisek", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("wiewiorka", "Machanie");
      },
    ],
  },
};
