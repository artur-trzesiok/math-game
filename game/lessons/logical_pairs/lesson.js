// Lesson: what goes with what - logical pairs: things that belong together because we use them together (a spoon and a
// bowl, a toothbrush and toothpaste, a hammer and a nail, a key and its door) - not because they look alike. The night's
// storm (seen) scattered everybody's things; Mole pairs a red cup with a red apple; the method on an insert; the child
// finds the toothpaste for the toothbrush; in Beaver's workshop the mud is wiped off (the breather), the pairs joined with
// a finger, Mole's torn photo put together shows whose the hammer (and so the nail) is; Deer's star key - she invites
// everyone to tea. At home (Deer's hallway): Mole's red hat with the red shoe again, the pairs joined, things put on
// their painted places, the cup for the teapot, the tea seen, the "what goes with what" game played. Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests

// two columns of things, the right one shuffled; the child joins each pair with a line
async function laczPary(c, pary, { xL = -1.0, xP = 2.0, y0 = 2.1, krok = 1.25, size = 1.15, wrong = "line.nie_para" } = {}) {
  const L = [], P = [], para = new Map();
  for (const [i, [a]] of pary.entries()) { const h = await c.object(a, { x: xL, y: y0 - i * krok, size }); L.push(h); }
  let m = tasuj(pary.map((_, i) => i)); while (m.every((v, i) => v === i)) m = tasuj(m);   // never already side by side
  for (const [i, k] of m.entries()) { const h = await c.object(pary[k][1], { x: xP, y: y0 - i * krok, size }); P.push(h); para.set(h, L[k]); }
  for (const h of L) para.set(h, P.find((q) => para.get(q) === h));
  const w = await c.polacz({ lewe: L, prawe: P, para: (a, b) => para.get(a) === b, wrong });
  return { L, P, w };
}
// things lying about after the storm: turned, scattered
async function rozrzuc(c, rzeczy) {
  const hs = [];
  for (const [n, x, y, size, rot] of rzeczy) { const h = await c.object(n, { x, y, size }); h.mesh.rotation.z = rot; hs.push(h); }
  return hs;
}

