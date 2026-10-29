// Lesson: spot the difference - look carefully at two pictures and find what is not the same. The magic pond on the
// meadow plays tricks: Fox's reflection has no scarf (a quick look says "the same!"); the pond's own game, two pictures
// of the meadow; Owl's drawing for her granny and the pond's copy - the differences tell which is hers; a catching
// game. Practice: three picture pairs, what is gone, which one is not like the others. At home: what moved in the room.
// Script in scenario.md.

const tasuj = (a) => a.slice().sort(() => Math.random() - 0.5);
const dobre = (hs, tak = true) => { for (const h of [].concat(hs)) h.dobry = tak; };     // the right answer, for the tests
const wyrosnij = (c) => c.stage.tween(0.4, () => {});                  // let things popping in reach their size before a shot frames them
const WODA = -0.6;                                    // the pond's edge, where Fox stands to look in

// eyes closed: the things hide for a moment (a soft fade), something changes, they come back
async function zamknijOczy(c, rzeczy, zmiana) {
  for (const h of rzeczy) h.mesh.visible = false;
  await c.wait(1.4);
  await zmiana();
  for (const h of rzeczy) if (!h.usuniety) { h.mesh.visible = true; c.stage.appear(h, true); }
}

export default {
  id: "spot_difference",
  przejscia: true,
  nagrody: true,
  characters: { lisek: { side: "left", x: -4.8 }, sowa: { side: "right", x: 4.8 } },
  backgrounds: { story: "laka", practice: { kolor: "#e3f0d6", motyw: "kola" }, apply: "pokoj" },
  stages: {
    story: [
      // A. the magic pond: Fox's reflection - "the same as me!" at a glance; looked at carefully, no scarf
      async (c) => {
        await Promise.all([c.enter("lisek"), c.enter("sowa")]);
        await c.ubierz("lisek", "szalik");
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.a_staw", { anim: "Wskazanie" });
        await c.ujecie("ogolny");
        await c.przejdz("lisek", [[0, WODA]]);
        let o = await c.odbicie("lisek", { woda: WODA, ubrania: ["szalik"], rozne: ["szalik"] });
        await c.ujecie("sredni", { na: ["lisek", o.odbicie] });             // Fox and his reflection
        await c.say("lisek", "line.a_takie_samo", { anim: "Radosc" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.a_uwaznie");
        await c.ujecie("ogolny");
        await c.say("sowa", "line.a_znajdz");
        await o.znajdz();
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.emocja("lisek", "wykrzyknik");
        await c.say("lisek", "line.a_bez_szalika");
        await c.ujecie("sredni", { na: ["sowa"] });
        await c.say("sowa", "line.a_roznica", { anim: "Zgloszenie" });
        // a second trick: a hat and glasses on, the reflection wears neither
        o.remove(); c.zdejmij("lisek");
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.a_jeszcze");
        await c.ujecie("ogolny");
        o = await c.odbicie("lisek", { woda: WODA, ubrania: ["kapelusz", "okulary", "szalik"], rozne: ["kapelusz", "okulary"] });
        await c.say("sowa", "line.a_dwie");
        await o.znajdz();
        await c.ujecie("sredni", { na: ["lisek", o.odbicie] });
        await c.say("lisek", "line.a_dwie_ok", { anim: "Brawo" });
        await c.ujecie("ogolny");
        o.remove(); c.zdejmij("lisek");
        await c.walkTo("lisek", -5.4);
        c.clear();
      },
      // B. the pond's own game: two pictures of the meadow; then Owl's drawing and the pond's copy
      async (c) => {
        const S = c.stage;
        S.puppets.lisek.korzen.position.x = -5.4; S.puppets.sowa.korzen.position.x = 5.4;     // at the edges: the pictures fill the middle
        await c.say("sowa", "line.b_gra");
        const r1 = await c.roznice("laka", { size: 3.85 });
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.b_gra_ok", { anim: "Radosc" });
        r1.remove();
        // helping: Owl's drawing for her granny, and the copy the pond made
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.emocja("sowa", "pot", { anim: "Smutek" });
        await c.say("sowa", "line.b_rysunek");
        await c.ujecie("dwuujecie", { na: ["lisek", "sowa"] });
        await c.say("lisek", "line.b_pomoge");
        await c.ujecie("ogolny");
        const r2 = await c.roznice("rysunek", { size: 3.85 });
        await c.say("sowa", "line.b_ktory");
        dobre(r2.obrazy[0]); await c.task({ targets: r2.obrazy, correct: r2.obrazy[0], wrong: "line.b_ktory_nie" });
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.emocja("sowa", "serce", { anim: "Radosc" });
        await c.say("sowa", "line.b_moj");
        r2.remove();
        // the breather: butterflies - catch three
        await c.ujecie("sredni", { na: ["lisek"] });
        await c.say("lisek", "line.b_motyle", { anim: "Podskok" });
        await c.ujecie("ogolny");
        for (const [x, y] of tasuj([[-2.4, 1.4], [0.4, 2.0], [2.6, 0.9], [-0.8, 0.2], [1.6, -0.8]]).slice(0, 3)) {
          const m = await c.object("motyl", { x, y, size: 1.0 });
          dobre(m); await c.task({ targets: [m], correct: m, wrong: "line.b_motyle" });
          c.sfx("pop"); m.remove();
        }
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.b_do_domu");
        c.clear();
        await c.ujecie("ogolny");
      },
    ],
    practice: [
      // five games, a star each
      async (c) => {
        const S = c.stage;
        c.show("lisek"); c.show("sowa");
        S.puppets.lisek.korzen.position.x = -5.4; S.puppets.sowa.korzen.position.x = 5.4;
        const gw = c.gwiazdki(5, { auto: false });
        await wyrosnij(c);
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.p_start", { anim: "Radosc" });
        await c.ujecie("ogolny");
        for (const [i, para] of ["ogrodek", "plaza", "pokoik"].entries()) {
          await c.say(i % 2 ? "lisek" : "sowa", `line.p_para_${para}`);
          const r = await c.roznice(para, { size: 3.85 });
          await c.ujecie("zblizenie", { na: i % 2 ? "sowa" : "lisek" });
          await c.say(i % 2 ? "sowa" : "lisek", "line.p_para_ok");
          r.remove(); gw.dodaj(); await c.ujecie("ogolny");
        }
        // what is gone: three rounds, the row grows (four, then five things); eyes closed; one disappears
        for (const [runda, zestaw] of [["jablko", "gruszka", "marchewka", "grzyb"], ["pilka", "misiu", "klocek", "kubek", "but"], ["szyszka", "zoledz", "kasztan", "lisc_czerwony", "kwiatek"]].entries()) {
          const nazwy = tasuj(zestaw), krok = nazwy.length > 4 ? 1.35 : 1.6, x0 = -0.15 - ((nazwy.length - 1) * krok) / 2, rzad = [];
          for (const [i, n] of nazwy.entries()) rzad.push(await c.object(n, { x: x0 + i * krok, y: 1.3, size: 1.05 }));
          await wyrosnij(c);
          await c.ujecie("sredni", { na: rzad });                           // the row to remember, close
          await c.say("lisek", runda ? "line.p_jeszcze_raz" : "line.p_zapamietaj");
          await c.wait(1.5 + runda * 0.5);
          await c.ujecie("zblizenie", { na: "lisek" });
          await c.say("lisek", "line.p_zamknij");
          await c.ujecie("ogolny");
          const znika = rzad[Math.floor(Math.random() * rzad.length)];
          await zamknijOczy(c, rzad, async () => { znika.usuniety = true; znika.remove(); });
          // the row framed, a "?" in the gap: the child sees where to look
          const xa = x0 - 0.85, xb = x0 + (nazwy.length - 1) * krok + 0.85;
          await c.line([[xa, 2.05], [xb, 2.05], [xb, 0.55], [xa, 0.55], [xa, 2.05]], { color: "#1f5fbf", width: 0.07, duration: 0.5, strong: true });
          await c.sign("?", { x: znika.mesh.position.x, y: 1.3, size: 1.0 });
          const inne = tasuj(zestaw.filter((n) => n !== znika.name)).slice(0, 1).concat(tasuj(["pilka", "kubek", "misiu", "jablko", "lyzka"].filter((n) => !zestaw.includes(n))).slice(0, 1));
          const opcje = [];
          for (const [i, n] of tasuj([znika.name, ...inne]).entries()) { const h = await c.object(n, { x: -2.0 + i * 2.0, y: -1.8, size: 1.1, plik: rzad.find((q) => q.name === n)?.plik ?? null }); opcje.push(h); }   // the very picture of the row
          await c.say("lisek", "line.p_co_zniknelo");
          const ok = opcje.find((h) => h.name === znika.name);
          dobre(ok); await c.task({ targets: opcje, correct: ok, wrong: "line.p_co_zniknelo_nie" });
          await c.ujecie("sredni", { na: [ok, "sowa"] });
          await c.say("sowa", "line.p_co_zniknelo_ok");
          c.clear(); await c.ujecie("ogolny");
        }
        gw.dodaj();
        // which one is not like the others: four shadows, one of another thing
        {
          const inny = Math.floor(Math.random() * 4), cienie = [];
          for (let i = 0; i < 4; i++) { const h = await c.object(i === inny ? "gruszka" : "jablko", { x: -2.7 + i * 1.8, y: 0.6, size: 1.4 }); c.cien(h); cienie.push(h); }
          await c.say("sowa", "line.p_inny");
          dobre(cienie[inny]); await c.task({ targets: cienie, correct: cienie[inny], wrong: "line.p_inny_nie" });
          for (const h of cienie) c.cien(h, false);
          await c.ujecie("sredni", { na: [cienie[inny]] });                 // the pear among the apples
          await c.say("lisek", "line.p_inny_ok");
          gw.dodaj(); c.clear(); await c.ujecie("ogolny");
        }
        await c.praise("sowa");
      },
    ],
    apply: [
      // home: what moved? the toys on the rug, eyes closed, two swap places - point to one of them; twice
      async (c) => {
        for (const n of ["lisek", "sowa"]) c.show(n);
        await wyrosnij(c);
        await c.ujecie("zblizenie", { na: "lisek" });
        await c.say("lisek", "line.d_zabawa", { anim: "Radosc" });
        await c.ujecie("ogolny");
        const miejsca = [[-2.4, -1.9], [-0.8, -1.4], [0.8, -1.9], [2.4, -1.4]];
        const zabawki = [];
        for (const [i, n] of ["misiu", "pilka", "klocek", "kubek"].entries()) zabawki.push(await c.object(n, { x: miejsca[i][0], y: miejsca[i][1], size: 1.15 }));
        for (let r = 0; r < 2; r++) {
          await wyrosnij(c);
          await c.ujecie("sredni", { na: zabawki });                        // the toys to remember, close
          await c.say("sowa", r ? "line.d_jeszcze" : "line.d_zapamietaj");
          await c.wait(1.5);
          await c.ujecie("zblizenie", { na: "lisek" });
          await c.say("lisek", "line.d_zamknij");
          await c.ujecie("ogolny");
          const [a, b] = tasuj(zabawki).slice(0, 2);
          await zamknijOczy(c, zabawki, async () => {
            const pa = [a.mesh.position.x, a.mesh.position.y], pb = [b.mesh.position.x, b.mesh.position.y];
            a.mesh.position.set(pb[0], pb[1], a.mesh.position.z); b.mesh.position.set(pa[0], pa[1], b.mesh.position.z);
          });
          // both: the first one, then the one it swapped with (one pick and "yes, these two" named a toy the child never found)
          await c.say("sowa", "line.d_co");
          dobre([a, b]); const pierwsza = await c.task({ targets: zabawki, correct: [a, b], wrong: "line.d_nie" }); dobre([a, b], false);
          const druga = pierwsza === a ? b : a;
          const k1 = await c.circle(pierwsza);
          await c.say("sowa", "line.d_druga");
          dobre(druga); await c.task({ targets: zabawki.filter((h) => h !== pierwsza), correct: druga, wrong: "line.d_druga_nie" }); dobre(druga, false);
          const k2 = await c.circle(druga);
          await c.ujecie("sredni", { na: [a, b] });                         // the two swapped toys, circled
          await c.say("lisek", "line.d_tak");
          // they swap back, so the child sees the change
          k1.remove(); k2.remove();
          const pa = [a.mesh.position.x, a.mesh.position.y], pb = [b.mesh.position.x, b.mesh.position.y];
          await Promise.all([a.moveTo(pb[0], pb[1], 0.6), b.moveTo(pa[0], pa[1], 0.6)]);
          await c.ujecie("ogolny");
        }
        await c.ujecie("zblizenie", { na: "sowa" });
        await c.say("sowa", "line.d_rodzice");
        await c.ujecie("ogolny");
      },
    ],
  },
};
