// Lesson: the queue - ordinal numbers (first, second, third ... last) say place in order, counted from the front (the
// finish, the head of a queue), not size. The great forest race on its own track (a panorama the camera follows from
// the start to the finish): Mole is sure the biggest wins, the photo of the finish shows the little hedgehog first; the
// queue for the slide counted from the arrow (an insert), the first slides and joins the end, the late snail stands
// last; the breather: pulling faces while waiting; at the podium glade the winners take their steps and get medals in
// order. At home, the third act: the toys' race (the teddy "won, he's the biggest" again), paper medals for the winners,
// the forest race's photos in order, the ceremony seen, the home race shown in play. Script in scenario.md.

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
// invisible drop places at the boundaries of a queue: before the first, between each two, after the last; `want` is
// the place a thing dropped there would take ("1" = in front of everybody ... n+1 = at the end)
async function granice(c, q, { w = 0.95, h = 2.2 } = {}) {
  const bs = q.map((x) => c.bounds(x)), xs = [bs[0].left - 0.35, ...bs.slice(1).map((b, i) => (bs[i].right + b.left) / 2), bs[bs.length - 1].right + 0.45];
  const out = [];
  for (const [i, x] of xs.entries()) { const z = await c.zone({ x, y: PODLOGA + h / 2, w, h, name: `granica_${i}`, niewidoczna: true, rodzaj: "stoi" }); z.want = String(i + 1); out.push(z); }
  return out;
}
// the runners at the start, in lanes, turned to face the way they run (the base drawings: the finish photo shows those)
const TORY = [1.0, -0.05, -1.1, -2.15];
async function biegacze(c, zawodnicy, { x0 = -1.7, tory = TORY } = {}) {
  const hs = [];
  for (const [i, n] of zawodnicy.entries()) { const h = await c.object(n, { x: x0, y: tory[i], size: ROZ[n] || 1.1, plik: n }); h.icon.scale.x = -1; h.tor = tory[i]; hs.push(h); }
  return hs;
}
// the finish: a red pencil line and the ribbon; the runners dash to it, each at its own pace; returned in arrival order
async function finisz(c, hs, { x1 = 2.0, czasy = null } = {}) {
  const tory = hs.map((h) => h.tor);
  await c.line([[x1 + 0.75, tory[0] + 0.7], [x1 + 0.75, tory[tory.length - 1] - 0.6]], { width: 0.12, color: "#c0392b", duration: 0.3, strong: true });
  await c.object("meta", { x: x1 + 0.75, y: Math.min(2.7, tory[0] + 1.3), size: 1.4, cicho: true });
  await c.wait(0.3);
  const t = czasy || tasuj([1.6, 2.0, 2.4, 2.8]).slice(0, hs.length);
  c.sfx("whoosh");
  await Promise.all(hs.map((h, i) => h.moveTo(x1, h.tor, (FAST ? 0.25 : 1) * t[i]).then(() => c.sfx("pop"))));
  return hs.map((h, i) => [h, t[i]]).sort((a, b) => a[1] - b[1]).map(([h]) => h);
}
async function wyscig(c, zawodnicy, { tory = TORY, czasy = null } = {}) {
  const hs = await biegacze(c, zawodnicy, { tory });
  await c.wait(0.5);
  return finisz(c, hs, { czasy });
}

