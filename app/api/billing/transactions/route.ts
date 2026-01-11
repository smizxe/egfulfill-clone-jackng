import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dayjs from 'dayjs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const date = searchParams.get('date') || dayjs().toISOString();

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { seller: true }
    });

    if (!user || !user.seller) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    let startDate = dayjs(date);
    let endDate = dayjs(date);

    if (range === 'day') {
        startDate = dayjs(date).startOf('day');
        endDate = dayjs(date).endOf('day');
    } else if (range === 'month') {
        startDate = dayjs(date).startOf('month');
        endDate = dayjs(date).endOf('month');
    } else if (range === 'year') {
        startDate = dayjs(date).startOf('year');
        endDate = dayjs(date).endOf('year');
    }

    const transactions = await prisma.walletLedger.findMany({
        where: {
            sellerId: user.seller.id,
            createdAt: {
                gte: startDate.toDate(),
                lte: endDate.toDate()
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(transactions);
}
