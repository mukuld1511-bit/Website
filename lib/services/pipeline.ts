// lib/services/pipeline.ts
// ─── AI Execution Pipeline — Orchestrator ────────────────────────────────
// Enforces the strict data flow:
//   User Input → Prompt Controller → Gemini Service → Finalizer → Output
//
// No layer can be bypassed. Every call goes through this single entry point.
// ─────────────────────────────────────────────────────────────────────────

import { logger } from '../logger';
import { buildPrompt } from './promptBuilder';
import { callGemini } from './geminiService';
import { finalize } from './finalizer';
import { updateContext, getContext } from './adaptiveEngine';
import type { PipelineInput, PipelineResult, PipelineType } from './types';

// ─── Pipeline Execution ─────────────────────────────────────────────────
export async function executePipeline(input: PipelineInput): Promise<PipelineResult> {
  const pipelineStart = Date.now();
  const timings = { promptBuilder: 0, geminiService: 0, finalizer: 0, adaptive: 0 };

  logger.info('Pipeline', `Starting ${input.type} pipeline`, {
    rawLength: input.raw.length,
    hasParams: !!input.params,
  });

  try {
    // ─── Layer 4: Adaptive Engine (pre-processing) ────────────────────
    let t0 = Date.now();
    const adaptiveContext = updateContext(input);
    input.context = adaptiveContext;
    timings.adaptive = Date.now() - t0;

    logger.debug('Pipeline', 'Adaptive context updated', {
      skillLevel: adaptiveContext.skillLevel,
      queryCount: adaptiveContext.queryCount,
      patterns:   adaptiveContext.patterns.length,
    });

    // ─── Layer 1: Prompt Controller ───────────────────────────────────
    t0 = Date.now();
    const prompt = buildPrompt(input);
    timings.promptBuilder = Date.now() - t0;

    logger.debug('Pipeline', 'Prompt built', {
      systemLength: prompt.system.length,
      userLength:   prompt.user.length,
      schema:       prompt.outputSchema,
    });

    // ─── Layer 2: Gemini Service ──────────────────────────────────────
    t0 = Date.now();
    const geminiResponse = await callGemini(prompt);
    timings.geminiService = Date.now() - t0;

    if (!geminiResponse.success) {
      logger.error('Pipeline', `Gemini call failed: ${geminiResponse.error}`);
      return {
        success:  false,
        output:   {},
        adaptive: adaptiveContext,
        error:    geminiResponse.error ?? 'Gemini service failed',
        metadata: {
          type: input.type,
          totalLatencyMs: Date.now() - pipelineStart,
          layers: timings,
        },
      };
    }

    // ─── Layer 3: Finalizer ───────────────────────────────────────────
    t0 = Date.now();
    const finalizedOutput = finalize(geminiResponse);
    timings.finalizer = Date.now() - t0;

    logger.info('Pipeline', `Pipeline complete`, {
      type:     input.type,
      steps:    finalizedOutput.totalSteps,
      duration: `${Date.now() - pipelineStart}ms`,
    });

    return {
      success:  true,
      output:   finalizedOutput,
      adaptive: adaptiveContext,
      metadata: {
        type:           input.type,
        totalLatencyMs: Date.now() - pipelineStart,
        layers:         timings,
      },
    };

  } catch (err) {
    const errorMsg = (err as Error).message ?? 'Unknown pipeline error';
    logger.error('Pipeline', errorMsg);

    return {
      success:  false,
      output:   {},
      adaptive: getContext(),
      error:    errorMsg,
      metadata: {
        type:           input.type,
        totalLatencyMs: Date.now() - pipelineStart,
        layers:         timings,
      },
    };
  }
}

// ─── Convenience Wrappers ───────────────────────────────────────────────
export async function generateRoadmapPipeline(params: {
  age: string; goal: string; experience: string; style: string;
}): Promise<PipelineResult> {
  return executePipeline({
    type:   'roadmap',
    raw:    `${params.goal} for ${params.experience} learner`,
    params,
  });
}

export async function recommendToolsPipeline(
  useCase: string,
  toolList: string
): Promise<PipelineResult> {
  return executePipeline({
    type:   'tools',
    raw:    useCase,
    params: { toolList },
  });
}

export async function finalizePipeline(rawContent: string): Promise<PipelineResult> {
  return executePipeline({
    type: 'finalize',
    raw:  rawContent,
  });
}
