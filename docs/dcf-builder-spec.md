# DCF Model Builder - Product Specification

## 1. Product Overview

**Name:** ValuationOS (DCF Builder)
**Core Value Prop:** "Institutional-grade DCF modeling in the browser. Move from ticker to intrinsic value in under 60 seconds, backed by rigorous data and AI-assisted assumptions."

## 2. Target Users

| Segment | Needs | Willingness to Pay |
|---------|-------|-------------------|
| Retail Investors | Quick DD on stocks | $29/mo |
| Finance Students | Learning valuation | Free tier |
| Small Hedge Funds | Fast first-pass valuations | $199/mo |
| Investment Bankers | Quick pitch deck numbers | $199/mo |
| M&A Professionals | Target evaluation | $199/mo |

## 3. Core Features

### Phase 1: Data Ingestion
- Ticker search with autocomplete
- Auto-fetch 5-10 years historical financials
- Real-time stock price and beta
- Automatic data cleaning and normalization

### Phase 2: Modeling Workspace
- Split view: Charts (top) + Data Grid (bottom)
- Driver-based forecasting:
  - Revenue: Growth % (Linear, Decay, CAGR, AI-predicted)
  - COGS/OpEx: As % of Revenue
  - D&A: As % of Revenue or CapEx
  - CapEx/Working Capital: As % of Revenue
- WACC Calculator (auto-populated with overrides)
- Scenario modeling (Bull/Base/Bear)

### Phase 3: Output & Analysis
- Intrinsic value per share
- Football field chart (DCF vs Multiples)
- Sensitivity tables (Growth vs WACC)
- PDF/Excel export
- Shareable live links

## 4. AI-Powered Features

### Narrative-to-Number Bridge
- LLM reads 10-K/10-Q filings
- Extracts management guidance
- Auto-generates Bull/Base/Bear assumptions

### Assumption Auditor ("Red Flags")
- Highlights unrealistic margins
- Compares to industry benchmarks
- Shows historical context

### Thesis Generator
- One-click investment thesis
- Explains why stock is under/overvalued
- Export to pitch deck format

### Reverse DCF ("Implied Expectations")
- Input current price
- Solve for implied growth rate
- "Market expects X% growth"

## 5. Financial Data Strategy

### Primary API: Financial Modeling Prep (FMP)
- ~$20/mo for commercial use
- 30 years of history
- Quarterly and annual statements
- Good coverage

### Backup Sources
- Yahoo Finance (yfinance) - real-time price/beta
- FRED API - Risk-free rates (10Y Treasury)
- SEC EDGAR - Raw filings (free)

### Data Caching
- Historical data: Cache 24 hours
- Real-time price: 15-min refresh
- Beta: Daily update

## 6. DCF Calculation Engine

### Methodology: Unlevered Free Cash Flow (UFCF)

```
UFCF = EBIT × (1 - Tax Rate) + D&A - ΔWorking Capital - CapEx
```

### Terminal Value Methods

**Gordon Growth Model:**
```
TV = [Final Year FCF × (1 + g)] / (WACC - g)
```

**Exit Multiple:**
```
TV = Final Year EBITDA × EV/EBITDA Multiple
```

### WACC Calculation
```
WACC = (E/V × Re) + (D/V × Rd × (1 - T))

Where:
- Re = Rf + β × (Rm - Rf)  // Cost of Equity (CAPM)
- Rf = 10Y Treasury Rate
- Rm - Rf = Equity Risk Premium (~5.5%)
- β = Stock Beta
- Rd = Cost of Debt (Interest Expense / Total Debt)
- T = Tax Rate
- E/V, D/V = Capital structure weights
```

### Discounting
- Use XNPV with mid-year convention
- Discount to present value

## 7. Technical Architecture

### Tech Stack
- **Frontend:** Next.js 14 + React
- **Backend:** Next.js API Routes + Python (FastAPI) for complex calculations
- **Database:** PostgreSQL (Prisma ORM)
- **State:** Zustand for reactive calculations
- **Charts:** Recharts or Tremor
- **Grid:** AG Grid or TanStack Table

### Key Components

```
apps/dcf-builder/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx          # User's saved models
│   │   ├── model/
│   │   │   ├── new/page.tsx      # New model wizard
│   │   │   └── [id]/page.tsx     # Model workspace
│   │   └── api/
│   │       ├── financials/       # Data fetching
│   │       ├── dcf/              # Calculations
│   │       └── ai/               # AI assumptions
│   ├── components/
│   │   ├── TickerSearch.tsx
│   │   ├── FinancialGrid.tsx
│   │   ├── AssumptionPanel.tsx
│   │   ├── WACCCalculator.tsx
│   │   ├── SensitivityTable.tsx
│   │   ├── FootballField.tsx
│   │   └── ValuationSummary.tsx
│   ├── lib/
│   │   ├── dcf/
│   │   │   ├── calculations.ts   # Core DCF math
│   │   │   ├── wacc.ts           # WACC calculator
│   │   │   ├── projections.ts    # Revenue/cost projections
│   │   │   └── terminal.ts       # Terminal value
│   │   ├── data/
│   │   │   ├── fmp.ts            # FMP API client
│   │   │   ├── yahoo.ts          # Yahoo Finance client
│   │   │   └── fred.ts           # FRED API client
│   │   └── ai/
│   │       ├── assumptions.ts    # AI-generated assumptions
│   │       └── thesis.ts         # Thesis generator
│   └── store/
│       └── modelStore.ts         # Zustand store
```

## 8. Database Schema (Prisma)

```prisma
model DCFModel {
  id            String   @id @default(cuid())
  userId        String
  ticker        String
  companyName   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Assumptions (stored as JSON for flexibility)
  assumptions   Json     // Revenue growth, margins, etc.
  waccInputs    Json     // WACC components
  terminalValue Json     // TV method and inputs

  // Calculated outputs (cached)
  intrinsicValue Float?
  impliedUpside  Float?

  // Metadata
  scenario      String   @default("base") // bull, base, bear
  isPublic      Boolean  @default(false)
  shareLink     String?  @unique

  user          User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([ticker])
}

model FinancialCache {
  id          String   @id @default(cuid())
  ticker      String   @unique
  data        Json     // Full financial statement data
  fetchedAt   DateTime @default(now())
  expiresAt   DateTime

  @@index([ticker])
  @@index([expiresAt])
}

model MarketData {
  id          String   @id @default(cuid())
  ticker      String
  price       Float
  beta        Float
  marketCap   Float
  fetchedAt   DateTime @default(now())

  @@unique([ticker])
}
```

## 9. Monetization

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 models/month, basic assumptions |
| Pro | $29/mo | Unlimited models, AI assumptions, Excel export |
| Institutional | $199/mo | API access, bulk analysis, team collaboration |

## 10. MVP Scope (Phase 1)

### Must Have
- [ ] Ticker search and data fetch
- [ ] Basic DCF calculation
- [ ] Manual assumption inputs
- [ ] Sensitivity table
- [ ] Save/load models

### Nice to Have (Phase 2)
- [ ] AI-generated assumptions
- [ ] Reverse DCF
- [ ] Excel export
- [ ] Shareable links

### Future (Phase 3)
- [ ] Earnings call transcript analysis
- [ ] Comparable company analysis
- [ ] Monte Carlo simulation
- [ ] Bulk screening
