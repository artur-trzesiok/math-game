import { v } from "./v.js";
// Translations. Two layers: the player's own strings (game/i18n/<lang>.json) and one
// file per lesson (game/lessons/<id>/i18n/<lang>.json). A lesson entry is either a
// plain string (a label) or {who, text} (a spoken line - the key of a spoken line
// starts with "line." and doubles as the mp3 name, see tools/audio/make_audio.js).

export const LANGS = ["pl", "en"];
const FRESH = { cache: "no-store" };

export function pickLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q && LANGS.includes(q)) { try { localStorage.setItem("lang", q); } catch (e) { /* private mode */ } return q; }
  try { const s = localStorage.getItem("lang"); if (s && LANGS.includes(s)) return s; } catch (e) { /* ignore */ }
  const nav = (navigator.language || "en").slice(0, 2);
  return LANGS.includes(nav) ? nav : "en";
}

export async function loadStrings(url) {
  const r = await fetch(v(url), FRESH);
  if (!r.ok) return {};
  return r.json();
}

// t("key") -> string; for a spoken line returns its text. Missing keys come back as
// the key itself in brackets so a gap is visible on screen, never silent.
export function translator(tables) {
  return (key, vars = {}) => {
    let v;
    for (const t of tables) if (t && key in t) { v = t[key]; break; }
    if (v === undefined) return `[${key}]`;
    let s = typeof v === "string" ? v : v.text;
    for (const [k, val] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, val);
    return s;
  };
}

export function lineOf(tables, key) {
  for (const t of tables) if (t && key in t) return typeof t[key] === "string" ? { who: "narrator", text: t[key] } : t[key];
  return { who: "narrator", text: `[${key}]` };
}
