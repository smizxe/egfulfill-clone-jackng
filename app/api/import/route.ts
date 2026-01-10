import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

// Helper to generate secure random token
function generateToken() {
    return uuidv4().replace(/-/g, '') + Math.random().toString(36).substring(2, 8);
}

// Helper to normalize keys
const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/[\s_-]+/g, '');

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get('content-type') || '';

        // --- MODE 2: CREATE ORDERS (JSON) ---
        if (contentType.includes('application/json')) {
            const body = await request.json();
            const { orders } = body; // Array of validated order objects

            if (!orders || !Array.isArray(orders) || orders.length === 0) {
                return NextResponse.json({ error: 'No orders provided' }, { status: 400 });
            }

            // Authentication - Get logged-in user from cookies
            const cookieStore = await cookies();
            const userId = cookieStore.get('userId')?.value;
            if (!userId) {
                return NextResponse.json({ error: 'Not authenticated. Please login.' }, { status: 401 });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { seller: { include: { wallet: true } } }
            });

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 401 });
            }

            const { targetSellerId } = body;
            let sellerId = '';
            let sellerWallet = null;

            if (targetSellerId && user.role === 'ADMIN') {
                // Admin importing for a seller
                const targetSeller = await prisma.seller.findUnique({
                    where: { id: targetSellerId },
                    include: { wallet: true }
                });
                if (!targetSeller) {
                    return NextResponse.json({ error: 'Target seller not found' }, { status: 404 });
                }
                sellerId = targetSeller.id;
                sellerWallet = targetSeller.wallet;
            } else {
                // Seller importing for themselves
                if (!user.seller) {
                    return NextResponse.json({ error: 'Seller account not found' }, { status: 401 });
                }
                sellerId = user.seller.id;
                sellerWallet = user.seller.wallet;
            }

            // Execute Creation Transaction (NO WALLET DEDUCTION)
            const transactionResult = await prisma.$transaction(async (tx) => {
                const createdOrderCodes: string[] = [];

                for (const orderData of orders) {
                    // Create Order
                    // Ensure unique orderCode or generate one logic
                    // Use Order ID if provided, else generate
                    let finalOrderCode = '';
                    if (orderData.id && !String(orderData.id).startsWith('TEMP-')) {
                        finalOrderCode = `ORDER${orderData.id}-${uuidv4().substring(0, 6).toUpperCase()}`;
                    } else {
                        finalOrderCode = `ORDER${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
                    }

                    const newOrder = await tx.order.create({
                        data: {
                            orderCode: finalOrderCode,
                            sellerId,
                            status: 'PENDING_APPROVAL',
                            totalAmount: orderData.totalCost || 0,
                            trackingNumber: '',
                            shippingMethod: 'STANDARD',
                            shippingCountry: orderData.country,
                        }
                    });

                    createdOrderCodes.push(finalOrderCode);

                    // Create Jobs (Items)
                    for (const item of orderData.items) {
                        const jobCode = 'JOB' + uuidv4().substring(0, 8).toUpperCase();
                        const newJob = await tx.job.create({
                            data: {
                                orderId: newOrder.id,
                                sellerId,
                                jobCode,
                                status: 'PENDING_APPROVAL',
                                sku: item.sku,
                                color: item.color,
                                size: item.size,
                                qty: item.qty,
                                // Snapshot recipient info to job as well (as per schema usage)
                                recipientName: orderData.recipientName,
                                address1: orderData.address1,
                                address2: orderData.address2,
                                city: orderData.city,
                                state: orderData.state,
                                zip: orderData.zip,
                                country: orderData.country,
                                phone: orderData.phone,
                                designs: item.designs, // JSON string already
                                notes: item.notes,
                                priceToCharge: item.priceToCharge,
                            }
                        });

                        // QR Tokens
                        await tx.qrToken.create({
                            data: { jobId: newJob.id, type: 'FILE', token: generateToken() }
                        });
                        await tx.qrToken.create({
                            data: { jobId: newJob.id, type: 'STATUS', token: generateToken(), maxUses: 2 }
                        });

                        // Inventory Logic
                        await tx.inventoryItem.upsert({
                            where: { sku_color_size: { sku: item.sku, color: item.color || "", size: item.size || "" } },
                            update: { reserved: { increment: item.qty } },
                            create: { sku: item.sku, color: item.color || "", size: item.size || "", reserved: item.qty, onHand: 0 }
                        });
                    }
                }
                return { count: createdOrderCodes.length };
            }, {
                maxWait: 10000,
                timeout: 30000
            });

            return NextResponse.json({
                success: true,
                message: `Successfully created ${transactionResult.count} orders. Waiting for Admin Approval.`,
                importedCount: transactionResult.count
            });
        }


        // --- MODE 1: PARSE FILE (Multipart) ---
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

        const rawJson = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: "" });

        const rawData = rawJson.map((row: any) => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
                newRow[normalizeKey(key)] = row[key];
            });
            return newRow;
        });

        // Authentication - Get logged-in user from cookies
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated. Please login.' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { seller: { include: { wallet: true } } }
        });

        if (!user || !user.seller) return NextResponse.json({ error: 'Seller account not found' }, { status: 401 });

        const errors: string[] = [];
        const orderGroups = new Map<string, any[]>();
        const productsCache: Record<string, any> = {};

        // Grouping
        rawData.forEach((r: any, index: number) => {
            const rowIndex = index + 2;
            const row = { ...r, _rowIndex: rowIndex };
            let extOrderId = String(r['orderid'] || r['ordernumber'] || r['externalid'] || '').trim();

            if (extOrderId) {
                if (!orderGroups.has(extOrderId)) orderGroups.set(extOrderId, []);
                orderGroups.get(extOrderId)!.push(row);
            } else {
                const tempId = `TEMP-${uuidv4()}`;
                orderGroups.set(tempId, [row]);
            }
        });

        const parsedOrders: any[] = [];
        let totalBatchCost = 0;

        for (const [extOrderId, rows] of orderGroups) {
            const firstRow = rows[0];
            // Extract Headers
            const recipientName = String(firstRow['recipientname'] || firstRow['shippingname'] || '').trim();
            const address1 = String(firstRow['address1'] || '').trim();
            const city = String(firstRow['city'] || '').trim();
            const state = String(firstRow['state'] || firstRow['shippingprovince'] || '').trim();
            const zip = String(firstRow['zip'] || firstRow['shippingzip'] || '').trim();
            let country = String(firstRow['country'] || firstRow['shippingcountry'] || '').trim();
            const phone = String(firstRow['phone'] || firstRow['shippingphone'] || '').trim();
            const address2 = String(firstRow['address2'] || '').trim();

            // Address Consolidation Logic
            let finalAddress1 = address1;
            let finalCity = city;
            let finalState = state;
            let finalZip = zip;
            let finalCountry = country;

            if (!finalAddress1) {
                // Try raw address
                const rawAddress = String(firstRow['shippingaddress'] || '').trim();
                if (rawAddress) {
                    const parts = rawAddress.split(',').map(p => p.trim());
                    if (parts.length >= 3) {
                        finalAddress1 = parts[0];
                        if (parts.length === 3) { finalCity = parts[1]; finalState = parts[2]; } // Addr, City, State? simplified
                        else if (parts.length >= 4) { finalCity = parts[1]; finalState = parts[2]; finalZip = parts[3]; }
                        if (parts.length >= 5) finalCountry = parts[4];
                    } else {
                        finalAddress1 = rawAddress;
                    }
                }
            }
            if (!finalCountry) finalCountry = 'US';


            const orderItems = [];
            let orderCost = 0;
            let orderValid = true;
            const orderErrors: string[] = [];

            // Required Fields Check
            if (!recipientName) orderErrors.push('Missing Recipient Name');
            if (!finalAddress1) orderErrors.push('Missing Address 1');
            if (!finalCity) orderErrors.push('Missing City');
            if (!finalState) orderErrors.push('Missing State');
            if (!finalZip) orderErrors.push('Missing Zip');
            if (!finalCountry) orderErrors.push('Missing Country');

            for (const row of rows) {
                const sku = String(row['sku'] || row['productsku'] || '').trim();
                const color = String(row['color'] || '').trim();
                const size = String(row['size'] || '').trim();
                const qty = parseInt(String(row['qty'] || row['quantity'] || '0').trim());
                const rowIndex = row._rowIndex;

                if (!sku) { orderErrors.push(`Row ${rowIndex}: Missing SKU`); continue; }
                if (qty <= 0) { orderErrors.push(`Row ${rowIndex}: Qty invalid`); continue; }

                // Retrieve Product
                let product = productsCache[sku];
                if (!product) {
                    product = await prisma.product.findUnique({ where: { sku }, include: { variants: true } });
                    if (product) productsCache[sku] = product;
                }

                if (!product) {
                    orderErrors.push(`Row ${rowIndex}: SKU ${sku} not found`);
                    continue;
                }

                // Variant Pricing - Product doesn't have basePrice, only variants do
                const variant = product.variants.find((v: any) =>
                    (v.color?.toLowerCase() === color.toLowerCase() || (!v.color && !color)) &&
                    (v.size?.toLowerCase() === size.toLowerCase() || (!v.size && !size))
                );

                if (!variant) {
                    orderErrors.push(`Row ${rowIndex}: Variant ${color}/${size} not found for SKU ${sku}`);
                    continue;
                }

                const priceToCharge = variant.basePrice || 0;

                // Inventory Check
                // We need to check if the specific variant is in stock.
                // Inventory is stored in InventoryItem model.
                const invKey = `${sku}-${color}-${size}`;
                // We can't easily cache everything without fetching all, so we'll do best-effort caching or per-item fetch.
                // Given existing structure fetches product per SKU, we can fetch inventory per SKU/Variant too.

                // Note: To optimize, we could fetch all inventory for the SKU at once when product is loaded, 
                // but InventoryItem is loose. Let's do a direct find for now as robust check.
                // Or better, fetch logic:

                let stockLevel = 0;
                // Try to limit DB calls: only fetch if not in a "inventoryCache" (which we need to define scope for)
                // But simplified: Just await prisma.inventoryItem

                // Inventory Check - Fetch all items for SKU to allow case-insensitive matching
                // Logic: SKU must be exact (usually), but Color/Size can be case-mismatched or null vs ""
                const inventoryItems = await prisma.inventoryItem.findMany({
                    where: { sku }
                });

                const inventoryItem = inventoryItems.find(inv => {
                    const dbColor = (inv.color || '').toLowerCase();
                    const reqColor = (color || '').toLowerCase();
                    const dbSize = (inv.size || '').toLowerCase();
                    const reqSize = (size || '').toLowerCase();
                    return dbColor === reqColor && dbSize === reqSize;
                });

                if (!inventoryItem || inventoryItem.onHand < qty) {
                    orderErrors.push(`Row ${rowIndex}: Out of Stock (Requested: ${qty}, Available: ${inventoryItem?.onHand || 0})`);
                } else {
                    stockLevel = inventoryItem.onHand;
                }

                // Calculate Shipping Rate based on quantity
                let shippingCost = 0;
                if (product.shippingRates) {
                    try {
                        const shippingRates = JSON.parse(product.shippingRates);
                        if (Array.isArray(shippingRates) && shippingRates.length > 0) {
                            // Find the matching rate tier (rates should be sorted by minQty descending)
                            const sortedRates = shippingRates.sort((a: any, b: any) => (b.minQty || 0) - (a.minQty || 0));
                            for (const tier of sortedRates) {
                                const tierMinQty = Number(tier.minQty) || 0;
                                const tierRate = Number(tier.rate) || 0;
                                if (qty >= tierMinQty && tierRate > 0) {
                                    shippingCost = tierRate * qty;
                                    break;
                                }
                            }
                            // If no tier matched, use first tier (lowest qty threshold)
                            if (shippingCost === 0) {
                                const fallbackRate = Number(shippingRates[shippingRates.length - 1]?.rate) || 0;
                                shippingCost = fallbackRate * qty;
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to parse shippingRates for SKU ${sku}:`, e);
                        shippingCost = 0;
                    }
                }

                // Calculate Extra Fees (add all applicable fees)
                let extraFeesTotal = 0;
                if (product.extraFees) {
                    try {
                        const extraFees = JSON.parse(product.extraFees);
                        for (const fee of extraFees) {
                            // Fee can be per-unit or flat
                            if (fee.type === 'per_unit') {
                                extraFeesTotal += fee.surcharge * qty;
                            } else {
                                // Flat fee per line item
                                extraFeesTotal += fee.surcharge;
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to parse extraFees for SKU ${sku}`);
                    }
                }

                // Total line cost = (base price * qty) + shipping + extra fees
                // Ensure all values are valid numbers to prevent NaN
                const safePriceToCharge = Number(priceToCharge) || 0;
                const safeShippingCost = Number.isFinite(shippingCost) ? shippingCost : 0;
                const safeExtraFees = Number.isFinite(extraFeesTotal) ? extraFeesTotal : 0;
                const lineCost = (safePriceToCharge * qty) + safeShippingCost + safeExtraFees;

                console.log(`PRICING DEBUG - SKU: ${sku}, Color: ${color}, Size: ${size}, Qty: ${qty}`);
                console.log(`  Variant found: ${!!variant}, BasePrice: ${variant?.basePrice}, priceToCharge: ${priceToCharge}`);
                console.log(`  Shipping: ${shippingCost}, ExtraFees: ${extraFeesTotal}, LineCost: ${lineCost}`);

                // Designs
                const designs = [];
                // Legacy
                const legacyLink = String(row['embroideryfilelink'] || row['designlink'] || '').trim();
                if (legacyLink) designs.push({ url: legacyLink, location: 'Legacy/Front' });

                // Indexed
                for (let i = 1; i <= 4; i++) {
                    const url = String(row[`design${i}`] || row[`design${i}link`] || row[`embroidery${i}`] || '').trim();
                    const loc = String(row[`position${i}`] || row[`position ${i}`] || row[`design${i}location`] || row[`location${i}`] || '').trim();
                    const mockup = String(row[`mockup${i}`] || row[`mockuplink${i}`] || row[`mockup`] || row[`mockuplink`] || '').trim();
                    const type = String(row[`type${i}`] || row[`type`] || '').trim();

                    if (url && !designs.find((d: any) => d.url === url)) {
                        if (i === 1 && !loc) {
                            // Strict: If URL exists, Position is required for Position 1 (Actually for all if new schema implies, but user said P1/D1 required)
                            // User said: Position 1 required.
                            if (i === 1) orderErrors.push(`Row ${rowIndex}: Position 1 required`);
                        }
                        designs.push({ url, location: loc || undefined, mockup, type });
                    } else if (i === 1 && !url && !legacyLink) {
                        // Strict: Design 1 Required
                        orderErrors.push(`Row ${rowIndex}: Design 1 is required`);
                    }
                }

                orderItems.push({
                    sku,
                    color: inventoryItem ? (inventoryItem.color || '') : color,
                    size: inventoryItem ? (inventoryItem.size || '') : size,
                    qty,
                    designs: JSON.stringify(designs),
                    notes: String(row['notes'] || '').trim(),
                    priceToCharge,
                    shippingCost,
                    extraFeesTotal,
                    lineCost
                });

                orderCost += lineCost;
            }

            if (orderErrors.length > 0) orderValid = false;

            parsedOrders.push({
                id: extOrderId.startsWith('TEMP-') ? null : extOrderId,
                tempId: extOrderId, // ID to track in frontend
                recipientName, address1: finalAddress1, address2, city: finalCity, state: finalState, zip: finalZip, country: finalCountry, phone,
                items: orderItems,
                totalCost: orderCost,
                valid: orderValid,
                errors: orderErrors
            });

            if (orderValid) totalBatchCost += orderCost;
        }

        // Return Analysis (Dry Run Mode always for File Upload now)
        return NextResponse.json({
            success: true,
            dryRun: true,
            parsedOrders, // Frontend will iterate this to show checkable list
            totalEstimatedCost: totalBatchCost,
            balanceSufficient: (user.seller.wallet?.balance || 0) >= totalBatchCost,
            walletBalance: user.seller.wallet?.balance || 0
        });

    } catch (error: any) {
        console.error("Import Error:", error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
