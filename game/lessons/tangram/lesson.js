// Lesson: the tangram - a picture from pieces: every piece has its place, a piece that does not fit is turned (a tap
// turns it), not thrown away; the same pieces make different pictures. Owl's shadow theatre: Bear throws away the
// triangle that only needed turning (an insert shows the turn); each finished puppet's shadow comes alive on the sheet;
// Bear tore the poster - put together, it tells what the cat is made of; the actors practise faces before the show. At
// home, a theatre on the bedroom wall: the lamp, a fox (Bear throws an ear away again), a tree from the same pieces, the
// pieces back in their box, the evening seen. Script in scenario.md.

import { UKLADANKI, tangram as sylwetka } from "/game/engine/geometria.js";

// the lesson's own silhouettes (tangram units, centred): a fox head and a tree from the SAME three pieces, a rocket
const NOWE = {
  lis: [{ t: "L", x: 0.0, y: -0.0934, rot: 45 }, { t: "S", x: -0.3821, y: 0.1911, rot: 0 }, { t: "S", x: 0.3821, y: 0.1911, rot: 90 }],
  choinka: [{ t: "L", x: 0.0, y: 0.0935, rot: 225 }, { t: "S", x: -0.0589, y: -0.3089, rot: 0 }, { t: "S", x: 0.0589, y: -0.1911, rot: 180 }],
  rakieta: [{ t: "Q", x: 0.0, y: 0.0518, rot: 0 }, { t: "Q", x: 0.0, y: -0.3018, rot: 0 }, { t: "S", x: 0.0, y: 0.3119, rot: 225 }, { t: "S", x: -0.2947, y: -0.3607, rot: 90 }, { t: "S", x: 0.2947, y: -0.3607, rot: 0 }],
};
for (const [n, s] of Object.entries(NOWE)) if (!UKLADANKI[n]) UKLADANKI[n] = s;

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const FAST = new URLSearchParams(location.search).has("szybko");
const EKRAN = { x: 1.1, y: 1.55 };                                // the middle of the theatre's sheet

