import 'dotenv/config';
import { Client, AccountId, PrivateKey, AccountInfoQuery, Hbar } from "@hashgraph/sdk";

async function diagnoseAccount() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  
  if (!accountId || !privateKey) {
    console.error("❌ Missing credentials in .env file");
    return;
  }

  console.log("🔍 Diagnosing Hedera Account Issues...");
  console.log("=" * 50);
  
  try {
    // Test 1: Private key parsing
    console.log("📋 Step 1: Testing private key format...");
    let parsedPrivateKey;
    
    try {
      // Try parsing with 0x prefix
      if (privateKey.startsWith('0x')) {
        parsedPrivateKey = PrivateKey.fromStringECDSA(privateKey);
        console.log("✅ Private key format: ECDSA with 0x prefix - OK");
      } else {
        parsedPrivateKey = PrivateKey.fromStringECDSA(privateKey);
        console.log("✅ Private key format: ECDSA without prefix - OK");
      }
    } catch (error) {
      try {
        // Try DER format
        parsedPrivateKey = PrivateKey.fromStringDER(privateKey);
        console.log("✅ Private key format: DER - OK");
      } catch (derError) {
        console.error("❌ Private key parsing failed:", error.message);
        return;
      }
    }
    
    // Test 2: Derive public key and account ID
    console.log("\n📋 Step 2: Verifying key pair...");
    const publicKey = parsedPrivateKey.publicKey;
    console.log(`✅ Public key derived: ${publicKey.toString()}`);
    
    // Test 3: Create client and set operator
    console.log("\n📋 Step 3: Setting up Hedera client...");
    const client = Client.forTestnet();
    client.setOperator(AccountId.fromString(accountId), parsedPrivateKey);
    console.log("✅ Client configured successfully");
    
    // Test 4: Check account balance
    console.log("\n📋 Step 4: Checking account balance...");
    const accountInfo = new AccountInfoQuery()
      .setAccountId(AccountId.fromString(accountId));
    
    const info = await accountInfo.execute(client);
    const balance = info.balance;
    
    console.log(`✅ Account balance: ${balance.toString()}`);
    
    if (balance.toTinybars() < Hbar.fromTinybars(100000).toTinybars()) {
      console.log("⚠️  WARNING: Low balance - you need at least 0.001 HBAR for contract calls");
    }
    
    // Test 5: Verify account exists and key matches
    console.log("\n📋 Step 5: Verifying account key...");
    const accountKey = info.key;
    if (accountKey && accountKey.toString() === publicKey.toString()) {
      console.log("✅ Account key matches private key");
    } else {
      console.log("❌ CRITICAL: Account key does not match private key!");
      console.log(`Expected: ${publicKey.toString()}`);
      console.log(`Found: ${accountKey?.toString()}`);
      return;
    }
    
    console.log("\n🎉 All diagnostics passed! Your account should work for contract calls.");
    
  } catch (error) {
    console.error("❌ Diagnostic failed:", error.message);
    
    if (error.message.includes("INVALID_ACCOUNT_ID")) {
      console.log("💡 Suggestion: The account ID doesn't exist on testnet");
    } else if (error.message.includes("INVALID_SIGNATURE")) {
      console.log("💡 Suggestion: The private key doesn't match this account");
    } else {
      console.log("💡 Suggestion: Check your network connection and credentials");
    }
  }
}

diagnoseAccount().catch(console.error);