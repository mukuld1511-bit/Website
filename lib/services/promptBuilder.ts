// lib/services/promptBuilder.ts
// ─── Layer 1: Prompt Controller ──────────────────────────────────────────
// Converts raw user input into deterministic, structured prompts.
// Gemini is NEVER called with raw user input — this layer sanitizes,
// structures, and enforces JSON output format on every call.
// ─────────────────────────────────────────────────────────────────────────

import type { PipelineInput, StructuredPrompt, AdaptiveContext } from './types';

// ─── Input Sanitization ─────────────────────────────────────────────────
function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // Strip HTML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')  // Strip control chars
    .trim()
    .slice(0, 4000);                   // Hard limit
}

function hashInput(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ─── Adaptive Context Injection ─────────────────────────────────────────
function buildAdaptiveBlock(ctx?: AdaptiveContext): string {
  if (!ctx || ctx.queryCount < 2) return '';

  const lines: string[] = ['--- USER CONTEXT (adapt your response) ---'];

  if (ctx.skillLevel !== 'intermediate') {
    lines.push(`Skill level: ${ctx.skillLevel}`);
  }
  if (ctx.weaknesses.length > 0) {
    lines.push(`Areas needing focus: ${ctx.weaknesses.join(', ')}`);
  }
  if (ctx.strengths.length > 0) {
    lines.push(`Already strong in: ${ctx.strengths.join(', ')}`);
  }
  if (ctx.patterns.length > 0) {
    lines.push(`Detected patterns: ${ctx.patterns.join('; ')}`);
  }
  lines.push(`Previous queries: ${ctx.queryCount}`);
  lines.push('--- END CONTEXT ---');

  return lines.join('\n');
}

// ─── Output Schema Enforcement ──────────────────────────────────────────
const OUTPUT_SCHEMA_DIRECTIVE = `
CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON — no markdown, no backticks, no explanatory text.
2. Do NOT wrap your response in \`\`\`json blocks.
3. Every field must be populated — no null values, no empty strings for required fields.
4. Arrays must contain at least 1 element.
5. Follow the exact schema provided — do not add extra fields.`;

// ─── Prompt Templates ───────────────────────────────────────────────────
const TEMPLATES: Record<string, {
  system: (params: Record<string, string>, adaptive: string) => string;
  user: (raw: string, params: Record<string, string>) => string;
  temperature: number;
  maxTokens: number;
  schema: string;
}> = {
  roadmap: {
    system: (_, adaptive) => `You are an expert XR/AR/VR learning coach on SYNTHÉ.
Generate a personalised, execution-focused learning roadmap.
${adaptive}
${OUTPUT_SCHEMA_DIRECTIVE}

Required JSON schema:
{
  "title": "string — concise roadmap title",
  "summary": "string — 2 sentence overview",
  "totalDuration": "string — e.g. '12 weeks'",
  "phases": [
    {
      "phase": "number — sequential starting from 1",
      "title": "string — phase name",
      "duration": "string — e.g. '2 weeks'",
      "description": "string — what the learner achieves",
      "topics": ["string — specific topic, not vague"],
      "tools": ["string — real, free tools only (Unity, Blender, A-Frame, WebXR API, Babylon.js, Three.js)"],
      "milestone": "string — measurable outcome",
      "priority": "string — P0 (must-do) | P1 (important) | P2 (nice-to-have)"
    }
  ],
  "nextStep": "string — concrete first action the learner should take today",
  "quickWins": ["string — things achievable in < 1 hour"]
}
Generate 4-6 phases. Be specific — not generic. Every tool must be real and free.`,
    user: (_, params) =>
      `Build a roadmap for:\n- Age group: ${params.age || 'not specified'}\n- Goal: ${params.goal || 'learn XR development'}\n- Current experience: ${params.experience || 'beginner'}\n- Preferred learning style: ${params.style || 'mixed'}`,
    temperature: 0.7,
    maxTokens: 1800,
    schema: 'roadmap',
  },

  tools: {
    system: (params, adaptive) => `You are an XR tool recommendation engine on SYNTHÉ.
Analyse the user's goal and recommend the best 2-4 tools from the available catalog.
${adaptive}
${OUTPUT_SCHEMA_DIRECTIVE}

Required JSON schema:
{
  "recommendations": [
    {
      "name": "string — exact tool name from catalog",
      "reason": "string — why this tool fits the use case (2 sentences)",
      "priority": "number — 1 is highest",
      "useFor": "string — specific task this tool solves",
      "alternatives": ["string — 1-2 alternative tools"]
    }
  ],
  "strategy": "string — how to combine these tools in a workflow"
}`,
    user: (raw, params) =>
      `Use case: ${sanitize(raw)}\n\nAvailable tools:\n${params.toolList || 'All XR tools'}`,
    temperature: 0.5,
    maxTokens: 400,
    schema: 'tools',
  },

  finalize: {
    system: (_, adaptive) => `You are an execution planning expert on SYNTHÉ.
Convert the given AI-generated content into a structured, actionable execution plan.
Every step must be concrete — no vague advice.
${adaptive}
${OUTPUT_SCHEMA_DIRECTIVE}

Required JSON schema:
{
  "title": "string",
  "summary": "string — 2-3 sentences",
  "totalSteps": "number",
  "estimatedDuration": "string",
  "steps": [
    {
      "order": "number — sequential",
      "title": "string — action-oriented title",
      "description": "string — what to do and why",
      "duration": "string — estimated time",
      "priority": "string — P0 | P1 | P2",
      "checklist": ["string — specific actionable item"],
      "resources": [{ "name": "string", "url": "string", "type": "tool|tutorial|docs" }],
      "tips": "string — practical advice",
      "dependsOn": ["number — step orders this depends on, empty array if none"]
    }
  ],
  "quickWins": ["string — things achievable in < 1 hour"],
  "longTermGoals": ["string — strategic outcomes"]
}
Generate 4-8 steps. Each step must have 3-5 checklist items. Include real URLs for resources.`,
    user: (raw) => `Convert this into an execution plan:\n\n${sanitize(raw)}`,
    temperature: 0.6,
    maxTokens: 2200,
    schema: 'finalize',
  },

  general: {
    system: (_, adaptive) => `You are a knowledgeable XR/AR/VR assistant on SYNTHÉ.
Provide structured, actionable advice.
${adaptive}
${OUTPUT_SCHEMA_DIRECTIVE}

Required JSON schema:
{
  "answer": "string — clear, structured response",
  "steps": ["string — actionable next steps"],
  "resources": [{ "name": "string", "url": "string", "type": "tool|tutorial|docs" }],
  "relatedTopics": ["string — topics to explore next"]
}`,
    user: (raw) => sanitize(raw),
    temperature: 0.6,
    maxTokens: 600,
    schema: 'general',
  },
};

// ─── Main Builder ───────────────────────────────────────────────────────
export function buildPrompt(input: PipelineInput): StructuredPrompt {
  const template = TEMPLATES[input.type] ?? TEMPLATES.general;
  const params = input.params ?? {};
  const adaptiveBlock = buildAdaptiveBlock(input.context);

  const system = template.system(params, adaptiveBlock);
  const user = template.user(input.raw, params);

  return {
    system,
    user,
    temperature: template.temperature,
    maxTokens: template.maxTokens,
    outputSchema: template.schema,
    metadata: {
      type: input.type,
      inputHash: hashInput(user),
      timestamp: Date.now(),
    },
  };
}
