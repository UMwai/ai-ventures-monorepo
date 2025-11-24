"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

interface TickerSearchProps {
  onSelect: (ticker: string) => void;
  isLoading?: boolean;
}

export function TickerSearch({ onSelect, isLoading }: TickerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchTickers = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchTickers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (ticker: string) => {
    setQuery(ticker);
    setShowDropdown(false);
    onSelect(ticker);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.length >= 1) {
      // Try to match exact ticker or use first result
      const exactMatch = results.find(
        (r) => r.ticker.toLowerCase() === query.toLowerCase()
      );
      if (exactMatch) {
        handleSelect(exactMatch.ticker);
      } else if (results.length > 0) {
        handleSelect(results[0].ticker);
      } else {
        // Try as-is (user might know the ticker)
        handleSelect(query.toUpperCase());
      }
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Enter ticker symbol (e.g., AAPL)"
          className="w-full pl-10 pr-10 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-lg"
          disabled={isLoading}
        />
        {(isSearching || isLoading) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-auto"
        >
          {results.map((result) => (
            <button
              key={result.ticker}
              onClick={() => handleSelect(result.ticker)}
              className="w-full px-4 py-3 text-left hover:bg-accent flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-foreground">{result.ticker}</span>
                <span className="ml-2 text-sm text-muted-foreground truncate">
                  {result.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{result.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
