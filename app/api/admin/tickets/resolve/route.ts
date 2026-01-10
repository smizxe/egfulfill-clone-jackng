import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { ticketId, decision } = await request.json(); // decision: 'APPROVE' | 'REJECT' | 'REFUND' | 'REPLACEMENT'

        if (!ticketId || !decision) {
            return NextResponse.json({ error: 'Missing ticketId or decision' }, { status: 400 });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { order: true, user: { include: { seller: { include: { wallet: true } } } } }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Logic branching
        // General Status mapping:
        // APPROVE -> RESOLVED
        // REJECT -> REJECTED (Closed)
        // REFUND -> RESOLVED (resolutionType: REFUND)
        // REPLACEMENT -> RESOLVED (resolutionType: REPLACEMENT)

        await prisma.$transaction(async (tx) => {
            if (decision === 'REFUND') {
                if (!ticket.order) {
                    throw new Error('No order associated with this ticket');
                }
                const refundAmount = ticket.order.totalAmount || 0;
                const sellerId = ticket.user?.seller?.id;
                const walletId = ticket.user?.seller?.wallet?.id;

                if (!sellerId || !walletId) {
                    throw new Error('Seller wallet not found');
                }

                // 1. Credit Wallet
                await tx.wallet.update({
                    where: { id: walletId },
                    data: { balance: { increment: refundAmount } }
                });

                // 2. Create Transaction Record (WalletLedger)
                await tx.walletLedger.create({
                    data: {
                        sellerId: sellerId,
                        type: 'REFUND',
                        amount: refundAmount,
                        currency: 'USD',
                        refType: 'ORDER_REFUND',
                        refId: ticket.order.orderCode,
                        note: `Refund for Order #${ticket.order.orderCode} (Ticket #${ticket.id})`,
                        createdBy: 'ADMIN'
                    }
                });

                // 3. Update Order Status
                await tx.order.update({
                    where: { id: ticket.order.id },
                    data: { status: 'REFUNDED' }
                });

                // 4. Update Jobs Status
                await tx.job.updateMany({
                    where: { orderId: ticket.order.id },
                    data: { status: 'REFUNDED' }
                });

                // 5. Update Ticket
                await tx.ticket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'RESOLVED',
                        resolutionType: 'REFUND'
                    }
                });

            } else if (decision === 'REPLACEMENT') {
                // Order creation handled by Import Modal separately. 
                // Here we just mark ticket as resolved via Replacement.
                await tx.ticket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'RESOLVED',
                        resolutionType: 'REPLACEMENT'
                    }
                });
            } else if (decision === 'REJECT') {
                await tx.ticket.update({
                    where: { id: ticketId },
                    data: { status: 'REJECTED' }
                });
            } else {
                // 'APPROVE' (General Resolve)
                await tx.ticket.update({
                    where: { id: ticketId },
                    data: { status: 'RESOLVED' }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Ticket Resolve Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to resolve ticket' }, { status: 500 });
    }
}