// the podium: the first three of a race (names, arrival order) wait over the steps; the child puts each on its place -
// 1 in the middle and highest, 2 on the left, 3 on the right (pencil numbers on the steps). The podium is a painted
// sticker; its steps (x of the middle, y of the top) in fractions of the sticker's side, measured on podium.webp
const STOPNIE = { x: [0, -0.297, 0.296], y: [0.177, 0.096, 0.021], dol: -0.177 };
const postawPodium = (c, { x = 0, dol = -2.6, size = 6.2 } = {}) => c.object("podium", { x, y: dol - STOPNIE.dol * size, size }).then((h) => Object.assign(h, { px: x, rozmiar: size }));
async function podium(c, nazwy, { wrong = "line.a_podium_nie", stoi = null, plik = false } = {}) {
  if (!stoi) { c.clear(); stoi = await postawPodium(c); }
  const x = stoi.px, size = stoi.rozmiar, y = stoi.mesh.position.y, it = [];
  const xs = STOPNIE.x.map((f) => x + f * size), gory = STOPNIE.y.map((f) => y + f * size);
  const start = [xs[1], xs[0], xs[2]];                              // where they wait over the steps, mixed
  for (const [i, n] of nazwy.entries()) { const h = await c.object(n, { x: start[[1, 2, 0][i]], y: 2.3, size: ROZ[n] || 1.1, plik: plik ? n : null }); h.tag = String(i + 1); it.push(h); }
  const nr = [], strefy = [];
  for (const [i, sx] of xs.entries()) {
    nr.push(await c.digit(i + 1, { x: sx, y: gory[i] - 0.45, size: 0.55, color: "#1f5fbf", duration: 0.15 }));
    const z = await c.zone({ x: sx, y: gory[i] + 0.48, w: 1.6, h: 1.6, name: `stopien_${i}`, niewidoczna: true, rodzaj: "stoi" }); z.want = String(i + 1); strefy.push(z);
  }
  await c.sort({ items: it, zones: strefy, wrong });
  return it;
}

const POZ = { kret: -4.9, sowa: -3.1, bobr: 4.7 };
const wejdzWszyscy = (c, strona = { bobr: "right" }) => Promise.all(["kret", "sowa", "bobr"].map((n) => c.enter(n, strona[n] || "left")));

