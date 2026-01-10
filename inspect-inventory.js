
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching first 50 InventoryItems...');
    const items = await prisma.inventoryItem.findMany({
        take: 50,
        orderBy: { sku: 'asc' }
    });

    console.log('Found', items.length, 'items:');
    items.forEach(item => {
        console.log(`SKU: "${item.sku}", Color: "${item.color}" (Type: ${typeof item.color}), Size: "${item.size}" (Type: ${typeof item.size}), OnHand: ${item.onHand}, Reserved: ${item.reserved}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
