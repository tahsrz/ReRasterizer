from __future__ import annotations

import tempfile
from pathlib import Path

from segmenter.bootstrap import bootstrap_pythonpath

bootstrap_pythonpath()

import numpy as np
from PIL import Image

from segmenter.models import MaskRect, SegmentRequest, SegmentResponse
from segmenter.runtime import load_runtime_config
from segmenter.video import extract_first_frame

try:
    import torch
    from sam2.build_sam import build_sam2
    from sam2.sam2_image_predictor import SAM2ImagePredictor
except ImportError:  # pragma: no cover - depends on local ML runtime
    torch = None
    build_sam2 = None
    SAM2ImagePredictor = None


class Sam2Provider:
    """
    Thin adapter around the future SAM 2 runtime.

    Right now this returns deterministic fallback boxes so the app can integrate
    against a stable API before model weights and frame decoding are added.
    """

    def __init__(self) -> None:
        self.runtime = load_runtime_config()
        self._predictor = None
        self._model_notes: list[str] = []

    def segment(self, request: SegmentRequest, video_bytes: bytes | None = None) -> SegmentResponse:
        predictor = self._get_predictor()
        if predictor and video_bytes:
            return self._run_live(request, video_bytes, predictor)
        return self._run_fallback(request, extra_note=self._build_fallback_reason(video_bytes))

    def _get_predictor(self):
        if self._predictor is not None:
            return self._predictor
        if not (torch and build_sam2 and SAM2ImagePredictor):
            self._model_notes = ["Python packages `torch` and `sam2` are not installed in this environment."]
            return None
        if not self.runtime.checkpoint_path:
            self._model_notes = ["`SAM2_CHECKPOINT` is not set."]
            return None
        if not Path(self.runtime.checkpoint_path).exists():
            self._model_notes = [f"Checkpoint not found: {self.runtime.checkpoint_path}"]
            return None

        try:
            model = build_sam2(self.runtime.model_config, self.runtime.checkpoint_path, device=self.runtime.device)
            self._predictor = SAM2ImagePredictor(model)
            self._model_notes = [
                f"Loaded SAM 2 checkpoint from {self.runtime.checkpoint_path}",
                f"Using config {self.runtime.model_config}",
                f"Running on device {self.runtime.device}",
            ]
            return self._predictor
        except Exception as exc:  # pragma: no cover - depends on local ML runtime
            self._model_notes = [f"Model load failed: {exc}"]
            return None

    def _run_live(self, request: SegmentRequest, video_bytes: bytes, predictor) -> SegmentResponse:
        with tempfile.TemporaryDirectory(dir=self.runtime.cache_dir) as temp_dir:
            temp_path = Path(temp_dir)
            video_path = temp_path / request.asset.file_name
            frame_path = temp_path / "frame0.png"
            video_path.write_bytes(video_bytes)
            extract_first_frame(video_path, frame_path)

            image = np.array(Image.open(frame_path).convert("RGB"))
            height, width = image.shape[:2]
            box = np.array([request.prompt_box or self._default_box(width, height)], dtype=np.float32)

            with torch.inference_mode():
                if self.runtime.device.startswith("cuda"):
                    autocast_ctx = torch.autocast(self.runtime.device, dtype=torch.bfloat16)
                else:
                    autocast_ctx = torch.autocast("cpu", enabled=False)
                with autocast_ctx:
                    predictor.set_image(image)
                    masks, scores, _ = predictor.predict(box=box, multimask_output=False)

            if len(masks) == 0:
                return self._run_fallback(request, extra_note="SAM 2 returned no masks for the default prompt.")

            mask = masks[0]
            score = float(scores[0]) if len(scores) else 0.0
            rect = self._mask_to_rect(mask, width, height)

            return SegmentResponse(
                mode="live",
                width=width,
                height=height,
                confidence=score,
                mask_rects=[rect],
                notes=[
                    "SAM 2 image predictor ran on the first extracted video frame.",
                    "Prompt strategy: default center box unless UI prompt box is provided.",
                    *self._model_notes,
                ],
                model_loaded=True,
            )

    def _run_fallback(self, request: SegmentRequest, extra_note: str | None = None) -> SegmentResponse:
        base = max(320, min(1080, round(request.asset.size_bytes / 1200)))
        width = round(base * 0.56)
        height = base

        notes = [
            "SAM 2 model weights are not attached yet.",
            "Returning deterministic fallback subject regions from asset metadata.",
            "This endpoint contract is stable and ready to be backed by real inference.",
        ]
        if extra_note:
            notes.append(extra_note)
        notes.extend(self._model_notes)

        return SegmentResponse(
            mode="mock",
            width=width,
            height=height,
            confidence=0.67,
            mask_rects=[
                MaskRect(x=width * 0.22, y=height * 0.12, width=width * 0.5, height=height * 0.7),
                MaskRect(x=width * 0.18, y=height * 0.58, width=width * 0.18, height=height * 0.2),
            ],
            notes=notes,
            model_loaded=False,
        )

    def _build_fallback_reason(self, video_bytes: bytes | None) -> str:
        if video_bytes is None:
            return "No video bytes were provided to the segmenter."
        if self._model_notes:
            return self._model_notes[0]
        return "Falling back because SAM 2 runtime is not ready."

    @staticmethod
    def _default_box(width: int, height: int) -> list[float]:
        return [width * 0.18, height * 0.1, width * 0.82, height * 0.9]

    @staticmethod
    def _mask_to_rect(mask: np.ndarray, width: int, height: int) -> MaskRect:
        ys, xs = np.where(mask > 0)
        if len(xs) == 0 or len(ys) == 0:
            return MaskRect(x=width * 0.2, y=height * 0.15, width=width * 0.55, height=height * 0.7)
        min_x = float(xs.min())
        max_x = float(xs.max())
        min_y = float(ys.min())
        max_y = float(ys.max())
        return MaskRect(x=min_x, y=min_y, width=max_x - min_x, height=max_y - min_y)
