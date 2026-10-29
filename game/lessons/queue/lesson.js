// Lesson: the queue - ordinal numbers (first, second, third ... last) say place in order, counted from the front (the
// finish, the head of a queue), not size. The great forest race: Mole says Bunny won "because he's the biggest", but
// the little hedgehog crossed the line first; the podium; the queue for the slide (the first slides down and joins the
// end); the friends' own race; medals in order. At home: toys lined up in order. Script in scenario.md.

const PODLOGA = -3.3;
const FAST = new URLSearchParams(location.search).has("szybko");
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
// sizes that read on a tablet, the bunny clearly the biggest
const ROZ = { jez: 1.2, mysz: 1.0, zajac: 1.6, kaczatko_stoi: 1.15, misiu: 1.3, pilka: 1.1, klocek: 1.05, slimak: 1.0 };
const ODSTEP = 0.18;

// where each one stands: side by side by their drawn widths from x0 (the front) to the right, feet on the floor
function ustaw(c, hs, x0) {
  let x = x0;
  return hs.map((h) => { const b = c.bounds(h), w = b.right - b.left, p = { x: x + w / 2 + (h.mesh.position.x - (b.left + b.right) / 2), y: PODLOGA + (h.mesh.position.y - b.bottom) }; x += w + ODSTEP; return p; });
}
// animals in a queue facing left towards the front at x0 (null = centred); returned front first
async function kolejka(c, zwierzeta, { x0 = null } = {}) {
  const hs = [];
  for (const [i, n] of zwierzeta.entries()) { const h = await c.object(n, { x: 0, y: -2.3, size: ROZ[n] || 1.2 }); h.miejsce = i; hs.push(h); }
  if (x0 === null) { const w = hs.reduce((a, h) => { const b = c.bounds(h); return a + b.right - b.left; }, 0) + ODSTEP * (hs.length - 1); x0 = -w / 2; }
  for (const [i, p] of ustaw(c, hs, x0).entries()) hs[i].mesh.position.set(p.x, p.y, hs[i].mesh.position.z);
  hs.x0 = x0;
  return hs;
}
// the pencil place numbers over the heads: 1, 2, 3 ...
async function numery(c, hs) {
  const out = [];
  for (const [i, h] of hs.entries()) { const b = c.bounds(h); out.push(await c.digit(i + 1, { x: (b.left + b.right) / 2, y: b.top + 0.45, size: 0.65, color: "#1f5fbf", duration: 0.2 })); }
  return out;
}
async function przesun(c, hs, x0) { const ps = ustaw(c, hs, x0); await Promise.all(hs.map((h, i) => h.moveTo(ps[i].x, ps[i].y, 0.45))); }
// a blue pencil arrow on the floor pointing at the front of the row: counting starts here
async function strzalka(c, x, y) {
  const o = { width: 0.11, color: "#1f5fbf", duration: 0.3, strong: true };
  const a = await c.line([[x - 1.0, y], [x, y]], o);
  await c.line([[x, y], [x - 0.3, y + 0.25]], { ...o, duration: 0.1 }); await c.line([[x, y], [x - 0.3, y - 0.25]], { ...o, duration: 0.1 });
  return a;
}
// the race: racers in lanes run from the start to the finish line, each at its own pace; returned in arrival order
async function wyscig(c, zawodnicy, { x0 = -1.7, x1 = 2.0, tory = [1.0, -0.05, -1.1, -2.15], czasy = null } = {}) {
  await c.line([[x1 + 0.75, tory[0] + 0.7], [x1 + 0.75, tory[tory.length - 1] - 0.6]], { width: 0.12, color: "#c0392b", duration: 0.3, strong: true });
  await c.object("meta", { x: x1 + 0.75, y: Math.min(2.7, tory[0] + 1.3), size: 1.4, cicho: true });
  const hs = [];
  for (const [i, n] of zawodnicy.entries()) hs.push(await c.object(n, { x: x0, y: tory[i], size: ROZ[n] || 1.1 }));
  await c.wait(0.5);
  const t = czasy || tasuj([1.6, 2.0, 2.4, 2.8]).slice(0, hs.length), meta = [];
  c.sfx("whoosh");
  await Promise.all(hs.map((h, i) => h.moveTo(x1, tory[i], (FAST ? 0.25 : 1) * t[i]).then(() => { meta.push(h); c.sfx("pop"); })));
  return meta;
}

