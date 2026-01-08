import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createShipment, DEFAULT_RETURN_ADDRESS, type ShipmentRequest } from '@/lib/stallion';

// GET: Fetch orders ready to ship (status = COMPLETED)
export async function GET(request: Request) {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: 'COMPLETED'
            },
            include: {
                seller: { select: { contactEmail: true, name: true } },
                jobs: {
                    select: {
                        id: true,
                        status: true,
                        recipientName: true,
                        phone: true,
                        address1: true,
                        address2: true,
                        city: true,
                        state: true,
                        zip: true,
                        country: true,
                        sku: true,
                        qty: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            orders,
            isSandbox: process.env.STALLION_API_URL?.includes('sandbox'),
            apiUrl: process.env.STALLION_API_URL
        });
    } catch (error) {
        console.error("Shipping GET Error:", error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// POST: Create shipment via Stallion Express API
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, postageType, weight, length, width, height, packageContents, value, currency, hsCode, countryOfOrigin, customsDescription, recipientStreet1, recipientCity, recipientProvinceCode, recipientCountryCode, recipientPostalCode } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // Get order with job details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                jobs: {
                    select: {
                        recipientName: true,
                        phone: true,
                        address1: true,
                        address2: true,
                        city: true,
                        state: true,
                        zip: true,
                        country: true,
                    },
                    take: 1 // Use first job's address
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const job = order.jobs[0];
        if (!job) {
            return NextResponse.json({ error: 'No job found for this order' }, { status: 400 });
        }

        // Normalize country code to 2 characters
        const countryMap: Record<string, string> = {
            'canada': 'CA', 'ca': 'CA',
            'united states': 'US', 'usa': 'US', 'us': 'US',
            'mexico': 'MX', 'mx': 'MX',
        };
        const rawCountry = (job.country || 'US').toLowerCase().trim();
        const countryCode = countryMap[rawCountry] || rawCountry.substring(0, 2).toUpperCase();

        // Build Stallion shipment request (FLAT structure for v4 API)
        const shipmentRequest: ShipmentRequest = {
            to_address: {
                name: job.recipientName || 'Recipient',
                // Use admin-corrected values instead of potentially incorrect job data
                address1: recipientStreet1 || job.address1 || '',
                address2: job.address2 || undefined,
                city: recipientCity || job.city || '',
                province_code: recipientProvinceCode || job.state || '',
                postal_code: recipientPostalCode || job.zip || '',
                country_code: recipientCountryCode || countryCode,
                phone: job.phone || undefined,
            },
            return_address: DEFAULT_RETURN_ADDRESS,
            // Package fields at TOP LEVEL
            weight: parseFloat(weight) || 0.5,
            weight_unit: 'kg',
            length: length ? parseFloat(length) : undefined,
            width: width ? parseFloat(width) : undefined,
            height: height ? parseFloat(height) : undefined,
            size_unit: 'cm',
            // Shipping
            postage_type: postageType || 'usps_ground_advantage',
            // Customs
            package_contents: packageContents || 'Merchandise',
            value: parseFloat(value) || 10,
            currency: currency || 'CAD',
            hs_code: hsCode || undefined,
            country_of_origin: countryOfOrigin || undefined,
            customs_description: customsDescription || undefined,
            // Reference
            reference: order.orderCode,
            description: `Order ${order.orderCode}`,
        };

        console.log('Stallion Shipment Request:', JSON.stringify(shipmentRequest, null, 2));

        // Call Stallion Express API
        const shipment = await createShipment(shipmentRequest, orderId);

        // Update order with tracking info
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'SHIPPED',
                trackingNumber: shipment.tracking_number,
                carrier: 'Stallion Express',
            }
        });

        // Also create a Shipment record if the model exists
        try {
            await prisma.shipment.create({
                data: {
                    orderId: orderId,
                    carrier: 'Stallion Express',
                    trackingNumber: shipment.tracking_number,
                    labelPdfUrl: shipment.label_url,
                    status: 'LABEL_PRINTED',
                }
            });
        } catch (e) {
            // Shipment model might not exist, continue anyway
            console.log('Could not create Shipment record:', e);
        }

        return NextResponse.json({
            success: true,
            shipCode: shipment.ship_code,
            trackingNumber: shipment.tracking_number,
            labelUrl: shipment.label_url,
            totalPrice: shipment.total_price,
            order: updatedOrder,
        });
    } catch (error: any) {
        console.error("Shipping POST Error:", error);
        return NextResponse.json({
            error: error.message || 'Failed to create shipment'
        }, { status: 500 });
    }
}
