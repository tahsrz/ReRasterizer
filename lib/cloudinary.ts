import crypto from "node:crypto";

import { v2 as cloudinary } from "cloudinary";

import { getServerEnv } from "@/lib/env";

export function configuredCloudinary() {
  const cloudName = getServerEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getServerEnv("CLOUDINARY_API_KEY");
  const apiSecret = getServerEnv("CLOUDINARY_API_SECRET");

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  return { cloudinary, cloudName, apiKey, apiSecret };
}

export function signUploadParams(params: Record<string, string>) {
  const { apiSecret } = configuredCloudinary();
  const sorted = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(sorted + apiSecret).digest("hex");
}
