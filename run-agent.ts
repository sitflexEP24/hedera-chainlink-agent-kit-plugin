// run-agent.ts
import 'dotenv/config';
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import { chainlinkOraclePlugin } from "./dist/index.js";

async function main() {
  // Load credentials from environment variables
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyString = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || 'testnet';

  if (!accountId || !privateKeyString) {
    console.error("Error: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env file");
    process.exit(1);
  }

  // Parse private key using the correct method
  let privateKey;
  try {
    // Use fromStringECDSA for ECDSA keys (which start with 0x)
    privateKey = PrivateKey.fromStringECDSA(privateKeyString);
  } catch (error) {
    console.error("Error parsing private key:", error);
    console.log("Make sure your private key is in the correct ECDSA format");
    process.exit(1);
  }

  const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(AccountId.fromString(accountId), privateKey);

  console.log(`Using ${network} network with account: ${accountId}`);

  try {
    const tools = chainlinkOraclePlugin.tools();
    const result = await tools[0].execute(client, {}, { base: "HBAR", quote: "USD" });
    console.log("Current HBAR Price (Chainlink Smart Contract):");
    console.log(`$${result.price} USD`);
    console.log(`Source: ${result.source}`);
    console.log(`Contract Address: ${result.contractAddress || 'N/A'}`);
    console.log(`Updated: ${new Date(result.updatedAt || result.timestamp).toLocaleString()}`);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main();