import { NextRequest, NextResponse } from 'next/server';
import { getShippingRates, DEFAULT_RETURN_ADDRESS, type RateRequest } from '@/lib/stallion';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { toAddress, weight, length, width, height, packageContents, value, currency, hsCode, countryOfOrigin, customsDescription } = body;

        // Debug: log the request
        console.log('Get Rates Request:', JSON.stringify(body, null, 2));
        console.log('Stallion API URL:', process.env.STALLION_API_URL);
        console.log('Stallion Token configured:', !!process.env.STALLION_API_TOKEN);

        if (!toAddress || !weight) {
            return NextResponse.json({ error: 'Missing required fields: toAddress, weight' }, { status: 400 });
        }

        // Use admin-provided country code directly if it's a valid 2-letter ISO code
        // Otherwise try to normalize common names
        const rawCountry = (toAddress.countryCode || toAddress.country || 'US').trim();
        let countryCode = rawCountry.toUpperCase();

        // Only apply normalization if it's not already a 2-letter code
        if (countryCode.length !== 2 || !/^[A-Z]{2}$/.test(countryCode)) {
            const countryMap: Record<string, string> = {
                'canada': 'CA', 'ca': 'CA',
                'united states': 'US', 'usa': 'US', 'us': 'US',
                'mexico': 'MX', 'mx': 'MX',
            };
            countryCode = countryMap[rawCountry.toLowerCase()] || rawCountry.substring(0, 2).toUpperCase();
        }

        const rateRequest: RateRequest = {
            to_address: {
                name: toAddress.name || 'Recipient',
                address1: toAddress.street1,
                address2: toAddress.street2,
                city: toAddress.city,
                province_code: toAddress.provinceCode || toAddress.state,
                postal_code: toAddress.postalCode || toAddress.zip,
                country_code: countryCode,
                phone: toAddress.phone,
            },
            return_address: DEFAULT_RETURN_ADDRESS,
            // Package fields at TOP LEVEL (Stallion v4 flat structure)
            weight: parseFloat(weight),
            weight_unit: 'kg',
            length: length ? parseFloat(length) : undefined,
            width: width ? parseFloat(width) : undefined,
            height: height ? parseFloat(height) : undefined,
            size_unit: 'cm',
            // Customs
            package_contents: packageContents || 'Merchandise',
            value: parseFloat(value) || 10,
            currency: currency || 'CAD',
            hs_code: hsCode || undefined,
            country_of_origin: countryOfOrigin || undefined,
            customs_description: customsDescription || undefined,
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
