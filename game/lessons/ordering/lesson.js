// Lesson: ordering (seriation) - things put in order from the smallest to the biggest (or the other way, or the
// shortest to the longest) into numbered places. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);

// n copies of a thing at growing sizes, scattered on the floor between the characters; numbered places in a row
// over their heads (or a tower on the floor, place 1 at the bottom, the things waiting over the heads).
// `rosnaco` false = from the biggest. Sizes are given small-to-big as a ratio; R() makes them readable (>= 1.0).
const R = (r) => 0.5 + r * 0.9;
async function szereg(c, nazwa, rozmiary, { rosnaco = true, pion = false, wrong = "line.wrong_order" } = {}) {
  const n = rozmiary.length, rr = rozmiary.map(R);
  const kolej = rr.map((r, i) => [r, i]).sort((a, b) => (rosnaco ? a[0] - b[0] : b[0] - a[0]));
  const ranga = new Map(kolej.map(([, i], k) => [i, k]));
  const maks = Math.max(...rr);
  const items = [];
  const miejsca = tasuj(rr.map((_, i) => i));
  if (pion) {
    const xs = [-3.7, -1.8, 2.8, 4.0].slice(0, n);
    for (const [i, r] of rr.entries()) { const h = await c.object(nazwa, { x: xs[miejsca[i]], y: 2.35, size: r }); h.ranga = ranga.get(i); items.push(h); }
  } else {
    // side by side by their drawn widths (~0.85 of the sticker), the gap shrinking so the row stays within x +-3.1
    const szer = miejsca.map((m) => rr[m] * 0.85);
    const kol = miejsca.map((_, k) => miejsca.indexOf(k));                     // which thing stands k-th from the left
    const suma = szer.reduce((a, b) => a + b, 0), odst = Math.max(0.1, Math.min(0.45, (6.2 - suma) / Math.max(1, n - 1)));
    let x = -(suma + odst * (n - 1)) / 2;
    const pos = new Array(n);
    for (const i of kol) { const w = rr[i] * 0.85; pos[i] = x + w / 2; x += w + odst; }
    for (const [i, r] of rr.entries()) { const h = await c.object(nazwa, { x: pos[i], y: -3.3 + r * 0.45, size: r }); h.ranga = ranga.get(i); items.push(h); }
  }
  const sloty = kolej.map((_, k) => pion
    ? { x: 0, y: -3.2 + maks * 0.45 + k * (maks * 0.9), w: maks * 1.1, h: maks * 0.88, accept: (it) => it.ranga === k }   // a tower: place 1 at the bottom
    : { x: -((n - 1) * (maks * 1.08)) / 2 + k * (maks * 1.08), y: 1.5, w: maks * 1.02, h: maks * 1.02, accept: (it) => it.ranga === k });
  return c.slots({ items, slots: sloty, wrong, numery: !pion, numeryNad: true });
}

