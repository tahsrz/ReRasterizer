import { aiProviderEnv } from "@/lib/env";
import type { CaptionSuggestion, MemePack } from "@/types";

type SuggestArgs = {
  title: string;
  memePack: MemePack;
  transcriptHint?: string;
};

function fallbackSuggestions({ title, memePack }: SuggestArgs): CaptionSuggestion[] {
  return [
    {
      top: `WHEN ${title || "THE CLIP"} NEEDS A ${memePack.replaceAll("-", " ").toUpperCase()} ARC`,
      bottom: "BUT THE MOTION STILL HAS TO LAND",
      rationale: "Balances meme energy with clarity for a short-form video opener."
    },
    {
      top: "LIVE REACTION FROM THE EDIT TIMELINE",
      bottom: "EVERY FRAME IS TRYING TO GO VIRAL",
      rationale: "Leans into meta creator humor that works well for remix content."
    }
  ];
}

export async function suggestCaptions(args: SuggestArgs) {
  const { groqApiKey, openRouterApiKey, openRouterBaseUrl } = aiProviderEnv();
  const prompt = [
    "You write short viral video captions.",
    "Return JSON only with this shape:",
    '{"suggestions":[{"top":"...","bottom":"...","rationale":"..."}]}',
    `Title: ${args.title || "Untitled clip"}`,
    `Meme pack: ${args.memePack}`,
    `Transcript hint: ${args.transcriptHint || "None"}`,
    "Rules: all-caps captions, concise, funny, safe for mainstream social apps, no hashtags."
  ].join("\n");

  if (groqApiKey) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;
      if (raw) {
        return JSON.parse(raw).suggestions as CaptionSuggestion[];
      }
    }
  }

  if (openRouterApiKey) {
    const response = await fetch(`${openRouterBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4.1-mini",
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;
      if (raw) {
        return JSON.parse(raw).suggestions as CaptionSuggestion[];
      }
    }
  }

  return fallbackSuggestions(args);
}
