// Lesson: in order (seriation) - things put in order by size, the biggest to the smallest and back, and why the order
// matters. One thread: tonight Beaver's forest concert. A lantern tower stands only in order (Bunny in a hurry piles the
// blocks anyhow - it falls); the fireflies light its lantern, joined from the smallest; Beaver's old map shows where the
// path crosses the brook, and stepping stones from the lowest take Owl's owlets across; at the glade the owlet choir
// lines up from the smallest and sings; Bunny swaps two and the choir sings wrong; the evening sky painted with light.
// Practice: five different games. At home: Beaver's water-glass xylophone - Bunny plays it as it stands (a mess), in
// order on the rug it plays a rising scale; then the concert, seen. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wPorzadku = (a) => a.every((v, i) => !i || v > a[i - 1]) || a.every((v, i) => !i || v < a[i - 1]);
const GROUND = -3.3, BRZEG = 2.05;                 // the brook's far bank in the strumyk plate (the water lies between y -0.5 and 2)
const KOLORY = ["#e8604c", "#f5c341", "#58bd68", "#3f8ce0"];
const pomieszane = (n) => { let m = tasuj([...Array(n).keys()]); while (wPorzadku(m)) m = tasuj(m); return m; };
const SZKLANKI = ["szklanka_1", "szklanka_2", "szklanka_3", "szklanka_4"];      // 1 = the most water = the lowest note
const WODA = [0.19, 0.25, 0.44, 0.58];                                          // the water's top in each glass sticker (from its top)

// a row of places for things at growing sizes; `rosnaco`: the smallest goes first (on the left). The things lie mixed on
// the floor (never already in order); a thing fits only its own place; an arrow marks the first place
async function szereg(c, nazwa, rozmiary, { rosnaco = true, y = 1.35, yRzeczy = -2.35, x0 = -2.6, krok = 1.75, wrong = "line.zla_kolejnosc" } = {}) {
  const kolej = rozmiary.map((r, i) => i).sort((a, b) => (rosnaco ? rozmiary[a] - rozmiary[b] : rozmiary[b] - rozmiary[a]));
  const miejsca = pomieszane(rozmiary.length);
  const items = [];
  for (const [i, r] of rozmiary.entries()) { const h = await c.object(nazwa, { x: x0 + miejsca[i] * krok, y: yRzeczy, size: r }); h.ranga = kolej.indexOf(i); items.push(h); }
  const maks = Math.max(...rozmiary);
  const slots = kolej.map((_, k) => ({ x: x0 + k * krok, y, w: krok * 0.92, h: maks * 1.05, accept: (it) => it.ranga === k }));
  const t = await c.slots({ items, slots, wrong });
  const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
  return { t, strzalka, items };
}
const wRzedzie = (items) => items.slice().sort((a, b) => a.mesh.position.x - b.mesh.position.x);
// Beaver's glasses on the floor in front, never in order; each sounds its own note when pointed at
async function szklanki(c, miejsca, { x0 = -3.0, krok = 1.6, y = -3.05, size = 1.2 } = {}) {
  const out = [];
  for (const [i, n] of SZKLANKI.entries()) { const h = await c.object(n, { x: x0 + miejsca[i] * krok, y, size, dzwiek: `szklo_${i + 1}` }); h.ranga = i; out.push(h); }
  return out;
}
// the water's tops of a row of glasses as one pencil line: a flat step over each glass, down from step to step
function schodkiWody(c, rzad) {
  const pts = [];
  for (const h of rzad) {
    const b = c.bounds(h), gh = (b.top - b.bottom) / 0.97, sr = (b.top + b.bottom) / 2, y = sr + (0.5 - WODA[h.ranga]) * gh, pol = (b.right - b.left) * 0.36;
    pts.push([b.x - pol, y], [b.x + pol, y]);
  }
  return c.line(pts, { color: "#e8502e", width: 0.09, strong: true });
}

