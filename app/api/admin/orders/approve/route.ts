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
                // 1. Deduct Wallet Balance
                await tx.wallet.update({
                    where: { sellerId: order.sellerId },
                    data: { balance: { decrement: order.totalAmount } }
                });

                // 2. Create Ledger Entry (DEBIT = charge)
                await tx.walletLedger.create({
                    data: {
                        sellerId: order.sellerId,
                        type: 'DEBIT',
                        amount: order.totalAmount,
                        refType: 'ORDER',
                        refId: order.id,
                        note: `Payment for Order ${order.orderCode}`
                    }
                });

                // 3. Update Order and Jobs to RECEIVED
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'RECEIVED' }
                });

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

                // 2. NO wallet refund needed - balance was never deducted during import
                // (Deduction only happens on APPROVE)

                // 3. Revert Inventory Reservation
                for (const job of order.jobs) {
                    const invColor = job.color || "";
                    const invSize = job.size || "";
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
