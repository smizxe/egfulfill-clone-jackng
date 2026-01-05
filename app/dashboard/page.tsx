import { prisma } from '@/lib/prisma';
import React from 'react';
import {
    ShoppingOutlined,
    DollarOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    WalletOutlined,
    RiseOutlined
} from '@ant-design/icons';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        redirect('/login');
    }

    // Prisma Query with explicit typing
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            seller: {
                include: {
                    orders: true,
                    wallet: true
                }
            }
        }
    }) as {
        id: string;
        email: string;
        role: string;
        sellerId: string | null;
        seller: {
            id: string;
            name: string;
            orders: Array<{ id: string; status: string; totalAmount: number }>;
            wallet: { balance: number } | null;
        } | null;
    } | null;

    if (!user) {
        redirect('/login');
    }

    // Redirect admins to admin dashboard
    if (user.role === 'ADMIN') {
        redirect('/admin/dashboard');
    }

    // Data Selection for Dashboard
    const orders = user.seller?.orders || [];
    const balance = user.seller?.wallet?.balance || 0;

    // Calculate Stats
    const orderCount = orders.length;
    const pendingCount = orders.filter((o) => o.status === 'RECEIVED' || o.status === 'IN_PROCESS').length;

    // Stats data
    const stats = [
        { title: 'Orders', value: orderCount, icon: <ShoppingOutlined />, color: '#1890ff' },
        { title: 'Refunds', value: 0, prefix: '$', styles: { content: { color: '#cf1322' } }, icon: <DollarOutlined />, color: '#ff4d4f' },
        { title: 'Orders Pending', value: pendingCount, icon: <ClockCircleOutlined />, color: '#faad14' },
        { title: 'Unsolved Tickets', value: 0, icon: <CustomerServiceOutlined />, color: '#fa8c16' },
        { title: 'Awaiting Payment', value: 0, prefix: '$', icon: <WalletOutlined />, color: '#722ed1' },
        { title: 'Your Balance', value: balance, prefix: '$', styles: { content: { color: '#3f8600' } }, icon: <RiseOutlined />, color: '#52c41a' },
    ];

    return <DashboardClient user={user} stats={stats} />;
}
