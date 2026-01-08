import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, sku, isActive, variants } = body;

        const product = await prisma.$transaction(async (tx) => {
            // 1. Update Product Info
            const imageList = Array.isArray(body.images) ? body.images : (body.images ? [body.images] : []);

            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    name,
                    sku,
                    isActive,
                    description: body.description,
                    images: JSON.stringify(imageList), // Backward compatibility
                    shippingRates: body.shippingRates,
                    extraFees: body.extraFees
                },
            });

            // 1.5 Sync Product Images
            // Fetch existing images
            const existingImages = await tx.productImage.findMany({
                where: { productId: id },
                select: { id: true, url: true } // Need URL to compare
            });
            const existingUrls = existingImages.map(img => img.url);

            // Determine images to add and remove
            const urlsToAdd = imageList.filter((url: string) => !existingUrls.includes(url));
            const urlsToRemove = existingUrls.filter(url => !imageList.includes(url));

            if (urlsToRemove.length > 0) {
                await tx.productImage.deleteMany({
                    where: {
                        productId: id,
                        url: { in: urlsToRemove }
                    }
                });
            }

            if (urlsToAdd.length > 0) {
                await tx.productImage.createMany({
                    data: urlsToAdd.map((url: string) => ({
                        productId: id,
                        url: url
                    }))
                });
            }

            if (Array.isArray(variants)) {
                // 2. Manage Variants

                // Get existing IDs from DB
                const existingVariants = await tx.productVariant.findMany({
                    where: { productId: id },
                    select: { id: true }
                });
                const existingIds = existingVariants.map(v => v.id);

                // IDs present in the payload
                const payloadIds = variants.map((v: any) => v.id).filter(Boolean);

                // a. Delete removed variants
                const idsToDelete = existingIds.filter(eid => !payloadIds.includes(eid));
                if (idsToDelete.length > 0) {
                    await tx.productVariant.deleteMany({
                        where: { id: { in: idsToDelete } }
                    });
                    // Inventory cleanup? Optional. Let's keep inventory for history?
                    // Actually if we delete variant, future imports might default to "" color/size or fail.
                    // Keeping inventory is safer.
                }

                // b. Upsert (Update or Create)
                for (const v of variants) {
                    const price = parseFloat(v.basePrice) || 0;

                    if (v.id && existingIds.includes(v.id)) {
                        // Update
                        await tx.productVariant.update({
                            where: { id: v.id },
                            data: {
                                color: v.color,
                                size: v.size,
                                basePrice: price
                            }
                        });
                    } else {
                        // Create New
                        await tx.productVariant.create({
                            data: {
                                productId: id,
                                color: v.color,
                                size: v.size,
                                basePrice: price,
                                cogsEstimate: price * 0.6
                            }
                        });

                        // Upsert Inventory Item
                        await tx.inventoryItem.upsert({
                            where: {
                                sku_color_size: {
                                    sku: sku,
                                    color: v.color || "",
                                    size: v.size || ""
                                }
                            },
                            update: {}, // exists, do nothing
                            create: {
                                sku: sku,
                                color: v.color || "",
                                size: v.size || "",
                                onHand: 0,
                                reserved: 0
                            }
                        });
                    }
                }
            }

            return updatedProduct;
        });

        return NextResponse.json(product);
    } catch (error: any) {
        console.error('Update product error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.productVariant.deleteMany({ where: { productId: id } });
        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete product error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
