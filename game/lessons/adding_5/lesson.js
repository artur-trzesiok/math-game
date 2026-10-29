// Lesson: adding to 5 - adding is putting two groups together and counting them all; the signs + and =; the order does
// not matter (1 + 4 = 4 + 1). Fox's picnic, guests keep arriving: Bunny counts only the newcomer ("one!"); Fox's
// invitation shows who is still missing (two more); the child brings the guests onto the blanket and counts all; equations with a gap for a card; a domino turned round still
// has five dots. At home: cups for the guests. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// number cards in a row: a paper card (the target) with the number drawn on it
async function karty(c, liczby, { y = -2.2, xs = [-1.3, 0.5, 2.3] } = {}) {
  const out = [];
  for (const [i, n] of tasuj(liczby).entries()) {
    const k = await c.object("karta_cyfry", { obraz: "/game/assets/menu/karta.webp", x: xs[i], y, size: 1.4 });
    k.cyfra = await c.digit(n, { x: xs[i], y: y + 0.05, size: 0.9, duration: 0.2 });
    k.liczba = n; out.push(k);
  }
  return out;
}
// an equation with its result missing: the child picks the card, it flies into the gap
async function wynik(c, a, b, { y = 2.6, linia, wrong, who }) {
  const r = await c.equation([a, "+", b, "=", null], { y, size: 1.1 });
  const k = await karty(c, tasuj([a + b, a + b === 5 ? 3 : a + b + 1, a + b - 1]));
  await c.say(who, linia);
  const ok = k.find((q) => q.liczba === a + b);
  dobre(ok); await c.task({ targets: k, correct: ok, wrong });
  for (const q of k) if (q !== ok) { q.cyfra.remove(); q.remove(); }
  const [gx, gy] = [r.luki[0].x, r.luki[0].y];
  ok.cyfra.remove(); await ok.moveTo(gx, gy, 0.4); await c.digit(a + b, { x: gx, y: gy + 0.05, size: 0.8, duration: 0.2 });
  return r;
}
// the guests on the blanket: a zone; newcomers dragged onto it (all of them tagged for it)
async function dolacz(c, koc, goscie, wrong) {
  for (const g of goscie) g.tag = "koc";
  await c.sort({ items: goscie, zones: [koc], wrong });
}

// the blanket: the sticker lies under a plain zone (with the zone's own image the guests sat hidden under the fold)
async function kocyk(c, { x = 0.3, y = -1.6, w = 3.8, h = 1.8 } = {}) {
  const k = await c.object("kocyk", { x, y: y - 0.1, size: w * 1.05, z: 0.2 });
  k.mesh.traverse((o) => { if (o.isMesh) o.renderOrder = 9.5; });
  const z = await c.zone({ x, y: y + 0.25, w, h, name: "koc" }); z.want = "koc";
  return z;
}

