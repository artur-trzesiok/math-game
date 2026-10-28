// Lesson: in order (seriation) - things put in order, the biggest to the smallest and back, and why the order matters:
// Beaver's lookout tower stands only when the blocks go biggest at the bottom (Bunny in a hurry piles them anyhow - it
// falls). Stepping stones from the lowest to the highest; Owl's owlets into nesting boxes by size; a race. Practice:
// five different games. At home: the toys on the shelf. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wPorzadku = (a) => a.every((v, i) => !i || v > a[i - 1]) || a.every((v, i) => !i || v < a[i - 1]);
const KOLORY = ["#e8604c", "#f5c341", "#58bd68", "#3f8ce0"];

// a row of places for things of one kind at growing sizes; `rosnaco`: the smallest goes first (on the left). The things
// lie mixed on the floor (never already in order); a thing fits only its own place; an arrow marks the first place.
async function szereg(c, nazwa, rozmiary, { rosnaco = true, y = 1.35, yRzeczy = -2.35, x0 = -2.6, krok = 1.75, wrong = "line.zla_kolejnosc" } = {}) {
  const kolej = rozmiary.map((r, i) => i).sort((a, b) => (rosnaco ? rozmiary[a] - rozmiary[b] : rozmiary[b] - rozmiary[a]));
  let miejsca = tasuj(rozmiary.map((_, i) => i)); while (wPorzadku(miejsca)) miejsca = tasuj(miejsca);
  const items = [];
  for (const [i, r] of rozmiary.entries()) { const h = await c.object(nazwa, { x: x0 + miejsca[i] * krok, y: yRzeczy, size: r }); h.ranga = kolej.indexOf(i); items.push(h); }
  const maks = Math.max(...rozmiary);
  const slots = kolej.map((_, k) => ({ x: x0 + k * krok, y, w: krok * 0.92, h: maks * 1.05, accept: (it) => it.ranga === k }));
  const t = await c.slots({ items, slots, wrong });
  const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
  return { t, strzalka };
}

