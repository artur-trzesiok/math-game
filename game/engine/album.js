// The sticker album: every finished lesson gives a sticker (lesson.json "naklejka": the picture and who gives it);
// the child sticks it onto any page of the album, pages turn, a tapped sticker is told about (the lesson's
// line.naklejka_opis, the narrator's voice). Kept on this device (localStorage), never needed to play.
import { v } from "./v.js";

const KLUCZ = "math_game.album", STRON = 8;
const obrazNaklejki = (n) => v(`/game/assets/${n.obraz}.webp`);

function wczytaj() { try { return JSON.parse(localStorage.getItem(KLUCZ)) || { naklejki: {} }; } catch { return { naklejki: {} }; } }
function zapisz(s) { try { localStorage.setItem(KLUCZ, JSON.stringify(s)); } catch { /* private mode: the album lives until the page closes */ } }
let stan = wczytaj();

// a lesson's sticker comes in: new, waiting on the tray (a sticker already earned stays where it is)
export function dodaj(lekcja) { if (!stan.naklejki[lekcja]) { stan.naklejki[lekcja] = { nowa: true }; zapisz(stan); } }
export const nieprzyklejone = () => Object.values(stan.naklejki).filter((n) => n.strona === undefined).length;

let opis = null;                                     // album.json: the pages' boxes in the spread picture
const opisAlbumu = async () => (opis ||= await fetch(v("/game/assets/album/album.json"), { cache: "no-store" }).then((r) => r.json()));

// the giving at the end of a lesson: the sticker big in the middle, glowing; a tap takes it (it flies up, to the album)
export function wrecz(lekcja, naklejka, { szybko = false } = {}) {
  return new Promise((ok) => {
    const el = document.createElement("div"); el.id = "wreczenie";
    el.innerHTML = `<div class="blask"></div><img class="naklejka wycinek" src="${obrazNaklejki(naklejka)}" alt="">`;
    document.body.appendChild(el);
    const wez = () => {
      el.classList.add("zabrana"); dodaj(lekcja);
      setTimeout(() => { el.remove(); ok(); }, 700);
    };
    el.addEventListener("click", wez, { once: true });
    if (szybko) setTimeout(wez, 300);
  });
}

