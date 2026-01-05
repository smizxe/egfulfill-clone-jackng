import { prisma } from '@/lib/prisma';
import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OrdersTable from './OrdersTable';

export default async function OrdersPage() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        redirect('/login');
    }

    // Get user and their seller account
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { seller: true }
    });

    if (!user || !user.seller) {
        redirect('/login');
    }

    const orders = await prisma.order.findMany({
        where: { sellerId: user.seller.id },
        include: { jobs: true }, // Include jobs for status check
        orderBy: { createdAt: 'desc' }
    });

    // Self-healing: Correct Order Status if out of sync
    // This handles cases where Job status updated but Order status didn't trigger (e.g. before fix or failed api call)
    for (const order of orders) {
        let shouldUpdate = false;
        let newStatus = order.status;

        const hasInProcess = order.jobs.some(j => j.status === 'IN_PROCESS');
        const countCompleted = order.jobs.filter(j => j.status === 'COMPLETED').length;
        const allCompleted = order.jobs.length > 0 && countCompleted === order.jobs.length;

        // Logic:
        // 1. If any job is IN_PROCESS and Order is RECEIVED -> Update to IN_PROCESS
        // 2. If ALL jobs are COMPLETED and Order is not COMPLETED -> Update to COMPLETED

        if (order.status === 'RECEIVED' && (hasInProcess || countCompleted > 0)) {
            // Even if some completed, if order is received, it should be at least processing
            if (allCompleted) {
                newStatus = 'COMPLETED';
            } else {
                newStatus = 'IN_PROCESS';
            }
            shouldUpdate = true;
        } else if (order.status === 'IN_PROCESS' && allCompleted) {
            newStatus = 'COMPLETED';
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            await prisma.order.update({
                where: { id: order.id },
                data: { status: newStatus }
            });
            order.status = newStatus; // Update displayed data
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Orders</h2>
            <OrdersTable orders={orders} />
        </div>
    );
}
