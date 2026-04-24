import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/repositories";

const createProjectSchema = z.object({
  title: z.string().min(1).max(120),
  creative: z.object({
    memePack: z.enum(["chaotic-commentary", "brainrot-breakdown", "anime-hype", "sports-takeover"]),
    captionTop: z.string().max(160),
    captionBottom: z.string().max(160),
    fps: z.number().int().min(8).max(24),
    edgeMix: z.number().min(0).max(1),
    posterize: z.number().int().min(1).max(12)
  })
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const projects = await listProjects(session?.user?.id);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const input = createProjectSchema.parse(body);
  const project = await createProject({
    userId: session?.user?.id ?? null,
    title: input.title,
    status: "draft",
    sourceAsset: null,
    latestMaskJobId: null,
    latestRenderJobId: null,
    creative: input.creative
  });
  return NextResponse.json({ project }, { status: 201 });
}
