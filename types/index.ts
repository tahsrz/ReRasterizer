export type MemePack =
  | "chaotic-commentary"
  | "brainrot-breakdown"
  | "anime-hype"
  | "sports-takeover";

export type JobType = "ingest" | "segment" | "render";
export type JobStatus = "queued" | "processing" | "complete" | "failed";

export type ProjectRecord = {
  _id?: string;
  userId?: string | null;
  title: string;
  status: "draft" | "uploaded" | "segmenting" | "ready" | "rendering" | "complete";
  sourceAsset?: {
    publicId: string;
    secureUrl: string;
    bytes?: number;
    duration?: number;
    width?: number;
    height?: number;
    format?: string;
    resourceType?: string;
  } | null;
  latestMaskJobId?: string | null;
  latestRenderJobId?: string | null;
  creative: {
    memePack: MemePack;
    captionTop: string;
    captionBottom: string;
    fps: number;
    edgeMix: number;
    posterize: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type JobRecord = {
  _id?: string;
  projectId: string;
  userId?: string | null;
  type: JobType;
  status: JobStatus;
  progress: number;
  provider: "cloudinary" | "sam2" | "ffmpeg" | "local";
  payload: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CaptionSuggestion = {
  top: string;
  bottom: string;
  rationale: string;
};
