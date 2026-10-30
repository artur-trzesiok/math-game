"""Manager + game server:  python manager/server.py [port]   (default 8750)

Serves the repository root statically (the game at /game/, the manager at
/manager/) with no-store caching, plus a small API used by the manager's
character editor and by browser-side tests:

  GET  /api/characters            names of characters in game/assets/characters
  POST /api/characters/<name>     body = whole postac.json; writes it, keeps a
                                  one-time postac.json.bak and records what differs
                                  from the build output (postac.build.json next to it)
                                  in poprawki.json, which the character
                                  pipeline's `install` re-applies after every rebuild
  POST /api/characters/<name>/ubior  body = the wardrobe's corrections; writes ubior.json
  POST /api/snap?name=x           body = PNG; saved as work/snap/x.png (test screenshots
                                  rendered by the page itself, see CLAUDE.md)
  GET  /api/arkusz.pdf            every sticker on one PDF page: a grid of equal squares, each
                                  original file embedded at its own resolution and aspect, centred,
                                  with its name under it (the manager's "pobierz arkusz")
  GET  /api/tla.pdf               every scenery's plate one under another, each fitted to the width
                                  of the widest (panoramas set the width), its name over it
  GET  /api/<znaleziska|labirynty|roznice|ilustracje>.pdf[?cele=1]  every found picture / maze / difference pair one under
                                  another, fitted to the widest, its name over it; with cele=1 what the child
                                  must find drawn in (spots and paths, maze walls, the differences)
"""
import json
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent.parent
CHARACTERS = ROOT / "game" / "assets" / "characters"
SNAPS = ROOT / "work" / "snap"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8750
FIELDS = ("x", "y", "w", "h", "os", "obrot", "rdzen", "stawy", "przesun")
NAME = re.compile(r"[a-z0-9_]+")


def corrections(new: dict, base: dict) -> dict:
    """Everything in `new` that differs from the build output `base`: piece positions,
    pivots, rotations, face boxes, frames."""
    out: dict = {}
    for n, cz in new.get("czesci", {}).items():
        b = base.get("czesci", {}).get(n)
        if b is None:
            continue
        diff = {k: cz[k] for k in FIELDS if k in cz and cz[k] != b.get(k)}
        if diff:
            out.setdefault("czesci", {})[n] = diff
    for view, targets in new.get("twarz", {}).items():
        for t, box in targets.items():
            if box != base.get("twarz", {}).get(view, {}).get(t):
                out.setdefault("twarz", {}).setdefault(view, {})[t] = box
    for k in ("kadr", "kadr_profil", "kadr_tyl"):
        if k in new and new[k] != base.get(k):
            out[k] = new[k]
    return out



OBJECTS = ROOT / "game" / "assets" / "objects"


