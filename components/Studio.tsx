"use client";

import { useEffect, useRef, useState } from "react";

import { AuthBar } from "@/components/AuthBar";
import { TacticalCloth, TacticalClothRef } from "@/components/TacticalCloth";
import {
  apiAttachUpload,
  apiCreateJob,
  apiCreateProject,
  apiGetUploadSignature,
  apiListProjects,
  apiSuggestCaptions
} from "@/lib/api";
import {
  buildRotoscopeCommand,
  exportRotoscopeVideo,
  ffmpegSupported
} from "@/lib/ffmpeg";
import { createMaskPreview, runSam2Segmentation, type Sam2SegmentationResult } from "@/lib/sam2";
import type { CaptionSuggestion, MemePack, ProjectRecord } from "@/types";

export function Studio() {
  const clothRef = useRef<TacticalClothRef>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [status, setStatus] = useState("Idle");
  const [captionTop, setCaptionTop] = useState("WHEN THE TIMELINE NEEDS CHAOS");
  const [captionBottom, setCaptionBottom] = useState("BUT THE MOTION STILL HAS TO READ");
  const [memePack, setMemePack] = useState<MemePack>("chaotic-commentary");
  const [fps, setFps] = useState(12);
  const [edgeMix, setEdgeMix] = useState(0.5);
  const [posterize, setPosterize] = useState(6);
  const [sam2State, setSam2State] = useState<Sam2SegmentationResult | null>(null);
  const [maskLog, setMaskLog] = useState("Waiting for clip.");
  const [isRendering, setIsRendering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [captionSuggestions, setCaptionSuggestions] = useState<CaptionSuggestion[]>([]);

  useEffect(() => {
    void apiListProjects()
      .then(({ projects: nextProjects }) => {
        setProjects(nextProjects);
      })
      .catch(() => undefined);
  }, []);

  const handleFile = async (nextFile: File) => {
    setFile(nextFile);
    const nextPreviewUrl = URL.createObjectURL(nextFile);
    setPreviewUrl(nextPreviewUrl);
    setDownloadUrl("");
    setStatus("Creating project");

    try {
      const project =
        activeProject ??
        (await handleCreateProjectWithOverrides({
          title: nextFile.name.replace(/\.[^.]+$/, ""),
          memePack,
          captionTop,
          captionBottom,
          fps,
          edgeMix,
          posterize
        }));

      setStatus("Analyzing clip");
      const segmentation = await runSam2Segmentation({
        file: nextFile,
        projectId: project._id!,
        title: project.title,
        memePack
      });
      setSam2State(segmentation);
      setMaskLog(
        segmentation.mode === "mock"
          ? "SAM 2 service is currently in fallback mode. Install the model runtime and checkpoint to enable live masks."
          : `SAM 2 masks generated with confidence ${(segmentation.confidence * 100).toFixed(1)}%.`
      );
      setStatus("Clip ready");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Clip analysis failed");
    }
  };

  const handleCreateProjectWithOverrides = async (overrides?: {
    title?: string;
    memePack?: MemePack;
    captionTop?: string;
    captionBottom?: string;
    fps?: number;
    edgeMix?: number;
    posterize?: number;
  }) => {
    const { project } = await apiCreateProject({
      title: overrides?.title ?? (file ? file.name.replace(/\.[^.]+$/, "") : "Untitled Remix"),
      creative: {
        memePack: overrides?.memePack ?? memePack,
        captionTop: overrides?.captionTop ?? captionTop,
        captionBottom: overrides?.captionBottom ?? captionBottom,
        fps: overrides?.fps ?? fps,
        edgeMix: overrides?.edgeMix ?? edgeMix,
        posterize: overrides?.posterize ?? posterize
      }
    });
    setActiveProject(project);
    setProjects((current) => [project, ...current]);
    return project;
  };

  const handleCreateProject = async () => handleCreateProjectWithOverrides();

  const handleUploadToCloudinary = async () => {
    if (!file) {
      setStatus("Choose a clip first");
      return;
    }

    setIsUploading(true);
    setStatus("Preparing Cloudinary upload");

    try {
      const project = activeProject ?? (await handleCreateProject());
      const signature = await apiGetUploadSignature(project._id!, file.name);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", signature.timestamp);
      formData.append("signature", signature.signature);
      formData.append("folder", signature.folder);
      formData.append("public_id", signature.publicId);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Cloudinary upload failed");
      }

      const data = await response.json();
      const updated = await apiAttachUpload(project._id!, {
        publicId: data.public_id,
        secureUrl: data.secure_url,
        bytes: data.bytes,
        duration: data.duration,
        width: data.width,
        height: data.height,
        format: data.format,
        resourceType: data.resource_type
      });
      setActiveProject(updated.project);
      setStatus("Upload complete");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateCaptions = async () => {
    setIsGeneratingCaptions(true);
    setStatus("Generating viral caption ideas");
    try {
      const { suggestions } = await apiSuggestCaptions({
        title: activeProject?.title ?? file?.name ?? "Untitled Remix",
        memePack
      });
      setCaptionSuggestions(suggestions);
      if (suggestions[0]) {
        setCaptionTop(suggestions[0].top);
        setCaptionBottom(suggestions[0].bottom);
      }
      setStatus("Caption ideas ready");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Caption generation failed");
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const handleQueueMaskJob = async () => {
    if (!activeProject?._id) {
      setStatus("Upload or create a project first");
      return;
    }
    const { job } = await apiCreateJob({
      projectId: activeProject._id,
      type: "segment",
      payload: {
        mode: "sam2-placeholder",
        sourceAsset: activeProject.sourceAsset?.secureUrl ?? null
      }
    });
    setMaskLog(`Queued SAM 2 placeholder job ${job._id}.`);
    setStatus("Segmentation job queued");
  };

  const handleRender = async () => {
    if (!file) {
      setStatus("Choose a clip first");
      return;
    }

    if (!ffmpegSupported()) {
      setStatus("This browser does not support ffmpeg.wasm");
      return;
    }

    setIsRendering(true);
    setStatus("Rendering with ffmpeg.wasm");

    try {
      const command = buildRotoscopeCommand({
        inputName: file.name,
        outputName: "rotoscope-export.mp4",
        fps,
        posterize,
        edgeMix,
        captionTop,
        captionBottom,
        memePack
      });

      const blob = await exportRotoscopeVideo(file, command);
      const nextUrl = URL.createObjectURL(blob);
      setDownloadUrl(nextUrl);
      if (activeProject?._id) {
        await apiCreateJob({
          projectId: activeProject._id,
          type: "render",
          payload: {
            mode: "ffmpeg-wasm-preview",
            command
          }
        });
      }
      setStatus("Render complete");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Render failed");
    } finally {
      setIsRendering(false);
    }
  };

  const maskPreview = sam2State ? createMaskPreview(sam2State) : "No mask preview yet.";

  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">Client-Side Viral Video Lab</span>
        <h1>Rotoscope edits with ffmpeg.wasm, SAM 2, and a reactive cloth mesh.</h1>
        <p>
          This prototype keeps the pipeline browser-first. We isolate the subject with a
          dedicated segmentation layer, stylize motion into a rotoscope-like treatment, then
          push the result toward internet-native pacing with captions, meme packs, and a
          mask-repair preview built from your cloth simulation logic.
        </p>
        <AuthBar />
      </section>

      <section className="studio-grid">
        <aside className="card controls">
          <h2 className="section-title">Controls</h2>

          <div className="field">
            <label htmlFor="video">Clip</label>
            <input
              id="video"
              className="input"
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(event) => {
                const nextFile = event.target.files?.[0];
                if (nextFile) {
                  void handleFile(nextFile);
                }
              }}
            />
          </div>

          <div className="two-up">
            <div className="field">
              <label htmlFor="meme-pack">Meme pack</label>
              <select
                id="meme-pack"
                className="select"
                value={memePack}
                onChange={(event) => {
                  setMemePack(event.target.value as MemePack);
                }}
              >
                <option value="chaotic-commentary">Chaotic Commentary</option>
                <option value="brainrot-breakdown">Brainrot Breakdown</option>
                <option value="anime-hype">Anime Hype</option>
                <option value="sports-takeover">Sports Takeover</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="fps">Frame rate {fps}</label>
              <input
                id="fps"
                className="range"
                type="range"
                min={8}
                max={18}
                step={1}
                value={fps}
                onChange={(event) => {
                  setFps(Number(event.target.value));
                }}
              />
            </div>
          </div>

          <div className="two-up">
            <div className="field">
              <label htmlFor="posterize">Posterize {posterize}</label>
              <input
                id="posterize"
                className="range"
                type="range"
                min={2}
                max={10}
                step={1}
                value={posterize}
                onChange={(event) => {
                  setPosterize(Number(event.target.value));
                }}
              />
            </div>

            <div className="field">
              <label htmlFor="edge-mix">Edge mix {edgeMix.toFixed(2)}</label>
              <input
                id="edge-mix"
                className="range"
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={edgeMix}
                onChange={(event) => {
                  setEdgeMix(Number(event.target.value));
                }}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="caption-top">Top caption</label>
            <input
              id="caption-top"
              className="input"
              value={captionTop}
              onChange={(event) => {
                setCaptionTop(event.target.value);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="caption-bottom">Bottom caption</label>
            <input
              id="caption-bottom"
              className="input"
              value={captionBottom}
              onChange={(event) => {
                setCaptionBottom(event.target.value);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="sam-notes">SAM 2 integration notes</label>
            <textarea
              id="sam-notes"
              className="textarea"
              value={maskLog}
              onChange={(event) => {
                setMaskLog(event.target.value);
              }}
            />
          </div>

          <div className="actions">
            <button className="button" disabled={isUploading || !file} onClick={() => void handleUploadToCloudinary()}>
              {isUploading ? "Uploading..." : "Upload to Cloudinary"}
            </button>
            <button className="button secondary" onClick={() => void handleGenerateCaptions()} type="button">
              {isGeneratingCaptions ? "Thinking..." : "Generate captions"}
            </button>
            <button className="button secondary" onClick={() => void handleQueueMaskJob()} type="button">
              Queue SAM 2 job
            </button>
            <button className="button" disabled={isRendering || !file} onClick={() => void handleRender()} type="button">
              {isRendering ? "Rendering..." : "Render in browser"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                clothRef.current?.pet();
              }}
            >
              Repair mesh
            </button>
          </div>
        </aside>

        <section className="card preview">
          <div className="status-strip">
            <span>Status</span>
            <span className="status-live">{status}</span>
          </div>

          <div className="preview-grid">
            <div className="monitor">
              <h3 className="section-title">Mask Recovery</h3>
              <TacticalCloth
                ref={clothRef}
                videoSrc={previewUrl}
                onMeshDisturbance={(energy) => {
                  setMaskLog(`Mask recovery mesh displaced with energy ${energy.toFixed(0)}.`);
                }}
              />
              <div className="pill-row">
                <span className="pill">SAM 2 adapter</span>
                <span className="pill">Gap-fill preview</span>
                <span className="pill">Interactive cloth mesh</span>
                {activeProject?._id ? <span className="pill">Project {activeProject._id.slice(-6)}</span> : null}
              </div>
            </div>

            <div className="monitor">
              <h3 className="section-title">Output Preview</h3>
              {previewUrl ? (
                <video className="preview-video" src={previewUrl} controls muted playsInline />
              ) : (
                <p className="note">Upload a vertical-friendly clip to start the segmentation preview.</p>
              )}

              <div className="console">
                {maskPreview}
                {"\n\n"}
                {captionSuggestions.length
                  ? `Caption suggestions:\n${captionSuggestions
                      .map((suggestion, index) => `${index + 1}. ${suggestion.top} / ${suggestion.bottom}`)
                      .join("\n")}\n\n`
                  : ""}
                {file
                  ? `FFmpeg command preview:\n${buildRotoscopeCommand({
                      inputName: file.name,
                      outputName: "rotoscope-export.mp4",
                      fps,
                      posterize,
                      edgeMix,
                      captionTop,
                      captionBottom,
                      memePack
                    }).join(" ")}`
                  : "No FFmpeg command generated yet."}
              </div>

              {downloadUrl ? (
                <a className="download" href={downloadUrl} download="rotoscope-export.mp4">
                  Download rendered mp4
                </a>
              ) : null}
            </div>
          </div>
          <div className="monitor" style={{ marginTop: "18px" }}>
            <h3 className="section-title">Projects</h3>
            <div className="console">
              {projects.length
                ? projects
                    .map(
                      (project) =>
                        `${project.title} | ${project.status} | ${project.sourceAsset?.secureUrl ? "uploaded" : "draft"}`
                    )
                    .join("\n")
                : "No projects yet."}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
