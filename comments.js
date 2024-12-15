const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');


const linkCSV = 'check_urls.csv';
const leftoverJSON = 'leftovers.json';

const VK_USERNAME = process.env.VK_USERNAME;
const VK_PASSWORD = process.env.VK_PASSWORD;
if (!VK_USERNAME || !VK_PASSWORD) {
    console.error("Set VK_USERNAME and VK_PASSWORD as environment variables");
    process.exit(1);
  }
