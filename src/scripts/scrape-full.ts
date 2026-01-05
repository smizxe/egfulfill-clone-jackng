/* eslint-disable @typescript-eslint/no-explicit-any */
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

// --- Configuration ---
const EG_URL = 'https://egfulfill.com';
const LOGIN_URL = `${EG_URL}/auth/login`;
const CATALOG_URL = `${EG_URL}/catalog/product`;
const IMAGE_DIR = 'public/products';

// Credentials
const EMAIL = 'jennythuy412@gmail.com';
const PASS = 'Minhnguyen1!';

// --- Database Setup ---
const prisma = new PrismaClient();

// --- Helper: Download Image ---
async function downloadImage(url: string, filename: string): Promise<string> {
    const relativePath = `/products/${filename}`;
    const localDir = path.join(process.cwd(), IMAGE_DIR);
    const localPath = path.join(localDir, filename);

    if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
    }

    if (fs.existsSync(localPath)) {
        return relativePath; // Skip if exists
    }

    return new Promise((resolve) => {
        const file = fs.createWriteStream(localPath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(relativePath);
                });
            } else {
                file.close();
                fs.unlink(localPath, () => { });
                resolve('');
            }
        }).on('error', (err) => {
            console.error(`Failed to download ${url}: ${err.message}`);
            fs.unlink(localPath, () => { }); // Delete partial
            resolve('');
        });
    });
}

