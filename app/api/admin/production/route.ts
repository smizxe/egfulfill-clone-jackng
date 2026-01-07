import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const jobs = await prisma.job.findMany({
            where: {
                status: 'RECEIVED'
            },
            include: {
                order: true
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        return NextResponse.json(jobs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
}