// ---------------------------------------------------------------- the album itself
export async function otworz({ lekcje, lang, speech, onZamknij }) {
  const A = await opisAlbumu();
  const naklejkiLekcji = Object.fromEntries(lekcje.filter((l) => l.naklejka).map((l) => [l.id, l.naklejka]));
  let rozklad = 0;                                    // which spread is open (pages 2k and 2k+1)
  const el = document.createElement("div"); el.id = "album";
  el.innerHTML = `<button class="zamknij" aria-label="zamknij">✕</button>
    <div class="ksiazka"><img class="tlo" src="${v("/game/assets/album/rozkladowka.webp")}" alt="" draggable="false">
      <div class="strona" data-bok="0"></div><div class="strona" data-bok="1"></div></div>
    <button class="kartkuj wstecz" aria-label="wstecz">‹</button><button class="kartkuj dalej" aria-label="dalej">›</button>
    <div class="tacka"></div>`;
  document.body.appendChild(el);
  const ksiazka = el.querySelector(".ksiazka"), tacka = el.querySelector(".tacka");
  const strony = [...el.querySelectorAll(".strona")];
  A.strony.forEach(([x0, y0, x1, y1], i) => Object.assign(strony[i].style, { left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` }));

  // what a page shows: its stickers at their spots
  const naklejkaHtml = (id, n) => `<img class="nakl wycinek" data-id="${id}" src="${obrazNaklejki(naklejkiLekcji[id])}" alt="" draggable="false"
      style="left:${n.x}%;top:${n.y}%;transform:translate(-50%,-50%) rotate(${n.obrot || 0}deg)">`;
  const tresc = (strona) => Object.entries(stan.naklejki).filter(([id, n]) => n.strona === strona && naklejkiLekcji[id]).map(([id, n]) => naklejkaHtml(id, n)).join("");
  const rysuj = () => {
    strony.forEach((s, b) => { s.innerHTML = tresc(rozklad * 2 + b); });
    tacka.innerHTML = Object.entries(stan.naklejki).filter(([id, n]) => n.strona === undefined && naklejkiLekcji[id])
      .map(([id]) => `<img class="nakl na-tacce wycinek" data-id="${id}" src="${obrazNaklejki(naklejkiLekcji[id])}" alt="" draggable="false">`).join("");
    el.querySelector(".wstecz").disabled = rozklad === 0; el.querySelector(".dalej").disabled = rozklad >= STRON / 2 - 1;
  };
  rysuj();
  // the narrator welcomes: what this album is, then an empty album or a new sticker on the tray
  const powitanie = async () => {
    const tab = await fetch(v(`/game/album/i18n/${lang}.json`), { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    const powiedz = (k) => (tab[k] ? speech.say({ lang, lessonId: "album", key: k, text: tab[k].text, who: "narrator" }).catch(() => {}) : null);
    await powiedz("line.album_witaj");
    if (!el.isConnected) return;
    if (!Object.keys(stan.naklejki).length) await powiedz("line.album_pusty");
    else if (nieprzyklejone()) await powiedz("line.album_nowe");
  };
  powitanie();

  // turning a page: a leaf over half the book rotates about the spine, showing the old page in front and the new
  // one on its back; under it the new spread is already there
  let kartkuje = false;
  const kartkuj = (kier) => {
    const nowy = rozklad + kier; if (kartkuje || nowy < 0 || nowy >= STRON / 2) return;
    kartkuje = true;
    const bokStary = kier > 0 ? 1 : 0, bokNowy = 1 - bokStary;
    const lisc = document.createElement("div"); lisc.className = `lisc ${kier > 0 ? "w-lewo" : "w-prawo"}`;
    const twarz = (bok, strona) => {
      const [x0, y0, x1, y1] = A.strony[bok], pol = bok ? 0.5 : 0;
      return `<div class="twarz ${bok ? "prawa" : "lewa"}" style="background-image:url(${v("/game/assets/album/rozkladowka.webp")})"><div class="strona" style="left:${(x0 - pol) * 200}%;top:${y0 * 100}%;width:${(x1 - x0) * 200}%;height:${(y1 - y0) * 100}%">${tresc(strona)}</div></div>`;
    };
    lisc.innerHTML = twarz(bokStary, rozklad * 2 + bokStary) + twarz(bokNowy, nowy * 2 + bokNowy).replace('class="twarz', 'class="twarz tyl');
    ksiazka.appendChild(lisc);
    strony[bokStary].innerHTML = tresc(nowy * 2 + bokStary);       // under the leaf: the new spread's page on that side
    void lisc.offsetWidth; lisc.classList.add("ruch");                // a reflow first, so the turn animates from 0
    setTimeout(() => { rozklad = nowy; lisc.remove(); rysuj(); kartkuje = false; }, 720);
  };
  el.querySelector(".wstecz").onclick = () => kartkuj(-1);
  el.querySelector(".dalej").onclick = () => kartkuj(1);

  // a tapped sticker is told about: where it came from (its lesson's line, the narrator)
  const opowiedz = async (id) => {
    const tab = await fetch(v(`/game/lessons/${id}/i18n/${lang}.json`), { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    const l = tab["line.naklejka_opis"]; if (!l) return;
    speech.stop?.();
    speech.say({ lang, lessonId: id, key: "line.naklejka_opis", text: l.text, who: "narrator" }).catch(() => {});
  };

  // dragging: a sticker from the tray (or from a page) follows the finger; dropped on a page it sticks there,
  // anywhere else it goes back. A tap without moving tells about it. A swipe on the book turns the page.
  let ciag = null;
  el.addEventListener("pointerdown", (e) => {
    const nakl = e.target.closest(".nakl");
    if (!nakl) { if (e.target.closest(".ksiazka")) ciag = { swipe: true, x0: e.clientX }; return; }
    e.preventDefault();
    const r = nakl.getBoundingClientRect(), duch = nakl.cloneNode(); duch.className = "nakl duch";
    Object.assign(duch.style, { left: `${r.left + r.width / 2}px`, top: `${r.top + r.height / 2}px`, width: `${r.width}px`, transform: "translate(-50%,-50%) scale(1.12)" });
    document.body.appendChild(duch); nakl.style.visibility = "hidden";
    ciag = { id: nakl.dataset.id, nakl, duch, x0: e.clientX, y0: e.clientY, ruch: false };
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
    if (!ciag || ciag.swipe) return;
    if (Math.hypot(e.clientX - ciag.x0, e.clientY - ciag.y0) > 8) ciag.ruch = true;
    Object.assign(ciag.duch.style, { left: `${e.clientX}px`, top: `${e.clientY}px` });
  });
  el.addEventListener("pointerup", (e) => {
    const c = ciag; ciag = null; if (!c) return;
    if (c.swipe) { const dx = e.clientX - c.x0; if (Math.abs(dx) > 60) kartkuj(dx < 0 ? 1 : -1); return; }
    c.duch.remove();
    if (!c.ruch) { c.nakl.style.visibility = ""; opowiedz(c.id); c.nakl.classList.add("stuk"); setTimeout(() => c.nakl.classList.remove("stuk"), 400); return; }
    const bok = strony.findIndex((s) => { const r = s.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; });
    if (bok >= 0) {
      const r = strony[bok].getBoundingClientRect(), n = stan.naklejki[c.id];
      const x = Math.max(12, Math.min(88, ((e.clientX - r.left) / r.width) * 100)), y = Math.max(12, Math.min(88, ((e.clientY - r.top) / r.height) * 100));
      const nowa = n.strona === undefined;
      Object.assign(n, { strona: rozklad * 2 + bok, x, y, obrot: n.obrot ?? Math.round((Math.random() - 0.5) * 16) }); delete n.nowa;
      zapisz(stan); rysuj();
      if (nowa) opowiedz(c.id);                                     // freshly stuck: say where it came from
    } else c.nakl.style.visibility = "";
  });

  el.querySelector(".zamknij").onclick = () => { speech?.stop?.(); el.remove(); onZamknij?.(); };
}
