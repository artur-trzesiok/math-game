// Lesson: rhythm - a pattern is something that repeats in order (AB, AAB, ABC ...); the child continues it by
// dragging the right things into the empty places. Script in scenario.md.

const Y = 1.55;                 // the row runs over the characters' heads, the full width of the stage
const SZ = 1.3;
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);

// a pattern row: `wzor` repeated, the first `widac` shown, the rest empty places; candidates on the floor
async function wzor(c, wzor, { dlugosc = 8, widac = 6, size = SZ, y = Y, rozmiary = null, kandydaci = null, wrong = "line.wrong_pattern" } = {}) {
  size = Math.min(size, 11.4 / (dlugosc * 1.1));          // as big as the row allows: 8 things at 1.3, 9 at 1.15
  const krok = size * 1.1, x0 = -((dlugosc - 1) * krok) / 2;
  const nazwa = (i) => wzor[i % wzor.length];
  const roz = (i) => (rozmiary ? rozmiary[i % rozmiary.length] : 1);
  for (let i = 0; i < widac; i++) { const h = await c.object(nazwa(i), { x: x0 + i * krok, y, size: size * roz(i) }); h.tag = `${nazwa(i)}_${roz(i)}`; }
  const sloty = [];
  for (let i = widac; i < dlugosc; i++) { const want = `${nazwa(i)}_${roz(i)}`; sloty.push({ x: x0 + i * krok, y, w: krok * 0.96, h: size * 1.15, accept: (it) => it.tag === want }); }
  // candidates: what is needed plus one thing that does not belong
  const potrzebne = [];
  for (let i = widac; i < dlugosc; i++) potrzebne.push([nazwa(i), roz(i)]);
  const lista = tasuj([...potrzebne, ...(kandydaci || [])]);
  const items = [];
  for (const [i, [n, r]] of lista.entries()) {
    const odst = Math.min(1.55, 5.6 / Math.max(1, lista.length - 1));   // the floor between the characters only
    const x = -((lista.length - 1) * odst) / 2 + i * odst;
    const h = await c.object(n, { x, y: -2.4, size: Math.min(1.25, size) * r }); h.tag = `${n}_${r}`; items.push(h);
  }
  const t = await c.slots({ items, slots: sloty, wrong });
  return t;
}

export default {
  id: "rhythm",
  characters: { sowa: { side: "left" }, wiewiorka: { side: "right" } },
  backgrounds: { story: "dom", practice: "sad", apply: "pokoj" },
  stages: {
    story: [
      // A. the problem: Owl started a garland for the party - apple, pear, apple, pear - and Squirrel goes on with
      // whatever is at hand. Owl: the pattern is broken - a garland has a rhythm, something repeats in order.
      async (c) => {
        await Promise.all([c.enter("sowa"), c.enter("wiewiorka")]);
        await c.say("sowa", "line.s_garland", { anim: "Radosc" });
        const krok = SZ * 1.1, x0 = -3.5 * krok;
        const jest = [];
        for (let i = 0; i < 4; i++) jest.push(await c.object(i % 2 ? "gruszka" : "jablko", { x: x0 + i * krok, y: Y, size: SZ }));
        await c.say("sowa", "line.s_go_on");
        await c.say("wiewiorka", "line.s_anything", { anim: "Podskok" });
        const zle = [];
        for (const [i, n] of ["kwiatek", "pilka", "kwiatek", "but"].entries()) zle.push(await c.object(n, { x: x0 + (4 + i) * krok, y: Y, size: SZ }));
        await c.wonder("sowa");
        await c.say("sowa", "line.s_broken");
        await c.say("wiewiorka", "line.s_how");
        await c.say("sowa", "line.s_rhythm", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.s_what");
        // a rhythm you can hear: clap, hop, clap, hop
        await c.say("sowa", "line.s_listen");
        for (let i = 0; i < 4; i++) { if (i % 2) await c.play("sowa", "Podskok"); else { c.sfx("clap", { dlugosc: 0.35 }); await c.wait(0.45); } }
        await c.say("sowa", "line.s_same_garland");
        for (const h of zle) h.remove();
        for (const h of jest) h.remove();
        const t = await wzor(c, ["jablko", "gruszka"], { widac: 4, kandydaci: [["kwiatek", 1]] });
        await c.say("wiewiorka", "line.s_fill");
        await t.done();
        await c.say("sowa", "line.s_solved", { anim: "Brawo" });
        await c.say("wiewiorka", "line.s_to_garden");
        c.clear();
      },
      // B. garden bed: flower, flower, carrot ... (AAB)
      async (c) => {
        await c.go("ogrod", { enter: true });
        await Promise.all([c.enter("sowa"), c.enter("wiewiorka")]);
        await c.say("wiewiorka", "line.b_bed");
        const t = await wzor(c, ["kwiatek", "kwiatek", "marchewka"], { dlugosc: 9, widac: 6, kandydaci: [["gruszka", 1]] });
        await c.say("sowa", "line.b_fill");
        await t.done();
        await c.say("wiewiorka", "line.b_done", { anim: "Radosc" });
        await c.say("sowa", "line.b_to_meadow");
        c.clear();
      },
      // C. lake picnic: cup, plate, spoon ... (ABC)
      async (c) => {
        await c.go("laka", { enter: true });
        await Promise.all([c.enter("sowa"), c.enter("wiewiorka")]);
        await c.say("sowa", "line.c_picnic");
        const t = await wzor(c, ["kubek", "talerz", "lyzka"], { dlugosc: 8, widac: 6, kandydaci: [["ciastko", 1]] });
        await c.say("wiewiorka", "line.c_fill");
        await t.done();
        await c.say("sowa", "line.c_solved", { anim: "Brawo" });
        c.clear();
      },
    ],
    practice: [
      // five rows to finish: AB, AAB, ABB, ABC, big-small
      async (c) => {
        c.show("sowa"); c.show("wiewiorka");
        await c.say("sowa", "line.p_intro");
        const plan = [
          { w: ["jablko", "kwiatek"] },
          { w: ["szyszka", "szyszka", "listek"], d: 9 },
          { w: ["pilka", "kubek", "kubek"], d: 9 },
          { w: ["gruszka", "marchewka", "ciastko"], d: 9 },
          { w: ["jablko"], r: [1.1, 0.65], d: 8 },
        ];
        for (const p of plan) {
          const t = await wzor(c, p.w, { dlugosc: p.d || 8, widac: (p.d || 8) - 2, rozmiary: p.r || null, kandydaci: p.r ? [] : [["but", 1]] });
          await c.say("sowa", "line.p_fill");
          await t.done();
          await c.say("wiewiorka", "line.good_pattern", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // the home game: patterns from toys
      async (c) => {
        c.show("sowa"); c.show("wiewiorka");
        await c.say("wiewiorka", "line.a_game");
        await c.say("sowa", "line.a_ok");
        for (const w of [["klocek", "misiu"], ["pilka", "pilka", "klocek"], ["misiu", "klocek", "pilka"]]) {
          const t = await wzor(c, w, { dlugosc: w.length === 2 ? 8 : 9, widac: w.length === 2 ? 6 : 7, kandydaci: [["skarpetka", 1]] });
          await c.say("sowa", "line.a_fill");
          await t.done();
          await c.say("wiewiorka", "line.good_pattern", { anim: "Brawo" });
          c.clear();
        }
        await c.say("sowa", "line.a_ask_parents");
        await c.say("wiewiorka", "line.a_bye");
        await c.play("sowa", "Machanie"); await c.play("wiewiorka", "Machanie");
      },
    ],
  },
};
