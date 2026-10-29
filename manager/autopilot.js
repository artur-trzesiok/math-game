// Drive a lesson from the console: waits for click targets, picks the right one from the
// last spoken line, snapshots each task. Usage in the page: await (await import('/manager/autopilot.js')).run(20)
// The story preview (?scenariusz) runs it too, without the snapshots.
const snap = (n) => (new URLSearchParams(location.search).has("scenariusz") ? Promise.resolve() : gra.snap(n));
export async function run(maxSteps = 20, prefix = "a") {
  const log = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let step = 0; step < maxSteps; step++) {
    let t0 = performance.now();
    while (!gra.cele.length) {
      const G = gra.stage;                                        // a finger drawing (mechaniki.js): trace or colour it in at once
      if (G?.slad) { await sleep(300); await snap(`${prefix}slad${step}`); G.slad.dokoncz(); log.push("slad"); await sleep(400); continue; }
      if (G?.polacz) { await sleep(300); await snap(`${prefix}polacz${step}`); await G.polacz.dokoncz(); log.push("polacz"); await sleep(400); continue; }
      if (G?.szukaj) { const z = G.szukaj; await sleep(300); await snap(`${prefix}szukaj${step}`); if (G.szukaj === z) await z.dokoncz(); log.push("szukaj"); await sleep(400); continue; }
      if (G?.zagroda) { await sleep(300); await snap(`${prefix}zagroda${step}`); await G.zagroda.dokoncz(); log.push("zagroda"); await sleep(400); continue; }
      if (G?.labirynt) { await sleep(300); await snap(`${prefix}labirynt${step}`); await G.labirynt.dokoncz(); log.push("labirynt"); await sleep(400); continue; }
      if (G?.winda) { await sleep(300); await snap(`${prefix}winda${step}`); await G.winda.dokoncz(); log.push("winda"); await sleep(400); continue; }
      if (G?.kolorowanka) { await sleep(300); G.kolorowanka.dokoncz(); log.push("kolorowanka"); await sleep(400); continue; }
      // the painted mechanics and the breathers of the improvement plan (mechaniki4.js, oddechy.js)
      let nowa = false;
      for (const k of ["zdrapka", "kropki", "siatka", "regula", "rozdaj", "szpara", "miarka", "wykres", "zegar", "portrety", "peczki", "historyjka", "podarty", "wedrowka", "oddech"]) {
        const m = G?.[k]; if (!m) continue;
        await sleep(300); await snap(`${prefix}${k}${step}`); if (G[k] === m) await m.dokoncz(); log.push(k); await sleep(400); nowa = true; break;
      }
      if (nowa) continue;
      const ds = gra.stage && gra.stage.dragSet;
      if (ds && ds.free) {                                        // free dragging (geometria.js): solve it like a child would
        const S = gra.stage; let kind = "free"; await sleep(300); await snap(`${prefix}pre${step}`);
        if (ds.tangram) {
          kind = "tangram";
          const T = (await import("/game/engine/geometria.js")).TANGRAM;
          const eq = (a, b, sym) => (((a - b) % sym) + sym) % sym === 0;
          for (const k of ds.items.filter((k) => !k.na)) {
            const fits = () => ds.tangram.find((s) => !s.zajety && s.t === k.tag && eq(k.rot, s.rot, T[k.tag].sym));
            for (let i = 0; i < 8 && !fits(); i++) { S.stuknij(k); await sleep(80); }
            const s = fits(); if (s) { S.upusc(k, s.x, s.y); await sleep(260); }
          }
        } else if (ds.slots) {
          kind = "slots";
          for (const k of ds.items.filter((k) => !k.slot)) {
            const z = ds.slots.find((z) => !z.zajety && z.accept(k)); if (z) { S.upusc(k, z.x, z.y); await sleep(160); }
          }
        } else if (ds.place) {
          kind = "place:" + ds.place.want;
          const G = await import("/game/engine/geometria.js");
          const k = ds.items[0], w = ds.place.want, b = S.bounds(ds.place.ref);
          // behind / in / in front of: a child drops it on the thing's middle (the settled spot of a small thing behind reads as "on")
          const p = ["za", "w", "przed"].includes(w) ? { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 } : G.pozycja(S, w, k, ds.place.ref, ds.place.ref2);
          S.upusc(k, p.x, p.y);
        } else if (ds.ubieranie) {
          kind = "ubieranie";
          const THREE = await import("three");
          for (const h of ds.items.filter((h) => h.mesh.parent && h.mesh.visible && !ds.ubieranie.zostaw.includes(h))) {
            const who = ds.ubieranie.kto.find((n) => ds.ubieranie.pasuje(h, n) === true); if (!who) continue;
            const b = new THREE.Box3().setFromObject(S.puppets[who].korzen);
            S.upusc(h, (b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2); await sleep(900);
          }
        } else if (ds.ramka) {
          kind = "ramka";                                           // the ten frame: drop on it until it holds n
          for (const h of ds.items.slice()) { if (!S.dragSet || ds.ramka.ile() >= ds.ramka.n) break; if (h.wRamce) continue; S.upusc(h, ds.ramka.x, ds.ramka.y); await sleep(300); }
        } else if (ds.sklepik) {
          kind = "sklepik";                                         // the shop: as many coins onto the plate as the price
          for (const h of ds.items.slice()) { if (!S.dragSet || ds.sklepik.na.length >= ds.sklepik.cena) break; if (ds.sklepik.na.includes(h)) continue; S.upusc(h, ds.sklepik.x, -1.45); await sleep(400); }
        } else if (ds.rozdaj) {
          kind = "rozdaj";                                          // give one to each: drop on the next one without
          for (const h of ds.items.slice()) { const o = ds.rozdaj.wolni()[0]; if (!o) break; const [x, y] = ds.rozdaj.pozycja(o); S.upusc(h, x, y); await sleep(900); }
        } else if (ds.wieza) {
          kind = "wieza";                                           // a tower: the widest first, each on the first place
          for (const h of ds.items.slice().sort((p, q) => q.w - p.w)) { if (!S.dragSet) break; S.upusc(h, ds.wieza.miejsca[0].x, 0); await sleep(700); }
        } else if (ds.doLinii) {
          kind = "doLinii";                                         // from one line: drop each where it snaps
          for (const h of ds.items.slice()) { const [x, y] = ds.doLinii(h); S.upusc(h, x, y); await sleep(500); }
        } else if (ds.przeloz) {
          kind = "przeloz"; S.upusc(ds.items[0], ds.przeloz.x, ds.przeloz.y);
        } else if (ds.sym) {
          kind = "sym"; const k = ds.items.find((k) => k.ok); S.upusc(k, ds.sym.x + 0.3, ds.sym.y);
        }
        await sleep(500);
        await snap(`${prefix}free${step}`);
        log.push([step, kind]); step++;
        await sleep(400);
        continue;
      }
      if (ds) {                                                   // a sorting task: drop every loose item by its tag
        const loose = ds.items.filter((i) => !i.zone);
        if (!loose.length) { await sleep(300); continue; }
        // a tag already present in a zone goes there; the others take the remaining zones in order
        const where = {}; for (const z of ds.zones) { if (z.want) where[z.want] = z; for (const i of z.items) where[i.tag] = z; }
        const free = ds.zones.filter((z) => !Object.values(where).includes(z));
        for (const it of loose) { if (!where[it.tag]) where[it.tag] = free.shift() || ds.zones[0]; gra.stage.dropInto(it, where[it.tag]); await sleep(120); }
        await snap(`${prefix}sort${step}`);
        log.push([step, "sort", ds.items.map((i) => i.name + ":" + i.tag).join(",")]);
        step++;
        await sleep(600);
        continue;
      } await sleep(100); if (performance.now() - t0 > 40000) { log.push("timeout waiting for targets"); return log; } if (document.querySelector("#menu").style.display === "flex") { log.push("menu"); return log; } }
    await sleep(300);
    const S = gra.stage, targets = S.targets.slice(), last = (gra.dziennik.slice(-1)[0] || [])[0] || "";
    await snap(`${prefix}${step}`);
    let pick = 0;
    const dobry = targets.findIndex((t) => t.dobry);                      // a lesson may mark the right answer for tests
    const sizes = targets.map((t) => t.korzen ? NaN : (t.base ?? 1));
    const okSizes = sizes.filter((v) => !isNaN(v));
    const ileObiektow = () => S.objects.filter((o) => o.kind === "object" && o.mesh.visible !== false).length;
    const wStrefie = (z) => S.objects.filter((o) => o.kind === "object" && Math.abs(o.mesh.position.x - z.x) < z.w / 2 && Math.abs(o.mesh.position.y - z.y) < z.h / 2).length;
    const cyfraLini = /line\.(?:s_point_|c_pick_|p_group_|b_pick_)(\d+)/.exec(last);
    const doLiczenia = targets.filter((t) => t.kind === "object" && t.policzony === false);
    if (targets.some((t) => t.kind === "object" && "policzony" in t)) pick = targets.findIndex((t) => t.kind === "object" && !t.policzony);
    else if (/p_how_many|a_which_digit|wrong_digit|p_together|b_pick|c_slot/.test(last) && targets.some((t) => t.kind === "sign")) pick = targets.findIndex((t) => t.kind === "sign" && +t.name === ileObiektow());
    else if (cyfraLini && targets.some((t) => t.kind === "line")) pick = targets.findIndex((t) => t.name === `cyfra_${cyfraLini[1]}`);
    else if (cyfraLini && targets.some((t) => t.kind === "sign")) pick = targets.findIndex((t) => t.kind === "sign" && t.name === cyfraLini[1]);
    else if (cyfraLini && targets.some((t) => t.kind === "zone")) pick = targets.findIndex((t) => t.kind === "zone" && wStrefie(t) === +cyfraLini[1]);
    else if (/(?:p_|s_point_|a_)(kolo|trojkat|kwadrat|prostokat|circle)|b_turned|a_(talerz|klocek|pilka|ciastko)|wrong_shape|wrong_sides|_corners/.test(last) && targets.some((t) => ["kolo", "trojkat", "kwadrat", "prostokat"].includes(t.tag))) {
      const hist = gra.dziennik.map((l) => l[0]).reverse().find((k) => /p_(kolo|trojkat|kwadrat|prostokat)|s_point_circle|b_turned|a_(talerz|klocek|pilka|ciastko)|a_(three|four|no)_corners/.test(k)) || "";
      const want = /kolo|circle|talerz|pilka|ciastko|no_corners/.test(hist) ? "kolo" : /kwadrat|turned|klocek|four_corners/.test(hist) ? "kwadrat" : /trojkat|three_corners/.test(hist) ? "trojkat" : "prostokat";
      pick = targets.findIndex((t) => t.tag === want);
    }
    else if (/a_how_many_corners|wrong_number/.test(last) && targets.some((t) => t.kind === "sign")) { const sh = S.objects.find((o) => o.tag === "trojkat" || o.tag === "kwadrat"); pick = targets.findIndex((t) => t.kind === "sign" && +t.name === (sh && sh.tag === "trojkat" ? 3 : 4)); }
    else if (/line\.(?:[spabc]_(?:point_)?)(first|second|third|fourth|fifth|last)|first_now|c_between|wrong_place/.test(last)) {
      const hist = gra.dziennik.map((l) => l[0]).reverse().find((k) => /(first|second|third|fourth|fifth|last|between)/.test(k) && !/wrong/.test(k)) || "";
      const ord = targets.filter((t) => t.mesh).slice().sort((a, b) => a.mesh.position.x - b.mesh.position.x);
      const m = /first_now|first/.test(hist) ? 0 : /second/.test(hist) ? 1 : /third|between/.test(hist) ? 2 : /fourth/.test(hist) ? 3 : /fifth/.test(hist) ? 4 : ord.length - 1;
      pick = targets.indexOf(ord[m]);
    }
    else if (/p_gap|wrong_piece/.test(last)) { window.__gap = (window.__gap ?? -1) + 1; const ks = targets.filter((t) => /^kawalek_/.test(t.name)); pick = targets.indexOf(ks[window.__gap % ks.length]); }
    else if (/c1_which_line|c1_wrong_line/.test(last)) { const ls = targets.filter((t) => t.kind === "line"); pick = targets.indexOf(ls.reduce((a, b) => (b.y > a.y ? b : a))); }
    else if (/c1_pick|c1_wrong_pear/.test(last)) pick = sizes.indexOf(Math.max(...okSizes));
    else if (/e_gdzie_pilka|e_nie_tam/.test(last)) pick = targets.findIndex((t) => t.name === "koszyk");
    if (dobry >= 0) pick = dobry;
    else if (/b_co_przyda|b_nie_grzeje/.test(last)) pick = targets.findIndex((t) => t.rzecz || /ubrania/.test(t.name || ""));   // grouping
    else if (/b_lap|b_nie_ten|b_lapiemy/.test(last)) pick = targets.findIndex((t) => t.name === "lisc_czerwony");
    else if (/c_ktora|c_nie_ta/.test(last)) pick = targets.findIndex((t) => t.kolor === "czerwona");
    else if (/p_wspolne|p_nie_pasuje/.test(last)) pick = targets.findIndex((t) => t.name === "pilka");
    else if (/p_grzyby|p_nie_grzyb/.test(last)) pick = targets.findIndex((t) => t.name === "grzyb");
    else if (/p_inny|p_pasuje/.test(last)) pick = targets.findIndex((t) => t.tag === "k");
    else if (/d_najpierw|d_nie_jablko/.test(last)) pick = targets.findIndex((t) => t.name === "jablko");
    else if (/a_wskaz_maly|a_nie_ten/.test(last)) pick = sizes.indexOf(Math.min(...okSizes));                  // bigger_smaller
    else if (/b_wskaz_duzy|b_jeszcze|b_utonal/.test(last)) pick = sizes.indexOf(Math.max(...okSizes));
    else if (/bigger|biggest|a_sq_your_turn|big_cone|s3_pick|s3_wrong/.test(last)) pick = sizes.indexOf(Math.max(...okSizes));
    else if (/smaller|smallest|s2_prompt|small_leaf|small_spoon/.test(last)) pick = sizes.indexOf(Math.min(...okSizes));
    else if (/which_more/.test(last)) { const zs = targets.filter((t) => t.kind === "zone"); const cnt = (z) => S.objects.filter((o) => o.kind === "object" && Math.abs(o.mesh.position.x - z.x) < z.w / 2).length; pick = targets.indexOf(cnt(zs[0]) > cnt(zs[1]) ? zs[0] : zs[1]); }
    else if (/which_sign|j2_pick_sign|p_wrong_sign/.test(last)) { const n = (x) => S.objects.filter((o) => o.kind === "object" && (x < 0 ? o.mesh.position.x < 0 : o.mesh.position.x > 0)).length; const want = n(-1) === n(1) ? "=" : n(-1) > n(1) ? ">" : "<"; pick = targets.findIndex((t) => t.name === want); }
    else if (/point_left|wrong_left/.test(last)) { const objs = targets.filter((t) => t.mesh); const lone = objs.find((t) => !objs.some((u) => u !== t && Math.abs(u.mesh.position.x - t.mesh.position.x) < 0.3)); pick = lone ? targets.indexOf(lone) : 0; }
    else if (/runaway/.test(last)) { const objs = targets.filter((t) => t.mesh); pick = targets.indexOf(objs.reduce((a, b) => (b.mesh.position.x > a.mesh.position.x ? b : a))); }
    else if (/pick_gt/.test(last)) pick = targets.findIndex((t) => t.name === ">");
    else if (/pick_eq/.test(last)) pick = targets.findIndex((t) => t.name === "=");
    else if (/pick_lt/.test(last)) pick = targets.findIndex((t) => t.name === "<");
    else if (/where_pear|g0_wrong_pear/.test(last)) pick = targets.findIndex((t) => t.items && t.items.some((i) => i.tag === "pear"));
    else if (/point_apples|not_apples/.test(last)) pick = targets.findIndex((t) => t.items && t.items.some((i) => i.tag === "apple"));
    else if (/point_big|not_big/.test(last)) pick = targets.findIndex((t) => t.items && t.items.some((i) => i.tag === "big"));
    else if (/point_odd|s15_wrong|j3_wrong_odd/.test(last)) pick = targets.findIndex((t) => t.tag === "apple" || t.tag === "cone");
    else { pick = -1; }                                     // grouping: handled by tags below
    if (pick < 0) {
      const rule = { s1_apples: "apple", s1_not_apple: "apple", s1_pears: "pear", s1_not_pear: "pear", s2_big: "big", s2_not_big: "big", s2_small: "small", s2_not_small: "small",
                     p_cups: "cup", p_not_cup: "cup", p_food: "food", p_not_food: "food", p_red: "red", p_not_red: "red", p_small: "small", p_not_small: "small", p_done: null, a_deer_dishes: "dish", a_not_dish: "dish" };
      const hist = gra.dziennik.map((l) => l[0].replace("line.", "")).reverse();
      let tag = null; for (const k of hist) { if (k in rule && rule[k]) { tag = rule[k]; break; } }
      const i = targets.findIndex((t) => t.tag === tag);
      // unknown prompt: try the targets one after another instead of looping on the first
      window.__cyc = (window.__cyc || {}); const key = last + targets.length; window.__cyc[key] = (window.__cyc[key] || 0);
      pick = i >= 0 ? i : (window.__cyc[key]++ % targets.length);
    }
    const hit = gra.klikCel(pick);
    log.push([step, last, targets.map((t) => t.name + (t.tag ? ":" + t.tag : "")).join(","), pick, hit ? hit.name : null]);
  }
  return log;
}
