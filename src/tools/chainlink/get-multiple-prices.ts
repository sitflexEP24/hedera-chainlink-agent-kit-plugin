// tools/chainlink/get-multiple-prices.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";
import { getCryptoPriceExecute } from "./get-crypto-price.js";

export const getMultiplePricesParameters = z.object({
  pairs: z.array(z.object({
    base: z.string().describe("Base symbol (e.g. BTC, ETH, HBAR)"),
    quote: z.string().describe("Quote currency (e.g. USD, USDC)"),
  })).describe("Array of trading pairs to fetch prices for"),
});

const getMultiplePricesPrompt = `
Fetches multiple cryptocurrency prices in a single request using Chainlink oracle smart contracts on Hedera.

Parameters:
- pairs: Array of trading pairs with base and quote symbols

Returns array of price data for all requested pairs.
`;

export async function getMultiplePricesExecute(
  client: Client,
  context: any,
  params: z.infer<typeof getMultiplePricesParameters>
) {
  const results = [];
  const errors = [];

  // Validate each pair before processing
  for (const pair of params.pairs) {
    // Input validation
    if (!pair.base || typeof pair.base !== 'string' || pair.base.trim().length === 0) {
      errors.push({
        pair: `${pair.base}/${pair.quote}`,
        error: "Invalid base symbol: must be a non-empty string"
      });
      continue;
    }
    
    if (!pair.quote || typeof pair.quote !== 'string' || pair.quote.trim().length === 0) {
      errors.push({
        pair: `${pair.base}/${pair.quote}`,
        error: "Invalid quote symbol: must be a non-empty string"
      });
      continue;
    }

    try {
      const result = await getCryptoPriceExecute(client, context, pair);
      results.push(result);
    } catch (error: any) {
      errors.push({
        pair: `${pair.base}/${pair.quote}`,
        error: error.message
      });
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return {
    results,
    errors,
    totalRequested: params.pairs.length,
    successCount: results.length,
    errorCount: errors.length,
    timestamp: new Date().toISOString(),
    note: errors.length > 0 ? `${errors.length} pairs failed to fetch` : "All pairs fetched successfully"
  };
}

export const CHAINLINK_GET_MULTIPLE_PRICES = "chainlink_get_multiple_prices";

export const getMultiplePricesTool = {
  method: CHAINLINK_GET_MULTIPLE_PRICES,
  name: "Chainlink: Get Multiple Prices",
  description: getMultiplePricesPrompt,
  parameters: getMultiplePricesParameters,
  execute: getMultiplePricesExecute,
};

export default getMultiplePricesTool;