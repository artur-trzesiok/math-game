// Lesson: in front and behind - behind a thing you are hidden (only a bit peeks out), in front of it everybody sees
// you. Hide-and-seek in the forest: Bear counts (an illustration), Bunny "hides" in front of the bush with his eyes shut;
// an insert shows the duckling in front of and behind the bush; the child hides the mouse, then seeks the friends by
// what peeks out; the breather: nothing peeks out, find them by their voices; "in front of the house - behind the
// house" at Mouse's little house; Bunny's photo shows the mouse's ears behind the hedge, and Hedgehog finds her in the
// garden maze. At home, the third act: Bunny's rematch - his teddy in front of the armchair again, the child hides it,
// Bunny behind the curtain (found, the payoff seen), toys onto the rug in front of the armchair, Bunny's pictures of
// the day in order, the home game shown in play. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const PODLOGA = -3.3;
const ARKADA = { x: 1.1, y: 1.5 };                  // the arch into the hedge maze in the ogrod_labirynt plate
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const ZA = 9.9, PRZED = 10.2;                       // draw orders: under a sticker (behind it), over it (in front)
const warstwa = (h, ro) => h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = ro; });

// where a thing stands behind `ref` with only its top `widac` (a fraction of its height) peeking out
function zaY(c, h, ref, widac) {
  const r = c.bounds(ref), b = c.bounds(h), ih = b.top - b.bottom, oy = h.mesh.position.y - (b.top + b.bottom) / 2;
  return r.top + widac * ih - ih / 2 + oy;
}
// a thing hidden behind another: drawn under it, only its top peeking out
async function schowaj(c, kto, ref, { size = 1.3, widac = 0.3, dx = 0 } = {}) {
  const h = await c.object(kto, { x: ref.mesh.position.x + dx, y: 0, size, cicho: true });
  h.mesh.position.y = zaY(c, h, ref, widac); h.mesh.position.z = ref.mesh.position.z - 0.05;
  warstwa(h, ZA);
  h.home = { x: h.mesh.position.x, y: h.mesh.position.y };
  return h;
}
// a thing hidden behind a hanging cover (the curtain): only its feet peek out under the hem
async function podZaslona(c, kto, ref, { size = 1.4, wystaje = 0.22, dx = 0 } = {}) {
  const h = await c.object(kto, { x: ref.mesh.position.x + dx, y: 0, size, cicho: true });
  const r = c.bounds(ref), b = c.bounds(h);
  h.mesh.position.y += r.bottom - wystaje - b.bottom; h.mesh.position.z = ref.mesh.position.z - 0.05;
  warstwa(h, ZA);
  return h;
}
// found: it jumps out from behind and lands IN FRONT of its hiding place, all of it seen (never under Bear on the right)
async function wyskocz(c, h, ref) {
  c.sfx("hop");
  const r = c.bounds(ref), b = c.bounds(h), ih = b.top - b.bottom, oy = h.mesh.position.y - (b.top + b.bottom) / 2;
  await h.moveTo(h.mesh.position.x, r.top + 0.8, 0.25);
  warstwa(h, PRZED); h.mesh.position.z = ref.mesh.position.z + 0.05;
  await h.moveTo(ref.mesh.position.x + (ref.mesh.position.x > 1.5 ? -0.45 : 0.45), r.bottom + ih / 2 - 0.35 + oy, 0.3);
}
// three hiding places on the floor
async function kryjowki(c, nazwy, { y = -1.75, xs = [-1.7, 0.4, 2.5], size = 2.0 } = {}) {
  const out = [];
  for (const [i, n] of nazwy.entries()) out.push(await c.object(n, { x: xs[i], y, size }));
  return out;
}
const wejdzWszyscy = (c) => Promise.all(["jez", "zajac", "mis"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));

