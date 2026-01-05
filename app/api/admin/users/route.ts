import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const users = await prisma.user.findMany({
            include: {
                seller: {
                    include: {
                        wallet: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to simpler structure for frontend
        const mappedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.seller?.name || user.role, // Fallback to Role if no name
            role: user.role,
            balance: user.seller?.wallet?.balance || 0,
            createdAt: user.createdAt
        }));

        return NextResponse.json(mappedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