export default {
  id: "logical_pairs",
  przejscia: true,
  nagrody: true,
  characters: { bobr: { side: "left", x: -4.8 }, kret: { side: "left", x: -2.9 }, sarenka: { side: "right", x: 4.8 } },
  backgrounds: { story: "strumyk", practice: { kolor: "#e9f2e1", motyw: "figury" }, apply: "przedpokoj" },
  stages: {
    story: [
      // A. the brook the morning after the storm (seen); Mole's pair by colour; the method; the toothbrush's pair
      async (c) => {
        await Promise.all(["bobr", "kret", "sarenka"].map((n) => c.enter(n)));
        const il = await c.ilustracja("burza_noc", { ruch: "w_prawo" });       // the night, seen
        await c.say("bobr", "line.a_burza", { anim: "Smutek" });
        await c.say("kret", "line.a_burza_kret");
        await il.zsun();
        c.czastki("liscie", { wiatr: 0.5 });
        const [kubek, jablko, szczot, pasta, kwiat] = await rozrzuc(c, [
          ["kubek_czerwony", -1.4, -2.5, 1.1, 0.5], ["jablko", 2.6, -1.4, 1.0, -0.3], ["szczoteczka", 0.4, -2.7, 1.2, 1.2],
          ["pasta", -0.6, -1.3, 1.1, -0.6], ["kwiatek", 1.6, -2.6, 1.0, 0.4]]);
        await c.say("sarenka", "line.a_rano", { anim: "Rozgladanie" });          // the mess, wide
        await c.ujecie("dwuujecie", { na: ["bobr", "kret"] });
        await c.say("kret", "line.a_pomoge", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");                                                // Mole carries the red cup to the red apple, talking
        const mowa = c.say("kret", "line.a_kolor", { anim: "Radosc" });
        kubek.mesh.rotation.z = 0; await kubek.moveTo(1.6, -1.4, 0.6); c.sfx("plop");
        await mowa;
        await c.ujecie("zblizenie", { na: "sarenka" });                          // she objects
        await c.say("sarenka", "line.a_nie", { anim: "Kiwanie" });
        await c.ujecie("zblizenie", { na: "kret" });
        await c.wonder("kret");
        await c.say("kret", "line.a_jak");
        // the method on a plain colour: a spoon and a bowl, used together
        await c.go({ kolor: "#e6f0f7", motyw: "kola" }, { ciecie: true });
        const miska = await c.object("miska", { x: 0.9, y: 0.9, size: 1.8 }), lyzka = await c.object("lyzka", { x: -1.6, y: 1.3, size: 1.6 });
        await c.ujecie("sredni", { na: ["sarenka", lyzka, miska] });
        await c.say("sarenka", "line.a_razem", { anim: "Wskazanie" });
        c.sfx("whoosh"); await Promise.all([lyzka.moveTo(1.3, 1.4, 0.6), c.stage.tween(0.6, (s) => { lyzka.mesh.rotation.z = -0.6 * s; })]); c.sfx("plop");
        await c.say("sarenka", "line.a_filizanka");
        // back at the brook: the child finds the toothbrush's pair
        await c.go("strumyk", { ciecie: true });
        c.czastki("liscie", { wiatr: 0.4 });
        await c.ujecie("ogolny");
        const sz = await c.object("szczoteczka", { x: 0.4, y: 1.6, size: 1.6 });
        const op = [];
        for (const [i, n] of tasuj(["pasta", "jablko", "kwiatek"]).entries()) op.push(await c.object(n, { x: -1.5 + i * 2.0, y: -1.6, size: 1.3 }));
        await c.say("sarenka", "line.a_szczoteczka");
        const ok = op.find((h) => h.name === "pasta");
        dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.a_szczoteczka_nie" }); dobre(ok, false);
        await ok.moveTo(1.9, 1.6, 0.45); c.sfx("plop");
        await c.ujecie("sredni", { na: ["kret", sz, ok] });                       // the pair, named
        await c.say("kret", "line.a_pasta", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "kret" });                             // he gets it
        await c.emocja("kret", "zarowka", { anim: "Radosc" });
        await c.say("kret", "line.a_rozumiem");
        await c.ujecie("dwuujecie", { na: ["bobr", "kret"] });
        await c.say("bobr", "line.a_do_warsztatu", { anim: "Wskazanie" });
        c.clear();
      },
      // B. the workshop: the mud wiped off (the breather), the pairs joined, Mole's torn photo, Deer's key
      async (c) => {
        await c.go("warsztat", { enter: true });
        await Promise.all(["bobr", "kret", "sarenka"].map((n) => c.enter(n)));
        c.play("bobr", "Rozgladanie");                                           // the arrival, wide: the workbench in the shot
        await c.say("bobr", "line.b_rzeczy");
        await c.ujecie("dwuujecie", { na: ["bobr", "kret"] });
        await c.say("kret", "line.b_wytrzyj", { anim: "Podskok" });
        await c.ujecie("ogolny");                                                // the muddy bench flies up over the wide scene
        const z = await c.zdrapka("bloto_warsztat");
        await c.say("sarenka", "line.b_czyste", { anim: "Radosc" });
        await z.remove();
        await c.say("bobr", "line.b_polacz");
        const { L, P, w } = await laczPary(c, [["pedzel", "farby"], ["mlotek", "gwozdz"], ["filizanka", "spodek"]]);
        await c.ujecie("sredni", { na: [...L, ...P] });                          // the joined pairs while Mole names them
        await c.say("kret", "line.b_pasuja", { anim: "Radosc" });
        w.remove(); c.clear();
        // whose? Mole cannot tell; his torn photo shows him holding the hammer - and the nail goes with the hammer
        await c.ujecie("dwuujecie", { na: ["bobr", "kret"] });
        await c.say("bobr", "line.b_czyje", { anim: "Zgloszenie" });
        c.play("kret", "Rozgladanie"); await c.wonder("kret");
        await c.say("kret", "line.b_nie_widze");
        await c.ujecie("dwuujecie", { na: ["bobr", "sarenka"] });                // the find, and what to do with it
        await c.emocja("bobr", "wykrzyknik");
        await c.say("bobr", "line.b_zdjecie");
        await c.ujecie("ogolny");                                                // the pieces on the floor first
        await c.say("sarenka", "line.b_szukaj_zdjecia");
        const wz = await c.szukaj("kawalki_zdjecia", { y: 0.3, size: 6.0, luneta: false });
        await c.say("kret", "line.b_mamy_zdjecie", { anim: "Radosc" });
        wz.remove();
        await c.say("sarenka", "line.b_posklejaj");
        await c.ujecie("ogolny");                                                // a found picture flies with the camera: wide first
        const foto = await c.podarty("zdjecie_kreta", { kawalki: 4 });
        await c.say("kret", "line.b_to_ja", { anim: "Radosc" });
        await c.say("sarenka", "line.b_zdjecie_co");
        dobre(foto.cele); await c.task({ targets: [...foto.cele, foto.tlo], correct: foto.cele[0], wrong: "line.b_zdjecie_nie" }); dobre(foto.cele, false);
        await foto.zaznacz();
        await c.say("bobr", "line.b_zdjecie_mlotek", { anim: "Radosc" });
        await foto.remove();
        const mlotek = await c.object("mlotek", { x: 1.2, y: 1.0, size: 1.2 }), gwozdz = await c.object("gwozdz", { x: 2.6, y: 1.0, size: 1.1 });
        await c.ujecie("ogolny");                                                // the pair flies to Mole's feet while Deer says why
        const para = c.say("sarenka", "line.b_zdjecie_para", { anim: "Kiwanie" });
        await c.wait(c.fast ? 0.1 : 2.0);
        c.sfx("whoosh"); await Promise.all([mlotek.moveTo(-1.5, -2.6, 0.5), gwozdz.moveTo(-0.6, -2.65, 0.5)]);
        await para;
        await c.ujecie("zblizenie", { na: "kret" });
        await c.emocja("kret", "radosc", { anim: "Radosc" });
        await c.say("kret", "line.b_moje");
        c.clear();
        // helping: Deer's door has a star keyhole - which key opens it? (the door and the keys alone, on an insert)
        await c.ujecie("zblizenie", { na: "sarenka" });
        await c.emocja("sarenka", "smutek", { anim: "Smutek" });
        await c.say("sarenka", "line.b_drzwi");
        await c.go({ kolor: "#f6ecd9", motyw: "gwiazdki" }, { ciecie: true });
        await c.ujecie("ogolny");
        const drzwi = await c.object("drzwi_gwiazda", { x: 2.2, y: 0.6, size: 2.4 });
        const klucze = [];
        for (const [i, n] of tasuj(["klucz_gwiazda", "klucz_kolo", "klucz_kwadrat"]).entries()) klucze.push(await c.object(n, { x: -2.4 + i * 1.3, y: 0.9, size: 1.5 }));
        await c.say("bobr", "line.b_klucz");
        const klucz = klucze.find((k) => k.name === "klucz_gwiazda");
        dobre(klucz); await c.task({ targets: klucze, correct: klucz, wrong: "line.b_klucz_nie" }); dobre(klucz, false);
        await klucz.moveTo(2.2, 0.6, 0.5); c.sfx("tap");
        await c.rozblysk(drzwi);
        await c.ujecie("zblizenie", { na: "sarenka" });                          // her thanks
        await c.emocja("sarenka", "serce", { anim: "Radosc" });
        await c.say("sarenka", "line.b_otwarte");
        // back in the workshop: the invitation - the thread into the home stage
        await c.go("warsztat", { ciecie: true });
        await c.ujecie("dwuujecie", { na: ["kret", "sarenka"] });
        await c.say("sarenka", "line.b_zaproszenie", { anim: "Zgloszenie" });
        await c.say("bobr", "line.b_koniec", { anim: "Machanie" });
      },
    ],
    practice: [
      async (c) => {
        const S = c.stage;
        c.show("bobr"); c.show("sarenka");
        S.puppets.bobr.korzen.position.x = -5.3; S.puppets.sarenka.korzen.position.x = 5.3;
        const gw = c.gwiazdki(5, { auto: false });
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        await c.ujecie("dwuujecie", { na: ["bobr", "sarenka"] });
        await c.say("sarenka", "line.p_start", { anim: "Radosc" });
        // 1. join three pairs
        {
          await c.ujecie("ogolny");
          await c.say("bobr", "line.p_polacz");
          const { L, P, w } = await laczPary(c, [["lyzka", "miska"], ["kura", "jajko"], ["pszczola", "kwiatek"]]);
          await c.ujecie("sredni", { na: ["sarenka", ...L, ...P] });
          await c.say("sarenka", "line.p_polacz_ok", { anim: "Radosc" });
          w.remove(); gw.dodaj(); c.clear();
        }
        // 2. what goes with the pillow?
        {
          await c.ujecie("ogolny");
          const pod = await c.object("poduszka", { x: 0, y: 1.7, size: 1.5 });
          const op = []; for (const [i, n] of tasuj(["lozeczko", "garnek", "pilka"]).entries()) op.push(await c.object(n, { x: -2.2 + i * 2.2, y: -1.4, size: 1.5 }));
          await c.say("sarenka", "line.p_poduszka");
          const ok = op.find((h) => h.name === "lozeczko");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_poduszka_nie" });
          await pod.moveTo(ok.mesh.position.x, ok.mesh.position.y + 0.6, 0.45); c.sfx("plop");
          await c.ujecie("sredni", { na: ["bobr", ok, pod] });
          await c.say("bobr", "line.p_lozeczko", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        // 3. memory of pairs: a thing and the one it goes with
        {
          await c.ujecie("ogolny");
          await c.say("bobr", "line.p_memory");
          await c.memory([[{ obraz: "mlotek" }, { obraz: "gwozdz" }], [{ obraz: "pedzel" }, { obraz: "farby" }], [{ obraz: "filizanka" }, { obraz: "spodek" }], [{ obraz: "klucz_gwiazda" }, { obraz: "drzwi_gwiazda" }]], { szer: 1.4 });
          await c.ujecie("sredni", { na: ["bobr"] });                         // the pairs found, named
          await c.say("bobr", "line.p_memory_ok", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        // 4. which does not belong? a cup, a saucer - and a hammer
        {
          await c.ujecie("ogolny");
          const op = []; for (const [i, n] of tasuj(["filizanka", "spodek", "mlotek"]).entries()) op.push(await c.object(n, { x: -2.0 + i * 2.0, y: 0.8, size: 1.5 }));
          await c.say("sarenka", "line.p_nie_pasuje");
          const ok = op.find((h) => h.name === "mlotek");
          dobre(ok); await c.task({ targets: op, correct: ok, wrong: "line.p_nie_pasuje_nie" });
          await c.ujecie("sredni", { na: ["bobr", ok] });
          await c.say("bobr", "line.p_mlotek", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        // 5. each thing waits for its pair: drag the pair into the place beside it
        {
          await c.ujecie("ogolny");
          const PARY = [["miska", "lyzka"], ["but", "skarpetka"], ["drzwi_gwiazda", "klucz_gwiazda"]], slots = [], items = [];
          for (const [i, [a]] of PARY.entries()) {
            const x = -3.2 + i * 3.2;
            await c.object(a, { x: x - 0.7, y: 1.5, size: 1.3 });
            slots.push({ x: x + 0.7, y: 1.5, w: 1.35, h: 1.35, accept: (h) => h.name === PARY[i][1] });
          }
          for (const [i, n] of tasuj(PARY.map((p) => p[1])).entries()) items.push(await c.object(n, { x: -2.2 + i * 2.2, y: -2.2, size: 1.3 }));
          await c.say("bobr", "line.p_dopasuj");
          const t = await c.slots({ items, slots, wrong: "line.p_dopasuj_nie" });
          await t.done();
          await c.ujecie("sredni", { na: ["sarenka"] });
          await c.say("sarenka", "line.p_dopasuj_ok", { anim: "Radosc" }); gw.dodaj();
          c.clear();
        }
        await c.praise("sarenka");
      },
    ],
    apply: [
      // home - the third act in Deer's hallway: the promised tea. The key opens the door; the storm's mess here too;
      // Mole's red hat with the red shoe; the pairs joined; things on their painted places; the teapot's cup; the tea
      // seen; "what goes with what" played
      async (c) => {
        const S = c.stage;
        const naMiejsca = () => { S.puppets.bobr.korzen.position.x = -3.2; S.puppets.kret.korzen.position.x = -1.7; S.puppets.sarenka.korzen.position.x = 3.6; };
        for (const n of ["bobr", "kret", "sarenka"]) c.show(n);
        naMiejsca();
        await c.wait(0.4);                                                  // show() pops the puppet in: a shot measured mid-pop misses the head
        const m = await c.miejsca();
        await c.say("kret", "line.d_przedpokoj", { anim: "Rozgladanie" });   // the arrival, wide
        const klucz = await c.object("klucz_gwiazda", { x: 2.6, y: 0.6, size: 1.1 });
        await c.ujecie("sredni", { na: ["sarenka", klucz] });
        await c.say("sarenka", "line.d_klucz", { anim: "Radosc" });
        await klucz.moveTo(5.4, 0.2, 0.5); c.sfx("tap"); klucz.remove();
        // the storm's mess, and Mole's pair by colour again
        await c.ujecie("ogolny");
        const [czapka, but] = await rozrzuc(c, [["czapka", -0.2, -2.4, 1.0, 0.6], ["but", 1.8, -1.5, 1.0, -0.4], ["skarpetka", 0.9, -2.7, 0.9, 1.0],
          ["szalik_dlugi", -0.4, -1.2, 1.2, -0.3], ["parasol", 2.4, -2.6, 1.1, 1.3], ["kalosze", 0.6, -1.0, 1.0, 0.2]]);
        await c.emocja("sarenka", "pot", { anim: "Smutek" });
        await c.say("sarenka", "line.d_balagan");
        czapka.mesh.rotation.z = 0; await czapka.moveTo(1.0, -1.5, 0.5); c.sfx("plop");
        await c.ujecie("sredni", { na: ["kret", czapka, but] });
        await c.say("kret", "line.d_kret_kolor", { anim: "Radosc" });
        await c.ujecie("dwuujecie", { na: ["bobr", "kret"] });
        await c.say("bobr", "line.d_kret_nie", { anim: "Kiwanie" });
        c.clear();
        // the pairs, joined
        await c.ujecie("ogolny");
        await c.say("sarenka", "line.d_polacz");
        const { L, P, w } = await laczPary(c, [["but", "skarpetka"], ["czapka", "szalik_dlugi"], ["parasol", "kalosze"]], { xL: -0.8, xP: 1.4 });
        await c.ujecie("sredni", { na: ["kret", ...L, ...P] });
        await c.say("kret", "line.d_porzadek", { anim: "Radosc" });
        w.remove();
        // every thing on its painted place: the hat on the hooks, the boots on the doormat, the shoe on the shelf
        await c.ujecie("ogolny");
        const zostaw = { czapka: 1, kalosze: 1, but: 1 }, rzeczy = [];
        for (const h of [...L, ...P]) if (!zostaw[h.name]) h.remove(); else rzeczy.push(h);
        await Promise.all(rzeczy.map((h, i) => h.moveTo(-0.6 + i * 1.4, -2.4, 0.4)));
        await c.say("sarenka", "line.d_miejsca");
        const gdzie = { czapka: m.wieszak, kalosze: m.wycieraczka, but: m.szafka_srodek };
        const t = await c.slots({ items: rzeczy, slots: rzeczy.map((h) => gdzie[h.name].slot((q) => q === h)), wrong: "line.d_miejsca_nie" });
        await t.done();
        await c.say("bobr", "line.d_miejsca_ok", { anim: "Radosc" });           // the things stay on their places
        // the tea: what goes with the teapot?
        const cz = await c.object("czajniczek", { x: 2.0, y: 1.8, size: 1.4 });
        const op = []; for (const [i, n] of tasuj(["filizanka", "pedzel", "skarpetka"]).entries()) op.push(await c.object(n, { x: -2.4 + i * 1.8, y: 0.7, size: 1.2 }));
        await c.say("sarenka", "line.d_czajniczek");
        const fil = op.find((h) => h.name === "filizanka");
        dobre(fil); await c.task({ targets: op, correct: fil, wrong: "line.d_czajniczek_nie" }); dobre(fil, false);
        await fil.moveTo(0.7, 1.8, 0.45); c.sfx("plop");
        await c.ujecie("sredni", { na: ["kret", cz, fil] });
        await c.say("kret", "line.d_filizanka", { anim: "Radosc" });
        c.clear();
        // the promised tea, seen
        const il = await c.ilustracja("herbatka_u_sarenki", { ruch: "najazd" });
        await c.say("sarenka", "line.d_herbatka");
        await c.say("kret", "line.d_herbatka_kret");
        await il.zsun();
        // the home game, played: Deer shows a thing, Mole finds its pair - then the child
        await c.ujecie("dwuujecie", { na: ["kret", "sarenka"] });
        await c.say("sarenka", "line.d_zabawa", { anim: "Zgloszenie" });
        await c.ujecie("ogolny");
        const ly = await c.object("lyzka", { x: 2.0, y: 1.8, size: 1.3 });
        const op2 = []; for (const [i, n] of tasuj(["miska", "kalosze", "kwiatek"]).entries()) op2.push(await c.object(n, { x: -2.4 + i * 1.8, y: 0.7, size: 1.2 }));
        await c.say("sarenka", "line.d_lyzka");
        const mi = op2.find((h) => h.name === "miska");
        c.look("kret", mi); await c.play("kret", "Wskazanie"); c.stage.bump(mi, 0.3);
        await mi.moveTo(0.7, 1.8, 0.45); c.sfx("plop");
        await c.ujecie("sredni", { na: ["kret", ly, mi] });
        await c.say("kret", "line.d_kret_miska", { anim: "Radosc" });
        c.clear();
        await c.ujecie("ogolny");
        const kl = await c.object("klucz_gwiazda", { x: 2.0, y: 1.8, size: 1.3 });
        const op3 = []; for (const [i, n] of tasuj(["drzwi_gwiazda", "kubek", "pedzel"]).entries()) op3.push(await c.object(n, { x: -2.4 + i * 1.8, y: 0.7, size: 1.2 }));
        await c.say("sarenka", "line.d_teraz_ty");
        const dz = op3.find((h) => h.name === "drzwi_gwiazda");
        dobre(dz); await c.task({ targets: op3, correct: dz, wrong: "line.d_teraz_ty_nie" }); dobre(dz, false);
        await kl.moveTo(dz.mesh.position.x, dz.mesh.position.y, 0.45); c.sfx("tap");
        await c.ujecie("sredni", { na: ["bobr", dz] });
        await c.say("bobr", "line.d_drzwi", { anim: "Brawo" });
        await c.ujecie("dwuujecie", { na: ["kret", "sarenka"] });             // the home task, for the parents
        await c.say("sarenka", "line.d_rodzice", { anim: "Zgloszenie" });
      },
    ],
  },
};