export default {
  id: "front_back",
  przejscia: true,
  nagrody: true,
  characters: { jez: { side: "left", x: -4.9 }, zajac: { side: "left", x: -3.1 }, mis: { side: "right", x: 4.7 } },
  backgrounds: { story: "las", practice: { kolor: "#eaf2e6", motyw: "liscie" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the forest: Bear counts (an illustration); Bunny "hides" in front of the bush; an insert shows in front /
      // behind with the duckling; the child hides the mouse behind the bush
      async (c) => {
        const S = c.stage;
        await wejdzWszyscy(c);
        await c.ujecie("dwuujecie", { na: ["jez", "zajac"] });
        await c.say("jez", "line.a_chowany", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.a_licze", { anim: "Zgloszenie" });
        // the seeker counting: Bear at the tree, Bunny in front of a bush with his eyes shut
        const il = await c.ilustracja("mis_liczy", { ruch: "w_prawo" });
        await c.say("mis", "line.a_raz_dwa");
        S.puppets.zajac.korzen.position.x = -0.6;                         // under the picture: Bunny went to the bush
        const krzak = await c.object("krzak", { x: -0.6, y: -1.75, size: 2.2, cicho: true });
        await il.zsun();
        await c.ujecie("sredni", { na: ["zajac", krzak] });               // Bunny "hidden" in front of the bush, eyes shut
        await c.say("zajac", "line.a_nie_widac", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "mis" });                       // the surprise: he is seen at once
        await c.emocja("mis", "wykrzyknik");
        await c.say("mis", "line.a_widze", { anim: "Wskazanie" });
        await c.ujecie("dwuujecie", { na: ["jez", "zajac"] });
        await c.say("jez", "line.a_przed", { anim: "Zgloszenie" });
        await c.wonder("zajac");
        await c.say("zajac", "line.a_jak");
        // the method on a plain colour: the duckling in front of the bush (all of her), then behind it (only her head)
        await c.go({ kolor: "#e6f0dc", motyw: "liscie" }, { ciecie: true });
        const kr = await c.object("krzak", { x: 0.4, y: -1.5, size: 2.4 });
        const kd = await c.object("kaczatko_stoi", { x: 0.4, y: -2.45, size: 1.15 });
        warstwa(kd, PRZED); kd.mesh.position.z = kr.mesh.position.z + 0.05;
        await c.ujecie("sredni", { na: ["jez", kr, kd] });
        await c.say("jez", "line.a_pokaz", { anim: "Wskazanie" });
        await kd.moveTo(2.4, -2.3, c.fast ? 0.2 : 0.7);                    // round the side of the bush...
        warstwa(kd, ZA); kd.mesh.position.z = kr.mesh.position.z - 0.05;
        await kd.moveTo(0.9, zaY(c, kd, kr, 0.3), c.fast ? 0.2 : 0.8);    // ...and in behind it
        await c.say("jez", "line.a_za");
        await c.ujecie("zblizenie", { na: "zajac" });                     // he gets it
        await c.say("zajac", "line.a_rozumiem", { anim: "Podskok" });
        // back in the forest: Bunny runs off to hide; the child hides the mouse behind the bush
        await c.go("las", { ciecie: true });
        const krzak2 = await c.object("krzak", { x: -0.6, y: -1.75, size: 2.2 });
        await c.ujecie("ogolny");
        await c.walkTo("zajac", 7.5); S.puppets.zajac.korzen.visible = false;
        const mysz = await c.object("mysz", { x: 2.4, y: -1.9, size: 1.1 });
        await c.say("jez", "line.a_schowaj_mysz");
        await c.place({ item: mysz, ref: krzak2, want: "za", wrong: "line.a_mysz_nie" });
        await c.ujecie("sredni", { na: ["mis", krzak2] });
        await c.say("mis", "line.a_mysz_ok");
        c.clear();
        // the seeking: what peeks out from behind the stump, the bush, the stone?
        await c.ujecie("ogolny");
        const k = await kryjowki(c, tasuj(["krzak", "pniak", "glaz"]));
        const [kz, kk] = tasuj(k.slice()).slice(0, 2);
        const zaj = await schowaj(c, "zajac", kz, { size: 1.5, widac: 0.32 }), kacz = await schowaj(c, "kaczatko_stoi", kk, { size: 1.1, widac: 0.3 });
        await c.say("mis", "line.a_szukaj");
        await c.say("mis", "line.a_gdzie_zajac");
        dobre(kz); await c.task({ targets: k, correct: kz, wrong: "line.a_gdzie_zajac_nie" }); dobre(kz, false);
        await wyskocz(c, zaj, kz);
        await c.rozblysk(zaj);
        await c.ujecie("sredni", { na: ["mis", zaj] });
        await c.say("mis", "line.a_mam_zajaca", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await c.say("mis", "line.a_gdzie_kaczka");
        dobre(kk); await c.task({ targets: k, correct: kk, wrong: "line.a_gdzie_kaczka_nie" }); dobre(kk, false);
        await wyskocz(c, kacz, kk);
        await c.rozblysk(kacz);
        await c.ujecie("sredni", { na: ["jez", kacz] });
        await c.say("jez", "line.a_znalezione", { anim: "Radosc" });
        c.clear();
        S.puppets.zajac.korzen.position.x = -3.1;
        await c.enter("zajac");
        await c.ujecie("zblizenie", { na: "zajac" });                     // a laugh at himself
        await c.say("zajac", "line.a_wracam", { anim: "Podskok" });
        // the breather: one more round where nothing peeks out - Bear finds them by their voices
        await c.ujecie("dwuujecie", { na: ["jez", "mis"] });
        await c.say("jez", "line.a_jeszcze", { anim: "Zgloszenie" });
        await c.say("mis", "line.a_sluchaj");
        await c.ujecie("ogolny");                                         // the bushes and the hiding: wide
        await c.ktoPowiedzial({ gospodarz: "mis", kryjowki: ["jez", "zajac"] });
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.a_po_glosie", { anim: "Brawo" });
        // the little forest animals hide too: each BEHIND something, a tail, ears or eyes showing (tools/roznice chowany_las)
        await c.ujecie("ogolny");
        await c.say("mis", "line.a_zwierzatka");
        const wl = await c.szukaj("chowany_las", { y: 0.3, size: 6.0, luneta: false });
        await c.say("jez", "line.a_zwierzatka_ok", { anim: "Radosc" });
        wl.remove();
      },
      // B. the meadow, Mouse's little house: "in front of the house - behind the house"; who stands in front, who behind
      async (c) => {
        await c.go("laka", { enter: true });
        await wejdzWszyscy(c);
        await c.ujecie("ogolny");
        const dom = await c.object("domek", { x: 0.6, y: -1.0, size: 2.7 });
        await c.say("jez", "line.b_zabawa", { anim: "Podskok" });          // the arrival: the house in the wide shot
        const misiu = await c.object("misiu", { x: 2.9, y: -2.4, size: 1.0 });
        await c.say("jez", "line.b_przed");
        await c.place({ item: misiu, ref: dom, want: "przed", wrong: "line.b_przed_nie" });
        await c.ujecie("sredni", { na: ["zajac", dom, misiu] });
        await c.say("zajac", "line.b_przed_ok");
        await c.ujecie("ogolny");
        await c.say("jez", "line.b_za");
        await c.place({ item: misiu, ref: dom, want: "za", wrong: "line.b_za_nie" });
        await c.ujecie("sredni", { na: ["zajac", dom] });
        await c.say("zajac", "line.b_za_ok", { anim: "Radosc" });
        c.clear();
        // who is in front of the house and who behind it?
        await c.ujecie("ogolny");
        const dom2 = await c.object("domek", { x: 0.6, y: -0.9, size: 2.7 });
        const za = await schowaj(c, "kura", dom2, { size: 1.2, widac: 0.35, dx: -0.5 });
        const przed = await c.object("pilka", { x: 1.2, y: -2.35, size: 0.9 });
        await c.say("mis", "line.b_co_przed");
        dobre(przed); await c.task({ targets: [za, przed], correct: przed, wrong: "line.b_co_przed_nie" }); dobre(przed, false);
        await c.say("zajac", "line.b_co_przed_ok", { anim: "Kiwanie" });   // the answer still in the wide shot
        await c.say("mis", "line.b_co_za");
        dobre(za); await c.task({ targets: [za, przed], correct: za, wrong: "line.b_co_za_nie" }); dobre(za, false);
        await c.rozblysk(za);
        await c.ujecie("sredni", { na: ["jez", dom2, przed] });
        await c.say("jez", "line.b_koniec", { anim: "Radosc" });
        c.clear();
      },
      // C. the mouse hid again: Bunny's photo shows her ears behind the hedge; in the garden maze Hedgehog finds her
      async (c) => {
        const S = c.stage;
        await c.ujecie("zblizenie", { na: "mis" });
        await c.wonder("mis");
        await c.emocja("mis", "pot", { anim: "Rozgladanie" });
        await c.say("mis", "line.c_gdzie_mysz");
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.emocja("zajac", "zarowka", { anim: "Zgloszenie" });
        await c.say("zajac", "line.c_zdjecie");
        await c.ujecie("ogolny");
        const foto = await c.znalezisko("zdjecie_chowany", { skad: "zajac" });
        await c.say("mis", "line.c_zdjecie_gdzie");
        dobre(foto.cele); await c.task({ targets: [...foto.cele, foto.tlo], correct: foto.cele[0], wrong: "line.c_zdjecie_nie" }); dobre(foto.cele, false);
        await foto.zaznacz();
        await c.say("jez", "line.c_zdjecie_tak", { anim: "Wskazanie" });
        await c.say("zajac", "line.c_ogrod", { anim: "Podskok" });
        await foto.remove();
        // the garden with the hedge maze
        await c.go("ogrod_labirynt", { enter: true });
        await wejdzWszyscy(c);
        await c.play("jez", "Rozgladanie");
        await c.say("jez", "line.c_labirynt", { anim: "Radosc" });   // the wide shot: the maze's hedges and arch in view
        await c.ujecie("dwuujecie", { na: ["jez", "mis"] });
        await c.emocja("mis", "smutek", { anim: "Smutek" });
        await c.say("mis", "line.c_za_duzy");
        await c.say("jez", "line.c_ide", { anim: "Podskok" });
        await c.ujecie("ogolny");
        await c.przejdz("jez", [[ARKADA.x, ARKADA.y]]);              // into the picture, to the maze's arch
        await c.say("jez", "line.c_prowadz");
        const lab = c.labirynt("labirynt_chowany", { pionek: "jez", cel: "mysz" });
        await c.wait(0.4); S.puppets.jez.korzen.visible = false;      // under the maze now, its pawn walks for him
        const l = await lab;
        S.puppets.jez.korzen.visible = true;
        await l.remove();
        // out they come: the mouse beside Hedgehog at the arch, both walk to the front
        const mysz = await c.object("mysz", { x: ARKADA.x + 0.7, y: ARKADA.y + 0.35, size: 0.6 });
        await c.rozblysk(mysz);
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.c_znaleziona", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const s0 = mysz.base, s1 = 1.1;
        await Promise.all([c.przejdz("jez", [[-1.2, PODLOGA]]), mysz.moveTo(-0.1, PODLOGA + s1 * 0.45, 1.0), S.tween(1.0, (q) => { mysz.base = s0 + (s1 - s0) * q; mysz.mesh.scale.setScalar(mysz.base); })]);
        await c.ujecie("sredni", { na: ["jez", mysz] });
        await c.say("jez", "line.c_koniec", { anim: "Brawo" });
        // Bunny's invitation: the rematch at his house (the home stage)
        await c.ujecie("dwuujecie", { na: ["zajac", "mis"] });
        await c.say("zajac", "line.c_rewanz", { anim: "Podskok" });
        c.clear();
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("jez"); c.show("mis");
        S.puppets.jez.korzen.position.x = -5.2; S.puppets.mis.korzen.position.x = 5.1;
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("dwuujecie", { na: ["jez", "mis"] });
        await c.say("jez", "line.p_start", { anim: "Radosc" });
        // 1. the mouse behind the box
        {
          await c.ujecie("ogolny");
          const p = await c.object("pudelko", { x: -0.4, y: -1.2, size: 2.2 }), m = await c.object("mysz", { x: 2.6, y: -1.9, size: 1.1 });
          await c.say("mis", "line.p_mysz"); await c.place({ item: m, ref: p, want: "za", wrong: "line.p_mysz_nie" });
          await c.ujecie("sredni", { na: ["jez", p] });
          await c.say("jez", "line.p_mysz_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 2. the duckling in front of the basket
        {
          await c.ujecie("ogolny");
          const k = await c.object("koszyk", { x: -0.4, y: -1.0, size: 2.2 }), d = await c.object("kaczatko_stoi", { x: 2.6, y: -1.9, size: 1.0 });
          await c.say("jez", "line.p_kaczka"); await c.place({ item: d, ref: k, want: "przed", wrong: "line.p_kaczka_nie" });
          await c.ujecie("sredni", { na: ["mis", k, d] });
          await c.say("mis", "line.p_kaczka_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 3. whose ears / comb peek out from behind the bush? (nobody who stands on screen)
        {
          await c.ujecie("ogolny");
          const kr = await c.object("krzak", { x: 0, y: 0.9, size: 2.4 });
          const kto = tasuj(["zajac", "kura"])[0];
          const ukryty = await schowaj(c, kto, kr, { size: 1.6, widac: 0.3 });
          const op = []; for (const [i, n] of tasuj(["zajac", "kura", "kaczatko_stoi"]).entries()) op.push(await c.object(n, { x: -2.0 + i * 2.0, y: -2.0, size: 1.2, plik: n === kto ? ukryty.plik : null }));
          await c.say("mis", "line.p_kto");
          const ok = op.find((h) => h.name === kto);
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_kto_nie" });
          await c.ujecie("sredni", { na: ["jez", kr, ok] });
          await c.say("jez", kto === "zajac" ? "line.p_kto_zajac" : "line.p_kto_kura", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 4. what is in front of the armchair?
        {
          await c.ujecie("ogolny");
          const f = await c.object("fotel", { x: 0, y: -0.6, size: 2.8 });
          const za = await schowaj(c, "misiu", f, { size: 1.2, widac: 0.35, dx: 0.6 });
          const przed = await c.object("klocek", { x: -0.6, y: -1.95, size: 0.9 });
          await c.say("jez", "line.p_fotel");
          dobre(przed); await c.task({ targets: [za, przed], correct: przed, wrong: "line.p_fotel_nie" });
          await c.ujecie("sredni", { na: ["mis", f, przed] });
          await c.say("mis", "line.p_fotel_ok", { anim: "Kiwanie" }); gw.dodaj(); c.clear();
        }
        // 5. hide the bunny behind the big stone
        {
          await c.ujecie("ogolny");
          const g = await c.object("glaz", { x: -0.4, y: -1.3, size: 2.4 }), z = await c.object("zajac", { x: 2.6, y: -1.7, size: 1.3 });
          await c.say("mis", "line.p_glaz"); await c.place({ item: z, ref: g, want: "za", wrong: "line.p_glaz_nie" });
          await c.ujecie("sredni", { na: ["jez", g] });
          await c.say("jez", "line.p_glaz_ok", { anim: "Radosc" }); gw.dodaj();
        }
        await c.praise("jez");
      },
    ],
    apply: [
      // home - the third act, Bunny's rematch in his room: his teddy "hidden" in front of the armchair (the forest
      // mistake again) - the child hides it; Bunny behind the curtain - the child finds him, the payoff seen; the toys
      // onto the rug in front of the armchair (the painted rug = a drop place); Bunny's pictures of the day in order
      // (an insert); the home game shown in play
      async (c) => {
        const S = c.stage;
        const POZ = { jez: -4.9, zajac: -3.3, mis: 4.8 };
        for (const n of Object.keys(POZ)) c.show(n);
        for (const [n, x] of Object.entries(POZ)) S.puppets[n].korzen.position.x = x;
        await c.wait(0.3);
        const m = await c.miejsca();
        await c.ujecie("ogolny");
        const [pud, fotel, zaslona] = await kryjowki(c, ["pudelko", "fotel", "zaslona"], { y: -0.85, xs: [-1.6, 0.5, 2.7], size: 2.3 });
        await c.say("zajac", "line.h_dom", { anim: "Radosc" });
        // the misconception again: the teddy "hidden" in front of the armchair with his eyes shut
        const misiu = await c.object("misiu", { x: -1.9, y: -3.0, size: 0.95 });
        warstwa(misiu, PRZED); misiu.mesh.position.z = fotel.mesh.position.z + 0.05;
        await misiu.moveTo(0.5, -1.85, c.fast ? 0.2 : 0.8);                // over the armchair's lower part: in front of it
        await c.ujecie("sredni", { na: ["zajac", fotel, misiu] });
        await c.say("zajac", "line.h_przytulanka", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["jez", "zajac", fotel, misiu] });  // the two of them and what they talk about
        await c.wonder("jez");
        await c.say("jez", "line.h_znowu");
        await c.ujecie("zblizenie", { na: "zajac" });                     // caught again: a laugh
        await c.say("zajac", "line.h_ojej", { anim: "Kiwanie" });
        // 1. the child hides the teddy behind the armchair
        await c.ujecie("ogolny");
        await c.say("jez", "line.h_schowaj", { anim: "Zgloszenie" });
        misiu.home = { x: misiu.mesh.position.x, y: misiu.mesh.position.y };
        await c.place({ item: misiu, ref: fotel, want: "za", wrong: "line.h_schowaj_nie" });
        await c.ujecie("sredni", { na: ["zajac", fotel] });
        await c.say("zajac", "line.h_schowany", { anim: "Kiwanie" });
        // 2. Bear counts, Bunny slips behind the curtain (his feet peek out); the child points where he hides
        await c.ujecie("ogolny");
        await Promise.all([c.say("mis", "line.h_licze", { anim: "Zgloszenie" }), c.walkTo("zajac", zaslona.mesh.position.x)]);
        S.puppets.zajac.korzen.visible = false; if (S.puppets.zajac.cien) S.puppets.zajac.cien.visible = false;
        const stopy = await podZaslona(c, "zajac", zaslona, { size: 1.7, wystaje: 0.42 });
        await c.ujecie("sredni", { na: ["mis", fotel, pud] });
        await c.emocja("mis", "pot", { anim: "Rozgladanie" });
        await c.say("mis", "line.h_szukam");
        await c.ujecie("ogolny");
        await c.say("mis", "line.h_gdzie");
        const cele = [pud, fotel, zaslona];
        dobre(zaslona); await c.task({ targets: cele, correct: zaslona, wrong: "line.h_gdzie_nie" }); dobre(cele, false);
        stopy.remove();
        S.puppets.zajac.korzen.position.x = zaslona.mesh.position.x - 1.3;
        S.puppets.zajac.korzen.visible = true; if (S.puppets.zajac.cien) S.puppets.zajac.cien.visible = true;
        c.sfx("hop"); c.play("zajac", "Podskok");
        await c.rozblysk("zajac");
        await c.ujecie("dwuujecie", { na: ["mis", "zajac"] });
        await c.say("mis", "line.h_za_zaslona", { anim: "Radosc" });
        // the payoff, seen: Bunny hid well at last
        const il = await c.ilustracja("zajac_za_zaslona", { ruch: "najazd" });
        await c.say("zajac", "line.h_wygralem");
        await il.zsun();
        // 3. tidying up: the toys onto the rug in front of the armchair, where everybody sees them
        await c.ujecie("ogolny");                                         // first: the wide shot undoes the two-shot's step
        await c.walkTo("zajac", POZ.zajac);
        // the painted rug's front strip, right in front of the armchair (the rest of the rug lies before the box and curtain)
        const fb = c.bounds(fotel), dol = m.dywan.y - m.dywan.h / 2;
        const dyw = await c.zone({ x: fotel.mesh.position.x, y: (fb.bottom + dol) / 2, w: 2.6, h: Math.max(0.8, fb.bottom - dol + 0.3), name: "miejsce_dywan", niewidoczna: true, rodzaj: "lezy" });
        dyw.want = "dywan";
        const zab = [];
        for (const [n, x, y, r] of [["pilka", -1.2, 1.6, 0], ["klocek", 0.6, 1.7, 0.4]]) {
          const h = await c.object(n, { x, y, size: 0.9 }); h.mesh.rotation.z = r; h.tag = "dywan"; zab.push(h);
        }
        await c.say("zajac", "line.h_pilka", { anim: "Zgloszenie" });
        await c.sort({ items: zab, zones: [dyw], wrong: "line.h_pilka_nie" });
        for (const h of zab) { warstwa(h, PRZED); h.mesh.position.z = fotel.mesh.position.z + 0.05; }
        await c.ujecie("sredni", { na: ["mis", fotel, ...zab] });
        await c.say("mis", "line.h_dobrze", { anim: "Kiwanie" });
        // 4. Bunny's pictures of the day, mixed up: in order, on a plain colour
        await c.ujecie("dwuujecie", { na: ["zajac", "jez"] });
        await c.say("zajac", "line.h_obrazki", { anim: "Smutek" });
        await c.go({ kolor: "#eef0dc", motyw: "kola" }, { ciecie: true });
        await c.ujecie("ogolny");
        await c.say("jez", "line.h_obrazki_uloz");
        const h = await c.historyjka("dzien_chowanego", { size: 1.9, wrong: "line.h_obrazki_nie" });
        await c.ujecie("sredni", { na: ["zajac", ...h.karty] });
        await c.say("zajac", "line.h_obrazki_ok", { anim: "Radosc" });
        h.remove();
        // 5. the home game, shown in play: Hedgehog hides the mouse behind the box, the ball in front; Bunny guesses
        await c.go("pokoj", { ciecie: true });
        await c.ujecie("ogolny");
        const pud2 = await c.object("pudelko", { x: 0.4, y: -1.3, size: 2.3 });
        await c.say("jez", "line.h_gra", { anim: "Zgloszenie" });
        const mysz = await c.object("mysz", { x: -2.0, y: -2.6, size: 1.2 });
        await mysz.moveTo(2.4, -2.4, c.fast ? 0.2 : 0.6);                  // round the side of the box...
        warstwa(mysz, ZA); mysz.mesh.position.z = pud2.mesh.position.z - 0.05;
        await mysz.moveTo(0.6, zaY(c, mysz, pud2, 0.4), c.fast ? 0.2 : 0.7);    // ...and in behind it, her ears out
        const pil = await c.object("pilka", { x: -0.3, y: -2.55, size: 0.85 });
        warstwa(pil, PRZED); pil.mesh.position.z = pud2.mesh.position.z + 0.05;
        await c.ujecie("sredni", { na: ["zajac", pud2, mysz, pil] });
        await c.say("zajac", "line.h_gra_zgaduje", { anim: "Wskazanie" });
        await c.ujecie("dwuujecie", { na: ["jez", "zajac"] });            // the home game, said to the parents
        await c.say("jez", "line.h_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
