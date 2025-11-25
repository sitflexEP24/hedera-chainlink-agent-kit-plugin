// DEVELOPER_SETUP.md
# Developer Setup Guide - Transparency & Type Safety

Quick setup instructions for developers integrating the Hedera Chainlink Oracle Plugin with proper transparency presentation.

## 🚀 **5-Minute Integration**

### **1. Install & Import**

```bash
npm install @fermindietze/hedera-chainlink-agent-kit-plugin hedera-agent-kit
```

```typescript
import { HederaAgentKit } from 'hedera-agent-kit';
import { chainlinkOraclePlugin } from '@fermindietze/hedera-chainlink-agent-kit-plugin';

const agent = new HederaAgentKit({
  accountId: "0.0.YOUR_ACCOUNT",
  privateKey: "YOUR_PRIVATE_KEY",
  network: "testnet"
});

agent.use(chainlinkOraclePlugin);
```

### **2. Enable Transparency in Your AI System Prompt**

```typescript
const SYSTEM_PROMPT = `
You have access to Hedera Chainlink Oracle tools. 

CRITICAL: Always explain blockchain operation details to users:
- Show HBAR costs when operations occur
- Provide verification links (HashScan URLs)
- Explain data sources (smart contract vs API)
- Include network context (testnet/mainnet)

When users ask for crypto prices, format responses like:
"HBAR is $0.28 USD.

🔍 Operation Details:
• Source: Chainlink Smart Contract on Hedera Testnet
• Contract: 0x59bC155...
• HBAR Fee: 0.00001 HBAR
• Verify: https://hashscan.io/testnet/contract/0x59bC155..."
`;
```

### **3. Extract & Present Transparency Data**

```typescript
// ✅ ALWAYS do this in your AI agent response handler
async function handlePriceQuery(userMessage: string) {
  const result = await agent.run('chainlink_get_crypto_price', {
    base: 'HBAR',
    quote: 'USD'
  });
  
  // Extract transparency information
  const transparency = result.blockchainOperation;
  
  // Format user-friendly response
  let response = `HBAR is currently $${result.price} USD.\n\n`;
  response += formatTransparency(transparency);
  
  return response;
}

function formatTransparency(op: any): string {
  return `
🔍 **Operation Details:**
• **Network**: Hedera ${op.network}
• **Source**: ${op.contractAddress ? 'Smart Contract' : 'API Fallback'}
${op.contractAddress ? `• **Contract**: ${op.contractAddress}` : ''}
${op.hbarFee ? `• **HBAR Fee**: ${op.hbarFee} HBAR` : ''}
${op.verificationUrl ? `• **Verify**: ${op.verificationUrl}` : ''}
• **Timestamp**: ${new Date(op.timestamp).toLocaleString()}
  `.trim();
}
```

## 📋 **Type Definitions Reference**

### **Quick Type Guide**

```typescript
// Main plugin interface
interface Plugin {
  name: string;
  version: string;
  tools: (context?: Context) => Tool[];
}

// Every operation returns this structure
interface OperationResult {
  // Tool-specific data (price, reserves, etc.)
  [key: string]: any;
  
  // ALWAYS present - transparency information
  blockchainOperation?: {
    type: string;                    // Operation type
    network: 'testnet' | 'mainnet'; // Hedera network
    contractAddress?: string;        // Smart contract (if used)
    hbarFee?: number;               // Cost in HBAR
    verificationUrl?: string;        // HashScan link
    timestamp: string;              // ISO timestamp
    details?: Record<string, any>;  // Additional context
  };
}
```

### **Available Tools Quick Reference**

```typescript
type ToolMethods = 
  // Oracle Tools (4)
  | 'chainlink_get_crypto_price'      // Real-time prices
  | 'chainlink_get_historical_price'  // Historical data  
  | 'chainlink_get_multiple_prices'   // Batch requests
  | 'chainlink_get_price_statistics'  // Market analytics
  
  // Enterprise Actions (3)
  | 'check_proof_of_reserve'          // Asset verification
  | 'get_ccip_message_status'         // Cross-chain tracking
  | 'fetch_enterprise_metric';       // Business metrics
```

## ⚡ **Common Integration Patterns**

### **Pattern 1: Basic Price Query with Transparency**

```typescript
async function getPriceWithTransparency(asset: string, currency: string) {
  const result = await agent.run('chainlink_get_crypto_price', {
    base: asset,
    quote: currency
  });
  
  return {
    price: result.price,
    source: result.source,
    transparency: result.blockchainOperation,
    userMessage: `${asset} is $${result.price} ${currency}. ` +
      `Data from ${result.blockchainOperation.contractAddress ? 'Chainlink oracle' : 'API backup'} ` +
      `on Hedera ${result.blockchainOperation.network}.`
  };
}
```

### **Pattern 2: Batch Operations with Cost Tracking**

```typescript
async function getBatchPricesWithCosts(pairs: Array<{base: string, quote: string}>) {
  const result = await agent.run('chainlink_get_multiple_prices', { pairs });
  
  const totalHbarCost = result.results.reduce((sum: number, r: any) => 
    sum + (r.blockchainOperation?.hbarFee || 0), 0);
  
  return {
    prices: result.results,
    summary: {
      successful: result.successCount,
      failed: result.errorCount,
      totalHbarCost,
      transparency: result.blockchainOperation
    }
  };
}
```

### **Pattern 3: Enterprise Action with Full Audit Trail**

