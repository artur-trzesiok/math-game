// Lesson: rhythm - the friends' band. A rhythm is something that repeats in order, again and again: heard (drum and
// bell), seen (a garland of flags), done with the body (a dance). The method, and the hint after a miss, is always the
// same: play the row from the start (ctx.rytm) and listen for what comes next. One thread: the parents come this
// afternoon and the friends play them a concert - the home stage is the concert, on a pot and a cup. Script in
// scenario.md.

const ROW_Y = 1.6, KROK = 1.25, X0 = -4.4;          // the row of what was played, over the heads, left to right
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wyrosnij = (c) => c.stage.tween(0.4, () => {});                  // let things popping in reach their size before a shot frames them
const INSTR = { beben: { dzwiek: "beben", size: 1.0 }, dzwonek: { dzwiek: "dzwonek", size: 1.0 }, maly: { obraz: "beben", dzwiek: "beben_maly", size: 0.62 },
  garnek: { dzwiek: "garnek", size: 1.0 }, kubek: { obraz: "kubek_lyzka", dzwiek: "kubek", size: 1.0 } };

// an instrument on the ground (it sounds when pointed at); `klucz` tells two drums of one picture apart
async function instrument(c, klucz, x, { y = -2.35, skala = 1.15 } = {}) {
  const d = INSTR[klucz], h = await c.object(d.obraz || klucz, { x, y, size: d.size * skala, dzwiek: d.dzwiek });
  h.klucz = klucz; return h;
}
// a note of the row: the instrument's picture joins the row as it is heard (no pop: the note is its own sound)
async function nuta(c, rzad, klucz) {
  const d = INSTR[klucz], h = await c.object(d.obraz || klucz, { x: X0 + rzad.length * KROK, y: ROW_Y, size: d.size * 0.95, dzwiek: d.dzwiek, cicho: true });
  h.klucz = klucz; rzad.push(h); return h;
}
// someone plays: each instrument bumps on the ground and sounds, and its note joins the row
async function graj(c, rzad, instr, klucze, { tempo = 0.62 } = {}) {
  for (const k of klucze) {
    const h = instr.find((i) => i.klucz === k);
    c.sfx(INSTR[k].dzwiek); c.stage.bump(h, 0.3, false);
    await nuta(c, rzad, k);
    await c.wait(tempo);
  }
}
// what comes next: the child points to an instrument; a miss plays the row from the start again
async function coDalej(c, rzad, instr, klucz, { kto, zle }) {
  const ok = instr.find((i) => i.klucz === klucz);
  dobre(instr, false); dobre(ok);
  await c.task({ targets: instr, correct: ok, onWrong: async () => { await c.say(kto, zle); await c.rytm(rzad); } });
  dobre(ok, false);
  await nuta(c, rzad, klucz);
}
// the row of moves of a dance: a card per move as it is danced
async function karta(c, rzad, ruch) {
  const h = await c.object(`ruch_${ruch}`, { x: X0 + rzad.length * KROK, y: ROW_Y, size: 0.95, cicho: true });
  h.ruch = ruch; rzad.push(h); return h;
}
async function tanczy(c, kto, rzad, ruchy, { tempo = 1.0 } = {}) {
  for (const r of ruchy) { c.ruch(kto, r, { tempo }); await karta(c, rzad, r); await c.wait(c.fast ? 0.25 : tempo); }
}
// which move next: move cards on the ground; the one who learns does the chosen move, a wrong one stumbles
async function jakiRuch(c, rzad, karty, ruch, { kto, uczen, zle, pokaz }) {
  const ok = karty.find((h) => h.ruch === ruch);
  dobre(karty, false); dobre(ok);
  await c.task({ targets: karty, correct: ok, onWrong: async (hit) => { c.ruch(uczen, hit.ruch); await c.potknij(uczen); await c.say(kto, zle); await pokaz(); } });
  dobre(ok, false);
  c.ruch(uczen, ruch); await karta(c, rzad, ruch); await c.wait(0.9);
}
async function kartyRuchow(c, ruchy, { y = -2.35, size = 1.05 } = {}) {
  const out = [], krok = 1.2, x0 = -((ruchy.length - 1) * krok) / 2;
  for (const [i, r] of ruchy.entries()) { const h = await c.object(`ruch_${r}`, { x: x0 + i * krok, y, size }); h.ruch = r; out.push(h); }
  return out;
}
const sprzatnij = (hs) => { for (const h of hs) h.remove(); hs.length = 0; };
// read a row aloud: each thing bumps as its name is said (the words' times are baked with the recording)
const SLOWA = {
  beben: { pl: ["bęben", "bum", "duży"], en: ["drum", "boom", "big"] }, maly: { pl: ["mały"], en: ["small"] },
  dzwonek: { pl: ["dzwonek", "dzyń"], en: ["bell", "ding"] },
  czerwona: { pl: ["czerwona"], en: ["red"] }, zolta: { pl: ["żółta"], en: ["yellow"] },
  listek: { pl: ["listek"], en: ["leaf"] }, zoledz: { pl: ["żołądź"], en: ["acorn"] },
  klask: { pl: ["klask"], en: ["clap"] }, skok: { pl: ["skok"], en: ["jump"] }, obrot: { pl: ["obrót"], en: ["spin"] },
};
const czytaj = (c, items, kto, linia, o = {}) => c.rytm(items, { linia, kto, slowo: (h) => SLOWA[h.klucz || h.ruch || h.tag || h.name]?.[c.lang], ...o });

