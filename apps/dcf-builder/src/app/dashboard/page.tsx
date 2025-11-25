"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Share2,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";

interface SavedModel {
  id: string;
  ticker: string;
  companyName: string;
  scenario: string;
  intrinsicValue: number | null;
  currentPrice: number;
  impliedUpside: number | null;
  isPublic: boolean;
  shareCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/models");
      const data = await response.json();
      if (data.success) {
        setModels(data.models);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteModel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      const response = await fetch(`/api/models/${id}`, { method: "DELETE" });
      if (response.ok) {
        setModels(models.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete model:", error);
    }
  };

  const shareModel = async (id: string) => {
    try {
      const response = await fetch(`/api/models/${id}/share`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        // Copy to clipboard
        await navigator.clipboard.writeText(data.shareUrl);
        alert(`Share link copied: ${data.shareUrl}`);
        fetchModels(); // Refresh to show share status
      }
    } catch (error) {
      console.error("Failed to share model:", error);
    }
  };

  const filteredModels = models.filter(
    (m) =>
      m.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate portfolio stats
  const totalModels = models.length;
  const avgUpside =
    models.filter((m) => m.impliedUpside !== null).reduce((sum, m) => sum + (m.impliedUpside || 0), 0) /
    (models.filter((m) => m.impliedUpside !== null).length || 1);
  const undervaluedCount = models.filter((m) => (m.impliedUpside || 0) > 0).length;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ValuationOS</span>
          </Link>
          <Link
            href="/model/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Model
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Models</p>
            <p className="text-3xl font-bold">{totalModels}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Avg Implied Upside</p>
            <p
              className={`text-3xl font-bold ${
                avgUpside > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {(avgUpside * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Undervalued Stocks</p>
            <p className="text-3xl font-bold text-green-600">
              {undervaluedCount} / {totalModels}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Models List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No models yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first DCF model to get started
            </p>
            <Link
              href="/model/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Model
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Scenario
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Current
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Intrinsic
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Upside
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredModels.map((model) => (
                  <tr key={model.id} className="hover:bg-accent/50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/model/${model.id}`}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <span className="font-semibold">{model.ticker}</span>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {model.companyName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          model.scenario === "BULL"
                            ? "bg-green-100 text-green-700"
                            : model.scenario === "BEAR"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {model.scenario.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      ${model.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {model.intrinsicValue
                        ? `$${model.intrinsicValue.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {model.impliedUpside !== null ? (
                        <span
                          className={`flex items-center justify-end gap-1 font-medium ${
                            model.impliedUpside > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {model.impliedUpside > 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {(model.impliedUpside * 100).toFixed(1)}%
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                      {new Date(model.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {model.isPublic && model.shareCode && (
                          <a
                            href={`/share/${model.shareCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-accent rounded"
                            title="View shared link"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                        <button
                          onClick={() => shareModel(model.id)}
                          className="p-2 hover:bg-accent rounded"
                          title="Share model"
                        >
                          <Share2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteModel(model.id)}
                          className="p-2 hover:bg-accent rounded"
                          title="Delete model"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
