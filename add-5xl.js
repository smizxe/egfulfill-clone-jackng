const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function addVariant() {
    const product = await p.product.findUnique({
        where: { sku: 'HOODIE-PREM' }
    });

    if (!product) {
        console.log('Product not found');
        return;
    }

    // Add 5XL variants
    await p.productVariant.createMany({
        data: [
            { productId: product.id, color: 'Black', size: '5XL', basePrice: 30.00, cogsEstimate: 18.00 },
            { productId: product.id, color: 'White', size: '5XL', basePrice: 30.00, cogsEstimate: 18.00 }
        ]
    });

    console.log('Added 5XL variants for HOODIE-PREM');
    await p.$disconnect();
}

addVariant();
