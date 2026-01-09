import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        const { ticketId, resolution, adminReply } = await req.json();

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
        }

        const updateData: any = {
            status: resolution || 'RESOLVED',
        };

        if (adminReply) {
            updateData.messages = {
                create: {
                    senderId: userId || 'ADMIN',
                    senderRole: 'ADMIN',
                    message: adminReply
                }
            };
        }

        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: updateData
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Resolve Ticket Error:', error);
        return NextResponse.json({ error: 'Failed to resolve ticket' }, { status: 500 });
    }
}
