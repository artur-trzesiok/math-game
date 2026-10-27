// Lesson 1: bigger / smaller (size, no numbers). See scenario.md for the script;
// every spoken line lives in i18n/<lang>.json under its "line.*" key.

const L = -4.6, R = 4.6;                       // where the two friends stand (safe-area x)
const Y = 1.2;                                 // the object layer: above the puppets' heads

export default {
  id: "bigger_smaller",
  characters: { lisek: { side: "left" }, wiewiorka: { side: "right" } },
  backgrounds: { story: "sad", practice: "plac_zabaw", apply: "dom" },
  stages: {
    story: [
      // 1. two apples in the orchard - the bigger one is for Fox
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        // action: a gust shakes the tree and two apples drop out of the crown
        await c.say("lisek", "line.s0_wind", { anim: "Rozgladanie" });
        const big = await c.object("jablko", { x: -1.6, y: 4.6, size: 1.7 });
        const small = await c.object("jablko", { x: 1.6, y: 4.9, size: 0.85 });
        await c.wait(0.3);
        await Promise.all([big.moveTo(-1.6, Y - 0.15, 0.7), small.moveTo(1.6, Y - 0.1, 0.55)]);
        await Promise.all([big.moveTo(-1.6, Y, 0.25), small.moveTo(1.6, Y, 0.2), c.play("lisek", "Podskok"), c.play("wiewiorka", "Podskok")]);
        await c.say("wiewiorka", "line.s0_fell");
        await c.say("lisek", "line.s1_fox_big", { anim: "Wskazanie" });
        await c.say("wiewiorka", "line.s1_sq_small");
        await c.say("wiewiorka", "line.s1_compare");
        big.highlight(true); await c.wait(1.2); big.highlight(false);
        small.highlight(true); await c.wait(1.2); small.highlight(false);
        await c.say("lisek", "line.s1_pick_bigger");
        await c.task({ targets: [big, small], correct: big, wrong: "line.s1_wrong" });
        await big.moveTo(L + 1.6, Y);
        await c.say("lisek", "line.s1_fox_thanks", { anim: "Radosc" });
        await c.say("lisek", "line.s1_daily");
        c.clear();
      },
      // 2. which cup for the squirrel? the smaller one
      async (c) => {
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
      },
      // 3. a flower behind the squirrel's ear - the smaller one fits
      async (c) => {
        await c.say("wiewiorka", "line.s3_sq_flower");
        const bigF = await c.object("kwiatek", { y: Y, size: 1.7 });
        const smallF = await c.object("kwiatek", { y: Y, size: 0.85 });
        c.arrange([[bigF], [smallF]], { y: Y, groupGap: 1.2 });
        await c.say("lisek", "line.s3_fox_too_big", { anim: "Wskazanie" });
        await c.say("wiewiorka", "line.s3_pick_smaller");
        await c.task({ targets: [bigF, smallF], correct: smallF, wrong: "line.s3_wrong" });
        await smallF.moveTo(R - 1.3, Y);
        await c.say("wiewiorka", "line.s3_sq_thanks", { anim: "Radosc" });
        c.clear();
      },
      // 4. three balls - the biggest one is best for kicking
      async (c) => {
        await c.say("lisek", "line.s4_fox_ball");
        const sizes = [0.8, 1.25, 1.7].sort(() => Math.random() - 0.5);
        const balls = [];
        for (let i = 0; i < 3; i++) balls.push(await c.object("pilka", { y: Y, size: sizes[i] }));
        c.arrange([balls], { y: Y, gap: 0.6 });
        const biggest = balls[sizes.indexOf(1.7)];
        await c.say("wiewiorka", "line.s4_sq_three");
        await c.say("lisek", "line.s4_pick_biggest");
        await c.task({ targets: balls, correct: biggest, wrong: "line.s4_wrong" });
        await biggest.moveTo(L + 1.6, Y);
        await c.play("lisek", "Podskok");
        await c.say("lisek", "line.s4_fox_thanks");
        c.clear();
      },
      // 5. snack time: the bigger cookie for the hungry fox, the smaller for the squirrel
      async (c) => {
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
          await c.say("lisek", want === "bigger" ? "line.a_pick_bigger" : "line.a_pick_smaller");   // the speaker comes from the line
          await c.task({ targets: [a, b], correct: want === "bigger" ? bigger : smaller, wrong: "line.p_wrong" });
          await c.say("lisek", want === "bigger" ? "line.a_right_sq" : "line.a_right", { anim: "Brawo" });
          c.clear();
        }
        await c.say("wiewiorka", "line.a_ask_parents");
        await c.say("lisek", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("wiewiorka", "Machanie");
      },
    ],
  },
};
