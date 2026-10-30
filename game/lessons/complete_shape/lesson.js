// Lesson: the missing piece - a gap has a shape and the piece that fits it has the same shape (and turn), not the same
// colour; a whole picture can be put together from pieces. Owl's picture for Hedgehog's birthday: the child points to
// Hedgehog on it, the wind tears it; on the meadow it is put together (podarty) - a triangular hole stays in the red
// roof; Squirrel tries the red square (colour!), it sticks out; the child finds the triangle; an insert shows why; the
// frame is coloured (breather); at the brook a footbridge laid from pieces has a square gap; the party. Practice: the
// fish's tail, the boat to turn, a torn pond, the mug's handle, a fox from three pieces. At home (Hedgehog's room) the
// blue plate breaks and Squirrel picks the blue square again; the gift is a box of shapes (scratch-off), a house from
// pieces, the card's balloon without a string, the picture onto the windowsill. Script in scenario.md.

import { UKLADANKI, tangram as sylwetka } from "/game/engine/geometria.js";

// the lesson's own silhouettes (tangram units, centred): a footbridge of two squares between two small triangles, a
// wide house (two squares under a triangle roof), a fox's head (the same as the tangram lesson's)
const NOWE = {
  kladka: [{ t: "S", x: -0.4715, y: -0.0589, rot: 90 }, { t: "Q", x: -0.1768, y: 0, rot: 0 }, { t: "Q", x: 0.1768, y: 0, rot: 0 }, { t: "S", x: 0.4715, y: -0.0589, rot: 0 }],
  dom_szeroki: [{ t: "Q", x: -0.1768, y: -0.12, rot: 0 }, { t: "Q", x: 0.1768, y: -0.12, rot: 0 }, { t: "M", x: 0, y: 0.1747, rot: 225 }],
  lis: [{ t: "L", x: 0.0, y: -0.0934, rot: 45 }, { t: "S", x: -0.3821, y: 0.1911, rot: 0 }, { t: "S", x: 0.3821, y: 0.1911, rot: 90 }],
};
for (const [n, s] of Object.entries(NOWE)) if (!UKLADANKI[n]) UKLADANKI[n] = s;

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const FAST = new URLSearchParams(location.search).has("szybko");
const nadObrazem = (h, ro = 39.5) => { h.mesh.position.z = 0.6; h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = ro; }); };   // over a found picture (38-39)

