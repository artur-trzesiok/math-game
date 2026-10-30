// Master player: lists the lessons, picks the language, runs a lesson's three
// stages (story, practice, apply) scene by scene. A lesson is a plug-in module
// (game/lessons/<id>/lesson.js) that follows the contract in guidelines.md; the
// player gives every scene a context object and never looks inside the lesson.
//
// URL: ?lekcja=<id>&etap=story|practice|apply&lang=pl|en&szybko&napisy&safe

import * as THREE from "three";
import { v } from "./v.js";
import { narysujCyfre, liczDotykiem, narysujRownanie } from "./liczby.js";
import * as G from "./geometria.js";
import * as E from "./efekty.js";
import * as U from "./ubior.js";
import { Stage, GROUND, SUFIT } from "./scene.js";
import * as Album from "./album.js";
import * as Mapa from "./mapa.js";
import { naPierwszyDotyk } from "./odblokuj.js";
import * as R from "./rytm.js";
import * as M from "./mechaniki.js";
import * as M2 from "./mechaniki2.js";
import * as M3 from "./mechaniki3.js";
import * as IL from "./ilustracje.js";
import * as M4 from "./mechaniki4.js";
import * as M5 from "./mechaniki5.js";
import * as M6 from "./mechaniki6.js";
import * as M7 from "./mechaniki7.js";
import * as OD from "./oddechy.js";
import { Speech, FAST } from "./speech.js";
import { LANGS, pickLang, loadStrings, translator, lineOf } from "./i18n.js";

const $ = (s) => document.querySelector(s);
const PARAMS = new URLSearchParams(location.search);
// topics open one after another: a topic opens when every lesson of the one before has its sticker in the album (the
// album is the record of what was played); the first is always open. A 3 s press on a padlock opens that topic for
// good (a parent's way through), ?wszystko opens them all (tests); a topic seen open for the first time unlocks
// on screen (the mist clears, the padlock opens and falls)
const PRZEWINIECIE = "math_game.menu_x";                             // how far the menu strip was scrolled
const OTWARTE = "math_game.otwarte", WIDZIANE = "math_game.widziane_otwarte", UKONCZONE = "math_game.etapy_ukonczone";
const SWIAT = "math_game.swiat";
// a world's own plank (make_menu DESKI) and how far its decorations stick out of the bare wood, in % of the name's box
const DESKI = { swiat1: [40, 1.4, 9, 1.8], swiat2: [45, 16, 10, 16], swiat3: [39, 1.8, 37, 1.9], swiat4: [62, 1.4, 6, 1.6] };
const deska = (id) => `--deska:url(${v(`/game/assets/menu/deska_${id}.webp`)});` + (DESKI[id] || [0, 0, 0, 0]).map((x, i) => `--deska-${"trbl"[i]}:${x}`).join(";");                                       // the world the menu shows
const lista = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
const dopisz = (k, id) => { try { const l = lista(k); if (!l.includes(id)) localStorage.setItem(k, JSON.stringify([...l, id])); } catch { /* private mode */ } };
const dzwiekMenu = (n) => { if (PARAMS.has("cicho")) return; try { const a = new Audio(v(`/game/audio/sfx/${n}.mp3`)); a.volume = 0.7; a.play().catch(() => {}); } catch { /* ignore */ } };

// the menu's music (game/audio/muzyka/menu.mp3, see SOURCES.md): waits for the first tap (iPad), ducks while the
// album talks, fades out when a lesson starts
const MENU_GLOS = 0.3;
const menuMuzyka = {
  a: null, gra: false, fade: 0,
  motyw: "menu",
  graj(motyw = this.motyw) {
    if (PARAMS.has("cicho")) return;
    // another world: the old tune fades out, the world's own comes in
    if (this.a && motyw !== this.motyw) {
      const stary = this.a; this.a = null; let k = 0;
      const f = setInterval(() => { k++; stary.volume = Math.max(0, stary.volume - MENU_GLOS / 10); if (k >= 10) { clearInterval(f); stary.pause(); } }, 50);
    }
    this.motyw = motyw;
    this.gra = true; clearInterval(this.fade);
    // two ~150 s versions in turn (tools/audio/make_music.py "menu", "menu_swiat2" ...); the old 45 s tune if they are not made yet
    if (!this.a) {
      this.n = Math.floor(Math.random() * 2);
      const nast = () => { this.n = (this.n + 1) % 2; this.a.src = v(`/game/audio/muzyka/${motyw}_${this.n + 1}.mp3`); if (this.gra) this.a.play()?.catch(() => {}); };
      this.a = new Audio(v(`/game/audio/muzyka/${motyw}_${this.n + 1}.mp3`));
      this.a.onended = nast;
      this.a.onerror = () => { if (!this.a.src.endsWith("menu.mp3")) { this.a.onended = null; this.a.loop = true; this.a.src = v("/game/audio/muzyka/menu.mp3"); if (this.gra) this.a.play()?.catch(() => {}); } };
    }
    this.a.volume = MENU_GLOS;
    const sprobuj = () => { if (this.gra && this.a.paused) this.a.play()?.catch(() => {}); };
    sprobuj(); naPierwszyDotyk(sprobuj);
  },
  przycisz(k) { if (this.a) this.a.volume = MENU_GLOS * k; },
  stop() {
    this.gra = false; const a = this.a; if (!a || a.paused) return;
    let k = 0; clearInterval(this.fade);
    this.fade = setInterval(() => { k++; a.volume = MENU_GLOS * Math.max(0, 1 - k / 8); if (k >= 8) { clearInterval(this.fade); a.pause(); } }, 50);
  },
};
const STAGES = ["story", "practice", "apply"];
const DEBUG = PARAMS.has("debug");
// ?scenariusz: the story preview (manager/opowiesc.html) - the autopilot plays the lesson and every line, shot and
// task is written down in order with a thumbnail of the frame (gra.scenariusz)
const NAGRAJ = PARAMS.has("scenariusz");
const OBRAZ = new Set(["go", "pan", "ujecie", "przejdz", "walkTo", "enter", "show", "emocja", "wonder", "odliczanie", "czastki", "play", "idea", "nalozenie", "take", "put", "konfetti", "ubierz", "digit", "przejscie", "focus", "rozblysk", "znalezisko", "ilustracja"]);
const INTERAKCJE = new Set(["task", "sort", "ubieranie", "place", "symmetry", "slots", "tangram", "count", "choose",
  "memory", "slad", "polacz", "zagroda", "labirynt", "roznice", "szukaj", "kolorowanka", "strzalki", "podziel", "sklepik", "taniec", "zdrapka", "kropki", "siatka", "regula", "rozdaj", "szpara", "miarka", "wykres", "zegar", "portrety", "peczki", "historyjka", "podarty", "wedrowka", "kpn", "lustro", "karmienie", "latawiec", "ktoPowiedzial", "malowanie"]);                   // ?debug=1: the phase icons jump between stages

// a background's identity: a name, or an insert {kolor, motyw}
const tloId = (bg) => (typeof bg === "object" && bg ? (bg.id || `kolor:${bg.kolor}:${bg.motyw}`) : bg);
function pelnyEkran() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)?.call(document.documentElement);
}
// an empty star: pale glass on the dark bar; a won one: gold with a dark edge - both read on any background
const GWIAZDA = (kolor, brzeg = "#fff") => `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="${kolor}" stroke="${brzeg}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
// the stars of a practice stage in the HUD: grey until a round is done
function pasekGwiazdek(n, auto) {
  const el = $("#hud .gwiazdki"); el.innerHTML = Array.from({ length: n }, () => GWIAZDA("rgba(255,255,255,.45)")).join("");
  let zrobione = 0;
  return { auto, get zrobione() { return zrobione; }, dodaj() {
    const g = el.children[zrobione]; if (!g) return; zrobione++;
    g.outerHTML = GWIAZDA("#ffc928", "#a86b00").replace("<svg", '<svg class="pelna"');
  }, usun() { el.innerHTML = ""; } };
}
// a streak of first-try answers: a badge with one flame per answer (no digits: the youngest cannot read them)
function pokazSerie(n, S) {
  const el = $("#seria"), plomien = `<svg viewBox="0 0 24 24"><path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-2-1-3-1-3 3 1 5 4 5 7a7 7 0 01-14 0c0-6 7-8 7-13z" fill="#fff"/></svg>`;
  el.innerHTML = plomien.repeat(Math.min(5, n)); el.classList.add("on"); S.sfx.graj("idea");
  clearTimeout(pokazSerie.t); pokazSerie.t = setTimeout(() => el.classList.remove("on"), 1500);
}

export class Player {
  constructor() {
    this.lang = pickLang();
    this.ui = {};
    this.speech = new Speech($("#subtitle"));
    this.stage = null; this.lesson = null; this.lessonId = null; this.run = 0; this.scenaNr = 0;
    window.gra = this;                                   // tests and debugging (see CLAUDE.md)
  }

  async boot() {
    this.ui = await loadStrings(`/game/i18n/${this.lang}.json`);
    this.t = translator([this.ui]);
    this.index = await (await fetch(v("/game/lessons/index.json"), { cache: "no-store" })).json();
    const wanted = PARAMS.get("lekcja");
    if (wanted && NAGRAJ) setTimeout(async () => { try { await (await import(v("/manager/autopilot.js"))).run(400, "scen"); } catch (e) { console.warn(e); } this.scenariuszKoniec = true; }, 1500);
    if (wanted && this.index.lessons.some((l) => l.id === wanted && !l.wkrotce)) await this.start(wanted, PARAMS.get("etap"));
    else this.menu();
  }

  // ------------------------------------------------------------------ menu
  // move to another world: its name and badge over a white cloud, then its strip slides in with its scenery and music
  async przejdzSwiat(id) {
    const w = (this.index.swiaty || []).find((s) => s.id === id); if (!w) return;
    const z = $("#swiatZmiana");
    z.querySelector(".odznaka").src = v(`/game/assets/menu/odznaka_${w.id}.webp`);
    z.querySelector(".nazwa").style.cssText = deska(w.id);
    z.querySelector(".nazwa").textContent = w.title?.[this.lang] || w.title?.en || "";
    z.style.display = "flex"; void z.offsetWidth; z.classList.add("widac"); dzwiekMenu("plansza");
    await new Promise((r) => setTimeout(r, 900));
    this.swiat = id; try { localStorage.setItem(SWIAT, id); } catch { /* private mode */ }
    this.menuX = null;
    this.menu({ zmiana: true });
    const pas = $("#lessons"); pas.classList.remove("wjazd"); void pas.offsetWidth; pas.classList.add("wjazd");
    await new Promise((r) => setTimeout(r, 500));
    z.classList.remove("widac"); setTimeout(() => { z.style.display = "none"; }, 460);
  }

  // Fox's menu lines (game/menu/i18n, tools/menu/make_menu_lines.py)
  async liniaMenu(key) {
    this.menuLinie = this.menuLinie?.lang === this.lang ? this.menuLinie : { lang: this.lang, t: await fetch(v(`/game/menu/i18n/${this.lang}.json`), { cache: "no-store" }).then((r) => r.json()).catch(() => ({})) };
    return this.menuLinie.t[key];
  }
  // Fox says a menu line with no head badge (the map has Fox on it); the music steps back meanwhile
  async mowMenu(key) {
    const l = await this.liniaMenu(key); if (!l) return;
    menuMuzyka.przycisz(0.35);
    try { await this.speech.say({ lang: this.lang, lessonId: "menu", key, text: l.text, who: l.who || "lisek", puppet: null }); } catch { /* never breaks the menu */ }
    finally { menuMuzyka.przycisz(1); }
  }

