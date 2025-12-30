# AI Ventures Monorepo Architecture

## System Overview

AI Ventures is a monorepo containing multiple AI-powered micro-SaaS products sharing common infrastructure, packages, and tooling.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MONOREPO (Turborepo)                          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                         APPS                                     ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             ││
│  │  │ AltTextify  │  │BillingPulse │  │DataCleanerAI│             ││
│  │  │  (Next.js)  │  │  (Next.js)  │  │  (Next.js)  │             ││
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             ││
│  │         └─────────────────┴─────────────────┘                   ││
│  └─────────────────────────────────┬───────────────────────────────┘│
│                                    │                                 │
│  ┌─────────────────────────────────▼───────────────────────────────┐│
│  │                       PACKAGES                                   ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐││
│  │  │    UI    │ │  AI-SDK  │ │   Auth   │ │ Database │ │  Types │││
│  │  │          │ │          │ │          │ │          │ │        │││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      INFRASTRUCTURE                              ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │    Vercel    │  │   Supabase   │  │    Stripe    │          ││
│  │  │  (Hosting)   │  │  (Database)  │  │  (Payments)  │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
ai-ventures-monorepo/
├── apps/                        # Product applications
│   ├── alttextify/             # AltTextify Next.js app
│   │   ├── app/                # App router pages
│   │   ├── components/         # App-specific components
│   │   ├── lib/                # App utilities
│   │   └── public/             # Static assets
│   ├── billingpulse/           # BillingPulse Next.js app
│   │   └── ...
│   └── datacleaner/            # DataCleanerAI Next.js app
│       └── ...
│
├── packages/                    # Shared packages
│   ├── ui/                     # Shared UI components
│   │   ├── components/
│   │   ├── primitives/
│   │   └── index.ts
│   ├── ai-sdk/                 # AI/LLM integration
│   │   ├── providers/
│   │   ├── utils/
│   │   └── index.ts
│   ├── auth/                   # Authentication (Clerk)
│   │   ├── hooks/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── database/               # Database utilities
│   │   ├── prisma/
│   │   ├── utils/
│   │   └── index.ts
│   └── shared-types/           # TypeScript types
│       ├── products/
│       ├── common/
│       └── index.ts
│
├── services/                    # Backend services
│   └── api-gateway/            # Shared API gateway
│
├── .github/                    # GitHub configuration
│   └── workflows/              # CI/CD pipelines
│
├── docs/                       # Documentation
│   ├── architecture.md
│   └── getting-started.md
│
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # pnpm workspace
├── package.json                # Root package.json
└── tsconfig.json               # Base TypeScript config
```

---

## Shared Packages

### 1. @ai-ventures/ui

**Purpose**: Reusable React components built on Radix UI and Tailwind CSS.

**Structure**:
```
packages/ui/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Card/
│   ├── Dialog/
│   ├── Input/
│   └── ...
├── primitives/           # Radix UI wrappers
│   ├── dropdown-menu.tsx
│   ├── dialog.tsx
│   └── ...
├── utils/
│   └── cn.ts            # className utility
├── styles/
│   └── globals.css      # Base styles
└── index.ts             # Package exports
```

**Usage**:
```tsx
import { Button, Card, Input } from '@ai-ventures/ui';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### 2. @ai-ventures/ai-sdk

**Purpose**: Unified AI/LLM integration layer with caching and error handling.

**Structure**:
```
packages/ai-sdk/
├── providers/
│   ├── openai.ts        # OpenAI GPT-4V
│   ├── anthropic.ts     # Claude (future)
│   └── index.ts
├── utils/
│   ├── cache.ts         # Response caching
│   ├── retry.ts         # Retry logic
│   └── rate-limit.ts    # Rate limiting
├── types/
│   └── index.ts
└── index.ts
```

**Usage**:
```typescript
import { generateAltText } from '@ai-ventures/ai-sdk';

const result = await generateAltText({
  image: imageBuffer,
  context: 'Product image for e-commerce',
  length: 'medium'
});
```

### 3. @ai-ventures/auth

**Purpose**: Clerk authentication integration with hooks and middleware.

**Structure**:
```
packages/auth/
├── hooks/
│   ├── useUser.ts
│   ├── useOrganization.ts
│   └── index.ts
├── middleware/
│   ├── withAuth.ts
│   └── index.ts
├── components/
│   ├── SignInButton.tsx
│   ├── UserButton.tsx
│   └── index.ts
└── index.ts
```

**Usage**:
```tsx
import { useUser, withAuth } from '@ai-ventures/auth';

function Dashboard() {
  const { user } = useUser();
  return <div>Welcome, {user.name}</div>;
}

export default withAuth(Dashboard);
```

### 4. @ai-ventures/database

**Purpose**: Prisma schema and database utilities.

**Structure**:
```
packages/database/
├── prisma/
│   ├── schema.prisma    # Shared schema
│   └── migrations/
├── client/
│   └── index.ts         # Prisma client
├── utils/
│   ├── pagination.ts
│   └── query-helpers.ts
└── index.ts
```

