## Puppeteer-based scraping of VK comments

#### **What is the use case, and why does it matter?**

VK's API does not allow access to comments from sub-threads. It can significantly distort the analysis of the discussion's content and dynamics with reliance on this official method. Therefore, I decided to collect comments using web scraping. The initial option based on Selenium, i.e., through simulating the behavior of a platform user, seemed too cumbersome. As an alternative, I implemented the strategy of (1) downloading the HTML pages (in the script `test _html.js`, they are presented through a reference to a CSV file) and (2) then going through them using the `rvest` package in R.

Thanks to Puppeteer, I could get the whole HTML source of the required pages.

---

#### **What is Puppeteer?**

Puppeteer is a JavaScript library that enables developers to:
- control Chrome or Chromium browsers programmatically;
- perform tasks such as rendering web pages, filling out forms, clicking buttons, taking screenshots, etc.

Puppeteer can be useful for scraping dynamic websites that use JavaScript to load content if you do not want to spend time with Selenium.

---

##### **Installation of Puppeteer**

Start by installing Puppeteer:
```bash
npm install puppeteer
```
More details about the library are here, [Puppeteer Documentation](https://pptr.dev/).

##### **Few comments / suggestions about VK**

1. VK may block repeated requests, therefore, it makes sense to implement delays using `page.waitForTimeout()`, which I did not do in the script for downloading HTML-pages.

   ```javascript
   await page.waitForTimeout(2000); // Wait for 2 seconds
   ```

2. I did not use proxies, but it is not a smart decision. To avoid IP bans, you can re-route requests through proxies:
   ```javascript
   const browser = await puppeteer.launch({
     args: ['--proxy-server=PROXY_URL'] // here is your proxy server info
   });
   ```

---

#### **Additional Resources**

- [VK API Documentation](https://dev.vk.com/en)
- [Node.js Official Site](https://nodejs.org/) 
