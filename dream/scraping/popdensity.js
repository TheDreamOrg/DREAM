const playwright = require("playwright");

async function GetPopDensity(zipcode) {
    if (!zipcode) {
        return
    }
    let browser = null;
    try {
        browser = await playwright.chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();
        const timeout = 1000000;
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Operation timed out")), timeout)
        );

        const typeText = async (selector, text, delay = 100) => {
            for (const letter of text) {
                await page.type(selector, letter);
                await page.waitForTimeout(delay);
            }
        };

        await page.goto("https://www.mapszipcode.com/");
        await page.waitForSelector('button[id="btnSearch"]', { state: 'visible' });
        await page.waitForTimeout(1500);

        await page.evaluate(() => {
            window.scrollBy(0, 500);
        });

        await typeText('input[name="searchText"]', zipcode, 100);
        await page.click('button[id="btnSearch"]');
        await page.waitForURL(`**/${zipcode}/`);

        const density = await page.$eval('#overview li:nth-child(2) .dat', el => el.textContent.trim());
        const densityValue = density.replace(/[\t\/]/g, '').trim().split(' ')[0].replace(/,/g, '');

        const densityFloat = parseFloat(densityValue);
        return densityFloat;

    } catch (error) {
        console.error("Error during scraping:", error);
        return -1;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { GetPopDensity };