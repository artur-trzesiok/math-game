// Lesson: the queue - ordinal numbers (first, second, third ... last): in a queue the order is counted from the
// front, the place everyone is waiting for. Script in scenario.md.

const PODLOGA = -3.3;            // the queue stands on the floor between the characters
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const PORZ = ["first", "second", "third", "fourth", "fifth"];
// sizes that read on a tablet, and the bunny clearly the biggest (Fox wants to serve the biggest first)
const ROZ = { jez: 1.3, mysz: 1.05, zajac: 1.75, kaczka: 1.25, motyl: 1.1, misiu: 1.35, pilka: 1.2, klocek: 1.15, kubek: 1.15 };
const ODSTEP = 0.18;

// where each one stands: side by side by their drawn widths from x0 (the front) to the right, feet on the floor
function ustaw(c, hs, x0) {
  let x = x0;
  return hs.map((h) => { const b = c.bounds(h), w = b.right - b.left, p = { x: x + w / 2 + (h.mesh.position.x - (b.left + b.right) / 2), y: PODLOGA + (h.mesh.position.y - b.bottom) }; x += w + ODSTEP; return p; });
}
// animals in a queue facing left, towards the front at x0 (null = the row centred between the characters);
// returns them front first, the front kept on the array for przesun
async function kolejka(c, zwierzeta, { x0 = null } = {}) {
  const hs = [];
  for (const [i, n] of zwierzeta.entries()) { const h = await c.object(n, { x: 0, y: -2.3, size: ROZ[n] || 1.3 }); h.miejsce = i; hs.push(h); }
  if (x0 === null) { const w = hs.reduce((a, h) => { const b = c.bounds(h); return a + b.right - b.left; }, 0) + ODSTEP * (hs.length - 1); x0 = -w / 2; }
  for (const [i, p] of ustaw(c, hs, x0).entries()) hs[i].mesh.position.set(p.x, p.y, hs[i].mesh.position.z);
  hs.x0 = x0;
  return hs;
}
// the pencil place numbers over the heads: 1. 2. 3. ...
async function numery(c, hs) {
  const out = [];
  for (const [i, h] of hs.entries()) { const b = c.bounds(h); out.push(await c.digit(i + 1, { x: (b.left + b.right) / 2, y: b.top + 0.5, size: 0.7, color: "#1f5fbf", duration: 0.2 })); }
  return out;
}
// everyone closes up from x0 after the queue changed
async function przesun(c, hs, x0) {
  const ps = ustaw(c, hs, x0);
  await Promise.all(hs.map((h, i) => h.moveTo(ps[i].x, ps[i].y, 0.45)));
}
// a blue pencil arrow on the floor pointing at the front of the row: counting starts here
async function strzalka(c, x, y) {
  const opts = { width: 0.11, color: "#1f5fbf", duration: 0.3, strong: true };
  const a = await c.line([[x - 1.0, y], [x, y]], opts);
  await c.line([[x, y], [x - 0.3, y + 0.25]], { ...opts, duration: 0.1 });
  await c.line([[x, y], [x - 0.3, y - 0.25]], { ...opts, duration: 0.1 });
  return a;
}

