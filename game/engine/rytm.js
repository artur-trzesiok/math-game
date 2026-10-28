// Rhythm tools (the rhythm lesson): a row that plays itself, a dance of moves on a beat, a stumble, statues.
// A sticker may carry a sound (`object(name, {dzwiek})`): it sounds when pointed at and when its row plays.

const czekaj = (S, s) => S.wait ? S.wait(s) : new Promise((ok) => setTimeout(ok, s * 1000));

// the row plays itself from the start, one thing per beat: it bumps, glows a moment and sounds; `luka` (a handle
// at the gap) pulses after the last beat - "and now what comes?"; `kiwaja` nod to the beat
export async function rytm(S, items, { tempo = 0.62, luka = null, kiwaja = [], bezDzwieku = false } = {}) {
  for (const h of items) {
    if (h.dzwiek && !bezDzwieku) S.sfx.graj(h.dzwiek);
    h.highlight?.(true); S.bump(h, 0.3, false);
    for (const n of kiwaja) { const L = S.puppets[n]; if (L?.korzen.visible) S.bump(L, 0.25, false); }
    await czekaj(S, tempo * 0.55); h.highlight?.(false); await czekaj(S, tempo * 0.45);
  }
  if (luka) { luka.highlight?.(true); await S.bump(luka, 0.35, false); await czekaj(S, 0.4); luka.highlight?.(false); }
}

// one thing of a row read aloud: it bumps and glows a moment while its name is said
export function stuk(S, h) { h.highlight?.(true); S.bump(h, 0.3, false); setTimeout(() => h.highlight?.(false), 320); }

// one clap made from the puppet's Brawo (three claps): arms up, together once, down
function jedenKlask(brawo) {
  const probka = (kl, u) => {
    if (!Array.isArray(kl)) return kl;
    let a = kl[0]; for (const k of kl) { if (k[0] <= u) a = k; else return a[1] + (k[1] - a[1]) * (u - a[0]) / Math.max(1e-6, k[0] - a[0]); }
    return a[1];
  };
  const tor = (kl) => (Array.isArray(kl) ? [[0, probka(kl, 0)], [0.35, probka(kl, 0.2)], [0.6, probka(kl, 0.3)], [1, probka(kl, 1)]] : kl);
  const tory = {}; for (const [k, kl] of Object.entries(brawo.tory || {})) tory[k] = tor(kl);
  return { ...brawo, tory, skok: brawo.skok ? tor(brawo.skok) : undefined, czas: 0.8, petla: false };
}

export const RUCHY = {
  klask: { anim: "Klask", dzwiek: "klask", ikona: "ruch_klask" },
  skok: { anim: "Podskok", dzwiek: "hop", ikona: "ruch_skok" },
  obrot: { anim: "Obrot", dzwiek: "whoosh", ikona: "ruch_obrot" },
};

// one move, squeezed into one beat (an animation longer than the beat would run into the next move)
export function ruch(S, who, nazwa, { tempo = 1.0 } = {}) {
  const L = S.puppets[who], r = RUCHY[nazwa]; if (!L || !r) return;
  if (!L.dane.animacje.Klask && L.dane.animacje.Brawo) L.dane.animacje.Klask = jedenKlask(L.dane.animacje.Brawo);
  L.bezDzwieku = true; L.graj(r.anim, false); L.bezDzwieku = false;      // the move's own sound, not the stage's applause
  if (L.akcja) L.akcja.czas = Math.min(L.akcja.czas, tempo * 0.92);
  S.sfx.graj(r.dzwiek);
}

// a dance: the moves one per beat, then back to rest
export async function taniec(S, who, ruchy, { tempo = 1.0 } = {}) {
  for (const n of ruchy) { ruch(S, who, n, { tempo }); await czekaj(S, tempo); }
  S.puppets[who]?.spoczynek();
}

// a wrong move: the puppet wobbles on its feet with a sour sound
export async function potknij(S, who) {
  const L = S.puppets[who]; if (!L) return;
  S.sfx.graj("falsz");
  const k = L.korzen, r0 = k.rotation.z;
  await S.tween(0.7, (s) => { k.rotation.z = r0 + 0.16 * Math.sin(s * Math.PI * 3) * (1 - s); });
  k.rotation.z = r0;
}

// statues: the puppet stops in the pose it has now (time stands still for it); false lets it go on
export function zamroz(S, who, on = true) { const L = S.puppets[who]; if (L) L.zamrozona = on; }
