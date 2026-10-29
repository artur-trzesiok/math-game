// The world map (the menu's map button): the land painted as a map (tools/mapa), a dotted path past six clearings -
// one per stage. A finished stage shows its sign, an open one its number, a locked one a padlock; Fox stands on the
// furthest open stage and, when a new one opened since the map was last seen, walks there along the path. A tap on an
// open stage closes the map and scrolls the menu to it; a locked one shakes.
import { v } from "./v.js";

const KLUCZ = "math_game.mapa_lisek";
let opis = null;
const opisMapy = async () => (opis ||= await fetch(v("/game/assets/mapa/mapa.json"), { cache: "no-store" }).then((r) => r.json()));
const czytaj = () => { try { return JSON.parse(localStorage.getItem(KLUCZ)) || {}; } catch { return {}; } };
const zapisz = (s) => { try { localStorage.setItem(KLUCZ, JSON.stringify(s)); } catch { /* private mode */ } };
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));

// etapy: [{id, nr, kolor, znak, otwarty, skonczony}] in the path's order; dzwiek(name) plays a menu sound
export async function otworz({ swiat, etapy, dzwiek = () => {}, onWybierz }) {
  const A = await opisMapy(), stopy = A.stopy?.[swiat];
  if (!stopy?.length) return;
  const el = document.createElement("div"); el.id = "mapa";
  const tu = Math.max(0, etapy.reduce((k, e, i) => (e.otwarty ? i : k), 0));     // the furthest open stage
  el.innerHTML = `<button class="zamknij" aria-label="zamknij">✕</button>
    <div class="plansza"><img class="tlo" src="${v(`/game/assets/mapa/mapa_${swiat}.webp`)}" alt="" draggable="false">
      ${etapy.map((e, i) => { const [x, y] = stopy[i] || stopy[stopy.length - 1]; return `
      <button class="stop${e.otwarty ? "" : " zamkniety"}${e.skonczony ? " skonczony" : ""}${i === tu ? " tu" : ""}" data-i="${i}" style="left:${x * 100}%;top:${y * 100}%;--c:${e.kolor}">
        ${e.skonczony && e.znak ? `<img class="znak" src="${v(`/game/assets/objects/${e.znak}.webp`)}" alt="">` : `<span class="nr">${e.nr}</span>`}
        ${e.otwarty ? "" : `<img class="klodka" src="${v("/game/assets/menu/klodka.webp")}" alt="">`}
      </button>`; }).join("")}
      <img class="lisek" src="${v("/game/assets/menu/lisek_glowa.webp")}" alt="">
    </div>`;
  document.body.appendChild(el);
  const lisek = el.querySelector(".lisek");
  const postaw = ([x, y]) => Object.assign(lisek.style, { left: `${x * 100}%`, top: `${y * 100}%` });
  // Fox starts where the child last saw him; a newly opened stage: he walks there stop by stop, hopping
  const stan = czytaj(), byl = Math.min(tu, stan[swiat] ?? tu);
  postaw(stopy[byl]);
  void el.offsetWidth; el.classList.add("widac");
  (async () => {
    if (byl < tu) {
      await czekaj(700);
      for (let i = byl + 1; i <= tu && el.isConnected; i++) {
        lisek.classList.remove("skok"); void lisek.offsetWidth; lisek.classList.add("skok"); postaw(stopy[i]); dzwiek("pop");
        await czekaj(750);
      }
      if (el.isConnected) el.querySelector(`.stop[data-i="${tu}"]`)?.classList.add("nowy");
    }
    stan[swiat] = tu; zapisz(stan);
  })();
  const zamknij = () => { el.classList.remove("widac"); setTimeout(() => el.remove(), 300); };
  el.querySelector(".zamknij").onclick = () => { dzwiek("pop"); zamknij(); };
  el.querySelector(".plansza").onclick = (ev) => {
    const b = ev.target.closest(".stop"); if (!b) return;
    const e = etapy[+b.dataset.i];
    if (!e.otwarty) { b.classList.remove("trzesie"); void b.offsetWidth; b.classList.add("trzesie"); dzwiek("wrong"); return; }
    dzwiek("pop"); b.classList.add("wybrany");
    setTimeout(() => { zamknij(); onWybierz?.(e.id); }, 350);
  };
}
