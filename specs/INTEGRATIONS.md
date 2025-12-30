# AI Ventures Integrations

## Overview

AI Ventures integrates with multiple services for authentication, payments, AI capabilities, and deployment.

---

## Authentication: Clerk

### Purpose
User authentication and organization management.

### Configuration

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Integration

```typescript
// packages/auth/middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/', '/pricing', '/api/webhooks(.*)'],
  ignoredRoutes: ['/api/health']
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

```typescript
// packages/auth/hooks/useUser.ts
import { useUser as useClerkUser } from '@clerk/nextjs';

export function useUser() {
  const { user, isLoaded, isSignedIn } = useClerkUser();

  return {
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName,
      imageUrl: user.imageUrl
    } : null,
    isLoaded,
    isSignedIn
  };
}
```

---

## Payments: Stripe

### Purpose
Subscription billing and payment processing.

### Configuration

```bash
# .env.local
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

### Subscription Management

```typescript
// packages/database/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function createCustomer(email: string, userId: string) {
  return stripe.customers.create({
    email,
    metadata: { userId }
  });
}

export async function createSubscription(
  customerId: string,
  priceId: string
) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}
```

### Webhook Handler

```typescript
// apps/alttextify/app/api/stripe/webhook/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('Stripe-Signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  return new Response('OK', { status: 200 });
}
```

### Pricing Configuration

```typescript
// lib/pricing.ts
export const PRICING = {
  alttextify: {
    free: {
      priceId: null,
      images: 10,
      features: ['Basic alt text', 'Single length']
    },
    pro: {
      priceId: 'price_xxx',
      price: 19,
      images: 1000,
      features: ['All lengths', 'WCAG validation', 'API access']
    },
    enterprise: {
      priceId: 'price_yyy',
      price: 99,
      images: 'unlimited',
      features: ['Custom prompts', 'Priority support', 'SLA']
    }
  }
};
```

---

## AI: OpenAI

### Purpose
GPT-4V for image analysis, GPT-4 for text generation.

### Configuration

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

### Integration

```typescript
// packages/ai-sdk/providers/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateWithVision(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ]
      }
    ],
    max_tokens: 500
  });

  return response.choices[0].message.content!;
}

export async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user', content: prompt }
    ]
  });

  return response.choices[0].message.content!;
}
```

### Vercel AI SDK Integration

```typescript
// apps/alttextify/app/api/generate/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(req: Request) {
  const { image, context, length } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    stream: true,
    messages: [
      {
        role: 'system',
        content: ALT_TEXT_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: buildPrompt(context, length) },
          { type: 'image_url', image_url: { url: image } }
        ]
      }
    ]
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
```

---

## Database: Supabase/PostgreSQL

### Purpose
Data persistence with Prisma ORM.

### Configuration

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@host:5432/db"
DIRECT_URL="postgresql://user:pass@host:5432/db"
```

### Prisma Schema

```prisma
// packages/database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id              String        @id @default(cuid())
  clerkId         String        @unique
  email           String        @unique
  name            String?
  subscription    Subscription?
  altTextHistory  AltText[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model Subscription {
  id               String             @id @default(cuid())
  userId           String             @unique
  user             User               @relation(fields: [userId], references: [id])
  stripeCustomerId String             @unique
  stripeSubId      String             @unique
  plan             Plan               @default(FREE)
  status           SubscriptionStatus @default(ACTIVE)
  currentPeriodEnd DateTime
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
}

model AltText {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  imageUrl  String
  altText   String
  length    String   // short, medium, long
  context   String?
  createdAt DateTime @default(now())
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
}
```

### Usage

```typescript
// packages/database/client.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

```typescript
// Usage in API routes
import { prisma } from '@ai-ventures/database';

export async function getUser(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    include: { subscription: true }
  });
}
```

---

## Deployment: Vercel

### Purpose
Hosting and edge deployment.

### Configuration

```json
// vercel.json (root)
{
  "buildCommand": "pnpm turbo build --filter=alttextify",
  "outputDirectory": "apps/alttextify/.next"
}
```

### Environment Variables

Set in Vercel dashboard:
- `CLERK_*` - Authentication
- `STRIPE_*` - Payments
- `OPENAI_API_KEY` - AI
- `DATABASE_URL` - Database

### GitHub Integration

```yaml
# .github/workflows/preview.yml
name: Vercel Preview
on:
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm turbo build --filter=alttextify

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Analytics: PostHog

### Purpose
Product analytics and user tracking.

### Configuration

```bash
# .env.local
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Integration

```typescript
// packages/analytics/posthog.ts
import posthog from 'posthog-js';

export function initAnalytics() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST
    });
  }
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  posthog.identify(userId, traits);
}
```

---

## Error Tracking: Sentry

### Purpose
Error monitoring and debugging.

### Configuration

```bash
# .env.local
SENTRY_DSN=https://xxx@sentry.io/yyy
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
```

### Integration

```typescript
// packages/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
});

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

export function setUser(user: { id: string; email: string }) {
  Sentry.setUser(user);
}
```

---

## Environment Variables Summary

```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI
OPENAI_API_KEY=

# Database
DATABASE_URL=
DIRECT_URL=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Error Tracking
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# App URLs
NEXT_PUBLIC_APP_URL=
```

---

*Last Updated: December 2024*
