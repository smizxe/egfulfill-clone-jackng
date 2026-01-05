const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
    });
    const page = await browser.newPage();
    try {
        console.log('Goto Login...');
        await page.goto('https://egfulfill.com/auth/login', { waitUntil: 'networkidle2' });

        await page.screenshot({ path: 'debug_login_page.png' });
        console.log('Saved debug_login_page.png');

        const content = await page.content();
        console.log('Login Page Content Length:', content.length);
        if (content.length < 5000) console.log(content); // Print if small

        // Try to find inputs
        const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input')).map(i => ({
                id: i.id,
                name: i.name,
                type: i.type,
                placeholder: i.placeholder
            }));
        });
        console.log('Inputs found:', inputs);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
