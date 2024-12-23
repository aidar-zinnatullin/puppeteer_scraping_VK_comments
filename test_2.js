import fs from 'fs';
import csvParser from 'csv-parser';
import puppeteer from 'puppeteer';

const linkCSV = 'check_urls.csv';
const leftoverJSON = 'leftovers.json';
const VK_USERNAME = process.env.VK_USERNAME;

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

const browser = await puppeteer.launch({ headless: false });
const loginPage = await browser.newPage();
await loginPage.setViewport({ width: 1200, height: 800 });

console.log('Logging in to VK...');
await loginPage.goto('https://vk.com', { waitUntil: 'networkidle2' });
await loginPage.waitForSelector('#index_email', { timeout: 30000 });
await loginPage.type('#index_email', VK_USERNAME, { delay: 50 });
await loginPage.keyboard.press('Enter'); // Adjusted to press Enter instead of explicitly clicking
await loginPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
    console.warn('Login navigation wait timed out; proceeding anyway if logged in.');
});

try {
    await loginPage.waitForSelector('#top_profile_link', { timeout: 15000 });
    console.log('Login successful.');
} catch (e) {
    console.error('Could not verify login. Check credentials or selectors.');
}

await loginPage.close();

(async () => {
    const links = [];
    const results = [];
    
    await new Promise((resolve, reject) => {
        fs.createReadStream(linkCSV)
            .pipe(csvParser())
            .on('data', (row) => {
                if (row.msg_link && row.msg_link.trim()) {
                    links.push(row.msg_link.trim());
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    for (const link of links) {
        try {
            console.log(`Navigating to: ${link}`);
            await page.goto(link, { waitUntil: 'domcontentloaded' });
            await autoScroll(page);
            console.log('Waiting 3 seconds after scrolling...');
            await page.waitForTimeout(10000);

            const moreButtons = await page.$$('.wall_reply_more_redesign_2024');
            for (const btn of moreButtons) {
                console.log('Clicking "Show more" link...');
                await btn.click();
                await page.waitForTimeout(10000);
            }

            const data = await page.evaluate(() => {
                // Query selectors must be adjusted based on actual HTML structure
                const replies = Array.from(document.querySelectorAll('.wall_reply_text')).map((el) => el.innerText.trim());
                return { comments: replies };
            });

            data.url = link;
            results.push(data);

        } catch (err) {
            console.error(`Error processing ${link}: ${err.message}`);
        }
    }

    await browser.close();
    fs.writeFileSync(leftoverJSON, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Data has been saved to ${leftoverJSON}`);
})();
