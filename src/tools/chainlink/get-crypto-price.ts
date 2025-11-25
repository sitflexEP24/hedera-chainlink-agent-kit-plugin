// tools/chainlink/get-crypto-price.ts
import { z } from "zod";
import { Client, ContractCallQuery, ContractId } from "@hashgraph/sdk";
import { ethers } from "ethers";
import { detectNetwork } from "../../utils/network-detector.js";
import { AGGREGATOR_V3_INTERFACE_ABI } from "../../constants/chainlink-abis.js";
import { createTransparencyInfo, createAPITransparencyInfo } from "../../utils/transparency.js";
import { Tool, OperationResult, Context } from "../../types/plugin.js";

const PRICE_FEEDS = {
  mainnet: {
    "HBAR/USD": "0xAF685FB45C12b92b5054ccb9313e135525F9b5d5",
    "BTC/USD": "0xaD01E27668658Cc8c1Ce6Ed31503D75F31eEf480",
    "ETH/USD": "0xd2D2CB0AEb29472C3008E291355757AD6225019e",
    "USDT/USD": "0x8F4978D9e5eA44bF915611b73f45003c61f1BC79",
    "USDC/USD": "0x2b358642c7C37b6e400911e4FE41770424a7349F",
    "DAI/USD": "0x64d5B38ae9f06b77F9A49Dd4d0a7f8dbd6d52e05",
    "LINK/USD": "0xB006e5ED0B9CfF64BAD53b47582FcE3c885EA4b2"
  },
  testnet: {
    "HBAR/USD": "0x59bC155EB6c6C415fE43255aF66EcF0523c92B4a",
    "BTC/USD": "0x058fE79CB5775d4b167920Ca6036B824805A9ABd",
    "ETH/USD": "0xb9d461e0b962aF219866aDfA7DD19C52bB9871b9",
    "DAI/USD": "0xdA2aBF7C90aDC73CDF5cA8d720B87bD5F5863389",
    "LINK/USD": "0xF111b70231E89D69eBC9f6C9208e9890383Ef432",
    "USDC/USD": "0xb632a7e7e02d76c0Ce99d9C62c7a2d1B5F92B6B5",
    "USDT/USD": "0x06823de8E77d708C4cB72Cbf04495D67afF4Bd37"
  }
};

const COINGECKO_IDS = {
  HBAR: 'hedera-hashgraph',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  LINK: 'chainlink'
} as const;

// Enhanced input validation
function validateAssetPair(base: string, quote: string): void {
  const allowedAssets = Object.keys(COINGECKO_IDS);
  const allowedQuotes = ['USD', 'EUR']; // Restrict supported quotes
  
  if (!allowedAssets.includes(base.toUpperCase())) {
    throw new Error(`Unsupported base asset: ${base}. Supported: ${allowedAssets.join(', ')}`);
  }
  
  if (!allowedQuotes.includes(quote.toUpperCase())) {
    throw new Error(`Unsupported quote currency: ${quote}. Supported: ${allowedQuotes.join(', ')}`);
  }
}

// Enhanced address validation
function validateContractAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (!address.startsWith("0x") || address.length !== 42) return false;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
  return ethers.isAddress(address);
}

