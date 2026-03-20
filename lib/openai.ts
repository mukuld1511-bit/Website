// lib/openai.ts
// ─── AI utility — Gemini 2.0 Flash (Google AI Studio free key) ───────────
// .env.local + Vercel: NEXT_PUBLIC_GEMINI_API_KEY=AIza...
// Free tier: 1500 req/day, 15 req/min — auto-retries on 429
// ─────────────────────────────────────────────────────────────────────────

export interface AskAIOptions {
  system:       string;
  user:         string;
  temperature?: number;
  maxTokens?:   number;
}

const MODEL = "gemini-2.0-flash";

function buildBody(system: string, user: string, temperature: number, maxTokens: number) {
  return JSON.stringify({
    contents: [{ role: "user", parts: [{ text: system + "\n\nUser: " + user }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  });
}

function extractText(data: any): string {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
}

export async function askAI(opts: AskAIOptions): Promise<string> {
  const { system, user, temperature = 0.6, maxTokens = 400 } = opts;

  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY not set");

  const url     = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const headers = { "Content-Type": "application/json" };
  const body    = buildBody(system, user, temperature, maxTokens);

  let res = await fetch(url, { method: "POST", headers, body });

  // ── Auto-retry on rate limit (429) — wait 5s then try once more ──────
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 5000));
    res = await fetch(url, { method: "POST", headers, body });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
  }

  return extractText(await res.json());
}

// ─── Roadmap Generator ───────────────────────────────────────────────────
export async function generateRoadmap(input: {
  age: string; goal: string; experience: string; style: string;
}): Promise<string> {
  return askAI({
    system: `You are an expert XR learning coach. Generate a personalised learning roadmap.
Return ONLY valid JSON — no markdown, no backticks, no extra text.
Format:
{
  "title": "string",
  "summary": "string",
  "totalDuration": "string",
  "phases": [
    { "phase": 1, "title": "string", "duration": "string", "description": "string", "topics": ["string"], "tools": ["string"], "milestone": "string" }
  ],
  "nextStep": "string"
}
Generate 4-6 phases. Use real free tools (Unity, A-Frame, Blender, WebXR API, Babylon.js).`,
    user: `Age: ${input.age}\nGoal: ${input.goal}\nExperience: ${input.experience}\nLearning style: ${input.style}`,
    temperature: 0.7,
    maxTokens: 1500,
  });
}

// ─── Tool Recommender ────────────────────────────────────────────────────
export async function recommendTools(useCase: string, allTools: string): Promise<string> {
  return askAI({
    system: `You are an XR tool expert. Recommend the best 2-3 tools for the given use case.
Return ONLY valid JSON — no markdown, no backticks.
Format: { "recommendations": [{ "name": "string", "reason": "string", "priority": 1 }] }`,
    user: `Use case: ${useCase}\n\nAvailable tools:\n${allTools}`,
    temperature: 0.5,
    maxTokens: 300,
  });
}

// ─── Creator Matcher ─────────────────────────────────────────────────────
export async function matchCreators(need: string, creatorProfiles: string): Promise<string> {
  return askAI({
    system: `You are a talent matching assistant on SYNTHÉ. Match a project need with the best creators.
Return ONLY valid JSON — no markdown, no backticks.
Format: { "matches": [{ "name": "string", "reason": "string", "score": 95 }] }
Return max 3 matches.`,
    user: `Project need: ${need}\n\nCreator profiles:\n${creatorProfiles}`,
    temperature: 0.5,
    maxTokens: 300,
  });
}

// ─── Smart Replies ───────────────────────────────────────────────────────
export async function smartReplies(lastMessage: string, subject: string): Promise<string[]> {
  const raw = await askAI({
    system: `Generate 3 short, natural reply suggestions for a professional chat.
Return ONLY valid JSON — no markdown, no backticks.
Format: { "replies": ["reply 1", "reply 2", "reply 3"] }
Each reply under 10 words.`,
    user: `Chat subject: ${subject}\nLast message: "${lastMessage}"`,
    temperature: 0.8,
    maxTokens: 120,
  });
  try { return JSON.parse(raw).replies ?? []; }
  catch { return []; }
}

// ─── Model Meta Writer ───────────────────────────────────────────────────
export async function generateModelMeta(input: {
  fileName: string; fileType: string; category: string; tags: string[];
}): Promise<{ title: string; description: string; suggestedTags: string[]; suggestedPrice: number }> {
  const raw = await askAI({
    system: `You are a 3D asset marketplace expert. Generate metadata for a 3D model upload.
Return ONLY valid JSON — no markdown, no backticks.
Format: { "title": "string (max 60 chars)", "description": "string (2-3 sentences)", "suggestedTags": ["tag1","tag2","tag3"], "suggestedPrice": 0 }
suggestedPrice: 0 for simple models, 99-499 for professional ones.`,
    user: `File: ${input.fileName}\nType: ${input.fileType}\nCategory: ${input.category}\nTags: ${input.tags.join(", ")}`,
    temperature: 0.7,
    maxTokens: 250,
  });
  try { return JSON.parse(raw); }
  catch { return { title: input.fileName, description: "", suggestedTags: [], suggestedPrice: 0 }; }
}