import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BillingPulse - SaaS Billing Analytics & Revenue Recovery",
  description:
    "Reduce involuntary churn and recover failed payments with AI-powered billing analytics. Optimize retry strategies and boost revenue.",
  keywords: ["billing", "analytics", "churn", "SaaS", "payments", "Stripe", "revenue recovery"],
  openGraph: {
    title: "BillingPulse - SaaS Billing Analytics & Revenue Recovery",
    description: "Reduce involuntary churn and recover failed payments with AI-powered billing analytics",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
