# Segmenter

This folder holds the local Python service that does the segmentation work.

I split it out from the Next app on purpose. The browser is fine for preview tricks, but I do not want the actual subject isolation stack living entirely inside `ffmpeg.wasm` hacks and client memory limits.

## What it does

Right now the service:

- accepts a video upload
- extracts the first frame with `ffmpeg`
- loads `SAM 2` if the runtime is available
- runs image prediction with a default center-box prompt
- returns a simplified mask result back to the app

If the model runtime is missing, it falls back to a deterministic placeholder response so the rest of the app still works.

## Files

- [main.py](C:\Users\Taz\Rotoscope\segmenter\main.py): FastAPI entrypoint
- [models.py](C:\Users\Taz\Rotoscope\segmenter\models.py): request/response shapes
- [service.py](C:\Users\Taz\Rotoscope\segmenter\service.py): service layer
- [providers/sam2_provider.py](C:\Users\Taz\Rotoscope\segmenter\providers\sam2_provider.py): real model loading and fallback logic
- [video.py](C:\Users\Taz\Rotoscope\segmenter\video.py): frame extraction
- [runtime.py](C:\Users\Taz\Rotoscope\segmenter\runtime.py): runtime config
- [run_segmenter.ps1](C:\Users\Taz\Rotoscope\segmenter\run_segmenter.ps1): local launch script

## Install

Base dependencies:

```powershell
python -m pip install --target .segmenter-packages -r segmenter\requirements.txt
```

If you want real `SAM 2` inference instead of fallback mode:

```powershell
python -m pip install --target .segmenter-packages torch torchvision --index-url https://download.pytorch.org/whl/cu128
python -m pip install --target .segmenter-packages git+https://github.com/facebookresearch/sam2.git
```

## Run

```powershell
.\segmenter\run_segmenter.ps1
```

That script sets `PYTHONPATH` for the workspace-local package directory and uses the default checkpoint if it exists.

## Current limitation

This is not full video tracking yet.

The current live path is good enough to prove out local inference and subject selection, but the next real milestone is mask propagation across frames and storing richer mask data than a simple bounding rectangle.
