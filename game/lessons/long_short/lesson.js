// Lesson: long and short - longer / shorter, and the method: lay things from ONE line before comparing. The friends go
// for a picnic across the brook: Squirrel picks the plank that "reaches further" (it only lay further out) - it is too
// short and falls into the water; from one line (on an insert) the long one is plain to see and becomes the bridge. On
// the meadow Squirrel gets Fox's long scarf; a snail race; Deer's map shows two paths to the picnic glade - the child
// points to the shorter one and walks it; on the glade the longer baguette does for all three, the picnic is seen. At
// home Squirrel gives the scarf back, both hang from the painted hooks; in the kitchen Fox takes the pasta that sticks
// out furthest for the longest, the line shows it is short; the dinner is seen, the home game is played on screen.
// Script in scenario.md.

const ROW_Y = 1.45;
const MOST = { x: 1.03, y: -0.25, kat: -0.52 };       // the bridge: from the near bank (lower right) to the rock on the far bank
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wyrosnij = (c) => c.stage.tween(0.4, () => {});                  // let things popping in reach their size before a shot frames them
const polowa = (c, h) => { const b = c.bounds(h); return (b.right - b.left) / 2; };

// from one line: a pencil start line on the left; the child drags every thing to it and its left end snaps there,
// each on a row of its own; resolves when all stand from the line
async function odLinii(c, rzeczy, { x0 = -3.4, ys = [0.9, -0.3], linia = true } = {}) {
  const S = c.stage, zajete = new Map();
  // nothing may lie on the line already, nor two things start level (a plank lying with its end on the line was a
  // task done for the child): every left end at least 0.9 right of the line, each next one further, inside the screen
  const ruchy = [];
  rzeczy.slice().sort((a, b) => c.bounds(a).left - c.bounds(b).left).forEach((h, i) => {
    const b = c.bounds(h), min = x0 + 0.9 + i * 0.7;
    if (b.left < min || (i && Math.abs(b.left - c.bounds(rzeczy[i - 1]).left) < 0.6)) {
      const dx = Math.min(min - b.left + (b.left < min ? 0 : 0.7), 5.8 - b.right);
      if (dx > 0.05) ruchy.push(h.moveTo(h.mesh.position.x + dx, h.mesh.position.y, 0.35));
    }
  });
  await Promise.all(ruchy);
  const kreska = linia ? await c.line([[x0, ys[0] + 0.75], [x0, ys[ys.length - 1] - 0.75]], { color: "#3b3631", width: 0.07, strong: true }) : null;
  const cel = (h) => { const wolny = ys.find((y) => !zajete.has(y) || zajete.get(y) === h) ?? ys[0]; return [x0 + polowa(c, h), wolny]; };
  await new Promise((ok) => S.free({
    items: rzeczy.slice(), doLinii: cel,
    onDrop: async (h, p) => {
      for (const [y, q] of zajete) if (q === h) zajete.delete(y);
      if (Math.abs(p.x - polowa(c, h) - x0) > 1.8) { await h.moveTo(h.home.x, h.home.y, 0.35); return; }      // far from the line: back
      const y = ys.filter((y) => !zajete.has(y)).sort((a, b) => Math.abs(a - p.y) - Math.abs(b - p.y))[0];
      zajete.set(y, h); c.sfx("plop"); await h.moveTo(x0 + polowa(c, h), y, 0.2);
      if (rzeczy.every((q) => [...zajete.values()].includes(q))) { S.endSort(); ok(); }
    },
    onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
  }));
  return kreska;
}

// a sticker turned smoothly (a jump from one angle to another read as a glitch)
const obroc = (c, h, kat, d = 0.4) => { const a0 = h.icon.rotation.z; return c.stage.tween(d, (s) => { h.icon.rotation.z = a0 + (kat - a0) * s; }); };
// where each one ends: a pencil tick down from every right end, the longer one's tick further out
async function konce(c, rzeczy, { kolor = "#e8502e" } = {}) {
  const out = [];
  for (const h of rzeczy) { const b = c.bounds(h); out.push(await c.line([[b.right, b.top + 0.35], [b.right, b.bottom - 0.35]], { color: kolor, width: 0.07, strong: true, duration: 0.35 })); }
  return { remove: () => out.forEach((k) => k.remove()) };
}

