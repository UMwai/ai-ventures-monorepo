import { chatCompletion, gpt5Completion } from "./openai";
import { claudeCompletion, claudeOpusCompletion, claudeSonnetCompletion } from "./anthropic";
import { geminiCompletion, geminiProCompletion } from "./gemini";
import type { AIProvider, OrchestrationConfig, OrchestrationResult } from "./types";

export interface MultiModelResponse {
  provider: AIProvider;
  model: string;
  response: string;
  processingTime: number;
}

/**
 * Query multiple AI models in parallel and aggregate results
 */
export async function multiModelQuery(
  prompt: string,
  providers: AIProvider[] = ["openai", "anthropic", "google"],
  options: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<MultiModelResponse[]> {
  const { systemPrompt, maxTokens = 2000, temperature = 0.7 } = options;
  const results: MultiModelResponse[] = [];

  const queries = providers.map(async (provider): Promise<MultiModelResponse> => {
    const startTime = Date.now();
    let response: string;
    let model: string;

    switch (provider) {
      case "openai":
        model = "gpt-5";
        response = await gpt5Completion(prompt, { systemPrompt, maxTokens, temperature });
        break;
      case "anthropic":
        model = "claude-opus-4-5-20250929";
        response = await claudeOpusCompletion(prompt, { systemPrompt, maxTokens, temperature });
        break;
      case "google":
        model = "gemini-3-pro-preview";
        response = await geminiProCompletion(prompt, { systemPrompt, maxTokens, temperature });
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    return {
      provider,
      model,
      response,
      processingTime: Date.now() - startTime,
    };
  });

  const settledResults = await Promise.allSettled(queries);

  for (const result of settledResults) {
    if (result.status === "fulfilled") {
      results.push(result.value);
    }
  }

  return results;
}

/**
 * Get consensus from multiple models - useful for validation
 */
export async function getConsensus<T>(
  prompt: string,
  parseResponse: (response: string) => T,
  options: {
    providers?: AIProvider[];
    consensusThreshold?: number;
    systemPrompt?: string;
  } = {}
): Promise<{
  consensus: T | null;
  responses: { provider: AIProvider; parsed: T; raw: string }[];
  agreementScore: number;
}> {
  const {
    providers = ["openai", "anthropic", "google"],
    consensusThreshold = 0.67,
    systemPrompt,
  } = options;

  const responses = await multiModelQuery(prompt, providers, { systemPrompt });

  const parsedResponses = responses.map((r) => ({
    provider: r.provider,
    parsed: parseResponse(r.response),
    raw: r.response,
  }));

  // Simple consensus: find the most common response
  const responseCounts = new Map<string, { count: number; value: T }>();

  for (const r of parsedResponses) {
    const key = JSON.stringify(r.parsed);
    const existing = responseCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      responseCounts.set(key, { count: 1, value: r.parsed });
    }
  }

  let maxCount = 0;
  let consensus: T | null = null;

  for (const { count, value } of responseCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
      consensus = value;
    }
  }

  const agreementScore = maxCount / parsedResponses.length;

  if (agreementScore < consensusThreshold) {
    consensus = null;
  }

  return {
    consensus,
    responses: parsedResponses,
    agreementScore,
  };
}

/**
 * Orchestrated completion with primary, validator, and fallback models
 */
