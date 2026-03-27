// lib/services/finalizer.ts
// ─── Layer 3: Utility Finalization Layer ─────────────────────────────────
// Takes Gemini JSON output and transforms it into execution-ready structure.
// This layer is PURE TypeScript — no AI calls. It applies:
//   1. Step segmentation
//   2. Priority assignment (P0/P1/P2) based on impact + effort
//   3. Dependency ordering (topological sort)
//   4. Duration estimation
//   5. Checklist normalization
// ─────────────────────────────────────────────────────────────────────────

import { logger } from '../logger';
import type { FinalizedOutput, FinalizedStep, Priority, GeminiResponse } from './types';

// ─── Priority Scoring ───────────────────────────────────────────────────
function assignPriority(step: any, index: number, total: number): Priority {
  // Explicit priority from Gemini
  if (step.priority) {
    const p = String(step.priority).toUpperCase();
    if (p === 'P0' || p.includes('CRITICAL') || p.includes('MUST')) return 'P0';
    if (p === 'P2' || p.includes('NICE') || p.includes('OPTIONAL')) return 'P2';
    if (p === 'P1') return 'P1';
  }

  // Heuristic: first 30% of steps are P0 (foundational)
  const position = index / total;
  if (position < 0.3) return 'P0';
  if (position < 0.7) return 'P1';
  return 'P2';
}

// ─── Dependency Detection ───────────────────────────────────────────────
function detectDependencies(steps: any[]): number[][] {
  return steps.map((step, idx) => {
    // Explicit dependsOn from Gemini
    if (Array.isArray(step.dependsOn) && step.dependsOn.length > 0) {
      return step.dependsOn.map(Number).filter((d: number) => d > 0 && d <= steps.length);
    }

    // Heuristic: each step depends on the previous one (linear chain)
    if (idx === 0) return [];
    return [steps[idx - 1]?.order ?? idx];
  });
}

// ─── Topological Sort (Kahn's algorithm) ────────────────────────────────
function topologicalSort(steps: FinalizedStep[]): number[] {
  const n = steps.length;
  const inDegree = new Map<number, number>();
  const adjacency = new Map<number, number[]>();

  // Initialise
  for (const s of steps) {
    inDegree.set(s.order, 0);
    adjacency.set(s.order, []);
  }

  // Build graph
  for (const s of steps) {
    for (const dep of s.dependsOn) {
      if (adjacency.has(dep)) {
        adjacency.get(dep)!.push(s.order);
        inDegree.set(s.order, (inDegree.get(s.order) ?? 0) + 1);
      }
    }
  }

  // BFS with priority-aware tie-breaking
  const queue: number[] = [];
  for (const s of steps) {
    if ((inDegree.get(s.order) ?? 0) === 0) queue.push(s.order);
  }

  // Sort queue by priority (P0 first)
  const priorityWeight = { P0: 0, P1: 1, P2: 2 };
  const stepMap = new Map(steps.map(s => [s.order, s]));
  queue.sort((a, b) => {
    const pa = priorityWeight[stepMap.get(a)?.priority ?? 'P1'];
    const pb = priorityWeight[stepMap.get(b)?.priority ?? 'P1'];
    return pa - pb;
  });

  const result: number[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    result.push(curr);

    for (const next of adjacency.get(curr) ?? []) {
      const newDeg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, newDeg);
      if (newDeg === 0) {
        queue.push(next);
        queue.sort((a, b) => {
          const pa = priorityWeight[stepMap.get(a)?.priority ?? 'P1'];
          const pb = priorityWeight[stepMap.get(b)?.priority ?? 'P1'];
          return pa - pb;
        });
      }
    }
  }

  // Fallback: if sort missed any steps (cycles), append them
  if (result.length < n) {
    for (const s of steps) {
      if (!result.includes(s.order)) result.push(s.order);
    }
  }

  return result;
}

