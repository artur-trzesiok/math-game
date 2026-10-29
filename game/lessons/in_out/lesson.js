// Lesson: inside and outside - a closed fence makes an inside, a gap lets things out; next to is not inside. The evening
// before the storm, Hedgehog wants everybody home: Beaver's fence has a gap and a hen walks out (an insert shows why),
// the child draws a closed one (zagroda); Beaver's duckling "in" the basket is next to it; who is still outside the
// circle; the thunder (an illustration) scares the duckling off and the child leads it home through the bushes (a maze);
// in the warm burrow the window steams up and the child draws on it (the breather) - the storm stays outside. At home,
// the third act: the toys into the box, the basket on the rug (Beaver's "next to is in" again), the guessing game, the
// duckling's evening as a story strip, into the basket and good night (seen). Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const elipsa = (cx, cy, rx, ry, od = 0, do_ = 2 * Math.PI, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = od + ((do_ - od) * i) / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });

// a thing put "in" a container peeks out of it: drawn behind its rim, a little higher
async function wSrodku(h, ref, dy = 0.35) {
  h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9.95; });
  h.mesh.position.z = ref.mesh.position.z - 0.05;
  await h.moveTo(ref.mesh.position.x, ref.mesh.position.y + dy, 0.25);
}

const kurki = async (c) => { const out = []; for (const [x, y] of [[0.2, -0.4], [1.7, -0.9], [0.7, -1.8]]) out.push(await c.object("kura", { x, y, size: 1.05 })); return out; };