def arkusz() -> bytes:
    """One page: a grid of equal square cells, every sticker's own file embedded unchanged (its pixels, not resampled)
    and drawn fitted to the cell with its aspect kept, centred, its name and pixel size under it."""
    import io
    from PIL import Image
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas
    pliki = sorted(p for p in OBJECTS.glob("*.webp") if not p.stem.startswith("ikona_"))
    wym = {p: Image.open(p).size for p in pliki}
    bok = 384                                                   # the cell in points; a file's pixels stay as they are
    pad, podpis = 24, 34
    kol = max(1, round((len(pliki) * 1.4) ** 0.5))
    rzedy = -(-len(pliki) // kol)
    cw, ch = bok + 2 * pad, bok + 2 * pad + podpis
    W, H = kol * cw, rzedy * ch
    out = io.BytesIO()
    c = canvas.Canvas(out, pagesize=(W, H))
    c.setFillColorRGB(0.93, 0.93, 0.93); c.rect(0, 0, W, H, fill=1, stroke=0)
    for i, p in enumerate(pliki):
        k, r = i % kol, i // kol
        x0, y0 = k * cw, H - (r + 1) * ch
        c.setFillColorRGB(1, 1, 1); c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.rect(x0 + pad / 2, y0 + pad / 2, cw - pad, ch - pad / 2, fill=1, stroke=1)
        w, h = wym[p]; s = bok / max(w, h); dw, dh = w * s, h * s
        im = Image.open(p).convert("RGBA")                      # webp is not a PDF image type: the same pixels as PNG
        buf = io.BytesIO(); im.save(buf, "PNG")
        c.drawImage(ImageReader(io.BytesIO(buf.getvalue())), x0 + pad + (bok - dw) / 2, y0 + pad + podpis + (bok - dh) / 2, dw, dh, mask="auto")
        c.setFillColorRGB(0.15, 0.15, 0.15); c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(x0 + cw / 2, y0 + pad + 6, f"{p.stem}  ({w}x{h})")
    c.showPage(); c.save()
    return out.getvalue()


def arkusz_tel() -> bytes:
    """One page: every scenery's plate (its own file, not resampled) one under another, all scaled to the width of the
    widest plate in pixels (1 px = 1 pt), aspect kept, the name over each."""
    import io
    from PIL import Image
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas
    plyty = sorted(p for p in (ROOT / "game" / "assets" / "backgrounds").glob("*/plyta.webp"))
    wym = {p: Image.open(p).size for p in plyty}
    W = max(w for w, _ in wym.values())
    pad, podpis = 40, 70
    wys = {p: h * W / w for p, (w, h) in wym.items()}
    H = sum(wys.values()) + len(plyty) * (podpis + pad) + pad
    out = io.BytesIO()
    c = canvas.Canvas(out, pagesize=(W + 2 * pad, H))
    c.setFillColorRGB(0.93, 0.93, 0.93); c.rect(0, 0, W + 2 * pad, H, fill=1, stroke=0)
    y = H - pad
    for p in plyty:
        w, h = wym[p]
        c.setFillColorRGB(0.15, 0.15, 0.15); c.setFont("Helvetica-Bold", 40)
        c.drawString(pad, y - 48, f"{p.parent.name}  ({w}x{h})")
        y -= podpis
        buf = io.BytesIO(); Image.open(p).convert("RGB").save(buf, "PNG")
        c.drawImage(ImageReader(io.BytesIO(buf.getvalue())), pad, y - wys[p], W, wys[p])
        y -= wys[p] + pad
    c.showPage(); c.save()
    return out.getvalue()

def arkusz_obrazkow(rodzaj: str, z_celami: bool) -> bytes:
    """One page for one kind of picture (znaleziska, labirynty, roznice, ilustracje - no marks, lessons in the name): every picture one under another (a
    difference pair side by side), scaled to the widest, the name over each; with z_celami what the child must find
    drawn in - spots and paths in red, a maze's walls in yellow with its entrance and exit, the differences ringed.
    Pictures go in as JPEG (q 88): lossless they made a 40 MB sheet."""
    import io
    from PIL import Image, ImageDraw
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas
    CZERWONY = (255, 40, 40)

    def okregi(d, lista, W, H, g):
        for c in lista:
            if c.get("droga"): d.line([(a * W, b * H) for a, b in c["droga"]], fill=CZERWONY, width=g, joint="curve")
            else: d.ellipse([(c["x"] - c["r"]) * W, c["y"] * H - c["r"] * W, (c["x"] + c["r"]) * W, c["y"] * H + c["r"] * W], outline=CZERWONY, width=g)

    def sciany(d, m, W, H, g):
        fx0, fy0, fx1, fy1 = m["ramka"]; K, R = m["kolumny"], m["wiersze"]; cw, ch = (fx1 - fx0) * W / K, (fy1 - fy0) * H / R
        for r in range(R):
            for k in range(K):
                X, Y, s = fx0 * W + k * cw, fy0 * H + r * ch, m["sciany"][r * K + k]
                for i, q in enumerate([(X, Y, X + cw, Y), (X + cw, Y, X + cw, Y + ch), (X, Y + ch, X + cw, Y + ch), (X, Y, X, Y + ch)]):
                    if s[i]: d.line(q, fill=(255, 225, 77), width=g)
        for (k, r), kol in ((m["start"], (61, 220, 132)), (m["cel"], (255, 77, 77))):
            cx, cy, rr = fx0 * W + (k + 0.5) * cw, fy0 * H + (r + 0.5) * ch, min(cw, ch) * 0.22
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=kol)

    pliki = ["a.webp", "b.webp"] if rodzaj == "roznice" else ["obraz.webp"]
    obrazy = []
    for kat in sorted(q for q in (ROOT / "game" / "assets" / rodzaj).iterdir() if (q / "meta.json").exists()):
        meta = json.loads((kat / "meta.json").read_text(encoding="utf-8"))
        ims = [Image.open(kat / f).convert("RGB") for f in pliki if (kat / f).exists()]
        if len(ims) != len(pliki): continue
        if z_celami and rodzaj != "ilustracje":
            for im in ims:
                d = ImageDraw.Draw(im); W, H = im.size; g = max(5, W // 160)
                if rodzaj == "labirynty": sciany(d, meta, W, H, g)
                else: okregi(d, meta["cele"] if rodzaj == "znaleziska" else meta["roznice"], W, H, g)
        if len(ims) > 1:                                   # a pair side by side, a gap between
            h = max(i.size[1] for i in ims); para = Image.new("RGB", (sum(i.size[0] for i in ims) + 30 * (len(ims) - 1), h), (238, 238, 238))
            x = 0
            for i in ims: para.paste(i, (x, 0)); x += i.size[0] + 30
            ims = [para]
        gdzie = f"  -  {', '.join(meta['lekcje'])}" if rodzaj == "ilustracje" and meta.get("lekcje") else ""
        komiks = "  [komiks]" if meta.get("okienka") else ""
        obrazy.append((f"{kat.name}  ({ims[0].size[0]}x{ims[0].size[1]}){komiks}{gdzie}", ims[0]))
    if not obrazy: obrazy = [("(pusto)", Image.new("RGB", (800, 200), (238, 238, 238)))]
    W = max(im.size[0] for _, im in obrazy); pad, podpis = 40, 70
    wys = [im.size[1] * W / im.size[0] for _, im in obrazy]
    H = sum(wys) + len(obrazy) * (podpis + pad) + pad
    out = io.BytesIO(); c = canvas.Canvas(out, pagesize=(W + 2 * pad, H))
    c.setFillColorRGB(0.93, 0.93, 0.93); c.rect(0, 0, W + 2 * pad, H, fill=1, stroke=0)
    y = H - pad
    for (nazwa, im), h in zip(obrazy, wys):
        c.setFillColorRGB(0.15, 0.15, 0.15); c.setFont("Helvetica-Bold", 40); c.drawString(pad, y - 48, nazwa)
        y -= podpis
        buf = io.BytesIO(); im.save(buf, "JPEG", quality=88)
        c.drawImage(ImageReader(io.BytesIO(buf.getvalue())), pad, y - h, W, h)
        y -= h + pad
    c.showPage(); c.save()
    return out.getvalue()


class Server(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 256        # a lesson start is ~150 requests at once; the default backlog of 5 drops SYNs under load


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"   # keep-alive: far fewer TCP connects per lesson start

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code: int, data) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self) -> bytes:
        return self.rfile.read(int(self.headers.get("Content-Length", 0)))

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/":
            self.send_response(302); self.send_header("Location", "/game/"); self.end_headers(); return
        if path == "/api/characters":
            return self._json(200, sorted(p.name for p in CHARACTERS.iterdir() if (p / "postac.json").exists()))
        m = re.fullmatch(r"/api/(znaleziska|labirynty|roznice|ilustracje)\.pdf", path)
        if m:
            cel = "cele=1" in (urlparse(self.path).query or "")
            body = arkusz_obrazkow(m.group(1), cel)
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Disposition", f'attachment; filename="{m.group(1)}{"_z_zaznaczeniami" if cel else ""}_arkusz.pdf"')
            self.send_header("Content-Length", str(len(body)))
            self.end_headers(); self.wfile.write(body); return
        if path in ("/api/arkusz.pdf", "/api/tla.pdf"):
            body = arkusz() if path == "/api/arkusz.pdf" else arkusz_tel()
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Disposition", f'attachment; filename="{"naklejki" if path == "/api/arkusz.pdf" else "tla"}_arkusz.pdf"')
            self.send_header("Content-Length", str(len(body)))
            self.end_headers(); self.wfile.write(body); return
        super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        if u.path == "/api/snap":
            name = parse_qs(u.query).get("name", ["snap"])[0]
            body = self._body()                       # read first: an unread body would be parsed as the next request
            if not NAME.fullmatch(name):
                return self._json(400, {"error": "bad name"})
            SNAPS.mkdir(parents=True, exist_ok=True)
            (SNAPS / f"{name}.png").write_bytes(body)
            return self._json(200, {"ok": True, "file": str(SNAPS / f"{name}.png")})
        m = re.fullmatch(r"/api/characters/([a-z0-9_]+)/ubior", u.path)
        if m:                                         # the wardrobe's hand corrections (manager/editor.html)
            dst = CHARACTERS / m.group(1)
            if not (dst / "postac.json").exists():
                return self._json(400, {"error": "no such character"})
            try:
                new = json.loads(self._body())
            except ValueError as e:
                return self._json(400, {"error": f"bad json: {e}"})
            (dst / "ubior.json").write_text(json.dumps(new, ensure_ascii=False, indent=1), encoding="utf-8")
            return self._json(200, {"ok": True})
        m = re.fullmatch(r"/api/characters/([a-z0-9_]+)", u.path)
        if not m:
            return self._json(404, {"error": "unknown path"})
        name = m.group(1)
        dst = CHARACTERS / name
        if not (dst / "postac.json").exists():
            return self._json(400, {"error": "no such character"})
        try:
            new = json.loads(self._body())
        except ValueError as e:
            return self._json(400, {"error": f"bad json: {e}"})
        bak = dst / "postac.json.bak"
        if not bak.exists():
            bak.write_bytes((dst / "postac.json").read_bytes())
        (dst / "postac.json").write_text(json.dumps(new, ensure_ascii=False), encoding="utf-8")
        base_p = dst / "postac.build.json"
        count = 0
        if base_p.exists():
            diff = corrections(new, json.loads(base_p.read_text(encoding="utf-8")))
            count = len(diff.get("czesci", {})) + sum(len(v) for v in diff.get("twarz", {}).values())
            f = dst / "poprawki.json"
            if diff:
                f.write_text(json.dumps(diff, ensure_ascii=False, indent=1), encoding="utf-8")
            elif f.exists():
                f.unlink()
        self._json(200, {"ok": True, "corrections": count})

    def log_message(self, fmt, *a):
        # quiet for static files that exist; API calls and errors (a[0] is the code) are logged
        kod = str(a[1]) if len(a) > 1 else str(a[0]) if a else ""
        if "/api/" in str(a[0] if a else "") or kod[:1] in ("4", "5"):
            super().log_message(fmt, *a)


if __name__ == "__main__":
    print(f"game:    http://localhost:{PORT}/game/")
    print(f"manager: http://localhost:{PORT}/manager/")
    Server(("127.0.0.1", PORT), partial(Handler, directory=str(ROOT))).serve_forever()
