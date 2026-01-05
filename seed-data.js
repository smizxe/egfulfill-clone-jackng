const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Admin
    const adminEmail = 'admin@egfulfill.local';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: 'admin123', // Assumption: simple string match or handled elsewhere
                role: 'ADMIN',
            },
        });
        console.log('✅ Created Admin: admin@egfulfill.local');
    }

    // 2. Create Seller + User + Wallet
    const sellerEmail = 'seller@test.local';
    let sellerUser = await prisma.user.findUnique({ where: { email: sellerEmail } });

    if (!sellerUser) {
        // Create Seller Profile
        const seller = await prisma.seller.create({
            data: {
                code: 'SEL001',
                name: 'Test Dropshipper',
                contactEmail: sellerEmail,
                address: '123 Test St, VN',
                wallet: {
                    create: {
                        balance: 5000.0, // Start with $5000
                        currency: 'USD'
                    }
                }
            }
        });

        // Create User linked to Seller
        sellerUser = await prisma.user.create({
            data: {
                email: sellerEmail,
                passwordHash: 'seller123',
                role: 'SELLER',
                sellerId: seller.id
            }
        });

        // Create initial ledger credit
        await prisma.walletLedger.create({
            data: {
                sellerId: seller.id,
                type: 'CREDIT',
                amount: 5000.0,
                refType: 'MANUAL',
                note: 'Initial Seed Balance',
                createdBy: 'SYSTEM'
            }
        });

        console.log('✅ Created Seller: seller@test.local (Balance: $5000)');
    }

    // 3. Create Products
    const productData = [
        { sku: 'TSHIRT-BASIC', name: 'Basic Cotton T-Shirt', price: 10.0 },
        { sku: 'HOODIE-PREM', name: 'Premium Heavy Hoodie', price: 25.0 }
    ];

    for (const p of productData) {
        const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
        if (!existing) {
            const product = await prisma.product.create({
                data: {
                    sku: p.sku,
                    name: p.name
                }
            });

            // Variants
            const sizes = ['S', 'M', 'L', 'XL'];
            const colors = ['Black', 'White'];

            for (const color of colors) {
                for (const size of sizes) {
                    await prisma.productVariant.create({
                        data: {
                            productId: product.id,
                            color: color,
                            size: size,
                            basePrice: p.price + (size === 'XL' ? 2 : 0), // +$2 for XL
                            cogsEstimate: p.price * 0.6
                        }
                    });

                    // Init Inventory
                    await prisma.inventoryItem.create({
                        data: {
                            sku: p.sku,
                            color: color,
                            size: size,
                            onHand: 100,
                            reserved: 0
                        }
                    });
                }
            }
            console.log(`✅ Created Product: ${p.sku} with variants`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
