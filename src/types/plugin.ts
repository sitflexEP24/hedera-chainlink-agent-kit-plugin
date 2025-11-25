// src/types/plugin.ts
import { Client } from "@hashgraph/sdk";
import { ZodSchema } from "zod";

// Align with hedera-agent-kit's expected context interface
export interface Context {
  mode?: string;
  accountId?: string;
  network?: 'testnet' | 'mainnet';
  [key: string]: any;
}

export interface Tool {
  method: string;
  name: string;
  description: string;
  parameters: ZodSchema;  // Changed from 'any' to ZodSchema
  execute: (client: Client, context: Context, params: any) => Promise<OperationResult>;  // Improved typing
}

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags?: string[];
  tools: (context?: Context) => Tool[];
}

export interface OperationResult {
  [key: string]: any;
  blockchainOperation?: BlockchainOperation;
}

export interface BlockchainOperation {
  type: string;
  network: 'testnet' | 'mainnet' | 'external_api';
  timestamp: string;
  contractAddress?: string;
  transactionId?: string;
  hbarFee?: number;
  gasUsed?: number;
  verificationUrl?: string;
  details?: Record<string, any>;
}