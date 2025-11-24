# AI Ventures Monorepo

A portfolio of AI-powered micro-SaaS products built for rapid deployment and scalability.

## Products

| Product | Description | Status | Priority |
|---------|-------------|--------|----------|
| **AltTextify** | AI-powered alt text generation for WCAG compliance | 🚧 Building | #1 |
| **BillingPulse** | SaaS billing analytics & churn reduction | 📋 Planned | #2 |
| **DataCleanerAI** | Automated CSV/Excel data cleaning | 📋 Planned | #3 |

## Architecture

```
ai-ventures-monorepo/
├── apps/                    # Product applications
│   ├── alttextify/         # Next.js app for AltTextify
│   ├── billingpulse/       # Next.js app for BillingPulse
│   └── datacleaner/        # Next.js app for DataCleanerAI
├── packages/               # Shared packages
│   ├── ui/                 # Shared UI components (Radix + Tailwind)
│   ├── ai-sdk/             # AI/LLM integration layer
│   ├── auth/               # Authentication (Clerk)
│   ├── database/           # Database utilities (Prisma + PostgreSQL)
│   └── shared-types/       # TypeScript types
├── services/               # Backend services
│   └── api-gateway/        # Shared API gateway
├── .github/workflows/      # CI/CD pipelines
└── docs/                   # Documentation
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **UI Components** | Radix UI, shadcn/ui |
| **Backend** | Next.js API Routes, tRPC |
| **Database** | PostgreSQL (Supabase/Neon) |
| **ORM** | Prisma |
| **Auth** | Clerk |
| **AI/ML** | OpenAI GPT-4V, Vercel AI SDK |
| **Deployment** | Vercel (apps), Railway (services) |
| **Monorepo** | Turborepo, pnpm |

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/UMwai/ai-ventures-monorepo.git
cd ai-ventures-monorepo

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development
pnpm dev
```

### Development Commands

```bash
# Start all apps in development mode
pnpm dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Type check
pnpm typecheck

# Clean build artifacts
pnpm clean
```

### Working with specific apps

```bash
# Start only AltTextify
pnpm dev --filter=alttextify

# Build only BillingPulse
pnpm build --filter=billingpulse

# Test only shared packages
pnpm test --filter=./packages/*
```

## Project Roadmap

### Phase 1: AltTextify MVP (Weeks 1-8)
- [ ] Core image upload & processing
- [ ] GPT-4 Vision integration
- [ ] Alt text generation with length options
- [ ] WCAG compliance validation
- [ ] Basic dashboard
- [ ] Stripe subscription integration

### Phase 2: BillingPulse MVP (Weeks 9-16)
- [ ] Stripe Connect OAuth
- [ ] Payment webhook processing
- [ ] Analytics dashboard
- [ ] Basic retry logic
- [ ] Alert system

### Phase 3: DataCleanerAI MVP (Weeks 17-24)
- [ ] CSV/Excel upload
- [ ] Data profiling engine
- [ ] AI-powered cleaning suggestions
- [ ] Export functionality

## Shared Infrastructure

All products leverage these shared components:

- **@ai-ventures/ui**: Reusable React components
- **@ai-ventures/ai-sdk**: OpenAI/Anthropic API wrapper with caching
- **@ai-ventures/auth**: Clerk authentication hooks & middleware
- **@ai-ventures/database**: Prisma schema & utilities
- **@ai-ventures/shared-types**: Common TypeScript types

## Environment Variables

Create a `.env.local` file with:

```env
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: add feature"`
3. Push and create PR: `git push origin feature/your-feature`

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with by UMwai