// the podium: the first three of a race (names, arrival order) stand on the floor; the child puts each on its place -
// 1 in the middle and highest, 2 on the left, 3 on the right (the numbers under the places)
async function podium(c, nazwy, { wrong = "line.a_podium_nie" } = {}) {
  c.clear();
  const xs = [0.6, -1.3, 2.5], wys = [1.9, 1.35, 0.9], baza = -2.9, it = [];
  const W = 1.75;                                                   // the steps: rectangles of their own heights (pts in units of size)
  xs.forEach((x, i) => { const h = wys[i] / W / 2; c.shape("prostokat", { x, y: baza + wys[i] / 2, size: W, def: { pts: [[-0.5, -h], [0.5, -h], [0.5, h], [-0.5, h]], kolor: ["#e9c24a", "#c9ced6", "#d39a62"][i], rogi: 4 } }); });
  for (const [i, n] of nazwy.entries()) { const h = await c.object(n, { x: [-1.3, 0.6, 2.5][[1, 2, 0][i]], y: 2.3, size: ROZ[n] || 1.1 }); h.ranga = i; it.push(h); }
  const t = await c.slots({ items: it, numery: true, wrong,
    slots: xs.map((x, i) => ({ x, y: baza + wys[i] + 0.75, w: 1.7, h: 1.5, accept: (h) => h.ranga === i })) });
  await t.done();
}

