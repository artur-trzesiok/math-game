"""Editing lint for a lesson: shots, runs, wide-then-cut, ping-pongs, home interactions, "Wskaż." lines.

python tools/lessons/montaz.py <lesson>      one lesson, per stage, with every wide-then-cut located
python tools/lessons/montaz.py all           one row per lesson stage and the totals

Static reading of lesson.js in source order (loops count once), so it is a guide, not a proof; the story preview
(manager/opowiesc.html) measures a real run.
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
LESSONS = ROOT / "game" / "lessons"

INTERACT = ("task|sort|count|slots|place|free|tangram|znalezisko|labirynt|roznice|szukaj|slad|waga|wieza|kubki|"
            "dzwieki|podziel|memory|sklepik|strzalki|zagroda|winda|ramka|ubieranie|taniec|symmetry|kolorowanka|polacz|"
            "choose|miejsca|zdrapka|kropki|historyjka|podarty|wedrowka")
# something happens on screen: a reason for the shot it is in
MOVE = (r"przejdz|walkTo|enter|show|play|pan|go|take|put|rozblysk|focus|ilustracja|object|tween|emocja|wonder|czastki|"
        r"konfetti|ptaszek|digit|equation|line|circle|arrow|idea|noc|swiatlo|rytm|ruch|nalozenie|bump|moveTo|shape")
CALL = re.compile(r"\b(?:c|S|c\.stage|\w+)\.(\w+)\(|\bawait\s+(\w+)\(\s*c\b")


def helpers(src):
    """Top-level functions of the lesson that run an interaction: a call to one counts as an interaction."""
    out = set()
    for m in re.finditer(r"^(?:async\s+)?function\s+(\w+)|^const\s+(\w+)\s*=\s*(?:async\s*)?\(", src, re.M):
        name = m.group(1) or m.group(2)
        body = src[m.end(): m.end() + 4000]
        nxt = re.search(r"^(?:async\s+)?function\s|^const\s|^export\s", body, re.M)
        body = body[: nxt.start()] if nxt else body
        if re.search(rf"\b(?:c|S|c\.stage)\.(?:{INTERACT})\(", body): out.add(name)
    return out


def stages(src):
    i = src.find("stages:")
    pos = sorted((m.start() + i, st) for st in ("story", "practice", "apply")
                 for m in [re.search(rf"\b{st}\s*:\s*\[", src[i:])] if m)
    return {st: (s, pos[n + 1][0] if n + 1 < len(pos) else len(src)) for n, (s, st) in enumerate(pos)}


def events(body, hs):
    ev = []
    for line_no, raw in enumerate(body.splitlines()):
        t = raw.strip()
        if t.startswith("//"): continue
        for m in CALL.finditer(raw):
            fn = m.group(1) or m.group(2)
            rest = raw[m.end():]
            if fn == "say": ev.append(("say", None, line_no))
            elif fn == "ujecie":
                k = re.match(r'\s*"(\w+)"', rest); ev.append(("shot", k.group(1) if k else "?", line_no))
            elif fn == "go" and re.match(r"\s*\{\s*kolor", rest): ev.append(("insert", None, line_no))
            elif re.fullmatch(MOVE, fn): ev.append(("move", fn, line_no))
            elif re.fullmatch(INTERACT, fn) or fn in hs: ev.append(("act", fn, line_no))
    return ev


def measure(ev):
    r = dict(lines=0, shots=0, z=0, s=0, d=0, o=0, inserts=0, acts=0, run=0, wide_cut=[], ping=0)
    run = 0
    for n, (kind, arg, ln) in enumerate(ev):
        if kind == "say":
            r["lines"] += 1; run += 1; r["run"] = max(r["run"], run)
        elif kind == "shot":
            r["shots"] += 1; run = 0
            r[{"zblizenie": "z", "sredni": "s", "dwuujecie": "d", "ogolny": "o"}.get(arg, "o")] += 1
            if arg == "ogolny" and n + 1 < len(ev) and ev[n + 1][0] == "shot" and ev[n + 1][1] != "ogolny":
                r["wide_cut"].append(ln)
            if arg == "zblizenie" and n + 2 < len(ev) and ev[n + 1][0] == "say" and ev[n + 2][:2] == ("shot", "ogolny"):
                r["ping"] += 1
        elif kind == "insert":
            r["inserts"] += 1; run = 0
        elif kind == "move":
            if arg in ("pan", "przejdz", "go", "rozblysk", "focus", "ilustracja"): run = 0
        elif kind == "act":
            r["acts"] += 1
    return r


def wskaz(lesson):
    pl = json.loads((LESSONS / lesson / "i18n" / "pl.json").read_text(encoding="utf-8"))
    return [k for k, v in pl.items() if isinstance(v, dict) and re.search(r"[.?!]\s+Wskaż\.?$", v.get("text", ""))]


def lesson(name):
    src = (LESSONS / name / "lesson.js").read_text(encoding="utf-8")
    hs = helpers(src)
    out = {}
    for st, (s, e) in stages(src).items():
        body = src[s:e]
        first = src[:s].count("\n") + 1
        m = measure(events(body, hs))
        m["wide_cut"] = [first + ln for ln in m["wide_cut"]]
        out[st] = m
    return out


def main(arg):
    names = sorted(p.name for p in LESSONS.iterdir() if (p / "lesson.js").exists()) if arg == "all" else [arg]
    print(f"{'lesson':19}{'stage':9}{'lines':>5}{'shots':>6} z/s/d/o      {'ins':>3}{'acts':>5}{'run':>4}{'wide-cut':>9}{'ping':>5}")
    tot = dict(lines=0, shots=0, d=0, o=0, inserts=0, wide=0, ping=0, wsk=0, thin=0)
    for n in names:
        res = lesson(n)
        for st in ("story", "practice", "apply"):
            m = res.get(st)
            if not m: continue
            mix = f"{m['z']}/{m['s']}/{m['d']}/{m['o']}"
            print(f"{n if st == 'story' else '':19}{st:9}{m['lines']:5}{m['shots']:6} {mix:12}{m['inserts']:3}{m['acts']:5}"
                  f"{m['run']:4}{len(m['wide_cut']):9}{m['ping']:5}")
            for k in ("lines", "shots", "d", "o", "inserts", "ping"): tot[k] += m[k]
            tot["wide"] += len(m["wide_cut"])
            if st == "apply" and m["acts"] < 4: tot["thin"] += 1
            if arg != "all" and m["wide_cut"]: print(f"{'':28}wide-then-cut at lesson.js lines {m['wide_cut']}")
        w = wskaz(n); tot["wsk"] += len(w)
        if arg != "all" and w: print(f"{'':28}'... Wskaż.' lines: {', '.join(w)}")
    if arg == "all":
        wide_share = round(100 * tot["o"] / max(1, tot["shots"]))
        print(f"\ntotal: {tot['lines']} lines, {tot['shots']} shots ({wide_share}% wide), {tot['d']} two-shots, "
              f"{tot['inserts']} inserts, {tot['wide']} wide-then-cut, {tot['ping']} ping-pongs, "
              f"{tot['wsk']} '... Wskaż.' lines, {tot['thin']} home stages under 4 interactions")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1] if len(sys.argv) > 1 else "all")