// the torn picture on the meadow (podarty) and its triangular hole, measured on obrazek_jeza_dziura (fractions of
// the picture: the dark hole's box and its centroid) and on the kawalek_* stickers (the painted shape's box)
const OBRAZ = { y: 0.75, size: 6.6 };
const DZIURA = { x: 0.5797, y: 0.3345, yc: 0.3726, w: 0.19, h: 0.17 };          // w, h with the white rim, in picture widths
const TROJKAT = { w: 0.781, h: 0.602, dy: 0.0098 }, KWADRAT = { w: 0.645 };
const dziura = () => {
  const W = OBRAZ.size, H = W * 2 / 3;
  return { x: (DZIURA.x - 0.5) * W, y: OBRAZ.y + (0.5 - DZIURA.y) * H, yc: OBRAZ.y + (0.5 - DZIURA.yc) * H, w: DZIURA.w * W, h: DZIURA.h * W };
};
// a sticker grows / moves to (x, y) at scale (sx, sy)
const doSkali = (c, h, x, y, sx, sy = sx, d = 0.45) => {
  const p0 = h.mesh.position.clone(), s0 = h.mesh.scale.clone();
  h.base = sx;
  return c.stage.tween(FAST ? 0.1 : d, (s) => { const e = 1 - (1 - s) ** 3; h.mesh.position.set(p0.x + (x - p0.x) * e, p0.y + (y - p0.y) * e, p0.z); h.mesh.scale.set(s0.x + (sx - s0.x) * e, s0.y + (sy - s0.y) * e, 1); });
};
// a try that does not fit: the piece goes onto the gap, wobbles there, and goes home again
async function nieWchodzi(c, h, x, y, s) {
  const home = { ...h.home }, s0 = h.mesh.scale.x;
  await doSkali(c, h, x, y, s);
  await c.wait(0.5);
  await c.stage.shake(h);
  await c.wait(0.3);
  await doSkali(c, h, home.x, home.y, s0);
}
// pieces in a row laid by their drawn widths, centred on x0
function wRzad(cele, x0, y, odstep) {
  const box = (h) => { const a = h.rot * Math.PI / 180, q = h.pts.map(([u, v]) => [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)]); return { l: Math.min(...q.map((v) => v[0])), r: Math.max(...q.map((v) => v[0])), b: Math.min(...q.map((v) => v[1])), t: Math.max(...q.map((v) => v[1])) }; };
  const bs = cele.map(box), szer = bs.reduce((a, b) => a + b.r - b.l, 0) + odstep * (bs.length - 1);
  let px = x0 - szer / 2;
  for (const [i, h] of cele.entries()) { const b = bs[i]; h.mesh.position.set(px - b.l, y - (b.t + b.b) / 2, 0.4); h.home = { x: h.mesh.position.x, y: h.mesh.position.y }; px += b.r - b.l + odstep; }
}
// which piece fits the gap? a silhouette laid out with piece `brak` missing; the options in a row under it, the wrong
// ones in `kolorZly` (the colour of the placed pieces: colour must not decide)
async function luka(c, nazwa, brak, opcje, linia, who, wrong, { x = 0, y = 1.2, scale = 3.0, rzadY = -2.5, kolorZly = null } = {}) {
  const t = sylwetka(c.stage, nazwa, { x, y, scale });
  const gap = t.sloty[brak];
  for (const [i, k] of t.kawalki.entries()) {
    if (i === brak) { k.remove(); continue; }
    const s = t.sloty[i]; k.mesh.position.set(s.x, s.y, 0.4); k.rot = s.rot; k.inner.rotation.z = s.rot * Math.PI / 180;
  }
  await c.wait(0.3);
  const cele = tasuj(opcje).map((p) => c.piece(p, { x: 0, y: rzadY, size: scale, rot: gap.rot, color: p === gap.t ? null : kolorZly }));
  wRzad(cele, -0.4, rzadY, 0.5);
  await c.say(who, linia);
  const ok = cele.find((h) => h.tag === gap.t);
  dobre(ok); await c.task({ targets: cele, correct: ok, wrong }); dobre(ok, false);
  await ok.moveTo(gap.x, gap.y, 0.35);                                // it slides into the gap
  return { t, ok, cele };
}

