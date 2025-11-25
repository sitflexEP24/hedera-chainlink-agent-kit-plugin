// src/utils/transparency.ts
import { Client } from "@hashgraph/sdk";
import { BlockchainOperation } from "../types/plugin.js";
import { detectNetwork } from "./network-detector.js";

export function createTransparencyInfo(
  client: Client | null,
  transactionResult: any,
  contractAddress?: string,
  operationType: string = 'blockchain_query',
  details?: Record<string, any>
): BlockchainOperation {
  const networkConfig = detectNetwork(client);
  
  const operation: BlockchainOperation = {
    type: operationType,
    network: networkConfig.network,
    timestamp: new Date().toISOString(),
  };

  // Add contract info
  if (contractAddress) {
    operation.contractAddress = contractAddress;
    operation.verificationUrl = `https://hashscan.io/${networkConfig.network}/contract/${contractAddress}`;
  }

  // Add transaction details
  if (transactionResult?.transactionId) {
    operation.transactionId = transactionResult.transactionId.toString();
    operation.verificationUrl = `https://hashscan.io/${networkConfig.network}/transaction/${operation.transactionId}`;
  }

  if (transactionResult?.transactionFee) {
    operation.hbarFee = Number(transactionResult.transactionFee.toTinybars()) / 100000000;
  }

  if (transactionResult?.gasUsed) {
    operation.gasUsed = Number(transactionResult.gasUsed.toString());
  }

  // Add custom details
  if (details) {
    operation.details = details;
  }

  return operation;
}

export function createAPITransparencyInfo(
  endpoint: string,
  operationType: string = 'api_request',
  details?: Record<string, any>
): BlockchainOperation {
  return {
    type: operationType,
    network: 'external_api',
    timestamp: new Date().toISOString(),
    verificationUrl: endpoint,
    details: {
      endpoint,
      ...details
    }
  };
}