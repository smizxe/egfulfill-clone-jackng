import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const where: any = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }

        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                user: { select: { email: true, id: true } },
                order: { select: { orderCode: true, id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(tickets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}
