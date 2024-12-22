const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');
const linkCSV = 'check_urls.csv';

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


 

(async () => {
        const links = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(linkCSV)
            .pipe(csv())
            .on('data', (row) => {
              if (row.msg_link && row.msg_link.trim()) {
                links.push(row.msg_link.trim());
              }
            })
            .on('end', resolve)
            .on('error', reject);
        });
     
    const browser = await puppeteer.launch( {headless: false});
    const page = await browser.newPage();

    for (const link of links) {
        try {
            console.log(`Navigating to: ${link}`);
            await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
            await autoScroll(page);
        } catch (err) {
            console.error(`Error processing ${link}: ${err.message}`);
        }
    }

    await browser.close();
})();
