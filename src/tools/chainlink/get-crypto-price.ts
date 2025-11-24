// tools/chainlink/get-crypto-price.ts
import { z } from "zod";
import { Client, ContractCallQuery, ContractId } from "@hashgraph/sdk";
import { ethers } from "ethers";
import { detectNetwork } from "../../utils/network-detector.js";
import { AGGREGATOR_V3_INTERFACE_ABI } from "../../constants/chainlink-abis.js";

// Chainlink Price Feed Contracts on Hedera Networks
const PRICE_FEED_CONTRACTS = {
  mainnet: {
    "HBAR/USD": "0xAF685FB45C12b92b5054ccb9313e135525F9b5d5", // Official Chainlink HBAR/USD feed on Hedera Mainnet
    "BTC/USD": "0xaD01E27668658Cc8c1Ce6Ed31503D75F31eEf480",   // Chainlink BTC/USD feed on Hedera Mainnet
    "ETH/USD": "0xd2D2CB0AEb29472C3008E291355757AD6225019e",   // Chainlink ETH/USD feed on Hedera Mainnet
    "USDT/USD": "0x8F4978D9e5eA44bF915611b73f45003c61f1BC79",  // Chainlink USDT/USD feed on Hedera Mainnet
    "USDC/USD": "0x2b358642c7C37b6e400911e4FE41770424a7349F",  // Chainlink USDC/USD feed on Hedera Mainnet
    "DAI/USD": "0x64d5B38ae9f06b77F9A49Dd4d0a7f8dbd6d52e05",   // Chainlink DAI/USD feed on Hedera Mainnet
    "LINK/USD": "0xB006e5ED0B9CfF64BAD53b47582FcE3c885EA4b2"   // Chainlink LINK/USD feed on Hedera Mainnet
  },
  testnet: {
    "HBAR/USD": "0x59bC155EB6c6C415fE43255aF66EcF0523c92B4a", // Chainlink HBAR/USD feed on Hedera Testnet
    "BTC/USD": "0x058fE79CB5775d4b167920Ca6036B824805A9ABd", // Chainlink BTC/USD feed on Hedera Testnet
    "ETH/USD": "0xb9d461e0b962aF219866aDfA7DD19C52bB9871b9", // Chainlink ETH/USD feed on Hedera Testnet
    "DAI/USD": "0xdA2aBF7C90aDC73CDF5cA8d720B87bD5F5863389", // Chainlink DAI/USD feed on Hedera Testnet
    "LINK/USD": "0xF111b70231E89D69eBC9f6C9208e9890383Ef432", // Chainlink LINK/USD feed on Hedera Testnet
    "USDC/USD": "0xb632a7e7e02d76c0Ce99d9C62c7a2d1B5F92B6B5", // Chainlink USDC/USD feed on Hedera Testnet
    "USDT/USD": "0x06823de8E77d708C4cB72Cbf04495D67afF4Bd37"  // Chainlink USDT/USD feed on Hedera Testnet
  }
};

// CoinGecko ID mapping for supported cryptocurrencies
const COINGECKO_IDS = {
  'HBAR': 'hedera-hashgraph',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai',
  'LINK': 'chainlink'
};

