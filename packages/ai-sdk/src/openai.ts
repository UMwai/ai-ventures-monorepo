import OpenAI from "openai";
import { MODELS, DEFAULT_MODELS } from "./types";
import type { ChatMessage, GenerationConfig } from "./types";

let openaiInstance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

export interface ChatCompletionOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  useLatestModel?: boolean;
}

/**
 * Chat completion using GPT-5 (default) or specified model
 */
export async function chatCompletion(
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const openai = getOpenAI();

  const {
    model = DEFAULT_MODELS.chat, // GPT-5 by default
    systemPrompt,
    maxTokens = 2000,
    temperature = 0.7,
    useLatestModel = true,
  } = options;

  // Use GPT-5 if useLatestModel is true
  const selectedModel = useLatestModel ? MODELS.GPT5 : model;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const response = await openai.chat.completions.create({
    model: selectedModel,
    messages,
    max_tokens: maxTokens,
    temperature,
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Chat completion with GPT-5 specifically
 */
export async function gpt5Completion(
  prompt: string,
  options: Omit<ChatCompletionOptions, "model" | "useLatestModel"> = {}
): Promise<string> {
  return chatCompletion(prompt, {
    ...options,
    model: MODELS.GPT5,
    useLatestModel: false,
  });
}

/**
 * Fast completion using GPT-5-mini
 */
export async function gpt5MiniCompletion(
  prompt: string,
  options: Omit<ChatCompletionOptions, "model" | "useLatestModel"> = {}
): Promise<string> {
  return chatCompletion(prompt, {
    ...options,
    model: MODELS.GPT5_MINI,
    useLatestModel: false,
  });
}

/**
 * Reasoning-optimized completion using o3 model
 */
export async function o3Completion(
  prompt: string,
  options: Omit<ChatCompletionOptions, "model" | "useLatestModel"> = {}
): Promise<string> {
  return chatCompletion(prompt, {
    ...options,
    model: MODELS.O3,
    useLatestModel: false,
  });
}

/**
 * Streaming completion using GPT-5
 */
export async function streamCompletion(
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<AsyncIterable<string>> {
  const openai = getOpenAI();

  const {
    model = MODELS.GPT5,
    systemPrompt,
    maxTokens = 2000,
    temperature = 0.7,
  } = options;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const stream = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });

  async function* generateTokens(): AsyncGenerator<string> {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  return generateTokens();
}

/**
 * Multi-turn conversation with GPT-5
 */
export async function conversationCompletion(
  messages: ChatMessage[],
  options: Omit<ChatCompletionOptions, "systemPrompt"> = {}
): Promise<string> {
  const openai = getOpenAI();

  const {
    model = MODELS.GPT5,
    maxTokens = 2000,
    temperature = 0.7,
  } = options;

  const formattedMessages = messages.map((msg) => ({
    role: msg.role,
    content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
  })) as OpenAI.Chat.ChatCompletionMessageParam[];

  const response = await openai.chat.completions.create({
    model,
    messages: formattedMessages,
    max_tokens: maxTokens,
    temperature,
  });

  return response.choices[0]?.message?.content || "";
}

// Export model constants for convenience
export { MODELS, DEFAULT_MODELS };
