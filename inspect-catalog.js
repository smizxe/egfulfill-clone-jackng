const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log('Navigating to login...');
        await page.goto('https://egfulfill.com/auth/login', { waitUntil: 'networkidle2' });

        await page.type('input[type="email"]', 'jennythuy412@gmail.com');
        await page.type('input[type="password"]', 'Minhnguyen1!');

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"]')
        ]);

        console.log('Logged in. Navigating to catalog...');
        await page.goto('https://egfulfill.com/catalog/product', { waitUntil: 'networkidle2' });

        // Wait for some content to load
        await page.waitForSelector('.ant-card', { timeout: 10000 }).catch(() => console.log('No .ant-card found, dumping body...'));

        // Capture HTML
        const html = await page.content();
        fs.writeFileSync('catalog_dump.html', html);
        console.log('Dumped catalog HTML to catalog_dump.html');

        // Take a screenshot too
        await page.screenshot({ path: 'catalog_screenshot.png' });
        console.log('Screenshot saved to catalog_screenshot.png');

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
