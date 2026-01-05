const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateImport() {
    // 1. Read file
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

    console.log('Total rows:', rawData.length);

    const errors = [];
    const jobsToCreate = [];
    let totalBatchCost = 0;

    // 2. Get seller
    const user = await prisma.user.findFirst({
        where: { role: 'SELLER' },
        include: { seller: { include: { wallet: true } } }
    });

    if (!user || !user.seller || !user.seller.wallet) {
        console.log('ERROR: No valid Seller/Wallet found');
        await prisma.$disconnect();
        return;
    }

    console.log('Seller:', user.email);
    console.log('Wallet balance: $' + user.seller.wallet.balance);

    const sellerId = user.seller.id;
    const currentBalance = user.seller.wallet.balance;

    // 3. Process rows
    const productsCache = {};

    for (const [index, row] of rawData.entries()) {
        const rowIndex = index + 2;
        const r = row;

        let sku = String(r['sku'] || r['product sku'] || '').trim();
        const color = String(r['color'] || '').trim();
        const size = String(r['size'] || '').trim();
        const qtyStr = String(r['qty'] || r['quantity'] || '0').trim();
        const qty = parseInt(qtyStr, 10);

        const recipientName = String(r['recipient_name'] || r['shipping name'] || '').trim();
        const phone = String(r['phone'] || r['shipping phone'] || '').trim();

        let address1 = String(r['address1'] || '').trim();
        let city = String(r['city'] || '').trim();
        let state = String(r['state'] || r['shipping province'] || '').trim();
        let zip = String(r['zip'] || r['shipping zip'] || '').trim();
        let country = String(r['country'] || r['shipping country'] || '').trim();

        const rawAddress = String(r['shipping address'] || '').trim();
        if (rawAddress && !address1) {
            const parts = rawAddress.split(',').map(p => p.trim());
            if (parts.length >= 4) {
                address1 = parts[0];
                city = parts[1];
                state = parts[2];
                zip = parts[3];
                if (parts.length >= 5) country = parts[4];
            } else {
                address1 = parts[0];
                if (parts[1]) city = parts[1];
                if (parts[2]) state = parts[2];
            }
        }

        if (!country) country = 'US';

        const fileLink = String(r['embroidery_file_link'] || r['design 1'] || r['design link'] || '').trim();

        console.log(`\nRow ${rowIndex}:`);
        console.log('  SKU:', sku || '(MISSING)');
        console.log('  Color:', color || '(empty)');
        console.log('  Size:', size || '(empty)');
        console.log('  Qty:', qty);
        console.log('  Name:', recipientName || '(MISSING)');
        console.log('  Address1:', address1 || '(MISSING)');
        console.log('  FileLink:', fileLink ? fileLink.substring(0, 40) + '...' : '(MISSING)');

        // Validation
        if (!sku) { errors.push(`Row ${rowIndex}: Missing SKU`); continue; }
        if (qty <= 0) { errors.push(`Row ${rowIndex}: Qty must be > 0`); continue; }
        if (!recipientName) { errors.push(`Row ${rowIndex}: Missing Recipient/Shipping Name`); continue; }
        if (!address1) { errors.push(`Row ${rowIndex}: Missing Address`); continue; }
        if (!fileLink) { errors.push(`Row ${rowIndex}: Missing Design Link (Design 1)`); continue; }

        // Find product
        let product = productsCache[sku];
        if (!product) {
            product = await prisma.product.findUnique({
                where: { sku },
                include: { variants: true }
            });
            if (product) productsCache[sku] = product;
        }

        if (!product) {
            errors.push(`Row ${rowIndex}: Product SKU '${sku}' not found`);
            continue;
        }

        console.log('  Product found:', product.name);

        // Find variant
        let price = 0;
        let cogs = 0;

        if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find((v) =>
                (v.color?.toLowerCase() === color.toLowerCase() || !v.color) &&
                (v.size?.toLowerCase() === size.toLowerCase() || !v.size)
            );

            if (variant) {
                price = variant.basePrice;
                cogs = variant.cogsEstimate || 0;
                console.log('  Variant matched: $' + price);
            } else {
                errors.push(`Row ${rowIndex}: Variant ${color}/${size} not found for SKU ${sku}`);
                continue;
            }
        } else {
            errors.push(`Row ${rowIndex}: Product ${sku} has no pricing configuration (variants missing)`);
            continue;
        }

        const lineCost = price * qty;
        totalBatchCost += lineCost;

        jobsToCreate.push({ sku, qty, lineCost });
    }

    console.log('\n========== SUMMARY ==========');
    console.log('Jobs to create:', jobsToCreate.length);
    console.log('Total cost: $' + totalBatchCost);
    console.log('Errors:', errors.length);

    if (errors.length > 0) {
        console.log('\nERRORS:');
        errors.forEach(e => console.log('  -', e));
    }

    if (jobsToCreate.length > 0 && errors.length === 0) {
        if (currentBalance >= totalBatchCost) {
            console.log('\n==> WOULD SUCCEED! Balance sufficient.');
        } else {
            console.log('\n==> WOULD FAIL: Insufficient balance. Need $' + totalBatchCost + ', have $' + currentBalance);
        }
    }

    await prisma.$disconnect();
}

simulateImport();
