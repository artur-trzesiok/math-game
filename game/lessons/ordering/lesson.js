// Lesson: in order (seriation) - things put in order by size, the biggest to the smallest and back, and why the order
// matters. One thread: tonight Beaver's forest concert. A lantern tower stands only in order (Bunny in a hurry piles the
// blocks anyhow - it falls); Beaver's old map shows where the path crosses the brook, and stepping stones from the
// lowest take Owl's owlets across; at the glade the owlet choir lines up from the smallest - and sings a falling tune;
// Bunny swaps two and the choir sings wrong. Practice: five different games. At home: Beaver's water-glass xylophone,
// put in order it plays a rising scale. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wPorzadku = (a) => a.every((v, i) => !i || v > a[i - 1]) || a.every((v, i) => !i || v < a[i - 1]);
const GROUND = -3.3, BRZEG = 2.05;                 // the brook's far bank in the strumyk plate (the water lies between y -0.5 and 2)
const KOLORY = ["#e8604c", "#f5c341", "#58bd68", "#3f8ce0"];
const pomieszane = (n) => { let m = tasuj([...Array(n).keys()]); while (wPorzadku(m)) m = tasuj(m); return m; };

// a row of places for things at growing sizes; `rosnaco`: the smallest goes first (on the left). The things lie mixed on
// the floor (never already in order); a thing fits only its own place; an arrow marks the first place. `nazwy`: one
// sticker per rank instead of one sticker at several sizes (the glasses)
async function szereg(c, nazwa, rozmiary, { rosnaco = true, y = 1.35, yRzeczy = -2.35, x0 = -2.6, krok = 1.75, wrong = "line.zla_kolejnosc", nazwy = null } = {}) {
  const kolej = rozmiary.map((r, i) => i).sort((a, b) => (rosnaco ? rozmiary[a] - rozmiary[b] : rozmiary[b] - rozmiary[a]));
  const miejsca = pomieszane(rozmiary.length);
  const items = [];
  for (const [i, r] of rozmiary.entries()) { const h = await c.object(nazwy ? nazwy[i] : nazwa, { x: x0 + miejsca[i] * krok, y: yRzeczy, size: r }); h.ranga = kolej.indexOf(i); items.push(h); }
  const maks = Math.max(...rozmiary);
  const slots = kolej.map((_, k) => ({ x: x0 + k * krok, y, w: krok * 0.92, h: maks * 1.05, accept: (it) => it.ranga === k }));
  const t = await c.slots({ items, slots, wrong });
  const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
  return { t, strzalka, items };
}
const wRzedzie = (items) => items.slice().sort((a, b) => a.mesh.position.x - b.mesh.position.x);

