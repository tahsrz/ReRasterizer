# Rotoscope Meme Lab

A browser-first prototype for turning an `mp4` into a rotoscope-style meme edit with:

- `ffmpeg.wasm` for client-side video processing
- a `SAM 2` adapter layer for subject segmentation
- an interactive cloth-mesh preview for mask recovery and stylized gap filling

## Personal-use direction

This repo is currently optimized for your own creative workflow first:

- upload a clip
- isolate the main subject
- generate a stylized rotoscope remix
- experiment quickly with captions, masks, and exports

The architecture still leaves room to evolve into a more specialized vertical product later, including real-estate asset extraction if you want to push it in that direction.

## Stack

- Next.js App Router
- React + TypeScript
- `@ffmpeg/ffmpeg`
- `@ffmpeg/util`
- Tailwind-style utility classes in component markup, backed by custom CSS

## What is implemented

- A full UI scaffold for upload, render settings, viral framing controls, and export flow.
- A browser FFmpeg service that loads `ffmpeg.wasm`, writes the uploaded source to a virtual FS, and assembles a stylized output.
- A `SAM 2` segmentation interface with a mock local fallback so the preview flow is wired even before real model weights are added.
- Your `TacticalCloth` interaction model adapted as a preview component for low-confidence region recovery.

## What still needs a real model asset

`SAM 2` itself is not bundled here yet. That part needs one of these:

1. browser-compatible SAM 2 weights plus a worker/inference wrapper
2. a local inference service that the frontend calls
3. an ONNX/WebGPU export of the model

The code is structured so we can swap that in without rewriting the UI.

## Run

```powershell
npm install
npm run dev
```

Then open `http://127.0.0.1:3000`

## Environment

Create a `.env.local` with the services you want enabled:

```env
NEXT_PUBLIC_API_DOMAIN=http://127.0.0.1:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
NEXT_PUBLIC_SEGMENTER_URL=http://127.0.0.1:8001

MONGODB_URI=mongodb+srv://...
MONGODB_DB=rotoscope

NEXTAUTH_SECRET=replace-me
NEXTAUTH_URL=http://127.0.0.1:3000
NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile

OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-4.1-mini

SEGMENTER_URL=http://127.0.0.1:8001
SAM2_CHECKPOINT=/absolute/path/to/sam2.1_hiera_tiny.pt
SAM2_MODEL_CONFIG=configs/sam2.1/sam2.1_hiera_t.yaml
SAM2_DEVICE=cuda
```

If `GROQ_API_KEY` and `OPENROUTER_API_KEY` are both missing, caption suggestions fall back to local templates.

## Key idea

The pipeline is intentionally split into three layers:

1. In-browser frame handling and video muxing with `ffmpeg.wasm`
2. Subject extraction via the `SAM 2` adapter
3. Viral treatment via captioning, meme packs, posterization, edge emphasis, and overlay behaviors

That separation makes it easier to move from a prototype into a serious creator tool without repainting the whole app each time the model layer changes.

## Current production-shaped pieces

- NextAuth route with Google sign-in support
- MongoDB-backed `projects` and `jobs`
- Cloudinary signed direct-to-video upload flow
- caption suggestion API using Groq or OpenRouter
- placeholder queued job creation for `SAM 2` and native `ffmpeg` workers
- local FastAPI `SAM 2` segmenter scaffold in `segmenter/`

## Real SAM 2 path

The segmenter now supports a real inference path when the Python runtime has:

- `torch`
- `sam2`
- a valid `SAM2_CHECKPOINT`
- a matching `SAM2_MODEL_CONFIG`
- `ffmpeg` available on `PATH`

Current live behavior:

1. the browser uploads the selected video file to the Next.js `/api/segmentations` route
2. that route forwards the video to the Python segmenter as multipart form data
3. the segmenter extracts the first frame with `ffmpeg`
4. `SAM 2` runs image prediction on that frame with a default center-box prompt
5. the service returns a mask-derived bounding rectangle plus confidence

If any of those dependencies are missing, the segmenter falls back to deterministic placeholder masks.

## Next implementation steps

1. Replace the mock `SAM 2` adapter with a Python service call.
2. Add a native `ffmpeg` worker that consumes queued render jobs.
3. Persist timeline edits and mask-repair deltas.
4. Add Stripe-based usage controls and premium export paths.
