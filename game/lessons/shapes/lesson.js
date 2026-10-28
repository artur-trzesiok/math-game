// Lesson: geometric shapes - circle, triangle, square, rectangle, told apart by their corners and sides (counted
// by touch), not by colour or by how they are turned. Script in scenario.md.

const Y = 1.2;
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const KOLORY = ["#e8604c", "#3f8ce0", "#f5c341", "#58bd68", "#9b6fd6"];
const kolor = () => KOLORY[Math.floor(Math.random() * KOLORY.length)];

// a row of shapes in random colours and turns; returns the handles in the given order
async function rzadFigur(c, kinds, { y = Y, size = 1.5, gap = 2.6, obroc = true } = {}) {
  const x0 = -((kinds.length - 1) * gap) / 2;
  const hs = [];
  for (const [i, k] of kinds.entries()) hs.push(c.shape(k, { x: x0 + i * gap, y, size, color: kolor(), rot: obroc && k !== "kolo" ? [0, 15, -20, 30][Math.floor(Math.random() * 4)] : 0 }));
  await c.wait(0.4);
  return hs;
}
async function ktoraKarta(c, n, who, key, oferta) {
  const karty = [];
  for (const d of oferta) karty.push(await c.sign(String(d), { size: 1.2 }));
  c.arrange([karty], { y: -2.45, gap: 0.8 });
  await c.say(who, key);
  const dobra = karty[oferta.indexOf(n)];
  await c.task({ targets: karty, correct: dobra, wrong: "line.wrong_number" });
  return dobra;
}

