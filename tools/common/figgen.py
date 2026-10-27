"""Stage 1 of the make_fig pipeline: prompt (+ optional references) -> PNG.

Talks to the OpenAI image API over plain HTTP so the pipeline carries no SDK
dependency. The key is read from D:\\Project\\ai\\.env and is never printed,
logged or echoed back.

Two endpoints, picked automatically:
  * no references  -> /v1/images/generations
  * references     -> /v1/images/edits   (multipart, one image[] part per ref)
"""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import sys
import time
from pathlib import Path
from typing import Any

import requests

API_ROOT = "https://api.openai.com/v1"
DEFAULT_MODEL = "gpt-image-2.5-sunburst"

# Walk up from this file looking for the .env that holds OPENAI_API_KEY.
ENV_CANDIDATES = [
    Path(r"D:\Project\ai\.env"),
    Path(__file__).resolve().parents[2] / ".env",
    Path(__file__).resolve().parents[1] / ".env",
]


class GenError(RuntimeError):
    pass


def read_key() -> str:
    """Return the API key. Never log the value, only its presence."""
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if key:
        return key
    for env in ENV_CANDIDATES:
        if not env.is_file():
            continue
        for line in env.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, _, value = line.partition("=")
            if name.strip() == "OPENAI_API_KEY":
                return value.strip().strip('"').strip("'")
    raise GenError(
        "OPENAI_API_KEY not found. Looked in the environment and in: "
        + ", ".join(str(p) for p in ENV_CANDIDATES)
    )


def _decode(payload: dict[str, Any], out: Path) -> list[Path]:
    items = payload.get("data") or []
    if not items:
        raise GenError("API returned no images: " + json.dumps(payload)[:400])

    written: list[Path] = []
    for i, item in enumerate(items):
        b64 = item.get("b64_json")
        if b64:
            blob = base64.b64decode(b64)
        elif item.get("url"):
            blob = requests.get(item["url"], timeout=120).content
        else:
            raise GenError("image entry had neither b64_json nor url")

        target = out if len(items) == 1 else out.with_name(f"{out.stem}-{i + 1}{out.suffix}")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(blob)
        written.append(target)
    return written


def generate(
    prompt: str,
    out: Path,
    refs: list[Path] | None = None,
    model: str = DEFAULT_MODEL,
    size: str = "1024x1024",
    quality: str = "low",
    background: str = "transparent",
    n: int = 1,
    timeout: int = 600,
) -> list[Path]:
    """Generate one or more images. Returns the paths actually written."""
    key = read_key()
    headers = {"Authorization": f"Bearer {key}"}
    refs = [Path(r) for r in (refs or [])]

    for r in refs:
        if not r.is_file():
            raise GenError(f"reference image not found: {r}")

    started = time.time()
    if refs:
        url = f"{API_ROOT}/images/edits"
        files: list[tuple[str, Any]] = []
        for r in refs:
            mime = mimetypes.guess_type(r.name)[0] or "image/png"
            files.append(("image[]", (r.name, r.read_bytes(), mime)))
        data = {
            "model": model,
            "prompt": prompt,
            "size": size,
            "quality": quality,
            "background": background,
            "n": str(n),
        }
        resp = requests.post(url, headers=headers, data=data, files=files, timeout=timeout)
    else:
        url = f"{API_ROOT}/images/generations"
        body = {
            "model": model,
            "prompt": prompt,
            "size": size,
            "quality": quality,
            "background": background,
            "n": n,
            "output_format": "png",
        }
        resp = requests.post(url, headers=headers, json=body, timeout=timeout)

    if resp.status_code != 200:
        # The error body can echo the request but never the key.
        raise GenError(f"HTTP {resp.status_code} from {url}: {resp.text[:600]}")

    written = _decode(resp.json(), out)
    elapsed = time.time() - started
    for p in written:
        print(f"  wrote {p}  ({p.stat().st_size // 1024} kB, {elapsed:.1f}s)")
    return written


def add_arguments(ap) -> None:
    ap.add_argument("prompt", help="what to draw")
    ap.add_argument("-o", "--out", required=True, type=Path, help="output .png")
    ap.add_argument("-r", "--ref", action="append", default=[], type=Path,
                    help="reference image; repeatable")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    # The API takes free-form WIDTHxHEIGHT (it suggests 1824x1024 itself),
    # so a fixed choices list would only get in the way.
    ap.add_argument("--size", default="1024x1024", help="WIDTHxHEIGHT or auto")
    # low by default: measured 8 paths / 4 colours against high's 13 / 8 on the
    # same prompt, in 13s instead of 31s. Extra fidelity only adds detail that
    # the palette flattening throws away again.
    ap.add_argument("--quality", default="low", choices=["low", "medium", "high", "auto"])
    ap.add_argument("--background", default="transparent",
                    choices=["transparent", "opaque", "auto"])
    ap.add_argument("-n", type=int, default=1, help="how many variants")


def run(args) -> int:
    try:
        generate(
            prompt=args.prompt,
            out=args.out,
            refs=args.ref,
            model=args.model,
            size=args.size,
            quality=args.quality,
            background=args.background,
            n=args.n,
        )
    except GenError as exc:
        print(f"generate failed: {exc}", file=sys.stderr)
        return 1
    return 0
