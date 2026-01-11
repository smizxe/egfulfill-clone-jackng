import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'VND_USD_RATE' }
        });
        return NextResponse.json({ rate: setting ? parseFloat(setting.value) : 25000 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { rate } = await request.json();

        if (!rate || isNaN(rate)) {
            return NextResponse.json({ error: 'Invalid rate' }, { status: 400 });
        }

        const setting = await prisma.systemSetting.upsert({
            where: { key: 'VND_USD_RATE' },
            update: { value: rate.toString() },
            create: {
                key: 'VND_USD_RATE',
                value: rate.toString(),
                description: 'Exchange rate from VND to USD'
            }
        });

        return NextResponse.json({ success: true, rate: parseFloat(setting.value) });
    } catch (error) {
        console.error('SETTINGS_API_UPDATE_ERROR:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
