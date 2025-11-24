import OpenAI from "openai";

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
}

export async function chatCompletion(
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const openai = getOpenAI();

  const {
    model = "gpt-4-turbo-preview",
    systemPrompt,
    maxTokens = 1000,
    temperature = 0.7,
  } = options;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const response = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  });

  return response.choices[0]?.message?.content || "";
}

export async function streamCompletion(
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<AsyncIterable<string>> {
  const openai = getOpenAI();

  const {
    model = "gpt-4-turbo-preview",
    systemPrompt,
    maxTokens = 1000,
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
