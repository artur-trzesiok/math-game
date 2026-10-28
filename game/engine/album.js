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
export const ma = (lekcja) => !!stan.naklejki[lekcja];
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

  // a tapped sticker is told about: where it came from (its lesson's line, the narrator), and while it is told a
  // thought cloud beside the sticker shows that lesson's picture
  let chmurka = null;
  const opowiedz = async (id, przy = null) => {
    // a stage's own sticker (index.json topics) is told about from the menu's lines, its sign in the cloud
    const etap = !!naklejkiLekcji[id]?.obraz?.startsWith("objects/znak_"), klucz = etap ? `line.naklejka_opis_${id}` : "line.naklejka_opis";
    const tab = await fetch(v(etap ? `/game/menu/i18n/${lang}.json` : `/game/lessons/${id}/i18n/${lang}.json`), { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    const l = tab[klucz]; if (!l) return;
    speech.stop?.(); chmurka?.remove();
    const ta = chmurka = document.createElement("div"); ta.className = "chmurka";
    ta.innerHTML = `<img src="${v(etap ? `/game/assets/${naklejkiLekcji[id].obraz}.webp` : `/game/lessons/${id}/cover.webp`)}" alt=""><i class="k1"></i><i class="k2"></i>`;
    const cel = (przy || el.querySelector(`.nakl[data-id="${id}"]`))?.getBoundingClientRect(), W = innerWidth;
    if (cel) {
      const odstep = Math.max(56, cel.width * 0.85);                   // room for the thought's circles between them
      const wPrawo = cel.right + odstep + W * 0.26 < W, x = wPrawo ? cel.right + odstep : cel.left - odstep, y = Math.max(16, Math.min(innerHeight - W * 0.22, cel.top - cel.height * 0.4));
      Object.assign(ta.style, { top: `${y}px`, [wPrawo ? "left" : "right"]: `${wPrawo ? x : W - x}px` }); ta.classList.add(wPrawo ? "z-lewej" : "z-prawej");
    }
    el.appendChild(ta);
    // the thought's little circles lead from the cloud to the sticker it is about
    if (cel) {
      const r = { left: ta.offsetLeft, top: ta.offsetTop, width: ta.offsetWidth, height: ta.offsetHeight };   // the layout box: it is still growing in
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const px = cel.left + cel.width / 2, py = cel.top + cel.height / 2, dx = px - cx, dy = py - cy, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      const t = Math.min(r.width / 2 / Math.max(1e-6, Math.abs(ux)), r.height / 2 / Math.max(1e-6, Math.abs(uy)));     // cloud edge
      const luka = Math.max(0, l - t - Math.min(cel.width, cel.height) * 0.45);                                       // to the sticker's edge
      for (const [kl, f, d] of [["k1", 0.3, 0.18], ["k2", 0.72, 0.09]]) {
        const k = ta.querySelector(`.${kl}`), s = r.width * d, x = cx + ux * (t + luka * f) - r.left - s / 2, y = cy + uy * (t + luka * f) - r.top - s / 2;
        Object.assign(k.style, { left: `${x}px`, top: `${y}px`, right: "auto", bottom: "auto", width: `${s}px` });
      }
    }
    await speech.say({ lang, lessonId: etap ? "menu" : id, key: klucz, text: l.text, who: "narrator" }).catch(() => {});
    if (chmurka === ta) { ta.classList.add("znika"); setTimeout(() => ta.remove(), 300); chmurka = null; }
  };

  // a free spot for a sticker on a page, nearest to where it was dropped: stickers never go one on another
  // (positions in % of the page; a sticker is 27% of the page's width, the page about 0.72 as wide as tall)
  const SZ = 27, WYS = 27 * 0.72;
  const wolne = (strona, x0, y0) => {
    const inne = Object.values(stan.naklejki).filter((n) => n.strona === strona);
    const pasuje = (x, y) => inne.every((n) => Math.abs(n.x - x) > SZ * 0.9 || Math.abs(n.y - y) > WYS * 0.95);
    let best = null, bd = Infinity;
    for (let x = 14; x <= 86; x += 3) for (let y = 12; y <= 88; y += 3) {
      if (!pasuje(x, y)) continue;
      const d = Math.hypot(x - x0, (y - y0) * 0.72); if (d < bd) { bd = d; best = [x, y]; }
    }
    return pasuje(x0, y0) ? [x0, y0] : best;
  };

  // dragging: a sticker from the tray follows the finger; dropped on a page it sticks there for good (a stuck one
  // cannot be peeled off again - a tap tells about it); anywhere else it goes back. A swipe on the book turns the page.
  let ciag = null;
  el.addEventListener("pointerdown", (e) => {
    const nakl = e.target.closest(".nakl");
    if (nakl && !nakl.classList.contains("na-tacce")) { ciag = { swipe: true, x0: e.clientX, y0: e.clientY, stuk: nakl }; return; }
    if (!nakl) { if (e.target.closest(".ksiazka")) ciag = { swipe: true, x0: e.clientX, y0: e.clientY }; return; }
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
    if (c.swipe) {
      const dx = e.clientX - c.x0;
      if (Math.abs(dx) > 60) kartkuj(dx < 0 ? 1 : -1);
      else if (c.stuk && Math.hypot(dx, e.clientY - c.y0) < 10) { opowiedz(c.stuk.dataset.id, c.stuk); c.stuk.classList.add("stuk"); setTimeout(() => c.stuk.classList.remove("stuk"), 400); }
      return;
    }
    c.duch.remove();
    if (!c.ruch) { c.nakl.style.visibility = ""; opowiedz(c.id); c.nakl.classList.add("stuk"); setTimeout(() => c.nakl.classList.remove("stuk"), 400); return; }   // a tap on the tray
    const bok = strony.findIndex((s) => { const r = s.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; });
    if (bok >= 0) {
      const r = strony[bok].getBoundingClientRect(), n = stan.naklejki[c.id], strona = rozklad * 2 + bok;
      const miejsce = wolne(strona, Math.max(14, Math.min(86, ((e.clientX - r.left) / r.width) * 100)), Math.max(12, Math.min(88, ((e.clientY - r.top) / r.height) * 100)));
      if (!miejsce) { c.nakl.style.visibility = ""; c.nakl.classList.add("stuk"); return; }   // the page is full: back to the tray
      Object.assign(n, { strona, x: miejsce[0], y: miejsce[1], obrot: Math.round((Math.random() - 0.5) * 16) }); delete n.nowa;
      zapisz(stan); rysuj();
      opowiedz(c.id);                                               // freshly stuck: say where it came from
    } else c.nakl.style.visibility = "";
  });

  el.querySelector(".zamknij").onclick = () => { speech?.stop?.(); el.remove(); onZamknij?.(); };
}
