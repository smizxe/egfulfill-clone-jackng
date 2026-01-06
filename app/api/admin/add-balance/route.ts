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

        // Get user with seller information
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { seller: { include: { wallet: true } } }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.sellerId || !user.seller) {
            return NextResponse.json({ error: 'User has no associated seller' }, { status: 400 });
        }

        // Update or create wallet balance
        const wallet = await prisma.wallet.upsert({
            where: { sellerId: user.sellerId },
            update: {
                balance: { increment: parseFloat(amount) },
                updatedAt: new Date()
            },
            create: {
                sellerId: user.sellerId,
                balance: parseFloat(amount),
                currency: 'USD'
            }
        });

        // Create ledger entry for audit trail
        await prisma.walletLedger.create({
            data: {
                sellerId: user.sellerId,
                type: 'CREDIT',
                amount: parseFloat(amount),
                currency: 'USD',
                refType: 'MANUAL',
                note: `Manual balance addition by admin`,
                createdBy: adminId
            }
        });

        return NextResponse.json({
            success: true,
            newBalance: wallet.balance,
            message: `Added $${amount} to wallet balance`
        });

    } catch (error) {
        console.error('Add balance error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
