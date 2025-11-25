// AI_AGENT_INTEGRATION.md
# AI Agent Integration Guide for Hedera Chainlink Oracle Plugin

This guide provides specific instructions for AI agents and developers to properly present the transparency features and type definitions included in this plugin.

## 🤖 Required AI Agent System Prompts

### **Core Transparency Instruction**

Add this to your AI agent's system prompt when using this plugin:

```
When using the Hedera Chainlink Oracle Plugin, you MUST always present blockchain operation transparency information to users. Every tool response includes a `blockchainOperation` object with detailed operation information that users need to understand what happened, costs incurred, and how to verify the data independently.

ALWAYS explain:
1. Operation costs (HBAR fees) when blockchain operations occur
2. Data source (smart contract vs API fallback)
3. Verification links (HashScan URLs) for transaction verification  
4. Network context (testnet vs mainnet)
5. Contract addresses and oracle details when available
```

### **Specific Response Templates**

#### For Price Queries:
```
User Query: "What's the current [ASSET] price?"

Required Response Format:
"[ASSET] is currently $[PRICE] [QUOTE].

🔍 **Operation Details:**
• **Source**: [Smart Contract/API] on [Network]
• **Contract**: [Address if available]
• **Oracle Round**: [Round ID if available]
• **Last Updated**: [Timestamp]
• **HBAR Fee**: [Fee amount] HBAR
• **Verify**: [HashScan link]

[Brief explanation of data source reliability]"
```

#### For Proof of Reserve:
```
User Query: "Check if [ASSET] reserves are backed"

Required Response Format:
"✅/❌ [ASSET] Reserve Status: [STATUS]

📊 **Reserve Details:**
• **Current Reserves**: [Amount] [Asset]
• **Status**: [CONFIRMED/DEPLETED]
• **Contract**: [PoR Contract Address]
• **Last Updated**: [Timestamp]
• **HBAR Fee**: [Fee] HBAR
• **Verify**: [HashScan link]

This verification uses Chainlink's Proof of Reserve system to monitor real custodian holdings."
```

#### For Historical Data:
```
User Query: "What was [ASSET] price on [DATE]?"

Required Response Format:
"On [DATE], [ASSET] was priced at $[PRICE] [QUOTE].

📅 **Historical Data Details:**
• **Date**: [Requested Date]
• **Source**: [API Provider]
• **Data Provider**: [CoinGecko/etc]
• **Request Type**: Historical API query
• **Verify**: [API endpoint URL]

Historical data sourced from [Provider]'s archives."
```

## 📋 **Type Definition Explanations for Users**

### **When to Explain Types**

AI agents should explain type definitions when:
- Users ask about plugin capabilities
- Developers request integration details
- Users want to understand data structure
- Troubleshooting integration issues

### **Type Explanation Templates**

#### Plugin Structure:
```typescript
// Explain to users:
"This plugin provides 7 tools total:

📊 **Oracle Tools (4):**
• chainlink_get_crypto_price - Real-time prices
• chainlink_get_historical_price - Historical data  
• chainlink_get_multiple_prices - Batch requests
• chainlink_get_price_statistics - Market analytics

🏢 **Enterprise Actions (3):**
• check_proof_of_reserve - Asset verification
• get_ccip_message_status - Cross-chain tracking
• fetch_enterprise_metric - Business metrics

Each tool returns structured data with transparency information."
```

#### Transparency Object Structure:
```typescript
// Explain to users:
"Every operation returns transparency details in this format:

{
  blockchainOperation: {
    type: "operation_type",           // What operation was performed
    network: "testnet|mainnet",       // Which Hedera network
    contractAddress: "0x...",         // Smart contract used (if any)
    hbarFee: 0.00001,                // Cost in HBAR
    verificationUrl: "hashscan.io/...", // Verification link
    timestamp: "2024-11-25T...",      // When operation occurred
    details: {                        // Additional context
      roundId: "12345",              // Oracle round (if applicable)
      oracleUpdatedAt: "...",        // Oracle last update
      // ... more details
    }
  }
}

This ensures complete transparency about what your agent did."
```

