// tools/chainlink/get-historical-price.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";

export const getHistoricalPriceParameters = z.object({
  base: z.string().describe("Base symbol (e.g. BTC, ETH, HBAR)"),
  quote: z.string().describe("Quote currency (e.g. USD, USDC)"),
  timestamp: z.string().describe("ISO 8601 timestamp or 'YYYY-MM-DD' format"),
});

const getHistoricalPricePrompt = `
Fetches historical cryptocurrency price for a specific date using CoinGecko API.

Parameters:
- base: Asset symbol (BTC, ETH, HBAR)
- quote: Currency symbol (USD, USDC)
- timestamp: Date in ISO format or YYYY-MM-DD
`;

export async function getHistoricalPriceExecute(
  client: Client,
  context: any,
  params: z.infer<typeof getHistoricalPriceParameters>
) {
  try {
    // Convert timestamp to date format for CoinGecko
    const date = new Date(params.timestamp);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
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
    
    // Use CoinGecko historical data API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${baseId}/history?date=${dateStr.split('-').reverse().join('-')}&localization=false`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    const price = data.market_data?.current_price?.[quoteCurrency];

    if (!price) {
      throw new Error(`Historical price data not available for ${params.base}/${params.quote} on ${dateStr}`);
    }

    return {
      base: params.base.toUpperCase(),
      quote: params.quote.toUpperCase(),
      price: Number(price.toFixed(6)),
      date: dateStr,
      source: "coingecko-historical",
      timestamp: new Date().toISOString(),
      note: `Historical price for ${dateStr}`
    };

  } catch (error: any) {
    throw new Error(`Historical price fetch failed: ${error.message}`);
  }
}

export const CHAINLINK_GET_HISTORICAL_PRICE = "chainlink_get_historical_price";

export const getHistoricalPriceTool = {
  method: CHAINLINK_GET_HISTORICAL_PRICE,
  name: "Chainlink: Get Historical Price",
  description: getHistoricalPricePrompt,
  parameters: getHistoricalPriceParameters,
  execute: getHistoricalPriceExecute,
};

export default getHistoricalPriceTool;