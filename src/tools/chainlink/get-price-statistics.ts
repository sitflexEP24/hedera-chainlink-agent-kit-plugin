// tools/chainlink/get-price-statistics.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";

export const getPriceStatisticsParameters = z.object({
  base: z.string().describe("Base symbol (e.g. BTC, ETH, HBAR)"),
  quote: z.string().describe("Quote currency (e.g. USD, USDC)"),
  days: z.number().optional().describe("Number of days for statistics (default: 7)"),
});

const getPriceStatisticsPrompt = `
Fetches price statistics and market data for a cryptocurrency using CoinGecko API.

Parameters:
- base: Asset symbol (BTC, ETH, HBAR)
- quote: Currency symbol (USD, USDC)
- days: Number of days for price history (optional, default: 7)

Returns comprehensive market statistics including price changes, volume, market cap.
`;

export async function getPriceStatisticsExecute(
  client: Client,
  context: any,
  params: z.infer<typeof getPriceStatisticsParameters>
) {
  try {
    const days = params.days || 7;
    
    // CoinGecko ID mapping
    const COINGECKO_IDS: { [key: string]: string } = {
      'HBAR': 'hedera-hashgraph',
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai',
      'LINK': 'chainlink'
    };

    const baseId = COINGECKO_IDS[params.base.toUpperCase()];
    if (!baseId) {
      throw new Error(`Unsupported asset: ${params.base}`);
    }

    const quoteCurrency = params.quote.toLowerCase();
    
    // Fetch comprehensive coin data
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${baseId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    const marketData = data.market_data;

    if (!marketData) {
      throw new Error(`Market data not available for ${params.base}`);
    }

    const currentPrice = marketData.current_price?.[quoteCurrency];
    const priceChange24h = marketData.price_change_percentage_24h;
    const priceChange7d = marketData.price_change_percentage_7d;
    const priceChange30d = marketData.price_change_percentage_30d;
    const volume24h = marketData.total_volume?.[quoteCurrency];
    const marketCap = marketData.market_cap?.[quoteCurrency];
    const high24h = marketData.high_24h?.[quoteCurrency];
    const low24h = marketData.low_24h?.[quoteCurrency];

    return {
      base: params.base.toUpperCase(),
      quote: params.quote.toUpperCase(),
      currentPrice: currentPrice ? Number(currentPrice.toFixed(6)) : null,
      priceChanges: {
        "24h": priceChange24h ? Number(priceChange24h.toFixed(2)) : null,
        "7d": priceChange7d ? Number(priceChange7d.toFixed(2)) : null,
        "30d": priceChange30d ? Number(priceChange30d.toFixed(2)) : null,
      },
      volume24h: volume24h ? Number(volume24h.toFixed(2)) : null,
      marketCap: marketCap ? Number(marketCap.toFixed(2)) : null,
      dayRange: {
        high: high24h ? Number(high24h.toFixed(6)) : null,
        low: low24h ? Number(low24h.toFixed(6)) : null,
      },
      source: "coingecko-statistics",
      timestamp: new Date().toISOString(),
      note: `Comprehensive market statistics for ${params.base}/${params.quote}`
    };

  } catch (error: any) {
    throw new Error(`Price statistics fetch failed: ${error.message}`);
  }
}

export const CHAINLINK_GET_PRICE_STATISTICS = "chainlink_get_price_statistics";

export const getPriceStatisticsTool = {
  method: CHAINLINK_GET_PRICE_STATISTICS,
  name: "Chainlink: Get Price Statistics",
  description: getPriceStatisticsPrompt,
  parameters: getPriceStatisticsParameters,
  execute: getPriceStatisticsExecute,
};

export default getPriceStatisticsTool;