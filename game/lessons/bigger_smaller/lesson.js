// Lesson 1: bigger / smaller (size, no numbers). See scenario.md for the script;
// every spoken line lives in i18n/<lang>.json under its "line.*" key.

const L = -4.6, R = 4.6;                       // where the two friends stand (safe-area x)
const Y = 1.2;                                 // the object layer: above the puppets' heads

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
        const big = await c.object("jablko", { y: Y, size: 1.7 });
        const small = await c.object("jablko", { y: Y, size: 0.85 });
        c.arrange([[big], [small]], { y: Y, groupGap: 1.2 });
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
        const bigCup = await c.object("kubek", { y: Y, size: 1.7 });
        const smallCup = await c.object("kubek", { y: Y, size: 0.85 });
        c.arrange([[bigCup], [smallCup]], { y: Y, groupGap: 1.2 });
        await c.say("lisek", "line.s2_fox_asks");
        await c.say("narrator", "line.s2_prompt");
        await c.task({ targets: [bigCup, smallCup], correct: smallCup, wrong: "line.s2_wrong" });
        await smallCup.moveTo(R - 1.3, Y);
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
      // the home game: "bigger than my paw?" - the friends play it, the child joins once
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
        const ball = await c.object("pilka", { y: Y, size: 1.6 });
        const flower = await c.object("kwiatek", { y: Y, size: 0.8 });
        c.arrange([[ball], [flower]], { y: Y, groupGap: 1.2 });
        await c.say("wiewiorka", "line.a_sq_your_turn");
        await c.task({ targets: [ball, flower], correct: ball, wrong: "line.p_wrong" });
        await c.say("lisek", "line.a_fox_right", { anim: "Brawo" });
        c.clear();
        await c.say("wiewiorka", "line.a_ask_parents");
        await c.say("lisek", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("wiewiorka", "Machanie");
      },
    ],
  },
};
