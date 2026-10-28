// Lesson: the tangram - seven pieces cut from one square; pictures are made by putting each piece in its place,
// turning it (a tap turns it) until it fits. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);

// a piece's box from its outline (the sticker is still popping in, so its drawn size is not final yet)
function obwiednia(h) {
  const a = h.rot * Math.PI / 180, co = Math.cos(a), si = Math.sin(a), p = h.mesh.position;
  const q = h.pts.map(([x, y]) => [p.x + x * co - y * si, p.y + x * si + y * co]);
  return { left: Math.min(...q.map((v) => v[0])), right: Math.max(...q.map((v) => v[0])), bottom: Math.min(...q.map((v) => v[1])), top: Math.max(...q.map((v) => v[1])) };
}
// a silhouette to build; `obroty` fixes the starting turn of each piece (a first puzzle needs few taps)
async function uloz(c, nazwa, { x = 0, y = 1.0, scale = 4.2, obroty = null } = {}) {
  const t = await c.tangram(nazwa, { x, y, scale, obroty });
  await t.done();
  await c.wait(0.4);
  return t;
}

export default {
  id: "tangram",
  characters: { wiewiorka: { side: "left" }, lisek: { side: "right" } },
  backgrounds: { story: "pokoj", practice: "przedpokoj", apply: "dom" },
  stages: {
    story: [
      // A. the problem: Squirrel's square puzzle falls and breaks into pieces - "it is broken, I'll throw it away".
      // Fox: nothing broke - it is a tangram; every piece has its place, a tap turns it. Two triangles, a house.
      async (c) => {
        await Promise.all([c.enter("wiewiorka"), c.enter("lisek")]);
        const caly = await c.tangram("duzy_kwadrat", { x: 0, y: 1.1, scale: 3.0 });
        // shown whole: every piece already in its place
        for (const [i, k] of caly.kawalki.entries()) { const s = caly.sloty[i]; k.mesh.position.set(s.x, s.y, 0.4); k.rot = s.rot; k.inner.rotation.z = s.rot * Math.PI / 180; }
        await c.say("wiewiorka", "line.s_my_puzzle", { anim: "Radosc" });
        c.sfx("whoosh");
        await Promise.all(caly.kawalki.map((k) => k.moveTo(k.home.x, k.home.y, 0.6)));
        c.sfx("plop");
        await c.say("wiewiorka", "line.s_broken", { anim: "Smutek" });
        await c.say("wiewiorka", "line.s_throw");
        await c.wonder("lisek");
        await c.say("lisek", "line.s_not_broken");
        await c.say("wiewiorka", "line.s_how");
        await c.say("lisek", "line.s_tangram", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.s_what");
        await c.say("lisek", "line.s_show");
        c.clear();
        // two big triangles make a square: one already turned right, the other needs a turn
        await c.say("lisek", "line.s_two");
        await c.say("lisek", "line.s_tap_turns");
        await uloz(c, "kwadrat", { obroty: [0, 0] });
        await c.say("wiewiorka", "line.s_square_done", { anim: "Brawo" });
        c.clear();
        await c.say("lisek", "line.s_house");
        await uloz(c, "domek", { obroty: [0, 45] });
        await c.say("wiewiorka", "line.s_solved", { anim: "Radosc" });
        await c.say("lisek", "line.s_to_forest");
        c.clear();
      },
      // B. forest by the brook: a fish for the brook
      async (c) => {
        await c.go("las", { enter: true });
        await Promise.all([c.enter("wiewiorka"), c.enter("lisek")]);
        await c.say("wiewiorka", "line.b_fish");
        await uloz(c, "ryba");
        await c.say("lisek", "line.b_fish_done", { anim: "Brawo" });
        await c.say("wiewiorka", "line.b_to_brook");
        c.clear();
      },
      // C. the brook: a boat to sail, then the whole square again - the puzzle was never broken
      async (c) => {
        await c.go("strumyk", { enter: true });
        await Promise.all([c.enter("wiewiorka"), c.enter("lisek")]);
        await c.say("lisek", "line.c_boat");
        await uloz(c, "lodka");
        await c.say("wiewiorka", "line.c_boat_done", { anim: "Radosc" });
        c.clear();
        await c.say("wiewiorka", "line.c_square_again");
        // half the pieces start turned right: seven at once is a lot
        await uloz(c, "duzy_kwadrat", { scale: 3.2, obroty: [225, 135, 0, 45, 0, 315, 0] });
        await c.say("lisek", "line.c_solved", { anim: "Brawo" });
        c.clear();
      },
    ],
    practice: [
      // three silhouettes to build, then two "which piece fits the gap?"
      async (c) => {
        c.show("wiewiorka"); c.show("lisek");
        await c.say("lisek", "line.p_intro");
        for (const nazwa of ["domek", "ryba", "lodka"]) {
          await c.say("wiewiorka", `line.p_${nazwa}`);
          await uloz(c, nazwa);
          await c.say("lisek", "line.good_build", { anim: "Brawo" });
          c.clear();
        }
        // a gap: the silhouette with one place empty, three pieces to choose from
        for (const [nazwa, brak] of [["domek", "M"], ["ryba", "Q"]]) {
          const t = await c.tangram(nazwa, { x: 0, y: 1.3, scale: 3.2 });
          const cele = [];
          for (const [i, k] of t.kawalki.entries()) {
            const s = t.sloty[i];
            if (s.t === brak) { k.remove(); continue; }
            k.mesh.position.set(s.x, s.y, 0.4); k.rot = s.rot; k.inner.rotation.z = s.rot * Math.PI / 180;
          }
          const opcje = tasuj(["L", "Q", "M", "P"].filter((p) => p !== brak).slice(0, 2).concat(brak));
          for (const p of opcje) cele.push(c.piece(p, { x: 0, y: -2.4, size: 3.2, rot: t.sloty.find((s) => s.t === brak).rot }));
          // side by side by their real widths (a big triangle is three times a square), centred between the characters
          const bs = cele.map(obwiednia), szer = bs.reduce((a, b) => a + b.right - b.left, 0) + 0.5 * (bs.length - 1);
          let x = -szer / 2;
          for (const [i, h] of cele.entries()) { const b = bs[i]; h.mesh.position.x += x - b.left; h.mesh.position.y += -2.5 - (b.top + b.bottom) / 2; x += b.right - b.left + 0.5; }
          await c.say("wiewiorka", "line.p_gap");
          await c.task({ targets: cele, correct: cele[opcje.indexOf(brak)], wrong: "line.wrong_piece" });
          await c.say("lisek", "line.good_build", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("lisek");
      },
    ],
    apply: [
      // the home game: a square from two triangles and a house, as with paper at home
      async (c) => {
        c.show("wiewiorka"); c.show("lisek");
        await c.say("wiewiorka", "line.a_game");
        await c.say("lisek", "line.a_paper");
        await uloz(c, "kwadrat");
        await c.say("wiewiorka", "line.good_build", { anim: "Brawo" });
        c.clear();
        await c.say("lisek", "line.a_house");
        await uloz(c, "domek");
        await c.say("wiewiorka", "line.good_build", { anim: "Brawo" });
        c.clear();
        await c.say("lisek", "line.a_fish");
        await uloz(c, "ryba");
        await c.say("wiewiorka", "line.good_build", { anim: "Brawo" });
        c.clear();
        await c.say("wiewiorka", "line.a_ask_parents");
        await c.say("lisek", "line.a_bye");
        await c.play("wiewiorka", "Machanie"); await c.play("lisek", "Machanie");
      },
    ],
  },
};
