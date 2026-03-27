// lib/services/geminiService.ts
// ─── Layer 2: Gemini Service ─────────────────────────────────────────────
// Thin wrapper around lib/ai.ts askAI(). Adds JSON validation,
// structured error types, and automatic parse recovery.
// This is the ONLY module that calls the Gemini API.
// ─────────────────────────────────────────────────────────────────────────

import { askAI, AIError } from '../ai';
import { logger } from '../logger';
import type { StructuredPrompt, GeminiResponse } from './types';

// ─── Error Classification ───────────────────────────────────────────────
export type GeminiErrorType = 'PARSE_ERROR' | 'API_ERROR' | 'RATE_LIMIT' | 'EMPTY_RESPONSE';

export class GeminiServiceError extends Error {
  constructor(
    message: string,
    public readonly errorType: GeminiErrorType,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

// ─── JSON Recovery ──────────────────────────────────────────────────────
function attemptJsonParse(raw: string): Record<string, any> | null {
  // Direct parse
  try { return JSON.parse(raw); } catch {}

  // Strip common wrapper artifacts
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .replace(/^[^{[]*/, '')               // Strip text before first { or [
    .replace(/[^}\]]*$/, '')              // Strip text after last } or ]
    .trim();

  try { return JSON.parse(cleaned); } catch {}

  // Try to extract JSON from within text
  const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch {}
  }

  return null;
}

// ─── Validate parsed output has expected structure ──────────────────────
function validateOutput(parsed: Record<string, any>, schema: string): boolean {
  switch (schema) {
    case 'roadmap':
      return !!(parsed.title && parsed.phases && Array.isArray(parsed.phases));
    case 'tools':
      return !!(parsed.recommendations && Array.isArray(parsed.recommendations));
    case 'finalize':
      return !!(parsed.steps && Array.isArray(parsed.steps) && parsed.title);
    case 'general':
      return !!(parsed.answer || parsed.steps);
    default:
      return Object.keys(parsed).length > 0;
  }
}

// ─── Main Service Call ──────────────────────────────────────────────────
export async function callGemini(prompt: StructuredPrompt): Promise<GeminiResponse> {
  const start = Date.now();

  try {
    const raw = await askAI({
      system:      prompt.system,
      user:        prompt.user,
      temperature: prompt.temperature,
      maxTokens:   prompt.maxTokens,
    });

    if (!raw || raw.trim().length === 0) {
      return {
        raw: '',
        parsed: null,
        success: false,
        error: 'Empty response from Gemini',
        latencyMs: Date.now() - start,
      };
    }

    const parsed = attemptJsonParse(raw);

    if (!parsed) {
      logger.warn('GeminiService', 'JSON parse failed, returning raw', {
        rawLength: raw.length,
        first100: raw.slice(0, 100),
      });
      return {
        raw,
        parsed: null,
        success: false,
        error: 'Failed to parse Gemini response as JSON',
        latencyMs: Date.now() - start,
      };
    }

    // Validate against expected schema
    const valid = validateOutput(parsed, prompt.outputSchema);
    if (!valid) {
      logger.warn('GeminiService', 'Output validation failed', {
        schema: prompt.outputSchema,
        keys: Object.keys(parsed),
      });
    }

    return {
      raw,
      parsed,
      success: true,
      latencyMs: Date.now() - start,
    };

  } catch (err) {
    const latencyMs = Date.now() - start;

    if (err instanceof AIError) {
      const errorType: GeminiErrorType = err.statusCode === 429 ? 'RATE_LIMIT' : 'API_ERROR';
      logger.error('GeminiService', `API error: ${err.message}`, {
        status: err.statusCode,
        retryable: err.retryable,
      });
      return {
        raw: '',
        parsed: null,
        success: false,
        error: err.message,
        latencyMs,
      };
    }

    logger.error('GeminiService', `Unexpected error: ${(err as Error).message}`);
    return {
      raw: '',
      parsed: null,
      success: false,
      error: (err as Error).message,
      latencyMs,
    };
  }
}
