
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { orderId, recipientName, address1, address2, city, state, zip, country, phone, items } = body;

        // 1. Fetch existing order to validate status
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { jobs: true }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const allowedInfo = ['PENDING_APPROVAL', 'RECEIVED'];
        if (!allowedInfo.includes(existingOrder.status)) {
            return NextResponse.json({ error: 'Only pending or received orders can be edited' }, { status: 400 });
        }

        // 2. Transaction to update Order and Jobs
        await prisma.$transaction(async (tx) => {
            let statusUpdate = {};
            // If order was RECEIVED, revert to PENDING_APPROVAL
            if (existingOrder.status === 'RECEIVED') {
                statusUpdate = { status: 'PENDING_APPROVAL' };

                // Optional: Log this revert
                await tx.auditLog.create({
                    data: {
                        actorUserId: userId,
                        actorType: 'USER',
                        action: 'ORDER_REVERT',
                        entityType: 'ORDER',
                        entityId: orderId,
                        metaJson: JSON.stringify({ oldStatus: 'RECEIVED', newStatus: 'PENDING_APPROVAL', reason: 'User Edit' })
                    }
                });
            }

            // Update Order Details
            await tx.order.update({
                where: { id: orderId },
                data: {
                    shippingCountry: country,
                    ...statusUpdate
                }
            });

            // Recipient info mapping
            const recipientUpdate = {
                recipientName,
                address1,
                address2,
                city,
                state,
                zip,
                country,
                phone
            };

            let newTotalAmount = 0;
            const processedJobIds = new Set<string>();

            for (const item of items) {
                // Find product variant for price
                const product = await tx.product.findUnique({
                    where: { sku: item.sku },
                    include: { variants: true }
                });

                if (!product) throw new Error(`Product not found: ${item.sku}`);

                const variant = product.variants.find(v =>
                    (v.color?.toLowerCase() === (item.color || '').toLowerCase()) &&
                    (v.size?.toLowerCase() === (item.size || '').toLowerCase())
                );

                const priceToCharge = variant?.basePrice || 0;
                const lineCost = priceToCharge * item.qty;
                newTotalAmount += lineCost;

                if (item.id) {
                    // Update existing
                    processedJobIds.add(item.id);
                    const existingJob = existingOrder.jobs.find(j => j.id === item.id);
                    if (existingJob) {
                        // Inventory Diff
                        const qtyDiff = item.qty - existingJob.qty;
                        if (qtyDiff !== 0) {
                            await tx.inventoryItem.upsert({
                                where: { sku_color_size: { sku: existingJob.sku, color: existingJob.color || '', size: existingJob.size || '' } },
                                update: { reserved: { increment: qtyDiff } },
                                create: { sku: existingJob.sku, color: existingJob.color || '', size: existingJob.size || '', reserved: item.qty }
                            });
                        }

                        // Handle Design Updates
                        const designsData = [];
                        if (item.designUrl) {
                            designsData.push({
                                url: item.designUrl,
                                location: item.designPosition || 'Front',
                                position: item.designPosition || 'Front'
                            });
                        }
                        const designsJson = JSON.stringify(designsData);

                        await tx.job.update({
                            where: { id: item.id },
                            data: {
                                ...recipientUpdate,
                                sku: item.sku,
                                color: item.color,
                                size: item.size,
                                qty: item.qty,
                                priceToCharge: priceToCharge,
                                designs: designsJson,
                                status: (existingOrder.status === 'RECEIVED') ? 'PENDING_APPROVAL' : undefined
                            }
                        });
                    }
                }
            }

            // Update Order Total
            await tx.order.update({
                where: { id: orderId },
                data: {
                    totalAmount: newTotalAmount,
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Order Error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
