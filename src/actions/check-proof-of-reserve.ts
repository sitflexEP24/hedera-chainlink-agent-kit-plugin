// src/actions/check-proof-of-reserve.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";
import { ethers } from "ethers";
import { detectNetwork } from "../utils/network-detector.js";
import { AGGREGATOR_V3_INTERFACE_ABI } from "../constants/chainlink-abis.js";

export const checkProofOfReserveParameters = z.object({
  feedAddress: z.string().describe("Chainlink Proof of Reserve feed contract address (0x...)"),
});

const checkProofOfReservePrompt = `
Checks Chainlink Proof of Reserve data for asset reserves verification.

Parameters:
- feedAddress: Contract address of the Chainlink PoR feed (e.g., "0x...")

Returns reserve data including total reserves, decimals, and last update info.
`;

export async function checkProofOfReserveExecute(
  client: Client,
  context: any,
  params: z.infer<typeof checkProofOfReserveParameters>
) {
  try {
    const { feedAddress } = params;

    // Validate address format
    if (!feedAddress.startsWith("0x") || feedAddress.length !== 42) {
      throw new Error("Invalid feed address format. Must be a valid Ethereum address (0x...)");
    }

    // Use centralized network detection
    const networkConfig = detectNetwork(client);
    const { network, rpcEndpoint } = networkConfig;

    // Create ethers provider for Hedera EVM
    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const contract = new ethers.Contract(feedAddress, AGGREGATOR_V3_INTERFACE_ABI, provider);

    console.log(`🔍 Checking Proof of Reserve on ${network} network...`);

    // Fetch latest round data
    const [roundId, answer, startedAt, updatedAt, answeredInRound] = await contract.latestRoundData();
    
    // Get decimals and description
    const [decimals, description] = await Promise.all([
      contract.decimals(),
      contract.description()
    ]);

    // Convert answer to readable format
    const reserves = Number(answer.toString()) / Math.pow(10, Number(decimals.toString()));
    const lastUpdated = new Date(Number(updatedAt.toString()) * 1000);

    return {
      feedAddress,
      description: description.toString(),
      reserves: {
        value: Number(reserves.toFixed(6)),
        decimals: Number(decimals.toString()),
        raw: answer.toString()
      },
      roundData: {
        roundId: roundId.toString(),
        startedAt: new Date(Number(startedAt.toString()) * 1000).toISOString(),
        updatedAt: lastUpdated.toISOString(),
        answeredInRound: answeredInRound.toString()
      },
      network,
      source: "chainlink-proof-of-reserve",
      timestamp: new Date().toISOString(),
      status: reserves > 0 ? "RESERVES_CONFIRMED" : "RESERVES_DEPLETED"
    };

  } catch (error: any) {
    // Enhanced error handling
    if (error.message.includes("call revert exception")) {
      throw new Error(`Proof of Reserve contract call failed: Invalid contract address or network mismatch`);
    } else if (error.message.includes("network")) {
      throw new Error(`Network connection failed: ${error.message}`);
    } else {
      throw new Error(`Proof of Reserve check failed: ${error.message}`);
    }
  }
}

export const CHECK_PROOF_OF_RESERVE = "check_proof_of_reserve";

export const checkProofOfReserveTool = {
  method: CHECK_PROOF_OF_RESERVE,
  name: "Chainlink: Check Proof of Reserve",
  description: checkProofOfReservePrompt,
  parameters: checkProofOfReserveParameters,
  execute: checkProofOfReserveExecute,
};

export default checkProofOfReserveTool;