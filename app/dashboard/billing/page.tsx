import { prisma } from '@/lib/prisma';
import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BillingClient from './BillingClient';

export default async function BillingPage() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { seller: true }
    });

    if (!user || user.role !== 'SELLER') {
        redirect('/login');
    }

    return <BillingClient />;
}
