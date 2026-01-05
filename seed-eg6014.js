const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sku = 'EG-6014';

    // Check if exists
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
        console.log(`Product ${sku} already exists.`);
        return;
    }

    // Create Product
    const product = await prisma.product.create({
        data: {
            sku,
            name: 'Example T-Shirt EG-6014',
            isActive: true,
            variants: {
                create: [
                    {
                        color: 'BLACK',
                        size: '5XL',
                        basePrice: 15.00,
                        cogsEstimate: 8.00,
                        isActive: true
                    },
                    {
                        color: 'BLACK',
                        size: 'L',
                        basePrice: 12.00,
                        cogsEstimate: 6.00,
                        isActive: true
                    }
                ]
            }
        }
    });
    console.log(`Created product ${sku} with variants.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
