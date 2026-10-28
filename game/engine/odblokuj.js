// iPad / iPhone Safari plays an <audio> element only after it has once been started inside a user gesture: a
// fresh element per line started after an await is refused (NotAllowedError). Every module that plays sound
// registers here what to start during the child's first tap; it runs inside that tap, once.
const czekajace = [];
let odblokowane = false;
export function naPierwszyDotyk(fn) {
  if (odblokowane) { try { fn(); } catch { /* sound must never break the game */ } return; }
  czekajace.push(fn);
}
function odblokuj() {
  if (odblokowane) return;
  odblokowane = true;
  for (const fn of czekajace.splice(0)) { try { fn(); } catch { /* ignore */ } }
  for (const t of ["touchend", "click", "keydown"]) document.removeEventListener(t, odblokuj, true);
}
for (const t of ["touchend", "click", "keydown"]) document.addEventListener(t, odblokuj, true);

// a short silent clip (8 kHz mono 8-bit WAV) to start an element with
export const CISZA = (() => {
  const n = 400, b = new Uint8Array(44 + n), d = new DataView(b.buffer);
  const s = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
  s(0, "RIFF"); d.setUint32(4, 36 + n, true); s(8, "WAVEfmt "); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
  d.setUint32(24, 8000, true); d.setUint32(28, 8000, true); d.setUint16(32, 1, true); d.setUint16(34, 8, true); s(36, "data"); d.setUint32(40, n, true);
  b.fill(128, 44);
  let bin = ""; for (const x of b) bin += String.fromCharCode(x);
  return "data:audio/wav;base64," + btoa(bin);
})();

// the fallback when a sound is still refused: a big play button over the scene; the tap that removes it plays
export function poprosODotyk(fn) {
  if (document.getElementById("dotknij")) return;
  const el = document.createElement("div"); el.id = "dotknij";
  el.style.cssText = "position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(10,10,20,.35)";
  el.innerHTML = '<button aria-label="graj" style="width:min(160px,22vh);height:min(160px,22vh);border-radius:50%;border:0;background:#fff;box-shadow:0 6px 24px rgba(0,0,0,.35)"><svg viewBox="0 0 10 10" style="width:55%;margin-left:10%"><path d="M3 2 L8 5 L3 8 Z" fill="#2a4a6a"/></svg></button>';
  el.addEventListener("click", () => { el.remove(); fn(); }, { once: true });
  document.body.appendChild(el);
}
