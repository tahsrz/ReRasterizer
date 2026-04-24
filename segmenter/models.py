from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class SegmentAsset(BaseModel):
    file_name: str = Field(..., min_length=1)
    content_type: str = Field(default="video/mp4")
    size_bytes: int = Field(..., ge=1)


class SegmentRequest(BaseModel):
    project_id: str = Field(..., min_length=1)
    asset: SegmentAsset
    title: str = Field(default="Untitled Remix")
    meme_pack: str = Field(default="chaotic-commentary")
    transcript_hint: str | None = None
    prompt_box: list[float] | None = None


class MaskRect(BaseModel):
    x: float
    y: float
    width: float
    height: float


class SegmentResponse(BaseModel):
    mode: Literal["mock", "live"]
    width: int
    height: int
    confidence: float
    mask_rects: list[MaskRect]
    notes: list[str]
    model_loaded: bool = False
