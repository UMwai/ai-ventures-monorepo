# AI Ventures Agent Design

## Overview

While AI Ventures is primarily a product portfolio rather than an agent system, it leverages AI agents for product features and development automation.

---

## AI-Powered Product Features

### AltTextify: Image Analysis Agent

**Purpose**: Generate accessible alt text from images using GPT-4V.

**Architecture**:
```
Image Input
     │
     v
┌─────────────────┐
│  Preprocessing  │
│  - Compress     │
│  - Format       │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   GPT-4V Agent  │
│  - Analyze      │
│  - Describe     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Post-Processing │
│  - WCAG check   │
│  - Length adjust│
└────────┬────────┘
         │
         v
   Alt Text Output
```

**Agent Configuration**:
```typescript
interface AltTextAgent {
  model: 'gpt-4-vision-preview';
  systemPrompt: string;
  parameters: {
    maxTokens: number;
    temperature: number;
  };
}

const altTextAgent: AltTextAgent = {
  model: 'gpt-4-vision-preview',
  systemPrompt: `
    You are an expert at writing accessible alt text for images.

    Guidelines:
    - Be concise but descriptive
    - Focus on important information
    - Describe text in images verbatim
    - Avoid "image of" or "picture of"
    - Consider context provided
    - Follow WCAG 2.1 guidelines

    Output format:
    - SHORT: 1 sentence, max 125 characters
    - MEDIUM: 2-3 sentences, max 250 characters
    - LONG: Detailed description, max 500 characters
  `,
  parameters: {
    maxTokens: 200,
    temperature: 0.3
  }
};
```

### BillingPulse: Churn Prediction Agent

**Purpose**: Predict customer churn risk using ML and LLM analysis.

**Architecture**:
```
Customer Data
     │
     v
┌─────────────────┐
│ Feature Extract │
│ - Usage patterns│
│ - Payment history│
└────────┬────────┘
         │
         v
┌─────────────────┐
│  ML Risk Score  │
│ - XGBoost model │
│ - Probability   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  LLM Analysis   │
│ - Interpret risk│
│ - Suggest action│
└────────┬────────┘
         │
         v
   Risk Assessment
```

**Agent Configuration**:
```typescript
interface ChurnAgent {
  mlModel: 'xgboost-churn-v1';
  llmModel: 'gpt-4';
  systemPrompt: string;
}

const churnAgent: ChurnAgent = {
  mlModel: 'xgboost-churn-v1',
  llmModel: 'gpt-4',
  systemPrompt: `
    You are a customer success expert analyzing churn risk.

    Given:
    - Churn probability score (0-100)
    - Customer usage data
    - Payment history

    Provide:
    1. Risk interpretation (low/medium/high)
    2. Key risk factors
    3. Recommended actions
    4. Suggested outreach message
  `
};
```

### DataCleanerAI: Data Cleaning Agent

**Purpose**: AI-powered data cleaning suggestions.

**Architecture**:
```
Raw Data
     │
     v
┌─────────────────┐
│  Data Profiling │
│ - Type detection│
│ - Quality check │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  LLM Analysis   │
│ - Pattern detect│
│ - Suggest fixes │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Rule Engine    │
│ - Apply fixes   │
│ - Validate      │
└────────┬────────┘
         │
         v
   Clean Data
```

**Agent Configuration**:
```typescript
interface DataCleanerAgent {
  model: 'gpt-4';
  systemPrompt: string;
  supportedOperations: string[];
}

const dataCleanerAgent: DataCleanerAgent = {
  model: 'gpt-4',
  systemPrompt: `
    You are a data quality expert.

    Analyze the provided data sample and suggest cleaning rules.

    Consider:
    - Missing values
    - Inconsistent formats
    - Duplicates
    - Invalid values
    - Outliers

    Output format:
    {
      "issues": [...],
      "rules": [
        {
          "column": "...",
          "operation": "...",
          "parameters": {...},
          "reason": "..."
        }
      ]
    }
  `,
  supportedOperations: [
    'remove_duplicates',
    'fill_missing',
    'standardize_format',
    'remove_outliers',
    'correct_typos',
    'normalize_values'
  ]
};
```

---

## Development Automation Agents

### Code Quality Agent

**Purpose**: Automated code review for PRs.

```yaml
name: Code Quality Agent
triggers:
  - pull_request

checks:
  - lint: "pnpm lint"
  - typecheck: "pnpm typecheck"
  - test: "pnpm test"
  - build: "pnpm build"

ai_review:
  enabled: true
  model: claude-sonnet
  focus:
    - security
    - performance
    - accessibility
```

