// The world map (the menu's map button): the land painted as a map (tools/mapa), a dotted path past six clearings -
// one per stage. A finished stage shows its sign, an open one its number, a locked one a padlock; Fox stands on the
// furthest open stage and, when a new one opened since the map was last seen, walks there along the path.
// It flies out of the map button rolled up, unrolls, the stops pop in one by one and Fox drops onto his; it rolls up
// back into the button on the X or a tap beside it. A tap on an open stage scrolls the menu there; on a locked one or
// on Fox, Fox says something (mow(key) - game/menu lines) and moves.
import { v } from "./v.js";

const KLUCZ = "math_game.mapa_lisek";
let opis = null;
const opisMapy = async () => (opis ||= await fetch(v("/game/assets/mapa/mapa.json"), { cache: "no-store" }).then((r) => r.json()));
const czytaj = () => { try { return JSON.parse(localStorage.getItem(KLUCZ)) || {}; } catch { return {}; } };
const zapisz = (s) => { try { localStorage.setItem(KLUCZ, JSON.stringify(s)); } catch { /* private mode */ } };
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
const losuj = (n) => 1 + Math.floor(Math.random() * n);
const ROZWINIETA = "inset(-30px -30px -60px -30px round 18px)", ZWINIETA = "inset(-30px 44.5% -60px 44.5% round 18px)";
const W_L = ["46.6%", "0%"], W_P = ["53.4%", "100%"];        // the rollers ride on the paper's edges