async function fetchCoinGeckoPrice(base: string, quote: string): Promise<number> {
  const baseId = COINGECKO_IDS[base.toUpperCase() as keyof typeof COINGECKO_IDS];
  if (!baseId) {
    throw new Error(`Unsupported asset: ${base}`);
  }
  
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${baseId}&vs_currencies=${quote.toLowerCase()}`;
  
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
      headers: {
        'User-Agent': 'HederaChainlinkPlugin/2.2.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    const price = data[baseId]?.[quote.toLowerCase()];
    
    if (typeof price !== 'number' || price <= 0) {
      throw new Error(`Invalid price data received for ${base}/${quote}`);
    }
    
    return price;
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      throw new Error('Price API request timed out');
    }
    throw new Error(`Price API error: ${error.message}`);
  }
}

async function fetchChainlinkPrice(
  client: Client, 
  contractAddress: string, 
  base: string, 
  quote: string
): Promise<{ price: number; roundId: string; updatedAt: string; decimals: number; result: any }> {
  // Validate contract address
  if (!validateContractAddress(contractAddress)) {
    throw new Error('Invalid contract address format');
  }

  const contractInterface = new ethers.Interface(AGGREGATOR_V3_INTERFACE_ABI);
  const contractId = ContractId.fromEvmAddress(0, 0, contractAddress);

  try {
    // Get latest round data with proper error handling
    const latestRoundQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(150000) // Increased gas limit for safety
      .setFunctionParameters(Buffer.from(
        contractInterface.encodeFunctionData("latestRoundData").slice(2), 
        "hex"
      ));

    const roundResult = await latestRoundQuery.execute(client);
    const [roundId, answer, startedAt, updatedAt] = contractInterface.decodeFunctionResult(
      "latestRoundData", 
      roundResult.bytes
    );

    // Get decimals with separate query
    const decimalsQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(50000)
      .setFunctionParameters(Buffer.from(
        contractInterface.encodeFunctionData("decimals").slice(2), 
        "hex"
      ));

    const decimalsResult = await decimalsQuery.execute(client);
    const [decimalsValue] = contractInterface.decodeFunctionResult("decimals", decimalsResult.bytes);
    const decimals = parseInt(decimalsValue.toString());

    // Validate oracle data
    const rawPrice = Number(answer.toString());
    if (rawPrice <= 0 || decimals < 0 || decimals > 18) {
      throw new Error('Invalid oracle data received');
    }

    const price = rawPrice / Math.pow(10, decimals);
    
    // Sanity check on price
    if (price <= 0 || price > 1000000) { // Basic sanity bounds
      throw new Error('Price data outside reasonable bounds');
    }

    return {
      price,
      roundId: roundId.toString(),
      updatedAt: new Date(parseInt(updatedAt.toString()) * 1000).toISOString(),
      decimals,
      result: roundResult
    };
  } catch (error: any) {
    // Sanitized error messages
    if (error.message.includes('CONTRACT_REVERT')) {
      throw new Error('Smart contract call failed');
    } else if (error.message.includes('INSUFFICIENT_GAS')) {
      throw new Error('Insufficient gas for contract call');
    } else {
      throw new Error('Blockchain query failed');
    }
  }
}

const parameters = z.object({
  base: z.string()
    .min(2)
    .max(10)
    .regex(/^[A-Z]+$/i)
    .describe("Base symbol (e.g. BTC, ETH, HBAR)"),
  quote: z.string()
    .min(2)
    .max(10)
    .regex(/^[A-Z]+$/i)
    .describe("Quote currency (e.g. USD)"),
});

async function execute(client: Client, context: Context, params: z.infer<typeof parameters>): Promise<OperationResult> {
  // Validate inputs
  const { base, quote } = params;
  validateAssetPair(base, quote);
  
  const pair = `${base.toUpperCase()}/${quote.toUpperCase()}`;
  const networkConfig = detectNetwork(client);

  // Try Chainlink smart contract first if client is available
  if (client) {
    const contractAddress = PRICE_FEEDS[networkConfig.network]?.[pair as keyof typeof PRICE_FEEDS[typeof networkConfig.network]];
    
    if (contractAddress) {
      try {
        const chainlinkData = await fetchChainlinkPrice(client, contractAddress, base, quote);
        const transparency = createTransparencyInfo(
          client,
          chainlinkData.result,
          contractAddress,
          'chainlink_price_feed',
          {
            function: 'latestRoundData + decimals',
            pair,
            roundId: chainlinkData.roundId,
            oracleUpdatedAt: chainlinkData.updatedAt,
            decimals: chainlinkData.decimals
          }
        );

        return {
          base: base.toUpperCase(),
          quote: quote.toUpperCase(),
          price: Number(chainlinkData.price.toFixed(6)),
          source: "chainlink-smart-contract",
          contractAddress,
          roundId: chainlinkData.roundId,
          updatedAt: chainlinkData.updatedAt,
          decimals: chainlinkData.decimals,
          timestamp: new Date().toISOString(),
          blockchainOperation: transparency
        };
      } catch (error: any) {
        console.warn(`Chainlink contract query failed for ${pair}`);
      }
    }
  }

  // Fallback to CoinGecko API
  try {
    const price = await fetchCoinGeckoPrice(base, quote);
    const transparency = createAPITransparencyInfo(
      'https://api.coingecko.com/api/v3/simple/price',
      'coingecko_price_api',
      {
        provider: 'CoinGecko',
        pair,
        reason: client ? 'chainlink_unavailable' : 'no_client'
      }
    );

    return {
      base: base.toUpperCase(),
      quote: quote.toUpperCase(),
      price: Number(price.toFixed(6)),
      source: "coingecko-api",
      timestamp: new Date().toISOString(),
      blockchainOperation: transparency
    };
  } catch (error: any) {
    throw new Error('All price sources are currently unavailable');
  }
}

export const CHAINLINK_GET_CRYPTO_PRICE = "chainlink_get_crypto_price";

export const getCryptoPriceTool: Tool = {
  method: CHAINLINK_GET_CRYPTO_PRICE,
  name: "Chainlink: Get Crypto Price", 
  description: "Fetches cryptocurrency prices using Chainlink oracles on Hedera with CoinGecko fallback",
  parameters,
  execute,
};

export default getCryptoPriceTool;