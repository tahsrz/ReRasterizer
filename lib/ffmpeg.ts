"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type BuildCommandArgs = {
  inputName: string;
  outputName: string;
  fps: number;
  posterize: number;
  edgeMix: number;
  captionTop: string;
  captionBottom: string;
  memePack: string;
};

let ffmpegPromise: Promise<FFmpeg> | null = null;

function escapeDrawtext(text: string) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll("%", "\\%")
    .replaceAll(",", "\\,");
}

function memePackHue(memePack: string) {
  switch (memePack) {
    case "brainrot-breakdown":
      return 42;
    case "anime-hype":
      return -22;
    case "sports-takeover":
      return 10;
    default:
      return 18;
  }
}

export function ffmpegSupported() {
  return typeof window !== "undefined" && typeof WebAssembly !== "undefined";
}

export async function getFfmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      const baseUrl = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm")
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

export function buildRotoscopeCommand({
  inputName,
  outputName,
  fps,
  posterize,
  edgeMix,
  captionTop,
  captionBottom,
  memePack
}: BuildCommandArgs) {
  const top = escapeDrawtext(captionTop.toUpperCase());
  const bottom = escapeDrawtext(captionBottom.toUpperCase());
  const hue = memePackHue(memePack);

  const filterGraph = [
    `[0:v]fps=${fps},scale=720:-2:flags=lanczos,split=2[base][edgesrc]`,
    `[edgesrc]edgedetect=low=0.08:high=0.32,negate,boxblur=1:1[edges]`,
    `[base]eq=saturation=1.35:contrast=1.15:brightness=0.02,hue=h=${hue},elbg=codebook_length=16:nb_steps=${posterize * 2}[poster]`,
    `[poster][edges]blend=all_mode=overlay:all_opacity=${edgeMix}[blend]`,
    `[blend]drawtext=text='${top}':x=(w-text_w)/2:y=28:fontcolor=white:fontsize=28:borderw=4:bordercolor=black:box=1:boxcolor=black@0.35:boxborderw=18[topcap]`,
    `[topcap]drawtext=text='${bottom}':x=(w-text_w)/2:y=h-text_h-38:fontcolor=#d9ff66:fontsize=30:borderw=4:bordercolor=#081315:box=1:boxcolor=black@0.42:boxborderw=18[outv]`
  ].join(";");

  return [
    "-i",
    inputName,
    "-filter_complex",
    filterGraph,
    "-map",
    "[outv]",
    "-map",
    "0:a?",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
    "-c:a",
    "aac",
    "-shortest",
    outputName
  ];
}

export async function exportRotoscopeVideo(file: File, command: string[]) {
  const ffmpeg = await getFfmpeg();
  const outputName = command[command.length - 1];
  await ffmpeg.writeFile(file.name, await fetchFile(file));
  await ffmpeg.exec(command);
  const data = await ffmpeg.readFile(outputName);
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? new Uint8Array(data.buffer.slice(0))
        : new Uint8Array(data);
  const safeBytes = Uint8Array.from(bytes);
  const arrayBuffer: ArrayBuffer = safeBytes.buffer as ArrayBuffer;
  return new Blob([arrayBuffer], { type: "video/mp4" });
}