**Prisma Schema**:
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  clerkId       String    @unique
  email         String    @unique
  name          String?
  createdAt     DateTime  @default(now())
  subscription  Subscription?
}

model Subscription {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  stripeId        String   @unique
  plan            Plan     @default(FREE)
  status          SubscriptionStatus
  currentPeriodEnd DateTime
}
```

### 5. @ai-ventures/shared-types

**Purpose**: Shared TypeScript types across packages and apps.

**Structure**:
```
packages/shared-types/
├── products/
│   ├── alttextify.ts
│   ├── billingpulse.ts
│   └── datacleaner.ts
├── common/
│   ├── user.ts
│   ├── subscription.ts
│   └── api.ts
└── index.ts
```

---

## Application Architecture

### AltTextify

```
apps/alttextify/
├── app/
│   ├── (marketing)/        # Marketing pages
│   │   ├── page.tsx        # Landing page
│   │   └── pricing/
│   ├── (dashboard)/        # App dashboard
│   │   ├── layout.tsx      # Dashboard layout
│   │   ├── page.tsx        # Main dashboard
│   │   ├── generate/       # Alt text generation
│   │   ├── history/        # Generation history
│   │   └── settings/       # User settings
│   └── api/
│       ├── generate/       # Generation endpoint
│       ├── stripe/         # Stripe webhooks
│       └── ...
├── components/
│   ├── ImageUploader.tsx
│   ├── AltTextResult.tsx
│   └── ...
└── lib/
    ├── gpt4v.ts            # GPT-4V integration
    └── wcag.ts             # WCAG validation
```

### BillingPulse

```
apps/billingpulse/
├── app/
│   ├── (marketing)/
│   ├── (dashboard)/
│   │   ├── analytics/      # Analytics dashboard
│   │   ├── customers/      # Customer management
│   │   ├── alerts/         # Alert configuration
│   │   └── integrations/   # Stripe connect
│   └── api/
│       ├── webhooks/       # Stripe webhooks
│       └── analytics/      # Analytics endpoints
├── components/
│   ├── MRRChart.tsx
│   ├── ChurnPredictor.tsx
│   └── ...
└── lib/
    ├── stripe-sync.ts
    └── analytics.ts
```

### DataCleanerAI

```
apps/datacleaner/
├── app/
│   ├── (marketing)/
│   ├── (dashboard)/
│   │   ├── clean/          # Data cleaning interface
│   │   ├── templates/      # Saved templates
│   │   └── api-keys/       # API access
│   └── api/
│       ├── upload/         # File upload
│       ├── clean/          # Cleaning endpoint
│       └── export/         # Export endpoint
├── components/
│   ├── FileUploader.tsx
│   ├── DataPreview.tsx
│   └── ...
└── lib/
    ├── parser.ts           # CSV/Excel parsing
    └── cleaner.ts          # Cleaning logic
```

---

## Data Flow

### AltTextify Generation Flow

```
1. Image Upload
   User uploads image
        │
        v
2. Client Processing
   - Compress image
   - Extract metadata
        │
        v
3. API Request
   POST /api/generate
        │
        v
4. GPT-4V Processing
   - Send to OpenAI Vision
   - Generate descriptions
        │
        v
5. WCAG Validation
   - Check character length
   - Validate accessibility
        │
        v
6. Response
   Return alt text variants
```

### BillingPulse Sync Flow

```
1. OAuth Connect
   User connects Stripe
        │
        v
2. Historical Import
   Fetch past events
        │
        v
3. Webhook Registration
   Register for events
        │
        v
4. Real-time Sync
   Process incoming webhooks
        │
        v
5. Analytics Update
   Calculate metrics
```

---

## API Design

### REST Endpoints

```
# AltTextify
POST   /api/generate          # Generate alt text
GET    /api/history           # Get generation history
DELETE /api/history/:id       # Delete history item

# BillingPulse
GET    /api/analytics/mrr     # Get MRR data
GET    /api/analytics/churn   # Get churn metrics
POST   /api/webhooks/stripe   # Stripe webhook handler

# DataCleanerAI
POST   /api/upload            # Upload file
POST   /api/clean             # Process file
GET    /api/export/:id        # Download cleaned file
```

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

---

## Deployment Architecture

```
                          ┌─────────────────────────────────┐
                          │         Vercel Edge Network      │
                          └──────────────┬──────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         v                               v                               v
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│   AltTextify    │          │  BillingPulse   │          │  DataCleanerAI  │
│  alttextify.com │          │billingpulse.com │          │datacleaner.ai   │
└────────┬────────┘          └────────┬────────┘          └────────┬────────┘
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      │
                                      v
                         ┌─────────────────────────┐
                         │       Shared Services    │
                         │  - Supabase (Database)   │
                         │  - Stripe (Payments)     │
                         │  - Clerk (Auth)          │
                         │  - OpenAI (AI)           │
                         └─────────────────────────┘
```

---

## Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

*Last Updated: December 2024*
