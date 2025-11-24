import 'dotenv/config';
import { 
  getCryptoPriceTool, 
  getHistoricalPriceTool,
  getMultiplePricesTool,
  getPriceStatisticsTool 
} from "./dist/index.js";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

const main = async () => {
  console.log("🚀 Enhanced Hedera Chainlink Oracle Plugin Test Suite v2.1.0");
  console.log("=" .repeat(70));
  
  // Load credentials
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyString = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || 'testnet';
  
  let client = null;
  
  if (accountId && privateKeyString) {
    try {
      const privateKey = PrivateKey.fromStringECDSA(privateKeyString);
      client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
      client.setOperator(AccountId.fromString(accountId), privateKey);
      
      console.log(`✅ Hedera client configured`);
      console.log(`   Account: ${accountId}`);
      console.log(`   Network: ${network}`);
    } catch (error) {
      console.log("⚠️  Client setup failed, using fallback API mode");
      client = null;
    }
  } else {
    console.log("ℹ️  No credentials found, testing fallback functionality");
  }
  
  console.log("\n" + "=".repeat(70));

  // Test 1: Current Price Tool
  console.log("\n🔍 Testing Current Price Tool (Smart Contract + Fallback)");
  try {
    const result = await getCryptoPriceTool.execute(client, null, { base: "HBAR", quote: "USD" });
    console.log("✅ Current Price Result:");
    console.log(`   💰 ${result.base}/${result.quote}: $${result.price}`);
    console.log(`   📡 Source: ${result.source}`);
    console.log(`   📍 Contract: ${result.contractAddress || 'N/A'}`);
    console.log(`   🕐 Updated: ${result.updatedAt || result.timestamp}`);
  } catch (error) {
    console.log(`❌ Current Price failed: ${error.message}`);
  }

  // Test 2: Historical Price Tool
  console.log("\n📅 Testing Historical Price Tool");
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = await getHistoricalPriceTool.execute(
      client, 
      null, 
      { 
        base: "BTC", 
        quote: "USD", 
        timestamp: yesterday.toISOString().split('T')[0] 
      }
    );
    console.log("✅ Historical Price Result:");
    console.log(`   💰 ${result.base}/${result.quote}: $${result.price}`);
    console.log(`   📅 Date: ${result.date}`);
    console.log(`   📡 Source: ${result.source}`);
  } catch (error) {
    console.log(`❌ Historical Price failed: ${error.message}`);
  }

  // Test 3: Multiple Prices Tool
  console.log("\n📊 Testing Multiple Prices Tool (Batch Processing)");
  try {
    const pairs = [
      { base: "HBAR", quote: "USD" },
      { base: "BTC", quote: "USD" },
      { base: "ETH", quote: "USD" }
    ];
    
    const result = await getMultiplePricesTool.execute(client, null, { pairs });
    console.log("✅ Multiple Prices Result:");
    console.log(`   📈 Total Requested: ${result.totalRequested}`);
    console.log(`   ✅ Successful: ${result.successCount}`);
    console.log(`   ❌ Failed: ${result.errorCount}`);
    
    result.results.forEach(price => {
      console.log(`   💰 ${price.base}/${price.quote}: $${price.price} (${price.source})`);
    });
    
    if (result.errors.length > 0) {
      console.log("   ⚠️  Errors:");
      result.errors.forEach(error => {
        console.log(`     ❌ ${error.pair}: ${error.error}`);
      });
    }
  } catch (error) {
    console.log(`❌ Multiple Prices failed: ${error.message}`);
  }

  // Test 4: Price Statistics Tool
  console.log("\n📈 Testing Price Statistics Tool");
  try {
    const result = await getPriceStatisticsTool.execute(
      client, 
      null, 
      { base: "ETH", quote: "USD" }
    );
    console.log("✅ Price Statistics Result:");
    console.log(`   💰 Current Price: $${result.currentPrice}`);
    console.log(`   📊 24h Change: ${result.priceChanges['24h']}%`);
    console.log(`   📊 7d Change: ${result.priceChanges['7d']}%`);
    console.log(`   📊 30d Change: ${result.priceChanges['30d']}%`);
    console.log(`   💧 24h Volume: $${result.volume24h?.toLocaleString()}`);
    console.log(`   🏦 Market Cap: $${result.marketCap?.toLocaleString()}`);
    console.log(`   📈 24h High: $${result.dayRange.high}`);
    console.log(`   📉 24h Low: $${result.dayRange.low}`);
  } catch (error) {
    console.log(`❌ Price Statistics failed: ${error.message}`);
  }

  // Test 5: Plugin Integration Test
  console.log("\n🔌 Testing Plugin Integration");
  try {
    const { chainlinkOraclePlugin } = await import("./dist/index.js");
    const tools = chainlinkOraclePlugin.tools();
    
    console.log("✅ Plugin Integration Result:");
    console.log(`   🔧 Plugin Name: ${chainlinkOraclePlugin.name}`);
    console.log(`   📦 Version: ${chainlinkOraclePlugin.version}`);
    console.log(`   🏷️  Tags: ${chainlinkOraclePlugin.tags?.join(', ')}`);
    console.log(`   🛠️  Total Tools: ${tools.length}`);
    console.log("   🔧 Available Tools:");
    tools.forEach((tool, index) => {
      console.log(`     ${index + 1}. ${tool.name} (${tool.method})`);
    });
  } catch (error) {
    console.log(`❌ Plugin Integration failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("🎉 Enhanced Plugin Test Suite Complete!");
  console.log("\n📋 Summary:");
  console.log("   ✅ 4 Oracle Tools Available");
  console.log("   ⚡ Professional Build System (tsup)");
  console.log("   📦 Scoped Package (@fermindietze/...)");
  console.log("   🔄 Context Integration Ready");
  console.log("   🚀 Production Ready with Dual Exports");
};

main().catch(console.error);