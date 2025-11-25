// src/utils/network-detector.ts
import { Client } from "@hashgraph/sdk";

export interface NetworkConfig {
  network: 'testnet' | 'mainnet';
  rpcEndpoint: string;
  chainId: string;
}

const NETWORK_CONFIGS = {
  mainnet: {
    network: 'mainnet' as const,
    rpcEndpoint: 'https://mainnet.hashio.io/api',
    chainId: '295629'
  },
  testnet: {
    network: 'testnet' as const,
    rpcEndpoint: 'https://testnet.hashio.io/api',
    chainId: '296'
  }
};

export function detectNetwork(client: Client | null): NetworkConfig {
  if (!client) {
    return NETWORK_CONFIGS.testnet;
  }

  try {
    const clientStr = client.toString();
    const isMainnet = clientStr.includes('mainnet') || clientStr.includes('295629');
    return isMainnet ? NETWORK_CONFIGS.mainnet : NETWORK_CONFIGS.testnet;
  } catch (error) {
    console.warn('Network detection failed, defaulting to testnet:', error);
    return NETWORK_CONFIGS.testnet;
  }
}