// lib/openai.ts
// ─── Drop-in replacement for all Gemini calls ─────────────────────────────
// Was: Gemini 2.0 Flash via generativelanguage.googleapis.com
// Now: OpenAI gpt-4o-mini via api.openai.com
//
// .env.local / Vercel env var needed:
//   NEXT_PUBLIC_OPENAI_API_KEY=sk-...
//
// Usage:
//   import { askAI } from "@/lib/openai";
//   const answer = await askAI({ system: "...", user: "..." });

export interface AskAIOptions {
  system:      string;
  user:        string;
  temperature?: number;
  maxTokens?:  number;
  jsonMode?:   boolean;   // set true to get JSON output (adds response_format)
}

export async function askAI(opts: AskAIOptions): Promise<string> {
  const {
    system,
    user,
    temperature = 0.6,
    maxTokens   = 500,
    jsonMode    = false,
  } = opts;

  const body: Record<string, any> = {
    model:       "gpt-4o-mini",
    messages:    [
      { role: "system", content: system },
      { role: "user",   content: user   },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Pre-built prompts matching old Gemini feature list ───────────────────

// 1. XR Concept Chat (learn page)
export async function xrConceptChat(question: string, userRole: string): Promise<string> {
  return askAI({
    system: `You are an XR education assistant on SYNTHÉ. Answer in simple, friendly language.
${userRole === "learner" || userRole === "user"
  ? "The user is a beginner — avoid jargon, use real-world analogies."
  : "The user is a developer — be technical and precise."}
Keep answers under 100 words. End with one practical tip.`,
    user: question,
    temperature: 0.6,
    maxTokens: 250,
  });
}

// 2. XR Roadmap Generator (learn/roadmap page)
export async function generateRoadmap(input: {
  age: string; goal: string; experience: string; style: string;
}): Promise<string> {
  return askAI({
    system: `You are an expert XR learning coach. Generate a personalised learning roadmap in JSON.
Return ONLY valid JSON — no markdown, no backticks.
Format:
{
  "phases": [
    {
      "phase": 1,
      "title": "string",
      "duration": "string",
      "description": "string",
      "tools": ["string"],
      "milestone": "string"
    }
  ],
  "summary": "string",
  "totalDuration": "string"
}
Generate 4-6 phases appropriate for the learner.`,
    user: `Age: ${input.age}
Goal: ${input.goal}
Experience: ${input.experience}
Learning style: ${input.style}`,
    temperature: 0.7,
    maxTokens: 1000,
    jsonMode: true,
  });
}

// 3. Tool Recommender (learn/tools page)
export async function recommendTools(useCase: string, allTools: string): Promise<string> {
  return askAI({
    system: `You are an XR tool expert. Given a use case, recommend the best 2-3 tools from the provided list.
Return ONLY valid JSON — no markdown, no backticks.
Format: { "recommendations": [{ "name": "string", "reason": "string", "priority": 1 }] }`,
    user: `Use case: ${useCase}\n\nAvailable tools:\n${allTools}`,
    temperature: 0.5,
    maxTokens: 400,
    jsonMode: true,
  });
}

// 4. AI Creator Matcher (connect page)
export async function matchCreators(need: string, creatorProfiles: string): Promise<string> {
  return askAI({
    system: `You are a talent matching assistant on SYNTHÉ. Match a project need with the best creators.
Return ONLY valid JSON — no markdown, no backticks.
Format: { "matches": [{ "name": "string", "reason": "string", "score": 95 }] }
Return max 3 matches.`,
    user: `Project need: ${need}\n\nCreator profiles:\n${creatorProfiles}`,
    temperature: 0.5,
    maxTokens: 400,
    jsonMode: true,
  });
}

// 5. Chat Smart Replies (connect/chat page)
export async function smartReplies(lastMessage: string, subject: string): Promise<string[]> {
  const raw = await askAI({
    system: `You are a communication assistant. Generate 3 short, natural reply suggestions for a professional chat.
Return ONLY valid JSON — no markdown, no backticks.
Format: { "replies": ["reply 1", "reply 2", "reply 3"] }
Each reply must be under 12 words.`,
    user: `Chat subject: ${subject}\nLast message: "${lastMessage}"`,
    temperature: 0.8,
    maxTokens: 150,
    jsonMode: true,
  });
  try {
    const parsed = JSON.parse(raw);
    return parsed.replies ?? [];
  } catch {
    return [];
  }
}

// 6. Model Meta Writer (upload pages)
export async function generateModelMeta(input: {
  fileName: string; fileType: string; category: string; tags: string[];
}): Promise<{ title: string; description: string; suggestedTags: string[]; suggestedPrice: number }> {
  const raw = await askAI({
    system: `You are a 3D asset marketplace expert. Generate metadata for a 3D model upload.
Return ONLY valid JSON — no markdown, no backticks.
Format:
{
  "title": "string (max 60 chars)",
  "description": "string (2-3 sentences, professional)",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedPrice": 0
}
suggestedPrice should be 0 for simple models, 99-499 for professional ones.`,
    user: `File: ${input.fileName}
Type: ${input.fileType}
Category: ${input.category}
Existing tags: ${input.tags.join(", ")}`,
    temperature: 0.7,
    maxTokens: 300,
    jsonMode: true,
  });
  try {
    return JSON.parse(raw);
  } catch {
    return { title: input.fileName, description: "", suggestedTags: [], suggestedPrice: 0 };
  }
}