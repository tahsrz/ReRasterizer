from __future__ import annotations

import subprocess
from pathlib import Path


def extract_first_frame(video_path: Path, output_path: Path) -> None:
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-vf",
        "select=eq(n\\,0)",
        "-vframes",
        "1",
        str(output_path),
    ]
    completed = subprocess.run(command, capture_output=True, text=True, check=False)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "ffmpeg failed to extract first frame")