// ─── Normalize Steps ────────────────────────────────────────────────────
function normalizeStep(raw: any, index: number, total: number): FinalizedStep {
  const priority = assignPriority(raw, index, total);

  return {
    order:       raw.order ?? index + 1,
    title:       String(raw.title ?? `Step ${index + 1}`),
    description: String(raw.description ?? ''),
    priority,
    duration:    String(raw.duration ?? 'TBD'),
    checklist:   Array.isArray(raw.checklist)
      ? raw.checklist.map(String).filter(Boolean)
      : [String(raw.description ?? 'Complete this step')],
    resources:   Array.isArray(raw.resources)
      ? raw.resources.map((r: any) => ({
          name: String(r.name ?? ''),
          url:  String(r.url ?? '#'),
          type: (['tool', 'tutorial', 'docs'].includes(r.type) ? r.type : 'docs') as 'tool' | 'tutorial' | 'docs',
        }))
      : [],
    tips:        String(raw.tips ?? ''),
    dependsOn:   [],  // Set after all steps normalised
  };
}

// ─── Duration Parser ────────────────────────────────────────────────────
function estimateTotalDuration(steps: FinalizedStep[]): string {
  let totalHours = 0;

  for (const step of steps) {
    const d = step.duration.toLowerCase();
    const numMatch = d.match(/(\d+(?:\.\d+)?)/);
    const num = numMatch ? parseFloat(numMatch[1]) : 1;

    if (d.includes('week'))       totalHours += num * 40;
    else if (d.includes('day'))   totalHours += num * 8;
    else if (d.includes('hour'))  totalHours += num;
    else if (d.includes('min'))   totalHours += num / 60;
    else                          totalHours += num;
  }

  if (totalHours >= 160) return `${Math.round(totalHours / 40)} weeks`;
  if (totalHours >= 16)  return `${Math.round(totalHours / 8)} days`;
  return `${Math.round(totalHours)} hours`;
}

// ─── Main Finalizer ─────────────────────────────────────────────────────
export function finalize(geminiResponse: GeminiResponse): FinalizedOutput {
  const data = geminiResponse.parsed;

  if (!data) {
    logger.warn('Finalizer', 'No parsed data — creating minimal output');
    return createMinimalOutput(geminiResponse.raw);
  }

  // Extract steps from various Gemini output formats
  const rawSteps: any[] =
    data.steps ?? data.phases ?? data.recommendations ?? [data];
  const total = rawSteps.length;

  // Normalise each step
  const steps = rawSteps.map((s, i) => normalizeStep(s, i, total));

  // Detect and assign dependencies
  const deps = detectDependencies(rawSteps);
  steps.forEach((s, i) => { s.dependsOn = deps[i] ?? []; });

  // Topological sort for execution order
  const executionOrder = topologicalSort(steps);

  // Group priorities
  const priorities = {
    p0: steps.filter(s => s.priority === 'P0').map(s => s.title),
    p1: steps.filter(s => s.priority === 'P1').map(s => s.title),
    p2: steps.filter(s => s.priority === 'P2').map(s => s.title),
  };

  // Extract quick wins and long-term goals
  const quickWins = Array.isArray(data.quickWins)
    ? data.quickWins.map(String)
    : steps.filter(s => s.priority === 'P0').slice(0, 3).map(s => s.checklist[0] ?? s.title);

  const longTermGoals = Array.isArray(data.longTermGoals)
    ? data.longTermGoals.map(String)
    : steps.filter(s => s.priority === 'P2').map(s => s.title);

  return {
    title:             String(data.title ?? 'Execution Plan'),
    summary:           String(data.summary ?? data.description ?? ''),
    totalSteps:        steps.length,
    estimatedDuration: data.estimatedDuration ?? data.totalDuration ?? estimateTotalDuration(steps),
    steps,
    priorities,
    quickWins,
    longTermGoals,
    executionOrder,
  };
}

// ─── Minimal Output (fallback) ──────────────────────────────────────────
function createMinimalOutput(raw: string): FinalizedOutput {
  return {
    title:             'Generated Plan',
    summary:           raw.slice(0, 200),
    totalSteps:        1,
    estimatedDuration: 'TBD',
    steps: [{
      order: 1,
      title: 'Review AI Output',
      description: raw,
      priority: 'P1',
      duration: 'TBD',
      checklist: ['Review the generated output', 'Identify key action items'],
      resources: [],
      tips: 'The AI output could not be fully structured. Please review manually.',
      dependsOn: [],
    }],
    priorities: { p0: [], p1: ['Review AI Output'], p2: [] },
    quickWins: [],
    longTermGoals: [],
    executionOrder: [1],
  };
}
