// Sticker variants: a lesson asks for "jablko" and the stage draws one of jablko, jablko_2, jablko_3 at random, so a
// row of apples is not ten copies of one. The handle keeps the base name (lessons find things by name). A variant keeps
// what stories name - an apple stays red, a hedgehog faces left (queues face their front on the left). Memory cards and
// symmetry halves load the base file: there two things must look the same.
export const WARIANTY = {
  jablko: 3, gruszka: 3, klocek: 3, kubek: 3, zoledz: 3, szyszka: 3, pilka: 3, jez: 3, but: 3, kaczatko_stoi: 3, krzak: 3,
  kwiatek: 3, misiu: 3, skarpetka: 3, talerz: 3, zajac: 3, grzyb: 3,
};
// every file of a sticker: the base first
export const warianty = (name) => [name, ...Array.from({ length: (WARIANTY[name] || 1) - 1 }, (_, i) => `${name}_${i + 2}`)];
export const losuj = (name) => { const w = warianty(name); return w[Math.floor(Math.random() * w.length)]; };
// "jablko_2" -> "jablko" (a file that is a variant of a base sticker), else null
export const bazowa = (plik) => { const m = /^(.*)_(\d+)$/.exec(plik); return m && WARIANTY[m[1]] && +m[2] <= WARIANTY[m[1]] ? m[1] : null; };
