// Lesson: long and short - longer / shorter, and the method: lay things from ONE line before comparing. The friends go
// for a picnic across the brook: Squirrel picks the plank that "reaches further" (it only lay further out) - it is too
// short and falls into the water; laid from one line, the long one is plain to see and becomes the bridge. On the
// meadow Squirrel's short scarf is swapped for the long one; a snail race; at home the scarves go on the hooks.
// Script in scenario.md.

const ROW_Y = 1.45;
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const polowa = (c, h) => { const b = c.bounds(h); return (b.right - b.left) / 2; };

// from one line: a pencil start line on the left; the child drags every thing to it and its left end snaps there,
// each on a row of its own; resolves when all stand from the line
async function odLinii(c, rzeczy, { x0 = -3.4, ys = [0.9, -0.3], linia = true } = {}) {
  const S = c.stage, zajete = new Map();
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

export default {
  id: "long_short",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -5.0 }, wiewiorka: { side: "left", x: -2.9 }, sarenka: { side: "right", x: 4.8 } },
  backgrounds: { story: "strumyk", practice: { kolor: "#cfe8f3", motyw: "chmurki" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the brook: the plank that "reaches further" is too short; from one line the long one is plain to see
      async (c) => {
        await Promise.all(["lisek", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        await c.say("sarenka", "line.a_piknik", { anim: "Radosc" });
        await c.say("lisek", "line.a_most");
        // two planks on the grass: the short one lies further out, so its end reaches further
        const dluga = await c.object("deska_dluga", { x: 0.4, y: -1.1, size: 3.0 });
        const krotka = await c.object("deska_krotka", { x: 2.7, y: -2.35, size: 3.0 });              // its end reaches further
        await c.say("sarenka", "line.a_deski");
        await c.say("wiewiorka", "line.a_ta", { anim: "Wskazanie" });
        // the naive try: the short one across the water - it does not reach and falls in
        krotka.icon.rotation.z = Math.PI / 2;
        await krotka.moveTo(1.2, 0.75, 0.7);
        await c.wait(0.4);
        c.sfx("plop"); await krotka.moveTo(1.2, 0.35, 0.4); krotka.mesh.visible = false;
        await c.emocja("wiewiorka", "smutek", { anim: "Smutek" });
        await c.say("wiewiorka", "line.a_wpadla");
        krotka.icon.rotation.z = 0; krotka.mesh.visible = true; await krotka.moveTo(2.7, -2.35, 0.5);   // Fox fishes it out
        await c.say("lisek", "line.a_wylowilem");
        // the method: from one line
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.a_metoda", { anim: "Zgloszenie" });
        await c.say("sarenka", "line.a_przeciagnij");
        const linia = await odLinii(c, [dluga, krotka], { x0: -1.5, ys: [1.1, -0.1] });
        await c.say("sarenka", "line.a_teraz_widac");
        dobre(dluga); await c.task({ targets: [dluga, krotka], correct: dluga, wrong: "line.a_ta_krotsza" }); dobre(dluga, false);
        await c.say("wiewiorka", "line.a_dluzsza", { anim: "Radosc" });
        linia?.remove();
        // the long one across: it reaches the far bank; they walk over it into the picture
        krotka.remove(); dluga.icon.rotation.z = Math.PI / 2;
        await dluga.moveTo(1.2, 0.95, 0.7);
        c.sfx("plop");
        await c.say("lisek", "line.a_siega");
        for (const n of ["wiewiorka", "lisek", "sarenka"]) await c.przejdz(n, [[1.2, -0.1], [1.2, 1.75]], { glebia: 0.12 });
        await c.say("sarenka", "line.a_przeszlismy");
        c.clear();
      },
      // B. the meadow: Squirrel's short scarf - the long one warms her; a snail race; the picnic
      async (c) => {
        await c.go("laka", { enter: true });
        await Promise.all(["lisek", "wiewiorka", "sarenka"].map((n) => c.enter(n)));
        c.czastki("liscie", { wiatr: 0.9 });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "zimno", { anim: "Smutek" });
        await c.say("wiewiorka", "line.b_zimno");
        await c.ujecie("ogolny");
        const krotki = await c.object("szalik_krotki", { x: 2.2, y: 1.7, size: 3.0 }), dlugi = await c.object("szalik_dlugi", { x: 0.9, y: 0.4, size: 3.0 });
        await c.say("lisek", "line.b_szaliki");
        const linia = await odLinii(c, [krotki, dlugi], { x0: -1.2, ys: [1.7, 0.6] });
        await c.say("lisek", "line.b_ktory");
        dobre(dlugi); await c.task({ targets: [krotki, dlugi], correct: dlugi, wrong: "line.b_za_krotki" }); dobre(dlugi, false);
        linia?.remove(); krotki.remove();
        await dlugi.moveTo(-2.9, -0.6, 0.5); dlugi.remove();
        await c.ubierz("wiewiorka", "szalik");
        c.czastki(null);
        await c.emocja("wiewiorka", "serce", { anim: "Radosc" });
        await c.say("wiewiorka", "line.b_cieplo");
        c.clear();
        // the breather: a snail race - point to a snail to cheer it on, it crawls a bit
        await c.say("sarenka", "line.b_wyscig", { anim: "Podskok" });
        const meta = await c.object("kwiatek", { x: 3.3, y: -1.0, size: 1.0 });
        const sl = [await c.object("slimak", { x: -0.8, y: 0.4, size: 2.6 }), await c.object("slimak", { x: -0.8, y: -1.4, size: 2.6 })];
        for (;;) {
          dobre(sl[0]);
          const hit = await c.task({ targets: sl, correct: sl, wrong: "line.b_wyscig" });
          await hit.moveTo(hit.mesh.position.x + 1.1, hit.mesh.position.y, 0.4);
          if (hit.mesh.position.x >= 2.4) break;
        }
        c.stage.bump(meta, 0.3);
        await c.say("lisek", "line.b_meta", { anim: "Brawo" });
        c.clear();
        // the picnic: one long baguette for everybody
        await c.object("bagietka_dluga", { x: 0, y: 0.2, size: 4.0 });
        await c.say("sarenka", "line.b_piknik", { anim: "Radosc" });
        await c.say("wiewiorka", "line.b_do_domu");
      },
    ],
    practice: [
      // five games, a star each
      async (c) => {
        const S = c.stage;
        c.show("sarenka"); c.show("wiewiorka");
        S.puppets.wiewiorka.korzen.position.x = -5.3; S.puppets.sarenka.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("sarenka", "line.p_start", { anim: "Radosc" });
        // 1. two ribbons laid every which way: from the line, then which is longer
        {
          const d = await c.object("wstazka_dluga", { x: 1.0, y: -1.7, size: 3.0 }), k = await c.object("wstazka_krotka", { x: 2.4, y: 1.3, size: 3.0 });
          d.icon.rotation.z = 0.3; k.icon.rotation.z = -0.2;
          await c.say("sarenka", "line.p_wstazki");
          d.icon.rotation.z = 0; k.icon.rotation.z = 0;
          const l = await odLinii(c, tasuj([d, k]), { x0: -2.8, ys: [1.0, -0.4] });
          await c.say("sarenka", "line.p_dluzsza");
          dobre(d); await c.task({ targets: [d, k], correct: d, wrong: "line.p_dluzsza_nie" });
          await c.say("wiewiorka", "line.p_dluzsza_ok");
          l?.remove(); gw.dodaj(); c.clear();
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
          await c.say("sarenka", "line.p_najkrotsza_ok");
          gw.dodaj(); c.clear();
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
          await c.say("wiewiorka", "line.p_weze_ok");
          gw.dodaj(); c.clear();
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
          await c.say("sarenka", "line.p_cien_ok");
          gw.dodaj(); c.clear();
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
          await c.say("wiewiorka", "line.p_lap_ok");
          gw.dodaj();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // home, the hallway: the scarves on the hooks - the long one for tall Fox, the short one for small Squirrel
      async (c) => {
        for (const n of ["lisek", "wiewiorka", "sarenka"]) { c.show(n); c.zdejmij(n); }        // scarves off: they hang on the hooks now
        const d = await c.object("szalik_dlugi", { x: -1.2, y: 2.15, size: 2.6 }), k = await c.object("szalik_krotki", { x: 1.6, y: 2.15, size: 2.6 });   // on the hooks
        await c.say("lisek", "line.d_wieszaki", { anim: "Zgloszenie" });
        await c.say("sarenka", "line.d_porownaj");
        const l = await odLinii(c, [d, k], { x0: -1.8, ys: [1.2, 0.1] });
        l?.remove();
        await c.say("lisek", "line.d_daj");
        // drag each scarf onto the one it fits
        const kto = new Map([[d, "lisek"], [k, "wiewiorka"]]);
        await new Promise((ok) => c.stage.free({
          items: [d, k], przeloz: null, rozdaj: { wolni: () => [...kto.values()].filter((n) => !c.stage.puppets[n].maSzalik).map((who) => ({ who })), pozycja: (o) => { const L = c.stage.puppets[o.who]; return [L.korzen.position.x, -1.0]; } },
          onDrop: async (h, p) => {
            const who = kto.get(h), L = c.stage.puppets[who];
            if (Math.abs(p.x - L.korzen.position.x) > 1.6) { await h.moveTo(h.home.x, h.home.y, 0.35); if (Math.abs(p.x - c.stage.puppets[who === "lisek" ? "wiewiorka" : "lisek"].korzen.position.x) < 1.6) await c.say("sarenka", "line.d_nie_ten"); return; }
            h.remove(); L.maSzalik = true; c.sfx("pop"); await c.ubierz(who, "szalik");
            if (c.stage.puppets.lisek.maSzalik && c.stage.puppets.wiewiorka.maSzalik) { c.stage.endSort(); ok(); }
          },
          onTap: () => {}, onPuppet: () => c.stage.onPuppetTap?.(),
        }));
        await c.say("wiewiorka", "line.d_pasuje", { anim: "Radosc" });
        await c.say("sarenka", "line.d_rodzice");
      },
    ],
  },
};
