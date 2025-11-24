import OpenAI from "openai";
import { getOpenAI } from "./openai";
import { MODELS, DEFAULT_MODELS, type AIProvider } from "./types";
import type { VisionAnalysisResult, VisionOptions } from "./types";

export async function analyzeImage(
  imageSource: string | Buffer,
  options: VisionOptions = {}
): Promise<VisionAnalysisResult> {
  const openai = getOpenAI();

  const {
    prompt = "Describe this image in detail.",
    model = MODELS.GPT5_VISION, // GPT-5 Vision by default
    maxTokens = 500,
    detail = "high",
    provider = "openai",
  } = options;

  // Handle different image sources
  let imageUrl: string;
  if (Buffer.isBuffer(imageSource)) {
    const base64 = imageSource.toString("base64");
    imageUrl = `data:image/jpeg;base64,${base64}`;
  } else if (imageSource.startsWith("data:")) {
    imageUrl = imageSource;
  } else {
    imageUrl = imageSource;
  }

  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail,
            },
          },
        ],
      },
    ],
  });

  const processingTime = Date.now() - startTime;
  const content = response.choices[0]?.message?.content || "";

  return {
    description: content,
    model,
    provider,
    processingTime,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

export async function generateAltText(
  imageSource: string | Buffer,
  options: {
    context?: string;
    tone?: "neutral" | "professional" | "friendly";
    length?: "short" | "medium" | "long";
    industry?: string;
  } = {}
): Promise<{
  short: string;
  medium: string;
  long: string;
  quality: { score: number; wcagCompliant: boolean };
}> {
  const { context = "", tone = "neutral", length = "medium", industry } = options;

  const systemPrompt = buildAltTextPrompt({ context, tone, length, industry });

  const result = await analyzeImage(imageSource, {
    prompt: systemPrompt,
    maxTokens: 300,
    detail: "high",
  });

  const fullText = result.description;

  // Parse or truncate for different lengths
  const short = truncateToSentence(fullText, 50);
  const medium = truncateToSentence(fullText, 125);
  const long = truncateToSentence(fullText, 250);

  const quality = calculateQuality(fullText);

  return {
    short,
    medium,
    long,
    quality,
  };
}

function buildAltTextPrompt(options: {
  context?: string;
  tone?: string;
  length?: string;
  industry?: string;
}): string {
  const { context, tone, length, industry } = options;

  let prompt = `Generate accessible alt text for this image following WCAG 2.1 guidelines.

Requirements:
- Be specific and descriptive
- Don't start with "Image of" or "Picture of"
- Include relevant details: objects, people (count only, not identity), actions, text in image
- Be concise but comprehensive`;

  if (context) {
    prompt += `\n- Context: ${context}`;
  }

  if (tone) {
    prompt += `\n- Tone: ${tone}`;
  }

  if (industry) {
    prompt += `\n- Industry focus: ${industry}`;
  }

  if (length === "short") {
    prompt += "\n- Keep under 50 characters";
  } else if (length === "long") {
    prompt += "\n- Provide detailed description up to 250 characters";
  } else {
    prompt += "\n- Standard length around 125 characters";
  }

  prompt += "\n\nProvide only the alt text, no explanations.";

  return prompt;
}

function truncateToSentence(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Try to find a natural break point
  let truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastComma = truncated.lastIndexOf(",");

  if (lastPeriod > maxLength * 0.5) {
    return truncated.substring(0, lastPeriod + 1);
  }

  if (lastComma > maxLength * 0.6) {
    return truncated.substring(0, lastComma);
  }

  // Find last space to avoid cutting words
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace);
  }

  return truncated;
}

function calculateQuality(text: string): { score: number; wcagCompliant: boolean } {
  let score = 100;

  // Length penalties
  if (text.length < 20) score -= 25;
  else if (text.length < 40) score -= 10;
  if (text.length > 300) score -= 10;

  // Bad pattern penalties
  if (text.toLowerCase().startsWith("image of")) score -= 15;
  if (text.toLowerCase().startsWith("picture of")) score -= 15;
  if (text.toLowerCase().includes("this image shows")) score -= 10;

  // Bonus for good patterns
  if (/\d/.test(text)) score += 5; // Contains numbers
  if (/\b(red|blue|green|yellow|white|black|gray)\b/i.test(text)) score += 5; // Colors
  if (/ing\b/.test(text)) score += 3; // Action words

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    wcagCompliant: score >= 65,
  };
}
