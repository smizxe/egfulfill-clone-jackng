import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '15');
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { sku: { contains: search } }, // Case-insensitive handled by default? SQLite specific: might need explicit mode if not default
                { name: { contains: search } }
            ];
        }

        // Get total count for pagination
        const total = await prisma.product.count({ where });

        // Fetch products with pagination
        const products = await prisma.product.findMany({
            where,
            include: { variants: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        // Fetch ALL inventory items to map correctly (Optimization: Could filter by productIds, 
        // but for now fetch all or fetch by filtered product IDs is better)

        // Optimisation: Fetch inventory only for displayed products
        const productIds = products.map(p => p.id);
        // We actually need to match by SKU/Color/Size. 
        // Inventory items are not directly linked by ProductID in schema? 
        // Schema checks: InventoryItem has SKU. Product has SKU.
        // If we filter products, we have their SKUs.

        // But Products might have variants with different SKUs? 
        // Schema: Product has 'sku', Variant has NO sku field in provided schema snippet?
        // Re-checking schema if possible, but assuming standard: 
        // If Product has variants, stock is usually on variants.
        // Let's grab all SKUs involved.

        // Simpler approach for now to avoid complex queries: Fetch all inventory items (might be heavy later)
        // OR better: Fetch inventoryItems where SKU starts with... or matches list.
        // Given the requirement "search global data", we filtered products.
        // Now let's just get all inventory items. The map will be fast enough for thousands of items.
        const inventoryItems = await prisma.inventoryItem.findMany();

        const inventoryMap = new Map();
        inventoryItems.forEach(item => {
            const key = `${item.sku}-${item.color || ''}-${item.size || ''}`;
            inventoryMap.set(key, item);
        });

        const results = products.map(p => {
            let totalStock = 0;
            let variantsData = [];

            if (p.variants.length > 0) {
                variantsData = p.variants.map(v => {
                    // How do we match Variant to InventoryItem? 
                    // Previous logic: Product SKU + Variant Color/Size. 
                    // Schema check: ProductVariant has `color`, `size`. 
                    // InventoryItem has `sku`, `color`, `size`.
                    // So key is `product.sku` + `variant.color` + `variant.size`.

                    const key = `${p.sku}-${v.color || ''}-${v.size || ''}`;
                    const invItem = inventoryMap.get(key);
                    const stock = invItem?.onHand || 0;
                    totalStock += stock;
                    return {
                        id: v.id,
                        sku: p.sku,
                        color: v.color || '',
                        size: v.size || '',
                        stock: stock,
                        reserved: invItem?.reserved || 0
                    };
                });
            } else {
                const key = `${p.sku}--`;
                const invItem = inventoryMap.get(key);
                const stock = invItem?.onHand || 0;
                totalStock = stock;
                variantsData.push({
                    id: p.id,
                    sku: p.sku,
                    color: '',
                    size: '',
                    stock: stock,
                    reserved: invItem?.reserved || 0
                });
            }

            return {
                id: p.id,
                sku: p.sku,
                name: p.name,
                totalStock,
                variants: variantsData
            };
        });

        return NextResponse.json({
            data: results,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Inventory Fetch Error:", error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sku, color, size, stock, type } = body;

        // We expect SKU, Color, Size to identify the item. 
        // If ID is passed, we might use it, but SKU+Color+Size is safer for UPSERT.

        if (!sku) return NextResponse.json({ error: 'SKU required' }, { status: 400 });

        const safeColor = color || '';
        const safeSize = size || '';

        // Find existing to calc diff
        const existing = await prisma.inventoryItem.findUnique({
            where: {
                sku_color_size: { sku, color: safeColor, size: safeSize }
            }
        });

        const oldStock = existing?.onHand || 0;
        const diff = stock - oldStock;

        if (diff === 0 && existing) {
            return NextResponse.json(existing);
        }

        const updated = await prisma.$transaction(async (tx) => {
            const item = await tx.inventoryItem.upsert({
                where: {
                    sku_color_size: { sku, color: safeColor, size: safeSize }
                },
                update: {
                    onHand: stock
                },
                create: {
                    sku,
                    color: safeColor,
                    size: safeSize,
                    onHand: stock,
                    reserved: 0
                }
            });

            // Log movement
            await tx.inventoryMovement.create({
                data: {
                    sku,
                    color: safeColor,
                    size: safeSize,
                    qtyChange: diff,
                    type: type || 'AUDIT_ADJUST',
                    refType: 'MANUAL',
                    createdById: 'ADMIN' // Request user ID integration later
                }
            });

            return item;
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Inventory Update Error:", error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
