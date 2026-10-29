// Lesson: in front and behind - behind a thing you are hidden (only a bit peeks out), in front of it everybody sees
// you. Hide-and-seek in the forest: Bunny "hides" in front of the bush with his eyes shut; the child hides the mouse
// behind it, then seeks the friends by what peeks out; "in front of the house - behind the house". At home: the teddy
// behind the curtain. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// a thing hidden behind another: drawn under it, only its top `widac` (a fraction of its height) peeking out
async function schowaj(c, kto, ref, { size = 1.3, widac = 0.3, dx = 0 } = {}) {
  const h = await c.object(kto, { x: ref.mesh.position.x + dx, y: 0, size, cicho: true });
  const r = c.bounds(ref), b = c.bounds(h), ih = b.top - b.bottom, oy = h.mesh.position.y - (b.top + b.bottom) / 2;
  h.mesh.position.y = r.top + widac * ih - ih / 2 + oy; h.mesh.position.z = ref.mesh.position.z - 0.05;
  h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9.9; });
  h.home = { x: h.mesh.position.x, y: h.mesh.position.y };
  return h;
}
// found: it jumps out from behind and stands beside its hiding place
async function wyskocz(c, h, ref) {
  c.sfx("hop");
  const r = c.bounds(ref);
  await h.moveTo(h.mesh.position.x, r.top + 0.8, 0.25);
  h.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 10.2; }); h.mesh.position.z = ref.mesh.position.z + 0.05;
  await h.moveTo(r.right + 0.45, ref.mesh.position.y, 0.3);
}
// three hiding places on the floor; `kto` hidden behind some of them
async function kryjowki(c, nazwy, { y = -1.75, xs = [-1.7, 0.4, 2.5], size = 2.0 } = {}) {
  const out = [];
  for (const [i, n] of nazwy.entries()) out.push(await c.object(n, { x: xs[i], y, size }));
  return out;
}