// --- Main Scraper ---
async function scrapeFull(): Promise<void> {
    console.log('🚀 Starting Full Scraper (Prisma Mode)...');

    // Launch Options
    const browser = await puppeteer.launch({
        headless: false, // Debug visible
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
        userDataDir: './tmp/puppeteer_data' // Persist session
    });
    const page = await browser.newPage();

    try {
        // --- 1. Login Logic ---
        console.log('🔑 Navigating to Login...');
        await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for potential auto-redirect or load
        await new Promise(r => setTimeout(r, 2000));

        // Check if already logged in
        if (page.url().includes('/catalog') || page.url().includes('/dashboard')) {
            console.log('   ✅ Already logged in (session persisted).');
        } else {
            console.log('   Attempting Login...');

            // Try explicit selectors
            const emailSelector = 'input[type="email"], input#email, input[name="email"]';
            const passSelector = 'input[type="password"], input#password, input[name="password"]';

            try {
                await page.waitForSelector(emailSelector, { timeout: 5000 });
                const emailInput = await page.$(emailSelector);
                const passInput = await page.$(passSelector);

                if (emailInput && passInput) {
                    await emailInput.type(EMAIL);
                    await passInput.type(PASS);

                    // Click Login
                    const btn = await page.$('button[type="submit"]') || await page.$('button');
                    if (btn) await btn.click();

                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => console.log('   Navigation wait timeout, continuing...'));
                } else {
                    console.log('   ⚠️ Login inputs not found. Please login manually if needed.');
                }
            } catch {
                console.log('   ⚠️ Login auto-fill failed. Please handle manually.');
            }
        }

        // Wait for Catalog
        console.log('   Waiting for Catalog Access...');
        while (!page.url().includes('/catalog')) {
            if (page.url().includes('/dashboard')) {
                await page.goto(CATALOG_URL, { waitUntil: 'domcontentloaded' });
                break;
            }
            await new Promise(r => setTimeout(r, 2000));
        }
        console.log('   ✅ Catalog Accessed!');

        // --- 2. Scraping Loop ---
        let currentPage = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            console.log(`📄 Scraping Page ${currentPage}...`);
            await page.goto(`${CATALOG_URL}?page=${currentPage}&size=20`, { waitUntil: 'networkidle2' });

            // Count Products
            try {
                await page.waitForSelector('.ant-card', { timeout: 10000 });
            } catch {
                console.log('   No cards found. Assuming end of list.');
                break;
            }

            const productCount = await page.evaluate(() => document.querySelectorAll('.ant-card').length);
            console.log(`   Found ${productCount} products.`);

            if (productCount === 0) break;

            // Iterate Products
            for (let i = 0; i < productCount; i++) {
                // Return to list if drifted
                if (!page.url().includes(`page=${currentPage}`)) {
                    await page.goto(`${CATALOG_URL}?page=${currentPage}&size=20`, { waitUntil: 'networkidle2' });
                    await page.waitForSelector('.ant-card');
                }

                console.log(`   👉 Product ${i + 1}/${productCount}...`);
                const cards = await page.$$('.ant-card');
                const card = cards[i];
                if (!card) continue;

                // Click to Detail
                const clickTarget = await card.$('img') || card;

                try {
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
                        clickTarget.click()
                    ]);
                } catch {
                    console.log('   Navigation timeout to detail, might be SPA');
                }

                // Wait for Detail content
                try {
                    await page.waitForSelector('h1', { timeout: 10000 });
                } catch {
                    console.log('   Detail load failed. Skipping.');
                    continue;
                }

                // Extract Detail Data
                const data = await page.evaluate(() => {
                    const title = document.querySelector('h1')?.innerText || document.querySelector('.ant-typography h5')?.innerText || 'Unknown';
                    const description = document.querySelector('.ant-typography p')?.innerText || '';

                    // Price
                    const bodyText = document.body.innerText;
                    const priceMatch = bodyText.match(/\$\s*([0-9.]+)/);
                    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

                    // Images
                    const imgs = Array.from(document.querySelectorAll('.react-responsive-carousel .slide img'));
                    const imageUrls = imgs.map(img => (img as HTMLImageElement).src).filter(Boolean);

                    // Variants (Colors/Sizes)
                    const colors = Array.from(document.querySelectorAll('.color-cricle')).map(el => el.getAttribute('title')).filter(Boolean) as string[];
                    const sizes = Array.from(document.querySelectorAll('.ant-radio-button-wrapper span')).map(el => el.textContent?.trim()).filter(t => t && t.length < 5) as string[];

                    return { title, description, price, imageUrls, colors, sizes };
                });

                // --- SAVE TO PRISMA ---
                const safeName = data.title.replace(/[^a-zA-Z0-9 ]/g, '').trim();
                const baseSku = safeName.replace(/\s+/g, '-').toUpperCase().substring(0, 15);
                const colors = data.colors.length > 0 ? data.colors : ['Default'];
                const sizes = data.sizes.length > 0 ? data.sizes : ['Default'];

                // Check Exist
                const existingProd = await prisma.product.findFirst({ where: { name: data.title } });
                let productId = existingProd?.id;
                let finalSku = existingProd?.sku;

                if (!existingProd) {
                    try {
                        const newSku = baseSku + '-' + Math.floor(Math.random() * 100);
                        const newProd = await prisma.product.create({
                            data: {
                                sku: newSku,
                                name: data.title,
                                isActive: true,
                            }
                        });
                        productId = newProd.id;
                        finalSku = newSku;
                        console.log(`      + Prod Created: ${data.title} (${finalSku})`);
                    } catch (err: any) {
                        console.error('Create error:', err.message);
                    }
                } else {
                    console.log(`      ~ Prod Exists: ${data.title}`);
                }

                if (productId && finalSku) {
                    for (const color of colors) {
                        for (const size of sizes) {
                            try {
                                const variantKey = { productId, color, size };
                                const existingVar = await prisma.productVariant.findUnique({
                                    where: { productId_color_size: variantKey }
                                });

                                if (!existingVar) {
                                    await prisma.productVariant.create({
                                        data: {
                                            productId, color, size,
                                            basePrice: data.price,
                                            cogsEstimate: data.price ? data.price * 0.7 : 0,
                                            isActive: true
                                        }
                                    });
                                    // Inventory
                                    await prisma.inventoryItem.create({
                                        data: {
                                            sku: finalSku,
                                            color, size,
                                            onHand: 100,
                                            reserved: 0
                                        }
                                    });
                                }
                            } catch {
                                // Ignore duplicate errors
                            }
                        }
                    }
                }
            }

            // Next Page
            console.log('   Checking next page...');
            const nextBtn = await page.$('.ant-pagination-next:not(.ant-pagination-disabled)');
            if (nextBtn) {
                await nextBtn.click();
                await new Promise(r => setTimeout(r, 3000));
                currentPage++;
            } else {
                hasNextPage = false;
                console.log('   End of Catalog.');
            }
        }

    } catch (e) {
        console.error('Fatal Error:', e);
    } finally {
        await browser.close();
        await prisma.$disconnect();
    }
}

scrapeFull();
