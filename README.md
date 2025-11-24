# Hedera Chainlink Oracle Plugin

A Chainlink price oracle plugin for Hedera Agent Kit that enables fetching cryptocurrency prices using Chainlink smart contracts deployed on the Hedera network.

## Features

- 🔗 **Smart Contract Integration**: Direct access to Chainlink price feeds on Hedera
- 🌐 **Dual Network Support**: Works on both Hedera mainnet and testnet
- 🔄 **Intelligent Fallback**: Falls back to CoinGecko API when smart contracts are unavailable
- 💰 **Multiple Assets**: Supports HBAR, BTC, ETH, USDC, USDT, DAI, and LINK price feeds
- 🚀 **Production Ready**: Mainnet compatible with automatic network detection

## Installation

```bash
npm install hedera-chainlink-plugin
```

## Quick Start

### For Testnet Development
```typescript
import { HederaAgentKit } from 'hedera-agent-kit';
import { chainlinkOraclePlugin } from 'hedera-chainlink-plugin';

const agent = new HederaAgentKit({
  accountId: "0.0.YOUR_TESTNET_ACCOUNT",
  privateKey: "YOUR_TESTNET_PRIVATE_KEY",
  network: "testnet"
});

agent.use(chainlinkOraclePlugin);

// Get HBAR price via Chainlink smart contract
const price = await agent.run('chainlink_get_crypto_price', {
  base: 'HBAR',
  quote: 'USD'
});

console.log(`HBAR Price: $${price.price}`);
```

### For Mainnet Production
```typescript
import { HederaAgentKit } from 'hedera-agent-kit';
import { chainlinkOraclePlugin } from 'hedera-chainlink-plugin';

const agent = new HederaAgentKit({
  accountId: "0.0.YOUR_MAINNET_ACCOUNT",
  privateKey: "YOUR_MAINNET_PRIVATE_KEY",
  network: "mainnet"  // Plugin automatically detects mainnet
});

agent.use(chainlinkOraclePlugin);

// HBAR/USD uses Chainlink smart contract on mainnet
const hbarPrice = await agent.run('chainlink_get_crypto_price', {
  base: 'HBAR',
  quote: 'USD'
});

// Other pairs use CoinGecko fallback on mainnet
const btcPrice = await agent.run('chainlink_get_crypto_price', {
  base: 'BTC',
  quote: 'USD'
});
```

## Network Support

### Mainnet
- **All Supported Pairs**: ✅ Chainlink Smart Contracts
  - HBAR/USD: `0xAF685FB45C12b92b5054ccb9313e135525F9b5d5`
  - BTC/USD: `0xaD01E27668658Cc8c1Ce6Ed31503D75F31eEf480`
  - ETH/USD: `0xd2D2CB0AEb29472C3008E291355757AD6225019e`
  - USDT/USD: `0x8F4978D9e5eA44bF915611b73f45003c61f1BC79`
  - USDC/USD: `0x2b358642c7C37b6e400911e4FE41770424a7349F`
  - DAI/USD: `0x64d5B38ae9f06b77F9A49Dd4d0a7f8dbd6d52e05`
  - LINK/USD: `0xB006e5ED0B9CfF64BAD53b47582FcE3c885EA4b2`
- **Fallback**: 🔄 CoinGecko API (if smart contracts fail)

### Testnet  
- **All Supported Pairs**: ✅ Chainlink Smart Contracts
  - HBAR/USD: `0x59bC155EB6c6C415fE43255aF66EcF0523c92B4a`
  - BTC/USD: `0x058fE79CB5775d4b167920Ca6036B824805A9ABd`
  - ETH/USD: `0xb9d461e0b962aF219866aDfA7DD19C52bB9871b9`
  - DAI/USD: `0xdA2aBF7C90aDC73CDF5cA8d720B87bD5F5863389`
  - LINK/USD: `0xF111b70231E89D69eBC9f6C9208e9890383Ef432`
  - USDC/USD: `0xb632a7e7e02d76c0Ce99d9C62c7a2d1B5F92B6B5`
  - USDT/USD: `0x06823de8E77d708C4cB72Cbf04495D67afF4Bd37`
- **Fallback**: 🔄 CoinGecko API (if smart contracts fail)

## Supported Price Feeds

| Pair | Testnet SC | Mainnet SC | Fallback |
|------|------------|------------|----------|
| HBAR/USD | ✅ | ✅ | ✅ |
| BTC/USD | ✅ | ✅ | ✅ |
| ETH/USD | ✅ | ✅ | ✅ |
| USDC/USD | ✅ | ✅ | ✅ |
| USDT/USD | ✅ | ✅ | ✅ |
| DAI/USD | ✅ | ✅ | ✅ |
| LINK/USD | ✅ | ✅ | ✅ |

✅ = Chainlink Smart Contract  
🔄 = CoinGecko Fallback

## Setup

1. **Create a `.env` file** in your project root:
   ```bash
   cp .env.example .env
   ```

2. **Configure your Hedera credentials** in the `.env` file:
   ```env
   HEDERA_NETWORK=testnet
   HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
   HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
   ```

3. **For mainnet usage**, update your `.env`:
   ```env
   HEDERA_NETWORK=mainnet
   HEDERA_ACCOUNT_ID=0.0.YOUR_MAINNET_ACCOUNT
   HEDERA_PRIVATE_KEY=YOUR_MAINNET_PRIVATE_KEY
   ```

## Available Tools

### `chainlink_get_crypto_price`

Fetches the latest cryptocurrency price using Chainlink oracle smart contracts on Hedera.

**Parameters:**
- `base` (string): Asset symbol (BTC, ETH, HBAR, USDC, USDT, DAI, LINK)
- `quote` (string): Currency symbol (USD)

**Returns:**
```typescript
{
  base: string;
  quote: string;
  price: number;
  source: "chainlink-hedera-sc" | "coingecko-api-fallback";
  contractAddress?: string;
  roundId?: string;
  updatedAt?: string;
  timestamp: string;
  decimals?: number;
  note?: string;
}
```

## Error Handling

The plugin includes robust error handling with automatic fallback to CoinGecko API when:
- Smart contract calls fail
- Contract addresses are not configured
- Network connectivity issues occur

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request