## 🎯 **Integration Examples**

### **Full Integration Example**

```javascript
// AI Agent Implementation Example
async function handleCryptoPriceQuery(userQuery) {
  // Parse user intent
  const { asset, currency } = parseQuery(userQuery);
  
  // Execute plugin tool
  const result = await agent.run('chainlink_get_crypto_price', {
    base: asset,
    quote: currency
  });
  
  // Format response with transparency
  const response = formatPriceResponse(result);
  
  return response;
}

function formatPriceResponse(result) {
  let response = `${result.base} is currently $${result.price} ${result.quote}.\n\n`;
  
  // Always include transparency information
  const op = result.blockchainOperation;
  response += "🔍 **Operation Details:**\n";
  response += `• **Source**: ${result.source}\n`;
  response += `• **Network**: Hedera ${op.network}\n`;
  
  if (op.contractAddress) {
    response += `• **Contract**: ${op.contractAddress}\n`;
    response += `• **Oracle Round**: #${op.details?.roundId || 'N/A'}\n`;
    response += `• **Last Updated**: ${op.details?.oracleUpdatedAt || 'N/A'}\n`;
  }
  
  if (op.hbarFee) {
    response += `• **HBAR Fee**: ${op.hbarFee} HBAR\n`;
  }
  
  if (op.verificationUrl) {
    response += `• **Verify**: ${op.verificationUrl}\n`;
  }
  
  response += `• **Timestamp**: ${op.timestamp}\n\n`;
  
  // Add explanation
  if (op.contractAddress) {
    response += "This price comes from Chainlink's decentralized oracle network on Hedera, ensuring accuracy and reliability.";
  } else {
    response += `Price sourced from ${op.details?.provider || 'API'} as backup when smart contracts are unavailable.`;
  }
  
  return response;
}
```

## 🚨 **Common Mistakes to Avoid**

### **❌ Don't Do This:**

```javascript
// BAD: Hiding transparency information
async function badPriceHandler() {
  const result = await agent.run('chainlink_get_crypto_price', params);
  return `Price is $${result.price}`; // Missing transparency details!
}

// BAD: Ignoring costs
function badResponseFormat(result) {
  return `HBAR: $${result.price}`;
  // User has no idea this cost HBAR or used a smart contract!
}

// BAD: No verification information
function incompleteResponse(result) {
  return `Current price: $${result.price}\nSource: ${result.source}`;
  // No way for user to verify the data independently!
}
```

### **✅ Always Do This:**

```javascript
// GOOD: Complete transparency presentation
async function goodPriceHandler() {
  const result = await agent.run('chainlink_get_crypto_price', params);
  
  return formatCompleteResponse(result);
  // Includes all transparency, costs, and verification info
}

// GOOD: Educational explanations
function educationalResponse(result) {
  let response = `Price: $${result.price}\n\n`;
  response += "🎓 **What Just Happened:**\n";
  response += "Your agent queried a Chainlink oracle smart contract on Hedera. ";
  response += "This ensures the price data is decentralized and tamper-proof. ";
  response += `The operation cost ${result.blockchainOperation.hbarFee} HBAR in network fees.\n\n`;
  response += `Verify this operation: ${result.blockchainOperation.verificationUrl}`;
  
  return response;
}
```

## 🔧 **Developer Integration Checklist**

When integrating this plugin with AI agents:

- [ ] ✅ System prompt includes transparency requirements
- [ ] ✅ All responses explain operation costs (HBAR fees)
- [ ] ✅ Verification links are provided to users
- [ ] ✅ Data sources are clearly explained
- [ ] ✅ Network context (testnet/mainnet) is mentioned
- [ ] ✅ Smart contract addresses are shown when available
- [ ] ✅ Oracle round IDs and update times are included
- [ ] ✅ Fallback API usage is explained when it occurs
- [ ] ✅ Users understand how to verify operations independently
- [ ] ✅ Type definitions are available for developers

## 📊 **Testing Transparency Presentation**

### **Test Cases**

```javascript
// Test 1: Smart Contract Success
const testSmartContract = await agent.run('chainlink_get_crypto_price', {
  base: 'HBAR',
  quote: 'USD'
});