```typescript
async function checkReservesWithAuditTrail(feedAddress: string) {
  try {
    const result = await agent.run('check_proof_of_reserve', { feedAddress });
    
    return {
      status: result.status,
      reserves: result.reserves,
      auditTrail: {
        operation: result.blockchainOperation,
        contractUsed: feedAddress,
        verificationSteps: [
          'Called latestRoundData() on PoR contract',
          'Retrieved decimal precision',
          'Calculated human-readable reserves',
          'Determined reserve status'
        ],
        costs: `${result.blockchainOperation.hbarFee || 0} HBAR`,
        verifyUrl: result.blockchainOperation.verificationUrl
      }
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message,
      note: 'Verify contract address and network availability'
    };
  }
}
```

## 🔧 **Integration Testing**

### **Test Transparency Presentation**

```typescript
// Test that your AI properly presents transparency
describe('Transparency Integration', () => {
  test('should include operation details in responses', async () => {
    const result = await agent.run('chainlink_get_crypto_price', {
      base: 'HBAR',
      quote: 'USD'
    });
    
    // Verify transparency data exists
    expect(result.blockchainOperation).toBeDefined();
    expect(result.blockchainOperation.type).toBeTruthy();
    expect(result.blockchainOperation.network).toMatch(/testnet|mainnet/);
    expect(result.blockchainOperation.timestamp).toBeTruthy();
  });
  
  test('should format user-friendly transparency', () => {
    const mockResult = {
      price: 0.28,
      blockchainOperation: {
        type: 'chainlink_price_feed',
        network: 'testnet',
        contractAddress: '0x59bC155...',
        hbarFee: 0.00001,
        timestamp: '2024-11-25T10:30:00Z'
      }
    };
    
    const formatted = formatTransparency(mockResult.blockchainOperation);
    
    expect(formatted).toContain('Hedera testnet');
    expect(formatted).toContain('Smart Contract');
    expect(formatted).toContain('0.00001 HBAR');
  });
});
```

## 📊 **Monitoring & Analytics**

### **Track Plugin Usage**

```typescript
interface PluginUsageMetrics {
  operationCounts: Record<string, number>;
  totalHbarSpent: number;
  smartContractVsApi: {
    smartContract: number;
    apiFallback: number;
  };
  networkUsage: {
    testnet: number;
    mainnet: number;
  };
}

class PluginUsageTracker {
  metrics: PluginUsageMetrics = {
    operationCounts: {},
    totalHbarSpent: 0,
    smartContractVsApi: { smartContract: 0, apiFallback: 0 },
    networkUsage: { testnet: 0, mainnet: 0 }
  };
  
  trackOperation(result: any) {
    const op = result.blockchainOperation;
    
    // Count operation types
    this.metrics.operationCounts[op.type] = 
      (this.metrics.operationCounts[op.type] || 0) + 1;
    
    // Track costs
    if (op.hbarFee) {
      this.metrics.totalHbarSpent += op.hbarFee;
    }
    
    // Track data sources
    if (op.contractAddress) {
      this.metrics.smartContractVsApi.smartContract++;
    } else {
      this.metrics.smartContractVsApi.apiFallback++;
    }
    
    // Track network usage
    this.metrics.networkUsage[op.network]++;
  }
}
```

## 🎯 **Production Checklist**

Before deploying with this plugin:

- [ ] ✅ System prompt includes transparency requirements
- [ ] ✅ All tool responses format transparency data for users  
- [ ] ✅ HBAR costs are clearly explained to users
- [ ] ✅ Verification links are provided (HashScan URLs)
- [ ] ✅ Smart contract vs API fallback is explained
- [ ] ✅ Network context (testnet/mainnet) is mentioned
- [ ] ✅ Error handling explains what went wrong
- [ ] ✅ Type definitions are properly imported
- [ ] ✅ Integration tests verify transparency presentation
- [ ] ✅ Usage metrics tracking is implemented

## 🚨 **Common Gotchas**

### **Issue 1: Missing Transparency**
```typescript
// ❌ Wrong - hides transparency
return `Price: $${result.price}`;

// ✅ Correct - shows transparency  
return `Price: $${result.price}\n\n${formatTransparency(result.blockchainOperation)}`;
```

### **Issue 2: No Cost Awareness**
```typescript
// ❌ Wrong - user doesn't know operation cost HBAR
return `HBAR price retrieved successfully`;

// ✅ Correct - explains cost
return `HBAR price retrieved (cost: ${result.blockchainOperation.hbarFee} HBAR)`;
```

### **Issue 3: Missing Verification**
```typescript
// ❌ Wrong - no way to verify
return `Data from smart contract`;

// ✅ Correct - provides verification
return `Data from smart contract ${result.blockchainOperation.contractAddress}. Verify: ${result.blockchainOperation.verificationUrl}`;
```

## 📚 **Additional Resources**

- **Plugin Repository**: https://github.com/sitflexEP24/hedera-chainlink-agent-kit-plugin
- **Hedera Agent Kit**: https://github.com/hashgraph/hedera-agent-kit-js  
- **Chainlink Documentation**: https://docs.chain.link/
- **HashScan Explorer**: https://hashscan.io/
- **Type Definitions**: See `AI_AGENT_INTEGRATION.md`

## 💡 **Next Steps**

1. Follow the 5-minute integration above
2. Test transparency presentation with your AI
3. Deploy with proper system prompts
4. Monitor usage metrics
5. Iterate based on user feedback

Your users will appreciate the transparency! 🚀