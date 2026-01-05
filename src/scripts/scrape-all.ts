import dotenv from 'dotenv';
dotenv.config();

import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const EMAIL = 'jennythuy412@gmail.com';
const PASSWORD = 'Minhnguyen1!';

async function saveWithLoop(products: any[]) {
    for (const p of products) {
        console.log(`   Processing: ${p.title}`);
        const baseSku = p.title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10);

        const exists = await prisma.product.findFirst({ where: { name: p.title } });

        if (!exists) {
            const finalSku = baseSku + '-' + Math.floor(Math.random() * 9999);
            try {
                await prisma.product.create({
                    data: {
                        sku: finalSku,
                        name: p.title,
                        isActive: true,
                        variants: {
                            create: {
                                color: 'Default',
                                size: 'Default',
                                basePrice: p.price,
                                cogsEstimate: p.price * 0.7
                            }
                        }
                    }
                });

                await prisma.inventoryItem.create({
                    data: {
                        sku: finalSku,
                        color: 'Default',
                        size: 'Default',
                        onHand: 100,
                        reserved: 0
                    }
                });
                console.log(`   + Created DB Entry: ${p.title} ($${p.price})`);
            } catch (e: any) {
                console.error(`     Failed DB Save ${p.title}:`, e.message);
            }
        } else {
            console.log(`   ~ Exists in DB: ${p.title}`);
        }
    }
}

async function scrapeCatalog() {
    console.log('🚀 Starting Scraper...');

    // Launch Options
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
    });
    const page = await browser.newPage();

    try {
        // --- LOGIN ---
        console.log('1️⃣ Logging in...');
        await page.goto('https://egfulfill.com/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Email
        const emailSelectors = ['input#email', 'input[name="email"]', 'input[type="email"]', '#basic_email', 'input.ant-input'];
        let emailFound = false;
        for (const sel of emailSelectors) {
            const el = await page.$(sel);
            if (el) {
                console.log(`   Found email input: ${sel}`);
                await el.type(EMAIL);
                emailFound = true;
                break;
            }
        }

        // Password
        const pwdSelectors = ['input#password', 'input[name="password"]', 'input[type="password"]', '#basic_password'];
        for (const sel of pwdSelectors) {
            if (await page.$(sel)) {
                await page.type(sel, PASSWORD);
                break;
            }
        }

        // Submit with loose wait
        console.log('   Clicking submit and waiting...');
        try {
            await page.click('button[type="submit"]');
            await new Promise(r => setTimeout(r, 5000)); // Fixed wait 5s
        } catch (e) { console.error('   Click failed', e); }

        console.log('✅ Login Step Attempted. URL:', page.url());

        // --- CATALOG ---
        console.log('2️⃣ Navigating to Catalog...');
        await page.goto('https://egfulfill.com/catalog/product', { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('   Catalog URL reached:', page.url());

        // Wait for Ant Cards
        try {
            await page.waitForSelector('.ant-card', { timeout: 15000 });
        } catch (e) {
            console.warn('⚠️ Warning: No .ant-card found initially.');
            await page.screenshot({ path: 'catalog_empty.png' });
        }

        let hasNext = true;
        let pageNum = 1;

        while (hasNext) {
            console.log(`📄 Scrapping Page ${pageNum}...`);

            // Extract Data
            const products = await page.evaluate(() => {
                const results: any[] = [];
                const cards = document.querySelectorAll('.ant-card');

                cards.forEach(card => {
                    const img = card.querySelector('img')?.src || '';
                    const body = card.querySelector('.ant-card-body');
                    if (body) {
                        const title = body.querySelector('.ant-card-meta-title')?.textContent?.trim() ||
                            body.innerText.split('\n')[0];

                        const text = body.innerText || '';
                        const priceMatch = text.match(/\$\s*([0-9,.]+)/);
                        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

                        if (title && title.length > 2) {
                            results.push({ title, price, img });
                        }
                    }
                });
                return results;
            });

            console.log(`   Found ${products.length} products.`);

            if (products.length === 0) {
                console.log('   No products found. Stopping.');
                break;
            }

            // Save
            await saveWithLoop(products);

            // Next Page
            console.log('   Checking next page...');
            const clicked = await page.evaluate((nextPageNum) => {
                const items = Array.from(document.querySelectorAll('.ant-pagination-item'));
                const found = items.find(item => item.getAttribute('title') === String(nextPageNum));
                if (found) { (found as HTMLElement).click(); return true; }
                return false;
            }, pageNum + 1);

            if (clicked) {
                console.log('   Click Next...');
                await new Promise(r => setTimeout(r, 4000));
                pageNum++;
            } else {
                console.log('   No next page link found.');
                hasNext = false;
            }
        }

        console.log('🏁 Scraping Finished.');

    } catch (err: any) {
        console.error('❌ Error:', err.message);
        await page.screenshot({ path: 'fatal_error.png' });
    } finally {
        await browser.close();
        await prisma.$disconnect();
    }
}

scrapeCatalog();
