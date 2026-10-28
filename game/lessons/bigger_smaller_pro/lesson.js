// Lesson: bigger / smaller, the "pro" build (guidelines.md, "Atmosphere and editing"): one walk to the old oak
// for Owl's birthday on a wide panorama, three small adventures each needing size (wellingtons that fit, the big
// stones across the brook, a warm hat for Owl), comparing by overlapping, a game of rock-paper-scissors, a
// promise kept at home (a box of hats). Script in scenario.md.

const PANO = "droga_do_debu";
const BRZEG = -2.45;                     // the floor where stickers lie between the characters
const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const MIEJSCE = { lisek: 0, wiewiorka: 1, sowa: 2 };      // the biggest character first

// garment stickers of one kind at sizes (biggest first); h.ranga = 0 for the biggest
async function rzeczy(c, rzecz, rozmiary, { y = BRZEG, odstep = 2.0 } = {}) {
  const kolej = tasuj(rozmiary.map((_, i) => i)), out = [];
  for (const [k, i] of kolej.entries()) {
    const h = await c.ubranie(rzecz, { x: (k - (rozmiary.length - 1) / 2) * odstep, y, size: rozmiary[i] });
    h.ranga = i; out.push(h);
  }
  return out;
}
const pasujeRozmiar = (h, who) => (h.ranga === MIEJSCE[who] ? true : h.ranga < MIEJSCE[who] ? "za_duze" : "za_male");
const zleRozmiar = (o) => (o === "za_duze" ? "line.za_duze" : "line.za_male");

