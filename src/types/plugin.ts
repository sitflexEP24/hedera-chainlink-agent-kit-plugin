// src/types/plugin.ts
import { Client } from "@hashgraph/sdk";

// Use hedera-agent-kit's expected context interface
export interface Context {
  mode?: string;
  accountId?: string;
  [key: string]: any;
}

export interface Tool {
  method: string;
  name: string;
  description: string;
  parameters: any;
  execute: (client: Client, context: any, params: any) => Promise<any>;
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