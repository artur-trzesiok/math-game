// Cache busting: the hosting server caches assets hard, so every file the game loads carries one stamp per page
// load (?t=<ms>, set by the page before any module, see game/index.html). One stamp per visit: within a visit the
// browser still reuses what it has, a reload always gets the current files.
export const T = window.__T || (window.__T = Date.now());
export const v = (url) => url + (url.includes("?") ? "&" : "?") + "t=" + T;