### Deployment Agent

**Purpose**: Automated deployment with validation.

```yaml
name: Deployment Agent
triggers:
  - push:
      branches: [main]

workflow:
  1. Build all apps
  2. Run tests
  3. Deploy to Vercel preview
  4. Run E2E tests
  5. Promote to production
  6. Monitor for errors

rollback:
  trigger: error_rate > 1%
  action: revert_deployment
```

---

## Agent Communication

### Shared AI SDK

All product agents use the shared `@ai-ventures/ai-sdk` package:

```typescript
// packages/ai-sdk/index.ts
export interface AIProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  stream(prompt: string, options?: GenerateOptions): AsyncIterable<string>;
}

export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export const openai: AIProvider = {
  async generate(prompt, options) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: options?.model ?? 'gpt-4',
      messages: [
        { role: 'system', content: options?.systemPrompt ?? '' },
        { role: 'user', content: prompt }
      ],
      max_tokens: options?.maxTokens ?? 1000,
      temperature: options?.temperature ?? 0.7
    });
    return response.choices[0].message.content;
  },

  async *stream(prompt, options) {
    // Streaming implementation
  }
};
```

### Usage in Products

```typescript
// apps/alttextify/lib/gpt4v.ts
import { openai } from '@ai-ventures/ai-sdk';

export async function generateAltText(
  imageBase64: string,
  context: string,
  length: 'short' | 'medium' | 'long'
): Promise<string> {
  const prompt = buildPrompt(imageBase64, context, length);

  return openai.generate(prompt, {
    model: 'gpt-4-vision-preview',
    systemPrompt: ALT_TEXT_SYSTEM_PROMPT,
    maxTokens: getMaxTokens(length),
    temperature: 0.3
  });
}
```

---

## Error Handling

### Agent Error Types

```typescript
export class AIAgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

export class RateLimitError extends AIAgentError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 'RATE_LIMIT', true);
    this.retryAfter = retryAfter;
  }
  retryAfter: number;
}

export class ContentFilterError extends AIAgentError {
  constructor() {
    super('Content filtered by safety system', 'CONTENT_FILTER', false);
  }
}
```

### Retry Strategy

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; backoff: 'linear' | 'exponential' }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof AIAgentError && !error.retryable) {
        throw error;
      }
      lastError = error;
      const delay = options.backoff === 'exponential'
        ? Math.pow(2, attempt) * 1000
        : attempt * 1000;
      await sleep(delay);
    }
  }

  throw lastError;
}
```

---

## Monitoring & Analytics

### Agent Metrics

```typescript
interface AgentMetrics {
  invocations: number;
  successRate: number;
  avgLatency: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  costEstimate: number;
}

export function trackAgentCall(
  agent: string,
  duration: number,
  tokens: { input: number; output: number },
  success: boolean
): void {
  // Send to analytics
  analytics.track('agent_call', {
    agent,
    duration,
    tokens,
    success,
    timestamp: Date.now()
  });
}
```

### Dashboard Metrics

```typescript
// Display in admin dashboard
export async function getAgentStats(
  agent: string,
  period: 'day' | 'week' | 'month'
): Promise<AgentMetrics> {
  // Query analytics database
}
```

---

## Cost Management

### Token Budgets

```typescript
interface TokenBudget {
  agent: string;
  daily: number;
  monthly: number;
  perRequest: number;
}

const BUDGETS: Record<string, TokenBudget> = {
  'alt-text': {
    agent: 'alt-text-generator',
    daily: 100000,
    monthly: 2000000,
    perRequest: 1000
  },
  'churn-analysis': {
    agent: 'churn-predictor',
    daily: 50000,
    monthly: 1000000,
    perRequest: 2000
  },
  'data-cleaning': {
    agent: 'data-cleaner',
    daily: 200000,
    monthly: 4000000,
    perRequest: 5000
  }
};
```

### Cost Tracking

```typescript
async function checkBudget(
  agent: string,
  estimatedTokens: number
): Promise<boolean> {
  const budget = BUDGETS[agent];
  const usage = await getUsage(agent, 'today');

  if (usage.tokens + estimatedTokens > budget.daily) {
    throw new BudgetExceededError(agent, 'daily');
  }

  return true;
}
```

---

*Last Updated: December 2024*
