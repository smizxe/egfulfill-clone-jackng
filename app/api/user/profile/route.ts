import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, password } = body;

        // Validate basic input
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Prepare User update data (User model has: email, passwordHash)
        // User model does NOT have 'name'.
        const userUpdateData: any = {
            email
        };

        if (password && password.length >= 6) {
            const hashedPassword = await bcrypt.hash(password, 10);
            userUpdateData.passwordHash = hashedPassword; // Schema uses passwordHash, not password
        }

        // Fetch current user with seller info
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { seller: true }
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Handle Name update (Only Seller has name)
        if (currentUser.role === 'SELLER' && currentUser.seller && name) {
            await prisma.seller.update({
                where: { id: currentUser.seller.id }, // Correctly use Seller ID
                data: { name: name }
            });
        }

        // Update User (Email, PasswordHash)
        await prisma.user.update({
            where: { id: userId },
            data: userUpdateData
        });

        // Fetch updated data to return
        const updatedFetcher = await prisma.user.findUnique({
            where: { id: userId },
            include: { seller: { include: { wallet: true } } }
        });

        let returnedName = 'User';
        if (updatedFetcher?.role === 'SELLER' && updatedFetcher?.seller) {
            returnedName = updatedFetcher.seller.name;
        } else if (updatedFetcher?.role === 'ADMIN') {
            returnedName = 'Administrator';
        }

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedFetcher?.id,
                email: updatedFetcher?.email,
                name: returnedName,
                role: updatedFetcher?.role
            }
        });

    } catch (error: any) {
        console.error('Error updating profile:', error);

        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