// Function to get price from CoinGecko API
async function getCoinGeckoPrice(base: string, quote: string) {
  const baseId = COINGECKO_IDS[base as keyof typeof COINGECKO_IDS];
  if (!baseId) {
    throw new Error(`CoinGecko ID not found for ${base}`);
  }
  
  const quoteCurrency = quote.toLowerCase();
  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${baseId}&vs_currencies=${quoteCurrency}`);
  
  if (!response.ok) {
    throw new Error(`CoinGecko API request failed with status: ${response.status}`);
  }
  
  const data = await response.json();
  const price = data[baseId]?.[quoteCurrency];
  
  if (!price) {
    throw new Error(`Price data not found for ${base}/${quote} in CoinGecko response`);
  }
  
  return price;
}

export const getCryptoPriceParameters = z.object({
  base: z.string().describe("Base symbol (e.g. BTC, ETH, HBAR)"),
  quote: z.string().describe("Quote currency (e.g. USD, USDC)"),
});

const getCryptoPricePrompt = `
Fetches the latest crypto price using Chainlink oracle smart contracts on Hedera.

Parameters:
- base: Asset symbol (BTC, ETH, HBAR)
- quote: Currency symbol (USD, USDC)
`;

export async function getCryptoPriceExecute(
  client: Client,
  context: any,
  params: z.infer<typeof getCryptoPriceParameters>
) {
  const pair = `${params.base}/${params.quote}`;
  
  // Use centralized network detection
  const networkConfig = detectNetwork(client);
  const { network } = networkConfig;
  
  console.log(`Using ${network} network for Chainlink price feed`);
  
  // If no client provided, skip smart contract call and go directly to fallback
  if (!client) {
    console.log('No client provided, using CoinGecko API...');
    
    try {
      const price = await getCoinGeckoPrice(params.base, params.quote);
      
      return {
        base: params.base,
        quote: params.quote,
        price: Number(price.toFixed(6)),
        source: "coingecko-api",
        timestamp: new Date().toISOString(),
        note: "CoinGecko API used - no Hedera client provided"
      };
    } catch (error: any) {
      throw new Error(`CoinGecko API call failed: ${error.message}`);
    }
  }
  
  // Check if we have a price feed contract for this pair on the current network
  const networkContracts = PRICE_FEED_CONTRACTS[network];
  if (!networkContracts || !networkContracts[pair as keyof typeof networkContracts]) {
    console.log(`Smart contract not available for ${pair} on ${network}, using CoinGecko fallback...`);
    
    try {
      const price = await getCoinGeckoPrice(params.base, params.quote);
      
      return {
        base: params.base,
        quote: params.quote,
        price: Number(price.toFixed(6)),
        source: "coingecko-api-fallback",
        timestamp: new Date().toISOString(),
        note: `Smart contract not available for ${pair} on ${network}, used CoinGecko fallback`
      };
    } catch (error: any) {
      throw new Error(`Smart contract not available and CoinGecko fallback failed for ${pair}: ${error.message}`);
    }
  }

  const contractAddress = networkContracts[pair as keyof typeof networkContracts];
  
  // Validate contract address format
  if (contractAddress.includes('XXXXXXX')) {
    console.log(`Contract address not configured for ${pair} on ${network}, using CoinGecko fallback...`);
    
    try {
      const price = await getCoinGeckoPrice(params.base, params.quote);
      
      return {
        base: params.base,
        quote: params.quote,
        price: Number(price.toFixed(6)),
        source: "coingecko-api-fallback",
        timestamp: new Date().toISOString(),
        note: `Contract address not configured for ${pair} on ${network}, used CoinGecko fallback`
      };
    } catch (error: any) {
      throw new Error(`Contract not configured and CoinGecko fallback failed for ${pair}: ${error.message}`);
    }
  }
  
  try {
    // Create contract interface
    const contractInterface = new ethers.Interface(AGGREGATOR_V3_INTERFACE_ABI);
    
    // Encode the function call for latestRoundData()
    const functionCallData = contractInterface.encodeFunctionData("latestRoundData");
    
    // Handle Ethereum-style address for Hedera
    let contractId: ContractId;
    if (contractAddress.startsWith("0x")) {
      // For Ethereum-style addresses, use ContractId.fromEvmAddress
      contractId = ContractId.fromEvmAddress(0, 0, contractAddress);
    } else {
      // For Hedera-style addresses (0.0.X)
      contractId = ContractId.fromString(contractAddress);
    }
    
    // Call the smart contract on Hedera
    const contractCallQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100000) // Adjust gas as needed
      .setFunctionParameters(Buffer.from(functionCallData.slice(2), "hex"));

    const contractCallResult = await contractCallQuery.execute(client);
    
    // Optional: Log transaction details for debugging
    if (process.env.DEBUG_TRANSACTIONS === 'true') {
      console.log(`🔍 Smart contract call successful for ${pair}`);
      console.log(`   Gas used: ${contractCallResult.gasUsed || 'N/A'}`);
      console.log(`   Contract: ${contractAddress}`);
    }
    
    // Decode the result
    const resultBytes = contractCallResult.bytes;
    const decodedResult = contractInterface.decodeFunctionResult("latestRoundData", resultBytes);
    
    const [roundId, answer, startedAt, updatedAt, answeredInRound] = decodedResult;
    
    // Get decimals to properly format the price
    const decimalsCallData = contractInterface.encodeFunctionData("decimals");
    const decimalsQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(50000)
      .setFunctionParameters(Buffer.from(decimalsCallData.slice(2), "hex"));

    const decimalsResult = await decimalsQuery.execute(client);
    const decodedDecimals = contractInterface.decodeFunctionResult("decimals", decimalsResult.bytes);
    const decimals = parseInt(decodedDecimals[0].toString());
    
    // Convert the answer to a readable price
    const price = Number(answer.toString()) / Math.pow(10, decimals);
    
    return {
      base: params.base,
      quote: params.quote,
      price: Number(price.toFixed(6)),
      source: "chainlink-hedera-sc",
      contractAddress: contractAddress,
      roundId: roundId.toString(),
      updatedAt: new Date(parseInt(updatedAt.toString()) * 1000).toISOString(),
      timestamp: new Date().toISOString(),
      decimals: decimals
    };
    
  } catch (error: any) {
    // Universal fallback to CoinGecko for any smart contract failure
    console.warn(`Smart contract call failed for ${pair} on ${network}:`, error.message);
    console.log('Attempting fallback to CoinGecko API...');
    
    try {
      const price = await getCoinGeckoPrice(params.base, params.quote);

      return {
        base: params.base,
        quote: params.quote,
        price: Number(price.toFixed(6)),
        source: "coingecko-api-fallback",
        timestamp: new Date().toISOString(),
        note: "CoinGecko fallback used due to smart contract call failure",
        originalError: error.message
      };
    } catch (fallbackError: any) {
      throw new Error(`Both smart contract call and CoinGecko fallback failed for ${pair}. SC Error: ${error.message}, CoinGecko Error: ${fallbackError.message}`);
    }
  }
}

export const CHAINLINK_GET_CRYPTO_PRICE = "chainlink_get_crypto_price";

export const getCryptoPriceTool = {
  method: CHAINLINK_GET_CRYPTO_PRICE,
  name: "Chainlink: Get Crypto Price",
  description: getCryptoPricePrompt,
  parameters: getCryptoPriceParameters,
  execute: getCryptoPriceExecute,
};

export default getCryptoPriceTool;