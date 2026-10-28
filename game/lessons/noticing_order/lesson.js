// Lesson: noticing order - things happen in order: first, then, last; a story can be told from its pictures, and a
// missing step found. Owl reads Bunny a picture book; Bunny, in a hurry, drops it and puts the pages back anyhow - the
// chick before the egg. In order the story makes sense; a seed planted and watched to a flower; the snowman's missing
// step; a hop race - who is first, who is last. At home: a sandwich in order. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const SLOWA = { jajko: { pl: ["jajko"], en: ["egg"] }, piskle: { pl: ["pisklę"], en: ["chick"] }, kura: { pl: ["kura", "kurą"], en: ["hen"] } };

// story cards into a row of places, first -> last (an arrow on the first); never lying in order already
async function historyjka(c, nazwy, { y = 1.45, yK = -2.2, krok = 2.1, size = 1.8, wrong = "line.zla_kolejnosc" } = {}) {
  const n = nazwy.length, x0 = -((n - 1) * krok) / 2;
  let m = tasuj(nazwy.map((_, i) => i)); while (m.every((v, i) => v === i)) m = tasuj(m);
  const items = [];
  for (const [i, nazwa] of nazwy.entries()) { const h = await c.object(nazwa, { x: x0 + m[i] * krok, y: yK, size }); h.ranga = i; items.push(h); }
  const t = await c.slots({ items, slots: nazwy.map((_, k) => ({ x: x0 + k * krok, y, w: krok * 0.92, h: size * 1.05, accept: (it) => it.ranga === k })), wrong });
  const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
  await t.done(); strzalka.remove();
  return items.sort((a, b) => a.ranga - b.ranga);
}

