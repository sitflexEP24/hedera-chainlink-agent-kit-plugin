import 'dotenv/config';
import { getCryptoPriceTool } from "./dist/tools/chainlink/get-crypto-price.js";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

const main = async () => {
  // Load credentials from environment variables
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyString = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || 'testnet';
  
  if (!accountId || !privateKeyString) {
    console.log("No credentials found in .env file");
    console.log("Testing fallback API functionality...");
    
    try {
      const res = await getCryptoPriceTool.execute(
        null,
        null,
        { base: "HBAR", quote: "USD" }
      );
      console.log("Fallback API Result:", JSON.stringify(res, null, 2));
    } catch (error) {
      console.error("Fallback test failed:", error.message);
    }
    return;
  }
  
  try {
    // Parse private key using the correct method
    let privateKey;
    try {
      // Use fromStringECDSA for ECDSA keys (which start with 0x)
      privateKey = PrivateKey.fromStringECDSA(privateKeyString);
    } catch (error) {
      console.error("Error parsing private key:", error);
      console.log("Make sure your private key is in the correct ECDSA format");
      return;
    }
    
    // Create Hedera client based on network setting
    const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
    client.setOperator(AccountId.fromString(accountId), privateKey);
    
    console.log("Testing smart contract price fetching...");
    console.log(`Using account: ${accountId}`);
    console.log(`Network: Hedera ${network.charAt(0).toUpperCase() + network.slice(1)}`);
    console.log("=".repeat(50));
    
    // Test HBAR/USD (should work on testnet)
    console.log("\n🔍 Testing HBAR/USD...");
    try {
      const res = await getCryptoPriceTool.execute(
        client,
        null,
        { base: "HBAR", quote: "USD" }
      );
      console.log("✅ HBAR/USD Result:", JSON.stringify(res, null, 2));
    } catch (error) {
      console.error("❌ HBAR/USD failed:", error.message);
    }
    
    // Test other pairs
    const pairs = [
      { base: "BTC", quote: "USD" },
      { base: "ETH", quote: "USD" },
      { base: "USDC", quote: "USD" },
      { base: "USDT", quote: "USD" },
      { base: "DAI", quote: "USD" },
      { base: "LINK", quote: "USD" }
    ];
    
    for (const pair of pairs) {
      console.log(`\n🔍 Testing ${pair.base}/${pair.quote}...`);
      try {
        const result = await getCryptoPriceTool.execute(client, null, pair);
        console.log(`✅ ${pair.base}/${pair.quote} Result:`, JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(`❌ ${pair.base}/${pair.quote} failed:`, error.message);
      }
      
      // Add a small delay between calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("Smart contract testing completed!");
    
  } catch (error) {
    console.error("Test setup failed:", error.message);
    console.log("\nTrying fallback API test...");
    
    // Fallback test if client setup fails
    try {
      const res = await getCryptoPriceTool.execute(
        null,
        null,
        { base: "HBAR", quote: "USD" }
      );
      console.log("Fallback API Result:", JSON.stringify(res, null, 2));
    } catch (fallbackError) {
      console.error("Fallback test also failed:", fallbackError.message);
    }
  }
};

main().catch(console.error);
