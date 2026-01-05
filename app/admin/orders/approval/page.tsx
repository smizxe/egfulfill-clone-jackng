import { prisma } from '@/lib/prisma';
import ApprovalClient from './ApprovalClient';

export default async function ApprovalPage() {
    const pendingOrders = await prisma.order.findMany({
        where: { status: 'PENDING_APPROVAL' },
        include: {
            seller: true,
            jobs: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Order Approvals</h1>
            <p className="mb-4 text-gray-500">Review imported orders before they are sent to production.</p>
            <ApprovalClient orders={pendingOrders} />
        </div>
    );
}
