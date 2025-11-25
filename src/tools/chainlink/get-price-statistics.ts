// tools/chainlink/get-price-statistics.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";
import { createAPITransparencyInfo } from "../../utils/transparency.js";
import { Tool, OperationResult } from "../../types/plugin.js";

const COINGECKO_IDS = {
  HBAR: 'hedera-hashgraph',
  BTC: 'bitcoin', 
  ETH: 'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  LINK: 'chainlink'
} as const;

const parameters = z.object({
  base: z.string().describe("Base symbol (e.g. BTC, ETH, HBAR)"),
  quote: z.string().describe("Quote currency (e.g. USD)"),
  days: z.number().optional().describe("Number of days for statistics (default: 7)"),
});

async function execute(client: Client, context: any, params: z.infer<typeof parameters>): Promise<OperationResult> {
  const { base, quote, days = 7 } = params;
  
  const baseId = COINGECKO_IDS[base.toUpperCase() as keyof typeof COINGECKO_IDS];
  if (!baseId) {
    throw new Error(`Unsupported asset: ${base}`);
  }

  const apiUrl = `https://api.coingecko.com/api/v3/coins/${baseId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`CoinGecko API request failed: ${response.status}`);
  }

  const { market_data: data } = await response.json();
  if (!data) {
    throw new Error(`Market data not available for ${base}`);
  }

  const quoteLower = quote.toLowerCase();
  const transparency = createAPITransparencyInfo(apiUrl, 'market_statistics_api', {
    provider: 'CoinGecko',
    pair: `${base}/${quote}`,
    coinGeckoId: baseId,
    dataPoints: ['price', 'changes', 'volume', 'market_cap', 'range']
  });

  return {
    base: base.toUpperCase(),
    quote: quote.toUpperCase(),
    currentPrice: data.current_price?.[quoteLower] ? Number(data.current_price[quoteLower].toFixed(6)) : null,
    priceChanges: {
      "24h": data.price_change_percentage_24h ? Number(data.price_change_percentage_24h.toFixed(2)) : null,
      "7d": data.price_change_percentage_7d ? Number(data.price_change_percentage_7d.toFixed(2)) : null,
      "30d": data.price_change_percentage_30d ? Number(data.price_change_percentage_30d.toFixed(2)) : null,
    },
    volume24h: data.total_volume?.[quoteLower] ? Number(data.total_volume[quoteLower].toFixed(2)) : null,
    marketCap: data.market_cap?.[quoteLower] ? Number(data.market_cap[quoteLower].toFixed(2)) : null,
    dayRange: {
      high: data.high_24h?.[quoteLower] ? Number(data.high_24h[quoteLower].toFixed(6)) : null,
      low: data.low_24h?.[quoteLower] ? Number(data.low_24h[quoteLower].toFixed(6)) : null,
    },
    source: "coingecko-statistics",
    timestamp: new Date().toISOString(),
    blockchainOperation: transparency
  };
}

export const CHAINLINK_GET_PRICE_STATISTICS = "chainlink_get_price_statistics";

export const getPriceStatisticsTool: Tool = {
  method: CHAINLINK_GET_PRICE_STATISTICS,
  name: "Chainlink: Get Price Statistics",
  description: "Fetches comprehensive market statistics and analytics for cryptocurrencies",
  parameters,
  execute,
};

export default getPriceStatisticsTool;