// the garland: flags hanging under a sagging string between two trees; in the kitchen it hangs higher and smaller,
// above the row of the notes (at one height the pots ran into the flags)
const GIRLANDA = { ogrod: { gora: 2.75, zwis: 0.55, size: 0.95 }, kuchnia: { gora: 3.2, zwis: 0.35, size: 0.7 } };
const sznurek = (x, g = GIRLANDA.ogrod) => g.gora - g.zwis * (1 - (x / 5.6) ** 2);
async function girlanda(c, kolory, g = GIRLANDA.ogrod) {
  const sr = g.gora - g.zwis * 4 / 3;                      // the Bezier's control height for that sag in the middle
  await c.line({ bezier: [[-5.6, g.gora], [-2.2, sr], [2.2, sr], [5.6, g.gora]] }, { color: "#8a6a48", duration: 0.5, width: 0.05 });
  const flagi = [];
  for (const [i, k] of kolory.entries()) flagi.push(await flaga(c, i, k, g));
  return flagi;
}
const flagaX = (i) => -4.4 + i * 1.1;
async function flaga(c, i, kolor, g = GIRLANDA.ogrod) {
  const x = flagaX(i), h = await c.object(`choragiewka_${kolor}`, { x, y: sznurek(x, g) - g.size * 0.44, size: g.size });
  h.tag = kolor; return h;
}

