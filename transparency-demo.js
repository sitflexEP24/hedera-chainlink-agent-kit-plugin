import 'dotenv/config';
import { 
  getCryptoPriceTool,
  getHistoricalPriceTool,
  checkProofOfReserveTool,
  fetchEnterpriseMetricTool
} from "./dist/index.js";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

const demonstrateTransparency = async () => {
  console.log("🔍 BLOCKCHAIN OPERATION TRANSPARENCY DEMONSTRATION");
  console.log("🚀 Enhanced Hedera Chainlink Oracle Plugin v2.1.0");
  console.log("=" .repeat(80));
  
  console.log("📋 What's New: Every tool now provides complete transparency about:");
  console.log("   • Blockchain operations (smart contract calls, transaction fees)");
  console.log("   • API requests (endpoints, providers, parameters)");
  console.log("   • Network details (testnet/mainnet, RPC endpoints)");
  console.log("   • Verification links (HashScan, contract addresses)");
  console.log("   • Operation metadata (timing, gas usage, round IDs)\n");
  
  // Setup client
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyString = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || 'testnet';
  
  let client = null;
  if (accountId && privateKeyString) {
    try {
      const privateKey = PrivateKey.fromStringECDSA(privateKeyString);
      client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
      client.setOperator(AccountId.fromString(accountId), privateKey);
      console.log(`✅ Using Hedera ${network} client`);
    } catch (error) {
      console.log("⚠️  Using fallback mode (no client)");
    }
  } else {
    console.log("ℹ️  No credentials - demonstrating API fallback transparency");
  }
  
  console.log("\n" + "=".repeat(80));

  // 🔍 DEMONSTRATION 1: Price Tool with Smart Contract Transparency
  console.log("\n1️⃣  SMART CONTRACT TRANSPARENCY DEMO");
  console.log("📊 Getting HBAR price with full blockchain operation details...\n");
  
  try {
    const priceResult = await getCryptoPriceTool.execute(client, null, { 
      base: "HBAR", 
      quote: "USD" 
    });
    
    console.log("💰 PRICE RESULT:");
    console.log(`   Price: ${priceResult.base}/${priceResult.quote} = $${priceResult.price}`);
    console.log(`   Source: ${priceResult.source}`);
    
    if (priceResult.blockchainOperation) {
      const op = priceResult.blockchainOperation;
      console.log("\n🔍 BLOCKCHAIN OPERATION DETAILS:");
      console.log(`   Type: ${op.type}`);
      console.log(`   Network: ${op.network}`);
      
      if (op.contractAddress) {
        console.log(`   Contract: ${op.contractAddress}`);
        console.log(`   Verification: ${op.verificationUrl || 'N/A'}`);
      }
      
      if (op.hbarFee) {
        console.log(`   HBAR Fee: ${op.hbarFee} HBAR`);
      }
      
      if (op.operationDetails) {
        console.log(`   Function Called: ${op.operationDetails.functionCalled}`);
        if (op.operationDetails.roundId) {
          console.log(`   Oracle Round: #${op.operationDetails.roundId}`);
        }
        if (op.operationDetails.oracleUpdatedAt) {
          console.log(`   Oracle Updated: ${op.operationDetails.oracleUpdatedAt}`);
        }
      }
      
      console.log(`   Timestamp: ${op.timestamp}`);
    }
  } catch (error) {
    console.log(`❌ Price demo failed: ${error.message}`);
  }

  // 🌐 DEMONSTRATION 2: API Transparency Demo
  console.log("\n\n2️⃣  API TRANSPARENCY DEMO");
  console.log("📅 Getting historical price with API operation details...\n");
  
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const historicalResult = await getHistoricalPriceTool.execute(client, null, {
      base: "BTC",
      quote: "USD", 
      timestamp: yesterday.toISOString().split('T')[0]
    });
    
    console.log("📊 HISTORICAL PRICE RESULT:");
    console.log(`   Price: ${historicalResult.base}/${historicalResult.quote} = $${historicalResult.price.toLocaleString()}`);
    console.log(`   Date: ${historicalResult.date}`);
    
    if (historicalResult.blockchainOperation) {
      const op = historicalResult.blockchainOperation;
      console.log("\n🌐 API OPERATION DETAILS:");
      console.log(`   Type: ${op.type}`);
      console.log(`   Provider: ${op.operationDetails?.provider || 'Unknown'}`);
      console.log(`   API Endpoint: ${op.verificationUrl}`);
      console.log(`   Data Source: ${op.operationDetails?.dataSource || 'N/A'}`);
      console.log(`   Requested Date: ${op.operationDetails?.requestedDate}`);
      console.log(`   CoinGecko ID: ${op.operationDetails?.coinGeckoId}`);
      console.log(`   Timestamp: ${op.timestamp}`);
    }
  } catch (error) {
    console.log(`❌ Historical price demo failed: ${error.message}`);
  }

  // 🏢 DEMONSTRATION 3: Enterprise Action Transparency
  console.log("\n\n3️⃣  ENTERPRISE TRANSPARENCY DEMO");
  console.log("💱 Getting FX rate with enterprise API transparency...\n");
  
  try {
    const fxResult = await fetchEnterpriseMetricTool.execute(client, null, {
      type: "fx",
      id: "USD/EUR"
    });
    
    console.log("💱 FX RATE RESULT:");
    console.log(`   Rate: ${fxResult.currencyPair} = ${fxResult.rate}`);
    console.log(`   Inverse: 1 ${fxResult.targetCurrency} = ${fxResult.inverseRate} ${fxResult.baseCurrency}`);
    
    if (fxResult.blockchainOperation) {
      const op = fxResult.blockchainOperation;
      console.log("\n🏢 ENTERPRISE API DETAILS:");
      console.log(`   Type: ${op.type}`);
      console.log(`   Provider: ${op.operationDetails?.provider}`);
      console.log(`   Currency Pair: ${op.operationDetails?.currencyPair}`);
      console.log(`   API Timeout: ${op.operationDetails?.timeout}ms`);
      console.log(`   Rates Available: ${op.operationDetails?.totalRatesAvailable}`);
      console.log(`   Last Updated: ${op.operationDetails?.lastUpdated}`);
      console.log(`   User Agent: ${op.operationDetails?.userAgent}`);
      console.log(`   Timestamp: ${op.timestamp}`);
    }
  } catch (error) {
    console.log(`❌ FX rate demo failed: ${error.message}`);
  }

  // 🔒 DEMONSTRATION 4: Advanced Blockchain Transparency
  console.log("\n\n4️⃣  ADVANCED BLOCKCHAIN TRANSPARENCY DEMO");
  console.log("🔒 Checking Proof of Reserve with contract interaction details...\n");
  
  try {
    // Using a demo PoR address
    const mockAddress = "0x1234567890123456789012345678901234567890";
    const porResult = await checkProofOfReserveTool.execute(client, null, {
      feedAddress: mockAddress
    });
    
    console.log("🔒 PROOF OF RESERVE RESULT:");
    console.log("   (This will show transparency even when contract call fails)");
  } catch (error) {
    console.log(`❌ Expected failure with demo address: ${error.message}`);
    console.log("   💡 With real PoR contract, transparency would show:");
    console.log("      • Contract address and verification link");
    console.log("      • RPC provider endpoint"); 
    console.log("      • Functions called (latestRoundData, decimals, description)");
    console.log("      • Reserve verification method");
    console.log("      • Oracle round ID and update timestamp");
    console.log("      • Raw reserve amount and processed value");
  }

  // 📊 SUMMARY
  console.log("\n" + "=".repeat(80));
  console.log("📊 TRANSPARENCY FEATURES SUMMARY");
  console.log("=" .repeat(80));
  
  console.log("\n🎯 EVERY TOOL NOW PROVIDES:");
  console.log("   ✅ Blockchain Operation Details");
  console.log("      • Network (testnet/mainnet)");
  console.log("      • Contract addresses"); 
  console.log("      • Transaction IDs and fees");
  console.log("      • Gas usage and timing");
  console.log("   ✅ API Operation Details");
  console.log("      • Provider and endpoint");
  console.log("      • Request parameters");
  console.log("      • Response metadata");
  console.log("      • Rate limiting info");
  console.log("   ✅ Verification Links");
  console.log("      • HashScan transaction links");
  console.log("      • Contract verification URLs");
  console.log("      • API documentation links");
  console.log("   ✅ Operational Context");
  console.log("      • Function names called");
  console.log("      • Oracle round IDs");
  console.log("      • Update timestamps");
  console.log("      • Error handling paths");

  console.log("\n🚀 IMPACT FOR AGENTS:");
  console.log("   • Users always know what blockchain operations happened");
  console.log("   • Complete cost transparency (HBAR fees)");
  console.log("   • Verification links for independent validation");
  console.log("   • API provider transparency for data sources");
  console.log("   • Professional audit trail for all operations");

  console.log("\n🎉 Your plugin now provides enterprise-grade transparency!");
  console.log("   Every developer using it gets automatic operation details!");
};

demonstrateTransparency().catch(console.error);