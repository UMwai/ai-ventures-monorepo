import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getOpenAI, MODELS } from "@ai-ventures/ai-sdk";

interface GenerationRequest {
  imageUrl?: string;
  length?: "short" | "medium" | "long";
  tone?: "neutral" | "professional" | "friendly";
  industry?: string;
  context?: string;
}

const LENGTH_INSTRUCTIONS = {
  short: "Generate a brief alt text of 50 characters or less. Focus only on the most essential elements.",
  medium: "Generate a standard alt text of 125 characters or less. Include key details about the image content.",
  long: "Generate a detailed alt text of 250 characters or less. Provide comprehensive description including context, objects, people, text, and atmosphere.",
};

const TONE_INSTRUCTIONS = {
  neutral: "Use neutral, objective language.",
  professional: "Use professional, formal language.",
  friendly: "Use approachable, friendly language.",
};

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const length = (formData.get("length") as string) || "medium";
    const tone = (formData.get("tone") as string) || "neutral";
    const context = (formData.get("context") as string) || "";

    // Validate input
    if (!image && !imageUrl) {
      return NextResponse.json(
        { error: "Image or imageUrl is required" },
        { status: 400 }
      );
    }

    // Convert image to base64 if uploaded
    let base64Image: string | null = null;
    if (image) {
      const bytes = await image.arrayBuffer();
      base64Image = Buffer.from(bytes).toString("base64");
    }

    // Build the prompt
    const systemPrompt = `You are an accessibility expert specializing in creating alt text for images.
Your goal is to write accurate, descriptive alt text that helps visually impaired users understand image content.

Guidelines:
- Follow WCAG 2.1 accessibility standards
- Be specific and descriptive, not generic
- Don't start with "Image of" or "Picture of"
- Include relevant details: objects, people (count, not identity), actions, text, colors
- If the image contains text, include it in the description
- Consider the context provided when generating descriptions
${LENGTH_INSTRUCTIONS[length as keyof typeof LENGTH_INSTRUCTIONS]}
${TONE_INSTRUCTIONS[tone as keyof typeof TONE_INSTRUCTIONS]}`;

    const userPrompt = context
      ? `Generate alt text for this image. Context: ${context}`
      : "Generate alt text for this image.";

    // Call OpenAI GPT-5 Vision API
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: MODELS.GPT5_VISION,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: base64Image
                  ? `data:image/jpeg;base64,${base64Image}`
                  : imageUrl!,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const generatedText = response.choices[0]?.message?.content || "";

    // Generate all three lengths
    const altTexts = {
      short: generatedText.slice(0, 50),
      medium: generatedText.slice(0, 125),
      long: generatedText.slice(0, 250),
    };

    // Calculate quality score
    const qualityScore = calculateQualityScore(generatedText);

    return NextResponse.json({
      success: true,
      altText: altTexts,
      quality: {
        score: qualityScore,
        wcagCompliant: qualityScore >= 70,
        suggestions: getQualitySuggestions(generatedText, qualityScore),
      },
      metadata: {
        model: MODELS.GPT5_VISION,
        processingTime: Date.now(),
        characterCount: generatedText.length,
      },
    });
  } catch (error) {
    console.error("Alt text generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate alt text" },
      { status: 500 }
    );
  }
}

function calculateQualityScore(text: string): number {
  let score = 100;

  // Length check (penalize if too short or too long)
  if (text.length < 20) score -= 20;
  else if (text.length < 50) score -= 10;
  if (text.length > 300) score -= 10;

  // Check for common bad patterns
  if (text.toLowerCase().startsWith("image of")) score -= 10;
  if (text.toLowerCase().startsWith("picture of")) score -= 10;
  if (text.toLowerCase().includes("photo of")) score -= 5;

  // Check for specificity (presence of specific details)
  const hasNumbers = /\d/.test(text);
  const hasColors = /red|blue|green|yellow|orange|purple|black|white|gray|brown|pink/i.test(text);
  const hasActions = /ing\b/.test(text);

  if (hasNumbers) score += 5;
  if (hasColors) score += 5;
  if (hasActions) score += 5;

  return Math.max(0, Math.min(100, score));
}

function getQualitySuggestions(text: string, score: number): string[] {
  const suggestions: string[] = [];

  if (text.length < 50) {
    suggestions.push("Consider adding more descriptive details");
  }

  if (text.toLowerCase().startsWith("image of") || text.toLowerCase().startsWith("picture of")) {
    suggestions.push("Avoid starting with 'Image of' or 'Picture of'");
  }

  if (score < 70) {
    suggestions.push("Review for WCAG compliance");
  }

  return suggestions;
}
