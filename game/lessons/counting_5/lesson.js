// Lesson: counting to 5 - one number for each thing, the last number says how many, and moving things does not change
// how many there are. Bear's forest bakery opens: the flour sack tips over the rolls (wiped off, counted: five); Bear
// spreads them - "more!"; counted again on an insert - still five. Owl's order note: four; the rolls delivered to Owl's
// tree past the orchard (a hungry bird fed on the way), one for each owlet, four coins counted out. At home the opening
// supper: plates on the table, the cups crowded - "not enough!"; counted, one cup on each plate, five hoots at the door,
// the supper seen. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// digit cards in a row: a paper card (the target) with the digit drawn on it
async function karty(c, liczby, { y = -2.0, xs = [-0.9, 0.9, 2.7] } = {}) {
  const out = [];
  for (const [i, n] of tasuj(liczby).entries()) {
    const k = await c.object("karta_cyfry", { obraz: "/game/assets/menu/karta.webp", x: xs[i], y, size: 1.5 });
    k.cyfra = await c.digit(n, { x: xs[i], y: y + 0.05, size: 0.95, duration: 0.2 });
    k.liczba = n; out.push(k);
  }
  return out;
}
// pack exactly `ile` things into the bag by dragging; one more jumps back
function spakuj(c, rzeczy, torba, ile, kto, zaDuzo, poDwoch = null) {
  const S = c.stage; let dane = 0;
  const [px, py] = [torba.mesh.position.x, torba.mesh.position.y];
  return new Promise((ok) => S.free({
    items: rzeczy.slice(), rozdaj: { wolni: () => (dane < ile ? [{ who: "torba" }] : []), pozycja: () => [px, py] },
    onDrop: async (h, p) => {
      if (Math.hypot(p.x - px, p.y - py) > 1.3) { await h.moveTo(h.home.x, h.home.y, 0.35); return; }
      if (dane >= ile) { c.sfx("wrong"); await h.moveTo(h.home.x, h.home.y, 0.35); await c.say(kto, zaDuzo); return; }
      dane++; if (dane === 2) poDwoch?.(); c.sfx("plop"); h.mesh.position.z = torba.mesh.position.z - 0.02; await h.moveTo(px - 0.3 + (dane % 3) * 0.3, py + 0.55, 0.25);
      await c.say(kto, `line.n${dane}`);
      if (dane === ile) { await c.wait(0.4); S.endSort(); ok(); }
    },
    onTap: () => {}, onPuppet: () => S.onPuppetTap?.(),
  }));
}
const naMiejsca = (c, poz) => { for (const [n, x] of Object.entries(poz)) c.stage.puppets[n].korzen.position.x = x; };
const DOM = { jez: -5.4, wiewiorka: -3.9, mis: 4.7 };
const TALERZE_X = [-3.0, -1.55, -0.1, 1.35, 2.8];                         // five places along the painted table, clear of Bear

