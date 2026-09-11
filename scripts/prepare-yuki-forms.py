"""Build the two-form, multi-state Spine preview from state-labelled captures.

Frame sources (verified by content hash):
  Form A  (no glasses)  extracted/states_A:
      idle       = 77ed..bf3d   (indices 0-5)
      click      = reaction, indices 11-14
      idle_after = persistent state after one click, indices 6,7,8,9,10,18
      drag       = indices 15,16,17
  Form B  (glasses)     extracted/states_B:
      idle       = loop1, indices 10-15
      hover      = loop2, indices 16-21
      drag       = indices 26-29
      idle_after = loop3, indices 30-35

Cursor behaviour: when NOT hovering the mascot walks around (several loops);
when hovered it holds the hover loop; when dragged it uses the lifted loop.
Voice pools come from extracted/selected_voices (user-curated).
"""
import json
import shutil
import wave
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
A_DIR = Path(r"E:\OpenCode\PWN\extracted\formA_states2")
B_DIR = Path(r"E:\OpenCode\PWN\extracted\states_B")
SELECTED_VOICES = Path(r"E:\OpenCode\PWN\extracted\selected_voices")
# Model assets live outside public/pio because the build prunes pio/ when both
# stock mascots are disabled.
OUT = ROOT / "public/yuki"
OUT.mkdir(parents=True, exist_ok=True)

FRAME_INTERVAL = 0.134

# animation name: (source dir, [frame indices], loop?)
# Form A frames (formA_states2), verified by mirror analysis:
#   f000-005 = walking direction 1 (normal)
#   f006-011 = walking direction 2 (horizontal mirror of the above)  -> not a state
#   f012-015 = single-click sprite
#   f016-018 = drag / lifted
ANIMATIONS = {
    "idleA":       (A_DIR, [0, 1, 2, 3, 4, 5], True),    # not hovering
    "idleB":       (B_DIR, [10, 11, 12, 13, 14, 15], True),
    "hoverB":      (B_DIR, [16, 17, 18, 19, 20, 21], True),
    "dragB":       (B_DIR, [26, 27, 28, 29], True),
    "idleAfterB":  (B_DIR, [30, 31, 32, 33, 34, 35], True),
}

# Frames with explicit timestamps (seconds), matching the original mascot:
#   clickA = full single-click sequence, played once on hover/click:
#            A012(surprised) -> A013(open) -> A014(closed) -> A015(half) -> A013(open)
#   hoverA = the settled post-click idle: hold A013(open eyes) ~2s, then blink
#            periodically (A014 closed -> A015 half -> A013 open), looping.
#   dragA  = being held: hold the lifted pose A016 ~1.2s, then a quick struggle
#            twitch A017 -> A018, then back. (Measured from the original.)
FRAME_TIMES = {
    "clickA": [
        (0.0, A_DIR, 12),
        (0.134, A_DIR, 13),
        (0.268, A_DIR, 14),
        (0.402, A_DIR, 15),
        (0.536, A_DIR, 13),
    ],
    "hoverA": [
        (0.0, A_DIR, 13),
        (1.9, A_DIR, 14),
        (2.033, A_DIR, 15),
        (2.166, A_DIR, 13),
    ],
    "dragA": [
        (0.0, A_DIR, 16),
        (1.2, A_DIR, 17),
        (1.334, A_DIR, 18),
        (1.468, A_DIR, 16),
    ],
}

# Copy curated voice pools.
VOICE_POOL_KEYS = {
    "formA": {"click": "formA_click", "drag": "formA_drag"},
    "formB": {"click": "formB_click", "drag": "formB_drag"},
}
voices = {}
for form, pools in VOICE_POOL_KEYS.items():
    form_dir = OUT / "voices" / form
    form_dir.mkdir(parents=True, exist_ok=True)
    voices[form] = {}
    for kind, pool in pools.items():
        entries = []
        for src in sorted((SELECTED_VOICES / pool).glob("*.wav")):
            shutil.copyfile(src, form_dir / src.name)
            with wave.open(str(src)) as wav:
                entries.append({"file": f"voices/{form}/{src.name}",
                                "seconds": round(wav.getnframes() / wav.getframerate(), 3)})
        voices[form][kind] = entries

