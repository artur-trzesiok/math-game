// Lesson 2: more / fewer by pairing, and the signs =, < and >. No counting: the
// child pairs things one to one and sees what is left over; the sign is "the hungry
// mouth that opens towards the bigger pile". Script in scenario.md.
// Layout: everything goes through ctx.arrange, so piles, signs and zones line up
// and never overlap.

const Y = 1.2;                 // the object layer
const SZ = 0.85;               // sticker size in rows
const SIGN = 1.18 * SZ;        // a sign card is exactly one sticker wide

async function pile(c, name, n) {
  const hs = [];
  for (let i = 0; i < n; i++) hs.push(await c.object(name, { x: 0, y: Y, size: SZ }));
  return hs;
}
// two piles side by side (with an optional sign between them); returns the groups' extents
function lay(c, a, b, sign = null, animate = false) {
  return c.arrange(sign ? [a, [sign], b] : [a, b], { y: Y, groupGap: sign ? 0.5 : 1.4, animate });
}
// slide two piles into pairs (one above the other); the leftovers of the longer pile pulse
async function pair(c, a, b) {
  const n = Math.max(a.length, b.length), w = 1.18 * SZ + 0.18;
  const moves = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * w;
    if (a[i]) moves.push(a[i].moveTo(x, Y + 0.6, 0.8));
    if (b[i]) moves.push(b[i].moveTo(x, Y - 0.6, 0.8));
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
        await c.say("lisek", "line.s1_intro");
        const cups = await pile(c, "kubek", 3), plates = await pile(c, "talerz", 2);
        lay(c, cups, plates);
        await c.say("lisek", "line.s1_fox_cups", { anim: "Wskazanie" });
        await c.say("sowa", "line.s1_owl_plates");
        await c.say("sowa", "line.s1_pair");
        await pair(c, cups, plates);
        await c.say("lisek", "line.s1_result");
        await c.say("sowa", "line.s1_owl_fewer");
        await c.say("sowa", "line.s1_daily");
        c.clear();
      },
      // 2. the signs: the hungry mouth opens towards "more"
      async (c) => {
        await c.say("sowa", "line.s2_signs");
        const cups = await pile(c, "kubek", 3), plates = await pile(c, "talerz", 2);
        let sign = await c.sign(">", { size: SIGN });
        lay(c, cups, plates, sign);
        await c.say("sowa", "line.s2_more_sign");
        sign.highlight(true); await c.wait(1); sign.highlight(false);
        await c.say("lisek", "line.s2_fox_add");
        const extra = await c.object("talerz", { x: 5.6, y: Y + 1.6, size: SZ });
        plates.push(extra);
        sign.remove(); sign = await c.sign("=", { size: SIGN });
        lay(c, cups, plates, sign, true);
        await c.say("lisek", "line.s2_equal_sign");
        sign.highlight(true); await c.wait(1); sign.highlight(false);
        await c.say("sowa", "line.s2_owl_less");
        for (const h of cups.splice(1)) h.remove();
        sign.remove(); sign = await c.sign("<", { size: SIGN });
        lay(c, cups, plates, sign, true);
        await c.say("sowa", "line.s2_less_sign");
        sign.highlight(true); await c.wait(1); sign.highlight(false);
        await c.say("lisek", "line.s2_summary");
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
          const left = await pile(c, name, a), right = await pile(c, name, b);
          const [gl, gr] = lay(c, left, right);
          const zl = await c.zone({ x: gl.x, y: Y, w: gl.w + 0.5, h: 1.18 * SZ + 0.5 });
          const zr = await c.zone({ x: gr.x, y: Y, w: gr.w + 0.5, h: 1.18 * SZ + 0.5 });
          const more = a > b ? zl : zr;
          await c.say("lisek", "line.p_which_more");
          await c.task({ targets: [zl, zr], correct: more, onWrong: async () => { await c.say("sowa", "line.p_wrong_pair"); await pair(c, left, right); } });
          await c.say("sowa", "line.p_good", { anim: "Radosc" });
          c.clear();
        }
      },
      // which sign? tap one of three
      async (c) => {
        await c.say("sowa", "line.p_signs_intro");
        const plan = [["kubek", 2, 2], ["gruszka", 3, 1], ["skarpetka", 1, 3], ["talerz", 4, 4]];
        for (const [name, a, b] of plan) {
          const left = await pile(c, name, a), right = await pile(c, name, b);
          c.arrange([left, right], { y: Y, groupGap: SIGN + 1.0 });          // room for the sign to land between
          const signs = [];
          for (const s of ["<", "=", ">"]) signs.push(await c.sign(s, { size: SIGN }));
          c.arrange([signs], { y: -2.2, gap: 0.9 });
          const want = signs[["<", "=", ">"].indexOf(signFor(a, b))];
          await c.say("sowa", "line.p_which_sign");
          await c.task({ targets: signs, correct: want, wrong: "line.p_wrong_sign" });
          await want.moveTo(0, Y, 0.6);
          await c.say("lisek", "line.p_good", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      // the home game: setting the table - a plate for every cup
      async (c) => {
        c.show("lisek"); c.show("sowa");
        await c.say("sowa", "line.a_owl_table");
        const cups = await pile(c, "kubek", 2), plates = await pile(c, "talerz", 3);
        lay(c, cups, plates);
        await c.say("lisek", "line.a_fox_check");
        await pair(c, cups, plates);
        await c.say("sowa", "line.a_owl_more_plates");
        const signs = [];
        for (const s of ["<", "=", ">"]) signs.push(await c.sign(s, { size: SIGN }));
        c.arrange([signs], { y: -2.2, gap: 0.9 });
        await c.say("lisek", "line.a_fox_which_sign");
        const want = signs[0];
        await c.task({ targets: signs, correct: want, wrong: "line.p_wrong_sign" });
        await want.moveTo(0, Y, 0.6);
        await c.say("sowa", "line.a_owl_right", { anim: "Radosc" });
        c.clear();
        await c.say("lisek", "line.a_ask_parents");
        await c.say("sowa", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("sowa", "Machanie");
      },
    ],
  },
};