export default {
  id: "noticing_order",
  przejscia: true,
  nagrody: true,
  characters: { sowa: { side: "left", x: -4.8 }, zajac: { side: "right", x: 4.8 }, lisek: { side: "right", x: 2.8 } },
  backgrounds: { story: "las", practice: { kolor: "#f6ead1", motyw: "kola" }, apply: "dom" },
  stages: {
    story: [
      // A. the forest: the picture book falls apart; Bunny's pages anyhow - nonsense; in order it makes sense
      async (c) => {
        c.show("sowa");
        await c.enter("zajac");
        await c.say("sowa", "line.a_ksiazka", { anim: "Radosc" });
        await c.say("zajac", "line.a_szybko", { anim: "Podskok" });
        // the pages fly - Bunny grabbed the book in a hurry
        const strony = [];
        for (const [i, n] of ["jajko", "piskle", "kura"].entries()) {
          const h = await c.object(n, { x: -0.8, y: 0.8, size: 1.6 });
          strony.push(h); h.moveTo(-2.2 + i * 2.2 + (Math.random() - 0.5), -1.6 - Math.random() * 0.6, 0.6); h.mesh.rotation.z = (Math.random() - 0.5) * 0.6;
        }
        c.sfx("whoosh"); await c.wait(0.8);
        await c.emocja("zajac", "pot", { anim: "Smutek" });
        await c.say("zajac", "line.a_ojej");
        // Bunny puts them back anyhow: hen, egg, chick
        for (const [i, k] of [2, 0, 1].entries()) { strony[k].mesh.rotation.z = 0; await strony[k].moveTo(-2.2 + i * 2.2, 1.5, 0.3); }
        await c.say("sowa", "line.a_czyta_zle");
        await c.play("sowa", "Radosc"); await c.play("zajac", "Radosc");
        await c.say("zajac", "line.a_smieszne");
        await c.say("sowa", "line.a_po_kolei", { anim: "Zgloszenie" });
        c.clear();
        await c.say("sowa", "line.a_uloz");
        const ulozone = await historyjka(c, ["jajko", "piskle", "kura"]);
        await c.rytm(ulozone, { linia: "line.a_czyta_dobrze", kto: "sowa", slowo: (h) => SLOWA[h.name]?.[c.lang] });
        await c.say("zajac", "line.a_ma_sens", { anim: "Radosc" });
        c.clear();
      },
      // B. the garden: Fox plants a seed and they watch it grow; then its pictures mixed, the child orders them
      async (c) => {
        await c.go("ogrod", { enter: true });
        await Promise.all(["sowa", "zajac", "lisek"].map((n) => c.enter(n)));
        await c.say("lisek", "line.b_nasiono", { anim: "Zgloszenie" });
        let h = await c.object("nasiono", { x: 0, y: 0.8, size: 2.0 });
        await c.say("sowa", "line.b_najpierw");
        await c.wait(1.0); h.remove(); h = await c.object("kielek", { x: 0, y: 0.8, size: 2.0 });
        await c.say("sowa", "line.b_potem");
        await c.wait(1.0); h.remove(); h = await c.object("kwiat_rozkwit", { x: 0, y: 0.8, size: 2.0 });
        await c.say("sowa", "line.b_na_koncu", { anim: "Radosc" });
        h.remove();
        await c.say("lisek", "line.b_uloz");
        await historyjka(c, ["nasiono", "kielek", "kwiat_rozkwit"]);
        await c.say("lisek", "line.b_dobrze", { anim: "Brawo" });
        c.clear();
        // helping: Fox's snowman story is missing its middle page
        await c.say("lisek", "line.b_balwan", { anim: "Smutek" });
        await c.object("balwan_1", { x: -2.2, y: 1.5, size: 1.8 });
        const luka = await c.zone({ x: 0, y: 1.5, w: 1.9, h: 1.9, name: "luka" });
        await c.object("balwan_3", { x: 2.2, y: 1.5, size: 1.8 });
        const op = [];
        for (const [i, n] of tasuj(["balwan_2", "ciasto_2", "kielek"]).entries()) op.push(await c.object(n, { x: -2.2 + i * 2.2, y: -2.2, size: 1.6 }));
        await c.say("sowa", "line.b_ktora");
        const ok = op.find((q) => q.name === "balwan_2");
        dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.b_ktora_nie" });
        await ok.moveTo(luka.x, luka.y, 0.4);
        await c.say("lisek", "line.b_balwan_ok", { anim: "Radosc" });
        c.clear();
        // the breather: a hop race - who is first, who is last
        await c.say("zajac", "line.b_wyscig", { anim: "Podskok" });
        const S = c.stage;
        await Promise.all([c.walkTo("zajac", -4.6), (async () => { await c.wait(0.4); await c.walkTo("lisek", -2.4); })(), (async () => { await c.wait(0.8); await c.walkTo("sowa", 0.2); })()]);
        const cele = ["zajac", "lisek", "sowa"].map((n) => S.puppets[n]);
        await c.say("lisek", "line.b_kto_pierwszy");
        dobre(cele, false); dobre(S.puppets.zajac); await c.task({ targets: cele, correct: S.puppets.zajac, wrong: "line.b_kto_pierwszy" });
        await c.say("lisek", "line.b_kto_ostatni");
        dobre(cele, false); dobre(S.puppets.sowa); await c.task({ targets: cele, correct: S.puppets.sowa, wrong: "line.b_kto_ostatni" }); dobre(cele, false);
        await c.say("sowa", "line.b_ostatnia", { anim: "Radosc" });
        await c.say("zajac", "line.b_do_domu");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("sowa"); c.show("zajac");
        S.puppets.sowa.korzen.position.x = -5.3; S.puppets.zajac.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        // 1. a cake in order
        { await c.say("zajac", "line.p_ciasto"); await historyjka(c, ["ciasto_1", "ciasto_2", "ciasto_3"]); await c.say("sowa", "line.p_dobrze"); gw.dodaj(); c.clear(); }
        // 2. what came first?
        {
          const a = await c.object("kura", { x: -1.6, y: 0.8, size: 2.5 }), b = await c.object("jajko", { x: 1.8, y: 0.8, size: 2.5 });
          await c.say("sowa", "line.p_co_pierwsze");
          dobre(b); await c.task({ targets: [a, b], correct: b, wrong: "line.p_co_pierwsze_nie" });
          await c.say("zajac", "line.p_jajko"); gw.dodaj(); c.clear();
        }
        // 3. the snowman in order
        { await c.say("zajac", "line.p_balwan"); await historyjka(c, ["balwan_1", "balwan_2", "balwan_3"]); await c.say("sowa", "line.p_dobrze"); gw.dodaj(); c.clear(); }
        // 4. what comes last?
        {
          const op = []; for (const [i, n] of tasuj(["nasiono", "kielek", "kwiat_rozkwit"]).entries()) op.push(await c.object(n, { x: -2.4 + i * 2.4, y: 0.8, size: 2.2 }));
          await c.say("sowa", "line.p_ostatnie");
          const ok = op.find((h) => h.name === "kwiat_rozkwit");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_ostatnie_nie" });
          await c.say("zajac", "line.p_kwiat"); gw.dodaj(); c.clear();
        }
        // 5. memory of story steps
        { await c.say("zajac", "line.p_memory"); await c.memory([["jajko"], ["piskle"], ["kura"], ["kielek"]].map(([n]) => [{ obraz: n }, { obraz: n }]), { szer: 1.4 }); await c.say("sowa", "line.p_dobrze"); gw.dodaj(); c.clear(); }
        await c.praise("sowa");
      },
    ],
    apply: [
      // home: a sandwich for supper, in order
      async (c) => {
        for (const n of ["sowa", "zajac"]) c.show(n);
        await c.say("zajac", "line.d_kanapka", { anim: "Zgloszenie" });
        await c.say("sowa", "line.d_uloz");
        await historyjka(c, ["kanapka_1", "kanapka_2", "kanapka_3"]);
        await c.say("zajac", "line.d_mniam", { anim: "Radosc" });
        await c.say("sowa", "line.d_rodzice");
      },
    ],
  },
};