export default {
  id: "in_out",
  przejscia: true,
  nagrody: true,
  characters: { jez: { side: "left", x: -4.8 }, bobr: { side: "left", x: -3.1 }, sarenka: { side: "right", x: 4.7 } },
  backgrounds: { story: "laka_burza", practice: { kolor: "#eef3e3", motyw: "kola" }, apply: "pokoj_noc" },
  stages: {
    story: [
      // A. the meadow: the hens out; Beaver's fence with a gap (an insert: why a gap lets them out); the child closes a
      // fence; the duckling next to the basket
      async (c) => {
        await Promise.all(["jez", "bobr", "sarenka"].map((n) => c.enter(n, n === "sarenka" ? "right" : "left")));
        c.czastki("liscie", { wiatr: 1.2, gestosc: 0.4 });
        await c.ujecie("zblizenie", { na: "jez" });                          // worried: the storm
        await c.say("jez", "line.a_burza", { anim: "Smutek" });
        await c.ujecie("ogolny");                                            // the hens come in across the meadow
        const kury = await kurki(c);
        await c.say("jez", "line.a_kurki");
        await c.ujecie("dwuujecie", { na: ["bobr", "jez"] });
        await c.say("bobr", "line.a_plot", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the fence is drawn round the hens
        const plot = await c.plot(elipsa(0.9, -1.05, 1.95, 1.25, 0.5, 2 * Math.PI - 0.5), { zamkniety: false });
        await c.say("bobr", "line.a_gotowe", { anim: "Radosc" });
        const uc = kury[1];
        await uc.moveTo(3.4, -0.9, 0.9);                                     // out through the gap, in the wide shot
        await c.ujecie("zblizenie", { na: "jez" });
        await c.emocja("jez", "wykrzyknik", { anim: "Smutek" });
        await c.say("jez", "line.a_uciekla");
        // the method on a plain colour: a ring with a gap lets the hen out, a closed ring keeps her in
        await c.go({ kolor: "#eef3e3", motyw: "kola" }, { ciecie: true });
        const otw = await c.line(elipsa(0.6, -1.3, 1.6, 1.0, 0.45, 2 * Math.PI - 0.45), { width: 0.09, duration: 0.6, strong: true });
        const kura = await c.object("kura", { x: 0.4, y: -1.3, size: 1.0 });
        await c.ujecie("sredni", { na: ["sarenka", otw, kura] });
        await kura.moveTo(3.0, -1.3, c.fast ? 0.2 : 1.2);
        await c.say("sarenka", "line.a_dziura", { anim: "Kiwanie" });
        await kura.moveTo(0.4, -1.3, c.fast ? 0.2 : 0.8);
        const domk = await c.line(elipsa(0.6, -1.3, 1.6, 1.0, -0.47, 0.47, 8), { width: 0.09, duration: 0.4, strong: true });
        await kura.moveTo(1.6, -1.3, 0.4); await kura.moveTo(0.4, -1.3, 0.5);   // bumps into the closed fence and stays
        await c.say("sarenka", "line.a_zamkniety");
        await c.ujecie("zblizenie", { na: "bobr" });                         // he gets it
        await c.say("bobr", "line.a_aha", { anim: "Kiwanie" });
        otw.remove(); domk.remove(); kura.remove();
        await c.go("laka_burza", { ciecie: true });
        c.czastki("liscie", { wiatr: 1.2, gestosc: 0.4 });
        const kury2 = await kurki(c);
        await c.ujecie("ogolny");
        await c.say("jez", "line.a_narysuj");
        await c.zagroda({ rzeczy: kury2, wrong: "line.a_nie_wszystkie", otwarta: "line.a_otwarta" });
        await c.ujecie("zblizenie", { na: "jez" });                          // thank you
        await c.say("jez", "line.a_w_srodku", { anim: "Radosc" });
        c.clear();
        // next to is not inside
        const kosz = await c.object("koszyk", { x: 0.4, y: -1.3, size: 1.9 }), kacz = await c.object("kaczatko_stoi", { x: 2.4, y: -1.3, size: 1.0 });
        await c.ujecie("sredni", { na: ["bobr", kosz, kacz] });
        await c.say("bobr", "line.a_kaczuszka", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["sarenka", kosz, kacz] });
        await c.wonder("sarenka");
        await c.say("sarenka", "line.a_obok");
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.a_wloz");
        await c.place({ item: kacz, ref: kosz, want: "w", wrong: "line.a_wloz_nie" });
        await wSrodku(kacz, kosz);
        await c.ujecie("sredni", { na: ["bobr", kosz] });
        await c.say("bobr", "line.a_teraz_w_srodku", { anim: "Kiwanie" });
        c.clear();
      },
      // B. a game in a circle on the grass: who is still outside? the rain and the thunder (an illustration) - the
      // duckling runs off, the child leads it home through the bushes (labirynt); the warm burrow, the steamy window
      // (the breather: drawing on it shows the storm outside)
      async (c) => {
        const S = c.stage;
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.say("sarenka", "line.b_zabawa", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const kolko = await c.line(elipsa(0.6, -3.05, 1.9, 0.5), { width: 0.09, duration: 0.6, strong: true });
        await c.say("sarenka", "line.b_wskakujcie");
        await Promise.all([c.walkTo("bobr", -0.3), c.walkTo("sarenka", 1.5)]);
        await c.say("sarenka", "line.b_kto");
        const cele = ["jez", "bobr", "sarenka"].map((n) => S.puppets[n]);
        dobre(cele, false); dobre(S.puppets.jez); await c.task({ targets: cele, correct: S.puppets.jez, wrong: "line.b_kto_nie" }); dobre(cele, false);
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.b_biegne", { anim: "Podskok" });
        await c.ujecie("ogolny");
        await c.walkTo("jez", -1.9);
        await c.say("bobr", "line.b_wszyscy", { anim: "Radosc" });           // all three inside the circle, in the shot
        kolko.remove();
        c.czastki("deszcz");
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.emocja("sarenka", "mokro");
        await c.say("sarenka", "line.b_deszcz");
        // the thunder: the duckling jumps out of the basket and runs off into the bushes
        await c.ujecie("ogolny");
        const kosz = await c.object("koszyk", { x: 3.0, y: -2.2, size: 1.5 }), kacz = await c.object("kaczatko_stoi", { x: 3.0, y: -2.2, size: 0.85 });
        await wSrodku(kacz, kosz);
        await c.wait(0.6);
        c.sfx("whoosh");
        const il = await c.ilustracja("grzmot_kaczuszka", { ruch: "najazd" });
        await c.say("bobr", "line.b_grzmot");
        kacz.remove(); kosz.mesh.rotation.z = 1.2;                          // the basket tipped over, empty
        await il.zsun();
        await c.ujecie("sredni", { na: ["jez", kosz] });
        await c.say("jez", "line.b_krete");
        await c.ujecie("dwuujecie", { na: ["sarenka", "jez"] });
        await c.say("sarenka", "line.b_poprowadzmy", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        kosz.remove();
        await c.say("sarenka", "line.b_labirynt");
        const lab = await c.labirynt("sciezki_do_norki", { pionek: "kaczatko_stoi", cel: "drzwiczki" });
        await lab.remove();
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.b_kaczuszka_dom", { anim: "Podskok" });
        // the end of the story: inside Hedgehog's warm burrow, the storm seen through the round window
        await c.go("norka_burza", { enter: true });
        const kacz2 = await c.object("kaczatko_stoi", { x: -1.7, y: -2.7, size: 0.75 });
        await Promise.all(["jez", "bobr", "sarenka"].map((n) => c.enter(n, n === "sarenka" ? "right" : "left")));
        await c.ujecie("sredni", { na: ["bobr", kacz2] });
        await c.rozblysk(kacz2);
        await c.say("bobr", "line.b_kaczuszko", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.b_norka", { anim: "Radosc" });
        // the breather: the window steams up - draw on it with a finger, the storm shows outside
        await c.ujecie("dwuujecie", { na: ["sarenka", "jez"] });
        await c.emocja("sarenka", "wykrzyknik");
        await c.say("sarenka", "line.b_szyba");
        await c.ujecie("ogolny");
        await c.malowanie({ tlo: "szyba", zdrapka: "szyba_norki", kto: "sarenka" });
        await c.ujecie("dwuujecie", { na: ["sarenka", "bobr"] });
        await c.say("sarenka", "line.b_koniec", { anim: "Kiwanie" });
        await c.say("bobr", "line.b_potem");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("bobr"); c.show("sarenka");
        S.puppets.bobr.korzen.position.x = -5.2; S.puppets.sarenka.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("dwuujecie", { na: ["bobr", "sarenka"] });
        await c.say("sarenka", "line.p_start", { anim: "Radosc" });
        // 1. a fence around the sheep only, the wolf stays outside
        {
          await c.ujecie("ogolny");
          const r = [];
          for (const [x, y] of [[-2.4, 1.2], [-1.2, 0.2], [-2.6, -0.8]]) { const h = await c.object("owca", { x, y, size: 1.1 }); r.push(h); }
          r.push(await c.object("wilk", { x: 2.2, y: 0.4, size: 1.3 }));
          await c.say("bobr", "line.p_owce");
          await c.zagroda({ rzeczy: r, chcemy: (h) => h.name === "owca", wrong: "line.p_owce_nie", otwarta: "line.a_otwarta" });
          await c.say("sarenka", "line.p_owce_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 2. three apples into the basket
        {
          await c.ujecie("ogolny");
          const z = await c.zone({ x: 1.4, y: -1.3, w: 3.0, h: 1.8, image: "koszyk", name: "koszyk" }); z.want = "kosz";
          const j = []; for (let i = 0; i < 3; i++) { const h = await c.object("jablko", { x: -2.6 + i * 1.3, y: 1.4, size: 1.0 }); h.tag = "kosz"; j.push(h); }
          await c.say("sarenka", "line.p_jablka");
          await c.sort({ items: j, zones: [z] });
          await c.ujecie("sredni", { na: ["bobr", z] });
          await c.say("bobr", "line.p_jablka_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 3. which star is outside the circle?
        {
          await c.ujecie("ogolny");
          await c.line(elipsa(-0.2, 0.5, 2.2, 1.5), { width: 0.09, duration: 0.5, strong: true });
          for (const [x, y] of [[-1.0, 1.0], [0.5, 1.2], [-0.2, -0.1]]) await c.object("gwiazdka", { x, y, size: 0.9 });
          const [ox, oy] = tasuj([[3.0, 1.6], [2.9, -1.4], [-3.4, -1.6]])[0];
          const poza = await c.object("gwiazdka", { x: ox, y: oy, size: 0.9 });
          const gw4 = S.objects.filter((o) => o.name === "gwiazdka");
          await c.say("bobr", "line.p_poza");
          dobre(poza); await c.task({ targets: gw4, correct: poza, wrong: "line.p_poza_nie" });
          await c.say("sarenka", "line.p_poza_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 4. the shell game: which cup hides the ball?
        {
          await c.ujecie("ogolny");
          const k = await c.kubki({ ile: 3, x: 0, odstep: 2.2, rzeczy: tasuj(["pilka", null, null]) });
          await c.say("sarenka", "line.p_kubki");
          await c.wait(1.2); await k.przykryj(); await k.tasuj(4);
          const ok = k.kubki.find((q) => q.pod);
          await c.say("sarenka", "line.p_gdzie_pilka");
          dobre(ok); const hit = await c.task({ targets: k.kubki, correct: ok, wrong: "line.p_gdzie_pilka_nie", onWrong: async (h) => { await k.odkryj(h); await c.say("sarenka", "line.p_gdzie_pilka_nie"); await k.przykryj(); } });
          await k.odkryj(hit);
          await c.ujecie("sredni", { na: ["bobr", hit] });
          await c.say("bobr", "line.p_pilka_ok", { anim: "Radosc" }); gw.dodaj(); c.clear();
        }
        // 5. the goldfish into the bowl
        {
          const ak = await c.object("akwarium", { x: -0.6, y: 0.4, size: 2.4 }), ryba = await c.object("rybka", { x: 2.6, y: -1.4, size: 1.0 });
          await c.ujecie("ogolny");
          await c.say("bobr", "line.p_rybka");
          await c.place({ item: ryba, ref: ak, want: "w", wrong: "line.p_rybka_nie" });
          await c.ujecie("sredni", { na: ["sarenka", ak] });
          await c.say("sarenka", "line.p_rybka_ok", { anim: "Radosc" }); gw.dodaj();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // home - the third act, the night after the storm: everybody home and inside. The mess before bed; Beaver's "next
      // to is in" again with the teddy; the toys into the box, the duckling's basket on the rug (painted rug = a drop
      // place); the guessing game (which toy is outside the box?); the duckling's evening as a bedtime story strip (an
      // insert); the duckling into its basket; good night, seen
      async (c) => {
        const S = c.stage;
        const POZ = { jez: -4.7, bobr: -3.2, sarenka: 4.8 };
        for (const n of Object.keys(POZ)) c.show(n);
        for (const [n, x] of Object.entries(POZ)) S.puppets[n].korzen.position.x = x;
        await c.wait(0.4);
        const m = await c.miejsca();
        // the box and the scattered toys, the duckling and its empty basket
        const PUD = { x: 2.3, y: -2.3 };
        const pudz = await c.zone({ x: PUD.x, y: PUD.y, w: 2.4, h: 1.5, image: "pudelko", name: "pudelko" }); pudz.want = "pudlo";
        const zabawki = [];
        for (const [n, x, y, r] of [["misiu", -1.2, -2.3, 0.4], ["pilka", -0.4, -3.1, 0], ["klocek", 0.4, -1.8, -0.5], ["ksiazeczka", -0.4, -1.4, 0.3]]) {
          const h = await c.object(n, { x, y, size: 0.9 }); h.mesh.rotation.z = r; h.tag = "pudlo"; zabawki.push(h);
        }
        const kosz = await c.object("koszyk", { x: 0.8, y: -3.0, size: 1.1 }); kosz.tag = "dywan";
        const kacz = await c.object("kaczatko_stoi", { x: -1.6, y: -3.1, size: 0.9 });
        await c.ujecie("ogolny");
        await c.say("jez", "line.h_dom", { anim: "Radosc" });
        await c.emocja("jez", "pot");
        await c.say("jez", "line.h_zabawki");
        // the misconception again: Beaver stands the teddy NEXT to the box
        const mis = zabawki[0];
        mis.mesh.rotation.z = 0; await mis.moveTo(PUD.x - 1.6, -2.4, c.fast ? 0.2 : 0.8);
        await c.ujecie("sredni", { na: ["bobr", mis, pudz] });
        await c.say("bobr", "line.h_bobr_juz", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["sarenka", mis, pudz] });
        await c.wonder("sarenka");
        await c.say("sarenka", "line.h_obok");
        await c.ujecie("zblizenie", { na: "bobr" });                         // caught again: a laugh
        await c.say("bobr", "line.h_aha", { anim: "Kiwanie" });
        // 1. the toys into the box, the basket out on the rug
        await c.ujecie("ogolny");
        await c.say("jez", "line.h_sprzatnij", { anim: "Zgloszenie" });
        const dyw = await m.dywan.strefa(); dyw.want = "dywan";
        await c.sort({ items: [...zabawki, kosz], zones: [pudz, dyw], wrong: "line.h_sprzatnij_nie" });
        await c.say("sarenka", "line.h_w_pudle", { anim: "Radosc" });        // in the wide shot: box and rug both seen
        // 2. the guessing game, the home game shown in play: the ball out next to the box - which toy is outside?
        await c.ujecie("dwuujecie", { na: ["jez", "bobr"] });
        await c.say("jez", "line.h_gra", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const pil = zabawki[1];
        await pil.moveTo(PUD.x - 1.8, -2.9, c.fast ? 0.2 : 0.7);
        await c.say("jez", "line.h_gra_kto");
        dobre(zabawki, false); dobre(pil); await c.task({ targets: zabawki, correct: pil, wrong: "line.h_gra_nie" }); dobre(zabawki, false);
        await c.ujecie("sredni", { na: ["bobr", pil, pudz] });
        await c.say("bobr", "line.h_gra_ok", { anim: "Radosc" });
        await pil.moveTo(PUD.x, PUD.y + 0.2, 0.5);
        // 3. the bedtime story: the duckling's evening in order, on a plain night colour
        await kacz.moveTo(-0.9, -2.9, 0.4);
        await c.ujecie("sredni", { na: ["bobr", kacz] });
        await c.say("bobr", "line.h_bajka", { anim: "Kiwanie" });
        const gdzie = new Map(S.objects.map((o) => [o, [o.mesh.position.x, o.mesh.position.y, o.name, o.mesh.scale.x]]));
        await c.walkTo("bobr", -3.9);                                       // the cards on the floor need the room
        await c.go({ kolor: "#2c3358", motyw: "gwiazdki" }, { ciecie: true });
        await c.ujecie("ogolny");
        await c.say("jez", "line.h_bajka_uloz");
        const h = await c.historyjka("wieczor_kaczuszki", { size: 1.3, wrong: "line.h_bajka_nie" });
        await c.ujecie("sredni", { na: ["jez", ...h.karty] });
        await c.say("jez", "line.h_bajka_ok", { anim: "Kiwanie" });
        h.remove();
        // back in the room: the box with the toys, the basket on the rug, the duckling on the floor
        await c.go("pokoj_noc", { ciecie: true });
        await c.zone({ x: PUD.x, y: PUD.y, w: 2.4, h: 1.5, image: "pudelko", name: "pudelko" });
        let kosz2 = null;
        for (const [o, [x, y, n, sk]] of gdzie) {
          if (o === kacz || !["misiu", "pilka", "klocek", "ksiazeczka", "koszyk"].includes(n)) continue;
          const k = await c.object(n, { x, y, size: sk });                    // as small as the sort left them
          if (n === "koszyk") kosz2 = k;
        }
        const kacz2 = await c.object("kaczatko_stoi", { x: -0.9, y: -2.9, size: 0.9 });
        // 4. the duckling into its basket, to sleep
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.h_spac", { anim: "Zgloszenie" });
        await c.place({ item: kacz2, ref: kosz2, want: "w", wrong: "line.a_wloz_nie" });
        await wSrodku(kacz2, kosz2, 0.25);
        // the payoff, seen: everybody inside, asleep
        const il = await c.ilustracja("dobranoc_w_domu", { ruch: "najazd" });
        await c.say("bobr", "line.h_dobranoc");
        await il.zsun();
        await c.ujecie("sredni", { na: ["jez", pudz] });                     // the home game, said to the parents
        await c.say("jez", "line.h_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
