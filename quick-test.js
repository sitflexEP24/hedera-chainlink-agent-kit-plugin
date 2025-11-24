import 'dotenv/config';
import { getCryptoPriceTool } from "./dist/tools/chainlink/get-crypto-price.js";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

async function quickTest() {
  console.log("🔍 Testing All Crypto Pairs via Smart Contract");
  console.log("=" + "=".repeat(50));
  
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyString = process.env.HEDERA_PRIVATE_KEY;
  
  if (!accountId || !privateKeyString) {
    console.log("❌ No credentials found in .env");
    return;
  }

  try {
    console.log("✅ Credentials loaded");
    console.log(`📋 Account: ${accountId}`);
    console.log("🌐 Network: Hedera Testnet");
    
    // Parse private key with correct method
    const privateKey = PrivateKey.fromStringECDSA(privateKeyString);
    console.log("✅ Private key parsed successfully");
    
    // Create client
    const client = Client.forTestnet();
    client.setOperator(AccountId.fromString(accountId), privateKey);
    console.log("✅ Client configured");
    console.log("");
    
    // Define all trading pairs to test
    const tradingPairs = [
      { base: "HBAR", quote: "USD" },
      { base: "BTC", quote: "USD" },
      { base: "ETH", quote: "USD" },
      { base: "USDC", quote: "USD" },
      { base: "USDT", quote: "USD" },
      { base: "DAI", quote: "USD" },
      { base: "LINK", quote: "USD" }
    ];
    
    let successCount = 0;
    let fallbackCount = 0;
    let errorCount = 0;
    
    // Test each trading pair
    for (const pair of tradingPairs) {
      console.log(`🔗 Testing ${pair.base}/${pair.quote}...`);
      
      try {
        const result = await getCryptoPriceTool.execute(client, null, pair);
        
        if (result.source === "chainlink-hedera-sc") {
          console.log(`✅ SUCCESS - Smart Contract Call`);
          console.log(`   💰 Price: $${result.price}`);
          console.log(`   📍 Contract: ${result.contractAddress}`);
          console.log(`   🔢 Round ID: ${result.roundId}`);
          console.log(`   🕐 Updated: ${new Date(result.updatedAt).toLocaleString()}`);
          successCount++;
        } else {
          console.log(`⚠️  FALLBACK - ${result.source}`);
          console.log(`   💰 Price: $${result.price}`);
          console.log(`   📝 Note: ${result.note}`);
          fallbackCount++;
        }
        
      } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        errorCount++;
      }
      
      console.log(""); // Add spacing between tests
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log("=" + "=".repeat(50));
    console.log("📊 TEST SUMMARY:");
    console.log(`✅ Smart Contract Success: ${successCount}/${tradingPairs.length}`);
    console.log(`⚠️  Fallback Used: ${fallbackCount}/${tradingPairs.length}`);
    console.log(`❌ Errors: ${errorCount}/${tradingPairs.length}`);
    
    if (successCount > 0) {
      console.log("🎉 Smart contract integration is working!");
    }
    if (fallbackCount > 0) {
      console.log("ℹ️  Some pairs used fallback API (normal for unconfigured contracts)");
    }
    
  } catch (error) {
    console.log("❌ SETUP FAILED:", error.message);
    
    if (error.message.includes('INVALID_SIGNATURE')) {
      console.log("💡 Still having signature issues");
    } else if (error.message.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
      console.log("💡 Account needs more HBAR balance");
    } else {
      console.log("💡 Check your network connection and credentials");
    }
  }
}

quickTest();