export default {
  id: "counting_5",
  przejscia: true,
  nagrody: true,
  characters: { mis: { side: "right", x: 4.6 }, wiewiorka: { side: "left", x: -4.8 }, jez: { side: "left", x: -3.2 }, sowa: { side: "right", x: 2.7 } },
  backgrounds: { story: "piekarnia", practice: { kolor: "#fbeedd", motyw: "kola" }, apply: "dom" },
  stages: {
    story: [
      // A. the bakery: the flour sack tips over the first rolls - wiped off, counted: five; Bear spreads them - "more!";
      // counted again on an insert - still five, close or far
      async (c) => {
        await Promise.all(["wiewiorka", "jez"].map((n) => c.enter(n)));
        await c.enter("mis", "right");
        await c.ujecie("zblizenie", { na: "mis" });                          // his pride
        await c.say("mis", "line.a_piekarnia", { anim: "Radosc" });
        // the accident: the flour sack tips over
        await c.ujecie("sredni", { na: ["mis"] });
        const maka = c.say("mis", "line.a_maka", { anim: "Zgloszenie" });
        await c.wait(c.fast ? 0.1 : 1.6); c.sfx("whoosh");
        await maka;
        await c.emocja("mis", "pot", { anim: "Smutek" });
        await c.ujecie("ogolny");                                            // the floured counter comes up over the scene
        await c.say("wiewiorka", "line.a_pod_maka", { anim: "Zgloszenie" });
        const z = await c.zdrapka("maka_na_ladzie");
        await c.say("jez", "line.a_sa", { anim: "Podskok" });
        await c.say("wiewiorka", "line.a_ile");
        const lz = await c.count(z.cele, { who: "wiewiorka" });
        lz?.znaczki?.forEach((q) => q.remove());
        await z.remove();
        // the five rolls on the tray, then Bear spreads them along the counter
        await c.object("taca", { x: 0.6, y: 0.9, size: 5.2 });
        const b = [];
        for (let i = 0; i < 5; i++) b.push(await c.object("bulka", { x: -1.0 + i * 0.85, y: 1.1, size: 0.8 }));
        await c.ujecie("sredni", { na: ["wiewiorka", ...b] });               // what the count showed
        await c.say("wiewiorka", "line.a_piec", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["mis", ...b] });                     // he talks about the rolls
        await c.say("mis", "line.a_rozloze");
        await c.ujecie("ogolny");                                            // the rolls move across the scene
        await Promise.all(b.map((h, i) => h.moveTo(-1.5 + i * 1.1, -0.6 - (i % 2) * 0.7, 0.6)));
        await c.say("mis", "line.a_wiecej", { anim: "Podskok" });            // the naive claim, the spread rolls in view
        await c.ujecie("zblizenie", { na: "jez" });                          // Hedgehog doubts it
        await c.wonder("jez");
        // the method on a plain colour: the same five, spread out, counted again; then gathered close - still five
        await c.go({ kolor: "#fbeedd", motyw: "kola" }, { ciecie: true });
        await c.ujecie("ogolny");
        const r = [];
        for (let i = 0; i < 5; i++) r.push(await c.object("bulka", { x: -3.0 + i * 1.5, y: 1.4 - (i % 2) * 0.9, size: 1.3 }));
        await c.say("jez", "line.a_policz", { anim: "Zgloszenie" });
        const lr = await c.count(r, { who: "jez" });
        await c.ujecie("sredni", { na: ["jez", ...r] });                     // the spread rolls, still five
        await c.say("jez", "line.a_dalej_piec", { anim: "Zgloszenie" });
        lr?.znaczki?.forEach((q) => q.remove());
        await c.ujecie("ogolny");                                            // they glide back close together
        await Promise.all(r.map((h, i) => h.moveTo(-1.6 + i * 0.8, 1.0, 0.7)));
        await c.ujecie("zblizenie", { na: "mis" });                          // he gets it
        await c.emocja("mis", "zarowka", { anim: "Kiwanie" });
        await c.say("mis", "line.a_rozumiem");
        // back in the bakery: the first order under the door - Owl drew how many rolls she wants
        await c.go("piekarnia", { ciecie: true });
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // her surprise
        await c.emocja("wiewiorka", "wykrzyknik", { anim: "Podskok" });
        await c.say("wiewiorka", "line.a_karteczka");
        await c.ujecie("ogolny");                                            // the note flies up over the scene
        const note = await c.znalezisko("zamowienie_sowy", { skad: "wiewiorka" });
        await c.say("mis", "line.a_karteczka_ile");
        const ile = await c.count(note.cele, { who: "mis" });
        ile.znaczki.forEach((q) => q.remove?.());
        await note.remove();
        await c.ujecie("zblizenie", { na: "wiewiorka" });                    // her joy: the order is clear
        await c.say("wiewiorka", "line.a_karteczka_cztery", { anim: "Radosc" });
        // four rolls into the bag: the child drags, Bear counts; a fifth is not needed
        const torba = await c.object("torebka", { x: 1.6, y: -1.6, size: 1.8 });
        const p = []; for (let i = 0; i < 5; i++) p.push(await c.object("bulka", { x: -2.0 + i * 0.95, y: 1.4 - (i % 2) * 0.5, size: 0.8 }));
        await c.ujecie("sredni", { na: ["mis", torba, ...p] });             // the bag and every roll in the shot
        await c.say("mis", "line.a_spakuj", { anim: "Zgloszenie" });
        await spakuj(c, p, torba, 4, "mis", "line.a_za_duzo", () => c.ujecie("ogolny"));   // widens as the bag fills
        await c.say("wiewiorka", "line.a_zaniesiemy", { anim: "Machanie" });   // the wide shot: the packed bag, everyone ready to go
        c.clear();
      },
      // B. the orchard on the way: a hungry little bird fed (the breather)
      async (c) => {
        await c.go("sad", { enter: true });
        await Promise.all(["wiewiorka", "jez", "mis"].map((n) => c.enter(n, n === "mis" ? "right" : "left")));
        await c.play("jez", "Rozgladanie");
        await c.say("jez", "line.b_sad");                                    // the wide arrival
        await c.say("wiewiorka", "line.b_ptaszek_ziarno", { anim: "Zgloszenie" });
        await c.karmienie({ zwierze: "ptak", jedzenie: ["ziarno_ptaki", "ziarno_ptaki", "ziarno_ptaki"], fuj: ["szyszka"], kto: "wiewiorka", size: 1.6 });
        await c.ujecie("zblizenie", { na: "jez" });                          // his joy
        await c.say("jez", "line.b_najedzony", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.b_dalej", { anim: "Machanie" });
      },
      // C. Owl's tree (the story's own last place): one roll for each owlet, four coins counted out, the invitation
      async (c) => {
        await c.go("dziupla_sowy", { enter: true });
        await Promise.all([c.enter("wiewiorka"), c.enter("jez"), c.enter("mis", "right")]);
        await c.play("wiewiorka", "Rozgladanie");
        await c.say("wiewiorka", "line.c_dziupla", { anim: "Wskazanie" });   // the wide shot: the hollow in view
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.c_halo", { anim: "Machanie" });
        await c.ujecie("ogolny");                                            // Owl walks in
        await Promise.all([c.enter("sowa", "right"), c.walkTo("mis", 5.0)]);  // Bear steps aside for her
        await c.ujecie("dwuujecie", { na: ["sowa", "mis"] });
        await c.say("sowa", "line.c_sowa", { anim: "Radosc" });
        await c.ujecie("ogolny");                                            // the owlets come down, the rolls over the heads
        await c.say("sowa", "line.c_rozdaj", { anim: "Zgloszenie" });
        const sowiatka = [-2.15, -1.1, -0.05, 1.0].map((x) => ({ obraz: "sowiatko", x, y: -2.35, size: 1.0 }));
        const rz = await c.rozdaj({ komu: sowiatka, rzeczy: ["bulka", "bulka", "bulka", "bulka"], ile: 1, miski: null, rzeczySize: 0.9 });
        await c.ujecie("sredni", { na: ["sowa", ...rz.odbiorcy.map((o) => o.naczynie)] });
        await c.say("sowa", "line.c_po_jednej", { anim: "Radosc" });
        rz.remove();
        // Owl pays: one coin for each roll, the child counts them out
        await c.ujecie("ogolny");
        await c.say("sowa", "line.c_zaplace", { anim: "Zgloszenie" });
        const sk = await c.sklepik({ towar: "bulka", cena: 4, monet: 5, x: -0.4 });
        await c.ujecie("zblizenie", { na: "mis" });                          // his thank-you
        await c.say("mis", "line.c_dziekuje", { anim: "Radosc" });
        sk.remove();
        await c.ujecie("dwuujecie", { na: ["sowa", "mis"] });                // the invitation: the thread to home
        await c.say("mis", "line.c_zaproszenie", { anim: "Zgloszenie" });
        await c.say("sowa", "line.c_przyjdziemy", { anim: "Podskok" });
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("wiewiorka"); c.show("mis");
        S.puppets.wiewiorka.korzen.position.x = -5.2; S.puppets.mis.korzen.position.x = 5.0;
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("zblizenie", { na: "mis" });
        await c.say("mis", "line.p_start", { anim: "Radosc" });
        // 1. how many rolls? point to the digit
        {
          await c.ujecie("ogolny");                                          // the rolls and the cards come in
          const ile = 3 + Math.floor(Math.random() * 3);
          const b = []; for (let i = 0; i < ile; i++) b.push(await c.object("bulka", { x: -2.0 + i * 1.1, y: 1.4, size: 1.0 }));
          const k = await karty(c, [3, 4, 5]);
          await c.say("wiewiorka", "line.p_ile");
          const ok = k.find((q) => q.liczba === ile);
          dobre(ok); await c.task({ targets: k, correct: ok, wrong: "line.p_ile_nie" });
          await c.ujecie("sredni", { na: [...b, ok] });                      // the rolls and their digit
          await c.say("mis", `line.p_bulki${ile}`, { anim: "Brawo" }); gw.dodaj();
          c.clear();
        }
        // 2. which domino tile has five dots? (nothing past five)
        {
          await c.ujecie("ogolny");
          const d = []; for (const [i, [a, bb]] of tasuj([[2, 3], [1, 2], [3, 1]]).entries()) d.push(c.domino(a, bb, { x: -1.6 + i * 2.1, y: 0.6 }));
          await c.say("mis", "line.p_domino", { anim: "Zgloszenie" });
          const ok = d.find((h) => h.suma === 5);
          dobre(ok); await c.task({ targets: d, correct: ok, wrong: "line.p_domino_nie" });
          await c.ujecie("sredni", { na: ["wiewiorka", ok] });
          await c.say("wiewiorka", "line.p_domino_ok", { anim: "Brawo" }); gw.dodaj();
          c.clear();
        }
        // 3. which tray has five: spread or close? Only one has five
        {
          await c.ujecie("ogolny");
          const tr = [];
          for (const [i, [n, krok]] of tasuj([[5, 0.75], [4, 0.45]]).entries()) {
            const x0 = i ? 0.6 : -2.9;
            for (let k = 0; k < n; k++) await c.object("ciastko", { x: x0 + k * krok, y: 0.6 - (k % 2) * 0.3, size: 0.75 });
            const ram = await c.zone({ x: x0 + ((n - 1) * krok) / 2, y: 0.45, w: (n - 1) * krok + 1.3, h: 1.6, name: "taca" + i }); ram.ile = n; tr.push(ram);
          }
          await c.say("wiewiorka", "line.p_taca");
          const ok = tr.find((z) => z.ile === 5);
          dobre(ok); await c.task({ targets: tr, correct: ok, wrong: "line.p_taca_nie" });
          await c.ujecie("sredni", { na: ["mis", ok] });
          await c.say("mis", "line.p_taca_ok", { anim: "Brawo" }); gw.dodaj();
          c.clear();
        }
        // 4. memory: a number and as many dots
        {
          await c.ujecie("sredni", { na: ["mis"] });
          await c.say("mis", "line.p_memory");
          await c.ujecie("ogolny");                                          // the cards come in
          await c.memory([2, 3, 4, 5].map((n) => [{ cyfra: n }, { kropki: n }]), { szer: 1.4 });
          await c.ujecie("zblizenie", { na: "wiewiorka" });                  // her cheer
          await c.brawo("wiewiorka"); gw.dodaj();
          c.clear();
        }
        // 5. the fourth roll from the arrow
        {
          await c.ujecie("ogolny");
          const b = []; for (let i = 0; i < 5; i++) b.push(await c.object("bulka", { x: -2.4 + i * 1.2, y: 0.6, size: 1.0 }));
          const s = await c.object("strzalka", { x: -3.65, y: 0.6, size: 0.9 });
          await c.say("wiewiorka", "line.p_czwarta");
          dobre(b[3]); await c.task({ targets: b, correct: b[3], wrong: "line.p_czwarta_nie" });
          s.remove();
          await c.ujecie("sredni", { na: ["mis", b[3]] });
          await c.say("mis", "line.p_czwarta_ok", { anim: "Brawo" }); gw.dodaj();
          c.clear();
        }
        await c.ujecie("zblizenie", { na: "mis" });
        await c.praise("mis");
      },
    ],
    apply: [
      // home - the third act: the bakery's opening supper for Owl and her owlets. Plates on the painted table; Bear crowds
      // the cups - "not enough!"; both counted; one cup on each plate on an insert; five hoots at the door; the supper
      // seen; Bear counts the plates as the parents will
      async (c) => {
        const S = c.stage;
        for (const n of ["jez", "wiewiorka", "mis"]) c.show(n);
        naMiejsca(c, DOM);
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("zblizenie", { na: "mis" });                          // his joy: the thread from the story
        await c.say("mis", "line.h_w_domu", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["jez", "wiewiorka"] });
        await c.say("jez", "line.h_goscie", { anim: "Zgloszenie" });
        // 1. the plates onto the painted table, five places along it
        await c.ujecie("ogolny");
        const m = await c.miejsca(), st = m.stol, yS = st.y + 0.1;
        const t = [];
        for (let i = 0; i < 5; i++) t.push(await c.object("talerz", { x: -2.2 + i * 1.1, y: 2.5, size: 1.0 }));
        await c.say("jez", "line.h_talerze");
        const sl = await c.slots({ items: t, slots: TALERZE_X.map((x) => ({ x, y: yS, w: 1.3, h: 0.8, accept: () => true, rodzaj: "stoi" })), wrong: "line.h_talerze" });
        await sl.done(); sl.remove();
        // 2. the misconception: Bear crowds the cups together on the counter
        const bl = m.blat, kubki = [];
        await c.ujecie("sredni", { na: ["mis", ...t] });
        await c.say("mis", "line.h_kubki", { anim: "Zgloszenie" });
        for (let i = 0; i < 5; i++) kubki.push(await c.object("kubek", { x: -0.9 + i * 0.8, y: bl.y + 0.4, size: 0.8 }));
        await c.ujecie("zblizenie", { na: "mis" });                          // his worry
        await c.emocja("mis", "pot", { anim: "Smutek" });
        await c.say("mis", "line.h_za_malo");
        // 3. counted: the cups, then the plates
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.h_sprawdzmy");
        const lk = await c.count(kubki, { who: "wiewiorka" });
        await c.say("wiewiorka", "line.h_piec_kubkow");
        lk?.znaczki?.forEach((q) => q.remove());
        await c.say("jez", "line.h_teraz_talerze");
        const lt = await c.count(t, { who: "jez" });
        await c.ujecie("sredni", { na: ["jez", ...t] });
        await c.say("jez", "line.h_piec_talerzy", { anim: "Radosc" });
        lt?.znaczki?.forEach((q) => q.remove());
        // 4. the method on a plain colour: the plates in a long row, the cups crowded - one cup on each plate
        await c.go({ kolor: "#fdeed8", motyw: "kola" }, { ciecie: true });
        naMiejsca(c, DOM);
        await c.ujecie("ogolny");
        const PX = [-2.5, -1.25, 0, 1.25, 2.5], tw = [], kw = [];
        for (const x of PX) tw.push(await c.object("talerz", { x, y: -0.2, size: 1.1 }));
        for (let i = 0; i < 5; i++) kw.push(await c.object("kubek", { x: -1.6 + i * 0.8, y: 2.1, size: 0.8 }));
        await c.say("wiewiorka", "line.h_kubek_na_talerz", { anim: "Zgloszenie" });
        const sk = await c.slots({ items: kw, slots: PX.map((x) => ({ x, y: 0.05, w: 1.1, h: 0.9, accept: () => true, rodzaj: "stoi", niewidoczna: true })), wrong: "line.h_kubek_na_talerz" });
        await sk.done(); sk.remove();
        await c.ujecie("sredni", { na: ["jez", ...tw] });
        await c.say("jez", "line.h_po_jednym", { anim: "Brawo" });
        await c.ujecie("zblizenie", { na: "mis" });                          // relief
        await c.say("mis", "line.h_starczy", { anim: "Radosc" });
        // 5. back in the kitchen, the table set: hooting at the door - how many times?
        await c.go("dom", { ciecie: true });
        naMiejsca(c, DOM);
        const tal = [];
        for (const x of TALERZE_X) { tal.push(await c.object("talerz", { x, y: yS, size: 1.0, cicho: true })); await c.object("kubek", { x, y: yS + 0.35, size: 0.7, cicho: true }); }
        await c.ujecie("ogolny");
        await c.say("wiewiorka", "line.h_hu", { anim: "Zgloszenie" });
        const hu = () => c.dzwieki(5, { dzwiek: "hu_2", tempo: 0.75 });
        await hu();
        const k = await karty(c, [3, 4, 5], { xs: [-1.8, 0.0, 1.8] });
        await c.say("wiewiorka", "line.h_ile_hu");
        const ok = k.find((q) => q.liczba === 5);
        dobre(ok); await c.task({ targets: k, correct: ok, onWrong: async () => { await c.say("wiewiorka", "line.h_ile_hu_nie"); await hu(); } }); dobre(ok, false);
        await c.ujecie("zblizenie", { na: "jez" });                          // his joy: the guests are here
        await c.say("jez", "line.h_piec_gosci", { anim: "Podskok" });
        k.forEach((q) => { q.cyfra?.remove?.(); q.remove(); });
        // the payoff, seen: the supper
        const il = await c.ilustracja("kolacja_sowiatek", { ruch: "najazd" });
        await c.say("mis", "line.h_smacznego");
        await c.say("wiewiorka", "line.h_udane");
        await il.zsun();
        // the home task, played: Bear counts the plates on the table
        await c.ujecie("sredni", { na: ["mis"] });
        await c.say("mis", "line.h_pokaz", { anim: "Zgloszenie" });
        c.play("mis", "Wskazanie");
        for (const [i, h] of tal.entries()) {                                // the shot travels along the table with the count
          if (i === 0) await c.ujecie("sredni", { na: tal.slice(0, 3) });
          if (i === 3) await c.ujecie("sredni", { na: ["mis", ...tal.slice(3)] });
          S.bump(h, 0.3); await c.say("mis", `line.n${i + 1}`);
        }                                                                    // the task, said to the parents in the same shot
        await c.say("mis", "line.h_rodzice", { anim: "Machanie" });
      },
    ],
  },
};
