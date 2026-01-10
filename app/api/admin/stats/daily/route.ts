
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Define start and end of the day in UTC or local? 
    // Prisma usually stores datetime in UTC. We interpret the date as day start/end.
    // Assuming dateStr is YYYY-MM-DD
    const startOfDay = dayjs(dateStr).startOf('day').toDate();
    const endOfDay = dayjs(dateStr).endOf('day').toDate();

    try {
        // 1. Fetch Orders within this range
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                seller: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

        // 2. Fetch Transactions (WalletLedger)
        const transactions = await prisma.walletLedger.findMany({
            where: { createdAt: { gte: startOfDay, lte: endOfDay } },
            orderBy: { createdAt: 'desc' },
            include: { seller: { select: { name: true } } }
        });

        // 3. Fetch Jobs (Releases)
        const dailyJobs = await prisma.job.findMany({
            where: { createdAt: { gte: startOfDay, lte: endOfDay } },
            orderBy: { createdAt: 'desc' },
            include: { order: { select: { orderCode: true } } }
        });

        // Calculate Cost (using associated Jobs)
        // We need to fetch jobs separately or include them? Include efficiently
        const orderIds = orders.map(o => o.id);
        const jobs = await prisma.job.findMany({
            where: { orderId: { in: orderIds } }
        });

        // Sum up costs: 
        // cogsActual if available, otherwise estimate or (priceToCharge * some_factor?)
        // Let's assume cogsActual is what we want if set, otherwise maybe 0 for now
        let totalCost = 0;
        jobs.forEach(j => {
            totalCost += (j.cogsActual || 0);
            // Also add shipping? Usually handled in totalAmount or part of cogs?
            // Requirement said "Shirt Cost" + "Shipping Cost".
            // cogsActual usually implies cost of goods.
            // If we don't have shipping cost recorded separately in DB, we might need to estimate or assuming it's part of cogs?
            // For now let's sum cogsActual.
        });

        // Shipping cost might be on the Order or Job?
        // Schema: Product.shippingRates, Order.totalAmount. 
        // We probably don't have exact shipping cost TO US recorded unless stored in cogsActual.
        // Let's stick to base cogs for now.

        const netProfit = totalRevenue - totalCost;

        return NextResponse.json({
            totalOrders,
            totalRevenue,
            totalCost,
            netProfit,
            orders: orders.map(o => ({
                id: o.id,
                orderCode: o.orderCode,
                status: o.status,
                totalAmount: o.totalAmount,
                seller: o.seller
            })),
            transactions,
            jobs: dailyJobs.map(j => ({
                id: j.id,
                status: j.status,
                order: j.order,
                jobCode: j.jobCode
            }))
        });

    } catch (error) {
        console.error('Error fetching daily stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
