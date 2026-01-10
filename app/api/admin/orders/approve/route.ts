import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, action, rejectionReason } = body; // action: 'APPROVE' | 'REJECT'

        if (!orderId || !action) {
            return NextResponse.json({ error: 'Order ID and action (APPROVE/REJECT) are required' }, { status: 400 });
        }

        const newStatus = action === 'APPROVE' ? 'PROCESSING' : 'REJECTED';

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