export default {
  id: "adding_5",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -4.8 }, zajac: { side: "left", x: -3.0 }, sarenka: { side: "right", x: 4.7 } },
  backgrounds: { story: "laka", practice: { kolor: "#f6eedf", motyw: "kola" }, apply: "dom" },
  stages: {
    story: [
      // A. the meadow: two guests on the blanket, one more comes; Bunny counts only the newcomer; together - three
      async (c) => {
        await Promise.all(["lisek", "zajac", "sarenka"].map((n) => c.enter(n, n === "sarenka" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.a_piknik", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const koc = await kocyk(c);
        for (const n of ["jez", "mysz"]) { const h = await c.object(n, { x: 0, y: -1.6, size: 1.0 }); h.tag = "koc"; koc.put(h); }
        await c.wait(0.4);                                              // the blanket pops in: frame it at full size
        await c.ujecie("sredni", { na: ["lisek", koc] });   // the two guests on the blanket
        await c.say("lisek", "line.a_dwoje");
        await c.ujecie("ogolny");
        const kacz = await c.object("kaczatko_stoi", { x: 3.0, y: 0.9, size: 1.0 });
        await c.ujecie("sredni", { na: ["sarenka", kacz] });
        await c.say("sarenka", "line.a_ktos_idzie");
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_jeden", { anim: "Podskok" });
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.wonder("sarenka");
        await c.say("sarenka", "line.a_nie_jeden");
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.a_dodawanie", { anim: "Zgloszenie" });
        await dolacz(c, koc, [kacz], "line.a_na_koc");
        await c.say("sarenka", "line.a_policz");
        await c.count(koc.items, { who: "zajac" });
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.a_troje", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await c.equation([2, "+", 1, "=", 3], { y: 2.6, size: 1.1 });
        await c.say("sarenka", "line.a_plus");
        await c.wait(0.6); c.clear();
        // is that everyone? Fox's invitation shows all he invited - who is not on the blanket yet? two more: 3 + 2
        const koc2 = await kocyk(c, { x: 0.5, w: 4.6, h: 2.0 });
        for (const n of ["jez", "mysz", "kaczatko_stoi"]) { const h = await c.object(n, { x: 0, y: -1.6, size: 0.95 }); h.tag = "koc"; koc2.put(h); }
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.wonder("lisek");
        await c.say("lisek", "line.a_czy_wszyscy");
        await c.ujecie("ogolny");
        const zapr = await c.znalezisko("zaproszenie_lisa", { skad: "lisek", y: 0.9 });
        const goscie = zapr.cele.slice().sort((a, b) => zapr.meta.cele[a.nr].x - zapr.meta.cele[b.nr].x);   // snail, hedgehog, butterfly, mouse, duckling
        const brak = [goscie[0], goscie[2]];
        await c.say("sarenka", "line.a_kogo_brakuje");
        dobre(zapr.cele, false); dobre(brak); await c.task({ targets: [...zapr.cele, zapr.tlo], correct: brak, wszystkie: true, wrong: "line.a_kogo_brakuje_nie" }); dobre(brak, false);
        const obwod = [await c.circle(brak[0]), await c.circle(brak[1])];
        await c.say("lisek", "line.a_brakuje_dwoch", { anim: "Zgloszenie" });
        await c.say("sarenka", "line.a_trzech_i_dwoch");
        obwod.forEach((o) => o.remove()); await zapr.remove();
        await c.ujecie("sredni", { na: ["lisek", "zajac"] });
        await c.say("lisek", "line.a_wiecej_gosci", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const nowi = [await c.object("slimak", { x: 2.4, y: 1.0, size: 0.9 }), await c.object("motyl", { x: 3.3, y: 1.4, size: 0.9 })];
        await c.say("lisek", "line.a_przyprowadz");
        await dolacz(c, koc2, nowi, "line.a_na_koc");
        await c.count(koc2.items, { who: "lisek" });
        await wynik(c, 3, 2, { linia: "line.a_ktora_karta", wrong: "line.a_ktora_karta_nie", who: "sarenka" });
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.a_pieciu", { anim: "Brawo" });
        await c.ujecie("ogolny");
        c.clear();
      },
      // B. the orchard: which domino has four; a domino turned round still has five; the breather - guests clap
      async (c) => {
        const S = c.stage;
        await c.go("sad", { enter: true });
        await Promise.all(["lisek", "zajac", "sarenka"].map((n) => c.enter(n, n === "sarenka" ? "right" : "left")));
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.b_domino", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const d = []; for (const [i, [a, b]] of tasuj([[1, 3], [2, 3], [1, 1]]).entries()) d.push(c.domino(a, b, { x: -1.2 + i * 2.0, y: 0.8 }));
        await c.say("sarenka", "line.b_cztery");
        const ok = d.find((h) => h.suma === 4);
        dobre(ok); await c.task({ targets: d, correct: ok, wrong: "line.b_cztery_nie" });
        await c.ujecie("sredni", { na: ["zajac", ok] });   // the right tile beside Bunny
        await c.say("zajac", "line.b_jeden_i_trzy");
        await c.ujecie("ogolny");
        c.clear();
        // the order trick: 1 + 4, the tile turns round - 4 + 1, still five
        const t = c.domino(1, 4, { x: 0.6, y: 0.9, size: 2.8 });
        await c.wait(0.4);                                              // the tile pops in: frame it at full size
        await c.ujecie("sredni", { na: ["lisek", t] });
        await c.say("lisek", "line.b_jeden_cztery");
        await c.ujecie("ogolny");
        const r1 = await c.equation([1, "+", 4, "=", 5], { x: 0.6, y: -1.7, size: 0.9 });
        await c.say("lisek", "line.b_obracam", { anim: "Zgloszenie" });
        c.sfx("whoosh"); await S.tween(0.6, (s) => { t.mesh.rotation.z = Math.PI * s; });
        await c.rozblysk(t);
        r1.remove(); await c.equation([4, "+", 1, "=", null], { x: 0.6, y: -1.7, size: 0.9 });
        const k = await karty(c, [4, 5, 6], { y: 2.4, xs: [-1.2, 0.6, 2.4] });
        await c.say("sarenka", "line.b_ile_teraz");
        const okk = k.find((q) => q.liczba === 5);
        dobre(okk); await c.task({ targets: k, correct: okk, wrong: "line.b_ile_teraz_nie" });
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.say("sarenka", "line.b_tyle_samo", { anim: "Kiwanie" });
        await c.ujecie("ogolny");
        c.clear();
        // the breather: two claps and one more - how many claps?
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.b_klaszczemy", { anim: "Podskok" });
        await c.ujecie("ogolny");
        await c.dzwieki(2, { kto: "lisek", ruch: "klask", tempo: 0.6 });
        await c.wait(0.4);
        await c.dzwieki(1, { kto: "zajac", ruch: "klask", tempo: 0.6 });
        const kk = await karty(c, [2, 3, 4], { xs: [-0.6, 1.2, 3.0] });
        await c.say("sarenka", "line.b_ile_klasniec");
        const ok3 = kk.find((q) => q.liczba === 3);
        dobre(ok3); await c.task({ targets: kk, correct: ok3, wrong: "line.b_ile_klasniec_nie" });
        await c.ujecie("sredni", { na: ["lisek", "zajac"] });
        await c.say("lisek", "line.b_koniec");
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("lisek"); c.show("sarenka");
        S.puppets.lisek.korzen.position.x = -5.2; S.puppets.sarenka.korzen.position.x = 5.2;
        const gw = c.gwiazdki(5, { auto: false });
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.say("sarenka", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1. two apples and two more into the basket, then how many?
        {
          const kosz = await c.zone({ x: 0.4, y: -1.6, w: 3.4, h: 1.9, image: "koszyk", name: "koszyk" }); kosz.want = "kosz";
          for (let i = 0; i < 2; i++) { const h = await c.object("jablko", { x: 0, y: -1.6, size: 0.85 }); h.tag = "kosz"; kosz.put(h); }
          const n = [await c.object("jablko", { x: -1.6, y: 1.4, size: 0.85 }), await c.object("jablko", { x: 2.4, y: 1.4, size: 0.85 })];
          await c.say("lisek", "line.p_kosz");
          for (const h of n) h.tag = "kosz";
          await c.sort({ items: n, zones: [kosz] });
          await c.count(kosz.items, { who: "lisek" });
          await c.ujecie("zblizenie", { na: "sarenka" });
          await c.say("sarenka", "line.p_cztery"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 2. 2 + 2 = ?
        {
          await wynik(c, 2, 2, { linia: "line.p_karta", wrong: "line.p_karta_nie", who: "lisek" });
          await c.ujecie("zblizenie", { na: "sarenka" });
          await c.say("sarenka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 3. which domino has five?
        {
          const d = []; for (const [i, [a, b]] of tasuj([[3, 2], [2, 2], [1, 3]]).entries()) d.push(c.domino(a, b, { x: -1.4 + i * 2.0, y: 0.6 }));
          await c.say("sarenka", "line.p_domino");
          const ok = d.find((h) => h.suma === 5);
          dobre(ok); await c.task({ targets: d, correct: ok, wrong: "line.p_domino_nie" });
          await c.ujecie("sredni", { na: ["lisek", ok] });
          await c.say("lisek", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 4. two coins and one more: pay three
        {
          await c.ujecie("sredni", { na: ["lisek"] });
          await c.say("lisek", "line.p_sklep");
          await c.ujecie("ogolny");
          await c.sklepik({ towar: "jablko", cena: 3, x: 0.4 });
          await c.ujecie("zblizenie", { na: "sarenka" });
          await c.say("sarenka", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        // 5. 4 + 1 = ?
        {
          await wynik(c, 4, 1, { linia: "line.p_karta", wrong: "line.p_karta_nie", who: "sarenka" });
          await c.ujecie("zblizenie", { na: "lisek" });
          await c.say("lisek", "line.p_dobrze"); gw.dodaj();
          await c.ujecie("ogolny"); c.clear();
        }
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.praise("sarenka");
        await c.ujecie("ogolny");
      },
    ],
    apply: [
      // home: two cups on the table, two more from the shelf - how many cups for the guests?
      async (c) => {
        for (const n of ["lisek", "zajac"]) c.show(n);
        await c.ujecie("sredni", { na: ["lisek", "zajac"] });
        await c.say("lisek", "line.h_kubki", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const taca = await c.zone({ x: 0.6, y: -1.5, w: 3.6, h: 1.5, image: "taca", name: "taca" }); taca.want = "taca";
        for (let i = 0; i < 2; i++) { const h = await c.object("kubek", { x: 0, y: -1.5, size: 0.85 }); h.tag = "taca"; taca.put(h); }
        const n = [await c.object("kubek", { x: -1.4, y: 1.5, size: 0.85 }), await c.object("kubek", { x: 2.6, y: 1.5, size: 0.85 })];
        await c.say("zajac", "line.h_dostaw");
        for (const h of n) h.tag = "taca";
        await c.sort({ items: n, zones: [taca] });
        await wynik(c, 2, 2, { linia: "line.h_ile", wrong: "line.p_karta_nie", who: "lisek" });
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.h_cztery", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.h_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
