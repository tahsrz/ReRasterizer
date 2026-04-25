# ReRasterizer

This is a personal rotoscoping sandbox I’m building for myself.

The short version:

- drop in a video clip
- isolate the main subject with `SAM 2`
- preview a stylized treatment in the browser
- keep iterating until the clip feels weird, sharp, or funny enough to export

I may eventually bend this into something more specialized for real-estate asset creation, but that is not the main goal right now. Right now I want a tool that is fun to use and fast to experiment with.

## What’s in here

There are two main parts:

1. A Next.js app for the UI, uploads, project state, caption ideas, and browser-side preview work
2. A local Python segmenter service for `SAM 2`

The frontend lives in:

- [app](C:\Users\Taz\Rotoscope\app)
- [components](C:\Users\Taz\Rotoscope\components)
- [lib](C:\Users\Taz\Rotoscope\lib)

The segmentation service lives in:

- [segmenter](C:\Users\Taz\Rotoscope\segmenter)

## Current state

What works today:

- project scaffold in Next.js App Router
- Google auth wiring through NextAuth
- Mongo-backed project and job records
- Cloudinary signed upload flow
- AI caption suggestion endpoint
- local `SAM 2` service boundary
- real `SAM 2` model loading path when the local runtime is available
- browser-side preview rendering with `ffmpeg.wasm`

What is still rough:

- segmentation is currently first-frame focused, not full multi-frame propagation
- render jobs are not yet handed off to a real background worker
- the UI is still closer to a working lab than a polished editor
- mask output is still simplified for preview instead of being a full asset pipeline

## Why I built it this way

I did not want to make the whole thing browser-only.

`ffmpeg.wasm` is useful for preview and small client-side work, but real segmentation and heavier render steps belong in a local or hosted backend. That is why the repo is split between the web app and a Python segmenter instead of trying to cram everything into one tab.

## Running the app

### Web app

```powershell
npm install
npm run dev
```

Then open:

`http://127.0.0.1:3000`

### Segmenter

The segmenter is a separate local process.

Basic install:

```powershell
python -m pip install --target .segmenter-packages -r segmenter\requirements.txt
```

Start it:

```powershell
.\segmenter\run_segmenter.ps1
```

By default it looks for the tiny checkpoint here:

`checkpoints/sam2.1_hiera_tiny.pt`

## Environment

Create a `.env.local` file in the repo root.

Minimal app config:

```env
NEXT_PUBLIC_API_DOMAIN=http://127.0.0.1:3000
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
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
```

Optional AI caption providers:

```env
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile

OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-4.1-mini
```

Segmenter config:

```env
SEGMENTER_URL=http://127.0.0.1:8001
SAM2_CHECKPOINT=C:\Users\Taz\Rotoscope\checkpoints\sam2.1_hiera_tiny.pt
SAM2_MODEL_CONFIG=configs/sam2.1/sam2.1_hiera_t.yaml
SAM2_DEVICE=cuda
```

If the caption provider keys are missing, the app falls back to local caption templates.

## Repo layout

```text
app/            Next.js routes and API handlers
components/     UI pieces
lib/            app services, auth, db, ffmpeg, SAM client
segmenter/      local FastAPI service for SAM 2
types/          shared TypeScript types
checkpoints/    local model weights (gitignored)
```

## Personal notes

This project is intentionally opinionated toward solo use:

- I care more about quick iteration than enterprise polish
- I want local control over the segmentation stack
- I want the architecture to stay simple enough that I can keep moving without babysitting infrastructure all day

If this becomes more than a personal tool later, great. But I’d rather it be a genuinely useful private tool first than a “startup-ready” repo that never gets used.

## Next things I’d like to add

1. Better prompt control for segmentation instead of only the default center-box flow
2. Real multi-frame mask propagation
3. Native backend render jobs instead of preview-only browser exports
4. Cleaner timeline editing
5. Better audio workflow, including narration / voice track generation
