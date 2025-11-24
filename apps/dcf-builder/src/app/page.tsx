"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Sparkles, Table2, FileSpreadsheet, ArrowRight } from "lucide-react";
import { TickerSearch } from "@/components/TickerSearch";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleTickerSelect = async (ticker: string) => {
    setIsLoading(true);
    router.push(`/model/new?ticker=${ticker}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">ValuationOS</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </a>
            <a
              href="/sign-in"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Sign In
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-6">
          Build DCF Models in{" "}
          <span className="text-primary">60 Seconds</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Institutional-grade discounted cash flow analysis powered by AI.
          Enter a ticker and get a complete valuation with sensitivity analysis.
        </p>

        {/* Search */}
        <div className="flex justify-center mb-12">
          <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
        </div>

        {/* Popular Tickers */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Popular:</span>
          {["AAPL", "MSFT", "GOOGL", "NVDA", "AMZN"].map((ticker) => (
            <button
              key={ticker}
              onClick={() => handleTickerSelect(ticker)}
              className="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded-full"
            >
              {ticker}
            </button>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need for Valuation
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Assumptions</h3>
            <p className="text-muted-foreground">
              GPT-5 analyzes financial statements and generates realistic Bull,
              Base, and Bear case assumptions automatically.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Table2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sensitivity Analysis</h3>
            <p className="text-muted-foreground">
              Interactive tables showing how share price changes with different
              WACC and growth rate assumptions.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Excel Export</h3>
            <p className="text-muted-foreground">
              Download your complete model as a formatted Excel file for further
              analysis or presentations.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-secondary/30 rounded-3xl my-8">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: 1, title: "Enter Ticker", desc: "Type any stock symbol" },
            { step: 2, title: "Fetch Data", desc: "We pull 10 years of financials" },
            { step: 3, title: "AI Assumptions", desc: "AI generates smart defaults" },
            { step: 4, title: "Get Valuation", desc: "Instant intrinsic value" },
          ].map((item, idx) => (
            <div key={item.step} className="text-center relative">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                {item.step}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
              {idx < 3 && (
                <ArrowRight className="hidden md:block absolute top-6 -right-4 h-5 w-5 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-center text-muted-foreground mb-12">
          Start free, upgrade when you need more
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Free */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-2">Free</h3>
            <p className="text-3xl font-bold mb-4">$0</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li>3 models per month</li>
              <li>Basic assumptions</li>
              <li>Sensitivity tables</li>
            </ul>
            <button className="w-full py-2 border border-border rounded-lg hover:bg-accent">
              Get Started
            </button>
          </div>

          {/* Pro */}
          <div className="bg-card rounded-xl border-2 border-primary p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
              Popular
            </div>
            <h3 className="text-lg font-semibold mb-2">Pro</h3>
            <p className="text-3xl font-bold mb-4">
              $29<span className="text-sm font-normal">/mo</span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li>Unlimited models</li>
              <li>AI-powered assumptions</li>
              <li>Excel export</li>
              <li>Investment thesis generator</li>
            </ul>
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              Start Free Trial
            </button>
          </div>

          {/* Institutional */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-2">Institutional</h3>
            <p className="text-3xl font-bold mb-4">
              $199<span className="text-sm font-normal">/mo</span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li>Everything in Pro</li>
              <li>API access</li>
              <li>Bulk screening</li>
              <li>Team collaboration</li>
            </ul>
            <button className="w-full py-2 border border-border rounded-lg hover:bg-accent">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>ValuationOS - AI Ventures Monorepo</p>
          <p className="mt-2">
            Built with GPT-5, Claude 4.5, and Gemini 3 for multi-model analysis
          </p>
        </div>
      </footer>
    </main>
  );
}
