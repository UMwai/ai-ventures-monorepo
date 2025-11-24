/**
 * Yahoo Finance API Client (via unofficial API)
 * Used as backup for real-time quotes and beta
 */

const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance";

export interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  trailingPE: number;
  forwardPE: number;
  priceToBook: number;
  beta: number;
  sharesOutstanding: number;
}

/**
 * Fetch real-time quote from Yahoo Finance
 */
export async function getYahooQuote(ticker: string): Promise<YahooQuote | null> {
  try {
    const url = `${YAHOO_BASE_URL}/chart/${ticker}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      return null;
    }

    const meta = result.meta;

    return {
      symbol: meta.symbol,
      regularMarketPrice: meta.regularMarketPrice,
      regularMarketChange: meta.regularMarketPrice - meta.previousClose,
      regularMarketChangePercent:
        ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      regularMarketVolume: meta.regularMarketVolume,
      marketCap: 0, // Not available in this endpoint
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      trailingPE: 0,
      forwardPE: 0,
      priceToBook: 0,
      beta: 0,
      sharesOutstanding: 0,
    };
  } catch (error) {
    console.error("Yahoo Finance API error:", error);
    return null;
  }
}

/**
 * Fetch stock beta from Yahoo Finance statistics
 */
export async function getYahooBeta(ticker: string): Promise<number | null> {
  try {
    // Using quoteSummary endpoint for more detailed data
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const beta = data.quoteSummary?.result?.[0]?.defaultKeyStatistics?.beta?.raw;

    return beta ?? null;
  } catch (error) {
    console.error("Failed to fetch beta from Yahoo:", error);
    return null;
  }
}
