# Hedera Chainlink Oracle Plugin

A comprehensive Chainlink oracle plugin for Hedera Agent Kit that provides enterprise-grade cryptocurrency price data, historical analytics, and market statistics using Chainlink smart contracts on the Hedera network.

## 🚀 **Version 2.1.0 - Enterprise Edition**

### **Enhanced Features**

- 🔗 **Smart Contract Integration**: Direct access to Chainlink price feeds on Hedera
- 🌐 **Dual Network Support**: Works on both Hedera mainnet and testnet  
- 🔄 **Intelligent Fallback**: Multi-layer fallback system (Smart Contract → CoinGecko API)
- 💰 **Multiple Assets**: Supports HBAR, BTC, ETH, USDC, USDT, DAI, and LINK
- 📊 **4 Comprehensive Tools**: Real-time prices, historical data, batch processing, market analytics
- 🏗️ **Professional Build**: TypeScript, dual exports (CJS/ESM), source maps
- 🎯 **Context Integration**: Ready for Hedera Agent Kit v3.4.0+
- ⚡ **Production Ready**: Enterprise-grade error handling and testing

## Installation

```bash
npm install @fermindietze/hedera-chainlink-agent-kit-plugin
```

## Quick Start

### For Testnet Development
```typescript
import { HederaAgentKit } from 'hedera-agent-kit';
import { chainlinkOraclePlugin } from '@fermindietze/hedera-chainlink-agent-kit-plugin';

const agent = new HederaAgentKit({
  accountId: "0.0.YOUR_TESTNET_ACCOUNT",
  privateKey: "YOUR_TESTNET_PRIVATE_KEY",
  network: "testnet"
});

agent.use(chainlinkOraclePlugin);

// Get real-time HBAR price via Chainlink smart contract
const price = await agent.run('chainlink_get_crypto_price', {
  base: 'HBAR',
  quote: 'USD'
});

console.log(`HBAR Price: $${price.price}`);
```

### For Production (Mainnet)
```typescript
import { HederaAgentKit } from 'hedera-agent-kit';
import { chainlinkOraclePlugin } from '@fermindietze/hedera-chainlink-agent-kit-plugin';

const agent = new HederaAgentKit({
  accountId: "0.0.YOUR_MAINNET_ACCOUNT",
  privateKey: "YOUR_MAINNET_PRIVATE_KEY",
  network: "mainnet"
});

agent.use(chainlinkOraclePlugin);

// Production-ready price fetching with automatic network detection
const result = await agent.run('chainlink_get_crypto_price', {
  base: 'HBAR',
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

## 🛠️ **Available Tools (4 Total)**

### 1. `chainlink_get_crypto_price` - Real-time Price Oracle

Fetches live cryptocurrency prices using Chainlink smart contracts with intelligent fallback.

**Parameters:**
- `base` (string): Asset symbol (BTC, ETH, HBAR, USDC, USDT, DAI, LINK)
- `quote` (string): Currency symbol (USD)

**Example Usage:**
```typescript
const price = await agent.run('chainlink_get_crypto_price', {
  base: 'HBAR',
  quote: 'USD'
});
// Returns: { base: 'HBAR', quote: 'USD', price: 0.284156, source: 'chainlink-hedera-sc', ... }
```

### 2. `chainlink_get_historical_price` - Historical Price Data

Retrieves historical cryptocurrency prices for any specific date.

**Parameters:**
- `base` (string): Asset symbol
- `quote` (string): Currency symbol  
- `timestamp` (string): Date in ISO format or 'YYYY-MM-DD'

**Example Usage:**
```typescript
const historicalPrice = await agent.run('chainlink_get_historical_price', {
  base: 'BTC',
  quote: 'USD',
  timestamp: '2024-01-01'
});
// Returns: { base: 'BTC', quote: 'USD', price: 42150.23, date: '2024-01-01', ... }
```

### 3. `chainlink_get_multiple_prices` - Batch Price Processing

Fetches multiple trading pairs in a single efficient request with batch processing.

**Parameters:**
- `pairs` (array): Array of objects with `base` and `quote` properties

**Example Usage:**
```typescript
const multiPrices = await agent.run('chainlink_get_multiple_prices', {
  pairs: [
    { base: 'HBAR', quote: 'USD' },
    { base: 'BTC', quote: 'USD' },
    { base: 'ETH', quote: 'USD' }
  ]
});
// Returns: { results: [...], totalRequested: 3, successCount: 3, errorCount: 0, ... }
```

### 4. `chainlink_get_price_statistics` - Market Analytics

Provides comprehensive market statistics including price changes, volume, and market cap.

**Parameters:**
- `base` (string): Asset symbol
- `quote` (string): Currency symbol
- `days` (number, optional): Number of days for statistics (default: 7)

**Example Usage:**
```typescript
const stats = await agent.run('chainlink_get_price_statistics', {
  base: 'ETH',
  quote: 'USD'
});
// Returns: { currentPrice: 2340.56, priceChanges: { "24h": 2.4, "7d": -1.2 }, volume24h: 8500000000, ... }
```

## 🏗️ **Professional Architecture**

### Project Structure
```
src/
├── index.ts                    # Main plugin export
└── tools/
    └── chainlink/
        ├── get-crypto-price.ts         # Real-time prices
        ├── get-historical-price.ts     # Historical data
        ├── get-multiple-prices.ts      # Batch processing
        ├── get-price-statistics.ts     # Market analytics
        └── feeds.ts                    # Configuration
```

### Build System
- **TypeScript**: Full type safety and IntelliSense
- **tsup**: Professional build with dual package exports
- **Dual Exports**: Both CommonJS and ES Modules supported
- **Source Maps**: Full debugging support
- **Minification**: Optimized production bundles

## 🔧 **Development**

### Building
```bash
npm run build        # Production build
npm run dev          # Development with watch mode
npm run lint         # TypeScript type checking
```

### Testing
```bash
npm run test         # Run basic tests
node enhanced-test.js # Comprehensive test suite
```

### Environment Setup
1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure credentials:
   ```env
   HEDERA_NETWORK=testnet
   HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT
   HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
   ```

## 📊 **Error Handling & Reliability**

The plugin features industry-leading error handling:

- **Multi-layer Fallback**: Smart Contract → CoinGecko API → Detailed Error
- **Network Detection**: Automatic testnet/mainnet identification
- **Rate Limiting**: Built-in delays to prevent API throttling
- **Comprehensive Logging**: Detailed error context and debugging info
- **Graceful Degradation**: Continues working even when some services fail

## 🎯 **Production Features**

- **Enterprise Grade**: Professional packaging and build system
- **Context Integration**: Ready for latest Hedera Agent Kit versions
- **Type Safety**: Full TypeScript implementation with strict types
- **Performance**: Optimized for high-frequency trading applications
- **Monitoring**: Built-in diagnostics and health checking
- **Scalability**: Efficient batch processing for multiple pairs

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request