import { NextResponse } from "next/server";
import { z } from "zod";

import { suggestCaptions } from "@/lib/ai";

const schema = z.object({
  title: z.string().min(1).max(120),
  memePack: z.enum(["chaotic-commentary", "brainrot-breakdown", "anime-hype", "sports-takeover"]),
  transcriptHint: z.string().max(2000).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = schema.parse(body);
  const suggestions = await suggestCaptions(input);
  return NextResponse.json({ suggestions });
}
