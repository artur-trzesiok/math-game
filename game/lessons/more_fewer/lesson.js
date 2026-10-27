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

async function pile(c, name, n, size = SZ) {
  const hs = [];
  for (let i = 0; i < n; i++) hs.push(await c.object(name, { x: 0, y: Y, size }));
  return hs;
}
// pencil lines joining the pairs: they belong to the pairing, so any new layout wipes them
let kreski = [];
function wytrzyj() { for (const k of kreski) k.remove(); kreski = []; }
// two piles side by side; returns the groups' extents
function lay(c, a, b, animate = false, gap = 1.4) { wytrzyj(); return c.arrange([a, b], { y: Y, groupGap: gap, animate }); }
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
  // a pencil joins every pair, one after another, a little curved like a hand would
  wytrzyj();
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const ga = c.bounds(a[i]), gb = c.bounds(b[i]), x = (ga.x + gb.x) / 2, y0 = ga.bottom - 0.04, y1 = gb.top + 0.04;
    kreski.push(await c.line({ bezier: [[x, y0], [x + 0.07, y0 - (y0 - y1) / 3], [x - 0.07, y0 - 2 * (y0 - y1) / 3], [x, y1]] }, { duration: 0.35, width: 0.06 }));
  }
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
      // A. lake picnic, the problem: will every cup get a plate? Fox thinks "the plates are big, so there are more".
      // Owl: make pairs! - a pencil joins each pair, one cup is left over; the hungry mouth; Fox fetches the missing plate.
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.say("lisek", "line.s1_intro");
        const cups = await pile(c, "kubek", 3), plates = await pile(c, "talerz", 2, SZ * 1.3);   // big plates: they look like "more"
        lay(c, cups, plates);
        await c.say("sowa", "line.m0_question");
        await c.say("lisek", "line.m0_naive", { anim: "Wskazanie" });
        await c.say("sowa", "line.m0_not");
        await c.say("lisek", "line.m0_how", { anim: "Rozgladanie" });
        await c.say("sowa", "line.m0_pairs", { anim: "Zgloszenie" });
        await c.say("lisek", "line.m0_what");
        await c.say("sowa", "line.m0_show");
        await c.say("sowa", "line.s1_pair");
        const left = await pair(c, cups, plates);
        await c.say("sowa", "line.s1_point_left");
        await c.task({ targets: [...cups, ...plates], correct: left, wrong: "line.s1_wrong_left" });
        await c.say("lisek", "line.s1_result");
        await c.say("sowa", "line.s1_owl_fewer");
        await c.say("sowa", "line.s2_signs");
        await c.say("sowa", "line.s2_more_sign");
        const sign = await askSign(c, cups, plates, "sowa", "line.s2_pick_gt", ["<", ">"], "line.s2_good_gt");
        // the problem solved: Fox runs off for the missing plate, now every cup has one
        sign.remove();
        await c.say("lisek", "line.m0_fetch", { anim: "Podskok" });
        await c.walkTo("lisek", -7.8);                                  // off to the picnic basket ...
        const extra = await c.object("talerz", { x: -7.8, y: -1.5, size: SZ * 1.3 });
        await c.take("lisek", extra, { d: 0.1 });
        await c.walkTo("lisek", -4.6);                                  // ... and back with the plate in its paw
        await c.put("lisek", -3.2, Y);
        plates.push(extra);
        lay(c, cups, plates, true); await c.wait(0.8);
        await pair(c, cups, plates);
        await c.say("sowa", "line.m0_enough", { anim: "Radosc" });
        await c.say("sowa", "line.j2_to_garden");
        c.clear();
      },
      // B. vegetable garden: carrots and flowers - as many, then more flowers; where is more?
      async (c) => {
        await c.go("ogrod", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.say("lisek", "line.j2_garden");
        const carrots = await pile(c, "marchewka", 3);
        await c.say("lisek", "line.j2_carrots", { anim: "Wskazanie" });
        const flowers = await pile(c, "kwiatek", 3);
        lay(c, carrots, flowers, true, SLOT); await c.wait(0.8);
        await c.say("sowa", "line.j2_flowers");
        await c.say("lisek", "line.j2_check");
        await pair(c, carrots, flowers);
        await c.say("sowa", "line.j2_equal");
        let sign = await askSign(c, carrots, flowers, "lisek", "line.s2_pick_eq", ["<", "=", ">"], "line.j2_good_eq");
        // action: Owl finds one more flower under the fence
        await c.say("sowa", "line.j2_one_more", { anim: "Rozgladanie" });
        const extra = await c.object("kwiatek", { x: 5.6, y: Y + 1.4, size: SZ });
        flowers.push(extra); sign.remove();
        await c.say("sowa", "line.j2_now_fewer");
        sign = await askSign(c, carrots, flowers, "sowa", "line.s2_pick_lt", ["<", "=", ">"], "line.j2_good_lt");
        sign.remove();
        await askMore(c, carrots, flowers, "lisek", "line.s2_which_more");
        await c.say("lisek", "line.j2_to_home");
        c.clear();
      },
      // C. kitchen: cookies for the cups - a cookie for every cup
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.say("sowa", "line.j2_kitchen");
        const cups = await pile(c, "kubek", 3), cookies = await pile(c, "ciastko", 2);
        lay(c, cups, cookies);
        await c.say("lisek", "line.j2_cookies_check");
        await pair(c, cups, cookies);
        await c.say("sowa", "line.j2_one_missing");
        await c.say("lisek", "line.j2_bake_one");
        const extra = await c.object("ciastko", { x: 5.6, y: Y + 1.4, size: SZ });
        cookies.push(extra);
        await askSign(c, cups, cookies, "lisek", "line.s2_pick_eq", ["<", "=", ">"], "line.j2_good_eq2");
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
