// src/index.ts
import {
  getCryptoPriceTool,
  CHAINLINK_GET_CRYPTO_PRICE,
} from "./tools/chainlink/get-crypto-price.js";
import {
  getHistoricalPriceTool,
  CHAINLINK_GET_HISTORICAL_PRICE,
} from "./tools/chainlink/get-historical-price.js";
import {
  getMultiplePricesTool,
  CHAINLINK_GET_MULTIPLE_PRICES,
} from "./tools/chainlink/get-multiple-prices.js";
import {
  getPriceStatisticsTool,
  CHAINLINK_GET_PRICE_STATISTICS,
} from "./tools/chainlink/get-price-statistics.js";

// Type definitions for forward compatibility
interface Context {
  mode?: string;
  [key: string]: any;
}

interface Plugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags?: string[];
  tools: (context?: Context) => any[];
}

// Export the enhanced plugin with context integration
export const chainlinkOraclePlugin: Plugin = {
  name: "chainlink-oracle-plugin",
  version: "2.1.0",
  description: "Comprehensive Chainlink Oracle Plugin for Hedera Agent Kit - Real-time prices, historical data, statistics, and multi-pair fetching using Chainlink smart contracts",
  author: "Fermin Dietze",
  tags: ["oracle", "chainlink", "price-feeds", "defi", "smart-contracts", "historical-data", "statistics"],
  tools: (context?: Context) => [
    getCryptoPriceTool,
    getHistoricalPriceTool,
    getMultiplePricesTool,
    getPriceStatisticsTool,
  ],
};

// Export tool names for external reference
export const chainlinkOraclePluginToolNames = {
  CHAINLINK_GET_CRYPTO_PRICE,
  CHAINLINK_GET_HISTORICAL_PRICE,
  CHAINLINK_GET_MULTIPLE_PRICES,
  CHAINLINK_GET_PRICE_STATISTICS,
} as const;

// Export individual tools for direct usage
export {
  getCryptoPriceTool,
  getHistoricalPriceTool,
  getMultiplePricesTool,
  getPriceStatisticsTool,
  CHAINLINK_GET_CRYPTO_PRICE,
  CHAINLINK_GET_HISTORICAL_PRICE,
  CHAINLINK_GET_MULTIPLE_PRICES,
  CHAINLINK_GET_PRICE_STATISTICS,
};

export default { chainlinkOraclePlugin, chainlinkOraclePluginToolNames };