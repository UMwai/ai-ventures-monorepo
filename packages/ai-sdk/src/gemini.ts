import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { MODELS, DEFAULT_MODELS } from "./types";
import type { ChatMessage } from "./types";

let genAI: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable is not set"
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface GeminiCompletionOptions {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  usePro?: boolean;
}

/**
 * Chat completion using Gemini 3 Pro (default) or other Gemini models
 */
export async function geminiCompletion(
  prompt: string,
  options: GeminiCompletionOptions = {}
): Promise<string> {
  const genAI = getGemini();

  const {
    model = DEFAULT_MODELS.gemini_primary,
    systemPrompt,
    maxTokens = 2000,
    temperature = 0.7,
    usePro = true,
  } = options;

  // Use Pro by default, Flash for faster responses
  const selectedModel = usePro ? MODELS.GEMINI_3_PRO : model;

  const generativeModel = genAI.getGenerativeModel({
    model: selectedModel,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
    systemInstruction: systemPrompt || undefined,
  });

  const result = await generativeModel.generateContent(prompt);
  const response = result.response;
  return response.text();
}

/**
 * Completion with Gemini 3 Pro specifically
 */
export async function geminiProCompletion(
  prompt: string,
  options: Omit<GeminiCompletionOptions, "model" | "usePro"> = {}
): Promise<string> {
  return geminiCompletion(prompt, {
    ...options,
    model: MODELS.GEMINI_3_PRO,
    usePro: false,
  });
}

/**
 * Ultra-powerful completion using Gemini 3 Ultra
 */
export async function geminiUltraCompletion(
  prompt: string,
  options: Omit<GeminiCompletionOptions, "model" | "usePro"> = {}
): Promise<string> {
  return geminiCompletion(prompt, {
    ...options,
    model: MODELS.GEMINI_3_ULTRA,
    usePro: false,
  });
}

/**
 * Fast completion using Gemini 3 Flash
 */
export async function geminiFlashCompletion(
  prompt: string,
  options: Omit<GeminiCompletionOptions, "model" | "usePro"> = {}
): Promise<string> {
  return geminiCompletion(prompt, {
    ...options,
    model: MODELS.GEMINI_3_FLASH,
    usePro: false,
  });
}

/**
 * Streaming completion using Gemini 3
 */
export async function streamGeminiCompletion(
  prompt: string,
  options: GeminiCompletionOptions = {}
): Promise<AsyncIterable<string>> {
  const genAI = getGemini();

  const {
    model = MODELS.GEMINI_3_PRO,
    systemPrompt,
    maxTokens = 2000,
    temperature = 0.7,
  } = options;

  const generativeModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
    systemInstruction: systemPrompt || undefined,
  });

  const result = await generativeModel.generateContentStream(prompt);

  async function* generateTokens(): AsyncGenerator<string> {
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  return generateTokens();
}

/**
 * Multi-turn conversation with Gemini 3
 */
export async function geminiConversation(
  messages: ChatMessage[],
  options: Omit<GeminiCompletionOptions, "systemPrompt"> = {}
): Promise<string> {
  const genAI = getGemini();

  const { model = MODELS.GEMINI_3_PRO, maxTokens = 2000, temperature = 0.7 } =
    options;

  // Extract system message if present
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const generativeModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
    systemInstruction: systemMessage
      ? typeof systemMessage.content === "string"
        ? systemMessage.content
        : JSON.stringify(systemMessage.content)
      : undefined,
  });

  const chat = generativeModel.startChat({
    history: conversationMessages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [
        {
          text:
            typeof msg.content === "string"
              ? msg.content
              : JSON.stringify(msg.content),
        },
      ],
    })),
  });

  const lastMessage = conversationMessages[conversationMessages.length - 1];
  const result = await chat.sendMessage(
    typeof lastMessage.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage.content)
  );

  return result.response.text();
}

/**
 * Vision analysis with Gemini 3
 */
export async function geminiVisionAnalysis(
  imageSource: string | Buffer,
  prompt: string,
  options: GeminiCompletionOptions = {}
): Promise<string> {
  const genAI = getGemini();

  const { model = MODELS.GEMINI_3_PRO, maxTokens = 1000 } = options;

  const generativeModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
    },
  });

  let imagePart: { inlineData: { data: string; mimeType: string } };

  if (Buffer.isBuffer(imageSource)) {
    imagePart = {
      inlineData: {
        data: imageSource.toString("base64"),
        mimeType: "image/jpeg",
      },
    };
  } else if (imageSource.startsWith("data:")) {
    const matches = imageSource.match(/data:([^;]+);base64,(.+)/);
    if (matches) {
      imagePart = {
        inlineData: {
          data: matches[2],
          mimeType: matches[1],
        },
      };
    } else {
      throw new Error("Invalid base64 image format");
    }
  } else {
    // URL - fetch and convert to base64
    const response = await fetch(imageSource);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    imagePart = {
      inlineData: {
        data: Buffer.from(buffer).toString("base64"),
        mimeType: contentType,
      },
    };
  }

  const result = await generativeModel.generateContent([prompt, imagePart]);
  return result.response.text();
}

/**
 * Grounding with Google Search (Gemini 3 feature)
 */
export async function geminiWithGrounding(
  prompt: string,
  options: GeminiCompletionOptions = {}
): Promise<{ text: string; groundingMetadata?: unknown }> {
  const genAI = getGemini();

  const { model = MODELS.GEMINI_3_PRO, maxTokens = 2000, temperature = 0.7 } =
    options;

  const generativeModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
    // Enable Google Search grounding
    tools: [{ googleSearchRetrieval: {} }],
  });

  const result = await generativeModel.generateContent(prompt);
  const response = result.response;

  return {
    text: response.text(),
    groundingMetadata: response.candidates?.[0]?.groundingMetadata,
  };
}
