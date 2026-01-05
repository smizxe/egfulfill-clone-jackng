import { prisma } from '@/lib/prisma';
import ProductsClient from './ProductsClient';

export default async function AdminProductsPage() {
    const products = await prisma.product.findMany({
        include: {
            variants: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Map to format the client expects
    const mappedProducts = products.map((p: any) => {
        const uniqueColors = Array.from(new Set(p.variants.map((v: any) => v.color).filter(Boolean)));
        const uniqueSizes = Array.from(new Set(p.variants.map((v: any) => v.size).filter(Boolean)));
        const basePrices = p.variants.map((v: any) => v.basePrice);

        return {
            id: p.id,
            sku: p.sku,
            name: p.name,
            isActive: p.isActive,
            variantCount: p.variants.length,
            priceRange: basePrices.length > 0
                ? `$${Math.min(...basePrices).toFixed(2)} - $${Math.max(...basePrices).toFixed(2)}`
                : 'N/A',
            // fields for edit modal
            colors: uniqueColors,
            sizes: uniqueSizes,
            basePrice: basePrices.length > 0 ? Math.min(...basePrices) : 0,
            variants: p.variants
        };
    });

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Product Management</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <ProductsClient products={mappedProducts} />
            </div>
        </div>
    );
}
