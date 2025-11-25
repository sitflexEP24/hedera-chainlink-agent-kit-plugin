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

  // Add contract info if available
  if (contractAddress) {
    operation.contractAddress = contractAddress;
    operation.verificationUrl = `https://hashscan.io/${networkConfig.network}/contract/${contractAddress}`;
  }

  // Add transaction details if available
  if (transactionResult?.transactionId) {
    operation.transactionId = transactionResult.transactionId.toString();
    operation.verificationUrl = `https://hashscan.io/${networkConfig.network}/transaction/${operation.transactionId}`;
  }

  // Calculate HBAR fees safely
  if (transactionResult?.transactionFee) {
    try {
      const feeInTinybars = transactionResult.transactionFee.toTinybars();
      operation.hbarFee = Number(feeInTinybars) / 100_000_000; // Convert tinybars to HBAR
    } catch (error) {
      // Fee calculation failed, omit from result
    }
  }

  // Add gas usage if available
  if (transactionResult?.gasUsed) {
    operation.gasUsed = Number(transactionResult.gasUsed.toString());
  }

  // Add operation details
  if (details) {
    operation.details = { ...details }; // Shallow copy to prevent mutation
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