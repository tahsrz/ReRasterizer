import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { createJob, updateProject } from "@/lib/repositories";

const createJobSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(["ingest", "segment", "render"]),
  payload: z.record(z.string(), z.unknown())
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const input = createJobSchema.parse(body);

  const provider = input.type === "segment" ? "sam2" : input.type === "render" ? "ffmpeg" : "cloudinary";
  const job = await createJob({
    projectId: input.projectId,
    userId: session?.user?.id ?? null,
    type: input.type,
    status: "queued",
    progress: 0,
    provider,
    payload: input.payload,
    result: {
      placeholder:
        input.type === "segment"
          ? "Hook this to the Python SAM 2 worker."
          : input.type === "render"
            ? "Hook this to the native ffmpeg worker."
            : "Hook this to ingest metadata extraction."
    },
    error: null
  });

  if (input.type === "segment") {
    await updateProject(input.projectId, { latestMaskJobId: job._id ?? null, status: "segmenting" });
  }
  if (input.type === "render") {
    await updateProject(input.projectId, { latestRenderJobId: job._id ?? null, status: "rendering" });
  }

  return NextResponse.json({ job }, { status: 201 });
}
