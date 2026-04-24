"use client";

import { apiCreateSegmentation } from "@/lib/api";

export type Sam2SegmentationResult = {
  mode: "mock" | "live";
  width: number;
  height: number;
  confidence: number;
  maskRects: Array<{ x: number; y: number; width: number; height: number }>;
  notes: string[];
  modelLoaded?: boolean;
};

function inferFakeMaskDimensions(file: File) {
  const base = Math.max(320, Math.min(1080, Math.round(file.size / 1200)));
  return {
    width: Math.round(base * 0.56),
    height: base
  };
}

export async function runSam2Segmentation(input: {
  file: File;
  projectId: string;
  title: string;
  memePack: string;
}): Promise<Sam2SegmentationResult> {
  try {
    const response = await apiCreateSegmentation({
      projectId: input.projectId,
      title: input.title,
      memePack: input.memePack as "chaotic-commentary" | "brainrot-breakdown" | "anime-hype" | "sports-takeover",
      file: input.file
    });
    return response.result;
  } catch {
    return fallbackSegmentation(input.file);
  }
}

export function fallbackSegmentation(file: File): Sam2SegmentationResult {
  const dims = inferFakeMaskDimensions(file);

  return {
    mode: "mock",
    width: dims.width,
    height: dims.height,
    confidence: 0.67,
    maskRects: [
      { x: dims.width * 0.22, y: dims.height * 0.12, width: dims.width * 0.5, height: dims.height * 0.7 },
      { x: dims.width * 0.18, y: dims.height * 0.58, width: dims.width * 0.18, height: dims.height * 0.2 }
    ],
    notes: [
      "SAM 2 segmenter request failed, so the client fell back to a local placeholder.",
      "Mock subject region generated from file metadata to keep the UI and mask-repair flow moving.",
      "Start the Python segmenter and install SAM 2 dependencies to enable live inference."
    ],
    modelLoaded: false
  };
}

export function createMaskPreview(result: Sam2SegmentationResult) {
  const rects = result.maskRects
    .map(
      (rect, index) =>
        `Mask ${index + 1}: x=${rect.x.toFixed(0)} y=${rect.y.toFixed(0)} w=${rect.width.toFixed(0)} h=${rect.height.toFixed(0)}`
    )
    .join("\n");

  return [
    `SAM 2 mode: ${result.mode}`,
    `Canvas: ${result.width}x${result.height}`,
    `Confidence: ${(result.confidence * 100).toFixed(1)}%`,
    rects,
    "",
    ...result.notes
  ].join("\n");
}
