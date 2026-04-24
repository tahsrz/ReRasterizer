from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class RuntimeConfig:
    checkpoint_path: str | None
    model_config: str
    device: str
    cache_dir: Path


def load_runtime_config() -> RuntimeConfig:
    workspace_root = Path(__file__).resolve().parent.parent
    default_checkpoint = workspace_root / "checkpoints" / "sam2.1_hiera_tiny.pt"
    cache_dir = Path(os.environ.get("SEGMENTER_CACHE_DIR", ".segmenter-cache")).resolve()
    cache_dir.mkdir(parents=True, exist_ok=True)
    return RuntimeConfig(
        checkpoint_path=os.environ.get("SAM2_CHECKPOINT") or (str(default_checkpoint) if default_checkpoint.exists() else None),
        model_config=os.environ.get("SAM2_MODEL_CONFIG", "configs/sam2.1/sam2.1_hiera_t.yaml"),
        device=os.environ.get("SAM2_DEVICE", "cuda"),
        cache_dir=cache_dir,
    )
