const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
    const product = await p.product.findUnique({
        where: { sku: 'HOODIE-PREM' },
        include: { variants: true }
    });

    if (product) {
        console.log('Product:', product.name);
        console.log('Variants:', product.variants.length);
        product.variants.forEach(v => console.log('  -', v.color, '/', v.size, '$' + v.basePrice));
    } else {
        console.log('Product HOODIE-PREM NOT FOUND');
    }

    await p.$disconnect();
}

check();
