import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { ticketId, resolution, adminReply } = await req.json();

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
        }

        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: resolution || 'RESOLVED', // 'RESOLVED' or 'REJECTED'
                adminReply: adminReply,
            }
        });

        return NextResponse.json(ticket);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to resolve ticket' }, { status: 500 });
    }
}
