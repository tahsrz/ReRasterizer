import { NextResponse } from "next/server";

import { publicEnv } from "@/lib/env";

export async function POST(request: Request) {
  const incoming = await request.formData();
  const projectId = String(incoming.get("projectId") ?? "");
  const title = String(incoming.get("title") ?? "");
  const memePack = String(incoming.get("memePack") ?? "");
  const promptBox = incoming.get("promptBox");
  const file = incoming.get("file");
  const { segmenterUrl } = publicEnv();

  if (!projectId || !title || !memePack || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing segmentation inputs" }, { status: 400 });
  }

  try {
    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("title", title);
    formData.append("meme_pack", memePack);
    formData.append("file", file, file.name);
    if (typeof promptBox === "string" && promptBox.trim()) {
      formData.append("prompt_box", promptBox);
    }

    const response = await fetch(`${segmenterUrl}/segment`, {
      method: "POST",
      body: formData,
      cache: "no-store"
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: "Segmenter request failed", detail }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({
      result: {
        mode: data.mode,
        width: data.width,
        height: data.height,
        confidence: data.confidence,
        maskRects: data.mask_rects,
        notes: data.notes,
        modelLoaded: Boolean(data.model_loaded)
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Segmenter unavailable",
        detail: error instanceof Error ? error.message : "Unknown segmenter error"
      },
      { status: 503 }
    );
  }
}
