// lib/openai.ts
// ─── AI utility — uses Gemini 2.0 Flash (Google AI Studio free key) ──────
//
// .env.local + Vercel env var needed:
//   NEXT_PUBLIC_GEMINI_API_KEY=AIza...  ← your Google AI Studio key
//
// Free tier: 1500 requests/day, 15 req/min — plenty for hackathon
// DO NOT change the model — gemini-2.0-flash is the correct free tier model
// ─────────────────────────────────────────────────────────────────────────

const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

export async function askAI(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 500
): Promise<string> {
  if (!GEMINI_KEY) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: systemPrompt + "\n\n" + userMessage }],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(
      `Gemini error ${res.status}: ${errJson?.error?.message ?? res.statusText}`
    );
  }

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
    "No response from AI."
  );
}

// ─── XR Concept Chat (Learn page) ────────────────────────────────────────
export async function xrConceptChat(
  question: string,
  userRole: string
): Promise<string> {
  return askAI(
    `You are an XR (AR/VR) education assistant on the SYNTHÉ platform.
The user's role is: ${userRole}.
Answer concisely and clearly. Focus on XR, AR, VR, 3D modelling, WebXR, Unity, Unreal Engine, and related tools.
If the question is unrelated to XR/3D/tech, politely redirect.`,
    question,
    300
  );
}

// ─── AI Roadmap Generator (Learn/Roadmap page) ───────────────────────────
export async function generateRoadmap(
  goal: string,
  currentSkill: string,
  timeAvailable: string
): Promise<string> {
  return askAI(
    `You are an XR learning roadmap generator for SYNTHÉ platform.
Create a structured 4–6 phase learning roadmap in JSON format.
Each phase must have: phase (number), title, duration, description, topics (array), tools (array), milestone.
Respond ONLY with valid JSON — no markdown, no explanation outside the JSON.
Format: { "phases": [ { "phase": 1, "title": "...", "duration": "...", "description": "...", "topics": [], "tools": [], "milestone": "..." } ] }`,
    `Goal: ${goal}\nCurrent skill level: ${currentSkill}\nTime available per week: ${timeAvailable}`,
    800
  );
}

// ─── Tool Recommender (Learn/Tools page) ─────────────────────────────────
export async function recommendTools(
  goal: string,
  level: string
): Promise<string> {
  return askAI(
    `You are an XR tools expert on SYNTHÉ platform.
Recommend 3–5 specific XR/3D tools based on the user's goal and skill level.
For each tool mention: name, why it fits, learning curve, and one getting-started tip.
Keep response concise and practical.`,
    `Goal: ${goal}\nSkill level: ${level}`,
    400
  );
}

// ─── Creator Matcher (Connect page) ──────────────────────────────────────
export async function matchCreators(
  projectDescription: string,
  requiredSkills: string[]
): Promise<string> {
  return askAI(
    `You are a creator matching assistant on SYNTHÉ, an XR marketplace.
Based on the project description and required skills, describe the ideal creator profile.
Suggest what to look for in a developer/mentor, what questions to ask them, and red flags to avoid.
Keep it practical and specific to XR/3D projects.`,
    `Project: ${projectDescription}\nRequired skills: ${requiredSkills.join(", ")}`,
    350
  );
}

// ─── Smart Replies (Connect/Chat page) ───────────────────────────────────
export async function smartReplies(
  conversationContext: string,
  lastMessage: string
): Promise<string[]> {
  const raw = await askAI(
    `You are a smart reply assistant for SYNTHÉ platform's creator chat.
Generate exactly 3 short, contextual reply suggestions (max 12 words each).
Respond ONLY with a JSON array of 3 strings — no extra text.
Example: ["Sure, let me check that for you.", "Can you share more details?", "I'll get back to you shortly."]`,
    `Conversation context: ${conversationContext}\nLast message: ${lastMessage}`,
    150
  );

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (Array.isArray(parsed)) return parsed.slice(0, 3);
  } catch {
    // fallback
  }
  return ["Sounds good!", "Can you elaborate?", "Let me check and get back to you."];
}

// ─── Model Meta Writer (Upload pages) ────────────────────────────────────
export async function generateModelMeta(
  fileName: string,
  fileType: string,
  category: string,
  tags: string[]
): Promise<{
  title: string;
  description: string;
  suggestedTags: string[];
  suggestedPrice: number;
}> {
  const raw = await askAI(
    `You are a product listing assistant for SYNTHÉ, an XR/3D model marketplace.
Generate a compelling title, description, suggested tags, and a fair price in INR for a 3D model listing.
Respond ONLY with valid JSON — no markdown.
Format: { "title": "...", "description": "...", "suggestedTags": ["tag1","tag2","tag3"], "suggestedPrice": 499 }`,
    `File name: ${fileName}\nFile type: ${fileType}\nCategory: ${category}\nExisting tags: ${tags.join(", ")}`,
    300
  );

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return {
      title: parsed.title ?? fileName,
      description: parsed.description ?? "",
      suggestedTags: parsed.suggestedTags ?? tags,
      suggestedPrice: parsed.suggestedPrice ?? 299,
    };
  } catch {
    return {
      title: fileName,
      description: "A high-quality 3D model for XR applications.",
      suggestedTags: tags,
      suggestedPrice: 299,
    };
  }
}

export default askAI;