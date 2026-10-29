// Lesson: counting to 5 - one number for each thing, the last number says how many, and moving things does not change
// how many there are; five shown as a row, a die (domino) and a hand. Bear opens a forest bakery: he spreads five rolls
// along the tray and says there are more now; orders packed into a bag; which basket has five; Hedgehog's hops; the
// first customers pay. At home: the table set for five. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// digit cards in a row: a paper card (the target) with the digit drawn on it
async function karty(c, liczby, { y = -2.0, xs = [-0.9, 0.9, 2.7] } = {}) {
  const out = [];
  for (const [i, n] of tasuj(liczby).entries()) {
    const k = await c.object("karta_cyfry", { obraz: "/game/assets/menu/karta.webp", x: xs[i], y, size: 1.5 });
    await c.digit(n, { x: xs[i], y: y + 0.05, size: 0.95, duration: 0.2 });
    k.liczba = n; out.push(k);
  }
  return out;
}
// pack exactly `ile` things into the bag by dragging; one more jumps back
function spakuj(c, rzeczy, torba, ile, kto, zaDuzo) {
  const S = c.stage; let dane = 0;
  const [px, py] = [torba.mesh.position.x, torba.mesh.position.y];
  return new Promise((ok) => S.free({
    items: rzeczy.slice(), rozdaj: { wolni: () => (dane < ile ? [{ who: "torba" }] : []), pozycja: () => [px, py] },
    onDrop: async (h, p) => {
      if (Math.hypot(p.x - px, p.y - py) > 1.3) { await h.moveTo(h.home.x, h.home.y, 0.35); return; }
      if (dane >= ile) { c.sfx("wrong"); await h.moveTo(h.home.x, h.home.y, 0.35); await c.say(kto, zaDuzo); return; }
      dane++; c.sfx("plop"); h.mesh.position.z = torba.mesh.position.z - 0.02; await h.moveTo(px - 0.3 + (dane % 3) * 0.3, py + 0.55, 0.25);
      await c.say(kto, `line.n${dane}`);
      if (dane === ile) { await c.wait(0.4); S.endSort(); ok(); }
    },
    onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
  }));
}