// a piece's box from its outline (the sticker is still popping in, so its drawn size is not final yet)
function obwiednia(h) {
  const a = h.rot * Math.PI / 180, co = Math.cos(a), si = Math.sin(a), p = h.mesh.position;
  const q = h.pts.map(([x, y]) => [p.x + x * co - y * si, p.y + x * si + y * co]);
  return { left: Math.min(...q.map((v) => v[0])), right: Math.max(...q.map((v) => v[0])), bottom: Math.min(...q.map((v) => v[1])), top: Math.max(...q.map((v) => v[1])) };
}
const naMiejsce = (k, s) => { k.mesh.position.set(s.x, s.y, 0.4); k.rot = s.rot; k.inner.rotation.z = s.rot * Math.PI / 180; };
// the instruction, then the silhouette and its pieces pop in and the child builds it
async function uloz(c, nazwa, linia, who, { x = 0, y = 1.0, scale = 3.6, obroty = null, rozsyp = null } = {}) {
  if (linia) await c.say(who, linia);
  const t = await c.tangram(nazwa, { x, y, scale, obroty, rozsyp });
  await t.done();
  await c.wait(0.3);
  return t;
}
// which piece fits the gap? the picture laid out with piece `brak` missing; the options in a row under it (`rzad`)
async function luka(c, nazwa, brak, opcje, linia, who, onWrong, { x = 0, y = 1.3, scale = 3.2, rzad = 0 } = {}) {
  const t = sylwetka(c.stage, nazwa, { x, y, scale });
  const dziura = t.sloty[brak];
  for (const [i, k] of t.kawalki.entries()) { if (i === brak) { k.remove(); continue; } naMiejsce(k, t.sloty[i]); }
  const kolej = tasuj(opcje), cele = [];
  for (const p of kolej) cele.push(c.piece(p, { x: 0, y: -2.4, size: scale, rot: dziura.rot }));
  const bs = cele.map(obwiednia), szer = bs.reduce((a, b) => a + b.right - b.left, 0) + 0.6 * (bs.length - 1);
  let px = rzad - szer / 2;
  for (const [i, h] of cele.entries()) { const b = bs[i]; h.mesh.position.x += px - b.left; h.mesh.position.y += -2.5 - (b.top + b.bottom) / 2; px += b.right - b.left + 0.6; }
  await c.say(who, linia);
  const ok = cele[kolej.indexOf(dziura.t)];
  dobre(ok); await c.task({ targets: cele, correct: ok, onWrong }); dobre(ok, false);
  await ok.moveTo(dziura.x, dziura.y, 0.35);                       // it slides into the gap
  return { t, ok };
}
// the finished puppet turns into its shadow and comes alive: swims (sideways), sails (rocks) or nods (bobs)
async function ozyw(c, t, ruch) {
  const S = c.stage;
  for (const k of t.kawalki) k.mesh.traverse((o) => { if (o.isMesh && o.material?.color) { o.material.color.set("#2c2733"); o.material.opacity = 0.92; } });
  c.sfx("whoosh");
  const p0 = t.kawalki.map((k) => [k.mesh.position.x, k.mesh.position.y, k.mesh.rotation.z]);
  const cx = p0.reduce((a, p) => a + p[0], 0) / p0.length, cy = p0.reduce((a, p) => a + p[1], 0) / p0.length;
  await S.tween(FAST ? 0.2 : 2.4, (s) => {
    const f = Math.sin(s * Math.PI * 4), kat = ruch === "kolys" ? f * 0.12 : 0;
    t.kawalki.forEach((k, i) => {
      const [x, y, r] = p0[i], dx = x - cx, dy = y - cy;
      const ox = ruch === "plyn" ? f * 0.35 : 0, oy = ruch === "kiw" ? Math.abs(f) * 0.15 : 0;
      k.mesh.position.x = cx + dx * Math.cos(kat) - dy * Math.sin(kat) + ox; k.mesh.position.y = cy + dx * Math.sin(kat) + dy * Math.cos(kat) + oy;
      k.mesh.rotation.z = r + kat;
    });
  });
  t.kawalki.forEach((k, i) => { k.mesh.position.x = p0[i][0]; k.mesh.position.y = p0[i][1]; k.mesh.rotation.z = p0[i][2]; });
}
// whose shadow: a sticker's shadow on the sheet, three stickers below
async function czyjCien(c, kto, opcje, linia, wrong) {
  const cien = await c.object(kto, { x: EKRAN.x, y: EKRAN.y, size: 2.2 }); c.cien(cien);
  const cele = [];
  for (const [i, n] of tasuj(opcje).entries()) cele.push(await c.object(n, { x: -1.0 + i * 1.9, y: -2.3, size: 1.3, plik: n === kto ? cien.plik : null }));   // the same variant as the shadow
  await c.say("sowa", linia);
  const ok = cele.find((h) => h.name === kto);
  dobre(ok); await c.task({ targets: cele, correct: ok, wrong });
  c.cien(cien, false);
}

