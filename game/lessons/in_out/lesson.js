// Lesson: inside and outside - a closed fence makes an inside, a gap lets things out; next to is not inside. The evening
// before the storm, Hedgehog wants everybody home: Beaver's fence has a gap and a hen walks out, the child draws a
// closed one (zagroda); Beaver's duckling "in" the basket is next to it; who is still outside in the rain; the shell
// game in the warm burrow. At home: toys into the toy box. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const elipsa = (cx, cy, rx, ry, od = 0, do_ = 2 * Math.PI, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = od + ((do_ - od) * i) / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });

// a thing put "in" a container peeks out of it: drawn behind its rim, a little higher
async function wSrodku(h, ref) {
  h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9.95; });
  h.mesh.position.z = ref.mesh.position.z - 0.05;
  await h.moveTo(ref.mesh.position.x, ref.mesh.position.y + 0.35, 0.25);
}

export default {
  id: "in_out",
  przejscia: true,
  nagrody: true,
  characters: { jez: { side: "left", x: -4.8 }, bobr: { side: "left", x: -3.1 }, sarenka: { side: "right", x: 4.7 } },
  backgrounds: { story: "laka", practice: { kolor: "#eef3e3", motyw: "kola" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the meadow: the hens out; Beaver's fence with a gap; the child closes a fence; the duckling next to the basket
      async (c) => {
        await Promise.all(["jez", "bobr", "sarenka"].map((n) => c.enter(n, n === "sarenka" ? "right" : "left")));
        await c.say("jez", "line.a_burza", { anim: "Smutek" });
        const kury = [];
        for (const [x, y] of [[0.2, -0.4], [1.7, -0.9], [0.7, -1.8]]) kury.push(await c.object("kura", { x, y, size: 1.05 }));
        await c.say("jez", "line.a_kurki");
        await c.say("bobr", "line.a_plot", { anim: "Zgloszenie" });
        const plot = await c.plot(elipsa(0.9, -1.05, 1.95, 1.25, 0.5, 2 * Math.PI - 0.5), { zamkniety: false });
        await c.say("bobr", "line.a_gotowe", { anim: "Radosc" });
        const uc = kury[1];
        await uc.moveTo(3.4, -0.9, 0.9);
        await c.emocja("jez", "wykrzyknik", { anim: "Smutek" });
        await c.say("jez", "line.a_uciekla");
        await c.say("sarenka", "line.a_dziura", { anim: "Kiwanie" });
        await c.say("sarenka", "line.a_zamkniety");
        plot.remove(); await uc.moveTo(1.7, -0.9, 0.6);
        await c.say("jez", "line.a_narysuj");
        await c.zagroda({ rzeczy: kury, wrong: "line.a_nie_wszystkie", otwarta: "line.a_otwarta" });
        await c.say("jez", "line.a_w_srodku", { anim: "Radosc" });
        c.clear();
        // next to is not inside
        const kosz = await c.object("koszyk", { x: 0.4, y: -1.3, size: 1.9 }), kacz = await c.object("kaczatko_stoi", { x: 2.4, y: -1.3, size: 1.0 });
        await c.say("bobr", "line.a_kaczuszka", { anim: "Radosc" });
        await c.wonder("sarenka");
        await c.say("sarenka", "line.a_obok");
        await c.say("sarenka", "line.a_wloz");
        await c.place({ item: kacz, ref: kosz, want: "w", wrong: "line.a_wloz_nie" });
        await wSrodku(kacz, kosz);
        await c.say("bobr", "line.a_teraz_w_srodku", { anim: "Kiwanie" });
        c.clear();
      },
      // B. a game in a circle on the grass: who is still outside? the rain - into the warm burrow, the shell game
      async (c) => {
        const S = c.stage;
        await c.say("sarenka", "line.b_zabawa", { anim: "Podskok" });
        const kolko = await c.line(elipsa(0.6, -3.05, 1.9, 0.5), { width: 0.09, duration: 0.6, strong: true });
        await c.say("sarenka", "line.b_wskakujcie");
        await Promise.all([c.walkTo("bobr", -0.3), c.walkTo("sarenka", 1.5)]);
        await c.say("sarenka", "line.b_kto");
        const cele = ["jez", "bobr", "sarenka"].map((n) => S.puppets[n]);
        dobre(cele, false); dobre(S.puppets.jez); await c.task({ targets: cele, correct: S.puppets.jez, wrong: "line.b_kto_nie" }); dobre(cele, false);
        await c.say("jez", "line.b_biegne", { anim: "Podskok" });
        await c.walkTo("jez", -1.9);
        await c.say("bobr", "line.b_wszyscy");
        kolko.remove();
        c.czastki("deszcz");
        await c.say("sarenka", "line.b_deszcz");
        await c.go("nora", { enter: true });
        await Promise.all(["jez", "bobr", "sarenka"].map((n) => c.enter(n, n === "sarenka" ? "right" : "left")));
        await c.say("jez", "line.b_norka", { anim: "Radosc" });
        await c.say("jez", "line.b_kubki");
        const k = await c.kubki({ ile: 3, x: 1.2, odstep: 2.0, rzeczy: tasuj(["zoledz", null, null]) });
        await c.wait(1.2); await k.przykryj(); await k.tasuj(4);
        const ok = k.kubki.find((q) => q.pod);
        await c.say("jez", "line.b_gdzie");
        dobre(ok); const hit = await c.task({ targets: k.kubki, correct: ok, wrong: "line.b_gdzie_nie", onWrong: async (h) => { await k.odkryj(h); await c.say("jez", "line.b_gdzie_nie"); await k.przykryj(); } });
        await k.odkryj(hit);
        await c.say("bobr", "line.b_jest", { anim: "Radosc" });
        await c.say("sarenka", "line.b_koniec");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("bobr"); c.show("sarenka");
        S.puppets.bobr.korzen.position.x = -5.2; S.puppets.sarenka.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("sarenka", "line.p_start", { anim: "Radosc" });
        // 1. a fence around the sheep only, the wolf stays outside
        {
          const r = [];
          for (const [x, y] of [[-2.4, 1.2], [-1.2, 0.2], [-2.6, -0.8]]) { const h = await c.object("owca", { x, y, size: 1.1 }); r.push(h); }
          r.push(await c.object("wilk", { x: 2.2, y: 0.4, size: 1.3 }));
          await c.say("bobr", "line.p_owce");
          await c.zagroda({ rzeczy: r, chcemy: (h) => h.name === "owca", wrong: "line.p_owce_nie", otwarta: "line.a_otwarta" });
          await c.say("sarenka", "line.p_dobrze"); gw.dodaj(); c.clear();
        }
        // 2. three apples into the basket
        {
          const z = await c.zone({ x: 1.4, y: -1.3, w: 3.0, h: 1.8, image: "koszyk", name: "koszyk" }); z.want = "kosz";
          const j = []; for (let i = 0; i < 3; i++) { const h = await c.object("jablko", { x: -2.6 + i * 1.3, y: 1.4, size: 1.0 }); h.tag = "kosz"; j.push(h); }
          await c.say("sarenka", "line.p_jablka");
          await c.sort({ items: j, zones: [z] });
          await c.say("bobr", "line.p_dobrze"); gw.dodaj(); c.clear();
        }
        // 3. which star is outside the circle?
        {
          await c.line(elipsa(-0.2, 0.5, 2.2, 1.5), { width: 0.09, duration: 0.5, strong: true });
          for (const [x, y] of [[-1.0, 1.0], [0.5, 1.2], [-0.2, -0.1]]) await c.object("gwiazdka", { x, y, size: 0.9 });
          const [ox, oy] = tasuj([[3.0, 1.6], [2.9, -1.4], [-3.4, -1.6]])[0];
          const poza = await c.object("gwiazdka", { x: ox, y: oy, size: 0.9 });
          const gw4 = S.objects.filter((o) => o.name === "gwiazdka");
          await c.say("bobr", "line.p_poza");
          dobre(poza); await c.task({ targets: gw4, correct: poza, wrong: "line.p_poza_nie" });
          await c.say("sarenka", "line.p_dobrze"); gw.dodaj(); c.clear();
        }
        // 4. the shell game: which cup hides the ball?
        {
          const k = await c.kubki({ ile: 3, x: 0, odstep: 2.2, rzeczy: tasuj(["pilka", null, null]) });
          await c.say("sarenka", "line.p_kubki");
          await c.wait(1.2); await k.przykryj(); await k.tasuj(4);
          const ok = k.kubki.find((q) => q.pod);
          await c.say("sarenka", "line.p_gdzie_pilka");
          dobre(ok); const hit = await c.task({ targets: k.kubki, correct: ok, wrong: "line.p_gdzie_pilka_nie", onWrong: async (h) => { await k.odkryj(h); await c.say("sarenka", "line.p_gdzie_pilka_nie"); await k.przykryj(); } });
          await k.odkryj(hit);
          await c.say("bobr", "line.p_dobrze"); gw.dodaj(); c.clear();
        }
        // 5. the goldfish into the bowl
        {
          const ak = await c.object("akwarium", { x: -0.6, y: 0.4, size: 2.4 }), ryba = await c.object("rybka", { x: 2.6, y: -1.4, size: 1.0 });
          await c.say("bobr", "line.p_rybka");
          await c.place({ item: ryba, ref: ak, want: "w", wrong: "line.p_rybka_nie" });
          await c.say("sarenka", "line.p_rybka_ok"); gw.dodaj(); c.clear();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // home: the toys back into the toy box before bed
      async (c) => {
        for (const n of ["jez", "sarenka"]) c.show(n);
        await c.say("jez", "line.h_zabawki", { anim: "Zgloszenie" });
        const z = await c.zone({ x: 0.6, y: -1.6, w: 3.2, h: 1.9, image: "pudelko", name: "pudelko" }); z.want = "pudlo";
        const t = []; for (const [i, n] of ["misiu", "pilka", "klocek", "ksiazeczka"].entries()) { const h = await c.object(n, { x: -2.2 + i * 1.5, y: 1.4, size: 1.1 }); h.tag = "pudlo"; t.push(h); }
        await c.sort({ items: t, zones: [z] });
        await c.say("sarenka", "line.h_w_pudle", { anim: "Radosc" });
        await c.say("jez", "line.h_rodzice");
      },
    ],
  },
};