export default {
  id: "bigger_smaller_pro",
  przejscia: true,                       // every change of place is a transition
  nagrody: true,                         // confetti and a tick on every right pick
  characters: { lisek: { side: "left" }, wiewiorka: { side: "right", height: 3.0 }, sowa: { side: "left", x: 1.4, height: 2.5 } },
  backgrounds: { story: PANO, practice: { kolor: "#c7ecc0", motyw: "figury" }, apply: "dom" },
  stages: {
    story: [
      // A. at the gate: off to Owl's birthday, a surprise promised for later; the rain starts; Squirrel puts on
      // Fox's wellingtons - they fall off. How to tell whose are whose? Lay one on the other: the bigger sticks out.
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("wiewiorka")]);
        await c.say("lisek", "line.a_urodziny", { anim: "Radosc" });
        await c.say("wiewiorka", "line.a_hurra", { anim: "Podskok" });
        await c.say("lisek", "line.a_obietnica");
        c.czastki("deszcz");
        c.sfx("whoosh");
        await c.ujecie("zblizenie", { na: "wiewiorka" });
        await c.emocja("wiewiorka", "zimno", { anim: "Smutek" });
        await c.say("wiewiorka", "line.a_pada");
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });
        await c.say("lisek", "line.a_kalosze");
        // the naive try: the first pair at hand - Fox's - on Squirrel
        await c.say("wiewiorka", "line.a_biore", { anim: "Podskok" });
        await c.nieUbieraj("wiewiorka", "kalosze", { skala: 1.6 });
        await c.emocja("wiewiorka", "pot");
        await c.wonder("lisek");
        await c.say("lisek", "line.a_za_duze");
        await c.say("wiewiorka", "line.a_jak");
        await c.say("lisek", "line.a_porownaj", { anim: "Zgloszenie" });
        await c.say("wiewiorka", "line.a_co");
        await c.say("lisek", "line.a_pokaze");
        // the method on a plain colour: one laid on the other
        await c.go({ kolor: "#bfe3f5", motyw: "deszcz" }, { ciecie: true });
        await c.ujecie("ogolny");
        const duzy = await c.ubranie("kalosze", { x: -1.4, y: 0.9, size: 1.8 }), maly = await c.ubranie("kalosze", { x: 1.6, y: 0.9, size: 1.1 });
        await c.say("lisek", "line.a_kladziemy");
        const n = await c.nalozenie(maly, duzy);
        await c.say("lisek", "line.a_wystaje");
        await n.cofnij();
        await c.say("wiewiorka", "line.a_wskaz_maly");
        await c.task({ targets: [duzy, maly], correct: maly, wrong: "line.a_nie_ten" });
        duzy.remove(); maly.remove();
        // now dress them: the big pair to Fox, the small one to Squirrel
        const pary = await rzeczy(c, "kalosze", [1.7, 1.1], { y: BRZEG + 0.3, odstep: 2.6 });
        await c.say("lisek", "line.a_ubierz");
        await c.ubieranie({ rzeczy: pary, kto: ["lisek", "wiewiorka"], pasuje: pasujeRozmiar, wrong: zleRozmiar });
        await c.go(PANO, { ciecie: true });
        c.czastki("deszcz");
        await c.emocja("wiewiorka", "radosc", { anim: "Radosc" });
        await c.say("wiewiorka", "line.a_pasuja");
        await c.say("lisek", "line.a_idziemy");
        await c.pan(1.35, { idz: ["lisek", "wiewiorka"], d: 3.2 });
      },
      // B. the brook: who goes first? rock-paper-scissors (a breather); then a bridge of the big stones - a small
      // stone sinks under a foot
      async (c) => {
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });
        await c.say("wiewiorka", "line.b_strumyk", { anim: "Rozgladanie" });
        await c.say("lisek", "line.b_kamienie");
        await c.say("wiewiorka", "line.b_kto_pierwszy", { anim: "Podskok" });
        await c.ujecie("ogolny");
        // rock-paper-scissors: the child plays for Squirrel, Fox shows the gesture that loses
        const GESTY = [["✊", "✌"], ["✋", "✊"], ["✌", "✋"]];       // [gesture, the one it beats]
        const karty = [];
        for (const [i, [g]] of GESTY.entries()) karty.push(await c.sign(g, { x: -2.2 + i * 2.2, y: 1.0, size: 1.3 }));
        await c.say("lisek", "line.b_papier");
        const wybor = await c.task({ targets: karty, correct: karty, wrong: "line.b_papier" });
        const g = GESTY[karty.indexOf(wybor)];
        for (const k of karty) if (k !== wybor) k.remove();
        const lisa = await c.sign(g[1], { x: -3.0, y: 1.0, size: 1.3 });
        await wybor.moveTo(1.6, 1.0, 0.3);
        await c.say("lisek", "line.b_wygralas", { anim: "Brawo" });
        await c.emocja("wiewiorka", "radosc", { anim: "Podskok" });
        lisa.remove(); wybor.remove();
        // the bridge: three rounds of a big and a small stone
        await c.say("lisek", "line.b_most");
        await c.odliczanie({ styl: "kropki" });
        const w_wodzie = [[0.95, -2.75], [1.85, -2.3], [2.75, -1.85]];
        for (const [i, [wx, wy]] of w_wodzie.entries()) {
          const duzy = Math.random() < 0.5;
          const a = await c.object("kamyk", { x: duzy ? -1.6 : 0.2, y: BRZEG + 0.25, size: 1.25 }), b = await c.object("kamyk", { x: duzy ? 0.2 : -1.6, y: BRZEG + 0.25, size: 0.6 });
          await c.say("wiewiorka", i === 0 ? "line.b_wskaz_duzy" : "line.b_jeszcze");
          await c.task({ targets: [a, b], correct: a, onWrong: async (h) => {
            // the small stone, tried: into the water, and it sinks
            await h.moveTo(wx, wy, 0.4); c.sfx("plop");
            await c.emocja("wiewiorka", "strach", { na: 1.2 });
            await c.say("lisek", "line.b_utonal");
            h.mesh.position.set(h.home.x, h.home.y, h.mesh.position.z); c.stage.appear(h);
          } });
          b.remove();
          await a.moveTo(wx, wy, 0.5); c.sfx("plop");
        }
        await c.say("wiewiorka", "line.b_przechodzimy", { anim: "Radosc" });
        c.clear();
        await c.pan(2, { idz: ["lisek", "wiewiorka"], d: 3.2 });
      },
      // C. the oak: Owl is cold, her hat blew away - we help her: what will warm her? the hat that fits her
      // small head, a scarf. The rain stops; she is happy.
      async (c) => {
        c.show("sowa");
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.emocja("sowa", "zimno", { anim: "Smutek" });
        await c.say("sowa", "line.c_zimno");
        await c.ujecie("dwuujecie", { na: ["lisek", "wiewiorka"] });
        await c.say("wiewiorka", "line.c_pomozemy", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        // what is useful here: two right answers, two wrong
        const pomoc = [await c.ubranie("czapka_zimowa", { x: -2.4, y: 1.0, size: 1.1 }), await c.ubranie("szalik", { x: 2.4, y: 1.0, size: 1.1 })];
        const nie = [await c.object("pilka", { x: -0.8, y: 1.0, size: 1.0 }), await c.object("lyzka", { x: 0.8, y: 1.0, size: 1.0 })];
        await c.say("lisek", "line.c_co_ogrzeje");
        await c.task({ targets: [...pomoc, ...nie], correct: pomoc, wrong: "line.c_nie_ogrzeje" });
        c.clear();
        // the hat that fits: Owl's head is small
        await c.say("wiewiorka", "line.c_glowka");
        const czapki = await rzeczy(c, "czapka_zimowa", [1.6, 1.0], { odstep: 2.6 });
        for (const h of czapki) h.ranga = h.ranga === 0 ? 0 : 2;              // the big one is Fox's size, the small one Owl's
        await c.ubieranie({ rzeczy: czapki, kto: ["sowa"], pasuje: (h) => (h.ranga === 2 ? true : "za_duze"), wrong: zleRozmiar, zostaw: czapki.filter((h) => h.ranga === 0) });
        c.clear();
        const szal = [await c.ubranie("szalik", { x: 0, y: BRZEG + 0.2, size: 1.2 })];
        await c.say("lisek", "line.c_szalik");
        await c.ubieranie({ rzeczy: szal, kto: ["sowa"], pasuje: () => true });
        c.czastki("pylek");
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.emocja("sowa", "serce", { anim: "Radosc" });
        await c.say("sowa", "line.c_dziekuje");
        await c.ujecie("ogolny");
        await c.say("lisek", "line.c_slonce", { anim: "Rozgladanie" });
        await c.say("wiewiorka", "line.c_niespodzianka", { anim: "Podskok" });
      },
    ],
    practice: [
      // five rounds, a star each: compare by overlapping twice, catch the bigger one twice, dress for size once
      async (c) => {
        c.show("lisek"); c.show("wiewiorka");
        c.gwiazdki(5);
        await c.say("wiewiorka", "line.p_start");
        for (const rzecz of ["listek", "talerz"]) {
          const duzy = Math.random() < 0.5;
          const a = await c.object(rzecz, { x: duzy ? -1.8 : 1.8, y: 1.0, size: 1.6 }), b = await c.object(rzecz, { x: duzy ? 1.8 : -1.8, y: 1.0, size: 1.05 });
          await c.say("lisek", "line.p_wiekszy");
          await c.task({ targets: [a, b], correct: a, wrong: "line.p_poloz" });
          const n = await c.nalozenie(b, a); await c.say("wiewiorka", "line.p_wystaje"); await n.cofnij(0.3);
          c.clear();
        }
        // catch it: things pop up anywhere for a moment (a quick game), point to the bigger one
        await c.say("lisek", "line.p_lapanie");
        for (const rzecz of ["jablko", "pilka"]) {
          const miejsca = tasuj([[-2.8, 1.4], [0, 0.4], [2.8, 1.6], [-1.2, -1.2], [1.6, -0.9]]).slice(0, 2);
          const a = await c.object(rzecz, { x: miejsca[0][0], y: miejsca[0][1], size: 1.5 }), b = await c.object(rzecz, { x: miejsca[1][0], y: miejsca[1][1], size: 0.85 });
          await c.say("wiewiorka", "line.p_lap");
          await c.task({ targets: [a, b], correct: a, wrong: "line.p_wiekszy" });
          c.clear();
        }
        const czapki = await rzeczy(c, "czapka_z_daszkiem", [1.5, 1.0], { odstep: 2.6 });
        await c.say("lisek", "line.p_czapki");
        await c.ubieranie({ rzeczy: czapki, kto: ["lisek", "wiewiorka"], pasuje: pasujeRozmiar, wrong: zleRozmiar });
        await c.praise("wiewiorka");
      },
    ],
    apply: [
      // home: the promised surprise - three of the same hat at three sizes, the biggest for the biggest
      async (c) => {
        c.show("lisek"); c.show("wiewiorka"); c.show("sowa");
        for (const n of ["lisek", "wiewiorka", "sowa"]) c.zdejmij(n);
        await c.say("lisek", "line.d_pudelko", { anim: "Radosc" });
        const pud = await c.object("pudelko", { x: 0, y: 0.6, size: 1.8 });
        await c.task({ targets: [pud], correct: pud, wrong: "line.d_pudelko" });
        pud.remove();
        const kapelusze = await rzeczy(c, "kapelusz", [1.6, 1.25, 0.9], { y: 1.3, odstep: 2.4 });
        await c.say("wiewiorka", "line.d_trzy");
        await c.say("lisek", "line.d_zasada");
        await c.ubieranie({ rzeczy: kapelusze, kto: ["lisek", "wiewiorka", "sowa"], pasuje: pasujeRozmiar, wrong: zleRozmiar });
        await c.say("sowa", "line.d_pieknie", { anim: "Radosc" });
        await c.say("lisek", "line.d_rodzice");
        await c.say("wiewiorka", "line.d_pa");
        await Promise.all([c.play("lisek", "Machanie"), c.play("wiewiorka", "Machanie"), c.play("sowa", "Machanie")]);
      },
    ],
  },
};