  menu({ zmiana = false } = {}) {
    this.closeStage();
    // typing "metanoia" on the menu (a keyboard; a tablet has none): every sticker into the album, every stage open;
    // "math": the next lesson in order counts as passed (its sticker), so finishing a stage and its unlocking can be watched
    // "kerygmat": every lesson of this land and the lands before counts as passed but the land's last one - then one "math"
    // shows the last stage finishing and the gate opening
    if (!this.adminSluch) {
      this.adminSluch = true; let bufor = "";
      document.addEventListener("keydown", (e) => {
        if ($("#menu").style.display === "none" || e.key.length !== 1) return;
        bufor = (bufor + e.key.toLowerCase()).slice(-8);
        if (bufor.endsWith("kerygmat")) {                               // this land passed but its last lesson (earlier lands whole)
          bufor = "";
          const byId = Object.fromEntries(this.index.lessons.map((l) => [l.id, l])), topics = this.index.topics || [];
          const swiaty = this.index.swiaty || [], nr = Math.max(0, swiaty.findIndex((s) => s.id === this.swiat)), tu = new Set(swiaty[nr]?.etapy || []);
          const doTej = topics.slice(0, topics.findIndex((t) => tu.has(t.id)) + topics.filter((t) => tu.has(t.id)).length);
          const ostatnia = doTej.flatMap((t) => t.lessons).filter((i) => byId[i] && !byId[i].wkrotce).pop();
          for (const t of doTej) {
            for (const i of t.lessons) if (byId[i] && !byId[i].wkrotce && i !== ostatnia) Album.dodaj(i);
            dopisz(WIDZIANE, t.id);
            if (!t.lessons.includes(ostatnia)) { dopisz(UKONCZONE, t.id); if (t.znak) Album.dodaj(t.id); }
          }
          for (const s of swiaty.slice(1, nr + 1)) dopisz(WIDZIANE, `brama_${s.id}`);
          dzwiekMenu("right"); this.menu();
          return;
        }
        if (bufor.endsWith("math")) {
          bufor = "";
          const byId = Object.fromEntries(this.index.lessons.map((l) => [l.id, l]));
          const id = (this.index.topics || []).flatMap((t) => t.lessons).find((i) => byId[i] && !byId[i].wkrotce && !Album.ma(i));
          if (id) { Album.dodaj(id); dzwiekMenu("right"); this.menu(); }
          return;
        }
        if (!bufor.endsWith("metanoia")) return;
        bufor = "";
        for (const l of this.index.lessons) if (!l.wkrotce) Album.dodaj(l.id);
        for (const t of this.index.topics || []) { dopisz(OTWARTE, t.id); dopisz(WIDZIANE, t.id); dopisz(UKONCZONE, t.id); if (t.znak) Album.dodaj(t.id); }
        dzwiekMenu("right"); this.menu();
      });
    }
    const menu = $("#menu"); menu.style.display = "flex"; $("#hud").style.display = "none";
    if (!zmiana) { menu.classList.remove("in"); setTimeout(() => { menu.classList.add("in"); $("#iris").style.display = "none"; }, 20); }
    $("#title .napis").textContent = this.t("menu.title");
    $("#title .szyld").src = v(`/game/assets/menu/szyld_${this.lang}.webp`); $("#title .szyld").alt = this.t("menu.title");
    $("#langs").innerHTML = LANGS.map((l) => `<button data-lang="${l}" class="${l === this.lang ? "on" : ""}">${l.toUpperCase()}</button>`).join("")
      + `<button class="pelny" aria-label="fullscreen"><svg viewBox="0 0 24 24" fill="none" stroke="#5a3518" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6"/></svg></button>`;
    $("#langs").onclick = (e) => { if (e.target.closest(".pelny")) return pelnyEkran(); const l = e.target.dataset.lang; if (l) location.search = `?lang=${l}`; };
    // lessons grouped into topics (index.json "topics"; a lesson in no topic goes to a last, untitled row);
    // numbers restart in every topic, the topic's colour marks its cards
    const byId = Object.fromEntries(this.index.lessons.map((l) => [l.id, l]));
    const wszystkie = (this.index.topics || []).map((t) => ({ ...t, lessons: t.lessons.filter((id) => byId[id]) })).filter((t) => t.lessons.length);
    const rest = this.index.lessons.map((l) => l.id).filter((id) => !wszystkie.some((t) => t.lessons.includes(id)));
    if (rest.length) wszystkie.push({ id: "inne", title: null, color: "#ffb347", lessons: rest });
    // one chain over every stage of every world: a stage opens when the one before is open AND finished; a stage of
    // placeholders only is never finished (else the empty stages would open one after another)
    const skonczony = (t) => t.lessons.some((id) => !byId[id].wkrotce) && t.lessons.filter((id) => !byId[id].wkrotce).every((id) => Album.ma(id));
    const otwartyId = {};
    wszystkie.forEach((t, i) => { otwartyId[t.id] = i === 0 || PARAMS.has("wszystko") || lista(OTWARTE).includes(t.id) || (otwartyId[wszystkie[i - 1].id] && skonczony(wszystkie[i - 1])); });
    // the worlds (index.json "swiaty"): the menu shows one world's stages, its scenery, its music
    const swiaty = this.index.swiaty?.length ? this.index.swiaty : [{ id: "swiat1", etapy: wszystkie.map((t) => t.id), tlo: "tlo", muzyka: "menu" }];
    const swiatEtapu = (tid) => swiaty.find((s) => s.etapy.includes(tid)) || swiaty[swiaty.length - 1];
    const otwartySwiat = (s) => s.etapy.some((tid) => otwartyId[tid]);
    let swiat = swiaty.find((s) => s.id === (this.swiat || (() => { try { return localStorage.getItem(SWIAT); } catch { return null; } })()));
    if (!swiat || !otwartySwiat(swiat)) swiat = swiaty[0];
    this.swiat = swiat.id;
    const nrSwiata = swiaty.indexOf(swiat);
    menu.style.backgroundImage = `url(${v(`/game/assets/menu/${swiat.tlo || "tlo"}.webp`)})`;
    menuMuzyka.graj(swiat.muzyka || "menu");
    for (const d of deska(swiat.id).split(";")) { const i = d.indexOf(":"); document.documentElement.style.setProperty(d.slice(0, i), d.slice(i + 1)); }
    const topics = wszystkie.filter((t) => swiatEtapu(t.id) === swiat);
    const stojak = (n) => (nrSwiata ? `${n}_${swiat.id}` : n);        // the signposts and gates of this land (make_menu STOJAKI)
    document.documentElement.style.setProperty("--guzik", `url(${v(`/game/assets/menu/${stojak("guzik")}.webp`)})`);   // the round buttons
    // the album, its own in every world (album.js): its button shows how many stickers wait to be stuck in
    const ab = $("#albumBtn"), ids = this.albumIds = new Set(topics.flatMap((t) => [t.id, ...t.lessons])), ile = Album.nieprzyklejone(ids);
    ab.querySelector(".ksiega").src = Album.okladka(swiat.id); ab.querySelector(".pniak").src = v(`/game/assets/menu/${stojak("pniak")}.webp`); ab.querySelector(".ile").textContent = ile || ""; ab.classList.toggle("nowe", ile > 0);
    ab.onclick = async () => {
      const lekcje = await Promise.all(this.index.lessons.filter((l) => !l.wkrotce && ids.has(l.id)).map(async (l) => ({ id: l.id, naklejka: (await fetch(v(`/game/lessons/${l.id}/lesson.json`), { cache: "no-store" }).then((r) => r.json()).catch(() => ({}))).naklejka })));
      for (const t of topics) if (t.znak) lekcje.push({ id: t.id, naklejka: { obraz: `objects/${t.znak}`, kto: "lisek" } });   // a stage's own sticker
      menuMuzyka.przycisz(0.35);
      await Album.otworz({ lekcje, swiat: swiat.id, lang: this.lang, speech: this.speech, onZamknij: () => { menuMuzyka.przycisz(1); const k = Album.nieprzyklejone(ids); ab.querySelector(".ile").textContent = k || ""; ab.classList.toggle("nowe", k > 0); } });
    };
    // the world switcher: a badge per world; an open one takes you there, a locked one shakes
    // the world switcher: every land's painted picture over a plank with its name (for a parent - a child cannot read);
    // a tap lifts the picture - an open land then takes you there, a locked one shows its padlock and shakes
    $("#swiaty").innerHTML = swiaty.length < 2 ? "" : swiaty.map((s) => `<button data-swiat="${s.id}" class="${s === swiat ? "on" : ""}${otwartySwiat(s) ? "" : " zamkniety"}">
      <img class="odznaka" src="${v(`/game/assets/menu/odznaka_${s.id}.webp`)}" alt="">${otwartySwiat(s) ? "" : `<img class="klodka" src="${v("/game/assets/menu/klodka.webp")}" alt="">`}
      <span style="${deska(s.id)}">${s.title?.[this.lang] || s.title?.en || ""}</span></button>`).join("");
    menu.classList.toggle("ze-swiatami", swiaty.length > 1);
    $("#swiaty").onclick = (e) => {
      const b = e.target.closest("button"); if (!b || b.classList.contains("wysun")) return;
      const s = swiaty.find((q) => q.id === b.dataset.swiat);
      b.classList.add("wysun"); dzwiekMenu("pop"); this.speech.stop?.(); this.mowMenu(`line.swiat_${s.id}`);   // the land's name, read out
      if (!otwartySwiat(s)) {
        setTimeout(() => { b.classList.remove("trzesie"); void b.offsetWidth; b.classList.add("trzesie"); dzwiekMenu("wrong"); }, 500);
        setTimeout(() => b.classList.remove("wysun", "trzesie"), 1700);
        return;
      }
      setTimeout(() => { if (s !== swiat) this.przejdzSwiat(s.id); else b.classList.remove("wysun"); }, 900);
    };
    // a lesson not made yet (index.json "wkrotce"): its place in the stage, a waiting easel for a cover, not playable.
    // The stages mix subjects in the order they are taught; a lesson's subject (index.json "tematy") colours its
    // number and names itself on a small badge, so a parent sees what it is about
    const tematy = this.index.tematy || {};
    const card = (l, i, color) => {
      const tm = tematy[l.temat], kol = tm?.color || color;
      return `
      <button class="lesson${l.wkrotce ? " wkrotce" : ""}" data-id="${l.id}">
        <img class="cover" src="${v(l.wkrotce ? "/game/assets/menu/wkrotce.webp" : `/game/lessons/${l.id}/cover.webp`)}" alt="" onerror="this.style.visibility='hidden'">
        <span class="nr" style="background:${kol}">${i + 1}</span>
        ${tm ? `<span class="temat" style="background:${kol}">${tm.title[this.lang] || tm.title.en}</span>` : ""}
        <span class="name">${l.title[this.lang] || l.title.en}</span>
        <span class="sub">${l.wkrotce ? this.t("menu.wkrotce") : l.subtitle?.[this.lang] || ""}</span>
      </button>`;
    };
    // one long strip, a tinted block per topic; chips under it jump to a topic and show where the strip is
    const pas = $("#lessons"), chips = $("#chips");
    // between two topics a signpost: the way goes on to a new topic
    // the tape on the cards is green: turned around the colour wheel to the stage's own colour
    const odcien = (hex) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      const h = !d ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return Math.round(h * 60 - 105);
    };
    const otwarty = topics.map((t) => otwartyId[t.id]);              // the chain over all the worlds (above)
    const nastepny = swiaty[nrSwiata + 1] || null;
    // at the end of a world's strip, the gate to the next world: through it the next land is seen, in colour - an
    // invitation (a padlock hangs on it until it opens)
    const brama = nastepny ? `<div class="drogowskaz"><img src="${v(`/game/assets/menu/${stojak("drogowskaz")}.webp`)}" alt=""></div>
      <div class="brama${otwartySwiat(nastepny) ? "" : " zamknieta"}" data-swiat="${nastepny.id}"><span class="rama"><span class="widok" style="background-image:url(${v(`/game/assets/menu/${nastepny.tlo}.webp`)})"></span><img class="slupy" src="${v(`/game/assets/menu/${stojak("brama")}.webp`)}" alt=""></span>
        <div class="dokad" style="${deska(nastepny.id)}"><img src="${v(`/game/assets/menu/odznaka_${nastepny.id}.webp`)}" alt="">${nastepny.title?.[this.lang] || nastepny.title?.en || ""}</div>
        ${otwartySwiat(nastepny) ? "" : `<img class="klodka" src="${v("/game/assets/menu/klodka.webp")}" alt="">`}</div>` : "";
    // at the START of a world's strip (not the first world), the gate back: mirrored, its arrow pointing back, the land it
    // returns to seen through it - the child sees it is the way home
    const poprzedni = swiaty[nrSwiata - 1] || null;
    const powrot = poprzedni ? `<div class="brama wstecz" data-swiat="${poprzedni.id}"><span class="rama"><span class="widok" style="background-image:url(${v(`/game/assets/menu/${poprzedni.tlo}.webp`)})"></span><img class="slupy" src="${v(`/game/assets/menu/${stojak("brama")}.webp`)}" alt=""></span>
        <div class="dokad" style="${deska(poprzedni.id)}"><img src="${v(`/game/assets/menu/odznaka_${poprzedni.id}.webp`)}" alt="">${poprzedni.title?.[this.lang] || poprzedni.title?.en || ""}</div></div>
      <div class="drogowskaz wstecz"><img src="${v(`/game/assets/menu/${stojak("drogowskaz")}.webp`)}" alt=""></div>` : "";
    pas.innerHTML = powrot + topics.map((t, i) => (i ? `<div class="drogowskaz"><img src="${v(`/game/assets/menu/${stojak("drogowskaz")}.webp`)}" alt=""></div>` : "") + `
      <section class="topic${otwarty[i] ? "" : " zamkniety"}${t.znak ? " ze-znakiem" : ""}" data-topic="${t.id}" style="--c:${t.color};--odcien:${odcien(t.color)}deg">
        ${t.title ? `<h2>${t.znak ? `<img class="znak" src="${v(`/game/assets/objects/${t.znak}.webp`)}" alt="">` : ""}${t.title[this.lang] || t.title.en}</h2>` : ""}
        <div class="row">${t.lessons.map((id, i) => card(byId[id], i, t.color)).join("")}</div>
        ${i || nrSwiata ? `<img class="klodka" src="${v("/game/assets/menu/klodka.webp")}" alt="">` : ""}
      </section>`).join("") + brama;
    chips.innerHTML = ""; chips.style.display = "none";            // no row of topic chips: the planks over the cards and the signposts say where you are
    const bloki = [...pas.querySelectorAll(".topic")];
    const naBlok = (sec) => pas.scrollTo({ left: sec.offsetLeft - parseFloat(getComputedStyle(pas).paddingLeft), behavior: "smooth" });
    // the world map: this world's stages as stops on a painted path, Fox on the furthest open one; a stop scrolls here
    $("#mapaBtn img").src = v("/game/assets/mapa/ikona.webp");
    $("#mapaBtn").onclick = () => {
      dzwiekMenu("pop");
      Mapa.otworz({ swiat: swiat.id, dzwiek: dzwiekMenu, zrodlo: $("#mapaBtn").getBoundingClientRect(), mow: (key) => this.mowMenu(key), onWybierz: (tid) => { const sec = bloki.find((b) => b.dataset.topic === tid); if (sec) naBlok(sec); },
        etapy: topics.map((t, i) => ({ id: t.id, nr: (t.title?.pl || "").match(/\d+/)?.[0] || i + 1, kolor: t.color, znak: t.znak, otwarty: !!otwarty[i], skonczony: skonczony(t) })) });
    };
    const odswiez = () => {
      const x = pas.scrollLeft, max = pas.scrollWidth - pas.clientWidth;
      pas.style.setProperty("--fade-l", x > 4 ? "40px" : "0px"); pas.style.setProperty("--fade-r", x < max - 4 ? "40px" : "0px");   // more this way
      const srodek = x + pas.clientWidth * 0.35;
      let akt = bloki[0]; for (const b of bloki) if (b.offsetLeft <= srodek) akt = b;
      if (x >= max - 4) akt = bloki[bloki.length - 1];
      chips.querySelectorAll("button").forEach((c) => c.classList.toggle("on", c.dataset.topic === akt?.dataset.topic));
      this.menuX = x; try { localStorage.setItem(`${PRZEWINIECIE}.${swiat.id}`, String(Math.round(x))); } catch { /* private mode */ }   // per world
    };
    pas.onscroll = odswiez;
    // a card carries the sticker still to be won from its lesson; once it is in the album the card has none
    for (const b of pas.querySelectorAll(".lesson:not(.wkrotce)"))
      fetch(v(`/game/lessons/${b.dataset.id}/lesson.json`), { cache: "no-store" }).then((r) => r.json()).then((m) => {
        if (!m.naklejka || b.querySelector(".nakl-karty")) return;
        const url = v(`/game/assets/${m.naklejka.obraz}.webp`);
        if (!Album.ma(b.dataset.id)) b.insertAdjacentHTML("beforeend", `<span class="nakl-karty"><img class="wycinek" src="${url}" alt=""></span>`);
      }).catch(() => {});
    chips.onclick = (e) => { const c = e.target.closest("button"); if (c) naBlok(bloki.find((b) => b.dataset.topic === c.dataset.topic)); };
    // a mouse wheel turns into sideways scroll; a mouse drag scrolls the strip (a finger does it natively)
    pas.onwheel = (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { pas.scrollLeft += e.deltaY; e.preventDefault(); } };
    let ciag = null;
    pas.onpointerdown = (e) => { if (e.pointerType !== "mouse" || e.button !== 0) return; ciag = { x: e.clientX, l: pas.scrollLeft, ruch: false }; };
    pas.onpointermove = (e) => {
      if (!ciag) return; const dx = e.clientX - ciag.x;
      if (!ciag.ruch && Math.abs(dx) > 8) { ciag.ruch = true; pas.classList.add("drag"); try { pas.setPointerCapture(e.pointerId); } catch {} }
      if (ciag.ruch) pas.scrollLeft = ciag.l - dx;
    };
    pas.onpointerup = pas.onpointercancel = () => { if (ciag?.ruch) { pas.classList.remove("drag"); pas.dataset.przeciagniete = "1"; setTimeout(() => delete pas.dataset.przeciagniete, 0); } ciag = null; };
    // Fox speaks in the menu (game/menu, tools/menu/make_menu_lines.py): his head badge peeks in beside the padlock
    // while he says it - never a voice from nowhere; the music steps back meanwhile
    const powiedz = async (sec, key) => {
      await this.liniaMenu(key);
      const l = this.menuLinie.t[key]; if (!l) return;
      pas.querySelectorAll(".glowa-mowi").forEach((g) => g.remove());
      const g = document.createElement("img"); g.className = "glowa-mowi"; g.src = v("/game/assets/menu/lisek_glowa.webp"); g.alt = ""; sec.appendChild(g);
      menuMuzyka.przycisz(0.35);
      try { await this.speech.say({ lang: this.lang, lessonId: "menu", key, text: l.text, who: "lisek", puppet: null }); } catch { /* a line must never break the menu */ }
      finally { menuMuzyka.przycisz(1); g.classList.add("chowa"); setTimeout(() => g.remove(), 400); }
    };
    // the padlock opens: the mist clears from the cards, the shackle lifts, the padlock falls away
    const otworz = (sec, { mow = true } = {}) => {
      dopisz(WIDZIANE, sec.dataset.topic);
      const k = sec.querySelector(".klodka"); dzwiekMenu("right");
      if (k) { k.src = v("/game/assets/menu/klodka_otwarta.webp"); setTimeout(() => k.classList.add("spada"), 500); setTimeout(() => k.remove(), 1200); }
      sec.classList.remove("zamkniety");
      if (mow) setTimeout(() => powiedz(sec, `line.otwarte_${sec.dataset.topic}`), 900);
    };
    pas.onclick = (e) => {
      if (pas.dataset.przeciagniete) return;
      const br = e.target.closest(".brama");                              // the gate to the next world
      if (br) {
        this.speech.stop?.();
        if (br.classList.contains("zamknieta")) {                          // shut: Fox says which land waits there and what opens it
          br.classList.remove("trzesie"); void br.offsetWidth; br.classList.add("trzesie"); dzwiekMenu("wrong");
          powiedz(br, `line.brama_zamknieta_${br.dataset.swiat}`);
        } else { this.przejdzSwiat(br.dataset.swiat); this.mowMenu(`line.swiat_${br.dataset.swiat}`); }
        return;
      }
      const zam = e.target.closest(".topic.zamkniety");
      if (zam) { zam.classList.remove("trzesie"); void zam.offsetWidth; zam.classList.add("trzesie"); dzwiekMenu("wrong"); powiedz(zam, `line.zamkniete_${zam.dataset.topic}`); return; }   // not yet: the topic shakes, Fox says what to finish first
      const b = e.target.closest(".lesson"); if (!b) return;
      if (b.classList.contains("wkrotce")) { b.classList.remove("trzesie"); void b.offsetWidth; b.classList.add("trzesie"); return; }   // not made yet
      this.start(b.dataset.id);
    };
    for (const k of pas.querySelectorAll(".topic.zamkniety .klodka")) {
      let t = null; const pusc = () => { clearTimeout(t); k.classList.remove("trzyma"); };
      k.onpointerdown = (e) => { e.stopPropagation(); k.classList.add("trzyma"); t = setTimeout(() => { pusc(); const sec = k.closest(".topic"); dopisz(OTWARTE, sec.dataset.topic); otworz(sec, { mow: false }); }, 3000); };
      k.onpointerup = k.onpointerleave = k.onpointercancel = pusc;
    }
    // back from a lesson, or a new visit: where the child was (localStorage); set again while the cards still lay out -
    // set once at once, the strip was not wide yet and the browser clamped it to the start
    const cel = this.menuX ?? (() => { try { return +localStorage.getItem(`${PRZEWINIECIE}.${swiat.id}`) || 0; } catch { return 0; } })();
    let sam = false; for (const ev of ["pointerdown", "wheel", "touchstart"]) pas.addEventListener(ev, () => { sam = true; }, { once: true, passive: true });
    const ustaw = () => { if (!sam && Math.abs(pas.scrollLeft - cel) > 2 && pas.scrollWidth - pas.clientWidth >= cel - 2) pas.scrollLeft = cel; };   // never against a finger
    pas.scrollLeft = cel; odswiez();
    for (const ms of [50, 200, 600, 1500]) setTimeout(ustaw, ms);
    // a topic open for the first time (not the first one, not ?wszystko): the strip goes there and it unlocks
    const nowy = bloki.find((b, i) => (i > 0 || nrSwiata > 0) && otwarty[i] && !PARAMS.has("wszystko") && !lista(WIDZIANE).includes(b.dataset.topic));
    // a stage newly open in ANOTHER world (the last stage of this one was just finished): the menu goes there to open it
    const gdzieIndziej = wszystkie.find((t, i) => i > 0 && otwartyId[t.id] && !PARAMS.has("wszystko") && !lista(WIDZIANE).includes(t.id) && swiatEtapu(t.id) !== swiat);
    if (nowy) { nowy.classList.add("zamkniety"); if (!nowy.querySelector(".klodka")) nowy.insertAdjacentHTML("beforeend", `<img class="klodka" src="${v("/game/assets/menu/klodka.webp")}" alt="">`); }
    // a stage opened by finishing the one before: celebrated - the padlock comes to the middle, a key turns in it,
    // the shackle springs with sparks, the padlock falls away, the mist blows off, the cards pop in, confetti, Fox
    // `brama`: the gate to the next land, bigger; after the padlock it takes its colours, the land in it glows, Fox
    // cheers, the gate comes close as if we walked through it, and the new land opens
    const swietujOtwarcie = async (sec, { brama = false } = {}) => {
      const k = sec.querySelector(".klodka");
      if (brama && (!k || PARAMS.has("szybko"))) { this.przejdzSwiat(sec.dataset.swiat); return; }
      if (!k || PARAMS.has("szybko")) { otworz(sec); return; }
      dopisz(WIDZIANE, brama ? `brama_${sec.dataset.swiat}` : sec.dataset.topic);
      const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
      const r = k.getBoundingClientRect(), dlon = Math.min(innerHeight * 0.4, innerWidth * 0.34) * (brama ? 1.2 : 1);
      // in the keyhole the key is seen from its handle (tools/menu/make_klucz_przod.py): a key in a lock facing us turns
      // round the axis pointing at us, so its turn is a plain rotation of that picture
      new Image().src = v("/game/assets/menu/klucz_przod.webp");
      const konfetti = Array.from({ length: 30 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:hsl(${(i * 47) % 360} 80% 60%);animation-delay:${0.4 + (i % 9) * 0.1}s;animation-duration:${2 + (i % 5) * 0.3}s"></i>`).join("");
      const el = document.createElement("div"); el.id = "otwarcie";
      el.innerHTML = `<img class="kl" src="${v("/game/assets/menu/klodka.webp")}" alt=""><img class="klucz" src="${v("/game/assets/menu/klucz.webp")}" alt=""><img class="przod" src="${v("/game/assets/menu/klucz_przod.webp")}" alt=""><div class="iskry">${Array.from({ length: 12 }, (_, i) => `<b style="--a:${i * 30}deg"></b>`).join("")}</div><div class="konf">${konfetti}</div>`;
      document.body.appendChild(el);
      let pominiete = false; el.onclick = () => { pominiete = true; };
      const kl = el.querySelector(".kl"), klucz = el.querySelector(".klucz");
      kl.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:${r.width}px`;
      k.style.visibility = "hidden";
      await czekaj(40);
      el.classList.add("ciemno");
      kl.style.cssText = `left:50%;top:46%;width:${dlon}px;transition:left .8s cubic-bezier(.3,1.3,.5,1),top .8s cubic-bezier(.3,1.3,.5,1),width .8s cubic-bezier(.3,1.3,.5,1)`;
      await czekaj(pominiete ? 0 : 850);
      // the key flies in from the left, spinning, its bit into the keyhole (a little below the body's middle)
      klucz.style.width = `${dlon * 0.7}px`; klucz.style.setProperty("--x", `calc(50% - ${dlon * 0.31}px)`); klucz.style.setProperty("--y", `calc(46% + ${dlon * 0.23}px)`);   // its bit in the keyhole (69% down the padlock)
      klucz.classList.add("leci"); dzwiekMenu("whoosh");
      await czekaj(pominiete ? 0 : 900);
      const przod = el.querySelector(".przod"); przod.style.width = `${dlon * 0.34}px`; przod.style.top = `calc(46% + ${dlon * 0.23}px)`;
      klucz.classList.add("wsuwa"); przod.classList.add("jest");                    // pushed in: now seen from its handle
      await czekaj(pominiete ? 0 : 300);
      przod.classList.add("obrot"); dzwiekMenu("zamek");                           // a quarter turn, clicking
      await czekaj(pominiete ? 0 : 600);
      kl.classList.add("drga");
      await czekaj(pominiete ? 0 : 350);
      kl.classList.remove("drga"); kl.src = v("/game/assets/menu/klodka_otwarta.webp"); el.classList.add("iskrzy"); dzwiekMenu("iskry");
      await czekaj(pominiete ? 0 : 750);
      kl.classList.add("spada"); przod.classList.add("spada"); dzwiekMenu("whoosh");   // nothing just vanishes: they fall out of the frame
      await czekaj(pominiete ? 0 : 450);
      el.classList.remove("ciemno"); el.classList.add("konfetti");
      if (brama) {
        k.remove(); sec.classList.remove("zamknieta"); sec.classList.add("swieci"); dzwiekMenu("iskry");
        await czekaj(600);
        await powiedz(sec, `line.brama_${sec.dataset.swiat}`);
        sec.classList.add("wejscie"); dzwiekMenu("mgla");                          // as if we walked through it
        await czekaj(800);
        el.remove(); await this.przejdzSwiat(sec.dataset.swiat);
        return;
      }
      k.remove(); sec.classList.add("rozwiej"); sec.classList.remove("zamkniety"); dzwiekMenu("mgla");
      const karty = [...sec.querySelectorAll(".lesson")];
      karty.forEach((b, i) => setTimeout(() => { b.classList.add("wyskok"); dzwiekMenu("pop"); setTimeout(() => b.classList.remove("wyskok"), 700); }, 350 + i * 180));
      await czekaj(500 + karty.length * 180);
      powiedz(sec, `line.otwarte_${sec.dataset.topic}`);
      await czekaj(2600);
      sec.classList.remove("rozwiej"); el.remove();
    };
    const odblokuj = () => {
      if (nowy) setTimeout(() => { naBlok(nowy); setTimeout(() => swietujOtwarcie(nowy), 900); }, 400);
      else if (gdzieIndziej) {
        // the gate at the end of this strip leads there and was never seen open: it is opened first, here
        const dokad = swiatEtapu(gdzieIndziej.id).id, br = pas.querySelector(`.brama:not(.wstecz)[data-swiat="${dokad}"]`);
        if (br && !lista(WIDZIANE).includes(`brama_${dokad}`) && !PARAMS.has("szybko")) {
          br.classList.add("zamknieta"); if (!br.querySelector(".klodka")) br.insertAdjacentHTML("beforeend", `<img class="klodka" src="${v("/game/assets/menu/klodka.webp")}" alt="">`);
          setTimeout(() => { naBlok(br); setTimeout(() => swietujOtwarcie(br, { brama: true }), 1100); }, 400);
        } else setTimeout(() => this.przejdzSwiat(dokad), 600);
      }
    };
    // a stage just finished (every lesson made so far has its sticker; once): its sign comes big to the middle with rays
    // and confetti, Fox cheers, the sign flies into the album as the stage's own sticker; then the next stage opens
    const swieto = topics.findIndex((t, i) => t.znak && otwarty[i] && !PARAMS.has("wszystko") && t.lessons.some((id) => !byId[id].wkrotce) && skonczony(t) && !lista(UKONCZONE).includes(t.id));
    if (swieto >= 0) setTimeout(() => this.swietoEtapu(topics[swieto], () => { dopisz(UKONCZONE, topics[swieto].id); odblokuj(); }), 700);
    else odblokuj();
    for (const b of bloki) if (!b.classList.contains("zamkniety") && b !== nowy) b.querySelector(".klodka")?.remove();
  }

  async swietoEtapu(t, gotowe) {
    const el = document.createElement("div"); el.id = "swieto";
    const konfetti = Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:hsl(${(i * 47) % 360} 80% 60%);animation-delay:${(i % 9) * 0.12}s;animation-duration:${2.2 + (i % 5) * 0.3}s"></i>`).join("");
    el.innerHTML = `<div class="promienie"></div><img class="znak" src="${v(`/game/assets/objects/${t.znak}.webp`)}" alt=""><img class="glowa" src="${v("/game/assets/menu/lisek_glowa.webp")}" alt="">${konfetti}`;
    document.body.appendChild(el); dzwiekMenu("plansza");
    // the sticker is a copy of the sign on the stage's plank: it grows out of it to the middle (the sign stays there),
    // so the child sees where it comes from; with the plank off screen it grows in the middle
    const z = el.querySelector(".znak"), zr = $(`.topic[data-topic="${t.id}"] h2 .znak`)?.getBoundingClientRect();
    const widac = zr && zr.width && zr.right > 0 && zr.left < innerWidth;
    const duzy = Math.min(innerHeight * 0.46, innerWidth * 0.6);
    z.style.cssText = widac ? `position:fixed;left:${zr.left + zr.width / 2}px;top:${zr.top + zr.height / 2}px;width:${zr.width}px;transform:translate(-50%,-50%);animation:none`
      : `position:fixed;left:50%;top:50%;width:${duzy * 0.1}px;transform:translate(-50%,-50%);animation:none`;
    void z.offsetWidth;
    z.style.transition = "left .9s cubic-bezier(.3,1.25,.5,1), top .9s cubic-bezier(.3,1.25,.5,1), width .9s cubic-bezier(.3,1.25,.5,1)";
    Object.assign(z.style, { left: "50%", top: "50%", width: `${duzy}px` });
    menuMuzyka.przycisz(0.35);
    this.menuLinie = this.menuLinie?.lang === this.lang ? this.menuLinie : { lang: this.lang, t: await fetch(v(`/game/menu/i18n/${this.lang}.json`), { cache: "no-store" }).then((r) => r.json()).catch(() => ({})) };
    const klucz = `line.etap_koniec_${t.id}`, l = this.menuLinie.t[klucz];
    await new Promise((r) => setTimeout(r, 600));
    if (l) await this.speech.say({ lang: this.lang, lessonId: "menu", key: klucz, text: l.text, who: "lisek", puppet: null }).catch(() => {});
    else await new Promise((r) => setTimeout(r, 1800));
    menuMuzyka.przycisz(1);
    // the sign flies into the album on the stump
    Album.dodaj(t.id);
    const ab = $("#albumBtn"), a = ab.getBoundingClientRect();
    z.style.transition = "left .9s cubic-bezier(.5,-0.3,.6,1), top .9s cubic-bezier(.5,-0.3,.6,1), width .9s cubic-bezier(.5,-0.3,.6,1)"; el.classList.add("odlot");
    Object.assign(z.style, { left: `${a.left + a.width / 2}px`, top: `${a.top + a.height / 2}px`, width: `${duzy * 0.18}px` });
    await new Promise((r) => setTimeout(r, 950));
    const k = Album.nieprzyklejone(this.albumIds); ab.querySelector(".ile").textContent = k || ""; ab.classList.toggle("nowe", k > 0); dzwiekMenu("pop");
    el.remove(); gotowe();
  }

  // ------------------------------------------------------------------ lesson
  async start(id, fromStage = null) {
    menuMuzyka.stop();
    this.lessonId = id;
    const meta = this.index.lessons.find((l) => l.id === id);
    const mod = await import(v(`/game/lessons/${id}/lesson.js`));
    this.lesson = mod.default;
    this.strings = await loadStrings(`/game/lessons/${id}/i18n/${this.lang}.json`);
    this.zachety = this.zachety?.lang === this.lang ? this.zachety : { lang: this.lang, t: await loadStrings(`/game/zachety/i18n/${this.lang}.json`) };
    this.pochwaly = this.pochwaly?.lang === this.lang ? this.pochwaly : { lang: this.lang, t: await loadStrings(`/game/pochwaly/i18n/${this.lang}.json`).catch(() => ({})) };
    this.oddechy = this.oddechy?.lang === this.lang ? this.oddechy : { lang: this.lang, t: await loadStrings(`/game/oddechy/i18n/${this.lang}.json`).catch(() => ({})) };
    if (this.etapyLang !== this.lang) { this.etapy = await loadStrings(`/game/etapy/i18n/${this.lang}.json`).catch(() => ({})); this.etapyLang = this.lang; }
    this.tl = translator([this.strings, this.ui]);
    $("#menu").style.display = "none"; $("#hud").style.display = "flex";
    $("#hud .lesson-name").textContent = meta.title[this.lang] || meta.title.en;
    $("#hud .menu").onclick = () => this.leave();
    $("#hud .pauza").onclick = () => this.pauza(!this.wPauzie);
    $("#pauza button").onclick = () => this.pauza(false);
    $("#hud .dalej").onclick = () => this.dalej();
    $("#hud .pelny").onclick = () => pelnyEkran();
    $("#hud .gwiazdki").innerHTML = "";
    this.closeStage();
    const run = ++this.run;                             // every ctx call checks it: leaving the lesson stops the scene
    this.stage = new Stage($("#stage"), this.speech);
    // the loading screen: the characters, then everything the lesson will show, sent to the GPU - no loading
    // (and no stutter) once it runs
    const ekran = $("#wczytywanie"), pasek = $("#wczytywanie .pasek div");
    ekran.querySelector("img").src = v(`/game/lessons/${id}/cover.webp`); pasek.style.width = "0"; ekran.style.display = "flex";
    const postaci = Object.entries(this.lesson.characters || {});
    for (const [i, [name, o]] of postaci.entries()) { await this.stage.puppet(name, { x: o.x ?? (o.side === "right" ? 4.6 : -4.6), side: o.side, height: o.height }); pasek.style.width = `${(i + 1) / postaci.length * 30}%`; }
    try { await this.stage.prepare(await this.coWczytac(id), (p) => { pasek.style.width = `${30 + p * 70}%`; }); }
    catch (e) { console.warn("prepare:", e); }
    ekran.style.display = "none";
    if (run !== this.run) return;
    if (!fromStage) await this.plansza({ obraz: v(`/game/lessons/${id}/cover.webp`), napis: meta.title[this.lang] || meta.title.en, podnapis: meta.subtitle?.[this.lang], dzwiek: "plansza", menuLinia: `line.tytul_${id}` });
    this.abort = false;
    const order = fromStage && STAGES.includes(fromStage) ? STAGES.slice(STAGES.indexOf(fromStage)) : STAGES;
    for (const st of order) {
      if (this.abort) return;
      await this.runStage(st);
      if (this.abort) return;
    }
    if (!this.abort && this.run === run) await this.wreczNaklejke(run);
    if (!this.abort && this.run === run) { await this.outro(); if (NAGRAJ) this.scenariuszKoniec = true; if (this.run === run) this.menu(); }
  }

  // what a lesson shows: its sceneries (stages + lesson.json), stickers (lesson.json "objects") and the garments
  // its code names
  // the end of a lesson: one of its characters thanks the child and gives the lesson's sticker for the album
  async wreczNaklejke(run) {
    const n = this.metaLekcji?.naklejka; if (!n || this.run !== run) return;
    const c = this.context("apply", run, ++this.scenaNr);
    try {
      const L = this.stage.puppets[n.kto]; if (L && !L.korzen.visible) c.show(n.kto);
      c.clear(); await c.ujecie("ogolny", { ciecie: true });
      if (Album.ma(this.lessonId)) { await c.say(n.kto, "line.naklejka_juz", { anim: "Machanie" }); return; }   // a second time: no second sticker
      const wziete = Album.wrecz(this.lessonId, n, { szybko: FAST });
      await c.say(n.kto, "line.naklejka_daj", { anim: "Radosc" });
      await wziete; this.stage.sfx.graj("idea");
    } catch (e) { if (e?.message !== "abort") console.warn("naklejka:", e); }
  }

  // a card for about two seconds (a tap skips it): the lesson's start (cover + name) or a stage (icon + name),
  // the lesson's characters peeking in from the sides
  async plansza({ obraz, ikona = false, napis, podnapis = null, dzwiek = "etap", linia = null, menuLinia = null }) {
    const el = $("#plansza"), glowy = Object.keys(this.lesson.characters || {}).map((n) => E.glowaObraz(n)).filter(Boolean).slice(0, 2);
    el.innerHTML = `<div class="karta"><img class="obraz ${ikona ? "ikona" : ""}" src="${obraz}" alt=""><div class="napis"></div>${podnapis ? '<div class="podnapis"></div>' : ""}`
      + glowy.map((g, i) => `<img class="glowa ${i ? "p" : "l"}" src="${g.toDataURL()}" alt="">`).join("") + "</div>";
    el.querySelector(".napis").textContent = napis;
    if (podnapis) el.querySelector(".podnapis").textContent = podnapis;
    el.className = "on"; this.stage?.sfx.graj(dzwiek);
    // the narrator says the stage's name ("here comes the story!", game/etapy): the card stays until both are done
    const tekst = linia && this.etapy?.[linia];
    let mowa = tekst && !FAST ? this.speech.say({ lang: this.lang, lessonId: "etapy", key: linia, text: tekst.text, who: "narrator" }).catch(() => {}) : null;
    const tytul = menuLinia && !FAST ? await this.liniaMenu(menuLinia) : null;   // a lesson's card: its name read out
    if (tytul) mowa = this.speech.say({ lang: this.lang, lessonId: "menu", key: menuLinia, text: tytul.text, who: "narrator" }).catch(() => {});
    await new Promise((ok) => { const t = setTimeout(ok, FAST ? 150 : 2100); el.onclick = () => { clearTimeout(t); this.speech.stop?.(); ok(); }; });
    if (mowa) await Promise.race([mowa, new Promise((ok) => setTimeout(ok, 5500))]);   // the name and the subtitle read out
    el.className = "on out"; await new Promise((ok) => setTimeout(ok, FAST ? 30 : 330)); el.className = ""; el.innerHTML = "";
  }

  async coWczytac(id) {
    const meta = await fetch(v(`/game/lessons/${id}/lesson.json`), { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    this.metaLekcji = meta;
    const zrodlo = await fetch(v(`/game/lessons/${id}/lesson.js`), { cache: "no-store" }).then((r) => (r.ok ? r.text() : "")).catch(() => "");
    const tla = new Set([...Object.values(this.lesson.backgrounds || {}).filter((b) => typeof b === "string"), ...(meta.backgrounds || [])]);
    const G = await U.galeria(), slowa = new Set(zrodlo.match(/[a-z_0-9]+/g) || []);
    return { tla: [...tla], obiekty: meta.objects || [], ubrania: Object.keys(G).filter((n) => slowa.has(n)) };
  }

  async runStage(st) {
    const scenes = this.lesson.stages[st] || [];
    if (st === "practice") this.stage.muzyka.miejsce({});                  // the practice theme; the story and home stages take the place's
    const IKONA = { story: "ikona_opowiesc", practice: "ikona_cwiczenia", apply: "ikona_dom" };
    if (scenes.length) await this.plansza({ obraz: v(`/game/assets/objects/${IKONA[st]}.webp`), ikona: true, napis: this.t(`stage.${st}`), linia: `line.etap_${st}` });
    if (this.abort) return;
    for (const el of document.querySelectorAll("#hud .phase")) {           // the phase strip: done / current / ahead
      const i = STAGES.indexOf(el.dataset.stage), j = STAGES.indexOf(st);
      el.className = "phase " + (i < j ? "done" : i === j ? "current" : "ahead") + (DEBUG ? " debug" : "");
      el.title = this.t(`stage.${el.dataset.stage}`);
      if (DEBUG) el.onclick = () => { const q = new URLSearchParams(location.search); q.set("lekcja", this.lessonId); q.set("etap", el.dataset.stage); location.search = q.toString(); };
    }
    const bg = (this.lesson.backgrounds || {})[st];
    $("#hud .gwiazdki").innerHTML = ""; this.gwiazdki = null; this.seria = 0;     // a progress bar belongs to one stage
    if (bg && this.stage.bgName !== tloId(bg)) {          // a new scenery: dip to dark (or a transition) instead of a bare frame
      const zmien = async () => { this.stage.clear(); for (const L of Object.values(this.stage.puppets)) L.korzen.visible = false; await this.stage.background(bg); this.stage.bgName = tloId(bg); };
      if (this.lesson.przejscia) await E.przejscie(this.stage, zmien, {});
      else { await this.fade(true); await zmien(); await this.fade(false); }
    } else this.stage.clear();
    let scenaW = 0;
    for (const scene of scenes) {
      this.scenaW = scenaW++;
      if (this.abort) return;
      // every scene gets its own context: "next" (dalej) retires it, so whatever it still awaits throws and dies
      const nr = ++this.scenaNr, ctx = this.context(st, this.run, nr);
      const pominieto = new Promise((ok) => { this.pomin = () => ok("pomin"); });
      try {
        const p = Promise.resolve(scene(ctx)).then(() => "ok");
        p.catch(() => {});
        if (await Promise.race([p, pominieto]) === "pomin") { this.posprzataj(); continue; }
      }
      catch (e) {
        if (e && e.message === "abort") return;        // the child left the lesson
        console.error(`lesson ${this.lessonId} / ${st}:`, e); await this.card(`Błąd sceny (${st}): ${e.message || e}`, this.t("button.menu")); this.abort = true; this.menu(); return;
      }
    }
  }

  leave() {
    this.pauza(false);
    this.abort = true; this.run++;
    this.speech.stop(); this.stage?.cancelChoice();
    this.menu();
  }

  // the contract every scene gets; `run` is the lesson instance - once the player leaves,
  // every call throws "abort" so the scene cannot keep speaking or showing things
  // the HUD's pause: the picture, the tweens and the voice stand still until play
  pauza(tak) {
    this.wPauzie = !!tak;
    if (this.stage) this.stage.pauza = this.wPauzie;
    $("#pauza").style.display = this.wPauzie ? "flex" : "none";
    if (this.wPauzie) this.speech.pause(); else this.speech.resume();
  }
  // the HUD's "next": the scene being played ends here, the next one starts (for parents and for testing)
  dalej() { if (this.wPauzie) this.pauza(false); if (this.pomin) this.pomin(); }
  posprzataj() {
    const S = this.stage; if (!S) return;
    this.speech.stop(); S.cancelChoice(); S.endSort(); S.clear();
    E.ujecie(S, "ogolny", { ciecie: true });
  }

  context(st, run, nr = this.scenaNr) {
    const S = this.stage, lang = this.lang, lessonId = this.lessonId, strings = this.strings;
    const alive = () => { if (this.run !== run || this.scenaNr !== nr) throw new Error("abort"); };
    const guard = (f) => async (...a) => { alive(); const r = await f(...a); alive(); return r; };
    let last = null;                                   // the last line spoken; a task keeps the one said before it as its instruction
    // the instruction in force while an interaction runs: a tapped character repeats it (scene.js tapPuppet), one
    // repeat at a time; `wDzialaniu(p)` sets it for the life of promise p
    let polecenieTeraz = null, powtarza = false;
    S.onPuppetTap = async () => {
      if (!polecenieTeraz || powtarza || S.sfx.mowa || this.run !== run) return;   // never over a line being spoken
      powtarza = true;
      zrodloMowy = "powtorka";
      try { await say(polecenieTeraz.who, polecenieTeraz.key, { anim: polecenieTeraz.anim }); } catch {} finally { powtarza = false; zrodloMowy = "opowiesc"; }
    };
    // a right answer: confetti and a tick when the lesson wants them (nagrody), a star and the streak in practice
    const nagroda = (h, bezBledu = true) => {
      if (this.run !== run) return;
      if (this.lesson.nagrody) { E.konfetti(S, h); if (h) E.ptaszek(S, h); }
      if (this.gwiazdki) {
        if (this.gwiazdki.auto) this.gwiazdki.dodaj();
        this.seria = bezBledu ? (this.seria || 0) + 1 : 0;
        if (this.seria >= 2) pokazSerie(this.seria, S);
      }
    };
    // a child who waits gets encouraged: after a while with no touch the character who gave the instruction says a
    // few words (never praise - an invitation), each time other ones; the second time in a pointing task it points
    // to the answer ("hmm... maybe here?"). Dragging tasks get dragging words.
    const ZACH = { wskaz: ["line.z_sprobuj", "line.z_dasz_rade", "line.z_popatrz", "line.z_nie_bojsie"], przeciagnij: ["line.z_przeciagnij", "line.z_paluszek", "line.z_razem", "line.z_sprobuj"], dotknij: ["line.z_sprobuj", "line.z_razem", "line.z_nie_bojsie"] };
    const zachecaj = (rodzaj) => {
      let t = null, ile = 0, stop = false;
      const plan = () => { clearTimeout(t); if (!stop && !FAST) t = setTimeout(zachec, ile ? 13000 : 9000); };
      const zachec = async () => {
        if (stop || this.run !== run) return;
        if (S.sfx.mowa || powtarza) return plan();
        const tab = this.zachety?.t || {};
        const kto = polecenieTeraz?.who && S.puppets[polecenieTeraz.who]?.korzen.visible ? polecenieTeraz.who : Object.keys(S.puppets).find((n) => S.puppets[n].korzen.visible);
        if (!kto) return plan();
        ile++;
        const cel = rodzaj === "wskaz" && ile >= 2 ? S.zachetaCel : null;
        const pula = cel ? ["line.z_tutaj"] : ZACH[rodzaj].filter((k) => k !== this.ostatniaZacheta);
        const key = pula[Math.floor(Math.random() * pula.length)]; this.ostatniaZacheta = key;
        const L = S.puppets[kto], line = tab[key]; if (!line) return plan();
        if (cel) { cel.highlight?.(true); S.lookAt(kto, cel); L.graj("Wskazanie"); } else { L.patrz("przod"); L.graj("Mowienie", true); }
        S.sfx.mowa = true;
        try { await this.speech.say({ lang, lessonId: "zachety", key: kto === line.who ? key : `${key}.${kto}`, fallback: key, text: line.text, who: kto, puppet: L, volume: L.meta?.volume ?? 1 }); }
        catch { /* never break the task */ } finally { S.sfx.mowa = false; if (L.korzen.visible && !cel) L.spoczynek(); }
        plan();
      };
      const dotyk = () => plan();
      S.renderer.domElement.addEventListener("pointerdown", dotyk); plan();
      return () => { stop = true; clearTimeout(t); S.renderer.domElement.removeEventListener("pointerdown", dotyk); };
    };
    // done right, the scene holds: the last thing lands, everyone cheers, ~1.2 s before anything moves on (a cut or a
    // zoom straight away read to a child as "oops, I broke something")
    const swietuj = async () => {
      if (this.run !== run) return;
      for (const L of Object.values(S.puppets)) if (L.korzen.visible && L.korzen.parent) L.graj("Radosc");
      await S.wait(FAST ? 0.1 : 1.2);
    };
    const wDzialaniu = (p, rodzaj = "przeciagnij") => {
      const pol = last; polecenieTeraz = pol; const koniecZachet = zachecaj(rodzaj);
      const koniec = () => { koniecZachet(); if (polecenieTeraz === pol) polecenieTeraz = null; };
      Promise.resolve(p).then(koniec, koniec);
      if (!(p instanceof Promise)) return p;
      return Object.assign(p.then(async (r) => { await swietuj(); return r; }), p);   // keeps what was hung on p
    };
    wDzialaniu.dotknij = (p) => wDzialaniu(p, "dotknij");                 // counting by touch
    // a lesson's own dragging (S.free, not a ctx mechanic) gets the same rule: the last line is its instruction
    // until the drag ends - a tapped character repeated nothing there
    if (!S._freeBezPolecenia) {                                          // patched once; each run hooks its own closures
      const free0 = S.free.bind(S), end0 = S.endSort.bind(S);
      S.free = (set) => { free0(set); S._naFree?.(); };
      S.endSort = () => { end0(); S._wlasnyDrag?.(); S._wlasnyDrag = null; };
      S._freeBezPolecenia = true;
    }
    S._wlasnyDrag?.(); S._wlasnyDrag = null;
    S._naFree = () => {
      if (polecenieTeraz || !last || this.run !== run) return;
      const pol = last; polecenieTeraz = pol; const koniecZachet = zachecaj("przeciagnij");
      S._wlasnyDrag = () => { koniecZachet(); if (polecenieTeraz === pol) polecenieTeraz = null; };
    };
    // the recorder: what kind of line this is (the story, a wrong answer, a repeat on a tap)
    let zrodloMowy = "opowiesc";
    const zapisz = (ev) => {
      if (!this.scenariusz) this.scenariusz = [];
      let miniatura = null;
      try {
        S.rysuj ? S.rysuj() : S.renderer.render(S.scene, S.camera);
        const c = document.createElement("canvas"), src = S.renderer.domElement; c.width = 220; c.height = Math.round(220 * src.height / src.width);
        c.getContext("2d").drawImage(src, 0, 0, c.width, c.height); miniatura = c.toDataURL("image/jpeg", 0.6);
      } catch { /* no picture */ }
      this.scenariusz.push({ ...ev, etap: st, scena: this.scenaW ?? 0, t: performance.now() | 0, miniatura });
    };
    // praise ("brawo") and a gentle wrong line ("blad") from game/pochwaly: every character has every variant in its
    // own voice, drawn at random, never the same one twice in a row; a lesson's own line always wins over the pool
    const zPuli = async (rodzaj, kto = null) => {
      const tab = this.pochwaly?.t || {};
      const klucze = Object.keys(tab).filter((k) => k.startsWith(`line.${rodzaj}_`));
      const widoczny = (n) => n && S.puppets[n]?.korzen.visible;
      if (!widoczny(kto)) kto = [polecenieTeraz?.who, last?.who].find(widoczny) || Object.keys(S.puppets).find(widoczny);
      if (!klucze.length || !kto || (rodzaj === "blad" && S.sfx.mowa)) return;     // a quick second miss does not talk over the first
      this.ostatniaZPuli = this.ostatniaZPuli || {};
      const pula = klucze.filter((k) => k !== this.ostatniaZPuli[rodzaj]);
      const key = pula[Math.floor(Math.random() * pula.length)]; this.ostatniaZPuli[rodzaj] = key;
      const line = tab[key], L = S.puppets[kto], stem = kto === line.who ? key : `${key}.${kto}`;
      if (NAGRAJ) zapisz({ typ: "kwestia", who: kto, key, stem, text: line.text, anim: null, zrodlo: rodzaj === "brawo" ? "pochwala" : "blad" });
      if (rodzaj === "brawo") { await E.mowcaWKadrze(S, L); L.graj("Radosc"); } else { L.patrz("przod"); L.graj("Mowienie", true); }
      S.sfx.mowa = true;
      try { await this.speech.say({ lang, lessonId: "pochwaly", key: stem, fallback: key, text: line.text, who: kto, puppet: L, volume: L.meta?.volume ?? 1 }); }
      finally { S.sfx.mowa = false; }
      alive();
      if (L.korzen.visible) L.spoczynek();
    };
    const blad = (wrong) => (wrong ? say("narrator", wrong) : zPuli("blad"));
    // a breather's own line (game/oddechy, every voice): `ukryty` - a character hidden behind a bush calls out (the
    // peekaboo game is about the voice), otherwise the speaker is put in the shot as always
    const mowOddech = async (kto, key, { ukryty = false } = {}) => {
      if (!key.startsWith("line.")) key = `line.${key}`;
      const line = this.oddechy?.t?.[key], L = S.puppets[kto];
      if (!line || !L) return;
      const stem = kto === line.who ? key : `${key}.${kto}`;
      if (NAGRAJ) zapisz({ typ: "kwestia", who: kto, key, stem, text: line.text, anim: null, zrodlo: "oddech" });
      if (!ukryty) { await E.mowcaWKadrze(S, L); L.patrz("przod"); L.graj("Mowienie", true); }
      S.sfx.mowa = true;
      try { await this.speech.say({ lang, lessonId: "oddechy", key: stem, fallback: key, text: line.text, who: kto, puppet: L, volume: L.meta?.volume ?? 1 }); }
      finally { S.sfx.mowa = false; }
      alive();
      if (L.korzen.visible && !ukryty) L.spoczynek();
    };
    const say = async (who, key, { anim = null, onSlowo = null } = {}) => {
      alive();
      const line = lineOf([strings], key);
      if (!S.puppets[who]) who = line.who;                            // the scene picks the speaker; the line's `who` is the default
      // never a voice from off the stage: a hidden speaker hands the line to one on stage that has a recording of it
      if (S.puppets[who] && !S.puppets[who].korzen.visible) { const zast = [line.who, ...(line.speakers || [])].find((n) => S.puppets[n]?.korzen.visible); if (zast) who = zast; }
      const stem = who === line.who ? key : `${key}.${who}`;          // a recording exists per allowed speaker (i18n `speakers`)
      last = { who, key, anim }; this.lastSpeaker = who; S.ostatniMowca = who;
      if (NAGRAJ) zapisz({ typ: "kwestia", who, key, stem: who === line.who ? key : `${key}.${who}`, text: line.text, anim, zrodlo: zrodloMowy });
      const puppet = S.puppets[who] || null;
      await E.mowcaWKadrze(S, puppet);                                // never a voice from outside the shot
      if (puppet && puppet.korzen.visible && anim !== false) { puppet.patrz("przod"); puppet.graj(anim || "Mowienie", true); }
      S.sfx.mowa = true;                                              // effects duck under a line
      try { await this.speech.say({ lang, lessonId, key: stem, fallback: key, text: line.text, who, puppet, volume: puppet?.meta?.volume ?? 1, onSlowo }); }
      finally { S.sfx.mowa = false; }   // who speaks is shown by the mouth, no bubble
      alive();
      if (puppet && puppet.korzen.visible) puppet.spoczynek();
    };
    const ctx = {
      stage: S, lang, st, t: this.tl, fast: FAST,
      say,
      enter: guard((who, from) => S.enter(who, from || ((this.lesson.characters[who] || {}).side === "right" ? "right" : "left"))),
      show: (who) => { alive(); const L = S.puppets[who]; if (L) { L.korzen.visible = true; L.korzen.position.x = L.home; L.korzen.position.y = GROUND; L.korzen.scale.setScalar(1); L.podloga = null; L.patrz("przod"); L.spoczynek(); S.appear(L); } },
      play: guard((who, anim, opts) => S.play(who, anim, opts)),
      walkTo: guard((who, x) => S.walkTo(who, x)),
      // into the picture: [[x, y], ...] on the ground, higher = further (smaller); { skok } hops (stepping stones)
      przejdz: guard((who, punkty, opts) => S.przejdz(who, punkty, opts)),
      // travel inside a stage: dip to dark, new scenery, objects cleared; puppets stay at home
      // (visible as before) unless enter: true hides them so the scene can walk them in again
      // bg: a background name, or an insert on a plain colour {kolor, motyw, kolo}; przejscie: true (one at random),
      // a name (E.PRZEJSCIA) or false; the lesson's `przejscia: true` makes every change a transition
      go: guard(async (bg, { enter = false, przejscie = undefined, obszar = 0, ciecie = false } = {}) => {
        if (S.bgName === tloId(bg)) return;
        // the things leave before the place changes (only they: clear() would also pull the camera out in the old place)
        if (S.objects.length) { for (const o of S.objects.slice()) o.remove(); await S.zejscia(); }
        const zmien = async () => {
          S.clear(); E.ujecie(S, "ogolny", { ciecie: true });   // a new place: a cut
          for (const L of Object.values(S.puppets)) { if (enter) L.korzen.visible = false; else L.korzen.position.x = L.home; }
          await S.background(bg); S.bgName = tloId(bg);
          if (obszar) E.ustawObszar(S, obszar);
        };
        const p = przejscie ?? (this.lesson.przejscia && !ciecie ? true : false);
        if (ciecie) await zmien();                                    // a cut: inside one adventure
        else if (p) await E.przejscie(S, zmien, { rodzaj: typeof p === "string" ? p : null });
        else { await this.fade(true); await zmien(); await this.fade(false); }
      }),
      przejscie: guard((zmiana, rodzaj = null) => E.przejscie(S, async () => { alive(); await zmiana(); }, { rodzaj })),
      // film tools (efekty.js, guidelines "Atmosphere and editing")
      ujecie: guard((typ, opts) => E.ujecie(S, typ, opts)),
      // night and light (efekty.js): noc({ciemnosc}) darkens, swiatlo(cel, {r, moc, migotanie}) opens a light around it
      noc: guard((o) => E.noc(S, o)),
      swiatlo: (cel, o) => { alive(); return E.swiatlo(S, typeof cel === "string" ? S.puppets[cel] : cel, o); },
      // music for a game: plays until stopped (handle.stop()), quieter while someone speaks
      muzyka: (n, o) => { alive(); const m = S.sfx.muzyka(n, o); S.muzyka.cicho++; const st = m.stop; let raz = false; m.stop = (ms) => { if (!raz) { raz = true; S.muzyka.cicho--; } st(ms); }; return m; },   // a scene's own tune: the place's music gives way
      // the characters' head badges in one picture (a card that means "the friends"), a data: URL for object({obraz})
      glowy: (kto) => {
        const g = kto.map((n) => E.glowaObraz(n)).filter(Boolean), k = Math.ceil(Math.sqrt(g.length)), c = document.createElement("canvas");
        c.width = c.height = 512; const x = c.getContext("2d"), s = 512 / k;
        g.forEach((im, i) => x.drawImage(im, (i % k) * s, Math.floor(i / k) * s, s, s));
        return c.toDataURL();
      },
      // rhythm (rytm.js): a row plays itself up to the gap; a dance of moves on a beat; a stumble; statues
      // with `linia` the row is read aloud: `kto` says the line and each thing bumps as its name is said (h.slowo:
      // {pl: [...], en: [...]} or `slowo(h)`); without the words' times (no recording, ?szybko) the row runs by the clock
      rytm: guard(async (items, o = {}) => {
        if (!o.linia) return S.muzyka.ucisz(R.rytm(S, items, { ...o, tempo: FAST ? 0.15 : o.tempo }));
        const slowa = (h) => [].concat((o.slowo ? o.slowo(h) : h.slowo?.[lang] ?? h.slowo) || []).map((w) => String(w).toLowerCase());
        let i = 0;
        await say(o.kto, o.linia, { anim: o.anim, onSlowo: (w) => { const h = items[i]; if (h && slowa(h).includes(w)) { i++; R.stuk(S, h); } } });
        if (!i) await R.rytm(S, items, { tempo: FAST ? 0.15 : 0.5, bezDzwieku: true });
      }),
      taniec: guard((who, ruchy, o = {}) => S.muzyka.ucisz(R.taniec(S, who, ruchy, { ...o, tempo: FAST ? 0.25 : o.tempo }))),
      ruch: (who, nazwa, o = {}) => R.ruch(S, who, nazwa, o),
      potknij: guard((who) => R.potknij(S, who)),
      zamroz: (who, on = true) => R.zamroz(S, who, on),
      // mechanics (mechaniki.js): the child's interactions run under the instruction rule (wDzialaniu)
      slad: (co, o) => wDzialaniu(M.slad(S, co, o)),
      waga: guard(async (o) => { const w = await M.waga(S, o); const p0 = w.przeciagaj; w.przeciagaj = (q) => wDzialaniu(p0(q)); return w; }),
      os: guard((o) => M.os(S, o)),
      wieza: (o) => { const w = M.wieza(S, o); w.gotowe = wDzialaniu(w.gotowe); return w; },
      kubki: guard((o) => M.kubki(S, o)),
      kupka: guard((name, n, o) => M.kupka(S, name, n, o)),
      dzwieki: guard((n, o = {}) => S.muzyka.ucisz(M.dzwieki(S, n, { ...o, tempo: FAST ? 0.15 : o.tempo }))),   // counting by ear: the music falls silent
      podziel: (obraz, o) => wDzialaniu(M.podziel(S, obraz, o)),
      memory: (pary, o) => wDzialaniu(M2.memory(S, pary, o), "wskaz"),
      sklepik: (o) => wDzialaniu(M2.sklepik(S, o)),
      strzalki: (o) => wDzialaniu(M2.strzalki(S, o), "wskaz"),
      cien: (h, on, o) => M2.cien(S, h, on, o),
      odbicie: guard((who, o) => M2.odbicie(S, who, o)),
      polacz: (o) => wDzialaniu(M2.polacz(S, { ...o, onZle: () => blad(o.wrong) }), "wskaz"),
      roznice: (nazwa, o) => wDzialaniu(M2.roznice(S, nazwa, o), "wskaz"),
      kolorowanka: (nazwa, o) => wDzialaniu(M2.kolorowanka(S, nazwa, o), "wskaz"),
      // mechaniki3.js: a fence drawn around things, a pencil fence of given points, the lift
      zagroda: (o) => wDzialaniu(M3.zagroda(S, { ...o, onZle: () => blad(o.wrong), onOtwarta: o.otwarta ? () => say("narrator", o.otwarta) : null }), "wskaz"),
      plot: guard((pts, o) => M3.plot(S, pts, o)),
      ramka: guard(async (o = {}) => { const r = await M3.ramka(S, o); const p0 = r.przeciagaj; r.przeciagaj = (q) => wDzialaniu(p0({ ...q, onZaDuzo: q.wrong ? () => say("narrator", q.wrong) : null })); return r; }),
      domino: (a, b, o) => { alive(); return M3.domino(S, a, b, o); },
      szukaj: (nazwa, o) => wDzialaniu(M3.szukaj(S, nazwa, o), "wskaz"),
      znalezisko: guard((nazwa, o) => M3.znalezisko(S, nazwa, o)),
      ilustracja: guard((nazwa, o) => IL.ilustracja(S, nazwa, { ...o, czekaj: !NAGRAJ && !FAST,
        mowDalej: () => { const t = this.etapy?.["line.ilustracja_dalej"]; return t && !FAST ? this.speech.say({ lang: this.lang, lessonId: "etapy", key: "line.ilustracja_dalej", text: t.text, who: "narrator" }).catch(() => {}) : null; } })),
      miejsca: guard((o) => M4.miejsca(S, o)),
      zdrapka: (nazwa, o) => wDzialaniu(M4.zdrapka(S, nazwa, o), "dotknij"),   // rub the cover off, then a found picture
      kropki: (nazwa, o = {}) => wDzialaniu(M4.kropki(S, nazwa, { ...o, onZle: () => blad(o.wrong) }), "dotknij"),
      // mechaniki7.js: the clock, the characters as cards, bundles of ten; the task is a method of what they return,
      // `wrong` a line key or (what) => key
      zegar: guard(async (o = {}) => { const z = await M7.zegar(S, o); const u0 = z.ustaw; z.ustaw = (q = {}) => wDzialaniu(u0({ ...q, onZle: (t) => blad(typeof q.wrong === "function" ? q.wrong(t) : q.wrong) }), "przeciagnij").then((r) => { nagroda(null); return r; }); return z; }),
      portrety: guard(async (o = {}) => {
        const p = await M7.portrety(S, o), od = p.odrzuc, zn = p.znajdz, zle = (w) => (kto) => blad(typeof w === "function" ? w(kto) : w);
        p.odrzuc = (q = {}) => wDzialaniu(od({ ...q, onZle: zle(q.wrong) }), "wskaz").then((r) => { nagroda(null); return r; });
        p.znajdz = (kto, q = {}) => wDzialaniu(zn(kto, { ...q, onZle: zle(q.wrong) }), "wskaz").then((r) => { nagroda(null); return r; });
        return p;
      }),
      peczki: guard(async (o = {}) => { const m = await M7.peczki(S, o); const u0 = m.uloz; m.uloz = (q = {}) => wDzialaniu(u0({ ...q, onZle: (pw) => blad(typeof q.wrong === "function" ? q.wrong(pw) : q.wrong) }), "przeciagnij").then((r) => { nagroda(null); return r; }); return m; }),
      // mechaniki6.js: push through a gap, measure with units (counted by `who`), a picture bar chart; `wrong` may be (reason) => key
      szpara: (o = {}) => wDzialaniu(M6.szpara(S, { ...o, onZle: () => blad(o.wrong) }), "przeciagnij").then((r) => { nagroda(null); return r; }),
      miarka: (o = {}) => wDzialaniu(M6.miarka(S, { ...o, onZle: (pow) => blad(typeof o.wrong === "function" ? o.wrong(pow) : o.wrong), onLicz: o.who ? (n) => say(o.who, `line.n${n}`) : null }), "przeciagnij").then((r) => { nagroda(null); return r; }),
      wykres: guard((o = {}) => (o.rzeczy?.length ? wDzialaniu(M6.wykres(S, { ...o, onZle: () => blad(o.wrong) }), "przeciagnij").then((r) => { nagroda(null); return r; }) : M6.wykres(S, o))),
      // mechaniki5.js: a grid with headers (without `rzeczy` it only lays out cells to read), a hidden rule, giving out
      siatka: guard((o = {}) => (o.rzeczy?.length ? wDzialaniu(M5.siatka(S, { ...o, onZle: () => blad(o.wrong) }), "przeciagnij").then((r) => { nagroda(null); return r; }) : M5.siatka(S, o))),
      regula: (o = {}) => wDzialaniu(M5.regula(S, { ...o, onZle: () => blad(o.wrong) }), "przeciagnij").then((r) => { nagroda(null); return r; }),
      rozdaj: (o = {}) => wDzialaniu(M5.rozdaj(S, { ...o, onZle: () => blad(o.wrong) }), "przeciagnij").then((r) => { nagroda(null); return r; }),
      podarty: (nazwa, o) => wDzialaniu(M4.podarty(S, nazwa, o)),          // put a torn found picture together; then its task
      // breathers (oddechy.js): no maths, one gesture; their words from game/oddechy in the given character's voice
      kpn: (o = {}) => wDzialaniu(OD.kpn(S, { ...o, mow: mowOddech }), "wskaz"),
      lustro: (o = {}) => wDzialaniu(OD.lustro(S, { ...o, mow: mowOddech }), "wskaz"),
      karmienie: (o = {}) => wDzialaniu(OD.karmienie(S, { ...o, mow: mowOddech })),
      latawiec: (o = {}) => wDzialaniu(OD.latawiec(S, { ...o, mow: mowOddech }), "dotknij"),
      ktoPowiedzial: (o = {}) => wDzialaniu(OD.ktoPowiedzial(S, { ...o, mow: mowOddech }), "wskaz"),
      malowanie: (o = {}) => wDzialaniu(OD.malowanie(S, { ...o, mow: mowOddech }), "dotknij"),
      wedrowka: (nazwa, o = {}) => wDzialaniu(M4.wedrowka(S, nazwa, { ...o, onZle: () => blad(o.wrong) }), "dotknij"),
      historyjka: (nazwa, o = {}) => (o.uloz === false ? M4.historyjka(S, nazwa, o) : wDzialaniu(M4.historyjka(S, nazwa, { ...o, onZle: () => blad(o.wrong) }))).then((r) => { if (o.uloz !== false) nagroda(null); return r; }),                         // the painted room's places: {name: {slot(accept), strefa(), ...}}     // an event illustration lands like a stamp; `.zsun()` takes it away
      labirynt: (nazwa, o) => wDzialaniu(M3.labirynt(S, nazwa, o), "wskaz"),
      winda: guard(async (o = {}) => {
        const w = await M3.winda(S, { ...o, onZly: () => blad(o.wrong) });
        const d0 = w.doPoziomu; w.doPoziomu = (i) => wDzialaniu(d0(i)); return w;
      }),
      rozblysk: guard((cel, opts) => E.rozblysk(S, typeof cel === "string" ? S.puppets[cel] : cel, opts)),     // a discovery: rays and sparkles behind it
      pan: guard((k, opts) => E.pan(S, k, opts)),
      odliczanie: guard((opts) => E.odliczanie(S, opts)),
      konfetti: (h, opts) => { alive(); E.konfetti(S, h, opts); },
      ptaszek: guard((h, opts) => E.ptaszek(S, h, opts)),
      emocja: guard(async (who, rodzaj, { anim = null, na = 2.2 } = {}) => { if (anim) S.play(who, anim); return E.emocja(S, who, rodzaj, { na }); }),
      nalozenie: guard((gorny, dolny, opts) => E.nalozenie(S, gorny, dolny, opts)),
      // particles over the whole scene: deszcz, snieg, swietliki, liscie, pylek, babelki (null stops them)
      czastki: (rodzaj, opts) => { alive(); return E.czastki(S, rodzaj, opts); },
      // a bar of stars in the HUD for a practice stage; auto: every finished task adds one
      gwiazdki: (n, { auto = true } = {}) => { alive(); this.gwiazdki = pasekGwiazdek(n, auto); return this.gwiazdki; },
      // dressing up (ubior.js): a hat, glasses, shoes ... fitted to any humanoid character
      ubierz: guard((who, rzecz, opts) => U.ubierz(S, who, rzecz, opts)),
      zdejmij: (who, slot) => { alive(); return U.zdejmij(S, who, slot); },
      nieUbieraj: guard((who, rzecz, opts) => U.nieUbieraj(S, who, rzecz, opts)),
      ubranie: guard((rzecz, opts) => U.ubranieNaNaklejce(S, rzecz, opts)),
      // drag garments onto characters: { rzeczy, kto: [names], pasuje(h, who) -> true | "za_duze" | "za_male", wrong(ocena) -> line key, zostaw }
      ubieranie: guard((o) => wDzialaniu(U.ubieranie(S, { ...o, onWrong: o.wrong ? (h, who, ocena) => say("narrator", typeof o.wrong === "function" ? o.wrong(ocena, h, who) : o.wrong) : null })).then((r) => { nagroda(null); return r; })),
      mood: (who, m) => S.mood(who, m),
      look: (who, target, opts) => S.lookAt(who, target, opts),   // a scene may direct a gaze too (null = ahead)
      sfx: (name, opts) => S.sfx.graj(name, opts),                // a sound effect (game/audio/sfx)
      shake: (h) => { alive(); return S.shake(h); },                  // a wrong try: the thing shakes (and buzzes)
      // the camera closes in on things and dims the rest; unfocus brings the whole stage back
      focus: guard((items, opts) => S.focus(items, opts)),
      // carrying: take a thing into a character's paw (onto a quadruped's back), walk with it, put it down
      take: guard((who, h, opts) => S.take(who, h, opts)),
      // "I have an idea!": a thought bubble over a character with stickers pictured inside, in groups
      idea: guard((who, groups, opts) => S.idea(who, groups, opts)),
      // numbers: a digit (or 10) drawn with the pencil; counting by touch - the number words are the lesson's own
      // lines "line.n1".."line.n10", spoken by `who`
      digit: guard((n, opts) => narysujCyfre(S, n, opts)),
      count: guard((items, { who, od = 0, rzad = null } = {}) => wDzialaniu.dotknij(liczDotykiem(S, items, { od, rzad, say: (k) => say(who, `line.n${k}`) }))),
      equation: guard((tokens, opts) => narysujRownanie(S, tokens, opts)),
      // geometry and order (geometria.js); the waits repeat the instruction when a character is tapped
      shape: (kind, opts) => { alive(); return G.ksztalt(S, kind, opts); },
      corners: (h) => G.rogi(S, h),
      piece: (t, opts = {}) => G.ksztalt(S, t, { ...opts, def: G.TANGRAM[t], name: `kawalek_${t}` }),
      tangram: guard(async (name, opts) => { const t = G.tangram(S, name, opts); const pol = last; t.done = () => wDzialaniu(t.wait()).then((r) => { nagroda(null); return r; }); return t; }),
      place: guard(async (o) => { const pol = last; return wDzialaniu(G.umiesc(S, { ...o, onWrong: () => blad(o.wrong) })); }),
      behind: (item, ref) => G.zaRzecza(item, ref),
      relation: (item, ref, ref2) => G.relacja(S, item, ref, ref2),
      symmetry: guard(async (name, o = {}) => { const pol = last; const t = await G.symetria(S, name, { ...o, onWrong: () => blad(o.wrong) }); t.done = () => wDzialaniu(t.wait()).then((r) => { nagroda(null); return r; }); return t; }),
      slots: guard(async (o) => { const pol = last; const t = await G.sloty(S, { ...o, onWrong: () => blad(o.wrong) }); t.done = () => wDzialaniu(t.wait()).then((r) => { nagroda(null); return r; }); return t; }),
      // a character puts a thing down where the shot does not reach (Fox's pumpkin onto a shelf off the frame): the
      // camera first pulls out so the child sees where it goes, and the thing lies there a moment before anything else
      put: guard(async (who, x, y, opts) => {
        const kam = S.camera, v = S.visible(0), hw = v.w / 2 / kam.zoom, hh = v.h / 2 / kam.zoom;
        const poza = Math.abs(x - kam.position.x) > hw - 0.8 || Math.abs(y - kam.position.y) > hh - 0.8;
        if (poza) await E.ujecie(S, "ogolny", { ciecie: false });
        const r = await S.put(who, x, y, opts);
        if (poza) await S.wait(FAST ? 0.1 : 0.9);
        return r;
      }),
      // pencil annotations (each a handle: remove it, or clear() does)
      circle: guard((h, opts) => S.circle(h, opts)),
      arrow: guard((h, opts) => S.arrow(h, opts)),
      cross: guard((h, opts) => S.cross(h, opts)),
      wonder: guard((who, opts) => S.wonder(who, opts)),
      unfocus: guard((d) => S.unfocus(d)),
      // drawing with a pencil: a stroke along points or Bezier segments, a segment with end ticks; stickers' real
      // edges (bounds) and standing things on a line - the pieces for comparisons and pairings
      line: guard((path, opts) => S.line(path, opts)),
      segment: guard((a, b, opts) => S.segment(a, b, opts)),
      bounds: (h) => S.bounds(h),
      standOn: guard((items, y, d) => S.standOn(items, y, d)),
      object: guard((name, opts) => S.object(name, opts)),
      sign: guard((text, opts) => S.sign(text, opts)),
      zone: guard((opts) => S.zone(opts)),
      arrange: (groups, opts) => { alive(); return S.arrange(groups, opts); },
      choose: guard((targets) => S.choose(targets)),
      // a task: the child must click `correct` among `targets`; a wrong click plays the
      // `wrong` line and, after `hintAfter` misses, pulses the right answer
      task: (o) => wDzialaniu(zadanie(o), "wskaz"),
      sort: (o) => wDzialaniu(sortuj(o)).then((r) => { nagroda(null); return r; }),
      // wszystkie: every right one must be found ("point to all the apples"); each found one keeps a pencil ring
      _task: async ({ targets, correct, wrong, hintAfter = 2, onWrong = null, wszystkie = false }) => {
        const ok = Array.isArray(correct) ? correct : [correct];
        const znalezione = new Set(), obrysy = [];
        const szukane = () => ok.filter((h) => !znalezione.has(h));
        Object.defineProperty(S, "zachetaCel", { configurable: true, get: () => szukane()[0] || null });
        const polecenie = last;                          // the instruction: a tapped character repeats it, not the "try again" said since
        let misses = 0;
        const podpowiedzi = [];                          // pencil hints drawn on the way; wiped when the task ends
        const puppets = Object.values(S.puppets).filter((L) => L.korzen.visible);
        // while the child thinks, the characters look from one option to the next - every option, so the gaze gives nothing away
        const names = Object.keys(S.puppets).filter((n) => S.puppets[n].korzen.visible);
        let tick = 0;
        const glance = () => { names.forEach((n, j) => S.lookAt(n, targets[(tick + j) % targets.length])); tick++; };
        glance(); const gazeTimer = setInterval(() => { if (this.run !== run) return clearInterval(gazeTimer); glance(); }, FAST ? 400 : 1700);
        try {
        for (;;) {
          alive();
          const hit = await S.choose([...targets.filter((h) => !znalezione.has(h)), ...puppets]);
          alive();
          if (hit && hit.korzen && !targets.includes(hit)) { if (polecenie) await say(polecenie.who, polecenie.key, { anim: polecenie.anim }); continue; }   // "say it again" - unless the characters are the options (statues)
          if (ok.includes(hit) && wszystkie && szukane().length > 1) {     // one of several found: ring it, look for the rest
            znalezione.add(hit); hit.highlight?.(false); S.sfx.graj("right"); E.ptaszek(S, hit); obrysy.push(await S.circle(hit)); continue;
          }
          if (ok.includes(hit)) { for (const h of ok) h.highlight?.(false); clearInterval(gazeTimer); S.lookAt(null, hit); S.sfx.graj("right"); nagroda(hit, misses === 0); return wszystkie ? ok : hit; }
          misses++;
          S.shake(hit);
          if (onWrong) await onWrong(hit); else await blad(wrong);
          // the hint ladder: first the answer pulses, then a pencil arrow points at it, then the character shows it
          if (misses >= hintAfter) for (const h of szukane()) h.highlight?.(true);
          if (misses === hintAfter + 1 && !podpowiedzi.length) podpowiedzi.push(await S.arrow(szukane()[0]));
          if (misses === hintAfter + 2) {
            const kto = polecenie?.who && S.puppets[polecenie.who] ? polecenie.who : Object.keys(S.puppets).find((n) => S.puppets[n].korzen.visible);
            if (kto) { S.lookAt(kto, szukane()[0]); S.puppets[kto].graj("Wskazanie"); }
            podpowiedzi.push(await S.circle(szukane()[0]));
          }
        }
        } finally { clearInterval(gazeTimer); for (const p of [...podpowiedzi, ...obrysy]) p.remove(); Object.defineProperty(S, "zachetaCel", { configurable: true, value: null, writable: true }); }
      },
      // free sorting: every item must end up in a zone and every zone must hold one kind
      // (by item.tag); a mixed zone sends its odd ones home with the `wrong` line
      _sort: async ({ items, zones, wrong }) => {
        alive();
        // a thing waiting right over a container reads as already in it (a cake touching the plate): the row lifts
        // until there is a clear gap over every container below it, never past the ceiling
        let dy = 0;
        for (const it of items) {
          const b = S.bounds(it);
          for (const z of zones) {
            const zb = S.bounds(z), gora = Math.max(z.y + z.h / 2, zb.top);   // a painted plate stands out over its dashed box
            if (b.right > Math.min(z.x - z.w / 2, zb.left) - 0.2 && b.left < Math.max(z.x + z.w / 2, zb.right) + 0.2) dy = Math.max(dy, gora + 0.55 - b.bottom);
          }
        }
        if (dy > 0.05) {
          dy = Math.min(dy, SUFIT - 0.1 - Math.max(...items.map((it) => S.bounds(it).top)));
          if (dy > 0.05) await Promise.all(items.map((it) => { it.home = { x: it.mesh.position.x, y: it.mesh.position.y + dy }; return it.moveTo(it.home.x, it.home.y, 0.35); }));
        }
        const polecenie = last;
        Object.keys(S.puppets).forEach((n, j) => S.lookAt(n, zones[j % zones.length]));   // the characters watch the containers
        return new Promise((resolve) => {
          let busy = false;
          const check = async () => {
            if (busy || items.some((i) => !i.zone)) return;
            busy = true;
            try {
              const odd = [];
              for (const z of zones) {
                const count = {}; for (const i of z.items) count[i.tag] = (count[i.tag] || 0) + 1;
                const main = z.want || Object.keys(count).sort((a, b) => count[b] - count[a])[0];
                for (const i of z.items) if (i.tag !== main) odd.push(i);
              }
              if (!odd.length) { S.endSort(); S.lookAt(null, null); S.sfx.graj("right"); resolve(true); return; }
              for (const i of odd) { S.shake(i); }
              await S.wait(0.45);
              for (const i of odd) { i.zone.take(i); i.moveTo(i.home.x, i.home.y, 0.4); }
              if (this.run === run) await blad(wrong);
            } finally { busy = false; }
          };
          S.sort({ items, zones, onDrop: () => { if (this.run === run) check(); }, onTap: () => S.onPuppetTap() });
        });
      },
      card: guard((key, button = "button.next") => this.card(this.tl(key), this.t(button))),
      wait: guard((s) => S.wait(FAST ? Math.min(s, 0.2) : s)),
      clear: () => { alive(); S.clear(); },
      brawo: guard((who) => zPuli("brawo", who)),          // a recorded praise variant in that character's voice (game/pochwaly)
      praise: guard(async (who) => { const L = S.puppets[who]; if (L && L.korzen.visible) { L.graj("Radosc"); } await S.wait(FAST ? 0.2 : 1.2); }),
    };
    const zadanie = ctx._task, sortuj = ctx._sort;   // task/sort run under the instruction rule (wDzialaniu)
    if (NAGRAJ) for (const k of [...OBRAZ, ...INTERAKCJE]) {
      const f = ctx[k]; if (typeof f !== "function") continue;
      const opis = (a) => a.map((x) => (typeof x === "string" ? x : typeof x === "number" ? String(x) : Array.isArray(x) ? `[${x.length}]` : x && typeof x === "object" ? (x.name || x.rodzaj || "") : "")).filter(Boolean).join(" ").slice(0, 60);
      ctx[k] = (...a) => {
        zapisz({ typ: INTERAKCJE.has(k) ? "interakcja" : "obraz", co: k, opis: opis(a), polecenie: last?.key || null });
        if (!INTERAKCJE.has(k)) return f(...a);
        zrodloMowy = "blad";                                         // what is said while the child works is a wrong-answer line
        const r = f(...a); Promise.resolve(r).finally(() => { zrodloMowy = "opowiesc"; }); return r;
      };
    }
    return ctx;
  }

  // ------------------------------------------------------------------ overlays
  fade(dark) {
    const f = $("#fade"); f.style.display = "block";
    // timers, not animation frames: a hidden tab gets no frames and would hang here
    return new Promise((ok) => { setTimeout(() => { f.style.opacity = dark ? "1" : "0"; setTimeout(() => { if (!dark) f.style.display = "none"; ok(); }, FAST ? 60 : 380); }, 20); });
  }
  // the goodbye: a blue iris closes around the characters' faces, then covers everything
  async outro() {
    const S = this.stage, iris = $("#iris");
    // the iris closes on the face of whoever spoke last (the one saying goodbye)
    const visible = Object.values(S.puppets).filter((L) => L.korzen.visible);
    const star = S.puppets[this.lastSpeaker] && S.puppets[this.lastSpeaker].korzen.visible ? S.puppets[this.lastSpeaker] : visible[0];
    const r = S.renderer.domElement.getBoundingClientRect();
    let cx = r.left + r.width / 2, cy = r.top + r.height / 2, r1 = 220;
    if (star) {
      const head = star.korzen.position.clone(); head.y += star.wysokosc * 0.82;
      const c = S.toScreen(head), edge = S.toScreen(head.clone().add(new THREE.Vector3(star.wysokosc * 0.3, 0, 0)));
      cx = c.x + r.left; cy = c.y + r.top; r1 = Math.abs(edge.x - c.x);
    }
    const r0 = Math.hypot(innerWidth, innerHeight);
    iris.style.display = "block";
    S.sfx.graj("koniec");                                            // rising as the circle closes, a sweet chord as it shuts
    const t0 = performance.now(), d = FAST ? 400 : 1800;
    await new Promise((ok) => {
      const step = () => {
        const s = Math.min(1, (performance.now() - t0) / d);
        // three phases: close in on the face (ease-out), hold on it, then shut (ease-in)
        let radius;
        if (s < 0.65) { const u = s / 0.65, e = 1 - Math.pow(1 - u, 3); radius = r0 + (r1 - r0) * e; }
        else if (s < 0.8) radius = r1;
        else { const u = (s - 0.8) / 0.2; radius = r1 * (1 - u * u); }
        const m = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${Math.max(0, radius)}px, #000 ${Math.max(0, radius) + 3}px)`;
        iris.style.webkitMaskImage = m; iris.style.maskImage = m;
        if (s < 1) setTimeout(step, 16); else setTimeout(ok, FAST ? 100 : 500);
      };
      step();
    });
  }
  card(text, button) {
    const c = $("#card"); c.style.display = "flex";
    c.querySelector(".text").textContent = text;
    const b = c.querySelector("button"); b.textContent = button;
    return new Promise((ok) => {
      const close = () => { c.style.display = "none"; ok(); };
      b.onclick = close;
      if (FAST) setTimeout(close, 300);
    });
  }
  closeStage() { if (this.stage) { this.stage.dispose(); this.stage = null; } }

  // ------------------------------------------------------------------ test helpers (window.gra)
  klik(nx, ny) { return this.stage?.click(nx, ny); }
  klikCel(i) { const t = this.stage?.targets[i]; return t ? this.stage.clickOn(t) : null; }
  get cele() { return (this.stage?.targets || []).map((t) => t.name); }
  snap(name) { return this.stage?.snap(name); }
  get dziennik() { return this.speech.log; }
}
