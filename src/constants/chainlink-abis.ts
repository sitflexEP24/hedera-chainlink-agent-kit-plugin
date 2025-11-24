// src/constants/chainlink-abis.ts

export const AGGREGATOR_V3_INTERFACE_ABI = [
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      {"internalType": "uint80", "name": "roundId", "type": "uint80"},
      {"internalType": "int256", "name": "answer", "type": "int256"},
      {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
      {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
      {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const CCIP_ROUTER_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "messageId", "type": "bytes32"},
      {"indexed": true, "internalType": "uint64", "name": "sourceChainSelector", "type": "uint64"},
      {"indexed": false, "internalType": "address", "name": "sender", "type": "address"},
      {"indexed": false, "internalType": "bytes", "name": "data", "type": "bytes"},
      {"indexed": false, "internalType": "address", "name": "tokenAddress", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "CCIPSendRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "messageId", "type": "bytes32"},
      {"indexed": true, "internalType": "uint64", "name": "sourceChainSelector", "type": "uint64"},
      {"indexed": false, "internalType": "address", "name": "receiver", "type": "address"},
      {"indexed": false, "internalType": "bytes", "name": "data", "type": "bytes"}
    ],
    "name": "CCIPMessageExecuted",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "messageId", "type": "bytes32"}],
    "name": "getMessageStatus",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;