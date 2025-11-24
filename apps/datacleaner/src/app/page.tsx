import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  ArrowRight,
  CheckCircle,
  FileSpreadsheet,
  Sparkles,
  Zap,
  Shield,
  Search,
  Wand2,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Detection",
    description: "AI detects 50+ types of data issues automatically including duplicates, outliers, and format inconsistencies",
  },
  {
    icon: Wand2,
    title: "One-Click Fixing",
    description: "Apply AI-suggested fixes with a single click. Review changes before committing.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description: "Process files up to 500MB in under 30 seconds with our optimized engine",
  },
  {
    icon: Shield,
    title: "Data Privacy",
    description: "Your data never leaves our secure servers. Auto-deleted after 24 hours.",
  },
];

const issues = [
  { name: "Duplicate rows", count: 1247 },
  { name: "Missing values", count: 892 },
  { name: "Format inconsistencies", count: 456 },
  { name: "Outliers detected", count: 23 },
  { name: "Invalid emails", count: 67 },
  { name: "Date format errors", count: 134 },
];

const benefits = [
  "Clean messy CSV and Excel files in seconds",
  "Detect and fix duplicate entries automatically",
  "Standardize date, phone, and address formats",
  "Handle missing values with smart imputation",
  "Export to CSV, Excel, or JSON formats",
  "API access for automated pipelines",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="h-8 w-8 text-purple-600" />
          <span className="text-xl font-bold">DataCleanerAI</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          <span>AI-Powered Data Cleaning</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto">
          Clean Your Data in
          <span className="text-purple-600"> Seconds, Not Hours</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Upload your messy CSV or Excel files. Our AI detects issues, suggests fixes,
          and exports clean data. No coding required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-purple-700 transition flex items-center space-x-2">
                <span>Clean Your First File Free</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-purple-700 transition flex items-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </SignedIn>
          <Link
            href="#demo"
            className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition"
          >
            See Demo
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          5 free files/month • Supports CSV, XLSX, XLS • Up to 500MB
        </p>
      </section>

      {/* Demo Preview Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-6 w-6 text-purple-600" />
              <span className="font-medium">customer_data.csv</span>
              <span className="text-sm text-gray-500">12,456 rows • 15 columns</span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-semibold mb-4 text-gray-900">Issues Detected</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {issues.map((issue) => (
                <div key={issue.name} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-700">{issue.name}</span>
                  <span className="text-sm font-medium text-red-600">{issue.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-purple-600 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-600">Quality Score: 72/100</span>
              </div>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Fix All Issues
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Powerful data cleaning made simple
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white p-6 rounded-xl shadow-sm border">
              <feature.icon className="h-10 w-10 text-purple-600 mb-4" />
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
            Why data teams love DataCleanerAI
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Stop wasting time on messy data
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Upload your first file now. 5 free cleanings every month.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-purple-700 transition">
              Get Started for Free
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-purple-700 transition inline-block"
          >
            Go to Dashboard
          </Link>
        </SignedIn>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <FileSpreadsheet className="h-6 w-6 text-purple-600" />
            <span className="font-semibold">DataCleanerAI</span>
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
