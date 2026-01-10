
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '0');
    const year = parseInt(searchParams.get('year') || '2025');

    // Start and end of month
    const startOfMonth = dayjs().year(year).month(month).startOf('month').toDate();
    const endOfMonth = dayjs().year(year).month(month).endOf('month').toDate();

    try {
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            include: {
                jobs: true
            }
        });

        // Group by day
        const dailyMap = new Map<string, { orders: number, revenue: number, cost: number, profit: number }>();

        // Initialize all days in month? Or just days with data. Requirement "Tabular breakdown", usually implies all days or listed days.
        // Let's just list days with data for efficiency, or if they want to see empty days?
        // Let's populate map.

        orders.forEach(order => {
            const dayKey = dayjs(order.createdAt).format('YYYY-MM-DD');

            if (!dailyMap.has(dayKey)) {
                dailyMap.set(dayKey, { orders: 0, revenue: 0, cost: 0, profit: 0 });
            }

            const entry = dailyMap.get(dayKey)!;
            entry.orders += 1;
            entry.revenue += order.totalAmount;

            // Cost calculation (sum of jobs cogsActual)
            let orderCost = 0;
            if (order.jobs) {
                orderCost = order.jobs.reduce((sum, job) => sum + (job.cogsActual || 0), 0);
            }
            entry.cost += orderCost;
            entry.profit += (order.totalAmount - orderCost);
        });

        const result = Array.from(dailyMap.entries()).map(([date, stats]) => ({
            date,
            ...stats
        }));

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error fetching monthly financials:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
