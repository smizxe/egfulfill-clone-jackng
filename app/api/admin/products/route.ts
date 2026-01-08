import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sku, name, isActive, variants, description, images } = body;
        // Note: colors/sizes arrays are in body but we use 'variants' array for creation now.

        if (!sku || !name) {
            return NextResponse.json({ error: 'SKU and Name are required' }, { status: 400 });
        }

        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
            return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
        }

        const product = await prisma.$transaction(async (tx) => {
            // Handle images: ensure it's an array
            const imageList = Array.isArray(images) ? images : (images ? [images] : []);

            const newProduct = await tx.product.create({
                data: {
                    sku,
                    name,
                    isActive: isActive ?? true,
                    description,
                    images: JSON.stringify(imageList), // Backward compatibility
                    shippingRates: body.shippingRates,
                    extraFees: body.extraFees
                }
            });

            // Create ProductImage records
            if (imageList.length > 0) {
                await tx.productImage.createMany({
                    data: imageList.map((url: string) => ({
                        productId: newProduct.id,
                        url: url
                    }))
                });
            }

            // Iterate provided variants
            if (Array.isArray(variants) && variants.length > 0) {
                for (const v of variants) {
                    await tx.productVariant.create({
                        data: {
                            productId: newProduct.id,
                            color: v.color,
                            size: v.size,
                            basePrice: parseFloat(v.basePrice) || 0,
                            cogsEstimate: (parseFloat(v.basePrice) || 0) * 0.6
                        }
                    });

                    // Inventory creation
                    // Check logic: unique constraint is [sku, color, size] on inventory item?
                    // Inventory SKU usually product SKU if variants share sku prefix or logic.
                    // Schema: InventoryItem(sku, color, size)
                    await tx.inventoryItem.create({
                        data: {
                            sku: sku,
                            color: v.color || "",
                            size: v.size || "",
                            onHand: 0,
                            reserved: 0
                        }
                    });
                }
            } else {
                // Fallback if no variants provided (shouldn't happen with new UI)
                // Create default variant
                await tx.productVariant.create({
                    data: {
                        productId: newProduct.id,
                        basePrice: 0,
                        cogsEstimate: 0
                    }
                });
            }

            return newProduct;
        });

        return NextResponse.json(product);
    } catch (error: any) {
        console.error('Create product error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