// hang things on a painted hook rail (miejsca "wisi"): turned to hang down, each from a hook of its own - from one rail,
// so the lower end is the longer thing; resolves when all hang
async function powies(c, rzeczy, r) {
  const S = c.stage, zajete = new Map();
  const haki = [0.435, 0.575].map((fx) => r.x + (fx - 0.5036) / 0.3535 * r.w);       // two of the five painted hooks
  const naHaku = (h, i) => [haki[i], r.y - polowa(c, h) + 0.15];
  const wolny = (h) => { const i = haki.findIndex((_, k) => !zajete.has(k) || zajete.get(k) === h); return i < 0 ? 0 : i; };
  await new Promise((ok) => S.free({
    items: rzeczy.slice(), doLinii: (h) => naHaku(h, wolny(h)),
    onDrop: async (h, p) => {
      for (const [k, q] of zajete) if (q === h) zajete.delete(k);
      if (Math.abs(p.x - r.x) > r.w / 2 + 1.0 || p.y < r.y - 2.6) {        // far from the rail: back to the floor
        await Promise.all([obroc(c, h, 0, 0.2), h.moveTo(h.home.x, h.home.y, 0.35)]);
        await c.say("sarenka", "line.d_nie_ten"); return;
      }
      const i = [0, 1].filter((k) => !zajete.has(k)).sort((a, b) => Math.abs(haki[a] - p.x) - Math.abs(haki[b] - p.x))[0];
      zajete.set(i, h); c.sfx("plop");
      const [x, y] = naHaku(h, i);
      await Promise.all([obroc(c, h, Math.PI / 2, 0.25), h.moveTo(x, y, 0.25)]);
      if (rzeczy.every((q) => [...zajete.values()].includes(q))) { S.endSort(); ok(); }
    },
    onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
  }));
}

