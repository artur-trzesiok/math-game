"""Run make_audio.py with the ElevenLabs key taken from a .env file (never printed).

  python tools/audio/run.py --voices
  python tools/audio/run.py                 # every lesson, every language
  python tools/audio/run.py bigger_smaller_pro
  python tools/audio/run.py --sfx           # the sound effects (make_sfx.py)
  python tools/audio/run.py --music         # the places' music and the weather loops (make_music.py)

Takes ELEVENLABS_* from the first of ENV_FILES that has the key (the repository's .env first),
falling back to the environment.
"""
import os
import runpy
import sys
from pathlib import Path

ENV_FILES = [Path(__file__).resolve().parents[2] / ".env", Path(r"D:/Project/ai/.env")]

# the repository's .env wins over the environment (a stale key may sit in the user's env)
for f in ENV_FILES:
    if not f.exists():
        continue
    found = False
    for line in f.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.strip().startswith("ELEVENLABS_") and "=" in line:
            k, v = line.strip().split("=", 1)
            os.environ[k] = v.strip().strip('"').strip("'"); found = found or k == "ELEVENLABS_API_KEY"
    if found:
        break
if not os.environ.get("ELEVENLABS_API_KEY"):
    raise SystemExit("no ELEVENLABS_API_KEY in the environment or in " + ", ".join(map(str, ENV_FILES)))
# --sfx: the sound effects (make_sfx.py) instead of the voices
if sys.argv[1:2] == ["--sfx"]:
    sys.argv = [str(Path(__file__).with_name("make_sfx.py")), *sys.argv[2:]]
elif sys.argv[1:2] == ["--music"]:                  # the places' music and the weather loops (make_music.py)
    sys.argv = [str(Path(__file__).with_name("make_music.py")), *sys.argv[2:]]
else:
    sys.argv = [str(Path(__file__).with_name("make_audio.py")), *sys.argv[1:]]
runpy.run_path(sys.argv[0], run_name="__main__")
