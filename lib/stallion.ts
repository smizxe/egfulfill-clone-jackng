/**
 * Stallion Express API Service
 * Documentation: https://stallionexpress.redocly.app/stallionexpress-v4
 */

const STALLION_API_URL = process.env.STALLION_API_URL || 'https://ship.stallionexpress.ca/api/v4';
const STALLION_API_TOKEN = process.env.STALLION_API_TOKEN || '';

interface StallionAddress {
    name: string;
    company?: string;
    address1: string;  // Stallion v4 uses address1, not street1
    address2?: string;
    city: string;
    province_code: string;
    postal_code: string;
    country_code: string;
    phone?: string;
    email?: string;
}

// Stallion v4 uses FLAT structure - no nested package object
interface ShipmentRequest {
    to_address: StallionAddress;
    return_address: StallionAddress;
    // Package fields (TOP LEVEL, not nested)
    weight: number;
    weight_unit: 'kg' | 'lb' | 'oz';
    length?: number;
    width?: number;
    height?: number;
    size_unit?: 'cm' | 'in';
    // Shipping
    postage_type: string;
    // Customs
    package_contents?: string;
    value?: number;
    currency?: string;
    hs_code?: string;
    country_of_origin?: string;
    customs_description?: string;
    // Reference
    reference?: string;
    description?: string;
}

interface RateRequest {
    to_address: StallionAddress;
    return_address: StallionAddress;
    // Package fields (TOP LEVEL)
    weight: number;
    weight_unit: 'kg' | 'lb' | 'oz';
    length?: number;
    width?: number;
    height?: number;
    size_unit?: 'cm' | 'in';
    // Customs
    package_contents?: string;
    value?: number;
    currency?: string;
    hs_code?: string;
    country_of_origin?: string;
    customs_description?: string;
}

interface StallionRate {
    postage_type: string;
    postage_description: string;
    price: number;
    currency: string;
    estimated_delivery_days?: number;
}

interface StallionShipment {
    ship_code: string;
    tracking_number: string;
    label_url: string;
    postage_type: string;
    total_price: number;
    currency: string;
}

interface StallionTrackingEvent {
    status: string;
    description: string;
    location?: string;
    timestamp: string;
}

interface StallionTrackingResponse {
    ship_code: string;
    tracking_number: string;
    status: string;
    events: StallionTrackingEvent[];
}

async function stallionFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${STALLION_API_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${STALLION_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Stallion API Error:', response.status, errorBody);
        throw new Error(`Stallion API Error: ${response.status} - ${errorBody}`);
    }

    return response.json();
}

/**
 * Get shipping rates for a package
 */
export async function getShippingRates(request: RateRequest): Promise<StallionRate[]> {
    const result = await stallionFetch<{ rates: StallionRate[] }>('/rates', {
        method: 'POST',
        body: JSON.stringify(request),
    });
    return result.rates || [];
}

/**
 * Create a shipment and get the label
 */
export async function createShipment(request: ShipmentRequest, idempotencyKey?: string): Promise<StallionShipment> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    const result = await stallionFetch<StallionShipment>('/shipments', {
        method: 'POST',
        body: JSON.stringify(request),
        headers,
    });
    return result;
}

/**
 * Track a shipment by ship_code
 */
export async function trackShipment(shipCode: string): Promise<StallionTrackingResponse> {
    return stallionFetch<StallionTrackingResponse>(`/track?ship_code=${encodeURIComponent(shipCode)}`);
}

/**
 * Void/Cancel a shipment
 */
export async function voidShipment(shipCode: string): Promise<{ success: boolean; message: string }> {
    return stallionFetch<{ success: boolean; message: string }>(`/shipments/${encodeURIComponent(shipCode)}/void`);
}

// Export types for use in other files
export type {
    StallionAddress,
    ShipmentRequest,
    RateRequest,
    StallionRate,
    StallionShipment,
    StallionTrackingResponse,
    StallionTrackingEvent,
};

// Default return address (can be configured per seller later)
export const DEFAULT_RETURN_ADDRESS: StallionAddress = {
    name: 'emfulfill',
    company: 'emfulfill',
    address1: '123 Warehouse St', // TODO: Update with real address
    city: 'Toronto',
    province_code: 'ON',
    postal_code: 'M5V 1A1',
    country_code: 'CA',
    phone: '4161234567',
};
