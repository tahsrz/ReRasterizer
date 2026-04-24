import type { CaptionSuggestion, JobRecord, MemePack, ProjectRecord } from "@/types";
import type { Sam2SegmentationResult } from "@/lib/sam2";

type CreateProjectInput = {
  title: string;
  creative: ProjectRecord["creative"];
};

export async function apiCreateProject(input: CreateProjectInput) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error("Could not create project");
  }
  return (await response.json()) as { project: ProjectRecord };
}

export async function apiListProjects() {
  const response = await fetch("/api/projects");
  if (!response.ok) {
    throw new Error("Could not load projects");
  }
  return (await response.json()) as { projects: ProjectRecord[] };
}

export async function apiGetUploadSignature(projectId: string, fileName: string) {
  const response = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, fileName })
  });
  if (!response.ok) {
    throw new Error("Could not sign Cloudinary upload");
  }
  return (await response.json()) as {
    cloudName: string;
    apiKey: string;
    timestamp: string;
    signature: string;
    folder: string;
    publicId: string;
  };
}

export async function apiAttachUpload(projectId: string, asset: Record<string, unknown>) {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceAsset: asset, status: "uploaded" })
  });
  if (!response.ok) {
    throw new Error("Could not attach upload to project");
  }
  return (await response.json()) as { project: ProjectRecord };
}

export async function apiCreateJob(input: {
  projectId: string;
  type: JobRecord["type"];
  payload: Record<string, unknown>;
}) {
  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error("Could not create job");
  }
  return (await response.json()) as { job: JobRecord };
}

export async function apiGetJob(jobId: string) {
  const response = await fetch(`/api/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error("Could not load job");
  }
  return (await response.json()) as { job: JobRecord };
}

export async function apiSuggestCaptions(input: { title: string; memePack: MemePack; transcriptHint?: string }) {
  const response = await fetch("/api/captions/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error("Could not generate caption suggestions");
  }
  return (await response.json()) as { suggestions: CaptionSuggestion[] };
}

export async function apiCreateSegmentation(input: {
  projectId: string;
  title: string;
  memePack: MemePack;
  file: File;
  promptBox?: [number, number, number, number];
}) {
  const formData = new FormData();
  formData.append("projectId", input.projectId);
  formData.append("title", input.title);
  formData.append("memePack", input.memePack);
  formData.append("file", input.file, input.file.name);
  if (input.promptBox) {
    formData.append("promptBox", input.promptBox.join(","));
  }
  const response = await fetch("/api/segmentations", { method: "POST", body: formData });
  if (!response.ok) {
    throw new Error("Could not run segmentation");
  }
  return (await response.json()) as { result: Sam2SegmentationResult };
}
