// src/utils/network-detector.ts
import { Client } from "@hashgraph/sdk";

export interface NetworkConfig {
  network: 'testnet' | 'mainnet';
  rpcEndpoint: string;
  chainId: string;
}

export function detectNetwork(client: Client | null): NetworkConfig {
  if (!client) {
    return {
      network: 'testnet',
      rpcEndpoint: 'https://testnet.hashio.io/api',
      chainId: '296'
    };
  }

  try {
    const clientStr = client.toString();
    if (clientStr.includes('mainnet') || clientStr.includes('295629')) {
      return {
        network: 'mainnet',
        rpcEndpoint: 'https://mainnet.hashio.io/api',
        chainId: '295629'
      };
    } else {
      return {
        network: 'testnet', 
        rpcEndpoint: 'https://testnet.hashio.io/api',
        chainId: '296'
      };
    }
  } catch (error) {
    console.warn('Network detection failed, defaulting to testnet:', error);
    return {
      network: 'testnet',
      rpcEndpoint: 'https://testnet.hashio.io/api', 
      chainId: '296'
    };
  }
}