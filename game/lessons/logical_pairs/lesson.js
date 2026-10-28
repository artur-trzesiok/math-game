// Lesson: what goes with what - logical pairs: things that belong together because we use them together (a cup and its
// saucer, a brush and paints, a bee and a flower, a hammer and a nail, a key and its door) - not because they look
// alike. A storm blew everybody's things into Beaver's workshop; Mole, who sees badly, pairs a red cup with a red apple;
// the child joins the pairs with a finger-drawn line (polacz); Deer's key; leaves after the storm. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// two columns of things, the right one shuffled; the child joins each pair with a line
async function laczPary(c, pary, { xL = -1.0, xP = 2.0, y0 = 2.1, krok = 1.25, size = 1.15, wrong = "line.nie_para" } = {}) {
  const L = [], P = [], para = new Map();
  for (const [i, [a]] of pary.entries()) { const h = await c.object(a, { x: xL, y: y0 - i * krok, size }); L.push(h); }
  for (const [i, k] of tasuj(pary.map((_, i) => i)).entries()) { const h = await c.object(pary[k][1], { x: xP, y: y0 - i * krok, size }); P.push(h); para.set(h, L[k]); }
  for (const [k, h] of L.entries()) para.set(h, P.find((q) => para.get(q) === h));
  const w = await c.polacz({ lewe: L, prawe: P, para: (a, b) => para.get(a) === b, wrong });
  return { L, P, w };
}