cache = {}


def load(dirp, index):
    key = (str(dirp), index)
    if key not in cache:
        im = Image.open(dirp / f"f{index:03d}_96x96.png").convert("RGBA")
        im.putdata([(r, g, b, a) if a else (0, 0, 0, 0) for r, g, b, a in im.getdata()])
        cache[key] = im
    return cache[key]


# Assign a stable attachment name per unique (dir,index).
attachments = {}
animations = {}
used = []   # ordered (dir,index,name)


def name_for(dirp, index):
    key = (str(dirp), index)
    for d, i, n in used:
        if (str(d), i) == key:
            return n
    tag = ('A' if dirp == A_DIR else 'B')
    n = f"{tag}{index:03d}"
    used.append((dirp, index, n))
    attachments[n] = {"type": "region", "path": n, "width": 96, "height": 96}
    return n


for anim, (dirp, indices, loop) in ANIMATIONS.items():
    seq = [name_for(dirp, i) for i in indices]
    keys = seq + ([seq[0]] if loop else [])
    animations[anim] = {"slots": {"sprite": {"attachment": [
        {"time": round(i * FRAME_INTERVAL, 3), "name": n} for i, n in enumerate(keys)]}}}

for anim, entries in FRAME_TIMES.items():
    animations[anim] = {"slots": {"sprite": {"attachment": [
        {"time": t, "name": name_for(dirp, index)} for t, dirp, index in entries]}}}

CELL, MARGIN, COLS = 100, 2, 8
rows = (len(used) + COLS - 1) // COLS
atlas_w = COLS * CELL + 2 * MARGIN
atlas_h = rows * CELL + 2 * MARGIN
atlas = Image.new("RGBA", (atlas_w, atlas_h))
region_lines = []
for slot, (dirp, index, n) in enumerate(used):
    x = MARGIN + (slot % COLS) * CELL
    y = MARGIN + (slot // COLS) * CELL
    atlas.paste(load(dirp, index), (x, y))
    region_lines.append(f"{n}\n  rotate: false\n  xy: {x}, {y}\n"
                        f"  size: 96, 96\n  orig: 96, 96\n  offset: 0, 0\n  index: -1")
atlas.save(OUT / "yuki.png")
header = (f"yuki.png\nsize: {atlas_w}, {atlas_h}\nformat: RGBA8888\n"
          "filter: Nearest, Nearest\nrepeat: none\npma: false")
(OUT / "yuki.atlas").write_text(header + "\n" + "\n".join(region_lines) + "\n")

skeleton = {
    "skeleton": {"spine": "4.2.0", "x": -48, "y": -48, "width": 96, "height": 96},
    "bones": [{"name": "root"}],
    "slots": [{"name": "sprite", "bone": "root", "attachment": name_for(A_DIR, 0)}],
    "skins": [{"name": "default", "attachments": {"sprite": attachments}}],
    "animations": animations,
}
(OUT / "yuki.json").write_text(json.dumps(skeleton, indent=2))

report = {
    "source_a": str(A_DIR), "source_b": str(B_DIR),
    "animations": list(animations),
    "frames": len(used),
    "voices": {form: {k: len(v) for k, v in pools.items()} for form, pools in voices.items()},
    "behaviour": "not hovering -> walking loops; hovering -> hover loop; "
                 "dragging -> lifted loop; click -> reaction then idle_after",
    "switch_trigger": "rapid consecutive left clicks -> change_mode.wav + yuki_spotlight.el",
    "frame_interval_seconds": FRAME_INTERVAL,
    "atlas": {"file": "yuki.png", "width": atlas_w, "height": atlas_h},
    "limitations": "GDI frame captures as Spine region attachments; not Cubism, "
                   "not the original state machine.",
}
(OUT / "provenance.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
(OUT / "voices.json").write_text(json.dumps(voices, indent=2, ensure_ascii=False))
print(json.dumps(report, indent=2, ensure_ascii=False))