export default {
  id: "ordering",
  przejscia: true,
  nagrody: true,
  characters: { bobr: { side: "left", x: -4.8 }, zajac: { side: "right", x: 2.6 }, sowa: { side: "right", x: 4.8 } },
  backgrounds: { story: "strumyk", practice: { kolor: "#e5f0fb", motyw: "figury" }, apply: "pokoj_noc" },
  stages: {
    story: [
      // A. the brook: tonight a concert; a tower for the lantern - Bunny piles the blocks anyhow and it falls; the method
      // on an insert; in order it stands; the fireflies light the lantern, joined from the smallest
      async (c) => {
        await c.enter("bobr");
        await c.ujecie("sredni", { na: ["bobr"] });
        await c.say("bobr", "line.a_koncert", { anim: "Radosc" });
        await c.say("bobr", "line.a_latarnia", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "bobr" });                         // his joke, his face
        await c.say("bobr", "line.a_ogon", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // Bunny runs in
        await c.enter("zajac");
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("zajac", "line.a_szybko", { anim: "Podskok" });
        await c.ujecie("ogolny");                                            // the naive try moves across the screen
        const maly = c.shape("prostokat", { x: 0.4, y: -3.0, size: 0.9, color: KOLORY[3] });
        await c.wait(0.4);
        const duzy = c.shape("prostokat", { x: -2.4, y: 0.6, size: 1.8, color: KOLORY[0] });
        await duzy.moveTo(0.4, -2.15, 0.5);
        c.sfx("wrong"); await duzy.rotateTo(-30, 0.35);
        await duzy.moveTo(1.7, -2.9, 0.4); c.sfx("plop");
        await c.ujecie("zblizenie", { na: "zajac" });                        // the fall, his dismay
        await c.emocja("zajac", "smutek", { anim: "Smutek" });
        await c.say("zajac", "line.a_spadla");
        maly.remove(); duzy.remove();
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("bobr", "line.a_po_kolei", { anim: "Zgloszenie" });
        await c.say("zajac", "line.a_jak");
        // the method on a plain colour: the four blocks side by side, each named as it bumps
        await c.go({ kolor: "#f4e7cc", motyw: "figury" }, { ciecie: true });
        const bloki = [];
        for (const [i, s] of [1.5, 1.15, 0.85, 0.6].entries()) bloki.push(c.shape("prostokat", { x: -2.0 + i * 1.5, y: 1.2, size: s, color: KOLORY[i] }));
        await c.wait(0.3);
        let x = -4.6;                                                       // side by side by their drawn widths, on one line over the heads
        for (const b of bloki) { const g = c.bounds(b), w = g.right - g.left; b.moveTo(x + w / 2, b.mesh.position.y, 0.3); x += w + 0.75; }
        await c.wait(0.35);
        await c.standOn(bloki, 0.6, 0.3);
        await c.ujecie("sredni", { na: ["bobr", ...bloki] });
        const mowa = c.say("bobr", "line.a_metoda", { anim: "Wskazanie" });
        for (const b of bloki) { await c.wait(c.fast ? 0.1 : 1.2); c.stage.bump(b, 0.35); }
        await mowa;
        // back at the brook: the child builds it; the line on the ground first, then the instruction names it
        await c.go("strumyk", { ciecie: true });
        await c.ujecie("ogolny");
        const w = c.wieza({ klocki: [{ w: 2.6, h: 0.6, x: -2.6, y: 1.5 }, { w: 1.9, h: 0.6, x: 2.4, y: 1.2 }, { w: 1.3, h: 0.6, x: -0.4, y: 1.9 }, { w: 0.8, h: 0.6, x: 1.0, y: -0.2 }].map((k, i) => ({ ...k, kolor: KOLORY[i] })), miejsca: [{ x: 0.2 }] });
        await c.say("bobr", "line.a_od_najwiekszego");
        await w.gotowe;
        await c.say("zajac", "line.a_stoi", { anim: "Radosc" });
        // an empty jar goes on top
        const sloik = await c.object("latarenka", { x: 0.2, y: -3.28 + 2.4 + 0.55, size: 1.0 });
        await c.ujecie("sredni", { na: ["bobr", sloik, ...w.klocki] });
        await c.say("bobr", "line.a_dlaczego");
        await c.say("bobr", "line.a_sloik", { anim: "Zgloszenie" });
        // the fireflies, joined from the smallest: the card flies up over the wide scene
        await c.ujecie("ogolny");
        await c.say("zajac", "line.a_swietliki", { anim: "Podskok" });
        const k = await c.kropki("latarenka_swietlikow", { znaki: "wielkosc" });
        await c.say("bobr", "line.a_swietliki_ok", { anim: "Radosc" });
        await k.remove();
        sloik.remove();
        const lampa = await c.object("latarenka_swieci", { x: 0.2, y: -3.28 + 2.4 + 0.55, size: 1.0 });
        await c.rozblysk(lampa);
        await c.ujecie("zblizenie", { na: "zajac" });                        // his joy
        await c.say("zajac", "line.a_latarenka", { anim: "Brawo" });
        c.clear();
      },
      // B. the map: where the path crosses the brook the stones go; stepping stones from the lowest take the owlets across
      async (c) => {
        const S = c.stage;
        await c.ujecie("sredni", { na: ["bobr"] });
        await c.say("bobr", "line.b_mapa", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the map flies up over the wide shot
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
        await c.ujecie("ogolny");                                            // the stones come in: the task is wide
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
        await c.ujecie("zblizenie", { na: "sowa" });                         // her thank-you
        await c.emocja("sowa", "serce", { anim: "Radosc" });
        await c.say("sowa", "line.b_przeszly");
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("bobr", "line.b_w_droge", { anim: "Zgloszenie" });
        c.clear(); S.puppets.sowa.korzen.visible = false;
      },
      // C. the glade: the owlet choir lines up in order and sings; Bunny swaps two and it sounds wrong; the sun sets -
      // the breather: light painted on the evening sky
      async (c) => {
        await c.go("polana_koncert", { enter: true });
        c.show("sowa");
        await Promise.all(["bobr", "zajac"].map((n) => c.enter(n)));
        await c.rozblysk("zajac");
        await c.say("zajac", "line.c_polana", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.c_proba", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the owlets and their places: the task
        const { t, strzalka, items } = await szereg(c, "sowiatko", [0.75, 1.05, 1.35], { y: 0.9, x0: -1.9, krok: 1.9 });
        await c.say("zajac", "line.c_ustaw");
        await t.done(); strzalka.remove();
        // the choir sings: a short wordless owl song (ElevenLabs), the owlets bobbing along; out of order it goes sour
        const spiewaj = async (dobrze = true) => { c.sfx(dobrze ? "chor_sowiatek" : "chor_falsz"); const rz = wRzedzie(items); await c.rytm([...rz, ...rz], { tempo: 0.62, kiwaja: ["sowa"], bezDzwieku: true }); };
        await spiewaj();
        await c.ujecie("zblizenie", { na: "sowa" });                         // a proud mother
        await c.say("sowa", "line.c_spiewaja", { anim: "Brawo" });
        // Bunny's prank: two neighbours swap places
        await c.ujecie("sredni", { na: ["zajac", ...items] });
        await c.say("zajac", "line.c_psikus", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const rz = wRzedzie(items), k = Math.random() < 0.5 ? 0 : 1, a = rz[k], b = rz[k + 1];
        const [ax, bx] = [a.mesh.position.x, b.mesh.position.x];
        c.sfx("whoosh"); await Promise.all([a.moveTo(bx, a.mesh.position.y, 0.5), b.moveTo(ax, b.mesh.position.y, 0.5)]);
        await spiewaj(false);
        await c.ujecie("zblizenie", { na: "bobr" });                         // Beaver winces
        await c.emocja("bobr", "pot");
        await c.ujecie("ogolny");                                            // the question: every owlet in the shot
        await c.say("bobr", "line.c_falsz");
        dobre([a, b]); await c.task({ targets: items, correct: [a, b], wrong: "line.c_falsz_nie" }); dobre(items, false);
        c.sfx("whoosh"); await Promise.all([a.moveTo(ax, a.mesh.position.y, 0.5), b.moveTo(bx, b.mesh.position.y, 0.5)]);
        await spiewaj();
        await c.ujecie("sredni", { na: ["sowa", ...items] });
        await c.say("sowa", "line.c_znowu", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "zajac" });                        // sorry
        await c.say("zajac", "line.c_przepraszam", { anim: "Smutek" });
        c.clear();
        // the breather: the sun goes down - paint light on the evening sky before the concert
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.c_zachod", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the night card lies over the wide scene
        await c.malowanie({ tlo: "noc", kto: "sowa" });
        c.czastki("swietliki", { gestosc: 0.5 });                           // the glade lights up
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("bobr", "line.c_instrument", { anim: "Zgloszenie" });
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
        // 1. cups from the smallest
        {
          await c.ujecie("ogolny");
          const { t, strzalka, items } = await szereg(c, "kubek_skladany", [0.8, 1.15, 1.5]);
          await c.say("zajac", "line.p_kubki"); await t.done(); strzalka.remove();
          await c.ujecie("sredni", { na: ["bobr", ...items] });
          await c.say("bobr", "line.p_kubki_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 2. carrots from the biggest
        {
          await c.ujecie("ogolny");
          const { t, strzalka, items } = await szereg(c, "marchewka", [0.8, 1.15, 1.5], { rosnaco: false });
          await c.say("bobr", "line.p_marchewki"); await t.done(); strzalka.remove();
          await c.ujecie("sredni", { na: ["zajac", ...items] });
          await c.say("zajac", "line.p_marchewki_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 3. the missing one: a growing row with a gap
        {
          await c.ujecie("ogolny");
          const r = [0.7, 0.95, null, 1.45], rzad = [];
          for (const [i, s] of r.entries()) if (s) rzad.push(await c.object("jablko", { x: -3.0 + i * 1.9, y: 1.4, size: s }));
          const luka = await c.zone({ x: -3.0 + 2 * 1.9, y: 1.4, w: 1.4, h: 1.4, name: "luka" });
          const opcje = [];
          for (const [i, s] of tasuj([0.55, 1.2, 1.7]).entries()) { const h = await c.object("jablko", { x: -1.9 + i * 1.9, y: -2.2, size: s }); h.s = s; opcje.push(h); }
          await c.say("zajac", "line.p_luka");
          const ok = opcje.find((h) => h.s === 1.2);
          dobre(ok); await c.task({ targets: opcje, correct: ok, wrong: "line.p_luka_nie" });
          await ok.moveTo(luka.x, luka.y, 0.4); luka.remove();
          await c.ujecie("sredni", { na: [...rzad, ok] });
          await c.say("bobr", "line.p_luka_ok"); gw.dodaj(); c.clear();
        }
        // 4. which row is in order?
        {
          await c.ujecie("ogolny");
          const dobryGora = Math.random() < 0.5, rzedy = [[0.6, 0.9, 1.2, 1.5], tasuj([0.6, 0.9, 1.2, 1.5])];
          while (wPorzadku(rzedy[1])) rzedy[1] = tasuj(rzedy[1]);
          const hs = [[], []];
          for (const [k, rz] of (dobryGora ? rzedy : [rzedy[1], rzedy[0]]).entries()) for (const [i, s] of rz.entries()) hs[k].push(await c.object("listek", { x: -2.4 + i * 1.6, y: k ? -1.6 : 1.4, size: s }));
          const ok = dobryGora ? hs[0] : hs[1];
          await c.say("bobr", "line.p_ktory_rzad");
          dobre(ok); await c.task({ targets: [...hs[0], ...hs[1]], correct: ok, wrong: "line.p_ktory_rzad_nie" });
          await c.ujecie("sredni", { na: ok });
          await c.say("zajac", "line.p_ktory_rzad_ok"); gw.dodaj(); c.clear();
        }
        // 5. the story strip: the lantern tower in four pictures
        {
          await c.ujecie("ogolny");
          await c.say("zajac", "line.p_historyjka");
          const h = await c.historyjka("wieza_latarenki", { wrong: "line.zla_kolejnosc" });
          await c.ujecie("sredni", { na: ["bobr", ...h.karty] });
          await c.say("bobr", "line.p_historyjka_ok", { anim: "Brawo" }); gw.dodaj();
          h.remove(); c.clear();
        }
        await c.praise("bobr");
      },
    ],
    apply: [
      // home in the evening - the third act: Beaver's water-glass xylophone. Listened to; Bunny plays it as it stands (a
      // mess); the full and the empty glass on an insert; the lowest found; in order on the painted rug it plays a rising
      // scale; the child plays it; the concert seen; the home game
      async (c) => {
        const S = c.stage;
        for (const n of ["bobr", "zajac"]) c.show(n);
        S.puppets.zajac.korzen.position.x = 4.6;                            // off the row of glasses
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        const m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });              // the thread: the concert is soon
        await c.say("bobr", "line.d_dom", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the glasses come in: the task is wide
        const miejsca = pomieszane(4);
        let szk = await szklanki(c, miejsca);
        await c.say("bobr", "line.d_szklanki", { anim: "Zgloszenie" });
        dobre(szk); await c.task({ targets: szk, correct: szk, wszystkie: true }); dobre(szk, false);
        await c.ujecie("zblizenie", { na: "zajac" });                        // surprise: each one is different
        await c.say("zajac", "line.d_rozne", { anim: "Radosc" });
        // Bunny's "a row is a row": he plays them as they stand - a mess of notes
        await c.ujecie("sredni", { na: ["zajac", ...szk] });
        await c.say("zajac", "line.d_zajac_gra", { anim: "Podskok" });
        await c.rytm(wRzedzie(szk), { tempo: 0.5, kiwaja: ["zajac"] });
        await c.ujecie("zblizenie", { na: "bobr" });                         // Beaver winces
        await c.emocja("bobr", "pot");
        await c.say("bobr", "line.d_falsz");
        // the method on a plain colour: the full glass and the nearly empty one, alone
        await c.go({ kolor: "#dfe8f6", motyw: "kola" }, { ciecie: true });
        const pelna = await c.object("szklanka_1", { x: -1.4, y: 0.9, size: 1.9, dzwiek: "szklo_1" }), pusta = await c.object("szklanka_4", { x: 1.4, y: 0.9, size: 1.9, dzwiek: "szklo_4" });
        await c.ujecie("sredni", { na: ["bobr", pelna, pusta] });
        await c.say("bobr", "line.d_metoda", { anim: "Wskazanie" });
        await c.rytm([pelna, pusta], { tempo: 0.8, kiwaja: ["bobr"] });
        // back in the room: which one plays the lowest?
        await c.go("pokoj_noc", { ciecie: true });
        S.puppets.zajac.korzen.position.x = 4.6;
        await c.ujecie("ogolny");
        szk = await szklanki(c, miejsca);
        const najpelniejsza = szk[0];
        await c.say("zajac", "line.d_najnizej");
        dobre(najpelniejsza); await c.task({ targets: szk, correct: najpelniejsza, wrong: "line.d_najnizej_nie" }); dobre(najpelniejsza, false);
        await c.ujecie("sredni", { na: ["bobr", najpelniejsza] });
        await c.say("bobr", "line.d_najnizej_ok", { anim: "Radosc" });
        // in order on the painted rug, from the fullest
        await c.ujecie("ogolny");
        const dy = m.dywan, krok = Math.min(1.7, dy.w * 0.8 / 4);
        const slots = SZKLANKI.map((_, k) => ({ x: dy.x + (k - 1.5) * krok, y: dy.y + 0.45, w: krok * 0.92, h: 1.4, accept: (it) => it.ranga === k }));
        await c.say("bobr", "line.d_uloz");                                  // the instruction first: the places and the arrow come in with it
        const t = await c.slots({ items: szk, slots, wrong: "line.zla_kolejnosc" });
        const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
        await t.done(); strzalka.remove();
        const rzad = wRzedzie(szk);
        await c.rytm(rzad, { tempo: 0.6, kiwaja: ["bobr", "zajac"] });
        await c.ujecie("zblizenie", { na: "zajac" });                        // the delight
        await c.say("zajac", "line.d_gama", { anim: "Brawo" });
        await c.ujecie("sredni", { na: ["bobr", ...rzad] });                 // the water steps down while the notes go up
        const schodki = await schodkiWody(c, rzad);
        await c.say("bobr", "line.d_woda_schodki", { anim: "Wskazanie" });
        // the child plays it: glass after glass, in order
        await c.ujecie("ogolny");
        schodki?.remove();
        await c.say("bobr", "line.d_zagraj");
        for (const h of rzad) { dobre(h); await c.task({ targets: rzad, correct: h, wrong: "line.d_zagraj_nie" }); dobre(h, false); }
        await c.rytm(rzad, { tempo: 0.45, kiwaja: ["bobr", "zajac"] });
        await c.konfetti();
        await c.ujecie("dwuujecie", { na: ["bobr", "zajac"] });
        await c.say("zajac", "line.d_brawo", { anim: "Radosc" });
        await c.say("zajac", "line.d_koncert", { anim: "Podskok" });
        // the concert, seen
        const il = await c.ilustracja("koncert_noc", { ruch: "najazd" });
        await c.say("bobr", "line.d_koncert_bobr");
        await c.say("zajac", "line.d_koncert_zajac");
        await il.zsun();
        // the home game, for the parents: the glasses just played stand in the shot
        await c.ujecie("sredni", { na: ["bobr", ...rzad] });
        await c.say("bobr", "line.d_rodzice_szklanki", { anim: "Zgloszenie" });
      },
    ],
  },
};