export default {
  id: "complete_shape",
  przejscia: true,
  nagrody: true,
  characters: { sowa: { side: "left", x: -4.7 }, wiewiorka: { side: "right", x: 3.3 }, jez: { side: "right", x: 5.1 } },
  backgrounds: { story: "dziupla_sowy", practice: { kolor: "#ece5f5", motyw: "figury" }, apply: "pokoj" },
  stages: {
    story: [
      // A. Owl's oak: the picture is ready - who is on it? - and the wind takes it
      async (c) => {
        const S = c.stage;
        c.show("sowa"); c.show("wiewiorka");
        await c.wait(0.4);
        await c.ujecie("dwuujecie", { na: ["sowa", "wiewiorka"] });
        await c.say("sowa", "line.a_gotowe", { anim: "Radosc" });
        await c.say("wiewiorka", "line.a_pokaz", { anim: "Podskok" });
        await c.ujecie("ogolny");                                            // the picture flies up from Owl's wing
        const z = await c.znalezisko("obrazek_jeza", { skad: "sowa" });
        await c.say("wiewiorka", "line.a_kto");
        dobre(z.cele); await c.task({ targets: [...z.cele, z.tlo], correct: z.cele[0], wrong: "line.a_kto_nie" }); dobre(z.cele, false);
        await c.say("sowa", "line.a_kto_tak", { anim: "Radosc" });
        // the gust: leaves blow across, the picture shudders, then tumbles up and away out of the frame
        c.czastki("liscie", { wiatr: 3, gestosc: 1.4 });
        c.sfx("whoosh");
        const g = z.mesh, p0 = g.position.clone();
        await S.tween(FAST ? 0.2 : 0.9, (s) => { g.rotation.z = Math.sin(s * Math.PI * 7) * 0.06 * s; g.position.x = p0.x + Math.sin(s * Math.PI * 5) * 0.12; });
        c.sfx("whoosh");
        await S.tween(FAST ? 0.2 : 1.0, (s) => { const e = s * s; g.position.set(p0.x + 9 * e, p0.y + 5 * e, p0.z); g.rotation.z = -2.4 * e; g.scale.setScalar(1 - 0.6 * e); });
        await z.remove();
        await c.ujecie("zblizenie", { na: "sowa" });                        // the shock
        c.emocja("sowa", "wykrzyknik");
        await c.say("sowa", "line.a_wiatr");
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sowa"] });
        await c.say("wiewiorka", "line.a_podarty", { anim: "Wskazanie" });
        await c.say("sowa", "line.a_szukajmy", { anim: "Machanie" });
        c.czastki(null);
        c.clear();
      },
      // B. the meadow: the torn picture put together, the hole, Squirrel's red square, the triangle; the insert; the frame
      async (c) => {
        const S = c.stage;
        await c.go("laka", { enter: true });
        await Promise.all(["sowa", "wiewiorka"].map((n) => c.enter(n)));
        await c.ujecie("sredni", { na: ["wiewiorka"] });                     // the pieces found in the grass
        await c.say("wiewiorka", "line.b_sa", { anim: "Wskazanie" });
        await c.ujecie("ogolny");
        await c.say("sowa", "line.b_uloz");
        const z = await c.podarty("obrazek_jeza_dziura", { kawalki: 4, ...OBRAZ });
        const d = dziura();
        await c.ujecie("sredni", { na: [z.tlo] });                           // the whole picture and its hole, a little closer
        await c.say("sowa", "line.b_dziura", { anim: "Smutek" });
        await c.ujecie("ogolny");                                            // room for the pieces under it
        // three more pieces in the grass: they come up under the picture, never in the answer order
        const nazwy = ["kawalek_trojkat", "kawalek_kwadrat", "kawalek_kolo"], xs = tasuj([-2.1, 0, 2.1]);
        const kaw = [];
        for (const [i, n] of nazwy.entries()) { const h = await c.object(n, { x: xs[i], y: -2.65, size: 1.45 }); nadObrazem(h); kaw.push(h); }
        await c.say("wiewiorka", "line.b_trzy", { anim: "Podskok" });
        const [tr, kw] = kaw;
        // Squirrel's idea: the hole is in the red roof, so the red piece - the square; it sticks out and the hole shows
        c.emocja("wiewiorka", "zarowka");                                    // Squirrel's idea (wide: a close-up would cut the picture)
        await c.say("wiewiorka", "line.b_czerwony", { anim: "Zgloszenie" });
        const domKw = { ...kw.home }, sKw = kw.mesh.scale.x;
        await doSkali(c, kw, d.x, d.yc, (d.w * 0.62) / KWADRAT.w);
        await c.ujecie("sredni", { na: [kw, z.tlo] });                        // the square on the hole: corners out, the hole shows
        await c.say("wiewiorka", "line.b_wystaje", { anim: "Smutek" });
        await S.shake(kw);
        await doSkali(c, kw, domKw.x, domKw.y, sKw);
        await c.ujecie("ogolny");                                            // the task: the picture and the pieces in the shot
        await c.say("sowa", "line.b_ksztalt");
        await c.say("sowa", "line.b_wskaz");
        dobre(tr); await c.task({ targets: kaw, correct: tr, wrong: "line.b_wskaz_nie" }); dobre(tr, false);
        await doSkali(c, tr, d.x, d.y + TROJKAT.dy * (d.h / TROJKAT.h), d.w / TROJKAT.w, d.h / TROJKAT.h);
        c.sfx("plop");
        await c.ujecie("sredni", { na: ["sowa", tr] });
        await c.say("sowa", "line.b_trojkat", { anim: "Radosc" });
        await c.say("wiewiorka", "line.b_caly", { anim: "Podskok" });
        // the picture is rolled up: the piece goes away with it
        const p0 = tr.mesh.position.clone(), s0 = tr.mesh.scale.clone();
        await Promise.all([z.remove(), S.tween(0.3, (s) => { const k = 1 - 0.9 * s; tr.mesh.position.set(p0.x * k, OBRAZ.y + (p0.y - OBRAZ.y) * k, p0.z); tr.mesh.scale.set(s0.x * k, s0.y * k, 1); })]);
        tr.remove();
        c.clear();
        // the method on a plain colour: a triangular hole alone; the square sticks out, the triangle covers it all
        await c.go({ kolor: "#f3ead6", motyw: "figury" }, { ciecie: true });
        const otwor = c.shape("trojkat", { x: 0.4, y: 1.0, size: 2.3, color: "#5b4232" });
        const k2 = c.shape("kwadrat", { x: -2.7, y: -2.3, size: 1.5, color: "#e5392d" });
        const t2 = c.shape("trojkat", { x: -0.2, y: -2.3, size: 2.3, color: "#e5392d" });
        await c.wait(0.4);
        await c.ujecie("sredni", { na: [otwor, k2, t2] });
        await k2.moveTo(0.4, 0.75, 0.5);
        await c.say("sowa", "line.b_metoda_kwadrat", { anim: "Wskazanie" });
        await S.shake(k2);
        await k2.moveTo(-2.7, -2.3, 0.4);
        t2.naWierzch();
        await t2.moveTo(0.4, 1.0, 0.5);
        c.sfx("plop"); S.bump(t2, 0.12, false);
        await c.say("sowa", "line.b_metoda_trojkat", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_aha", { anim: "Radosc" });
        c.clear();
        // back on the meadow: the breather - colour the frame (the plain frame wiped into a colourful one)
        await c.go("laka", { ciecie: true });
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "sowa"] });
        await c.say("wiewiorka", "line.b_ramka", { anim: "Podskok" });
        await c.ujecie("ogolny");
        await c.malowanie({ tlo: "szyba", zdrapka: "rama_obrazka", czas: 10 });
        const ramka = await c.object("obrazek_w_ramce", { x: 0.2, y: 1.0, size: 3.6 });
        c.rozblysk(ramka);
        await c.ujecie("sredni", { na: ["sowa", ramka] });
        await c.say("sowa", "line.b_ramka_tak", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["sowa", "wiewiorka"] });
        await c.say("sowa", "line.b_idziemy", { anim: "Wskazanie" });
        c.clear();
      },
      // C. the brook: Hedgehog comes to meet them; the footbridge has a square gap; the party (an event illustration)
      async (c) => {
        await c.go("strumyk", { enter: true });
        await Promise.all(["sowa", "wiewiorka"].map((n) => c.enter(n)));
        await c.enter("jez");
        await c.ujecie("dwuujecie", { na: ["jez", "sowa"] });
        await c.say("jez", "line.c_czesc", { anim: "Machanie" });
        await c.say("sowa", "line.c_niespodzianka", { anim: "Radosc" });
        // the footbridge over the water, laid from pieces - one square is missing
        const t = sylwetka(c.stage, "kladka", { x: 0.3, y: -0.35, scale: 2.6 });
        t.kawalki.forEach((k) => k.remove());
        const placed = [];
        for (const [i, s] of t.sloty.entries()) { if (i === 2) continue; placed.push(c.piece(s.t, { x: s.x, y: s.y, size: 2.6, rot: s.rot })); }
        await c.wait(0.4);
        await c.ujecie("zblizenie", { na: "jez" });
        c.emocja("jez", "pot");
        await c.say("jez", "line.c_mostek", { anim: "Smutek" });
        await c.ujecie("ogolny");                                            // the task: the bridge and the blocks in the shot
        const gap = t.sloty[2];
        const cele = tasuj(["Q", "S", "P"]).map((p) => c.piece(p, { x: 0, y: -2.6, size: 2.6, rot: p === "S" ? 45 : 0 }));
        wRzad(cele, -0.6, -2.6, 0.5);
        await c.say("sowa", "line.c_wskaz");
        const ok = cele.find((h) => h.tag === "Q");
        dobre(ok); await c.task({ targets: cele, correct: ok, wrong: "line.c_wskaz_nie" }); dobre(ok, false);
        await ok.moveTo(gap.x, gap.y, 0.4);
        c.sfx("plop");
        await c.ujecie("sredni", { na: ["sowa", ok, ...placed] });
        await c.say("sowa", "line.c_kwadrat", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.c_hurra", { anim: "Podskok" });
        c.clear();
        // the party at Hedgehog's (an event illustration): the picture given
        const il = await c.ilustracja("urodziny_jeza", { ruch: "najazd" });
        await c.say("sowa", "line.c_prezent");
        await c.say("jez", "line.c_dziekuje");
        await il.zsun();
      },
    ],
    practice: [
      // the piece school: five games, a star each
      async (c) => {
        const S = c.stage;
        c.show("sowa"); c.show("wiewiorka");
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        // 1. the fish's tail: the wrong pieces have the colour of the fish's body
        {
          await c.ujecie("ogolny");
          const { ok } = await luka(c, "ryba", 1, ["M", "Q", "P"], "line.p_ryba", "wiewiorka", "line.p_ryba_nie", { x: 0.7, y: 1.2, scale: 3.0, kolorZly: "#3f8ce0" });
          await c.ujecie("sredni", { na: ["sowa", ok] });
          await c.say("sowa", "line.p_ryba_tak", { anim: "Radosc" });
          c.clear(); gw.dodaj();
        }
        // 2. the boat: both pieces lie turned the wrong way - a tap turns them
        {
          await c.ujecie("ogolny");
          await c.say("sowa", "line.p_lodka");
          const t = await c.tangram("lodka", { x: 0.7, y: 1.3, scale: 3.2, obroty: [90, 180] });
          await t.done();
          await c.ujecie("sredni", { na: ["wiewiorka", ...t.kawalki] });
          await c.say("wiewiorka", "line.p_lodka_tak", { anim: "Podskok" });
          c.clear(); gw.dodaj();
        }
        // 3. Owl's pond, torn into more pieces
        {
          await c.ujecie("ogolny");
          await c.say("sowa", "line.p_staw", { anim: "Smutek" });
          const z = await c.podarty("obrazek_staw", { kawalki: 6, y: 0.5, size: 7.2 });
          await c.say("wiewiorka", "line.p_staw_tak", { anim: "Radosc" });
          await z.remove();
          c.clear(); gw.dodaj();
        }
        // 4. the mug without its handle: what is missing?
        {
          const kubek = await c.object("kubek_bez_ucha", { x: 0.0, y: 1.0, size: 2.6 });
          await c.ujecie("sredni", { na: ["wiewiorka", kubek] });
          await c.say("wiewiorka", "line.p_kubek");
          const xs = tasuj([-2.1, 0, 1.9]), opcje = [];
          for (const [i, n] of ["ucho_kubka", "lyzka", "spodek"].entries()) opcje.push(await c.object(n, { x: xs[i], y: -2.55, size: n === "ucho_kubka" ? 1.6 : 1.3 }));
          await c.ujecie("ogolny");
          const ucho = opcje[0];
          dobre(ucho); await c.task({ targets: opcje, correct: ucho, wrong: "line.p_kubek_nie" }); dobre(ucho, false);
          await ucho.moveTo(kubek.mesh.position.x + 0.57 * 2.6, kubek.mesh.position.y, 0.4);
          ucho.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9.9; });   // its ends tucked behind the mug's wall
          await doSkali(c, ucho, kubek.mesh.position.x + 0.57 * 2.6, kubek.mesh.position.y, 2.6);
          c.sfx("plop");
          await c.ujecie("sredni", { na: ["sowa", kubek, ucho] });
          await c.say("sowa", "line.p_kubek_tak", { anim: "Radosc" });
          c.clear(); gw.dodaj();
        }
        // 5. a fox's head from three pieces
        {
          await c.ujecie("ogolny");
          await c.say("sowa", "line.p_lis");
          const t = await c.tangram("lis", { x: 0.7, y: 1.3, scale: 3.2 });
          await t.done();
          await c.ujecie("sredni", { na: ["wiewiorka", ...t.kawalki] });
          await c.say("wiewiorka", "line.p_lis_tak", { anim: "Podskok" });
          c.clear(); gw.dodaj();
        }
        await c.ujecie("sredni", { na: ["sowa", "wiewiorka"] });
        await c.praise("sowa");
        void S;
      },
    ],
    apply: [
      // home - the third act in Hedgehog's room: the broken plate (Squirrel's blue square), the gift box of shapes, a
      // house from pieces, the card's balloon without a string, Owl's picture onto the windowsill, the home game
      async (c) => {
        const S = c.stage;
        for (const n of ["sowa", "wiewiorka", "jez"]) c.show(n);
        await c.wait(0.4);
        const m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["jez", "sowa"] });               // the birthday tea
        await c.say("jez", "line.d_dom", { anim: "Radosc" });
        // the plate: Squirrel carries it, it slips and breaks
        const talerz = await c.object("talerz_niebieski", { x: 1.4, y: 1.4, size: 1.5 });
        await c.ujecie("sredni", { na: ["wiewiorka", talerz] });
        await c.say("wiewiorka", "line.d_niose", { anim: "Podskok" });
        await c.take("wiewiorka", talerz);
        await c.ujecie("ogolny");
        await c.walkTo("wiewiorka", 1.9);
        const L = S.puppets.wiewiorka; L.trzyma = null; L.niesie = false;
        const PX = -0.3, PY = -2.2, PS = 2.3;                                 // the broken plate on the floor (one scale for the pieces)
        const tp = talerz.mesh.position.clone();
        c.sfx("whoosh");
        await S.tween(FAST ? 0.15 : 0.55, (s) => { talerz.mesh.position.set(tp.x + (PX - tp.x) * s, tp.y + (PY - tp.y) * s * s, tp.z); talerz.mesh.rotation.z = 1.2 * s; });
        c.sfx("garnek");
        c.walkTo("wiewiorka", S.puppets.wiewiorka.home).catch(() => {});   // back from the shards
        talerz.remove();
        const pekniety = await c.object("talerz_pekniety", { x: PX, y: PY, size: PS, cicho: true });
        const opcje = [], xs = tasuj([[-2.9, -2.6], [-1.9, -3.25], [1.6, -2.9]]);
        for (const [i, n] of ["talerz_kawalek", "skorupka_niebieska", "skorupka_zolta"].entries()) opcje.push(await c.object(n, { x: xs[i][0], y: xs[i][1], size: 1.5 }));
        opcje.forEach((h) => { h.home = { x: h.mesh.position.x, y: h.mesh.position.y }; });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        c.emocja("wiewiorka", "strach");
        await c.say("wiewiorka", "line.d_ojej");
        await c.ujecie("dwuujecie", { na: ["jez", "wiewiorka"] });
        await c.say("jez", "line.d_nic", { anim: "Kiwanie" });
        // Squirrel's mistake again: the blue square; it sticks out of the wedge-shaped gap
        const [klin, niebieska] = opcje;
        const gapX = PX + (0.83 - 0.5) * PS, gapY = PY - (0.512 - 0.5) * PS;
        await c.ujecie("sredni", { na: ["wiewiorka", pekniety, niebieska] });
        await c.say("wiewiorka", "line.d_niebieski", { anim: "Zgloszenie" });
        await nieWchodzi(c, niebieska, gapX, gapY, PS);
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.wonder("sowa");
        await c.say("sowa", "line.d_niebieski_nie");
        await c.ujecie("ogolny");
        await c.say("sowa", "line.d_wskaz");
        dobre(klin); await c.task({ targets: opcje, correct: klin, wrong: "line.d_wskaz_nie" }); dobre(klin, false);
        // the wedge's own centre sits 0.045 of the sticker left of the middle
        await doSkali(c, klin, gapX - (0.545 - 0.5) * PS, gapY + (0.499 - 0.5) * PS, PS);
        c.sfx("plop");
        await c.ujecie("sredni", { na: ["jez", pekniety] });
        await c.say("jez", "line.d_talerz_tak", { anim: "Radosc" });
        c.clear();
        // Squirrel's gift under the wrapping paper: a box of shapes - which one is the triangle?
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "jez"] });
        await c.say("wiewiorka", "line.d_prezent", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const z = await c.zdrapka("prezent_jeza");
        await c.say("jez", "line.d_klocki", { anim: "Radosc" });
        await c.say("wiewiorka", "line.d_trojkat");
        dobre(z.cele); await c.task({ targets: [...z.cele, z.tlo], correct: z.cele[0], wrong: "line.d_trojkat_nie" }); dobre(z.cele, false);
        await c.say("jez", "line.d_trojkat_tak", { anim: "Radosc" });
        await z.remove();
        // a house from pieces on the floor, like the one on Owl's picture
        await c.walkTo("wiewiorka", S.puppets.wiewiorka.home);
        await c.ujecie("ogolny");
        await c.say("jez", "line.d_buduj", { anim: "Zgloszenie" });
        const t = await c.tangram("dom_szeroki", { x: 0.4, y: 1.2, scale: 3.0 });
        await t.done();
        await c.ujecie("sredni", { na: ["sowa", ...t.kawalki] });
        await c.say("sowa", "line.d_buduj_tak", { anim: "Radosc" });
        c.clear();
        // Owl's birthday card: the balloon without a string; Owl draws it in
        await c.ujecie("ogolny");
        await c.say("sowa", "line.d_kartka", { anim: "Zgloszenie" });
        const KY = 0.15, KS = 6.2;
        const k = await c.znalezisko("kartka_urodzinowa", { skad: "sowa", y: KY, size: KS, obrot: 0 });
        await c.say("sowa", "line.d_kartka_wskaz");
        dobre(k.cele); await c.task({ targets: [...k.cele, k.tlo], correct: k.cele[0], wrong: "line.d_kartka_nie" }); dobre(k.cele, false);
        await c.ujecie("sredni", { na: ["wiewiorka", k.cele[0]] });          // the balloon talked about
        await c.say("wiewiorka", "line.d_kartka_tak", { anim: "Wskazanie" });
        const pkt = (fx, fy) => [(fx - 0.5) * KS, KY + (0.5 - fy) * KS];
        const sznurek = await c.line([pkt(0.842, 0.365), pkt(0.81, 0.43), pkt(0.79, 0.5), pkt(0.73, 0.56), pkt(0.66, 0.6), pkt(0.6, 0.64)], { color: "#4a3426", width: 0.05, duration: 0.8, warstwa: 39 });
        await c.say("sowa", "line.d_sznurek", { anim: "Radosc" });
        sznurek.remove();
        await k.remove();
        // the payoff: Owl's picture onto the windowsill, where everyone sees it
        const obraz = await c.object("obrazek_w_ramce", { x: 0.4, y: -2.4, size: 1.9 });
        await c.ujecie("sredni", { na: ["jez", obraz] });
        await c.say("jez", "line.d_parapet", { anim: "Wskazanie" });
        await c.ujecie("ogolny");
        const sl = await c.slots({ items: [obraz], slots: [m.parapet.slot((h) => h === obraz)] });
        await sl.done();
        for (const n of ["sowa", "wiewiorka", "jez"]) c.play(n, "Brawo")?.catch?.(() => {});
        c.sfx("clap");
        await c.wait(1.0);
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.d_hurra", { anim: "Radosc" });
        // the home game alone, on a plain colour: a picture cut into four is put back together
        await c.go({ kolor: "#f6e7cf", motyw: "figury" }, { ciecie: true });
        await c.ujecie("ogolny");
        await c.say("sowa", "line.d_pokaz", { anim: "Wskazanie" });
        const gra = c.podarty("obrazek_jeza", { kawalki: 4, y: 0.6, size: 6.0 });
        await c.wait(1.6);
        await S.podarty?.dokoncz();
        const zp = await gra;
        await c.wait(0.8);
        await zp.remove();
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.d_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
