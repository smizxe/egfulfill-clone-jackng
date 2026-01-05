const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    // 1. Read template file
    const workbook = XLSX.readFile('Template egfulfill.com.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawJson = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: "" });

    // Normalize keys
    const rawData = rawJson.map((row) => {
        const newRow = {};
        Object.keys(row).forEach(key => {
            newRow[key.trim().toLowerCase()] = row[key];
        });
        return newRow;
    });

    console.log("=== EXCEL DATA ===");
    console.log("Total rows:", rawData.length);
    if (rawData.length > 0) {
        console.log("\nFirst row keys:", Object.keys(rawData[0]));
        console.log("\nFirst row data:");
        console.log(JSON.stringify(rawData[0], null, 2));
    }

    // 2. Check what we extract
    console.log("\n=== EXTRACTED VALUES (first row) ===");
    if (rawData.length > 0) {
        const r = rawData[0];
        const sku = String(r['sku'] || r['product sku'] || '').trim();
        const color = String(r['color'] || '').trim();
        const size = String(r['size'] || '').trim();
        const qty = parseInt(String(r['qty'] || r['quantity'] || '0').trim(), 10);
        const recipientName = String(r['recipient_name'] || r['shipping name'] || '').trim();
        const rawAddress = String(r['shipping address'] || '').trim();
        const fileLink = String(r['embroidery_file_link'] || r['design 1'] || r['design link'] || '').trim();

        console.log("SKU:", sku || "(MISSING)");
        console.log("Color:", color || "(empty)");
        console.log("Size:", size || "(empty)");
        console.log("Qty:", qty);
        console.log("Recipient Name:", recipientName || "(MISSING)");
        console.log("Raw Address:", rawAddress || "(empty)");
        console.log("Design Link:", fileLink || "(MISSING)");

        // 3. Check if product exists
        console.log("\n=== DATABASE CHECK ===");
        if (sku) {
            const product = await prisma.product.findUnique({
                where: { sku },
                include: { variants: true }
            });

            if (product) {
                console.log(`Product '${sku}' FOUND!`);
                console.log("Variants:", product.variants.length);
                product.variants.forEach(v => {
                    console.log(`  - Color: ${v.color || 'null'}, Size: ${v.size || 'null'}, Price: $${v.basePrice}`);
                });

                // Check variant match
                if (product.variants.length > 0) {
                    const variant = product.variants.find((v) =>
                        (v.color?.toLowerCase() === color.toLowerCase() || !v.color) &&
                        (v.size?.toLowerCase() === size.toLowerCase() || !v.size)
                    );

                    if (variant) {
                        console.log(`\nVariant MATCHED: Color=${variant.color}, Size=${variant.size}, Price=$${variant.basePrice}`);
                    } else {
                        console.log(`\nVariant NOT FOUND for Color='${color}', Size='${size}'`);
                        console.log("Available variants:");
                        product.variants.forEach(v => console.log(`  - ${v.color}/${v.size}`));
                    }
                }
            } else {
                console.log(`Product '${sku}' NOT FOUND in database!`);

                // List all products
                const allProducts = await prisma.product.findMany({ select: { sku: true, name: true } });
                console.log("\nAvailable products in database:");
                allProducts.forEach(p => console.log(`  - ${p.sku}: ${p.name}`));
            }
        }

        // 4. Check seller and wallet
        console.log("\n=== SELLER/WALLET CHECK ===");
        const user = await prisma.user.findFirst({
            where: { role: 'SELLER' },
            include: { seller: { include: { wallet: true } } }
        });

        if (user && user.seller && user.seller.wallet) {
            console.log("Seller found:", user.email);
            console.log("Wallet balance: $" + user.seller.wallet.balance);
        } else {
            console.log("NO valid Seller/Wallet found!");
        }
    }

    await prisma.$disconnect();
}

debug().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