export default {
  id: "shapes",
  characters: { lisek: { side: "left" }, sowa: { side: "right" } },
  backgrounds: { story: "pokoj", practice: "laka", apply: "dom" },
  stages: {
    story: [
      // A. the problem: Owl asks for a round window for her birdhouse, Fox brings a square - "a window is a window".
      // Owl: every shape is different - tell them by corners and sides. Circle, triangle, square, rectangle.
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.say("sowa", "line.s_ask");
        const okno = c.shape("kwadrat", { x: -2.2, y: Y, size: 1.5, color: "#3f8ce0" });
        await c.say("lisek", "line.s_here", { anim: "Wskazanie" });
        await c.wonder("sowa");
        await c.say("sowa", "line.s_not_round");
        await c.say("lisek", "line.s_same");
        await c.say("sowa", "line.s_differ");
        await c.say("lisek", "line.s_how");
        const pomysl = await c.idea("sowa", [["pilka", "klocek"]]);
        await c.say("sowa", "line.s_corners", { anim: "Zgloszenie" });
        pomysl.remove(); okno.remove();
        // the four shapes, one after another
        const kolo = c.shape("kolo", { x: -4.0, y: Y, size: 1.5 });
        await c.say("sowa", "line.s_circle");
        const tr = c.shape("trojkat", { x: -1.6, y: Y, size: 1.6 });
        await c.say("sowa", "line.s_triangle");
        await c.count(c.corners(tr), { who: "sowa" });
        await c.say("sowa", "line.s_three_corners");
        const kw = c.shape("kwadrat", { x: 1.6, y: Y, size: 1.4 });
        await c.say("sowa", "line.s_square");
        await c.count(c.corners(kw), { who: "lisek" });
        await c.say("lisek", "line.s_four_corners");
        c.shape("prostokat", { x: 4.0, y: Y, size: 1.25 });
        await c.say("sowa", "line.s_rectangle");
        await c.say("lisek", "line.s_point_circle");
        await c.task({ targets: [kolo, tr, kw], correct: kolo, wrong: "line.wrong_shape" });
        await c.circle(kolo);
        await c.say("lisek", "line.s_solved", { anim: "Radosc" });
        await c.say("sowa", "line.s_to_playground");
        c.clear();
      },
      // B. playground: blocks of two shapes left lying about - circles into the basket, triangles into the box;
      // a turned square is still a square
      async (c) => {
        await c.go("plac_zabaw", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.say("lisek", "line.b_blocks");
        const kinds = tasuj(["kolo", "kolo", "kolo", "trojkat", "trojkat", "trojkat"]);
        const items = kinds.map((k, i) => { const h = c.shape(k, { x: -3.6 + i * 1.45, y: 1.3, size: 1.0, color: kolor(), rot: k === "trojkat" ? 45 * Math.floor(Math.random() * 3) : 0 }); h.home = { x: -3.6 + i * 1.45, y: 1.3 }; return h; });
        const zones = [await c.zone({ x: -1.75, y: -1.95, w: 3.3, h: 2.6, image: "koszyk", name: "koszyk" }), await c.zone({ x: 1.75, y: -1.95, w: 3.3, h: 2.6, image: "pudelko", name: "pudelko" })];
        zones[0].want = "kolo"; zones[1].want = "trojkat";   // the line names the containers, so they are fixed
        await c.say("sowa", "line.b_sort");
        await c.sort({ items, zones, wrong: "line.b_mixed" });
        await c.say("sowa", "line.b_done", { anim: "Brawo" });
        c.clear();
        const [kw, pr, tr] = await rzadFigur(c, ["kwadrat", "prostokat", "trojkat"], { obroc: false });
        await kw.rotateTo(45, 0.6);
        await c.say("sowa", "line.b_turned");
        await c.task({ targets: tasuj([kw, pr, tr]), correct: kw, wrong: "line.wrong_shape" });
        await c.say("lisek", "line.b_still_square", { anim: "Radosc" });
        await c.say("sowa", "line.b_to_orchard");
        c.clear();
      },
      // C. orchard: the birdhouse from shapes - the triangle roof ON the square, the round window IN the square
      async (c) => {
        await c.go("sad", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        const sciany = c.shape("kwadrat", { x: 0.6, y: 0.2, size: 2.0, color: "#d99a5b" });
        await c.say("lisek", "line.c_build");
        const dach = c.shape("trojkat", { x: -2.8, y: 2.1, size: 2.3, color: "#e8604c" }); dach.home = { x: -2.8, y: 2.1 };
        await c.say("sowa", "line.c_roof");
        await c.place({ item: dach, ref: sciany, want: "na", wrong: "line.c_roof_wrong" });
        const okno = c.shape("kolo", { x: -2.4, y: -2.3, size: 0.8, color: "#fbe9a0" }); okno.home = { x: -2.4, y: -2.3 };
        await c.say("lisek", "line.c_window");
        await c.place({ item: okno, ref: sciany, want: "w", wrong: "line.c_window_wrong" });
        await c.say("sowa", "line.c_solved", { anim: "Radosc" });
        c.clear();
      },
    ],
    practice: [
      // five rounds: three shapes in random colours and turns, point to the one named
      async (c) => {
        c.show("lisek"); c.show("sowa");
        await c.say("sowa", "line.p_intro");
        for (const want of ["trojkat", "kolo", "kwadrat", "prostokat", "trojkat"]) {
          const inne = tasuj(["kolo", "kwadrat", "trojkat", "prostokat"].filter((k) => k !== want)).slice(0, 2);
          const kinds = tasuj([want, ...inne]);
          const hs = await rzadFigur(c, kinds);
          await c.say("sowa", `line.p_${want}`);
          await c.task({ targets: hs, correct: hs[kinds.indexOf(want)], wrong: "line.wrong_shape" });
          await c.say("lisek", "line.good_shape", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // the home game: what shape is a plate, a block, a ball? and how many corners does it have?
      async (c) => {
        c.show("lisek"); c.show("sowa");
        await c.say("lisek", "line.a_game");
        await c.say("sowa", "line.a_ok");
        for (const [rzecz, ksztalt] of [["talerz", "kolo"], ["klocek", "kwadrat"], ["pilka", "kolo"]]) {
          await c.object(rzecz, { x: 0, y: 1.5, size: 1.6 });
          const kinds = tasuj(["kolo", "kwadrat", "trojkat"]);
          const hs = await rzadFigur(c, kinds, { y: -1.9, size: 1.1, gap: 2.0 });
          await c.say("sowa", `line.a_${rzecz}`);
          await c.task({ targets: hs, correct: hs[kinds.indexOf(ksztalt)], wrong: "line.wrong_shape" });
          await c.say("lisek", "line.good_shape", { anim: "Brawo" });
          c.clear();
        }
        for (const [k, n] of [["trojkat", 3], ["kwadrat", 4]]) {
          c.shape(k, { x: 0, y: 1.3, size: 2.0, color: kolor() });
          await ktoraKarta(c, n, "lisek", "line.a_how_many_corners", tasuj([n, n === 3 ? 4 : 3, 0]));
          await c.say("sowa", "line.good_shape", { anim: "Brawo" });
          c.clear();
        }
        await c.say("sowa", "line.a_ask_parents");
        await c.say("lisek", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("sowa", "Machanie");
      },
    ],
  },
};
