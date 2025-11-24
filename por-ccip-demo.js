import 'dotenv/config';
import { 
  checkProofOfReserveTool,
  getCcipMessageStatusTool 
} from "./dist/index.js";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

const demonstratePorAndCcip = async () => {
  console.log("🔒📡 Proof of Reserve & CCIP Demonstration");
  console.log("=" .repeat(60));
  
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
      console.log(`✅ Using ${network} network\n`);
    } catch (error) {
      console.log("⚠️  Using fallback mode\n");
    }
  }

  // 🔒 PROOF OF RESERVE DEMONSTRATION
  console.log("🔒 PROOF OF RESERVE EXPLAINED");
  console.log("-".repeat(40));
  console.log("PoR verifies that custodians actually hold the assets they claim.");
  console.log("Examples of real PoR feeds:");
  console.log("• WBTC reserves: Proves Bitcoin backing wrapped Bitcoin");
  console.log("• USDC reserves: Verifies USD backing Circle's stablecoin");
  console.log("• Exchange reserves: Audits centralized exchange holdings\n");

  console.log("📋 How PoR Works in Your Plugin:");
  console.log("1. 🎯 Target: Smart contract address of PoR feed");
  console.log("2. 📞 Call: latestRoundData() function");
  console.log("3. 🔢 Process: Convert raw reserves to human-readable");
  console.log("4. ✅ Verify: Check if reserves > 0 (CONFIRMED/DEPLETED)\n");

  // Example PoR addresses (these are examples - replace with real ones)
  console.log("🧪 Testing with Example PoR Feed:");
  try {
    // This will fail gracefully since it's a demo address
    const porResult = await checkProofOfReserveTool.execute(
      client, 
      null, 
      { feedAddress: "0x1234567890123456789012345678901234567890" }
    );
    console.log("✅ PoR Result:", porResult);
  } catch (error) {
    console.log("❌ Expected failure with demo address:", error.message);
    console.log("💡 With real PoR feed address, you'd get:");
    console.log("   • Reserve amount: 21,000.456789 BTC");
    console.log("   • Status: RESERVES_CONFIRMED");
    console.log("   • Last updated: 2025-11-24T10:30:00Z");
    console.log("   • Decimals: 8\n");
  }

  // 🌐 CCIP DEMONSTRATION
  console.log("🌐 CCIP (Cross-Chain Interoperability) EXPLAINED");
  console.log("-".repeat(50));
  console.log("CCIP enables secure communication between different blockchains.");
  console.log("Real-world CCIP use cases:");
  console.log("• Cross-chain token transfers (USDC from Ethereum to Polygon)");
  console.log("• Multi-chain DeFi protocols");
  console.log("• Cross-chain NFT bridging");
  console.log("• Enterprise cross-chain workflows\n");

  console.log("📋 How CCIP Tracking Works in Your Plugin:");
  console.log("1. 🎯 Target: CCIP Router contract + Message ID");
  console.log("2. 🔍 Search: Scan blockchain events for message lifecycle");
  console.log("3. 📊 Events: CCIPSendRequested → CCIPMessageExecuted");
  console.log("4. 📈 Status: SENT → IN_PROGRESS → EXECUTED/FAILED\n");

  console.log("🧪 Testing with Example CCIP Message:");
  try {
    const ccipResult = await getCcipMessageStatusTool.execute(
      client,
      null,
      { 
        routerAddress: "0x1234567890123456789012345678901234567890",
        messageId: "0x1234567890123456789012345678901234567890123456789012345678901234",
        fromBlock: 1000000
      }
    );
    console.log("✅ CCIP Result:", ccipResult);
  } catch (error) {
    console.log("❌ Expected failure with demo data:", error.message);
    console.log("💡 With real CCIP message, you'd get:");
    console.log("   • Status: EXECUTED");
    console.log("   • Source Chain: Ethereum (16015286601757825753)");
    console.log("   • Destination Chain: Hedera (295629)");
    console.log("   • Sender: 0xabc123...");
    console.log("   • Receiver: 0xdef456...");
    console.log("   • Token Transfer: 1000 USDC");
    console.log("   • Execution Time: ~10-15 minutes\n");
  }

  // 📊 COMPARISON TABLE
  console.log("📊 COMPARISON: PoR vs CCIP");
  console.log("-".repeat(30));
  console.log("| Aspect        | Proof of Reserve    | CCIP                |");
  console.log("|---------------|---------------------|---------------------|");
  console.log("| Purpose       | Asset verification  | Cross-chain comm    |");
  console.log("| Data Source   | Smart contract call | Blockchain events   |");
  console.log("| Update Freq   | ~1 hour             | Real-time           |");
  console.log("| Use Case      | Audit reserves      | Track transfers     |");
  console.log("| Networks      | Single chain        | Multi-chain         |");
  console.log("| Response Time | ~2 seconds          | ~5 seconds          |\n");

  // 🎯 REAL-WORLD INTEGRATION EXAMPLES
  console.log("🎯 REAL-WORLD INTEGRATION EXAMPLES");
  console.log("-".repeat(40));
  console.log("PoR Integration:");
  console.log('await agent.run("check_proof_of_reserve", {');
  console.log('  feedAddress: "0xReal_WBTC_PoR_Feed_Address"');
  console.log('});');
  console.log("// Returns: { reserves: 125000.5, status: 'CONFIRMED' }\n");

  console.log("CCIP Integration:");
  console.log('await agent.run("get_ccip_message_status", {');
  console.log('  routerAddress: "0xReal_Hedera_CCIP_Router",');
  console.log('  messageId: "0xActual_Cross_Chain_Message_ID"');
  console.log('});');
  console.log("// Returns: { status: 'EXECUTED', sourceChain: 'Ethereum' }\n");

  console.log("🎉 Both tools provide enterprise-grade blockchain verification!");
};

demonstratePorAndCcip().catch(console.error);