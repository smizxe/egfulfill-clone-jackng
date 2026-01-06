import { prisma } from './lib/prisma';

async function checkVariants() {
    const variants = await prisma.productVariant.findMany({
        include: { product: { select: { sku: true, name: true } } },
        take: 20
    });

    console.log('Total variants:', variants.length);
    variants.forEach(v => {
        console.log(JSON.stringify({
            sku: v.product.sku,
            color: v.color,
            size: v.size,
            basePrice: v.basePrice
        }));
    });
}

checkVariants().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