export default {
  id: "queue",
  characters: { lisek: { side: "left" }, sarenka: { side: "right" } },
  backgrounds: { story: "laka", practice: "las", apply: "pokoj" },
  stages: {
    story: [
      // A. the problem: a queue at Deer's lemonade stand; Fox wants to serve the biggest first (the bunny).
      // Deer: in a queue the first is the one standing nearest the stand - first, second, third, last.
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("sarenka")]);
        const stoisko = await c.object("stol", { x: -2.75, y: -2.45, size: 1.6 });
        const q = await kolejka(c, ["jez", "mysz", "zajac", "kaczka"], { x0: -1.95 });
        await c.say("sarenka", "line.s_stand", { anim: "Radosc" });
        await c.say("lisek", "line.s_biggest", { anim: "Wskazanie" });
        await c.wonder("sarenka");
        await c.say("sarenka", "line.s_not_biggest");
        await c.say("lisek", "line.s_how");
        await c.say("sarenka", "line.s_order", { anim: "Zgloszenie" });
        await c.say("lisek", "line.s_what");
        await c.say("sarenka", "line.s_show");
        const nr = await numery(c, q);
        await c.say("sarenka", "line.s_point_first");
        await c.task({ targets: q, correct: q[0], wrong: "line.wrong_place" });
        await c.circle(q[0]);
        await c.say("lisek", "line.s_point_last");
        await c.task({ targets: q, correct: q[3], wrong: "line.wrong_place" });
        await c.say("sarenka", "line.s_point_third");
        await c.task({ targets: q, correct: q[2], wrong: "line.wrong_place" });
        // the first one is served and goes; the queue moves up - who is first now?
        for (const d of nr) d.remove();
        await c.say("lisek", "line.s_serve");
        const kubek = await c.object("kubek", { x: -2.75, y: -1.55, size: 0.7 });
        await kubek.moveTo(q[0].mesh.position.x, c.bounds(q[0]).top + 0.2, 0.4);
        // served: the hedgehog goes off behind the stand, the cup with it; everyone moves up
        await Promise.all([q[0].moveTo(q[0].mesh.position.x, -6.5, 0.8), kubek.moveTo(q[0].mesh.position.x, -5.6, 0.8)]);
        q[0].remove(); kubek.remove();
        const x0 = q.x0; q.shift(); await przesun(c, q, x0);
        await numery(c, q);
        await c.say("sarenka", "line.s_first_now");
        await c.task({ targets: q, correct: q[0], wrong: "line.wrong_place" });
        await c.say("lisek", "line.s_solved", { anim: "Brawo" });
        void stoisko;
        await c.say("sarenka", "line.s_to_playground");
        c.clear();
      },
      // B. playground: the queue to the slide (on the left). The mouse stands first, so it goes down first; it wants
      // another go, so it joins the END of the queue and everyone moves up - who is first now, who is last?
      async (c) => {
        await c.go("plac_zabaw", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sarenka")]);
        await c.say("lisek", "line.b_slide");
        const q = await kolejka(c, ["mysz", "zajac", "kaczka", "jez"]);
        let nr = await numery(c, q);
        await c.say("sarenka", "line.b_point_second");
        await c.task({ targets: q, correct: q[1], wrong: "line.wrong_place_q" });
        for (const d of nr) d.remove();
        await c.say("lisek", "line.b_mouse_goes");
        // up to the slide on the left and down it, then round behind the queue to its end
        const mysz = q.shift(), y0 = mysz.mesh.position.y;
        await mysz.moveTo(-3.9, y0 + 1.6, 0.4);
        c.sfx("whoosh");
        await mysz.moveTo(-3.6, -4.2, 0.35);
        await c.say("lisek", "line.b_mouse_again");
        const x0 = q.x0; q.push(mysz);
        const meta = c.bounds(q[q.length - 2]);
        mysz.mesh.position.set(meta.right + 0.9, -4.2, mysz.mesh.position.z);
        await przesun(c, q, x0);
        nr = await numery(c, q);
        await c.say("sarenka", "line.b_first_now");
        await c.task({ targets: q, correct: q[0], wrong: "line.wrong_place_q" });
        await c.say("sarenka", "line.b_point_last");
        await c.task({ targets: q, correct: q[3], wrong: "line.wrong_place_q" });
        await c.say("lisek", "line.b_done", { anim: "Radosc" });
        await c.say("sarenka", "line.b_to_home");
        c.clear();
      },
      // C. home: five in the queue for cookies - the fifth, and who is between the second and the fourth?
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all([c.enter("lisek"), c.enter("sarenka")]);
        await c.say("sarenka", "line.c_cookies");
        const q = await kolejka(c, ["kaczka", "jez", "motyl", "zajac", "mysz"]);
        await numery(c, q);
        await c.say("lisek", "line.c_point_fifth");
        await c.task({ targets: q, correct: q[4], wrong: "line.wrong_place_q" });
        await c.say("sarenka", "line.c_between");
        await c.task({ targets: q, correct: q[2], wrong: "line.wrong_place_q" });
        await c.say("lisek", "line.c_solved", { anim: "Brawo" });
        c.clear();
      },
    ],
    practice: [
      // five queues in random order; point to the one in the named place
      async (c) => {
        c.show("lisek"); c.show("sarenka");
        await c.say("sarenka", "line.p_intro");
        for (const k of ["first", "third", "last", "second", "fourth"]) {
          const q = await kolejka(c, tasuj(["jez", "mysz", "zajac", "kaczka"]));
          const cel = k === "last" ? q[3] : q[PORZ.indexOf(k)];
          await c.say("sarenka", `line.p_${k}`);
          await c.task({ targets: q, correct: cel, wrong: "line.wrong_place_q" });
          await c.say("lisek", "line.good_place", { anim: "Brawo" });
          c.clear();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // the home game: toys in a row on the shelf - which one is second? the last? the first?
      async (c) => {
        c.show("lisek"); c.show("sarenka");
        await c.say("lisek", "line.a_game");
        await c.say("sarenka", "line.a_ok");
        for (const k of ["second", "last", "first"]) {
          const zabawki = await kolejka(c, tasuj(["misiu", "pilka", "klocek", "kubek"]), { x0: -1.6 });
          await strzalka(c, -1.85, -2.6);                     // counting starts here
          const cel = k === "last" ? zabawki[3] : zabawki[PORZ.indexOf(k)];
          await c.say("lisek", `line.a_${k}`);
          await c.task({ targets: zabawki, correct: cel, wrong: "line.wrong_place_arrow" });
          await c.say("sarenka", "line.good_place", { anim: "Brawo" });
          c.clear();
        }
        await c.say("sarenka", "line.a_ask_parents");
        await c.say("lisek", "line.a_bye");
        await c.play("lisek", "Machanie"); await c.play("sarenka", "Machanie");
      },
    ],
  },
};
