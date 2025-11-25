/**
 * Shareable Links for DCF Models
 * Generates short, unique URLs for read-only model sharing
 */

import { customAlphabet } from "nanoid";

// Generate URL-safe short codes (8 characters)
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

/**
 * Generate a unique share code
 */
export function generateShareCode(): string {
  return nanoid();
}

/**
 * Build shareable URL
 */
export function buildShareUrl(shareCode: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://valuationos.com";
  return `${base}/share/${shareCode}`;
}

/**
 * Validate share code format
 */
export function isValidShareCode(code: string): boolean {
  return /^[0-9a-z]{8}$/.test(code);
}

/**
 * Model sharing configuration
 */
export interface ShareConfig {
  allowedViews: ("summary" | "projections" | "sensitivity" | "assumptions")[];
  expiresAt?: Date;
  maxViews?: number;
  requireEmail?: boolean;
}

/**
 * Default share configuration
 */
export const defaultShareConfig: ShareConfig = {
  allowedViews: ["summary", "projections", "sensitivity"],
  expiresAt: undefined, // No expiration
  maxViews: undefined, // Unlimited
  requireEmail: false,
};

/**
 * Shareable model metadata
 */
export interface SharedModel {
  shareCode: string;
  modelId: string;
  userId: string;
  ticker: string;
  companyName: string;
  scenario: string;
  intrinsicValue: number;
  currentPrice: number;
  impliedUpside: number;
  config: ShareConfig;
  createdAt: Date;
  viewCount: number;
}
