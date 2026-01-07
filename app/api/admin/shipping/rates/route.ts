import { NextRequest, NextResponse } from 'next/server';
import { getShippingRates, DEFAULT_RETURN_ADDRESS, type RateRequest } from '@/lib/stallion';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { toAddress, weight, length, width, height } = body;

        // Debug: log the request
        console.log('Get Rates Request:', JSON.stringify(body, null, 2));
        console.log('Stallion API URL:', process.env.STALLION_API_URL);
        console.log('Stallion Token configured:', !!process.env.STALLION_API_TOKEN);

        if (!toAddress || !weight) {
            return NextResponse.json({ error: 'Missing required fields: toAddress, weight' }, { status: 400 });
        }

        const rateRequest: RateRequest = {
            to_address: {
                name: toAddress.name || 'Recipient',
                street1: toAddress.street1,
                street2: toAddress.street2,
                city: toAddress.city,
                province_code: toAddress.provinceCode || toAddress.state,
                postal_code: toAddress.postalCode || toAddress.zip,
                country_code: toAddress.countryCode || 'US',
                phone: toAddress.phone,
            },
            return_address: DEFAULT_RETURN_ADDRESS,
            package: {
                weight_kg: parseFloat(weight),
                length_cm: length ? parseFloat(length) : undefined,
                width_cm: width ? parseFloat(width) : undefined,
                height_cm: height ? parseFloat(height) : undefined,
            },
        };

        console.log('Stallion Rate Request:', JSON.stringify(rateRequest, null, 2));

        const rates = await getShippingRates(rateRequest);

        console.log('Rates received:', rates.length);
        return NextResponse.json({ rates });
    } catch (error: any) {
        console.error('Get rates error:', error);
        return NextResponse.json({ error: error.message || 'Failed to get shipping rates' }, { status: 500 });
    }
}