export default {
  id: "ordering",
  przejscia: true,
  nagrody: true,
  characters: { bobr: { side: "left", x: -4.8 }, zajac: { side: "right", x: 2.6 }, sowa: { side: "right", x: 4.8 } },
  backgrounds: { story: "strumyk", practice: { kolor: "#e5f0fb", motyw: "figury" }, apply: "pokoj_noc" },
  stages: {
    story: [
      // A. the brook: tonight a concert; a tower for the lantern - Bunny piles the blocks anyhow and it falls; in order it stands
      async (c) => {
        await c.enter("bobr");
        await c.ujecie("sredni", { na: ["bobr"] });
        await c.say("bobr", "line.a_koncert", { anim: "Radosc" });
        await c.say("bobr", "line.a_latarnia", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.a_ogon", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await c.enter("zajac");
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("zajac", "line.a_szybko", { anim: "Podskok" });
        await c.ujecie("ogolny");
        // the naive try, played: the small block down first, the big one on top - it tips and falls
        const maly = c.shape("prostokat", { x: 0.4, y: -3.0, size: 0.9, color: KOLORY[3] });
        await c.wait(0.4);
        const duzy = c.shape("prostokat", { x: -2.4, y: 0.6, size: 1.8, color: KOLORY[0] });
        await duzy.moveTo(0.4, -2.15, 0.5);
        c.sfx("wrong"); await duzy.rotateTo(-30, 0.35);
        await duzy.moveTo(1.7, -2.9, 0.4); c.sfx("plop");
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.emocja("zajac", "smutek", { anim: "Smutek" });
        await c.say("zajac", "line.a_spadla");
        maly.remove(); duzy.remove();
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("bobr", "line.a_po_kolei", { anim: "Zgloszenie" });
        await c.say("zajac", "line.a_jak");
        await c.ujecie("ogolny");
        // the child builds it: four blocks, a wrong one tips off; the line on the ground first, then the instruction names it
        const w = c.wieza({ klocki: [{ w: 2.6, h: 0.6, x: -2.6, y: 1.5 }, { w: 1.9, h: 0.6, x: 2.4, y: 1.2 }, { w: 1.3, h: 0.6, x: -0.4, y: 1.9 }, { w: 0.8, h: 0.6, x: 1.0, y: -0.2 }].map((k, i) => ({ ...k, kolor: KOLORY[i] })), miejsca: [{ x: 0.2 }] });
        await c.say("bobr", "line.a_od_najwiekszego");
        await w.gotowe;
        await c.say("zajac", "line.a_stoi", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["bobr", ...w.klocki] });
        await c.say("bobr", "line.a_dlaczego");
        // the lantern goes up on top and lights
        const lampa = await c.object("latarenka_swieci", { x: 0.2, y: -3.28 + 2.4 + 0.55, size: 1.0 });
        await c.rozblysk(lampa);
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_latarenka", { anim: "Brawo" });
        await c.ujecie("ogolny");
        c.clear();
      },
      // B. the map: where the path crosses the brook the stones go; stepping stones from the lowest take the owlets across
      async (c) => {
        const S = c.stage;
        await c.ujecie("sredni", { na: ["bobr"] });
        await c.say("bobr", "line.b_mapa", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const mapa = await c.znalezisko("mapa_polany", { skad: "bobr" });
        await c.say("zajac", "line.b_mapa_gdzie");
        dobre(mapa.cele); await c.task({ targets: [...mapa.cele, mapa.tlo], correct: mapa.cele[0], wrong: "line.b_mapa_nie" }); dobre(mapa.cele, false);
        await mapa.zaznacz();
        await c.say("bobr", "line.b_mapa_tu", { anim: "Radosc" });
        await mapa.remove();
        // Owl comes with her owlets: they cannot fly yet
        c.show("sowa");
        // the owlets wait on the far bank (higher up the picture is further away: smaller), nobody stands in front of them
        const sowiatka = [];
        for (const [i, r] of [0.45, 0.52, 0.6].entries()) sowiatka.push(await c.object("sowiatko", { x: 0.9 + i * 0.55, y: BRZEG + r * 0.45, size: r }));
        await c.ujecie("sredni", { na: ["sowa", ...sowiatka] });
        await c.emocja("sowa", "pot", { anim: "Smutek" });
        await c.say("sowa", "line.b_sowa");
        await c.ujecie("ogolny");
        await c.say("bobr", "line.b_schodki");
        // the stones go into the water on a slant from the owlets to our bank, the lowest by the owlets (the arrow)
        const rozmiary = [0.75, 1.05, 1.35], przejscie = [[0.3, 1.35], [-1.0, 0.55], [-2.4, -0.25]];   // in the water, from the far bank towards us
        const miejsca = pomieszane(3), kamienie = [];
        for (const [i, r] of rozmiary.entries()) { const h = await c.object("kamien_schodek", { x: -1.9 + miejsca[i] * 1.55, y: -2.3, size: r }); h.ranga = i; kamienie.push(h); }   // on our grass, between Beaver and Bunny
        const t = await c.slots({ items: kamienie, slots: przejscie.map(([x, y], k) => ({ x, y, w: rozmiary[k] * 1.1, h: rozmiary[k] * 0.9, accept: (it) => it.ranga === k })), wrong: "line.zla_kolejnosc" });
        const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
        await c.say("zajac", "line.b_od_najnizszego");
        await t.done(); strzalka.remove();
        await c.say("bobr", "line.b_schodki_ok", { anim: "Radosc" });
        // the owlets hop across, stone after stone, the lowest first, onto our bank by Beaver
        const po = kamienie.slice().sort((a, b) => a.ranga - b.ranga);
        for (const [j, o] of sowiatka.entries()) {
          for (const k of po) { const b = c.bounds(k); c.sfx("hop"); await o.moveTo(k.mesh.position.x, b.top + 0.3, 0.22); }
          const s0 = o.base, s1 = s0 * 1.7;                                   // near us now: as big as near things are
          c.sfx("hop"); await Promise.all([o.moveTo(-3.4 + j * 0.85, GROUND + s1 * 0.45, 0.25), c.stage.tween(0.25, (s) => o.mesh.scale.setScalar(s0 + (s1 - s0) * s))]);
          o.base = s1;
        }
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.emocja("sowa", "serce", { anim: "Radosc" });
        await c.say("sowa", "line.b_przeszly");
        await c.ujecie("ogolny");
        await c.say("bobr", "line.b_w_droge", { anim: "Zgloszenie" });
        c.clear(); S.puppets.sowa.korzen.visible = false;
      },
      // C. the glade: the owlet choir lines up in order and sings; Bunny swaps two and it sounds wrong
      async (c) => {
        await c.go("polana_koncert", { enter: true });
        c.show("sowa");
        await Promise.all(["bobr", "zajac"].map((n) => c.enter(n)));
        await c.rozblysk("zajac");
        await c.say("zajac", "line.c_polana", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.c_proba", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const { t, strzalka, items } = await szereg(c, "sowiatko", [0.75, 1.05, 1.35], { y: 0.9, x0: -1.9, krok: 1.9 });
        await c.say("zajac", "line.c_ustaw");
        await t.done(); strzalka.remove();
        // the choir sings: a short wordless owl song (ElevenLabs), the owlets bobbing along; out of order it goes sour
        const spiewaj = async (dobrze = true) => { c.sfx(dobrze ? "chor_sowiatek" : "chor_falsz"); const rz = wRzedzie(items); await c.rytm([...rz, ...rz], { tempo: 0.62, kiwaja: ["sowa"], bezDzwieku: true }); };
        await spiewaj();
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.c_spiewaja", { anim: "Brawo" });
        // Bunny's prank: two neighbours swap places
        await c.ujecie("sredni", { na: ["zajac", ...items] });
        await c.say("zajac", "line.c_psikus", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const rz = wRzedzie(items), k = Math.random() < 0.5 ? 0 : 1, a = rz[k], b = rz[k + 1];
        const [ax, bx] = [a.mesh.position.x, b.mesh.position.x];
        c.sfx("whoosh"); await Promise.all([a.moveTo(bx, a.mesh.position.y, 0.5), b.moveTo(ax, b.mesh.position.y, 0.5)]);
        await spiewaj(false);
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.emocja("bobr", "pot");
        await c.ujecie("ogolny");
        await c.say("bobr", "line.c_falsz");
        dobre([a, b]); await c.task({ targets: items, correct: [a, b], wrong: "line.c_falsz_nie" }); dobre(items, false);
        c.sfx("whoosh"); await Promise.all([a.moveTo(ax, a.mesh.position.y, 0.5), b.moveTo(bx, b.mesh.position.y, 0.5)]);
        await spiewaj();
        await c.ujecie("sredni", { na: ["sowa", ...items] });
        await c.say("sowa", "line.c_znowu", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.c_przepraszam", { anim: "Smutek" });
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("bobr", "line.c_instrument", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("bobr"); c.show("zajac");
        S.puppets.bobr.korzen.position.x = -5.3; S.puppets.zajac.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("bobr", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const brawo = async (kto) => { await c.ujecie("zblizenie", { na: kto }); await c.say(kto, "line.p_dobrze", { anim: "Radosc" }); await c.ujecie("ogolny"); };
        // 1. cups from the smallest
        { const { t, strzalka } = await szereg(c, "kubek_skladany", [0.8, 1.15, 1.5]); await c.say("zajac", "line.p_kubki"); await t.done(); strzalka.remove(); await brawo("bobr"); gw.dodaj(); c.clear(); }
        // 2. carrots from the biggest
        { const { t, strzalka } = await szereg(c, "marchewka", [0.8, 1.15, 1.5], { rosnaco: false }); await c.say("bobr", "line.p_marchewki"); await t.done(); strzalka.remove(); await brawo("zajac"); gw.dodaj(); c.clear(); }
        // 3. the missing one: a growing row with a gap
        {
          const r = [0.7, 0.95, null, 1.45], rzad = [];
          for (const [i, s] of r.entries()) if (s) rzad.push(await c.object("jablko", { x: -3.0 + i * 1.9, y: 1.4, size: s }));
          const luka = await c.zone({ x: -3.0 + 2 * 1.9, y: 1.4, w: 1.4, h: 1.4, name: "luka" });
          await c.ujecie("sredni", { na: [...rzad, luka] });
          const opcje = [];
          for (const [i, s] of tasuj([0.55, 1.2, 1.7]).entries()) { const h = await c.object("jablko", { x: -1.9 + i * 1.9, y: -2.2, size: s }); h.s = s; opcje.push(h); }
          await c.say("zajac", "line.p_luka");
          await c.ujecie("ogolny");
          const ok = opcje.find((h) => h.s === 1.2);
          dobre(ok); await c.task({ targets: opcje, correct: ok, wrong: "line.p_luka_nie" });
          await ok.moveTo(luka.x, luka.y, 0.4); luka.remove();
          await c.ujecie("sredni", { na: [...rzad, ok] });
          await c.say("bobr", "line.p_luka_ok"); await c.ujecie("ogolny"); gw.dodaj(); c.clear();
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
          await c.ujecie("sredni", { na: ok });
          await c.say("zajac", "line.p_ktory_rzad_ok"); await c.ujecie("ogolny"); gw.dodaj(); c.clear();
        }
        // 5. a tower of three
        {
          const w = c.wieza({ klocki: [{ w: 2.2, h: 0.6, x: -2.4, y: 1.4 }, { w: 1.5, h: 0.6, x: 2.2, y: 1.6 }, { w: 0.9, h: 0.6, x: 0, y: 2.0 }].map((k, i) => ({ ...k, kolor: KOLORY[i] })), miejsca: [{ x: 0 }] });
          await c.say("zajac", "line.p_wieza");                         // after the line on the ground is drawn: it names it
          await w.gotowe;
          await c.ujecie("zblizenie", { na: "bobr" });
          await c.say("bobr", "line.p_wieza_ok", { anim: "Brawo" }); await c.ujecie("ogolny"); gw.dodaj(); c.clear();
        }
        await c.praise("bobr");
      },
    ],
    apply: [
      // home in the evening: Beaver's water-glass xylophone - tapped, put in order, played
      async (c) => {
        for (const n of ["bobr", "zajac"]) c.show(n);
        const N = ["szklanka_1", "szklanka_2", "szklanka_3", "szklanka_4"];     // 1 = the most water = the lowest note
        const miejsca = pomieszane(4), szklanki = [];
        for (const [i, n] of N.entries()) { const h = await c.object(n, { x: -2.7 + miejsca[i] * 1.8, y: -2.3, size: 1.5, dzwiek: `szklo_${i + 1}` }); h.ranga = i; szklanki.push(h); }
        await c.ujecie("sredni", { na: ["bobr", ...szklanki] });
        await c.say("bobr", "line.d_szklanki", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        dobre(szklanki); await c.task({ targets: szklanki, correct: szklanki, wszystkie: true }); dobre(szklanki, false);
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.d_rozne", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const slots = N.map((_, k) => ({ x: -2.7 + k * 1.8, y: 1.3, w: 1.6, h: 1.65, accept: (it) => it.ranga === k }));
        const t = await c.slots({ items: szklanki, slots, wrong: "line.zla_kolejnosc" });
        const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
        await c.say("bobr", "line.d_uloz");
        await t.done(); strzalka.remove();
        const rzad = wRzedzie(szklanki);
        await c.rytm(rzad, { tempo: 0.6, kiwaja: ["bobr", "zajac"] });
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.d_gama", { anim: "Brawo" });
        await c.ujecie("ogolny");
        // the child plays it: glass after glass, in order
        await c.say("bobr", "line.d_zagraj");
        for (const h of rzad) { dobre(h); await c.task({ targets: rzad, correct: h, wrong: "line.d_zagraj_nie" }); dobre(h, false); }
        await c.rytm(rzad, { tempo: 0.45, kiwaja: ["bobr", "zajac"] });
        await c.konfetti();
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("zajac", "line.d_brawo", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.d_rodzice_szklanki");
        await c.ujecie("ogolny");
      },
    ],
  },
};
