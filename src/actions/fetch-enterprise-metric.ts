// src/actions/fetch-enterprise-metric.ts
import { z } from "zod";
import { Client } from "@hashgraph/sdk";

// Enterprise metric types
const ENTERPRISE_METRIC_TYPES = ["fx", "shipment"] as const;

export const fetchEnterpriseMetricParameters = z.object({
  type: z.enum(ENTERPRISE_METRIC_TYPES).describe("Metric type: 'fx' for foreign exchange rates, 'shipment' for logistics tracking"),
  id: z.string().describe("Metric identifier (currency pair for FX, tracking number for shipment)"),
});

const fetchEnterpriseMetricPrompt = `
Fetches enterprise metrics via HTTP API calls for business operations.

Parameters:
- type: Metric type ('fx' for foreign exchange rates, 'shipment' for logistics tracking)
- id: Identifier (e.g., 'USD/EUR' for FX, 'TRK123456' for shipment tracking)

Returns comprehensive metric data including current values, timestamps, and metadata.
`;

// FX Rate API Configuration
const FX_API_CONFIG = {
  baseUrl: 'https://api.exchangerate-api.com/v4/latest',
  fallbackUrl: 'https://api.fixer.io/latest',
  timeout: 10000
};

// Shipment Tracking API Configuration  
const SHIPMENT_API_CONFIG = {
  baseUrl: 'https://api.trackingmore.com/v3/trackings',
  timeout: 15000
};

interface FXResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface ShipmentResponse {
  data: {
    tracking_number: string;
    carrier_code: string;
    status: string;
    origin_info: {
      country: string;
      state?: string;
      city?: string;
    };
    destination_info: {
      country: string;
      state?: string;
      city?: string;
    };
    tracking_detail: Array<{
      checkpoint_date: string;
      tracking_detail: string;
      location: string;
    }>;
    transit_time: number;
    stay_time: number;
  };
}

async function fetchFXRate(currencyPair: string): Promise<any> {
  try {
    // Parse currency pair (e.g., "USD/EUR" or "USD-EUR")
    const [baseCurrency, targetCurrency] = currencyPair.toUpperCase().split(/[\/\-_]/);
    
    if (!baseCurrency || !targetCurrency) {
      throw new Error("Invalid currency pair format. Use format like 'USD/EUR' or 'USD-EUR'");
    }

    console.log(`💱 Fetching FX rate: ${baseCurrency} → ${targetCurrency}`);

    // Primary API call
    const response = await fetch(
      `${FX_API_CONFIG.baseUrl}/${baseCurrency}`,
      { 
        signal: AbortSignal.timeout(FX_API_CONFIG.timeout),
        headers: {
          'User-Agent': 'Hedera-Chainlink-Agent-Kit/2.1.0',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`FX API request failed with status: ${response.status}`);
    }

    const data: FXResponse = await response.json();
    
    if (!data.rates || !data.rates[targetCurrency]) {
      throw new Error(`Exchange rate not available for ${baseCurrency}/${targetCurrency}`);
    }

    const rate = data.rates[targetCurrency];
    const inverseRate = 1 / rate;

    return {
      type: "fx",
      currencyPair: `${baseCurrency}/${targetCurrency}`,
      baseCurrency,
      targetCurrency,
      rate: Number(rate.toFixed(6)),
      inverseRate: Number(inverseRate.toFixed(6)),
      lastUpdated: data.date,
      source: "exchangerate-api",
      timestamp: new Date().toISOString(),
      metadata: {
        allRates: Object.keys(data.rates).length,
        baseDate: data.date,
        apiVersion: "v4"
      }
    };

  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      throw new Error(`FX API request timed out after ${FX_API_CONFIG.timeout}ms`);
    }
    throw new Error(`FX rate fetch failed: ${error.message}`);
  }
}

async function fetchShipmentTracking(trackingNumber: string): Promise<any> {
  try {
    console.log(`📦 Fetching shipment tracking: ${trackingNumber}`);

    // Mock shipment tracking (replace with real API when available)
    // Real implementation would use TrackingMore, AfterShip, or similar service
    const mockCarriers = ['UPS', 'FedEx', 'DHL', 'USPS'];
    const mockStatuses = ['in_transit', 'delivered', 'out_for_delivery', 'exception'];
    const mockLocations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX'];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock tracking data based on tracking number
    const trackingHash = trackingNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const carrier = mockCarriers[trackingHash % mockCarriers.length];
    const status = mockStatuses[trackingHash % mockStatuses.length];
    const currentLocation = mockLocations[trackingHash % mockLocations.length];
    
    const trackingDetail = [
      {
        checkpoint_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        tracking_detail: "Package received at origin facility",
        location: "Origin Facility"
      },
      {
        checkpoint_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        tracking_detail: "In transit to destination facility",
        location: "Transit Hub"
      },
      {
        checkpoint_date: new Date(Date.now() - 86400000).toISOString(),
        tracking_detail: `Package arrived at ${currentLocation}`,
        location: currentLocation
      }
    ];

    return {
      type: "shipment",
      trackingNumber,
      carrier,
      status,
      currentLocation,
      estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      trackingHistory: trackingDetail,
      transitDays: 3,
      source: "mock-tracking-service",
      timestamp: new Date().toISOString(),
      metadata: {
        trackingUrl: `https://tracking.example.com/${trackingNumber}`,
        serviceType: "standard",
        weight: "2.5kg",
        dimensions: "30x20x15cm"
      }
    };

  } catch (error: any) {
    throw new Error(`Shipment tracking failed: ${error.message}`);
  }
}

export async function fetchEnterpriseMetricExecute(
  client: Client,
  context: any,
  params: z.infer<typeof fetchEnterpriseMetricParameters>
) {
  try {
    const { type, id } = params;

    console.log(`🏢 Fetching enterprise metric: ${type} - ${id}`);

    let result;

    switch (type) {
      case 'fx':
        result = await fetchFXRate(id);
        break;
      
      case 'shipment':
        result = await fetchShipmentTracking(id);
        break;
      
      default:
        throw new Error(`Unsupported metric type: ${type}. Supported types: ${ENTERPRISE_METRIC_TYPES.join(', ')}`);
    }

    return {
      ...result,
      requestId: `${type}-${id}-${Date.now()}`,
      processingTime: new Date().toISOString()
    };

  } catch (error: any) {
    if (error.message.includes("Invalid currency pair")) {
      throw error; // Re-throw validation errors
    } else if (error.message.includes("timeout")) {
      throw new Error(`Enterprise metric API timeout: ${error.message}`);
    } else if (error.message.includes("network")) {
      throw new Error(`Network connection failed: ${error.message}`);
    } else {
      throw new Error(`Enterprise metric fetch failed: ${error.message}`);
    }
  }
}

export const FETCH_ENTERPRISE_METRIC = "fetch_enterprise_metric";

export const fetchEnterpriseMetricTool = {
  method: FETCH_ENTERPRISE_METRIC,
  name: "Enterprise: Fetch Business Metric",
  description: fetchEnterpriseMetricPrompt,
  parameters: fetchEnterpriseMetricParameters,
  execute: fetchEnterpriseMetricExecute,
};

export default fetchEnterpriseMetricTool;