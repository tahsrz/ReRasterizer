const requiredServer = [
  "MONGODB_URI",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
] as const;

type ServerKey = (typeof requiredServer)[number];

export function getServerEnv(key: ServerKey) {
  return process.env[key];
}

export function missingServerEnv() {
  return requiredServer.filter((key) => !process.env[key]);
}

export function publicEnv() {
  return {
    apiDomain: process.env.NEXT_PUBLIC_API_DOMAIN ?? "",
    cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? "",
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_KEY ?? "",
    segmenterUrl: process.env.NEXT_PUBLIC_SEGMENTER_URL ?? process.env.SEGMENTER_URL ?? "http://127.0.0.1:8001"
  };
}

export function aiProviderEnv() {
  return {
    groqApiKey: process.env.GROQ_API_KEY ?? "",
    openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
    openRouterBaseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"
  };
}