export default {
  id: "logical_pairs",
  przejscia: true,
  nagrody: true,
  characters: { bobr: { side: "left", x: -4.8 }, kret: { side: "left", x: -2.9 }, sarenka: { side: "right", x: 4.8 } },
  backgrounds: { story: "strumyk", practice: { kolor: "#e9f2e1", motyw: "figury" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the brook after the storm: everything blown about; Mole pairs by colour - Deer: by what we use together
      async (c) => {
        c.czastki("liscie", { wiatr: 2.0 });
        await Promise.all(["bobr", "kret", "sarenka"].map((n) => c.enter(n)));
        await c.say("bobr", "line.a_burza", { anim: "Smutek" });
        c.czastki("liscie", { wiatr: 0.4 });
        const kubek = await c.object("kubek_czerwony", { x: -0.6, y: 1.6, size: 1.2 }), jablko = await c.object("jablko", { x: 2.2, y: 1.2, size: 1.2 });
        const fil = await c.object("filizanka", { x: 0.9, y: -1.9, size: 1.2 }), sp = await c.object("spodek", { x: 2.6, y: -2.2, size: 1.3 });
        await c.say("kret", "line.a_pomoge", { anim: "Zgloszenie" });
        await kubek.moveTo(1.4, 1.2, 0.5);
        await c.say("kret", "line.a_kolor");
        await c.say("sarenka", "line.a_nie", { anim: "Kiwanie" });
        await c.say("sarenka", "line.a_razem");
        await sp.moveTo(0.9, -2.35, 0.4); await fil.moveTo(0.9, -1.85, 0.3); c.sfx("plop");
        await c.say("sarenka", "line.a_filizanka");
        await c.say("kret", "line.a_rozumiem");
        await c.say("bobr", "line.a_do_warsztatu");
        c.clear();
      },
      // B. the workshop: the child joins the pairs; Deer's door and the key that fits; catching leaves
      async (c) => {
        await c.go("warsztat", { enter: true });
        await Promise.all(["bobr", "kret", "sarenka"].map((n) => c.enter(n)));
        await c.say("bobr", "line.b_rzeczy");
        await c.say("bobr", "line.b_polacz");
        const { w } = await laczPary(c, [["pedzel", "farby"], ["pszczola", "kwiatek"], ["mlotek", "gwozdz"]]);
        await c.say("kret", "line.b_pasuja", { anim: "Radosc" });
        w.remove(); c.clear();
        // helping: Deer's round door has a star keyhole - which key opens it?
        await c.say("sarenka", "line.b_drzwi", { anim: "Smutek" });
        await c.object("drzwi_gwiazda", { x: 2.4, y: 0.4, size: 2.3 });
        const klucze = [];
        for (const [i, n] of tasuj(["klucz_gwiazda", "klucz_kolo", "klucz_kwadrat"]).entries()) klucze.push(await c.object(n, { x: -2.2 + i * 1.3, y: 0.9, size: 1.5 }));
        await c.say("bobr", "line.b_klucz");
        const ok = klucze.find((k) => k.name === "klucz_gwiazda");
        dobre(ok); await c.task({ targets: klucze, correct: ok, wrong: "line.b_klucz_nie" });
        await ok.moveTo(2.4, 0.4, 0.5); c.sfx("tap");
        await c.emocja("sarenka", "serce", { anim: "Radosc" });
        await c.say("sarenka", "line.b_otwarte");
        c.clear();
        // the breather: the last leaves of the storm fall - catch three
        await c.say("kret", "line.b_liscie", { anim: "Podskok" });
        for (const [x, y] of tasuj([[-2.2, 1.4], [0.2, 2.0], [2.2, 1.0], [-0.8, 0.4], [1.4, 0.2]]).slice(0, 3)) {
          const l = await c.object(Math.random() < 0.5 ? "lisc_czerwony" : "lisc_zolty", { x, y, size: 1.0 });
          dobre(l); await c.task({ targets: [l], correct: l, wrong: "line.b_liscie" });
          c.sfx("pop"); l.remove();
        }
        await c.say("bobr", "line.b_koniec");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("bobr"); c.show("sarenka");
        S.puppets.bobr.korzen.position.x = -5.3; S.puppets.sarenka.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.say("sarenka", "line.p_start", { anim: "Radosc" });
        // 1. join three pairs
        { await c.say("bobr", "line.p_polacz"); const { w } = await laczPary(c, [["skarpetka", "but"], ["lyzka", "miska"], ["filizanka", "spodek"]]); await c.say("sarenka", "line.p_dobrze"); w.remove(); gw.dodaj(); c.clear(); }
        // 2. what goes with the bee?
        {
          await c.object("pszczola", { x: 0, y: 1.7, size: 1.6 });
          const op = []; for (const [i, n] of tasuj(["kwiatek", "mlotek", "kubek"]).entries()) op.push(await c.object(n, { x: -2.0 + i * 2.0, y: -1.3, size: 1.4 }));
          await c.say("sarenka", "line.p_pszczola");
          const ok = op.find((h) => h.name === "kwiatek");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_pszczola_nie" });
          await c.say("bobr", "line.p_kwiatek"); gw.dodaj(); c.clear();
        }
        // 3. memory of pairs: a thing and the one it goes with
        { await c.say("bobr", "line.p_memory"); await c.memory([[{ obraz: "mlotek" }, { obraz: "gwozdz" }], [{ obraz: "pedzel" }, { obraz: "farby" }], [{ obraz: "kura" }, { obraz: "jajko" }], [{ obraz: "skarpetka" }, { obraz: "but" }]], { szer: 1.4 }); await c.say("sarenka", "line.p_dobrze"); gw.dodaj(); c.clear(); }
        // 4. which does not belong? a cup, a saucer - and a hammer
        {
          const op = []; for (const [i, n] of tasuj(["filizanka", "spodek", "mlotek"]).entries()) op.push(await c.object(n, { x: -2.0 + i * 2.0, y: 0.8, size: 1.5 }));
          await c.say("sarenka", "line.p_nie_pasuje");
          const ok = op.find((h) => h.name === "mlotek");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_nie_pasuje_nie" });
          await c.say("bobr", "line.p_mlotek"); gw.dodaj(); c.clear();
        }
        // 5. join another three
        { await c.say("bobr", "line.p_polacz"); const { w } = await laczPary(c, [["mlotek", "gwozdz"], ["kura", "jajko"], ["klucz_gwiazda", "drzwi_gwiazda"]]); await c.say("sarenka", "line.p_dobrze"); w.remove(); gw.dodaj(); c.clear(); }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // home, the hallway: everybody's things back with their pairs
      async (c) => {
        for (const n of ["bobr", "kret", "sarenka"]) c.show(n);
        await c.say("kret", "line.d_przedpokoj", { anim: "Zgloszenie" });
        const { w } = await laczPary(c, [["skarpetka", "but"], ["pedzel", "farby"], ["filizanka", "spodek"]]);
        await c.say("kret", "line.d_porzadek", { anim: "Radosc" });
        w.remove();
        await c.say("sarenka", "line.d_rodzice");
      },
    ],
  },
};
