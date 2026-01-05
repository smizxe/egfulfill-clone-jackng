import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate secure random token
function generateToken() {
    return uuidv4().replace(/-/g, '') + Math.random().toString(36).substring(2, 8);
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use raw:true to avoid date parsing issues
        const rawJson = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: "" });

        // Normalize keys directly: lowercase and trim
        const rawData = rawJson.map((row: any) => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
                newRow[key.trim().toLowerCase()] = row[key];
            });
            return newRow;
        });

        const errors: string[] = [];
        const jobsToCreate: any[] = [];
        let totalBatchCost = 0;

        // 1. Identify Seller 
        const user = await prisma.user.findFirst({
            where: { role: 'SELLER' },
            include: { seller: { include: { wallet: true } } }
        });

        if (!user || !user.seller || !user.seller.wallet) {
            return NextResponse.json({ error: 'Authentication failed. No valid Seller/Wallet found.' }, { status: 401 });
        }

        const sellerId = user.seller.id;
        const walletId = user.seller.wallet.id;
        const currentBalance = user.seller.wallet.balance;

        // Cache products 
        const productsCache: Record<string, any> = {};

        for (const [index, row] of rawData.entries()) {
            const rowIndex = index + 2;
            const r = row as any;

            let sku = String(r['sku'] || r['product sku'] || '').trim();
            const color = String(r['color'] || '').trim();
            const size = String(r['size'] || '').trim();
            const qtyStr = String(r['qty'] || r['quantity'] || '0').trim();
            const qty = parseInt(qtyStr, 10);

            const recipientName = String(r['recipient_name'] || r['shipping name'] || '').trim();
            const phone = String(r['phone'] || r['shipping phone'] || '').trim();

            // Address Handling
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

            // Handle Designs (Multi-location)
            const designs = [];
            // Check legacy first
            const legacyLink = String(r['embroidery_file_link'] || r['design link'] || '').trim();
            if (legacyLink) {
                designs.push({ url: legacyLink, location: 'Legacy/Front' });
            }

            // Check indexed columns 1-4
            for (let i = 1; i <= 4; i++) {
                const url = String(r[`design ${i}`] || r[`design ${i} link`] || r[`embroidery ${i}`] || '').trim();
                const loc = String(r[`design ${i} location`] || r[`location ${i}`] || '').trim();

                if (url) {
                    // Avoid duplicates if legacy link matches
                    if (!designs.find(d => d.url === url)) {
                        designs.push({ url, location: loc || `Pos ${i}` });
                    }
                }
            }

            // Basic Validation
            if (!sku) { errors.push(`Row ${rowIndex}: Missing SKU`); continue; }
            if (qty <= 0) { errors.push(`Row ${rowIndex}: Qty must be > 0`); continue; }
            if (!recipientName) { errors.push(`Row ${rowIndex}: Missing Recipient`); continue; }
            if (!address1) { errors.push(`Row ${rowIndex}: Missing Address`); continue; }
            if (designs.length === 0) { errors.push(`Row ${rowIndex}: No Design Links found`); continue; }

            // Find Product/Variant Logic
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

            let price = 0;
            let cogs = 0;
            // Strict variant matching
            if (product.variants && product.variants.length > 0) {
                const variant = product.variants.find((v: any) =>
                    (v.color?.toLowerCase() === color.toLowerCase() || (!v.color && !color)) &&
                    (v.size?.toLowerCase() === size.toLowerCase() || (!v.size && !size))
                );

                if (variant) {
                    price = variant.basePrice;
                    cogs = variant.cogsEstimate || 0;
                } else {
                    errors.push(`Row ${rowIndex}: Variant ${color}/${size} not found`);
                    continue;
                }
            } else {
                errors.push(`Row ${rowIndex}: Product variants missing`);
                continue;
            }

            const lineCost = price * qty;
            totalBatchCost += lineCost;

            jobsToCreate.push({
                rowIndex,
                sku, color, size, qty,
                recipientName, address1, address2: r['address2'], city, state, zip, country, phone,
                designs: JSON.stringify(designs),
                priceToCharge: price,
                cogsEstimate: cogs,
                product,
                totalCost: lineCost
            });
        }

        if (errors.length > 0) {
            return NextResponse.json({ success: false, errors }, { status: 400 });
        }

        if (jobsToCreate.length === 0) {
            return NextResponse.json({ success: false, errors: ["No valid rows found"] }, { status: 400 });
        }

        // Check Wallet
        if (currentBalance < totalBatchCost) {
            return NextResponse.json({
                success: false,
                errors: [`Insufficient wallet balance. Required: $${totalBatchCost.toFixed(2)}, Available: $${currentBalance.toFixed(2)}`]
            }, { status: 402 });
        }

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            const orderCode = `ORD-${new Date().toISOString().slice(0, 7).replace(/-/g, '')}-${uuidv4().substring(0, 6).toUpperCase()}`;

            // Create Order - STATUS PENDING_APPROVAL
            const order = await tx.order.create({
                data: {
                    sellerId,
                    orderCode,
                    status: 'PENDING_APPROVAL', // Explicitly Pending
                    totalAmount: totalBatchCost,
                    shippingCountry: jobsToCreate[0].country,
                    shippingMethod: 'STANDARD',
                }
            });

            // Debit Wallet (Hold Amount)
            await tx.wallet.update({
                where: { id: walletId },
                data: { balance: { decrement: totalBatchCost } }
            });

            await tx.walletLedger.create({
                data: {
                    sellerId,
                    type: 'DEBIT',
                    amount: totalBatchCost,
                    refType: 'ORDER',
                    refId: order.id,
                    note: `Import Order ${orderCode} (Pending Approval)`
                }
            });

            // Create Jobs
            for (const jobData of jobsToCreate) {
                const jobCode = 'JOB' + uuidv4().substring(0, 8).toUpperCase();

                const newJob = await tx.job.create({
                    data: {
                        orderId: order.id,
                        sellerId,
                        jobCode,
                        status: 'PENDING_APPROVAL', // Pending
                        sku: jobData.sku,
                        color: jobData.color,
                        size: jobData.size,
                        qty: jobData.qty,
                        recipientName: jobData.recipientName,
                        address1: jobData.address1,
                        address2: jobData.address2,
                        city: jobData.city,
                        state: jobData.state,
                        zip: jobData.zip,
                        country: jobData.country,
                        phone: jobData.phone,
                        designs: jobData.designs, // New JSON field
                        priceToCharge: jobData.priceToCharge,
                    }
                });

                // Tokens
                await tx.qrToken.create({
                    data: { jobId: newJob.id, type: 'FILE', token: generateToken() }
                });

                await tx.qrToken.create({
                    data: { jobId: newJob.id, type: 'STATUS', token: generateToken(), maxUses: 2 }
                });

                // Inventory Update
                const invSku = jobData.sku;
                const invColor = jobData.color || "";
                const invSize = jobData.size || "";

                await tx.inventoryItem.upsert({
                    where: {
                        sku_color_size: {
                            sku: invSku,
                            color: invColor,
                            size: invSize
                        }
                    },
                    update: { reserved: { increment: jobData.qty } },
                    create: {
                        sku: invSku,
                        color: invColor,
                        size: invSize,
                        reserved: jobData.qty,
                        onHand: 0
                    }
                });
            }

            return { orderCode, totalJobs: jobsToCreate.length };
        });

        return NextResponse.json({
            success: true,
            message: `Successfully imported ${result.totalJobs} jobs. Order ${result.orderCode} sent for Approval.`,
            orderCode: result.orderCode
        });

    } catch (error: any) {
        console.error("Import Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to process import' }, { status: 500 });
    }
}
