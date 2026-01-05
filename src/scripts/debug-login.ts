
import puppeteer from 'puppeteer';
import fs from 'fs';

const LOGIN_URL = 'https://egfulfill.com/auth/login';
const CATALOG_URL = 'https://egfulfill.com/catalog/product';

async function debugScraper() {
    console.log('🐞 Starting Debug Scraper...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();

    try {
        console.log('👉 Going to Login Page...');
        await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

        console.log('⏱️ Waiting 30s for you to look at the screen or login manually...');
        await new Promise(r => setTimeout(r, 30000));

        console.log('👉 Navigating to Catalog...');
        await page.goto(CATALOG_URL, { waitUntil: 'domcontentloaded' });

        console.log('⏱️ Waiting 5s...');
        await new Promise(r => setTimeout(r, 5000));

        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => a.href);
        });

        console.log(`🔗 Found ${links.length} total links.`);
        const productLinks = links.filter(l => l.includes('/detail-product/'));
        console.log(`📦 Found ${productLinks.length} product links.`);

        if (productLinks.length === 0) {
            console.log('❌ Still no products. Dumping HTML body length...');
            const html = await page.content();
            console.log(`📄 HTML Length: ${html.length}`);
            fs.writeFileSync('debug_html.html', html);
            console.log('Saved debug_html.html');
        }

    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        console.log('🔒 Closing browser in 10s...');
        await new Promise(r => setTimeout(r, 10000));
        await browser.close();
    }
}

debugScraper();
