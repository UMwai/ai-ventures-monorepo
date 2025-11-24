export interface VisionOptions {
  prompt?: string;
  model?: string;
  maxTokens?: number;
  detail?: "low" | "high" | "auto";
  provider?: AIProvider;
}

export interface VisionAnalysisResult {
  description: string;
  model: string;
  provider: AIProvider;
  processingTime: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AltTextResult {
  short: string;
  medium: string;
  long: string;
  quality: {
    score: number;
    wcagCompliant: boolean;
    suggestions?: string[];
  };
  metadata?: {
    processingTime: number;
    model: string;
    provider: AIProvider;
    detectedObjects?: string[];
    textInImage?: string;
    facesDetected?: number;
  };
}

export interface GenerationConfig {
  model?: string;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail?: "low" | "high" | "auto";
  };
}

// ============================================
// AI Provider Types
// ============================================

export type AIProvider = "openai" | "anthropic" | "google";

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
}

// ============================================
// Model Constants - Latest Models (2024-2025)
// ============================================

export const MODELS = {
  // OpenAI GPT-5 Series (Latest)
  GPT5: "gpt-5",
  GPT5_VISION: "gpt-5-vision",
  GPT5_MINI: "gpt-5-mini",
  O4_MINI: "o4-mini",
  O3: "o3",

  // OpenAI GPT-4 Series (Fallback)
  GPT4_TURBO: "gpt-4-turbo",
  GPT4_VISION: "gpt-4-vision-preview",
  GPT4O: "gpt-4o",
  GPT4O_MINI: "gpt-4o-mini",

  // Anthropic Claude 4.5 Series (Latest)
  CLAUDE_OPUS_45: "claude-opus-4-5-20250929",
  CLAUDE_SONNET_45: "claude-sonnet-4-5-20250929",
  CLAUDE_HAIKU_35: "claude-3-5-haiku-20241022",

  // Anthropic Claude 3 Series (Fallback)
  CLAUDE_OPUS: "claude-3-opus-20240229",
  CLAUDE_SONNET: "claude-3-sonnet-20240229",

  // Google Gemini 3 Series (Latest)
  GEMINI_3_PRO: "gemini-3-pro-preview",
  GEMINI_3_ULTRA: "gemini-3-ultra-preview",
  GEMINI_3_FLASH: "gemini-3-flash",

  // Google Gemini 2 Series (Fallback)
  GEMINI_2_PRO: "gemini-2.0-pro",
  GEMINI_2_FLASH: "gemini-2.0-flash",
  GEMINI_25_PRO: "gemini-2.5-pro",
  GEMINI_25_FLASH: "gemini-2.5-flash",
} as const;

export type ModelId = typeof MODELS[keyof typeof MODELS];

// ============================================
// Default Model Configuration
// ============================================

export const DEFAULT_MODELS = {
  // Primary models (latest)
  chat: MODELS.GPT5,
  vision: MODELS.GPT5_VISION,
  reasoning: MODELS.O3,
  fast: MODELS.GPT5_MINI,

  // Claude models
  claude_primary: MODELS.CLAUDE_OPUS_45,
  claude_fast: MODELS.CLAUDE_SONNET_45,

  // Gemini models
  gemini_primary: MODELS.GEMINI_3_PRO,
  gemini_fast: MODELS.GEMINI_3_FLASH,
} as const;

// ============================================
// Multi-Model Orchestration Types
// ============================================

export interface OrchestrationConfig {
  primary: {
    provider: AIProvider;
    model: ModelId;
  };
  validator?: {
    provider: AIProvider;
    model: ModelId;
  };
  fallback?: {
    provider: AIProvider;
    model: ModelId;
  };
  maxIterations?: number;
  consensusRequired?: boolean;
}

export interface OrchestrationResult<T> {
  result: T;
  metadata: {
    primaryResponse: string;
    validatorResponse?: string;
    iterations: number;
    consensusReached: boolean;
    totalTime: number;
    modelsUsed: string[];
  };
}
