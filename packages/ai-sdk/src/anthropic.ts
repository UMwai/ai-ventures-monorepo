import Anthropic from "@anthropic-ai/sdk";
import { MODELS, DEFAULT_MODELS } from "./types";
import type { ChatMessage } from "./types";

let anthropicInstance: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!anthropicInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    anthropicInstance = new Anthropic({ apiKey });
  }
  return anthropicInstance;
}

export interface ClaudeCompletionOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  useOpus?: boolean;
}

/**
 * Chat completion using Claude 4.5 Opus (default) or Sonnet
 */
export async function claudeCompletion(
  prompt: string,
  options: ClaudeCompletionOptions = {}
): Promise<string> {
  const anthropic = getAnthropic();

  const {
    model = DEFAULT_MODELS.claude_primary,
    systemPrompt,
    maxTokens = 2000,
    temperature = 0.7,
    useOpus = true,
  } = options;

  // Use Opus by default, Sonnet for faster responses
  const selectedModel = useOpus ? MODELS.CLAUDE_OPUS_45 : model;

  const response = await anthropic.messages.create({
    model: selectedModel,
    max_tokens: maxTokens,
    system: systemPrompt || undefined,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") {
    return content.text;
  }
  return "";
}

/**
 * Completion with Claude 4.5 Opus specifically
 */
export async function claudeOpusCompletion(
  prompt: string,
  options: Omit<ClaudeCompletionOptions, "model" | "useOpus"> = {}
): Promise<string> {
  return claudeCompletion(prompt, {
    ...options,
    model: MODELS.CLAUDE_OPUS_45,
    useOpus: false,
  });
}

/**
 * Fast completion using Claude 4.5 Sonnet
 */
export async function claudeSonnetCompletion(
  prompt: string,
  options: Omit<ClaudeCompletionOptions, "model" | "useOpus"> = {}
): Promise<string> {
  return claudeCompletion(prompt, {
    ...options,
    model: MODELS.CLAUDE_SONNET_45,
    useOpus: false,
  });
}

/**
 * Fast completion using Claude 3.5 Haiku
 */
export async function claudeHaikuCompletion(
  prompt: string,
  options: Omit<ClaudeCompletionOptions, "model" | "useOpus"> = {}
): Promise<string> {
  return claudeCompletion(prompt, {
    ...options,
    model: MODELS.CLAUDE_HAIKU_35,
    useOpus: false,
  });
}

/**
 * Streaming completion using Claude 4.5
 */
export async function streamClaudeCompletion(
  prompt: string,
  options: ClaudeCompletionOptions = {}
): Promise<AsyncIterable<string>> {
  const anthropic = getAnthropic();

  const {
    model = MODELS.CLAUDE_OPUS_45,
    systemPrompt,
    maxTokens = 2000,
  } = options;

  const stream = await anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt || undefined,
    messages: [{ role: "user", content: prompt }],
  });

  async function* generateTokens(): AsyncGenerator<string> {
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  return generateTokens();
}

/**
 * Multi-turn conversation with Claude 4.5
 */
export async function claudeConversation(
  messages: ChatMessage[],
  options: Omit<ClaudeCompletionOptions, "systemPrompt"> = {}
): Promise<string> {
  const anthropic = getAnthropic();

  const { model = MODELS.CLAUDE_OPUS_45, maxTokens = 2000, temperature = 0.7 } =
    options;

  // Extract system message if present
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const formattedMessages = conversationMessages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content:
      typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
  }));

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemMessage
      ? typeof systemMessage.content === "string"
        ? systemMessage.content
        : JSON.stringify(systemMessage.content)
      : undefined,
    messages: formattedMessages,
  });

  const content = response.content[0];
  if (content.type === "text") {
    return content.text;
  }
  return "";
}

/**
 * Vision analysis with Claude 4.5
 */
export async function claudeVisionAnalysis(
  imageSource: string | Buffer,
  prompt: string,
  options: ClaudeCompletionOptions = {}
): Promise<string> {
  const anthropic = getAnthropic();

  const { model = MODELS.CLAUDE_OPUS_45, maxTokens = 1000 } = options;

  let imageData: { type: "base64"; media_type: string; data: string };

  if (Buffer.isBuffer(imageSource)) {
    imageData = {
      type: "base64",
      media_type: "image/jpeg",
      data: imageSource.toString("base64"),
    };
  } else if (imageSource.startsWith("data:")) {
    const matches = imageSource.match(/data:([^;]+);base64,(.+)/);
    if (matches) {
      imageData = {
        type: "base64",
        media_type: matches[1],
        data: matches[2],
      };
    } else {
      throw new Error("Invalid base64 image format");
    }
  } else {
    // URL - fetch and convert to base64
    const response = await fetch(imageSource);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    imageData = {
      type: "base64",
      media_type: contentType,
      data: Buffer.from(buffer).toString("base64"),
    };
  }

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: imageData,
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }
  return "";
}
