"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUser } from "@clerk/nextjs";
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface GenerationResult {
  id: string;
  imageUrl: string;
  altText: {
    short: string;
    medium: string;
    long: string;
  };
  quality: {
    score: number;
    wcagCompliant: boolean;
  };
  status: "processing" | "completed" | "error";
}

export default function DashboardPage() {
  const { user } = useUser();
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLength, setSelectedLength] = useState<"short" | "medium" | "long">("medium");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);

    for (const file of acceptedFiles) {
      const id = Math.random().toString(36).slice(2);
      const imageUrl = URL.createObjectURL(file);

      // Add pending result
      setResults((prev) => [
        {
          id,
          imageUrl,
          altText: { short: "", medium: "", long: "" },
          quality: { score: 0, wcagCompliant: false },
          status: "processing",
        },
        ...prev,
      ]);

      // Process image
      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("length", selectedLength);

        const response = await fetch("/api/generate", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Generation failed");

        const data = await response.json();

        setResults((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  altText: data.altText,
                  quality: data.quality,
                  status: "completed",
                }
              : r
          )
        );
      } catch (error) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "error",
                }
              : r
          )
        );
      }
    }

    setIsProcessing(false);
  }, [selectedLength]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">AltTextify</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.firstName || "User"} · 47/50 images remaining
            </span>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user?.firstName?.[0] || "U"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate Alt Text</h2>

          {/* Length Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-sm text-gray-600">Description length:</span>
            <div className="flex space-x-2">
              {(["short", "medium", "long"] as const).map((length) => (
                <button
                  key={length}
                  onClick={() => setSelectedLength(length)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedLength === length
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {length.charAt(0).toUpperCase() + length.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            <input {...getInputProps()} />
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Processing images...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {isDragActive
                    ? "Drop images here..."
                    : "Drag & drop images, or click to select"}
                </p>
                <p className="text-sm text-gray-500">
                  Supports PNG, JPG, GIF, WebP up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Generated Alt Text</h2>
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row gap-6"
              >
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <img
                    src={result.imageUrl}
                    alt="Uploaded image"
                    className="w-full md:w-48 h-48 object-cover rounded-lg"
                  />
                </div>

                {/* Alt Text Result */}
                <div className="flex-1">
                  {result.status === "processing" ? (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Generating alt text...</span>
                    </div>
                  ) : result.status === "error" ? (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span>Error generating alt text. Please try again.</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              result.quality.wcagCompliant
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {result.quality.wcagCompliant
                              ? "WCAG Compliant"
                              : "Needs Review"}
                          </span>
                          <span className="text-sm text-gray-500">
                            Quality: {result.quality.score}/100
                          </span>
                        </div>
                      </div>

                      {/* Alt Text Display */}
                      <div className="space-y-3">
                        {(["short", "medium", "long"] as const).map((length) => (
                          <div key={length} className="group">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-500 uppercase">
                                {length}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    result.altText[length],
                                    `${result.id}-${length}`
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 transition"
                              >
                                {copiedId === `${result.id}-${length}` ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              {result.altText[length] || "Not generated"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
