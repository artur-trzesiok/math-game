// Lesson 2: more / fewer by pairing, and the signs =, < and >. No counting: the
// child pairs things one to one and sees what is left over; the sign is "the hungry
// mouth that opens towards the bigger pile". Script in scenario.md.
//
// Method: a sign only makes sense BETWEEN two groups standing side by side, so
// before every sign question the piles are laid out left / right with an empty
// dashed slot between them, and the chosen card flies into that slot. Pairing
// (rows one above the other) is only a check; afterwards the piles go back.
// Layout: everything goes through ctx.arrange, so nothing overlaps.

const Y = 1.2;                 // the object layer
const SZ = 0.85;               // sticker size in rows
const SIGN = 1.18 * SZ;        // a sign card is exactly one sticker wide
const SLOT = SIGN + 0.9;       // the gap between the piles when a sign goes there

async function pile(c, name, n) {
  const hs = [];
  for (let i = 0; i < n; i++) hs.push(await c.object(name, { x: 0, y: Y, size: SZ }));
  return hs;
}
// two piles side by side; returns the groups' extents
function lay(c, a, b, animate = false, gap = 1.4) { return c.arrange([a, b], { y: Y, groupGap: gap, animate }); }
function gapX(info) { const [a, b] = info; return (a.x + a.w / 2 + b.x - b.w / 2) / 2; }
// slide two piles into pairs (one above the other); the leftovers of the longer pile pulse
async function pair(c, a, b) {
  const n = Math.max(a.length, b.length), w = 1.12 * SZ + 0.18;
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
// the sign question: piles left / right, an empty slot between them, cards below;
// the right card flies into the slot. `offer` = which cards to show.
async function askSign(c, left, right, who, key, offer = ["<", "=", ">"], praise = null) {
  const info = lay(c, left, right, true, SLOT);
  await c.wait(0.9);
  const slot = await c.zone({ x: gapX(info), y: Y, w: SIGN + 0.3, h: SIGN + 0.3, name: "slot" });
  const cards = [];
  for (const s of offer) cards.push(await c.sign(s, { size: SIGN }));
  c.arrange([cards], { y: -2.2, gap: 0.9 });
  await c.say(who, key);
  const want = cards[offer.indexOf(signFor(left.length, right.length))];
  await c.task({ targets: cards, correct: want, wrong: "line.p_wrong_sign" });
  for (const k of cards) if (k !== want) k.remove();
  await want.moveTo(gapX(info), Y, 0.6);
  slot.remove();
  // the correct picture stays and is named, so it sinks in
  want.highlight(true);
  await c.say(who, praise || { "<": "line.good_lt", "=": "line.good_eq", ">": "line.good_gt" }[want.name], { anim: "Radosc" });
  want.highlight(false);
  await c.wait(1.0);
  return want;
}
// "where is more?" - the piles are the targets (outlined); pairing is the hint
async function askMore(c, left, right, who, key) {
  const [gl, gr] = lay(c, left, right, true);
  await c.wait(0.9);
  const zl = await c.zone({ x: gl.x, y: Y, w: gl.w + 0.5, h: 1.12 * SZ + 0.5 }), zr = await c.zone({ x: gr.x, y: Y, w: gr.w + 0.5, h: 1.12 * SZ + 0.5 });
  await c.say(who, key);
  const more = left.length > right.length ? zl : zr;
  await c.task({ targets: [zl, zr], correct: more, onWrong: async () => {
    zl.mesh.visible = zr.mesh.visible = false;                            // the pairing needs the whole space
    await c.say("sowa", "line.p_wrong_pair"); await pair(c, left, right);
    lay(c, left, right, true); await c.wait(0.9);
    zl.mesh.visible = zr.mesh.visible = true;
  } });
  (more === zl ? zr : zl).remove();
  more.highlight(true);
  await c.say(who, "line.good_more", { anim: "Radosc" });                 // the right pile stays marked while it is named
  more.highlight(false); await c.wait(0.8);
  more.remove();
}

export default {
  id: "more_fewer",
  characters: { lisek: { side: "left" }, sowa: { side: "right" } },
  backgrounds: { story: "laka", practice: "las", apply: "dom" },
  stages: {
    story: [
      // 1. picnic: are there enough plates for the cups? pairing; the child finds the one without a pair
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.say("lisek", "line.s1_intro");
        const cups = await pile(c, "kubek", 3), plates = await pile(c, "talerz", 2);
        lay(c, cups, plates);
        await c.say("lisek", "line.s1_fox_cups", { anim: "Wskazanie" });
        await c.say("sowa", "line.s1_owl_plates");
        await c.say("sowa", "line.s1_pair");
        const left = await pair(c, cups, plates);
        await c.say("sowa", "line.s1_point_left");
        await c.task({ targets: [...cups, ...plates], correct: left, wrong: "line.s1_wrong_left" });
        await c.say("lisek", "line.s1_result");
        await c.say("sowa", "line.s1_owl_fewer");
        await c.say("sowa", "line.s1_daily");
        c.clear();
      },
      // 2. the signs: the hungry mouth opens towards "more" - the child picks the sign each time
      async (c) => {
        await c.say("sowa", "line.s2_signs");
        const cups = await pile(c, "kubek", 3), plates = await pile(c, "talerz", 2);
        lay(c, cups, plates, false, SLOT);
        await c.say("sowa", "line.s2_more_sign");
        let sign = await askSign(c, cups, plates, "sowa", "line.s2_pick_gt", ["<", ">"], "line.s2_good_gt");
        await c.say("lisek", "line.s2_fox_add");
        const extra = await c.object("talerz", { x: 5.6, y: Y + 1.6, size: SZ });
        plates.push(extra); sign.remove();
        await c.say("lisek", "line.s2_equal_sign");
        sign = await askSign(c, cups, plates, "lisek", "line.s2_pick_eq", ["<", "=", ">"], "line.s2_good_eq");
        await c.say("sowa", "line.s2_owl_less");
        for (const h of cups.splice(1)) h.remove();
        sign.remove();
        await c.say("sowa", "line.s2_less_sign");
        sign = await askSign(c, cups, plates, "sowa", "line.s2_pick_lt", ["<", "=", ">"], "line.s2_good_lt");
        sign.remove();
        await askMore(c, cups, plates, "lisek", "line.s2_which_more");
        await c.say("lisek", "line.s2_summary", { anim: "Radosc" });
        c.clear();
      },
    ],
    practice: [
      // who has more? point to the pile
      async (c) => {
        c.show("lisek"); c.show("sowa");
        await c.say("lisek", "line.p_intro");
        const plan = [["jablko", 3, 1], ["ciastko", 2, 4], ["kwiatek", 4, 2], ["pilka", 1, 3]];
        for (const [name, a, b] of plan) {
          const left = await pile(c, name, a), right = await pile(c, name, b);
          lay(c, left, right);
          await askMore(c, left, right, "lisek", "line.p_which_more");
          c.clear();
        }
      },
      // which sign? the slot between the piles shows where it goes
      async (c) => {
        await c.say("sowa", "line.p_signs_intro");
        const plan = [["kubek", 2, 2], ["gruszka", 3, 1], ["skarpetka", 1, 3], ["talerz", 4, 4]];
        for (const [name, a, b] of plan) {
          const left = await pile(c, name, a), right = await pile(c, name, b);
          lay(c, left, right, false, SLOT);
          await askSign(c, left, right, "sowa", "line.p_which_sign");
          c.clear();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      // the home game: setting the table - five rounds: pair, then a sign or "where is more?"
      async (c) => {
        c.show("lisek"); c.show("sowa");
        await c.say("sowa", "line.a_owl_table");
        const rounds = [[2, 3, "sign"], [3, 2, "more"], [3, 3, "sign"], [1, 3, "more"], [4, 4, "sign"]];
        for (const [i, [nc, np, ask]] of rounds.entries()) {
          const cups = await pile(c, "kubek", nc), plates = await pile(c, "talerz", np);
          lay(c, cups, plates);
          await c.say(i % 2 ? "sowa" : "lisek", "line.a_fox_check");
          await pair(c, cups, plates);
          if (ask === "sign") await askSign(c, cups, plates, "lisek", "line.a_fox_which_sign");
          else await askMore(c, cups, plates, "sowa", "line.a_which_more");
          c.clear();
        }
        await c.say("lisek", "line.a_ask_parents");
        await c.say("sowa", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("sowa", "Machanie");
      },
    ],
  },
};
