from __future__ import annotations

from segmenter.bootstrap import bootstrap_pythonpath

bootstrap_pythonpath()

from fastapi import FastAPI, File, Form, UploadFile

from segmenter.models import SegmentRequest, SegmentResponse
from segmenter.service import SegmenterService


app = FastAPI(title="Rotoscope SAM 2 Segmenter", version="0.1.0")
service = SegmenterService()


@app.get("/health")
def health() -> dict[str, bool | str]:
    return {"ok": True, "service": "segmenter"}


@app.post("/segment", response_model=SegmentResponse)
async def segment(
    project_id: str = Form(...),
    title: str = Form("Untitled Remix"),
    meme_pack: str = Form("chaotic-commentary"),
    transcript_hint: str | None = Form(None),
    prompt_box: str | None = Form(None),
    file: UploadFile = File(...),
) -> SegmentResponse:
    video_bytes = await file.read()
    request = SegmentRequest(
        project_id=project_id,
        title=title,
        meme_pack=meme_pack,
        transcript_hint=transcript_hint,
        prompt_box=[float(value) for value in prompt_box.split(",")] if prompt_box else None,
        asset={
            "file_name": file.filename or "upload.mp4",
            "content_type": file.content_type or "video/mp4",
            "size_bytes": len(video_bytes),
        },
    )
    return service.segment(request, video_bytes=video_bytes)
