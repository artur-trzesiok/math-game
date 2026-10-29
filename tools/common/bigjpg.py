"""Upscale an image through Bigjpg (borrowed from OIDbook apps/api/upscale.py).

Bigjpg only takes a public URL: the PNG goes over SFTP to the OIDbook VPS (account `bigjpg`, served at
BIGJPG_PUBLIC_URL) for the time of the job and is deleted after. Keys: BIGJPG_* in the repository's .env (the
SFTP host key is pinned, so the password never goes to another server).

    from bigjpg import upscale
    png_bytes = upscale(Path("in.png").read_bytes(), name="tlo", scale=2)    # 2, 4, 8 or 16
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import time
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import paramiko

ENV = Path(__file__).resolve().parents[2] / ".env"
CREATE = "https://bigjpg.com/api/task/"
STATUS = "https://bigjpg.com/api/task/{tid}"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
X2 = {2: "1", 4: "2", 8: "3", 16: "4"}     # Bigjpg's x2 field is the number of doublings


class BigjpgError(RuntimeError):
    pass


def _cfg() -> dict[str, str]:
    c = {k: v for k, v in os.environ.items() if k.startswith("BIGJPG_")}
    if ENV.is_file():
        for line in ENV.read_text(encoding="utf-8", errors="replace").splitlines():
            k, _, v = line.partition("=")
            if k.strip().startswith("BIGJPG_") and k.strip() not in c:
                c[k.strip()] = v.strip().strip('"').strip("'")
    for k in ("BIGJPG_API_KEY", "BIGJPG_PUBLIC_URL", "BIGJPG_SFTP_HOST", "BIGJPG_SFTP_USER", "BIGJPG_SFTP_PASSWORD", "BIGJPG_SFTP_HOST_KEY"):
        if not c.get(k):
            raise BigjpgError(f"{k} is empty (.env)")
    return c


def _sftp(c: dict[str, str]):
    host, port = c["BIGJPG_SFTP_HOST"], int(c.get("BIGJPG_SFTP_PORT") or 22)
    typ, key = c["BIGJPG_SFTP_HOST_KEY"].split()[:2]
    cl = paramiko.SSHClient()
    cl.get_host_keys().add(host if port == 22 else f"[{host}]:{port}", typ, paramiko.PKey.from_type_string(typ, base64.b64decode(key)))
    cl.set_missing_host_key_policy(paramiko.RejectPolicy())
    cl.connect(host, port=port, username=c["BIGJPG_SFTP_USER"], password=c["BIGJPG_SFTP_PASSWORD"], allow_agent=False,
               look_for_keys=False, timeout=30, banner_timeout=30, auth_timeout=30)
    sf = cl.open_sftp()
    if (d := c.get("BIGJPG_SFTP_DIR", ".").strip()) not in ("", "."):
        sf.chdir(d)
    return cl, sf


def _json(req: Request) -> dict:
    with urlopen(req, timeout=300) as r:
        out = json.loads(r.read().decode("utf-8"))
    if not isinstance(out, dict):
        raise BigjpgError(f"unexpected Bigjpg response: {out!r}")
    return out


def _run(data: bytes, remote: str, scale: int, style: str, noise: str, c: dict[str, str]) -> bytes:
    cl, sf = _sftp(c)
    try:
        sf.putfo(BytesIO(data), remote)
    finally:
        cl.close()
    try:
        hdr = {"User-Agent": UA, "Accept": "application/json", "X-API-KEY": c["BIGJPG_API_KEY"]}
        body = json.dumps({"style": style, "noise": noise, "x2": X2[scale], "file_name": remote,
                           "input": f"{c['BIGJPG_PUBLIC_URL'].rstrip('/')}/{quote(remote)}"}).encode()
        made = _json(Request(CREATE, method="POST", data=body, headers={**hdr, "Content-Type": "application/json"}))
        tid = made.get("tid")
        if not tid:
            raise BigjpgError(f"Bigjpg create failed: {made}")
        end = time.monotonic() + 1500
        while True:
            if time.monotonic() > end:
                raise BigjpgError(f"Bigjpg timed out, tid={tid}")
            st = _json(Request(STATUS.format(tid=tid), headers=hdr)).get(tid) or {}
            if st.get("status") == "success":
                break
            if st.get("status") == "error":
                raise BigjpgError(f"Bigjpg error: {st}")
            time.sleep(2)
        with urlopen(Request(st["url"], headers={"User-Agent": UA, "Accept": "*/*"}), timeout=300) as r:
            return r.read()
    finally:
        try:
            cl, sf = _sftp(c)
            try:
                sf.remove(remote)
            finally:
                cl.close()
        except Exception as e:  # noqa: BLE001
            print(f"bigjpg: could not delete the public copy {remote}: {e}")


def upscale(data: bytes, *, name: str = "image", scale: int = 2, style: str = "art", noise: str = "0") -> bytes:
    """PNG/JPEG bytes in, Bigjpg's result bytes out (usually a JPEG). Retries network errors."""
    if scale not in X2:
        raise BigjpgError(f"scale must be one of {list(X2)}")
    c = _cfg()
    remote = f"mathgame_{hashlib.sha1(name.encode() + data).hexdigest()[:16]}.png"
    for attempt in range(5):
        try:
            return _run(data, remote, scale, style, noise, c)
        except (HTTPError, URLError, TimeoutError, paramiko.SSHException, OSError) as e:
            if isinstance(e, HTTPError) and e.code not in (429, 500, 502, 503, 504) or attempt == 4:
                raise BigjpgError(f"Bigjpg failed: {e}") from e
            time.sleep(min(2 * 2 ** attempt, 60))
    raise BigjpgError("unreachable")
