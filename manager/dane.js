// Shared by the manager's pages: the lessons, what each uses, and the asset folders (the server lists a
// folder as an HTML page, so no extra API is needed).
const SWIEZO = { cache: "no-store" };
export const json = (u) => fetch(u, SWIEZO).then((r) => (r.ok ? r.json() : null)).catch(() => null);
export const tekst = (u) => fetch(u, SWIEZO).then((r) => (r.ok ? r.text() : "")).catch(() => "");
export const istnieje = (u) => fetch(u, { method: "HEAD", cache: "no-store" }).then((r) => r.ok).catch(() => false);
export const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// the entries of a folder: names of files (with the extension) or sub-folders (ending in /)
export async function katalog(url) {
  const html = await tekst(url);
  return [...html.matchAll(/href="([^"?#]+)"/g)].map((m) => decodeURIComponent(m[1])).filter((n) => !n.startsWith("/") && !n.startsWith(".."));
}

// every lesson: index entry, lesson.json, the code's text (to see what it names), the topic it is in
export async function lekcje() {
  const ix = await json("/game/lessons/index.json");
  const temat = {}; for (const t of ix.topics || []) for (const id of t.lessons) temat[id] = t;
  return Promise.all(ix.lessons.map(async (l) => ({
    ...l, temat: temat[l.id] || null,
    meta: (await json(`/game/lessons/${l.id}/lesson.json`)) || {},
    kod: await tekst(`/game/lessons/${l.id}/lesson.js`),
  })));
}
// which lessons use a thing: lesson.json lists it, or the code names it in quotes
export const uzywa = (lekcje, nazwa, pole) => lekcje.filter((l) => (l.meta[pole] || []).includes(nazwa) || new RegExp(`["'\`]${nazwa}["'\`]`).test(l.kod));

export const STYL = `
  html, body { margin: 0; background: #2b2b2b; color: #eee; font: 14px/1.45 system-ui, sans-serif; }
  header { position: sticky; top: 0; z-index: 2; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 10px 16px; background: #1f1f1f; border-bottom: 1px solid #444; }
  header h1 { font-size: 16px; margin: 0 10px 0 0; }
  input, select, button { font: inherit; background: #3a3a3a; color: #eee; border: 1px solid #555; border-radius: 4px; padding: 4px 10px; }
  a { color: #8fc0ff; }
  .chip { display: inline-block; background: #3a3a3a; border-radius: 10px; padding: 1px 8px; margin: 2px 4px 2px 0; font-size: 12px; }
  .chip.zle { background: #8a3b12; } .chip.ok { background: #2f5a2f; }
  main { padding: 16px; }`;
