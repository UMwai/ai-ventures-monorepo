import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AltTextify - AI-Powered Alt Text Generation",
  description:
    "Generate WCAG-compliant alt text for images automatically using AI. Make your website accessible to everyone.",
  keywords: ["alt text", "accessibility", "WCAG", "ADA compliance", "AI", "image description"],
  openGraph: {
    title: "AltTextify - AI-Powered Alt Text Generation",
    description: "Generate WCAG-compliant alt text for images automatically using AI",
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
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
