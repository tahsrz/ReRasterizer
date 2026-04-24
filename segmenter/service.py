from __future__ import annotations

from segmenter.models import SegmentRequest, SegmentResponse
from segmenter.providers.sam2_provider import Sam2Provider


class SegmenterService:
    def __init__(self) -> None:
        self.provider = Sam2Provider()

    def segment(self, request: SegmentRequest, video_bytes: bytes | None = None) -> SegmentResponse:
        return self.provider.segment(request, video_bytes=video_bytes)
