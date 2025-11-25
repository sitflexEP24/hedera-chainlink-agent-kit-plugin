// tools/chainlink/get-historical-price.ts
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
  timestamp: z.string().describe("Date in ISO format or 'YYYY-MM-DD'"),
});

async function execute(client: Client, context: any, params: z.infer<typeof parameters>): Promise<OperationResult> {
  const { base, quote, timestamp } = params;
  const date = new Date(timestamp).toISOString().split('T')[0];
  
  const baseId = COINGECKO_IDS[base.toUpperCase() as keyof typeof COINGECKO_IDS];
  if (!baseId) {
    throw new Error(`Unsupported asset: ${base}`);
  }

  const apiUrl = `https://api.coingecko.com/api/v3/coins/${baseId}/history?date=${date.split('-').reverse().join('-')}&localization=false`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`CoinGecko API request failed: ${response.status}`);
  }

  const data = await response.json();
  const price = data.market_data?.current_price?.[quote.toLowerCase()];

  if (!price) {
    throw new Error(`Historical price not available for ${base}/${quote} on ${date}`);
  }

  const transparency = createAPITransparencyInfo(apiUrl, 'historical_price_api', {
    provider: 'CoinGecko',
    date,
    pair: `${base}/${quote}`,
    coinGeckoId: baseId
  });

  return {
    base: base.toUpperCase(),
    quote: quote.toUpperCase(),
    price: Number(price.toFixed(6)),
    date,
    source: "coingecko-historical",
    timestamp: new Date().toISOString(),
    blockchainOperation: transparency
  };
}

export const CHAINLINK_GET_HISTORICAL_PRICE = "chainlink_get_historical_price";

export const getHistoricalPriceTool: Tool = {
  method: CHAINLINK_GET_HISTORICAL_PRICE,
  name: "Chainlink: Get Historical Price",
  description: "Retrieves historical cryptocurrency prices for a specific date",
  parameters,
  execute,
};

export default getHistoricalPriceTool;