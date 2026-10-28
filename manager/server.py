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
FIELDS = ("x", "y", "w", "h", "os", "obrot", "rdzen", "stawy")
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
        if path == "/api/arkusz.pdf":
            body = arkusz()
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Disposition", 'attachment; filename="naklejki_arkusz.pdf"')
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
