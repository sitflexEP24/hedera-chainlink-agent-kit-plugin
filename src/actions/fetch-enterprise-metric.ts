// src/actions/fetch-enterprise-metric.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";
import { createAPITransparencyInfo } from "../utils/transparency.js";
import { Tool, OperationResult } from "../types/plugin.js";

const METRIC_TYPES = ["fx", "shipment"] as const;

const parameters = z.object({
  type: z.enum(METRIC_TYPES).describe("Metric type: 'fx' for foreign exchange rates, 'shipment' for logistics tracking"),
  id: z.string().describe("Metric identifier (currency pair for FX, tracking number for shipment)"),
});

async function fetchFXRate(currencyPair: string) {
  const [base, target] = currencyPair.toUpperCase().split(/[\/\-_]/);
  if (!base || !target) {
    throw new Error("Invalid currency pair format. Use 'USD/EUR' or 'USD-EUR'");
  }

  const url = `https://api.exchangerate-api.com/v4/latest/${base}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Hedera-Chainlink-Agent-Kit/2.1.0' },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Exchange rate API failed: ${response.status}`);
  }

  const data = await response.json();
  const rate = data.rates?.[target];

  if (!rate) {
    throw new Error(`Rate not available for ${base}/${target}`);
  }

  return {
    type: "fx",
    currencyPair: `${base}/${target}`,
    baseCurrency: base,
    targetCurrency: target,
    rate: Number(rate.toFixed(6)),
    inverseRate: Number((1 / rate).toFixed(6)),
    lastUpdated: data.date,
    source: "exchangerate-api"
  };
}

async function fetchShipmentTracking(trackingNumber: string) {
  // Mock implementation - replace with real tracking service
  const mockData = {
    carriers: ['UPS', 'FedEx', 'DHL', 'USPS'],
    statuses: ['in_transit', 'delivered', 'out_for_delivery', 'exception'],
    locations: ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX']
  };

  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

  const hash = trackingNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const carrier = mockData.carriers[hash % mockData.carriers.length];
  const status = mockData.statuses[hash % mockData.statuses.length];
  const location = mockData.locations[hash % mockData.locations.length];

  return {
    type: "shipment",
    trackingNumber,
    carrier,
    status,
    currentLocation: location,
    estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
    transitDays: 3,
    source: "mock-tracking-service",
    trackingHistory: [
      {
        date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        event: "Package received at origin",
        location: "Origin Facility"
      },
      {
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        event: "In transit to destination",
        location: "Transit Hub"
      },
      {
        date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        event: `Arrived at ${location}`,
        location
      }
    ]
  };
}

async function execute(client: Client, context: any, params: z.infer<typeof parameters>): Promise<OperationResult> {
  const { type, id } = params;

  let result;
  let transparency;

  switch (type) {
    case 'fx':
      result = await fetchFXRate(id);
      transparency = createAPITransparencyInfo(
        'https://api.exchangerate-api.com/v4/latest',
        'forex_rate_api',
        { provider: 'ExchangeRate-API', pair: id, timeout: 10000 }
      );
      break;
      
    case 'shipment':
      result = await fetchShipmentTracking(id);
      transparency = createAPITransparencyInfo(
        'mock_tracking_service',
        'shipment_tracking_api',
        { provider: 'Mock Service', trackingNumber: id, note: 'Replace with real API' }
      );
      break;
      
    default:
      throw new Error(`Unsupported metric type: ${type}`);
  }

  return {
    ...result,
    requestId: `${type}-${id}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    blockchainOperation: transparency
  };
}

export const FETCH_ENTERPRISE_METRIC = "fetch_enterprise_metric";

export const fetchEnterpriseMetricTool: Tool = {
  method: FETCH_ENTERPRISE_METRIC,
  name: "Enterprise: Fetch Business Metric",
  description: "Fetches enterprise metrics via HTTP APIs (FX rates, shipment tracking)",
  parameters,
  execute,
};

export default fetchEnterpriseMetricTool;