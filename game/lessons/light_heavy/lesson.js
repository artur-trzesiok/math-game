// Lesson: light and heavy - weight is felt (a raft that dips) and seen on a balance: the heavier pan goes down, and size
// does not tell weight. Beaver's raft must carry the picnic across the brook: Bear sinks it deep, Bunny hardly; in the
// workshop Bunny bets on the big pillow, the little stone's pan goes down; guess, then weigh; hide-and-seek; three
// things put in order from the lightest (the balloon is the biggest and the lightest), heavy in the middle of the raft,
// light on the edges; the crossing and the picnic glade. At home Bunny wants the big crisps bag on the low shelf; the
// paws and the balance show the small things are heavy; the shelves (heavy low, light high); Bear's heaviest bag under
// paper is a pumpkin; the soup. Script in scenario.md.

const GROUND = -3.3;                                                  // the stage floor (scene.js)

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const RAFT = { x: 0.2, y: 0.05, size: 5.4 };                             // on the water, not the bank

// the raft sinks under who stands on it (and the one standing goes down with it), d = how deep
const zanurz = (c, tratwa, kto, d, t = 0.6) => {
  const L = kto ? c.stage.puppets[kto] : null, y0 = tratwa.mesh.position.y, ly0 = L?.korzen.position.y, g0 = L?.podloga;
  if (d > 0.1) c.sfx("plop");
  return c.stage.tween(c.fast ? 0.1 : t, (s) => {
    const e = Math.sin(s * Math.PI / 2) + 0.12 * Math.sin(s * Math.PI * 3) * (1 - s);   // a little bob as it settles
    tratwa.mesh.position.y = y0 - d * e;
    tratwa.mesh.scale.y = tratwa.base * (1 - 0.3 * (y0 - d * e < RAFT.y - 0.01 ? (RAFT.y - (y0 - d * e)) : 0));   // lower in the water: less of it shows
    if (L) { L.korzen.position.y = ly0 - d * e; L.podloga = g0 - d * e; }
  });
};
// onto the raft's deck and back to the bank, with a hop
const naTratwe = (c, kto, tratwa, x) => c.przejdz(kto, [[x, tratwa.mesh.position.y + 0.25]], { skok: 0.6, glebia: 0.05 });
const naBrzeg = (c, kto) => c.przejdz(kto, [[c.stage.puppets[kto].home, GROUND]], { skok: 0.6, glebia: 0.05 });

// the balance's pans as drop points for the autopilot: przeciagaj itself has no test driver, so the drag set gets a
// `doLinii` (the autopilot drops each thing where it says); strona(h) = 0 left, 1 right, -1 back home
const naWage = (c, w, rzeczy, { gotowe, strona = (h) => rzeczy.indexOf(h) % 2, onPolozony } = {}) => {
  const p = w.przeciagaj({ rzeczy, gotowe: gotowe || ((s) => s.lewa.length + s.prawa.length === rzeczy.length), onPolozony });
  const ds = c.stage.dragSet;
  if (ds?.waga) ds.doLinii = (h) => { const k = strona(h); if (k < 0) return [h.home.x, h.home.y]; const s = w.szalki[k].mesh.position; return [s.x, s.y + 0.2]; };
  return p;
};
// which pan is down now (0 left, 1 right)
const dolna = (w) => (w.wynik() === "lewa" ? 0 : 1);
// two things waiting over the heads, one over each pan, in a random order
const nadSzalkami = async (c, w, para, y = 1.6) => {
  const [a, b] = tasuj(para), out = [];
  for (const [i, [name, masa, size]] of [a, b].entries()) {
    const h = await c.object(name, { x: w.szalki[i].mesh.position.x * 1.05, y, size }); h.masa = masa; out.push(h);
  }
  return out;
};
// things in order into places over the heads (an arrow at the first); never lying in the answer order already
async function poKolei(c, rzeczy, { x = 0.6, y = 2.0, yK = -2.35, krok = 2.0, wrong }) {
  const n = rzeczy.length, x0 = x - ((n - 1) * krok) / 2;
  let m = tasuj(rzeczy.map((_, i) => i)); while (m.every((v, i) => v === i)) m = tasuj(m);
  const items = [];
  for (const [i, [name, size]] of rzeczy.entries()) { const h = await c.object(name, { x: x0 + m[i] * krok, y: yK, size }); h.ranga = i; items.push(h); }
  await c.wait(0.4);
  const t = await c.slots({ items, slots: rzeczy.map((_, k) => ({ x: x0 + k * krok, y, w: krok * 0.9, h: 1.6, accept: (it) => it.ranga === k })), wrong });
  const strzalka = await c.arrow({ mesh: t.strefy[0].mesh, kind: "zone" });
  await t.done(); strzalka.remove();
  for (const h of items) h.slot = null;                               // free for the next places (the tests skip things with a slot)
  return { items: items.slice().sort((a, b) => a.ranga - b.ranga), t };
}
// a thing eaten: it shrinks away in the paw
const zjedz = async (c, h) => { const b = h.mesh.scale.x; c.sfx("pop"); await c.stage.tween(c.fast ? 0.1 : 0.5, (s) => h.mesh.scale.setScalar(b * (1 - s) + 0.001)); h.remove(); };

