import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const body = await request.json();
    const { code } = body; // Expected: F-JOB-123 or S-JOB-123

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        // If user is logged in, link this job update to them
        let assignedStaffId: string | null = null;
        if (userId) assignedStaffId = userId;

        let type = '';
        let jobIdStr = '';

        if (code.startsWith('F-')) {
            type = 'FILE';
            jobIdStr = code.substring(2); // Remove F-
        } else if (code.startsWith('S-')) {
            type = 'STATUS';
            jobIdStr = code.substring(2); // Remove S-
        } else {
            return NextResponse.json({ error: 'Invalid code format. Must start with F- or S-' }, { status: 400 });
        }

        const job = await prisma.job.findFirst({
            where: { jobCode: jobIdStr },
            include: { order: true }
        });

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        if (type === 'FILE') {
            if (job.embroideryDriveLink) {
                return NextResponse.json({
                    type: 'FILE',
                    message: 'File found. Opening...',
                    url: job.embroideryDriveLink
                });
            } else {
                return NextResponse.json({ error: 'No embroidery file linked to this job' }, { status: 404 });
            }
        }

        if (type === 'STATUS') {
            // Handle Status Transition
            let newStatus = '';
            let messageStr = '';

            if (job.status === 'RECEIVED') {
                newStatus = 'IN_PROCESS';
                messageStr = 'Job Started (In Process)';

                await prisma.$transaction([
                    prisma.job.update({
                        where: { id: job.id },
                        data: {
                            status: newStatus,
                            assignedStaffId: assignedStaffId ?? undefined
                        }
                    }),
                    // Only decrement stock if moving from RECEIVED to IN_PROCESS (Start Production)
                    prisma.inventoryItem.updateMany({
                        where: {
                            sku: job.sku,
                            color: job.color,
                            size: job.size
                        },
                        data: {
                            onHand: { decrement: job.qty },
                            reserved: { decrement: job.qty }
                        }
                    }),
                    prisma.inventoryMovement.create({
                        data: {
                            sku: job.sku,
                            color: job.color,
                            size: job.size,
                            qtyChange: -job.qty,
                            type: 'PRODUCTION_USE',
                            refType: 'JOB',
                            refId: job.id,
                            createdById: userId
                        }
                    })
                ]);

            } else if (job.status === 'IN_PROCESS') {
                newStatus = 'COMPLETED';
                messageStr = 'Job Completed';

                await prisma.$transaction(async (tx) => {
                    await tx.job.update({
                        where: { id: job.id },
                        data: {
                            status: newStatus,
                            assignedStaffId: assignedStaffId ?? undefined
                        }
                    });

                    // Check if all jobs for this order are completed
                    const remainingJobs = await tx.job.count({
                        where: { orderId: job.orderId, status: { not: 'COMPLETED' } }
                    });

                    if (remainingJobs === 0) {
                        await tx.order.update({
                            where: { id: job.orderId },
                            data: { status: 'READY_TO_SHIP' }
                        });
                    }
                });

            } else if (job.status === 'COMPLETED') {
                return NextResponse.json({ error: 'Job is already COMPLETED' }, { status: 400 });
            }

            // Return success response linked to the new status
            return NextResponse.json({
                type: 'STATUS',
                message: messageStr,
                status: newStatus
            });
        }

        return NextResponse.json({ error: 'Unknown Action' }, { status: 400 });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Scan failed' }, { status: 500 });
    }
}
