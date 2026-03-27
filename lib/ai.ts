// lib/ai.ts
// ─── AI Service — Gemini 2.0 Flash (Google AI Studio) ────────────────────
// Unified AI module with caching, retry, and structured error handling.
// .env.local: NEXT_PUBLIC_GEMINI_API_KEY=AIza...
// Free tier: 1500 req/day, 15 req/min
// ─────────────────────────────────────────────────────────────────────────

import { logger } from './logger';

// ─── Types ───────────────────────────────────────────────────────────────
export interface AskAIOptions {
  system:       string;
  user:         string;
  temperature?: number;
  maxTokens?:   number;
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

// ─── Config ──────────────────────────────────────────────────────────────
const MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 1;
const RETRY_DELAY = 5000;

// ─── In-memory cache (prevents duplicate calls) ─────────────────────────
const responseCache = new Map<string, { result: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const pendingRequests = new Map<string, Promise<string>>();

function getCacheKey(system: string, user: string): string {
  return `${system.slice(0, 50)}::${user.slice(0, 100)}`;
}

function getCachedResponse(key: string): string | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('AI', 'Cache hit', { key: key.slice(0, 30) });
    return cached.result;
  }
  if (cached) responseCache.delete(key);
  return null;
}

// ─── Core API call ───────────────────────────────────────────────────────
function buildBody(system: string, user: string, temperature: number, maxTokens: number) {
  return JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: system + '\n\nUser: ' + user }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  });
}

function extractText(data: any): string {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
}

export async function askAI(opts: AskAIOptions): Promise<string> {
  const { system, user, temperature = 0.6, maxTokens = 400 } = opts;

  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new AIError('NEXT_PUBLIC_GEMINI_API_KEY not set');

  // Check cache
  const cacheKey = getCacheKey(system, user);
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  // Deduplicate in-flight requests
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    logger.debug('AI', 'Deduplicating request', { key: cacheKey.slice(0, 30) });
    return pending;
  }

  const request = (async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    const headers = { 'Content-Type': 'application/json' };
    const body = buildBody(system, user, temperature, maxTokens);

    let res = await fetch(url, { method: 'POST', headers, body });

    // Auto-retry on rate limit
    if (res.status === 429 && MAX_RETRIES > 0) {
      logger.warn('AI', 'Rate limited, retrying...', { delay: RETRY_DELAY });
      await new Promise(r => setTimeout(r, RETRY_DELAY));
      res = await fetch(url, { method: 'POST', headers, body });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = err?.error?.message ?? `Gemini error ${res.status}`;
      logger.error('AI', message, { status: res.status });
      throw new AIError(message, res.status, res.status === 429);
    }

    const result = extractText(await res.json());

    // Cache the result
    responseCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  })();

  pendingRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

// ─── Roadmap Generator ───────────────────────────────────────────────────
export async function generateRoadmap(input: {
  age: string; goal: string; experience: string; style: string;
}): Promise<string> {
  logger.info('AI', 'Generating roadmap', { goal: input.goal, experience: input.experience });
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
  logger.info('AI', 'Recommending tools', { useCase: useCase.slice(0, 50) });
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
  logger.info('AI', 'Matching creators', { need: need.slice(0, 50) });
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
  logger.info('AI', 'Generating model metadata', { fileName: input.fileName });
  const raw = await askAI({
    system: `You are a 3D asset marketplace expert. Generate metadata for a 3D model upload.
Return ONLY valid JSON — no markdown, no backticks.
Format: { "title": "string (max 60 chars)", "description": "string (2-3 sentences)", "suggestedTags": ["tag1","tag2","tag3"], "suggestedPrice": 0 }
suggestedPrice: 0 for simple models, 99-499 for professional ones.`,
    user: `File: ${input.fileName}\nType: ${input.fileType}\nCategory: ${input.category}\nTags: ${input.tags.join(', ')}`,
    temperature: 0.7,
    maxTokens: 250,
  });
  try { return JSON.parse(raw); }
  catch { return { title: input.fileName, description: '', suggestedTags: [], suggestedPrice: 0 }; }
}

// ─── Utility Finalization Layer ──────────────────────────────────────────
export async function finalizeOutput(rawOutput: string): Promise<string> {
  logger.info('AI', 'Finalizing AI output into actionable plan');
  return askAI({
    system: `You are a project planning expert. Convert the given AI-generated content into a structured, actionable execution plan.
Return ONLY valid JSON — no markdown, no backticks.
Format:
{
  "title": "string",
  "summary": "string",
  "totalSteps": number,
  "estimatedDuration": "string",
  "steps": [
    {
      "order": 1,
      "title": "string",
      "description": "string",
      "duration": "string",
      "checklist": ["actionable item 1", "actionable item 2"],
      "resources": [{ "name": "string", "url": "string", "type": "tool|tutorial|docs" }],
      "tips": "string"
    }
  ],
  "quickWins": ["string"],
  "longTermGoals": ["string"]
}
Make every step concrete and actionable. Include real resource links where possible.
Break complex tasks into 3-5 checklist items per step.
Generate 4-8 steps total.`,
    user: `Convert this into an execution plan:\n\n${rawOutput}`,
    temperature: 0.6,
    maxTokens: 2000,
  });
}
