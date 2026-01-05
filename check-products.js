const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const count = await prisma.product.count();
    console.log(`Total Products: ${count}`);
    const products = await prisma.product.findMany({
        take: 5,
        include: { variants: true }
    });
    console.log(JSON.stringify(products, null, 2));
}

check().finally(() => prisma.$disconnect());
