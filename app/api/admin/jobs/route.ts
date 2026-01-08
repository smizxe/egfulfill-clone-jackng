import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');

    const where: any = {};
    if (status) {
        where.status = { in: status.split(',') };
    }
    if (orderId) {
        where.orderId = orderId;
    }

    try {
        const jobs = await prisma.job.findMany({
            where,
            include: { order: true, tokens: true, assignedStaff: { select: { email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(jobs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
}
