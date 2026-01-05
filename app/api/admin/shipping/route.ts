import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: 'READY_TO_SHIP'
            },
            include: {
                user: { select: { email: true } },
                jobs: { select: { id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const { orderId, trackingNumber } = body;

    try {
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'SHIPPED',
                trackingId: trackingNumber
            }
        });

        // Trigger shipping notification (Placeholder)
        // sendEmail(updatedOrder.user.email, trackingNumber);

        return NextResponse.json(updatedOrder);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to ship order' }, { status: 500 });
    }
}
