import { NextResponse } from "next/server";

import { missingServerEnv, publicEnv } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    missingServerEnv: missingServerEnv(),
    publicEnv: publicEnv()
  });
}
