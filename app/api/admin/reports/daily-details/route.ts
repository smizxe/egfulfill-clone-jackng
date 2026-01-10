import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get('date');

        if (!dateParam) {
            return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
        }

        const targetDate = dayjs(dateParam);
        const startOfDay = targetDate.startOf('day').toDate();
        const endOfDay = targetDate.endOf('day').toDate();

        // 1. Fetch Orders created on this day
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                seller: {
                    select: {
                        name: true,
                        code: true,
                    }
                },
                _count: {
                    select: { jobs: true } // Item count usually corresponds to jobs in this system
                }
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        // 2. Fetch Wallet Transactions on this day
        const transactions = await prisma.walletLedger.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                seller: {
                    select: {
                        name: true,
                        code: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        return NextResponse.json({
            orders,
            transactions,
        });

    } catch (error) {
        console.error('Error fetching daily details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
