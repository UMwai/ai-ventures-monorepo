import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  TrendingUp,
  RefreshCw,
  Bell,
  DollarSign,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description: "Live MRR, churn rates, and revenue metrics updated every 15 minutes",
  },
  {
    icon: RefreshCw,
    title: "Smart Retry Logic",
    description: "AI-powered retry scheduling recovers 35%+ of failed payments automatically",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description: "Get notified via email or Slack when payments fail or thresholds are exceeded",
  },
  {
    icon: Shield,
    title: "Failure Prediction",
    description: "ML models predict payment failures 7 days in advance with 92% accuracy",
  },
];

const stats = [
  { value: "35%+", label: "Failed Payment Recovery" },
  { value: "45%", label: "Churn Reduction" },
  { value: "$12K", label: "Avg. Annual Recovery/Customer" },
  { value: "<5min", label: "Setup Time" },
];

const benefits = [
  "Connect your Stripe account in 2 minutes",
  "Automatic failed payment recovery",
  "Decline code analysis and optimization",
  "Custom retry windows and strategies",
  "Pre-dunning customer outreach",
  "Revenue forecasting with 92% accuracy",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-8 w-8 text-green-600" />
          <span className="text-xl font-bold">BillingPulse</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <DollarSign className="h-4 w-4" />
          <span>Recover Revenue Automatically</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto">
          Stop Losing Revenue to
          <span className="text-green-600"> Failed Payments</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          BillingPulse analyzes your Stripe payments, predicts failures, and automatically
          recovers lost revenue. Connect in minutes, start recovering today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition flex items-center space-x-2">
                <span>Connect Stripe Free</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition flex items-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </SignedIn>
          <Link
            href="#demo"
            className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition"
          >
            Watch Demo
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Free plan available • No credit card required • 2-minute setup
        </p>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold text-green-600">{stat.value}</div>
              <div className="text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to maximize revenue
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white p-6 rounded-xl shadow-sm border">
              <feature.icon className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-gray-50 rounded-3xl">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why SaaS founders choose BillingPulse
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Start recovering lost revenue today
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Connect your Stripe account in 2 minutes. Free tier available forever.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition">
              Get Started for Free
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition inline-block"
          >
            Go to Dashboard
          </Link>
        </SignedIn>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <CreditCard className="h-6 w-6 text-green-600" />
            <span className="font-semibold">BillingPulse</span>
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link href="/privacy" className="hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-900">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
