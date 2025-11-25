// src/actions/check-proof-of-reserve.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";
import { ethers } from "ethers";
import { detectNetwork } from "../utils/network-detector.js";
import { AGGREGATOR_V3_INTERFACE_ABI } from "../constants/chainlink-abis.js";
import { createTransparencyInfo } from "../utils/transparency.js";
import { Tool, OperationResult } from "../types/plugin.js";

const parameters = z.object({
  feedAddress: z.string().describe("Chainlink Proof of Reserve feed contract address (0x...)"),
});

async function execute(client: Client, context: any, params: z.infer<typeof parameters>): Promise<OperationResult> {
  const { feedAddress } = params;

  if (!feedAddress.startsWith("0x") || feedAddress.length !== 42) {
    throw new Error("Invalid address format. Must be valid Ethereum address (0x...)");
  }

  const networkConfig = detectNetwork(client);
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcEndpoint);
  const contract = new ethers.Contract(feedAddress, AGGREGATOR_V3_INTERFACE_ABI, provider);

  console.log(`Checking Proof of Reserve on ${networkConfig.network}`);

  const [roundId, answer, startedAt, updatedAt, answeredInRound] = await contract.latestRoundData();
  const [decimals, description] = await Promise.all([
    contract.decimals(),
    contract.description()
  ]);

  const reserves = Number(answer.toString()) / Math.pow(10, Number(decimals.toString()));
  const transparency = createTransparencyInfo(client, null, feedAddress, 'proof_of_reserve_check', {
    function: 'latestRoundData + decimals + description',
    rpcProvider: networkConfig.rpcEndpoint,
    asset: description.toString(),
    roundId: roundId.toString(),
    decimals: Number(decimals.toString())
  });

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
      updatedAt: new Date(Number(updatedAt.toString()) * 1000).toISOString(),
      answeredInRound: answeredInRound.toString()
    },
    network: networkConfig.network,
    status: reserves > 0 ? "RESERVES_CONFIRMED" : "RESERVES_DEPLETED",
    source: "chainlink-proof-of-reserve",
    timestamp: new Date().toISOString(),
    blockchainOperation: transparency
  };
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