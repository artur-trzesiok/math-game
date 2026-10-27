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
  POST /api/snap?name=x           body = PNG; saved as work/snap/x.png (test screenshots
                                  rendered by the page itself, see CLAUDE.md)
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
FIELDS = ("x", "y", "w", "h", "os", "obrot", "rdzen")
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


class Handler(SimpleHTTPRequestHandler):
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
        super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        if u.path == "/api/snap":
            name = parse_qs(u.query).get("name", ["snap"])[0]
            if not NAME.fullmatch(name):
                return self._json(400, {"error": "bad name"})
            SNAPS.mkdir(parents=True, exist_ok=True)
            (SNAPS / f"{name}.png").write_bytes(self._body())
            return self._json(200, {"ok": True, "file": str(SNAPS / f"{name}.png")})
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
        if "/api/" in str(a[0] if a else "") or (a and str(a[0]).isdigit()):
            super().log_message(fmt, *a)


if __name__ == "__main__":
    print(f"game:    http://localhost:{PORT}/game/")
    print(f"manager: http://localhost:{PORT}/manager/")
    ThreadingHTTPServer(("127.0.0.1", PORT), partial(Handler, directory=str(ROOT))).serve_forever()
