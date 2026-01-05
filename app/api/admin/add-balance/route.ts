import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const adminId = cookieStore.get('userId')?.value;

        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin
        const admin = await prisma.user.findUnique({
            where: { id: adminId }
        });

        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        // Get request body
        const { userId, amount } = await req.json();

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Update balance
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                balance: { increment: parseFloat(amount) },
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            newBalance: updatedUser.balance,
            message: `Added $${amount} to user balance`
        });

    } catch (error) {
        console.error('Add balance error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