// Verify response includes:
assert(testSmartContract.blockchainOperation.contractAddress);
assert(testSmartContract.blockchainOperation.hbarFee);
assert(testSmartContract.blockchainOperation.verificationUrl);

// Test 2: API Fallback
const testFallback = await agent.run('chainlink_get_crypto_price', {
  base: 'UNSUPPORTED',
  quote: 'USD'
});

// Verify response explains fallback:
assert(testFallback.blockchainOperation.type.includes('api'));
assert(testFallback.blockchainOperation.details.reason);

// Test 3: Enterprise Action
const testPoR = await agent.run('check_proof_of_reserve', {
  feedAddress: '0x1234...'
});

// Verify enterprise transparency:
assert(testPoR.blockchainOperation.details.function);
assert(testPoR.blockchainOperation.details.rpcProvider);
```

## 🎯 **Advanced Usage**

### **Custom Transparency Formatting**

```typescript
interface TransparencyFormatter {
  formatForUser(operation: BlockchainOperation): string;
  formatForDeveloper(operation: BlockchainOperation): string;
  formatForAudit(operation: BlockchainOperation): string;
}

class HederaTransparencyFormatter implements TransparencyFormatter {
  formatForUser(op: BlockchainOperation): string {
    return `
🔍 **What Your Agent Did:**
• Queried ${op.contractAddress ? 'smart contract' : 'API'} on ${op.network}
• Cost: ${op.hbarFee || 0} HBAR
• Verify: ${op.verificationUrl}
• Time: ${new Date(op.timestamp).toLocaleString()}
    `.trim();
  }
  
  formatForDeveloper(op: BlockchainOperation): string {
    return JSON.stringify(op, null, 2);
  }
  
  formatForAudit(op: BlockchainOperation): string {
    return `[${op.timestamp}] ${op.type} on ${op.network} - ${op.contractAddress || 'API'} - ${op.hbarFee || 0} HBAR`;
  }
}
```

## 🚀 **Ready-to-Use System Prompts**

### **Complete AI Agent System Prompt**

```
You are an AI agent with access to the Hedera Chainlink Oracle Plugin v2.2.0, which provides enterprise-grade cryptocurrency data and blockchain verification capabilities.

TRANSPARENCY REQUIREMENTS:
- Always explain blockchain operation details from the `blockchainOperation` field
- Mention HBAR costs when operations incur fees
- Provide verification links (HashScan URLs) for independent verification
- Explain data sources (smart contract vs API fallback)
- Clarify network context (Hedera testnet vs mainnet)

AVAILABLE TOOLS:
1. chainlink_get_crypto_price - Real-time crypto prices via Chainlink oracles
2. chainlink_get_historical_price - Historical price data
3. chainlink_get_multiple_prices - Batch price queries
4. chainlink_get_price_statistics - Market analytics
5. check_proof_of_reserve - Verify asset custody and reserves
6. get_ccip_message_status - Track cross-chain messages
7. fetch_enterprise_metric - Business metrics (FX rates, shipment tracking)

RESPONSE FORMAT:
When users ask for crypto prices, always include:
- Current price with timestamp
- Data source explanation (Chainlink oracle contract vs API)
- HBAR fee incurred (if any)
- Verification link for independent confirmation
- Oracle round information (if available)
- Educational context about decentralized oracles

Be helpful, accurate, and transparent about all blockchain operations.
```

This guide ensures AI agents properly showcase your plugin's valuable transparency features and help users understand the blockchain operations happening behind the scenes.