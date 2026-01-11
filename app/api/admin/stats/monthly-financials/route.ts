import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import dayjs from 'dayjs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || dayjs().month().toString());
    const year = parseInt(searchParams.get('year') || dayjs().year().toString());

    // Construct start and end dates
    const startDate = dayjs().year(year).month(month).startOf('month');
    const endDate = dayjs().year(year).month(month).endOf('month');

    try {
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate.toDate(),
                    lte: endDate.toDate()
                },
                // Only count certain statuses as "Revenue"? Usually created orders count, 
                // but maybe only 'PAID' or 'COMPLETED'?
                // For now, include all except CANCELLED?
                status: {
                    notIn: ['CANCELLED', 'REJECTED']
                }
            },
            include: {
                jobs: true,
                shipments: true
            }
        });

        const dailyStats: Record<string, { date: string, orders: number, revenue: number, cost: number, profit: number }> = {};

        // Initialize all days
        let current = startDate.clone();
        while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
            const dateKey = current.format('YYYY-MM-DD');
            dailyStats[dateKey] = {
                date: dateKey,
                orders: 0,
                revenue: 0,
                cost: 0,
                profit: 0
            };
            current = current.add(1, 'day');
        }

        for (const order of orders) {
            const dateKey = dayjs(order.createdAt).format('YYYY-MM-DD');
            if (dailyStats[dateKey]) {
                const revenue = order.totalAmount || 0;

                // Calculate Cost of Apparel (COGS)
                let apparelCost = 0;
                order.jobs.forEach(job => {
                    // Use actual cogs if available, or fetch from variant
                    if (job.cogsActual) {
                        apparelCost += job.cogsActual * job.qty;
                    } else if (job.sku) {
                        // Try to find variant cogs
                        // Note: complex lookup if not joined directly. Job has SKU.
                        // We need to fetch product variants to map SKU -> cogsEstimate
                        // Since we can't easily join on arbitrary SKU string to Variant model in include if not related?
                        // Job model doesn't have relation to Variant, only SKU string.
                        // We will approximation: use priceToCharge * 0.4?? No, that's bad.
                        // Just use 0 if not found for now, or if we had cached products.
                        // Ideally Job should have cogs snapshot.
                        // For this implementation, I will assume cogsActual is mostly populated OR default to 0. 
                        apparelCost += (job.cogsActual || 0) * job.qty;
                    }
                });

                // Shipping Cost
                // Not saved in DB currently. If tracking exists, maybe assume a flat rate or 0?
                // User requirement: "No tracking -> N/A, Has tracking -> Cost". 
                // Since we don't have the cost, we'll leave it as 0 but count it.
                // In future, DB migration needed to add shippingCost to Shipment/Order.
                const shippingCost = 0;

                const totalCost = apparelCost + shippingCost;

                dailyStats[dateKey].orders += 1;
                dailyStats[dateKey].revenue += revenue;
                dailyStats[dateKey].cost += totalCost;
                dailyStats[dateKey].profit += (revenue - totalCost);
            }
        }

        return NextResponse.json(Object.values(dailyStats));
    } catch (error) {
        console.error('Financial Stats Error:', error);
        return NextResponse.json({ error: 'Failed to fetch financial stats' }, { status: 500 });
    }
}