export default {
  id: "tangram",
  przejscia: true,
  nagrody: true,
  characters: { sowa: { side: "left", x: -5.1 }, mis: { side: "left", x: -2.9 }, wiewiorka: { side: "right", x: 4.8 } },
  backgrounds: { story: "pokoj_noc", practice: { kolor: "#ecebf5", motyw: "figury" }, apply: "pokoj_noc" },
  stages: {
    story: [
      // A. the room in the evening: puppets from shapes; Bear throws away the triangle; an insert: the same triangle,
      // turned; the child builds the house, its shadow nods
      async (c) => {
        await Promise.all(["sowa", "mis", "wiewiorka"].map((n) => c.enter(n, n === "wiewiorka" ? "right" : "left")));
        await c.ujecie("dwuujecie", { na: ["sowa", "wiewiorka"] });          // the plan, and the snag
        await c.say("sowa", "line.a_teatr", { anim: "Radosc" });
        await c.say("wiewiorka", "line.a_lalki");
        await c.ujecie("ogolny");                                            // the silhouette and its pieces appear
        let t = await c.tangram("domek", { x: 0.8, y: 1.0, scale: 3.6, obroty: [0, 135] });
        await c.say("sowa", "line.a_z_ksztaltow", { anim: "Zgloszenie" });
        await c.say("mis", "line.a_pomoge");
        let tr = t.kawalki.find((k) => k.tag === "M");
        await tr.moveTo(t.sloty[1].x, t.sloty[1].y, 0.5); c.stage.shake(tr);
        await c.ujecie("zblizenie", { na: "mis" });                         // his disappointment
        await c.emocja("mis", "smutek", { anim: "Smutek" });
        await c.say("mis", "line.a_nie_pasuje", { anim: "Smutek" });
        await tr.moveTo(3.4, -2.6, 0.5);                                     // he throws it away
        await c.ujecie("zblizenie", { na: "sowa" });                        // Owl's surprise
        await c.wonder("sowa");
        await c.say("sowa", "line.a_nie_wyrzucaj");
        // the insert: the triangle alone, turned twice by Owl - the point comes up like a roof
        await c.go({ kolor: "#efe9f7", motyw: "figury" }, { ciecie: true });
        const sam = c.piece("M", { x: -0.6, y: 0.4, size: 3.2, rot: 135 });
        await c.ujecie("sredni", { na: ["sowa", "mis", sam] });
        await c.say("sowa", "line.a_patrz", { anim: "Wskazanie" });
        for (let i = 0; i < 2; i++) { c.sfx("tap"); await sam.rotateTo(sam.rot + 45, 0.35); await c.wait(0.4); }
        c.stage.bump(sam, 0.12, false);
        await c.say("sowa", "line.a_dach", { anim: "Radosc" });
        sam.remove();
        await c.go("pokoj_noc", { ciecie: true });
        await c.ujecie("dwuujecie", { na: ["sowa", "mis"] });               // back in the room: he got it
        await c.say("mis", "line.a_aha", { anim: "Kiwanie" });
        await c.ujecie("ogolny");                                            // the house again: the child turns it
        t = await uloz(c, "domek", "line.a_obroc", "sowa", { x: 0.8, y: 1.0, scale: 3.6, obroty: [0, 135] });
        await c.ujecie("zblizenie", { na: "mis" });                         // his joy
        await c.say("mis", "line.a_pasuje", { anim: "Radosc" });
        await c.ujecie("sredni", { na: t.kawalki });                        // the house's shadow comes alive
        await ozyw(c, t, "kiw");
        await c.ujecie("dwuujecie", { na: ["sowa", "mis"] });
        await c.say("sowa", "line.a_do_teatru", { anim: "Zgloszenie" });
        c.clear();
      },
      // B. the theatre: the fish swims, the boat sails; the torn poster tells about the cat; faces before the show
      async (c) => {
        await c.go("teatrzyk", { enter: true });
        await Promise.all(["sowa", "mis", "wiewiorka"].map((n) => c.enter(n, n === "wiewiorka" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "wiewiorka" });                   // her wonder at the sheet
        await c.say("wiewiorka", "line.b_ekran", { anim: "Radosc" });
        await c.ujecie("ogolny");
        let t = await uloz(c, "ryba", "line.b_ryba", "sowa", { ...EKRAN, scale: 3.2 });
        await c.ujecie("sredni", { na: t.kawalki });                        // the fish's shadow swims
        await ozyw(c, t, "plyn");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_plynie", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
        await c.say("mis", "line.b_lodka", { anim: "Zgloszenie" });
        t = await uloz(c, "lodka", null, "mis", { ...EKRAN, scale: 3.0 });
        await c.ujecie("sredni", { na: t.kawalki });
        await ozyw(c, t, "kolys");
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_plynie_lodka", { anim: "Brawo" });
        await c.ujecie("ogolny");
        c.clear();
        // the poster: Bear tore it; put together, it shows a cat - its ears are two small triangles
        await c.say("wiewiorka", "line.b_plakat", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "mis" });                         // his guilty confession
        await c.emocja("mis", "ojej");
        await c.say("mis", "line.b_podarl", { anim: "Smutek" });
        await c.ujecie("ogolny");
        const plakat = await c.podarty("plakat_teatru", { kawalki: 4 });
        await c.say("sowa", "line.b_plakat_kot");
        await c.say("sowa", "line.b_plakat_uszy");
        dobre(plakat.cele); await c.task({ targets: [...plakat.cele, plakat.tlo], correct: plakat.cele, wszystkie: true, wrong: "line.b_plakat_nie" }); dobre(plakat.cele, false);
        await plakat.zaznacz();
        await c.say("sowa", "line.b_plakat_trojkaty", { anim: "Radosc" });
        await plakat.remove();
        await c.ujecie("sredni", { na: ["sowa", "mis"] });                  // the idea: the same shapes, a new puppet
        await c.say("sowa", "line.b_kot", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        t = await uloz(c, "kot", null, "sowa", { ...EKRAN, scale: 2.3 });
        await c.ujecie("sredni", { na: t.kawalki });
        await ozyw(c, t, "kiw");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_miau", { anim: "Radosc" });
        c.clear();
        // the breather: the actors practise their faces before the show
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.b_miny", { anim: "Podskok" });
        await c.ujecie("ogolny");                                            // the faces to pick lie across the screen
        await c.lustro({ kto: "wiewiorka", rundy: 3 });
        await c.say("wiewiorka", "line.b_miny_ok", { anim: "Radosc" });
        // the show: the audience claps
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.b_przedstawienie", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.sfx("clap"); await Promise.all([c.play("mis", "Brawo"), c.play("wiewiorka", "Brawo")]);
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_koniec", { anim: "Radosc" });
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("sowa"); c.show("wiewiorka");
        S.puppets.sowa.korzen.position.x = -5.2; S.puppets.wiewiorka.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1. a square from two triangles
        {
          const t = await uloz(c, "kwadrat", "line.p_kwadrat", "wiewiorka", { scale: 3.4 });
          await c.ujecie("sredni", { na: ["sowa", ...t.kawalki] });
          await c.say("sowa", "line.p_kwadrat_ok"); gw.dodaj();
          c.clear();
          await c.ujecie("ogolny");
        }
        // 2. the cat lost an ear: which piece fits the gap?
        {
          const { ok } = await luka(c, "kot", 2, ["S", "M", "Q"], "line.p_luka", "wiewiorka", (hit) => c.say("wiewiorka", hit.tag === "M" ? "line.p_za_duzy" : "line.p_inny"), { y: 0.9, scale: 2.4 });
          await c.ujecie("sredni", { na: ["sowa", ok] });                  // the ear in its place
          await c.say("sowa", "line.p_ucho_ok", { anim: "Radosc" }); gw.dodaj();
          c.clear();
          await c.ujecie("ogolny");
        }
        // 3. whose shadow?
        {
          await czyjCien(c, "jez", ["jez", "mysz", "kura"], "line.p_czyj", "line.b_czyj_nie");
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_jez", { anim: "Radosc" }); gw.dodaj();
          c.clear();
          await c.ujecie("ogolny");
        }
        // 4. a shadow from dots
        {
          await c.say("sowa", "line.p_kropki", { anim: "Zgloszenie" });
          const k = await c.kropki("cien_ptaka", { znaki: "wielkosc", wrong: "line.p_kropki" });
          await c.say("sowa", "line.p_ptak", { anim: "Radosc" }); gw.dodaj();
          await k.remove();
        }
        // 5. a rocket - it flies off to the stars
        {
          const t = await uloz(c, "rakieta", "line.p_rakieta", "wiewiorka", { y: 0.6, scale: 3.2 });
          c.sfx("whoosh");
          const y0 = t.kawalki.map((k) => k.mesh.position.y);
          await S.tween(FAST ? 0.2 : 1.4, (s) => t.kawalki.forEach((k, i) => { k.mesh.position.y = y0[i] + 7 * s * s; }));
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_rakieta_ok", { anim: "Podskok" }); gw.dodaj();
          c.clear();
        }
        await c.ujecie("sredni", { na: ["sowa", "wiewiorka"] });
        await c.praise("sowa");
      },
    ],
    apply: [
      // home - the third act back in the bedroom at night: a theatre on the wall. The lamp onto the bedside table; a fox
      // (Bear throws an ear away again); a tree from the same pieces; the pieces back in their box; the evening seen;
      // a paper square cut into triangles, the parents' task
      async (c) => {
        const S = c.stage;
        for (const n of ["sowa", "mis", "wiewiorka"]) c.show(n);
        S.puppets.sowa.korzen.position.x = -5.1; S.puppets.mis.korzen.position.x = -3.2;   // the floor free for the pieces
        await c.wait(0.4);                                                  // show() pops the puppets in
        const m = await c.miejsca();
        await c.ujecie("zblizenie", { na: "mis" });                         // the thread: he wants more
        await c.say("mis", "line.h_wrocilismy", { anim: "Podskok" });
        await c.ujecie("dwuujecie", { na: ["sowa", "mis"] });
        await c.say("sowa", "line.h_tutaj", { anim: "Zgloszenie" });
        // the lamp onto the painted rug, facing the wall
        await c.ujecie("ogolny");
        const lampa = await c.object("latarenka_swieci", { x: 1.0, y: 1.6, size: 1.1 }); lampa.tag = "lampa"; lampa.home = { x: 1.0, y: 1.6 };
        await c.say("wiewiorka", "line.h_lampka");
        const dywan = await m.dywan.strefa(); dywan.want = "lampa";
        await c.sort({ items: [lampa], zones: [dywan], wrong: "line.h_lampka" });
        await c.say("mis", "line.h_swieci", { anim: "Radosc" });
        // the fox: Bear throws an ear away again
        const LIS = { x: 0.6, y: 1.2, scale: 3.4 };
        await c.say("sowa", "line.h_lis");
        let t = await c.tangram("lis", { ...LIS, obroty: [135, 180, 270] });
        const ucho = t.kawalki[1];
        await ucho.moveTo(t.sloty[1].x, t.sloty[1].y, 0.5); c.stage.shake(ucho);
        await c.ujecie("zblizenie", { na: "mis" });                         // his frown
        await c.emocja("mis", "zlosc");
        await c.say("mis", "line.h_ucho");
        await ucho.moveTo(-3.8, -3.0, 0.5);                                  // the ear flies off towards the bed
        await c.ujecie("dwuujecie", { na: ["sowa", "mis"] });
        await c.say("sowa", "line.h_obroc", { anim: "Zgloszenie" });
        await c.say("mis", "line.h_aha", { anim: "Kiwanie" });
        await c.ujecie("ogolny");                                            // the ear back; the child builds the fox
        await ucho.moveTo(ucho.home.x, ucho.home.y, 0.4);
        await t.done();
        await c.ujecie("sredni", { na: t.kawalki });                        // its shadow nods on the wall
        await ozyw(c, t, "kiw");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.h_lis_ok", { anim: "Radosc" });
        // the same three pieces, a tree: they start where the fox was
        await c.ujecie("ogolny");
        const rozsyp = t.kawalki.map((k) => [k.mesh.position.x - 1.0, k.mesh.position.y - 0.2]), obroty = t.sloty.map((s) => s.rot);
        t.remove();
        t = await uloz(c, "choinka", "line.h_choinka", "sowa", { x: 1.9, y: 1.0, scale: 3.0, rozsyp, obroty });
        await c.ujecie("sredni", { na: ["sowa", ...t.kawalki] });
        await c.say("sowa", "line.h_dobrze", { anim: "Brawo" });
        c.clear();
        // bedtime: the pieces back in the box - which one fits the last gap?
        await c.ujecie("ogolny");
        const { ok } = await luka(c, "duzy_kwadrat", 6, ["P", "Q", "M"], "line.h_pudelko", "mis", () => c.say("mis", "line.h_pudelko_nie"), { x: 0.6, y: 1.1, scale: 2.9, rzad: 0.9 });
        await c.ujecie("sredni", { na: ["sowa", ok] });                    // the last piece in the box
        await c.say("sowa", "line.h_pudelko_ok", { anim: "Radosc" });
        c.clear();
        // the payoff: the evening's theatre on the wall
        const il = await c.ilustracja("teatr_w_pokoju", { ruch: "najazd" });
        await c.say("wiewiorka", "line.h_teatr");
        await il.zsun();
        // the parents' task, shown: a paper square cut into two triangles
        await c.go({ kolor: "#f6efdf", motyw: "figury" }, { ciecie: true });
        const kw = { kawalki: UKLADANKI.kwadrat.map((s) => c.piece(s.t, { x: 0.4 + s.x * 3.2, y: 0.8 + s.y * 3.2, size: 3.2, rot: s.rot })) };
        await c.ujecie("sredni", { na: ["sowa", ...kw.kawalki] });
        await c.say("sowa", "line.h_kwadrat", { anim: "Wskazanie" });
        c.sfx("whoosh");
        await Promise.all(kw.kawalki.map((k, i) => k.moveTo(k.mesh.position.x + (i ? 0.5 : -0.5), k.mesh.position.y + (i ? 0.5 : -0.5), 0.6)));
        await c.ujecie("dwuujecie", { na: ["sowa", "mis"] });
        await c.say("mis", "line.h_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
