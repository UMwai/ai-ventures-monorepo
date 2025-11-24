import { z } from "zod";

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    processingTime?: number;
  };
}

// ============================================
// User & Auth Types
// ============================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  plan: z.enum(["FREE", "STARTER", "PRO", "BUSINESS", "ENTERPRISE"]),
  usageThisMonth: z.number().default(0),
  usageLimit: z.number().default(50),
});

export type User = z.infer<typeof UserSchema>;

// ============================================
// AltTextify Types
// ============================================

export const AltTextLengthSchema = z.enum(["short", "medium", "long"]);
export type AltTextLength = z.infer<typeof AltTextLengthSchema>;

export const AltTextToneSchema = z.enum(["neutral", "professional", "friendly"]);
export type AltTextTone = z.infer<typeof AltTextToneSchema>;

export const AltTextIndustrySchema = z.enum([
  "general",
  "ecommerce",
  "news",
  "travel",
  "food",
  "fashion",
  "technology",
  "healthcare",
  "education",
]);
export type AltTextIndustry = z.infer<typeof AltTextIndustrySchema>;

export const GenerateAltTextRequestSchema = z.object({
  imageUrl: z.string().url().optional(),
  context: z.string().optional(),
  length: AltTextLengthSchema.default("medium"),
  tone: AltTextToneSchema.default("neutral"),
  industry: AltTextIndustrySchema.default("general"),
  keywords: z.array(z.string()).optional(),
  projectId: z.string().optional(),
});

export type GenerateAltTextRequest = z.infer<typeof GenerateAltTextRequestSchema>;

export const AltTextResultSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url(),
  altText: z.object({
    short: z.string(),
    medium: z.string(),
    long: z.string(),
  }),
  quality: z.object({
    score: z.number().min(0).max(100),
    wcagCompliant: z.boolean(),
    suggestions: z.array(z.string()).optional(),
  }),
  metadata: z
    .object({
      processingTime: z.number().optional(),
      model: z.string().optional(),
      detectedObjects: z.array(z.string()).optional(),
      textInImage: z.string().optional(),
      facesDetected: z.number().optional(),
    })
    .optional(),
});

export type AltTextResult = z.infer<typeof AltTextResultSchema>;

// ============================================
// BillingPulse Types
// ============================================

export const PaymentStatusSchema = z.enum([
  "succeeded",
  "failed",
  "pending",
  "refunded",
  "disputed",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentEventSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.number(),
  currency: z.string().default("usd"),
  status: PaymentStatusSchema,
  declineCode: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type PaymentEvent = z.infer<typeof PaymentEventSchema>;

export const RetryScheduleSchema = z.object({
  paymentId: z.string(),
  scheduledAt: z.string().datetime(),
  attemptNumber: z.number(),
  strategy: z.enum(["immediate", "smart", "scheduled"]),
});

export type RetrySchedule = z.infer<typeof RetryScheduleSchema>;

// ============================================
// DataCleanerAI Types
// ============================================

export const DataQualityIssueSchema = z.object({
  type: z.enum([
    "missing_value",
    "duplicate",
    "outlier",
    "format_inconsistency",
    "invalid_type",
    "encoding_error",
  ]),
  column: z.string(),
  rowIndex: z.number(),
  originalValue: z.unknown(),
  suggestedValue: z.unknown().optional(),
  confidence: z.number().min(0).max(1),
});

export type DataQualityIssue = z.infer<typeof DataQualityIssueSchema>;

export const CleaningOperationSchema = z.object({
  id: z.string(),
  type: z.enum([
    "remove_duplicates",
    "fill_missing",
    "fix_format",
    "remove_outliers",
    "standardize",
    "custom",
  ]),
  column: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
});

export type CleaningOperation = z.infer<typeof CleaningOperationSchema>;

// ============================================
// Pricing & Plans
// ============================================

export const PlanFeatures = {
  FREE: {
    imagesPerMonth: 50,
    projectLimit: 1,
    apiAccess: false,
    priority: false,
  },
  STARTER: {
    imagesPerMonth: 500,
    projectLimit: 3,
    apiAccess: false,
    priority: false,
  },
  PRO: {
    imagesPerMonth: 2000,
    projectLimit: 10,
    apiAccess: true,
    priority: true,
  },
  BUSINESS: {
    imagesPerMonth: 10000,
    projectLimit: -1, // unlimited
    apiAccess: true,
    priority: true,
  },
  ENTERPRISE: {
    imagesPerMonth: -1, // unlimited
    projectLimit: -1,
    apiAccess: true,
    priority: true,
  },
} as const;

export type PlanName = keyof typeof PlanFeatures;