export default {
  id: "queue",
  przejscia: true,
  nagrody: true,
  characters: { kret: { side: "left", x: POZ.kret }, sowa: { side: "left", x: POZ.sowa }, bobr: { side: "right", x: POZ.bobr } },
  backgrounds: { story: "tor_wyscigu", practice: { kolor: "#f3ecdf", motyw: "cyfry" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the race track: Mole is sure the biggest wins; the start (an illustration); the pan follows the runners to the
      // finish; too close to see - Beaver's photo of the finish shows it
      async (c) => {
        const S = c.stage, dom = { kret: S.puppets.kret.home, sowa: S.puppets.sowa.home };
        S.puppets.kret.home = -5.2; S.puppets.sowa.home = -3.8;          // clear of the runners' start
        await wejdzWszyscy(c);
        await c.say("bobr", "line.a_wyscig", { anim: "Radosc" });          // wide: the start with its bunting in view
        const hs = await biegacze(c, ["zajac", "jez", "kaczatko_stoi", "mysz"], { x0: -1.0 });
        await c.ujecie("sredni", { na: ["kret", ...hs] });                 // Mole and the runners he talks about
        await c.say("kret", "line.a_biegacze", { anim: "Wskazanie" });
        const il = await c.ilustracja("start_wyscigu", { ruch: "w_prawo" });
        await c.say("sowa", "line.a_start", { anim: "Zgloszenie" });
        await il.zsun();
        await c.ujecie("ogolny");
        await c.say("bobr", "line.a_biegna", { anim: "Podskok" });
        // the camera follows the runners along the track; everybody walks along
        c.sfx("whoosh");
        const y0 = hs.map((h) => h.mesh.position.y);
        await Promise.all([c.pan(1, { idz: ["kret", "sowa", "bobr"], d: 3.2 }),
          c.stage.tween(FAST ? 0.1 : 3.2, (s) => hs.forEach((h, i) => { h.mesh.position.y = y0[i] + Math.abs(Math.sin(s * 30 + i * 0.9)) * 0.12; h.mesh.position.x = -1.0 + s * (0.4 + 0.1 * Math.sin(i * 2.1)); }))]);
        // a close finish: the hedgehog first by a whisker, the bunny and the duckling just behind, the mouse far back
        const meta = await finisz(c, hs, { x1: 2.2, czasy: [1.95, 1.85, 2.05, 2.8] });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.emocja("kret", "radosc", { anim: "Podskok" });
        await c.say("kret", "line.a_zajac_wygral");
        await c.ujecie("dwuujecie", { na: ["sowa", "kret"] });
        await c.wonder("sowa");
        await c.say("sowa", "line.a_nie_najwiekszy");
        await c.ujecie("sredni", { na: ["sowa", ...meta] });              // the racers at the finish line
        await c.say("sowa", "line.a_pierwszy", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.emocja("kret", "pot", { anim: "Rozgladanie" });
        await c.say("kret", "line.a_nie_widzialem");
        await c.ujecie("sredni", { na: ["bobr"] });
        await c.say("bobr", "line.a_zdjecie", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        // the photo of the finish line: who touches the line first, who is far behind (spots: the hedgehog, the mouse)
        const foto = await c.znalezisko("fotofinisz", { skad: "bobr" });
        const poX = foto.cele.slice().sort((a, b) => foto.meta.cele[b.nr].x - foto.meta.cele[a.nr].x), [jez, mysz] = poX;
        const kropka = [...foto.cele, foto.tlo];
        await c.say("bobr", "line.a_zdjecie_kto");
        dobre(jez); await c.task({ targets: kropka, correct: jez, wrong: "line.a_zdjecie_nie" }); dobre(jez, false);
        await c.ujecie("zblizenie", { na: "kret" });                      // the surprise: so small, and first
        await c.say("kret", "line.a_jezyk", { anim: "Podskok" });
        await c.ujecie("ogolny");                                          // back to the photo Owl reads
        await c.say("sowa", "line.a_zdjecie_tak", { anim: "Zgloszenie" });
        await c.say("bobr", "line.a_kto_ostatni");
        dobre(mysz); await c.task({ targets: kropka, correct: mysz, wrong: "line.a_kto_ostatni_nie" }); dobre(mysz, false);
        await foto.zaznacz();
        await c.say("sowa", "line.a_ostatnia");
        await foto.remove();
        await c.ujecie("sredni", { na: ["bobr"] });
        await c.say("bobr", "line.a_po_wyscigu", { anim: "Radosc" });
        c.clear();
        for (const n in dom) S.puppets[n].home = dom[n];
      },
      // B. the playground: the queue for the slide counted from the arrow (an insert); the first slides and joins the
      // end; the late snail stands last; the breather: pulling faces while waiting
      async (c) => {
        const S = c.stage, dom = { kret: S.puppets.kret.home, sowa: S.puppets.sowa.home };
        S.puppets.kret.home = -5.2; S.puppets.sowa.home = -3.9;          // clear of the queue's front and its arrow
        await c.go("plac_zabaw", { enter: true });
        await wejdzWszyscy(c);
        const KOL = ["mysz", "zajac", "jez", "kaczatko_stoi"], X0 = -1.8;
        await kolejka(c, KOL, { x0: X0 });
        await c.say("kret", "line.b_zjezdzalnia", { anim: "Rozgladanie" });   // wide: the slide and the queue in view
        // the method on a plain colour: the queue, the arrow at its front, the places counted from it
        await c.go({ kolor: "#eaf1f7", motyw: "kola" }, { ciecie: true });
        let q = await kolejka(c, KOL, { x0: X0 });
        let s = await strzalka(c, q.x0 - 0.15, PODLOGA - 0.35);
        await c.ujecie("sredni", { na: ["sowa", ...q] });                  // the queue and its front, where counting starts
        await c.say("sowa", "line.b_od_przodu", { anim: "Wskazanie" });
        await numery(c, q);
        await c.ujecie("ogolny");
        await c.say("kret", "line.b_trzeci");
        dobre(q[2]); await c.task({ targets: q, correct: q[2], wrong: "line.b_trzeci_nie" }); dobre(q[2], false);
        await c.ujecie("sredni", { na: ["sowa", q[2]] });
        await c.say("sowa", "line.b_trzeci_ok", { anim: "Kiwanie" });
        // back at the slide: the first slides down and joins the end - who is first now?
        await c.go("plac_zabaw", { ciecie: true });
        q = await kolejka(c, KOL, { x0: X0 });
        s = await strzalka(c, q.x0 - 0.15, PODLOGA - 0.35);
        await c.ujecie("ogolny");
        await c.say("bobr", "line.b_zjezdza");
        const pierwszy = q.shift(); c.sfx("whoosh");
        await pierwszy.moveTo(pierwszy.mesh.position.x - 0.4, 2.2, 0.4);           // up the ladder...
        c.sfx("whoosh"); await pierwszy.moveTo(3.0, 2.4, FAST ? 0.2 : 0.7);        // ...away, and round to the back
        q.push(pierwszy);
        await przesun(c, q, q.x0);
        await c.say("bobr", "line.b_kto_teraz");
        dobre(q[0]); await c.task({ targets: q, correct: q[0], wrong: "line.b_kto_teraz_nie" }); dobre(q[0], false);
        await c.ujecie("sredni", { na: ["sowa", ...q] });
        await c.say("sowa", "line.b_teraz_pierwszy", { anim: "Zgloszenie" });
        // the snail comes late: no cutting in - who comes last stands at the end
        await c.ujecie("ogolny");
        const slimak = await c.object("slimak", { x: 0.6, y: 1.6, size: ROZ.slimak }); slimak.tag = String(q.length + 1);
        await c.say("kret", "line.b_slimak", { anim: "Wskazanie" });
        const gr = await granice(c, q);
        await c.sort({ items: [slimak], zones: [gr[0], gr[gr.length - 1]], wrong: "line.b_slimak_nie" });
        gr.forEach((z) => z.remove());
        q.push(slimak); await przesun(c, q, q.x0);
        await c.ujecie("sredni", { na: ["sowa", ...q.slice(-2)] });
        await c.say("sowa", "line.b_slimak_ok", { anim: "Kiwanie" });
        // the breather: the queue is long - Mole pulls faces, the child copies them
        await c.ujecie("dwuujecie", { na: ["kret", "sowa"] });
        await c.say("kret", "line.b_nudno", { anim: "Smutek" });
        await c.say("sowa", "line.b_miny", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                          // the faces to pick lie across the screen
        await c.lustro({ kto: "kret", rundy: 3 });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.b_miny_ok", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["bobr"] });
        await c.say("bobr", "line.b_ceremonia", { anim: "Zgloszenie" });
        s.remove(); c.clear();
        for (const n in dom) S.puppets[n].home = dom[n];
      },
      // C. the podium glade: the winners take their steps and get their medals - gold, silver, bronze
      async (c) => {
        const S = c.stage, dom = { kret: S.puppets.kret.home, sowa: S.puppets.sowa.home, bobr: S.puppets.bobr.home };
        S.puppets.kret.home = -3.95; S.puppets.bobr.home = -5.3; S.puppets.sowa.home = 4.4;   // clear of the podium
        await c.go("podium_wyscigu", { enter: true });
        const pod = await postawPodium(c);
        await wejdzWszyscy(c, { sowa: "right" });
        await c.play("kret", "Rozgladanie");
        await c.say("kret", "line.c_podium_miejsce", { anim: "Radosc" });   // the wide shot: the flags and the podium in view
        await c.say("bobr", "line.a_podium");
        const na = await podium(c, ["jez", "zajac", "kaczatko_stoi"], { stoi: pod, plik: true });   // the drawings of the photo
        await c.ujecie("sredni", { na: ["sowa", ...na] });
        await c.say("sowa", "line.a_podium_ok", { anim: "Brawo" });
        // the medals over the podium, then each one goes to its place
        const md = []; for (const [i, n] of ["medal_zloty", "medal_srebrny", "medal_brazowy"].entries()) md.push(await c.object(n, { x: -1.6 + i * 1.6, y: 2.75, size: 0.9 }));
        await c.ujecie("sredni", { na: ["sowa", ...md] });
        await c.say("sowa", "line.c_medale", { anim: "Zgloszenie" });
        const wrecz = async (m, h) => {                                // the medal flies onto the winner's chest, a little smaller
          const b = c.bounds(h), s0 = m.base, s1 = 0.62; m.mesh.position.z = h.mesh.position.z + 0.05; c.sfx("whoosh");
          await Promise.all([m.moveTo((b.left + b.right) / 2, b.bottom + (b.top - b.bottom) * 0.3, 0.5), S.tween(0.5, (q) => { m.base = s0 + (s1 - s0) * q; m.mesh.scale.setScalar(m.base); })]); c.sfx("pop");
        };
        await c.ujecie("ogolny");
        await c.say("bobr", "line.c_zloty");
        await wrecz(md[0], na[0]); await c.rozblysk(na[0]);
        await c.say("bobr", "line.c_srebrny");
        dobre(na[1]); await c.task({ targets: na, correct: na[1], wrong: "line.c_srebrny_nie" }); dobre(na[1], false);
        await wrecz(md[1], na[1]);
        await c.say("bobr", "line.c_srebrny_ok", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["sowa", na[2]] });
        await c.say("sowa", "line.c_brazowy");
        await wrecz(md[2], na[2]);
        await c.ujecie("ogolny");
        await c.konfetti();
        await c.ujecie("zblizenie", { na: "kret" });
        await c.say("kret", "line.c_koniec", { anim: "Brawo" });
        await c.ujecie("dwuujecie", { na: ["kret", "bobr"] });            // the promise that leads home
        await c.say("kret", "line.c_dom", { anim: "Podskok" });
        c.clear();
        for (const n in dom) S.puppets[n].home = dom[n];
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("kret"); c.show("bobr");
        S.puppets.kret.korzen.position.x = -5.2; S.puppets.bobr.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("dwuujecie", { na: ["kret", "bobr"] });
        await c.say("bobr", "line.p_start", { anim: "Radosc" });
        // 1. the second in the queue
        {
          await c.ujecie("ogolny");
          const q = await kolejka(c, tasuj(["mysz", "zajac", "jez", "kaczatko_stoi"])); await strzalka(c, q.x0 - 0.15, PODLOGA - 0.35);
          await c.say("kret", "line.p_drugi");
          dobre(q[1]); await c.task({ targets: q, correct: q[1], wrong: "line.p_drugi_nie" });
          await c.ujecie("sredni", { na: ["bobr", q[0], q[1]] });
          await c.say("bobr", "line.p_drugi_ok", { anim: "Kiwanie" }); gw.dodaj(); c.clear();
        }
        // 2. who is last?
        {
          await c.ujecie("ogolny");
          const q = await kolejka(c, tasuj(["mysz", "zajac", "jez", "kaczatko_stoi", "slimak"])); await strzalka(c, q.x0 - 0.15, PODLOGA - 0.35);
          await c.say("bobr", "line.p_ostatni");
          const ost = q[q.length - 1];
          dobre(ost); await c.task({ targets: q, correct: ost, wrong: "line.p_ostatni_nie" });
          await c.ujecie("sredni", { na: ["bobr", ost] });
          await c.say("kret", "line.p_ostatni_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 3. a race, then the podium
        {
          await c.ujecie("dwuujecie", { na: ["kret", "bobr"] });
          await c.say("kret", "line.p_wyscig", { anim: "Zgloszenie" });
          await c.ujecie("ogolny");
          const meta = await wyscig(c, tasuj(["zajac", "jez", "kaczatko_stoi"]), { tory: [0.6, -0.7, -2.0] });
          await c.say("bobr", "line.p_podium");
          const na = await podium(c, meta.map((h) => h.name));
          await c.ujecie("sredni", { na: ["kret", ...na] });
          await c.say("kret", "line.p_podium_ok", { anim: "Brawo" }); gw.dodaj(); c.clear();
        }
        // 4. the gold, silver and bronze medals: which one is for the second?
        {
          const m = []; for (const [i, n] of tasuj(["medal_zloty", "medal_srebrny", "medal_brazowy"]).entries()) m.push(await c.object(n, { x: -2.0 + i * 2.2, y: 0.6, size: 2.3 }));
          await c.ujecie("ogolny");
          await c.say("bobr", "line.p_medale");
          const ok = m.find((h) => h.name === "medal_srebrny");
          dobre(ok); await c.task({ targets: m, correct: ok, wrong: "line.p_medale_nie" });
          await c.ujecie("sredni", { na: ["kret", ok] });
          await c.say("kret", "line.p_srebrny", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 5. the duckling wants to stand third: drag her into the queue
        {
          await c.ujecie("ogolny");
          const q = await kolejka(c, tasuj(["mysz", "zajac", "jez"]), { x0: -2.9 }); await strzalka(c, q.x0 - 0.15, PODLOGA - 0.35);
          const kacz = await c.object("kaczatko_stoi", { x: 0.3, y: 1.5, size: ROZ.kaczatko_stoi }); kacz.tag = "3";
          await c.say("kret", "line.p_trzeci");
          const gr = await granice(c, q);
          await c.sort({ items: [kacz], zones: gr, wrong: "line.p_trzeci_nie" });
          gr.forEach((z) => z.remove());
          q.splice(2, 0, kacz); await przesun(c, q, q.x0);
          await c.ujecie("sredni", { na: ["bobr", ...q.slice(1, 4)] });
          await c.say("bobr", "line.p_trzeci_ok", { anim: "Radosc" }); gw.dodaj();
        }
        await c.praise("bobr");
      },
    ],
    apply: [
      // home - the third act in Mole's room: the toys' race, where Mole again says the biggest won; the child points to
      // the first; paper medals onto the winners; the forest race's photos in order (an insert); the ceremony seen; the
      // home race shown in play, the child as the judge
      async (c) => {
        const S = c.stage;
        for (const n of Object.keys(POZ)) { c.show(n); S.puppets[n].korzen.position.x = POZ[n]; }
        await c.wait(0.3);
        await c.ujecie("ogolny");
        await c.say("kret", "line.h_zabawki", { anim: "Radosc" });
        // the toys' race across the rug to a pencil finish line: the ball rolls first, the teddy comes last
        // the teddy clearly the biggest, the ball the smallest
        const LINIA = 1.9, tory = [-0.85, -1.95, -2.85], it = [];
        for (const [i, n] of ["misiu", "pilka", "klocek"].entries()) { const h = await c.object(n, { x: -1.5, y: tory[i], size: { misiu: 1.45, pilka: 0.75, klocek: 0.8 }[n] }); h.tor = tory[i]; it.push(h); }
        const [mis, pilka, klocek] = it;
        await c.line([[LINIA + 0.75, 0.0], [LINIA + 0.75, -3.3]], { width: 0.1, color: "#c0392b", duration: 0.3, strong: true });
        await c.say("sowa", "line.h_start", { anim: "Zgloszenie" });
        c.sfx("whoosh");
        const rol = (h, d, obrot) => Promise.all([h.moveTo(LINIA, h.tor, (FAST ? 0.25 : 1) * d), obrot ? S.tween(FAST ? 0.25 : d, (s) => { h.icon.rotation.z = -s * 9; }) : null]).then(() => c.sfx("pop"));
        await Promise.all([rol(pilka, 1.3, true), rol(klocek, 2.0), rol(mis, 2.9)]);
        await c.ujecie("zblizenie", { na: "kret" });
        await c.emocja("kret", "radosc", { anim: "Podskok" });
        await c.say("kret", "line.h_mis_wygral");
        await c.ujecie("dwuujecie", { na: ["kret", "bobr"] });
        await c.wonder("bobr");
        await c.say("bobr", "line.h_znowu");
        await c.say("kret", "line.h_ojej", { anim: "Kiwanie" });
        // 1. which toy came first?
        await c.ujecie("ogolny");
        await c.say("bobr", "line.h_kto_pierwszy");
        dobre(pilka); await c.task({ targets: it, correct: pilka, wrong: "line.h_kto_pierwszy_nie" }); dobre(pilka, false);
        await c.ujecie("sredni", { na: ["sowa", ...it] });
        await c.say("sowa", "line.h_pilka", { anim: "Zgloszenie" });
        // 2. the paper medals onto the winners: the toys line up side by side, the medals wait over them
        await c.ujecie("ogolny");
        const kolej = [pilka, klocek, mis];
        await Promise.all(kolej.map((h, i) => { h.icon.rotation.z = 0; return h.moveTo(-1.2 + i * 1.6, -2.2, 0.5); }));
        const md = []; for (const [i, n] of tasuj(["medal_zloty", "medal_srebrny", "medal_brazowy"]).entries()) { const m = await c.object(n, { x: -1.8 + i * 1.8, y: 1.5, size: 0.8 }); m.tag = String(["medal_zloty", "medal_srebrny", "medal_brazowy"].indexOf(n) + 1); md.push(m); }
        await c.say("kret", "line.h_medale", { anim: "Wskazanie" });
        const zab = [];
        for (const [i, h] of kolej.entries()) { const b = c.bounds(h); const z = await c.zone({ x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2, w: 1.4, h: Math.max(1.2, b.top - b.bottom), name: `zabawka_${i}`, niewidoczna: true }); z.want = String(i + 1); zab.push(z); }
        await c.sort({ items: md, zones: zab, wrong: "line.h_medale_nie" });
        for (const [i, h] of kolej.entries()) {                             // each medal settles on its toy's front, a little smaller
          const m = md.find((x) => x.tag === String(i + 1)), b = c.bounds(h); m.mesh.position.z = h.mesh.position.z + 0.05;
          m.moveTo((b.left + b.right) / 2, b.bottom + (b.top - b.bottom) * 0.35, 0.3); m.base = 0.68; m.mesh.scale.setScalar(m.base);
        }
        await c.wait(0.4);
        await c.ujecie("sredni", { na: ["kret", ...kolej] });
        await c.say("kret", "line.h_medale_ok", { anim: "Brawo" });
        // the payoff, seen: the toys' ceremony on a podium of books
        const il = await c.ilustracja("medale_zabawek", { ruch: "najazd" });
        await c.say("bobr", "line.h_ceremonia", { anim: "Radosc" });
        await il.zsun();
        // 3. Beaver's photos of the forest race got mixed up: in order, on a plain colour
        await c.ujecie("dwuujecie", { na: ["sowa", "bobr"] });
        await c.say("bobr", "line.h_zdjecia", { anim: "Smutek" });
        await c.go({ kolor: "#eef0dc", motyw: "kola" }, { ciecie: true });
        await c.ujecie("ogolny");
        await c.say("sowa", "line.h_zdjecia_uloz");
        const h = await c.historyjka("wyscig_lesny", { size: 1.6, wrong: "line.h_zdjecia_nie" });
        await c.ujecie("sredni", { na: ["bobr", ...h.karty] });
        await c.say("bobr", "line.h_zdjecia_ok", { anim: "Radosc" });
        h.remove();
        // 4. the home race, shown in play: Mole and Beaver race to the window, the child judges
        await c.go("pokoj", { ciecie: true });
        await c.ujecie("ogolny");
        await c.say("kret", "line.h_gra", { anim: "Podskok" });
        const kolejnosc = [], start = tasuj(["kret", "bobr"]);
        await Promise.all(start.map((n, i) => (async () => { await c.wait(i * 0.5); await c.walkTo(n, { kret: -0.8, bobr: 0.8 }[n]); kolejnosc.push(n); })()));
        const cele = ["kret", "bobr"].map((n) => S.puppets[n]), wygral = S.puppets[kolejnosc[0]];
        await c.say("sowa", "line.h_gra_kto");
        dobre(cele, false); dobre(wygral); await c.task({ targets: cele, correct: wygral, wrong: "line.h_gra_nie" }); dobre(cele, false);
        await c.ujecie("zblizenie", { na: kolejnosc[0] });
        await c.say(kolejnosc[0], `line.h_gra_${kolejnosc[0]}`, { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["kret", "bobr"] });            // the home game, said to the parents
        await c.say("kret", "line.h_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
