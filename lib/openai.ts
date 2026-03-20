// lib/openai.ts
// ─── AI utility — uses Gemini 2.0 Flash (Google AI Studio free key) ──────
//
// .env.local + Vercel env var needed:
//   NEXT_PUBLIC_GEMINI_API_KEY=AIza...   ← your Google AI Studio key
//
// Free tier: 1500 requests/day, 15 req/min — plenty for hackathon
// No billing needed on Google AI Studio free tier

export interface AskAIOptions {
  system:       string;
  user:         string;
  temperature?: number;
  maxTokens?:   number;
  jsonMode?:    boolean;
}

export async function askAI(opts: AskAIOptions): Promise<string> {
  const { system, user, temperature = 0.6, maxTokens = 400 } = opts;

  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY not set in environment variables");

  // Combine system + user for Gemini (it uses a single contents array)
  const prompt = system + "\n\nUser: " + user;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Gemini error:", res.status, err);
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  // Strip markdown code fences if present (Gemini sometimes adds them)
  return text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
}

// ─── Pre-built prompts ────────────────────────────────────────────────────

// 1. XR Concept Chat (learn page)
export async function xrConceptChat(question: string, userRole: string): Promise<string> {
  return askAI({
    system: `You are an XR education assistant on SYNTHÉ. Answer in simple, friendly language.
${userRole === "learner" || userRole === "user"
  ? "The user is a beginner — avoid jargon, use real-world analogies."
  : "The user is a developer — be technical and precise."}
Keep answers under 80 words. End with one practical tip.`,
    user: question,
    temperature: 0.6,
    maxTokens: 200,
  });
}

// 2. XR Roadmap Generator (learn/roadmap page)
export async function generateRoadmap(input: {
  age: string; goal: string; experience: string; style: string;
}): Promise<string> {
  return askAI({
    system: `You are an expert XR learning coach. Generate a personalised learning roadmap.
Return ONLY valid JSON — no markdown, no backticks, no extra text outside the JSON.
Format:
{
  "title": "string",
  "summary": "string",
  "totalDuration": "string",
  "phases": [
    {
      "phase": 1,
      "title": "string",
      "duration": "string",
      "description": "string",
      "topics": ["string"],
      "tools": ["string"],
      "milestone": "string"
    }
  ],
  "nextStep": "string"
}
Generate 4-6 phases. Use real free tools (Unity, A-Frame, Blender, WebXR API, Babylon.js).`,
    user: `Age: ${input.age}
Goal: ${input.goal}
Experience: ${input.experience}
Learning style: ${input.style}`,
    temperature: 0.7,
    maxTokens: 1500,
  });
}

// 3. Tool Recommender (learn/tools page)
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

// 4. AI Creator Matcher (connect page)
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

// 5. Chat Smart Replies (connect/chat page)
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

// 6. Model Meta Writer (upload pages)
export async function generateModelMeta(input: {
  fileName: string; fileType: string; category: string; tags: string[];
}): Promise<{ title: string; description: string; suggestedTags: string[]; suggestedPrice: number }> {
  const raw = await askAI({
    system: `You are a 3D asset marketplace expert. Generate metadata for a 3D model upload.
Return ONLY valid JSON — no markdown, no backticks, no text outside the JSON.
Format:
{
  "title": "string (max 60 chars)",
  "description": "string (2-3 sentences)",
  "suggestedTags": ["tag1","tag2","tag3","tag4","tag5"],
  "suggestedPrice": 0
}
suggestedPrice: 0 for simple models, 99-499 for professional ones.`,
    user: `File: ${input.fileName}
Type: ${input.fileType}
Category: ${input.category}
Tags: ${input.tags.join(", ")}`,
    temperature: 0.7,
    maxTokens: 250,
  });
  try { return JSON.parse(raw); }
  catch { return { title: input.fileName, description: "", suggestedTags: [], suggestedPrice: 0 }; }
}