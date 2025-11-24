import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DataCleanerAI - AI-Powered Data Cleaning for CSV & Excel",
  description:
    "Clean, transform, and standardize your CSV and Excel files automatically using AI. Fix duplicates, format issues, and missing data in seconds.",
  keywords: ["data cleaning", "CSV", "Excel", "AI", "data quality", "ETL", "data preparation"],
  openGraph: {
    title: "DataCleanerAI - AI-Powered Data Cleaning",
    description: "Clean, transform, and standardize your data automatically using AI",
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
