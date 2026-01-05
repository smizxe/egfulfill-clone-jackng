const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const product = await prisma.product.findUnique({
        where: { sku: 'EG-6014' },
        include: { variants: true }
    });

    if (!product) {
        console.log('Product EG-6014 NOT FOUND');
        await prisma.$disconnect();
        return;
    }

    console.log('Product found:', product.sku, product.name);
    console.log('Variants count:', product.variants.length);

    product.variants.forEach(v => {
        console.log('  Variant:', '"' + v.color + '"', '"' + v.size + '"', '$' + v.basePrice);
    });

    // Try matching BLACK/5XL (case sensitive check)
    const colorExcel = 'BLACK';
    const sizeExcel = '5XL';

    console.log('\nTrying to match: color="' + colorExcel + '", size="' + sizeExcel + '"');

    const variant = product.variants.find(v => {
        const colorMatch = v.color?.toLowerCase() === colorExcel.toLowerCase() || !v.color;
        const sizeMatch = v.size?.toLowerCase() === sizeExcel.toLowerCase() || !v.size;
        console.log('  Checking variant:', v.color, v.size, '-> colorMatch:', colorMatch, 'sizeMatch:', sizeMatch);
        return colorMatch && sizeMatch;
    });

    if (variant) {
        console.log('\n==> MATCHED:', variant.color, variant.size, '$' + variant.basePrice);
    } else {
        console.log('\n==> NOT MATCHED');
    }

    await prisma.$disconnect();
}

check();
