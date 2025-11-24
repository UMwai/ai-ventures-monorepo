export interface VisionOptions {
  prompt?: string;
  model?: string;
  maxTokens?: number;
  detail?: "low" | "high" | "auto";
}

export interface VisionAnalysisResult {
  description: string;
  model: string;
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
    detectedObjects?: string[];
    textInImage?: string;
    facesDetected?: number;
  };
}

export interface GenerationConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
