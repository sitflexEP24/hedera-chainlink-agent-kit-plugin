// src/actions/get-ccip-message-status.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";
import { ethers } from "ethers";
import { detectNetwork } from "../utils/network-detector.js";
import { CCIP_ROUTER_ABI } from "../constants/chainlink-abis.js";

export const getCcipMessageStatusParameters = z.object({
  routerAddress: z.string().describe("CCIP Router contract address (0x...)"),
  messageId: z.string().describe("CCIP message ID (0x... hex string)"),
  fromBlock: z.number().optional().describe("Starting block number for event search (optional)")
});

const getCcipMessageStatusPrompt = `
Gets Chainlink CCIP cross-chain message status by reading events from EVM RPC.

Parameters:
- routerAddress: CCIP Router contract address
- messageId: Cross-chain message ID to track
- fromBlock: Starting block for event search (optional, defaults to latest 1000 blocks)

Returns message status, execution details, and transaction information.
`;

export async function getCcipMessageStatusExecute(
  client: Client,
  context: any,
  params: z.infer<typeof getCcipMessageStatusParameters>
) {
  try {
    const { routerAddress, messageId, fromBlock } = params;

    // Validate addresses and messageId format
    if (!routerAddress.startsWith("0x") || routerAddress.length !== 42) {
      throw new Error("Invalid router address format. Must be a valid Ethereum address (0x...)");
    }
    
    if (!messageId.startsWith("0x") || messageId.length !== 66) {
      throw new Error("Invalid message ID format. Must be a valid 32-byte hex string (0x...)");
    }

    // Use centralized network detection
    const networkConfig = detectNetwork(client);
    const { network, rpcEndpoint } = networkConfig;

    // Create ethers provider
    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const contract = new ethers.Contract(routerAddress, CCIP_ROUTER_ABI, provider);

    console.log(`🔍 Checking CCIP message status on ${network} network...`);

    // Get current block for search range
    const latestBlock = await provider.getBlockNumber();
    const searchFromBlock = fromBlock || Math.max(latestBlock - 1000, 0);

    // Search for CCIPSendRequested event
    const sendFilter = contract.filters.CCIPSendRequested(messageId);
    const sendEvents = await contract.queryFilter(sendFilter, searchFromBlock, latestBlock);

    // Search for CCIPMessageExecuted event  
    const executeFilter = contract.filters.CCIPMessageExecuted(messageId);
    const executeEvents = await contract.queryFilter(executeFilter, searchFromBlock, latestBlock);

    let sendEvent = null;
    let executeEvent = null;
    let status = "UNKNOWN";
    let statusCode = -1;

    // Process send event
    if (sendEvents.length > 0) {
      sendEvent = sendEvents[0];
      status = "SENT";
      
      // Try to get status from contract
      try {
        statusCode = await contract.getMessageStatus(messageId);
        // CCIP status codes: 0=Unknown, 1=Sent, 2=InProgress, 3=Success, 4=Failed
        const statusMap = ["UNKNOWN", "SENT", "IN_PROGRESS", "SUCCESS", "FAILED"];
        status = statusMap[statusCode] || "UNKNOWN";
      } catch (error) {
        // Contract might not have getMessageStatus function
        console.log("Could not get status from contract, using event-based status");
      }
    }

    // Process execute event
    if (executeEvents.length > 0) {
      executeEvent = executeEvents[0];
      status = "EXECUTED";
      statusCode = 3; // Success
    }

    // Build comprehensive response
    const result = {
      messageId,
      routerAddress,
      status,
      statusCode,
      network,
      searchRange: {
        fromBlock: searchFromBlock,
        toBlock: latestBlock,
        blocksSearched: latestBlock - searchFromBlock + 1
      },
      sendDetails: sendEvent ? {
        transactionHash: sendEvent.transactionHash,
        blockNumber: sendEvent.blockNumber,
        sourceChainSelector: (sendEvent as any).args?.sourceChainSelector?.toString(),
        sender: (sendEvent as any).args?.sender,
        data: (sendEvent as any).args?.data,
        tokenAddress: (sendEvent as any).args?.tokenAddress,
        amount: (sendEvent as any).args?.amount?.toString(),
        timestamp: await provider.getBlock(sendEvent.blockNumber).then(b => new Date(b!.timestamp * 1000).toISOString())
      } : null,
      executeDetails: executeEvent ? {
        transactionHash: executeEvent.transactionHash,
        blockNumber: executeEvent.blockNumber,
        sourceChainSelector: (executeEvent as any).args?.sourceChainSelector?.toString(),
        receiver: (executeEvent as any).args?.receiver,
        data: (executeEvent as any).args?.data,
        timestamp: await provider.getBlock(executeEvent.blockNumber).then(b => new Date(b!.timestamp * 1000).toISOString())
      } : null,
      source: "ccip-evm-events",
      timestamp: new Date().toISOString()
    };

    return result;

  } catch (error: any) {
    if (error.message.includes("call revert exception")) {
      throw new Error(`CCIP contract call failed: Invalid contract address or network mismatch`);
    } else if (error.message.includes("network")) {
      throw new Error(`Network connection failed: ${error.message}`);
    } else if (error.message.includes("Invalid")) {
      throw error; // Re-throw validation errors
    } else {
      throw new Error(`CCIP message status check failed: ${error.message}`);
    }
  }
}

export const GET_CCIP_MESSAGE_STATUS = "get_ccip_message_status";

export const getCcipMessageStatusTool = {
  method: GET_CCIP_MESSAGE_STATUS,
  name: "Chainlink: Get CCIP Message Status",
  description: getCcipMessageStatusPrompt,
  parameters: getCcipMessageStatusParameters,
  execute: getCcipMessageStatusExecute,
};

export default getCcipMessageStatusTool;