export default {
  id: "ordering",
  characters: { sarenka: { side: "left" }, lisek: { side: "right" } },
  backgrounds: { story: "dom", practice: "plac_zabaw", apply: "przedpokoj" },
  stages: {
    story: [
      // A. the problem: three cups to put away one inside another; Fox tries the big one into the small one.
      // Deer: it will not fit - put them in order, from the smallest to the biggest; then they nest.
      async (c) => {
        await Promise.all([c.enter("sarenka"), c.enter("lisek")]);
        await c.say("sarenka", "line.s_cups");
        const duzy = await c.object("kubek", { x: -1.5, y: 1.0, size: 1.6 }), maly = await c.object("kubek", { x: 1.5, y: 1.0, size: 0.8 });
        await c.say("lisek", "line.s_big_into_small", { anim: "Podskok" });
        await duzy.moveTo(1.5, 1.4, 0.5); await c.shake(duzy); await duzy.moveTo(-1.5, 1.0, 0.4);
        await c.wonder("sarenka");
        await c.say("sarenka", "line.s_wont_fit");
        await c.say("lisek", "line.s_how");
        const pomysl = await c.idea("sarenka", [["kubek", "kubek", "kubek"]]);
        await c.say("sarenka", "line.s_order", { anim: "Zgloszenie" });
        await c.say("lisek", "line.s_what");
        pomysl.remove();
        await c.say("sarenka", "line.s_show");
        c.clear();
        const t = await szereg(c, "kubek", [0.8, 1.2, 1.6]);
        await c.say("sarenka", "line.s_fill");
        await t.done();
        await c.say("lisek", "line.s_nest", { anim: "Radosc" });
        // the problem solved: from the smallest, each one goes into the next bigger
        const kubki = t.strefy.map((z) => z.zajety);
        await kubki[0].moveTo(kubki[1].mesh.position.x, kubki[1].mesh.position.y + 0.15, 0.4); kubki[0].remove();
        await kubki[1].moveTo(kubki[2].mesh.position.x, kubki[2].mesh.position.y + 0.15, 0.4); kubki[1].remove();
        c.sfx("plop");
        await c.say("sarenka", "line.s_solved", { anim: "Brawo" });
        await c.say("lisek", "line.s_to_garden");
        c.clear();
      },
      // B. garden: four carrots from the shortest to the longest
      async (c) => {
        await c.go("ogrod", { enter: true });
        await Promise.all([c.enter("sarenka"), c.enter("lisek")]);
        await c.say("lisek", "line.b_carrots");
        const t = await szereg(c, "marchewka", [0.7, 1.0, 1.3, 1.6]);
        await c.say("sarenka", "line.b_fill");
        await t.done();
        await c.say("lisek", "line.b_done", { anim: "Radosc" });
        await c.say("sarenka", "line.b_to_room");
        c.clear();
      },
      // C. the children's room: a tower of blocks - the biggest at the bottom
      async (c) => {
        await c.go("pokoj", { enter: true });
        await Promise.all([c.enter("sarenka"), c.enter("lisek")]);
        await c.say("sarenka", "line.c_tower");
        const t = await szereg(c, "klocek", [0.7, 1.0, 1.3], { rosnaco: false, pion: true });
        await c.say("lisek", "line.c_fill");
        await t.done();
        await c.say("sarenka", "line.c_solved", { anim: "Brawo" });
        c.clear();
      },
    ],
    practice: [
      // five rows: from the smallest, from the biggest, three to five things
      async (c) => {
        c.show("sarenka"); c.show("lisek");
        await c.say("lisek", "line.p_intro");
        const plan = [
          ["pilka", [0.7, 1.1, 1.5], true], ["jablko", [0.6, 0.9, 1.2, 1.5], true], ["listek", [0.7, 1.1, 1.5], false],
          ["szyszka", [0.6, 0.85, 1.1, 1.35], false], ["gruszka", [0.55, 0.8, 1.05, 1.3, 1.55], true],
        ];
        for (const [n, r, rosnaco] of plan) {
          const t = await szereg(c, n, r, { rosnaco });
          await c.say("lisek", rosnaco ? "line.p_from_small" : "line.p_from_big");
          await t.done();
          await c.say("sarenka", "line.good_order", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      // the home game: the family's shoes and socks in order
      async (c) => {
        c.show("sarenka"); c.show("lisek");
        await c.say("sarenka", "line.a_game");
        await c.say("lisek", "line.a_ok");
        for (const [n, r, rosnaco, key] of [["but", [0.7, 1.05, 1.4], true, "line.a_shoes"], ["skarpetka", [0.6, 0.9, 1.2, 1.5], false, "line.a_socks"], ["misiu", [0.7, 1.0, 1.3], true, "line.a_bears"]]) {
          const t = await szereg(c, n, r, { rosnaco });
          await c.say("sarenka", key);
          await t.done();
          await c.say("lisek", "line.good_order", { anim: "Brawo" });
          c.clear();
        }
        await c.say("sarenka", "line.a_ask_parents");
        await c.say("lisek", "line.a_bye");
        await c.play("sarenka", "Machanie"); await c.play("lisek", "Machanie");
      },
    ],
  },
};
