import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { orderId, action, reason } = await request.json(); // action: 'APPROVE' | 'REJECT'

        if (!orderId || !action) {
            return NextResponse.json({ error: 'Missing orderId or action' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { jobs: true } // Need job details to potentially revert inventory?
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status !== 'PENDING_APPROVAL') {
            return NextResponse.json({ error: 'Order is not pending approval' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            if (action === 'APPROVE') {
                // Update Order and Jobs to RECEIVED
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'RECEIVED' }
                });

                // Batch update jobs
                await tx.job.updateMany({
                    where: { orderId: orderId },
                    data: { status: 'RECEIVED' }
                });

                return { success: true, status: 'RECEIVED' };

            } else if (action === 'REJECT') {
                // 1. Update Status
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'REJECTED' }
                });
                await tx.job.updateMany({
                    where: { orderId: orderId },
                    data: { status: 'REJECTED' }
                });

                // 2. Refund Wallet
                await tx.wallet.update({
                    where: { sellerId: order.sellerId },
                    data: { balance: { increment: order.totalAmount } }
                });

                // 3. Ledger Entry
                await tx.walletLedger.create({
                    data: {
                        sellerId: order.sellerId,
                        type: 'CREDIT', // Refund is a credit
                        amount: order.totalAmount,
                        refType: 'ORDER',
                        refId: order.id,
                        note: `Refund for Rejected Order ${order.orderCode}. Reason: ${reason || 'N/A'}`
                    }
                });

                // 4. Revert Inventory Reservation?
                // Yes, if we reserved on Import, we should unreserve now.
                for (const job of order.jobs) {
                    const invColor = job.color || "";
                    const invSize = job.size || "";
                    // Be careful with unique constraint, use loop or batch if possible.
                    // Doing loop is safest for logic.
                    await tx.inventoryItem.update({
                        where: {
                            sku_color_size: {
                                sku: job.sku,
                                color: invColor,
                                size: invSize
                            }
                        },
                        data: {
                            reserved: { decrement: job.qty }
                        }
                    });
                }

                return { success: true, status: 'REJECTED' };
            } else {
                throw new Error('Invalid action');
            }
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Approval Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