export default {
  id: "ordering",
  przejscia: true,
  nagrody: true,
  characters: { bobr: { side: "left", x: -4.8 }, zajac: { side: "right", x: 2.6 }, sowa: { side: "right", x: 4.8 } },
  backgrounds: { story: "strumyk", practice: { kolor: "#e5f0fb", motyw: "figury" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the brook: Beaver builds a lookout tower; Bunny piles the blocks anyhow - it falls; in order, it stands
      async (c) => {
        const S = c.stage;
        await c.enter("bobr");
        await c.say("bobr", "line.a_wieza", { anim: "Zgloszenie" });
        await c.say("bobr", "line.a_ogon", { anim: "Radosc" });
        await c.enter("zajac");
        await c.say("zajac", "line.a_szybko", { anim: "Podskok" });
        // the naive try, played: the small block down first, the big one on top - it tips and falls
        const maly = c.shape("prostokat", { x: 0.4, y: -3.0, size: 0.9, color: KOLORY[3] });
        await c.wait(0.4);
        const duzy = c.shape("prostokat", { x: -2.4, y: 0.6, size: 1.8, color: KOLORY[0] });
        await duzy.moveTo(0.4, -2.15, 0.5);
        c.sfx("wrong"); await duzy.rotateTo(-30, 0.35);
        await duzy.moveTo(1.7, -2.9, 0.4); c.sfx("plop");
        await c.emocja("zajac", "smutek", { anim: "Smutek" });
        await c.say("zajac", "line.a_spadla");
        maly.remove(); duzy.remove();
        await c.say("bobr", "line.a_po_kolei", { anim: "Zgloszenie" });
        await c.say("zajac", "line.a_jak");
        await c.say("bobr", "line.a_od_najwiekszego");
        // the child builds it: four blocks, a wrong one tips off
        const w = c.wieza({ klocki: [{ w: 2.6, h: 0.6, x: -2.6, y: 1.5 }, { w: 1.9, h: 0.6, x: 2.4, y: 1.2 }, { w: 1.3, h: 0.6, x: -0.4, y: 1.9 }, { w: 0.8, h: 0.6, x: 1.0, y: -0.2 }].map((k, i) => ({ ...k, kolor: KOLORY[i] })), miejsca: [{ x: 0.2 }] });
        await w.gotowe;
        await c.say("zajac", "line.a_stoi", { anim: "Radosc" });
        await c.say("bobr", "line.a_dlaczego");
        c.clear();
      },
      // B. stepping stones to the water, the lowest first; then Owl's owlets and their boxes; a race
      async (c) => {
        await c.say("bobr", "line.b_schodki");
        const { t, strzalka } = await szereg(c, "kamien_schodek", [0.9, 1.3, 1.7]);
        await c.say("zajac", "line.b_od_najnizszego");
        await t.done(); strzalka.remove();
        await c.say("bobr", "line.b_schodki_ok", { anim: "Radosc" });
        c.clear();
        // Owl: her owlets mixed up the boxes - the biggest owlet into the biggest box
        c.show("sowa");
        await c.say("sowa", "line.b_sowiatka", { anim: "Smutek" });
        const rozmiary = [0.75, 1.05, 1.35];
        const budki = [];
        for (const [k, r] of rozmiary.entries()) budki.push(await c.object("budka", { x: -2.4 + k * 2.1, y: 1.55, size: r * 1.3 }));
        const items = [];
        const miejsca = tasuj([0, 1, 2]);
        for (const [i, r] of rozmiary.entries()) { const h = await c.object("sowiatko", { x: -2.4 + miejsca[i] * 2.1, y: -2.3, size: r }); h.ranga = i; items.push(h); }
        await c.say("zajac", "line.b_do_budek");
        const t2 = await c.slots({ items, slots: budki.map((b, k) => ({ x: b.mesh.position.x, y: b.mesh.position.y - 0.15, w: 1.6, h: rozmiary[k] * 1.3, accept: (it) => it.ranga === k })), wrong: "line.b_nie_ta_budka" });
        await t2.done();
        await c.emocja("sowa", "serce", { anim: "Radosc" });
        await c.say("sowa", "line.b_dziekuje");
        c.clear();
        await c.walkTo("sowa", 8.5); c.stage.puppets.sowa.korzen.visible = false;      // home to her owlets: the race is Bunny's and Beaver's
        // the breather: a race along the stones - Bunny hops quick, Beaver waddles; who came first?
        await c.say("zajac", "line.b_wyscig", { anim: "Podskok" });
        const os = await c.os({ od: 0, do: 6, cyfry: false, x0: -3.6, x1: 3.6 });
        const S = c.stage;
        await Promise.all([os.skocz("zajac", 0, 6, { tempo: 0.4 }), (async () => { await c.wait(0.3); await os.skocz("bobr", 0, 4, { tempo: 0.8 }); })()]);
        await c.say("bobr", "line.b_kto_pierwszy");
        const cele = [S.puppets.zajac, S.puppets.bobr];
        dobre(cele, false); dobre(S.puppets.zajac); await c.task({ targets: cele, correct: S.puppets.zajac, wrong: "line.b_kto_pierwszy" }); dobre(cele, false);
        await c.say("zajac", "line.b_pierwszy", { anim: "Radosc" });
        await c.say("bobr", "line.b_do_domu");
        c.clear();
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("bobr"); c.show("zajac");
        S.puppets.bobr.korzen.position.x = -5.3; S.puppets.zajac.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("bobr", "line.p_start", { anim: "Radosc" });
        // 1. cups from the smallest
        { const { t, strzalka } = await szereg(c, "kubek_skladany", [0.8, 1.15, 1.5]); await c.say("zajac", "line.p_kubki"); await t.done(); strzalka.remove(); await c.say("bobr", "line.p_dobrze"); gw.dodaj(); c.clear(); }
        // 2. carrots from the biggest
        { const { t, strzalka } = await szereg(c, "marchewka", [0.8, 1.15, 1.5], { rosnaco: false }); await c.say("bobr", "line.p_marchewki"); await t.done(); strzalka.remove(); await c.say("zajac", "line.p_dobrze"); gw.dodaj(); c.clear(); }
        // 3. the missing one: a growing row with a gap
        {
          const r = [0.7, 0.95, null, 1.45], rzad = [];
          for (const [i, s] of r.entries()) if (s) rzad.push(await c.object("jablko", { x: -3.0 + i * 1.9, y: 1.4, size: s }));
          const luka = await c.zone({ x: -3.0 + 2 * 1.9, y: 1.4, w: 1.4, h: 1.4, name: "luka" });
          const opcje = [];
          for (const [i, s] of tasuj([0.55, 1.2, 1.7]).entries()) { const h = await c.object("jablko", { x: -1.9 + i * 1.9, y: -2.2, size: s }); h.s = s; opcje.push(h); }
          await c.say("zajac", "line.p_luka");
          const ok = opcje.find((h) => h.s === 1.2);
          dobre(ok); await c.task({ targets: opcje, correct: ok, wrong: "line.p_luka_nie" });
          await ok.moveTo(luka.x, luka.y, 0.4); luka.remove();
          await c.say("bobr", "line.p_luka_ok"); gw.dodaj(); c.clear();
        }
        // 4. which row is in order?
        {
          const dobryGora = Math.random() < 0.5, rzedy = [[0.6, 0.9, 1.2, 1.5], tasuj([0.6, 0.9, 1.2, 1.5])];
          while (wPorzadku(rzedy[1])) rzedy[1] = tasuj(rzedy[1]);
          const hs = [[], []];
          for (const [k, rz] of (dobryGora ? rzedy : [rzedy[1], rzedy[0]]).entries()) for (const [i, s] of rz.entries()) hs[k].push(await c.object("listek", { x: -2.4 + i * 1.6, y: k ? -1.6 : 1.4, size: s }));
          const ok = dobryGora ? hs[0] : hs[1];
          await c.say("bobr", "line.p_ktory_rzad");
          dobre(ok); await c.task({ targets: [...hs[0], ...hs[1]], correct: ok, wrong: "line.p_ktory_rzad_nie" });
          await c.say("zajac", "line.p_ktory_rzad_ok"); gw.dodaj(); c.clear();
        }
        // 5. a tower of three
        {
          await c.say("zajac", "line.p_wieza");
          const w = c.wieza({ klocki: [{ w: 2.2, h: 0.6, x: -2.4, y: 1.4 }, { w: 1.5, h: 0.6, x: 2.2, y: 1.6 }, { w: 0.9, h: 0.6, x: 0, y: 2.0 }].map((k, i) => ({ ...k, kolor: KOLORY[i] })), miejsca: [{ x: 0 }] });
          await w.gotowe; await c.say("bobr", "line.p_wieza_ok"); gw.dodaj(); c.clear();
        }
        await c.praise("bobr");
      },
    ],
    apply: [
      // home: the teddies on the shelf, from the biggest
      async (c) => {
        for (const n of ["bobr", "zajac"]) c.show(n);
        await c.say("zajac", "line.d_polka", { anim: "Zgloszenie" });
        const { t, strzalka } = await szereg(c, "misiu", [0.8, 1.15, 1.5], { rosnaco: false, y: 1.6 });
        await c.say("bobr", "line.d_od_najwiekszego");
        await t.done(); strzalka.remove();
        await c.say("zajac", "line.d_porzadek", { anim: "Radosc" });
        await c.say("bobr", "line.d_rodzice");
      },
    ],
  },
};
