
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    try {
        // In a real app, verify Admin session here
        const staffUsers = await prisma.user.findMany({
            where: { role: 'STAFF' },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: { assignedJobs: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(staffUsers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || null,
                passwordHash,
                role: 'STAFF',
            }
        });

        return NextResponse.json({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            createdAt: newUser.createdAt
        });

    } catch (error: any) {
        console.error('Error creating staff:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
