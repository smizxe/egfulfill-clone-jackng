import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Audit Adjustment Manual
    const body = await request.json();
    const { productId, stock } = body;

    try {
        // TODO: Add userID from auth
        // const userId = "admin-id";

        const updated = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product) throw new Error('Product not found');

            const diff = stock - product.stock;

            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: { stock: stock }
            });

            if (diff !== 0) {
                await tx.inventoryLog.create({
                    data: {
                        productId: productId,
                        quantity: diff,
                        type: 'AUDIT_ADJUST',
                        // userId
                    }
                });
            }
            return updatedProduct;
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