// etapy: [{id, nr, kolor, znak, otwarty, skonczony}] in the path's order; zrodlo: the map button's rect;
// dzwiek(name) a menu sound; mow(key) -> promise, Fox says a menu line
export async function otworz({ swiat, etapy, zrodlo = null, dzwiek = () => {}, mow = async () => {}, onWybierz }) {
  const A = await opisMapy(), stopy = A.stopy?.[swiat];
  if (!stopy?.length || document.getElementById("mapa")) return;
  const el = document.createElement("div"); el.id = "mapa";
  const tu = Math.max(0, etapy.reduce((k, e, i) => (e.otwarty ? i : k), 0));     // the furthest open stage
  el.innerHTML = `<button class="zamknij" aria-label="zamknij">✕</button>
    <div class="plansza"><img class="tlo" src="${v(`/game/assets/mapa/mapa_${swiat}.webp`)}" alt="" draggable="false">
      ${etapy.map((e, i) => { const [x, y] = stopy[i] || stopy[stopy.length - 1]; return `
      <button class="stop${e.otwarty ? "" : " zamkniety"}${e.skonczony ? " skonczony" : ""}" data-i="${i}" style="left:${x * 100}%;top:${y * 100}%;--c:${e.kolor}">
        ${e.skonczony && e.znak ? `<img class="znak" src="${v(`/game/assets/objects/${e.znak}.webp`)}" alt="">` : `<span class="nr">${e.nr}</span>`}
        ${e.otwarty ? "" : `<img class="klodka" src="${v("/game/assets/menu/klodka.webp")}" alt="">`}
      </button>`; }).join("")}
      <i class="walek"></i><i class="walek"></i>
      <button class="lisek" aria-label="lisek"><img src="${v("/game/assets/menu/lisek_glowa.webp")}" alt="" draggable="false"></button>
    </div>`;
  document.body.appendChild(el);
  const [wl, wp] = el.querySelectorAll(".walek");
  const walki = (doKonca, ms, easing) => Promise.all([[wl, W_L], [wp, W_P]].map(([w, [a, b]]) =>
    w.animate([{ left: doKonca ? a : b }, { left: doKonca ? b : a }], { duration: ms, easing, fill: "forwards" }).finished));
  wl.style.left = W_L[0]; wp.style.left = W_P[0];
  const plansza = el.querySelector(".plansza"), lisek = el.querySelector(".lisek"), guziki = [...el.querySelectorAll(".stop")];
  const postaw = ([x, y]) => Object.assign(lisek.style, { left: `${x * 100}%`, top: `${y * 100}%` });
  const stan = czytaj(), byl = Math.min(tu, stan[swiat] ?? tu);
  postaw(stopy[byl]);
  await new Promise((r) => { const img = el.querySelector(".tlo"); if (img.complete) r(); else { img.onload = r; img.onerror = r; } });

  // from the button to the middle: the offset and scale that put the map over the button
  const zPrzycisku = () => {
    const r = plansza.getBoundingClientRect();
    if (!zrodlo) return "translate(0, 30vh) scale(.3) rotate(-8deg)";
    const dx = zrodlo.left + zrodlo.width / 2 - (r.left + r.width / 2), dy = zrodlo.top + zrodlo.height / 2 - (r.top + r.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${Math.max(0.06, zrodlo.height / r.height)}) rotate(-14deg)`;
  };
  let otwarta = false, zamykana = false;
  const wejscie = async () => {
    dzwiek("plansza");
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, fill: "forwards" });
    // flies out rolled up, lands with a little overshoot, then unrolls from the middle
    // the rolled scroll flies out of the button turning over, lands and bounces
    await plansza.animate([
      { transform: zPrzycisku(), clipPath: ZWINIETA },
      { transform: "translateY(-6%) rotate(200deg) scale(.8)", clipPath: ZWINIETA, offset: 0.55 },
      { transform: "translateY(2%) rotate(360deg) scale(1)", clipPath: ZWINIETA, offset: 0.8 },
      { transform: "translateY(-1.5%) rotate(360deg)", clipPath: ZWINIETA, offset: 0.9 },
      { transform: "rotate(360deg)", clipPath: ZWINIETA }],
      { duration: 820, easing: "cubic-bezier(.25,.7,.35,1)", fill: "forwards" }).finished;
    plansza.animate([{ transform: "none" }], { fill: "forwards" });
    // then the rollers run apart and pull the paper open, with a little overshoot
    dzwiek("whoosh");
    const rozwin = { duration: 700, easing: "cubic-bezier(.3,1.25,.5,1)" };
    await Promise.all([plansza.animate([{ clipPath: ZWINIETA }, { clipPath: ROZWINIETA }], { ...rozwin, fill: "forwards" }).finished, walki(true, rozwin.duration, rozwin.easing)]);
    // the stops pop in along the path, then Fox drops onto his
    guziki.forEach((b, i) => { b.style.visibility = "visible"; b.animate([{ transform: "translate(-50%,-50%) scale(0)" }, { transform: "translate(-50%,-50%) scale(1.25)", offset: 0.7 }, { transform: "translate(-50%,-50%) scale(1)" }],
      { duration: 380, delay: i * 90, easing: "ease-out", fill: "backwards" }); });
    setTimeout(() => dzwiek("pop"), guziki.length * 45);
    await czekaj(guziki.length * 90 + 200);
    lisek.style.visibility = "visible";
    await lisek.animate([{ transform: "translate(-50%,-260%)", opacity: 0 }, { transform: "translate(-50%,-112%)", opacity: 1, offset: 0.6 }, { transform: "translate(-50%,-128%)", offset: 0.8 }, { transform: "translate(-50%,-118%)" }],
      { duration: 520, easing: "ease-in" }).finished;
    guziki[tu]?.classList.add("tu");
    otwarta = true;
  };
  const zamknij = async () => {
    if (zamykana) return; zamykana = true;
    dzwiek("whoosh");
    lisek.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
    guziki.forEach((b) => b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }));
    await Promise.all([plansza.animate([{ clipPath: ROZWINIETA }, { clipPath: ZWINIETA }], { duration: 380, easing: "cubic-bezier(.6,0,.8,.4)", fill: "forwards" }).finished, walki(false, 380, "cubic-bezier(.6,0,.8,.4)")]);
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: "forwards" });
    await plansza.animate([{ transform: "none", clipPath: ZWINIETA }, { transform: zPrzycisku().replace("-14deg", "-200deg"), clipPath: ZWINIETA }], { duration: 420, easing: "ease-in", fill: "forwards" }).finished;
    el.remove();
  };

  lisek.style.visibility = "hidden"; guziki.forEach((b) => { b.style.visibility = "hidden"; });
  await wejscie();
  // a newly opened stage: Fox walks there stop by stop, hopping
  if (byl < tu) {
    await czekaj(300);
    guziki[tu]?.classList.remove("tu");
    for (let i = byl + 1; i <= tu && el.isConnected; i++) {
      lisek.classList.remove("skok"); void lisek.offsetWidth; lisek.classList.add("skok"); postaw(stopy[i]); dzwiek("pop");
      await czekaj(750);
    }
    guziki[tu]?.classList.add("tu", "nowy");
  }
  stan[swiat] = tu; zapisz(stan);

  let mowi = false;
  const powiedz = async (key) => {
    if (mowi) return; mowi = true;
    lisek.classList.add("mowi");
    try { await mow(key); } catch { /* a line never breaks the map */ }
    lisek.classList.remove("mowi"); mowi = false;
  };
  el.querySelector(".zamknij").onclick = () => { dzwiek("pop"); zamknij(); };
  el.onclick = (ev) => {
    if (!otwarta || zamykana) return;
    if (!ev.target.closest(".plansza") && !ev.target.closest(".zamknij")) { zamknij(); return; }   // beside the map: it rolls up
    if (ev.target.closest(".lisek")) {
      lisek.classList.remove("hop"); void lisek.offsetWidth; lisek.classList.add("hop"); dzwiek("pop");
      powiedz(`line.mapa_lisek_${losuj(4)}`); return;
    }
    const b = ev.target.closest(".stop"); if (!b) return;
    const e = etapy[+b.dataset.i];
    if (!e.otwarty) {
      b.classList.remove("trzesie"); void b.offsetWidth; b.classList.add("trzesie"); dzwiek("wrong");
      lisek.classList.remove("hop"); void lisek.offsetWidth; lisek.classList.add("hop");
      powiedz(`line.mapa_klodka_${losuj(2)}`); return;
    }
    dzwiek("pop"); b.classList.add("wybrany");
    setTimeout(async () => { await zamknij(); onWybierz?.(e.id); }, 300);
  };
}
