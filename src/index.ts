// src/index.ts
import { Plugin, PluginContext } from "./types/plugin.js";
import { getCryptoPriceTool, CHAINLINK_GET_CRYPTO_PRICE } from "./tools/chainlink/get-crypto-price.js";
import { getHistoricalPriceTool, CHAINLINK_GET_HISTORICAL_PRICE } from "./tools/chainlink/get-historical-price.js";
import { getMultiplePricesTool, CHAINLINK_GET_MULTIPLE_PRICES } from "./tools/chainlink/get-multiple-prices.js";
import { getPriceStatisticsTool, CHAINLINK_GET_PRICE_STATISTICS } from "./tools/chainlink/get-price-statistics.js";
import { checkProofOfReserveTool, CHECK_PROOF_OF_RESERVE } from "./actions/check-proof-of-reserve.js";
import { getCcipMessageStatusTool, GET_CCIP_MESSAGE_STATUS } from "./actions/get-ccip-message-status.js";
import { fetchEnterpriseMetricTool, FETCH_ENTERPRISE_METRIC } from "./actions/fetch-enterprise-metric.js";

export const chainlinkOraclePlugin: Plugin = {
  name: "chainlink-oracle-plugin",
  version: "2.2.0",
  description: "Comprehensive Chainlink Oracle Plugin for Hedera Agent Kit with real-time prices, historical data, statistics, Proof of Reserve verification, CCIP tracking, and enterprise metrics",
  author: "Fermin Dietze",
  tags: ["oracle", "chainlink", "price-feeds", "defi", "smart-contracts", "proof-of-reserve", "ccip", "enterprise"],
  tools: (context?: PluginContext) => [
    // Oracle Tools
    getCryptoPriceTool,
    getHistoricalPriceTool,
    getMultiplePricesTool,
    getPriceStatisticsTool,
    // Enterprise Actions
    checkProofOfReserveTool,
    getCcipMessageStatusTool,
    fetchEnterpriseMetricTool,
  ],
};

export const toolNames = {
  CHAINLINK_GET_CRYPTO_PRICE,
  CHAINLINK_GET_HISTORICAL_PRICE,
  CHAINLINK_GET_MULTIPLE_PRICES,
  CHAINLINK_GET_PRICE_STATISTICS,
  CHECK_PROOF_OF_RESERVE,
  GET_CCIP_MESSAGE_STATUS,
  FETCH_ENTERPRISE_METRIC,
} as const;

// Individual exports for direct usage
export {
  getCryptoPriceTool,
  getHistoricalPriceTool,
  getMultiplePricesTool,
  getPriceStatisticsTool,
  checkProofOfReserveTool,
  getCcipMessageStatusTool,
  fetchEnterpriseMetricTool,
  CHAINLINK_GET_CRYPTO_PRICE,
  CHAINLINK_GET_HISTORICAL_PRICE,
  CHAINLINK_GET_MULTIPLE_PRICES,
  CHAINLINK_GET_PRICE_STATISTICS,
  CHECK_PROOF_OF_RESERVE,
  GET_CCIP_MESSAGE_STATUS,
  FETCH_ENTERPRISE_METRIC,
};

export default chainlinkOraclePlugin;