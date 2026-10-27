// Lesson 2: more / fewer by pairing, and the signs =, < and >. No counting: the
// child pairs things one to one and sees what is left over; the sign is "the hungry
// mouth that opens towards the bigger pile". Script in scenario.md.

const L = -3.4, R = 3.4;
const ROW_L = -1.9, ROW_R = 1.9;         // the two piles
const ROW_Y = -1.9;

// a row of n stickers centred on x
async function row(c, name, n, x, y = ROW_Y, size = 0.9) {
  const hs = [];
  for (let i = 0; i < n; i++) hs.push(await c.object(name, { x: x + (i - (n - 1) / 2) * 1.05, y, size }));
  return hs;
}
// slide two rows into pairs (one above the other); the leftovers of the longer row pulse
async function pair(c, a, b) {
  const n = Math.max(a.length, b.length);
  const moves = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 1.15;
    if (a[i]) moves.push(a[i].moveTo(x, ROW_Y + 0.75, 0.8));
    if (b[i]) moves.push(b[i].moveTo(x, ROW_Y - 0.65, 0.8));
  }
  await Promise.all(moves);
  const left = a.length > b.length ? a.slice(b.length) : b.slice(a.length);
  for (const h of left) h.highlight(true);
  await c.wait(1.5);
  for (const h of left) h.highlight(false);
  return left;
}
function signFor(a, b) { return a === b ? "=" : a > b ? ">" : "<"; }

export default {
  id: "more_fewer",
  characters: { lisek: { side: "left" }, sowa: { side: "right" } },
  backgrounds: { story: "laka", practice: "laka", apply: "dom" },
  stages: {
    story: [
      // 1. picnic: are there enough plates for the cups? pairing
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.say("narrator", "line.s1_intro");
        const cups = await row(c, "kubek", 3, ROW_L);
        const plates = await row(c, "talerz", 2, ROW_R);
        await c.say("lisek", "line.s1_fox_cups", { anim: "Wskazanie" });
        await c.say("sowa", "line.s1_owl_plates");
        await c.say("narrator", "line.s1_pair");
        await pair(c, cups, plates);
        await c.say("narrator", "line.s1_result");
        await c.say("sowa", "line.s1_owl_fewer");
        await c.say("narrator", "line.s1_daily");
        c.clear();
      },
      // 2. the signs: the hungry mouth opens towards "more"
      async (c) => {
        await c.say("narrator", "line.s2_signs");
        const cups = await row(c, "kubek", 3, ROW_L - 0.4, ROW_Y, 0.8);
        const plates = await row(c, "talerz", 2, ROW_R + 0.4, ROW_Y, 0.8);
        const gt = await c.sign(">", { x: 0, y: ROW_Y, size: 1.3 });
        await c.say("narrator", "line.s2_more_sign");
        gt.highlight(true); await c.wait(1); gt.highlight(false);
        await c.say("lisek", "line.s2_fox_add");
        const extra = await c.object("talerz", { x: 5.2, y: ROW_Y, size: 0.8 });
        await extra.moveTo(ROW_R + 0.4 + 1.05, ROW_Y, 0.7);
        plates.push(extra);
        gt.remove();
        const eq = await c.sign("=", { x: 0, y: ROW_Y, size: 1.3 });
        await c.say("narrator", "line.s2_equal_sign");
        eq.highlight(true); await c.wait(1); eq.highlight(false);
        await c.say("sowa", "line.s2_owl_less");
        for (const h of cups.splice(1)) h.remove();
        eq.remove();
        const lt = await c.sign("<", { x: 0, y: ROW_Y, size: 1.3 });
        await c.say("narrator", "line.s2_less_sign");
        lt.highlight(true); await c.wait(1); lt.highlight(false);
        await c.say("narrator", "line.s2_summary");
        c.clear();
      },
    ],
    practice: [
      // who has more? tap the pile
      async (c) => {
        c.show("lisek"); c.show("sowa");
        await c.say("lisek", "line.p_intro");
        const plan = [["jablko", 3, 1], ["ciastko", 2, 4], ["kwiatek", 4, 2], ["pilka", 1, 3]];
        for (const [name, a, b] of plan) {
          const left = await row(c, name, a, ROW_L, ROW_Y, 0.8), right = await row(c, name, b, ROW_R, ROW_Y, 0.8);
          const zl = c.zone({ x: ROW_L, y: ROW_Y, w: 4.6, h: 2 }), zr = c.zone({ x: ROW_R, y: ROW_Y, w: 4.6, h: 2 });
          const more = a > b ? zl : zr;
          await c.say("lisek", "line.p_which_more");
          await c.task({ targets: [zl, zr], correct: more, onWrong: async () => { await c.say("narrator", "line.p_wrong_pair"); await pair(c, left, right); } });
          await c.say("sowa", "line.p_good", { anim: "Radosc" });
          c.clear();
        }
      },
      // which sign? tap one of three
      async (c) => {
        await c.say("sowa", "line.p_signs_intro");
        const plan = [["kubek", 2, 2], ["gruszka", 3, 1], ["skarpetka", 1, 3], ["talerz", 4, 4]];
        for (const [name, a, b] of plan) {
          await row(c, name, a, ROW_L - 0.6, ROW_Y + 0.4, 0.75); await row(c, name, b, ROW_R + 0.6, ROW_Y + 0.4, 0.75);
          const signs = [];
          for (const [i, s] of ["<", "=", ">"].entries()) signs.push(await c.sign(s, { x: -2.2 + i * 2.2, y: -3.6, size: 1.1 }));
          const want = signs[["<", "=", ">"].indexOf(signFor(a, b))];
          await c.say("sowa", "line.p_which_sign");
          await c.task({ targets: signs, correct: want, wrong: "line.p_wrong_sign" });
          await want.moveTo(0, ROW_Y + 0.4, 0.6);
          await c.say("lisek", "line.p_good", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      async (c) => {
        c.show("lisek"); c.show("sowa");
        await c.say("narrator", "line.a_intro");
        await c.say("sowa", "line.a_owl_table");
        await c.say("lisek", "line.a_fox_fingers");
        await c.card("card.a_parents");
        await c.say("narrator", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("sowa", "Machanie");
      },
    ],
  },
};
