// lib/services/types.ts
// ─── Shared types for the AI Execution Pipeline ─────────────────────────

// ─── Pipeline Input ─────────────────────────────────────────────────────
export type PipelineType = 'roadmap' | 'tools' | 'finalize' | 'general';

export interface PipelineInput {
  type:     PipelineType;
  raw:      string;                        // Raw user input text
  params?:  Record<string, string>;        // Structured params (age, goal, etc.)
  context?: AdaptiveContext;               // Injected by adaptive engine
}

// ─── Prompt Controller Output ───────────────────────────────────────────
export interface StructuredPrompt {
  system:       string;
  user:         string;
  temperature:  number;
  maxTokens:    number;
  outputSchema: string;                    // Expected JSON schema descriptor
  metadata: {
    type:       PipelineType;
    inputHash:  string;                    // For dedup/tracking
    timestamp:  number;
  };
}

// ─── Gemini Service Output ──────────────────────────────────────────────
export interface GeminiResponse {
  raw:        string;                      // Raw text from Gemini
  parsed:     Record<string, any> | null;  // Parsed JSON (null if parse failed)
  success:    boolean;
  error?:     string;
  latencyMs:  number;
}

// ─── Finalizer Output ───────────────────────────────────────────────────
export type Priority = 'P0' | 'P1' | 'P2';

export interface FinalizedStep {
  order:        number;
  title:        string;
  description:  string;
  priority:     Priority;
  duration:     string;
  checklist:    string[];
  resources:    { name: string; url: string; type: 'tool' | 'tutorial' | 'docs' }[];
  tips:         string;
  dependsOn:    number[];                  // Step orders this depends on
}

export interface FinalizedOutput {
  title:             string;
  summary:           string;
  totalSteps:        number;
  estimatedDuration: string;
  steps:             FinalizedStep[];
  priorities: {
    p0: string[];                          // Must-do immediately
    p1: string[];                          // Important but not urgent
    p2: string[];                          // Nice-to-have
  };
  quickWins:         string[];
  longTermGoals:     string[];
  executionOrder:    number[];             // Dependency-sorted step order
}

// ─── Adaptive Context ───────────────────────────────────────────────────
export interface AdaptiveContext {
  topics:       string[];                  // Topics the user has queried
  skillLevel:   'beginner' | 'intermediate' | 'advanced';
  strengths:    string[];
  weaknesses:   string[];
  queryCount:   number;
  lastQueryAt:  number;
  patterns:     string[];                  // Detected patterns e.g. "repeated React basics"
}

// ─── Pipeline Result ────────────────────────────────────────────────────
export interface PipelineResult {
  success:   boolean;
  output:    FinalizedOutput | Record<string, any>;
  adaptive:  AdaptiveContext;
  metadata: {
    type:           PipelineType;
    totalLatencyMs: number;
    layers: {
      promptBuilder: number;
      geminiService: number;
      finalizer:     number;
      adaptive:      number;
    };
  };
  error?:    string;
}
