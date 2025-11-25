// src/actions/get-ccip-message-status.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";
import { ethers } from "ethers";
import { detectNetwork } from "../utils/network-detector.js";
import { CCIP_ROUTER_ABI } from "../constants/chainlink-abis.js";
import { createTransparencyInfo } from "../utils/transparency.js";
import { Tool, OperationResult } from "../types/plugin.js";

const CCIP_STATUS_MAP = ["UNKNOWN", "SENT", "IN_PROGRESS", "SUCCESS", "FAILED"];

const parameters = z.object({
  routerAddress: z.string().describe("CCIP Router contract address (0x...)"),
  messageId: z.string().describe("CCIP message ID (0x... 32-byte hex)"),
  fromBlock: z.number().optional().describe("Starting block for event search (optional)")
});

async function execute(client: Client, context: any, params: z.infer<typeof parameters>): Promise<OperationResult> {
  const { routerAddress, messageId, fromBlock } = params;

  if (!routerAddress.startsWith("0x") || routerAddress.length !== 42) {
    throw new Error("Invalid router address format");
  }
  
  if (!messageId.startsWith("0x") || messageId.length !== 66) {
    throw new Error("Invalid message ID format. Must be 32-byte hex string");
  }

  const networkConfig = detectNetwork(client);
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcEndpoint);
  const contract = new ethers.Contract(routerAddress, CCIP_ROUTER_ABI, provider);

  console.log(`Checking CCIP message on ${networkConfig.network}`);

  const latestBlock = await provider.getBlockNumber();
  const searchFromBlock = fromBlock || Math.max(latestBlock - 1000, 0);

  const [sendEvents, executeEvents] = await Promise.all([
    contract.queryFilter(contract.filters.CCIPSendRequested(messageId), searchFromBlock, latestBlock),
    contract.queryFilter(contract.filters.CCIPMessageExecuted(messageId), searchFromBlock, latestBlock)
  ]);

  let status = "UNKNOWN";
  let statusCode = -1;

  if (executeEvents.length > 0) {
    status = "EXECUTED";
    statusCode = 3;
  } else if (sendEvents.length > 0) {
    status = "SENT";
    statusCode = 1;
    
    try {
      const contractStatus = await contract.getMessageStatus(messageId);
      status = CCIP_STATUS_MAP[contractStatus] || "UNKNOWN";
      statusCode = contractStatus;
    } catch (error) {
      console.log("Could not get status from contract, using event-based status");
    }
  }

  const transparency = createTransparencyInfo(client, null, routerAddress, 'ccip_message_tracking', {
    function: 'event_monitoring',
    rpcProvider: networkConfig.rpcEndpoint,
    messageId,
    blocksSearched: latestBlock - searchFromBlock + 1,
    eventsFound: {
      send: sendEvents.length,
      execute: executeEvents.length
    }
  });

  return {
    messageId,
    routerAddress,
    status,
    statusCode,
    network: networkConfig.network,
    searchRange: {
      fromBlock: searchFromBlock,
      toBlock: latestBlock,
      blocksSearched: latestBlock - searchFromBlock + 1
    },
    sendDetails: sendEvents[0] ? {
      transactionHash: sendEvents[0].transactionHash,
      blockNumber: sendEvents[0].blockNumber,
      sourceChainSelector: (sendEvents[0] as any).args?.sourceChainSelector?.toString(),
      sender: (sendEvents[0] as any).args?.sender,
    } : null,
    executeDetails: executeEvents[0] ? {
      transactionHash: executeEvents[0].transactionHash,
      blockNumber: executeEvents[0].blockNumber,
      receiver: (executeEvents[0] as any).args?.receiver,
    } : null,
    source: "ccip-evm-events",
    timestamp: new Date().toISOString(),
    blockchainOperation: transparency
  };
}

export const GET_CCIP_MESSAGE_STATUS = "get_ccip_message_status";

export const getCcipMessageStatusTool: Tool = {
  method: GET_CCIP_MESSAGE_STATUS,
  name: "Chainlink: Get CCIP Message Status",
  description: "Tracks Chainlink CCIP cross-chain message status via blockchain events",
  parameters,
  execute,
};

export default getCcipMessageStatusTool;