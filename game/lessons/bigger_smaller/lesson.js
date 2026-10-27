// Lesson 1: bigger / smaller (size, no numbers). See scenario.md for the script;
// every spoken line lives in i18n/<lang>.json under its "line.*" key.

const L = -3.4, R = 3.4;                       // where the two friends stand (safe-area x)

export default {
  id: "bigger_smaller",
  characters: { lisek: { side: "left" }, wiewiorka: { side: "right" } },
  backgrounds: { story: "sad", practice: "sad", apply: "dom" },
  stages: {
    story: [
      // 1. two apples in the orchard
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        await c.say("narrator", "line.s1_intro");
        const big = await c.object("jablko", { x: L + 1.9, y: -1.9, size: 1.7 });
        const small = await c.object("jablko", { x: R - 1.9, y: -1.9, size: 0.85 });
        await c.say("lisek", "line.s1_fox_big", { anim: "Wskazanie" });
        await c.say("wiewiorka", "line.s1_sq_small");
        await c.say("narrator", "line.s1_compare");
        big.highlight(true); await c.wait(1.2); big.highlight(false);
        small.highlight(true); await c.wait(1.2); small.highlight(false);
        await c.say("narrator", "line.s1_daily");
        c.clear();
      },
      // 2. which cup for the squirrel? (first choice, guided)
      async (c) => {
        await c.say("wiewiorka", "line.s2_thirsty");
        const bigCup = await c.object("kubek", { x: -1.2, y: -1.9, size: 1.7 });
        const smallCup = await c.object("kubek", { x: 1.2, y: -1.9, size: 0.85 });
        await c.say("lisek", "line.s2_fox_asks");
        await c.say("narrator", "line.s2_prompt");
        await c.task({ targets: [bigCup, smallCup], correct: smallCup, wrong: "line.s2_wrong" });
        await smallCup.moveTo(R - 1.4, -1.9);
        await c.say("wiewiorka", "line.s2_thanks", { anim: "Radosc" });
        await c.say("narrator", "line.s2_summary");
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
          const a = await c.object(name, { x: -1.6, y: -1.7, size: flip ? 0.85 : 1.7 });
          const b = await c.object(name, { x: 1.6, y: -1.7, size: flip ? 1.7 : 0.85 });
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
          for (let i = 0; i < 3; i++) hs.push(await c.object(name, { x: -2.4 + i * 2.4, y: -1.7, size: sizes[i] }));
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
      async (c) => {
        c.show("lisek"); c.show("wiewiorka");
        await c.say("narrator", "line.a_intro");
        await c.say("lisek", "line.a_fox_idea");
        await c.say("wiewiorka", "line.a_sq_idea");
        await c.card("card.a_parents");
        await c.say("narrator", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("wiewiorka", "Machanie");
      },
    ],
  },
};
