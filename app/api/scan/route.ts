import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const body = await request.json();
    const { code } = body; // Expected: F-JOB-123 or S-JOB-123

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    try {
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

        // Note: In schema Job has 'productSku' but relation is not defined to Product directly in logic earlier?
        // Schema: productId String?, productSku String?. Relation not defined in my prisma update earlier?
        // Let's check schema definition I wrote in Step 20.
        // model Job { ... productId String?, productSku String? ... } No @relation to Product.
        // But Import logic put productId.
        // I should have defined relation. But for now I'll fetch Product manually if needed.

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

                // Logic: Reserve -> OnHand? No.
                // Requirement: Scan S-JOB (Lan 1 - IN_PROCESS):
                // KHO: Reserved -Qty, OnHand -Qty (Wait, this means Material Used?)
                // Usually Reserved is deducted when Order created? 
                // Requirement says: KHO: Reserved -Qty, OnHand -Qty. 
                // This implies raw material is consumed.
                // My Product Stock is "Finished Goods" or "Raw Material"? 
                // If it's POD (Print on Demand), Stock is "Blanks" (Raw Material).
                // So "Reserved" meant "Allocated for Job".
                // Now "Used" means physically gone from shelf.
                // So we decrement both. 

                await prisma.$transaction([
                    prisma.job.update({
                        where: { id: job.id },
                        data: { status: newStatus }
                    }),
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
                            refId: job.id
                        }
                    })
                    // Note: COGS Accounting entry could be added here
                ]);

            } else if (job.status === 'IN_PROCESS') {
                newStatus = 'COMPLETED';
                messageStr = 'Job Completed';

                await prisma.job.update({
                    where: { id: job.id },
                    data: { status: newStatus }
                });

                // Check if all jobs for this order are completed
                const jobCount = await prisma.job.count({
                    where: { orderId: job.orderId }
                });
                const completedCount = await prisma.job.count({
                    where: { orderId: job.orderId, status: 'COMPLETED' }
                });

                // Note: The currently updated job is already 'COMPLETED' in DB by the update above?
                // Wait, I ran update above. So fetch count should reflect it.
                // Let's re-verify count.
                // Actually, simpler:

                const remainingJobs = await prisma.job.count({
                    where: { orderId: job.orderId, status: { not: 'COMPLETED' } }
                });

                if (remainingJobs === 0) {
                    await prisma.order.update({
                        where: { id: job.orderId },
                        data: { status: 'READY_TO_SHIP' }
                    });
                }
            } else if (job.status === 'COMPLETED') {
                return NextResponse.json({ error: 'Job is already COMPLETED' }, { status: 400 });
            }

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