export default {
  id: "rhythm",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -5.0 }, wiewiorka: { side: "left", x: -2.9 }, sowa: { side: "right", x: 3.1 }, sarenka: { side: "right", x: 5.3 } },
  backgrounds: { story: "ogrod", practice: { kolor: "#ffe7c4", motyw: "figury" }, apply: "dom" },
  stages: {
    story: [
      // A. Fox's garden: noise is not music. Squirrel bangs at random; Owl: music has a rhythm - something repeats in
      // order; she plays one, the notes join a row as they are heard, the child continues it (AB, then Squirrel's AAB)
      async (c) => {
        c.show("wiewiorka"); c.show("sowa");
        await c.enter("lisek");
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.a_koncert", { anim: "Podskok" });
        await c.ujecie("ogolny");
        const instr = [await instrument(c, "beben", -1.0), await instrument(c, "dzwonek", 1.0)];
        await wyrosnij(c);
        await c.ujecie("sredni", { na: [...instr, "sowa"] });                // the drum and the bell in the grass
        await c.say("sowa", "line.a_mamy", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["wiewiorka", ...instr] });
        await c.say("wiewiorka", "line.a_ja", { anim: "Podskok" });
        // the naive try: loud and a lot - at random, faster and faster
        await c.ujecie("ogolny");
        await c.play("wiewiorka", "Radosc", { loop: true });
        for (let i = 0; i < 14; i++) {
          const h = instr[Math.random() < 0.5 ? 0 : 1];
          c.sfx(h.dzwiek); c.stage.bump(h, 0.35, false);
          await c.wait(Math.max(0.12, 0.42 - i * 0.025));
        }
        c.play("wiewiorka", "Spoczynek", { loop: true });
        await Promise.all([c.emocja("sowa", "wykrzyknik", { anim: "Smutek" }), c.emocja("lisek", "pot")]);
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.a_halas");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_jak");
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.a_rytm", { anim: "Zgloszenie" });
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_co_to");
        await c.ujecie("sredni", { na: ["sowa", ...instr] });
        await c.say("sowa", "line.a_rytm_to");
        // Owl plays: bum, dzyń, bum, dzyń - every sound puts its picture into the row
        await c.ujecie("ogolny");
        const rzad = [];
        await graj(c, rzad, instr, ["beben", "dzwonek", "beben", "dzwonek"]);
        await czytaj(c, rzad, "sowa", "line.a_co_dalej");
        await c.rytm(rzad);
        await coDalej(c, rzad, instr, "beben", { kto: "sowa", zle: "line.a_od_poczatku" });
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.a_dobrze", { anim: "Brawo" });
        // Squirrel's own: bum, bum, dzyń
        sprzatnij(rzad);
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.say("wiewiorka", "line.a_moj", { anim: "Radosc" });
        await c.ujecie("ogolny");
        await graj(c, rzad, instr, ["beben", "beben", "dzwonek", "beben", "beben", "dzwonek", "beben", "beben"]);
        await czytaj(c, rzad, "wiewiorka", "line.a_moj_co");
        await coDalej(c, rzad, instr, "dzwonek", { kto: "wiewiorka", zle: "line.a_od_poczatku" });
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.a_moj_dobrze", { anim: "Podskok" });
        // the band plays it together, everyone nodding to the beat: it sounds like music
        await c.ujecie("ogolny");
        await c.say("lisek", "line.a_razem");
        await c.rytm(rzad, { kiwaja: ["lisek", "wiewiorka", "sowa"] });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.a_muzyka", { anim: "Radosc" });
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.a_ozdoby");
        c.clear();
        await c.ujecie("ogolny");
      },
      // B. the garland: a rhythm you can see. Squirrel hangs flags with one mistake; read from the start, the child
      // finds it; then three empty places, the child drags the flags on
      async (c) => {
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.b_wieszam", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const flagi = await girlanda(c, ["czerwona", "zolta", "czerwona", "zolta", "czerwona", "czerwona"]);
        await c.say("sowa", "line.b_widac");
        await czytaj(c, flagi, "sowa", "line.b_cos_nie");
        await c.wonder("sowa");
        const zla = flagi[5];
        dobre(zla);
        await c.task({ targets: flagi, correct: zla, wrong: "line.b_ta_pasuje" });
        await c.ujecie("sredni", { na: ["wiewiorka", flagi[4], zla] });     // the two reds side by side
        await c.say("wiewiorka", "line.b_ojej");
        await c.ujecie("ogolny");
        await zla.moveTo(zla.mesh.position.x, -4.0, 0.5); zla.remove();
        flagi[5] = await flaga(c, 5, "zolta");
        await czytaj(c, flagi, "wiewiorka", "line.b_teraz", { anim: "Radosc" });
        // three places left; the flags lie on the grass (and one blue that does not belong)
        const sloty = [6, 7, 8].map((i) => ({ x: flagaX(i), y: sznurek(flagaX(i)) - 0.42, w: 1.0, h: 1.0, accept: (it) => it.tag === (i % 2 ? "zolta" : "czerwona") }));
        const items = [];
        for (const [i, k] of tasuj(["czerwona", "zolta", "czerwona", "niebieska"]).entries()) {
          const h = await c.object(`choragiewka_${k}`, { x: -1.4 + i * 0.85, y: -2.35, size: 0.85 }); h.tag = k; items.push(h);
        }
        await c.say("sowa", "line.b_dokoncz");
        const t = await c.slots({ items, slots: sloty, wrong: "line.b_slot_nie" });
        await t.done();
        const cala = c.stage.objects.filter((h) => h.name?.startsWith("choragiewka_") && h.mesh.position.y > 0).sort((a, b) => a.mesh.position.x - b.mesh.position.x);
        await czytaj(c, cala, "lisek", "line.b_cala");
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });
        await c.say("lisek", "line.b_gotowe", { anim: "Brawo" });
        c.clear();
        await c.ujecie("ogolny");
      },
      // C. a breather, no maths: statues. While the music plays they dance; it stops, everyone freezes - but one
      // still wiggles; the child points to who moved
      async (c) => {
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.c_posagi", { anim: "Podskok" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.c_pilnuj");
        await c.ujecie("ogolny");
        const tancerze = ["lisek", "wiewiorka", "sowa"], RUCHY = ["klask", "skok", "obrot"];
        const ruchliwi = tasuj(tancerze).slice(0, 2);
        for (const [runda, kto] of ruchliwi.entries()) {
          if (runda > 0) await c.say("lisek", "line.c_jeszcze", { anim: "Podskok" });
          const muzyka = c.muzyka("melodyjka");
          let tanczy = true;
          const petla = async (n, wiecej = () => tanczy) => { while (wiecej()) { c.ruch(n, RUCHY[Math.floor(Math.random() * 3)], { tempo: 0.9 }); await c.wait(c.fast ? 0.2 : 0.9); } };
          const petle = tancerze.map((n) => petla(n));
          await c.wait(c.fast ? 0.6 : 3.2 + Math.random() * 1.5);
          muzyka.stop(120); tanczy = false;
          await Promise.all(petle);
          for (const n of tancerze) if (n !== kto) c.zamroz(n);
          // the one who moves keeps wiggling until pointed at
          let wierci = true; const wiercenie = (async () => { while (wierci) { c.play(kto, "Kiwanie"); await c.wait(0.5); } })().catch(() => {});   // a retired scene throws "abort"
          if (runda === 0) await c.say("sowa", "line.c_kto");
          const cele = tancerze.map((n) => c.stage.puppets[n]);
          dobre(cele, false); dobre(c.stage.puppets[kto]);
          await c.task({ targets: cele, correct: c.stage.puppets[kto], onWrong: async (hit) => { await c.say(hit.name, "line.c_nie_ja"); } });   // a statue speaks in its pose (frozen time, the mouth still follows the voice)
          wierci = false; await wiercenie;
          for (const n of tancerze) c.zamroz(n, false);
          await c.ujecie("zblizenie", { na: kto });                          // caught: the culprit's face
          await c.say(kto, `line.c_mam_${kto}`, { anim: "Radosc" });
          await c.ujecie("ogolny");
        }
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.c_koniec");
        await c.ujecie("ogolny");
      },
      // D. the lake meadow: helping Deer. She is sad - she can't dance; a dance has a rhythm too: Fox dances,
      // the cards of the moves join a row, the child points to the next move, Deer does it
      async (c) => {
        await c.go("laka", { enter: true });
        c.show("sarenka");
        await Promise.all(["lisek", "wiewiorka", "sowa"].map((n) => c.enter(n)));
        await c.ujecie("zblizenie", { na: "lisek" });                        // shot and reverse shot: the invitation, then Deer's answer
        await c.say("lisek", "line.d_zaproszenie", { anim: "Machanie" });
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.emocja("sarenka", "smutek", { anim: "Smutek" });
        await c.say("sarenka", "line.d_smutna");
        await c.ujecie("ogolny");
        await c.say("lisek", "line.d_nauczymy", { anim: "Zgloszenie" });
        const karty = await kartyRuchow(c, ["klask", "skok", "obrot"]);
        const rzad = [];
        const pierwszy = ["klask", "klask", "skok", "klask", "klask", "skok", "klask", "klask"];
        await tanczy(c, "lisek", rzad, pierwszy);
        await czytaj(c, rzad, "lisek", "line.d_co_teraz");
        await jakiRuch(c, rzad, karty, "skok", { kto: "lisek", uczen: "sarenka", zle: "line.d_od_poczatku", pokaz: () => c.rytm(rzad) });
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.say("sarenka", "line.d_udalo", { anim: "Radosc" });
        // a second dance, Squirrel's
        sprzatnij(rzad);
        await c.ujecie("sredni", { na: ["wiewiorka"] });
        await c.say("wiewiorka", "line.d_drugi", { anim: "Podskok" });
        await c.ujecie("ogolny");
        await tanczy(c, "wiewiorka", rzad, ["klask", "obrot", "klask", "obrot", "klask"]);
        await czytaj(c, rzad, "wiewiorka", "line.d_drugi_co");
        await jakiRuch(c, rzad, karty, "obrot", { kto: "wiewiorka", uczen: "sarenka", zle: "line.d_od_poczatku", pokaz: () => c.rytm(rzad) });
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.d_sama");
        await c.ujecie("ogolny");
        await c.taniec("sarenka", ["klask", "obrot", "klask", "obrot"]);
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.emocja("sarenka", "serce", { anim: "Radosc" });
        await c.say("sarenka", "line.d_umiem");
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.d_do_domu");
        c.clear();
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      // the rehearsal: five games, a star each
      async (c) => {
        const S = c.stage;
        c.show("wiewiorka"); c.show("sowa");
        S.puppets.wiewiorka.korzen.position.x = -5.3; S.puppets.sowa.korzen.position.x = 5.3;   // at the edges: the games fill the middle
        const gw = c.gwiazdki(5, { auto: false });
        await wyrosnij(c);
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        // 1. echo: bum, dzyń, dzyń (ABB)
        {
          const instr = [await instrument(c, "beben", -1.0), await instrument(c, "dzwonek", 1.0)], rzad = [];
          await c.say("sowa", "line.p_echo");
          await graj(c, rzad, instr, ["beben", "dzwonek", "dzwonek", "beben", "dzwonek", "dzwonek", "beben"]);
          await czytaj(c, rzad, "sowa", "line.p_echo_co");
          await coDalej(c, rzad, instr, "dzwonek", { kto: "sowa", zle: "line.p_od_poczatku" });
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_echo_ok");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 2. beads on a string: red, yellow, blue (ABC), three places
        {
          await c.line([[-5.0, 1.3], [5.0, 1.3]], { color: "#8a6a48", duration: 0.4, width: 0.05 });
          const kol = ["czerwony", "zolty", "niebieski"], x = (i) => -4.4 + i * 1.1;
          for (let i = 0; i < 6; i++) await c.object(`koralik_${kol[i % 3]}`, { x: x(i), y: 1.3, size: 0.85 });
          const sloty = [6, 7, 8].map((i) => ({ x: x(i), y: 1.3, w: 0.95, h: 0.95, accept: (it) => it.tag === kol[i % 3] }));
          const items = [];
          for (const [i, k] of tasuj([...kol, "czerwony"]).entries()) { const h = await c.object(`koralik_${k}`, { x: -1.65 + i * 1.1, y: -2.35, size: 0.85 }); h.tag = k; items.push(h); }
          await c.say("wiewiorka", "line.p_koraliki");
          const t = await c.slots({ items, slots: sloty, wrong: "line.p_koraliki_nie" });
          await t.done();
          await c.ujecie("zblizenie", { na: "wiewiorka" });
          await c.say("wiewiorka", "line.p_koraliki_ok", { anim: "Radosc" });
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 3. the broken row: leaf, leaf, acorn ... one acorn in a leaf's place
        {
          const wzor = ["listek", "listek", "zoledz", "listek", "zoledz", "zoledz", "listek", "listek", "zoledz"], rzad = [];
          for (const [i, n] of wzor.entries()) rzad.push(await c.object(n, { x: -4.4 + i * 1.1, y: ROW_Y, size: 0.95 }));
          await c.say("sowa", "line.p_blad");
          await czytaj(c, rzad, "sowa", "line.p_blad_czytaj");
          await c.say("sowa", "line.p_blad_wskaz");
          dobre(rzad[4]);
          await c.task({ targets: rzad, correct: rzad[4], wrong: "line.p_blad_nie" });
          await c.ujecie("sredni", { na: rzad.slice(3, 6) });               // the acorn in a leaf's place, with its neighbours
          await c.say("sowa", "line.p_blad_ok");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 4. big drum, small drum: the size is heard as well as seen
        {
          const instr = [await instrument(c, "beben", -1.1), await instrument(c, "maly", 1.1)], rzad = [];
          await c.say("wiewiorka", "line.p_bebny");
          await graj(c, rzad, instr, ["beben", "maly", "beben", "maly", "beben", "maly", "beben"]);
          await czytaj(c, rzad, "wiewiorka", "line.p_bebny_co");
          await coDalej(c, rzad, instr, "maly", { kto: "wiewiorka", zle: "line.p_od_poczatku" });
          await c.ujecie("sredni", { na: instr });                          // the big and the small drum
          await c.say("wiewiorka", "line.p_bebny_ok");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        // 5. Squirrel's dance: jump, spin, spin (ABB)
        {
          const karty = await kartyRuchow(c, ["klask", "skok", "obrot"]), rzad = [];
          await c.say("wiewiorka", "line.p_taniec");
          await tanczy(c, "wiewiorka", rzad, ["skok", "obrot", "obrot", "skok", "obrot", "obrot", "skok"]);
          await czytaj(c, rzad, "wiewiorka", "line.p_taniec_co");
          await jakiRuch(c, rzad, karty, "obrot", { kto: "wiewiorka", uczen: "wiewiorka", zle: "line.p_od_poczatku", pokaz: () => c.rytm(rzad) });
          await c.ujecie("zblizenie", { na: "sowa" });
          await c.say("sowa", "line.p_taniec_ok");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // the concert in Fox's kitchen: the garland hangs; no drum at home - a pot is the drum, a spoon on a cup the
      // bell; Fox starts and the child plays on; then Owl's song; Deer dances to it; applause from the parents
      async (c) => {
        for (const n of ["lisek", "wiewiorka", "sowa", "sarenka"]) c.show(n);
        const girl = await girlanda(c, ["czerwona", "zolta", "czerwona", "zolta", "czerwona", "zolta", "czerwona", "zolta", "czerwona"], GIRLANDA.kuchnia);
        await czytaj(c, girl, "wiewiorka", "line.e_girlanda", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.e_bez_bebna");
        await c.wonder("sowa");
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.e_kuchnia", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const instr = [await instrument(c, "garnek", -1.0), await instrument(c, "kubek", 1.0)];
        await wyrosnij(c);
        await c.ujecie("sredni", { na: instr });                            // the kitchen band: a pot and a cup
        for (const h of instr) { c.sfx(h.dzwiek); await c.stage.bump(h, 0.3, false); await c.wait(0.5); }
        c.sfx("clap", { glosnosc: 0.6 });                                   // the parents sit down (heard, not seen)
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.e_zaczynam");
        await c.ujecie("ogolny");
        // the first song: bum, dzyń ... Fox plays four, the child plays on four times
        const rzad = [];
        await graj(c, rzad, instr, ["garnek", "kubek", "garnek", "kubek"]);
        await c.say("lisek", "line.e_graj");
        for (const k of ["garnek", "kubek", "garnek", "kubek"]) await coDalej(c, rzad, instr, k, { kto: "lisek", zle: "line.e_od_poczatku" });
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.e_brawo", { anim: "Brawo" });
        await c.ujecie("ogolny");
        // the second song: bum, bum, dzyń - Owl plays one round, the child the next
        sprzatnij(rzad);
        await c.say("sowa", "line.e_druga");
        await graj(c, rzad, instr, ["garnek", "garnek", "kubek"]);
        await c.say("sowa", "line.e_graj_dalej");
        for (const k of ["garnek", "garnek", "kubek"]) await coDalej(c, rzad, instr, k, { kto: "sowa", zle: "line.e_od_poczatku" });
        // Deer dances her dance while the band plays the song
        await c.ujecie("sredni", { na: ["sarenka"] });
        await c.say("sarenka", "line.e_tancze", { anim: "Podskok" });
        await c.ujecie("ogolny");
        await Promise.all([c.taniec("sarenka", ["klask", "klask", "skok", "klask", "klask", "skok"], { tempo: 0.9 }), (async () => { for (let i = 0; i < 2; i++) await c.rytm(rzad, { tempo: 0.9, kiwaja: ["lisek", "wiewiorka", "sowa"] }); })()]);
        c.sfx("clap");
        await c.ujecie("sredni", { na: ["sarenka"] });                       // Deer in her glory, Fox telling it
        c.rozblysk("sarenka");
        await c.say("lisek", "line.e_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
