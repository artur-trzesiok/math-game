"""Run make_audio.py with the ElevenLabs key taken from a .env file (never printed).

  python tools/audio/run.py --voices
  python tools/audio/run.py                 # every lesson, every language
  python tools/audio/run.py bigger_smaller

Looks for ELEVENLABS_API_KEY in the environment, then in the files listed in ENV_FILES.
"""
import os
import runpy
import sys
from pathlib import Path

ENV_FILES = [Path(r"D:/Project/OIDbook/.env"), Path(r"D:/Project/ai/.env")]

if not os.environ.get("ELEVENLABS_API_KEY"):
    for f in ENV_FILES:
        if not f.exists():
            continue
        for line in f.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.strip().startswith("ELEVENLABS_API_KEY="):
                os.environ["ELEVENLABS_API_KEY"] = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
        if os.environ.get("ELEVENLABS_API_KEY"):
            break
if not os.environ.get("ELEVENLABS_API_KEY"):
    raise SystemExit("no ELEVENLABS_API_KEY in the environment or in " + ", ".join(map(str, ENV_FILES)))
sys.argv = [str(Path(__file__).with_name("make_audio.py")), *sys.argv[1:]]
runpy.run_path(sys.argv[0], run_name="__main__")