export default {
  id: "counting_5",
  przejscia: true,
  nagrody: true,
  characters: { mis: { side: "right", x: 4.6 }, wiewiorka: { side: "left", x: -4.8 }, jez: { side: "left", x: -3.2 } },
  backgrounds: { story: "piekarnia", practice: { kolor: "#fbeedd", motyw: "kola" }, apply: "dom" },
  stages: {
    story: [
      // A. the bakery: five rolls counted; Bear spreads them - "more!"; counted again - five
      async (c) => {
        await Promise.all(["wiewiorka", "jez"].map((n) => c.enter(n)));
        await c.enter("mis", "right");
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_piekarnia", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await c.object("taca", { x: 0.6, y: 0.9, size: 5.2 });
        const b = [];
        for (let i = 0; i < 5; i++) b.push(await c.object("bulka", { x: -1.0 + i * 0.85, y: 1.1, size: 0.8 }));
        await c.say("wiewiorka", "line.a_ile");
        const raz = await c.count(b, { who: "wiewiorka" });
        await c.ujecie("sredni", { na: ["wiewiorka", ...b] });
        await c.say("wiewiorka", "line.a_piec");
        await c.ujecie("ogolny");
        raz.znaczki.forEach((z) => z.remove?.());                       // the numbers go before the rolls move
        // Bear spreads them across the counter
        await c.ujecie("sredni", { na: ["mis", ...b] });
        await c.say("mis", "line.a_rozloze");
        await c.ujecie("ogolny");
        await Promise.all(b.map((h, i) => h.moveTo(-1.5 + i * 1.1, -0.6 - (i % 2) * 0.7, 0.6)));
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_wiecej", { anim: "Podskok" });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.wonder("jez");
        await c.ujecie("ogolny");
        await c.say("jez", "line.a_policz");
        await c.count(b, { who: "jez" });
        await c.ujecie("sredni", { na: ["jez", ...b] });   // the spread rolls, still five
        await c.say("jez", "line.a_dalej_piec", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.a_rozumiem", { anim: "Kiwanie" });
        await c.ujecie("ogolny");
        c.clear();
        // the first order: four rolls into a bag
        await c.ujecie("sredni", { na: ["wiewiorka", "jez"] });
        await c.say("wiewiorka", "line.a_zamowienie");
        await c.ujecie("ogolny");
        const torba = await c.object("torebka", { x: 1.6, y: -1.6, size: 1.8 });
        const r = []; for (let i = 0; i < 6; i++) r.push(await c.object("bulka", { x: -2.4 + i * 0.9, y: 1.4 - (i % 2) * 0.6, size: 0.8 }));
        await c.say("mis", "line.a_spakuj");
        await spakuj(c, r, torba, 4, "mis", "line.a_za_duzo");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_cztery", { anim: "Radosc" });
        await c.ujecie("ogolny");
        c.clear();
      },
      // B. the orchard: which basket has five? - a row, a domino, a hand; Hedgehog's hops; the customers pay
      async (c) => {
        const S = c.stage;
        await c.go("sad", { enter: true });
        await Promise.all(["wiewiorka", "jez", "mis"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.b_jablka");
        await c.ujecie("ogolny");
        const kupki = [];
        for (const [i, n] of tasuj([3, 5, 4]).entries()) { const h = await c.kupka("jablko", n, { x: -1.6 + i * 2.2, y: 0.6, size: 1.7 }); h.ile = n; kupki.push(h); }
        await c.say("wiewiorka", "line.b_ktora");
        const ok = kupki.find((h) => h.ile === 5);
        dobre(ok); await c.task({ targets: kupki, correct: ok, wrong: "line.b_ktora_nie" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_dobrze");
        await c.ujecie("ogolny");
        c.clear();
        // five has many faces: a domino tile and a hand
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.b_piec_twarzy");
        await c.ujecie("ogolny");
        const d = []; for (const [i, [a, bb]] of tasuj([[2, 3], [1, 2], [4, 2]]).entries()) d.push(c.domino(a, bb, { x: -1.4 + i * 2.0, y: 0.6 }));
        await c.say("wiewiorka", "line.b_domino");
        const okd = d.find((h) => h.suma === 5);
        dobre(okd); await c.task({ targets: d, correct: okd, wrong: "line.b_domino_nie" });
        await c.ujecie("sredni", { na: ["jez", okd] });
        await c.say("jez", "line.b_dwa_i_trzy");
        await c.ujecie("ogolny");
        c.clear();
        // the breather: Hedgehog hops - count the hops
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.b_skacze", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const ile = 3 + Math.floor(Math.random() * 3);
        await c.dzwieki(ile, { kto: "jez", ruch: "skok", tempo: 0.65 });
        const k = await karty(c, [3, 4, 5]);
        await c.say("wiewiorka", "line.b_ile_skokow");
        const okk = k.find((q) => q.liczba === ile);
        dobre(okk); await c.task({ targets: k, correct: okk, wrong: "line.b_ile_skokow" });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", `line.b_skok${ile}`);
        await c.ujecie("ogolny");
        c.clear();
        // the first customer: a cookie for five coins
        await c.go("piekarnia");
        S.puppets.mis.korzen.position.x = 4.6;
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.b_klient", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.sklepik({ towar: "ciastko", cena: 5, x: 0.6 });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.b_zaplacone", { anim: "Radosc" });
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("wiewiorka"); c.show("mis");
        S.puppets.wiewiorka.korzen.position.x = -5.2; S.puppets.mis.korzen.position.x = 5.0;
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1. how many? point to the digit
        {
          const ile = 3 + Math.floor(Math.random() * 3);
          for (let i = 0; i < ile; i++) await c.object("bulka", { x: -2.0 + i * 1.1, y: 1.4, size: 1.0 });
          const k = await karty(c, [3, 4, 5]);
          await c.say("wiewiorka", "line.p_ile");
          const ok = k.find((q) => q.liczba === ile);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_ile_nie" });
          await c.ujecie("zblizenie", { na: "mis" });
          await c.say("mis", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 2. three rolls into the bag
        {
          const t = await c.object("torebka", { x: 1.4, y: -1.6, size: 1.8 });
          const r = []; for (let i = 0; i < 5; i++) r.push(await c.object("bulka", { x: -2.2 + i * 1.0, y: 1.4, size: 0.85 }));
          await c.say("mis", "line.p_trzy");
          await spakuj(c, r, t, 3, "mis", "line.p_trzy_juz");
          await c.ujecie("sredni", { na: ["wiewiorka", t] });   // the packed bag
          await c.say("wiewiorka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 3. which tray has five: spread or close - both? Only one has five
        {
          const tr = [];
          for (const [i, [n, krok]] of tasuj([[5, 0.75], [4, 0.45]]).entries()) {
            const x0 = i ? 0.6 : -2.9, hs = [];
            for (let k = 0; k < n; k++) hs.push(await c.object("ciastko", { x: x0 + k * krok, y: 0.6 - (k % 2) * 0.3, size: 0.75 }));
            const ram = await c.zone({ x: x0 + ((n - 1) * krok) / 2, y: 0.45, w: (n - 1) * krok + 1.3, h: 1.6, name: "taca" + i }); ram.ile = n; tr.push(ram);
          }
          await c.say("wiewiorka", "line.p_taca");
          const ok = tr.find((z) => z.ile === 5);
          dobre(ok); await c.task({ targets: tr, correct: ok, wrong: "line.p_taca_nie" });
          await c.ujecie("sredni", { na: ["mis", ok] });
          await c.say("mis", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 4. memory: a number and as many dots
        {
          await c.ujecie("sredni", { na: ["mis"] });
          await c.say("mis", "line.p_memory");
          await c.ujecie("ogolny");
          await c.memory([2, 3, 4, 5].map((n) => [{ cyfra: n }, { kropki: n }]), { szer: 1.4 });
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 5. the fourth roll in the row
        {
          const b = []; for (let i = 0; i < 5; i++) b.push(await c.object("bulka", { x: -2.4 + i * 1.2, y: 0.6, size: 1.0 }));
          const s = await c.line([[-3.9, -0.4], [-3.1, -0.4]], { width: 0.11, color: "#1f5fbf", duration: 0.3, strong: true });
          await c.say("wiewiorka", "line.p_czwarta");
          dobre(b[3]); await c.task({ targets: b, correct: b[3], wrong: "line.p_czwarta_nie" });
          s.remove();
          await c.ujecie("zblizenie", { na: "mis" });
          await c.say("mis", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        await c.ujecie("zblizenie", { na: "mis" });
        await c.praise("mis");
        await c.ujecie("ogolny");
      },
    ],
    apply: [
      // home: the table set for five - five plates, then a cup for each plate
      async (c) => {
        for (const n of ["jez", "mis"]) c.show(n);
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.h_goscie", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const t = []; for (let i = 0; i < 5; i++) t.push(await c.object("talerz", { x: -2.2 + i * 1.2, y: -1.4, size: 1.0 }));
        await c.say("mis", "line.h_talerze");
        await c.count(t, { who: "mis" });
        await c.ujecie("sredni", { na: ["jez", ...t] });   // a cup for each counted plate
        await c.say("jez", "line.h_kubki");
        await c.ujecie("ogolny");
        const kubki = []; for (let i = 0; i < 5; i++) kubki.push(await c.object("kubek", { x: -2.2 + i * 1.2, y: 1.4, size: 0.85 }));
        await c.count(kubki, { who: "jez" });
        await c.ujecie("zblizenie", { na: "jez" });
        await c.say("jez", "line.h_po_jednym", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.h_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