export default {
  id: "long_short",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -5.0 }, wiewiorka: { side: "left", x: -2.9 }, sarenka: { side: "right", x: 4.8 } },
  backgrounds: { story: "strumyk", practice: { kolor: "#cfe8f3", motyw: "chmurki" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the brook: the plank that "reaches further" is too short; the method on an insert; the long one is the bridge
      async (c) => {
        await Promise.all(["lisek", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        await c.say("sarenka", "line.a_piknik", { anim: "Radosc" });             // wide: the three walk in to the brook
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.a_most", { anim: "Wskazanie" });
        // two planks on the grass: the short one lies further out, so its end reaches further
        let dluga = await c.object("deska_dluga", { x: 0.4, y: -1.1, size: 3.0 });
        let krotka = await c.object("deska_krotka", { x: 2.7, y: -2.35, size: 3.0 });              // its end reaches further
        await wyrosnij(c);
        await c.ujecie("sredni", { na: [dluga, krotka] });                   // the two planks on the grass (popped in under Fox's shot)
        await c.say("sarenka", "line.a_deski");
        await c.ujecie("sredni", { na: ["wiewiorka", dluga, krotka] });      // Squirrel's pick: the one that reaches further
        await c.say("wiewiorka", "line.a_ta", { anim: "Wskazanie" });
        // the naive try: the short one across the water - it does not reach and falls in
        await c.ujecie("ogolny");
        await Promise.all([obroc(c, krotka, MOST.kat, 0.6), krotka.moveTo(MOST.x + 0.55, MOST.y - 0.32, 0.7)]);     // from the near bank: its end ends in the water
        await c.wait(0.4);
        c.sfx("plop"); await krotka.moveTo(1.2, 0.35, 0.4); krotka.mesh.visible = false;
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // the visible consequence: sad
        await c.emocja("wiewiorka", "smutek", { anim: "Smutek" });
        await c.say("wiewiorka", "line.a_wpadla");
        krotka.icon.rotation.z = 0; krotka.mesh.visible = true; await krotka.moveTo(-1.3, -2.45, 0.3);      // Fox fished it out while we looked at Squirrel
        await c.ujecie("sredni", { na: ["lisek", krotka] });
        await c.say("lisek", "line.a_wylowilem");
        // the method on a plain colour: the planks anyhow, then from one line
        await c.go({ kolor: "#d6ebf2", motyw: "kola" }, { ciecie: true });
        dluga = await c.object("deska_dluga", { x: -0.3, y: 1.5, size: 3.0 });
        krotka = await c.object("deska_krotka", { x: 1.9, y: 0.0, size: 3.0 });                    // again the short one's end further out
        await wyrosnij(c);
        await c.ujecie("sredni", { na: ["sarenka", dluga, krotka] });
        await c.say("sarenka", "line.a_metoda", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the task: both planks and the line in the shot
        await c.say("sarenka", "line.a_przeciagnij");
        const linia = await odLinii(c, [dluga, krotka], { x0: -1.5, ys: [1.1, -0.1] });
        const k = await konce(c, [dluga, krotka]);
        await c.ujecie("sredni", { na: [dluga, krotka] });                   // both from the line, the ends marked
        await c.say("sarenka", "line.a_konce");
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.a_teraz_widac");
        dobre(dluga); await c.task({ targets: [dluga, krotka], correct: dluga, wrong: "line.a_ta_krotsza" }); dobre(dluga, false);
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // the penny drops
        await c.say("wiewiorka", "line.a_dluzsza", { anim: "Radosc" });
        linia?.remove(); k.remove();
        // back at the brook: the long one across reaches the far bank; they walk over it into the picture
        await c.go("strumyk", { ciecie: true });
        dluga = await c.object("deska_dluga", { x: 0.4, y: -1.1, size: 3.0 });
        await wyrosnij(c);
        await Promise.all([obroc(c, dluga, MOST.kat, 0.6), dluga.moveTo(MOST.x, MOST.y, 0.7)]);           // from bank to bank, across the water
        c.sfx("plop");
        await c.ujecie("sredni", { na: ["lisek", dluga] });                  // the plank bridge across the brook
        await c.say("lisek", "line.a_siega", { anim: "Radosc" });
        await c.ujecie("ogolny");
        for (const [n, x] of [["wiewiorka", -1.4], ["lisek", -0.7], ["sarenka", 0.0]]) await c.przejdz(n, [[2.3, -0.95], [-0.2, 0.5], [x, 0.9]], { glebia: 0.12 });   // side by side on the far bank
        await c.say("sarenka", "line.a_przeszlismy");                      // wide: all three over the brook, on the far bank
        c.clear();
      },
      // B. the meadow: Squirrel's short scarf - the long one warms her; the snail race; Deer's map - point to the
      // shorter path, then walk it
      async (c) => {
        await c.go("laka", { enter: true });
        await Promise.all(["lisek", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        c.czastki("liscie", { wiatr: 0.9 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // cold
        await c.emocja("wiewiorka", "zimno", { anim: "Smutek" });
        await c.say("wiewiorka", "line.b_zimno");
        await c.ujecie("ogolny");                                            // the scarves come in, the task is wide
        const krotki = await c.object("szalik_krotki", { x: 2.2, y: 1.7, size: 3.0 }), dlugi = await c.object("szalik_dlugi", { x: 0.9, y: 0.4, size: 3.0 });
        await wyrosnij(c);
        await c.say("lisek", "line.b_szaliki");
        const linia = await odLinii(c, [krotki, dlugi], { x0: -1.2, ys: [1.7, 0.6] });
        await c.say("lisek", "line.b_ktory");
        dobre(dlugi); await c.task({ targets: [krotki, dlugi], correct: dlugi, wrong: "line.b_za_krotki" }); dobre(dlugi, false);
        linia?.remove(); krotki.remove();
        await dlugi.moveTo(-2.9, -0.6, 0.5); dlugi.remove();
        await c.ubierz("wiewiorka", "szalik");
        c.czastki(null);
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // warm: a heart
        await c.emocja("wiewiorka", "serce", { anim: "Radosc" });
        await c.say("wiewiorka", "line.b_cieplo");
        c.clear();
        // the breather: a snail race - point to a snail to cheer it on, it crawls a bit
        await c.ujecie("ogolny");
        const meta = await c.object("kwiatek", { x: 3.3, y: -1.0, size: 1.0 });
        const sl = [await c.object("slimak", { x: -0.8, y: 0.4, size: 2.6 }), await c.object("slimak", { x: -0.8, y: -1.4, size: 2.6 })];
        await c.say("sarenka", "line.b_wyscig", { anim: "Podskok" });
        for (;;) {
          dobre(sl[0]);
          const hit = await c.task({ targets: sl, correct: sl, wrong: "line.b_wyscig" });
          await hit.moveTo(hit.mesh.position.x + 1.1, hit.mesh.position.y, 0.4);
          if (hit.mesh.position.x >= 2.4) break;
        }
        c.stage.bump(meta, 0.3);
        await c.ujecie("sredni", { na: [meta, ...sl] });                     // the snail at the flower
        await c.say("lisek", "line.b_meta", { anim: "Brawo" });
        c.clear();
        // the way to the picnic: Deer's map - two paths from one start to the glade; we are hungry, so the shorter one
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.b_mapa", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the map flies up from Deer
        const mapa = await c.znalezisko("mapa_pikniku", { skad: "sarenka" });
        const [krotsza] = mapa.cele.slice().sort((a, b) => mapa.meta.cele[a.nr].x - mapa.meta.cele[b.nr].x);   // the short path is the left one
        await c.say("sarenka", "line.b_mapa_drogi");
        await c.say("lisek", "line.b_mapa_ktora");
        dobre(mapa.cele, false); dobre(krotsza); await c.task({ targets: [...mapa.cele, mapa.tlo], correct: krotsza, wrong: "line.b_mapa_nie" }); dobre(krotsza, false);
        await mapa.zaznacz(krotsza);                                            // the chosen way drawn along in pencil
        await c.say("sarenka", "line.b_mapa_tak", { anim: "Radosc" });
        await mapa.remove();
        // the walk on the map: Fox's pawn along the short path to the blanket; the long one shakes it
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.b_wedrowka", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the map lies in the scene: it flies up into the wide shot
        const w = await c.wedrowka("mapa_pikniku", { pionek: "pionek_lisek", dobra: 0, skad: "lisek", wrong: "line.b_wedrowka_nie" });
        await c.say("wiewiorka", "line.b_wedrowka_tak", { anim: "Podskok" });
        await w.remove();
        c.clear();
      },
      // C. the picnic glade at the end of the short path: the arrival, the baguettes from one line, the picnic seen
      async (c) => {
        await c.go("polana_piknik", { enter: true });
        await Promise.all(["lisek", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        await c.play("wiewiorka", "Rozgladanie");
        await c.say("wiewiorka", "line.c_polana", { anim: "Radosc" });             // wide: the arrival, the blanket and the basket in view
        await c.ujecie("zblizenie", { na: "lisek" });                         // hungry
        await c.say("lisek", "line.c_kosz");
        // two baguettes from the basket, laid from one line on the blanket
        await c.ujecie("ogolny");
        const x0 = -1.2, [yd, yk] = tasuj([1.75, 0.55]);
        const kreska = await c.line([[x0, 2.4], [x0, -0.1]], { color: "#3b3631", width: 0.07, strong: true });
        const dluga = await c.object("bagietka_dluga", { x: 0, y: yd, size: 3.4 }), krotka = await c.object("bagietka_krotka", { x: 0, y: yk, size: 2.1 });
        for (const h of [dluga, krotka]) h.mesh.position.x = x0 + polowa(c, h);
        await wyrosnij(c);
        await c.say("sarenka", "line.c_bagietki");
        dobre(dluga); await c.task({ targets: [dluga, krotka], correct: dluga, wrong: "line.c_bagietki_nie" }); dobre(dluga, false);
        await c.ujecie("sredni", { na: ["lisek", dluga] });
        await c.say("lisek", "line.c_bagietki_tak", { anim: "Radosc" });
        kreska?.remove();
        // the picnic seen: everybody gets a piece of the long baguette
        const il = await c.ilustracja("piknik_polana", { ruch: "najazd" });
        await c.say("sarenka", "line.b_piknik");
        await c.say("wiewiorka", "line.b_do_domu");
        await il.zsun();
        c.clear();
      },
    ],
    practice: [
      // five games, a star each
      async (c) => {
        const S = c.stage;
        c.show("sarenka"); c.show("wiewiorka");
        S.puppets.wiewiorka.korzen.position.x = -5.3; S.puppets.sarenka.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await wyrosnij(c);
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.say("sarenka", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1. two ribbons laid every which way: from the line, then which is longer
        {
          const d = await c.object("wstazka_dluga", { x: 1.0, y: -1.7, size: 3.0 }), k = await c.object("wstazka_krotka", { x: 2.4, y: 1.3, size: 3.0 });
          d.icon.rotation.z = 0.3; k.icon.rotation.z = -0.2;
          await c.say("sarenka", "line.p_wstazki");
          await Promise.all([obroc(c, d, 0), obroc(c, k, 0)]);
          const l = await odLinii(c, tasuj([d, k]), { x0: -2.8, ys: [1.0, -0.4] });
          await c.say("sarenka", "line.p_dluzsza");
          dobre(d); await c.task({ targets: [d, k], correct: d, wrong: "line.p_dluzsza_nie" });
          await c.ujecie("sredni", { na: [d, k] });
          await c.say("wiewiorka", "line.p_dluzsza_ok");
          l?.remove(); gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 2. the shortest of three planks, already from one line
        {
          const x0 = -2.8, hs = [];
          await c.line([[x0, 2.0], [x0, -2.0]], { color: "#3b3631", width: 0.07, strong: true });
          for (const [i, [n, size]] of tasuj([["deska_dluga", 3.0], ["deska_dluga", 2.0], ["deska_krotka", 3.0]]).entries()) {
            const h = await c.object(n, { x: 0, y: 1.3 - i * 1.3, size }); h.mesh.position.x = x0 + polowa(c, h); h.krotka = n === "deska_krotka"; hs.push(h);
          }
          const ok = hs.find((h) => h.krotka);
          await c.say("wiewiorka", "line.p_najkrotsza");
          dobre(ok); await c.task({ targets: hs, correct: ok, wrong: "line.p_najkrotsza_nie" });
          await c.ujecie("sredni", { na: hs });                             // the three planks from the line
          await c.say("sarenka", "line.p_najkrotsza_ok");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 3. two snakes drawn with the pencil: which is longer? (a stroke is a target)
        {
          const dl = Math.random() < 0.5;
          const fala = (x0, y, n) => Array.from({ length: n * 8 + 1 }, (_, i) => [x0 + i * 0.16, y + Math.sin(i / 8 * Math.PI * 2) * 0.22]);
          const a = await c.line(fala(-3.0, 1.0, dl ? 5 : 2), { color: "#4f8f3a", width: 0.16, strong: true, duration: 0.6 });
          const b = await c.line(fala(-3.0, -0.6, dl ? 2 : 5), { color: "#c2683a", width: 0.16, strong: true, duration: 0.6 });
          const ok = dl ? a : b;
          await c.say("sarenka", "line.p_weze");
          dobre(ok); await c.task({ targets: [a, b], correct: ok, wrong: "line.p_weze_nie" });
          await c.ujecie("sredni", { na: [a, b] });                         // the two snakes
          await c.say("wiewiorka", "line.p_weze_ok");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 4. shadows: which shadow is the long scarf's?
        {
          const dl = Math.random() < 0.5;
          const cien = await c.object(dl ? "szalik_dlugi" : "szalik_krotki", { x: 0, y: 1.6, size: 3.0 }); c.cien(cien);
          const d = await c.object("szalik_dlugi", { x: -1.6, y: -1.4, size: 2.6 }), k = await c.object("szalik_krotki", { x: 2.0, y: -1.4, size: 2.6 });
          const ok = dl ? d : k;
          await c.say("wiewiorka", dl ? "line.p_cien_dlugi" : "line.p_cien_krotki");
          dobre(ok); await c.task({ targets: [d, k], correct: ok, wrong: "line.p_cien_nie" });
          c.cien(cien, false);
          await c.ujecie("sredni", { na: [cien, ok] });                     // the shadow and its scarf
          await c.say("sarenka", "line.p_cien_ok");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 5. catch the long ones: long and short ribbons pop up, point to the long one
        {
          await c.say("sarenka", "line.p_lap");
          for (let r = 0; r < 2; r++) {
            const m = tasuj([[-2.4, 1.4], [1.6, 0.6], [-0.8, -1.3], [2.2, -1.6]]);
            const d = await c.object("wstazka_dluga", { x: m[0][0], y: m[0][1], size: 2.6 }), k = await c.object("wstazka_krotka", { x: m[1][0], y: m[1][1], size: 2.6 });
            dobre(d); await c.task({ targets: [d, k], correct: d, wrong: "line.p_lap" });
            c.clear();
          }
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_lap_ok");
          gw.dodaj(); await c.ujecie("ogolny");
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // home - the third act. The hallway: Squirrel gives Fox back his long scarf; both scarves hang from the painted
      // hook rail (from one rail = from one line) and the longer one is Fox's
      async (c) => {
        for (const n of ["lisek", "wiewiorka", "sarenka"]) c.show(n);
        await c.ubierz("wiewiorka", "szalik");                               // she comes home in Fox's long scarf
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        const m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });         // the thread: the scarf given back
        await c.say("wiewiorka", "line.d_dziekuje", { anim: "Radosc" });
        c.zdejmij("wiewiorka");
        await c.ujecie("ogolny");                                            // the scarves on the floor, the hooks above: the task
        const d = await c.object("szalik_dlugi", { x: 0.4, y: -1.5, size: 2.6 }), k = await c.object("szalik_krotki", { x: 1.2, y: -2.5, size: 2.6 });
        await wyrosnij(c);
        await c.say("lisek", "line.d_wieszaki");
        await c.say("lisek", "line.d_daj");
        await powies(c, [d, k], m.wieszak);
        await c.ujecie("sredni", { na: [d, k] });                            // hanging from one rail, the ends at different heights
        await c.say("sarenka", "line.d_jedna_linia");
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.d_ktory");
        dobre(d); await c.task({ targets: [d, k], correct: d, wrong: "line.d_ktory_nie" }); dobre(d, false);
        await c.ujecie("dwuujecie", { na: ["wiewiorka", "lisek"] });
        await c.say("wiewiorka", "line.d_pasuje", { anim: "Radosc" });
        c.clear();
      },
      // the kitchen: Fox takes the pasta that sticks out furthest for the longest (the misconception again); laid from
      // one line it is short; the longest for Fox, the shortest for Squirrel, one pot, the dinner seen, the home game
      async (c) => {
        await c.go("dom", { enter: true });
        await Promise.all(["lisek", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        await c.say("lisek", "line.k_kuchnia", { anim: "Radosc" });           // wide: the arrival in the kitchen
        // the pasta lies anyhow on the table; the penne lies furthest out
        const POZ = { makaron_spaghetti: [-0.9, 0.9, 0.1], makaron_tagliatelle: [-0.6, 0.0, -0.08], makaron_swiderek: [1.2, 1.75, 0.2], makaron_kolanko: [1.6, 0.2, -0.4], makaron_penne: [2.7, -0.6, 0.15] };
        const mak = [];
        for (const [n, [x, y, r]] of Object.entries(POZ)) { const h = await c.object(n, { x, y, size: 4.6 }); h.icon.rotation.z = r; mak.push(h); }
        await wyrosnij(c);
        const penne = mak.find((h) => h.name === "makaron_penne"), najd = mak.find((h) => h.name === "makaron_spaghetti"), najk = mak.find((h) => h.name === "makaron_kolanko");
        await c.ujecie("sredni", { na: ["lisek", penne] });                  // Fox's pick: the end that sticks out furthest
        await c.say("lisek", "line.k_ja_najdluzszy", { anim: "Wskazanie" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.k_ja_najkrotszy", { anim: "Podskok" });
        await c.ujecie("sredni", { na: ["sarenka", penne] });                // Deer objects, the pasta in the shot
        await c.say("sarenka", "line.k_umowa", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                            // the task: every piece and the line
        await Promise.all(mak.map((h) => obroc(c, h, 0)));
        await c.say("sarenka", "line.k_przeciagnij");
        const lm = await odLinii(c, mak, { x0: -1.7, ys: [2.4, 1.7, 1.0, 0.3, -0.4] });
        c.stage.bump(penne, 0.3);
        await c.ujecie("zblizenie", { na: "lisek" });                        // the visible consequence: his pick is short
        await c.wonder("lisek");
        await c.say("lisek", "line.k_ojej", { anim: "Smutek" });
        await c.ujecie("ogolny");
        await c.say("lisek", "line.k_najdluzszy");
        dobre(najd); await c.task({ targets: mak, correct: najd, wrong: "line.k_najdluzszy_nie" }); dobre(najd, false);
        await c.ujecie("sredni", { na: ["lisek", najd] });
        await c.say("lisek", "line.k_najdluzszy_tak", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.k_najkrotszy");
        dobre(najk); await c.task({ targets: mak, correct: najk, wrong: "line.k_najkrotszy_nie" }); dobre(najk, false);
        await c.ujecie("sredni", { na: ["wiewiorka", najk] });
        await c.say("wiewiorka", "line.k_najkrotszy_tak", { anim: "Podskok" });
        lm?.remove();
        for (const h of mak) if (h !== najd && h !== najk) h.remove();
        // into one pot
        await c.ujecie("zblizenie", { na: "sarenka" });                      // an idea
        await c.emocja("sarenka", "zarowka");
        await c.say("sarenka", "line.k_pomieszajmy");
        await c.ujecie("ogolny");                                            // the pot comes in: the task is wide
        const garnek = await c.zone({ x: 0.6, y: -2.0, w: 2.4, h: 1.8, image: "garnek", name: "garnek" });
        najd.tag = najk.tag = "garnek";
        await c.say("sarenka", "line.k_do_garnka");
        await c.sort({ items: [najd, najk], zones: [garnek] });
        for (const h of [najd, najk]) h.mesh.visible = false;
        c.stage.bump(garnek);
        // the dinner seen
        const il = await c.ilustracja("obiad_makaron", { ruch: "najazd" });
        await c.say("lisek", "line.k_pyszne");
        await c.say("wiewiorka", "line.k_kolanko");
        await il.zsun();
        c.clear();
        // the home game shown in play: two spaghetti laid from one line - Squirrel's broken one is shorter
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.d_zabawa", { anim: "Radosc" });
        const x0 = -1.7, kreska = await c.line([[x0, 2.3], [x0, 0.2]], { color: "#3b3631", width: 0.07, strong: true });
        const jego = await c.object("makaron_spaghetti", { x: 3.0, y: 1.8, size: 4.6 }), jej = await c.object("makaron_spaghetti", { x: 2.0, y: 0.8, size: 2.6 });
        jego.icon.rotation.z = 0.25; jej.icon.rotation.z = -0.3;
        await wyrosnij(c);
        await Promise.all([obroc(c, jego, 0), jego.moveTo(x0 + polowa(c, jego), 1.8, 0.6)]);
        await Promise.all([obroc(c, jej, 0), jej.moveTo(x0 + polowa(c, jej), 0.8, 0.6)]);
        c.sfx("plop");
        await c.ujecie("sredni", { na: ["lisek", jego, jej] });
        await c.say("lisek", "line.d_zabawa_widac", { anim: "Brawo" });
        await c.ujecie("zblizenie", { na: "sarenka" });                      // the task for the parents
        await c.say("sarenka", "line.d_rodzice");
        kreska?.remove();
      },
    ],
  },
};
