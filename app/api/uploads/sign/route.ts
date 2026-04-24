import { NextResponse } from "next/server";
import { z } from "zod";

import { configuredCloudinary, signUploadParams } from "@/lib/cloudinary";

const schema = z.object({
  projectId: z.string().min(1),
  fileName: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = schema.parse(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = `rotoscope/projects/${input.projectId}`;
  const sanitizedFileName = input.fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 48);
  const publicId = `${sanitizedFileName || "clip"}-${timestamp}`;
  const { cloudName, apiKey } = configuredCloudinary();
  const signature = signUploadParams({ folder, public_id: publicId, timestamp });

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    publicId,
    signature
  });
}
