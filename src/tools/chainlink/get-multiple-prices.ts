// tools/chainlink/get-multiple-prices.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";
import { getCryptoPriceTool } from "./get-crypto-price.js";
import { createAPITransparencyInfo } from "../../utils/transparency.js";
import { Tool, OperationResult } from "../../types/plugin.js";

const parameters = z.object({
  pairs: z.array(z.object({
    base: z.string().describe("Base symbol (e.g. BTC, ETH, HBAR)"),
    quote: z.string().describe("Quote currency (e.g. USD)"),
  })).describe("Array of trading pairs to fetch prices for"),
});

async function execute(client: Client, context: any, params: z.infer<typeof parameters>): Promise<OperationResult> {
  const { pairs } = params;
  const results = [];
  const errors = [];
  
  for (const pair of pairs) {
    try {
      // Validate pair before processing
      if (!pair.base?.trim() || !pair.quote?.trim()) {
        throw new Error("Invalid pair: base and quote must be non-empty strings");
      }
      
      const result = await getCryptoPriceTool.execute(client, context, pair);
      results.push(result);
    } catch (error: any) {
      errors.push({
        pair: `${pair.base}/${pair.quote}`,
        error: error.message
      });
    }
    
    // Rate limiting delay
    if (pairs.indexOf(pair) < pairs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  const transparency = createAPITransparencyInfo('batch_operation', 'multiple_price_request', {
    totalRequested: pairs.length,
    successful: results.length,
    failed: errors.length,
    rateLimitDelay: '200ms',
    pairs: pairs.map(p => `${p.base}/${p.quote}`)
  });

  return {
    results,
    errors,
    totalRequested: pairs.length,
    successCount: results.length,
    errorCount: errors.length,
    timestamp: new Date().toISOString(),
    blockchainOperation: transparency
  };
}

export const CHAINLINK_GET_MULTIPLE_PRICES = "chainlink_get_multiple_prices";

export const getMultiplePricesTool: Tool = {
  method: CHAINLINK_GET_MULTIPLE_PRICES,
  name: "Chainlink: Get Multiple Prices",
  description: "Fetches multiple cryptocurrency prices in a single batch request",
  parameters,
  execute,
};

export default getMultiplePricesTool;