export default {
  id: "queue",
  przejscia: true,
  nagrody: true,
  characters: { kret: { side: "left", x: -4.9 }, sowa: { side: "left", x: -3.1 }, bobr: { side: "right", x: 4.7 } },
  backgrounds: { story: "laka", practice: { kolor: "#f3ecdf", motyw: "cyfry" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the meadow: the great race; Mole says the biggest won; first is who reached the finish first; the podium
      async (c) => {
        await Promise.all(["kret", "sowa", "bobr"].map((n) => c.enter(n, n === "bobr" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.a_wyscig", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["kret", "sowa"] });
        await c.say("sowa", "line.a_start");
        await c.ujecie("ogolny");
        const meta = await wyscig(c, ["zajac", "jez", "kaczatko_stoi", "mysz"], { czasy: [2.2, 1.6, 1.9, 2.7] });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.a_zajac_wygral", { anim: "Podskok" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.wonder("sowa");
        await c.say("sowa", "line.a_nie_najwiekszy");
        await c.ujecie("sredni", { na: meta });                  // the racers at the finish line
        await c.say("sowa", "line.a_pierwszy", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.say("bobr", "line.a_kto_pierwszy");
        dobre(meta[0]); await c.task({ targets: meta, correct: meta[0], wrong: "line.a_kto_pierwszy_nie" }); dobre(meta[0], false);
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.a_jezyk", { anim: "Kiwanie" });
        await c.ujecie("ogolny");
        await c.say("bobr", "line.a_kto_ostatni");
        const ost = meta[meta.length - 1];
        dobre(ost); await c.task({ targets: meta, correct: ost, wrong: "line.a_kto_ostatni_nie" }); dobre(ost, false);
        await c.ujecie("sredni", { na: [ost] });
        await c.say("sowa", "line.a_ostatnia");
        await c.ujecie("ogolny");
        // the podium: first, second, third
        await c.say("bobr", "line.a_podium");
        await podium(c, meta.slice(0, 3).map((h) => h.name));
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.a_podium_ok", { anim: "Brawo" });
        await c.ujecie("ogolny");
        c.clear();
      },
      // B. the playground: the queue for the slide; the first slides and joins the end; the friends' own race; medals
      async (c) => {
        const S = c.stage;
        await c.go("plac_zabaw", { enter: true });
        await Promise.all(["kret", "sowa", "bobr"].map((n) => c.enter(n, n === "bobr" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.b_zjezdzalnia");
        await c.ujecie("ogolny");
        const q = await kolejka(c, ["mysz", "zajac", "jez", "kaczatko_stoi"]);
        const s = await strzalka(c, q.x0 - 0.15, PODLOGA - 0.35);
        await c.ujecie("sredni", { na: ["sowa", ...q] });        // the queue and its front, where counting starts
        await c.say("sowa", "line.b_od_przodu");
        const nr = await numery(c, q);
        await c.ujecie("ogolny");
        await c.say("kret", "line.b_trzeci");
        dobre(q[2]); await c.task({ targets: q, correct: q[2], wrong: "line.b_trzeci_nie" }); dobre(q[2], false);
        nr.forEach((d) => d.remove());
        // the first slides down and joins the end: who is first now?
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.b_zjezdza");
        await c.ujecie("ogolny");
        const pierwszy = q.shift(); c.sfx("whoosh");
        await pierwszy.moveTo(pierwszy.mesh.position.x, 2.0, 0.4); q.push(pierwszy);
        await przesun(c, q, q.x0);
        await c.say("bobr", "line.b_kto_teraz");
        dobre(q[0]); await c.task({ targets: q, correct: q[0], wrong: "line.b_kto_teraz_nie" }); dobre(q[0], false);
        await c.ujecie("sredni", { na: ["sowa", ...q] });
        await c.say("sowa", "line.b_teraz_pierwszy");
        await c.ujecie("ogolny");
        s.remove(); c.clear();
        // the breather: the friends race to the swings - who came first?
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.b_my", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const kolej = [], kto = ["kret", "sowa"], start = tasuj(kto);
        await Promise.all(start.map((n, i) => (async () => { await c.wait(i * 0.5); await c.walkTo(n, { kret: 2.6, sowa: 0.9 }[n]); kolej.push(n); })()));
        const cele = kto.map((n) => S.puppets[n]), wygral = S.puppets[kolej[0]];
        await c.say("bobr", "line.b_kto_pierwszy");
        dobre(cele, false); dobre(wygral); await c.task({ targets: cele, correct: wygral, wrong: "line.b_kto_pierwszy_nie" }); dobre(cele, false);
        await c.ujecie("zblizenie", { na: kolej[0] });
        await c.say(kolej[0], `line.b_pierwszy_${kolej[0]}`, { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["kret", "sowa"] });
        await c.say("kret", "line.b_koniec");
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("kret"); c.show("bobr");
        S.puppets.kret.korzen.position.x = -5.2; S.puppets.bobr.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("bobr", "line.p_start", { anim: "Radosc" });
        // 1. the second in the queue
        {
          const q = await kolejka(c, tasuj(["mysz", "zajac", "jez", "kaczatko_stoi"])); const s = await strzalka(c, q.x0 - 0.15, PODLOGA - 0.35);
          await c.say("kret", "line.p_drugi");
          dobre(q[1]); await c.task({ targets: q, correct: q[1], wrong: "line.p_drugi_nie" });
          await c.ujecie("zblizenie", { na: "bobr" });
          await c.say("bobr", "line.p_dobrze"); s.remove(); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 2. who is last?
        {
          const q = await kolejka(c, tasuj(["mysz", "zajac", "jez", "kaczatko_stoi", "slimak"])); const s = await strzalka(c, q.x0 - 0.15, PODLOGA - 0.35);
          await c.say("bobr", "line.p_ostatni");
          const ost = q[q.length - 1];
          dobre(ost); await c.task({ targets: q, correct: ost, wrong: "line.p_ostatni_nie" });
          await c.ujecie("zblizenie", { na: "kret" });
          await c.say("kret", "line.p_dobrze"); s.remove(); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 3. a race, then the podium
        {
          await c.ujecie("zblizenie", { na: "kret" });
          await c.say("kret", "line.p_wyscig");
          await c.ujecie("ogolny");
          const meta = await wyscig(c, tasuj(["zajac", "jez", "kaczatko_stoi"]), { tory: [0.6, -0.7, -2.0] });
          await c.say("bobr", "line.p_podium");
          await podium(c, meta.map((h) => h.name));
          await c.ujecie("zblizenie", { na: "kret" });
          await c.say("kret", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 4. the gold, silver and bronze medals: which one is for the second?
        {
          const m = []; for (const [i, n] of tasuj(["medal_zloty", "medal_srebrny", "medal_brazowy"]).entries()) m.push(await c.object(n, { x: -2.0 + i * 2.2, y: 0.6, size: 2.3 }));
          await c.ujecie("sredni", { na: m });
          await c.say("bobr", "line.p_medale");
          await c.ujecie("ogolny");
          const ok = m.find((h) => h.name === "medal_srebrny");
          dobre(ok); await c.task({ targets: m, correct: ok, wrong: "line.p_medale_nie" });
          await c.ujecie("sredni", { na: ["kret", ok] });
          await c.say("kret", "line.p_srebrny"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 5. the bronze medal for the third in the queue
        {
          const md = await c.object("medal_brazowy", { x: 0, y: 1.5, size: 1.8 });
          const q = await kolejka(c, tasuj(["mysz", "zajac", "jez", "kaczatko_stoi"])); const s = await strzalka(c, q.x0 - 0.15, PODLOGA - 0.35);
          await c.ujecie("sredni", { na: [md, ...q] });
          await c.say("kret", "line.p_trzeci");
          await c.ujecie("ogolny");
          dobre(q[2]); await c.task({ targets: q, correct: q[2], wrong: "line.p_trzeci_nie" });
          await c.ujecie("zblizenie", { na: "bobr" });
          await c.say("bobr", "line.p_dobrze"); s.remove(); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        await c.praise("bobr");
      },
    ],
    apply: [
      // home: the toys line up for bed in the order Mole says
      async (c) => {
        for (const n of ["kret", "bobr"]) c.show(n);
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.h_zabawki", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const it = []; for (const [i, n] of tasuj(["misiu", "pilka", "klocek"]).entries()) { const h = await c.object(n, { x: -2.0 + i * 2.0, y: 1.4, size: ROZ[n] }); h.ranga = ["misiu", "pilka", "klocek"].indexOf(n); it.push(h); }
        await c.say("kret", "line.h_kolejnosc");
        const t = await c.slots({ items: it, numery: true, slots: [0, 1, 2].map((k) => ({ x: -2.0 + k * 2.0, y: -1.7, w: 1.7, h: 1.5, accept: (h) => h.ranga === k })), wrong: "line.h_nie" });
        await t.done();
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.h_dobrze", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.h_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
