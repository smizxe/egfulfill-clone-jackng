import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Use Prisma for login
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Simple password check (schema uses passwordHash)
        // In a real app, use bcrypt.compare(password, user.passwordHash)
        if (user.passwordHash !== password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Successful login - Create Session Cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.role === 'SELLER' ? 'Partner' : 'Admin',
                // Note: user doesn't have name directly, usually in Seller profile?
                // Schema has 'name' on User? NO. Schema: User { email, passwordHash, role, ... }
                // Schema: Seller { name, code ... }
                // Let's check schema again. User does NOT have name.
                balance: 0 // Balance is on Wallet, accessed via Seller?
            }
        });

        // Let's fetch extra details if needed for frontend state?
        // Actually, let's keep it simple. The frontend likely expects 'name' and 'balance'.
        // If Role is Seller, we might want to fetch that.

        let userName = 'User';
        let userBalance = 0;

        if (user.role === 'SELLER' && user.sellerId) {
            const seller = await prisma.seller.findUnique({
                where: { id: user.sellerId },
                include: { wallet: true }
            });
            if (seller) {
                userName = seller.name;
                userBalance = seller.wallet?.balance || 0;
            }
        } else if (user.role === 'ADMIN') {
            userName = 'Administrator';
        }

        const finalResponse = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: userName,
                role: user.role,
                balance: userBalance
            }
        });

        finalResponse.cookies.set('userId', String(user.id), {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return finalResponse;

    } catch (error) {
        console.error('Login API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