export default {
  id: "front_back",
  przejscia: true,
  nagrody: true,
  characters: { jez: { side: "left", x: -4.9 }, zajac: { side: "left", x: -3.1 }, mis: { side: "right", x: 4.7 } },
  backgrounds: { story: "las", practice: { kolor: "#eaf2e6", motyw: "liscie" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the forest: Bear counts; Bunny "hides" in front of the bush; the child hides the mouse behind it
      async (c) => {
        const S = c.stage;
        await Promise.all(["jez", "zajac", "mis"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await c.ujecie("sredni", { na: ["jez", "zajac"] });
        await c.say("jez", "line.a_chowany", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_licze", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const krzak = await c.object("krzak", { x: -0.6, y: -1.75, size: 2.2 });
        await c.say("mis", "line.a_raz_dwa");
        await c.walkTo("zajac", -0.6);
        await c.ujecie("sredni", { na: ["zajac", krzak] });     // Bunny "hidden" in front of the bush: the bush in the shot
        await c.say("zajac", "line.a_nie_widac", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_widze", { anim: "Wskazanie" });
        await c.ujecie("sredni", { na: ["jez", "zajac", krzak] });
        await c.play("jez", "Radosc");
        await c.say("jez", "line.a_przed");
        await c.say("jez", "line.a_za", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_rozumiem");
        await c.ujecie("ogolny");
        await c.walkTo("zajac", 7.5); S.puppets.zajac.korzen.visible = false;
        // the child hides the mouse behind the bush
        const mysz = await c.object("mysz", { x: 2.4, y: -1.9, size: 1.1 });
        await c.say("jez", "line.a_schowaj_mysz");
        await c.place({ item: mysz, ref: krzak, want: "za", wrong: "line.a_mysz_nie" });
        await c.ujecie("sredni", { na: ["mis", krzak] });
        await c.say("mis", "line.a_mysz_ok");
        await c.ujecie("ogolny");
        c.clear();
        // the seeking: what peeks out from behind the stump, the bush, the stone?
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_szukaj");
        await c.ujecie("ogolny");
        const k = await kryjowki(c, tasuj(["krzak", "pniak", "glaz"]));
        const [kz, kk] = tasuj(k.slice()).slice(0, 2);
        const zaj = await schowaj(c, "zajac", kz, { size: 1.5, widac: 0.32 }), kacz = await schowaj(c, "kaczatko_stoi", kk, { size: 1.1, widac: 0.3 });
        await c.say("mis", "line.a_gdzie_zajac");
        dobre(kz); await c.task({ targets: k, correct: kz, wrong: "line.a_gdzie_zajac_nie" }); dobre(kz, false);
        await wyskocz(c, zaj, kz);
        await c.rozblysk(zaj);
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_mam_zajaca", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await c.say("mis", "line.a_gdzie_kaczka");
        dobre(kk); await c.task({ targets: k, correct: kk, wrong: "line.a_gdzie_kaczka_nie" }); dobre(kk, false);
        await wyskocz(c, kacz, kk);
        await c.rozblysk(kacz);
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.a_znalezione");
        await c.ujecie("ogolny");
        c.clear();
        await c.enter("zajac");
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_wracam", { anim: "Podskok" });
        await c.ujecie("ogolny");
      },
      // B. the meadow: "in front of the house - behind the house"; who stands in front, who behind
      async (c) => {
        await c.go("laka", { enter: true });
        await Promise.all(["jez", "zajac", "mis"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.b_zabawa", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const dom = await c.object("domek", { x: 0.6, y: -1.0, size: 2.7 });
        const misiu = await c.object("misiu", { x: 2.9, y: -2.4, size: 1.0 });
        await c.say("jez", "line.b_przed");
        await c.place({ item: misiu, ref: dom, want: "przed", wrong: "line.b_przed_nie" });
        await c.ujecie("sredni", { na: [dom, misiu] });
        await c.say("zajac", "line.b_przed_ok");
        await c.ujecie("ogolny");
        await c.say("jez", "line.b_za");
        await c.place({ item: misiu, ref: dom, want: "za", wrong: "line.b_za_nie" });
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.b_za_ok", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
        // who is in front of the house and who behind it?
        const dom2 = await c.object("domek", { x: 0.6, y: -0.9, size: 2.7 });
        const za = await schowaj(c, "kura", dom2, { size: 1.2, widac: 0.35, dx: -0.5 });
        const przed = await c.object("pilka", { x: 1.2, y: -2.35, size: 0.9 });
        await c.say("mis", "line.b_co_przed");
        dobre(przed); await c.task({ targets: [za, przed], correct: przed, wrong: "line.b_co_przed_nie" }); dobre(przed, false);
        await c.say("mis", "line.b_co_za");
        dobre(za); await c.task({ targets: [za, przed], correct: za, wrong: "line.b_co_za_nie" }); dobre(za, false);
        await c.rozblysk(za);
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.b_koniec", { anim: "Radosc" });
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("jez"); c.show("mis");
        S.puppets.jez.korzen.position.x = -5.2; S.puppets.mis.korzen.position.x = 5.1;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("jez", "line.p_start", { anim: "Radosc" });
        // 1. the mouse behind the box
        {
          const p = await c.object("pudelko", { x: -0.4, y: -1.2, size: 2.2 }), m = await c.object("mysz", { x: 2.6, y: -1.9, size: 1.1 });
          await c.say("mis", "line.p_mysz"); await c.place({ item: m, ref: p, want: "za", wrong: "line.p_mysz_nie" });
          await c.ujecie("zblizenie", { na: "jez" });
          await c.say("jez", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 2. the duckling in front of the basket
        {
          const k = await c.object("koszyk", { x: -0.4, y: -1.0, size: 2.2 }), d = await c.object("kaczatko_stoi", { x: 2.6, y: -1.9, size: 1.0 });
          await c.say("jez", "line.p_kaczka"); await c.place({ item: d, ref: k, want: "przed", wrong: "line.p_kaczka_nie" });
          await c.ujecie("sredni", { na: [k, d] });
          await c.say("mis", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 3. whose ears peek out from behind the bush?
        {
          const kr = await c.object("krzak", { x: 0, y: 0.9, size: 2.4 });
          const kto = tasuj(["zajac", "jez"])[0];
          const ukryty = await schowaj(c, kto, kr, { size: 1.6, widac: 0.3 });
          const op = []; for (const [i, n] of tasuj(["zajac", "jez", "kaczatko_stoi"]).entries()) op.push(await c.object(n, { x: -2.0 + i * 2.0, y: -2.0, size: 1.2, plik: n === kto ? ukryty.plik : null }));
          await c.ujecie("sredni", { na: [kr, ukryty] });          // the ears peeking out, before the question
          await c.say("mis", "line.p_kto");
          await c.ujecie("ogolny");
          const ok = op.find((h) => h.name === kto);
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_kto_nie" });
          await c.ujecie("zblizenie", { na: "jez" });
          await c.say("jez", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 4. what is in front of the armchair?
        {
          const f = await c.object("fotel", { x: 0, y: -0.6, size: 2.8 });
          const za = await schowaj(c, "misiu", f, { size: 1.2, widac: 0.35, dx: 0.6 });
          const przed = await c.object("klocek", { x: -0.6, y: -1.95, size: 0.9 });
          await c.ujecie("sredni", { na: [f, przed] });
          await c.say("jez", "line.p_fotel");
          await c.ujecie("ogolny");
          dobre(przed); await c.task({ targets: [za, przed], correct: przed, wrong: "line.p_fotel_nie" });
          await c.ujecie("zblizenie", { na: "mis" });
          await c.say("mis", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        // 5. hide the bunny behind the big stone
        {
          const g = await c.object("glaz", { x: -0.4, y: -1.3, size: 2.4 }), z = await c.object("zajac", { x: 2.6, y: -1.7, size: 1.3 });
          await c.say("mis", "line.p_glaz"); await c.place({ item: z, ref: g, want: "za", wrong: "line.p_glaz_nie" });
          await c.ujecie("zblizenie", { na: "jez" });
          await c.say("jez", "line.p_dobrze"); gw.dodaj(); await c.ujecie("ogolny"); c.clear();
        }
        await c.praise("jez");
      },
    ],
    apply: [
      // home: hide-and-seek in the room - the teddy behind the curtain; the ball in front of the armchair
      async (c) => {
        for (const n of ["zajac", "mis"]) c.show(n);
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.h_dom", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const k = await kryjowki(c, ["zaslona", "fotel", "pudelko"], { y: -1.1, xs: [-1.6, 0.6, 2.7], size: 2.3 });
        const gdzie = k[0];
        await schowaj(c, "misiu", gdzie, { size: 1.0, widac: 0.0, dx: 0.0 }).then((h) => { h.mesh.position.y = gdzie.mesh.position.y - 0.9; h.mesh.position.x = gdzie.mesh.position.x + 0.55; });
        await c.say("mis", "line.h_gdzie");
        dobre(gdzie); await c.task({ targets: k, correct: gdzie, wrong: "line.h_gdzie_nie" }); dobre(gdzie, false);
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.h_za_zaslona", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
        const f = await c.object("fotel", { x: 0, y: -0.9, size: 2.6 }), p = await c.object("pilka", { x: 2.6, y: -2.0, size: 0.9 });
        await c.say("zajac", "line.h_pilka");
        await c.place({ item: p, ref: f, want: "przed", wrong: "line.h_pilka_nie" });
        await c.ujecie("sredni", { na: [f, p] });
        await c.say("mis", "line.h_dobrze");
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.h_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
