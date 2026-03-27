// app/api/ai/route.ts
// ─── Server-side AI Pipeline Endpoint ────────────────────────────────────
// Runs the full 4-layer pipeline server-side (keeps API key secure).
// POST body: { type: 'roadmap'|'tools'|'finalize'|'general', raw: string, params?: {} }
// Returns: PipelineResult
// ─────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { executePipeline } from '../../../lib/services/pipeline';
import type { PipelineType, AdaptiveContext } from '../../../lib/services/types';

const VALID_TYPES: PipelineType[] = ['roadmap', 'tools', 'finalize', 'general'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate type
    const type = body.type as PipelineType;
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Use: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate raw input
    const raw = String(body.raw ?? '').trim();
    if (!raw && type !== 'roadmap') {
      return NextResponse.json(
        { success: false, error: 'Missing "raw" field — provide input text' },
        { status: 400 }
      );
    }

    // Build pipeline input
    const result = await executePipeline({
      type,
      raw:     raw || `${body.params?.goal ?? 'learn XR'}`,
      params:  body.params ?? {},
      context: body.context as AdaptiveContext | undefined,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });

  } catch (err) {
    console.error('[API /ai] Error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
