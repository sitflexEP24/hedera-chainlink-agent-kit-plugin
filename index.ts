// index.ts
import {
  getCryptoPriceTool,
  CHAINLINK_GET_CRYPTO_PRICE,
} from "./tools/chainlink/get-crypto-price.js";

export const chainlinkOraclePlugin = {
  name: "chainlink-oracle-plugin",
  version: "2.0.0",
  description: "Chainlink Oracle Plugin for Hedera Agent Kit - Fetch cryptocurrency prices using Chainlink smart contracts on Hedera network",
  author: "Fermin Dietze",
  tags: ["oracle", "chainlink", "price-feeds", "defi", "smart-contracts"],
  tools() {
    return [getCryptoPriceTool];
  },
};

export const chainlinkOraclePluginToolNames = {
  CHAINLINK_GET_CRYPTO_PRICE,
};

// Export individual tools for direct usage
export { getCryptoPriceTool, CHAINLINK_GET_CRYPTO_PRICE };

export default chainlinkOraclePlugin;