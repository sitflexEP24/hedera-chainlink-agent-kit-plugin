// src/actions/check-proof-of-reserve.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";
import { ethers } from "ethers";
import { detectNetwork } from "../utils/network-detector.js";
import { AGGREGATOR_V3_INTERFACE_ABI } from "../constants/chainlink-abis.js";
import { createTransparencyInfo } from "../utils/transparency.js";
import { Tool, OperationResult, Context } from "../types/plugin.js";

// Enhanced validation
function validateContractAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (!address.startsWith("0x") || address.length !== 42) return false;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
  return ethers.isAddress(address);
}

const parameters = z.object({
  feedAddress: z.string()
    .min(42)
    .max(42)
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("Chainlink Proof of Reserve feed contract address (0x...)"),
});

async function execute(client: Client, context: Context, params: z.infer<typeof parameters>): Promise<OperationResult> {
  const { feedAddress } = params;

  // Enhanced address validation
  if (!validateContractAddress(feedAddress)) {
    throw new Error("Invalid contract address format");
  }

  const networkConfig = detectNetwork(client);
  
  try {
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcEndpoint, undefined, {
      staticNetwork: true // Prevent unnecessary network detection calls
    });
    
    const contract = new ethers.Contract(feedAddress, AGGREGATOR_V3_INTERFACE_ABI, provider);

    // Call contract methods with proper error handling and timeouts
    const [roundData, decimals, description] = await Promise.all([
      Promise.race([
        contract.latestRoundData(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Contract call timeout')), 15000)
        )
      ]),
      contract.decimals(),
      contract.description()
    ]);

    const [roundId, answer, startedAt, updatedAt, answeredInRound] = roundData as any[];
    
    // Validate contract response data
    const decimalsNum = Number(decimals.toString());
    const rawReserves = Number(answer.toString());
    
    if (decimalsNum < 0 || decimalsNum > 18) {
      throw new Error('Invalid decimals value from contract');
    }
    
    if (rawReserves < 0) {
      throw new Error('Invalid reserve value from contract');
    }

    const reserves = rawReserves / Math.pow(10, decimalsNum);
    
    // Sanity check on reserves (should be reasonable for most assets)
    if (reserves > 1e15) { // Extremely large number check
      throw new Error('Reserve value outside reasonable bounds');
    }

    const transparency = createTransparencyInfo(client, null, feedAddress, 'proof_of_reserve_check', {
      function: 'latestRoundData + decimals + description',
      rpcProvider: networkConfig.rpcEndpoint,
      asset: description.toString(),
      roundId: roundId.toString(),
      decimals: decimalsNum
    });

    return {
      feedAddress,
      description: description.toString(),
      reserves: {
        value: Number(reserves.toFixed(6)),
        decimals: decimalsNum,
        raw: answer.toString()
      },
      roundData: {
        roundId: roundId.toString(),
        startedAt: new Date(Number(startedAt.toString()) * 1000).toISOString(),
        updatedAt: new Date(Number(updatedAt.toString()) * 1000).toISOString(),
        answeredInRound: answeredInRound.toString()
      },
      network: networkConfig.network,
      status: reserves > 0 ? "RESERVES_CONFIRMED" : "RESERVES_DEPLETED",
      source: "chainlink-proof-of-reserve",
      timestamp: new Date().toISOString(),
      blockchainOperation: transparency
    };
  } catch (error: any) {
    // Sanitized error messages to prevent information leakage
    if (error.message.includes('timeout')) {
      throw new Error('Proof of Reserve contract call timed out');
    } else if (error.message.includes('CALL_EXCEPTION')) {
      throw new Error('Contract call failed - invalid contract or network issue');
    } else if (error.message.includes('Invalid')) {
      throw new Error(error.message); // Our own validation errors are safe
    } else {
      throw new Error('Proof of Reserve check failed');
    }
  }
}

export const CHECK_PROOF_OF_RESERVE = "check_proof_of_reserve";

export const checkProofOfReserveTool: Tool = {
  method: CHECK_PROOF_OF_RESERVE,
  name: "Chainlink: Check Proof of Reserve",
  description: "Verifies asset reserves using Chainlink Proof of Reserve feeds",
  parameters,
  execute,
};

export default checkProofOfReserveTool;