export default {
  id: "light_heavy",
  przejscia: true,
  nagrody: true,
  characters: { bobr: { side: "left", x: -5.0 }, zajac: { side: "left", x: -3.3 }, mis: { side: "right", x: 4.9 } },
  backgrounds: { story: "strumyk", practice: { kolor: "#e3eed3", motyw: "kola" }, apply: "dom" },
  stages: {
    story: [
      // A. the brook: Beaver's raft dips deep under Bear and hardly under Bunny - who is heavier?
      async (c) => {
        const S = c.stage;
        const tratwa = await c.object("tratwa", { ...RAFT, z: -0.2 });
        c.show("bobr"); c.show("zajac"); c.show("mis");
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("sredni", { na: ["bobr", tratwa] });                  // the builder and his raft
        await c.say("bobr", "line.a_tratwa", { anim: "Radosc" });
        await c.say("bobr", "line.a_uwaga", { anim: "Kiwanie" });
        await c.ujecie("ogolny");                                            // Bear hops across onto the raft
        await c.say("mis", "line.a_mis_pierwszy", { anim: "Podskok" });
        await naTratwe(c, "mis", tratwa, 0.6);
        await zanurz(c, tratwa, "mis", 0.5);
        await c.ujecie("sredni", { na: ["zajac", tratwa] });                 // the surprise, with the raft sunk deep in the shot
        c.emocja("zajac", "wykrzyknik");
        await c.say("zajac", "line.a_ojej");
        await c.ujecie("ogolny");                                            // Bear off, Bunny on
        await naBrzeg(c, "mis");
        await zanurz(c, tratwa, null, -0.5, 0.5);
        await c.say("zajac", "line.a_teraz_ja", { anim: "Podskok" });
        await naTratwe(c, "zajac", tratwa, 0.0);
        await zanurz(c, tratwa, "zajac", 0.06, 0.4);
        await c.ujecie("sredni", { na: ["zajac", tratwa] });
        await c.say("zajac", "line.a_pode_mna", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await naBrzeg(c, "zajac");
        await zanurz(c, tratwa, null, -0.06, 0.3);
        await c.say("bobr", "line.a_kto");
        const cele = [S.puppets.mis, S.puppets.zajac];
        dobre(S.puppets.mis); await c.task({ targets: cele, correct: S.puppets.mis, wrong: "line.a_kto_nie" }); dobre(cele, false);
        await c.ujecie("sredni", { na: ["mis", tratwa] });
        await c.say("bobr", "line.a_kto_tak");
        await c.ujecie("dwuujecie", { na: ["mis", "bobr"] });                // the question that needs the balance
        await c.say("mis", "line.a_rzeczy");
        await c.say("bobr", "line.a_waga", { anim: "Wskazanie" });
        c.clear();
      },
      // B. the workshop: the balance - Bunny bets on the big pillow, the little stone goes down; the insert; guess, then weigh
      async (c) => {
        await c.go("warsztat", { enter: true });
        await Promise.all(["bobr", "zajac", "mis"].map((n) => c.enter(n)));
        const w = await c.waga({ x: 0.6, y: -1.35, skala: 1 });
        await c.ujecie("sredni", { na: ["bobr", w.podstawa, ...w.szalki] });
        await c.say("bobr", "line.b_waga", { anim: "Wskazanie" });
        const kamyk = await c.object("kamyk", { x: -1.4, y: 1.8, size: 0.95 }); kamyk.masa = 3;
        const poduszka = await c.object("poduszka", { x: 2.4, y: 1.8, size: 2.0 }); poduszka.masa = 1;
        await c.ujecie("sredni", { na: ["zajac", poduszka, kamyk] });        // Bunny's bet: the big one must be heavy
        await c.say("zajac", "line.b_poduszka", { anim: "Zgloszenie" });
        await c.ujecie("dwuujecie", { na: ["mis", "zajac"] });
        await c.say("mis", "line.b_sprawdzmy", { anim: "Kiwanie" });
        await c.ujecie("ogolny");                                            // the task: the balance and both things in the shot
        await c.say("bobr", "line.b_poloz");
        await naWage(c, w, [kamyk, poduszka]);
        await c.wait(0.8);
        await c.ujecie("zblizenie", { na: "zajac" });                       // the surprise
        c.emocja("zajac", "wykrzyknik");
        await c.say("zajac", "line.b_co");
        // the method on a plain colour: the balance alone, a pencil arrow at the pan that went down
        await c.go({ kolor: "#f3e4c6", motyw: "kola" }, { ciecie: true });
        const w2 = await c.waga({ x: 0.6, y: -1.2, skala: 1 });
        const k2 = await c.object("kamyk", { x: -1.4, y: 1.8, size: 0.95 }); k2.masa = 3;
        const p2 = await c.object("poduszka", { x: 2.4, y: 1.8, size: 2.0 }); p2.masa = 1;
        await w2.poloz(k2, "lewa"); await w2.poloz(p2, "prawa");
        await c.ujecie("sredni", { na: [w2.podstawa, ...w2.szalki, k2, p2] });
        const strz = await c.arrow(w2.szalki[0]);
        await c.say("bobr", "line.b_metoda", { anim: "Wskazanie" });
        strz.remove();
        c.stage.bump(k2, 0.3); await c.wait(0.3); c.stage.bump(p2, 0.3);
        await c.say("bobr", "line.b_kamyk");
        await c.ujecie("zblizenie", { na: "zajac" });
        await c.say("zajac", "line.b_aha", { anim: "Radosc" });
        // back in the workshop: guess first, then weigh - a pumpkin and a feather, an apple and a nut
        await c.go("warsztat", { ciecie: true });
        for (const [para, pyt, nie, tak] of [
          [[["dynia", 3, 1.3], ["pioro_sowy", 0.2, 1.4]], "line.b_dynia", "line.b_dynia_nie", "line.b_dynia_tak"],
          [[["jablko", 2, 1.0], ["orzech", 0.5, 0.8]], "line.b_jablko", "line.b_jablko_nie", "line.b_jablko_tak"],
        ]) {
          const wp = await c.waga({ x: 0.6, y: -1.35, skala: 1 });
          const rz = await nadSzalkami(c, wp, para);
          await c.ujecie("ogolny");
          await c.say("bobr", pyt);
          const ok = rz.find((h) => h.masa > 1);
          dobre(ok); await c.task({ targets: rz, correct: ok, wrong: nie }); dobre(ok, false);
          await c.say("bobr", "line.b_sprawdz");
          await naWage(c, wp, rz);
          await c.wait(0.8);
          await c.ujecie("sredni", { na: [wp.szalki[dolna(wp)], ok] });     // the pan that went down
          await c.say(tak === "line.b_dynia_tak" ? "mis" : "zajac", tak, { anim: "Radosc" });
          c.clear();
        }
        await c.ujecie("dwuujecie", { na: ["mis", "bobr"] });
        await c.say("mis", "line.b_wracamy", { anim: "Machanie" });
      },
      // C. the brook: hide-and-seek, three things in order from the lightest, heavy in the middle of the raft, the crossing
      async (c) => {
        await c.go("strumyk", { enter: true });
        await Promise.all(["bobr", "zajac", "mis"].map((n) => c.enter(n)));
        await c.ujecie("dwuujecie", { na: ["zajac", "bobr"] });
        await c.say("zajac", "line.c_chowany", { anim: "Podskok" });
        await c.say("bobr", "line.c_szukam", { anim: "Kiwanie" });
        await c.ujecie("ogolny");                                            // the bushes and the hiders: the whole bank
        await c.ktoPowiedzial({ gospodarz: "bobr", kryjowki: ["mis", "zajac"] });
        const tratwa = await c.object("tratwa", { ...RAFT, z: -0.2 });
        await c.wait(0.4);
        await c.say("bobr", "line.c_ladujemy", { anim: "Wskazanie" });
        // the order: the balloon (the biggest) is the lightest
        const kolej = poKolei(c, [["balonik", 1.5], ["jablko", 0.8], ["arbuz", 1.15]], { wrong: "line.c_uloz_nie" });
        await c.wait(0.6);
        await c.say("bobr", "line.c_uloz");
        const { items: [balonik, jablko, arbuz], t } = await kolej;
        await c.ujecie("sredni", { na: [balonik, jablko, arbuz] });
        await c.say("bobr", "line.c_ulozone");
        t.remove();
        await c.ujecie("ogolny");                                            // Bunny takes the apple off the row
        await c.take("zajac", jablko);
        await c.say("zajac", "line.c_jablko", { anim: "Radosc" });
        await zjedz(c, jablko); c.stage.puppets.zajac.trzyma = null; c.stage.puppets.zajac.niesie = false;
        // the raft: heavy in the middle, light on the edges
        const garnek = await c.object("garnek", { x: 1.0, y: -2.4, size: 1.0 });
        const kocyk = await c.object("kocyk", { x: 2.4, y: -2.4, size: 1.0 });
        await Promise.all([balonik.moveTo(-1.6, -2.2, 0.5), arbuz.moveTo(-0.3, -2.45, 0.5)]);
        for (const h of [balonik, arbuz]) h.home = { x: h.mesh.position.x, y: h.mesh.position.y };
        for (const h of [arbuz, garnek]) h.tag = "ciezkie";
        for (const h of [balonik, kocyk]) h.tag = "lekkie";
        await c.say("bobr", "line.c_srodek");
        const dy = tratwa.mesh.position.y + 0.35;
        const miejsca = [[-1.8, "lekkie"], [-0.6, "ciezkie"], [0.6, "ciezkie"], [1.8, "lekkie"]].map(([dx, tag]) =>
          ({ x: RAFT.x + dx, y: dy, w: 1.15, h: 1.3, accept: (h) => h.tag === tag }));
        const zal = await c.slots({ items: [balonik, arbuz, garnek, kocyk], slots: miejsca, wrong: "line.c_srodek_nie" });
        await zal.done();
        await c.ujecie("sredni", { na: [tratwa, arbuz, garnek, balonik, kocyk] });
        await c.say("bobr", "line.c_srodek_tak", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["mis", "bobr"] });
        await c.say("mis", "line.c_a_ja", { anim: "Smutek" });
        await c.say("bobr", "line.c_ty_srodek", { anim: "Radosc" });
        // the crossing (an event illustration), then the far bank
        const il = await c.ilustracja("tratwa_przeprawa", { ruch: "najazd" });
        await c.say("bobr", "line.c_plyniemy");
        await il.zsun();
        c.clear();
      },
      // D. the picnic glade on the far bank: nothing fell in; the invitation to pumpkin soup at Bear's
      async (c) => {
        await c.go("polana_piknik", { enter: true });
        await Promise.all(["bobr", "zajac", "mis"].map((n) => c.enter(n)));
        await c.ujecie("ogolny");                                            // the arrival
        await c.say("mis", "line.c_brzeg", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.c_dziekuje", { anim: "Brawo" });
        await c.ujecie("dwuujecie", { na: ["mis", "zajac"] });
        await c.say("mis", "line.c_zupa", { anim: "Machanie" });
      },
    ],
    practice: [
      // the weighing school: five games, a star each
      async (c) => {
        const S = c.stage;
        for (const n of ["bobr", "zajac", "mis"]) c.show(n);
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.p_start", { anim: "Radosc" });
        // 1. which is heavier: the big one is light
        for (const [para, pyt, nie, tak] of [
          [[["balonik", 2.4], ["kamyk", 1.2]], "line.p_kamyk", "line.p_kamyk_nie", "line.p_kamyk_tak"],
          [[["poduszka", 2.3], ["mlotek", 1.2]], "line.p_mlotek", "line.p_mlotek_nie", "line.p_mlotek_tak"],
        ]) {
          const xs = tasuj([-1.3, 1.5]);
          const rz = []; for (const [i, [n, size]] of para.entries()) rz.push(await c.object(n, { x: xs[i], y: 1.2, size }));
          await c.ujecie("ogolny");
          await c.say("mis", pyt);
          dobre(rz[1]); await c.task({ targets: rz, correct: rz[1], wrong: nie }); dobre(rz[1], false);
          await c.ujecie("sredni", { na: [rz[1]] });
          await c.say("bobr", tak);
          c.clear();
        }
        gw.dodaj();
        // 2. the balance: point to the pan that will go down, then it is weighed
        {
          const w = await c.waga({ x: 0.6, y: -1.2, skala: 1 });
          const rz = await nadSzalkami(c, w, [["glaz", 3, 1.0], ["listek", 0.3, 1.1]]);
          await c.ujecie("ogolny");
          await c.say("bobr", "line.p_szalka");
          const k = rz.findIndex((h) => h.masa > 1), ok = w.szalki[k];
          dobre(ok); await c.task({ targets: w.szalki, correct: ok, wrong: "line.p_szalka_nie" }); dobre(ok, false);
          for (const [i, h] of rz.entries()) { const s = w.szalki[i].mesh.position; await h.moveTo(s.x, s.y + 0.4, 0.3); await w.poloz(h, i ? "prawa" : "lewa"); }
          await c.wait(0.6);
          await c.ujecie("sredni", { na: [ok, rz[k]] });
          await c.say("mis", "line.p_szalka_tak", { anim: "Radosc" });
          c.clear(); gw.dodaj();
        }
        // 3. in order from the lightest: the leaf is drawn the biggest
        {
          await c.ujecie("ogolny");
          const kolej = poKolei(c, [["listek", 1.4], ["jablko", 0.85], ["dynia", 1.05]], { wrong: "line.p_kolejka_nie" });
          await c.wait(0.6);
          await c.say("bobr", "line.p_kolejka");
          const { items } = await kolej;
          await c.ujecie("sredni", { na: items });
          await c.say("mis", "line.p_kolejka_tak", { anim: "Radosc" });
          c.clear(); gw.dodaj();
        }
        // 4. level: apples against a jar of honey, until the pans are at one height
        {
          await c.ujecie("ogolny");
          const w = await c.waga({ x: 0.6, y: -1.2, skala: 1 });
          const miod = await c.object("sloik", { x: -1.6, y: 1.6, size: 1.1 }); miod.masa = 2;
          const s0 = w.szalki[0].mesh.position; await miod.moveTo(s0.x, s0.y + 0.4, 0.4); await w.poloz(miod, "lewa");
          const jablka = []; for (let i = 0; i < 3; i++) { const h = await c.object("jablko", { x: 1.0 + i * 0.9, y: 1.7, size: 0.75 }); h.masa = 1; jablka.push(h); }
          await c.say("bobr", "line.p_rowno");
          let ostrzezony = false;
          await naWage(c, w, jablka, {
            gotowe: (s) => s.prawa.length > 0 && s.wynik() === "rowno",
            strona: (h) => (jablka.indexOf(h) < 2 ? 1 : -1),
            onPolozony: (h, s) => { if (!ostrzezony && s.wynik() === "prawa") { ostrzezony = true; c.say("mis", "line.p_rowno_za_duzo").catch(() => {}); } },
          });
          await c.wait(0.6);
          await c.ujecie("sredni", { na: [...w.szalki, miod] });
          await c.say("mis", "line.p_rowno_tak", { anim: "Radosc" });
          c.clear(); gw.dodaj();
        }
        // 5. who can carry it: the heavy log - Bear; the balloon lifts only someone light - Bunny
        {
          const cele = [S.puppets.mis, S.puppets.zajac];
          const bal = await c.object("bal", { x: 0.3, y: 1.2, size: 1.5 });
          await c.ujecie("ogolny");
          await c.say("bobr", "line.p_bal");
          dobre(S.puppets.mis); await c.task({ targets: cele, correct: S.puppets.mis, wrong: "line.p_bal_nie" }); dobre(cele, false);
          await c.take("mis", bal);
          await c.ujecie("sredni", { na: ["mis"] });
          await c.say("mis", "line.p_bal_tak", { anim: "Radosc" });
          await c.put("mis", 2.6, -2.5);
          await c.ujecie("ogolny");
          const balonik = await c.object("balonik", { x: -0.6, y: 1.3, size: 1.5 });
          await c.say("bobr", "line.p_balonik");
          dobre(S.puppets.zajac); await c.task({ targets: cele, correct: S.puppets.zajac, wrong: "line.p_balonik_nie" }); dobre(cele, false);
          await c.take("zajac", balonik);
          const L = S.puppets.zajac;
          await S.tween(c.fast ? 0.1 : 0.8, (s) => { L.korzen.position.y = GROUND + 1.2 * Math.sin(s * Math.PI / 2); });   // Bunny floats up
          await c.say("zajac", "line.p_balonik_tak", { anim: "Radosc" });
          await S.tween(c.fast ? 0.1 : 0.7, (s) => { L.korzen.position.y = GROUND + 1.2 * (1 - s); });
          await c.put("zajac", -1.0, 1.3);
          c.clear(); gw.dodaj();
        }
        await c.praise("bobr");
      },
    ],
    apply: [
      // home - the third act in Bear's kitchen: Bunny's big bag on the low shelf, the paws and the balance show the small
      // things are heavy, the shelves, the heaviest bag under paper, the soup
      async (c) => {
        const S = c.stage;
        for (const n of ["bobr", "zajac", "mis"]) c.show(n);
        await c.wait(0.4);
        const m = await c.miejsca();
        await c.ujecie("dwuujecie", { na: ["mis", "bobr"] });                // home, the plan
        await c.say("mis", "line.d_dom", { anim: "Radosc" });
        const chipsy = await c.object("torba_chipsy", { x: -0.6, y: -2.35, size: 1.15 }); chipsy.tag = "lekkie";
        const ziemniaki = await c.object("torba_ziemniaki", { x: 1.5, y: -2.5, size: 0.9 }); ziemniaki.tag = "ciezkie";
        await c.wait(0.4);
        // Bunny's mistake, played: the big bag onto the low shelf
        await c.ujecie("sredni", { na: ["zajac", chipsy, ziemniaki] });
        await c.say("zajac", "line.d_zajac", { anim: "Zgloszenie" });
        await c.take("zajac", chipsy);
        await c.put("zajac", m.polka_dolna.x, m.polka_dolna.y + 0.3);
        await c.ujecie("zblizenie", { na: "bobr" });                        // the objection
        await c.wonder("bobr");
        await c.say("bobr", "line.d_bobr_nie");
        // felt in the paws: Bear sweats under the small bag, Bunny hops with the big one
        await c.ujecie("dwuujecie", { na: ["mis", "zajac"] });               // the two who will hold the bags
        await c.say("mis", "line.d_lapki");
        await c.walkTo("mis", 3.3);                                          // nearer: the bag in his paw stays in the frame
        await Promise.all([c.take("mis", ziemniaki), c.take("zajac", chipsy)]);
        c.emocja("mis", "pot");
        c.play("zajac", "Podskok");
        await c.wait(0.6);
        await c.ujecie("ogolny");                                            // the task: both bags in the shot
        await c.say("bobr", "line.d_ktora");
        dobre(ziemniaki); await c.task({ targets: [chipsy, ziemniaki], correct: ziemniaki, wrong: "line.d_ktora_nie" }); dobre(ziemniaki, false);
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.d_ktora_tak");
        await c.ujecie("ogolny");
        // the bags wait on the table, clear of the balance's pans
        await Promise.all([c.put("mis", -2.2, m.stol.y + 0.45), c.put("zajac", -3.1, m.stol.y + 0.6)]);
        await c.walkTo("mis", S.puppets.mis.home);
        // the jars on the balance: this time Bunny checks
        const w = await c.waga({ x: 0.6, y: -1.35, skala: 1 });
        const sl = await nadSzalkami(c, w, [["sloik_popcorn", 1, 1.1], ["sloik", 2, 0.75]], 1.9);
        const miod = sl.find((h) => h.masa > 1), popcorn = sl.find((h) => h !== miod);
        await c.ujecie("sredni", { na: ["bobr", ...sl] });
        await c.say("bobr", "line.d_sloiki");
        await c.ujecie("sredni", { na: ["zajac", w.podstawa, ...w.szalki] });  // Bunny turns to the balance
        await c.say("zajac", "line.d_nie_zgaduje", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        await c.say("bobr", "line.d_poloz");
        await naWage(c, w, sl);
        await c.wait(0.8);
        await c.ujecie("sredni", { na: [w.szalki[dolna(w)], miod] });
        await c.say("zajac", "line.d_sloiki_tak", { anim: "Radosc" });
        // onto the shelves: heavy low, light high (two places on each painted shelf)
        await c.ujecie("ogolny");
        await Promise.all([miod.moveTo(0.4, -2.55, 0.5), popcorn.moveTo(-0.5, -2.3, 0.5)]);
        w.remove();
        miod.tag = "ciezkie"; popcorn.tag = "lekkie";
        await c.say("bobr", "line.d_polki");
        const polka = (p, tag) => [-1, 1].map((k) => ({ x: p.x + k * p.w / 4, y: p.y, w: Math.max(0.9, p.w / 2), h: Math.max(0.7, p.h), accept: (h) => h.tag === tag, niewidoczna: true, rodzaj: p.rodzaj }));
        const t = await c.slots({ items: [chipsy, ziemniaki, miod, popcorn], slots: [...polka(m.polka_dolna, "ciezkie"), ...polka(m.polka_gorna, "lekkie")], wrong: "line.d_polki_nie" });
        await t.done();
        await c.ujecie("sredni", { na: ["mis", chipsy, ziemniaki, miod, popcorn] });
        await c.say("mis", "line.d_polki_tak", { anim: "Radosc" });
        // Bear's heaviest bag under paper: a scratch-off
        await c.ujecie("dwuujecie", { na: ["mis", "zajac"] });               // Bear's secret, Bunny's idea
        await c.say("mis", "line.d_worek");
        await c.say("zajac", "line.d_zdrap");
        await c.ujecie("ogolny");                                            // the picture flies up from the whole kitchen
        const z = await c.zdrapka("zakupy_misia");
        await c.say("mis", "line.d_odkryte", { anim: "Radosc" });
        await c.say("zajac", "line.d_co_ciezkie");
        dobre(z.cele); await c.task({ targets: [...z.cele, z.tlo], correct: z.cele, wszystkie: true, wrong: "line.d_co_ciezkie_nie" }); dobre(z.cele, false);
        await c.say("mis", "line.d_dynia", { anim: "Radosc" });
        await z.remove();
        // the payoff: the soup (an event illustration), then the home game shown and the task for the parents
        const il = await c.ilustracja("zupa_dyniowa", { ruch: "najazd" });
        await c.say("mis", "line.d_zupa");
        await c.say("zajac", "line.d_mniam");
        await il.zsun();
        // the home game alone, on a plain colour: a thing in each paw - which is heavier?
        await c.go({ kolor: "#f5e3c4", motyw: "kola" }, { ciecie: true });
        await c.ujecie("ogolny");
        await c.walkTo("mis", 3.3);                                          // nearer: the apple in his paw stays in the frame
        const orzech = await c.object("orzech", { x: -1.2, y: -2.4, size: 0.85 }), jablko = await c.object("jablko", { x: 1.6, y: -2.4, size: 1.1 });
        await Promise.all([c.take("zajac", orzech), c.take("mis", jablko)]);
        await c.ujecie("dwuujecie", { na: ["zajac", "mis"] });
        await c.say("zajac", "line.d_pokaz", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "bobr" });
        await c.say("bobr", "line.d_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
