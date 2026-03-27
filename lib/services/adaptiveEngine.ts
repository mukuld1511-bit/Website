// lib/services/adaptiveEngine.ts
// ─── Layer 4: Adaptive Intelligence ──────────────────────────────────────
// Lightweight session-based learning system using localStorage.
// No database required — runs entirely in the browser.
//
// Tracks: topics queried, skill level signals, repeated themes
// Detects: patterns, weak areas, progression
// Outputs: AdaptiveContext injected into Prompt Controller
// ─────────────────────────────────────────────────────────────────────────

import type { AdaptiveContext, PipelineInput } from './types';

const STORAGE_KEY = 'synthe_adaptive_profile';
const MAX_TOPICS = 50;
const MAX_PATTERNS = 10;

// ─── Default Context ────────────────────────────────────────────────────
function defaultContext(): AdaptiveContext {
  return {
    topics:      [],
    skillLevel:  'intermediate',
    strengths:   [],
    weaknesses:  [],
    queryCount:  0,
    lastQueryAt: 0,
    patterns:    [],
  };
}

// ─── Storage I/O ────────────────────────────────────────────────────────
export function loadContext(): AdaptiveContext {
  if (typeof window === 'undefined') return defaultContext();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultContext();
    const parsed = JSON.parse(raw);
    return { ...defaultContext(), ...parsed };
  } catch {
    return defaultContext();
  }
}

export function saveContext(ctx: AdaptiveContext): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {}
}

export function clearContext(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Topic Extraction ───────────────────────────────────────────────────
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'AR/Augmented Reality': ['ar', 'augmented', 'arkit', 'arcore', 'webxr', 'ar.js'],
  'VR/Virtual Reality':   ['vr', 'virtual', 'oculus', 'quest', 'openvr', 'steamvr'],
  'Unity':                ['unity', 'unity3d', 'c#', 'unityengine'],
  'Unreal Engine':        ['unreal', 'ue4', 'ue5', 'blueprints'],
  'WebXR':                ['webxr', 'three.js', 'threejs', 'a-frame', 'babylon'],
  'Blender':              ['blender', '3d modeling', 'sculpting'],
  '3D Modeling':          ['3d model', 'modeling', 'mesh', 'polygon', 'texturing'],
  'Game Dev':             ['game', 'gameplay', 'level design', 'physics'],
  'React':                ['react', 'nextjs', 'next.js', 'jsx', 'tsx'],
  'AI/ML':                ['machine learning', 'ml', 'neural', 'ai', 'deep learning'],
  'Shaders':              ['shader', 'glsl', 'hlsl', 'material'],
  'Animation':            ['animation', 'rigging', 'motion capture', 'mocap'],
};

function extractTopics(input: string): string[] {
  const lower = input.toLowerCase();
  const found: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      found.push(topic);
    }
  }

  return found;
}

// ─── Skill Level Detection ──────────────────────────────────────────────
const BEGINNER_SIGNALS = [
  'beginner', 'new to', 'just started', 'never', 'first time',
  'basics', 'introduction', 'getting started', 'what is', 'how to start',
  'zero', 'no experience', 'complete beginner',
];

const ADVANCED_SIGNALS = [
  'advanced', 'expert', 'professional', 'production', 'optimize',
  'performance', 'architecture', 'scale', 'enterprise', 'deploy',
  'deep dive', 'experienced', 'complex', 'custom shader',
];

function detectSkillLevel(input: string, currentLevel: AdaptiveContext['skillLevel']): AdaptiveContext['skillLevel'] {
  const lower = input.toLowerCase();

  const beginnerScore = BEGINNER_SIGNALS.filter(s => lower.includes(s)).length;
  const advancedScore = ADVANCED_SIGNALS.filter(s => lower.includes(s)).length;

  if (beginnerScore > advancedScore && beginnerScore >= 2) return 'beginner';
  if (advancedScore > beginnerScore && advancedScore >= 2) return 'advanced';

  // Single signals shift from default
  if (beginnerScore > 0 && currentLevel === 'intermediate') return 'beginner';
  if (advancedScore > 0 && currentLevel === 'intermediate') return 'advanced';

  return currentLevel;
}

// ─── Pattern Detection ──────────────────────────────────────────────────
function detectPatterns(ctx: AdaptiveContext): string[] {
  const patterns: string[] = [];

  // Count topic frequencies
  const topicCounts = new Map<string, number>();
  for (const t of ctx.topics) {
    topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
  }

  // Repeated topics → potential weakness or strong interest
  for (const [topic, count] of topicCounts) {
    if (count >= 3) {
      patterns.push(`User frequently asks about ${topic} (${count}x) — may need deeper coverage or is highly interested`);
    }
  }

  // Short session bursts
  if (ctx.queryCount >= 5 && ctx.lastQueryAt > 0) {
    const timeSinceFirst = Date.now() - ctx.lastQueryAt;
    if (timeSinceFirst < 10 * 60 * 1000) { // 10 minutes
      patterns.push('High engagement burst — user is actively learning');
    }
  }

  // Beginner asking complex topics
  if (ctx.skillLevel === 'beginner') {
    const advancedTopics = ctx.topics.filter(t =>
      ['Shaders', 'AI/ML', 'Unreal Engine'].includes(t)
    );
    if (advancedTopics.length > 0) {
      patterns.push(`Beginner exploring advanced topics (${advancedTopics.join(', ')}) — provide simplified explanations`);
    }
  }

  return patterns.slice(0, MAX_PATTERNS);
}

// ─── Strengths & Weaknesses ─────────────────────────────────────────────
function classifyStrengths(ctx: AdaptiveContext): { strengths: string[]; weaknesses: string[] } {
  const topicCounts = new Map<string, number>();
  for (const t of ctx.topics) {
    topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
  }

  const sorted = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Top 3 = strengths (things they keep exploring → building competence)
  const strengths = sorted.slice(0, 3).map(([t]) => t);

  // Topics asked about only once that are fundamental → potential weakness
  const weaknesses = sorted
    .filter(([_, count]) => count === 1)
    .slice(0, 3)
    .map(([t]) => t);

  return { strengths, weaknesses };
}

// ─── Main Update Function ───────────────────────────────────────────────
export function updateContext(input: PipelineInput): AdaptiveContext {
  const ctx = loadContext();

  // Extract topics from current input
  const combinedInput = `${input.raw} ${Object.values(input.params ?? {}).join(' ')}`;
  const newTopics = extractTopics(combinedInput);

  // Update topics (capped)
  ctx.topics = [...ctx.topics, ...newTopics].slice(-MAX_TOPICS);

  // Update skill level
  ctx.skillLevel = detectSkillLevel(combinedInput, ctx.skillLevel);

  // Update query tracking
  ctx.queryCount += 1;
  if (ctx.queryCount === 1) ctx.lastQueryAt = Date.now();

  // Classify strengths/weaknesses
  const { strengths, weaknesses } = classifyStrengths(ctx);
  ctx.strengths = strengths;
  ctx.weaknesses = weaknesses;

  // Detect patterns
  ctx.patterns = detectPatterns(ctx);

  // Persist
  saveContext(ctx);

  return ctx;
}

// ─── Get Context Without Updating ───────────────────────────────────────
export function getContext(): AdaptiveContext {
  return loadContext();
}
