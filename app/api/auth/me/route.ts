import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                seller: {
                    include: {
                        wallet: true
                    }
                }
            }
        }) as any;

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let name = 'User';
        let balance = 0;

        if (user.role === 'SELLER' && user.seller) {
            name = user.seller.name;
            balance = user.seller.wallet?.balance || 0;
        } else if (user.role === 'ADMIN') {
            name = 'Administrator'; // Or fetch admin details if you have an Admin table
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: name,
                role: user.role,
                balance: balance
            }
        });

    } catch (error) {
        console.error('Auth Check Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
