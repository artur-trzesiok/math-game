// Lesson: the tangram - a picture from pieces: every piece has its place, a piece that does not fit is turned (a tap
// turns it), not thrown away; the same pieces make different pictures. Owl's shadow theatre: the puppets are made
// from shapes, Bear throws away the triangle that only needed turning, each finished puppet's shadow comes alive on
// the sheet (the fish swims, the boat sails, the cat nods); the show's poster tells what the cat is made of. Script in
// scenario.md.

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
async function uloz(c, nazwa, { x = 0, y = 1.0, scale = 3.6, obroty = null } = {}) {
  const t = await c.tangram(nazwa, { x, y, scale, obroty });
  await t.done();
  await c.wait(0.3);
  return t;
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
  characters: { sowa: { side: "left", x: -4.7 }, mis: { side: "left", x: -2.9 }, wiewiorka: { side: "right", x: 4.8 } },
  backgrounds: { story: "pokoj_noc", practice: { kolor: "#ecebf5", motyw: "figury" }, apply: "dom" },
  stages: {
    story: [
      // A. the room at night: puppets from shapes; Bear throws away the triangle; Owl turns it - it fits
      async (c) => {
        await Promise.all(["sowa", "mis", "wiewiorka"].map((n) => c.enter(n, n === "wiewiorka" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.a_teatr", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_lalki");
        await c.ujecie("sredni", { na: ["sowa", "mis"] });
        await c.say("sowa", "line.a_z_ksztaltow", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const t = await c.tangram("domek", { x: 0.8, y: 1.0, scale: 3.6, obroty: [0, 0] });
        await c.say("mis", "line.a_pomoge");
        const tr = t.kawalki.find((k) => k.tag === "M");
        await tr.moveTo(t.sloty[1].x, t.sloty[1].y, 0.5); c.stage.shake(tr);
        await c.ujecie("zblizenie", { na: "mis" });
        await c.emocja("mis", "smutek", { anim: "Smutek" });
        await c.say("mis", "line.a_nie_pasuje", { anim: "Smutek" });
        await c.ujecie("ogolny");
        await tr.moveTo(3.4, -2.6, 0.5);
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.wonder("sowa");
        await c.say("sowa", "line.a_nie_wyrzucaj");
        await c.ujecie("sredni", { na: ["sowa", tr] });   // the thrown-away triangle: turn it
        await c.say("sowa", "line.a_obroc");
        await c.ujecie("ogolny");
        await tr.moveTo(tr.home.x, tr.home.y, 0.4);
        await t.done();
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_pasuje", { anim: "Radosc" });
        await c.ujecie("sredni", { na: t.kawalki });   // the house's shadow comes alive
        await ozyw(c, t, "kiw");
        await c.ujecie("sredni", { na: ["sowa", "mis"] });
        await c.say("sowa", "line.a_do_teatru");
        await c.ujecie("ogolny");
        c.clear();
      },
      // B. the theatre: each puppet built on the sheet comes alive - the fish swims, the boat sails, a cat
      async (c) => {
        await c.go("teatrzyk", { enter: true });
        await Promise.all(["sowa", "mis", "wiewiorka"].map((n) => c.enter(n, n === "wiewiorka" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_ekran");
        await c.ujecie("sredni", { na: ["sowa", "mis"] });
        await c.say("sowa", "line.b_ryba");
        await c.ujecie("ogolny");
        let t = await uloz(c, "ryba", { ...EKRAN, scale: 3.2 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_plynie", { anim: "Radosc" });
        await c.ujecie("sredni", { na: t.kawalki });   // the fish's shadow swims
        await ozyw(c, t, "plyn");
        await c.ujecie("ogolny"); c.clear();
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_lodka");
        await c.ujecie("ogolny");
        t = await uloz(c, "lodka", { ...EKRAN, scale: 3.0 });
        await c.ujecie("sredni", { na: t.kawalki });
        await ozyw(c, t, "kolys");
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_plynie_lodka", { anim: "Brawo" });
        await c.ujecie("ogolny");
        c.clear();
        // the poster of the show promises a cat: the child finds its ears - two small triangles, pieces we have
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_plakat", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const plakat = await c.znalezisko("plakat_teatru", { skad: "wiewiorka" });
        await c.say("sowa", "line.b_plakat_kot");
        await c.say("sowa", "line.b_plakat_uszy");
        dobre(plakat.cele); await c.task({ targets: [...plakat.cele, plakat.tlo], correct: plakat.cele, wszystkie: true, wrong: "line.b_plakat_nie" }); dobre(plakat.cele, false);
        await plakat.zaznacz();
        await c.say("sowa", "line.b_plakat_trojkaty", { anim: "Radosc" });
        await plakat.remove();
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.b_kot", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        t = await uloz(c, "kot", { ...EKRAN, scale: 2.3 });
        await c.ujecie("sredni", { na: t.kawalki });
        await ozyw(c, t, "kiw");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_miau", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
        // the show: the audience claps
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.b_przedstawienie", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.sfx("clap"); await Promise.all([c.play("mis", "Brawo"), c.play("wiewiorka", "Brawo")]);
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_koniec");
        await c.ujecie("ogolny");
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
        // 1. a fish
        {
          await c.say("wiewiorka", "line.p_ryba");
          const t = await uloz(c, "ryba");
          await c.ujecie("sredni", { na: ["sowa", ...t.kawalki] });   // the finished fish
          await c.say("sowa", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 2. which piece fits the gap in the house?
        {
          const brak = "M", t = await c.tangram("domek", { x: 0, y: 1.3, scale: 3.2 });
          for (const [i, k] of t.kawalki.entries()) { const s = t.sloty[i]; if (s.t === brak) { k.remove(); continue; } k.mesh.position.set(s.x, s.y, 0.4); k.rot = s.rot; k.inner.rotation.z = s.rot * Math.PI / 180; }
          const opcje = tasuj(["L", "Q", brak]), cele = [];
          for (const p of opcje) cele.push(c.piece(p, { x: 0, y: -2.4, size: 3.2, rot: t.sloty.find((s) => s.t === brak).rot }));
          const bs = cele.map(obwiednia), szer = bs.reduce((a, b) => a + b.right - b.left, 0) + 0.5 * (bs.length - 1);
          let x = -szer / 2;
          for (const [i, h] of cele.entries()) { const b = bs[i]; h.mesh.position.x += x - b.left; h.mesh.position.y += -2.5 - (b.top + b.bottom) / 2; x += b.right - b.left + 0.5; }
          await c.say("wiewiorka", "line.p_luka");
          const ok = cele[opcje.indexOf(brak)];
          dobre(ok); await c.task({ targets: cele, correct: ok, onWrong: (hit) => c.say("wiewiorka", hit.tag === "L" ? "line.p_za_duzy" : "line.p_inny") });
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 3. a boat with its pieces turned
        {
          await c.ujecie("sredni", { na: ["sowa"] });
          await c.say("sowa", "line.p_lodka");
          await c.ujecie("ogolny");
          await uloz(c, "lodka");
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 4. whose shadow?
        {
          await czyjCien(c, "jez", ["jez", "mysz", "kura"], "line.p_czyj", "line.b_czyj_nie");
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_jez"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 5. a cat
        {
          await c.say("wiewiorka", "line.p_kot");
          const t = await uloz(c, "kot", { scale: 2.6 });
          await c.ujecie("sredni", { na: ["sowa", ...t.kawalki] });
          await c.say("sowa", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.praise("sowa");
        await c.ujecie("ogolny");
      },
    ],
    apply: [
      // home, the kitchen: a square from two triangles, then a house - as with paper at home
      async (c) => {
        for (const n of ["sowa", "mis"]) c.show(n);
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.h_kuchnia", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const k = await uloz(c, "kwadrat", { x: 0.6 });
        await c.ujecie("sredni", { na: ["sowa", ...k.kawalki] });   // the square from two triangles
        await c.say("sowa", "line.h_kwadrat");
        await c.ujecie("ogolny");
        c.clear();
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.h_domek");
        await c.ujecie("ogolny");
        await uloz(c, "domek", { x: 0.6 });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.h_dobrze", { anim: "Brawo" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.h_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
