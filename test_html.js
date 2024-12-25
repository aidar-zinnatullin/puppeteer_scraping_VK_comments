import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import puppeteer from 'puppeteer';

const linkCSV = 'check_urls.csv'; // VK's URL to scrape are here

// Here, I set my VK email login as an environment variable. 
// in the terminal, after getting to the project folder: 
// export VK_USERNAME='my_email'
const VK_USERNAME = process.env.VK_USERNAME;


const HTML_FOLDER = 'collected_html'; // folder for collecting HTMLs
const leftoverJSON = 'leftovers.json';

if (!fs.existsSync(HTML_FOLDER)) {
  fs.mkdirSync(HTML_FOLDER, { recursive: true });
}

const browser = await puppeteer.launch({ headless: false });
const loginPage = await browser.newPage();
await loginPage.setViewport({ width: 1200, height: 800 });

console.log('Logging in to VK...');
await loginPage.goto('https://vk.com', { waitUntil: 'networkidle2' });

// only username is needed below because I cannot enter the password;
// the reason is because VK sends an SMS to complete verification
await loginPage.waitForSelector('#index_email', { timeout: 30000 });
await loginPage.type('#index_email', VK_USERNAME, { delay: 50 });
await loginPage.keyboard.press('Enter');

await loginPage
  .waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
  .catch(() => {
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

// encoding issues has been solved finally
  await new Promise((resolve, reject) => {
    fs.createReadStream(linkCSV, { encoding: 'utf8' })
      .pipe(csvParser())
      .on('data', (row) => {
        if (row.msg_link && row.msg_link.trim()) {
          links.push(row.msg_link.trim());
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // core function to extract the whole HTML source, thanks to Puppeteer
  async function getPageContent(page) {
    return page.evaluate(() => document.documentElement.outerHTML);
  }

  if (links.length === 0) {
    console.log('No links found in the CSV.');
    await browser.close();
    return;
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  
  for (const link of links) {
    try {
      console.log(`Navigating to: ${link}`);
      await page.goto(link, { waitUntil: 'networkidle2' });
      const sleep = ms => new Promise(res => setTimeout(res, ms)); // need to set the pause for three second (see, below)
      const pageHTML = await getPageContent(page);

      
      const sanitizedLink = link.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
      const htmlFilePath = path.join(HTML_FOLDER, `${sanitizedLink}.html`);

      fs.writeFileSync(htmlFilePath, pageHTML, 'utf8');
      console.log(`Saved HTML to: ${htmlFilePath}`);
      await sleep(3000); // three second pause is here

      
      results.push({ url: link, savedHTML: htmlFilePath });
    } catch (err) {
      console.error(`Error at ${link}: ${err.message}`);
    }
  }

  await page.close();
  await browser.close();

  
  fs.writeFileSync(leftoverJSON, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Comments have been saved to ${leftoverJSON}`);
})();
