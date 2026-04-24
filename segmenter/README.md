# SAM 2 Segmenter Service

This folder contains the local Python service for subject segmentation and mask propagation.

## Purpose

The web app should not run real `SAM 2` inference in the browser. Instead, it calls this service for:

- keyframe subject segmentation
- mask metadata generation
- later: mask propagation across video frames

## Current state

This is a **production-shaped scaffold**:

- FastAPI server
- typed request/response models
- `SAM 2` adapter boundary
- deterministic fallback when `SAM 2` is not installed yet

The fallback keeps the app functional while we wire the real model.

## Files

- `main.py`: FastAPI app and routes
- `models.py`: request and response schemas
- `service.py`: orchestration logic
- `providers/sam2_provider.py`: adapter that can later host real `SAM 2`
- `requirements.txt`: Python dependencies

## Run locally

```powershell
python -m pip install --target .segmenter-packages -r segmenter\requirements.txt
.\segmenter\run_segmenter.ps1
```

If you also want real `SAM 2` inference instead of fallback masks:

```powershell
python -m pip install --target .segmenter-packages torch torchvision --index-url https://download.pytorch.org/whl/cu128
python -m pip install --target .segmenter-packages git+https://github.com/facebookresearch/sam2.git
```

The repo now includes a tested default checkpoint location:

`checkpoints/sam2.1_hiera_tiny.pt`

If that file exists, `segmenter/runtime.py` will pick it up automatically.

## Planned next step

Replace the fallback logic in `providers/sam2_provider.py` with:

1. real frame decoding
2. real `SAM 2` checkpoint loading
3. prompted segmentation on representative frames
4. persistent mask outputs
