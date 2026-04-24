from __future__ import annotations

import os
import site
from pathlib import Path


def bootstrap_pythonpath() -> None:
    root = Path(__file__).resolve().parent.parent
    extra_dirs = [
        root / ".segmenter-packages",
    ]

    env_extra = os.environ.get("SEGMENTER_EXTRA_SITE_DIR", "")
    if env_extra:
        extra_dirs.extend(Path(value) for value in env_extra.split(os.pathsep) if value)

    for directory in extra_dirs:
        if directory.exists():
            site.addsitedir(str(directory))