export async function orchestratedCompletion<T>(
  prompt: string,
  config: OrchestrationConfig,
  options: {
    parseResponse?: (response: string) => T;
    validateResponse?: (response: string | T) => boolean;
  } = {}
): Promise<OrchestrationResult<T>> {
  const { parseResponse, validateResponse } = options;
  const startTime = Date.now();
  const modelsUsed: string[] = [];
  let iterations = 0;
  let primaryResponse = "";
  let validatorResponse: string | undefined;
  let consensusReached = false;

  // Step 1: Get primary response
  primaryResponse = await getProviderCompletion(
    prompt,
    config.primary.provider,
    config.primary.model
  );
  modelsUsed.push(config.primary.model);
  iterations++;

  let result: T = parseResponse
    ? parseResponse(primaryResponse)
    : (primaryResponse as unknown as T);

  // Step 2: Validate with validator model if configured
  if (config.validator) {
    const maxIterations = config.maxIterations || 3;

    while (iterations < maxIterations && !consensusReached) {
      const validationPrompt = `
Validate the following response to this prompt:

ORIGINAL PROMPT:
${prompt}

RESPONSE TO VALIDATE:
${primaryResponse}

Is this response accurate, complete, and helpful? If not, provide a corrected response.
If the response is good, reply with "VALIDATED: <original response>".
`;

      validatorResponse = await getProviderCompletion(
        validationPrompt,
        config.validator.provider,
        config.validator.model
      );
      modelsUsed.push(config.validator.model);
      iterations++;

      if (validatorResponse.startsWith("VALIDATED:")) {
        consensusReached = true;
      } else if (config.consensusRequired) {
        // Use validator's response and validate again
        primaryResponse = validatorResponse;
        result = parseResponse
          ? parseResponse(primaryResponse)
          : (primaryResponse as unknown as T);
      } else {
        // Accept validator's response without further iteration
        consensusReached = true;
        result = parseResponse
          ? parseResponse(validatorResponse)
          : (validatorResponse as unknown as T);
      }
    }
  } else {
    consensusReached = true;
  }

  // Step 3: Use fallback if no consensus and fallback is configured
  if (!consensusReached && config.fallback) {
    const fallbackResponse = await getProviderCompletion(
      prompt,
      config.fallback.provider,
      config.fallback.model
    );
    modelsUsed.push(config.fallback.model);
    result = parseResponse
      ? parseResponse(fallbackResponse)
      : (fallbackResponse as unknown as T);
  }

  return {
    result,
    metadata: {
      primaryResponse,
      validatorResponse,
      iterations,
      consensusReached,
      totalTime: Date.now() - startTime,
      modelsUsed,
    },
  };
}

/**
 * Helper to get completion from a specific provider and model
 */
async function getProviderCompletion(
  prompt: string,
  provider: AIProvider,
  model: string
): Promise<string> {
  switch (provider) {
    case "openai":
      return chatCompletion(prompt, { model, useLatestModel: false });
    case "anthropic":
      return claudeCompletion(prompt, { model, useOpus: false });
    case "google":
      return geminiCompletion(prompt, { model, usePro: false });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Structured output with multi-model validation
 */
export async function structuredOutput<T>(
  prompt: string,
  schema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  },
  options: {
    provider?: AIProvider;
    validateWithSecondModel?: boolean;
  } = {}
): Promise<T> {
  const { provider = "openai", validateWithSecondModel = true } = options;

  const structuredPrompt = `
${prompt}

Respond with valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

IMPORTANT: Only output valid JSON, no additional text.
`;

  let response: string;

  switch (provider) {
    case "openai":
      response = await gpt5Completion(structuredPrompt);
      break;
    case "anthropic":
      response = await claudeOpusCompletion(structuredPrompt);
      break;
    case "google":
      response = await geminiProCompletion(structuredPrompt);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as T;

  if (validateWithSecondModel) {
    // Validate structure with a different model
    const validationProvider: AIProvider =
      provider === "openai" ? "anthropic" : "openai";

    const validationPrompt = `
Does this JSON object match the expected schema? Reply with only "true" or "false".

SCHEMA:
${JSON.stringify(schema, null, 2)}

JSON:
${JSON.stringify(parsed, null, 2)}
`;

    const validation =
      validationProvider === "openai"
        ? await gpt5Completion(validationPrompt)
        : await claudeSonnetCompletion(validationPrompt);

    if (!validation.toLowerCase().includes("true")) {
      throw new Error("JSON validation failed with second model");
    }
  }

  return parsed;
}
