import { NextResponse } from "next/server";
import { z } from "zod";

import { getProject, updateProject } from "@/lib/repositories";

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  status: z.enum(["draft", "uploaded", "segmenting", "ready", "rendering", "complete"]).optional(),
  sourceAsset: z
    .object({
      publicId: z.string(),
      secureUrl: z.string().url(),
      bytes: z.number().optional(),
      duration: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      format: z.string().optional(),
      resourceType: z.string().optional()
    })
    .optional(),
  latestMaskJobId: z.string().nullable().optional(),
  latestRenderJobId: z.string().nullable().optional()
});

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await request.json();
  const updates = patchSchema.parse(body);
  const project = await updateProject(projectId, updates);
  return NextResponse.json({ project });
}
